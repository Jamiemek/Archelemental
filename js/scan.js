const QS_COLS = ['#ff5a6e', '#5ef0a0', '#5aa8ff'];
let qsSprites = null;
function qsSprite(i) {
    if (!qsSprites) {
        qsSprites = QS_COLS.map(c => {
            const s = document.createElement('canvas');
            s.width = s.height = 64;
            const x = s.getContext('2d');
            const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
            gr.addColorStop(0, '#ffffff');
            gr.addColorStop(0.16, '#ffffff');
            gr.addColorStop(0.3, c);
            gr.addColorStop(0.55, c + '55');
            gr.addColorStop(1, c + '00');
            x.fillStyle = gr;
            x.fillRect(0, 0, 64, 64);
            return s;
        });
    }
    return qsSprites[i];
}
// text sprites, setting the font per particle was too slow
const GLYPH = 128;
let glyphs = new Map();
function glyph(text, col, fam, px) {
    const key = text + '|' + col + '|' + fam + '|' + px;
    let s = glyphs.get(key);
    if (!s) {
        if (glyphs.size > 1500) {
            glyphs = new Map();
        }
        s = document.createElement('canvas');
        const x = s.getContext('2d');
        x.font = '700 ' + px + 'px ' + fam;
        const tw = x.measureText(text).width;
        // cap the size for long chains
        if (tw > 2048) {
            px = px * 2048 / tw | 0;
        }
        s.px = px;
        s.width = Math.ceil(Math.min(tw, 2048)) + 8;
        s.height = px * 1.3 | 0;
        x.font = '700 ' + px + 'px ' + fam;
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillStyle = col;
        x.fillText(text, s.width / 2, s.height / 2);
        glyphs.set(key, s);
    }
    return s;
}
if (document.fonts) {
    document.fonts.addEventListener('loadingdone', () => glyphs = new Map());
}
function drawGlyph(g, text, col, fam, size, x, y) {
    const s = glyph(text, col, fam, size > 48 ? GLYPH * 2 : GLYPH);
    const k = size / s.px;
    g.drawImage(s, x - s.width * k / 2, y - s.height * k / 2, s.width * k, s.height * k);
}
const SCAN_SKIN = {
    '': { fg: '#cfe3da', st: '#9fe0c8', hi: '#eef3ef' },
    oscilloscope: { fg: '#7dff9a', st: '#3dff6e', hi: '#d8ffe0' },
    holographic: { fg: '#d9fbff', st: '#ff7ce6', hi: '#ffffff' },
    warp: { fg: '#dfe8ff', st: '#9fb8ff', hi: '#ffffff' }
};
function skinLayer(g, sk, t, W, H, q) {
    g.save();
    if (sk === 'oscilloscope') {
        g.strokeStyle = '#7dff9a';
        g.lineWidth = 1;
        g.globalAlpha = 0.12;
        g.beginPath();
        for (let i = 1; i < 10; i++) {
            g.moveTo(W * i / 10, 0);
            g.lineTo(W * i / 10, H);
        }
        for (let i = 1; i < 8; i++) {
            g.moveTo(0, H * i / 8);
            g.lineTo(W, H * i / 8);
        }
        g.stroke();
        g.globalAlpha = 0.25;
        g.beginPath();
        for (let i = 0; i <= 50; i++) {
            g.moveTo(W * i / 50, H / 2 - 3);
            g.lineTo(W * i / 50, H / 2 + 3);
        }
        g.stroke();
        const A = H * 0.24 * (1 - q);
        g.globalAlpha = 0.85;
        g.strokeStyle = '#3dff6e';
        g.lineWidth = 2;
        g.shadowColor = '#3dff6e';
        g.shadowBlur = 10;
        g.beginPath();
        for (let x = 0; x <= W; x += 3) {
            const y = H / 2 + A * (0.6 * Math.sin(x / W * 18.85 + t / 180) + 0.3 * Math.sin(x * 0.071 - t / 90) + 0.1 * Math.sin(x * 0.53 + t / 40));
            if (x) {
                g.lineTo(x, y);
            } else {
                g.moveTo(x, y);
            }
        }
        g.stroke();
    } else if (sk === 'holographic') {
        const x0 = ((t / 1700) % 1.6 - 0.3) * W;
        const gr = g.createLinearGradient(x0 - W * 0.25, 0, x0 + W * 0.25, H * 0.4);
        gr.addColorStop(0, 'rgba(63,240,255,0)');
        gr.addColorStop(0.35, 'rgba(63,240,255,.10)');
        gr.addColorStop(0.5, 'rgba(255,255,255,.16)');
        gr.addColorStop(0.65, 'rgba(255,79,216,.10)');
        gr.addColorStop(1, 'rgba(255,79,216,0)');
        g.fillStyle = gr;
        g.fillRect(0, 0, W, H);
        g.globalAlpha = 0.06;
        for (let y = (t / 30) % 6; y < H; y += 6) {
            g.fillStyle = (y | 0) % 12 < 6 ? '#3ff0ff' : '#ff4fd8';
            g.fillRect(0, y, W, 1);
        }
    } else if (sk === 'warp') {
        const M = Math.max(W, H) * 0.75;
        g.strokeStyle = '#9fb8ff';
        g.lineWidth = 1.5;
        for (let k = 0; k < 6; k++) {
            const f = (t / 900 + k / 6) % 1;
            g.globalAlpha = (1 - f) * 0.35 * (1 - q);
            g.beginPath();
            g.ellipse(W / 2, H / 2, f * f * M, f * f * M * 0.62, 0, 0, 6.2832);
            g.stroke();
        }
        const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.4);
        gr.addColorStop(0, 'rgba(220,230,255,' + 0.35 * (1 - q) + ')');
        gr.addColorStop(1, 'rgba(220,230,255,0)');
        g.globalAlpha = 1;
        g.fillStyle = gr;
        g.fillRect(0, 0, W, H);
    }
    g.restore();
}
const EV_HUD = { storm: ['QUARK STORM', '#f0c419'], collider: ['SUPERCOLLIDER', '#5fd4ff'], hole: ['BLACK HOLE', '#ff9a3c'] };
// black hole off the right edge, drawn once per roll
function holeLayer(W, H, dpr) {
    const R = H * 0.55;
    const bx = W + R / 3;
    const by = H * 0.52;
    const cv = document.createElement('canvas');
    cv.width = W * dpr;
    cv.height = H * dpr;
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    // halo
    const halo = g.createRadialGradient(bx, by, R * 0.9, bx, by, R * 2.6);
    halo.addColorStop(0, 'rgba(255,170,90,0.55)');
    halo.addColorStop(0.35, 'rgba(255,120,40,0.18)');
    halo.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = halo;
    g.fillRect(0, 0, W, H);
    // disk
    const disk = front => {
        const a0 = front ? 0 : Math.PI;
        g.save();
        g.translate(bx, by);
        g.rotate(-0.12);
        g.scale(1, 0.18);
        const glow = g.createRadialGradient(0, 0, R * 1.1, 0, 0, R * 2.6);
        glow.addColorStop(0, 'rgba(255,240,210,0)');
        glow.addColorStop(0.05, 'rgba(255,236,200,0.95)');
        glow.addColorStop(0.3, 'rgba(255,175,90,0.6)');
        glow.addColorStop(0.65, 'rgba(230,110,40,0.22)');
        glow.addColorStop(1, 'rgba(200,80,30,0)');
        const side = g.createLinearGradient(-R * 2.6, 0, R * 2.6, 0);
        side.addColorStop(0, 'rgba(255,245,225,0.45)');
        side.addColorStop(1, 'rgba(120,40,10,0)');
        [glow, side].forEach(fill => {
            g.fillStyle = fill;
            g.beginPath();
            g.arc(0, 0, R * 2.6, a0, a0 + Math.PI);
            g.arc(0, 0, R * 1.1, a0 + Math.PI, a0, true);
            g.fill();
        });
        g.restore();
    };
    disk(false);
    // lensed back of the disk
    // fades at both ends. older Safari can't do conic gradients so it goes without
    if (g.createConicGradient) {
        const lens = g.createConicGradient(Math.PI, bx, by);
        lens.addColorStop(0, 'rgba(255,205,140,0)');
        lens.addColorStop(0.15, 'rgba(255,205,140,0.85)');
        lens.addColorStop(0.35, 'rgba(255,190,120,0.8)');
        lens.addColorStop(0.5, 'rgba(255,170,100,0)');
        lens.addColorStop(1, 'rgba(255,170,100,0)');
        g.lineWidth = R * 0.06;
        g.strokeStyle = lens;
        g.beginPath();
        g.ellipse(bx, by - R * 0.04, R * 1.1, R * 1.04, 0, Math.PI, Math.PI * 2);
        g.stroke();
    }
    // shadow, photon ring, front of disk
    g.fillStyle = '#000';
    g.beginPath();
    g.arc(bx, by, R, 0, 6.2832);
    g.fill();
    g.lineWidth = R * 0.025;
    g.strokeStyle = 'rgba(255,236,200,0.8)';
    g.beginPath();
    g.arc(bx, by, R * 1.02, 0, 6.2832);
    g.stroke();
    disk(true);
    return { cv, bx, by, R };
}
function drawHole(g, h, W, H, f) {
    g.globalAlpha = f;
    g.drawImage(h.cv, 0, 0, W, H);
    return [h.bx, h.by, h.R];
}
function scanField(reel, syms, labels, scores, dur, targets, ev) {
    const storm = ev === 'storm';
    const sk = scannerSkin();
    const SK = SCAN_SKIN[sk];
    const N = labels.length;
    const W = reel.clientWidth;
    const H = reel.clientHeight;
    if (!W || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // nothing to draw but keep the timing
        return new Promise(r => setTimeout(r, Math.max(120, 1350 * dur / 3000) + 1650));
    }
    const cv = document.createElement('canvas');
    const dpr = lowDetail ? 1 : Math.min(2, devicePixelRatio || 1);
    cv.width = W * dpr;
    cv.height = H * dpr;
    reel.appendChild(cv);
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    const holeArt = ev === 'hole' ? holeLayer(W, H, dpr) : null;
    const cs = getComputedStyle(syms[0]);
    const fam = cs.fontFamily;
    const base = Math.min(parseFloat(cs.fontSize) || 80, N > 1 ? 84 : 999);
    g.font = '700 ' + base + 'px ' + fam;
    const fsA = targets ? targets.map(t => t.fs) : labels.map(l => {
        const room = W / N - (N > 1 ? 24 : 30);
        const tw = g.measureText(l).width;
        return tw > room ? base * room / tw : base;
    });
    if (N > 1 && !targets) {
        syms.forEach((e, i) => e.style.fontSize = fsA[i] + 'px');
    }
    const ACC = ['#f0c419'].concat(RARITY_FX.slice(1).map(x => x.c));
    const tiers = scores.map(getRarityTier);
    const tier = Math.max(...tiers);
    const acc = ACC[tier];
    const Pp = H * 0.9;
    const t0 = performance.now();
    const sm = x => {
        x = Math.max(0, Math.min(1, x));
        return x * x * (3 - 2 * x);
    };
    const spawn = (p, d, c) => {
        p.z = c + d;
        p.x = (Math.random() - 0.5) * (W / Pp) * d * 1.25;
        p.y = (Math.random() - 0.5) * (H / Pp) * d * 1.25;
        p.s = 0.25 + Math.random() * 0.45;
        p.t = ELEMENTS[Math.random() * ELEMENTS.length | 0][0];
        return p;
    };
    const P = ev === 'collider' ? [] : Array.from({ length: lowDetail ? 90 : 150 }, () => spawn({}, 0.6 + Math.pow(Math.random(), 0.8) * 13.4, -9));
    P.forEach(p => {
        p.L = 1600 + Math.random() * 1600;
        p.b = -Math.random() * p.L * 0.9;
    });
    // supercollider pairs
    const cSpawn = (p, d, c) => {
        spawn(p, d, c);
        const a = Math.random() * 6.2832;
        const r = (0.5 + Math.random() * 0.7) * d / 5;
        p.ox = Math.cos(a) * r;
        p.oy = Math.sin(a) * r;
        p.t2 = ELEMENTS[Math.random() * ELEMENTS.length | 0][0];
        p.dc = 2 + Math.random() * 4;
        p.sa = Math.random() * 6.3;
        p.f = hillFormula([elementBySymbol[p.t], elementBySymbol[p.t2]]);
        p.s *= 1.6;
        return p;
    };
    const C = ev === 'collider' ? Array.from({ length: lowDetail ? 45 : 70 }, () => cSpawn({}, 0.6 + Math.pow(Math.random(), 0.8) * 13.4, -9)) : [];
    // storm quarks: k = 0 for a lone quark (colour c), 1 for a bound three
    const qSpawn = (p, d, c) => {
        spawn(p, d, c);
        p.k = Math.random() < 0.28 ? 1 : 0;
        p.c = Math.random() * 3 | 0;
        p.w = (0.5 + Math.random() * 0.9) * (Math.random() < 0.85 ? 1 : -1);
        p.r0 = Math.hypot(p.x, p.y);
        p.a0 = Math.atan2(p.y, p.x);
        p.sp = Math.random() * 6.3;
        return p;
    };
    const Q = storm ? Array.from({ length: Math.round(Math.min(70, Math.max(44, W * H / 4500)) * (lowDetail ? 0.6 : 1)) }, () => qSpawn({}, 0.8 + Math.random() * 13, -9)) : [];
    const S = Math.max(120, 1350 * dur / 3000);
    const T1 = S + 600;
    const total = S + 1650;
    const two = labels.map(() => Math.random() < 0.5);
    const T = labels.map((l, i) => N === 1 ? { x: (Math.random() < 0.5 ? -1 : 1) * (1.2 + Math.random() * 1.6), y: (Math.random() - 0.5) * 1.6 } : { x: ((i + 0.5) / N - 0.5) * 5.5 + (Math.random() - 0.5) * 1.2, y: (Math.random() - 0.5) * 2 });
    const mx = T.reduce((a, b) => a + b.x, 0) / N;
    const my = T.reduce((a, b) => a + b.y, 0) / N;
    return new Promise(res => {
        let done = false;
        const fin = () => {
            if (done) {
                return;
            }
            done = true;
            cv.remove();
            res();
        };
        setTimeout(fin, total + 1200);
        (function frame(now) {
            if (done) {
                return;
            }
            const t = now - t0;
            const u = t >= total ? 1 : t < S ? 0.45 * t / S : t < T1 ? 0.45 + 0.2 * (t - S) / 600 : 0.65 + 0.35 * (t - T1) / 1050;
            const q = u < 0.65 ? 0 : (u - 0.65) / 0.35;
            const D = u < 0.65 ? 8 - 3 * u / 0.65 : 5 * (1 - q * q);
            const dt = 1 + D;
            const cz = -dt;
            const w = sm((u - 0.45) / 0.35);
            const w2 = sm((u - 0.55) / 0.45);
            const ur = t / 3000;
            const cxw = Math.sin(ur * 9) * 2.4 * (1 - w) + mx * w;
            const cyw = Math.cos(ur * 6) * 1.2 * (1 - w) + my * w;
            g.clearRect(0, 0, W, H);
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.lineCap = 'round';
            if (sk) {
                skinLayer(g, sk, t, W, H, q);
            }
            const pr = (x, y, d) => [W / 2 + (x - cxw) * Pp / d, H / 2 + (y - cyw) * Pp / d];
            const hole = holeArt ? drawHole(g, holeArt, W, H, 1 - q) : null;
            P.forEach(p => {
                let d = p.z - cz;
                if (d < 0.35 || p.gone) {
                    spawn(p, 13 + Math.random() * 2, cz);
                    p.b = t;
                    p.gone = false;
                    d = p.z - cz;
                }
                let px = p.x;
                let py = p.y;
                let fade = 1;
                if (hole) {
                    // pulled to the hole in 3d, far ones grow and near ones shrink
                    const [bx, by, R] = hole;
                    const k = Math.min(1, (t - p.b) / p.L);
                    const e = k * k;
                    px += (cxw + (bx - W / 2) * 6 / Pp - px) * e;
                    py += (cyw + (by - H / 2) * 6 / Pp - py) * e;
                    d += (6 - d) * e;
                    const [hx, hy] = pr(px, py, d);
                    fade = sm((Math.hypot(hx - bx, hy - by) - R * 0.9) / (R * 0.3));
                    if (fade <= 0) {
                        p.gone = true;
                        return;
                    }
                }
                const [sx, sy] = pr(px, py, d);
                const a = Math.min(1, (d - 0.35) / 0.9) * (d > 10 ? (14 - d) / 4 : 1) * 0.8 * (1 - q * 0.92) * fade;
                if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) {
                    return;
                }
                if (a <= 0) {
                    return;
                }
                if (!hole && (q > 0 || sk === 'warp')) {
                    const [ex, ey] = pr(px, py, d + q * q * 3.5 + (sk === 'warp' ? 0.9 : 0));
                    g.globalAlpha = a * 0.7;
                    g.strokeStyle = tier ? acc : SK.st;
                    g.lineWidth = 1.5;
                    g.beginPath();
                    g.moveTo(sx, sy);
                    g.lineTo(ex, ey);
                    g.stroke();
                }
                g.globalAlpha = a;
                const fz = Math.max(5, base * p.s / d);
                if (sk === 'holographic') {
                    g.globalAlpha = a * 0.6;
                    drawGlyph(g, p.t, '#ff4fd8', fam, fz, sx - 1.5, sy);
                    drawGlyph(g, p.t, '#3ff0ff', fam, fz, sx + 1.5, sy);
                    g.globalAlpha = a;
                }
                drawGlyph(g, p.t, SK.fg, fam, fz, sx, sy);
            });
            let bang = 0;
            C.forEach(p => {
                let d = p.z - cz;
                if (d < 0.35) {
                    cSpawn(p, 13 + Math.random() * 2, cz);
                    d = p.z - cz;
                }
                const a = Math.min(1, (d - 0.35) / 0.9) * (d > 10 ? (14 - d) / 4 : 1) * 0.95 * (1 - q * 0.92);
                if (a <= 0) {
                    return;
                }
                const k = Math.min(1, (d - p.dc) / 3);
                const fz = Math.max(5, base * p.s / d);
                if (k > 0) {
                    [[p.t, 1], [p.t2, -1]].forEach(([sym, s]) => {
                        const [sx, sy] = pr(p.x + p.ox * k * s, p.y + p.oy * k * s, d);
                        if (k < 0.8) {
                            const [tx, ty] = pr(p.x + p.ox * Math.min(1, k + 0.35) * s, p.y + p.oy * Math.min(1, k + 0.35) * s, d);
                            g.globalAlpha = a * 0.7 * (1 - k / 0.8);
                            g.strokeStyle = '#5fd4ff';
                            g.lineWidth = Math.max(1, base * 0.05 / d);
                            g.beginPath();
                            g.moveTo(sx, sy);
                            g.lineTo(tx, ty);
                            g.stroke();
                        }
                        g.globalAlpha = a;
                        drawGlyph(g, sym, k < 0.5 ? '#bfefff' : SK.fg, fam, fz, sx, sy);
                    });
                    return;
                }
                const [sx, sy] = pr(p.x, p.y, d);
                const since = p.dc - d;
                if (since < 1.3) {
                    const f = 1 - since / 1.3;
                    const rr = base * 2.6 / d * (0.4 + since);
                    const fl = g.createRadialGradient(sx, sy, 0, sx, sy, rr);
                    fl.addColorStop(0, 'rgba(255,255,255,' + f * a + ')');
                    fl.addColorStop(0.35, 'rgba(95,212,255,' + f * 0.6 * a + ')');
                    fl.addColorStop(1, 'rgba(95,212,255,0)');
                    g.globalAlpha = 1;
                    g.fillStyle = fl;
                    g.fillRect(sx - rr, sy - rr, rr * 2, rr * 2);
                    // shockwave
                    const ring = base * (0.5 + since * 3.2) / d;
                    g.globalAlpha = a * f * 0.85;
                    g.strokeStyle = '#5fd4ff';
                    g.lineWidth = Math.max(1, base * 0.06 / d);
                    g.beginPath();
                    g.arc(sx, sy, ring, 0, 6.2832);
                    for (let j = 0; j < 8; j++) {
                        const sa = p.sa + j * 0.785;
                        g.moveTo(sx + Math.cos(sa) * ring * 0.6, sy + Math.sin(sa) * ring * 0.6);
                        g.lineTo(sx + Math.cos(sa) * ring * 1.25, sy + Math.sin(sa) * ring * 1.25);
                    }
                    g.stroke();
                    bang = Math.max(bang, f * a * Math.min(1, 3 / d));
                }
                g.globalAlpha = a;
                drawGlyph(g, p.f, since < 1.3 ? '#bfefff' : SK.fg, fam, fz, sx, sy);
            });
            if (bang > 0.05) {
                // flash for close hits
                g.globalAlpha = bang * 0.35;
                g.fillStyle = '#5fd4ff';
                g.fillRect(0, 0, W, H);
            }
            Q.forEach(p => {
                let d = p.z - cz;
                if (d < 0.35) {
                    qSpawn(p, 13 + Math.random() * 2, cz);
                    d = p.z - cz;
                }
                // swirl round the centre of the field, faster as they come close
                const spin = p.w * (1.2 + 3 / d);
                const ang = p.a0 + spin * t / 1000;
                const [sx, sy] = pr(Math.cos(ang) * p.r0, Math.sin(ang) * p.r0, d);
                if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) {
                    return;
                }
                const a = Math.min(1, (d - 0.35) / 0.9) * (d > 10 ? (14 - d) / 4 : 1) * (1 - q * 0.95);
                if (a <= 0) {
                    return;
                }
                const r = Math.max(1.8, base * 0.085 / d);
                const glow = r * 3.4;
                // a short trail along the swirl
                g.globalAlpha = a * 0.4;
                g.strokeStyle = QS_COLS[p.c];
                g.lineWidth = Math.max(1, r * 0.7);
                g.beginPath();
                for (let s = 0; s <= 6; s++) {
                    const b2 = ang - spin * s * 0.035;
                    const [tx, ty] = pr(Math.cos(b2) * p.r0, Math.sin(b2) * p.r0, d + s * 0.05);
                    if (s) {
                        g.lineTo(tx, ty);
                    } else {
                        g.moveTo(tx, ty);
                    }
                }
                g.stroke();
                g.globalAlpha = a;
                if (!p.k) {
                    g.drawImage(qsSprite(p.c), sx - glow, sy - glow, glow * 2, glow * 2);
                    return;
                }
                const turn = p.sp + t / 420 * p.w;
                const pts = [0, 1, 2].map(j => [sx + Math.cos(turn + j * 2.094) * r * 2.4, sy + Math.sin(turn + j * 2.094) * r * 2.4]);
                if (r > 1.8) {
                    g.globalAlpha = a * 0.55;
                    g.strokeStyle = '#f0c419';
                    g.lineWidth = Math.max(0.6, r * 0.28);
                    g.beginPath();
                    pts.forEach((A, j) => {
                        const B = pts[(j + 1) % 3];
                        const nx = -(B[1] - A[1]);
                        const ny = B[0] - A[0];
                        const L = Math.hypot(nx, ny) || 1;
                        for (let s = 0; s <= 8; s++) {
                            const f = s / 8;
                            const o = Math.sin(f * Math.PI * 4 + t / 90) * r * 0.45 * Math.sin(f * Math.PI);
                            const X = A[0] + (B[0] - A[0]) * f + nx / L * o;
                            const Y = A[1] + (B[1] - A[1]) * f + ny / L * o;
                            if (s) {
                                g.lineTo(X, Y);
                            } else {
                                g.moveTo(X, Y);
                            }
                        }
                    });
                    g.stroke();
                    g.globalAlpha = a;
                }
                const gl = glow * 0.75;
                pts.forEach((A, j) => g.drawImage(qsSprite(j), A[0] - gl, A[1] - gl, gl * 2, gl * 2));
            });
            const st = 0.45 + 0.55 * sm((u - 0.55) / 0.1);
            T.forEach((tg, i) => {
                const [px, py] = pr(tg.x, tg.y, dt);
                const sx = px + ((targets ? targets[i].x : W * (i + 0.5) / N) - px) * w2;
                const sy = py + ((targets ? targets[i].y : H / 2) - py) * w2;
                const sz = fsA[i] * st / dt;
                const o = i * 40;
                const ac = ACC[tiers[i]];
                const hl = t >= T1 - 60 || (t >= T1 - 240 + o && t < T1 - 150 + o) || (two[i] && t >= T1 - 450 + o && t < T1 - 360 + o);
                g.globalAlpha = 1;
                if (hl) {
                    const h = Math.max(16, sz * 0.9) * (1 + (1 - w) * 0.6);
                    g.strokeStyle = ac;
                    g.lineWidth = 2;
                    g.beginPath();
                    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => {
                        g.moveTo(sx + a * h, sy + b * h * 0.7 - b * 8);
                        g.lineTo(sx + a * h, sy + b * h * 0.7);
                        g.lineTo(sx + a * h - a * 8, sy + b * h * 0.7);
                    });
                    if (u < 0.95) {
                        g.stroke();
                    }
                }
                g.globalAlpha = hl ? 1 : 0.8 * Math.min(1, (dt - 0.35) / 0.9);
                drawGlyph(g, labels[i], hl ? (u > 0.65 ? SK.hi : ac) : SK.fg, fam, sz, sx, sy);
            });
            g.globalAlpha = 0.9;
            g.fillStyle = acc;
            g.font = '600 11px ' + fam;
            g.textBaseline = 'alphabetic';
            g.textAlign = 'left';
            g.fillText(u < 0.65 ? 'FIELD SCAN' : (N > 1 ? 'LOCK x' + N : 'LOCK'), 18, 26);
            g.textAlign = 'right';
            g.fillText('RNG ' + D.toFixed(1), W - 18, 26);
            if (ev) {
                g.textAlign = 'left';
                g.fillStyle = EV_HUD[ev][1];
                g.globalAlpha = 0.75 + 0.25 * Math.sin(t / 160);
                g.fillText(EV_HUD[ev][0], 18, H - 18);
                g.fillStyle = acc;
                g.globalAlpha = 0.9;
            }
            g.textBaseline = 'middle';
            g.textAlign = 'center';
            if (u < 0.65) {
                g.globalAlpha = 0.25;
                g.strokeStyle = SK.fg;
                g.lineWidth = 1;
                g.beginPath();
                g.moveTo(W / 2 - 10, H / 2);
                g.lineTo(W / 2 + 10, H / 2);
                g.moveTo(W / 2, H / 2 - 10);
                g.lineTo(W / 2, H / 2 + 10);
                g.stroke();
            }
            if (u >= 1) {
                fin();
            } else {
                requestAnimationFrame(frame);
            }
        })(performance.now());
    });
}
