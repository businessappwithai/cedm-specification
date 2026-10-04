# @appwithai/ai

AI-assisted model design with Mastra.ai orchestration.

## Features

- Natural language to a YAML model document (`*.eml.yaml`)
- Revision of an existing model from a described change, checked after every attempt
- 3 specialized AI agents (Domain, Entity, Relationship)
- Human-in-the-loop workflows
- Standalone CLI tool

## Quick Start

```bash
# CLI usage
appwithai-convert "Blog with users and posts" -n Blog -o blog.eml.yaml

# Programmatic usage
import { convertToModel } from '@appwithai/ai';
const { model, ok, diagnostics } = await convertToModel({ description: "Your description" });
```

The model endpoint is configured in `src/config.ts` (`LOCAL_AI_BASE_URL`,
`LOCAL_AI_MODEL`, `LOCAL_AI_API_KEY`).

## API Reference

See `SKILL.md` in this package.
