// =====================================================================
// リールの動き (canvas)
// ---------------------------------------------------------------------
// 位置 pos は「上段にある図柄の番号」(小数)。リールは下へ回るので pos は減っていく。
// 図柄 i は y = (i - pos) * cell に描く。押したときの番号は floor(pos) (内部処理の stop に渡す)。
// 止まる位置 (上段の番号) は内部処理が決め、そこまで回して少し弾ませて止める。
// =====================================================================

import { drawSymbol } from '../art/symbols.js';

const SPEED = 28;        // 1秒に回る図柄の数 (約80回転/分)
const BOUNCE_MS = 110;

export function createReelView(strips) {
    const len = strips[0].length;
    const reels = strips.map(() => ({ pos: Math.floor(Math.random() * len), state: 'stopped', target: 0, bounceAt: 0 }));
    let canvas = null;
    let ctx = null;
    let cell = 64;
    let last = performance.now();
    let raf = 0;
    let onSettled = null;
    let symbolCache = {};
    let highlight = null;   // { cells: [[リール, 段]], color, until }

    const wrap = x => ((x % len) + len) % len;

    function symbolCanvas(id) {
        const key = `${id}:${cell}`;
        if (!symbolCache[key]) {
            const c = document.createElement('canvas');
            const k = window.devicePixelRatio || 1;
            c.width = Math.round(cell * k);
            c.height = Math.round(cell * k);
            const g = c.getContext('2d');
            g.scale(k, k);
            drawSymbol(g, id, cell * 0.12, cell * 0.12, cell * 0.76);
            symbolCache[key] = c;
        }
        return symbolCache[key];
    }

    function attach(el) {
        canvas = el;
        ctx = el.getContext('2d');
        resize();
        cancelAnimationFrame(raf);
        last = performance.now();
        raf = requestAnimationFrame(frame);
    }

    function resize() {
        if (!canvas) return;
        const k = window.devicePixelRatio || 1;
        const w = canvas.clientWidth;
        cell = Math.min(Math.round(w / 4.2), 100);
        canvas.width = Math.round(w * k);
        canvas.height = Math.round(cell * 3 * k);
        canvas.style.height = `${cell * 3}px`;
        ctx.setTransform(k, 0, 0, k, 0, 0);
        symbolCache = {};
    }

    function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        let settledNow = false;
        reels.forEach(r => {
            if (r.state === 'spinning') r.pos = wrap(r.pos - SPEED * dt);
            else if (r.state === 'stopping') {
                const remain = wrap(r.pos - r.target);
                const step = SPEED * dt;
                if (remain <= step || remain > len - 0.001) {
                    r.pos = r.target;
                    r.state = 'bounce';
                    r.bounceAt = now;
                } else r.pos = wrap(r.pos - step);
            } else if (r.state === 'bounce' && now - r.bounceAt > BOUNCE_MS) {
                r.state = 'stopped';
                settledNow = true;
            }
        });
        draw(now);
        if (settledNow && reels.every(r => r.state === 'stopped') && onSettled) {
            const fn = onSettled;
            onSettled = null;
            fn();
        }
        raf = requestAnimationFrame(frame);
    }

    function draw(now) {
        if (!ctx) return;
        const w = canvas.clientWidth;
        ctx.clearRect(0, 0, w, cell * 3);
        reels.forEach((r, i) => {
            // 押し順ナビ (3等分の真ん中) とそろえる
            const x = Math.round((w * (1 + 2 * i)) / 6 - cell / 2);
            const grad = ctx.createLinearGradient(0, 0, 0, cell * 3);
            grad.addColorStop(0, '#b8bec8');
            grad.addColorStop(0.18, '#ffffff');
            grad.addColorStop(0.82, '#ffffff');
            grad.addColorStop(1, '#b8bec8');
            ctx.fillStyle = grad;
            ctx.fillRect(x, 0, cell, cell * 3);
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, 0, cell, cell * 3);
            ctx.clip();
            let pos = r.pos;
            if (r.state === 'bounce') pos -= Math.sin(((now - r.bounceAt) / BOUNCE_MS) * Math.PI) * 0.08;
            const first = Math.floor(pos) - 1;
            for (let k = first; k <= first + 4; k++) {
                const y = (k - pos) * cell;
                const id = strips[i][wrap(k)];
                const blur = r.state === 'spinning';
                ctx.globalAlpha = blur ? 0.75 : 1;
                ctx.drawImage(symbolCanvas(id), x, y, cell, cell);
            }
            ctx.globalAlpha = 1;
            // 光らせる図柄 (そろったところ)
            if (highlight && now < highlight.until && r.state === 'stopped') {
                highlight.cells.filter(([reel]) => reel === i).forEach(([, row]) => {
                    ctx.globalAlpha = 0.35 + Math.sin(now / 90) * 0.15;
                    ctx.fillStyle = highlight.color;
                    ctx.fillRect(x, row * cell, cell, cell);
                    ctx.globalAlpha = 1;
                });
            }
            ctx.restore();
        });
        // 入賞ライン: 中段 (リプレイ・ボーナス・こおりくん) と右下がり (ベル)。内部処理 v0.3 (docs/events.md) に合わせて右下がりを足した (要確認)
        ctx.strokeStyle = 'rgba(255, 60, 60, .35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, cell * 1.5);
        ctx.lineTo(w, cell * 1.5);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 220, 60, .3)';
        ctx.beginPath();
        ctx.moveTo(0, cell * 0.5);
        ctx.lineTo(w, cell * 2.5);
        ctx.stroke();
    }

    return {
        attach,
        resize,
        detach: () => cancelAnimationFrame(raf),
        spin() {
            reels.forEach(r => { r.state = 'spinning'; });
            highlight = null;
        },
        // 押したときの番号 (上段にかかっている図柄)
        pressIndex: reel => wrap(Math.floor(reels[reel].pos)),
        stopAt(reel, top) {
            const r = reels[reel];
            r.target = top;
            r.state = 'stopping';
        },
        isSpinning: reel => reels[reel].state === 'spinning',
        anyMoving: () => reels.some(r => r.state !== 'stopped'),
        // 全部止まったら fn を1回呼ぶ
        whenSettled(fn) {
            if (reels.every(r => r.state === 'stopped')) fn();
            else onSettled = fn;
        },
        highlight(cells, color = '#ffe040', ms = 1500) {
            highlight = { cells, color, until: performance.now() + ms };
        }
    };
}
