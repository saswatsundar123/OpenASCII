import test from 'node:test';
import assert from 'node:assert/strict';
import { useEditor } from '../src/store.js';
import { presetSignature } from '../src/preset-generator.js';

test('store randomization preserves aspect ratio and output quality', () => {
  useEditor.getState().setConfig({aspectRatio:'9:16',quality:640});
  useEditor.getState().randomizeStyle(1001);
  const state=useEditor.getState();
  assert.equal(state.config.aspectRatio,'9:16');
  assert.equal(state.config.quality,640);
  assert.equal(state.generationHistory.length,1);
  assert.equal(state.generationHistory[0],presetSignature(state.config));
});

test('store bounds history and avoids adjacent structural repetition', () => {
  let previous=useEditor.getState().config;
  for(let seed=2001;seed<=2009;seed++){
    useEditor.getState().randomizeStyle(seed);
    const current=useEditor.getState().config;
    assert.notEqual(current.artStyle,previous.artStyle);
    assert.notEqual(`${current.toneProfile}/${current.densityProfile}`,`${previous.toneProfile}/${previous.densityProfile}`);
    assert.notEqual(current.paletteFamily,previous.paletteFamily);
    previous=current;
  }
  assert.equal(useEditor.getState().generationHistory.length,6);
  useEditor.getState().applyPreset({name:'Template',artStyle:'braille'});
  assert.deepEqual(useEditor.getState().generationHistory,[]);
});
