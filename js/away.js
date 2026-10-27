const AWAY_MAX = 24 * 3600;
const awayMax = () => AWAY_MAX + bondBonus().away * 3600;
const AWAY_SLOWER = 10;
const trustedNow = () => clockBase ? clockBase.server + (performance.now() - clockBase.perf) : null;
// there's no server to ask the time, so this device's clock is trusted
async function clockSync() {
    clockBase = { server: Date.now(), perf: performance.now() };
    return true;
}
// the last time the game was seen open, in server time ({ t: null } = couldn't be checked)
let awaySince = null;
try {
    const v = JSON.parse(localStorage.getItem('awayLastSeen') || 'null');
    awaySince = v && typeof v === 'object' ? v : null;
} catch (e) { }
function awayStamp() {
    const t = trustedNow();
    if (t == null) {
        return;
    }
    try {
        localStorage.setItem('awayLastSeen', JSON.stringify({ t: Math.round(t) }));
    } catch (e) { }
}
// keep the "last seen" time fresh, so it is right even if a phone closes the page without warning
setInterval(awayStamp, 15000);
addEventListener('pagehide', awayStamp);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        awayStamp();
    } else if (clockBase) {
        clockSync();
    }
});
// how many rolls the time away is worth: autoroll's full cycle (roll + break), ten times slower
function awayRollsFor(seconds) {
    const b = activeBuffStats();
    if (!b.autoUnlocked || !(seconds > 0)) {
        return 0;
    }
    const rollSec = Math.max(300, 3000 / (1 + b.speed / 100)) / 1000;
    const cycle = (b.autoGap + rollSec + 1) * AWAY_SLOWER;
    return Math.floor(seconds / cycle) * (1 + b.extra);
}
function awayMakeRoll(b, ev) {
    const make = () => rollElements(0, null, { denom: ev === 'collider' ? 2 : b.chainDenom });
    const elements = ev === 'hole' ? rollTwice(make) : make();
    const formula = hillFormula(elements);
    const log = exactRarity(elements, 0);
    const known = ACHIEVEMENTS.find(a => a.hill === formula);
    const name = elements.length === 1 ? elements[0][1] : (known ? known.name : elements.map(e => e[1]).join(' + '));
    return ionise({ elements, formula, name, log, rarity: rarityText(log), score: rollScore(elements) }, rollIon());
}
function awayClock(s) {
    s = Math.max(0, Math.floor(s));
    return Math.floor(s / 3600) + ':' + String(Math.floor(s % 3600 / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}
async function awayProcess() {
    const clockOk = await clockSync();
    clockTried = true;
    if (!clockOk) {
        // the time can't be checked, so this session can't be trusted as time away later either
        try {
            localStorage.setItem('awayLastSeen', JSON.stringify({ t: null }));
        } catch (e) { }
        return;
    }
    const since = awaySince && typeof awaySince.t === 'number' ? awaySince.t : null;
    awayStamp();
    if (since == null) {
        return;
    }
    const seconds = Math.min(awayMax(), Math.max(0, (trustedNow() - since) / 1000));
    const n = awayRollsFor(seconds);
    if (n < 1) {
        return;
    }
    const b = activeBuffStats();
    const index = new Map(collection.map(c => [c.formula, c]));
    const firstFinds = [];
    const hist = [];
    let total = totalRolls();
    let earned = 0;
    let best = null;
    // storms work per press of Roll, and each press is (1 + bonus rolls) rolls
    const per = 1 + b.extra;
    const stormWas = qStormOn();
    let stormAdd = null;
    let stormQ = 0;
    let stormStarted = false;
    const evSeen = {};
    const drops = {};
    let ev = null;
    for (let i = 0; i < n; i++) {
        if (i % per === 0) {
            ev = eventNow();
            const sp = eventsPress(Math.min(per, n - i));
            stormAdd = sp && !sp.ev && sp.add;
            stormStarted = stormStarted || !!(sp && !sp.ev && sp.started);
        }
        if (ev && ev !== 'storm') {
            evSeen[ev] = (evSeen[ev] || 0) + 1;
        }
        if (stormAdd) {
            earned += stormAdd[i % per];
            stormQ += stormAdd[i % per];
        }
        buffHold = b;
        let r;
        try {
            r = awayMakeRoll(b, ev);
        } finally {
            buffHold = null;
        }
        if (!best || (displayMode === 'score' ? r.score > best.score : r.log < best.log)) {
            best = r;
        }
        let x = index.get(r.formula);
        if (!x) {
            const lg = r.ion ? r.baseLog : r.log;
            x = { formula: r.formula, name: r.name, elements: r.elements, rarity: rarityText(lg), log: lg, score: r.ion ? r.baseScore : r.score, count: 0 };
            collection.push(x);
            index.set(r.formula, x);
            firstFinds.push(x);
        }
        x.count++;
        if (r.ion > 0) {
            x.ionP = Math.max(x.ionP || 0, r.ion);
        } else if (r.ion < 0) {
            x.ionN = Math.max(x.ionN || 0, -r.ion);
        }
        ionCredit(r.elements[0][0], r.ion);
        total++;
        earned += quarksFor(oddsSum(r.elements) * ionScoreMult(r.ion || 0), quarkMult(r.elements, b));
        const d = i % per === 0 && rollDrop();
        if (d) {
            drops[d] = (drops[d] || 0) + 1;
        }
        if (n - i <= HISTORY_MAX) {
            hist.push(r.ion ? { n: total, f: r.formula, l: r.log, s: r.score, i: r.ion } : { n: total, f: r.formula, l: r.log, s: r.score });
        }
    }
    rollsMemo = null;
    renderQStorm();
    rollHistory = hist.reverse().concat(rollHistory).slice(0, HISTORY_MAX);
    try {
        localStorage.setItem('elementalHistory', JSON.stringify(rollHistory));
    } catch (e) { }
    save();
    addQuarks(earned);
    firstFinds.forEach(r => checkAchievements(r));
    renderHistory();
    refreshViews();
    if (typeof renderHome === 'function') {
        renderHome();
    }
    // anything new counts as a check
    apSync();
    // only the rarest is played and shown
    go('game');
    while (rolling) {
        await new Promise(r => setTimeout(r, 100));
    }
    await doRoll([best]);
    const w = openDialog('<h2>While you were away</h2>' +
        '<p class="away-big">You rolled <b>' + formatNumber(n) + '</b> times while you were away.</p>' +
        '<p class="away-clock">' + awayClock(seconds) + ' / ' + awayClock(awayMax()) + '</p>' +
        '<dl class="away-best"><dt>Your rarest find was</dt><dd>' + esc(best.name) + ' <span>' + esc(withIon(best.formula, best.ion)) + '</span></dd>' +
        '<dt>With ' + (displayMode === 'score' ? 'a score' : 'odds') + ' of</dt><dd>' + (displayMode === 'score' ? fmtScore(best.score) : rarityText(best.log)) + '</dd></dl>' +
        (stormQ || stormStarted ? '<p class="away-storm"><b>Quark Storm</b> ' + (stormStarted || !stormWas ? 'hit while you were away' : qStormOn() ? 'carried on while you were away' : 'blew itself out while you were away') +
            (stormQ ? ': +' + formatNumber(stormQ) + ' quarks' : '') + '.' + (qStormOn() ? ' It is still going, with ' + qStorm.left + ' rolls left.' : '') + '</p>' : '') +
        (Object.keys(drops).length ? '<p class="away-storm"><b>Catalysts found</b> ' + Object.keys(drops).map(id => drops[id] + ' × ' + CAT[id].name).join(', ') + '.</p>' : '') +
        Object.keys(evSeen).map(id => '<p class="away-storm ev-' + id + '"><b>' + EVENTS[id].name + '</b> covered ' + formatNumber(evSeen[id]) + ' of your rolls while you were away.' + (evOn(id) ? ' It is still going, with ' + evRun.left + ' rolls left.' : '') + '</p>').join('') +
        '<div class="btn-row"><button class="primary" id="awayOk">Nice</button></div>');
    w.querySelector('#awayOk').onclick = closeDialog;
}
