---
title: Transform
---

Between [collecting](./collectors.md) and [displaying](./displays/index.md), a listing can transform the collection: sort it, filter it, and cap how many items show.
These options work the same with every display (below we demo with the [table display](./displays/table.md)).

## Sort the items

The default sort is `date-desc` (newest first). Sort by any field with `:sort: field`, `field-asc`, or `field-desc`.
A bare field name sorts ascending, so `:sort: title` is the same as `:sort: title-asc`.

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:columns: title,date
:sort: title-asc
:::
::::::

To let readers re-sort a table in the browser, see [`:sortable:`](#interactive-sorting).

## Shuffle the order

`:sort: random` shuffles the items into a random order each build.
This is useful if you have a gallery and don't want the same things showing up at the top.

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:columns: title,date
:sort: random
:::
::::::

## Filter the items

`:filter: field=value` keeps only matching items. List fields (like `tags`) match when they contain the value.

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:columns: title,date,tags
:filter: tags=news
:::
::::::

## Limit how many

`:limit:` caps the number of items (default 10).
Combine it with `:sort:` to make a "top N" list.
Here, the three most recent posts:

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:columns: title,date
:limit: 3
:::
::::::

To show every item with no cap, set `:limit: 0`:

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:columns: title
:limit: 0
:::
::::::
