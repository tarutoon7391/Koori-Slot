// 仮組の内部処理のテスト (node --test tests/)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMachine, EVENTS, REEL_LENGTH } from '../src/logic/index.js';
import { SHAPES, combosFor, createReelControl } from '../src/logic/reelControl.js';
import { gridAt, middleWin } from '../src/logic/reels.js';
import { createRng } from '../src/logic/rng.js';

// 1ゲーム回す (押す位置はでたらめ、押し順もでたらめ)
function play(m, rng) {
    assert.ok(m.lever());
    const order = rng.pick([[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]);
    order.forEach(reel => m.stop(reel, rng.int(0, REEL_LENGTH - 1)));
}

test('どの出目の形も、どこを押しても作れる', () => {
    const rng = createRng(1);
    for (const shape of Object.keys(SHAPES)) {
        assert.ok(combosFor(shape).length > 0, shape);
        for (let i = 0; i < 200; i++) {
            const ctrl = createReelControl(shape);
            const order = rng.pick([[0, 1, 2], [2, 1, 0], [1, 0, 2]]);
            order.forEach(reel => ctrl.stop(reel, rng.int(0, 20)));
            assert.ok(SHAPES[shape](gridAt(ctrl.tops)), shape);
        }
    }
});

test('ベル・リプレイ・ボーナスは中段にそろう (エピソードBIG はこおりくん揃い)', () => {
    for (const [shape, win] of [['bell', 'bell'], ['replay', 'replay'], ['big', 'big'], ['reg', 'reg'], ['epbig', 'koori'], ['koori', 'koori']]) {
        const ctrl = createReelControl(shape);
        [0, 1, 2].forEach(reel => ctrl.stop(reel, 7));
        assert.equal(middleWin(gridAt(ctrl.tops)), win);
    }
});

test('通常時を長く回しても止まらず、前兆・ボーナス・AT が起きる', () => {
    const m = createMachine({ setting: 1, seed: 42 });
    const rng = createRng(7);
    const count = {};
    m.on(e => { count[e.type] = (count[e.type] || 0) + 1; });
    for (let i = 0; i < 60000; i++) play(m, rng);
    for (const type of [EVENTS.ZENCHO_START, EVENTS.ZENCHO_END, EVENTS.BONUS_START, EVENTS.BONUS_END, EVENTS.STAGE, EVENTS.ZONE, EVENTS.AT_START, EVENTS.AT_END]) {
        assert.ok(count[type] > 0, `${type} が起きない`);
    }
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

test('特化ゾーン (仮組): ストック → 始まり → 3G ずつのセット → 終わり。上乗せは AT の残りに足され、AT のゲーム数は減らない', () => {
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
        assert.equal(log[end].left, m.snapshot().at ? m.snapshot().at.left : log[end].left);
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
        assert.equal(middleWin(cols), null);
    }
});

test('game:end の win: チェリー・スイカは役で、チャンス目はリプレイ扱い', () => {
    for (const [role, win] of [['weakCherry', 'cherry'], ['strongSuika', 'suika'], ['chance', 'replay']]) {
        const m = createMachine({ seed: 21 });
        const rng = createRng(1);
        let end = null;
        m.on(e => { if (e.type === EVENTS.GAME_END) end = e; });
        m.debug.setNextRole(role);
        play(m, rng);
        assert.equal(end.win, win, role);
        if (role === 'chance') assert.ok(m.snapshot().free, 'チャンス目は次のゲームが無料');
    }
});

test('AT のナビは中押し・右押しの4択。順押しナビは特化ゾーンのストックにつながる', () => {
    const m = createMachine({ seed: 5 });
    const rng = createRng(6);
    const navs = [];
    const log = [];
    m.on(e => {
        if (e.type === EVENTS.AT_GAME && e.nav) navs.push(e.nav);
        log.push(e.type);
    });
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

test('AT 中のボーナス: 登場 → (狙え → 揃い → 勝利) か (最後のゲームで敗北) → AT に戻る', () => {
    let wins = 0;
    let loses = 0;
    for (let seed = 1; seed <= 20; seed++) {
        const m = createMachine({ seed });
        const rng = createRng(seed);
        const log = [];
        m.on(e => log.push(e));
        m.debug.direct();
        play(m, rng);
        m.debug.atBonus('big');
        let guard = 0;
        while (!log.some(e => e.type === EVENTS.BONUS_END) && guard++ < 200) play(m, rng);
        const start = log.find(e => e.type === EVENTS.BONUS_START);
        assert.equal(start.inAt, true);
        const boss = log.filter(e => e.type === EVENTS.AT_BOSS);
        assert.equal(boss[0].final, false, '最初は登場');
        const last = boss[boss.length - 1];
        assert.equal(boss.length, 2);
        assert.ok(boss.every(b => b.boss === boss[0].boss), '相手は同じ');
        if (last.win) {
            wins++;
            const i = log.indexOf(last);
            const nerae = log.findIndex(e => e.type === EVENTS.BONUS_NERAE);
            const align = log.findIndex((e, k) => k > nerae && e.type === EVENTS.GAME_END);
            assert.ok(nerae < align && align < i, '狙え → 揃い → 勝利の順');
            assert.equal(log[align].win, 'koori');
        } else loses++;
        const end = log.find(e => e.type === EVENTS.BONUS_END);
        assert.equal(end.at, false);
        assert.ok(['at', 'standby'].includes(m.snapshot().phase) || log.some(e => e.type === EVENTS.AT_END));
    }
    assert.ok(wins > 0 && loses > 0, `勝ち ${wins} 負け ${loses}`);
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
