# Two logos, lossless outside the logo patches (jpegtran -drop).
import sys, os, subprocess, tempfile
from PIL import Image
CR=Image.open(sys.argv[1]).convert('RGBA'); JM=Image.open(sys.argv[2]).convert('RGBA')
src,dst=sys.argv[3],sys.argv[4]
im=Image.open(src); W,H=im.size; L=max(W,H)
layer=im.layer; samp=','.join(f'{l[1]}x{l[2]}' for l in layer)
mx=8*max(l[1] for l in layer); my=8*max(l[2] for l in layer)
m=round(L*0.022)
cw=round(L*0.12); cr=CR.resize((cw,round(CR.height*cw/CR.width)),Image.LANCZOS)
jw=round(L*0.058); jm=JM.resize((jw,round(JM.height*jw/JM.width)),Image.LANCZOS)
placements=[(cr,m-round(cw*0.04),H-cr.height-m+round(cr.height*0.08)),(jm,W-jw-m,H-jm.height-m)]
rgb=im.convert('RGB'); td=tempfile.mkdtemp(); cur=src
for k,(lg,px,py) in enumerate(placements):
    x0=max(0,(px//mx)*mx); y0=max(0,(py//my)*my)
    x1=min(W,-(-(px+lg.width)//mx)*mx); y1=min(H,-(-(py+lg.height)//my)*my)
    patch=rgb.crop((x0,y0,x1,y1)).convert('RGBA')
    ov=Image.new('RGBA',patch.size,(0,0,0,0)); ov.paste(lg,(px-x0,py-y0)); patch.alpha_composite(ov)
    pp=os.path.join(td,f'p{k}.ppm'); pj=os.path.join(td,f'p{k}.jpg'); patch.convert('RGB').save(pp)
    subprocess.run(['cjpeg','-quality','100','-sample',samp,'-outfile',pj,pp],check=True)
    out=os.path.join(td,f'o{k}.jpg') if k<len(placements)-1 else dst
    subprocess.run(['jpegtran','-copy','all','-drop',f'+{x0}+{y0}',pj,'-trim','-outfile',out,cur],check=True)
    cur=out
