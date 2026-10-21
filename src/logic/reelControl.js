// =====================================================================
// リール制御: 役ごとの出目を決め打ちし、押した位置にいちばん近いところで止める
// ---------------------------------------------------------------------
// 仕様書: 当選役は必ず引き込む (取りこぼしなし。押し順ベルの不正解だけは取りこぼす)。見た目の滑りの上限は設けない。
// 出目の形 (shape) ごとに、3リールの止まる位置の組み合わせ (21^3 通り) から条件に合うものを先に集めておき、
// 1つ止めるたびに、残りのリールで形が作れる位置のうち、押した位置から滑りがいちばん少ないところを選ぶ。
// 形は名前 (SHAPES のキー) のほか、「押した順 (order) から形の名前を返す関数」でも渡せる。
// 関数のときは stop() のたびに呼び直して候補を絞り直す (押し順ベルの取りこぼし・ガセ「狙え」の押し順ごとの止め方に使う)。
//
// 出目の決まり (2026-10-21 の修正):
//   A. 役ごとに左リールの窓 (上段／中段／下段) を決め打ちにする。左は 7コマ周期の3ブロックなので、押した位置から
//      下方向にいちばん近いブロックの窓に止まる (滑りは最大 6コマ)。「チェリー／ベル／リプレイ」の窓はどの役でも使わない。
//   B. 中段以外のライン (上段・下段・右下がり・右上がり) で、ベル・リプレイ・スイカ・ボーナス図柄が3つ同じにならない
//      (役ごとの許可ラインだけ例外)。中段は入賞 (リプレイ・ボーナス図柄・こおりくん) 以外で3つ同じにしない。
//      ベルの小V はチャンス目A だけ、右下がりスイカテンパイ + 右中段スイカはチャンス目B だけ。
//   入賞ラインは中段 (リプレイ・BIG・REG・こおりくん) と右下がり (ベル) の2本 (reels.js の lineWin)。
// =====================================================================

import { BONUS_SYMBOLS, REEL_LENGTH, STRIPS, gridAt, lineWin, wrap } from './reels.js';

const isBonus = s => BONUS_SYMBOLS.has(s);
// 図柄の種類 (ボーナス図柄 BAR・7・こおりくんはまとめて 'bonus')
const kind = s => (isBonus(s) ? 'bonus' : s);
// ライン [左の段, 中の段, 右の段]
const LINES = { top: [0, 0, 0], middle: [1, 1, 1], bottom: [2, 2, 2], down: [0, 1, 2], up: [2, 1, 0] };
const lineKinds = (cols, line) => line.map((row, reel) => kind(cols[reel][row]));
const same3 = k => k[0] === k[1] && k[1] === k[2];

// 左リールの窓 (上段／中段／下段)。'bonus' はボーナス図柄のどれか
const LEFT = {
    BRX: ['bell', 'replay', 'bonus'],       // ハズレ・リプレイ・ベル・ベルこぼし・チャンス目A
    SBR: ['suika', 'bell', 'replay'],       // 弱スイカ・強スイカA・チャンス目B
    RSB: ['replay', 'suika', 'bell'],       // 強スイカB
    RXC: ['replay', 'bonus', 'cherry'],     // 弱チェリー・強チェリー
    XCB: ['bonus', 'cherry', 'bell']        // 中段チェリー
};
const left = (cols, pattern) => pattern.every((p, row) => (p === 'bonus' ? isBonus(cols[0][row]) : cols[0][row] === p));

// ベルの小V (左上段・中中段・右上段) と、右下がりスイカテンパイ + 右中段スイカ
const smallV = cols => cols[0][0] === 'bell' && cols[1][1] === 'bell' && cols[2][0] === 'bell';
const suikaTenpai = cols => cols[0][0] === 'suika' && cols[1][1] === 'suika' && cols[2][1] === 'suika';

// B の共通条件。allow: 役ごとに許すもの ({ down: 'bell' } など。smallV / suikaTenpai は true で許可)
function clean(cols, allow = {}) {
    for (const [name, line] of Object.entries(LINES)) {
        const k = lineKinds(cols, line);
        if (same3(k) && k[0] !== 'cherry' && allow[name] !== k[0]) return false;
    }
    if (smallV(cols) && !allow.smallV) return false;
    if (suikaTenpai(cols) && !allow.suikaTenpai) return false;
    return true;
}

// リール reel が上段 top で止まったとき、枠の外も含めた row 段目 (0: 上段 … 2: 下段、3: 枠下、4: 枠下下) の図柄
const symbolAt = (reel, top, row) => STRIPS[reel][wrap(top + row)];
// こおりくんが rows のどれかの段にあるか (枠の外も見る)
const kooriAt = (tops, reel, rows) => rows.some(row => symbolAt(reel, tops[reel], row) === 'koori');

// 役ごとの出目の形。判定は (cols, tops) で受ける。cols[リール][段] は見えている3段、tops は止まる位置 (枠の外を見るときに使う)
export const SHAPES = {
    // ハズレ: 左 ベル／リプレイ／ボーナス図柄。どのラインも揃わない
    none: cols => left(cols, LEFT.BRX) && clean(cols),
    // リプレイ: 左 ベル／リプレイ／ボーナス図柄。中段リプレイ揃い
    replay: cols => left(cols, LEFT.BRX) && lineWin(cols) === 'replay' && clean(cols, { middle: 'replay' }),
    // ベル (押し順正解・共通ベル): 左 ベル／リプレイ／ボーナス図柄。右下がりベル揃い (左上段・中中段・右下段)
    bell: cols => left(cols, LEFT.BRX) && lineWin(cols) === 'bell' && clean(cols, { down: 'bell' }),
    // 押し順ベルの取りこぼし: 左 ベル／リプレイ／ボーナス図柄のまま、右下がりにベルが2つでテンパイハズレ
    // (ふつうは中中段ベルでテンパイして右下段をベル以外にする。右リールを先に正解で止めたあとに外れたときは、中中段をベル以外にして外す)
    bellMiss: cols => left(cols, LEFT.BRX) && (cols[1][1] === 'bell') !== (cols[2][2] === 'bell') && lineWin(cols) === null && clean(cols),
    // レア役の停止形 (仕様書「レア役の停止形」)
    weakCherry: cols => left(cols, LEFT.RXC) && ['replay', 'bell'].includes(cols[2][1]) && lineWin(cols) === null && clean(cols),
    strongCherry: cols => left(cols, LEFT.RXC) && isBonus(cols[2][1]) && !isBonus(cols[1][1]) && lineWin(cols) === null && clean(cols),
    midCherry: cols => left(cols, LEFT.XCB) && cols[1][1] === cols[0][0] && cols[2][2] === cols[0][0] && lineWin(cols) === null && clean(cols, { down: 'bonus' }),
    weakSuika: cols => left(cols, LEFT.SBR) && cols[1][1] === 'suika' && cols[2][2] === 'suika' && lineWin(cols) === null && clean(cols, { down: 'suika' }),
    strongSuikaA: cols => left(cols, LEFT.SBR) && cols[1][0] === 'suika' && cols[2][0] === 'suika' && lineWin(cols) === null && clean(cols, { top: 'suika' }),
    strongSuikaB: cols => left(cols, LEFT.RSB) && cols[1][1] === 'suika' && cols[2][1] === 'suika' && lineWin(cols) === null && clean(cols, { middle: 'suika' }),
    // チャンス目A はベルの小V (左上段・中中段・右上段)。中段はリプレイ・ベル・リプレイで入賞しない (仕様書 2026-10-21)
    chanceA: cols => left(cols, LEFT.BRX) && cols[1][1] === 'bell' && cols[2][0] === 'bell' && cols[2][1] === 'replay' && lineWin(cols) === null && clean(cols, { smallV: true }),
    chanceB: cols => left(cols, LEFT.SBR) && cols[1][1] === 'suika' && cols[2][1] === 'suika' && isBonus(cols[2][2]) && lineWin(cols) === null && clean(cols, { suikaTenpai: true }),
    // ボーナス図柄・こおりくん揃い (中段)
    big: cols => lineWin(cols) === 'big',
    reg: cols => lineWin(cols) === 'reg',
    epbig: cols => lineWin(cols) === 'koori',
    koori: cols => lineWin(cols) === 'koori',
    // ガセの「こおりを狙え」(仕様書・2026-10-21)。どれも中段にこおりくんが3つ揃わない
    //   順押し (左→中→右): 左中段こおりくん → 中中段こおりくん (テンパイ) → 右はこおりくんを下段に止めて外す
    kooriGaseJun: cols => cols[0][1] === 'koori' && cols[1][1] === 'koori' && cols[2][2] === 'koori' && lineWin(cols) === null && clean(cols),
    //   はさみ押し (左→右): 左中段こおりくん → 右はこおりくんを下段に止める (テンパイさせない) → 中は中段にこおりくんを止めない
    kooriGaseHasami: cols => cols[0][1] === 'koori' && cols[2][2] === 'koori' && cols[1][1] !== 'koori' && lineWin(cols) === null && clean(cols),
    //   中押し (中が第1停止): 中リールはこおりくんを枠下に止める。左右はこおりくんを枠下か枠下下まで飛ばす (枠の中にこおりくんなし)
    kooriGaseNaka: (cols, tops) => symbolAt(1, tops[1], 3) === 'koori' && kooriAt(tops, 0, [3, 4]) && kooriAt(tops, 2, [3, 4]) && !cols.some(col => col.includes('koori')) && lineWin(cols) === null && clean(cols),
    kooriGase: (cols, tops) => SHAPES.kooriGaseJun(cols, tops) || SHAPES.kooriGaseHasami(cols, tops) || SHAPES.kooriGaseNaka(cols, tops)
};

// 役ごとの左リールの窓 (A)。テストと検算に使う
export const LEFT_WINDOW = {
    none: LEFT.BRX, replay: LEFT.BRX, bell: LEFT.BRX, bellMiss: LEFT.BRX, chanceA: LEFT.BRX,
    chanceB: LEFT.SBR, weakSuika: LEFT.SBR, strongSuikaA: LEFT.SBR,
    strongSuikaB: LEFT.RSB,
    weakCherry: LEFT.RXC, strongCherry: LEFT.RXC,
    midCherry: LEFT.XCB
};

// 押し順ベルの形: 正解の押し順 nav に、押した順 (order) が合っているあいだは 'bell'、外れた時点で 'bellMiss'
// (第1停止が正解の1番目と違えばその時点で bellMiss。第2停止まで正解なら bell。順押しナビ [0, 1, 2] のときは押し順不問で bell)
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
            // 止めたリールの位置を変えずに、今の形が作れる組み合わせ (B の条件で絞ったあと、滑りが最少のところを選ぶ)
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
