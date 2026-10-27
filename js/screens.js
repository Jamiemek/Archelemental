// The most recent rolls, newest first: { n: roll number, f: formula, l: odds log, s: score }.
const HISTORY_MAX = 1000;
let rollHistory = [];
try {
    rollHistory = JSON.parse(localStorage.getItem('elementalHistory') || '[]');
} catch (e) { }
function addHistory(rec, n) {
    rollHistory.unshift(rec.ion ? { n, f: rec.formula, l: rec.log, s: rec.score, i: rec.ion } : { n, f: rec.formula, l: rec.log, s: rec.score });
    if (rollHistory.length > HISTORY_MAX) {
        rollHistory.length = HISTORY_MAX;
    }
    try {
        localStorage.setItem('elementalHistory', JSON.stringify(rollHistory));
    } catch (e) { }
}
function renderHistory() {
    const el = $('rollHistory');
    if (!el) {
        return;
    }
    if (!rollHistory.length) {
        el.innerHTML = '<div class="empty-line">Your rolls will be listed here.</div>';
        return;
    }
    el.innerHTML = rollHistory.map(h => `<div class="history-row"><span class="h-num">#${h.n.toLocaleString('en-US')}</span><span class="h-formula" title="${withIon(h.f, h.i)}">${withIon(h.f, h.i)}</span><span class="h-val">${displayMode === 'score' ? 'Score ' + fmtScore(h.s) : rarityText(h.l)}</span></div>`).join('');
}
// Older saves stored buffed odds, so convert them back to base odds.
(function () {
    let ch = false;
    collection.forEach(r => {
        if (!r || !Array.isArray(r.elements) || !r.elements.length) {
            return;
        }
        const sc = rollScore(r.elements);
        if (r.score !== sc) {
            r.score = sc;
            ch = true;
        }
        const lg = exactRarity(r.elements, 0);
        if (Number.isFinite(lg) && r.log !== lg) {
            r.log = lg;
            r.rarity = rarityText(lg);
            ch = true;
        }
    });
    if (ch) {
        save();
    }
})();
let selectedElementSymbol = 'H';
let elemReturn = 'inventory';
const FAMILY = {};
const FAMILY_NAMES = {
    alkali: 'Alkali metals', alkaline: 'Alkaline earth metals', transition: 'Transition metals', post: 'Post-transition metals', metalloid: 'Metalloids', nonmetal: 'Nonmetals', halogen: 'Halogens', noble: 'Noble gases', lanth: 'Lanthanides', actin: 'Actinides', unknown: 'Unclassified'
};
(function () {
    const set = (cls, arr) => arr.forEach(s => FAMILY[s] = cls);
    set('alkali', ['Li', 'Na', 'K', 'Rb', 'Cs', 'Fr']);
    set('alkaline', ['Be', 'Mg', 'Ca', 'Sr', 'Ba', 'Ra']);
    set('nonmetal', ['H', 'C', 'N', 'O', 'P', 'S', 'Se']);
    set('halogen', ['F', 'Cl', 'Br', 'I', 'At', 'Ts']);
    set('noble', ['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn', 'Og']);
    set('metalloid', ['B', 'Si', 'Ge', 'As', 'Sb', 'Te']);
    set('post', ['Al', 'Ga', 'In', 'Sn', 'Tl', 'Pb', 'Bi', 'Po']);
    set('lanth', ['La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu']);
    set('actin', ['Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr']);
    set('unknown', ['Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv']);
})();
function familyOf(sym) {
    return isJoke(sym) ? 'joke' : FAMILY[sym] || 'transition';
}
function buildTable(root, mode, list = ELEMENTS) {
    if (!root) {
        return;
    }
    root.innerHTML = '';
    const joke = list === JOKES;
    const found = joke ? jokesFound() : discoveredSymbols();
    // ion marks
    list.forEach((e, i) => {
        const pos = joke ? e[4] : tableLayout[e[0]] || [11, 1];
        const isFound = found.has(e[0]);
        const tile = document.createElement('button');
        tile.type = 'button';
        const im = ionMarks[e[0]];
        tile.dataset.sym = e[0];
        tile.className = 'element-tile' + (isFound ? ' discovered fam-' + familyOf(e[0]) : '') + (im && im[0] ? ' ion-p' + im[0] : '') + (im && im[1] ? ' ion-n' + im[1] : '');
        tile.style.gridRow = pos[0];
        tile.style.gridColumn = pos[1];
        tile.title = isFound ? `${e[1]}, ${joke ? e[3] : FAMILY_NAMES[familyOf(e[0])]}` : (mode === 'full' ? 'Not found yet. Select to see its bonus.' : 'Not found yet');
        tile.setAttribute('aria-label', `${e[1]}${isFound ? ', found' : ', not found yet'}`);
        tile.innerHTML = mode === 'full'
            ? `<span class="atomic">${isFound && !joke ? i + 1 : ''}</span><span class="sym">${isFound ? e[0] : ''}</span>`
            : `<span class="sym">${isFound ? e[0] : ''}</span>`;
        tile.addEventListener('click', () => {
            if (mode === 'compact' && !found.has(e[0])) {
                return;
            }
            const cur = document.querySelector('.screen.active');
            elemReturn = cur && cur.id !== 'element' ? cur.id : elemReturn;
            selectedElementSymbol = e[0];
            renderPeriodic();
            go('element');
        });
        root.appendChild(tile);
    });
    ionShowNew();
}
function ionShowNew() {
    if (!ionNew.length) {
        return;
    }
    const scr = document.querySelector('.screen.active');
    const tiles = scr ? [...scr.querySelectorAll('.element-tile')].filter(t => ionNew.includes(t.dataset.sym) && t.offsetParent) : [];
    if (!tiles.length) {
        return;
    }
    tiles.forEach(t => {
        t.classList.remove('ion-new');
        void t.offsetWidth;
        t.classList.add('ion-new');
    });
    ionNew = ionNew.filter(s => !tiles.some(t => t.dataset.sym === s));
    ionSave();
}
function bonusRows(s) {
    const row = (k, v, cls) => `<div><dt>${k}</dt><dd${cls ? ` class="${cls}"` : ''}>${v}</dd></div>`;
    let h = row('Elements found', `${s.found.size} / 118`) + row('Luck', `+${s.luck.toFixed(2)}%`) + row('Scanner speed', `+${s.speed.toFixed(2)}%`) + row('Bonus rolls', `${s.extra} of 3`) + row('Chain chance', `1 in ${+s.chainDenom.toFixed(2)}`);
    if (s.autoUnlocked) {
        h += row('Autoroll speed', `+${s.autoSpeed.toFixed(1)}%`) + row('Break between rolls', fmtGap(s.autoGap));
    }
    return h + row('Autoroll', '', 'js-auto');
}
// the roll screen's Bonds button glows when a slot can be filled right now
function updateBondsAlert() {
    const b = $('rollBondsBtn');
    if (!b) {
        return;
    }
    const n = fillableIds().length;
    b.classList.toggle('alert', n > 0);
    b.title = n ? `${n} slot${n === 1 ? '' : 's'} ready to fill` : '';
}
function renderRollStats() {
    updateBondsAlert();
    const el = $('rollStats');
    if (!el) {
        return;
    }
    el.innerHTML = bonusRows(activeBuffStats());
    updateAutoBtn();
}
function renderHome() {
    if (!$('homeMap')) {
        return;
    }
    const total = totalRolls();
    const found = discoveredSymbols().size;
    const s = activeBuffStats();
    buildTable($('homeMap'), 'compact');
    $('mapCount').textContent = `${found} of 118 elements found.`;
    $('homeAch').textContent = unlockedAchievements.length + ' / ' + ACHIEVEMENTS.length;
    $('homeRolls').textContent = total.toLocaleString();
    $('homeChain').textContent = '1 in ' + (+s.chainDenom.toFixed(2));
    $('homeRarestH').textContent = displayMode === 'score' ? 'Highest score' : 'Rarest find';
    const r = topFinds(displayMode, 1)[0];
    const box = $('homeRarest');
    if (!r) {
        box.innerHTML = '<p class="muted">Nothing logged yet. Roll once to start the log.</p>';
        return;
    }
    box.innerHTML = `<div class="big-formula">${r.formula}</div><div class="big-name">${r.name}</div><div class="big-odds">${rarityWord()} ${rarityShown(r)}</div>`;
}
function renderPeriodic() {
    const found = discoveredSymbols();
    buildTable($('periodic'), 'full');
    $('legend').innerHTML = Object.keys(FAMILY_NAMES).map(k => `<span><i class="dot fam-${k}"></i>${FAMILY_NAMES[k]}</span>`).join('') + '<span><i class="dot none"></i>Not found yet</span>';
    $('elementStats').textContent = `${found.size} / 118 elements found`;
    const stats = activeBuffStats();
    $('buffSummary').innerHTML = '<h2 class="side-h">Active bonuses</h2><dl class="stats">' + bonusRows(stats) + '</dl>';
    // joke table
    $('jokeWrap').hidden = !jokesOn();
    if (jokesOn()) {
        buildTable($('jokeTable'), 'full', JOKES);
        $('jokeStats').textContent = `Joke periodic table · ${jokesFound().size} / ${JOKES.length} found`;
    }
    const joke = isJoke(selectedElementSymbol);
    const e = joke ? elementBySymbol[selectedElementSymbol] : ELEMENTS.find(x => x[0] === selectedElementSymbol) || ELEMENTS[0];
    const isFound = joke ? jokesFound().has(e[0]) : found.has(e[0]);
    $('buffElementName').textContent = `${e[1]} (${e[0]})`;
    $('buffElementDesc').textContent = joke ? `${e[3]}. ${jokeBonusText(e[0])}.` : ELEMENT_BUFFS.get(e[0]).desc;
    $('buffElementState').textContent = isFound ? 'Active. This bonus always applies.' : 'Locked. Find this element once to activate it.';
    $('buffElementState').classList.toggle('active', isFound);
    if ($('element').classList.contains('active')) {
        renderElemCompounds();
    }
    renderHome();
    renderRollStats();
}
// only redraw these when they're on screen
let viewsStale = false;
const viewsShowing = () => ['menu', 'inventory', 'element'].some(id => $(id).classList.contains('active'));
function refreshViews() {
    if (viewsShowing()) {
        renderInventory();
        renderPeriodic();
        viewsStale = false;
    } else {
        viewsStale = true;
        renderRollStats();
    }
}
// top n without sorting the whole collection
const findOrder = mode => mode === 'score' ? (a, b) => b.score - a.score : (a, b) => (Number.isFinite(a.log) ? a.log : 0) - (Number.isFinite(b.log) ? b.log : 0);
let topCache = null;
function topFinds(mode, n = 10) {
    if (!topCache || topCache.col !== collection || topCache.v !== colVer) {
        topCache = { col: collection, v: colVer };
    }
    const key = mode + n;
    if (topCache[key]) {
        return topCache[key];
    }
    const by = findOrder(mode);
    const top = [];
    collection.forEach(c => {
        if (top.length < n || by(c, top[top.length - 1]) < 0) {
            let i = top.length;
            while (i && by(c, top[i - 1]) < 0) {
                i--;
            }
            top.splice(i, 0, c);
            if (top.length > n) {
                top.pop();
            }
        }
    });
    return topCache[key] = top;
}
function rankRow(c, rank, mode = displayMode) {
    const el = document.createElement('div');
    const joined = c.elements.map(e => e[1]).join(' + ');
    el.className = 'rank-row';
    el.innerHTML = `<div class="rank-num">${rank}</div><div class="rank-main"><div class="rank-formula">${c.formula}${entryIons(c) ? `<sup class="ion-sup">${entryIons(c)}</sup>` : ''}</div><div class="rank-name">${c.name}${c.elements.length > 1 && c.name !== joined ? ': ' + joined : ''}</div></div><div class="rank-odds"><b>${mode === 'score' ? 'Score ' + rarityShown(c, 'score') : rarityShown(c, 'odds')}</b><span>× ${c.count.toLocaleString()}</span></div>`;
    return el;
}
function renderInventory() {
    const root = $('compoundGrid');
    root.innerHTML = '';
    $('collectionStats').textContent = `${totalRolls().toLocaleString()} total rolls, ${collection.length} unique formulas`;
    if (!collection.length) {
        root.innerHTML = '<div class="empty"><strong>Nothing logged yet.</strong><p>Roll once to record your first formula.</p><button class="primary" data-go="game">Roll</button></div>';
        root.querySelector('[data-go]').addEventListener('click', () => go('game'));
        return;
    }
    topFinds(rankMode).forEach((c, i) => root.appendChild(rankRow(c, i + 1, rankMode)));
}
let rankMode = 'odds';
document.querySelectorAll('[data-rank]').forEach(b => b.addEventListener('click', () => {
    rankMode = b.dataset.rank;
    document.querySelectorAll('[data-rank]').forEach(x => x.classList.toggle('active', x === b));
    renderInventory();
}));
let elemMode = 'start';
function renderElemCompounds() {
    const root = $('elemCompounds');
    const sym = selectedElementSymbol;
    const joke = isJoke(sym);
    const el = joke ? elementBySymbol[sym] : ELEMENTS.find(x => x[0] === sym) || ELEMENTS[0];
    const found = joke ? jokesFound().has(sym) : discoveredSymbols().has(el[0]);
    const starts = c => (c.formula.match(/^[A-Z][a-z]?/) || [''])[0] === el[0];
    $('elemTitle').textContent = `${el[1]} (${el[0]})`;
    $('elemSub').textContent = `${joke ? 'Joke element' : FAMILY_NAMES[familyOf(el[0])] + ', atomic number ' + (ELEMENTS.indexOf(el) + 1)}. ${displayMode === 'score' ? 'Score ' + el[2].toLocaleString() : 'Base odds 1 in ' + el[2].toLocaleString()}. ${found ? 'Found.' : 'Not found yet.'}`;
    const list = !found ? [] : collection.filter(c => elemMode === 'start' ? starts(c) : c.elements.some(x => x[0] === el[0])).sort(findOrder(displayMode));
    root.innerHTML = `<div class="toolbar"><strong>${el[1]} finds, ${displayMode === 'score' ? 'highest score' : 'rarest'} first</strong><span class="stat">${list.length} found</span><button class="ghost" id="elemModeBtn">${elemMode === 'start' ? 'Formula starts with ' + el[0] : 'Formula contains ' + el[0]}</button></div><div class="rank-list" id="elemGrid"></div>`;
    $('elemModeBtn').onclick = () => {
        elemMode = elemMode === 'start' ? 'contains' : 'start';
        renderElemCompounds();
    };
    const g = $('elemGrid');
    if (!list.length) {
        g.innerHTML = `<div class="empty" style="grid-column:1/-1">${found ? 'Nothing found yet that matches.' : 'Discover this element to see its compounds here.'}</div>`;
        return;
    }
    list.forEach((c, i) => g.appendChild(rankRow(c, i + 1)));
}
$('elemBack').addEventListener('click', () => go(elemReturn || 'inventory'));
$('achievementSearch').addEventListener('input', renderAchievements);
$('achievementFilter').addEventListener('change', renderAchievements);
