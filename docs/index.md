---
title: MyST Listing
---

```{include} ../README.md
:start-after: # MyST Listings
```

Rendered:

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:columns: title,date
:::
::::::

See [Displays](./displays/index.md) for the table, gallery, and summary views and their options.

## Design

This plugin is designed to be extendable at each of the following three levels:

- Collect: Download, find, or otherwise collect items and return a structured dataset of those items.
- Transform: Take this dataset and optionally transform them by modifying entries, adding metadata, etc.
- Display: Take the dataset and use the structured data to render each entry in a few common ways (lists, tables, etc).

This is probably a more complex design that we strictly need for some base functionality, but I'm trying to separate these out *and* make them pluggable, to see if we can build some base functionality here, and then build other plugins that leverage the same rendering infrastructure for other use-cases (like the github issues plugin).

If that results in plugins that feel hacky and unnecessarily complicated, we might simplify this a bit!

## Design usecases

This was designed to be a single tool that could be re-used across these use-cases:

For built-in functionality:

- The [blog plugin](https://github.com/jupyter-book/blog-plugin) has some logic for collecting files on disk and displaying them in a table.
- The [Jupyter Book gallery](https://github.com/jupyter-book/jupyterbook.org/tree/main/docs/src/gallery.yml) has code for hand-rolling a gallery with Python.

For plugin-level extensions functionality (ie, we want other MyST plugins to extend `myst-listing` functionality to meet these extra use-cases):

- The [GitHub Issue Table plugin](https://github.com/jupyter-book/myst-plugins) has logic for collecting issues, adding columns, and displaying them in a table.
- The [Project Pythia cookbooks gallery](https://github.com/ProjectPythia/cookbook-gallery) which _collects_ YAML files from a bunch of repositories and then uses them to render the gallery.

## Reasons you might not want to use this plugin

- This is an experimental plugin and its design and UX isn't yet proven!
- Jupyter Book has an [issue about adding `listing` functionality](https://github.com/jupyter-book/mystmd/issues/840) and if that results in a _different_ MyST implementation, I'll probably shut this project down and recommend people just use that.

But, if you want to be a bit on the bleeding edge and give feedback, that would be great!
