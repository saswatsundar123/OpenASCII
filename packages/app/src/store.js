import { create } from 'zustand';
import { DEFAULT_CONFIG } from '@openascii/core';
import { PRESETS } from './presets.js';
import { createGenerationContext, generatePreset, presetSignature } from './preset-generator.js';

export const useEditor = create(set => ({
  config: { ...DEFAULT_CONFIG, ...PRESETS[7], aspectRatio:'1:1' },
  generationHistory: [],
  filename: 'OPENASCII_DEMO.PNG', image: null, sourceUrl: '', fps: 0, cells: 0,
  setConfig: patch => set(s => ({ config: { ...s.config, ...patch } })),
  setSource: (image, filename, sourceUrl) => set({ image, filename: filename.toUpperCase(), sourceUrl }),
  setStats: ({fps,cells}) => set({fps,cells}),
  applyPreset: preset => set(s => ({ config: { ...s.config, ...preset }, generationHistory:[] })),
  randomizeStyle: seed => set(state => {
    const aspectRatio=state.config.aspectRatio,quality=state.config.quality;
    const context=createGenerationContext(state.config,state.generationHistory);
    const generated=generatePreset(seed,context);
    const config={...state.config,...generated,aspectRatio,quality};
    const signature=presetSignature(config);
    return {config,generationHistory:[...state.generationHistory,signature].slice(-6)};
  })
}));
