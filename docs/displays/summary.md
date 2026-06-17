---
title: Summary display
---

The `summary` display stacks cards that foreground the full `description`.
Each card shows the linked title, a date meta line, the complete description, and a `tags` row, with the `thumbnail` (if any) floated to the right.
It suits reading lists and blog indexes, where the text matters more than the image.
Nothing is truncated, so it works best for items that have a real `description`.

## A summary from local files

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:display: summary
:::
::::::

## Filter it live

Every item carries a `myst-listing-item` class, so the [`searchfilter`](https://github.com/jupyter-book/myst-plugins/tree/main/plugins/searchfilter) plugin can filter the cards as you type — it matches against everything in each card (title, tags, date, description):

::::::{myst:demo}
:::{searchfilter} .myst-listing-item
:::

:::{listing}
:path: posts/*.md
:display: summary
:::
::::::
