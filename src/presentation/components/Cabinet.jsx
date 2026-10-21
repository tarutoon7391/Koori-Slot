// =====================================================================
// 筐体 (画面設計書 1章: 氷と黒い摩天楼の台・大きめの液晶・丸い PUSH ボタン)
// =====================================================================

import React, { useEffect, useRef } from 'react';
import { W, H } from '../lcd/kit.js';

function Lcd({ game }) {
    const ref = useRef(null);
    useEffect(() => {
        const canvas = ref.current;
        const ctx = canvas.getContext('2d');
        let raf = 0;
        const fit = () => {
            const k = (canvas.clientWidth / W) * (window.devicePixelRatio || 1);
            canvas.width = Math.round(W * k);
            canvas.height = Math.round(H * k);
            ctx.setTransform(k, 0, 0, k, 0, 0);
            ctx.imageSmoothingEnabled = false;
        };
        fit();
        const loop = t => {
            game.director.draw(ctx, t);
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        window.addEventListener('resize', fit);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', fit);
        };
    }, [game]);
    // タップした位置 (特化ゾーンのパターンを選ぶとき)
    const onPointerDown = e => {
        const r = ref.current.getBoundingClientRect();
        game.tapLcd((e.clientX - r.left) / r.width);
    };
    return <canvas ref={ref} className="lcd" aria-label="液晶" onPointerDown={onPointerDown} />;
}

function Reels({ game, nav, stopped }) {
    const ref = useRef(null);
    useEffect(() => {
        game.reels.attach(ref.current);
        const onResize = () => game.reels.resize();
        window.addEventListener('resize', onResize);
        return () => {
            game.reels.detach();
            window.removeEventListener('resize', onResize);
        };
    }, [game]);
    // 押し順ナビ (リールの上。画面設計書 5-1): 次に押すリールの数字だけ赤く光らせ、押したリールは暗くする
    const order = nav ? [0, 1, 2].map(reel => nav.indexOf(reel) + 1) : null;
    const nextReel = nav ? nav.find(reel => !stopped[reel]) : undefined;
    const navClass = i => {
        if (!order) return 'nav-num off';
        if (stopped[i]) return 'nav-num done';
        return i === nextReel ? 'nav-num first' : 'nav-num';
    };
    return (
        <div className="reel-box">
            <div className="nav" aria-live="polite">
                {[0, 1, 2].map(i => (
                    <span key={i} className={navClass(i)}>
                        {order ? order[i] : ''}
                    </span>
                ))}
            </div>
            <canvas
                ref={ref}
                className="reels"
                aria-label="リール"
                onPointerDown={e => {
                    e.preventDefault();
                    game.next();
                }}
            />
        </div>
    );
}

// ボタンは押した瞬間に反応させる (クリックは指を離したときなので遅れる・取りこぼす)。
// フォーカスも移さない (Space キーでボタンが二重に押されないように)
const press = fn => ({
    onPointerDown: e => {
        e.preventDefault();
        fn();
    },
    onKeyDown: e => {
        if (e.key === 'Enter') fn();
    }
});

export default function Cabinet({ game }) {
    const d = game.director.snapshot();
    const stopped = game.stopped;
    const b = d.button;
    const buttonClass = ['push', b.lit ? `lit-${b.color}` : '', b.pop ? 'pop' : '', d.waitingPush ? 'waiting' : ''].join(' ');
    return (
        <main className="cabinet">
            <header className="cab-top">
                <h1>
                    <span className="t1">こおりくんの大冒険</span>
                    <span className="t2">～最凶のASO摩天楼への挑戦～</span>
                </h1>
            </header>
            <div className="lcd-frame">
                <Lcd game={game} />
            </div>
            <Reels game={game} nav={d.nav} stopped={stopped} />
            <div className="leds">
                <span>CREDIT <b>{d.credit}</b></span>
                <span>PAYOUT <b>{d.lastPayout}</b></span>
            </div>
            <div className="controls">
                <button type="button" className="lever" {...press(() => game.lever())} aria-label="レバー">
                    <span className="knob" />
                    <span className="label">LEVER</span>
                </button>
                <button
                    type="button"
                    className={buttonClass}
                    {...press(() => game.push())}
                    onPointerUp={() => game.release()}
                    onPointerLeave={() => game.release()}
                    onPointerCancel={() => game.release()}
                    aria-label="PUSH ボタン"
                >
                    PUSH
                </button>
                <div className="stops">
                    {[0, 1, 2].map(i => (
                        <button
                            type="button"
                            key={i}
                            className={stopped[i] ? 'stop' : 'stop active'}
                            {...press(() => game.stop(i))}
                            aria-label={['左停止', '中停止', '右停止'][i]}
                        />
                    ))}
                </div>
            </div>
        </main>
    );
}
