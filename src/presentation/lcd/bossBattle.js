// =====================================================================
// 液晶の場面: AT 中のボーナスの「バトル画面」(2026-10-21 ユーザー指定。画面設計書 5-3-1)
// ---------------------------------------------------------------------
// ボーナス画面 (いつもの解説・倒したら表記) と PUSH ボタンで切りかえる。
// バトル画面では、チームばりきつよめとほかのチームが力を合わせて四天王・大魔王ASO に挑み、
// 立ち止まらずに目まぐるしく戦い続ける (だれかが飛びこんで激突・技を撃つ・相手の反撃をよける)。
//   drawBossBattle:  ふだんの戦い (期待度には関係しない。時間で動く)
//   drawBossAttack:  レア役のときの仲間の攻撃 (at:bossAttack。当たる・ガード・よける / ダメージの文字・「畳みかけろ！」)
//   drawBossJudge:   最後のゲームの一騎打ち「ラストジャッジ」(at:bossJudge)
// どれを出すかは director.js が決め、ここは描くだけ。t・since はミリ秒。
// =====================================================================

import { ART, characterName } from '../art/characters.js';
import { BODY, H, W, ch, pushButton, rainbow, rays, rect, roundRect, seeded, text, vgrad } from './kit.js';
import { HIT_AT, SKILL_KIND, SKILL_MS, drawClash, drawSkillFx, hitShake } from './skillFx.js';
import { BOSSES } from './bonus.js';

const frameOf = (t, ms = 320) => Math.floor(t / ms) % 2;
const ease = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const lerp = (a, b, k) => a + (b - a) * k;

// こちら側: 前の列はチームばりきつよめ、うしろの列はほかのチーム (5DX・ASK-3・お願いマッスル)
const FRONT = [
    { id: 'yasu', x: 22, scale: 1.5 }, { id: 'tamu', x: 50, scale: 1.5 }, { id: 'dake', x: 78, scale: 1.5 },
    { id: 'onioni', x: 106, scale: 1.25 }, { id: 'koori', x: 138, scale: 2.4 }
];
const BACK = ['okagappa', 'hibikimakuri', 'yamamou', 'sasaki', 'kotani', 'asahara', 'shibata', 'ikekimu', 'ueno']
    .map((id, i) => ({ id, x: 12 + i * 17, scale: 0.8, back: true }));
const CAST = [...BACK, ...FRONT];
export const BATTLE_ALLIES = CAST.map(c => c.id);
const FRONT_GROUND = 162, BACK_GROUND = 128;
const BOSS_X = 250, BOSS_GROUND = 160;

// 相手ごとの部屋の色
const ROOM = {
    daishi: { sky: ['#1a0a24', '#3a1a40', '#120818'], floor: '#3a2448', glow: '#c080ff' },
    zumitani: { sky: ['#06101e', '#10284a', '#060a14'], floor: '#1a2a44', glow: '#40c0ff' },
    runaya: { sky: ['#0a0620', '#2a1a5a', '#080418'], floor: '#2a2050', glow: '#e0c0ff' },
    nozoema: { sky: ['#200606', '#4a1010', '#140404'], floor: '#4a1a14', glow: '#ff6a3a' },
    maou: { sky: ['#1a0000', '#5a0a00', '#100000'], floor: '#4a0a00', glow: '#ff3a1a' }
};

const EX_MS = 620;        // ふだんの戦いの1つの攻め (飛びこむ・撃つ) の長さ
const COUNTER_MS = 2480;  // 相手が反撃する間隔

// 1つの攻めの中身 (時間で決まる。期待度には関係しない)
function exchange(n) {
    const rnd = seeded(n * 7 + 3);
    const who = CAST[Math.floor(rnd() * CAST.length)];
    return { who, type: rnd() < 0.55 ? 'dash' : 'shot', seed: n };
}

// 相手を描く。hp: 残りの体力 (0〜1)、hit: 白く光る / dodge: 横へよける (0〜1)
function drawBoss(ctx, t, boss, { shake = 0, flash = false, dodge = 0, float = true, alpha = 1, silhouette = false } = {}) {
    const a = ART[boss];
    const big = boss === 'maou';
    const scale = Math.min(110 / a.w, (big ? 120 : 100) / a.h, 2.4);
    const fy = float ? Math.sin(t / 380) * 3 : 0;
    const dx = dodge ? Math.sin(dodge * Math.PI) * 42 : 0;
    const dy = dodge ? -Math.sin(dodge * Math.PI) * 26 : 0;
    if (dodge) {
        // 残像
        ctx.save();
        ctx.globalAlpha *= 0.35 * Math.sin(dodge * Math.PI);
        ch(ctx, boss, BOSS_X, BOSS_GROUND + fy, { scale, tint: '#b080ff' });
        ctx.restore();
    }
    ch(ctx, boss, BOSS_X + shake + dx, BOSS_GROUND + fy + dy, { scale, frame: frameOf(t, 300), tint: flash ? '#ffffff' : null, alpha, silhouette });
}

// 相手の体力のゲージ (右上)
function drawHpBar(ctx, boss, hp) {
    const b = BOSSES[boss] || BOSSES.daishi;
    const x = W - 128, y = 24;
    roundRect(ctx, x - 4, y - 4, 126, 24, 3, 'rgba(0,0,0,.65)', '#ff6a3a');
    text(ctx, b.name, x, y + 4, { size: 9, align: 'left', color: '#ffcc80', stroke: null, font: BODY, weight: '700' });
    text(ctx, '★'.repeat(b.stars), x + 116, y + 4, { size: 7, align: 'right', color: b.stars === 5 ? '#ff6a3a' : '#ffd23a', stroke: null, font: BODY });
    rect(ctx, x, y + 10, 116, 6, '#2a0a10');
    const w = 116 * Math.max(0, hp);
    if (w > 0) rect(ctx, x, y + 10, w, 6, hp > 0.5 ? '#ffd23a' : hp > 0.25 ? '#ff8a20' : '#ff3030');
    rect(ctx, x, y + 10, 116, 1, 'rgba(255,255,255,.35)');
}

// 背景: 相手の部屋と、流れる集中線
function drawArena(ctx, t, boss, shake = 0) {
    const r = ROOM[boss] || ROOM.daishi;
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, r.sky));
    ctx.save();
    ctx.translate(shake, 0);
    ctx.globalAlpha = 0.18 + Math.sin(t / 300) * 0.06;
    rays(ctx, BOSS_X, 100, [r.glow, 'rgba(0,0,0,0)'], 22, 0.6);
    ctx.restore();
    // 流れる線 (右から左へ。動いている感じ)
    const rnd = seeded(5);
    for (let i = 0; i < 16; i++) {
        const y = 20 + rnd() * 120, len = 20 + rnd() * 40, sp = 0.25 + rnd() * 0.35;
        const x = W - ((t * sp + rnd() * W) % (W + len));
        rect(ctx, x, y, len, 1, 'rgba(255,255,255,.18)');
    }
    rect(ctx, 0, 132, W, 48, vgrad(ctx, 132, H, [r.floor, '#05030a']));
    for (let x = -40; x < W + 40; x += 40) rect(ctx, x + ((t / 20) % 40), 132, 1, 48, 'rgba(255,255,255,.06)');
}

function groundOf(c) {
    return c.back ? BACK_GROUND : FRONT_GROUND;
}

// ふだんの戦い。b: { boss, hp, since, defeated }。calm: 仲間の攻撃・ラストジャッジのあいだは静かに並ぶ
export function drawBossBattle(ctx, t, b, { calm = false } = {}) {
    const local = t - b.since;
    const n = Math.floor(local / EX_MS);
    const k = (local - n * EX_MS) / EX_MS;
    const ex = calm || b.defeated ? null : exchange(n);
    // 相手の反撃 (ときどき。みんなが跳んでよける)
    const cIndex = Math.floor((local - 900) / COUNTER_MS);
    const cSince = local - 900 - cIndex * COUNTER_MS;
    const counter = !calm && !b.defeated && local > 900 && cSince < SKILL_MS;
    const hitNow = ex && k > 0.42 && k < 0.6;
    const camShake = hitNow ? Math.sin(t / 15) * 2 : 0;
    drawArena(ctx, t, b.boss, camShake);
    ctx.save();
    ctx.translate(camShake, 0);
    // 相手
    if (!b.defeated) {
        const hitShakeX = hitNow ? Math.sin(t / 12) * 3 : 0;
        drawBoss(ctx, t, b.boss, { shake: hitShakeX, flash: hitNow && frameOf(t, 50) });
    }
    // こちら側。反撃の当たるころは跳ぶ
    const hop = counter && cSince > SKILL_MS * 0.35 && cSince < SKILL_MS * 0.8 ? Math.sin(((cSince - SKILL_MS * 0.35) / (SKILL_MS * 0.45)) * Math.PI) : 0;
    CAST.forEach((c, i) => {
        if (ex && ex.who === c) return;
        const g = groundOf(c);
        const bounce = b.defeated ? Math.abs(Math.sin(t / 180 + i)) * 6 : Math.abs(Math.sin(t / 160 + i * 1.3)) * 2;
        const jump = hop * (c.back ? 10 : 18) * (0.7 + (i % 3) * 0.15);
        ch(ctx, c.id, c.x, g - bounce - jump, { scale: c.scale, frame: frameOf(t + i * 90, 160) });
    });
    // 攻める人: 飛びこんで激突 / その場から技を撃つ
    if (ex) {
        const c = ex.who;
        const g = groundOf(c);
        if (ex.type === 'dash') {
            const reach = BOSS_X - 44;
            const go = k < 0.45 ? ease(k / 0.45) : 1 - ease((k - 0.55) / 0.45) * (k > 0.55 ? 1 : 0);
            const x = lerp(c.x, reach, go);
            const y = lerp(g, BOSS_GROUND, go) - Math.sin(go * Math.PI) * 30;
            ch(ctx, c.id, x, y, { scale: c.back ? 1.4 : c.scale, frame: frameOf(t, 90) });
            if (k > 0.42) drawClash(ctx, t, (k - 0.42) * EX_MS, BOSS_X - 20, BOSS_GROUND - 50, ex.seed);
        } else {
            ch(ctx, c.id, c.x, g - Math.sin(Math.min(1, k * 3) * Math.PI) * 6, { scale: c.scale, frame: frameOf(t, 90) });
            const from = { x: c.x + 10, y: g - (ART[c.id].h * c.scale) / 2 }, to = { x: BOSS_X - 10, y: BOSS_GROUND - 50 };
            drawSkillFx(ctx, t, k * SKILL_MS * 0.9, SKILL_KIND[c.id] || 'fist', from, to);
        }
    }
    if (counter) drawSkillFx(ctx, t, cSince, SKILL_KIND[b.boss] || 'fire', { x: BOSS_X - 30, y: BOSS_GROUND - 60 }, { x: 90, y: 130 });
    ctx.restore();
    if (b.defeated) {
        text(ctx, '撃破！', BOSS_X, 84, { size: 26, color: '#ffe040', lw: 6, stroke: '#a01010' });
        text(ctx, '特化ゾーン確定', BOSS_X, 112, { size: 12, color: rainbow(ctx, BOSS_X - 50, 0, BOSS_X + 50, 0), lw: 4 });
    }
    drawHpBar(ctx, b.boss, b.defeated ? 0 : b.hp);
    const fl = BOSSES[b.boss] || BOSSES.daishi;
    roundRect(ctx, 6, 6, 108, 18, 3, 'rgba(0,0,0,.65)', '#ff6a3a');
    text(ctx, `${fl.floor}  VS ${fl.name}`, 60, 15.5, { size: 10, color: '#ff8a40', stroke: null });
}

// 「PUSH で画面切替」の小さい札 (バトル画面・ボーナス画面の両方)
export function drawViewHint(ctx, t, view) {
    const label = view === 'battle' ? 'PUSH でボーナス画面へ' : 'PUSH でバトル画面へ';
    ctx.save();
    ctx.globalAlpha = 0.6 + frameOf(t, 700) * 0.25;
    roundRect(ctx, W / 2 - 52, 150, 104, 11, 3, 'rgba(0,0,0,.6)');
    text(ctx, label, W / 2, 156, { size: 7.5, color: '#ffffff', stroke: null, font: BODY, weight: '700' });
    ctx.restore();
}

// ----- レア役のときの仲間の攻撃 (at:bossAttack) -----
// a: { boss, attacker, move, result, color, shout, shouter, phase: 'cutin' | 'strike' | 'result', since, hp }
export const ATTACK_CUTIN_MS = 900;
export const ATTACK_RESULT_MS = 1700;

// 文字の色 (赤は熱い、金・虹は確定)
function textFill(ctx, color, x0, x1, y0, y1) {
    if (color === 'rainbow') return rainbow(ctx, x0, 0, x1, 0);
    if (color === 'gold') return vgrad(ctx, y0, y1, ['#fff6b0', '#ffd23a', '#c88a10']);
    if (color === 'red') return '#ff3030';
    return '#ffffff';
}

// 攻撃のカットイン (斜めの帯に攻める人と「いけーっ！」)
function drawAttackCutin(ctx, t, since, who, color) {
    const k = since < 160 ? 1 - ease(since / 160) : since > ATTACK_CUTIN_MS - 160 ? -ease((since - ATTACK_CUTIN_MS + 160) / 160) : 0;
    ctx.save();
    rect(ctx, 0, 0, W, H, 'rgba(0,0,0,.3)');
    ctx.translate(k * W, 0);
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(W, 38);
    ctx.lineTo(W, 112);
    ctx.lineTo(0, 124);
    ctx.closePath();
    ctx.clip();
    rect(ctx, 0, 30, W, 100, color === 'rainbow' ? rainbow(ctx, 0, 0, W, 0) : color === 'gold' ? '#a07a10' : color === 'red' ? '#8a0a14' : '#0a3a6a');
    for (let i = 0; i < 12; i++) rect(ctx, ((i * 53 + t * 0.9) % (W + 60)) - 60, 40 + (i * 13) % 80, 50, 1, 'rgba(255,255,255,.4)');
    const a = ART[who];
    ch(ctx, who, 76, 120, { scale: Math.min(3, 74 / a.h, 100 / a.w), frame: frameOf(t, 100) });
    ctx.restore();
    ctx.save();
    ctx.translate(k * W, 0);
    text(ctx, characterName(who), 230, 66, { size: 11, color: '#ffe45a', lw: 3 });
    text(ctx, 'いけーっ！', 230, 92, { size: 24, color: '#ffffff', lw: 6 });
    ctx.restore();
}

// 「畳みかけろ！」の吹き出し (左上。文字の色が期待度)
function drawShout(ctx, t, since, who, color) {
    if (since < 0) return;
    const a = Math.min(1, since / 150);
    ctx.save();
    ctx.globalAlpha = a;
    const x = 8, y = 30, w = 120, h = 34;
    roundRect(ctx, x, y, w, h, 8, 'rgba(255,255,255,.96)', color === 'white' ? '#3a0008' : color === 'red' ? '#ff3030' : '#ffd23a');
    ctx.beginPath();
    ctx.moveTo(x + 22, y + h - 1);
    ctx.lineTo(x + 14, y + h + 10);
    ctx.lineTo(x + 34, y + h - 1);
    ctx.fillStyle = 'rgba(255,255,255,.96)';
    ctx.fill();
    text(ctx, characterName(who), x + 8, y + 9, { size: 8, align: 'left', color: '#2a4ad0', stroke: null, font: BODY, weight: '700' });
    const pop = 1 + Math.max(0, 0.3 - since / 400);
    text(ctx, '畳みかけろ！', x + w / 2, y + 23, { size: 14 * pop, color: color === 'white' ? '#1a0a10' : textFill(ctx, color, x + 10, x + w - 10, y + 14, y + 30), lw: color === 'white' ? 0 : 3, stroke: color === 'white' ? null : '#3a0008' });
    ctx.restore();
}

// ガードの盾 (相手の前に六角形の光)
function drawGuard(ctx, t, k) {
    if (k <= 0 || k >= 1) return;
    ctx.save();
    ctx.globalAlpha = Math.sin(k * Math.PI);
    ctx.strokeStyle = '#a0e0ff';
    ctx.fillStyle = 'rgba(120,200,255,.25)';
    ctx.lineWidth = 3;
    const cx = BOSS_X - 38, cy = BOSS_GROUND - 50, r = 34 + Math.sin(t / 40) * 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + (i / 6) * Math.PI * 2;
        ctx.lineTo(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

export function drawBossAttack(ctx, t, a, b) {
    const since = t - a.since;
    const attackerArt = ART[a.attacker];
    const ax = 96, ag = FRONT_GROUND;
    const ascale = Math.min(2.4, 60 / attackerArt.h);
    if (a.phase === 'cutin') {
        drawBossBattle(ctx, t, b, { calm: true });
        drawAttackCutin(ctx, t, since, a.attacker, a.color);
        return;
    }
    drawArena(ctx, t, a.boss);
    const strike = a.phase === 'strike';
    const p = strike ? since / SKILL_MS : 1;
    const hit = a.result === 'hit';
    const shake = strike && hit ? hitShake(since) : 0;
    const dodge = a.result === 'dodge' && strike && p > HIT_AT - 0.15 ? Math.min(1, (p - HIT_AT + 0.15) / 0.5) : 0;
    drawBoss(ctx, t, a.boss, { shake, flash: Boolean(shake), dodge });
    // こちら側 (攻める人は前へ)
    CAST.forEach((c, i) => {
        if (c.id === a.attacker) return;
        ch(ctx, c.id, c.x * 0.7, groundOf(c), { scale: c.scale * 0.9, frame: frameOf(t + i * 90, 200), alpha: 0.85 });
    });
    ch(ctx, a.attacker, ax, ag - (strike ? Math.sin(Math.min(1, p * 2) * Math.PI) * 10 : 0), { scale: ascale, frame: frameOf(t, 100) });
    if (strike) {
        const from = { x: ax + 14, y: ag - (attackerArt.h * ascale) / 2 };
        const to = a.result === 'dodge' ? { x: W + 40, y: BOSS_GROUND - 50 } : a.result === 'guard' ? { x: BOSS_X - 40, y: BOSS_GROUND - 50 } : { x: BOSS_X - 6, y: BOSS_GROUND - 50 };
        drawSkillFx(ctx, t, since, SKILL_KIND[a.attacker] || 'fist', from, to);
        if (a.result === 'guard') drawGuard(ctx, t, (p - HIT_AT + 0.1) / 0.6);
    }
    drawHpBar(ctx, a.boss, a.hp);
    if (a.phase !== 'result') return;
    // 結果の文字
    const pop = 1 + Math.max(0, 0.5 - since / 300);
    const name = (BOSSES[a.boss] || BOSSES.daishi).name;
    if (hit) {
        const big = a.move === 'special';
        rect(ctx, 0, 68, W, 34, 'rgba(0,0,0,.55)');
        text(ctx, big ? `${name}に 大ダメージ！！` : `${name}に ダメージ！`, W / 2, 86, {
            size: (big ? 20 : 18) * pop, color: textFill(ctx, a.color, 40, W - 40, 72, 100), lw: 5, stroke: a.color === 'white' ? '#1a2a5a' : '#3a0008'
        });
        if (a.shout) drawShout(ctx, t, since - 350, a.shouter, a.color);
    } else {
        rect(ctx, 0, 68, W, 34, 'rgba(0,0,0,.55)');
        text(ctx, a.result === 'guard' ? 'ガードされた！' : 'かわされた！', W / 2, 86, { size: 18 * pop, color: '#c8d0e0', lw: 5, stroke: '#101830' });
    }
}

// ----- 最後のゲームの一騎打ち「ラストジャッジ」(at:bossJudge) -----
// j: { boss, win, finisher, phase: 'intro' | 'duel' | 'enter' | 'skill' | 'guard' | 'counter', since, skill }
export const DUEL_MS = 1400;
export const ENTER_MS = 1100;
const KOORI_X = 86;

export function drawBossJudge(ctx, t, j) {
    const since = t - j.since;
    const big = j.boss === 'maou';
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, big ? ['#1a0000', '#3a0400', '#050000'] : ['#05040e', '#1a0a2a', '#020104']));
    rays(ctx, W / 2, 96, [j.phase === 'intro' ? 'rgba(255,60,60,.5)' : 'rgba(255,255,255,.35)', 'rgba(0,0,0,0)'], 24, 0.3 + Math.sin(t / 150) * 0.1);
    rect(ctx, 0, 138, W, 42, vgrad(ctx, 138, H, ['#2a1a3a', '#050208']));
    const name = (BOSSES[j.boss] || BOSSES.daishi).name;
    if (j.phase === 'intro') {
        drawBoss(ctx, t, j.boss, { silhouette: since < 500 });
        ch(ctx, 'koori', KOORI_X, 160, { scale: 3.2, frame: frameOf(t, 300) });
        text(ctx, 'ボーナス 残り 1G', W / 2, 18, { size: 11, color: '#ff8a8a', lw: 3 });
        const pop = 1 + Math.max(0, 0.4 - since / 400);
        text(ctx, 'ラストジャッジ！', W / 2, 46, { size: 24 * pop, color: vgrad(ctx, 32, 60, ['#ffffff', '#ff6a6a']), lw: 6, stroke: '#3a0008' });
        if (since > 400) text(ctx, `こおりくん VS ${name}  一騎打ち!!`, W / 2, 72, { size: 11, color: '#ffffff', lw: 4, stroke: '#3a0008' });
        if (since > 700) pushButton(ctx, W / 2, 150, 14 * (1 + Math.sin(t / 110) * 0.08), '#e02a3a');
        return;
    }
    if (j.phase === 'duel') {
        // こおりくんと相手が、まんなかで何度もぶつかる
        const hits = [0.18, 0.5, 0.82];
        const local = since / DUEL_MS;
        const step = hits.findIndex(h => local < h + 0.16);
        const near = hits.some(h => Math.abs(local - h) < 0.07);
        const kx = near ? 136 : lerp(KOORI_X, 136, Math.abs(Math.sin(local * Math.PI * 3)));
        const bx = near ? 186 : lerp(BOSS_X, 186, Math.abs(Math.sin(local * Math.PI * 3)));
        ch(ctx, 'koori', kx, 160 - (near ? 14 : 0), { scale: 3.2, frame: frameOf(t, 80) });
        const a = ART[j.boss];
        ch(ctx, j.boss, bx, BOSS_GROUND - (near ? 10 : 0), { scale: Math.min(110 / a.w, (big ? 120 : 100) / a.h, 2.4), frame: frameOf(t, 80) });
        hits.forEach((h, i) => drawClash(ctx, t, (local - h) * DUEL_MS, 161, 110, i + 1));
        if (step >= 0) text(ctx, '一騎打ち!!', W / 2, 24, { size: 16, color: '#ffffff', lw: 5, stroke: '#3a0008' });
        return;
    }
    const finisher = j.finisher || 'koori';
    const ally = finisher !== 'koori';
    if (j.phase === 'enter') {
        // こおりくんではなく仲間が飛びこんでくる (確定)
        drawBoss(ctx, t, j.boss);
        ch(ctx, 'koori', KOORI_X - 30, 160, { scale: 2.6, frame: frameOf(t, 200) });
        if (since < 120) rect(ctx, 0, 0, W, H, rainbow(ctx, 0, 0, W, H));
        const drop = ease(since / 420);
        const fa = ART[finisher];
        const fs = Math.min(2.6, 70 / fa.h);
        ctx.save();
        ctx.globalAlpha *= 0.5;
        ch(ctx, finisher, 130, 162, { scale: fs * 1.15, tint: rainbow(ctx, 90, 60, 170, 160) });
        ctx.restore();
        ch(ctx, finisher, 130, lerp(-20, 162, drop), { scale: fs, frame: frameOf(t, 120) });
        if (since > 420) {
            const pop = 1 + Math.max(0, 0.5 - (since - 420) / 300);
            text(ctx, '待たせたな！', 130, 40, { size: 20 * pop, color: rainbow(ctx, 60, 0, 200, 0), lw: 5 });
            text(ctx, characterName(finisher), 130, 62, { size: 10, color: '#ffffff', lw: 3 });
        }
        return;
    }
    // 技: skill (こおりくんか仲間の技) / guard (こおりくんの技を相手が防ぐ) / counter (相手の反撃)
    const shooter = j.phase === 'counter' ? j.boss : finisher;
    const fromAlly = j.phase !== 'counter';
    const sx = ally ? 130 : KOORI_X;
    const fa = ART[finisher];
    const fs = ally ? Math.min(2.6, 70 / fa.h) : 3.2;
    const shake = hitShake(since);
    const bossHit = fromAlly && j.phase === 'skill';
    drawBoss(ctx, t, j.boss, { shake: bossHit ? shake : 0, flash: bossHit && Boolean(shake) });
    if (ally) ch(ctx, 'koori', KOORI_X - 30, 160, { scale: 2.6, frame: frameOf(t, 200) });
    ch(ctx, finisher, sx + (j.phase === 'counter' ? shake : 0), 162, { scale: fs, frame: frameOf(t, 120), tint: j.phase === 'counter' && shake ? '#ffffff' : null });
    const me = { x: sx + 16, y: 120 }, foe = { x: BOSS_X - 10, y: BOSS_GROUND - 50 };
    const guardAt = { x: BOSS_X - 40, y: BOSS_GROUND - 50 };
    drawSkillFx(ctx, t, since, j.skill || SKILL_KIND[shooter] || 'fist', fromAlly ? me : foe, fromAlly ? (j.phase === 'guard' ? guardAt : foe) : me);
    if (j.phase === 'guard') drawGuard(ctx, t, (since / SKILL_MS - HIT_AT + 0.1) / 0.6);
}
