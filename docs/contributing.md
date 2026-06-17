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

- **Collect** (`src/collect.ts`) turns a `:source:` into a list of items.
- **Transform** (`src/plugin.ts`) filters/sorts/limits the items.
- **Render** (`src/display.ts`) turns items into a `:display:`.

`src/plugin.ts` also holds the directive and wires the transforms together; `src/shared.ts` holds a few things they share.
The **item** is the plain object that flows between these stages; see [Items](./collectors.md#items) for the fields it carries.

## Build and test

We use [nox](https://nox.thea.codes) to drive the build:

```bash
nox -s build      # bundle the plugin to dist/plugin.mjs
nox -s test       # build the docs, then run the vitest suite against the output
nox -s docs-live  # live docs server while you work
```

The tests build the demo docs and assert on the rendered `mdast`, so a passing run means the examples on the displays pages actually render.

## Cut a release

Two GitHub Actions handle publishing (see `.github/workflows/`):

- `deploy.yml` rebuilds the docs site and publishes it to GitHub Pages on every push to `main`.
- `release.yml` builds the bundle and attaches `dist/plugin.mjs` to a GitHub Release.

To publish a new bundle, draft a release on GitHub with a tag like `v0.1.0`.
The workflow above will automatically add the built `.mjs` bundle to the release.

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
function collectJson(node: any) {
  node.items = JSON.parse(readFileSync(node.path, "utf-8"));
}

export const collectors = { files: collectFiles, json: collectJson };
```

Now `:source: json` `:path: data.json` works.

## Change sorting or filtering

The middle layer lives in `src/plugin.ts` (`applyFilter`, `sortItems`).
To add a new behaviour, read a new option off the placeholder and act on the item list before it reaches the display.
Return the same shape you receive: a list of items in, a list of items out.
