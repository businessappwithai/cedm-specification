#!/usr/bin/env bun
/**
 * appwithai-convert — a description of a business, or of a change to a model,
 * turned into a model document.
 *
 *   appwithai-convert "A clinic books appointments for patients" -o clinic.eml.yaml
 *   appwithai-convert -i change.txt --model clinic.eml.yaml -o clinic.eml.yaml
 *   appwithai-convert "…" --analyze-only --json
 *
 * The written file is checked with the generator's reader; its findings are
 * printed at their lines, and the command exits non-zero when any is an error.
 */

import { promises as fs } from "node:fs";
import { Command } from "commander";
import { analyzeDomainWithLocalModel, convertToModel } from "../converter";

const program = new Command();

program
  .name("appwithai-convert")
  .description("Turn natural language into an AppWithAI model document (*.eml.yaml)")
  .version("5.1.0")
  .argument("[description]", "What the business does, or what to change about the model")
  .option("-i, --input <file>", "Read the description from a file")
  .option("-m, --model <file>", "The model to change; without it a new model is written")
  .option("-o, --output <file>", "Where to write the model", "model.eml.yaml")
  .option("-n, --name <name>", "The name of a new model")
  .option("--attempts <n>", "Corrections allowed for a revision with errors", "3")
  .option("--analyze-only", "Print the domain analysis and write nothing")
  .option("--json", "Print JSON rather than a summary")
  .action(async (description: string | undefined, options) => {
    const text = options.input ? await fs.readFile(options.input, "utf-8") : description;
    if (!text?.trim()) {
      console.error('Usage: appwithai-convert "your description" -o model.eml.yaml');
      process.exit(2);
    }

    if (options.analyzeOnly) {
      const analysis = await analyzeDomainWithLocalModel(text);
      if (options.json) {
        console.log(JSON.stringify(analysis, null, 2));
        return;
      }
      console.log(`Entities (${analysis.entities.length}):`);
      for (const entity of analysis.entities) console.log(`  ${entity.name} (${entity.confidence})`);
      console.log(`Relationships (${analysis.relationships.length}):`);
      for (const r of analysis.relationships)
        console.log(`  ${r.source} ${r.cardinality} ${r.target}: ${r.name}`);
      return;
    }

    const currentModel = options.model ? await fs.readFile(options.model, "utf-8") : undefined;
    const result = await convertToModel({
      description: text,
      currentModel,
      name: options.name,
      maxAttempts: Number(options.attempts),
    });
    await fs.writeFile(options.output, result.model);

    if (options.json) {
      console.log(JSON.stringify({ ...result, output: options.output }, null, 2));
    } else {
      console.log(`Wrote ${options.output} (${result.attempts} attempt(s)).`);
      for (const dropped of result.dropped)
        console.log(`  left out: ${dropped} — it names an entity the analysis did not declare`);
      for (const d of result.diagnostics)
        console.log(`  ${options.output}:${d.line}:${d.column} ${d.severity} ${d.code} ${d.message}`);
    }
    if (!result.ok) process.exit(1);
  });

program.parse();
