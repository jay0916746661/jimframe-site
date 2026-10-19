import cv2, numpy as np, onnxruntime as ort, json, sys, os, glob, time
SP='/tmp/claude-0/-home-claude/930792b6-7826-5d09-9273-17ff71506859/scratchpad/'
R='/home/claude/jimframe-site/'
alb=sys.argv[1]; out=sys.argv[2]; part=int(sys.argv[3]); K=int(sys.argv[4]); only=sys.argv[5].split(',') if len(sys.argv)>5 else None
fs=sorted(glob.glob(f'{R}photos/{alb}/A*.jpg'))
if only: fs=[f for f in fs if os.path.basename(f)[:-4] in only]
fs=fs[part::K]
det=cv2.FaceDetectorYN.create(SP+'yunet.onnx','',(320,320),0.6,0.3,100)
so=ort.SessionOptions(); so.intra_op_num_threads=1
sess=ort.InferenceSession(R+'face/face-api/sface_int8.onnx',so,providers=['CPUExecutionProvider']); iname=sess.get_inputs()[0].name
T=np.array([[38.2946,51.6963],[73.5318,51.5014],[56.0252,71.7366],[41.5493,92.3655],[70.7299,92.2041]],np.float32)
def rot(img,deg):
    h,w=img.shape[:2]; M=cv2.getRotationMatrix2D((w/2,h/2),deg,1); c,s=abs(M[0,0]),abs(M[0,1]); nw,nh=int(w*c+h*s),int(w*s+h*c)
    M[0,2]+=nw/2-w/2; M[1,2]+=nh/2-h/2; return cv2.warpAffine(img,M,(nw,nh)),M
def fp(img):
    g=cv2.resize(cv2.cvtColor(img,cv2.COLOR_BGR2RGB),(9,8),interpolation=cv2.INTER_AREA).astype(float); L=(g[...,0]*3+g[...,1]*6+g[...,2])/10
    return ''.join('1' if L[y,i]>L[y,i+1] else '0' for y in range(8) for i in range(8))
res={}; t=time.time()
for f in fs:
    im=cv2.imread(f); s=1200/max(im.shape[:2]); im=cv2.resize(im,None,fx=s,fy=s,interpolation=cv2.INTER_AREA); faces=[]
    for deg in (0,20,-20,40,-40,60,-60):
        r,M=rot(im,deg); det.setInputSize((r.shape[1],r.shape[0])); _,d=det.detect(r)
        if d is None: continue
        Mi=cv2.invertAffineTransform(M)
        for row in d:
            x,y,w,h=row[:4]; size=min(w,h); sc=float(row[14])
            if size<32: continue
            cx,cy=Mi@np.array([x+w/2,y+h/2,1])
            src=row[4:14].reshape(5,2).astype(np.float32)
            A,_=cv2.estimateAffinePartial2D(src,T,method=cv2.LMEDS)
            if A is None: continue
            crop=cv2.warpAffine(r,A,(112,112),borderValue=(0,0,0))
            x_=cv2.cvtColor(crop,cv2.COLOR_BGR2RGB).astype(np.float32).transpose(2,0,1)[None]
            v=sess.run(None,{iname:x_})[0][0]; v=v/(np.linalg.norm(v)+1e-9)
            item=dict(e=[round(float(a),5) for a in v],m=[int(round(size)),round(sc,2),deg],cx=float(cx),cy=float(cy),sc=sc,size=size)
            dup=next((o for o in faces if np.hypot(o['cx']-cx,o['cy']-cy)<max(o['size'],size)*.5),None)
            if dup is None: faces.append(item)
            elif sc>dup['sc']: dup.update(item)
    res[os.path.basename(f)[:-4]]=dict(f=[o['e'] for o in faces],m=[o['m'] for o in faces],h=fp(im))
json.dump(res,open(out,'w')); print(len(res),round((time.time()-t)/max(1,len(res)),2),'s/張')
