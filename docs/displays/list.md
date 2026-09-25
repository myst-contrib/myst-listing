---
title: List display
---

The `list` display renders one bullet per item, with a few fields on the same line.
It suits compact link lists, like a section's landing page that links to each page with a short blurb.
This page covers the list-specific options; sorting, filtering, and limiting are the same in every display and are covered in [](../transform.md).

## Titles and descriptions

By default each bullet is the linked `title`, then the `description`:

::::::{myst:demo}
:::{listing}
:path: ../posts/*.md
:display: list
:limit: 3
:::
::::::

## Pick your fields

`:columns:` picks the fields, as for the [table](./table.md).
The first field links to the item, a colon follows it, and the rest are joined with ` · `:

::::::{myst:demo}
:::{listing}
:path: ../posts/*.md
:display: list
:columns: title,date,tags
:limit: 3
:::
::::::

If an item has no value for a field, the field and its separator are left out.
If the first field is empty (say, a page with no `short_title`), the bullet falls back to the `title`:

::::::{myst:demo}
:::{listing}
:source: yaml
:display: list
:columns: short_title,description
- title: Author guide
  short_title: Authors
  description: publish your work
- title: Administrator guide
  description: manage users and organizations
- title: Deployer guide
:::
::::::

## Filter it live

Every bullet carries a `myst-listing-item` class, so the [`searchfilter`](https://github.com/jupyter-book/myst-plugins/tree/main/plugins/searchfilter) plugin can filter them as you type:

::::::{myst:demo}
:::{searchfilter} .myst-listing-item
:::

:::{listing}
:path: ../posts/*.md
:display: list
:::
::::::
