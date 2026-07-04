---
title: Extending from another plugin
---

You can add a new source or a new display from a **separate** MyST plugin.
Your plugin finds the **placeholder nodes** and fills them in.
(To add a built-in source/display to this repo instead, see [Contributing](./contributing.md).)

## How to define your own collector or display function

The `{listing}` directive emits a `listingPlaceholder` node carrying the user's options (`source`, `display`, `path`, `sort`, `limit`, ...).
Your plugin should ship a `document`-stage transform that selects those nodes and either:

- **collects**: sets `node.items` to a list of items (a collector), or
- **displays**: replaces a node whose `:display:` you own with your rendered AST (a display).

An item is a plain object; see [Items](./collectors.md#items) for the fields the built-ins understand.

## Staging and ordering

Transforms in MyST can run in one of two stages: `document` first, and `project` after.
For your transform to run at the right time:

- Run at the `document` stage. `myst-listing` resolves title links during this stage, so items collected later won't link correctly.
- Run before `myst-listing`'s render. Cross-plugin order follows load order in `myst.yml`, so list your plugin before `myst-listing` there.
- A node whose `:source:` or `:display:` `myst-listing` doesn't recognize is left untouched through the document stage, so your transform can claim it. Anything still unclaimed by the project stage is reported as an unknown source.

## Add a collector

Set `node.items` for the source you own; leave the rest alone:

```js
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

## Add a display

Replace a node whose `:display:` you own with your own AST.
By this point a collector has already filled `node.items`:

```js
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
