import { create } from 'zustand';
import { DEFAULT_CONFIG } from '@openascii/core';

export const useEditor = create(set => ({
  config: { ...DEFAULT_CONFIG, artStyle:'particles', colorMode:'grayscale', invertColor:true, fxPreset:'none', ditherAlgorithm:'blue-noise', ditherStrength:.12, brightness:48, contrast:1.55, gamma:.9, localContrast:1.1, edgeEnhance:1, saliencyDetail:1.15, fontSize:7, characterSpacing:1, vignette:0, borderGlow:0, aspectRatio:'1:1' },
  filename: 'OPENASCII_DEMO.PNG', image: null, sourceUrl: '', fps: 0, cells: 0,
  setConfig: patch => set(s => ({ config: { ...s.config, ...patch } })),
  setSource: (image, filename, sourceUrl) => set({ image, filename: filename.toUpperCase(), sourceUrl }),
  setStats: ({fps,cells}) => set({fps,cells}),
  applyPreset: preset => set(s => ({ config: { ...s.config, ...preset } }))
}));
