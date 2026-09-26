---
title: Displays
---

A `{listing}` renders its collected items with one of six built-in **displays**, chosen with the `:display:` option.
Each leads with something different:

```{list-table}
:header-rows: 1

* - Display
  - Best for
  - Leads with
* - [`table`](./table.md)
  - dense, scannable lists
  - the columns you pick
* - [`list`](./list.md)
  - compact link lists, section landing pages
  - the first column you pick, then the rest on one line
* - [`gallery`](./gallery.md)
  - visual collections
  - a thumbnail image
* - [`summary`](./summary.md)
  - blog indexes, reading lists (scan and click through)
  - the description
* - [`feed`](./feed.md)
  - blogs, bios (read in place)
  - the full body
* - [`sections`](./sections.md)
  - whole pages built from a listing, like release notes or combined meeting notes
  - an `##` heading per item, then the full body
```

Sorting, filtering, and limiting work the same in every display and are covered in [](../transform.md).

## Options for every display

Each display page covers its own options.
These work across displays.

(tag-fields)=
### Color-code several tag fields

By default the tag row shows each item's `tags`.
List several fields with `:tag-fields:` to show more than one kind of tag, each in its own color.
In an item, each of these fields can hold a list or a comma-separated string:

::::::{myst:demo}
:::{listing}
:source: yaml
:path: ../links.yml
:display: gallery
:tag-fields: libraries, domains
:::
::::::

Colors come from a small fixed palette, assigned by list order, so keep the order consistent across pages.
It works in every display that shows tags: `gallery`, `summary`, `feed`, and `sections`.

(filter-live)=
### Filter it live

Add the [`searchfilter`](https://github.com/jupyter-book/myst-plugins/tree/main/plugins/searchfilter) plugin to your `myst.yml` to give readers a search box that filters a listing as they type:

```yaml
project:
  plugins:
    - https://raw.githubusercontent.com/jupyter-book/myst-plugins/main/plugins/searchfilter/searchfilter.mjs
```

Then put a `{searchfilter}` directive on the page, with the item selector for your display as its argument.
Each display page has a demo.

| Display | Selector |
| --- | --- |
| `gallery` | `.myst-listing-gallery .myst-card` |
| every other display | `.myst-listing-item` |

(labels)=
### Labels and embeds

A `:label:` makes a listing a reference target.
Link to it, or embed it on any page in your project with `![](#label)`.
The embed shows the same items as the original.
Its `:path:` resolves from the page that holds the `{listing}`, not the page that embeds it:

::::::{myst:demo}
:::{listing}
:label: recent-posts
:path: ../posts/*.md
:columns: title,date
:::

![](#recent-posts)
::::::

### Unknown displays

An unknown `:display:` warns and falls back to a table:

::::::{myst:demo}
:::{listing}
:path: ../posts/*.md
:display: nope
:::
::::::
