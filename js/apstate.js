// Archipelago: this save's options and the items received so far. Loaded early, as the rest of the game asks for them while it starts
const AP_ITEM = { 1: 'Progressive Luck', 2: 'Joke Table', 3: 'Autoroll', 4: 'Chain Boost', 5: 'Extra Roll', 6: 'Shop Slot', 7: 'Quark Bundle' };
// what this save knows: the seed's options, every item received so far, and how many of the one-off items have been used
let apState = loadJSON('apState', { slotData: null, items: [], spent: 0, catSeen: [], goal: false, checked: [] });
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
const AP_DEFAULTS = { elements_required: 118, jokes_required: 0, joke_elements: 1, catalyst_checks: 4, achievement_checks: 0, bonds_tree: 1, shop: 1, events: 1, luck_items: 15, luck_per_item: 100, restock_minutes: 10 };
const apOpt = k => {
    const d = apState.slotData;
    return d && d[k] != null ? d[k] : AP_DEFAULTS[k];
};
const apCount = name => apState.items.filter(i => AP_ITEM[i.item] === name).length;
const apLuck = () => apCount('Progressive Luck') * apOpt('luck_per_item');
const apHasJokes = () => !!apOpt('joke_elements') && apCount('Joke Table') > 0;

