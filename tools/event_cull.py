#!/usr/bin/env python3
"""活動照片一鍵初篩：連拍分組、手震、曝光、主角閉眼、粉紅／紫藍色偏。
用法：python3 event_cull.py <照片資料夾> <輸出.json> [--yunet yunet.onnx --landmarker face_landmarker.task]
只產生建議，不刪檔。"""
import sys,os,json,glob,argparse,re
import numpy as np,cv2
ap=argparse.ArgumentParser();ap.add_argument('src');ap.add_argument('out')
ap.add_argument('--yunet',default='/tmp/v/yunet.onnx');ap.add_argument('--landmarker',default='/tmp/v/fl.task')
a=ap.parse_args()
FL=None
try:
  import mediapipe as mp
  from mediapipe.tasks.python import vision,BaseOptions
  FL=vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path=a.landmarker),output_face_blendshapes=True,num_faces=1,min_face_detection_confidence=0.3))
except Exception as e: print('no mediapipe',e)
def eyes(im):
  if FL is None or not os.path.exists(a.yunet):return []
  H,W=im.shape[:2];d=cv2.FaceDetectorYN.create(a.yunet,'',(W,H),0.6,0.3,5000);_,fs=d.detect(im);out=[]
  for f in (fs if fs is not None else []):
    x,y,w,h=[int(v) for v in f[:4]]
    if w<40:continue
    cx,cy=x+w/2,y+h/2;s=max(w,h)*1.8
    cr=im[int(max(0,cy-s/2)):int(min(H,cy+s/2)),int(max(0,cx-s/2)):int(min(W,cx+s/2))]
    cr=cv2.resize(cv2.cvtColor(cr,cv2.COLOR_BGR2RGB),(256,int(256*cr.shape[0]/cr.shape[1])))
    r=FL.detect(mp.Image(image_format=mp.ImageFormat.SRGB,data=np.ascontiguousarray(cr)))
    if r.face_blendshapes:
      b={c.category_name:c.score for c in r.face_blendshapes[0]};out.append([round(min(b['eyeBlinkLeft'],b['eyeBlinkRight']),2),int(w*1400/W),x,y,w,h])
  return out
def feats(p):
  im=cv2.imread(p)
  if im is None:return None
  s=1400/max(im.shape[:2]);im=cv2.resize(im,None,fx=s,fy=s) if s<1 else im
  g=cv2.cvtColor(im,cv2.COLOR_BGR2GRAY)
  sharp=float(cv2.Laplacian(cv2.resize(g,(700,int(700*g.shape[0]/g.shape[1]))),cv2.CV_64F).var())
  mean=float(g.mean());clip=float((g>250).mean());dark=float((g<12).mean())
  hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV_FULL).astype(np.float32);hh=hsv[...,0]*360/256;ss=hsv[...,1]/255;vv=hsv[...,2]/255
  mid=(vv>.2)&(vv<.9);pink=float(((hh>285)&(ss>.15)&mid).sum()/max(1,mid.sum()))
  lo=slice(int(im.shape[0]*.6),None);purple=float(((hh[lo]>215)&(hh[lo]<345)&(ss[lo]>.18)&(vv[lo]>.18)).mean())
  th=cv2.resize(g,(32,24)).astype(np.float32);th=(th-th.mean())/(th.std()+1e-6)
  e=eyes(im);closed=any((w14>=90 and sc>=.42) for sc,w14,*_ in e)
  return dict(sharp=round(sharp,1),mean=round(mean,1),clip=round(clip,3),dark=round(dark,3),pink=round(pink,3),purple=round(purple,3),closed=closed,faces=e,thumb=th.flatten().round(2).tolist())
files=sorted(glob.glob(os.path.join(a.src,'**','*.jp*g'),recursive=True))
R={}
for i,p in enumerate(files):
  f=feats(p)
  if f:R[p]=f
  if i%100==0:print(i,len(files),flush=True)
# 連拍分組：檔名相鄰＋縮圖相關>0.85
keys=sorted(R,key=lambda p:(os.path.dirname(p),int(re.sub(r'\D','',os.path.basename(p)) or 0)))
groups=[];cur=[]
for p in keys:
  if cur:
    q=cur[-1];n1=int(re.sub(r'\D','',os.path.basename(q)) or 0);n2=int(re.sub(r'\D','',os.path.basename(p)) or 0)
    c=float(np.mean(np.array(R[q]['thumb'])*np.array(R[p]['thumb'])))
    if os.path.dirname(p)==os.path.dirname(q) and 0<n2-n1<=3 and c>.85:cur.append(p);continue
    groups.append(cur)
  cur=[p]
if cur:groups.append(cur)
sh=np.array([R[p]['sharp'] for p in R]);lim=float(np.percentile(sh,8))
sug={}
for g in groups:
  best=max(g,key=lambda p:(not R[p]['closed'],R[p]['sharp']))
  for p in g:
    why=[]
    if len(g)>1 and p!=best:why.append('連拍重複')
    if R[p]['sharp']<lim:why.append('可能手震')
    if R[p]['mean']<35 or R[p]['dark']>.6:why.append('太暗')
    if R[p]['clip']>.08:why.append('過曝')
    if R[p]['closed']:why.append('主角閉眼')
    if R[p]['pink']>=.33 or R[p]['purple']>=.25:why.append('色偏')
    if why:sug[p]=why
for p in R:R[p].pop('thumb')
json.dump(dict(groups=[g for g in groups if len(g)>1],suggest=sug,feats=R),open(a.out,'w'),ensure_ascii=False)
from collections import Counter
print('照片',len(R),'連拍組',sum(len(g)>1 for g in groups),'建議',len(sug),Counter(w for v in sug.values() for w in v))
