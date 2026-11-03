import re,json,difflib,opencc,numpy as np,soundfile as sf
from pypinyin import lazy_pinyin
cc=opencc.OpenCC('t2s')
eps=[e.strip() for e in open('爵士101_EP14-23_純口白.txt').read().split('\n\n') if e.strip()]
t=open('vo/asr.txt').read().split('\n',1)[1]
toks=[]
for x in t.split('|'):
    x=x.strip()
    if not x:continue
    a,_,b=x.partition(' ');toks.append((float(a),b.strip()))
def units(s):
    out=[]
    for i,c in enumerate(s):
        if re.match(r'[一-鿿]',c):out.append(lazy_pinyin(cc.convert(c))[0])
        elif re.match(r'[A-Za-z]',c):out.append(c.lower())
        elif re.match(r'[0-9]',c):out.append(c)
    return out
# ASR digits -> chinese pinyin approx: convert ASR text numbers to chinese reading
import cn2an
au=[]
for k,(tm,b) in enumerate(toks):
    nxt=toks[k+1][0] if k+1<len(toks) else tm+0.3
    if re.search(r'\d',b):
        try: b=cn2an.transform(b,'an2cn')
        except Exception: pass
    u=units(b)
    for j,p in enumerate(u):au.append((p,tm+(nxt-tm)*j/max(1,len(u))))
SU=[];SI=[]  # script units with (ep, clauseidx)
CL=[]
for ei,e in enumerate(eps):
    cls=[c for c in re.findall(r'[^，。：、？]+[，。：、？]?',e) if c.strip()]
    # sentence id per clause
    sid=0;rows=[]
    for c in cls:
        rows.append({'t':c.strip(),'s':sid})
        if c.endswith('。') or c.endswith('？'):sid+=1
    CL.append(rows)
    for ci,c in enumerate(rows):
        for p in units(c['t']):SU.append(p);SI.append((ei,ci))
sm=difflib.SequenceMatcher(None,SU,[p for p,_ in au],autojunk=False)
mt=[None]*len(SU)
for bl in sm.get_matching_blocks():
    for k in range(bl.size):mt[bl.a+k]=au[bl.b+k][1]
print('coverage',round(sum(x is not None for x in mt)/len(mt),3))
# clause start = first matched unit; interpolate missing
out=[]
for ei in range(len(eps)):
    for ci,c in enumerate(CL[ei]):
        ts=[mt[k] for k in range(len(SU)) if SI[k]==(ei,ci) and mt[k] is not None]
        c['abs']=min(ts) if ts else None
        c['end']=max(ts) if ts else None
# fill None by interpolation over flat list
flat=[c for r in CL for c in r]
for i,c in enumerate(flat):
    if c['abs'] is None:
        prv=next((flat[j]['abs'] for j in range(i-1,-1,-1) if flat[j]['abs'] is not None),0)
        nx=next((flat[j]['abs'] for j in range(i+1,len(flat)) if flat[j]['abs'] is not None),prv+2)
        c['abs']=(prv+nx)/2; print('fill',i,c['t'])
# monotonic
for i in range(1,len(flat)):
    if flat[i]['abs']<flat[i-1]['abs']: print('nonmono',i,flat[i]['t'],flat[i]['abs'],flat[i-1]['abs']); flat[i]['abs']=flat[i-1]['abs']+0.3
x,sr=sf.read('vo/a.wav')
dur_all=len(x)/sr
starts=[CL[e][0]['abs'] for e in range(len(eps))]
B=[max(0,s-0.25) for s in starts]+[dur_all]
# episode end: last clause end +0.6, trimmed by next start
res=[]
for ei in range(len(eps)):
    a0=B[ei]; lastend=max(c['end'] or c['abs'] for c in CL[ei]); a1=min(B[ei+1],lastend+0.7)
    rows=CL[ei]; ns=max(r['s'] for r in rows)+1
    sst=[round(min(r['abs'] for r in rows if r['s']==s)-a0,2) for s in range(ns)]
    sents=[''.join(r['t'] for r in rows if r['s']==s) for s in range(ns)]
    res.append({'ep':ei,'a0':round(a0,2),'a1':round(a1,2),'dur':round(a1-a0+1.6,2),'sents':sents,'sst':sst,'clauses':[{'t':r['t'],'s':r['s'],'st':round(r['abs']-a0,2)} for r in rows]})
    print(ei,round(a0,2),round(a1,2),round(a1-a0,1),ns,sst)
json.dump(res,open('align2.json','w'),ensure_ascii=False,indent=1)
json.dump(res,open('epd.json','w'),ensure_ascii=False)
open('epdata.js','w').write('var EPD='+json.dumps([{'dur':r['dur'],'sst':r['sst'],'clauses':[{'t':c['t'],'st':c['st']} for c in r['clauses']]} for r in res],ensure_ascii=False)+';')
