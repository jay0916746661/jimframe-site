import sys,sherpa_onnx,soundfile as sf,numpy as np,librosa
M=sys.argv[1];f=sys.argv[2]
rec=sherpa_onnx.OfflineRecognizer.from_sense_voice(model=M+'/model.int8.onnx',tokens=M+'/tokens.txt',language='zh',use_itn=True)
x,sr=sf.read(f);x=x if x.ndim==1 else x[:,0]
if sr!=16000: x=librosa.resample(x,orig_sr=sr,target_sr=16000);sr=16000
s=rec.create_stream();s.accept_waveform(sr,x.astype(np.float32));rec.decode_stream(s)
r=s.result;print(r.text)
for t,ts in zip(r.tokens,r.timestamps): print('%.2f %s'%(ts,t),end=' | ')
