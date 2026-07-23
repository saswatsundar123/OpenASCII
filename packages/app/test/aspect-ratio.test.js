import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveOutputRatio } from '../src/aspect-ratio.js';

test('fixed output ratios resolve to exact numeric values', () => {
  assert.equal(resolveOutputRatio('16:9'),16/9);
  assert.equal(resolveOutputRatio('4:3'),4/3);
  assert.equal(resolveOutputRatio('1:1'),1);
  assert.equal(resolveOutputRatio('3:4'),3/4);
  assert.equal(resolveOutputRatio('9:16'),9/16);
});

test('original output ratio follows the loaded source with a safe fallback', () => {
  assert.equal(resolveOutputRatio('original',{naturalWidth:1200,naturalHeight:800}),1.5);
  assert.equal(resolveOutputRatio('original',{width:720,height:1280}),720/1280);
  assert.equal(resolveOutputRatio('original'),1);
  assert.equal(resolveOutputRatio('unknown',{naturalWidth:1200,naturalHeight:800}),1.5);
});
