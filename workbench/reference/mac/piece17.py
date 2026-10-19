import json,subprocess,os,sys,time
H=os.path.expanduser('~');F=H+'/mnt/Downloads/1017 bachatacrush.m4v';os.makedirs(H+'/p17',exist_ok=True)
j=json.load(open(H+'/cuts17.json'));c=[0.0]+j['cuts']+[459.0]
jobs=[]
for i,n in enumerate(j['names']):
    s,e=c[i]+0.05,c[i+1]-0.05;k=0;t=s
    while t<e-0.01:
        jobs.append((n,k,t,min(25,e-t)));t+=25;k+=1
todo=[x for x in jobs if not os.path.exists(f'{H}/p17/{x[0]}_{x[1]:02d}.mp4')]
if sys.argv[1:]==['list']:print(len(jobs),len(todo));sys.exit()
w=int(sys.argv[1]);x=todo[w] if w<len(todo) else None
if x:
    n,k,t,d=x;o=f'{H}/p17/{n}_{k:02d}.mp4'
    subprocess.run(['ffmpeg','-v','error','-y','-ss',f'{t:.3f}','-i',F,'-t',f'{d:.3f}','-vf','scale=1080:1920:flags=lanczos','-c:v','libx264','-preset','ultrafast','-crf','14','-c:a','aac','-b:a','192k',o+'.tmp.mp4']);os.rename(o+'.tmp.mp4',o);print(n,k,'ok')
