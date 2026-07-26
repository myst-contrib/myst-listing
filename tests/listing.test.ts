/**
 * Minimal end-to-end check: build the demo docs, then assert that the
 * {listing} examples rendered correctly. The docs pages double as the fixtures:
 * one page per display, the overview (displays/index.md), and transform.md.
 *
 * Assertions are written to survive growing the demo (more posts, more yaml
 * entries): they check ordering/containment/shape rather than hard-coded lists.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { toText } from "myst-common";
import { rawImageSrc, toTagList } from "../src/shared";

const loadPage = (slug: string) =>
  JSON.parse(readFileSync(`docs/_build/site/content/${slug}.json`, "utf-8")).mdast;
const POST_COUNT = readdirSync("docs/posts").filter((f) => f.endsWith(".md")).length;

function allNodes(node: any): any[] {
  let out = [node];
  for (const child of node?.children ?? []) out = out.concat(allNodes(child));
  return out;
}
const tablesIn = (ast: any) => allNodes(ast).filter((n: any) => n.type === "table");
const withClass = (ast: any, cls: string) =>
  allNodes(ast).filter((n) => typeof n?.class === "string" && n.class.split(" ").includes(cls));

// --- Table helpers (read cells by column header) ----------------------------
const headers = (table: any) =>
  table.children[0].children.map((c: any) => toText(c).toLowerCase());
const column = (table: any, name: string) => {
  const i = headers(table).indexOf(name);
  return table.children.slice(1).map((row: any) => toText(row.children[i]));
};
const rowCount = (table: any) => table.children.length - 1;

describe("rawImageSrc", () => {
  it("rewrites a github blob URL to the raw host", () => {
    expect(rawImageSrc("https://github.com/o/r/blob/main/logo.png")).toBe(
      "https://raw.githubusercontent.com/o/r/main/logo.png",
    );
  });
  it("leaves raw and unrelated URLs untouched", () => {
    const raw = "https://raw.githubusercontent.com/o/r/main/logo.png";
    expect(rawImageSrc(raw)).toBe(raw);
    expect(rawImageSrc("https://example.com/x.png")).toBe("https://example.com/x.png");
  });
});

describe("toTagList", () => {
  it("keeps a YAML list, trimmed", () => {
    expect(toTagList(["a", " b "])).toEqual(["a", "b"]);
  });
  it("splits a delimited string on ; or , and drops empties", () => {
    expect(toTagList("a; b, c")).toEqual(["a", "b", "c"]);
    expect(toTagList("a; b;")).toEqual(["a", "b"]); // trailing delimiter
  });
  it("returns [] for empty or non-string/array values", () => {
    expect(toTagList(undefined)).toEqual([]);
    expect(toTagList("")).toEqual([]);
  });
});

describe("table display (displays/table.md)", () => {
  const ast = loadPage("displays.table");
  const tables = tablesIn(ast);
  const [byColumns, yaml, inlineYaml, toml, inlineToml] = tables;

  it("renders one table per listing", () => {
    expect(tables.length).toBe(6); // columns, yaml, inline-yaml, toml, inline-toml, filter-live
  });

  it("collects from inline YAML in the directive body", () => {
    expect(column(inlineYaml, "title")).toEqual(["Inline One", "Inline Two"]);
  });

  it("collects from a toml file, sorting its parsed dates", () => {
    expect(column(toml, "title")).toEqual(["Jupyter Book", "MyST Markdown"]); // date-desc
  });

  it("collects from inline TOML in the directive body", () => {
    expect(column(inlineToml, "title")).toEqual(["Toml One", "Toml Two"]);
  });

  it("links the title to the resolved internal page url", () => {
    const link = byColumns.children[1].children[0].children[0];
    expect(link.type).toBe("link");
    expect(link.internal).toBe(true);
    expect(link.url).toContain("2025-"); // a resolved post url
  });

  it("sorts by date-desc by default", () => {
    // Dates render in long form ("May 15, 2025"), so compare chronologically.
    const times = column(byColumns, "date").map((d: string) => new Date(d).getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it("collects from yaml and skips the title-less entry", () => {
    const titles = column(yaml, "title");
    expect(titles).toContain("MyST Markdown");
    expect(titles.every((t: string) => t.length > 0)).toBe(true); // none blank
  });
});

describe("transform options (transform.md)", () => {
  const ast = loadPage("transform");
  const [titleAsc, random, filtered, limited, unlimited] = tablesIn(ast);

  it("sorts by title-asc when asked", () => {
    const titles = column(titleAsc, "title");
    expect(titles).toEqual([...titles].sort());
  });

  it("shuffles without dropping or duplicating items (sort: random)", () => {
    // Same posts as the title-asc listing, just reordered.
    expect(column(random, "title").sort()).toEqual(column(titleAsc, "title").sort());
  });

  it("filters list fields by containment (tags=news)", () => {
    const tagCells = column(filtered, "tags");
    expect(tagCells.length).toBeGreaterThan(0);
    expect(tagCells.every((t: string) => t.includes("news"))).toBe(true);
  });

  it("caps rows with :limit:", () => {
    expect(rowCount(limited)).toBeLessThanOrEqual(3);
  });

  it("shows every item with :limit: 0", () => {
    expect(rowCount(unlimited)).toBe(POST_COUNT);
  });
});

describe("gallery display (displays/gallery.md)", () => {
  const ast = loadPage("displays.gallery");
  const galleries = withClass(ast, "myst-listing-gallery");

  it("renders every gallery listing on the page", () => {
    // yaml, files, grid-columns, tag-fields, and the filter-live demo.
    expect(galleries.length).toBe(5);
  });

  it("colors :tag-fields: groups by their position in the list", () => {
    // The tag-fields demo (4th gallery) renders `libraries` then `domains`.
    const pills = withClass(galleries[3], "myst-listing-tag");
    const backgrounds = new Set(pills.map((p: any) => p.style?.background));
    expect(pills.length).toBeGreaterThan(0);
    // Two fields → two distinct pill colors.
    expect(backgrounds.size).toBe(2);
  });

  it("uses MyST's clickable card node, with the url on the whole card", () => {
    // Every item here has a url, so every card is a `card` node carrying it.
    const cards = galleries[0].children;
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((c: any) => c.type === "card")).toBe(true);
    expect(cards.map((c: any) => c.url)).toContain("https://mystmd.org");
  });

  it("leads each card with its thumbnail as a cover background image", () => {
    const covers = allNodes(galleries[0]).filter(
      (n: any) => n.class === "myst-listing-cover"
    );
    expect(covers.length).toBe(galleries[0].children.length);
    // The thumbnail rides on the cover div's background, not an image node.
    expect(covers.every((c: any) => c.style?.backgroundImage?.includes("url("))).toBe(true);
  });

  it("honors :grid-columns: for a fixed column count", () => {
    const fixed = galleries.find((g: any) => g.columns?.length === 1);
    expect(fixed?.columns).toEqual([2]);
  });
});

describe("summary display (displays/summary.md)", () => {
  const ast = loadPage("displays.summary");

  it("renders one description-forward card per post", () => {
    const summary = withClass(ast, "myst-listing-summary")[0];
    expect(summary).toBeTruthy();
    const descriptions = allNodes(summary).filter(
      (n: any) => n.class === "myst-listing-description",
    );
    expect(descriptions.length).toBe(POST_COUNT);
  });
});

describe("feed display (displays/feed.md)", () => {
  const ast = loadPage("displays.feed");
  const feeds = withClass(ast, "myst-listing-feed");
  const [blog, changelog, staff] = feeds;

  it("renders every feed listing on the page", () => {
    expect(feeds.length).toBe(5); // blog, changelog, staff, no-images, filter-live
  });

  it("shows one item per release post, separated by a rule", () => {
    const items = withClass(changelog, "myst-listing-item");
    expect(items.length).toBe(3); // posts with :filter: tags=release
    // The rule is a border on each card after the first (not a sibling <hr>),
    // so searchfilter hides an item's rule together with the item.
    expect(items[0].style?.borderTop).toBeUndefined();
    expect(items.slice(1).every((n: any) => n.style?.borderTop)).toBe(true);
    // Every post has a date, so every item gets an identity rail; tags render too.
    expect(withClass(changelog, "myst-listing-rail").length).toBe(3);
    expect(withClass(changelog, "myst-listing-tag").length).toBeGreaterThan(0);
  });

  it("renders the post body, not just the description", () => {
    // A phrase from the Zebra post body, absent from its description.
    expect(toText(changelog)).toContain("responsive columns");
  });

  it("keeps body headings out of the TOC by demoting them", () => {
    expect(withClass(changelog, "myst-listing-heading").length).toBeGreaterThan(0); // Added/Fixed
    expect(allNodes(changelog).filter((n: any) => n.type === "heading").length).toBe(0);
  });

  it("caps the body and links on with :body-limit:", () => {
    const more = withClass(blog, "myst-listing-readmore");
    expect(more.length).toBeGreaterThan(0);
    expect(more[0].children[0].type).toBe("link");
  });

  it("falls back to the description for a yaml source (no page body)", () => {
    expect(withClass(staff, "myst-listing-item").length).toBeGreaterThan(0);
    expect(toText(staff).length).toBeGreaterThan(0);
  });
});

describe("graceful degradation (displays/index.md)", () => {
  const ast = loadPage("displays.index");

  it("warns (does not fail) on an unknown source", () => {
    const errors = allNodes(ast).filter(
      (n: any) => n.type === "admonition" && n.kind === "error",
    );
    expect(JSON.stringify(errors)).toContain("Unknown listing source: 'nope'");
  });

  it("falls back to a table on an unknown display", () => {
    expect(tablesIn(ast).length).toBeGreaterThanOrEqual(2);
  });
});
