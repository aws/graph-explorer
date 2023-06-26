type Assertiveness = 'assertive' | 'polite';
/**
 * Announces the message using screen reader technology.
 */
export function announce(message: string, assertiveness?: Assertiveness, timeout?: number): void;
/**
 * Stops all queued announcements.
 */
export function clearAnnouncer(assertiveness: Assertiveness): void;
/**
 * Removes the announcer from the DOM.
 */
export function destroyAnnouncer(): void;

//# sourceMappingURL=types.d.ts.map
