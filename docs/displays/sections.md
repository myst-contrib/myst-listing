---
title: Sections display
---

The `sections` display renders each item as a real section of the page: an `##`-level heading per item, so every item shows up in the page's table of contents and can be deep-linked.
It suits pages that *are* the listing: release notes, a one-page changelog, or combined meeting notes where each meeting had its own page originally.

Each section shows the title as a plain heading, a muted `date · author` line, tags, and the item's full body.
**Body headings are demoted to bold text** without anchors (as in [`feed`](./feed.md)), so a long changelog doesn't flood the page outline.

## A changelog with an outline

Each release below is a section, and the page outline on the right lists them:

::::::{myst:demo}
:::{listing}
:path: ../posts/*.md
:filter: tags=release
:display: sections
:::
::::::

## Filter it live

Each item carries the same `myst-listing-item` class as the other displays, so [`searchfilter`](https://github.com/jupyter-book/myst-plugins/tree/main/plugins/searchfilter) works here too:

::::::{myst:demo}
:::{searchfilter} .myst-listing-item
:::

:::{listing}
:path: ../posts/*.md
:display: sections
:limit: 3
:::
::::::
