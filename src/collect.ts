/**
 * Collect layer. A collector fills node.items for placeholders whose :source:
 * it owns. Add a built-in source via the `collectors` map below; an external
 * plugin can do the same from its own document-stage transform (see
 * docs/extending.md).
 */
import { globSync } from "glob";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { load } from "js-yaml";
import { getFrontmatter } from "myst-transforms";
import { fileWarn, type TransformSpec } from "myst-common";
import { PLACEHOLDER, ctxRef } from "./shared.js";

export type Collector = (node: any, vfile: any) => void;

function collectFiles(node: any, vfile: any) {
  const searchPath = node.path ?? "./*.md";
  // A bare directory gets `/*.md`; anything with glob chars is used as-is.
  const pattern = /[*?[]/.test(searchPath) ? searchPath : join(searchPath, "*.md");

  node.items = globSync(pattern).map((path) => {
    const ast = ctxRef.parseMyst!(readFileSync(path, { encoding: "utf-8" }));
    const { frontmatter } = getFrontmatter(vfile, ast);
    // Frontmatter fields already match our field names, so pass them through and
    // only add url + a title fallback. url is the project-rooted source path
    // ("/posts/x.md"); MyST's link resolver rewrites it to the real output URL.
    return {
      ...frontmatter,
      url: `/${path}`,
      title: frontmatter?.title ?? "<Untitled>",
    };
  });
}

function collectYaml(node: any, vfile: any) {
  const entries = load(readFileSync(node.path, { encoding: "utf-8" }));
  if (!Array.isArray(entries)) throw new Error(`yaml source ${node.path} is not a top-level list`);
  // Entries already use our field names; pass them through. Title is required.
  node.items = entries.filter((item: any) => {
    if (item?.title) return true;
    fileWarn(vfile, `Skipping ${node.path} entry with no title`, { node });
    return false;
  });
}

/** Built-in collectors, keyed by `:source:`. */
export const collectors: Record<string, Collector> = {
  files: collectFiles,
  yaml: collectYaml,
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
