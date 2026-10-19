import glob,json,re,numpy as np
from PIL import Image
def hist(p):
    im=Image.open(p).convert('RGB');W,H=im.size
    im=im.crop((int(W*.12),int(H*.12),int(W*.88),int(H*.95)));w=96;h=max(1,round(96*im.size[1]/im.size[0]))
    a=np.asarray(im.resize((w,h),Image.BILINEAR),dtype=np.float32)/255
    r,g,b=a[...,0],a[...,1],a[...,2];mx=a.max(-1);mn=a.min(-1);c=mx-mn;sat=np.where(mx>0,c/np.maximum(mx,1e-9),0)
    m=(sat>.5)&(mx>.4)&(c>0)
    hu=np.where(mx==r,((g-b)/np.maximum(c,1e-9))%6,np.where(mx==g,(b-r)/np.maximum(c,1e-9)+2,(r-g)/np.maximum(c,1e-9)+4))
    hu=(hu*60+360)%360;k=np.minimum(35,(hu//10).astype(int))
    out=np.bincount(k[m],weights=(sat*mx)[m],minlength=36)[:36]
    return out/(w*h)
G=[[345,15],[15,40],[40,70],[70,160],[160,200],[200,250],[250,290],[290,345]]
grp=lambda h:next(i for i,(x,y) in enumerate(G) if (x<=h<y if x<y else (h>=x or h<y)))
res={}
for ev in ['1017']:
    H={}
    for p in sorted(glob.glob(f'videos/{ev}/bc-*.jpg')):
        n=re.search(r'bc-([\d-]+)\.jpg',p).group(1)
        fs=[p]+sorted(glob.glob(f'videos/{ev}/cand-{n}-*.jpg'))
        H[n]=np.mean([hist(f) for f in fs],0)
    base=np.median(np.array(list(H.values())),0)
    out={}
    for n,h in H.items():
        e=h-1.3*base;sm=e+.5*np.roll(e,1)+.5*np.roll(e,-1);best=int(sm.argmax());hue=best*10+5
        out[n]=[grp(hue),hue,int(round(sm[best]*1000))]
    res[ev]=out
print(json.dumps(res,separators=(',',':')))
