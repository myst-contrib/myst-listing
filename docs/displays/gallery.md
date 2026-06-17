---
title: Gallery display
---

The `gallery` display is an image-forward card grid — the right choice when the items are things you want people to *look* at: projects, showcases, link directories, or a wall of blog posts with cover images.

Each card leads with the item's `thumbnail`, then the title, a pill row of `tags`, and a short `description`.
When an item has a `url`, the **whole card is clickable**, not just the title, so the entire tile is a comfortable target.

## A gallery from YAML

A `.yml` file is the quickest way to hand-curate a gallery.
Give each entry a `thumbnail` to lead with and a `url` to link to:

::::::{myst:demo}
:::{listing}
:source: yaml
:path: links.yml
:display: gallery
:::
::::::

## A gallery from local pages

The same display works over your own pages.
Any post with a `thumbnail` in its frontmatter becomes a card, and the card links back to the page:

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:display: gallery
:limit: 6
:::
::::::

Items without a `thumbnail` still render — the card simply omits the image.
The `description` is truncated to keep the grid even; reach for the [`summary`](./summary.md) display when the full text matters.

## Set the number of columns

By default the grid is responsive (1 column on phones up to 4 on wide screens).
Pin it to a fixed count with `:grid-columns:`:

::::::{myst:demo}
:::{listing}
:source: yaml
:path: links.yml
:display: gallery
:grid-columns: 2
:::
::::::

## Filter it live

The gallery uses MyST's built-in `card`, whose renderer drops custom classes — so point [`searchfilter`](https://github.com/jupyter-book/myst-plugins/tree/main/plugins/searchfilter) at `.myst-listing-gallery .myst-card` instead of `.myst-listing-item`:

::::::{myst:demo}
:::{searchfilter} .myst-listing-gallery .myst-card
:::

:::{listing}
:source: yaml
:path: links.yml
:display: gallery
:::
::::::
