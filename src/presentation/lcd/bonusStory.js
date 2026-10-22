// =====================================================================
// ボーナス中に流す中身 (画面設計書 4-1・4-2)
// ---------------------------------------------------------------------
// BIG: キャラ解説・ステージ解説を順に出す / REG: BIG の短い版 (主なものだけ)
// エピソードBIG: こおりくんのストーリーとほかのチームの話。引くたびに次の話へ進み、全部見たら1話に戻る。
// 文章はすべて Claude の案 (キャラ設計書・画面設計書をもとに書いた)。直したいところを教えてもらう。
// 期待度には関係しないので、演出側で選ぶ。
// =====================================================================

// キャラ解説・ステージ解説のカード。who: 描くキャラ (ART の id)。stage: ステージの絵 (tower / floor / middle / boss)
export const BIG_CARDS = [
    { kind: 'キャラ解説', who: 'koori', name: 'こおりくん', lines: ['氷のキューブの体を持つ主人公。', 'おにおにに借りたお金を返すため、', 'ASO摩天楼の財宝をねらう。'] },
    { kind: 'キャラ解説', who: 'onioni', name: 'おにおに', lines: ['こおりくんにお金を貸している赤鬼。', '取り立てのためについてきたが、', '戦えばとても頼りになる。'] },
    { kind: 'ステージ解説', stage: 'tower', name: 'ASO摩天楼', lines: ['やまぐっちとおかおかの境目に', '突然現れた塔。上の階ほど敵が強く、', '財宝が眠っているらしい。'] },
    { kind: 'キャラ解説', who: 'yasu', name: 'やすさん', lines: ['チームばりきつよめの仲間。', '眼鏡と青いパーカーがトレードマーク。', 'レア役の上乗せで攻撃する。'] },
    { kind: 'キャラ解説', who: 'tamu', name: 'たむさん', lines: ['チームばりきつよめの仲間。', '赤い帽子と緑のジャケット。', 'レア役の上乗せで攻撃する。'] },
    { kind: 'キャラ解説', who: 'dake', name: 'だけさん', lines: ['チームばりきつよめの仲間。', 'ハチマキとたくましい体。', 'レア役の上乗せで攻撃する。'] },
    { kind: 'ステージ解説', stage: 'floor', name: '1〜10階・11階より上', lines: ['1〜10階は明るいロビー (低確)。', '11階より上は夕方の回廊 (高確)。', '階の表示で状態がわかる！'] },
    { kind: 'キャラ解説', who: 'furukawa', name: 'ふるカワ', lines: ['ステージのナビ役。', '摩天楼のことなら何でも知っている。', '階が変わると教えてくれる。'] },
    { kind: 'キャラ解説', who: 'tomoishi', name: 'ともいし', lines: ['こおりくんのお母さん。', 'パーマ頭の石に黄色いエプロン。', 'こおりくんをいつも見守っている。'] },
    { kind: 'ステージ解説', stage: 'middle', name: '摩天楼 中間階層', lines: ['前兆のときに来る階。', 'ライバルチームとバトルになり、', '倒せばボーナス確定！'] },
    { kind: 'キャラ解説', who: 'okagappa', name: 'チーム5DX', lines: ['おかがっぱ・ひびきまくり・やまもぅ。', 'ライバルの中ではいちばん弱い。', 'ノリと勢いで摩天楼に来た。'] },
    { kind: 'キャラ解説', who: 'asahara', name: 'チームASK-3', lines: ['KING.ASAHARA・Mr.SASAKI・Mr.KOTANI。', 'CS城の主 ASAHARA は策略家で、', 'おにおにのライバル。'] },
    { kind: 'キャラ解説', who: 'ueno', name: 'チームお願いマッスル', lines: ['シバター・ウエノーブル・イケキム。', '筋肉の貴族とアイドル盗賊がいる', 'いちばん強いチーム。出たら熱い！'] },
    { kind: 'ステージ解説', stage: 'boss', name: '四天王の階', lines: ['22・33・44・55階には四天王、', '56階には大魔王ASO がいる。', 'ここにいるときは超高確！'] },
    { kind: 'キャラ解説', who: 'goldDog', name: 'ゴールド金面犬', lines: ['摩天楼に住み着いた敵の中で', 'いちばん強い黄金の犬。', '倒せば上乗せがいちばん多い。'] },
    { kind: 'キャラ解説', who: 'maou', name: '大魔王ASO', lines: ['ASOの壺の封印から', 'よみがえった摩天楼の主。', '無から宝や武器を生み出す。'] },
    { kind: 'キャラ解説', who: 'naitei', name: 'ナイナイ・アルアル', lines: ['シーシャ・ナイテイの兄弟。', '天国にいると、カットインで', '教えてくれることがある。'] }
];

// REG は短い版: 主人公・摩天楼・階・中間階層だけ
export const REG_CARDS = BIG_CARDS.filter(c => ['koori', 'onioni'].includes(c.who) || c.stage);

// エピソードBIG の話。scenes は5G ごとに進む場面 (50G で10場面。セリフは長いと折り返し、3行まで)
//   bg: 背景 / cast: 出るキャラ ('id' か { id, hidden: true } = 正体不明の影絵) / who: 話す人 / line: セリフ
//   then: { who, line } か、その配列。同じ場面でセリフのあとに順に出す / cast の drop: true で上から落ちてくる / crowd: 群れで出すキャラ (右側に並ぶ) / chase: true で群れに追いかけ回される
//   brawl: true で大乱戦 (土けむりのまわりで cast がもみ合う) / vs: true で cast の2人がにらみ合い、まんなかに「VS」
//   clash: true で cast の2人の一騎打ち (ぶつかって火花) / cast の down: true で倒れて横になる / floor: '22F' で左上に階を出す
//   special: '技の名前' (配列ならセリフごとに次の名前) で必殺技。cast が技を出し、target が相手。最後のセリフで命中し、ko: true なら相手が倒れる。beam: true は相手の魔法を受け止めて消す
//     ('fire' で赤いビーム)、split: true で相手が真っ二つ。cast の rainbow: true で虹色の光、sword: true で大魔王絶対殺す剣を持つ
//   gather: [キャラ] で cast の先頭に、まわりのキャラから力が集まる (rainbow: true で虹色の光も) / awaken: true で覚醒 (虹色・剣が変わる)
//   treasure: true で財宝の山
//   tv: '字幕' でテレビのニュース (キャラは左に寄る) / gurgle: true でお腹の音 / tsuzuku: true で最後のセリフのあとに「つづく」
//   bg: 'home' (こおりくんの家) / 'town' (夕焼けの町) / 'tower' (摩天楼の前・全体) / 'lobby' (摩天楼1階) / 'middle' (中間階層) / 'boss' (四天王の階) / 'top' (最上階)
export const EPISODES = [
    {
        title: '借金',
        scenes: [
            // 第1話はユーザーが書いた文章 (2026-10-21)
            { bg: 'home', cast: ['koori', 'onioni'], who: 'おにおに', line: 'おいこおり、今月の返済はまだか' },
            { bg: 'home', cast: ['koori', 'onioni'], who: 'こおりくん', line: 'もうちょっとだけ待って！もうちょっとだけ！おねがいおにおに～' },
            { bg: 'home', cast: ['koori', 'onioni'], who: 'おにおに', line: 'たく...仕方ないな。もう少しだけだぞ。破ったらパンツ見せろよ。' },
            { bg: 'home', cast: ['koori', 'onioni'], who: 'こおりくん', line: 'ええ～～～！' },
            { bg: 'home', cast: ['koori', 'tomoishi'], who: 'ともいし', line: 'こおりなにしよっと！' },
            { bg: 'home', cast: ['koori', 'tomoishi'], who: 'こおりくん', line: 'なんとかしないと...！こおり尊厳の危機！' },
            { bg: 'town', cast: ['koori', 'furukawa'], who: 'ふるカワ', line: 'ねえ、こおりくんASO摩天楼って知ってる？' },
            { bg: 'town', cast: ['koori', 'furukawa'], who: 'こおりくん', line: 'ASO摩天楼？なにそれ？' },
            { bg: 'tower', cast: ['koori', 'furukawa'], who: 'ふるカワ', line: 'やまぐっちとおかおかの境目に急に現れたんだって。そこには危ない怪物もいるけど、てっぺんには大量の財宝があるらしいよ！' },
            { bg: 'town', cast: ['koori', 'furukawa'], who: 'こおりくん', line: '財宝...!それなら借金を返せる！こおり生きていける！' }
        ]
    },
    {
        title: '仲間集め',
        scenes: [
            // 第2話はユーザーが書いた文章 (2026-10-21)
            { bg: 'town', cast: ['koori'], who: 'こおりくん', line: 'そうと決まれば仲間集めだ！' },
            { bg: 'town', cast: ['koori', 'yasu'], who: 'こおりくん', line: 'やすさん！急だがじゃんけんだ！' },
            { bg: 'town', cast: ['koori', 'yasu'], who: 'やすさん', line: 'え！？急になんですの！？' },
            { bg: 'town', cast: ['koori', 'yasu'], who: 'こおりくん', line: 'じゃんけんポン！...こおりの勝ち～！というわけで一緒に摩天楼に行くよ！' },
            { bg: 'town', cast: ['koori', 'yasu'], who: 'やすさん', line: 'ええ！？本気で言ってる！？あそこ危ないって噂だよ！？' },
            { bg: 'town', cast: ['koori', 'yasu', 'dake'], who: 'だけさん', line: '話はこの鍛えた地獄耳で聞かせてもらった！' },
            { bg: 'town', cast: ['koori', 'yasu', 'dake'], who: 'だけさん', line: '私もついていくぞ！この鍛え上げたこぶしでなんでもぶっ飛ばしてあげよう！' },
            { bg: 'town', cast: ['koori', 'yasu', 'dake', 'tamu'], who: 'たむさん', line: '俺もついてくよ。面白そうやし。暇つぶしにもなるでしょ。' },
            { bg: 'town', cast: ['koori', 'yasu', 'dake', 'tamu', 'onioni'], who: 'おにおに', line: 'こおりが金を返すまで、不安だから俺も見張りでついていくぞ。' },
            { bg: 'tower', cast: ['koori', 'yasu', 'dake', 'tamu', 'onioni'], who: 'こおりくん', line: 'よーし！それじゃあチームばりきつよめ！出発だ', then: { who: '全員', line: 'おおーー！' } }
        ]
    },
    {
        title: 'ASO摩天楼',   // 題名は仮 (ユーザーに確認する)
        scenes: [
            // 第3話はユーザーが書いた文章 (2026-10-21)
            { bg: 'lobby', cast: ['koori', 'yasu', 'dake', 'tamu', 'onioni'], who: 'こおりくん', line: 'ここが摩天楼か' },
            { bg: 'lobby', cast: ['koori', 'yasu', 'dake', 'tamu', 'onioni'], who: 'おにおに', line: '気をつけろよ。うわさだと他にも財宝を狙ってここにいるやつらもいるらしいからな。' },
            { bg: 'lobby', cast: ['koori', 'yasu', 'dake', 'tamu', 'onioni'], who: 'だけさん', line: '大丈夫だ！なにがこようと私がたたきつぶしてくれる！' },
            { bg: 'lobby', cast: ['koori', 'yasu', 'dake', 'tamu', 'onioni', { id: 'harry', hidden: true }], who: '？？？', line: 'ハリー！' },
            { bg: 'lobby', cast: ['koori', 'yasu', 'dake', 'tamu', 'onioni', 'harry'], who: 'やすさん', line: 'ん？何今の' },
            { bg: 'lobby', cast: ['koori', 'yasu', 'dake', 'tamu', 'onioni'], crowd: 'harry', who: 'ハリー', line: 'メンキョナイー！！' },
            // ハリーの群れに追いかけ回される
            { bg: 'lobby', cast: ['koori', 'yasu', 'dake', 'tamu', 'onioni'], crowd: 'harry', chase: true, who: 'こおりくん', line: 'うわああああああ！？' },
            { bg: 'boss', cast: [{ id: 'zumitani', hidden: true }, { id: 'daishi', hidden: true }], who: '？？？', line: '来るものには試練を', then: { who: '？？？', line: '逃げるものには死を' } },
            { bg: 'boss', cast: [{ id: 'runaya', hidden: true }, { id: 'nozoema', hidden: true }], who: '？？？', line: 'このASO四天王が', then: { who: '？？？', line: '貴様らに与えよう' } },
            { bg: 'tower', cast: [{ id: 'daishi', hidden: true }, { id: 'zumitani', hidden: true }, { id: 'runaya', hidden: true }, { id: 'nozoema', hidden: true }], who: '？？？', line: 'さあ、来たれ！挑戦者たちよ！' }
        ]
    },
    {
        title: 'ライバル',   // 題名は前の仮の案のまま (ユーザーに確認する)
        scenes: [
            // 第4話はユーザーが書いた文章 (2026-10-21)
            { bg: 'middle', cast: ['koori', 'yasu', 'dake', 'tamu', 'onioni'], who: 'たむさん', line: 'なんとかまいたね' },
            { bg: 'middle', cast: ['koori', 'yasu', 'dake', 'tamu', 'onioni'], who: 'こおりくん', line: 'ちょ、ちょっと休憩．．．' },
            { bg: 'middle', cast: [{ id: 'okagappa', hidden: true }], who: '？？？', line: 'あ～らあらあら　ま～えを見れば　こおりいるねおかピポ　イェア！' },
            { bg: 'middle', cast: ['koori', 'yasu', 'dake', 'tamu', 'onioni', { id: 'okagappa', hidden: true }], who: 'おにおに', line: '...おまえたちは...' },
            {
                bg: 'middle', cast: ['okagappa', 'hibikimakuri', 'yamamou'], who: 'おかがっぱ', line: 'お宝は俺たちのもの　イェア！',
                then: [{ who: 'ひびきまくり', line: 'ここすっごいひびくよ～' }, { who: 'やまもぅ', line: 'お宝は俺たち５DXのものだ！' }]
            },
            { bg: 'middle', cast: ['koori', 'yasu', 'dake', 'tamu', 'onioni'], who: 'こおりくん', line: 'おかがっぱたち！君たちもきてたんだ！' },
            { bg: 'middle', cast: ['okagappa', 'hibikimakuri', 'yamamou'], who: 'ひびきまくり', line: 'ぼくたちだけじゃないよ～。ほかにもお宝を狙ってほかのチームを倒そうとしてるひとたちもいるよ～。' },
            // ウエノーブルが上から落ちてくる
            { bg: 'middle', cast: [{ id: 'ueno', hidden: true, drop: true }], who: '？？？', line: 'そのと～～～～～り！！' },
            {
                bg: 'middle', cast: ['shibata', 'ueno', 'ikekimu'], who: 'ウエノーブル', line: '今やこの摩天楼にいるだれもがライバルなのだ！',
                then: [{ who: 'シバター', line: 'チームが３つ集まった！？良い絵になる予感！んなああ～' }, { who: 'イケキム', line: 'シバター、鳴くな。気が散るだろうが。' }]
            },
            { bg: 'middle', cast: ['shibata', 'ueno', 'ikekimu'], who: 'ウエノーブル', line: 'さあ始めよう！財宝を賭けたデスマッチを！！' }
        ]
    },
    {
        title: '大乱戦',   // 題名は仮 (ユーザーに確認する)
        scenes: [
            // 第5話はユーザーが決めた流れ (2026-10-21) をもとに Claude が書いたセリフ。直してもらう
            // 3チーム (ばりきつよめ・5DX・お願いマッスル) の戦い
            {
                bg: 'middle', brawl: true, cast: ['koori', 'okagappa', 'dake', 'ueno', 'yamamou', 'ikekimu'], who: 'だけさん', line: 'この鍛え上げたこぶしを受けてみろ！',
                then: { who: 'ウエノーブル', line: '甘い！我が筋肉の前では、すべてがそよ風よぉ！' }
            },
            {
                bg: 'middle', brawl: true, cast: ['tamu', 'hibikimakuri', 'yasu', 'shibata', 'onioni', 'yamamou'], who: 'やまもぅ', line: 'モォーーッ！牛の底力を思い知れ！',
                then: { who: 'イケキム', line: 'チッ…しつこい奴らだ。' }
            },
            // チームASK-3 が乱入
            {
                bg: 'middle', cast: ['sasaki', { id: 'asahara', drop: true }, 'kotani'], who: 'KING.ASAHARA', line: 'フハハハ！ずいぶん楽しそうではないか。財宝は、このCS城の主ASAHARAがいただく！',
                then: [{ who: 'Mr.KOTANI', line: '現在、3チームとも消耗しています。我々の勝率は87.4%です。' }, { who: 'Mr.SASAKI', line: 'この状況。とてもいいです。漁夫の利というやつです。' }]
            },
            {
                bg: 'middle', cast: ['koori', 'yasu', 'dake', 'tamu', 'onioni'], who: 'おにおに', line: 'ASAHARA…！やはり来ていたか。',
                then: { who: 'こおりくん', line: 'ちょ、ちょっと！？チームが4つになっちゃったよ！？' }
            },
            // 大乱戦
            {
                bg: 'middle', brawl: true, cast: ['koori', 'okagappa', 'sasaki', 'ueno', 'onioni', 'asahara', 'hibikimakuri', 'ikekimu'], who: '全員', line: 'うおおおおおお！！',
                then: [{ who: 'ひびきまくり', line: 'ここすっごいひびくよ～～！' }, { who: 'シバター', line: '4チームの大乱戦！撮れ高しかない！んなああ～' }]
            },
            // こおりくんの提案
            { bg: 'middle', cast: ['koori'], who: 'こおりくん', line: 'みんな、ちょっと待って！！こんなことしてたら、四天王のところに着く前にみんなボロボロだよ！' },
            {
                bg: 'middle', cast: ['koori', 'okagappa', 'ueno', 'asahara'], who: 'こおりくん', line: '財宝はみんなで山分けしよう！それで、みんなで協力して摩天楼のてっぺんを目指すんだ！',
                then: { who: 'Mr.KOTANI', line: '4チームで協力した場合…突破率は大きく上がります。' }
            },
            // 5DX とお願いマッスルは合意
            {
                bg: 'middle', cast: ['okagappa', 'hibikimakuri', 'yamamou', 'shibata', 'ueno', 'ikekimu'], who: 'ウエノーブル', line: '山分けか…よかろう！妻へ送る黄金のネックレスさえ手に入れば、それでよい！',
                then: [{ who: 'おかがっぱ', line: '俺たち5DXも乗ったぜ　イェア！' }, { who: 'やまもぅ', line: '牛は群れで生きる生き物だからな！' }]
            },
            // KING.ASAHARA は拒否
            {
                bg: 'middle', cast: ['sasaki', 'asahara', 'kotani'], who: 'KING.ASAHARA', line: 'くだらん！このワシが、ほかの者と仲良く山分けだと！？ふざけるな！',
                then: { who: 'KING.ASAHARA', line: '…だが、ワシに勝てたら協力してやってもよい。さあ、だれが相手だ？' }
            },
            // おにおにが受けて立つ
            {
                bg: 'middle', vs: true, cast: ['onioni', 'asahara'], who: 'おにおに', line: 'その勝負、SE城の主、このおにおにが受けて立つ！',
                then: { who: 'KING.ASAHARA', line: 'おにおに…！望むところだ！' }
            }
        ]
    },
    {
        title: '一騎打ち',   // 題名は仮 (ユーザーに確認する)
        scenes: [
            // 第6話はユーザーが決めた流れ (2026-10-21) をもとに Claude が書いたセリフ。直してもらう
            // おにおにと KING.ASAHARA の一騎打ち
            {
                bg: 'middle', clash: true, cast: ['onioni', 'asahara'], who: 'KING.ASAHARA', line: 'CS城を築いたこの力、思い知るがいい！',
                then: { who: 'おにおに', line: 'その程度か、ASAHARA！SE城の金棒をなめるなよ！' }
            },
            {
                bg: 'middle', clash: true, cast: ['onioni', 'asahara'], who: 'Mr.KOTANI', line: 'ASAHARA様の勝率…50.2%…49.8%…数字がゆれています…！',
                then: { who: 'こおりくん', line: 'がんばれー！おにおにー！' }
            },
            // 激闘の末、おにおにが勝つ
            {
                bg: 'middle', cast: ['onioni', { id: 'asahara', down: true }], who: 'おにおに', line: 'はあ…はあ…勝負あったな、ASAHARA。',
                then: { who: 'KING.ASAHARA', line: 'ぐぬぬ…このワシが…負けただと…！' }
            },
            {
                bg: 'middle', cast: ['sasaki', 'asahara', 'kotani'], who: 'KING.ASAHARA', line: '…約束は約束だ。ASK-3も協力してやる。ただし、財宝の分け前は忘れるなよ！',
                then: [{ who: 'Mr.SASAKI', line: 'これで4チーム同盟決定ですね。' }, { who: 'Mr.KOTANI', line: '突破率、大幅に上昇。記録しておきます。' }]
            },
            // 4チームで摩天楼を上っていく
            {
                bg: 'tower', cast: ['koori', 'onioni', 'okagappa', 'ueno', 'asahara'], who: 'こおりくん', line: 'よーし！みんなで摩天楼のてっぺんを目指すぞ！',
                then: { who: '全員', line: 'おおーーー！！' }
            },
            // 22階: 四天王ダイシと従者の浦の島重蔵
            {
                bg: 'boss', floor: '22F', cast: ['urashima', 'daishi'], who: 'ダイシ', line: 'よくぞ参られた、挑戦者たちよ。拙僧は四天王がひとり、ダイシ。',
                then: { who: '浦の島重蔵', line: 'わしは…えーと…なんじゃったかの…そうじゃ、つり…いや、門番じゃ！' }
            },
            // やすさん・たむさん・だけさんが残る
            {
                bg: 'boss', floor: '22F', cast: ['yasu', 'tamu', 'dake'], who: 'だけさん', line: 'ここは私たちに任せて、先に行け！',
                then: [{ who: 'やすさん', line: 'え！？ぼくもですの！？…ま、まあ、やるしかないか！' }, { who: 'たむさん', line: 'しゃーないな。ちゃちゃっと片づけて追いつくわ。' }]
            },
            {
                bg: 'boss', floor: '22F', cast: ['yasu', 'tamu', 'dake', 'urashima', 'daishi'], who: 'ダイシ', line: '重蔵、参りますぞ。…仏の顔も、ここまでです。',
                then: { who: 'こおりくん', line: 'みんな…！絶対に追いついてきてね！' }
            },
            // 33階: ズミタニがマキビコンMk-4を大量に呼ぶ
            {
                bg: 'boss', floor: '33F', cast: ['zumitani'], crowd: 'makibikon', who: 'ズミタニ', line: 'やっほー、77代目のズミタニだよ！ここまで来るなんて、しぶといね♪ マキビコンたち、おいで！',
                then: { who: 'マキビコンMk-4', line: '挑戦者を確認。これより排除を開始するであります。' }
            },
            // チーム5DX が残り、ほかの者はさらに上へ
            {
                bg: 'boss', floor: '33F', cast: ['okagappa', 'hibikimakuri', 'yamamou'], crowd: 'makibikon', who: 'おかがっぱ', line: 'ここは俺たち5DXに任せな　イェア！ま～だまだ戦わねバ！',
                then: [{ who: 'やまもぅ', line: '牛の角は、鉄だって貫く！モォーー！' }, { who: 'こおりくん', line: 'ありがとう！上で待ってるからね！' }]
            }
        ]
    },
    {
        title: '頂上へ',   // 題名は仮 (ユーザーに確認する)
        scenes: [
            // 第7話はユーザーが決めた流れ (2026-10-21) をもとに Claude が書いたセリフ。直してもらう
            // 44階: ルナヤと奈架多ドラゴン。チームASK-3 が残る
            {
                bg: 'boss', floor: '44F', cast: ['runaya', 'nakata'], who: 'ルナヤ', line: 'よく来たわね。この摩天楼を作ったのは、わたしよ。…よく来たわね。あら、もう言ったかしら？',
                then: { who: '奈架多ドラゴン', line: 'グオオオ…（力加減…力加減…）' }
            },
            {
                bg: 'boss', floor: '44F', cast: ['sasaki', 'asahara', 'kotani'], who: 'KING.ASAHARA', line: 'ここはワシらASK-3が引き受けてやる。おにおに、ワシに勝ったのだ。上で負けることは許さんぞ！',
                then: [{ who: 'Mr.KOTANI', line: 'ドラゴンの攻撃パターン、すでに記録済みです。' }, { who: 'Mr.SASAKI', line: '少しやばいです。が、なんてことはないですね。' }]
            },
            {
                bg: 'boss', floor: '44F', cast: ['sasaki', 'asahara', 'kotani', 'nakata', 'runaya'], who: 'ルナヤ', line: '月の力よ、わたしに力を…！月の力よ…あら、これも言ったかしら？',
                then: { who: 'おにおに', line: '頼んだぞ、ASAHARA！' }
            },
            // 55階: ノゾエマ。チームお願いマッスルが戦う
            {
                bg: 'boss', floor: '55F', cast: ['nozoema'], who: 'ノゾエマ', line: 'よくぞここまで来た。…だが、その前に見よ。この鍛え抜かれた筋肉を！',
                then: { who: 'こおりくん', line: 'え…なんで鏡に向かってポーズしてるの…？' }
            },
            {
                bg: 'boss', floor: '55F', cast: ['shibata', 'ueno', 'ikekimu', 'nozoema'], who: 'ウエノーブル', line: 'ほう…なかなかの筋肉。だが、1日26時間鍛えた我が筋肉には及ばぬ！',
                then: { who: 'ノゾエマ', line: '…面白い。この名刀江波と鍛えぬいた筋肉で、切り伏せてくれよう。' }
            },
            {
                bg: 'boss', floor: '55F', vs: true, cast: ['ueno', 'nozoema'], who: 'イケキム', line: 'ここはオレたちが止める。行け、こおり。',
                then: [{ who: 'シバター', line: '四天王最強 VS 筋肉貴族！撮れ高しかない！んなああ～' }, { who: 'ウエノーブル', line: '行け！そして妻へのネックレスも見つけてきてくれ！' }]
            },
            // 56階 (最上階): こおりくんとおにおにが大魔王ASO と対面
            {
                bg: 'top', floor: '56F', cast: ['koori', 'onioni'], who: 'こおりくん', line: 'ついに…てっぺんだ…！',
                then: { who: 'おにおに', line: '気を抜くな、こおり。…何か来るぞ。' }
            },
            {
                bg: 'top', floor: '56F', cast: [{ id: 'maou', drop: true }], who: '大魔王ASO', line: 'よくぞ来た、挑戦者よ。数百年、この時を待ちわびたぞ。',
                then: { who: '大魔王ASO', line: '財宝が欲しいか？ならば、我を倒してみせよ！' }
            },
            {
                bg: 'top', floor: '56F', cast: ['koori', 'onioni', 'maou'], who: 'こおりくん', line: '借金を返して…こおりは生きていくんだ！',
                then: { who: 'おにおに', line: 'いくぞ、こおり！下で戦っているみんなの分までな！' }
            },
            // 最後の戦闘が始まる
            {
                bg: 'top', floor: '56F', vs: true, cast: ['koori', 'maou'], who: '大魔王ASO', line: '来い！我が力、その身で味わうがよい！',
                then: { who: 'こおりくん・おにおに', line: 'うおおおおおお！！' }
            }
        ]
    },
    {
        title: '仲間たちの戦い',   // 題名は仮 (ユーザーに確認する)
        scenes: [
            // 第8話はユーザーが決めた流れ (2026-10-21) をもとに Claude が書いたセリフ。直してもらう
            // 技の名前はユーザー指定: だけチョップ・おちょくりボーンフィーバー・DOPAPANCHI・イケキムドライブ・マッスルウエノクラッシュ。
            // そのほかは前作のスロット (koori/js/config.js) のキャラの必殺技: やすパンチ・たむキック・おかピポっと光線・大音響4DX・ASAスラッシュ・シバタードライバー。
            // KOTANI は前作にいないので「一刀両断」 (技の説明)
            // 22階: やすさん・たむさんが浦の島重蔵を、だけさんがダイシを倒す
            {
                bg: 'boss', floor: '22F', special: ['やすパンチ', 'たむキック'], cast: ['yasu', 'tamu'], target: 'urashima', ko: true, who: 'やすさん', line: 'たむさん、いくよ！やすパンチ！',
                then: [{ who: 'たむさん', line: 'これで終わりや！たむキック！' }, { who: '浦の島重蔵', line: 'ぐわーっ…わしは…なんじゃったかの…' }]
            },
            {
                bg: 'boss', floor: '22F', special: 'だけチョップ', cast: ['dake'], target: 'daishi', ko: true, who: 'ダイシ', line: '…仏の顔はここまで。鬼となった拙僧を止められますかな？',
                then: { who: 'だけさん', line: 'この鍛え上げたこぶしで…だけチョーーップ！！' }
            },
            // 33階: チーム5DX が同時に必殺技を放ち、マキビコンごとズミタニを倒す
            {
                bg: 'boss', floor: '33F', cast: ['okagappa', 'hibikimakuri', 'yamamou', 'zumitani'], crowd: 'makibikon', who: 'ズミタニ', line: 'あれれ～？まだ立ってるの？しぶといのだけは一流だね♪',
                then: { who: 'やまもぅ', line: '…今、おちょくったな？牛をおちょくるやつは許さん！' }
            },
            {
                bg: 'boss', floor: '33F', special: ['おかピポっと光線', '大音響4DX', 'おちょくりボーンフィーバー'], cast: ['okagappa', 'hibikimakuri', 'yamamou'], target: 'zumitani', crowd: 'makibikon', ko: true, who: 'おかがっぱ', line: 'みんな、同時にいくぜ！おかピポ！イェア！おかピポっと光線！',
                then: [{ who: 'ひびきまくり', line: 'これが４DXだ！大音響4DX～！' }, { who: 'やまもぅ', line: 'おちょくりボーンフィーバー！！モォーーー！' }, { who: 'ズミタニ', line: 'うそでしょ～！？マキビコンごと～！？' }]
            },
            // 44階: SASAKI がすきを作り、KOTANI が奈架多ドラゴンを切り伏せる
            {
                bg: 'boss', floor: '44F', special: ['ASAスラッシュ', 'KOTANI 一刀両断'], cast: ['sasaki', 'kotani'], target: 'nakata', ko: true, who: 'Mr.SASAKI', line: '締め切り厳守です。ASAスラッシュ！…はい、すきあり！',
                then: [{ who: 'Mr.KOTANI', line: '計算どおりです。…切り伏せます。' }, { who: '奈架多ドラゴン', line: 'グオ…（力加減…まちがえた…）' }]
            },
            // ルナヤの魔法を KING.ASAHARA が真正面から無効化し、DOPAPANCHI で一撃
            {
                bg: 'boss', floor: '44F', special: ['ルナヤ 月の魔法', '無効化！'], beam: true, cast: ['asahara'], target: 'runaya', who: 'ルナヤ', line: '月の力よ…！このビームで…あら、もう撃ったかしら？',
                then: { who: 'KING.ASAHARA', line: 'ふん、そんな小細工、このワシには効かん！' }
            },
            {
                bg: 'boss', floor: '44F', special: 'DOPAPANCHI', cast: ['asahara'], target: 'runaya', ko: true, who: 'KING.ASAHARA', line: 'これがCS城の主の力だ…DOPAPANCHI！！',
                then: { who: 'ルナヤ', line: 'きゃあっ…！い、一撃…！？' }
            },
            // 55階: チームお願いマッスルが総力でノゾエマとぶつかる。シバター → イケキムドライブ → マッスルウエノクラッシュでとどめ
            {
                bg: 'boss', floor: '55F', brawl: true, cast: ['shibata', 'ueno', 'ikekimu', 'nozoema'], who: 'ノゾエマ', line: '来い！この刀と筋肉、まとめて受けてみよ！',
                then: { who: 'ウエノーブル', line: 'お願いマッスル、総力戦だ！' }
            },
            {
                bg: 'boss', floor: '55F', special: ['シバタードライバー', 'イケキムドライブ'], cast: ['shibata', 'ikekimu'], target: 'nozoema', who: 'シバター', line: 'まずはオレから！バーイ！シバタードライバー！',
                then: { who: 'イケキム', line: 'すきだらけだ。…イケキムドライブ！' }
            },
            {
                bg: 'boss', floor: '55F', special: 'マッスルウエノクラッシュ', cast: ['ueno'], target: 'nozoema', ko: true, who: 'ウエノーブル', line: '妻への愛と、1日26時間の筋肉…受けてみよ！マッスルウエノクラッシュ！！',
                then: { who: 'ノゾエマ', line: 'み…見事な…筋肉…だ…' }
            }
        ]
    },
    {
        title: '最終決戦',   // 題名は仮 (ユーザーに確認する)
        scenes: [
            // 第9話はユーザーが決めた流れ (2026-10-21) をもとに Claude が書いたセリフ。直してもらう
            // おにおにの「こおり！俺の最後の力だ！受け取ってくれ～！」と、技の名前「大魔王絶対殺す剣」「亜祖宇激烈破」はユーザー指定。
            // おにおにの「鬼鬼の金棒」・こおりくんの「大腸炎アタック」は前作のスロットの必殺技
            // 大魔王ASO の圧倒的な力
            {
                bg: 'top', floor: '56F', special: ['鬼鬼の金棒', '大腸炎アタック'], cast: ['onioni', 'koori'], target: 'maou', who: 'おにおに', line: '金返せ…じゃなかった、くらえ！鬼鬼の金棒！',
                then: [{ who: 'こおりくん', line: 'いっけー！大腸炎アタック！' }, { who: '大魔王ASO', line: '…それで終わりか？' }]
            },
            {
                bg: 'top', floor: '56F', cast: [{ id: 'koori', down: true }, { id: 'onioni', down: true }, 'maou'], who: '大魔王ASO', line: 'これが数百年の封印の中たくわえた我が力。ひれ伏すがよい！',
                then: [{ who: 'こおりくん', line: 'う…強すぎる…体が動かない…' }, { who: 'おにおに', line: 'くそっ…ここまでなのか…！' }]
            },
            // KING.ASAHARA が大魔王の攻撃をはじく
            {
                bg: 'top', floor: '56F', cast: [{ id: 'koori', down: true }, { id: 'asahara', drop: true }, 'maou'], who: 'KING.ASAHARA', line: 'させるか！このワシをさしおいて、おにおにを倒すなど許さん！',
                then: [{ who: '大魔王ASO', line: '何…！？我が一撃をはじいただと！？' }, { who: 'おにおに', line: 'ASAHARA…！おまえ…！' }]
            },
            // 全員が集結する
            {
                bg: 'top', floor: '56F', cast: ['yasu', 'dake', 'okagappa', 'yamamou', 'ueno', 'ikekimu', 'kotani'], who: 'だけさん', line: '待たせたな、こおり！',
                then: [{ who: 'おかがっぱ', line: '俺たちも来たぜ　イェア！' }, { who: 'ウエノーブル', line: '四天王はみな倒した！残るは大魔王だけだ！' }]
            },
            // こおりくんに力を集める
            {
                bg: 'top', floor: '56F', cast: ['koori'], gather: ['yasu', 'tamu', 'dake', 'okagappa', 'hibikimakuri', 'yamamou', 'sasaki', 'asahara', 'kotani', 'shibata', 'ueno', 'ikekimu'], who: 'Mr.KOTANI', line: '全員の力を、こおりくんに集めます！',
                then: { who: 'こおりくん', line: 'みんなの力が…流れこんでくる…！' }
            },
            {
                bg: 'top', floor: '56F', cast: ['koori'], gather: ['onioni'], rainbow: true, who: 'おにおに', line: 'こおり！俺の最後の力だ！受け取ってくれ～！',
                then: { who: 'こおりくん', line: 'おにおに～～！受け取ったぜ～～！' }
            },
            // こおりくんが虹色に光り、コオリソードが大魔王絶対殺す剣に変わる
            {
                bg: 'top', floor: '56F', awaken: true, cast: ['koori'], who: 'やすさん', line: 'こおりくんが…虹色に光ってる…！コオリソードが変わっていく…！',
                then: { who: 'こおりくん', line: '大魔王絶対殺す剣！！' }
            },
            // 大魔王ASO の亜祖宇激烈破と激突
            {
                bg: 'top', floor: '56F', special: ['亜祖宇激烈破', '大魔王絶対殺す剣'], beam: 'fire', cast: [{ id: 'koori', rainbow: true, sword: true }], target: 'maou', who: '大魔王ASO', line: '小賢しい！消え去れ！亜祖宇激烈破！！',
                then: { who: 'こおりくん', line: 'みんなの力は…負けないっ！！' }
            },
            // 真っ二つにして撃破
            {
                bg: 'top', floor: '56F', special: '大魔王絶対殺す剣', split: true, cast: [{ id: 'koori', rainbow: true, sword: true }], target: 'maou', who: 'こおりくん', line: 'これで…終わりだーーっ！！',
                then: { who: '大魔王ASO', line: 'ば、ばかな…この我が…このASOが…！このASOが～～～～～～！！！' }
            },
            // 財宝を山分けして、それぞれの帰る場所へ
            {
                bg: 'top', treasure: true, cast: ['koori', 'onioni', 'okagappa', 'asahara', 'ueno'], who: 'こおりくん', line: 'やったー！財宝だー！約束どおり、みんなで山分けだ！',
                then: [
                    { who: 'ウエノーブル', line: 'あったぞ！妻への黄金のネックレスだ！' },
                    { who: 'KING.ASAHARA', line: 'ふん…今回はおまえたちに花を持たせてやる。次は負けんぞ、おにおに。' },
                    { who: 'おにおに', line: 'こおり、借金はこれで全部返してもらうぞ。…よくやったな。' },
                    { who: 'こおりくん', line: 'うん！これで…こおり、生きていける！' },
                    { who: 'ナレーション', line: 'こうして、財宝を山分けしたみんなは、それぞれの帰るべき場所へと帰っていった。' }
                ]
            }
        ]
    },
    {
        title: 'そして、また…',   // 題名は仮 (ユーザーに確認する)
        scenes: [
            // 第10話はユーザーが決めた流れ (2026-10-21) をもとに Claude が書いたセリフ。直してもらう
            // 最後のセリフ「どうしよう。こおり生きていけないよ～～！！」と「つづく」はユーザー指定
            // 摩天楼が消えたニュース
            {
                bg: 'home', tv: '臨時ニュース　ASO摩天楼が消滅　やまぐっち・おかおか間の行き来が再開', cast: ['koori'], who: 'アナウンサー', line: '臨時ニュースです。やまぐっちとおかおかの境目に現れた「ASO摩天楼」が、昨夜、こつぜんと姿を消しました。',
                then: { who: 'アナウンサー', line: 'これにより、やまぐっちとおかおかの行き来が、ふたたびできるようになりました。' }
            },
            {
                bg: 'home', tv: '臨時ニュース　ASO摩天楼が消滅　やまぐっち・おかおか間の行き来が再開', cast: ['koori'], who: 'こおりくん', line: 'へぇ～、摩天楼、なくなっちゃったんだ。なんだかさみしいな～。'
            },
            // 日課の大腸炎とのおしゃべり
            {
                bg: 'home', gurgle: true, cast: ['koori'], who: 'こおりくん', line: 'さてと…日課の、大腸炎とのおしゃべりタイムだ！大腸炎くん、おはよう！',
                then: { who: '大腸炎', line: 'ギュルルル…ゴロゴロ…' }
            },
            {
                bg: 'home', gurgle: true, cast: ['koori'], who: 'こおりくん', line: 'え？昨日は食べすぎたって？あはは、たしかに打ち上げ、すごかったもんね～！',
                then: { who: '大腸炎', line: 'ピーーー…' }
            },
            // おにおにが家に来る
            {
                bg: 'home', cast: ['koori', { id: 'onioni', drop: true }], who: 'おにおに', line: 'おい、こおり！いるか！',
                then: { who: 'こおりくん', line: 'あ、おにおに！どうしたの？' }
            },
            {
                bg: 'home', cast: ['koori', 'onioni'], who: 'おにおに', line: '金を返せ。',
                then: { who: 'こおりくん', line: 'え？借金は財宝で全部返したよね？何のこと？' }
            },
            {
                bg: 'home', cast: ['koori', 'onioni'], who: 'おにおに', line: '忘れたのか？摩天楼突破の打ち上げで、おまえが「全員分おごるちゃむ！」って言って、財宝を全部使い果たしただろう。'
            },
            {
                bg: 'home', cast: ['koori', 'onioni'], who: 'おにおに', line: 'それで足りない分を、また俺から借りたじゃないか。',
                then: { who: 'こおりくん', line: '……あ。' }
            },
            {
                bg: 'home', cast: ['koori', 'onioni', 'tomoishi'], who: 'こおりくん', line: 'お、思い出した…焼肉…カラオケ…二次会…三次会…',
                then: { who: 'ともいし', line: 'こおりなにしよっと！' }
            },
            // おしまいは「つづく」
            {
                bg: 'home', tsuzuku: true, cast: ['koori', 'onioni'], who: 'こおりくん', line: 'どうしよう。こおり生きていけないよ～～！！'
            }
        ]
    }
];
