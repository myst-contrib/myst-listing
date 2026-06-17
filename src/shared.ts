/** The node the `{listing}` directive emits. Collectors fill `.items`; the
 * render transform later replaces it with the chosen display. */
export const PLACEHOLDER = "listingPlaceholder";

/** `parseMyst` is only handed to directives, not transforms, but the file
 * collector (a transform) needs it. The directive stashes it here on first run
 * for the collector to reuse. Remove once transforms get their own `ctx`:
 * https://github.com/jupyter-book/mystmd/issues/2626 */
export const ctxRef: { parseMyst?: (content: string) => any } = {};
