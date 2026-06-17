---
title: MyST Listing
---

```{include} ../README.md
:start-after: # MyST Listings
```

Rendered:

```{listing}
:path: posts/*.md
:columns: title,date
```

See [Displays](./displays/index.md) for the table, gallery, and summary views and their options.

## Design

This plugin is designed to be extendable at each of the following three levels:

- Collect: Download, find, or otherwise collect items and return a structured dataset of those items.
- Transform: Take this dataset and optionally transform them by modifying entries, adding metadata, etc.
- Display: Take the dataset and use the structured data to render each entry in a few common ways (lists, tables, etc).

## Design usecases

This was designed to be a single tool that could be re-used across these use-cases:

For build-in functionality:

- The [blog plugin](https://github.com/jupyter-book/blog-plugin) has some logic for collecting files on disk and displaying them in a table.
- The [Jupyter Book gallery](https://github.com/jupyter-book/jupyterbook.org/tree/main/docs/src/gallery.yml) has code for hand-rolling a gallery with Python.

For plugin-level extensions functionality (ie, we want other MyST plugins to extend `myst-listing` functionality to meet these extra use-cases):

- The [GitHub Issue Table plugin](https://github.com/jupyter-book/myst-plugins) has logic for collecting issues, adding columns, and displaying them in a table.
- The [Project Pythia cookbooks gallery](https://github.com/ProjectPythia/cookbook-gallery) which _collects_ YAML files from a bunch of repositories and then uses them to render the gallery.
