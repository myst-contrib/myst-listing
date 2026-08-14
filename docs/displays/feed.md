---
title: Feed display
---

The `feed` display shows each item's **full body**, for reading straight down the page rather than scanning and clicking through.
It suits blogs read in place, changelogs, and staff or bio pages.

Each item is a row: a left **rail** with the `thumbnail` (if any), date, author(s), and tags, and the linked title and rendered body on the right.
Tags use the same [`:tag-fields:`](#color-code-several-tag-fields) option as the other displays.
On a narrow screen the rail stacks above the body.
To show only each item's description, use [`summary`](./summary.md) instead.

## A blog feed

Point the feed at your posts and cap each body with `:body-limit:`.
Items longer than the cap are trimmed to that many blocks and gain a "Continue reading" link to the full post:

::::::{myst:demo}
:::{listing}
:path: ../posts/*.md
:display: feed
:body-limit: 2
:limit: 3
:::
::::::

## A changelog

Release notes read best in full, so leave `:body-limit:` off and use `:filter:` to keep only release posts.
Body headings (like the `Added` and `Fixed` sections here) render in place but stay out of the page's table of contents.
To put each release in the table of contents as its own section, use [`sections`](./sections.md) instead:

::::::{myst:demo}
:::{listing}
:path: ../posts/*.md
:filter: tags=release
:display: feed
:::
::::::

## A staff page

Items can also come from YAML.
A YAML entry has no page body, so its `description` is shown instead, and with an image the rail becomes an avatar column:

::::::{myst:demo}
:::{listing}
:source: yaml
:display: feed

- title: Jo the Jovyan
  url: https://example.com
  thumbnail: https://picsum.photos/seed/jo/300/300
  tags: [community]
  description: Community manager. Runs the open calls, triages new issues, and keeps the roadmap tidy.
- title: Marissa Myst
  url: https://example.com
  thumbnail: https://picsum.photos/seed/marissa/300/300
  tags: [engine]
  description: Lead engineer on the document engine and its plugin system.
:::
::::::

## A feed without images

Items don't need a `thumbnail`; the rail then holds only the date, author(s), and tags.
You can also mix items with and without images; the body's left edge stays aligned whether or not an item has one:

::::::{myst:demo}
:::{listing}
:source: yaml
:display: feed

- title: Faster builds in the March release
  date: 2026-03-04
  author: Ada Lovelace
  tags: [release]
  description: Build times dropped by roughly half this cycle. We removed a redundant re-parse of every page and cached the plugin bundle between runs, so most projects should see the difference without changing any configuration.
- title: How we run community calls
  date: 2026-02-11
  author: Grace Hopper
  tags: [community]
  description: Every other Thursday we host an open call for contributors, with a short demo slot, a triage pass over new issues, and an open floor that we time-box so the call always ends on schedule.
:::
::::::

## Filter it live

Each item carries the same `myst-listing-item` class as the [summary display](./summary.md), so [`searchfilter`](https://github.com/jupyter-book/myst-plugins/tree/main/plugins/searchfilter) can filter the feed as you type:

::::::{myst:demo}
:::{searchfilter} .myst-listing-item
:::

:::{listing}
:path: ../posts/*.md
:display: feed
:body-limit: 1
:::
::::::
