# Contributing

The code lives in [`src/`](src/), one file per pipeline stage.
See [Architecture](docs/develop/architecture.md) for how they fit together, and [Extending](docs/develop/extending.md) to add a collector or display.

## Build and test

We use [bun](https://bun.sh) to drive the build (see [`package.json`](package.json)):

```bash
bun install        # install dependencies
bun run build      # bundle the plugin to dist/plugin.mjs
bun run test       # build the docs, then run the vitest suite against the output
bun run docs:live  # live docs server while you work
```

The tests in [`tests/`](tests/) build the [`docs/`](docs/) site and assert on the rendered `mdast`.
A passing run means the examples in the docs actually render.

## Cut a release

Two GitHub Actions in [`.github/workflows/`](.github/workflows/) handle publishing:

- `deploy.yml` rebuilds the docs site and publishes it to GitHub Pages on every push to `main`.
- `release.yml` builds the bundle and attaches `dist/plugin.mjs` to a GitHub Release.

To publish a new bundle, draft a release on GitHub with a tag like `v0.1.0`.
