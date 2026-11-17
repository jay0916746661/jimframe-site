import json,sys
SUB=sys.argv[1] if len(sys.argv)>1 else ''
t=open('index.tpl.html').read()
t=t.replace('__EPS__',open('eps.json').read())
if SUB:
  t=t.replace('__SUBSCRIBE__',SUB)
else:
  t=t.replace('__SUBSCRIBE__','https://www.instagram.com/jazz101tw/')
  t=t.replace('免費訂閱 →','訂閱即將開放・先追蹤 IG →').replace('訂閱收到全文 →','訂閱即將開放・先追蹤 IG →')
open('index.html','w').write(t)
