export function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function adjust(value, brightness = 0, contrast = 1) {
  return Math.max(0, Math.min(255, (value - 128) * contrast + 128 + (brightness - 50) * 2.55));
}

export function dither(values, width, height, algorithm = 'none', strength = 0) {
  const result = new Float32Array(values);
  if (algorithm === 'none' || strength <= 0) return result;
  if (algorithm === 'ordered') {
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = y * width + x;
      result[i] = Math.max(0, Math.min(255, result[i] + (bayer[(y % 4) * 4 + x % 4] - 7.5) * 8 * strength));
    }
    return result;
  }
  const atkinson = [[1,0,1/8],[2,0,1/8],[-1,1,1/8],[0,1,1/8],[1,1,1/8],[0,2,1/8]];
  const floyd = [[1,0,7/16],[-1,1,3/16],[0,1,5/16],[1,1,1/16]];
  const matrix = algorithm === 'atkinson' ? atkinson : floyd;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    const next = result[i] < 128 ? 0 : 255;
    const error = (result[i] - next) * strength;
    result[i] = next;
    for (const [dx, dy, factor] of matrix) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < width && ny < height) result[ny * width + nx] += error * factor;
    }
  }
  return result;
}
