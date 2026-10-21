// =====================================================================
// リール制御: 役ごとの出目を決め打ちし、押した位置にいちばん近いところで止める
// ---------------------------------------------------------------------
// 仕様書: 当選役は必ず引き込む (取りこぼしなし。押し順ベルの不正解だけは取りこぼす)。見た目の滑りの上限は設けない。
// 出目の形 (shape) ごとに、3リールの止まる位置の組み合わせ (21^3 通り) から条件に合うものを先に集めておき、
// 1つ止めるたびに、残りのリールで形が作れる位置のうち、押した位置から滑りがいちばん少ないところを選ぶ。
// 形は名前 (SHAPES のキー) のほか、「押した順 (order) から形の名前を返す関数」でも渡せる。
// 関数のときは stop() のたびに呼び直して候補を絞り直す (押し順ベルの取りこぼし・ガセ「狙え」の押し順ごとの止め方に使う)。
// =====================================================================

import { BONUS_SYMBOLS, REEL_LENGTH, STRIPS, gridAt, middleWin, wrap } from './reels.js';

const isBonus = s => BONUS_SYMBOLS.has(s);
const LINES = [[0, 0, 0], [1, 1, 1], [2, 2, 2], [0, 1, 2], [2, 1, 0]];
const suikaLine = cols => LINES.some(rows => rows.every((row, reel) => cols[reel][row] === 'suika'));
const leftCherry = cols => cols[0].includes('cherry');
// 左リールの上段・中段・下段が pattern どおりか ('bonus' はボーナス図柄のどれか)
const left = (cols, pattern) => pattern.every((p, row) => (p === 'bonus' ? isBonus(cols[0][row]) : cols[0][row] === p));
// リール reel が上段 top で止まったとき、枠の外も含めた row 段目 (0: 上段 … 2: 下段、3: 枠下、4: 枠下下) の図柄
const symbolAt = (reel, top, row) => STRIPS[reel][wrap(top + row)];
// こおりくんが rows のどれかの段にあるか (枠の外も見る)
const kooriAt = (tops, reel, rows) => rows.some(row => symbolAt(reel, tops[reel], row) === 'koori');

// レア役の停止形 (仕様書「レア役の停止形」)。ほかの役の形と紛れないものだけを通す
// チャンス目A はベルの小V (左上段・中中段・右上段)。中段はリプレイ・ベル・リプレイで入賞しない (仕様書 2026-10-21)
const chanceA = cols => left(cols, ['bell', 'replay', 'bonus']) && cols[1][1] === 'bell' && cols[2][0] === 'bell' && cols[2][1] === 'replay';
const chanceB = cols => left(cols, ['suika', 'bell', 'replay']) && cols[1][1] === 'suika' && cols[2][1] === 'suika' && isBonus(cols[2][2]);
const plain = cols => !leftCherry(cols) && !suikaLine(cols) && !chanceA(cols) && !chanceB(cols);
const middleBells = cols => cols.filter(col => col[1] === 'bell').length;

// 形の条件は (cols, tops) で受ける。cols[リール][段] は見えている3段、tops は止まる位置 (枠の外を見るときに使う)
export const SHAPES = {
    none: cols => !middleWin(cols) && plain(cols),
    bell: cols => middleWin(cols) === 'bell' && plain(cols),
    // 押し順ベルの取りこぼし: 中段にベルが2つ (揃わない)。レア役の形・スイカ揃い・チャンス目と紛れない
    bellMiss: cols => middleBells(cols) === 2 && !middleWin(cols) && plain(cols),
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
    koori: cols => middleWin(cols) === 'koori',
    // ガセの「こおりを狙え」(仕様書・2026-10-21)。どれも中段にこおりくんが3つ揃わない
    //   順押し (左→中→右): 左中段こおりくん → 中中段こおりくん (テンパイ) → 右はこおりくんを下段に止めて外す
    kooriGaseJun: cols => cols[0][1] === 'koori' && cols[1][1] === 'koori' && cols[2][2] === 'koori',
    //   はさみ押し (左→右): 左中段こおりくん → 右はこおりくんを下段に止める (テンパイさせない) → 中は中段にこおりくんを止めない
    kooriGaseHasami: cols => cols[0][1] === 'koori' && cols[2][2] === 'koori' && cols[1][1] !== 'koori',
    //   中押し (中が第1停止): 中リールはこおりくんを枠下に止める。左右はこおりくんを枠下か枠下下まで飛ばす (枠の中にこおりくんなし)
    kooriGaseNaka: (cols, tops) => symbolAt(1, tops[1], 3) === 'koori' && kooriAt(tops, 0, [3, 4]) && kooriAt(tops, 2, [3, 4]) && !cols.some(col => col.includes('koori')),
    kooriGase: (cols, tops) => SHAPES.kooriGaseJun(cols, tops) || SHAPES.kooriGaseHasami(cols, tops) || SHAPES.kooriGaseNaka(cols, tops)
};

// 押し順ベルの形: 正解の押し順 nav に、押した順 (order) が合っているあいだは 'bell'、外れた時点で 'bellMiss'
// (第1・第2停止までが正解と一致していれば入賞。順押しナビ [0, 1, 2] のときは押し順不問で入賞)
export function bellShape(nav) {
    if (nav[0] === 0) return 'bell';
    return order => (order.every((reel, i) => reel === nav[i]) ? 'bell' : 'bellMiss');
}

// ガセの「狙え」の形: 第1停止で止め方が決まる (中押し / 順押し・はさみ押しは第2停止で分かれる。右押しははさみ押しと同じ止め方)
export function kooriGaseShape(order) {
    if (order[0] === 1) return 'kooriGaseNaka';
    if (order[0] === 2) return 'kooriGaseHasami';
    return order[1] === 2 ? 'kooriGaseHasami' : 'kooriGaseJun';
}

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
                if (test(gridAt(tops), tops)) list.push(tops);
            }
        }
    }
    cache[shape] = list;
    return list;
}

// 1ゲーム分のリール制御。stop(reel, press) で止まる位置 (上段の番号) を返す。
// shape は形の名前か、押した順 (order: 止めたリールの番号の並び) から形の名前を返す関数
export function createReelControl(shape) {
    const stopped = [null, null, null];
    const order = [];
    const shapeNow = () => (typeof shape === 'function' ? shape(order.slice()) : shape);
    if (!combosFor(shapeNow()).length) throw new Error(`出目の形 ${shapeNow()} が作れません`);
    return {
        stop(reel, press) {
            if (stopped[reel] !== null) throw new Error('もう止まっています');
            order.push(reel);
            const name = shapeNow();
            // 止めたリールの位置を変えずに、今の形が作れる組み合わせ
            const candidates = combosFor(name).filter(t => stopped.every((top, i) => top === null || t[i] === top));
            if (!candidates.length) throw new Error(`出目の形 ${name} が作れません (押した順 ${order.join('→')})`);
            for (let slip = 0; slip < REEL_LENGTH; slip++) {
                const top = wrap(press - slip);
                if (candidates.some(t => t[reel] === top)) {
                    stopped[reel] = top;
                    return { top, slip };
                }
            }
            throw new Error('止まる位置がありません');
        },
        get tops() {
            return stopped.slice();
        },
        get shape() {
            return shapeNow();
        }
    };
}
