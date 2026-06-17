/**
 * Display layer. A display turns the (already filtered/sorted/limited) items
 * into a single AST node. Add a built-in view via the `displays` map below.
 * See docs/extending.md for adding one from an external plugin.
 */
export type Display = (items: any[], node: any) => any;

function cellText(value: any): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.join(", ");
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
  // Fixed-height box that centers the image: the box keeps every card's cover
  // the same height, so wide images letterbox inside it instead of shrinking it.
  cover: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "140px",
    overflow: "hidden",
    marginBottom: "0.6rem",
  },
  title: { margin: "0.7rem 0 0.3rem", fontWeight: 600, fontSize: "1.05rem" },
  description: { margin: "0.3rem 0", opacity: 0.8 },
  meta: { margin: "0.1rem 0", opacity: 0.6, fontSize: "0.85rem" },
  tags: { display: "inline-flex", flexWrap: "wrap", gap: "0.35rem", margin: "0.45rem 0" },
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

// A bold title line (a div, not a heading, so it stays out of the TOC),
// linked to the item when it has a url.
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

// One field's values → a row of pills, colored by the field's palette slot.
// Null when the field is absent/empty (caller omits it).
function renderTagGroup(values: any, colorIndex: number) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const background = palette[colorIndex % palette.length];
  return {
    type: "span",
    class: "myst-listing-tags",
    style: S.tags,
    children: values.map((t) => ({
      type: "span",
      class: "myst-listing-tag",
      style: { ...S.tag, background },
      children: [{ type: "text", value: String(t) }],
    })),
  };
}

// An item's configured tag fields as colored pill rows, empties skipped.
function renderTagGroups(item: any, node: any) {
  const fields: string[] = node.tagFields ?? ["tags"];
  return fields.map((f, i) => renderTagGroup(item[f], i)).filter(Boolean);
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
        { type: "cardTitle", children: [{ type: "text", value: cellText(item.title) }] },
        ...renderTagGroups(item, node),
        desc && line("myst-listing-description", S.description, truncate(desc)),
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
    const content = {
      type: "div",
      style: { flex: 1, minWidth: 0 },
      children: [
        titleLine(item),
        item.date && line("myst-listing-meta", S.meta, cellText(item.date)),
        item.description && line("myst-listing-description", S.description, cellText(item.description)),
        ...renderTagGroups(item, node),
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
