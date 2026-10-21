// =====================================================================
// 内部処理のまとめ (docs/logic_summary.md) を作る
// ---------------------------------------------------------------------
//   node tools/dump-logic.mjs   (npm run dump)
// 内部処理の流れ (このファイルの文章) と、config.js の数値 (読み込んで表にする) を1つの Markdown にする。
// config.js を直したら作り直す。Claude などに「今の内部処理」を渡すときに使う。
// =====================================================================

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CONFIG as C } from '../src/logic/config.js';
import { STRIPS } from '../src/logic/reels.js';
import { SHAPES, LEFT_WINDOW, combosFor } from '../src/logic/reelControl.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const JA = {
    none: 'ハズレ', bell: '押し順ベル', commonBell: '共通ベル', replay: 'リプレイ',
    weakCherry: '弱チェリー', strongCherry: '強チェリー', midCherry: '中段チェリー', weakSuika: '弱スイカ', strongSuika: '強スイカ', chance: 'チャンス目',
    strongSuikaA: '強スイカA', strongSuikaB: '強スイカB', chanceA: 'チャンス目A', chanceB: 'チャンス目B', bellMiss: 'ベルこぼし',
    big: 'BIG', reg: 'REG', epbig: 'エピソードBIG', koori: 'こおりくん揃い', kooriGase: 'ガセ狙え', kooriGaseJun: 'ガセ狙え(順押し)', kooriGaseHasami: 'ガセ狙え(はさみ)', kooriGaseNaka: 'ガセ狙え(中押し)',
    low: '低確', high: '高確', super: '超高確', A: 'A', B: 'B', C: 'C', D: 'D', heaven: '天国', superHeaven: '超天国',
    real: '本物', gase: 'ガセ', win: '当たるボーナス', lose: '当たらないボーナス',
    fiveDX: '5DX', ask3: 'ASK-3', muscle: 'お願いマッスル', team: 'チーム集合', shitenno: '四天王', maou: '大魔王', all: '全員集合(金)',
    daishi: 'だいし', zumitani: 'ずみたに', runaya: 'るなや', nozoema: 'のぞえま',
    blue: '青', green: '緑', red: '赤', gold: '金', rainbow: '虹', white: '白', purple: '紫',
    small: '小', 'big_flash': '大', suika: 'スイカ', cherry: 'チェリー', bar: 'BAR', seven: '7', normal: '通常時', bonus: 'ボーナス中', at: 'AT中・特化ゾーン中'
};
const ja = k => JA[k] ?? k;
const pct = v => `${v}%`;
const ratio = x => (x > 0 ? `1/${x}` : 'なし');

// 行: キー → { 列: 値 } の表
function table(rows, cols, fmt = v => v ?? '–', head = '') {
    const out = [`| ${head} | ${cols.map(ja).join(' | ')} |`, `|---|${cols.map(() => '---').join('|')}|`];
    for (const [name, row] of rows) out.push(`| ${ja(name)} | ${cols.map(c => fmt(row[c])).join(' | ')} |`);
    return out.join('\n');
}
// 1行の振り分け { key: weight } → 表
function dist(obj, fmt = pct) {
    const keys = Object.keys(obj);
    return `| ${keys.map(ja).join(' | ')} |\n|${keys.map(() => '---').join('|')}|\n| ${keys.map(k => fmt(obj[k])).join(' | ')} |`;
}
const uniqKeys = rows => [...new Set(rows.flatMap(([, r]) => Object.keys(r)))];

const roleKeys = Object.keys(C.roles.normal);
const rareKeys = ['weakCherry', 'strongCherry', 'midCherry', 'weakSuika', 'strongSuika', 'chance'];
const states = ['low', 'high', 'super'];
const sum1 = t => Object.values(t).filter(x => x > 0).reduce((a, x) => a + 1 / x, 0);

// ボーナス中の AT 当選率の検算
const pBonus = Object.entries(C.bonusAt).reduce((a, [r, rate]) => a + (1 / C.roles.bonus[r]) * (rate / 100), 0);

const SYM = { suika: 'スイカ', bell: 'ベル', replay: 'リプレイ', cherry: 'チェリー', bar: 'BAR', seven: '7', koori: 'こおりくん' };
const strip = reel => STRIPS[reel].map(x => SYM[x]).join('・');
JA.ceiling = '天井で当たる';

const md = `# 内部処理のまとめ（こおりくんの大冒険～最凶のASO摩天楼への挑戦～）

\`node tools/dump-logic.mjs\` が \`src/logic/config.js\` から作った書類（作成: ${new Date().toISOString().slice(0, 10)}）。
数値は \`config.js\` の値そのもの。流れの説明は \`src/logic/machine.js\` / \`reelControl.js\` のとおり。
仕様書は \`docs/spec.md\`、演出との約束は \`docs/events.md\`、変更履歴は \`docs/CHANGELOG_logic.md\`、シミュレーション結果は \`docs/sim_result.md\`。
【仮】= 仕様書で未決の たたき台（ユーザー確認待ち）。それ以外は仕様書で「決定」の値。

---

## 1. 1ゲームの流れ

1. レバー ON（3枚掛け。リプレイ・チャンス目のあとのゲームは無料）。状態（通常時／ボーナス中／AT 中／特化ゾーン中）の役の表から役を1つ引く。
2. 状態ごとの処理（下の 3〜7 章）。演出の抽選（先バレ音・フラッシュ・カットインの色など）もここで決めて \`notice\` で渡す。
3. 役ごとの出目の形を決め、停止ボタンごとに「押した位置にいちばん近い」位置で止める（8章）。押し順ベルは停止ごとに正解／不正解を判定する。
4. 3つ止まったら入賞と払い出し（2章）。そのあと前兆の終わり・ボーナス当選・特化ゾーンのストック・AT 終了などの処理。

## 2. 役と払い出し

- 入賞ラインは2本：中段（リプレイ・7・7・7＝BIG・7・7・BAR＝REG・こおりくん×3）と右下がり（ベル。左上段・中中段・右下段）。
- チェリー・スイカはラインに関係なく役で払い出す。チャンス目はリプレイ扱い（払い出しなし・次のゲーム無料）。
- 押し順ベルは4択（中左右・中右左・右左中・右中左）。正解で 15枚、不正解で 0枚（取りこぼし。右下がりのベルテンパイハズレ）。順押しナビ（左→中→右）は当選確定のときだけ出て、押し順不問で 15枚。
- 共通ベル【仮・採用するか確認待ち】：押し順不問で 15枚。出目は押し順ベルと同じ。

| 役 | 払い出し（3枚掛け） |
|---|---|
| 押し順ベル（正解） | ${C.payout.bell}枚 |
| 押し順ベル（不正解） | 0枚 |
| 共通ベル | ${C.payout.commonBell}枚 |
| リプレイ・チャンス目 | 再遊技 |
| 弱チェリー・強チェリー・中段チェリー | ${C.payout.weakCherry}枚 |
| 弱スイカ・強スイカ | ${C.payout.weakSuika}枚 |

### 役の出現率（1/x）【仮: v1.0 たたき台】

レア役は全表共通。設定差はレア役だけ（設定1を基準に 1段階ごとに +${C.rareBoost * 100}%。設定6で ×${(1 + C.rareBoost * 5).toFixed(2)}）。共通ベルは 0 にすると無し。

${table(Object.entries(C.roles), roleKeys, ratio, '状態')}

ハズレの率：通常時 ${((1 - sum1(C.roles.normal)) * 100).toFixed(1)}%、ボーナス中 ${((1 - sum1(C.roles.bonus)) * 100).toFixed(1)}%、AT 中 ${((1 - sum1(C.roles.at)) * 100).toFixed(1)}%（設定1）。

強スイカ・チャンス目の出目の振り分け：A / B 50%ずつ。

## 3. 通常時（モード・ゾーン・天井・前兆）

- ボーナス当選時に次のモードを抽選し、そのモードのゾーン表で「どのゾーンで当たるか」を決める。当選G = ゾーンの開始G + 前兆（${C.zenchoLength[0]}〜${C.zenchoLength[1]}G）。
- ゾーンの開始Gに着いたら、当たりでもハズレでも必ず前兆（ガセ前兆 100%）。天井は前兆を逆算して入れ、ぴったり天井Gで当たる。
- 初期モード：${Object.entries(C.initialMode).map(([k, v]) => `${ja(k)} ${v}%`).join('・')}。モード移行とゲーム数のリセットはボーナス当選時だけ（AT 終了時には変えない。AT 直撃時はゲーム数を引き継ぐ）。
- AT 中もゲーム数を数え、ゾーン・天井に着いたら AT 中に前兆が走ってボーナスになる。

### ゾーンの振り分け（ゾーンの開始G: %）と天井

${table(Object.entries(C.modes).map(([k, m]) => [k, { ...m.zones, 天井G: m.ceiling }]), [...uniqKeys(Object.entries(C.modes).map(([k, m]) => [k, m.zones])).filter(k => k !== 'ceiling').sort((a, b) => a - b).map(String), 'ceiling', '天井G'], v => v ?? '–', 'モード')}

（\`ceiling\` = 天井で当たる割合。天国・超天国は天井なし）

### モード移行率（ボーナス当選時）

${table(Object.entries(C.modeMove), ['A', 'B', 'C', 'D', 'heaven', 'superHeaven'], v => (v === undefined ? '0%' : pct(v)), '移行前 → 先')}

### ボーナスの振り分け（当選時のモード）

${table(Object.entries(C.bonusSplit), ['big', 'reg', 'epbig'], v => (v === undefined ? '0%' : pct(v)), 'モード')}

- 天井：ナイナイ（BIG）${(1 - C.show.tenjoAruaru) * 100}%／アルアル（エピソードBIG）${C.show.tenjoAruaru * 100}%【仮】。
- 弱スイカからの当選はモードに関わらずエピソードBIG。

### 前兆

- 本前兆・ガセ前兆とも ${C.zenchoLength[0]}〜${C.zenchoLength[1]}G。ガセ前兆の途中でレア役からボーナスに当たると本前兆に変わる。本前兆中にもう一度当たると 1G連 のストック（種別は BIG ${C.stockSplit.big}%・エピソードBIG ${C.stockSplit.epbig}%）。
- 強レア役（強チェリー・強スイカ・チャンス目）でボーナスに当たらなかったとき ${C.rareGase.strongCherry}% でガセ前兆。弱レア役はガセ前兆なし。AT 中も同じ（特化ゾーン中は前兆を始めない）。
- 前兆の演出【仮】：相手チーム（本物 ${Object.entries(C.show.team.real).map(([k, v]) => `${ja(k)} ${v}%`).join('・')} ／ ガセ ${Object.entries(C.show.team.gase).map(([k, v]) => `${ja(k)} ${v}%`).join('・')}）、最後のバトルの回数（本物 ${Object.entries(C.show.rounds.real).map(([k, v]) => `${k}回 ${v}%`).join('・')} ／ ガセ ${Object.entries(C.show.rounds.gase).map(([k, v]) => `${k}回 ${v}%`).join('・')}）、PUSH ボタンの色（本物 ${Object.entries(C.show.button.real).map(([k, v]) => `${ja(k)} ${v}%`).join('・')} ／ ガセ ${Object.entries(C.show.button.gase).map(([k, v]) => `${ja(k)} ${v}%`).join('・')}）。
- 前兆中のカットイン【仮】：1ゲームごとに 1/${Math.round(1 / C.show.cutinRate)}。色は本物 ${Object.entries(C.show.cutin.real).map(([k, v]) => `${ja(k)} ${v}%`).join('・')} ／ ガセ ${Object.entries(C.show.cutin.gase).map(([k, v]) => `${ja(k)} ${v}%`).join('・')}。
- 天国カットイン：天国・超天国にいるときの前兆の始まりに ${C.show.heavenCutin * 100}%（決定）。アルアル ${C.show.aruaruShare * 100}%・ナイナイ ${(1 - C.show.aruaruShare) * 100}%【仮】。
- AT 直撃：通常時のリプレイの 1/${Math.round(1 / C.directRate)}（前兆中は直撃しない）。出目はチャンス目A。

## 4. 内部ステート（通常時・AT 中・特化ゾーン中で共通）

### レア役のボーナス当選率（通常時）

${table(states.map(s => [s, C.rareBonus[s]]), rareKeys, pct, 'ステート')}

### ステート移行率（ボーナスに当たらなかったときだけ）

${table([['low', { ...C.stateUp.low, 移行先: '高確' }], ['high', { ...C.stateUp.high, 移行先: '超高確' }]], [...rareKeys, '移行先'], v => (v === undefined ? '–（当選確定）' : typeof v === 'number' ? pct(v) : v), 'ステート')}

### 転落（ハズレで抽選）

| ステート | 保障ゲーム数 | 保障のあとの転落率 | 本前兆中 |
|---|---|---|---|
| 高確 | ${C.stateFall.high.guard}G | ハズレの ${C.stateFall.high.fall}% | ハズレの ${C.stateFall.zenchoFall}%（保障に関係なく） |
| 超高確 | ${C.stateFall.super.guard}G | ハズレの ${C.stateFall.super.fall}% | ハズレの ${C.stateFall.zenchoFall}% |

保障が残っているあいだは転落しない（保障 10G なら 11G 目から抽選）。転落時は保障を 0 にして低確へ。
AT 突入時のステート：${Object.entries(C.at.state).map(([k, v]) => `${ja(k)} ${v}%`).join('・')}。

## 5. 疑似ボーナス

| 種別 | 図柄 | ゲーム数 |
|---|---|---|
| BIG | 7・7・7 | ${C.bonusGames.big}G |
| REG | 7・7・BAR | ${C.bonusGames.reg}G |
| エピソードBIG | こおりくん×3 | ${C.bonusGames.epbig}G（AT 確定。AT 中は特化ゾーン確定） |

### ボーナス中の AT 当選率（役ごと。AT 中のボーナスでは同じ表で特化ゾーンを抽選）

${table([['当選率', C.bonusAt]], Object.keys(C.bonusAt), pct, '')}

共通ベルは抽選なし。1ゲームあたりの当選率 = ${(pBonus * 100).toFixed(3)}%（約 1/${(1 / pBonus).toFixed(0)}）→ BIG（${C.bonusGames.big}G）${((1 - (1 - pBonus) ** C.bonusGames.big) * 100).toFixed(1)}%・REG（${C.bonusGames.reg}G）${((1 - (1 - pBonus) ** C.bonusGames.reg) * 100).toFixed(1)}%。

- 当選した役を引いたゲームでは「狙え」を出さず、**次のゲームのレバー**で「こおりを狙え」→ そのゲームでこおりくん揃い（最後のゲームで当選したときだけそのゲーム）。押し順ベルで当選したゲームは順押しナビ（押し順不問で 15枚）。
- ボーナス開始時に全ゲームの役と当落を先に抽選しておき、AT 中のボーナスの相手（四天王・大魔王）を「当たるボーナスか」で選ぶ。
- ガセの「狙え」：ハズレのゲームに、非当選ゲームあたり 1/${Math.round(1 / C.show.neraeGase)}【仮】。出目は押し順で変わる（順押し：中までテンパイして右下段で外す／中押し：中リールのこおりくんが枠下／はさみ押し：右下段で外す）。中段にこおりくんが揃うのは当選のときだけ。
- 1G連：本前兆中のレア役当選をストックし、ボーナス終了時に続けて放出。

### 「こおりを狙え」の色（当選時／ガセ時）

${table([['real', C.show.nerae.real], ['gase', { ...C.show.nerae.gase, rainbow: 0 }]], ['blue', 'green', 'red', 'gold', 'rainbow'], pct, '')}

### AT 中のボーナスの相手【仮】

${table(Object.entries(C.show.boss), ['daishi', 'zumitani', 'runaya', 'nozoema', 'maou'], pct, '')}

## 6. AT

- 初期 ${C.at.games}G・純増 約3枚。AT 中のボーナスはゲーム数据え置き、終了後に AT 再開。AT 中のエピソードBIG は特化ゾーン確定。
- AT 中の押し順ベル：${C.at.bellTokka}%【仮】で特化ゾーン当選 → そのゲームは順押しナビ。
- レア役は1回の抽選で「ボーナス／特化ゾーン／どちらでもない」を決める（重複なし）。どちらでもないときは直接上乗せを抽選（0G = ミス）。弱スイカのボーナスはエピソードBIG。

### AT 中のレア役抽選（ボーナス当選率／特化ゾーン当選率。残りはハズレ）

${table(states.map(s => [s, Object.fromEntries(rareKeys.map(r => [r, `${C.at.bonusRate[s][r]}% / ${C.tokka.rate[s][r]}%`]))]), rareKeys, v => v, 'ステート')}

### 直接上乗せ（どちらにも当たらなかったレア役。G: %）【仕様書のたたき台】

${table(Object.entries(C.at.directAdd).map(([k, t]) => [k, Object.fromEntries(Object.entries(t).map(([g, p]) => [g === '0' ? 'なし' : `${g}G`, p]))]), ['なし', '10G', '20G', '30G', '50G', '100G', '200G', '300G', '500G'], v => (v === undefined ? '–' : pct(v)), '役')}

- 前兆の途中で AT のゲーム数がなくなったら、その場でラストジャッジ（本前兆ならボーナス当選、ガセなら AT 終了）。
- AT 終了時の優先順位：前兆の終わり → 特化ゾーンのストック → ラストジャッジ → 終了。
- AT 終了画面：設定示唆の画像（下）と設定示唆トロフィー（出る率 ${C.show.trophy.rate * 100}%【仮: 前作の値】。設定より上の色は出ない）。

### 設定示唆の画像【仮】

${table(Object.entries(C.show.hint), ['team', 'fiveDX', 'ask3', 'muscle', 'shitenno', 'maou', 'all'], v => (v === undefined ? '–' : pct(v)), '設定')}

### 設定示唆トロフィーの色の重み（出たとき）【仮: 前作の値】

${table(Object.entries(C.show.trophy.weights), ['white', 'blue', 'green', 'purple', 'red', 'rainbow'], v => (v === undefined ? '–' : pct(v)), '設定')}

## 7. 上乗せ特化ゾーン

- 1セット ${C.tokka.setGames}G の自力継続型。3G 以内にリプレイ以上（リプレイかレア役）を引けば次セットへ。引けなくても継続率テーブルで続くことがある（復活）。毎ゲーム最低 5G 上乗せ。
- 継続の特例：強レア役は次の1セット、中段チェリーは次の2セットの継続が確定。
- 特化ゾーン中のレア役も AT 中と同じ表でボーナス／特化ゾーンを抽選。特化ゾーンのストックは終了時に続けて始まる。ボーナスは終了後に前兆（30〜40G）を走らせて当たる（両方あれば特化ゾーンが先）。
- 特化ゾーン中の押し順ベルにもナビあり（順押しナビは出ない）。

### 継続率テーブル（突入時に抽選）

${dist(Object.fromEntries(Object.entries(C.tokka.contTable).map(([k, v]) => [`継続率${k}%`, v])))}

### 上乗せゲーム数の振り分け（毎ゲーム、停止した役で。G: %）

${table(Object.entries(C.tokka.addTable).map(([k, t]) => [k === 'none' ? 'ハズレ・ベル' : k, Object.fromEntries(Object.entries(t).map(([g, p]) => [`${g}G`, p]))]), ['5G', '10G', '20G', '30G', '50G', '100G', '200G', '300G', '500G'], v => (v === undefined ? '–' : pct(v)), '役')}

## 8. リール配列 v1.0 と出目

各 21コマ。番号は上から順、リールは下へ回る（押してから k コマ滑ると上段は k つ前の番号）。

- 左: ${strip(0)}
- 中: ${strip(1)}
- 右: ${strip(2)}

出目の決まり：
- 役ごとに左リールの窓（上段／中段／下段）を決め打ち。左は 7コマ周期の3ブロックなので、押した位置から下方向にいちばん近いブロックで止まる（滑り最大 6コマ）。「チェリー／ベル／リプレイ」の窓はどの役でも使わない。
- 中段以外のライン（上段・下段・右下がり・右上がり）でベル・リプレイ・スイカ・ボーナス図柄が3つ同じにならない（役ごとの許可ラインだけ例外）。中段は入賞以外で3つ同じにしない。ベルの小V はチャンス目A だけ、右下がりスイカテンパイ + 右中段スイカはチャンス目B だけ。
- 当選役は必ず引き込む（取りこぼしなし）。例外は押し順ベルの不正解だけ。

| 形 | 左リールの窓（上／中／下） | ほかの条件 | 作れる組み合わせ |
|---|---|---|---|
${Object.entries(LEFT_WINDOW).map(([k, w]) => `| ${ja(k)} | ${w.map(x => (x === 'bonus' ? 'ボーナス図柄' : ja(x))).join('／')} | ${({
    none: 'どのラインも揃わない', replay: '中段リプレイ揃い', bell: '右下がりベル揃い', bellMiss: '右下がりにベルが2つ（テンパイハズレ）',
    weakCherry: '右中段にリプレイかベル', strongCherry: '右中段にボーナス図柄（中中段はボーナス図柄以外）', midCherry: '右下がりに同じボーナス図柄（中中段・右下段）',
    weakSuika: '右下がりスイカ揃い', strongSuikaA: '上段スイカ揃い', strongSuikaB: '中段スイカ揃い', chanceA: 'ベルの小V（左上・中中・右上）。中段はリプレイ・ベル・リプレイ', chanceB: '右下がりスイカテンパイ + 右中段スイカ、右下段ボーナス図柄'
})[k]} | ${combosFor(k).length} |`).join('\n')}
| BIG / REG / こおりくん揃い | （中段揃い） | 7・7・7 / 7・7・BAR / こおりくん×3 | ${combosFor('big').length} / ${combosFor('reg').length} / ${combosFor('koori').length} |
| ガセ狙え | 押し順で変わる | 順押し: 左中段・中中段こおりくん、右下段こおりくん／中押し: 中リールのこおりくんが枠下、左右は枠下・枠下下／はさみ押し: 左中段こおりくん、右下段こおりくん、中中段はこおりくん以外 | ${combosFor('kooriGaseJun').length} / ${combosFor('kooriGaseNaka').length} / ${combosFor('kooriGaseHasami').length} |

## 9. 演出の抽選で内部処理が決めるもの【仮】

- 先バレ音（レバー）：${Object.entries(C.show.sakibare).map(([k, v]) => `${ja(k)} ${v * 100}%`).join('・')}。AT 直撃は高い音。
- レア役のフラッシュ（第3停止後）：${C.show.flashRate * 100}% で出る（中段チェリーは必ず）。大きさは ${Object.entries(C.show.flash).map(([k, v]) => `${ja(k)}=${v === 'small' ? '小' : v === 'big' ? '大' : '虹'}`).join('・')}。中段チェリーは確定音も。
- カットインの色・PUSH の色・相手チーム・バトル回数・狙えの色・四天王・設定示唆：上の各章。

## 10. 設定差

設定差はレア役の出現率だけ（+${C.rareBoost * 100}%／段）。モード移行率・ボーナス振り分け・天井・AT 中の抽選・特化ゾーンは全設定共通。設定示唆は AT 終了画面の画像とトロフィーだけ。

## 11. シミュレーション（docs/sim_result.md の要点）

設定1で機械割 約 189%、設定6で約 239%。設定3以上は AT がほぼ終わらない（AT 中もゾーン・天井が走ってボーナスがループするため）。数値は直していない（ユーザー判断待ち。候補は \`docs/sim_result.md\` の「気になる点」）。
`;

writeFileSync(join(root, 'docs', 'logic_summary.md'), md);
console.log('docs/logic_summary.md を作りました');
