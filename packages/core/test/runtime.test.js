import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpenAsciiRuntime, createRuntimeSource } from '../src/index.js';

test('runtime factory exposes the shared rendering contracts', () => {
  const runtime = createOpenAsciiRuntime();
  assert.equal(typeof runtime.AsciiEngine, 'function');
  assert.equal(typeof runtime.FrameProcessor, 'function');
  assert.equal(typeof runtime.GlyphAtlas, 'function');
  assert.equal(typeof runtime.PhysicsField, 'function');
  assert.equal(typeof runtime.StyleInterpreter, 'function');
  assert.equal(typeof runtime.CompositionInterpreter, 'function');
  assert.equal(typeof runtime.ColorEngine, 'function');
  assert.equal(typeof runtime.LineRenderer, 'function');
  assert.equal(typeof runtime.TemporalCompositor, 'function');
});

test('temporal decay is frame-rate independent and ghost plans stay bounded', () => {
  const { TemporalCompositor } = createOpenAsciiRuntime();
  const temporal=new TemporalCompositor();
  assert.ok(Math.abs(temporal.decayAlpha(.8,1/30)-.64)<1e-9);
  assert.equal(temporal.decayAlpha(2,1/60),.94);
  const ghosts=temporal.ghostPlan({ghostFrames:8,ghostStrength:.9});
  assert.equal(ghosts.length,3);
  assert.ok(ghosts.every(sample=>sample.alpha>0&&sample.alpha<=.28));
});

test('color engine preserves tonal separation and sampled source hues', () => {
  const { ColorEngine, DEFAULTS } = createOpenAsciiRuntime();
  const frame={red:new Float32Array([1,0]),green:new Float32Array([0,0]),blue:new Float32Array([0,1])};
  const tonal=new ColorEngine({...DEFAULTS,colorMode:'matrix-green',foreground:'#36e66a',background:'#020a04',accent:'#d8ff57',colorMix:1},frame);
  assert.notEqual(tonal.colorAt(0,.18,.2),tonal.colorAt(0,.82,.7),'palette modes need distinct shadow and highlight colors');
  const sampled=new ColorEngine({...DEFAULTS,colorMode:'full-color',foreground:'#ffffff',background:'#000000',accent:'#ffffff',colorMix:1,colorSaturation:1},frame);
  assert.notEqual(sampled.colorAt(0,.7,.4),sampled.colorAt(1,.7,.4),'sampled mode must retain per-cell source hue');
});

test('pointer press repels the complete field and retains spring energy', () => {
  const { PhysicsField, DEFAULTS } = createOpenAsciiRuntime();
  const frame={count:6,cols:3,rows:2,cellW:10,cellH:10};
  const physics=new PhysicsField(frame),pointer={active:true,down:true,downX:15,downY:10,x:15,y:10,burst:1};
  physics.update(1/60,pointer,{...DEFAULTS,artStyle:'classic-ascii',fxPreset:'none',hoverStrength:0,clickSensitivity:1.2},frame,0);
  for(let i=0;i<frame.count;i++)assert.ok(Math.hypot(physics.vx[i],physics.vy[i])>0);
  assert.equal(physics.clickEnergy,1);
  assert.ok(pointer.burst<1);
});

test('released particle field overshoots and then returns slowly', () => {
  const { PhysicsField, DEFAULTS } = createOpenAsciiRuntime();
  const frame={count:100,cols:10,rows:10,cellW:10,cellH:10,saliency:new Float32Array(100).fill(.5)};
  const physics=new PhysicsField(frame),pointer={active:true,down:true,downX:50,downY:50,x:50,y:50,pressure:.5,burst:1};
  const config={...DEFAULTS,artStyle:'particles',fxPreset:'none',hoverStrength:0,clickSensitivity:1.15,clickReturn:.24,clickDamping:.48,springStrength:26,damping:7.2};
  const averageDisplacement=()=>Array.from({length:frame.count},(_,i)=>Math.hypot(physics.x[i]-physics.rx[i],physics.y[i]-physics.ry[i])).reduce((a,b)=>a+b,0)/frame.count;
  for(let i=0;i<12;i++)physics.update(1/60,pointer,config,frame,i*16);
  const pressed=averageDisplacement();pointer.down=false;pointer.pressure=0;
  for(let i=0;i<30;i++)physics.update(1/60,pointer,config,frame,(i+12)*16);
  const overshoot=averageDisplacement();
  for(let i=30;i<120;i++)physics.update(1/60,pointer,config,frame,(i+12)*16);
  const recovered=averageDisplacement();
  assert.ok(overshoot>pressed,'release should retain outward momentum before the spring wins');
  assert.ok(recovered<pressed*.15,'the field should return near its rest lattice');
  assert.equal(pointer.burst,0,'the click impulse must terminate instead of asymptotically forcing the field');
  assert.ok(physics.clickEnergy<.5,'release should restore the normal spring response');
});

test('line systems expose deterministic scan, flow, and contour geometry', () => {
  const { LineRenderer, DEFAULTS } = createOpenAsciiRuntime();
  const renderer=new LineRenderer(),frame={
    cellW:10,cellH:12,
    edge:new Float32Array([.8]),localContrast:new Float32Array([.6]),saliency:new Float32Array([.7]),
    gradientDirection:new Float32Array([Math.PI/4])
  };
  const state={i:0,tone:.72,detail:.65,x:20,y:30,alpha:.8,c:{...DEFAULTS,seed:17,lineDirection:0,lineVariation:0},f:frame};
  const scan=renderer.geometry({...state,c:{...state.c,lineSystem:'scan',lineContour:0}});
  const contour=renderer.geometry({...state,c:{...state.c,lineSystem:'contour',lineContour:0}});
  const flow=renderer.geometry({...state,c:{...state.c,lineSystem:'flow',lineContour:.5}});
  assert.ok(Math.abs(scan.angle)<1e-8,'scan field should obey the requested direction');
  assert.ok(Math.abs(Math.abs(contour.angle)-Math.PI/4)<1e-6,'contour field should follow the image-gradient tangent');
  assert.ok(Math.abs(flow.angle)>Math.abs(scan.angle)&&Math.abs(flow.angle)<Math.abs(contour.angle),'flow should interpolate between scan direction and contour tangent');
  assert.ok(scan.len>frame.cellW*.5,'bright structured cells should retain a legible stroke');
  assert.ok(scan.width>=.42,'fine line work must remain visible at high density');
});

test('shared style interpretation preserves structure across every renderer', () => {
  const { StyleInterpreter, DEFAULTS } = createOpenAsciiRuntime();
  const styles=new StyleInterpreter(),frame={
    edge:new Float32Array([0,.9]),localContrast:new Float32Array([0,.75]),variance:new Float32Array([0,.42]),
    saliency:new Float32Array([0,.86]),gradientMagnitude:new Float32Array([0,.5]),gradientDirection:new Float32Array([0,Math.PI/3])
  };
  const flat=styles.sample(frame,0,.18,.05,DEFAULTS),structured=styles.sample(frame,1,.18,.82,DEFAULTS);
  assert.ok(structured.structure>flat.structure,'image structure must be renderer-independent');
  assert.ok(structured.alpha>flat.alpha,'important dark edges must survive the shared style layer');
  assert.ok(structured.scale>flat.scale,'structural detail must receive a common legibility boost');
  assert.equal(structured.tangent,frame.gradientDirection[1]+Math.PI/2);
});

test('composition profiles materially change tonal topology and density', () => {
  const { CompositionInterpreter, DEFAULTS } = createOpenAsciiRuntime();
  const compositions=new CompositionInterpreter(),frame={
    edge:new Float32Array([.08,.82]),localContrast:new Float32Array([.12,.72]),variance:new Float32Array([.1,.54]),
    saliency:new Float32Array([.16,.88]),gradientMagnitude:new Float32Array([.08,.74]),gradientDirection:new Float32Array([0,Math.PI/3])
  };
  const base={value:.72,structure:.24,scale:.68,alpha:.76,edge:.08,local:.12,variance:.1,saliency:.16,gradient:.08,direction:0,tangent:Math.PI/2};
  const source=compositions.sample(frame,0,base,{...DEFAULTS,toneProfile:'source',densityProfile:'continuous'});
  const inverse=compositions.sample(frame,0,base,{...DEFAULTS,toneProfile:'inverse',densityProfile:'continuous'});
  const threshold=compositions.sample(frame,0,base,{...DEFAULTS,toneProfile:'source',densityProfile:'threshold',densityThreshold:.8});
  const structured=compositions.sample(frame,1,{...base,structure:.86,edge:.82,local:.72,saliency:.88},{...DEFAULTS,toneProfile:'edge',densityProfile:'structure'});
  assert.ok(source.tone>.65);
  assert.ok(inverse.tone<.35,'inverse topology must be more than a palette inversion');
  assert.equal(threshold.presence,0,'threshold profiles must create intentional negative space');
  assert.ok(structured.presence>.75&&structured.scale>source.scale,'structure profiles must emphasize important image regions');
  const invertedShadow=compositions.sample(frame,0,{...base,value:.12,alpha:.08},{...DEFAULTS,toneProfile:'inverse',densityProfile:'continuous'});
  assert.ok(invertedShadow.alpha>.55,'composed inverse tones must not inherit the source shadow opacity');
});

test('secondary renderer weights are deterministic and region aware', () => {
  const { CompositionInterpreter, DEFAULTS } = createOpenAsciiRuntime();
  const compositions=new CompositionInterpreter(),frame={
    edge:new Float32Array([.06,.9]),localContrast:new Float32Array([.08,.72]),variance:new Float32Array([.08,.48]),
    saliency:new Float32Array([.12,.84]),gradientMagnitude:new Float32Array([.05,.68]),gradientDirection:new Float32Array([0,Math.PI/2])
  };
  const style={value:.58,structure:.7,scale:.7,alpha:.8,edge:.5,local:.5,variance:.4,saliency:.6,gradient:.5,direction:0,tangent:Math.PI/2};
  const config={...DEFAULTS,secondaryStyle:'line',secondaryMix:.72,secondaryRegion:'edge'};
  const flat=compositions.sample(frame,0,style,config),edge=compositions.sample(frame,1,style,config);
  assert.equal(compositions.sample(frame,1,style,config).secondaryWeight,edge.secondaryWeight);
  assert.ok(edge.secondaryWeight>flat.secondaryWeight*4,'edge mixes must allocate the secondary renderer to edges');
  assert.ok(edge.primaryWeight>0&&edge.primaryWeight<=1);
});

test('serialized export runtime is executable and API-equivalent', () => {
  const runtime = new Function(`return ${createRuntimeSource()}`)();
  assert.deepEqual(Object.keys(runtime).sort(), Object.keys(createOpenAsciiRuntime()).sort());
  assert.equal(runtime.DEFAULTS.seed, 1337);
});
