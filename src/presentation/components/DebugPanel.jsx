// =====================================================================
// デバッグ (演出の確認用。仕様書: 次ゲームの役を指定・強制突入・イベントを起こす)
// ---------------------------------------------------------------------
// 内部処理の machine.debug を使う。本物の内部処理にも同じ名前のものを用意してもらう (docs/events.md)。
// =====================================================================

import React, { useEffect, useState } from 'react';

const ROLES = [
    ['none', 'ハズレ'], ['bell', 'ベル'], ['replay', 'リプレイ'], ['weakCherry', '弱チェリー'], ['strongCherry', '強チェリー'],
    ['midCherry', '中段チェリー'], ['weakSuika', '弱スイカ'], ['strongSuika', '強スイカ'], ['chance', 'チャンス目']
];
const MODE_NAMES = { A: 'A', B: 'B', C: 'C', D: 'D', heaven: '天国', superHeaven: '超天国' };
const STATE_NAMES = { low: '低確', high: '高確', super: '超高確' };
const TEAM_NAMES = { fiveDX: '5DX', ask3: 'ASK-3', muscle: 'お願いマッスル' };

export default function DebugPanel({ game }) {
    const d = game.machine.debug;
    const [info, setInfo] = useState(d.internal());
    const [snap, setSnap] = useState(game.machine.snapshot());
    const [team, setTeam] = useState('');

    useEffect(() => {
        const id = setInterval(() => {
            setInfo(d.internal());
            setSnap(game.machine.snapshot());
        }, 300);
        return () => clearInterval(id);
    }, [game, d]);

    const plan = info.plan.kind === 'ceiling' ? `天井 (${info.plan.start + info.plan.length}G)` : `${info.plan.start}G ゾーン`;
    const z = info.zencho;

    return (
        <section className="debug">
            <h2>デバッグ</h2>
            <dl className="debug-info">
                <dt>ゲーム数</dt><dd>{snap.normalGames}G（総 {snap.game}G）</dd>
                <dt>モード</dt><dd>{MODE_NAMES[info.mode]}</dd>
                <dt>当たるところ</dt><dd>{plan}</dd>
                <dt>ステート</dt><dd>{STATE_NAMES[info.state]}{info.guard ? `（保障 ${info.guard}G）` : ''}</dd>
                <dt>前兆</dt><dd>{z ? `${z.real ? '本前兆' : 'ガセ'} 残り${z.left}G ${TEAM_NAMES[z.team]}` : 'なし'}</dd>
                <dt>ストック</dt><dd>{info.stock.length ? info.stock.join(', ') : 'なし'}</dd>
                <dt>差枚</dt><dd>{snap.credit - snap.invested}枚</dd>
            </dl>

            <h3>次のゲームの役</h3>
            <div className="debug-buttons">
                {ROLES.map(([id, name]) => (
                    <button type="button" key={id} onClick={() => d.setNextRole(id)}>{name}</button>
                ))}
            </div>

            <h3>前兆</h3>
            <div className="debug-buttons">
                <select value={team} onChange={e => setTeam(e.target.value)} aria-label="相手チーム">
                    <option value="">チームはおまかせ</option>
                    {Object.entries(TEAM_NAMES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
                <button type="button" onClick={() => d.startZencho({ real: true, team: team || null })}>本前兆（8G）</button>
                <button type="button" onClick={() => d.startZencho({ real: false, team: team || null })}>ガセ前兆（8G）</button>
            </div>

            <h3>ステート・モード</h3>
            <div className="debug-buttons">
                {Object.entries(STATE_NAMES).map(([id, name]) => (
                    <button type="button" key={id} onClick={() => d.setState(id)}>{name}</button>
                ))}
            </div>
            <div className="debug-buttons">
                {Object.entries(MODE_NAMES).map(([id, name]) => (
                    <button type="button" key={id} onClick={() => d.setMode(id)}>{name}</button>
                ))}
            </div>

            <h3>演出</h3>
            <div className="debug-buttons">
                <button type="button" onClick={() => d.ceilingSoon()}>天井の5G前へ</button>
                <button type="button" onClick={() => d.setGames(197)}>200G ゾーンの手前へ</button>
                <button type="button" onClick={() => d.direct()}>AT 直撃</button>
                <button type="button" onClick={() => d.heaven('naitei')}>天国カットイン（ナイナイ）</button>
                <button type="button" onClick={() => d.heaven('aruaru')}>天国カットイン（アルアル）</button>
                <button type="button" onClick={() => d.bonus('big')}>BIG</button>
                <button type="button" onClick={() => d.bonus('reg')}>REG</button>
                <button type="button" onClick={() => d.bonus('epbig')}>エピソードBIG</button>
                <button type="button" onClick={() => d.tokka && d.tokka()}>特化ゾーン（AT 中）</button>
            </div>

            <h3>AT 中</h3>
            <div className="debug-buttons">
                <button type="button" onClick={() => d.atBonus && d.atBonus('big')}>AT 中の BIG</button>
                <button type="button" onClick={() => d.atBonus && d.atBonus('reg')}>AT 中の REG</button>
                <button type="button" onClick={() => d.atBonus && d.atBonus('epbig')}>AT 中のエピソードBIG</button>
                <button type="button" onClick={() => d.startZencho({ real: true, team: team || null })}>AT 中の本前兆（8G）</button>
                <button type="button" onClick={() => d.startZencho({ real: false, team: team || null })}>AT 中のガセ前兆（8G）</button>
                <button type="button" onClick={() => d.atEndSoon && d.atEndSoon()}>AT の残りを 3G に</button>
            </div>

            <h3>オート</h3>
            <div className="debug-buttons">
                <button type="button" onClick={() => game.setAuto(!game.auto)}>{game.auto ? 'オートを止める' : 'オートで回す'}</button>
            </div>
        </section>
    );
}
