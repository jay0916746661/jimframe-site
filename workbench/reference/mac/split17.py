import json,subprocess,os,time,bisect
H=os.path.expanduser('~');F=H+'/mnt/Downloads/1017 bachatacrush.m4v';O=H+'/mnt/1017 bachata crush/JimFrame_成品/4K單支';os.makedirs(O,exist_ok=True);os.makedirs(H+'/g17',exist_ok=True)
j=json.load(open(H+'/cuts17.json'));c=[0.0]+j['cuts']+[459.0];kf=[float(x) for x in open(H+'/kf17/t.txt')]
t0=time.time()
for i,n in enumerate(j['names']):
    if time.time()-t0>150:break
    out=f'{O}/1017_{n}_4K.mp4'
    if not os.path.exists(out):
        k=kf[bisect.bisect_left(kf,c[i]+0.01)] if i else 0
        subprocess.run(['ffmpeg','-v','error','-y','-ss',f'{k:.3f}','-i',F,'-t',f'{c[i+1]-k:.3f}','-map','0:v:0','-map','0:a:0?','-c','copy','-avoid_negative_ts','make_zero','-movflags','+faststart',out+'.tmp.mp4']);os.rename(out+'.tmp.mp4',out)
    g=f'{H}/g17/{n}.mp4'
    if not os.path.exists(g):
        subprocess.run(['ffmpeg','-v','error','-y','-ss',f'{c[i]+0.05:.3f}','-i',F,'-t',f'{c[i+1]-c[i]-0.1:.3f}','-vf','scale=1080:1920:flags=lanczos','-c:v','libx264','-preset','fast','-crf','16','-c:a','aac','-b:a','192k',g+'.tmp.mp4']);os.rename(g+'.tmp.mp4',g)
    print(n,'ok',round(time.time()-t0),flush=True)
