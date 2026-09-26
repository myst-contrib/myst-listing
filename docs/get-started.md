---
title: Get started
description: Install the plugin and render your first listing.
---

```{include} ../README.md
:start-after: ## Usage
```

Here's what that looks like:

::::::{myst:demo}
:::{listing}
:path: posts/*.md
:columns: title,date
:::
::::::

Each page's title comes from its `title` frontmatter, or its first heading if there isn't one.
Give each page a `date` in its frontmatter so the newest ones come first.

## Next steps

- To show cards, bullets, or full posts, pick a [display](./displays/index.md).
- To sort, filter, or limit items, see [Transform](./transform.md).
- To list the pages in one section of your site, use the [`toc` source](#toc-source).
- To make a listing from a YAML, JSON, or TOML file, see [Collectors](./collectors.md).
- To reuse a listing on another page, give it a [label](#labels).
