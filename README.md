# OpenASCII

OpenASCII is a local-first, browser-based ASCII art studio inspired by [asc11.com](https://asc11.com). Turn an image into an animated, mouse-reactive composition, then export it as a self-contained HTML file, a React component, or a PNG.

No image is uploaded. Rendering and export happen entirely in the browser.

## Quick start

```bash
corepack enable
pnpm install
pnpm dev
```

Open the Vite URL, drop a JPG, PNG, or GIF onto the preview, and edit in real time.

## Included

- Nine render modes: Classic ASCII, Braille, Halftone, Dot Cross, Line, Particles, Claude Code, Retro Art, and Terminal
- Floyd–Steinberg, Atkinson, ordered, and disabled dithering
- Five color modes and five motion presets
- Cursor attract/push interaction with radius, strength, and falloff controls
- Resolution controls from 160 through 640 and one-click character reduction
- Interactive HTML, React JSX, and PNG export
- Adaptive 60/30 FPS rendering and automatic off-screen pause
- Responsive desktop/mobile editor UI

## Rendering-quality benchmark

The checked-in portrait is processed through local-contrast enhancement, Scharr edge analysis, saliency-weighted sampling, adaptive dithering, font-specific glyph scoring, and renderer-specific geometry. Reference captures for the four quality-first renderers are available in [`examples/benchmarks`](examples/benchmarks), alongside the independently captured HTML-export frame.

Open `http://localhost:5173/?benchmark=1` for the deterministic square benchmark. Add `&style=classic-ascii`, `braille`, `line`, or `particles`. Regenerate the self-contained export with `corepack pnpm benchmark:export`.

## Commands

```bash
pnpm dev       # editor development server
pnpm build     # production build
pnpm test      # core engine unit tests
```

## Workspace

- `packages/core` — framework-free Canvas engine and image pipeline
- `packages/react` — lifecycle-safe React canvas wrapper
- `packages/app` — Vite editor, presets, controls, and exporters

See [architecture](docs/architecture.md) and [performance notes](docs/performance.md) for implementation details.

## Browser support

Current Chrome, Edge, Firefox, and Safari releases with Canvas 2D, `ResizeObserver`, and `IntersectionObserver` support.

## License

Open source. Add the repository license of your choice before redistribution.
