// =====================================================================
// ダブルクリックで遊べる1つのファイル (play.html) を作る
// ---------------------------------------------------------------------
// node tools/build-file.mjs  (npm run build:file)
// ふつうのビルドはファイルを分けて <script type="module"> で読むので、ファイルを直接開くと読み込みが止められて真っ白になる。
// ここでは、ひとかたまりの (モジュールでない) スクリプトにして、スクリプト・CSS・音を HTML の中に入れる。
// =====================================================================

import { build } from 'vite';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'node_modules', '.play-build');

await build({
    root,
    base: './',
    logLevel: 'warn',
    build: {
        outDir,
        emptyOutDir: true,
        assetsInlineLimit: 100 * 1024 * 1024,
        cssCodeSplit: false,
        modulePreload: false,
        rollupOptions: { output: { format: 'iife', inlineDynamicImports: true } }
    }
});

let html = readFileSync(join(outDir, 'index.html'), 'utf8');
// CSS を中に入れる
html = html.replace(/<link rel="stylesheet"[^>]*href="\.\/([^"]+\.css)"[^>]*>/g, (m, file) =>
    `<style>${readFileSync(join(outDir, file), 'utf8')}</style>`);
// スクリプトを中に入れる (#root ができてから動くように </body> の前へ)
let scripts = '';
html = html.replace(/<script type="module" crossorigin src="\.\/([^"]+\.js)"><\/script>/g, (m, file) => {
    scripts += `<script>${readFileSync(join(outDir, file), 'utf8').replace(/<\/script/gi, '<\\/script')}</script>\n`;
    return '';
});
// 置きかえは関数で渡す (文字列で渡すと、スクリプトの中の「$&」などが置きかえの記号として読まれて壊れる)
html = html.replace('</body>', () => `${scripts}</body>`);
writeFileSync(join(root, 'play.html'), html);
rmSync(outDir, { recursive: true, force: true });
console.log(`play.html (${Math.round(html.length / 1024)} KB)`);
