import type { Branded } from "@/utils";

/** The namespace portion of an IRI, including the trailing `#` or `/`. */
export type IriNamespace = Branded<string, "IriNamespace">;

/** The local value after the namespace separator in an IRI. */
export type IriLocalValue = Branded<string, "IriLocalValue">;

/** The namespace and local value components of a split IRI. */
export type IriParts = {
  namespace: IriNamespace;
  value: IriLocalValue;
};

/** A short prefix name derived from an IRI namespace. */
export type RdfPrefix = Branded<string, "RdfPrefix">;

/** The result of generating a prefix from an IRI, combining the split parts with the derived prefix name. */
export type GeneratedPrefix = IriParts & {
  prefix: RdfPrefix;
};

/** A lowercase, trimmed namespace used as a map key for case-insensitive lookups. */
export type NormalizedIriNamespace = Branded<string, "NormalizedIriNamespace">;
