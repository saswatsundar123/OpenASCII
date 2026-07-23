import test from 'node:test';
import assert from 'node:assert/strict';
import { createProceduralPreset, PRESET_SYSTEMS, STYLES, VISUAL_ARCHETYPES } from '../src/presets.js';

test('procedural presets are deterministic and constrained', () => {
  assert.deepEqual(createProceduralPreset(4242), createProceduralPreset(4242));
  for(let seed=1;seed<=64;seed++){
    const preset=createProceduralPreset(seed);
    assert.ok(VISUAL_ARCHETYPES.some(archetype=>archetype.id===preset.archetype));
    assert.equal(preset.quality,320);
    assert.equal(preset.aspectRatio,'original');
    assert.ok(preset.contrast>=1.25&&preset.contrast<=2.1);
    assert.ok(preset.densityScale>=.92&&preset.densityScale<=1.3);
    assert.ok(preset.clickSensitivity>=.9&&preset.clickSensitivity<=1.5);
    assert.ok(preset.particleVariation>=0&&preset.particleVariation<=1);
    assert.ok(preset.particleJitter>=0&&preset.particleJitter<=.5);
  }
});

test('procedural generator spans multiple coherent rendering systems', () => {
  const outputs=Array.from({length:128},(_,seed)=>createProceduralPreset(seed+100));
  assert.ok(new Set(outputs.map(p=>p.artStyle)).size>=7);
  assert.ok(new Set(outputs.map(p=>p.colorMode)).size>=7);
  assert.equal(new Set(outputs.map(p=>p.archetype)).size,14);
});

test('coherent preset systems cover every ASC11 art-style family', () => {
  const styleIds=STYLES.map(([id])=>id).sort();
  const covered=[...new Set(PRESET_SYSTEMS.map(system=>system.artStyle))].sort();
  assert.deepEqual(covered,styleIds);
  assert.equal(styleIds.length,9);
});

test('preset systems vary composition rather than only renderer and color', () => {
  assert.ok(new Set(PRESET_SYSTEMS.map(system=>system.toneProfile)).size>=4);
  assert.ok(new Set(PRESET_SYSTEMS.map(system=>system.densityProfile)).size>=4);
  assert.ok(new Set(PRESET_SYSTEMS.map(system=>system.secondaryStyle)).size>=4);
  assert.ok(new Set(PRESET_SYSTEMS.map(system=>system.secondaryRegion)).size>=4);
  assert.ok(PRESET_SYSTEMS.filter(system=>system.secondaryStyle!=='none').length>=5);
});
