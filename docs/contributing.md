---
title: Contributing
---

This page is for working on the plugin itself.
To build a *separate* plugin on top of it without editing this repo, see [Extending from another plugin](./extending.md).

## How the code is laid out

The plugin is a three-stage pipeline, split one file per stage:

```
{listing}  ->  listingPlaceholder node  ->  collect  ->  transform  ->  render
                                            (sources)   (sort/etc)    (views)
```

- **Collect** (`src/collect.ts`): a {term}`collector` turns a `:source:` into a list of {term}`items <item>`.
- **Transform** (`src/transform.ts`): `selectItems` filters, sorts and limits the items.
- **Render** (`src/display.ts`): a {term}`display` turns items into the finished node.

`src/plugin.ts` holds the directive and wires the stages together; `src/shared.ts` holds a few things they share.

```{glossary}
Placeholder
: The `listingPlaceholder` node the `{listing}` directive emits. It carries the directive's options, and the pipeline fills it in and finally replaces it.

Collector
: The code behind a `:source:`. It sets the placeholder's `items` (see [Add a collector](./extending.md#add-a-collector)).

Item
: The plain object that flows between the stages, one per listed thing. See [Items](./collectors.md#items) for the fields it carries.

Display
: The code behind a `:display:`. It turns the selected items into one AST node.
```

## Build and test

We use [bun](https://bun.sh) to drive the build:

```bash
bun install        # install dependencies
bun run build      # bundle the plugin to dist/plugin.mjs
bun run test       # build the docs, then run the vitest suite against the output
bun run docs:live  # live docs server while you work
```

The tests build the demo docs and assert on the rendered `mdast`, so a passing run means the examples on the displays pages actually render.

## Cut a release

Two GitHub Actions handle publishing (see `.github/workflows/`):

- `deploy.yml` rebuilds the docs site and publishes it to GitHub Pages on every push to `main`.
- `release.yml` builds the bundle and attaches `dist/plugin.mjs` to a GitHub Release.

To publish a new bundle, draft a release on GitHub with a tag like `v0.1.0`.

## Add a built-in display (`:display:`)

A display takes the items and returns a single AST node. Add a function to the `displays` map in `src/display.ts`:

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

## Add a built-in collector (`:source:`)

A collector fills `node.items`. Add a function to the `collectors` map in `src/collect.ts`. For example, a source that reads a JSON array of items:

```ts
function collectJson(node: any, vfile: any) {
  node.items = JSON.parse(readFileSync(fromPage(vfile, node.path), "utf-8"));
}

export const collectors = { files: collectFiles, json: collectJson };
```

Now `:source: json` `:path: data.json` works.

## Change sorting or filtering

The Transform stage lives in `src/transform.ts`, behind `selectItems(items, node)`.
To add a new behaviour, read a new option off the {term}`placeholder` inside `selectItems`.
It's pure (a list of items in, a list of items out), so you can unit-test it without building the docs.

## How this package was developed

Here's a rough timeline for how this package was developed:

- Much of the code was initially developed in a collection of one-off plugins that are mentioned in the "Design use cases" section.
- We used Claude Code to design a specification and architecture for a listing system that could meet all of those use cases.
  - Two of them (blog post lists and galleries from a YAML file) were designed as core functionality of the plugin.
  - Two of them (github issue tables and multi-yaml downloads) were designed as "design cases for pluggability" of this plugin (ie, creating new collectors etc).
- The result of this is the `collect`, `transform`, `display` build system here.
- We then spent several cycles building out the core functionality here, using the [Project Pythia Cookbook Gallery](https://cookbooks.projectpythia.org), the [Jupyter Book Gallery](https://jupyterbook.org/gallery), and the [Jupyter Book Blog list](https://jupyterbook.org/blog) as design use-cases.
- There's probably a lot more to add, but we tried to keep it as simple as possible for now. If this feels like a useful pattern to build upon, then we can keep iterating on this codebase via issues!
