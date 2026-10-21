// =====================================================================
// 画面設計書の画面イメージ (docs/design.html で表示する)
// ---------------------------------------------------------------------
// 演出を作るときの見本。実際のゲームの画面ではない (動き・タイミングは画面設計書の文で決める)。
// 液晶は 320x180 ドットで描き、表示するときに拡大する。
// 書類 (Markdown) に ```mock <id> <説明>``` と書くと、その場所にこの絵が出る。
// =====================================================================

import { drawArt } from '../../src/presentation/art/pixel.js';
import { ART } from '../../src/presentation/art/characters.js';
import { drawSymbol } from '../../src/presentation/art/symbols.js';
import {
    BODY, DISPLAY, GROUND, H, RAINBOW, W, atBackground, attackScene, ch, cutin, floorTag, haze, miniReels,
    navi, plusGames, pushButton, rainbow, rays, rect, reels, room, roundRect, seeded, team, text, tower,
    vgrad, weapon
} from '../../src/presentation/lcd/kit.js';

// ----- 画面 -----
const LCD = (draw) => ({ w: W, h: H, draw });

function stageLow(ctx) {
    room(ctx, { sky: ['#7ac8f0', '#d8f0ff'], wall: '#d8cfc0', floor: ['#efe6d6', '#b8ad98'], cityColor: '#7a8aa0', lights: '#ffffff' });
    // エレベーター
    rect(ctx, 134, 40, 52, 88, '#8a8e96');
    rect(ctx, 137, 44, 22, 84, '#c8ccd4');
    rect(ctx, 161, 44, 22, 84, '#c8ccd4');
    text(ctx, '▲', 160, 34, { size: 8, color: '#ff8a20', stroke: null });
    team(ctx, 110);
    floorTag(ctx, '5F', 'ロビー');
    navi(ctx, 'ここはまだ5階。下の階は敵も弱いよ！');
}

function stageHigh(ctx) {
    room(ctx, { sky: ['#ff8a40', '#ffd27a', '#7a4a8a'], wall: '#5a3a3a', floor: ['#6a4a3a', '#2a1a14'], cityColor: '#3a2030' });
    team(ctx, 120);
    ch(ctx, 'makibikon', 270, GROUND, { scale: 1.5, silhouette: true, alpha: 0.7 });
    floorTag(ctx, '15F', '夕方の回廊', '#ffb060');
    navi(ctx, '夕方の15階…ここから上は高確だよ');
}

function stageSuper(ctx) {
    room(ctx, { sky: ['#05040e', '#1a1040'], wall: '#14101c', floor: ['#3a0a14', '#14040a'], cityColor: '#0a0a14', lights: '#8fd6f7', stars: true });
    rect(ctx, 120, 128, 80, 52, '#8a1020');
    ch(ctx, 'daishi', 230, 136, { scale: 2.6, silhouette: true, alpha: 0.85 });
    text(ctx, '…', 230, 30, { size: 12, color: '#ff6060', stroke: null });
    team(ctx, 100);
    floorTag(ctx, '22F', 'ダイシの間', '#ff6a6a');
    navi(ctx, '四天王ダイシの気配がする…！');
}

function stageMaou(ctx) {
    room(ctx, { sky: ['#1a0000', '#5a0a00'], wall: '#120808', floor: ['#5a1000', '#1a0400'], cityColor: '#200404', lights: '#ff6a20' });
    rect(ctx, 0, 0, W, H, 'rgba(255,60,0,.08)');
    ch(ctx, 'maou', 230, 140, { scale: 1.9, silhouette: true, alpha: 0.9 });
    team(ctx, 100);
    floorTag(ctx, '56F', '大魔王の間', '#ff8a40');
}

function zoneMaten(ctx) {
    stageLow(ctx);
    haze(ctx);
}

function heavenCutin(ctx) {
    stageLow(ctx);
    rect(ctx, 0, 0, W, H, 'rgba(0,0,0,.45)');
    cutin(ctx, 52, 76, '#a02a1a', 'naitei', '内定のお知らせだ！', { scale: 2.6 });
}

function heavenCutinAru(ctx) {
    stageLow(ctx);
    rect(ctx, 0, 0, W, H, 'rgba(0,0,0,.45)');
    cutin(ctx, 52, 76, '#6a4a00', 'aruaru', '兄の出番だな…', { scale: 2.2 });
}

function tenjo(ctx) {
    rect(ctx, 0, 0, W, H, '#1a0a00');
    rays(ctx, W / 2, 100, RAINBOW, 36, 0.55);
    ch(ctx, 'aruaru', W / 2, 168, { scale: 2.6 });
    text(ctx, '天井到達！', W / 2, 24, { size: 22, color: rainbow(ctx, 100, 0, 220, 0), lw: 5 });
    text(ctx, 'エピソードBIG確定', W / 2, 160, { size: 18, color: rainbow(ctx, 80, 0, 240, 0), lw: 5 });
}

function zenchoBattle(ctx) {
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#1a1438', '#3a2a5a', '#120c22']));
    for (let x = 0; x < W; x += 40) rect(ctx, x, 20, 6, 110, 'rgba(255,255,255,.06)');
    rect(ctx, 0, 128, W, 52, vgrad(ctx, 128, H, ['#4a3a6a', '#1a1028']));
    ch(ctx, 'yasu', 38, GROUND, { scale: 2 });
    ch(ctx, 'onioni', 70, GROUND, { scale: 1.5 });
    ch(ctx, 'koori', 108, GROUND, { scale: 3 });
    ch(ctx, 'okagappa', 210, GROUND, { scale: 1.6, flip: true });
    ch(ctx, 'hibikimakuri', 248, GROUND, { scale: 1.5, flip: true });
    ch(ctx, 'yamamou', 288, GROUND, { scale: 1.6, flip: true });
    text(ctx, 'VS', W / 2, 92, { size: 30, color: '#ffe040', lw: 6, stroke: '#a01010' });
    roundRect(ctx, 80, 6, 160, 20, 3, 'rgba(0,0,0,.6)', '#b080ff');
    text(ctx, '摩天楼 中間階層', W / 2, 16.5, { size: 11, color: '#e0d0ff', stroke: null });
    text(ctx, 'チーム5DX 出現！', W - 8, 40, { size: 13, align: 'right', color: '#ffffff', lw: 4, stroke: '#3a7a2a' });
    text(ctx, '1戦目', 8, 40, { size: 11, align: 'left', color: '#ffffff', lw: 3 });
}

function zenchoWin(ctx) {
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#3a2a5a', '#6a4a9a', '#1a1028']));
    rays(ctx, 210, 100, ['#ffffff', 'rgba(255,255,255,0)'], 30, 0.3);
    ch(ctx, 'okagappa', 200, 160, { scale: 1.4, flip: true, tint: '#ffffff', alpha: 0.7 });
    ch(ctx, 'hibikimakuri', 245, 164, { scale: 1.3, flip: true, tint: '#ffffff', alpha: 0.7 });
    ch(ctx, 'yamamou', 288, 160, { scale: 1.4, flip: true, tint: '#ffffff', alpha: 0.7 });
    ch(ctx, 'koori', 70, 172, { scale: 3.4 });
    text(ctx, '撃破！！', W / 2, 28, { size: 30, color: '#ffe040', lw: 7, stroke: '#a01010' });
    roundRect(ctx, 100, 50, 120, 46, 6, 'rgba(0,0,0,.75)', '#ffe040');
    text(ctx, 'BONUS 確定', 160, 63, { size: 13, color: '#ffffff', stroke: null });
    [124, 151, 178].forEach(x => drawSymbol(ctx, 'seven', x, 72, 18));
}

function zenchoLose(ctx) {
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#1a1428', '#2a2238', '#0a0812']));
    ch(ctx, 'asahara', 236, GROUND, { scale: 1.8, flip: true });
    ch(ctx, 'sasaki', 192, GROUND, { scale: 1.6, flip: true });
    ch(ctx, 'kotani', 282, GROUND, { scale: 1.6, flip: true });
    ch(ctx, 'kooriDown', 80, GROUND, { scale: 3 });
    rect(ctx, 0, 0, W, H, 'rgba(0,0,30,.35)');
    text(ctx, '撃破ならず…', W / 2, 50, { size: 24, color: '#a0b0c0', lw: 5, stroke: '#101018' });
}

function cutinColors(ctx) {
    rect(ctx, 0, 0, W, 200, '#0b1016');
    const rows = [
        ['青', '#1f6ad0', 'こおりくん「いくぞ！」'],
        ['緑', '#1f9a4a', 'こおりくん「チャンスだ！」'],
        ['赤', '#c81e2a', 'こおりくん「勝つぞ！！」'],
        ['金', vgrad(ctx, 0, 40, ['#fff2a0', '#d8a010']), 'こおりくん「激アツ！！」'],
        ['虹', rainbow(ctx, 0, 0, W, 0), 'こおりいきていける！']
    ];
    rows.forEach(([name, color, line], i) => {
        const y = 4 + i * 39;
        ctx.save();
        ctx.translate(0, y);
        ctx.beginPath();
        ctx.moveTo(40, 4);
        ctx.lineTo(W, 0);
        ctx.lineTo(W, 30);
        ctx.lineTo(40, 34);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
        text(ctx, name, 20, y + 17, { size: 14, color: '#ffffff', stroke: null });
        ch(ctx, 'koori', 74, y + 34, { scale: 1.9 });
        text(ctx, line, 200, y + 17, { size: 12, color: '#ffffff', lw: 3 });
    });
}

function buttons(ctx) {
    rect(ctx, 0, 0, W, 120, '#14181f');
    const list = [
        ['通常', '#e8eef4', {}],
        ['青', '#2a7ae0', {}],
        ['赤', '#e02a3a', {}],
        ['金', vgrad(ctx, 40, 80, ['#fff2a0', '#d8a010']), {}],
        ['虹・飛び出し', rainbow(ctx, 250, 30, 300, 70), { pop: true }]
    ];
    list.forEach(([name, fill, opt], i) => {
        const cx = 34 + i * 63;
        pushButton(ctx, cx, 62, 22, fill, opt);
        text(ctx, name, cx, 106, { size: 9, color: '#c8d4e0', stroke: null, font: BODY });
    });
}

function chokugeki(ctx) {
    rect(ctx, 0, 0, W, H, '#000000');
    const rnd = seeded(9);
    for (let i = 0; i < 60; i++) rect(ctx, 0, rnd() * H, W, 1 + rnd() * 3, `rgba(255,255,255,${0.05 + rnd() * 0.25})`);
    for (let i = 0; i < 300; i++) rect(ctx, rnd() * W, rnd() * H, 1, 1, 'rgba(255,255,255,.5)');
    const g = rainbow(ctx, 120, 60, 200, 150);
    ch(ctx, 'koori', W / 2, 150, { scale: 6.2, tint: g, alpha: 0.6 });
    ch(ctx, 'koori', W / 2, 146, { scale: 5.4 });
    text(ctx, 'こおりいきていける！', W / 2, 26, { size: 20, color: rainbow(ctx, 60, 0, 260, 0), lw: 5 });
}

function bigBonus(ctx) {
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#fff2a0', '#e8b020', '#8a5a00']));
    rays(ctx, W / 2, 200, ['#fff6c0', 'rgba(255,255,255,0)'], 28, 0.35);
    text(ctx, 'BIG BONUS', W / 2, 18, { size: 18, color: '#ffffff', lw: 5, stroke: '#8a3a00' });
    roundRect(ctx, 20, 36, 280, 110, 6, 'rgba(30,16,0,.78)', '#ffe680');
    ch(ctx, 'koori', 70, 128, { scale: 4 });
    text(ctx, 'キャラ解説 #1', 120, 52, { size: 10, align: 'left', color: '#ffd23a', stroke: null, font: BODY });
    text(ctx, 'こおりくん', 120, 70, { size: 16, align: 'left', color: '#ffffff', stroke: null });
    ['氷のキューブの体を持つ主人公。', 'おにおにに借りたお金を返すため、', 'ASO摩天楼の財宝をねらう。'].forEach((l, i) =>
        text(ctx, l, 120, 92 + i * 15, { size: 10, align: 'left', color: '#f0e6d0', stroke: null, font: BODY }));
    text(ctx, '獲得 96枚', 20, 164, { size: 11, align: 'left', color: '#ffffff', lw: 3, stroke: '#5a3000' });
    text(ctx, '残り 18G', W - 20, 164, { size: 11, align: 'right', color: '#ffffff', lw: 3, stroke: '#5a3000' });
}

function regBonus(ctx) {
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#ffffff', '#b8c0cc', '#5a6270']));
    text(ctx, 'REGULAR BONUS', W / 2, 18, { size: 16, color: '#ffffff', lw: 5, stroke: '#3a4250' });
    roundRect(ctx, 20, 36, 280, 110, 6, 'rgba(20,24,30,.78)', '#e0e6ee');
    // 摩天楼の図 (ステージ解説)
    tower(ctx, 70, 140, 96, '#0d1117');
    [0.25, 0.5, 0.75].forEach(f => rect(ctx, 50, 140 - 96 * f, 40, 1, '#8fd6f7'));
    text(ctx, 'ステージ解説', 120, 52, { size: 10, align: 'left', color: '#c8d4e0', stroke: null, font: BODY });
    text(ctx, 'ASO摩天楼', 120, 70, { size: 16, align: 'left', color: '#ffffff', stroke: null });
    ['山口と福岡の境目に突然現れた塔。', '1〜10階は低確、11階より上は高確。', '四天王と大魔王の階は超高確！'].forEach((l, i) =>
        text(ctx, l, 120, 92 + i * 15, { size: 10, align: 'left', color: '#e0e6ee', stroke: null, font: BODY }));
    text(ctx, '残り 6G', W - 20, 164, { size: 11, align: 'right', color: '#ffffff', lw: 3, stroke: '#3a4250' });
}

function epBig(ctx) {
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#3a1a4a', '#ff7a4a', '#ffd08a']));
    tower(ctx, 250, 128, 120, '#0d1117');
    rect(ctx, 0, 118, W, 62, '#2a1a20');
    ch(ctx, 'tomoishi', 60, 120, { scale: 2.6 });
    ch(ctx, 'koori', 110, 120, { scale: 2.6 });
    ch(ctx, 'onioni', 165, 120, { scale: 1.6, flip: true });
    text(ctx, 'EPISODE BIG', 8, 12, { size: 10, align: 'left', color: '#ffffff', lw: 3 });
    text(ctx, '第1話「借金」', W - 8, 12, { size: 10, align: 'right', color: '#ffffff', lw: 3 });
    roundRect(ctx, 10, 126, 300, 48, 4, 'rgba(0,0,0,.75)', '#ffd08a');
    text(ctx, 'おにおに', 20, 138, { size: 10, align: 'left', color: '#ff8a7a', stroke: null, font: BODY });
    text(ctx, '「こおり、今月の返済はまだか？」', 20, 156, { size: 12, align: 'left', color: '#ffffff', stroke: null, font: BODY });
}

function bonusAt(ctx) {
    rect(ctx, 0, 0, W, H, '#ffffff');
    rays(ctx, W / 2, 90, RAINBOW, 40, 0.75);
    ch(ctx, 'koori', W / 2, 150, { scale: 7, tint: '#ffffff' });
    ch(ctx, 'koori', W / 2, 144, { scale: 6, tint: rainbow(ctx, 100, 40, 220, 140), alpha: 0.85 });
    ch(ctx, 'koori', W / 2, 140, { scale: 5.2 });
    text(ctx, 'AT確定', W / 2, 28, { size: 30, color: rainbow(ctx, 90, 0, 230, 0), lw: 7 });
    [100, 145, 190].forEach(x => drawSymbol(ctx, 'koori', x, 146, 30));
}

// ボーナス中の「こおりを狙え」カットイン (AT 当選の告知。ガセもある)
function kooriNerae(ctx) {
    bigBonus(ctx);
    rect(ctx, 0, 0, W, H, 'rgba(0,0,0,.5)');
    cutin(ctx, 40, 84, '#c81e2a', 'koori', '', { scale: 4 });
    text(ctx, 'こおりを狙え！', 206, 70, { size: 24, color: '#ffffff', lw: 6, stroke: '#5a0010' });
    [170, 204, 238].forEach(x => drawSymbol(ctx, 'koori', x, 90, 26));
}

// 前兆中に AT のゲーム数がなくなったときの当落告知「ラストジャッジ」(仕様書 2026-10-21。+50G の継続はやめた)
function atJudge(ctx) {
    rect(ctx, 0, 0, W, H, '#05040a');
    rays(ctx, W / 2, 96, ['rgba(255,60,60,.5)', 'rgba(0,0,0,0)'], 24, 0.35);
    ['sasaki', 'kotani', 'asahara'].forEach((id, i) => ch(ctx, id, 190 + i * 44, 138, { scale: 1.6, flip: true }));
    ch(ctx, 'koori', 70, 140, { scale: 3 });
    text(ctx, '残り 0G', W / 2, 24, { size: 12, color: '#ff8a8a', lw: 3 });
    text(ctx, 'ラストジャッジ！', W / 2, 54, { size: 24, color: vgrad(ctx, 40, 68, ['#ffffff', '#ff6a6a']), lw: 6, stroke: '#3a0008' });
    pushButton(ctx, W / 2, 156, 14, '#e02a3a');
    text(ctx, '勝ち → 撃破！ボーナス確定 / 負け → RASH 終了…', W / 2, 176, { size: 8, color: '#c8d4e0', stroke: null, font: BODY });
}

// 特化ゾーンの継続率テーブルでの継続 (リプレイ以上を引けなかったのに続く)
function zoneRevive(ctx) {
    zoneDaichoenScene(ctx, false);
    rect(ctx, 0, 0, W, H, 'rgba(0,0,0,.55)');
    text(ctx, '3G 終了…', W / 2, 46, { size: 14, color: '#c8c8c8', lw: 3 });
    text(ctx, '復活！', W / 2, 92, { size: 38, color: vgrad(ctx, 72, 112, ['#fff6b0', '#ff9a20']), lw: 7, stroke: '#3a0a00' });
    text(ctx, '次のセットへ', W / 2, 132, { size: 14, color: '#ffffff', lw: 4 });
}

function bonusStock(ctx) {
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#fff2a0', '#e8b020', '#8a5a00']));
    rect(ctx, 0, 0, W, H, 'rgba(0,0,0,.35)');
    text(ctx, 'BIG 終了  獲得 240枚', W / 2, 24, { size: 12, color: '#ffffff', lw: 3 });
    rect(ctx, 0, 62, W, 50, vgrad(ctx, 62, 112, ['#ff3030', '#a00010']));
    text(ctx, 'ボーナス確定！', W / 2, 87, { size: 26, color: '#ffe040', lw: 6 });
    text(ctx, '7を狙え', W / 2, 136, { size: 14, color: '#ffffff', lw: 4 });
    [112, 151, 190].forEach(x => drawSymbol(ctx, 'seven', x, 148, 20));
}

function atLcd(ctx) {
    atBackground(ctx);
    tower(ctx, 260, 130, 110, '#06101c');
    team(ctx, 120, GROUND);
    rect(ctx, 0, 0, W, 22, 'rgba(0,0,0,.55)');
    text(ctx, 'こおりバトルRASH', 8, 11.5, { size: 12, align: 'left', color: '#8fd6f7', stroke: null });
    roundRect(ctx, W - 92, 3, 86, 17, 3, 'rgba(255,255,255,.12)');
    text(ctx, '残り', W - 76, 11.5, { size: 9, color: '#c8e8ff', stroke: null, font: BODY });
    text(ctx, '87G', W - 36, 11.5, { size: 13, color: '#ffffff', stroke: null });
    text(ctx, '獲得 312枚', 8, 170, { size: 9, align: 'left', color: '#c8e8ff', stroke: null, font: BODY });
}

function atMain(ctx) {
    rect(ctx, 0, 0, W, 330, '#0b0e13');
    ctx.save();
    atLcd(ctx);
    ctx.restore();
    // 押し順ナビ (リールの上)
    const cell = 34, x0 = 101, y0 = 216;
    [3, 1, 2].forEach((n, i) => {
        const cx = x0 + i * (cell + 8) + cell / 2;
        roundRect(ctx, cx - 14, 186, 28, 22, 4, i === 1 ? '#ff3a3a' : '#2a3a5a', '#ffffff');
        text(ctx, String(n), cx, 197.5, { size: 15, color: '#ffffff', stroke: null });
    });
    text(ctx, '押し順ナビ', 50, 197, { size: 9, color: '#8fd6f7', stroke: null, font: BODY });
    reels(ctx, x0, y0, cell, [['bell', 'replay', 'cherry'], ['replay', 'bell', 'suika'], ['suika', 'seven', 'bell']]);
}

function atCount(ctx) {
    atLcd(ctx);
    rect(ctx, 0, 0, W, H, 'rgba(0,0,0,.55)');
    text(ctx, '残り', W / 2, 52, { size: 16, color: '#ffffff', lw: 4 });
    text(ctx, '5G', W / 2, 104, { size: 64, color: vgrad(ctx, 70, 140, ['#ffffff', '#8fd6f7']), lw: 8, stroke: '#0a2a5a' });
}

function uwanoseFriend(ctx) {
    attackScene(ctx, 'yasu', 'harry', '+20G');
}

function uwanoseOnioni(ctx) {
    attackScene(ctx, 'onioni', 'urashima', '+50G');
}

function uwanoseSword(ctx) {
    attackScene(ctx, 'koori', 'makibikon', '+100G', () => {
        weapon(ctx, 'sword', 128, 118);
        text(ctx, 'コオリソード', 100, 30, { size: 12, color: '#bff0ff', lw: 4 });
        pushButton(ctx, 22, 164, 11, '#e8eef4');
    });
}

function uwanoseHammer(ctx) {
    attackScene(ctx, 'koori', 'nakata', '+300G', () => {
        weapon(ctx, 'hammer', 128, 118);
        text(ctx, 'コオリハンマー', 100, 30, { size: 12, color: '#bff0ff', lw: 4 });
        pushButton(ctx, 22, 164, 11, '#2a7ae0');
        roundRect(ctx, 40, 160, 70, 8, 3, '#1a2230');
        roundRect(ctx, 40, 160, 52, 8, 3, '#ffd23a');
        text(ctx, '長押し！', 116, 164, { size: 9, align: 'left', color: '#ffffff', lw: 3 });
    });
}

function uwanoseKill(ctx) {
    attackScene(ctx, 'koori', 'goldDog', '+500G', () => {
        weapon(ctx, 'kill', 130, 118);
        text(ctx, '四天王絶対殺す剣', 110, 30, { size: 12, color: rainbow(ctx, 50, 0, 170, 0), lw: 4 });
        pushButton(ctx, 22, 164, 11, rainbow(ctx, 11, 153, 33, 175));
        [0, 1, 2, 3].forEach(i => roundRect(ctx, 40 + i * 12, 160, 9, 9, 2, i < 3 ? '#ffd23a' : '#3a4250'));
        text(ctx, 'PUSH ×4', 92, 164.5, { size: 9, align: 'left', color: '#ffffff', lw: 3 });
    });
}

function atBoss(ctx) {
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#1a0000', '#5a0a00', '#100000']));
    rays(ctx, 240, 90, ['#ff3a1a', 'rgba(0,0,0,0)'], 24, 0.25);
    ch(ctx, 'maou', 236, 168, { scale: 2.3 });
    ch(ctx, 'onioni', 50, GROUND, { scale: 1.5 });
    ch(ctx, 'koori', 96, GROUND, { scale: 3 });
    roundRect(ctx, 8, 6, 140, 20, 3, 'rgba(0,0,0,.65)', '#ff6a3a');
    text(ctx, '大魔王ASO 出現！', 78, 16.5, { size: 12, color: '#ffcc80', stroke: null });
    text(ctx, '56F', 8, 40, { size: 11, align: 'left', color: '#ff8a40', lw: 3 });
}

function atBossWin(ctx) {
    rect(ctx, 0, 0, W, H, '#1a0a00');
    rays(ctx, W / 2, 96, RAINBOW, 36, 0.55);
    ch(ctx, 'maou', 250, 172, { scale: 1.6, tint: '#ffffff', alpha: 0.5 });
    ch(ctx, 'koori', 90, 174, { scale: 3.6 });
    text(ctx, '勝利！', W / 2, 26, { size: 28, color: '#ffe040', lw: 7, stroke: '#a01010' });
    rect(ctx, 0, 48, W, 40, 'rgba(0,0,0,.7)');
    text(ctx, '特化ゾーン確定', W / 2, 68, { size: 22, color: rainbow(ctx, 70, 0, 250, 0), lw: 5 });
}

function bossOrder(ctx) {
    rect(ctx, 0, 0, W, 140, '#120a10');
    [['daishi', 'ダイシ', 1], ['zumitani', 'ズミタニ', 2], ['runaya', 'ルナヤ', 3], ['nozoema', 'ノゾエマ', 4], ['maou', '大魔王ASO', 5]].forEach(([id, name, star], i) => {
        const cx = 32 + i * 64;
        ch(ctx, id, cx, 92, { scale: id === 'maou' ? 1.1 : 1.5 });
        text(ctx, name, cx, 106, { size: 9, color: '#ffffff', stroke: null, font: BODY });
        text(ctx, '★'.repeat(star), cx, 124, { size: 9, color: star === 5 ? '#ff6a3a' : '#ffd23a', stroke: null, font: BODY });
    });
}

function zoneEntry(ctx) {
    rect(ctx, 0, 0, W, H, '#000000');
    rays(ctx, W / 2, H / 2, ['#ffd23a', 'rgba(0,0,0,0)'], 32, 0.4);
    rect(ctx, 0, 64, W, 52, vgrad(ctx, 64, 116, ['#2a1a00', '#5a3a00', '#2a1a00']));
    text(ctx, '特化ゾーン', W / 2, 80, { size: 16, color: '#ffffff', lw: 4 });
    text(ctx, 'ストック！', W / 2, 102, { size: 22, color: vgrad(ctx, 90, 114, ['#fff6b0', '#ffb020']), lw: 5, stroke: '#3a1a00' });
    text(ctx, '(液晶が一瞬止まったあとに出る)', W / 2, 160, { size: 9, color: '#8a8a8a', stroke: null, font: BODY });
}

function zoneMaouScene(ctx, rainbowFlash) {
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#2a0a20', '#5a1030', '#1a0410']));
    // 玉座
    rect(ctx, 196, 30, 90, 110, '#3a0a1a');
    rect(ctx, 196, 30, 90, 6, '#ffd700');
    ch(ctx, 'maou', 241, 150, { scale: 1.6 });
    text(ctx, '魔王の褒美', 8, 14, { size: 14, align: 'left', color: '#ffd700', lw: 4, stroke: '#3a0010' });
    text(ctx, '1セット目', 8, 32, { size: 9, align: 'left', color: '#ffffff', stroke: null, font: BODY });
    // 3G ぶんの宝箱と結果
    [['1G', '+15G'], ['2G', '+30G'], ['3G', '+5G']].forEach(([g, v], i) => {
        const x = 16 + i * 58;
        rect(ctx, x, 84, 44, 26, '#8a4a10');
        rect(ctx, x, 78, 44, 8, '#b8701a');
        rect(ctx, x + 19, 88, 6, 6, '#ffd700');
        text(ctx, g, x + 22, 122, { size: 9, color: '#e8d0e0', stroke: null, font: BODY });
        text(ctx, v, x + 22, 64, { size: 13, color: '#ffe040', lw: 3 });
    });
    roundRect(ctx, 16, 136, 160, 34, 4, 'rgba(0,0,0,.7)', '#ffd700');
    text(ctx, '合計 +50G', 64, 153, { size: 13, color: '#ffffff', stroke: null });
    text(ctx, '継続！', 140, 153, { size: 13, color: '#ff8aa0', stroke: null });
    if (rainbowFlash) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        rect(ctx, 0, 0, W, H, rainbow(ctx, 0, 0, W, H));
        ctx.restore();
        text(ctx, '継続確定！', W / 2, 96, { size: 30, color: '#ffffff', lw: 7, stroke: '#5a0a5a' });
    }
}

function flames(ctx, cx, ground, colorFn) {
    const rnd = seeded(21);
    for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        const x = cx + Math.cos(a) * 70, y = ground - 46 + Math.sin(a) * 40;
        const h = 18 + rnd() * 16;
        ctx.beginPath();
        ctx.moveTo(x - 7, y + 8);
        ctx.quadraticCurveTo(x - 4, y - h * 0.4, x, y - h);
        ctx.quadraticCurveTo(x + 4, y - h * 0.4, x + 7, y + 8);
        ctx.fillStyle = colorFn(i);
        ctx.fill();
    }
}

function zoneDaichoenScene(ctx, kakutei) {
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#2a0800', '#5a1a00', '#1a0400']));
    flames(ctx, 160, 150, i => (kakutei ? RAINBOW[i % RAINBOW.length] : ['#ff5a1a', '#ff9a20', '#ffd040'][i % 3]));
    if (kakutei) ch(ctx, 'koori', 160, 150, { scale: 4.4, tint: rainbow(ctx, 120, 80, 200, 150), alpha: 0.7 });
    ch(ctx, 'koori', 160, 146, { scale: 3.8 });
    text(ctx, 'こおり大腸炎', 8, 14, { size: 14, align: 'left', color: '#ff9a4a', lw: 4, stroke: '#3a0a00' });
    text(ctx, '1セット目 2G', 8, 32, { size: 9, align: 'left', color: '#ffffff', stroke: null, font: BODY });
    if (kakutei) {
        text(ctx, '確定', W / 2, 30, { size: 30, color: rainbow(ctx, 120, 0, 200, 0), lw: 7 });
    } else {
        plusGames(ctx, '+20G', 262, 64, 26);
    }
}

// 特化ゾーンのパターンを選ぶ画面 (プレイヤーが選ぶ。2026-10-20 ユーザー指定)
function zoneSelect(ctx) {
    rect(ctx, 0, 0, W, H, '#0a0610');
    text(ctx, '特化ゾーンを選んでください', W / 2, 16, { size: 13, color: '#ffffff', lw: 3 });
    const panels = [
        ['魔王の褒美', '3G まとめて結果発表', ['#2a0a20', '#5a1030'], 'maou', '#ffd700', true],
        ['こおり大腸炎', '1G ごとに上乗せ', ['#2a0800', '#5a1a00'], 'koori', '#ff9a4a', false]
    ];
    panels.forEach(([name, sub, bg, id, color, selected], i) => {
        const x = 14 + i * 152, y = 30, w = 140, h = 118;
        if (selected) roundRect(ctx, x - 3, y - 3, w + 6, h + 6, 8, '#ffffff');
        roundRect(ctx, x, y, w, h, 6, vgrad(ctx, y, y + h, bg));
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        if (id === 'koori') flames(ctx, x + w / 2, y + 100, k => ['#ff5a1a', '#ff9a20', '#ffd040'][k % 3]);
        ch(ctx, id, x + w / 2, y + 88, { scale: id === 'maou' ? 1 : 2.6 });
        ctx.restore();
        text(ctx, name, x + w / 2, y + 100, { size: 13, color, lw: 3 });
        text(ctx, sub, x + w / 2, y + 113, { size: 8.5, color: '#e8e0e8', stroke: null, font: BODY });
    });
    text(ctx, '◀ 停止ボタンで選ぶ ▶', 110, 166, { size: 9, color: '#c8d4e0', stroke: null, font: BODY });
    pushButton(ctx, 222, 166, 10, '#e8eef4');
    text(ctx, 'で決定', 238, 166.5, { size: 9, align: 'left', color: '#c8d4e0', stroke: null, font: BODY });
    text(ctx, '10', W - 12, 166, { size: 12, align: 'right', color: '#ffe040', stroke: null });
}

function atEnd(ctx) {
    rect(ctx, 0, 0, W, H, vgrad(ctx, 0, H, ['#0d1117', '#1a2a3a']));
    text(ctx, 'こおりバトルRASH 終了', W / 2, 16, { size: 13, color: '#8fd6f7', stroke: null });
    const rows = [['総獲得枚数', '1,234枚'], ['総ゲーム数', '412G'], ['上乗せ', '18回'], ['特化ゾーン', '2回'], ['最高到達階', '44F']];
    rows.forEach(([k, v], i) => {
        text(ctx, k, 16, 44 + i * 24, { size: 10, align: 'left', color: '#a8bccc', stroke: null, font: BODY });
        text(ctx, v, 150, 44 + i * 24, { size: 13, align: 'right', color: '#ffffff', stroke: null });
        rect(ctx, 16, 54 + i * 24, 134, 1, 'rgba(255,255,255,.12)');
    });
    roundRect(ctx, 166, 32, 142, 132, 4, '#05080b', '#ffd700');
    ctx.save();
    ctx.beginPath();
    ctx.rect(168, 34, 138, 128);
    ctx.clip();
    rect(ctx, 168, 34, 138, 128, vgrad(ctx, 34, 162, ['#7ac8f0', '#d8f0ff']));
    ch(ctx, 'yasu', 190, 150, { scale: 1.4 });
    ch(ctx, 'tamu', 208, 150, { scale: 1.4 });
    ch(ctx, 'dake', 226, 150, { scale: 1.4 });
    ch(ctx, 'onioni', 256, 150, { scale: 1.1 });
    ch(ctx, 'koori', 288, 150, { scale: 1.8 });
    ctx.restore();
    text(ctx, 'チームばりきつよめ', 237, 172, { size: 9, color: '#c8d4e0', stroke: null, font: BODY });
}

// 設定示唆の画像 (AT 終了画面の右側に出る)
function setteiImages(ctx) {
    const list = [
        ['ばりきつよめ', ['yasu', 'onioni', 'koori'], ['#7ac8f0', '#d8f0ff'], 'デフォルト'],
        ['チーム5DX', ['okagappa', 'hibikimakuri', 'yamamou'], ['#5ab84a', '#d8f0c0'], '奇数示唆'],
        ['チームASK-3', ['sasaki', 'asahara', 'kotani'], ['#2a4ad0', '#c0d0ff'], '偶数示唆'],
        ['お願いマッスル', ['shibata', 'ueno', 'ikekimu'], ['#c02828', '#ffd0c0'], '高設定示唆'],
        ['四天王', ['daishi', 'zumitani', 'runaya', 'nozoema'], ['#2a0a20', '#6a2a4a'], '設定4以上'],
        ['大魔王ASO', ['maou'], ['#3a0000', '#ff5a1a'], '設定5以上'],
        ['全員集合（金）', ['koori', 'goldDog', 'maou'], ['#fff2a0', '#d8a010'], '設定6確定']
    ];
    rect(ctx, 0, 0, W, 236, '#0b1016');
    list.forEach(([name, ids, sky, hint], i) => {
        const col = i % 4, row = Math.floor(i / 4);
        const x = 6 + col * 78, y = 6 + row * 116, w = 74, h = 74;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        rect(ctx, x, y, w, h, vgrad(ctx, y, y + h, sky));
        ids.forEach((id, k) => {
            const n = ids.length, sc = id === 'maou' ? (n === 1 ? 1 : 0.55) : n > 3 ? 0.75 : 1;
            ch(ctx, id, x + (w / (n + 1)) * (k + 1), y + h - 4, { scale: sc });
        });
        ctx.restore();
        ctx.strokeStyle = i === 6 ? '#ffd700' : '#3a4a5a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);
        text(ctx, name, x + w / 2, y + h + 12, { size: 8.5, color: '#ffffff', stroke: null, font: BODY });
        text(ctx, hint, x + w / 2, y + h + 26, { size: 8.5, color: i >= 4 ? '#ffd23a' : '#93a6b8', stroke: null, font: BODY });
    });
}

function reelSymbols(ctx) {
    rect(ctx, 0, 0, W, 84, '#f4f6f8');
    const names = { seven: '7', bar: 'BAR', koori: 'こおりくん', bell: 'ベル', replay: 'リプレイ', cherry: 'チェリー', suika: 'スイカ' };
    Object.entries(names).forEach(([id, name], i) => {
        const x = 8 + i * 44.5;
        drawSymbol(ctx, id, x + 2, 10, 36);
        text(ctx, name, x + 20, 66, { size: name.length > 4 ? 8 : 10, color: '#16202b', stroke: null, font: BODY });
    });
}

// レア役の停止形 (仕様書の「レア役の停止形」とリール配列 v1.0 から作った出目の例)
function deme(ctx) {
    rect(ctx, 0, 0, W, 214, '#f4f6f8');
    const S = 'suika', B = 'bell', R = 'replay', X = 'bar', C = 'cherry', N = 'seven';
    const list = [
        ['弱チェリー', [[R, R, B], [X, B, R], [C, 'koori', S]], [[2, 0], [1, 2]]],
        ['強チェリー', [[R, R, S], [X, B, N], [C, S, B]], [[2, 0], [1, 2]]],
        ['中段チェリー', [[N, S, R], [C, N, S], [B, R, N]], [[1, 0], [0, 0], [1, 1], [2, 2]]],
        ['弱スイカ', [[S, B, B], [B, S, R], [R, N, S]], [[0, 0], [1, 1], [2, 2]]],
        ['強スイカA', [[S, S, S], [B, N, N], [R, R, B]], [[0, 0], [0, 1], [0, 2]]],
        ['強スイカB', [[R, B, R], [S, S, S], [B, N, N]], [[1, 0], [1, 1], [1, 2]]],
        ['チャンス目A', [[B, R, B], [R, B, R], [X, S, S]], [[0, 0], [1, 1], [0, 2]]],
        ['チャンス目B', [[S, B, R], [B, S, S], [R, N, N]], [[0, 0], [1, 1], [1, 2]]]
    ];
    list.forEach(([name, grid, mark], i) => {
        const x = 6 + (i % 4) * 78, y = 8 + Math.floor(i / 4) * 104;
        miniReels(ctx, x + 6, y, grid, mark);
        text(ctx, name, x + 37, y + 66 + 16, { size: 9.5, color: '#16202b', stroke: null, font: BODY });
    });
}

// 筐体の全体
function cabinet(ctx) {
    const w = 260, h = 470;
    rect(ctx, 0, 0, w, h, '#e9eef2');
    // 黒い摩天楼の上部
    ctx.fillStyle = '#0d1117';
    ctx.beginPath();
    ctx.moveTo(20, 70);
    ctx.lineTo(40, 30);
    ctx.lineTo(80, 22);
    ctx.lineTo(110, 6);
    ctx.lineTo(130, 0);
    ctx.lineTo(150, 6);
    ctx.lineTo(180, 22);
    ctx.lineTo(220, 30);
    ctx.lineTo(240, 70);
    ctx.fill();
    // 本体
    roundRect(ctx, 14, 60, 232, 404, 10, vgrad(ctx, 60, 464, ['#141a22', '#0b0f14', '#1a222c']));
    // 氷のふち
    ctx.fillStyle = '#bff0ff';
    [[14, 90, 10, 60], [236, 120, 10, 70], [14, 300, 8, 50], [238, 330, 8, 60]].forEach(([x, y, cw, chh]) => {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + cw, y + chh / 2);
        ctx.lineTo(x, y + chh);
        ctx.fill();
    });
    rect(ctx, 14, 60, 232, 3, '#7fd3f7');
    // タイトル
    text(ctx, 'こおりくんの大冒険', 130, 42, { size: 15, color: vgrad(ctx, 32, 52, ['#ffffff', '#7fd3f7']), lw: 4, stroke: '#0a2a5a' });
    text(ctx, '～最凶のASO摩天楼への挑戦～', 130, 62, { size: 9, color: '#ffffff', lw: 3, stroke: '#0a2a5a' });
    // 液晶 (通常時の 5階)
    rect(ctx, 22, 80, 216, 124, '#000000');
    ctx.save();
    ctx.translate(26, 84);
    ctx.scale(208 / W, 116 / H);
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    stageLow(ctx);
    ctx.restore();
    // リール
    rect(ctx, 22, 214, 216, 96, '#05080b');
    reels(ctx, 80, 220, 28, [['bell', 'seven', 'replay'], ['replay', 'bell', 'cherry'], ['bar', 'suika', 'bell']]);
    // 表示
    rect(ctx, 30, 318, 200, 22, '#1a0a0a');
    text(ctx, 'CREDIT 50', 76, 329.5, { size: 10, color: '#ff4a3a', stroke: null });
    text(ctx, 'PAYOUT 0', 184, 329.5, { size: 10, color: '#ff4a3a', stroke: null });
    // ボタン類
    roundRect(ctx, 26, 350, 44, 18, 4, '#d8dce4');
    text(ctx, 'MAX BET', 48, 359.5, { size: 7, color: '#16202b', stroke: null });
    rect(ctx, 44, 372, 4, 30, '#9aa4b0');
    ctx.beginPath();
    ctx.arc(46, 404, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#e02a3a';
    ctx.fill();
    pushButton(ctx, 130, 380, 22, '#e8eef4');
    [176, 202, 228].forEach(x => {
        ctx.beginPath();
        ctx.arc(x - 6, 412, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#7fd3f7';
        ctx.fill();
    });
    text(ctx, 'STOP', 196, 432, { size: 7, color: '#8fd6f7', stroke: null });
    rect(ctx, 30, 446, 200, 10, '#05080b');
}

// 摩天楼の階の図 (キャラ設計書)
function towerMap(ctx) {
    const w = 320, h = 360;
    rect(ctx, 0, 0, w, h, vgrad(ctx, 0, h, ['#05040e', '#1a2a4a', '#ff9a5a']));
    ctx.fillStyle = '#0d1117';
    ctx.beginPath();
    ctx.moveTo(60, 350);
    ctx.lineTo(70, 40);
    ctx.lineTo(100, 10);
    ctx.lineTo(130, 40);
    ctx.lineTo(140, 350);
    ctx.fill();
    const bands = [
        [24, 56, '#ff5a1a', '56F 大魔王ASO', 'maou'],
        [60, 100, '#ff6a6a', '55F ノゾエマ・44F ルナヤ', null],
        [104, 236, '#ffb060', '11F〜 高確（住み着いた敵が強い）', 'makibikon'],
        [240, 280, '#b080ff', '中間階層（前兆）ライバル戦', 'okagappa'],
        [284, 348, '#8fd6f7', '1〜10F 低確', 'harry']
    ];
    bands.forEach(([y0, y1, color, label, id]) => {
        rect(ctx, 64, y0, 72, y1 - y0, color + '33');
        rect(ctx, 136, y0, 4, y1 - y0, color);
        text(ctx, label, 150, (y0 + y1) / 2, { size: 9.5, align: 'left', color: '#ffffff', stroke: null, font: BODY });
        if (id) ch(ctx, id, 100, y1 - 2, { scale: id === 'maou' ? 0.45 : 0.8 });
    });
    text(ctx, '33F ズミタニ・22F ダイシ', 150, 92, { size: 9.5, align: 'left', color: '#ffffff', stroke: null, font: BODY });
    ['daishi', 'zumitani', 'runaya', 'nozoema'].forEach((id, i) => ch(ctx, id, 76 + i * 16, 98, { scale: 0.75 }));
    ch(ctx, 'koori', 30, 350, { scale: 2 });
}

export const SCENES = {
    'cabinet': { w: 260, h: 470, draw: cabinet },
    'stage-low': LCD(stageLow),
    'stage-high': LCD(stageHigh),
    'stage-super': LCD(stageSuper),
    'stage-maou': LCD(stageMaou),
    'zone-maten': LCD(zoneMaten),
    'heaven-naitei': LCD(heavenCutin),
    'heaven-aruaru': LCD(heavenCutinAru),
    'tenjo': LCD(tenjo),
    'zencho-battle': LCD(zenchoBattle),
    'zencho-win': LCD(zenchoWin),
    'zencho-lose': LCD(zenchoLose),
    'cutin-colors': { w: W, h: 200, draw: cutinColors },
    'buttons': { w: W, h: 120, draw: buttons },
    'chokugeki': LCD(chokugeki),
    'big': LCD(bigBonus),
    'reg': LCD(regBonus),
    'epbig': LCD(epBig),
    'koori-nerae': LCD(kooriNerae),
    'bonus-at': LCD(bonusAt),
    'at-judge': LCD(atJudge),
    'zone-revive': LCD(zoneRevive),
    'bonus-stock': LCD(bonusStock),
    'at-main': { w: W, h: 326, draw: atMain },
    'at-count': LCD(atCount),
    'uwanose-friend': LCD(uwanoseFriend),
    'uwanose-onioni': LCD(uwanoseOnioni),
    'uwanose-sword': LCD(uwanoseSword),
    'uwanose-hammer': LCD(uwanoseHammer),
    'uwanose-kill': LCD(uwanoseKill),
    'at-boss': LCD(atBoss),
    'at-boss-win': LCD(atBossWin),
    'boss-order': { w: W, h: 140, draw: bossOrder },
    'zone-entry': LCD(zoneEntry),
    'zone-select': LCD(zoneSelect),
    'zone-maou': LCD(ctx => zoneMaouScene(ctx, false)),
    'zone-maou-rainbow': LCD(ctx => zoneMaouScene(ctx, true)),
    'zone-daichoen': LCD(ctx => zoneDaichoenScene(ctx, false)),
    'zone-daichoen-kakutei': LCD(ctx => zoneDaichoenScene(ctx, true)),
    'at-end': LCD(atEnd),
    'settei-images': { w: W, h: 236, draw: setteiImages },
    'reel-symbols': { w: W, h: 84, draw: reelSymbols },
    'deme': { w: W, h: 214, draw: deme },
    'tower-map': { w: 320, h: 360, draw: towerMap }
};

// キャラクター1人の絵 (キャラ設計書のカード)
export function drawCharacterCard(ctx, id, w, h) {
    const art = ART[id];
    const scale = Math.min((w - 8) / art.w, (h - 8) / art.h, 3);
    drawArt(ctx, art, w / 2, h - 4, { scale });
}
