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

See [Examples](./examples.md) for more displays and options.

## Design

This plugin is designed to be extendable at each of the following three levels:

- Collect: Download, find, or otherwise collect items and return a structured dataset of those items.
- Transform: Take this dataset and optionally transform them by modifying entries, adding metadata, etc.
- Display: Take the dataset and use the structured data to render each entry in a few common ways (lists, tables, etc).

## Inspiration

This was designed to be a single tool that could be re-used across these use-cases:

- The [blog plugin](https://github.com/jupyter-book/blog-plugin) has some logic for collecting files on disk and displaying them in a table.
- The [GitHub Issue Table plugin](https://github.com/jupyter-book/myst-plugins) has logic for collecting issues, adding columns, and displaying them in a table.
- The [Jupyter Book gallery](https://github.com/jupyter-book/jupyterbook.org/tree/main/docs/src/gallery.yml) has code for hand-rolling a gallery with Python.