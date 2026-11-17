"""爵士101 網站產生器：python3 build.py [Substack網址]
輸出 jazz/index.html 與 jazz/story/<slug>.html（從 repo 根目錄或本資料夾執行皆可）"""
import os, sys, json, html
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
from stories import S
for _s in S:
    _n=sum(len(x) for _,ps in _s['sections'] for x in ps)+sum(len(a)+len(b) for a,b in _s['listen'])
    _s['read']=f"{max(2,round(_n/400))} 分鐘"

SUB = sys.argv[1] if len(sys.argv) > 1 else ''
IG = 'https://www.instagram.com/jazz101tw/'
SUB_HREF = SUB or IG
SUB_TXT = '免費訂閱電子報 →' if SUB else '電子報即將開放・先追蹤 IG →'
COMING = json.load(open(os.path.join(HERE, 'coming.json'), encoding='utf-8'))

CSS = """
:root{--bg:#0d1620;--bg2:#13202d;--line:#24364a;--tx:#e6eaee;--mu:#8fa0b2;--acc:#e8a33d;--acc2:#f3c578}
@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){--bg:#f6f1e7;--bg2:#fffaf0;--line:#e3d6bf;--tx:#1b2430;--mu:#5d6b7a;--acc:#b36b00;--acc2:#8a5200}}
:root[data-theme="dark"]{--bg:#0d1620;--bg2:#13202d;--line:#24364a;--tx:#e6eaee;--mu:#8fa0b2;--acc:#e8a33d;--acc2:#f3c578}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--tx);font:17px/1.9 "Noto Sans TC",system-ui,sans-serif;overflow-x:hidden}
a{color:inherit}
.wrap{max-width:900px;margin:0 auto;padding:0 20px}
.narrow{max-width:680px;margin:0 auto;padding:0 20px}
.mono{font-family:"Space Mono",monospace;letter-spacing:.12em;font-size:12px;color:var(--acc)}
h1,h2,h3{font-family:"Noto Serif TC",serif;line-height:1.35}
header{padding:20px 0;display:flex;justify-content:space-between;align-items:center;gap:12px}
header a.home{text-decoration:none}
header nav a{margin-left:16px;font-size:14px;color:var(--mu);text-decoration:none}
.btn{display:inline-flex;align-items:center;background:var(--acc);color:#14100a;font-weight:600;padding:12px 22px;border-radius:999px;text-decoration:none;font-size:16px}
.hero{padding:50px 0 40px}
.hero h1{font-size:clamp(38px,8vw,68px);font-weight:800;margin:12px 0 14px}
.hero h1 span{color:var(--acc)}
.hero p{color:var(--mu);max-width:560px;font-size:18px}
.feat{display:block;text-decoration:none;border:1px solid var(--line);background:var(--bg2);border-radius:18px;padding:30px;margin:10px 0 40px}
.feat .yr{font-family:"Space Mono",monospace;font-size:clamp(56px,12vw,96px);color:var(--acc);line-height:1}
.feat h2{font-size:clamp(24px,4.6vw,34px);margin:10px 0}
.feat p{color:var(--mu)}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
@media (max-width:680px){.grid{grid-template-columns:1fr}}
.card{display:block;text-decoration:none;border:1px solid var(--line);border-radius:16px;padding:22px;background:var(--bg2);transition:transform .15s}
.card:hover{transform:translateY(-3px);border-color:var(--acc)}
.card .yr{font-family:"Space Mono",monospace;font-size:34px;color:var(--acc);line-height:1}
.card h3{font-size:20px;margin:8px 0 6px}
.card p{color:var(--mu);font-size:15px;line-height:1.7}
.meta{font-size:13px;color:var(--mu);margin-top:10px}
section.blk{padding:46px 0;border-top:1px solid var(--line)}
section.blk h2{font-size:clamp(24px,4.6vw,30px);margin:8px 0 18px}
.soon{list-style:none;columns:2;column-gap:28px}
@media (max-width:680px){.soon{columns:1}}
.soon li{break-inside:avoid;padding:8px 0;border-bottom:1px dashed var(--line);color:var(--mu);font-size:15px}
.nl{border:1px solid var(--acc);border-radius:18px;padding:28px;background:var(--bg2)}
.nl h2{margin-top:6px}
.nl p{color:var(--mu);margin:6px 0 18px}
footer{padding:30px 0 50px;color:var(--mu);font-size:13px;border-top:1px solid var(--line);margin-top:40px}
/* article */
.art-head{padding:40px 0 10px}
.art-head .yr{font-family:"Space Mono",monospace;font-size:clamp(64px,16vw,120px);color:var(--acc);line-height:1}
.art-head h1{font-size:clamp(28px,6vw,42px);margin:16px 0 14px;font-weight:800}
.art-head .dek{font-size:19px;color:var(--mu);line-height:1.8}
.art-body h2{font-size:24px;margin:44px 0 12px;color:var(--acc2)}
.art-body p{margin:0 0 18px}
.box{border:1px solid var(--line);border-radius:16px;padding:24px;background:var(--bg2);margin:40px 0}
.box h3{font-size:21px;margin-bottom:12px}
.listen{list-style:none;counter-reset:l}
.listen li{counter-increment:l;padding:12px 0 12px 46px;position:relative;border-bottom:1px dashed var(--line)}
.listen li:last-child{border:0}
.listen li:before{content:counter(l);position:absolute;left:0;top:13px;width:30px;height:30px;border-radius:50%;border:1px solid var(--acc);color:var(--acc);display:grid;place-items:center;font-family:"Space Mono",monospace;font-size:13px}
.listen b{display:block;font-family:"Noto Serif TC",serif}
.listen span{color:var(--mu);font-size:15px}
ul.plain{padding-left:20px;color:var(--mu);font-size:15px}
.src{font-size:13px;color:var(--mu)}
.nav2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:30px 0}
.nav2 a{display:block;border:1px solid var(--line);border-radius:14px;padding:16px;text-decoration:none;font-size:15px}
.nav2 a small{display:block;color:var(--mu);font-size:12px}
@media (max-width:520px){.nav2{grid-template-columns:1fr}}
"""

HEAD = """<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title><meta name="description" content="{desc}"><meta property="og:title" content="{title}"><meta property="og:description" content="{desc}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600;800&family=Noto+Sans+TC:wght@400;600&family=Space+Mono&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{css}"></head><body>"""

e = html.escape

def header(prefix):
    return f'<div class="wrap"><header><a class="home mono" href="{prefix}index.html">JAZZ 101 · 爵士101</a><nav><a href="{prefix}index.html#stories">故事</a><a href="{prefix}index.html#newsletter">電子報</a></nav></header></div>'

def footer():
    return f'<div class="wrap"><footer>爵士101 · Jazz 101｜由 Jim 在台北整理。每篇都附出處，查不到的不寫。一分鐘版在 IG <a href="{IG}" target="_blank" rel="noopener">@jazz101tw</a></footer></div></body></html>'

def nl_box():
    return f'<div class="nl" id="newsletter"><div class="mono">NEWSLETTER</div><h2>爵士101｜慢慢聽</h2><p>每兩週一封，每期只講一張唱片：那天在哪裡錄、台上是誰、該聽哪一段。不用懂樂理，戴上耳機照著聽。</p><a class="btn" href="{SUB_HREF}" target="_blank" rel="noopener">{SUB_TXT}</a></div>'

os.makedirs(os.path.join(ROOT, 'jazz', 'story'), exist_ok=True)
open(os.path.join(ROOT, 'jazz', 'style.css'), 'w', encoding='utf-8').write(CSS)

# 文章頁
for i, s in enumerate(S):
    body = ''.join(f'<h2>{e(h)}</h2>' + ''.join(f'<p>{e(p)}</p>' for p in ps) for h, ps in s['sections'])
    listen = ''.join(f'<li><b>〈{e(a)}〉</b><span>{e(b)}</span></li>' if not a.startswith(('再','注意','Part','Flanagan','Giant')) else f'<li><b>{e(a)}</b><span>{e(b)}</span></li>' for a, b in s['listen'])
    more = ''.join(f'<li>{e(m)}</li>' for m in s['more'])
    src = '、'.join(e(x) for x in s['src'])
    prev = S[i - 1] if i > 0 else None
    nxt = S[i + 1] if i < len(S) - 1 else None
    nav = '<div class="nav2">' + (f'<a href="{prev["slug"]}.html"><small>← 上一篇</small>{e(prev["title"])}</a>' if prev else '<span></span>') + (f'<a href="{nxt["slug"]}.html" style="text-align:right"><small>下一篇 →</small>{e(nxt["title"])}</a>' if nxt else '<span></span>') + '</div>'
    page = HEAD.format(title=e(s['title']) + '｜爵士101', desc=e(s['dek']), css='../style.css') + header('../') + \
        f'<article class="narrow"><div class="art-head"><div class="mono">{e(s["tag"])} · 閱讀約 {e(s["read"])}</div><div class="yr">{e(s["year"])}</div><h1>{e(s["title"])}</h1><p class="dek">{e(s["dek"])}</p></div>' + \
        f'<div class="art-body">{body}</div>' + \
        f'<div class="box"><h3>這樣聽</h3><ol class="listen">{listen}</ol></div>' + \
        f'<div class="box"><h3>聽完再去聽</h3><ul class="plain">{more}</ul></div>' + \
        f'<p class="src">出處：{src}</p>{nav}{nl_box()}</article>' + footer()
    open(os.path.join(ROOT, 'jazz', 'story', s['slug'] + '.html'), 'w', encoding='utf-8').write(page)

# 首頁
f0 = S[0]
cards = ''.join(f'<a class="card" href="story/{s["slug"]}.html"><div class="yr">{e(s["year"])}</div><h3>{e(s["title"])}</h3><p>{e(s["dek"])}</p><div class="meta">{e(s["tag"])} · 閱讀約 {e(s["read"])}</div></a>' for s in S[1:])
soon = ''.join(f'<li>{e(t)}</li>' for t in COMING)
index = HEAD.format(title='爵士101｜一分鐘講不完的爵士故事', desc='爵士史上的人、晚上和唱片，一篇一篇講完整。附聽法與延伸聽。', css='style.css') + header('') + \
    '<div class="wrap"><div class="hero"><div class="mono">STORIES · 長篇故事</div><h1>爵士101<br><span>完整版</span></h1><p>IG 上一集一分鐘講不完的，這裡一篇講完：那天發生了什麼、後來怎麼了、你該聽哪一段。</p></div>' + \
    f'<a class="feat" href="story/{f0["slug"]}.html"><div class="mono">本週精選</div><div class="yr">{e(f0["year"])}</div><h2>{e(f0["title"])}</h2><p>{e(f0["dek"])}</p><div class="meta">{e(f0["tag"])} · 閱讀約 {e(f0["read"])}</div></a>' + \
    f'<section class="blk" id="stories"><div class="mono">ALL STORIES</div><h2>所有故事</h2><div class="grid">{cards}</div></section>' + \
    f'<section class="blk"><div class="mono">COMING</div><h2>陸續上線</h2><ul class="soon">{soon}</ul></section>' + \
    f'<section class="blk">{nl_box()}</section></div>' + footer()
open(os.path.join(ROOT, 'jazz', 'index.html'), 'w', encoding='utf-8').write(index)
print('ok', len(S), 'stories')
