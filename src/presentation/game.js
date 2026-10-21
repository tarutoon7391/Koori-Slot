// =====================================================================
// 台をつなぐところ (内部処理・演出の進行役・リール・音)
// ---------------------------------------------------------------------
// 内部処理は ../logic/index.js の createMachine だけを使う (本物と入れ替えるときはそこを差しかえる)。
// 操作 (レバー・停止・PUSH) はここを通して内部処理に伝え、内部処理のイベントは進行役 (director) に渡す。
// =====================================================================

import { createMachine, EVENTS, STRIPS } from '../logic/index.js';
import { createDirector } from './lcd/director.js';
import { createReelView } from './reels/reelView.js';
import { Sound } from './sound/sound.js';

const MIN_SPIN_MS = 250;   // レバーから停止ボタンが効くまで
const KEEP_MS = 1500;      // まだ押せないときに押された操作を覚えておく時間

export function createGame({ setting = 1 } = {}) {
    const machine = createMachine({ setting });
    const reels = createReelView(STRIPS);
    const listeners = new Set();
    const notify = () => listeners.forEach(fn => fn());
    const director = createDirector({ sound: Sound, reels, onChange: notify });
    machine.on(e => director.receive(e));

    let stopped = [true, true, true];
    let spunAt = 0;
    let auto = false;
    let autoTimer = 0;
    // まだ押せないとき (リールが止まりきる前・回り始めた直後など) に押された操作。押せるようになったら押した順に実行する
    let pending = [];   // { kind: 'lever' | 'stop', reel, at }

    function canLever() {
        return !director.busy() && !reels.anyMoving() && stopped.every(Boolean);
    }

    // 同じ操作を続けて覚えない (同じボタンの連打は1回)
    function keep(action) {
        const last = pending[pending.length - 1];
        if (!last || last.kind !== action.kind || last.reel !== action.reel) pending.push({ ...action, at: performance.now() });
    }

    // 覚えておいた操作を実行する (ずっと呼ばれている)
    function flushPending() {
        const t = performance.now();
        pending = pending.filter(p => t - p.at <= KEEP_MS);
        while (pending.length) {
            const p = pending[0];
            if (p.kind === 'lever') {
                if (!canLever()) return;
                pending.shift();
                lever();
            } else {
                if (stopped[p.reel]) {
                    pending.shift();   // もう止まっている
                    continue;
                }
                if (t - spunAt < MIN_SPIN_MS) return;
                pending.shift();
                stop(p.reel, true);
            }
        }
    }
    setInterval(flushPending, 16);

    function lever() {
        Sound.unlock();
        // PUSH 待ちのときは、レバーを PUSH として扱う
        if (director.snapshot().waitingPush) {
            push();
            return false;
        }
        if (!canLever()) {
            keep({ kind: 'lever' });
            return false;
        }
        if (!machine.lever()) return false;
        stopped = [false, false, false];
        spunAt = performance.now();
        reels.spin();
        notify();
        return true;
    }

    // fromQueue: 覚えておいた操作を実行するとき (順番待ちをしない)
    function stop(reel, fromQueue = false) {
        Sound.unlock();
        // 特化ゾーンのパターンを選んでいるあいだは、左・右の停止ボタンで選ぶ
        if (director.snapshot().selecting) {
            if (reel !== 1) director.select(reel === 0 ? 'left' : 'right');
            notify();
            return false;
        }
        if (stopped[reel]) {
            // 前のレバーを待っているあいだに押されたら、覚えておく
            if (pending.some(p => p.kind === 'lever')) keep({ kind: 'stop', reel });
            return false;
        }
        if (!fromQueue && (performance.now() - spunAt < MIN_SPIN_MS || pending.length)) {
            keep({ kind: 'stop', reel });
            return false;
        }
        const last = stopped.filter(Boolean).length === 2;
        if (last) director.holdForReels();
        const press = reels.pressIndex(reel);
        const top = machine.stop(reel, press);
        if (top === null) return false;
        stopped[reel] = true;
        reels.stopAt(reel, top);
        if (last) reels.whenSettled(() => director.reelsSettled());
        notify();
        return true;
    }

    // レバーか、次の停止 (左から順)。順番待ちの操作も数に入れて、次に押すものを決める
    function next() {
        // 最後のレバーよりあとに覚えている停止 (レバーがなければ全部)
        const afterLever = pending.slice(pending.map(p => p.kind).lastIndexOf('lever') + 1);
        const queued = reel => afterLever.some(p => p.kind === 'stop' && p.reel === reel);
        if (pending.some(p => p.kind === 'lever')) {
            // 次のゲームのレバーを待っているあいだ: 次のゲームの停止として覚える
            const i = [0, 1, 2].find(r => !queued(r));
            if (i !== undefined) keep({ kind: 'stop', reel: i });
            return false;
        }
        const i = [0, 1, 2].find(r => !stopped[r] && !queued(r));
        if (i !== undefined) return stop(i);
        if (!stopped.every(Boolean)) return false;   // 残りの停止は順番待ち
        return lever();
    }

    function push() {
        Sound.unlock();
        director.push();
        notify();
    }

    // 液晶をタップした (x: 左端 0 〜 右端 1)。特化ゾーンのパターンを選ぶときに使う
    function tapLcd(x) {
        Sound.unlock();
        if (director.select(x < 0.5 ? 'left' : 'right')) notify();
    }

    // PUSH ボタンを離した (長押しの演出で使う)
    function release() {
        director.release();
    }

    // オート (確認用): 一定の間隔でレバー・停止・PUSH を押す
    function autoStep() {
        if (!auto) return;
        if (director.snapshot().waitingPush) push();
        else next();
        autoTimer = setTimeout(autoStep, 180 + Math.random() * 120);
    }

    // 確認用の URL の指定 (例: ?state=high&zencho=real&team=muscle&auto=1)。README に一覧がある
    function applyQuery(search) {
        const q = new URLSearchParams(search);
        const d = machine.debug;
        if (q.get('mode')) d.setMode(q.get('mode'));
        if (q.get('state')) d.setState(q.get('state'));
        if (q.get('games')) d.setGames(Number(q.get('games')));
        if (q.get('zencho')) d.startZencho({ real: q.get('zencho') !== 'gase', team: q.get('team'), length: Number(q.get('length')) || 8 });
        if (q.get('ceiling')) d.ceilingSoon();
        if (q.get('direct')) d.direct();
        if (q.get('bonus')) d.bonus(q.get('bonus'));
        if (q.get('role')) d.setNextRole(q.get('role'));
        // ボーナスの最初のゲームの役 (例: ?bonus=big&bonusrole=midCherry で「こおりを狙え」を見る)
        if (q.get('bonusrole')) {
            const off = machine.on(e => {
                if (e.type !== EVENTS.BONUS_START) return;
                d.setNextRole(q.get('bonusrole'));
                off();
            });
        }
        // 特化ゾーン (例: ?tokka=1 で AT 直撃のあと特化ゾーンをストック)
        if (q.get('tokka')) {
            d.direct();
            const off = machine.on(e => {
                if (e.type !== EVENTS.AT_START) return;
                d.tokka();
                off();
            });
        }
        if (q.get('auto')) setTimeout(() => game.setAuto(true), 300);
    }

    const game = {
        machine,
        director,
        reels,
        lever,
        stop,
        next,
        push,
        release,
        tapLcd,
        subscribe(fn) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
        get stopped() { return stopped.slice(); },
        get auto() { return auto; },
        setAuto(on) {
            auto = on;
            clearTimeout(autoTimer);
            if (on) autoStep();
            notify();
        },
        applyQuery
    };
    return game;
}
