---
title: Table display
---

The `table` display renders items as rows, one column per field you name in `:columns:`.
It is the default, so a bare `{listing}` is already a table.

## Pick your columns

`:columns:` is a comma-separated list of field names. `title` links to the item when it has a `url`.

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:columns: title,date,tags
:::
::::::

## Sort the rows

The default sort is `date-desc` (newest first). Sort by any field with `:sort: field`, `field-asc`, or `field-desc`.

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:columns: title,date
:sort: title-asc
:::
::::::

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

## Filter the rows

`:filter: field=value` keeps only matching items. List fields (like `tags`) match when they contain the value.

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:columns: title,date,tags
:filter: tags=news
:::
::::::

## Limit how many

`:limit:` caps the number of rows (default 10).
Combine it with `:sort:` to make a "top N" list.
Here, the three most recent posts:

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:columns: title,date
:limit: 3
:::
::::::

## From an external YAML file

Set `:source: yaml` and point `:path:` at a `.yml` whose top-level entries use the [item fields](../collectors.md#items):

::::::{myst:demo}
:::{listing}
:source: yaml
:path: links.yml
:columns: title,description,date
:::
::::::

## From inline YAML

For a quick one-off listing, skip the file and write the YAML list straight in the directive body:

::::::{myst:demo}
:::{listing}
:source: yaml
:columns: title,description
- title: Inline One
  description: Written in the directive body
- title: Inline Two
  description: No file needed
:::
::::::

## Filter it live

Each **data** row carries a `myst-listing-item` class (the header doesn't, so it stays put), which the [`searchfilter`](https://github.com/jupyter-book/myst-plugins/tree/main/plugins/searchfilter) plugin can target to filter rows as you type:

::::::{myst:demo}
:::{searchfilter} .myst-listing-item
:::

:::{listing}
:path: posts/*.md
:columns: title,date,tags
:::
::::::
