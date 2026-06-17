---
title: Extending the plugin
---

# Extending the plugin

The plugin is a three-stage pipeline, and each stage is an extension point:

```
{listing}  ->  listingPlaceholder node  ->  collect  ->  transform  ->  render
                                            (sources)   (sort/etc)    (views)
```

- **Collect** (`src/collect.ts`) turns a `:source:` into a list of items.
- **Transform** (`src/plugin.ts`) filters/sorts/limits the items.
- **Render** (`src/display.ts`) turns items into a `:display:`.

An "item" is a plain object. By convention it has `title`, `url`, `description`,
`date`, `tags`, and `thumbnail`, plus any extra fields - but nothing is required.

## Add a renderer (a new `:display:`)

A renderer takes the items and returns a single AST node. Add a function to the
`displays` map in `src/display.ts`:

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

## Add a collector (a new `:source:`)

A collector fills `node.items`. Add a function to the `collectors` map in
`src/collect.ts`. For example, a source that reads a JSON array of items:

```ts
function collectJson(node: any) {
  node.items = JSON.parse(readFileSync(node.path, "utf-8"));
}

export const collectors = { files: collectFiles, json: collectJson };
```

Now `:source: json` `:path: data.json` works.

### Add a collector from a *separate* plugin

Other plugins can ship their own `document`-stage transform that finds the placeholder nodes and sets `node.items`.
It imports nothing from `myst-listing` - they just need to (1) find the placeholder nodes, and (2) set `node.items` in a way that matches the shape that `myst-listing` expects:

```js
const collectStars = {
  name: "listing-collect-stars",
  stage: "document",
  plugin: (_opts, utils) => async (tree) => {
    for (const node of utils.selectAll("listingPlaceholder", tree)) {
      if (node.source !== "stars") continue;        // only the source we own
      node.items = await fetchStars(node.path);     // your async logic here
    }
  },
};

export default { name: "Listing stars", transforms: [collectStars] };
```

Load both plugins in `myst.yml`. (One caveat: an external collector must run
**before** this plugin's render - see the spec's open ordering note.)

## Add a transform (change sorting/filtering)

The middle layer lives in `src/plugin.ts` (`applyFilter`, `sortItems`). To add a
new behaviour, read a new option off the placeholder and act on the item list
before it reaches the renderer. Keep these pure: list in, list out.
