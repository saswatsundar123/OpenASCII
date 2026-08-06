import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Download, Shuffle, X, Image as ImageIcon, ChevronDown, Check, Sparkles, Gauge, Github, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Undo2, Save, Maximize2, Minimize2, Play, Pause } from 'lucide-react';
import { AsciiCanvas } from '@openascii/react';
import { useEditor, saveConfig } from './store.js';
import { PRESETS, STYLES, createProceduralPreset } from './presets.js';
import { exportHtml, exportPng, exportReact } from './exporters.js';
import { resolveOutputRatio } from './aspect-ratio.js';
import { buildEditorMetadata } from './editor-metadata.js';
import { createGenerationContext } from './preset-generator.js';


const COLOR_OPTIONS = [
  {id:'grayscale',label:'GRAY',foreground:'#f5f5f1',background:'#060708',accent:'#ffffff'},
  {id:'full-color',label:'SAMPLED',foreground:'#f7f0dc',background:'#030504',accent:'#77e8ff'},
  {id:'matrix-green',label:'MATRIX',foreground:'#36e66a',background:'#020a04',accent:'#d8ff57'},
  {id:'amber-monitor',label:'AMBER',foreground:'#ff8a19',background:'#080400',accent:'#ffe4a6'},
  {id:'cyanotype',label:'CYAN',foreground:'#4fe4ff',background:'#02070c',accent:'#f2fcff'},
  {id:'phosphor',label:'PHOSPHOR',foreground:'#c7cf7a',background:'#080a05',accent:'#f3ffd0'},
  {id:'ice-white',label:'ICE',foreground:'#f7fbff',background:'#02060c',accent:'#a8d7ff'},
  {id:'palette-gradient',label:'PALETTE',foreground:'#ff7c21',background:'#090300',accent:'#ffd35a'},
  {id:'custom',label:'CUSTOM',foreground:'#ff4fd8',background:'#07020d',accent:'#62f4ff'}
];
const colorPatch = mode => { const option=COLOR_OPTIONS.find(item=>item.id===mode)||COLOR_OPTIONS[0];return {colorMode:option.id,foreground:option.foreground,background:option.background,accent:option.accent}; };


const Arrow = ({dir}) => {
  const Icon={up:ArrowUp,down:ArrowDown,left:ArrowLeft,right:ArrowRight,ul:ArrowUp,ur:ArrowUp,dl:ArrowDown,dr:ArrowDown}[dir];
  return <Icon size={14} style={{transform:dir.endsWith('l')?'rotate(-45deg)':dir.endsWith('r')?'rotate(45deg)':'none'}}/>;
};

function Button({children,active=false,className='',...props}) { return <button className={`button ${active?'is-active':''} ${className}`} {...props}>{children}</button>; }
function Section({title,tag,children,open=true}) { const [expanded,setExpanded]=useState(open); return <section className="section"><button className="section-title" onClick={()=>setExpanded(v=>!v)}><span>{title}</span>{tag&&<em>{tag}</em>}<ChevronDown size={14} className={expanded?'rotated':''}/></button>{expanded&&<div className="section-content">{children}</div>}</section>; }
function Slider({label,value,min=0,max=1,step=.01,onChange,suffix=''}) { return <label className="field slider-field"><span>{label}</span><output>{typeof value==='number'&&step<1?value.toFixed(step<.1?2:1):value}{suffix}</output><input aria-label={label} type="range" value={value} min={min} max={max} step={step} onChange={e=>onChange(Number(e.target.value))}/></label>; }
function Select({label,value,options,onChange}) { return <label className="field"><span>{label}</span><div className="select-wrap"><select value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option value={Array.isArray(o)?o[0]:o} key={Array.isArray(o)?o[0]:o}>{Array.isArray(o)?o[1]:o}</option>)}</select><ChevronDown size={13}/></div></label>; }
function Toggle({label,checked,onChange}) { return <label className="toggle-row"><span>{label}</span><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/><i aria-hidden="true"><b><Check size={11}/></b></i></label>; }

function makeDemo() {
  const c=document.createElement('canvas');c.width=1000;c.height=760;const x=c.getContext('2d');
  const g=x.createRadialGradient(510,330,40,510,360,520);g.addColorStop(0,'#dde4d6');g.addColorStop(.35,'#697268');g.addColorStop(1,'#111511');x.fillStyle=g;x.fillRect(0,0,c.width,c.height);
  x.fillStyle='#111';x.beginPath();x.arc(510,355,230,0,Math.PI*2);x.fill();x.fillStyle='#bfc9ba';x.beginPath();x.arc(510,330,196,0,Math.PI*2);x.fill();
  x.fillStyle='#252b24';x.beginPath();x.ellipse(440,300,35,22,0,0,Math.PI*2);x.ellipse(580,300,35,22,0,0,Math.PI*2);x.fill();
  x.strokeStyle='#30382f';x.lineWidth=18;x.lineCap='round';x.beginPath();x.moveTo(465,425);x.quadraticCurveTo(510,452,558,420);x.stroke();
  x.fillStyle='#0d100d';x.fillRect(0,610,1000,150);x.font='700 42px monospace';x.fillStyle='#c6ff3d';x.fillText('OPENASCII',56,690);
  const url=c.toDataURL('image/png'),img=new Image();img.src=url;return {img,url};
}

function loadImageFile(file) {
  if(!file) return;
  if(file.type.startsWith('image/') && file.type !== 'image/gif') {
    useEditor.getState().setLoading(true);
    const reader=new FileReader();
    reader.onload=()=>{const img=new Image();img.onload=()=>useEditor.getState().setSource(img,file.name,reader.result);img.onerror=()=>useEditor.getState().setLoading(false);img.src=reader.result;};
    reader.onerror=()=>useEditor.getState().setLoading(false);
    reader.readAsDataURL(file);
  } else if (file.type.startsWith('video/')) {
    useEditor.getState().setLoading(true);
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.style.display = 'none';
    document.body.appendChild(video);
    video.onloadeddata = () => {
      video.play().catch(() => {});
      useEditor.getState().setSource(video, file.name, url);
    };
    video.onerror = () => useEditor.getState().setLoading(false);
    video.src = url;
    video.load();
  }
}

function VideoTimeline({ video }) {
  const [playing, setPlaying] = useState(!video.paused);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    let raf;
    const update = () => {
      if(video.duration) setProgress(video.currentTime / video.duration);
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [video]);

  useEffect(() => {
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [video]);

  const toggle = () => {
    if (video.paused) video.play().catch(()=>{});
    else video.pause();
  };

  const onSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pos * video.duration;
    const engine = document.getElementById('ascii-canvas')?.__openAsciiEngine;
    if (engine && video.paused) {
      engine.buildFrame();
      engine.draw(performance.now(), 1/60);
    }
  };

  return (
    <div className="video-timeline">
      <button className="play-button" onClick={toggle}>
        {playing ? <Pause size={14}/> : <Play size={14}/>}
      </button>
      <div className="timeline-track" onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onSeek(e);
      }} onPointerMove={(e) => {
        if(e.buttons === 1) onSeek(e);
      }}>
        <div className="timeline-fill" style={{width: `${progress * 100}%`}}/>
      </div>
    </div>
  );
}

function Sidebar({onExport,onPresets}) {
  const {config,setConfig,randomizeStyle}=useEditor(); const update=(key)=>(value)=>setConfig({[key]:value}),metadata=buildEditorMetadata(config);
  return <aside className="sidebar">
    <div className="sidebar-brand"><div className="wordmark"><span>OPEN</span><strong>ASCII</strong></div><p>ASCII EDITOR FOR ART, MOTION, INTERACTION, AND WEB EXPORTS</p><div className="brand-links"><a href="https://github.com/saswatsundar123/openascii" target="_blank" rel="noreferrer"><Github size={12}/> SOURCE</a><button onClick={onPresets}>PRESETS</button><button onClick={onExport}>EXPORT</button></div></div>
    <div className="sidebar-head"><div><small>PROJECT / 001</small><strong>COMPOSITION</strong></div><span className="live-dot">LIVE</span></div>
    <div className="scroll-panel">
      <Section title="SOURCE" tag="IMAGE">
        <UploadZone compact/>
      </Section>
      <Section title="LAYER 01" tag="ACTIVE">
        <div className="style-grid">{STYLES.map(([id,label])=><Button key={id} active={config.artStyle===id} onClick={()=>setConfig({artStyle:id})}><span className={`glyph glyph-${id}`}>{label.slice(0,2)}</span>{label}</Button>)}</div>
        <Button className="add-layer" disabled>＋ ADD LAYER <span>V2</span></Button>
      </Section>
      <Section title="COMPOSITION MIX" tag={config.secondaryStyle==='none'?'SINGLE':'HYBRID'} open={false}>
        <Select label="TONE PROFILE" value={config.toneProfile} onChange={update('toneProfile')} options={[['source','SOURCE'],['inverse','INVERSE'],['edge','EDGE LED'],['duotone','DUOTONE']]}/>
        <Select label="DENSITY PROFILE" value={config.densityProfile} onChange={update('densityProfile')} options={[['continuous','CONTINUOUS'],['threshold','THRESHOLD'],['bands','TONAL BANDS'],['structure','STRUCTURE']]}/>
        <Slider label="DENSITY THRESHOLD" value={config.densityThreshold} min={0} max={1} step={.02} onChange={update('densityThreshold')}/>
        <Slider label="STRUCTURE MIX" value={config.structureMix} min={0} max={1} step={.02} onChange={update('structureMix')}/>
        <Select label="SECONDARY STYLE" value={config.secondaryStyle} onChange={update('secondaryStyle')} options={[['none','NONE'],...STYLES]}/>
        <Slider label="SECONDARY MIX" value={config.secondaryMix} min={0} max={1} step={.02} onChange={update('secondaryMix')}/>
        <Select label="SECONDARY REGION" value={config.secondaryRegion} onChange={update('secondaryRegion')} options={[['detail','DETAIL'],['edge','EDGES'],['highlight','HIGHLIGHTS'],['shadow','SHADOWS']]}/>
      </Section>
      <Section title="CHARACTER SYSTEM">
        <Select label="FONT" value={config.font} onChange={update('font')} options={['Space Mono','Courier New','monospace','Inter','Arial']}/>
        <Select label="CHARACTER SET" value={config.characterSet} onChange={update('characterSet')} options={[['detailed','DETAILED'],['simple','SIMPLE'],['binary','BINARY'],['blocks','BLOCKS'],['katakana','KATAKANA'],['custom','CUSTOM']]}/>
        {config.characterSet==='custom'&&<label className="field"><span>CUSTOM CHARACTERS</span><input className="text-input" value={config.customCharacters} placeholder="@#*:. " onChange={e=>setConfig({customCharacters:e.target.value})}/></label>}
        <Select label="DITHER" value={config.ditherAlgorithm} onChange={update('ditherAlgorithm')} options={[['floyd-steinberg','FLOYD–STEINBERG'],['atkinson','ATKINSON'],['bayer','BAYER 4×4'],['blue-noise','BLUE NOISE'],['none','NONE']]}/>
        <Slider label="BRIGHTNESS" value={config.brightness} min={0} max={100} step={1} onChange={update('brightness')}/>
        <Slider label="CONTRAST" value={config.contrast} min={0} max={4} step={.05} onChange={update('contrast')}/>
        <Slider label="GAMMA" value={config.gamma} min={.35} max={2.4} step={.05} onChange={update('gamma')}/>
        <Slider label="LOCAL CONTRAST" value={config.localContrast} min={0} max={2} step={.05} onChange={update('localContrast')}/>
        <Slider label="EDGE DETAIL" value={config.edgeEnhance} min={0} max={2} step={.05} onChange={update('edgeEnhance')}/>
        <Slider label="SALIENCY DETAIL" value={config.saliencyDetail} min={0} max={2} step={.05} onChange={update('saliencyDetail')}/>
        <Slider label="DITHER STRENGTH" value={config.ditherStrength} onChange={update('ditherStrength')}/>
        <Slider label="INVERSE DITHER" value={config.inverseDither} onChange={update('inverseDither')}/>
        <Slider label="FONT SIZE" value={config.fontSize} min={4} max={32} step={1} suffix=" PX" onChange={update('fontSize')}/>
        <Slider label="CHARACTER SPACING" value={config.characterSpacing} min={.8} max={2} step={.05} suffix="×" onChange={update('characterSpacing')}/>
        <Slider label="RENDER DENSITY" value={config.densityScale} min={.55} max={1.5} step={.05} suffix="×" onChange={update('densityScale')}/>
        <Select label="PRIMITIVE" value={config.primitiveShape} onChange={update('primitiveShape')} options={[['circle','CIRCLE'],['square','SQUARE'],['ring','RING'],['slash','SLASH'],['diamond','DIAMOND']]}/>
        <Slider label="PRIMITIVE WEIGHT" value={config.primitiveThickness} min={.4} max={2} step={.05} onChange={update('primitiveThickness')}/>
        {config.artStyle==='particles'&&<><Slider label="PARTICLE VARIATION" value={config.particleVariation} min={0} max={1} step={.05} onChange={update('particleVariation')}/><Slider label="PARTICLE JITTER" value={config.particleJitter} min={0} max={.5} step={.01} onChange={update('particleJitter')}/><Slider label="PARTICLE DEPTH" value={config.particleDepth} min={0} max={1} step={.05} onChange={update('particleDepth')}/></>}
        {config.artStyle==='line'&&<><Select label="LINE SYSTEM" value={config.lineSystem} onChange={update('lineSystem')} options={[['scan','SCAN FIELD'],['flow','FLOW FIELD'],['contour','CONTOUR']]}/><Slider label="LINE DIRECTION" value={config.lineDirection} min={-90} max={90} step={1} suffix="°" onChange={update('lineDirection')}/><Slider label="CONTOUR FOLLOW" value={config.lineContour} min={0} max={1} step={.05} onChange={update('lineContour')}/><Slider label="STROKE LENGTH" value={config.lineLength} min={.35} max={1.65} step={.05} suffix="×" onChange={update('lineLength')}/><Slider label="LINE VARIATION" value={config.lineVariation} min={0} max={1} step={.05} onChange={update('lineVariation')}/><Slider label="CROSS DETAIL" value={config.lineSecondary} min={0} max={1} step={.05} onChange={update('lineSecondary')}/></>}
        <Slider label="OPACITY" value={config.opacity} onChange={update('opacity')}/>
      </Section>
      <Section title="GLOBAL FX">
        <Slider label="VIGNETTE" value={config.vignette} onChange={update('vignette')}/>
        <Slider label="BORDER GLOW" value={config.borderGlow} onChange={update('borderGlow')}/>
        <Slider label="GLOW ACCUMULATION" value={config.glowStrength} min={0} max={1} step={.05} onChange={update('glowStrength')}/>
        <Select label="BACKGROUND" value={config.backgroundStyle} onChange={update('backgroundStyle')} options={[['solid','SOLID'],['gradient','GRADIENT'],['grid','GRID']]}/>
        <div className="label">COLOR MODE</div><div className="button-row wrap color-modes">{COLOR_OPTIONS.map(option=><Button key={option.id} active={config.colorMode===option.id} onClick={()=>setConfig(option.id==='custom'&&config.colorMode==='custom'?{colorMode:'custom'}:colorPatch(option.id))}><i className="color-swatch" style={{'--swatch-bg':option.background,'--swatch-fg':option.foreground,'--swatch-accent':option.accent}}/>{option.label}</Button>)}</div>
        <div className="color-row color-row-three"><label>INK<input aria-label="Ink color" type="color" value={config.foreground} onChange={e=>setConfig({foreground:e.target.value})}/></label><label>GROUND<input aria-label="Ground color" type="color" value={config.background} onChange={e=>setConfig({background:e.target.value})}/></label><label>ACCENT<input aria-label="Accent color" type="color" value={config.accent} onChange={e=>setConfig({accent:e.target.value})}/></label></div>
        <Slider label={config.colorMode==='full-color'?'SOURCE COLOR':'TONAL RANGE'} value={config.colorMix} min={0} max={1} step={.05} onChange={update('colorMix')}/>
        <Slider label="SATURATION" value={config.colorSaturation} min={0} max={2} step={.05} onChange={update('colorSaturation')}/>
        <Slider label="PALETTE BIAS" value={config.paletteBias} min={-1} max={1} step={.05} onChange={update('paletteBias')}/>
        <Slider label="HIGHLIGHT COLOR" value={config.highlightBoost} min={0} max={1} step={.05} onChange={update('highlightBoost')}/>
        <Toggle label="INVERT COLOR" checked={config.invertColor} onChange={update('invertColor')}/>
      </Section>
      <Section title="MOTION FX" tag={config.fxPreset.toUpperCase()}>
        <div className="preset-tabs">{[['none','NONE'],['noise-field','NOISE FIELD'],['intervals','INTERVALS'],['beam-sweep','BEAM SWEEP'],['glitch','GLITCH'],['crt','CRT']].map(([id,label])=><Button key={id} active={config.fxPreset===id} onClick={()=>setConfig({fxPreset:id})}>{label}</Button>)}</div>
        <Slider label="FX STRENGTH" value={config.fxStrength} onChange={update('fxStrength')}/>
        <div className="field"><span>DIRECTION</span><div className="direction-grid">{['ul','up','ur','left','right','dl','down','dr'].map(dir=><Button key={dir} aria-label={dir} active={config.direction===dir} onClick={()=>setConfig({direction:dir})}><Arrow dir={dir}/></Button>)}</div></div>
        <Slider label="NOISE SCALE" value={config.noiseScale} min={1} max={200} step={1} onChange={update('noiseScale')}/>
        <Slider label="NOISE SPEED" value={config.noiseSpeed} min={0} max={2} step={.05} onChange={update('noiseSpeed')}/>
        <Slider label="ANIMATED NOISE" value={config.noiseOpacity} min={0} max={.18} step={.01} onChange={update('noiseOpacity')}/>
        <Slider label="FRAME PERSISTENCE" value={config.temporalPersistence} min={0} max={.94} step={.01} onChange={update('temporalPersistence')}/>
        <Slider label="PHOSPHOR DECAY" value={config.phosphorDecay} min={0} max={.94} step={.01} onChange={update('phosphorDecay')}/>
        <Slider label="GHOST STRENGTH" value={config.ghostStrength} min={0} max={.28} step={.01} onChange={update('ghostStrength')}/>
        <Slider label="GHOST FRAMES" value={config.ghostFrames} min={0} max={3} step={1} onChange={update('ghostFrames')}/>
        <Slider label="GHOST SPACING" value={config.ghostSpacing} min={1} max={8} step={1} onChange={update('ghostSpacing')}/>
      </Section>
      <Section title="MOUSE INTERACTION" tag="PRIORITY">
        <div className="segmented interaction-modes"><Button active={config.mouseMode==='attract'} onClick={()=>setConfig({mouseMode:'attract'})}>ATTRACT</Button><Button active={config.mouseMode==='push'} onClick={()=>setConfig({mouseMode:'push'})}>PUSH</Button><Button active={config.mouseMode==='swirl'} onClick={()=>setConfig({mouseMode:'swirl'})}>SWIRL</Button><Button active={config.mouseMode==='ripple'} onClick={()=>setConfig({mouseMode:'ripple'})}>RIPPLE</Button></div>
        <Slider label="HOVER STRENGTH" value={config.hoverStrength} min={0} max={50} step={1} onChange={update('hoverStrength')}/>
        <Slider label="AREA SIZE" value={config.areaSize} min={0} max={500} step={1} suffix=" PX" onChange={update('areaSize')}/>
        <Slider label="SPREAD" value={config.spread} min={.25} max={4} step={.05} suffix="×" onChange={update('spread')}/>
        <Slider label="SPRING" value={config.springStrength} min={4} max={80} step={1} onChange={update('springStrength')}/>
        <Slider label="DAMPING" value={config.damping} min={1} max={20} step={.5} onChange={update('damping')}/>
        <Slider label="CLICK SENSITIVITY" value={config.clickSensitivity} min={0} max={3} step={.05} onChange={update('clickSensitivity')}/>
        <Slider label="CLICK RETURN" value={config.clickReturn} min={.08} max={1} step={.02} onChange={update('clickReturn')}/>
        <Slider label="CLICK DAMPING" value={config.clickDamping} min={.15} max={1} step={.02} onChange={update('clickDamping')}/>
        <p className="hint interaction-hint">PRESS THE CANVAS TO REPEL THE ENTIRE FIELD. RELEASE TO LET THE SPRINGS SETTLE.</p>
      </Section>
      <Section title="OUTPUT QUALITY">
        <div className="quality-grid">{[160,240,320,480,640].map(q=><Button key={q} active={config.quality===q} onClick={()=>setConfig({quality:q})}>{q}</Button>)}</div>
        <p className="hint">Higher resolution increases character density and render cost.</p>
      </Section>
    </div>
    <div className="sidebar-actions"><div className="sidebar-meta">{metadata.map(([label,value])=><span key={label}>{label} <b>{value}</b></span>)}</div><div className="action-orbs"><Button onClick={onPresets} data-tip="Browse presets"><Sparkles size={14}/> PRESETS</Button><Button onClick={()=>randomizeStyle(Date.now())} data-tip="Randomize style"><Shuffle size={14}/> RANDOM</Button><Button className="export-button" onClick={onExport} data-tip="Export composition"><Download size={14}/> EXPORT</Button></div></div>
  </aside>;
}

function UploadZone({compact=false}) {
  const input=useRef(null);
  return <div className={`upload-zone ${compact?'compact':''}`} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();loadImageFile(e.dataTransfer.files[0]);}} onClick={()=>input.current.click()} role="button" tabIndex="0" onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')input.current.click();}}><input ref={input} type="file" accept="image/png,image/jpeg,video/mp4,video/webm" hidden onChange={e=>loadImageFile(e.target.files[0])}/><ImageIcon size={compact?16:28}/><div><strong>{compact?'REPLACE IMAGE':'DROP AN IMAGE TO BEGIN'}</strong><span>{compact?'JPG / PNG / MP4 / WEBM':'OR CLICK TO BROWSE · LOCAL PROCESSING ONLY'}</span></div></div>;
}

function Modal({title,onClose,children}) { useEffect(()=>{const fn=e=>e.key==='Escape'&&onClose();addEventListener('keydown',fn);return()=>removeEventListener('keydown',fn);},[onClose]); return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal" role="dialog" aria-modal="true"><header><div><small>OPENASCII / OUTPUT</small><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X/></button></header>{children}</div></div>; }
function ExportModal({onClose}) { 
  const {config,sourceUrl,image}=useEditor();
  const canvas=()=>document.getElementById('ascii-canvas');
  const isVideo = image?.tagName === 'VIDEO';
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);

  const [fps, setFps] = useState(30);

  if (isVideo) {
    return <Modal title="EXPORT MP4" onClose={!recording ? onClose : undefined}>
      <p className="modal-lead">Exporting a native MP4 file frame-by-frame. You can watch the render progress below.</p>
      
      {recording ? (
        <div className="export-progress">
          <canvas id="export-preview" style={{width: '100%', height: 'auto', background: '#000', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)'}} />
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="progress-text">RENDERING VIDEO... {Math.round(progress * 100)}%</div>
        </div>
      ) : (
        <div className="export-options">
          <button onClick={async () => {
            setRecording(true);
            setProgress(0);
            const { exportVideoMp4 } = await import('./exporters.js');
            const c = canvas();
            await exportVideoMp4(config, sourceUrl || image.src, c.width, c.height, (prog, frameCanvas) => {
              setProgress(prog);
              const prev = document.getElementById('export-preview');
              if (prev && frameCanvas) {
                if (prev.width !== frameCanvas.width) prev.width = frameCanvas.width;
                if (prev.height !== frameCanvas.height) prev.height = frameCanvas.height;
                prev.getContext('2d').drawImage(frameCanvas, 0, 0);
              }
            });
            setRecording(false);
            onClose();
          }} disabled={recording}>
            <span>01</span>
            <div>
              <strong>START RENDER</strong>
              <small>NATIVE MP4 FORMAT · FRAME-BY-FRAME</small>
            </div>
            <Download/>
          </button>
        </div>
      )}
    </Modal>;
  }

  return <Modal title="EXPORT COMPOSITION" onClose={onClose}><p className="modal-lead">Your image and configuration stay on this device. Interactive exports include cursor physics and pause when off-screen.</p><div className="export-options"><button onClick={()=>exportHtml(config,sourceUrl,canvas())}><span>01</span><div><strong>INTERACTIVE HTML</strong><small>SELF-CONTAINED · NO DEPENDENCIES</small></div><Download/></button><button onClick={()=>exportReact(config,sourceUrl,canvas())}><span>02</span><div><strong>REACT COMPONENT</strong><small>JSX · PROPS READY</small></div><Download/></button><button onClick={()=>exportPng(canvas())}><span>03</span><div><strong>PNG FRAME</strong><small>CURRENT FRAME · FULL RESOLUTION</small></div><Download/></button></div></Modal>; 
}
function PresetModal({onClose}) { const apply=useEditor(s=>s.applyPreset);return <Modal title="SELECT A PRESET" onClose={onClose}><div className="preset-list">{PRESETS.map((p,i)=><button key={p.name} onClick={()=>{apply(p);onClose();}}><span>{String(i+1).padStart(2,'0')}</span><div><strong>{p.name}</strong><small>{p.artStyle.replace('-',' ')} / {p.fxPreset.replace('-',' ')}</small></div><ArrowRight/></button>)}</div></Modal>; }

function App() {
  const {config,image,filename,fps,cells,setStats,setSource,setConfig,undo,past,loading}=useEditor();const [exportOpen,setExportOpen]=useState(false),[presetsOpen,setPresetsOpen]=useState(false),[about,setAbout]=useState(false),[saved,setSaved]=useState(false),[fullscreen,setFullscreen]=useState(false);
  useEffect(()=>{const demo=makeDemo();demo.img.onload=()=>setSource(demo.img,'openascii_demo.png',demo.url);},[setSource]);
  useEffect(()=>{const fn=e=>{if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undo();}};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn);},[undo]);
  useEffect(()=>{const onChange=()=>setFullscreen(!!document.fullscreenElement);document.addEventListener('fullscreenchange',onChange);return()=>document.removeEventListener('fullscreenchange',onChange);},[]);
  function handleSave(){saveConfig(config);setSaved(true);setTimeout(()=>setSaved(false),1600);}
  function toggleFullscreen(){fullscreen?document.exitFullscreen():document.documentElement.requestFullscreen();}
  const ratioNumber=useMemo(()=>resolveOutputRatio(config.aspectRatio,image),[config.aspectRatio,image]);
  const benchmark=useMemo(()=>new URLSearchParams(location.search).has('benchmark'),[]);
  const cleanBenchmark=useMemo(()=>new URLSearchParams(location.search).has('clean'),[]);
  const captureBenchmark=useMemo(()=>new URLSearchParams(location.search).has('capture'),[]);
  useEffect(()=>{const params=new URLSearchParams(location.search),style=params.get('style'),preset=params.get('preset'),system=params.get('system'),color=params.get('color'),line=params.get('line'),direction=params.get('lineDirection'),weight=params.get('lineWeight'),length=params.get('lineLength'),history=params.getAll('history');if(preset!==null){const current=useEditor.getState().config,context=createGenerationContext(current,history);useEditor.getState().applyPreset(createProceduralPreset(Number(preset),context));}if(system!==null&&PRESETS[Number(system)])useEditor.getState().applyPreset(PRESETS[Number(system)]);if(style)setConfig({artStyle:style});if(color)setConfig(colorPatch(color));if(line)setConfig({artStyle:'line',lineSystem:line});if(direction!==null)setConfig({lineDirection:Number(direction)});if(weight!==null)setConfig({primitiveThickness:Number(weight)});if(length!==null)setConfig({lineLength:Number(length)});},[setConfig]);
  if(benchmark)return <main className="benchmark-shell"><AsciiCanvas id="ascii-canvas" image={image} config={config} onStats={setStats} staticFrame={captureBenchmark} exposeEngine/>{!cleanBenchmark&&<output>{fps} FPS · {cells.toLocaleString()} CELLS</output>}</main>;
  return <div className="app-shell">
    <header className="topbar"><nav><button className="theme-button" onClick={()=>setAbout(true)} aria-label="About OpenASCII" data-tip="About OpenASCII">◐</button></nav><div className="top-actions"><Button onClick={undo} disabled={!past.length} data-tip="Undo last change (Ctrl+Z)"><Undo2 size={13}/> UNDO</Button><Button onClick={handleSave} className={saved?'is-active':''} data-tip="Save settings to browser"><Save size={13}/> {saved?'SAVED':'SAVE'}</Button><Button onClick={toggleFullscreen} data-tip={fullscreen?'Exit fullscreen (F)':'Fullscreen (F)'}>{fullscreen?<Minimize2 size={13}/>:<Maximize2 size={13}/>} {fullscreen?'EXIT':'EXPAND'}</Button></div></header>
    <main className="workspace">
      <section className="canvas-stage" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();loadImageFile(e.dataTransfer.files[0]);}}>
        <div className="canvas-grid fixed-ratio" style={{'--target-ratio':ratioNumber}}><AsciiCanvas id="ascii-canvas" image={image} config={config} onStats={setStats} style={{ transform: 'translateZ(0)', willChange: 'transform' }} exposeEngine/>{loading&&<div className="canvas-loading" aria-label="Loading image"><div className="canvas-spinner"/><span>PROCESSING</span></div>}<div className="corner c1"/><div className="corner c2"/><div className="corner c3"/><div className="corner c4"/><div className="canvas-label"><span>LIVE OUTPUT</span><b>{String(config.quality).padStart(3,'0')}</b></div></div>
        {image?.tagName==='VIDEO'&&<VideoTimeline video={image}/>}
        <div className="canvas-bottom"><div className="render-status"><i/><div><span>RENDER / ACTIVE</span><strong>{filename}</strong></div></div><div className="metrics"><span><b>{fps}</b> FPS</span><span><b>{cells.toLocaleString()}</b> CELLS</span><Button onClick={()=>setConfig({quality:Math.max(160,Math.round(config.quality/2))})}><Gauge size={13}/> REDUCE CHARACTERS</Button></div><div className="ratio-picker">{['ORIGINAL','16:9','4:3','1:1','3:4','9:16'].map(r=><button className={config.aspectRatio===r.toLowerCase()?'active':''} onClick={()=>setConfig({aspectRatio:r.toLowerCase()})} key={r}>{r}</button>)}</div></div>
      </section>
      <Sidebar onExport={()=>setExportOpen(true)} onPresets={()=>setPresetsOpen(true)}/>
    </main>
    {exportOpen&&<ExportModal onClose={()=>setExportOpen(false)}/>} {presetsOpen&&<PresetModal onClose={()=>setPresetsOpen(false)}/>} {about&&<Modal title="ABOUT OPENASCII" onClose={()=>setAbout(false)}><p className="about-copy">OpenASCII is an open-source, browser-native studio for turning images into animated, cursor-reactive ASCII compositions. Every pixel is processed locally. No server, no upload, no paywall.</p><div className="about-stats"><span>09<b>ART STYLES</b></span><span>05<b>MOTION FX</b></span><span>03<b>EXPORT TYPES</b></span></div></Modal>}
  </div>;
}

export default App;
