const TAU = Math.PI * 2;
const CUTSCENES = {};
const clamp = (x, min = 0, max = 1) => Math.min(max, Math.max(min, x));
const smoothstep = (edge0, edge1, x) => {
    x = clamp((x - edge0) / (edge1 - edge0));
    return x * x * (3 - 2 * x);
};
const easeOutCubic = x => 1 - Math.pow(1 - clamp(x), 3);
const CUTSCENE_FONT = 'Bahnschrift,"DIN Alternate","Arial Narrow",Arial,sans-serif';
const seededRandom = seed => () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
function drawGlow(ctx, x, y, radius, color, alpha) {
    if (calmFx) {
        alpha = Math.min(alpha, 0.5);
    }
    if (alpha <= 0.003 || radius <= 0) {
        return;
    }
    const q = ctx.createRadialGradient(x, y, 0, x, y, radius);
    q.addColorStop(0, color);
    q.addColorStop(1, color + '00');
    ctx.globalAlpha = clamp(alpha);
    ctx.fillStyle = q;
    ctx.fillRect(x - radius, y - radius, 2 * radius, 2 * radius);
    ctx.globalAlpha = 1;
}
function drawText(ctx, text, x, y, size, color, alpha, weight = 700, spacing = 0) {
    if (alpha <= 0.003) {
        return;
    }
    ctx.save();
    ctx.globalAlpha = clamp(alpha);
    ctx.fillStyle = color;
    ctx.font = weight + ' ' + size + 'px ' + CUTSCENE_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if ('letterSpacing' in ctx) {
        ctx.letterSpacing = spacing + 'px';
    }
    ctx.fillText(text, x, y);
    ctx.restore();
}
function drawCard(ctx, scene, time, start, color, color2) {
    scene.cardStart = start;
    scene.cardColor = color;
    scene.cardColor2 = color2;
    const a = smoothstep(start, start + 900, time);
    const u = scene.unit;
    const W = scene.width;
    const H = scene.height;
    if (!a) {
        return;
    }
    drawGlow(ctx, W / 2, H / 2, 60 * u, color2, 0.4 * a);
    if (!scene.domText) {
        drawText(ctx, scene.sym, W / 2, H / 2 - 2 * u, 26 * u * (0.92 + 0.08 * a), color, a, 800);
    }
    drawText(ctx, scene.name.toUpperCase(), W / 2, H / 2 + 17 * u, 3.6 * u, '#fff', a * 0.9, 600, 0.9 * u);
    drawText(ctx, scene.label || (scene.atomicNumber ? 'ELEMENT ' + scene.atomicNumber : 'JOKE ELEMENT'), W / 2, H / 2 - 24 * u, 2.2 * u, color, a * 0.85, 600, 0.6 * u);
}
// Picks the rarest roll that contains an element with its own cutscene.
function pickCutscene(rolls) {
    let best = null;
    rolls.forEach((r, i) => {
        const hit = r.elements.filter(e => CUTSCENES[e[0]]).sort((a, b) => b[2] - a[2])[0];
        if (hit && (!best || r.log < best.log)) {
            best = { sym: hit[0], log: r.log, idx: i };
        }
    });
    return best;
}
function playCutscene(sym, reel, forms, idx, syms) {
    return new Promise(resolve => {
        const cutscene = CUTSCENES[sym];
        const VW = innerWidth;
        const VH = innerHeight;
        const margin = 38;
        const frameWidth = Math.max(200, VW - 2 * margin);
        const frameHeight = Math.max(200, VH - 2 * margin);
        let dpr = lowDetail ? 1 : Math.min(2, devicePixelRatio || 1);
        const fc = {};
        const r = reel.getBoundingClientRect();
        const overlay = document.createElement('div');
        const veil = document.createElement('div');
        const box = document.createElement('div');
        const canvas = document.createElement('canvas');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:14';
        veil.style.cssText = 'position:absolute;inset:0;background:var(--bench);opacity:0';
        box.className = 'reel';
        box.style.position = 'fixed';
        box.style.margin = '0';
        canvas.width = frameWidth * dpr;
        canvas.height = frameHeight * dpr;
        canvas.style.cssText = 'position:absolute;inset:auto;left:50%;top:50%;width:' + frameWidth + 'px;height:' + frameHeight + 'px;transform:translate(-50%,-50%)';
        box.appendChild(canvas);
        overlay.appendChild(veil);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        // hide the real roll box while its expanding copy plays, so there aren't two
        reel.style.visibility = 'hidden';
        const N = syms.length;
        const cs = getComputedStyle(syms[0]);
        const fam = cs.fontFamily;
        const m = document.createElement('canvas').getContext('2d');
        const u = Math.min(frameWidth, frameHeight) / 100;
        let fsA = syms.map(() => parseFloat(cs.fontSize) || 80);
        if (N > 1) {
            const base = Math.min(parseFloat(cs.fontSize) || 80, 84);
            m.font = '700 ' + base + 'px ' + fam;
            fsA = forms.map(l => {
                const room = reel.clientWidth / N - 24;
                const tw = m.measureText(l).width;
                return tw > room ? base * room / tw : base;
            });
            syms.forEach((e, i) => e.style.fontSize = fsA[i] + 'px');
        }
        const fx = syms.map(e => {
            const q = e.getBoundingClientRect();
            return [(q.left + q.width / 2 - r.left) / r.width, (q.top + q.height / 2 - r.top) / r.height];
        });
        m.font = '700 100px ' + fam;
        const fsC = Math.min(26 * u, 0.8 * frameWidth / (m.measureText(forms[idx]).width / 100));
        const D = [(fx[idx][0] - 0.5) * r.width, (fx[idx][1] - 0.5) * r.height];
        const RC = [238, 243, 239];
        const YC = [240, 196, 25];
        const rgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
        const mix = (a, b, k) => a.map((v, i) => Math.round(b[i] + (v - b[i]) * k)).join(',');
        const L = forms.map(f => {
            const d = document.createElement('div');
            d.textContent = f;
            const q = d.style;
            q.position = 'fixed';
            q.left = q.top = '0';
            q.whiteSpace = 'nowrap';
            q.pointerEvents = 'none';
            q.lineHeight = '1';
            q.fontFamily = fam;
            q.fontWeight = cs.fontWeight;
            q.opacity = '0';
            q.transform = 'translate(-50%,-50%)';
            overlay.appendChild(d);
            return d;
        });
        const R = [r.left, r.top, r.width, r.height];
        const F = [margin, margin, frameWidth, frameHeight];
        const ctx = canvas.getContext('2d');
        const scene = {
            sym, name: elementBySymbol[sym][1], atomicNumber: cutscene.z, label: cutscene.label, width: frameWidth, height: frameHeight, unit: u, state: {}, domText: true
        };
        const growMs = 2600;
        const fadeMs = 900;
        const duration = cutscene.dur;
        const t0 = performance.now();
        const c = prepareAudio();
        if (c) {
            try {
                cutscene.snd(c, c.currentTime + 0.05);
            } catch (e) { }
        }
        let lastK = -1;
        let lastA = -1;
        (function f(now) {
            const el = Math.max(0, now - t0);
            if (el >= duration + fadeMs) {
                reel.style.visibility = '';
                overlay.remove();
                resolve();
                return;
            }
            const k = el < duration ? smoothstep(0, 1, el / growMs) : 1 - smoothstep(0, 1, (el - duration) / fadeMs);
            const tt = Math.min(el, duration);
            const a = smoothstep(scene.cardStart || 1e9, (scene.cardStart || 1e9) + 900, tt);
            // box only moves while growing or fading
            const moved = k !== lastK || a !== lastA;
            lastK = k;
            lastA = a;
            const bl = R[0] + (F[0] - R[0]) * k;
            const bt = R[1] + (F[1] - R[1]) * k;
            const bw = R[2] + (F[2] - R[2]) * k;
            const bh = R[3] + (F[3] - R[3]) * k;
            if (moved) {
                box.style.left = bl + 'px';
                box.style.top = bt + 'px';
                box.style.width = bw + 'px';
                box.style.height = bh + 'px';
                veil.style.opacity = k;
                canvas.style.opacity = el < duration ? 1 : smoothstep(0, 0.55, k);
            }
            if (frameCheck(fc, now)) {
                dpr = 1;
                canvas.width = frameWidth;
                canvas.height = frameHeight;
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, frameWidth, frameHeight);
            cutscene.draw(ctx, scene, tt, duration);
            if (!moved) {
                requestAnimationFrame(f);
                return;
            }
            const th = scene.cardColor ? rgb(scene.cardColor) : RC;
            const th2 = scene.cardColor2 ? rgb(scene.cardColor2) : YC;
            L.forEach((d, i) => {
                const q = d.style;
                if (i === idx) {
                    q.left = bl + bw / 2 + D[0] * (1 - k) + 'px';
                    q.top = bt + bh / 2 + (D[1] + (-2 * u - D[1]) * k) + 'px';
                    q.fontSize = fsA[i] + (fsC - fsA[i]) * k + 'px';
                    q.color = 'rgb(' + mix(th, RC, k) + ')';
                    q.textShadow = '0 0 ' + (24 + 36 * k) + 'px rgba(' + mix(th2, YC, k) + ',' + (0.25 + 0.3 * k) + ')';
                    q.opacity = a;
                } else {
                    q.left = bl + fx[i][0] * bw + 'px';
                    q.top = bt + fx[i][1] * bh + 'px';
                    q.fontSize = fsA[i] + 'px';
                    q.color = 'rgb(' + RC + ')';
                    q.textShadow = '0 0 24px rgba(240,196,25,.25)';
                    q.opacity = 1 - smoothstep(0.15, 0.7, k);
                }
            });
            requestAnimationFrame(f);
        })(t0);
    });
}
// U: a neutron starts a fission chain reaction in a reactor core
CUTSCENES.U = {
    z: 92, dur: 10500,
    snd(audio, start) {
        padChord(audio, start, [55, 82.4, 110], 7.4, 0.012, 'sine', 600);
        for (let x = 0.2; x < 7.2;) {
            playNoise(audio, start + x, 0.012, 0.045, 3800, 2000, 'highpass', 1, 0.12, 0.001);
            x += Math.max(0.03, 0.5 * Math.pow(1 - x / 7.6, 2) * (0.4 + Math.random()));
        }
        playTone(audio, 2200, start + 2.6, 0.8, 0.02, 'sine', 200, 0.4);
        [3.4, 4.3, 5.4].forEach(x => boom(audio, start + x, 0.07, 0.9));
        riser(audio, start + 4.6, 2.7, 0.035, 120, 1400);
        boom(audio, start + 7.35, 0.24, 2.4);
        padChord(audio, start + 7.6, [130.8, 196, 261.6, 392], 3, 0.022, 'sine', 2600);
        sparkle(audio, start + 7.8, 9, 2.2, 0.018);
    },
    draw(ctx, scene, time) {
        const width = scene.width;
        const height = scene.height;
        const unit = scene.unit;
        const cx = width / 2;
        const cy = height / 2;
        const state = scene.state;
        if (!state.n) {
            state.n = [[0, 0, 3400, -1]];
            for (let i = 0; i < 4; i++) {
                const a = i * 1.571 + 0.5;
                state.n.push([Math.cos(a) * 20 * unit, Math.sin(a) * 16 * unit, 4300 + i * 140, 0]);
            }
            for (let j = 0; j < 8; j++) {
                const a = j * 0.785 + 0.2;
                state.n.push([Math.cos(a) * 38 * unit, Math.sin(a) * 29 * unit, 5400 + j * 110, 1 + (j >> 1)]);
            }
            const r = seededRandom(92);
            state.p = Array.from({ length: 70 }, () => [r() * width, r() * height, r() * 3 + 1, r()]);
        }
        const w = smoothstep(0, 3000, time);
        const f = smoothstep(6600, 7400, time) * (1 - smoothstep(7400, 8300, time));
        ctx.fillStyle = '#02060c';
        ctx.fillRect(0, 0, width, height);
        drawGlow(ctx, cx, height * 1.05, Math.max(width, height) * 0.85, '#1d63ff', 0.5 * w + 0.25 * smoothstep(3400, 6800, time));
        for (let i = 0; i < 9; i++) {
            const x = width * (0.1 + i * 0.1);
            const h = height * (0.4 + 0.1 * Math.sin(i * 2.1)) * easeOutCubic(w);
            ctx.fillStyle = 'rgba(70,150,255,' + (0.22 + 0.12 * Math.sin(time / 260 + i)) + ')';
            ctx.fillRect(x - 0.5 * unit, height - h, unit, h);
        }
        state.p.forEach(p => {
            const y = ((p[1] - time * p[2] * 0.03) % height + height) % height;
            ctx.fillStyle = 'rgba(150,205,255,' + 0.45 * p[3] * w + ')';
            ctx.beginPath();
            ctx.arc(p[0], y, p[3] * 1.8, 0, TAU);
            ctx.fill();
        });
        let done = 0;
        state.n.forEach(([x, y, ft, par]) => {
            const X = cx + x;
            const Y = cy + y;
            const d = time - ft;
            if (par < 0) {
                const p = smoothstep(2500, 3400, time);
                if (p > 0 && p < 1) {
                    drawNeutron(ctx, cx - (1 - p) * width * 0.6, cy, unit);
                }
            } else {
                const q = state.n[par];
                const p = (time - ft + 520) / 520;
                if (p > 0 && p < 1) {
                    drawNeutron(ctx, cx + q[0] + (x - q[0]) * p, cy + q[1] + (y - q[1]) * p, unit);
                }
            }
            if (d < 0) {
                for (let k = 0; k < 7; k++) {
                    const a = k * 0.9 + time / 500;
                    const r = k ? 2.2 * unit : 0;
                    ctx.fillStyle = k % 2 ? '#c8ff6a' : '#7dffb0';
                    ctx.beginPath();
                    ctx.arc(X + Math.cos(a) * r, Y + Math.sin(a) * r, 1.5 * unit, 0, TAU);
                    ctx.fill();
                }
                drawGlow(ctx, X, Y, 7 * unit, '#9dff5a', 0.35);
            } else {
                done++;
                const m = easeOutCubic(d / 1400) * 9 * unit;
                const al = 1 - smoothstep(0, 2200, d);
                const ang = Math.atan2(y, x || 1) + 1.57;
                drawGlow(ctx, X, Y, 16 * unit, '#b8ff6a', (1 - clamp(d / 800)) * 0.9);
                ctx.strokeStyle = 'rgba(210,255,170,' + (1 - clamp(d / 700)) + ')';
                ctx.lineWidth = 0.5 * unit;
                ctx.beginPath();
                ctx.arc(X, Y, unit * 2 + d / 18, 0, TAU);
                ctx.stroke();
                [-1, 1].forEach(s => {
                    ctx.fillStyle = 'rgba(150,255,120,' + al + ')';
                    ctx.beginPath();
                    ctx.arc(X + Math.cos(ang) * m * s, Y + Math.sin(ang) * m * s, 3.2 * unit * (1 - 0.35 * clamp(d / 2200)), 0, TAU);
                    ctx.fill();
                });
            }
        });
        drawGlow(ctx, cx, cy, Math.max(width, height) * 0.9, '#eaffd2', f);
        drawText(ctx, 'FISSION EVENTS  ' + String(done).padStart(2, '0'), cx, height - 4 * unit, 2 * unit, '#8fd0ff', smoothstep(3000, 3600, time) * (1 - smoothstep(7000, 7600, time)), 600, 0.4 * unit);
        drawCard(ctx, scene, time, 8000, '#d6ff6e', '#2fe07a');
    }
};
function drawNeutron(ctx, x, y, unit) {
    drawGlow(ctx, x, y, 5 * unit, '#ffffff', 0.9);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, unit, 0, TAU);
    ctx.fill();
}
// Og: the table counts up to 118, a 119th cell fails, and the last cell floods the screen
CUTSCENES.Og = {
    z: 118, dur: 10000,
    snd(audio, start) {
        for (let i = 0; i < 118; i++) {
            playTone(audio, 420 + i * 7, start + 0.3 + Math.pow(i / 117, 1.6) * 5.6, 0.05, 0.016, 'square', null, 0.1, 0, 0.002);
        }
        playNoise(audio, start + 5.8, 0.3, 0.06, 500, 3500, 'bandpass', 4, 0.3);
        playTone(audio, 95, start + 6.15, 0.7, 0.05, 'sawtooth', 40, 0.1, 0, 0.01);
        playTone(audio, 58, start + 7, 3, 0.03, 'sine', null, 0.5, 0, 1.2);
        riser(audio, start + 6.9, 1.1, 0.03, 150, 900);
        padChord(audio, start + 7.9, [261.6, 392, 523.3, 784], 2.4, 0.022, 'sine', 3000);
        sparkle(audio, start + 8, 10, 1.8, 0.018);
    },
    draw(ctx, scene, time) {
        const width = scene.width;
        const height = scene.height;
        const cs = Math.min(width / 19.2, height / 11);
        const ox = (width - 18 * cs) / 2;
        const oy = (height - 10 * cs) / 2;
        const state = scene.state;
        if (!state.k) {
            state.k = ELEMENTS.map((e, i) => ({
                s: e[0], x: ox + (tableLayout[e[0]][1] - 1) * cs, y: oy + (tableLayout[e[0]][0] - 1) * cs, t: 300 + Math.pow(i / 117, 1.6) * 5600
            }));
        }
        ctx.fillStyle = '#07040f';
        ctx.fillRect(0, 0, width, height);
        const zoom = easeOutCubic((time - 6900) / 1800);
        const n = state.k.filter(k => time >= k.t).length;
        const og = state.k[117];
        const fade = 1 - smoothstep(6900, 8000, time);
        drawGlow(ctx, width / 2, height / 2, Math.max(width, height) * 0.7, '#3a1d86', 0.35 * smoothstep(0, 3000, time) * fade);
        state.k.forEach((k, i) => {
            const a = (time - k.t) / 1000;
            if (i === 117 && time > 6900) {
                return;
            }
            ctx.globalAlpha = fade;
            if (a >= 0) {
                const fl = Math.max(0, 1 - a * 3);
                ctx.fillStyle = 'rgba(' + (150 + 105 * fl | 0) + ',' + (110 + 120 * fl | 0) + ',255,' + (0.28 + 0.5 * fl + 0.12 * Math.sin(time / 220 + i)) + ')';
                ctx.fillRect(k.x + 0.04 * cs, k.y + 0.04 * cs, 0.92 * cs, 0.92 * cs);
                drawText(ctx, k.s, k.x + cs / 2, k.y + cs / 2, cs * 0.38, '#fff', 0.85, 600);
            } else {
                ctx.strokeStyle = 'rgba(190,170,255,.12)';
                ctx.strokeRect(k.x + 0.5, k.y + 0.5, cs - 1, cs - 1);
            }
            ctx.globalAlpha = 1;
        });
        drawText(ctx, String(n), ox + 7.5 * cs, oy + 1.45 * cs, cs * 2.1, '#d8c8ff', fade, 800);
        drawText(ctx, 'ELEMENTS', ox + 7.5 * cs, oy + 2.65 * cs, cs * 0.3, '#a58cff', fade * 0.8, 600, cs * 0.1);
        const ga = smoothstep(6000, 6150, time) * (1 - smoothstep(6600, 6900, time));
        if (ga > 0) {
            const jx = (Math.sin(time * 0.9) * 0.5) * cs * (time > 6400 ? 0.25 : 0.05);
            ctx.globalAlpha = ga * fade;
            ctx.strokeStyle = '#ff6b9a';
            ctx.setLineDash([cs * 0.12, cs * 0.1]);
            ctx.lineWidth = 2;
            ctx.strokeRect(ox + jx, oy + 7 * cs, cs, cs);
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
            drawText(ctx, '119?', ox + cs / 2 + jx, oy + 7.5 * cs, cs * 0.36, '#ff6b9a', ga * fade, 700);
        }
        if (time > 6900) {
            const X = og.x + cs / 2;
            const Y = og.y + cs / 2;
            const R = Math.max(width, height);
            const r = cs * 0.5 + easeOutCubic((time - 6900) / 1500) * R * 1.1;
            drawGlow(ctx, X + (width / 2 - X) * zoom, Y + (height / 2 - Y) * zoom, r, '#8a5cff', 0.95);
            drawGlow(ctx, X + (width / 2 - X) * zoom, Y + (height / 2 - Y) * zoom, r * 0.55, '#d8c4ff', 0.8);
            ctx.globalCompositeOperation = 'lighter';
            for (let k = 0; k < 9; k++) {
                ctx.strokeStyle = 'rgba(215,190,255,' + 0.35 * zoom + ')';
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                const a0 = k * 0.7 + time / 2600;
                for (let s = 0; s <= 24; s++) {
                    const q = s / 24;
                    const rr = q * R * 0.6 * zoom;
                    const aa = a0 + Math.sin(q * 9 + time / 160 + k) * 0.18;
                    const px = width / 2 + Math.cos(aa) * rr;
                    const py = height / 2 + Math.sin(aa) * rr;
                    s ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
                }
                ctx.stroke();
            }
            ctx.globalCompositeOperation = 'source-over';
        }
        drawCard(ctx, scene, time, 7800, '#efe6ff', '#8b5cff');
    }
};
// Ts: a heavy-ion accelerator fires calcium-48 at a berkelium target and the nuclei fuse
CUTSCENES.Ts = {
    z: 117, dur: 10000,
    snd(audio, start) {
        riser(audio, start + 0.2, 5.2, 0.03, 70, 950);
        for (let i = 0; i < 26; i++) {
            playNoise(audio, start + 2.6 + i * 0.12, 0.07, 0.03, 2400 + i * 160, 600, 'bandpass', 3, 0.2);
        }
        boom(audio, start + 5.5, 0.26, 2.4);
        playNoise(audio, start + 5.5, 1.6, 0.14, 7000, 200, 'lowpass', 0.7, 0.4);
        padChord(audio, start + 6.5, [220, 329.6, 440, 659.3], 3.2, 0.02, 'sawtooth', 1800);
        arp(audio, start + 7.1, [880, 1318, 1760, 2637], 0.17, 0.03);
    },
    draw(ctx, scene, time) {
        const width = scene.width;
        const height = scene.height;
        const unit = scene.unit;
        const state = scene.state;
        const y0 = height * 0.5;
        const xa = width * 0.2;
        const xt = width * 0.78;
        if (!state.i) {
            const r = seededRandom(117);
            state.i = Array.from({ length: 26 }, (_, i) => ({ l: 2600 + i * 55, j: (r() - 0.5) * 5 * unit, o: r() * 6.28 }));
            state.q = [];
            for (let a = 0; a < 5; a++) {
                for (let b = 0; b < 13; b++) {
                    state.q.push([xt + (a - 2) * 1.8 * unit, y0 + (b - 6) * 2.6 * unit + (a % 2) * 1.2 * unit]);
                }
            }
        }
        ctx.fillStyle = '#0a0705';
        ctx.fillRect(0, 0, width, height);
        const burst = smoothstep(5450, 5600, time) * (1 - smoothstep(5600, 7000, time));
        const post = time > 5500;
        drawGlow(ctx, width / 2, height * 1.1, width * 0.7, '#5a2a08', 0.55);
        ctx.fillStyle = '#2a1c12';
        ctx.fillRect(width * 0.06, y0 - 1.2 * unit, xt - width * 0.06, 2.4 * unit);
        const lit = smoothstep(2400, 3000, time) * (1 - smoothstep(5500, 5900, time));
        ctx.fillStyle = 'rgba(120,220,255,' + (0.15 + 0.5 * lit) + ')';
        ctx.fillRect(width * 0.06, y0 - 0.25 * unit, xt - width * 0.06, 0.5 * unit);
        for (let k = 0; k < 8; k++) {
            const x = width * 0.3 + k * width * 0.06;
            const p = 0.3 + 0.7 * Math.max(0, Math.sin(time / 180 - k * 0.9)) * lit;
            ctx.strokeStyle = 'rgba(255,170,70,' + (0.35 + 0.45 * p) + ')';
            ctx.lineWidth = 0.5 * unit;
            ctx.strokeRect(x - 1.3 * unit, y0 - 4 * unit, 2.6 * unit, 8 * unit);
        }
        ctx.strokeStyle = 'rgba(255,180,80,.35)';
        ctx.lineWidth = 0.4 * unit;
        ctx.beginPath();
        ctx.arc(xa - 6 * unit, y0, 13 * unit, 0, TAU);
        ctx.stroke();
        if (time < 2900) {
            state.i.forEach((s, i) => {
                const p = time / 2600;
                const a = s.o + p * p * 60 + i;
                const r = (3 + 10 * Math.min(1, p * 1.1)) * unit;
                drawGlow(ctx, xa - 6 * unit + Math.cos(a) * r, y0 + Math.sin(a) * r, 2.4 * unit, '#9be8ff', 0.9 * smoothstep(0, 500, time));
            });
        }
        state.i.forEach(s => {
            const p = clamp((time - s.l) / 2100);
            if (p <= 0 || p >= 1) {
                return;
            }
            const x = xa + (xt - xa) * Math.pow(p, 2.4);
            const y = y0 + s.j * (1 - p);
            ctx.strokeStyle = 'rgba(160,235,255,.7)';
            ctx.lineWidth = 0.45 * unit;
            ctx.beginPath();
            ctx.moveTo(x - (4 + 20 * p) * unit, y);
            ctx.lineTo(x, y);
            ctx.stroke();
            drawGlow(ctx, x, y, 2.4 * unit, '#d6f7ff', 1);
            if (p > 0.97) {
                drawGlow(ctx, xt, y, 6 * unit, '#ffd9a0', 0.7);
            }
        });
        state.q.forEach(([x, y], i) => {
            const sc = post ? easeOutCubic((time - 5500) / 1400) * (18 + i % 7 * 3) * unit : 0;
            const a = i * 2.4;
            ctx.fillStyle = 'rgba(255,150,50,' + (post ? 1 - smoothstep(5500, 6800, time) : 0.95) + ')';
            ctx.beginPath();
            ctx.arc(x + Math.cos(a) * sc, y + Math.sin(a) * sc, 0.85 * unit, 0, TAU);
            ctx.fill();
        });
        drawGlow(ctx, xt, y0, Math.max(width, height) * 0.9, '#fff2d8', burst);
        for (let k = 0; k < 3; k++) {
            const p = (time - 5500 - k * 180) / 1500;
            if (p > 0 && p < 1) {
                ctx.strokeStyle = 'rgba(255,200,120,' + (1 - p) + ')';
                ctx.lineWidth = unit;
                ctx.beginPath();
                ctx.arc(xt, y0, easeOutCubic(p) * 45 * unit, 0, TAU);
                ctx.stroke();
            }
        }
        if (time > 5700 && time < 7900) {
            const p = smoothstep(5700, 6600, time);
            const f = 1 - smoothstep(7300, 7900, time);
            const mv = xt + (width / 2 - xt) * smoothstep(6200, 7500, time);
            drawGlow(ctx, mv, y0, (8 + 14 * p) * unit, '#ffb04a', 0.95 * f);
            ctx.fillStyle = 'rgba(255,246,220,' + f + ')';
            ctx.beginPath();
            ctx.arc(mv + Math.sin(time / 60) * 0.5 * unit, y0, (1.5 + 2.5 * p) * unit, 0, TAU);
            ctx.fill();
        }
        drawText(ctx, '48Ca  +  249Bk', width * 0.5, height * 0.16, 3.2 * unit, '#ffc27a', smoothstep(500, 1200, time) * (1 - smoothstep(5400, 5700, time)), 600, 0.8 * unit);
        drawCard(ctx, scene, time, 7900, '#ffd9a0', '#ff8a1f');
    }
};
// Lv: the chart of nuclides drains away and the island of stability rises
CUTSCENES.Lv = {
    z: 116, dur: 10000,
    snd(audio, start) {
        padChord(audio, start, [98, 146.8, 196], 6.5, 0.016, 'sine', 900);
        for (let i = 0; i < 4; i++) {
            playTone(audio, 880, start + 1.2 + i * 1.3, 1.4, 0.012, 'sine', null, 0.8, 0, 0.01);
        }
        riser(audio, start + 3.6, 2.8, 0.025, 90, 700);
        playTone(audio, 196, start + 6.4, 2.6, 0.035, 'sine', null, 0.5, 0, 0.4);
        arp(audio, start + 6.5, [392, 587.3, 784, 1174.7, 1568], 0.16, 0.03, 'sine');
        padChord(audio, start + 7.2, [196, 293.7, 392, 587.3], 3, 0.02, 'sine', 2400);
        sparkle(audio, start + 7.6, 12, 2.2, 0.016);
    },
    draw(ctx, scene, time) {
        const width = scene.width;
        const height = scene.height;
        const unit = scene.unit;
        const x0 = width * 0.06;
        const y0 = height * 0.12;
        const gw = width * 0.88;
        const gh = height * 0.76;
        const cols = 60;
        const rows = 32;
        const cw = gw / cols;
        const ch = gh / rows;
        ctx.fillStyle = '#031018';
        ctx.fillRect(0, 0, width, height);
        const L = 1 - 0.86 * easeOutCubic((time - 1500) / 5200);
        const sw = smoothstep(0, 1200, time);
        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                const nx = i / cols;
                const ny = 1 - j / rows;
                const h = Math.exp(-(Math.pow((nx - 0.66) / 0.17, 2) + Math.pow((ny - 0.4) / 0.2, 2))) * (0.85 + 0.15 * Math.sin(nx * 40 + ny * 25)) + 0.05 * Math.sin(nx * 9 + ny * 7);
                const d = h - L;
                let r;
                let gg;
                let b;
                if (d > 0) {
                    const k = clamp(d * 1.8);
                    r = 190 + 60 * k;
                    gg = 150 + 70 * k;
                    b = 60 + 60 * k;
                } else {
                    const k = clamp(-d * 1.1);
                    const w2 = 0.5 + 0.5 * Math.sin(time / 420 + i * 0.5 + j * 0.3);
                    r = 8 + 10 * w2 * (1 - k);
                    gg = 50 + 70 * (1 - k) + 25 * w2;
                    b = 90 + 90 * (1 - k);
                }
                if (Math.abs(d) < 0.035) {
                    r = 210;
                    gg = 250;
                    b = 255;
                }
                ctx.fillStyle = 'rgb(' + (r | 0) + ',' + (gg | 0) + ',' + (b | 0) + ')';
                ctx.globalAlpha = sw * (0.35 + 0.5 * clamp(1 - Math.abs(d) * 1.2));
                ctx.fillRect(x0 + i * cw + cw * 0.1, y0 + j * ch + ch * 0.1, cw * 0.8, ch * 0.8);
            }
        }
        ctx.globalAlpha = 1;
        drawText(ctx, 'NEUTRON NUMBER  N', width / 2, y0 + gh + 3.4 * unit, 1.8 * unit, '#7fd7ff', sw * 0.8, 600, 0.5 * unit);
        ctx.save();
        ctx.translate(x0 - 2.6 * unit, height / 2);
        ctx.rotate(-1.5708);
        drawText(ctx, 'PROTON NUMBER  Z', 0, 0, 1.8 * unit, '#7fd7ff', sw * 0.8, 600, 0.5 * unit);
        ctx.restore();
        const mx = x0 + gw * 0.66;
        const my = y0 + gh * 0.6;
        for (let k = 0; k < 3; k++) {
            const p = (time - 5400 - k * 500) / 2200;
            if (p > 0 && p < 1) {
                ctx.strokeStyle = 'rgba(255,215,120,' + (1 - p) * 0.8 + ')';
                ctx.lineWidth = 0.5 * unit;
                ctx.beginPath();
                ctx.arc(mx, my, easeOutCubic(p) * 40 * unit, 0, TAU);
                ctx.stroke();
            }
        }
        const bp = smoothstep(5300, 5800, time);
        drawGlow(ctx, mx, my, 12 * unit, '#ffd36b', bp * 0.9 * (1 - smoothstep(7600, 8300, time)));
        ctx.strokeStyle = 'rgba(255,232,170,' + bp + ')';
        ctx.lineWidth = 0.35 * unit;
        ctx.beginPath();
        ctx.moveTo(mx - 5 * unit, my);
        ctx.lineTo(mx + 5 * unit, my);
        ctx.moveTo(mx, my - 5 * unit);
        ctx.lineTo(mx, my + 5 * unit);
        ctx.stroke();
        drawText(ctx, 'ISLAND OF STABILITY', mx, my - 9 * unit, 2.2 * unit, '#ffe6a0', bp * (1 - smoothstep(7400, 8000, time)), 700, 0.5 * unit);
        drawGlow(ctx, width / 2, height / 2, Math.max(width, height) * 0.55, '#021018', smoothstep(7300, 8000, time) * 0.85);
        drawCard(ctx, scene, time, 7900, '#ffe08a', '#ffb13b');
    }
};
// Mc: five alpha decays step down the chain from 288Mc to 268Db on a snowy Moscow night
CUTSCENES.Mc = {
    z: 115, dur: 10000,
    snd(audio, start) {
        const bell = (x, f, v) => [1, 2.76, 5.4, 8.1].forEach((r, i) => playTone(audio, f * r, start + x, 3.2 / (1 + i), v / (1 + i * 1.4), 'sine', null, 0.7, 0, 0.004));
        padChord(audio, start, [73.4, 110, 146.8], 8, 0.012, 'sine', 700);
        bell(0.9, 174.6, 0.08);
        for (let i = 0; i < 5; i++) {
            const x = 1.6 + i * 1.1;
            boom(audio, start + x, 0.05, 0.7);
            playTone(audio, 1500, start + x, 0.5, 0.018, 'sine', 420, 0.4);
            bell(x + 0.05, 196 + i * 22, 0.06);
        }
        riser(audio, start + 6.4, 1.2, 0.03, 100, 1000);
        boom(audio, start + 7.5, 0.22, 2.2);
        padChord(audio, start + 7.7, [146.8, 220, 293.7, 440], 3, 0.022, 'sine', 2400);
        sparkle(audio, start + 7.9, 10, 2, 0.017);
    },
    draw(ctx, scene, time) {
        const width = scene.width;
        const height = scene.height;
        const unit = scene.unit;
        const state = scene.state;
        const Z = [['Mc', 115, 288], ['Nh', 113, 284], ['Rg', 111, 280], ['Mt', 109, 276], ['Bh', 107, 272], ['Db', 105, 268]];
        const st = Math.min(width * 0.14, 17 * unit);
        const bx = i => width * 0.5 + (i - 2.5) * st;
        const by = i => height * 0.17 + i * Math.min(height * 0.115, 13 * unit);
        const bs = Math.min(width * 0.12, 12 * unit);
        const ev = i => 1500 + i * 1100;
        if (!state.f) {
            const r = seededRandom(115);
            state.f = Array.from({ length: 130 }, () => [r() * width, r() * height, r() * 1.6 + 0.6, r() * 6.28, r() * 0.5 + 0.5]);
        }
        const fa = 1 - smoothstep(7300, 8100, time);
        const gr = ctx.createLinearGradient(0, 0, 0, height);
        gr.addColorStop(0, '#10060e');
        gr.addColorStop(0.6, '#2a0a18');
        gr.addColorStop(1, '#5a1424');
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#14040b';
        [[0.18, 0.07, 0.1], [0.3, 0.05, 0.07], [0.5, 0.09, 0.14], [0.7, 0.05, 0.08], [0.82, 0.07, 0.12]].forEach(([x, w, h]) => {
            const X = width * x;
            const bw = width * w;
            const bh = height * h;
            ctx.fillRect(X - bw / 2, height - bh, bw, bh);
            ctx.beginPath();
            ctx.moveTo(X - bw * 0.6, height - bh);
            ctx.quadraticCurveTo(X - bw * 0.7, height - bh - bw * 0.9, X, height - bh - bw * 1.5);
            ctx.quadraticCurveTo(X + bw * 0.7, height - bh - bw * 0.9, X + bw * 0.6, height - bh);
            ctx.fill();
            ctx.fillRect(X - 0.15 * unit, height - bh - bw * 1.5 - 3 * unit, 0.3 * unit, 3 * unit);
        });
        state.f.forEach(([x, y, r, ph, sp]) => {
            const yy = (y + time * sp * 0.06) % height;
            const xx = x + Math.sin(time / 900 * sp + ph) * 2.5 * unit;
            ctx.fillStyle = 'rgba(235,245,255,' + (0.35 + 0.4 * sp) + ')';
            ctx.beginPath();
            ctx.arc(xx, yy, r * unit * 0.28, 0, TAU);
            ctx.fill();
        });
        drawText(ctx, 'ALPHA DECAY CHAIN', width / 2, height * 0.07, 2.2 * unit, '#ffb0b8', smoothstep(300, 1000, time) * fa, 600, 0.7 * unit);
        for (let i = 0; i < 6; i++) {
            const X = bx(i);
            const Y = by(i);
            const on = i === 0 ? smoothstep(0, 900, time) : smoothstep(ev(i - 1), ev(i - 1) + 300, time);
            const off = i < 5 ? smoothstep(ev(i), ev(i) + 700, time) : smoothstep(7000, 7300, time);
            const a = on * (1 - 0.6 * off) * fa;
            if (i > 0) {
                const p = smoothstep(ev(i - 1) - 100, ev(i - 1) + 350, time);
                ctx.strokeStyle = 'rgba(255,120,130,' + 0.7 * p * fa + ')';
                ctx.lineWidth = 0.5 * unit;
                ctx.beginPath();
                ctx.moveTo(bx(i - 1), by(i - 1));
                ctx.lineTo(bx(i - 1) + (X - bx(i - 1)) * p, by(i - 1) + (Y - by(i - 1)) * p);
                ctx.stroke();
            }
            drawGlow(ctx, X, Y, bs * 1.6, '#ff4d5e', a * (0.5 * (1 - off) + 0.15));
            ctx.fillStyle = 'rgba(40,8,18,' + 0.8 * a + ')';
            ctx.strokeStyle = 'rgba(255,140,150,' + a + ')';
            ctx.lineWidth = 0.4 * unit;
            ctx.fillRect(X - bs / 2, Y - bs / 2, bs, bs);
            ctx.strokeRect(X - bs / 2, Y - bs / 2, bs, bs);
            drawText(ctx, Z[i][0], X, Y + 0.5 * unit, bs * 0.42, '#fff', a, 700);
            drawText(ctx, String(Z[i][2]), X - bs * 0.3, Y - bs * 0.34, bs * 0.18, '#ffb0b8', a, 600);
            drawText(ctx, String(Z[i][1]), X - bs * 0.3, Y + bs * 0.36, bs * 0.18, '#ffb0b8', a, 600);
            if (i < 5) {
                const p = (time - ev(i)) / 1000;
                if (p > 0 && p < 1) {
                    const x = X + p * 34 * unit;
                    const y = Y - p * 24 * unit;
                    const al = 1 - p;
                    drawGlow(ctx, X, Y, 12 * unit, '#ffb0b8', (1 - clamp(p * 3)));
                    [[-1, -1, '#ff5a6a'], [1, -1, '#7aa8ff'], [-1, 1, '#7aa8ff'], [1, 1, '#ff5a6a']].forEach(([a, b, c]) => {
                        ctx.fillStyle = c;
                        ctx.globalAlpha = al;
                        ctx.beginPath();
                        ctx.arc(x + a * 0.8 * unit, y + b * 0.8 * unit, unit, 0, TAU);
                        ctx.fill();
                        ctx.globalAlpha = 1;
                    });
                    drawGlow(ctx, x, y, 5 * unit, '#ffd0d6', al * 0.6);
                }
            }
        }
        const rb = smoothstep(7300, 8000, time);
        drawGlow(ctx, width / 2, height / 2, Math.max(width, height) * 0.7, '#ff3d55', rb * 0.45 * (1 - smoothstep(8000, 9500, time) * 0.4));
        drawCard(ctx, scene, time, 7900, '#fff0f2', '#ff4d5e');
    }
};
// Fl: protons fill the nuclear shells one by one until 114 closes a shell
CUTSCENES.Fl = {
    z: 114, dur: 10000,
    snd(audio, start) {
        padChord(audio, start, [82.4, 123.5, 164.8], 7.4, 0.014, 'sine', 800);
        for (let i = 0; i < 38; i++) {
            const x = 0.5 + 5.6 * Math.pow(i / 37, 1.25);
            playTone(audio, 520 + i * 16, start + x, 0.07, 0.012, 'triangle', null, 0.3, 0, 0.002);
        }
        playNoise(audio, start + 6.15, 0.12, 0.05, 6000, 1500, 'highpass', 1, 0.3, 0.002);
        boom(audio, start + 6.2, 0.18, 2);
        playTone(audio, 329.6, start + 6.2, 3, 0.03, 'sine', null, 0.6, 0, 0.02);
        arp(audio, start + 6.4, [329.6, 415.3, 493.9, 659.3, 830.6, 987.8], 0.12, 0.028, 'sine');
        padChord(audio, start + 7.6, [164.8, 246.9, 329.6, 493.9], 3, 0.02, 'sine', 2600);
        sparkle(audio, start + 7.8, 10, 2, 0.016);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const st = scene.state;
        const cx = W / 2;
        const cy = H * 0.5;
        const shells = [2, 6, 12, 8, 22, 32, 32];
        const R = Math.min(W, H * 0.78) * 0.4;
        const rr = s => R * (0.16 + 0.84 * (s + 1) / shells.length);
        if (!st.p) {
            const r = seededRandom(114);
            st.p = [];
            let n = 0;
            shells.forEach((c, s) => {
                for (let k = 0; k < c; k++) {
                    st.p.push({ s, a: k / c * TAU + s * 0.7 + r() * 0.12, t: 500 + 5600 * Math.pow(n / 113, 1.25) });
                    n++;
                }
            });
            st.full = shells.map((c, s) => Math.max(...st.p.filter(p => p.s === s).map(p => p.t)));
        }
        const fa = 1 - smoothstep(7300, 8100, time);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.75);
        g.addColorStop(0, '#0b2a26');
        g.addColorStop(1, '#03100e');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        const close = smoothstep(6150, 6350, time);
        drawGlow(ctx, cx, cy, rr(0) * 2.2, '#2fe0b0', 0.25 + 0.6 * close * fa);
        shells.forEach((c, s) => {
            const full = time >= st.full[s];
            const fl = full ? 1 - smoothstep(st.full[s], st.full[s] + 700, time) : 0;
            ctx.strokeStyle = 'rgba(47,224,176,' + ((full ? 0.55 : 0.18) + 0.4 * fl + 0.4 * close) * fa + ')';
            ctx.lineWidth = (full ? 0.35 : 0.2) * u + fl * 0.6 * u;
            ctx.beginPath();
            ctx.arc(cx, cy, rr(s), 0, TAU);
            ctx.stroke();
        });
        let count = 0;
        st.p.forEach(p => {
            if (time < p.t) {
                return;
            }
            count++;
            const age = time - p.t;
            const spin = (0.00012 + 0.00005 * (shells.length - p.s)) * time * (p.s % 2 ? -1 : 1);
            const x = cx + Math.cos(p.a + spin) * rr(p.s);
            const y = cy + Math.sin(p.a + spin) * rr(p.s);
            const pop = 1 - smoothstep(0, 400, age);
            drawGlow(ctx, x, y, (1.6 + 3 * pop) * u, '#7dffd6', (0.35 + 0.6 * pop) * fa);
            ctx.fillStyle = 'rgba(232,255,248,' + fa + ')';
            ctx.beginPath();
            ctx.arc(x, y, 0.55 * u * (1 + pop), 0, TAU);
            ctx.fill();
        });
        const ring = clamp((time - 6200) / 1300);
        if (ring > 0 && ring < 1) {
            ctx.strokeStyle = 'rgba(160,255,225,' + (1 - ring) + ')';
            ctx.lineWidth = (1 - ring) * 1.5 * u;
            ctx.beginPath();
            ctx.arc(cx, cy, rr(shells.length - 1) * (1 + ring * 0.6), 0, TAU);
            ctx.stroke();
        }
        drawText(ctx, 'PROTONS', W / 2, H * 0.06, 2.1 * u, '#7dffd6', smoothstep(300, 900, time) * fa * (1 - close), 600, 0.7 * u);
        drawText(ctx, 'Z = ' + count, W / 2, H * 0.1, 3.6 * u, '#e8fff8', smoothstep(300, 900, time) * fa, 700);
        drawText(ctx, 'SHELL CLOSED', W / 2, H * 0.06, 2.1 * u, '#7dffd6', close * fa, 600, 0.7 * u);
        drawText(ctx, 'A PREDICTED MAGIC NUMBER', W / 2, H * 0.94, 2 * u, '#7dffd6', smoothstep(6400, 6900, time) * fa, 600, 0.5 * u);
        const rb = smoothstep(7300, 8000, time);
        drawGlow(ctx, W / 2, H / 2, Math.max(W, H) * 0.7, '#2fe0b0', rb * 0.4 * (1 - smoothstep(8000, 9500, time) * 0.4));
        drawCard(ctx, scene, time, 7900, '#e8fff8', '#2fe0b0');
    }
};
// Nh: nine years at RIKEN catch three atoms, then the sun rises over Japan
CUTSCENES.Nh = {
    z: 113, dur: 10000,
    snd(audio, start) {
        padChord(audio, start, [73.4, 110, 146.8], 6.6, 0.013, 'sine', 600);
        for (let i = 0; i < 10; i++) {
            playTone(audio, 1046.5, start + 0.6 + i * 0.6, 0.12, 0.008, 'sine', null, 0.4, 0, 0.003);
        }
        [1.58, 2.05, 5.98].forEach((x, i) => {
            playTone(audio, [880, 987.8, 1174.7][i], start + x, 2.2, 0.03, 'sine', null, 0.8, 0, 0.004);
            playTone(audio, [1760, 1975.5, 2349.3][i], start + x, 1.6, 0.012, 'sine', null, 0.8, 0, 0.004);
        });
        riser(audio, start + 6.2, 1.4, 0.02, 80, 700);
        padChord(audio, start + 6.9, [146.8, 220, 293.7, 440], 3.4, 0.022, 'sine', 2200);
        arp(audio, start + 7.2, [293.7, 329.6, 440, 587.3, 659.3, 880], 0.16, 0.026, 'triangle');
        sparkle(audio, start + 7.8, 8, 2, 0.015);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const st = scene.state;
        const hz = H * 0.66;
        if (!st.s) {
            const r = seededRandom(113);
            st.s = Array.from({ length: 110 }, () => [r() * W, r() * hz * 0.95, r() * 0.8 + 0.3, r() * 6.28]);
            st.w = Array.from({ length: 34 }, () => [r(), r() * (H - hz), r() * 0.6 + 0.2]);
        }
        const fa = 1 - smoothstep(7300, 8100, time);
        const dawn = smoothstep(5800, 7600, time);
        const mixc = (a, b, k) => 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',') + ')';
        const g = ctx.createLinearGradient(0, 0, 0, hz);
        g.addColorStop(0, mixc([4, 6, 18], [40, 18, 40], dawn));
        g.addColorStop(1, mixc([10, 16, 38], [232, 110, 80], dawn));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, hz);
        st.s.forEach(([x, y, r, ph]) => {
            const a = (0.45 + 0.35 * Math.sin(time / 500 + ph)) * (1 - dawn * 0.9);
            ctx.fillStyle = 'rgba(255,255,255,' + a + ')';
            ctx.beginPath();
            ctx.arc(x, y, r * u * 0.25, 0, TAU);
            ctx.fill();
        });
        // the sun rises
        const rise = smoothstep(6000, 7800, time);
        const sr = Math.min(W, H) * 0.17;
        const sy = hz + sr * 1.05 - rise * sr * 1.9;
        drawGlow(ctx, W / 2, sy, sr * 3.4, '#ff6a4a', 0.55 * rise);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, hz);
        ctx.clip();
        ctx.globalAlpha = 1 - 0.85 * smoothstep(7500, 8300, time);
        ctx.fillStyle = '#e8263a';
        ctx.beginPath();
        ctx.arc(W / 2, sy, sr, 0, TAU);
        ctx.fill();
        ctx.restore();
        // sea
        const sg = ctx.createLinearGradient(0, hz, 0, H);
        sg.addColorStop(0, mixc([8, 14, 30], [90, 40, 50], dawn));
        sg.addColorStop(1, mixc([2, 4, 10], [20, 10, 18], dawn));
        ctx.fillStyle = sg;
        ctx.fillRect(0, hz, W, H - hz);
        st.w.forEach(([x, y, l]) => {
            const yy = hz + y;
            const xx = ((x + time * 0.00002 * (1 + y / H)) % 1) * W;
            const near = Math.abs(xx - W / 2) < sr * (1.2 + y / (H - hz));
            ctx.fillStyle = near && rise > 0.05 ? 'rgba(255,120,90,' + 0.6 * rise + ')' : 'rgba(180,200,255,' + 0.12 * (1 - dawn * 0.5) + ')';
            ctx.fillRect(xx - l * 6 * u, yy, l * 12 * u, 0.25 * u);
        });
        // nine years, three atoms
        const yr = 2003.7 + 8.9 * clamp((time - 600) / 5600);
        const atoms = [[2004.55, 0.28, 0.24], [2005.3, 0.7, 0.18], [2012.6, 0.48, 0.32]];
        atoms.forEach(([at, ax, ay], i) => {
            const tAt = 600 + (at - 2003.7) / 8.9 * 5600;
            if (time < tAt) {
                return;
            }
            const age = time - tAt;
            const x = W * ax;
            const y = hz * ay;
            const fl = 1 - smoothstep(0, 900, age);
            drawGlow(ctx, x, y, (3 + 14 * fl) * u, '#ffd0c0', (0.5 + 0.5 * fl) * fa);
            ctx.strokeStyle = 'rgba(255,220,210,' + fl * fa + ')';
            ctx.lineWidth = 0.3 * u;
            ctx.beginPath();
            ctx.arc(x, y, (2 + 18 * (1 - fl)) * u, 0, TAU);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,245,240,' + fa + ')';
            ctx.beginPath();
            ctx.arc(x, y, 0.8 * u, 0, TAU);
            ctx.fill();
            drawText(ctx, String(i + 1), x + 3 * u, y - 3 * u, 2 * u, '#ffd0c0', smoothstep(0, 400, age) * fa * (1 - dawn), 700);
        });
        const ya = smoothstep(300, 900, time) * fa * (1 - smoothstep(6100, 6600, time));
        drawText(ctx, String(Math.min(2012, Math.floor(yr))), W / 2, H * 0.84, 5 * u, '#e8eeff', ya, 700, 0.4 * u);
        drawText(ctx, 'RIKEN · WAKO', W / 2, H * 0.9, 1.9 * u, '#9fb4ff', ya, 600, 0.6 * u);
        drawText(ctx, 'THREE ATOMS IN NINE YEARS', W / 2, H * 0.07, 2.1 * u, '#ffd0c0', smoothstep(6100, 6700, time) * fa, 600, 0.6 * u);
        const rb = smoothstep(7300, 8000, time);
        drawGlow(ctx, W / 2, H / 2, Math.max(W, H) * 0.7, '#e8263a', rb * 0.4 * (1 - smoothstep(8000, 9500, time) * 0.4));
        drawCard(ctx, scene, time, 7900, '#fff2ee', '#e8263a');
    }
};
// Cn: a brass orrery turns from Earth at the centre to the Sun at the centre
CUTSCENES.Cn = {
    z: 112, dur: 10000,
    snd(audio, start) {
        for (let i = 0; i < 28; i++) {
            playNoise(audio, start + 0.2 + i * 0.22, 0.025, 0.035, 5200, 2600, 'bandpass', 6, 0.15, 0.001);
        }
        padChord(audio, start, [98, 146.8, 196], 3.6, 0.013, 'triangle', 900);
        arp(audio, start + 0.8, [392, 466.2, 587.3, 698.5, 587.3, 466.2], 0.3, 0.018, 'triangle');
        riser(audio, start + 3.4, 2, 0.02, 120, 800);
        padChord(audio, start + 3.6, [116.5, 174.6, 233.1], 2.4, 0.014, 'triangle', 1200);
        boom(audio, start + 5.5, 0.12, 1.6);
        arp(audio, start + 5.6, [392, 493.9, 587.3, 784, 987.8, 1174.7], 0.14, 0.024, 'triangle');
        padChord(audio, start + 7.4, [196, 293.7, 392, 587.3], 3, 0.02, 'sine', 2400);
        sparkle(audio, start + 7.8, 10, 2, 0.016);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const st = scene.state;
        const cx = W / 2;
        const cy = H / 2;
        const R = Math.min(W, H) * 0.29;
        // Mercury, Venus, Earth, Mars, Jupiter, Saturn: [orbit share, colour, size, phase]
        const P = [[0.2, '#c9b9a0', 0.7, 0.4], [0.36, '#f3d9a4', 0.95, 2.1], [0.52, '#6fb4ff', 1, 4.0], [0.67, '#ff8a5c', 0.8, 1.2], [0.85, '#e8c38a', 1.6, 5.2], [1, '#e9d7a6', 1.4, 3.3]];
        if (!st.s) {
            const r = seededRandom(112);
            st.s = Array.from({ length: 140 }, () => [r() * W, r() * H, r() * 0.7 + 0.2]);
        }
        const fa = 1 - smoothstep(7300, 8100, time);
        const helio = smoothstep(3400, 5600, time);
        ctx.fillStyle = '#07070d';
        ctx.fillRect(0, 0, W, H);
        st.s.forEach(([x, y, r]) => {
            ctx.fillStyle = 'rgba(255,240,210,' + 0.5 * r + ')';
            ctx.fillRect(x, y, r * 0.3 * u, r * 0.3 * u);
        });
        const pos = (i, t) => {
            const a = P[i][3] + t * 0.0011 / Math.pow(P[i][0], 1.5);
            return [Math.cos(a) * R * P[i][0], Math.sin(a) * R * P[i][0] * 0.92];
        };
        // geocentric view = position relative to Earth; heliocentric = position relative to the Sun
        const view = (i, t) => {
            const p = pos(i, t);
            const e = pos(2, t);
            return [cx + p[0] - e[0] * (1 - helio), cy + p[1] - e[1] * (1 - helio)];
        };
        const sun = t => {
            const e = pos(2, t);
            return [cx - e[0] * (1 - helio), cy - e[1] * (1 - helio)];
        };
        // brass rings: centred on the Sun once it takes the middle
        const ringA = (0.25 + 0.6 * helio + 0.4 * smoothstep(5600, 6200, time) * (1 - smoothstep(6600, 7400, time))) * fa;
        P.forEach(p => {
            ctx.strokeStyle = 'rgba(232,176,74,' + ringA * 0.7 + ')';
            ctx.lineWidth = 0.3 * u;
            ctx.beginPath();
            ctx.ellipse(sun(time)[0], sun(time)[1], R * p[0], R * p[0] * 0.92, 0, 0, TAU);
            ctx.stroke();
        });
        // loops traced by the planets (epicycles in the Earth-centred view)
        P.forEach((p, i) => {
            if (i === 2 && helio < 0.5) {
                return;
            }
            ctx.strokeStyle = p[1];
            ctx.globalAlpha = 0.35 * fa;
            ctx.lineWidth = 0.25 * u;
            ctx.beginPath();
            for (let k = 0; k <= 60; k++) {
                const [x, y] = view(i, time - k * 70);
                if (k) {
                    ctx.lineTo(x, y);
                } else {
                    ctx.moveTo(x, y);
                }
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        });
        const [sx, sy] = sun(time);
        drawGlow(ctx, sx, sy, 9 * u * (1 + helio * 0.6), '#ffb84a', 0.9 * fa);
        ctx.fillStyle = 'rgba(255,214,120,' + fa + ')';
        ctx.beginPath();
        ctx.arc(sx, sy, 2.4 * u, 0, TAU);
        ctx.fill();
        P.forEach((p, i) => {
            const [x, y] = view(i, time);
            if (i === 4 || i === 5) {
                ctx.strokeStyle = 'rgba(232,210,160,' + 0.6 * fa + ')';
                ctx.lineWidth = 0.2 * u;
                ctx.beginPath();
                ctx.ellipse(x, y, p[2] * 1.9 * u, p[2] * 0.6 * u, -0.3, 0, TAU);
                if (i === 5) {
                    ctx.stroke();
                }
            }
            drawGlow(ctx, x, y, p[2] * 2.4 * u, p[1], 0.4 * fa);
            ctx.fillStyle = p[1];
            ctx.globalAlpha = fa;
            ctx.beginPath();
            ctx.arc(x, y, p[2] * u, 0, TAU);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
        drawText(ctx, 'EARTH AT THE CENTRE', W / 2, H * 0.07, 2.1 * u, '#e8b04a', smoothstep(300, 900, time) * (1 - smoothstep(3200, 3800, time)), 600, 0.7 * u);
        drawText(ctx, 'THE SUN AT THE CENTRE', W / 2, H * 0.07, 2.1 * u, '#e8b04a', smoothstep(5200, 5800, time) * fa, 600, 0.7 * u);
        drawText(ctx, 'DE REVOLUTIONIBUS · 1543', W / 2, H * 0.93, 2 * u, '#f3d9a4', smoothstep(5800, 6400, time) * fa, 600, 0.6 * u);
        const rb = smoothstep(7300, 8000, time);
        drawGlow(ctx, W / 2, H / 2, Math.max(W, H) * 0.7, '#e8b04a', rb * 0.4 * (1 - smoothstep(8000, 9500, time) * 0.4));
        drawCard(ctx, scene, time, 7900, '#fff6e0', '#e8b04a');
    }
};
// Rg: a Crookes tube flickers and an X-ray reveals a hand wearing a gold ring
CUTSCENES.Rg = {
    z: 111, dur: 10000,
    snd(audio, start) {
        playTone(audio, 50, start + 0.1, 5.6, 0.02, 'sawtooth', null, 0.1, 0, 0.3);
        playTone(audio, 100, start + 0.1, 5.6, 0.012, 'square', null, 0.1, 0, 0.3);
        for (let i = 0; i < 14; i++) {
            playNoise(audio, start + 0.3 + Math.random() * 2.2, 0.04, 0.05, 9000, 3000, 'highpass', 1, 0.1, 0.002);
        }
        playNoise(audio, start + 2.6, 3, 0.03, 600, 5000, 'bandpass', 3, 0.3, 1.2);
        playTone(audio, 1318.5, start + 6, 2.4, 0.03, 'sine', null, 0.8, 0, 0.003);
        playTone(audio, 2637, start + 6.05, 1.8, 0.014, 'sine', null, 0.8, 0, 0.003);
        boom(audio, start + 6, 0.08, 1.4);
        padChord(audio, start + 7, [164.8, 246.9, 329.6, 493.9], 3.4, 0.02, 'sine', 2400);
        sparkle(audio, start + 7.6, 12, 2, 0.017, [1318.5, 1568, 1975.5, 2637]);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const fa = 1 - smoothstep(7300, 8100, time);
        ctx.fillStyle = '#04080b';
        ctx.fillRect(0, 0, W, H);
        // the tube, glowing green and flickering
        const tube = smoothstep(200, 700, time) * (1 - smoothstep(2600, 3400, time));
        const fl = 0.65 + 0.35 * Math.sin(time / 37) * Math.sin(time / 113);
        const tx = W / 2;
        const ty = H * 0.16;
        drawGlow(ctx, tx, ty, 22 * u, '#5dff8a', 0.5 * tube * fl);
        ctx.strokeStyle = 'rgba(170,255,190,' + 0.7 * tube + ')';
        ctx.lineWidth = 0.35 * u;
        ctx.beginPath();
        ctx.ellipse(tx, ty, 11 * u, 6 * u, 0, 0, TAU);
        ctx.moveTo(tx - 11 * u, ty);
        ctx.lineTo(tx - 19 * u, ty);
        ctx.moveTo(tx + 11 * u, ty);
        ctx.lineTo(tx + 19 * u, ty);
        ctx.stroke();
        // the screen, then the hand revealed by a sweep
        const sw = Math.min(W * 0.8, H * 0.62);
        const sh = sw * 1.15;
        const scx = W / 2;
        const scy = H * 0.52;
        const scr = smoothstep(1800, 2600, time) * fa;
        ctx.fillStyle = 'rgba(14,26,34,' + scr + ')';
        ctx.fillRect(scx - sw / 2, scy - sh / 2, sw, sh);
        ctx.strokeStyle = 'rgba(120,200,255,' + 0.4 * scr + ')';
        ctx.lineWidth = 0.3 * u;
        ctx.strokeRect(scx - sw / 2, scy - sh / 2, sw, sh);
        const sweep = clamp((time - 2600) / 3000);
        const cut = scy - sh / 2 + sh * sweep;
        ctx.save();
        ctx.beginPath();
        ctx.rect(scx - sw / 2, scy - sh / 2, sw, sh * sweep);
        ctx.clip();
        const k = sw / 100;
        const wx = scx;
        const wy = scy + sh * 0.42;
        const bone = (x1, y1, x2, y2, w) => {
            ctx.lineWidth = w * k;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        };
        ctx.lineCap = 'round';
        // soft tissue
        ctx.strokeStyle = 'rgba(110,170,210,' + 0.16 * fa + ')';
        const fingers = [[-48, 26, [14, 11]], [-16, 38, [24, 14, 10]], [-3, 40, [27, 16, 11]], [9, 38, [25, 15, 10]], [21, 34, [19, 11, 9]]];
        const joints = [];
        fingers.forEach(([deg, meta, ph], f) => {
            const a = (deg - 90) * Math.PI / 180;
            const bx = wx + (f - 2) * 5.2 * k + (f === 0 ? -4 * k : 0);
            const by = wy - 14 * k + (f === 0 ? 6 * k : 0);
            const mx = bx + Math.cos(a) * meta * k;
            const my = by + Math.sin(a) * meta * k;
            const pts = [[bx, by], [mx, my]];
            let x = mx;
            let y = my;
            const a2 = a + (f === 0 ? 0.25 : (f - 2) * 0.04);
            ph.forEach(l => {
                x += Math.cos(a2) * l * k;
                y += Math.sin(a2) * l * k;
                pts.push([x, y]);
            });
            joints.push(pts);
            bone(pts[0][0], pts[0][1], pts[pts.length - 1][0], pts[pts.length - 1][1], 9.5);
        });
        bone(wx - 20 * k, wy - 12 * k, wx + 18 * k, wy - 14 * k, 26);
        bone(wx - 9 * k, wy + 2 * k, wx - 9 * k, wy + 20 * k, 13);
        bone(wx + 9 * k, wy + 2 * k, wx + 9 * k, wy + 20 * k, 13);
        // bones
        ctx.strokeStyle = 'rgba(220,240,255,' + 0.85 * fa + ')';
        joints.forEach(pts => {
            for (let i = 0; i + 1 < pts.length; i++) {
                const [x1, y1] = pts[i];
                const [x2, y2] = pts[i + 1];
                const g = 0.12;
                bone(x1 + (x2 - x1) * g, y1 + (y2 - y1) * g, x2 - (x2 - x1) * g, y2 - (y2 - y1) * g, i === 0 ? 3.4 : 3 - i * 0.4);
            }
        });
        for (let i = 0; i < 8; i++) {
            const x = wx + (i % 4 - 1.5) * 5.6 * k;
            const y = wy - 6 * k + Math.floor(i / 4) * 5.4 * k;
            ctx.fillStyle = 'rgba(220,240,255,' + 0.8 * fa + ')';
            ctx.beginPath();
            ctx.ellipse(x, y, 2.4 * k, 2.1 * k, 0, 0, TAU);
            ctx.fill();
        }
        bone(wx - 9 * k, wy + 4 * k, wx - 9 * k, wy + 24 * k, 4.2);
        bone(wx + 9 * k, wy + 4 * k, wx + 9 * k, wy + 24 * k, 3.4);
        // the ring, on the ring finger's first bone
        const rp = joints[3];
        const rx = rp[1][0] + (rp[2][0] - rp[1][0]) * 0.45;
        const ry = rp[1][1] + (rp[2][1] - rp[1][1]) * 0.45;
        const glint = smoothstep(5900, 6200, time) * (1 - smoothstep(6400, 7600, time));
        drawGlow(ctx, rx, ry, (4 + 14 * glint) * k, '#ffcf5a', (0.5 + 0.5 * glint) * fa);
        ctx.strokeStyle = 'rgba(255,214,110,' + fa + ')';
        ctx.lineWidth = 1.6 * k;
        ctx.beginPath();
        ctx.ellipse(rx, ry, 3.6 * k, 1.5 * k, -0.15, 0, TAU);
        ctx.stroke();
        ctx.restore();
        if (sweep > 0 && sweep < 1) {
            ctx.fillStyle = 'rgba(160,220,255,.8)';
            ctx.fillRect(scx - sw / 2, cut - 0.3 * u, sw, 0.6 * u);
            drawGlow(ctx, scx, cut, sw * 0.4, '#7fd0ff', 0.3);
        }
        drawText(ctx, 'X-RAYS', W / 2, H * 0.05, 2.1 * u, '#9fe8b4', smoothstep(300, 900, time) * (1 - smoothstep(2600, 3200, time)), 600, 0.7 * u);
        drawText(ctx, 'WÜRZBURG · 1895', W / 2, H * 0.95, 2 * u, '#bfe4ff', smoothstep(6000, 6600, time) * fa, 600, 0.6 * u);
        const rb = smoothstep(7300, 8000, time);
        drawGlow(ctx, W / 2, H / 2, Math.max(W, H) * 0.7, '#6fd2ff', rb * 0.4 * (1 - smoothstep(8000, 9500, time) * 0.4));
        drawCard(ctx, scene, time, 7900, '#f2fbff', '#6fd2ff');
    }
};
// Ds: one atom lands in a detector in slow motion and lives for a fraction of a millisecond
CUTSCENES.Ds = {
    z: 110, dur: 10000,
    snd(audio, start) {
        padChord(audio, start, [61.7, 92.5, 123.5], 6.2, 0.013, 'sine', 600);
        playNoise(audio, start + 0.4, 0.8, 0.05, 300, 6000, 'bandpass', 2, 0.2, 0.6);
        playNoise(audio, start + 1.2, 0.08, 0.08, 4000, 800, 'lowpass', 1, 0.3, 0.002);
        playTone(audio, 1760, start + 1.2, 0.6, 0.02, 'sine', 880, 0.5, 0, 0.003);
        for (let i = 0; i < 16; i++) {
            playTone(audio, 2093, start + 1.6 + i * 0.28, 0.04, 0.008, 'square', null, 0.05, 0, 0.002);
        }
        playTone(audio, 220, start + 1.4, 4.6, 0.012, 'sine', 330, 0.4, 0, 1.5);
        playNoise(audio, start + 6, 0.1, 0.1, 9000, 2000, 'highpass', 1, 0.3, 0.001);
        boom(audio, start + 6, 0.16, 1.8);
        arp(audio, start + 6.1, [554.4, 659.3, 830.6, 1108.7], 0.1, 0.026, 'sine');
        padChord(audio, start + 7.4, [138.6, 207.7, 277.2, 415.3], 3, 0.02, 'sine', 2400);
        sparkle(audio, start + 7.8, 10, 2, 0.016);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const fa = 1 - smoothstep(7300, 8100, time);
        ctx.fillStyle = '#06070d';
        ctx.fillRect(0, 0, W, H);
        const n = 14;
        const cs = Math.min(W * 0.78, H * 0.56) / n;
        const gx = W / 2 - cs * n / 2;
        const gy = H * 0.52 - cs * n / 2;
        const hi = 8;
        const hj = 5;
        const hit = [gx + (hi + 0.5) * cs, gy + (hj + 0.5) * cs];
        const decay = time >= 6000;
        const dAge = time - 6000;
        // detector grid
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const d = Math.abs(i - hi) + Math.abs(j - hj);
                let lit = 0;
                if (decay && (i === hi || j === hj)) {
                    lit = Math.max(0, 1 - smoothstep(0, 1200, dAge - d * 60)) * (d < 7 ? 1 - d / 7 : 0);
                }
                ctx.fillStyle = 'rgba(' + (40 + 180 * lit) + ',' + (48 + 140 * lit) + ',' + (80 + 175 * lit) + ',' + (0.35 + 0.6 * lit) * fa + ')';
                ctx.fillRect(gx + i * cs + 0.12 * u, gy + j * cs + 0.12 * u, cs - 0.24 * u, cs - 0.24 * u);
            }
        }
        // the incoming ion
        const fly = clamp((time - 600) / 600);
        if (fly > 0 && fly < 1) {
            const x = -0.05 * W + (hit[0] + 0.05 * W) * fly;
            const y = H * 0.2 + (hit[1] - H * 0.2) * fly;
            ctx.strokeStyle = 'rgba(200,190,255,.7)';
            ctx.lineWidth = 0.4 * u;
            ctx.beginPath();
            ctx.moveTo(x - (hit[0] + 0.05 * W) * 0.12, y - (hit[1] - H * 0.2) * 0.12);
            ctx.lineTo(x, y);
            ctx.stroke();
            drawGlow(ctx, x, y, 4 * u, '#c8beff', 0.9);
        }
        // the atom, alive in its pixel
        if (time >= 1200 && !decay) {
            const p = 0.6 + 0.4 * Math.sin(time / 160);
            drawGlow(ctx, hit[0], hit[1], cs * 1.6, '#8a7dff', 0.6 * p);
            ctx.fillStyle = 'rgba(205,195,255,' + (0.7 + 0.3 * p) + ')';
            ctx.fillRect(hit[0] - cs / 2 + 0.12 * u, hit[1] - cs / 2 + 0.12 * u, cs - 0.24 * u, cs - 0.24 * u);
        }
        // the decay
        if (decay) {
            const r = clamp(dAge / 1100);
            drawGlow(ctx, hit[0], hit[1], (4 + 30 * r) * u, '#ffffff', (1 - r) * fa);
            ctx.strokeStyle = 'rgba(230,225,255,' + (1 - r) * fa + ')';
            ctx.lineWidth = (1 - r) * 1.2 * u;
            ctx.beginPath();
            ctx.arc(hit[0], hit[1], r * 40 * u, 0, TAU);
            ctx.stroke();
        }
        // slow-motion timer
        const life = clamp((time - 1200) / 4800);
        const us = Math.round(life * 180);
        const ta = smoothstep(1000, 1400, time) * fa;
        drawText(ctx, 'SLOW MOTION', W / 2, H * 0.07, 2.1 * u, '#b8b0ff', smoothstep(300, 900, time) * fa * (1 - smoothstep(5800, 6200, time)), 600, 0.7 * u);
        drawText(ctx, 'ONE ATOM · DECAYED', W / 2, H * 0.07, 2.1 * u, '#b8b0ff', smoothstep(6100, 6500, time) * fa, 600, 0.7 * u);
        drawText(ctx, (us / 1e6).toFixed(6) + ' s', W / 2, H * 0.13, 3.6 * u, decay ? '#ffffff' : '#e6e2ff', ta, 700, 0.3 * u);
        drawText(ctx, 'GSI · DARMSTADT · 1994', W / 2, H * 0.93, 2 * u, '#b8b0ff', smoothstep(6300, 6900, time) * fa, 600, 0.6 * u);
        const rb = smoothstep(7300, 8000, time);
        drawGlow(ctx, W / 2, H / 2, Math.max(W, H) * 0.7, '#8a7dff', rb * 0.4 * (1 - smoothstep(8000, 9500, time) * 0.4));
        drawCard(ctx, scene, time, 7900, '#f0eeff', '#8a7dff');
    }
};
// Mt: winter 1938 - a neutron strikes a drop-shaped nucleus, it stretches and splits (Meitner and Frisch explain fission)
CUTSCENES.Mt = {
    z: 109, dur: 10000,
    snd(audio, start) {
        padChord(audio, start, [73.4, 110, 146.8], 5.8, 0.013, 'sine', 700);
        playNoise(audio, start, 6, 0.022, 500, 900, 'bandpass', 0.7, 0.4, 1.5);
        playTone(audio, 1318.5, start + 1.8, 0.3, 0.02, 'sine', 659.3, 0.4, 0, 0.002);
        riser(audio, start + 2, 3.6, 0.026, 90, 420);
        for (let i = 0; i < 7; i++) {
            playTone(audio, 98 + i * 14, start + 2.2 + i * 0.48, 0.4, 0.012, 'triangle', null, 0.3, 0, 0.05);
        }
        playNoise(audio, start + 5.6, 0.15, 0.09, 7000, 1200, 'lowpass', 1, 0.3, 0.002);
        boom(audio, start + 5.6, 0.2, 2.2);
        arp(audio, start + 5.8, [293.7, 370, 440, 587.3, 740, 880], 0.11, 0.026, 'sine');
        padChord(audio, start + 7.4, [146.8, 220, 293.7, 440], 3, 0.02, 'sine', 2400);
        sparkle(audio, start + 7.8, 10, 2, 0.016);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const st = scene.state;
        const cx = W / 2;
        const cy = H * 0.48;
        const fa = 1 - smoothstep(7300, 8100, time);
        if (!st.snow) {
            const r = seededRandom(109);
            st.snow = Array.from({ length: 140 }, () => [r(), r(), 0.3 + r() * 0.9, r() * TAU]);
            st.nuc = Array.from({ length: 70 }, () => {
                const a = r() * TAU;
                const d = Math.sqrt(r());
                return [Math.cos(a) * d, Math.sin(a) * d, r()];
            });
        }
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0d1a2b');
        bg.addColorStop(1, '#04070d');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        // falling snow
        st.snow.forEach(([x, y, s, ph]) => {
            const yy = ((y + time * 0.00004 * (0.5 + s)) % 1) * H;
            const xx = ((x + Math.sin(time * 0.0006 + ph) * 0.012) % 1) * W;
            ctx.fillStyle = 'rgba(225,238,255,' + (0.2 + 0.45 * s) * fa + ')';
            ctx.beginPath();
            ctx.arc(xx, yy, (0.12 + 0.25 * s) * u, 0, TAU);
            ctx.fill();
        });
        const R = Math.min(W, H) * 0.16;
        const hitT = 1800;
        const splitT = 5600;
        // the neutron
        const fly = clamp((time - 900) / 900);
        if (fly > 0 && fly < 1) {
            const x = -0.04 * W + (cx - R + 0.04 * W) * fly * fly;
            ctx.strokeStyle = 'rgba(200,230,255,.6)';
            ctx.lineWidth = 0.35 * u;
            ctx.beginPath();
            ctx.moveTo(Math.max(0, x - 14 * u), cy);
            ctx.lineTo(x, cy);
            ctx.stroke();
            drawGlow(ctx, x, cy, 3 * u, '#d8ecff', 0.9);
        }
        if (time >= hitT && time < hitT + 500) {
            drawGlow(ctx, cx - R, cy, 9 * u, '#ffffff', (1 - (time - hitT) / 500) * 0.8);
        }
        if (time < splitT) {
            // the liquid drop: a Cassini oval that stretches toward a pinch
            const pre = smoothstep(hitT, splitT, time);
            const k = 0.985 * Math.pow(pre, 1.4);
            const wob = time < hitT ? Math.sin(time / 600) * 0.015 : Math.sin((time - hitT) / 170) * 0.07 * (1 - 0.6 * pre) * smoothstep(hitT, hitT + 400, time);
            const c2 = (k * R) * (k * R);
            const R4 = R * R * R * R;
            const shape = () => {
                ctx.beginPath();
                for (let i = 0; i <= 120; i++) {
                    const th = i / 120 * TAU;
                    const s2 = Math.sin(2 * th);
                    const rr = Math.sqrt(Math.max(0, c2 * Math.cos(2 * th) + Math.sqrt(Math.max(0, R4 - c2 * c2 * s2 * s2))));
                    const x = cx + Math.cos(th) * rr * (1 + wob);
                    const y = cy + Math.sin(th) * rr * (1 - wob);
                    if (i) {
                        ctx.lineTo(x, y);
                    } else {
                        ctx.moveTo(x, y);
                    }
                }
                ctx.closePath();
            };
            drawGlow(ctx, cx, cy, R * (2.6 + pre), '#ff8a3d', (0.25 + 0.35 * pre) * fa);
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * (1.2 + k * 0.5));
            g.addColorStop(0, '#fff6ec');
            g.addColorStop(0.55, '#ffbf8c');
            g.addColorStop(1, '#d0602e');
            ctx.fillStyle = g;
            shape();
            ctx.fill();
            ctx.save();
            shape();
            ctx.clip();
            st.nuc.forEach(([nx, ny, s]) => {
                ctx.fillStyle = 'rgba(150,60,20,' + (0.14 + 0.16 * s) + ')';
                ctx.beginPath();
                ctx.arc(cx + nx * R * (1 + k * 0.9) * (1 + wob), cy + ny * R * (1 - k * 0.4) * (1 - wob), 0.09 * R, 0, TAU);
                ctx.fill();
            });
            ctx.restore();
            ctx.strokeStyle = 'rgba(255,240,225,.75)';
            ctx.lineWidth = 0.3 * u;
            shape();
            ctx.stroke();
        } else {
            // two fragments fly apart with a burst of energy and spare neutrons
            const a = clamp((time - splitT) / 1600);
            const s = easeOutCubic(a);
            const d = R * 0.92 + s * Math.min(W * 0.3, H * 0.28);
            drawGlow(ctx, cx, cy, R * (1 + 6 * a), '#ffb070', (1 - a) * 0.95 * fa);
            ctx.strokeStyle = 'rgba(255,220,190,' + (1 - a) * fa + ')';
            ctx.lineWidth = (1 - a) * 1.4 * u;
            ctx.beginPath();
            ctx.arc(cx, cy, R * (0.5 + 6 * a), 0, TAU);
            ctx.stroke();
            [-1, 1].forEach(side => {
                const fx = cx + side * d;
                const rx = R * 0.58 * (1 + 0.3 * (1 - s));
                const ry = R * 0.58 * (1 - 0.2 * (1 - s));
                drawGlow(ctx, fx, cy, R * 1.6, '#ff8a3d', 0.4 * fa);
                const g = ctx.createRadialGradient(fx, cy, 0, fx, cy, rx * 1.2);
                g.addColorStop(0, '#fff6ec');
                g.addColorStop(0.55, '#ffbf8c');
                g.addColorStop(1, '#d0602e');
                ctx.globalAlpha = fa;
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.ellipse(fx, cy, rx, ry, 0, 0, TAU);
                ctx.fill();
                ctx.globalAlpha = 1;
            });
            [-2.3, -0.9, 1.9].forEach(ang => {
                const dist = easeOutCubic(clamp((time - splitT) / 900)) * Math.max(W, H) * 0.6;
                const x = cx + Math.cos(ang) * dist;
                const y = cy + Math.sin(ang) * dist;
                drawGlow(ctx, x, y, 2.6 * u, '#d8ecff', 0.9 * fa * (1 - a * 0.6));
            });
        }
        drawText(ctx, 'A WALK IN THE SNOW', W / 2, H * 0.07, 2.1 * u, '#cfe0ff', smoothstep(300, 900, time) * (1 - smoothstep(2600, 3200, time)), 600, 0.7 * u);
        drawText(ctx, 'THE NUCLEUS SPLITS', W / 2, H * 0.07, 2.1 * u, '#ffc9a3', smoothstep(5800, 6300, time) * fa, 600, 0.7 * u);
        drawText(ctx, 'MEITNER · FRISCH · 1938', W / 2, H * 0.93, 2 * u, '#cfe0ff', smoothstep(6100, 6700, time) * fa, 600, 0.6 * u);
        const rb = smoothstep(7300, 8000, time);
        drawGlow(ctx, W / 2, H / 2, Math.max(W, H) * 0.7, '#ff8a3d', rb * 0.4 * (1 - smoothstep(8000, 9500, time) * 0.4));
        drawCard(ctx, scene, time, 7900, '#fff1e6', '#ff8a3d');
    }
};
// Hs: hassium tetroxide molecules drift down a cold column and freeze out one at a time
CUTSCENES.Hs = {
    z: 108, dur: 10000,
    snd(audio, start) {
        padChord(audio, start, [69.3, 103.8, 138.6], 6, 0.013, 'sine', 700);
        playNoise(audio, start + 0.3, 5.6, 0.018, 1800, 600, 'lowpass', 0.5, 0.3, 1);
        for (let i = 0; i < 7; i++) {
            const t = start + (800 + i * 640 + 900) / 1000;
            playTone(audio, 659.3 * Math.pow(2, i * 2 / 12), t, 0.25, 0.016, 'sine', null, 0.5, 0, 0.003);
            playNoise(audio, t, 0.04, 0.03, 6000, 3000, 'highpass', 1, 0.2, 0.001);
        }
        playNoise(audio, start + 6, 0.1, 0.08, 8000, 1500, 'highpass', 1, 0.3, 0.002);
        boom(audio, start + 6, 0.16, 1.8);
        arp(audio, start + 6.1, [277.2, 349.2, 415.3, 554.4, 698.5], 0.11, 0.026, 'sine');
        padChord(audio, start + 7.4, [138.6, 207.7, 277.2, 415.3], 3, 0.02, 'sine', 2400);
        sparkle(audio, start + 7.8, 10, 2, 0.016);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const fa = 1 - smoothstep(7300, 8100, time);
        const bg = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, Math.max(W, H) * 0.8);
        bg.addColorStop(0, '#1d0a1a');
        bg.addColorStop(1, '#070409');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        const N = 7;
        const launch = i => 800 + i * 640;
        const arrived = Array.from({ length: N }, (_, i) => time >= launch(i) + 900).filter(Boolean).length;
        const lastArr = arrived ? launch(arrived - 1) + 900 : -1e9;
        const pulse = 1 - smoothstep(0, 500, time - lastArr);
        const big = time >= 6000 ? 1 - smoothstep(6000, 7000, time) : 0;
        // the column: a temperature gradient from +20 down to -170 C
        const x0 = W * 0.08;
        const x1 = W * 0.92;
        const cyc = H * 0.68;
        const th = Math.max(3 * u, H * 0.03);
        const colA = smoothstep(200, 900, time) * fa;
        const cg = ctx.createLinearGradient(x0, 0, x1, 0);
        cg.addColorStop(0, 'rgba(120,50,80,' + 0.55 * colA + ')');
        cg.addColorStop(1, 'rgba(30,70,140,' + 0.55 * colA + ')');
        ctx.fillStyle = cg;
        ctx.fillRect(x0, cyc - th / 2, x1 - x0, th);
        ctx.strokeStyle = 'rgba(255,200,230,' + 0.35 * colA + ')';
        ctx.lineWidth = 0.25 * u;
        ctx.strokeRect(x0, cyc - th / 2, x1 - x0, th);
        for (let i = 0; i <= 10; i++) {
            const x = x0 + (x1 - x0) * i / 10;
            ctx.fillStyle = 'rgba(255,200,230,' + 0.3 * colA + ')';
            ctx.fillRect(x - 0.1 * u, cyc + th / 2, 0.2 * u, i % 5 ? 0.8 * u : 1.4 * u);
        }
        drawText(ctx, '+20 °C', x0, cyc + th / 2 + 3.4 * u, 1.7 * u, '#ffb3d6', colA * 0.8, 600);
        drawText(ctx, '−170 °C', x1, cyc + th / 2 + 3.4 * u, 1.7 * u, '#a9c4ff', colA * 0.8, 600);
        const f = (20 + 44) / 190;
        const xd = x0 + (x1 - x0) * f;
        if (arrived) {
            drawGlow(ctx, xd, cyc, (5 + 6 * pulse + 18 * big) * u, '#ff4fb8', (0.4 + 0.4 * pulse + 0.5 * big) * fa);
            drawText(ctx, '−44 °C', xd, cyc - th / 2 - 3 * u, 2 * u, '#ffd6ec', smoothstep(1700, 2100, time) * fa, 700);
        }
        // molecules travelling and freezing out
        for (let i = 0; i < N; i++) {
            const t = time - launch(i);
            if (t < 0) {
                continue;
            }
            const jy = (((i * 37) % 7) / 6 - 0.5) * th * 0.6;
            const jx = (((i * 53) % 5) / 4 - 0.5) * 2.4 * u;
            const p = easeOutCubic(clamp(t / 900));
            const x = x0 - 3 * u + (xd + jx - x0 + 3 * u) * p;
            const y = cyc + jy;
            if (p < 1) {
                ctx.strokeStyle = 'rgba(255,120,200,.5)';
                ctx.lineWidth = 0.3 * u;
                ctx.beginPath();
                ctx.moveTo(Math.max(x0 - 3 * u, x - 8 * u * (1 - p)), y);
                ctx.lineTo(x, y);
                ctx.stroke();
            }
            drawGlow(ctx, x, y, 2.2 * u, '#ff7cc8', 0.8 * fa);
            ctx.fillStyle = 'rgba(255,230,245,' + fa + ')';
            ctx.beginPath();
            ctx.arc(x, y, 0.45 * u, 0, TAU);
            ctx.fill();
        }
        // a large HsO4 molecule turning above the column
        const mx = W / 2;
        const my = H * 0.36;
        const S = Math.min(W, H) * 0.15 * (1 + 0.05 * pulse + 0.08 * big) * (0.85 + 0.15 * smoothstep(0, 1200, time));
        const ma = smoothstep(0, 900, time) * fa;
        const ay = time * 0.0008;
        const ax = 0.6 + Math.sin(time * 0.0004) * 0.3;
        const k = 1 / Math.sqrt(3);
        const pts = [[0, 0, 0, 1], [k, k, k, 0], [k, -k, -k, 0], [-k, k, -k, 0], [-k, -k, k, 0]].map(([x, y, z, c]) => {
            const x2 = x * Math.cos(ay) + z * Math.sin(ay);
            const z2 = -x * Math.sin(ay) + z * Math.cos(ay);
            const y2 = y * Math.cos(ax) - z2 * Math.sin(ax);
            const z3 = y * Math.sin(ax) + z2 * Math.cos(ax);
            const p = 1 + z3 * 0.18;
            return { x: mx + x2 * S * p, y: my + y2 * S * p, z: z3, c, p };
        });
        drawGlow(ctx, mx, my, S * 3, '#ff4fb8', (0.22 + 0.3 * pulse + 0.5 * big) * ma);
        ctx.strokeStyle = 'rgba(255,190,225,' + 0.55 * ma + ')';
        ctx.lineWidth = 0.18 * S;
        ctx.lineCap = 'round';
        pts.slice(1).forEach(q => {
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
        });
        pts.slice().sort((a, b) => a.z - b.z).forEach(q => {
            const r = (q.c ? 0.42 : 0.26) * S * q.p;
            const g = ctx.createRadialGradient(q.x - r * 0.35, q.y - r * 0.35, r * 0.1, q.x, q.y, r);
            if (q.c) {
                g.addColorStop(0, '#ffe2f3');
                g.addColorStop(0.45, '#ff4fb8');
                g.addColorStop(1, '#6a1048');
            } else {
                g.addColorStop(0, '#ffffff');
                g.addColorStop(0.5, '#ffc2e2');
                g.addColorStop(1, '#8a4a6c');
            }
            ctx.globalAlpha = ma;
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(q.x, q.y, r, 0, TAU);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
        drawText(ctx, 'HsO₄', mx, my + S * 1.75, 3.6 * u, '#ffe2f3', ma, 700, 0.2 * u);
        drawText(ctx, 'HASSIUM TETROXIDE', W / 2, H * 0.07, 2.1 * u, '#ffb3d6', smoothstep(300, 900, time) * (1 - smoothstep(5600, 6000, time)), 600, 0.7 * u);
        drawText(ctx, 'ONE MOLECULE AT A TIME', W / 2, H * 0.07, 2.1 * u, '#ffb3d6', smoothstep(6100, 6600, time) * fa, 600, 0.7 * u);
        drawText(ctx, 'HASSIA · THE LAND OF HESSE', W / 2, H * 0.93, 2 * u, '#ffd6ec', smoothstep(6300, 6900, time) * fa, 600, 0.6 * u);
        const rb = smoothstep(7300, 8000, time);
        drawGlow(ctx, W / 2, H / 2, Math.max(W, H) * 0.7, '#ff4fb8', rb * 0.4 * (1 - smoothstep(8000, 9500, time) * 0.4));
        drawCard(ctx, scene, time, 7900, '#fff0f8', '#ff4fb8');
    }
};
// Bh: Bohr's atom - an electron leaps between orbits and each fall paints a line of hydrogen's spectrum
CUTSCENES.Bh = {
    z: 107, dur: 10000,
    snd(audio, start) {
        padChord(audio, start, [65.4, 98, 130.8], 6.2, 0.013, 'sine', 700);
        const lam = [656, 486, 434, 410];
        [1700, 2900, 4100, 5300].forEach((t, i) => {
            const f = 440 * Math.pow(656 / lam[i], 2);
            playTone(audio, f * 2, start + t / 1000, 0.08, 0.014, 'triangle', f, 0.3, 0, 0.002);
            playTone(audio, f, start + t / 1000 + 0.7, 1.4, 0.02, 'sine', null, 0.6, 0, 0.004);
        });
        [2300, 3500, 4700].forEach(t => playTone(audio, 330, start + t / 1000 - 0.05, 0.2, 0.012, 'sine', 660, 0.3, 0, 0.01));
        playNoise(audio, start + 6.1, 0.1, 0.08, 8000, 1500, 'highpass', 1, 0.3, 0.002);
        boom(audio, start + 6.1, 0.16, 1.8);
        arp(audio, start + 6.2, [261.6, 329.6, 392, 523.3, 659.3], 0.11, 0.026, 'sine');
        padChord(audio, start + 7.4, [130.8, 196, 261.6, 392], 3, 0.02, 'sine', 2400);
        sparkle(audio, start + 7.8, 10, 2, 0.016);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const fa = 1 - smoothstep(7300, 8100, time);
        ctx.fillStyle = '#05070f';
        ctx.fillRect(0, 0, W, H);
        const cx = W / 2;
        const cy = H * 0.42;
        const Rm = Math.min(W * 0.42, H * 0.3);
        const rn = n => Rm * (0.1 + 0.9 * Math.pow((n - 1) / 5, 1.25));
        const lines = [[656, '#ff3b3b'], [486, '#3fd8ff'], [434, '#4f6bff'], [410, '#a35cff']];
        const ups = [3, 4, 5, 6];
        const tD = [1700, 2900, 4100, 5300];
        const tU = [2300, 3500, 4700];
        let n = 3;
        const ev = [];
        tD.forEach((t, i) => {
            ev.push([t, 2, ups[i], i, 'd']);
            if (tU[i]) {
                ev.push([tU[i], ups[i + 1], 2, i + 1, 'u']);
            }
        });
        ev.sort((a, b) => a[0] - b[0]);
        ev.forEach(e => {
            if (time >= e[0]) {
                n = e[1];
            }
        });
        const ang = time * 0.0018;
        const big = time >= 6100 ? 1 - smoothstep(6100, 7100, time) : 0;
        const oa = smoothstep(0, 900, time) * fa;
        // nucleus
        drawGlow(ctx, cx, cy, Rm * 0.25, '#ffd2d2', (0.5 + 0.4 * big) * oa);
        ctx.fillStyle = 'rgba(255,235,235,' + oa + ')';
        ctx.beginPath();
        ctx.arc(cx, cy, 0.9 * u, 0, TAU);
        ctx.fill();
        // orbits
        for (let k = 1; k <= 6; k++) {
            ctx.strokeStyle = 'rgba(150,180,255,' + (k === n ? 0.5 : 0.16 + 0.3 * big) * oa + ')';
            ctx.lineWidth = (k === n ? 0.3 : 0.18) * u;
            ctx.beginPath();
            ctx.arc(cx, cy, rn(k), 0, TAU);
            ctx.stroke();
        }
        // spectrum strip
        const sx0 = W * 0.1;
        const sx1 = W * 0.9;
        const sy = H * 0.82;
        const sh = Math.max(3 * u, H * 0.035);
        const lx = l => sx0 + (l - 380) / 320 * (sx1 - sx0);
        const sa = smoothstep(300, 1100, time) * fa;
        const rg = ctx.createLinearGradient(sx0, 0, sx1, 0);
        [[380, '#6a2cff'], [450, '#2c5cff'], [495, '#20d0ff'], [550, '#40ff70'], [590, '#ffe040'], [630, '#ff7a20'], [700, '#a01010']].forEach(([l, c]) => rg.addColorStop((l - 380) / 320, c));
        ctx.globalAlpha = 0.12 * sa;
        ctx.fillStyle = rg;
        ctx.fillRect(sx0, sy, sx1 - sx0, sh);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(160,180,255,' + 0.3 * sa + ')';
        ctx.lineWidth = 0.2 * u;
        ctx.strokeRect(sx0, sy, sx1 - sx0, sh);
        // photons
        const P = (r, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
        tD.forEach((t, i) => {
            const [l, col] = lines[i];
            const e = time - t;
            if (e < 0) {
                return;
            }
            const from = P(rn(2), t * 0.0018);
            const to = [lx(l), sy];
            const p = clamp(e / 800);
            if (p < 1) {
                const dx = to[0] - from[0];
                const dy = to[1] - from[1];
                const len = Math.hypot(dx, dy);
                const nx = -dy / len;
                const ny = dx / len;
                ctx.strokeStyle = col;
                ctx.lineWidth = 0.35 * u;
                ctx.beginPath();
                for (let s = Math.max(0, p - 0.3); s <= p + 1e-6; s += 0.01) {
                    const w = Math.sin(s * len / (2.2 * u)) * 1.2 * u;
                    const x = from[0] + dx * s + nx * w;
                    const y = from[1] + dy * s + ny * w;
                    if (s === Math.max(0, p - 0.3)) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
                drawGlow(ctx, from[0] + dx * p, from[1] + dy * p, 3 * u, col, 0.9);
            } else {
                const fl = 1 - smoothstep(0, 600, e - 800);
                drawGlow(ctx, to[0], sy + sh / 2, (3 + 6 * fl + 6 * big) * u, col, (0.4 + 0.5 * fl + 0.4 * big) * fa);
                ctx.fillStyle = col;
                ctx.globalAlpha = fa;
                ctx.fillRect(to[0] - 0.3 * u, sy - 0.6 * u, 0.6 * u, sh + 1.2 * u);
                ctx.globalAlpha = 1;
                drawText(ctx, String(l), to[0], sy + sh + 2.4 * u, 1.6 * u, col, smoothstep(0, 400, e - 800) * fa, 700);
            }
        });
        // absorbed photons before each upward leap
        tU.forEach((t, i) => {
            const e = time - (t - 450);
            if (e < 0 || e > 450) {
                return;
            }
            const to = P(rn(2), t * 0.0018);
            const from = [W * 0.06, H * 0.1];
            const p = e / 450;
            drawGlow(ctx, from[0] + (to[0] - from[0]) * p, from[1] + (to[1] - from[1]) * p, 2.4 * u, lines[i + 1][1], 0.8);
        });
        // the quantum leap itself: no path between orbits, just a flash at both
        ev.forEach(([t, nTo, nFrom]) => {
            const e = time - t;
            if (e < 0 || e > 350) {
                return;
            }
            const a = 1 - e / 350;
            const p1 = P(rn(nFrom), ang);
            const p2 = P(rn(nTo), ang);
            drawGlow(ctx, p1[0], p1[1], 5 * u, '#ffffff', 0.6 * a);
            drawGlow(ctx, p2[0], p2[1], 6 * u, '#ffffff', 0.8 * a);
            ctx.setLineDash([0.6 * u, 0.9 * u]);
            ctx.strokeStyle = 'rgba(255,255,255,' + 0.5 * a + ')';
            ctx.lineWidth = 0.2 * u;
            ctx.beginPath();
            ctx.moveTo(p1[0], p1[1]);
            ctx.lineTo(p2[0], p2[1]);
            ctx.stroke();
            ctx.setLineDash([]);
        });
        if (time >= 600) {
            const [ex, ey] = P(rn(n), ang);
            drawGlow(ctx, ex, ey, 3.4 * u, '#bfe4ff', 0.9 * fa);
            ctx.fillStyle = 'rgba(240,250,255,' + fa + ')';
            ctx.beginPath();
            ctx.arc(ex, ey, 0.6 * u, 0, TAU);
            ctx.fill();
        }
        drawText(ctx, 'QUANTUM LEAPS', W / 2, H * 0.06, 2.1 * u, '#bcd0ff', smoothstep(300, 900, time) * (1 - smoothstep(5900, 6300, time)), 600, 0.7 * u);
        drawText(ctx, 'THE HYDROGEN SPECTRUM', W / 2, H * 0.06, 2.1 * u, '#bcd0ff', smoothstep(6200, 6700, time) * fa, 600, 0.7 * u);
        drawText(ctx, 'BOHR · 1913', W / 2, H * 0.95, 2 * u, '#bcd0ff', smoothstep(6400, 7000, time) * fa, 600, 0.6 * u);
        const rb = smoothstep(7300, 8000, time);
        drawGlow(ctx, W / 2, H / 2, Math.max(W, H) * 0.7, '#4f86ff', rb * 0.4 * (1 - smoothstep(8000, 9500, time) * 0.4));
        drawCard(ctx, scene, time, 7900, '#eef3ff', '#4f86ff');
    }
};
// Sg: Seaborg lifts the actinides out of the main table, and element 106 takes the place uranium left
CUTSCENES.Sg = {
    z: 106, dur: 10000,
    snd(audio, start) {
        padChord(audio, start, [82.4, 123.5, 164.8], 6, 0.013, 'sine', 700);
        for (let i = 0; i < 10; i++) {
            playNoise(audio, start + 0.3 + i * 0.1, 0.03, 0.025, 4000, 2500, 'bandpass', 2, 0.2, 0.001);
        }
        playTone(audio, 523.3, start + 2.4, 0.5, 0.018, 'sine', null, 0.5, 0, 0.01);
        for (let i = 0; i < 5; i++) {
            playTone(audio, 392 - i * 22, start + 2.9 + i * 0.14, 0.9, 0.014, 'triangle', 196 - i * 11, 0.4, 0, 0.01);
        }
        [4.3, 4.55].forEach(t => sparkle(audio, start + t, 3, 0.2, 0.014));
        for (let i = 0; i < 7; i++) {
            playNoise(audio, start + 4.9 + i * 0.09, 0.03, 0.022, 4500, 2800, 'bandpass', 2, 0.2, 0.001);
        }
        playTone(audio, 659.3, start + 5.5, 0.4, 0.014, 'sine', null, 0.4, 0, 0.005);
        playTone(audio, 784, start + 5.75, 0.4, 0.014, 'sine', null, 0.4, 0, 0.005);
        playNoise(audio, start + 6, 0.1, 0.08, 8000, 1500, 'highpass', 1, 0.3, 0.002);
        boom(audio, start + 6, 0.17, 1.8);
        arp(audio, start + 6.1, [329.6, 415.3, 493.9, 659.3, 830.6], 0.11, 0.026, 'sine');
        padChord(audio, start + 7.4, [164.8, 246.9, 329.6, 493.9], 3, 0.02, 'sine', 2400);
        sparkle(audio, start + 7.8, 10, 2, 0.016);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const st = scene.state;
        const fa = 1 - smoothstep(7300, 8100, time);
        ctx.fillStyle = '#050c09';
        ctx.fillRect(0, 0, W, H);
        if (!st.cells) {
            const rows = [
                [[1, 'H'], [18, 'He']],
                [[1, 'Li'], [2, 'Be'], [13, 'B'], [14, 'C'], [15, 'N'], [16, 'O'], [17, 'F'], [18, 'Ne']],
                [[1, 'Na'], [2, 'Mg'], [13, 'Al'], [14, 'Si'], [15, 'P'], [16, 'S'], [17, 'Cl'], [18, 'Ar']],
                'K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr'.split(' ').map((s, i) => [i + 1, s]),
                'Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe'.split(' ').map((s, i) => [i + 1, s]),
                'Cs Ba La Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn'.split(' ').map((s, i) => [i + 1, s]),
                [[1, 'Fr'], [2, 'Ra'], [3, 'Ac']]
            ];
            st.cells = [];
            rows.forEach((r, ri) => r.forEach(([c, s]) => st.cells.push({ s, c, r: ri, t: 200 + ri * 90 + c * 25 })));
            'Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu'.split(' ').forEach((s, i) => st.cells.push({ s, c: i + 4, r: 7.6, t: 900 + i * 25 }));
            // the elements Seaborg moved: they start under hafnium..osmium in period 7
            'Th Pa U Np Pu'.split(' ').forEach((s, i) => st.cells.push({ s, c: i + 4, r: 6, t: 800 + i * 25, mv: 2900 + i * 140 }));
            'Am Cm'.split(' ').forEach((s, i) => st.cells.push({ s, c: i + 9, r: 8.6, t: 4300 + i * 250, hot: 1 }));
            'Bk Cf Es Fm Md No Lr'.split(' ').forEach((s, i) => st.cells.push({ s, c: i + 11, r: 8.6, t: 4900 + i * 90 }));
            [['Rf', 4, 5500], ['Db', 5, 5750], ['Sg', 6, 6000]].forEach(([s, c, t]) => st.cells.push({ s, c, r: 6, t, hot: s === 'Sg' ? 2 : 1 }));
            'Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ').forEach((s, i) => st.cells.push({ s, c: i + 7, r: 6, t: 6300 + i * 60 }));
        }
        const cs = Math.min(W * 0.92 / 18, H * 0.6 / 9.6);
        const gx = W / 2 - 9 * cs;
        const gy = H * 0.5 - 4.8 * cs;
        const sgx = gx + 5.5 * cs;
        const sgy = gy + 6.5 * cs;
        const zm = 1 + 1.1 * smoothstep(6000, 7300, time);
        const zc = smoothstep(6000, 7300, time);
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(zm, zm);
        ctx.translate(-(W / 2 + (sgx - W / 2) * zc), -(H / 2 + (sgy - H / 2) * zc));
        const showSym = cs * zm >= 18;
        st.cells.forEach(cell => {
            const a = smoothstep(cell.t, cell.t + 350, time);
            if (a <= 0) {
                return;
            }
            let row = cell.r;
            let glow = 0;
            if (cell.mv) {
                glow = smoothstep(2300, 2700, time) * (1 - smoothstep(cell.mv + 1100, cell.mv + 1800, time));
                const p = clamp((time - cell.mv) / 1000);
                const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
                row = 6 + (8.6 - 6) * e;
                if (p > 0 && p < 1) {
                    drawGlow(ctx, gx + (cell.c - 0.5) * cs, gy + (row + 0.5) * cs, cs * 1.4, '#4fe08a', 0.5);
                }
            }
            if (cell.hot) {
                glow = Math.max(glow, (1 - smoothstep(cell.t + 300, cell.t + (cell.hot === 2 ? 1e9 : 1500), time)));
            }
            const x = gx + (cell.c - 1) * cs;
            const y = gy + row * cs;
            const big = cell.hot === 2 ? 1 - smoothstep(6000, 6900, time) : 0;
            if (cell.hot === 2) {
                drawGlow(ctx, x + cs / 2, y + cs / 2, cs * (2 + 5 * big), '#4fe08a', (0.5 + 0.5 * big) * fa);
            }
            ctx.globalAlpha = a * fa;
            ctx.fillStyle = glow > 0 ? 'rgba(79,224,138,' + (0.12 + 0.6 * glow) + ')' : 'rgba(120,200,160,.10)';
            ctx.fillRect(x + 0.08 * cs, y + 0.08 * cs, cs * 0.84, cs * 0.84);
            ctx.strokeStyle = glow > 0 ? 'rgba(170,255,200,' + (0.3 + 0.6 * glow) + ')' : 'rgba(120,220,170,.28)';
            ctx.lineWidth = Math.max(0.5, 0.05 * cs);
            ctx.strokeRect(x + 0.08 * cs, y + 0.08 * cs, cs * 0.84, cs * 0.84);
            ctx.globalAlpha = 1;
            if (showSym || glow > 0.2) {
                drawText(ctx, cell.s, x + cs / 2, y + cs / 2 + 0.03 * cs, cs * 0.4, glow > 0.2 ? '#eafff1' : '#9fd8b8', a * fa * (glow > 0.2 ? 1 : 0.55), 700);
            }
        });
        ctx.restore();
        drawText(ctx, 'THE TABLE · 1944', W / 2, H * 0.07, 2.1 * u, '#9fe8bf', smoothstep(300, 900, time) * (1 - smoothstep(2200, 2600, time)), 600, 0.7 * u);
        drawText(ctx, 'SEABORG MOVES THE ACTINIDES', W / 2, H * 0.07, 2.1 * u, '#9fe8bf', smoothstep(2500, 3000, time) * (1 - smoothstep(5600, 6000, time)), 600, 0.7 * u);
        drawText(ctx, 'NAMED FOR A LIVING SCIENTIST', W / 2, H * 0.07, 2.1 * u, '#9fe8bf', smoothstep(6200, 6700, time) * fa, 600, 0.7 * u);
        drawText(ctx, 'GLENN T. SEABORG · 1912–1999', W / 2, H * 0.93, 2 * u, '#9fe8bf', smoothstep(6400, 7000, time) * fa, 600, 0.6 * u);
        const rb = smoothstep(7300, 8000, time);
        drawGlow(ctx, W / 2, H / 2, Math.max(W, H) * 0.7, '#4fe08a', rb * 0.4 * (1 - smoothstep(8000, 9500, time) * 0.4));
        drawCard(ctx, scene, time, 7900, '#effff5', '#4fe08a');
    }
};
// Db: the Transfermium Wars - a split-flap board cycles through every name 105 was given until it settles
CUTSCENES.Db = {
    z: 105, dur: 10000,
    seq: [[700, 'NIELSBOHRIUM', '1968', 'DUBNA'], [1900, 'HAHNIUM', '1970', 'BERKELEY'], [2800, 'NIELSBOHRIUM', '1970', 'DUBNA'], [3400, 'HAHNIUM', '1970', 'BERKELEY'], [4000, 'UNNILPENTIUM', '1978', 'IUPAC · PLACEHOLDER'], [4800, 'JOLIOTIUM', '1994', 'IUPAC'], [5600, 'DUBNIUM', '1997', 'IUPAC · FINAL']],
    snd(audio, start) {
        padChord(audio, start, [77.8, 116.5, 155.6], 6, 0.013, 'sine', 700);
        this.seq.forEach(([t], i) => {
            for (let k = 0; k < 14; k++) {
                playNoise(audio, start + t / 1000 + 0.05 + k * 0.05 + Math.random() * 0.02, 0.014, 0.05, 3500, 2500, 'bandpass', 2, 0.1, 0.001);
            }
            playTone(audio, 196 + i * 18, start + t / 1000 + 0.75, 0.25, 0.012, 'triangle', null, 0.3, 0, 0.004);
        });
        playNoise(audio, start + 6.4, 0.1, 0.08, 8000, 1500, 'highpass', 1, 0.3, 0.002);
        boom(audio, start + 6.4, 0.17, 1.8);
        arp(audio, start + 6.5, [311.1, 392, 466.2, 622.3, 784], 0.11, 0.026, 'sine');
        padChord(audio, start + 7.5, [155.6, 233.1, 311.1, 466.2], 3, 0.02, 'sine', 2400);
        sparkle(audio, start + 7.8, 10, 2, 0.016);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const fa = 1 - smoothstep(7300, 8100, time);
        const bg = ctx.createRadialGradient(W / 2, H * 0.47, 0, W / 2, H * 0.47, Math.max(W, H) * 0.75);
        bg.addColorStop(0, '#13160c');
        bg.addColorStop(1, '#050604');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);
        const seq = this.seq;
        let idx = -1;
        seq.forEach((s, i) => {
            if (time >= s[0]) {
                idx = i;
            }
        });
        const final = idx === seq.length - 1;
        const settle = smoothstep(6350, 6700, time);
        const big = time >= 6400 ? 1 - smoothstep(6400, 7300, time) : 0;
        const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const pad = (s, n) => {
            const l = Math.floor((n - s.length) / 2);
            return (' '.repeat(l) + s + ' '.repeat(n)).slice(0, n);
        };
        const flap = (str, prev, n, cw, ch, x0, y, set, digits) => {
            for (let j = 0; j < n; j++) {
                const x = x0 + j * cw;
                const target = str[j];
                const before = prev ? prev[j] : ' ';
                const tc = idx >= 0 ? seq[idx][0] : 0;
                const dj = 120 + j * 45 + ((j * 7 + set * 13) % 5) * 35;
                const flipping = idx >= 0 && time < tc + dj && (target !== before || target !== ' ');
                let chr = target;
                if (flipping) {
                    const step = Math.floor((time - tc) / 55);
                    const h = (Math.imul(j + 1, 2654435761) ^ Math.imul(step + 1, 40503) ^ Math.imul(set + 1, 9973)) >>> 0;
                    chr = digits ? String(h % 10) : AZ[(h >>> 3) % 26];
                }
                ctx.globalAlpha = A;
                ctx.fillStyle = '#14170e';
                ctx.fillRect(x + 0.06 * cw, y - ch / 2, cw * 0.88, ch);
                ctx.fillStyle = flipping ? '#262b1a' : '#1b1f13';
                ctx.fillRect(x + 0.06 * cw, y - ch / 2, cw * 0.88, ch / 2);
                ctx.globalAlpha = 1;
                const col = final && !flipping ? '#d4ff3a' : '#eaffc0';
                if (chr !== ' ') {
                    drawText(ctx, chr, x + cw / 2, y + ch * 0.03, ch * 0.62, col, A * (flipping ? 0.8 : 1), 700);
                }
                ctx.fillStyle = 'rgba(0,0,0,' + 0.75 * A + ')';
                ctx.fillRect(x + 0.06 * cw, y - 0.04 * ch, cw * 0.88, Math.max(1, 0.05 * ch));
            }
        };
        const N = 12;
        const cw = Math.min(W * 0.88 / N, H * 0.075);
        const ch = cw * 1.45;
        const by = H * 0.47;
        const ba = smoothstep(0, 600, time) * fa;
        const A = ba;
        drawGlow(ctx, W / 2, by, W * 0.5, '#c6f03a', (0.12 + 0.5 * settle * (final ? 1 : 0) * (0.5 + big)) * ba);
        const cur = idx >= 0 ? seq[idx] : [0, '', '    ', ''];
        const prv = idx > 0 ? seq[idx - 1] : [0, '', '    ', ''];
        flap(pad(cur[1], N), pad(prv[1], N), N, cw, ch, W / 2 - N * cw / 2, by, idx + 1, false);
        const yw = cw * 0.8;
        flap(cur[2].padEnd(4), prv[2].padEnd(4), 4, yw, yw * 1.45, W / 2 - 2 * yw, by - ch * 1.6, idx + 7, true);
        if (idx >= 0) {
            drawText(ctx, cur[3], W / 2, by + ch * 1.15, 2 * u, final ? '#d4ff3a' : '#c8d8a0', smoothstep(cur[0] + 600, cur[0] + 900, time) * fa, 600, 0.6 * u);
        }
        drawText(ctx, 'THE TRANSFERMIUM WARS', W / 2, H * 0.07, 2.1 * u, '#c8e88a', smoothstep(300, 900, time) * (1 - smoothstep(5600, 6000, time)), 600, 0.7 * u);
        drawText(ctx, 'ONE ELEMENT · FIVE NAMES', W / 2, H * 0.07, 2.1 * u, '#c8e88a', smoothstep(6300, 6800, time) * fa, 600, 0.7 * u);
        drawText(ctx, 'NAMED FOR DUBNA', W / 2, H * 0.93, 2 * u, '#c8e88a', smoothstep(6500, 7100, time) * fa, 600, 0.6 * u);
        const rb = smoothstep(7300, 8000, time);
        drawGlow(ctx, W / 2, H / 2, Math.max(W, H) * 0.7, '#c6f03a', rb * 0.4 * (1 - smoothstep(8000, 9500, time) * 0.4));
        drawCard(ctx, scene, time, 7900, '#f8ffe6', '#c6f03a');
    }
};
