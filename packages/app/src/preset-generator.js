const normalizeSeed=value=>{
  const numeric=Number(value);
  return Number.isFinite(numeric)?numeric>>>0:0;
};

const seededRandom=seed=>{
  let state=normalizeSeed(seed);
  return ()=>{
    state=(state+0x6D2B79F5)|0;
    let value=Math.imul(state^(state>>>15),1|state);
    value=(value+Math.imul(value^(value>>>7),61|value))^value;
    return ((value^(value>>>14))>>>0)/4294967296;
  };
};

const choose=(random,values)=>values[Math.min(values.length-1,Math.floor(random()*values.length))];
const range=(random,[minimum,maximum],digits=2)=>Number((minimum+(maximum-minimum)*random()).toFixed(digits));
const clamp=(value,minimum,maximum)=>Math.max(minimum,Math.min(maximum,value));
const deepFreeze=value=>{
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    Object.freeze(value);
    for(const child of Object.values(value))deepFreeze(child);
  }
  return value;
};

const PALETTES=deepFreeze({
  cyanotype:{colorMode:'cyanotype',foreground:'#5cecff',background:'#030d13',accent:'#e6fbff'},
  phosphor:{colorMode:'phosphor',foreground:'#c7cf7a',background:'#080a05',accent:'#f3ffd0'},
  matrix:{colorMode:'matrix-green',foreground:'#36e66a',background:'#020a04',accent:'#d8ff57'},
  amber:{colorMode:'amber-monitor',foreground:'#ff8a19',background:'#080400',accent:'#ffe4a6'},
  grayscale:{colorMode:'grayscale',foreground:'#f5f5f1',background:'#060708',accent:'#ffffff'},
  ice:{colorMode:'ice-white',foreground:'#f7fbff',background:'#02060c',accent:'#a8d7ff'},
  sampled:{colorMode:'full-color',foreground:'#f7f0dc',background:'#030504',accent:'#77e8ff'},
  spectrum:{colorMode:'palette-gradient',foreground:'#ff7c21',background:'#090300',accent:'#ffd35a'},
  electric:{colorMode:'palette-gradient',foreground:'#4fe4ff',background:'#02070c',accent:'#f2fcff'},
  paper:{colorMode:'duotone',foreground:'#eee9dd',background:'#0a0908',accent:'#ffffff'}
});

const FOUNDATION=deepFreeze({
  font:'Space Mono',characterSet:'detailed',customCharacters:'',
  brightness:50,contrast:1.5,gamma:.92,localContrast:1.08,edgeEnhance:1.08,saliencyDetail:1.12,
  ditherAlgorithm:'bayer',ditherStrength:.32,inverseDither:0,fontSize:8,characterSpacing:1,opacity:1,
  densityScale:1.1,primitiveShape:'circle',primitiveThickness:1,edgeEmphasis:1.12,
  particleVariation:.4,particleJitter:.08,particleDepth:.74,
  lineSystem:'flow',lineDirection:0,lineContour:.28,lineLength:1,lineVariation:.2,lineSecondary:.1,
  toneProfile:'source',densityProfile:'continuous',densityThreshold:.3,structureMix:.3,
  secondaryStyle:'none',secondaryMix:0,secondaryRegion:'detail',
  colorMix:.88,colorSaturation:1,paletteBias:0,highlightBoost:.4,invertColor:false,
  fxPreset:'none',fxStrength:0,direction:'down',noiseScale:58,noiseSpeed:.2,temporalPersistence:0,
  phosphorDecay:0,ghostStrength:0,ghostFrames:0,ghostSpacing:3,noiseOpacity:0,
  glowStrength:.14,vignette:.14,borderGlow:.08,backgroundStyle:'solid',
  mouseMode:'push',hoverStrength:18,areaSize:230,spread:1.1,
  springStrength:26,damping:7.2,particleDrag:.94,clickSensitivity:1.15,clickReturn:.28,clickDamping:.52
});

const DEFAULT_RANGES=deepFreeze({
  contrast:[1.35,1.78],gamma:[.84,1.04],localContrast:[.98,1.26],edgeEnhance:[.98,1.28],
  densityScale:[1,1.24],characterSpacing:[.86,1.08],structureMix:[.18,.54],
  secondaryMix:[.12,.28],fxStrength:[0,.24],glowStrength:[.08,.26]
});

const archetype=(id,label,definition)=>deepFreeze({
  id,label,
  primary:definition.primary,
  secondary:definition.secondary||['none'],
  tone:definition.tone,
  density:definition.density,
  palettes:definition.palettes,
  characters:definition.characters||['detailed'],
  fonts:definition.fonts||['Space Mono','Courier New'],
  dithers:definition.dithers||['bayer'],
  effects:definition.effects||['none'],
  backgrounds:definition.backgrounds||['solid'],
  interactions:definition.interactions||['push'],
  secondaryRegions:definition.secondaryRegions||['detail'],
  primitives:definition.primitives||['circle'],
  lineSystems:definition.lineSystems||['flow'],
  ranges:{...DEFAULT_RANGES,...definition.ranges},
  fallback:{contrast:1.5,gamma:.92,localContrast:1.08,edgeEnhance:1.08,...definition.fallback}
});

export const VISUAL_ARCHETYPES=deepFreeze([
  archetype('inverse-braille-field','INVERSE BRAILLE FIELD',{
    primary:['braille'],secondary:['none','particles','dot-cross'],tone:['inverse'],density:['continuous','structure'],
    palettes:['cyanotype','phosphor','ice','matrix'],characters:['detailed','simple'],dithers:['bayer','blue-noise'],
    effects:['none','beam-sweep','intervals','glitch'],backgrounds:['solid','gradient'],interactions:['push','ripple'],
    secondaryRegions:['detail'],ranges:{contrast:[1.45,1.82],structureMix:[.12,.34],densityScale:[1.06,1.26]}
  }),
  archetype('matrix-glyph-portrait','MATRIX GLYPH PORTRAIT',{
    primary:['terminal','classic-ascii'],secondary:['none','braille','particles'],tone:['source','inverse'],density:['continuous','bands'],
    palettes:['matrix','phosphor','amber','ice'],characters:['binary','simple'],dithers:['none','bayer'],
    effects:['intervals','crt','none','beam-sweep'],interactions:['attract','push'],secondaryRegions:['detail'],
    ranges:{contrast:[1.3,1.66],fxStrength:[.08,.22],structureMix:[.12,.32]}
  }),
  archetype('amber-mosaic','AMBER MOSAIC',{
    primary:['claude-code','retro-art'],secondary:['none','retro-art','dot-cross'],tone:['duotone','source'],density:['bands','structure'],
    palettes:['amber','spectrum','paper'],characters:['blocks','simple','detailed'],dithers:['floyd-steinberg','atkinson'],
    effects:['none','noise-field','beam-sweep','glitch'],backgrounds:['solid','grid'],interactions:['push'],
    secondaryRegions:['highlight','edge'],primitives:['square'],ranges:{contrast:[1.52,1.92],structureMix:[.24,.44]}
  }),
  archetype('silver-halftone','SILVER HALFTONE',{
    primary:['halftone'],secondary:['none','particles','dot-cross'],tone:['source','inverse'],density:['threshold','structure'],
    palettes:['grayscale','ice','phosphor','cyanotype'],dithers:['bayer','atkinson'],effects:['none','crt','beam-sweep','intervals'],
    interactions:['push','ripple'],secondaryRegions:['highlight'],primitives:['circle','ring'],
    ranges:{contrast:[1.4,1.82],structureMix:[.24,.44],secondaryMix:[.12,.24]}
  }),
  archetype('contour-wire','CONTOUR WIRE',{
    primary:['line'],secondary:['none','dot-cross','particles'],tone:['edge','source'],density:['threshold','structure'],
    palettes:['ice','grayscale','cyanotype','phosphor'],dithers:['blue-noise','none'],effects:['none','beam-sweep','intervals'],
    interactions:['ripple','push'],secondaryRegions:['edge'],lineSystems:['contour','flow'],
    ranges:{contrast:[1.42,1.82],localContrast:[1.1,1.3],edgeEnhance:[1.12,1.3],structureMix:[.58,.78]}
  }),
  archetype('directional-engraving','DIRECTIONAL ENGRAVING',{
    primary:['line'],secondary:['none','halftone','dot-cross'],tone:['duotone','source'],density:['threshold','bands'],
    palettes:['amber','paper','spectrum','grayscale'],dithers:['atkinson','bayer'],effects:['none','beam-sweep','intervals'],
    interactions:['ripple'],secondaryRegions:['shadow'],lineSystems:['scan'],
    ranges:{contrast:[1.5,1.94],structureMix:[.28,.48],densityScale:[1.08,1.28]}
  }),
  archetype('electric-particle-field','ELECTRIC PARTICLE FIELD',{
    primary:['particles'],secondary:['none','line','dot-cross','braille'],tone:['edge','source'],density:['structure','threshold'],
    palettes:['electric','cyanotype','spectrum','ice'],dithers:['blue-noise','atkinson'],effects:['noise-field','beam-sweep','none','crt'],
    interactions:['swirl','ripple'],secondaryRegions:['edge'],primitives:['circle','square','ring','diamond'],
    ranges:{contrast:[1.38,1.8],localContrast:[1.08,1.3],edgeEnhance:[1.06,1.28],structureMix:[.5,.72]}
  }),
  archetype('dot-cross-portrait','DOT CROSS PORTRAIT',{
    primary:['dot-cross'],secondary:['none','braille','particles','line'],tone:['inverse','source'],density:['structure','threshold'],
    palettes:['ice','grayscale','phosphor','cyanotype'],dithers:['bayer','blue-noise'],effects:['none','intervals','beam-sweep','crt'],
    interactions:['push'],secondaryRegions:['detail','edge'],primitives:['circle','ring'],
    ranges:{contrast:[1.42,1.84],structureMix:[.42,.62]}
  }),
  archetype('editorial-ascii','EDITORIAL ASCII',{
    primary:['classic-ascii'],secondary:['none','line','braille'],tone:['source','duotone'],density:['continuous','bands'],
    palettes:['grayscale','paper','ice','phosphor'],characters:['detailed','simple'],fonts:['Space Mono','Courier New'],
    dithers:['bayer','floyd-steinberg'],effects:['none','crt','intervals'],interactions:['attract','push'],
    secondaryRegions:['edge'],ranges:{contrast:[1.48,1.88],structureMix:[.34,.54]}
  }),
  archetype('sampled-pixel-field','SAMPLED PIXEL FIELD',{
    primary:['retro-art'],secondary:['none','claude-code','dot-cross'],tone:['source','duotone'],density:['bands','continuous'],
    palettes:['sampled','spectrum','electric','amber'],characters:['blocks','simple'],dithers:['atkinson','bayer'],effects:['none','noise-field','beam-sweep'],
    interactions:['push'],secondaryRegions:['edge'],primitives:['square'],
    ranges:{contrast:[1.42,1.84],structureMix:[.14,.34],glowStrength:[.04,.14]}
  }),
  archetype('phosphor-terminal','PHOSPHOR TERMINAL',{
    primary:['terminal'],secondary:['none','classic-ascii','braille'],tone:['inverse','source'],density:['continuous','bands'],
    palettes:['matrix','phosphor','amber','cyanotype'],characters:['binary','simple'],dithers:['none','bayer'],
    effects:['intervals','crt','none','beam-sweep'],interactions:['attract','push'],secondaryRegions:['detail'],
    ranges:{contrast:[1.28,1.68],fxStrength:[.08,.24],structureMix:[.1,.3]}
  }),
  archetype('negative-particle-relief','NEGATIVE PARTICLE RELIEF',{
    primary:['particles','halftone'],secondary:['none','dot-cross','braille','line'],tone:['inverse','source'],density:['threshold','structure'],
    palettes:['grayscale','ice','cyanotype','phosphor'],dithers:['bayer','blue-noise'],effects:['none','crt','beam-sweep','intervals'],
    interactions:['push','swirl'],secondaryRegions:['shadow','detail'],primitives:['circle','ring','diamond'],
    ranges:{contrast:[1.5,1.94],structureMix:[.28,.52],densityScale:[1.04,1.28]}
  }),
  archetype('hybrid-edge-mosaic','HYBRID EDGE MOSAIC',{
    primary:['claude-code','retro-art'],secondary:['line','dot-cross','particles'],tone:['duotone','source'],density:['bands','structure'],
    palettes:['amber','sampled','spectrum','paper'],characters:['blocks','detailed'],dithers:['atkinson','floyd-steinberg'],
    effects:['none','noise-field','beam-sweep','crt','glitch'],backgrounds:['solid','grid'],interactions:['push','ripple'],
    secondaryRegions:['edge'],primitives:['square'],lineSystems:['flow','contour'],
    ranges:{contrast:[1.5,1.96],structureMix:[.34,.6],secondaryMix:[.16,.3]}
  }),
  archetype('sparse-signal-field','SPARSE SIGNAL FIELD',{
    primary:['particles','line'],secondary:['none','braille','dot-cross','halftone'],tone:['edge','source'],density:['threshold','structure'],
    palettes:['electric','ice','phosphor','grayscale'],dithers:['blue-noise','none'],effects:['none','beam-sweep','intervals','noise-field'],
    interactions:['ripple','swirl'],secondaryRegions:['detail'],primitives:['circle','slash'],
    lineSystems:['contour','flow'],ranges:{contrast:[1.4,1.8],localContrast:[1.08,1.3],edgeEnhance:[1.12,1.3],structureMix:[.58,.76]}
  })
]);

const resolveLineGeometry=(archetype,random)=>({
  lineSystem:choose(random,archetype.lineSystems),
  lineDirection:Math.round(range(random,[-72,72],0)),
  lineContour:range(random,[.12,.72]),
  lineLength:range(random,[.72,1.36]),
  lineVariation:range(random,[.08,.34]),
  lineSecondary:range(random,[.04,.2])
});

const resolveParticleGeometry=(archetype,random)=>({
  primitiveShape:choose(random,archetype.primitives),
  primitiveThickness:range(random,[.72,1.34]),
  particleVariation:range(random,[.24,.62]),
  particleJitter:range(random,[.03,.14]),
  particleDepth:range(random,[.58,.9])
});

const resolveComposition=(archetype,random)=>{
  const secondaryStyle=choose(random,archetype.secondary);
  return {
    toneProfile:choose(random,archetype.tone),
    densityProfile:choose(random,archetype.density),
    densityThreshold:range(random,[.18,.46]),
    structureMix:range(random,archetype.ranges.structureMix),
    secondaryStyle,
    secondaryMix:secondaryStyle==='none'?0:range(random,archetype.ranges.secondaryMix),
    secondaryRegion:choose(random,archetype.secondaryRegions)
  };
};

const resolveEffect=(archetype,random)=>{
  const fxPreset=choose(random,archetype.effects);
  const fxStrength=fxPreset==='none'?0:range(random,fxPreset==='glitch'?[.08,Math.min(.22,archetype.ranges.fxStrength[1])]:archetype.ranges.fxStrength);
  const ghosted=['crt','glitch','noise-field'].includes(fxPreset);
  return {
    fxPreset,fxStrength,
    temporalPersistence:fxPreset==='crt'?range(random,[.08,.28]):fxPreset==='noise-field'?range(random,[0,.18]):0,
    phosphorDecay:fxPreset==='crt'?range(random,[.58,.86]):0,
    ghostStrength:ghosted?range(random,[.04,fxPreset==='crt'?.16:.12]):0,
    ghostFrames:ghosted?1+Math.floor(random()*3):0,
    ghostSpacing:ghosted?2+Math.floor(random()*5):3,
    noiseOpacity:fxPreset==='noise-field'?range(random,[.03,.12]):fxPreset==='glitch'?range(random,[.01,.05]):0,
    glowStrength:range(random,archetype.ranges.glowStrength)
  };
};

const generateCandidate=(seed,archetype,context)=>{
  const random=seededRandom(seed),artStyle=choose(random,archetype.primary),paletteFamily=choose(random,archetype.palettes);
  const palette=PALETTES[paletteFamily];
  return {
    ...FOUNDATION,
    archetype:archetype.id,
    archetypeLabel:archetype.label,
    name:`${archetype.label} / ${String(normalizeSeed(seed)).slice(-4).padStart(4,'0')}`,
    seed:normalizeSeed(seed),
    artStyle,
    paletteFamily,
    ...palette,
    font:choose(random,archetype.fonts),
    characterSet:choose(random,archetype.characters),
    ditherAlgorithm:choose(random,archetype.dithers),
    ditherStrength:range(random,[.08,.58]),
    backgroundStyle:choose(random,archetype.backgrounds),
    mouseMode:choose(random,archetype.interactions),
    contrast:range(random,archetype.ranges.contrast),
    gamma:range(random,archetype.ranges.gamma),
    localContrast:range(random,archetype.ranges.localContrast),
    edgeEnhance:range(random,archetype.ranges.edgeEnhance),
    densityScale:range(random,archetype.ranges.densityScale),
    characterSpacing:range(random,archetype.ranges.characterSpacing),
    clickSensitivity:range(random,[.9,1.5]),
    ...resolveComposition(archetype,random),
    ...resolveEffect(archetype,random),
    ...(artStyle==='line'||archetype.secondary.includes('line')?resolveLineGeometry(archetype,random):{}),
    ...(artStyle==='particles'||artStyle==='halftone'||archetype.secondary.includes('particles')?resolveParticleGeometry(archetype,random):{}),
    aspectRatio:context.aspectRatio,
    quality:context.quality
  };
};

export function createGenerationContext(config={},history=[]) {
  const aspectRatio=typeof config?.aspectRatio==='string'?config.aspectRatio:'original';
  const quality=Number.isFinite(Number(config?.quality))?Number(config.quality):320;
  const signatures=Array.isArray(history)?history.filter(value=>typeof value==='string').slice(-6):[];
  return Object.freeze({aspectRatio,quality,history:Object.freeze([...signatures])});
}

export function presetSignature(config={}) {
  return [
    config.archetype||'custom',
    config.artStyle||'classic-ascii',
    config.secondaryStyle||'none',
    config.toneProfile||'source',
    config.densityProfile||'continuous',
    config.paletteFamily||config.colorMode||'custom',
    config.fxPreset||'none'
  ].join('/');
}

export function validatePreset(config={}) {
  const errors=[];
  const within=(key,minimum,maximum)=>{
    const value=Number(config[key]);
    if(!Number.isFinite(value)||value<minimum||value>maximum)errors.push(key);
  };
  within('contrast',1.25,2.1);
  within('gamma',.76,1.12);
  within('densityScale',.92,1.3);
  within('characterSpacing',.82,1.16);
  within('glowStrength',.04,.34);
  within('fxStrength',0,.34);
  within('clickSensitivity',.9,1.5);
  within('phosphorDecay',0,.94);
  within('ghostStrength',0,.28);
  within('ghostFrames',0,3);
  within('ghostSpacing',1,8);
  within('noiseOpacity',0,.18);
  if(!Number.isInteger(Number(config.ghostFrames)))errors.push('ghostFrames');
  if(!Number.isInteger(Number(config.ghostSpacing)))errors.push('ghostSpacing');
  if(!config.foreground||!config.background||config.foreground.toLowerCase()===config.background.toLowerCase())errors.push('palette-contrast');
  if(config.secondaryStyle===config.artStyle&&config.secondaryStyle!=='none')errors.push('secondary-style');
  if(config.secondaryStyle==='none'&&Number(config.secondaryMix)!==0)errors.push('secondary-mix');
  if(config.secondaryStyle!=='none'&&(Number(config.secondaryMix)<.1||Number(config.secondaryMix)>.34))errors.push('secondary-mix');
  if(config.artStyle==='terminal'&&!['binary','simple','custom'].includes(config.characterSet))errors.push('terminal-characters');
  if(['retro-art','claude-code'].includes(config.artStyle)&&!['blocks','simple','detailed'].includes(config.characterSet))errors.push('mosaic-characters');
  if(config.toneProfile==='edge'&&(Number(config.localContrast)<.9||Number(config.edgeEnhance)<.9))errors.push('edge-analysis');
  if(config.densityProfile==='threshold'&&Number(config.densityThreshold)>.42&&Number(config.contrast)<1.4)errors.push('threshold-contrast');
  if(['crt','intervals'].includes(config.fxPreset)&&Number(config.fxStrength)>.28)errors.push('fine-effect');
  if(config.fxPreset==='glitch'&&Number(config.fxStrength)>.22)errors.push('glitch-effect');
  if(config.secondaryStyle==='line'&&!['edge','detail'].includes(config.secondaryRegion))errors.push('line-region');
  if(Number(config.temporalPersistence)>.3&&!['crt','particles'].includes(config.fxPreset)&&config.artStyle!=='particles')errors.push('persistence');
  if(config.colorMode==='full-color'&&!['sampled-pixel-field','electric-particle-field','hybrid-edge-mosaic'].includes(config.archetype))errors.push('sampled-color');
  return {valid:errors.length===0,errors:[...new Set(errors)]};
}

const fallbackPreset=(seed,archetype,context)=>{
  const candidate=generateCandidate(seed,archetype,context);
  const paletteFamily=archetype.palettes[0],secondaryStyle=archetype.secondary[0]==='none'?'none':archetype.secondary[0];
  return {
    ...candidate,
    ...FOUNDATION,
    ...archetype.fallback,
    archetype:archetype.id,
    archetypeLabel:archetype.label,
    name:`${archetype.label} / SAFE`,
    seed:normalizeSeed(seed),
    artStyle:archetype.primary[0],
    paletteFamily,
    ...PALETTES[paletteFamily],
    characterSet:archetype.characters[0],
    toneProfile:archetype.tone[0],
    densityProfile:archetype.density[0],
    secondaryStyle,
    secondaryMix:secondaryStyle==='none'?0:.16,
    secondaryRegion:archetype.secondaryRegions[0],
    fxPreset:'none',
    fxStrength:0,
    temporalPersistence:0,
    phosphorDecay:0,
    ghostStrength:0,
    ghostFrames:0,
    ghostSpacing:3,
    noiseOpacity:0,
    aspectRatio:context.aspectRatio,
    quality:context.quality
  };
};

export function generatePreset(seed=0,contextInput) {
  const normalized=normalizeSeed(seed);
  const context=contextInput?.history?createGenerationContext(contextInput,contextInput.history):createGenerationContext(contextInput);
  const firstIndex=(normalized*5)%VISUAL_ARCHETYPES.length;
  const candidates=[];
  for(let attempt=0;attempt<VISUAL_ARCHETYPES.length*4;attempt++){
    const archetype=VISUAL_ARCHETYPES[(firstIndex+attempt*5)%VISUAL_ARCHETYPES.length];
    const candidate=generateCandidate((normalized+attempt*0x9E3779B9)>>>0,archetype,context);
    if(validatePreset(candidate).valid)candidates.push(candidate);
  }
  if(context.history.length===0&&candidates.length)return candidates[0];
  const intendedArchetype=VISUAL_ARCHETYPES[firstIndex].id;
  const orderedCandidates=[
    ...candidates.filter(candidate=>candidate.archetype===intendedArchetype),
    ...candidates.filter(candidate=>candidate.archetype!==intendedArchetype)
  ];
  const previous=context.history.at(-1)?.split('/')||[];
  const recent=new Set(context.history);
  const acceptable=(candidate,level)=>{
    const signature=presetSignature(candidate);
    if(recent.has(signature))return false;
    const parts=signature.split('/');
    if(level<3&&parts[1]===previous[1])return false;
    if(level<2&&parts[3]===previous[3]&&parts[4]===previous[4])return false;
    if(level<1&&parts[5]===previous[5])return false;
    return true;
  };
  for(let level=0;level<=3;level++){
    const candidate=orderedCandidates.find(item=>acceptable(item,level));
    if(candidate)return candidate;
  }
  return fallbackPreset(normalized,VISUAL_ARCHETYPES[firstIndex],context);
}
