"""爵士101 網站產生器 v4（故事加長＋入門路線＋聽懂爵士＋樂手＋小辭典＋時間軸＋選品）
用法：python3 build.py [Substack網址]
輸出位置預設 jimframe-site/jazz/；設 JAZZ_OUT=/路徑 可改輸出到獨立 repo"""
import os, sys, json, html, shutil, random
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.environ.get('JAZZ_OUT') or os.path.join(ROOT, 'jazz')
sys.path.insert(0, HERE)
from stories import S
from extras import PEOPLE, WORDS, TIMELINE, START, BRANCH, SHOP

IMGSRC = os.path.join(HERE, 'img')
META = json.load(open(os.path.join(IMGSRC, 'meta.json'), encoding='utf-8')) if os.path.exists(os.path.join(IMGSRC, 'meta.json')) else {}
PHOTO = {'village-vanguard-1961': 'village', 'koln-concert': 'koln', 'sonny-rollins-bridge': 'rollins',
         'van-gelder-living-room': 'vangelder', 'giant-steps': 'coltrane', 'real-book': None}
PHOTO2 = {'sonny-rollins-bridge': 'bridge', 'village-vanguard-1961': 'evans'}
PPH = {'bill-evans': 'evans', 'john-coltrane': 'coltrane', 'keith-jarrett': 'koln', 'sonny-rollins': 'rollins'}   # 文中第二張照片
for s in S:
    n = sum(len(x) for _, ps in s['sections'] for x in ps) + sum(len(a) + len(b) for a, b in s['listen'])
    s['chars'] = n
    s['read'] = f"{max(2, round(n / 400))} 分鐘"
    k = PHOTO.get(s['slug']); s['ph'] = META.get(k) if k else None
    k2 = PHOTO2.get(s['slug']); s['ph2'] = META.get(k2) if k2 else None
BYSLUG = {s['slug']: s for s in S}
PBY = {p[0]: p for p in PEOPLE}
WBY = {w[0]: w for w in WORDS}

SUB = sys.argv[1] if len(sys.argv) > 1 else ''
IG = 'https://www.instagram.com/jazz101tw/'
SUB_HREF = SUB or IG
SUB_TXT = '免費訂閱' if SUB else '先追蹤 IG，電子報開放時通知你'
COMING = json.load(open(os.path.join(HERE, 'coming.json'), encoding='utf-8'))
e = html.escape

# 示範說明：id → (標題, 說明, 聽什麼, [選項])
DEMOS = {
 'swing': ('搖擺：同一段旋律，直的和搖的', '兩個八分音符平均分，聽起來像進行曲；第一個拉長、第二個縮短，就開始搖了。', '切換兩種，注意你的頭什麼時候開始想跟著點。', ['直的', '搖擺']),
 'walking': ('走路低音：貝斯一步一步走', '貝斯可以只彈每小節的兩個音，也可以一拍一個音往下一個和弦走。', '聽「走路」的時候，整首歌是不是突然往前推了？', ['兩拍', '走路']),
 'blues': ('十二小節藍調：爵士的母語', '十二個小節為一輪，三組和弦反覆循環。幾乎所有爵士樂手都會彈。', '跟著亮起來的格子數，第 5 小節和第 9 小節和弦會換，聽得出來嗎？', ['慢', '快']),
 'bluescale': ('藍調音階：那幾個「歪」的音', '一般的大調音階很明亮；藍調音階多了降三、降五、降七，一下子就有了憂傷。', '比較兩種，哪一種讓你想到深夜的酒吧？', ['大調音階', '藍調音階']),
 'iivi': ('二五一：一句話的起、承、合', '從 Dm7 到 G7 再到 Cmaj7，耳朵會覺得「回到家了」。', '切到「不回家」，G7 之後又回到 Dm7，你會一直等那個家。', ['回到家', '不回家']),
 'giant': ('Giant Steps：三個調不停跳', 'Coltrane 在 B、G、降 E 三個調之間快速跳動，每個和弦只停一兩拍。', '先用慢速聽和弦怎麼換，再切到接近原速，想像要在上面即興。', ['慢速', '接近原速']),
 'comping': ('伴奏：鋼琴什麼時候插話', '鋼琴在獨奏後面伴奏，可以每拍都彈，也可以挑空隙回一句。', '聽「挑空隙」的版本，鋼琴是不是比較像在跟旋律聊天？', ['每拍都彈', '挑空隙']),
 'trading': ('交換四小節：你一句、我一句', '薩克斯風吹四小節，鼓手接著即興四小節，輪流對話。', '每次聽旋律都會不一樣，因為它是現場隨機即興的。', []),
 'motif': ('主題式即興：同一句話換五種說法', 'Sonny Rollins 常拿一小段旋律反覆變化。這裡把同一句話用五種方式說一次。', '跟著格子看：移高、晚半拍、只留前半、尾巴加長。', []),
 'vamp': ('反覆段：一直轉的左手', '左手不斷重複同樣的節奏，右手在上面慢慢長出旋律，就像《The Köln Concert》那樣。', '右手每一輪都是隨機的，左手永遠一樣。聽久了會有一點催眠。', []),
}
DEMO_ORDER = ['swing', 'walking', 'blues', 'bluescale', 'iivi', 'comping', 'trading', 'motif', 'giant', 'vamp']

def demo_card(i, small=False):
    t, d, h, opts = DEMOS[i]
    o = ''.join(f'<button data-o="{k}" class="{"on" if k == 0 else ""}" aria-pressed="{"true" if k == 0 else "false"}">{e(x)}</button>' for k, x in enumerate(opts))
    return (f'<div class="demo{" sm" if small else ""}" data-demo="{i}" id="d-{i}"><div class="dtop"><h3>{e(t)}</h3><p>{e(d)}</p></div>'
            f'<div class="dctl"><button class="dplay" aria-pressed="false"><svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg><span>播放</span></button>'
            f'{"<div class=opts>" + o + "</div>" if opts else ""}</div><div class="cells" aria-hidden="true"></div><p class="hint">{e(h)}</p></div>')

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

CSS2 = r"""
/* nav v4 */
.nav .in{gap:18px}
.nav nav{display:flex;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;min-width:0}
.nav nav::-webkit-scrollbar{display:none}
.nav nav a{white-space:nowrap;margin-left:0;margin-right:20px;padding:4px 0}
.nav nav a.cur{color:var(--ink)}
@media (max-width:640px){.nav .in{height:auto;flex-direction:column;align-items:stretch;padding:10px 22px 0;gap:4px}.nav nav{padding-bottom:8px}}
/* doors */
.doors{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--hair);border:1px solid var(--hair);border-radius:20px;overflow:hidden;margin-top:40px}
.doors a{background:var(--paper);padding:26px 22px 24px;text-decoration:none;display:block}
.doors a:hover{background:var(--wash)}
.doors b{display:block;font-size:19px;font-weight:600;margin-bottom:4px}
.doors span{display:block;color:var(--graphite);font-size:14px;line-height:1.6}
.doors i{font-style:normal;color:var(--brass);font-size:13px;display:block;margin-top:12px}
@media (max-width:760px){.doors{grid-template-columns:1fr 1fr}}
@media (max-width:420px){.doors{grid-template-columns:1fr}}
.more-link{display:inline-block;margin-top:26px;color:var(--brass);text-decoration:none;font-size:16px}
.more-link:hover{text-decoration:underline}
/* demo */
.demo{background:var(--wash);border-radius:22px;padding:28px 26px 24px;margin-top:20px}
.band .demo{background:rgba(255,255,255,.05);color:#f2efe9}
.dtop h3{font-size:20px;font-weight:600;line-height:1.4}
.dtop p{color:var(--graphite);font-size:15px;margin-top:4px;line-height:1.7}
.band .dtop p,.band .hint{color:#b9bdc7}
.dctl{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:18px}
.dplay{display:inline-flex;align-items:center;gap:9px;background:var(--ink);color:var(--paper);border:0;font:inherit;font-size:15px;padding:10px 20px;border-radius:999px;cursor:pointer}
.band .dplay{background:#f2efe9;color:#172033}
.dplay svg{width:13px;height:13px}
.dplay.playing{background:var(--brass);color:#1d1408}
.opts{display:inline-flex;background:var(--paper);border:1px solid var(--hair);border-radius:999px;padding:3px}
.band .opts{background:transparent;border-color:#2e3a52}
.opts button{background:none;border:0;font:inherit;font-size:14px;color:var(--graphite);padding:7px 14px;border-radius:999px;cursor:pointer}
.opts button.on{background:var(--ink);color:var(--paper)}
.band .opts button.on{background:#f2efe9;color:#172033}
.cells{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:6px;margin-top:18px}
.cells.notes{grid-template-columns:repeat(auto-fill,minmax(42px,1fr))}
.cell{font-size:13px;text-align:center;padding:10px 4px;border-radius:10px;border:1px solid var(--hair);color:var(--graphite);transition:background .08s,color .08s;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.band .cell{border-color:#2e3a52;color:#8e93a0}
.cell.on{background:var(--brass);border-color:var(--brass);color:#1d1408}
.hint{font-size:14px;color:var(--graphite);margin-top:14px}
.demos{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:36px}
.demos .demo{margin-top:0}
@media (max-width:760px){.demos{grid-template-columns:1fr}}
/* article v4 */
.facts{max-width:660px;margin:34px auto 0;padding:0 22px}
.facts dl{display:grid;grid-template-columns:auto 1fr;border-top:1px solid var(--hair)}
.facts dt,.facts dd{padding:11px 0;border-bottom:1px solid var(--hair);font-size:15px}
.facts dt{color:var(--graphite);padding-right:22px;white-space:nowrap}
.pull{font-size:clamp(22px,3.4vw,28px);line-height:1.55;font-weight:600;letter-spacing:-.01em;color:var(--brass);margin:44px 0;padding-left:20px;border-left:3px solid var(--brass)}
.body figure{margin:36px -22px}
.body figure img{border-radius:18px;width:100%;filter:sepia(.12)}
.body figure figcaption{font-size:12px;color:var(--graphite);padding:8px 22px 0}
.chips{max-width:660px;margin:50px auto 0;padding:0 22px}
.chips h3{font-size:15px;font-weight:600;color:var(--graphite);margin:18px 0 10px}
.chips a{display:inline-block;font-size:14px;text-decoration:none;border:1px solid var(--hair);border-radius:999px;padding:6px 14px;margin:0 8px 8px 0}
.chips a:hover{border-color:var(--brass);color:var(--brass)}
.ademo{max-width:700px;margin:60px auto 0;padding:0 22px}
.ademo>h2{font-size:26px;font-weight:700;margin-bottom:2px}
/* page head */
.phead{max-width:760px;margin:0 auto;padding:80px 22px 10px;text-align:center}
.phead h1{font-size:clamp(34px,6vw,60px);font-weight:700;letter-spacing:-.02em;line-height:1.15}
.phead p{color:var(--graphite);font-size:19px;margin-top:14px;line-height:1.7}
/* path */
.path{list-style:none;margin-top:40px;counter-reset:p}
.step{display:grid;grid-template-columns:84px 1fr;gap:22px;padding:30px 0;border-top:1px solid var(--hair);counter-increment:p}
.step .disc2{width:84px;height:84px;border-radius:50%;background:radial-gradient(circle,#0f0f0f 0 4%,var(--c) 4.5% 29%,#141414 30% 100%);box-shadow:inset 0 0 0 1px #000;position:relative}
.step .disc2:after{content:counter(p);position:absolute;right:-6px;top:-6px;width:28px;height:28px;border-radius:50%;background:var(--paper);border:1px solid var(--hair);display:grid;place-items:center;font-size:13px;font-weight:600}
.step h3{font-size:22px;font-weight:600;line-height:1.35}
.step h3 small{display:block;font-size:14px;color:var(--graphite);font-weight:400;margin-top:2px}
.step p{margin-top:8px;font-size:16px;line-height:1.75}
.step .lf{color:var(--graphite);font-size:15px}
.step .lf b{color:var(--ink);font-weight:600}
.step a.st{font-size:14px;color:var(--brass);text-decoration:none;display:inline-block;margin-top:8px}
@media (max-width:520px){.step{grid-template-columns:56px 1fr;gap:16px}.step .disc2{width:56px;height:56px}}
.branch{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--hair);border:1px solid var(--hair);border-radius:18px;overflow:hidden;margin-top:30px}
.branch div{background:var(--paper);padding:22px}
.branch b{display:block;font-size:17px;margin-bottom:4px}
.branch span{color:var(--graphite);font-size:15px}
@media (max-width:640px){.branch{grid-template-columns:1fr}}
.pathmini{display:flex;gap:18px;margin-top:34px;overflow-x:auto;padding-bottom:8px;scrollbar-width:thin}
.pathmini a{flex:0 0 150px;text-decoration:none}
.pathmini .disc2{width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,#0f0f0f 0 3%,var(--c) 3.5% 30%,#141414 31% 100%),#141414;box-shadow:0 20px 40px -24px rgba(0,0,0,.6)}
.pathmini b{display:block;font-size:15px;margin-top:12px;line-height:1.4}
.pathmini span{display:block;font-size:13px;color:var(--graphite)}
/* people */
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1px;background:var(--hair);border:1px solid var(--hair);border-radius:20px;overflow:hidden;margin-top:40px}
.person{background:var(--paper);padding:26px 24px;scroll-margin-top:120px}
.pic{margin:-26px -24px 18px;aspect-ratio:4/3;position:relative;overflow:hidden;background:#111}
.pic img{width:100%;height:100%;object-fit:cover;object-position:50% 22%;filter:grayscale(.15) contrast(1.02)}
.pic figcaption{position:absolute;left:0;right:0;bottom:0;font-size:10px;line-height:1.4;color:rgba(255,255,255,.75);padding:16px 10px 6px;background:linear-gradient(transparent,rgba(0,0,0,.55))}
.pic.ill{background:radial-gradient(circle at 50% 40%,color-mix(in srgb,var(--c) 70%,#fff) 0,var(--c) 70%);color:#fbf5ea;display:grid;place-items:center}
.pic.ill svg{width:62%;height:auto;opacity:.92}
.pic .tag{position:absolute;left:10px;bottom:8px;font-size:11px;color:#fbf5ea;background:rgba(0,0,0,.28);padding:3px 9px;border-radius:999px}
.pmini .pic{margin:-18px -18px 12px;aspect-ratio:1/1}
.pmini .pic figcaption{display:none}
.pmini .pic .tag{font-size:10px}
.person:target{background:var(--lamp)}
.person img.mono2{object-fit:cover;filter:grayscale(.2)}
.person .mono2{width:46px;height:46px;border-radius:50%;background:var(--c);color:#fff;display:grid;place-items:center;font-size:16px;font-weight:600;letter-spacing:.02em}
.person h3{font-size:20px;font-weight:600;margin-top:14px;line-height:1.35}
.person .meta{font-size:13px;color:var(--graphite)}
.person .one{font-weight:500;margin-top:10px;font-size:16px}
.person p.bio{color:var(--graphite);font-size:15px;line-height:1.75;margin-top:8px}
.person .first{font-size:14px;margin-top:12px}
.person .first a{color:var(--brass);text-decoration:none}
.person .rel{font-size:13px;margin-top:8px}
.person .rel a{color:var(--graphite)}
.pmini{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--hair);border:1px solid var(--hair);border-radius:18px;overflow:hidden;margin-top:34px}
.pmini a{background:var(--paper);padding:18px;text-decoration:none}
.pmini a:hover{background:var(--wash)}
.pmini b{display:block;font-size:16px}
.pmini span{font-size:13px;color:var(--graphite)}
@media (max-width:760px){.pmini{grid-template-columns:1fr 1fr}}
/* words */
.search{display:block;width:100%;max-width:420px;margin:30px auto 0;font:inherit;font-size:16px;padding:12px 18px;border-radius:999px;border:1px solid var(--hair);background:var(--paper);color:var(--ink)}
.wlist{margin-top:30px;border-top:1px solid var(--hair)}
.word{display:grid;grid-template-columns:200px 1fr;gap:24px;padding:22px 0;border-bottom:1px solid var(--hair);scroll-margin-top:120px}
.word:target{background:var(--lamp)}
.word h3{font-size:20px;font-weight:600;line-height:1.35}
.word h3 small{display:block;font-size:13px;color:var(--graphite);font-weight:400}
.word p{font-size:16px;line-height:1.8}
.word .ex{color:var(--graphite);font-size:14px;margin-top:6px}
.word .ex a{color:var(--brass);text-decoration:none}
@media (max-width:640px){.word{grid-template-columns:1fr;gap:6px}}
.today{background:var(--wash);border-radius:22px;padding:34px 30px;margin-top:34px;display:grid;grid-template-columns:1fr auto;gap:20px;align-items:end}
.today h3{font-size:clamp(28px,4vw,38px);font-weight:700;letter-spacing:-.01em}
.today h3 small{font-size:15px;color:var(--graphite);font-weight:400;margin-left:10px}
.today p{font-size:17px;margin-top:8px;max-width:36em}
.today button{background:none;border:1px solid var(--hair);color:var(--ink);font:inherit;font-size:14px;padding:8px 16px;border-radius:999px;cursor:pointer}
@media (max-width:640px){.today{grid-template-columns:1fr}}
/* timeline */
.tl{position:relative;margin-top:44px;padding-left:34px}
.tl:before{content:"";position:absolute;left:8px;top:6px;bottom:6px;width:2px;background:var(--hair)}
.ev{position:relative;padding:0 0 34px}
.ev:before{content:"";position:absolute;left:-31px;top:10px;width:12px;height:12px;border-radius:50%;background:var(--paper);border:2px solid var(--graphite)}
.ev.has:before{background:var(--brass);border-color:var(--brass)}
.ev .yr{font-size:34px;font-weight:200;letter-spacing:-.03em;line-height:1.1;color:var(--graphite)}
.ev.has .yr{color:var(--brass)}
.ev h3{font-size:20px;font-weight:600;margin-top:4px}
.ev p{color:var(--graphite);font-size:16px;line-height:1.75;margin-top:4px;max-width:36em}
.ev a{font-size:14px;color:var(--brass);text-decoration:none;display:inline-block;margin-top:6px}
.ev.wp{display:grid;grid-template-columns:1fr 260px;gap:28px;align-items:start}
.evpic{margin:6px 0 0;border-radius:14px;overflow:hidden;background:#111;aspect-ratio:4/3;position:relative}
.evpic img{width:100%;height:100%;object-fit:cover;object-position:50% 30%;filter:sepia(.18) contrast(1.02)}
.evpic figcaption{position:absolute;left:0;right:0;bottom:0;font-size:10px;line-height:1.4;color:rgba(255,255,255,.78);padding:14px 9px 5px;background:linear-gradient(transparent,rgba(0,0,0,.55))}
@media (max-width:640px){.ev.wp{grid-template-columns:1fr;gap:12px}.ev.wp .evpic{order:-1;margin-top:0}}
.tlmini img{display:block;width:134px;height:90px;object-fit:cover;border-radius:10px;margin-bottom:10px;filter:sepia(.18)}
.tlmini{display:flex;gap:0;margin-top:34px;overflow-x:auto;border-top:2px solid var(--hair);scrollbar-width:thin}
.tlmini a{flex:0 0 150px;padding:16px 16px 10px 0;text-decoration:none;position:relative}
.tlmini a:before{content:"";position:absolute;top:-7px;left:0;width:12px;height:12px;border-radius:50%;background:var(--paper);border:2px solid var(--graphite)}
.tlmini a.has:before{background:var(--brass);border-color:var(--brass)}
.tlmini b{display:block;font-size:22px;font-weight:300;letter-spacing:-.02em}
.tlmini span{font-size:13px;color:var(--graphite);line-height:1.5;display:block}
/* shop */
.shop{margin-top:20px}
.shop h2{font-size:clamp(26px,3.6vw,34px);font-weight:700;margin-top:60px}
.shop .sd{color:var(--graphite);font-size:17px;margin-top:6px;max-width:36em}
.items{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-top:22px}
.item{border:1px solid var(--hair);border-radius:18px;padding:22px;display:flex;flex-direction:column}
.item b{font-size:17px;font-weight:600;line-height:1.45}
.item p{color:var(--graphite);font-size:15px;line-height:1.7;margin-top:6px;flex:1}
.item .lk{margin-top:14px;font-size:13px}
.item .lk a{color:var(--brass);text-decoration:none;margin-right:14px}
.note2{background:var(--wash);border-radius:18px;padding:22px 24px;margin-top:50px;color:var(--graphite);font-size:15px;line-height:1.8}
"""

HEAD = """<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title><meta name="description" content="{desc}"><meta property="og:title" content="{title}"><meta property="og:description" content="{desc}">{ogimg}
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700&family=Noto+Sans+TC:wght@300;400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{p}style.css"></head><body>"""

NAV = [('index.html#stories', '故事', 'stories'), ('start.html', '入門路線', 'start'), ('listen.html', '聽懂爵士', 'listen'), ('people.html', '樂手', 'people'),
       ('words.html', '小辭典', 'words'), ('timeline.html', '時間軸', 'timeline'), ('shop.html', '選品', 'shop'), ('index.html#letter', '電子報', 'letter')]
def nav(p, cur=''):
    links = ''.join(f'<a href="{p}{h}"{" class=cur aria-current=page" if k == cur else ""}>{t}</a>' for h, t, k in NAV)
    return f'<div class="nav"><div class="in"><a class="brand" href="{p}index.html">爵士101</a><nav aria-label="網站導覽">{links}</nav></div></div>'

def foot(p='', js=''):
    return (f'<footer>爵士101 由 Jim 在台北整理。每篇故事都附出處，查不到的不寫；照片來自 Wikimedia Commons，作者與授權標在照片下方。聲音示範全部由瀏覽器現場合成。<br>'
            f'一分鐘版在 Instagram <a href="{IG}" target="_blank" rel="noopener">@jazz101tw</a>。</footer>{js}</body></html>')

def letter():
    return f'<section class="letter" id="letter"><h2>每兩週，一張唱片。</h2><p>電子報〈慢慢聽〉每期只講一張爵士唱片：那天在哪裡錄、台上是誰、你該聽哪一段。不用懂樂理，戴上耳機照著聽。</p><a class="btn" href="{SUB_HREF}" target="_blank" rel="noopener">{SUB_TXT}</a></section>'

def credit(ph):
    return f'照片：{e(ph["artist"])}，{e(ph["license"])}，Wikimedia Commons' if ph else ''

COL = ['#a97a2b', '#8c2f2b', '#2f5d6b', '#c9b48a', '#4b3a6b', '#6d7a3a', '#b4532a', '#3e6b52', '#7a2f4f', '#5a6e8c']
def img(ph, pre, cls='', alt='', i=0):
    return f'<img class="{cls}" src="{pre}img/{ph["file"]}" alt="{e(alt)}" loading="lazy">' if ph else f'<div class="{cls} empty" style="--c:{COL[i % len(COL)]}" aria-hidden="true"></div>'

def q(s): return s.replace(' ', '+')
def links(song):
    return f'<div><a href="https://music.apple.com/search?term={e(q(song))}" target="_blank" rel="noopener">在 Apple Music 找</a><a href="https://open.spotify.com/search/{e(q(song))}" target="_blank" rel="noopener">在 Spotify 找</a></div>'
def W(p, name, page):
    open(os.path.join(OUT, name), 'w', encoding='utf-8').write(page)

os.makedirs(os.path.join(OUT, 'story'), exist_ok=True)
os.makedirs(os.path.join(OUT, 'img'), exist_ok=True)
for k, m in META.items():
    if m and os.path.exists(os.path.join(IMGSRC, m['file'])):
        shutil.copy(os.path.join(IMGSRC, m['file']), os.path.join(OUT, 'img', m['file']))
open(os.path.join(OUT, 'style.css'), 'w', encoding='utf-8').write(CSS + CSS2)
open(os.path.join(OUT, 'player.js'), 'w', encoding='utf-8').write(PLAYER)
shutil.copy(os.path.join(HERE, 'audio.js'), os.path.join(OUT, 'audio.js'))
AUD = lambda p: f'<script src="{p}audio.js"></script>'

# ---------- 故事頁 ----------
for i, s in enumerate(S):
    body = ''
    for n, (h, ps) in enumerate(s['sections']):
        body += f'<h2>{e(h)}</h2>' + ''.join(f'<p>{e(x)}</p>' for x in ps)
        if n == 1 and s.get('pull'):
            body += f'<blockquote class="pull">{e(s["pull"])}</blockquote>'
        if n == 3 and s['ph2']:
            body += f'<figure><img src="../img/{s["ph2"]["file"]}" alt="" loading="lazy"><figcaption>{credit(s["ph2"])}</figcaption></figure>'
    tr = ''
    for n, (a, b) in enumerate(s['listen'], 1):
        song = a if not a.startswith(('再', '注意', 'Part', '聽他', '比一比', '同一首')) else ''
        tr += f'<div class="tr"><div class="n">{n}</div><div><b>{e(a)}</b><p>{e(b)}</p>{links(song) if song else ""}</div></div>'
    more = ''.join(f'<li>{e(m)}</li>' for m in s['more'])
    prev = S[i - 1] if i > 0 else None
    nxt = S[i + 1] if i < len(S) - 1 else None
    pn = '<div class="pn">' + (f'<a href="{prev["slug"]}.html"><small>上一篇</small>{e(prev["title"])}</a>' if prev else '<span></span>') + (f'<a href="{nxt["slug"]}.html"><small>下一篇</small>{e(nxt["title"])}</a>' if nxt else '<span></span>') + '</div>'
    ph = s['ph']
    hero = f'<div class="hero-img"><img src="../img/{ph["file"]}" alt="{e(s["title"])}"><p class="credit">{credit(ph)}</p></div>' if ph else ''
    facts = '<section class="facts" aria-label="基本資料"><dl>' + ''.join(f'<dt>{e(a)}</dt><dd>{e(b)}</dd>' for a, b in s.get('facts', [])) + '</dl></section>'
    chips = '<section class="chips">'
    if s.get('people'):
        chips += '<h3>這篇裡的人</h3>' + ''.join(f'<a href="../people.html#{p}">{e(PBY[p][1])}</a>' for p in s['people'] if p in PBY)
    if s.get('words'):
        chips += '<h3>這篇用到的名詞</h3>' + ''.join(f'<a href="../words.html#{w}">{e(WBY[w][1])}</a>' for w in s['words'] if w in WBY)
    chips += '</section>'
    dm = f'<section class="ademo"><h2>先用耳朵聽懂</h2>{demo_card(s["demo"])}</section>' if s.get('demo') else ''
    page = HEAD.format(title=e(s['title']) + '｜爵士101', desc=e(s['dek']), p='../', ogimg=(f'<meta property="og:image" content="../img/{ph["file"]}">' if ph else '')) + nav('../', 'stories') + \
        f'<header class="ahead"><div class="yearbig">{e(s["year"])}</div><h1>{e(s["title"])}</h1><p class="dek">{e(s["dek"])}</p><p class="rt">約 {s["chars"]:,} 字・閱讀約 {e(s["read"])}</p></header>{hero}{facts}' + \
        f'<article class="body">{body}</article>{dm}' + \
        f'<section class="tracks"><h2>這樣聽</h2><p class="sub">戴上耳機，照這個順序。</p>{tr}</section>' + \
        f'<section class="more"><h2>聽完再去聽</h2><ul>{more}</ul></section>{chips}' + \
        f'<p class="src">出處：{"、".join(e(x) for x in s["src"])}</p>{pn}{letter()}' + foot('../', AUD('../') if s.get('demo') else '')
    W('../', os.path.join('story', s['slug'] + '.html'), page)

def phead(t, d):
    return f'<header class="phead"><h1>{e(t)}</h1><p>{e(d)}</p></header>'

# ---------- 入門路線 ----------
steps = ''
for n, (alb, art, yr, why, song, lf, st) in enumerate(START):
    stl = f'<a class="st" href="story/{st}.html">相關故事：{e(BYSLUG[st]["title"])}</a>' if st else ''
    steps += (f'<li class="step"><div class="disc2" style="--c:{COL[n % len(COL)]}" aria-hidden="true"></div><div><h3>《{e(alb)}》<small>{e(art)}・{e(yr)}</small></h3>'
              f'<p>{e(why)}</p><p class="lf"><b>先聽〈{e(song)}〉</b>：{e(lf)}</p><div class="tr" style="border:0;padding:6px 0 0;display:block">{links(art + " " + song)}</div>{stl}</div></li>')
br = ''.join(f'<div><b>{e(a)}</b><span>{e(b)}</span></div>' for a, b in BRANCH)
W('', 'start.html', HEAD.format(title='入門路線｜爵士101', desc='第一次聽爵士，照這十張的順序聽。', p='', ogimg='') + nav('', 'start') +
  phead('第一次聽爵士，照這十張的順序。', '從最好入口的開始，一張比一張多一點東西。每張只要先聽一首，知道該注意什麼就好。') +
  f'<div class="wrap"><ol class="path">{steps}</ol><section class="sec" style="padding-top:60px"><h2>聽完十張之後</h2><p class="lede">看你最喜歡哪一種，往那個方向繼續。</p><div class="branch">{br}</div></section></div>' + letter() + foot())

# ---------- 聽懂爵士 ----------
cards = ''.join(demo_card(i) for i in DEMO_ORDER)
W('', 'listen.html', HEAD.format(title='聽懂爵士｜爵士101', desc='十個可以按的聲音示範：搖擺、走路低音、藍調、二五一、Giant Steps。', p='', ogimg='') + nav('', 'listen') +
  phead('不用懂樂理，用耳朵聽懂爵士。', '十個可以按的聲音示範。每一個都在你的瀏覽器裡現場彈出來，可以切換比較。建議戴耳機。') +
  f'<div class="wrap"><div class="demos">{cards}</div></div>' + letter() + foot('', AUD('')))

# ---------- 樂手 ----------
STORY_OF = {}
for s in S:
    for p in s.get('people', []):
        STORY_OF.setdefault(p, []).append(s)

ICON = {
 'trumpet': '<path d="M30 78h88M30 70v16M118 64l52-22v72l-52-22z"/><path d="M58 78V58m14 20V58m14 20V58"/><circle cx="58" cy="54" r="4"/><circle cx="72" cy="54" r="4"/><circle cx="86" cy="54" r="4"/><path d="M40 78c0 18 70 18 70 0"/>',
 'sax': '<path d="M96 20v70c0 22-14 34-30 34s-26-10-26-24c0-8 6-12 12-12"/><path d="M110 20v72c0 30-20 44-44 44"/><path d="M96 20h14l10-8"/><path d="M52 100c-6 4-10 10-10 18"/><circle cx="103" cy="44" r="4"/><circle cx="103" cy="60" r="4"/><circle cx="103" cy="76" r="4"/><circle cx="103" cy="92" r="4"/>',
 'piano': '<rect x="24" y="44" width="152" height="64" rx="4"/><path d="M43 44v64M62 44v64M81 44v64M100 44v64M119 44v64M138 44v64M157 44v64"/><path d="M38 44h10v38H38zM57 44h10v38H57zM95 44h10v38H95zM114 44h10v38h-10zM133 44h10v38h-10z" fill="currentColor"/>',
 'mic': '<rect x="78" y="18" width="44" height="62" rx="22"/><path d="M84 36h32M84 48h32M84 60h32"/><path d="M66 60c0 30 68 30 68 0"/><path d="M100 90v34M76 128h48"/>',
 'drums': '<ellipse cx="100" cy="104" rx="42" ry="32"/><ellipse cx="100" cy="104" rx="14" ry="11"/><ellipse cx="52" cy="70" rx="24" ry="8"/><path d="M28 70v18c0 5 11 8 24 8s24-3 24-8V70"/><path d="M128 40l44-8M150 36v80M44 26l40 22M88 52l10-18"/>',
 'bass': '<path d="M100 14v40"/><path d="M92 14h16"/><path d="M84 58c-20 0-24 18-14 30-14 8-18 20-14 34 6 16 30 20 44 20s38-4 44-20c4-14 0-26-14-34 10-12 6-30-14-30-6 0-10 4-16 4s-10-4-16-4z"/><path d="M96 54v80M104 54v80"/><path d="M84 92c4 4 4 10 0 14M116 92c-4 4-4 10 0 14"/>',
}
def icon_for(ins):
    for k, v in [('小號', 'trumpet'), ('人聲', 'mic'), ('薩克斯風', 'sax'), ('鋼琴', 'piano'), ('鼓', 'drums'), ('貝斯', 'bass')]:
        if ins.startswith(k) or (k in ins and k != '人聲'):
            return v
    return 'piano'
def portrait(sl, en, ins, n, pre=''):
    k = PPH.get(sl, sl); ph = META.get(k)
    if ph:
        return f'<figure class="pic"><img src="{pre}img/{ph["file"]}" alt="{e(en)}" loading="lazy"><figcaption>{credit(ph)}</figcaption></figure>'
    return (f'<figure class="pic ill" style="--c:{COL[n % len(COL)]}"><svg viewBox="0 0 200 150" role="img" aria-label="{e(en)}的樂器示意圖" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">{ICON[icon_for(ins)]}</svg>'
            f'<span class="tag">示意圖・{e(ins.split("、")[0])}</span></figure>')

def initials(n): return ''.join(w[0] for w in n.split()[:2])
pg = ''
for n, (sl, en, zh, yrs, ins, one, bio, (song, where)) in enumerate(PEOPLE):
    rel = ''.join(f'<div class="rel">相關故事：<a href="story/{s["slug"]}.html">{e(s["title"])}</a></div>' for s in STORY_OF.get(sl, [])[:2])
    pg += (f'<article class="person" id="{sl}">{portrait(sl, en, ins, n)}<h3>{e(en)}</h3><div class="meta">{e(zh)}・{e(yrs)}・{e(ins)}</div>'
           f'<p class="one">{e(one)}</p><p class="bio">{e(bio)}</p><p class="first">先聽：<a href="https://music.apple.com/search?term={e(q(en + " " + song))}" target="_blank" rel="noopener">〈{e(song)}〉</a>　<span class="meta">{e(where)}</span></p>{rel}</article>')
W('', 'people.html', HEAD.format(title='樂手｜爵士101', desc='十五位改變爵士的人，各用一段話認識，附上先聽哪一首。', p='', ogimg='') + nav('', 'people') +
  phead('十五個改變爵士的人。', '依出生年份排列。每個人先記住一句話，再聽一首。') + f'<div class="wrap"><div class="pgrid">{pg}</div></div>' + letter() + foot())

# ---------- 小辭典 ----------
wl = ''
for (wid, zh, en, ex, eg, dm) in WORDS:
    dl = f'　<a href="listen.html#d-{dm}">去聽示範</a>' if dm else ''
    wl += f'<div class="word" id="{wid}" data-k="{e((zh + en + ex).lower())}"><h3>{e(zh)}<small>{e(en)}</small></h3><div><p>{e(ex)}</p><p class="ex">例子：{e(eg)}{dl}</p></div></div>'
W('', 'words.html', HEAD.format(title='小辭典｜爵士101', desc='聽爵士會遇到的名詞，用白話講清楚。', p='', ogimg='') + nav('', 'words') +
  phead('聽爵士會遇到的名詞。', f'{len(WORDS)} 個詞，用白話講一次，附一個可以去聽的例子。有些可以直接聽示範。') +
  '<div class="wrap"><input class="search" type="search" id="q" placeholder="搜尋，例如：搖擺、bebop" aria-label="搜尋名詞">' + f'<div class="wlist">{wl}</div></div>' +
  '<script>document.getElementById("q").addEventListener("input",function(){var v=this.value.trim().toLowerCase();document.querySelectorAll(".word").forEach(function(w){w.style.display=!v||w.dataset.k.indexOf(v)>-1?"":"none"})})</script>' + letter() + foot())

# ---------- 時間軸 ----------
TLPH = {'1890s': ['bolden'], '1917': ['odjb'], '1925': ['hotfive', 'louis-armstrong'], '1927': ['cottonclub', 'duke-ellington'],
        '1935': ['goodman'], '1938': ['carnegie', 'goodman'], '1939': ['hawkins'], '1940s': ['mintons', 'gillespie', 'charlie-parker'],
        '1949': ['mulligan', 'miles-davis'], '1953': ['vangelder'], '1954': ['newport'], '1956': ['rollins'], '1959': ['brubeck', 'coltrane'],
        '1961': ['village'], '1962': ['getz'], '1965': ['coltrane'], '1970': ['miles-davis'], '1970s': ['berklee', 'fakebook'],
        '1975': ['koln'], '1987': ['capitol'], '2004': ['fakebook', 'berklee']}
def tlph(y):
    for k in TLPH.get(y, []):
        if META.get(k): return META[k]
    return None
tl = ''
for (y, t, d, st) in TIMELINE:
    a = f'<a href="story/{st}.html">讀這個故事：{e(BYSLUG[st]["title"])}</a>' if st else ''
    ph = tlph(y)
    fig = f'<figure class="evpic"><img src="img/{ph["file"]}" alt="{e(t)}" loading="lazy"><figcaption>{credit(ph)}</figcaption></figure>' if ph else ''
    tl += f'<div class="ev{" has" if st else ""}{" wp" if ph else ""}"><div class="evt"><div class="yr">{e(y)}</div><h3>{e(t)}</h3><p>{e(d)}</p>{a}</div>{fig}</div>'
W('', 'timeline.html', HEAD.format(title='時間軸｜爵士101', desc='從紐奧良街頭到今天，爵士一百多年的重要時刻。', p='', ogimg='') + nav('', 'timeline') +
  phead('一百多年的爵士，走一遍。', '從紐奧良的街頭到今天。金色的點，代表這個站上有完整的故事。') + f'<div class="wrap" style="max-width:900px"><div class="tl">{tl}</div></div>' + letter() + foot())

# ---------- 選品 ----------
sh = ''
for (cat, desc, items) in SHOP:
    its = ''.join(f'<div class="item"><b>{e(n)}</b><p>{e(d)}</p><div class="lk"><a href="https://www.google.com/search?q={e(q(k))}" target="_blank" rel="noopener">搜尋這個</a></div></div>' for n, d, k in items)
    sh += f'<h2>{e(cat)}</h2><p class="sd">{e(desc)}</p><div class="items">{its}</div>'
W('', 'shop.html', HEAD.format(title='選品｜爵士101', desc='開始聽爵士需要的唱片、書和器材。', p='', ogimg='') + nav('', 'shop') +
  phead('開始聽爵士，需要的東西不多。', '幾張唱片、一兩本書、一副能聽見貝斯的耳機。這裡是我們挑的起點。') +
  f'<div class="wrap"><div class="shop">{sh}</div><p class="note2">爵士101 自己的周邊（帆布袋、明信片、唱片標籤貼紙）正在設計中，做好會先通知電子報讀者。</p></div>' + letter() + foot())

# ---------- 首頁 ----------
f0 = S[0]
rows = ''.join(f'<a class="row" href="story/{s["slug"]}.html"><div class="y">{e(s["year"])}</div><div><h3>{e(s["title"])}</h3><p>{e(s["dek"])}</p></div>{img(s["ph"], "", "t", s["title"], S.index(s))}</a>' for s in sorted(S, key=lambda x: x['year']))
soon = ''.join(f'<li>{e(t)}</li>' for t in COMING)
fph = f0['ph']
fig = f'<figure><img src="img/{fph["file"]}" alt="{e(f0["title"])}"><figcaption>{credit(fph)}</figcaption></figure>' if fph else '<div class="yearbig">' + e(f0['year']) + '</div>'
doors = ('<div class="doors">'
         f'<a href="#stories"><b>讀故事</b><span>{len(S)} 篇長篇，每篇兩三千字，附「這樣聽」。</span><i>從這裡開始</i></a>'
         '<a href="start.html"><b>照路線聽</b><span>第一次聽爵士，十張唱片照順序聽。</span><i>入門路線</i></a>'
         '<a href="listen.html"><b>用耳朵學</b><span>十個可以按的聲音示範，搖擺、藍調、二五一。</span><i>聽懂爵士</i></a>'
         f'<a href="words.html"><b>查名詞</b><span>{len(WORDS)} 個名詞，用白話講清楚。</span><i>小辭典</i></a></div>')
pmini = ''.join(f'<a href="start.html"><div class="disc2" style="--c:{COL[n % len(COL)]}" aria-hidden="true"></div><b>{n+1}．《{e(a)}》</b><span>{e(b)}・{e(y)}</span></a>' for n, (a, b, y, *_r) in enumerate(START[:6]))
tlm = ''.join(f'<a href="timeline.html" class="{"has" if st else ""}">{(f"<img src='img/{tlph(y)['file']}' alt='' loading='lazy'>" if tlph(y) else "")}<b>{e(y)}</b><span>{e(t)}</span></a>' for (y, t, d, st) in TIMELINE)
peo = ''.join(f'<a href="people.html#{p[0]}">{portrait(p[0], p[1], p[4], n)}<b>{e(p[1])}</b><span>{e(p[4])}・{e(p[3])}</span></a>' for n, p in enumerate(PEOPLE[:8]))
wjs = json.dumps([[w[0], w[1], w[2], w[3]] for w in WORDS], ensure_ascii=False)
shopmini = ''.join(f'<div class="item"><b>{e(n)}</b><p>{e(d)}</p></div>' for n, d, k in [SHOP[0][2][3], SHOP[1][2][0], SHOP[2][2][0]])
index = HEAD.format(title='爵士101｜一分鐘講不完的爵士故事', desc='爵士史上的人、晚上和唱片，一篇講完整，附上該怎麼聽。還有入門路線、聲音示範、樂手和名詞小辭典。', p='', ogimg='') + nav('') + \
    '<section class="hero"><h1><span class="nw">一分鐘講不完的爵士，</span><span class="nw">在這裡慢慢聽。</span></h1><p>那些錄音室、俱樂部和唱片背後的故事，一篇講完，再告訴你該聽哪一段。</p>' + \
    '<div class="ctas"><a class="btn" href="#stories">開始讀故事</a><a class="btn alt" href="start.html">第一次聽？從這裡</a></div>' + \
    '<div class="glow" aria-hidden="true"></div><div class="stage" id="stage"><div class="platter"><div class="disc"></div><div class="label"><div><b>JAZZ 101</b><span>Side A　ii–V–I</span></div></div></div><div class="arm"><i></i></div></div>' + \
    '<button class="play" id="play" aria-pressed="false"><svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg><span>放一段二五一</span></button>' + \
    '<p class="playnote">爵士樂最常聽到的和弦進行，用瀏覽器現場彈給你聽。</p></section>' + \
    f'<div class="wrap">{doors}</div>' + \
    f'<section class="band"><div class="in">{fig}<div><small>這次先讀這篇</small><h2>{e(f0["title"])}</h2><p>{e(f0["dek"])}</p><a class="btn" href="story/{f0["slug"]}.html">讀這篇故事</a></div></div></section>' + \
    f'<div class="wrap"><section class="sec" id="stories"><h2>所有故事</h2><p class="lede">依年份排列的人、晚上和唱片。每一篇都附上「這樣聽」。</p><div class="list">{rows}</div></section>' + \
    f'<section class="sec"><h2>第一次聽，照這個順序。</h2><p class="lede">十張唱片，一張比一張多一點東西。每張先聽一首就好。</p><div class="pathmini">{pmini}</div><a class="more-link" href="start.html">看完整的入門路線</a></section></div>' + \
    f'<section class="band"><div class="in" style="display:block"><small>聽懂爵士</small><h2>先按下去，再讀解釋。</h2><p>同一段旋律，直的和搖擺的差在哪裡？十二小節藍調長什麼樣子？用瀏覽器現場彈給你聽。</p>' + \
    f'<div class="demos">{demo_card("swing")}{demo_card("blues")}</div><a class="btn" href="listen.html">聽全部十個示範</a></div></section>' + \
    f'<div class="wrap"><section class="sec"><h2>一百多年，走一遍。</h2><p class="lede">從紐奧良的街頭到今天。金色的點，這裡有完整的故事。</p><div class="tlmini">{tlm}</div><a class="more-link" href="timeline.html">看完整時間軸</a></section>' + \
    f'<section class="sec"><h2>先認識這些人。</h2><p class="lede">每個人一句話、一首歌。</p><div class="pmini">{peo}</div><a class="more-link" href="people.html">看全部 {len(PEOPLE)} 位樂手</a></section>' + \
    '<section class="sec"><h2>今天學一個詞。</h2><div class="today" id="today"><div><h3 id="tw"></h3><p id="tx"></p></div><div><button id="tn">換一個</button></div></div><a class="more-link" href="words.html">打開小辭典</a></section>' + \
    f'<section class="sec"><h2>開始聽，需要的東西不多。</h2><p class="lede">幾張唱片、一本書、一副能聽見貝斯的耳機。</p><div class="items">{shopmini}</div><a class="more-link" href="shop.html">看全部選品</a></section>' + \
    f'<section class="sec"><h2>正在寫的故事</h2><p class="lede">IG 上已經講過一分鐘版本，長篇陸續放上來。</p><ul class="soon">{soon}</ul></section></div>' + \
    letter() + '<script src="player.js"></script>' + AUD('') + \
    '<script>(function(){var W=' + wjs + ',i=Math.floor(Math.random()*W.length);function s(){var w=W[i%W.length];document.getElementById("tw").innerHTML=w[1]+"<small>"+w[2]+"</small>";document.getElementById("tx").textContent=w[3];document.getElementById("today").onclick=null}s();document.getElementById("tn").onclick=function(){i++;s()}})()</script>' + foot()
W('', 'index.html', index)
total = sum(s['chars'] for s in S)
print('ok', len(S), 'stories,', total, '字;', len(PEOPLE), 'people;', len(WORDS), 'words;', len(TIMELINE), 'events;', 'out=', OUT)
