// Builds an OpenAPI 3.0 document from the model at runtime.

import { ENUMS, MODEL } from "./model.js";

const TYPE_MAP = {
  string: { type: "string" },
  text: { type: "string" },
  integer: { type: "integer" },
  decimal: { type: "number" },
  boolean: { type: "boolean" },
  date: { type: "string", format: "date" },
  datetime: { type: "string", format: "date-time" },
  json: { type: "object" },
};

export function buildOpenApi() {
  const paths = {};
  const schemas = {};

  for (const entity of MODEL.entities ?? []) {
    const props = {};
    const required = [];
    for (const a of entity.attributes) {
      const base = TYPE_MAP[a.type] ?? { type: "string" };
      props[a.name] =
        a.enumRef && ENUMS[a.enumRef] ? { ...base, enum: ENUMS[a.enumRef] } : { ...base };
      if (a.required && !a.isPrimaryKey) required.push(a.name);
    }
    schemas[entity.name] = { type: "object", properties: props, required };

    const ref = { $ref: `#/components/schemas/${entity.name}` };
    const col = entity.collection;
    paths[`/api/${col}`] = {
      get: { summary: `List ${entity.name}`, responses: { 200: { description: "OK" } } },
      post: {
        summary: `Create ${entity.name}`,
        requestBody: { content: { "application/json": { schema: ref } } },
        responses: { 201: { description: "Created" }, 400: { description: "Validation error" } },
      },
    };
    const optimistic = entity.concurrency !== "last-write-wins";
    const ifMatch = {
      name: "If-Match",
      in: "header",
      required: optimistic,
      description: optimistic
        ? 'The version the record was read at, from its ETag ("v<n>"), or * to overwrite deliberately.'
        : 'The version the record was read at ("v<n>"). Optional: this entity is last-write-wins.',
      schema: { type: "string" },
    };
    const refused = {
      409: {
        description:
          "VERSION_CONFLICT: the record changed since the If-Match version; `conflict` carries it as it now stands. RECORD_FINAL: the record is in a final state, a completed transaction. Also an illegal transition.",
      },
      ...(optimistic ? { 428: { description: "No If-Match on an optimistic entity" } } : {}),
    };
    const update = {
      summary: `Update ${entity.name}`,
      parameters: [ifMatch],
      requestBody: { content: { "application/json": { schema: ref } } },
      responses: {
        200: { description: "OK, with the new ETag" },
        404: { description: "Not found" },
        ...refused,
      },
    };
    paths[`/api/${col}/{id}`] = {
      get: {
        summary: `Get ${entity.name}`,
        responses: { 200: { description: "OK, with its ETag" }, 404: { description: "Not found" } },
      },
      put: update,
      patch: update,
      delete: {
        summary: `Delete ${entity.name}`,
        parameters: [ifMatch],
        responses: {
          204: { description: "Deleted" },
          404: { description: "Not found" },
          ...refused,
        },
      },
    };
  }

  return {
    openapi: "3.0.3",
    info: { title: MODEL.meta?.name ?? "EML App", version: MODEL.meta?.version ?? "1.0.0" },
    paths,
    components: { schemas },
  };
}
