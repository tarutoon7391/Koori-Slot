// =====================================================================
// 図鑑・実績・記録 (前作の図鑑をもとに、今作に合わせて作った。画面設計書 10章)
// ---------------------------------------------------------------------
// 内部処理のイベントを見て「会った・倒した・見た」を数え、このブラウザに保存する (localStorage)。
// 期待度や結果には関係しないので演出側だけで完結する。ただしトロフィーの色は内部処理が抽選する (at:end の trophy)。
// 保存できない環境では保存なしで動く。
// =====================================================================

import { CHARACTERS } from '../art/characters.js';
import { EPISODES } from '../lcd/bonusStory.js';
import { HINTS } from '../lcd/at.js';

const KEY = 'koori-slot-zukan';

// 設定示唆トロフィー (前作と同じ色と意味。AT が終わったときに出る。どの色かは内部処理の at:end の trophy)
export const TROPHIES = [
    { id: 'white', name: '白', hint: '示唆なし（設定1以上）', color: '#f4f6f8' },
    { id: 'blue', name: '青', hint: '設定2以上', color: '#3a86ff' },
    { id: 'green', name: '緑', hint: '設定3以上', color: '#40c060' },
    { id: 'purple', name: '紫', hint: '設定4以上', color: '#a060ff' },
    { id: 'red', name: '赤', hint: '設定5以上', color: '#ff3a4a' },
    { id: 'rainbow', name: '虹', hint: '設定6確定', color: 'rainbow' }
];

// 技 (AT の上乗せの攻撃。名前は前作の必殺技と、こおりくんの武器)
export const SPECIALS = [
    { id: 'yasu', name: 'やすパンチ', who: 'yasu' },
    { id: 'tamu', name: 'たむキック', who: 'tamu' },
    { id: 'dake', name: 'だけチョップ', who: 'dake' },
    { id: 'onioni', name: '鬼鬼の金棒', who: 'onioni' },
    { id: 'sword', name: 'コオリソード', who: 'koori' },
    { id: 'hammer', name: 'コオリハンマー', who: 'koori' },
    { id: 'kill', name: '四天王絶対殺す剣', who: 'koori' }
];

// 説明が見られるようになる (解禁) 条件。敵は倒したら、ほかは会ったら
const DEFEAT_GROUPS = ['チーム5DX', 'チームASK-3', 'チームお願いマッスル', '住み着いた敵', 'ASO四天王', '大魔王'];
export const UNLOCK_HINT = {
    'ばりきつよめ': 'AT「こおりバトルRASH」に入ると仲間になる',
    'ナビ': '摩天楼を上ると会える（ともいしはエピソードBIG）',
    'チーム5DX': '前兆でチーム5DX を倒す',
    'チームASK-3': '前兆でチームASK-3 を倒す',
    'チームお願いマッスル': '前兆でチームお願いマッスルを倒す',
    '住み着いた敵': 'AT の上乗せで倒す',
    'ASO四天王': 'AT 中のボーナスで勝つ',
    '大魔王': 'AT 中のボーナスで勝つ',
    '天国・天井': '天国や天井で会える'
};

const TEAM_MEMBERS = { fiveDX: ['okagappa', 'hibikimakuri', 'yamamou'], ask3: ['sasaki', 'kotani', 'asahara'], muscle: ['shibata', 'ikekimu', 'ueno'] };
const SHITENNO = ['daishi', 'zumitani', 'runaya', 'nozoema'];

// 実績。stat の値が value 以上で解除 ('all' はその種類を全部)
export const ACHIEVEMENTS = [
    { id: 'firstAt', name: 'はじめてのRASH', desc: 'AT「こおりバトルRASH」に入る', stat: 'count:at', value: 1 },
    { id: 'at10', name: 'RASH常連', desc: 'AT に合計10回入る', stat: 'count:at', value: 10 },
    { id: 'direct', name: 'こおりいきていける！', desc: 'AT 直撃を引く', stat: 'count:direct', value: 1 },
    { id: 'tenjo', name: '天井到達', desc: '天井に着く', stat: 'count:tenjo', value: 1 },
    { id: 'tenjoAruaru', name: '兄の贈り物', desc: '天井でアルアルに会う', stat: 'count:tenjoAruaru', value: 1 },
    { id: 'heaven', name: '天国からの知らせ', desc: '天国のカットインを見る', stat: 'count:heaven', value: 1 },
    { id: 'epbig', name: 'はじまりの物語', desc: 'エピソードBIG を引く', stat: 'count:epbig', value: 1 },
    { id: 'allEpisodes', name: '物語の語り部', desc: 'エピソードBIG の話をすべて見る', stat: 'episodeKinds', value: 'all' },
    { id: 'tokka', name: '特化ゾーン突入', desc: '上乗せ特化ゾーンに入る', stat: 'count:tokka', value: 1 },
    { id: 'tokka5', name: '止まらない上乗せ', desc: '1回の特化ゾーンで5セット続ける', stat: 'best:tokkaSets', value: 5 },
    { id: 'add500', name: '絶対に殺す', desc: '四天王絶対殺す剣で +500G', stat: 'best:add', value: 500 },
    { id: 'goldDog', name: '黄金の勝利', desc: 'ゴールド金面犬を倒す', stat: 'defeat:goldDog', value: 1 },
    { id: 'shitenno', name: '四天王制覇', desc: '四天王を4人とも倒す', stat: 'shitennoKinds', value: 4 },
    { id: 'maou', name: '大魔王討伐', desc: '大魔王ASO を倒す', stat: 'defeat:maou', value: 1 },
    { id: 'judge', name: 'ラストジャッジ突破', desc: 'ラストジャッジで勝つ', stat: 'count:judgeWin', value: 1 },
    { id: 'coins1000', name: '千枚突破', desc: '1回の AT で 1,000枚獲得する', stat: 'best:atPayout', value: 1000 },
    { id: 'coins3000', name: '大量獲得', desc: '1回の AT で 3,000枚獲得する', stat: 'best:atPayout', value: 3000 },
    { id: 'rainbow', name: '虹の向こう', desc: '虹のトロフィーを出す', stat: 'trophy:rainbow', value: 1 },
    { id: 'allTrophies', name: 'トロフィーコレクター', desc: 'トロフィーを全色出す', stat: 'trophyKinds', value: 'all' },
    { id: 'allHints', name: '思い出アルバム', desc: 'AT 終了画面の絵をすべて見る', stat: 'hintKinds', value: 'all' },
    { id: 'allSpecials', name: '技マスター', desc: 'すべての技を見る', stat: 'specialKinds', value: 'all' },
    { id: 'allCharacters', name: 'キャラクター図鑑コンプリート', desc: 'すべてのキャラクターの説明を見られるようにする', stat: 'characterKinds', value: 'all' },
    { id: 'games10000', name: '打ち込み1万G', desc: '合計10,000ゲーム回す', stat: 'count:games', value: 10000 }
];

function empty() {
    return { met: {}, defeats: {}, specials: {}, episodes: {}, trophies: {}, hints: {}, counts: {}, best: {}, achievements: {} };
}

function load() {
    try {
        const raw = localStorage.getItem(KEY);
        if (raw) return { ...empty(), ...JSON.parse(raw) };
    } catch (e) { /* 保存できない環境・壊れたデータ */ }
    return empty();
}

export function createCollection({ storage = true } = {}) {
    let data = storage ? load() : empty();
    const listeners = new Set();   // 実績を解除したとき
    let dirty = false;

    const inc = (table, id, n = 1) => { table[id] = (table[id] || 0) + n; };
    const count = id => inc(data.counts, id);
    const best = (id, v) => { if (v > (data.best[id] || 0)) data.best[id] = v; };
    const meet = id => { data.met[id] = true; };

    function isUnlocked(c) {
        if (c.id === 'koori') return true;
        if (DEFEAT_GROUPS.includes(c.group)) return (data.defeats[c.id] || 0) > 0;
        return Boolean(data.met[c.id]);
    }

    function stat(name) {
        const [kind, id] = name.split(':');
        if (kind === 'count') return data.counts[id] || 0;
        if (kind === 'best') return data.best[id] || 0;
        if (kind === 'defeat') return data.defeats[id] || 0;
        if (kind === 'trophy') return data.trophies[id] || 0;
        if (kind === 'episodeKinds') return Object.keys(data.episodes).length;
        if (kind === 'trophyKinds') return Object.keys(data.trophies).length;
        if (kind === 'hintKinds') return Object.keys(data.hints).length;
        if (kind === 'specialKinds') return Object.keys(data.specials).length;
        if (kind === 'shitennoKinds') return SHITENNO.filter(id => data.defeats[id]).length;
        if (kind === 'characterKinds') return CHARACTERS.filter(isUnlocked).length;
        return 0;
    }

    const ALL = {
        episodeKinds: EPISODES.length,
        trophyKinds: TROPHIES.length,
        hintKinds: Object.keys(HINTS).length,
        specialKinds: SPECIALS.length,
        characterKinds: CHARACTERS.length
    };
    const goal = a => (a.value === 'all' ? ALL[a.stat] : a.value);

    function checkAchievements() {
        ACHIEVEMENTS.forEach(a => {
            if (data.achievements[a.id] || stat(a.stat) < goal(a)) return;
            data.achievements[a.id] = Date.now();
            listeners.forEach(fn => fn(a));
        });
    }

    function save() {
        if (!storage || !dirty) return;
        dirty = false;
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* 保存できない環境 */ }
    }

    function changed() {
        dirty = true;
        checkAchievements();
    }

    // 内部処理のイベントを1つ受け取る
    function record(e) {
        switch (e.type) {
            case 'lever': count('games'); break;
            case 'stage': meet('furukawa'); break;
            case 'zencho:start': (TEAM_MEMBERS[e.team] || []).forEach(meet); data.lastTeam = e.team; break;
            case 'zencho:battle':
                if (e.final && e.win) (TEAM_MEMBERS[data.lastTeam] || []).forEach(id => inc(data.defeats, id));
                break;
            case 'heaven': meet(e.who); count('heaven'); break;
            case 'tenjo':
                meet(e.who);
                count('tenjo');
                if (e.who === 'aruaru') count('tenjoAruaru');
                break;
            case 'at:direct': count('direct'); break;
            case 'bonus:start':
                count(e.bonus);
                if (e.bonus === 'epbig') meet('tomoishi');
                break;
            case 'at:start':
                count('at');
                ['yasu', 'tamu', 'dake', 'onioni'].forEach(meet);
                break;
            case 'at:add':
                inc(data.specials, e.attacker);
                inc(data.defeats, e.enemy);
                best('add', e.games);
                break;
            case 'at:boss':
                meet(e.boss);
                if (e.final && e.win) inc(data.defeats, e.boss);
                break;
            case 'at:judge': if (e.win) count('judgeWin'); break;
            case 'tokka:start': count('tokka'); break;
            case 'tokka:end':
                best('tokkaSets', e.sets);
                best('tokkaTotal', e.total);
                break;
            case 'at:end':
                best('atPayout', e.payout);
                best('atGames', e.games);
                if (e.hint) inc(data.hints, e.hint);
                if (e.trophy) inc(data.trophies, e.trophy);
                break;
            default: return;
        }
        changed();
    }

    // 見たエピソードBIG の話 (どの話を見せるかは演出側が決めるので、進行役から知らせてもらう)
    function recordEpisode(n) {
        inc(data.episodes, n);
        changed();
    }

    return {
        record,
        recordEpisode,
        save,
        isUnlocked,
        stat,
        goal,
        get data() { return data; },
        onAchievement(fn) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
        // 図鑑を消す (確認のあとで呼ぶ)
        reset() {
            data = empty();
            dirty = true;
            save();
        }
    };
}
