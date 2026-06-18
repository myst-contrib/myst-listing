/**
 * Display layer. A display turns the (already filtered/sorted/limited) items
 * into a single AST node. Add a built-in view via the `displays` map below.
 * See docs/extending.md for adding one from an external plugin.
 */
import { ctxRef, rawImageSrc } from "./shared.js";

export type Display = (items: any[], node: any) => any;

// A long, locale-aware date ("May 20, 2026"). Formatted in UTC because YAML
// dates are midnight-UTC, and a local timezone could roll them back a day.
const dateFmt = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

// A field's value as display text. Lists join with commas; dates (a Date or a
// "YYYY-MM-DD" string) format long; author-like objects render by name.
function cellText(value: any): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(cellText).join(", ");
  if (value instanceof Date) return dateFmt.format(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return dateFmt.format(d);
  }
  if (typeof value === "object") return value.name ?? value.id ?? "";
  return String(value);
}

// Styling ships with the plugin as inline `style` objects on nodes, so a
// listing looks right in any theme without extra CSS. Only div/span pass
// node.style through to the renderer (paragraph/image do not), so styled lines
// are emitted as divs. Greys-with-alpha read well on light and dark themes;
// class names are override hooks.
const S: Record<string, any> = {
  summaryStack: { display: "flex", flexDirection: "column", gap: "1.1rem", margin: "1.5rem 0" },
  // The flex row lives on an inner wrapper, not the card: searchfilter toggles
  // the card's inline `display`, which would otherwise clobber `flex`.
  summaryCard: { borderLeft: "3px solid rgba(128,128,128,0.3)", paddingLeft: "1rem" },
  summaryRow: { display: "flex", gap: "1rem", alignItems: "flex-start" },
  summaryThumb: { flexShrink: 0, display: "flex", borderRadius: "8px", overflow: "hidden" },
  // Background image (not an <image> node) so it can `contain` without cropping
  // logos, giving every card the same 3:2 footprint.
  cover: {
    width: "100%",
    aspectRatio: "3 / 2",
    padding: "0.6rem",
    boxSizing: "border-box",
    // Semi-transparent white: invisible on light cards, a light backing on dark
    // ones, so dark/transparent logos stay legible in both themes.
    backgroundColor: "rgba(255,255,255,0.7)",
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundOrigin: "content-box",
    borderRadius: "8px",
    marginBottom: "0.5rem",
  },
  title: { margin: "0.5rem 0 0.3rem", fontWeight: 600, fontSize: "1.05rem" },
  description: { margin: "0.4rem 0", opacity: 0.8 },
  meta: { margin: "0.1rem 0", opacity: 0.6, fontSize: "0.85rem" },
  tags: { display: "inline-flex", flexWrap: "wrap", gap: "0.35rem", margin: "0.4rem 0" },
  // Gallery-only: clip tags to a single row so a tag-heavy card doesn't grow
  // taller than its neighbors. One pill is ~1.5rem with line-height.
  tagsClip: { maxHeight: "1.55rem", overflow: "hidden" },
  tag: {
    fontSize: "0.75rem",
    padding: "0.1rem 0.6rem",
    borderRadius: "999px",
    whiteSpace: "nowrap",
  },
};

// Pill backgrounds, indexed by a field's position in :tag-fields:. Index 0 is
// the original grey, so a default `tags` field is unchanged.
const palette = [
  "rgba(128,128,128,0.18)", // grey (default)
  "rgba(56,139,253,0.20)", // blue
  "rgba(63,185,80,0.20)", // green
  "rgba(219,109,40,0.22)", // orange
];

// Title text may carry inline markup (a `<br>`, code, emphasis). Parse it to
// inline AST so it renders rather than showing the raw characters, falling back
// to a plain text node when the parser is unavailable or yields nothing.
function titleInlines(item: any): any[] {
  const text = cellText(item.title);
  const para = ctxRef.parseMyst?.(text)?.children?.find((c: any) => c.type === "paragraph");
  return para?.children?.length ? para.children : [{ type: "text", value: text }];
}

// A bold title line (a div, not a heading, so it stays out of the TOC),
// linked to the item when it has a url.
function titleLine(item: any) {
  const inlines = titleInlines(item);
  const label = item.url ? [{ type: "link", url: item.url, children: inlines }] : inlines;
  return { type: "div", class: "myst-listing-title", style: S.title, children: [{ type: "strong", children: label }] };
}

function truncate(s: string, n = 140) {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

// A styled text line.
function line(cls: string, style: any, value: string) {
  return { type: "div", class: cls, style, children: [{ type: "text", value }] };
}

// One field's values → a row of pills, colored by the field's palette slot.
// Null when the field is absent/empty (caller omits it).
function renderTagGroup(values: any, colorIndex: number, extraStyle?: any) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const background = palette[colorIndex % palette.length];
  return {
    type: "span",
    class: "myst-listing-tags",
    style: { ...S.tags, ...extraStyle },
    children: values.map((t) => ({
      type: "span",
      class: "myst-listing-tag",
      style: { ...S.tag, background },
      children: [{ type: "text", value: String(t) }],
    })),
  };
}

// An item's configured tag fields as colored pill rows, empties skipped.
// extraStyle is merged into each row (gallery passes a one-line clip).
function renderTagGroups(item: any, node: any, extraStyle?: any) {
  const fields: string[] = node.tagFields ?? ["tags"];
  return fields.map((f, i) => renderTagGroup(item[f], i, extraStyle)).filter(Boolean);
}

// Full-width cover (background image on an empty div), or null with no thumbnail.
// Decorative — the card title link carries the accessible name.
function renderCover(item: any) {
  if (!item.thumbnail) return null;
  return {
    type: "div",
    class: "myst-listing-cover",
    style: { ...S.cover, backgroundImage: `url("${rawImageSrc(String(item.thumbnail))}")` },
    children: [],
  };
}

function renderTable(items: any[], node: any) {
  const columns: string[] = node.columns;
  const header = {
    type: "tableRow",
    children: columns.map((col) => ({
      type: "tableCell",
      header: true,
      children: [{ type: "text", value: col.charAt(0).toUpperCase() + col.slice(1) }],
    })),
  };
  const rows = items.map((item) => ({
    type: "tableRow",
    // On data rows only (not the header) so searchfilter can hide rows while
    // keeping the header visible.
    class: "myst-listing-item",
    children: columns.map((col) => {
      const text = cellText(item[col]);
      const children =
        col === "title" && item.url
          ? [{ type: "link", url: item.url, children: [{ type: "text", value: text }] }]
          : [{ type: "text", value: text }];
      return { type: "tableCell", children };
    }),
  }));
  return { type: "table", class: "myst-listing", children: [header, ...rows] };
}

// Image-forward grid of cards. A `card` with a `url` is MyST's built-in
// clickable card (one accessible link over the whole card); `grid` lays them
// out responsively. We supply and style the card contents.
function renderGallery(items: any[], node: any) {
  const cards = items.map((item) => {
    const desc = cellText(item.description);
    return {
      type: "card",
      class: "myst-listing-card",
      url: item.url || undefined,
      children: [
        renderCover(item),
        { type: "cardTitle", children: titleInlines(item) },
        desc && line("myst-listing-description", S.description, truncate(desc)),
        // Tags last, as a footer — secondary metadata shouldn't break the
        // title→description read. Matches the summary view's order.
        ...renderTagGroups(item, node, S.tagsClip),
      ].filter(Boolean),
    };
  });
  // A fixed count if asked, else responsive 1→4 across breakpoints.
  const columns = node.gridColumns ? [node.gridColumns] : [1, 2, 3, 4];
  return { type: "grid", class: "myst-listing myst-listing-gallery", columns, children: cards };
}

// Description-forward stacked cards: a content column (title, date meta, full
// description, tags) with the thumbnail, if any, floated to its right.
function renderSummary(items: any[], node: any) {
  const cards = items.map((item) => {
    // Date and author(s) on one muted meta line, e.g. "May 20, 2026 · Jane Doe".
    const meta = [cellText(item.date), cellText(item.authors ?? item.author)]
      .filter(Boolean)
      .join(" · ");
    const content = {
      type: "div",
      style: { flex: 1, minWidth: 0 },
      children: [
        titleLine(item),
        meta && line("myst-listing-meta", S.meta, meta),
        item.description && line("myst-listing-description", S.description, cellText(item.description)),
        ...renderTagGroups(item, node),
      ].filter(Boolean),
    };
    const thumb = item.thumbnail && {
      type: "div",
      class: "myst-listing-thumb",
      style: S.summaryThumb,
      children: [{ type: "image", url: rawImageSrc(String(item.thumbnail)), alt: cellText(item.title), width: "160px" }],
    };
    const row = { type: "div", style: S.summaryRow, children: thumb ? [content, thumb] : [content] };
    return {
      type: "div",
      // myst-listing-item is the searchfilter hook (see renderTable).
      class: "myst-listing-card myst-listing-item",
      style: S.summaryCard,
      children: [row],
    };
  });
  return { type: "div", class: "myst-listing myst-listing-summary", style: S.summaryStack, children: cards };
}

/** Built-in displays, keyed by `:display:`. */
export const displays: Record<string, Display> = {
  table: renderTable,
  gallery: renderGallery,
  summary: renderSummary,
};
