---
title: Table display
short_title: Table
description: Rows and columns of the fields you pick.
---

The `table` display renders items as rows, one column per field you name in `:columns:`.
It is the default, so a bare `{listing}` is already a table.

## Pick your columns

`:columns:` is a comma-separated list of field names. `title` links to the item when it has a `url`.

::::::{myst:demo}
:::{listing}
:path: ../posts/*.md
:columns: title,date,tags
:::
::::::

## Filter it live

Filter rows as you type with [searchfilter](#filter-live). The header row stays put:

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
Re-sorting happens in the browser and only reorders the rows already on the page, so items cut by `:limit:` stay hidden.
Dates sort as dates, not as text.
The first click on a number or date column sorts largest or newest first, and on a text column A to Z.

::::::{myst:demo}
:::{listing}
:path: ../posts/*.md
:columns: title,date,tags
:sortable:
:::
::::::
