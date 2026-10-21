// =====================================================================
// 内部処理の数値 (仮組)
// ---------------------------------------------------------------------
// 仕様書 (AT機 仕様書 v0.1・2026-10-20 更新版) の表を写したものと、決まっていない値の「仮」。
// 【仮】の付いた値は Claude が置いた仮の値。内部処理の担当が本物を作るときに差しかえる。
// 演出の確認が目的なので、当たりやすさより「動きが見られること」を優先している。
// =====================================================================

export const CONFIG = {
    bet: 3,
    // 払い出し (仕様書 2026-10-21。リプレイ・チャンス目は次のゲームが無料。押し順ベルの取りこぼしは仮組では作っていない)
    payout: { bell: 15, weakCherry: 2, strongCherry: 2, midCherry: 2, weakSuika: 5, strongSuika: 5 },

    // 通常時の役の出現率 (1/x)【仮】。設定差はレア役だけ (仕様書)。設定ごとにレア役が rareBoost 倍ずつ増える
    roles: {
        replay: 7.3,
        bell: 6,
        weakCherry: 80,
        strongCherry: 250,
        midCherry: 4000,
        weakSuika: 100,
        strongSuika: 300,
        chance: 200
    },
    rareBoost: 0.06,
    // 強スイカ・チャンス目の出目の振り分け (仕様書: A・B 50%ずつ)
    variants: { strongSuika: ['strongSuikaA', 'strongSuikaB'], chance: ['chanceA', 'chanceB'] },

    // ----- モード (仕様書) -----
    modes: {
        A: { ceiling: 777, zones: { 0: 10, 200: 40, 400: 40, 600: 5, ceiling: 5 } },
        B: { ceiling: 777, zones: { 0: 10, 100: 50, 300: 20, 500: 10, 700: 5, ceiling: 5 } },
        C: { ceiling: 400, zones: { 0: 10, 200: 40, 300: 40, ceiling: 10 } },
        D: { ceiling: 777, zones: { 0: 10, 200: 20, 400: 20, 600: 30, ceiling: 20 } },
        heaven: { ceiling: 777, zones: { 0: 50, 50: 50 } },
        superHeaven: { ceiling: 777, zones: { 0: 100 } }
    },
    // モード移行率 (ボーナス当選時。仕様書)
    modeMove: {
        A: { A: 50, B: 25, C: 10, D: 5, heaven: 9.5, superHeaven: 0.5 },
        B: { B: 50, C: 15, D: 5, heaven: 29, superHeaven: 1 },
        C: { C: 50, D: 5, heaven: 40, superHeaven: 5 },
        D: { heaven: 50, superHeaven: 50 },
        heaven: { A: 20, B: 20, C: 5, D: 5, heaven: 49, superHeaven: 1 },
        superHeaven: { heaven: 20, superHeaven: 80 }
    },
    initialMode: { A: 50, heaven: 50 },
    // ボーナスの振り分け (仕様書)
    bonusSplit: {
        A: { big: 60, reg: 30, epbig: 10 },
        B: { big: 60, reg: 30, epbig: 10 },
        C: { big: 60, reg: 30, epbig: 10 },
        heaven: { big: 60, reg: 30, epbig: 10 },
        D: { big: 50, epbig: 50 },
        superHeaven: { big: 70, reg: 20, epbig: 10 }
    },
    zenchoLength: [30, 40],
    // 強レア役でボーナスに当たらなかったときのガセ前兆 (%)。弱レア役はガセ前兆なし (仕様書 2026-10-21。AT 中も同じ)
    rareGase: { strongCherry: 50, strongSuika: 50, chance: 50 },

    // ----- 内部ステート (仕様書) -----
    // レア役のボーナス当選率 (%)
    rareBonus: {
        low: { weakCherry: 3, strongCherry: 40, midCherry: 100, weakSuika: 1, strongSuika: 40, chance: 30 },
        high: { weakCherry: 10, strongCherry: 70, midCherry: 100, weakSuika: 5, strongSuika: 70, chance: 50 },
        super: { weakCherry: 40, strongCherry: 100, midCherry: 100, weakSuika: 20, strongSuika: 100, chance: 100 }
    },
    // ステート移行率 (%)。ボーナスに当たらなかったときだけ
    stateUp: {
        low: { weakCherry: 33, strongCherry: 100, weakSuika: 33, strongSuika: 100, chance: 100 },
        high: { weakCherry: 20, strongCherry: 50, weakSuika: 20, strongSuika: 50, chance: 50 }
    },
    // 転落 (ハズレで抽選)。guard: 保障ゲーム数 / fall: 保障のあとの転落率 / zenchoFall: 本前兆中の転落率
    stateFall: { high: { guard: 10, fall: 10 }, super: { guard: 20, fall: 20 }, zenchoFall: 50 },

    // AT直撃 (リプレイのうち)【仮】
    directRate: 1 / 150,

    // ----- 疑似ボーナス (仕様書) -----
    bonusGames: { big: 50, reg: 20, epbig: 50 },
    // ボーナス中の役 (1/x)【仮】と AT 当選率 (%)(仕様書のたたき台)
    bonusRoles: { bell: 2.5, weakCherry: 70, weakSuika: 90, strongCherry: 250, strongSuika: 350, chance: 180, midCherry: 4000 },
    bonusAt: { bell: 0.5, weakCherry: 8, weakSuika: 8, strongCherry: 50, strongSuika: 50, chance: 50, midCherry: 100 },
    stockSplit: { big: 85, epbig: 15 },

    // ----- AT (仮組) -----
    at: {
        games: 50,
        bellRate: 1.6,
        rareRate: 40,
        // AT 中のレア役のボーナス当選率 (%)。仕様書の「AT 中のレア役抽選」の低確の値【仮: ステートは見ない】
        bonusRate: { weakCherry: 1.5, strongCherry: 20, midCherry: 50, weakSuika: 0.5, strongSuika: 20, chance: 15 },
        // 直接上乗せ (仕様書のたたき台 v0.1。G: %。0 は上乗せなし = at:miss)
        directAdd: {
            weakCherry: { 0: 50, 10: 40, 20: 9, 30: 0.9, 100: 0.1 },
            weakSuika: { 0: 60, 10: 38, 100: 1, 200: 0.5, 300: 0.5 },
            strongCherry: { 10: 30, 20: 40, 30: 20, 50: 8, 100: 1.5, 200: 0.3, 300: 0.2 },
            strongSuika: { 10: 40, 20: 40, 50: 15, 100: 4, 200: 0.5, 300: 0.3, 500: 0.2 },
            chance: { 10: 40, 20: 35, 30: 20, 100: 4, 200: 0.6, 300: 0.4 }
        },
        // 押し順ベルで順押しナビ (当選確定) が出る率【仮】。出たら特化ゾーン当選にする
        hotNavRate: 1 / 60
    },

    // ----- 上乗せ特化ゾーン (仕様書。仮組は最小限) -----
    tokka: {
        // AT 中のレア役で特化ゾーンに当たる率 (%)。仕様書の AT 中のレア役抽選の「特化ゾーン」の欄のうち低確の値【仮: ステートは見ない】
        rate: { weakCherry: 1.5, strongCherry: 20, midCherry: 50, weakSuika: 0.5, strongSuika: 20, chance: 15 },
        setGames: 3,
        // 継続率テーブル (突入時に抽選。%: 振り分け)
        contTable: { 0: 80, 50: 15, 60: 3, 70: 1, 80: 1 },
        // 上乗せゲーム数の振り分け (毎ゲーム、停止した役で抽選。G: %)
        addTable: {
            none: { 5: 80, 10: 19.5, 100: 0.5 },
            replay: { 10: 90, 20: 9, 50: 0.5, 100: 0.5 },
            weakCherry: { 10: 50, 20: 40, 30: 8, 50: 1, 100: 0.4, 200: 0.3, 300: 0.3 },
            weakSuika: { 10: 95, 100: 1.5, 200: 1.5, 300: 2 },
            strongCherry: { 20: 40, 30: 20, 50: 30, 100: 8, 200: 1, 300: 1 },
            strongSuika: { 20: 70, 50: 20, 100: 7, 200: 1, 300: 1, 500: 1 },
            chance: { 20: 45, 30: 45, 100: 8, 200: 1, 300: 1 },
            midCherry: { 300: 50, 500: 50 }
        },
        // 継続の特例: 強レア役は次の1セット、中段チェリーは次の2セットの継続が確定
        guarantee: { strongCherry: 1, strongSuika: 1, chance: 1, midCherry: 2 },
        // 特化ゾーン中の役 (1/x)【仮】
        roles: { replay: 7.3, bell: 1.6, rare: 40 }
    },

    // ----- 演出の抽選 (期待度に関わるもの。内部処理が決める) 【仮】 -----
    show: {
        // 前兆の相手チーム (決定: 期待度 5DX < ASK-3 < お願いマッスル)
        team: { real: { fiveDX: 20, ask3: 35, muscle: 45 }, gase: { fiveDX: 60, ask3: 30, muscle: 10 } },
        // 前兆の最後のバトルの回数
        rounds: { real: { 1: 20, 2: 30, 3: 50 }, gase: { 1: 60, 2: 30, 3: 10 } },
        // 前兆中のカットイン (1ゲームごとの出やすさと、色の振り分け)
        cutinRate: 1 / 6,
        cutin: { real: { blue: 30, green: 25, red: 25, gold: 15, rainbow: 5 }, gase: { blue: 60, green: 30, red: 9, gold: 1 } },
        // 最後のバトルの PUSH ボタンの色
        button: { real: { white: 30, blue: 20, red: 30, gold: 15, rainbow: 5 }, gase: { white: 70, blue: 20, red: 9, gold: 1 } },
        // レア役のフラッシュ (第3停止のあと)
        flash: { weakCherry: 'small', weakSuika: 'small', strongCherry: 'big', strongSuika: 'big', chance: 'big', midCherry: 'rainbow' },
        flashRate: 0.7,
        // 先バレ音 (レバー ON)。レア役のときの鳴りやすさ
        sakibare: { weakCherry: 0.1, weakSuika: 0.1, strongCherry: 0.35, strongSuika: 0.35, chance: 0.35, midCherry: 1 },
        // 天国のカットイン: 天国にいるときの前兆の始まりに出す率 (仕様書 2026-10-21) とアルアルの割合【仮】
        heavenCutin: 0.25,
        aruaruShare: 0.3,
        // 天井でアルアルが出る割合 (アルアル = エピソードBIG、ナイナイ = BIG。仕様書の仮 20%)
        tenjoAruaru: 0.2,
        // AT 中のボーナスの相手 (特化ゾーンに当たる見込みが高いほど強い相手)【仮】
        boss: {
            win: { daishi: 10, zumitani: 15, runaya: 20, nozoema: 25, maou: 30 },
            lose: { daishi: 45, zumitani: 30, runaya: 15, nozoema: 8, maou: 2 }
        },
        // AT 終了画面の設定示唆の画像 (設定ごと)【仮】
        hint: {
            1: { team: 80, fiveDX: 12, ask3: 6, muscle: 2 },
            2: { team: 78, fiveDX: 6, ask3: 13, muscle: 3 },
            3: { team: 76, fiveDX: 13, ask3: 6, muscle: 5 },
            4: { team: 70, fiveDX: 6, ask3: 13, muscle: 8, shitenno: 3 },
            5: { team: 66, fiveDX: 12, ask3: 6, muscle: 10, shitenno: 4, maou: 2 },
            6: { team: 60, fiveDX: 6, ask3: 12, muscle: 14, shitenno: 4, maou: 2, all: 2 }
        }
    }
};
