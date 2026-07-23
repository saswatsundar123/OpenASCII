import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { DEFAULT_CONFIG } from '../packages/core/src/index.js';
import { createHtmlArtifact } from '../packages/app/src/exporters.js';
import { PRESETS } from '../packages/app/src/presets.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const image = await readFile(new URL('../internal_dev/Profile_Pic.jpeg', import.meta.url));
const source = `data:image/jpeg;base64,${image.toString('base64')}`;
const config = { ...DEFAULT_CONFIG, ...PRESETS[0], aspectRatio: '1:1', quality: 320 };
const html = createHtmlArtifact(config, source);
await mkdir(new URL('../examples/', import.meta.url), { recursive: true });
const output = new URL('../examples/Profile_OpenASCII.html', import.meta.url);
await writeFile(output, html, 'utf8');
console.log(`Generated ${fileURLToPath(output)} (${html.length.toLocaleString()} bytes)`);
