---
title: Gallery display
---

The `gallery` display is an image-forward card grid.

Each card leads with the item's `thumbnail`, then the title, a row of `tags` (or other [tag fields](#color-code-several-tag-fields)), and a short `description`.
When an item has a `url`, the whole card is clickable.

## A gallery from YAML

A `.yml` file is the quickest way to hand-curate a gallery.
Give each entry a `thumbnail` to lead with and a `url` to link to:

::::::{myst:demo}
:::{listing}
:source: yaml
:path: ../links.yml
:display: gallery
:::
::::::

## A gallery from local pages

The same display works over your own pages.
Any post with a `thumbnail` in its frontmatter becomes a card, and the card links back to the page:

::::::{myst:demo}
:::{listing}
:path: ../posts/*.md
:display: gallery
:limit: 6
:::
::::::

Items without a `thumbnail` still get a card, minus the image.
Descriptions are truncated to keep the grid even; use the [`summary`](./summary.md) display when the full text matters.

## Set the number of columns

By default the grid is responsive (1 column on phones up to 4 on wide screens).
Pin it to a fixed count with `:grid-columns:`:

::::::{myst:demo}
:::{listing}
:source: yaml
:path: ../links.yml
:display: gallery
:grid-columns: 2
:::
::::::

## Color-code several tag fields

By default the tag row shows each item's `tags`.
List several fields with `:tag-fields:` to show more than one kind of tag, each in its own color:

::::::{myst:demo}
:::{listing}
:source: yaml
:path: ../links.yml
:display: gallery
:tag-fields: libraries, domains
:::
::::::

Colors come from a small fixed palette, assigned by list order, so keep the order consistent across pages.
The same option works in the [`summary`](./summary.md) display.

## Filter it live

The gallery uses MyST's built-in `card`, whose renderer drops custom classes, so point [`searchfilter`](https://github.com/jupyter-book/myst-plugins/tree/main/plugins/searchfilter) at `.myst-listing-gallery .myst-card` instead of `.myst-listing-item`:

::::::{myst:demo}
:::{searchfilter} .myst-listing-gallery .myst-card
:::

:::{listing}
:source: yaml
:path: ../links.yml
:display: gallery
:::
::::::
