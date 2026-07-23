import test from 'node:test';
import assert from 'node:assert/strict';
import { createHtmlArtifact, createReactArtifact } from '../src/exporters.js';
import { createGenerationContext, generatePreset } from '../src/preset-generator.js';

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

test('generated state is preserved exactly in HTML and React exports', () => {
  const generated={
    ...generatePreset(20260723,createGenerationContext({aspectRatio:'9:16',quality:640})),
    phosphorDecay:.72,
    ghostStrength:.18,
    ghostFrames:3,
    ghostSpacing:4,
    noiseOpacity:.08
  };
  const html=createHtmlArtifact(generated,source);
  const jsx=createReactArtifact(generated,source);
  for(const artifact of [html,jsx]){
    assert.match(artifact,new RegExp(`"archetype":${JSON.stringify(generated.archetype)}`));
    assert.match(artifact,new RegExp(`"archetypeLabel":${JSON.stringify(generated.archetypeLabel)}`));
    assert.match(artifact,/"aspectRatio":"9:16"/);
    assert.match(artifact,/"quality":640/);
    assert.match(artifact,/"phosphorDecay":0.72/);
    assert.match(artifact,/"ghostStrength":0.18/);
    assert.match(artifact,/"ghostFrames":3/);
    assert.match(artifact,/"ghostSpacing":4/);
    assert.match(artifact,/"noiseOpacity":0.08/);
    assert.match(artifact,/class TemporalCompositor/);
  }
});
