import subprocess,re,json,os
F=os.path.expanduser('~/mnt/Downloads/1017 bachatacrush.m4v')
names=['C0102','C0154','C0155','C0156','C0158','C0159','C0161','C0162','C0163']
dur=[47.05,52.555,26.53,65.57,20.525,70.07,29.03,95.6,52.555]
cuts=[];pos=0
for d in dur[:-1]:
    pred=pos+d;s=max(0,pred-1.5)
    out=subprocess.run(['ffmpeg','-v','info','-ss',f'{s:.3f}','-t','3','-i',F,'-an','-vf',"scale=96:-2,select='gt(scene,0.2)',showinfo",'-f','null','-'],capture_output=True,text=True).stderr
    h=[s+float(m.group(1)) for m in re.finditer(r'pts_time:([\d.]+)',out)]
    b=min(h,key=lambda x:abs(x-pred)) if h else pred
    cuts.append(round(b,3));pos=b;print(round(pred,2),[round(x,2) for x in h],'->',round(b,3),flush=True)
json.dump({'names':names,'cuts':cuts},open(os.path.expanduser('~/cuts17.json'),'w'))
