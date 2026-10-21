// 図鑑・実績・記録のテスト (node --test tests/)
// 演出側の部品だが、絵を描かない部分 (イベントから数えるところ) だけを確かめる
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollection, ACHIEVEMENTS } from '../src/presentation/collection/collection.js';
import { CHARACTERS } from '../src/presentation/art/characters.js';
import { PROFILES } from '../src/presentation/collection/profiles.js';
import { createMachine, REEL_LENGTH } from '../src/logic/index.js';
import { createRng } from '../src/logic/rng.js';

const char = id => CHARACTERS.find(c => c.id === id);

test('こおりくんは最初から、仲間は会ったら、敵は倒したら説明が見られる', () => {
    const c = createCollection({ storage: false });
    assert.ok(c.isUnlocked(char('koori')));
    assert.ok(!c.isUnlocked(char('yasu')));
    c.record({ type: 'at:start', games: 50, cause: 'bonus' });
    assert.ok(c.isUnlocked(char('yasu')));
    c.record({ type: 'zencho:start', team: 'ask3', games: 30, cause: 'zone' });
    assert.ok(!c.isUnlocked(char('asahara')), '会っただけでは解禁しない');
    c.record({ type: 'zencho:battle', round: 3, of: 3, final: true, win: true, button: 'red' });
    assert.ok(c.isUnlocked(char('asahara')));
    c.record({ type: 'at:boss', boss: 'maou', final: false, win: null });
    assert.ok(!c.isUnlocked(char('maou')));
    c.record({ type: 'at:boss', boss: 'maou', final: true, win: true });
    assert.ok(c.isUnlocked(char('maou')));
});

test('実績は条件を満たしたときに1回だけ知らせる', () => {
    const c = createCollection({ storage: false });
    const got = [];
    c.onAchievement(a => got.push(a.id));
    c.record({ type: 'at:start', games: 50, cause: 'direct' });
    c.record({ type: 'at:start', games: 50, cause: 'direct' });
    assert.deepEqual(got.filter(id => id === 'firstAt'), ['firstAt']);
    c.record({ type: 'at:end', games: 80, payout: 1200, hint: 'team', trophy: 'rainbow' });
    assert.ok(got.includes('coins1000'));
    assert.ok(got.includes('rainbow'));
    assert.equal(c.data.trophies.rainbow, 1);
});

test('すべてのキャラクターに説明文があり、実績の id は重ならない', () => {
    for (const ch of CHARACTERS) assert.ok(PROFILES[ch.id] && PROFILES[ch.id].text, ch.id);
    assert.equal(new Set(ACHIEVEMENTS.map(a => a.id)).size, ACHIEVEMENTS.length);
});

test('仮組の台を長く回して図鑑に数えても止まらない。AT の終わりにトロフィーの色か null が来る', () => {
    // 設定6 は今の数値だと AT がほとんど終わらない (docs/sim_result.md) ので設定1で回す (2026-10-21 内部処理側で変更)
    const m = createMachine({ setting: 1, seed: 77 });
    const rng = createRng(3);
    const c = createCollection({ storage: false });
    const trophies = [];
    m.on(e => {
        c.record(e);
        if (e.type === 'at:end') trophies.push(e.trophy);
    });
    for (let i = 0; i < 30000; i++) {
        m.lever();
        [0, 1, 2].forEach(r => m.stop(r, rng.int(0, REEL_LENGTH - 1)));
    }
    assert.ok(trophies.length > 0);
    assert.ok(trophies.every(t => t === null || ['white', 'blue', 'green', 'purple', 'red', 'rainbow'].includes(t)));
    assert.equal(c.data.counts.games, 30000);
});
