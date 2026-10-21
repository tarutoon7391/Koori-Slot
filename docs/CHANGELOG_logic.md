# 内部処理（`src/logic/`）の変更履歴

仕様の正本は `docs/spec.md`、演出との約束は `docs/events.md`。ここには内部処理の変更と、`docs/events.md` に足したものを書く。

## v1.0（2026-10-21）仮組 → 本物

演出確認用の仮組を、仕様書 v0.1 に沿った本物の内部処理に差しかえた。構造（`createMachine` / `machine.js` / `config.js` / `reelControl.js` / `reels.js` / `rng.js` / `events.js`）と `createMachine` が返すもの・イベント名は変えていない。

### フェーズ1: 役の出現率と設定差（`config.js`）

- 役の表を状態ごとの3種類にした：`roles.normal`（通常時）／`roles.bonus`（ボーナス中）／`roles.at`（AT 中・特化ゾーン中）。どれも同じ役の集合で、ベル・リプレイの確率だけ違う。`tokka.roles`・`at.bellRate`・`at.rareRate`・`bonusRoles` は廃止。
- レア役の出現率は全表共通。設定差はレア役だけ（`rareBoost`: 設定1を基準に 1段階ごとに +6%。全状態に効く）。
- 共通ベル `commonBell`（押し順不問で 15枚。出目は押し順ベルと同じ中段ベル揃い）を新しく入れた。`config.js` で 0 にすると無し【ユーザー確認待ち】。
- ボーナス中の AT 当選率 `bonusAt` を `roles.bonus` で再計算（弱チェリー・弱スイカ 8% → 7%。1ゲームあたり約 1/95 → BIG 41.0%・REG 19.0%。計算は `config.js` のコメント）。共通ベルは AT 抽選なし。
- AT 直撃 `directRate` を 1/150 → 1/400（リプレイのうち）。
- 「こおりを狙え」の色の振り分け `show.nerae`（当選時／ガセ時。仕様書の表）と、ガセの出やすさ `show.neraeGase`（非当選ゲームの約 1/63）を追加。

### フェーズ2: 押し順ベルの取りこぼし（`reelControl.js` / `machine.js`）

- 押し順ベル成立時に正解の押し順（中左右・中右左・右左中・右中左の4択）を内部で決める。通常時はナビなし（正解 1/4）、AT 中・ボーナス中・特化ゾーン中はナビあり。
- 第1・第2停止までが正解と一致していれば 15枚（中段ベル揃い）、外れた時点で 0枚（新しい形 `bellMiss`：中段にベルが2つ。レア役の形・スイカ揃い・チャンス目と紛れない）。
- `createReelControl` に「停止ごとに形を決め直す」仕組みを足した（形を「押した順から形の名前を返す関数」で渡せる。`bellShape(nav)`・`kooriGaseShape`）。`SHAPES` の判定は `(cols, tops)` で受ける（枠の外の図柄を見るため）。
- 順押しナビ `[0, 1, 2]` は、AT 中・ボーナス中の押し順ベルで内部的に当選したときだけ（AT 中: 特化ゾーン `at.bellTokka` 0.5%【仮】／ボーナス中: AT `bonusAt.bell` 0.5%）。`hotNavRate`（1/60 で勝手に当たる）は廃止。順押しナビのゲームは押し順不問で 15枚。
- `docs/events.md` に足したもの（演出側確認待ち）：`bonus:game` の `nav`、`tokka:game` の `nav`。

### フェーズ3: AT 中のステートと抽選（`machine.js`）

- AT 突入時にステートを抽選（低確 50%・高確 40%・超高確 10%。`at.state`）。保障ゲーム数も通常時と同じ。
- AT 中（特化ゾーン中も）ステート移行 `stateUp` と転落 `stateFall`（本前兆中はハズレの 50%）を動かす。通常時と処理を共通化（`stateAfter`）。保障ゲーム数は「保障が残っているあいだは転落しない」（保障 10G なら 11G 目から転落抽選）。
- AT 中のレア役抽選をステート別の表にした（`at.bonusRate` / `tokka.rate` を low/high/super に拡張。仕様書「AT 中のレア役抽選」）。1回の抽選で「ボーナス／特化ゾーン／どちらでもない（直接上乗せ or ミス）」を決める。

### フェーズ4: 疑似ボーナス（`machine.js` / `reelControl.js`）

- ガセの「こおりを狙え」：ハズレのゲームに非当選ゲームの約 1/63 で `bonus:nerae`（`win: false`）。出目は押し順で変わる新しい形 `kooriGase`（順押し `kooriGaseJun`：中リールまでテンパイして右下段で外す／中押し `kooriGaseNaka`：中リールのこおりくんを枠下に、左右は枠下・枠下下に／はさみ押し `kooriGaseHasami`：右下段で外してテンパイしない。右押しははさみ押しと同じ）。中段にこおりくんが揃うのは当選時だけ。
- AT 中のボーナスの特化ゾーン抽選を、`willWin` / `winAt` の決め打ちから、通常のボーナスと同じ役ごとの抽選（`bonusAt`）にした。
- ボーナス開始時に、そのボーナス中の全ゲームの役と当落を先に抽選しておき（`script`）、「当たるボーナスか」で `show.boss.win / lose` から相手を選ぶ。`debug.setNextRole` で役を差しかえたゲームは、その分だけ当落を抽選し直す。
- AT 中のエピソードBIG は最初のゲームのレバーで `at:boss`（`final: true, win: true`）を出す（`docs/events.md`。演出側確認待ち）。
- 1G連（本前兆中のレア役当選でストック。BIG 85%・エピソードBIG 15%）と天井（ナイナイ 80%・アルアル 20%）は現状どおり。

### フェーズ5: 特化ゾーン中のボーナス抽選とストック放出（`machine.js`）

- 特化ゾーン中のレア役で、AT 中と同じ表で「ボーナス／特化ゾーン」を抽選する。
- 特化ゾーン中に当たったボーナスは `tokkaBonus` として別に持ち、特化ゾーン終了（`tokka:end`）の直後に放出する：特化ゾーンのストックがあれば続けて `tokka:start`、無ければ `zencho:start`（`cause: 'stock'`、本前兆 30〜40G）→ 前兆の終わりでそのボーナスに当選（AT 中のボーナス扱い）。2つ以上当たっていたら残りは 1G連 のストック。
- AT 終了時（残り 0G）の優先順位は現状の `finishAt` のまま：前兆の終わり → 特化ゾーンのストック → ラストジャッジ → `at:end`。

### フェーズ6: 検算とシミュレーション

- `tests/logic.test.js`：振り分け表の合計・リール配列の図柄数・停止形の成立・中段チェリー／強チェリーの条件・ガセ狙えの押し順ごとの条件・押し順ベルの正解／不正解・AT のステート・AT 中の抽選・特化ゾーン中のボーナス・ボーナス中のナビなど 30 件。
- `tools/simulate.js`（`npm run sim`）：設定・ゲーム数・seed を引数に取り、初当たり・AT 初当たり・AT 平均ゲーム数／獲得枚数・特化ゾーン突入率／平均上乗せ・コイン持ち・機械割を出す。結果は `docs/sim_result.md`。

### フェーズ7: Railway の準備

- `vite`・`@vitejs/plugin-react` を `dependencies` に移した。`railway.json` を追加（ビルダーは RAILPACK。NIXPACKS は builder v4 でログなしに失敗した）。`prestart` で `npm run build` が走る。
- `README.md` を Railway 公開向けに書き直した。`play.html` を作り直した。

### 残っている【仮】の値（ユーザー確認待ち）

- 役の出現率（`roles.normal / bonus / at`）と共通ベルの有無（`commonBell`）
- 設定差の大きさ（`rareBoost` +6%／段）
- AT 中の押し順ベルの特化ゾーン当選率（`at.bellTokka` 0.5%）
- ボーナス中の AT 当選率の弱チェリー・弱スイカ（7%。再計算した値）
- 天国カットインのアルアル率（`show.aruaruShare` 30%）、前兆のチーム・バトル回数・カットイン・PUSH ボタンの色の振り分け、レア役のフラッシュ・先バレ音の率（`show.*`）
- AT 中のボーナスの相手の振り分け（`show.boss`）、設定示唆の画像の振り分け（`show.hint`）
- ガセ「狙え」の出やすさ（`show.neraeGase` 1/63）
