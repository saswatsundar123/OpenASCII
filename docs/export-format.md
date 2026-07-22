# Export formats

## Interactive HTML

A single HTML document containing the canvas, image data URL, configuration snapshot, mouse interaction, resize handling, and off-screen pause. It has no runtime package dependency.

The runtime is produced by serializing the same `createOpenAsciiRuntime()` factory imported by the editor. Renderer selection, `FrameData` preprocessing, adaptive dithering, glyph analysis, spring physics, coherent noise, temporal buffers, and post-effects therefore remain identical. Run `pnpm benchmark:export` to regenerate `examples/Profile_OpenASCII.html` from the checked-in portrait benchmark.

## React component

A standalone JSX component with an internal canvas ref and effect. Width, height, class, and style are controlled by the host layout.

## PNG

The current live frame is captured directly from the editor canvas using `toBlob('image/png')`.
