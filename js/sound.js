let toastTimer;
const EFFECT_DEFAULTS = {
    1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 12: true, 13: true
};
let rarityEffects = { ...EFFECT_DEFAULTS };
try {
    const stored = JSON.parse(localStorage.getItem('elementalRarityEffects') || 'null');
    if (stored && typeof stored === 'object') {
        rarityEffects = { ...EFFECT_DEFAULTS, ...stored };
    }
} catch (e) { }
function syncEffectSettings() {
    document.querySelectorAll('[data-effect-tier]').forEach(input => {
        input.checked = rarityEffects[input.dataset.effectTier] !== false;
    });
}
document.querySelectorAll('[data-effect-tier]').forEach(input => input.addEventListener('change', () => {
    rarityEffects[input.dataset.effectTier] = input.checked;
    try {
        localStorage.setItem('elementalRarityEffects', JSON.stringify(rarityEffects));
    } catch (e) { }
}));
const $ = id => document.getElementById(id);
const INITIAL_RESULT = $('rollResults').innerHTML;
let audioContext = null;
let tickTimer = null;
let tickIndex = 0;
const soundTierDefaults = {
    1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 12: true, 13: true
};
let soundTiers = { ...soundTierDefaults };
try {
    const saved = JSON.parse(localStorage.getItem('elementalSoundTiers') || 'null');
    if (saved && typeof saved === 'object') {
        soundTiers = { ...soundTierDefaults, ...saved };
    }
} catch (e) { }
try {
    $('audioEnabled').checked = localStorage.getItem('elementalAudioEnabled') !== 'false';
} catch (e) { }
function prepareAudio() {
    if (!$('audioEnabled').checked) {
        return null;
    }
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) {
            return null;
        }
        if (!audioContext) {
            audioContext = new Ctx();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        return audioContext;
    } catch (e) {
        return null;
    }
}
function tone(freq, when, duration, volume, type = 'sine', endFreq = null) {
    const ctx = prepareAudio();
    if (!ctx) {
        return;
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), when + duration);
    }
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), when + Math.min(0.018, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(when);
    osc.stop(when + duration + 0.03);
}
function startRollTicks() {
    stopRollTicks();
    if (!$('audioEnabled').checked) {
        return;
    }
    tickIndex = 0;
    prepareAudio();
    tickTimer = setInterval(() => {
        const ctx = prepareAudio();
        if (!ctx) {
            return;
        }
        const now = ctx.currentTime;
        const pitch = [1450, 1180, 1320, 1550][tickIndex++ % 4];
        tone(pitch, now, 0.035, 0.012, 'triangle', pitch * 0.72);
    }, 115);
}
function stopRollTicks() {
    if (tickTimer) {
        clearInterval(tickTimer);
        tickTimer = null;
    }
}
// tiers by score, from 10,000 up to tier 13 at a billion
const TIER_SCORES = [10000, 30000, 100000, 250000, 500000, 1000000, 1500000, 3000000, 12000000, 30000000, 100000000, 300000000, 1000000000];
function getRarityTier(score) {
    let t = 0;
    TIER_SCORES.forEach((min, i) => {
        if (score >= min) {
            t = i + 1;
        }
    });
    return t;
}
function getSfxBus(ctx) {
    if (ctx._bus) {
        return ctx._bus;
    }
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 20;
    comp.ratio.value = 6;
    comp.attack.value = 0.004;
    comp.release.value = 0.25;
    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(comp);
    comp.connect(ctx.destination);
    const length = Math.floor(ctx.sampleRate * 3.2);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
        const d = impulse.getChannelData(c);
        for (let i = 0; i < length; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.6);
        }
    }
    const conv = ctx.createConvolver();
    conv.buffer = impulse;
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    conv.connect(wet);
    wet.connect(master);
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = Math.random() * 2 - 1;
    }
    return ctx._bus = { master, conv, nb: noiseBuffer };
}
function routeOut(ctx, node, wet) {
    const bus = getSfxBus(ctx);
    node.connect(bus.master);
    if (wet > 0) {
        const send = ctx.createGain();
        send.gain.value = wet;
        node.connect(send);
        send.connect(bus.conv);
    }
}
function playTone(ctx, freq, when, duration, volume, type = 'sine', endFreq = null, wet = 0.3, detune = 0, attack = 0.02) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.detune.value = detune;
    osc.frequency.setValueAtTime(freq, when);
    if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), when + duration);
    }
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), when + Math.min(attack, duration * 0.4));
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain);
    routeOut(ctx, gain, wet);
    osc.start(when);
    osc.stop(when + duration + 0.05);
}
function playNoise(ctx, when, duration, volume, startFreq, endFreq, type = 'lowpass', resonance = 1, wet = 0.2, attack = 0.01) {
    const bus = getSfxBus(ctx);
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = bus.nb;
    source.loop = true;
    filter.type = type;
    filter.Q.value = resonance;
    filter.frequency.setValueAtTime(startFreq, when);
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), when + duration);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), when + Math.min(attack, duration * 0.4));
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    source.connect(filter);
    filter.connect(gain);
    routeOut(ctx, gain, wet);
    source.start(when, Math.random() * 2);
    source.stop(when + duration + 0.05);
}
function boom(ctx, when, volume, length = 1.4) {
    playTone(ctx, 110, when, length, volume, 'sine', 26, 0.25, 0, 0.006);
    playTone(ctx, 55, when, length * 1.2, volume * 0.8, 'sine', 22, 0.2, 0, 0.006);
    playNoise(ctx, when, length * 0.5, volume * 0.9, 900, 60, 'lowpass', 0.8, 0.35, 0.004);
}
function riser(ctx, when, duration, volume, startFreq, endFreq) {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc2.detune.value = 14;
    filter.type = 'lowpass';
    filter.Q.value = 3;
    osc.frequency.setValueAtTime(startFreq, when);
    osc.frequency.exponentialRampToValueAtTime(endFreq, when + duration);
    osc2.frequency.setValueAtTime(startFreq * 1.005, when);
    osc2.frequency.exponentialRampToValueAtTime(endFreq * 1.005, when + duration);
    filter.frequency.setValueAtTime(startFreq * 2, when);
    filter.frequency.exponentialRampToValueAtTime(endFreq * 5, when + duration);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(volume, when + duration * 0.96);
    gain.gain.linearRampToValueAtTime(0, when + duration);
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    routeOut(ctx, gain, 0.25);
    osc.start(when);
    osc2.start(when);
    osc.stop(when + duration + 0.05);
    osc2.stop(when + duration + 0.05);
    playNoise(ctx, when, duration, volume * 0.7, 500, 9000, 'bandpass', 2, 0.3, duration * 0.8);
}
function padChord(ctx, when, notes, duration, volume, type = 'sawtooth', cutoff = 2400) {
    notes.forEach(n => [-9, 0, 9].forEach(d => {
        const o = ctx.createOscillator();
        const f = ctx.createBiquadFilter();
        const g = ctx.createGain();
        o.type = type;
        o.detune.value = d;
        o.frequency.value = n;
        f.type = 'lowpass';
        f.frequency.setValueAtTime(300, when);
        f.frequency.exponentialRampToValueAtTime(cutoff, when + duration * 0.3);
        f.frequency.exponentialRampToValueAtTime(400, when + duration);
        g.gain.setValueAtTime(0.0001, when);
        g.gain.exponentialRampToValueAtTime(volume, when + 0.12);
        g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
        o.connect(f);
        f.connect(g);
        routeOut(ctx, g, 0.45);
        o.start(when);
        o.stop(when + duration + 0.05);
    }));
}
function sparkle(ctx, when, count, span, volume, scale) {
    const base = scale || [1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093, 2349.32, 2637.02, 3135.96];
    for (let i = 0; i < count; i++) {
        const t = when + Math.random() * span;
        const f = base[Math.random() * base.length | 0];
        playTone(ctx, f, t, 0.5 + Math.random() * 0.7, volume * (0.5 + Math.random() * 0.7), 'sine', null, 0.6, 0, 0.004);
    }
}
function arp(ctx, when, notes, step, volume, type = 'triangle') {
    notes.forEach((f, i) => playTone(ctx, f, when + i * step, 0.7, volume, type, null, 0.45, 0, 0.008));
}
// secret (dark) sounds: no chimes, nothing in tune
// breaking glass: a hard crack, then a spray of inharmonic shards and falling debris
function glassBreak(ctx, when, vol, size) {
    playNoise(ctx, when, 0.08, vol * 1.4, 12000, 3000, 'highpass', 0.8, 0.3, 0.001);
    playNoise(ctx, when, 0.35, vol * 0.8, 6000, 900, 'bandpass', 1.5, 0.4, 0.002);
    const n = Math.round(18 * size);
    for (let i = 0; i < n; i++) {
        const t = when + Math.pow(Math.random(), 1.8) * (0.25 + size * 0.5);
        const f = 2200 + Math.random() * 7000;
        playTone(ctx, f, t, 0.05 + Math.random() * 0.2, vol * (0.12 + Math.random() * 0.25), Math.random() < 0.5 ? 'triangle' : 'sine', f * (0.9 + Math.random() * 0.15), 0.5, 0, 0.001);
    }
    for (let i = 0; i < n; i++) {
        playNoise(ctx, when + 0.1 + Math.random() * (0.6 + size), 0.02 + Math.random() * 0.05, vol * (0.15 + Math.random() * 0.3), 5000 + Math.random() * 6000, 2500, 'highpass', 1.5, 0.35, 0.001);
    }
}
// a slow, out-of-tune drone of detuned saws behind a dark filter
function dread(ctx, when, notes, dur, vol, cutoff) {
    notes.forEach(f => [-23, 0, 17].forEach(d => {
        const o = ctx.createOscillator();
        const fl = ctx.createBiquadFilter();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.value = f;
        o.detune.value = d;
        fl.type = 'lowpass';
        fl.Q.value = 4;
        fl.frequency.setValueAtTime(cutoff * 0.3, when);
        fl.frequency.exponentialRampToValueAtTime(cutoff, when + dur * 0.4);
        fl.frequency.exponentialRampToValueAtTime(cutoff * 0.25, when + dur);
        g.gain.setValueAtTime(0.0001, when);
        g.gain.exponentialRampToValueAtTime(vol, when + Math.min(0.6, dur * 0.3));
        g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
        o.connect(fl);
        fl.connect(g);
        routeOut(ctx, g, 0.5);
        o.start(when);
        o.stop(when + dur + 0.05);
    }));
}
// noise that swells up and is cut dead (like a reversed cymbal)
function swellCut(ctx, when, dur, vol, lo, hi) {
    const bus = getSfxBus(ctx);
    const s = ctx.createBufferSource();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    s.buffer = bus.nb;
    s.loop = true;
    f.type = 'bandpass';
    f.Q.value = 1.2;
    f.frequency.setValueAtTime(lo, when);
    f.frequency.exponentialRampToValueAtTime(hi, when + dur);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + dur);
    g.gain.setValueAtTime(0, when + dur + 0.005);
    s.connect(f);
    f.connect(g);
    g.connect(bus.master);
    s.start(when, Math.random() * 2);
    s.stop(when + dur + 0.05);
}
// a heavy, dull double heartbeat
function heartbeat(ctx, when, vol) {
    playTone(ctx, 62, when, 0.32, vol, 'sine', 34, 0.15, 0, 0.004);
    playNoise(ctx, when, 0.12, vol * 0.5, 300, 60, 'lowpass', 1, 0.1, 0.003);
    playTone(ctx, 54, when + 0.2, 0.38, vol * 0.8, 'sine', 30, 0.15, 0, 0.004);
}
// metal dragged across metal
function scrape(ctx, when, dur, vol, from, to) {
    playNoise(ctx, when, dur, vol, from, to, 'bandpass', 14, 0.45, dur * 0.3);
    playTone(ctx, from * 0.5, when, dur, vol * 0.15, 'sawtooth', to * 0.5, 0.4, 31, dur * 0.3);
}
// an inharmonic toll, like a cracked bell
function toll(ctx, when, f, vol, dur) {
    [1, 2.31, 2.76, 4.07, 5.43].forEach((r, i) => playTone(ctx, f * r, when, dur * (1 - i * 0.12), vol / (1 + i * 0.7), 'sine', f * r * 0.985, 0.7, 0, 0.003));
}
function darkSound(ctx, start, tier) {
    const S = start;
    if (tier === 5) {
        boom(ctx, S, 0.45, 1.6);
        glassBreak(ctx, S + 0.06, 0.09, 0.8);
        dread(ctx, S, [65.41, 69.3, 92.5], 3.6, 0.018, 700);
        playTone(ctx, 220, S + 0.25, 2.8, 0.03, 'sawtooth', 98, 0.5, 0, 0.3);
        playTone(ctx, 233.08, S + 0.25, 2.8, 0.025, 'sawtooth', 103.8, 0.5, 0, 0.3);
        for (let i = 0; i < 10; i++) {
            playNoise(ctx, S + Math.random() * 1.1, 0.03, 0.07, 3000, 800, 'bandpass', 3, 0.1, 0.001);
        }
        toll(ctx, S + 0.4, 98, 0.035, 3);
    } else if (tier === 6) {
        playTone(ctx, 40, S, 0.25, 0.0002, 'sine');
        const R = S + 0.15;
        boom(ctx, R, 0.7, 2.2);
        boom(ctx, R + 0.03, 0.4, 1.6);
        glassBreak(ctx, R, 0.13, 1.4);
        playTone(ctx, 90, R, 3.2, 0.12, 'sine', 24, 0.3, 0, 0.01);
        dread(ctx, R, [55, 58.27, 77.78, 82.41], 4.6, 0.016, 900);
        scrape(ctx, R + 0.4, 2.6, 0.08, 3200, 400);
        toll(ctx, R + 0.2, 73.4, 0.05, 4);
    } else if (tier === 7) {
        boom(ctx, S, 0.5, 1.2);
        glassBreak(ctx, S, 0.08, 0.7);
        const R = S + 0.34;
        boom(ctx, R, 0.75, 2.2);
        glassBreak(ctx, R, 0.13, 1.5);
        for (let i = 0; i < 26; i++) {
            const t = R + 0.05 + Math.random() * 1.5;
            playTone(ctx, 80 + Math.random() * 1400, t, 0.03 + Math.random() * 0.06, 0.03, 'square', null, 0.05, 0, 0.001);
        }
        for (let i = 0; i < 14; i++) {
            playNoise(ctx, R + Math.random() * 1.6, 0.04, 0.09, 8000, 2000, 'highpass', 1, 0.05, 0.001);
        }
        dread(ctx, R, [61.74, 65.41, 87.31, 92.5], 5, 0.016, 1100);
        playTone(ctx, 466, R + 0.2, 4, 0.025, 'sawtooth', 58, 0.5, 0, 0.5);
        playTone(ctx, 440, R + 0.2, 4, 0.025, 'sawtooth', 55, 0.5, 0, 0.5);
        swellCut(ctx, S + 0.8, 1.1, 0.12, 400, 7000);
        boom(ctx, S + 1.9, 0.55, 1.8);
        toll(ctx, S + 1.9, 61.7, 0.05, 4);
    } else if (tier === 8) {
        const v = 2.4;
        const hb = RARITY_DARK[8].hb;
        hb.forEach((ms, i) => heartbeat(ctx, S + ms / 1000, 0.18 + i * 0.05));
        dread(ctx, S, [49, 51.91, 69.3], v + 0.6, 0.014, 600);
        playTone(ctx, 900, S, v, 0.025, 'sawtooth', 60, 0.4, 0, v * 0.7);
        playTone(ctx, 950, S, v, 0.02, 'sawtooth', 63, 0.4, 0, v * 0.7);
        swellCut(ctx, S + v - 1.2, 1.4, 0.2, 300, 9000);
        const R = S + v + 0.2;
        boom(ctx, R, 1, 3.2);
        boom(ctx, R + 0.03, 0.7, 2.4);
        glassBreak(ctx, R, 0.18, 2.2);
        playTone(ctx, 80, R, 4, 0.16, 'sine', 20, 0.3, 0, 0.01);
        dread(ctx, R, [36.71, 38.89, 51.91, 55, 77.78, 155.56], 6, 0.016, 1400);
        scrape(ctx, R + 0.3, 3.4, 0.1, 4500, 300);
        toll(ctx, R + 0.5, 55, 0.07, 5);
        boom(ctx, R + 2.8, 0.4, 2.4);
    } else if (tier === 9) {
        const v = 4.32;
        const hb = RARITY_DARK[9].hb;
        hb.forEach((ms, i) => heartbeat(ctx, S + ms / 1000, 0.16 + i * 0.035));
        dread(ctx, S, [41.2, 43.65, 58.27], v + 0.4, 0.012, 500);
        dread(ctx, S + 1.5, [82.41, 87.31, 116.54], v - 1.1, 0.01, 1200);
        for (let i = 0; i < 3; i++) {
            playNoise(ctx, S + 0.5 + i * 1.2, 1.4, 0.05, 300 + i * 120, 900 + i * 200, 'bandpass', 9, 0.6, 0.6);
        }
        playTone(ctx, 1200, S + 0.8, v - 0.8, 0.018, 'sawtooth', 70, 0.4, 0, v * 0.6);
        playTone(ctx, 1290, S + 0.8, v - 0.8, 0.016, 'sawtooth', 74, 0.4, 0, v * 0.6);
        swellCut(ctx, S + v - 1.8, 1.8, 0.24, 200, 11000);
        const R = S + v;
        boom(ctx, R, 1, 4);
        boom(ctx, R + 0.03, 0.8, 3.2);
        boom(ctx, R + 0.4, 0.6, 2.6);
        glassBreak(ctx, R, 0.22, 3);
        for (let i = 0; i < 40; i++) {
            const t = R + 0.65 + Math.random() * 1.8;
            const f = 1500 + Math.random() * 6000;
            playTone(ctx, f, t, 0.06 + Math.random() * 0.15, 0.03 + Math.random() * 0.04, 'triangle', f * 0.8, 0.5, 0, 0.001);
        }
        playTone(ctx, 70, R, 5, 0.2, 'sine', 18, 0.3, 0, 0.01);
        dread(ctx, R + 0.9, [32.7, 34.65, 46.25, 98, 138.59, 293.66, 415.3], 7, 0.014, 1800);
        scrape(ctx, R + 0.9, 4, 0.12, 6000, 250);
        toll(ctx, R + 1, 41.2, 0.09, 6);
        toll(ctx, R + 4.2, 38.9, 0.06, 5);
        boom(ctx, R + 4.2, 0.45, 3);
    } else if (tier === 10) {
        // failed supernova
        const v = 3.6;
        RARITY_DARK[10].hb.forEach((ms, i) => {
            heartbeat(ctx, S + ms / 1000, 0.16 + i * 0.03);
            playTone(ctx, 233.08 + i * 41, S + ms / 1000, 0.5, 0.02, 'sawtooth', 220 + i * 33, 0.4, 0, 0.01);
        });
        dread(ctx, S, [46.25, 49, 65.41], v + 0.4, 0.014, 600);
        playTone(ctx, 60, S, v, 0.1, 'sine', 140, 0.3, 0, v * 0.7);
        swellCut(ctx, S + v - 1.5, 1.5, 0.24, 9000, 200);
        const R = S + v + 0.3;
        glassBreak(ctx, R, 0.2, 2.6);
        boom(ctx, R, 0.7, 2.4);
        playTone(ctx, 300, R, 3, 0.05, 'sawtooth', 30, 0.4, 0, 0.02);
        playTone(ctx, 318, R, 3, 0.045, 'sawtooth', 31, 0.4, 0, 0.02);
        dread(ctx, R + 0.4, [34.65, 36.71, 48.99, 103.83, 146.83, 207.65], 6.5, 0.014, 1500);
        scrape(ctx, R + 0.6, 3.6, 0.12, 5200, 260);
        toll(ctx, R + 0.8, 46.25, 0.08, 6);
        toll(ctx, R + 3.8, 43.65, 0.06, 5);
    } else if (tier === 11) {
        // black hole, wrong page
        const v = 4.6;
        playTone(ctx, 700, S, v, 0.035, 'sawtooth', 28, 0.4, 0, v * 0.3);
        playTone(ctx, 742, S, v, 0.03, 'sawtooth', 29, 0.4, 0, v * 0.3);
        RARITY_DARK[11].hb.forEach((ms, i) => heartbeat(ctx, S + ms / 1000, 0.14 + i * 0.03));
        dread(ctx, S, [36.71, 38.89, 51.91], v + 1.8, 0.013, 500);
        for (let i = 0; i < 70; i++) {
            playNoise(ctx, S + v + Math.random() * 1.6, 0.01 + Math.random() * 0.03, 0.04 + Math.random() * 0.06, 2000 + Math.random() * 8000, 800, 'bandpass', 2, 0.1, 0.001);
        }
        const R = S + v + 1.75;
        boom(ctx, R, 0.85, 3);
        glassBreak(ctx, R, 0.16, 2.2);
        playTone(ctx, 466.16, R, 4.5, 0.03, 'sawtooth', 440, 0.5, 0, 0.02);
        playTone(ctx, 493.88, R, 4.5, 0.03, 'sawtooth', 466.16, 0.5, 0, 0.02);
        playTone(ctx, 311.13, R, 4.5, 0.03, 'sawtooth', 293.66, 0.5, 0, 0.02);
        dread(ctx, R + 0.3, [32.7, 34.65, 46.25, 92.5, 138.59, 185], 6, 0.014, 1400);
        toll(ctx, R + 0.4, 38.89, 0.08, 6);
        scrape(ctx, R + 1.4, 3, 0.1, 3800, 300);
    } else if (tier === 12) {
        // heat death
        const v = 5.6;
        RARITY_DARK[12].hb.forEach((ms, i, a) => {
            heartbeat(ctx, S + ms / 1000, 0.22 - i * 0.03);
            playTone(ctx, 220 - i * 26, S + ms / 1000, 1.4, 0.02, 'triangle', 200 - i * 26, 0.6, 0, 0.05);
        });
        playTone(ctx, 130.81, S, v, 0.05, 'sawtooth', 32, 0.5, 0, 1);
        playNoise(ctx, S, v, 0.06, 1200, 90, 'lowpass', 2, 0.5, v * 0.3);
        toll(ctx, S + v - 0.4, 32.7, 0.1, 6);
        const R = S + v + 1.5;
        dread(ctx, R + 0.5, [41.2, 43.65, 61.74, 87.31, 116.54], 6, 0.01, 900);
        for (let i = 0; i < 16; i++) {
            playNoise(ctx, R + Math.random() * 5, 0.04, 0.03, 2400, 600, 'bandpass', 3, 0.1, 0.002);
        }
        playTone(ctx, 1046.5, R + 2.5, 4, 0.012, 'sine', 1040, 0.9, 0, 1.2);
    } else if (tier === 13) {
        // big crunch
        const v = 6.4;
        RARITY_DARK[13].hb.forEach((ms, i) => {
            heartbeat(ctx, S + ms / 1000, 0.16 + i * 0.03);
            playTone(ctx, 330 - i * 34, S + ms / 1000, 0.9, 0.018, 'sawtooth', 300 - i * 34, 0.5, 0, 0.02);
        });
        playTone(ctx, 1200, S, v, 0.03, 'sawtooth', 30, 0.4, 0, v * 0.4);
        playTone(ctx, 1260, S, v, 0.025, 'sawtooth', 31, 0.4, 0, v * 0.4);
        playNoise(ctx, S, v, 0.1, 3000, 60, 'lowpass', 3, 0.5, v * 0.5);
        dread(ctx, S + 1, [32.7, 34.65, 46.25], v - 1, 0.012, 600);
        // the red point
        playTone(ctx, 1760, S + v - 0.4, 2, 0.01, 'sine', 1750, 0.9, 0, 0.3);
        heartbeat(ctx, S + v + 0.9, 0.3);
        const R = S + v + 1.8;
        boom(ctx, R, 1, 4.5);
        glassBreak(ctx, R, 0.22, 3);
        glassBreak(ctx, R + 0.25, 0.12, 2);
        playNoise(ctx, R, 2.6, 0.3, 9000, 200, 'highpass', 0.7, 0.5, 0.003);
        playTone(ctx, 440, R, 5, 0.03, 'sawtooth', 415.3, 0.5, 0, 0.02);
        playTone(ctx, 466.16, R, 5, 0.03, 'sawtooth', 440, 0.5, 0, 0.02);
        dread(ctx, R + 0.3, [30.87, 32.7, 43.65, 87.31, 130.81, 174.61], 7, 0.015, 1500);
        toll(ctx, R + 0.5, 36.71, 0.09, 7);
        scrape(ctx, R + 1.2, 3.6, 0.1, 4200, 220);
        toll(ctx, R + 4, 34.65, 0.06, 6);
    }
}
function bigSound(ctx, start, tier) {
    if (tier === 6) {
        boom(ctx, start, 0.55, 1.6);
        playNoise(ctx, start, 1.4, 0.1, 200, 7000, 'highpass', 0.7, 0.4, 0.5);
        padChord(ctx, start + 0.05, [196, 293.66, 392, 587.33, 783.99], 2.8, 0.012, 'sawtooth', 2600);
        arp(ctx, start + 0.15, [392, 493.88, 587.33, 783.99, 987.77, 1174.66, 1567.98, 1975.53], 0.075, 0.05);
        sparkle(ctx, start + 0.7, 16, 1.8, 0.025);
        playNoise(ctx, start, 4.6, 0.05, 500, 180, 'lowpass', 0.8, 0.2, 0.4);
        for (let i = 0; i < 34; i++) {
            playNoise(ctx, start + 0.2 + Math.random() * 4.2, 0.03 + Math.random() * 0.05, 0.05 + Math.random() * 0.06, 4000 + Math.random() * 5000, 900, 'highpass', 1, 0.2, 0.002);
        }
        [1567.98, 2349.32].forEach((f, i) => playTone(ctx, f, start + 0.9 + i * 0.12, 2.2, 0.03, 'sine', null, 0.7));
    } else if (tier === 7) {
        boom(ctx, start, 0.65, 1.8);
        boom(ctx, start + 0.34, 0.5, 1.4);
        playNoise(ctx, start, 1.3, 0.12, 7000, 150, 'bandpass', 3, 0.3, 0.02);
        for (let i = 0; i < 9; i++) {
            playTone(ctx, [440, 311, 622, 233, 880, 349, 740, 277, 555][i], start + 0.45 + i * 0.055, 0.045, 0.035, 'square', null, 0.1, 0, 0.002);
        }
        playTone(ctx, 880, start, 2.4, 0.03, 'sawtooth', 110, 0.4, 25, 0.01);
        playTone(ctx, 622.25, start, 2.4, 0.022, 'sawtooth', 77.8, 0.4, -25, 0.01);
        padChord(ctx, start + 0.9, [146.83, 220, 261.63, 329.63, 440], 3.4, 0.012, 'sawtooth', 1900);
        arp(ctx, start + 1.0, [293.66, 349.23, 440, 523.25, 659.25, 880, 1046.5], 0.1, 0.04, 'sawtooth');
        sparkle(ctx, start + 1.2, 16, 2.2, 0.022, [1174.66, 1396.91, 1760, 2093]);
        for (let i = 0; i < 6; i++) {
            playNoise(ctx, start + 0.05 + i * 0.1, 0.07, 0.08, 9000, 3000, 'highpass', 2, 0.2, 0.001);
        }
        playNoise(ctx, start + 1.5, 1.0, 0.16, 13000, 2500, 'highpass', 1, 0.5, 0.002);
        sparkle(ctx, start + 1.5, 26, 2.4, 0.03, [2093, 2637.02, 3135.96, 3951, 4186]);
    } else if (tier === 8) {
        const v = 2.4;
        playTone(ctx, 140, start, v, 0.14, 'sine', 24, 0.3, 0, 0.4);
        playTone(ctx, 70, start, v, 0.12, 'sine', 18, 0.3, 0, 0.4);
        playNoise(ctx, start, v, 0.14, 320, 70, 'lowpass', 2, 0.3, 0.6);
        riser(ctx, start + 0.1, v - 0.1, 0.06, 90, 1400);
        [0.5, 1.05, 1.5, 1.85, 2.1].forEach((d, i) => boom(ctx, start + d, 0.1 + i * 0.05, 0.5));
        const R = start + v;
        boom(ctx, R, 0.95, 3);
        boom(ctx, R + 0.02, 0.6, 2);
        playNoise(ctx, R, 2.2, 0.3, 9000, 300, 'highpass', 0.7, 0.5, 0.003);
        padChord(ctx, R, [130.81, 196, 261.63, 392, 523.25, 783.99], 5, 0.014, 'sawtooth', 3200);
        arp(ctx, R + 0.05, [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093], 0.07, 0.055);
        [1046.5, 1318.51, 1567.98, 2093, 2637.02].forEach((f, i) => playTone(ctx, f, R + 0.1 + i * 0.1, 3.4, 0.035, 'sine', null, 0.8, 3, 0.01));
        sparkle(ctx, R + 0.3, 30, 3.2, 0.03);
    } else if (tier === 9) {
        const v = 4.2;
        [0, 0.9, 1.7, 2.4, 3, 3.5, 3.9].forEach((d, i) => {
            boom(ctx, start + d, 0.16 + i * 0.04, 0.7);
            boom(ctx, start + d + 0.16, 0.1 + i * 0.03, 0.5);
        });
        riser(ctx, start, v, 0.075, 70, 3200);
        playNoise(ctx, start + 0.5, v - 0.5, 0.12, 200, 10000, 'bandpass', 4, 0.4, v * 0.7);
        playTone(ctx, 60, start, v, 0.1, 'sine', 200, 0.3, 0, 1);
        const R = start + v + 0.12;
        boom(ctx, R, 1, 4);
        boom(ctx, R + 0.03, 0.8, 3.2);
        boom(ctx, R + 0.45, 0.6, 2.4);
        playNoise(ctx, R, 3, 0.38, 12000, 200, 'highpass', 0.7, 0.6, 0.003);
        padChord(ctx, R, [65.41, 130.81, 196, 261.63, 329.63, 392, 523.25, 659.25, 783.99], 7, 0.012, 'sawtooth', 4200);
        padChord(ctx, R + 0.3, [1046.5, 1318.51, 1567.98, 2093], 6, 0.01, 'triangle', 6000);
        arp(ctx, R + 0.05, [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093, 2637.02, 3135.96], 0.06, 0.06);
        arp(ctx, R + 1.0, [392, 523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093, 2637.02, 3135.96, 4186], 0.08, 0.045, 'sine');
        sparkle(ctx, R + 0.2, 60, 5.5, 0.035, [1046.5, 1318.51, 1567.98, 2093, 2637.02, 3135.96, 4186]);
        [2093, 3135.96, 4186].forEach((f, i) => playTone(ctx, f, R + 0.8 + i * 0.3, 5, 0.03, 'sine', f * 1.01, 0.9, 0, 0.05));
        playTone(ctx, 98, R + 3.2, 4, 0.07, 'sine', 49, 0.5, 0, 0.5);
        for (let i = 0; i < 9; i++) {
            playNoise(ctx, R + 0.05 + i * 0.09, 0.07, 0.08, 9000, 3000, 'highpass', 2, 0.2, 0.001);
        }
        playNoise(ctx, R + 1.7, 1.2, 0.2, 14000, 2500, 'highpass', 1, 0.6, 0.002);
        sparkle(ctx, R + 1.7, 36, 3, 0.03, [2093, 2637.02, 3135.96, 3951, 4186]);
        for (let i = 0; i < 40; i++) {
            playNoise(ctx, R + 0.3 + Math.random() * 5, 0.03 + Math.random() * 0.05, 0.04 + Math.random() * 0.05, 4000 + Math.random() * 5000, 900, 'highpass', 1, 0.2, 0.002);
        }
    } else if (tier === 10) {
        // supernova
        const v = 3.6;
        RARITY_FX[10].hb.forEach((ms, i) => {
            boom(ctx, start + ms / 1000, 0.14 + i * 0.05, 0.7);
            playTone(ctx, 220 + i * 60, start + ms / 1000, 0.5, 0.02 + i * 0.006, 'sine', 330 + i * 80, 0.6, 0, 0.01);
        });
        riser(ctx, start, v, 0.08, 60, 4200);
        playTone(ctx, 40, start, v, 0.14, 'sine', 160, 0.3, 0, v * 0.8);
        playNoise(ctx, start + 1, v - 1, 0.1, 300, 9000, 'bandpass', 3, 0.4, v * 0.6);
        const R = start + v;
        boom(ctx, R, 1, 4.5);
        boom(ctx, R + 0.03, 0.85, 3.6);
        boom(ctx, R + 0.5, 0.6, 3);
        playNoise(ctx, R, 3.4, 0.4, 13000, 160, 'highpass', 0.7, 0.6, 0.003);
        padChord(ctx, R, [73.42, 146.83, 220, 293.66, 369.99, 440, 587.33, 739.99, 880], 7.5, 0.013, 'sawtooth', 4600);
        padChord(ctx, R + 0.4, [1174.66, 1479.98, 1760, 2349.32], 6.5, 0.011, 'triangle', 7000);
        arp(ctx, R + 0.05, [293.66, 369.99, 440, 587.33, 739.99, 880, 1174.66, 1479.98, 1760, 2349.32, 2959.96], 0.055, 0.06);
        sparkle(ctx, R + 0.3, 70, 6, 0.034, [1174.66, 1479.98, 1760, 2349.32, 2959.96, 3520, 4698.63]);
        [2349.32, 2959.96, 3520].forEach((f, i) => playTone(ctx, f, R + 1 + i * 0.35, 5.5, 0.028, 'sine', f * 1.012, 0.9, 0, 0.05));
        playTone(ctx, 55, R + 2.5, 5, 0.09, 'sine', 36, 0.5, 0, 0.8);
    } else if (tier === 11) {
        // black hole into white hole
        const v = 4.6;
        playTone(ctx, 880, start, v, 0.035, 'sawtooth', 34, 0.4, 0, v * 0.3);
        playTone(ctx, 830, start, v, 0.03, 'sawtooth', 32, 0.4, 0, v * 0.3);
        playTone(ctx, 32, start, v + 0.3, 0.16, 'sine', 28, 0.3, 0, 1.5);
        RARITY_FX[11].hb.forEach((ms, i) => boom(ctx, start + ms / 1000, 0.12 + i * 0.05, 0.9));
        playNoise(ctx, start, v, 0.12, 2000, 80, 'lowpass', 3, 0.5, v * 0.5);
        swellCut(ctx, start + v - 1.6, 1.6, 0.26, 200, 12000);
        const R = start + v + 0.05;
        boom(ctx, R, 1, 4.6);
        boom(ctx, R + 0.03, 0.9, 3.8);
        boom(ctx, R + 0.45, 0.65, 3.2);
        playNoise(ctx, R, 3.6, 0.42, 14000, 150, 'highpass', 0.7, 0.6, 0.003);
        padChord(ctx, R, [82.41, 164.81, 246.94, 329.63, 415.3, 493.88, 659.25, 830.61, 987.77], 8, 0.013, 'sawtooth', 5000);
        padChord(ctx, R + 0.3, [1318.51, 1661.22, 1975.53, 2637.02], 7, 0.011, 'triangle', 7400);
        arp(ctx, R + 0.05, [329.63, 415.3, 493.88, 659.25, 830.61, 987.77, 1318.51, 1661.22, 1975.53, 2637.02, 3322.44], 0.05, 0.06);
        arp(ctx, R + 0.9, [3322.44, 2637.02, 1975.53, 1661.22, 1318.51, 987.77, 830.61, 659.25], 0.07, 0.04, 'sine');
        sparkle(ctx, R + 0.2, 80, 6.4, 0.034, [1318.51, 1661.22, 1975.53, 2637.02, 3322.44, 3951, 5274]);
        [2637.02, 3322.44, 3951].forEach((f, i) => playTone(ctx, f, R + 1.2 + i * 0.4, 6, 0.028, 'sine', f * 0.99, 0.9, 0, 0.05));
        playTone(ctx, 41.2, R + 3, 5, 0.09, 'sine', 30, 0.5, 0, 0.8);
    } else if (tier === 12) {
        // big bang
        const v = 5.6;
        RARITY_FX[12].hb.forEach((ms, i, a) => {
            const k = (i + 1) / a.length;
            const t = start + ms / 1000;
            playTone(ctx, 3520 - i * 330, t, 0.9 + k, 0.012 + k * 0.03, 'sine', null, 0.9, 0, 0.003);
            playTone(ctx, 55 * (1 + k), t, 0.6, 0.04 * k, 'sine', 40, 0.5, 0, 0.01);
        });
        riser(ctx, start + 2.6, v - 2.9, 0.07, 80, 5200);
        const R = start + v + 0.15;
        boom(ctx, R, 1, 5.5);
        boom(ctx, R + 0.03, 1, 4.6);
        boom(ctx, R + 0.4, 0.75, 3.8);
        boom(ctx, R + 1.1, 0.5, 3);
        playNoise(ctx, R, 4.4, 0.45, 15000, 120, 'highpass', 0.7, 0.7, 0.002);
        padChord(ctx, R, [32.7, 65.41, 98, 130.81, 196, 261.63, 293.66, 392, 523.25, 587.33, 783.99, 1046.5], 10, 0.012, 'sawtooth', 5600);
        padChord(ctx, R + 0.5, [1046.5, 1174.66, 1567.98, 2093, 2349.32, 3135.96], 9, 0.011, 'triangle', 8000);
        arp(ctx, R + 0.05, [261.63, 293.66, 392, 523.25, 587.33, 783.99, 1046.5, 1174.66, 1567.98, 2093, 2349.32, 3135.96, 4186], 0.05, 0.065);
        arp(ctx, R + 1.4, [392, 523.25, 587.33, 783.99, 1046.5, 1174.66, 1567.98, 2093, 2349.32, 3135.96, 4186, 4698.63], 0.075, 0.05, 'sine');
        sparkle(ctx, R + 0.2, 100, 8.5, 0.036, [1046.5, 1174.66, 1567.98, 2093, 2349.32, 3135.96, 4186, 4698.63]);
        [1567.98, 2093, 3135.96, 4186].forEach((f, i) => playTone(ctx, f, R + 2.4 + i * 0.5, 7, 0.03, 'sine', f * 1.006, 0.9, 0, 0.08));
        toll(ctx, R + 3.4, 261.63, 0.05, 6);
        playTone(ctx, 65.41, R + 4, 6, 0.08, 'sine', 49, 0.5, 0, 1);
    } else if (tier === 13) {
        // multiverse, each bang a key higher
        const v = 6.4;
        RARITY_FX[13].hb.forEach((ms, i, a) => {
            const k = (i + 1) / a.length;
            const t = start + ms / 1000;
            boom(ctx, t, 0.1 + k * 0.2, 0.6);
            playTone(ctx, 220 * Math.pow(2, i / 6), t, 0.5, 0.015 + k * 0.02, 'triangle', 330 * Math.pow(2, i / 6), 0.6, 0, 0.01);
        });
        riser(ctx, start, v, 0.08, 50, 6000);
        playTone(ctx, 30, start, v, 0.14, 'sine', 200, 0.3, 0, v * 0.7);
        swellCut(ctx, start + v - 1.8, 1.8, 0.28, 200, 14000);
        [[0, [32.7, 65.41, 98, 130.81, 196, 261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5], 1], [2.6, [36.71, 73.42, 110, 146.83, 220, 293.66, 369.99, 440, 587.33, 739.99, 880, 1174.66], 0.7], [4.6, [41.2, 82.41, 123.47, 164.81, 246.94, 329.63, 415.3, 493.88, 659.25, 830.61, 987.77, 1318.51], 0.55]].forEach(([d, ch, k]) => {
            const R = start + v + 0.15 + d;
            boom(ctx, R, k, 5);
            boom(ctx, R + 0.03, k * 0.9, 4.2);
            playNoise(ctx, R, 3.6, 0.45 * k, 15000, 120, 'highpass', 0.7, 0.7, 0.002);
            padChord(ctx, R, ch, 9 - d, 0.012, 'sawtooth', 6000);
            padChord(ctx, R + 0.4, ch.slice(-5).map(f => f * 2), 8 - d, 0.01, 'triangle', 9000);
            arp(ctx, R + 0.05, ch.slice(4).map(f => f * 2), 0.05, 0.06 * k);
            sparkle(ctx, R + 0.2, Math.round(80 * k), 6, 0.034, ch.slice(-6).map(f => f * 4));
        });
        const E = start + v + 0.15;
        arp(ctx, E + 1.4, [4186, 3520, 2637.02, 2093, 1760, 1318.51, 1046.5, 880, 659.25], 0.08, 0.045, 'sine');
        [2093, 2637.02, 3135.96, 4186, 5274].forEach((f, i) => playTone(ctx, f, E + 2 + i * 0.6, 8, 0.026, 'sine', f * 1.006, 0.9, 0, 0.08));
        toll(ctx, E + 6, 329.63, 0.05, 6);
        playTone(ctx, 41.2, E + 6.5, 6, 0.09, 'sine', 30, 0.5, 0, 1);
    }
}
function playBuildup(tier, seconds) {
    if (tier < 6 || !$('audioEnabled').checked || soundTiers[tier] === false) {
        return;
    }
    const ctx = prepareAudio();
    if (!ctx) {
        return;
    }
    const t = ctx.currentTime;
    const d = Math.max(1.2, seconds);
    const skin = effectSkin();
    if (skin) {
        skinBuildup(skin, ctx, t, d, tier);
        return;
    }
    riser(ctx, t, d, 0.02 + (tier - 6) * 0.012, 100 + (tier - 6) * 18, 700 + (tier - 6) * 200);
    if (tier >= 8) {
        playTone(ctx, 55, t, d, 0.05, 'sine', 90, 0.3, 0, d * 0.6);
    }
}
function playResultChime(score, dark) {
    stopRollTicks();
    if (!$('audioEnabled').checked) {
        return;
    }
    const tier = getRarityTier(score);
    if (tier > 0 && soundTiers[tier] === false) {
        const ctx = prepareAudio();
        if (ctx) {
            const t = ctx.currentTime;
            tone(880, t, 0.42, 0.035, 'sine');
            tone(1174.66, t + 0.09, 0.58, 0.022, 'sine');
        }
        return;
    }
    const ctx = prepareAudio();
    if (!ctx) {
        return;
    }
    const t = ctx.currentTime;
    if (dark && tier >= 5) {
        darkSound(ctx, t, tier);
        return;
    }
    const skin = tier > 0 && effectSkin();
    if (skin === 'retro') {
        retroSound(ctx, t, tier);
        return;
    }
    if (skin === 'astral') {
        astralSound(ctx, t, tier);
        return;
    }
    if (tier >= 6) {
        bigSound(ctx, t, tier);
        return;
    }
    const patterns = {
        0: [[783.99, 0, 0.42, 0.035, 'sine'], [1046.5, 0.1, 0.58, 0.023, 'sine']],
        1: [[880, 0, 0.48, 0.04, 'sine'], [1174.66, 0.09, 0.6, 0.028, 'sine'], [1567.98, 0.17, 0.68, 0.018, 'sine']],
        2: [
            [659.25, 0, 0.6, 0.045, 'triangle'], [987.77, 0.09, 0.68, 0.035, 'sine'], [1318.51, 0.18, 0.8, 0.028, 'sine'], [1760, 0.28, 0.9, 0.018, 'sine']
        ],
        3: [
            [523.25, 0, 0.8, 0.05, 'triangle'], [783.99, 0.08, 0.85, 0.04, 'sine'], [1046.5, 0.17, 0.95, 0.035, 'sine'], [1567.98, 0.27, 1.05, 0.026, 'sine'], [2093, 0.39, 1.1, 0.018, 'sine']
        ],
        4: [
            [392, 0, 1, 0.055, 'triangle'], [587.33, 0.08, 1.05, 0.045, 'sine'], [783.99, 0.16, 1.1, 0.04, 'sine'], [1174.66, 0.25, 1.2, 0.035, 'sine'], [1567.98, 0.35, 1.25, 0.03, 'sine'], [2349.32, 0.48, 1.35, 0.022, 'sine']
        ],
        5: [
            [261.63, 0, 1.2, 0.06, 'triangle'], [392, 0.08, 1.25, 0.05, 'sine'], [523.25, 0.16, 1.3, 0.045, 'sine'], [783.99, 0.25, 1.4, 0.04, 'sine'], [1046.5, 0.36, 1.5, 0.035, 'sine'], [1567.98, 0.48, 1.6, 0.03, 'sine'], [2093, 0.62, 1.7, 0.024, 'sine'], [2637.02, 0.78, 1.8, 0.016, 'sine']
        ]
    };
    (patterns[tier] || patterns[0]).forEach(([f, offset, dur, vol, type]) => tone(f, t + offset, dur, vol, type));
    if (tier >= 3) {
        tone(110, t, 0.45, 0.018, 'sine', 55);
    }
}
$('audioEnabled').addEventListener('change', () => {
    try {
        localStorage.setItem('elementalAudioEnabled', $('audioEnabled').checked ? 'true' : 'false');
    } catch (e) { }
    if (!$('audioEnabled').checked) {
        stopRollTicks();
    }
});
document.querySelectorAll('[data-sound-tier]').forEach(input => {
    input.checked = soundTiers[input.dataset.soundTier] !== false;
    input.addEventListener('change', () => {
        soundTiers[input.dataset.soundTier] = input.checked;
        try {
            localStorage.setItem('elementalSoundTiers', JSON.stringify(soundTiers));
        } catch (e) { }
    });
});
// ui sounds
let uiSounds = true;
try {
    uiSounds = localStorage.getItem('elementalUiSounds') !== '0';
} catch (e) { }
$('uiSoundSet').checked = uiSounds;
$('uiSoundSet').onchange = () => {
    uiSounds = $('uiSoundSet').checked;
    try {
        localStorage.setItem('elementalUiSounds', uiSounds ? '1' : '0');
    } catch (e) { }
};
let uiLast = 0;
function uiSound(kind) {
    // only after the first tap
    if (!uiSounds || !audioContext || audioContext.state !== 'running' || !$('audioEnabled').checked) {
        return;
    }
    const t = audioContext.currentTime;
    if (kind === 'hover') {
        if (t - uiLast < 0.05) {
            return;
        }
        tone(2600, t, 0.025, 0.004, 'sine');
    } else if (kind === 'click') {
        tone(950, t, 0.05, 0.012, 'triangle', 620);
    } else if (kind === 'bond') {
        tone(660, t, 0.14, 0.02, 'triangle');
        tone(990, t + 0.06, 0.2, 0.016, 'triangle');
    } else if (kind === 'deny') {
        tone(220, t, 0.12, 0.016, 'triangle', 180);
    }
    uiLast = t;
}
let uiHover = null;
document.addEventListener('pointerover', e => {
    const b = e.pointerType === 'mouse' && e.target.closest('button:not(:disabled), .nav-row, a');
    if (b && b !== uiHover) {
        uiSound('hover');
    }
    uiHover = b || null;
});
document.addEventListener('click', e => {
    if (e.target.closest('button:not(:disabled), .nav-row') && !e.target.closest('#rollBtn')) {
        uiSound('click');
    }
}, true);
