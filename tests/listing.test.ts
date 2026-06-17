/**
 * Minimal end-to-end check: build the demo docs, then assert that the
 * {listing} examples rendered correctly. The pages under docs/displays/ double
 * as the fixtures — one page per display, plus the overview (displays/index.md).
 *
 * Assertions are written to survive growing the demo (more posts, more yaml
 * entries): they check ordering/containment/shape rather than hard-coded lists.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { toText } from "myst-common";

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

describe("table display (displays/table.md)", () => {
  const ast = loadPage("displays.table");
  const tables = tablesIn(ast);
  const [byColumns, titleAsc, filtered, limited, yaml] = tables;

  it("renders one table per listing", () => {
    expect(tables.length).toBe(6); // columns, sort, filter, limit, yaml, filter-live
  });

  it("links the title to the resolved internal page url", () => {
    const link = byColumns.children[1].children[0].children[0];
    expect(link.type).toBe("link");
    expect(link.internal).toBe(true);
    expect(link.url).toContain("2025-"); // a resolved post url
  });

  it("sorts by date-desc by default", () => {
    const dates = column(byColumns, "date");
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("sorts by title-asc when asked", () => {
    const titles = column(titleAsc, "title");
    expect(titles).toEqual([...titles].sort());
  });

  it("filters list fields by containment (tags=news)", () => {
    const tagCells = column(filtered, "tags");
    expect(tagCells.length).toBeGreaterThan(0);
    expect(tagCells.every((t: string) => t.includes("news"))).toBe(true);
  });

  it("caps rows with :limit:", () => {
    expect(rowCount(limited)).toBeLessThanOrEqual(3);
  });

  it("collects from yaml and skips the title-less entry", () => {
    const titles = column(yaml, "title");
    expect(titles).toContain("MyST Markdown");
    expect(titles.every((t: string) => t.length > 0)).toBe(true); // none blank
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
