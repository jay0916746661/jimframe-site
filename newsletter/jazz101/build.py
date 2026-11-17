"""爵士101 網站產生器 v3（蘋果質感・暖光・會出聲的唱片）
用法：python3 build.py [Substack網址]
輸出 jazz/index.html、jazz/story/<slug>.html、jazz/style.css、jazz/player.js、jazz/img/"""
import os, sys, json, html, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'jazz')
sys.path.insert(0, HERE)
from stories import S

IMGSRC = os.path.join(HERE, 'img')            # 照片放這裡（含 meta.json）
META = json.load(open(os.path.join(IMGSRC, 'meta.json'), encoding='utf-8')) if os.path.exists(os.path.join(IMGSRC, 'meta.json')) else {}
PHOTO = {'village-vanguard-1961': 'village', 'koln-concert': 'koln', 'sonny-rollins-bridge': 'rollins',
         'van-gelder-living-room': 'vangelder', 'giant-steps': 'coltrane', 'real-book': None}
for s in S:
    n = sum(len(x) for _, ps in s['sections'] for x in ps) + sum(len(a) + len(b) for a, b in s['listen'])
    s['read'] = f"{max(2, round(n / 400))} 分鐘"
    k = PHOTO.get(s['slug'])
    s['ph'] = META.get(k) if k else None

SUB = sys.argv[1] if len(sys.argv) > 1 else ''
IG = 'https://www.instagram.com/jazz101tw/'
SUB_HREF = SUB or IG
SUB_TXT = '免費訂閱' if SUB else '先追蹤 IG，電子報開放時通知你'
COMING = json.load(open(os.path.join(HERE, 'coming.json'), encoding='utf-8'))
e = html.escape

CSS = r"""
:root{
  --paper:#ffffff; --ink:#1d1d1f; --graphite:#6e6e73; --hair:#e3e1dc;
  --brass:#a97a2b; --midnight:#172033; --lamp:#f5ebdd; --wash:#faf8f4;
  --font:"Inter",-apple-system,BlinkMacSystemFont,"PingFang TC","Noto Sans TC",sans-serif;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --paper:#121417; --ink:#f2f1ee; --graphite:#a1a1a6; --hair:#2a2d33; --brass:#d2a24e; --midnight:#0c111c; --lamp:#3a2f22; --wash:#181b20;}}
:root[data-theme="dark"]{--paper:#121417; --ink:#f2f1ee; --graphite:#a1a1a6; --hair:#2a2d33; --brass:#d2a24e; --midnight:#0c111c; --lamp:#3a2f22; --wash:#181b20;}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{background:var(--paper);color:var(--ink);font-family:var(--font);font-size:17px;line-height:1.75;-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:inherit}
:focus-visible{outline:2px solid var(--brass);outline-offset:3px;border-radius:6px}
img{display:block;max-width:100%}

/* nav */
.nav{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--paper) 78%,transparent);backdrop-filter:saturate(180%) blur(20px);-webkit-backdrop-filter:saturate(180%) blur(20px);border-bottom:1px solid var(--hair)}
.nav .in{max-width:1000px;margin:0 auto;padding:0 22px;height:52px;display:flex;align-items:center;justify-content:space-between}
.brand{font-weight:600;font-size:17px;text-decoration:none;letter-spacing:-.01em}
.nav nav a{font-size:13px;color:var(--graphite);text-decoration:none;margin-left:22px}
.nav nav a:hover{color:var(--ink)}

/* hero */
.hero{text-align:center;padding:84px 22px 40px;position:relative;overflow:hidden}
.hero h1 .nw{display:inline-block;white-space:nowrap}
.hero h1{font-size:clamp(30px,7.4vw,72px);line-height:1.12;font-weight:700;letter-spacing:-.02em}
.hero p{font-size:clamp(18px,2.6vw,22px);color:var(--graphite);margin:18px auto 0;max-width:30em;line-height:1.6}
.ctas{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:30px}
.btn{display:inline-block;background:var(--ink);color:var(--paper);text-decoration:none;font-size:16px;padding:12px 24px;border-radius:999px;font-weight:500}
.btn.alt{background:transparent;color:var(--brass);padding:12px 6px}
.btn.alt:hover{text-decoration:underline}

/* the record */
.stage{position:relative;margin:34px auto 0;width:min(600px,90vw);aspect-ratio:1.18/1;border-radius:28px;
  background:linear-gradient(135deg,rgba(255,255,255,.10),transparent 40%),repeating-linear-gradient(91deg,rgba(0,0,0,.05) 0 2px,transparent 2px 11px,rgba(255,255,255,.035) 11px 13px,transparent 13px 23px),linear-gradient(100deg,#5e3f25,#4a301b 45%,#5a3b22);
  box-shadow:0 50px 90px -40px rgba(60,35,10,.65),inset 0 1px 0 rgba(255,255,255,.18)}
.glow{position:absolute;left:50%;top:58%;width:min(900px,140vw);height:min(900px,140vw);transform:translate(-50%,-50%);background:radial-gradient(closest-side,var(--lamp),transparent 70%);z-index:-1;pointer-events:none}
.platter{position:absolute;top:7%;bottom:7%;left:5%;aspect-ratio:1/1;border-radius:50%;background:#151515;box-shadow:0 40px 80px -30px rgba(20,16,10,.55),0 0 0 10px #232323;z-index:1}
.disc{position:absolute;inset:0;border-radius:50%;
  background:
   radial-gradient(circle at 50% 50%,transparent 0 31%,rgba(255,255,255,.04) 31.3% 31.6%,transparent 32%),
   repeating-radial-gradient(circle at 50% 50%,#101010 0 1.6px,#1b1b1b 1.6px 3.2px),
   #121212}
.disc:after{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 210deg,transparent 0 12%,rgba(255,255,255,.10) 16%,transparent 22% 62%,rgba(255,255,255,.07) 66%,transparent 72%)}
.label{position:absolute;inset:34%;border-radius:50%;background:radial-gradient(circle at 50% 50%,#121212 0 4%,var(--brass) 4.5% 100%);display:grid;place-items:center;text-align:center;color:#20170a}
.label b{font-size:clamp(11px,2vw,15px);font-weight:700;letter-spacing:.02em;display:block;margin-bottom:26%}
.label span{font-size:clamp(9px,1.5vw,11px);display:block}
.spin .disc{animation:spin 1.8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.arm{position:absolute;right:6%;top:8%;width:9%;height:62%;z-index:2;transform-origin:50% 8%;transform:rotate(-18deg);transition:transform 1.1s cubic-bezier(.3,.7,.2,1)}
.arm:before{content:"";position:absolute;left:50%;top:0;width:34px;height:34px;margin-left:-17px;border-radius:50%;background:#d9d6cf;box-shadow:inset 0 0 0 6px #bdb9b0}
.arm i{position:absolute;left:50%;top:6%;width:5px;height:90%;margin-left:-2.5px;background:linear-gradient(#e7e4dd,#bdb9b0);border-radius:3px}
.arm i:after{content:"";position:absolute;bottom:-14px;left:-7px;width:19px;height:26px;background:#2b2b2b;border-radius:4px}
.spin .arm{transform:rotate(6deg)}
.play{position:relative;z-index:3;display:inline-flex;align-items:center;gap:10px;margin-top:26px;background:none;border:1px solid var(--hair);color:var(--ink);font:inherit;font-size:15px;padding:10px 20px;border-radius:999px;cursor:pointer}
.play:hover{border-color:var(--brass)}
.play svg{width:14px;height:14px}
.playnote{font-size:13px;color:var(--graphite);margin-top:10px}
@media (prefers-reduced-motion:reduce){.spin .disc{animation:none}.arm{transition:none}}

/* featured band */
.band{background:var(--midnight);color:#f2efe9;margin-top:90px}
.band .in{max-width:1000px;margin:0 auto;padding:80px 22px;display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
@media (max-width:760px){.band .in{grid-template-columns:1fr;gap:28px;padding:56px 22px}}
.band figure img{border-radius:18px;aspect-ratio:4/5;object-fit:cover;width:100%;filter:sepia(.18) saturate(.9)}
.band figcaption,.credit{font-size:11px;color:#8e93a0;margin-top:8px;line-height:1.5}
.band small{color:var(--brass);font-size:14px}
.band h2{font-size:clamp(28px,4.4vw,44px);line-height:1.2;font-weight:700;letter-spacing:-.015em;margin:10px 0 16px}
.band p{color:#b9bdc7;font-size:17px}
.band .btn{background:#f2efe9;color:#172033;margin-top:26px}
.yearbig{font-size:clamp(64px,10vw,112px);font-weight:200;letter-spacing:-.04em;line-height:1;color:var(--brass)}

/* list */
.wrap{max-width:1000px;margin:0 auto;padding:0 22px}
.sec{padding:96px 0 20px}
.sec h2{font-size:clamp(30px,4.6vw,48px);font-weight:700;letter-spacing:-.02em;line-height:1.15}
.sec .lede{color:var(--graphite);font-size:19px;margin-top:10px;max-width:34em}
.list{margin-top:36px;border-top:1px solid var(--hair)}
.row{display:grid;grid-template-columns:120px 1fr 120px;gap:24px;align-items:center;padding:26px 0;border-bottom:1px solid var(--hair);text-decoration:none}
.row .y{font-size:40px;font-weight:200;letter-spacing:-.03em;color:var(--graphite);transition:color .2s}
.row h3{font-size:21px;font-weight:600;line-height:1.4;letter-spacing:-.01em}
.row p{color:var(--graphite);font-size:15px;line-height:1.65;margin-top:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.row .t{width:120px;aspect-ratio:1/1;border-radius:12px;object-fit:cover;filter:sepia(.15)}
.row .t.empty{background:radial-gradient(circle,#111 0 3%,var(--c,#a97a2b) 3.5% 30%,#161616 31% 100%);border-radius:50%;box-shadow:inset 0 0 0 1px #000}
.row:hover .y{color:var(--brass)}
.row:hover h3{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px}
@media (max-width:640px){.row{grid-template-columns:1fr 84px;gap:14px}.row .y{grid-column:1/-1;font-size:28px;margin-bottom:-12px}.row .t{width:84px}}
.soon{columns:2;column-gap:40px;margin-top:30px;list-style:none}
@media (max-width:640px){.soon{columns:1}}
.soon li{break-inside:avoid;color:var(--graphite);font-size:15px;padding:9px 0;border-bottom:1px solid var(--hair)}

/* newsletter */
.letter{text-align:center;padding:110px 22px;background:var(--wash);margin-top:90px}
.letter h2{font-size:clamp(30px,5vw,52px);font-weight:700;letter-spacing:-.02em;line-height:1.15}
.letter p{color:var(--graphite);font-size:19px;max-width:28em;margin:16px auto 28px}

footer{max-width:1000px;margin:0 auto;padding:30px 22px 60px;font-size:12px;color:var(--graphite);border-top:1px solid var(--hair);line-height:1.8}

/* article */
.ahead{max-width:720px;margin:0 auto;padding:72px 22px 30px;text-align:center}
.ahead .yearbig{color:var(--brass)}
.ahead h1{font-size:clamp(30px,5.6vw,50px);font-weight:700;line-height:1.2;letter-spacing:-.02em;margin-top:18px}
.ahead .dek{color:var(--graphite);font-size:20px;line-height:1.65;margin-top:18px}
.ahead .rt{font-size:14px;color:var(--graphite);margin-top:18px}
.hero-img{max-width:1000px;margin:20px auto 0;padding:0 22px}
.hero-img img{width:100%;max-height:560px;object-fit:cover;border-radius:22px;filter:sepia(.15) saturate(.92)}
.hero-img .credit{color:var(--graphite);text-align:right}
.body{max-width:660px;margin:0 auto;padding:30px 22px 0;font-size:18px;line-height:1.95}
.body h2{font-size:26px;font-weight:700;letter-spacing:-.01em;margin:56px 0 14px;line-height:1.35}
.body p{margin-bottom:22px}
.tracks{max-width:660px;margin:60px auto 0;padding:0 22px}
.tracks h2,.more h2{font-size:26px;font-weight:700;margin-bottom:6px}
.tracks .sub{color:var(--graphite);font-size:15px;margin-bottom:18px}
.tr{display:grid;grid-template-columns:34px 1fr;gap:14px;padding:18px 0;border-top:1px solid var(--hair)}
.tr .n{font-size:15px;color:var(--brass);font-weight:600;padding-top:2px}
.tr b{font-weight:600;font-size:18px}
.tr p{color:var(--graphite);font-size:15px;line-height:1.7;margin-top:2px}
.tr a{font-size:13px;color:var(--brass);text-decoration:none;margin-right:14px}
.tr a:hover{text-decoration:underline}
.more{max-width:660px;margin:56px auto 0;padding:0 22px}
.more ul{list-style:none}
.more li{padding:12px 0;border-top:1px solid var(--hair);font-size:16px}
.src{max-width:660px;margin:40px auto 0;padding:0 22px;font-size:13px;color:var(--graphite)}
.pn{max-width:660px;margin:50px auto 0;padding:0 22px;display:grid;grid-template-columns:1fr 1fr;gap:16px}
.pn a{text-decoration:none;font-size:16px;font-weight:600;line-height:1.45}
.pn a small{display:block;font-weight:400;font-size:13px;color:var(--graphite);margin-bottom:4px}
.pn a:last-child{text-align:right}
@media (max-width:520px){.pn{grid-template-columns:1fr}.pn a:last-child{text-align:left}}
"""

PLAYER = r"""
(function(){
  var btn=document.getElementById('play'); if(!btn) return;
  var stage=document.getElementById('stage'), ctx=null, playing=false, timer=null, master=null;
  // ii–V–I in C（Dm9 → G13 → Cmaj9 → A7b9），搖擺八分音符的低音
  var prog=[[50,53,57,60,64],[43,53,57,59,64],[48,52,55,59,62],[45,49,55,58,61]];
  var bass=[[38,41,45,43],[31,35,38,40],[36,40,43,45],[33,37,40,43]];
  function f(m){return 440*Math.pow(2,(m-69)/12)}
  function note(m,t,d,v,type){
    var o=ctx.createOscillator(),g=ctx.createGain(),o2=ctx.createOscillator(),g2=ctx.createGain();
    o.type=type||'sine';o.frequency.value=f(m);o2.type='sine';o2.frequency.value=f(m)*2.002;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.012);g.gain.exponentialRampToValueAtTime(v*.35,t+.35);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    g2.gain.setValueAtTime(v*.25,t);g2.gain.exponentialRampToValueAtTime(.0001,t+.5);
    o.connect(g);o2.connect(g2);g.connect(master);g2.connect(master);o.start(t);o2.start(t);o.stop(t+d+.05);o2.stop(t+.6);
  }
  function brush(t){var n=ctx.createBufferSource(),b=ctx.createBuffer(1,ctx.sampleRate*.12,ctx.sampleRate),d=b.getChannelData(0);
    for(var i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
    var hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=5000;var g=ctx.createGain();g.gain.value=.05;
    n.buffer=b;n.connect(hp);hp.connect(g);g.connect(master);n.start(t);}
  function bar(t,i){var beat=60/112,sw=beat*2/3;
    prog[i].forEach(function(m,k){note(m,t+k*.012,beat*3.6,.06)});
    prog[i].forEach(function(m){note(m,t+beat*2+sw,beat*1.2,.035)});
    bass[i].forEach(function(m,k){note(m,t+k*beat,beat*.95,.16,'triangle')});
    for(var k=0;k<4;k++){brush(t+k*beat);brush(t+k*beat+sw*.5+beat*.5)}}
  function loop(){var t=ctx.currentTime+.05,len=60/112*4;for(var i=0;i<4;i++)bar(t+i*len,i);timer=setTimeout(loop,len*4*1000-60)}
  btn.addEventListener('click',function(){
    if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=.9;
      var lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3800;master.disconnect();master.connect(lp);lp.connect(ctx.destination);}
    playing=!playing;
    if(playing){ctx.resume();master.gain.setTargetAtTime(.9,ctx.currentTime,.05);loop();stage.classList.add('spin');btn.setAttribute('aria-pressed','true');btn.querySelector('span').textContent='停下來';btn.querySelector('path').setAttribute('d','M3 1.5h3v11H3zM8 1.5h3v11H8z');}
    else{clearTimeout(timer);master.gain.setTargetAtTime(0,ctx.currentTime,.15);stage.classList.remove('spin');btn.setAttribute('aria-pressed','false');btn.querySelector('span').textContent='放一段二五一';btn.querySelector('path').setAttribute('d','M3 1.5v11l9-5.5z');
      setTimeout(function(){if(!playing){ctx.close();ctx=null}},600);}
  });
})();
"""

HEAD = """<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title><meta name="description" content="{desc}"><meta property="og:title" content="{title}"><meta property="og:description" content="{desc}">{ogimg}
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{p}style.css"></head><body>"""

def nav(p):
    return f'<div class="nav"><div class="in"><a class="brand" href="{p}index.html">爵士101</a><nav><a href="{p}index.html#stories">故事</a><a href="{p}index.html#letter">電子報</a><a href="{IG}" target="_blank" rel="noopener">Instagram</a></nav></div></div>'

def foot():
    return f'<footer>爵士101 由 Jim 在台北整理。每篇故事都附出處，查不到的不寫；照片來自 Wikimedia Commons，作者與授權標在照片下方。<br>一分鐘版在 Instagram <a href="{IG}" target="_blank" rel="noopener">@jazz101tw</a>。</footer></body></html>'

def letter():
    return f'<section class="letter" id="letter"><h2>每兩週，一張唱片。</h2><p>電子報〈慢慢聽〉每期只講一張爵士唱片：那天在哪裡錄、台上是誰、你該聽哪一段。不用懂樂理，戴上耳機照著聽。</p><a class="btn" href="{SUB_HREF}" target="_blank" rel="noopener">{SUB_TXT}</a></section>'

def credit(ph):
    return f'照片：{e(ph["artist"])}，{e(ph["license"])}，Wikimedia Commons' if ph else ''

COL=['#a97a2b','#8c2f2b','#2f5d6b','#c9b48a','#4b3a6b','#6d7a3a']
def img(ph, pre, cls='', alt='', i=0):
    return f'<img class="{cls}" src="{pre}img/{ph["file"]}" alt="{e(alt)}" loading="lazy">' if ph else f'<div class="{cls} empty" style="--c:{COL[i%len(COL)]}" aria-hidden="true"></div>'

os.makedirs(os.path.join(OUT, 'story'), exist_ok=True)
os.makedirs(os.path.join(OUT, 'img'), exist_ok=True)
for k, m in META.items():
    if m and os.path.exists(os.path.join(IMGSRC, m['file'])):
        shutil.copy(os.path.join(IMGSRC, m['file']), os.path.join(OUT, 'img', m['file']))
open(os.path.join(OUT, 'style.css'), 'w', encoding='utf-8').write(CSS)
open(os.path.join(OUT, 'player.js'), 'w', encoding='utf-8').write(PLAYER)

def q(s): return s.replace(' ', '+')

for i, s in enumerate(S):
    body = ''.join(f'<h2>{e(h)}</h2>' + ''.join(f'<p>{e(p)}</p>' for p in ps) for h, ps in s['sections'])
    tr = ''
    for n, (a, b) in enumerate(s['listen'], 1):
        song = a if not a.startswith(('再', '注意', 'Part')) else ''
        links = f'<div><a href="https://music.apple.com/search?term={e(q(song))}" target="_blank" rel="noopener">在 Apple Music 找</a><a href="https://open.spotify.com/search/{e(q(song))}" target="_blank" rel="noopener">在 Spotify 找</a></div>' if song else ''
        tr += f'<div class="tr"><div class="n">{n}</div><div><b>{e(a)}</b><p>{e(b)}</p>{links}</div></div>'
    more = ''.join(f'<li>{e(m)}</li>' for m in s['more'])
    prev = S[i - 1] if i > 0 else None
    nxt = S[i + 1] if i < len(S) - 1 else None
    pn = '<div class="pn">' + (f'<a href="{prev["slug"]}.html"><small>上一篇</small>{e(prev["title"])}</a>' if prev else '<span></span>') + (f'<a href="{nxt["slug"]}.html"><small>下一篇</small>{e(nxt["title"])}</a>' if nxt else '<span></span>') + '</div>'
    ph = s['ph']
    hero = f'<div class="hero-img"><img src="../img/{ph["file"]}" alt="{e(s["title"])}"><p class="credit">{credit(ph)}</p></div>' if ph else ''
    page = HEAD.format(title=e(s['title']) + '｜爵士101', desc=e(s['dek']), p='../', ogimg=(f'<meta property="og:image" content="../img/{ph["file"]}">' if ph else '')) + nav('../') + \
        f'<header class="ahead"><div class="yearbig">{e(s["year"])}</div><h1>{e(s["title"])}</h1><p class="dek">{e(s["dek"])}</p><p class="rt">閱讀約 {e(s["read"])}</p></header>{hero}' + \
        f'<article class="body">{body}</article>' + \
        f'<section class="tracks"><h2>這樣聽</h2><p class="sub">戴上耳機，照這個順序。</p>{tr}</section>' + \
        f'<section class="more"><h2>聽完再去聽</h2><ul>{more}</ul></section>' + \
        f'<p class="src">出處：{"、".join(e(x) for x in s["src"])}</p>{pn}{letter()}' + foot()
    open(os.path.join(OUT, 'story', s['slug'] + '.html'), 'w', encoding='utf-8').write(page)

f0 = S[0]
rows = ''.join(f'<a class="row" href="story/{s["slug"]}.html"><div class="y">{e(s["year"])}</div><div><h3>{e(s["title"])}</h3><p>{e(s["dek"])}</p></div>{img(s["ph"], "", "t", s["title"], S.index(s))}</a>' for s in sorted(S, key=lambda x: x['year']))
soon = ''.join(f'<li>{e(t)}</li>' for t in COMING)
fph = f0['ph']
fig = f'<figure><img src="img/{fph["file"]}" alt="{e(f0["title"])}"><figcaption>{credit(fph)}</figcaption></figure>' if fph else '<div class="yearbig">' + e(f0['year']) + '</div>'
index = HEAD.format(title='爵士101｜一分鐘講不完的爵士故事', desc='爵士史上的人、晚上和唱片，一篇講完整，附上該怎麼聽。', p='', ogimg='') + nav('') + \
    '<section class="hero"><h1><span class="nw">一分鐘講不完的爵士，</span><span class="nw">在這裡慢慢聽。</span></h1><p>那些錄音室、俱樂部和唱片背後的故事，一篇講完，再告訴你該聽哪一段。</p>' + \
    '<div class="ctas"><a class="btn" href="#stories">開始讀故事</a><a class="btn alt" href="#letter">訂閱電子報</a></div>' + \
    '<div class="glow" aria-hidden="true"></div><div class="stage" id="stage"><div class="platter"><div class="disc"></div><div class="label"><div><b>JAZZ 101</b><span>Side A　ii–V–I</span></div></div></div><div class="arm"><i></i></div></div>' + \
    '<button class="play" id="play" aria-pressed="false"><svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg><span>放一段二五一</span></button>' + \
    '<p class="playnote">爵士樂最常聽到的和弦進行，用瀏覽器現場彈給你聽。</p></section>' + \
    f'<section class="band"><div class="in">{fig}<div><small>這次先讀這篇</small><h2>{e(f0["title"])}</h2><p>{e(f0["dek"])}</p><a class="btn" href="story/{f0["slug"]}.html">讀這篇故事</a></div></div></section>' + \
    f'<div class="wrap"><section class="sec" id="stories"><h2>所有故事</h2><p class="lede">依年份排列的人、晚上和唱片。每一篇都附上「這樣聽」。</p><div class="list">{rows}</div></section>' + \
    f'<section class="sec"><h2>正在寫的故事</h2><p class="lede">IG 上已經講過一分鐘版本，長篇陸續放上來。</p><ul class="soon">{soon}</ul></section></div>' + \
    letter() + '<script src="player.js"></script>' + foot()
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(index)
print('ok', len(S), 'stories;', sum(1 for s in S if s['ph']), 'with photos')
