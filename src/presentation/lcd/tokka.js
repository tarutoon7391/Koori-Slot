// =====================================================================
// 液晶の場面: 上乗せ特化ゾーン (画面設計書 6章)
// ---------------------------------------------------------------------
// 当選したときのフリーズ風の「特化ゾーン ストック！」/ パターンを選ぶ画面 /
// 魔王の褒美 (3G 終わってから宝箱で結果をまとめて出す。継続確定なら虹フラッシュ) /
// こおり大腸炎 (1G ごとに上乗せを出す。継続確定なら炎とこおりくんが虹色になって「確定」) / 復活！ / 終了。
// どの場面を出すかは director.js が決め、ここは描くだけ。t・since はミリ秒。
// =====================================================================

import { BODY, H, RAINBOW, W, ch, plusGames, rainbow, rays, rect, room, roundRect, seeded, text, vgrad } from './kit.js';

export const PATTERNS = {
    maou: { name: '魔王の褒美', note: '3G 終わってから まとめて結果' },
    daichoen: { name: 'こおり大腸炎', note: '1G ごとに上乗せ' }
};

const frameOf = (t, ms = 320) => Math.floor(t / ms) % 2;
const ease = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

function spinRays(ctx, t, cx, cy, colors, count, alpha, speed = 3000) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t / speed);
    ctx.translate(-cx, -cy);
    rays(ctx, cx, cy, colors, count, alpha);
    ctx.restore();
}

// ----- 当選: フリーズ風の「特化ゾーン ストック！」 -----
export const STOCK_MS = 2600;
export function drawTokkaStock(ctx, t, since, stock) {
    // はじめは一瞬止まって見せる (ノイズが少し走る)
    if (since < 450) {
        rect(ctx, 0, 0, W, H, 'rgba(0,0,0,.35)');
        const rnd = seeded(Math.floor(t / 80) + 1);
        for (let i = 0; i < 6; i++) rect(ctx, 0, rnd() * H, W, 1 + rnd() * 2, 'rgba(255,255,255,.25)');
        return;
    }
    rect(ctx, 0, 0, W, H, '#000000');
    const k = since - 450;
    if (k < 120) {
        rect(ctx, 0, 0, W, H, `rgba(255,255,255,${1 - k / 120})`);
        return;
    }
    spinRays(ctx, t, W / 2, 90, ['#ffd23a', 'rgba(0,0,0,0)'], 30, 0.35, 1800);
    const pop = 1 + Math.max(0, 0.5 - k / 300);
    text(ctx, '特化ゾーン', W / 2, 62, { size: 30 * pop, color: vgrad(ctx, 46, 78, ['#fff6b0', '#ffd23a', '#c88a10']), lw: 7, stroke: '#3a1a00' });
    if (k > 300) text(ctx, 'ストック！', W / 2, 104, { size: 26, color: rainbow(ctx, 90, 0, 230, 0), lw: 6 });
    if (k > 600 && stock > 1) text(ctx, `×${stock}`, W / 2, 140, { size: 18, color: '#ffffff', lw: 4 });
}

// ----- パターンを選ぶ画面 -----
// choice: 'maou' | 'daichoen' / left: 残りミリ秒
export function drawTokkaSelect(ctx, t, choice, left) {
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#14081e', '#2a0a2a', '#0a0410']));
    text(ctx, '特化ゾーンの演出を選んでね', W / 2, 16, { size: 13, color: '#ffffff', lw: 3 });
    const panels = [['maou', 12], ['daichoen', 166]];
    panels.forEach(([id, x]) => {
        const on = id === choice;
        const y = on ? 30 : 34;
        roundRect(ctx, x, y, 142, 112, 6, on ? 'rgba(60,20,40,.95)' : 'rgba(20,10,20,.8)', on ? '#ffd23a' : '#5a4a5a');
        ctx.save();
        ctx.beginPath();
        ctx.rect(x + 4, y + 4, 134, 78);
        ctx.clip();
        if (id === 'maou') {
            rect(ctx, x + 4, y + 4, 134, 78, vgrad(ctx, y, y + 82, ['#1a0000', '#5a0a00']));
            ch(ctx, 'maou', x + 96, y + 82, { scale: 1.1, frame: frameOf(t, 700) });
            drawChest(ctx, x + 34, y + 76, 1, false);
        } else {
            rect(ctx, x + 4, y + 4, 134, 78, vgrad(ctx, y, y + 82, ['#3a1000', '#a03a00']));
            drawFlames(ctx, t, x + 71, y + 80, 0.8, false);
            ch(ctx, 'koori', x + 71, y + 78, { scale: 2.6, frame: frameOf(t, 160) });
        }
        ctx.restore();
        if (!on) rect(ctx, x, y, 142, 112, 'rgba(0,0,0,.45)');
        text(ctx, PATTERNS[id].name, x + 71, y + 94, { size: 14, color: on ? '#ffe680' : '#a89aa8', lw: 3 });
        text(ctx, PATTERNS[id].note, x + 71, y + 107, { size: 8, color: on ? '#ffffff' : '#8a7a8a', stroke: null, font: BODY });
    });
    const sec = Math.ceil(left / 1000);
    text(ctx, `左・右の停止ボタンか、画面のタップで選んで  PUSH で決定（あと${sec}秒）`, W / 2, 160, { size: 8, color: frameOf(t, 500) ? '#ffffff' : '#ffd0e0', stroke: null, font: BODY });
    text(ctx, '上乗せや継続のしやすさは同じだよ', W / 2, 172, { size: 8, color: '#a89aa8', stroke: null, font: BODY });
}

// ----- 始まりのタイトル -----
export const INTRO_MS = 1600;
export function drawTokkaIntro(ctx, t, since, pattern, setGames = 3) {
    const a = since > INTRO_MS - 300 ? 1 - (since - INTRO_MS + 300) / 300 : 1;
    ctx.save();
    ctx.globalAlpha = a;
    rect(ctx, 0, 0, W, H, pattern === 'maou' ? '#1a0000' : '#3a1000');
    spinRays(ctx, t, W / 2, 90, pattern === 'maou' ? ['#ff6a20', 'rgba(0,0,0,0)'] : ['#ffb040', 'rgba(0,0,0,0)'], 30, 0.4, 1500);
    const pop = 1 + Math.max(0, 0.5 - since / 300);
    text(ctx, PATTERNS[pattern].name, W / 2, 76, { size: 30 * pop, color: vgrad(ctx, 60, 92, ['#fff6b0', '#ffd23a', '#c88a10']), lw: 7, stroke: '#3a0a00' });
    if (since > 400) text(ctx, `1セット ${setGames}G  リプレイ以上で継続！`, W / 2, 116, { size: 12, color: '#ffffff', lw: 4, stroke: '#3a0a00' });
    ctx.restore();
}

// ----- 宝箱 (魔王の褒美) -----
function drawChest(ctx, x, ground, scale = 1, open = false, rainbowLid = false, t = 0) {
    const w = 30 * scale, h = 20 * scale;
    const y = ground - h;
    rect(ctx, x - w / 2, y, w, h, '#7a3a10');
    rect(ctx, x - w / 2, y, w, 3 * scale, '#ffd23a');
    rect(ctx, x - w / 2, y + h - 3 * scale, w, 3 * scale, '#ffd23a');
    rect(ctx, x - 2 * scale, y + 4 * scale, 4 * scale, 6 * scale, '#ffd23a');
    if (open) {
        // 開いたふたと、中の光
        rect(ctx, x - w / 2, y - 10 * scale, w, 8 * scale, rainbowLid ? rainbow(ctx, x - w / 2, 0, x + w / 2, 0) : '#9a4a18');
        ctx.save();
        ctx.globalAlpha = 0.6;
        rect(ctx, x - w / 2 + 3, y - 2, w - 6, 4, '#fff6b0');
        ctx.restore();
    } else {
        rect(ctx, x - w / 2, y - 6 * scale, w, 7 * scale, '#9a4a18');
        rect(ctx, x - w / 2, y - 6 * scale, w, 2 * scale, '#ffd23a');
    }
}

// ----- 炎 (こおり大腸炎)。rainbowFire: 虹色の炎 (継続確定) -----
function drawFlames(ctx, t, cx, ground, scale = 1, rainbowFire = false) {
    const rnd = seeded(9);
    for (let i = 0; i < 18; i++) {
        const ox = (rnd() - 0.5) * 120 * scale;
        const speed = 600 + rnd() * 600;
        const k = ((t + rnd() * speed) % speed) / speed;
        const fy = ground - k * 70 * scale;
        const size = (12 - k * 9) * scale;
        const color = rainbowFire ? RAINBOW[(i + Math.floor(t / 120)) % RAINBOW.length] : ['#ff3a1a', '#ff8a20', '#ffd23a'][i % 3];
        ctx.save();
        ctx.globalAlpha = 0.85 * (1 - k);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx + ox, fy - size);
        ctx.quadraticCurveTo(cx + ox + size * 0.7, fy, cx + ox, fy + size * 0.6);
        ctx.quadraticCurveTo(cx + ox - size * 0.7, fy, cx + ox, fy - size);
        ctx.fill();
        ctx.restore();
    }
}

// ----- 上の帯 -----
function tokkaBar(ctx, z, total) {
    rect(ctx, 0, 0, W, 20, 'rgba(0,0,0,.6)');
    text(ctx, PATTERNS[z.pattern].name, 8, 10.5, { size: 11, align: 'left', color: z.pattern === 'maou' ? '#ff9a6a' : '#ffb040', stroke: null });
    text(ctx, `SET ${z.set}`, 140, 10.5, { size: 11, color: '#ffffff', stroke: null });
    text(ctx, `${z.games.length}/3G`, 180, 10.5, { size: 9, color: '#c8c8d8', stroke: null, font: BODY });
    plusGames(ctx, `+${total}G`, W - 40, 10.5, 13);
}

// ----- 特化ゾーンの画面 -----
// z: { pattern, set, games: [{ add, guarantee }], gained, guarantee, phase, since, shownTotal, pop, kakuteiAt, result }
//   phase: 'play' (ゲーム中) / 'open' (魔王の褒美: 宝箱を開ける) / 'result' (継続！・復活！・終了)
export const OPEN_STEP_MS = 500;
export function drawTokka(ctx, t, z) {
    if (z.pattern === 'maou') drawMaou(ctx, t, z);
    else drawDaichoen(ctx, t, z);
    tokkaBar(ctx, z, z.shownTotal);
    if (z.phase === 'result') drawSetResult(ctx, t, t - z.since, z.result);
}

function drawMaou(ctx, t, z) {
    room(ctx, { sky: ['#1a0000', '#5a0a00'], wall: '#120808', floor: ['#5a1000', '#1a0400'], cityColor: '#200404', lights: '#ff6a20' });
    rect(ctx, 0, 0, W, H, `rgba(255,60,0,${0.06 + Math.sin(t / 400) * 0.04})`);
    // 玉座の魔王
    rect(ctx, 214, 70, 72, 70, '#3a0a10');
    rect(ctx, 214, 70, 72, 6, '#ffd23a');
    ch(ctx, 'maou', 250, 146, { scale: 1.3, frame: frameOf(t, 700) });
    text(ctx, '褒美をとらせよう…', 250, 34, { size: 10, color: '#ffd0a0', lw: 3, stroke: '#3a0000' });
    // 宝箱: ゲームごとに1つ。開けるときは順に開いて上乗せを出す
    const opening = z.phase === 'open' || z.phase === 'result';
    const k = z.phase === 'open' ? t - z.since : opening ? 99999 : 0;
    for (let i = 0; i < 3; i++) {
        const x = 46 + i * 54;
        const g = z.games[i];
        if (!g) {
            ctx.save();
            ctx.globalAlpha = 0.25;
            drawChest(ctx, x, 150, 1.3, false);
            ctx.restore();
            continue;
        }
        const open = opening && k >= i * OPEN_STEP_MS;
        const rainbowLid = open && z.gained;
        drawChest(ctx, x, 150, 1.3, open, rainbowLid, t);
        if (open) {
            const since = k - i * OPEN_STEP_MS;
            const lift = ease(since / 250) * 10;
            plusGames(ctx, `+${g.add}G`, x, 96 - lift, g.add >= 100 ? 20 : 15);
        }
    }
    // 継続確定が入っていたら、開けきったところで虹フラッシュ
    const allOpen = 3 * OPEN_STEP_MS;
    if (z.phase === 'open' && z.gained && k > allOpen) {
        const f = k - allOpen;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 0.8 - f / 900);
        rect(ctx, 0, 0, W, H, rainbow(ctx, 0, 0, W, H));
        ctx.restore();
        text(ctx, '継続確定！', W / 2, 64, { size: 26, color: rainbow(ctx, 90, 0, 230, 0), lw: 6 });
    }
}

function drawDaichoen(ctx, t, z) {
    const sure = z.guarantee > 0;
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, sure ? ['#2a0a3a', '#5a1a6a', '#1a0a2a'] : ['#3a1000', '#a03a00', '#2a0800']));
    spinRays(ctx, t, W / 2, 110, [sure ? '#ffffff' : '#ffb040', 'rgba(0,0,0,0)'], 24, 0.18, 4000);
    drawFlames(ctx, t, W / 2, 162, 1.3, sure);
    // こおりくん: おなかを押さえてぶるぶる (継続確定なら虹色に光る)
    const shake = Math.sin(t / 40) * 1.5;
    if (sure) ch(ctx, 'koori', W / 2 + shake, 156, { scale: 6.4, tint: rainbow(ctx, 120, 60, 200, 150), alpha: 0.7 });
    ch(ctx, 'koori', W / 2 + shake, 152, { scale: 5.4, frame: frameOf(t, 140) });
    text(ctx, 'うぉぉ…おなかが…！', W / 2, 36, { size: 10, color: '#ffe0c0', lw: 3, stroke: '#3a0a00' });
    // このゲームの上乗せ (+5G は小さい文字だけ。画面設計書 6章の案)
    if (z.pop) {
        const since = t - z.pop.at;
        if (since < 1400) {
            ctx.save();
            ctx.globalAlpha = 1 - Math.max(0, (since - 1000) / 400);
            const small = z.pop.add <= 5;
            if (small) text(ctx, `+${z.pop.add}G`, 252, 70 - ease(since / 300) * 8, { size: 14, color: '#ffffff', lw: 4, stroke: '#5a1a00' });
            else plusGames(ctx, `+${z.pop.add}G`, 246, 66 - ease(since / 300) * 8, z.pop.add >= 100 ? 34 : 26);
            ctx.restore();
        }
    }
    // 継続確定になった瞬間: 「確定」
    if (z.kakuteiAt) {
        const since = t - z.kakuteiAt;
        if (since < 1600) {
            if (since < 200) rect(ctx, 0, 0, W, H, `rgba(255,255,255,${1 - since / 200})`);
            const pop = 1 + Math.max(0, 0.6 - since / 300);
            text(ctx, '確定', 70, 80, { size: 34 * pop, color: rainbow(ctx, 30, 0, 110, 0), lw: 7 });
        }
    }
    if (sure) text(ctx, `継続確定 ×${z.guarantee}`, 70, 120, { size: 10, color: rainbow(ctx, 20, 0, 120, 0), lw: 3 });
}

// ----- セットの結果: 継続！ / 復活！ / 終了 -----
export const RESULT_MS = 1500;
function drawSetResult(ctx, t, since, result) {
    if (result === 'revive') {
        // 続かなかったと見せてから「復活！」
        if (since < 500) {
            rect(ctx, 0, 0, W, H, `rgba(0,0,0,${0.7 * since / 500})`);
            return;
        }
        rect(ctx, 0, 0, W, H, 'rgba(0,0,0,.7)');
        const k = since - 500;
        if (k < 150) rect(ctx, 0, 0, W, H, `rgba(255,255,255,${1 - k / 150})`);
        const pop = 1 + Math.max(0, 0.6 - k / 300);
        text(ctx, '復活！', W / 2, 90, { size: 40 * pop, color: rainbow(ctx, 80, 0, 240, 0), lw: 8 });
        return;
    }
    rect(ctx, 0, 70, W, 40, 'rgba(0,0,0,.65)');
    const pop = 1 + Math.max(0, 0.4 - since / 300);
    if (result === 'cont') text(ctx, '継続！', W / 2, 90, { size: 26 * pop, color: vgrad(ctx, 76, 104, ['#ffffff', '#ffd23a']), lw: 6, stroke: '#3a0a00' });
    else text(ctx, '終了…', W / 2, 90, { size: 22, color: '#c0c8d0', lw: 5 });
}

// ----- 終了 -----
export const TOKKA_END_MS = 2600;
export function drawTokkaEnd(ctx, t, since, end) {
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#061a3a', '#0b3a78', '#0a1a30']));
    spinRays(ctx, t, W / 2, 100, ['#8fd6f7', 'rgba(0,0,0,0)'], 28, 0.25, 3000);
    text(ctx, `${PATTERNS[end.pattern].name} 終了`, W / 2, 30, { size: 16, color: '#ffffff', lw: 4 });
    text(ctx, `${end.sets}セット`, W / 2, 54, { size: 12, color: '#c8e8ff', stroke: null, font: BODY });
    const shown = Math.round(end.total * Math.min(1, since / 800));
    plusGames(ctx, `+${shown}G`, W / 2, 92, 40);
    if (since > 900) text(ctx, `RASH 残り ${end.left}G`, W / 2, 140, { size: 16, color: '#ffffff', lw: 4, stroke: '#06203a' });
}
