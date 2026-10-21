// =====================================================================
// 画面設計書・キャラ設計書をブラウザで読めるページ (docs/design.html) にまとめる
// ---------------------------------------------------------------------
// node tools/build-design.mjs
// docs/*.md と、ドット絵 (src/presentation/art)・画面イメージ (tools/design/mockups.js) を1つの HTML に入れる。
// 書類か絵を直したら、これを動かして作り直す。
// =====================================================================

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');

// import の行を消し、export を外して、依存の順に並べる (ページの中では1つの関数の中に入る)
const MODULES = [
    'src/presentation/art/pixel.js',
    'src/presentation/art/characters-legacy.js',
    'src/presentation/art/characters.js',
    'src/presentation/art/symbols.js',
    'src/presentation/lcd/kit.js',
    'tools/design/mockups.js'
];
const art = MODULES.map(p => `// ----- ${p} -----\n` + read(p)
    .replace(/^import [^;]*;$/gm, '')
    .replace(/^export (const|function) /gm, '$1 ')).join('\n');

for (const md of ['docs/screen-design.md', 'docs/characters.md']) {
    if (read(md).includes('</script')) throw new Error(`${md} に </script があるとページに入れられません`);
}

// 画面イメージの canvas に描く字 (ページを開いたときに先に読み込む)
const glyphs = [...new Set(art.replace(/\/\/.*$/gm, '').match(/[^\x00-\x7f]/g))].join('').replace(/'/g, '');

const html = read('tools/design/template.html')
    .replace('@@ART@@', () => art)
    .replace('@@GLYPHS@@', () => glyphs + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-!')
    .replace('@@SCREEN@@', () => read('docs/screen-design.md'))
    .replace('@@CHARS@@', () => read('docs/characters.md'));

writeFileSync(join(root, 'docs/design.html'), html);
console.log(`docs/design.html (${Math.round(html.length / 1024)} KB)`);
