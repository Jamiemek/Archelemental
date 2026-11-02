// Archipelago: this save's options and the items received so far. Loaded early, as the rest of the game asks for them while it starts
const AP_ITEM = {
    1: 'Progressive Bonus Roll', 2: 'Progressive Shop Luck', 3: 'Progressive Shop Reset Speed', 4: 'Progressive Shop Slot',
    5: 'Catalyst Rolling Unlock', 6: 'Shop Hold Unlock', 7: 'Luck Boost 15%', 8: 'Luck Boost 30%', 9: 'Luck Boost 60%', 10: 'Luck Boost 90%',
    11: 'Progressive Autoroll Speed', 12: 'Progressive Scanner Speed', 13: 'Progressive Event Spawn Chance', 14: 'Progressive Quark Gain',
    15: 'Autoroll Unlock', 16: 'Progressive Chain Boost', 17: 'Joke Table Unlock', 18: 'Ionization Unlock',
    19: 'Progressive + Ion Chance', 20: 'Progressive - Ion Chance',
    21: 'Quark Bundle 100', 22: 'Quark Bundle 1000', 23: 'Quark Bundle 10000', 24: 'Quark Bundle 100000',
    25: 'Roll Speed Trap', 26: 'Luck Trap', 27: 'Quark Drop Trap'
};
const AP_ID = Object.fromEntries(Object.entries(AP_ITEM).map(([k, v]) => [v, +k]));
const AP_BOOST = { 7: 15, 8: 30, 9: 60, 10: 90 };
const AP_BUNDLE = { 21: 100, 22: 1000, 23: 10000, 24: 100000 };
const AP_TRAP = { 25: 'speed', 26: 'luck', 27: 'quark' };
// cosmetics are items 40 and up, in this order (the same as the APWorld's list)
const AP_COS_BASE = 40;
const AP_COS = ['oscilloscope', 'holographic', 'blueprint', 'notebook', 'retro', 'astral', 'warp', 'gameover'];
// Element Frenzy: elements are items 5000 + atomic number. Bond requirements are items 10000 + slot
const AP_ELEMENT_BASE = 5000;
const AP_BOND_ITEM = 10000;
const AP_BOND_END = 20000;
const AP_STEP = {
    shopLuckStock: 7.5, shopLuckPrice: 3.75, reset: 1, slot: 1, autoroll: 100, scanner: 25, event: 12.5, quark: 12.5,
    ionPlus: 0.01, ionMinus: 0.002
};
const AP_TRAP_MS = 5 * 60000;
// what this save knows: the seed's options, every item received so far, and how many of the one-off items have been used
let apState = loadJSON('apState', { slotData: null, items: [], spent: 0, catSeen: [], goal: false, checked: [], ions: {}, traps: [] });
apState.ions = apState.ions || {};
apState.traps = apState.traps || [];
const apSaveState = () => {
    try {
        localStorage.setItem('apState', JSON.stringify(apState));
    } catch (e) { }
};
let apConn = loadJSON('archelConn', { host: '', name: '', pass: '' });
const apSaveId = () => {
    try {
        return localStorage.getItem('archelSave') || '';
    } catch (e) {
        return '';
    }
};
// options default to everything on until a seed says otherwise
const AP_DEFAULTS = {
    elements_required: 118, jokes_required: 0, achievements_required: 0, element_frenzy: 0, ionization_frenzy: 0, joke_elements: 1,
    catalyst_checks: 4, achievement_checks: 0, bonds_tree: 1, bond_slots: 0, shop: 1, events: 1, restock_minutes: 18, bond_nodes: 0, ion_levels: 0
};
const apOpt = k => {
    const d = apState.slotData;
    return d && d[k] != null ? d[k] : AP_DEFAULTS[k];
};
let apTallyMemo = null;
function apTally() {
    if (!apTallyMemo || apTallyMemo.n !== apState.items.length || apTallyMemo.ref !== apState.items) {
        const by = {};
        apState.items.forEach(i => by[i.item] = (by[i.item] || 0) + 1);
        apTallyMemo = { n: apState.items.length, ref: apState.items, by };
    }
    return apTallyMemo.by;
}
const apCountId = id => apTally()[id] || 0;
const apCount = name => apCountId(AP_ID[name]);
// luck comes only from the flat luck boosts, and a Luck Trap halves it for a while
const apBoostLuck = () => Object.entries(AP_BOOST).reduce((s, [id, pct]) => s + apCountId(+id) * pct, 0);
const apHasJokes = () => !!apOpt('joke_elements') && apCount('Joke Table Unlock') > 0;
// traps: a list of {k, until}. Anything past its time is dropped as it is read
function apTrapOn(kind) {
    const now = Date.now();
    if (apState.traps.some(t => t.until <= now)) {
        apState.traps = apState.traps.filter(t => t.until > now);
    }
    return apState.traps.some(t => t.k === kind);
}
function apBondGrants() {
    const by = apTally();
    if (!apTallyMemo.grants) {
        const out = new Set();
        Object.keys(by).forEach(id => {
            if (+id >= AP_BOND_ITEM && +id < AP_BOND_END) {
                out.add(+id - AP_BOND_ITEM);
            }
        });
        apTallyMemo.grants = out;
    }
    return apTallyMemo.grants;
}
function apElementItems() {
    const by = apTally();
    if (!apTallyMemo.els) {
        const out = new Set();
        Object.keys(by).forEach(id => {
            const z = +id - AP_ELEMENT_BASE;
            if (z >= 1 && z <= 118 && ELEMENTS[z - 1]) {
                out.add(ELEMENTS[z - 1][0]);
            }
        });
        apTallyMemo.els = out;
    }
    return apTallyMemo.els;
}
const apCosItems = () => AP_COS.filter((c, i) => apCountId(AP_COS_BASE + i) > 0);
