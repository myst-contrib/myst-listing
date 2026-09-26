/** Small helpers used by more than one pipeline stage. */

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

/** Tag fields may be a YAML list (`[a, b]`) or a `;`/`,`-delimited shorthand
 * string (`"a; b, c"`). Normalize either to a trimmed list, dropping empties. */
export function toTagList(value: unknown): string[] {
  const parts = Array.isArray(value)
    ? value.map(String)
    : typeof value === "string"
      ? value.split(/[;,]/)
      : [];
  return parts.map((s) => s.trim()).filter(Boolean);
}

/** A long, locale-aware date ("May 20, 2026"). Formatted in UTC because YAML
 * dates are midnight-UTC, and a local timezone could roll them back a day. */
const dateFmt = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

/** A YAML/ISO date (Date object or "2026-05-20..." string), else null. */
export function asDate(value: any): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

/** A field's value as display text: lists join with commas, dates format long,
 * author-like objects render by name. */
export function cellText(value: any): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(cellText).join(", ");
  const d = asDate(value);
  if (d) return dateFmt.format(d);
  if (typeof value === "object") return value.name ?? value.id ?? "";
  return String(value);
}
