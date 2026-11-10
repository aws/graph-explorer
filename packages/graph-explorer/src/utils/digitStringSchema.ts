import { z } from "zod";

/** A string of ASCII digits, read as the number it spells. */
export const digitStringSchema = z.string().regex(/^\d+$/).transform(Number);
