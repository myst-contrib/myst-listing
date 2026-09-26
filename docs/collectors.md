---
title: Collectors
---

Before a `{listing}` can display anything, it has to **collect** its items.
The `:source:` option picks a collector, which produces a list of **items** (defined [below](#items)).
Five collectors are built in:

```{list-table}
:header-rows: 1

* - Source
  - Collects from
  - `:path:`
* - `files` (default)
  - Markdown files on disk, using their frontmatter
  - a glob, e.g. `posts/*.md`
* - `toc`
  - The pages under one page in `myst.yml`'s `toc`, in toc order
  - the parent page, e.g. `guides/index.md` (default: this page)
* - `yaml`
  - A YAML file whose top-level entries are items
  - a `.yml` file, e.g. `links.yml`
* - `json`
  - A JSON file whose top-level array entries are items
  - a `.json` file
* - `toml`
  - A TOML file whose array-of-tables entries are items
  - a `.toml` file
```

A relative `:path:` resolves from the page containing the directive, like a Markdown link.

(items)=

## Items

An item is a plain object: a collector produces a list of them, and a display renders them.
No field is _required_, but the built-in displays and options understand these:

```{list-table}
:header-rows: 1

* - Field
  - Used for
* - `title`
  - The item's name. Shown as the heading, linked to `url` when set. (The `files` collector uses the page's first heading when frontmatter has no `title`.)
* - `url`
  - Where the title and gallery cards link to.
* - `description`
  - Summary text. Shown in full by `summary`, truncated by `gallery`, and used as the `feed` body for items with no page.
* - `date`
  - Sorted on by the default `date-desc`, and shown in the `summary` meta line and the `feed` rail. A Date or `YYYY-MM-DD` string renders long, e.g. *January 1, 2025*.
* - `author` / `authors`
  - A single name or a list. Shown beside the date in `summary` and in the `feed` rail. Names are shown as written (an id referencing a project author is not resolved).
* - `tags`
  - A list of strings. Shown as a tag row; `:filter: tags=news` matches by containment.
* - `thumbnail`
  - Image URL. Leads each `gallery` card, sits beside each `summary` card, and tops the `feed` rail.
* - `body`
  - Set by the `files` collector to the page's parsed content; rendered only by `feed`.
```

Any other fields pass through untouched; use them as `:columns:` or `:filter:` targets.

## `files`

The default. Point `:path:` at a glob of Markdown files; each file's frontmatter becomes an item, and its URL links to the built page.
Most examples in the [displays pages](./displays/index.md) use this source.

(toc-source)=

## `toc`

Set `:source: toc` to list the pages nested under a page in your `myst.yml` [table of contents](https://mystmd.org/guide/table-of-contents), in the same order.
By default it lists the children of the page holding the listing; point `:path:` at another page to list its children instead.
Pair it with the [`list`](./displays/list.md) display for a table of contents that shows each page's `description`:

::::::{myst:demo}
:::{listing}
:source: toc
:path: displays/index.md
:display: list
:::
::::::

Each item is the page's frontmatter, so `:columns:` can show any field it has.
The first column is the link text, so `short_title` gives shorter links (pages without one fall back to `title`):

::::::{myst:demo}
:::{listing}
:source: toc
:path: displays/index.md
:display: list
:columns: short_title,description
:::
::::::

The first page in the toc is the site's root page, so its children are the other top-level entries.
This lists the top level of this site from any page:

::::::{myst:demo}
:::{listing}
:source: toc
:path: index.md
:display: list
:::
::::::

Items come in toc order, so they aren't sorted or limited unless you set `:sort:` or `:limit:`.
A few things to know:

- Only direct children are listed, not grandchildren.
- A `url` entry becomes an external link, and a `title` with no `file` becomes an unlinked item.
- `hidden` entries are skipped.
- A notebook's fields come from the frontmatter in its first cell.
- Your `myst.yml` needs an explicit `toc`; `extends:` and `_toc.yml` aren't read.
- `file` entries need their extension (`guides/intro.md`, not `guides/intro`), as mystmd itself recommends.

## `yaml`

Set `:source: yaml` and point `:path:` at a `.yml` file whose top-level entries already use the [item fields](#items).
The [`table`](./displays/table.md) and [`gallery`](./displays/gallery.md) pages both collect from `links.yml`.

You can also write the YAML list directly in the directive body instead of pointing at a file, which is handy for a short, one-off listing.
The body wins over `:path:` when both are given.

## `json`

Like `yaml`, but for JSON: point `:path:` at a `.json` file holding one top-level array, or write the array inline in the directive body.

JSON is most useful when another tool writes the data for you.
For example, `gh` can dump GitHub issues into a listing-ready file:

```bash
gh issue list --limit 5 --json title,url,updatedAt > issues.json
```

See the [table display page](./displays/table.md) for a listing built from this file.

## `toml`

Like `yaml`, but for TOML.
TOML has no top-level list, so wrap the items in a single array-of-tables (the key's name is up to you, below we use `items`):

```toml
[[items]]
title = "MyST Markdown"
description = "Write once, publish anywhere"

[[items]]
title = "Jupyter Book"
```

Inline TOML in the directive body works the same way as inline YAML.
See the [table display page](./displays/table.md) for an example.

## Add new collectors

Collectors are designed to be extendable with other MyST plugins.
See [Extending from another plugin](./develop/extending.md).
