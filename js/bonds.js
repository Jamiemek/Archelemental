// Bond network
const NET_SEED = 20261021;
const NET_QTY = 23;
const NET_FAM_QTY = 23;
const NET_QTY_GROWTH = 1.42;
// how strongly each line buff is weighted toward the outer rings
const NET_WEIGHT = { luck: 2.5, auto: 1.6, price: 0.6, refresh: 0.6, stock: 0.6 };
const NET_RINGS = 24;
const NET_STEP = 130;
const NET_MIN_GAP = 74;
const NET_TOTALS = {
    luck: 65.3, auto: 800, price: 30, refresh: 8, stock: 60
};
const NET_MULTS = [1.04, 1.05, 1.06, 1.08, 1.1, 1.2, 1.35, 1.5];
const NET_SLOT_RINGS = [4, 10, 17];
const NET_CHAIN_RINGS = [13, 17, 20, 23];
const NET_EXTRA_RINGS = [10, 15];
// outer ring 1 = rings 26-28 (25 is the gap)
const NET_RING_COL = ['#f0c419', '#7ddc5a', '#7ddc5a', '#7ddc5a', '#2fe0b0', '#2fe0b0', '#2fe0b0', '#35d0e0', '#35d0e0', '#35d0e0', '#5aa8ff', '#5aa8ff', '#5aa8ff', '#9b8cff', '#9b8cff', '#9b8cff', '#c77dff', '#e060ff', '#e060ff', '#ff5a8a', '#ff5a8a', '#ff7a5a', '#ff7a5a', '#ffb35a', '#ffe08a', '#ffe08a', '#3ff0ff', '#c45cff', '#ffd36e'];
const OUTER_SEED = 20261022;
const OUTER_ORBITS = 3;
const OUTER_PER_ORBIT = 207;
const OUTER_RADIUS = 3420;
const OUTER_STEP = 180;
const OUTER_BRIDGES = 6;
const OUTER_TOTALS = { quark: 100, event: 100, cdur: 50, dup: 25, refund: 25, storm: 100 };
const OUTER_SHARE = [['quark', 0.25], ['event', 0.2], ['cdur', 0.2], ['dup', 0.12], ['refund', 0.12], ['storm', 0.11]];
// each bridge unlocks a feature: [kind, cosmetic, what its outer slot asks for]
// the joke table comes from the multiworld here, so three of the bridges give shop slots instead
const BRIDGE_UNLOCKS = [['ion', 0, ['Co', 240]], ['hold', 0, ['Sb', 360]], ['slot', 0, ['Sc', 370]],
    ['slot', 0, ['Dy', 430]], ['slot', 0, ['Ho', 420]], ['slot', 0, ['Ac', 190]]];
// bridges in the order players reach their inner ends
const BRIDGE_ORDER = [3, 1, 5, 0, 2, 4];
// the rest of the cosmetics are out in the orbits: [orbit, cosmetic]
const OUTER_UNLOCKS = [[1, 'blueprint'], [1, 'holographic'], [2, 'notebook'], [2, 'retro'], [2, 'astral']];
const COSMETIC_NAMES = {
    oscilloscope: 'Oscilloscope scanner', holographic: 'Holographic scanner', blueprint: 'Blueprint page', notebook: 'Lab notebook page',
    retro: 'Retro spawn effects', astral: 'Astral spawn effects', warp: 'Warp scanner', gameover: 'Game Over page'
};
const FAMILY_ONE = {
    alkali: 'alkali metal', alkaline: 'alkaline earth metal', transition: 'transition metal', post: 'post-transition metal', metalloid: 'metalloid', nonmetal: 'nonmetal', halogen: 'halogen', noble: 'noble gas', lanth: 'lanthanide', actin: 'actinide', unknown: 'superheavy'
};
var NET = null;
var netState = {};
try {
    netState = JSON.parse(localStorage.getItem('elementalNetwork') || '{}');
} catch (e) { }
function saveNet() {
    try {
        localStorage.setItem('elementalNetwork', JSON.stringify(netState));
    } catch (e) { }
}
const seededRnd = a => () => {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
// tree layout uses the old odds so existing saves don't move
const NET_ODDS = { Sg: 786972, Bh: 832146, Hs: 876280, Mt: 919468, Ds: 961794, Rg: 1003325, Cn: 1044123, Nh: 1084240, Fl: 1123723, Mc: 1162612, Lv: 1200945, Ts: 1238754, Og: 1312915 };
function genNetwork() {
    const now = {};
    ELEMENTS.forEach(e => {
        if (NET_ODDS[e[0]]) {
            now[e[0]] = e[2];
            e[2] = NET_ODDS[e[0]];
        }
    });
    const N = layNetwork();
    ELEMENTS.forEach(e => {
        if (now[e[0]]) {
            e[2] = now[e[0]];
        }
    });
    Object.keys(shareMemo).forEach(k => delete shareMemo[k]);
    return N;
}
function layNetwork() {
    const rnd = seededRnd(NET_SEED);
    const nodes = [{ id: 0, x: 0, y: 0, ring: 0, ang: 0 }];
    const edges = [];
    const near = (x, y, gap) => nodes.some(n => Math.hypot(n.x - x, n.y - y) < gap);
    let frontier = [];
    for (let k = 0; k < 6; k++) {
        const a = k * Math.PI / 3 - Math.PI / 2;
        const n = { id: nodes.length, x: Math.cos(a) * NET_STEP, y: Math.sin(a) * NET_STEP, ring: 1, ang: a, twist: (rnd() - 0.5) * 0.5 };
        nodes.push(n);
        edges.push({ a: 0, b: n.id });
        frontier.push(n);
    }
    for (let r = 2; r <= NET_RINGS; r++) {
        const next = [];
        frontier.forEach(p => {
            const roll = rnd();
            const kids = roll < 0.12 ? 0 : roll < 0.55 ? 1 : roll < 0.89 ? 2 : 3;
            for (let k = 0; k < kids; k++) {
                let placed = false;
                for (let tries = 0; tries < 7 && !placed; tries++) {
                    const spread = kids === 1 ? 0 : (k - (kids - 1) / 2) * (0.85 / r + 0.08);
                    const a = p.ang + p.twist / r * 3 + spread + (rnd() - 0.5) * (0.35 / r + 0.06) * (1 + tries);
                    const rad = r * NET_STEP + (rnd() - 0.5) * 40;
                    const x = Math.cos(a) * rad;
                    const y = Math.sin(a) * rad;
                    if (!near(x, y, NET_MIN_GAP)) {
                        const n = { id: nodes.length, x, y, ring: r, ang: a, twist: p.twist + (rnd() - 0.5) * 0.18 };
                        nodes.push(n);
                        edges.push({ a: p.id, b: n.id });
                        next.push(n);
                        placed = true;
                    }
                }
            }
        });
        // keep the outer rings from thinning out: revive a dead frontier from the ring before
        if (next.length < 8 && frontier.length) {
            frontier.slice(0, 8 - next.length).forEach(p => p.twist += 0.2);
        }
        frontier = next.length ? next : frontier;
    }
    // loops: join some neighbours from different branches
    const has = new Set(edges.map(e => Math.min(e.a, e.b) + '-' + Math.max(e.a, e.b)));
    for (let i = 1; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const A = nodes[i];
            const B = nodes[j];
            if (Math.abs(A.ring - B.ring) > 1) {
                continue;
            }
            const d = Math.hypot(A.x - B.x, A.y - B.y);
            if (d < NET_MIN_GAP * 1.45 && !has.has(i + '-' + j) && rnd() < 0.22) {
                edges.push({ a: i, b: j, join: true });
                has.add(i + '-' + j);
            }
        }
    }
    // what each slot asks for, getting rarer and larger further out
    const els = [...ELEMENTS].sort((a, b) => a[2] - b[2]);
    const RK = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4 };
    const comps = [...ACHIEVEMENTS].filter(a => normalizeFormula(a.formula).match(/[A-Z]/g).length > 1).sort((a, b) => RK[a.rarity] - RK[b.rarity]);
    const fams = Object.keys(FAMILY_ONE);
    const famMin = f => Math.min(...ELEMENTS.filter(e => familyOf(e[0]) === f).map(e => e[2]));
    const pickEl = (R, r, lo, hi) => {
        const f = r / NET_RINGS;
        const top = Math.min(els.length - 2, Math.floor(els.length * Math.pow(f, 1.25) * hi + 4));
        const bot = Math.max(0, Math.floor(top * lo));
        return els[bot + Math.floor(R() * Math.max(1, top - bot))][0];
    };
    const reqFor = (r, R) => {
        const rr = r * 18 / NET_RINGS;
        if (r === 0) {
            return { t: 'el', k: 'O', n: 1 };
        }
        const roll = R();
        if (r <= 1 || roll < 0.34) {
            return { t: 'el', k: pickEl(R, r, 0.55, 1), n: 1 };
        } else if (roll < 0.6) {
            const k = pickEl(R, Math.max(1, r * 0.45), 0, 0.6);
            return { t: 'el', k, n: Math.max(2, Math.round(NET_QTY * 3 * Math.pow(NET_QTY_GROWTH, rr) / Math.pow(ELEMENTS.find(e => e[0] === k)[2], 0.55))) };
        } else if (roll < 0.74 && r >= 2) {
            const ok = fams.filter(f => famMin(f) <= Math.pow(10, 1 + rr * 0.33));
            const f = ok[Math.floor(R() * ok.length)];
            return { t: 'fam', k: f, n: Math.max(1, Math.round(NET_FAM_QTY * Math.pow(1.3, rr) / Math.pow(famMin(f), 0.3))) };
        } else if (roll < 0.9 && r >= 3) {
            const span = comps.length;
            const at = Math.min(span - 1, Math.floor(Math.pow((r - 2) / (NET_RINGS - 2), 1.1) * span * (0.6 + R() * 0.4)));
            const a = comps[at];
            return { t: 'cp', k: normalizeFormula(a.formula), l: a.formula, nm: a.name, n: 1 };
        }
        return { t: 'has', k: pickEl(R, r, 0.1, 0.55), n: 1 };
    };
    nodes.forEach(n => n.req = reqFor(n.ring, rnd));
    // what each line gives
    const outer = e => Math.max(nodes[e.a].ring, nodes[e.b].ring);
    const ringFirst = {};
    edges.forEach((e, i) => {
        const r = outer(e);
        e.ring = r;
        if (ringFirst[r] == null) {
            ringFirst[r] = i;
        }
    });
    const grind = n => {
        const q = n.req;
        return q.t === 'el' ? q.n * ELEMENTS.find(x => x[0] === q.k)[2] : q.t === 'fam' ? q.n * 60 : 0;
    };
    const used = new Set();
    const special = (r, kind, val) => {
        let best = -1;
        let bc = -1;
        edges.forEach((e, i) => {
            if (e.ring !== r || used.has(i)) {
                return;
            }
            const c = grind(nodes[nodes[e.a].ring >= nodes[e.b].ring ? e.a : e.b]);
            if (c > bc) {
                bc = c;
                best = i;
            }
        });
        if (best >= 0) {
            used.add(best);
            edges[best].kind = kind;
            edges[best].val = val;
        }
    };
    for (let r = 3; r <= NET_RINGS; r += 3) {
        special(r, 'mult', NET_MULTS[r / 3 - 1]);
    }
    NET_EXTRA_RINGS.forEach(r => special(r, 'extra', 1));
    NET_CHAIN_RINGS.forEach(r => special(r, 'chain', 1));
    NET_SLOT_RINGS.forEach(r => special(r, 'slot', 1));
    edges.forEach((e, i) => {
        if (used.has(i)) {
            return;
        }
        const x = rnd();
        e.kind = x < 0.45 ? 'luck' : x < 0.7 ? 'auto' : x < 0.8 ? 'price' : x < 0.88 ? 'refresh' : 'stock';
    });
    ['luck', 'auto', 'price', 'refresh', 'stock'].forEach(kind => {
        const list = edges.filter(e => e.kind === kind);
        const wsum = list.reduce((s, e) => s + Math.pow(e.ring, NET_WEIGHT[kind]), 0);
        const dp = kind === 'auto' ? 10 : 100;
        list.forEach(e => e.val = Math.max(1 / dp, Math.round(NET_TOTALS[kind] * Math.pow(e.ring, NET_WEIGHT[kind]) / wsum * dp) / dp));
    });
    const base = nodes.length;
    genOuter(nodes, edges, reqFor);
    // the easy bridge: cheapest rim slot to the nearest outer slot, which only asks for oxygen
    const from = nodes.slice(0, base).filter(n => n.ring === NET_RINGS && n.req.t === 'el').reduce((b, n) => grind(n) < grind(b) ? n : b);
    const to = nodes.slice(base).filter(n => n.orbit === 0).reduce((b, n) => Math.hypot(n.x - from.x, n.y - from.y) < Math.hypot(b.x - from.x, b.y - from.y) ? n : b);
    to.req = { t: 'el', k: 'O', n: 1000 };
    edges.push({ a: from.id, b: to.id, ring: NET_RINGS + 2, orbit: 0, kind: 'drop', val: 0.2 });
    const adj = nodes.map(() => []);
    edges.forEach((e, i) => {
        adj[e.a].push(i);
        adj[e.b].push(i);
    });
    return { nodes, edges, adj, base };
}
// expected rolls to get a slot's full amount at a given luck and chain chance
const shareMemo = {};
function rollsFor(q, luck, denom) {
    let share = shareMemo[luck];
    if (!share) {
        share = shareMemo[luck] = {};
        let tot = 0;
        ELEMENTS.forEach(e => {
            share[e[0]] = Math.pow(1 + 1.5 * (Math.log10(e[2] + 1) / 3), (luck / 100) / 1.5) / e[2];
            tot += share[e[0]];
        });
        Object.keys(share).forEach(k => share[k] /= tot);
    }
    const go = 1 / denom;
    let p;
    if (q.t === 'el') {
        p = share[q.k] * (1 - go);
    } else if (q.t === 'fam') {
        p = ELEMENTS.filter(e => familyOf(e[0]) === q.k).reduce((s, e) => s + share[e[0]], 0) * (1 - go);
    } else if (q.t === 'has') {
        p = share[q.k] * go * 2;
    } else {
        const counts = parseFormula(q.l);
        const m = Object.values(counts).reduce((a, c) => a + c, 0);
        const fact = k => k < 2 ? 1 : k * fact(k - 1);
        p = Math.pow(go, m - 1) * (1 - go) * fact(m);
        Object.keys(counts).forEach(k => p *= Math.pow(share[k], counts[k]) / fact(counts[k]));
    }
    return q.n / p;
}
function genOuter(nodes, edges, reqFor) {
    const R = seededRnd(OUTER_SEED);
    const base = nodes.length;
    const nearest = (list, n) => list.reduce((b, m) => Math.hypot(m.x - n.x, m.y - n.y) < Math.hypot(b.x - n.x, b.y - n.y) ? m : b, list[0]);
    const orbits = [];
    for (let o = 0; o < OUTER_ORBITS; o++) {
        const ring = NET_RINGS + 2 + o;
        const rad = OUTER_RADIUS + o * OUTER_STEP;
        const off = R() * Math.PI * 2;
        const list = [];
        for (let i = 0; i < OUTER_PER_ORBIT; i++) {
            const a = off + (i + (R() - 0.5) * 0.4) / OUTER_PER_ORBIT * Math.PI * 2;
            const r = rad + (R() - 0.5) * 36;
            const n = { id: nodes.length, x: Math.cos(a) * r, y: Math.sin(a) * r, ring, ang: a, orbit: o };
            nodes.push(n);
            list.push(n);
        }
        // close each orbit and link it to the one inside
        list.forEach((n, i) => edges.push({ a: n.id, b: list[(i + 1) % list.length].id, ring, orbit: o }));
        if (o) {
            list.forEach((n, i) => {
                if (R() < 0.3 || i % 40 === 0) {
                    edges.push({ a: nearest(orbits[o - 1], n).id, b: n.id, ring, orbit: o, join: true });
                }
            });
        }
        orbits.push(list);
    }
    // bridges
    const edge = nodes.slice(0, base).filter(n => n.ring >= NET_RINGS - 2);
    const bridges = [];
    for (let k = 0; k < OUTER_BRIDGES; k++) {
        const at = (k + 0.5) / OUTER_BRIDGES * Math.PI * 2;
        const near = edge.filter(n => Math.abs(Math.atan2(Math.sin(Math.atan2(n.y, n.x) - at), Math.cos(Math.atan2(n.y, n.x) - at))) < 0.35);
        const from = (near.length ? near : edge).reduce((b, n) => Math.hypot(n.x, n.y) > Math.hypot(b.x, b.y) ? n : b);
        const e = { a: from.id, b: nearest(orbits[0], from).id, ring: NET_RINGS + 2, orbit: 0, bridge: true };
        edges.push(e);
        bridges.push(e);
    }
    for (let i = base; i < nodes.length; i++) {
        nodes[i].req = reqFor(nodes[i].ring, R);
        // late luck makes some of these near impossible, so ask for the rarest element instead
        const q = nodes[i].req;
        if (q.t === 'cp' && rollsFor(q, 700, 3) > 3e5) {
            const els = ELEMENTS.filter(e => parseFormula(q.l)[e[0]]);
            nodes[i].req = { t: 'has', k: els.reduce((a, b) => b[2] > a[2] ? b : a)[0], n: 10 };
        }
    }
    const taken = new Set();
    BRIDGE_ORDER.forEach((k, i) => {
        const e = bridges[k];
        const [kind, cos, [sym, n]] = BRIDGE_UNLOCKS[i];
        e.kind = kind;
        e.val = cos || 1;
        nodes[e.b].req = { t: 'el', k: sym, n };
        taken.add(e);
    });
    const hard = n => rollsFor(n.req, 700, 3);
    // cosmetics go on the hardest line in their orbit
    const outerEdges = edges.filter(e => e.orbit != null);
    OUTER_UNLOCKS.forEach(([o, cos]) => {
        let best = null;
        let bc = -1;
        outerEdges.forEach(e => {
            if (e.orbit !== o || e.bridge || taken.has(e)) {
                return;
            }
            const c = Math.max(hard(nodes[e.a]), hard(nodes[e.b]));
            if (c > bc) {
                bc = c;
                best = e;
            }
        });
        taken.add(best);
        best.kind = 'cos';
        best.val = cos;
    });
    const free = outerEdges.filter(e => !taken.has(e));
    free.forEach(e => {
        let x = R();
        e.kind = OUTER_SHARE.find(([, p]) => (x -= p) < 0)[0];
    });
    Object.keys(OUTER_TOTALS).forEach(kind => {
        const list = free.filter(e => e.kind === kind);
        const wsum = list.reduce((s, e) => s + Math.pow(e.orbit + 1, 1.5), 0);
        list.forEach(e => e.val = Math.max(0.01, Math.round(OUTER_TOTALS[kind] * Math.pow(e.orbit + 1, 1.5) / wsum * 100) / 100));
    });
}
function net() {
    return NET || (NET = genNetwork());
}
const netFilled = id => !!netState[id];
// outer ring stays off the map until one of its slots can be reached
let outerMemo = null;
function outerShown() {
    if (!outerMemo || outerMemo.v !== netVer) {
        const N = net();
        outerMemo = { v: netVer, on: N.nodes.slice(N.base).some(n => netFilled(n.id) || netReachable(n.id)) };
    }
    return outerMemo.on;
}
function shownNet() {
    const N = net();
    if (outerShown()) {
        return N;
    }
    return N.inner || (N.inner = { nodes: N.nodes.slice(0, N.base), edges: N.edges.filter(e => e.orbit == null), adj: N.adj });
}
const NET_BIG = new Set(['mult', 'slot', 'chain', 'ion', 'hold', 'cos', 'drop']);
const edgeLit = e => netFilled(e.a) && netFilled(e.b);
function edgeDesc(e) {
    const v = e.val;
    if (e.orbit != null && NET_BIG.has(e.kind) && !edgeLit(e)) {
        return '???';
    }
    const outer = {
        quark: `+${v}% quarks`, event: `+${v}% event chance`, cdur: `+${v}% catalyst time`, dup: `+${v}% duplicate catalysts`,
        refund: `+${v}% catalyst refunds`, storm: `+${v}% Quark Storm size`, hold: 'Shop hold', drop: 'Catalyst drops (1 in 500 presses of Roll)',
        ion: 'Unlocks ionisation', cos: 'Unlocks ' + COSMETIC_NAMES[v]
    };
    return outer[e.kind] || (e.kind === 'luck' ? `+${v}% luck` : e.kind === 'mult' ? `×${v} luck` : e.kind === 'auto' ? `+${v}% autoroll speed` : e.kind === 'chain' ? 'Chain chance +1 step' : e.kind === 'extra' ? '+1 bonus roll' : e.kind === 'price' ? `−${v}% shop prices` : e.kind === 'refresh' ? `−${v} min shop restock` : e.kind === 'stock' ? `+${v}% rarer shop stock` : '+1 shop stock slot');
}
function reqShort(q) {
    if (q.t === 'el') {
        return (q.n > 1 ? q.n + ' ' : '') + q.k;
    }
    if (q.t === 'cp') {
        return q.l;
    }
    if (q.t === 'fam') {
        return (q.n > 1 ? q.n + '× ' : '') + FAMILY_ONE[q.k].split(' ')[0];
    }
    return q.k + '–?';
}
// collection records that can pay for a slot, most plentiful first
// finds grouped by what bond slots ask for, kept up as finds come in (compounds only when asked)
let payIdx = { ref: null };
function payIndex(cp) {
    const by = (m, k, c) => (m.get(k) || m.set(k, []).get(k)).push(c);
    const norm = c => c.norm || (c.norm = normalizeFormula(c.formula));
    if (payIdx.ref !== collection || payIdx.n > collection.length) {
        payIdx = { ref: collection, n: 0, fam: new Map(), has: new Map(), cp: null };
    }
    for (let i = payIdx.n; i < collection.length; i++) {
        const c = collection[i];
        if (!c.elements) {
            continue;
        }
        if (c.elements.length === 1) {
            by(payIdx.fam, familyOf(c.elements[0][0]), c);
        } else {
            new Set(c.elements.map(e => e[0])).forEach(sym => by(payIdx.has, sym, c));
        }
        if (payIdx.cp) {
            by(payIdx.cp, norm(c), c);
        }
    }
    payIdx.n = collection.length;
    if (cp && !payIdx.cp) {
        payIdx.cp = new Map();
        collection.forEach(c => c.elements && by(payIdx.cp, norm(c), c));
    }
    return payIdx;
}
function eligible(q) {
    const avail = c => (c.count || 1) - (c.spent || 0);
    let list;
    if (q.t === 'el') {
        const c = findFormula(q.k);
        list = c ? [c] : [];
    } else {
        const ix = payIndex(q.t === 'cp');
        list = (q.t === 'cp' ? ix.cp : q.t === 'fam' ? ix.fam : ix.has).get(q.k) || [];
    }
    return list.map(c => ({ c, n: avail(c) })).filter(x => x.n > 0).sort((a, b) => b.n - a.n);
}
var netVer = 0;
const payMemo = new Map();
function canPay(q) {
    const m = payMemo.get(q);
    if (m && m.v === netVer) {
        return m.ok;
    }
    const ok = eligible(q).reduce((s, x) => s + x.n, 0) >= q.n;
    payMemo.set(q, { v: netVer, ok });
    return ok;
}
function payPlan(q) {
    let need = q.n;
    const plan = [];
    eligible(q).forEach(x => {
        if (need <= 0) {
            return;
        }
        const take = Math.min(need, x.n);
        plan.push({ c: x.c, take });
        need -= take;
    });
    return need > 0 ? null : plan;
}
const netReachable = id => id === 0 || net().adj[id].some(i => {
    const e = net().edges[i];
    return netFilled(e.a === id ? e.b : e.a);
});
const netFillable = id => !netFilled(id) && netReachable(id) && canPay(net().nodes[id].req);
// every slot you could fill right now, worked out once per change
let fillMemo = null;
function fillableIds() {
    if (fillMemo && fillMemo.v === netVer) {
        return fillMemo.ids;
    }
    const ids = net().nodes.filter(n => netFillable(n.id)).map(n => n.id);
    fillMemo = { v: netVer, ids };
    return ids;
}
function fillSlot(id) {
    const n = net().nodes[id];
    if (!netFillable(id)) {
        return false;
    }
    const plan = payPlan(n.req);
    plan.forEach(p => p.c.spent = (p.c.spent || 0) + p.take);
    save();
    fillFree(id);
    return true;
}
function fillFree(id) {
    netState[id] = 1;
    saveNet();
    netVer++;
    buffCache = weightCache = null;
    setTimeout(jokeIntroCheck, 600);
    applyCosmetics();
}
// quark pity: outer ring slots can be bought outright once 3 bridges are lit
let pityMemo = null;
function pityOn() {
    if (!pityMemo || pityMemo.v !== netVer) {
        pityMemo = { v: netVer, on: net().edges.filter(e => e.bridge && edgeLit(e)).length >= 3, price: new Map() };
    }
    return pityMemo.on;
}
function pityPrice(n) {
    pityOn();
    const key = n.id + ':' + collection.length;
    if (pityMemo.price.has(key)) {
        return pityMemo.price.get(key);
    }
    const b = activeBuffStats();
    const q = n.req;
    const left = Math.max(1, q.n - eligible(q).reduce((s, x) => s + x.n, 0));
    const rolls = rollsFor(q, Math.round(b.luck - catBonus().luck), b.chainDenom) * left / q.n;
    const price = Number(Math.min(2.5e7, Math.max(1e6, rolls * 0.5)).toPrecision(2));
    pityMemo.price.set(key, price);
    return price;
}
const pityReady = n => n.orbit != null && !netFilled(n.id) && netReachable(n.id) && !canPay(n.req) && pityOn() && quarks >= pityPrice(n);
const agentReady = n => catInv.bondagent > 0 && !netFilled(n.id) && netReachable(n.id) && !canPay(n.req);
function useAgent(n) {
    catInv.bondagent--;
    if (!catInv.bondagent) {
        delete catInv.bondagent;
    }
    saveCats();
    fillFree(n.id);
}
function pityAsk(n) {
    const price = pityPrice(n);
    const w = openDialog('<h2>Use quarks for this slot?</h2><p>This will spend <b>' + formatNumber(price) + ' quarks</b> to fill the slot without its ' + esc(reqShort(n.req)) + '. It can\'t be undone.</p>' +
        '<div class="btn-row"><button class="primary" id="pityYes">Spend ' + formatNumber(price) + '</button><button class="ghost" id="pityNo">Cancel</button></div>');
    w.querySelector('#pityNo').onclick = closeDialog;
    w.querySelector('#pityYes').onclick = () => {
        closeDialog();
        if (!pityReady(n)) {
            return;
        }
        addQuarks(-price);
        fillFree(n.id);
        netFlash(n.id);
        bondSummary();
        $('netTotals').innerHTML = netTotalsHtml();
        renderRollStats();
        netDraw();
    };
}
// joke element bonuses, no luck or speed ones
const JOKE_BONUS = {
    Um: ['event', 25], Zz: ['away', 6], Mu: ['quark', 15], Ln: ['refund', 10], Df: ['cdur', 15], Cz: ['storm', 25], Mb: ['dup', 5], Dj: ['evlen', 25],
    Ha: ['price', 5], Ad: ['refresh', 2], Pi: ['quark', 3.14], Nu: ['alone', 50], Xx: ['secret', 5], Uo: ['jokerate', 100], Zo: ['cos', 'warp'], Gg: ['cos', 'gameover']
};
const jokeBonusText = sym => {
    const [k, v] = JOKE_BONUS[sym];
    return {
        event: `Events are ${v}% more likely`, away: `Away rolls cover ${v} more hours`, quark: `+${v}% quarks per roll`, refund: `${v}% chance a single-roll catalyst isn't used up`,
        cdur: `Catalysts last ${v}% longer`, storm: `Quark Storms pay ${v}% more`, dup: `${v}% chance a bought catalyst arrives as two`, evlen: `Events last ${v}% longer`,
        price: `Shop prices ${v}% lower`, refresh: `The shop restocks ${v} minutes sooner`, alone: `Rolls with no chain earn ${v}% more quarks`, secret: `Secret effects are ${v}% more likely`,
        jokerate: 'Joke catalysts appear twice as often in the shop', cos: v === 'warp' ? 'Unlocks the Warp scanner' : 'Unlocks the Game Over page and the Final Element badge'
    }[k];
};
// netBonus is lines only, bondBonus adds the jokes
let netCache = null;
function netBonus() {
    if (netCache && netCache.v === netVer) {
        return netCache.r;
    }
    const r = {
        add: 0, mult: 1, auto: 0, price: 0, refresh: 0, stock: 0, slots: 0, chain: 0, extra: 0,
        quark: 0, event: 0, cdur: 0, dup: 0, refund: 0, storm: 0, hold: false, ion: false, cos: [],
        away: 0, evlen: 0, alone: 0, secret: 0, jokerate: 0, drop: 0
    };
    // with the bonds tree switched off in the YAML, it gives nothing
    (apOpt('bonds_tree') ? net().edges : []).forEach(e => {
        if (!edgeLit(e)) {
            return;
        }
        if (e.kind === 'luck') {
            r.add += e.val;
        } else if (e.kind === 'mult') {
            r.mult *= e.val;
        } else if (e.kind === 'slot') {
            r.slots += 1;
        } else if (e.kind === 'cos') {
            r.cos.push(e.val);
        } else if (typeof r[e.kind] === 'boolean') {
            r[e.kind] = true;
        } else {
            r[e.kind] += e.val;
        }
    });
    // the oscilloscope comes with the first slot filled on outer ring 1
    if (apOpt('bonds_tree') && net().nodes.some(n => n.orbit === 0 && netFilled(n.id))) {
        r.cos.push('oscilloscope');
    }
    netCache = { v: netVer, r };
    return r;
}
let bondCache = null;
function bondBonus() {
    const n = netBonus();
    const found = jokesFound();
    if (bondCache && bondCache.n === n && bondCache.j === found) {
        return bondCache.r;
    }
    const r = Object.assign({}, n, { cos: n.cos.slice() });
    found.forEach(s => {
        const [k, v] = JOKE_BONUS[s];
        if (k === 'cos') {
            r.cos.push(v);
        } else {
            r[k] += v;
        }
    });
    bondCache = { n, j: found, r };
    return r;
}
function bondSummary() {
    const N = shownNet().nodes.length;
    const f = Object.keys(netState).length;
    $('homeBonds').textContent = f + ' / ' + N + ' slots';
}
// the network view
const netView = { x: 0, y: 0, z: 1, anim: null };
let netCanvas = null;
let netSel = null;
let netRaf = 0;
function netResize() {
    const cv = netCanvas;
    if (!cv) {
        return;
    }
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
    netDraw();
}
function netToScreen(x, y) {
    const r = netCanvas.getBoundingClientRect();
    return [(x - netView.x) * netView.z + r.width / 2, (y - netView.y) * netView.z + r.height / 2];
}
function netToWorld(sx, sy) {
    const r = netCanvas.getBoundingClientRect();
    return [(sx - r.width / 2) / netView.z + netView.x, (sy - r.height / 2) / netView.z + netView.y];
}
function netDrawSoon() {
    if (!netRaf) {
        netRaf = requestAnimationFrame(() => {
            netRaf = 0;
            netDraw();
        });
    }
}
function netDraw() {
    const cv = netCanvas;
    if (!cv || !$('bonds').classList.contains('active')) {
        return;
    }
    const g = cv.getContext('2d');
    const dpr = cv.width / Math.max(1, cv.getBoundingClientRect().width);
    const W = cv.width / dpr;
    const H = cv.height / dpr;
    const { nodes, edges } = shownNet();
    const z = netView.z;
    const t = performance.now();
    const head = netDraw.font || (netDraw.font = getComputedStyle(document.body).getPropertyValue('--head'));
    const ringCol = r => NET_RING_COL[Math.min(NET_RING_COL.length - 1, r)];
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    // blueprint grid
    const step = 64 * z;
    if (step > 10) {
        g.strokeStyle = 'rgba(232,239,233,.05)';
        g.lineWidth = 1;
        const ox = ((-netView.x * z + W / 2) % step + step) % step;
        const oy = ((-netView.y * z + H / 2) % step + step) % step;
        g.beginPath();
        for (let x = ox; x < W; x += step) {
            g.moveTo(x, 0);
            g.lineTo(x, H);
        }
        for (let y = oy; y < H; y += step) {
            g.moveTo(0, y);
            g.lineTo(W, y);
        }
        g.stroke();
    }
    const S = (x, y) => [(x - netView.x) * z + W / 2, (y - netView.y) * z + H / 2];
    const pad = 60;
    const vis = (x, y) => x > -pad && x < W + pad && y > -pad && y < H + pad;
    const far = z < 0.45;
    if (z < 0.24) {
        const pic = netFarPicture(ringCol);
        const k = z / pic.s;
        g.imageSmoothingEnabled = true;
        g.drawImage(pic.cv, (pic.x0 - netView.x) * z + W / 2, (pic.y0 - netView.y) * z + H / 2, pic.cv.width / pic.r * k, pic.cv.height / pic.r * k);
        const pulse = 0.5 + 0.5 * Math.sin(t / 260);
        g.globalAlpha = 0.4 + 0.6 * pulse;
        g.strokeStyle = '#f0c419';
        g.lineWidth = 2;
        let any = false;
        fillableIds().forEach(id => {
            const [x, y] = S(nodes[id].x, nodes[id].y);
            g.beginPath();
            g.arc(x, y, 6, 0, Math.PI * 2);
            g.stroke();
            any = true;
        });
        g.globalAlpha = 1;
        $('netJump').hidden = true;
        if (any) {
            netDrawSoon();
        }
        return;
    }
    // lines: unlit ones batched into two paths, lit ones drawn with a glow
    const dashed = new Path2D();
    const solid = new Path2D();
    const lit = [];
    const labels = [];
    edges.forEach(e => {
        const A = nodes[e.a];
        const B = nodes[e.b];
        const [ax, ay] = S(A.x, A.y);
        const [bx, by] = S(B.x, B.y);
        if (Math.max(ax, bx) < -pad || Math.min(ax, bx) > W + pad || Math.max(ay, by) < -pad || Math.min(ay, by) > H + pad) {
            return;
        }
        const on = edgeLit(e);
        if (on) {
            lit.push([ax, ay, bx, by, ringCol(e.ring)]);
        } else {
            const p = NET_BIG.has(e.kind) || far ? solid : dashed;
            p.moveTo(ax, ay);
            p.lineTo(bx, by);
        }
        if (z > 0.8) {
            const relevant = on || netFilled(e.a) || netFilled(e.b) || NET_BIG.has(e.kind);
            const mx = (ax + bx) / 2;
            const my = (ay + by) / 2;
            if ((relevant || z > 1.6) && vis(mx, my)) {
                labels.push([mx, my, e, on]);
            }
        }
    });
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(232,239,233,.22)';
    g.lineWidth = Math.max(1, 1.5 * z);
    g.stroke(solid);
    if (!far) {
        g.setLineDash([6 * z, 5 * z]);
        g.stroke(dashed);
        g.setLineDash([]);
    }
    lit.forEach(([ax, ay, bx, by, col]) => {
        g.strokeStyle = col;
        g.globalAlpha = 0.35;
        g.lineWidth = Math.max(3, 10 * z);
        g.beginPath();
        g.moveTo(ax, ay);
        g.lineTo(bx, by);
        g.stroke();
        g.globalAlpha = 1;
        g.lineWidth = Math.max(1.5, 3.2 * z);
        g.stroke();
    });
    if (labels.length) {
        const k = Math.min(1.4, z);
        g.font = '600 ' + Math.round(10.5 * k) + 'px ' + head;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        labels.forEach(([mx, my, e, on]) => {
            const txt = edgeDesc(e);
            const w = g.measureText(txt).width + 10;
            g.fillStyle = 'rgba(10,16,14,.85)';
            g.fillRect(mx - w / 2, my - 9 * k, w, 18 * k);
            g.fillStyle = on ? ringCol(e.ring) : NET_BIG.has(e.kind) ? '#f0c419' : 'rgba(232,239,233,.55)';
            g.fillText(txt, mx, my + 0.5);
        });
    }
    // slots
    const R = 24 * z;
    const pulse = 0.5 + 0.5 * Math.sin(t / 260);
    let anyAvail = false;
    if (far) {
        // zoomed out: plain dots, batched by colour
        const groups = new Map();
        const ring = new Path2D();
        const red = new Path2D();
        const rr = Math.max(2, R);
        nodes.forEach(n => {
            const [x, y] = S(n.x, n.y);
            if (!vis(x, y)) {
                return;
            }
            const filled = netFilled(n.id);
            const avail = !filled && netReachable(n.id) && canPay(n.req);
            anyAvail = anyAvail || avail;
            const key = filled ? ringCol(n.ring) : 'rgba(232,239,233,.35)';
            if (!groups.has(key)) {
                groups.set(key, new Path2D());
            }
            const p = groups.get(key);
            p.moveTo(x + rr, y);
            p.arc(x, y, rr, 0, Math.PI * 2);
            if (avail || agentReady(n) || pityReady(n)) {
                const p2 = avail ? ring : red;
                p2.moveTo(x + rr + 4, y);
                p2.arc(x, y, rr + 4, 0, Math.PI * 2);
            }
        });
        groups.forEach((p, col) => {
            g.fillStyle = col;
            g.fill(p);
        });
        g.globalAlpha = 0.4 + 0.6 * pulse;
        g.strokeStyle = '#f0c419';
        g.lineWidth = 2;
        g.stroke(ring);
        g.strokeStyle = '#ff5a4a';
        g.stroke(red);
        g.globalAlpha = 1;
    } else {
        nodes.forEach(n => {
            const [x, y] = S(n.x, n.y);
            if (!vis(x, y)) {
                return;
            }
            const filled = netFilled(n.id);
            const reach = netReachable(n.id);
            const avail = !filled && reach && canPay(n.req);
            const pity = !avail && (agentReady(n) || pityReady(n));
            const col = ringCol(n.ring);
            anyAvail = anyAvail || avail || pity;
            g.globalAlpha = filled || reach ? 1 : 0.35;
            const hex = n.req.t === 'cp' || n.req.t === 'has';
            slotPath(g, x, y, R, hex);
            g.fillStyle = filled ? col : '#0d1311';
            g.fill();
            g.lineWidth = Math.max(1.2, (filled ? 2.5 : 1.6) * z);
            g.strokeStyle = filled ? col : avail ? '#f0c419' : pity ? '#ff5a4a' : 'rgba(232,239,233,.4)';
            g.stroke();
            if (avail || pity) {
                g.globalAlpha = 0.3 + 0.5 * pulse;
                slotPath(g, x, y, R + (5 + 5 * pulse) * z, hex);
                g.strokeStyle = avail ? '#f0c419' : '#ff5a4a';
                g.lineWidth = Math.max(1, 2 * z);
                g.stroke();
            }
            if (netSel === n.id) {
                g.globalAlpha = 1;
                slotPath(g, x, y, R + 4 * z, hex);
                g.strokeStyle = '#fff';
                g.lineWidth = 2;
                g.stroke();
            }
            g.globalAlpha = filled || reach ? 1 : 0.45;
            if (z > 0.38) {
                const label = filled && n.req.t === 'el' && n.req.n === 1 ? n.req.k : reqShort(n.req);
                let fs = 13 * z;
                g.font = '700 ' + fs + 'px ' + head;
                const w = g.measureText(label).width;
                if (w > R * 1.75) {
                    fs *= R * 1.75 / w;
                    g.font = '700 ' + fs + 'px ' + head;
                }
                g.fillStyle = filled ? '#0d1311' : '#e8efe9';
                g.textAlign = 'center';
                g.textBaseline = 'middle';
                g.fillText(label, x, y + 1);
            }
            g.globalAlpha = 1;
        });
    }
    // arrows at the edge pointing to fillable slots off screen
    const off = [];
    fillableIds().forEach(id => {
        const [x, y] = S(nodes[id].x, nodes[id].y);
        if (x < 0 || x > W || y < 0 || y > H) {
            off.push([x, y, Math.hypot(x - W / 2, y - H / 2)]);
        }
    });
    off.sort((a, b) => a[2] - b[2]);
    off.slice(0, 8).forEach(([x, y]) => {
        const a = Math.atan2(y - H / 2, x - W / 2);
        const m = 26;
        const kx = (W / 2 - m) / Math.abs(Math.cos(a) || 1e-6);
        const ky = (H / 2 - m) / Math.abs(Math.sin(a) || 1e-6);
        const d = Math.min(kx, ky);
        g.save();
        g.translate(W / 2 + Math.cos(a) * d, H / 2 + Math.sin(a) * d);
        g.rotate(a);
        g.globalAlpha = 0.55 + 0.45 * pulse;
        g.fillStyle = '#f0c419';
        g.beginPath();
        g.moveTo(12, 0);
        g.lineTo(-8, -9);
        g.lineTo(-3, 0);
        g.lineTo(-8, 9);
        g.closePath();
        g.fill();
        g.restore();
    });
    const jb = $('netJump');
    if (jb) {
        jb.hidden = !(off.length && !anyAvail);
    }
    // keep animating only while something on screen pulses
    if (anyAvail || off.length) {
        netDrawSoon();
    }
}
let netFarPic = null;
function netFarPicture(ringCol) {
    const key = netVer + ':' + Object.keys(netState).length + ':' + outerShown() + ':' + !!catInv.bondagent;
    if (netFarPic && netFarPic.key === key) {
        return netFarPic;
    }
    const { nodes, edges } = shownNet();
    const s = 0.24;
    const r = Math.min(2, devicePixelRatio || 1);
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    nodes.forEach(n => {
        x0 = Math.min(x0, n.x);
        y0 = Math.min(y0, n.y);
        x1 = Math.max(x1, n.x);
        y1 = Math.max(y1, n.y);
    });
    x0 -= 60;
    y0 -= 60;
    x1 += 60;
    y1 += 60;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((x1 - x0) * s * r);
    cv.height = Math.ceil((y1 - y0) * s * r);
    const g = cv.getContext('2d');
    g.scale(r, r);
    const P = (x, y) => [(x - x0) * s, (y - y0) * s];
    const dim = new Path2D();
    edges.forEach(e => {
        if (edgeLit(e)) {
            return;
        }
        const [ax, ay] = P(nodes[e.a].x, nodes[e.a].y);
        const [bx, by] = P(nodes[e.b].x, nodes[e.b].y);
        dim.moveTo(ax, ay);
        dim.lineTo(bx, by);
    });
    g.strokeStyle = 'rgba(232,239,233,.22)';
    g.lineWidth = 1;
    g.stroke(dim);
    g.lineCap = 'round';
    edges.forEach(e => {
        if (!edgeLit(e)) {
            return;
        }
        const [ax, ay] = P(nodes[e.a].x, nodes[e.a].y);
        const [bx, by] = P(nodes[e.b].x, nodes[e.b].y);
        g.strokeStyle = ringCol(e.ring);
        g.lineWidth = 2.5;
        g.beginPath();
        g.moveTo(ax, ay);
        g.lineTo(bx, by);
        g.stroke();
    });
    const groups = new Map();
    nodes.forEach(n => {
        const key2 = netFilled(n.id) ? ringCol(n.ring) : 'rgba(232,239,233,.35)';
        if (!groups.has(key2)) {
            groups.set(key2, new Path2D());
        }
        const [x, y] = P(n.x, n.y);
        const p = groups.get(key2);
        p.moveTo(x + 3, y);
        p.arc(x, y, 3, 0, Math.PI * 2);
    });
    groups.forEach((p, col) => {
        g.fillStyle = col;
        g.fill(p);
    });
    return netFarPic = { key, cv, s, r, x0, y0 };
}
function slotPath(g, x, y, r, hex) {
    g.beginPath();
    if (!hex) {
        g.arc(x, y, r, 0, Math.PI * 2);
        return;
    }
    for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + i * Math.PI / 3;
        const px = x + Math.cos(a) * r * 1.08;
        const py = y + Math.sin(a) * r * 1.08;
        if (i) {
            g.lineTo(px, py);
        } else {
            g.moveTo(px, py);
        }
    }
    g.closePath();
}
function netGlideTo(x, y, z) {
    const from = { x: netView.x, y: netView.y, z: netView.z };
    const to = { x, y, z: z || Math.max(0.9, netView.z) };
    const t0 = performance.now();
    const d = 800;
    netView.anim = true;
    (function f(now) {
        const k = Math.min(1, (now - t0) / d);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        // pull back a little mid-flight so long jumps read as travel
        const dip = Math.sin(Math.PI * k) * Math.min(0.45, Math.hypot(to.x - from.x, to.y - from.y) / 3000);
        netView.x = from.x + (to.x - from.x) * e;
        netView.y = from.y + (to.y - from.y) * e;
        netView.z = (from.z + (to.z - from.z) * e) * (1 - dip);
        netDraw();
        if (k < 1) {
            requestAnimationFrame(f);
        } else {
            netView.anim = null;
            netDraw();
        }
    })(t0);
}
function netJump() {
    const { nodes } = shownNet();
    let best = null;
    fillableIds().map(id => nodes[id]).forEach(n => {
        const d = Math.hypot(n.x - netView.x, n.y - netView.y);
        if (!best || d < best.d) {
            best = { n, d };
        }
    });
    if (best) {
        netGlideTo(best.n.x, best.n.y, 1.1);
    }
}
function netTotalsHtml() {
    const b = netBonus();
    const rows = [['Luck', '+' + b.add.toFixed(2) + '%'], ['Luck multiplier', '×' + b.mult.toFixed(3)], ['Autoroll speed', '+' + b.auto.toFixed(1) + '%'], ['Shop prices', '−' + b.price.toFixed(2) + '%'], ['Shop restock', '−' + b.refresh.toFixed(2) + ' min'], ['Rarer shop stock', '+' + b.stock.toFixed(2) + '%'], ['Shop stock slots', '+' + b.slots], ['Bonus rolls', '+' + b.extra], ['Chain steps', '+' + b.chain]];
    [['Quarks per roll', b.quark, '%'], ['Event chance', b.event, '%'], ['Catalyst duration', b.cdur, '%'], ['Duplicate catalysts', b.dup, '% chance'],
        ['Single-roll catalysts kept', b.refund, '% chance'], ['Bigger Quark Storms', b.storm, '%']].forEach(([k, v, u]) => {
        if (v) {
            rows.push([k, '+' + v.toFixed(2) + u]);
        }
    });
    [['Shop hold', b.hold], ['Ionisation', b.ion], ['Joke periodic table', jokesOn()]].forEach(([k, on]) => {
        if (on) {
            rows.push([k, 'Unlocked']);
        }
    });
    if (b.cos.length) {
        rows.push(['Cosmetics unlocked', b.cos.length]);
    }
    if (b.drop) {
        rows.push(['Catalyst drops', '1 in ' + Math.round(100 / b.drop) + ' presses']);
    }
    return rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
}
// tapping a slot fills it straight away when you can; otherwise the slot flashes red
function netSelect(id) {
    netSel = null;
    if (id == null) {
        netDraw();
        return;
    }
    if (fillSlot(id)) {
        uiSound('bond');
        netFlash(id);
        bondSummary();
        $('netTotals').innerHTML = netTotalsHtml();
        renderRollStats();
    } else if (agentReady(net().nodes[id])) {
        useAgent(net().nodes[id]);
        uiSound('bond');
        netFlash(id);
        bondSummary();
        $('netTotals').innerHTML = netTotalsHtml();
        renderRollStats();
    } else if (pityReady(net().nodes[id])) {
        pityAsk(net().nodes[id]);
    } else if (!netFilled(id)) {
        uiSound('deny');
        netFlash(id, '#ff5a4a');
    }
    netDraw();
}
function netFlash(id, colour) {
    const n = net().nodes[id];
    const fx = $('netFx');
    const [x, y] = netToScreen(n.x, n.y);
    const e = document.createElement('i');
    e.style.left = x + 'px';
    e.style.top = y + 'px';
    e.style.setProperty('--c', colour || NET_RING_COL[Math.min(NET_RING_COL.length - 1, n.ring)]);
    if (colour) {
        e.className = 'deny';
    }
    fx.appendChild(e);
    setTimeout(() => e.remove(), 900);
}
function renderBonds() {
    netCanvas = $('netCanvas');
    bondSummary();
    $('netTotals').innerHTML = netTotalsHtml();
    if (!netView.init) {
        netView.init = true;
        netView.x = 0;
        netView.y = 0;
        netView.z = innerWidth < 600 ? 0.8 : 1;
    }
    netSelect(null);
    netResize();
}
{
    const cv = $('netCanvas');
    const pts = new Map();
    let drag = null;
    let pinch = null;
    let moved = false;
    const zoomAt = (sx, sy, f) => {
        const [wx, wy] = netToWorld(sx, sy);
        netView.z = Math.max(0.05, Math.min(2.6, netView.z * f));
        const r = cv.getBoundingClientRect();
        netView.x = wx - (sx - r.width / 2) / netView.z;
        netView.y = wy - (sy - r.height / 2) / netView.z;
        netDrawSoon();
    };
    const local = e => {
        const r = cv.getBoundingClientRect();
        return [e.clientX - r.left, e.clientY - r.top];
    };
    cv.addEventListener('pointerdown', e => {
        cv.setPointerCapture(e.pointerId);
        pts.set(e.pointerId, local(e));
        moved = false;
        if (pts.size === 1) {
            drag = { p: local(e), x: netView.x, y: netView.y };
        } else if (pts.size === 2) {
            const [a, b] = [...pts.values()];
            pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: netView.z, m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] };
            drag = null;
        }
    });
    cv.addEventListener('pointermove', e => {
        if (!pts.has(e.pointerId)) {
            return;
        }
        pts.set(e.pointerId, local(e));
        if (pinch && pts.size >= 2) {
            const [a, b] = [...pts.values()];
            const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
            const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
            const [wx, wy] = netToWorld(pinch.m[0], pinch.m[1]);
            netView.z = Math.max(0.05, Math.min(2.6, pinch.z * d / pinch.d));
            const r = cv.getBoundingClientRect();
            netView.x = wx - (m[0] - r.width / 2) / netView.z;
            netView.y = wy - (m[1] - r.height / 2) / netView.z;
            pinch.m = m;
            pinch.z = netView.z;
            pinch.d = d;
            moved = true;
            netDrawSoon();
        } else if (drag) {
            const p = local(e);
            const dx = p[0] - drag.p[0];
            const dy = p[1] - drag.p[1];
            if (Math.hypot(dx, dy) > 6) {
                moved = true;
            }
            netView.x = drag.x - dx / netView.z;
            netView.y = drag.y - dy / netView.z;
            netDrawSoon();
        }
    });
    const up = e => {
        if (!pts.has(e.pointerId)) {
            return;
        }
        const p = local(e);
        pts.delete(e.pointerId);
        if (pts.size < 2) {
            pinch = null;
        }
        if (pts.size === 1) {
            const q = [...pts.values()][0];
            drag = { p: q, x: netView.x, y: netView.y };
            return;
        }
        drag = null;
        if (!moved && e.type === 'pointerup') {
            const [wx, wy] = netToWorld(p[0], p[1]);
            let hit = null;
            shownNet().nodes.forEach(n => {
                const d = Math.hypot(n.x - wx, n.y - wy);
                if (d < 30 / Math.min(1, netView.z) && (!hit || d < hit.d)) {
                    hit = { n, d };
                }
            });
            netSelect(hit ? hit.n.id : null);
        }
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => {
        e.preventDefault();
        const [sx, sy] = local(e);
        zoomAt(sx, sy, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
    }, { passive: false });
    addEventListener('resize', () => {
        if ($('bonds').classList.contains('active')) {
            netResize();
        }
    });
    $('netJump').onclick = netJump;
    $('netCentre').onclick = () => netGlideTo(0, 0, innerWidth < 600 ? 0.8 : 1);
    $('netTotalsBtn').onclick = () => $('netTotalsWrap').classList.toggle('open');
}
