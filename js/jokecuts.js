// cutscenes for the joke elements
// Um: a serious build-up, then a party popper
CUTSCENES.Um = {
    z: 0, dur: 8200,
    snd(audio, start) {
        padChord(audio, start, [55, 82.4], 3.4, 0.014, 'sine', 500);
        [0.8, 1.6, 2.2, 2.7, 3.05, 3.3].forEach(x => playTone(audio, 880, start + x, 0.08, 0.02, 'sine', null, 0.3));
        playNoise(audio, start + 3.6, 0.25, 0.12, 3000, 400, 'bandpass', 1, 0.2, 0.002);
        [523.3, 659.3, 784, 1046.5].forEach((f, i) => playTone(audio, f, start + 3.7 + i * 0.11, 0.18, 0.03, 'square', null, 0.2, 0, 0.005));
        sparkle(audio, start + 3.7, 14, 1.6, 0.02);
        padChord(audio, start + 4.3, [261.6, 329.6, 392], 2.8, 0.016, 'triangle', 2400);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const cx = W / 2;
        const cy = H / 2;
        const st = scene.state;
        if (!st.c) {
            const r = seededRandom(7);
            const cols = ['#ff5d7a', '#ffd166', '#5eead4', '#7cc8ff', '#b39dff', '#f78fd8'];
            st.c = Array.from({ length: 140 }, () => {
                const a = -Math.PI / 2 + (r() - 0.5) * 2.6;
                const v = (0.5 + r() * 1.2) * u;
                return [Math.cos(a) * v, Math.sin(a) * v, cols[Math.floor(r() * cols.length)], r() * TAU, r() * 0.02 + 0.005, r() < 0.3];
            });
        }
        const pop = 3600;
        const b = smoothstep(0, 3200, time);
        const after = time >= pop;
        ctx.fillStyle = after ? '#2b1640' : '#04070d';
        ctx.fillRect(0, 0, W, H);
        if (!after) {
            // same opening as the real cutscenes
            const shake = smoothstep(2600, pop, time) * 0.8 * u * (calmFx ? 0.3 : 1);
            const sx = Math.sin(time / 23) * shake;
            drawGlow(ctx, cx + sx, cy, 40 * u * (0.6 + 0.4 * b), '#2d6bff', 0.6 * b);
            ctx.fillStyle = '#9cc4ff';
            ctx.beginPath();
            ctx.arc(cx + sx, cy, (3 + 2 * b + Math.sin(time / 180) * 0.4) * u, 0, TAU);
            ctx.fill();
            drawText(ctx, 'INITIATING SEQUENCE', cx, H - 6 * u, 2.2 * u, '#7aa7ff', b * (0.6 + 0.4 * Math.sin(time / 300)), 600, 0.6 * u);
            return;
        }
        const d = time - pop;
        drawGlow(ctx, cx, cy, 70 * u, '#ff9a5c', 0.5 * (1 - smoothstep(0, 1200, d)));
        // confetti
        st.c.forEach(([vx, vy, col, a0, spin, strip]) => {
            const x = cx + vx * d / 16;
            const y = cy + vy * d / 16 + 0.00006 * u * d * d;
            if (y > H + 4 * u) {
                return;
            }
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(a0 + d * spin);
            ctx.fillStyle = col;
            ctx.globalAlpha = 1 - smoothstep(3200, 4400, d);
            if (strip) {
                ctx.fillRect(-0.3 * u, -1.6 * u, 0.6 * u, 3.2 * u);
            } else {
                ctx.fillRect(-0.7 * u, -0.45 * u, 1.4 * u, 0.9 * u);
            }
            ctx.restore();
        });
        const k = easeOutCubic(d / 500);
        const bounce = 1 + 0.12 * Math.sin(d / 70) * (1 - smoothstep(0, 900, d));
        const out = 1 - smoothstep(2000, 2500, d);
        drawText(ctx, 'SURPRISE!', cx, cy - 4 * u, 12 * u * k * bounce, '#ffd166', out, 800, 0.4 * u);
        drawCard(ctx, scene, time, 6000, '#ffd166', '#ff5d7a');
    }
};
// Zz: a sleeping atom ignores a poke and an alarm clock, then jolts awake
CUTSCENES.Zz = {
    z: 0, dur: 8600,
    snd(audio, start) {
        for (let x = 0.2; x < 5; x += 1.3) {
            playNoise(audio, start + x, 0.7, 0.03, 180, 420, 'lowpass', 4, 0.1, 0.3);
        }
        playTone(audio, 900, start + 1.6, 0.06, 0.03, 'triangle', 700, 0.1);
        for (let i = 0; i < 16; i++) {
            playTone(audio, i % 2 ? 1320 : 1480, start + 3 + i * 0.09, 0.07, 0.02, 'square', null, 0.15, 0, 0.003);
        }
        riser(audio, start + 4.7, 0.6, 0.03, 200, 1800);
        boom(audio, start + 5.3, 0.06, 0.8);
        sparkle(audio, start + 5.35, 10, 1.2, 0.02);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const cx = W / 2;
        const cy = H / 2 + 4 * u;
        const wake = 5300;
        const up = time >= wake;
        const d = time - wake;
        ctx.fillStyle = up ? '#14243a' : '#070b1a';
        ctx.fillRect(0, 0, W, H);
        const fade = 1 - smoothstep(6200, 6800, time);
        drawGlow(ctx, cx, cy, 30 * u, up ? '#7cc8ff' : '#3b4b8f', (up ? 0.7 * (1 - smoothstep(0, 1500, d)) + 0.3 : 0.35) * fade);
        ctx.globalAlpha = fade;
        // a poke and a wobble
        const poke = smoothstep(1300, 1600, time) * (1 - smoothstep(1700, 2000, time));
        const wob = Math.sin(time / 40) * Math.max(0, 1 - Math.abs(time - 1650) / 400) * u;
        // the alarm clock rattles to the side
        const ring = time > 3000 && time < 4500;
        const shake = ring ? Math.sin(time / 18) * 0.6 * u * (calmFx ? 0.4 : 1) : 0;
        const jolt = up ? Math.sin(d / 25) * 2 * u * (1 - smoothstep(0, 500, d)) * (calmFx ? 0.3 : 1) : 0;
        const x = cx + wob + jolt;
        // orbits, slow while asleep
        const spin = up ? time / 140 : time / 1400;
        ctx.strokeStyle = 'rgba(150,180,255,0.35)';
        ctx.lineWidth = 0.3 * u;
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.ellipse(x, cy, 14 * u, 5 * u, i * 1.2 - 0.6, 0, TAU);
            ctx.stroke();
            const a = spin * (i ? 1.3 : 1) + i;
            const ex = Math.cos(a) * 14 * u;
            const ey = Math.sin(a) * 5 * u;
            const r = i * 1.2 - 0.6;
            ctx.fillStyle = '#bcd2ff';
            ctx.beginPath();
            ctx.arc(x + ex * Math.cos(r) - ey * Math.sin(r), cy + ex * Math.sin(r) + ey * Math.cos(r), 0.9 * u, 0, TAU);
            ctx.fill();
        }
        ctx.fillStyle = up ? '#9fd3ff' : '#6d7fc4';
        ctx.beginPath();
        ctx.arc(x, cy, 6 * u, 0, TAU);
        ctx.fill();
        // eyes
        ctx.strokeStyle = '#0b1230';
        ctx.fillStyle = '#0b1230';
        ctx.lineWidth = 0.5 * u;
        [-1, 1].forEach(s => {
            ctx.beginPath();
            if (up) {
                ctx.arc(x + s * 2 * u, cy - 0.8 * u, 1.1 * u, 0, TAU);
                ctx.fill();
            } else {
                ctx.arc(x + s * 2 * u, cy - 1.2 * u, 1 * u, 0.2, Math.PI - 0.2);
                ctx.stroke();
            }
        });
        // z's drift up while it sleeps
        if (!up) {
            for (let i = 0; i < 4; i++) {
                const p = ((time / 2200 + i / 4) % 1);
                const big = ring ? 1.6 : 1;
                drawText(ctx, 'z', x + 6 * u + p * 10 * u, cy - 6 * u - p * 22 * u, (2 + 3 * p) * u * big, '#9aa8ff', Math.sin(p * Math.PI) * 0.9, 700);
            }
        } else {
            drawText(ctx, '!', x, cy - 14 * u, 8 * u * easeOutCubic(d / 300), '#ffd166', 1 - smoothstep(1200, 1700, d), 800);
        }
        ctx.globalAlpha = 1;
        // the finger
        if (poke > 0) {
            ctx.fillStyle = '#f2c7a5';
            ctx.beginPath();
            ctx.roundRect(cx - 30 * u + poke * 16 * u, cy - u, 14 * u, 2.6 * u, 1.3 * u);
            ctx.fill();
            drawText(ctx, 'poke', cx - 20 * u, cy - 6 * u, 2.4 * u, '#f2c7a5', poke, 600);
        }
        // the clock
        const ca = smoothstep(2700, 3000, time) * (1 - smoothstep(4500, 4900, time));
        if (ca > 0) {
            const kx = W * 0.78 + shake;
            const ky = cy - 2 * u;
            ctx.globalAlpha = ca;
            ctx.fillStyle = '#d14d4d';
            ctx.beginPath();
            ctx.arc(kx, ky, 6 * u, 0, TAU);
            ctx.fill();
            [-1, 1].forEach(s => {
                ctx.beginPath();
                ctx.arc(kx + s * 4.5 * u, ky - 5.5 * u, 2 * u, 0, TAU);
                ctx.fill();
            });
            ctx.fillStyle = '#f6efe3';
            ctx.beginPath();
            ctx.arc(kx, ky, 4.6 * u, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 0.4 * u;
            ctx.beginPath();
            ctx.moveTo(kx, ky);
            ctx.lineTo(kx, ky - 3.2 * u);
            ctx.moveTo(kx, ky);
            ctx.lineTo(kx + 2.2 * u, ky);
            ctx.stroke();
            ctx.globalAlpha = 1;
            if (ring) {
                drawText(ctx, 'RING RING', kx, ky - 11 * u, 2.6 * u, '#ff8a8a', 0.6 + 0.4 * Math.sin(time / 50), 700, 0.3 * u);
            }
        }
        drawCard(ctx, scene, time, 6600, '#9fd3ff', '#3b6bff');
    }
};
// Mu: nothing happens, slowly, then a very small ding
CUTSCENES.Mu = {
    z: 0, dur: 8200,
    snd(audio, start) {
        for (let i = 0; i < 12; i++) {
            playTone(audio, 220, start + 1 + i * 0.38, 0.03, 0.008, 'sine', null, 0.05);
        }
        playTone(audio, 1568, start + 5.7, 0.5, 0.012, 'sine', null, 0.4);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const cx = W / 2;
        const cy = H / 2;
        const dim = smoothstep(5900, 6400, time);
        const g = Math.round(232 - 160 * dim);
        ctx.fillStyle = 'rgb(' + g + ',' + (g - 6) + ',' + (g - 20) + ')';
        ctx.fillRect(0, 0, W, H);
        const a = smoothstep(200, 900, time) * (1 - dim);
        ctx.globalAlpha = a;
        ctx.fillStyle = '#9b978d';
        ctx.fillRect(cx - 7 * u, cy - 14 * u, 14 * u, 14 * u);
        ctx.globalAlpha = 1;
        drawText(ctx, 'A grey square', cx, cy + 5 * u, 2.4 * u, '#6f6b62', a, 500);
        // a loading bar that takes its time
        const p = Math.floor(smoothstep(1000, 5500, time) * 12) / 12;
        ctx.globalAlpha = a;
        ctx.strokeStyle = '#8c887e';
        ctx.lineWidth = 0.3 * u;
        ctx.strokeRect(cx - 20 * u, cy + 11 * u, 40 * u, 2.4 * u);
        ctx.fillStyle = '#a9a59a';
        ctx.fillRect(cx - 20 * u, cy + 11 * u, 40 * u * p, 2.4 * u);
        ctx.globalAlpha = 1;
        const blip = time > 3900 && time < 4100;
        drawText(ctx, 'Excitement: ' + (blip ? '1' : '0') + '%', cx, cy + 18 * u, 2 * u, '#6f6b62', a, 500);
        // the ding
        const ding = time - 5700;
        if (ding > 0 && ding < 700) {
            const k = 1 - ding / 700;
            ctx.strokeStyle = 'rgba(120,116,106,' + k + ')';
            ctx.lineWidth = 0.25 * u;
            ctx.beginPath();
            ctx.arc(cx + 7 * u, cy - 14 * u, (1 + ding / 120) * u, 0, TAU);
            ctx.stroke();
            drawText(ctx, 'ding', cx + 12 * u, cy - 18 * u, 1.8 * u, '#6f6b62', k, 500);
        }
        drawCard(ctx, scene, time, 6500, '#d8d2c4', '#8f8a7e');
    }
};
// Ln: a torch searches the lab and it's in the last drawer
CUTSCENES.Ln = {
    z: 0, dur: 9000,
    snd(audio, start) {
        [0.6, 1.4, 2.1].forEach(x => playNoise(audio, start + x, 0.12, 0.02, 600, 300, 'lowpass', 1, 0.1));
        [2.9, 3.6, 4.3, 5].forEach(x => playNoise(audio, start + x, 0.22, 0.035, 900, 400, 'bandpass', 2, 0.15));
        playNoise(audio, start + 5.8, 0.3, 0.04, 900, 400, 'bandpass', 2, 0.15);
        sparkle(audio, start + 6.1, 12, 1.4, 0.022);
        padChord(audio, start + 6.2, [293.7, 370, 440], 2.6, 0.016, 'triangle', 2600);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const found = 6100;
        const lit = smoothstep(found, found + 700, time);
        ctx.fillStyle = '#2a2420';
        ctx.fillRect(0, 0, W, H);
        // shelf and bottles
        ctx.fillStyle = '#4a3b30';
        ctx.fillRect(W * 0.08, H * 0.3, W * 0.36, 1.2 * u);
        ['#5aa', '#a75', '#7a5', '#99c'].forEach((c, i) => {
            ctx.fillStyle = c;
            ctx.fillRect(W * 0.1 + i * 7 * u, H * 0.3 - 7 * u, 4 * u, 7 * u);
        });
        // bench and drawers
        const top = H * 0.6;
        ctx.fillStyle = '#5a4637';
        ctx.fillRect(W * 0.05, top, W * 0.9, 2 * u);
        const dw = W * 0.15;
        const opens = [2900, 3600, 4300, 5000, 5800];
        for (let i = 0; i < 5; i++) {
            const x = W * 0.12 + i * (dw + W * 0.0125);
            const o = smoothstep(opens[i], opens[i] + 300, time) * (i < 4 ? 1 - smoothstep(opens[i] + 600, opens[i] + 900, time) : 1);
            ctx.fillStyle = '#3d3029';
            ctx.fillRect(x, top + 4 * u, dw, 12 * u);
            ctx.fillStyle = '#6b5544';
            ctx.fillRect(x + 0.4 * u, top + 4.4 * u + o * 6 * u, dw - 0.8 * u, 11 * u);
            ctx.fillStyle = '#c9a66b';
            ctx.fillRect(x + dw / 2 - 2 * u, top + 9 * u + o * 6 * u, 4 * u, 0.8 * u);
            if (o > 0.5 && i < 4) {
                drawText(ctx, 'empty', x + dw / 2, top + 22 * u, 2 * u, '#cdbba3', (o - 0.5) * 2, 500);
            }
            if (i === 4 && o > 0) {
                drawGlow(ctx, x + dw / 2, top + 6 * u, 18 * u, '#7cf2c7', o * (0.7 + 0.2 * Math.sin(time / 150)));
            }
        }
        // the torch beam goes everywhere first
        const path = [[0, W * 0.2, H * 0.2], [900, W * 0.25, H * 0.24], [1600, W * 0.7, H * 0.4], [2300, W * 0.5, H * 0.85],
            [2900, W * 0.12 + dw / 2, top + 10 * u], [3600, W * 0.12 + 1.08 * dw + dw / 2, top + 10 * u], [4300, W * 0.12 + 2.17 * dw + dw / 2, top + 10 * u],
            [5000, W * 0.12 + 3.25 * dw + dw / 2, top + 10 * u], [5800, W * 0.12 + 4.33 * dw + dw / 2, top + 10 * u]];
        let bx = path[0][1];
        let by = path[0][2];
        for (let i = 1; i < path.length; i++) {
            const k = smoothstep(path[i - 1][0], path[i][0], time);
            if (k > 0) {
                bx = path[i - 1][1] + (path[i][1] - path[i - 1][1]) * k;
                by = path[i - 1][2] + (path[i][2] - path[i - 1][2]) * k;
            }
        }
        const dark = ctx.createRadialGradient(bx, by, 0, bx, by, 20 * u);
        dark.addColorStop(0, 'rgba(0,0,0,0)');
        dark.addColorStop(0.75, 'rgba(0,0,0,' + 0.55 * (1 - lit) + ')');
        dark.addColorStop(1, 'rgba(0,0,0,' + 0.93 * (1 - lit) + ')');
        ctx.fillStyle = dark;
        ctx.fillRect(0, 0, W, H);
        const out = 1 - smoothstep(6800, 7300, time);
        [[1200, W * 0.25, H * 0.12], [2000, W * 0.7, H * 0.28], [2600, W * 0.5, H * 0.72]].forEach(([t, x, y]) => {
            drawText(ctx, '?', x, y, 5 * u, '#ffe08a', smoothstep(t - 300, t, time) * (1 - smoothstep(t + 500, t + 900, time)), 800);
        });
        drawText(ctx, 'FOUND IT', W / 2, H * 0.18, 5 * u * easeOutCubic((time - found) / 400), '#7cf2c7', lit * out, 800, 0.5 * u);
        if (time > 6900) {
            ctx.fillStyle = 'rgba(8,14,12,' + smoothstep(6900, 7500, time) * 0.95 + ')';
            ctx.fillRect(0, 0, W, H);
        }
        // and up it comes
        if (time > found) {
            const k = easeOutCubic((time - found - 200) / 1100);
            const ox = path[8][1] + (W / 2 - path[8][1]) * k;
            const oy = top + 6 * u + (H / 2 - top - 6 * u) * k;
            const fa = 1 - smoothstep(7300, 7900, time);
            drawGlow(ctx, ox, oy, 16 * u, '#7cf2c7', 0.9 * fa);
            ctx.globalAlpha = fa;
            ctx.fillStyle = '#d9fff1';
            ctx.beginPath();
            ctx.arc(ox, oy, 2.2 * u, 0, TAU);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        drawCard(ctx, scene, time, 7300, '#7cf2c7', '#2bb58a');
    }
};
// Df: the reaction gets to 99%, then gets moved to tomorrow
CUTSCENES.Df = {
    z: 0, dur: 8800,
    snd(audio, start) {
        for (let i = 0; i < 14; i++) {
            playTone(audio, 400 + i * 40, start + 0.3 + i * 0.13, 0.05, 0.014, 'square', null, 0.1, 0, 0.003);
        }
        for (let x = 2.4; x < 4.4; x += 0.5) {
            playTone(audio, 1800, start + x, 0.02, 0.015, 'sine', null, 0.1, 0, 0.001);
        }
        playNoise(audio, start + 4.9, 0.25, 0.04, 4000, 1500, 'highpass', 1, 0.2);
        playTone(audio, 392, start + 5.4, 0.45, 0.03, 'triangle', 370, 0.2);
        playTone(audio, 349, start + 5.9, 0.9, 0.03, 'triangle', 311, 0.25);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const cx = W / 2;
        const cy = H / 2;
        ctx.fillStyle = '#16191f';
        ctx.fillRect(0, 0, W, H);
        const ui = smoothstep(0, 500, time) * (1 - smoothstep(4000, 4400, time));
        const p = Math.min(0.99, smoothstep(300, 2200, time) * 0.99);
        drawText(ctx, p >= 0.99 ? 'REACTING… ALMOST' : 'REACTING…', cx, cy - 8 * u, 3 * u, '#ffb547', ui, 700, 0.5 * u);
        ctx.globalAlpha = ui;
        ctx.strokeStyle = '#ffb547';
        ctx.lineWidth = 0.4 * u;
        ctx.strokeRect(cx - 25 * u, cy - 2 * u, 50 * u, 4 * u);
        ctx.fillStyle = '#ffb547';
        ctx.fillRect(cx - 25 * u, cy - 2 * u, 50 * u * p, 4 * u);
        ctx.globalAlpha = 1;
        drawText(ctx, Math.floor(p * 100) + '%', cx, cy + 7 * u, 2.6 * u, '#ffd9a0', ui, 600);
        if (p >= 0.99 && ui > 0) {
            const a = time / 120;
            for (let i = 0; i < 8; i++) {
                ctx.fillStyle = 'rgba(255,181,71,' + ((i / 8) * ui) + ')';
                ctx.beginPath();
                ctx.arc(cx + 30 * u + Math.cos(a + i * 0.785) * 2 * u, cy + Math.sin(a + i * 0.785) * 2 * u, 0.5 * u, 0, TAU);
                ctx.fill();
            }
        }
        // the calendar
        const ca = smoothstep(4200, 4600, time) * (1 - smoothstep(6400, 6900, time));
        if (ca > 0) {
            const flip = smoothstep(4900, 5300, time);
            const day = (sheet, label, n) => {
                ctx.fillStyle = '#f4efe6';
                ctx.fillRect(sheet[0], sheet[1], 22 * u, 24 * u);
                ctx.fillStyle = '#d14d4d';
                ctx.fillRect(sheet[0], sheet[1], 22 * u, 6 * u);
                drawText(ctx, label, sheet[0] + 11 * u, sheet[1] + 3 * u, 2.4 * u, '#fff', ca, 700, 0.3 * u);
                drawText(ctx, n, sheet[0] + 11 * u, sheet[1] + 15 * u, 10 * u, '#2a2a2a', ca, 800);
            };
            ctx.globalAlpha = ca;
            day([cx - 11 * u, cy - 14 * u], 'TOMORROW', '13');
            // today's page tears away
            if (flip < 1) {
                ctx.save();
                ctx.translate(cx, cy - 14 * u);
                ctx.rotate(-flip * 0.5);
                ctx.translate(-flip * 30 * u, -flip * 20 * u);
                ctx.globalAlpha = ca * (1 - flip);
                day([-11 * u, 0], 'TODAY', '12');
                ctx.restore();
            }
            ctx.globalAlpha = 1;
            drawText(ctx, 'Reaction rescheduled', cx, cy + 16 * u, 3 * u, '#ffb547', ca * smoothstep(5300, 5600, time), 700, 0.3 * u);
        }
        drawCard(ctx, scene, time, 7000, '#ffb547', '#c46a1a');
    }
};
// Cz: a coffee lands on the periodic table and the neighbours get the jitters
CUTSCENES.Cz = {
    z: 0, dur: 8600,
    snd(audio, start) {
        playTone(audio, 2100, start + 1.6, 0.15, 0.03, 'sine', null, 0.3, 0, 0.002);
        playNoise(audio, start + 1.6, 0.3, 0.04, 2500, 800, 'bandpass', 1, 0.2);
        riser(audio, start + 1.8, 3.6, 0.02, 60, 240);
        for (let x = 2; x < 5.4; x += 0.3 - (x - 2) * 0.06) {
            playNoise(audio, start + x, 0.06, 0.01 + (x - 2) * 0.008, 3000, 1500, 'bandpass', 3, 0.05, 0.002);
        }
        playTone(audio, 1318.5, start + 5.6, 0.6, 0.02, 'sine', null, 0.4);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const cx = W / 2;
        const cy = H / 2;
        const st = scene.state;
        if (!st.r) {
            st.r = seededRandom(48);
        }
        ctx.fillStyle = '#1c130e';
        ctx.fillRect(0, 0, W, H);
        const land = 1600;
        const stop = 5600;
        const fade = 1 - smoothstep(6200, 6700, time);
        // the table
        const s = Math.min(W / 21, H / 11);
        const ox = cx - 9 * s;
        const oy = cy - 3.5 * s;
        const spread = smoothstep(land, 5200, time) * 14 * s;
        const buzz = time > land && time < stop ? 1 : 0;
        const calm = calmFx ? 0.35 : 1;
        Object.keys(tableLayout).forEach(sym => {
            const [r, c] = tableLayout[sym];
            if (r > 7) {
                return;
            }
            const x = ox + (c - 1) * s;
            const y = oy + (r - 1) * s;
            const dist = Math.hypot(x - cx, y - cy);
            const j = buzz * clamp(1 - dist / (spread + 0.01)) * 0.18 * s * calm;
            const jx = (st.r() - 0.5) * 2 * j;
            const jy = (st.r() - 0.5) * 2 * j;
            ctx.globalAlpha = fade;
            ctx.fillStyle = j > 0.02 * s ? '#a8683a' : '#4a3326';
            ctx.fillRect(x + jx + 0.06 * s, y + jy + 0.06 * s, 0.88 * s, 0.88 * s);
            ctx.globalAlpha = 1;
            drawText(ctx, sym, x + jx + 0.5 * s, y + jy + 0.52 * s, 0.38 * s, '#f1d9bf', fade * 0.8, 600);
        });
        // the cup drops in
        const fall = smoothstep(800, land, time);
        const cupY = -10 * u + (cy - 2 * u + 10 * u) * fall * fall;
        const shake = buzz * 0.5 * u * calm * smoothstep(land, 5200, time);
        const kx = cx + (st.r() - 0.5) * shake;
        ctx.globalAlpha = fade;
        ctx.fillStyle = '#f4efe6';
        ctx.beginPath();
        ctx.moveTo(kx - 4 * u, cupY - 4 * u);
        ctx.lineTo(kx + 4 * u, cupY - 4 * u);
        ctx.lineTo(kx + 3 * u, cupY + 3 * u);
        ctx.lineTo(kx - 3 * u, cupY + 3 * u);
        ctx.fill();
        ctx.strokeStyle = '#f4efe6';
        ctx.lineWidth = 0.7 * u;
        ctx.beginPath();
        ctx.arc(kx + 4.4 * u, cupY - 0.5 * u, 1.6 * u, -1.3, 1.3);
        ctx.stroke();
        ctx.fillStyle = '#5b3418';
        ctx.fillRect(kx - 3.6 * u, cupY - 4 * u, 7.2 * u, 0.9 * u);
        ctx.globalAlpha = 1;
        // steam
        if (time > land) {
            for (let i = 0; i < 3; i++) {
                const p = (time / 1400 + i / 3) % 1;
                drawGlow(ctx, kx + (i - 1) * 2 * u + Math.sin(p * 6 + i) * u, cupY - 6 * u - p * 10 * u, 2.4 * u, '#ffffff', 0.25 * Math.sin(p * Math.PI) * fade);
            }
        }
        drawText(ctx, 'JITTERY', cx, H - 6 * u, 3.2 * u, '#e0a56a', smoothstep(3500, 4000, time) * (1 - smoothstep(stop, stop + 300, time)), 800, 0.8 * u);
        drawCard(ctx, scene, time, 6700, '#e0a56a', '#7a4a24');
    }
};
// Mb: flickers in and out of a box until something looks at it
CUTSCENES.Mb = {
    z: 0, dur: 8400,
    snd(audio, start) {
        for (let i = 0; i < 20; i++) {
            playTone(audio, i % 2 ? 660 : 440, start + 0.8 + i * 0.14, 0.1, 0.012, 'sine', null, 0.3);
        }
        playNoise(audio, start + 3.7, 0.3, 0.02, 500, 2000, 'bandpass', 2, 0.2);
        boom(audio, start + 4.3, 0.04, 0.6);
        sparkle(audio, start + 4.35, 12, 1.4, 0.02);
        padChord(audio, start + 4.4, [277.2, 349.2, 415.3], 2.6, 0.016, 'triangle', 2400);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const cx = W / 2;
        const cy = H / 2 + 3 * u;
        const st = scene.state;
        if (!st.r) {
            st.r = seededRandom(5);
            st.on = 0;
            st.next = 0;
        }
        const look = 4300;
        const seen = time >= look;
        ctx.fillStyle = '#120a22';
        ctx.fillRect(0, 0, W, H);
        const fade = 1 - smoothstep(6000, 6500, time);
        // in, out, in, out
        if (!seen && time > st.next) {
            st.on = st.r() < 0.5 ? 0 : 1;
            st.next = time + 90 + st.r() * 220;
        }
        const here = seen ? 1 : time > 800 ? st.on : 0;
        drawGlow(ctx, cx, cy, (seen ? 20 : 12) * u, '#b48cff', here * (seen ? 0.9 - 0.4 * smoothstep(look, look + 1200, time) : 0.7) * fade);
        if (here) {
            ctx.globalAlpha = fade * (calmFx && !seen ? 0.6 : 1);
            ctx.fillStyle = '#e6d8ff';
            ctx.beginPath();
            ctx.arc(cx, cy, 2.6 * u, 0, TAU);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        // the box, whose sides drop once it's been seen
        const open = smoothstep(look, look + 700, time);
        ctx.strokeStyle = 'rgba(201,167,255,' + 0.8 * fade + ')';
        ctx.lineWidth = 0.4 * u;
        const b = 9 * u;
        ctx.strokeRect(cx - b, cy + b - 0.2 * u, 2 * b, 0.4 * u);
        [[-1, 0], [1, 0]].forEach(([s]) => {
            ctx.save();
            ctx.translate(cx + s * b, cy + b);
            ctx.rotate(s * open * 1.4);
            ctx.strokeRect(-0.2 * u, -2 * b, 0.4 * u, 2 * b);
            ctx.restore();
        });
        ctx.save();
        ctx.translate(cx, cy - b - open * 8 * u);
        ctx.rotate(open * 0.3);
        ctx.globalAlpha = 1 - open;
        ctx.strokeRect(-b, -0.2 * u, 2 * b, 0.4 * u);
        ctx.restore();
        // the eye
        const ea = smoothstep(3500, 3800, time) * (1 - smoothstep(5200, 5600, time));
        if (ea > 0) {
            const lid = smoothstep(3700, 4200, time);
            const ex = cx;
            const ey = cy - 22 * u;
            ctx.globalAlpha = ea;
            ctx.fillStyle = '#f4efe6';
            ctx.beginPath();
            ctx.ellipse(ex, ey, 7 * u, 3.5 * u * lid + 0.1, 0, 0, TAU);
            ctx.fill();
            ctx.fillStyle = '#4a2d8a';
            ctx.beginPath();
            ctx.arc(ex, ey + (seen ? 0.8 * u : 0), 2.2 * u * lid, 0, TAU);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        drawText(ctx, 'EXISTS: ' + (seen ? 'YES' : here ? 'MAYBE' : 'MAYBE NOT'), cx, H - 6 * u, 2.6 * u, '#c9a7ff', smoothstep(800, 1200, time) * (1 - smoothstep(5600, 6000, time)), 700, 0.5 * u);
        drawCard(ctx, scene, time, 6400, '#c9a7ff', '#6b3fd1');
    }
};
// Dj: the same discovery plays, rewinds, plays again, rewinds...
CUTSCENES.Dj = {
    z: 0, dur: 9000,
    snd(audio, start) {
        [0, 2.4, 4.8].forEach((x, i) => {
            playNoise(audio, start + x + 0.2, 0.8, 0.02, 400, 2400, 'bandpass', 1, 0.2, 0.3);
            playTone(audio, 1046.5 - i * 60, start + x + 1, 0.5, 0.025, 'sine', null, 0.4);
        });
        [1.8, 4.2].forEach(x => {
            riser(audio, start + x, 0.55, 0.02, 2400, 300);
            playNoise(audio, start + x, 0.55, 0.025, 6000, 3000, 'highpass', 1, 0.05);
        });
        padChord(audio, start + 7, [311.1, 392, 466.2], 2, 0.016, 'triangle', 2400);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const cx = W / 2;
        const cy = H / 2;
        const st = scene.state;
        if (!st.r) {
            st.r = seededRandom(19);
        }
        const takes = [[0, 1800, 'A new discovery!'], [2400, 4200, 'A new discovery?'], [4800, 6600, 'A new discovery…?']];
        const rewinds = [[1800, 2400], [4200, 4800]];
        ctx.fillStyle = '#140a1c';
        ctx.fillRect(0, 0, W, H);
        let t = -1;
        let take = 0;
        takes.forEach(([a, b], i) => {
            if (time >= a && time < b) {
                t = time - a;
                take = i;
            }
        });
        rewinds.forEach(([a, b], i) => {
            if (time >= a && time < b) {
                // running it backwards
                t = 1800 * (1 - (time - a) / (b - a));
                take = i;
            }
        });
        const rw = rewinds.some(([a, b]) => time >= a && time < b);
        if (t >= 0) {
            const k = smoothstep(0, 900, t);
            const x = cx - 30 * u * (1 - k);
            drawGlow(ctx, x, cy, (8 + 10 * smoothstep(900, 1100, t)) * u, '#ff9ce6', 0.7);
            ctx.fillStyle = '#ffe3f7';
            ctx.beginPath();
            ctx.arc(x, cy, 2.4 * u, 0, TAU);
            ctx.fill();
            drawText(ctx, takes[take][2], cx, cy + 12 * u, 3.4 * u, '#ff9ce6', smoothstep(1000, 1300, t), 800, 0.3 * u);
            if (take === 2) {
                drawText(ctx, "Haven't we done this before?", cx, cy + 18 * u, 2.2 * u, '#e6c9f2', smoothstep(1300, 1600, t), 500);
            }
        }
        if (rw) {
            const n = calmFx ? 0.35 : 1;
            for (let i = 0; i < 14; i++) {
                const y = st.r() * H;
                ctx.fillStyle = 'rgba(255,255,255,' + 0.08 * n + ')';
                ctx.fillRect(0, y, W, st.r() * 1.2 * u);
            }
            ctx.fillStyle = 'rgba(255,255,255,' + 0.12 * n + ')';
            ctx.fillRect(0, (time * 0.8) % H, W, 3 * u);
            drawText(ctx, '◀◀ REWIND', 12 * u, 6 * u, 2.6 * u, '#ffffff', 0.85, 700, 0.3 * u);
        }
        const out = smoothstep(6600, 7000, time);
        if (out > 0) {
            ctx.fillStyle = 'rgba(20,10,28,' + out + ')';
            ctx.fillRect(0, 0, W, H);
        }
        drawCard(ctx, scene, time, 7000, '#ff9ce6', '#8a3bd1');
    }
};
// Ha: half of it decays, then half of what's left, and so on forever
CUTSCENES.Ha = {
    z: 0, dur: 8600,
    snd(audio, start) {
        for (let i = 0; i < 7; i++) {
            playTone(audio, 1200 * Math.pow(0.85, i), start + 0.8 + i * 0.72, 0.25, 0.022, 'triangle', 600 * Math.pow(0.85, i), 0.3);
            playNoise(audio, start + 0.8 + i * 0.72, 0.15, 0.012, 3000, 900, 'bandpass', 1, 0.2);
        }
        padChord(audio, start + 6.4, [349.2, 440, 523.3], 2, 0.014, 'triangle', 2400);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const cx = W / 2;
        const cy = H / 2 - 2 * u;
        const step = 720;
        const first = 800;
        const n = Math.max(0, Math.min(7, Math.floor((time - first) / step) + 1));
        ctx.fillStyle = '#081a12';
        ctx.fillRect(0, 0, W, H);
        const fade = 1 - smoothstep(6500, 7000, time);
        const r0 = 12 * u;
        // the halves that leave
        for (let i = 0; i < n; i++) {
            const d = time - first - i * step;
            const r = r0 * Math.sqrt(Math.pow(0.5, i));
            const s = i % 2 ? -1 : 1;
            const a = (1 - smoothstep(0, 900, d)) * fade;
            if (a <= 0) {
                continue;
            }
            ctx.save();
            ctx.globalAlpha = a * 0.8;
            ctx.translate(cx + s * (r * 0.4 + d * 0.03 * u), cy + d * 0.012 * u);
            ctx.rotate(s * d / 900);
            ctx.fillStyle = '#3fbf7f';
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.71, s > 0 ? -Math.PI / 2 : Math.PI / 2, s > 0 ? Math.PI / 2 : Math.PI * 1.5);
            ctx.fill();
            ctx.restore();
        }
        // what's left
        const r = r0 * Math.sqrt(Math.pow(0.5, n));
        drawGlow(ctx, cx, cy, r * 2.2, '#7dffb0', 0.5 * fade);
        ctx.globalAlpha = fade;
        ctx.fillStyle = '#b8ffd6';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
        const left = 100 * Math.pow(0.5, n);
        drawText(ctx, left + '%', cx, cy + 22 * u, 4 * u, '#7dffb0', smoothstep(400, 800, time) * fade, 800, 0.3 * u);
        drawText(ctx, 'Still halfway', cx, cy + 29 * u, 2.4 * u, '#c9f5dc', smoothstep(5600, 6000, time) * fade, 500);
        drawCard(ctx, scene, time, 6900, '#7dffb0', '#2fae6a');
    }
};
// Ad: take a ticket, fill in the forms, wait, and everything slows down until it's stamped
CUTSCENES.Ad = {
    z: 0, dur: 9400,
    snd(audio, start) {
        playTone(audio, 784, start + 0.3, 0.4, 0.025, 'sine', null, 0.4);
        playTone(audio, 622.3, start + 0.7, 0.6, 0.025, 'sine', null, 0.4);
        let x = 1.6;
        for (let i = 0; i < 8; i++) {
            playNoise(audio, start + x, 0.12, 0.02, 2200, 900, 'bandpass', 1, 0.15);
            playTone(audio, 1500, start + x, 0.02, 0.012, 'sine', null, 0.05, 0, 0.001);
            x += 0.25 + i * 0.09;
        }
        boom(audio, start + 5.6, 0.12, 0.7);
        playNoise(audio, start + 5.6, 0.1, 0.05, 1800, 300, 'lowpass', 1, 0.2, 0.002);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const cx = W / 2;
        const cy = H / 2;
        const stamp = 5600;
        ctx.fillStyle = '#efe8d8';
        ctx.fillRect(0, 0, W, H);
        const fade = 1 - smoothstep(6600, 7200, time);
        // the board
        ctx.globalAlpha = fade;
        ctx.fillStyle = '#1d1d1d';
        ctx.fillRect(cx - 24 * u, 5 * u, 48 * u, 9 * u);
        ctx.globalAlpha = 1;
        drawText(ctx, 'NOW SERVING  1', cx, 9.5 * u, 3.4 * u, '#ff4a3a', fade * (0.75 + 0.25 * Math.sin(time / 400)), 700, 0.5 * u);
        drawText(ctx, 'YOUR NUMBER: 4,108', W * 0.18, cy + 26 * u, 2.4 * u, '#5a5246', fade * smoothstep(600, 1000, time), 600);
        // forms land on the pile, each one slower than the last
        let t = 1600;
        let piled = 0;
        for (let i = 0; i < 8; i++) {
            const d = time - t;
            if (d > 0) {
                const k = Math.min(1, d / 350);
                const y = -15 * u + (cy + 10 * u - i * 1.2 * u + 15 * u) * easeOutCubic(k);
                ctx.save();
                ctx.globalAlpha = fade;
                ctx.translate(cx + (i % 2 ? 1 : -1) * 1.5 * u, y);
                ctx.rotate((i % 3 - 1) * 0.05);
                ctx.fillStyle = '#fbfaf5';
                ctx.strokeStyle = '#b9b0a0';
                ctx.lineWidth = 0.2 * u;
                ctx.fillRect(-12 * u, -8 * u, 24 * u, 16 * u);
                ctx.strokeRect(-12 * u, -8 * u, 24 * u, 16 * u);
                ctx.fillStyle = '#cfc6b4';
                for (let l = 0; l < 4; l++) {
                    ctx.fillRect(-9 * u, (-5 + l * 3) * u, (l === 3 ? 9 : 18) * u, 0.5 * u);
                }
                ctx.restore();
                piled++;
            }
            t += 250 + i * 90;
        }
        // a clock that gives up
        const kx = W * 0.82;
        const ky = cy + 2 * u;
        const slow = time < 1600 ? time : 1600 + (time - 1600) * Math.max(0.05, 1 - (time - 1600) / 4500);
        ctx.globalAlpha = fade;
        ctx.strokeStyle = '#5a5246';
        ctx.lineWidth = 0.4 * u;
        ctx.beginPath();
        ctx.arc(kx, ky, 6 * u, 0, TAU);
        ctx.stroke();
        const ang = slow / 1000 * TAU / 6 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(kx, ky);
        ctx.lineTo(kx + Math.cos(ang) * 5 * u, ky + Math.sin(ang) * 5 * u);
        ctx.stroke();
        ctx.globalAlpha = 1;
        drawText(ctx, piled < 8 ? 'Processing…' : 'Still processing…', cx, H - 5 * u, 2.4 * u, '#5a5246', fade * smoothstep(1600, 2000, time) * (1 - smoothstep(stamp, stamp + 200, time)), 600);
        // stamped
        const d = time - stamp;
        if (d > 0) {
            const k = 1 + 1.6 * (1 - easeOutCubic(d / 160));
            ctx.save();
            ctx.globalAlpha = fade;
            ctx.translate(cx, cy + 4 * u);
            ctx.rotate(-0.18);
            ctx.scale(k, k);
            ctx.strokeStyle = '#c4271c';
            ctx.lineWidth = 0.8 * u;
            ctx.strokeRect(-22 * u, -5 * u, 44 * u, 10 * u);
            ctx.restore();
            ctx.save();
            ctx.translate(cx, cy + 4 * u);
            ctx.rotate(-0.18);
            drawText(ctx, 'APPROVED', 0, 0.3 * u, 5.4 * u * k, '#c4271c', fade, 800, 0.6 * u);
            ctx.restore();
        }
        if (time > 6600) {
            ctx.fillStyle = 'rgba(30,22,18,' + smoothstep(6600, 7200, time) + ')';
            ctx.fillRect(0, 0, W, H);
        }
        drawCard(ctx, scene, time, 7200, '#ff8a7a', '#b3342a');
    }
};
// Pi: a wheel rolls out one turn and lands on pi, then the digits spiral out and never stop
const PI_DIGITS = '1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819';
CUTSCENES.Pi = {
    z: 0, dur: 9200,
    snd(audio, start) {
        for (let i = 0; i < 8; i++) {
            playTone(audio, 330, start + 0.8 + i * 0.37, 0.05, 0.012, 'triangle', null, 0.1, 0, 0.003);
        }
        playTone(audio, 1046.5, start + 3.85, 1.2, 0.03, 'sine', null, 0.5);
        // the digits played as notes
        const scale = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880];
        for (let i = 0; i < 28; i++) {
            playTone(audio, scale[+PI_DIGITS[i]], start + 4.4 + i * 0.11, 0.16, 0.016, 'triangle', null, 0.35, 0, 0.004);
        }
        padChord(audio, start + 6.6, [261.6, 329.6, 392, 523.3], 2.4, 0.014, 'triangle', 2200);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const cx = W / 2;
        const cy = H / 2;
        ctx.fillStyle = '#071226';
        ctx.fillRect(0, 0, W, H);
        const D = 14 * u;
        const r = D / 2;
        const x0 = cx - Math.PI * D / 2;
        const ay = cy + 8 * u;
        const roll = smoothstep(800, 3800, time);
        const s = Math.PI * D * roll;
        const fade = 1 - smoothstep(4200, 4900, time);
        if (fade > 0) {
            ctx.globalAlpha = fade;
            // the number line, in diameters
            ctx.strokeStyle = '#3a5a8c';
            ctx.lineWidth = 0.25 * u;
            ctx.beginPath();
            ctx.moveTo(x0 - 4 * u, ay);
            ctx.lineTo(x0 + 4 * D, ay);
            ctx.stroke();
            for (let i = 0; i <= 4; i++) {
                ctx.beginPath();
                ctx.moveTo(x0 + i * D, ay - u);
                ctx.lineTo(x0 + i * D, ay + u);
                ctx.stroke();
                drawText(ctx, String(i), x0 + i * D, ay + 4 * u, 2.8 * u, '#6f8fbf', fade, 600);
            }
            // what the wheel has laid down so far
            ctx.strokeStyle = '#ffd166';
            ctx.lineWidth = 0.6 * u;
            ctx.beginPath();
            ctx.moveTo(x0, ay);
            ctx.lineTo(x0 + s, ay);
            ctx.stroke();
            // and the path the mark on its rim has drawn
            const th = s / r;
            ctx.strokeStyle = 'rgba(124,200,255,0.5)';
            ctx.lineWidth = 0.2 * u;
            ctx.beginPath();
            for (let k = 0; k <= 40; k++) {
                const a = th * k / 40;
                const px = x0 + r * a - r * Math.sin(a);
                const py = ay - r + r * Math.cos(a);
                if (k) {
                    ctx.lineTo(px, py);
                } else {
                    ctx.moveTo(px, py);
                }
            }
            ctx.stroke();
            const wx = x0 + s;
            ctx.strokeStyle = '#7cc8ff';
            ctx.lineWidth = 0.5 * u;
            ctx.beginPath();
            ctx.arc(wx, ay - r, r, 0, TAU);
            ctx.stroke();
            ctx.fillStyle = '#ffd166';
            ctx.beginPath();
            ctx.arc(wx - r * Math.sin(th), ay - r + r * Math.cos(th), 0.8 * u, 0, TAU);
            ctx.fill();
            ctx.globalAlpha = 1;
            const land = smoothstep(3800, 4100, time);
            if (land > 0) {
                drawGlow(ctx, x0 + Math.PI * D, ay, 10 * u, '#ffd166', 0.6 * land * fade);
                drawText(ctx, 'π', x0 + Math.PI * D, ay - D - 6 * u, 8 * u * (0.8 + 0.2 * land), '#ffd166', land * fade, 800);
            }
        }
        // the digits pour out round a spiral
        const d = time - 4400;
        if (d > 0) {
            const n = Math.min(PI_DIGITS.length, Math.floor(d / 14));
            const turn = d / 4000;
            const a = smoothstep(0, 400, d) * (1 - smoothstep(6000, 6600, time));
            drawText(ctx, '3.', cx, cy, 10 * u, '#ffd166', a, 800);
            for (let i = 0; i < n; i++) {
                const ang = i * 0.32 - turn;
                const rad = 9 * u + i * 0.3 * u;
                drawText(ctx, PI_DIGITS[i], cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad * 0.9, (2.4 + i * 0.02) * u, i % 10 ? '#cfe3ff' : '#7cc8ff', a * (1 - i / PI_DIGITS.length * 0.6), 600);
            }
            drawText(ctx, '…and it never repeats', cx, H - 6 * u, 3.2 * u, '#9fb7dd', a * smoothstep(1000, 1500, d), 600, 0.3 * u);
        }
        drawCard(ctx, scene, time, 6600, '#ffd166', '#7cc8ff');
    }
};
// Nu: everything that comes to bond with it gets bounced off
CUTSCENES.Nu = {
    z: 0, dur: 8400,
    snd(audio, start) {
        [1.5, 2.3, 3.1, 3.8, 4.5].forEach((x, i) => {
            playTone(audio, 300 + i * 30, start + x, 0.25, 0.025, 'sine', 900 + i * 60, 0.2, 0, 0.005);
            playNoise(audio, start + x, 0.08, 0.02, 2600, 1200, 'bandpass', 1, 0.1, 0.002);
        });
        padChord(audio, start + 5.4, [233.1, 293.7, 349.2], 2.4, 0.016, 'triangle', 2000);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const cx = W / 2;
        const cy = H / 2;
        ctx.fillStyle = '#1e0d0b';
        ctx.fillRect(0, 0, W, H);
        const fade = 1 - smoothstep(6100, 6600, time);
        const hits = [[1500, 3.3, 'O'], [2300, 0.2, 'H'], [3100, 2.1, 'C'], [3800, 4.6, 'N'], [4500, 1.2, 'Na']];
        hits.forEach(([t, a, sym]) => {
            const d = time - t;
            let r;
            if (d < 0) {
                r = 12 * u + Math.max(0, -d) * 0.05 * u;
                if (-d > 700) {
                    return;
                }
            } else {
                r = 12 * u + easeOutCubic(d / 900) * 50 * u;
            }
            const al = d < 0 ? smoothstep(-700, -400, d) : 1 - smoothstep(500, 900, d);
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            ctx.globalAlpha = al * fade;
            ctx.fillStyle = '#8fb7ff';
            ctx.beginPath();
            ctx.arc(x, y, 3.6 * u, 0, TAU);
            ctx.fill();
            ctx.globalAlpha = 1;
            drawText(ctx, sym, x, y + 0.1 * u, 2.8 * u, '#0d1630', al * fade, 800);
            if (d > 0 && d < 700) {
                const k = d / 700;
                ctx.strokeStyle = 'rgba(255,123,92,' + (1 - k) * (calmFx ? 0.5 : 1) + ')';
                ctx.lineWidth = 0.6 * u;
                ctx.beginPath();
                ctx.arc(cx, cy, 8.5 * u, a - 0.8, a + 0.8);
                ctx.stroke();
                drawText(ctx, 'NOPE', cx - Math.cos(a) * 20 * u, cy - Math.sin(a) * 14 * u - k * 3 * u, 3.4 * u * (1 + 0.3 * (1 - k)), '#ff7b5c', 1 - k, 800, 0.4 * u);
            }
        });
        // the loner
        const smug = smoothstep(5300, 5800, time);
        drawGlow(ctx, cx, cy, (12 + 8 * smug) * u, '#ff7b5c', (0.5 + 0.3 * smug) * fade);
        ctx.globalAlpha = fade;
        ctx.fillStyle = '#ffb59f';
        ctx.beginPath();
        ctx.arc(cx, cy, 6 * u, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#3a0f0a';
        ctx.fillRect(cx - 3.7 * u, cy - 2 * u, 3.1 * u, 0.8 * u + smug * 0.7 * u);
        ctx.fillRect(cx + 0.6 * u, cy - 2 * u, 3.1 * u, 0.8 * u + smug * 0.7 * u);
        ctx.strokeStyle = '#3a0f0a';
        ctx.lineWidth = 0.35 * u;
        ctx.beginPath();
        ctx.arc(cx + 0.8 * u, cy + 0.8 * u, 2 * u, 0.3, 0.3 + 1.6 * smug + 0.4);
        ctx.stroke();
        ctx.globalAlpha = 1;
        drawText(ctx, 'Party of one', cx, cy + 17 * u, 2.6 * u, '#ffb59f', smug * fade, 600);
        drawCard(ctx, scene, time, 6500, '#ff7b5c', '#c2412a');
    }
};
// Xx: a file types itself out and gets blacked out line by line
CUTSCENES.Xx = {
    z: 0, dur: 8600,
    snd(audio, start) {
        for (let x = 0.6; x < 4.6; x += 0.06 + Math.random() * 0.05) {
            playNoise(audio, start + x, 0.02, 0.018, 4000, 2500, 'bandpass', 2, 0.05, 0.001);
        }
        [1.3, 2, 2.7, 3.4, 4.1].forEach(x => playTone(audio, 90, start + x, 0.12, 0.04, 'square', 60, 0.1, 0, 0.003));
        boom(audio, start + 5, 0.1, 0.7);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const cx = W / 2;
        const fade = 1 - smoothstep(6200, 6700, time);
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, W, H);
        // the page
        const pw = Math.min(W * 0.7, 70 * u);
        const px = cx - pw / 2;
        const py = 6 * u;
        const ph = H - 12 * u;
        ctx.globalAlpha = fade * smoothstep(0, 400, time);
        ctx.fillStyle = '#ece6d6';
        ctx.fillRect(px, py, pw, ph);
        ctx.globalAlpha = 1;
        const a = fade * smoothstep(0, 400, time);
        drawText(ctx, 'CLASSIFIED', cx, py + 5 * u, 3 * u, '#b0261c', a, 800, 0.8 * u);
        // the photo, blacked out first
        const ix = px + pw - 18 * u;
        const iy = py + 10 * u;
        ctx.globalAlpha = a;
        ctx.fillStyle = '#c9c1ad';
        ctx.fillRect(ix, iy, 14 * u, 14 * u);
        ctx.fillStyle = '#111';
        const pk = smoothstep(800, 1000, time);
        ctx.fillRect(ix, iy, 14 * u * pk, 14 * u);
        ctx.globalAlpha = 1;
        const lines = ['NAME: REDACTIUM', 'FOUND BY: AGENT ████', 'ODDS: 1 IN 500,000,000', 'LOCATION: THE BASEMENT', 'NOTES: DO NOT ROLL'];
        lines.forEach((l, i) => {
            const t0 = 600 + i * 700;
            const typed = Math.floor(clamp((time - t0) / 450) * l.length);
            const y = py + 13 * u + i * 6 * u;
            if (typed > 0) {
                ctx.save();
                ctx.globalAlpha = a;
                ctx.fillStyle = '#2a2620';
                ctx.font = '600 ' + 2.4 * u + 'px ' + CUTSCENE_FONT;
                ctx.textBaseline = 'middle';
                ctx.fillText(l.slice(0, typed), px + 5 * u, y);
                const w = ctx.measureText(l.slice(l.indexOf(':') + 2)).width;
                const bar = smoothstep(t0 + 700, t0 + 820, time);
                ctx.fillStyle = '#111';
                const bx = px + 5 * u + ctx.measureText(l.slice(0, l.indexOf(':') + 2)).width;
                ctx.fillRect(bx, y - 1.6 * u, (w + u) * bar, 3.2 * u);
                ctx.restore();
            }
        });
        // stamped
        const d = time - 5000;
        if (d > 0) {
            const k = 1 + 1.4 * (1 - easeOutCubic(d / 160));
            ctx.save();
            ctx.translate(cx, H / 2 + 8 * u);
            ctx.rotate(-0.12);
            ctx.globalAlpha = fade;
            ctx.strokeStyle = '#b0261c';
            ctx.lineWidth = 0.7 * u;
            ctx.strokeRect(-26 * u * k, -4.5 * u * k, 52 * u * k, 9 * u * k);
            ctx.restore();
            ctx.save();
            ctx.translate(cx, H / 2 + 8 * u);
            ctx.rotate(-0.12);
            drawText(ctx, '[DATA EXPUNGED]', 0, 0.3 * u, 4.4 * u * k, '#b0261c', fade, 800, 0.4 * u);
            ctx.restore();
        }
        drawCard(ctx, scene, time, 6700, '#ff4a4a', '#7a1010');
    }
};
// Uo: grabber claws keep missing the ore at the bottom of the mine, until one doesn't
CUTSCENES.Uo = {
    z: 0, dur: 9200,
    snd(audio, start) {
        [0.6, 2.2, 3.8].forEach((x, i) => {
            playTone(audio, 180, start + x, 1, 0.012, 'sawtooth', 120, 0.1, 0, 0.1);
            playNoise(audio, start + x + 1.1, 0.08, 0.04, 3000, 1500, 'bandpass', 2, 0.1, 0.002);
            if (i < 2) {
                playTone(audio, 330, start + x + 1.3, 0.3, 0.02, 'triangle', 220, 0.2);
            }
        });
        riser(audio, start + 5, 1.2, 0.025, 200, 1600);
        sparkle(audio, start + 6.1, 14, 1.4, 0.022);
        padChord(audio, start + 6.2, [261.6, 329.6, 392, 523.3], 2.4, 0.016, 'triangle', 2600);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const cx = W / 2;
        const ground = H * 0.18;
        const floor = H * 0.86;
        const fade = 1 - smoothstep(6600, 7100, time);
        ctx.fillStyle = '#0c1418';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = fade;
        // rock layers either side of the shaft
        ['#2b2420', '#33291f', '#2a2a26', '#3a2c22'].forEach((c, i) => {
            ctx.fillStyle = c;
            const y = ground + i * (floor - ground) / 4;
            ctx.fillRect(0, y, cx - 14 * u, (floor - ground) / 4);
            ctx.fillRect(cx + 14 * u, y, W, (floor - ground) / 4);
        });
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(0, ground - u, W, u);
        ctx.fillRect(0, floor, W, H - floor);
        ctx.globalAlpha = 1;
        // the ore dodges
        const tries = [[600, -7], [2200, 10], [3800, 0]];
        let ox = cx;
        tries.forEach(([t, dx], i) => {
            if (i < 2) {
                ox += dx * u * smoothstep(t + 900, t + 1100, time);
            } else {
                ox += 0;
            }
        });
        const grab = 4900;
        const lift = smoothstep(grab + 200, grab + 1400, time);
        let oy = floor - 2.5 * u - lift * (floor - ground + 8 * u);
        // the claws
        tries.forEach(([t], i) => {
            const down = smoothstep(t, t + 1000, time);
            const back = i < 2 ? smoothstep(t + 1300, t + 1900, time) : 0;
            const target = i < 2 ? cx + tries.slice(0, i).reduce((s, x) => s + x[1] * u, 0) : ox;
            const reach = (floor - 4 * u - ground) * (down - back);
            let y = ground + reach;
            if (i === 2 && time > grab) {
                y = oy - 1.5 * u;
            }
            if (down - back <= 0 && !(i === 2 && time > t)) {
                return;
            }
            const shut = i < 2 ? smoothstep(t + 1000, t + 1150, time) : smoothstep(grab - 100, grab, time);
            ctx.globalAlpha = fade;
            ctx.strokeStyle = '#a9b4bd';
            ctx.lineWidth = 0.3 * u;
            ctx.beginPath();
            ctx.moveTo(target, 0);
            ctx.lineTo(target, y);
            ctx.stroke();
            ctx.lineWidth = 0.6 * u;
            [-1, 1].forEach(s => {
                ctx.beginPath();
                ctx.moveTo(target, y);
                ctx.lineTo(target + s * (3 - 1.6 * shut) * u, y + 2 * u);
                ctx.lineTo(target + s * (1.6 - 1 * shut) * u, y + 4 * u);
                ctx.stroke();
            });
            ctx.globalAlpha = 1;
            if (i < 2) {
                drawText(ctx, 'MISSED', target, ground - 4 * u, 2.6 * u, '#ff8a7a', smoothstep(t + 1100, t + 1300, time) * (1 - smoothstep(t + 1700, t + 2000, time)), 800, 0.4 * u);
            }
        });
        drawGlow(ctx, ox, oy, (9 + 6 * lift) * u, '#5ef0ff', (0.7 + 0.2 * Math.sin(time / 180)) * fade);
        ctx.globalAlpha = fade;
        ctx.fillStyle = '#b9faff';
        ctx.beginPath();
        ctx.moveTo(ox, oy - 2.5 * u);
        ctx.lineTo(ox + 2.2 * u, oy);
        ctx.lineTo(ox + 0.8 * u, oy + 2.4 * u);
        ctx.lineTo(ox - 1.8 * u, oy + 1.6 * u);
        ctx.lineTo(ox - 2.2 * u, oy - 0.8 * u);
        ctx.fill();
        // scientists up top, cheering at the end
        for (let i = 0; i < 6; i++) {
            const sx = W * 0.12 + i * W * 0.03 + (i > 2 ? W * 0.62 : 0);
            const hop = time > grab + 1200 ? Math.abs(Math.sin(time / 120 + i)) * 1.5 * u : 0;
            ctx.fillStyle = '#f2f2f2';
            ctx.fillRect(sx - 0.8 * u, ground - 4.5 * u - hop, 1.6 * u, 3 * u);
            ctx.fillStyle = '#f2c7a5';
            ctx.beginPath();
            ctx.arc(sx, ground - 5.4 * u - hop, 0.9 * u, 0, TAU);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        drawText(ctx, 'GOT IT', cx, H * 0.55, 4.4 * u, '#5ef0ff', smoothstep(grab + 1200, grab + 1500, time) * fade, 800, 0.5 * u);
        drawCard(ctx, scene, time, 7100, '#5ef0ff', '#1f8fbf');
    }
};
// Zo: it shoots past a few times and all that's left is a dust cloud
CUTSCENES.Zo = {
    z: 0, dur: 7800,
    snd(audio, start) {
        [0.8, 2.2, 3.4].forEach(x => {
            playNoise(audio, start + x - 0.15, 0.35, 0.05, 300, 4500, 'bandpass', 2, 0.1, 0.1);
            playTone(audio, 1400, start + x - 0.1, 0.3, 0.015, 'sawtooth', 300, 0.1, 0, 0.02);
        });
        playNoise(audio, start + 4.2, 0.8, 0.04, 800, 150, 'lowpass', 1, 0.3, 0.02);
        playTone(audio, 1760, start + 5.3, 0.25, 0.02, 'sine', null, 0.3);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const cx = W / 2;
        const cy = H / 2;
        const st = scene.state;
        if (!st.l) {
            const r = seededRandom(31);
            st.l = Array.from({ length: 40 }, () => [r() * W, r() * H, (0.3 + r()) * 10 * u, r()]);
        }
        ctx.fillStyle = '#1a1206';
        ctx.fillRect(0, 0, W, H);
        const fade = 1 - smoothstep(5000, 5500, time);
        // passes: [time, from x, from y, to x, to y]
        const passes = [[800, -0.1, 0.45, 1.1, 0.55], [2200, 1.1, 0.2, -0.1, 0.8], [3400, 0.2, -0.1, 0.8, 1.1]];
        let whip = 0;
        passes.forEach(([t]) => whip = Math.max(whip, 1 - Math.min(1, Math.abs(time - t) / 250)));
        // speed lines pick up whenever it goes by
        const sp = whip * (calmFx ? 0.4 : 1);
        st.l.forEach(([x, y, len, k]) => {
            const xx = ((x - time * 0.8 * u * (0.2 + sp * 2)) % W + W) % W;
            ctx.fillStyle = 'rgba(255,225,74,' + (0.05 + 0.25 * sp) * k * fade + ')';
            ctx.fillRect(xx, y, len * (0.3 + sp * 2), 0.25 * u);
        });
        passes.forEach(([t, x0, y0, x1, y1]) => {
            const d = (time - t) / 220;
            if (d < -1 || d > 1) {
                return;
            }
            const p = (d + 1) / 2;
            const x = (x0 + (x1 - x0) * p) * W;
            const y = (y0 + (y1 - y0) * p) * H;
            const ang = Math.atan2((y1 - y0) * H, (x1 - x0) * W);
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(ang);
            const g = ctx.createLinearGradient(-30 * u, 0, 2 * u, 0);
            g.addColorStop(0, 'rgba(255,225,74,0)');
            g.addColorStop(1, 'rgba(255,245,200,0.95)');
            ctx.fillStyle = g;
            ctx.fillRect(-30 * u, -1.2 * u, 32 * u, 2.4 * u);
            ctx.restore();
            drawGlow(ctx, x, y, 8 * u, '#ffe14a', 0.8);
        });
        // the dust cloud where it was a moment ago
        const dd = time - 3800;
        if (dd > 0) {
            for (let i = 0; i < 9; i++) {
                const a = i * 0.7;
                const r = (3 + easeOutCubic(dd / 1200) * 6) * u;
                drawGlow(ctx, cx + Math.cos(a) * r, cy + 4 * u + Math.sin(a) * r * 0.5, (5 + i % 3) * u, '#b89a6a', 0.45 * (1 - smoothstep(600, 1600, dd)) * fade);
            }
        }
        drawText(ctx, 'Was that it?', cx, H * 0.15, 3 * u, '#ffe14a', smoothstep(2500, 2800, time) * (1 - smoothstep(3300, 3500, time)), 700);
        drawText(ctx, 'You just missed it', cx, H * 0.8, 3.2 * u, '#ffe14a', smoothstep(4300, 4600, time) * fade, 700, 0.3 * u);
        drawCard(ctx, scene, time, 5400, '#ffe14a', '#ff8a00');
    }
};
// Gg: game over, continue? ... insert coin
CUTSCENES.Gg = {
    z: 0, dur: 9000, label: 'FINAL ELEMENT',
    snd(audio, start) {
        [659.3, 622.3, 587.3, 554.4, 523.3, 392, 261.6].forEach((f, i) => playTone(audio, f, start + 0.9 + i * 0.16, i === 6 ? 0.6 : 0.14, 0.022, 'square', null, 0.1, 0, 0.003));
        for (let i = 0; i < 9; i++) {
            playTone(audio, 880, start + 2.6 + i * 0.3, 0.06, 0.016, 'square', null, 0.05, 0, 0.002);
        }
        playTone(audio, 987.8, start + 5.8, 0.08, 0.025, 'square', null, 0.1, 0, 0.002);
        playTone(audio, 1318.5, start + 5.9, 0.4, 0.025, 'square', null, 0.2, 0, 0.002);
        padChord(audio, start + 6.4, [220, 277.2, 329.6, 440], 2.4, 0.014, 'square', 1800);
    },
    draw(ctx, scene, time) {
        const W = scene.width;
        const H = scene.height;
        const u = scene.unit;
        const cx = W / 2;
        const cy = H / 2;
        const fade = 1 - smoothstep(6300, 6800, time);
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, W, H);
        const blink = calmFx ? 1 : Math.sin(time / 130) > -0.4 ? 1 : 0.25;
        // hud
        drawText(ctx, 'PLAYER 1', W * 0.2, 6 * u, 2.6 * u, '#f2f2f2', fade, 700, 0.6 * u);
        drawText(ctx, 'LIVES 0', W * 0.8, 6 * u, 2.6 * u, '#ff4040', fade, 700, 0.6 * u);
        // a pixel heart that breaks
        const hb = smoothstep(500, 800, time);
        const px = 1.2 * u;
        const heart = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];
        heart.forEach((row, j) => [...row].forEach((c, i) => {
            if (c === '1' && time < 2400) {
                const side = i < 3 ? -1 : 1;
                ctx.fillStyle = 'rgba(255,64,64,' + fade * (1 - smoothstep(1800, 2400, time)) + ')';
                ctx.fillRect(cx + (i - 3.5) * px + side * hb * 2 * u, cy - 16 * u + j * px + hb * (i % 2) * u, px - 0.1 * u, px - 0.1 * u);
            }
        }));
        drawText(ctx, 'GAME OVER', cx, cy - 2 * u, 9 * u * easeOutCubic((time - 900) / 300), '#ff4040', smoothstep(900, 1000, time) * fade * (time > 1300 ? blink : 1), 800, 0.8 * u);
        // continue?
        const n = Math.max(0, 9 - Math.floor((time - 2600) / 300));
        if (time > 2600 && time < 5600) {
            drawText(ctx, 'CONTINUE?  ' + n, cx, cy + 10 * u, 3.6 * u, '#f2f2f2', fade, 700, 0.6 * u);
        }
        if (time > 5300) {
            drawText(ctx, 'INSERT COIN', cx, cy + 10 * u, 3.6 * u, '#ffd36e', fade * blink, 700, 0.6 * u);
        }
        // the coin goes in
        const cd = time - 5500;
        if (cd > 0 && cd < 500) {
            ctx.fillStyle = 'rgba(255,211,110,' + (1 - cd / 500) + ')';
            ctx.beginPath();
            ctx.ellipse(cx, cy + 22 * u - cd / 500 * 6 * u, 2.4 * u, 2.4 * u * (1 - cd / 600), 0, 0, TAU);
            ctx.fill();
        }
        // crt lines
        ctx.fillStyle = 'rgba(255,255,255,0.035)';
        for (let y = 0; y < H; y += 0.8 * u) {
            ctx.fillRect(0, y, W, 0.3 * u);
        }
        drawCard(ctx, scene, time, 6500, '#ff4040', '#b30000');
    }
};
