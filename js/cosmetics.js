// cosmetics
const COSMETICS = [
    { id: 'oscilloscope', kind: 'scanner', name: 'Oscilloscope', desc: 'Green phosphor, a graticule and a live trace.', price: 25000 },
    { id: 'holographic', kind: 'scanner', name: 'Holographic', desc: 'Iridescent, with colour fringes and a sweeping shimmer.', price: 60000 },
    { id: 'warp', kind: 'scanner', name: 'Warp', desc: 'The field streams past at warp speed.', free: 'Zo' },
    { id: 'blueprint', kind: 'page', name: 'Blueprint', desc: 'White on drafting blue, on a fine grid.', price: 40000 },
    { id: 'notebook', kind: 'page', name: 'Lab notebook', desc: 'Ruled paper, a margin line and ink.', price: 90000 },
    { id: 'gameover', kind: 'page', name: 'Game Over', desc: 'Black, red and a CRT glow.', free: 'Gg' },
    { id: 'retro', kind: 'effects', name: 'Retro spawn effects', desc: 'All 13 rarity effects redone in 8-bit: pixels, coins, fireworks and a CRT.', price: 120000 },
    { id: 'astral', kind: 'effects', name: 'Astral spawn effects', desc: 'All 13 rarity effects redone among the stars: constellations, comets, eclipses and galaxies.', price: 200000 }
];
const COS = Object.fromEntries(COSMETICS.map(c => [c.id, c]));
const COS_KINDS = { scanner: 'Scanner', page: 'Page', effects: 'Spawn effects' };
let cosState = { owned: [], scanner: '', page: '', effects: '', badge: true };
try {
    cosState = Object.assign(cosState, JSON.parse(localStorage.getItem('elementalCosmetics') || '{}'));
} catch (e) { }
function cosSave() {
    try {
        localStorage.setItem('elementalCosmetics', JSON.stringify(cosState));
    } catch (e) { }
}
const cosUnlocked = id => bondBonus().cos.includes(id);
const cosOwned = id => cosUnlocked(id) && (!!COS[id].free || cosState.owned.includes(id));
const hasFinalBadge = () => cosUnlocked('gameover');
const effectSkin = () => cosState.effects && cosOwned(cosState.effects) ? cosState.effects : '';
const scannerSkin = () => cosState.scanner && cosOwned(cosState.scanner) ? cosState.scanner : '';
function applyCosmetics() {
    // toast new unlocks
    const un = bondBonus().cos;
    if (!cosState.seen) {
        cosState.seen = un.slice();
        cosSave();
    }
    const fresh = un.filter(id => !cosState.seen.includes(id));
    if (fresh.length) {
        cosState.seen = cosState.seen.concat(fresh);
        cosSave();
        setTimeout(() => showAchievementToast({ kicker: 'Cosmetic unlocked', name: fresh.length > 2 ? fresh.length + ' new cosmetics' : fresh.map(id => COS[id].name + ({ page: ' page', scanner: ' scanner' }[COS[id].kind] || '')).join(' and '), flavor: 'Find it on the Cosmetics tab of the shop.' }), 1500);
    }
    const root = document.documentElement;
    const page = cosState.page && cosOwned(cosState.page) ? cosState.page : '';
    const scan = scannerSkin();
    if (page) {
        root.setAttribute('data-skin', page);
    } else {
        root.removeAttribute('data-skin');
    }
    if (scan) {
        root.setAttribute('data-scanner', scan);
    } else {
        root.removeAttribute('data-scanner');
    }
    const badge = $('finalBadge');
    if (badge) {
        badge.hidden = !(hasFinalBadge() && cosState.badge);
    }
    const tabs = $('shopTabs');
    if (tabs) {
        tabs.hidden = !bondBonus().cos.length;
        if (tabs.hidden) {
            shopTab('cats');
        }
    }
}
function shopTab(t) {
    document.querySelectorAll('[data-stab]').forEach(b => b.classList.toggle('active', b.dataset.stab === t));
    $('shopCats').hidden = t !== 'cats';
    $('cosPanel').hidden = t !== 'cos';
    if (t === 'cos') {
        renderCosmetics();
    }
}
function renderCosmetics() {
    const grid = $('cosGrid');
    if (!grid) {
        return;
    }
    const un = bondBonus().cos;
    const list = COSMETICS.filter(c => un.includes(c.id));
    const card = c => {
        let btn;
        if (!cosOwned(c.id)) {
            btn = `<button class="primary cos-buy" data-id="${c.id}"${quarks < c.price ? ' disabled' : ''}><span class="q-sym">q</span> ${c.price.toLocaleString('en-US')}</button>`;
        } else if (cosState[c.kind] === c.id) {
            btn = `<button class="ghost cos-use on" data-id="${c.id}">In use · take off</button>`;
        } else {
            btn = `<button class="primary cos-use" data-id="${c.id}">Use</button>`;
        }
        const how = c.free ? `<p class="cat-len">Free: unlocked by ${elementBySymbol[c.free][1]}</p>` : '';
        return `<article class="cat-card cos-card${cosState[c.kind] === c.id ? ' held' : ''}" style="--tc:var(--hazard)"><div class="cos-swatch sw-${c.id}" aria-hidden="true"></div><span class="cos-kind">${COS_KINDS[c.kind]}</span><h3>${c.name}</h3><p>${c.desc}</p>${how}${btn}</article>`;
    };
    let html = list.map(card).join('');
    if (hasFinalBadge()) {
        html += `<article class="cat-card cos-card${cosState.badge ? ' held' : ''}" style="--tc:var(--hazard)"><div class="cos-swatch sw-badge" aria-hidden="true"><span class="final-badge">Final Element</span></div><span class="cos-kind">Badge</span><h3>Final Element</h3><p>Shown by your quarks. For finding ${elementBySymbol.Gg[1]}.</p><button class="${cosState.badge ? 'ghost on' : 'primary'} cos-badge">${cosState.badge ? 'Shown · hide' : 'Show'}</button></article>`;
    }
    grid.innerHTML = html || '<p class="muted">No cosmetics unlocked yet.</p>';
}
$('cosGrid').addEventListener('click', e => {
    const buy = e.target.closest('.cos-buy');
    const use = e.target.closest('.cos-use');
    const msg = $('cosMsg');
    msg.textContent = '';
    if (buy) {
        const c = COS[buy.dataset.id];
        if (!cosUnlocked(c.id) || cosOwned(c.id)) {
            return;
        }
        if (quarks < c.price) {
            msg.textContent = 'Not enough quarks.';
            return;
        }
        addQuarks(-c.price);
        cosState.owned.push(c.id);
        cosState[c.kind] = c.id;
        msg.textContent = c.name + ' bought and in use.';
    } else if (use) {
        const c = COS[use.dataset.id];
        cosState[c.kind] = cosState[c.kind] === c.id ? '' : c.id;
    } else if (e.target.closest('.cos-badge')) {
        cosState.badge = !cosState.badge;
    } else {
        return;
    }
    cosSave();
    applyCosmetics();
    renderCosmetics();
});
document.querySelectorAll('[data-stab]').forEach(b => b.addEventListener('click', () => shopTab(b.dataset.stab)));
applyCosmetics();
