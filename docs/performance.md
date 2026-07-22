# Performance

The editor is designed around predictable Canvas cost rather than DOM nodes per character.

- Device pixel ratio is capped at 2 to avoid unnecessary high-DPI overdraw.
- Source sampling happens on a small off-screen canvas with `willReadFrequently` enabled.
- Cell data is built only when source/grid controls change.
- Pointer interaction is calculated in the same render pass and is never throttled separately.
- The loop targets 60 FPS and falls back to 30 FPS when a frame costs more than 50 ms.
- `IntersectionObserver` prevents drawing while the canvas is outside the viewport.
- “Reduce characters” halves the configured quality, bounded at 160.
- Live FPS and cell counts use tabular numerals to avoid UI layout shift.
- Expensive image analysis and glyph matching run only when source/grid controls change; animation frames reuse typed arrays.
- Glyph measurements are cached by font, size, spacing, and character set.
- The benchmark route (`?benchmark=1`) renders the bundled portrait in a deterministic square viewport; `&style=classic-ascii`, `braille`, `line`, or `particles` selects a hero renderer.

The production editor bundle is approximately 58 kB gzip as of v1.0. Test representative images at quality 320 on the lowest-spec supported device before release.

Quality is the primary policy for the v2 renderer. The adaptive frame controller lowers update cadence rather than changing image-processing decisions or silently reducing output fidelity. On the supplied 720×720 portrait benchmark, the exact shared export differed from the clean editor capture by a mean of 0.3356 channel levels on a 0–255 scale across 129,600 sampled pixels; the remaining subpixel differences come from independent browser captures.
