// Archipelago: talks to the server over a websocket, sends checks, and hands out what other players send
const AP_GAME = 'Archelemental';
const AP_VERSION = { major: 0, minor: 6, build: 7, class: 'Version' };
// location ids, matching the APWorld
const AP_LOC = { element: 1000, joke: 2000, catalyst: 3000, achievement: 4000, ion: 6000, bond: 20000 };
const AP_ION_TIERS = ['+1', '+2', '+3', '-1', '-2', '-3'];
const AP_CAT_ITEM = 100;
const AP_SECRET = 6;
// the connection
let apWs = null;
let apStatus = 'offline';
let apRoom = null;
let apSlot = null;
let apPlayers = {};
let apGames = {};
let apNames = {};
let apLog = [];
let apRetry = 0;
let apRetryTimer = null;
let apServerChecked = new Set();
function apSay(text, kind) {
    apLog.push({ text, kind: kind || '', at: Date.now() });
    if (apLog.length > 200) {
        apLog.shift();
    }
    apRenderLog();
}
function apSetStatus(s, why) {
    apStatus = s;
    const label = { offline: 'Not connected', connecting: 'Connecting…', connected: 'Connected', refused: 'Refused' }[s];
    if ($('apNavVal')) {
        $('apNavVal').textContent = label;
    }
    if ($('apStatus')) {
        $('apStatus').textContent = why ? label + ': ' + why : label;
        $('apStatus').dataset.s = s;
    }
    if ($('apGo')) {
        $('apGo').textContent = s === 'connected' || s === 'connecting' ? 'Disconnect' : 'Connect';
    }
}
// "archipelago.gg:38281" gets wss://, and ws:// as well when the page itself isn't https or it's this computer
function apUrls(host) {
    host = host.trim();
    if (/^wss?:\/\//.test(host)) {
        return [host];
    }
    if (!/:\d+$/.test(host)) {
        host += ':38281';
    }
    const local = /^(localhost|127\.|\[::1\])/.test(host);
    const secure = location.protocol === 'https:';
    return local ? ['ws://' + host, 'wss://' + host] : secure ? ['wss://' + host] : ['wss://' + host, 'ws://' + host];
}
function apSend(...packets) {
    if (apWs && apWs.readyState === 1) {
        apWs.send(JSON.stringify(packets));
    }
}
function apConnect() {
    apDisconnect(true);
    if (!apConn.host || !apConn.name) {
        apSetStatus('offline', 'type the server and your slot name');
        return;
    }
    apSetStatus('connecting');
    const urls = apUrls(apConn.host);
    const tryUrl = i => {
        if (i >= urls.length) {
            apSetStatus('offline', "couldn't reach the server");
            apRetryLater();
            return;
        }
        let opened = false;
        let ws;
        try {
            ws = new WebSocket(urls[i]);
        } catch (e) {
            tryUrl(i + 1);
            return;
        }
        apWs = ws;
        ws.onopen = () => {
            opened = true;
        };
        ws.onmessage = e => {
            let packets = [];
            try {
                packets = JSON.parse(e.data);
            } catch (x) {
                return;
            }
            packets.forEach(apHandle);
        };
        ws.onclose = () => {
            if (apWs !== ws) {
                return;
            }
            apWs = null;
            if (!opened) {
                tryUrl(i + 1);
                return;
            }
            if (apStatus !== 'refused') {
                apSetStatus('offline', 'lost the connection, trying again');
                apRetryLater();
            }
        };
    };
    tryUrl(0);
}
function apDisconnect(quiet) {
    clearTimeout(apRetryTimer);
    if (apWs) {
        const ws = apWs;
        apWs = null;
        ws.close();
    }
    if (!quiet) {
        apSetStatus('offline');
    }
}
function apRetryLater() {
    clearTimeout(apRetryTimer);
    apRetry = Math.min(apRetry + 1, 6);
    apRetryTimer = setTimeout(apConnect, 2000 * apRetry);
}
function apHandle(p) {
    if (p.cmd === 'RoomInfo') {
        apRoom = p;
        // names for every game in the room, so the log can say what was sent where
        const want = (p.games || []).filter(g => !apNames[g]);
        if (want.length) {
            apSend({ cmd: 'GetDataPackage', games: want });
        }
        apSend({ cmd: 'Connect', game: AP_GAME, name: apConn.name, password: apConn.pass || '', uuid: apUuid(), version: AP_VERSION, items_handling: 7, tags: [], slot_data: true });
    } else if (p.cmd === 'DataPackage') {
        Object.entries(p.data.games || {}).forEach(([g, d]) => {
            apNames[g] = { item: apFlip(d.item_name_to_id), loc: apFlip(d.location_name_to_id) };
        });
    } else if (p.cmd === 'ConnectionRefused') {
        apSetStatus('refused', (p.errors || []).join(', ').replace(/Invalid/g, 'wrong ').toLowerCase() || 'the server said no');
        apDisconnect(true);
    } else if (p.cmd === 'Connected') {
        apConnected(p);
    } else if (p.cmd === 'ReceivedItems') {
        apReceived(p.index, p.items);
    } else if (p.cmd === 'RoomUpdate') {
        (p.checked_locations || []).forEach(id => apServerChecked.add(id));
        if (p.players) {
            p.players.forEach(x => apPlayers[x.slot] = x.alias || x.name);
        }
    } else if (p.cmd === 'PrintJSON') {
        apSay(apText(p.data), p.type === 'ItemSend' && p.receiving === apSlot ? 'got' : p.type || '');
    }
}
const apFlip = o => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [v, k]));
function apUuid() {
    let u = '';
    try {
        u = localStorage.getItem('archelUuid') || '';
        if (!u) {
            u = Math.random().toString(36).slice(2) + Date.now().toString(36);
            localStorage.setItem('archelUuid', u);
        }
    } catch (e) { }
    return u;
}
function apConnected(p) {
    // a different seed or slot gets its own save: switch to it and start again from there
    const id = apRoom.seed_name + '|' + apConn.name;
    if (id !== apSaveId()) {
        try {
            localStorage.setItem('archelSave', id);
        } catch (e) { }
        apDisconnect(true);
        location.reload();
        return;
    }
    apRetry = 0;
    apSlot = p.slot;
    apPlayers = {};
    apGames = {};
    (p.players || []).forEach(x => apPlayers[x.slot] = x.alias || x.name);
    Object.entries(p.slot_info || {}).forEach(([s, info]) => apGames[s] = info.game);
    apServerChecked = new Set(p.checked_locations || []);
    apState.slotData = p.slot_data || {};
    apSaveState();
    buffCache = weightCache = null;
    apSetStatus('connected');
    apSay('Connected as ' + apConn.name + '.', 'sys');
    // the seed was made from a tree of a certain size: a different one would send the wrong slots
    if (apOpt('bonds_tree') && apOpt('bond_nodes') && apOpt('bond_nodes') !== net().nodes.length) {
        apSay('This seed was made for a different version of the bonds tree (' + apOpt('bond_nodes') + ' slots, this game has ' + net().nodes.length + '). Download the matching APWorld from the game, or play on the version the seed was made for.', 'sys');
    }
    apApplyOptions();
    apSync();
}
// items: anything new is added to the list; the one-off kinds are used up as they arrive
function apReceived(index, items) {
    if (index === 0) {
        apState.items = [];
    }
    if (index !== apState.items.length) {
        apSend({ cmd: 'Sync' });
        return;
    }
    apState.items = apState.items.concat(items.map(i => ({ item: i.item, player: i.player, flags: i.flags })));
    const fresh = [];
    while (apState.spent < apState.items.length) {
        const it = apState.items[apState.spent++];
        apUse(it);
        fresh.push(it);
    }
    apSaveState();
    buffCache = weightCache = null;
    netCache = bondCache = null;
    netVer++;
    if (fresh.length) {
        apToast(fresh);
        refreshAfterItems();
    }
}
function apItemName(it) {
    const id = it.item;
    if (AP_ITEM[id]) {
        return AP_ITEM[id];
    }
    if (id >= AP_COS_BASE && id < AP_COS_BASE + AP_COS.length) {
        return COS[AP_COS[id - AP_COS_BASE]].name;
    }
    if (id > AP_ELEMENT_BASE && id <= AP_ELEMENT_BASE + 118) {
        return 'Element: ' + ELEMENTS[id - AP_ELEMENT_BASE - 1][1];
    }
    if (id >= AP_BOND_ITEM && id < AP_BOND_END) {
        return 'Bond ' + (id - AP_BOND_ITEM + 1) + ' Requirements';
    }
    return (CATALYSTS[id - AP_CAT_ITEM] || {}).name || 'Something';
}
function apUse(it) {
    const id = it.item;
    if (AP_BUNDLE[id]) {
        addQuarks(AP_BUNDLE[id]);
        return;
    }
    if (AP_TRAP[id]) {
        apState.traps.push({ k: AP_TRAP[id], until: Date.now() + AP_TRAP_MS });
        apTrapTick();
        return;
    }
    const c = id >= AP_CAT_ITEM && id < 200 ? CATALYSTS[id - AP_CAT_ITEM] : null;
    if (c) {
        catInv[c.id] = (catInv[c.id] || 0) + 1;
        saveCats();
    }
}
// traps wear off by themselves: when one ends, everything that depended on it is worked out again
let apTrapTimer = null;
function apTrapTick() {
    clearTimeout(apTrapTimer);
    const now = Date.now();
    apState.traps = apState.traps.filter(t => t.until > now);
    buffCache = weightCache = null;
    apSaveState();
    if (typeof renderRollStats === 'function' && $('homeMap')) {
        renderRollStats();
    }
    if (apState.traps.length) {
        apTrapTimer = setTimeout(apTrapTick, Math.max(500, Math.min(...apState.traps.map(t => t.until)) - now + 50));
    }
}
function refreshAfterItems() {
    refreshViews();
    renderRollStats();
    renderHome();
    renderCatInv();
    renderShop();
    applyCosmetics();
    if ($('bonds').classList.contains('active')) {
        $('netTotals').innerHTML = netTotalsHtml();
        netDrawSoon();
    }
    if (jokesOn()) {
        jokeIntroCheck();
    }
}
function apToast(items) {
    const el = $('apToast');
    if (!el) {
        return;
    }
    const names = {};
    items.forEach(it => names[apItemName(it)] = (names[apItemName(it)] || 0) + 1);
    el.innerHTML = '<small>Received</small>' + Object.entries(names).map(([n, k]) => '<strong>' + esc(n) + (k > 1 ? ' ×' + k : '') + '</strong>').join('');
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 4000);
}
// a PrintJSON message as plain text, with names filled in
function apText(parts) {
    return (parts || []).map(x => {
        if (x.type === 'player_id') {
            return apPlayers[+x.text] || 'Player ' + x.text;
        }
        if (x.type === 'item_id') {
            const n = apNames[apGames[x.player]];
            return n && n.item[x.text] || 'an item';
        }
        if (x.type === 'location_id') {
            const n = apNames[apGames[x.player]];
            return n && n.loc[x.text] || 'somewhere';
        }
        return x.text || '';
    }).join('');
}

// checks: worked out from the save itself, so nothing is lost if the game was played offline
function apChecksDone() {
    const out = [];
    // what you rolled, not what you were sent: with Element Frenzy those differ
    const found = rolledSymbols();
    ELEMENTS.forEach((e, i) => {
        if (found.has(e[0])) {
            out.push(AP_LOC.element + i + 1);
        }
    });
    if (apOpt('joke_elements')) {
        const jf = jokesFound();
        JOKES.forEach((j, i) => {
            if (jf.has(j[0])) {
                out.push(AP_LOC.joke + i + 1);
            }
        });
    }
    const top = Math.min(apOpt('catalyst_checks'), AP_SECRET);
    CATALYSTS.forEach((c, i) => {
        if (c.tier < top && (!c.joke || apOpt('joke_elements')) && apState.catSeen.includes(c.id)) {
            out.push(AP_LOC.catalyst + i + 1);
        }
    });
    if (apOpt('achievement_checks')) {
        ACHIEVEMENTS.forEach((a, i) => {
            if (unlockedAchievements.includes(a.formula)) {
                out.push(AP_LOC.achievement + i + 1);
            }
        });
    }
    if (apOpt('ionization_frenzy')) {
        ELEMENTS.forEach((e, i) => {
            (apState.ions[e[0]] || []).forEach(code => {
                const t = AP_ION_TIERS.indexOf(code);
                if (t >= 0) {
                    out.push(AP_LOC.ion + i * AP_ION_TIERS.length + t + 1);
                }
            });
        });
    }
    if (apOpt('bonds_tree')) {
        const checks = apBondChecks();
        Object.keys(netState).forEach(id => {
            if (netState[id] && checks.has(+id)) {
                out.push(AP_LOC.bond + (+id));
            }
        });
    }
    return out;
}
// the slots that are checks: the first bond_slots of them (older seeds: all of them), less any the APWorld left
// out because they can only be reached through a later slot
let apBondMemo = null;
function apBondChecks() {
    const n = net();
    const k = apOpt('bond_slots') || n.nodes.length;
    if (!apBondMemo || apBondMemo.k !== k || apBondMemo.n !== n) {
        const ids = new Set([0]);
        const queue = [0];
        for (let q = 0; q < queue.length; q++) {
            const at = queue[q];
            n.adj[at].forEach(i => {
                const e = n.edges[i];
                const m = e.a === at ? e.b : e.a;
                if (m < k && !ids.has(m)) {
                    ids.add(m);
                    queue.push(m);
                }
            });
        }
        apBondMemo = { k, n, ids };
    }
    return apBondMemo.ids;
}
function apIon(sym, ion) {
    const code = (ion > 0 ? '+' : '-') + Math.abs(ion);
    const list = apState.ions[sym] || (apState.ions[sym] = []);
    if (!list.includes(code)) {
        list.push(code);
        apSaveState();
    }
}
function apSync() {
    const done = apChecksDone();
    const fresh = done.filter(id => !apServerChecked.has(id));
    if (fresh.length && apStatus === 'connected') {
        apSend({ cmd: 'LocationChecks', locations: fresh });
        fresh.forEach(id => apServerChecked.add(id));
    }
    apState.checked = done;
    // the goal
    const els = discoveredSymbols();
    const realFound = ELEMENTS.filter(e => els.has(e[0])).length;
    const jokeFound = JOKES.filter(j => jokesFound().has(j[0])).length;
    const achDone = ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.formula)).length;
    if (realFound >= apOpt('elements_required') && jokeFound >= apOpt('jokes_required') && achDone >= apOpt('achievements_required')) {
        if (apStatus === 'connected') {
            apSend({ cmd: 'StatusUpdate', status: 30 });
        }
        if (!apState.goal) {
            apState.goal = true;
            apSay('Goal complete. Well done!', 'sys');
        }
    }
    apSaveState();
    if ($('ap').classList.contains('active')) {
        apRenderGoal();
    }
}
// called by the game
function apFound() {
    apSync();
}
function apCatalyst(id) {
    if (!apState.catSeen.includes(id)) {
        apState.catSeen.push(id);
        apSync();
    }
}
// switch the parts of the game the YAML turned off
function apApplyOptions() {
    document.querySelectorAll('[data-go="bonds"]').forEach(b => b.hidden = !apOpt('bonds_tree'));
    document.querySelectorAll('[data-go="shop"]').forEach(b => b.hidden = !apOpt('shop'));
    if ((!apOpt('bonds_tree') && $('bonds').classList.contains('active')) || (!apOpt('shop') && $('shop').classList.contains('active'))) {
        go('menu');
    }
}

// the Archipelago screen
function apRender() {
    $('apHost').value = apConn.host;
    $('apName').value = apConn.name;
    $('apPass').value = apConn.pass;
    apSetStatus(apStatus);
    apRenderGoal();
    apRenderLog();
}
function apRenderGoal() {
    const els = discoveredSymbols();
    const realFound = ELEMENTS.filter(e => els.has(e[0])).length;
    const jokeFound = JOKES.filter(j => jokesFound().has(j[0])).length;
    const achDone = ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.formula)).length;
    const rows = [['Elements', realFound + ' / ' + apOpt('elements_required') + ' needed']];
    if (apOpt('jokes_required')) {
        rows.push(['Joke elements', jokeFound + ' / ' + apOpt('jokes_required') + ' needed']);
    }
    if (apOpt('achievements_required')) {
        rows.push(['Achievements', achDone + ' / ' + apOpt('achievements_required') + ' needed']);
    }
    rows.push(['Checks done', apState.checked.length.toLocaleString('en-US')]);
    rows.push(['Luck', '+' + apBoostLuck() + '% from luck boosts' + (apTrapOn('luck') ? ' (halved by a trap)' : '')]);
    if (apOpt('bonds_tree')) {
        rows.push(['Bond requirements', apBondGrants().size.toLocaleString('en-US') + ' received']);
    }
    if (apOpt('joke_elements')) {
        rows.push(['Joke Table', apHasJokes() ? 'Received' : 'Not yet']);
    }
    rows.push(['Items received', apState.items.length.toLocaleString('en-US')]);
    $('apGoal').innerHTML = rows.map(([k, v]) => '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>').join('') +
        (apState.goal ? '<div class="ap-done"><dt>Goal</dt><dd>Complete</dd></div>' : '');
}
// the same messages on the Archipelago page and the roll page
function apRenderLog() {
    const html = apLog.length ? apLog.slice(-120).map(m => '<p class="ap-line ' + m.kind + '">' + esc(m.text) + '</p>').join('') : '<p class="muted">Messages from the server show up here.</p>';
    ['apLog', 'rollLog'].forEach(id => {
        const el = $(id);
        if (!el.offsetParent) {
            el._stale = true;
            return;
        }
        // only follow new messages if you were already at the bottom, so scrolling back to read isn't interrupted
        const atEnd = el._stale || el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        el.innerHTML = html;
        el._stale = false;
        if (atEnd) {
            el.scrollTop = el.scrollHeight;
        }
    });
}
$('apGo').onclick = () => {
    if (apStatus === 'connected' || apStatus === 'connecting') {
        apDisconnect();
        return;
    }
    apConn = { host: $('apHost').value.trim(), name: $('apName').value.trim(), pass: $('apPass').value };
    try {
        localStorage.setItem('archelConn', JSON.stringify(apConn));
    } catch (e) { }
    apRetry = 0;
    apConnect();
};
[['apChat', 'apSay'], ['rollChat', 'rollSay']].forEach(([form, box]) => $(form).onsubmit = e => {
    e.preventDefault();
    const t = $(box).value.trim();
    if (t && apStatus === 'connected') {
        apSend({ cmd: 'Say', text: t });
        $(box).value = '';
    }
});
$('apHint').onclick = () => {
    if (apStatus === 'connected') {
        apSend({ cmd: 'Say', text: '!hint' });
    }
};
function apInit() {
    apTrapTick();
    apApplyOptions();
    apSetStatus('offline');
    // a save from a seed: reconnect straight away. No save yet: start on the connect screen
    if (apSaveId() && apConn.host && apConn.name) {
        apConnect();
    } else {
        go('ap');
    }
    setInterval(apSync, 5000);
}
