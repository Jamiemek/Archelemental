const STORE_LIMIT = 5 * 1024 * 1024;
function storageBytes() {
    let n = 0;
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            n += (k.length + (localStorage.getItem(k) || '').length) * 2;
        }
    } catch (e) { }
    return n;
}
const fmtBytes = n => n < 1024 * 1024 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
function planClear(minScore) {
    const keep = new Set();
    const ach = new Set(ACHIEVEMENTS.map(a => normalizeFormula(a.formula)));
    collection.forEach(c => {
        if (c.score >= minScore || c.elements.length === 1 || ach.has(c.formula)) {
            keep.add(c);
        }
    });
    topFinds('odds').forEach(c => keep.add(c));
    topFinds('score').forEach(c => keep.add(c));
    const avail = c => (c.count || 1) - (c.spent || 0);
    // compounds each element's unfilled bonds still need
    const need = {};
    net().nodes.forEach(n => {
        if (n.req && n.req.t === 'has' && !netFilled(n.id)) {
            need[n.req.k] = (need[n.req.k] || 0) + n.req.n;
        }
    });
    const ix = payIndex();
    Object.keys(need).forEach(k => {
        const list = (ix.has.get(k) || []).filter(c => avail(c) > 0);
        let have = list.filter(c => keep.has(c)).reduce((s, c) => s + avail(c), 0);
        list.filter(c => !keep.has(c)).sort((a, b) => avail(b) - avail(a)).forEach(c => {
            if (have < need[k]) {
                keep.add(c);
                have += avail(c);
            }
        });
    });
    // every found element stays found
    const covered = new Set();
    keep.forEach(c => c && c.elements.forEach(e => covered.add(e[0])));
    const top = new Map();
    collection.forEach(c => c.elements.forEach(e => {
        const b = top.get(e[0]);
        if (!b || c.score > b.score) {
            top.set(e[0], c);
        }
    }));
    discoveredSymbols().forEach(s => {
        if (!covered.has(s)) {
            const best = top.get(s);
            if (best) {
                keep.add(best);
                best.elements.forEach(e => covered.add(e[0]));
            }
        }
    });
    const remove = collection.filter(c => !keep.has(c));
    const bytes = remove.reduce((s, c) => s + JSON.stringify(c.spent > 0 ? [c.formula, c.count || 1, c.spent] : [c.formula, c.count || 1]).length + 1, 0) * 2;
    return { remove, rolls: remove.reduce((s, c) => s + (c.count || 1), 0), bytes };
}
// the default cut-off: 3/4 of the score of your 10th best find
function autoClearMin() {
    const top = topFinds('score');
    return top.length >= 10 ? Math.floor(top[9].score * 0.75) : 0;
}
function renderStorage() {
    if (!$('clearMin').value && autoClearMin()) {
        $('clearMin').value = autoClearMin();
    }
    const used = storageBytes();
    const pct = Math.min(100, used / STORE_LIMIT * 100);
    $('storeUse').textContent = 'Your save uses ' + fmtBytes(used) + ' of the roughly 5 MB this browser allows' + (pct >= 80 ? '. It is nearly full.' : '.');
    $('storeBar').style.width = pct.toFixed(1) + '%';
    $('storeBar').classList.toggle('full', pct >= 80);
    $('clearConfirm').hidden = true;
    $('clearBtn').hidden = false;
}
let clearPending = null;
$('clearBtn').onclick = () => {
    const min = Math.floor(+$('clearMin').value);
    if (!(min > 0)) {
        setMsg('clearMsg', 'Type the minimum score to keep, for example 10,000.', true);
        return;
    }
    const plan = planClear(min);
    if (!plan.remove.length) {
        setMsg('clearMsg', 'Nothing to clear: every find below that score is still needed.', false);
        return;
    }
    clearPending = plan;
    setMsg('clearMsg', 'This removes ' + formatNumber(plan.remove.length) + ' of your ' + formatNumber(collection.length) + ' finds and frees about ' + fmtBytes(plan.bytes) +
        '. Your roll total, elements found, achievements and bonds stay the same. This can\'t be undone.', false);
    $('clearBtn').hidden = true;
    $('clearConfirm').hidden = false;
    $('clearYes').textContent = 'Remove ' + formatNumber(plan.remove.length) + ' finds';
};
$('clearNo').onclick = () => {
    clearPending = null;
    setMsg('clearMsg', '');
    renderStorage();
};
$('clearYes').onclick = () => {
    if (!clearPending) {
        return;
    }
    applyClear(clearPending, Math.floor(+$('clearMin').value));
    location.reload();
};
// min is kept so a merge with another device's save knows what was cleared on purpose
function applyClear(plan, min) {
    const gone = new Set(plan.remove);
    clearCleared.rolls += plan.rolls;
    clearCleared.formulas += gone.size;
    clearCleared.min = Math.max(clearCleared.min || 0, min);
    collection = collection.filter(c => !gone.has(c));
    try {
        localStorage.setItem('elementalCleared', JSON.stringify(clearCleared));
    } catch (e) { }
    save.warned = false;
    save();
    flushSave();
}
// tidies up quietly every 20 minutes, with the default cut-off
let autoClearOn = true;
try {
    autoClearOn = localStorage.getItem('elementalAutoClear') !== '0';
} catch (e) { }
$('autoClearSetting').checked = autoClearOn;
$('autoClearSetting').onchange = () => {
    autoClearOn = $('autoClearSetting').checked;
    try {
        localStorage.setItem('elementalAutoClear', autoClearOn ? '1' : '0');
    } catch (e) { }
};
function autoClear() {
    const min = autoClearMin();
    if (!autoClearOn || rolling || !min) {
        return;
    }
    const plan = planClear(min);
    if (plan.remove.length) {
        applyClear(plan, min);
    }
}
setTimeout(autoClear, 60000);
setInterval(autoClear, 20 * 60000);
