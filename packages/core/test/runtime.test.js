import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpenAsciiRuntime, createRuntimeSource } from '../src/index.js';

test('runtime factory exposes the shared rendering contracts', () => {
  const runtime = createOpenAsciiRuntime();
  assert.equal(typeof runtime.AsciiEngine, 'function');
  assert.equal(typeof runtime.FrameProcessor, 'function');
  assert.equal(typeof runtime.GlyphAtlas, 'function');
  assert.equal(typeof runtime.PhysicsField, 'function');
});

test('serialized export runtime is executable and API-equivalent', () => {
  const runtime = new Function(`return ${createRuntimeSource()}`)();
  assert.deepEqual(Object.keys(runtime).sort(), Object.keys(createOpenAsciiRuntime()).sort());
  assert.equal(runtime.DEFAULTS.seed, 1337);
});
