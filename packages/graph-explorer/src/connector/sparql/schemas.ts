import { z } from "zod";

export const sparqlResponseHeadSchema = z.object({
  vars: z.array(z.string()),
});

export const sparqlStringValueSchema = z.object({
  type: z.literal("literal"),
  value: z.string(),
});

export const sparqlDateTimeValueSchema = z.object({
  datatype: z.literal("http://www.w3.org/2001/XMLSchema#dateTime"),
  type: z.literal("literal"),
  value: z.string(),
});

export const sparqlUriValueSchema = z.object({
  type: z.literal("uri"),
  value: z.string().url(),
});

export const sparqlBlankNodeSchema = z.object({
  type: z.literal("bnode"),
  value: z.string(),
});

export const sparqlResourceValueSchema = z.union([
  sparqlUriValueSchema,
  sparqlBlankNodeSchema,
]);

export const sparqlNumberValueSchema = z.object({
  datatype: z.literal("http://www.w3.org/2001/XMLSchema#integer"),
  type: z.literal("literal"),
  value: z.string(),
});

export const sparqlValueSchema = z.object({
  datatype: z.string().optional(),
  type: z.string(),
  value: z.string(),
  "xml:lang": z.string().optional(),
});

export function sparqlResponseSchema<T extends z.ZodTypeAny>(
  bindingsSchema: T
) {
  return z.object({
    head: sparqlResponseHeadSchema,
    results: z.object({
      bindings: z.array(bindingsSchema),
    }),
  });
}

export const sparqlAskResponseSchema = z.object({
  head: z.object({}),
  boolean: z.boolean(),
});

export const sparqlQuadBindingSchema = z
  .object({
    subject: sparqlResourceValueSchema,
    predicate: sparqlUriValueSchema,
    object: sparqlValueSchema,
    graph: sparqlValueSchema.optional(),
  })
  .strict();
