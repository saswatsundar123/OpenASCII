const display=value=>String(value??'').replaceAll('-',' ').toUpperCase();

export function buildEditorMetadata(config={}) {
  return [
    ['FMT','ASCII CANVAS'],
    ['STYLE',display(config.archetypeLabel||config.artStyle||'classic-ascii')],
    ['FONT',display(config.font||'monospace')],
    ['AR',display(config.aspectRatio||'original')],
    ['FX',display(config.fxPreset||'none')],
    ['BG',String(config.background||'#000000').toUpperCase()],
    ['RES',String(config.quality??320)]
  ];
}
