---
title: Displays
---

A `{listing}` renders its collected items with one of three built-in **displays**, chosen with the `:display:` option.
Each leads with a different field: galleries are image-forward, summaries are text-forward.

```{list-table}
:header-rows: 1

* - Display
  - Best for
  - Leads with
* - [`table`](./table.md)
  - dense, scannable lists
  - the columns you pick
* - [`gallery`](./gallery.md)
  - visual collections
  - a thumbnail image
* - [`summary`](./summary.md)
  - reading lists, blogs
  - the description
```

The rest of this page is a quick tour of each; click the links to each display type's page for a deeper explanation of what you can do with it.

## `table`

The default. Pick the columns you want with `:columns:`.

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:columns: title,date
:::
::::::

## `gallery`

An image-forward card grid. Each card leads with its `thumbnail`.

::::::{myst:demo}
:::{listing}
:source: yaml
:path: links.yml
:display: gallery
:::
::::::

## `summary`

Stacked cards that foreground the full `description`.

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:display: summary
:::
::::::

## Graceful degradation for unknown configuration

An unknown `:source:` warns and renders a note:

::::::{myst:demo}
:::{listing}
:source: nope
:::
::::::

An unknown `:display:` warns and falls back to a table:

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:display: nope
:::
::::::
