# Examples

These pages double as the plugin's test fixtures - the test suite builds this
site and asserts on the rendered tables.

## Newest first

The default sort is `date-desc`:

```{listing}
:path: posts/*.md
:columns: title,date,tags
```

## Alphabetical by title

```{listing}
:path: posts/*.md
:columns: title,date
:sort: title-asc
```

## Filtered to one tag

```{listing}
:path: posts/*.md
:columns: title,date,tags
:filter: tags=news
```

## From an external YAML file

Set `:source: yaml` and point `:path:` at a `.yml` whose top-level list entries
use our field names (`title`, `url`, `description`, `date`, `tags`, ...):

```{listing}
:source: yaml
:path: links.yml
:columns: title,description,date
```

## Unknown source (graceful warning)

A source no collector owns warns and renders a note instead of failing:

```{listing}
:source: nope
```

## Unknown display (falls back to table)

An unknown display warns and falls back to a table:

```{listing}
:path: posts/*.md
:display: nope
```
