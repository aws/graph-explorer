import { FormatXMLElementFn, PrimitiveType } from "intl-messageformat/src/formatters";
export type LocalizedStrings = {
    [lang: string]: {
        [key: string]: string;
    };
};
/**
 * Stores a mapping of localized strings. Can be used to find the
 * closest available string for a given locale.
 */
export class MessageDictionary {
    constructor(messages: LocalizedStrings, defaultLocale?: string);
    getStringForLocale(key: string, locale: string): string;
}
/**
 * Formats ICU Message strings to create localized strings from a MessageDictionary.
 */
export class MessageFormatter {
    constructor(locale: string, messages: MessageDictionary);
    format<T = void>(key: string, variables: Record<string, PrimitiveType | T | FormatXMLElementFn<T, string | T | (string | T)[]>> | undefined): string | T | (string | T)[];
}

//# sourceMappingURL=types.d.ts.map
