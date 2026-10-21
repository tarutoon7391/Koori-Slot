// =====================================================================
// 効果音と BGM (Web Audio。パチンコ版と同じ作り)
// ---------------------------------------------------------------------
// ブラウザは、画面を一度さわる・キーを押すまで音を出せないので、そのときに Sound.unlock() で準備する。
// 先バレ音はパチンコ版の録音 (sound/assets/heso.m4a の 1.3〜3.5秒、4倍の音量)。AT 直撃は高くして鳴らす。
// =====================================================================

import { BGM_TRACKS } from './tracks.js';
// 先バレ音の録音。?inline で data: の URL にして、ファイルを直接開いても読めるようにする
import hesoUrl from './assets/heso.m4a?inline';

let ctx = null;
let master = null;
let bgmGain = null;
let voice = null;
let muted = false;
try { muted = localStorage.getItem('koori-slot-muted') === '1'; } catch (e) { /* 保存できない環境 */ }

const VOICE = { start: 1.3, end: 3.5, gain: 4 };

function unlock() {
    if (ctx) {
        if (ctx.state === 'suspended') ctx.resume();
        return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
    bgmGain = ctx.createGain();
    bgmGain.gain.value = 0.06;
    bgmGain.connect(master);
    fetch(hesoUrl)
        .then(r => r.arrayBuffer())
        .then(buf => ctx.decodeAudioData(buf))
        .then(b => { voice = b; })
        .catch(() => { voice = null; });
    setInterval(schedule, 25);
}

// 1つの音: 周波数 freq (Hz)、start 秒後から length 秒。slideTo で音の高さを変える
function tone(freq, start, length, { type = 'square', volume = 0.08, slideTo = null } = {}) {
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + length);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + length + 0.02);
}

// ザーッという音 (ノイズ)
function noise(start, length, volume = 0.08) {
    const t0 = ctx.currentTime + start;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * length), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buf;
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
    src.connect(gain).connect(master);
    src.start(t0);
}

const SOUNDS = {
    lever: () => tone(392, 0, 0.08, { volume: 0.05 }),
    stop: () => tone(660, 0, 0.05, { volume: 0.05 }),
    bet: () => tone(988, 0, 0.04, { volume: 0.03, type: 'triangle' }),
    payout: () => [1319, 1568].forEach((f, i) => tone(f, i * 0.05, 0.06, { volume: 0.03 })),
    replay: () => [784, 1047].forEach((f, i) => tone(f, i * 0.06, 0.08, { volume: 0.04, type: 'triangle' })),
    flashSmall: () => tone(1760, 0, 0.12, { volume: 0.05, type: 'triangle' }),
    flashBig: () => { tone(1568, 0, 0.1); tone(2093, 0.1, 0.25); },
    flashRainbow: () => [1047, 1319, 1568, 2093, 2637].forEach((f, i) => tone(f, i * 0.06, 0.3, { volume: 0.07 })),
    kakutei: () => { tone(2637, 0, 0.12, { volume: 0.08 }); tone(3136, 0.14, 0.18, { volume: 0.08 }); tone(3520, 0.34, 0.4, { volume: 0.08 }); },
    cutin: () => tone(330, 0, 0.25, { slideTo: 1320, volume: 0.06, type: 'sawtooth' }),
    push: () => tone(1568, 0, 0.1, { volume: 0.06 }),
    clash: () => { noise(0, 0.15, 0.1); tone(220, 0, 0.15, { slideTo: 880, volume: 0.05, type: 'sawtooth' }); },
    win: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.11, 0.2, { volume: 0.08 })),
    lose: () => [392, 330, 262].forEach((f, i) => tone(f, i * 0.18, 0.25, { volume: 0.06, type: 'triangle' })),
    elevator: () => [1319, 1047].forEach((f, i) => tone(f, i * 0.3, 0.4, { volume: 0.05, type: 'sine' })),
    noise: () => noise(0, 1.2, 0.06),
    blackout: () => tone(110, 0, 0.8, { slideTo: 40, volume: 0.1, type: 'sawtooth' }),
    fanfare: () => [784, 784, 784, 1047, 988, 1047, 1319].forEach((f, i) => tone(f, i * 0.12, 0.22, { volume: 0.08 })),
    count: () => tone(880, 0, 0.12, { volume: 0.06 }),
    // 「こおりを狙え」: テンパイ (あおる音) / こおりくん揃い / AT確定 (専用の当たり音。声の代わり。画面設計書 7-2)
    tenpai: () => [0, 0.16, 0.32].forEach(s => tone(880, s, 0.12, { slideTo: 1760, volume: 0.06, type: 'sawtooth' })),
    kooriAlign: () => { noise(0, 0.25, 0.12); tone(2093, 0, 0.5, { volume: 0.09 }); tone(3136, 0.05, 0.6, { volume: 0.06, type: 'triangle' }); },
    atKakutei: () => {
        [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, i * 0.07, 0.25, { volume: 0.08 }));
        [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, 0.45 + i * 0.07, 0.4, { volume: 0.07, type: 'triangle' }));
        tone(523, 0.45, 1.2, { volume: 0.06, type: 'sawtooth' });
    },
    // 上乗せ音 (大きさで3段階。画面設計書 7-2): 〜30G / 50G / 100G 以上
    addSmall: () => [1319, 1760].forEach((f, i) => tone(f, i * 0.08, 0.15, { volume: 0.07 })),
    addMid: () => [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, i * 0.07, 0.2, { volume: 0.08 })),
    addBig: () => {
        [1047, 1319, 1568, 2093, 2637, 3136].forEach((f, i) => tone(f, i * 0.06, 0.3, { volume: 0.08 }));
        tone(262, 0, 1, { slideTo: 1047, volume: 0.06, type: 'sawtooth' });
    },
    // AT 終了
    atEnd: () => [784, 659, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.16, 0.3, { volume: 0.06, type: 'triangle' })),
    // ボーナス終了 (AT にも 1G連 にもならないとき)
    bonusEnd: () => [1047, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.22, { volume: 0.06, type: 'triangle' }))
};

function play(name) {
    if (!ctx || ctx.state !== 'running' || !SOUNDS[name]) return;
    SOUNDS[name]();
}

// 先バレ音。pitch: 'normal' / 'high' (AT 直撃: 高くした音)
function sakibare(pitch = 'normal') {
    if (!ctx || ctx.state !== 'running') return;
    if (!voice) {
        SOUNDS.kakutei();
        return;
    }
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = voice;
    src.playbackRate.value = pitch === 'high' ? 1.45 : 1;
    gain.gain.value = VOICE.gain;
    src.connect(gain).connect(master);
    src.start(0, VOICE.start, VOICE.end - VOICE.start);
}

// ----- BGM -----
const NOTE_INDEX = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
let track = null;
let step = 0;
let nextTime = 0;

function frequency(note) {
    const m = /^([A-G]#?)(\d)$/.exec(note);
    const midi = (Number(m[2]) + 1) * 12 + NOTE_INDEX[m[1]];
    return 440 * Math.pow(2, (midi - 69) / 12);
}

function bgmNote(freq, type, time, duration, level) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(level, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain).connect(bgmGain);
    osc.start(time);
    osc.stop(time + duration + 0.02);
}

function schedule() {
    if (!ctx || !track || ctx.state !== 'running') return;
    const t = BGM_TRACKS[track];
    const stepDur = 60 / t.bpm / 2;
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
    while (nextTime < ctx.currentTime + 0.15) {
        const m = t.melody[step % t.melody.length];
        const b = t.bass[step % t.bass.length];
        if (m !== '.') bgmNote(frequency(m), 'square', nextTime, stepDur * 0.9, 0.35);
        if (b !== '.') bgmNote(frequency(b), 'triangle', nextTime, stepDur * 0.95, 0.8);
        nextTime += stepDur;
        step++;
    }
}

// 曲を切り替える (同じ曲なら何もしない。null で止める)
function bgm(name) {
    if (track === name) return;
    track = name;
    step = 0;
    if (ctx) nextTime = ctx.currentTime + 0.1;
}

function setMuted(on) {
    muted = on;
    if (master) master.gain.setTargetAtTime(on ? 0 : 1, ctx.currentTime, 0.02);
    try { localStorage.setItem('koori-slot-muted', on ? '1' : '0'); } catch (e) { /* 無視 */ }
}

// 声: ブラウザの読み上げ (日本語の声があるときだけ。ないときは何もしない = 効果音だけ)。画面設計書 7-2・8章 10
// 「AT確定！」などの当たりの声に使う。音を消しているときは読まない
function say(words) {
    if (muted || typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') return;
    const voice = speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith('ja'));
    if (!voice) return;
    const u = new SpeechSynthesisUtterance(words);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 1.15;
    u.pitch = 1.4;
    u.volume = 1;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
}
// 声の一覧は後から読みこまれることがあるので、先に一度たずねておく
if (typeof speechSynthesis !== 'undefined') speechSynthesis.getVoices();

export const Sound = { unlock, play, sakibare, bgm, say, setMuted, get muted() { return muted; } };
