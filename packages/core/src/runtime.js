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
    'matrix-green': ['#c6ff3d', '#061008'],
    'amber-monitor': ['#ffb000', '#130b02'],
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
    quality: 320, vignette: 0.18, borderGlow: 0.22, temporalPersistence: 0,
    colorMode: 'matrix-green', foreground: '#d8ff57', background: '#070908', invertColor: false,
    fxPreset: 'noise-field', fxStrength: 0.24, direction: 'down', noiseScale: 58, noiseSpeed: 0.2,
    mouseMode: 'attract', hoverStrength: 13, areaSize: 180, spread: 1.25,
    springStrength: 32, damping: 9.5, particleDrag: 0.94, seed: 1337
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
  function makeIntegral(values,w,h) {
    const out=new Float64Array((w+1)*(h+1));
    for(let y=1;y<=h;y++){let row=0;for(let x=1;x<=w;x++){row+=values[(y-1)*w+x-1];out[y*(w+1)+x]=out[(y-1)*(w+1)+x]+row;}}
    return out;
  }
  function areaSum(integral,w,x0,y0,x1,y1) {
    const stride=w+1; return integral[y1*stride+x1]-integral[y0*stride+x1]-integral[y1*stride+x0]+integral[y0*stride+x0];
  }
  function cropRect(image, targetRatio) {
    const ratio=image.width/image.height; let sx=0,sy=0,sw=image.width,sh=image.height;
    if(ratio>targetRatio){sw=sh*targetRatio;sx=(image.width-sw)/2;}else{sh=sw/targetRatio;sy=(image.height-sh)/2;}
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
      const cellPx=Math.max(3*dpr,config.fontSize*config.characterSpacing*dpr*.68);
      const cols=Math.max(12,Math.min(config.quality,Math.floor(width/cellPx)));
      const cellW=width/cols, cellH=cellW*(config.artStyle==='braille'?1.62:1.08);
      const rows=Math.max(8,Math.ceil(height/cellH)), scale=3;
      const aw=cols*scale, ah=rows*scale, canvas=document.createElement('canvas');canvas.width=aw;canvas.height=ah;
      const ctx=canvas.getContext('2d',{willReadFrequently:true}), crop=cropRect(image,width/height);
      ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,crop.sx,crop.sy,crop.sw,crop.sh,0,0,aw,ah);
      const pixels=ctx.getImageData(0,0,aw,ah).data, raw=new Float32Array(aw*ah), rr=new Float32Array(aw*ah),gg=new Float32Array(aw*ah),bb=new Float32Array(aw*ah);
      const gamma=Math.max(.2,config.gamma||1), bright=(config.brightness-50)/100;
      for(let i=0;i<raw.length;i++){rr[i]=pixels[i*4]/255;gg[i]=pixels[i*4+1]/255;bb[i]=pixels[i*4+2]/255;let v=Math.pow(luminance(pixels[i*4],pixels[i*4+1],pixels[i*4+2]),gamma);v=(v-.5)*config.contrast+.5+bright;raw[i]=clamp(v);}
      const rawIntegral=makeIntegral(raw,aw,ah), enhanced=new Float32Array(raw.length), radius=scale*2;
      for(let y=0;y<ah;y++)for(let x=0;x<aw;x++){const x0=Math.max(0,x-radius),y0=Math.max(0,y-radius),x1=Math.min(aw,x+radius+1),y1=Math.min(ah,y+radius+1);const local=areaSum(rawIntegral,aw,x0,y0,x1,y1)/((x1-x0)*(y1-y0));enhanced[y*aw+x]=clamp(raw[y*aw+x]+(raw[y*aw+x]-local)*config.localContrast);}
      const gx=new Float32Array(raw.length),gy=new Float32Array(raw.length),edgePx=new Float32Array(raw.length);
      for(let y=1;y<ah-1;y++)for(let x=1;x<aw-1;x++){const i=y*aw+x,a=enhanced;const dx=3*(a[i-aw+1]-a[i-aw-1])+10*(a[i+1]-a[i-1])+3*(a[i+aw+1]-a[i+aw-1]);const dy=3*(a[i+aw-1]-a[i-aw-1])+10*(a[i+aw]-a[i-aw])+3*(a[i+aw+1]-a[i-aw+1]);gx[i]=dx/16;gy[i]=dy/16;edgePx[i]=clamp(Math.hypot(dx,dy)/5);}
      const lumI=makeIntegral(enhanced,aw,ah),sqI=makeIntegral(Float32Array.from(enhanced,v=>v*v),aw,ah),edgeI=makeIntegral(edgePx,aw,ah),rI=makeIntegral(rr,aw,ah),gI=makeIntegral(gg,aw,ah),bI=makeIntegral(bb,aw,ah),gxI=makeIntegral(gx,aw,ah),gyI=makeIntegral(gy,aw,ah);
      const count=cols*rows, value=new Float32Array(count),variance=new Float32Array(count),edge=new Float32Array(count),saliency=new Float32Array(count),gradientX=new Float32Array(count),gradientY=new Float32Array(count),red=new Float32Array(count),green=new Float32Array(count),blue=new Float32Array(count),braille=new Uint16Array(count);
      for(let cy=0;cy<rows;cy++)for(let cx=0;cx<cols;cx++){
        const i=cy*cols+cx,x0=cx*scale,y0=cy*scale,x1=Math.min(aw,x0+scale),y1=Math.min(ah,y0+scale),n=(x1-x0)*(y1-y0);
        const mean=areaSum(lumI,aw,x0,y0,x1,y1)/n, varianceValue=Math.sqrt(Math.max(0,areaSum(sqI,aw,x0,y0,x1,y1)/n-mean*mean));
        const e=areaSum(edgeI,aw,x0,y0,x1,y1)/n;value[i]=clamp(mean+(mean-.5)*varianceValue*.35+e*config.edgeEnhance*(mean>=.5?1:-1)*.12);variance[i]=varianceValue;edge[i]=e;saliency[i]=clamp(e*.72+varianceValue*1.8);gradientX[i]=areaSum(gxI,aw,x0,y0,x1,y1)/n;gradientY[i]=areaSum(gyI,aw,x0,y0,x1,y1)/n;red[i]=areaSum(rI,aw,x0,y0,x1,y1)/n;green[i]=areaSum(gI,aw,x0,y0,x1,y1)/n;blue[i]=areaSum(bI,aw,x0,y0,x1,y1)/n;
        let bits=0;for(const [bx,by,bit] of BRAILLE_BITS){const px=clamp(Math.floor(x0+(bx+.5)*(scale/2)),0,aw-1),py=clamp(Math.floor(y0+(by+.5)*(scale/4)),0,ah-1),sample=enhanced[py*aw+px],threshold=.42+(BAYER_4[(by%4)*4+(bx%4)]/15-.5)*.18;if(sample>threshold)bits|=bit;}braille[i]=bits;
      }
      const frame={cols,rows,count,cellW,cellH,value,variance,edge,saliency,gradientX,gradientY,red,green,blue,braille,analysis:{width:aw,height:ah}};
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
      for(const char of this.chars){ctx.clearRect(0,0,side,side);ctx.fillStyle='#fff';ctx.font=`${Math.max(8,side*.72)}px "${this.font}", monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(char,side/2,side/2+1);const data=ctx.getImageData(0,0,side,side).data;let coverage=0,horizontal=0,vertical=0,complexity=0,cx=0,cy=0;
        for(let y=1;y<side-1;y++)for(let x=1;x<side-1;x++){const i=(y*side+x)*4,a=data[i+3]/255;coverage+=a;cx+=x*a;cy+=y*a;const dx=Math.abs(data[i+7]-data[i-1])/255,dy=Math.abs(data[i+side*4+3]-data[i-side*4+3])/255;vertical+=dx;horizontal+=dy;complexity+=Math.hypot(dx,dy);}
        const norm=side*side;glyphs.push({char,coverage:coverage/norm,horizontal:horizontal/norm,vertical:vertical/norm,complexity:complexity/norm,cx:coverage?cx/coverage/side:.5,cy:coverage?cy/coverage/side:.5});
      }
      const normalize=key=>{let min=Infinity,max=-Infinity;for(const g of glyphs){min=Math.min(min,g[key]);max=Math.max(max,g[key]);}for(const g of glyphs)g[key]=(g[key]-min)/(max-min||1);};['coverage','horizontal','vertical','complexity'].forEach(normalize);glyphCache.set(key,glyphs);return glyphs;
    }
    select(frame,index,inverted=false){
      const tone=inverted?1-frame.dithered[index]:frame.dithered[index],gx=Math.abs(frame.gradientX[index]),gy=Math.abs(frame.gradientY[index]),sum=gx+gy+.0001,targetV=gx/sum,targetH=gy/sum,targetC=clamp(frame.saliency[index]*1.25);let best=this.glyphs[0],score=Infinity;
      for(const glyph of this.glyphs){const coverage=Math.abs(glyph.coverage-tone)*3.4,h=Math.abs(glyph.horizontal-targetH)*targetC*.52,v=Math.abs(glyph.vertical-targetV)*targetC*.52,c=Math.abs(glyph.complexity-targetC)*.46,centroid=(Math.abs(glyph.cx-.5)+Math.abs(glyph.cy-.5))*.08;const s=coverage+h+v+c+centroid;if(s<score){score=s;best=glyph;}}
      return best.char;
    }
  }

  class PhysicsField {
    constructor(frame){this.reset(frame);}
    reset(frame){const n=frame.count;this.n=n;this.x=new Float32Array(n);this.y=new Float32Array(n);this.vx=new Float32Array(n);this.vy=new Float32Array(n);this.rx=new Float32Array(n);this.ry=new Float32Array(n);this.mass=new Float32Array(n);for(let i=0;i<n;i++){const col=i%frame.cols,row=(i/frame.cols)|0;this.x[i]=this.rx[i]=(col+.5)*frame.cellW;this.y[i]=this.ry[i]=(row+.5)*frame.cellH;this.mass[i]=.75+hash(i*13)*.7;}}
    update(dt,pointer,config,frame,time){
      dt=Math.min(dt,.034);const radius=config.areaSize,forceScale=config.hoverStrength*72;
      for(let i=0;i<this.n;i++){let ax=(this.rx[i]-this.x[i])*config.springStrength,ay=(this.ry[i]-this.y[i])*config.springStrength;
        if(pointer.active&&radius>0){const dx=pointer.x-this.x[i],dy=pointer.y-this.y[i],dist=Math.hypot(dx,dy)||1;if(dist<radius){const fall=Math.pow(1-dist/radius,config.spread),sign=config.mouseMode==='push'?-1:1,force=forceScale*fall*sign/this.mass[i];if(config.mouseMode==='swirl'||config.mouseMode==='vortex'){ax+=-dy/dist*force;ay+=dx/dist*force;}else if(config.mouseMode==='ripple'){const wave=Math.sin(dist*.08-time*.012);ax+=dx/dist*force*wave;ay+=dy/dist*force*wave;}else{ax+=dx/dist*force;ay+=dy/dist*force;}}}
        if(config.fxPreset==='noise-field'||config.artStyle==='particles'){const ns=Math.max(8,config.noiseScale),t=time*.00006*config.noiseSpeed,nx=smoothNoise(this.rx[i]/ns+t,this.ry[i]/ns,config.seed),ny=smoothNoise(this.rx[i]/ns,this.ry[i]/ns+t,config.seed+91);ax+=nx*config.fxStrength*35;ay+=ny*config.fxStrength*35;}
        this.vx[i]=(this.vx[i]+ax*dt)*Math.exp(-config.damping*dt);this.vy[i]=(this.vy[i]+ay*dt)*Math.exp(-config.damping*dt);this.x[i]+=this.vx[i]*dt;this.y[i]+=this.vy[i]*dt;
      }
    }
  }

  class GlyphRenderer { draw(ctx,s){ctx.fillText(s.f.glyphs[s.i],s.x,s.y);} }
  class ParticleRenderer { draw(ctx,s){const radius=Math.max(.35,s.f.cellW*(.055+s.tone*.38)*(1+s.detail*.28));ctx.beginPath();ctx.arc(s.x,s.y,radius,0,TAU);ctx.fill();if(s.detail>.55&&s.tone>.18){ctx.globalAlpha=s.alpha*s.detail*.32;ctx.beginPath();ctx.arc(s.x+s.f.cellW*.2,s.y-s.f.cellH*.18,Math.max(.25,radius*.32),0,TAU);ctx.fill();}} }
  class LineRenderer { draw(ctx,s){const angle=Math.atan2(s.f.gradientY[s.i],s.f.gradientX[s.i])+Math.PI/2,len=s.f.cellW*(.18+s.tone*.68)*(1+s.detail*.25),dx=Math.cos(angle)*len*.5,dy=Math.sin(angle)*len*.5;ctx.lineWidth=Math.max(.55,s.f.cellW*(.05+s.tone*.12));ctx.beginPath();ctx.moveTo(s.x-dx,s.y-dy);ctx.lineTo(s.x+dx,s.y+dy);ctx.stroke();} }
  class BrailleRenderer { draw(ctx,s){ctx.fillText(String.fromCharCode(0x2800+(s.inverted?(~s.f.braille[s.i]&255):s.f.braille[s.i])),s.x,s.y);} }
  class HalftoneRenderer { draw(ctx,s){ctx.beginPath();ctx.arc(s.x,s.y,Math.max(.35,s.f.cellW*s.tone*.45),0,TAU);ctx.fill();} }
  class DotCrossRenderer { draw(ctx,s){ctx.lineWidth=Math.max(.6,s.f.cellW*.08);if(s.tone<.46){ctx.beginPath();ctx.arc(s.x,s.y,Math.max(.3,s.f.cellW*s.tone*.28),0,TAU);ctx.fill();}else{const size=s.f.cellW*s.tone*.3;ctx.beginPath();ctx.moveTo(s.x-size,s.y-size);ctx.lineTo(s.x+size,s.y+size);ctx.moveTo(s.x+size,s.y-size);ctx.lineTo(s.x-size,s.y+size);ctx.stroke();}} }
  class RetroRenderer { draw(ctx,s){ctx.fillText(' ░▒▓█'[clamp(Math.floor(s.tone*5),0,4)],s.x,s.y);} }
  class TerminalRenderer { draw(ctx,s){ctx.fillText('0123456789ABCDEF'[Math.floor((hash(s.i)+s.time*.00015)%1*16)],s.x,s.y);} }
  class ClaudeRenderer { draw(ctx,s){ctx.fillText(['/','*','{','}',';','=',s.f.glyphs[s.i]][s.i%7],s.x,s.y);} }
  const RENDERERS={
    'classic-ascii':new GlyphRenderer(),particles:new ParticleRenderer(),line:new LineRenderer(),braille:new BrailleRenderer(),
    halftone:new HalftoneRenderer(),'dot-cross':new DotCrossRenderer(),'retro-art':new RetroRenderer(),terminal:new TerminalRenderer(),'claude-code':new ClaudeRenderer()
  };

  class WebGLPostProcessor {
    constructor(){
      this.canvas=document.createElement('canvas');
      try{this.gl=this.canvas.getContext('webgl2',{alpha:false,premultipliedAlpha:false,preserveDrawingBuffer:true});if(!this.gl)return;const gl=this.gl;
        const vertex=`#version 300 es\nin vec2 p;out vec2 uv;void main(){uv=(p+1.0)*0.5;gl_Position=vec4(p,0,1);}`;
        const fragment=`#version 300 es\nprecision mediump float;in vec2 uv;out vec4 outColor;uniform sampler2D frame;uniform float chromatic;uniform float scanlines;uniform float vignette;uniform float heightPx;void main(){float shift=chromatic*0.004;vec3 c=vec3(texture(frame,uv+vec2(shift,0)).r,texture(frame,uv).g,texture(frame,uv-vec2(shift,0)).b);float scan=1.0-scanlines*(0.045+0.035*sin(uv.y*heightPx*3.1415926));vec2 q=uv*2.0-1.0;float edge=smoothstep(0.25,1.25,dot(q,q));c*=scan*(1.0-edge*vignette*0.72);outColor=vec4(c,1);}`;
        const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;};
        this.program=gl.createProgram();gl.attachShader(this.program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(this.program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));
        const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);gl.useProgram(this.program);const location=gl.getAttribLocation(this.program,'p');gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);this.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);this.ready=true;
      }catch{this.ready=false;this.gl=null;}
    }
    render(source,config){if(!this.ready)return source;const gl=this.gl;if(this.canvas.width!==source.width||this.canvas.height!==source.height){this.canvas.width=source.width;this.canvas.height=source.height;gl.viewport(0,0,source.width,source.height);}gl.useProgram(this.program);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.uniform1f(gl.getUniformLocation(this.program,'chromatic'),config.fxPreset==='glitch'?config.fxStrength:0);gl.uniform1f(gl.getUniformLocation(this.program,'scanlines'),config.fxPreset==='intervals'?config.fxStrength:0);gl.uniform1f(gl.getUniformLocation(this.program,'vignette'),config.vignette);gl.uniform1f(gl.getUniformLocation(this.program,'heightPx'),source.height);gl.drawArrays(gl.TRIANGLES,0,6);return this.canvas;}
  }

  class AsciiEngine {
    constructor(canvas, config={}){
      this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.config={...DEFAULTS,...config};this.processor=new FrameProcessor();this.source=null;this.frame=null;this.physics=null;this.pointer={x:-1e4,y:-1e4,active:false};this.running=false;this.visible=true;this.lastTime=0;this.frameCount=0;this.lastFps=performance.now();this.fps=0;this.targetFps=60;this._move=e=>this.onPointer(e);this._leave=()=>{this.pointer.active=false;};canvas.addEventListener('pointermove',this._move,{passive:true});canvas.addEventListener('pointerleave',this._leave,{passive:true});if('IntersectionObserver'in globalThis){this.observer=new IntersectionObserver(([entry])=>{this.visible=entry.isIntersecting;});this.observer.observe(canvas);}
    }
    setConfig(next){const rebuildKeys=['artStyle','font','characterSet','customCharacters','ditherAlgorithm','brightness','contrast','gamma','localContrast','edgeEnhance','saliencyDetail','ditherStrength','inverseDither','fontSize','characterSpacing','quality','invertColor'];const rebuild=Object.keys(next).some(k=>rebuildKeys.includes(k));this.config={...this.config,...next};if(rebuild&&this.source)this.buildFrame();}
    setSource(image){this.source=image;this.resize();}
    resize(){const box=this.canvas.getBoundingClientRect(),dpr=Math.min(globalThis.devicePixelRatio||1,2),width=Math.max(1,Math.round(box.width*dpr)),height=Math.max(1,Math.round(box.height*dpr)),changed=this.canvas.width!==width||this.canvas.height!==height;this.dpr=dpr;if(changed){this.canvas.width=width;this.canvas.height=height;this.ensureBuffers();}if(this.source&&(changed||!this.frame))this.buildFrame();}
    ensureBuffers(){for(const key of ['scene','highlight','history','post']){if(!this[key])this[key]=document.createElement('canvas');this[key].width=this.canvas.width;this[key].height=this.canvas.height;}if(!this.webgl)this.webgl=new WebGLPostProcessor();}
    buildFrame(){this.frame=this.processor.build(this.source,this.canvas.width,this.canvas.height,this.dpr,this.config);const chars=this.config.characterSet==='custom'&&this.config.customCharacters?this.config.customCharacters:(CHARSETS[this.config.characterSet]||CHARSETS.detailed);this.atlas=new GlyphAtlas(this.config.font,chars,this.config.fontSize*this.dpr,this.config.characterSpacing);this.frame.glyphs=new Array(this.frame.count);for(let i=0;i<this.frame.count;i++)this.frame.glyphs[i]=this.atlas.select(this.frame,i,this.config.invertColor);this.physics=new PhysicsField(this.frame);}
    onPointer(e){const r=this.canvas.getBoundingClientRect();this.pointer={x:(e.clientX-r.left)*this.dpr,y:(e.clientY-r.top)*this.dpr,active:true};}
    palette(){let pair=this.config.colorMode==='custom'?[this.config.foreground,this.config.background]:(COLOR_MODES[this.config.colorMode]||COLOR_MODES.grayscale);if(this.config.invertColor)pair=[pair[1],pair[0]];return pair;}
    colorAt(i,alpha=1){if(this.config.colorMode==='full-color'){const f=this.frame;return `rgba(${Math.round(f.red[i]*255)},${Math.round(f.green[i]*255)},${Math.round(f.blue[i]*255)},${alpha})`;}return this.palette()[0];}
    renderCells(ctx,time){const c=this.config,f=this.frame,p=this.physics,base=Math.max(4,f.cellW*c.characterSpacing),inverted=c.invertColor,renderer=RENDERERS[c.artStyle]||RENDERERS['classic-ascii'];ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${base}px "${c.font}", monospace`;ctx.lineCap='round';
      for(let i=0;i<f.count;i++){const tone=inverted?1-f.value[i]:f.value[i],detail=f.saliency[i],x=p.x[i],y=p.y[i],alpha=clamp((.08+tone*.98)*(1+detail*c.saliencyDetail*.22))*c.opacity;ctx.globalAlpha=alpha;ctx.fillStyle=this.colorAt(i);ctx.strokeStyle=ctx.fillStyle;renderer.draw(ctx,{i,tone,detail,x,y,alpha,inverted,time,c,f,p,engine:this});}ctx.globalAlpha=1;
    }
    renderHighlights(ctx,time){const f=this.frame,p=this.physics,c=this.config;ctx.globalCompositeOperation='screen';ctx.fillStyle=this.palette()[0];for(let i=0;i<f.count;i++){const s=f.saliency[i];if(s<.62)continue;ctx.globalAlpha=(s-.62)*.22*c.saliencyDetail;ctx.beginPath();ctx.arc(p.x[i],p.y[i],Math.max(.35,f.cellW*.08),0,TAU);ctx.fill();}ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
    composite(time){const c=this.config,ctx=this.ctx,w=this.canvas.width,h=this.canvas.height,[fg,bg]=this.palette(),scene=this.scene,history=this.history,post=this.post,postCtx=post.getContext('2d');this.canvas.dataset.renderPalette=`${fg}|${bg}`;postCtx.globalAlpha=1;postCtx.fillStyle=bg;postCtx.fillRect(0,0,w,h);if(c.temporalPersistence>0){postCtx.globalAlpha=clamp(c.temporalPersistence);postCtx.drawImage(history,0,0);postCtx.globalAlpha=1;}postCtx.drawImage(scene,0,0);postCtx.drawImage(this.highlight,0,0);const useWebGL=this.webgl?.ready&&(c.fxPreset==='glitch'||c.fxPreset==='intervals'||c.vignette>0),processed=useWebGL?this.webgl.render(post,c):post;ctx.globalAlpha=1;ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.drawImage(processed,0,0);
      if(c.fxPreset==='beam-sweep'){const pos=((time*.12)%(h*1.3))-h*.15,g=ctx.createLinearGradient(0,pos-h*.08,0,pos+h*.08);g.addColorStop(0,'transparent');g.addColorStop(.5,fg);g.addColorStop(1,'transparent');ctx.globalAlpha=c.fxStrength*.2;ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.globalAlpha=1;}
      if(c.fxPreset==='intervals'&&!useWebGL){ctx.globalAlpha=c.fxStrength*.1;ctx.fillStyle=fg;for(let y=(time*.06)%12;y<h;y+=12)ctx.fillRect(0,y,w,1);ctx.globalAlpha=1;}
      if(c.fxPreset==='glitch'&&Math.sin(time*.011)>.82){ctx.globalAlpha=c.fxStrength*.28;for(let y=0;y<h;y+=37){const shift=smoothNoise(y*.1,time*.0008,c.seed)*18*c.fxStrength;ctx.drawImage(scene,0,y,w,12,shift,y,w,12);}ctx.globalAlpha=1;}
      if(c.vignette>0&&!useWebGL){const g=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.18,w/2,h/2,Math.max(w,h)*.72);g.addColorStop(0,'transparent');g.addColorStop(1,`rgba(0,0,0,${c.vignette})`);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
      if(c.borderGlow>0){ctx.save();ctx.globalAlpha=c.borderGlow*.5;ctx.strokeStyle=fg;ctx.shadowColor=fg;ctx.shadowBlur=24*c.borderGlow;ctx.lineWidth=Math.max(1,3*this.dpr);ctx.strokeRect(1,1,w-2,h-2);ctx.restore();}
      if(c.temporalPersistence>0){const hx=history.getContext('2d');hx.globalAlpha=1;hx.fillStyle=bg;hx.fillRect(0,0,w,h);hx.globalAlpha=.88;hx.drawImage(this.canvas,0,0);hx.globalAlpha=1;}
    }
    draw(time=performance.now(),dt=1/60){if(!this.visible||!this.frame)return;this.physics.update(dt,this.pointer,this.config,this.frame,time);const sctx=this.scene.getContext('2d',{alpha:true}),hctx=this.highlight.getContext('2d',{alpha:true});sctx.clearRect(0,0,this.scene.width,this.scene.height);hctx.clearRect(0,0,this.highlight.width,this.highlight.height);this.renderCells(sctx,time);this.renderHighlights(hctx,time);this.composite(time);}
    start(onStats){if(this.running)return;this.running=true;const loop=time=>{if(!this.running)return;const dt=this.lastTime?Math.min((time-this.lastTime)/1000,.05):1/60,budget=1000/this.targetFps;if(!this.lastDraw||time-this.lastDraw>=budget){const begin=performance.now();this.draw(time,dt);this.lastDraw=time;this.frameCount++;if(time-this.lastFps>=500){this.fps=Math.round(this.frameCount*1000/(time-this.lastFps));this.frameCount=0;this.lastFps=time;onStats?.({fps:this.fps,cells:this.frame?.count||0,frameMs:performance.now()-begin});}const cost=performance.now()-begin;if(cost>42)this.targetFps=Math.max(24,this.targetFps-6);else if(cost<18)this.targetFps=Math.min(60,this.targetFps+2);}this.lastTime=time;this.raf=requestAnimationFrame(loop);};this.raf=requestAnimationFrame(loop);}
    stop(){this.running=false;cancelAnimationFrame(this.raf);}
    destroy(){this.stop();this.observer?.disconnect();this.canvas.removeEventListener('pointermove',this._move);this.canvas.removeEventListener('pointerleave',this._leave);}
  }
  return {AsciiEngine,FrameProcessor,GlyphAtlas,PhysicsField,WebGLPostProcessor,DEFAULTS};
}

export function createRuntimeSource() {
  return `(${createOpenAsciiRuntime.toString()})()`;
}
