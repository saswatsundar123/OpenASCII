import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEditorMetadata } from '../src/editor-metadata.js';

test('metadata matches the seven-row ASC11 readout contract', () => {
  assert.deepEqual(buildEditorMetadata({
    archetypeLabel:'AMBER MOSAIC',
    artStyle:'claude-code',
    font:'Space Mono',
    aspectRatio:'3:4',
    fxPreset:'noise-field',
    background:'#080400',
    quality:480
  }),[
    ['FMT','ASCII CANVAS'],
    ['STYLE','AMBER MOSAIC'],
    ['FONT','SPACE MONO'],
    ['AR','3:4'],
    ['FX','NOISE FIELD'],
    ['BG','#080400'],
    ['RES','480']
  ]);
});

test('metadata uses honest fallbacks for custom and non-adaptive configs', () => {
  const rows=buildEditorMetadata({
    artStyle:'classic-ascii',
    font:'Courier New',
    aspectRatio:'original',
    fxPreset:'none',
    background:'#000000',
    quality:320
  });
  assert.deepEqual(rows[1],['STYLE','CLASSIC ASCII']);
  assert.deepEqual(rows[3],['AR','ORIGINAL']);
  assert.deepEqual(rows[4],['FX','NONE']);
  assert.deepEqual(rows[6],['RES','320']);
  assert.notEqual(rows[6][1],'DYNAMIC');
});
