/**
 * Automations — build multi-step workflows and business rules.
 *
 * One screen holds the automations, the rule tables they look up, and the help,
 * because a rule table is only ever reached from a step that uses it.
 *
 * The entity list is baked in at generation time from this app's own model, so
 * the pickers and the help examples name Party rather than a
 * stand-in the reader has to translate.
 *
 * Generated for: media
 */

import { createFileRoute } from '@tanstack/react-router';
import { apiClient } from '@/lib/api-client';
import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import { AutomationBuilder, type RuleTableSummary } from '@/components/automation/AutomationBuilder';
import { AutomationHelp } from '@/components/automation/AutomationHelp';
import { RailSection } from '@/components/automation/RailList';
import { RuleTableEditor } from '@/components/automation/RuleTableEditor';
import { type Automation, emptyAutomation, validateAutomation } from '@/lib/automation/model';
import {
  automationToYaml,
  readStoredAutomation,
  type StoredAutomationRow,
} from '@/lib/automation/yaml';
import { type DecisionTable, emptyDecisionTable } from '@/lib/workflow/bpmn-model';

export const Route = createFileRoute('/admin/automations')({
  component: AutomationsPage,
});

/** This app's entities and their fields, from the model it was generated from. */
const ENTITIES: string[] = [
  'Party',
  'Person',
  'Organization',
  'PartyRole',
  'PartyRelationship',
  'LegalEntity',
  'BusinessUnit',
  'Department',
  'Address',
  'ContactPoint',
  'Location',
  'Country',
  'Language',
  'Currency',
  'ExchangeRate',
  'UnitOfMeasure',
  'Calendar',
  'Attachment',
  'MediaContent',
  'MediaRight',
];

const ENTITY_FIELDS: Record<string, string[]> = {
  'Party': ['id', 'party_type', 'display_name', 'status', 'external_reference', 'person_id', 'organization_id'],
  'Person': ['id', 'party_id', 'title', 'given_name', 'middle_name', 'family_name', 'preferred_name', 'date_of_birth', 'gender', 'nationality', 'party_type', 'display_name', 'status', 'external_reference', 'person_id', 'organization_id'],
  'Organization': ['id', 'party_id', 'code', 'name', 'organization_type', 'status', 'legal_name', 'registration_number', 'tax_identifier', 'party_type', 'display_name', 'external_reference', 'person_id', 'parent_organization_id'],
  'PartyRole': ['id', 'party_id', 'role_type', 'code', 'valid_from', 'valid_to', 'status', 'person_id', 'organization_id'],
  'PartyRelationship': ['id', 'code', 'name', 'from_party_id'],
  'LegalEntity': ['id', 'occurred_at'],
  'BusinessUnit': ['id', 'code', 'name', 'organization_id'],
  'Department': ['id', 'code', 'name', 'organization_id'],
  'Address': ['id', 'address_type', 'line1', 'line2', 'line3', 'city', 'state_or_province', 'postal_code', 'country_code', 'latitude', 'longitude', 'is_primary', 'status', 'party_id', 'person_id', 'organization_id', 'location_id'],
  'ContactPoint': ['id', 'code', 'name', 'party_id'],
  'Location': ['id', 'code', 'name', 'location_type', 'status', 'address_id', 'parent_location_id', 'organization_id'],
  'Country': ['id', 'code', 'name'],
  'Language': ['id', 'code', 'name'],
  'Currency': ['id', 'code', 'name', 'symbol', 'decimal_places', 'status'],
  'ExchangeRate': ['id', 'from_currency', 'to_currency', 'rate', 'rate_type', 'effective_at', 'expires_at', 'source', 'status'],
  'UnitOfMeasure': ['id', 'code', 'name', 'symbol', 'category', 'conversion_factor', 'base_unit_id', 'status'],
  'Calendar': ['id', 'code', 'name'],
  'Attachment': ['id', 'effective_at'],
  'MediaContent': ['id', 'content_code', 'title', 'content_type', 'status', 'owner_id'],
  'MediaRight': ['id', 'right_type', 'territory', 'valid_from', 'valid_to', 'status', 'content_id', 'holder_id'],
};

/** A rule as the endpoint returns it, in either casing. */
interface RuleRow {
  id: string;
  ruleName?: string;
  entityName?: string;
  jdmContent?: unknown;
  rule_name?: string;
  entity_name?: string;
  jdm_content?: unknown;
}

interface RuleTableRecord {
  id: string;
  name: string;
  entity: string;
  table: DecisionTable;
}

type View =
  | { kind: 'automation'; id: string }
  | { kind: 'table'; id: string }
  | { kind: 'help' };

function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [storedIds, setStoredIds] = useState<Record<string, string>>({});
  const [tables, setTables] = useState<RuleTableRecord[]>([]);
  const [view, setView] = useState<View>({ kind: 'help' });
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [autoTotal, setAutoTotal] = useState(0);
  const [tableTotal, setTableTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // Through `apiClient`, not `fetch`: `/api/rules` and every
        // `/api/workflow*` route on this backend require a bearer token, and a
        // bare fetch sends none — the screen would load empty and look like a
        // model that declares no automations.
        //
        // `apiClient` throws on a non-2xx, and `Promise.all` rejects on the
        // first throw, so the two calls are settled independently: one
        // endpoint being unavailable must not blank the other's list.
        const [autoRes, ruleRes] = await Promise.allSettled([
          apiClient.get<unknown>('/workflow-definitions', { kind: 'automation', limit: 200 }),
          apiClient.get<unknown>('/rules', { limit: 200 }),
        ]);

        if (cancelled) return;

        // Parse first, then apply. Everything that touches state goes inside
        // one startTransition below.
        // The endpoint answers with the rows themselves; a paged envelope is
        // read too, so the screen does not depend on which one it gets.
        const autoPayload =
          autoRes.status === 'fulfilled'
            ? (autoRes.value as
                | StoredAutomationRow[]
                | { items?: StoredAutomationRow[]; total?: number })
            : null;
        const autoRows: StoredAutomationRow[] = autoPayload
          ? Array.isArray(autoPayload)
            ? autoPayload
            : (autoPayload.items ?? [])
          : [];
        if (autoRes.status === 'rejected') {
          console.error('Failed to load automations:', autoRes.reason);
        }

        const rulePayload =
          ruleRes.status === 'fulfilled'
            ? (ruleRes.value as
                | RuleRow[]
                | { rules?: RuleRow[]; items?: RuleRow[]; data?: RuleRow[]; total?: number })
            : null;

        if (cancelled) return;

        // Each row is its YAML document. A row that cannot be read is reported
        // and left out rather than opened as an empty automation someone could
        // publish over it.
        const parsed = autoRows.flatMap((row) => {
          try {
            return [
              {
                stored: row.id,
                automation: readStoredAutomation(row),
              },
            ];
          } catch (error) {
            console.error(`Automation "${row.name}" (${row.id}) could not be read:`, error);
            return [];
          }
        });

        const ruleRows: RuleRow[] = rulePayload
          ? Array.isArray(rulePayload)
            ? rulePayload
            : (rulePayload.rules ?? rulePayload.items ?? [])
          : [];

        // The page streams from the server showing "Loading automations…", so
        // this is the first update while hydration is still in flight. React
        // treats an urgent update inside a hydrating Suspense boundary as a
        // reason to discard the server HTML and re-render on the client — the
        // "received an update before it finished hydrating" warning. Marking it
        // non-urgent lets hydration finish first.
        startTransition(() => {
          if (autoPayload) {
            setAutoTotal(
              (Array.isArray(autoPayload) ? undefined : autoPayload.total) ?? autoRows.length
            );
            setAutomations(parsed.map((p) => p.automation));
            setStoredIds(Object.fromEntries(parsed.map((p) => [p.automation.id, p.stored])));
            const first = parsed[0];
            if (first) setView({ kind: 'automation', id: first.automation.id });
          }

          if (rulePayload) {
            setTableTotal(
              (Array.isArray(rulePayload) ? undefined : rulePayload.total) ?? ruleRows.length
            );
            setTables(
              ruleRows.map((r) => ({
                id: r.id,
                name: r.ruleName ?? r.rule_name ?? 'Untitled rule',
                entity: r.entityName ?? r.entity_name ?? '',
                table: asDecisionTable(r.jdmContent ?? r.jdm_content),
              }))
            );
          }
        });
      } catch (error) {
        console.error('Failed to load automations:', error);
      } finally {
        // This is the update that actually swaps the "Loading automations…"
        // placeholder for the builder, so it has to be non-urgent too — a
        // transition around the data alone still leaves this one able to
        // interrupt hydration.
        if (!cancelled) startTransition(() => setLoading(false));
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const current = useMemo(
    () => (view.kind === 'automation' ? automations.find((a) => a.id === view.id) : undefined),
    [view, automations]
  );

  const currentTable = useMemo(
    () => (view.kind === 'table' ? tables.find((t) => t.id === view.id) : undefined),
    [view, tables]
  );

  const ruleTableSummaries: RuleTableSummary[] = useMemo(
    () =>
      tables.map((t) => ({
        id: t.id,
        name: t.name,
        rowCount: t.table.rules.length,
        outputs: t.table.outputs.map((o) => o.field || o.name),
      })),
    [tables]
  );

  const usersOf = useCallback(
    (tableName: string) =>
      automations.flatMap((a) =>
        a.steps
          .map((s, i) => ({ s, i }))
          .filter(({ s }) => s.type === 'Decision' && s.props.ruleTable === tableName)
          .map(({ i }) => ({ name: a.name, where: `step ${i + 1}` }))
      ),
    [automations]
  );

  const helpExample = useMemo(() => {
    const entity = ENTITIES[0] ?? 'Record';
    const fields = ENTITY_FIELDS[entity] ?? [];
    return {
      entity,
      numericField: fields.find((f) => /total|amount|price|qty|count/i.test(f)) ?? fields[0] ?? 'id',
      relatedEntity: ENTITIES[1] ?? entity,
    };
  }, []);

  const updateAutomation = (next: Automation) =>
    setAutomations((list) => list.map((a) => (a.id === next.id ? next : a)));

  const createAutomation = async () => {
    const fresh = emptyAutomation(ENTITIES[0] ?? 'Record');
    setAutomations((list) => [...list, fresh]);
    setView({ kind: 'automation', id: fresh.id });

    try {
      const created = await apiClient.post<{ id?: string; item?: { id: string } }>(
        '/workflow-definitions',
        {
          kind: 'automation',
          name: fresh.name,
          entityName: fresh.trigger.entity,
          operation: 'ALL',
          definition: automationToYaml(fresh),
        }
      );
      const id = created?.id ?? created?.item?.id;
      if (id) setStoredIds((m) => ({ ...m, [fresh.id]: id }));
    } catch (error) {
      console.error('Failed to create automation:', error);
    }
  };

  const publish = async (automation: Automation) => {
    const storedId = storedIds[automation.id];
    if (!storedId) return;

    setSaveState('saving');
    const published: Automation = { ...automation, status: 'live' };
    try {
      await apiClient.put<unknown>(`/workflow-definitions/${storedId}`, {
        name: published.name,
        entityName: published.trigger.entity,
        definition: automationToYaml(published),
        isActive: true,
      });
      setSaveState('saved');
      updateAutomation(published);
    } catch (error) {
      console.error('Failed to publish automation:', error);
      setSaveState('error');
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        Loading automations…
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-5">
        <span className="text-[15px] font-bold">media</span>
        <span className="text-[13px] text-muted-foreground">
          Automations ›{' '}
          <b className="font-semibold text-foreground">
            {view.kind === 'help'
              ? 'Help'
              : view.kind === 'table'
                ? currentTable?.name ?? 'Rule table'
                : current?.name ?? 'Automation'}
          </b>
        </span>
        <div className="flex-1" />
        {saveState === 'saving' ? <span className="text-xs text-muted-foreground">Saving…</span> : null}
        {saveState === 'saved' ? <span className="text-xs text-emerald-600">Published</span> : null}
        {saveState === 'error' ? (
          <span className="text-xs text-red-600">Could not save. Try again.</span>
        ) : null}
        <button
          type="button"
          onClick={() => setView({ kind: 'help' })}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          ? Help
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav
          aria-label="Automations and rule tables"
          // Scrolls on its own: with a few hundred automations an unscrolled rail
          // grows the document instead, and selecting one further down takes the
          // work area off screen with it.
          className="flex w-[248px] shrink-0 flex-col overflow-y-auto border-r border-border bg-card"
        >
          <RailSection
            heading="Automations"
            total={autoTotal}
            items={automations.map((a) => ({
              id: a.id,
              title: a.name,
              subtitle: `${a.trigger.entity || 'no record type'} · ${a.steps.length} step${
                a.steps.length === 1 ? '' : 's'
              }`,
              state:
                a.status === 'live'
                  ? ('live' as const)
                  : validateAutomation(a).length > 0
                    ? ('draft' as const)
                    : ('paused' as const),
            }))}
            selectedId={view.kind === 'automation' ? view.id : undefined}
            onSelect={(id) => setView({ kind: 'automation', id })}
          />

          <RailSection
            heading="Rule tables"
            total={tableTotal}
            items={tables.map((t) => ({
              id: t.id,
              title: t.name,
              subtitle: `${t.table.inputs.length} inputs · ${t.table.rules.length} rows`,
              state: 'live' as const,
            }))}
            selectedId={view.kind === 'table' ? view.id : undefined}
            onSelect={(id) => setView({ kind: 'table', id })}
          />

          <div className="mt-auto border-t border-border p-3">
            <button
              type="button"
              onClick={createAutomation}
              className="w-full rounded-lg border border-border bg-card py-2 text-[13px] font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              + New automation
            </button>
          </div>
        </nav>

        {view.kind === 'help' ? (
          <AutomationHelp
            example={helpExample}
            onClose={
              automations[0]
                ? () => setView({ kind: 'automation', id: automations[0]!.id })
                : undefined
            }
          />
        ) : null}

        {/* No onOpenHelp is passed: the header above already offers Help, and
            two identical controls on one screen is one more decision than needed. */}
        {view.kind === 'automation' && current ? (
          <AutomationBuilder
            automation={current}
            onChange={updateAutomation}
            entities={ENTITIES}
            entityFields={ENTITY_FIELDS}
            ruleTables={ruleTableSummaries}
            onOpenRuleTable={(name) => {
              const table = tables.find((t) => t.name === name);
              if (table) setView({ kind: 'table', id: table.id });
            }}
            onPublish={() => void publish(current)}
          />
        ) : null}

        {view.kind === 'table' && currentTable ? (
          <RuleTableEditor
            name={currentTable.name}
            table={currentTable.table}
            usedBy={usersOf(currentTable.name)}
            onChange={(table) =>
              setTables((list) => list.map((t) => (t.id === currentTable.id ? { ...t, table } : t)))
            }
          />
        ) : null}
      </div>
    </div>
  );
}

/**
 * Accept whatever the rules endpoint stored.
 *
 * A rule saved as a JDM graph rather than a table opens as an empty table
 * instead of a guessed conversion — visibly empty beats silently wrong.
 */
function asDecisionTable(content: unknown): DecisionTable {
  if (content && typeof content === 'object') {
    const c = content as Partial<DecisionTable>;
    if (Array.isArray(c.inputs) && Array.isArray(c.outputs) && Array.isArray(c.rules)) {
      return {
        hitPolicy: c.hitPolicy === 'collect' ? 'collect' : 'first',
        inputs: c.inputs,
        outputs: c.outputs,
        rules: c.rules,
      };
    }
  }
  return emptyDecisionTable();
}
