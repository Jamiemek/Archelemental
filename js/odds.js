// held still for the length of one roll
let buffHold = null;
function activeBuffStats() {
    if (buffHold) {
        return buffHold;
    }
    if (buffCache && Date.now() < buffCache.exp) {
        return buffCache;
    }
    return buffCache = computeBuffs();
}
function computeBuffs() {
    const found = discoveredSymbols();
    let luck = 0;
    let speed = 0;
    let extra = 0;
    let chainSteps = 0;
    let autoUnlock = false;
    let autoTime = 0;
    let autoCool = 0;
    let autoSpeed = 0;
    found.forEach(sym => {
        const b = ELEMENT_BUFFS.get(sym);
        if (!b) {
            return;
        }
        if (b.type === 'autounlock') {
            autoUnlock = true;
        }
        if (b.type === 'autospeed') {
            autoSpeed += b.value;
        }
        if (b.type === 'autotime') {
            autoTime += b.value;
        }
        if (b.type === 'autocool') {
            autoCool += b.value;
        }
        if (b.type === 'luck') {
            luck += b.value;
        }
        if (b.type === 'speed') {
            speed += b.value;
        }
        if (b.type === 'extra') {
            extra += 1;
        }
        if (b.type === 'chain') {
            chainSteps += 1;
        }
    });
    const bd = bondBonus();
    const cb = catBonus();
    // each Chain Boost from the multiworld is one step better, like a Chain Primer that never runs out
    const denom = Math.max(CHAIN_MAX, BASE_CHAIN - (BASE_CHAIN - CHAIN_MAX) / 8 * Math.min(8, chainSteps + bd.chain)) - apCount('Chain Boost');
    return {
        found, luck: (luck + bd.add + apLuck()) * bd.mult + cb.luck, speed: speed + cb.speed, autoUnlocked: autoUnlock || apCount('Autoroll') > 0, autoSpeed: autoSpeed + bd.auto, autoGap: Math.max(AUTO_MIN_GAP, AUTO_BASE_GAP / (1 + (autoSpeed + bd.auto) / 100)), extra: Math.min(3, extra + bd.extra + cb.extra + apCount('Extra Roll')), chainSteps: Math.min(8, chainSteps), chainDenom: cb.chainMax ? CHAIN_MAX : Math.max(CHAIN_MAX, denom - cb.chain), fam: cb.fam, quark: cb.quark + bd.quark,
        // reagent/punchline add, running gag multiplies
        jokeMult: (1 + cb.joke / 100) * (cb.gag || 1), level: cb.level, exp: catNextExpiry()
    };
}
function weightTable(extraLuck, only) {
    const b = activeBuffStats();
    if (!extraLuck && !only && weightCache && weightCache.b === b && weightCache.pool.length === rollPool().length) {
        return weightCache;
    }
    const luck = b.luck + (extraLuck || 0);
    let total = 0;
    let total0 = 0;
    const pool = rollPool();
    const flat = [];
    const w = pool.map(e => {
        if (only && !only(e)) {
            flat.push(0);
            return 0;
        }
        const m = (1 + (b.fam[familyOf(e[0])] || 0) / 100) * (isJoke(e[0]) ? b.jokeMult : 1) / e[2];
        const v = m * Math.pow(1 + 1.5 * (Math.log10(e[2] + 1) / 3), (luck / 100) / 1.5);
        flat.push(m);
        total += v;
        total0 += m;
        return v;
    });
    // leveller: anything luck has made rarer gets its 0% luck share back
    if (b.level && total0) {
        const k = total / total0;
        total = 0;
        for (let i = 0; i < w.length; i++) {
            w[i] = Math.max(w[i], flat[i] * k);
            total += w[i];
        }
    }
    const t = { w, total, b, pool };
    if (!extraLuck && !only) {
        weightCache = t;
    }
    return t;
}
// one element, with the active buffs; extraLuck and only come from single-roll catalysts
function weightedElement(extraLuck, only) {
    const { w, total, pool } = weightTable(extraLuck, only);
    let r = rnd() * total;
    let i = 0;
    for (; i < pool.length - 1; i++) {
        r -= w[i];
        if (r <= 0) {
            break;
        }
    }
    return pool[i];
}
// joke table
let jokeMix = true;
let jokeHide = false;
try {
    jokeMix = localStorage.getItem('elementalJokeMix') !== '0';
    jokeHide = localStorage.getItem('elementalJokeHide') === '1';
} catch (e) { }
// the joke table arrives as an item from the multiworld
const jokesOn = () => apHasJokes();
const rollPool = () => jokesOn() ? ELEMENTS.concat(JOKES) : ELEMENTS;
// false = chain stops (mixing off rule)
function chainStep(elements, e) {
    if (jokeMix || !jokesOn() || isJoke(e[0]) === isJoke(elements[0][0])) {
        elements.push(e);
        return true;
    }
    if (isJoke(e[0])) {
        elements.length = 0;
        elements.push(e);
    }
    return false;
}
function rollElements(luckUp, first, o) {
    const elements = [first || weightedElement(luckUp)];
    const fam = o.magnet ? familyOf(elements[0][0]) : null;
    const only = fam ? (e => familyOf(e[0]) === fam) : undefined;
    while (elements.length < 30 && ((o.linked && elements.length === 1) || rnd() < 1 / o.denom)) {
        if (!chainStep(elements, weightedElement(luckUp, only))) {
            break;
        }
    }
    return elements;
}
// black hole / twin horizon
function rollTwice(make) {
    const a = make();
    const b = make();
    return exactRarity(b, 0) < exactRarity(a, 0) ? b : a;
}
function quarkMult(elements, buffs) {
    const cb = catBonus();
    const n = elements.length;
    const pct = (buffs.quark || 0) + (n === 1 ? bondBonus().alone : 0) + (n > 1 ? cb.lens : 0) + cb.heavy * (n - 1);
    return (1 + pct / 100) * (cb.laugh && elements.some(e => isJoke(e[0])) ? 3 : 1);
}
// + Redactium
const secretChance = () => SECRET_CHANCE + bondBonus().secret / 100;
function hillFormula(elements) {
    const counts = {};
    elements.forEach(e => counts[e[0]] = (counts[e[0]] || 0) + 1);
    let syms = Object.keys(counts);
    syms.sort((a, b) => {
        if (counts.C && a === 'C') {
            return -1;
        }
        if (counts.C && b === 'C') {
            return 1;
        }
        if (counts.C && a === 'H' && b !== 'C') {
            return -1;
        }
        if (counts.C && b === 'H' && a !== 'C') {
            return 1;
        }
        return a.localeCompare(b);
    });
    return syms.map(s => s + (counts[s] > 1 ? counts[s] : '')).join('');
}
const BASE_CHAIN = 8;
const CHAIN_MAX = 5;
// Odds are always base odds: no luck, chain or other buffs are counted
function exactRarity(elements, guaranteedExtras = 0) {
    const n = Math.max(1, elements.length - guaranteedExtras);
    let log10 = -(n - 1) * Math.log10(BASE_CHAIN);
    elements.forEach(e => log10 -= Math.log10(elementBySymbol[e[0]][2]));
    return log10;
}
// ions: 1/100 for +, 1/1000 for -, - wins a tie
const ION_PLUS = 0.01;
const ION_MINUS = 0.001;
const ION_MAX = 3;
function rollIon() {
    if (!bondBonus().ion) {
        return 0;
    }
    const plus = rnd() < ION_PLUS;
    const minus = rnd() < ION_MINUS;
    if (!plus && !minus) {
        return 0;
    }
    const p = minus ? ION_MINUS : ION_PLUS;
    let n = 1;
    while (n < ION_MAX && rnd() < p) {
        n++;
    }
    return minus ? -n : n;
}
const ionScoreMult = ion => ion > 0 ? 1.5 * ion : ion < 0 ? -3 * ion : 1;
const ionLog = ion => ion > 0 ? -2 * ion : ion < 0 ? 3 * ion : 0;
const ION_SUP = ['', '', '²', '³'];
const ionText = ion => ion ? ION_SUP[Math.abs(ion)] + (ion > 0 ? '⁺' : '⁻') : '';
const withIon = (formula, ion) => formula + ionText(ion || 0);
const entryIons = c => ionText(c.ionP || 0) + ionText(-(c.ionN || 0));
function ionise(rec, ion) {
    rec.ion = ion;
    if (ion) {
        rec.baseLog = rec.log;
        rec.baseScore = rec.score;
        rec.log += ionLog(ion);
        rec.score *= ionScoreMult(ion);
        rec.rarity = rarityText(rec.log);
    }
    return rec;
}
let ionMarks = {};
let ionNew = [];
try {
    const v = JSON.parse(localStorage.getItem('elementalIons') || '{}');
    ionMarks = v.m || {};
    ionNew = v.n || [];
} catch (e) { }
function ionSave() {
    try {
        localStorage.setItem('elementalIons', JSON.stringify({ m: ionMarks, n: ionNew }));
    } catch (e) { }
}
function ionCredit(sym, ion) {
    if (!ion) {
        return;
    }
    const m = ionMarks[sym] || [0, 0];
    const k = ion > 0 ? 0 : 1;
    if (Math.abs(ion) > m[k]) {
        m[k] = Math.abs(ion);
        ionMarks[sym] = m;
        if (!ionNew.includes(sym)) {
            ionNew.push(sym);
        }
        ionSave();
    }
}
function rarityText(log) {
    const value = 10 ** (-log);
    if (Number.isFinite(value) && value < 1e21) {
        return '1/' + Math.max(1, Math.round(value)).toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    return '≈ 1/' + value.toExponential(2).replace('+', '');
}
// Quarks earned by one roll
const QUARK_RATE = 0.1;
const QUARK_KNEE = 10000;
function quarksFor(score, mult) {
    const base = score <= QUARK_KNEE ? Math.sqrt(score) : Math.pow(score, 0.75) / Math.pow(QUARK_KNEE, 0.25);
    return base * QUARK_RATE * mult;
}
const oddsSum = elements => elements.reduce((sum, e) => sum + elementBySymbol[e[0]][2], 0);
// score: odds summed, with a bonus per extra element that grows from x0.2 to x3 at 1.5 billion
function rollScore(elements) {
    return scoreFrom(oddsSum(elements), elements.length);
}
function scoreFrom(s, n) {
    return s * (1 + (n - 1) * Math.min(3, 0.2 + 2.8 * Math.pow(Math.log(1 + s / 1e6) / Math.log(1501), 2)));
}
function fmtScore(n) {
    return Math.round(n).toLocaleString('en-US');
}
let displayMode = 'score';
try {
    displayMode = localStorage.getItem('elementalDisplay') === 'odds' ? 'odds' : 'score';
} catch (e) { }
// The rarity shown for a record, as odds or score depending on the setting (or a forced mode).
function rarityShown(rec, mode = displayMode) {
    if (mode === 'score') {
        return fmtScore(Number.isFinite(rec.score) ? rec.score : rollScore(rec.elements));
    }
    return Number.isFinite(rec.log) ? rarityText(rec.log) : (rec.rarity || '');
}
function rarityWord(mode = displayMode) {
    return mode === 'score' ? 'Score' : 'Odds';
}
const APP_VERSION = '1.1.0';
let quarks = 0;
try {
    quarks = parseFloat(localStorage.getItem('elementalQuarks')) || 0;
} catch (e) { }
function renderQuarks() {
    const el = $('quarkCount');
    if (el) {
        el.textContent = quarks.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}
function addQuarks(n) {
    quarks += n;
    try {
        localStorage.setItem('elementalQuarks', String(quarks));
    } catch (e) { }
    renderQuarks();
}
// Quark Storm. After any press of Roll there's a 1 in 8,000 chance of a storm, which
// lasts the next 100 presses
const QSTORM_CHANCE = 1 / 8000;
const QSTORM_PRESSES = 100;
const QSTORM_MIN = 2;
const QSTORM_MAX = 30;
let qStorm = null;
try {
    const v = JSON.parse(localStorage.getItem('elementalQStorm') || 'null');
    qStorm = v && v.left > 0 ? { left: Math.min(QSTORM_PRESSES * 3, Math.floor(v.left)), got: +v.got || 0 } : null;
} catch (e) { }
function qStormSave() {
    try {
        if (qStorm) {
            localStorage.setItem('elementalQStorm', JSON.stringify(qStorm));
        } else {
            localStorage.removeItem('elementalQStorm');
        }
    } catch (e) { }
}
const qStormOn = () => !!(qStorm && qStorm.left > 0);
// ring 1 raises these
function qStormRange() {
    const s = bondBonus().storm / 100;
    return [QSTORM_MIN + Math.round(2 * s), QSTORM_MAX + Math.round(20 * s)];
}
const eventChanceMult = () => 1 + (bondBonus().event + catBonus().event) / 100;
const qStormChance = () => QSTORM_CHANCE * eventChanceMult();
// deja-vium, lightning rod, event logger
function eventLength(base, storm) {
    return Math.round(base * (1 + bondBonus().evlen / 100) * (storm && takeFlag('rod') ? 1.5 : 1) * (takeFlag('logger') ? 2 : 1));
}
function qStormStart() {
    qStorm = { left: eventLength(QSTORM_PRESSES, true), got: 0 };
    qStormSave();
}
// One press of Roll with count rolls
function qStormPress(count) {
    if (qStormOn()) {
        const [lo, hi] = qStormRange();
        const add = Array.from({ length: count }, () => lo + Math.floor(rnd() * (hi - lo + 1)));
        const sum = add.reduce((a, b) => a + b, 0);
        qStorm.left--;
        qStorm.got += sum;
        const ended = qStorm.left <= 0 ? qStorm.got : 0;
        if (ended) {
            qStorm = null;
        }
        qStormSave();
        return { add, sum, ended };
    }
    if (rnd() < qStormChance()) {
        qStormStart();
        return { started: true };
    }
    return null;
}
// supercollider + black hole, one event at a time
const EVENTS = {
    collider: { name: 'Supercollider', chance: 1 / 16000, presses: 30, what: 'chain chance is 1 in 2' },
    hole: { name: 'Black Hole', chance: 1 / 12000, presses: 50, what: 'every roll is rolled twice and keeps the rarer' }
};
let evRun = null;
try {
    const v = JSON.parse(localStorage.getItem('elementalEvent') || 'null');
    evRun = v && EVENTS[v.id] && v.left > 0 ? { id: v.id, left: Math.min(500, Math.floor(v.left)), s: v.s, co: v.co, src: v.src } : null;
} catch (e) { }
function evSave() {
    try {
        if (evRun) {
            localStorage.setItem('elementalEvent', JSON.stringify(evRun));
        } else {
            localStorage.removeItem('elementalEvent');
        }
    } catch (e) { }
}
// the Supercollider is a reward for finding nihonium
const colliderOn = () => discoveredSymbols().has(COLLIDER_SYMBOL);
const evOn = id => !!evRun && (!id || evRun.id === id);
const anyEventOn = () => qStormOn() || evOn();
const eventNow = () => qStormOn() ? 'storm' : evOn() ? evRun.id : null;
function evStart(id) {
    evRun = { id, left: eventLength(EVENTS[id].presses, false) };
    evSave();
}
// events can be switched off in the YAML
function eventsPress(count) {
    if (!apOpt('events')) {
        return null;
    }
    if (evOn()) {
        const id = evRun.id;
        evRun.left--;
        if (evRun.left <= 0) {
            evRun = null;
        }
        evSave();
        return { ev: id, ended: !evRun };
    }
    const st = qStormPress(count);
    if (st) {
        return st;
    }
    for (const id of Object.keys(EVENTS)) {
        if (id === 'collider' && !colliderOn()) {
            continue;
        }
        if (rnd() < EVENTS[id].chance * eventChanceMult()) {
            evStart(id);
            return { ev: id, started: true };
        }
    }
    return null;
}
function renderQStorm(last) {
    const bar = $('qStormBar');
    if (!bar) {
        return;
    }
    bar.className = 'qstorm-bar' + (evOn() ? ' ev-' + evRun.id : '');
    if (evOn()) {
        bar.hidden = false;
        bar.innerHTML = '<span class="qs-name">' + EVENTS[evRun.id].name + '</span><span class="qs-left"><b>' + evRun.left + '</b> ' + (evRun.left === 1 ? 'roll' : 'rolls') + ' left</span><span class="qs-got">' + EVENTS[evRun.id].what + '</span>';
        return;
    }
    bar.hidden = !qStormOn();
    if (!bar.hidden) {
        bar.innerHTML = '<span class="qs-name">Quark Storm</span><span class="qs-left"><b>' + qStorm.left + '</b> ' + (qStorm.left === 1 ? 'roll' : 'rolls') + ' left</span>' +
            '<span class="qs-got"><span class="q-sym" aria-hidden="true">q</span> +' + formatNumber(Math.round(qStorm.got)) + (last ? '<small>+' + last + ' this roll</small>' : '') + '</span>';
    }
}
