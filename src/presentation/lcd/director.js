// =====================================================================
// 演出の進行役 (ディレクター)
// ---------------------------------------------------------------------
// 内部処理のイベントを受け取り、液晶・音・PUSH ボタン・押し順ナビをどう見せるかを決める。
// イベントは順番に処理する。演出に時間がかかるところ (リールが止まりきるまで・PUSH 待ち・暗転など) では
// 「待ち (hold)」を作り、終わるまで次のイベントを処理しない。待っている間はレバーを受け付けない (busy)。
// 画面に何を出すかの状態は view にまとめ、draw(ctx, now) で毎フレーム描く。
// =====================================================================

import { EVENTS as E, windowAt } from '../../logic/index.js';
import { W, H, haze, rect, text, rainbow } from './kit.js';
import {
    TEAMS, drawBattle, drawCutin, drawDirect, drawElevator, drawFlash, drawFloor, drawHeaven,
    drawMiddle, drawNavi, drawStandby, drawTenjo
} from './scenes.js';
import { BOSS_MS, END_MS, ENTRY_MS, KAKUTEI_MS, drawAtKakutei, drawBonusEnd, drawBonusScreen, drawBossFx, drawNerae } from './bonus.js';
import { BIG_CARDS, EPISODES, REG_CARDS } from './bonusStory.js';
import { FINISHERS, LINES, SPECIALS } from './battleLines.js';
import { CUTIN_MS, TALK_MS, drawSpecialCutin, drawTalk } from './special.js';
import { chanceCutin, neraeCutin } from './cutinCast.js';
import {
    INTRO_MS, OPEN_STEP_MS, RESULT_MS, STOCK_MS, TOKKA_END_MS, drawTokka, drawTokkaEnd, drawTokkaIntro, drawTokkaSelect, drawTokkaStock
} from './tokka.js';
import {
    ATTACKS, ATTACK_MS, COUNT_MS, END_MS as AT_END_MS, START_MS, drawAtCount, drawAtEnd, drawAtJudge, drawAtMain, drawAtStart, drawAttack, atBadge
} from './at.js';

// 残りゲーム数を大きく出すとき (画面設計書 5-1 の案)
const COUNT_AT = [10, 5, 3, 2, 1];
const PUSH_WAIT_MS = 5000;     // 武器の攻撃で PUSH を待つ時間 (押さなくても進む)
const LONG_PRESS_MS = 900;     // コオリハンマーの長押しでゲージがたまる時間
const SELECT_MS = 10000;       // 特化ゾーンのパターンを選ぶ時間 (たったら、そのとき選んでいるほうで始める。画面設計書 6章の案)
const JUDGE_WAIT_MS = 4000;    // ラストジャッジで PUSH を待つ時間 (押さなくても進む)
const JUDGE_RESULT_MS = 2400;  // ラストジャッジの結果を見せる時間
const NAV_WARN_MS = 1600;      // 「ナビに従ってください」を出す時間

const LEAVE_MS = 200;          // 前のカットインが右へはけて消えるまで
const OKA_RAINBOW_RATE = 0.25; // おかランプ: 100G 以上の上乗せでランプが虹色に光る割合
const CUTIN_KINDS = ['cutin', 'heaven'];   // 重ねるカットイン (必殺技のカットインは v.spCut)
// 違和感演出 (notice の iwakan。画面設計書 5-7) の長さ
const IWAKAN_MS = { navGlitch: 900, navQuestion: 1200, noise: 900, mute: 1600, freeze: 700, invert: 420 };
// 特化ゾーンのパターンは、前に選んだほうを最初に選んでおく (このブラウザに覚えておく)
function savedPattern() {
    try {
        const id = localStorage.getItem('koori-slot-tokka');
        return ['maou', 'okaLamp', 'daichoen'].includes(id) ? id : 'maou';
    } catch (e) { return 'maou'; }
}
function savePattern(id) {
    try { localStorage.setItem('koori-slot-tokka', id); } catch (e) { /* 保存できない環境 */ }
}

// エピソードBIG は引くたびに次の話へ進む (このブラウザに覚えておく。覚えられないときは毎回1話から)
function nextEpisode() {
    let n = 0;
    try { n = Number(localStorage.getItem('koori-slot-episode')) || 0; } catch (e) { /* 保存できない環境 */ }
    try { localStorage.setItem('koori-slot-episode', String((n + 1) % EPISODES.length)); } catch (e) { /* 無視 */ }
    return n % EPISODES.length;
}
// BIG・REG の解説は、前のボーナスの続きのカードから出す
const nextCard = { big: 0, reg: 0 };
const REEL_SETTLE_MS = 180;   // 停止ボタンを押してから、リールが止まって見えるまで

const BOSS_NAMES = { 22: 'ダイシ', 33: 'ズミタニ', 44: 'ルナヤ', 55: 'ノゾエマ' };

// ふるカワのセリフ (期待度には関係しないので演出側で選ぶ)
function naviLine(stage) {
    const f = stage.floor;
    if (f === 56) return 'ここは大魔王の間…！気をつけて！';
    if (BOSS_NAMES[f]) return `四天王${BOSS_NAMES[f]}の気配がする…！`;
    if (stage.state === 'high') return pick([`夕方の${f}階…ここから上は高確だよ`, `${f}階。敵の気配が強くなってきた…`]);
    return pick([`ここはまだ${f}階。下の階は敵も弱いよ！`, `${f}階に着いたよ。上を目指そう！`]);
}
const pick = list => list[Math.floor(Math.random() * list.length)];

// onEpisode(n): エピソードBIG の第 n 話 (0 から) を見せはじめた (図鑑に数える)
// onSpecial(who): who の必殺技のカットインを見せた (図鑑に数える)
export function createDirector({ sound, reels, onChange = () => {}, onEpisode = () => {}, onSpecial = () => {} }) {
    const v = {
        phase: 'normal',
        stage: { place: 'floor', floor: 1, state: 'low' },
        zone: false,
        zencho: null,
        battle: null,
        standby: null,
        bonus: null,
        nerae: null,       // 「こおりを狙え」のゲーム: { color, win, stops, order, phase, endAt }
        kakutei: null,     // AT確定 (こおりくん揃い): { since, label }
        bonusEnd: null,    // ボーナス終了の画面: { bonus, payout, at, stock, since }
        atStart: null,     // AT 突入の画面: { since, games }
        atCount: null,     // 残りゲーム数の大きな数字: { left, since }
        attack: null,      // 上乗せの攻撃: { attacker, enemy, games, left, phase, since, gauge, pushes }
        pendingAdd: null,  // レバーで届いた上乗せ。リールが止まってから攻撃を見せる
        atEnd: null,       // AT 終了の画面
        tokka: null,       // 特化ゾーン: { pattern, choice, set, games, gained, guarantee, phase, since, shownTotal, pop, kakuteiAt, result, pending }
        tokkaFx: null,     // 特化ゾーン当選のフリーズ風の告知: { since, stock }
        tokkaEnd: null,    // 特化ゾーン終了の画面
        bossFx: null,      // AT 中のボーナスの相手の登場・勝利・敗北: { kind, boss, since }
        judge: null,       // AT 0G の当落告知 (ラストジャッジ): { team, win, bonus, phase, since }
        navWarn: null,     // 押し順ナビとちがう押し順で押したときの警告: { since }
        at: null,
        spCut: null,       // 必殺技のカットイン: { who, name, side, since }
        talk: null,        // 敵のセリフの吹き出し: { who, line, since }
        direct: null,
        iwakan: null,      // 違和感演出 (液晶に出すもの): { type, since, until, frozen }
        navOdd: null,      // 違和感演出 (押し順ナビ): { type: 'glitch' | 'question', until }
        muteUntil: 0,      // 違和感演出 (無音): この時刻まで BGM を止める
        tenjo: null,
        navi: null,
        overlays: [],
        banner: null,
        button: { color: 'white', lit: false, pop: false },
        nav: null,
        credit: 50,
        lastPayout: 0
    };
    const queue = [];
    let hold = null;      // { until, then } | { push: 'battle' | 'attack' | 'select' | 'judge', timeout }
    // 最後のリールが止まりきるまで、そのゲームの結果を見せない。hold とは別に持つ
    // (レバーのときに始まった演出の時間待ち (四天王の登場など) を、リールの待ちで上書きして消さないように)
    let reelHold = false;
    let pressing = false; // PUSH ボタンを押しているあいだ (コオリハンマーの長押し)
    let now = performance.now();
    const timers = [];

    const changed = () => onChange(snapshot());
    const after = (ms, fn) => timers.push({ at: now + ms, fn });
    const overlay = (kind, dur, data = {}, delay = 0) => v.overlays.push({ kind, since: now + delay, until: now + delay + dur, ...data });
    const wait = (ms, then = null) => { hold = { until: now + ms, then }; };

    function setButton(color, { lit = true, pop = false } = {}) {
        v.button = { color, lit, pop };
        changed();
    }

    // ----- 違和感演出 (2026-10-21 ユーザー指定。画面設計書 5-7) -----
    // 出すかどうか・どれを出すかは内部処理の notice (iwakan)。ここは見せ方だけ
    function iwakan(type) {
        const dur = IWAKAN_MS[type] || 600;
        if (type === 'navGlitch' || type === 'navQuestion') {
            v.navOdd = { type: type === 'navGlitch' ? 'glitch' : 'question', until: now + dur };
            sound.play('glitch');
            // リールの上のナビを描きかえる (乱れているあいだは何度も)
            for (let ms = 0; ms <= dur; ms += 90) after(ms, changed);
            after(dur + 20, changed);
        } else if (type === 'mute') {
            v.muteUntil = now + dur;
        } else if (type === 'button') {
            ['red', 'blue', 'gold', 'white'].forEach((c, i) => after(i * 110, () => setButton(c)));
            after(480, () => setButton('white', { lit: false }));
        } else if (type === 'lever') {
            sound.play('leverOdd');
        } else {
            v.iwakan = { type, since: now, until: now + dur, frozen: null };
            if (type === 'noise') sound.play('noise');
            if (type === 'freeze' || type === 'invert') sound.play('glitch');
        }
    }

    // 液晶の違和感 (ノイズ・停止・反転)。画面をぜんぶ描いたあとに重ねる
    function drawIwakan(ctx, t) {
        const w = v.iwakan;
        if (!w) return;
        if (t > w.until) {
            v.iwakan = null;
            return;
        }
        const k = t - w.since;
        if (w.type === 'noise') {
            ctx.save();
            const rnd = Math.random;
            for (let i = 0; i < 14; i++) rect(ctx, 0, rnd() * H, W, 1 + rnd() * 3, `rgba(255,255,255,${0.1 + rnd() * 0.35})`);
            for (let i = 0; i < 160; i++) rect(ctx, rnd() * W, rnd() * H, 1, 1, rnd() < 0.5 ? '#ffffff' : '#000000');
            // 横にずれる帯
            const y = rnd() * H;
            ctx.drawImage(ctx.canvas, 0, y * (ctx.canvas.height / H), ctx.canvas.width, 12 * (ctx.canvas.height / H), (rnd() - 0.5) * 16, y, W, 12);
            ctx.restore();
        } else if (w.type === 'freeze') {
            // 止まった瞬間の絵をとっておいて、そのあいだはそれを出しつづける
            if (!w.frozen) {
                w.frozen = document.createElement('canvas');
                w.frozen.width = ctx.canvas.width;
                w.frozen.height = ctx.canvas.height;
                w.frozen.getContext('2d').drawImage(ctx.canvas, 0, 0);
            }
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.drawImage(w.frozen, 0, 0);
            ctx.restore();
        } else if (w.type === 'invert') {
            // 色の反転を2回チカッと
            if (k < 120 || (k > 240 && k < 360)) {
                ctx.save();
                ctx.globalCompositeOperation = 'difference';
                rect(ctx, 0, 0, W, H, '#ffffff');
                ctx.restore();
            }
        }
    }

    // ----- カットインの入れかわり (2026-10-21 ユーザー指定) -----
    // 新しいカットインを出すとき、前のカットインが残っていたら、右へすばやくはけさせて消す
    function clearCutins() {
        v.overlays = v.overlays.filter(o => !(CUTIN_KINDS.includes(o.kind) && o.since > now));   // まだ出ていないものはやめる
        v.overlays.forEach(o => {
            if (!CUTIN_KINDS.includes(o.kind) || o.leaveAt) return;
            o.leaveAt = now;
            o.until = Math.min(o.until, now + LEAVE_MS);
        });
        if (v.spCut && !v.spCut.leaveAt) v.spCut.leaveAt = now;
    }
    function cutinOverlay(kind, dur, data) {
        clearCutins();
        overlay(kind, dur, data);
    }

    // ----- 必殺技のカットインと敵のセリフ (前作のスロットと同じ見せ方。画面設計書 11章) -----
    // カットインを出しきってから then。side: 'ally' (こおりくんたち) / 'enemy'
    function specialCut(who, side, name, then) {
        clearCutins();
        if (v.spCut) v.spCutOld = { ...v.spCut, leaveAt: v.spCut.leaveAt || now };
        v.spCut = { who, name: name || SPECIALS[who] || '必殺技', side, since: now };
        sound.play('cutin');
        after(250, () => sound.play(side === 'enemy' ? 'clash' : 'flashBig'));
        onSpecial(who);
        wait(CUTIN_MS, () => {
            v.spCut = null;
            if (then) then();
        });
    }
    // 敵のセリフ (kind: 'intro' 戦う前 / 'special' 必殺技の前 / 'win' 敵が勝った / 'lose' 敵が負けた)
    function talk(who, kind, delay = 0) {
        const line = LINES[who] && LINES[who][kind];
        if (!line) return;
        after(delay, () => { v.talk = { who, line, since: now }; });
    }
    // 敵の必殺技: セリフを言ってからカットイン
    function enemySpecial(who, then) {
        talk(who, 'special');
        wait(900, () => specialCut(who, 'enemy', null, then));
    }
    // 前兆・ラストジャッジの相手 (最後に戦うのはチームの3人目。scenes.js の drawBattle と同じ)
    const rivalOf = team => (TEAMS[team] || TEAMS.fiveDX).members[2];

    // ----- 「こおりを狙え」(画面設計書 4-3) -----
    // 押し順で確定がわかるタイミングが変わる (仕様書): 中押しは中リールにこおりくんが止まった時点 (1確)、
    // はさみ押しは左右でテンパイした時点 (2確)、順押しは第3停止まで引っ張る。
    // ガセのときは、内部処理が中押しで中リールにこおりくんを止めず、はさみ押しでテンパイさせない
    function neraeStop(reel, top) {
        const n = v.nerae;
        n.order.push(reel);
        n.stops[reel] = windowAt(reel, top)[1] === 'koori';
        if (n.phase !== 'aim' && n.phase !== 'tenpai') return;
        const [first, second] = n.order;
        const kooriAll = n.order.every(r => n.stops[r]);
        if (n.order.length === 1 && first === 1 && kooriAll) return revealKoori();
        if (n.order.length === 2 && first !== 1 && second !== 1 && kooriAll) return revealKoori();
        if (n.order.length === 2 && kooriAll) {
            n.phase = 'tenpai';
            sound.play('tenpai');
            setButton('red', { pop: true });
        }
    }

    function flushNerae(all = false) {
        const n = v.nerae;
        while (n && n.pending.length && (all || n.pending[0].at <= now)) {
            const { reel, top } = n.pending.shift();
            neraeStop(reel, top);
        }
    }

    // AT 中のボーナスでは、揃ったあとに相手との勝負の結果 (at:boss の勝利 → 特化ゾーン確定) を見せるので、
    // ここでは文字を出さずに短く光らせるだけにする (内部処理の担当の希望: 狙え → 揃い → 勝利 の順)
    function revealKoori() {
        v.nerae.phase = 'hit';
        if (v.bonus) v.bonus.at = true;
        v.kakutei = { since: now, label: v.bonus && v.bonus.inAt ? '' : atLabel() };
        sound.play('kooriAlign');
        after(250, () => sound.play('atKakutei'));
        // 「AT確定！」の声 (ブラウザの読み上げ。AT 中のボーナスは勝利の画面で「特化ゾーン確定！」)
        if (!(v.bonus && v.bonus.inAt)) after(700, () => sound.say && sound.say(`${atLabel()}！`));
        setButton('rainbow', { pop: true });
    }

    // ----- 上乗せの攻撃 (画面設計書 5-2) -----
    // 相手が出てくる → (武器のときは PUSH を待つ: ソード 1回 / ハンマー 長押し / 絶対殺す剣 4回) → 攻撃 → +〇G
    function startAttack(e) {
        const atk = ATTACKS[e.attacker] || ATTACKS.yasu;
        pressing = false;
        v.attack = { attacker: e.attacker, enemy: e.enemy, games: e.games || 0, left: e.left, miss: Boolean(e.miss), phase: 'appear', since: now, gauge: 0, pushes: 0 };
        sound.play('cutin');
        talk(e.enemy, 'intro', 80);
        wait(ATTACK_MS.appear, () => {
            if (!atk.weapon || e.miss) return hitAttack();
            v.attack.phase = 'push';
            v.attack.since = now;
            setButton(atk.weapon === 'kill' ? 'rainbow' : atk.weapon === 'hammer' ? 'blue' : 'white', { pop: atk.weapon === 'kill' });
            hold = { push: 'attack', timeout: now + PUSH_WAIT_MS };
        });
    }

    function attackPush() {
        const a = v.attack;
        const atk = ATTACKS[a.attacker];
        sound.play('push');
        if (atk.button === 'long') {
            a.gauge = Math.min(1, a.gauge + 0.2);   // 長押しのほか、連打でもたまる
            if (a.gauge >= 1) hitAttack();
            return;
        }
        a.pushes++;
        if (a.pushes >= atk.pushes) hitAttack();
    }

    function hitAttack() {
        const a = v.attack;
        hold = null;
        // とどめの必殺技のカットイン (仲間・おにおにはその技、こおりくんは武器の名前)。ミスのときは出さない
        if (!a.miss && !a.cutDone) {
            a.cutDone = true;
            const atk = ATTACKS[a.attacker] || ATTACKS.yasu;
            specialCut(atk.who, 'ally', atk.weapon ? atk.name : SPECIALS[atk.who], () => hitAttack());
            return;
        }
        a.phase = 'hit';
        a.since = now;
        // ミス (at:miss): 相手がよけて、上乗せなし
        if (a.miss) {
            after(300, () => sound.play('push'));
            wait(ATTACK_MS.hit, () => {
                a.phase = 'result';
                a.since = now;
                sound.play('lose');
                talk(a.enemy, 'win');
                wait(ATTACK_MS.result - 500, () => { v.attack = null; });
            });
            return;
        }
        setButton(a.games >= 300 ? 'rainbow' : 'gold', { pop: a.games >= 300 });
        after(300, () => sound.play('clash'));
        wait(ATTACK_MS.hit, () => {
            a.phase = 'result';
            a.since = now;
            // 上乗せ音は大きさで3段階 (画面設計書 7-2)
            sound.play(a.games >= 100 ? 'addBig' : a.games >= 50 ? 'addMid' : 'addSmall');
            talk(a.enemy, 'lose', 200);
            if (v.at) {
                v.at.left = a.left;
                v.at.adds++;
                v.at.addTotal += a.games;
                v.at.best = Math.max(v.at.best, a.games);
            }
            wait(ATTACK_MS.result, () => {
                v.attack = null;
                if (v.at) v.at.add = { games: a.games, at: now };
                setButton('white', { lit: false });
            });
        });
    }

    // ----- 上乗せ特化ゾーン -----
    function confirmTokka() {
        const z = v.tokka;
        hold = null;
        z.pattern = z.choice;
        savePattern(z.pattern);
        z.phase = 'intro';
        z.since = now;
        sound.play('fanfare');
        wait(INTRO_MS, () => {
            z.phase = 'play';
            setButton('white', { lit: false });
        });
    }

    // 1ゲームの結果 (リールが止まってから)。こおり大腸炎は 1G ごとに上乗せを出す。魔王の褒美は宝箱を置くだけ
    function showTokkaGame(e) {
        const z = v.tokka;
        const gainedNow = e.guarantee > z.guarantee;
        z.games.push({ add: e.add, guarantee: e.guarantee });
        z.guarantee = e.guarantee;
        if (gainedNow) z.gained = true;
        if (z.pattern === 'maou') {
            sound.play('push');
            return;
        }
        z.pop = { add: e.add, at: now };
        z.shownTotal += e.add;
        sound.play(e.add >= 100 ? 'addBig' : e.add >= 30 ? 'addMid' : 'addSmall');
        if (gainedNow) {
            // こおりくんが虹色に光り、まわりの炎が虹色になって「確定」
            z.kakuteiAt = now;
            after(150, () => sound.play('kakutei'));
            setButton('rainbow', { pop: true });
            wait(1300, () => setButton('white', { lit: false }));
        }
    }

    // セットの結果: 継続！ / 復活！ (継続率テーブルで続いた) / 終了…
    function showTokkaResult(e) {
        const z = v.tokka;
        z.phase = 'result';
        z.result = e.revive ? 'revive' : e.cont ? 'cont' : 'end';
        z.since = now;
        if (e.revive) after(500, () => sound.play('flashRainbow'));
        else sound.play(e.cont ? 'win' : 'lose');
        wait(RESULT_MS + (e.revive ? 500 : 0), () => {
            if (!e.cont) return;
            // 次のセットへ (継続確定は1つ使う)
            if (z.guarantee > 0 && !e.revive) z.guarantee--;
            z.set = e.set + 1;
            z.games = [];
            z.gained = false;
            z.phase = 'play';
            z.result = null;
        });
    }

    // AT 中のボーナスでは、こおりくん揃いは特化ゾーン確定の告知 (仕様書)
    const atLabel = () => (v.at ? '特化ゾーン確定' : 'AT確定');

    // ----- イベントごとの見せ方 -----
    const handlers = {
        [E.LEVER]() {
            sound.play('lever');
            v.lastPayout = 0;
            v.battle = null;
            v.nerae = null;
            if (!v.direct) setButton('white', { lit: false });
            changed();
        },

        [E.NOTICE](e) {
            if (e.kind === 'sakibare') {
                sound.sakibare(e.pitch);
                setButton(e.pitch === 'high' ? 'rainbow' : 'red');
                after(900, () => { if (!v.direct) setButton('white', { lit: false }); });
            } else if (e.kind === 'cutin') {
                // キャラは色ごとの顔ぶれから選ぶ (期待度は色だけ。lcd/cutinCast.js)
                const c = chanceCutin(e.color);
                cutinOverlay('cutin', 1800, { color: e.color, who: c.who, line: c.line });
                sound.play('cutin');
                if (e.color === 'gold' || e.color === 'rainbow') setButton(e.color, { pop: e.color === 'rainbow' });
            } else if (e.kind === 'flash') {
                overlay('flash', 700, { level: e.level });
                sound.play(e.level === 'rainbow' ? 'flashRainbow' : e.level === 'big' ? 'flashBig' : 'flashSmall');
            } else if (e.kind === 'iwakan') {
                iwakan(e.effect);
            } else if (e.kind === 'kakutei') {
                sound.play('kakutei');
                setButton('rainbow', { pop: true });
            }
        },

        [E.DIRECT]() {
            v.direct = { phase: 'noise', since: now };
            sound.play('noise');
        },

        [E.REEL_STOP](e) {
            sound.play('stop');
            // 第1・第2停止のイベントは押した瞬間に来るので、リールが止まって見えてから判定する。
            // 第3停止は止まりきってから来るので、残っている分もまとめて止めた順に判定する
            if (v.nerae) {
                v.nerae.pending.push({ reel: e.reel, top: e.top, at: now + REEL_SETTLE_MS });
                flushNerae(e.order === 3);
            }
        },

        [E.GAME_END](e) {
            v.credit = e.credit;
            v.lastPayout = e.payout;
            if (v.bonus) v.bonus.payout += e.payout;
            if (v.at) v.at.payout += e.payout;
            // 中段に揃ったときだけ中段を光らせる (チェリー・スイカ・チャンス目は中段の入賞ではない)
            const mid = e.cols.map(col => col[1]);
            const line = (mid[0] === mid[1] && mid[1] === mid[2]) || e.win === 'reg';
            if (e.win && line) reels.highlight([[0, 1], [1, 1], [2, 1]], e.win === 'replay' ? '#3a86ff' : '#ffe040');
            if (e.payout) sound.play('payout');
            else if (e.win === 'replay') sound.play('replay');
            changed();

            // 「こおりを狙え」の結果: そろったら AT確定 を見せきるまで待つ。そろわなければガセ
            if (v.nerae) {
                if (e.win === 'koori' && v.nerae.phase !== 'hit') revealKoori();
                if (v.nerae.phase === 'hit') {
                    const ms = v.bonus && v.bonus.inAt ? 1000 : KAKUTEI_MS;
                    wait(Math.max(0, ms - (now - v.kakutei.since)), () => { v.kakutei = null; });
                } else {
                    v.nerae.phase = 'miss';
                    v.nerae.endAt = now;
                    sound.play('lose');
                    setButton('white', { lit: false });
                }
                return;
            }

            // 前兆の最後のバトル (通常時・AT 中): PUSH を待つ
            if (v.battle && v.battle.final) {
                v.nav = null;
                if (v.at) v.at.nav = null;
                v.battle.phase = 'push';
                setButton(v.battle.button, { pop: v.battle.button === 'gold' || v.battle.button === 'rainbow' });
                hold = { push: 'battle', timeout: now + 6000 };
                return;
            }

            // AT: 押し順ナビを消して、上乗せがあれば攻撃を見せる
            if (v.at && v.phase === 'at') {
                v.nav = null;
                v.at.nav = null;
                changed();
                if (v.tokka && v.tokka.pending) {
                    showTokkaGame(v.tokka.pending);
                    v.tokka.pending = null;
                }
                if (v.pendingAdd) startAttack(v.pendingAdd);
                v.pendingAdd = null;
                return;
            }

            // AT 直撃: 暗転 → こおりいきていける！
            if (v.direct) {
                v.direct = { phase: 'black', since: now };
                sound.play('blackout');
                wait(900, () => {
                    v.direct = { phase: 'reveal', since: now };
                    sound.sakibare('high');
                    sound.play('fanfare');
                    wait(2800, () => { v.direct = null; });
                });
            }
        },

        [E.ZENCHO_START](e) {
            // AT 中の前兆は、AT の画面のままライバルが出てくる (画面設計書 5-5 の案)
            if (v.phase === 'at') {
                v.zencho = { team: e.team, cause: e.cause, since: now };
                sound.play('cutin');
                talk(rivalOf(e.team), 'intro', 900);
                return;
            }
            v.zencho = { team: e.team, cause: e.cause, since: now + 1300 };
            overlay('elevator', 1300, { from: v.stage.floor, to: null });
            sound.play('elevator');
            talk(rivalOf(e.team), 'intro', 2300);
        },

        [E.ZENCHO_BATTLE](e) {
            v.battle = { ...e, since: now, phase: 'clash' };
            after(650, () => sound.play('clash'));
        },

        [E.ZENCHO_END](e) {
            if (!e.win) {
                v.zencho = null;
                v.battle = null;
            }
        },

        [E.STAGE](e) {
            if (e.place === 'middle') {
                v.stage = { ...v.stage, place: 'middle' };
                return;
            }
            const from = v.stage.floor;
            const moved = from !== e.floor || v.stage.place !== 'floor';
            const next = { place: 'floor', floor: e.floor, state: e.state };
            if (!moved || v.phase !== 'normal') {
                v.stage = next;
            } else {
                // レア役のフラッシュを見せてから動く。扉が閉まりきったところで階を変える
                const delay = v.overlays.some(o => o.kind === 'flash') ? 700 : 0;
                after(delay + 450, () => { v.stage = next; });
                overlay('elevator', 1300, { from, to: e.floor }, delay);
                after(delay, () => sound.play('elevator'));
                after(delay + 1300, () => { v.navi = { line: naviLine(v.stage), since: now, until: now + 3500 }; });
            }
        },

        [E.ZONE](e) {
            v.zone = e.active;
        },

        [E.HEAVEN](e) {
            cutinOverlay('heaven', 1900, { who: e.who });
            sound.play('cutin');
        },

        [E.TENJO](e) {
            v.tenjo = { who: e.who, since: now };
            sound.play('fanfare');
            setButton('rainbow', { pop: true });
            wait(3200, () => { v.tenjo = null; });
        },

        [E.BONUS_STANDBY](e) {
            v.phase = 'standby';
            v.standby = { bonus: e.bonus, stock: e.stock };
            v.zencho = null;
            v.battle = null;
            v.zone = false;
            setButton('gold');
            sound.play('fanfare');
        },

        [E.BONUS_START](e) {
            v.phase = 'bonus';
            v.standby = null;
            const cards = e.bonus === 'big' ? BIG_CARDS : REG_CARDS;
            const cardStart = e.bonus === 'epbig' ? 0 : nextCard[e.bonus] % cards.length;
            // 解説は 1G に約1枚進むとして、次のボーナスはその続きから
            if (e.bonus !== 'epbig') nextCard[e.bonus] = cardStart + Math.ceil(e.games / 3);
            v.bonus = {
                bonus: e.bonus, games: e.games, left: e.games, payout: 0, since: now, cardStart,
                episode: e.bonus === 'epbig' ? nextEpisode() : 0,
                // エピソードBIG は AT 確定 (仕様書。AT 中は特化ゾーン確定)
                at: e.bonus === 'epbig', atLabel: atLabel(),
                inAt: Boolean(e.inAt), boss: null, tokka: e.inAt && e.bonus === 'epbig'
            };
            if (e.bonus === 'epbig') onEpisode(v.bonus.episode);
            setButton(e.bonus === 'epbig' ? 'rainbow' : 'gold');
            sound.play('fanfare');
            wait(ENTRY_MS - 400, () => setButton('white', { lit: false }));
        },

        [E.BONUS_GAME](e) {
            if (v.bonus) v.bonus.left = e.left;
            // 内部処理 v0.3: ボーナス中の押し順ベルのナビ (docs/events.md)。AT 中と同じく筐体のナビに出す (要確認)
            v.nav = e.nav || null;
            changed();
        },

        // 「こおりを狙え」カットイン。色は内部処理が抽選する (成功率は未定)。win は見せ方には使わず、リールの出目で判定する
        [E.BONUS_NERAE](e) {
            v.nerae = { color: e.color, win: e.win, stops: [null, null, null], order: [], pending: [], phase: 'aim', endAt: 0 };
            cutinOverlay('cutin', 1300, { color: e.color, who: neraeCutin(), line: 'こおりを狙え！' });   // 停止ボタンを押す前に抜ける長さ
            sound.play('cutin');
            if (e.color === 'gold' || e.color === 'rainbow') setButton(e.color, { pop: e.color === 'rainbow' });
        },

        [E.BONUS_END](e) {
            const b = v.bonus;
            v.bonusEnd = { bonus: e.bonus, payout: b ? b.payout : 0, at: e.at, stock: e.stock, inAt: Boolean(b && b.inAt), tokka: Boolean(b && (b.tokka || (b.inAt && b.at))), since: now };
            v.bonus = null;
            v.nerae = null;
            // AT 中のボーナスのあとは AT に戻る (AT のゲーム数はボーナスの間止まっていた)
            if (!e.at && !e.stock) v.phase = v.at ? 'at' : 'normal';
            sound.play(e.stock || e.at ? 'fanfare' : 'bonusEnd');
            if (e.stock) setButton('gold');
            wait(END_MS, () => { v.bonusEnd = null; });
        },

        [E.AT_START](e) {
            v.phase = 'at';
            v.at = { left: e.games, payout: 0, add: null, nav: null, adds: 0, addTotal: 0, best: 0 };
            v.atStart = { since: now, games: e.games };
            sound.play('fanfare');
            setButton('blue');
            wait(START_MS, () => {
                v.atStart = null;
                setButton('white', { lit: false });
            });
        },

        [E.AT_GAME](e) {
            if (v.at) {
                v.at.left = e.left;
                v.at.nav = e.nav;
            }
            v.nav = e.nav;
            // 順押しナビはボーナスか特化ゾーンの当選が確定 (仕様書): 確定音と虹色のボタン
            if (e.nav && e.nav[0] === 0) {
                after(200, () => sound.play('kakutei'));
                setButton('rainbow', { pop: true });
            }
            if (COUNT_AT.includes(e.left)) {
                v.atCount = { left: e.left, since: now };
                sound.play('count');
            }
            changed();
        },

        // 上乗せはレバーのときに届くが、レア役の出目を見せてから攻撃する (ゲームの終わりで startAttack)
        [E.AT_ADD](e) {
            v.pendingAdd = { ...e };
        },

        // 上乗せなしのレア役:「ミス！」(画面設計書 5-2)
        [E.AT_MISS](e) {
            v.pendingAdd = { ...e, miss: true, games: 0, left: v.at ? v.at.left : 0 };
        },

        // AT 中のボーナスの相手 (画面設計書 5-3): 登場 (final: false) / 勝利 (こおりくんが揃ったあと) / 敗北 (最後のゲーム)
        // 勝ちはこおりくんのとどめの必殺技のカットインのあと、負けは相手の必殺技のカットインのあとに結果
        [E.AT_BOSS](e) {
            if (v.bonus) v.bonus.boss = e.boss;
            const kind = !e.final ? 'intro' : e.win ? 'win' : 'lose';
            const show = () => {
                v.bossFx = { kind, boss: e.boss, since: now };
                if (kind === 'intro') {
                    sound.play('cutin');
                    talk(e.boss, 'intro', 800);
                } else {
                    sound.play(e.win ? 'win' : 'lose');
                    talk(e.boss, e.win ? 'lose' : 'win', 400);
                }
                if (kind === 'win') {
                    if (v.bonus) v.bonus.tokka = true;
                    after(500, () => sound.say && sound.say('特化ゾーン確定！'));
                    setButton('rainbow', { pop: true });
                }
                wait(BOSS_MS[kind], () => {
                    v.bossFx = null;
                    setButton('white', { lit: false });
                });
            };
            if (kind === 'win') specialCut('koori', 'ally', (e.boss === 'maou' ? FINISHERS.maou : FINISHERS.boss).name, show);
            else if (kind === 'lose') enemySpecial(e.boss, show);
            else show();
        },

        // AT 0G の当落告知「ラストジャッジ」(画面設計書 5-4): PUSH (押さなくても進む) で結果
        [E.AT_JUDGE](e) {
            v.judge = { team: v.zencho ? v.zencho.team : 'fiveDX', win: e.win, bonus: e.bonus, phase: 'intro', since: now };
            v.zencho = null;
            v.battle = null;
            v.nav = null;
            sound.play('blackout');
            setButton('red', { pop: true });
            hold = { push: 'judge', timeout: now + JUDGE_WAIT_MS };
        },

        // ----- 上乗せ特化ゾーン (画面設計書 6章。イベントは docs/events.md 5-5 の案) -----
        // 当選: すぐにフリーズ風の「特化ゾーン ストック！」(仕様書: 当選ゲームで即座にストックを告知)
        [E.TOKKA_STOCK](e) {
            v.tokkaFx = { since: now, stock: e.stock };
            after(450, () => sound.play('kakutei'));
            setButton('rainbow', { pop: true });
            wait(STOCK_MS, () => {
                v.tokkaFx = null;
                setButton('white', { lit: false });
            });
        },

        // 始まり: パターンを選ぶ画面 (停止ボタンの左・右か画面のタップで選んで、PUSH で決める。10秒で自動)
        [E.TOKKA_START]() {
            v.tokka = {
                pattern: null, choice: savedPattern(), set: 1, games: [], gained: false, guarantee: 0,
                phase: 'select', since: now, shownTotal: 0, pop: null, kakuteiAt: 0, result: null, pending: null
            };
            setButton('gold', { pop: true });
            sound.play('cutin');
            hold = { push: 'select', timeout: now + SELECT_MS };
        },

        [E.TOKKA_GAME](e) {
            const z = v.tokka;
            if (!z) return;
            z.pending = { ...e };
            // おかランプ: リプレイ以上を引いたゲームは、レバーの瞬間にランプが真っ赤に点灯。
            // 100G 以上の上乗せも点灯し、25% で虹色 (3桁の上乗せの告知。2026-10-21 ユーザー指定)
            if (z.pattern === 'okaLamp') {
                const big = e.add >= 100;
                const color = big && Math.random() < OKA_RAINBOW_RATE ? 'rainbow' : e.hit || big ? 'red' : null;
                z.lamp = color ? { color, at: now } : null;
                if (color) {
                    sound.play(color === 'rainbow' ? 'flashRainbow' : 'lamp');
                    setButton(color === 'rainbow' ? 'rainbow' : 'red', { pop: color === 'rainbow' });
                }
            }
            // 内部処理 v0.3: 特化ゾーン中の押し順ベルのナビ (docs/events.md)。AT 中と同じく筐体のナビに出す (要確認)
            v.nav = e.nav || null;
            changed();
        },

        [E.TOKKA_SET](e) {
            const z = v.tokka;
            if (!z) return;
            if (z.pattern !== 'maou') return showTokkaResult(e);
            // 魔王の褒美: 宝箱を1つずつ開けて、まとめて結果を出す。継続確定が入っていたら虹フラッシュ
            z.phase = 'open';
            z.since = now;
            z.games.forEach((g, i) => after(i * OPEN_STEP_MS, () => {
                sound.play(g.add >= 100 ? 'addBig' : g.add >= 30 ? 'addMid' : 'addSmall');
                z.shownTotal += g.add;
            }));
            if (z.gained) after(3 * OPEN_STEP_MS, () => sound.play('flashRainbow'));
            wait(3 * OPEN_STEP_MS + (z.gained ? 1100 : 300), () => showTokkaResult(e));
        },

        [E.TOKKA_END](e) {
            const z = v.tokka;
            v.tokkaEnd = { pattern: z ? z.pattern || 'maou' : 'maou', total: e.total, sets: e.sets, left: e.left, since: now };
            if (v.at) {
                v.at.left = e.left;
                v.at.addTotal += e.total;
                v.at.best = Math.max(v.at.best, e.total);
            }
            sound.play('addBig');
            wait(TOKKA_END_MS, () => {
                v.tokkaEnd = null;
                if (v.tokka === z) v.tokka = null;
            });
        },

        [E.AT_END](e) {
            const a = v.at || { adds: 0, addTotal: 0, best: 0 };
            v.atEnd = { games: e.games, payout: e.payout, adds: a.adds, addTotal: a.addTotal, best: a.best, hint: e.hint || 'team', trophy: e.trophy || null, since: now };
            v.zencho = null;
            v.battle = null;
            v.at = null;
            v.nav = null;
            v.atCount = null;
            v.phase = 'normal';
            sound.play('atEnd');
            if (e.trophy) after(1300, () => sound.play(e.trophy === 'rainbow' ? 'flashRainbow' : 'kakutei'));
            changed();
            wait(AT_END_MS, () => { v.atEnd = null; });
        }
    };

    function handle(e) {
        const fn = handlers[e.type];
        if (fn) fn(e);
    }

    function pump() {
        while (!hold && !reelHold && queue.length) handle(queue.shift());
        changed();
    }

    // ラストジャッジの結果を見せる
    function revealJudge() {
        const j = v.judge;
        hold = null;
        const foe = rivalOf(j.team);
        const show = () => {
            j.phase = 'result';
            j.since = now;
            sound.play(j.win ? 'win' : 'lose');
            talk(foe, j.win ? 'lose' : 'win', 400);
            setButton(j.win ? 'rainbow' : 'white', { lit: j.win, pop: j.win });
            wait(JUDGE_RESULT_MS, () => {
                v.judge = null;
                setButton('white', { lit: false });
            });
        };
        if (j.win) specialCut('koori', 'ally', FINISHERS.default.name, show);
        else enemySpecial(foe, show);
    }

    // 前兆の最後のバトルの結果を見せる
    // 勝ちはこおりくんのとどめの必殺技、負けは相手の必殺技のカットインのあとに結果
    function revealBattle() {
        const b = v.battle;
        hold = null;
        const foe = rivalOf(v.zencho ? v.zencho.team : 'fiveDX');
        const show = () => {
            b.phase = 'result';
            b.resultAt = now;
            sound.play(b.win ? 'win' : 'lose');
            talk(foe, b.win ? 'lose' : 'win', 300);
            setButton(b.win ? 'rainbow' : 'white', { lit: b.win });
            wait(b.win ? 1800 : 1600);
        };
        if (b.win) specialCut('koori', 'ally', FINISHERS.default.name, show);
        else enemySpecial(foe, show);
    }

    function bgmFor() {
        if (now < v.muteUntil) return null;   // 違和感演出 (無音)
        if (v.bonusEnd) return v.bonusEnd.at || v.bonusEnd.stock ? 'bonus' : null;
        // 画面設計書 7-2: BIG 豪華な曲 / REG 短い明るい曲 / エピソードBIG しっとりした曲
        if (v.phase === 'bonus' && v.bonus) return { big: 'bonus', reg: 'reg', epbig: 'epbig' }[v.bonus.bonus];
        if (v.phase === 'bonus' || v.phase === 'standby') return 'bonus';
        if (v.atEnd) return 'atEnd';
        // 画面設計書 7-2: 魔王の褒美 不気味で豪華な曲 / こおり大腸炎 ドタバタした曲
        if (v.tokka && v.tokka.pattern && !v.tokkaEnd) return { maou: 'tokkaMaou', okaLamp: 'tokkaOkaLamp', daichoen: 'tokkaDaichoen' }[v.tokka.pattern];
        if (v.phase === 'at' && v.zencho) return 'zencho';
        if (v.phase === 'at') return 'at';
        if (v.zencho) return 'zencho';
        if (v.stage.state === 'super') return 'super';
        if (v.stage.state === 'high') return 'high';
        return 'low';
    }

    function update(t) {
        now = t;
        for (let i = timers.length - 1; i >= 0; i--) {
            if (t >= timers[i].at) {
                const { fn } = timers[i];
                timers.splice(i, 1);
                fn();
            }
        }
        if (hold && hold.until && t >= hold.until) {
            const then = hold.then;
            hold = null;
            if (then) then();
        }
        if (hold && hold.push && t >= hold.timeout) {
            if (hold.push === 'battle') revealBattle();
            else if (hold.push === 'judge') revealJudge();
            else if (hold.push === 'select') confirmTokka();
            else hitAttack();
        }
        // コオリハンマー: 押しているあいだゲージがたまる
        if (hold && hold.push === 'attack' && pressing && ATTACKS[v.attack.attacker].button === 'long') {
            v.attack.gauge = Math.min(1, v.attack.gauge + (t - (v.attack.lastTick || t)) / LONG_PRESS_MS);
            if (v.attack.gauge >= 1) hitAttack();
        }
        if (v.attack) v.attack.lastTick = t;
        if (v.atCount && t - v.atCount.since > COUNT_MS) v.atCount = null;
        flushNerae();
        if (!hold && !reelHold && queue.length) pump();
        v.overlays = v.overlays.filter(o => o.until > t);
        if (v.navi && v.navi.until < t) v.navi = null;
        sound.bgm(bgmFor());
    }

    // はけていくカットイン: 右へずらしながら薄くする (o.leaveAt から LEAVE_MS で消える)
    function leaving(ctx, t, o) {
        if (!o.leaveAt) return;
        const k = Math.min(1, (t - o.leaveAt) / LEAVE_MS);
        ctx.translate(k * k * W, 0);
        ctx.globalAlpha *= 1 - k;
    }

    function draw(ctx, t) {
        update(t);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, H);
        ctx.clip();
        // 場面
        if (v.phase === 'standby' && v.standby) drawStandby(ctx, t, v.standby);
        else if (v.phase === 'bonus' && v.bonus) drawBonusScreen(ctx, t, v.bonus);
        else if (v.phase === 'at' && v.at) {
            const z = v.tokka;
            if (z && z.phase === 'select') drawTokkaSelect(ctx, t, z.choice, hold && hold.push === 'select' ? hold.timeout - t : 0);
            else if (z && z.phase === 'intro') drawTokkaIntro(ctx, t, t - z.since, z.pattern);
            else if (z && z.pattern) drawTokka(ctx, t, z);
            else if (v.attack) drawAttack(ctx, t, v.attack);
            else if (v.battle && v.zencho) {
                drawBattle(ctx, t, v.zencho, v.battle);
                atBadge(ctx, v.at.left);
            } else if (v.zencho) {
                drawMiddle(ctx, t, v.zencho);
                atBadge(ctx, v.at.left);
            } else {
                v.at.navOdd = v.navOdd && v.navOdd.until > t ? v.navOdd.type : null;
                drawAtMain(ctx, t, v.at);
            }
            if (v.atCount && !v.attack) drawAtCount(ctx, t, t - v.atCount.since, v.atCount.left);
            if (v.atStart) drawAtStart(ctx, t, t - v.atStart.since, v.atStart.games);
        }
        else if (v.battle && v.zencho) drawBattle(ctx, t, v.zencho, v.battle);
        else if (v.zencho && t >= v.zencho.since - 650) drawMiddle(ctx, t, v.zencho);
        else drawFloor(ctx, t, v.stage);
        if (v.zone && v.phase === 'normal' && !(v.battle && v.battle.phase === 'result')) haze(ctx);
        if (v.navi && v.phase === 'normal' && !v.zencho) drawNavi(ctx, v.navi.line, t - v.navi.since);
        // 重ねる演出 (エレベーター → カットイン → フラッシュの順に上へ重ねる)
        const order = ['elevator', 'heaven', 'cutin', 'flash'];
        v.overlays.slice().sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind)).forEach(o => {
            const since = t - o.since;
            if (since < 0) return;
            ctx.save();
            leaving(ctx, t, o);
            if (o.kind === 'elevator') drawElevator(ctx, since, o.from, o.to);
            else if (o.kind === 'cutin') drawCutin(ctx, since, o.color, o.who || 'koori', o.line);
            else if (o.kind === 'heaven') drawHeaven(ctx, since, o.who);
            else if (o.kind === 'flash') drawFlash(ctx, since, o.level);
            ctx.restore();
        });
        // 「こおりを狙え」はカットインが抜けてから
        if (v.nerae && !v.overlays.some(o => o.kind === 'cutin')) drawNerae(ctx, t, v.nerae);
        if (v.kakutei) drawAtKakutei(ctx, t, t - v.kakutei.since, v.kakutei.label);
        if (v.bonusEnd) drawBonusEnd(ctx, t, t - v.bonusEnd.since, v.bonusEnd);
        if (v.tokkaEnd) drawTokkaEnd(ctx, t, t - v.tokkaEnd.since, v.tokkaEnd);
        if (v.tokkaFx) drawTokkaStock(ctx, t, t - v.tokkaFx.since, v.tokkaFx.stock);
        if (v.bossFx) drawBossFx(ctx, t, v.bossFx);
        if (v.judge) drawAtJudge(ctx, t, v.judge);
        if (v.spCutOld) {
            if (t - v.spCutOld.leaveAt > LEAVE_MS) v.spCutOld = null;
            else {
                ctx.save();
                leaving(ctx, t, v.spCutOld);
                drawSpecialCutin(ctx, t, Math.min(t - v.spCutOld.since, CUTIN_MS - 200), v.spCutOld);
                ctx.restore();
            }
        }
        if (v.spCut) {
            ctx.save();
            leaving(ctx, t, v.spCut);
            if (!(v.spCut.leaveAt && t - v.spCut.leaveAt > LEAVE_MS)) drawSpecialCutin(ctx, t, t - v.spCut.since, v.spCut);
            ctx.restore();
        }
        if (v.talk && !v.spCut && t - v.talk.since < TALK_MS) drawTalk(ctx, t, t - v.talk.since, v.talk);
        if (v.atEnd) drawAtEnd(ctx, t, t - v.atEnd.since, v.atEnd);
        if (v.tenjo) drawTenjo(ctx, t, t - v.tenjo.since, v.tenjo.who);
        if (v.direct) drawDirect(ctx, t, t - v.direct.since, v.direct.phase);
        // 押し順ナビの警告 (ナビに従ってください)
        if (v.navWarn && t - v.navWarn.since < NAV_WARN_MS) {
            const k = t - v.navWarn.since;
            const blink = Math.floor(k / 160) % 2 === 0;
            rect(ctx, 0, 62, W, 44, `rgba(120,0,10,${blink ? 0.88 : 0.7})`);
            rect(ctx, 0, 62, W, 2, '#ff3a3a');
            rect(ctx, 0, 104, W, 2, '#ff3a3a');
            text(ctx, '⚠ ナビに従ってください', W / 2, 84, { size: 18, color: '#ffffff', lw: 4, stroke: '#3a0008' });
        }
        drawIwakan(ctx, t);
        if (v.banner) {
            rect(ctx, 0, 70, W, 40, 'rgba(0,0,0,.75)');
            text(ctx, v.banner.text, W / 2, 90, { size: 16, color: v.banner.rainbow ? rainbow(ctx, 60, 0, 260, 0) : '#ffffff', lw: 4 });
        }
        ctx.restore();
    }

    function snapshot() {
        const navOdd = v.navOdd && v.navOdd.until > now ? v.navOdd.type : null;
        return { button: v.button, nav: v.nav, navOdd, credit: v.credit, lastPayout: v.lastPayout, phase: v.phase, waitingPush: Boolean(hold && hold.push), selecting: Boolean(hold && hold.push === 'select') };
    }

    return {
        // 内部処理のイベントを受け取る
        receive(e) {
            queue.push(e);
            if (!hold && !reelHold) pump();
        },
        // 最後のリールを止める前に呼ぶ (止まりきるまで、そのゲームの結果を見せない)
        holdForReels() {
            reelHold = true;
        },
        reelsSettled() {
            if (reelHold) {
                reelHold = false;
                if (!hold) pump();
            }
        },
        // 押し順ナビとちがうリールを押した
        navWarning() {
            v.navWarn = { since: now };
            sound.play('warn');
        },
        // PUSH ボタン
        push() {
            pressing = true;
            if (hold && hold.push === 'select') {
                sound.play('push');
                confirmTokka();
                return true;
            }
            if (hold && hold.push === 'attack') {
                attackPush();
                return true;
            }
            if (hold && hold.push === 'judge') {
                sound.play('push');
                revealJudge();
                return true;
            }
            if (hold && hold.push) {
                sound.play('push');
                revealBattle();
                return true;
            }
            sound.play('push');
            return false;
        },
        // 特化ゾーンのパターンを選ぶ。side: 'left' (魔王の褒美) / 'right' (こおり大腸炎)
        // side: 'left' (魔王の褒美) / 'middle' (おかランプ) / 'right' (こおり大腸炎)
        select(side) {
            if (!(hold && hold.push === 'select')) return false;
            const next = { left: 'maou', middle: 'okaLamp', right: 'daichoen' }[side] || 'maou';
            if (v.tokka.choice !== next) sound.play('stop');
            v.tokka.choice = next;
            return true;
        },
        // PUSH ボタンを離した (コオリハンマーの長押しを止める)
        release() {
            pressing = false;
        },
        busy: () => Boolean(hold) || reelHold || queue.length > 0,
        draw,
        snapshot,
        view: v
    };
}

export { TEAMS };
