// =====================================================================
// 液晶の場面: 疑似ボーナス (画面設計書 4章)
// ---------------------------------------------------------------------
// BIG (黄金の背景にキャラ解説・ステージ解説) / REG (銀色の背景に短い版) / エピソードBIG (夕焼けの摩天楼とストーリー)
// 「こおりを狙え」のあいだの図柄の表示、AT確定 (こおりくん揃いのインパクトフラッシュ)、ボーナス終了と 1G連 の「ボーナス確定！」。
// どの場面を出すかは director.js が決め、ここは描くだけ。t・since はミリ秒。
// =====================================================================

import { ART } from '../art/characters.js';
import { drawSymbol } from '../art/symbols.js';
import { BODY, H, RAINBOW, W, ch, rainbow, rays, rect, room, roundRect, seeded, text, tower, vgrad, weapon } from './kit.js';
import { BIG_CARDS, EPISODES, REG_CARDS } from './bonusStory.js';

export const BONUS_NAME = { big: 'BIG BONUS', reg: 'REGULAR BONUS', epbig: 'EPISODE BIG' };
export const BONUS_SHORT = { big: 'BIG', reg: 'REG', epbig: 'エピソードBIG' };
export const ENTRY_MS = 1800;   // ボーナスが始まったときのタイトル
export const CARD_MS = 5000;    // 解説のカードを1枚出す時間

const frameOf = (t, ms = 320) => Math.floor(t / ms) % 2;
const ease = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

// キャラを箱 (幅 w・高さ h) に収まる大きさで描く。最大 maxScale 倍
function fitChar(ctx, id, x, ground, w, h, opts = {}, maxScale = 4) {
    const a = ART[id];
    ch(ctx, id, x, ground, { scale: Math.min(w / a.w, h / a.h, maxScale), ...opts });
}

// 回る光 (cx, cy を中心に)
function spinRays(ctx, t, cx, cy, colors, count, alpha, speed = 4000) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t / speed);
    ctx.translate(-cx, -cy);
    rays(ctx, cx, cy, colors, count, alpha);
    ctx.restore();
}

// ----- ボーナス中の画面 -----
// b: { bonus, games, left, payout, since, episode, at, atLabel }
export function drawBonusScreen(ctx, t, b) {
    const since = t - b.since;
    if (b.bonus === 'epbig') drawEpisode(ctx, t, b);
    else drawCards(ctx, t, b, since);
    drawBonusHud(ctx, t, b);
    if (b.boss) drawBossBadge(ctx, t, b.boss);
    if (since < ENTRY_MS) drawEntry(ctx, t, since, b);
}

function drawCards(ctx, t, b, since) {
    const big = b.bonus === 'big';
    rect(ctx, 0, 0, W, H, big ? vgrad(ctx, 0, H, ['#fff2a0', '#e8b020', '#8a5a00']) : vgrad(ctx, 0, H, ['#ffffff', '#b8c0cc', '#5a6270']));
    spinRays(ctx, t, W / 2, 200, [big ? '#fff6c0' : '#ffffff', 'rgba(255,255,255,0)'], 28, 0.3);
    // 舞う光の粒
    const rnd = seeded(7);
    for (let i = 0; i < 18; i++) {
        const x = (rnd() * W + t / (30 + rnd() * 30)) % W;
        const y = (rnd() * H - t / (40 + rnd() * 40) + H * 10) % H;
        rect(ctx, x, y, 2, 2, big ? 'rgba(255,255,220,.8)' : 'rgba(255,255,255,.8)');
    }
    text(ctx, BONUS_NAME[b.bonus], W / 2, 18, { size: big ? 18 : 16, color: '#ffffff', lw: 5, stroke: big ? '#8a3a00' : '#3a4250' });

    const cards = big ? BIG_CARDS : REG_CARDS;
    const shown = Math.max(0, since - ENTRY_MS);
    const index = (b.cardStart + Math.floor(shown / CARD_MS)) % cards.length;
    const card = cards[index];
    const k = shown % CARD_MS;
    // カードが右から入って、左へ出ていく
    const slide = k < 250 ? (1 - ease(k / 250)) * W : k > CARD_MS - 200 ? -ease((k - CARD_MS + 200) / 200) * W : 0;
    ctx.save();
    ctx.translate(slide, 0);
    roundRect(ctx, 20, 34, 280, 112, 6, big ? 'rgba(30,16,0,.8)' : 'rgba(20,24,30,.8)', big ? '#ffe680' : '#e0e6ee');
    drawCardPicture(ctx, t, card, 26, 40, 84, 100);
    text(ctx, card.kind, 120, 50, { size: 10, align: 'left', color: big ? '#ffd23a' : '#c8d4e0', stroke: null, font: BODY, weight: '700' });
    text(ctx, card.name, 120, 68, { size: 15, align: 'left', color: '#ffffff', stroke: null });
    card.lines.forEach((l, i) => text(ctx, l, 120, 90 + i * 15, { size: 10, align: 'left', color: big ? '#f0e6d0' : '#e0e6ee', stroke: null, font: BODY }));
    // 何枚目か
    text(ctx, `${index + 1} / ${cards.length}`, 292, 138, { size: 8, align: 'right', color: 'rgba(255,255,255,.6)', stroke: null, font: BODY });
    ctx.restore();
}

// カードの左の絵 (キャラか、ステージの小さい絵)
function drawCardPicture(ctx, t, card, x, y, w, h) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const f = frameOf(t, 500);
    if (card.who) {
        rect(ctx, x, y, w, h, 'rgba(255,255,255,.08)');
        fitChar(ctx, card.who, x + w / 2, y + h - 6, w - 8, h - 12, { frame: f });
    } else if (card.stage === 'tower') {
        rect(ctx, x, y, w, h, vgrad(ctx, y, y + h, ['#3a1a4a', '#ff7a4a', '#ffd08a']));
        tower(ctx, x + w / 2, y + h, h - 8, '#0d1117');
        for (let i = 1; i < 6; i++) rect(ctx, x + w / 2 - 14, y + h - i * 14, 28, 1, frameOf(t + i * 200, 600) ? '#8fd6f7' : '#3a6a8a');
    } else if (card.stage === 'floor') {
        rect(ctx, x, y, w, h / 2, vgrad(ctx, y, y + h / 2, ['#7ac8f0', '#d8f0ff']));
        rect(ctx, x, y + h / 2, w, h / 2, vgrad(ctx, y + h / 2, y + h, ['#ff8a40', '#7a4a8a']));
        text(ctx, '1〜10F', x + w / 2, y + 14, { size: 10, color: '#1b3a6b', stroke: null });
        text(ctx, '11F〜', x + w / 2, y + h / 2 + 14, { size: 10, color: '#ffffff', stroke: '#5a2a1a', lw: 2 });
        ch(ctx, 'koori', x + 22, y + h / 2 - 2, { scale: 1.8, frame: f });
        ch(ctx, 'harry', x + 60, y + h / 2 - 2, { scale: 1, flip: true });
        ch(ctx, 'nakata', x + 60, y + h - 2, { scale: 0.8, silhouette: true, alpha: 0.7 });
    } else if (card.stage === 'middle') {
        rect(ctx, x, y, w, h, vgrad(ctx, y, y + h, ['#1a1438', '#3a2a5a', '#120c22']));
        ch(ctx, 'koori', x + 20, y + h - 6, { scale: 2, frame: f });
        ch(ctx, 'shibata', x + 62, y + h - 6, { scale: 1, flip: true });
        text(ctx, 'VS', x + w / 2 - 2, y + 30, { size: 16, color: '#ffe040', lw: 4, stroke: '#a01010' });
    } else {
        rect(ctx, x, y, w, h, vgrad(ctx, y, y + h, ['#05040e', '#3a0a14']));
        ch(ctx, 'maou', x + w / 2, y + h - 4, { scale: 1.2, silhouette: true, alpha: 0.9 });
        if (frameOf(t, 1400)) text(ctx, '･ ･', x + w / 2, y + 30, { size: 10, color: '#ff4040', stroke: null });
    }
    ctx.restore();
}

// ----- エピソードBIG -----
const EP_BG = {
    home(ctx, t) {
        rect(ctx, 0, 0, W, H, '#c89a6a');
        rect(ctx, 0, 0, W, 8, '#7a5030');
        // 窓 (夕焼け)
        rect(ctx, 200, 20, 90, 64, vgrad(ctx, 20, 84, ['#ff7a4a', '#ffd08a']));
        rect(ctx, 244, 20, 2, 64, '#7a5030');
        ctx.strokeStyle = '#7a5030';
        ctx.lineWidth = 3;
        ctx.strokeRect(200, 20, 90, 64);
        // ちゃぶ台
        rect(ctx, 0, 118, W, 62, vgrad(ctx, 118, H, ['#a8784a', '#6a4a2a']));
        rect(ctx, 130, 112, 60, 6, '#5a3a1a');
        rect(ctx, 138, 118, 4, 10, '#5a3a1a');
        rect(ctx, 178, 118, 4, 10, '#5a3a1a');
    },
    town(ctx, t) {
        rect(ctx, 0, 0, W, H, vgrad(ctx, 0, 120, ['#3a1a4a', '#ff7a4a', '#ffd08a']));
        const rnd = seeded(21);
        for (let x = 0; x < W; x += 30 + Math.floor(rnd() * 20)) {
            const h = 20 + rnd() * 30;
            rect(ctx, x, 118 - h, 26, h, '#2a1a28');
            ctx.fillStyle = '#2a1a28';
            ctx.beginPath();
            ctx.moveTo(x - 3, 118 - h);
            ctx.lineTo(x + 13, 118 - h - 12);
            ctx.lineTo(x + 29, 118 - h);
            ctx.fill();
            if (rnd() < 0.6) rect(ctx, x + 9, 124 - h, 6, 5, '#ffd27a');
        }
        rect(ctx, 0, 118, W, 62, '#3a2a30');
    },
    tower(ctx, t) {
        rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#3a1a4a', '#ff7a4a', '#ffd08a']));
        tower(ctx, 250, 128, 120, '#0d1117');
        for (let i = 1; i < 8; i++) if (frameOf(t + i * 300, 900)) rect(ctx, 246, 128 - i * 14, 8, 2, '#8fd6f7');
        rect(ctx, 0, 118, W, 62, '#2a1a20');
    },
    // 摩天楼1階 (エントランス。通常時の 1〜10階と同じ明るいロビー)
    lobby(ctx, t) {
        room(ctx, { sky: ['#7ac8f0', '#d8f0ff'], wall: '#d8cfc0', floor: ['#efe6d6', '#b8ad98'], cityColor: '#7a8aa0', lights: '#ffffff' });
        rect(ctx, 134, 40, 52, 88, '#8a8e96');
        rect(ctx, 137, 44, 22, 84, '#c8ccd4');
        rect(ctx, 161, 44, 22, 84, '#c8ccd4');
        text(ctx, '1F', 160, 34, { size: 8, color: '#ff8a20', stroke: null });
    },
    middle(ctx, t) {
        rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#1a1438', '#3a2a5a', '#120c22']));
        for (let x = 0; x < W; x += 40) rect(ctx, x, 20, 6, 98, 'rgba(255,255,255,.06)');
        rect(ctx, 0, 118, W, 62, vgrad(ctx, 118, H, ['#4a3a6a', '#1a1028']));
    },
    boss(ctx, t) {
        room(ctx, { sky: ['#05040e', '#1a1040'], wall: '#14101c', floor: ['#3a0a14', '#14040a'], cityColor: '#0a0a14', lights: '#8fd6f7', stars: true });
    },
    top(ctx, t) {
        room(ctx, { sky: ['#1a0000', '#5a0a00'], wall: '#120808', floor: ['#5a1000', '#1a0400'], cityColor: '#200404', lights: '#ff6a20' });
        rect(ctx, 0, 0, W, H, `rgba(255,60,0,${0.06 + Math.sin(t / 400) * 0.04})`);
    }
};

// いまの場面: 5G ごとに次の場面へ進める (50G で10場面。場面が足りないときは最後の場面を終わりまで)
export const SCENE_GAMES = 5;
export function episodeScene(b) {
    const ep = EPISODES[b.episode % EPISODES.length];
    const played = b.games - b.left;
    const i = Math.min(ep.scenes.length - 1, Math.floor(played / SCENE_GAMES));
    return { ep, scene: ep.scenes[i], index: i };
}

// セリフを箱の幅で折り返す (最大3行。'\n' でも改行できる)。
// 1行に収まるときは大きい文字。折り返すときは、行の終わり近くに「。！？」や空白があればそこで区切り、行の頭に「。、！？～」や小さい字が来ないようにする
const LINE_W = 282;
const PUNCT = '。、！？!?…」)～ーァィゥェォャュョッぁぃぅぇぉゃゅょっ';
function wrapLine(ctx, line) {
    ctx.save();
    ctx.font = `11px ${BODY}`;
    if (!line.includes('\n') && ctx.measureText(line).width <= LINE_W) {
        ctx.restore();
        return { rows: [line], size: 11 };
    }
    ctx.font = `9.5px ${BODY}`;
    const rows = [];
    for (const part of line.split('\n')) {
        let cs = [...part];
        while (cs.length) {
            let n = 1;
            while (n < cs.length && ctx.measureText(cs.slice(0, n + 1).join('')).width <= LINE_W) n++;
            if (n < cs.length) {
                // 行の頭に「。」」などが来るときは、その前の字ごと次の行へ送る (送れないほど続くときだけ、前の行にはみ出させる)
                let m = n;
                while (m > 1 && PUNCT.includes(cs[m])) m--;
                if (m > n - 6) n = m;
                else while (n < cs.length && PUNCT.includes(cs[n])) n++;
                const cut = cs.slice(0, n).findLastIndex(c => '。！？!?　 '.includes(c));
                if (cut >= 0 && cut >= n - 8 && cut + 1 < n && !PUNCT.includes(cs[cut + 1])) n = cut + 1;
            }
            rows.push(cs.slice(0, n).join(''));
            cs = cs.slice(n);
        }
    }
    ctx.restore();
    return { rows: rows.slice(0, 3), size: 9.5 };
}

// cast の1人: 'id' か { id, hidden: true } (正体がまだわからないキャラ。影絵で出して、名前は「？？？」にする)
function castOf(c) {
    return typeof c === 'string' ? { id: c } : c;
}

// 影絵のキャラ (うしろがくらくても見えるように、紫のふちどりをつける)
function hiddenChar(ctx, id, x, ground, w, h, opts) {
    const a = ART[id];
    const scale = Math.min(w / a.w, h / a.h, 2.8);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ch(ctx, id, x + dx, ground + dy, { ...opts, scale, tint: '#b08aff', alpha: 0.8 });
    ch(ctx, id, x, ground, { ...opts, scale, silhouette: true });
}

// 群れ (ハリーなど): x0〜x1 に2列でぴょんぴょん跳ねる
function drawCrowd(ctx, t, id, x0, x1, faceLeft) {
    const rnd = seeded(7);
    for (let row = 0; row < 2; row++) {
        const count = 6;
        for (let i = 0; i < count; i++) {
            const x = x0 + (i + (row ? 0.5 : 0)) * ((x1 - x0) / count) + rnd() * 4;
            const hop = Math.abs(Math.sin(t / 180 + i * 1.7 + row)) * 4;
            ch(ctx, id, x, (row ? 124 : 112) - hop, { scale: row ? 1.3 : 1.1, flip: faceLeft, frame: frameOf(t + i * 90, 200) });
        }
    }
}

// 追いかけ回される: キャラが左から右へ走り、うしろから群れが追いかける (画面の外に出たら左からもう一度)
function drawChase(ctx, t, k, scene) {
    const cast = scene.cast.map(castOf);
    const span = 150 + cast.length * 34;
    const ox = (k * 0.11) % (W + span) - span;
    for (let i = 0; i < 7; i++) {
        const hop = Math.abs(Math.sin(t / 120 + i * 1.3)) * 5;
        ch(ctx, scene.crowd, ox + i * 18, (i % 2 ? 124 : 116) - hop, { scale: 1.2, frame: frameOf(t + i * 70, 150) });
    }
    cast.forEach((c, i) => {
        const hop = Math.abs(Math.sin(t / 100 + i * 2)) * 6;
        const x = ox + 150 + i * 34;
        fitChar(ctx, c.id, x + Math.sin(t / 70 + i) * 2, 122 - hop, 34, 44, { frame: frameOf(t, 140) }, 2);
        if (frameOf(t + i * 100, 260)) text(ctx, '!', x + 10, 122 - 50 - hop, { size: 10, color: '#ffffff', lw: 3 });
    });
}

// 大乱戦: まんなかの土けむりのまわりで、キャラが入り乱れてもみ合う (ドカッ・バキッ と星が飛ぶ)
const BRAWL_WORDS = ['ドカッ', 'バキッ', 'ボコッ', 'ゴスッ'];
function drawBrawl(ctx, t, scene) {
    const cast = scene.cast.map(castOf);
    const cx = W / 2, cy = 82;
    const rnd = seeded(13);
    // うしろの土けむり
    for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + t / 900;
        const rr = 46 + rnd() * 14 + Math.sin(t / 160 + i) * 4;
        ctx.fillStyle = i % 2 ? 'rgba(230,220,240,.85)' : 'rgba(200,190,215,.85)';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * rr * 1.5, cy + Math.sin(a) * rr * 0.55, 18 + rnd() * 10, 0, Math.PI * 2);
        ctx.fill();
    }
    // キャラはけむりのふちを回りながら、ガタガタとゆれる。奥 (上) にいるキャラから順に描く
    cast.map((c, i) => ({ c, i, a: (i / cast.length) * Math.PI * 2 + t / 1400 }))
        .sort((p, q) => Math.sin(p.a) - Math.sin(q.a))
        .forEach(({ c, i, a }) => {
            const x = cx + Math.cos(a) * 96 + Math.sin(t / 50 + i * 3) * 2;
            const ground = cy + 36 + Math.sin(a) * 18 - Math.abs(Math.sin(t / 110 + i)) * 6;
            fitChar(ctx, c.id, x, ground, 34, 40, { frame: frameOf(t + i * 80, 140), flip: Math.cos(a) > 0 }, 2);
        });
    // ドカッ・バキッ と星
    for (let i = 0; i < 3; i++) {
        const step = Math.floor(t / 420) + i * 7;
        const r2 = seeded(step * 31 + 5);
        const x = cx - 70 + r2() * 140, y = cy - 30 + r2() * 50;
        const age = (t % 420) / 420;
        if (age > 0.8) continue;
        ctx.save();
        ctx.globalAlpha = 1 - age;
        ctx.beginPath();
        for (let p = 0; p < 10; p++) {
            const ang = (p / 10) * Math.PI * 2, rr = p % 2 ? 4 : 10;
            ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
        }
        ctx.closePath();
        ctx.fillStyle = '#ffe040';
        ctx.fill();
        text(ctx, BRAWL_WORDS[step % BRAWL_WORDS.length], x + 4, y - 12, { size: 12, color: '#ffffff', lw: 3, stroke: '#a01010' });
        ctx.restore();
    }
}

// VS: 2人が左右からにらみ合い、まんなかに「VS」
function drawVs(ctx, t, scene) {
    const [l, r] = scene.cast.map(castOf);
    rays(ctx, W / 2, 80, ['rgba(255,80,40,.5)', 'rgba(0,0,0,0)'], 24, 0.5);
    const pulse = 1 + Math.sin(t / 120) * 0.04;
    fitChar(ctx, l.id, 70, 122, 70, 64, { frame: frameOf(t, 400) }, 2.8);
    fitChar(ctx, r.id, W - 70, 122, 70, 64, { frame: frameOf(t, 400), flip: true }, 2.8);
    ctx.save();
    ctx.translate(W / 2, 70);
    ctx.scale(pulse, pulse);
    text(ctx, 'VS', 0, 0, { size: 34, color: '#ffe040', lw: 7, stroke: '#a01010' });
    ctx.restore();
}

// 一騎打ち: 2人が左右から突っこんでぶつかり、火花が散ってははね返る
const CLASH_MS = 1100;
function drawClash(ctx, t, scene) {
    const [l, r] = scene.cast.map(castOf);
    const p = (t % CLASH_MS) / CLASH_MS;
    // 0〜0.45 で近づき、0.45〜0.6 でぶつかったまま押し合い、そのあと離れる
    const near = p < 0.45 ? ease(p / 0.45) : p < 0.6 ? 1 : 1 - ease((p - 0.6) / 0.4);
    const gap = 110 - near * 72;
    const shake = p >= 0.45 && p < 0.6 ? Math.sin(t / 15) * 2 : 0;
    fitChar(ctx, l.id, W / 2 - gap / 2 - 18 + shake, 122, 64, 60, { frame: frameOf(t, 160) }, 2.6);
    fitChar(ctx, r.id, W / 2 + gap / 2 + 18 - shake, 122, 64, 60, { frame: frameOf(t, 160), flip: true }, 2.6);
    if (p >= 0.45 && p < 0.75) {
        const a = 1 - (p - 0.45) / 0.3;
        ctx.save();
        ctx.globalAlpha = a;
        rays(ctx, W / 2, 86, ['#ffffff', 'rgba(255,255,255,0)'], 20, 0.5);
        const rnd = seeded(Math.floor(t / CLASH_MS));
        for (let i = 0; i < 10; i++) {
            const ang = rnd() * Math.PI * 2, d = 10 + (1 - a) * 40 * (0.5 + rnd());
            rect(ctx, W / 2 + Math.cos(ang) * d, 86 + Math.sin(ang) * d, 3, 3, i % 2 ? '#ffe040' : '#ff8a20');
        }
        text(ctx, Math.floor(t / CLASH_MS) % 2 ? 'ガキィン！' : 'ドゴォッ！', W / 2, 40, { size: 16, color: '#ffffff', lw: 4, stroke: '#a01010' });
        ctx.restore();
    }
}

// 倒れたキャラ: 横向きに寝かせて、頭の上で星が回る
function downChar(ctx, t, id, x, w, h) {
    const a = ART[id];
    const s = Math.min(w / a.w, h / a.h, 2.8);
    ctx.save();
    ctx.translate(x, 122 - (a.w * s) / 2);
    ctx.rotate(Math.PI / 2);
    ch(ctx, id, 0, (a.h * s) / 2, { scale: s });
    ctx.restore();
    for (let i = 0; i < 3; i++) {
        const ang = t / 300 + (i / 3) * Math.PI * 2;
        text(ctx, '★', x + (a.h * s) / 2 + Math.cos(ang) * 10, 122 - a.w * s - 6 + Math.sin(ang) * 3, { size: 8, color: '#ffe040', stroke: null });
    }
}

// 必殺技: 左に技を出す側 (cast)、右に相手 (target)。技の名前の帯を出し、力をためてから命中する。
// special は技の名前 (セリフが変わるごとに次の名前にするときは配列)。命中はいちばん最後のセリフのとき。
// ko: true なら命中したあと相手が倒れる。crowd (群れ) は命中で吹き飛ぶ。
// beam: true は相手が放った魔法のビームを、cast の先頭が盾で受け止めて消す (無効化。相手は倒れない)
function drawSpecial(ctx, t, scene, sayIndex, sayCount, k2) {
    const cast = scene.cast.map(castOf);
    const names = [].concat(scene.special);
    const name = names[Math.min(sayIndex, names.length - 1)];
    const last = sayIndex === sayCount - 1;
    const hitAt = sayCount > 1 ? 700 : 1500;
    const hit = last && k2 >= hitAt;
    const since = hit ? k2 - hitAt : 0;
    const shake = hit && since < 400 ? Math.sin(since / 20) * 4 * (1 - since / 400) : 0;
    ctx.save();
    ctx.translate(shake, 0);
    const tx = W - 62;
    // 群れは命中するまで相手のうしろにいる
    if (scene.crowd && !hit) drawCrowd(ctx, t, scene.crowd, 196, 312, true);
    if (scene.target) {
        if (hit && scene.split) splitChar(ctx, t, scene.target, tx, since, 70, 56);
        else if (hit && scene.ko) downChar(ctx, t, scene.target, tx, 70, 50);
        else fitChar(ctx, scene.target, tx + (hit ? Math.sin(since / 25) * 3 : 0), 122, 70, 50, { frame: frameOf(t, 400), flip: true, tint: hit && since < 300 ? '#ffffff' : null }, 2.8);
    }
    // 技を出す側: 力をためているあいだは足もとから光が立ちのぼる
    const n = cast.length;
    cast.forEach((c, i) => {
        const x = n === 1 ? 92 : 36 + i * (120 / (n - 1));
        if (!hit) {
            ctx.save();
            ctx.globalAlpha = 0.35 + Math.sin(t / 90 + i) * 0.2;
            rect(ctx, x - 14, 70, 28, 52, vgrad(ctx, 70, 122, ['rgba(255,240,160,0)', '#ffe680']));
            ctx.restore();
        }
        if (c.rainbow) rainbowHalo(ctx, t, c.id, x + (hit ? 6 : 0), 122, n > 2 ? 40 : 56, 50);
        fitChar(ctx, c.id, x + (hit ? 6 : 0), 122, n > 2 ? 40 : 56, 50, { frame: frameOf(t, hit ? 120 : 260) }, 2.6);
        if (c.sword) weapon(ctx, 'kill', x + 22, 112);
    });
    if (scene.beam && !hit) {
        // 相手から左へのびるビームと、先頭のキャラの前の盾
        const sx = (n === 1 ? 92 : 36) + 30;
        const len = Math.min(1, k2 / 900);
        const beamColor = scene.beam === 'fire' ? '#ff6a20' : '#d0b0ff';
        rect(ctx, tx - 26 - (tx - 26 - sx) * len, 78, (tx - 26 - sx) * len, 8, vgrad(ctx, 78, 86, [beamColor, '#ffffff', beamColor]));
        ctx.save();
        ctx.globalAlpha = 0.6 + Math.sin(t / 60) * 0.2;
        ctx.strokeStyle = '#ffe040';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sx - 4, 82, 22, -Math.PI / 2.4, Math.PI / 2.4);
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
    // 命中: 白い光と、とび散る星
    if (hit && since < 700) {
        const a = 1 - since / 700;
        rect(ctx, 0, 0, W, H, `rgba(255,255,255,${0.7 * a})`);
        const cx = scene.beam ? 130 : tx, cy = 84;
        const rnd = seeded(7);
        for (let i = 0; i < 14; i++) {
            const ang = rnd() * Math.PI * 2, d = since / 8 * (0.5 + rnd());
            text(ctx, '★', cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, { size: 9, color: i % 2 ? '#ffe040' : '#ff8a20', stroke: null });
        }
    }
    // 技の名前の帯 (斜めの帯に大きな文字)
    const slide = ease(Math.min(1, k2 / 250));
    ctx.save();
    ctx.translate((1 - slide) * -W, 0);
    ctx.beginPath();
    ctx.moveTo(0, 46);
    ctx.lineTo(W, 40);
    ctx.lineTo(W, 62);
    ctx.lineTo(0, 68);
    ctx.closePath();
    ctx.fillStyle = 'rgba(160,0,20,.85)';
    ctx.fill();
    text(ctx, name, W / 2, 54, { size: [...name].length > 12 ? 13 : 16, color: vgrad(ctx, 44, 64, ['#ffffff', '#ffe040']), lw: 4, stroke: '#3a0008' });
    ctx.restore();
}

// キャラのうしろの虹色の光 (覚醒したこおりくんなど)
function rainbowHalo(ctx, t, id, x, ground, w, h) {
    const a = ART[id];
    const s = Math.min(w / a.w, h / a.h, 2.6) * 1.25;
    ctx.save();
    ctx.globalAlpha = 0.55 + Math.sin(t / 120) * 0.15;
    ch(ctx, id, x, ground + 4, { scale: s, tint: rainbow(ctx, x - 30, ground - 60, x + 30, ground), frame: frameOf(t, 260) });
    ctx.restore();
}

// 真っ二つ: 斜めの斬撃の光のあと、相手が左右に割れてずれていく
function splitChar(ctx, t, id, x, since, w, h) {
    const a = ART[id];
    const s = Math.min(w / a.w, h / a.h, 2.8);
    const d = Math.min(1, since / 900) * 16;
    const top = 122 - a.h * s;
    for (const side of [-1, 1]) {
        ctx.save();
        // 片方ずつずらしてから、斜めの線 (右上から左下) で切る。切り口も一緒にずれるので、割れたように見える
        ctx.translate(side * d, side * d * 0.4 + d * 0.3);
        ctx.beginPath();
        if (side < 0) { ctx.moveTo(0, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x - 30, H); ctx.lineTo(0, H); }
        else { ctx.moveTo(x + 30, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(x - 30, H); }
        ctx.closePath();
        ctx.clip();
        ch(ctx, id, x, 122, { scale: s, frame: 0, tint: since < 250 ? '#ffffff' : null });
        ctx.restore();
    }
    if (since < 600) {
        ctx.save();
        ctx.globalAlpha = 1 - since / 600;
        ctx.strokeStyle = rainbow(ctx, x + 30, top, x - 30, 122);
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x + 40, top - 10);
        ctx.lineTo(x - 40, 132);
        ctx.stroke();
        ctx.restore();
    }
}

// 力を集める: まんなかのこおりくんへ、まわりのみんなから光がのびる (cast の先頭がまんなか、gather はまわりのキャラ)
function drawGather(ctx, t, scene, k) {
    const [center] = scene.cast.map(castOf);
    const others = scene.gather;
    const cx = W / 2, cy = 92;
    const spots = others.map((id, i) => {
        const f = others.length === 1 ? 0.5 : i / (others.length - 1);
        return { id, x: 24 + f * (W - 48), ground: 122 - Math.sin(f * Math.PI) * 50 };
    });
    // 光のすじ
    spots.forEach((p, i) => {
        const pulse = (t / 400 + i * 0.3) % 1;
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = RAINBOW[i % RAINBOW.length];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x, p.ground - 20);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        ctx.globalAlpha = 1;
        text(ctx, '✦', p.x + (cx - p.x) * pulse, p.ground - 20 + (cy - p.ground + 20) * pulse, { size: 10, color: '#ffffff', stroke: null });
        ctx.restore();
    });
    spots.forEach(p => fitChar(ctx, p.id, p.x, p.ground, 34, 36, { frame: frameOf(t, 300), flip: p.x > cx }, 1.8));
    // まんなかは光がたまるほど明るくなる
    const glow = Math.min(1, k / 3000);
    ctx.save();
    ctx.globalAlpha = 0.3 + glow * 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 20 + glow * 14 + Math.sin(t / 100) * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (scene.rainbow) rainbowHalo(ctx, t, center.id, cx, 122, 60, 54);
    fitChar(ctx, center.id, cx, 122, 60, 54, { frame: frameOf(t, 260) }, 2.8);
}

// 覚醒: 虹色に光るこおりくんと、コオリソードが変わった大魔王絶対殺す剣
function drawAwaken(ctx, t, scene, k) {
    const [center] = scene.cast.map(castOf);
    ctx.save();
    ctx.translate(W / 2, 90);
    ctx.rotate(t / 3000);
    ctx.translate(-W / 2, -90);
    rays(ctx, W / 2, 90, RAINBOW, 36, 0.35);
    ctx.restore();
    rainbowHalo(ctx, t, center.id, W / 2 - 20, 124, 76, 64);
    fitChar(ctx, center.id, W / 2 - 20, 122, 76, 64, { frame: frameOf(t, 260) }, 3.4);
    // 剣はしばらく光ってから、大きな虹色の剣に変わる
    if (k < 1200) {
        weapon(ctx, 'sword', W / 2 + 34, 116);
        ctx.save();
        ctx.globalAlpha = Math.min(1, k / 1200);
        rect(ctx, W / 2 + 20, 60, 30, 60, 'rgba(255,255,255,.8)');
        ctx.restore();
    } else {
        weapon(ctx, 'kill', W / 2 + 36, 118);
        if (k < 1600) rect(ctx, 0, 0, W, H, `rgba(255,255,255,${0.8 * (1 - (k - 1200) / 400)})`);
    }
}

// 財宝: 金貨の山 (うしろ) と、手前できらめく金貨
function drawTreasureBack(ctx, t) {
    const rnd = seeded(17);
    for (let i = 0; i < 90; i++) {
        const x = 20 + rnd() * 280, y = 96 + rnd() * 30 - Math.sin(((x - 20) / 280) * Math.PI) * 24;
        ctx.fillStyle = i % 3 ? '#ffd23a' : '#e8a010';
        ctx.beginPath();
        ctx.ellipse(x, y, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    [[60, 92, '#e02040'], [150, 76, '#2060e0'], [250, 90, '#20c060']].forEach(([x, y, c]) => rect(ctx, x, y, 6, 6, c));
}
function drawTreasureFront(ctx, t) {
    const rnd = seeded(3);
    for (let i = 0; i < 10; i++) {
        const x = rnd() * W, ph = (t / 600 + rnd()) % 1;
        if (ph < 0.3) text(ctx, '✦', x, 70 + rnd() * 50, { size: 8 + ph * 20, color: '#ffffff', stroke: null });
    }
}

// テレビのニュース: 画面に摩天楼のあった場所と「臨時ニュース」、下に字幕が流れる
function drawTv(ctx, t, caption) {
    const x = 190, y = 42, w = 108, h = 62;
    rect(ctx, x - 6, y - 6, w + 12, h + 12, '#2a2a30');
    rect(ctx, x + w / 2 - 14, y + h + 6, 28, 8, '#2a2a30');
    rect(ctx, x + w / 2 - 26, y + h + 14, 52, 4, '#1a1a20');
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    rect(ctx, x, y, w, h, vgrad(ctx, y, y + h, ['#6ab0e0', '#d8f0ff']));
    // 摩天楼があった場所 (点線のシルエット)
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(t / 300) * 0.1;
    tower(ctx, x + w / 2, y + h - 18, 52, '#5a6a80');
    ctx.restore();
    rect(ctx, x, y + h - 18, w, 18, '#3a5a3a');
    rect(ctx, x, y, 58, 12, '#c01020');
    text(ctx, '臨時ニュース', x + 29, y + 6.5, { size: 8, color: '#ffffff', stroke: null, font: BODY, weight: '700' });
    rect(ctx, x, y + h - 14, w, 14, 'rgba(0,0,40,.85)');
    ctx.font = `8px ${BODY}`;
    const cw = ctx.measureText(caption).width + 40;
    const off = (t / 25) % cw;
    text(ctx, caption, x + w - off, y + h - 6.5, { size: 8, align: 'left', color: '#ffffff', stroke: null, font: BODY });
    text(ctx, caption, x + w - off + cw, y + h - 6.5, { size: 8, align: 'left', color: '#ffffff', stroke: null, font: BODY });
    ctx.restore();
    // 画面の反射
    ctx.save();
    ctx.globalAlpha = 0.12;
    rect(ctx, x + 6, y + 4, 20, h - 8, '#ffffff');
    ctx.restore();
}

const DROP_MS = 600;   // 落ちてくるキャラが着地するまで

function drawEpisode(ctx, t, b) {
    const { ep, scene, index } = episodeScene(b);
    if (b.sceneIndex !== index) {
        b.sceneIndex = index;
        b.sceneAt = t;
    }
    const k = t - (b.sceneAt || t);
    // then があれば、セリフが出きって少したってから次の人に切りかえる (then は1つでも配列でもよい。k2 は今のセリフが出はじめてからの時間)
    const says = [scene, ...[].concat(scene.then || [])];
    let say = scene, k2 = k, sayIndex = 0;
    for (const next of says.slice(1)) {
        const ms = [...say.line].length * 45 + 1200;
        if (k2 < ms) break;
        k2 -= ms;
        say = next;
        sayIndex++;
    }
    // 落ちてくるキャラが着地したら、画面を少しゆらす
    const land = k - DROP_MS;
    const shake = scene.cast.some(c => c.drop) && land > 0 && land < 350;
    ctx.save();
    if (shake) ctx.translate(Math.sin(land / 18) * 4 * (1 - land / 350), 0);
    (EP_BG[scene.bg] || EP_BG.tower)(ctx, t);
    const talking = say.who && frameOf(t, 220) && k2 < 2400;
    if (scene.chase) drawChase(ctx, t, k, scene);
    else if (scene.brawl) drawBrawl(ctx, t, scene);
    else if (scene.vs) drawVs(ctx, t, scene);
    else if (scene.clash) drawClash(ctx, t, scene);
    else if (scene.special) drawSpecial(ctx, t, scene, sayIndex, says.length, k2);
    else if (scene.gather) drawGather(ctx, t, scene, k);
    else if (scene.awaken) drawAwaken(ctx, t, scene, k);
    else {
        // 出るキャラを左から並べる (右半分にいるキャラは左を向く)。群れがいるときは、キャラを左に寄せて群れを右に置く
        if (scene.treasure) drawTreasureBack(ctx, t);
        if (scene.tv) drawTv(ctx, t, scene.tv);
        const cast = scene.cast.map(castOf);
        const n = cast.length;
        // 群れやテレビがあるときは、キャラを左に寄せる
        const left = scene.crowd || scene.tv;
        const right = left ? 160 : W - 50;
        let firstX = W / 2;
        cast.forEach((c, i) => {
            const x = n === 1 ? (left ? 100 : W / 2) : (left ? 34 : 50) + i * ((right - (left ? 34 : 50)) / (n - 1 || 1));
            if (i === 0) firstX = x;
            const big = c.id === 'maou' ? 72 : 60;
            const box = scene.crowd && n > 3 ? 34 : n > 4 ? 52 : 64;
            const opts = { frame: frameOf(t, 500), flip: n > 1 && x > W / 2 };
            // drop: 上から落ちてきて着地する (着地のときに土ぼこり)
            const fall = c.drop ? -150 * Math.pow(1 - Math.min(1, k / DROP_MS), 2) : 0;
            if (c.hidden) hiddenChar(ctx, c.id, x, 122 + fall, box, big, opts);
            else if (c.down) downChar(ctx, t, c.id, x, box, big);
            else fitChar(ctx, c.id, x, 122 + fall + (talking ? -1 : 0), box, big, opts, 2.8);
            if (c.drop && land > 0 && land < 500) {
                const a = 1 - land / 500;
                for (const d of [-1, 1]) {
                    ctx.fillStyle = `rgba(220,210,240,${a * 0.8})`;
                    ctx.beginPath();
                    ctx.arc(x + d * (14 + land / 12), 120 - land / 40, 5 + land / 60, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });
        if (scene.crowd) drawCrowd(ctx, t, scene.crowd, 196, 312, true);
        if (scene.treasure) drawTreasureFront(ctx, t);
        // お腹の音: 先頭のキャラのまわりに「ギュルル…」が浮かぶ
        if (scene.gurgle) {
            ['ギュルル…', 'ゴロゴロ…'].forEach((g, i) => {
                const ph = (t / 900 + i * 0.5) % 1;
                ctx.save();
                ctx.globalAlpha = 1 - ph;
                text(ctx, g, firstX + (i ? -34 : 34) + Math.sin(t / 150 + i) * 3, 96 - ph * 20, { size: 9, color: '#ffe0f0', lw: 3, stroke: '#7a2a4a' });
                ctx.restore();
            });
        }
    }
    ctx.restore();
    // 場面が変わったときは少し暗くしてから明るく
    if (k < 300) rect(ctx, 0, 0, W, H, `rgba(0,0,0,${0.6 * (1 - k / 300)})`);
    text(ctx, 'EPISODE BIG', 8, 12, { size: 10, align: 'left', color: '#ffffff', lw: 3 });
    if (scene.floor) {
        roundRect(ctx, 6, 22, 40, 16, 3, 'rgba(5,10,16,.85)', '#ff6a6a');
        text(ctx, scene.floor, 26, 30.5, { size: 11, color: '#ff8a8a', stroke: null });
    }
    text(ctx, `第${(b.episode % EPISODES.length) + 1}話「${ep.title}」`, W - 8, 12, { size: 10, align: 'right', color: '#ffffff', lw: 3 });
    // セリフ (1文字ずつ出る。長いときは折り返して文字を少し小さく。3行のときは箱を上にのばす)
    const { rows, size } = wrapLine(ctx, say.line);
    const top = rows.length === 3 ? 112 : rows.length === 2 ? 120 : 124;
    roundRect(ctx, 10, top, 300, 158 - top, 4, 'rgba(0,0,0,.78)', '#ffd08a');
    text(ctx, say.who, 20, top + (rows.length === 1 ? 10 : 9), { size: 9, align: 'left', color: '#ff8a7a', stroke: null, font: BODY, weight: '700' });
    let rest = Math.floor(k2 / 45);
    rows.forEach((row, r) => {
        const cs = [...row];
        const shown = cs.slice(0, Math.max(0, rest)).join('');
        rest -= cs.length;
        const y = rows.length === 1 ? 149 : top + 20 + r * 10;
        text(ctx, shown, 20, y, { size, align: 'left', color: '#ffffff', stroke: null, font: BODY });
    });
    // つづく: 最後のセリフが出きってから
    if (scene.tsuzuku && sayIndex === says.length - 1) {
        const after = k2 - ([...say.line].length * 45 + 800);
        if (after > 0) {
            const a = Math.min(1, after / 600);
            rect(ctx, 0, 0, W, H, `rgba(0,0,0,${0.55 * a})`);
            ctx.save();
            ctx.globalAlpha = a;
            text(ctx, 'つづく', W - 20, 92, { size: 26, align: 'right', color: '#ffffff', lw: 6, stroke: '#1b3a6b' });
            ctx.restore();
        }
    }
}

// ----- 下の帯: 獲得枚数・残りゲーム数・進み具合。AT確定のあとは右上に「AT確定」 -----
function drawBonusHud(ctx, t, b) {
    const dark = b.bonus === 'epbig' ? '#2a1020' : b.bonus === 'big' ? '#3a2000' : '#2a3038';
    rect(ctx, 0, 162, W, 18, 'rgba(0,0,0,.55)');
    text(ctx, `獲得 ${b.payout}枚`, 10, 171, { size: 11, align: 'left', color: '#ffffff', lw: 3, stroke: dark });
    text(ctx, `残り ${b.left}G`, W - 10, 171, { size: 11, align: 'right', color: '#ffffff', lw: 3, stroke: dark });
    const p = b.games ? 1 - b.left / b.games : 0;
    roundRect(ctx, 100, 168, 120, 6, 3, 'rgba(255,255,255,.2)');
    if (p > 0) roundRect(ctx, 100, 168, 120 * p, 6, 3, b.bonus === 'reg' ? '#e0e6ee' : '#ffd23a');
    if (b.at) {
        const y = b.bonus === 'epbig' ? 28 : 16;
        roundRect(ctx, W - 78, y - 9, 72, 18, 4, 'rgba(0,0,0,.7)');
        text(ctx, b.atLabel, W - 42, y, { size: b.atLabel.length > 5 ? 10 : 12, color: rainbow(ctx, W - 76, 0, W - 8, 0), lw: 2 });
    }
}

// ----- ボーナスが始まったときのタイトル -----
function drawEntry(ctx, t, since, b) {
    const a = since > ENTRY_MS - 300 ? 1 - (since - ENTRY_MS + 300) / 300 : 1;
    ctx.save();
    ctx.globalAlpha = a;
    const colors = b.bonus === 'big' ? ['#ffe680', '#ff9a20'] : b.bonus === 'reg' ? ['#ffffff', '#a8b0bc'] : ['#ffd08a', '#ff7a4a'];
    rect(ctx, 0, 0, W, H, b.bonus === 'epbig' ? '#2a0a1a' : b.bonus === 'big' ? '#3a1a00' : '#20242c');
    spinRays(ctx, t, W / 2, 80, colors, 32, 0.5, 1500);
    const pop = 1 + Math.max(0, 0.6 - since / 400);
    const fill = b.bonus === 'big' ? vgrad(ctx, 50, 90, ['#fff6b0', '#ffd23a', '#c88a10']) : b.bonus === 'reg' ? vgrad(ctx, 50, 90, ['#ffffff', '#b8c0cc']) : vgrad(ctx, 50, 90, ['#ffe0b0', '#ff7a4a']);
    text(ctx, BONUS_NAME[b.bonus], W / 2, 70, { size: 28 * pop, color: fill, lw: 7, stroke: '#2a0a00' });
    const aim = { big: ['seven', 'seven', 'seven'], reg: ['seven', 'seven', 'bar'], epbig: ['koori', 'koori', 'koori'] }[b.bonus];
    aim.forEach((id, i) => drawSymbol(ctx, id, 112 + i * 34, 100, 30));
    if (b.bonus === 'epbig' && since > 600) {
        const ep = EPISODES[b.episode % EPISODES.length];
        text(ctx, `第${(b.episode % EPISODES.length) + 1}話「${ep.title}」`, W / 2, 150, { size: 14, color: '#ffffff', lw: 4, stroke: '#5a1a2a' });
    } else if (since > 600) {
        text(ctx, `${b.games}G`, W / 2, 150, { size: 16, color: '#ffffff', lw: 4, stroke: '#2a0a00' });
    }
    ctx.restore();
}

// ----- 「こおりを狙え」のあいだ: 上に「こおりを狙え！」と、止まったリールの中段にこおりくんがいるか -----
// nerae: { color, stops: [null | true | false] x3, phase: 'aim' | 'tenpai' | 'hit' | 'miss', since, endAt }
export function drawNerae(ctx, t, nerae) {
    if (nerae.phase === 'hit') return;   // そろったあとは AT確定 の画面と右上の札で見せる
    const miss = nerae.phase === 'miss';
    const since = miss ? t - nerae.endAt : 0;
    if (miss && since > 1400) return;
    ctx.save();
    if (miss) ctx.globalAlpha = 1 - Math.max(0, (since - 900) / 500);
    const tenpai = nerae.phase === 'tenpai';
    rect(ctx, 0, 30, W, 70, tenpai ? `rgba(120,0,0,${0.55 + Math.sin(t / 60) * 0.15})` : 'rgba(0,0,0,.6)');
    const blink = frameOf(t, tenpai ? 120 : 260);
    text(ctx, tenpai ? 'テンパイ！' : miss && since > 200 ? '…' : 'こおりを狙え！', W / 2, 46, { size: 18, color: blink ? '#ffffff' : '#8fd6f7', lw: 5, stroke: '#1b3a6b' });
    nerae.stops.forEach((s, i) => {
        const x = 112 + i * 34;
        if (s === true) {
            rect(ctx, x - 2, 60, 34, 34, 'rgba(255,255,255,.9)');
            drawSymbol(ctx, 'koori', x, 62, 30);
        } else if (s === false) {
            ctx.save();
            ctx.globalAlpha = 0.35;
            drawSymbol(ctx, 'koori', x, 62, 30);
            ctx.restore();
            text(ctx, '×', x + 15, 77, { size: 22, color: '#ff4a4a', lw: 3 });
        } else {
            ctx.save();
            ctx.globalAlpha = blink ? 0.9 : 0.5;
            drawSymbol(ctx, 'koori', x, 62, 30);
            ctx.restore();
        }
    });
    ctx.restore();
}

// ----- AT確定: こおりくん揃い → 虹色のインパクトフラッシュ → 「AT確定」 -----
// label: 'AT確定' (AT 中のボーナスでは '特化ゾーン確定')
export const KAKUTEI_MS = 2800;
export function drawAtKakutei(ctx, t, since, label) {
    // はじめの 180ms は白い光
    if (since < 180) {
        rect(ctx, 0, 0, W, H, '#ffffff');
        return;
    }
    rect(ctx, 0, 0, W, H, '#ffffff');
    spinRays(ctx, t, W / 2, 90, RAINBOW, 40, 0.75, 1200);
    const k = ease((since - 180) / 400);
    const g = rainbow(ctx, 100, 40 + Math.sin(t / 150) * 20, 220, 140);
    ch(ctx, 'koori', W / 2, 150, { scale: 7 * k, tint: '#ffffff' });
    ch(ctx, 'koori', W / 2, 144, { scale: 6 * k, tint: g, alpha: 0.85 });
    ch(ctx, 'koori', W / 2, 140, { scale: 5.2 * k, frame: frameOf(t, 160) });
    if (since > 450) {
        const pop = 1 + Math.max(0, 0.5 - (since - 450) / 300);
        text(ctx, label, W / 2, 28, { size: (label.length > 4 ? 24 : 30) * pop, color: rainbow(ctx, 70, 0, 250, 0), lw: 7 });
        [100, 145, 190].forEach(x => drawSymbol(ctx, 'koori', x, 146, 30));
    }
    // 最後は白くとぶ
    if (since > KAKUTEI_MS - 250) rect(ctx, 0, 0, W, H, `rgba(255,255,255,${(since - KAKUTEI_MS + 250) / 250})`);
}

// ----- ボーナス終了 -----
// end: { bonus, payout, at, stock, atLabel }。1G連 (stock) があれば「ボーナス確定！」、AT へ行くなら RASH へ
export const END_MS = 2400;
export function drawBonusEnd(ctx, t, since, end) {
    const big = end.bonus !== 'reg';
    rect(ctx, 0, 0, W, H, end.bonus === 'epbig' ? vgrad(ctx, 0, H, ['#3a1a4a', '#ff7a4a', '#ffd08a'])
        : big ? vgrad(ctx, 0, H, ['#fff2a0', '#e8b020', '#8a5a00']) : vgrad(ctx, 0, H, ['#ffffff', '#b8c0cc', '#5a6270']));
    rect(ctx, 0, 0, W, H, 'rgba(0,0,0,.45)');
    text(ctx, `${BONUS_SHORT[end.bonus]} 終了`, W / 2, 26, { size: 16, color: '#ffffff', lw: 4 });
    const count = Math.round(end.payout * Math.min(1, since / 700));
    text(ctx, `獲得 ${count}枚`, W / 2, 50, { size: 20, color: vgrad(ctx, 40, 60, ['#fff6b0', '#ffd23a']), lw: 5, stroke: '#3a2000' });
    if (since < 800) return;
    const k = ease((since - 800) / 300);
    if (end.stock) {
        // 1G連: 赤い帯に「ボーナス確定！」(ストックが2つ以上なら ×数)
        rect(ctx, (1 - k) * W, 72, W, 50, vgrad(ctx, 72, 122, ['#ff3030', '#a00010']));
        text(ctx, end.stock > 1 ? `ボーナス確定！ ×${end.stock}` : 'ボーナス確定！', W / 2 + (1 - k) * W, 97, { size: 24, color: '#ffe040', lw: 6 });
        if (since > 1300) text(ctx, '7を狙え', W / 2, 140, { size: 14, color: frameOf(t, 260) ? '#ffffff' : '#ffe040', lw: 4 });
    } else if (end.at) {
        rect(ctx, 0, 72, W, 50, `rgba(0,0,0,${0.6 * k})`);
        ctx.save();
        ctx.globalAlpha = k;
        text(ctx, 'こおりバトルRASH へ！', W / 2, 97, { size: 22, color: rainbow(ctx, 50, 0, 270, 0), lw: 6 });
        ctx.restore();
        ch(ctx, 'koori', 40, 168, { scale: 3, frame: frameOf(t, 200) });
    } else if (end.inAt) {
        // AT 中のボーナス: AT に戻る (特化ゾーンに当たっていたら特化ゾーンへ)
        rect(ctx, 0, 72, W, 50, `rgba(0,0,0,${0.6 * k})`);
        ctx.save();
        ctx.globalAlpha = k;
        text(ctx, end.tokka ? '特化ゾーンへ！' : 'こおりバトルRASH 再開！', W / 2, 97, { size: 22, color: end.tokka ? rainbow(ctx, 50, 0, 270, 0) : '#8fd6f7', lw: 6, stroke: '#06203a' });
        ctx.restore();
        ch(ctx, 'koori', 40, 168, { scale: 3, frame: frameOf(t, 200) });
    } else {
        ch(ctx, 'koori', W / 2, 150, { scale: 3, frame: frameOf(t, 500) });
        text(ctx, '摩天楼へもどる…', W / 2, 92, { size: 14, color: '#e0e6ee', lw: 4 });
    }
}

// ----- AT 中のボーナスの相手 (四天王・大魔王ASO。画面設計書 5-3。イベントは at:boss) -----
export const BOSSES = {
    daishi: { name: 'ダイシ', floor: '22F', stars: 1 },
    zumitani: { name: 'ズミタニ', floor: '33F', stars: 2 },
    runaya: { name: 'ルナヤ', floor: '44F', stars: 3 },
    nozoema: { name: 'ノゾエマ', floor: '55F', stars: 4 },
    maou: { name: '大魔王ASO', floor: '56F', stars: 5 }
};
export const BOSS_MS = { intro: 2200, win: 2400, lose: 1900 };

// ボーナス中の右上の札 (相手の顔と名前)
function drawBossBadge(ctx, t, boss) {
    const b = BOSSES[boss];
    if (!b) return;
    const x = W - 86, y = 40;
    roundRect(ctx, x, y, 80, 30, 4, 'rgba(20,0,10,.8)', '#ff6a3a');
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 2, y + 2, 26, 26);
    ctx.clip();
    fitChar(ctx, boss, x + 15, y + 40, 26, 34, { frame: frameOf(t, 500) }, 1.2);
    ctx.restore();
    text(ctx, b.name, x + 54, y + 10, { size: b.name.length > 4 ? 7.5 : 9, color: '#ffcc80', stroke: null, font: BODY, weight: '700' });
    text(ctx, '★'.repeat(b.stars), x + 54, y + 22, { size: 7, color: b.stars === 5 ? '#ff6a3a' : '#ffd23a', stroke: null, font: BODY });
}

// 登場: 相手が現れて「○○ 出現！」/ 勝利: 撃破して「特化ゾーン確定」/ 敗北: 「撃破ならず…」
// fx: { kind: 'intro' | 'win' | 'lose', boss, since }
export function drawBossFx(ctx, t, fx) {
    const since = t - fx.since;
    const b = BOSSES[fx.boss] || BOSSES.daishi;
    const big = fx.boss === 'maou';
    if (fx.kind === 'intro') {
        rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, big ? ['#1a0000', '#5a0a00', '#100000'] : ['#05040e', '#2a1040', '#0a0414']));
        spinRays(ctx, t, 230, 90, [big ? '#ff3a1a' : '#b080ff', 'rgba(0,0,0,0)'], 24, 0.3, 3000);
        const enter = ease(since / 600);
        fitChar(ctx, fx.boss, 236 + (1 - enter) * 100, 168, 120, big ? 130 : 100, { frame: frameOf(t, 400), silhouette: since < 500 }, 2.4);
        ch(ctx, 'koori', 80, 150, { scale: 3, frame: frameOf(t, 300) });
        roundRect(ctx, 8, 6, 64, 18, 3, 'rgba(0,0,0,.65)', '#ff6a3a');
        text(ctx, b.floor, 40, 15.5, { size: 11, color: '#ff8a40', stroke: null });
        if (since > 500) {
            const pop = 1 + Math.max(0, 0.4 - (since - 500) / 300);
            text(ctx, `${b.name} 出現！`, W / 2, 40, { size: 22 * pop, color: '#ffcc80', lw: 6, stroke: '#3a0008' });
            text(ctx, '勝てば特化ゾーン！', W / 2, 66, { size: 12, color: '#ffffff', lw: 4 });
        }
        return;
    }
    if (fx.kind === 'win') {
        rect(ctx, 0, 0, W, H, '#1a0a00');
        spinRays(ctx, t, W / 2, 96, RAINBOW, 36, 0.55, 2000);
        fitChar(ctx, fx.boss, 250, 172, 100, 90, { tint: '#ffffff', alpha: Math.max(0, 0.6 - since / 1500) }, 1.8);
        ch(ctx, 'koori', 90, 174, { scale: 3.6, frame: frameOf(t, 200) });
        const pop = 1 + Math.max(0, 0.5 - since / 300);
        text(ctx, '勝利！', W / 2, 26, { size: 28 * pop, color: '#ffe040', lw: 7, stroke: '#a01010' });
        if (since > 400) {
            rect(ctx, 0, 48, W, 40, 'rgba(0,0,0,.7)');
            text(ctx, '特化ゾーン確定', W / 2, 68, { size: 22, color: rainbow(ctx, 70, 0, 250, 0), lw: 5 });
        }
        return;
    }
    // 敗北
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#1a1428', '#2a2238', '#0a0812']));
    fitChar(ctx, fx.boss, 236, 168, 120, big ? 130 : 100, { frame: frameOf(t, 400) }, 2.4);
    ch(ctx, 'kooriDown', 80, 150, { scale: 3 });
    rect(ctx, 0, 0, W, H, 'rgba(0,0,30,.35)');
    text(ctx, '撃破ならず…', W / 2, 50, { size: 24, color: '#a0b0c0', lw: 5, stroke: '#101018' });
}
