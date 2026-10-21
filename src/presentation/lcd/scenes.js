// =====================================================================
// 液晶の場面 (動くもの)
// ---------------------------------------------------------------------
// 画面設計書の画面イメージ (tools/design/mockups.js) をもとに、時間 t (ミリ秒) で動くようにしたもの。
// どの場面を出すかは director.js が決め、ここは描くだけ。
// =====================================================================

import { ART } from '../art/characters.js';
import { drawSymbol } from '../art/symbols.js';
import {
    BODY, GROUND, H, RAINBOW, W, ch, cutin, floorTag, haze, rainbow, rays, rect, room, roundRect,
    seeded, text, vgrad
} from './kit.js';

export const TEAMS = {
    fiveDX: { name: 'チーム5DX', members: ['okagappa', 'hibikimakuri', 'yamamou'], color: '#3a7a2a' },
    ask3: { name: 'チームASK-3', members: ['sasaki', 'kotani', 'asahara'], color: '#2a4ad0' },
    muscle: { name: 'チームお願いマッスル', members: ['shibata', 'ikekimu', 'ueno'], color: '#c02828' }
};

const BOSS = { 22: 'daishi', 33: 'zumitani', 44: 'runaya', 55: 'nozoema', 56: 'maou' };
const BOSS_NAME = { 22: 'ダイシの間', 33: 'ズミタニの間', 44: 'ルナヤの間', 55: 'ノゾエマの間', 56: '大魔王の間' };

const frameOf = (t, ms = 320) => (Math.floor(t / ms) % 2);
const ease = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

// こおりくんのチーム (歩いている)
export function teamWalking(ctx, t, x = 110, ground = GROUND, scale = 2) {
    const f = frameOf(t);
    const bob = i => (Math.floor(t / 320 + i) % 2 ? -1 : 0);
    ch(ctx, 'dake', x - 52, ground + bob(0), { scale, frame: f });
    ch(ctx, 'tamu', x - 34, ground + bob(1), { scale, frame: f });
    ch(ctx, 'yasu', x - 16, ground + bob(2), { scale, frame: f });
    ch(ctx, 'onioni', x + 16, ground, { scale: scale * 0.8, frame: f });
    ch(ctx, 'koori', x + 50, ground, { scale: scale * 1.2, frame: f });
}

// ----- 通常時のステージ (階) -----
export function drawFloor(ctx, t, stage) {
    const { floor, state } = stage;
    if (state === 'super' || BOSS[floor]) return drawBossFloor(ctx, t, floor);
    if (state === 'high') {
        room(ctx, { sky: ['#ff8a40', '#ffd27a', '#7a4a8a'], wall: '#5a3a3a', floor: ['#6a4a3a', '#2a1a14'], cityColor: '#3a2030' });
        const enemy = floor % 2 ? 'makibikon' : 'nakata';
        const sway = Math.sin(t / 900) * 4;
        ch(ctx, enemy, 272 + sway, GROUND, { scale: enemy === 'nakata' ? 1.1 : 1.5, silhouette: true, alpha: 0.7 });
        teamWalking(ctx, t, 120);
        floorTag(ctx, `${floor}F`, '夕方の回廊', '#ffb060');
        return;
    }
    room(ctx, { sky: ['#7ac8f0', '#d8f0ff'], wall: '#d8cfc0', floor: ['#efe6d6', '#b8ad98'], cityColor: '#7a8aa0', lights: '#ffffff' });
    // エレベーター
    rect(ctx, 134, 40, 52, 88, '#8a8e96');
    rect(ctx, 137, 44, 22, 84, '#c8ccd4');
    rect(ctx, 161, 44, 22, 84, '#c8ccd4');
    text(ctx, '▲', 160, 34, { size: 8, color: frameOf(t, 700) ? '#ff8a20' : '#7a4a20', stroke: null });
    if (floor <= 5) {
        const hop = Math.abs(Math.sin(t / 260)) * 3;
        ch(ctx, 'harry', 268, GROUND - hop, { scale: 1.4, flip: true, frame: frameOf(t) });
    } else ch(ctx, 'urashima', 272, GROUND, { scale: 1.4, flip: true, frame: frameOf(t, 600) });
    teamWalking(ctx, t, 110);
    floorTag(ctx, `${floor}F`, floor === 1 ? 'エントランス' : 'ロビー');
}

function drawBossFloor(ctx, t, floor) {
    const boss = BOSS[floor] || 'daishi';
    if (boss === 'maou') {
        room(ctx, { sky: ['#1a0000', '#5a0a00'], wall: '#120808', floor: ['#5a1000', '#1a0400'], cityColor: '#200404', lights: '#ff6a20' });
        rect(ctx, 0, 0, W, H, `rgba(255,60,0,${0.06 + Math.sin(t / 400) * 0.04})`);
        ch(ctx, 'maou', 230, 140, { scale: 1.9, silhouette: true, alpha: 0.9, frame: frameOf(t, 800) });
    } else {
        room(ctx, { sky: ['#05040e', '#1a1040'], wall: '#14101c', floor: ['#3a0a14', '#14040a'], cityColor: '#0a0a14', lights: '#8fd6f7', stars: true });
        rect(ctx, 120, 128, 80, 52, '#8a1020');
        ch(ctx, boss, 232, 136, { scale: 2.5, silhouette: true, alpha: 0.85, frame: frameOf(t, 800) });
        // 目が光る
        if (frameOf(t, 1400)) text(ctx, '･ ･', 232, 52, { size: 10, color: '#ff4040', stroke: null });
    }
    teamWalking(ctx, t, 100);
    floorTag(ctx, `${floor}F`, BOSS_NAME[floor], boss === 'maou' ? '#ff8a40' : '#ff6a6a');
}

// ----- 前兆: 摩天楼中間階層 -----
function middleBackground(ctx, t) {
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#1a1438', '#3a2a5a', '#120c22']));
    for (let x = 0; x < W; x += 40) rect(ctx, x, 20, 6, 110, 'rgba(255,255,255,.06)');
    // ゆれる照明
    ctx.save();
    ctx.globalAlpha = 0.12 + Math.sin(t / 500) * 0.05;
    ctx.fillStyle = '#b080ff';
    ctx.beginPath();
    ctx.moveTo(160, 0);
    ctx.lineTo(60, 130);
    ctx.lineTo(260, 130);
    ctx.fill();
    ctx.restore();
    rect(ctx, 0, 128, W, 52, vgrad(ctx, 128, H, ['#4a3a6a', '#1a1028']));
}

export function drawMiddle(ctx, t, zencho) {
    middleBackground(ctx, t);
    const team = TEAMS[zencho.team];
    const f = frameOf(t);
    const since = t - zencho.since;
    // ライバルが右から入ってくる
    const enter = ease(since / 900);
    const off = (1 - enter) * 120;
    ch(ctx, 'yasu', 38, GROUND, { scale: 2, frame: f });
    ch(ctx, 'onioni', 70, GROUND, { scale: 1.5, frame: f });
    ch(ctx, 'koori', 108, GROUND, { scale: 3, frame: f });
    team.members.forEach((id, i) => ch(ctx, id, 210 + i * 39 + off, GROUND, { scale: ART[id].w > 34 ? 1.4 : 1.6, flip: true, frame: f }));
    roundRect(ctx, 80, 6, 160, 20, 3, 'rgba(0,0,0,.6)', '#b080ff');
    text(ctx, '摩天楼 中間階層', W / 2, 16.5, { size: 11, color: '#e0d0ff', stroke: null, font: BODY, weight: '700' });
    if (since < 2600) {
        const a = Math.min(1, since / 300);
        ctx.save();
        ctx.globalAlpha = a;
        text(ctx, `${team.name} 出現！`, W - 8, 40, { size: 14, align: 'right', color: '#ffffff', lw: 4, stroke: team.color, font: BODY, weight: '700' });
        text(ctx, 'VS', W / 2, 92, { size: 30 + Math.sin(since / 120) * 2, color: '#ffe040', lw: 6, stroke: '#a01010' });
        ctx.restore();
    }
}

// 連続演出 (前兆の最後)。battle: { round, of, final, win, since, phase }
//   phase: 'clash' (ぶつかる) → 'push' (最後: PUSH 待ち) → 'result' (最後: 結果)
export function drawBattle(ctx, t, zencho, battle) {
    middleBackground(ctx, t);
    const team = TEAMS[zencho.team];
    const since = t - battle.since;
    const final = battle.final;
    const ours = final ? 'koori' : ['yasu', 'tamu', 'dake'][(battle.round - 1) % 3];
    const theirs = final ? team.members[2] : team.members[(battle.round - 1) % 3];
    const label = final ? '決着！' : `${battle.round}戦目`;

    if (battle.phase === 'result') return drawBattleResult(ctx, t, zencho, battle);

    // 両側から走ってぶつかる
    const dash = ease(since / 700);
    const ox = 60 + dash * 55;
    const tx = 260 - dash * 55;
    const shake = since > 650 && since < 1000 ? Math.sin(since / 20) * 3 : 0;
    ch(ctx, ours, ox + shake, GROUND, { scale: ours === 'koori' ? 3.2 : 2.6, frame: frameOf(t, 160) });
    ch(ctx, theirs, tx - shake, GROUND, { scale: ART[theirs].w > 34 ? 1.7 : 2, flip: true, frame: frameOf(t, 160) });
    if (since > 650) {
        const k = Math.min(1, (since - 650) / 200);
        ctx.save();
        ctx.globalAlpha = 1 - Math.max(0, (since - 1100) / 400);
        rays(ctx, W / 2, 110, ['#ffffff', 'rgba(255,255,255,0)'], 28, 0.35 * k);
        ctx.restore();
    }
    roundRect(ctx, 110, 6, 100, 22, 4, 'rgba(0,0,0,.7)', final ? '#ffe040' : '#ffffff');
    text(ctx, label, W / 2, 17.5, { size: 13, color: final ? '#ffe040' : '#ffffff', stroke: null, font: BODY, weight: '700' });
    if (!final && since > 1100) text(ctx, '互角！', W / 2, 64, { size: 20, color: '#ffffff', lw: 5, stroke: '#3a2a6a' });
    if (final && battle.phase === 'push') {
        const pulse = 1 + Math.sin(t / 110) * 0.08;
        text(ctx, 'PUSH!', W / 2, 62, { size: 34 * pulse, color: buttonFill(ctx, battle.button, 40, 80), lw: 7, stroke: '#1a0a2a' });
    }
}

function drawBattleResult(ctx, t, zencho, battle) {
    const team = TEAMS[zencho.team];
    const since = t - battle.resultAt;
    if (battle.win) {
        rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#3a2a5a', '#6a4a9a', '#1a1028']));
        ctx.save();
        ctx.translate(W / 2, 100);
        ctx.rotate(t / 3000);
        ctx.translate(-W / 2, -100);
        rays(ctx, W / 2, 100, ['#ffffff', 'rgba(255,255,255,0)'], 30, 0.3);
        ctx.restore();
        const fly = ease(since / 500) * 30;
        team.members.forEach((id, i) => ch(ctx, id, 200 + i * 44 + fly, 168 - fly * 0.6, { scale: 1.3, flip: true, tint: '#ffffff', alpha: 0.75 }));
        ch(ctx, 'koori', 70, 172, { scale: 3.4, frame: frameOf(t, 200) });
        const pop = 1 + Math.max(0, 0.4 - since / 600);
        text(ctx, '撃破！！', W / 2, 28, { size: 30 * pop, color: '#ffe040', lw: 7, stroke: '#a01010' });
    } else {
        rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#1a1428', '#2a2238', '#0a0812']));
        team.members.forEach((id, i) => ch(ctx, id, 196 + i * 44, GROUND, { scale: ART[id].w > 34 ? 1.6 : 1.8, flip: true, frame: frameOf(t, 400) }));
        ch(ctx, 'kooriDown', 80, GROUND, { scale: 3 });
        rect(ctx, 0, 0, W, H, `rgba(0,0,30,${Math.min(0.35, since / 1500)})`);
        text(ctx, '撃破ならず…', W / 2, 50, { size: 24, color: '#a0b0c0', lw: 5, stroke: '#101018' });
    }
}

// ボーナス確定のあと (次のゲームで図柄をそろえる)
const AIM = { big: ['seven', 'seven', 'seven'], reg: ['seven', 'seven', 'bar'], epbig: ['koori', 'koori', 'koori'] };
const BONUS_NAME = { big: 'BIG BONUS', reg: 'REGULAR BONUS', epbig: 'EPISODE BIG' };

export function drawStandby(ctx, t, standby) {
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#3a2a5a', '#6a4a9a', '#1a1028']));
    ctx.save();
    ctx.translate(W / 2, 100);
    ctx.rotate(t / 3000);
    ctx.translate(-W / 2, -100);
    rays(ctx, W / 2, 100, RAINBOW, 36, 0.35);
    ctx.restore();
    ch(ctx, 'koori', 60, 174, { scale: 3, frame: frameOf(t, 200) });
    text(ctx, standby.stock ? `ボーナス確定！ ×${standby.stock + 1}` : 'ボーナス確定！', W / 2, 26, { size: 22, color: '#ffe040', lw: 6, stroke: '#a01010' });
    roundRect(ctx, 96, 46, 128, 62, 6, 'rgba(0,0,0,.75)', '#ffe040');
    text(ctx, BONUS_NAME[standby.bonus], W / 2, 60, { size: 11, color: '#ffffff', stroke: null });
    const blink = frameOf(t, 300);
    AIM[standby.bonus].forEach((id, i) => drawSymbol(ctx, id, 121 + i * 27, 72, 26));
    text(ctx, '狙え！', 270, 140, { size: 18, color: blink ? '#ffffff' : '#ffe040', lw: 5, stroke: '#a01010' });
}

// ----- カットイン -----
const CUTIN_COLORS = {
    blue: '#1f6ad0',
    green: '#1f9a4a',
    red: '#c81e2a',
    gold: null,
    rainbow: null
};
const CUTIN_LINES = { blue: 'いくぞ！', green: 'チャンスだ！', red: '勝つぞ！！', gold: '激アツ！！', rainbow: 'こおりいきていける！' };

function cutinFill(ctx, color) {
    if (color === 'gold') return vgrad(ctx, 40, 120, ['#fff2a0', '#d8a010', '#fff2a0']);
    if (color === 'rainbow') return rainbow(ctx, 0, 0, W, 0);
    return CUTIN_COLORS[color];
}

// 帯が左から入ってくるカットイン。since: 出てからのミリ秒
export function drawCutin(ctx, since, color, who = 'koori', line = null) {
    const k = ease(since / 220);
    ctx.save();
    ctx.translate((1 - k) * -W, 0);
    rect(ctx, (1 - k) * W, 0, W, H, `rgba(0,0,0,${0.4 * k})`);
    // キャラの大きさは背の高さでそろえる (こおりくん・ふるカワ・ともいしは小さい絵なので大きめに)
    cutin(ctx, 46, 84, cutinFill(ctx, color), who, '', { scale: Math.min(4, 90 / ART[who].h) });
    const s = line || CUTIN_LINES[color];
    text(ctx, s, 206, 88, { size: [...s].length > 10 ? 14 : 18, color: '#ffffff', lw: 5, stroke: '#1a0a0a' });
    ctx.restore();
}

// ----- PUSH ボタンの色 (液晶の文字にも使う) -----
export function buttonFill(ctx, color, y0 = 0, y1 = 40) {
    if (color === 'gold') return vgrad(ctx, y0, y1, ['#fff2a0', '#d8a010']);
    if (color === 'rainbow') return rainbow(ctx, 100, y0, 220, y1);
    return { white: '#ffffff', blue: '#4a9aff', red: '#ff3a4a' }[color] || '#ffffff';
}

// ----- フラッシュ (レア役) -----
export function drawFlash(ctx, since, level) {
    const dur = level === 'small' ? 260 : 600;
    if (since > dur) return;
    const a = 1 - since / dur;
    ctx.save();
    if (level === 'rainbow') {
        ctx.globalAlpha = a * 0.8;
        rect(ctx, 0, 0, W, H, rainbow(ctx, 0, 0, W, H));
    } else {
        ctx.globalAlpha = a * (level === 'small' ? 0.6 : 0.9);
        rect(ctx, 0, 0, W, H, level === 'big' && Math.floor(since / 80) % 2 ? '#ffe680' : '#ffffff');
    }
    ctx.restore();
}

// ----- エレベーター (階の移動) -----
// to が null のときは「中間階層」へ行く
export function drawElevator(ctx, since, from, to) {
    // 0〜400: 扉が閉まる / 400〜900: 階の数字 / 900〜1300: 扉が開く
    const close = since < 400 ? ease(since / 400) : since < 900 ? 1 : 1 - ease((since - 900) / 400);
    const half = (W / 2) * close;
    rect(ctx, 0, 0, half, H, '#8a8e96');
    rect(ctx, W - half, 0, half, H, '#8a8e96');
    rect(ctx, half - 3, 0, 3, H, '#5a5e66');
    rect(ctx, W - half, 0, 3, H, '#5a5e66');
    if (since >= 380 && since < 920) {
        roundRect(ctx, 104, 66, 112, 46, 6, '#14181f', '#ff8a20');
        if (to === null) {
            text(ctx, '▲ 中間階層', W / 2, 90, { size: 15, color: '#c8a0ff', stroke: null });
        } else {
            const k = Math.min(1, (since - 400) / 500);
            const shown = Math.round(from + (to - from) * k);
            text(ctx, `${to >= from ? '▲' : '▼'} ${shown}F`, W / 2, 90, { size: 20, color: '#ff8a20', stroke: null });
        }
    }
}

// ----- 天国のカットイン -----
export function drawHeaven(ctx, since, who) {
    const k = ease(since / 220);
    ctx.save();
    ctx.translate((1 - k) * W, 0);
    rect(ctx, 0, 0, W, H, 'rgba(0,0,0,.35)');
    cutin(ctx, 52, 76, who === 'aruaru' ? '#6a4a00' : '#a02a1a', who, '', { scale: who === 'aruaru' ? 2.2 : 2.6 });
    text(ctx, who === 'aruaru' ? '兄の出番だな…' : '内定のお知らせだ！', 214, 90, { size: 16, color: '#ffffff', lw: 5, stroke: '#1a0a0a' });
    ctx.restore();
}

// ----- 天井 -----
export function drawTenjo(ctx, t, since, who) {
    rect(ctx, 0, 0, W, H, '#1a0a00');
    ctx.save();
    ctx.translate(W / 2, 100);
    ctx.rotate(t / 2500);
    ctx.translate(-W / 2, -100);
    rays(ctx, W / 2, 100, RAINBOW, 36, 0.55);
    ctx.restore();
    const rise = ease(since / 800);
    ch(ctx, who, W / 2, 168 + (1 - rise) * 120, { scale: who === 'aruaru' ? 2.6 : 2.8 });
    text(ctx, '天井到達！', W / 2, 24, { size: 22, color: rainbow(ctx, 100, 0, 220, 0), lw: 5 });
    // 天井は BIG 以上確定: ナイナイなら BIG、アルアルならエピソードBIG (仕様書 2026-10-21)
    if (since > 900) {
        if (who === 'aruaru') text(ctx, 'エピソードBIG確定', W / 2, 160, { size: 20, color: rainbow(ctx, 70, 0, 250, 0), lw: 5 });
        else text(ctx, 'BIG確定', W / 2, 160, { size: 20, color: '#ffe040', lw: 5 });
    }
}

// ----- AT 直撃 -----
// phase: 'noise' (回っている間、ノイズが走る) / 'black' (暗転) / 'reveal' (こおりいきていける！)
export function drawDirect(ctx, t, since, phase) {
    const rnd = seeded(Math.floor(t / 60) + 1);
    if (phase === 'noise') {
        for (let i = 0; i < 14; i++) rect(ctx, 0, rnd() * H, W, 1 + rnd() * 3, `rgba(255,255,255,${0.1 + rnd() * 0.3})`);
        for (let i = 0; i < 120; i++) rect(ctx, rnd() * W, rnd() * H, 1, 1, 'rgba(255,255,255,.6)');
        return;
    }
    rect(ctx, 0, 0, W, H, '#000000');
    if (phase === 'black') return;
    for (let i = 0; i < 40; i++) rect(ctx, 0, rnd() * H, W, 1 + rnd() * 2, `rgba(255,255,255,${0.04 + rnd() * 0.15})`);
    const k = ease(since / 500);
    const g = rainbow(ctx, 120, 60 + Math.sin(t / 200) * 20, 200, 150);
    ch(ctx, 'koori', W / 2, 150, { scale: 6.2 * k, tint: g, alpha: 0.6 });
    ch(ctx, 'koori', W / 2, 146, { scale: 5.4 * k, frame: frameOf(t, 200) });
    if (since > 300) text(ctx, 'こおりいきていける！', W / 2, 26, { size: 20, color: rainbow(ctx, 60, 0, 260, 0), lw: 5 });
}

// ボーナスの画面は bonus.js、AT の画面は at.js

// ----- ふるカワのナビ (吹き出し) -----
export function drawNavi(ctx, line, since) {
    const k = ease(since / 250);
    ctx.save();
    ctx.globalAlpha = k;
    ch(ctx, 'furukawa', 22, 176 + (1 - k) * 20, { scale: 2, frame: Math.floor(since / 160) % 2 && since < 1200 ? 1 : 0 });
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
    ctx.restore();
}

export { haze };
