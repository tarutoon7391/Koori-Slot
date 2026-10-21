// =====================================================================
// リール配列 v1.0 (仕様書 2026-10-20 確定) と、出目の見方
// ---------------------------------------------------------------------
// 各リール 21コマ。番号は上から順で、リールは下方向へ回る (止まる位置 top の上段が strip[top]、中段が strip[top+1]、下段が strip[top+2])。
// 下へ回るので、押してから k コマ滑ると上段は strip[top - k] になる。
// =====================================================================

const LETTERS = { S: 'suika', B: 'bell', R: 'replay', C: 'cherry', X: 'bar', 7: 'seven', K: 'koori' };

export const STRIPS = [
    'SBRXCBRSBR7CBRSBRKCBR',
    'XRBS7RBKRBSXRB7RBSKRB',
    'XBRS7BRKBRSXBR7BRSKBR'
].map(s => [...s].map(c => LETTERS[c]));

export const REEL_LENGTH = 21;

// ボーナス図柄 (仕様書: BAR・7・こおりくんの3種。7・7・7 = BIG / 7・7・BAR = REG / こおりくん×3 = エピソードBIG)
export const BONUS_SYMBOLS = new Set(['bar', 'seven', 'koori']);

export const wrap = i => ((i % REEL_LENGTH) + REEL_LENGTH) % REEL_LENGTH;

// リール reel が上段 top で止まったときの見える3つ (上段・中段・下段)
export function windowAt(reel, top) {
    return [0, 1, 2].map(row => STRIPS[reel][wrap(top + row)]);
}

// 3つのリールの止まる位置から出目を作る。cols[リール][段]
export function gridAt(tops) {
    return tops.map((top, reel) => windowAt(reel, top));
}

// 中段 (入賞ラインは中段1本) の入賞。なければ null
// こおりくん揃いは、エピソードBIG の入賞も「こおりを狙え」の揃いも 'koori' (仕様書 2026-10-21。BAR・BAR・BAR は役ではない)
export function middleWin(cols) {
    const [a, b, c] = cols.map(col => col[1]);
    if (a === b && b === c) {
        if (a === 'bell' || a === 'replay' || a === 'koori') return a;
        if (a === 'seven') return 'big';
    }
    if (a === 'seven' && b === 'seven' && c === 'bar') return 'reg';
    return null;
}
