// =====================================================================
// 液晶の場面: 必殺技のカットインと、敵のセリフの吹き出し (前作のスロットと同じ見せ方。画面設計書 11章)
// ---------------------------------------------------------------------
// カットイン: 斜めに入ってくる帯に、キャラの絵と技の名前。上に「○○の必殺技!!」
// 吹き出し: 画面の右上 (敵は右にいることが多い) に、名前とセリフ
// どれを出すかは director.js が決め、ここは描くだけ。since はミリ秒。
// =====================================================================

import { ART, characterName } from '../art/characters.js';
import { BODY, W, ch, rect, roundRect, text } from './kit.js';

export const CUTIN_MS = 1400;   // 必殺技のカットインを出す時間
export const TALK_MS = 1900;    // 吹き出しを出す時間

const ease = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

// cut: { who, name, side: 'ally' | 'enemy' }
export function drawSpecialCutin(ctx, t, since, cut) {
    const enemy = cut.side === 'enemy';
    const color = enemy ? '#5a0a0a' : cut.who === 'koori' ? '#0a3a6a' : '#1a6a50';
    const slide = since < 200 ? 1 - ease(since / 200) : since > CUTIN_MS - 180 ? -ease((since - CUTIN_MS + 180) / 180) : 0;
    const y = 34, h = 76;
    ctx.save();
    // 後ろを少し暗く
    rect(ctx, 0, 0, W, 180, 'rgba(0,0,0,.35)');
    ctx.beginPath();
    ctx.rect(0, y, W, h);
    ctx.clip();
    ctx.translate(Math.round(slide * W), 0);
    rect(ctx, 0, y, W, h, color);
    // 流れる線
    for (let i = 0; i < 14; i++) {
        const ly = y + ((i * 23 + Math.floor(t / 30) * 7) % h);
        rect(ctx, 0, ly, W, 1, 'rgba(255,255,255,.3)');
    }
    // キャラ (左)
    const art = ART[cut.who];
    if (art) {
        const scale = Math.min(3.2, 70 / art.h, 110 / art.w);
        ch(ctx, cut.who, 62, y + h - 2, { scale });
    }
    // 技の名前 (右)。長いときは小さく
    let size = 22;
    ctx.save();
    ctx.font = `${size}px "Dela Gothic One", sans-serif`;
    while (size > 11 && ctx.measureText(cut.name).width > W - 130) {
        size -= 1;
        ctx.font = `${size}px "Dela Gothic One", sans-serif`;
    }
    ctx.restore();
    const sub = `${characterName(cut.who)}の必殺技!!`;
    text(ctx, sub.length > 16 ? '必殺技!!' : sub, W - 12, y + 14, { size: 11, align: 'right', color: '#ffe45a', lw: 3 });
    text(ctx, cut.name, W - 12, y + h / 2 + 8, { size, align: 'right', color: '#ffffff', lw: 5 });
    ctx.restore();
    rect(ctx, 0, y - 1, W, 1, '#000000');
    rect(ctx, 0, y + h, W, 1, '#000000');
}

// talk: { who, line }。画面の右上に吹き出し (しっぽは右下へ)
export function drawTalk(ctx, t, since, talk) {
    const a = since < 150 ? since / 150 : since > TALK_MS - 250 ? Math.max(0, (TALK_MS - since) / 250) : 1;
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    let size = 11;
    ctx.font = `700 ${size}px ${BODY}`;
    let w = ctx.measureText(talk.line).width;
    while (w > 200 && size > 8) {
        size -= 0.5;
        ctx.font = `700 ${size}px ${BODY}`;
        w = ctx.measureText(talk.line).width;
    }
    const bw = Math.min(220, Math.max(90, w + 20));
    const x = W - bw - 10, y = 28, bh = 34;
    roundRect(ctx, x, y, bw, bh, 8, 'rgba(255,255,255,.96)', '#3a0008');
    ctx.beginPath();
    ctx.moveTo(x + bw - 34, y + bh - 1);
    ctx.lineTo(x + bw - 18, y + bh + 10);
    ctx.lineTo(x + bw - 22, y + bh - 1);
    ctx.fillStyle = 'rgba(255,255,255,.96)';
    ctx.fill();
    text(ctx, characterName(talk.who), x + 10, y + 9, { size: 8, align: 'left', color: '#a01020', stroke: null, font: BODY, weight: '700' });
    text(ctx, talk.line, x + 10, y + 23, { size, align: 'left', color: '#1a0a10', stroke: null, font: BODY, weight: '700' });
    ctx.restore();
}
