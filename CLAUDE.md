# CLAUDE.md

このリポジトリで作業する Claude への約束です。

- 返事・コメント・書類は日本語で書く。
- 分担：演出（`src/presentation/`）と内部処理（`src/logic/`）は別の人が作る。今の `src/logic/` は演出確認用の仮組。
- **約束は `docs/events.md`**（台の窓口 `createMachine` とイベントの名前・データ）。変えるときは先にこの書類を直し、相手に知らせる。演出側の確認が入るまでは名前とデータを変えない。
- 演出側は `src/logic/index.js` からだけ読み込む。内部処理の中身（モード・ステートなど）を演出の判断に使わない（デバッグ画面の表示だけは `machine.debug.internal()` を使ってよい）。
- 期待度に関わる演出の抽選（カットインの色・前兆の相手チーム・PUSH ボタンの色など）は内部処理が行い、イベントで渡す。
- 画面設計書は `docs/screen-design.md`・キャラ設計書は `docs/characters.md`。直したら `node tools/build-design.mjs` で `docs/design.html` を作り直す。
- 液晶の絵の道具は `src/presentation/lcd/kit.js`（設計書の画面イメージと共通）。キャラのドット絵は `src/presentation/art/`。
- テスト：`npm test`。ビルド：`npm run build`。
- ユーザーは `play.html` をダブルクリックして遊ぶ。演出や内部処理を直したら `npm run build:file` で play.html を作り直してからコミットする（`index.html` を直接開くと真っ白になる）。
