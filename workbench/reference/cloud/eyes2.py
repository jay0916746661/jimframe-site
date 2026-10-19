import cv2, numpy as np, json, sys, os, glob, time
SP='/tmp/claude-0/-home-claude/930792b6-7826-5d09-9273-17ff71506859/scratchpad/'
alb=sys.argv[1]; out=sys.argv[2]; part=int(sys.argv[3]); K=int(sys.argv[4]); cropdir=sys.argv[5] if len(sys.argv)>5 else None
fs=sorted(glob.glob(f'/home/claude/jimframe-site/photos/{alb}/A*.jpg'))[part::K]
det=cv2.FaceDetectorYN.create(SP+'yunet.onnx','',(320,320),0.6,0.3,50)
hc=cv2.CascadeClassifier(cv2.data.haarcascades+'haarcascade_eye_tree_eyeglasses.xml')
def rot(img,deg):
    h,w=img.shape[:2]; M=cv2.getRotationMatrix2D((w/2,h/2),deg,1); c,s=abs(M[0,0]),abs(M[0,1]); nw,nh=int(w*c+h*s),int(w*s+h*c)
    M[0,2]+=nw/2-w/2; M[1,2]+=nh/2-h/2; return cv2.warpAffine(img,M,(nw,nh)),M
res={}
for f in fs:
    im=cv2.imread(f); s=1600/max(im.shape[:2]); im=cv2.resize(im,None,fx=s,fy=s,interpolation=cv2.INTER_AREA); faces=[]
    for deg in (0,-30,30):
        r,M=rot(im,deg); det.setInputSize((r.shape[1],r.shape[0])); _,d=det.detect(r)
        if d is None: continue
        Mi=cv2.invertAffineTransform(M)
        for row in d:
            x,y,w,h=row[:4]; size=min(w,h)
            if size<75: continue
            cx,cy=Mi@np.array([x+w/2,y+h/2,1])
            if any(np.hypot(cx-o['cx'],cy-o['cy'])<size*.5 for o in faces): continue
            re,le=row[4:6],row[6:8]; ang=np.degrees(np.arctan2(le[1]-re[1],le[0]-re[0])); iod=np.linalg.norm(le-re)
            if iod<12: continue
            ctr=(re+le)/2; A=cv2.getRotationMatrix2D(tuple(map(float,ctr)),float(ang),96/iod)  # normalize: iod=96px
            A[0,2]+=128-ctr[0]; A[1,2]+=110-ctr[1]
            face=cv2.warpAffine(r,A,(256,300)); g=cv2.cvtColor(face,cv2.COLOR_BGR2GRAY)
            # eyes at (80,110) and (176,110); cheek patch below
            def patch(cx_):
                p=g[110-14:110+14,cx_-24:cx_+24].astype(float); return p
            cheek=np.median(g[150:185,70:186])
            ev=[]
            for ex in (80,176):
                p=patch(ex); lo=np.percentile(p,8); hi=np.percentile(p,92)
                ev.append([round((cheek-lo)/max(cheek,1),2), round((hi-cheek)/max(cheek,1),2)])
            eyes=hc.detectMultiScale(g[60:160,20:236],1.1,3,minSize=(24,18))
            faces.append(dict(cx=float(cx),cy=float(cy),size=int(size),score=round(float(row[14]),2),dark=[e[0] for e in ev],bright=[e[1] for e in ev],haar=int(len(eyes)),iod=round(float(iod)/s,1)))
            if cropdir: cv2.imwrite(f'{cropdir}/{os.path.basename(f)[:-4]}_{len(faces)-1}.jpg',face[50:170])
    res[os.path.basename(f)[:-4]]=faces
json.dump(res,open(out,'w')); print(len(res))
