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
