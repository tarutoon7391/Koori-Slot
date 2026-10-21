// =====================================================================
// 液晶の場面: AT「こおりバトルRASH」(画面設計書 5章)
// ---------------------------------------------------------------------
// 突入の画面 / ふだんの画面 (残りゲーム数・押し順ナビ) / 残りが少ないときの大きな数字 /
// 上乗せの攻撃 (仲間・おにおに・コオリソード・コオリハンマー・四天王絶対殺す剣) / 終了画面。
// どの場面を出すかは director.js が決め、ここは描くだけ。t・since はミリ秒。
// =====================================================================

import { ART } from '../art/characters.js';
import {
    BODY, GROUND, H, W, atBackground, ch, plusGames, pushButton, rainbow, rays, rect, room, roundRect, seeded, text,
    tower, vgrad, weapon
} from './kit.js';
import { TEAMS, teamWalking } from './scenes.js';

const frameOf = (t, ms = 320) => Math.floor(t / ms) % 2;
const ease = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

// 上乗せの相手 (摩天楼に住み着いた敵。キャラ設計書 6章)
export const ENEMY_NAMES = { harry: 'ハリー', urashima: '浦の島重蔵', makibikon: 'マキビコンMk-4', nakata: '奈架多ドラゴン', goldDog: 'ゴールド金面犬' };
// 攻撃するキャラの技 (前作の必殺技) と、こおりくんの武器 (キャラ設計書 2章。ボタン操作: ソード PUSH 1回 / ハンマー 長押し / 絶対殺す剣 PUSH 4回)
export const ATTACKS = {
    yasu: { who: 'yasu', name: 'やすパンチ' },
    tamu: { who: 'tamu', name: 'たむキック' },
    dake: { who: 'dake', name: 'だけチョップ' },
    onioni: { who: 'onioni', name: '鬼鬼の金棒' },
    sword: { who: 'koori', name: 'コオリソード', weapon: 'sword', button: 'push', pushes: 1 },
    hammer: { who: 'koori', name: 'コオリハンマー', weapon: 'hammer', button: 'long' },
    kill: { who: 'koori', name: '四天王絶対殺す剣', weapon: 'kill', button: 'push', pushes: 4 }
};

// ----- 上の帯: こおりバトルRASH と残りゲーム数 -----
function topBar(ctx, left, payout) {
    rect(ctx, 0, 0, W, 22, 'rgba(0,0,0,.55)');
    text(ctx, 'こおりバトルRASH', 8, 11.5, { size: 12, align: 'left', color: '#8fd6f7', stroke: null });
    roundRect(ctx, W - 92, 3, 86, 17, 3, 'rgba(255,255,255,.12)');
    text(ctx, '残り', W - 76, 11.5, { size: 9, color: '#c8e8ff', stroke: null, font: BODY });
    text(ctx, `${left}G`, W - 36, 11.5, { size: 13, color: left <= 10 ? '#ffd23a' : '#ffffff', stroke: null });
    if (payout !== undefined) text(ctx, `獲得 ${payout}枚`, 8, 170, { size: 9, align: 'left', color: '#c8e8ff', stroke: null, font: BODY });
}

// ----- AT 中の前兆の画面に重ねる小さな札 (左下に「RASH 残り〇G」) -----
export function atBadge(ctx, left) {
    roundRect(ctx, 6, 154, 92, 18, 3, 'rgba(5,10,20,.85)', '#8fd6f7');
    text(ctx, 'RASH', 22, 163.5, { size: 9, color: '#8fd6f7', stroke: null });
    text(ctx, `残り ${left}G`, 66, 163.5, { size: 10, color: left <= 10 ? '#ffd23a' : '#ffffff', stroke: null, font: BODY, weight: '700' });
}

// ----- ふだんの画面: 摩天楼を駆け上がるチーム -----
// at: { left, payout, add: { games, at } | null, nav }
export function drawAtMain(ctx, t, at) {
    atBackground(ctx);
    // 流れる線 (疾走感)
    const rnd = seeded(3);
    for (let i = 0; i < 30; i++) {
        const x = (rnd() * W * 2 - (t / 3) % (W * 2) + W * 2) % (W * 2) - W / 2;
        rect(ctx, x, rnd() * 130, 30 + rnd() * 50, 1, 'rgba(140,215,250,.4)');
    }
    tower(ctx, 260, 130, 110, '#06101c');
    teamWalking(ctx, t, 120);
    topBar(ctx, at.left, at.payout);
    // 押し順ナビ (リールの上の数字と同じ順番を液晶にも出す)
    // 順押しナビ (左から) はボーナスか特化ゾーンの当選が確定 (仕様書): 虹色の枠と「順押し!?」
    if (at.nav) {
        const names = ['左', '中', '右'];
        const hot = at.nav[0] === 0;
        roundRect(ctx, 176, 140, 136, 22, 4, 'rgba(0,0,0,.65)', hot ? rainbow(ctx, 176, 0, 312, 0) : '#ff3a3a');
        text(ctx, at.nav.map((r, i) => `${i + 1}${names[r]}`).join(' → '), 244, 151.5, { size: 11, color: hot ? rainbow(ctx, 190, 0, 300, 0) : frameOf(t, 250) ? '#ffffff' : '#ffd0d0', stroke: null, font: BODY, weight: '700' });
        if (hot) {
            const pop = 1 + Math.sin(t / 90) * 0.06;
            text(ctx, '順押し!?', 244, 126, { size: 16 * pop, color: rainbow(ctx, 200, 0, 290, 0), lw: 5, stroke: '#1a0a2a' });
        }
    }
    // 上乗せしたあとの「+〇G」(攻撃の画面のあと、少しだけ残す)
    if (at.add && t - at.add.at < 1200) {
        const since = t - at.add.at;
        ctx.save();
        ctx.globalAlpha = 1 - Math.max(0, (since - 800) / 400);
        plusGames(ctx, `+${at.add.games}G`, W - 60, 40, 20);
        ctx.restore();
    }
}

// ----- 突入 -----
export const START_MS = 2400;
export function drawAtStart(ctx, t, since, games) {
    atBackground(ctx);
    ctx.save();
    ctx.translate(W / 2, 90);
    ctx.rotate(t / 1500);
    ctx.translate(-W / 2, -90);
    rays(ctx, W / 2, 90, ['#8fd6f7', 'rgba(0,0,0,0)'], 30, 0.4);
    ctx.restore();
    // チームが左から走ってくる
    const run = ease(since / 700);
    teamWalking(ctx, t * 2, -60 + run * 180);
    const pop = 1 + Math.max(0, 0.5 - since / 400);
    text(ctx, 'こおりバトルRASH', W / 2, 44, { size: 26 * pop, color: vgrad(ctx, 30, 58, ['#ffffff', '#8fd6f7', '#3a8ad0']), lw: 7, stroke: '#06203a' });
    if (since > 500) text(ctx, '突入！', W / 2, 78, { size: 24, color: rainbow(ctx, 110, 0, 210, 0), lw: 6 });
    if (since > 900) plusGames(ctx, `${games}G`, 254, 120, 30);
}

// ----- 残りが少ないときの大きな数字 (10・5・3・2・1G) -----
export const COUNT_MS = 1300;
export function drawAtCount(ctx, t, since, left) {
    const a = since > COUNT_MS - 300 ? 1 - (since - COUNT_MS + 300) / 300 : 1;
    ctx.save();
    ctx.globalAlpha = a;
    rect(ctx, 0, 0, W, H, 'rgba(0,0,0,.55)');
    text(ctx, '残り', W / 2, 52, { size: 16, color: '#ffffff', lw: 4 });
    const pop = 1 + Math.max(0, 0.4 - since / 300);
    const fill = left <= 3 ? vgrad(ctx, 70, 140, ['#fff2a0', '#ff6a3a']) : vgrad(ctx, 70, 140, ['#ffffff', '#8fd6f7']);
    text(ctx, `${left}G`, W / 2, 104, { size: 64 * pop, color: fill, lw: 8, stroke: left <= 3 ? '#5a1000' : '#0a2a5a' });
    ctx.restore();
}

// ----- 上乗せの攻撃 -----
// a: { attacker, enemy, games, left, phase, since, gauge, pushes }
//   phase: 'appear' (相手が出てくる) → 'push' (武器のときだけ。ボタンを待つ) → 'hit' (攻撃) → 'result' (+〇G)
//   miss: true のときは上乗せなし (相手がよけて「ミス！」。画面設計書 5-2)
export const ATTACK_MS = { appear: 900, hit: 800, result: 1700 };
export function drawAttack(ctx, t, a) {
    const since = t - a.since;
    const atk = ATTACKS[a.attacker] || ATTACKS.yasu;
    const enemyArt = ART[a.enemy] || ART.harry;
    room(ctx, { sky: ['#1a1030', '#4a2a6a'], wall: '#2a2238', floor: ['#3a3048', '#1a1424'], stars: true });
    rect(ctx, 0, 0, W, H, 'rgba(10,0,30,.35)');
    const big = a.games >= 100;
    rays(ctx, 220, 110, [big ? '#ffe680' : '#ffffff', 'rgba(255,255,255,0)'], 30, big ? 0.25 : 0.15);

    // 相手: 右から出てくる → 攻撃で白く光ってゆれる → 結果で吹き飛ぶ
    const eScale = enemyArt.w > 40 ? 1.6 : 2;
    let ex = 234;
    let eAlpha = 1;
    let hurt = false;
    if (a.phase === 'appear') ex += (1 - ease(since / 400)) * 120;
    let ey = GROUND;
    if (a.phase === 'hit' && a.miss) {
        // ひょいとよける (上に跳んで横へ)
        ex += ease(since / 300) * 30;
        ey -= Math.sin(Math.min(1, since / 500) * Math.PI) * 34;
    } else if (a.phase === 'hit') {
        hurt = since > 350 && frameOf(since, 70) === 1;
        ex += since > 350 ? Math.sin(since / 25) * 3 : 0;
    }
    if (a.phase === 'result' && a.miss) ex += 30;
    else if (a.phase === 'result') {
        ex += ease(since / 500) * 90;
        eAlpha = Math.max(0, 1 - since / 600);
    }
    if (eAlpha > 0) ch(ctx, a.enemy, ex, ey, { scale: eScale, flip: false, frame: frameOf(t, 400), tint: hurt ? '#ffffff' : null, alpha: eAlpha });

    // 攻撃するキャラ: 攻撃のときに相手へ飛びこむ
    const dash = a.phase === 'hit' ? ease(since / 350) : a.phase === 'result' ? 1 - ease(since / 400) : 0;
    const ax = 96 + dash * 90;
    const aScale = atk.who === 'koori' ? 3 : atk.who === 'onioni' ? 1.6 : 2.4;
    ch(ctx, atk.who, ax, 146, { scale: aScale, flip: atk.who === 'onioni', frame: frameOf(t, 200) });
    if (atk.weapon) weapon(ctx, atk.weapon, ax + 28, 118);

    // 当たった光
    if (a.phase === 'hit' && since > 330 && !a.miss) {
        const k = Math.min(1, (since - 330) / 150);
        ctx.save();
        ctx.globalAlpha = 0.9 * (1 - Math.max(0, (since - 600) / 200));
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
            const ang = (i / 16) * Math.PI * 2, rr = (i % 2 ? 10 : 26) * k * (big ? 1.4 : 1);
            ctx.lineTo(205 + Math.cos(ang) * rr, 105 + Math.sin(ang) * rr);
        }
        ctx.closePath();
        ctx.fillStyle = atk.weapon === 'kill' ? rainbow(ctx, 180, 80, 230, 130) : '#fff6b0';
        ctx.fill();
        ctx.restore();
    }

    // 名前
    const label = atk.weapon ? atk.name : `${atk.name}！`;
    text(ctx, label, 100, 36, { size: atk.weapon === 'kill' ? 13 : 12, color: atk.weapon === 'kill' ? rainbow(ctx, 30, 0, 170, 0) : atk.weapon ? '#bff0ff' : '#ffffff', lw: 4 });
    if (a.phase === 'appear' || a.phase === 'push') text(ctx, `${ENEMY_NAMES[a.enemy] || ''} 出現！`, W - 10, 36, { size: 11, align: 'right', color: '#ffd0d0', lw: 4, stroke: '#3a0010' });

    // ボタン操作
    if (a.phase === 'push') drawPushPrompt(ctx, t, atk, a);

    // 結果: +〇G (ミスのときは「ミス！」)
    if (a.phase === 'result' && a.miss) {
        const pop = 1 + Math.max(0, 0.5 - since / 300);
        text(ctx, 'ミス！', 210, 64, { size: 30 * pop, color: '#c8d4e0', lw: 6, stroke: '#1a2230' });
        if (since > 300) text(ctx, 'よけられた…', 210, 98, { size: 12, color: '#ffffff', lw: 3 });
    } else if (a.phase === 'result') {
        const pop = 1 + Math.max(0, 0.5 - since / 300);
        plusGames(ctx, `+${a.games}G`, 220, 64, 36 * pop * (a.games >= 300 ? 1.2 : 1));
        if (since > 300) text(ctx, '撃破！', 220, 100, { size: 16, color: '#ffffff', lw: 4, stroke: '#5a1000' });
        if (a.games >= 300) {
            ctx.save();
            ctx.globalAlpha = 0.25 * (1 - Math.min(1, since / 1200));
            rect(ctx, 0, 0, W, H, rainbow(ctx, 0, 0, W, H));
            ctx.restore();
        }
    }

    rect(ctx, 0, 0, W, 16, 'rgba(0,0,0,.6)');
    text(ctx, 'こおりバトルRASH', 8, 8.5, { size: 9, align: 'left', stroke: null, color: '#8fd6f7' });
    text(ctx, `残り ${a.phase === 'result' || a.miss ? a.left : a.left - a.games}G`, W - 8, 8.5, { size: 9, align: 'right', stroke: null });
}

function drawPushPrompt(ctx, t, atk, a) {
    const pulse = 1 + Math.sin(t / 110) * 0.08;
    const fill = atk.weapon === 'kill' ? rainbow(ctx, 11, 140, 50, 180) : atk.weapon === 'hammer' ? '#2a7ae0' : '#e8eef4';
    pushButton(ctx, 30, 156, 13 * pulse, fill);
    if (atk.button === 'long') {
        roundRect(ctx, 50, 152, 90, 9, 3, '#1a2230');
        if (a.gauge > 0) roundRect(ctx, 50, 152, 90 * Math.min(1, a.gauge), 9, 3, '#ffd23a');
        text(ctx, '長押し！', 146, 156.5, { size: 11, align: 'left', color: '#ffffff', lw: 3 });
    } else if (atk.pushes > 1) {
        for (let i = 0; i < atk.pushes; i++) roundRect(ctx, 50 + i * 14, 151, 10, 10, 2, i < a.pushes ? '#ffd23a' : '#3a4250');
        text(ctx, `PUSH ×${atk.pushes}`, 110, 156.5, { size: 11, align: 'left', color: '#ffffff', lw: 3 });
    } else {
        text(ctx, 'PUSH!', 50, 156.5, { size: 16 * pulse, align: 'left', color: '#ffffff', lw: 4, stroke: '#1a2a4a' });
    }
}

// ----- 終了画面 -----
// end: { games, payout, adds, addTotal, best, hint, trophy }
export const END_MS = 4000;
export function drawAtEnd(ctx, t, since, end) {
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#0d1117', '#1a2a3a']));
    text(ctx, 'こおりバトルRASH 終了', W / 2, 16, { size: 13, color: '#8fd6f7', stroke: null });
    const rows = [
        ['総獲得枚数', `${end.payout.toLocaleString()}枚`],
        ['総ゲーム数', `${end.games}G`],
        ['上乗せ', `${end.adds}回`],
        ['上乗せの合計', `+${end.addTotal}G`],
        ['最高の上乗せ', end.best ? `+${end.best}G` : '-']
    ];
    rows.forEach(([k, v], i) => {
        if (since < 300 + i * 250) return;
        text(ctx, k, 16, 44 + i * 24, { size: 10, align: 'left', color: '#a8bccc', stroke: null, font: BODY });
        text(ctx, v, 150, 44 + i * 24, { size: 13, align: 'right', color: '#ffffff', stroke: null });
        rect(ctx, 16, 54 + i * 24, 134, 1, 'rgba(255,255,255,.12)');
    });
    drawHint(ctx, t, end.hint || 'team');
    // 設定示唆トロフィー: 左下に落ちてくる (前作と同じ。色は内部処理の at:end の trophy)
    if (end.trophy && since > 900) {
        const fall = Math.min(1, (since - 900) / 400);
        const bounce = fall < 1 ? 0 : Math.abs(Math.sin((since - 1300) / 90)) * Math.max(0, 4 - (since - 1300) / 100);
        drawTrophy(ctx, t, 24, -20 + fall * 197 - bounce, end.trophy, 1.2);
    }
}

// ----- 終了画面の設定示唆の画像 (画面設計書 7-1。どれを出すかは内部処理の at:end の hint) -----
export const HINTS = {
    team: { name: 'チームばりきつよめ', ids: ['yasu', 'tamu', 'dake', 'onioni', 'koori'], sky: ['#7ac8f0', '#d8f0ff'] },
    fiveDX: { name: 'チーム5DX', ids: ['okagappa', 'hibikimakuri', 'yamamou'], sky: ['#5ab84a', '#d8f0c0'] },
    ask3: { name: 'チームASK-3', ids: ['sasaki', 'asahara', 'kotani'], sky: ['#2a4ad0', '#c0d0ff'] },
    muscle: { name: 'チームお願いマッスル', ids: ['shibata', 'ueno', 'ikekimu'], sky: ['#c02828', '#ffd0c0'] },
    shitenno: { name: 'ASO四天王', ids: ['daishi', 'zumitani', 'runaya', 'nozoema'], sky: ['#2a0a20', '#6a2a4a'] },
    maou: { name: '大魔王ASO', ids: ['maou'], sky: ['#3a0000', '#ff5a1a'] },
    all: { name: '全員集合', ids: ['koori', 'onioni', 'goldDog', 'maou', 'asahara', 'ueno'], sky: ['#fff2a0', '#d8a010'], gold: true }
};

function drawHint(ctx, t, id) {
    const h = HINTS[id] || HINTS.team;
    const x = 166, y = 32, w = 142, hh = 132;
    roundRect(ctx, x, y, w, hh, 4, '#05080b', h.gold ? rainbow(ctx, x, y, x + w, y + hh) : '#ffd700');
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 2, y + 2, w - 4, hh - 4);
    ctx.clip();
    rect(ctx, x + 2, y + 2, w - 4, hh - 4, vgrad(ctx, y, y + hh, h.sky));
    const f = frameOf(t, 400);
    const n = h.ids.length;
    h.ids.forEach((cid, i) => {
        const a = ART[cid];
        const scale = Math.min(((w - 12) / n) / a.w, 70 / a.h, 1.8);
        ch(ctx, cid, x + 6 + ((w - 12) / n) * (i + 0.5), y + hh - 14, { scale, frame: f });
    });
    if (h.gold) {
        ctx.save();
        ctx.globalAlpha = 0.2 + Math.sin(t / 200) * 0.08;
        rect(ctx, x, y, w, hh, '#fff6b0');
        ctx.restore();
    }
    ctx.restore();
    text(ctx, h.name, x + w / 2, 172, { size: 9, color: '#c8d4e0', stroke: null, font: BODY });
}

// ----- AT 0G の当落告知「ラストジャッジ」(画面設計書 5-4。イベントは at:judge) -----
// j: { team, win, phase: 'intro' | 'result', since }
export function drawAtJudge(ctx, t, j) {
    const since = t - j.since;
    rect(ctx, 0, 0, W, H, '#05040a');
    const team = TEAMS[j.team] || TEAMS.fiveDX;
    if (j.phase === 'intro') {
        // 暗い中に相手チームが立ちはだかる
        rays(ctx, W / 2, 96, ['rgba(255,60,60,.5)', 'rgba(0,0,0,0)'], 24, 0.3 + Math.sin(t / 150) * 0.1);
        team.members.forEach((id, i) => ch(ctx, id, 190 + i * 44, 138, { scale: 1.6, flip: true, frame: frameOf(t, 300), silhouette: since < 600 }));
        ch(ctx, 'koori', 70, 140, { scale: 3, frame: frameOf(t, 300) });
        text(ctx, '残り 0G', W / 2, 24, { size: 12, color: '#ff8a8a', lw: 3 });
        const pop = 1 + Math.max(0, 0.4 - since / 400);
        text(ctx, 'ラストジャッジ！', W / 2, 54, { size: 24 * pop, color: vgrad(ctx, 40, 68, ['#ffffff', '#ff6a6a']), lw: 6, stroke: '#3a0008' });
        if (since > 700) pushButton(ctx, W / 2, 156, 14 * (1 + Math.sin(t / 110) * 0.08), '#e02a3a');
        return;
    }
    if (j.win) {
        rays(ctx, W / 2, 90, ['#ffe680', 'rgba(0,0,0,0)'], 30, 0.45);
        team.members.forEach((id, i) => ch(ctx, id, 200 + i * 40 + ease(since / 500) * 80, 150, { scale: 1.4, flip: true, tint: '#ffffff', alpha: Math.max(0, 1 - since / 600) }));
        ch(ctx, 'koori', 90, 168, { scale: 3.4, frame: frameOf(t, 200) });
        text(ctx, '撃破！！', W / 2, 36, { size: 28, color: '#ffe040', lw: 7, stroke: '#a01010' });
        if (since > 400) text(ctx, 'ボーナス確定！', W / 2, 76, { size: 22, color: rainbow(ctx, 80, 0, 240, 0), lw: 5 });
    } else {
        team.members.forEach((id, i) => ch(ctx, id, 190 + i * 44, 138, { scale: 1.6, flip: true, frame: frameOf(t, 300) }));
        ch(ctx, 'kooriDown', 80, 140, { scale: 3 });
        rect(ctx, 0, 0, W, H, 'rgba(0,0,30,.4)');
        text(ctx, 'RASH 終了…', W / 2, 60, { size: 24, color: '#a0b0c0', lw: 5, stroke: '#101018' });
    }
}

// ----- 設定示唆トロフィー (前作と同じ色: 白・青・緑・紫・赤・虹) -----
// (x, ground) は台座の下の真ん中。scale は 1 で 16x20 ドット
const TROPHY_COLORS = { white: ['#ffffff', '#c8d0da', '#8a96a6'], blue: ['#9ac8ff', '#3a86ff', '#1a4ab0'], green: ['#a0f0b0', '#40c060', '#1a7a3a'], purple: ['#e0c0ff', '#a060ff', '#5a2aa0'], red: ['#ffb0b0', '#ff3a4a', '#a01020'] };
export function drawTrophy(ctx, t, x, ground, color, scale = 1) {
    const s = scale;
    const left = x - 8 * s, top = ground - 20 * s;
    const r = (rx, ry, w, h, fill) => rect(ctx, left + rx * s, top + ry * s, w * s, h * s, fill);
    let [light, main, dark] = TROPHY_COLORS[color] || TROPHY_COLORS.white;
    if (color === 'rainbow') {
        const g = rainbow(ctx, left + ((t / 8) % (16 * s)) - 16 * s, top, left + ((t / 8) % (16 * s)) + 16 * s, top + 20 * s);
        light = '#ffffff';
        main = g;
        dark = '#5a2aa0';
    }
    // 取っ手
    r(0, 3, 2, 6, dark);
    r(14, 3, 2, 6, dark);
    r(1, 8, 3, 2, dark);
    r(12, 8, 3, 2, dark);
    // 杯
    r(2, 1, 12, 9, main);
    r(3, 10, 10, 2, main);
    r(5, 12, 6, 2, dark);
    r(3, 2, 2, 6, light);
    r(2, 0, 12, 1, dark);
    // 脚と台座
    r(7, 14, 2, 3, dark);
    r(4, 17, 8, 3, main);
    r(4, 19, 8, 1, dark);
    if (color === 'rainbow' && Math.floor(t / 200) % 2) {
        text(ctx, '✦', left + 16 * s, top + 2 * s, { size: 6 * s, color: '#ffffff', stroke: null });
        text(ctx, '✦', left - 1 * s, top + 12 * s, { size: 5 * s, color: '#ffffff', stroke: null });
    }
}
