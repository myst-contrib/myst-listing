---
title: MyST Listing
---

```{include} ../README.md
:start-after: # MyST Listings
:end-before: ## Usage
```

## What it looks like

Point `{listing}` at some pages and choose how to show them.
Here are the same three posts, four different ways:

::::::::{tab-set}
:::::::{tab-item} Table
::::::{myst:demo}
:::{listing}
:path: posts/*.md
:display: table
:limit: 3
:::
::::::
:::::::
:::::::{tab-item} List
::::::{myst:demo}
:::{listing}
:path: posts/*.md
:display: list
:limit: 3
:::
::::::
:::::::
:::::::{tab-item} Gallery
::::::{myst:demo}
:::{listing}
:path: posts/*.md
:display: gallery
:limit: 3
:::
::::::
:::::::
:::::::{tab-item} Summary
::::::{myst:demo}
:::{listing}
:path: posts/*.md
:display: summary
:limit: 3
:::
::::::
:::::::
::::::::

There are six displays in all (see [Displays](./displays/index.md)).
To install the plugin and make your first listing, see [Get started](./get-started.md).

## How it works

Each listing goes through three stages:

- [Collect](./collectors.md) items from files, your table of contents, or a data file.
  Options: `:source:`, `:path:`.
- [Transform](./transform.md) them by sorting, filtering, and limiting.
  By default you get the 10 newest, by their `date`.
  Options: `:sort:`, `:filter:`, `:limit:`.
- [Display](./displays/index.md) them as a table, list, gallery, and so on.
  Options: `:display:`, `:columns:`, `:tag-fields:`, `:label:`, plus `:sortable:` (table), `:grid-columns:` (gallery), and `:body-limit:` (feed).

Other plugins can add their own collectors and displays (see [Extending](./develop/extending.md)).
You can't extend the transform stage yet.

## Status

- This is an experimental plugin and its design and UX isn't yet proven!
- Jupyter Book has an [issue about adding `listing` functionality](https://github.com/jupyter-book/mystmd/issues/840) and if that results in a _different_ MyST implementation, I'll probably shut this project down and recommend people just use that.

But, if you want to be a bit on the bleeding edge and give feedback, that would be great!
