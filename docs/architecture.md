# Architecture

OpenASCII separates rendering from the editor so the same behavior can be used in React and in dependency-free exports.

## Data flow

1. The browser decodes an image locally into an `HTMLImageElement`.
2. The core engine crops it to the preview, downsamples it to a cell grid, and computes luminance.
3. Brightness, contrast, and the selected dither algorithm produce cell intensity values.
4. The chosen style maps each cell to text or a Canvas primitive.
5. The render loop adds motion FX, pointer displacement, color, vignette, and border glow.
6. Exporters snapshot the source and configuration into a downloadable artifact.

## Package boundaries

`@openascii/core` has no React dependency. `@openascii/react` owns the engine lifecycle, resize observation, and teardown. `@openascii/app` owns the editor store and UI.

Configuration changes that affect the grid rebuild cells. Per-frame settings such as pointer physics, color, vignette, and motion strength update without resampling the source.

## Quality pipeline

The v2 runtime builds immutable `FrameData` from a three-samples-per-cell analysis image. It applies linear-light luminance conversion, gamma, global contrast, local contrast enhancement, Scharr gradients, edge magnitude, variance, saliency, color averaging, adaptive dithering, and Braille sub-cell masks. A font-specific glyph atlas measures candidate coverage, directional density, complexity, and centroid before selecting glyphs by weighted feature distance.

Animation state is separate from image analysis. Each cell has a rest position, velocity, mass, and persistent displacement integrated with delta time, spring force, damping, coherent noise, and the selected pointer force field.

`createOpenAsciiRuntime()` is intentionally self-contained. The React editor imports it normally, while HTML and JSX exporters serialize the same factory. There is no reduced export renderer.

## Privacy

Image input uses `FileReader` and a data URL. There are no upload endpoints, analytics calls, accounts, or persistence APIs in the app.
