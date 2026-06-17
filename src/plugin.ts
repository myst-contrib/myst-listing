/**
 * MyST Listing — collect items, transform them, and display them.
 *
 * Pipeline (see .ai/plans spec):
 *   {listing} directive  ->  listingPlaceholder node
 *   collect  (document stage, collect.ts)  ->  attaches node.items
 *   render   (document stage, after collect) ->  filter/sort/limit + pick a display
 *
 * Files are split by layer: collect.ts (sources), display.ts (views), and this
 * spine (the directive, the transform middle-layer, and the wiring).
 */
import type { DirectiveSpec, TransformSpec } from "myst-common";
import { PLACEHOLDER, ctxRef } from "./shared.js";
import { collectTransform } from "./collect.js";
import { displays } from "./display.js";

// --- Directive: validate options, emit a placeholder ------------------------

const listingDirective: DirectiveSpec = {
  name: "listing",
  doc: "Collect items and display them as a table, gallery, or summary.",
  options: {
    source: { type: String, doc: "Where items come from: 'files' or 'yaml'. Default 'files'." },
    display: { type: String, doc: "View: 'table', 'gallery', or 'summary'. Default 'table'." },
    path: { type: String, doc: "Glob for 'files' (default './*.md') or path to a .yml for 'yaml'." },
    sort: { type: String, doc: "Sort by 'field', 'field-asc', or 'field-desc'. Default 'date-desc'." },
    limit: { type: Number, doc: "Maximum number of items. Default 10." },
    filter: { type: String, doc: "Keep only items where field=value." },
    columns: { type: String, doc: "Comma-separated fields for the table view. Default 'title,date'." },
  },
  run(data, _vfile, ctx) {
    if (!ctxRef.parseMyst && ctx?.parseMyst) ctxRef.parseMyst = ctx.parseMyst;
    const o = data.options ?? {};
    return [
      {
        type: PLACEHOLDER,
        children: [],
        source: (o.source as string) ?? "files",
        display: (o.display as string) ?? "table",
        path: o.path as string | undefined,
        sort: (o.sort as string) ?? "date-desc",
        limit: (o.limit as number) ?? 10,
        filter: o.filter as string | undefined,
        columns: ((o.columns as string) ?? "title,date")
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      },
    ];
  },
};

// --- Transform middle-layer: filter / sort / limit --------------------------

function applyFilter(items: any[], filter?: string) {
  if (!filter) return items;
  const eq = filter.indexOf("=");
  if (eq < 0) return items; // ponytail: equality only; grammar reserved for !=, etc.
  const field = filter.slice(0, eq).trim();
  const value = filter.slice(eq + 1).trim();
  return items.filter((it) => {
    const v = it[field];
    // List fields (e.g. tags) match if they contain the value.
    if (Array.isArray(v)) return v.map(String).includes(value);
    return String(v ?? "") === value;
  });
}

function sortItems(items: any[], sort: string) {
  const dash = sort.lastIndexOf("-");
  const order = dash >= 0 ? sort.slice(dash + 1) : "asc";
  const field = order === "asc" || order === "desc" ? sort.slice(0, dash) : sort;
  const ascending = order !== "desc";
  return [...items].sort((a, b) => {
    let av = a[field];
    let bv = b[field];
    // Dates (YAML auto-parses them) compare by timestamp, not string.
    if (av instanceof Date) av = av.getTime();
    if (bv instanceof Date) bv = bv.getTime();
    if (!av && !bv) return 0;
    if (!av) return 1; // empties last
    if (!bv) return -1;
    const c = String(av).localeCompare(String(bv), undefined, { numeric: true });
    return ascending ? c : -c;
  });
}

// --- Render transform: replace each placeholder with its display ------------

function noteNode(message: string) {
  return {
    type: "paragraph",
    class: "myst-listing",
    children: [{ type: "emphasis", children: [{ type: "text", value: message }] }],
  };
}

const renderTransform: TransformSpec = {
  name: "listing-render",
  // Document stage (after our collector) so the title links we emit still get
  // resolved by MyST's link resolver, which runs at the start of project stage.
  stage: "document",
  doc: "Render {listing} placeholders into their chosen display.",
  plugin: (_opts, utils) => (tree) => {
    for (const node of utils.selectAll(PLACEHOLDER, tree) as any[]) {
      let out: any;
      if (node.error) {
        out = noteNode(`Listing error: ${node.error}`);
      } else {
        let items = applyFilter(node.items ?? [], node.filter);
        items = sortItems(items, node.sort).slice(0, node.limit);
        out =
          items.length === 0
            ? noteNode("No items found.")
            : (displays[node.display] ?? displays.table)(items, node);
      }
      // Replace the placeholder in place.
      for (const key of Object.keys(node)) if (key !== "type") delete node[key];
      Object.assign(node, out);
    }
  },
};

const plugin = {
  name: "MyST Listing",
  directives: [listingDirective],
  transforms: [collectTransform, renderTransform],
};

export default plugin;
