/**
 * MyST Listing: a {listing} directive that collects items and displays them.
 * Pipeline: directive emits a listingPlaceholder -> collect.ts fills node.items
 * -> the render transform here filters/sorts/limits and picks a display.ts view.
 * See docs/extending.md for the extension points.
 */
import { createId, fileWarn, type DirectiveSpec, type TransformSpec } from "myst-common";
import { PLACEHOLDER, ctxRef } from "./shared.js";
import { collectTransform } from "./collect.js";
import { displays, sortValue } from "./display.js";
import { sortWidgetEsm } from "./sort-widget.js";

const csv = (s: string) => s.split(",").map((c) => c.trim()).filter(Boolean);

const listingDirective: DirectiveSpec = {
  name: "listing",
  doc: "Collect items and display them as a table, gallery, summary, or feed.",
  body: { type: String, doc: "Inline list of items (used with source: yaml or toml)." },
  options: {
    source: { type: String, doc: "Where items come from: 'files', 'yaml', or 'toml'. Default 'files'." },
    display: { type: String, doc: "View: 'table', 'gallery', 'summary', or 'feed'. Default 'table'." },
    path: { type: String, doc: "Glob for 'files' (default './*.md'), or path to a .yml/.toml file. Relative to the page." },
    sort: { type: String, doc: "Sort by 'field' (ascending), 'field-asc', 'field-desc', or 'random'. Default 'date-desc'." },
    limit: { type: Number, doc: "Maximum number of items. Default 10; 0 or less means no limit." },
    filter: { type: String, doc: "Keep only items where field=value." },
    sortable: { type: Boolean, doc: "Let readers re-sort the table by clicking its column headers. Table display only." },
    columns: { type: String, doc: "Comma-separated fields for the table view. Default 'title,date'." },
    "tag-fields": { type: String, doc: "Frontmatter fields shown as colored tag groups (all displays except table). Default 'tags'." },
    "grid-columns": { type: Number, doc: "Gallery only: number of columns. Default: responsive 1–4." },
    "body-limit": { type: Number, doc: "Feed only: cap each item's body to N blocks, with a 'Continue reading' link. Default: full body." },
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
        body: data.body as string | undefined,
        sort: (o.sort as string) ?? "date-desc",
        limit: (o.limit as number) ?? 10,
        filter: o.filter as string | undefined,
        columns: csv((o.columns as string) ?? "title,date"),
        sortable: o.sortable as boolean | undefined,
        tagFields: csv((o["tag-fields"] as string) ?? "tags"),
        gridColumns: o["grid-columns"] as number | undefined,
        bodyLimit: o["body-limit"] as number | undefined,
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

/** Fisher-Yates shuffle. */
function shuffle(items: any[]) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Compare two sort keys. Shared by the build-time sort and the client-side
 * interactive sort. If a value is empty, it is always last. */
function compareValues(a: string | number | null, b: string | number | null, dir: number) {
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

function noteNode(message: string) {
  return {
    type: "paragraph",
    class: "myst-listing",
    children: [{ type: "emphasis", children: [{ type: "text", value: message }] }],
  };
}

/** There is no mdast error node, so errors render as an error admonition.
 * Always pair with a fileWarn. */
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

/** Replace a placeholder in place with a finished node. */
function replace(node: any, out: any) {
  for (const key of Object.keys(node)) if (key !== "type") delete node[key];
  Object.assign(node, out);
}

/** Turn a placeholder with items (or an error) into its display node. */
function finalize(node: any, vfile: any) {
  if (node.error) {
    fileWarn(vfile, `Listing collect failed: ${node.error}`, { node, source: "listing" });
    return replace(node, errorNode(`Could not collect items: ${node.error}`));
  }
  let items = applyFilter(node.items ?? [], node.filter);
  items = sortItems(items, node.sort);
  // A :limit: of 0 or less means "no limit" (same convention as :body-limit:).
  if (node.limit > 0) items = items.slice(0, node.limit);
  if (items.length === 0) return replace(node, noteNode("No items found."));
  let display = displays[node.display];
  // Only reachable from the project-stage cleanup: renderTransform skips
  // displays it doesn't know, leaving them for an external plugin to claim.
  if (!display) {
    fileWarn(vfile, `Unknown listing display '${node.display}', using 'table'`, {
      node,
      source: "listing",
    });
    display = displays.table;
  }
  const out = display(items, node);
  if (!node.sortable) return replace(node, out);
  if (node.display !== "table") {
    fileWarn(vfile, `:sortable: only works with the table display (ignored for '${node.display}')`, {
      node,
      source: "listing",
    });
    return replace(node, out);
  }
  // For each column, list the row order for an ascending and a descending
  // sort. The browser only rearranges rows to match these lists, so clicking
  // a header sorts exactly as :sort: would (dates, empties, ties and all).
  const orders: Record<string, number[]> = {};
  for (const col of node.columns) {
    const vals = items.map((it: any) => sortValue(it[col]));
    for (const dir of [1, -1]) {
      orders[`${col}:${dir}`] = items
        .map((_: any, i: number) => i)
        .sort((a, b) => compareValues(vals[a], vals[b], dir));
    }
  }
  const id = createId();
  // The sort widget locates its table by this class (see sort-widget.ts).
  out.class = `${out.class} myst-listing-sort-${id}`;
  const widget = {
    type: "anywidget",
    esm: sortWidgetEsm(vfile),
    model: { id, columns: node.columns, orders },
  };
  replace(node, { type: "div", children: [widget, out] });
}

const renderTransform: TransformSpec = {
  name: "listing-render",
  // Document stage (after our collector) so the title links we emit are still
  // resolved by MyST's link resolver, which runs at the start of project stage.
  stage: "document",
  doc: "Render {listing} placeholders into their chosen display.",
  plugin: (_opts, utils) => (tree, vfile) => {
    for (const node of utils.selectAll(PLACEHOLDER, tree) as any[]) {
      // Only finalize what we can render now; leave the rest for an external
      // collector/view to claim. The project-stage cleanup is the last responder.
      if (node.error || (node.items !== undefined && displays[node.display])) {
        finalize(node, vfile);
      }
    }
  },
};

const cleanupTransform: TransformSpec = {
  name: "listing-cleanup",
  // Project stage runs after every document-stage collector, so a placeholder
  // still lacking items here has no collector and is safe to call unknown.
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
