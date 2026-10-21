// =====================================================================
// リール図柄のドット絵 (32x32 ドット)
// ---------------------------------------------------------------------
// 前作のこおりくんスロット (koori/js/sprites.js) の図柄をもとにしている。
// リプレイだけ、レモンから「青い丸に REP」に変えた (2026-10-20 ユーザー指定)。前作のダイヤは使わない。
// こおりくん図柄は仕様書 (リール配列 v1.0) で足された、払い出しのない AT 系の告知専用の図柄。
// r(x, y, w, h, 色) で矩形、disc(cx, cy, 半径, 色) で円を描く。
// =====================================================================

import { glyphText } from './pixel.js';
import { STRING_SPRITES } from './characters-legacy.js';

export const SYMBOL_IDS = ['seven', 'bar', 'koori', 'bell', 'replay', 'cherry', 'suika'];

export const SYMBOL_NAMES = { seven: '7', bar: 'BAR', koori: 'こおりくん', bell: 'ベル', replay: 'リプレイ', cherry: 'チェリー', suika: 'スイカ' };

export const SYMBOL_ART = {
    cherry(r, disc) {
        for (let k = 0; k < 13; k++) {
            r(Math.round(16 - k * 0.5), 5 + k, 2, 1, '#2f7a22');
            r(Math.round(16 + k * 0.5), 5 + k, 2, 1, '#2f7a22');
        }
        r(17, 3, 6, 3, '#4ab83a');
        r(18, 3, 3, 1, '#7ad86a');
        disc(10, 23, 6, '#8a0818');
        disc(10, 23, 5, '#d81830');
        disc(22, 23, 6, '#8a0818');
        disc(22, 23, 5, '#d81830');
        r(7, 20, 2, 2, '#ff8090');
        r(19, 20, 2, 2, '#ff8090');
    },
    replay(r, disc) {
        // 青い丸に REP
        disc(16, 16, 14, '#0a2a6a');
        disc(16, 16, 13, '#2a6ae0');
        disc(16, 16, 10, '#3a86ff');
        r(9, 6, 6, 2, '#a8d0ff');
        glyphText(r, 'REP', 5, 11, '#ffffff', 2);
    },
    suika(r) {
        // スイカの切り身 (下向きの半円)
        for (let y = 0; y <= 14; y++) {
            const outer = Math.round(Math.sqrt(196 - y * y));
            const inner = Math.round(Math.sqrt(Math.max(0, 121 - y * y)));
            r(16 - outer, 9 + y, outer * 2, 1, '#1e6a1e');
            if (y <= 12) r(16 - outer + 1, 9 + y, outer * 2 - 2, 1, '#e8f8d8');
            if (y <= 11) r(16 - inner, 9 + y, inner * 2, 1, '#e83040');
        }
        [[10, 12], [16, 13], [22, 12], [13, 16], [19, 16], [16, 19]].forEach(([x, y]) => r(x, y, 1, 2, '#1a1a1a'));
        r(5, 9, 22, 1, '#ff7080');
    },
    bell(r, disc) {
        r(15, 3, 2, 2, '#a07a10');
        for (let y = 5; y <= 22; y++) {
            const half = Math.round(3 + (y - 5) * 0.55 + (y > 18 ? (y - 18) : 0));
            r(16 - half, y, half * 2, 1, '#a07a10');
            r(17 - half, y, half * 2 - 2, 1, '#ffd23a');
        }
        r(4, 23, 24, 3, '#a07a10');
        r(5, 23, 22, 2, '#ffe680');
        disc(16, 27, 2, '#a07a10');
        r(11, 8, 2, 9, '#fff4b0');
    },
    seven(r) {
        const stroke = (dx, dy, color) => {
            r(6 + dx, 4 + dy, 21, 6, color);
            for (let y = 10; y <= 27; y++) r(Math.round(21 - (y - 10) * 0.6) + dx, y + dy, 6, 1, color);
        };
        stroke(1, 1, '#5a0008');
        stroke(0, 0, '#e01020');
        r(7, 5, 18, 1, '#ff8a8a');
    },
    koori(r) {
        // こおりくん (キャラのドット絵を 1.25倍) の後ろに氷色の長方形 (2026-10-21 ユーザー指定: 丸から長方形に)
        r(1, 5, 30, 23, '#1b3a6b');
        r(2, 6, 28, 21, '#dff6ff');
        r(2, 23, 28, 4, '#bfe6f7');
        r(3, 7, 4, 1, '#ffffff');
        const s = STRING_SPRITES.koori;
        s.frames.walk1.forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
                const color = s.palette[row[x]];
                if (color) r(x * 1.25 + 6, y * 1.25 + 7, 1.25, 1.25, color);
            }
        });
    },
    bar(r) {
        r(2, 8, 28, 16, '#000000');
        r(3, 9, 26, 14, '#ffffff');
        r(4, 10, 24, 12, '#1a1a1a');
        const letters = {
            B: ['####.', '#...#', '####.', '#...#', '####.'],
            A: ['.###.', '#...#', '#####', '#...#', '#...#'],
            R: ['####.', '#...#', '####.', '#..#.', '#...#']
        };
        ['B', 'A', 'R'].forEach((ch, i) => {
            letters[ch].forEach((row, ry) => {
                for (let rx = 0; rx < 5; rx++) if (row[rx] === '#') r(6 + i * 7 + rx, 13 + ry, 1, 1, '#ffffff');
            });
        });
    }
};

// 図柄を ctx に描く。(x, y) は左上、size は描く大きさ (ドット数 32 の倍数だときれい)
export function drawSymbol(ctx, id, x, y, size = 32) {
    const k = size / 32;
    const r = (rx, ry, w, h, color) => {
        ctx.fillStyle = color;
        const x0 = Math.round(x + rx * k), y0 = Math.round(y + ry * k);
        ctx.fillRect(x0, y0, Math.round(x + (rx + w) * k) - x0, Math.round(y + (ry + h) * k) - y0);
    };
    const disc = (cx, cy, rad, color) => {
        for (let dy = -rad; dy <= rad; dy++) {
            const half = Math.round(Math.sqrt(rad * rad - dy * dy));
            r(cx - half, cy + dy, half * 2, 1, color);
        }
    };
    SYMBOL_ART[id](r, disc);
}
