export const DEFAULT_CONFIG = {
  artStyle: 'classic-ascii', font: 'Space Mono', characterSet: 'detailed', customCharacters: '',
  ditherAlgorithm: 'floyd-steinberg', brightness: 50, contrast: 1.35, gamma: 1, bgDither: 0,
  localContrast: 0.72, edgeEnhance: 0.72, saliencyDetail: 0.68,
  ditherStrength: 0.42, inverseDither: 0, fontSize: 10, characterSpacing: 1.08, opacity: 1,
  quality: 320, aspectRatio: 'original', vignette: 0.18, borderGlow: 0.22,
  colorMode: 'matrix-green', foreground: '#d8ff57', background: '#070908', invertColor: false,
  fxPreset: 'noise-field', fxStrength: 0.24, direction: 'down', noiseScale: 58, noiseSpeed: 0.2, temporalPersistence: 0,
  mouseMode: 'attract', hoverStrength: 13, areaSize: 180, spread: 1.25,
  springStrength: 32, damping: 9.5, particleDrag: 0.94, seed: 1337
};

export const COLOR_MODES = {
  'matrix-green': ['#c6ff3d', '#061008'],
  'amber-monitor': ['#ffb000', '#130b02'],
  grayscale: ['#f3f3ef', '#080808'],
  custom: ['#d8ff57', '#070908']
};
