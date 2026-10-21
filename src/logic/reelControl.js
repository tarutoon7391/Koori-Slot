// =====================================================================
// リール制御 (仮組): 役ごとの出目を決め打ちし、押した位置にいちばん近いところで止める
// ---------------------------------------------------------------------
// 仕様書: 当選役は必ず引き込む (取りこぼしなし)。見た目の滑りの上限は設けない。押した位置に近いところで止まる。
// 出目の形 (shape) ごとに、3リールの止まる位置の組み合わせ (21^3 通り) から条件に合うものを先に集めておき、
// 1つ止めるたびに、残りのリールで形が作れる位置のうち、押した位置から滑りがいちばん少ないところを選ぶ。
// =====================================================================

import { BONUS_SYMBOLS, REEL_LENGTH, gridAt, middleWin, wrap } from './reels.js';

const isBonus = s => BONUS_SYMBOLS.has(s);
const LINES = [[0, 0, 0], [1, 1, 1], [2, 2, 2], [0, 1, 2], [2, 1, 0]];
const suikaLine = cols => LINES.some(rows => rows.every((row, reel) => cols[reel][row] === 'suika'));
const leftCherry = cols => cols[0].includes('cherry');
// 左リールの上段・中段・下段が pattern どおりか ('bonus' はボーナス図柄のどれか)
const left = (cols, pattern) => pattern.every((p, row) => (p === 'bonus' ? isBonus(cols[0][row]) : cols[0][row] === p));

// レア役の停止形 (仕様書「レア役の停止形」)。ほかの役の形と紛れないものだけを通す
// チャンス目A はベルの小V (左上段・中中段・右上段)。中段はリプレイ・ベル・リプレイで入賞しない (仕様書 2026-10-21)
const chanceA = cols => left(cols, ['bell', 'replay', 'bonus']) && cols[1][1] === 'bell' && cols[2][0] === 'bell' && cols[2][1] === 'replay';
const chanceB = cols => left(cols, ['suika', 'bell', 'replay']) && cols[1][1] === 'suika' && cols[2][1] === 'suika' && isBonus(cols[2][2]);
const plain = cols => !leftCherry(cols) && !suikaLine(cols) && !chanceA(cols) && !chanceB(cols);

export const SHAPES = {
    none: cols => !middleWin(cols) && plain(cols),
    bell: cols => middleWin(cols) === 'bell' && plain(cols),
    replay: cols => middleWin(cols) === 'replay' && plain(cols),
    weakCherry: cols => left(cols, ['replay', 'bonus', 'cherry']) && ['replay', 'bell'].includes(cols[2][1]) && !middleWin(cols) && !suikaLine(cols),
    strongCherry: cols => left(cols, ['replay', 'bonus', 'cherry']) && isBonus(cols[2][1]) && !isBonus(cols[1][1]) && !middleWin(cols) && !suikaLine(cols),
    midCherry: cols => left(cols, ['bonus', 'cherry', 'bell']) && isBonus(cols[0][0]) && cols[1][1] === cols[0][0] && cols[2][2] === cols[0][0] && !middleWin(cols),
    weakSuika: cols => left(cols, ['suika', 'bell', 'replay']) && cols[1][1] === 'suika' && cols[2][2] === 'suika' && !middleWin(cols),
    strongSuikaA: cols => left(cols, ['suika', 'bell', 'replay']) && cols[1][0] === 'suika' && cols[2][0] === 'suika' && !middleWin(cols),
    strongSuikaB: cols => left(cols, ['replay', 'suika', 'bell']) && cols[1][1] === 'suika' && cols[2][1] === 'suika',
    chanceA: cols => chanceA(cols) && !middleWin(cols),
    chanceB: cols => chanceB(cols) && !middleWin(cols),
    // ボーナス図柄・こおりくん揃い (中段)
    big: cols => middleWin(cols) === 'big',
    reg: cols => middleWin(cols) === 'reg',
    epbig: cols => middleWin(cols) === 'koori',
    koori: cols => middleWin(cols) === 'koori'
};

const cache = {};

// 形 shape になる止まる位置の組み合わせ [左, 中, 右] の一覧
export function combosFor(shape) {
    if (cache[shape]) return cache[shape];
    const test = SHAPES[shape];
    if (!test) throw new Error(`知らない出目の形: ${shape}`);
    const list = [];
    for (let a = 0; a < REEL_LENGTH; a++) {
        for (let b = 0; b < REEL_LENGTH; b++) {
            for (let c = 0; c < REEL_LENGTH; c++) {
                const tops = [a, b, c];
                if (test(gridAt(tops))) list.push(tops);
            }
        }
    }
    cache[shape] = list;
    return list;
}

// 1ゲーム分のリール制御。stop(reel, press) で止まる位置 (上段の番号) を返す
export function createReelControl(shape) {
    let candidates = combosFor(shape);
    if (!candidates.length) throw new Error(`出目の形 ${shape} が作れません`);
    const stopped = [null, null, null];
    return {
        stop(reel, press) {
            for (let slip = 0; slip < REEL_LENGTH; slip++) {
                const top = wrap(press - slip);
                const next = candidates.filter(t => t[reel] === top);
                if (next.length) {
                    candidates = next;
                    stopped[reel] = top;
                    return { top, slip };
                }
            }
            throw new Error('止まる位置がありません');
        },
        get tops() {
            return stopped.slice();
        }
    };
}
