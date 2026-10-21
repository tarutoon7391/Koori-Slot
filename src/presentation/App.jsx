// =====================================================================
// 画面全体 (筐体・デバッグ)
// =====================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { createGame } from './game.js';
import Cabinet from './components/Cabinet.jsx';
import DebugPanel from './components/DebugPanel.jsx';
import { Sound } from './sound/sound.js';

const KEYS = { z: 0, x: 1, c: 2, 1: 0, 2: 1, 3: 2, ArrowLeft: 0, ArrowDown: 1, ArrowRight: 2 };

export default function App() {
    const game = useMemo(() => createGame({ setting: 1 }), []);
    const [, setTick] = useState(0);
    const [showDebug, setShowDebug] = useState(() => {
        try { return localStorage.getItem('koori-slot-debug') !== '0'; } catch (e) { return true; }
    });
    const [muted, setMuted] = useState(Sound.muted);

    useEffect(() => game.subscribe(() => setTick(t => t + 1)), [game]);
    useEffect(() => game.applyQuery(window.location.search), [game]);
    // 確認用 (開発者ツールのコンソールから台をさわれるように)
    useEffect(() => { window.kooriGame = game; }, [game]);

    useEffect(() => {
        const onKey = e => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') {
                e.preventDefault();
                game.next();
            } else if (e.key in KEYS) {
                e.preventDefault();
                game.stop(KEYS[e.key]);
            } else if (e.key === 'b' || e.key === 'B') {
                if (!e.repeat) game.push();   // 押しっぱなしは長押し (離したら release)
            } else if (e.key === 'd' || e.key === 'D') {
                setShowDebug(s => !s);
            }
        };
        const onKeyUp = e => {
            if (e.key === 'b' || e.key === 'B') game.release();
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [game]);

    useEffect(() => {
        try { localStorage.setItem('koori-slot-debug', showDebug ? '1' : '0'); } catch (e) { /* 無視 */ }
    }, [showDebug]);

    const toggleMute = () => {
        Sound.unlock();
        Sound.setMuted(!muted);
        setMuted(!muted);
    };

    return (
        <div className="app">
            <Cabinet game={game} />
            <aside className="side">
                <div className="side-buttons">
                    <button type="button" onClick={toggleMute}>{muted ? '音: OFF' : '音: ON'}</button>
                    <button type="button" onClick={() => setShowDebug(s => !s)}>{showDebug ? 'デバッグを閉じる' : 'デバッグ'}</button>
                </div>
                <p className="keys">
                    操作: レバー・順に停止 = Space / 停止 = Z X C（← ↓ →）/ PUSH = B / デバッグ = D
                </p>
                {showDebug && <DebugPanel game={game} />}
            </aside>
        </div>
    );
}
