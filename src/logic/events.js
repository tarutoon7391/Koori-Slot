// =====================================================================
// 内部処理 → 演出 のイベント (合体するときの約束)
// ---------------------------------------------------------------------
// 内部処理は「何が起きたか」をこのイベントで知らせるだけで、画面や音には触らない。
// 演出は machine.on(listener) で受け取り、listener({ type, ...データ }) の type を見て見せ方を決める。
// 名前とデータを変えるときは docs/events.md を先に直す (演出側の確認が入るまでは変えない)。
// 1ゲームの順番: lever → notice (レバーのとき) → reel:stop ×3 → game:end → (stage / zencho:end / bonus:… など)
// =====================================================================

export const EVENTS = {
    // ----- 1ゲーム -----
    LEVER: 'lever',               // { game, phase, free }  phase: 'normal' | 'standby' | 'bonus' | 'at'
    NOTICE: 'notice',             // { kind, timing, ... }  演出の抽選結果 (下の NOTICE_KINDS)
    REEL_STOP: 'reel:stop',       // { reel, top, slip, order }  top: 止まった上段の番号 (リール配列 v1.0)
    GAME_END: 'game:end',         // { cols, win, payout, credit }  win: 'bell' | 'replay' | 'cherry' | 'suika' | 'big' | 'reg' | 'koori' | null (押し順ベルの取りこぼしは null・payout 0)

    // ----- 通常時 -----
    STAGE: 'stage',               // { place, floor, state }  place: 'floor' | 'middle'(前兆の中間階層)。floor: 階 / state: 'low' | 'high' | 'super'
    ZONE: 'zone',                 // { active, start }  魔天ゾーンに入った・出た
    ZENCHO_START: 'zencho:start', // { team, games, cause }  team: 'fiveDX' | 'ask3' | 'muscle' / cause: 'zone' | 'rare' | 'tenjo' | 'stock'。AT 中にも出る
    ZENCHO_BATTLE: 'zencho:battle', // { round, of, final, win, button }  最後の連続演出。final のときだけ win が意味を持つ
    ZENCHO_END: 'zencho:end',     // { win, bonus }  前兆の終わり (win: 相手チームを倒した = ボーナス確定)
    HEAVEN: 'heaven',             // { who }  天国のカットイン ('naitei' | 'aruaru')。天国の前兆の始まりに出る (出たら天国確定)
    TENJO: 'tenjo',               // { who, bonus }  天井到達。BIG 以上確定 (who: 'naitei' = BIG / 'aruaru' = エピソードBIG)
    DIRECT: 'at:direct',          // {}  AT 直撃 (このゲームの演出のあと AT が始まる)

    // ----- 疑似ボーナス -----
    BONUS_STANDBY: 'bonus:standby', // { bonus, stock }  ボーナス確定。次のゲームで図柄がそろう (bonus: 'big' 7・7・7 | 'reg' 7・7・BAR | 'epbig' こおりくん×3)
    BONUS_START: 'bonus:start',   // { bonus, games, inAt }  inAt: AT 中のボーナス
    BONUS_GAME: 'bonus:game',     // { bonus, left, nav }  nav: 押し順ベルのナビ (at:game と同じ形。ないゲームは null。順押しナビは AT・特化ゾーンの当選確定)
    BONUS_NERAE: 'bonus:nerae',   // { color, win }  「こおりを狙え」カットイン (win: こおりくんがそろう。false はガセ: 押し順ごとの外し方で止まる)
    BONUS_END: 'bonus:end',       // { bonus, at, stock }  at: AT へ / stock: 残りの 1G連 の数

    // ----- AT -----
    AT_START: 'at:start',         // { games, cause }  cause: 'bonus' | 'direct'
    AT_GAME: 'at:game',           // { left, nav }  nav: 押し順 [リール番号, …] (ナビのないゲームは null)。nav[0] が 0 (順押し) は当選確定
    AT_ADD: 'at:add',             // { games, left, attacker, enemy }  上乗せ。attacker: 'yasu' | 'tamu' | 'dake' | 'onioni' | 'sword' | 'hammer' | 'kill' / enemy: キャラの id
    AT_MISS: 'at:miss',           // { attacker, enemy }  上乗せなしのレア役 (「ミス！」)
    AT_BOSS: 'at:boss',           // { boss, final, win }  AT 中のボーナスの相手 (登場 / 勝利。v0.6 から敗北は at:bossJudge)
    AT_BOSS_ATTACK: 'at:bossAttack', // { boss, move, result, color, shout }  AT 中のボーナスで、当たりを見せる前のレア役のときの仲間の攻撃 (v0.6)。金・虹は確定
    AT_BOSS_JUDGE: 'at:bossJudge', // { boss, win, finisher }  AT 中のボーナスの最後のゲームの一騎打ち「ラストジャッジ」(v0.6)。finisher: 'koori' | 'kooriKill' (確定。v0.7) | 仲間の id (確定)
    AT_JUDGE: 'at:judge',         // { win, bonus }  前兆中に AT のゲーム数がなくなったときの当落告知
    AT_END: 'at:end',             // { games, payout, hint, trophy }  hint: 設定示唆の画像 / trophy: 設定示唆トロフィーの色 'white' | 'blue' | 'green' | 'purple' | 'red' | 'rainbow' (出ないときは null。設定より上の色は出ない)

    // ----- 上乗せ特化ゾーン -----
    TOKKA_STOCK: 'tokka:stock',   // { stock }  特化ゾーンに当たった (当たったゲームの終わり)
    TOKKA_START: 'tokka:start',   // { stock }  特化ゾーンが始まる (次のレバーから)
    TOKKA_GAME: 'tokka:game',     // { set, game, add, guarantee, nav, hit }  特化ゾーンの1ゲーム (レバーのとき)。nav: 押し順ベルのナビ / hit: リプレイ以上を引いた (v0.5)
    TOKKA_SET: 'tokka:set',       // { set, cont, revive }  セットの終わり
    TOKKA_END: 'tokka:end'        // { total, sets, left }  特化ゾーンの終わり
};

// notice の kind (演出の種類。期待度に関わるので内部処理が抽選する)
//   sakibare   { timing: 'lever', pitch: 'normal' | 'high' }  先バレ音 (high は AT 直撃)
//   flash      { timing: 'afterStop', level: 'small' | 'big' | 'rainbow' }  レア役のフラッシュ
//   cutin      { timing: 'lever', color: 'blue' | 'green' | 'red' | 'gold' | 'rainbow' }  前兆中のカットイン
//   kakutei    { timing: 'afterStop' }  確定音
//   iwakan     { timing: 'lever', effect }  違和感演出 (v0.4。AT 中、特化ゾーン中を除く)。effect: 'navGlitch' | 'navQuestion' (ナビのあるゲームだけ) | 'noise' | 'mute' | 'freeze' | 'invert' | 'button' | 'lever'
export const NOTICE_KINDS = ['sakibare', 'flash', 'cutin', 'kakutei', 'iwakan'];
