---
title: Tutorial
description: Build listings from your pages, a data file, and data written in the directive.
---

This tutorial builds three listings, one for each kind of source: Markdown pages, a data file, and data written inside the directive.
Each one uses a different display.
It assumes you've added the plugin to your `myst.yml` (see [Get started](./get-started.md)).

## List your pages

This site has a `posts/` folder of short Markdown pages.
Here's one of them:

```{literalinclude} posts/2025-01-01-hello.md
:language: markdown
```

Point `:path:` at the folder, and each page becomes one item.
Its frontmatter fills in the item's fields, and its `# Hello world` heading becomes the `title`:

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:columns: title,date,tags
:::
::::::

Change `:columns:` to list "description", and it'll show up in the listing:

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:columns: title,description
:::
::::::

The same items can be shown another way.
The `summary` display leads with each item's description and thumbnail, and `:limit: 3` keeps only the three newest:

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:display: summary
:limit: 3
:::
::::::

To learn more:

- [Displays](./displays/index.md) shows all six ways to show items.
- [Transform](./transform.md) covers sorting, filtering, and limiting.

## List rows from a data file

Not every item is a page.
For a list of links to other projects, a data file is easier to keep up to date.
Here's `links.csv`, which you could export from a spreadsheet:

```{literalinclude} links.csv
```

Set `:source: csv` and point `:path:` at the file.
Each row becomes an item, and the `list` display shows them as bullets:

::::::{myst:demo}
:::{listing}
:source: csv
:path: links.csv
:display: list
:columns: title,description
:::
::::::

YAML, JSON, and TOML files work the same way (see [Collectors](./collectors.md)).

## Write the data in the directive

For a short, one-off listing, skip the file and write the items as YAML in the directive body.
Give each a `thumbnail` and show them as a `gallery` of cards:

::::::{myst:demo}
:::{listing}
:source: yaml
:display: gallery

- title: MyST Markdown
  url: https://mystmd.org
  description: Turns Markdown and notebooks into books, articles, and websites.
  thumbnail: https://avatars.githubusercontent.com/u/115208022?v=4
- title: Jupyter Book
  url: https://jupyterbook.org
  description: Builds books and documents from computational material.
  thumbnail: https://avatars.githubusercontent.com/u/46299776?v=4
- title: Project Jupyter
  url: https://jupyter.org
  description: The project behind notebooks and JupyterLab.
  thumbnail: https://avatars.githubusercontent.com/u/7388996?v=4
:::
::::::

## Next steps

- To list the pages in one section of your site, use the [`toc` source](#toc-source).
- To reuse a listing on another page, give it a [label](#labels).
- To add your own source or display, see [Extending](./develop/extending.md).
