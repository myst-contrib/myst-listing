/**
 * The Transform stage: which items appear, and in what order.
 * Pure functions over plain items; the options are documented in docs/transform.md.
 */
import { asDate, cellText } from "./shared.js";

/** The items a listing shows, in order. Reads `sort`, `limit`, `filter` and
 * `ordered` off the placeholder and never writes to it. Unless a collector set
 * `ordered`, the defaults are `sort: date-desc` and `limit: 10`. */
export function selectItems(items: any[], node: any) {
  let { sort, limit } = node;
  // A collector sets `ordered` when its item order is meaningful (e.g. toc).
  if (!node.ordered) {
    sort ??= "date-desc";
    limit ??= 10;
  }
  items = applyFilter(items, node.filter);
  if (sort) items = sortItems(items, sort);
  // A :limit: of 0 or less means "no limit" (same convention as :body-limit:).
  if (limit > 0) items = items.slice(0, limit);
  return items;
}

/** A field's value as a sort key: dates become epoch ms, empties become null
 * (sorted last), and lists/objects sort by their display text. Used by both the
 * build-time sort and the sort widget's precomputed orders (see plugin.ts). */
export function sortValue(value: any): string | number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return value;
  const d = asDate(value);
  if (d) return d.getTime();
  return cellText(value);
}

/** Compare two sort keys. Shared by the build-time sort and the client-side
 * interactive sort. If a value is empty, it is always last. */
export function compareValues(a: string | number | null, b: string | number | null, dir: number) {
  if (a == null) return b == null ? 0 : 1;
  if (b == null) return -1;
  // Dates are already epoch ms via sortValue, so they compare as numbers.
  // For text, `numeric: true` orders "v9" before "v10".
  const c =
    typeof a === "number" && typeof b === "number"
      ? a - b
      : String(a).localeCompare(String(b), undefined, { numeric: true });
  return c * dir;
}

/** `filter` is `field=value`; list fields (e.g. tags) match if they contain the value. */
function applyFilter(items: any[], filter?: string) {
  if (!filter) return items;
  const eq = filter.indexOf("=");
  if (eq < 0) return items; // only field=value is supported
  const field = filter.slice(0, eq).trim();
  const value = filter.slice(eq + 1).trim();
  return items.filter((it) => {
    const v = it[field];
    if (Array.isArray(v)) return v.map(String).includes(value);
    return String(v ?? "") === value;
  });
}

/** Fisher-Yates shuffle. */
function shuffle(items: any[]) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** `sort` is `field`, `field-asc`, `field-desc`, or `random`. */
function sortItems(items: any[], sort: string) {
  if (sort === "random") return shuffle(items);
  // Only a trailing "-asc"/"-desc" is a direction; any other dash is part of the field name.
  const dash = sort.lastIndexOf("-");
  const suffix = dash >= 0 ? sort.slice(dash + 1) : "";
  const hasOrder = suffix === "asc" || suffix === "desc";
  const field = hasOrder ? sort.slice(0, dash) : sort;
  const dir = suffix === "desc" ? -1 : 1;
  return [...items].sort((a, b) => compareValues(sortValue(a[field]), sortValue(b[field]), dir));
}
