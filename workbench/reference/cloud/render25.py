import numpy as np, sys, subprocess, math
from PIL import Image, ImageFilter, ImageFont, ImageDraw
S='/tmp/claude-0/-home-claude/930792b6-7826-5d09-9273-17ff71506859/scratchpad'
W,H,FPS,DUR=1080,1920,30,float(sys.argv[2])
core=Image.open(f'{S}/crush/core_4x.png')
F3=f'{S}/fonts/montserrat/files/montserrat-latin-300-normal.woff'
F5=f'{S}/fonts/montserrat/files/montserrat-latin-500-normal.woff'
ORANGE=np.array([1.0,0.52,0.18])
def glow_logo(width, glow=1.0):
    h=round(core.height*width/core.width)
    m=core.resize((width,h),Image.LANCZOS)
    pad=int(width*0.18)
    c=Image.new('L',(width+2*pad,h+2*pad),0); c.paste(m,(pad,pad))
    cf=np.asarray(c,dtype=np.float32)/255
    g1=np.asarray(c.filter(ImageFilter.GaussianBlur(width*0.012)),dtype=np.float32)/255
    g2=np.asarray(c.filter(ImageFilter.GaussianBlur(width*0.045)),dtype=np.float32)/255
    g=np.clip(g1*0.95*glow,0,1)[...,None]*ORANGE
    gg=np.clip(g2*0.75*glow,0,1)[...,None]*ORANGE*0.9
    out=1-(1-g)*(1-gg)*(1-cf[...,None]*np.array([1.0,0.97,0.93]))
    return out.astype(np.float32)  # HxWx3 in 0..1 (black bg)
def text_img(txt,font,size,track,color=(1,1,1),glow=0.5):
    f=ImageFont.truetype(font,size)
    ws=[f.getbbox(ch)[2] for ch in txt]
    tw=int(sum(ws)+track*(len(txt)-1))+40
    im=Image.new('L',(tw,size*2),0); d=ImageDraw.Draw(im); x=20
    for ch,w in zip(txt,ws): d.text((x,size*0.3),ch,font=f,fill=255); x+=w+track
    im=im.crop(im.getbbox()); pad=20
    c=Image.new('L',(im.width+2*pad,im.height+2*pad),0); c.paste(im,(pad,pad))
    cf=np.asarray(c,dtype=np.float32)/255
    g=np.asarray(c.filter(ImageFilter.GaussianBlur(size*0.25)),dtype=np.float32)/255
    out=1-(1-np.clip(g*glow,0,1)[...,None]*ORANGE)*(1-cf[...,None]*np.array(color))
    return out.astype(np.float32)
def paste(fr,img,cx,cy,alpha):
    if alpha<=0: return
    h,w=img.shape[:2]; x0=int(cx-w/2); y0=int(cy-h/2)
    xa,ya=max(0,x0),max(0,y0); xb,yb=min(W,x0+w),min(H,y0+h)
    sub=img[ya-y0:yb-y0, xa-x0:xb-x0]*alpha
    fr[ya:yb,xa:xb]=1-(1-fr[ya:yb,xa:xb])*(1-sub)
ease=lambda t:1-(1-max(0,min(1,t)))**3
BIGW=820
bigsrc=glow_logo(int(BIGW*1.3),glow=1.2)
bigsrc_img=Image.fromarray((bigsrc*255).astype('uint8'))
small=glow_logo(400,glow=0.8)
date=text_img(sys.argv[3] if len(sys.argv)>3 else '10 . 15 . 2026',F3,30,14,glow=0.35)
endlogo=glow_logo(640,glow=1.0)
t1=text_img('FILM BY JIM',F5,34,12,glow=0.4)
t2=text_img('FULL VERSION  ·  IG @jimframe',F3,30,6,glow=0.3)
INTRO=2.6
cmd=['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-',
     '-c:v','libx264rgb','-preset','veryslow','-crf','2','-pix_fmt','rgb24',sys.argv[1]]
p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
cache={}
for i in range(int(DUR*FPS)):
    t=i/FPS; fr=np.zeros((H,W,3),np.float32)
    # intro big logo
    if t<INTRO:
        a=ease((t-0.42)/0.22)*(1-ease((t-2.2)/0.35))
        sc=1.35-0.35*ease((t-0.42)/0.35) + (-0.05*ease((t-2.2)/0.35))
        flash=1+0.7*math.exp(-((t-0.6)/0.1)**2)
        k=round(sc,3)
        if k not in cache:
            w=int(BIGW*k); cache[k]=np.asarray(bigsrc_img.resize((w+ w%2, round(bigsrc.shape[0]*w/bigsrc.shape[1])),Image.LANCZOS),dtype=np.float32)/255
        paste(fr,np.clip(cache[k]*flash,0,1),W/2,H*0.47,a)
    # main small logo + date
    if INTRO<=t<DUR-0.8:
        a=ease((t-2.75)/0.5)*(1-ease((t-(DUR-1.3))/0.5))
        paste(fr,small,W/2,1640,a)
        paste(fr,date,W/2,1765,a*0.9)
    # end card
    if t>=DUR-0.9:
        a=ease((t-(DUR-0.9))/0.4)
        paste(fr,endlogo,W/2,H*0.44,a)
        paste(fr,t1,W/2,H*0.44+260,a)
        paste(fr,t2,W/2,H*0.44+330,a*0.9)
    p.stdin.write((np.clip(fr,0,1)*255).astype(np.uint8).tobytes())
p.stdin.close(); p.wait()
# stills for preview
