// =====================================================================
// 乱数 (種を決めると同じ結果になる。テスト・シミュレーション用)
// =====================================================================

export function createRng(seed = Date.now()) {
    let s = seed >>> 0 || 1;
    // mulberry32
    const next = () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
        next,
        chance: p => next() < p,
        int: (a, b) => a + Math.floor(next() * (b - a + 1)),
        pick: list => list[Math.floor(next() * list.length)],
        // { key: 重み } から1つ選ぶ
        weighted(table) {
            const entries = Object.entries(table).filter(([, w]) => w > 0);
            const total = entries.reduce((sum, [, w]) => sum + w, 0);
            let r = next() * total;
            for (const [key, w] of entries) {
                r -= w;
                if (r < 0) return key;
            }
            return entries[entries.length - 1][0];
        }
    };
}
