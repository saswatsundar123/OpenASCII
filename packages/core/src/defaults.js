export const DEFAULT_CONFIG = {
  artStyle: 'classic-ascii', font: 'Space Mono', characterSet: 'detailed', customCharacters: '',
  ditherAlgorithm: 'floyd-steinberg', brightness: 50, contrast: 1.35, gamma: 1, bgDither: 0,
  localContrast: 0.72, edgeEnhance: 0.72, saliencyDetail: 0.68,
  ditherStrength: 0.42, inverseDither: 0, fontSize: 10, characterSpacing: 1.08, opacity: 1,
  densityScale: 1, primitiveShape: 'circle', primitiveThickness: 1, edgeEmphasis: 1,
  toneProfile: 'source', densityProfile: 'continuous', densityThreshold: 0.38, structureMix: 0.28,
  secondaryStyle: 'none', secondaryMix: 0, secondaryRegion: 'detail',
  particleVariation: 0.36, particleJitter: 0.08, particleDepth: 0.72,
  lineSystem: 'flow', lineDirection: 0, lineContour: 0.28, lineLength: 1,
  lineVariation: 0.22, lineSecondary: 0.12,
  quality: 320, aspectRatio: 'original', vignette: 0.18, borderGlow: 0.22, backgroundStyle: 'solid',
  colorMode: 'matrix-green', foreground: '#36e66a', background: '#020a04', accent: '#d8ff57', colorMix: 0.82,
  colorSaturation: 1, paletteBias: 0, highlightBoost: 0.38, invertColor: false,
  fxPreset: 'noise-field', fxStrength: 0.24, direction: 'down', noiseScale: 58, noiseSpeed: 0.2,
  temporalPersistence: 0, phosphorDecay: 0, ghostStrength: 0, ghostFrames: 0, ghostSpacing: 3, noiseOpacity: 0.04, glowStrength: 0.18,
  mouseMode: 'attract', hoverStrength: 13, areaSize: 180, spread: 1.25,
  springStrength: 32, damping: 9.5, particleDrag: 0.94,
  clickSensitivity: 1, clickReturn: 0.34, clickDamping: 0.58, seed: 1337
};

export const COLOR_MODES = {
  'full-color': ['#f7f0dc', '#030504'],
  'matrix-green': ['#c6ff3d', '#061008'],
  'amber-monitor': ['#ffb000', '#130b02'],
  cyanotype: ['#59ecff', '#020b11'],
  phosphor: ['#c7cf7a', '#080a05'],
  'ice-white': ['#f7fbff', '#020812'],
  duotone: ['#f5f2e8', '#090a0d'],
  'palette-gradient': ['#d8ff57', '#070908'],
  grayscale: ['#f3f3ef', '#080808'],
  custom: ['#d8ff57', '#070908']
};
