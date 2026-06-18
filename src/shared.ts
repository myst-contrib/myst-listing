/** The node the `{listing}` directive emits. Collectors fill `.items`; the
 * render transform later replaces it with the chosen display. */
export const PLACEHOLDER = "listingPlaceholder";

/** `parseMyst` is only handed to directives, not transforms, but the file
 * collector (a transform) needs it. The directive stashes it here on first run
 * for the collector to reuse. Remove once transforms get their own `ctx`:
 * https://github.com/jupyter-book/mystmd/issues/2626 */
export const ctxRef: { parseMyst?: (content: string) => any } = {};

/** A GitHub `/blob/` URL is an HTML file page, not an image, so it can't load as
 * a thumbnail. Rewrite that common paste mistake to the raw host. */
export function rawImageSrc(url: string): string {
  return url.replace(
    /^(https?:\/\/)github\.com\/([^/]+\/[^/]+)\/blob\//,
    "$1raw.githubusercontent.com/$2/",
  );
}
