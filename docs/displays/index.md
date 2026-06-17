---
title: Displays
---

A `{listing}` renders its collected items with one of three built-in **displays**,
chosen with the `:display:` option.
Each foregrounds a different field, so the same items can read as a dense table or a visual gallery.

| Display | Best for | Leads with |
|---|---|---|
| [`table`](./table.md) | dense, scannable lists | the columns you pick |
| [`gallery`](./gallery.md) | visual collections | a thumbnail image |
| [`summary`](./summary.md) | reading lists, blogs | the description |

The rest of this page is a quick tour; follow a link above for the options each display supports.

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

## Graceful degradation

A listing never fails the build over a typo.
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
