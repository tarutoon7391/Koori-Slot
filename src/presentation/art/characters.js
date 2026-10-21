// =====================================================================
// キャラクターのドット絵と一覧
// ---------------------------------------------------------------------
// 前作のキャラは characters-legacy.js、このゲームの新キャラはこのファイルに描く。
// 新キャラの見た目は Claude の案 (2026-10-20)。docs/characters.md に説明がある。
// 絵は w x h ドットの枠に r(x, y, w, h, 色) で描き、frame (0/1) で待機アニメーション。
// =====================================================================

import { fromRows, glyphText } from './pixel.js';
import { SKIN, STRING_SPRITES, LEGACY } from './characters-legacy.js';

// 文字列のドット絵 (こおりくん・ともいし・ふるカワ) を r(...) の形にする
function stringArt(id, frame0, frame1) {
    const s = STRING_SPRITES[id];
    const rows = s.frames[frame0];
    const art = [fromRows(s.palette, rows), fromRows(s.palette, s.frames[frame1])];
    return { w: rows[0].length, h: rows.length, draw: (r, frame) => art[frame ? 1 : 0](r) };
}

const NEW_ART = {
    // ----- チーム5DX -----
    // やまもぅ: 牛柄のパーカー (フードに小さい角と耳)・首にカウベル・茶色の前髪
    yamamou: {
        w: 32, h: 40,
        draw(r, frame) {
            const up = frame ? -1 : 0;
            const white = '#f4f4f4', spot = '#1a1a1a';
            r(9, 1, 2, 3, '#f0e0a0');
            r(21, 1, 2, 3, '#f0e0a0');
            r(8, 3, 16, 16, white);
            r(9, 4, 4, 3, spot);
            r(19, 4, 3, 3, spot);
            r(5, 6, 3, 3, white);
            r(24, 6, 3, 3, white);
            r(6, 7, 2, 1, '#ff9eb5');
            r(24, 7, 2, 1, '#ff9eb5');
            r(10, 7, 12, 11, SKIN);
            r(10, 7, 12, 2, '#7a4a2a');
            r(13, 9, 3, 1, '#7a4a2a');
            r(12, 11, 2, 2, '#111111');
            r(18, 11, 2, 2, '#111111');
            r(11, 14, 2, 1, '#ff9eb5');
            r(19, 14, 2, 1, '#ff9eb5');
            r(14, 15, 4, 1, '#a04030');
            r(8, 19, 16, 13, white);
            r(9, 22, 4, 4, spot);
            r(19, 25, 3, 3, spot);
            r(11, 29, 3, 2, spot);
            // カウベル
            r(15, 19, 2, 1, '#7a5a20');
            r(14, 20, 4, 4, '#ffd23a');
            r(13, 23, 6, 1, '#a07a10');
            r(15, 24, 2, 1, '#a07a10');
            r(5, 20 + up, 3, 10, white);
            r(24, 20 + up, 3, 10, white);
            r(5, 23 + up, 3, 2, spot);
            r(5, 30 + up, 3, 2, SKIN);
            r(24, 30 + up, 3, 2, SKIN);
            r(10, 32, 5, 6, '#3a5a8a');
            r(17, 32, 5, 6, '#3a5a8a');
            r(9, 37, 7, 2, '#4a3020');
            r(16, 37, 7, 2, '#4a3020');
        }
    },

    // ----- チームASK-3 -----
    // Mr.KOTANI: 7:3分けの黒髪・眼鏡・グレーのスーツ・赤い蝶ネクタイ・クリップボード (チームの頭脳)
    kotani: {
        w: 32, h: 40,
        draw(r, frame) {
            const up = frame ? -1 : 0;
            const suit = '#6a6e78', suitDark = '#555962';
            r(10, 1, 12, 5, '#2a2a2a');
            r(10, 3, 3, 5, '#2a2a2a');
            r(14, 1, 1, 3, '#4a4a4a');
            r(10, 6, 12, 12, SKIN);
            r(13, 6, 9, 1, '#2a2a2a');
            r(11, 9, 4, 3, '#222222');
            r(17, 9, 4, 3, '#222222');
            r(15, 10, 2, 1, '#222222');
            r(12, 10, 2, 1, '#bfe6f5');
            r(18, 10, 2, 1, '#bfe6f5');
            r(15, 13, 2, 2, '#d8a880');
            r(13, 15, 6, 1, '#a04030');
            r(14, 18, 4, 2, SKIN);
            r(8, 20, 16, 12, suit);
            r(14, 20, 4, 10, '#ffffff');
            r(12, 20, 2, 7, suitDark);
            r(18, 20, 2, 7, suitDark);
            r(13, 20, 2, 2, '#c02030');
            r(17, 20, 2, 2, '#c02030');
            r(15, 20, 2, 2, '#e02838');
            // クリップボードを持つ左腕
            r(4, 21 + up, 4, 9, suit);
            r(1, 24 + up, 7, 9, '#8a5a2a');
            r(2, 25 + up, 5, 7, '#ffffff');
            r(3, 24 + up, 3, 1, '#c0c0c0');
            r(3, 27 + up, 3, 1, '#888888');
            r(3, 29 + up, 3, 1, '#888888');
            r(3, 31 + up, 2, 1, '#888888');
            r(24, 21, 3, 9, suit);
            r(24, 30, 3, 2, SKIN);
            r(10, 32, 5, 6, '#3a3e48');
            r(17, 32, 5, 6, '#3a3e48');
            r(9, 37, 7, 2, '#151515');
            r(16, 37, 7, 2, '#151515');
        }
    },

    // KING.ASAHARA: ASK-3 のリーダー。金の王冠・サングラス・口ひげ・白い毛皮の襟の赤いマント・王笏
    asahara: {
        w: 36, h: 44,
        draw(r, frame) {
            const up = frame ? -1 : 0;
            const cape = '#a01828', capeDark = '#801020';
            r(6, 18, 24, 24, cape);
            r(5, 22, 2, 18, capeDark);
            r(29, 22, 2, 18, capeDark);
            r(12, 0, 2, 3, '#ffd700');
            r(17, 0, 2, 3, '#ffd700');
            r(22, 0, 2, 3, '#ffd700');
            r(12, 2, 12, 4, '#ffd700');
            r(14, 3, 2, 2, '#e02040');
            r(20, 3, 2, 2, '#2060e0');
            r(12, 5, 12, 1, '#b8860b');
            r(11, 6, 14, 3, '#2a1a10');
            r(11, 8, 14, 11, SKIN);
            r(11, 11, 14, 3, '#111111');
            r(13, 11, 3, 1, '#5a5a5a');
            r(20, 11, 3, 1, '#5a5a5a');
            r(17, 14, 2, 2, '#d8a880');
            r(14, 16, 8, 1, '#2a1a10');
            r(13, 15, 2, 1, '#2a1a10');
            r(21, 15, 2, 1, '#2a1a10');
            r(16, 17, 4, 1, '#a04030');
            r(8, 19, 20, 3, '#ffffff');
            [10, 14, 18, 22, 25].forEach(x => r(x, 20, 1, 1, '#111111'));
            r(11, 22, 14, 12, '#1a1a22');
            [24, 27, 30].forEach(y => r(17, y, 2, 2, '#ffd700'));
            r(7, 22, 4, 10, cape);
            r(7, 32, 4, 2, SKIN);
            r(25, 22 + up, 4, 8, cape);
            r(25, 30 + up, 4, 2, SKIN);
            // 王笏
            r(28, 14 + up, 2, 20, '#ffd700');
            r(27, 10 + up, 4, 4, '#e02040');
            r(28, 11 + up, 1, 1, '#ff9090');
            r(12, 34, 5, 7, '#1a1a22');
            r(19, 34, 5, 7, '#1a1a22');
            r(11, 41, 7, 3, '#ffd700');
            r(18, 41, 7, 3, '#ffd700');
        }
    },

    // ----- チームお願いマッスル -----
    // マッスルウエノーブル: 筋肉の貴族。シルクハット・片眼鏡・カールした口ひげ・裸の上半身に赤いたすき・白いパンツ。力こぶのポーズ
    ueno: {
        w: 40, h: 46,
        draw(r, frame) {
            const up = frame ? -1 : 0;
            const tan = '#d89a6a', tanDark = '#b87a4a';
            r(14, 0, 12, 7, '#151515');
            r(14, 5, 12, 1, '#a01828');
            r(11, 7, 18, 2, '#151515');
            r(14, 9, 12, 11, tan);
            r(16, 12, 2, 2, '#111111');
            // 片眼鏡と鎖
            r(21, 11, 4, 4, '#ffd700');
            r(22, 12, 2, 2, '#bfe6f5');
            r(24, 15, 1, 5, '#ffd700');
            r(19, 15, 2, 2, tanDark);
            r(15, 17, 10, 1, '#3a2010');
            r(14, 16, 2, 1, '#3a2010');
            r(24, 16, 2, 1, '#3a2010');
            r(18, 19, 4, 1, '#7a2a1a');
            r(17, 20, 6, 2, tan);
            r(8, 22, 24, 14, tan);
            r(10, 24, 9, 4, tanDark);
            r(21, 24, 9, 4, tanDark);
            r(19, 24, 2, 11, tanDark);
            [30, 33].forEach(y => {
                r(14, y, 4, 1, tanDark);
                r(22, y, 4, 1, tanDark);
            });
            for (let i = 0; i < 12; i++) r(9 + i * 2, 22 + i, 3, 2, '#c02030');
            // 力こぶ
            r(2, 14 + up, 6, 14, tan);
            r(32, 14 + up, 6, 14, tan);
            r(3, 15 + up, 4, 4, tanDark);
            r(33, 15 + up, 4, 4, tanDark);
            r(2, 10 + up, 5, 4, tan);
            r(33, 10 + up, 5, 4, tan);
            r(11, 36, 8, 7, '#f4f4f4');
            r(21, 36, 8, 7, '#f4f4f4');
            r(11, 36, 18, 2, '#ffd700');
            r(10, 43, 9, 3, '#151515');
            r(21, 43, 9, 3, '#151515');
        }
    },

    // イケキム: 銀髪をかき上げたイケメン。黒い革ジャン・白T・銀のネックレス・キラッと光る
    ikekimu: {
        w: 32, h: 40,
        draw(r, frame) {
            const up = frame ? -1 : 0;
            const hair = '#d8dce8', jacket = '#1c1c22', jacketLight = '#2c2c34';
            r(9, 1, 15, 4, hair);
            r(20, 0, 6, 3, hair);
            r(9, 4, 3, 6, hair);
            r(12, 2, 6, 1, '#ffffff');
            r(11, 5, 11, 13, SKIN);
            r(11, 5, 11, 2, hair);
            r(13, 9, 3, 1, '#555555');
            r(18, 9, 3, 1, '#555555');
            r(13, 10, 3, 1, '#111111');
            r(18, 10, 3, 1, '#111111');
            r(16, 12, 1, 3, '#d8a880');
            r(14, 16, 5, 1, '#a04030');
            r(18, 15, 1, 1, '#a04030');
            r(14, 18, 4, 2, SKIN);
            r(8, 20, 16, 12, jacket);
            r(13, 20, 6, 11, '#ffffff');
            r(12, 20, 2, 9, jacketLight);
            r(18, 20, 2, 9, jacketLight);
            r(14, 22, 4, 1, '#c0c0c0');
            r(15, 23, 2, 1, '#c0c0c0');
            r(5, 21, 3, 10, jacket);
            r(5, 31, 3, 2, SKIN);
            // 右手は髪をかき上げる
            r(24, 14 + up, 3, 8, jacket);
            r(24, 20, 3, 2, jacket);
            r(23, 10 + up, 4, 4, SKIN);
            // キラッ
            const s = frame ? '#ffffff' : '#fff6a0';
            r(28, 2, 1, 5, s);
            r(26, 4, 5, 1, s);
            r(10, 32, 5, 6, '#2a3a5a');
            r(17, 32, 5, 6, '#2a3a5a');
            r(9, 37, 7, 2, '#e8e8e8');
            r(16, 37, 7, 2, '#e8e8e8');
        }
    },

    // ----- 摩天楼に住み着いた敵 (弱い順) -----
    // ハリー: 紫のトゲトゲのハリネズミ。いちばん弱い
    harry: {
        w: 24, h: 20,
        draw(r, frame) {
            const up = frame ? -1 : 0;
            const spike = '#6a3aa0', spikeDark = '#4a2280';
            [[2, 6], [5, 3], [9, 1], [13, 1], [17, 3], [20, 6]].forEach(([x, y]) => {
                r(x, y + up, 2, 4, spikeDark);
                r(x, y + 1 + up, 1, 2, spike);
            });
            r(2, 7, 20, 9, spike);
            r(1, 10, 2, 5, spikeDark);
            r(21, 10, 2, 5, spikeDark);
            r(6, 9, 12, 8, '#f0d8b0');
            r(8, 10, 3, 3, '#ffffff');
            r(13, 10, 3, 3, '#ffffff');
            r(9, 11, 2, 2, '#111111');
            r(14, 11, 2, 2, '#111111');
            r(11, 13, 2, 1, '#2a1a10');
            r(10, 15, 4, 1, '#a03030');
            r(4, 17, 5, 3, '#d0a070');
            r(15, 17, 5, 3, '#d0a070');
        }
    },

    // 浦の島重蔵: 白ひげのおじいさん。亀の甲羅を背負い、煙の出る玉手箱を持つ。青い着物
    urashima: {
        w: 32, h: 40,
        draw(r, frame) {
            const up = frame ? -1 : 0;
            const shell = '#3a7a3a', shellLight = '#5aa05a', kimono = '#2a5aa0';
            r(4, 18, 24, 16, shell);
            [[6, 20], [14, 19], [21, 20], [8, 26], [18, 26]].forEach(([x, y]) => r(x, y, 5, 5, shellLight));
            r(9, 18, 14, 15, kimono);
            r(15, 18, 2, 15, '#e8e0c0');
            r(9, 27, 14, 2, '#c8a040');
            r(6, 22 + up, 3, 8, kimono);
            r(23, 22, 3, 8, kimono);
            r(23, 30, 3, 2, SKIN);
            // 玉手箱と煙
            r(2, 27 + up, 8, 6, '#c02030');
            r(2, 27 + up, 8, 1, '#ffd700');
            r(5, 29 + up, 2, 2, '#ffd700');
            r(3, 23 + up, 3, 3, '#d8d8e8');
            r(5, 20 + up, 3, 3, '#e4e4f0');
            r(3, 17 + up, 2, 2, '#c8c8d8');
            r(10, 3, 12, 12, SKIN);
            r(12, 3, 6, 1, '#ffe8d0');
            r(9, 5, 2, 6, '#f4f4f4');
            r(21, 5, 2, 6, '#f4f4f4');
            r(12, 8, 3, 1, '#f4f4f4');
            r(17, 8, 3, 1, '#f4f4f4');
            r(13, 9, 2, 1, '#111111');
            r(18, 9, 2, 1, '#111111');
            r(15, 10, 2, 2, '#d8a880');
            r(11, 12, 10, 6, '#f4f4f4');
            r(13, 18, 6, 3, '#f4f4f4');
            r(15, 21, 2, 2, '#e0e0e0');
            r(14, 13, 4, 1, '#a04030');
            r(11, 33, 4, 5, SKIN);
            r(17, 33, 4, 5, SKIN);
            r(10, 38, 6, 2, '#8a5a2a');
            r(16, 38, 6, 2, '#8a5a2a');
        }
    },

    // マキビコンMk-4: 銀色のロボット。赤いバイザー・アンテナ・胸に「MK4」・左腕はドリル
    makibikon: {
        w: 34, h: 44,
        draw(r, frame) {
            const up = frame ? -1 : 0;
            const metal = '#a8b0bc', metalDark = '#6a7280', metalLight = '#dce2ea';
            r(16, 1, 2, 3, metalDark);
            r(15, 0, 4, 2, frame ? '#ff9090' : '#ff3030');
            r(9, 4, 16, 12, metal);
            r(9, 4, 16, 2, metalLight);
            r(7, 7, 2, 6, metalDark);
            r(25, 7, 2, 6, metalDark);
            r(11, 8, 12, 4, '#151a22');
            r(12, 9, 10, 2, '#ff2030');
            r(13, 9, 3, 1, '#ff9090');
            r(13, 13, 8, 2, metalDark);
            [14, 16, 18, 20].forEach(x => r(x, 13, 1, 2, '#151a22'));
            r(14, 16, 6, 2, metalDark);
            r(7, 18, 20, 15, metal);
            r(7, 18, 20, 2, metalLight);
            r(10, 21, 14, 9, metalDark);
            r(11, 22, 12, 7, '#ffd23a');
            glyphText(r, 'MK4', 12, 23, '#1a1a1a');
            r(3, 19 + up, 4, 10, metalDark);
            r(27, 19 + up, 4, 10, metalDark);
            // ドリル (左) とつめ (右)
            r(2, 29 + up, 6, 2, '#c0c8d0');
            r(3, 31 + up, 4, 2, '#c0c8d0');
            r(4, 33 + up, 2, 2, '#c0c8d0');
            r(3, 30 + up, 1, 1, '#6a7280');
            r(5, 32 + up, 1, 1, '#6a7280');
            r(26, 29 + up, 2, 4, metalDark);
            r(30, 29 + up, 2, 4, metalDark);
            r(10, 33, 5, 8, metalDark);
            r(19, 33, 5, 8, metalDark);
            r(8, 41, 9, 3, '#4a525e');
            r(17, 41, 9, 3, '#4a525e');
        }
    },

    // 奈架多ドラゴン: 緑のドラゴン。翼・角・背中のトゲ・クリーム色のおなか
    nakata: {
        w: 48, h: 44,
        draw(r, frame) {
            const up = frame ? -1 : 0;
            const body = '#2a9a7a', dark = '#1a6a54', light = '#6ad8b0', belly = '#f0d890';
            // 翼 (付け根から左上へ広がる)
            for (let x = 3; x <= 16; x++) {
                const top = Math.round(2 + (x - 3) * 0.6) + up;
                const bottom = Math.round(22 - (16 - x) * 0.5);
                r(x, top, 1, bottom - top, x % 4 === 0 ? '#3a3a5a' : dark);
            }
            r(3, 2 + up, 14, 1, light);
            r(4, 26, 12, 4, body);
            r(1, 23, 3, 5, body);
            r(0, 21, 2, 3, dark);
            r(14, 14, 22, 20, body);
            [16, 20, 24, 28].forEach(x => r(x, 11, 3, 3, dark));
            r(18, 18, 12, 14, belly);
            [21, 25, 29].forEach(y => r(18, y, 12, 1, '#c8b060'));
            r(30, 4, 14, 12, body);
            r(32, 1, 2, 4, '#f0e0a0');
            r(39, 1, 2, 4, '#f0e0a0');
            r(36, 7, 3, 3, '#ffe040');
            r(37, 7, 1, 3, '#111111');
            r(42, 9, 6, 6, body);
            r(46, 10, 1, 1, '#111111');
            r(40, 14, 8, 1, dark);
            r(41, 15, 6, 1, '#ffffff');
            r(31, 5, 4, 2, light);
            r(16, 34, 6, 8, dark);
            r(28, 34, 6, 8, dark);
            r(15, 42, 8, 2, '#f0e0a0');
            r(27, 42, 8, 2, '#f0e0a0');
        }
    },

    // ----- ASO四天王 -----
    // ダイシ (22階): お坊さん。剃った頭・額の白毫・オレンジの衣に金の袈裟・大きな数珠・錫杖
    daishi: {
        w: 36, h: 46,
        draw(r, frame) {
            const up = frame ? -1 : 0;
            const robe = '#e07a20', robeDark = '#b05a10';
            r(9, 16, 18, 24, robe);
            r(9, 16, 3, 24, robeDark);
            for (let i = 0; i < 11; i++) r(11 + i, 17 + i * 2, 4, 2, '#ffd040');
            r(6, 17, 4, 14, robe);
            r(26, 17, 4, 14, robe);
            r(16, 22, 4, 6, SKIN);
            r(17, 21, 2, 1, SKIN);
            // 錫杖
            r(4, 4 + up, 2, 40, '#8a6a3a');
            r(1, 0 + up, 8, 2, '#d8b040');
            r(1, 0 + up, 2, 6, '#d8b040');
            r(7, 0 + up, 2, 6, '#d8b040');
            r(2, 6 + up, 1, 2, '#d8b040');
            r(7, 6 + up, 1, 2, '#d8b040');
            r(12, 2, 12, 13, SKIN);
            r(13, 2, 6, 2, '#ffe8d0');
            r(11, 8, 1, 3, SKIN);
            r(24, 8, 1, 3, SKIN);
            r(17, 5, 2, 1, '#c04040');
            r(14, 7, 3, 1, '#2a1a10');
            r(19, 7, 3, 1, '#2a1a10');
            r(17, 9, 2, 2, '#d8a880');
            r(15, 12, 6, 1, '#a04030');
            [[11, 15], [13, 17], [15, 18], [17, 19], [19, 18], [21, 17], [23, 15]].forEach(([x, y]) => {
                r(x, y, 2, 2, '#4a2a10');
                r(x, y, 1, 1, '#8a5a30');
            });
            r(12, 40, 5, 3, SKIN);
            r(19, 40, 5, 3, SKIN);
            r(11, 43, 7, 3, '#8a5a2a');
            r(18, 43, 7, 3, '#8a5a2a');
        }
    },

    // ズミタニ (33階): 忍者。紺の装束・額当て・なびく赤いマフラー・両手にクナイ
    zumitani: {
        w: 36, h: 46,
        draw(r, frame) {
            const up = frame ? -1 : 0;
            const navy = '#1e2a5a', navyDark = '#141c40';
            r(22, 14, 10 + (frame ? 2 : 0), 3, '#d02030');
            r(28, 17, 6, 2, '#b01828');
            r(11, 2, 14, 14, navy);
            r(11, 4, 14, 2, '#c0c8d8');
            r(16, 4, 4, 2, '#9aa4b8');
            r(24, 3, 5, 1, '#c0c8d8');
            r(24, 5, 4, 1, '#c0c8d8');
            r(13, 7, 10, 4, SKIN);
            r(14, 8, 3, 2, '#111111');
            r(19, 8, 3, 2, '#111111');
            r(15, 8, 1, 1, '#ffffff');
            r(20, 8, 1, 1, '#ffffff');
            r(12, 15, 12, 3, '#d02030');
            r(10, 18, 16, 14, navy);
            r(10, 24, 16, 2, navyDark);
            r(10, 30, 16, 2, '#4a3a2a');
            r(6, 18 + up, 4, 11, navy);
            r(26, 18 + up, 4, 11, navy);
            r(6, 29 + up, 4, 2, SKIN);
            r(26, 29 + up, 4, 2, SKIN);
            r(7, 31 + up, 2, 6, '#c0c8d8');
            r(27, 31 + up, 2, 6, '#c0c8d8');
            r(7, 31 + up, 1, 5, '#ffffff');
            r(27, 31 + up, 1, 5, '#ffffff');
            r(11, 32, 6, 9, navy);
            r(19, 32, 6, 9, navy);
            r(11, 37, 6, 3, '#e8e8e8');
            r(19, 37, 6, 3, '#e8e8e8');
            r(10, 41, 8, 3, navyDark);
            r(18, 41, 8, 3, navyDark);
        }
    },

    // ルナヤ (44階): 月の魔女。三日月のついた紫のとんがり帽子・銀の長い髪・星のドレス・三日月の杖
    runaya: {
        w: 36, h: 50,
        draw(r, frame) {
            const up = frame ? -1 : 0;
            const purple = '#6a3ab0', purpleDark = '#4a2280', hair = '#d8dcf0', moon = '#ffe680';
            r(10, 12, 16, 22, hair);
            r(15, 0, 4, 3, purple);
            r(13, 3, 8, 4, purple);
            r(11, 7, 14, 3, purple);
            r(7, 10, 22, 2, purpleDark);
            r(17, 4, 2, 3, moon);
            r(16, 5, 1, 1, moon);
            r(13, 12, 10, 10, SKIN);
            r(13, 12, 10, 2, hair);
            r(14, 15, 3, 2, '#6a30c0');
            r(19, 15, 3, 2, '#6a30c0');
            r(15, 15, 1, 1, '#ffffff');
            r(20, 15, 1, 1, '#ffffff');
            r(17, 18, 2, 1, '#d8a880');
            r(16, 20, 4, 1, '#c03060');
            r(12, 22, 12, 18, purple);
            r(10, 32, 16, 10, purple);
            r(8, 38, 20, 6, purpleDark);
            r(16, 22, 4, 2, moon);
            [[13, 34], [21, 36], [17, 40], [11, 41], [24, 41]].forEach(([x, y]) => r(x, y, 1, 1, moon));
            r(9, 23, 3, 10, purple);
            r(9, 33, 3, 2, SKIN);
            r(24, 23 + up, 3, 10, purple);
            r(24, 33 + up, 3, 2, SKIN);
            // 三日月の杖
            r(28, 7 + up, 2, 40, '#8a8aa0');
            r(26, 1 + up, 2, 6, moon);
            r(27, 0 + up, 4, 1, moon);
            r(27, 7 + up, 4, 1, moon);
            r(12, 44, 5, 3, '#2a1a3a');
            r(19, 44, 5, 3, '#2a1a3a');
        }
    },

    // ノゾエマ (55階): 鎧武者。金の鍬形の兜・赤い面頬・黒と赤の鎧・刀
    nozoema: {
        w: 40, h: 50,
        draw(r, frame) {
            const up = frame ? -1 : 0;
            const armor = '#2a2a32', red = '#b01828', gold = '#d8b040';
            r(10, 0, 2, 6, gold);
            r(28, 0, 2, 6, gold);
            r(12, 4, 2, 3, gold);
            r(26, 4, 2, 3, gold);
            r(12, 6, 16, 6, armor);
            r(19, 6, 2, 3, gold);
            r(10, 10, 20, 3, armor);
            r(8, 12, 4, 4, armor);
            r(28, 12, 4, 4, armor);
            r(13, 12, 14, 9, red);
            r(15, 14, 3, 2, '#ffe040');
            r(22, 14, 3, 2, '#ffe040');
            r(16, 14, 1, 2, '#111111');
            r(23, 14, 1, 2, '#111111');
            r(16, 18, 8, 1, '#f4f4f4');
            r(10, 21, 20, 16, armor);
            [23, 27, 31].forEach(y => r(10, y, 20, 1, red));
            r(4, 21, 7, 8, red);
            r(29, 21, 7, 8, red);
            r(4, 24, 7, 1, armor);
            r(29, 24, 7, 1, armor);
            r(6, 29, 4, 8, armor);
            r(30, 29, 4, 8, armor);
            r(6, 37, 4, 2, SKIN);
            r(30, 37, 4, 2, SKIN);
            // 刀 (右手から斜め上へ)
            r(30, 36, 3, 3, '#3a2010');
            r(29, 35, 5, 1, gold);
            for (let i = 0; i < 14; i++) r(Math.round(31 + i * 0.55), 34 - i * 2 + up, 2, 2, '#e0e8f0');
            r(10, 37, 20, 5, red);
            r(10, 37, 20, 1, gold);
            [13, 18, 23].forEach(x => r(x, 37, 1, 5, armor));
            r(12, 42, 6, 5, armor);
            r(22, 42, 6, 5, armor);
            r(11, 47, 8, 3, '#151515');
            r(21, 47, 8, 3, '#151515');
        }
    },

    // 大魔王ASO (56階): 阿蘇山の魔王。頭が火口になっていて溶岩と煙が出る・岩の体に溶岩のひび・黒いマント・胸に「ASO」の紋章
    maou: {
        w: 64, h: 64,
        draw(r, frame) {
            const up = frame ? -1 : 0;
            const rock = '#3a2a2a', rockDark = '#241818', lava = '#ff5a1a', lavaLight = '#ffc040', gold = '#ffd700';
            r(4, 22, 56, 40, '#1a0a14');
            r(4, 22, 56, 2, '#5a1030');
            r(2, 26, 3, 34, '#3a0a20');
            r(59, 26, 3, 34, '#3a0a20');
            // 煙
            r(24, 0 + up, 4, 3, '#6a6a72');
            r(30, 1 - up, 5, 3, '#7a7a82');
            r(36, 0 + up, 4, 3, '#6a6a72');
            // 火口の頭
            for (let y = 4; y < 12; y++) {
                const half = 8 + (y - 4);
                r(32 - half, y, half * 2, 1, rockDark);
            }
            r(26, 4, 12, 2, lava);
            r(28, 5, 8, 1, lavaLight);
            r(25, 6, 2, 5, lava);
            r(37, 6, 2, 4, lava);
            r(12, 6, 4, 10, '#d8c8a0');
            r(10, 4, 4, 4, '#d8c8a0');
            r(48, 6, 4, 10, '#d8c8a0');
            r(50, 4, 4, 4, '#d8c8a0');
            r(18, 12, 28, 18, rock);
            r(14, 14, 4, 3, '#d8c8a0');
            r(46, 14, 4, 3, '#d8c8a0');
            r(21, 15, 9, 1, '#000000');
            r(34, 15, 9, 1, '#000000');
            r(22, 17, 7, 3, lava);
            r(35, 17, 7, 3, lava);
            r(24, 18, 3, 1, frame ? '#ffffff' : lavaLight);
            r(37, 18, 3, 1, frame ? '#ffffff' : lavaLight);
            r(20, 21, 1, 5, lava);
            r(43, 20, 1, 6, lava);
            r(31, 12, 1, 3, lava);
            r(24, 24, 16, 4, '#1a0808');
            r(25, 24, 2, 3, '#ffffff');
            r(37, 24, 2, 3, '#ffffff');
            r(28, 26, 8, 1, lava);
            r(16, 30, 32, 22, rockDark);
            r(18, 30, 28, 2, rock);
            r(10, 28, 8, 6, gold);
            r(46, 28, 8, 6, gold);
            r(10, 25, 2, 3, gold);
            r(52, 25, 2, 3, gold);
            r(24, 34, 16, 9, gold);
            r(25, 35, 14, 7, '#7a1010');
            glyphText(r, 'ASO', 27, 36, gold);
            r(8, 34 + up, 8, 16, rock);
            r(48, 34 + up, 8, 16, rock);
            r(11, 38 + up, 1, 8, lava);
            r(52, 38 + up, 1, 8, lava);
            r(8, 50 + up, 8, 3, rockDark);
            r(48, 50 + up, 8, 3, rockDark);
            r(20, 52, 9, 9, rock);
            r(35, 52, 9, 9, rock);
            r(18, 60, 13, 4, rockDark);
            r(33, 60, 13, 4, rockDark);
        }
    }
};

// 絵の一覧 (id → 絵)
export const ART = {
    koori: stringArt('koori', 'walk1', 'walk2'),
    kooriDown: stringArt('koori', 'down', 'down'),
    tomoishi: stringArt('tomoishi', 'idle', 'shout'),
    furukawa: stringArt('furukawa', 'idle', 'talk'),
    ...LEGACY,
    ...NEW_ART
};

// キャラクターの一覧 (書類と演出で使う名前・所属)。order は書類に並べる順
export const CHARACTERS = [
    { id: 'koori', name: 'こおりくん', group: 'ばりきつよめ', origin: '前作' },
    { id: 'onioni', name: 'おにおに', group: 'ばりきつよめ', origin: '前作' },
    { id: 'yasu', name: 'やすさん', group: 'ばりきつよめ', origin: '前作' },
    { id: 'tamu', name: 'たむさん', group: 'ばりきつよめ', origin: '前作' },
    { id: 'dake', name: 'だけさん', group: 'ばりきつよめ', origin: '前作' },
    { id: 'furukawa', name: 'ふるカワ', group: 'ナビ', origin: '前作' },
    { id: 'tomoishi', name: 'ともいし', group: 'ナビ', origin: '前作' },
    { id: 'okagappa', name: 'おかがっぱ', group: 'チーム5DX', origin: '前作' },
    { id: 'hibikimakuri', name: 'ひびきまくり', group: 'チーム5DX', origin: '前作' },
    { id: 'yamamou', name: 'やまもぅ', group: 'チーム5DX', origin: '新' },
    { id: 'sasaki', name: 'Mr.SASAKI', group: 'チームASK-3', origin: '前作' },
    { id: 'kotani', name: 'Mr.KOTANI', group: 'チームASK-3', origin: '新' },
    { id: 'asahara', name: 'KING.ASAHARA', group: 'チームASK-3', origin: '新' },
    { id: 'shibata', name: 'シバター', group: 'チームお願いマッスル', origin: '前作' },
    { id: 'ueno', name: 'マッスルウエノーブル', group: 'チームお願いマッスル', origin: '新' },
    { id: 'ikekimu', name: 'イケキム', group: 'チームお願いマッスル', origin: '新' },
    { id: 'harry', name: 'ハリー', group: '住み着いた敵', origin: '新' },
    { id: 'urashima', name: '浦の島重蔵', group: '住み着いた敵', origin: '新' },
    { id: 'makibikon', name: 'マキビコンMk-4', group: '住み着いた敵', origin: '新' },
    { id: 'nakata', name: '奈架多ドラゴン', group: '住み着いた敵', origin: '新' },
    { id: 'goldDog', name: 'ゴールド金面犬', group: '住み着いた敵', origin: '前作' },
    { id: 'daishi', name: 'ダイシ', group: 'ASO四天王', origin: '新' },
    { id: 'zumitani', name: 'ズミタニ', group: 'ASO四天王', origin: '新' },
    { id: 'runaya', name: 'ルナヤ', group: 'ASO四天王', origin: '新' },
    { id: 'nozoema', name: 'ノゾエマ', group: 'ASO四天王', origin: '新' },
    { id: 'maou', name: '大魔王ASO', group: '大魔王', origin: '新' },
    { id: 'naitei', name: 'シーシャ・ナイテイ・ナイナイ', group: '天国・天井', origin: '前作' },
    { id: 'aruaru', name: 'シーシャ・ナイテイ・アルアル', group: '天国・天井', origin: '前作' }
];

export const characterName = id => (CHARACTERS.find(c => c.id === id) || { name: id }).name;
