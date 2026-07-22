import { useEffect, useRef } from 'react';
import { AsciiEngine } from '@openascii/core';
export function AsciiCanvas({ image, config, onStats, className, ...props }) {
  const ref=useRef(null), engine=useRef(null);
  useEffect(()=>{engine.current=new AsciiEngine(ref.current,config);engine.current.start(onStats);const ro=new ResizeObserver(()=>engine.current?.resize());ro.observe(ref.current);return()=>{ro.disconnect();engine.current?.destroy();};},[]);
  useEffect(()=>engine.current?.setConfig(config),[config]);
  useEffect(()=>{if(image)engine.current?.setSource(image);},[image]);
  return <canvas ref={ref} className={className} {...props}/>;
}
