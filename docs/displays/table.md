---
title: Table display
---

The `table` display renders items as rows, one column per field you name in `:columns:`.
It is the default, so a bare `{listing}` is already a table.
This page covers the table-specific options; sorting, filtering, and limiting are the same in every display and are covered in [](../transform.md).

## Pick your columns

`:columns:` is a comma-separated list of field names. `title` links to the item when it has a `url`.

::::::{myst:demo}
:::{listing}
:path: ../posts/*.md
:columns: title,date,tags
:::
::::::

## From an external YAML file

Set `:source: yaml` and point `:path:` at a `.yml` whose top-level entries use the [item fields](#items):

::::::{myst:demo}
:::{listing}
:source: yaml
:path: ../links.yml
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

## From JSON

`:source: json` reads a `.json` file (or inline body) holding one top-level array.
The file below came from `gh issue list --limit 5 --json title,url,updatedAt`, so the table shows this repo's own open issues:

::::::{myst:demo}
:::{listing}
:source: json
:path: ../issues.json
:columns: title,updatedAt
:sort: updatedAt-desc
:::
::::::

## From TOML

`:source: toml` works the same way, from a `.toml` file or inline.
TOML has no top-level list, so wrap the items in an array-of-tables:

::::::{myst:demo}
:::{listing}
:source: toml
:path: ../links.toml
:columns: title,description,date
:::
::::::

Or write the TOML inline:

::::::{myst:demo}
:::{listing}
:source: toml
:columns: title,description
[[items]]
title = "Toml One"
description = "Written in the directive body"

[[items]]
title = "Toml Two"
description = "No file needed"
:::
::::::

## Filter it live

Each **data** row carries a `myst-listing-item` class (the header doesn't, so it stays put), which the [`searchfilter`](https://github.com/jupyter-book/myst-plugins/tree/main/plugins/searchfilter) plugin can target to filter rows as you type:

::::::{myst:demo}
:::{searchfilter} .myst-listing-item
:::

:::{listing}
:path: ../posts/*.md
:columns: title,date,tags
:::
::::::

(interactive-sorting)=
## Interactive sorting

Add the `:sortable:` flag and readers can re-sort the table by clicking a column header.
Re-sorting happens in the browser and only rearranges the rows shown, so `:limit:` still applies.
There's some basic logic to try to sort sensibly (e.g., dates are sorted by date, not alpha-numerically).

::::::{myst:demo}
:::{listing}
:path: ../posts/*.md
:columns: title,date,tags
:sortable:
:::
::::::
