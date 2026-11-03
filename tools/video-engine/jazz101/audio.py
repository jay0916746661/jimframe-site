import numpy as np, json, re, sys, soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve
SR = 44100
rng = np.random.default_rng(11)

def hz(m): return 440 * 2 ** ((m - 69) / 12)
def lp(x, f, o=2): return sosfilt(butter(o, f / (SR / 2), 'low', output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f / (SR / 2), 'high', output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a / (SR / 2), b / (SR / 2)], 'band', output='sos'), x)
def env(n, a=0.005, dec=4.0):
    t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t * dec)
def noise(n): return rng.uniform(-1, 1, n)

class Track:
    def __init__(s, dur): s.n = int(SR * dur); s.L = np.zeros(s.n); s.R = np.zeros(s.n)
    def add(s, y, t, pan=0.0, g=1.0):
        i = int(t * SR)
        if i >= s.n or i < 0 and i + len(y) <= 0: return
        if i < 0: y = y[-i:]; i = 0
        m = min(len(y), s.n - i); y = y[:m] * g
        s.L[i:i + m] += y * np.sqrt((1 - pan) / 2); s.R[i:i + m] += y * np.sqrt((1 + pan) / 2)
    def st(s): return np.stack([s.L, s.R], 1)

# ---------- instruments ----------
def piano(ms, dur, v=0.5):
    n = int(SR * min(dur + 0.6, 3.5)); t = np.arange(n) / SR; y = np.zeros(n)
    for m in ms:
        f = hz(m)
        for h, a in [(1, 1), (2, .45), (3, .2), (4, .1), (5, .05)]:
            y += a * np.sin(2 * np.pi * f * h * t * (1 + 0.0004 * h)) * np.exp(-t * (1.6 + h * 0.9))
    rel = np.ones(n); k = int(SR * dur)
    if k < n: rel[k:] = np.exp(-np.arange(n - k) / SR * 12)
    y = y * rel * np.minimum(1, t / 0.004) + 0.02 * lp(noise(n), 3000) * np.exp(-t * 60)
    return y * v / max(1, len(ms)) * 2.2
def bass(m, dur, v=0.6):
    n = int(SR * (dur + 0.1)); t = np.arange(n) / SR; f = hz(m)
    y = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    y *= np.minimum(1, t / 0.008) * np.exp(-t * 2.2); y[-int(SR*0.05):] *= np.linspace(1, 0, int(SR*0.05))
    return lp(y, 900) * v
def guitar(m, dur, v=0.4, bright=1.0):
    n = int(SR * min(dur + 0.4, 3)); t = np.arange(n) / SR; f = hz(m); y = np.zeros(n)
    for h in range(1, 9): y += (1 / h ** (1.3 / bright)) * np.sin(2 * np.pi * f * h * t) * np.exp(-t * (2 + h * 1.3))
    return y * np.minimum(1, t / 0.002) * v
def ride(v=0.25):
    n = int(SR * 0.9); t = np.arange(n) / SR
    y = hp(noise(n), 5000) * np.exp(-t * 6) * 0.6 + sum(np.sin(2 * np.pi * f * t) for f in (3150, 4870, 6230)) * np.exp(-t * 9) * 0.08
    return y * v
def hat(v=0.2):
    n = int(SR * 0.06); return hp(noise(n), 7000) * env(n, 0.001, 60) * v
def brush(dur, v=0.12):
    n = int(SR * dur); t = np.arange(n) / SR
    return bp(noise(n), 2000, 7000) * np.sin(np.pi * t / dur) ** 2 * v
def kick(v=0.4):
    n = int(SR * 0.3); t = np.arange(n) / SR; f = 48 + 70 * np.exp(-t * 35)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 11) * v
def snare(v=0.25):
    n = int(SR * 0.22); t = np.arange(n) / SR
    return (bp(noise(n), 1500, 6000) * np.exp(-t * 18) + 0.4 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)) * v
def horn(ms, dur, v=0.25, cut=1800, vib=1):
    n = int(SR * dur); t = np.arange(n) / SR; y = np.zeros(n)
    for m in ms:
        f = hz(m) * (1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * vib * np.minimum(1, t / 0.4))
        ph = np.cumsum(f) / SR; y += 2 * (ph % 1) - 1
    a = np.minimum(1, t / 0.06) * np.minimum(1, (dur - t) / 0.08).clip(0, 1)
    return lp(y * a, cut, 2) * v / len(ms)
def strings(ms, dur, v=0.2):
    n = int(SR * dur); t = np.arange(n) / SR; y = np.zeros(n)
    for m in ms:
        for d in (-0.003, 0, 0.003):
            ph = np.cumsum(np.full(n, hz(m) * (1 + d))) / SR; y += 2 * (ph % 1) - 1
    a = np.minimum(1, t / 0.5) * np.minimum(1, (dur - t) / 0.5).clip(0, 1)
    return lp(y * a, 2200) * v / len(ms) / 3

# ---------- styles ----------
def chordtones(name):
    R = {'C':48,'Db':49,'D':50,'Eb':51,'E':52,'F':53,'Gb':54,'G':55,'Ab':56,'A':57,'Bb':58,'B':59}
    mt = re.match(r'([A-G]b?)(.*)', name); r = R[mt.group(1)]; q = mt.group(2)
    iv = {'maj7':[0,4,7,11],'m7':[0,3,7,10],'7':[0,4,7,10],'m6':[0,3,7,9],'6':[0,4,7,9],'m7b5':[0,3,6,10],'m':[0,3,7,14],'7b9':[0,4,10,13],'m9':[0,3,10,14],'sus':[0,5,10,14]}[q]
    return r, iv
def voicing(name, top=64):
    r, iv = chordtones(name); ns = [r + x for x in iv[1:]] + [r + iv[0] + 12]
    ns = sorted(set(((n - top + 24) % 12) + top - 12 for n in ns))
    return ns

def swing_band(tr, dur, bpm, prog, opt):
    spb = 60 / bpm; bars = int(dur / (4 * spb)) + 2; sw = opt.get('swing', 0.66)
    def sb(b): return np.floor(b) + (sw if (b % 1) >= 0.5 - 1e-6 else 0)
    for bar in range(bars):
        ch = prog[bar % len(prog)]; r, iv = chordtones(ch); t0 = bar * 4 * spb
        # walking bass / two-beat
        if opt.get('two'):
            for b, n in [(0, r - 12), (2, r - 5)]: tr.add(bass(n, spb * 1.9, 0.75), t0 + b * spb, -0.1)
        else:
            nxt = chordtones(prog[(bar + 1) % len(prog)])[0]
            line = [r - 12, r - 12 + iv[1], r - 12 + iv[2], nxt - 12 + (1 if (bar % 2) else -1)]
            for b, n in enumerate(line): tr.add(bass(n, spb * 0.95, 0.7), t0 + b * spb, -0.1)
        # ride / hat / brush
        if opt.get('drums', 1):
            for b in range(4):
                tr.add(ride(0.22 if b % 2 else 0.17), t0 + b * spb, 0.35)
                if b % 2: tr.add(ride(0.13), t0 + (b + sw) * spb, 0.35); tr.add(hat(0.25), t0 + b * spb, 0.2)
            tr.add(kick(0.12), t0, 0); tr.add(kick(0.07), t0 + 2 * spb, 0)
            if opt.get('brush'): tr.add(brush(spb * 3.6, 0.05), t0, -0.3)
            if bar % 4 == 3: tr.add(snare(0.12), t0 + (3 + sw) * spb, 0.1)
        # comping
        vo = voicing(ch, opt.get('ptop', 66)); comp = [(1 + sw * 0, 0.4), (2 + sw, 0.25)] if bar % 2 else [(0 + sw, 0.3), (2, 0.5)]
        for b, d in comp:
            if opt.get('banjo'):
                for k in range(4): tr.add(guitar(vo[0] + 12 * 0 + [0, 4, 7, 12][k] if False else vo[k % len(vo)] + 12, 0.15, 0.12, 1.8), t0 + b * spb + k * 0.012, 0.3)
            else: tr.add(piano(vo, d * spb * 2, 0.32), t0 + b * spb, 0.25)
        # horn section pads / riffs
        if opt.get('horns') and bar % 2 == 0:
            hv = [x + 12 for x in voicing(ch, 62)]
            tr.add(horn(hv[:3], spb * 1.6, 0.11, 2200), t0 + (1 + sw) * spb, -0.35)
            tr.add(horn(hv[:3], spb * 0.5, 0.12, 2400), t0 + (3 + sw) * spb, -0.35)
        # lead line
        if opt.get('lead') and bar % 4 in (0, 1):
            scale = [r + x for x in iv] + [r + 12]
            for k in range(4):
                n = 60 + (scale[(bar * 3 + k * 2) % len(scale)] % 12) + (12 if opt.get('lead') == 'high' else 0)
                tr.add(horn([n], spb * 0.7, 0.07, 3000), t0 + sb(k * 0.5 + 0.5) * spb + k * spb * 0.5, -0.5)

def five(tr, dur, opt):
    spb = 60 / 172; bar = 5 * spb; t = 0; k = 0
    A = [63, 66, 70, 73]; B = [58, 61, 65, 68]
    while t < dur:
        ch = A if k % 2 == 0 else B; root = 39 if k % 2 == 0 else 46
        for b in range(5): tr.add(ride(0.2 if b in (0, 3) else 0.14), t + b * spb, 0.35)
        tr.add(ride(0.1), t + 1.66 * spb, 0.35); tr.add(ride(0.1), t + 4.66 * spb, 0.35)
        tr.add(hat(0.25), t + 1 * spb, 0.2); tr.add(hat(0.25), t + 3 * spb, 0.2)
        tr.add(kick(0.18), t); tr.add(kick(0.1), t + 3 * spb); tr.add(snare(0.08), t + 2.66 * spb, 0.1)
        tr.add(piano(ch, 0.4 * spb * 2, 0.35), t + spb, 0.2); tr.add(piano(ch, 0.25, 0.25), t + 2.66 * spb, 0.2); tr.add(piano(ch, 0.4, 0.28), t + 4 * spb, 0.2)
        tr.add(bass(root, spb * 2.8, 0.75), t, -0.1); tr.add(bass(root + 7, spb * 1.8, 0.65), t + 3 * spb, -0.1)
        if k % 4 == 2: tr.add(horn([75, 70], bar * 1.8, 0.06, 2000), t, -0.4)
        t += bar; k += 1

def ballad(tr, dur, opt):
    spb = 60 / 58; prog = ['Bbm', 'Gbmaj7', 'Ebm', 'F7b9']; t = 0; k = 0
    while t < dur:
        ch = prog[k % 4]; r, iv = chordtones(ch); vo = voicing(ch, 62)
        tr.add(piano(vo, spb * 3.5, 0.32), t, 0.15); tr.add(piano([vo[-1] + 12], spb * 1.5, 0.16), t + 2 * spb, 0.3)
        tr.add(bass(r - 12 + (12 if r < 46 else 0), spb * 3.8, 0.55), t, -0.1)
        tr.add(brush(spb * 3.9, 0.035), t, -0.3)
        tr.add(strings([x - 12 for x in vo[:3]], spb * 4, 0.12), t, 0)
        t += 4 * spb; k += 1

def gypsy(tr, dur, opt):
    spb = 60 / 190; prog = ['Am6', 'Am6', 'E7', 'E7', 'Dm6', 'Am6', 'E7', 'Am6']; t = 0; k = 0
    while t < dur:
        ch = prog[k % 8]; r, iv = chordtones(ch); vo = voicing(ch, 64)
        for b in range(4):
            if b % 2 == 0: tr.add(bass(r - 12 + (7 if b == 2 else 0), spb * 0.9, 0.7), t + b * spb, -0.1)
            for s in range(4): tr.add(guitar(vo[s % len(vo)], 0.12 if b % 2 else 0.2, 0.09 if b % 2 else 0.06, 2.2), t + b * spb + s * 0.008, 0.25)
        if k % 2 == 0:
            for j in range(6):
                n = 69 + [0, 3, 7, 9, 12, 7, 3, 0][(k + j) % 8] - (5 if ch.startswith('E') else 0)
                tr.add(guitar(n + 12, spb * 0.6, 0.12, 1.6), t + j * spb * 0.66, -0.45)
        else: tr.add(strings([69 + 12 - (5 if ch.startswith('E') else 0)], spb * 4, 0.1), t, -0.5)
        t += 4 * spb; k += 1

def guitar251(tr, dur, opt):
    spb = 60 / 92; t = 0; k = 0
    V = [[50, 57, 60, 65, 69], [43, 50, 53, 59, 62, 67], [48, 55, 59, 64]]
    while t < dur:
        vo = V[k % 3] if k % 4 != 3 else V[2]
        for s, n in enumerate(vo): tr.add(guitar(n, spb * 3.5, 0.13, 1.1), t + s * 0.025, 0.1)
        for s, n in enumerate(vo[1:]): tr.add(guitar(n, spb * 0.9, 0.06, 1.1), t + 2.5 * spb + s * 0.02, 0.15)
        tr.add(bass(vo[0] - 12 + (12 if vo[0] < 45 else 0), spb * 3.8, 0.5), t, -0.1)
        for b in range(4): tr.add(ride(0.1), t + b * spb, 0.35); tr.add(brush(spb * 0.9, 0.03), t + b * spb, -0.3)
        t += 4 * spb; k += 1

def modal(tr, dur, opt):
    spb = 60 / 132; bars = int(dur / (4 * spb)) + 2
    D = [50, 52, 53, 55, 57, 59, 60]
    for bar in range(bars):
        t0 = bar * 4 * spb
        for b in range(4): tr.add(bass(D[(bar * 2 + b * 3) % 7] - 12, spb * 0.95, 0.7), t0 + b * spb, -0.1)
        for b in range(4):
            tr.add(ride(0.2 if b % 2 else 0.15), t0 + b * spb, 0.35)
            if b % 2: tr.add(ride(0.12), t0 + (b + 0.66) * spb, 0.35); tr.add(hat(0.22), t0 + b * spb, 0.2)
        q = [62, 67, 72, 77, 81] if bar % 4 < 3 else [64, 69, 74, 79, 83]
        tr.add(piano(q, spb * 1.2, 0.3), t0 + 0.66 * spb, 0.25); tr.add(piano([x - 2 for x in q], spb * 1.5, 0.28), t0 + 2 * spb, 0.25)
        if bar % 8 == 4: tr.add(horn([74, 69], spb * 6, 0.05, 1600), t0, -0.4)

STY = {
 'five': lambda tr, d: five(tr, d, {}),
 'club': lambda tr, d: swing_band(tr, d, 126, ['Dm7', 'G7', 'Cmaj7', 'A7'], {'lead': 1, 'brush': 1}),
 'ballad': lambda tr, d: ballad(tr, d, {}),
 'hot': lambda tr, d: swing_band(tr, d, 184, ['Bb6', 'G7', 'C7', 'F7'], {'two': 1, 'banjo': 1, 'horns': 1, 'lead': 'high', 'swing': 0.62}),
 'bebop': lambda tr, d: swing_band(tr, d, 214, ['Fmaj7', 'Em7b5', 'A7', 'Dm7', 'Cm7', 'F7', 'Bbmaj7', 'Bbm7'], {'lead': 'high'}),
 'gypsy': lambda tr, d: gypsy(tr, d, {}),
 'bigband': lambda tr, d: swing_band(tr, d, 164, ['C6', 'A7', 'Dm7', 'G7'], {'horns': 1, 'lead': 1}),
 'swing': lambda tr, d: swing_band(tr, d, 118, ['Fmaj7', 'Dm7', 'Gm7', 'C7'], {'brush': 1, 'lead': 1}),
 'guitar': lambda tr, d: guitar251(tr, d, {}),
 'modal': lambda tr, d: modal(tr, d, {}),
}

def koln(tr, dur, opt):
    spb = 60 / 76; t = 0; k = 0
    L = [(45, [57, 60, 64]), (43, [55, 59, 62]), (41, [57, 60, 65]), (43, [55, 59, 62, 67])]
    while t < dur:
        r, up = L[k % 4]
        for b in range(8):  # left-hand ostinato in eighths
            n = [r, r + 7, r + 12, r + 7][b % 4]
            tr.add(piano([n], spb * 0.45, 0.42), t + b * spb / 2, -0.25)
        tr.add(piano(up, spb * 3.6, 0.26), t + spb * 0.5, 0.2)
        if k % 2 == 1:
            mel = [76, 74, 72, 74, 76, 79]
            for j, m in enumerate(mel): tr.add(piano([m - (2 if k % 4 == 3 else 0)], spb * 0.9, 0.18), t + j * spb * 0.66, 0.35)
        t += 4 * spb; k += 1

def calypso(tr, dur, opt):
    spb = 60 / 132; t = 0; k = 0; prog = ['C6', 'G7', 'C6', 'G7', 'F6', 'G7', 'C6', 'C6']
    while t < dur:
        ch = prog[k % 8]; r, iv = chordtones(ch); vo = voicing(ch, 66)
        for b, n in [(0, r - 12), (1.5, r - 5), (2, r - 12), (3, r - 5)]: tr.add(bass(n, spb * 0.8, 0.7), t + b * spb, -0.1)
        for b in (0.5, 1.5, 2.5, 3.5): tr.add(piano(vo, spb * 0.35, 0.22), t + b * spb, 0.25)
        for b in range(8): tr.add(hat(0.18 if b % 2 else 0.1), t + b * spb / 2, 0.3)
        tr.add(kick(0.15), t); tr.add(kick(0.1), t + 2 * spb); tr.add(snare(0.08), t + 1.5 * spb, 0.1); tr.add(snare(0.08), t + 3 * spb, 0.1)
        if k % 2 == 0:
            for j, m in enumerate([67, 69, 72, 76, 74, 72]): tr.add(horn([m], spb * 0.45, 0.08, 2600), t + j * spb * 0.5 + spb * 0.5, -0.45)
        t += 4 * spb; k += 1

def toms(tr, dur, opt):
    spb = 60 / 200; t = 0; k = 0
    while t < dur:
        for b in range(4):
            tom = kick(0.35) * 0.6 + np.pad(snare(0.05), (0, int(SR * 0.08)))[:int(SR * 0.3)]
            tr.add(lp(tom, 400) * 1.6, t + b * spb, 0); tr.add(lp(kick(0.25), 300), t + (b + 0.66) * spb, 0)
        tr.add(bass(45, spb * 1.8, 0.6), t, -0.1); tr.add(bass(48, spb * 1.8, 0.55), t + 2 * spb, -0.1)
        if (k // 2) % 2 == 0:
            for j, m in enumerate([69, 72, 76, 74]): tr.add(horn([m, m - 4], spb * 0.8, 0.09, 2200), t + j * spb, -0.35)
        else: tr.add(horn([57, 60, 64], spb * 3.6, 0.06, 1500), t, 0.35)
        t += 4 * spb; k += 1

def strings_pad(*a, **k): return None

STY.update({
 'koln': lambda tr, d: koln(tr, d, {}),
 'calypso': lambda tr, d: calypso(tr, d, {}),
 'toms': lambda tr, d: toms(tr, d, {}),
 'blues': lambda tr, d: swing_band(tr, d, 150, ['F7', 'Bb7', 'F7', 'F7', 'Bb7', 'Bb7', 'F7', 'D7', 'Gm7', 'C7', 'F7', 'C7'], {'horns': 1, 'lead': 1}),
 'hardbop': lambda tr, d: swing_band(tr, d, 136, ['Fm7', 'Bb7', 'Ebmaj7', 'Abmaj7', 'Dm7b5', 'G7', 'Cm7', 'C7'], {'horns': 1, 'lead': 1}),
 'coltrane': lambda tr, d: swing_band(tr, d, 230, ['Bmaj7', 'D7', 'Gmaj7', 'Bb7', 'Ebmaj7', 'Ebmaj7', 'Am7', 'D7'], {'lead': 'high'}),
 'wes': lambda tr, d: wes(tr, d),
 'chet': lambda tr, d: chet(tr, d),
})

def wes(tr, dur):
    swing_band(tr, dur, 120, ['Gm7', 'C7', 'Fmaj7', 'Fmaj7', 'Gm7', 'C7', 'Am7', 'D7'], {'brush': 1})
    spb = 60 / 120; t = spb * 8; k = 0
    while t < dur:
        for j, m in enumerate([67, 70, 72, 74, 72, 70]):
            tr.add(lp(guitar(m, spb * 0.6, 0.12, 0.7) + guitar(m + 12, spb * 0.6, 0.08, 0.7), 2500), t + j * spb * 0.5 + (0.08 if j % 2 else 0), -0.4)
        t += spb * 8; k += 1

def chet(tr, dur):
    ballad(tr, dur, {})
    spb = 60 / 58; t = spb * 2
    mel = [(65, 1.5), (68, 1), (70, 1.5), (72, 3), (70, 1), (68, 2), (65, 4)]
    while t < dur:
        for m, l in mel:
            if t > dur: break
            tr.add(lp(horn([m + 12], spb * l * 0.95, 0.07, 1400, 0.6), 1600), t, -0.3); t += spb * l
        t += spb * 2

# ---------- sound effects ----------
def sfx(name):
    n = lambda s: int(SR * s)
    if name == 'paper':
        k = n(0.5); return bp(noise(k), 1500, 8000) * (np.abs(np.sin(np.linspace(0, 9, k))) ** 3) * np.exp(-np.linspace(0, 3, k)) * 0.35
    if name == 'pen':
        k = n(0.9); t = np.arange(k) / SR; return bp(noise(k), 3000, 9000) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * t)) ** 4 * 0.18
    if name == 'needle':
        k = n(1.2); y = lp(noise(k), 3000) * 0.04
        for i in rng.integers(0, k, 40): y[i:i + 30] += rng.uniform(-0.4, 0.4)
        return y * np.minimum(1, np.arange(k) / SR / 0.05)
    if name == 'tick':
        k = n(0.05); return hp(noise(k), 3000) * env(k, 0.0005, 120) * 0.5
    if name == 'drumfill':
        y = np.zeros(n(1.0))
        for j in range(6):
            s = snare(0.35) if j < 5 else kick(0.5) + np.pad(ride(0.35), (0, 0))[:n(0.3)]
            i = n(j * 0.12); y[i:i + len(s)] += s[:len(y) - i]
        return y
    if name == 'whoosh':
        k = n(0.6); t = np.linspace(0, 1, k); y = noise(k); out = np.zeros(k)
        for a in range(0, k, 2048):
            f = 400 + 3000 * t[a]; seg = bp(y[a:a + 2048], f * 0.7, f * 1.3, 1); out[a:a + len(seg)] = seg
        return out * np.sin(np.pi * t) ** 2 * 0.5
    if name == 'buzz':
        k = n(0.35); t = np.arange(k) / SR; return lp(np.sign(np.sin(2 * np.pi * 110 * t)), 1500) * env(k, 0.005, 6) * 0.12
    if name == 'pop':
        k = n(0.12); t = np.arange(k) / SR; f = 900 * np.exp(-t * 18) + 300; return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(k, 0.001, 30) * 0.35
    if name == 'ding':
        k = n(1.6); t = np.arange(k) / SR; return (np.sin(2 * np.pi * 1568 * t) + 0.5 * np.sin(2 * np.pi * 2093 * t)) * np.exp(-t * 3) * 0.18
    if name == 'coins':
        y = np.zeros(n(1.2))
        for j in range(9):
            k = n(0.25); t = np.arange(k) / SR; f = rng.uniform(3000, 6000)
            s = (np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 1.48 * t)) * np.exp(-t * 25) * 0.12
            i = n(j * 0.09 + rng.uniform(0, 0.04)); y[i:i + k] += s[:len(y) - i]
        return y
    if name == 'heartbeat':
        y = np.zeros(n(2.0))
        for j in range(2):
            for d, v in ((0, 0.6), (0.18, 0.4)):
                s = kick(v) * 0.9; i = n(j * 0.9 + d); y[i:i + len(s)] += s[:len(y) - i]
        return lp(y, 200)
    if name in ('crowd', 'hush'):
        k = n(3.0 if name == 'crowd' else 1.5); t = np.arange(k) / SR; y = np.zeros(k)
        for f in (350, 700, 1200, 2400):
            y += bp(noise(k), f * 0.8, f * 1.2, 1) * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(2, 5) * t + rng.uniform(0, 6)))
        if name == 'hush': y = hp(noise(k), 3000) * np.sin(np.pi * t / t[-1]) * 0.5
        return y * np.minimum(1, t / 0.4) * np.minimum(1, (t[-1] - t) / 0.6) * 0.09
    if name in ('applause', 'bigapplause'):
        D = 2.4 if name == 'applause' else 3.4; k = n(D); y = np.zeros(k); cnt = 260 if name == 'applause' else 520
        for j in range(cnt):
            c = hp(noise(n(0.02)), 900) * env(n(0.02), 0.0005, 160); i = int(rng.uniform(0, 0.9) ** 0.7 * (k - n(0.03)))
            y[i:i + len(c)] += c * rng.uniform(0.1, 0.3)
        t = np.arange(k) / SR; return y * np.minimum(1, t / 0.2) * np.minimum(1, (D - t) / 1.0) * (0.5 if name == 'applause' else 0.7)
    if name == 'glass':
        k = n(1.0); t = np.arange(k) / SR; return sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in ((2637, 5), (3951, 7), (5274, 9))) * 0.08
    if name == 'switch':
        k = n(0.08); return (bp(noise(k), 800, 4000) * env(k, 0.0005, 80)) * 0.7
    if name == 'wind':
        k = n(3.0); t = np.arange(k) / SR; return bp(noise(k), 200, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * t)) * np.sin(np.pi * t / 3) * 0.25
    if name == 'stamp':
        k = n(0.35); t = np.arange(k) / SR; return (lp(noise(k), 600) * np.exp(-t * 30) * 0.9 + np.sin(2 * np.pi * 70 * t) * np.exp(-t * 20) * 0.5)
    if name == 'flash':
        k = n(0.5); t = np.arange(k) / SR; return (hp(noise(k), 2000) * np.exp(-t * 40) * 0.4 + np.sin(2 * np.pi * (2000 + 6000 * t) * t) * np.exp(-t * 6) * 0.05)
    if name == 'crash':
        k = n(2.5); t = np.arange(k) / SR; y = hp(noise(k), 3000) * np.exp(-t * 1.8) * 0.5 + sum(np.sin(2 * np.pi * f * t) for f in (420, 777, 1210, 1980)) * np.exp(-t * 2.5) * 0.04
        return y
    if name == 'laugh':
        y = np.zeros(n(2.4))
        for p in range(6):
            base = rng.uniform(160, 300); off = rng.uniform(0, 0.4)
            for j in range(5):
                k = n(0.13); t = np.arange(k) / SR; src = np.sign(np.sin(2 * np.pi * base * (1 - j * 0.03) * t))
                s = (bp(src, 600, 1100, 1) + 0.6 * bp(src, 1100, 1700, 1)) * np.sin(np.pi * t / t[-1]) * 0.08
                i = n(off + j * 0.2 + p * 0.05); y[i:i + k] += s[:len(y) - i]
        return y
    if name == 'flap':
        y = np.zeros(n(1.0))
        for j in range(5):
            k = n(0.1); s = lp(noise(k), 1200) * np.sin(np.pi * np.arange(k) / k) * 0.4; i = n(j * 0.16); y[i:i + k] += s
        return y
    if name == 'projector':
        k = n(3.0); t = np.arange(k) / SR; return bp(noise(k), 500, 3000) * (np.sin(2 * np.pi * 24 * t) > 0.6) * 0.08 * np.minimum(1, t / 0.3) * np.minimum(1, (3 - t) / 0.5)
    if name == 'match':
        k = n(0.8); t = np.arange(k) / SR; return hp(noise(k), 1500) * (np.exp(-t * 12) * 0.6 + 0.08 * np.exp(-t * 2))
    if name == 'fire':
        k = n(3.0); t = np.arange(k) / SR; y = lp(noise(k), 800) * 0.15
        for i in rng.integers(0, k - 400, 90): y[i:i + 300] += hp(noise(300), 2000) * np.exp(-np.arange(300) / 40) * rng.uniform(0.1, 0.5)
        return y * np.minimum(1, t / 0.6) * np.minimum(1, (3 - t) / 0.8)
    if name == 'hit':
        k = n(0.6); t = np.arange(k) / SR; return np.sin(2 * np.pi * (80 + 40 * np.exp(-t * 20)) * t) * np.exp(-t * 6) * 0.6 + lp(noise(k), 500) * np.exp(-t * 20) * 0.3
    if name == 'page':
        k = n(0.3); t = np.arange(k) / SR; return bp(noise(k), 1200, 7000) * np.sin(np.pi * t / 0.3) ** 2 * 0.3
    if name == 'pluck': return guitar(76, 0.6, 0.25, 1.5)
    if name == 'strum':
        y = np.zeros(n(1.6))
        for s, m in enumerate([45, 52, 57, 60, 64]):
            g = guitar(m, 1.2, 0.12, 1.4); i = n(s * 0.015); y[i:i + len(g)] += g[:len(y) - i]
        return y
    if name == 'tap':
        k = n(0.1); return bp(noise(k), 1000, 5000) * env(k, 0.0005, 70) * 0.5
    if name == 'shimmer':
        k = n(1.8); t = np.arange(k) / SR; y = np.zeros(k)
        for j, f in enumerate((1568, 1976, 2349, 3136)): y += np.sin(2 * np.pi * f * t) * np.exp(-((t - j * 0.12).clip(0)) * 3) * (t > j * 0.12)
        return y * 0.05
    if name == 'copier':
        k = n(2.4); t = np.arange(k) / SR; return (bp(noise(k), 300, 1500) * 0.12 + np.sin(2 * np.pi * 120 * t) * 0.03) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.4 * t)) * np.minimum(1, t / 0.2) * np.minimum(1, (2.4 - t) / 0.3)
    if name == 'clock':
        y = np.zeros(n(2.0))
        for j in range(4): s = sfx('tick') * (1 if j % 2 else 0.6); i = n(j * 0.5); y[i:i + len(s)] += s
        return y
    if name == 'clunk':
        a = lp(piano([36, 37], 0.6, 0.9), 600); b = sfx('hit'); m = max(len(a), len(b)); return np.pad(a, (0, m - len(a))) + np.pad(b, (0, m - len(b))) * 0.5
    if name == 'door':
        k = n(1.0); t = np.arange(k) / SR; cr = bp(np.sign(np.sin(2 * np.pi * (180 + 60 * np.sin(t * 9)) * t)), 300, 1500, 1) * np.sin(np.pi * t) * 0.08
        sl = np.zeros(k); h = sfx('hit')[:n(0.4)]; sl[n(0.6):n(0.6) + len(h)] += h[:k - n(0.6)] * 0.7
        return cr + sl
    if name == 'train':
        k = n(3.0); t = np.arange(k) / SR; y = lp(noise(k), 500) * 0.25
        for j in range(12): c = lp(kick(0.3), 300); i = n(j * 0.25 + (0.08 if j % 2 else 0)); y[i:i + len(c)] += c[:k - i] * 0.6
        return y * np.sin(np.pi * t / 3) * 0.9
    if name == 'pin2': return sfx('pop')
    if name == 'clang':
        k = n(1.2); t = np.arange(k) / SR; return sum(np.sin(2 * np.pi * f * t) for f in (220, 563, 1011, 1520)) * np.exp(-t * 4) * 0.08
    if name == 'knock':
        y = np.zeros(n(0.8))
        for j in range(3): c = lp(kick(0.4), 900); i = n(j * 0.18); y[i:i + len(c)] += c[:len(y) - i]
        return y
    if name == 'bat':
        k = n(0.4); t = np.arange(k) / SR; return (bp(noise(k), 1000, 6000) * np.exp(-t * 60) * 0.9 + np.sin(2 * np.pi * 900 * t) * np.exp(-t * 40) * 0.3)
    if name == 'sour': return piano([59, 60, 66], 0.8, 0.5)
    if name == 'chord': return piano([60, 64, 67, 71, 74], 1.6, 0.6)
    if name == 'chordthin': return piano([60, 67, 74], 1.6, 0.6)
    return np.zeros(10)

def reverb(x, sec=1.6, wet=0.18):
    k = int(SR * sec); ir = rng.normal(0, 1, k) * np.exp(-np.linspace(0, 7, k)); ir = lp(ir, 5000); ir /= np.sqrt(np.sum(ir ** 2))
    return x + wet * np.stack([fftconvolve(x[:, 0], ir)[:len(x)], fftconvolve(x[:, 1], ir[::-1] * 0.98)[:len(x)]], 1)

def lufs_norm(x, target=-14):
    import pyloudnorm as pln
    m = pln.Meter(SR); l = m.integrated_loudness(x); y = pln.normalize.loudness(x, l, target)
    y = np.where(np.abs(y) > 0.8, np.sign(y) * (0.8 + 0.18 * np.tanh((np.abs(y) - 0.8) / 0.18)), y)
    return y

if __name__ == '__main__':
    ep = int(sys.argv[1])
    src = open('scenes.js').read(); EPD = json.loads(open('epdata.js').read()[8:-1])
    D = EPD[ep]; dur = D['dur']; A = json.load(open('align3.json'))[ep]
    voice, sr0 = sf.read('vo/a.wav'); a0 = A['a0']; a1 = A['a1']
    v = voice[int(a0 * SR):int(a1 * SR)].copy(); fz = int(SR * 0.12); v[-fz:] *= np.linspace(1, 0, fz); v = np.concatenate([np.zeros(int(0.0 * SR)), v])
    vv = np.zeros(int(dur * SR)); vv[:len(v)] = v[:len(vv)]
    # music
    import ast
    moods = re.findall(r"mood:'(\w+)'", src); mood = moods[ep]
    mus = Track(dur + 0.5); STY[mood](mus, dur + 0.5); M = reverb(mus.st(), 1.8, 0.22)[:len(vv)]
    fo = int(SR * 1.5); M[-fo:] *= np.linspace(1, 0, fo)[:, None]; M[:int(SR*0.3)] *= np.linspace(0, 1, int(SR*0.3))[:, None]
    # sfx from scenes
    blocks = re.split(r"\{ key:", src)[1:]; bl = blocks[ep]
    sc = re.findall(r"s:\[(.*?)\]\}", bl)
    fx = Track(dur + 3)
    for i, s in enumerate(sc):
        for nm, t in re.findall(r"\['(\w+)',([0-9.]+)\]", s):
            t0 = max(0, D['sst'][i] - 0.12) if i < len(D['sst']) else 0
            fx.add(sfx(nm), t0 + float(t), rng.uniform(-0.4, 0.4))
    F = reverb(fx.st(), 1.0, 0.12)[:len(vv)]
    # voice env for ducking
    e = np.abs(vv); k = int(SR * 0.08); e = np.convolve(e, np.ones(k) / k, 'same'); e = e / (e.max() + 1e-9)
    duck = 1 - 0.35 * np.clip(e * 4, 0, 1); duck = np.convolve(duck, np.ones(int(SR*0.15)) / int(SR*0.15), 'same')
    V = np.stack([vv, vv], 1)
    vr = np.sqrt(np.mean(vv[vv != 0] ** 2)); mr = np.sqrt(np.mean(M ** 2)) + 1e-9; fr = np.sqrt(np.mean(F[np.abs(F).sum(1) > 1e-4] ** 2)) + 1e-9
    Mg = M / mr * vr * 10 ** (-7 / 20); Fg = F / fr * vr * 10 ** (-9 / 20)
    mixA = V + Mg * duck[:, None] + Fg * 0.8
    mixB = V + Fg * 1.15 + Mg * duck[:, None] * 0.12
    import os; os.makedirs('aud', exist_ok=True)
    sf.write(f'aud/e{ep}_music.wav', lufs_norm(mixA), SR); sf.write(f'aud/e{ep}_sfx.wav', lufs_norm(mixB), SR)
    print('ok', ep, mood, round(dur, 1))
