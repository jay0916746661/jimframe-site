import re,json,difflib,opencc,cn2an
from pypinyin import lazy_pinyin
cc=opencc.OpenCC('t2s')
A=json.load(open('align2.json'))
def units(s):
    out=[]
    for c in s:
        if re.match(r'[一-鿿]',c):out.append(lazy_pinyin(cc.convert(c))[0])
        elif re.match(r'[A-Za-z]',c):out.append(c.lower())
    return out
res=[]
for ep in range(9):
    a=A[ep]; t=open(f'vo/asr{ep}.txt').read().split('\n',1)[1]
    toks=[]
    for x in t.split('|'):
        x=x.strip()
        if x:p,_,b=x.partition(' ');toks.append((float(p),b.strip()))
    au=[]
    for k,(tm,b) in enumerate(toks):
        nxt=toks[k+1][0] if k+1<len(toks) else tm+0.3
        if re.search(r'\d',b):
            try:b=cn2an.transform(b,'an2cn')
            except Exception:pass
        u=units(b)
        for j,p in enumerate(u):au.append((p,tm+min(0.3,(nxt-tm))*j/max(1,len(u))))
    su=[];sid=[]
    for ci,c in enumerate(a['clauses']):
        for p in units(c['t']):su.append(p);sid.append(ci)
    sm=difflib.SequenceMatcher(None,su,[p for p,_ in au],autojunk=False)
    mt=[None]*len(su)
    for bl in sm.get_matching_blocks():
        for k in range(bl.size):mt[bl.a+k]=au[bl.b+k][1]
    cov=sum(x is not None for x in mt)/len(mt)
    st=[];en=[]
    for ci in range(len(a['clauses'])):
        ts=[mt[k] for k in range(len(su)) if sid[k]==ci and mt[k] is not None]
        st.append(min(ts) if ts else None);en.append(max(ts) if ts else None)
    for i in range(len(st)):
        if st[i] is None:
            p=next((st[j] for j in range(i-1,-1,-1) if st[j] is not None),0);n=next((st[j] for j in range(i+1,len(st)) if st[j] is not None),p+2)
            st[i]=(p+n)/2
        if i and st[i]<=st[i-1]:st[i]=st[i-1]+0.2
    for c,s in zip(a['clauses'],st):c['st']=round(max(0,s-0.03),2)
    lastend=max(x for x in en if x is not None)
    a['sst']=[min(c['st'] for c in a['clauses'] if c['s']==s) for s in range(len(a['sents']))]
    a['sst'][0]=0
    a['a1']=round(a['a0']+lastend+0.32,2); a['dur']=round(lastend+0.32+1.8,2)
    print(ep,round(cov,2),a['dur'],[round(x,1) for x in a['sst']])
    res.append(a)
json.dump(res,open('align3.json','w'),ensure_ascii=False,indent=1)
open('epdata.js','w').write('var EPD='+json.dumps([{'dur':r['dur'],'sst':r['sst'],'clauses':[{'t':c['t'],'st':c['st']} for c in r['clauses']]} for r in res],ensure_ascii=False)+';')
