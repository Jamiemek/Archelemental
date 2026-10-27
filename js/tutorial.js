// first time tutorial, a fresh save only
const onScreen = id => $(id).classList.contains('active');
const TUT = [
    { on: 'menu', at: '.roll-cta', say: 'Welcome to Archelemental. Every roll pulls elements from the periodic table, and the rarer they are the more they\'re worth. Tap Roll to start.', done: () => onScreen('game') },
    { on: 'game', at: '#rollBtn', roll: 'O', say: 'Press Roll.' },
    { on: 'game', at: '#rollBtn', roll: 'He', say: 'Every element has its own odds. Roll again.' },
    { on: 'game', at: '#rollBtn', roll: 'N', say: 'Once more.' },
    { at: '#game [data-go="inventory"]', say: 'Everything you roll is kept in your collection. Open it with the highlighted button.', done: () => onScreen('inventory') },
    { at: '[data-tab="completionist"]', say: 'Your best finds are ranked here. Tap All elements for the periodic table.', done: () => $('completionView').style.display !== 'none' },
    { at: '#periodic [data-sym="O"]', say: 'Elements light up once you\'ve found them. Tap oxygen.', done: () => onScreen('element') },
    { at: '#elementBuffPanel', say: 'Every element has a bonus, and it\'s yours for good from the first time you find it.' },
    { on: 'bonds', way: 'Next up, your bonds tree.', say: 'This is your bonds tree. Each slot asks for something you\'ve rolled, and filling it lights up the line to it for a bonus. Tap the glowing slot in the middle to put your oxygen in.', done: () => netFilled(0) },
    { on: 'bonds', say: 'The slots next to it want helium and nitrogen. Fill them both.', done: () => tutAround() >= 2 },
    { on: 'bonds', say: 'Those rolls are used up now, but the bonuses stay. The tree goes a long way out.' },
    { on: 'shop', way: 'Next, the shop.', at: '#shopTimer', say: 'The shop. Catalysts boost your luck, your speed and plenty more for a while. They cost quarks, which every roll earns, and the stock changes on a timer.' },
    { on: 'catinv', way: 'Now your inventory.', say: 'Catalysts you buy wait in your inventory until you use them. Yours is empty for now.' },
    { on: 'ap', way: 'Now the Archipelago page.', at: '#apGoal', say: 'This is your link to the multiworld: how close you are to your goal, what you\'ve been sent, and messages from everyone else. Every element you find for the first time is a check.' },
    { on: 'settings', way: 'On to Settings.', say: 'Settings is where you change the theme and sound, turn down flashing, and watch again any effect you\'ve seen.' },
    { on: 'game', way: 'Back to rolling.', at: '#qStormBar', storm: true, say: 'Every so often an event starts. Here\'s one on the house: a Quark Storm. Every roll earns extra quarks until it runs out.' },
    { on: 'game', say: 'That\'s all you need to get going. Expect the unexpected, there are many more secrets to uncover.' }
];
// filled slots next to the middle one
function tutAround() {
    return net().adj[0].filter(i => {
        const e = net().edges[i];
        return netFilled(e.a === 0 ? e.b : e.a);
    }).length;
}
let tutAt = -1;
let tutScript = null;
let tutBox = null;
let tutSpot = null;
let tutTimer = 0;
let tutDim = null;
function tutTake() {
    const s = tutScript;
    tutScript = null;
    return s;
}
function tutEnd() {
    tutAt = -1;
    tutScript = null;
    clearInterval(tutTimer);
    if (tutSpot) {
        tutSpot.classList.remove('tut-spot');
    }
    tutSpot = null;
    if (tutBox) {
        tutBox.remove();
        tutBox = null;
    }
    if (tutDim) {
        tutDim.remove();
        tutDim = null;
    }
    try {
        localStorage.setItem('elementalTutorial', 'done');
    } catch (e) { }
}
// parts of the game this seed has switched off are skipped as the tutorial reaches them,
// as the seed's options can arrive after the tutorial has started
const tutOff = s => ({ bonds: !apOpt('bonds_tree'), shop: !apOpt('shop'), catinv: !apOpt('shop') })[s.on] || (s.storm && !apOpt('events'));
function tutShow(i) {
    while (TUT[i] && tutOff(TUT[i])) {
        i++;
    }
    const s = TUT[i];
    if (!s) {
        return tutEnd();
    }
    tutAt = i;
    try {
        localStorage.setItem('elementalTutorial', i);
    } catch (e) { }
    const found = s.roll && discoveredSymbols().has(s.roll);
    tutScript = s.roll && !found ? s.roll : null;
    if (!tutBox) {
        tutBox = document.createElement('div');
        tutBox.className = 'tut';
        tutBox.setAttribute('role', 'dialog');
        tutBox.setAttribute('aria-live', 'polite');
        tutBox.innerHTML = '<p></p><div class="btn-row"><button class="ghost tut-skip">Skip tutorial</button><button class="primary tut-next">Next</button></div>';
        tutBox.querySelector('.tut-skip').onclick = tutEnd;
        tutBox.querySelector('.tut-next').onclick = () => tutShow(tutAt + 1);
        document.body.appendChild(tutBox);
    }
    const last = !TUT.slice(i + 1).some(t => !tutOff(t));
    tutBox.querySelector('.tut-next').textContent = last ? 'Start playing' : 'Next';
    tutBox.querySelector('.tut-skip').hidden = last;
    clearInterval(tutTimer);
    tutTimer = setInterval(tutTick, 250);
    tutTick();
}
function tutTick() {
    const s = TUT[tutAt];
    if (!s) {
        return;
    }
    if (tutOff(s)) {
        return tutShow(tutAt + 1);
    }
    if (s.roll ? discoveredSymbols().has(s.roll) && !rolling : s.done && s.done()) {
        return tutShow(tutAt + 1);
    }
    // not there yet: point at the next button on the way
    const hop = s.on && !onScreen(s.on) ? tutHop(s.on) : null;
    let say = s.say;
    let el;
    if (hop) {
        const name = hop.getAttribute('aria-label') || (hop.querySelector('span') || hop).textContent.trim();
        say = (s.way ? s.way + ' ' : '') + 'Tap ' + name + '.';
        el = hop;
    } else {
        if (s.storm && !qStormOn()) {
            qStormStart();
            renderQStorm();
        }
        // the page redraws a lot, so the highlight is found again each time
        el = s.at && document.querySelector(s.at);
        el = el && el.closest('.screen.active') ? el : null;
    }
    const p = tutBox.querySelector('p');
    if (p.textContent !== say) {
        p.textContent = say;
    }
    tutBox.querySelector('.tut-next').hidden = !!(hop || s.done || s.roll);
    if (el !== tutSpot) {
        if (tutSpot) {
            tutSpot.classList.remove('tut-spot');
        }
        tutSpot = el;
        if (el) {
            el.classList.add('tut-spot');
            el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
        }
    }
    const r = el && el.getBoundingClientRect();
    tutBox.classList.toggle('top', !!r && r.top + r.height / 2 > innerHeight * 0.55);
    tutPlace();
}
// dims the page around whatever it's pointing at
function tutPlace() {
    if (!tutDim) {
        tutDim = document.createElement('div');
        tutDim.className = 'tut-dim';
        document.body.appendChild(tutDim);
    }
    const r = tutSpot && tutSpot.isConnected && tutSpot.getBoundingClientRect();
    tutDim.hidden = !r || !r.width;
    if (!tutDim.hidden) {
        tutDim.style.cssText = `left:${r.left - 6}px;top:${r.top - 6}px;width:${r.width + 12}px;height:${r.height + 12}px`;
    }
}
addEventListener('scroll', () => tutBox && requestAnimationFrame(tutPlace), true);
addEventListener('resize', () => tutBox && tutPlace());
function tutHop(to) {
    const cur = document.querySelector('.screen.active');
    if (cur.id === 'element') {
        return $('elemBack');
    }
    // the inventory is only linked from the shop and roll screens
    const via = to === 'catinv' && !cur.querySelector('[data-go="catinv"]') ? 'shop' : to;
    return cur.querySelector('[data-go="' + via + '"]') || cur.querySelector('[data-go="menu"]');
}
function tutInit() {
    // not until a seed is connected, and only the parts of the game this seed has
    if (!apSaveId()) {
        return;
    }
    let v = null;
    try {
        v = localStorage.getItem('elementalTutorial');
    } catch (e) { }
    if (v === 'done') {
        return;
    }
    // an older save
    if (v == null && totalRolls() > 0) {
        return tutEnd();
    }
    tutShow(+v || 0);
}
