// =====================================================================
// 内部処理の数値 (v1.0 たたき台)
// ---------------------------------------------------------------------
// 仕様書 (docs/spec.md = AT機 仕様書 v0.1) で「決定」になっている表はそのまま写している (モード・ゾーン・移行率・
// ボーナス振り分け・ステート・特化ゾーンの表・払い出し・天井・前兆)。
// 【仮】の付いた値は、仕様書で未決のもの (役の出現率・AT 中ベルの当選率・演出の振り分けなど) の たたき台。
// ユーザーの確認で差しかえる。差しかえたら docs/sim_result.md のシミュレーション (npm run sim) をやり直す。
// =====================================================================

export const CONFIG = {
    bet: 3,
    // 払い出し (仕様書 2026-10-21 決定。3枚掛け)。リプレイ・チャンス目は再遊技 (払い出しなし、次のゲームが無料)。
    // 押し順ベルは正解で 15枚、不正解で 0枚 (取りこぼし)。共通ベルは押し順不問で 15枚
    payout: { bell: 15, commonBell: 15, weakCherry: 2, strongCherry: 2, midCherry: 2, weakSuika: 5, strongSuika: 5 },

    // ----- 役の出現率 (1/x)【仮: v1.0 たたき台】-----
    // 状態ごとに3つの表 (どれも同じ役の集合で、ベル・リプレイの確率だけ違う)。
    //   normal: 通常時 / bonus: 疑似ボーナス中 / at: AT 中・特化ゾーン中 (特化ゾーン中も同じ表)
    // レア役の出現率は全表共通。設定差はレア役だけ (設定1を基準に 1段階ごとに rareBoost 分ずつ増える)。
    // bell = 押し順ベル (4択。ナビなしの正解は 1/4)。commonBell = 共通ベル (押し順不問で 15枚。出目は押し順ベルと同じ中段ベル揃い)。
    // 共通ベルは通常時のコイン持ちを 50枚で約 30G にするために入れた新しい役【ユーザー確認待ち】。0 にすると共通ベルなし
    roles: {
        normal: { replay: 7.3, bell: 6.5, commonBell: 40, weakCherry: 80, strongCherry: 250, midCherry: 4000, weakSuika: 100, strongSuika: 300, chance: 200 },
        bonus: { replay: 7.3, bell: 2.5, commonBell: 40, weakCherry: 80, strongCherry: 250, midCherry: 4000, weakSuika: 100, strongSuika: 300, chance: 200 },
        at: { replay: 7.3, bell: 2.7, commonBell: 40, weakCherry: 80, strongCherry: 250, midCherry: 4000, weakSuika: 100, strongSuika: 300, chance: 200 }
    },
    // 設定差: レア役の出現率が設定1を基準に 1段階ごとに +6% (設定6で 1.3倍)【仮】
    rareBoost: 0.06,
    // 強スイカ・チャンス目の出目の振り分け (仕様書: A・B 50%ずつ)
    variants: { strongSuika: ['strongSuikaA', 'strongSuikaB'], chance: ['chanceA', 'chanceB'] },

    // ----- モード (仕様書・決定) -----
    modes: {
        A: { ceiling: 777, zones: { 0: 10, 200: 40, 400: 40, 600: 5, ceiling: 5 } },
        B: { ceiling: 777, zones: { 0: 10, 100: 50, 300: 20, 500: 10, 700: 5, ceiling: 5 } },
        C: { ceiling: 400, zones: { 0: 10, 200: 40, 300: 40, ceiling: 10 } },
        D: { ceiling: 777, zones: { 0: 10, 200: 20, 400: 20, 600: 30, ceiling: 20 } },
        heaven: { ceiling: 777, zones: { 0: 50, 50: 50 } },
        superHeaven: { ceiling: 777, zones: { 0: 100 } }
    },
    // モード移行率 (ボーナス当選時。仕様書・決定)
    modeMove: {
        A: { A: 50, B: 25, C: 10, D: 5, heaven: 9.5, superHeaven: 0.5 },
        B: { B: 50, C: 15, D: 5, heaven: 29, superHeaven: 1 },
        C: { C: 50, D: 5, heaven: 40, superHeaven: 5 },
        D: { heaven: 50, superHeaven: 50 },
        heaven: { A: 20, B: 20, C: 5, D: 5, heaven: 49, superHeaven: 1 },
        superHeaven: { heaven: 20, superHeaven: 80 }
    },
    initialMode: { A: 50, heaven: 50 },
    // ボーナスの振り分け (仕様書・決定)
    bonusSplit: {
        A: { big: 60, reg: 30, epbig: 10 },
        B: { big: 60, reg: 30, epbig: 10 },
        C: { big: 60, reg: 30, epbig: 10 },
        heaven: { big: 60, reg: 30, epbig: 10 },
        D: { big: 50, epbig: 50 },
        superHeaven: { big: 70, reg: 20, epbig: 10 }
    },
    // 前兆の長さ (G)。本前兆・ガセ前兆・ストック放出の前兆とも同じ
    zenchoLength: [30, 40],
    // 強レア役でボーナスに当たらなかったときのガセ前兆 (%)。弱レア役はガセ前兆なし (仕様書 2026-10-21。AT 中も同じ)
    rareGase: { strongCherry: 50, strongSuika: 50, chance: 50 },

    // ----- 内部ステート (仕様書・決定) -----
    // レア役のボーナス当選率 (%。通常時)
    rareBonus: {
        low: { weakCherry: 3, strongCherry: 40, midCherry: 100, weakSuika: 1, strongSuika: 40, chance: 30 },
        high: { weakCherry: 10, strongCherry: 70, midCherry: 100, weakSuika: 5, strongSuika: 70, chance: 50 },
        super: { weakCherry: 40, strongCherry: 100, midCherry: 100, weakSuika: 20, strongSuika: 100, chance: 100 }
    },
    // ステート移行率 (%)。ボーナスに当たらなかったときだけ (通常時・AT 中とも)
    stateUp: {
        low: { weakCherry: 33, strongCherry: 100, weakSuika: 33, strongSuika: 100, chance: 100 },
        high: { weakCherry: 20, strongCherry: 50, weakSuika: 20, strongSuika: 50, chance: 50 }
    },
    // 転落 (ハズレで抽選)。guard: 保障ゲーム数 / fall: 保障のあとの転落率 / zenchoFall: 本前兆中の転落率 (保障に関係なく)
    stateFall: { high: { guard: 10, fall: 10 }, super: { guard: 20, fall: 20 }, zenchoFall: 50 },

    // AT 直撃 (通常時のリプレイのうち。仕様書のたたき台 1/400)
    directRate: 1 / 400,

    // ----- 疑似ボーナス (仕様書) -----
    bonusGames: { big: 50, reg: 20, epbig: 50 },
    // ボーナス中の AT 当選率 (%)。押し順ベル 0.5%・強レア役 50%・中段チェリー 100% は仕様書の条件。
    // 弱チェリー・弱スイカは roles.bonus の出現率で再計算して BIG 約 40%・REG 約 20% に合わせた (共通ベルは AT 抽選なし):
    //   1ゲームあたりの当選率 = 1/2.5×0.5% + 1/80×7% + 1/100×7% + 1/250×50% + 1/300×50% + 1/200×50% + 1/4000×100%
    //                       = 0.0020 + 0.000875 + 0.0007 + 0.0020 + 0.001667 + 0.0025 + 0.00025 = 0.01049 (約 1/95)
    //   BIG (50G): 1 − (1 − 0.01049)^50 = 41.0% / REG (20G): 1 − (1 − 0.01049)^20 = 19.0%
    // AT 中のボーナスでは同じ表で特化ゾーンを抽選する (仕様書: 通常時の AT 抽選と 1対1)
    bonusAt: { bell: 0.5, weakCherry: 7, weakSuika: 7, strongCherry: 50, strongSuika: 50, chance: 50, midCherry: 100 },
    // 1G連 (本前兆中のレア役当選のストック) の種別 (仕様書: BIG 85%・エピソードBIG 15%)
    stockSplit: { big: 85, epbig: 15 },

    // ----- AT (仕様書) -----
    at: {
        games: 50,
        // AT 突入時のステート (仕様書・決定)
        state: { low: 50, high: 40, super: 10 },
        // AT 中の押し順ベルで特化ゾーンに当たる率 (%)。当たったゲームは順押しナビ (当選確定)【仮: たたき台】
        bellTokka: 0.5,
        // AT 中のレア役のボーナス当選率 (%)。仕様書「AT 中のレア役抽選」のボーナスの欄 (ステート別)。
        // 1回の抽選で「ボーナス → 特化ゾーン (tokka.rate) → 直接上乗せ (directAdd)」の順に決める。重複当選なし
        bonusRate: {
            low: { weakCherry: 1.5, strongCherry: 20, midCherry: 50, weakSuika: 0.5, strongSuika: 20, chance: 15 },
            high: { weakCherry: 5, strongCherry: 35, midCherry: 50, weakSuika: 2.5, strongSuika: 35, chance: 25 },
            super: { weakCherry: 20, strongCherry: 50, midCherry: 50, weakSuika: 10, strongSuika: 50, chance: 50 }
        },
        // 直接上乗せ (仕様書のたたき台 v0.1。G: %。0 は上乗せなし = at:miss)。中段チェリーは必ずボーナスか特化ゾーンなので直接上乗せなし
        directAdd: {
            weakCherry: { 0: 50, 10: 40, 20: 9, 30: 0.9, 100: 0.1 },
            weakSuika: { 0: 60, 10: 38, 100: 1, 200: 0.5, 300: 0.5 },
            strongCherry: { 10: 30, 20: 40, 30: 20, 50: 8, 100: 1.5, 200: 0.3, 300: 0.2 },
            strongSuika: { 10: 40, 20: 40, 50: 15, 100: 4, 200: 0.5, 300: 0.3, 500: 0.2 },
            chance: { 10: 40, 20: 35, 30: 20, 100: 4, 200: 0.6, 300: 0.4 }
        }
    },

    // ----- 上乗せ特化ゾーン (仕様書・決定) -----
    tokka: {
        // AT 中・特化ゾーン中のレア役で特化ゾーンに当たる率 (%)。仕様書「AT 中のレア役抽選」の特化ゾーンの欄 (ステート別)
        rate: {
            low: { weakCherry: 1.5, strongCherry: 20, midCherry: 50, weakSuika: 0.5, strongSuika: 20, chance: 15 },
            high: { weakCherry: 5, strongCherry: 35, midCherry: 50, weakSuika: 2.5, strongSuika: 35, chance: 25 },
            super: { weakCherry: 20, strongCherry: 50, midCherry: 50, weakSuika: 10, strongSuika: 50, chance: 50 }
        },
        setGames: 3,
        // 継続率テーブル (突入時に抽選。%: 振り分け)
        contTable: { 0: 80, 50: 15, 60: 3, 70: 1, 80: 1 },
        // 上乗せゲーム数の振り分け (毎ゲーム、停止した役で抽選。G: %)。none はハズレ・ベル (共通ベルも)
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
        guarantee: { strongCherry: 1, strongSuika: 1, chance: 1, midCherry: 2 }
    },

    // ----- 演出の抽選 (期待度に関わるもの。内部処理が決めてイベントで渡す) -----
    show: {
        // 前兆の相手チーム (決定: 期待度 5DX < ASK-3 < お願いマッスル)【振り分けは仮】
        team: { real: { fiveDX: 20, ask3: 35, muscle: 45 }, gase: { fiveDX: 60, ask3: 30, muscle: 10 } },
        // 前兆の最後のバトルの回数【仮】
        rounds: { real: { 1: 20, 2: 30, 3: 50 }, gase: { 1: 60, 2: 30, 3: 10 } },
        // 前兆中のカットイン (1ゲームごとの出やすさと、色の振り分け)【仮】
        cutinRate: 1 / 6,
        cutin: { real: { blue: 30, green: 25, red: 25, gold: 15, rainbow: 5 }, gase: { blue: 60, green: 30, red: 9, gold: 1 } },
        // 「こおりを狙え」カットインの色の振り分け (仕様書のたたき台 v0.1。期待度: 青 約10% < 緑 約25% < 赤 約50% < 金 約80% < 虹 100%)。
        // AT 中のボーナス中の特化ゾーン当選の告知にも同じ表を使う
        nerae: { real: { blue: 6, green: 17, red: 36, gold: 26, rainbow: 15 }, gase: { blue: 36.5, green: 34.5, red: 24.5, gold: 4.5 } },
        // ガセの「狙え」: 非当選ゲームあたりの出やすさ (仕様書のたたき台: AT 当選率 約 1/95 の 1.5倍 = 約 1/63)。出目はハズレのゲームに出す
        neraeGase: 1 / 63,
        // 最後のバトルの PUSH ボタンの色【仮】
        button: { real: { white: 30, blue: 20, red: 30, gold: 15, rainbow: 5 }, gase: { white: 70, blue: 20, red: 9, gold: 1 } },
        // レア役のフラッシュ (第3停止のあと)【仮】
        flash: { weakCherry: 'small', weakSuika: 'small', strongCherry: 'big', strongSuika: 'big', chance: 'big', midCherry: 'rainbow' },
        flashRate: 0.7,
        // 先バレ音 (レバー ON)。レア役のときの鳴りやすさ【仮】
        sakibare: { weakCherry: 0.1, weakSuika: 0.1, strongCherry: 0.35, strongSuika: 0.35, chance: 0.35, midCherry: 1 },
        // 天国のカットイン: 天国にいるときの前兆の始まりに出す率 (仕様書 2026-10-21 決定: 25%) とアルアルの割合【仮】
        heavenCutin: 0.25,
        aruaruShare: 0.3,
        // 天井でアルアルが出る割合 (アルアル = エピソードBIG、ナイナイ = BIG。仕様書の仮 20%)
        tenjoAruaru: 0.2,
        // AT 中のボーナスの相手 (ボーナス開始時に、そのボーナスで特化ゾーンに当たるかを先に決めて、当たるなら win・当たらないなら lose から選ぶ)【仮】
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
