const FOUNDATION = {
  quality: 480,
  densityScale: 1.08,
  gamma: .92,
  localContrast: 1.08,
  edgeEnhance: 1.05,
  edgeEmphasis: 1.12,
  saliencyDetail: 1.12,
  opacity: 1,
  colorMix: .86,
  colorSaturation: 1,
  paletteBias: 0,
  highlightBoost: .38,
  particleVariation: .38,
  particleJitter: .08,
  particleDepth: .74,
  lineSystem: 'flow',
  lineDirection: 0,
  lineContour: .28,
  lineLength: 1,
  lineVariation: .22,
  lineSecondary: .12,
  springStrength: 26,
  damping: 7.2,
  clickSensitivity: 1.15,
  clickReturn: .28,
  clickDamping: .52,
  areaSize: 230,
  spread: 1.1,
  temporalPersistence: 0,
  backgroundStyle: 'solid',
  toneProfile: 'source',
  densityProfile: 'continuous',
  densityThreshold: .38,
  structureMix: .28,
  secondaryStyle: 'none',
  secondaryMix: 0,
  secondaryRegion: 'detail'
};

const BASE_PRESET_SYSTEMS = [
  { name:'Cyan Braille Field', artStyle:'braille', characterSet:'detailed', colorMode:'cyanotype', foreground:'#5cecff', background:'#030d13', accent:'#e6fbff', ditherAlgorithm:'bayer', ditherStrength:.48, brightness:50, contrast:1.58, fontSize:8, characterSpacing:.9, densityScale:1.18, primitiveShape:'circle', fxPreset:'none', fxStrength:.15, glowStrength:.16, invertColor:false, mouseMode:'push' },
  { name:'Amber Mosaic', artStyle:'claude-code', characterSet:'blocks', colorMode:'amber-monitor', foreground:'#ff8a19', background:'#080400', accent:'#ffe4a6', ditherAlgorithm:'floyd-steinberg', ditherStrength:.52, brightness:51, contrast:1.72, fontSize:8, characterSpacing:.92, densityScale:1.12, primitiveShape:'square', fxPreset:'noise-field', fxStrength:.18, glowStrength:.1, invertColor:false, mouseMode:'push' },
  { name:'Contour Wire', artStyle:'line', colorMode:'ice-white', foreground:'#f7fbff', background:'#02060c', accent:'#a8d7ff', ditherAlgorithm:'blue-noise', ditherStrength:.12, brightness:49, contrast:1.56, gamma:.9, localContrast:1.18, edgeEnhance:1.18, saliencyDetail:1.16, fontSize:7, characterSpacing:.92, densityScale:1.2, primitiveThickness:.78, lineSystem:'flow', lineDirection:0, lineContour:.18, lineLength:1.24, lineVariation:.2, lineSecondary:.04, fxPreset:'none', fxStrength:0, glowStrength:.08, invertColor:false, mouseMode:'ripple' },
  { name:'Binary Phosphor', artStyle:'terminal', characterSet:'binary', colorMode:'matrix-green', foreground:'#36e66a', background:'#020a04', accent:'#d8ff57', ditherAlgorithm:'none', ditherStrength:0, brightness:49, contrast:1.34, fontSize:9, characterSpacing:1, densityScale:1.08, fxPreset:'intervals', fxStrength:.2, glowStrength:.2, invertColor:false, mouseMode:'attract' },
  { name:'Silver Halftone', artStyle:'halftone', colorMode:'grayscale', foreground:'#f5f5f1', background:'#060708', accent:'#ffffff', ditherAlgorithm:'bayer', ditherStrength:.42, brightness:51, contrast:1.5, fontSize:8, characterSpacing:.88, densityScale:1.15, primitiveShape:'circle', fxPreset:'crt', fxStrength:.18, glowStrength:.12, invertColor:false, mouseMode:'push' },
  { name:'Full Color Pixel', artStyle:'retro-art', characterSet:'blocks', colorMode:'full-color', foreground:'#f7f0dc', background:'#030504', accent:'#77e8ff', colorMix:.92, ditherAlgorithm:'atkinson', ditherStrength:.34, brightness:48, contrast:1.62, gamma:.84, fontSize:8, characterSpacing:.86, densityScale:1.12, primitiveShape:'square', fxPreset:'none', fxStrength:0, glowStrength:.08, invertColor:false, mouseMode:'push' },
  { name:'Editorial ASCII', artStyle:'classic-ascii', characterSet:'detailed', colorMode:'grayscale', foreground:'#f5f5f3', background:'#08090a', accent:'#ffffff', ditherAlgorithm:'bayer', ditherStrength:.5, brightness:50, contrast:1.64, fontSize:9, characterSpacing:1.02, densityScale:1.08, fxPreset:'none', fxStrength:0, glowStrength:.08, invertColor:false, mouseMode:'attract' },
  { name:'Electric Particles', artStyle:'particles', colorMode:'palette-gradient', foreground:'#4fe4ff', background:'#02070c', accent:'#f2fcff', ditherAlgorithm:'blue-noise', ditherStrength:.14, brightness:49, contrast:1.5, gamma:.9, localContrast:1.16, edgeEnhance:1.12, edgeEmphasis:1.2, saliencyDetail:1.2, fontSize:7, characterSpacing:.92, densityScale:1.22, primitiveShape:'square', primitiveThickness:.88, particleVariation:.52, particleJitter:.11, particleDepth:.86, fxPreset:'noise-field', fxStrength:.16, glowStrength:.2, invertColor:false, mouseMode:'swirl',clickReturn:.24,clickDamping:.48 },
  { name:'Warm Duotone Lines', artStyle:'line', colorMode:'palette-gradient', foreground:'#ff9418', background:'#050200', accent:'#ffd46a', colorMix:.94, highlightBoost:.55, ditherAlgorithm:'atkinson', ditherStrength:.2, brightness:52, contrast:1.66, gamma:.88, localContrast:1.14, edgeEnhance:1.16, saliencyDetail:1.12, fontSize:7, characterSpacing:.9, densityScale:1.22, primitiveThickness:1.3, lineSystem:'scan', lineDirection:48, lineContour:.12, lineLength:1.2, lineVariation:.12, lineSecondary:.06, fxPreset:'none', fxStrength:0, glowStrength:.18, invertColor:false, mouseMode:'ripple' },
  { name:'Dot Cross Portrait', artStyle:'dot-cross', colorMode:'ice-white', foreground:'#f4f7fb', background:'#070a0f', accent:'#c9dcff', ditherAlgorithm:'bayer', ditherStrength:.34, brightness:49, contrast:1.54, gamma:.9, localContrast:1.16, edgeEnhance:1.2, saliencyDetail:1.14, fontSize:8, characterSpacing:1, densityScale:1.16, primitiveThickness:.92, fxPreset:'intervals', fxStrength:.1, glowStrength:.08, invertColor:false, mouseMode:'push' }
];

const COMPOSITION_RECIPES = [
  {toneProfile:'inverse',densityProfile:'continuous',densityThreshold:.24,structureMix:.18,secondaryStyle:'particles',secondaryMix:.22,secondaryRegion:'detail'},
  {toneProfile:'duotone',densityProfile:'bands',densityThreshold:.3,structureMix:.34,secondaryStyle:'retro-art',secondaryMix:.28,secondaryRegion:'highlight'},
  {toneProfile:'edge',densityProfile:'threshold',densityThreshold:.22,structureMix:.74,secondaryStyle:'dot-cross',secondaryMix:.18,secondaryRegion:'edge'},
  {toneProfile:'inverse',densityProfile:'continuous',densityThreshold:.3,structureMix:.18,secondaryStyle:'none',secondaryMix:0,secondaryRegion:'shadow'},
  {toneProfile:'source',densityProfile:'threshold',densityThreshold:.28,structureMix:.32,secondaryStyle:'particles',secondaryMix:.26,secondaryRegion:'highlight'},
  {toneProfile:'duotone',densityProfile:'bands',densityThreshold:.2,structureMix:.2,secondaryStyle:'claude-code',secondaryMix:.18,secondaryRegion:'edge'},
  {toneProfile:'source',densityProfile:'continuous',densityThreshold:.18,structureMix:.46,secondaryStyle:'line',secondaryMix:.14,secondaryRegion:'edge'},
  {toneProfile:'edge',densityProfile:'structure',densityThreshold:.18,structureMix:.68,secondaryStyle:'line',secondaryMix:.3,secondaryRegion:'edge'},
  {toneProfile:'duotone',densityProfile:'threshold',densityThreshold:.32,structureMix:.38,secondaryStyle:'halftone',secondaryMix:.2,secondaryRegion:'shadow'},
  {toneProfile:'inverse',densityProfile:'structure',densityThreshold:.2,structureMix:.54,secondaryStyle:'braille',secondaryMix:.24,secondaryRegion:'detail'}
];

export const PRESET_SYSTEMS = BASE_PRESET_SYSTEMS.map((preset,index)=>({...preset,...COMPOSITION_RECIPES[index]}));

export const PRESETS = PRESET_SYSTEMS.map(p => ({ ...FOUNDATION, ...p }));

export {
  generatePreset as createProceduralPreset,
  VISUAL_ARCHETYPES
} from './preset-generator.js';

export const STYLES = [
  ['classic-ascii','ASCII'],['braille','BRAILLE'],['halftone','HALFTONE'],['dot-cross','DOT CROSS'],['line','LINE'],['particles','PARTICLES'],['claude-code','CLAUDE CODE'],['retro-art','RETRO ART'],['terminal','TERMINAL']
];
