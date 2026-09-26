---
title: Architecture
description: How the plugin's pipeline is split across files, why, and the terms the code uses.
---

The plugin is a three-stage pipeline, one file per stage:

```{mermaid}
flowchart LR
  directive["{listing} directive<br/>src/plugin.ts"] -- placeholder --> collect["Collect<br/>src/collect.ts"]
  collect -- items --> transform["Transform<br/>src/transform.ts"]
  transform -- items --> display["Display<br/>src/display.ts"]
```

`src/plugin.ts` also wires the stages together, and `src/shared.ts` holds a few helpers they share.

```{glossary}
Placeholder
: The `listingPlaceholder` node the `{listing}` directive emits. It carries the directive's options, and the pipeline fills it in and finally replaces it.

Collector
: The code behind a `:source:`. It sets the placeholder's `items` (see [Add a collector](./extending.md#add-a-collector)).

Item
: The plain object that flows between the stages, one per listed thing. See [Items](../collectors.md#items) for the fields it carries.

Transform
: `selectItems` in `src/transform.ts`. It filters, sorts, and limits the items.

Display
: The code behind a `:display:`. It turns the selected items into one AST node.
```

## Why three stages

The design came from several one-off plugins, listed below, that each hand-rolled their own collect-and-display logic.
It separates the stages so that other plugins can reuse the same displays; if that turns out to be more complex than it's worth, we'll simplify it.

### Use cases it was built for

This was designed to be a single tool that could be re-used across these use-cases:

For built-in functionality:

- The [blog plugin](https://github.com/jupyter-book/blog-plugin) has some logic for collecting files on disk and displaying them in a table.
- The [Jupyter Book gallery](https://github.com/jupyter-book/jupyterbook.org/tree/main/docs/src/gallery.yml) has code for hand-rolling a gallery with Python.
- The `feed` display follows the changelog pattern of the Zen browser and nteract changelogs, and the staff-bio pattern of a Berkeley course staff page; see the screenshots in [issue #7](https://github.com/myst-contrib/myst-listing/issues/7).

For plugin-level extensions functionality (ie, we want other MyST plugins to extend `myst-listing` functionality to meet these extra use-cases):

- The [GitHub Issue Table plugin](https://github.com/jupyter-book/myst-plugins) has logic for collecting issues, adding columns, and displaying them in a table.
- The [Project Pythia cookbooks gallery](https://github.com/ProjectPythia/cookbook-gallery) which _collects_ YAML files from a bunch of repositories and then uses them to render the gallery.
