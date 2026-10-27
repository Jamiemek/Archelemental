// Catalyst shop
const CAT_TIERS = [
    { name: 'Common', col: '#9fb0a8', p: 60 },
    { name: 'Uncommon', col: '#6fcf8a', p: 26 },
    { name: 'Rare', col: '#5aa8ff', p: 9.5 },
    { name: 'Epic', col: '#b48cff', p: 3.2 },
    { name: 'Legendary', col: '#f0c419', p: 1 },
    { name: 'Mythic', col: '#ff6b8a', p: 0.25 },
    { name: 'Secret', col: '#ffffff', p: 0.05 }
];
const CATALYSTS = [
    { id: 'alkali', name: 'Alkali Metals Catalyst', tier: 0, min: 10, fx: { fam: 'alkali', pct: 75 }, price: 16 },
    { id: 'alkaline', name: 'Alkaline Earth Catalyst', tier: 0, min: 10, fx: { fam: 'alkaline', pct: 75 }, price: 16 },
    { id: 'halogen', name: 'Halogen Catalyst', tier: 0, min: 10, fx: { fam: 'halogen', pct: 75 }, price: 16 },
    { id: 'noble', name: 'Noble Gas Catalyst', tier: 0, min: 10, fx: { fam: 'noble', pct: 75 }, price: 20 },
    { id: 'nonmetal', name: 'Nonmetal Catalyst', tier: 0, min: 10, fx: { fam: 'nonmetal', pct: 75 }, price: 14 },
    { id: 'spark', name: 'Spark', tier: 0, min: 10, fx: { luck: 12.5 }, price: 26 },
    { id: 'trickle', name: 'Quark Trickle', tier: 0, min: 15, fx: { quark: 25 }, price: 20 },
    { id: 'transition', name: 'Transition Metals Catalyst', tier: 1, min: 15, fx: { fam: 'transition', pct: 100 }, price: 100 },
    { id: 'metalloid', name: 'Metalloid Catalyst', tier: 1, min: 15, fx: { fam: 'metalloid', pct: 100 }, price: 88 },
    { id: 'post', name: 'Post-transition Catalyst', tier: 1, min: 15, fx: { fam: 'post', pct: 100 }, price: 88 },
    { id: 'kindling', name: 'Kindling', tier: 1, min: 15, fx: { luck: 30 }, price: 150 },
    { id: 'accelerant', name: 'Accelerant', tier: 1, min: 15, fx: { speed: 25 }, price: 75 },
    { id: 'primer', name: 'Chain Primer', tier: 1, min: 15, fx: { chain: 1 }, price: 120 },
    { id: 'lanth', name: 'Lanthanide Catalyst', tier: 2, min: 20, fx: { fam: 'lanth', pct: 150 }, price: 510 },
    { id: 'actin', name: 'Actinide Catalyst', tier: 2, min: 20, fx: { fam: 'actin', pct: 150 }, price: 810 },
    { id: 'ignition', name: 'Ignition', tier: 2, min: 20, fx: { luck: 75 }, price: 690 },
    { id: 'linked', name: 'Linked Reaction', tier: 5, rolls: 10, fx: { linked: true }, price: 56000 },
    { id: 'surge', name: 'Quark Surge', tier: 2, min: 20, fx: { quark: 100 }, price: 900 },
    { id: 'superheavy', name: 'Superheavy Catalyst', tier: 3, min: 30, fx: { fam: 'unknown', pct: 200 }, price: 2400 },
    { id: 'blaze', name: 'Blaze', tier: 3, min: 30, fx: { luck: 150 }, price: 3600 },
    { id: 'twin', name: 'Twin Reactor', tier: 3, min: 30, fx: { extra: 1 }, price: 3000 },
    { id: 'lens', name: 'Precision Lens', tier: 3, rolls: 1, fx: { rollLuck: 400 }, price: 1800 },
    { id: 'inferno', name: 'Inferno', tier: 4, min: 60, fx: { luck: 250 }, price: 21700 },
    { id: 'storm', name: 'Chain Storm', tier: 4, min: 30, fx: { chainMax: true }, price: 10800 },
    { id: 'engine', name: 'Quark Engine', tier: 4, min: 60, fx: { quark: 400 }, price: 52500 },
    { id: 'prism', name: 'Focus Prism', tier: 4, rolls: 1, fx: { rollLuck: 750 }, price: 17500 },
    { id: 'fusion', name: 'Fusion Core', tier: 5, min: 30, fx: { luck: 300 }, price: 72000 },
    { id: 'horizon', name: 'Event Horizon', tier: 5, rolls: 1, fx: { rollLuck: 1500 }, price: 52000 },
    { id: 'singularity', name: 'Singularity', tier: 6, rolls: 1, fx: { rollLuck: 5000 }, price: 132000 },
    { id: 'stone', name: "Philosopher's Stone", tier: 6, rolls: 1, fx: { unfound: true }, price: 108000 },
    // instant = used on the spot, takes no slot
    { id: 'barometer', name: 'Barometer', tier: 0, min: 15, fx: { event: 50 }, price: 24 },
    { id: 'courier', name: 'Courier', tier: 2, instant: true, fx: { restock: true }, price: 480 },
    { id: 'qlens', name: 'Quark Lens', tier: 0, min: 15, fx: { lens: 50 }, price: 20 },
    { id: 'stabiliser', name: 'Stabiliser', tier: 1, instant: true, fx: { extend: 10 }, price: 100 },
    { id: 'rod', name: 'Lightning Rod', tier: 1, instant: true, fx: { rod: true }, price: 110 },
    { id: 'magnet', name: 'Family Magnet', tier: 3, rolls: 20, fx: { magnet: true }, price: 3200 },
    { id: 'leveller', name: 'Leveller', tier: 1, min: 15, fx: { level: true }, price: 110 },
    { id: 'reagent', name: 'Practical Reagent', tier: 1, min: 15, joke: true, fx: { joke: 100 }, price: 120 },
    { id: 'grant', name: 'Grant Funding', tier: 2, instant: true, fx: { grant: true }, price: 600 },
    { id: 'heavy', name: 'Heavy Water', tier: 2, min: 20, fx: { heavy: 25 }, price: 690 },
    { id: 'punchline', name: 'Punchline', tier: 2, min: 15, joke: true, fx: { joke: 300 }, price: 810 },
    { id: 'accel', name: 'Particle Accelerator', tier: 3, rolls: 25, fx: { chain3: true }, price: 2700 },
    { id: 'bondagent', name: 'Bonding Agent', tier: 3, instant: true, fx: { bond: true }, price: 7500 },
    { id: 'logger', name: 'Event Logger', tier: 3, instant: true, fx: { logger: true }, price: 3000 },
    { id: 'laugh', name: 'Laugh Track', tier: 3, min: 30, joke: true, fx: { laugh: true }, price: 2400 },
    { id: 'stormseed', name: 'Storm Seed', tier: 4, instant: true, fx: { start: 'storm' }, price: 17500 },
    { id: 'colliderkey', name: 'Collider Key', tier: 6, instant: true, fx: { start: 'collider' }, price: 24800 },
    { id: 'gag', name: 'Running Gag', tier: 4, min: 30, joke: true, fx: { gag: true }, price: 14000 },
    { id: 'twinhorizon', name: 'Twin Horizon', tier: 5, rolls: 5, fx: { twice: true }, price: 64000 },
    { id: 'containment', name: 'Containment Field', tier: 5, instant: true, fx: { extend: 30 }, price: 56000 },
    { id: 'singseed', name: 'Singularity Seed', tier: 5, instant: true, fx: { start: 'hole' }, price: 120000 },
    { id: 'insidejoke', name: 'Inside Joke', tier: 6, rolls: 1, joke: true, fx: { jokeNew: true }, price: 120000 }
];
const CAT = Object.fromEntries(CATALYSTS.map(c => [c.id, c]));
function catEffect(c) {
    const f = c.fx;
    if (f.fam) {
        return `+${f.pct}% chance to roll ${FAMILY_ONE[f.fam] === 'superheavy' ? 'a superheavy (Mt to Lv)' : (/^[aeiou]/.test(FAMILY_ONE[f.fam]) ? 'an ' : 'a ') + FAMILY_ONE[f.fam]}`;
    }
    if (f.luck) {
        return `+${f.luck}% luck`;
    }
    if (f.quark) {
        return f.quark === 100 ? 'Double quarks earned' : f.quark === 400 ? 'Five times the quarks earned' : `+${f.quark}% quarks earned`;
    }
    if (f.speed) {
        return `+${f.speed}% scanner speed`;
    }
    if (f.chain) {
        return 'Chain chance one step better (1 in 8 to 1 in 7 at base, never past 1 in 5)';
    }
    if (f.chainMax) {
        return 'Chain chance at its maximum, 1 in 5';
    }
    if (f.extra) {
        return '+1 bonus roll on every roll, up to the maximum of 3';
    }
    if (f.linked) {
        return "Each roll chains at least once. Can't run alongside single-roll luck";
    }
    if (f.rollLuck) {
        return `+${f.rollLuck.toLocaleString('en-US')}% luck` + (f.rollLuck >= 10000 ? ', which guarantees Uranium' : '') + ". Can't run alongside Linked Reaction or Family Magnet";
    }
    const more = {
        event: `Events are ${f.event}% more likely to start`, restock: 'Restocks the shop straight away', lens: `+${f.lens}% quarks from rolls that chain`,
        extend: `Adds ${f.extend} minutes to every active timed catalyst`, rod: 'The next Quark Storm lasts 50% longer', magnet: "Chained elements come from the first element's family. Can't run alongside single-roll luck",
        joke: `+${f.joke}% chance of joke elements`, grant: 'Your next catalyst purchase costs half', heavy: `Each chained element adds +${f.heavy}% quarks`,
        chain3: 'Chain chance at its best (1 in 5)', logger: 'The next event lasts twice as long', laugh: 'Finds containing a joke element earn three times the quarks',
        start: 'Starts a ' + (f.start === 'storm' ? 'Quark Storm' : f.start === 'collider' ? 'Supercollider' : 'Black Hole') + ' now (not while another event is running)',
        gag: 'Joke elements are five times as likely, and ten times once you roll one while it lasts', twice: 'Each roll is rolled twice and keeps the rarer',
        jokeNew: "Half the time, the roll gives a joke element you haven't found yet", level: 'Elements your luck has made rarer go back to their odds at 0% luck',
        bond: 'Fills any open bond slot for free. On the bonds tree, open slots light up red while you have one: tap a slot to use it'
    };
    const k = Object.keys(f).find(x => more[x]);
    return k ? more[k] : "The roll gives an element you haven't found yet (+1,500% luck if you've found them all)";
}
const catLength = c => c.instant ? (c.fx.rod || c.fx.logger ? 'Waits for the next event' : 'Works straight away') : c.rolls ? (c.rolls === 1 ? 'Single roll' : `Next ${c.rolls} rolls`) : `Timed, ${c.min} min`;
// saved state
function loadJSON(k, d) {
    try {
        return JSON.parse(localStorage.getItem(k) || 'null') || d;
    } catch (e) {
        return d;
    }
}
let shopState = loadJSON('elementalShop', { slot: -1, stock: [] });
let catInv = loadJSON('elementalCatInv', {});
let catActive = loadJSON('elementalCatActive', {});
let catFlags = loadJSON('elementalCatFlags', {});
function saveCats() {
    try {
        localStorage.setItem('elementalShop', JSON.stringify(shopState));
        localStorage.setItem('elementalCatInv', JSON.stringify(catInv));
        localStorage.setItem('elementalCatActive', JSON.stringify(catActive));
        localStorage.setItem('elementalCatFlags', JSON.stringify(catFlags));
    } catch (e) { }
}
function takeFlag(k) {
    if (!(catFlags[k] > 0)) {
        return false;
    }
    catFlags[k]--;
    if (!catFlags[k]) {
        delete catFlags[k];
    }
    saveCats();
    return true;
}
// active catalysts
function pruneActive() {
    let ch = false;
    const now = Date.now();
    Object.keys(catActive).forEach(t => {
        const a = catActive[t];
        if (!a || !CAT[a.id] || (a.until && a.until <= now) || (a.rolls != null && a.rolls <= 0)) {
            delete catActive[t];
            ch = true;
        }
    });
    if (ch) {
        saveCats();
        buffCache = weightCache = null;
    }
    return catActive;
}
// single-roll luck has its own slot, so it can go with a timed luck catalyst of the same tier
const catSlot = c => c.fx.rollLuck ? c.tier + 'r' : String(c.tier);
function activeList() {
    pruneActive();
    return Object.keys(catActive).sort((a, b) => parseFloat(a) - parseFloat(b) || a.length - b.length).map(k => ({ key: k, tier: parseInt(k), a: catActive[k], c: CAT[catActive[k].id] }));
}
// totals from active timed catalysts, for computeBuffs and weightTable
function catBonus() {
    const r = {
        luck: 0, speed: 0, quark: 0, extra: 0, chain: 0, chainMax: false, fam: {},
        event: 0, lens: 0, heavy: 0, joke: 0, laugh: false, gag: 0, level: false
    };
    activeList().forEach(({ a, c }) => {
        if (!a.until) {
            return;
        }
        const f = c.fx;
        ['event', 'lens', 'heavy', 'joke'].forEach(k => r[k] += f[k] || 0);
        if (f.laugh) {
            r.laugh = true;
        }
        if (f.level) {
            r.level = true;
        }
        if (f.gag) {
            r.gag = a.hit ? 10 : 5;
        }
        if (f.luck) {
            r.luck += f.luck;
        }
        if (f.speed) {
            r.speed += f.speed;
        }
        if (f.quark) {
            r.quark += f.quark;
        }
        if (f.extra) {
            r.extra += f.extra;
        }
        if (f.chain) {
            r.chain += f.chain;
        }
        if (f.chainMax) {
            r.chainMax = true;
        }
        if (f.fam) {
            r.fam[f.fam] = (r.fam[f.fam] || 0) + f.pct;
        }
    });
    return r;
}
// the soonest moment an active catalyst runs out, so cached buffs refresh then
function catNextExpiry() {
    let t = Infinity;
    Object.values(catActive).forEach(a => {
        if (a.until) {
            t = Math.min(t, a.until);
        }
    });
    return t;
}
// catalysts that boost the same thing can't run together
const CAT_AREAS = { luck: 'luck', rollLuck: 'single-roll luck', speed: 'roll speed', quark: 'quarks', lens: 'quarks', heavy: 'quarks', laugh: 'quarks', chain: 'chain chance', chainMax: 'chain chance', chain3: 'chain chance', extra: 'bonus rolls', event: 'event chances', joke: 'joke elements', gag: 'joke elements' };
function catArea(c) {
    if (c.fx.fam) {
        return FAMILY_NAMES[c.fx.fam].toLowerCase();
    }
    const k = Object.keys(c.fx).find(x => CAT_AREAS[x]);
    return k ? CAT_AREAS[k] : null;
}
// Linked Reaction and Family Magnet don't mix with single-roll luck, as together they all but guarantee a top tier find
const shapesChain = c => !!(c.fx.linked || c.fx.magnet);
function luckClash(c) {
    if (!shapesChain(c) && !c.fx.rollLuck) {
        return null;
    }
    const x = activeList().find(x => x.c && x.c.id !== c.id && x.a.rolls > 0 && (c.fx.rollLuck ? shapesChain(x.c) : x.c.fx.rollLuck));
    return x ? `${x.c.name} is running (${catLeft(x.a)} left), and ${c.fx.rollLuck ? 'single-roll luck' : c.name} can't run alongside ${c.fx.rollLuck ? x.c.name : 'single-roll luck'}. Use it once that ends.` : null;
}
function useCatalyst(id, n) {
    const c = CAT[id];
    const have = catInv[id] || 0;
    n = Math.max(0, Math.min(have, Math.floor(n)));
    if (!n) {
        return 'You have none of these.';
    }
    if (c.instant) {
        return useInstant(c, n);
    }
    pruneActive();
    const cur = catActive[catSlot(c)];
    if (cur && cur.id !== id) {
        const o = CAT[cur.id];
        return `${o.name} is already running for ${CAT_TIERS[c.tier].name.toLowerCase()} catalysts (${catLeft(cur)} left). Only one ${CAT_TIERS[c.tier].name.toLowerCase()} catalyst can be active at a time.`;
    }
    const area = catArea(c);
    const clash = area && activeList().find(x => x.c && x.c.id !== id && catArea(x.c) === area);
    if (clash) {
        return `${clash.c.name} is already boosting ${area} (${catLeft(clash.a)} left). Only one catalyst can boost ${area} at a time.`;
    }
    const mix = luckClash(c);
    if (mix) {
        return mix;
    }
    if (c.rolls) {
        catActive[catSlot(c)] = { id, rolls: (cur ? cur.rolls : 0) + c.rolls * n };
    } else {
        const base = cur ? cur.until : Date.now();
        catActive[catSlot(c)] = { id, until: base + c.min * 60000 * n * (1 + bondBonus().cdur / 100) };
    }
    catInv[id] = have - n;
    if (!catInv[id]) {
        delete catInv[id];
    }
    saveCats();
    buffCache = weightCache = null;
    return '';
}
function useInstant(c, n) {
    const f = c.fx;
    if (f.start) {
        if (anyEventOn()) {
            return 'An event is already running. Only one can run at a time.';
        }
        if (f.start === 'collider' && !colliderOn()) {
            return 'The Supercollider hasn\'t been unlocked yet.';
        }
        n = 1;
        if (f.start === 'storm') {
            qStormStart();
        } else {
            evStart(f.start);
        }
        renderQStorm();
    } else if (f.restock) {
        n = 1;
        const held = bondBonus().hold && shopState.stock.find(s => s.held && !s.sold);
        shopState.stock = held ? [held] : [];
        shopState.r = (shopState.r || 0) + 1;
        shopState.j = 0;
        shopCheck();
    } else if (f.bond) {
        return 'Bonding Agents are used on the bonds tree: tap any red slot to fill it.';
    } else if (f.extend) {
        pruneActive();
        const timed = Object.values(catActive).filter(a => a.until);
        if (!timed.length) {
            return 'No timed catalysts are running to extend.';
        }
        timed.forEach(a => a.until += f.extend * 60000 * n);
    } else {
        const k = f.rod ? 'rod' : f.logger ? 'logger' : 'grant';
        catFlags[k] = (catFlags[k] || 0) + n;
    }
    catInv[c.id] -= n;
    if (!catInv[c.id]) {
        delete catInv[c.id];
    }
    saveCats();
    buffCache = weightCache = null;
    renderActiveCats();
    return '';
}
function catLeft(a) {
    if (a.rolls != null) {
        return a.rolls + (a.rolls === 1 ? ' roll' : ' rolls');
    }
    return fmtClock(Math.max(0, a.until - Date.now()) / 1000);
}
function fmtClock(s) {
    s = Math.ceil(s);
    if (s >= 172800) {
        const d = Math.floor(s / 86400);
        return `${d.toLocaleString('en-US')}d ${Math.floor(s % 86400 / 3600)}h`;
    }
    const h = Math.floor(s / 3600);
    const m = Math.floor(s % 3600 / 60);
    const ss = s % 60;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${m}:${String(ss).padStart(2, '0')}`;
}
// single-roll catalysts: take one charge for one individual roll
function takeRollCharge() {
    pruneActive();
    const out = { rollLuck: 0, unfound: false, linked: false, magnet: false, chain3: false, twice: false, jokeNew: false, used: [] };
    Object.keys(catActive).forEach(t => {
        const a = catActive[t];
        if (a.rolls == null || a.rolls <= 0) {
            return;
        }
        out.used.push(CAT[a.id].name);
        const f = CAT[a.id].fx;
        if (f.rollLuck) {
            out.rollLuck += f.rollLuck;
        }
        if (f.unfound) {
            out.unfound = true;
        }
        ['linked', 'magnet', 'chain3', 'twice', 'jokeNew'].forEach(k => {
            if (f[k]) {
                out[k] = true;
            }
        });
        // refund chance
        if (Math.random() >= bondBonus().refund / 100) {
            a.rolls -= 1;
        }
    });
    pruneActive();
    saveCats();
    return out;
}
// catalyst drops from the easy bridge, picked like shop stock
function rollDrop() {
    const p = bondBonus().drop / 100;
    if (!p || rnd() >= p) {
        return null;
    }
    const id = shopRoll(shopFlags());
    catInv[id] = (catInv[id] || 0) + 1;
    saveCats();
    apCatalyst(id);
    return id;
}
function showDrop(id, k) {
    const c = CAT[id];
    const el = document.createElement('div');
    el.className = 'cat-drop';
    el.style.setProperty('--tc', CAT_TIERS[c.tier].col);
    el.style.animationDelay = (k * 0.45) + 's';
    el.innerHTML = '<span>Catalyst found</span><b>' + c.name + '</b>' + tierChip(c.tier);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200 + k * 450);
}
// running gag goes to x10
function gagHit() {
    const a = Object.values(catActive).find(x => x.id === 'gag' && !x.hit);
    if (a) {
        a.hit = true;
        saveCats();
        buffCache = weightCache = null;
    }
}
function clearCatalyst(tier) {
    delete catActive[tier];
    saveCats();
    buffCache = weightCache = null;
}
// the shop
// the YAML sets the restock time; bonds can still shave minutes off it
function shopPeriodMs() {
    return Math.max(2, apOpt('restock_minutes') - bondBonus().refresh) * 60000;
}
// 2 + bonds + Shop Slots from the multiworld, max 6
const shopSlots = () => Math.min(6, 2 + bondBonus().slots + apCount('Shop Slot'));
function shopPrice(c, grant = true) {
    return Math.max(1, Math.round(c.price * (1 - Math.min(90, bondBonus().price) / 100) * (grant && catFlags.grant ? 0.5 : 1)));
}
var clockBase = null;
var clockTried = false;
function shopNow() {
    return clockBase ? clockBase.server + (performance.now() - clockBase.perf) : Date.now();
}
// restock chime and glow
function shopDing() {
    const ctx = prepareAudio();
    if (ctx) {
        tone(1318.5, ctx.currentTime, 0.25, 0.02, 'sine');
        tone(1760, ctx.currentTime + 0.1, 0.35, 0.016, 'sine');
    }
}
function shopAlertSync() {
    document.querySelectorAll('[data-go="shop"]').forEach(b => b.classList.toggle('shop-alert', !!shopState.fresh));
}
function shopCheck() {
    const P = shopPeriodMs();
    const now = shopNow();
    const want = shopSlots();
    if (!shopState.nextAt) {
        // older saves: keep the stock and timer they already had
        shopState.nextAt = shopState.slot >= 0 && shopState.period ? (shopState.slot + 1) * shopState.period : now + P;
    }
    // a restock time further off than one full period can only come from a wrong clock
    if (shopState.nextAt > now + P + 60000 && (clockBase || clockTried)) {
        shopState.nextAt = now + P;
    }
    // wait until the clock has been checked before restocking (the first few seconds only)
    if (now >= shopState.nextAt && (clockBase || clockTried || !shopState.stock.length)) {
        shopState.nextAt = (now - shopState.nextAt) / P > 1000 ? now + P : shopState.nextAt;
        while (shopState.nextAt <= now) {
            shopState.nextAt += P;
        }
        // keep the held one
        const held = bondBonus().hold && shopState.stock.find(s => s.held && !s.sold);
        shopState.stock = held ? [held] : [];
        shopState.r = (shopState.r || 0) + 1;
        shopState.j = 0;
        if (!$('shop').classList.contains('active')) {
            shopState.fresh = true;
            shopDing();
        }
    }
    while (shopState.stock.length < want) {
        shopState.stock.push({ id: shopRoll(shopFlags()), sold: false });
    }
    saveCats();
    return shopState;
}
// what the stock roll depends on: rarer-stock bonus, joke catalysts (with the Joke Table), all jokes found, collider, joke rate
function shopFlags() {
    const b = bondBonus();
    return [b.stock, (jokesOn() ? 1 : 0) + (jokesFound().size === JOKES.length ? 2 : 0) + (colliderOn() ? 4 : 0), b.jokerate];
}
// with catalyst checks on, the higher tiers turn up more often than in the normal game,
// and catalysts that are still a check are four times as likely as ones you've had
const AP_TIER_P = [34, 26, 18, 11, 7, 3.5, 0.5];
const shopNeeds = c => c.tier < Math.min(apOpt('catalyst_checks'), 6) && !apState.catSeen.includes(c.id);
function shopRoll(g) {
    const boost = g[0] / 100;
    const base = apOpt('catalyst_checks') ? AP_TIER_P : CAT_TIERS.map(t => t.p);
    const w = base.map((p, i) => p * (1 + boost * i / 3));
    const tot = w.reduce((a, b) => a + b, 0);
    let r = rnd() * tot;
    let tier = 0;
    for (; tier < w.length - 1; tier++) {
        r -= w[tier];
        if (r <= 0) {
            break;
        }
    }
    const jokes = g[1] & 1;
    const allJokes = g[1] & 2;
    const pool = CATALYSTS.filter(c => c.tier === tier && (!c.joke || jokes) && !(c.id === 'insidejoke' && allJokes) && !(c.id === 'colliderkey' && !(g[1] & 4)));
    const wt = c => (c.joke ? 1 + g[2] / 100 : 1) * (shopNeeds(c) ? 4 : 1);
    let x = rnd() * pool.reduce((s, c) => s + wt(c), 0);
    return (pool.find(c => (x -= wt(c)) < 0) || pool[pool.length - 1]).id;
}
// a new save has no stock yet, so stock the shop before reading its timer
function shopNextIn() {
    if (!shopState.nextAt) {
        shopCheck();
    }
    return shopState.nextAt - shopNow();
}
function buyStock(i) {
    const s = shopState.stock[i];
    if (!s || s.sold) {
        return;
    }
    const c = CAT[s.id];
    const p = shopPrice(c);
    if (quarks < p) {
        return;
    }
    addQuarks(-p);
    takeFlag('grant');
    s.sold = true;
    s.held = false;
    const two = Math.random() < bondBonus().dup / 100;
    catInv[s.id] = (catInv[s.id] || 0) + (two ? 2 : 1);
    saveCats();
    apCatalyst(s.id);
    renderShop();
    $('shopMsg').textContent = two ? `Lucky: two ${c.name} catalysts added to your inventory.` : `${c.name} added to your inventory.`;
}
// cheapest first, so the quarks go as far as they can
function buyAll() {
    const before = quarks;
    let n = 0;
    for (;;) {
        const left = shopState.stock.map((s, i) => [i, s]).filter(([, s]) => !s.sold && shopPrice(CAT[s.id]) <= quarks);
        if (!left.length) {
            break;
        }
        left.sort((a, b) => shopPrice(CAT[a[1].id]) - shopPrice(CAT[b[1].id]));
        buyStock(left[0][0]);
        n++;
    }
    $('shopMsg').textContent = n ? `Bought ${n} catalyst${n > 1 ? 's' : ''} for ${Math.round(before - quarks).toLocaleString('en-US')} quarks.` : "You can't afford anything here right now.";
}
function holdStock(i) {
    const s = shopState.stock[i];
    if (!s || s.sold || !bondBonus().hold) {
        return;
    }
    const on = !s.held;
    shopState.stock.forEach(x => x.held = false);
    s.held = on;
    saveCats();
    renderShop();
    $('shopMsg').textContent = on ? `${CAT[s.id].name} will stay in the shop through restocks until you buy it or let it go.` : '';
}
const tierChip = t => `<span class="cat-tier" style="--tc:${CAT_TIERS[t].col}">${CAT_TIERS[t].name}</span>`;
function renderShop() {
    if (!$('shopStock')) {
        return;
    }
    shopCheck();
    $('shopBuyAll').disabled = !shopState.stock.some(s => !s.sold && shopPrice(CAT[s.id]) <= quarks);
    const cr = $('shopCourier');
    cr.hidden = !catInv.courier;
    cr.textContent = 'Use Courier (' + (catInv.courier || 0) + ')';
    const canHold = bondBonus().hold;
    $('shopTimer').textContent = fmtClock(shopNextIn() / 1000);
    $('shopStock').innerHTML = shopState.stock.map((s, i) => {
        const c = CAT[s.id];
        const p = shopPrice(c);
        const hold = canHold && !s.sold ? `<button class="ghost cat-hold${s.held ? ' on' : ''}" data-i="${i}">${s.held ? 'Held' : 'Hold'}</button>` : '';
        return `<article class="cat-card${s.sold ? ' sold' : ''}${s.held ? ' held' : ''}" style="--tc:${CAT_TIERS[c.tier].col}">${tierChip(c.tier)}<h3>${c.name}</h3><p>${catEffect(c)}</p><p class="cat-len">${catLength(c)}</p><button class="${s.sold ? 'ghost' : 'primary'} cat-buy" data-i="${i}"${s.sold || quarks < p ? ' disabled' : ''}>${s.sold ? 'Bought' : `<span class="q-sym">q</span> ${p.toLocaleString('en-US')}`}</button>${hold}</article>`;
    }).join('');
    $('shopSlotsNote').textContent = `${shopState.stock.length} of ${Math.max(5, shopSlots())} stock slots open`;
    renderActiveCats();
}
function renderActiveCats() {
    const list = activeList();
    const waiting = [['rod', 'Lightning Rod', 'next Quark Storm'], ['logger', 'Event Logger', 'next event'], ['grant', 'Grant Funding', 'next purchase']]
        .filter(([k]) => catFlags[k] > 0).map(([k, name, what]) => `<div class="act-row" style="--tc:${CAT_TIERS[CAT[k].tier].col}">${tierChip(CAT[k].tier)}<strong>${name}${catFlags[k] > 1 ? ' ×' + catFlags[k] : ''}</strong><span class="act-left">Waiting: ${what}</span></div>`).join('');
    // the inventory's list can cancel them, the roll page's only shows them
    const rows = cancel => list.map(({ key, tier, a, c }) => `<div class="act-row" style="--tc:${CAT_TIERS[tier].col}">${tierChip(tier)}<strong>${c.name}</strong><span class="act-left" data-tier="${key}">${catLeft(a)}</span>` +
        (cancel ? `<button class="ghost cat-clear" data-tier="${key}">Cancel</button>` : '') + '</div>').join('') + waiting;
    ['catActive', 'rollCats'].forEach(k => {
        const el = $(k);
        if (el) {
            el.innerHTML = list.length || waiting ? (k === 'catActive' ? '<div class="inv-sect"><span>Active</span></div>' : '') + rows(k === 'catActive') : '';
        }
    });
    const cl = $('catClear');
    if (cl) {
        cl.innerHTML = list.length ? list.map(({ key, tier, c }) => `<div class="act-row" style="--tc:${CAT_TIERS[tier].col}">${tierChip(tier)}<strong>${c.name}</strong><button class="ghost cat-clear" data-tier="${key}">Cancel</button></div>`).join('') : '<p class="muted">No catalysts active.</p>';
    }
    const hs = $('homeShop');
    if (hs) {
        hs.textContent = 'Restock in ' + fmtClock(Math.max(0, shopNextIn()) / 1000);
    }
}
$('shopStock').addEventListener('click', e => {
    const h = e.target.closest('.cat-hold');
    if (h) {
        holdStock(+h.dataset.i);
        return;
    }
    const b = e.target.closest('.cat-buy');
    if (b) {
        buyStock(+b.dataset.i);
    }
});
// the inventory page: a grid of owned catalysts and a detail panel for the selected one
let invSel = null;
const catMark = c => {
    const w = c.name.replace(/Catalyst|'s/g, '').trim().split(/[\s-]+/);
    return w.length > 1 ? w[0][0] + w[1][0].toLowerCase() : w[0].slice(0, 2);
};
function renderCatInv() {
    if (!$('catInv')) {
        return;
    }
    const inv = Object.keys(catInv).filter(id => catInv[id] > 0 && CAT[id]).sort((a, b) => CAT[b].tier - CAT[a].tier || CAT[a].name.localeCompare(CAT[b].name));
    if (!inv.includes(invSel)) {
        invSel = inv[0] || null;
    }
    $('catInv').innerHTML = inv.length ? inv.map(id => {
        const c = CAT[id];
        return `<button class="inv-tile${id === invSel ? ' sel' : ''}" data-sel="${id}" style="--tc:${CAT_TIERS[c.tier].col}"><span class="it-name">${c.name}</span><span class="it-n">×${catInv[id].toLocaleString('en-US')}</span></button>`;
    }).join('') : '<p class="muted inv-empty">Nothing here yet. Catalysts you buy in the shop wait here until you use them.</p>';
    const d = $('invDetail');
    if (!invSel) {
        d.innerHTML = '<div class="inv-preview" style="--tc:var(--soft)"><span class="ip-mark">–</span></div><p class="muted">Select a catalyst to see it here.</p>';
    } else {
        const c = CAT[invSel];
        const T = CAT_TIERS[c.tier];
        const a = catActive[catSlot(c)];
        const status = c.instant ? '' : a && a.id === invSel ? `<p class="ip-status on">Running: ${catLeft(a)} left. Using more adds to it.</p>` : a ? `<p class="ip-status off">${CAT[a.id].name} is running for ${T.name.toLowerCase()} catalysts (${catLeft(a)} left), so this one can't be used until it ends.</p>` :
            luckClash(c) ? `<p class="ip-status off">${luckClash(c)}</p>` : '';
        const n = catInv[invSel];
        d.innerHTML = `<div class="inv-preview" style="--tc:${T.col}"><span class="ip-mark">${catMark(c)}</span><span class="ip-tier">${T.name}</span></div>
<div class="ip-use">${c.fx.bond ? '<button class="primary" data-use="bonds">Open the bonds tree</button>' : `<button class="primary" data-use="1">Use</button>`}${n > 1 && !c.fx.bond ? '<button class="ghost" data-use="pick">Use…</button><button class="ghost" data-use="all">Use all</button>' : ''}</div>
<p class="shop-msg" id="invMsg" aria-live="polite"></p>
<div class="ip-desc" style="--tc:${T.col}"><h2>${c.name}</h2>${tierChip(c.tier)}<p class="ip-effect">${catEffect(c)}</p><dl class="stats"><div><dt>Lasts</dt><dd>${catLength(c)}</dd></div><div><dt>You have</dt><dd>×${n.toLocaleString('en-US')}</dd></div>${c.rolls || c.instant ? '' : `<div><dt>Using all</dt><dd>${fmtClock(c.min * 60 * n)}</dd></div>`}</dl>${status}</div>`;
    }
    renderActiveCats();
}
$('catInv').addEventListener('click', e => {
    const t = e.target.closest('[data-sel]');
    if (!t) {
        return;
    }
    invSel = t.dataset.sel;
    renderCatInv();
    if (innerWidth < 760) {
        $('invDetail').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});
$('invDetail').addEventListener('click', e => {
    const b = e.target.closest('[data-use]');
    if (!b || !invSel) {
        return;
    }
    if (b.dataset.use === 'bonds') {
        go('bonds');
        return;
    }
    const id = invSel;
    const have = catInv[id];
    if (b.dataset.use === 'pick') {
        const w = openDialog(`<h2>Use how many?</h2><p>You have ${have.toLocaleString('en-US')} ${esc(CAT[id].name)}.</p><input id="useN" class="adm-input" type="number" min="1" max="${have}" value="1" inputmode="numeric">` +
            '<div class="btn-row"><button class="primary" id="useGo">Use</button><button class="ghost" id="useNo">Cancel</button></div>');
        w.querySelector('#useNo').onclick = closeDialog;
        w.querySelector('#useGo').onclick = () => {
            const n = Math.floor(+w.querySelector('#useN').value);
            closeDialog();
            if (n >= 1) {
                invUse(id, n);
            }
        };
        w.querySelector('#useN').select();
        return;
    }
    invUse(id, b.dataset.use === 'all' ? have : 1);
});
function invUse(id, n) {
    const msg = useCatalyst(id, n);
    renderCatInv();
    const m = $('invMsg');
    if (m) {
        m.textContent = msg || `${n > 1 ? n + ' × ' : ''}${CAT[id].name} used.`;
        m.classList.toggle('ok', !msg);
    }
    renderRollStats();
}
function catCancelClick(e) {
    const b = e.target.closest('.cat-clear');
    if (!b) {
        return;
    }
    const t = b.dataset.tier;
    const a = catActive[t];
    if (!a) {
        return;
    }
    const c = CAT[a.id];
    const w = openDialog(`<h2>Cancel ${esc(c.name)}?</h2><p>It stops working straight away with ${catLeft(a)} left. You won't get it back.</p>` +
        '<div class="btn-row"><button class="ghost danger" id="ccYes">Cancel it</button><button class="primary" id="ccNo">Keep it</button></div>');
    w.querySelector('#ccNo').onclick = closeDialog;
    w.querySelector('#ccYes').onclick = () => {
        const w2 = openDialog('<h2>Are you sure?</h2><p>This can\'t be undone.</p>' +
            '<div class="btn-row"><button class="ghost danger" id="ccSure">Yes, cancel it</button><button class="primary" id="ccNo2">Keep it</button></div>');
        w2.querySelector('#ccNo2').onclick = closeDialog;
        w2.querySelector('#ccSure').onclick = () => {
            closeDialog();
            if (catActive[t] && catActive[t].id === c.id) {
                clearCatalyst(t);
            }
            renderActiveCats();
            renderRollStats();
            renderCatInv();
        };
    };
}
$('catClear').addEventListener('click', catCancelClick);
$('catActive').addEventListener('click', catCancelClick);
// tick timers once a second
setInterval(() => {
    const before = Object.keys(catActive).length;
    pruneActive();
    if (Object.keys(catActive).length !== before) {
        renderRollStats();
    }
    if ($('shop') && $('shop').classList.contains('active')) {
        if (shopNow() >= (shopState.nextAt || 0)) {
            renderShop();
        } else {
            $('shopTimer').textContent = fmtClock(Math.max(0, shopNextIn()) / 1000);
            document.querySelectorAll('#catActive .act-left').forEach(el => {
                const a = catActive[el.dataset.tier];
                if (a) {
                    el.textContent = catLeft(a);
                }
            });
        }
    } else if ($('catinv').classList.contains('active')) {
        document.querySelectorAll('#catActive .act-left').forEach(el => {
            const a = catActive[el.dataset.tier];
            if (a) {
                el.textContent = catLeft(a);
            }
        });
    } else {
        renderActiveCats();
    }
    if (shopState.nextAt && shopNow() >= shopState.nextAt && !$('shop').classList.contains('active')) {
        shopCheck();
    }
    shopAlertSync();
}, 1000);
$('shopBuyAll').addEventListener('click', buyAll);
$('shopCourier').addEventListener('click', () => {
    $('shopMsg').textContent = useCatalyst('courier', 1) || 'Courier used: the shop has restocked.';
    renderShop();
});
