/**
 * Display layer. A display turns the (already filtered/sorted/limited) items
 * into a single AST node. Add a built-in view by adding a key to `displays`;
 * an external plugin adds one the same way a collector does — a document-stage
 * transform that finds `listingPlaceholder` nodes whose `:display:` it owns
 * (with `node.items` already set) and replaces them with its rendered AST.
 * Our render leaves placeholders with an unknown display untouched so that
 * transform can claim them before the project-stage cleanup has the last word.
 */
export type Display = (items: any[], node: any) => any;

function cellText(value: any): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

// --- Shared role helpers (used by gallery + summary) ------------------------
//
// Styling ships *with the plugin* as inline `style` objects on the nodes, so a
// listing looks right in any theme with no extra CSS. `div`/`span` pass
// `node.style` through to the renderer (`paragraph`/`image` do not). The gallery
// reuses MyST's own `grid`/`card` nodes for the responsive grid and the
// (accessible, clickable) card shell, and we style the bits *inside* the card.
// Greys-with-alpha read well on light and dark themes; `class` names stay as
// override hooks.

const S: Record<string, any> = {
  summaryStack: { display: "flex", flexDirection: "column", gap: "1.1rem", margin: "1.5rem 0" },
  // The flex row lives on an inner wrapper, not the card itself: searchfilter
  // toggles the card's inline `display`, which would otherwise clobber `flex`.
  summaryCard: { borderLeft: "3px solid rgba(128,128,128,0.3)", paddingLeft: "1rem" },
  summaryRow: { display: "flex", gap: "1rem", alignItems: "flex-start" },
  summaryThumb: { flexShrink: 0, display: "flex", borderRadius: "8px", overflow: "hidden" },
  cover: { display: "flex", justifyContent: "center", marginBottom: "0.6rem" },
  title: { margin: "0.7rem 0 0.3rem", fontWeight: 600, fontSize: "1.05rem" },
  description: { margin: "0.3rem 0", opacity: 0.8 },
  meta: { margin: "0.1rem 0", opacity: 0.6, fontSize: "0.85rem" },
  tags: { display: "inline-flex", flexWrap: "wrap", gap: "0.35rem", margin: "0.45rem 0" },
  tag: {
    fontSize: "0.75rem",
    padding: "0.1rem 0.6rem",
    borderRadius: "999px",
    background: "rgba(128,128,128,0.18)",
    whiteSpace: "nowrap",
  },
};

// A bold title line (a div, not a heading, so it stays out of the TOC), linking
// to the item when it has a url.
function titleLine(item: any) {
  const text = cellText(item.title);
  const label = item.url
    ? { type: "link", url: item.url, children: [{ type: "text", value: text }] }
    : { type: "text", value: text };
  return { type: "div", class: "myst-listing-title", style: S.title, children: [{ type: "strong", children: [label] }] };
}

function truncate(s: string, n = 140) {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

// A styled text line.
function line(cls: string, style: any, value: string) {
  return { type: "div", class: cls, style, children: [{ type: "text", value }] };
}

// Tags → a row of pill spans. Null when there are none (caller omits it).
function renderTags(tags: any) {
  if (!Array.isArray(tags) || tags.length === 0) return null;
  return {
    type: "span",
    class: "myst-listing-tags",
    style: S.tags,
    children: tags.map((t) => ({
      type: "span",
      class: "myst-listing-tag",
      style: S.tag,
      children: [{ type: "text", value: String(t) }],
    })),
  };
}

// Centered cover image, or null when there is no thumbnail.
function renderCover(item: any) {
  if (!item.thumbnail) return null;
  return {
    type: "div",
    class: "myst-listing-cover",
    style: S.cover,
    children: [{ type: "image", url: String(item.thumbnail), alt: cellText(item.title), height: "120px" }],
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
    // `myst-listing-item` on data rows only (not the header) lets searchfilter
    // target `.myst-listing-item` and keep the header visible while filtering.
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

// Image-forward grid of cards. We reuse MyST's `grid` + `card` nodes: a `card`
// with a `url` is the built-in clickable card (one accessible link over the
// whole card, with the theme's hover affordance and no link-tinted text), and
// `grid` lays them out responsively. We supply the contents — cover image,
// title, pill tags, truncated description — and style those inline.
function renderGallery(items: any[], node: any) {
  const cards = items.map((item) => {
    const desc = cellText(item.description);
    return {
      type: "card",
      class: "myst-listing-card",
      url: item.url || undefined,
      children: [
        renderCover(item),
        { type: "cardTitle", children: [{ type: "text", value: cellText(item.title) }] },
        renderTags(item.tags),
        desc && line("myst-listing-description", S.description, truncate(desc)),
      ].filter(Boolean),
    };
  });
  // A fixed count if asked, else MyST's responsive 1→4 across breakpoints.
  const columns = node.gridColumns ? [node.gridColumns] : [1, 2, 3, 4];
  return { type: "grid", class: "myst-listing myst-listing-gallery", columns, children: cards };
}

// Description-forward stacked cards: a content column (title, date meta, full
// description, tags) with the thumbnail, if any, floated to its right.
function renderSummary(items: any[]) {
  const cards = items.map((item) => {
    const content = {
      type: "div",
      style: { flex: 1, minWidth: 0 },
      children: [
        titleLine(item),
        item.date && line("myst-listing-meta", S.meta, cellText(item.date)),
        item.description && line("myst-listing-description", S.description, cellText(item.description)),
        renderTags(item.tags),
      ].filter(Boolean),
    };
    const thumb = item.thumbnail && {
      type: "div",
      class: "myst-listing-thumb",
      style: S.summaryThumb,
      children: [{ type: "image", url: String(item.thumbnail), alt: cellText(item.title), width: "160px" }],
    };
    const row = { type: "div", style: S.summaryRow, children: thumb ? [content, thumb] : [content] };
    return {
      type: "div",
      // `myst-listing-item` is the common filtering hook (see renderTable).
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
