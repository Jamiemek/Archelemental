function assignAchievementRarities() {
    const weights = ELEMENTS.map(e => (1 / e[2]) * (1 + 1.5 * (Math.log10(e[2] + 1) / 3)));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const chainChance = 1 / 3;

    const logFactorial = n => {
        let total = 0;
        for (let i = 2; i <= n; i++) {
            total += Math.log(i);
        }
        return total;
    };

    function estimatedRolls(formula) {
        const counts = parseFormula(formula);
        const symbols = Object.keys(counts);
        const length = symbols.reduce((sum, symbol) => sum + counts[symbol], 0);
        if (length > 30) {
            return Infinity;
        }
        let logProbability = logFactorial(length);
        if (length < 30) {
            logProbability += (length - 1) * Math.log(chainChance) + Math.log(1 - chainChance);
        } else {
            logProbability += 29 * Math.log(chainChance);
        }
        symbols.forEach(symbol => {
            const weight = weights[ELEMENTS.findIndex(e => e[0] === symbol)];
            logProbability += counts[symbol] * Math.log(weight / totalWeight) - logFactorial(counts[symbol]);
        });
        return Math.exp(-logProbability);
    }

    ACHIEVEMENTS.forEach(a => {
        const rolls = estimatedRolls(a.formula);
        if (rolls < 2e3) a.rarity = 'Common';
        else if (rolls < 2e4) a.rarity = 'Uncommon';
        else if (rolls < 2e5) a.rarity = 'Rare';
        else if (rolls < 2e6) a.rarity = 'Epic';
        else a.rarity = 'Legendary';
    });

    unlockedAchievements = unlockedAchievements.filter(formula => ACHIEVEMENTS.some(a => a.formula === formula));
    document.querySelector('#achievements .sub').textContent = ACHIEVEMENTS.length + ' formulas to find. Each is recorded the first time you roll it.';
    renderAchievements();
}
assignAchievementRarities();
// only mention the space bar where there's a keyboard
if (matchMedia('(any-pointer: fine)').matches) {
    $('resultRarity').textContent = 'Press Roll or the space bar';
}
// space rolls, escape goes to the menu
document.addEventListener('keydown', e => {
    if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) {
        return;
    }
    if (e.code === 'Escape') {
        if ($('dlg')) {
            closeDialog();
        } else if (!$('menu').classList.contains('active')) {
            go('menu');
        }
    } else if (e.code === 'Space' && !$('dlg')) {
        e.preventDefault();
        document.activeElement.blur();
        if ($('game').classList.contains('active')) {
            doRoll();
        } else {
            go('game');
        }
    }
});
try {
    $('chainSetting').value = localStorage.getItem('elementalChain') || 'on';
} catch (e) { }
$('appVersion').textContent = 'Jamiemek - Archelemental - version ' + APP_VERSION;
function applyTheme(t) {
    const dark = t === 'dark' || (t === 'system' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}
let themePref = 'light';
try {
    themePref = localStorage.getItem('elementalTheme') || 'light';
} catch (e) { }
$('themeSetting').value = themePref;
$('themeSetting').onchange = () => {
    themePref = $('themeSetting').value;
    try {
        localStorage.setItem('elementalTheme', themePref);
    } catch (e) { }
    applyTheme(themePref);
};
if (window.matchMedia) {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onSys = () => themePref === 'system' && applyTheme('system');
    mq.addEventListener ? mq.addEventListener('change', onSys) : mq.addListener(onSys);
}
try {
    calmFx = localStorage.getItem('elementalCalm') === '1';
} catch (e) { }
$('calmSetting').checked = calmFx;
$('calmSetting').onchange = () => {
    calmFx = $('calmSetting').checked;
    try {
        localStorage.setItem('elementalCalm', calmFx ? '1' : '0');
    } catch (e) { }
};
let lowDetail = false;
try {
    lowDetail = localStorage.getItem('elementalLowDetail') === '1';
} catch (e) { }
$('lowSetting').checked = lowDetail;
$('lowSetting').onchange = () => {
    lowDetail = $('lowSetting').checked;
    try {
        localStorage.setItem('elementalLowDetail', lowDetail ? '1' : '0');
        // turned off by hand: don't switch it back on
        if (!lowDetail) {
            localStorage.setItem('elementalAutoLow', 'off');
        }
    } catch (e) { }
};
// effects and cutscenes call this each frame; turns on lower detail if frames run slow
function frameCheck(st, now) {
    if (lowDetail) {
        return false;
    }
    if (st.last) {
        (st.d = st.d || []).push(now - st.last);
    }
    st.last = now;
    if (!st.d || st.d.length < 40) {
        return false;
    }
    const mid = st.d.sort((a, b) => a - b)[20];
    st.d = [];
    try {
        if (mid <= 22 || localStorage.getItem('elementalAutoLow') === 'off') {
            return false;
        }
        localStorage.setItem('elementalLowDetail', '1');
        localStorage.setItem('elementalAutoLow', '1');
    } catch (e) {
        return false;
    }
    lowDetail = true;
    $('lowSetting').checked = true;
    return true;
}
let cutsOn = true;
try {
    cutsOn = localStorage.getItem('elementalCutsOff') !== '1';
} catch (e) { }
$('cutsSetting').checked = cutsOn;
$('cutsSetting').onchange = () => {
    cutsOn = $('cutsSetting').checked;
    try {
        localStorage.setItem('elementalCutsOff', cutsOn ? '0' : '1');
    } catch (e) { }
};
$('displaySetting').value = displayMode;
$('displaySetting').onchange = () => {
    displayMode = $('displaySetting').value === 'score' ? 'score' : 'odds';
    try {
        localStorage.setItem('elementalDisplay', displayMode);
    } catch (e) { }
    renderInventory();
    renderPeriodic();
    renderHistory();
};
renderQuarks();
renderQStorm();
renderHistory();
try {
    $('bonusFold').open = localStorage.getItem('elementalBonusOpen') === 'true';
} catch (e) { }
$('bonusFold').addEventListener('toggle', () => {
    try {
        localStorage.setItem('elementalBonusOpen', $('bonusFold').open ? 'true' : 'false');
    } catch (e) { }
});
$('chainSetting').onchange = () => {
    try {
        localStorage.setItem('elementalChain', $('chainSetting').value);
    } catch (e) { }
};
syncEffectSettings();
try {
    localStorage.removeItem('elementalStock');
} catch (e) { }
bondSummary();
renderActiveCats();
// tiers 10-13 only show once you've reached them
// the best score decides the highest tier reached, and the top 10 is already kept
const tierTop = () => Math.max(topFinds('score').length ? getRarityTier(topFinds('score')[0].score) : 0, 0, ...seenLoad().fx);
function tierRowsSync() {
    const top = tierTop();
    document.querySelectorAll('.tier-table tbody tr').forEach((tr, i) => tr.hidden = i >= 9 && i + 1 > top);
    $('tier9Top').textContent = top >= 10 ? 'to 30,000,000' : 'and above';
}
function jokeUiSync() {
    $('jokeSetting').hidden = !jokesOn();
    $('jokeMixSet').checked = jokeMix;
    $('jokeHideSet').checked = jokeHide;
}
function jokeSetMix(on) {
    jokeMix = on;
    try {
        localStorage.setItem('elementalJokeMix', on ? '1' : '0');
    } catch (e) { }
    weightCache = null;
}
$('jokeMixSet').addEventListener('change', () => jokeSetMix($('jokeMixSet').checked));
$('jokeHideSet').addEventListener('change', () => {
    jokeHide = $('jokeHideSet').checked;
    try {
        localStorage.setItem('elementalJokeHide', jokeHide ? '1' : '');
    } catch (e) { }
});
// first unlock popup
function jokeIntroCheck() {
    let seen = true;
    try {
        seen = localStorage.getItem('elementalJokeIntro') === '1';
    } catch (e) { }
    if (seen || !jokesOn()) {
        return;
    }
    if (document.getElementById('dlg') || rolling) {
        setTimeout(jokeIntroCheck, 1500);
        return;
    }
    try {
        localStorage.setItem('elementalJokeIntro', '1');
    } catch (e) { }
    const w = openDialog('<h2>The joke periodic table</h2><p>' + JOKES.length + ' new elements are now in the pool, every one rarer than Uranium. Find them on the joke table in your Collection.</p>' +
        '<p>Mixing is on: joke elements can chain with real ones into joke compounds. You can turn it off now, or any time in Settings.</p>' +
        '<div class="btn-row"><button class="primary" id="jokeKeep">Keep mixing on</button><button class="ghost" id="jokeOff">Turn mixing off</button></div>');
    w.querySelector('#jokeKeep').onclick = closeDialog;
    w.querySelector('#jokeOff').onclick = () => {
        jokeSetMix(false);
        closeDialog();
    };
}
setTimeout(jokeIntroCheck, 2500);
// what's new, shown once to returning players after an update that has notes
// notes for returning players, by version
const NEWS = {};
function newsCheck() {
    let last = null;
    try {
        last = localStorage.getItem('elementalVersion');
        localStorage.setItem('elementalVersion', APP_VERSION);
    } catch (e) { }
    if (last === APP_VERSION || !NEWS[APP_VERSION] || !totalRolls()) {
        return;
    }
    const show = () => {
        if (document.getElementById('dlg') || rolling || tutAt >= 0) {
            setTimeout(show, 1500);
            return;
        }
        const w = openDialog('<h2>What\'s new in ' + APP_VERSION + '</h2><ul>' + NEWS[APP_VERSION].map(x => '<li>' + x + '</li>').join('') + '</ul>' +
            '<div class="btn-row"><button class="primary" id="newsOk">Nice</button></div>');
        w.querySelector('#newsOk').onclick = closeDialog;
    };
    setTimeout(show, 3000);
}
setTimeout(newsCheck, 0);
// remember which settings groups are open
document.querySelectorAll('.set-group').forEach(d => {
    try {
        const v = localStorage.getItem('elementalGroup.' + d.dataset.group);
        if (v) {
            d.open = v === '1';
        }
    } catch (e) { }
    d.addEventListener('toggle', () => {
        try {
            localStorage.setItem('elementalGroup.' + d.dataset.group, d.open ? '1' : '0');
        } catch (e) { }
    });
});
