"""City Cup 後台調色清單 → 套用到原檔（公式與 citycup/index.html 的 aPix 相同，sRGB 0-1）
用法：python3 citycup_adj.py 輸入.jpg 輸出.jpg "k=4800 b=-18 kh=+15"
"""
import sys,math,numpy as np
K0=5500
def kRGB(K):
    T=K/100
    if T<=66: r=255;g=99.4708025861*math.log(T)-161.1195681661;b=0 if T<=19 else 138.5177312231*math.log(T-10)-305.0447927307
    else: r=329.698727446*(T-60)**-.1332047592;g=288.1221695283*(T-60)**-.0755148492;b=255
    return r/g,1,b/g
def apply(rgb,v):
    g=lambda k:v.get(k,0)/100
    t,gg,s,b,sh,hl,kh,ks,kl=[g(k) for k in ("t","g","s","b","sh","hl","kh","ks","kl")]
    x=rgb.astype(np.float32)/255;r,G,B=x[...,0].copy(),x[...,1].copy(),x[...,2].copy()
    mx=np.maximum(np.maximum(r,G),B);mn=np.minimum(np.minimum(r,G),B);c=mx-mn;cs=np.where(c>1e-6,c,1)
    h=np.where(mx==r,((G-B)/cs)%6,np.where(mx==G,(B-r)/cs+2,(r-G)/cs+4))*60;h=np.where(c>1e-6,h,0);h=np.where(h<0,h+360,h)
    sat=np.where(mx>0,c/np.where(mx>0,mx,1),0)
    w=np.where((h<55)&(sat>.12)&(sat<.7)&(mx>.22),np.minimum(1,(55-h)/15)*np.minimum(1,(sat-.12)/.1)*np.minimum(1,(.7-sat)/.15)*np.minimum(1,(mx-.22)/.15),0)
    k0=kRGB(K0);k1=kRGB(v.get("k",K0));r*=k0[0]/k1[0]*(1+t*.6);B*=k0[2]/k1[2]*(1-t*.6);G*=1-gg*.5
    y=.299*r+.587*G+.114*B;r=y+(r-y)*(1+s);G=y+(G-y)*(1+s);B=y+(B-y)*(1+s)
    yc=np.minimum(y,1);f=(1+b)*(1+sh*.9*(1-yc)**3)*(1+hl*.6*yc**2);r*=f;G*=f;B*=f
    r=r*(1+kh*.25*w);G=G*(1-kh*.12*w);B=B*(1-kh*.05*w)
    y=.299*r+.587*G+.114*B;k=1+ks*w;r=y+(r-y)*k;G=y+(G-y)*k;B=y+(B-y)*k;L=1+kl*.6*w;r*=L;G*=L;B*=L
    return np.clip(np.stack([r,G,B],-1)*255+.5,0,255).astype(np.uint8)
def parse(sv): return {p.split('=')[0]:float(p.split('=')[1]) for p in sv.split() if '=' in p}
if __name__=='__main__':
    from PIL import Image
    im=Image.open(sys.argv[1]);ex=im.info.get('exif',b'');icc=im.info.get('icc_profile')
    out=Image.fromarray(apply(np.asarray(im.convert('RGB')),parse(sys.argv[3])))
    kw=dict(quality=92,exif=ex);
    if icc: kw['icc_profile']=icc
    out.save(sys.argv[2],'JPEG',**kw)
