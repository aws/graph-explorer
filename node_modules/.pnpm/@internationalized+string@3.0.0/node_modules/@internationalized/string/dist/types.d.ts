export type LocalizedStrings<K extends string, T extends LocalizedString> = {
    [lang: string]: Record<K, T>;
};
/**
 * Stores a mapping of localized strings. Can be used to find the
 * closest available string for a given locale.
 */
export class LocalizedStringDictionary<K extends string = string, T extends LocalizedString = string> {
    constructor(messages: LocalizedStrings<K, T>, defaultLocale?: string);
    /** Returns a localized string for the given key and locale. */
    getStringForLocale(key: K, locale: string): T;
}
export type Variables = Record<string, string | number | boolean> | undefined;
export type LocalizedString = string | ((args: Variables, formatter?: LocalizedStringFormatter<any, any>) => string);
type InternalString = string | (() => string);
/**
 * Formats localized strings from a LocalizedStringDictionary. Supports interpolating variables,
 * selecting the correct pluralization, and formatting numbers for the locale.
 */
export class LocalizedStringFormatter<K extends string = string, T extends LocalizedString = string> {
    constructor(locale: string, strings: LocalizedStringDictionary<K, T>);
    /** Formats a localized string for the given key with the provided variables. */
    format(key: K, variables?: Variables): string;
    protected plural(count: number, options: Record<string, InternalString>, type?: Intl.PluralRuleType): string;
    protected number(value: number): string;
    protected select(options: Record<string, InternalString>, value: string): string;
}

//# sourceMappingURL=types.d.ts.map
