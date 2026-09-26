---
title: Architecture
description: How the plugin's pipeline is split across files, and the terms the code uses.
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
