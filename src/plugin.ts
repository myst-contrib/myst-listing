/**
 * MyST Listing: a {listing} directive that collects items and displays them.
 * Pipeline: directive emits a listingPlaceholder -> collect.ts fills node.items
 * -> transform.ts filters/sorts/limits -> the render transform here picks a display.ts view.
 * See docs/develop/extending.md for the extension points.
 */
import {
  fileWarn,
  normalizeLabel,
  type DirectiveSpec,
  type TransformSpec,
} from "myst-common";
import { PLACEHOLDER, ctxRef } from "./shared.js";
import { collectTransform } from "./collect.js";
import { displays } from "./display.js";
import { selectItems } from "./transform.js";

const csv = (s: string) => s.split(",").map((c) => c.trim()).filter(Boolean);

const listingDirective: DirectiveSpec = {
  name: "listing",
  doc: "Collect items and display them as a table, list, gallery, summary, feed, or sections.",
  body: { type: String, doc: "Inline list of items (used with source: yaml, json, or toml)." },
  options: {
    source: { type: String, doc: "Where items come from: 'files', 'toc', 'yaml', 'json', or 'toml'. Default 'files'." },
    display: { type: String, doc: "View: 'table', 'list', 'gallery', 'summary', 'feed', or 'sections'. Default 'table'." },
    path: { type: String, doc: "Glob for 'files' (default './*.md'), page whose toc children 'toc' lists (default: this page), or path to a .yml/.json/.toml file. Relative to the page." },
    sort: { type: String, doc: "Sort by 'field' (ascending), 'field-asc', 'field-desc', or 'random'. Default 'date-desc' (toc order for 'toc')." },
    limit: { type: Number, doc: "Maximum number of items. Default 10 (no limit for 'toc'); 0 or less means no limit." },
    filter: { type: String, doc: "Keep only items where field=value." },
    sortable: { type: Boolean, doc: "Let readers re-sort the table by clicking its column headers. Table display only." },
    columns: { type: String, doc: "Comma-separated fields for the table and list views. Default 'title,date' (table) or 'title,description' (list)." },
    "tag-fields": { type: String, doc: "Frontmatter fields shown as colored tag groups (all displays except table). Default 'tags'." },
    "grid-columns": { type: Number, doc: "Gallery only: number of columns. Default: responsive 1–4." },
    "body-limit": { type: Number, doc: "Feed only: cap each item's body to N blocks, with a 'Continue reading' link. Default: full body." },
    label: { type: String, doc: "Label to target this listing from links or ![](#label) embeds." },
  },
  run(data, vfile, ctx) {
    if (!ctxRef.parseMyst && ctx?.parseMyst) ctxRef.parseMyst = ctx.parseMyst;
    const o = data.options ?? {};
    if (o.sortable && (o.display ?? "table") !== "table") {
      fileWarn(vfile, `:sortable: only works with the table display (ignored for '${o.display}')`, {
        node: data.node,
        source: "listing",
      });
    }
    const { label, identifier } = normalizeLabel(o.label as string | undefined) ?? {};
    return [
      {
        type: PLACEHOLDER,
        children: [],
        label,
        identifier,
        source: (o.source as string) ?? "files",
        display: o.display as string | undefined,
        path: o.path as string | undefined,
        body: data.body as string | undefined,
        sort: o.sort as string | undefined,
        limit: o.limit as number | undefined,
        filter: o.filter as string | undefined,
        columns: o.columns ? csv(o.columns as string) : undefined,
        sortable: o.sortable as boolean | undefined,
        tagFields: o["tag-fields"] ? csv(o["tag-fields"] as string) : undefined,
        gridColumns: o["grid-columns"] as number | undefined,
        bodyLimit: o["body-limit"] as number | undefined,
      },
    ];
  },
};

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

/** Replace a placeholder in place with a finished node, keeping any reference
 * target (from :label: or a `(target)=` line) so links and ![](#label) embeds
 * still resolve. */
function replace(node: any, out: any) {
  const target = { label: node.label, identifier: node.identifier, html_id: node.html_id };
  for (const key of Object.keys(node)) if (key !== "type") delete node[key];
  Object.assign(node, out);
  for (const [key, value] of Object.entries(target)) if (value) node[key] = value;
}

/** Turn a placeholder with items (or an error) into its display node. */
function finalize(node: any, vfile: any) {
  if (node.error) {
    fileWarn(vfile, `Listing collect failed: ${node.error}`, { node, source: "listing" });
    return replace(node, errorNode(`Could not collect items: ${node.error}`));
  }
  const items = selectItems(node.items ?? [], node);
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
  replace(node, display(items, node, vfile));
}

const renderTransform: TransformSpec = {
  name: "listing-render",
  // Document stage (after our collector) so the title links we emit are still
  // resolved by MyST's link resolver, which runs at the start of project stage.
  stage: "document",
  doc: "Render {listing} placeholders into their chosen display.",
  plugin: (_opts, utils) => (tree, vfile) => {
    for (const node of utils.selectAll(PLACEHOLDER, tree) as any[]) {
      // Defaults live here, in selectItems and in each display, not in the
      // directive, so wrapper directives (see extending.md) needn't copy them.
      node.display ??= "table";
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
