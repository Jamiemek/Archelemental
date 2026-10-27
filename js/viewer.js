// Cutscene and effect viewer (Settings): replay any cutscene or rarity effect you've seen
let seenData = null;
function seenLoad() {
    if (seenData) {
        return seenData;
    }
    try {
        seenData = JSON.parse(localStorage.getItem('elementalSeen') || 'null');
    } catch (e) {
        seenData = null;
    }
    if (!seenData || typeof seenData !== 'object') {
        const found = discoveredSymbols();
        const tiers = new Set();
        collection.forEach(c => {
            const t = getRarityTier(c.score);
            if (t > 0) {
                tiers.add(t);
            }
        });
        seenData = { cut: Object.keys(CUTSCENES).filter(s => found.has(s)), fx: [...tiers].sort((a, b) => a - b), dark: [] };
        seenSave();
    }
    ['cut', 'fx', 'dark'].forEach(k => seenData[k] = Array.isArray(seenData[k]) ? seenData[k] : []);
    return seenData;
}
function seenSave() {
    try {
        localStorage.setItem('elementalSeen', JSON.stringify(seenData));
    } catch (e) { }
}
function seenAdd(kind, v) {
    const s = seenLoad();
    if (!s[kind].includes(v)) {
        s[kind].push(v);
        seenSave();
    }
}
const VIEW_ORDER = (jokes = false) => Object.keys(CUTSCENES).filter(s => isJoke(s) === jokes).sort((a, b) => CUTSCENES[b].z - CUTSCENES[a].z === 0 ? 0 : elementBySymbol[b][2] - elementBySymbol[a][2]);
function renderViewer() {
    const s = seenLoad();
    const cuts = $('vwCuts');
    cuts.innerHTML = VIEW_ORDER().map(sym => s.cut.includes(sym) ?
        '<button class="vw-tile" data-cut="' + sym + '"><b>' + sym + '</b><span>' + esc(elementBySymbol[sym][1]) + '</span></button>' :
        '<button class="vw-tile locked" disabled><b>?</b><span>Not seen yet</span></button>').join('');
    $('vwJokeWrap').hidden = !jokesOn();
    $('vwJokes').innerHTML = VIEW_ORDER(true).map(sym => s.cut.includes(sym) ?
        '<button class="vw-tile" data-cut="' + sym + '"><b>' + sym + '</b><span>' + esc(elementBySymbol[sym][1]) + '</span></button>' :
        '<button class="vw-tile locked" disabled><b>?</b><span>Not seen yet</span></button>').join('');
    const tiers = Math.max(9, tierTop());
    $('vwFx').innerHTML = TIER_SCORES.slice(0, tiers).map((_, i) => i + 1).map(t => s.fx.includes(t) ?
        '<button class="vw-tile" data-fx="' + t + '" style="--tc:' + RARITY_FX[t].c + '"><b>' + t + '</b><span>Tier ' + t + '</span></button>' :
        '<button class="vw-tile locked" disabled><b>?</b><span>Tier ' + t + '</span></button>').join('');
    const dark = s.dark.filter(t => RARITY_DARK[t]).sort((a, b) => a - b);
    $('vwDarkWrap').hidden = !dark.length;
    $('vwDark').innerHTML = dark.map(t => '<button class="vw-tile dark" data-dark="' + t + '" style="--tc:' + RARITY_DARK[t].c + '"><b>' + t + '</b><span>Secret tier ' + t + '</span></button>').join('');
    $('vwCount').textContent = s.cut.filter(x => !isJoke(x)).length + ' of ' + VIEW_ORDER().length + ' cutscenes and ' + s.fx.length + ' of ' + tiers + ' effects seen.';
}
async function viewerPlay(btn) {
    if (rolling) {
        return;
    }
    const s = seenLoad();
    if (btn.dataset.cut && s.cut.includes(btn.dataset.cut)) {
        const e = elementBySymbol[btn.dataset.cut];
        const els = [e];
        go('game');
        await doRoll([{ elements: els, formula: e[0], name: e[1], log: exactRarity(els, 0), rarity: rarityText(exactRarity(els, 0)), score: rollScore(els) }], { replay: true });
        return;
    }
    const t = +(btn.dataset.fx || btn.dataset.dark);
    const dark = !!btn.dataset.dark;
    if (!t || !(dark ? s.dark : s.fx).includes(t)) {
        return;
    }
    go('game');
    setTimeout(() => {
        playResultChime(TIER_SCORES[t - 1], dark);
        playRarityFx(t, dark);
    }, 250);
}
['vwCuts', 'vwJokes', 'vwFx', 'vwDark'].forEach(id => $(id).addEventListener('click', e => {
    const b = e.target.closest('button[data-cut], button[data-fx], button[data-dark]');
    if (b) {
        viewerPlay(b);
    }
}));
