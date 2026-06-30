---
title: Collectors
---

Before a `{listing}` can display anything, it has to **collect** its items.
A collector turns the `:source:` option into a list of **items** (defined [below](#items)).
The plugin ships with two built-in collectors.
Authors choose which one with `:source:`.

```{list-table}
:header-rows: 1

* - Source
  - Collects from
  - `:path:`
* - `files` (default)
  - Markdown files on disk, using their frontmatter
  - a glob, e.g. `posts/*.md`
* - `yaml`
  - A YAML file whose top-level entries are items
  - a `.yml` file, e.g. `links.yml`
```

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
  - Summary text. Shown in full by `summary`, truncated by `gallery`.
* - `date`
  - Sorted on by the default `date-desc`, and shown as a meta line. A Date or `YYYY-MM-DD` string renders long, e.g. *January 1, 2025*.
* - `author` / `authors`
  - A single name or a list. Shown in the `summary` meta line beside the date. Names are shown as written (an id referencing a project author is not resolved).
* - `tags`
  - A list of strings. Shown as pills; `:filter: tags=news` matches by containment.
* - `thumbnail`
  - Image URL. Leads each `gallery` card and sits beside each `summary` card.
```

Any other fields pass through untouched; use them as `:columns:` or `:filter:` targets.

## `files`

The default. Point `:path:` at a glob of Markdown files; each file's frontmatter becomes an item, and its URL links to the built page.
Most examples in the [displays pages](./displays/index.md) use this source - for instance the [`summary`](./displays/summary.md) page collects `posts/*.md`.

## `yaml`

Set `:source: yaml` and point `:path:` at a `.yml` file whose top-level entries already use the [item fields](#items).
The [`table`](./displays/table.md) and [`gallery`](./displays/gallery.md) pages both show this in action, collecting from `links.yml`.

You can also write the YAML list directly in the directive body instead of pointing at a file, which is handy for a short, one-off listing.
The body wins over `:path:` when both are given.

## Add new collectors

Collectors are designed to be extendable with other MyST plugins.
See [Extending from another plugin](./extending.md).
