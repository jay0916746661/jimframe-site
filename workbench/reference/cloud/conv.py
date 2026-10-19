import json,base64,sys,numpy as np,datetime
raw=json.load(open(sys.argv[1])); out=sys.argv[2]
mx=max((abs(v) for r in raw.values() for f in r['f'] for v in f),default=1)
div=round(127/mx,4)
faces,meta,hsh={},{},{}
for k in sorted(raw):
    r=raw[k]
    faces[k]=[base64.b64encode(np.clip(np.round(np.array(f)*div),-127,127).astype(np.int8).tobytes()).decode() for f in r['f']]
    meta[k]=r['m']; hsh[k]='%016x'%int(r['h'],2)
json.dump({'v':2,'model':'sface-int8','album':'1017-Bachata Crush','div':div,'built':'1200px, tinyFaceDetector inputSize 608 at 0,±20,±40,±60 degrees merged, detection score >=.45, minSize 32; meta=[minSide,score,angle]','faces':faces,'meta':meta,'hash':hsh},open(out,'w'),separators=(',',':'))
print(len(faces),sum(len(v) for v in faces.values()),div)
