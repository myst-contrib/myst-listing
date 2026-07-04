# MyST Listings

A simple MyST plugin for **collecting** items, optionally **transforming** them to add extra metadata, and then **displaying** them in a variety of structured views.

Out of the box, this plugin supports **tables**, **galleries**, **summaries**, and **feeds** of each entry.

> [!NOTE]
>
> This is an experimental MyST plugin that combines functionality from several other plugins into a single listing directive. It is early-stage and may change. Feedback is welcome.

## Usage

Reference the released plugin bundle directly from GitHub in your `myst.yml`.
This pulls the bundle attached to the _latest_ release, so MyST loads it without a build or install step:

```yaml
project:
  plugins:
    - https://github.com/myst-contrib/myst-listing/releases/latest/download/plugin.mjs
```

To pin a specific version, swap `latest/download` for a tag, e.g. `download/v0.1.0`.

Alternatively, build the bundle yourself (`npm run build`) and reference it from a local path:

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
