---
title: Displays
---

A `{listing}` renders its collected items with one of four built-in **displays**, chosen with the `:display:` option.
Each leads with a different field:

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
  - blog indexes, reading lists (scan and click through)
  - the description
* - [`feed`](./feed.md)
  - blogs, changelogs, bios (read in place)
  - the full body
```

Below is a quick tour of each; follow the links for the full options.

## `table`

The default. Pick the columns you want with `:columns:`.

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:columns: title,date
:::
::::::

## `gallery`

An image-forward card grid.

::::::{myst:demo}
:::{listing}
:source: yaml
:path: links.yml
:display: gallery
:::
::::::

## `summary`

Stacked cards that show each item's `description`.

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:display: summary
:::
::::::

## `feed`

The full body of each item, stacked for reading straight down.

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:display: feed
:body-limit: 2
:limit: 3
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
