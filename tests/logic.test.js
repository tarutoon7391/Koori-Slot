// 内部処理のテスト (node --test tests/)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMachine, EVENTS, REEL_LENGTH, STRIPS } from '../src/logic/index.js';
import { CONFIG } from '../src/logic/config.js';
import { SHAPES, LEFT_WINDOW, combosFor, createReelControl, bellShape, kooriGaseShape } from '../src/logic/reelControl.js';
import { BONUS_SYMBOLS, gridAt, lineWin } from '../src/logic/reels.js';
import { createRng } from '../src/logic/rng.js';

const ORDERS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
const RARE_SHAPES = ['weakCherry', 'strongCherry', 'midCherry', 'weakSuika', 'strongSuikaA', 'strongSuikaB', 'chanceA', 'chanceB'];
const isBonus = sym => BONUS_SYMBOLS.has(sym);
const sumOf = table => Object.values(table).reduce((a, b) => a + b, 0);
const near = (x, y) => Math.abs(x - y) < 1e-9;

// 設定を一部だけ変えた台
function machineWith(patch, opts = {}) {
    const config = structuredClone(CONFIG);
    patch(config);
    return createMachine({ config, ...opts });
}

// 1ゲーム回す (押す位置はでたらめ。order を渡さなければ押し順もでたらめ)
function play(m, rng, order = null) {
    assert.ok(m.lever());
    (order || rng.pick(ORDERS)).forEach(reel => m.stop(reel, rng.int(0, REEL_LENGTH - 1)));
}

// ----- 出目の形・リール制御 -----

test('どの出目の形も、どこを押しても作れる (ガセ狙え・ベルこぼしを含む)', () => {
    const rng = createRng(1);
    for (const shape of Object.keys(SHAPES)) {
        assert.ok(combosFor(shape).length > 0, shape);
        for (let i = 0; i < 200; i++) {
            const ctrl = createReelControl(shape);
            rng.pick(ORDERS).forEach(reel => ctrl.stop(reel, rng.int(0, 20)));
            assert.ok(SHAPES[shape](gridAt(ctrl.tops), ctrl.tops), shape);
        }
    }
});

test('リプレイ・ボーナスは中段に、ベルは右下がりにそろう (エピソードBIG はこおりくん揃い)', () => {
    for (const [shape, win] of [['bell', 'bell'], ['replay', 'replay'], ['big', 'big'], ['reg', 'reg'], ['epbig', 'koori'], ['koori', 'koori']]) {
        const ctrl = createReelControl(shape);
        [0, 1, 2].forEach(reel => ctrl.stop(reel, 7));
        assert.equal(lineWin(gridAt(ctrl.tops)), win);
    }
});

test('リール配列 v1.0 の図柄数 (BAR/7/こおりくん: 左各1・中各2・右各2、チェリー: 左3・中0・右0、スイカ各3、ベル各6、リプレイ各6)', () => {
    const count = (reel, sym) => STRIPS[reel].filter(x => x === sym).length;
    assert.equal(REEL_LENGTH, 21);
    for (const reel of [0, 1, 2]) {
        assert.equal(STRIPS[reel].length, 21);
        for (const sym of ['bar', 'seven', 'koori']) assert.equal(count(reel, sym), reel === 0 ? 1 : 2, `${sym} ${reel}`);
        assert.equal(count(reel, 'cherry'), reel === 0 ? 3 : 0);
        assert.equal(count(reel, 'suika'), 3);
        assert.equal(count(reel, 'bell'), 6);
        assert.equal(count(reel, 'replay'), 6);
    }
});

test('仕様書「レア役の停止形」は全部の形について作れる。kooriGase と bellMiss も', () => {
    for (const shape of [...RARE_SHAPES, 'kooriGase', 'kooriGaseJun', 'kooriGaseHasami', 'kooriGaseNaka', 'bellMiss']) {
        assert.ok(combosFor(shape).length > 0, shape);
    }
});

test('中段チェリーは中段にボーナス図柄が一直線にならない。強チェリーは中リール中段がボーナス図柄にならない', () => {
    for (const tops of combosFor('midCherry')) {
        const cols = gridAt(tops);
        assert.ok(!cols.every(col => isBonus(col[1])), `中段チェリー ${tops}`);
        assert.equal(lineWin(cols), null);
    }
    for (const tops of combosFor('strongCherry')) {
        const cols = gridAt(tops);
        assert.ok(!isBonus(cols[1][1]), `強チェリー ${tops}`);
    }
});

test('チャンス目A はベルの小V で、中段は入賞しない', () => {
    const rng = createRng(3);
    for (let i = 0; i < 100; i++) {
        const ctrl = createReelControl('chanceA');
        [0, 1, 2].forEach(reel => ctrl.stop(reel, rng.int(0, 20)));
        const cols = gridAt(ctrl.tops);
        assert.equal(cols[0][0], 'bell');
        assert.equal(cols[1][1], 'bell');
        assert.equal(cols[2][0], 'bell');
        assert.equal(lineWin(cols), null);
    }
});

test('ガセ「狙え」: 中押しでは中リール中段にこおりくんが来ない。はさみ押しでは左右がテンパイしない。どの押し順でも揃わない', () => {
    const rng = createRng(12);
    for (const order of ORDERS) {
        for (let i = 0; i < 300; i++) {
            const ctrl = createReelControl(kooriGaseShape);
            order.forEach(reel => ctrl.stop(reel, rng.int(0, 20)));
            const cols = gridAt(ctrl.tops);
            assert.notEqual(lineWin(cols), 'koori', `揃った ${order}`);
            if (order[0] === 1) {
                assert.notEqual(cols[1][1], 'koori', `中押しで中リール中段がこおりくん ${order}`);
                assert.ok(!cols.some(col => col.includes('koori')), `中押しで枠内にこおりくん ${order}`);
            }
            if (order[0] === 0 && order[1] === 2) {
                assert.ok(!(cols[0][1] === 'koori' && cols[2][1] === 'koori'), `はさみ押しでテンパイ ${order}`);
                assert.equal(cols[2][2], 'koori', 'はさみ押しは右下段にこおりくん');
            }
            if (order[0] === 0 && order[1] === 1) {
                assert.equal(cols[0][1], 'koori');
                assert.equal(cols[1][1], 'koori', '順押しは中リールまでテンパイ');
                assert.equal(cols[2][2], 'koori', '順押しは右下段で外す');
            }
        }
    }
});

test('押し順ベルの形: 正解の順なら右下がりベル揃い、外れた時点でベルこぼし (右下がりテンパイハズレ)。第1停止がどこでもこぼし目が作れる', () => {
    const rng = createRng(21);
    const navs = [[1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    // 'bell' の形で第1停止したあと (中段ベル) でも、こぼし目が作れること
    for (let reel = 0; reel < 3; reel++) {
        for (const top of new Set(combosFor('bell').map(t => t[reel]))) {
            assert.ok(combosFor('bellMiss').some(t => t[reel] === top), `こぼし目が作れない: リール ${reel} 位置 ${top}`);
        }
    }
    for (const nav of navs) {
        for (const order of ORDERS) {
            for (let i = 0; i < 60; i++) {
                const ctrl = createReelControl(bellShape(nav));
                order.forEach(reel => ctrl.stop(reel, rng.int(0, 20)));
                const cols = gridAt(ctrl.tops);
                const correct = order.every((r, k) => r === nav[k]);
                if (correct) assert.equal(lineWin(cols), 'bell', `正解 ${nav} ${order}`);
                else {
                    assert.equal(lineWin(cols), null, `不正解で入賞 ${nav} ${order}`);
                    assert.equal([cols[0][0], cols[1][1], cols[2][2]].filter(x => x === 'bell').length, 2, `右下がりテンパイハズレ ${nav} ${order}`);
                    assert.deepEqual([cols[0][0], cols[0][1], isBonus(cols[0][2])], ['bell', 'replay', true], 'こぼし目の左はベル／リプレイ／ボーナス図柄');
                }
            }
        }
    }
    // 順押しナビは押し順不問
    assert.equal(bellShape([0, 1, 2]), 'bell');
});

// ----- config の検算 -----

test('config.js の振り分け表の合計は 100', () => {
    for (const [mode, m] of Object.entries(CONFIG.modes)) assert.ok(near(sumOf(m.zones), 100), `zones ${mode}`);
    for (const [mode, t] of Object.entries(CONFIG.modeMove)) assert.ok(near(sumOf(t), 100), `modeMove ${mode}`);
    for (const [mode, t] of Object.entries(CONFIG.bonusSplit)) assert.ok(near(sumOf(t), 100), `bonusSplit ${mode}`);
    assert.ok(near(sumOf(CONFIG.initialMode), 100));
    assert.ok(near(sumOf(CONFIG.stockSplit), 100));
    assert.ok(near(sumOf(CONFIG.at.state), 100));
    assert.ok(near(sumOf(CONFIG.tokka.contTable), 100));
    for (const [role, t] of Object.entries(CONFIG.tokka.addTable)) assert.ok(near(sumOf(t), 100), `addTable ${role}`);
    for (const [role, t] of Object.entries(CONFIG.at.directAdd)) assert.ok(near(sumOf(t), 100), `directAdd ${role}`);
    for (const key of ['team', 'rounds', 'cutin', 'nerae', 'button', 'boss']) {
        for (const [side, t] of Object.entries(CONFIG.show[key])) assert.ok(near(sumOf(t), 100), `show.${key}.${side}`);
    }
    for (const [setting, t] of Object.entries(CONFIG.show.hint)) assert.ok(near(sumOf(t), 100), `hint ${setting}`);
    // 役の表: 出現率の合計が 1 を超えない (残りがハズレ)
    for (const [name, t] of Object.entries(CONFIG.roles)) {
        const sum = Object.values(t).filter(x => x > 0).reduce((a, x) => a + 1 / x, 0);
        assert.ok(sum < 1, `roles.${name} の合計 ${sum}`);
    }
    // AT 中のレア役抽選: ボーナス + 特化ゾーンが 100 を超えない
    for (const state of ['low', 'high', 'super']) {
        for (const role of Object.keys(CONFIG.at.bonusRate[state])) {
            assert.ok(CONFIG.at.bonusRate[state][role] + CONFIG.tokka.rate[state][role] <= 100, `${state} ${role}`);
        }
    }
});

test('ボーナス中の AT 当選率は BIG 約40%・REG 約20% (roles.bonus で検算)', () => {
    const t = CONFIG.roles.bonus;
    let p = 0;
    for (const [role, rate] of Object.entries(CONFIG.bonusAt)) p += (1 / t[role]) * (rate / 100);
    const big = 1 - (1 - p) ** CONFIG.bonusGames.big;
    const reg = 1 - (1 - p) ** CONFIG.bonusGames.reg;
    assert.ok(big > 0.38 && big < 0.44, `BIG ${big}`);
    assert.ok(reg > 0.17 && reg < 0.23, `REG ${reg}`);
});

// ----- 通常時 -----

test('通常時を長く回しても止まらず、前兆・ボーナス・AT・特化ゾーン・ガセ狙えが起きる', () => {
    const m = createMachine({ setting: 1, seed: 42 });
    const rng = createRng(7);
    const count = {};
    let gase = 0;
    m.on(e => {
        count[e.type] = (count[e.type] || 0) + 1;
        if (e.type === EVENTS.BONUS_NERAE && !e.win) gase++;
    });
    for (let i = 0; i < 60000; i++) play(m, rng);
    for (const type of [EVENTS.ZENCHO_START, EVENTS.ZENCHO_END, EVENTS.BONUS_START, EVENTS.BONUS_END, EVENTS.STAGE, EVENTS.ZONE, EVENTS.AT_START, EVENTS.AT_END, EVENTS.TOKKA_START, EVENTS.TOKKA_END, EVENTS.AT_BOSS]) {
        assert.ok(count[type] > 0, `${type} が起きない`);
    }
    assert.ok(gase > 0, 'ガセ狙えが起きない');
    // 前兆は必ず終わる (AT 中に AT が終わったときはラストジャッジで終わる)
    assert.ok(Math.abs(count[EVENTS.ZENCHO_START] - count[EVENTS.ZENCHO_END] - (count[EVENTS.AT_JUDGE] || 0)) <= 1);
});

test('前兆の最後のバトルは、本物なら勝ち・ガセなら負け', () => {
    for (const real of [true, false]) {
        const m = createMachine({ seed: 3 });
        const rng = createRng(5);
        let final = null;
        let end = null;
        m.on(e => {
            if (e.type === EVENTS.ZENCHO_BATTLE && e.final) final = e;
            if (e.type === EVENTS.ZENCHO_END && !end) end = e;
        });
        m.debug.setGames(5);
        m.debug.startZencho({ real, length: 6 });
        for (let i = 0; i < 6; i++) {
            m.debug.setNextRole('none');
            play(m, rng);
        }
        assert.equal(final.win, real);
        assert.equal(end.win, real);
    }
});

test('天井はちょうどの G で当たり、ナイナイなら BIG・アルアルならエピソードBIG', () => {
    const m = createMachine({ seed: 9 });
    const rng = createRng(2);
    let standby = null;
    let tenjo = false;
    m.on(e => {
        if (e.type === EVENTS.TENJO) tenjo = e;
        if (e.type === EVENTS.BONUS_STANDBY && !standby) standby = e;
    });
    m.debug.ceilingSoon();
    for (let i = 0; i < 10 && !standby; i++) {
        m.debug.setNextRole('none');
        play(m, rng);
    }
    assert.ok(tenjo);
    assert.equal(standby.bonus, tenjo.who === 'aruaru' ? 'epbig' : 'big');
    assert.equal(tenjo.bonus, standby.bonus);
});

test('AT 直撃 (デバッグ) で AT が始まり、出目はチャンス目A の小V', () => {
    const m = createMachine({ seed: 11 });
    const rng = createRng(4);
    let start = null;
    let end = null;
    m.on(e => {
        if (e.type === EVENTS.AT_START) start = e;
        if (e.type === EVENTS.GAME_END && !end) end = e;
    });
    m.debug.direct();
    play(m, rng);
    assert.equal(start.cause, 'direct');
    // 直撃のゲームはチャンス目A (ベルの小V)。リプレイ扱い
    assert.deepEqual([end.cols[0][0], end.cols[1][1], end.cols[2][0]], ['bell', 'bell', 'bell']);
    assert.equal(end.win, 'replay');
    assert.equal(m.snapshot().phase, 'at');
});

test('game:end の win: チェリー・スイカは役で、チャンス目はリプレイ扱い。共通ベルは押し順不問で 15枚', () => {
    for (const [role, win, payout] of [['weakCherry', 'cherry', 2], ['strongSuika', 'suika', 5], ['chance', 'replay', 0], ['commonBell', 'bell', 15]]) {
        const m = createMachine({ seed: 21 });
        const rng = createRng(1);
        let end = null;
        m.on(e => { if (e.type === EVENTS.GAME_END) end = e; });
        m.debug.setNextRole(role);
        play(m, rng, [0, 1, 2]);
        assert.equal(end.win, win, role);
        assert.equal(end.payout, payout, role);
        if (role === 'chance') assert.ok(m.snapshot().free, 'チャンス目は次のゲームが無料');
    }
});

test('通常時の押し順ベルはナビなしで正解 1/4 (正解なら 15枚・右下がりベル揃い、不正解なら 0枚・ベルこぼし目)', () => {
    const m = createMachine({ seed: 31 });
    const rng = createRng(31);
    let hit = 0;
    let miss = 0;
    const n = 2000;
    m.on(e => {
        if (e.type !== EVENTS.GAME_END) return;
        if (e.win === 'bell') {
            hit++;
            assert.equal(e.payout, 15);
        } else {
            miss++;
            assert.equal(e.payout, 0);
            assert.equal(e.win, null);
            assert.equal([e.cols[0][0], e.cols[1][1], e.cols[2][2]].filter(x => x === 'bell').length, 2, 'こぼし目');
        }
    });
    for (let i = 0; i < n; i++) {
        if (m.snapshot().phase !== 'normal') break;
        m.debug.setNextRole('bell');
        play(m, rng, [0, 1, 2]);   // 順押しは必ず不正解
    }
    assert.equal(hit, 0, '順押しでは当たらない');
    assert.ok(miss > 0);
    // 中押し・右押しの4択からでたらめに押せば約 1/4 で正解
    const m2 = createMachine({ seed: 32 });
    const rng2 = createRng(32);
    let hit2 = 0;
    let total = 0;
    m2.on(e => { if (e.type === EVENTS.GAME_END) { total++; if (e.win === 'bell') hit2++; } });
    for (let i = 0; i < n && m2.snapshot().phase === 'normal'; i++) {
        m2.debug.setNextRole('bell');
        play(m2, rng2, rng2.pick(ORDERS.filter(o => o[0] !== 0)));
    }
    assert.ok(hit2 / total > 0.18 && hit2 / total < 0.32, `正解率 ${hit2 / total}`);
});

// ----- AT -----

test('AT 中の押し順ベル: ナビどおりなら 15枚、違う押し順なら 0枚でベルこぼし目。順押しナビのときは押し順不問で 15枚', () => {
    const rng = createRng(6);
    // ナビどおり / 外し
    for (const follow of [true, false]) {
        const m = createMachine({ seed: 5 });
        let nav = null;
        let end = null;
        m.on(e => {
            if (e.type === EVENTS.AT_GAME) nav = e.nav;
            if (e.type === EVENTS.GAME_END) end = e;
        });
        m.debug.direct();
        play(m, rng);
        for (let i = 0; i < 30; i++) {
            m.debug.setNextRole('bell');
            assert.ok(m.lever());
            assert.ok(nav && nav[0] !== 0, 'ふだんのナビは中押し・右押し');
            const order = follow ? nav : [nav[1], nav[0], nav[2]];
            order.forEach(reel => m.stop(reel, rng.int(0, 20)));
            if (follow) {
                assert.equal(end.win, 'bell');
                assert.equal(end.payout, 15);
            } else {
                assert.equal(end.win, null);
                assert.equal(end.payout, 0);
                assert.equal([end.cols[0][0], end.cols[1][1], end.cols[2][2]].filter(x => x === 'bell').length, 2);
            }
            if (m.snapshot().phase !== 'at') break;
        }
    }
    // 順押しナビ (特化ゾーン当選) は押し順不問
    const m = machineWith(c => { c.at.bellTokka = 100; }, { seed: 8 });
    const log = [];
    m.on(e => log.push(e));
    m.debug.direct();
    play(m, rng);
    m.debug.setNextRole('bell');
    assert.ok(m.lever());
    const atGame = log.filter(e => e.type === EVENTS.AT_GAME).pop();
    assert.deepEqual(atGame.nav, [0, 1, 2]);
    [2, 0, 1].forEach(reel => m.stop(reel, rng.int(0, 20)));
    const end = log.filter(e => e.type === EVENTS.GAME_END).pop();
    assert.equal(end.win, 'bell');
    assert.equal(end.payout, 15);
    assert.ok(log.some(e => e.type === EVENTS.TOKKA_STOCK), '順押しナビのゲームの終わりに特化ゾーンのストック');
});

test('AT のナビは中押し・右押しの4択。順押しナビは特化ゾーンのストックにつながる', () => {
    const m = createMachine({ seed: 5 });
    const rng = createRng(6);
    const navs = [];
    m.on(e => { if (e.type === EVENTS.AT_GAME && e.nav) navs.push(e.nav); });
    m.debug.direct();
    play(m, rng);
    for (let i = 0; i < 3000 && m.snapshot().phase !== 'normal'; i++) {
        if (m.snapshot().phase === 'at') m.debug.setNextRole('bell');
        play(m, rng);
    }
    assert.ok(navs.length > 0);
    for (const nav of navs) {
        if (nav[0] === 0) assert.deepEqual(nav, [0, 1, 2]);
        else assert.ok([1, 2].includes(nav[0]));
    }
});

test('AT 突入時にステートを抽選し (低確 50%・高確 40%・超高確 10%)、AT 中も移行・転落する', () => {
    const rng = createRng(13);
    const states = { low: 0, high: 0, super: 0 };
    for (let seed = 1; seed <= 300; seed++) {
        const m = createMachine({ seed });
        m.debug.direct();
        play(m, rng);
        states[m.debug.internal().state]++;
    }
    assert.ok(states.low > 100 && states.high > 70 && states.super > 10, JSON.stringify(states));
    // 移行: AT 中に低確で強チェリーを引く (ボーナスに当たらなければ 100% で高確へ)
    const m = machineWith(c => { c.at.bonusRate.low.strongCherry = 0; c.tokka.rate.low.strongCherry = 0; }, { seed: 2 });
    m.debug.direct();
    play(m, rng);
    m.debug.setState('low');
    m.debug.setNextRole('strongCherry');
    play(m, rng);
    assert.equal(m.debug.internal().state, 'high');
    // 転落: 保障のあと、ハズレで低確へ (転落率 100% にして確かめる)
    const m2 = machineWith(c => { c.stateFall.high.fall = 100; c.stateFall.high.guard = 2; }, { seed: 2 });
    m2.debug.setGames(5);   // 0G のゾーンの前兆 (本前兆中は 50% で転落) と重ならないように
    m2.debug.direct();
    play(m2, rng);
    m2.debug.setState('high');
    for (let i = 0; i < 2; i++) { m2.debug.setNextRole('none'); play(m2, rng); }
    assert.equal(m2.debug.internal().state, 'high', '保障中は転落しない');
    m2.debug.setNextRole('none');
    play(m2, rng);
    assert.equal(m2.debug.internal().state, 'low');
});

test('AT 中のレア役はステート別の表で「ボーナス／特化ゾーン／直接上乗せ」のどれか1つに決まる', () => {
    const rng = createRng(17);
    const counts = { bonus: 0, tokka: 0, add: 0, miss: 0 };
    for (let seed = 1; seed <= 400; seed++) {
        const m = createMachine({ seed });
        m.debug.setGames(5);   // 0G のゾーンの前兆と重ならないように
        m.debug.direct();
        play(m, rng);
        m.debug.setState('super');
        const log = [];
        m.on(e => log.push(e.type));
        m.debug.setNextRole('strongCherry');
        play(m, rng);
        const z = m.debug.internal().zencho;
        const bonus = Boolean(z && z.real);
        const tokka = log.includes(EVENTS.TOKKA_STOCK);
        const add = log.includes(EVENTS.AT_ADD);
        const miss = log.includes(EVENTS.AT_MISS);
        assert.equal([bonus, tokka, add || miss].filter(Boolean).length, 1, `重複 ${log.join(',')}`);
        if (bonus) counts.bonus++;
        else if (tokka) counts.tokka++;
        else if (add) counts.add++;
        else counts.miss++;
    }
    // 超高確の強チェリーは 50%/50% なので直接上乗せは起きない
    assert.equal(counts.add + counts.miss, 0, JSON.stringify(counts));
    assert.ok(counts.bonus > 120 && counts.tokka > 120, JSON.stringify(counts));
});

test('特化ゾーン: ストック → 始まり → 3G ずつのセット → 終わり。上乗せは AT の残りに足され、AT のゲーム数は減らない', () => {
    for (let seed = 1; seed <= 30; seed++) {
        const m = createMachine({ seed });
        const rng = createRng(seed);
        const log = [];
        m.on(e => { if (e.type.startsWith('tokka:') || e.type === EVENTS.AT_GAME) log.push(e); });
        m.debug.direct();
        play(m, rng);
        m.debug.tokka();
        play(m, rng);   // このゲームの終わりで告知して、次から特化ゾーン
        let guard = 0;
        while (!log.some(e => e.type === EVENTS.TOKKA_END) && guard++ < 500) play(m, rng);
        const types = log.map(e => e.type);
        assert.ok(types.indexOf(EVENTS.TOKKA_STOCK) < types.indexOf(EVENTS.TOKKA_START), 'ストックのあとに始まる');
        const start = types.indexOf(EVENTS.TOKKA_START);
        const end = types.indexOf(EVENTS.TOKKA_END);
        const inside = log.slice(start + 1, end);
        assert.ok(!inside.some(e => e.type === EVENTS.AT_GAME), '特化ゾーンのあいだに AT のゲームがある');
        const games = inside.filter(e => e.type === EVENTS.TOKKA_GAME);
        const sets = inside.filter(e => e.type === EVENTS.TOKKA_SET);
        assert.equal(games.length, sets.length * 3, '1セット3G');
        assert.ok(games.every(g => g.add >= 5), '毎ゲーム 5G 以上');
        assert.ok(sets.slice(0, -1).every(x => x.cont) && !sets[sets.length - 1].cont, '最後のセットだけ続かない');
        const total = games.reduce((a, g) => a + g.add, 0);
        assert.equal(log[end].total, total);
    }
});

test('特化ゾーン中のボーナス当選は、特化ゾーンが終わったあと前兆 (cause: stock) を走らせて当たる', () => {
    const rng = createRng(19);
    const m = machineWith(c => {
        c.at.bonusRate.low.midCherry = 100;
        c.tokka.rate.low.midCherry = 0;
        c.tokka.contTable = { 0: 100 };
    }, { seed: 4 });
    const log = [];
    m.on(e => log.push(e));
    m.debug.setGames(5);   // 0G のゾーンの前兆と重ならないように
    m.debug.direct();
    play(m, rng);
    m.debug.setState('low');
    m.debug.tokka();
    play(m, rng);
    // 特化ゾーンの1ゲーム目で中段チェリー (ボーナス確定)。中段チェリーは次の2セットの継続が確定
    m.debug.setNextRole('midCherry');
    play(m, rng);
    assert.ok(m.debug.internal().tokka, '特化ゾーン中');
    assert.equal(m.debug.internal().tokkaBonus.length, 1, '特化ゾーン中のボーナスは別に持つ');
    assert.ok(!log.some(e => e.type === EVENTS.ZENCHO_START), '特化ゾーン中は前兆が走らない');
    let guard = 0;
    while (!log.some(e => e.type === EVENTS.TOKKA_END) && guard++ < 100) { m.debug.setNextRole('none'); play(m, rng); }
    const endIndex = log.findIndex(e => e.type === EVENTS.TOKKA_END);
    const zencho = log.find((e, i) => i > endIndex && e.type === EVENTS.ZENCHO_START);
    assert.ok(zencho, '特化ゾーンの終わりで前兆');
    assert.equal(zencho.cause, 'stock');
    assert.equal(log.indexOf(zencho), endIndex + 1, 'tokka:end の直後に zencho:start');
    guard = 0;
    while (!log.some(e => e.type === EVENTS.BONUS_STANDBY) && guard++ < 100) { m.debug.setNextRole('none'); play(m, rng); }
    const standby = log.find(e => e.type === EVENTS.BONUS_STANDBY);
    assert.ok(standby, '前兆の終わりでボーナス');
    assert.equal(log.find(e => e.type === EVENTS.ZENCHO_END).win, true);
    play(m, rng);
    assert.equal(log.find(e => e.type === EVENTS.BONUS_START).inAt, true, 'AT 中のボーナス扱い');
});

// ----- 疑似ボーナス -----

test('ボーナス中: 押し順ベルに bonus:game の nav が付き、順押しナビは AT 当選のときだけ。当選は 狙え → こおりくん揃い', () => {
    const rng = createRng(23);
    let hot = 0;
    let normal = 0;
    for (let seed = 1; seed <= 40; seed++) {
        const m = createMachine({ seed });
        const log = [];
        m.on(e => log.push(e));
        m.debug.bonus('big');
        let guard = 0;
        while (!log.some(e => e.type === EVENTS.BONUS_END) && guard++ < 100) {
            assert.ok(m.lever());
            const game = log.filter(e => e.type === EVENTS.BONUS_GAME).pop();
            const nav = game && game.nav;
            (nav || rng.pick(ORDERS)).forEach(reel => m.stop(reel, rng.int(0, 20)));
            if (nav) {
                const end = log[log.length - 1].type === EVENTS.GAME_END ? log[log.length - 1] : log.filter(e => e.type === EVENTS.GAME_END).pop();
                assert.equal(end.payout, 15, 'ナビどおりなら 15枚');
                if (nav[0] === 0) {
                    hot++;
                    assert.equal(end.win, 'bell', '順押しナビのゲームはベル揃い (狙えは次のゲーム)');
                } else normal++;
            }
        }
        const nerae = log.filter(e => e.type === EVENTS.BONUS_NERAE && e.win);
        assert.ok(nerae.length <= 1, '当選の狙えは1回');
        if (nerae.length) {
            const i = log.indexOf(nerae[0]);
            const align = log.find((e, k) => k > i && e.type === EVENTS.GAME_END);
            assert.equal(align.win, 'koori');
            assert.equal(log.find(e => e.type === EVENTS.BONUS_END).at, true);
        }
    }
    assert.ok(normal > 0 && hot > 0, `順押しナビ ${hot} ふつうのナビ ${normal}`);
});

test('ガセ「狙え」: 中押しで中リール中段がこおりくんになるのは当選のときだけ。ガセは揃わず、当選は揃う', () => {
    const rng = createRng(29);
    let gase = 0;
    let real = 0;
    for (let seed = 1; seed <= 60; seed++) {
        const m = machineWith(c => { c.show.neraeGase = 1 / 8; }, { seed });
        const log = [];
        m.on(e => log.push(e));
        m.debug.bonus('big');
        let guard = 0;
        while (!log.some(e => e.type === EVENTS.BONUS_END) && guard++ < 100) {
            assert.ok(m.lever());
            const nerae = log[log.length - 1].type === EVENTS.BONUS_GAME && log[log.length - 2].type === EVENTS.BONUS_NERAE ? log[log.length - 2] : null;
            // 中押し
            [1, 0, 2].forEach(reel => m.stop(reel, rng.int(0, 20)));
            const end = log[log.length - 1].type === EVENTS.GAME_END ? log[log.length - 1] : log.filter(e => e.type === EVENTS.GAME_END).pop();
            if (nerae && nerae.win) {
                real++;
                assert.equal(end.cols[1][1], 'koori', '当選は中リール中段にこおりくん');
                assert.equal(end.win, 'koori');
            } else if (nerae) {
                gase++;
                assert.notEqual(end.cols[1][1], 'koori', 'ガセは中リール中段にこおりくんが来ない');
                assert.notEqual(end.win, 'koori');
                assert.equal(end.payout, 0);
            } else {
                assert.ok(!(end.cols[1][1] === 'koori' && end.win === 'koori'), '狙えなしで揃わない');
            }
        }
    }
    assert.ok(gase > 0 && real > 0, `ガセ ${gase} 当選 ${real}`);
});

test('ガセ「狙え」の色は青・緑・赤・金だけ (虹は当選のときだけ)', () => {
    const rng = createRng(37);
    const colors = { real: new Set(), gase: new Set() };
    for (let seed = 1; seed <= 80; seed++) {
        const m = machineWith(c => { c.show.neraeGase = 1 / 5; }, { seed });
        m.on(e => { if (e.type === EVENTS.BONUS_NERAE) colors[e.win ? 'real' : 'gase'].add(e.color); });
        m.debug.bonus('big');
        for (let i = 0; i < 52 && m.snapshot().phase !== 'normal'; i++) play(m, rng);
    }
    assert.ok(!colors.gase.has('rainbow'));
    assert.ok(colors.gase.size >= 3 && colors.real.size >= 3, `${[...colors.gase]} / ${[...colors.real]}`);
});

test('AT 中のボーナス: 登場 → (狙え → 揃い → 勝利) か (最後のゲームで敗北) → AT に戻る。相手は当たるボーナスかで選ぶ', () => {
    let wins = 0;
    let loses = 0;
    for (let seed = 1; seed <= 30; seed++) {
        const m = createMachine({ seed });
        const rng = createRng(seed);
        const log = [];
        m.on(e => log.push(e));
        m.debug.direct();
        play(m, rng);
        m.debug.atBonus('big');
        play(m, rng);   // 図柄をそろえるゲーム
        const willWin = m.debug.internal().bonus.willWin;
        let guard = 0;
        while (!log.some(e => e.type === EVENTS.BONUS_END) && guard++ < 200) play(m, rng);
        const start = log.find(e => e.type === EVENTS.BONUS_START);
        assert.equal(start.inAt, true);
        const boss = log.filter(e => e.type === EVENTS.AT_BOSS);
        assert.equal(boss[0].final, false, '最初は登場');
        const last = boss[boss.length - 1];
        assert.equal(boss.length, 2);
        assert.ok(boss.every(b => b.boss === boss[0].boss), '相手は同じ');
        assert.equal(last.win, willWin, '開始時に決めた当落と一致');
        if (last.win) {
            wins++;
            const i = log.indexOf(last);
            const nerae = log.findIndex(e => e.type === EVENTS.BONUS_NERAE && e.win);
            const align = log.findIndex((e, k) => k > nerae && e.type === EVENTS.GAME_END);
            assert.ok(nerae < align && align < i, '狙え → 揃い → 勝利の順');
            assert.equal(log[align].win, 'koori');
            assert.ok(log.some(e => e.type === EVENTS.TOKKA_START), '勝ったら特化ゾーン');
        } else loses++;
        const end = log.find(e => e.type === EVENTS.BONUS_END);
        assert.equal(end.at, false);
        assert.ok(['at', 'standby'].includes(m.snapshot().phase) || log.some(e => e.type === EVENTS.AT_END));
    }
    assert.ok(wins > 0 && loses > 0, `勝ち ${wins} 負け ${loses}`);
});

test('AT 中のエピソードBIG は入賞した時点で特化ゾーン確定 (at:boss は最初のゲームに final: true, win: true)', () => {
    const m = createMachine({ seed: 14 });
    const rng = createRng(14);
    const log = [];
    m.on(e => log.push(e));
    m.debug.direct();
    play(m, rng);
    m.debug.atBonus('epbig');
    play(m, rng);
    play(m, rng);
    const boss = log.filter(e => e.type === EVENTS.AT_BOSS);
    assert.equal(boss.length, 1);
    assert.deepEqual([boss[0].final, boss[0].win], [true, true]);
    let guard = 0;
    while (!log.some(e => e.type === EVENTS.BONUS_END) && guard++ < 100) play(m, rng);
    assert.ok(!log.some(e => e.type === EVENTS.BONUS_NERAE), 'エピソードBIG は狙えを出さない');
    assert.ok(log.some(e => e.type === EVENTS.TOKKA_START), 'ボーナスのあと特化ゾーン');
});

test('デバッグで役を差しかえたボーナスのゲームは、その分だけ当落を抽選し直す (中段チェリーは 100%)', () => {
    const m = createMachine({ seed: 15 });
    const rng = createRng(15);
    const log = [];
    m.on(e => log.push(e));
    m.debug.bonus('reg');
    play(m, rng);
    m.debug.setNextRole('midCherry');
    play(m, rng);
    // 引いたゲームは中段チェリーの出目を見せる (狙えはまだ)
    assert.ok(!log.some(e => e.type === EVENTS.BONUS_NERAE), '引いたゲームには狙えを出さない');
    assert.equal(log.filter(e => e.type === EVENTS.GAME_END).pop().win, 'cherry');
    // 次のゲームのレバーで狙え → こおりくん揃い
    play(m, rng);
    const nerae = log.find(e => e.type === EVENTS.BONUS_NERAE);
    assert.ok(nerae && nerae.win, '中段チェリーの次のゲームで狙え');
    assert.equal(log.filter(e => e.type === EVENTS.GAME_END).pop().win, 'koori');
});

test('ボーナス中の「狙え」は当選した役の次のゲームに出る (全部の役)。最後のゲームで当選したときだけそのゲームに出る', () => {
    const rng = createRng(53);
    // 押し順ベル (順押しナビは当選したゲーム、狙えは次のゲーム)
    const m = machineWith(c => { c.bonusAt.bell = 100; }, { seed: 54 });
    const log = [];
    m.on(e => log.push(e));
    m.debug.bonus('big');
    play(m, rng);
    m.debug.setNextRole('bell');
    play(m, rng);
    const game = log.filter(e => e.type === EVENTS.BONUS_GAME).pop();
    assert.deepEqual(game.nav, [0, 1, 2], '当選したベルのゲームは順押しナビ');
    assert.equal(log.filter(e => e.type === EVENTS.GAME_END).pop().win, 'bell', '当選したゲームはベル揃いのまま');
    assert.ok(!log.some(e => e.type === EVENTS.BONUS_NERAE), 'まだ狙えは出ない');
    m.debug.setNextRole('none');
    play(m, rng);
    const nerae = log.find(e => e.type === EVENTS.BONUS_NERAE);
    assert.ok(nerae && nerae.win, '次のゲームのレバーで狙え');
    assert.equal(log.indexOf(nerae), log.findIndex((e, i) => i > log.indexOf(nerae) - 3 && e.type === EVENTS.LEVER) + 1, 'レバーの直後');
    assert.equal(log.filter(e => e.type === EVENTS.GAME_END).pop().win, 'koori');
    // 最後のゲームで当選: そのゲームに狙え
    const m2 = machineWith(c => { for (const k of Object.keys(c.bonusAt)) c.bonusAt[k] = 0; c.bonusAt.midCherry = 100; }, { seed: 55 });
    const log2 = [];
    m2.on(e => log2.push(e));
    m2.debug.bonus('reg');
    play(m2, rng);
    for (let i = 0; i < 19; i++) { m2.debug.setNextRole('none'); play(m2, rng); }
    assert.equal(m2.snapshot().bonus.left, 1);
    m2.debug.setNextRole('midCherry');
    play(m2, rng);
    const nerae2 = log2.find(e => e.type === EVENTS.BONUS_NERAE);
    assert.ok(nerae2 && nerae2.win, '最後のゲームの当選はそのゲームに狙え');
    assert.equal(log2.filter(e => e.type === EVENTS.GAME_END).pop().win, 'koori');
    assert.equal(log2.find(e => e.type === EVENTS.BONUS_END).at, true);
});

test('前兆の途中で AT のゲーム数がなくなると、ラストジャッジで当落を告知する', () => {
    for (const real of [true, false]) {
        const m = createMachine({ seed: 8 });
        const rng = createRng(8);
        const log = [];
        m.on(e => log.push(e));
        m.debug.setGames(5);   // 0G のゾーンの前兆と重ならないように
        m.debug.direct();
        play(m, rng);
        m.debug.startZencho({ real, length: 30 });
        m.debug.atEndSoon();
        for (let i = 0; i < 3; i++) {
            m.debug.setNextRole('none');
            play(m, rng);
        }
        const judge = log.find(e => e.type === EVENTS.AT_JUDGE);
        assert.ok(judge, 'at:judge が出る');
        assert.equal(judge.win, real);
        const next = log[log.indexOf(judge) + 1];
        assert.equal(next.type, real ? EVENTS.BONUS_STANDBY : EVENTS.AT_END);
        if (!real) assert.ok(next.hint, 'at:end に hint がある');
    }
});

test('天国のカットインは、天国の前兆の始まりにだけ出る', () => {
    let heavens = 0;
    for (let seed = 1; seed <= 40; seed++) {
        const m = createMachine({ seed });
        const rng = createRng(seed);
        let lastStart = -1;
        let game = 0;
        m.on(e => {
            if (e.type === EVENTS.LEVER) game = e.game;
            if (e.type === EVENTS.ZENCHO_START) lastStart = game;
            if (e.type === EVENTS.HEAVEN) {
                heavens++;
                assert.equal(lastStart, game, '前兆の始まりと同じゲーム');
                assert.ok(['heaven', 'superHeaven'].includes(m.debug.internal().mode));
            }
        });
        m.debug.setMode('heaven');
        for (let i = 0; i < 300; i++) play(m, rng);
    }
    assert.ok(heavens > 0);
});

// ----- リール制御の修正 (2026-10-21: 左の窓の決め打ち・中段以外のラインで揃わない・ベルは右下がり) -----

const FORBIDDEN_LEFT = ['cherry', 'bell', 'replay'];
const LINE_LIST = { top: [0, 0, 0], middle: [1, 1, 1], bottom: [2, 2, 2], down: [0, 1, 2], up: [2, 1, 0] };
const kindOf = sym => (isBonus(sym) ? 'bonus' : sym);
// cols で3つ同じ種類が並ぶライン ("名前:種類")
function same3Lines(cols) {
    return Object.entries(LINE_LIST).map(([name, line]) => [name, line.map((row, reel) => kindOf(cols[reel][row]))])
        .filter(([, k]) => k[0] === k[1] && k[1] === k[2] && k[0] !== 'cherry').map(([name, k]) => `${name}:${k[0]}`);
}
const matchLeft = (cols, pattern) => pattern.every((p, row) => (p === 'bonus' ? isBonus(cols[0][row]) : cols[0][row] === p));

test('A: 全 shape × 左リールの押し位置 0〜20 で、止まった左の窓が決め打ちどおり (滑りは最大 6コマ)', () => {
    for (const [shape, pattern] of Object.entries(LEFT_WINDOW)) {
        for (let press = 0; press < REEL_LENGTH; press++) {
            const ctrl = createReelControl(shape);
            const { slip } = ctrl.stop(0, press);
            assert.ok(slip <= 6, `${shape} 押し位置 ${press} の滑り ${slip}`);
            ctrl.stop(1, press);
            ctrl.stop(2, press);
            const cols = gridAt(ctrl.tops);
            assert.ok(matchLeft(cols, pattern), `${shape} 押し位置 ${press}: 左 ${cols[0]} (期待 ${pattern})`);
        }
    }
    // 左の窓「チェリー／ベル／リプレイ」はどの形の候補にもない
    for (const shape of Object.keys(SHAPES)) {
        assert.ok(!combosFor(shape).some(t => matchLeft(gridAt(t), FORBIDDEN_LEFT)), `${shape} にチェリー／ベル／リプレイの窓`);
    }
});

test('B: 10,000 ゲーム回して、中段以外のラインで3つ同じが並ぶのは許可ラインだけ。左の窓「チェリー／ベル／リプレイ」は 0回。ベルは右下がりだけ', () => {
    const m = createMachine({ seed: 77 });
    const rng = createRng(77);
    const allowed = { weakSuika: ['down:suika'], strongSuika: ['top:suika', 'middle:suika'], midCherry: ['down:bonus'], bell: ['down:bell'], replay: ['middle:replay'], commonBell: ['down:bell'] };
    const roles = ['none', 'none', 'none', 'bell', 'bell', 'replay', 'commonBell', 'weakCherry', 'strongCherry', 'midCherry', 'weakSuika', 'strongSuika', 'chance'];
    let role = null;
    let games = 0;
    let bells = 0;
    m.on(e => {
        if (e.type !== EVENTS.GAME_END) return;
        games++;
        const cols = e.cols;
        assert.ok(!matchLeft(cols, FORBIDDEN_LEFT), `左の窓がチェリー／ベル／リプレイ: ${JSON.stringify(cols)}`);
        if (['big', 'reg', 'koori'].includes(e.win)) return;   // ボーナス図柄・こおりくん揃いはほかのラインを見ない
        const lines = same3Lines(cols);
        const ok = allowed[role] || [];
        assert.ok(lines.every(l => ok.includes(l)), `役 ${role} で揃ったライン ${lines}: ${JSON.stringify(cols)}`);
        assert.ok(!(cols[0][1] === 'bell' && cols[1][1] === 'bell' && cols[2][1] === 'bell'), '中段ベル3つは作らない');
        if (e.win === 'bell') {
            bells++;
            assert.deepEqual([cols[0][0], cols[1][1], cols[2][2]], ['bell', 'bell', 'bell'], 'ベルは右下がり');
            assert.equal(e.payout, 15, 'ベルが揃っているのに 0枚');
        }
        if (e.payout === 15) assert.ok(e.win === 'bell' || e.win === 'koori', '15枚なのにベルが揃っていない');
    });
    for (let i = 0; i < 10000; i++) {
        // 役を決めて回す (出目の許可ラインの判定用。図柄をそろえるゲーム・ガセ狙えのゲームは役に関係なく許可なし)
        role = rng.pick(roles);
        m.debug.setNextRole(role);
        if (m.snapshot().phase === 'standby') role = 'bonusAlign';
        play(m, rng);
    }
    assert.equal(games, 10000);
    assert.ok(bells > 500, `ベル ${bells}`);
});

test('押し順ベル: 4つの押し順すべてで、正解なら右下がりベル揃い + 15枚、不正解なら bellMiss + 0枚。AT 中の押し順ベルは nav が必ず入る', () => {
    const rng = createRng(45);
    for (const follow of [true, false]) {
        const seen = new Set();
        const m = createMachine({ seed: 46 });
        let nav = null;
        let end = null;
        m.on(e => {
            if (e.type === EVENTS.AT_GAME) nav = e.nav;
            if (e.type === EVENTS.GAME_END) end = e;
        });
        m.debug.setGames(5);
        m.debug.direct();
        play(m, rng);
        for (let i = 0; i < 300 && seen.size < 4 && m.snapshot().phase === 'at'; i++) {
            m.debug.setNextRole('bell');
            assert.ok(m.lever());
            assert.ok(Array.isArray(nav) && nav.length === 3, 'AT 中の押し順ベルは nav が null でない');
            if (nav[0] === 0) {
                [0, 1, 2].forEach(reel => m.stop(reel, rng.int(0, 20)));
                continue;
            }
            seen.add(nav.join(''));
            const order = follow ? nav : rng.pick(ORDERS.filter(o => o.join('') !== nav.join('')));
            order.forEach(reel => m.stop(reel, rng.int(0, 20)));
            const diag = [end.cols[0][0], end.cols[1][1], end.cols[2][2]];
            if (follow) {
                assert.deepEqual(diag, ['bell', 'bell', 'bell'], `正解 ${nav}`);
                assert.equal(end.payout, 15);
                assert.equal(end.win, 'bell');
            } else {
                assert.equal(diag.filter(x => x === 'bell').length, 2, `不正解 ${nav} ${order}`);
                assert.equal(end.payout, 0);
                assert.equal(end.win, null);
            }
        }
        assert.equal(seen.size, 4, `4つのナビを見た: ${[...seen]}`);
    }
});

// ----- 設定示唆トロフィー (handoff/2026-10-21_zukan-trophy) -----

test('at:end の trophy: 設定 1〜6 で 10,000 回出して、設定より上の色が 1回も出ない。出ないときは null', () => {
    const RANK = { white: 1, blue: 2, green: 3, purple: 4, red: 5, rainbow: 6 };
    const rng = createRng(61);
    for (let setting = 1; setting <= 6; setting++) {
        const m = createMachine({ setting, seed: 60 + setting });
        const seen = { null: 0 };
        let ends = 0;
        m.on(e => {
            if (e.type !== EVENTS.AT_END) return;
            ends++;
            if (e.trophy === null) { seen.null++; return; }
            assert.ok(RANK[e.trophy], `知らない色 ${e.trophy}`);
            assert.ok(RANK[e.trophy] <= setting, `設定${setting} で ${e.trophy}`);
            seen[e.trophy] = (seen[e.trophy] || 0) + 1;
        });
        // AT 直撃 → 残り 3G → ハズレで終わらせる (前兆に重ならないよう規定ゲーム数をずらす) を 10,000 回
        for (let i = 0; i < 10000; i++) {
            m.debug.setGames(5);
            m.debug.direct();
            play(m, rng);
            m.debug.atEndSoon();
            let guard = 0;
            while (m.snapshot().phase !== 'normal' && guard++ < 400) {
                m.debug.setNextRole('none');
                play(m, rng);
            }
            assert.equal(m.snapshot().phase, 'normal', `AT が終わらない (設定${setting} ${i}回目)`);
        }
        assert.equal(ends, 10000);
        assert.ok(seen.null > 3000 && seen.null < 7000, `出る率 50% (null ${seen.null})`);
        if (setting === 6) assert.ok(seen.rainbow > 0, '設定6 は虹が出る');
    }
});
