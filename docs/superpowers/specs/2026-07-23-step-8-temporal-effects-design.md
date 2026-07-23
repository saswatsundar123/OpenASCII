# Step 8 Temporal Effects and Export Parity Design

## Objective

Complete OpenASCII's temporal rendering layer without expanding the product beyond the existing editor. Glow, CRT decay, beam sweep, animated noise, ghost frames, glitch, and persistence must enhance rather than obscure the source portrait. The editor, self-contained HTML export, and React export must use the same implementation and resolved configuration.

After temporal verification, replace the editor's acid-lime interface accent with a single electric-blue accent of comparable intensity. Artwork palette choices such as Matrix Green and Phosphor remain available; only the software interface chrome changes.

## Scope Boundary

Step 8 contains exactly four deliverables:

1. A shared temporal compositor in `@openascii/core`.
2. Portrait-safe controls, defaults, procedural values, and validation.
3. HTML/React serialization parity and deterministic temporal verification.
4. A token-level lime-to-electric-blue editor UI change.

Step 8 does not add new renderers, redesign the editor layout, introduce a second export runtime, or replace Canvas 2D with a WebGL-only pipeline.

## Architecture

`TemporalCompositor` lives inside `createOpenAsciiRuntime()` so `createRuntimeSource()` serializes it with the rest of the engine. It owns:

- one accumulated history canvas;
- three bounded ghost-frame canvases;
- ghost capture cadence;
- frame-rate-independent decay calculations;
- deterministic animated-noise drawing.

`AsciiEngine` continues to render structure into `scene` and highlights into `highlight`. The fixed composite order becomes:

1. background;
2. accumulated temporal history;
3. bounded ghost samples;
4. current scene;
5. highlight and glow;
6. WebGL CRT/scanline/chromatic pass when available;
7. beam sweep, animated noise, and intermittent glitch;
8. vignette and border;
9. history and ghost capture.

Physics, `FrameData`, glyph selection, renderers, and composition profiles remain unchanged.

## Temporal Configuration

The shared runtime configuration adds:

- `phosphorDecay`: number from `0` through `0.94`;
- `ghostStrength`: number from `0` through `0.28`;
- `ghostFrames`: integer from `0` through `3`;
- `ghostSpacing`: integer frame interval from `1` through `8`;
- `noiseOpacity`: number from `0` through `0.18`.

Existing `temporalPersistence`, `glowStrength`, `fxPreset`, and `fxStrength` remain supported.

Per-step retention is calculated from elapsed time:

```js
Math.pow(retentionAt60Fps, dt * 60)
```

This makes decay consistent when adaptive rendering moves between 60 FPS and 30 FPS.

## Portrait-Safe Constraints

- Glow is derived only from the existing saliency highlight buffer.
- CRT and persistence retention never exceed `0.94`.
- Ghost strength never exceeds `0.28` and uses at most three samples.
- Animated noise opacity never exceeds `0.18`.
- Procedural glitch strength never exceeds `0.22`.
- Glitch remains intermittent and overlays bounded horizontal slices.
- Effects never trigger image analysis or alter immutable `FrameData`.
- Changing temporal controls does not rebuild the analyzed frame.

`validatePreset()` rejects out-of-range values and rejects strong glitch, CRT, or persistence configurations.

## Editor and Procedural Generator

The Motion FX section exposes phosphor decay, ghost strength, ghost frames, ghost spacing, and animated-noise opacity. Values update the existing Zustand configuration.

Procedural archetypes may choose glitch, CRT, beam sweep, animated noise, or no effect. `resolveEffect()` produces coherent supporting temporal values based on the chosen effect. Safe fallback presets disable persistence and ghosting.

## Export Parity

No exporter-specific effects code is permitted.

`createHtmlArtifact()` and `createReactArtifact()` serialize the complete resolved config and embed `createRuntimeSource()`. Export tests assert the new temporal fields and `TemporalCompositor` are present in both artifacts. The generated benchmark HTML is regenerated after implementation.

## UI Accent

The interface accent becomes electric blue:

```css
--accent-ui: #169bff;
--accent-ui-soft: #62baff;
--accent-ui-rgb: 22,155,255;
```

Every acid-lime border, glow, active state, status indicator, slider, wordmark accent, modal accent, and export action derives from these tokens. Renderer palette options such as `matrix-green`, `phosphor`, and custom artwork colors are not changed.

## Verification

- Unit tests prove frame-rate-independent decay and bounded ghost taps.
- Generator tests prove every temporal value remains within its safe range and glitch is reachable.
- Export tests prove HTML and React contain the resolved temporal configuration and shared compositor.
- Browser capture verifies temporal effect configurations render a nonempty square canvas.
- The full unit suite, generated-gallery benchmark, production build, export regeneration, aspect benchmark, and `git diff --check` pass.
- A fresh UI screenshot confirms no acid-lime interface chrome remains.

