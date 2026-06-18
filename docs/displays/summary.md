---
title: Summary display
---

The `summary` display stacks cards that show the full `description`.
Each card shows the linked title, a meta line with the date and author(s), the description, and a `tags` row, with the `thumbnail` (if any) floated to the right.
It suits reading lists and blog indexes, where the full text matters more than the image.

The meta line combines `date` and author(s).
Authors come from an `author` (a single name) or `authors` (a list) frontmatter field.
Note: an id that references a project author is not yet supported, see https://github.com/myst-contrib/myst-listing/issues/4.

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
