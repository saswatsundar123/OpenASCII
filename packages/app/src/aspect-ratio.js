const FIXED_RATIOS = Object.freeze({
  '16:9':16/9,
  '4:3':4/3,
  '1:1':1,
  '3:4':3/4,
  '9:16':9/16
});

export function resolveOutputRatio(selection='original',source) {
  if(FIXED_RATIOS[selection]) return FIXED_RATIOS[selection];
  const width=source?.naturalWidth||source?.videoWidth||source?.width||0;
  const height=source?.naturalHeight||source?.videoHeight||source?.height||0;
  return width>0&&height>0?width/height:1;
}
