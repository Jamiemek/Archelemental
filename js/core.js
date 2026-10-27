function showAchievementToast(a) {
    const toast = $('achievementToast');
    $('achievementToastKicker').textContent = a.kicker || 'Achievement unlocked';
    $('achievementToastName').textContent = a.name;
    $('achievementToastDesc').textContent = a.flavor;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 4200);
}
function checkAchievements(record) {
    const matches = ACHIEVEMENTS.filter(a => a.hill === record.formula && !unlockedAchievements.includes(a.formula));
    matches.forEach(a => {
        unlockedAchievements.push(a.formula);
        showAchievementToast(a);
    });
    if (matches.length) {
        try {
            localStorage.setItem('elementalAchievements', JSON.stringify(unlockedAchievements));
        } catch (e) { }
        renderAchievements();
        apSync();
    }
}
function renderAchievements() {
    const root = $('achievementGrid');
    if (!root) {
        return;
    }
    const q = $('achievementSearch').value.toLowerCase().trim();
    const filter = $('achievementFilter').value;
    const count = unlockedAchievements.length;
    const total = ACHIEVEMENTS.length;
    $('achievementProgress').textContent = `${count} of ${total} found`;
    $('achievementHeaderCount').textContent = `${count}/${total}`;
    $('achievementBar').style.width = `${total ? count / total * 100 : 0}%`;
    if ($('homeAch')) {
        $('homeAch').textContent = `${count} / ${total}`;
    }
    const list = ACHIEVEMENTS.filter(a => {
        const unlocked = unlockedAchievements.includes(a.formula);
        return (filter === 'all' || (filter === 'unlocked' && unlocked) || (filter === 'locked' && !unlocked)) && (!q || (a.formula + a.name + a.flavor + a.rarity).toLowerCase().includes(q));
    });
    root.innerHTML = '';
    if (!list.length) {
        root.innerHTML = '<div class="empty"><strong>No matches</strong><p>Try a different search or filter.</p></div>';
        return;
    }
    list.forEach(a => {
        const unlocked = unlockedAchievements.includes(a.formula);
        const row = document.createElement('div');
        row.className = 'ach-row ' + (unlocked ? 'found' : 'missing');
        row.innerHTML = `<span class="ach-mark" aria-hidden="true"></span><span class="ach-formula">${unlocked ? a.formula : '???'}</span><div class="ach-main"><div class="ach-name">${unlocked ? a.name : 'Not found yet'}</div><div class="ach-flavor">${unlocked ? a.flavor : 'Roll this formula to see what it is.'}</div></div><span class="ach-rarity rarity-${a.rarity.toLowerCase()}">${a.rarity}</span>`;
        root.appendChild(row);
    });
}
let achNameByFormula = null;
function recordFromFormula(formula, count, spent, ionP, ionN) {
    if (typeof formula !== 'string' || !formula) {
        return null;
    }
    const elements = [];
    const re = /([A-Z][a-z]?)(\d*)/g;
    let m;
    while ((m = re.exec(formula))) {
        const e = elementBySymbol[m[1]];
        if (!e) {
            return null;
        }
        for (let i = 0; i < (+m[2] || 1); i++) {
            elements.push(e);
        }
    }
    if (!elements.length) {
        return null;
    }
    if (!achNameByFormula) {
        achNameByFormula = new Map(ACHIEVEMENTS.map(a => [normalizeFormula(a.formula), a.name]));
    }
    // the same odds and score sums as exactRarity and rollScore
    let log = -(elements.length - 1) * Math.log10(8);
    let score = 0;
    elements.forEach(e => {
        log -= Math.log10(e[2]);
        score += e[2];
    });
    const name = elements.length === 1 ? elements[0][1] : (achNameByFormula.get(formula) || elements.map(e => e[1]).join(' + '));
    const r = { formula, name, elements, rarity: rarityText(log), log, score: scoreFrom(score, elements.length), count: Math.max(1, Math.floor(+count) || 1) };
    if (spent > 0) {
        r.spent = Math.floor(+spent);
    }
    if (ionP > 0) {
        r.ionP = Math.min(3, Math.floor(ionP));
    }
    if (ionN > 0) {
        r.ionN = Math.min(3, Math.floor(ionN));
    }
    return r;
}
function unpackCollection(raw) {
    if (!Array.isArray(raw)) {
        return [];
    }
    const out = [];
    const seen = new Map();
    raw.forEach(x => {
        const r = Array.isArray(x) ? recordFromFormula(x[0], x[1], x[2], x[3], x[4]) : x && recordFromFormula(x.formula, x.count, x.spent);
        if (!r) {
            return;
        }
        const dup = seen.get(r.formula);
        if (dup) {
            dup.count += r.count;
            dup.spent = (dup.spent || 0) + (r.spent || 0) || undefined;
            dup.ionP = Math.max(dup.ionP || 0, r.ionP || 0) || undefined;
            dup.ionN = Math.max(dup.ionN || 0, r.ionN || 0) || undefined;
            return;
        }
        seen.set(r.formula, r);
        out.push(r);
    });
    return out;
}
function packCollection() {
    return JSON.stringify(collection.map(c => c.ionP || c.ionN ? [c.formula, c.count || 1, c.spent || 0, c.ionP || 0, c.ionN || 0] :
        c.spent > 0 ? [c.formula, c.count || 1, c.spent] : [c.formula, c.count || 1]));
}
let collection = [];
try {
    collection = unpackCollection(JSON.parse(localStorage.getItem('elementalCollection') || '[]'));
} catch (e) {
    collection = [];
}
// rolls and finds removed with "Clear redundant finds", so roll totals don't drop
let clearCleared = { rolls: 0, formulas: 0 };
try {
    clearCleared = Object.assign(clearCleared, JSON.parse(localStorage.getItem('elementalCleared') || '{}'));
} catch (e) { }
// running total: adding it all up every roll was slow on big saves
let rollsMemo = null;
function totalRolls() {
    const m = rollsMemo;
    if (m && m.c === collection && m.k === clearCleared.rolls) {
        return m.n;
    }
    const n = collection.reduce((s, c) => s + (c.count || 1), 0) + (clearCleared.rolls || 0);
    rollsMemo = { c: collection, k: clearCleared.rolls, n };
    return n;
}
let rolling = false;
let autoRolling = false;
const formatNumber = n => Number(n).toLocaleString('en-US', { maximumFractionDigits: 3 });
let buffCache = null;
let weightCache = null;
// batched, writing it every roll was slow on big saves
let saveTimer = 0;
let colVer = 0;
function save() {
    colVer++;
    buffCache = weightCache = null;
    if (typeof netVer === 'number') {
        netVer++;
    }
    if (!saveTimer) {
        save.at = Date.now();
        saveTimer = setTimeout(saveQuiet, 1500);
    }
}
// on a big save the write is a visible hitch, so it waits for a gap between rolls (10 seconds at most)
function saveQuiet() {
    if (rolling && Date.now() - save.at < 10000) {
        saveTimer = setTimeout(saveQuiet, 400);
        return;
    }
    flushSave();
}
function flushSave() {
    if (!saveTimer || save.frozen) {
        return;
    }
    clearTimeout(saveTimer);
    saveTimer = 0;
    try {
        localStorage.setItem('elementalCollection', packCollection());
    } catch (e) {
        // the device's storage is full: say so once, rather than silently losing progress
        if (!save.warned) {
            save.warned = true;
            setTimeout(() => showAchievementToast({ kicker: 'Storage full', name: "Progress isn't saving", flavor: 'This browser has run out of space for Elemental. Clear redundant finds in Settings to make room.' }), 0);
        }
    }
}
let colIdx = { ref: null, n: 0, map: null };
function findFormula(f) {
    if (colIdx.ref !== collection || colIdx.n !== collection.length) {
        colIdx = { ref: collection, n: collection.length, map: new Map(collection.map(c => [c.formula, c])) };
    }
    return colIdx.map.get(f);
}
addEventListener('pagehide', flushSave);
document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flushSave());
function addRecord(r) {
    if (rollsMemo && rollsMemo.c === collection) {
        rollsMemo.n++;
    }
    // base odds/score stay, ions only mark the best
    const ion = r.ion || 0;
    const base = ion ? Object.assign({}, r, { log: r.baseLog, score: r.baseScore, rarity: rarityText(r.baseLog) }) : r;
    delete base.ion;
    delete base.baseLog;
    delete base.baseScore;
    let x = findFormula(r.formula);
    if (!x) {
        base.count = 1;
        collection.push(base);
        colIdx.map.set(base.formula, base);
        colIdx.n++;
        x = base;
    } else {
        x.count = (x.count || 1) + 1;
        if (base.log < x.log || !Number.isFinite(x.log)) {
            Object.assign(x, {
                log: base.log, rarity: base.rarity, score: base.score, when: base.when, elements: base.elements, id: base.id, name: base.name
            });
        }
    }
    if (ion > 0) {
        x.ionP = Math.max(x.ionP || 0, ion);
    } else if (ion < 0) {
        x.ionN = Math.max(x.ionN || 0, -ion);
    }
}
function go(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === screen));
    window.scrollTo(0, 0);
    requestAnimationFrame(() => ionShowNew());
    if (viewsStale && viewsShowing()) {
        renderInventory();
        renderPeriodic();
        viewsStale = false;
    }
    if (screen === 'element') {
        renderElemCompounds();
    }
    if (screen === 'bonds') {
        renderBonds();
    }
    if (screen === 'shop') {
        shopState.fresh = false;
        shopAlertSync();
        $('shopMsg').textContent = '';
        renderShop();
    }
    if (screen === 'catinv') {
        renderCatInv();
    }
    if (screen === 'settings' && typeof renderStorage === 'function') {
        jokeUiSync();
        tierRowsSync();
        renderStorage();
        renderViewer();
    }
    if (screen === 'ap') {
        apRender();
    }
    if (screen === 'game') {
        const col = document.querySelector('#rollResults .roll-result-column');
        if (col && col._mr) {
            col.querySelectorAll('.mr-chip b').forEach(b => fitText(b, b.textContent, b.parentElement.clientWidth - 10, 18));
            const sel = [...col.querySelectorAll('.mr-chip')].findIndex(c => c.classList.contains('sel'));
            showMultiRoll(col, col._mr.records, Math.max(0, sel), col._mr.best, false);
        }
    }
}
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
    let tab = b.dataset.tab;
    document.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('active', x === b));
    $('compoundView').style.display = tab === 'compounds' ? '' : 'none';
    $('completionView').style.display = tab === 'completionist' ? '' : 'none';
    if (tab === 'completionist') {
        renderPeriodic();
        ionShowNew();
    }
}));
// Exactly three elements grant an extra roll per click.
const EXTRA_ROLL_SYMBOLS = new Set(['Ho']);
const CHAIN_SYMBOLS = new Set(['Rn', 'Bk', 'Ds', 'Og']);
const AUTO_UNLOCK_SYMBOL = 'Pt';
const COLLIDER_SYMBOL = 'Nh';
const AUTO_TIME_SYMBOLS = new Set(['Cs', 'Sm', 'Os', 'Tm', 'Ac']);
const AUTO_COOL_SYMBOLS = new Set(['Pr', 'Lu', 'Rh', 'Pa', 'Po']);
const AUTO_BASE_GAP = 5;
const AUTO_MIN_GAP = 0.5;
const AUTO_SPEED_STEP = 10;
function buildBuffs() {
    const raw = e => Math.log10(e[2] + 1) + 0.5;
    const kind = (e, i) => EXTRA_ROLL_SYMBOLS.has(e[0]) ? 'extra' : CHAIN_SYMBOLS.has(e[0]) ? 'chain' : e[0] === AUTO_UNLOCK_SYMBOL ? 'autounlock' : e[0] === COLLIDER_SYMBOL ? 'collider' : AUTO_TIME_SYMBOLS.has(e[0]) || AUTO_COOL_SYMBOLS.has(e[0]) ? 'autospeed' : i % 4 === 1 ? 'speed' : 'luck';
    const sum = { speed: 0, luck: 0 };
    const goal = { speed: 200, luck: 54.57 };
    ELEMENTS.forEach((e, i) => {
        const k = kind(e, i);
        if (k in sum) {
            sum[k] += raw(e);
        }
    });
    return new Map(ELEMENTS.map((e, i) => {
        const k = kind(e, i);
        if (k === 'extra') {
            return [
                e[0],
                {
                    type: 'extra', value: 1, desc: 'Bonus roll +1: every click launches one separate additional roll, with its own independent chance of a chain reaction. Two more bonus rolls come from deep lines in the bond network, for a maximum of three.'
                }
            ];
        }
        if (k === 'chain') {
            return [
                e[0],
                {
                    type: 'chain', value: 1, desc: 'Chain chance +1 step: makes chain reactions more likely. Four rare elements and four deep bond lines each give a step, together taking the odds from 1 in 8 to 1 in 5.'
                }
            ];
        }
        if (k === 'autounlock') {
            return [
                e[0],
                {
                    type: 'autounlock', value: 1, desc: `Autoroll unlocked: switch autoroll on and it keeps rolling for as long as you like, with a ${AUTO_BASE_GAP} second break between rolls. Autoroll speed buffs shorten the break.`
                }
            ];
        }
        if (k === 'collider') {
            return [e[0], { type: 'collider', value: 1, desc: 'Supercollider unlocked: from now on a Supercollider event can start while you roll, making chains 1 in 2 for 30 rolls. The Collider Key can turn up in the shop too.' }];
        }
        if (k === 'autospeed') {
            return [
                e[0],
                {
                    type: 'autospeed', value: AUTO_SPEED_STEP, desc: `Autoroll speed +${AUTO_SPEED_STEP}%: autoroll waits less between rolls once it is unlocked.`
                }
            ];
        }
        const v = raw(e) * goal[k] / sum[k];
        return [e[0], k === 'speed' ? { type: 'speed', value: v, desc: `Scanner speed +${v.toFixed(2)}%: each roll animation finishes faster.` } : {
                type: 'luck', value: v, desc: `Luck +${v.toFixed(2)}%: shifts the scanner's weighting toward rarer elements.`
            }];
    }));
}
const ELEMENT_BUFFS = buildBuffs();
// jokes don't count. only rebuilt when a new formula turns up
let foundCache = null;
function discoveredSymbols() {
    if (foundCache && foundCache.col === collection && foundCache.n === collection.length) {
        return foundCache.set;
    }
    const set = new Set();
    collection.forEach(c => (c.elements || []).forEach(e => set.add(e[0])));
    JOKE_SYMS.forEach(s => set.delete(s));
    foundCache = { col: collection, n: collection.length, set };
    return set;
}
let jokeFoundCache = null;
function jokesFound() {
    if (jokeFoundCache && jokeFoundCache.n === collection.length) {
        return jokeFoundCache.s;
    }
    const s = new Set();
    collection.forEach(c => (c.elements || []).forEach(e => {
        if (isJoke(e[0])) {
            s.add(e[0]);
        }
    }));
    jokeFoundCache = { n: collection.length, s };
    return s;
}
