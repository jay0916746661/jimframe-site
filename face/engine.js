// JimFrame 靜態版人臉引擎（移植自 site-source/app/face-engine.ts）。
// face-api.js 找臉與 68 點特徵，SFace (int8, 128 維) 做辨識；全部在瀏覽器裡跑。
(function(){
const TEMPLATE=[[38.2946,51.6963],[73.5318,51.5014],[56.0252,71.7366],[41.5493,92.3655],[70.7299,92.2041]];
const mean=ps=>ps.reduce((s,p)=>({x:s.x+p.x/ps.length,y:s.y+p.y/ps.length}),{x:0,y:0});
const fivePoints=p=>[mean(p.slice(36,42)),mean(p.slice(42,48)),p[30],p[48],p[54]];
function similarityTransform(src){const n=src.length,sm=mean(src);const dm=TEMPLATE.reduce((s,[x,y])=>({x:s.x+x/n,y:s.y+y/n}),{x:0,y:0});let norm=0,a=0,b=0;src.forEach((p,i)=>{const ax=p.x-sm.x,ay=p.y-sm.y,bx=TEMPLATE[i][0]-dm.x,by=TEMPLATE[i][1]-dm.y;norm+=ax*ax+ay*ay;a+=ax*bx+ay*by;b+=ax*by-ay*bx;});a/=norm;b/=norm;return{a,b,tx:dm.x-(a*sm.x-b*sm.y),ty:dm.y-(b*sm.x+a*sm.y)};}
const cosine=(l,r)=>{if(l.length!==r.length||!l.length)return -1;let d=0;for(let i=0;i<l.length;i++)d+=l[i]*r[i];return d;};
const loadScript=(src,g)=>new Promise((res,rej)=>{if(window[g])return res();const s=document.createElement("script");s.src=src;s.async=true;s.onload=()=>res();s.onerror=()=>rej(new Error("FACE_SCRIPT_LOAD_FAILED "+src));document.head.appendChild(s);});
let loader=null;
function loadFaceEngine(base){
 if(loader)return loader;
 base=base||"face/";
 loader=(async()=>{
  await Promise.all([loadScript(base+"face-api/face-api.min.js","faceapi"),loadScript(base+"ort/ort.wasm.min.js","ort")]);
  const api=window.faceapi,ort=window.ort;
  ort.env.wasm.wasmPaths=new URL(base+"ort/",location.href).href;ort.env.wasm.numThreads=1;
  const weights=base+"face-api/weights";
  const [session]=await Promise.all([ort.InferenceSession.create(base+"face-api/sface_int8.onnx",{executionProviders:["wasm"],graphOptimizationLevel:"all"}),api.nets.tinyFaceDetector.loadFromUri(weights),api.nets.faceLandmark68Net.loadFromUri(weights)]);
  const canvas=document.createElement("canvas");canvas.width=112;canvas.height=112;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});const input=new Float32Array(3*112*112);
  const embed=async(image,landmarks)=>{const {a,b,tx,ty}=similarityTransform(fivePoints(landmarks));ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle="#000";ctx.fillRect(0,0,112,112);ctx.setTransform(a,b,-b,a,tx,ty);ctx.drawImage(image,0,0);const px=ctx.getImageData(0,0,112,112).data;for(let i=0,p=0;i<12544;i++,p+=4){input[i]=px[p];input[12544+i]=px[p+1];input[25088+i]=px[p+2];}const out=await session.run({[session.inputNames[0]]:new ort.Tensor("float32",input,[1,3,112,112])});const v=out[session.outputNames[0]].data;let len=0;for(const x of v)len+=x*x;len=Math.sqrt(len)||1;return Array.from(v,x=>Math.round(x/len*10000)/10000);};
  return{
   options:(inputSize,scoreThreshold)=>new api.TinyFaceDetectorOptions({inputSize,scoreThreshold}),
   embedFaces:async(image,opts,q)=>{const dets=await api.detectAllFaces(image,opts).withFaceLandmarks();const faces=[];for(const f of dets){const {x,y,width,height}=f.detection.box;if(f.detection.score<q.minScore||Math.min(width,height)<q.minSize)continue;faces.push({embedding:await embed(image,f.landmarks.positions),box:[x,y,width,height],score:f.detection.score});}return faces;}
  };
 })();
 loader.catch(()=>{loader=null;});
 return loader;
}
window.JimFace={loadFaceEngine,cosine,MATCH_STRONG:0.48,MATCH_LIKELY:0.35,MATCH_CANDIDATE:0.27};
})();
