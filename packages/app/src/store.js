import { create } from 'zustand';
import { DEFAULT_CONFIG } from '@openascii/core';
import { PRESETS } from './presets.js';
import { createGenerationContext, generatePreset, presetSignature } from './preset-generator.js';

const LS_KEY = 'openascii:config:v1';

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) ?? null; } catch { return null; }
}

export function saveConfig(config) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(config)); } catch {}
}

const baseConfig = { ...DEFAULT_CONFIG, ...PRESETS[7], aspectRatio: '1:1' };
const saved = loadSaved();

export const useEditor = create(set => ({
  config: saved ? { ...baseConfig, ...saved } : baseConfig,
  past: [],
  loading: false,
  generationHistory: [],
  filename: 'OPENASCII_DEMO.PNG', image: null, sourceUrl: '', fps: 0, cells: 0,

  setConfig: patch => set(s => {
    const next = { ...s.config, ...patch };
    saveConfig(next);
    return { config: next, past: [...s.past, s.config].slice(-40) };
  }),

  setLoading: loading => set({ loading }),
  setSource: (image, filename, sourceUrl) => set({ image, filename: filename.toUpperCase(), sourceUrl, loading: false }),
  setStats: ({fps, cells}) => set({fps, cells}),

  applyPreset: preset => set(s => {
    const next = { ...s.config, ...preset };
    saveConfig(next);
    return { config: next, past: [...s.past, s.config].slice(-40), generationHistory: [] };
  }),

  randomizeStyle: seed => set(state => {
    const aspectRatio = state.config.aspectRatio, quality = state.config.quality;
    const context = createGenerationContext(state.config, state.generationHistory);
    const generated = generatePreset(seed, context);
    const config = { ...state.config, ...generated, aspectRatio, quality };
    const signature = presetSignature(config);
    saveConfig(config);
    return { config, past: [...state.past, state.config].slice(-40), generationHistory: [...state.generationHistory, signature].slice(-6) };
  }),

  undo: () => set(s => {
    if (!s.past.length) return {};
    const prev = s.past[s.past.length - 1];
    saveConfig(prev);
    return { config: prev, past: s.past.slice(0, -1) };
  }),
}));
