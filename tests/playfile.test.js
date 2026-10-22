// play.html (ダブルクリックで遊ぶ1つのファイル) のスクリプトが壊れていないかのテスト
// 2026-10-21: 中に入れたスクリプトの「$&」が置きかえの記号として読まれ、途中に </body> が入って真っ白になったことがある
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('play.html の中のスクリプトが、そのまま読める', () => {
    const html = readFileSync(new URL('../play.html', import.meta.url), 'utf8');
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
    assert.ok(scripts.length > 0, 'スクリプトが入っている');
    for (const js of scripts) {
        assert.ok(!js.includes('</body>'), 'スクリプトの途中に </body> がない');
        assert.doesNotThrow(() => new Function(js), 'スクリプトの書き方が正しい');
    }
});
