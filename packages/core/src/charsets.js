export const CHARSETS = {
  detailed: '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^. ',
  simple: '@%#*+=-:. ',
  binary: '10 ',
  blocks: '█▓▒░ ',
  katakana: 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓ'
};

export function getCharset(name, custom = '') {
  if (name === 'custom' && custom.trim()) return custom;
  return CHARSETS[name] || CHARSETS.detailed;
}
