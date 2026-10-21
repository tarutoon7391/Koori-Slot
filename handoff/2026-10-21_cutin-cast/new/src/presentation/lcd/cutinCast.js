// =====================================================================
// チャンスのカットインに出るキャラとセリフ (画面設計書 3-6・4-3)
// ---------------------------------------------------------------------
// 前兆中のカットイン (notice の cutin) と「こおりを狙え」に、こおりくん以外のキャラも出す (2026-10-21 ユーザー指定)。
// 期待度は今までどおりカットインの色だけで決まる (色は内部処理が抽選する)。
// キャラは色ごとの顔ぶれから演出側が選ぶだけなので、キャラで期待度は変わらない。
// 虹 (確定) は「こおりいきていける！」のこおりくんだけ。セリフは Claude の案【仮】。直したいところはここを直す
// =====================================================================

export const CHANCE_CAST = {
    blue: [
        { who: 'koori', line: 'いくぞ！' },
        { who: 'yasu', line: 'いけるかも…？' },
        { who: 'tamu', line: 'まだまだやな' },
        { who: 'dake', line: '気合いだ！' },
        { who: 'furukawa', line: 'チャンスかも！' }
    ],
    green: [
        { who: 'koori', line: 'チャンスだ！' },
        { who: 'yasu', line: 'チャンスですの！' },
        { who: 'tamu', line: 'ええ流れやん' },
        { who: 'dake', line: 'こぶしが燃える！' },
        { who: 'furukawa', line: 'いい感じだよ！' }
    ],
    red: [
        { who: 'koori', line: '勝つぞ！！' },
        { who: 'dake', line: 'たたきつぶしてくれる！' },
        { who: 'onioni', line: '負けたら金返せよ！' },
        { who: 'tomoishi', line: 'こおり、がんばり！' }
    ],
    gold: [
        { who: 'koori', line: '激アツ！！' },
        { who: 'onioni', line: 'ここで決めろ、こおり！' },
        { who: 'tomoishi', line: 'こおりなにしよっと！いけー！' },
        { who: 'furukawa', line: '激アツだよ！！' }
    ],
    rainbow: [
        { who: 'koori', line: 'こおりいきていける！' }
    ]
};

// 「こおりを狙え」のカットインに出るキャラ (文字はいつも「こおりを狙え！」)
export const NERAE_CAST = ['koori', 'onioni', 'yasu', 'tamu', 'dake', 'furukawa', 'tomoishi'];

const pick = list => list[Math.floor(Math.random() * list.length)];

export function chanceCutin(color) {
    return pick(CHANCE_CAST[color] || CHANCE_CAST.blue);
}

export function neraeCutin() {
    return pick(NERAE_CAST);
}
