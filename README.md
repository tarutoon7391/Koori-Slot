# こおりくんの大冒険～最凶のASO摩天楼への挑戦～

ゲーム数上乗せ型の AT 機（純増 約3枚、設定 1〜6）。React + Vite。

- **演出・見た目**（`src/presentation/`）：友達（演出担当）が作った完成版。このリポジトリでは触らない
- **内部処理**（`src/logic/`）：自分（内部処理担当）。仕様書 `docs/spec.md` に沿った本物（v1.0。2026-10-21 に仮組から差しかえ）
- 公開：Railway https://koori-slot-production.up.railway.app （サービス名 `Koori-Slot`。下の「Railway へのデプロイ」）

## 遊び方・確認のしかた

**いちばん手軽なのは `play.html` をダブルクリック**して開くことです（ブラウザだけで動く1つのファイル）。
`index.html` を直接開くと真っ白になります（開発用の元のファイルなので、`npm run dev` で開く）。

```sh
npm install
npm run dev        # http://localhost:5173 を開く
npm test           # 内部処理のテスト (tests/logic.test.js)
npm run sim        # 内部処理のシミュレーション (設定 1〜6。結果は docs/sim_result.md)
npm run build      # dist/ に作る (Railway はこれを npm start で配信する)
npm run build:file # play.html (ダブルクリックで遊べる1つのファイル) を作り直す
node tools/build-design.mjs   # 画面設計書・キャラ設計書のページ (docs/design.html) を作り直す
```

| 操作 | キー | 画面 |
|---|---|---|
| レバー（ベットも自動）・左から順に停止 | Space / Enter | リールをタップ |
| 停止（左・中・右） | Z X C、← ↓ → | 丸い停止ボタン |
| PUSH | B | PUSH ボタン |
| デバッグを出す・しまう | D | 「デバッグ」 |

デバッグ画面の機能：
- 内部の状態（モード・ステート・当たるところ・前兆・ストック）を見る
- 次のゲームの役を決める
- 前兆（本物・ガセ、相手チーム）・天井・AT 直撃・天国カットイン・ボーナスを起こす
- AT 中の BIG・REG・エピソードBIG、AT 中の前兆、AT の残りを 3G に（ラストジャッジ）、特化ゾーンのストック
- オートで回す

### 確認用の URL

URL に付けると、その状態から始まります（組み合わせられます）。

| 指定 | 中身 |
|---|---|
| `?state=high` | ステート（`low` `high` `super`） |
| `?mode=heaven` | モード（`A` `B` `C` `D` `heaven` `superHeaven`） |
| `?games=197` | 通常時のゲーム数 |
| `?zencho=real&team=muscle&length=5` | 前兆を始める（`real` / `gase`、チームは `fiveDX` `ask3` `muscle`） |
| `?ceiling=1` | 天井の5G前から |
| `?direct=1` | 最初のゲームで AT 直撃 |
| `?role=strongCherry` | 最初のゲームの役 |
| `?bonus=big` | ボーナス確定から（`reg` `epbig` も） |
| `?bonusrole=midCherry` | ボーナスの最初のゲームの役。`?bonus=big&bonusrole=midCherry` で、次のゲームに「こおりを狙え」が出る |
| `?tokka=1` | AT 直撃のあと、上乗せ特化ゾーンをストック（1ゲーム回すと告知） |
| `?auto=1` | オートで回す |

## 分担

| 担当 | 場所 | 中身 |
|---|---|---|
| 演出（友達） | `src/presentation/` | 筐体・液晶・リールの絵・音。`docs/screen-design.md`・`docs/characters.md` |
| 内部処理（自分） | `src/logic/` | 役の抽選・モード・ステート・前兆・ボーナス・AT・特化ゾーン・リール制御。`docs/spec.md`・`docs/CHANGELOG_logic.md`・`docs/sim_result.md` |
| 共通 | `docs/events.md` | **内部処理と演出の約束**（台の窓口 `createMachine` とイベント）。変えるときは先にここを直して相手に知らせる |

演出側は `src/logic/index.js` からだけ読み込み、内部処理の中身（モード・ステートなど）は演出の判断に使いません（デバッグ画面の表示だけ `machine.debug.internal()`）。

## `docs/` の読み方

| 書類 | 中身 |
|---|---|
| `docs/spec.md` | **仕様書の正本**（Claude Docs「AT機（第3弾・仮称）仕様書 v0.1」の Markdown 書き出し）。モード・ゾーン・ステート・ボーナス・AT・特化ゾーン・リール配列・払い出し |
| `docs/events.md` | 内部処理と演出の約束（イベントの名前・データ・順番、デバッグ API）。v0.3 で足したものは「演出側確認待ち」の印つき |
| `docs/CHANGELOG_logic.md` | 内部処理の変更履歴（仮組 → 本物で変えたこと、`docs/events.md` に足したもの、【仮】のまま残っている値） |
| `docs/sim_result.md` | シミュレーションの結果（設定 1〜6 の初当たり・AT・特化ゾーン・コイン持ち・機械割）と「気になる点」 |
| `docs/screen-design.md`・`docs/characters.md` | 画面設計書・キャラ設計書（絵つきは `docs/design.html`） |

## 内部処理（`src/logic/`）の中身

| ファイル | 中身 |
|---|---|
| `index.js` | 入り口。`createMachine` `EVENTS` `NOTICE_KINDS` `STRIPS` `REEL_LENGTH` `windowAt` を出す（演出側はここだけ読む） |
| `machine.js` | 台の内部処理（1ゲームの流れ、通常時・ボーナス・AT・特化ゾーン、デバッグ API） |
| `config.js` | 数値。仕様書で決定の表と、【仮】の たたき台（役の出現率・共通ベルの有無・AT 中ベルの当選率・演出の振り分けなど） |
| `reelControl.js` | リール制御。役ごとの出目の形（`SHAPES`）と、押した位置にいちばん近いところで止める仕組み。押し順ベルの取りこぼし・ガセ「狙え」は押した順で形を決め直す |
| `reels.js` | リール配列 v1.0 と出目の見方 |
| `rng.js` | 乱数（seed 付き。テスト・シミュレーション用） |
| `events.js` | イベントの名前（`docs/events.md` と同じ） |

内部処理を直したら：`npm test` → 必要なら `npm run sim` → `npm run build:file` で `play.html` を作り直してからコミット。

### 仮組からの差しかえについて

仮組（演出確認用）から本物に差しかえるときに変えたのは `src/logic/` の中だけです。`createMachine` が返すもの（`on` `lever` `stop` `snapshot` `debug`）とイベントの名前・データは `docs/events.md` v0.2 のまま。足したもの（`bonus:game` の `nav`・`tokka:game` の `nav`・AT 中のエピソードBIG の `at:boss`）は `docs/events.md` に「演出側確認待ち」で書いてあります。詳しくは `docs/CHANGELOG_logic.md`。

## Railway へのデプロイ

公開 URL: https://koori-slot-production.up.railway.app （2026-10-21 に作成。GitHub 連携で `main` に push すると自動デプロイ）。設定は `railway.json`（Railpack）と `prestart`（`npm start` の前に `npm run build`）。手元から直接デプロイするなら `railway up --ci --service Koori-Slot`。

1. Railway で New Project → **Deploy from GitHub repo** → このリポジトリ（`Koori-Slot`）を選ぶ。
2. サービス名を `Koori-Slot` にする。環境変数は不要（`PORT` は Railway が渡す）。
3. ビルドは `railway.json` のとおり **Railpack**（Nixpacks を指定すると今の Railway の builder v4 ではログなしで「Failed to build an image」になる。2026-10-21 に確認）。Build Command は `npm run build`（`prestart` でも走るので、指定しなくても動く）、Start Command は `npm start`（`vite preview --host 0.0.0.0 --port $PORT`）。
4. Settings → Networking → Generate Domain で公開 URL を作る。ヘルスチェックは `/`。
5. 以後は `main` に push すると自動でデプロイされる。

`vite` と `@vitejs/plugin-react` は `dependencies` に入れてあります（Railway のビルドで devDependencies が入らない場合の保険）。

## フォルダ

| 場所 | 中身 |
|---|---|
| `src/logic/` | 内部処理（本物）。演出側が読むのは `index.js` だけ |
| `src/presentation/` | 演出：`App.jsx`（画面全体）・`game.js`（つなぐところ）・`lcd/`（液晶）・`reels/`（リール）・`sound/`（音）・`art/`（ドット絵）・`components/`（筐体・デバッグ） |
| `docs/` | 仕様書・約束・設計書・変更履歴・シミュレーション結果（上の「`docs/` の読み方」） |
| `tests/` | 内部処理のテスト |
| `tools/` | `simulate.js`（シミュレーション）・`build-file.mjs`（`play.html`）・`build-design.mjs` と `design/`（設計書のページ） |
**必殺技のカットインと敵のセリフ**（画面設計書 11章。2026-10-21。前作のスロットにあったもの）：前兆のライバル戦・AT の上乗せ・AT 中のボーナス・ラストジャッジで、とどめの必殺技・敵の必殺技のカットインと、敵の戦う前・勝ったとき・負けたときのセリフ。名前とセリフは `src/presentation/lcd/battleLines.js`、絵は `lcd/special.js`。

**チャンスのカットイン**（2026-10-21）：こおりくん以外のキャラ（仲間・おにおに・ふるカワ・ともいし）も出る。顔ぶれとセリフは色ごと（`lcd/cutinCast.js`。期待度は色だけ）。前のカットインが残っていたら、右へはけさせて消す。

