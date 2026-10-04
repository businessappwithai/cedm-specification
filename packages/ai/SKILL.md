---
name: appwithai-ai
description: Mastra.ai orchestration for AI-powered ERD design with human-in-the-loop workflows
---

# @appwithai/ai Skill

This skill provides guidance for working with the AI package of AppWithAI, which integrates Mastra.ai for AI-powered entity-relationship diagram design with human-in-the-loop (HITL) approval workflows.

## Package Overview

The AI package provides:

- **AI Agents**: Specialized agents for domain analysis, entity refinement and relationship detection
- **HITL Workflows**: Human-in-the-loop workflows using Mastra.ai suspend/resume
- **Converter**: Natural language → a YAML model document (`*.eml.yaml`), checked by the generator's own reader before it is returned
- **CLI Tool**: `appwithai-convert`, which writes a new model or revises an existing one

## Directory Structure

```
packages/ai/
├── src/
│   ├── agents/
│   │   ├── domain-agent.ts       # Analyzes domain descriptions
│   │   ├── entity-agent.ts       # Refines entity structure
│   │   ├── relationship-agent.ts # Determines relationship cardinality
│   │   └── index.ts
│   ├── model/
│   │   └── from-domain.ts        # DomainAnalysis → model document, deterministically
│   ├── workflows/
│   │   ├── erd-design-workflow.ts # HITL ERD design workflow
│   │   └── index.ts
│   ├── converter/
│   │   ├── index.ts              # convertToModel
│   │   └── local-model.ts        # analysis and revision against the local model
│   ├── cli/
│   │   └── convert.ts            # CLI entry point
│   ├── types/
│   │   └── index.ts              # Zod schemas and types
│   ├── config.ts                 # The one place the model endpoint is configured
│   ├── mastra.ts                 # Mastra dev-server entrypoint
│   └── index.ts
└── package.json
```

## Key Concepts

### AI Agents

Each agent is specialized for a specific task in the ERD design process:

#### Domain Agent
Analyzes natural language descriptions and extracts entities/relationships:

```typescript
import { analyzeDomain } from '@appwithai/ai';

const analysis = await analyzeDomain(
  "E-commerce platform where users browse products, add to cart, and place orders"
);

console.log(analysis.entities);      // User, Product, Cart, Order
console.log(analysis.relationships); // User -> Cart, Cart -> Product, etc.
```

#### Entity Agent
Refines entity structure with proper naming and validation:

```typescript
import { refineEntity } from '@appwithai/ai';

const refined = await refineEntity({
  name: 'user',
  attributes: [{ name: 'email', type: 'text' }]
});
// Returns: User with proper PascalCase, id, timestamps, email validation
```

#### From analysis to model
The model document is written from an approved analysis by code, not by a
model, so the same analysis always produces the same YAML:

```typescript
import { domainToModelDocument } from '@appwithai/ai';
import { serializeModelDocument } from '@appwithai/generator/model-yaml';

const { document, dropped } = domainToModelDocument(analysis, "Shop");
const yaml = serializeModelDocument(document);
// `dropped` names relationships between entities the analysis did not declare.
```

### Mastra.ai Integration

The Mastra instance (`src/mastra/index.ts`) registers `codeAgent` only; the
three agents above are used directly by the converter and the workflow. The dev server (`src/mastra.ts`, `bun run dev:mastra`) registers all three and `erdDesignWorkflow`.

```typescript
import { mastra } from '@appwithai/ai';

const agent = mastra.getAgent('codeAgent');
```

### HITL Workflows

`erdDesignWorkflow` analyzes the description and suspends for approval;
`generateModelStep` writes the approved entities and relationships as the
model document (`modelYaml`, with entity and relationship counts and what was
dropped).

```typescript
import { erdDesignWorkflow } from '@appwithai/ai';

const run = await erdDesignWorkflow.createRun();
const result = await run.start({
  inputData: { description: "Blog platform with users and posts" },
});
```

### Converter

```typescript
import { convertToModel } from '@appwithai/ai';

// A new model from a description
const created = await convertToModel({ description: "Blog with users and posts", name: "Blog" });
created.model;        // YAML text
created.ok;           // false when the reader reported an error
created.diagnostics;  // every finding, with line and column

// A change to an existing model, corrected up to maxAttempts times
const revised = await convertToModel({
  description: "Add a Tag entity and tag posts with it",
  currentModel: created.model,
  maxAttempts: 3,
});
```

What comes back is always read by `readModelYaml` — schema, then semantic
checks — so a result with errors says so rather than being assumed correct.

## CLI Usage

```bash
# A new model
appwithai-convert "Blog with users and posts" -n Blog -o blog.eml.yaml

# From a file
appwithai-convert -i description.txt -o model.eml.yaml

# Revise an existing model
appwithai-convert "Add a Tag entity" -m blog.eml.yaml -o blog.eml.yaml

# Analysis only (JSON output)
appwithai-convert "CRM system" --analyze-only --json
```

## Environment Variables

Create `.env` file with:

```bash
LOCAL_AI_BASE_URL=http://localhost:8000/v1  # OpenAI-compatible endpoint (src/config.ts)
LOCAL_AI_MODEL=qwen3.6:27b-mlx              # Model name at that endpoint
LOCAL_AI_API_KEY=local                      # Key, if the endpoint wants one
MASTRA_DATABASE_URL=file:./mastra.db   # Mastra state storage
MASTRA_LOG_LEVEL=info                  # Logging level
MASTRA_PORT=4111                       # Mastra server port (if running)
```

## Building the Package

```bash
# Build AI package (requires core first)
bun run build:core && bun run build:ai

# Run Mastra server
bun run dev:mastra
```

## Dependencies

- **@appwithai/core**, **@appwithai/generator**: workspace - types and the model reader
- **@mastra/core**: ^1.54.0 - Mastra AI orchestration
- **@mastra/loggers**, **@mastra/libsql**, **@mastra/memory**: Mastra logging, storage, memory
- **@ag-ui/mastra**: ^1.1.1 - AG-UI Mastra integration
- **zod**: ^3.22.4 - Schema validation
- **commander**: ^15.0.0 - CLI framework

## Common Tasks

### Adding a New Agent

1. Create `src/agents/my-agent.ts`:
   ```typescript
   import { Agent } from '@mastra/core/agent';
   import { mastraModelConfig } from '../config';

   export const myAgent = new Agent({
     id: 'my-agent',
     name: 'My Agent',
     instructions: `Your instructions here...`,
     model: mastraModelConfig, // never a hard-coded model string
   });
   ```

2. Export from `src/agents/index.ts`
3. Register it on the Mastra instance (`src/mastra/index.ts`) only if a client calls it by name

### Adding a Workflow Step

1. Edit `src/workflows/erd-design-workflow.ts`
2. Create step with `createStep()`
3. Add to workflow chain with `.then()`

### Modifying Agent Prompts

Agent prompts are in the `instructions` field of each agent. Update them in:
- `src/agents/domain-agent.ts`
- `src/agents/entity-agent.ts`
- `src/agents/relationship-agent.ts`

## Type Definitions

Key types in `src/types/index.ts`:

```typescript
interface EntityCandidate {
  name: string;
  description: string;
  suggestedAttributes: Array<{
    name: string;
    type: string;
    required: boolean;
    unique?: boolean;
  }>;
  confidence: number;  // 0-1
  reasoning: string;
}

interface RelationshipCandidate {
  name: string;
  source: string;
  target: string;
  cardinality: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  confidence: number;
  reasoning: string;
}

interface DomainAnalysis {
  entities: EntityCandidate[];
  relationships: RelationshipCandidate[];
  summary: string;
}
```

## Exports

- `@appwithai/ai` - Main entry point
- CLI: `appwithai-convert` - CLI binary

## Testing

```bash
cd packages/ai
bun test
```
