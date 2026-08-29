import { createRuntimeSource } from '@openascii/core';

const save = (blob, name) => {
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
};
const safe = value => JSON.stringify(value).replace(/</g, '\\u003c');

export function exportPng(canvas) {
  canvas.toBlob(blob => blob && save(blob, `openascii-${Date.now()}.png`), 'image/png');
}

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export async function exportVideoMp4(config, sourceVideoUrl, width, height, onProgress) {
  if (!sourceVideoUrl) return;

  return new Promise(async (resolve) => {
    const encWidth = Math.floor(width / 2) * 2;
    const encHeight = Math.floor(height / 2) * 2;
    
    const canvas = document.createElement('canvas');
    canvas.width = encWidth;
    canvas.height = encHeight;
    
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.getBoundingClientRect = () => ({
      width: encWidth / dpr,
      height: encHeight / dpr,
      left: 0, top: 0, right: encWidth / dpr, bottom: encHeight / dpr
    });
    
    const video = document.createElement('video');
    video.src = sourceVideoUrl;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    
    let frameDuration = 1 / 30;
    let originalFps = 30;
    
    await new Promise(r => {
      let t1 = -1;
      const callback = (now, meta) => {
        if (t1 === -1) {
          t1 = meta.mediaTime;
          video.requestVideoFrameCallback(callback);
        } else {
          const diff = meta.mediaTime - t1;
          if (diff >= 0.008 && diff <= 0.1) {
            frameDuration = diff;
            originalFps = 1 / diff;
          }
          video.pause();
          r();
        }
      };
      video.onloadeddata = () => {
        video.play().then(() => video.requestVideoFrameCallback(callback)).catch(() => r());
      };
      setTimeout(r, 1000);
    });

    let duration = video.duration;
    if (!duration || !isFinite(duration)) {
      // Workaround for Chrome bug where blob videos report Infinity duration
      video.currentTime = 1e8;
      await new Promise(res => {
        video.addEventListener('seeked', res, { once: true });
        setTimeout(res, 500);
      });
      duration = video.duration;
      video.currentTime = 0;
      await new Promise(res => {
        video.addEventListener('seeked', res, { once: true });
        setTimeout(res, 500);
      });
    }
    if (!duration || !isFinite(duration)) duration = 1;
    
    const totalFrames = Math.round(duration / frameDuration);
    
    const { AsciiEngine } = await import('@openascii/core');
    const engine = new AsciiEngine(canvas, config);
    engine.setSource(video);
    engine.running = true;
    
    // Initialize FFmpeg
    const ffmpeg = new FFmpeg();
    await ffmpeg.load();
    
    let currentFrame = 0;
    
    const processNextFrame = async () => {
      if (currentFrame >= totalFrames) {
        if (onProgress) onProgress(0.99, canvas); // 99% - Encoding now
        
        // Execute FFmpeg to encode the JPEG sequence into an MP4
        await ffmpeg.exec([
          '-framerate', `${originalFps}`,
          '-i', 'frame_%05d.jpg',
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          'output.mp4'
        ]);
        
        // Read the output MP4 file
        const data = await ffmpeg.readFile('output.mp4');
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        save(blob, `openascii-${Date.now()}.mp4`);
        
        engine.destroy();
        resolve();
        return;
      }
      
      const targetTime = (currentFrame * frameDuration) + (frameDuration / 2);
      
      if (Math.abs(video.currentTime - targetTime) > 0.001) {
        await new Promise(r => {
          let timeout;
          const handler = () => { 
            video.removeEventListener('seeked', handler); 
            clearTimeout(timeout);
            r(); 
          };
          video.addEventListener('seeked', handler);
          video.currentTime = targetTime;
          timeout = setTimeout(handler, 500); 
        });
      }
      
      engine.buildFrame(); 
      engine.visible = true; 
      engine.draw(targetTime * 1000, frameDuration);
      
      // Extract the frame as JPEG and write to FFmpeg filesystem
      const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.95));
      const arrayBuffer = await blob.arrayBuffer();
      const frameName = `frame_${currentFrame.toString().padStart(5, '0')}.jpg`;
      await ffmpeg.writeFile(frameName, new Uint8Array(arrayBuffer));
      
      // Use 0-98% for frame extraction progress, leaving 99% for FFmpeg encoding
      if (onProgress) onProgress((currentFrame / totalFrames) * 0.98, canvas);
      
      currentFrame++;
      setTimeout(processNextFrame, 0);
    };
    
    processNextFrame();
  });
}

function exactRuntime(config, sourceUrl, canvasExpression = "document.querySelector('[data-openascii]')") {
  return `
const { AsciiEngine } = ${createRuntimeSource()};
const canvas = ${canvasExpression};
const config = ${safe(config)};
const source = ${safe(sourceUrl)};
const image = new Image();
const engine = new AsciiEngine(canvas, config);
const resizeObserver = new ResizeObserver(() => engine.resize());
resizeObserver.observe(canvas);
image.onload = () => { engine.setSource(image); engine.start(); };
image.src = source;
`;
}

export function createHtmlArtifact(config, source) {
  const runtime = exactRuntime(config, source);
  const background = config.invertColor ? config.foreground : config.background;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>OpenASCII artwork</title>
  <style>
    *{box-sizing:border-box}
    html,body{margin:0;width:100%;height:100%;overflow:hidden;background:${background}}
    canvas{display:block;width:100%;height:100%}
  </style>
</head>
<body>
  <canvas data-openascii aria-label="Interactive ASCII artwork"></canvas>
  <script>${runtime}<\/script>
</body>
</html>`;
}

export function exportHtml(config, sourceUrl, canvas) {
  const source = sourceUrl || canvas.toDataURL('image/png');
  const html = createHtmlArtifact(config, source);
  save(new Blob([html], { type: 'text/html' }), `openascii-interactive-${Date.now()}.html`);
}

export function createReactArtifact(config, source) {
  const runtime = exactRuntime(config, source, 'ref.current');
  return `import { useEffect, useRef } from 'react';

export default function OpenAsciiArt({ className = '', style = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    ${runtime}
    return () => { resizeObserver.disconnect(); engine.destroy(); };
  }, []);
  return <canvas ref={ref} data-openascii className={className} style={{ width: '100%', height: '100%', display: 'block', ...style }} aria-label="Interactive ASCII artwork" />;
}
`;
}

export function exportReact(config, sourceUrl, canvas) {
  const source = sourceUrl || canvas.toDataURL('image/png');
  const jsx = createReactArtifact(config, source);
  save(new Blob([jsx], { type: 'text/javascript' }), `OpenAsciiArt-${Date.now()}.jsx`);
}
