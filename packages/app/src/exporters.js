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
