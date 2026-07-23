import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VISUAL_ARCHETYPES,
  createGenerationContext,
  generatePreset,
  presetSignature,
  validatePreset
} from '../src/preset-generator.js';

test('generation is deterministic and preserves output context', () => {
  const context=createGenerationContext({aspectRatio:'3:4',quality:640},[]);
  const first=generatePreset(4242,context);
  const second=generatePreset(4242,context);
  assert.deepEqual(first,second);
  assert.equal(first.aspectRatio,'3:4');
  assert.equal(first.quality,640);
  assert.equal(validatePreset(first).valid,true);
  assert.equal(typeof presetSignature(first),'string');
});

test('invalid seeds and missing context use deterministic safe defaults', () => {
  assert.deepEqual(generatePreset('invalid'),generatePreset('invalid'));
  const preset=generatePreset('invalid');
  assert.equal(preset.aspectRatio,'original');
  assert.equal(preset.quality,320);
  assert.equal(validatePreset(preset).valid,true);
});

test('the generator declares fourteen target-derived archetypes', () => {
  assert.equal(VISUAL_ARCHETYPES.length,14);
  assert.equal(new Set(VISUAL_ARCHETYPES.map(item=>item.id)).size,14);
  for(const archetype of VISUAL_ARCHETYPES){
    assert.ok(archetype.label);
    assert.ok(archetype.primary.length);
    assert.ok(archetype.palettes.length);
    assert.ok(archetype.fallback);
  }
});

test('quality validation rejects incompatible and unreadable configurations', () => {
  const valid=generatePreset(17);
  assert.equal(validatePreset(valid).valid,true);
  const invalid={
    ...valid,
    contrast:1,
    foreground:'#000000',
    background:'#000000',
    secondaryStyle:valid.artStyle,
    secondaryMix:.8
  };
  const result=validatePreset(invalid);
  assert.equal(result.valid,false);
  assert.ok(result.errors.includes('contrast'));
  assert.ok(result.errors.includes('palette-contrast'));
  assert.ok(result.errors.includes('secondary-style'));
  assert.ok(result.errors.includes('secondary-mix'));
});

test('seed distribution covers the target families without dominant archetypes', () => {
  const outputs=Array.from({length:512},(_,index)=>generatePreset(index+1));
  assert.equal(new Set(outputs.map(item=>item.archetype)).size,14);
  assert.equal(new Set(outputs.map(item=>item.artStyle)).size,9);
  assert.ok(new Set(outputs.map(item=>item.paletteFamily)).size>=7);
  assert.equal(new Set(outputs.map(item=>item.toneProfile)).size,4);
  assert.equal(new Set(outputs.map(item=>item.densityProfile)).size,4);
  assert.ok(new Set(outputs.map(item=>item.secondaryStyle).filter(id=>id!=='none')).size>=5);
  const counts=outputs.reduce((result,item)=>{
    result[item.archetype]=(result[item.archetype]||0)+1;
    return result;
  },{});
  assert.ok(Math.max(...Object.values(counts))/outputs.length<=.14);
  assert.ok(new Set(outputs.map(presetSignature)).size/outputs.length>=.9);
  assert.ok(outputs.some(item=>item.fxPreset==='glitch'));
  for(const output of outputs){
    assert.ok(output.phosphorDecay>=0&&output.phosphorDecay<=.94);
    assert.ok(output.ghostStrength>=0&&output.ghostStrength<=.28);
    assert.ok(Number.isInteger(output.ghostFrames)&&output.ghostFrames>=0&&output.ghostFrames<=3);
    assert.ok(Number.isInteger(output.ghostSpacing)&&output.ghostSpacing>=1&&output.ghostSpacing<=8);
    assert.ok(output.noiseOpacity>=0&&output.noiseOpacity<=.18);
    if(output.fxPreset==='glitch')assert.ok(output.fxStrength<=.22);
  }
});

test('history prevents adjacent structural repetition', () => {
  let history=[],previous=null;
  const archetypes=new Set();
  const firstGalleryArchetypes=new Set();
  for(let seed=1;seed<=100;seed++){
    const context=createGenerationContext({aspectRatio:'1:1',quality:480},history);
    const current=generatePreset(seed,context);
    const signature=presetSignature(current);
    archetypes.add(current.archetype);
    if(seed<=42)firstGalleryArchetypes.add(current.archetype);
    assert.ok(!history.includes(signature));
    if(previous){
      assert.notEqual(current.artStyle,previous.artStyle);
      assert.notEqual(`${current.toneProfile}/${current.densityProfile}`,`${previous.toneProfile}/${previous.densityProfile}`);
      assert.notEqual(current.paletteFamily,previous.paletteFamily);
    }
    history=[...history,signature].slice(-6);
    previous=current;
  }
  assert.equal(archetypes.size,VISUAL_ARCHETYPES.length);
  assert.equal(firstGalleryArchetypes.size,VISUAL_ARCHETYPES.length);
});
