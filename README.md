# MyST Listings

A simple MyST plugin for **collecting** items, optionally **transforming** them to add extra metadata, and then **displaying** them in a variety of structured views.

Out of the box, this plugin supports **tables**, **galleries**, and **summaries** of each entry. 

## Usage

Add the plugin to your `myst.yml`:

```yaml
project:
  plugins:
    - path/to/plugin.mjs
```

Then collect a folder of pages and display them. With no options, `{listing}`
shows a table of the markdown files in the current folder:

````markdown
```{listing}
:path: posts/*.md
:columns: title,date
```
````
