---
title: Collectors
---

Before a `{listing}` can display anything, it has to **collect** its items.
A collector turns the `:source:` option into a list of items, each a plain object with fields like `title`, `url`, `description`, `date`, and `tags`.
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

## `files`

The default. Point `:path:` at a glob of Markdown files; each file's frontmatter becomes an item, and its URL links to the built page.
Most examples in the [displays pages](./displays/index.md) use this source - for instance the [`summary`](./displays/summary.md) page collects `posts/*.md`.

## `yaml`

Set `:source: yaml` and point `:path:` at a `.yml` file whose top-level entries already use our field names (`title`, `url`, `description`, `date`, `tags`, ...).
The [`table`](./displays/table.md) and [`gallery`](./displays/gallery.md) pages both show this in action, collecting from `links.yml`.

## Add new collectors

Collectors is designed to be extendable with other MyST plugins.
See [Extending the plugin](./developer.md).
