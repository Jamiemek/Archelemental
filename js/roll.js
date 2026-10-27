// shrink an element's font so text fits in room pixels
function fitText(el, text, room, base) {
    const cs = getComputedStyle(el);
    const b = base || parseFloat(cs.fontSize) || 80;
    const m = fitText.c || (fitText.c = document.createElement('canvas').getContext('2d'));
    m.font = cs.fontWeight + ' ' + b + 'px ' + cs.fontFamily;
    const w = m.measureText(text).width;
    el.style.fontSize = (w > room ? Math.max(9, b * room / w) : b) + 'px';
}
const MR_TIER_COL = ['rgba(232,239,233,.35)', '#7cc8ff', '#5eead4', '#b39dff', '#f78fd8', '#ffd166', '#ff9a5c', '#ff5d7a', '#c9b8ff', '#fff6d6', '#3ff0ff', '#c45cff', '#ffd36e'];
// multiroll: show one roll large with its details; the strip picks which
// name if it has one, otherwise the score
function resultLines(card, r) {
    const named = r.elements.length === 1 || ACHIEVEMENTS.some(a => a.hill === r.formula);
    const mode = !named && displayMode === 'score' ? 'odds' : displayMode;
    card.querySelector('.result-name').textContent = (named ? r.name : 'Score ' + fmtScore(r.score)) + (r.ion ? ' ' + ionText(r.ion) + ' ion' : '');
    card.querySelector('.rarity').textContent = rarityWord(mode) + ' ' + rarityShown(r, mode);
}
function showMultiRoll(col, records, i, best, swap) {
    const r = records[i];
    const main = col.querySelector('.mr-main');
    const card = col.querySelector('.result-card');
    const reel = col.querySelector('.reel');
    const shown = withIon(r.formula, r.ion);
    if (swap && main.textContent !== shown) {
        main.classList.remove('swap');
        void main.offsetWidth;
        main.classList.add('swap');
    }
    main.textContent = shown;
    fitText(main, shown, reel.clientWidth - 48, parseFloat(getComputedStyle(reel).getPropertyValue('--mr-fs')) || undefined);
    col.querySelectorAll('.mr-chip').forEach((c, k) => c.classList.toggle('sel', k === i));
    card.querySelector('.eyebrow').textContent = `Roll ${i + 1} of ${records.length}` + (i === best ? ' · best' : '');
    resultLines(card, r);
    card.querySelector('.sub').textContent = $('chainSetting').value === 'off' ? '' : r.elements.length > 1 ? `${r.elements.length} elements chained` : 'No chain';
    col._mr = { records, best };
}
$('rollResults').addEventListener('click', e => {
    const c = e.target.closest('.mr-chip');
    const col = c && c.closest('.roll-result-column');
    if (!c || !col || !col._mr || col.querySelector('.reel.rolling')) {
        return;
    }
    showMultiRoll(col, col._mr.records, +c.dataset.i, col._mr.best, true);
});
async function doRoll(preset, opts) {
    const pre = Array.isArray(preset) ? preset : null;
    const replay = !!(opts && opts.replay);
    if (rolling) {
        return;
    }
    rolling = true;
    stopPageFx();
    $('rollBtn').disabled = true;
    $('rollBtn').textContent = 'Rolling…';
    $('rollToast').textContent = '';
    const buffs = activeBuffStats();
    const rollCount = pre ? pre.length : 1 + buffs.extra;
    const delay = Math.max(300, 3000 / (1 + buffs.speed / 100));
    const results = $('rollResults');
    results.innerHTML = '';
    results.style.gridTemplateColumns = rollCount > 1 ? '1fr' : 'repeat(1,minmax(0,1fr))';
    const multi = rollCount > 1;
    const cardHtml = () => `<div class="result-card"><div class="eyebrow">${multi ? `${rollCount} rolls` : ''}</div><h2 class="result-name">Rolling…</h2><div class="rarity">&nbsp;</div><div class="sub"></div></div>`;
    const col = document.createElement('div');
    col.className = 'roll-result-column';
    col.innerHTML = !multi ? `<div class="reel rolling"><div class="reel-symbol">?</div></div>${cardHtml()}` : `<div class="reel rolling multi"><div class="reel-symbol mr-main">?</div><div class="mr-strip">${Array.from({ length: rollCount }, (_, k) => `<button type="button" class="mr-chip" data-i="${k}" style="--k:${k}"><b>?</b><span>&nbsp;</span></button>`).join('')}</div></div>${cardHtml()}`;
    results.appendChild(col);
    const reel = col.querySelector('.reel');
    const syms = [...col.querySelectorAll('.reel-symbol')];
    const chips = [...col.querySelectorAll('.mr-chip')];
    const cards = [...col.querySelectorAll('.result-card')];
    let records = [];
    try {
        const onRoll = $('game').classList.contains('active');
        if (onRoll || autoRolling) {
            startRollTicks();
        }
        const scripted = !pre && tutTake();
        // before it counts down
        const evNow = pre || scripted ? null : eventNow();
        const rolls = pre || Array.from({ length: rollCount }, () => {
            // the catalysts behind this roll, noted before single-roll ones are used up
            const timed = activeList().filter(x => x.a.rolls == null && x.c).map(x => x.c.name);
            const ch = takeRollCharge();
            buffHold = activeBuffStats();
            try {
                let luckUp = ch.rollLuck;
                let first = null;
                if (ch.unfound) {
                    const found = discoveredSymbols();
                    if (ELEMENTS.some(e => !found.has(e[0]))) {
                        first = weightedElement(luckUp, e => !found.has(e[0]));
                    } else {
                        luckUp += 1500;
                    }
                }
                // inside joke works half the time
                if (!first && ch.jokeNew && Math.random() < 0.5 && jokesOn()) {
                    const jf = jokesFound();
                    if (JOKES.some(j => !jf.has(j[0]))) {
                        first = weightedElement(luckUp, e => isJoke(e[0]) && !jf.has(e[0]));
                    }
                }
                const denom = evNow === 'collider' ? 2 : ch.chain3 ? Math.min(CHAIN_MAX, buffs.chainDenom) : buffs.chainDenom;
                const twice = evNow === 'hole' || ch.twice;
                const make = () => rollElements(luckUp, first, { denom, linked: ch.linked, magnet: ch.magnet });
                const elements = scripted ? [elementBySymbol[scripted]] : twice ? rollTwice(make) : make();
                if (elements.some(e => isJoke(e[0]))) {
                    gagHit();
                }
                const formula = hillFormula(elements);
                const log = exactRarity(elements, 0);
                return ionise({
                    elements, formula, log, rarity: rarityText(log), score: rollScore(elements), cats: timed.concat(ch.used)
                }, rollIon());
            } finally {
                buffHold = null;
            }
        });
        const ev = pre || scripted ? null : eventsPress(rolls.length);
        const storm = ev && !ev.ev ? ev : null;
        const bestIdx = rolls.reduce((bi, r, i) => r.score > rolls[bi].score ? i : bi, 0);
        const secret = !replay && getRarityTier(rolls[bestIdx].score) >= 5 && Math.random() < secretChance();
        // viewer ignores the setting
        const cut = cutsOn || replay ? pickCutscene(rolls) : null;
        // a cutscene always plays on the roll screen, so a rare roll found elsewhere takes you there
        if (cut && !$('game').classList.contains('active')) {
            go('game');
        }
        // multiroll: the cutscene roll, or else the highest score, is shown large; the rest sit in the strip
        const feat = cut ? cut.idx : bestIdx;
        let targets = null;
        if (multi) {
            reel.style.setProperty('--mr-fs', getComputedStyle(syms[0]).fontSize);
            fitText(syms[0], withIon(rolls[feat].formula, rolls[feat].ion), reel.clientWidth - 48);
            chips.forEach((c, i) => fitText(c.querySelector('b'), withIon(rolls[i].formula, rolls[i].ion), c.clientWidth - 10, 18));
            const rr = reel.getBoundingClientRect();
            const mid = el => {
                const q = el.getBoundingClientRect();
                return { x: q.left + q.width / 2 - rr.left, y: q.top + q.height / 2 - rr.top, fs: parseFloat(el.style.fontSize) };
            };
            targets = rolls.map((r, i) => mid(i === feat ? syms[0] : chips[i].querySelector('b')));
        }
        if (cut) {
            stopRollTicks();
            await playCutscene(cut.sym, reel, multi ? [withIon(rolls[feat].formula, rolls[feat].ion)] : rolls.map(r => withIon(r.formula, r.ion)), multi ? 0 : cut.idx, syms);
        } else {
            playBuildup(onRoll ? Math.max(...rolls.map(r => getRarityTier(r.score))) : 0, (Math.max(120, 1350 * delay / 3000) + 1650) / 1000);
            await scanField(reel, syms, rolls.map(r => withIon(r.formula, r.ion)), rolls.map(r => r.score), delay, targets, evNow);
        }
        reel.classList.remove('rolling');
        reel.classList.add('reveal');
        if (cut) {
            reel.classList.add('cut');
        }
        rolls.forEach((r, i) => {
            const { elements, formula, log, rarity, score } = r;
            const card = cards[multi ? 0 : i];
            const names = elements.map(e => e[1]);
            const known = ACHIEVEMENTS.find(a => a.hill === formula);
            const name = elements.length === 1 ? elements[0][1] : (known ? known.name : names.join(' + '));
            const record = {
                id: Date.now() + Math.random(), formula, name, elements, rarity, log, score, when: new Date().toISOString(), cats: r.cats
            };
            if (r.ion) {
                Object.assign(record, { ion: r.ion, baseLog: r.baseLog, baseScore: r.baseScore });
            }
            records.push(record);
            if (!pre) {
                ionCredit(elements[0][0], record.ion);
                addRecord(record);
                addHistory(record, totalRolls());
                save();
                checkAchievements(record);
                apFound(record);
            }
            if (multi) {
                const c = chips[i];
                c.querySelector('b').textContent = withIon(formula, record.ion);
                c.querySelector('span').textContent = rarityShown(record);
                c.style.setProperty('--tc', MR_TIER_COL[getRarityTier(score)]);
                c.classList.toggle('feat', i === feat);
                c.classList.toggle('best', i === bestIdx);
            } else {
                syms[i].textContent = withIon(formula, record.ion);
                resultLines(card, record);
                card.querySelector('.sub').textContent = $('chainSetting').value === 'off' ? '' : elements.length > 1 ? `${elements.length} elements chained` : 'No chain';
            }
            // best roll's chime only
            if ((onRoll || autoRolling || cut || getRarityTier(score) > 0) && (!multi || i === bestIdx)) {
                playResultChime(score, secret && i === bestIdx);
            }
            if (!pre) {
                // quarks use the plain sum
                addQuarks(quarksFor(oddsSum(elements) * ionScoreMult(record.ion || 0), quarkMult(elements, buffs)) + (storm && storm.add ? storm.add[i] : 0));
            }
        });
        // once per press
        const drop = !pre && rollDrop();
        if (drop) {
            showDrop(drop, 0);
        }
        if (multi) {
            showMultiRoll(col, records, feat, bestIdx, false);
        }
        renderHistory();
        if ($('bonds').classList.contains('active')) {
            bondSummary();
            netDrawSoon();
        }
        if ($('catinv').classList.contains('active')) {
            renderCatInv();
        }
        triggerRarityEffect(rolls[bestIdx], secret);
        if (!replay) {
            const t = getRarityTier(rolls[bestIdx].score);
            if (cut) {
                seenAdd('cut', cut.sym);
            }
            if (t && rarityEffects[t] !== false) {
                seenAdd(secret && t >= 5 ? 'dark' : 'fx', t);
            }
        }
        stopRollTicks();
        $('rollToast').textContent = '';
        if (ev && ev.ev) {
            renderQStorm();
            const E = EVENTS[ev.ev];
            if (ev.started) {
                showAchievementToast({ kicker: 'Event', name: E.name, flavor: 'For the next ' + evRun.left + ' rolls, ' + E.what + '.' });
            } else if (ev.ended) {
                showAchievementToast({ kicker: 'Event over', name: E.name, flavor: 'Rolling is back to normal.' });
            }
        }
        if (storm) {
            renderQStorm(storm.sum);
            if (storm.started) {
                showAchievementToast({ kicker: 'Event', name: 'Quark Storm', flavor: 'For the next ' + qStorm.left + ' rolls, every roll earns ' + qStormRange().join(' to ') + ' extra quarks.' });
            } else if (storm.ended) {
                showAchievementToast({ kicker: 'Quark Storm over', name: '+' + formatNumber(Math.round(storm.ended)) + ' quarks', flavor: 'The storm has passed. That is what it added on top of your usual quarks.' });
            }
        }
        refreshViews();
        applyCosmetics();
        if (!buffs.autoUnlocked && activeBuffStats().autoUnlocked) {
            setTimeout(() => showAchievementToast({
                kicker: 'New feature', name: 'Autoroll unlocked', flavor: elementBySymbol[AUTO_UNLOCK_SYMBOL][1] + ' discovered: autoroll is now available on the roll screen, and stays on until you switch it off.'
            }), 1800);
        }
    } finally {
        stopRollTicks();
        rolling = false;
        $('rollBtn').disabled = false;
        $('rollBtn').textContent = 'Roll again';
    }
}
$('rollBtn').addEventListener('click', doRoll);
function fmtDur(s) {
    s = Math.max(0, Math.ceil(s));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
// autoroll: once unlocked it stays on until switched off, with a break between rolls.
// It runs while the roll screen is open and waits while you are on another screen.
let autoWanted = false;
let autoFrom = 0;
const autoNext = () => autoFrom ? autoFrom + activeBuffStats().autoGap * 1000 : 0;
try {
    autoWanted = localStorage.getItem('elementalAutoOn') === '1';
} catch (e) { }
function saveAutoState() {
    try {
        localStorage.setItem('elementalAutoOn', autoWanted ? '1' : '');
        localStorage.removeItem('elementalAutoState');
    } catch (e) { }
}
const fmtGap = s => s < 10 ? s.toFixed(1) + 's' : fmtDur(s);
function updateAutoBtn() {
    const b = $('autoRollBtn');
    const hint = $('autoHint');
    const s = activeBuffStats();
    const u = elementBySymbol[AUTO_UNLOCK_SYMBOL];
    let label;
    let status;
    let disabled = false;
    if (!s.autoUnlocked) {
        label = 'Autoroll locked';
        status = 'Locked';
        disabled = true;
        hint.textContent = 'Autoroll unlocks when you find ' + u[1] + ' (' + u[0] + ').';
    } else {
        const onMenu = $('menu').classList.contains('active');
        hint.textContent = `Autoroll keeps rolling with a ${fmtGap(s.autoGap)} break between rolls${s.autoGap <= AUTO_MIN_GAP ? ' (its fastest)' : ''}. It keeps going on every screen except the main menu.`;
        if (!autoWanted) {
            label = 'Autoroll off';
            status = 'Off';
        } else if (onMenu) {
            label = 'Autoroll on';
            status = 'Paused on the main menu';
        } else if (rolling || !autoFrom) {
            label = 'Autoroll on';
            status = 'On, rolling';
        } else {
            const left = Math.max(0, (autoNext() - Date.now()) / 1000);
            label = 'Autoroll on · ' + fmtGap(left);
            status = 'On, next roll in ' + fmtGap(left);
        }
    }
    b.disabled = disabled;
    b.textContent = label;
    b.setAttribute('aria-pressed', autoWanted && s.autoUnlocked ? 'true' : 'false');
    b.classList.toggle('auto-on', autoWanted && s.autoUnlocked);
    document.querySelectorAll('.js-auto').forEach(el => {
        el.textContent = status;
    });
}
async function autoLoop() {
    if (autoRolling) {
        return;
    }
    autoRolling = true;
    try {
        while (autoWanted && activeBuffStats().autoUnlocked) {
            if ($('menu').classList.contains('active') || rolling || document.getElementById('dlg')) {
                autoFrom = 0;
                await new Promise(r => setTimeout(r, 250));
                continue;
            }
            if (!autoFrom) {
                autoFrom = Date.now();
            }
            if (Date.now() < autoNext()) {
                updateAutoBtn();
                await new Promise(r => setTimeout(r, Math.max(16, Math.min(250, autoNext() - Date.now()))));
                continue;
            }
            autoFrom = 0;
            await doRoll();
            autoFrom = Date.now();
        }
    } catch (err) {
        console.error('Autoroll stopped after an error:', err);
    } finally {
        autoRolling = false;
        autoFrom = 0;
        updateAutoBtn();
    }
}
$('autoRollBtn').addEventListener('click', () => {
    if (!activeBuffStats().autoUnlocked) {
        return;
    }
    autoWanted = !autoWanted;
    saveAutoState();
    // first roll after switching on comes after one break, like every other
    autoFrom = 0;
    updateAutoBtn();
    if (autoWanted) {
        autoLoop();
    }
});
setInterval(updateAutoBtn, 250);
updateAutoBtn();
if (autoWanted) {
    autoLoop();
}
$('resetBtn').addEventListener('click', () => {
    const w = openDialog('<h2>Reset all progress?</h2><p>All discoveries and collection progress on this device are cleared. This can\'t be undone.</p>' +
        '<div class="btn-row"><button class="ghost danger" id="rsYes">Reset</button><button class="primary" id="rsNo">Cancel</button></div>');
    w.querySelector('#rsNo').onclick = closeDialog;
    w.querySelector('#rsYes').onclick = () => {
        closeDialog();
        autoRolling = false;
        autoWanted = false;
        try {
            localStorage.removeItem('elementalAutoState');
            localStorage.removeItem('elementalBonds2');
            netState = {};
            netVer++;
            localStorage.removeItem('elementalNetwork');
            localStorage.removeItem('elementalShop');
            localStorage.removeItem('elementalCatInv');
            localStorage.removeItem('elementalCatActive');
            localStorage.removeItem('elementalCatFlags');
            localStorage.removeItem('elementalCatSrc');
            localStorage.removeItem('elementalIons');
            localStorage.removeItem('elementalJokeIntro');
            shopState = { slot: -1, stock: [] };
            catInv = {};
            catActive = {};
            catFlags = {};
            catSrc = {};
            ionMarks = {};
            ionNew = [];
            qStorm = null;
            qStormSave();
            evRun = null;
            evSave();
            localStorage.removeItem('elementalCosmetics');
            cosState = { owned: [], scanner: '', page: '', effects: '', badge: true };
            applyCosmetics();
            buffCache = weightCache = null;
        } catch (e) { }
        collection = [];
        save();
        quarks = 0;
        try {
            localStorage.removeItem('elementalQuarks');
            localStorage.removeItem('elementalHistory');
            localStorage.removeItem('elementalCleared');
            localStorage.removeItem('elementalSeen');
            seenData = null;
            clearCleared = { rolls: 0, formulas: 0 };
        } catch (e) { }
        renderQuarks();
        rollHistory = [];
        renderHistory();
        updateAutoBtn();
        unlockedAchievements = [];
        try {
            localStorage.removeItem('elementalAchievements');
        } catch (e) { }
        syncEffectSettings();
        renderInventory();
        renderPeriodic();
        renderAchievements();
        $('rollResults').style.gridTemplateColumns = '';
        $('rollResults').innerHTML = INITIAL_RESULT;
        openDialog('<h2>Progress reset</h2><div class="btn-row"><button class="primary" onclick="closeDialog()">OK</button></div>');
    };
});
renderInventory();
renderPeriodic();
renderAchievements();
function parseFormula(s) {
    const st = [{}];
    const re = /([A-Z][a-z]?)(\d*)|(\()|\)(\d*)/g;
    let m;
    while (m = re.exec(s)) {
        if (m[1]) {
            const c = st[st.length - 1];
            c[m[1]] = (c[m[1]] || 0) + (+m[2] || 1);
        } else if (m[3]) {
            st.push({});
        } else {
            const t = st.pop();
            const k = +m[4] || 1;
            const c = st[st.length - 1];
            for (const x in t) {
                c[x] = (c[x] || 0) + t[x] * k;
            }
        }
    }
    return st[0];
}
function normalizeFormula(f) {
    const c = parseFormula(f);
    const a = [];
    for (const x in c) {
        for (let i = 0; i < c[x]; i++) {
            a.push([x]);
        }
    }
    return hillFormula(a);
}
ACHIEVEMENTS.forEach(a => a.hill = normalizeFormula(a.formula));
