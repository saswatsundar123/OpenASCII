# OpenASCII Step 7: Coherent Procedural Preset Generator

## Goal

Replace numeric parameter jitter with a constrained procedural generator that repeatedly produces visually distinct, intentionally designed ASCII artwork at the quality level demonstrated by the reference images in `internal_dev/target_images/`.

Random generation changes visual style only. It must preserve the loaded source, selected aspect ratio, selected output quality, and framing.

## Success criteria

Repeatedly pressing `RANDOM` must:

- produce a visibly different composition, not merely another color treatment;
- preserve recognizable facial features and important image structure;
- use renderer, composition, palette, glyph, effect, and interaction settings that belong together;
- avoid unreadable density, destructive effects, weak contrast, and incompatible secondary renderers;
- avoid immediately repeating the same renderer, tonal topology, or palette family;
- retain exact editor/export parity because the result is a normal complete rendering configuration;
- preserve source, aspect ratio, quality, and all export framing.

The generator must cover every major visual family represented by the target gallery across a sufficiently large deterministic seed sample.

## Target-derived archetypes

Step 7 uses fourteen archetypes. They are visual grammars, not fixed presets.

1. **Inverse Braille Field** — dense braille lattice, negative portrait topology, cyan or phosphor palette.
2. **Matrix Glyph Portrait** — terminal or classic glyph field, binary/katakana set, matrix palette.
3. **Amber Mosaic** — block, Claude Code, or retro marks with banded tone and warm monitor palette.
4. **Silver Halftone** — circular primitives, threshold topology, grayscale or ice palette.
5. **Contour Wire** — contour/flow lines driven by edges with restrained secondary marks.
6. **Directional Engraving** — scan lines with a coherent angle field, amber or duotone palette.
7. **Electric Particle Field** — depth-varied particles, structure-led density, cyan or palette-gradient color.
8. **Dot Cross Portrait** — dot, cross, ring, and braille secondary marks distributed by detail.
9. **Editorial ASCII** — high-detail classic glyph selection with restrained monochrome treatment.
10. **Sampled Pixel Field** — source-color retro/block cells with ordered density and minimal effects.
11. **Phosphor Terminal** — binary/hex terminal glyphs, interval or CRT treatment, green or phosphor palette.
12. **Negative Particle Relief** — inverted particle or halftone topology with bright ground and dark subject regions.
13. **Hybrid Edge Mosaic** — mosaic primary renderer with line/dot edge reinforcement.
14. **Sparse Signal Field** — edge-led negative space, glow accents, and low-density particles or lines.

Each archetype must generate multiple valid variants while retaining its recognizable visual identity.

## Generator architecture

### Data model

Create a focused generator module separate from the editor component:

`packages/app/src/preset-generator.js`

It exports:

- `VISUAL_ARCHETYPES`: immutable archetype definitions;
- `generatePreset(seed, context)`: returns a complete validated style config;
- `presetSignature(config)`: returns a structural novelty signature;
- `validatePreset(config)`: returns validation information;
- `createGenerationContext(config, history)`: captures preserved output state and novelty history.

`context` contains:

- `aspectRatio`;
- `quality`;
- up to six previous structural signatures.

It must never include or mutate the source image.

### Archetype grammar

Each archetype defines compatible choices and bounded ranges for:

- primary renderer;
- optional secondary renderer and target region;
- tone and density profiles;
- character set and font family;
- palette family and concrete colors;
- dither strategy;
- effect family and maximum strength;
- background treatment;
- interaction mode;
- renderer-specific geometry;
- preprocessing ranges;
- glow and temporal ranges.

Values are selected with deterministic weighted choice. Numeric values are sampled inside narrow archetype-owned ranges, not global jitter ranges.

### Determinism

The same seed and context must produce the same result. No call inside generation may use `Math.random()`, wall-clock time, browser state, or mutable module state.

The UI may use the current time only to create a seed before calling the pure generator.

## Quality rules

`validatePreset` enforces static constraints before a result can be returned.

### Global

- contrast must remain between `1.25` and `2.1`;
- gamma must remain between `0.76` and `1.12`;
- density scale must remain between `0.92` and `1.3`;
- character spacing must remain between `0.82` and `1.16`;
- glow strength must remain between `0.04` and `0.34`;
- effect strength must remain between `0` and `0.34`;
- click sensitivity must remain between `0.9` and `1.5`;
- foreground and background colors must not be identical;
- secondary style must not equal primary style;
- secondary mix must be zero when secondary style is `none`;
- secondary mix must remain between `0.1` and `0.34` when enabled.

### Compatibility

- terminal rendering uses `binary`, `simple`, or `custom` glyph systems;
- retro and mosaic archetypes use `blocks`, `simple`, or `detailed`;
- edge-led density requires elevated local contrast and edge enhancement;
- threshold density cannot combine a high threshold with low contrast;
- CRT and intervals remain restrained for fine glyph fields;
- glitch is not used by sparse or contour archetypes;
- source-color mode is limited to sampled pixel and selected particle/mosaic archetypes;
- line secondary rendering is limited to edge or detail regions;
- temporal persistence above `0.3` is limited to CRT or particle archetypes;
- negative/inverse archetypes receive composed-tone visibility sufficient to avoid black output.

Generation retries with a deterministic derived seed when validation fails. After a small fixed retry count, it returns the archetype's known-safe fallback.

## Uniqueness rules

A structural signature is:

`archetype / primary renderer / secondary renderer / tone profile / density profile / palette family / effect family`

The generator receives up to six recent signatures.

It must reject:

- an exact recent signature;
- the immediately previous primary renderer;
- the immediately previous combination of tone profile and density profile;
- the immediately previous palette family.

If all candidates conflict, restrictions relax in this order:

1. allow the previous palette family;
2. allow the previous tone/density pair;
3. allow the previous primary renderer;

An exact signature must never repeat within the supplied history window.

Across seeds `1..512`, automated distribution tests require:

- all fourteen archetypes;
- all nine renderer families;
- at least seven palette families;
- all four tone profiles;
- all four density profiles;
- at least five secondary renderer families;
- no archetype representing more than 14% of generated results;
- at least 90% unique structural signatures when generation runs without history;
- 100% adjacent primary-renderer, tone/density, and palette-family novelty when compatible candidates exist and history is supplied.

## Editor integration

Move Random behavior into the editor store:

- store the last six signatures;
- call the pure generator with the current aspect ratio and quality;
- apply the generated style config;
- restore/preserve aspect ratio and quality defensively;
- append the new signature to bounded history.

The Random button calls the store action and contains no generation logic.

The preset modal continues to expose deterministic named presets. Generated configs include both `name` and `archetype` for display and export metadata.

## ASC11 metadata readout

Replace the compact four-row readout with:

- `FMT` — `ASCII CANVAS`;
- `STYLE` — generated archetype or active renderer label;
- `FONT` — active font;
- `AR` — selected aspect ratio, including `ORIGINAL`;
- `FX` — active effect or `NONE`;
- `BG` — active background hex color;
- `RES` — selected numeric quality, or `DYNAMIC` only when adaptive quality exists and is enabled.

The current editor does not expose adaptive resolution as a user state, so Step 7 reports the selected numeric quality. It must not falsely display `DYNAMIC`.

The readout remains legible at the Step 6 type-size floor.

## Error handling

- Invalid seeds normalize to an unsigned integer.
- Missing context falls back to `aspectRatio: original`, `quality: 320`, and empty history.
- Unknown archetype values never enter returned configs.
- Failed validation uses deterministic retry and then a known-safe fallback.
- Existing presets without `archetype` display their renderer name in the metadata readout.

## Export behavior

Generated configurations require no special runtime branch. HTML and React exports serialize the complete resolved config, including archetype metadata where harmless, and use the exact shared rendering runtime.

Aspect ratio and quality remain those selected before generation.

## Verification

- Unit tests cover deterministic generation, validation, preservation, retry, signatures, history, distribution, and target-family coverage.
- Store tests verify Random preserves aspect ratio and quality and bounds novelty history.
- UI verification checks all seven metadata rows and legibility.
- Browser capture produces a deterministic gallery of at least twenty-four generated seeds.
- Visual review compares the gallery against every target-derived archetype.
- Existing core rendering, physics, aspect-ratio, export, and production-build checks remain green.

## Out of scope

- Randomizing source images;
- randomizing aspect ratio;
- randomizing output quality;
- image-specific ML scoring;
- saving user generations to a backend;
- a general-purpose node-based layer graph;
- claiming adaptive `DYNAMIC` resolution before that feature exists.
