/**
 * Self-contained OpenASCII runtime.
 *
 * Everything required by the editor is deliberately enclosed in this factory so
 * the exact same implementation can be serialized into HTML/React exports.
 */
export function createOpenAsciiRuntime() {
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const TAU = Math.PI * 2;
  const COLOR_MODES = {
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
  const CHARSETS = {
    detailed: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^. ',
    simple: '@%#*+=-:. ', binary: '10 ', blocks: '█▓▒░ ',
    katakana: 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓ'
  };
  const DEFAULTS = {
    artStyle: 'classic-ascii', font: 'Space Mono', characterSet: 'detailed', customCharacters: '',
    ditherAlgorithm: 'floyd-steinberg', brightness: 50, contrast: 1.35, gamma: 1,
    localContrast: 0.72, edgeEnhance: 0.72, saliencyDetail: 0.68,
    ditherStrength: 0.42, inverseDither: 0, fontSize: 10, characterSpacing: 1.08, opacity: 1,
    densityScale: 1, primitiveShape: 'circle', primitiveThickness: 1, edgeEmphasis: 1,
    toneProfile: 'source', densityProfile: 'continuous', densityThreshold: 0.38, structureMix: 0.28,
    secondaryStyle: 'none', secondaryMix: 0, secondaryRegion: 'detail',
    particleVariation: 0.36, particleJitter: 0.08, particleDepth: 0.72,
    lineSystem: 'flow', lineDirection: 0, lineContour: 0.28, lineLength: 1,
    lineVariation: 0.22, lineSecondary: 0.12,
    quality: 320, vignette: 0.18, borderGlow: 0.22, backgroundStyle: 'solid',
    colorMode: 'matrix-green', foreground: '#36e66a', background: '#020a04', accent: '#d8ff57', colorMix: 0.82,
    colorSaturation: 1, paletteBias: 0, highlightBoost: 0.38, invertColor: false,
    fxPreset: 'noise-field', fxStrength: 0.24, direction: 'down', noiseScale: 58, noiseSpeed: 0.2,
    temporalPersistence: 0, phosphorDecay: 0, ghostStrength: 0, ghostFrames: 0, ghostSpacing: 3, noiseOpacity: 0.04, glowStrength: 0.18,
    mouseMode: 'attract', hoverStrength: 13, areaSize: 180, spread: 1.25,
    springStrength: 32, damping: 9.5, particleDrag: 0.94,
    clickSensitivity: 1, clickReturn: 0.34, clickDamping: 0.58, seed: 1337
  };
  const BAYER_4 = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  const BRAILLE_BITS = [[0,0,1],[0,1,2],[0,2,4],[1,0,8],[1,1,16],[1,2,32],[0,3,64],[1,3,128]];

  function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return x - Math.floor(x); }
  function smoothNoise(x, y, seed = 0) {
    const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi;
    const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf);
    const a=hash(xi*157+yi*313+seed), b=hash((xi+1)*157+yi*313+seed);
    const c=hash(xi*157+(yi+1)*313+seed), d=hash((xi+1)*157+(yi+1)*313+seed);
    return lerp(lerp(a,b,u),lerp(c,d,u),v)*2-1;
  }
  function luminance(r,g,b) {
    const linear = v => { v/=255; return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4); };
    return clamp(Math.pow(.2126*linear(r)+.7152*linear(g)+.0722*linear(b),1/2.2));
  }
  function hexRgb(hex){const clean=String(hex||'#ffffff').replace('#','');const full=clean.length===3?clean.split('').map(c=>c+c).join(''):clean;const n=parseInt(full,16);return Number.isFinite(n)?[(n>>16)&255,(n>>8)&255,n&255]:[255,255,255];}
  function mixRgb(a,b,t){t=clamp(t);return [Math.round(lerp(a[0],b[0],t)),Math.round(lerp(a[1],b[1],t)),Math.round(lerp(a[2],b[2],t))];}
  function saturateRgb(rgb,amount=1){const y=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;return rgb.map(channel=>Math.round(clamp(y+(channel-y)*amount,0,255)));}
  function rampRgb(stops,t){t=clamp(t);const scaled=t*(stops.length-1),index=Math.min(stops.length-2,Math.floor(scaled));return mixRgb(stops[index],stops[index+1],scaled-index);}
  function rgbCss(rgb,alpha=1){return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;}
  function makeIntegral(values,w,h) {
    const out=new Float64Array((w+1)*(h+1));
    for(let y=1;y<=h;y++){let row=0;for(let x=1;x<=w;x++){row+=values[(y-1)*w+x-1];out[y*(w+1)+x]=out[(y-1)*(w+1)+x]+row;}}
    return out;
  }
  function areaSum(integral,w,x0,y0,x1,y1) {
    const stride=w+1; return integral[y1*stride+x1]-integral[y0*stride+x1]-integral[y1*stride+x0]+integral[y0*stride+x0];
  }
  function cropRect(image, targetRatio) {
    const w = image.videoWidth || image.naturalWidth || image.width || 1;
    const h = image.videoHeight || image.naturalHeight || image.height || 1;
    const ratio=w/h; let sx=0,sy=0,sw=w,sh=h;
    if(ratio>targetRatio){sw=sh*targetRatio;sx=(w-sw)/2;}else{sh=sw/targetRatio;sy=(h-sh)/2;}
    return {sx,sy,sw,sh};
  }
  function ditherCells(values, frame, algorithm, strength) {
    const out=new Float32Array(values), {cols,rows,edge,saliency}=frame;
    if(algorithm==='none'||strength<=0)return out;
    if(algorithm==='ordered'||algorithm==='bayer'){
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*cols+x, adaptive=strength*(1-edge[i]*.62);out[i]=clamp(out[i]+((BAYER_4[(y%4)*4+x%4]/15)-.5)*.34*adaptive);}
      return out;
    }
    if(algorithm==='blue-noise'){
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*cols+x;out[i]=clamp(out[i]+smoothNoise(x*1.73,y*1.73,71)*.22*strength*(1-edge[i]*.7));}
      return out;
    }
    const matrix=algorithm==='atkinson'
      ? [[1,0,1/8],[2,0,1/8],[-1,1,1/8],[0,1,1/8],[1,1,1/8],[0,2,1/8]]
      : [[1,0,7/16],[-1,1,3/16],[0,1,5/16],[1,1,1/16]];
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const i=y*cols+x, threshold=.5+(hash(i*19+23)-.5)*.04, quant=out[i]<threshold?0:1;
      const error=(out[i]-quant)*strength*(1-edge[i]*.76)*(1-saliency[i]*.18);out[i]=lerp(out[i],quant,strength*.72);
      for(const [dx,dy,f] of matrix){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<cols&&ny>=0&&ny<rows)out[ny*cols+nx]=clamp(out[ny*cols+nx]+error*f);}
    }
    return out;
  }

  class FrameProcessor {
    build(image, width, height, dpr, config) {
      const density=Math.max(.55,config.densityScale||1),cellPx=Math.max(2*dpr,config.fontSize*config.characterSpacing*dpr*.62/density);
      const cols=Math.max(12,Math.min(config.quality,Math.floor(width/cellPx)));
      const cellW=width/cols, cellH=cellW*(config.artStyle==='braille'?1.62:1.08);
      const rows=Math.max(8,Math.ceil(height/cellH)), scale=4;
      const aw=cols*scale, ah=rows*scale, canvas=document.createElement('canvas');canvas.width=aw;canvas.height=ah;
      const ctx=canvas.getContext('2d',{willReadFrequently:true}), crop=cropRect(image,width/height);
      ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,crop.sx,crop.sy,crop.sw,crop.sh,0,0,aw,ah);
      const pixels=ctx.getImageData(0,0,aw,ah).data, raw=new Float32Array(aw*ah), rr=new Float32Array(aw*ah),gg=new Float32Array(aw*ah),bb=new Float32Array(aw*ah);
      const gamma=Math.max(.2,config.gamma||1), bright=(config.brightness-50)/100;
      for(let i=0;i<raw.length;i++){rr[i]=pixels[i*4]/255;gg[i]=pixels[i*4+1]/255;bb[i]=pixels[i*4+2]/255;let v=Math.pow(luminance(pixels[i*4],pixels[i*4+1],pixels[i*4+2]),gamma);v=(v-.5)*config.contrast+.5+bright;raw[i]=clamp(v);}
      const rawIntegral=makeIntegral(raw,aw,ah), enhanced=new Float32Array(raw.length),localDeviationPx=new Float32Array(raw.length),radius=scale*2;
      for(let y=0;y<ah;y++)for(let x=0;x<aw;x++){const x0=Math.max(0,x-radius),y0=Math.max(0,y-radius),x1=Math.min(aw,x+radius+1),y1=Math.min(ah,y+radius+1),index=y*aw+x;const local=areaSum(rawIntegral,aw,x0,y0,x1,y1)/((x1-x0)*(y1-y0));localDeviationPx[index]=Math.abs(raw[index]-local);enhanced[index]=clamp(raw[index]+(raw[index]-local)*config.localContrast);}
      const gx=new Float32Array(raw.length),gy=new Float32Array(raw.length),edgePx=new Float32Array(raw.length);
      for(let y=1;y<ah-1;y++)for(let x=1;x<aw-1;x++){const i=y*aw+x,a=enhanced;const dx=3*(a[i-aw+1]-a[i-aw-1])+10*(a[i+1]-a[i-1])+3*(a[i+aw+1]-a[i+aw-1]);const dy=3*(a[i+aw-1]-a[i-aw-1])+10*(a[i+aw]-a[i-aw])+3*(a[i+aw+1]-a[i-aw+1]);gx[i]=dx/16;gy[i]=dy/16;edgePx[i]=clamp(Math.hypot(dx,dy)/5);}
      const lumI=makeIntegral(enhanced,aw,ah),sourceLumI=makeIntegral(raw,aw,ah),sqI=makeIntegral(Float32Array.from(enhanced,v=>v*v),aw,ah),edgeI=makeIntegral(edgePx,aw,ah),localI=makeIntegral(localDeviationPx,aw,ah),rI=makeIntegral(rr,aw,ah),gI=makeIntegral(gg,aw,ah),bI=makeIntegral(bb,aw,ah),gxI=makeIntegral(gx,aw,ah),gyI=makeIntegral(gy,aw,ah);
      const count=cols*rows,value=new Float32Array(count),luminanceValue=new Float32Array(count),variance=new Float32Array(count),localContrastValue=new Float32Array(count),edge=new Float32Array(count),saliency=new Float32Array(count),detailScore=new Float32Array(count),gradientX=new Float32Array(count),gradientY=new Float32Array(count),gradientMagnitude=new Float32Array(count),gradientDirection=new Float32Array(count),red=new Float32Array(count),green=new Float32Array(count),blue=new Float32Array(count),braille=new Uint16Array(count);
      for(let cy=0;cy<rows;cy++)for(let cx=0;cx<cols;cx++){
        const i=cy*cols+cx,x0=cx*scale,y0=cy*scale,x1=Math.min(aw,x0+scale),y1=Math.min(ah,y0+scale),n=(x1-x0)*(y1-y0);
        const mean=areaSum(lumI,aw,x0,y0,x1,y1)/n, varianceValue=Math.sqrt(Math.max(0,areaSum(sqI,aw,x0,y0,x1,y1)/n-mean*mean));
        const e=areaSum(edgeI,aw,x0,y0,x1,y1)/n,local=areaSum(localI,aw,x0,y0,x1,y1)/n,gxx=areaSum(gxI,aw,x0,y0,x1,y1)/n,gyy=areaSum(gyI,aw,x0,y0,x1,y1)/n,gradient=Math.hypot(gxx,gyy);luminanceValue[i]=areaSum(sourceLumI,aw,x0,y0,x1,y1)/n;value[i]=clamp(mean+(mean-.5)*varianceValue*.42+e*config.edgeEnhance*(mean>=.5?1:-1)*.14);variance[i]=varianceValue;localContrastValue[i]=local;edge[i]=e;saliency[i]=clamp(e*.62+varianceValue*1.55+local*1.35);detailScore[i]=clamp(e*.48+varianceValue*1.8+local*1.7+gradient*.35);gradientX[i]=gxx;gradientY[i]=gyy;gradientMagnitude[i]=gradient;gradientDirection[i]=Math.atan2(gyy,gxx);red[i]=areaSum(rI,aw,x0,y0,x1,y1)/n;green[i]=areaSum(gI,aw,x0,y0,x1,y1)/n;blue[i]=areaSum(bI,aw,x0,y0,x1,y1)/n;
        let bits=0;for(const [bx,by,bit] of BRAILLE_BITS){const px=clamp(Math.floor(x0+(bx+.5)*(scale/2)),0,aw-1),py=clamp(Math.floor(y0+(by+.5)*(scale/4)),0,ah-1),sample=enhanced[py*aw+px],threshold=.42+(BAYER_4[(by%4)*4+(bx%4)]/15-.5)*.18;if(sample>threshold)bits|=bit;}braille[i]=bits;
      }
      const frame={cols,rows,count,cellW,cellH,value,brightness:value,luminance:luminanceValue,variance,localContrast:localContrastValue,edge,saliency,detailScore,gradientX,gradientY,gradientMagnitude,gradientDirection,red,green,blue,averageColor:{red,green,blue},braille,analysis:Object.freeze({width:aw,height:ah,scale})};
      frame.dithered=ditherCells(value,frame,config.ditherAlgorithm,config.ditherStrength);
      return frame;
    }
  }

  const glyphCache=new Map();
  class GlyphAtlas {
    constructor(font,chars,size,spacing){this.font=font;this.chars=[...new Set(chars.split(''))];this.size=size;this.spacing=spacing;this.glyphs=this.analyze();}
    analyze(){
      const key=`${this.font}|${this.size}|${this.spacing}|${this.chars.join('')}`;if(glyphCache.has(key))return glyphCache.get(key);
      const side=40,canvas=document.createElement('canvas');canvas.width=side;canvas.height=side;const ctx=canvas.getContext('2d',{willReadFrequently:true});const glyphs=[];
      for(const char of this.chars){ctx.clearRect(0,0,side,side);ctx.fillStyle='#fff';ctx.font=`${Math.max(8,side*.72)}px "${this.font}", monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(char,side/2,side/2+1);const data=ctx.getImageData(0,0,side,side).data;let coverage=0,horizontal=0,vertical=0,complexity=0,entropy=0,symmetryError=0,cx=0,cy=0;
        for(let y=1;y<side-1;y++)for(let x=1;x<side-1;x++){const i=(y*side+x)*4,a=data[i+3]/255,mirror=data[(y*side+(side-1-x))*4+3]/255;coverage+=a;cx+=x*a;cy+=y*a;symmetryError+=Math.abs(a-mirror);if(a>0&&a<1)entropy+=-a*Math.log2(a)-(1-a)*Math.log2(1-a);const dx=Math.abs(data[i+7]-data[i-1])/255,dy=Math.abs(data[i+side*4+3]-data[i-side*4+3])/255;vertical+=dx;horizontal+=dy;complexity+=Math.hypot(dx,dy);}
        const norm=side*side;glyphs.push({char,coverage:coverage/norm,horizontal:horizontal/norm,vertical:vertical/norm,complexity:complexity/norm,entropy:entropy/norm,symmetry:1-symmetryError/norm,edgeResponse:complexity/norm,cx:coverage?cx/coverage/side:.5,cy:coverage?cy/coverage/side:.5});
      }
      const normalize=key=>{let min=Infinity,max=-Infinity;for(const g of glyphs){min=Math.min(min,g[key]);max=Math.max(max,g[key]);}for(const g of glyphs)g[key]=(g[key]-min)/(max-min||1);};['coverage','horizontal','vertical','complexity','entropy','symmetry','edgeResponse'].forEach(normalize);glyphCache.set(key,glyphs);return glyphs;
    }
    select(frame,index,inverted=false){
      const tone=inverted?1-frame.dithered[index]:frame.dithered[index],gx=Math.abs(frame.gradientX[index]),gy=Math.abs(frame.gradientY[index]),sum=gx+gy+.0001,targetV=gx/sum,targetH=gy/sum,targetC=clamp(frame.saliency[index]*1.25);let best=this.glyphs[0],score=Infinity;
      for(const glyph of this.glyphs){const coverage=Math.abs(glyph.coverage-tone)*3.25,h=Math.abs(glyph.horizontal-targetH)*targetC*.58,v=Math.abs(glyph.vertical-targetV)*targetC*.58,c=Math.abs(glyph.complexity-targetC)*.44,entropy=Math.abs(glyph.entropy-frame.variance[index]*4)*.12,edgeResponse=Math.abs(glyph.edgeResponse-frame.edge[index])*.18,centroid=(Math.abs(glyph.cx-.5)+Math.abs(glyph.cy-.5))*.08;const s=coverage+h+v+c+entropy+edgeResponse+centroid;if(s<score){score=s;best=glyph;}}
      return best.char;
    }
  }

  class PhysicsField {
    constructor(frame){this.reset(frame);}
    reset(frame){const n=frame.count;this.n=n;this.x=new Float32Array(n);this.y=new Float32Array(n);this.vx=new Float32Array(n);this.vy=new Float32Array(n);this.rx=new Float32Array(n);this.ry=new Float32Array(n);this.mass=new Float32Array(n);this.clickEnergy=0;for(let i=0;i<n;i++){const col=i%frame.cols,row=(i/frame.cols)|0,structure=frame.saliency?.[i]||0;this.x[i]=this.rx[i]=(col+.5)*frame.cellW;this.y[i]=this.ry[i]=(row+.5)*frame.cellH;this.mass[i]=.7+hash(i*13)*.42+structure*.58;}}
    update(dt,pointer,config,frame,time){
      dt=Math.min(dt,.034);const radius=config.areaSize,forceScale=config.hoverStrength*72,pressure=clamp(pointer.pressure||.5,.25,1),burst=pointer.burst||0,clickForce=burst*(1.2+pressure*.8);if(pointer.down||burst>.01)this.clickEnergy=1;else this.clickEnergy*=Math.exp(-dt*.56);if(pointer.burst){pointer.burst*=Math.exp(-dt*10);if(pointer.burst<.002)pointer.burst=0;}const springScale=lerp(1,clamp(config.clickReturn,.08,1),this.clickEnergy),dampingScale=lerp(1,clamp(config.clickDamping,.15,1),this.clickEnergy),diag=Math.hypot(frame.cols*frame.cellW,frame.rows*frame.cellH)||1,maxVelocity=diag*1.15;
      for(let i=0;i<this.n;i++){let ax=(this.rx[i]-this.x[i])*config.springStrength*springScale,ay=(this.ry[i]-this.y[i])*config.springStrength*springScale;
        if(config.fxPreset==='noise-field'||config.artStyle==='particles'){const ns=Math.max(8,config.noiseScale),t=time*.00006*config.noiseSpeed,nx=this.rx[i]/ns,ny=this.ry[i]/ns,e=.18,n0=smoothNoise(nx+t,ny,config.seed),curlX=(smoothNoise(nx+t,ny+e,config.seed)-smoothNoise(nx+t,ny-e,config.seed))/(2*e),curlY=-(smoothNoise(nx+e+t,ny,config.seed)-smoothNoise(nx-e+t,ny,config.seed))/(2*e);ax+=(n0*.35+curlX*.65)*config.fxStrength*42;ay+=(smoothNoise(nx,ny+t,config.seed+91)*.35+curlY*.65)*config.fxStrength*42;}
        this.vx[i]=(this.vx[i]+ax*dt)*Math.exp(-config.damping*dampingScale*dt);this.vy[i]=(this.vy[i]+ay*dt)*Math.exp(-config.damping*dampingScale*dt);const speed=Math.hypot(this.vx[i],this.vy[i]);if(speed>maxVelocity){this.vx[i]*=maxVelocity/speed;this.vy[i]*=maxVelocity/speed;}this.x[i]+=this.vx[i]*dt;this.y[i]+=this.vy[i]*dt;
      }
    }
  }

  class StyleInterpreter {
    sample(frame,index,tone,detail,config){
      const edge=frame.edge[index]||0,local=frame.localContrast[index]||0,variance=frame.variance[index]||0,saliency=frame.saliency[index]||0,gradient=frame.gradientMagnitude[index]||0;
      const structure=clamp(edge*.46+local*.58+variance*1.08+saliency*.2+detail*.3+gradient*.08);
      const value=clamp(tone+structure*(tone>=.5?.075:-.018));
      const scale=clamp(.07+Math.pow(value,.76)*.82+structure*.18,.06,1.12);
      const alpha=clamp(.025+value*.84+structure*.2)*(config.opacity??1);
      const direction=frame.gradientDirection[index]||0;
      return {value,structure,scale,alpha,edge,local,variance,saliency,gradient,direction,tangent:direction+Math.PI/2,band:clamp(Math.floor(value*5),0,4)};
    }
  }

  class CompositionInterpreter {
    sample(frame,index,style,config){
      const edge=frame.edge[index]||0,local=frame.localContrast[index]||0,variance=frame.variance[index]||0,saliency=frame.saliency[index]||0,gradient=frame.gradientMagnitude[index]||0,structure=clamp(edge*.42+local*.28+variance*.18+saliency*.12),mix=clamp(config.structureMix??.28);
      let tone=style.value;
      if(config.toneProfile==='inverse')tone=1-tone;
      else if(config.toneProfile==='edge')tone=clamp(.18+structure*.7+gradient*.22);
      else if(config.toneProfile==='duotone')tone=tone<.5?clamp(tone*.42):clamp(.58+(tone-.5)*.84);
      tone=clamp(lerp(tone,clamp(tone*.64+structure*.72),mix));
      let presence=1;
      const threshold=clamp(config.densityThreshold??.38);
      if(config.densityProfile==='threshold')presence=tone>=threshold?.35+clamp((tone-threshold)/Math.max(.08,1-threshold))*.65:0;
      else if(config.densityProfile==='bands')presence=clamp(Math.floor(tone*5)/4);
      else if(config.densityProfile==='structure')presence=clamp(structure*.82+tone*.34);
      const region=config.secondaryRegion==='edge'?edge:config.secondaryRegion==='highlight'?tone:config.secondaryRegion==='shadow'?1-tone:clamp(variance*.42+local*.3+saliency*.28);
      const secondaryWeight=config.secondaryStyle&&config.secondaryStyle!=='none'?clamp(config.secondaryMix??0)*Math.pow(clamp(region),.72)*presence:0;
      const primaryWeight=clamp(presence*(1-secondaryWeight*.34));
      return {
        tone,presence,primaryWeight,secondaryWeight,
        scale:clamp(style.scale*(.32+presence*.82)*(config.densityProfile==='structure'?.84+structure*.34:1),.02,1.3),
        alpha:clamp((.06+tone*.82+structure*.42)*Math.pow(presence,.55))*(config.opacity??1),
        angle:(style.direction||0)+(hash(index*157+(config.seed||0))-.5)*gradient*.16
      };
    }
  }

  class GlyphRenderer { draw(ctx,s){ctx.fillText(s.f.glyphs[s.i],s.x,s.y);} }
  class ParticleRenderer {
    drawPrimitive(ctx,shape,x,y,size,angle,aspect=1){if(shape==='square'){ctx.fillRect(x-size,y-size*aspect,size*2,size*2*aspect);}else if(shape==='ring'){ctx.beginPath();ctx.arc(x,y,size,0,TAU);ctx.stroke();}else if(shape==='slash'){const dx=Math.cos(angle)*size,dy=Math.sin(angle)*size;ctx.beginPath();ctx.moveTo(x-dx,y-dy);ctx.lineTo(x+dx,y+dy);ctx.stroke();}else if(shape==='diamond'){ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillRect(-size*.76,-size*.76,size*1.52,size*1.52);ctx.restore();}else{ctx.beginPath();ctx.arc(x,y,size,0,TAU);ctx.fill();}}
    draw(ctx,s){const c=s.c,f=s.f,i=s.i,variation=clamp(c.particleVariation),depth=clamp(c.particleDepth),jitter=clamp(c.particleJitter,0,.5),motif=hash(i*43+c.seed),scaleNoise=lerp(.78,1.24,hash(i*71+c.seed*3)),structure=clamp(s.tone*.72+s.detail*.2+f.localContrast[i]*.82+f.edge[i]*.1),size=Math.max(.32,f.cellW*(.028+Math.pow(structure,.72)*.43)*lerp(1,scaleNoise,depth)),jx=(hash(i*97+c.seed)-.5)*f.cellW*jitter,jy=(hash(i*113+c.seed)-.5)*f.cellH*jitter,x=s.x+jx,y=s.y+jy,angle=f.gradientDirection[i]+Math.PI/2,aspect=lerp(.72,1.3,hash(i*59+c.seed));let shape=c.primitiveShape||'circle';if(motif<variation){const selector=motif/Math.max(variation,.0001);shape=selector<.24?'ring':selector<.5?'circle':selector<.74?'slash':'diamond';}ctx.lineWidth=Math.max(.5,f.cellW*(.055+s.detail*.04)*c.primitiveThickness);this.drawPrimitive(ctx,shape,x,y,size,angle,aspect);if(s.detail>.66&&structure>.18&&hash(i*29+c.seed)<variation*.72){ctx.globalAlpha=s.alpha*(.18+s.detail*.18);const satellite=Math.max(.24,size*(.2+s.detail*.16)),offset=f.cellW*(.15+s.detail*.08);this.drawPrimitive(ctx,'circle',x+Math.cos(angle)*offset,y+Math.sin(angle)*offset,satellite,angle,1);}}
  }
  class LineRenderer {
    blendAngle(a,b,t){const x=Math.cos(a*2)*(1-t)+Math.cos(b*2)*t,y=Math.sin(a*2)*(1-t)+Math.sin(b*2)*t;return Math.atan2(y,x)*.5;}
    geometry(s){const c=s.c,f=s.f,i=s.i,edge=f.edge[i]||0,local=f.localContrast[i]||0,saliency=f.saliency[i]||0,variation=clamp(c.lineVariation??.22),baseAngle=(c.lineDirection??0)*Math.PI/180,tangent=(f.gradientDirection[i]||0)+Math.PI/2,contourMix=c.lineSystem==='contour'?1:c.lineSystem==='scan'?clamp(c.lineContour??.28)*.16:clamp(c.lineContour??.28),angle=this.blendAngle(baseAngle,tangent,contourMix)+(hash(i*73+c.seed)-.5)*variation*.18,structure=clamp(edge*.62+local*.34+saliency*.2+s.detail*.26),lengthScale=clamp(.1+Math.pow(s.tone,.78)*.82+structure*.2,.08,1.12),len=f.cellW*clamp(c.lineLength??1,.35,1.65)*lengthScale,normalX=-Math.sin(angle),normalY=Math.cos(angle),drift=(hash(i*97+c.seed*3)-.5)*f.cellH*variation*.18,bend=(hash(i*131+c.seed*5)-.5)*f.cellH*variation*(.18+s.detail*.22),x=s.x+normalX*drift,y=s.y+normalY*drift,width=Math.max(.42,f.cellW*(.038+s.tone*.066+structure*.026)*(c.primitiveThickness??1));return {angle,len,bend,x,y,width,structure};}
    stroke(ctx,x,y,angle,len,bend){const dx=Math.cos(angle)*len*.5,dy=Math.sin(angle)*len*.5,px=-Math.sin(angle),py=Math.cos(angle);ctx.beginPath();ctx.moveTo(x-dx,y-dy);ctx.quadraticCurveTo(x+px*bend,y+py*bend,x+dx,y+dy);ctx.stroke();}
    draw(ctx,s){const g=this.geometry(s);ctx.lineWidth=g.width;this.stroke(ctx,g.x,g.y,g.angle,g.len,g.bend);const secondary=clamp(s.c.lineSecondary??.12),threshold=secondary*(.18+s.detail*.62+g.structure*.28);if(hash(s.i*179+s.c.seed*7)<threshold){const crossAngle=g.angle+Math.PI/2,offset=(hash(s.i*211+s.c.seed)-.5)*s.f.cellW*.12;ctx.globalAlpha=s.alpha*(.18+s.detail*.3);ctx.lineWidth=Math.max(.38,g.width*.62);this.stroke(ctx,g.x+Math.cos(g.angle)*offset,g.y+Math.sin(g.angle)*offset,crossAngle,g.len*(.3+s.detail*.3),-g.bend*.48);ctx.globalAlpha=s.alpha;}}
  }
  class BrailleRenderer {
    draw(ctx,s){let bits=s.inverted?(~s.f.braille[s.i]&255):s.f.braille[s.i];if(bits===0&&s.style.edge>.58&&s.style.value>.08)bits=1<<Math.floor(hash(s.i*43+s.c.seed)*8);ctx.fillText(String.fromCharCode(0x2800+bits),s.x,s.y);}
  }
  class HalftoneRenderer {
    draw(ctx,s){const radius=Math.max(.32,s.f.cellW*(.035+Math.sqrt(s.style.scale)*.42));ctx.beginPath();ctx.arc(s.x,s.y,radius,0,TAU);ctx.fill();if(s.style.structure>.64&&s.style.value>.2&&hash(s.i*61+s.c.seed)<s.style.structure*.34){ctx.globalAlpha=s.alpha*(.16+s.style.structure*.18);ctx.lineWidth=Math.max(.38,radius*.16);ctx.beginPath();ctx.arc(s.x,s.y,radius*1.18,0,TAU);ctx.stroke();ctx.globalAlpha=s.alpha;}}
  }
  class DotCrossRenderer {
    draw(ctx,s){const size=s.f.cellW*(.07+s.style.scale*.3),weight=Math.max(.48,s.f.cellW*(.045+s.style.structure*.05)*(s.c.primitiveThickness??1));ctx.lineWidth=weight;ctx.beginPath();if(s.style.value<.2){ctx.arc(s.x,s.y,Math.max(.28,size*.24),0,TAU);ctx.fill();return;}if(s.style.value<.46){ctx.moveTo(s.x-size,s.y);ctx.lineTo(s.x+size,s.y);ctx.moveTo(s.x,s.y-size);ctx.lineTo(s.x,s.y+size);ctx.stroke();return;}if(s.style.value<.76){ctx.arc(s.x,s.y,size*.72,0,TAU);ctx.stroke();return;}ctx.moveTo(s.x-size,s.y-size);ctx.lineTo(s.x+size,s.y+size);ctx.moveTo(s.x+size,s.y-size);ctx.lineTo(s.x-size,s.y+size);ctx.stroke();}
  }
  class RetroRenderer {
    draw(ctx,s){const glyph=[' ','░','▒','▓','█'][s.style.band];ctx.fillText(glyph,s.x,s.y);if(s.style.structure>.72&&s.style.band>1){ctx.globalAlpha=s.alpha*.2;ctx.fillRect(s.x-s.f.cellW*.38,s.y+s.f.cellH*.29,s.f.cellW*.76,Math.max(.35,s.f.cellH*.045));ctx.globalAlpha=s.alpha;}}
  }
  class TerminalRenderer {
    draw(ctx,s){const phase=Math.floor(s.time*.0035),column=s.i%s.f.cols,row=(s.i/s.f.cols)|0,pulse=hash(column*71+phase*13+s.c.seed),binary=hash(s.i*47+phase+s.c.seed)>.5?'1':'0',hex='0123456789ABCDEF'[Math.floor(hash(s.i*89+phase*.2+s.c.seed)*16)],char=s.style.structure>.68&&pulse>.62?hex:binary;ctx.globalAlpha=s.alpha*lerp(.72,1,pulse);ctx.fillText(char,s.x,s.y);ctx.globalAlpha=s.alpha;}
  }
  class ClaudeRenderer {
    draw(ctx,s){const gx=s.f.gradientX[s.i]||0,gy=s.f.gradientY[s.i]||0,ratio=Math.abs(gx)/(Math.abs(gx)+Math.abs(gy)+.0001),diagonal=gx*gy,tonal=['.',';',':','+','*','#'][clamp(Math.floor(s.style.value*6),0,5)],structural=ratio>.68?'|':ratio<.32?'_':diagonal<0?'/':'\\',char=s.style.structure>.48?structural:tonal;ctx.fillText(char,s.x,s.y);}
  }
  const RENDERERS={
    'classic-ascii':new GlyphRenderer(),particles:new ParticleRenderer(),line:new LineRenderer(),braille:new BrailleRenderer(),
    halftone:new HalftoneRenderer(),'dot-cross':new DotCrossRenderer(),'retro-art':new RetroRenderer(),terminal:new TerminalRenderer(),'claude-code':new ClaudeRenderer()
  };

  class ColorEngine {
    constructor(config,frame){this.update(config,frame);}
    update(config,frame){this.config=config;this.frame=frame;}
    palette(){const c=this.config,fallback=COLOR_MODES[c.colorMode]||COLOR_MODES.grayscale;let pair=[c.foreground||fallback[0],c.background||fallback[1]];if(c.invertColor)pair=[pair[1],pair[0]];return pair;}
    colorAt(i,tone,detail,alpha=1){const c=this.config,f=this.frame,[fgHex,bgHex]=this.palette(),fg=hexRgb(fgHex),bg=hexRgb(bgHex),accent=hexRgb(c.accent||fgHex),bias=clamp(c.paletteBias??0,-1,1),biased=Math.pow(clamp(tone*.88+detail*.12),Math.pow(2,-bias)),shadow=mixRgb(bg,fg,.16),mid=mixRgb(bg,fg,.52),highlight=mixRgb(fg,accent,clamp((detail-.34)*(c.highlightBoost??.38)*2.2)),palette=saturateRgb(rampRgb([shadow,mid,fg,highlight],biased),c.colorSaturation??1),mix=clamp(c.colorMix??.82);if(c.colorMode==='full-color'){const sampled=saturateRgb([Math.round(f.red[i]*255),Math.round(f.green[i]*255),Math.round(f.blue[i]*255)],c.colorSaturation??1),lit=mixRgb(bg,sampled,.16+biased*.84),colored=mixRgb(palette,lit,mix),spark=mixRgb(colored,accent,clamp((detail-.72)*(c.highlightBoost??.38)));return rgbCss(spark,alpha);}const graded=mixRgb(fg,palette,mix);return rgbCss(graded,alpha);}
  }

  class TemporalCompositor {
    constructor(){this.history=null;this.ghosts=[];this.historyReady=false;this.ghostCount=0;this.frameCounter=0;this.width=0;this.height=0;}
    canvas(width,height){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;}
    resize(width,height){
      if(width===this.width&&height===this.height&&this.history)return;
      this.width=width;this.height=height;this.history=this.canvas(width,height);this.ghosts=Array.from({length:3},()=>this.canvas(width,height));this.historyReady=false;this.ghostCount=0;this.frameCounter=0;
    }
    decayAlpha(retention,dt){return Math.pow(clamp(Number(retention)||0,0,.94),clamp(Number(dt)||1/60,1/240,.08)*60);}
    ghostPlan(config={}){
      const count=Math.min(3,Math.max(0,Math.floor(Number(config.ghostFrames)||0))),strength=clamp(Number(config.ghostStrength)||0,0,.28);
      return Array.from({length:count},(_,index)=>({index,alpha:strength*(count-index)/count}));
    }
    drawHistory(ctx,config,dt){
      const retention=Math.max(clamp(config.temporalPersistence||0,0,.94),config.fxPreset==='crt'?clamp(config.phosphorDecay||0,0,.94):0);
      if(this.historyReady&&retention>0){ctx.save();ctx.globalAlpha=this.decayAlpha(retention,dt);ctx.drawImage(this.history,0,0);ctx.restore();}
      const plan=this.ghostPlan(config);
      if(this.ghostCount&&plan.length){ctx.save();for(const sample of [...plan].reverse()){if(sample.index>=this.ghostCount)continue;ctx.globalAlpha=sample.alpha;ctx.drawImage(this.ghosts[sample.index],0,0);}ctx.restore();}
    }
    drawNoise(ctx,config,time,foreground){
      const opacity=clamp(config.noiseOpacity||0,0,.18);
      if(opacity<=0||config.fxPreset!=='noise-field')return;
      const count=Math.min(160,Math.max(48,Math.round(this.width*this.height/14000))),phase=Math.floor(time*(.018+(config.noiseSpeed||0)*.018));
      ctx.save();ctx.fillStyle=foreground;
      for(let i=0;i<count;i++){const x=hash(i*97+phase*13+config.seed)*this.width,y=hash(i*193+phase*29+config.seed+41)*this.height,a=(.2+hash(i*31+phase)*.8)*opacity;ctx.globalAlpha=a;ctx.fillRect(x,y,Math.max(1,this.width/900),Math.max(1,this.height/900));}
      ctx.restore();
    }
    capture(source,config){
      const historyContext=this.history.getContext('2d');historyContext.globalAlpha=1;historyContext.clearRect(0,0,this.width,this.height);historyContext.drawImage(source,0,0);this.historyReady=true;
      const spacing=Math.min(8,Math.max(1,Math.round(Number(config.ghostSpacing)||3)));
      if(++this.frameCounter%spacing!==0||Math.floor(Number(config.ghostFrames)||0)<=0)return;
      const next=this.ghosts.pop(),nextContext=next.getContext('2d');nextContext.globalAlpha=1;nextContext.clearRect(0,0,this.width,this.height);nextContext.drawImage(source,0,0);this.ghosts.unshift(next);this.ghostCount=Math.min(3,this.ghostCount+1);
    }
  }

  class WebGLPostProcessor {
    constructor(){
      this.canvas=document.createElement('canvas');
      try{this.gl=this.canvas.getContext('webgl2',{alpha:false,premultipliedAlpha:false,preserveDrawingBuffer:true,desynchronized:true});if(!this.gl)return;const gl=this.gl;
        const vertex=`#version 300 es\nin vec2 p;out vec2 uv;void main(){uv=(p+1.0)*0.5;gl_Position=vec4(p,0,1);}`;
        const fragment=`#version 300 es\nprecision mediump float;in vec2 uv;out vec4 outColor;uniform sampler2D frame;uniform float chromatic;uniform float scanlines;uniform float vignette;uniform float heightPx;void main(){float shift=chromatic*0.004;vec3 c=vec3(texture(frame,uv+vec2(shift,0)).r,texture(frame,uv).g,texture(frame,uv-vec2(shift,0)).b);float scan=1.0-scanlines*(0.045+0.035*sin(uv.y*heightPx*3.1415926));vec2 q=uv*2.0-1.0;float edge=smoothstep(0.25,1.25,dot(q,q));c*=scan*(1.0-edge*vignette*0.72);outColor=vec4(c,1);}`;
        const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;};
        this.program=gl.createProgram();gl.attachShader(this.program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(this.program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));
        const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);gl.useProgram(this.program);const location=gl.getAttribLocation(this.program,'p');gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);this.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);this.ready=true;
      }catch{this.ready=false;this.gl=null;}
    }
    render(source,config){if(!this.ready)return source;const gl=this.gl;if(this.canvas.width!==source.width||this.canvas.height!==source.height){this.canvas.width=source.width;this.canvas.height=source.height;gl.viewport(0,0,source.width,source.height);}gl.useProgram(this.program);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.uniform1f(gl.getUniformLocation(this.program,'chromatic'),config.fxPreset==='glitch'?config.fxStrength:0);gl.uniform1f(gl.getUniformLocation(this.program,'scanlines'),config.fxPreset==='intervals'||config.fxPreset==='crt'?config.fxStrength:0);gl.uniform1f(gl.getUniformLocation(this.program,'vignette'),config.vignette);gl.uniform1f(gl.getUniformLocation(this.program,'heightPx'),source.height);gl.drawArrays(gl.TRIANGLES,0,6);return this.canvas;}
  }

  class AsciiEngine {
    constructor(canvas, config={}){
      if(!canvas||typeof canvas.getContext!=='function')throw new Error('OpenASCII requires a mounted canvas element');this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.config={...DEFAULTS,...config};this.processor=new FrameProcessor();this.styles=new StyleInterpreter();this.compositions=new CompositionInterpreter();this.colors=new ColorEngine(this.config,null);this.temporal=new TemporalCompositor();this.source=null;this.frame=null;this.physics=null;this.pointer={x:-1e4,y:-1e4,downX:0,downY:0,active:false,down:false,pressure:0,burst:0};this.running=false;this.visible=true;this.lastTime=0;this.frameCount=0;this.lastFps=performance.now();this.fps=0;this.targetFps=60;this._move=e=>this.onPointer(e);this._down=e=>this.onPointerDown(e);this._up=e=>this.onPointerUp(e);this._leave=()=>{if(!this.pointer.down)this.pointer.active=false;};canvas.addEventListener('pointermove',this._move,{passive:true});canvas.addEventListener('pointerdown',this._down);canvas.addEventListener('pointerup',this._up);canvas.addEventListener('pointercancel',this._up);canvas.addEventListener('pointerleave',this._leave,{passive:true});if('IntersectionObserver'in globalThis){this.observer=new IntersectionObserver(([entry])=>{this.visible=entry.isIntersecting;});this.observer.observe(canvas);}
    }
    setConfig(next){const rebuildKeys=['artStyle','font','characterSet','customCharacters','ditherAlgorithm','brightness','contrast','gamma','localContrast','edgeEnhance','saliencyDetail','ditherStrength','inverseDither','fontSize','characterSpacing','quality','densityScale','invertColor'];const rebuild=Object.keys(next).some(k=>rebuildKeys.includes(k));this.config={...this.config,...next};this.colors.update(this.config,this.frame);if(rebuild&&this.source)this.buildFrame();}
    setSource(image){this.source=image;this.resize();}
    resize(){const box=this.canvas.getBoundingClientRect(),dpr=Math.min(globalThis.devicePixelRatio||1,2),width=Math.max(1,Math.round(box.width*dpr)),height=Math.max(1,Math.round(box.height*dpr)),changed=this.canvas.width!==width||this.canvas.height!==height;this.dpr=dpr;if(changed){this.canvas.width=width;this.canvas.height=height;}if(changed||!this.scene)this.ensureBuffers();if(this.source&&(changed||!this.frame))this.buildFrame();}
    ensureBuffers(){for(const key of ['scene','highlight','post']){if(!this[key])this[key]=document.createElement('canvas');this[key].width=this.canvas.width;this[key].height=this.canvas.height;}this.temporal.resize(this.canvas.width,this.canvas.height);if(!this.webgl)this.webgl=new WebGLPostProcessor();}
    buildFrame(){this.frame=this.processor.build(this.source,this.canvas.width,this.canvas.height,this.dpr,this.config);const chars=this.config.characterSet==='custom'&&this.config.customCharacters?this.config.customCharacters:(CHARSETS[this.config.characterSet]||CHARSETS.detailed);this.atlas=new GlyphAtlas(this.config.font,chars,this.config.fontSize*this.dpr,this.config.characterSpacing);this.frame.glyphs=new Array(this.frame.count);for(let i=0;i<this.frame.count;i++)this.frame.glyphs[i]=this.atlas.select(this.frame,i,this.config.invertColor);Object.freeze(this.frame.glyphs);Object.freeze(this.frame);this.colors.update(this.config,this.frame);if(!this.physics||this.physics.n!==this.frame.count)this.physics=new PhysicsField(this.frame);}
    onPointer(e){const r=this.canvas.getBoundingClientRect();this.pointer.x=(e.clientX-r.left)*this.dpr;this.pointer.y=(e.clientY-r.top)*this.dpr;if(typeof e.pressure==='number'&&e.pressure>0)this.pointer.pressure=e.pressure;this.pointer.active=true;}
    onPointerDown(e){this.onPointer(e);this.pointer.down=true;this.pointer.pressure=e.pressure||.5;this.pointer.downX=this.pointer.x;this.pointer.downY=this.pointer.y;this.pointer.burst=1;this.canvas.setPointerCapture?.(e.pointerId);}
    onPointerUp(e){this.onPointer(e);this.pointer.down=false;this.pointer.active=false;this.pointer.pressure=0;this.canvas.releasePointerCapture?.(e.pointerId);}
    palette(){return this.colors.palette();}
    colorAt(i,tone,detail,alpha=1){return this.colors.colorAt(i,tone,detail,alpha);}
    renderCells(ctx,time){const c=this.config,f=this.frame,p=this.physics,base=Math.max(4,f.cellW*c.characterSpacing),inverted=c.invertColor,renderer=RENDERERS[c.artStyle]||RENDERERS['classic-ascii'],secondary=c.secondaryStyle!==c.artStyle?RENDERERS[c.secondaryStyle]:null;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${base}px "${c.font}", monospace`;ctx.lineCap='round';ctx.lineJoin='round';
      for(let i=0;i<f.count;i++){const rawTone=inverted?1-f.dithered[i]:f.dithered[i],detail=f.detailScore[i],interpreted=this.styles.sample(f,i,rawTone,detail,c),composition=this.compositions.sample(f,i,interpreted,c);if(composition.presence<=.002)continue;const style={...interpreted,value:composition.tone,scale:composition.scale,alpha:composition.alpha},tone=composition.tone,x=p.x[i],y=p.y[i],color=this.colorAt(i,tone,detail),state={i,tone,detail,x,y,alpha:composition.alpha,style,inverted,time,c,f,p,engine:this};ctx.fillStyle=color;ctx.strokeStyle=color;if(composition.primaryWeight>.002){state.alpha=composition.alpha*composition.primaryWeight;ctx.globalAlpha=state.alpha;renderer.draw(ctx,state);}if(secondary&&composition.secondaryWeight>.025){state.alpha=composition.alpha*composition.secondaryWeight;ctx.globalAlpha=state.alpha;secondary.draw(ctx,state);}}ctx.globalAlpha=1;
    }
    renderHighlights(ctx,time){const f=this.frame,p=this.physics,c=this.config;ctx.globalCompositeOperation='screen';for(let i=0;i<f.count;i++){const s=f.saliency[i];if(s<.56)continue;ctx.fillStyle=this.colorAt(i,f.value[i],s);ctx.globalAlpha=(s-.56)*(.18+c.glowStrength*.34)*c.saliencyDetail;ctx.beginPath();ctx.arc(p.x[i],p.y[i],Math.max(.35,f.cellW*(.055+s*.045)),0,TAU);ctx.fill();}ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
    composite(time,dt){const c=this.config,ctx=this.ctx,w=this.canvas.width,h=this.canvas.height,[fg,bg]=this.palette(),scene=this.scene,post=this.post,postCtx=post.getContext('2d');this.canvas.dataset.renderPalette=`${fg}|${bg}`;postCtx.globalAlpha=1;postCtx.fillStyle=bg;postCtx.fillRect(0,0,w,h);if(c.backgroundStyle==='gradient'){const gradient=postCtx.createRadialGradient(w*.5,h*.42,0,w*.5,h*.5,Math.max(w,h)*.7);gradient.addColorStop(0,rgbCss(mixRgb(hexRgb(bg),hexRgb(fg),.1)));gradient.addColorStop(1,bg);postCtx.fillStyle=gradient;postCtx.fillRect(0,0,w,h);}else if(c.backgroundStyle==='grid'){postCtx.globalAlpha=.08;postCtx.strokeStyle=fg;postCtx.lineWidth=1;const gap=Math.max(8,this.frame.cellW*4);postCtx.beginPath();for(let x=0;x<w;x+=gap){postCtx.moveTo(x,0);postCtx.lineTo(x,h);}for(let y=0;y<h;y+=gap){postCtx.moveTo(0,y);postCtx.lineTo(w,y);}postCtx.stroke();postCtx.globalAlpha=1;}this.temporal.drawHistory(postCtx,c,dt);postCtx.drawImage(scene,0,0);if(c.glowStrength>0){postCtx.save();postCtx.globalCompositeOperation='screen';postCtx.globalAlpha=clamp(c.glowStrength*.68);postCtx.filter=`blur(${Math.max(1,this.frame.cellW*c.glowStrength*1.8)}px)`;postCtx.drawImage(this.highlight,0,0);postCtx.restore();}postCtx.drawImage(this.highlight,0,0);const useWebGL=this.webgl?.ready&&(c.fxPreset==='glitch'||c.fxPreset==='intervals'||c.fxPreset==='crt'||c.vignette>0),processed=useWebGL?this.webgl.render(post,c):post;ctx.globalAlpha=1;ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.drawImage(processed,0,0);
      if(c.fxPreset==='beam-sweep'){const pos=((time*.12)%(h*1.3))-h*.15,g=ctx.createLinearGradient(0,pos-h*.08,0,pos+h*.08);g.addColorStop(0,'transparent');g.addColorStop(.5,fg);g.addColorStop(1,'transparent');ctx.globalAlpha=c.fxStrength*.2;ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.globalAlpha=1;}
      if((c.fxPreset==='intervals'||c.fxPreset==='crt')&&!useWebGL){ctx.globalAlpha=c.fxStrength*.1;ctx.fillStyle=fg;for(let y=(time*.06)%12;y<h;y+=12)ctx.fillRect(0,y,w,1);ctx.globalAlpha=1;}
      if(c.fxPreset==='glitch'&&Math.sin(time*.011)>.82){ctx.globalAlpha=c.fxStrength*.28;for(let y=0;y<h;y+=37){const shift=smoothNoise(y*.1,time*.0008,c.seed)*18*c.fxStrength;ctx.drawImage(scene,0,y,w,12,shift,y,w,12);}ctx.globalAlpha=1;}
      this.temporal.drawNoise(ctx,c,time,fg);
      if(c.vignette>0&&!useWebGL){const g=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.18,w/2,h/2,Math.max(w,h)*.72);g.addColorStop(0,'transparent');g.addColorStop(1,`rgba(0,0,0,${c.vignette})`);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
      if(c.borderGlow>0){ctx.save();ctx.globalAlpha=c.borderGlow*.5;ctx.strokeStyle=fg;ctx.shadowColor=fg;ctx.shadowBlur=24*c.borderGlow;ctx.lineWidth=Math.max(1,3*this.dpr);ctx.strokeRect(1,1,w-2,h-2);ctx.restore();}
      this.temporal.capture(this.canvas,c);
    }
    draw(time=performance.now(),dt=1/60){if(!this.visible)return;if(this.source&&this.source.tagName==='VIDEO'&&this.source.readyState>=2&&!this.source.paused)this.buildFrame();if(!this.frame)return;const elapsed=clamp(dt,1/240,.08),steps=Math.max(1,Math.ceil(elapsed/(1/60))),step=elapsed/steps;for(let i=0;i<steps;i++)this.physics.update(step,this.pointer,this.config,this.frame,time-step*1000*(steps-i-1));const sctx=this.scene.getContext('2d',{alpha:true}),hctx=this.highlight.getContext('2d',{alpha:true});sctx.clearRect(0,0,this.scene.width,this.scene.height);hctx.clearRect(0,0,this.highlight.width,this.highlight.height);this.renderCells(sctx,time);this.renderHighlights(hctx,time);this.composite(time,elapsed);this.canvas.dataset.renderReady='1';}
    start(onStats){if(this.running)return;this.running=true;const loop=time=>{if(!this.running)return;const budget=1000/this.targetFps;if(!this.lastDraw||time-this.lastDraw>=budget){const dt=this.lastTime?Math.min((time-this.lastTime)/1000,.08):1/60,begin=performance.now();this.draw(time,dt);this.lastTime=time;this.lastDraw=time;this.frameCount++;if(time-this.lastFps>=500){this.fps=Math.round(this.frameCount*1000/(time-this.lastFps));this.frameCount=0;this.lastFps=time;onStats?.({fps:this.fps,cells:this.frame?.count||0,frameMs:performance.now()-begin});}const cost=performance.now()-begin;if(cost>42)this.targetFps=Math.max(24,this.targetFps-6);else if(cost<18)this.targetFps=Math.min(60,this.targetFps+2);}this.raf=requestAnimationFrame(loop);};this.raf=requestAnimationFrame(loop);}
    stop(){this.running=false;cancelAnimationFrame(this.raf);}
    destroy(){this.stop();this.observer?.disconnect();this.canvas.removeEventListener('pointermove',this._move);this.canvas.removeEventListener('pointerdown',this._down);this.canvas.removeEventListener('pointerup',this._up);this.canvas.removeEventListener('pointercancel',this._up);this.canvas.removeEventListener('pointerleave',this._leave);}
  }
  return {AsciiEngine,FrameProcessor,GlyphAtlas,PhysicsField,StyleInterpreter,CompositionInterpreter,ColorEngine,LineRenderer,TemporalCompositor,WebGLPostProcessor,DEFAULTS};
}

export function createRuntimeSource() {
  return `(${createOpenAsciiRuntime.toString()})()`;
}
