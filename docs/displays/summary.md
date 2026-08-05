---
title: Summary display
---

The `summary` display stacks cards that show each item's `description`, the short blurb from its frontmatter.
Each card shows the linked title, a meta line with the date and author(s), the description, and a `tags` row, with the `thumbnail` (if any) floated to the right.
It suits reading lists and blog indexes, where readers scan the blurbs and click through.
To render each item's full content in place, use [`feed`](./feed.md) instead.

Author names come from the `author` or `authors` frontmatter fields (see [Items](#items)).
An id that references a project author is not yet resolved ([issue #4](https://github.com/myst-contrib/myst-listing/issues/4)).

## A summary from local files

::::::{myst:demo}
:::{listing}
:path: ../posts/*.md
:display: summary
:::
::::::

## Filter it live

Every item carries a `myst-listing-item` class, so the [`searchfilter`](https://github.com/jupyter-book/myst-plugins/tree/main/plugins/searchfilter) plugin can filter the cards as you type.
It matches against everything in each card (title, tags, date, description):

::::::{myst:demo}
:::{searchfilter} .myst-listing-item
:::

:::{listing}
:path: ../posts/*.md
:display: summary
:::
::::::
