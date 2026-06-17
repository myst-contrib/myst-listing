/**
 * MyST Listing: a {listing} directive that collects items and displays them.
 * Pipeline: directive emits a listingPlaceholder -> collect.ts fills node.items
 * -> the render transform here filters/sorts/limits and picks a display.ts view.
 * See docs/extending.md for the extension points.
 */
import { fileWarn, type DirectiveSpec, type TransformSpec } from "myst-common";
import { PLACEHOLDER, ctxRef } from "./shared.js";
import { collectTransform } from "./collect.js";
import { displays } from "./display.js";

// Parse a comma-separated option into a trimmed, non-empty list.
const csv = (s: string) => s.split(",").map((c) => c.trim()).filter(Boolean);

const listingDirective: DirectiveSpec = {
  name: "listing",
  doc: "Collect items and display them as a table, gallery, or summary.",
  options: {
    source: { type: String, doc: "Where items come from: 'files' or 'yaml'. Default 'files'." },
    display: { type: String, doc: "View: 'table', 'gallery', or 'summary'. Default 'table'." },
    path: { type: String, doc: "Glob for 'files' (default './*.md') or path to a .yml for 'yaml'." },
    sort: { type: String, doc: "Sort by 'field', 'field-asc', 'field-desc', or 'random'. Default 'date-desc'." },
    limit: { type: Number, doc: "Maximum number of items. Default 10." },
    filter: { type: String, doc: "Keep only items where field=value." },
    columns: { type: String, doc: "Comma-separated fields for the table view. Default 'title,date'." },
    "tag-fields": { type: String, doc: "Gallery/summary: frontmatter fields shown as colored pill groups. Default 'tags'." },
    "grid-columns": { type: Number, doc: "Gallery only: number of columns. Default: responsive 1–4." },
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
        columns: csv((o.columns as string) ?? "title,date"),
        tagFields: csv((o["tag-fields"] as string) ?? "tags"),
        gridColumns: o["grid-columns"] as number | undefined,
      },
    ];
  },
};

function applyFilter(items: any[], filter?: string) {
  if (!filter) return items;
  const eq = filter.indexOf("=");
  if (eq < 0) return items; // only field=value is supported
  const field = filter.slice(0, eq).trim();
  const value = filter.slice(eq + 1).trim();
  return items.filter((it) => {
    const v = it[field];
    // List fields (e.g. tags) match if they contain the value.
    if (Array.isArray(v)) return v.map(String).includes(value);
    return String(v ?? "") === value;
  });
}

// Fisher-Yates shuffle (unbiased, unlike a `sort(() => Math.random())`).
function shuffle(items: any[]) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function sortItems(items: any[], sort: string) {
  if (sort === "random") return shuffle(items);
  // Only a trailing "-asc"/"-desc" is a direction; otherwise the whole string
  // is the field name (so a dash-less "title" stays "title", not "titl").
  const dash = sort.lastIndexOf("-");
  const suffix = dash >= 0 ? sort.slice(dash + 1) : "";
  const hasOrder = suffix === "asc" || suffix === "desc";
  const field = hasOrder ? sort.slice(0, dash) : sort;
  const ascending = suffix !== "desc";
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

// A muted note for the empty state ("No items found").
function noteNode(message: string) {
  return {
    type: "paragraph",
    class: "myst-listing",
    children: [{ type: "emphasis", children: [{ type: "text", value: message }] }],
  };
}

// Errors render as MyST's error admonition (there is no mdast error node).
// Always pair errorNode with a fileWarn.
function errorNode(message: string) {
  return {
    type: "admonition",
    kind: "error",
    class: "myst-listing",
    children: [
      { type: "admonitionTitle", children: [{ type: "text", value: "Listing error" }] },
      { type: "paragraph", children: [{ type: "text", value: message }] },
    ],
  };
}

// Replace a placeholder in place with a finished node.
function replace(node: any, out: any) {
  for (const key of Object.keys(node)) if (key !== "type") delete node[key];
  Object.assign(node, out);
}

// Turn a placeholder that has items (or an error) into its display node.
function finalize(node: any, vfile: any) {
  if (node.error) {
    fileWarn(vfile, `Listing collect failed: ${node.error}`, { node, source: "listing" });
    return replace(node, errorNode(`Could not collect items: ${node.error}`));
  }
  let items = applyFilter(node.items ?? [], node.filter);
  items = sortItems(items, node.sort).slice(0, node.limit);
  if (items.length === 0) return replace(node, noteNode("No items found."));
  // An unknown built-in display is a typo: warn and fall back to the table.
  let display = displays[node.display];
  if (!display) {
    fileWarn(vfile, `Unknown listing display '${node.display}', using 'table'`, {
      node,
      source: "listing",
    });
    display = displays.table;
  }
  replace(node, display(items, node));
}

const renderTransform: TransformSpec = {
  name: "listing-render",
  // Document stage (after our collector) so the title links we emit are still
  // resolved by MyST's link resolver, which runs at the start of project stage.
  stage: "document",
  doc: "Render {listing} placeholders into their chosen display.",
  plugin: (_opts, utils) => (tree, vfile) => {
    for (const node of utils.selectAll(PLACEHOLDER, tree) as any[]) {
      // Only finalize what we can render now: items collected and a known
      // display. Leave anything else for an external collector/view to claim;
      // the project-stage cleanup is the last responder.
      if (node.error || (node.items !== undefined && displays[node.display])) {
        finalize(node, vfile);
      }
    }
  },
};

const cleanupTransform: TransformSpec = {
  name: "listing-cleanup",
  // Project stage runs after every document-stage collector (ours or an
  // external plugin's). A placeholder still lacking items here has no
  // collector for its source, so it's safe to call unknown.
  stage: "project",
  doc: "Warn on {listing} placeholders no collector claimed.",
  plugin: (_opts, utils) => (tree, vfile) => {
    for (const node of utils.selectAll(PLACEHOLDER, tree) as any[]) {
      if (node.items === undefined && !node.error) {
        fileWarn(vfile, `Unknown listing source '${node.source}'`, { node, source: "listing" });
        replace(node, errorNode(`Unknown listing source: '${node.source}'`));
      } else {
        // A late external collector filled it; render it now.
        finalize(node, vfile);
      }
    }
  },
};

const plugin = {
  name: "MyST Listing",
  directives: [listingDirective],
  transforms: [collectTransform, renderTransform, cleanupTransform],
};

export default plugin;
