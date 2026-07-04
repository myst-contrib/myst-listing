/**
 * Display layer. A display turns the (already filtered/sorted/limited) items
 * into a single AST node. Add a built-in view via the `displays` map below.
 * See docs/extending.md for adding one from an external plugin.
 */
import { ctxRef, rawImageSrc, toTagList } from "./shared.js";

export type Display = (items: any[], node: any) => any;

// A long, locale-aware date ("May 20, 2026"). Formatted in UTC because YAML
// dates are midnight-UTC, and a local timezone could roll them back a day.
const dateFmt = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

// A field's value as display text: lists join with commas, dates format long,
// author-like objects render by name.
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

// Shared muted-text look for meta lines (date · author).
const muted = { opacity: 0.6, fontSize: "0.85rem" };

// Styling ships as inline `style` objects so a listing works in any theme
// without extra CSS; class names are override hooks. Only div/span pass
// node.style through to the renderer (paragraph/image do not), so styled lines
// are emitted as divs. Greys-with-alpha read well on light and dark themes.
const S: Record<string, any> = {
  // Card gap wider than the gaps within a card, so each post reads as one unit.
  summaryStack: { display: "flex", flexDirection: "column", gap: "1.75rem", margin: "1.5rem 0" },
  // The flex row lives on an inner wrapper, not the card: searchfilter toggles
  // the card's inline `display`, which would otherwise clobber `flex`.
  summaryCard: { borderLeft: "3px solid rgba(128,128,128,0.3)", paddingLeft: "1rem" },
  summaryRow: { display: "flex", gap: "1rem", alignItems: "flex-start" },
  // Framed thumbnail: a fixed 3:2 background-image box (not an <image> node) so
  // it can `contain` without cropping logos, giving every card the same footprint.
  coverBase: {
    aspectRatio: "3 / 2",
    boxSizing: "border-box",
    // Semi-transparent white backing keeps dark/transparent logos legible on dark themes.
    backgroundColor: "rgba(255,255,255,0.7)",
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundOrigin: "content-box",
    borderRadius: "8px",
  },
  cover: { width: "100%", padding: "0.6rem", marginBottom: "0.5rem" },
  // Fixed width so the column of summary thumbnails keeps an even right edge.
  summaryThumb: { flexShrink: 0, width: "200px", padding: "0.4rem" },
  title: { margin: "0 0 0.25rem", fontWeight: 600, fontSize: "1.05rem" },
  description: { margin: "0.25rem 0", opacity: 0.8 },
  // Gallery-only: clamp descriptions so every card's text block is the same height.
  descriptionClamp: {
    display: "-webkit-box",
    WebkitLineClamp: "4",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  meta: { margin: "0.1rem 0", ...muted },
  feedStack: { display: "flex", flexDirection: "column", gap: "2rem", margin: "1.5rem 0" },
  // The rule between items lives on the card itself (not a sibling <hr>) so a
  // searchfilter hiding the card hides its rule too. Padding mirrors the stack
  // gap, centering the rule between items.
  feedDivider: { borderTop: "1px solid rgba(128,128,128,0.35)", paddingTop: "2rem" },
  // Identity rail beside the prose. flexWrap stacks the rail above the prose on
  // narrow screens with no media query: the flex-basis values force the wrap.
  feedRow: { display: "flex", flexWrap: "wrap", gap: "1.25rem", alignItems: "flex-start" },
  feedRail: { flex: "0 1 11rem", display: "flex", flexDirection: "column", gap: "0.35rem" },
  feedContent: { flex: "1 1 20rem", minWidth: 0 },
  // `cover` (crop), not coverBase's `contain`: rail images are photos/avatars,
  // where a center crop beats a frame the image only partly fills.
  feedThumb: { width: "100%", backgroundSize: "cover" },
  // Slightly bolder than the byline so dates stand out when scanning the rail.
  feedDate: { ...muted, fontWeight: 600, opacity: 0.75 },
  feedByline: { ...muted, margin: 0 },
  readMore: { margin: "0.75rem 0 0", fontWeight: 600 },
  tags: { display: "inline-flex", flexWrap: "wrap", gap: "0.35rem", margin: "0.5rem 0 0" },
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

// A bold title line (a div, not a heading, so it stays out of the TOC), linked
// to the item when it has a url. Gallery passes linked=false because its card
// is already one link (no nested <a>). Titles may carry inline markup (code,
// emphasis), so parse to inline AST, falling back to plain text.
function titleLine(item: any, linked = true) {
  const text = cellText(item.title);
  const para = ctxRef.parseMyst?.(text)?.children?.find((c: any) => c.type === "paragraph");
  const inlines = para?.children?.length ? para.children : [{ type: "text", value: text }];
  const label = linked && item.url ? [{ type: "link", url: item.url, children: inlines }] : inlines;
  return { type: "div", class: "myst-listing-title", style: S.title, children: [{ type: "strong", children: label }] };
}

// A styled text line.
function line(cls: string, style: any, value: string) {
  return { type: "div", class: cls, style, children: [{ type: "text", value }] };
}

function authorText(item: any): string {
  return cellText(item.authors ?? item.author);
}

// One field's values as a row of tag chips, colored by the field's palette
// slot; null when the field is absent/empty.
function renderTagGroup(values: any, colorIndex: number, extraStyle?: any) {
  const tags = toTagList(values);
  if (tags.length === 0) return null;
  const background = palette[colorIndex % palette.length];
  return {
    type: "span",
    class: "myst-listing-tags",
    style: { ...S.tags, ...extraStyle },
    children: tags.map((t) => ({
      type: "span",
      class: "myst-listing-tag",
      style: { ...S.tag, background },
      children: [{ type: "text", value: t }],
    })),
  };
}

// An item's configured tag fields as colored tag rows, empties skipped.
function renderTagGroups(item: any, node: any, extraStyle?: any) {
  const fields: string[] = node.tagFields ?? ["tags"];
  return fields.map((f, i) => renderTagGroup(item[f], i, extraStyle)).filter(Boolean);
}

// A framed thumbnail (background image on an empty div), or null. Decorative —
// the title link carries the accessible name. `style` picks the footprint.
function coverDiv(item: any, style: any, cls: string) {
  if (!item.thumbnail) return null;
  return {
    type: "div",
    class: cls,
    style: { ...S.coverBase, ...style, backgroundImage: `url("${rawImageSrc(String(item.thumbnail))}")` },
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
    // Tags last, as a footer; margin-top:auto pins it to the card's bottom edge
    // so every card in a row shares the same tag baseline.
    const tagGroups = renderTagGroups(item, node, S.tagsClip);
    const tagFooter =
      tagGroups.length > 0 ? { type: "div", style: { marginTop: "auto" }, children: tagGroups } : null;
    // A flex column filling the card height (the card body is a block, so it
    // can't pin the footer itself).
    const body = {
      type: "div",
      style: { display: "flex", flexDirection: "column", height: "100%" },
      children: [
        coverDiv(item, S.cover, "myst-listing-cover"),
        titleLine(item, false),
        desc && line("myst-listing-description", { ...S.description, ...S.descriptionClamp }, desc),
        tagFooter,
      ].filter(Boolean),
    };
    return { type: "card", class: "myst-listing-card", url: item.url || undefined, children: [body] };
  });
  // A fixed count if asked, else responsive across breakpoints.
  const columns = node.gridColumns ? [node.gridColumns] : [1, 2, 3, 4];
  return { type: "grid", class: "myst-listing myst-listing-gallery", columns, children: cards };
}

// Description-forward stacked cards: a content column with the thumbnail, if
// any, beside it on the right.
function renderSummary(items: any[], node: any) {
  const cards = items.map((item) => {
    // One muted line, e.g. "May 20, 2026 · Jane Doe".
    const meta = [cellText(item.date), authorText(item)].filter(Boolean).join(" · ");
    const content = {
      type: "div",
      // minWidth:0 lets the column shrink and wrap instead of overflowing.
      style: { flex: 1, minWidth: 0 },
      children: [
        titleLine(item),
        meta && line("myst-listing-meta", S.meta, meta),
        item.description && line("myst-listing-description", S.description, cellText(item.description)),
        ...renderTagGroups(item, node),
      ].filter(Boolean),
    };
    const thumb = coverDiv(item, S.summaryThumb, "myst-listing-thumb");
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

// Demote body headings to bold divs so every post's H2s don't land in the
// page's TOC (at the cost of heading semantics for screen readers). Sizes stay
// at or below the item title's 1.05rem.
const headingSize = ["1.05rem", "1rem", "0.95rem", "0.9rem", "0.85rem", "0.8rem"];
function demoteHeading(n: any): any {
  if (n?.type !== "heading") return n;
  const size = headingSize[Math.min((n.depth ?? 1) - 1, headingSize.length - 1)];
  return {
    type: "div",
    class: "myst-listing-heading",
    style: { fontWeight: 600, fontSize: size, margin: "1rem 0 0.5rem" },
    children: n.children,
  };
}

// An item's body blocks: a file's parsed body, else its description as one
// paragraph (so yaml items still show something). A leading H1 is dropped —
// it duplicates the title.
function itemBody(item: any): any[] {
  let body: any[] = Array.isArray(item.body) ? item.body : [];
  if (body.length === 0 && item.description) {
    body = [{ type: "paragraph", class: "myst-listing-description", children: [{ type: "text", value: cellText(item.description) }] }];
  }
  if (body[0]?.type === "heading" && body[0].depth === 1) body = body.slice(1);
  return body;
}

// Read-down items: an identity rail (image, date, author, tags) beside the
// linked title and rendered body, items after the first topped by a rule.
// Design notes: docs/displays/feed.md.
function renderFeed(items: any[], node: any) {
  // A :body-limit: of 0 or less means "no limit", not an empty entry.
  const limit = node.bodyLimit > 0 ? node.bodyLimit : undefined;
  const cards = items.map((item, i) => {
    const date = cellText(item.date);
    const author = authorText(item);
    // Tags live in the rail with the other scan-metadata — a tag footer as in
    // gallery/summary would be lost below a long body.
    const rail = [
      coverDiv(item, S.feedThumb, "myst-listing-thumb"),
      date && line("myst-listing-meta", S.feedDate, date),
      author && line("myst-listing-meta", S.feedByline, author),
      ...renderTagGroups(item, node),
    ].filter(Boolean);
    // Only truncate items with a url: cutting a body with no page to link to
    // would silently lose content.
    let body = itemBody(item);
    const truncated = limit && item.url && body.length > limit;
    if (truncated) {
      body = body.slice(0, limit);
      // Don't end an item on a section heading with nothing under it.
      while (body.length && body[body.length - 1].type === "heading") body.pop();
      body.push({
        type: "div",
        class: "myst-listing-readmore",
        style: S.readMore,
        children: [{ type: "link", url: item.url, children: [{ type: "text", value: "Continue reading →" }] }],
      });
    }
    body = body.map(demoteHeading);
    const content = { type: "div", style: S.feedContent, children: [titleLine(item), ...body] };
    const railCol =
      rail.length > 0 ? { type: "div", class: "myst-listing-rail", style: S.feedRail, children: rail } : null;
    const row = { type: "div", style: S.feedRow, children: railCol ? [railCol, content] : [content] };
    // myst-listing-item is the searchfilter hook (see renderTable).
    return {
      type: "div",
      class: "myst-listing-card myst-listing-item",
      style: i ? S.feedDivider : undefined,
      children: [row],
    };
  });
  return { type: "div", class: "myst-listing myst-listing-feed", style: S.feedStack, children: cards };
}

/** Built-in displays, keyed by `:display:`. */
export const displays: Record<string, Display> = {
  table: renderTable,
  gallery: renderGallery,
  summary: renderSummary,
  feed: renderFeed,
};
