/**
 * CEDL Parser
 * Parses YAML-based CEDM Enterprise Definition Language
 */

import * as YAML from 'yaml';
import {
  CEDLModel,
  ParseResult,
  ParserOptions,
  Diagnostic,
  ValidationContext,
  Entity,
  Enum,
  Role,
  Relationship,
  Location,
} from './types';

export class CEDLParser {
  private options: ParserOptions;

  constructor(options: ParserOptions = {}) {
    this.options = {
      strict: true,
      checkSemantics: true,
      checkPerformance: true,
      maxEntityCount: 500,
      maxAttributeCount: 10000,
      ...options,
    };
  }

  /**
   * Parse YAML content into CEDLModel
   */
  async parse(yamlContent: string, uri: string = 'unknown'): Promise<ParseResult> {
    const startTime = performance.now();
    const diagnostics: Diagnostic[] = [];

    try {
      // Step 1: Parse YAML structure
      let doc: unknown;
      try {
        doc = YAML.parse(yamlContent);
      } catch (error) {
        diagnostics.push({
          code: 'CEDL005',
          severity: 'error',
          message: `Invalid YAML syntax: ${error instanceof Error ? error.message : 'Unknown error'}`,
          location: this.getErrorLocation(yamlContent, error),
        });
        return { diagnostics, success: false, parseTime: performance.now() - startTime };
      }

      // Step 2: Validate against JSON Schema
      const schemaValid = this.validateSchema(doc);
      diagnostics.push(...schemaValid.diagnostics);

      if (!schemaValid.valid) {
        return { diagnostics, success: false, parseTime: performance.now() - startTime };
      }

      // Step 3: Parse into typed model
      const model = this.constructModel(doc as Record<string, unknown>);
      diagnostics.push(...model.diagnostics);

      if (!model.model) {
        return { diagnostics, success: false, parseTime: performance.now() - startTime };
      }

      // Step 4: Semantic validation
      if (this.options.checkSemantics) {
        const semanticDiags = await this.validateSemantics(model.model);
        diagnostics.push(...semanticDiags);

        // Don't fail on semantic warnings, but do on errors
        const hasErrors = semanticDiags.some((d) => d.severity === 'error');
        if (hasErrors && this.options.strict) {
          return { diagnostics, success: false, parseTime: performance.now() - startTime };
        }
      }

      // Step 5: Performance checks
      if (this.options.checkPerformance) {
        const perfDiags = this.validatePerformance(model.model);
        diagnostics.push(...perfDiags);
      }

      model.model.diagnostics = diagnostics;

      return {
        model: model.model,
        diagnostics,
        success: true,
        parseTime: performance.now() - startTime,
      };
    } catch (error) {
      diagnostics.push({
        code: 'CEDL099',
        severity: 'error',
        message: `Parser error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        location: { path: [], line: 0, column: 0, source: uri },
      });

      return { diagnostics, success: false, parseTime: performance.now() - startTime };
    }
  }

  /**
   * Validate document against JSON Schema
   */
  private validateSchema(doc: unknown): {
    valid: boolean;
    diagnostics: Diagnostic[];
  } {
    const diagnostics: Diagnostic[] = [];

    // Basic structure checks
    if (!doc || typeof doc !== 'object') {
      diagnostics.push({
        code: 'CEDL005',
        severity: 'error',
        message: 'CEDL document must be an object',
        location: { path: [], line: 0, column: 0 },
      });
      return { valid: false, diagnostics };
    }

    const obj = doc as Record<string, unknown>;

    // Check required fields
    if (!obj.version) {
      diagnostics.push({
        code: 'CEDL004',
        severity: 'error',
        message: 'Required field missing: version',
        location: { path: ['version'], line: 0, column: 0 },
      });
    }

    if (!obj.metadata) {
      diagnostics.push({
        code: 'CEDL004',
        severity: 'error',
        message: 'Required field missing: metadata',
        location: { path: ['metadata'], line: 0, column: 0 },
      });
    }

    if (!obj.domain) {
      diagnostics.push({
        code: 'CEDL004',
        severity: 'error',
        message: 'Required field missing: domain',
        location: { path: ['domain'], line: 0, column: 0 },
      });
    }

    if (diagnostics.length > 0) {
      return { valid: false, diagnostics };
    }

    // Check field types
    if (typeof obj.version !== 'string') {
      diagnostics.push({
        code: 'CEDL005',
        severity: 'error',
        message: 'Field version must be a string',
        location: { path: ['version'], line: 0, column: 0 },
      });
    }

    if (typeof obj.metadata !== 'object') {
      diagnostics.push({
        code: 'CEDL005',
        severity: 'error',
        message: 'Field metadata must be an object',
        location: { path: ['metadata'], line: 0, column: 0 },
      });
    }

    if (typeof obj.domain !== 'object') {
      diagnostics.push({
        code: 'CEDL005',
        severity: 'error',
        message: 'Field domain must be an object',
        location: { path: ['domain'], line: 0, column: 0 },
      });
    }

    return { valid: diagnostics.length === 0, diagnostics };
  }

  /**
   * Construct typed model from raw object
   */
  private constructModel(obj: Record<string, unknown>): {
    model?: CEDLModel;
    diagnostics: Diagnostic[];
  } {
    const diagnostics: Diagnostic[] = [];

    try {
      const model: CEDLModel = {
        version: String(obj.version || '1.0'),
        metadata: this.parseMetadata(obj.metadata),
        domain: this.parseDomain(obj.domain),
        relationships: this.parseRelationships(obj.relationships),
        rules: this.parseRules(obj.rules),
        workflows: this.parseWorkflows(obj.workflows),
        rbac: this.parseRBAC(obj.rbac),
        hooks: this.parseHooks(obj.hooks),
        reports: this.parseReports(obj.reports),
        system: obj.system as any,
        diagnostics: [],
      };

      return { model, diagnostics };
    } catch (error) {
      diagnostics.push({
        code: 'CEDL099',
        severity: 'error',
        message: `Failed to construct model: ${error instanceof Error ? error.message : 'Unknown error'}`,
        location: { path: [], line: 0, column: 0 },
      });
      return { diagnostics };
    }
  }

  private parseMetadata(meta: unknown) {
    if (!meta || typeof meta !== 'object') {
      return { name: 'unknown' };
    }
    const m = meta as Record<string, unknown>;
    return {
      name: String(m.name || 'unknown'),
      description: m.description ? String(m.description) : undefined,
      version: m.version ? String(m.version) : undefined,
      timestamp: m.timestamp ? String(m.timestamp) : undefined,
      author: m.author ? String(m.author) : undefined,
      tags: Array.isArray(m.tags) ? m.tags.map(String) : undefined,
    };
  }

  private parseDomain(domain: unknown) {
    if (!domain || typeof domain !== 'object') {
      return { entities: [] };
    }

    const d = domain as Record<string, unknown>;
    return {
      categories: Array.isArray(d.categories)
        ? d.categories.map((c: unknown) => this.parseCategory(c))
        : undefined,
      entities: Array.isArray(d.entities)
        ? d.entities.map((e: unknown) => this.parseEntity(e))
        : [],
      enums: Array.isArray(d.enums)
        ? d.enums.map((e: unknown) => this.parseEnum(e))
        : undefined,
    };
  }

  private parseCategory(cat: unknown) {
    const c = (cat || {}) as Record<string, unknown>;
    return {
      id: String(c.id || ''),
      name: String(c.name || ''),
      description: c.description ? String(c.description) : undefined,
      icon: c.icon ? String(c.icon) : undefined,
      help: c.help ? String(c.help) : undefined,
      order: c.order ? Number(c.order) : undefined,
    };
  }

  private parseEntity(entity: unknown) {
    const e = (entity || {}) as Record<string, unknown>;
    return {
      id: String(e.id || ''),
      name: String(e.name || ''),
      displayName: e.displayName ? String(e.displayName) : undefined,
      description: e.description ? String(e.description) : undefined,
      category: e.category ? String(e.category) : undefined,
      help: e.help ? String(e.help) : undefined,
      isAuditEnabled: e.isAuditEnabled !== false,
      parent: e.parent ? String(e.parent) : undefined,
      tags: Array.isArray(e.tags) ? e.tags.map(String) : undefined,
      attributes: Array.isArray(e.attributes)
        ? e.attributes.map((a: unknown) => this.parseAttribute(a))
        : [],
    };
  }

  private parseAttribute(attr: unknown) {
    const a = (attr || {}) as Record<string, unknown>;
    return {
      id: String(a.id || ''),
      name: String(a.name || ''),
      type: String(a.type || 'string'),
      description: a.description ? String(a.description) : undefined,
      isRequired: a.isRequired === true,
      isUnique: a.isUnique === true,
      isIdentifier: a.isIdentifier === true,
      isEncrypted: a.isEncrypted === true,
      isReadonly: a.isReadonly === true,
      isIndexed: a.isIndexed === true,
      isForeignKey: a.isForeignKey === true,
      defaultValue: a.defaultValue,
      length: a.length ? Number(a.length) : undefined,
      precision: a.precision ? Number(a.precision) : undefined,
      scale: a.scale ? Number(a.scale) : undefined,
      enumRef: a.enumRef ? String(a.enumRef) : undefined,
      referenceEntity: a.referenceEntity ? String(a.referenceEntity) : undefined,
      help: a.help ? String(a.help) : undefined,
      order: a.order ? Number(a.order) : undefined,
    };
  }

  private parseEnum(en: unknown) {
    const e = (en || {}) as Record<string, unknown>;
    return {
      id: String(e.id || ''),
      name: String(e.name || ''),
      description: e.description ? String(e.description) : undefined,
      values: Array.isArray(e.values)
        ? e.values.map((v: unknown) => {
            const val = (v || {}) as Record<string, unknown>;
            return {
              value: String(val.value || ''),
              label: val.label ? String(val.label) : undefined,
              description: val.description ? String(val.description) : undefined,
              order: val.order ? Number(val.order) : undefined,
              isDefault: val.isDefault === true,
            };
          })
        : [],
    };
  }

  private parseRelationships(rels: unknown) {
    if (!Array.isArray(rels)) return undefined;
    return rels.map((r: unknown) => {
      const rel = (r || {}) as Record<string, unknown>;
      return {
        id: rel.id ? String(rel.id) : undefined,
        source: String(rel.source || ''),
        target: String(rel.target || ''),
        cardinality: String(rel.cardinality || 'one-to-many'),
        foreignKey: rel.foreignKey ? String(rel.foreignKey) : undefined,
        isRequired: rel.isRequired === true,
        description: rel.description ? String(rel.description) : undefined,
        help: rel.help ? String(rel.help) : undefined,
      };
    });
  }

  private parseRules(rules: unknown) {
    if (!Array.isArray(rules)) return undefined;
    return rules.map((r: unknown) => (r as any));
  }

  private parseWorkflows(workflows: unknown) {
    if (!Array.isArray(workflows)) return undefined;
    return workflows.map((w: unknown) => (w as any));
  }

  private parseRBAC(rbac: unknown) {
    if (!rbac || typeof rbac !== 'object') return undefined;
    return rbac as any;
  }

  private parseHooks(hooks: unknown) {
    if (!Array.isArray(hooks)) return undefined;
    return hooks.map((h: unknown) => (h as any));
  }

  private parseReports(reports: unknown) {
    if (!Array.isArray(reports)) return undefined;
    return reports.map((r: unknown) => (r as any));
  }

  /**
   * Validate semantic correctness
   */
  private async validateSemantics(model: CEDLModel): Promise<Diagnostic[]> {
    const diagnostics: Diagnostic[] = [];
    const context: ValidationContext = {
      model,
      entityMap: new Map(),
      enumMap: new Map(),
      roleMap: new Map(),
      relationshipMap: new Map(),
      diagnostics: [],
    };

    // Build lookup maps
    model.domain.entities.forEach((e) => context.entityMap.set(e.id, e));
    model.domain.enums?.forEach((e) => context.enumMap.set(e.id, e));
    model.rbac?.roles?.forEach((r) => context.roleMap.set(r.id, r));
    model.relationships?.forEach((r, i) => context.relationshipMap.set(r.id || `rel_${i}`, r));

    // Check entities
    this.validateEntities(model, context);

    // Check relationships
    this.validateRelationships(model, context);

    // Check rules
    this.validateRules(model, context);

    // Check workflows
    this.validateWorkflows(model, context);

    // Check RBAC
    this.validateRBAC(model, context);

    return context.diagnostics;
  }

  private validateEntities(model: CEDLModel, context: ValidationContext): void {
    const seenIds = new Set<string>();

    model.domain.entities.forEach((entity, entityIndex) => {
      const entityPath = ['domain', 'entities', entityIndex];

      // Check for duplicate IDs
      if (seenIds.has(entity.id)) {
        context.diagnostics.push({
          code: 'CEDL010',
          severity: 'error',
          message: `Duplicate entity ID: ${entity.id}`,
          location: { path: [...entityPath, 'id'], line: 0, column: 0 },
        });
      }
      seenIds.add(entity.id);

      // Check for required fields
      if (!entity.name) {
        context.diagnostics.push({
          code: 'CEDL004',
          severity: 'error',
          message: `Entity ${entity.id} is missing required field: name`,
          location: { path: [...entityPath, 'name'], line: 0, column: 0 },
        });
      }

      // Check attributes
      const attrIds = new Set<string>();
      entity.attributes.forEach((attr, attrIndex) => {
        const attrPath = [...entityPath, 'attributes', attrIndex];

        if (attrIds.has(attr.id)) {
          context.diagnostics.push({
            code: 'CEDL011',
            severity: 'error',
            message: `Duplicate attribute ID in ${entity.id}: ${attr.id}`,
            location: { path: [...attrPath, 'id'], line: 0, column: 0 },
          });
        }
        attrIds.add(attr.id);

        // Check enum references
        if (attr.enumRef && !context.enumMap.has(attr.enumRef)) {
          context.diagnostics.push({
            code: 'CEDL003',
            severity: 'error',
            message: `Referenced enum does not exist: ${attr.enumRef}`,
            location: { path: [...attrPath, 'enumRef'], line: 0, column: 0 },
          });
        }
      });
    });
  }

  private validateRelationships(model: CEDLModel, context: ValidationContext): void {
    model.relationships?.forEach((rel, index) => {
      const relPath = ['relationships', index];

      if (!context.entityMap.has(rel.source)) {
        context.diagnostics.push({
          code: 'CEDL030',
          severity: 'error',
          message: `Relationship references non-existent source entity: ${rel.source}`,
          location: { path: [...relPath, 'source'], line: 0, column: 0 },
        });
      }

      if (!context.entityMap.has(rel.target)) {
        context.diagnostics.push({
          code: 'CEDL030',
          severity: 'error',
          message: `Relationship references non-existent target entity: ${rel.target}`,
          location: { path: [...relPath, 'target'], line: 0, column: 0 },
        });
      }
    });
  }

  private validateRules(model: CEDLModel, context: ValidationContext): void {
    model.rules?.forEach((rule, index) => {
      const rulePath = ['rules', index];

      if (rule.entity && !context.entityMap.has(rule.entity)) {
        context.diagnostics.push({
          code: 'CEDL050',
          severity: 'error',
          message: `Rule references non-existent entity: ${rule.entity}`,
          location: { path: [...rulePath, 'entity'], line: 0, column: 0 },
        });
      }
    });
  }

  private validateWorkflows(model: CEDLModel, context: ValidationContext): void {
    model.workflows?.forEach((workflow, index) => {
      const wfPath = ['workflows', index];

      if (!context.entityMap.has(workflow.entity)) {
        context.diagnostics.push({
          code: 'CEDL080',
          severity: 'error',
          message: `Workflow references non-existent entity: ${workflow.entity}`,
          location: { path: [...wfPath, 'entity'], line: 0, column: 0 },
        });
      }

      const stateIds = new Set(workflow.states.map((s) => s.id));
      workflow.transitions.forEach((transition, tIndex) => {
        if (!stateIds.has(transition.from)) {
          context.diagnostics.push({
            code: 'CEDL084',
            severity: 'error',
            message: `Transition references undefined source state: ${transition.from}`,
            location: { path: [...wfPath, 'transitions', tIndex, 'from'], line: 0, column: 0 },
          });
        }
        if (!stateIds.has(transition.to)) {
          context.diagnostics.push({
            code: 'CEDL084',
            severity: 'error',
            message: `Transition references undefined target state: ${transition.to}`,
            location: { path: [...wfPath, 'transitions', tIndex, 'to'], line: 0, column: 0 },
          });
        }
      });
    });
  }

  private validateRBAC(model: CEDLModel, context: ValidationContext): void {
    model.rbac?.permissions?.forEach((perm, index) => {
      const permPath = ['rbac', 'permissions', index];

      if (!context.roleMap.has(perm.role)) {
        context.diagnostics.push({
          code: 'CEDL100',
          severity: 'error',
          message: `Permission references non-existent role: ${perm.role}`,
          location: { path: [...permPath, 'role'], line: 0, column: 0 },
        });
      }

      if (perm.entity && !context.entityMap.has(perm.entity)) {
        context.diagnostics.push({
          code: 'CEDL101',
          severity: 'error',
          message: `Permission references non-existent entity: ${perm.entity}`,
          location: { path: [...permPath, 'entity'], line: 0, column: 0 },
        });
      }
    });
  }

  /**
   * Validate performance characteristics
   */
  private validatePerformance(model: CEDLModel): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    if (model.domain.entities.length > (this.options.maxEntityCount || 500)) {
      diagnostics.push({
        code: 'CEDL140',
        severity: 'warning',
        message: `Model contains ${model.domain.entities.length} entities (recommended max: ${this.options.maxEntityCount})`,
        location: { path: ['domain', 'entities'], line: 0, column: 0 },
      });
    }

    let totalAttrs = 0;
    model.domain.entities.forEach((e) => {
      totalAttrs += e.attributes.length;
    });

    if (totalAttrs > (this.options.maxAttributeCount || 10000)) {
      diagnostics.push({
        code: 'CEDL141',
        severity: 'warning',
        message: `Model contains ${totalAttrs} attributes (recommended max: ${this.options.maxAttributeCount})`,
        location: { path: ['domain', 'entities'], line: 0, column: 0 },
      });
    }

    return diagnostics;
  }

  private getErrorLocation(yamlContent: string, error: unknown): Location {
    if (error instanceof Error && 'line' in error && 'column' in error) {
      return {
        path: [],
        line: (error as any).line || 0,
        column: (error as any).column || 0,
      };
    }
    return { path: [], line: 0, column: 0 };
  }
}
