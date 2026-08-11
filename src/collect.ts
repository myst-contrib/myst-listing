/**
 * Collect layer. A collector fills node.items for placeholders whose :source:
 * it owns. Add a built-in source via the `collectors` map below; an external
 * plugin can do the same from its own document-stage transform (see
 * docs/extending.md).
 */
import { globSync } from "glob";
import { readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { load } from "js-yaml";
import { parse as parseToml } from "smol-toml";
import { getFrontmatter } from "myst-transforms";
import { fileWarn, type TransformSpec } from "myst-common";
import { PLACEHOLDER, ctxRef } from "./shared.js";

export type Collector = (node: any, vfile: any) => void;

/** Resolve a :path: relative to the page containing the directive. */
const fromPage = (vfile: any, path: string) => resolve(dirname(vfile.path), path);

function collectFiles(node: any, vfile: any) {
  const searchPath = node.path ?? "./*.md";
  // A bare directory gets `/*.md`; anything with glob chars is used as-is.
  const pattern = /[*?[]/.test(searchPath) ? searchPath : join(searchPath, "*.md");

  node.items = globSync(fromPage(vfile, pattern)).map((abs) => {
    const path = relative(process.cwd(), abs);
    const ast = ctxRef.parseMyst!(readFileSync(abs, { encoding: "utf-8" }));
    const { frontmatter } = getFrontmatter(vfile, ast);
    // url is the project-rooted source path ("/posts/x.md"); MyST's link
    // resolver rewrites it to the real output URL. body (parsed blocks, only
    // rendered by the feed display) has a known limitation: relative image/link
    // paths resolve against the listing page, not the source file.
    return {
      ...frontmatter,
      url: `/${path}`,
      title: frontmatter?.title ?? "<Untitled>",
      body: ast.children ?? [],
    };
  });
}

function requireTitles(entries: any[], src: string, node: any, vfile: any) {
  return entries.filter((item: any) => {
    if (item?.title) return true;
    fileWarn(vfile, `Skipping ${src} entry with no title`, { node });
    return false;
  });
}

function collectYaml(node: any, vfile: any) {
  // Inline YAML in the directive body wins over :path:; either is a top-level list.
  const src = node.body ? "directive body" : node.path;
  const entries = load(node.body ?? readFileSync(fromPage(vfile, node.path), { encoding: "utf-8" }));
  if (!Array.isArray(entries)) throw new Error(`yaml source ${src} is not a top-level list`);
  node.items = requireTitles(entries, src, node, vfile);
}

function collectJson(node: any, vfile: any) {
  // Same shape as yaml: the file (or directive body) is one top-level list.
  const src = node.body ? "directive body" : node.path;
  const entries = JSON.parse(node.body ?? readFileSync(fromPage(vfile, node.path), { encoding: "utf-8" }));
  if (!Array.isArray(entries)) throw new Error(`json source ${src} is not a top-level list`);
  node.items = requireTitles(entries, src, node, vfile);
}

function collectToml(node: any, vfile: any) {
  // TOML has no top-level list, so the items live in one array-of-tables
  // (e.g. [[items]]); the key's name doesn't matter, but there must be only one.
  const src = node.body ? "directive body" : node.path;
  const doc: any = parseToml(node.body ?? readFileSync(fromPage(vfile, node.path), { encoding: "utf-8" }));
  const keys = Object.keys(doc);
  const entries = keys.length === 1 ? doc[keys[0]] : undefined;
  if (!Array.isArray(entries)) throw new Error(`toml source ${src} must hold one top-level array-of-tables, e.g. [[items]]`);
  node.items = requireTitles(entries, src, node, vfile);
}

/** Built-in collectors, keyed by `:source:`. */
export const collectors: Record<string, Collector> = {
  files: collectFiles,
  yaml: collectYaml,
  json: collectJson,
  toml: collectToml,
};

/** Document-stage transform: fill items for every placeholder we own. */
export const collectTransform: TransformSpec = {
  name: "listing-collect",
  stage: "document",
  doc: "Collect items for {listing} placeholders.",
  plugin: (_opts, utils) => (tree, vfile) => {
    for (const node of utils.selectAll(PLACEHOLDER, tree) as any[]) {
      const collect = collectors[node.source];
      if (!collect) continue; // an external plugin may own this source
      try {
        collect(node, vfile);
      } catch (err: any) {
        node.error = String(err?.message ?? err);
      }
    }
  },
};
