/** The node the `{listing}` directive emits. Collectors fill `.items`; the
 * render transform later replaces it with the chosen display. */
export const PLACEHOLDER = "listingPlaceholder";

/** `parseMyst` only exists on the directive `ctx`, but the file collector (a
 * document-stage transform) needs it. The directive stashes it here on first
 * run for the collector to reuse. */
export const ctxRef: { parseMyst?: (content: string) => any } = {};
