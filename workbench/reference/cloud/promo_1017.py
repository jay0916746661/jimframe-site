from PIL import Image, ImageDraw, ImageFont, ImageOps
import os
R='/home/claude/jimframe-site/'; P=R+'photos/1017/'; V=R+'videos/1017/'
S='/tmp/claude-0/-home-claude/930792b6-7826-5d09-9273-17ff71506859/scratchpad/'
O=S+'p17/out/'; os.makedirs(O,exist_ok=True)
F=lambda w,s: ImageFont.truetype(f'/usr/share/fonts/opentype/noto/NotoSansCJK-{w}.ttc',s,index=2)
crush=Image.open(S+'crush/crush_rgba.png').convert('RGBA'); jim=Image.open(S+'logo/filmbyjim-logo.png').convert('RGBA')
BG=(16,11,12); GOLD=[(246,222,160),(214,170,92),(250,232,180)]
def ph(n,w,h,cy=.4):
    im=Image.open(P+f'A000{n}.jpg').convert('RGB'); a,b=im.size; im=im.crop((int(a*.03),int(b*.02),int(a*.97),int(b*.86)))
    return ImageOps.fit(im,(w,h),Image.LANCZOS,centering=(.5,cy))
def vp(k,w,h): return ImageOps.fit(Image.open(V+f'bc-17-{k}.jpg').convert('RGB'),(w,h),Image.LANCZOS,centering=(.5,.4))
def logo(c,im,w,y,cx=None):
    W=c.width; cx=cx or W//2; r=im.resize((w,int(im.height*w/im.width)),Image.LANCZOS); c.alpha_composite(r,(cx-w//2,int(y))); return y+r.height
def grad(c,y0,y1,a0,a1):
    W=c.width;g=Image.new('L',(1,y1-y0)); [g.putpixel((0,i),int(a0+(a1-a0)*i/(y1-y0))) for i in range(y1-y0)]
    c.alpha_composite(Image.merge('RGBA',[Image.new('L',(W,y1-y0),v) for v in BG]+[g.resize((W,y1-y0))]),(0,y0))
def ctext(c,y,t,f,fill=(255,255,255)):
    d=ImageDraw.Draw(c); w=d.textlength(t,font=f); d.text(((c.width-w)/2,y),t,font=f,fill=fill)
def gtext(c,y,t,f):
    d=ImageDraw.Draw(c); w=int(d.textlength(t,font=f)); bb=d.textbbox((0,0),t,font=f); h=bb[3]+10
    m=Image.new('L',(w+4,h)); ImageDraw.Draw(m).text((2,0),t,font=f,fill=255)
    g=Image.new('RGBA',(w+4,h))
    for x in range(w+4):
        u=x/(w+3); a,b=(GOLD[0],GOLD[1]) if u<.5 else (GOLD[1],GOLD[2]); v=u*2 if u<.5 else u*2-1
        ImageDraw.Draw(g).line([(x,0),(x,h)],fill=tuple(int(a[i]+(b[i]-a[i])*v) for i in range(3))+(255,))
    g.putalpha(m); c.alpha_composite(g,((c.width-w)//2,int(y)))
def line(c,y,w=420):
    d=ImageDraw.Draw(c);x0=(c.width-w)//2
    for x in range(w):
        a=1-abs(x/w-.5)*1.8; d.line([(x0+x,y),(x0+x,y+2)],fill=(int(170+70*a),int(130+70*a),int(70+50*a)))
def frame(c,box,col=(214,170,92)): ImageDraw.Draw(c).rectangle(box,outline=col,width=3)
def play(c,x,y,r=34):
    d=ImageDraw.Draw(c); d.ellipse((x-r,y-r,x+r,y+r),fill=(0,0,0,150),outline=(240,215,160),width=2)
    d.polygon([(x-10,y-15),(x-10,y+15),(x+16,y)],fill=(255,255,255))
def step(c,y,n,t,s,W):
    d=ImageDraw.Draw(c); x0,x1=110,W-110
    d.rounded_rectangle((x0,y,x1,y+130),24,outline=(214,170,92),width=3,fill=(30,22,20))
    d.ellipse((x0+30,y+33,x0+94,y+97),fill=(214,170,92)); d.text((x0+62,y+65),str(n),font=F('Black',40),fill=BG,anchor='mm')
    d.text((x0+124,y+22),t,font=F('Bold',44),fill=(255,255,255)); d.text((x0+124,y+80),s,font=F('Regular',26),fill=(200,190,175))
PH=[7487,7257,7594,7651,7341,7229]; VK=['102','154','155','156','159','162']
SUB='10.17  DRESSY & SULTRY 華麗微醺'
def save(c,n): c.convert('RGB').save(O+n,quality=92)
# ---------- POSTS 1080x1350 ----------
W,H=1080,1350
c=Image.new('RGBA',(W,H),BG+(255,)); gw,gh,g=528,420,8
for k in range(4):
    r,col=divmod(k,2); x,y=8+col*(gw+g),8+r*(gh+g); c.paste(ph(PH[k],gw,gh),(x,y))
grad(c,560,880,0,255); y=logo(c,crush,500,700)
gtext(c,y+10,'照片＋影片 上線了',F('Black',82)); ctext(c,y+125,'Photos & videos are up',F('Bold',38),(235,225,210))
line(c,y+190); ctext(c,y+210,'10.17 Dressy & Sultry 華麗微醺 · 663 張照片 · 9 支影片',F('Medium',28),(210,200,185))
logo(c,jim,130,H-110,W-100); save(c,'1017上線_貼文1.jpg')
c=Image.new('RGBA',(W,H),BG+(255,)); gw,gh=322,460
for k in range(6):
    r,col=divmod(k,3); x,y=40+col*(gw+17),40+r*(gh+17); c.paste(vp(VK[k],gw,gh),(x,y)); frame(c,(x,y,x+gw,y+gh)); play(c,x+gw//2,y+gh//2)
gtext(c,1010,'9 支舞蹈影片  免費下載',F('Black',66)); ctext(c,1105,'9 dance videos · free 25s downloads',F('Bold',34),(235,225,210))
line(c,1170); ctext(c,1190,'可直接發限動／Reels · 標記你的舞伴',F('Medium',30),(210,200,185)); logo(c,jim,120,H-100,W-90); save(c,'1017上線_貼文2.jpg')
c=Image.new('RGBA',(W,H),BG+(255,)); c.paste(ph(7651,1000,560,.35),(40,40)); frame(c,(40,40,1040,600))
gtext(c,650,'上傳自拍 找到自己',F('Black',72)); ctext(c,745,'Find yourself with one selfie',F('Bold',34),(235,225,210))
step(c,820,1,'打開連結','Open the link',W); step(c,975,2,'上傳一張自拍','Upload one selfie',W); step(c,1130,3,'你的照片全部跳出來','All your photos pop up',W)
save(c,'1017上線_貼文3.jpg')
c=Image.new('RGBA',(W,H),BG+(255,)); y=logo(c,crush,520,110)
gtext(c,y+60,'1,326',F('Black',190)); ctext(c,y+290,'張照片 photos',F('Bold',46),(235,225,210))
gtext(c,y+390,'62',F('Black',190)); ctext(c,y+620,'支影片 videos',F('Bold',46),(235,225,210))
line(c,y+720,560); ctext(c,y+745,'10.15 Preparty ＋ 10.16 Neon ＋ 10.17 Dressy & Sultry',F('Medium',30),(210,200,185))
ctext(c,y+800,'連結在主頁 · Link in bio',F('Bold',34),(240,220,170)); logo(c,jim,120,H-100,W-90); save(c,'1017上線_貼文4.jpg')
# ---------- STORIES 1080x1920 ----------
W,H=1080,1920
TX={'zh':dict(a='照片＋影片 上線了',a2='663 張照片 · 9 支影片',b=['上傳自拍 找到自己','25 秒試看 免費下載','一鍵做成限動'],
              v='9 支舞蹈影片',v2='免費下載',v3='25 秒試看版 · 可直接發限動／Reels',v4='找找你們那支 ↓',
              f='找自己 只要 3 步',s=[('打開連結',''),('上傳一張自拍',''),('你的照片全部跳出來','')],f2='下載原圖 · 一鍵做限動',lk='點連結 ↓'),
    'en':dict(a='Photos + videos are up',a2='663 photos · 9 videos',b=['Find yourself with a selfie','Free 25s video downloads','Story in one tap'],
              v='9 dance videos',v2='Free downloads',v3='25s previews · ready for Stories / Reels',v4='Find yours ↓',
              f='Find yourself in 3 steps',s=[('Open the link',''),('Upload one selfie',''),('All your photos pop up','')],f2='Full-res downloads · Story in one tap',lk='Tap the link ↓')}
for L,t in TX.items():
    zh=L=='zh'
    c=Image.new('RGBA',(W,H),BG+(255,)); y=logo(c,crush,440,70); ctext(c,y+5,SUB,F('Bold',30),(240,220,170))
    c.paste(ph(7487,1000,400,.3),(40,y+60)); frame(c,(40,y+60,1040,y+460)); c.paste(ph(7341,1000,400),(40,y+480)); frame(c,(40,y+480,1040,y+880))
    y+=915; gtext(c,y,t['a'],F('Black',80 if zh else 70)); ctext(c,y+110,t['a2'],F('Bold',38),(235,225,210))
    d=ImageDraw.Draw(c); yy=y+180
    for b in t['b']:
        w=d.textlength(b,font=F('Bold',30))+60; x=(W-w)/2; d.rounded_rectangle((x,yy,x+w,yy+56),28,outline=(214,170,92),width=2); d.text((x+30,yy+8),b,font=F('Bold',30),fill=(245,235,215)); yy+=72
    ctext(c,H-200,t['lk'],F('Bold',38),(255,255,255)); logo(c,jim,150,H-130,W-110); save(c,f'1017上線_限動1_{L}.jpg')
    c=Image.new('RGBA',(W,H),BG+(255,)); y=logo(c,crush,440,70); ctext(c,y+5,SUB,F('Bold',30),(240,220,170))
    gw,gh=318,500; y0=y+70
    for k in range(6):
        r,col=divmod(k,3); x,yy=45+col*(gw+18),y0+r*(gh+18); c.paste(vp(VK[k],gw,gh),(x,yy)); frame(c,(x,yy,x+gw,yy+gh)); play(c,x+gw//2,yy+gh//2)
    y=y0+2*gh+70; gtext(c,y,t['v'],F('Black',84 if zh else 76)); ctext(c,y+115,t['v2'],F('Bold',48),(255,255,255))
    ctext(c,y+190,t['v3'],F('Medium',32),(210,200,185)); ctext(c,H-200,t['v4'],F('Bold',38)); logo(c,jim,150,H-130,W-110); save(c,f'1017上線_限動2_{L}.jpg')
    c=Image.new('RGBA',(W,H),BG+(255,)); y=logo(c,crush,440,70); ctext(c,y+5,SUB,F('Bold',30),(240,220,170))
    c.paste(ph(7229,1000,600,.35),(40,y+60)); frame(c,(40,y+60,1040,y+660)); y+=700
    gtext(c,y,t['f'],F('Black',78 if zh else 66)); y+=120
    for i,(a,b) in enumerate(t['s']): step(c,y+i*150,i+1,a,b,W)
    ctext(c,y+3*155+20,t['f2'],F('Medium',32),(210,200,185)); ctext(c,H-200,t['lk'],F('Bold',38)); logo(c,jim,150,H-130,W-110); save(c,f'1017上線_限動3_{L}.jpg')
