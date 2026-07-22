import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Download, Shuffle, X, Image as ImageIcon, ChevronDown, Check, Sparkles, Gauge, Github, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { AsciiCanvas } from '@openascii/react';
import { useEditor } from './store.js';
import { PRESETS, STYLES } from './presets.js';
import { exportHtml, exportPng, exportReact } from './exporters.js';
import profilePicUrl from '../../../Profile_Pic.jpeg?url';

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
  if(!file||!file.type.startsWith('image/')) return;
  const reader=new FileReader();
  reader.onload=()=>{const img=new Image();img.onload=()=>useEditor.getState().setSource(img,file.name,reader.result);img.src=reader.result;};
  reader.readAsDataURL(file);
}

function Sidebar({onExport,onPresets}) {
  const {config,setConfig}=useEditor(); const update=(key)=>(value)=>setConfig({[key]:value});
  return <aside className="sidebar">
    <div className="sidebar-brand"><div className="wordmark"><span>OPEN</span><strong>ASCII</strong></div><p>ASCII EDITOR FOR ART, MOTION, INTERACTION, AND WEB EXPORTS</p><div className="brand-links"><a href="https://github.com/saswatsundar123/openascii" target="_blank" rel="noreferrer">SOURCE</a><button onClick={onPresets}>PRESETS</button><button onClick={onExport}>EXPORT</button></div></div>
    <div className="sidebar-head"><div><small>PROJECT / 001</small><strong>COMPOSITION</strong></div><span className="live-dot">LIVE</span></div>
    <div className="scroll-panel">
      <Section title="SOURCE" tag="IMAGE">
        <UploadZone compact/>
      </Section>
      <Section title="LAYER 01" tag="ACTIVE">
        <div className="style-grid">{STYLES.map(([id,label])=><Button key={id} active={config.artStyle===id} onClick={()=>setConfig({artStyle:id})}><span className={`glyph glyph-${id}`}>{label.slice(0,2)}</span>{label}</Button>)}</div>
        <Button className="add-layer" disabled>＋ ADD LAYER <span>V2</span></Button>
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
        <Slider label="OPACITY" value={config.opacity} onChange={update('opacity')}/>
      </Section>
      <Section title="GLOBAL FX">
        <Slider label="VIGNETTE" value={config.vignette} onChange={update('vignette')}/>
        <Slider label="BORDER GLOW" value={config.borderGlow} onChange={update('borderGlow')}/>
        <div className="label">COLOR MODE</div><div className="button-row wrap">{[['grayscale','GRAY'],['full-color','FULL'],['matrix-green','MATRIX'],['amber-monitor','AMBER'],['custom','CUSTOM']].map(([id,label])=><Button key={id} active={config.colorMode===id} onClick={()=>setConfig({colorMode:id})}>{label}</Button>)}</div>
        {config.colorMode==='custom'&&<div className="color-row"><label>INK<input type="color" value={config.foreground} onChange={e=>setConfig({foreground:e.target.value})}/></label><label>GROUND<input type="color" value={config.background} onChange={e=>setConfig({background:e.target.value})}/></label></div>}
        <Toggle label="INVERT COLOR" checked={config.invertColor} onChange={update('invertColor')}/>
      </Section>
      <Section title="MOTION FX" tag={config.fxPreset.toUpperCase()}>
        <div className="preset-tabs">{[['none','NONE'],['noise-field','NOISE FIELD'],['intervals','INTERVALS'],['beam-sweep','BEAM SWEEP'],['glitch','GLITCH']].map(([id,label])=><Button key={id} active={config.fxPreset===id} onClick={()=>setConfig({fxPreset:id})}>{label}</Button>)}</div>
        <Slider label="FX STRENGTH" value={config.fxStrength} onChange={update('fxStrength')}/>
        <div className="field"><span>DIRECTION</span><div className="direction-grid">{['ul','up','ur','left','right','dl','down','dr'].map(dir=><Button key={dir} aria-label={dir} active={config.direction===dir} onClick={()=>setConfig({direction:dir})}><Arrow dir={dir}/></Button>)}</div></div>
        <Slider label="NOISE SCALE" value={config.noiseScale} min={1} max={200} step={1} onChange={update('noiseScale')}/>
        <Slider label="NOISE SPEED" value={config.noiseSpeed} min={0} max={2} step={.05} onChange={update('noiseSpeed')}/>
        <Slider label="FRAME PERSISTENCE" value={config.temporalPersistence} min={0} max={.94} step={.01} onChange={update('temporalPersistence')}/>
      </Section>
      <Section title="MOUSE INTERACTION" tag="PRIORITY">
        <div className="segmented interaction-modes"><Button active={config.mouseMode==='attract'} onClick={()=>setConfig({mouseMode:'attract'})}>ATTRACT</Button><Button active={config.mouseMode==='push'} onClick={()=>setConfig({mouseMode:'push'})}>PUSH</Button><Button active={config.mouseMode==='swirl'} onClick={()=>setConfig({mouseMode:'swirl'})}>SWIRL</Button><Button active={config.mouseMode==='ripple'} onClick={()=>setConfig({mouseMode:'ripple'})}>RIPPLE</Button></div>
        <Slider label="HOVER STRENGTH" value={config.hoverStrength} min={0} max={50} step={1} onChange={update('hoverStrength')}/>
        <Slider label="AREA SIZE" value={config.areaSize} min={0} max={500} step={1} suffix=" PX" onChange={update('areaSize')}/>
        <Slider label="SPREAD" value={config.spread} min={.25} max={4} step={.05} suffix="×" onChange={update('spread')}/>
        <Slider label="SPRING" value={config.springStrength} min={4} max={80} step={1} onChange={update('springStrength')}/>
        <Slider label="DAMPING" value={config.damping} min={1} max={20} step={.5} onChange={update('damping')}/>
      </Section>
      <Section title="OUTPUT QUALITY">
        <div className="quality-grid">{[160,240,320,480,640].map(q=><Button key={q} active={config.quality===q} onClick={()=>setConfig({quality:q})}>{q}</Button>)}</div>
        <p className="hint">Higher resolution increases character density and render cost.</p>
      </Section>
    </div>
    <div className="sidebar-actions"><div className="sidebar-meta"><span>FMT <b>CANVAS 2D</b></span><span>STYLE <b>{config.artStyle.toUpperCase()}</b></span><span>FX <b>{config.fxPreset.toUpperCase()}</b></span><span>RES <b>{config.quality}</b></span></div><div className="action-orbs"><Button onClick={onPresets}><Sparkles size={14}/> PRESETS</Button><Button onClick={()=>{const p=PRESETS[Math.floor(Math.random()*PRESETS.length)];useEditor.getState().applyPreset(p);}}><Shuffle size={14}/> RANDOM</Button><Button className="export-button" onClick={onExport}><Download size={14}/> EXPORT</Button></div></div>
  </aside>;
}

function UploadZone({compact=false}) {
  const input=useRef(null);
  return <div className={`upload-zone ${compact?'compact':''}`} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();loadImageFile(e.dataTransfer.files[0]);}} onClick={()=>input.current.click()} role="button" tabIndex="0" onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')input.current.click();}}><input ref={input} type="file" accept="image/png,image/jpeg,image/gif" hidden onChange={e=>loadImageFile(e.target.files[0])}/><ImageIcon size={compact?16:28}/><div><strong>{compact?'REPLACE IMAGE':'DROP AN IMAGE TO BEGIN'}</strong><span>{compact?'JPG / PNG / GIF':'OR CLICK TO BROWSE · LOCAL PROCESSING ONLY'}</span></div></div>;
}

function Modal({title,onClose,children}) { useEffect(()=>{const fn=e=>e.key==='Escape'&&onClose();addEventListener('keydown',fn);return()=>removeEventListener('keydown',fn);},[onClose]); return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal" role="dialog" aria-modal="true"><header><div><small>OPENASCII / OUTPUT</small><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X/></button></header>{children}</div></div>; }
function ExportModal({onClose}) { const {config,sourceUrl}=useEditor();const canvas=()=>document.getElementById('ascii-canvas');return <Modal title="EXPORT COMPOSITION" onClose={onClose}><p className="modal-lead">Your image and configuration stay on this device. Interactive exports include cursor physics and pause when off-screen.</p><div className="export-options"><button onClick={()=>exportHtml(config,sourceUrl,canvas())}><span>01</span><div><strong>INTERACTIVE HTML</strong><small>SELF-CONTAINED · NO DEPENDENCIES</small></div><Download/></button><button onClick={()=>exportReact(config,sourceUrl,canvas())}><span>02</span><div><strong>REACT COMPONENT</strong><small>JSX · PROPS READY</small></div><Download/></button><button onClick={()=>exportPng(canvas())}><span>03</span><div><strong>PNG FRAME</strong><small>CURRENT FRAME · FULL RESOLUTION</small></div><Download/></button></div></Modal>; }
function PresetModal({onClose}) { const apply=useEditor(s=>s.applyPreset);return <Modal title="SELECT A PRESET" onClose={onClose}><div className="preset-list">{PRESETS.map((p,i)=><button key={p.name} onClick={()=>{apply(p);onClose();}}><span>{String(i+1).padStart(2,'0')}</span><div><strong>{p.name}</strong><small>{p.artStyle.replace('-',' ')} / {p.fxPreset.replace('-',' ')}</small></div><ArrowRight/></button>)}</div></Modal>; }

function App() {
  const {config,image,filename,fps,cells,setStats,setSource,setConfig}=useEditor();const [exportOpen,setExportOpen]=useState(false),[presetsOpen,setPresetsOpen]=useState(false),[about,setAbout]=useState(false);
  useEffect(()=>{const img=new Image();img.onload=()=>setSource(img,'Profile_Pic.jpeg',profilePicUrl);img.onerror=()=>{const demo=makeDemo();demo.img.onload=()=>setSource(demo.img,'openascii_demo.png',demo.url);};img.src=profilePicUrl;},[]);
  const ratio=useMemo(()=>({original:'auto','16:9':'16 / 9','4:3':'4 / 3','1:1':'1 / 1','3:4':'3 / 4','9:16':'9 / 16'}[config.aspectRatio]),[config.aspectRatio]);
  const ratioNumber=useMemo(()=>({original:0,'16:9':16/9,'4:3':4/3,'1:1':1,'3:4':3/4,'9:16':9/16}[config.aspectRatio]),[config.aspectRatio]);
  const benchmark=useMemo(()=>new URLSearchParams(location.search).has('benchmark'),[]);
  const cleanBenchmark=useMemo(()=>new URLSearchParams(location.search).has('clean'),[]);
  useEffect(()=>{const style=new URLSearchParams(location.search).get('style');if(style)setConfig({artStyle:style});},[setConfig]);
  if(benchmark)return <main className="benchmark-shell"><AsciiCanvas id="ascii-canvas" image={image} config={config} onStats={setStats}/>{!cleanBenchmark&&<output>{fps} FPS · {cells.toLocaleString()} CELLS</output>}</main>;
  return <div className="app-shell">
    <header className="topbar"><nav><button className="selected">LIBRARY</button><button onClick={()=>setPresetsOpen(true)}>TEMPLATES</button><button onClick={()=>setPresetsOpen(true)}>CREATIONS</button><button className="theme-button" onClick={()=>setAbout(true)} aria-label="About OpenASCII">◐</button></nav><div className="top-actions"><a className="github" href="https://github.com/saswatsundar123/openascii" target="_blank" rel="noreferrer"><Github size={15}/> SOURCE</a><Button className="publish" onClick={()=>setExportOpen(true)}>PUBLISH</Button></div></header>
    <main className="workspace">
      <section className="canvas-stage" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();loadImageFile(e.dataTransfer.files[0]);}}>
        <div className={`canvas-grid ${ratioNumber?'fixed-ratio':''}`} style={{aspectRatio:ratio,'--target-ratio':ratioNumber||1}}><AsciiCanvas id="ascii-canvas" image={image} config={config} onStats={setStats}/><div className="corner c1"/><div className="corner c2"/><div className="corner c3"/><div className="corner c4"/><div className="canvas-label"><span>LIVE OUTPUT</span><b>{String(config.quality).padStart(3,'0')}</b></div></div>
        <div className="canvas-bottom"><div className="render-status"><i/><div><span>RENDER / ACTIVE</span><strong>{filename}</strong></div></div><div className="metrics"><span><b>{fps}</b> FPS</span><span><b>{cells.toLocaleString()}</b> CELLS</span><Button onClick={()=>setConfig({quality:Math.max(160,Math.round(config.quality/2))})}><Gauge size={13}/> REDUCE CHARACTERS</Button></div><div className="ratio-picker">{['ORIGINAL','16:9','4:3','1:1','3:4','9:16'].map(r=><button className={config.aspectRatio===r.toLowerCase()?'active':''} onClick={()=>setConfig({aspectRatio:r.toLowerCase()})} key={r}>{r}</button>)}</div></div>
      </section>
      <Sidebar onExport={()=>setExportOpen(true)} onPresets={()=>setPresetsOpen(true)}/>
    </main>
    {exportOpen&&<ExportModal onClose={()=>setExportOpen(false)}/>} {presetsOpen&&<PresetModal onClose={()=>setPresetsOpen(false)}/>} {about&&<Modal title="ABOUT OPENASCII" onClose={()=>setAbout(false)}><p className="about-copy">OpenASCII is an open-source, browser-native studio for turning images into animated, cursor-reactive ASCII compositions. Every pixel is processed locally. No server, no upload, no paywall.</p><div className="about-stats"><span>09<b>ART STYLES</b></span><span>05<b>MOTION FX</b></span><span>03<b>EXPORT TYPES</b></span></div></Modal>}
  </div>;
}

export default App;
