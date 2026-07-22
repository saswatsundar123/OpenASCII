import test from 'node:test';
import assert from 'node:assert/strict';
import { adjust, dither, getCharset } from '../src/index.js';

test('brightness transform stays within byte range', () => {
  assert.equal(adjust(255,100,4),255); assert.equal(adjust(0,0,4),0);
});
test('dither preserves dimensions', () => {
  assert.equal(dither(new Float32Array(16).fill(120),4,4,'atkinson',.5).length,16);
});
test('custom charset falls back when empty', () => {
  assert.ok(getCharset('custom','').length > 8); assert.equal(getCharset('custom','XYZ'),'XYZ');
});
