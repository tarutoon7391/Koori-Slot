// =====================================================================
// ドット絵の共通の道具
// ---------------------------------------------------------------------
// 絵は「1ドット単位の矩形 r(x, y, w, h, 色) を重ねて描く関数」で表す (パチンコ版と同じ書き方)。
// 文字列のドット絵 (1文字 = 1ドット、パレットで色を割り当てる。'.' は透明) も fromRows で同じ形にできる。
// =====================================================================

// 文字列のドット絵を r(...) で描く関数にする
export function fromRows(palette, rows) {
    return r => rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
            const color = palette[row[x]];
            if (color) r(x, y, 1, 1, color);
        }
    });
}

// 3x5 ドットの小さい文字 (図柄・胸のプレートなどに使う)
const GLYPHS = {
    A: ['.#.', '#.#', '###', '#.#', '#.#'],
    E: ['###', '#..', '##.', '#..', '###'],
    K: ['#.#', '#.#', '##.', '#.#', '#.#'],
    M: ['#.#', '###', '#.#', '#.#', '#.#'],
    O: ['###', '#.#', '#.#', '#.#', '###'],
    P: ['##.', '#.#', '##.', '#..', '#..'],
    R: ['##.', '#.#', '##.', '#.#', '#.#'],
    S: ['###', '#..', '###', '..#', '###'],
    4: ['#.#', '#.#', '###', '..#', '..#']
};

// 3x5 の文字を並べて描く。scale はドットの大きさ (1 で 1ドット)
export function glyphText(r, text, x, y, color, scale = 1) {
    [...text].forEach((ch, i) => {
        (GLYPHS[ch] || []).forEach((row, gy) => {
            for (let gx = 0; gx < 3; gx++) {
                if (row[gx] === '#') r(x + (i * 4 + gx) * scale, y + gy * scale, scale, scale, color);
            }
        });
    });
}

// 絵を ctx に描く。(x, groundY) は足元の真ん中。
// flip: 左右反転 / silhouette: 黒い影 / tint: 全部をこの色で塗る (白く光る・金色に光るなど) / alpha: 透明度
export function drawArt(ctx, art, x, groundY, { scale = 2, frame = 0, flip = false, silhouette = false, tint = null, alpha = 1 } = {}) {
    const left = Math.round(x - (art.w * scale) / 2);
    const top = Math.round(groundY - art.h * scale);
    ctx.save();
    ctx.globalAlpha *= alpha;
    art.draw((rx, ry, rw, rh, color) => {
        const fx = flip ? art.w - rx - rw : rx;
        const x0 = Math.round(left + fx * scale), x1 = Math.round(left + (fx + rw) * scale);
        const y0 = Math.round(top + ry * scale), y1 = Math.round(top + (ry + rh) * scale);
        ctx.fillStyle = silhouette ? '#101018' : tint || color;
        ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }, frame);
    ctx.restore();
}
