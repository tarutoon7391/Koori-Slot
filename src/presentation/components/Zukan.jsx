// =====================================================================
// 図鑑 (前作の図鑑をもとに、今作に合わせて作った。画面設計書 10章)
// ---------------------------------------------------------------------
// キャラクター → 技 → エピソードBIG → トロフィー → AT 終了画面 → 実績 → 記録。
// 中身は collection/collection.js (イベントから数えて保存したもの)、説明文は collection/profiles.js。
// =====================================================================

import React, { useEffect, useRef, useState } from 'react';
import { ART, CHARACTERS } from '../art/characters.js';
import { drawArt } from '../art/pixel.js';
import { ACHIEVEMENTS, SPECIALS, TROPHIES, UNLOCK_HINT } from '../collection/collection.js';
import { PROFILES } from '../collection/profiles.js';
import { EPISODES } from '../lcd/bonusStory.js';
import { HINTS, drawTrophy } from '../lcd/at.js';

const TABS = [
    ['chars', 'キャラクター'],
    ['specials', '技'],
    ['episodes', 'エピソード'],
    ['trophies', 'トロフィー'],
    ['hints', '終了画面'],
    ['achievements', '実績'],
    ['records', '記録']
];

// ドット絵を canvas に描く (silhouette: まだのときは黒い影)
function ArtCanvas({ ids, w = 56, h = 56, silhouette = false, bg = null }) {
    const ref = useRef(null);
    const list = [].concat(ids);
    useEffect(() => {
        const c = ref.current;
        const k = 2 * (window.devicePixelRatio || 1);
        c.width = w * k;
        c.height = h * k;
        const ctx = c.getContext('2d');
        ctx.setTransform(k, 0, 0, k, 0, 0);
        ctx.imageSmoothingEnabled = false;
        if (bg) {
            const g = ctx.createLinearGradient(0, 0, 0, h);
            bg.forEach((col, i) => g.addColorStop(i / (bg.length - 1), col));
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
        }
        const n = list.length;
        list.forEach((id, i) => {
            const art = ART[id];
            if (!art) return;
            const scale = Math.min((w - 6) / n / art.w, (h - 6) / art.h, 3);
            drawArt(ctx, art, (w / n) * (i + 0.5), h - 3, { scale, silhouette });
        });
    }, [list.join(','), w, h, silhouette]);
    return <canvas ref={ref} style={{ width: w, height: h }} className="zk-art" aria-hidden="true" />;
}

function TrophyCanvas({ color, seen }) {
    const ref = useRef(null);
    useEffect(() => {
        const c = ref.current;
        const k = 2 * (window.devicePixelRatio || 1);
        c.width = 48 * k;
        c.height = 56 * k;
        const ctx = c.getContext('2d');
        ctx.setTransform(k, 0, 0, k, 0, 0);
        if (seen) drawTrophy(ctx, 600, 24, 52, color, 2.2);
        else {
            ctx.globalAlpha = 0.5;
            drawTrophy(ctx, 600, 24, 52, 'white', 2.2);
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'rgba(10,14,20,.75)';
            ctx.fillRect(0, 0, 48, 56);
        }
    }, [color, seen]);
    return <canvas ref={ref} style={{ width: 48, height: 56 }} aria-hidden="true" />;
}

function CharacterDetail({ c, unlocked, defeats, onClose }) {
    const p = PROFILES[c.id] || {};
    return (
        <div className="zk-detail" role="dialog" aria-label={unlocked ? c.name : '？？？'}>
            <button type="button" className="zk-back" onClick={onClose}>← もどる</button>
            <div className="zk-detail-body">
                <ArtCanvas ids={c.id} w={140} h={140} silhouette={!unlocked} bg={['#13233a', '#070a0f']} />
                <div>
                    <h3>{unlocked ? c.name : '？？？'}</h3>
                    <p className="zk-group">{c.group}{c.origin === '新' ? '・今作から' : ''}</p>
                    {unlocked && p.title && <p className="zk-title">{p.title}</p>}
                    {unlocked && defeats > 0 && <p className="zk-small">倒した回数：{defeats}</p>}
                </div>
            </div>
            {unlocked
                ? <p className="zk-text">{(p.text || '説明はまだありません。').split('\n').map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>)}</p>
                : <p className="zk-text zk-locked">解禁のしかた：{UNLOCK_HINT[c.group] || '？？？'}</p>}
        </div>
    );
}

export default function Zukan({ collection, onClose }) {
    const [tab, setTab] = useState('chars');
    const [open, setOpen] = useState(null);
    const [, setTick] = useState(0);
    const d = collection.data;

    useEffect(() => {
        const onKey = e => { if (e.key === 'Escape') (open ? setOpen(null) : onClose()); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    const unlockedCount = CHARACTERS.filter(collection.isUnlocked).length;
    const doneCount = ACHIEVEMENTS.filter(a => d.achievements[a.id]).length;

    const reset = () => {
        if (!window.confirm('図鑑・実績・記録をすべて消します。よろしいですか？')) return;
        collection.reset();
        setTick(t => t + 1);
    };

    let body = null;
    if (tab === 'chars') {
        const c = open && CHARACTERS.find(x => x.id === open);
        body = c
            ? <CharacterDetail c={c} unlocked={collection.isUnlocked(c)} defeats={d.defeats[c.id] || 0} onClose={() => setOpen(null)} />
            : (
                <>
                    <p className="zk-lead">説明が見られるキャラクター {unlockedCount} / {CHARACTERS.length}（カードを押すと説明）</p>
                    <div className="zk-grid">
                        {CHARACTERS.map(c => {
                            const ok = collection.isUnlocked(c);
                            return (
                                <button type="button" key={c.id} className={ok ? 'zk-card' : 'zk-card locked'} onClick={() => setOpen(c.id)}>
                                    <ArtCanvas ids={c.id} silhouette={!ok} />
                                    <span className="zk-name">{ok ? c.name : '？？？'}</span>
                                    <span className="zk-group">{c.group}</span>
                                </button>
                            );
                        })}
                    </div>
                </>
            );
    } else if (tab === 'specials') {
        body = (
            <div className="zk-list">
                {SPECIALS.map(sp => {
                    const n = d.specials[sp.id] || 0;
                    return (
                        <div key={sp.id} className={n ? 'zk-row' : 'zk-row locked'}>
                            <ArtCanvas ids={sp.who} w={40} h={40} silhouette={!n} />
                            <span className="zk-name">{n ? sp.name : '？？？'}</span>
                            <span className="zk-count">{n ? `${n}回` : '-'}</span>
                        </div>
                    );
                })}
            </div>
        );
    } else if (tab === 'episodes') {
        body = (
            <div className="zk-list">
                {EPISODES.map((ep, i) => {
                    const n = d.episodes[i] || 0;
                    return (
                        <div key={i} className={n ? 'zk-row' : 'zk-row locked'}>
                            <span className="zk-ep">第{i + 1}話</span>
                            <span className="zk-name">{n ? `「${ep.title}」` : '？？？'}</span>
                            <span className="zk-count">{n ? `${n}回` : '-'}</span>
                        </div>
                    );
                })}
            </div>
        );
    } else if (tab === 'trophies') {
        body = (
            <>
                <p className="zk-lead">AT が終わったときに落ちてくる、設定示唆のトロフィーです。</p>
                <div className="zk-trophies">
                    {TROPHIES.map(tr => {
                        const n = d.trophies[tr.id] || 0;
                        return (
                            <div key={tr.id} className="zk-trophy">
                                <TrophyCanvas color={tr.id} seen={n > 0} />
                                <span className="zk-name">{n ? tr.name : '？'}</span>
                                <span className="zk-small">{n ? tr.hint : '？？？'}</span>
                                <span className="zk-count">{n ? `${n}回` : '-'}</span>
                            </div>
                        );
                    })}
                </div>
            </>
        );
    } else if (tab === 'hints') {
        body = (
            <>
                <p className="zk-lead">AT 終了画面の右に出る絵です（設定示唆。画面設計書 7-1）。</p>
                <div className="zk-grid">
                    {Object.entries(HINTS).map(([id, h]) => {
                        const n = d.hints[id] || 0;
                        return (
                            <div key={id} className={n ? 'zk-card' : 'zk-card locked'}>
                                <ArtCanvas ids={h.ids} w={110} h={64} silhouette={!n} bg={n ? h.sky : ['#1a2230', '#0d131b']} />
                                <span className="zk-name">{n ? h.name : '？？？'}</span>
                                <span className="zk-count">{n ? `${n}回` : '-'}</span>
                            </div>
                        );
                    })}
                </div>
            </>
        );
    } else if (tab === 'achievements') {
        body = (
            <>
                <p className="zk-lead">解除した実績 {doneCount} / {ACHIEVEMENTS.length}</p>
                <div className="zk-list">
                    {ACHIEVEMENTS.map(a => {
                        const done = Boolean(d.achievements[a.id]);
                        const goal = collection.goal(a);
                        const now = Math.min(collection.stat(a.stat), goal);
                        return (
                            <div key={a.id} className={done ? 'zk-row done' : 'zk-row'}>
                                <span className="zk-star">{done ? '★' : '☆'}</span>
                                <span className="zk-name">{a.name}<small>{a.desc}</small></span>
                                <span className="zk-count">{done ? '解除' : `${now.toLocaleString()} / ${goal.toLocaleString()}`}</span>
                            </div>
                        );
                    })}
                </div>
            </>
        );
    } else {
        const c = d.counts;
        const b = d.best;
        const rows = [
            ['合計ゲーム数', `${(c.games || 0).toLocaleString()}G`],
            ['BIG', `${c.big || 0}回`],
            ['REG', `${c.reg || 0}回`],
            ['エピソードBIG', `${c.epbig || 0}回`],
            ['AT「こおりバトルRASH」', `${c.at || 0}回`],
            ['AT 直撃', `${c.direct || 0}回`],
            ['上乗せ特化ゾーン', `${c.tokka || 0}回`],
            ['天井', `${c.tenjo || 0}回`],
            ['天国のカットイン', `${c.heaven || 0}回`],
            ['ラストジャッジの勝ち', `${c.judgeWin || 0}回`],
            ['1回の AT の最高獲得枚数', `${(b.atPayout || 0).toLocaleString()}枚`],
            ['1回の AT の最多ゲーム数', `${b.atGames || 0}G`],
            ['最高の上乗せ', b.add ? `+${b.add}G` : '-'],
            ['特化ゾーンの最多セット', b.tokkaSets ? `${b.tokkaSets}セット` : '-'],
            ['特化ゾーンの最高上乗せ', b.tokkaTotal ? `+${b.tokkaTotal}G` : '-']
        ];
        body = (
            <>
                <dl className="zk-records">
                    {rows.map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}
                </dl>
                <button type="button" className="zk-reset" onClick={reset}>図鑑・実績・記録を消す</button>
            </>
        );
    }

    return (
        <div className="zk-overlay" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>
            <section className="zukan" role="dialog" aria-label="図鑑">
                <header className="zk-head">
                    <h2>★ 図鑑</h2>
                    <button type="button" className="zk-close" onClick={onClose} aria-label="閉じる">×</button>
                </header>
                <nav className="zk-tabs" role="tablist">
                    {TABS.map(([id, name]) => (
                        <button type="button" role="tab" key={id} aria-selected={tab === id} onClick={() => { setTab(id); setOpen(null); }}>{name}</button>
                    ))}
                </nav>
                <div className="zk-body">{body}</div>
            </section>
        </div>
    );
}
