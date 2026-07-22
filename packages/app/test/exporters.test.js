import test from 'node:test';
import assert from 'node:assert/strict';
import { createHtmlArtifact, createReactArtifact } from '../src/exporters.js';

const config = { colorMode: 'grayscale', invertColor: true, foreground: '#fff', background: '#000', artStyle: 'particles' };
const source = 'data:image/png;base64,benchmark';

test('HTML export embeds the exact shared runtime and state', () => {
  const html = createHtmlArtifact(config, source);
  assert.match(html, /class AsciiEngine/);
  assert.match(html, /class FrameProcessor/);
  assert.match(html, /class PhysicsField/);
  assert.match(html, /"artStyle":"particles"/);
  assert.match(html, /data:image\/png;base64,benchmark/);
  assert.doesNotMatch(html, /standaloneRuntime/);
});

test('React export embeds shared runtime with lifecycle cleanup', () => {
  const jsx = createReactArtifact(config, source);
  assert.match(jsx, /class GlyphAtlas/);
  assert.match(jsx, /resizeObserver\.disconnect\(\)/);
  assert.match(jsx, /engine\.destroy\(\)/);
});
