---
title: Extending
description: Add a collector or display, either built into this repo or from your own plugin.
---

There are two ways to add a new `:source:` or `:display:`:

- [Built into this repo](#built-in): add a function to a map in `src/`. Use this for sources and displays most users would want.
- [From a separate plugin](#separate-plugin): ship a MyST plugin that fills in the {term}`placeholder` nodes. Use this for anything specific to your project.

(built-in)=

## Built into this repo

### Add a built-in display

A display takes the items and returns a single AST node.
It also gets the placeholder `node` (for its options) and the page's `vfile`.
Defaults and options that only one display uses belong inside that display, like `renderTable`'s handling of `:sortable:`.
Add a function to the `displays` map in `src/display.ts`:

```ts
function renderCount(items: any[]) {
  return { type: "paragraph", children: [{ type: "text", value: `${items.length} items` }] };
}

export const displays = { table: renderTable, count: renderCount };
```

Now `:display: count` works:

````markdown
```{listing}
:path: posts/*.md
:display: count
```
````

### Add a built-in collector

A collector fills `node.items`.
Add a function to the `collectors` map in `src/collect.ts`.

For a structured-data format, pass a parse function to `collectData`.
It reads the directive body or the `:path:` file, checks for a list, and skips entries with no title.
For example, the `json` source is one line:

```ts
json: (node, vfile) => collectData(node, vfile, JSON.parse, "a top-level list"),
```

Other sources set `node.items` themselves; see `collectFiles` and `collectToc`.

### Change sorting or filtering

The Transform stage lives in `src/transform.ts`, behind `selectItems(items, node)`.
To add a new behaviour, read a new option off the {term}`placeholder` inside `selectItems`.
It's pure (a list of items in, a list of items out), so you can unit-test it without building the docs.
The Transform stage can only be changed here, not from a separate plugin.

(separate-plugin)=

## From a separate plugin

The `{listing}` directive emits a `listingPlaceholder` node carrying the user's options (`source`, `display`, `path`, `sort`, `limit`, ...).
Each option is a field of the same name, camelCased when hyphenated (`:tag-fields:` → `node.tagFields`), and left unset when the user didn't give it.
Collectors fill in the rest:

- `items`: the list of items.
- `ordered`: set to `true` if the item order is meaningful (as the `toc` source does). This skips the default `date-desc` sort and limit of 10.
- `error`: a message to show instead of the listing. myst-listing warns and renders it as an error box.

Your plugin should ship a `document`-stage transform that selects those nodes and either:

- **collects**: sets `node.items` to a list of items (a collector), or
- **displays**: replaces a node whose `:display:` you own with your rendered AST (a display).

An item is a plain object; see [Items](#items) for the fields the built-ins understand.

### Staging and ordering

Transforms in MyST can run in one of two stages: `document` first, and `project` after.
For your transform to run at the right time:

- Run at the `document` stage. `myst-listing` resolves title links during this stage, so items collected later won't link correctly.
- Run before `myst-listing`'s render. Cross-plugin order follows load order in `myst.yml`, so list your plugin before `myst-listing` there.
- A node whose `:source:` or `:display:` `myst-listing` doesn't recognize is left untouched through the document stage, so your transform can claim it. Anything still unclaimed by the project stage is reported as an unknown source.

### Add a collector

Set `node.items` for the source you own; leave the rest alone:

```javascript
const collectStars = {
  name: "listing-collect-stars",
  stage: "document",
  plugin: (_opts, utils) => async (tree) => {
    for (const node of utils.selectAll("listingPlaceholder", tree)) {
      if (node.source !== "stars") continue;        // only the source we own
      node.items = await fetchStars(node.path);      // your async logic here
    }
  },
};

export default { name: "Listing stars", transforms: [collectStars] };
```

Load both plugins in `myst.yml` (yours first), and `:source: stars` now works.

### Wrap it in your own directive

A collector plugin can also ship its own directive, so users write `{stars}` instead of a `{listing}` with `:source: stars`.
The directive emits the same placeholder node that `{listing}` would, and your collector and myst-listing take it from there:

```javascript
const starsDirective = {
  name: "stars",
  arg: { type: String, doc: "GitHub repository in org/repo format" },
  run: (data) => [
    {
      type: "listingPlaceholder",
      children: [],
      source: "stars", // claimed by your collector
      path: data.arg,
      display: "gallery", // any {listing} option field; omitted ones get its defaults
    },
  ],
};

export default { name: "Listing stars", directives: [starsDirective], transforms: [collectStars] };
```

[myst-release-notes](https://github.com/myst-contrib/myst-release-notes) uses this pattern for its `{release-notes}` directive.

### Add a display

Replace a node whose `:display:` you own with your own AST.
By this point a collector has already filled `node.items`:

```javascript
const renderBadges = {
  name: "listing-display-badges",
  stage: "document",
  plugin: (_opts, utils) => (tree) => {
    for (const node of utils.selectAll("listingPlaceholder", tree)) {
      if (node.display !== "badges" || node.items === undefined) continue;
      // Replace the placeholder in place with your node.
      const out = { type: "div", children: node.items.map(toBadge) };
      for (const key of Object.keys(node)) if (key !== "type") delete node[key];
      Object.assign(node, out);
    }
  },
};

export default { name: "Listing badges", transforms: [renderBadges] };
```
