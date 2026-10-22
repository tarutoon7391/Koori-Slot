// =====================================================================
// 液晶の場面: 戦闘の技のエフェクトと激突 (2026-10-21 ユーザー指定: 敵と激突したり、技を使ったりする)
// ---------------------------------------------------------------------
// 前作のスロットの「技ごとのエフェクト」と同じ考え方で、技ごとに見た目を変える。
//   drawSkillFx: 技を出す側 (from) から相手 (to) へ技が飛んでいき、当たったところで光る。SKILL_MS で終わる
//   drawClash:   2人がぶつかったところの火花・衝撃の輪・文字
// どれを出すかは director.js が決め、ここは描くだけ。since はミリ秒。
// =====================================================================

import { BODY, RAINBOW, W, rainbow, rect, seeded, text } from './kit.js';

export const SKILL_MS = 1100;   // 技を出してから当たって光が消えるまで
export const HIT_AT = 0.55;     // 技が当たる時刻 (SKILL_MS の割合)

// キャラの id (と こおりくんの武器) → 技の見た目
export const SKILL_KIND = {
    koori: 'ice', yasu: 'fist', tamu: 'kick', dake: 'chop', onioni: 'club',
    sword: 'slash', hammer: 'hammer', kill: 'rainbowSword', bossKill: 'rainbowSword', maouKill: 'rainbowSword',
    okagappa: 'beam', hibikimakuri: 'rings', yamamou: 'bones',
    sasaki: 'slash', kotani: 'tempo', asahara: 'bigFist',
    shibata: 'slam', ikekimu: 'dash', ueno: 'bigFist',
    harry: 'needles', urashima: 'smoke', makibikon: 'missiles', nakata: 'water', goldDog: 'bite',
    daishi: 'sutra', zumitani: 'kunai', runaya: 'moon', nozoema: 'bigSlash', maou: 'fire'
};

const BEAM_COLORS = { beam: ['#9aff8a', '#2ac04a'], water: ['#bfe8ff', '#3a8aff'], moon: ['#f0e0ff', '#a060ff'], fire: ['#ffe080', '#ff4a1a'] };
const ease = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const lerp = (a, b, k) => a + (b - a) * k;

// 当たったところの光 (星形) と飛び散る粒
function impact(ctx, t, x, y, k, color = '#fff6b0', big = false) {
    if (k <= 0 || k >= 1) return;
    const r = (big ? 34 : 24) * ease(k * 2);
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2, rr = i % 2 ? r * 0.4 : r;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    const rnd = seeded(Math.floor(x + y));
    for (let i = 0; i < 12; i++) {
        const a = rnd() * Math.PI * 2, d = k * (30 + rnd() * 40);
        rect(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, 3, 3, i % 2 ? '#ffffff' : color);
    }
    ctx.restore();
}

// 技のエフェクト。from / to: { x, y } (技を出す側・受ける側の体のまんなかあたり)
export function drawSkillFx(ctx, t, since, kind, from, to) {
    const p = since / SKILL_MS;
    const go = Math.min(1, p / HIT_AT);           // 飛んでいく (0 → 1)
    const after = (p - HIT_AT) / (1 - HIT_AT);    // 当たったあと (0 → 1)
    const dir = to.x >= from.x ? 1 : -1;
    ctx.save();
    switch (kind) {
        case 'beam': case 'water': case 'moon': case 'fire': {
            // 口・手元から光線がのびて当たる
            const [c1, c2] = BEAM_COLORS[kind];
            const x1 = lerp(from.x, to.x, ease(go));
            const h = kind === 'fire' ? 14 : 9;
            ctx.globalAlpha = after > 0 ? Math.max(0, 1 - after) : 1;
            const g = ctx.createLinearGradient(0, from.y - h, 0, from.y + h);
            g.addColorStop(0, c2);
            g.addColorStop(0.5, '#ffffff');
            g.addColorStop(1, c2);
            rect(ctx, Math.min(from.x, x1), from.y - h / 2 + Math.sin(t / 30) * 1, Math.abs(x1 - from.x), h, g);
            if (kind === 'moon') for (let i = 0; i < 3; i++) text(ctx, '☾', lerp(from.x, x1, (i + 1) / 4), from.y - 12, { size: 10, color: c1, stroke: null });
            if (kind === 'water') for (let i = 0; i < 6; i++) rect(ctx, lerp(from.x, x1, i / 6), from.y + 8 + Math.sin(t / 60 + i) * 3, 3, 3, c1);
            ctx.globalAlpha = 1;
            impact(ctx, t, to.x, to.y, after, c1, kind === 'fire');
            break;
        }
        case 'fist': case 'bigFist': {
            // 大きな拳が飛んでいく
            const s = kind === 'bigFist' ? 1.8 : 1.1;
            const x = lerp(from.x, to.x, ease(go));
            if (after < 0) {
                ctx.save();
                ctx.translate(x, to.y);
                ctx.scale(dir * s, s);
                rect(ctx, -10, -9, 18, 18, kind === 'bigFist' ? '#d89a6a' : '#f0c8a0');
                rect(ctx, 8, -9, 4, 18, '#c08060');
                [-8, -3, 2].forEach(yy => rect(ctx, 4, yy, 6, 4, '#b07050'));
                rect(ctx, -22, -2, 12, 4, 'rgba(255,255,255,.6)');
                rect(ctx, -28, -7, 8, 2, 'rgba(255,255,255,.4)');
                ctx.restore();
            }
            impact(ctx, t, to.x, to.y, after, kind === 'bigFist' ? '#ffd23a' : '#fff6b0', kind === 'bigFist');
            if (kind === 'bigFist' && after > 0 && after < 0.6) text(ctx, 'ドパァン！', to.x, to.y - 40, { size: 16, color: '#ffffff', lw: 4, stroke: '#a01010' });
            break;
        }
        case 'kick': {
            // 弧を描く蹴りの軌跡
            ctx.strokeStyle = '#7affb0';
            ctx.lineWidth = 6;
            ctx.globalAlpha = after > 0 ? 1 - after : 0.9;
            ctx.beginPath();
            const cx = lerp(from.x, to.x, 0.5);
            ctx.arc(cx, to.y + 10, Math.abs(to.x - from.x) / 2, Math.PI * (dir > 0 ? 1 : 0), Math.PI * (dir > 0 ? 1 + ease(go) : -ease(go)), dir < 0);
            ctx.stroke();
            ctx.globalAlpha = 1;
            impact(ctx, t, to.x, to.y, after, '#7affb0');
            break;
        }
        case 'chop': {
            // 上から一直線の手刀の光
            const y = lerp(0, to.y + 20, ease(go));
            ctx.globalAlpha = after > 0 ? 1 - after : 1;
            rect(ctx, to.x - 3, 0, 6, y, '#ffffff');
            rect(ctx, to.x - 8, 0, 16, y, 'rgba(255,200,120,.35)');
            ctx.globalAlpha = 1;
            impact(ctx, t, to.x, to.y, after, '#ffb060');
            break;
        }
        case 'club': {
            // 巨大な金棒が上から振り下ろされる
            const a = lerp(-1.6, 0.15, ease(go));
            ctx.save();
            ctx.globalAlpha = after > 0 ? Math.max(0, 1 - after) : 1;
            ctx.translate(to.x - 30 * dir, to.y + 30);
            ctx.rotate(a * dir);
            rect(ctx, -9, -110, 18, 100, '#4a3a2a');
            for (let yy = -104; yy < -14; yy += 12) {
                rect(ctx, -12, yy, 3, 3, '#d0d0d0');
                rect(ctx, 9, yy + 6, 3, 3, '#d0d0d0');
            }
            ctx.restore();
            impact(ctx, t, to.x, to.y + 10, after, '#ff8a4a', true);
            if (after > 0 && after < 0.6) text(ctx, 'ドゴォン！', to.x, to.y - 42, { size: 16, color: '#ffffff', lw: 4, stroke: '#a01010' });
            break;
        }
        case 'ice': {
            // 体当たり + 氷のかけら
            const x = lerp(from.x, to.x - 14 * dir, ease(go));
            if (after < 0) {
                for (let i = 0; i < 5; i++) rect(ctx, x - dir * (8 + i * 10), from.y - 6 + (i % 2) * 8, 8 - i, 3, `rgba(191,240,255,${0.8 - i * 0.15})`);
            }
            if (after > 0) {
                const rnd = seeded(5);
                for (let i = 0; i < 14; i++) {
                    const a = rnd() * Math.PI * 2, d = after * (20 + rnd() * 50);
                    ctx.globalAlpha = 1 - after;
                    rect(ctx, to.x + Math.cos(a) * d, to.y + Math.sin(a) * d, 4, 4, i % 2 ? '#ffffff' : '#7fd3f7');
                }
            }
            ctx.globalAlpha = 1;
            impact(ctx, t, to.x, to.y, after, '#bff0ff');
            break;
        }
        case 'slash': case 'bigSlash': case 'dash': {
            // 青白い斬撃 (ASAスラッシュは3本、鏡筋一刀斬りは大きく1本、イケキムドライブは走り抜けて斬る)
            const n = kind === 'slash' ? 3 : 1;
            if (after > -0.4) {
                for (let i = 0; i < n; i++) {
                    const k = Math.min(1, Math.max(0, (p - HIT_AT * 0.7 - i * 0.08) / 0.15));
                    if (k <= 0) continue;
                    ctx.globalAlpha = after > 0 ? Math.max(0, 1 - after) : 1;
                    ctx.strokeStyle = kind === 'bigSlash' ? '#ffffff' : '#bfe8ff';
                    ctx.lineWidth = kind === 'bigSlash' ? 7 : 4;
                    const ox = (i - (n - 1) / 2) * 16, len = kind === 'bigSlash' ? 70 : 44;
                    ctx.beginPath();
                    ctx.moveTo(to.x + ox + len / 2, to.y - len / 2);
                    ctx.lineTo(to.x + ox + len / 2 - len * k, to.y - len / 2 + len * k);
                    ctx.stroke();
                }
            }
            if (kind === 'dash' && after < 0) for (let i = 0; i < 6; i++) rect(ctx, lerp(from.x, to.x, go) - dir * i * 10, from.y - 10 + i * 4, 20, 2, 'rgba(255,255,255,.5)');
            ctx.globalAlpha = 1;
            impact(ctx, t, to.x, to.y, after, '#bfe8ff', kind === 'bigSlash');
            break;
        }
        case 'rainbowSword': {
            // 虹色の大きな斬撃
            const k = Math.min(1, Math.max(0, (p - HIT_AT * 0.6) / 0.25));
            ctx.globalAlpha = after > 0 ? Math.max(0, 1 - after) : 1;
            ctx.lineWidth = 3;
            RAINBOW.forEach((c, i) => {
                const o = (i - 2.5) * 3;
                ctx.strokeStyle = c;
                ctx.beginPath();
                ctx.moveTo(to.x + 50 + o, to.y - 60 + o);
                ctx.lineTo(to.x + 50 + o - 100 * k, to.y - 60 + o + 120 * k);
                ctx.stroke();
            });
            ctx.globalAlpha = 1;
            impact(ctx, t, to.x, to.y, after, '#ffffff', true);
            break;
        }
        case 'hammer': {
            // 大きな氷のハンマーが振り下ろされる
            const a = lerp(-1.4, 0.1, ease(go));
            ctx.save();
            ctx.globalAlpha = after > 0 ? Math.max(0, 1 - after) : 1;
            ctx.translate(to.x - 26 * dir, to.y + 30);
            ctx.rotate(a * dir);
            rect(ctx, -2, -70, 5, 70, '#7a5a3a');
            rect(ctx, -22, -96, 44, 28, '#bff0ff');
            rect(ctx, -22, -96, 44, 5, '#ffffff');
            ctx.restore();
            impact(ctx, t, to.x, to.y + 6, after, '#bff0ff', true);
            break;
        }
        case 'rings': case 'tempo': {
            // 音の輪が何重にも広がり、音符が飛ぶ (NABIテンポは数字のリズム)
            for (let i = 0; i < 4; i++) {
                const k = p * 1.4 - i * 0.15;
                if (k <= 0 || k >= 1) continue;
                ctx.globalAlpha = 1 - k;
                ctx.strokeStyle = kind === 'tempo' ? '#8ad0ff' : '#ffe080';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(lerp(from.x, to.x, k), from.y, 8 + k * 26, -0.9, 0.9);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            const marks = kind === 'tempo' ? ['1', '2', '3', '4'] : ['♪', '♫', '♪'];
            marks.forEach((m, i) => {
                const k = Math.min(1, Math.max(0, p * 1.3 - i * 0.12));
                if (k > 0 && k < 1) text(ctx, m, lerp(from.x, to.x, k), from.y - 16 - Math.sin(k * 6) * 8, { size: 12, color: '#ffffff', lw: 3, stroke: '#3a2a6a' });
            });
            impact(ctx, t, to.x, to.y, after, kind === 'tempo' ? '#8ad0ff' : '#ffe080');
            break;
        }
        case 'bones': {
            // 骨が回りながら飛んでいく (おちょくりボーンフィーバー)
            for (let i = 0; i < 4; i++) {
                const k = Math.min(1, Math.max(0, go * 1.2 - i * 0.1));
                if (k <= 0 || after > 0) continue;
                ctx.save();
                ctx.translate(lerp(from.x, to.x, k), from.y - 10 + i * 6 - Math.sin(k * Math.PI) * 20);
                ctx.rotate(t / 60 + i);
                rect(ctx, -8, -2, 16, 4, '#f4f0e0');
                rect(ctx, -10, -4, 4, 8, '#f4f0e0');
                rect(ctx, 6, -4, 4, 8, '#f4f0e0');
                ctx.restore();
            }
            impact(ctx, t, to.x, to.y, after, '#f4f0e0');
            break;
        }
        case 'slam': {
            // 跳び上がって叩きつける。上から落ちてくる線 → 地面から衝撃波と破片
            if (after < 0) {
                const k = ease(go);
                for (let i = 0; i < 5; i++) rect(ctx, to.x - 20 + i * 10, -10 + k * (to.y - 10) - i * 6, 3, 26, 'rgba(255,230,120,.7)');
            }
            if (after > 0) {
                ctx.globalAlpha = 1 - after;
                ctx.strokeStyle = '#ffd23a';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.ellipse(to.x, to.y + 34, 20 + after * 60, 6 + after * 10, 0, 0, Math.PI * 2);
                ctx.stroke();
                const rnd = seeded(3);
                for (let i = 0; i < 10; i++) rect(ctx, to.x + (rnd() - 0.5) * 80 * after, to.y + 30 - rnd() * 50 * after, 4, 4, '#8a7a6a');
            }
            ctx.globalAlpha = 1;
            impact(ctx, t, to.x, to.y + 20, after, '#ffd23a', true);
            break;
        }
        case 'needles': case 'kunai': case 'missiles': {
            // とげ・クナイ・ミサイルがいくつも飛んでいく
            const n = kind === 'kunai' ? 6 : 4;
            for (let i = 0; i < n; i++) {
                const k = Math.min(1, Math.max(0, go * 1.3 - i * 0.07));
                if (k <= 0 || k >= 1) continue;
                const x = lerp(from.x, to.x, k), y = lerp(from.y - 14 + i * 6, to.y - 6 + i * 3, k);
                if (kind === 'missiles') {
                    rect(ctx, x - 6, y - 2, 12, 5, '#c0c8d0');
                    rect(ctx, x - dir * 10, y - 1, 4, 3, '#ff8a20');
                } else rect(ctx, x - 6, y - 1, 12, 2, kind === 'kunai' ? '#e0e8f0' : '#a070d0');
            }
            impact(ctx, t, to.x, to.y, after, kind === 'missiles' ? '#ff8a20' : '#e0e8f0', kind === 'missiles');
            break;
        }
        case 'smoke': {
            // 玉手箱の煙がもくもく
            const rnd = seeded(9);
            for (let i = 0; i < 8; i++) {
                const k = Math.min(1, Math.max(0, p * 1.2 - i * 0.05));
                ctx.globalAlpha = 0.7 * (1 - Math.max(0, after));
                ctx.fillStyle = '#d8d8e8';
                ctx.beginPath();
                ctx.arc(lerp(from.x, to.x, k) + rnd() * 10, from.y - 10 + rnd() * 20, 8 + k * 10, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            impact(ctx, t, to.x, to.y, after, '#d8d8e8');
            break;
        }
        case 'bite': {
            // 金色の牙が上下から噛みつく
            const k = ease(Math.min(1, go));
            ctx.globalAlpha = after > 0 ? 1 - after : 1;
            for (let i = 0; i < 4; i++) {
                const x = to.x - 24 + i * 16;
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.moveTo(x - 6, to.y - 40 + k * 26);
                ctx.lineTo(x + 6, to.y - 40 + k * 26);
                ctx.lineTo(x, to.y - 22 + k * 26);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(x - 6, to.y + 40 - k * 26);
                ctx.lineTo(x + 6, to.y + 40 - k * 26);
                ctx.lineTo(x, to.y + 22 - k * 26);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            impact(ctx, t, to.x, to.y, after, '#ffd700', true);
            break;
        }
        case 'sutra': {
            // 「喝」の文字の輪が広がる
            const k = ease(Math.min(1, go));
            ctx.globalAlpha = after > 0 ? 1 - after : 1;
            ctx.strokeStyle = '#ffb040';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(to.x, to.y, 10 + k * 30, 0, Math.PI * 2);
            ctx.stroke();
            text(ctx, '喝', lerp(from.x, to.x, k), lerp(from.y, to.y, k) - 6, { size: 18 + k * 8, color: '#ffe080', lw: 4, stroke: '#5a2000', font: BODY, weight: '700' });
            ctx.globalAlpha = 1;
            impact(ctx, t, to.x, to.y, after, '#ffb040', true);
            break;
        }
        default:
            impact(ctx, t, to.x, to.y, after);
    }
    ctx.restore();
    // 当たった瞬間は画面を白く光らせる
    if (after > 0 && after < 0.25) {
        ctx.save();
        ctx.globalAlpha = 0.5 * (1 - after / 0.25);
        rect(ctx, 0, 0, W, 180, kind === 'rainbowSword' ? rainbow(ctx, 0, 0, W, 180) : '#ffffff');
        ctx.restore();
    }
}

// 技が当たったあと受けた側をゆらす量 (描く側で x に足す)
export function hitShake(since) {
    const after = (since / SKILL_MS - HIT_AT) / (1 - HIT_AT);
    return after > 0 && after < 0.5 ? Math.sin(since / 18) * 4 * (1 - after * 2) : 0;
}

// 激突: 2人がぶつかったところ (x, y) の火花・衝撃の輪・文字。since はぶつかってからのミリ秒
const CLASH_WORDS = ['ドガッ！', 'バキィ！', 'ガキィン！', 'ズドン！'];
export function drawClash(ctx, t, since, x, y, seed = 0) {
    if (since < 0 || since > 700) return;
    const k = since / 700;
    ctx.save();
    // 衝撃の輪
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4 * (1 - k);
    ctx.beginPath();
    ctx.ellipse(x, y, 10 + k * 70, 6 + k * 40, 0, 0, Math.PI * 2);
    ctx.stroke();
    // 火花
    const rnd = seeded(seed + 1);
    for (let i = 0; i < 18; i++) {
        const a = rnd() * Math.PI * 2, d = ease(k) * (20 + rnd() * 60);
        const c = RAINBOW[i % 3 + 1];
        rect(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, 3, 3, i % 3 ? '#ffffff' : c);
    }
    ctx.restore();
    impact(ctx, t, x, y, k * 1.6, '#fff6b0', true);
    if (since < 500) text(ctx, CLASH_WORDS[seed % CLASH_WORDS.length], x, y - 44 - since / 40, { size: 18, color: '#ffffff', lw: 5, stroke: '#a01010' });
}
