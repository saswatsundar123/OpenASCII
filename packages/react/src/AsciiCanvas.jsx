import { useEffect, useRef } from 'react';
import { AsciiEngine } from '@openascii/core';
export function AsciiCanvas({ image, config, onStats, className, staticFrame=false, exposeEngine=false, ...props }) {
  const ref=useRef(null), engine=useRef(null);
  useEffect(()=>{engine.current=new AsciiEngine(ref.current,config);if(exposeEngine)ref.current.__openAsciiEngine=engine.current;engine.current.resize();if(!staticFrame)engine.current.start(onStats);const ro=new ResizeObserver(()=>{engine.current?.resize();if(staticFrame)engine.current?.draw(0,1/60);});ro.observe(ref.current);return()=>{ro.disconnect();if(ref.current)delete ref.current.__openAsciiEngine;engine.current?.destroy();};},[]);
  useEffect(()=>engine.current?.setConfig(config),[config]);
  useEffect(()=>{if(image){engine.current?.setSource(image);if(staticFrame)engine.current?.draw(0,1/60);}},[image]);
  return <canvas ref={ref} className={className} {...props}/>;
}
