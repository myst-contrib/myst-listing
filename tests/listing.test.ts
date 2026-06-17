/**
 * Minimal end-to-end check: build the demo docs, then assert that the
 * {listing} examples rendered into real tables with sorted, linked, filtered
 * rows. The examples page (docs/examples.md) is the fixture.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const buildPath = "docs/_build/site/content/examples.json";

function findListingNodes(node: any): any[] {
  let out: any[] = [];
  if (node?.class === "myst-listing") out.push(node);
  for (const child of node?.children ?? []) out = out.concat(findListingNodes(child));
  return out;
}

// Title text of each data row (skip the header row).
const rowTitles = (table: any) =>
  table.children.slice(1).map((row: any) => {
    const node = row.children[0].children[0];
    return node.type === "link" ? node.children[0].value : node.value;
  });

describe("myst-listing", () => {
  const ast = JSON.parse(readFileSync(buildPath, "utf-8")).mdast;
  const tables = findListingNodes(ast).filter((n: any) => n.type === "table");

  it("renders a table per listing", () => {
    // 4 valid listings + the unknown-display one that falls back to a table.
    expect(tables.length).toBe(5);
  });

  it("warns (does not fail) on an unknown source, rendering an error admonition", () => {
    const errors = findListingNodes(ast).filter(
      (n: any) => n.type === "admonition" && n.kind === "error",
    );
    expect(JSON.stringify(errors)).toContain("Unknown listing source: 'nope'");
  });

  it("collects items from an external yaml file (title-less entry skipped)", () => {
    // links.yml has 3 entries; the one missing a title is dropped.
    expect(rowTitles(tables[3])).toEqual(["Jupyter Book", "MyST Markdown"]);
  });

  it("links the title to the resolved internal page url", () => {
    const link = tables[0].children[1].children[0].children[0];
    expect(link.type).toBe("link");
    // MyST resolved our source-path link to the real page url.
    expect(link.internal).toBe(true);
    expect(link.url).toContain("2025-03-01-zebra");
  });

  it("sorts by date-desc (default) and title-asc", () => {
    expect(rowTitles(tables[0])).toEqual([
      "Zebra release notes",
      "A February update",
      "Hello world",
    ]);
    const titleAsc = rowTitles(tables[1]);
    expect(titleAsc).toEqual([...titleAsc].sort());
  });

  it("filters list fields by containment (tags=news)", () => {
    // Only the two news-tagged posts, still date-desc.
    expect(rowTitles(tables[2])).toEqual(["A February update", "Hello world"]);
  });
});
