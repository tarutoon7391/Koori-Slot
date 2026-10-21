// =====================================================================
// シミュレーション: 設定・ゲーム数・seed を引数に取り、createMachine を回して集計する
// ---------------------------------------------------------------------
//   npm run sim                       設定 1〜6 を 200,000G ずつ (seed 1)
//   npm run sim -- --setting 1        設定 1 だけ
//   npm run sim -- --games 1000000 --seed 7
// 押す位置はでたらめ (内部処理が「押した位置にいちばん近いところ」で止める)。押し順はナビがあればナビどおり、
// なければ中押し・右押しの4択からでたらめ (通常時の押し順ベルは 1/4 で正解)。
// 出力は Markdown の表 (docs/sim_result.md に貼る)。
// =====================================================================

import { createMachine, EVENTS as E, REEL_LENGTH } from '../src/logic/index.js';
import { createRng } from '../src/logic/rng.js';

const args = process.argv.slice(2);
const arg = (name, def) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : def;
};
const settings = arg('setting', 'all') === 'all' ? [1, 2, 3, 4, 5, 6] : [Number(arg('setting'))];
const games = Number(arg('games', 200000));
const seed = Number(arg('seed', 1));

const ORDERS = [[1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];

export function simulate({ setting, games, seed }) {
    const m = createMachine({ setting, seed });
    const rng = createRng(seed * 7919 + setting);
    const st = {
        games: 0, bet: 0, pay: 0,
        normalGames: 0, normalBet: 0, normalPay: 0,
        firstBonus: 0, bonusByType: { big: 0, reg: 0, epbig: 0 }, atBonus: 0,
        atStart: 0, atDirect: 0, atEnd: 0, atGames: 0, atPay: 0, atNet: 0, atMax: 0,
        tokkaStart: 0, tokkaTotal: 0, tokkaMax: 0,
        nerae: 0, neraeGase: 0, judge: 0, judgeWin: 0, tenjo: 0
    };
    let leverPhase = 'normal';
    let lastLeverPhase = 'normal';
    let nav = null;
    let inAt = false;
    let atAcc = null;
    let free = false;

    m.on(e => {
        switch (e.type) {
            case E.LEVER:
                lastLeverPhase = leverPhase;
                leverPhase = e.phase;
                free = e.free;
                nav = null;
                st.games++;
                if (!free) st.bet += 3;
                if (e.phase === 'normal') {
                    st.normalGames++;
                    if (!free) st.normalBet += 3;
                }
                if (inAt && !free) atAcc.bet += 3;
                break;
            case E.AT_GAME:
            case E.BONUS_GAME:
            case E.TOKKA_GAME:
                if (e.nav) nav = e.nav;
                break;
            case E.GAME_END:
                st.pay += e.payout;
                if (leverPhase === 'normal') st.normalPay += e.payout;
                if (inAt) atAcc.pay += e.payout;
                break;
            case E.BONUS_STANDBY:
                if (lastLeverPhase === 'normal' || (leverPhase === 'normal' && !inAt)) st.firstBonus++;
                if (inAt) st.atBonus++;
                st.bonusByType[e.bonus]++;
                break;
            case E.BONUS_NERAE:
                if (e.win) st.nerae++;
                else st.neraeGase++;
                break;
            case E.TENJO:
                st.tenjo++;
                break;
            case E.AT_START:
                st.atStart++;
                if (e.cause === 'direct') st.atDirect++;
                inAt = true;
                atAcc = { bet: 0, pay: 0 };
                break;
            case E.AT_JUDGE:
                st.judge++;
                if (e.win) st.judgeWin++;
                break;
            case E.AT_END:
                st.atEnd++;
                st.atGames += e.games;
                st.atPay += atAcc.pay;
                st.atNet += atAcc.pay - atAcc.bet;
                st.atMax = Math.max(st.atMax, atAcc.pay - atAcc.bet);
                inAt = false;
                atAcc = null;
                break;
            case E.TOKKA_START:
                st.tokkaStart++;
                break;
            case E.TOKKA_END:
                st.tokkaTotal += e.total;
                st.tokkaMax = Math.max(st.tokkaMax, e.total);
                break;
            default:
        }
    });

    for (let i = 0; i < games; i++) {
        if (!m.lever()) throw new Error('lever が回らない');
        const order = nav || rng.pick(ORDERS);
        order.forEach(reel => m.stop(reel, rng.int(0, REEL_LENGTH - 1)));
    }
    return st;
}

const fmt1 = x => (Number.isFinite(x) ? x.toFixed(1) : '-');
const fmtP = x => (Number.isFinite(x) ? `${(x * 100).toFixed(1)}%` : '-');
const over = (a, b) => (b > 0 ? `1/${(a / b).toFixed(1)}` : '-');

function summarize(setting, st) {
    const coin = st.normalBet - st.normalPay > 0 ? (st.normalGames * 50) / (st.normalBet - st.normalPay) : Infinity;
    return {
        setting,
        games: st.games,
        firstBonus: over(st.normalGames, st.firstBonus),
        atFirst: over(st.normalGames, st.atStart),
        atAvgGames: fmt1(st.atGames / st.atEnd),
        atAvgPay: fmt1(st.atPay / st.atEnd),
        atAvgNet: fmt1(st.atNet / st.atEnd),
        atMax: st.atMax,
        tokkaRate: fmtP(st.tokkaStart / st.atStart),
        tokkaAvg: fmt1(st.tokkaTotal / st.tokkaStart),
        coin: fmt1(coin),
        payoutRate: fmtP(st.pay / st.bet),
        raw: st
    };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('simulate.js')) {
    const rows = [];
    for (const setting of settings) {
        const t0 = Date.now();
        const st = simulate({ setting, games, seed });
        const r = summarize(setting, st);
        rows.push(r);
        console.error(`設定${setting}: ${games}G (${((Date.now() - t0) / 1000).toFixed(1)}s) 初当たり ${r.firstBonus} AT初当たり ${r.atFirst} 機械割 ${r.payoutRate}`);
    }
    console.log(`シミュレーション: 各設定 ${games.toLocaleString()}G / seed ${seed} / 押し順はナビどおり (ナビなしは4択からでたらめ)\n`);
    console.log('| 設定 | 初当たり (ボーナス) | AT 初当たり | AT 平均ゲーム数 | AT 平均払い出し | AT 平均差枚 | AT 最大差枚 | 特化ゾーン突入率 (AT あたり) | 特化ゾーン平均上乗せ | コイン持ち (50枚あたり G) | 機械割 |');
    console.log('|---|---|---|---|---|---|---|---|---|---|---|');
    for (const r of rows) {
        console.log(`| ${r.setting} | ${r.firstBonus} | ${r.atFirst} | ${r.atAvgGames}G | ${r.atAvgPay}枚 | ${r.atAvgNet}枚 | ${r.atMax}枚 | ${r.tokkaRate} | ${r.tokkaAvg}G | ${r.coin}G | ${r.payoutRate} |`);
    }
    console.log('\n内訳 (設定ごと):\n');
    console.log('| 設定 | 通常時 G | ボーナス BIG/REG/エピソード | AT 中のボーナス | AT 直撃 | 天井 | 狙え (当選/ガセ) | ラストジャッジ (当選/回数) |');
    console.log('|---|---|---|---|---|---|---|---|');
    for (const r of rows) {
        const s = r.raw;
        console.log(`| ${r.setting} | ${s.normalGames} | ${s.bonusByType.big}/${s.bonusByType.reg}/${s.bonusByType.epbig} | ${s.atBonus} | ${s.atDirect} | ${s.tenjo} | ${s.nerae}/${s.neraeGase} | ${s.judgeWin}/${s.judge} |`);
    }
}
