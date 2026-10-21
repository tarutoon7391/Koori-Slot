// =====================================================================
// 液晶の絵の道具 (文字・背景・キャラ・カットイン・リールの絵など)
// ---------------------------------------------------------------------
// 液晶は 320x180 ドットで描き、表示するときに拡大する。
// ゲームの液晶 (lcd/scenes.js) と、画面設計書の画面イメージ (tools/design/mockups.js) の両方で使う。
// =====================================================================

import { drawArt } from '../art/pixel.js';
import { ART } from '../art/characters.js';
import { drawSymbol } from '../art/symbols.js';

export const W = 320, H = 180, GROUND = 150;
export const DISPLAY = '"Dela Gothic One", "Yu Gothic", sans-serif';
export const BODY = '"Zen Kaku Gothic New", "Yu Gothic", sans-serif';
export const RAINBOW = ['#ff3040', '#ff9a20', '#ffe040', '#40d060', '#30a0ff', '#8050ff'];

// ----- 道具 -----
export function seeded(seed) {
    return () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
    };
}

// 体に文字があるキャラ (大魔王ASO の「ASO」・マキビコンの「MK4」) は、左右反転すると鏡文字になるので反転しない
const NO_FLIP = new Set(['maou', 'makibikon']);

export function ch(ctx, id, x, ground, opts = {}) {
    drawArt(ctx, ART[id], x, ground, NO_FLIP.has(id) ? { ...opts, flip: false } : opts);
}

// weight: 太さ ('700' など。BODY の字を太くするとき)
export function text(ctx, s, x, y, { size = 14, color = '#ffffff', stroke = '#000000', lw = 3, align = 'center', font = DISPLAY, weight = '' } = {}) {
    ctx.save();
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lw;
        ctx.strokeText(s, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
    ctx.restore();
}

export function rainbow(ctx, x0, y0, x1, y1) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    RAINBOW.forEach((c, i) => g.addColorStop(i / (RAINBOW.length - 1), c));
    return g;
}

export function vgrad(ctx, y0, y1, stops) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
    return g;
}

export function rect(ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
}

export function roundRect(ctx, x, y, w, h, rad, fill, stroke) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, rad);
    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

// 放射状の集中線
export function rays(ctx, cx, cy, colors, count = 24, alpha = 0.5) {
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let i = 0; i < count; i++) {
        const a0 = (i / count) * Math.PI * 2, a1 = a0 + Math.PI / count;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a0) * 400, cy + Math.sin(a0) * 400);
        ctx.lineTo(cx + Math.cos(a1) * 400, cy + Math.sin(a1) * 400);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
    }
    ctx.restore();
}

// 摩天楼の部屋。sky: 窓の外の色 (上→下) / wall・floor: 壁と床の色
export function room(ctx, { sky, wall, floor, cityColor = '#1a2230', lights = '#ffe9a0', stars = false }) {
    rect(ctx, 0, 0, W, H, wall);
    const rnd = seeded(11);
    for (let i = 0; i < 4; i++) {
        const x = 12 + i * 76, y = 14, w = 68, h = 104;
        rect(ctx, x, y, w, h, vgrad(ctx, y, y + h, sky));
        if (stars) for (let s = 0; s < 8; s++) rect(ctx, x + rnd() * w, y + rnd() * 50, 1, 1, '#ffffff');
        // 窓の下に見える街
        for (let bx = x; bx < x + w; bx += 6 + Math.floor(rnd() * 6)) {
            const bh = 10 + rnd() * 30;
            rect(ctx, bx, y + h - bh, 5, bh, cityColor);
            for (let ly = y + h - bh + 3; ly < y + h - 2; ly += 4) if (rnd() < 0.35) rect(ctx, bx + 1, ly, 1, 1, lights);
        }
        rect(ctx, x + w / 2 - 1, y, 2, h, 'rgba(0,0,0,.35)');
        ctx.strokeStyle = 'rgba(0,0,0,.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
    }
    rect(ctx, 0, 124, W, 4, 'rgba(0,0,0,.35)');
    rect(ctx, 0, 128, W, H - 128, vgrad(ctx, 128, H, floor));
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    ctx.lineWidth = 1;
    for (let x = -160; x < W + 160; x += 32) {
        ctx.beginPath();
        ctx.moveTo(W / 2 + (x - W / 2) * 0.35, 128);
        ctx.lineTo(x, H);
        ctx.stroke();
    }
}

// 左上の階の表示
export function floorTag(ctx, label, sub, color = '#8fd6f7') {
    ctx.save();
    ctx.font = `13px ${DISPLAY}`;
    const lw = ctx.measureText(label).width;
    ctx.font = `9px ${BODY}`;
    const sw = sub ? ctx.measureText(sub).width + 10 : 0;
    ctx.restore();
    roundRect(ctx, 6, 6, lw + 16 + sw, 22, 3, 'rgba(5,10,16,.85)', color);
    text(ctx, label, 14, 17.5, { size: 13, color, stroke: null, align: 'left' });
    if (sub) text(ctx, sub, 14 + lw + 8, 17.5, { size: 9, color: '#e8f6ff', stroke: null, font: BODY, align: 'left' });
}

// ふるカワのナビ (左下に小さく出て、吹き出しでしゃべる)
export function navi(ctx, line) {
    ch(ctx, 'furukawa', 22, 176, { scale: 2 });
    ctx.font = `10px ${BODY}`;
    const w = Math.min(250, ctx.measureText(line).width + 16);
    roundRect(ctx, 44, 140, w, 22, 6, 'rgba(255,255,255,.94)', '#ff4f8b');
    ctx.beginPath();
    ctx.moveTo(44, 154);
    ctx.lineTo(38, 158);
    ctx.lineTo(46, 150);
    ctx.fillStyle = 'rgba(255,255,255,.94)';
    ctx.fill();
    text(ctx, line, 52, 151, { size: 10, color: '#2a1a1a', stroke: null, align: 'left', font: BODY });
}

// こおりくんのチーム (左から歩いてくる)
export function team(ctx, x = 70, ground = GROUND, scale = 2) {
    ch(ctx, 'dake', x - 52, ground, { scale });
    ch(ctx, 'tamu', x - 34, ground, { scale });
    ch(ctx, 'yasu', x - 16, ground, { scale });
    ch(ctx, 'onioni', x + 16, ground, { scale: scale * 0.8 });
    ch(ctx, 'koori', x + 50, ground, { scale: scale * 1.2 });
}

// 黒い靄 (魔天ゾーン)
export function haze(ctx) {
    const g = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 210);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.6, 'rgba(8,0,14,.55)');
    g.addColorStop(1, 'rgba(4,0,8,.97)');
    rect(ctx, 0, 0, W, H, g);
    const rnd = seeded(5);
    for (let i = 0; i < 46; i++) {
        const t = rnd();
        const side = Math.floor(rnd() * 4);
        const x = side === 0 ? t * W : side === 1 ? W : side === 2 ? t * W : 0;
        const y = side === 0 ? 0 : side === 1 ? t * H : side === 2 ? H : t * H;
        ctx.beginPath();
        ctx.arc(x, y, 10 + rnd() * 22, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${10 + rnd() * 20},0,${20 + rnd() * 20},.5)`;
        ctx.fill();
    }
}

// カットイン (斜めの帯にキャラの顔と文字)
export function cutin(ctx, y, h, color, id, line, { scale = 3, flip = false, textColor = '#ffffff' } = {}) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, y + 10);
    ctx.lineTo(W, y);
    ctx.lineTo(W, y + h - 10);
    ctx.lineTo(0, y + h);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.clip();
    ctx.globalAlpha = 0.25;
    for (let i = -10; i < 40; i++) rect(ctx, i * 12, y, 4, h, '#ffffff');
    ctx.globalAlpha = 1;
    ch(ctx, id, 70, y + h + ART[id].h * scale * 0.35, { scale, flip });
    ctx.restore();
    text(ctx, line, 210, y + h / 2, { size: 18, color: textColor, lw: 4 });
}

// リール (3段 x 3リール)。grid[段][リール] は図柄の id
export function reels(ctx, x, y, cell, grid, { line = null } = {}) {
    for (let i = 0; i < 3; i++) {
        const rx = x + i * (cell + 8);
        rect(ctx, rx - 2, y - 2, cell + 4, cell * 3 + 4, '#0a0e14');
        rect(ctx, rx, y, cell, cell * 3, vgrad(ctx, y, y + cell * 3, ['#c8ccd4', '#ffffff', '#ffffff', '#c8ccd4']));
        for (let row = 0; row < 3; row++) {
            const id = grid[row][i];
            if (id) drawSymbol(ctx, id, rx + cell * 0.1, y + row * cell + cell * 0.1, cell * 0.8);
        }
    }
    if (line) {
        ctx.save();
        ctx.strokeStyle = line;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(x - 6, y + cell * 1.5);
        ctx.lineTo(x + cell * 3 + 22, y + cell * 1.5);
        ctx.stroke();
        ctx.restore();
    }
}

// 小さいリールの出目 (レア役の図に使う)。mark: 光らせる位置 [[段, リール], ...]
export function miniReels(ctx, x, y, grid, mark = [], cell = 18) {
    rect(ctx, x - 3, y - 3, cell * 3 + 10, cell * 3 + 6, '#0a0e14');
    for (let i = 0; i < 3; i++) {
        const rx = x + i * (cell + 2);
        rect(ctx, rx, y, cell, cell * 3, '#f4f6f8');
        for (let row = 0; row < 3; row++) {
            if (mark.some(([mr, mi]) => mr === row && mi === i)) rect(ctx, rx, y + row * cell, cell, cell, '#ffe680');
            const id = grid[row][i];
            if (id) drawSymbol(ctx, id, rx + 1, y + row * cell + 1, cell - 2);
        }
    }
}

// PUSH ボタン。fill: 色 (グラデーションも可) / pop: 飛び出し
export function pushButton(ctx, cx, cy, rad, fill, { pop = false, label = 'PUSH' } = {}) {
    if (pop) {
        rect(ctx, cx - rad * 0.7, cy, rad * 1.4, rad * 0.9, '#3a3a44');
        cy -= rad * 0.7;
    }
    ctx.beginPath();
    ctx.arc(cx, cy + 3, rad + 3, 0, Math.PI * 2);
    ctx.fillStyle = '#20242c';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - rad * 0.3, cy - rad * 0.35, rad * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.fill();
    text(ctx, label, cx, cy + 1, { size: rad * 0.42, color: '#ffffff', lw: 2.5, stroke: 'rgba(0,0,0,.55)' });
}

// 上乗せのゲーム数 (金の大きな文字)
export function plusGames(ctx, s, x = 230, y = 50, size = 34) {
    const g = vgrad(ctx, y - size / 2, y + size / 2, ['#fff6b0', '#ffd23a', '#c88a10']);
    text(ctx, s, x, y, { size, color: g, lw: 6, stroke: '#3a1a00' });
}

// こおりくんの武器
export function weapon(ctx, kind, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.6);
    if (kind === 'sword') {
        rect(ctx, -2, -46, 6, 44, '#bff0ff');
        rect(ctx, -2, -46, 2, 44, '#ffffff');
        rect(ctx, -8, -2, 18, 4, '#4aa8e0');
        rect(ctx, -1, 2, 4, 10, '#1b3a6b');
    } else if (kind === 'hammer') {
        rect(ctx, -1, -30, 4, 42, '#7a5a3a');
        rect(ctx, -16, -48, 34, 22, '#bff0ff');
        rect(ctx, -16, -48, 34, 4, '#ffffff');
        rect(ctx, -16, -30, 34, 4, '#7fd3f7');
    } else {
        rect(ctx, -6, -110, 14, 106, rainbow(ctx, 0, -110, 0, 0));
        rect(ctx, -6, -110, 4, 106, 'rgba(255,255,255,.6)');
        rect(ctx, -16, -4, 34, 6, '#ffd700');
        rect(ctx, -2, 2, 6, 14, '#5a0a3a');
    }
    ctx.restore();
}

// 上乗せの場面: 攻撃するキャラ・相手・ゲーム数
export function attackScene(ctx, attacker, enemy, plus, extra) {
    room(ctx, { sky: ['#1a1030', '#4a2a6a'], wall: '#2a2238', floor: ['#3a3048', '#1a1424'], stars: true });
    rect(ctx, 0, 0, W, H, 'rgba(10,0,30,.35)');
    rays(ctx, 220, 110, ['#ffffff', 'rgba(255,255,255,0)'], 30, 0.18);
    ch(ctx, enemy, 230, GROUND, { scale: ART[enemy].w > 40 ? 1.6 : 2, tint: '#ffffff', alpha: 0.35 });
    ch(ctx, enemy, 234, GROUND, { scale: ART[enemy].w > 40 ? 1.6 : 2 });
    ch(ctx, attacker, 100, 146, { scale: attacker === 'koori' ? 3 : 2.2, flip: attacker === 'onioni' });
    // 当たった光
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2, rr = i % 2 ? 10 : 24;
        ctx.lineTo(205 + Math.cos(a) * rr, 105 + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = '#fff6b0';
    ctx.fill();
    ctx.restore();
    plusGames(ctx, plus);
    if (extra) extra();
    rect(ctx, 0, 0, W, 16, 'rgba(0,0,0,.6)');
    text(ctx, 'こおりバトルRASH', 8, 8.5, { size: 9, align: 'left', stroke: null, color: '#8fd6f7' });
    text(ctx, '残り 37G', W - 8, 8.5, { size: 9, align: 'right', stroke: null });
}

// AT の背景 (疾走感のある青い線)
export function atBackground(ctx) {
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#061a3a', '#0b3a78', '#0a1a30']));
    const rnd = seeded(3);
    for (let i = 0; i < 40; i++) rect(ctx, rnd() * W, rnd() * 130, 20 + rnd() * 60, 1, 'rgba(140,215,250,.45)');
    rect(ctx, 0, 130, W, 50, vgrad(ctx, 130, H, ['#122a4a', '#060e1a']));
}

// ASO摩天楼のシルエット
export function tower(ctx, cx, base, height, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - 40, base);
    ctx.lineTo(cx - 28, base - height * 0.7);
    ctx.lineTo(cx - 18, base - height * 0.9);
    ctx.lineTo(cx, base - height);
    ctx.lineTo(cx + 18, base - height * 0.9);
    ctx.lineTo(cx + 28, base - height * 0.7);
    ctx.lineTo(cx + 40, base);
    ctx.fill();
}
