import subprocess,os,time,numpy as np,json
R=os.path.expanduser('~/mnt/1017 bachata crush/JimFrame_成品');A=R+'/_assets';S=R+'/25秒試看版';ST=R+'/限動照片';O=R+'/網站用/videos';[os.makedirs(d,exist_ok=True) for d in (ST,O)]
NAMES=['C0102','C0154','C0155','C0156','C0158','C0159','C0161','C0162','C0163']
t0=time.time();cands=json.load(open(O+'/cands.json')) if os.path.exists(O+'/cands.json') else {}
def sharp(src,t,w=135,h=240,r=(40,200)):
    raw=subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',src,'-frames:v','1','-vf',f'scale={w}:{h}','-f','rawvideo','-pix_fmt','gray','-'],capture_output=True).stdout
    if len(raw)<w*h:return -1
    a=np.frombuffer(raw,np.uint8).reshape(h,w).astype(float);return np.var(np.diff(a,axis=0)[r[0]:r[1]])+np.var(np.diff(a,axis=1)[r[0]:r[1]])
for c in NAMES:
    if time.time()-t0>140:break
    k='17-'+c[2:];g=os.path.expanduser(f'~/g17/{c}.mp4');src=f'{S}/1017_{c} 25秒試看.mp4';mp=f'{O}/bc-{k}.mp4'
    D=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',src],capture_output=True,text=True).stdout)
    st=f'{ST}/1017_{c}_限動.jpg'
    if not os.path.exists(st):
        best=max(((sharp(g,3+i*1.4,270,480,(100,380)),3+i*1.4) for i in range(int((D-4)/1.4))),default=(0,5))[1]
        subprocess.run(['ffmpeg','-v','error','-y','-ss',str(best),'-i',g,'-i',A+'/crush-logo.png','-i',R+'/filmbyjim-logo.png','-filter_complex',"[0:v]scale=1080:1920,format=rgba[b];[1:v]scale=440:-1[c];[2:v]scale=200:-1[j];[b][c]overlay=(W-w)/2:H-h-150[x];[x][j]overlay=40:56,format=yuvj444p",'-frames:v','1','-q:v','2',st])
    if not os.path.exists(mp):
        subprocess.run(['ffmpeg','-v','error','-y','-i',src,'-vf','hqdn3d=1:1:3:3','-c:v','libx264','-preset','slow','-crf','25','-maxrate','2.3M','-bufsize','4.6M','-pix_fmt','yuv420p','-profile:v','high','-c:a','aac','-b:a','112k','-movflags','+faststart',mp+'.tmp.mp4']);os.rename(mp+'.tmp.mp4',mp)
    if not os.path.exists(f'{O}/bc-{k}.jpg'):subprocess.run(['ffmpeg','-v','error','-y','-ss','3.2','-i',mp,'-frames:v','1','-vf','scale=540:960','-q:v','4',f'{O}/bc-{k}.jpg'])
    if not os.path.exists(f'{O}/story-{k}.jpg'):subprocess.run(['ffmpeg','-v','error','-y','-i',st,'-q:v','6',f'{O}/story-{k}.jpg'])
    if k not in cands:
        sc=sorted(((sharp(mp,t),round(float(t),2)) for t in np.arange(3.2,D-0.6,0.5)),reverse=True);pick=[]
        for s,t in sc:
            if all(abs(t-p)>2.5 for p in pick):pick.append(t)
            if len(pick)==5:break
        pick.sort();cands[k]=pick
        for j,t in enumerate(pick):subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',mp,'-frames:v','1','-vf','scale=270:480','-q:v','4',f'{O}/cand-{k}-{j+1}.jpg'])
        json.dump(cands,open(O+'/cands.json','w'))
    print(c,round(D,1),round(time.time()-t0),flush=True)
