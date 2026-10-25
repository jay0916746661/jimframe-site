"use client";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { albumData, hiddenPhotoIds as hiddenPhotoIdList, lowExposurePhotoIds as lowExposurePhotoIdList, type Venue } from "./albums-data";
import { loadFaceEngine, photoScore, MATCH_STRONG, MATCH_LIKELY, MATCH_CANDIDATE } from "./face-engine";
import { CrushPromo, CrushVideos } from "./crush";

type Album = { date:string; venue:Venue; folder:string; images:string[] };
type Language = "zh" | "en" | "ko";
type StoryTemplate = "full" | "space" | "partner";
const translations={
 zh:{navFeatured:"精選",navAlbums:"相簿",navFind:"找自己",navSupport:"支持",navBook:"預約",navStudio:"限動工具",weekly:"每週精選 · Weekly Picks",heroTitle:"把舞動的夜晚留下",heroSub:"台北舞蹈與活動攝影。每次開啟換一批精選，點一下照片即可調色、下載或分享。",popular:"熱門照片",popularNote:"依累積開啟次數排序，可能包含同一裝置的重複開啟。",opens:"次開啟",finderTitle:"找自己與朋友的照片",finderSub:"上傳 1～3 張參考照，跨全部相簿搜尋",tip1:"自己或朋友",tip1Sub:"可混合搜尋一至兩人",tip2:"每人一張正面",tip2Sub:"臉部夠大、光線清楚",tip3:"接近活動造型",tip3Sub:"髮型、妝容越接近越好",selected:"已選",photos:"張",choose:"選擇照片",searching:"搜尋中",again:"再次搜尋",start:"開始搜尋",pending:"待檢查",exact:"原圖命中",strong:"較可能",likely:"可能符合",notMe:"不是我",shareStory:"分享到限動",privacy:"參考照片只在你的裝置上分析，不會上傳或保存；如使用朋友的照片，請先取得對方同意。結果會合併顯示，仍需由你確認。「不是我」只匿名記錄比對分數，用來校正門檻。",albums:"活動相簿",albumCount:"本相簿",searchDate:"搜尋日期，例如 08.31",all:"全部",noAlbums:"沒有符合的相簿。",showAll:"顯示全部相簿",creditTitle:"分享時請標記攝影師",creditText:"從拍攝、挑選到整理都需要時間，你的標記能讓攝影被看見，也讓我能繼續記錄舞池。",supportTitle:"支持下一場拍攝",supportSub:"器材、交通、拍攝與整理都需要成本。自願贊助，不影響瀏覽與下載。",coffee:"一杯咖啡",night:"支持一晚拍攝",custom:"自由金額",any:"隨意",supportNote:"加入 LINE 並告訴我想贊助，我會回傳 LINE Pay 收款資訊。",linePay:"用 LINE 索取付款資訊",igContact:"Instagram 聯絡",bookTitle:"預約拍攝",bookSub:"活動紀錄、舞蹈派對、個人寫真。私訊時附上日期、場地與需求。",igBook:"Instagram 私訊預約",shootType:"拍攝類型",types:"活動 · 舞蹈 · 人像",area:"地區",taipei:"台北",quick:"快速切換"},
 en:{navFeatured:"Featured",navAlbums:"Albums",navFind:"Find Me",navSupport:"Support",navBook:"Book",navStudio:"IG Studio",weekly:"WEEKLY PICKS",heroTitle:"Keep the night in motion",heroSub:"Dance and event photography in Taipei. Open the site for a fresh selection, then tap any photo to edit, download, or share.",popular:"Popular Photos",popularNote:"Ranked by total opens; repeat opens from the same device may be included.",opens:"opens",finderTitle:"Find photos of you and friends",finderSub:"Upload 1–3 reference photos to search every album",tip1:"You or friends",tip1Sub:"Search for one or two people",tip2:"One front photo each",tip2Sub:"Large, clear, well-lit faces",tip3:"Match event styling",tip3Sub:"Similar hair and makeup work best",selected:"Selected",photos:"photos",choose:"Choose Photos",searching:"Searching",again:"Search Again",start:"Start Search",pending:"Waiting",exact:"Exact photo",strong:"Strong match",likely:"Possible match",notMe:"Not me",shareStory:"Share to Story",privacy:"Reference photos are analyzed only on your device and are not uploaded or saved. Get your friends’ permission before using their photos. Combined results still need your confirmation. “Not me” anonymously records only the match score to improve the threshold.",albums:"Event Albums",albumCount:"albums",searchDate:"Search date, e.g. 08.31",all:"All",noAlbums:"No matching albums.",showAll:"Show All Albums",creditTitle:"Please tag the photographer",creditText:"Photographing, selecting, and editing take time. Your credit helps the work get seen and keeps more dance-floor moments documented.",supportTitle:"Support the Next Shoot",supportSub:"Gear, travel, shooting, and editing all have costs. Support is optional and never affects browsing or downloads.",coffee:"Buy a coffee",night:"Support one night",custom:"Custom amount",any:"Any",supportNote:"Add me on LINE and say you’d like to support the work. I’ll send the LINE Pay details.",linePay:"Get LINE Pay Details",igContact:"Contact on Instagram",bookTitle:"Book a Shoot",bookSub:"Events, dance parties, and portraits. Send the date, venue, and what you need.",igBook:"Book via Instagram DM",shootType:"Photography",types:"Events · Dance · Portraits",area:"Location",taipei:"Taipei",quick:"Quick navigation"},
 ko:{navFeatured:"추천",navAlbums:"앨범",navFind:"내 사진 찾기",navSupport:"후원",navBook:"예약",navStudio:"IG 스튜디오",weekly:"주간 추천 · WEEKLY PICKS",heroTitle:"춤추는 밤의 순간을 담다",heroSub:"타이베이 댄스 및 이벤트 사진. 사진을 눌러 색감을 조정하고 다운로드하거나 공유하세요.",popular:"인기 사진",popularNote:"누적 열람 횟수 기준이며 같은 기기의 반복 열람이 포함될 수 있습니다.",opens:"회 열람",finderTitle:"나와 친구의 사진 찾기",finderSub:"참고 사진 1~3장으로 모든 앨범 검색",tip1:"나 또는 친구",tip1Sub:"한두 명을 함께 검색 가능",tip2:"정면 사진 한 장씩",tip2Sub:"얼굴이 크고 밝고 선명하게",tip3:"행사 당시 스타일",tip3Sub:"비슷한 헤어와 메이크업 권장",selected:"선택됨",photos:"장",choose:"사진 선택",searching:"검색 중",again:"다시 검색",start:"검색 시작",pending:"검사 대기",exact:"원본 일치",strong:"일치 가능성 높음",likely:"일치 가능성 있음",notMe:"제가 아니에요",shareStory:"스토리 공유",privacy:"참고 사진은 기기에서만 분석되며 업로드하거나 저장하지 않습니다. 친구 사진은 먼저 동의를 받아 주세요. 결과는 합쳐서 표시되며 직접 확인해야 합니다. ‘제가 아니에요’ 피드백은 기준 조정을 위해 매칭 점수만 익명으로 기록합니다.",albums:"이벤트 앨범",albumCount:"개 앨범",searchDate:"날짜 검색 (예: 08.31)",all:"전체",noAlbums:"일치하는 앨범이 없습니다.",showAll:"전체 앨범 보기",creditTitle:"공유할 때 사진가를 태그해 주세요",creditText:"촬영부터 셀렉과 보정까지 많은 시간이 필요합니다. 태그는 작업을 알리고 더 많은 댄스 플로어를 기록하는 데 도움이 됩니다.",supportTitle:"다음 촬영 후원",supportSub:"장비, 교통, 촬영과 보정에는 비용이 듭니다. 후원은 선택 사항이며 열람과 다운로드에 영향을 주지 않습니다.",coffee:"커피 한 잔",night:"하룻밤 촬영 후원",custom:"자유 금액",any:"자유",supportNote:"LINE으로 후원 의사를 알려주시면 LINE Pay 정보를 보내드립니다.",linePay:"LINE Pay 정보 받기",igContact:"Instagram 문의",bookTitle:"촬영 예약",bookSub:"이벤트, 댄스 파티, 인물 촬영. 날짜, 장소와 요청 사항을 메시지로 보내 주세요.",igBook:"Instagram DM 예약",shootType:"촬영 유형",types:"이벤트 · 댄스 · 인물",area:"지역",taipei:"타이베이",quick:"빠른 이동"}
} as const;
type PopularPhoto = { id:string; focusSeconds:number; opens:number; viewers:number; favorites:number; shares:number; downloads:number; score:number };
type FaceDiagnostic = { label:string; status:"waiting"|"valid"|"warning"|"invalid"; detail:string };
type ColorGrade = "original" | "portra" | "classic-chrome" | "teal-orange" | "bw-silver";
type AdjustmentKey = "exposure" | "highlights" | "shadows" | "contrast" | "saturation" | "warmth";
type Adjustments = Record<AdjustmentKey,number>;
type SavedGradeSetting = {id:string;name:string;grade:ColorGrade;mix:number;adjustments:Adjustments;updatedAt:string};
type GradePresetFile = {format:"jimframe-color-presets";version:1;presets:SavedGradeSetting[]};
type FaceCacheRecord = {id:string;descriptors:number[][];imageHash:string;updatedAt:number};
type ZipEntry = {name:string;data:Uint8Array};
const zipCrcTable=Array.from({length:256},(_,index)=>{let value=index;for(let bit=0;bit<8;bit++)value=(value&1)?0xedb88320^(value>>>1):value>>>1;return value>>>0;});
const zipCrc32=(data:Uint8Array)=>{let crc=0xffffffff;for(const byte of data)crc=zipCrcTable[(crc^byte)&0xff]^(crc>>>8);return (crc^0xffffffff)>>>0;};
const zipPart=(size:number,write:(view:DataView)=>void)=>{const bytes=new Uint8Array(size);write(new DataView(bytes.buffer));return bytes;};
const makeStoredZip=(entries:ZipEntry[])=>{const encoder=new TextEncoder();const parts:BlobPart[]=[];const central:Uint8Array[]=[];let offset=0;for(const entry of entries){const name=encoder.encode(entry.name);const crc=zipCrc32(entry.data);const local=zipPart(30+name.length,view=>{view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(6,0x0800,true);view.setUint16(8,0,true);view.setUint32(14,crc,true);view.setUint32(18,entry.data.length,true);view.setUint32(22,entry.data.length,true);view.setUint16(26,name.length,true);new Uint8Array(view.buffer,30).set(name);});const directory=zipPart(46+name.length,view=>{view.setUint32(0,0x02014b50,true);view.setUint16(4,20,true);view.setUint16(6,20,true);view.setUint16(8,0x0800,true);view.setUint16(10,0,true);view.setUint32(16,crc,true);view.setUint32(20,entry.data.length,true);view.setUint32(24,entry.data.length,true);view.setUint16(28,name.length,true);view.setUint32(42,offset,true);new Uint8Array(view.buffer,46).set(name);});parts.push(local,entry.data);central.push(directory);offset+=local.length+entry.data.length;}const centralSize=central.reduce((sum,item)=>sum+item.length,0);const end=zipPart(22,view=>{view.setUint32(0,0x06054b50,true);view.setUint16(8,entries.length,true);view.setUint16(10,entries.length,true);view.setUint32(12,centralSize,true);view.setUint32(16,offset,true);});return new Blob([...parts,...central,end],{type:"application/zip"});};
// v5: SFace embeddings. Older caches hold face-api descriptors and must not be mixed in.
const FACE_CACHE_DB="jimframe-face-cache-v5";
const openFaceCache=()=>new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open(FACE_CACHE_DB,1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains("photos"))request.result.createObjectStore("photos",{keyPath:"id"});};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
const readFaceCache=async()=>{const db=await openFaceCache();return new Promise<Map<string,FaceCacheRecord>>((resolve,reject)=>{const request=db.transaction("photos","readonly").objectStore("photos").getAll();request.onsuccess=()=>{const records=request.result as FaceCacheRecord[];resolve(new Map(records.map(item=>[item.id,item])));db.close();};request.onerror=()=>{reject(request.error);db.close();};});};
const writeFaceCache=async(record:FaceCacheRecord)=>{const db=await openFaceCache();return new Promise<void>((resolve,reject)=>{const transaction=db.transaction("photos","readwrite");transaction.objectStore("photos").put(record);transaction.oncomplete=()=>{resolve();db.close();};transaction.onerror=()=>{reject(transaction.error);db.close();};});};
const saveSharedFaceIndex=async(items:Array<FaceCacheRecord&{albumKey:string}>)=>{if(!items.length)return;await fetch("/api/face-index",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({model:"sface-1",items})});};
const searchSharedFaceIndex=async(queryDescriptors:number[][],queryHashes:string[])=>{const response=await fetch("/api/face-index",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({model:"sface-1",queryDescriptors,queryHashes})});if(!response.ok)return {matches:[] as FaceMatch[],indexed:0};return response.json() as Promise<{matches:FaceMatch[];indexed:number}>;};
// One colour pipeline for both the on-screen preview and the downloaded file,
// so what people see is exactly what they get.
const hasColorEdits=(grade:ColorGrade,adjustments:Adjustments)=>grade!=="original"||Object.values(adjustments).some(value=>value!==0);
const applyColorGrade=(data:Uint8ClampedArray,grade:ColorGrade,filterMix:number,adjustments:Adjustments)=>{
    const clamp=(value:number)=>Math.max(0,Math.min(255,value));
    for(let i=0;i<data.length;i+=4){
     let r=data[i],g=data[i+1],b=data[i+2];
     const originalR=r,originalG=g,originalB=b;
     const l=.2126*r+.7152*g+.0722*b;
     if(grade==="bw-silver"){
      const mono=clamp((l-128)*1.48+132);r=mono;g=mono;b=mono;
     }else if(grade==="portra"){
      r=(r-128)*.86+150;g=(g-128)*.88+136;b=(b-128)*.86+112;
      const filmL=.2126*r+.7152*g+.0722*b;r=filmL+(r-filmL)*.78;g=filmL+(g-filmL)*.78;b=filmL+(b-filmL)*.78;
     }else if(grade==="classic-chrome"){
      r=(r-128)*1.25+118;g=(g-128)*1.2+128;b=(b-128)*1.26+142;
      const filmL=.2126*r+.7152*g+.0722*b;r=filmL+(r-filmL)*.5;g=filmL+(g-filmL)*.5;b=filmL+(b-filmL)*.5;
     }else if(grade==="teal-orange"){
      const shadow=1-l/255,highlight=l/255;
      r=(r-128)*1.22+128+42*highlight-28*shadow;
      g=(g-128)*1.14+128+10*highlight+18*shadow;
      b=(b-128)*1.24+128-32*highlight+42*shadow;
     }
     const mix=grade==="original"?0:filterMix/100;
     r=originalR+(r-originalR)*mix;g=originalG+(g-originalG)*mix;b=originalB+(b-originalB)*mix;
     const adjustedL=.2126*r+.7152*g+.0722*b;
     const exposureFactor=Math.pow(2,adjustments.exposure/100);
     r*=exposureFactor;g*=exposureFactor;b*=exposureFactor;
     const highlightWeight=Math.pow(adjustedL/255,2),shadowWeight=Math.pow(1-adjustedL/255,2);
     const tonalShift=adjustments.highlights*.62*highlightWeight+adjustments.shadows*.62*shadowWeight;
     r+=tonalShift;g+=tonalShift;b+=tonalShift;
     const contrastFactor=1+adjustments.contrast/100;
     r=(r-128)*contrastFactor+128;g=(g-128)*contrastFactor+128;b=(b-128)*contrastFactor+128;
     const postL=.2126*r+.7152*g+.0722*b,saturationFactor=1+adjustments.saturation/100;
     r=postL+(r-postL)*saturationFactor;g=postL+(g-postL)*saturationFactor;b=postL+(b-postL)*saturationFactor;
     r+=adjustments.warmth*.18;b-=adjustments.warmth*.18;
     data[i]=clamp(r);data[i+1]=clamp(g);data[i+2]=clamp(b);
    }
};
const defaultAdjustments:Adjustments={exposure:0,highlights:0,shadows:0,contrast:0,saturation:0,warmth:0};
const adjustmentLabels:{id:AdjustmentKey;label:string;min:number;max:number}[]=[
 {id:"exposure",label:"曝光",min:-100,max:100},{id:"highlights",label:"亮部",min:-100,max:100},{id:"shadows",label:"暗部",min:-100,max:100},
 {id:"contrast",label:"對比",min:-100,max:100},{id:"saturation",label:"飽和度",min:-100,max:100},{id:"warmth",label:"色溫",min:-100,max:100}
];
const colorGrades:{id:ColorGrade;label:string;file:string;preview:{contrast:number;saturation:number;sepia:number;hue:number;brightness:number;grayscale:number}}[] = [
 {id:"original",label:"原色",file:"original",preview:{contrast:1,saturation:1,sepia:0,hue:0,brightness:1,grayscale:0}},
 {id:"portra",label:"人像暖調",file:"portra",preview:{contrast:.86,saturation:.78,sepia:.26,hue:-10,brightness:1.06,grayscale:0}},
 {id:"classic-chrome",label:"紀實低彩",file:"classic-chrome",preview:{contrast:1.25,saturation:.5,sepia:.06,hue:12,brightness:.96,grayscale:0}},
 {id:"teal-orange",label:"電影青橙",file:"teal-orange",preview:{contrast:1.28,saturation:1.38,sepia:.08,hue:-18,brightness:.97,grayscale:0}},
 {id:"bw-silver",label:"黑白銀鹽",file:"bw-silver",preview:{contrast:1.48,saturation:0,sepia:.04,hue:0,brightness:1.01,grayscale:1}}
];
const hiddenPhotoIds=new Set(hiddenPhotoIdList);
const lowExposurePhotoIds=new Set(lowExposurePhotoIdList);
// Albums come from ./albums-data.ts and are always shown newest first.
const freshAlbums:Album[]=albumData.filter(album=>!album.hidden).map(({date,venue,folder,images})=>({date,venue,folder,images:images.filter(id=>!hiddenPhotoIds.has(id))})).sort((a,b)=>b.date.localeCompare(a.date));
const shuffle=<T,>(items:readonly T[])=>{const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;};
// Low-exposure photos stay discoverable inside their event album, but are kept
// out of every automatic promotional surface.
const freshPool=freshAlbums.flatMap(a=>a.images.filter(id=>!lowExposurePhotoIds.has(id)).map(id=>({id,date:a.date,venue:a.venue,folder:a.folder})));
const initialWeeklyPicks=freshPool.slice(0,10);
const initialHeroWall=initialWeeklyPicks.map(p=>p.id);
const autoFeatured=(ranked:PopularPhoto[],excluded:ReadonlySet<string>=lowExposurePhotoIds)=>{
 const known=new Map(freshPool.filter(photo=>!excluded.has(photo.id)).map(photo=>[photo.id,photo]));
 const eligible=ranked.filter(item=>known.has(item.id));
 const selected:string[]=[];const albumCounts=new Map<string,number>();
 for(const limit of [1,2]){
  for(const item of eligible){
   if(selected.includes(item.id))continue;
   const photo=known.get(item.id)!;const key=`${photo.date}-${photo.venue}`;
   if((albumCounts.get(key)??0)>=limit)continue;
   selected.push(item.id);albumCounts.set(key,(albumCounts.get(key)??0)+1);
   if(selected.length===10)return selected;
  }
 }
 for(const photo of freshPool){
  if(excluded.has(photo.id))continue;
  if(!selected.includes(photo.id))selected.push(photo.id);
  if(selected.length===10)break;
 }
 return selected;
};
const image=(id:string,size=1200)=>`https://drive.google.com/thumbnail?id=${id}&sz=w${size}`;
// The Odoro folder was photographed on 08/29; keep its original internal
// key so historical click records remain connected, while correcting display text.
const dateLabel=(d:string)=>d==="0830"?"08.29":`${d.slice(0,2)}.${d.slice(2)}`;
type FaceMatch={id:string;distance:number;albumKey:string;exact?:boolean};
// Search scores are stored as distance = 1 - cosine similarity (lower is better).
const STRONG_DISTANCE=1-MATCH_STRONG;
const LIKELY_DISTANCE=1-MATCH_LIKELY;
const CANDIDATE_DISTANCE=1-MATCH_CANDIDATE;
const blobImage=(blob:Blob)=>new Promise<HTMLImageElement>((resolve,reject)=>{const url=URL.createObjectURL(blob);const photo=new Image();photo.onload=()=>{URL.revokeObjectURL(url);resolve(photo);};photo.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Image decode failed"));};photo.src=url;});
const imageFingerprint=(photo:HTMLImageElement)=>{const canvas=document.createElement("canvas");canvas.width=9;canvas.height=8;const context=canvas.getContext("2d",{willReadFrequently:true});if(!context)return "";context.drawImage(photo,0,0,9,8);const pixels=context.getImageData(0,0,9,8).data;let hash="";for(let y=0;y<8;y++)for(let x=0;x<8;x++){const left=(pixels[(y*9+x)*4]*3+pixels[(y*9+x)*4+1]*6+pixels[(y*9+x)*4+2])/10;const right=(pixels[(y*9+x+1)*4]*3+pixels[(y*9+x+1)*4+1]*6+pixels[(y*9+x+1)*4+2])/10;hash+=left>right?"1":"0";}return hash;};
const fingerprintDistance=(left:string,right:string)=>{if(!left||left.length!==right.length)return 64;let distance=0;for(let i=0;i<left.length;i++)if(left[i]!==right[i])distance++;return distance;};

// Line icons drawn in the spirit of SF Symbols (24px grid, 1.8 stroke).
const iconPaths:Record<string,string>={
 heart:"M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z",
 heartFill:"M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z",
 download:"M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14",
 share:"M12 3.5v11M12 3.5 8 7.5m4-4 4 4M7.5 10.5H6a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5h-1.5",
 faceSearch:"M10.5 17.5a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm5-2 5 5M8 9h.01M13 9h.01M8 12.5c1.4 1.3 3.6 1.3 5 0",
 chevron:"m9.5 5.5 6.5 6.5-6.5 6.5",
 back:"M14.5 5.5 8 12l6.5 6.5",
 photo:"M4.5 5.5h15a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Zm0 10 4.5-4.5 4 4 2.5-2.5 5 5M15.5 9.5h.01",
 search:"M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm4.7-1.8 4.3 4.3",
 tag:"M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1 1 0 0 1 0 1.4l-7.1 7.1a1 1 0 0 1-1.4 0l-8.5-8.1ZM8 8h.01",
 message:"M4.5 5.5h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4.5 3.5v-3.5h-1a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z",
 camera:"M4 8h3l1.8-2.5h6.4L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm8 8.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
 pin:"M12 21s6.5-5.8 6.5-11a6.5 6.5 0 0 0-13 0c0 5.2 6.5 11 6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
 star:"m12 3.8 2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8L12 3.8Z",
 albums:"M7 3.5h10M5.5 6.5h13M4.5 9.5h15a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z",
 sliders:"M5 7h9m4 0h1M5 12h3m4 0h7M5 17h11m4 0h-1M16 5v4M10 10v4M18 15v4",
 close:"M7 7l10 10M17 7 7 17",
 check:"m6.5 12.5 3.5 3.5 7.5-8",
 external:"M14 4.5h5.5V10M19.5 4.5 11 13M17 14v4.5a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1H10",
};
function Icon({name}:{name:string}){
 return <svg className="icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d={iconPaths[name]??""} fill={name==="heartFill"?"currentColor":"none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
export default function Home(){
 const [language,setLanguage]=useState<Language>("zh");
 const copy=translations[language];
 const finderBatchCopy=language==="en"?{selectAll:"Select all",clear:"Clear",selected:"selected",download:"Download selected",working:"Preparing download…",limit:"Up to 20 photos at a time"}:language==="ko"?{selectAll:"전체 선택",clear:"선택 해제",selected:"장 선택",download:"선택 사진 다운로드",working:"다운로드 준비 중…",limit:"한 번에 최대 20장"}:{selectAll:"全部選取",clear:"清除",selected:"張已選",download:"下載已選照片",working:"正在準備下載…",limit:"一次最多 20 張"};
 const [filter,setFilter]=useState<"全部"|Venue>("全部");
 const [dateQuery,setDateQuery]=useState("");
 const [finderOpen,setFinderOpen]=useState(false);
 const [faceFiles,setFaceFiles]=useState<File[]>([]);
 const [facePreviews,setFacePreviews]=useState<string[]>([]);
 const [faceDiagnostics,setFaceDiagnostics]=useState<FaceDiagnostic[]>([]);
 const [faceMatches,setFaceMatches]=useState<FaceMatch[]>([]);
 const [rejectedFaceMatches,setRejectedFaceMatches]=useState<Set<string>>(new Set());
 const [selectedFaceMatches,setSelectedFaceMatches]=useState<Set<string>>(new Set());
 const [faceDownloadStatus,setFaceDownloadStatus]=useState("");
 const [faceDownloadWorking,setFaceDownloadWorking]=useState(false);
 const [faceFeedbackStatus,setFaceFeedbackStatus]=useState("");
 const [faceStatus,setFaceStatus]=useState("可上傳自己或同行朋友的照片，一次搜尋一至兩人；每人至少準備一張清楚正面照。");
 const [faceProgress,setFaceProgress]=useState(0);
 const [faceSearching,setFaceSearching]=useState(false);
 const [storyPhotoId,setStoryPhotoId]=useState<string|null>(null);
 const [storyTemplate,setStoryTemplate]=useState<StoryTemplate>("full");
 const [storyWorking,setStoryWorking]=useState(false);
 const [activeHero,setActiveHero]=useState<number|null>(null);
 const [sessionAlbums,setSessionAlbums]=useState(freshAlbums);
 const [sessionHero,setSessionHero]=useState(initialHeroWall);
 const [popularPhotos,setPopularPhotos]=useState<PopularPhoto[]>([]);
 const [homeExcludedIds,setHomeExcludedIds]=useState<Set<string>>(()=>new Set(lowExposurePhotoIds));
 const [likedPhotos,setLikedPhotos]=useState<Set<string>>(new Set());
 const [activeGrade,setActiveGrade]=useState<ColorGrade>("original");
 const [filterMix,setFilterMix]=useState(100);
 const [showOriginal,setShowOriginal]=useState(false);
 const [adjustments,setAdjustments]=useState<Adjustments>(defaultAdjustments);
 const [isGenerating,setIsGenerating]=useState(false);
 const [selectedAlbum,setSelectedAlbum]=useState<Album|null>(null);
 const [albumLoading,setAlbumLoading]=useState(false);
 const albumLoadToken=useRef(0);
 const [activeAlbumPhoto,setActiveAlbumPhoto]=useState<string|null>(null);
 const [savedGradeSettings,setSavedGradeSettings]=useState<SavedGradeSetting[]>([]);
 const [presetName,setPresetName]=useState("");
 const presetFileInput=useRef<HTMLInputElement|null>(null);
 const [batchMode,setBatchMode]=useState(false);
 const [selectedPhotos,setSelectedPhotos]=useState<Set<string>>(new Set());
 const [batchStatus,setBatchStatus]=useState("");
 const [isBatchWorking,setIsBatchWorking]=useState(false);
 const photoSessionId=useRef<string|null>(null);
 const [editing,setEditing]=useState(false);
 const [editTab,setEditTab]=useState<"filters"|"adjust">("filters");
 const touchStart=useRef<number|null>(null);
 const storyCopy=language==="en"?{title:"Make an Instagram Story",sub:"Choose a layout. We’ll format it as 1080 × 1920.",full:"Full Photo",space:"Tag Space",partner:"Dance Partner",fullNote:"A clean full-screen photo",spaceNote:"Room for tags and a link sticker",partnerNote:"Invite your partner to repost",hint:"After opening Instagram, tag your dance partner and @jimframe.",share:"Share to Story",download:"Save Story Image",close:"Cancel",partnerLine:"Tonight’s dance with ______",credit:"Photo by @jimframe"}:language==="ko"?{title:"Instagram 스토리 만들기",sub:"레이아웃을 선택하면 1080 × 1920으로 제작합니다.",full:"사진 전체",space:"태그 공간",partner:"댄스 파트너",fullNote:"사진을 크게 보여주는 깔끔한 구성",spaceNote:"태그와 링크 스티커 공간",partnerNote:"파트너의 재공유를 유도하는 구성",hint:"Instagram에서 댄스 파트너와 @jimframe을 태그해 주세요.",share:"스토리 공유",download:"스토리 이미지 저장",close:"취소",partnerLine:"Tonight’s dance with ______",credit:"Photo by @jimframe"}:{title:"做成 Instagram 限動",sub:"選一個版型，系統會排成 1080 × 1920。",full:"滿版照片",space:"留白標記版",partner:"舞伴分享版",fullNote:"照片最大、最適合直接分享",spaceNote:"預留舞伴標記與連結貼紙空間",partnerNote:"邀請舞伴轉發，讓一張照片被兩人看見",hint:"開啟 Instagram 後，記得標記舞伴與 @jimframe。",share:"分享到限動",download:"儲存限動圖片",close:"取消",partnerLine:"今晚和 ______ 的一支舞",credit:"Photo by @jimframe"};
 const studioIntro=language==="en"?{eyebrow:"INSTAGRAM STORY STUDIO",title:"Turn a photo into a Story in 30 seconds",sub:"No cropping or layout work. Choose a photo and style, then get a ready-to-post 9:16 Story.",steps:["Choose a photo","Pick a style","Save or share"],partner:"Space to tag your dance partner",credit:"Photo credit @jimframe included",button:"Open Story Studio",note:"Full photo · Magazine · Lifestyle · Seasonal"}:language==="ko"?{eyebrow:"INSTAGRAM STORY STUDIO",title:"30초 만에 사진을 스토리로",sub:"자르거나 편집할 필요 없이 사진과 스타일을 고르면 9:16 스토리가 완성됩니다.",steps:["사진 선택","스타일 선택","저장 또는 공유"],partner:"댄스 파트너 태그 공간",credit:"@jimframe 크레딧 자동 표시",button:"스토리 도구 열기",note:"전체 사진 · 매거진 · 라이프스타일 · 시즌"}:{eyebrow:"INSTAGRAM 限動工具",title:"找到照片，30 秒做成限時動態",sub:"不用裁切，也不用自己排版。選一張照片與風格，就能產生可直接發布的 9:16 限動圖。",steps:["選照片","挑風格","下載或分享"],partner:"預留舞伴標記位置",credit:"自動加入 @jimframe 攝影標記",button:"立即製作限動",note:"滿版・雜誌感・生活感・節日感"};
 useEffect(()=>{const saved=window.localStorage.getItem("jimframe-language");if(saved==="zh"||saved==="en"||saved==="ko")setLanguage(saved);else if(navigator.language.toLowerCase().startsWith("ko"))setLanguage("ko");else if(navigator.language.toLowerCase().startsWith("en"))setLanguage("en");},[]);
 useEffect(()=>{document.documentElement.lang=language==="zh"?"zh-Hant":language;window.localStorage.setItem("jimframe-language",language);},[language]);
 const visible=useMemo(()=>{
  const normalized=dateQuery.replace(/\D/g,"");
  return sessionAlbums.filter(a=>(filter==="全部"||a.venue===filter)&&(!normalized||a.date.includes(normalized)));
 },[dateQuery,filter,sessionAlbums]);
 const resetFinder=()=>{setFilter("全部");setDateQuery("");};
 const chooseFacePhoto=(event:ChangeEvent<HTMLInputElement>)=>{const files=Array.from(event.target.files??[]).slice(0,3);facePreviews.forEach(url=>URL.revokeObjectURL(url));setFaceFiles(files);setFacePreviews(files.map(file=>URL.createObjectURL(file)));setFaceDiagnostics(files.map((_,index)=>({label:`照片 ${index+1}`,status:"waiting",detail:"待檢查"})));setFaceMatches([]);setRejectedFaceMatches(new Set());setSelectedFaceMatches(new Set());setFaceDownloadStatus("");setFaceFeedbackStatus("");setFaceProgress(0);setFaceStatus(files.length?`已選擇 ${files.length} 張參考照；可混合自己與同行朋友，結果會合併顯示。`:"可搜尋自己，也可加入同行朋友；建議每人至少放一張近距離正面照。");};
 const runFaceSearch=async()=>{
  if(!faceFiles.length||faceSearching)return;
  setFaceSearching(true);setFaceMatches([]);setSelectedFaceMatches(new Set());setFaceDownloadStatus("");setFaceProgress(0);setFaceStatus("第一次使用正在載入臉部辨識模型（約 12MB），之後會快很多…");
  try{
   const engine=await loadFaceEngine();
   const queryOptions=engine.options(608,.3);
   const quickOptions=engine.options(416,.3);
   const preciseOptions=engine.options(608,.3);
   const queries:number[][]=[];const queryHashes:string[]=[];
   const detectedByPhoto:Array<Array<{embedding:number[];width:number;height:number;score:number}>>=[];
   for(let index=0;index<faceFiles.length;index++){
    try{
     const queryImage=await blobImage(faceFiles[index]);
     queryHashes.push(imageFingerprint(queryImage));
     const detectedQueries=(await engine.embedFaces(queryImage,queryOptions,{minScore:.5,minSize:48})).sort((a,b)=>b.width*b.height-a.width*a.height);
     const query=detectedQueries[0];
     const setDiagnostic=(status:FaceDiagnostic["status"],detail:string)=>setFaceDiagnostics(current=>current.map((item,itemIndex)=>itemIndex===index?{...item,status,detail}:item));
     if(!query){setDiagnostic("invalid","找不到清楚的臉");detectedByPhoto.push([]);}
     else{
      const faceIsSmall=query.width<110;
      const hasSeveralFaces=Boolean(detectedQueries[1]&&detectedQueries[1].width*detectedQueries[1].height>query.width*query.height*.3);
      setDiagnostic(faceIsSmall||hasSeveralFaces?"warning":"valid",hasSeveralFaces?"偵測到多人，會和其他照片交叉確認":faceIsSmall?"臉偏小，仍會使用":"品質良好");
      detectedByPhoto.push(detectedQueries);
     }
    }catch{detectedByPhoto.push([]);setFaceDiagnostics(current=>current.map((item,itemIndex)=>itemIndex===index?{...item,status:"invalid",detail:"無法讀取"}:item));}
   }
   // Pick the face that is most consistent across the supplied photos. This
   // lets a clear selfie identify the same person inside a group/event photo.
   const dot=(left:number[],right:number[])=>left.reduce((sum,value,index)=>sum+value*right[index],0);
   for(let photoIndex=0;photoIndex<detectedByPhoto.length;photoIndex++){
    const faces=detectedByPhoto[photoIndex];if(!faces.length)continue;
    let selected=faces[0];
    if(faces.length>1&&detectedByPhoto.some((other,index)=>index!==photoIndex&&other.length)){
     selected=[...faces].sort((left,right)=>{
      const consistency=(face:typeof left)=>detectedByPhoto.reduce((sum,other,index)=>index===photoIndex||!other.length?sum:sum+Math.max(...other.map(candidate=>dot(face.embedding,candidate.embedding))),0);
      return consistency(right)-consistency(left);
     })[0];
    }
    queries.push(selected.embedding);
   }
   if(!queryHashes.length){setFaceStatus("參考照片無法讀取，請改用 JPG、PNG 或 WebP 照片。");return;}
   setFaceStatus(queries.length?`已讀取 ${queries.length} 張有效人臉，正在讀取全站共用索引…`:"沒有辨識到臉，將先用原圖指紋搜尋全部相簿…");
   const searchAlbums=freshAlbums.map(album=>({...album,images:[...album.images]}));let albumCursor=0;let indexedAlbums=0;
   const albumWorker=async()=>{while(albumCursor<searchAlbums.length){const index=albumCursor++;const album=searchAlbums[index];try{if(album.images.length<40){const response=await fetch(`/api/folder-photos?folder=${encodeURIComponent(album.folder)}`);if(response.ok){const payload=await response.json() as {images?:unknown};if(Array.isArray(payload.images)){const loaded=payload.images.filter((id):id is string=>typeof id==="string");album.images=[...new Set([...loaded,...album.images])];}}}}catch{}finally{indexedAlbums++;if(indexedAlbums%5===0||indexedAlbums===searchAlbums.length)setFaceStatus(`正在補齊全站相簿 ${indexedAlbums} / ${searchAlbums.length}…`);}}};
   await Promise.all(Array.from({length:Math.min(5,searchAlbums.length)},()=>albumWorker()));
   const seen=new Set<string>();const candidates=searchAlbums.flatMap(album=>album.images.filter(id=>!hiddenPhotoIds.has(id)&&!seen.has(id)&&seen.add(id)).map(id=>({id,albumKey:`${album.date}-${album.venue}`})));
   let cache=new Map<string,FaceCacheRecord>();try{cache=await readFaceCache();}catch{}
   const shared=await searchSharedFaceIndex(queries.map(query=>Array.from(query)),queryHashes).catch(()=>({matches:[] as FaceMatch[],indexed:0}));
   const matches:FaceMatch[]=[...shared.matches];let cursor=0;let completed=0;let cacheHits=0;let previewOk=0;let previewFailed=0;
   const fetchFacePreview=async(id:string,width=900)=>{for(let attempt=0;attempt<2;attempt++){try{const response=await fetch(`/api/face-preview?id=${encodeURIComponent(id)}&w=${width}&retry=${attempt}`,{cache:"no-store"});if(response.ok)return response;}catch{}}return null;};
   const distanceToQueries=(descriptors:number[][])=>{const score=photoScore(queries,descriptors);return score<0?Number.POSITIVE_INFINITY:1-score;};
   const sortMatches=(items:FaceMatch[])=>items.sort((a,b)=>Number(Boolean(b.exact))-Number(Boolean(a.exact))||a.distance-b.distance);
   // Candidate-level hits are useful for the second, precise pass, but are not
   // reliable enough to show to visitors. Only expose likely-or-better results.
   const publishMatches=()=>setFaceMatches(sortMatches([...new Map(matches.map(item=>[item.id,item])).values()].filter(item=>item.exact||item.distance<LIKELY_DISTANCE)).slice(0,24));
   const indexedMatches=()=>{for(const {id,albumKey} of candidates){const stored=cache.get(id);if(!stored)continue;const visualDistance=Math.min(...queryHashes.map(hash=>fingerprintDistance(hash,stored.imageHash)));if(visualDistance<=5){matches.push({id,distance:visualDistance/100,albumKey,exact:true});continue;}if(stored.descriptors.length){const distance=distanceToQueries(stored.descriptors);if(distance<CANDIDATE_DISTANCE)matches.push({id,distance,albumKey});}}publishMatches();};
   indexedMatches();
   if(matches.length)setFaceStatus(`共用索引已先找到 ${Math.min(matches.length,24)} 張，正在背景補齊尚未索引的照片…`);else setFaceStatus(`已讀取 ${shared.indexed} 張共用索引，正在補齊尚未索引的照片…`);
   const pendingShared:Array<FaceCacheRecord&{albumKey:string}>=[];const flushShared=async()=>{if(!pendingShared.length)return;const batch=pendingShared.splice(0,40);try{await saveSharedFaceIndex(batch);}catch{pendingShared.unshift(...batch);}};
   const worker=async()=>{
    while(cursor<candidates.length){
     const current=cursor++;const {id,albumKey}=candidates[current];
     try{
      let stored=cache.get(id);
      if(stored?.imageHash){cacheHits++;pendingShared.push({...stored,albumKey});if(pendingShared.length>=20)void flushShared();continue;}
      else{
       const response=await fetchFacePreview(id);if(!response){previewFailed++;continue;}
       let candidate:HTMLImageElement;try{candidate=await blobImage(await response.blob());previewOk++;}catch{previewFailed++;continue;}
       const faces=await engine.embedFaces(candidate,quickOptions,{minScore:.4,minSize:32});stored={id,descriptors:faces.map(face=>face.embedding),imageHash:imageFingerprint(candidate),updatedAt:Date.now()};cache.set(id,stored);void writeFaceCache(stored).catch(()=>{});pendingShared.push({...stored,albumKey});if(pendingShared.length>=20)void flushShared();
      }
      const visualDistance=Math.min(...queryHashes.map(hash=>fingerprintDistance(hash,stored.imageHash)));
      if(visualDistance<=5){matches.push({id,distance:visualDistance/100,albumKey,exact:true});publishMatches();continue;}
      if(!stored.descriptors.length)continue;const distance=distanceToQueries(stored.descriptors);
      if(distance<CANDIDATE_DISTANCE){matches.push({id,distance,albumKey});publishMatches();}
     }catch{}finally{
      completed++;
      // Do not abort after the first unavailable Drive thumbnails. Album files
      // are not ordered by availability and later photos may still be readable.
      if(completed===candidates.length||completed%12===0){setFaceProgress(Math.round((completed/candidates.length)*82));setFaceStatus(`快速搜尋 ${completed} / ${candidates.length}${cacheHits?` · 快取 ${cacheHits} 張`:""}${matches.length?` · 已先找到 ${Math.min(matches.length,24)} 張`:""}…`);}
     }
    }
   };
   await Promise.all(Array.from({length:Math.min(4,candidates.length)},()=>worker()));
   await flushShared();
   if(!previewOk&&previewFailed===candidates.length&&!cacheHits&&!matches.length){setFaceProgress(100);setFaceStatus("活動照片伺服器目前全部讀取失敗，因此無法比對。請稍後再試，或通知攝影師檢查相簿分享權限。");return;}
   const shortlist=[...matches].sort((a,b)=>a.distance-b.distance).slice(0,48);let preciseCursor=0;const verified:FaceMatch[]=[];
   setFaceStatus(`快速搜尋完成，正在精準確認 ${shortlist.length} 張候選照片…`);setFaceProgress(84);
   const preciseWorker=async()=>{while(preciseCursor<shortlist.length){const current=preciseCursor++;const match=shortlist[current];try{if(match.exact){verified.push(match);continue;}const response=await fetchFacePreview(match.id,1600);if(!response)continue;const candidate=await blobImage(await response.blob());const faces=await engine.embedFaces(candidate,preciseOptions,{minScore:.4,minSize:48});if(!faces.length)continue;const distance=distanceToQueries(faces.map(face=>face.embedding));if(distance<LIKELY_DISTANCE)verified.push({...match,distance});}catch{}finally{setFaceProgress(84+Math.round(((current+1)/Math.max(1,shortlist.length))*16));if(verified.length)setFaceMatches(sortMatches([...verified]).slice(0,24));}}};
   await Promise.all(Array.from({length:Math.min(4,shortlist.length)},()=>preciseWorker()));
   const finalMatches=sortMatches([...verified]);setFaceMatches(finalMatches.slice(0,24));setFaceProgress(100);const exactCount=finalMatches.filter(match=>match.exact).length;setFaceStatus(exactCount?`搜尋完成，已直接找到 ${exactCount} 張相同或近似原圖，並一併列出高相似人臉結果。`:finalMatches.length?`搜尋完成，${queries.length} 張參考照綜合找到 ${Math.min(finalMatches.length,24)} 張高相似結果；下次在同一裝置搜尋會更快。`:"搜尋完成，目前沒有足夠相似的結果。為避免誤認，低信心候選不會顯示；可改用臉更近、光線更清楚或接近活動造型的照片再試。");
  }catch(error){
   console.error("JimFrame face search failed",error);
   const message=error instanceof Error?error.message:"";
   setFaceStatus(message.includes("Image decode")?"這張照片無法讀取，請改用 JPG、PNG 或 WebP 照片。":message.startsWith("FACE_SCRIPT")||/weights|manifest|fetch|load/i.test(message)?"臉部辨識模型載入失敗，請確認網路後再試一次。參考照片只在這台裝置處理，沒有上傳到伺服器。":/webgl|backend|context/i.test(message)?"這台裝置的瀏覽器無法啟動臉部辨識（WebGL 不可用），請改用 Chrome 或 Safari 最新版再試。":"搜尋途中發生錯誤，請重新整理頁面後再試一次。");
  }
  finally{setFaceSearching(false);}
 };
 const openFaceMatch=(match:FaceMatch)=>{const album=freshAlbums.find(item=>`${item.date}-${item.venue}`===match.albumKey);if(!album)return;openAlbum(album);setActiveAlbumPhoto(match.id);setActiveGrade("original");setAdjustments(defaultAdjustments);trackPhotoOpen(match.id);};
 const rejectFaceMatch=async(match:FaceMatch)=>{
  setRejectedFaceMatches(current=>new Set(current).add(match.id));
  setSelectedFaceMatches(current=>{const next=new Set(current);next.delete(match.id);return next;});
  setFaceFeedbackStatus("已移除這張結果，謝謝你的回饋。");
  let visitorId=localStorage.getItem("jimframe_visitor_id");
  if(!visitorId){visitorId=crypto.randomUUID();localStorage.setItem("jimframe_visitor_id",visitorId);}
  try{
   const response=await fetch("/api/face-feedback",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({visitorId,photoId:match.id,albumKey:match.albumKey,model:"sface-1",distance:match.distance}),keepalive:true});
   if(!response.ok)throw new Error("feedback failed");
  }catch{setFaceFeedbackStatus("照片已從本次結果移除；匿名回饋暫時無法送出。");}
 };
 const toggleFaceSelection=(photoId:string)=>setSelectedFaceMatches(current=>{const next=new Set(current);if(next.has(photoId))next.delete(photoId);else if(next.size<20)next.add(photoId);return next;});
 const visibleFaceMatches=()=>faceMatches.filter(match=>!rejectedFaceMatches.has(match.id));
 const downloadFaceSelection=async()=>{
  const ids=visibleFaceMatches().map(match=>match.id).filter(id=>selectedFaceMatches.has(id));
  if(!ids.length||faceDownloadWorking)return;
  if(!confirmPhotoCredit())return;
  setFaceDownloadWorking(true);setFaceDownloadStatus(language==="en"?`Collecting 1 / ${ids.length}…`:language==="ko"?`원본 수집 중 1 / ${ids.length}…`:`正在收集原檔 1 / ${ids.length}…`);
  try{
   const files:ZipEntry[]=[];const failed:string[]=[];
   for(let i=0;i<ids.length;i++){
    setFaceDownloadStatus(language==="en"?`Collecting ${i+1} / ${ids.length}…`:language==="ko"?`원본 수집 중 ${i+1} / ${ids.length}…`:`正在收集原檔 ${i+1} / ${ids.length}…`);
    let response:Response|null=null;
    for(let attempt=0;attempt<2;attempt++){try{response=await fetch(`/api/photo-file?id=${encodeURIComponent(ids[i])}&batch=1&attempt=${attempt}`);if(response.ok)break;}catch{}response=null;}
    if(!response?.ok){failed.push(ids[i]);continue;}
    const data=new Uint8Array(await response.arrayBuffer());if(!data.length){failed.push(ids[i]);continue;}
    files.push({name:`JimFrame_${String(i+1).padStart(2,"0")}_${ids[i].slice(0,8)}.jpg`,data});trackInteraction(ids[i],"download");
   }
   if(!files.length)throw new Error("all downloads failed");
   const mobileFiles=files.map(file=>new File([file.data],file.name,{type:"image/jpeg"}));
   const isMobile=window.matchMedia("(max-width: 760px)").matches||/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
   if(isMobile&&navigator.share&&navigator.canShare?.({files:mobileFiles})){
    setFaceDownloadStatus(language==="en"?"Opening your phone’s save menu…":language==="ko"?"휴대폰 저장 메뉴를 여는 중…":"正在開啟手機儲存選單…");
    try{
     await navigator.share({title:"JimFrame Photos",text:"Photography @jimframe",files:mobileFiles});
     setFaceDownloadStatus(failed.length?`${files.length} 張已交給手機處理，${failed.length} 張暫時無法取得。`:`已交給手機處理，共 ${files.length} 張照片。`);return;
    }catch(error){if((error as Error).name==="AbortError"){setFaceDownloadStatus(language==="en"?"Save cancelled. You can try again.":language==="ko"?"저장이 취소되었습니다. 다시 시도할 수 있습니다.":"已取消儲存，可再次下載。");return;}}
   }
   setFaceDownloadStatus(language==="en"?"Creating ZIP…":language==="ko"?"ZIP 파일 생성 중…":"正在建立 ZIP 壓縮包…");
   const zip=makeStoredZip(files);const url=URL.createObjectURL(zip);const link=document.createElement("a");link.href=url;link.download=`JimFrame_Found_${files.length}photos.zip`;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),10000);
   setFaceDownloadStatus(failed.length?`已下載 ${files.length} 張，${failed.length} 張暫時無法取得。`:`下載完成，共 ${files.length} 張照片。`);
  }catch{setFaceDownloadStatus(language==="en"?"Download failed. Please select fewer photos or try again later.":language==="ko"?"다운로드에 실패했습니다. 사진 수를 줄이거나 나중에 다시 시도해 주세요.":"下載失敗，請減少選取數量或稍後再試。");}finally{setFaceDownloadWorking(false);}
 };
 useEffect(()=>{
  const mixed=shuffle(freshPool);
  // Session-specific shuffling is intentionally initialized after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setSessionAlbums(freshAlbums.map(a=>({...a,images:shuffle(a.images)})));
  setSessionHero(mixed.slice(0,10).map(p=>p.id));

  let visitorId=localStorage.getItem("jimframe_visitor_id");
  if(!visitorId){visitorId=crypto.randomUUID();localStorage.setItem("jimframe_visitor_id",visitorId);}
  try{
   const stored=localStorage.getItem("jimframe_color_presets");
   if(stored)setSavedGradeSettings(JSON.parse(stored) as SavedGradeSetting[]);
   else{
    const legacy=localStorage.getItem("jimframe_color_setting");
    if(legacy){const item=JSON.parse(legacy) as Omit<SavedGradeSetting,"id"|"name"|"updatedAt">;setSavedGradeSettings([{...item,id:crypto.randomUUID(),name:"我的設定",updatedAt:new Date().toISOString()}]);}
   }
  }catch{localStorage.removeItem("jimframe_color_presets");}
  void fetch("/api/track",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({visitorId}),keepalive:true});

  const sessionId=crypto.randomUUID();
  let activeStarted=document.visibilityState==="visible"?performance.now():null;
  let activeMs=0;
  let lastSent=0;
  const totalSeconds=()=>Math.floor((activeMs+(activeStarted===null?0:performance.now()-activeStarted))/1000);
  const sendEngagement=()=>{
   const seconds=totalSeconds();
   if(seconds<3||seconds<=lastSent)return;
   lastSent=seconds;
   void fetch("/api/engagement",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({sessionId,seconds}),keepalive:true});
  };
  const onVisibilityChange=()=>{
   if(document.visibilityState==="hidden"){
    if(activeStarted!==null){activeMs+=performance.now()-activeStarted;activeStarted=null;}
    sendEngagement();
   }else if(activeStarted===null){activeStarted=performance.now();}
  };
  const onPageHide=()=>{
   if(activeStarted!==null){activeMs+=performance.now()-activeStarted;activeStarted=null;}
   sendEngagement();
  };
  document.addEventListener("visibilitychange",onVisibilityChange);
  window.addEventListener("pagehide",onPageHide);
  const heartbeat=window.setInterval(sendEngagement,15000);
  return()=>{
   window.clearInterval(heartbeat);
   document.removeEventListener("visibilitychange",onVisibilityChange);
   window.removeEventListener("pagehide",onPageHide);
   onPageHide();
  };
 },[]);
 useEffect(()=>{
  try{
   const saved=JSON.parse(localStorage.getItem("jimframe_liked_photos")||"[]");
   // eslint-disable-next-line react-hooks/set-state-in-effect
   if(Array.isArray(saved))setLikedPhotos(new Set(saved.filter((id):id is string=>typeof id==="string")));
  }catch{}
 },[]);
 useEffect(()=>{
  void Promise.all([
   fetch("/api/popular").then(r=>r.ok?r.json():[]).catch(()=>[] as PopularPhoto[]),
   fetch("/api/home-exclusions").then(r=>r.ok?r.json():{ids:[]}).catch(()=>({ids:[]})) as Promise<{ids?:unknown}>,
  ]).then(([items,payload])=>{
   const dynamic=Array.isArray(payload.ids)?payload.ids.filter((id):id is string=>typeof id==="string"):[];
   const excluded=new Set([...lowExposurePhotoIds,...dynamic]);
   setHomeExcludedIds(excluded);
   const eligible=(items as PopularPhoto[]).filter(item=>!excluded.has(item.id));
   setPopularPhotos(eligible);
   const picks=autoFeatured(eligible,excluded);
   if(picks.length)setSessionHero(picks);
   setSessionAlbums(current=>current.map(album=>({...album,images:[...album.images].sort((left,right)=>Number(excluded.has(left))-Number(excluded.has(right)))})));
  }).catch(()=>{});
 },[]);
 useEffect(()=>{
  document.body.style.overflow=selectedAlbum?"hidden":"";
  return()=>{document.body.style.overflow="";};
 },[selectedAlbum]);
 useEffect(()=>{
  const sessionId=photoSessionId.current??crypto.randomUUID();
  photoSessionId.current=sessionId;
  const states=new Map<Element,{photoId:string;started:number|null;total:number;lastSent:number;visible:boolean}>();
  const send=(state:{photoId:string;started:number|null;total:number;lastSent:number;visible:boolean})=>{
   const seconds=Math.floor(state.total/1000);
   if(seconds<3||seconds<=state.lastSent)return;
   state.lastSent=seconds;
   void fetch("/api/photo-attention",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({sessionId,photoId:state.photoId,action:"focus",seconds}),keepalive:true});
  };
  const observer=new IntersectionObserver(entries=>{
   const now=performance.now();
   for(const entry of entries){
    const state=states.get(entry.target);if(!state)continue;
    state.visible=entry.isIntersecting&&entry.intersectionRatio>=.6;
    if(state.visible&&document.visibilityState==="visible"){
     if(state.started===null)state.started=now;
    }else if(state.started!==null){state.total+=now-state.started;state.started=null;send(state);}
   }
  },{threshold:[0,.6,1]});
  document.querySelectorAll("[data-photo-id]").forEach(element=>{
   const photoId=element.getAttribute("data-photo-id");
   if(photoId){states.set(element,{photoId,started:null,total:0,lastSent:0,visible:false});observer.observe(element);}
  });
  const flush=()=>{const now=performance.now();for(const state of states.values()){if(state.started!==null){state.total+=now-state.started;state.started=null;}send(state);}};
  const onVisibilityChange=()=>{if(document.visibilityState==="hidden")flush();else{const now=performance.now();for(const state of states.values())if(state.visible&&state.started===null)state.started=now;}};
  const heartbeat=window.setInterval(()=>{const now=performance.now();for(const state of states.values()){if(state.started!==null){state.total+=now-state.started;state.started=now;send(state);}}},10000);
  document.addEventListener("visibilitychange",onVisibilityChange);
  window.addEventListener("pagehide",flush);
  return()=>{window.clearInterval(heartbeat);observer.disconnect();document.removeEventListener("visibilitychange",onVisibilityChange);window.removeEventListener("pagehide",flush);flush();};
 },[sessionHero]);
 const trackPhotoOpen=(photoId:string)=>{
  const sessionId=photoSessionId.current??crypto.randomUUID();
  photoSessionId.current=sessionId;
  void fetch("/api/photo-attention",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({sessionId,photoId,action:"open"}),keepalive:true});
 };
 const trackInteraction=(targetId:string,action:"favorite"|"share"|"download")=>{
  const sessionId=photoSessionId.current??crypto.randomUUID();
  photoSessionId.current=sessionId;
  void fetch("/api/interaction",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({sessionId,targetId,action}),keepalive:true});
 };
 const toggleFavorite=(photoId:string)=>{
  const next=new Set(likedPhotos);
  if(next.has(photoId))next.delete(photoId);else{next.add(photoId);trackInteraction(photoId,"favorite");}
  setLikedPhotos(next);
  localStorage.setItem("jimframe_liked_photos",JSON.stringify([...next]));
 };
 // The credit reminder is shown once per visit (browser tab session), not on every download.
 const confirmPhotoCredit=()=>{
  try{if(sessionStorage.getItem("jimframe_credit_ack")==="1")return true;}catch{}
  const accepted=window.confirm("下載與使用提醒 📷\n\n分享或使用照片時，請記得標註攝影師 @jimframe。每次活動拍攝、挑選與整理都需要投入不少時間；你的標註能支持我繼續為舞池留下更多照片。\n\n喜歡這些照片的話，也歡迎在網站贊助區透過 LINE／LINE Pay 自願支持下一場活動攝影。\n\nDownload & usage reminder: Please credit and tag @jimframe when sharing these photos. If you enjoy the work, voluntary support via LINE / LINE Pay is also welcome and helps keep future dance events photographed.\n\n按下「確定」繼續下載。Press OK to continue.");
  if(accepted){try{sessionStorage.setItem("jimframe_credit_ack","1");}catch{}}
  return accepted;
 };
 const sharePhoto=async(photoId:string,title:string)=>{
  const url=photoLink(photoId);
  trackInteraction(photoId,"share");
  try{
   const shareText=`${title}｜Photography @jimframe\n分享或使用照片時，請記得標註攝影師，謝謝你支持活動攝影 📷`;
   if(navigator.share)await navigator.share({title,text:shareText,url});
   else{await navigator.clipboard.writeText(`${shareText}\n${url}`);window.alert("照片連結與攝影師帳號已複製");}
  }catch{}
 };
 const renderStoryImage=async(photoId:string,template:StoryTemplate)=>{
   const meta=freshPool.find(item=>item.id===photoId);
   const response=await fetch(`/api/face-preview?id=${encodeURIComponent(photoId)}&w=1600`);
   if(!response.ok)throw new Error("photo unavailable");
   const photo=await blobImage(await response.blob());
   const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1920;
   const context=canvas.getContext("2d");if(!context)throw new Error("canvas unavailable");
   context.fillStyle=template==="space"?"#f2efe9":"#080808";context.fillRect(0,0,1080,1920);
   const box=template==="full"?{x:0,y:0,w:1080,h:1920}:template==="space"?{x:64,y:250,w:952,h:1190}:{x:70,y:300,w:940,h:1120};
   const scale=Math.max(box.w/photo.width,box.h/photo.height);const dw=photo.width*scale,dh=photo.height*scale;
   context.save();context.beginPath();context.roundRect(box.x,box.y,box.w,box.h,template==="full"?0:30);context.clip();context.drawImage(photo,box.x+(box.w-dw)/2,box.y+(box.h-dh)*.42,dw,dh);context.restore();
   if(template==="full"){const gradient=context.createLinearGradient(0,1080,0,1920);gradient.addColorStop(0,"rgba(0,0,0,0)");gradient.addColorStop(1,"rgba(0,0,0,.88)");context.fillStyle=gradient;context.fillRect(0,1000,1080,920);}
   const dark=template!=="space";context.fillStyle=dark?"#fff":"#111";context.font='700 42px -apple-system, BlinkMacSystemFont, "PingFang TC", sans-serif';context.fillText("JIM LIN PHOTOGRAPHY",64,166);
   context.fillStyle=dark?"rgba(255,255,255,.7)":"rgba(17,17,17,.62)";context.font='500 31px -apple-system, BlinkMacSystemFont, "PingFang TC", sans-serif';context.fillText(meta?`${dateLabel(meta.date)} · ${meta.venue}`:"FOUND ON JIMFRAME",64,215);
   if(template==="partner"){context.fillStyle="#fff";context.font='700 52px -apple-system, BlinkMacSystemFont, "PingFang TC", sans-serif';context.fillText(storyCopy.partnerLine,70,1535);}
   context.fillStyle=dark?"#fff":"#111";context.font='700 46px -apple-system, BlinkMacSystemFont, "PingFang TC", sans-serif';context.fillText("@jimframe",64,template==="space"?1555:template==="partner"?1640:1665);
   context.fillStyle=dark?"rgba(255,255,255,.72)":"rgba(17,17,17,.58)";context.font='500 29px -apple-system, BlinkMacSystemFont, "PingFang TC", sans-serif';context.fillText(window.location.origin,64,template==="space"?1605:template==="partner"?1690:1715);
   if(template==="space"){context.font='600 31px -apple-system, BlinkMacSystemFont, "PingFang TC", sans-serif';context.fillText(language==="en"?"Tag your dance partner here ↗":language==="ko"?"댄스 파트너를 태그하세요 ↗":"在這裡標記你的舞伴 ↗",64,1745);}
   return new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error("render failed")),"image/jpeg",.94));
 };
 const shareMatchStory=async(photoId:string,downloadOnly=false)=>{
  setStoryWorking(true);
  try{
   const blob=await renderStoryImage(photoId,storyTemplate);
   const file=new File([blob],`JimFrame_story_${photoId.slice(0,8)}.jpg`,{type:"image/jpeg"});trackInteraction(photoId,"share");
   if(!downloadOnly&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:"Jim Lin Photography",text:`${storyCopy.credit}\n${storyTemplate==="partner"?storyCopy.partnerLine:""}`});setStoryPhotoId(null);return;}
   const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
  }catch(error){if((error as Error).name!=="AbortError")window.alert(language==="en"?"Could not create the Story image. Please try again.":language==="ko"?"스토리 이미지를 만들 수 없습니다. 다시 시도해 주세요.":"暫時無法製作限動圖片，請再試一次。");}finally{setStoryWorking(false);}
 };
 const downloadPhoto=async(photoId:string)=>{
  if(!confirmPhotoCredit())return;
  try{
   const response=await fetch(`/api/photo-file?id=${encodeURIComponent(photoId)}`);
   if(!response.ok)throw new Error("download failed");
   const url=URL.createObjectURL(await response.blob());
   const link=document.createElement("a");link.href=url;link.download=`JimFrame_${photoId.slice(0,10)}.jpg`;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),3000);
   trackInteraction(photoId,"download");
  }catch{window.alert("原始照片暫時無法下載，請稍後再試或使用相簿內的 Google Drive 連結。");}
 };
 const openAlbum=(album:Album)=>{
  const token=++albumLoadToken.current;
  const preview={...album,images:album.images.filter(id=>!hiddenPhotoIds.has(id))};
  setSelectedAlbum(preview);setAlbumLoading(true);setActiveAlbumPhoto(null);setActiveGrade("original");setFilterMix(80);setShowOriginal(false);setAdjustments(defaultAdjustments);setBatchMode(false);setSelectedPhotos(new Set());setBatchStatus("");
  const useCuratedPhotoList=album.date==="1015"&&album.venue==="Bachata Crush";
  if(useCuratedPhotoList){setAlbumLoading(false);}
  else void fetch(`/api/folder-photos?folder=${encodeURIComponent(album.folder)}`).then(response=>response.ok?response.json():Promise.reject()).then((payload:{images?:unknown})=>{
   if(token!==albumLoadToken.current||!Array.isArray(payload.images))return;
   const images=[...new Set(payload.images.filter((id):id is string=>typeof id==="string"&&!hiddenPhotoIds.has(id)))];
   if(images.length)setSelectedAlbum({...album,images});
  }).catch(()=>{}).finally(()=>{if(token===albumLoadToken.current)setAlbumLoading(false);});
  void fetch("/api/album-click",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({album:`${album.date}-${album.venue}`,venue:album.venue,date:album.date}),keepalive:true});
 };
 const closeAlbum=()=>{albumLoadToken.current++;setAlbumLoading(false);setSelectedAlbum(null);setActiveAlbumPhoto(null);setActiveGrade("original");setFilterMix(80);setShowOriginal(false);setAdjustments(defaultAdjustments);setBatchMode(false);setSelectedPhotos(new Set());setBatchStatus("");};
 const albumKeyOf=(album:Album)=>`${album.date}-${album.venue}`;
 const findPhotoAlbum=(photoId:string)=>freshAlbums.find(album=>album.images.includes(photoId));
 // Share links carry the album so the photo can be opened even when it is only listed in the Drive folder.
 const photoLink=(photoId:string,album?:Album|null)=>{const owner=album&&album.images.includes(photoId)?album:selectedAlbum&&selectedAlbum.images.includes(photoId)?selectedAlbum:findPhotoAlbum(photoId);return `${window.location.origin}/#photo-${encodeURIComponent(photoId)}${owner?`&album=${encodeURIComponent(albumKeyOf(owner))}`:""}`;};
 useEffect(()=>{
  const openFromHash=()=>{
   const match=window.location.hash.match(/^#photo-([A-Za-z0-9_-]{10,120})(?:&album=([^&]+))?/);
   if(!match)return;
   const photoId=match[1];const albumKey=match[2]?decodeURIComponent(match[2]):"";
   const album=freshAlbums.find(item=>albumKeyOf(item)===albumKey)??findPhotoAlbum(photoId);
   if(album){openAlbum(album);setActiveAlbumPhoto(photoId);trackPhotoOpen(photoId);}
   else document.getElementById(`photo-${photoId}`)?.scrollIntoView({behavior:"smooth",block:"center"});
  };
  openFromHash();
  window.addEventListener("hashchange",openFromHash);
  return()=>window.removeEventListener("hashchange",openFromHash);
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 useEffect(()=>{
  if(!selectedAlbum)return;
  const onKey=(event:KeyboardEvent)=>{
   const target=event.target as HTMLElement|null;
   if(target&&(target.tagName==="INPUT"||target.tagName==="TEXTAREA"))return;
   if(event.key==="Escape"){
    if(editing){setEditing(false);return;}
    if(activeAlbumPhoto){setActiveAlbumPhoto(null);setActiveGrade("original");setAdjustments(defaultAdjustments);}
    else closeAlbum();
    return;
   }
   if(!activeAlbumPhoto||(event.key!=="ArrowLeft"&&event.key!=="ArrowRight"))return;
   const index=selectedAlbum.images.indexOf(activeAlbumPhoto);if(index<0)return;
   const next=selectedAlbum.images[(index+(event.key==="ArrowRight"?1:-1)+selectedAlbum.images.length)%selectedAlbum.images.length];
   event.preventDefault();setActiveAlbumPhoto(next);trackPhotoOpen(next);
  };
  window.addEventListener("keydown",onKey);
  return()=>window.removeEventListener("keydown",onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[selectedAlbum,activeAlbumPhoto,editing]);
 // Albums added with images:[] get their covers straight from the Drive folder.
 useEffect(()=>{
  const empty=freshAlbums.filter(album=>!album.images.length);
  if(!empty.length)return;
  let cancelled=false;
  void Promise.all(empty.map(async album=>{
   try{
    const response=await fetch(`/api/folder-photos?folder=${encodeURIComponent(album.folder)}`);
    if(!response.ok)return;
    const payload=await response.json() as {images?:unknown};
    if(Array.isArray(payload.images))album.images=payload.images.filter((id):id is string=>typeof id==="string"&&!hiddenPhotoIds.has(id));
   }catch{}
  })).then(()=>{
   if(cancelled)return;
   setSessionAlbums(current=>current.map(item=>{const source=freshAlbums.find(album=>album.folder===item.folder);return item.images.length||!source?.images.length?item:{...item,images:shuffle(source.images)};}));
  });
  return()=>{cancelled=true;};
 },[]);
 const persistGradeSettings=(items:SavedGradeSetting[])=>{setSavedGradeSettings(items);localStorage.setItem("jimframe_color_presets",JSON.stringify(items));};
 const saveCurrentGradeSetting=()=>{
  const fallback=(colorGrades.find(item=>item.id===activeGrade)?.label??"自訂調色").replace(/\s+/g," ");
  const name=(presetName.trim()||`${fallback} ${filterMix}%`).slice(0,36);
  const next:SavedGradeSetting={id:crypto.randomUUID(),name,grade:activeGrade,mix:filterMix,adjustments:{...adjustments},updatedAt:new Date().toISOString()};
  persistGradeSettings([next,...savedGradeSettings].slice(0,20));setPresetName("");
 };
 const applySavedGradeSetting=(item:SavedGradeSetting)=>{setActiveGrade(item.grade);setFilterMix(item.mix);setAdjustments({...item.adjustments});};
 const deleteSavedGradeSetting=(id:string)=>persistGradeSettings(savedGradeSettings.filter(item=>item.id!==id));
 const exportGradeSettings=()=>{
  if(!savedGradeSettings.length)return;
  const payload:GradePresetFile={format:"jimframe-color-presets",version:1,presets:savedGradeSettings};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));
  const link=document.createElement("a");link.href=url;link.download=`JimFrame_Color_Presets_${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 const importGradeSettings=async(event:ChangeEvent<HTMLInputElement>)=>{
  const file=event.target.files?.[0];event.target.value="";if(!file)return;
  try{
   const payload=JSON.parse(await file.text()) as GradePresetFile;
   if(payload.format!=="jimframe-color-presets"||payload.version!==1||!Array.isArray(payload.presets))throw new Error("invalid");
   const valid=payload.presets.filter(item=>item&&typeof item.name==="string"&&colorGrades.some(grade=>grade.id===item.grade)&&Number.isFinite(item.mix)&&item.adjustments&&adjustmentLabels.every(control=>Number.isFinite(item.adjustments[control.id]))).map(item=>({...item,id:crypto.randomUUID(),name:item.name.slice(0,36),mix:Math.max(0,Math.min(100,item.mix)),updatedAt:new Date().toISOString()}));
   if(!valid.length)throw new Error("empty");persistGradeSettings([...valid,...savedGradeSettings].slice(0,20));
  }catch{window.alert("無法讀取這個設定檔，請選擇由 JimFrame 匯出的 JSON 檔案。");}
 };
 const trackColorPreference=(photoId:string)=>{
  if(activeGrade==="original")return;
  const sessionId=photoSessionId.current??crypto.randomUUID();photoSessionId.current=sessionId;
  void fetch("/api/color-preference",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({sessionId,photoId,grade:activeGrade,mix:filterMix,adjustments}),keepalive:true});
 };
 const trackSupportContact=()=>{void fetch("/api/support-click",{method:"POST",keepalive:true});};
 const toggleBatchPhoto=(photoId:string)=>setSelectedPhotos(current=>{const next=new Set(current);if(next.has(photoId))next.delete(photoId);else next.add(photoId);return next;});
 const selectedPhotoList=()=>selectedAlbum?selectedAlbum.images.filter(id=>selectedPhotos.has(id)):[];
 const downloadBatch=async()=>{
  const ids=selectedPhotoList();if(!ids.length||isBatchWorking)return;
  if(ids.length>20){window.alert("為避免瀏覽器記憶體不足，每次最多批次下載 20 張。");return;}
  if(!confirmPhotoCredit())return;
  setIsBatchWorking(true);
  try{
   const files:ZipEntry[]=[];const failed:string[]=[];
   for(let i=0;i<ids.length;i++){
    setBatchStatus(`正在收集原檔 ${i+1} / ${ids.length}`);let response:Response|null=null;
    for(let attempt=0;attempt<2;attempt++){try{response=await fetch(`/api/photo-file?id=${encodeURIComponent(ids[i])}&batch=1&attempt=${attempt}`);if(response.ok)break;}catch{}response=null;}
    if(!response?.ok){failed.push(ids[i]);continue;}const data=new Uint8Array(await response.arrayBuffer());if(!data.length){failed.push(ids[i]);continue;}files.push({name:`JimFrame_${String(i+1).padStart(2,"0")}_${ids[i].slice(0,8)}.jpg`,data});trackInteraction(ids[i],"download");
   }
   if(!files.length)throw new Error("all downloads failed");
   const mobileFiles=files.map(file=>new File([file.data],file.name,{type:"image/jpeg"}));
   const isMobile=window.matchMedia("(max-width: 760px)").matches||/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
   if(isMobile&&navigator.share&&navigator.canShare?.({files:mobileFiles})){
    setBatchStatus("正在開啟手機儲存選單…");
    try{
     await navigator.share({title:"JimFrame 照片",text:"選擇『儲存到照片』或『儲存到檔案』即可一次保存。",files:mobileFiles});
     setBatchStatus(failed.length?`已交給手機處理 ${files.length} 張；另有 ${failed.length} 張可稍後重試。`:`已交給手機處理，共 ${files.length} 張照片。`);return;
    }catch(error){
     if((error as Error).name==="AbortError"){setBatchStatus("已取消手機儲存，可再次按下批次儲存。");return;}
    }
   }
   setBatchStatus("正在建立 ZIP 壓縮包…");const zip=makeStoredZip(files);const url=URL.createObjectURL(zip);const link=document.createElement("a");link.href=url;link.download=`JimFrame_${selectedAlbum?.date??"Photos"}_${files.length}photos.zip`;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),10000);setBatchStatus(failed.length?`ZIP 已下載 ${files.length} 張；${failed.length} 張原檔暫時無法取得，可稍後重試。`:`ZIP 已下載，共 ${files.length} 張照片。`);
  }catch{setBatchStatus("無法完成批次儲存，請減少選取數量或稍後再試。");}finally{setIsBatchWorking(false);}
 };
 const shareBatch=async()=>{
  const ids=selectedPhotoList();if(!ids.length||isBatchWorking||!selectedAlbum)return;
  if(ids.length>10){window.alert("批次分享一次最多 10 張；批次下載則最多 20 張。");return;}
  setIsBatchWorking(true);setBatchStatus("正在準備分享…");
  const title=`2026.${dateLabel(selectedAlbum.date)} ${selectedAlbum.venue}｜Photography @jimframe`;
  try{
   const files=await Promise.all(ids.map(async(id,index)=>{const response=await fetch(`/api/photo-file?id=${encodeURIComponent(id)}`);if(!response.ok)throw new Error("share fetch failed");return new File([await response.blob()],`JimFrame_${String(index+1).padStart(2,"0")}.jpg`,{type:"image/jpeg"});}));
   if(navigator.share&&navigator.canShare?.({files}))await navigator.share({title,text:`${title}\n分享或使用照片時，請記得標註攝影師 @jimframe，謝謝你支持活動攝影 📷`,files});
   else{
    const links=ids.map(id=>photoLink(id,selectedAlbum)).join("\n");
    await navigator.clipboard.writeText(`${title}\n${links}`);window.alert("此裝置不支援多張照片直接分享，已複製照片連結與攝影師帳號。");
   }
   ids.forEach(id=>trackInteraction(id,"share"));setBatchStatus(`已準備 ${ids.length} 張分享`);
  }catch(error){if((error as Error).name!=="AbortError")setBatchStatus("無法完成批次分享，請減少照片數量後再試。");}finally{setIsBatchWorking(false);}
 };
 const generateGradedPhoto=async(photoId:string)=>{
  if(!confirmPhotoCredit())return;
  const grade=colorGrades.find(item=>item.id===activeGrade)??colorGrades[0];
  setIsGenerating(true);
  try{
   const response=await fetch(`/api/photo-file?id=${encodeURIComponent(photoId)}`);
   if(!response.ok)throw new Error("photo fetch failed");
   const bitmap=await createImageBitmap(await response.blob());
   const canvas=document.createElement("canvas");
   canvas.width=bitmap.width;canvas.height=bitmap.height;
   const context=canvas.getContext("2d",{willReadFrequently:true});
   if(!context)throw new Error("canvas unavailable");
   context.drawImage(bitmap,0,0);bitmap.close();
   if(hasColorEdits(activeGrade,adjustments)){
    const frame=context.getImageData(0,0,canvas.width,canvas.height);
    applyColorGrade(frame.data,activeGrade,filterMix,adjustments);
    context.putImageData(frame,0,0);
   }
   // Edited photos are exported losslessly so the download matches the full-resolution canvas.
   // Original-photo downloads bypass Canvas and keep the Drive source file unchanged.
   const output=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/png"));
   if(!output)throw new Error("lossless export failed");
   const url=URL.createObjectURL(output);
   const link=document.createElement("a");
   const customized=Object.values(adjustments).some(value=>value!==0)?"-custom":"";
   const mixLabel=activeGrade==="original"?"":`-${filterMix}`;
   link.href=url;link.download=`JimFrame_${photoId.slice(0,8)}_${grade.file}${mixLabel}${customized}.png`;
   document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
   trackInteraction(photoId,"download");trackColorPreference(photoId);
  }catch{
   window.alert("目前無法生成調色檔案，請稍後再試或先下載原始照片。");
 }finally{setIsGenerating(false);}
 };
 const previewFilter=useMemo(()=>{
  if(showOriginal)return "none";
  const preset=(colorGrades.find(item=>item.id===activeGrade)??colorGrades[0]).preview;
  const mix=activeGrade==="original"?0:filterMix/100;
  const presetContrast=1+(preset.contrast-1)*mix,presetSaturation=1+(preset.saturation-1)*mix,presetBrightness=1+(preset.brightness-1)*mix;
  const brightness=1+adjustments.exposure/180+(adjustments.highlights+adjustments.shadows)/700;
  const contrast=1+adjustments.contrast/100;
  const saturation=Math.max(0,1+adjustments.saturation/100);
  const temperature=adjustments.warmth===0?"":` sepia(${Math.abs(adjustments.warmth)/300}) hue-rotate(${adjustments.warmth<0?"170deg":"-8deg"})`;
  return `grayscale(${preset.grayscale*mix}) sepia(${preset.sepia*mix}) hue-rotate(${preset.hue*mix}deg) brightness(${Math.max(.2,brightness*presetBrightness)}) contrast(${Math.max(.2,contrast*presetContrast)}) saturate(${saturation*presetSaturation})${temperature}`;
 },[activeGrade,adjustments,filterMix,showOriginal]);
 // Exact preview: run the same pixel pipeline as the download on a 1600px copy.
 const previewPhotoId=activeAlbumPhoto??(activeHero===null?null:sessionHero[activeHero]??null);
 const previewSource=useRef<{id:string;frame:ImageData}|null>(null);
 const [previewSourceId,setPreviewSourceId]=useState<string|null>(null);
 const [gradedPreview,setGradedPreview]=useState<{id:string;url:string}|null>(null);
 useEffect(()=>{
  if(!previewPhotoId)return;
  let cancelled=false;
  void (async()=>{
   try{
    const response=await fetch(`/api/face-preview?id=${encodeURIComponent(previewPhotoId)}&w=1600`);
    if(!response.ok)throw new Error("preview unavailable");
    const bitmap=await createImageBitmap(await response.blob());
    const scale=Math.min(1,1600/bitmap.width);
    const canvas=document.createElement("canvas");canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
    const context=canvas.getContext("2d",{willReadFrequently:true});if(!context)throw new Error("canvas unavailable");
    context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    if(cancelled)return;
    previewSource.current={id:previewPhotoId,frame:context.getImageData(0,0,canvas.width,canvas.height)};
    setPreviewSourceId(previewPhotoId);
   }catch{/* falls back to the CSS approximation */}
  })();
  return()=>{cancelled=true;};
 },[previewPhotoId]);
 useEffect(()=>{
  const source=previewSource.current;
  if(!source||source.id!==previewSourceId||source.id!==previewPhotoId)return;
  if(!hasColorEdits(activeGrade,adjustments)){
   // eslint-disable-next-line react-hooks/set-state-in-effect
   setGradedPreview(null);return;
  }
  let cancelled=false;
  // Short debounce keeps slider dragging smooth.
  const timer=window.setTimeout(()=>{
   const frame=new ImageData(new Uint8ClampedArray(source.frame.data),source.frame.width,source.frame.height);
   applyColorGrade(frame.data,activeGrade,filterMix,adjustments);
   const canvas=document.createElement("canvas");canvas.width=frame.width;canvas.height=frame.height;
   canvas.getContext("2d")?.putImageData(frame,0,0);
   canvas.toBlob(blob=>{if(!blob||cancelled)return;setGradedPreview({id:source.id,url:URL.createObjectURL(blob)});},"image/jpeg",.92);
  },45);
  return()=>{cancelled=true;window.clearTimeout(timer);};
 },[activeGrade,adjustments,filterMix,previewSourceId,previewPhotoId]);
 useEffect(()=>{const url=gradedPreview?.url;return()=>{if(url)URL.revokeObjectURL(url);};},[gradedPreview]);
 const previewProps=(photoId:string,fallbackSrc:string)=>{
  const edited=hasColorEdits(activeGrade,adjustments);
  if(showOriginal||!edited)return {src:fallbackSrc};
  if(gradedPreview?.id===photoId)return {src:gradedPreview.url};
  return {src:fallbackSrc,style:{filter:previewFilter}};
 };
 const openPhoto=(photoId:string)=>{const album=findPhotoAlbum(photoId);if(!album)return;openAlbum(album);setActiveAlbumPhoto(photoId);setEditing(false);trackPhotoOpen(photoId);};
 const stepPhoto=(delta:number)=>{
  if(!selectedAlbum||!activeAlbumPhoto)return;
  const index=selectedAlbum.images.indexOf(activeAlbumPhoto);if(index<0)return;
  const next=selectedAlbum.images[(index+delta+selectedAlbum.images.length)%selectedAlbum.images.length];
  setActiveAlbumPhoto(next);trackPhotoOpen(next);
 };
 const leavePhoto=()=>{setActiveAlbumPhoto(null);setEditing(false);setActiveGrade("original");setAdjustments(defaultAdjustments);};
 const compareProps={
  onPointerDown:()=>setShowOriginal(true),onPointerUp:()=>setShowOriginal(false),onPointerCancel:()=>setShowOriginal(false),onPointerLeave:()=>setShowOriginal(false),
  onKeyDown:(event:{key:string})=>{if(event.key==="Enter"||event.key===" ")setShowOriginal(true);},onKeyUp:()=>setShowOriginal(false),
 };
 const gradeThumbFilter=(grade:(typeof colorGrades)[number])=>{const p=grade.preview;return `grayscale(${p.grayscale}) sepia(${p.sepia}) hue-rotate(${p.hue}deg) brightness(${p.brightness}) contrast(${p.contrast}) saturate(${p.saturation})`;};
 const activeIndex=selectedAlbum&&activeAlbumPhoto?selectedAlbum.images.indexOf(activeAlbumPhoto):-1;
 const venues=["全部","Flow","Barcade","La Salsa","Odoro","Zouk"] as const;
 const crushAlbum=albumData.find(a=>a.date==="1015"&&a.venue==="Bachata Crush");
 return <main className="app">
  <header className="navbar">
   <a className="brand" href="#top" aria-label="Jim Lin Photography 首頁"><span className="brand-mark" aria-hidden="true"><img src="/jimframe-logo.png" alt=""/></span><span>Jim Lin <em>Photography</em></span></a>
   <nav className="nav-links" aria-label="主要">
    <a href="#top">{copy.navFeatured}</a><a href="#archive">{copy.navAlbums}</a><a href="#videos">{language==="zh"?"影片":language==="ko"?"영상":"Videos"}</a><a href="#finder">{copy.navFind}</a><a href="#support">{copy.navSupport}</a><a href="#contact">{copy.navBook}</a>
   </nav>
   <div className="nav-actions"><a className="studio-pill" href="/studio"><Icon name="photo"/><span>{copy.navStudio}</span></a><div className="language-switch" role="group" aria-label="Language"><button className={language==="zh"?"is-selected":""} onClick={()=>setLanguage("zh")}>繁中</button><button className={language==="en"?"is-selected":""} onClick={()=>setLanguage("en")}>EN</button><button className={language==="ko"?"is-selected":""} onClick={()=>setLanguage("ko")}>한국어</button></div><a className="nav-pill" href="https://www.instagram.com/jimframe/" target="_blank" rel="noreferrer">@jimframe</a></div>
  </header>

  <CrushPromo language={language} photoCount={crushAlbum?.images.length??0} cover={(crushAlbum?.images??[]).filter((_,i)=>i%37===5).map(id=>image(id,700))}
   onPhotos={()=>{setFilter("Bachata Crush");requestAnimationFrame(()=>document.getElementById("archive")?.scrollIntoView({behavior:"smooth"}));}}
   onFind={()=>{setFinderOpen(true);requestAnimationFrame(()=>document.getElementById("finder")?.scrollIntoView({behavior:"smooth"}));}}/>

  <section className="hero" id="top">
   <div className="hero-copy">
    <p className="eyebrow">{copy.weekly}</p><h1 className="large-title">{copy.heroTitle}</h1><p className="hero-sub">{copy.heroSub}</p>
   </div>
   <div className="carousel" role="list" aria-label="每週精選照片">
    {sessionHero.map((id,i)=><button type="button" role="listitem" className="carousel-card" key={id} data-photo-id={id} onClick={()=>openPhoto(id)} aria-label={`開啟精選照片 ${i+1}`}>
     <img src={image(id,i<2?1400:900)} alt="" loading={i>2?"lazy":undefined}/>
    </button>)}
   </div>
  </section>

  <section className="story-studio-promo" aria-labelledby="story-studio-title">
   <div className="story-studio-copy">
    <p className="story-studio-eyebrow"><span aria-hidden="true"><Icon name="photo"/></span>{studioIntro.eyebrow}</p>
    <h2 id="story-studio-title">{studioIntro.title}</h2>
    <p className="story-studio-sub">{studioIntro.sub}</p>
    <ol className="story-studio-steps">{studioIntro.steps.map((step,index)=><li key={step}><b>{index+1}</b><span>{step}</span></li>)}</ol>
    <div className="story-studio-benefits"><span>✓ {studioIntro.partner}</span><span>✓ {studioIntro.credit}</span></div>
    <a className="story-studio-cta" href="/studio"><Icon name="photo"/><span>{studioIntro.button}<small>{studioIntro.note}</small></span><Icon name="chevron"/></a>
   </div>
   <div className="story-studio-preview" aria-hidden="true">
    {sessionHero.slice(0,3).map((id,index)=><figure key={id} style={{"--story-index":index} as React.CSSProperties}><img src={image(id,700)} alt=""/><figcaption>{index===0?"@jimframe":index===1?"WITH ______":"STORY"}</figcaption></figure>)}
   </div>
  </section>

  {popularPhotos.length>=3&&<section className="section">
   <div className="section-head"><div><h2 className="title2">{copy.popular}</h2><p className="footnote">{copy.popularNote}</p></div></div>
   <div className="popular-row">
    {popularPhotos.slice(0,4).map((p,i)=>{const meta=freshPool.find(photo=>photo.id===p.id);return <article className="popular-card motion-reveal" style={{animationDelay:`${i*55}ms`}} id={`photo-${p.id}`} key={p.id}>
     <button type="button" className="popular-image" onClick={()=>openPhoto(p.id)} aria-label={`開啟熱門第 ${i+1} 名照片`}><img src={image(p.id,900)} alt="" loading="lazy"/><span className="rank">{i+1}</span></button>
     <div className="popular-meta">
      <div><b>{meta?`${dateLabel(meta.date)} · ${meta.venue}`:"Jim Lin"}</b><small>{p.opens} {copy.opens}</small></div>
      <div className="icon-row">
       <button type="button" className={`icon-button ${likedPhotos.has(p.id)?"is-liked":""}`} onClick={()=>toggleFavorite(p.id)} aria-label={likedPhotos.has(p.id)?"取消喜歡":"喜歡"}><Icon name={likedPhotos.has(p.id)?"heartFill":"heart"}/></button>
       <button type="button" className="icon-button" onClick={()=>downloadPhoto(p.id)} aria-label="下載原始照片"><Icon name="download"/></button>
       <button type="button" className="icon-button" onClick={()=>sharePhoto(p.id,meta?`${dateLabel(meta.date)} ${meta.venue}`:"Jim Lin 照片")} aria-label="分享"><Icon name="share"/></button>
       <button type="button" className="icon-button" onClick={()=>setStoryPhotoId(p.id)} aria-label={copy.shareStory}><Icon name="photo"/></button>
      </div>
     </div>
    </article>;})}
   </div>
  </section>}

  <section className="section" id="finder">
   <div className="finder-card">
    <button type="button" className="finder-row" aria-expanded={finderOpen} onClick={()=>setFinderOpen(v=>!v)}>
     <span className="finder-icon" aria-hidden="true"><Icon name="faceSearch"/></span>
     <span className="finder-text"><b>{copy.finderTitle}</b><small>{copy.finderSub}</small></span>
     <span className={`chevron ${finderOpen?"open":""}`} aria-hidden="true"><Icon name="chevron"/></span>
    </button>
    {finderOpen&&<div className="finder-body">
     <ol className="tips">
      <li><b>{copy.tip1}</b><span>{copy.tip1Sub}</span></li><li><b>{copy.tip2}</b><span>{copy.tip2Sub}</span></li><li><b>{copy.tip3}</b><span>{copy.tip3Sub}</span></li>
     </ol>
     <div className="finder-actions">
      <label className="button button-gray">
       <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={faceSearching} onChange={chooseFacePhoto}/>
       <Icon name="photo"/>{faceFiles.length?`${copy.selected} ${faceFiles.length} ${copy.photos}`:copy.choose}
      </label>
      <button type="button" className={`button button-filled search-motion-button ${faceSearching?"is-searching":faceProgress===100?"is-complete":""}`} disabled={!faceFiles.length||faceSearching} onClick={runFaceSearch}><span className="search-motion-icon" aria-hidden="true"/>{faceSearching?copy.searching:faceProgress===100?copy.again:copy.start}</button>
     </div>
     {facePreviews.length>0&&<div className="query-row">{facePreviews.map((url,index)=><figure className={`query ${faceDiagnostics[index]?.status??"waiting"}`} key={url}><img src={url} alt={`參考照片 ${index+1}`}/><figcaption>{faceDiagnostics[index]?.detail??"待檢查"}</figcaption></figure>)}</div>}
     <div className={`progress status-island ${faceSearching?"is-active":faceProgress===100?"is-complete":""}`} aria-live="polite"><div className="progress-track"><span style={{width:`${faceProgress}%`}}/></div><div className="status-line"><i aria-hidden="true"/><p className="footnote">{faceStatus}</p></div></div>
     {faceMatches.some(match=>!rejectedFaceMatches.has(match.id))&&<>
      <div className="match-selection-head"><b>{language==="en"?"Choose photos to download":language==="ko"?"다운로드할 사진 선택":"選擇要下載的照片"}</b><div><button type="button" onClick={()=>setSelectedFaceMatches(new Set(visibleFaceMatches().slice(0,20).map(match=>match.id)))}>{finderBatchCopy.selectAll}</button><button type="button" disabled={!selectedFaceMatches.size} onClick={()=>{setSelectedFaceMatches(new Set());setFaceDownloadStatus("");}}>{finderBatchCopy.clear}</button></div></div>
      <div className="match-grid">{faceMatches.filter(match=>!rejectedFaceMatches.has(match.id)).map((match,index)=>{const selected=selectedFaceMatches.has(match.id);return <article className={`match-card motion-reveal ${selected?"is-selected":""}`} style={{animationDelay:`${Math.min(index,10)*45}ms`}} key={match.id}>
      <button type="button" className="match" onClick={()=>openFaceMatch(match)}>
       <img src={image(match.id,500)} alt={`可能符合的照片 ${index+1}`} loading="lazy"/>
       <span className={`badge ${match.exact||match.distance<STRONG_DISTANCE?"badge-strong":""}`}>{match.exact?copy.exact:match.distance<STRONG_DISTANCE?copy.strong:copy.likely}</span>
      </button>
      <button type="button" className="match-select-button" aria-label={selected?"取消選取":"選取照片"} aria-pressed={selected} onClick={()=>toggleFaceSelection(match.id)}><span>{selected&&<Icon name="check"/>}</span></button>
      {!match.exact&&<button type="button" className="not-me-button" onClick={()=>void rejectFaceMatch(match)}>{copy.notMe}</button>}
      <button type="button" className="quick-story-button" onClick={()=>setStoryPhotoId(match.id)}><Icon name="share"/>{copy.shareStory}</button>
     </article>})}</div>
      <div className="face-download-bar" aria-live="polite"><div><b>{selectedFaceMatches.size} {finderBatchCopy.selected}</b><span>{faceDownloadStatus||finderBatchCopy.limit}</span></div><button type="button" className="button button-filled" disabled={!selectedFaceMatches.size||faceDownloadWorking} onClick={()=>void downloadFaceSelection()}><Icon name="download"/>{faceDownloadWorking?finderBatchCopy.working:finderBatchCopy.download}</button></div>
     </>}
     {faceFeedbackStatus&&<p className="feedback-status" role="status">{faceFeedbackStatus}</p>}
     <p className="footnote">{copy.privacy}</p>
    </div>}
   </div>
  </section>

  <section className="section" id="archive">
   <div className="section-head">
    <div><h2 className="title2">{copy.albums}</h2><p className="footnote">2026 · {visible.length} {copy.albumCount}</p></div><label className="search-field"><Icon name="search"/><input id="album-date-search" inputMode="numeric" placeholder={copy.searchDate} value={dateQuery} onChange={e=>setDateQuery(e.target.value)}/></label>
   </div>
   <div className="segmented-wrap"><div className="segmented" role="tablist" aria-label="依場地篩選">
    {venues.map(v=><button type="button" role="tab" aria-selected={filter===v} className={filter===v?"is-selected":""} onClick={()=>setFilter(v)} key={v}>{v==="全部"?copy.all:v}</button>)}
   </div></div>
   {visible.length===0&&<div className="empty"><p>{copy.noAlbums}</p><button type="button" className="button button-tinted" onClick={resetFinder}>{copy.showAll}</button></div>}
   <div className="album-grid">
    {visible.map((a,i)=><button type="button" className="album" onClick={()=>openAlbum(a)} key={`${a.date}-${a.venue}`}>
     <div className="album-cover">{a.images.filter(id=>!homeExcludedIds.has(id)).slice(0,8).map((id,j)=><img className="slide" style={{animationDelay:`${j*5}s`}} src={image(id,600)} alt="" loading={i>5?"lazy":undefined} key={id}/>)}</div>
     <div className="album-meta"><b>{a.venue}</b><span>2026.{dateLabel(a.date)}</span></div>
    </button>)}
   </div>
   <aside className="credit-note">
    <Icon name="tag"/>
    <p><b>{copy.creditTitle} <a href="https://www.instagram.com/jimframe/" target="_blank" rel="noreferrer">@jimframe</a></b>{copy.creditText}<em>Please credit @jimframe when sharing.</em></p>
   </aside>
  </section>

  <CrushVideos language={language} confirmCredit={confirmPhotoCredit}/>

  <section className="section" id="support">
   <div className="section-head"><div><h2 className="title2">{copy.supportTitle}</h2><p className="footnote">{copy.supportSub}</p></div></div>
   <div className="grouped">
    <div className="grouped-row"><span>{copy.coffee}</span><b>NT$100</b></div><div className="grouped-row is-featured"><span>{copy.night}</span><b>NT$250</b></div><div className="grouped-row"><span>{copy.custom}</span><b>{copy.any}</b></div>
   </div>
   <p className="footnote grouped-note">{copy.supportNote} LINE ID：<b className="selectable">jim0916746661</b></p>
   <div className="button-stack">
    <a className="button button-filled button-large" href="https://line.me/ti/p/~jim0916746661" target="_blank" rel="noreferrer" onClick={trackSupportContact}>{copy.linePay}</a><a className="button button-tinted button-large" href="https://www.instagram.com/jimframe/" target="_blank" rel="noreferrer" onClick={trackSupportContact}>{copy.igContact}</a>
   </div>
  </section>

  <section className="section" id="contact">
   <div className="section-head"><div><h2 className="title2">{copy.bookTitle}</h2><p className="footnote">{copy.bookSub}</p></div></div>
   <div className="grouped">
    <a className="grouped-row is-link" href="https://www.instagram.com/jimframe/" target="_blank" rel="noreferrer"><span><Icon name="message"/>{copy.igBook}</span><b>@jimframe<Icon name="chevron"/></b></a><div className="grouped-row"><span><Icon name="camera"/>{copy.shootType}</span><b>{copy.types}</b></div><div className="grouped-row"><span><Icon name="pin"/>{copy.area}</span><b>{copy.taipei}</b></div>
   </div>
  </section>

  <footer className="footer"><span>© 2026 Jim Lin Photography</span><span>Taipei, Taiwan</span></footer>

  <nav className="tabbar" aria-label={copy.quick}>
   <a href="#top"><Icon name="star"/><span>{copy.navFeatured}</span></a><a href="#archive"><Icon name="albums"/><span>{copy.navAlbums}</span></a><a className="tab-story" href="/studio"><Icon name="photo"/><span>{copy.navStudio}</span></a><a href="#finder"><Icon name="faceSearch"/><span>{copy.navFind}</span></a><a href="#support"><Icon name="heart"/><span>{copy.navSupport}</span></a>
  </nav>

  {storyPhotoId&&<div className="story-maker-backdrop" onClick={event=>{if(event.target===event.currentTarget&&!storyWorking)setStoryPhotoId(null);}}>
   <section className="story-maker" role="dialog" aria-modal="true" aria-label={storyCopy.title}>
    <header><div><h2>{storyCopy.title}</h2><p>{storyCopy.sub}</p></div><button type="button" className="story-close" disabled={storyWorking} onClick={()=>setStoryPhotoId(null)}><Icon name="close"/></button></header>
    <div className="story-template-grid">
     {([{id:"full",label:storyCopy.full,note:storyCopy.fullNote},{id:"space",label:storyCopy.space,note:storyCopy.spaceNote},{id:"partner",label:storyCopy.partner,note:storyCopy.partnerNote}] as const).map(item=><button type="button" key={item.id} className={storyTemplate===item.id?"is-selected":""} onClick={()=>setStoryTemplate(item.id)}><span className={`story-template-preview is-${item.id}`}><img src={image(storyPhotoId,500)} alt=""/><i>{item.id==="partner"?storyCopy.partnerLine:item.id==="space"?"@ ______":"@jimframe"}</i></span><b>{item.label}</b><small>{item.note}</small></button>)}
    </div>
    <div className="story-caption-options"><b>{language==="en"?"Quick captions":language==="ko"?"빠른 문구":"快速限動文字"}</b>{[language==="zh"?"今晚的一支舞":"Tonight’s dance",language==="zh"?"找到我們的照片了 📷":"Found our dance photo 📷","Thanks for the dance!"].map(text=><button type="button" key={text} onClick={()=>void navigator.clipboard.writeText(`${text}\nPhoto by @jimframe`)}>{text}<span>{language==="ko"?"복사":"複製"}</span></button>)}</div>
    <p className="story-hint">{storyCopy.hint}</p>
    <div className="story-maker-actions"><button type="button" className="button button-gray" disabled={storyWorking} onClick={()=>void shareMatchStory(storyPhotoId,true)}>{storyCopy.download}</button><button type="button" className="button button-filled" disabled={storyWorking} onClick={()=>void shareMatchStory(storyPhotoId)}>{storyWorking?(language==="en"?"Creating…":language==="ko"?"제작 중…":"製作中…"):storyCopy.share}</button></div>
   </section>
  </div>}

  {selectedAlbum&&<div className="sheet-backdrop" onClick={event=>{if(event.target===event.currentTarget)closeAlbum();}}>
   <div className={`sheet ${activeAlbumPhoto?"is-viewer":""}`} role="dialog" aria-modal="true" aria-label={`${dateLabel(selectedAlbum.date)} ${selectedAlbum.venue} 相簿`}>
    {activeAlbumPhoto?<div className={`viewer ${editing?"is-editing":""}`}>
     <header className="viewer-bar">
      <button type="button" className="bar-button" onClick={leavePhoto}><Icon name="back"/>相簿</button>
      <div className="bar-title"><b>{selectedAlbum.venue}</b><span>2026.{dateLabel(selectedAlbum.date)}{activeIndex>=0?` · ${activeIndex+1} / ${selectedAlbum.images.length}`:""}</span></div>
      <button type="button" className={`bar-button ${editing?"is-strong":""}`} onClick={()=>setEditing(v=>!v)}>{editing?"完成":"編輯"}</button>
     </header>
     <div className="viewer-stage" onTouchStart={event=>{touchStart.current=event.touches[0]?.clientX??null;}} onTouchEnd={event=>{const start=touchStart.current;touchStart.current=null;if(start===null||editing)return;const dx=(event.changedTouches[0]?.clientX??start)-start;if(Math.abs(dx)>50)stepPhoto(dx<0?1:-1);}}>
      <button type="button" className="stage-arrow prev" onClick={()=>stepPhoto(-1)} aria-label="上一張"><Icon name="back"/></button>
      <img key={activeAlbumPhoto} {...previewProps(activeAlbumPhoto,image(activeAlbumPhoto,1800))} alt={`${selectedAlbum.venue} 照片`}/>
      <button type="button" className="stage-arrow next" onClick={()=>stepPhoto(1)} aria-label="下一張"><Icon name="chevron"/></button>
      {showOriginal&&<span className="stage-label">原圖</span>}
     </div>
     {editing?<div className="editor">
      <div className="segmented segmented-dark" role="tablist" aria-label="編輯工具">
       <button type="button" role="tab" aria-selected={editTab==="filters"} className={editTab==="filters"?"is-selected":""} onClick={()=>setEditTab("filters")}>濾鏡</button>
       <button type="button" role="tab" aria-selected={editTab==="adjust"} className={editTab==="adjust"?"is-selected":""} onClick={()=>setEditTab("adjust")}>調整</button>
      </div>
      {editTab==="filters"?<>
       <div className="filter-strip">{colorGrades.map(grade=><button type="button" key={grade.id} className={`filter ${activeGrade===grade.id?"is-selected":""}`} aria-pressed={activeGrade===grade.id} onClick={()=>setActiveGrade(grade.id)}>
        <img src={image(activeAlbumPhoto,200)} alt="" style={{filter:gradeThumbFilter(grade)}}/><span>{grade.label}</span>
       </button>)}</div>
       <label className="slider"><span>強度</span><input id="grade-mix" type="range" min="0" max="100" step="1" value={activeGrade==="original"?0:filterMix} disabled={activeGrade==="original"} onChange={event=>setFilterMix(Number(event.target.value))}/><output>{activeGrade==="original"?0:filterMix}</output></label>
      </>:<div className="adjust-list">
       {adjustmentLabels.map(control=><label className="slider" key={control.id}><span>{control.label}</span><input id={`adjust-${control.id}`} type="range" min={control.min} max={control.max} step="1" value={adjustments[control.id]} onChange={event=>setAdjustments(current=>({...current,[control.id]:Number(event.target.value)}))} onDoubleClick={()=>setAdjustments(current=>({...current,[control.id]:0}))}/><output>{adjustments[control.id]>0?"+":""}{adjustments[control.id]}</output></label>)}
       <button type="button" className="text-button" onClick={()=>setAdjustments(defaultAdjustments)} disabled={!Object.values(adjustments).some(value=>value!==0)}>全部重設</button>
      </div>}
      <div className="presets">
       <div className="presets-head"><b>我的調色</b><span><button type="button" className="text-button" onClick={exportGradeSettings} disabled={!savedGradeSettings.length}>匯出</button><button type="button" className="text-button" onClick={()=>presetFileInput.current?.click()}>匯入</button><input ref={presetFileInput} type="file" accept="application/json" hidden onChange={importGradeSettings}/></span></div>
       <div className="preset-row">
        {savedGradeSettings.map(item=><span className="preset" key={item.id}><button type="button" onClick={()=>applySavedGradeSetting(item)}>{item.name}</button><button type="button" aria-label={`刪除 ${item.name}`} onClick={()=>deleteSavedGradeSetting(item.id)}><Icon name="close"/></button></span>)}
        <span className="preset-new"><input id="preset-name" value={presetName} maxLength={36} placeholder="命名目前設定" onChange={event=>setPresetName(event.target.value)}/><button type="button" onClick={saveCurrentGradeSetting} disabled={!hasColorEdits(activeGrade,adjustments)}>儲存</button></span>
       </div>
      </div>
      <div className="editor-actions">
       <button type="button" className="button button-dark" {...compareProps}>按住比較原圖</button>
       <button type="button" className="button button-filled" disabled={isGenerating} onClick={()=>generateGradedPhoto(activeAlbumPhoto)}>{isGenerating?"正在輸出…":"儲存調色版（無損 PNG）"}</button>
      </div>
     </div>:<footer className="viewer-toolbar">
      <button type="button" className="tool" onClick={()=>sharePhoto(activeAlbumPhoto,`${dateLabel(selectedAlbum.date)} ${selectedAlbum.venue}`)} aria-label="分享"><Icon name="share"/></button>
      <button type="button" className={`tool ${likedPhotos.has(activeAlbumPhoto)?"is-liked":""}`} onClick={()=>toggleFavorite(activeAlbumPhoto)} aria-label={likedPhotos.has(activeAlbumPhoto)?"取消喜歡":"喜歡"}><Icon name={likedPhotos.has(activeAlbumPhoto)?"heartFill":"heart"}/></button>
      <button type="button" className="tool" onClick={()=>setEditing(true)} aria-label="調色"><Icon name="sliders"/></button>
      <button type="button" className="tool" onClick={()=>setStoryPhotoId(activeAlbumPhoto)} aria-label={copy.shareStory}><Icon name="photo"/></button>
      <button type="button" className="tool" onClick={()=>downloadPhoto(activeAlbumPhoto)} aria-label="下載原始照片"><Icon name="download"/></button>
     </footer>}
    </div>:<>
     <header className="sheet-bar">
      <button type="button" className="bar-button" onClick={closeAlbum}>完成</button>
      <div className="bar-title"><b>{selectedAlbum.venue}</b><span>2026.{dateLabel(selectedAlbum.date)} · {selectedAlbum.images.length} 張{albumLoading?" · 載入中…":""}</span></div>
      <button type="button" className="bar-button" onClick={()=>{setBatchMode(current=>!current);setSelectedPhotos(new Set());setBatchStatus("");}}>{batchMode?"取消":"選取"}</button>
     </header>
     {albumLoading&&<div className="sheet-loading-line" role="status" aria-label="正在載入相簿"/>}
     <div className={`photo-grid ${batchMode?"is-selecting":""}`}>
      {selectedAlbum.images.map((id,i)=>{const isSelected=selectedPhotos.has(id);return <button type="button" key={id} className={isSelected?"is-selected":""} aria-pressed={batchMode?isSelected:undefined} aria-label={`照片 ${i+1}`} onClick={()=>{if(batchMode){toggleBatchPhoto(id);return;}setActiveAlbumPhoto(id);setEditing(false);setActiveGrade("original");setAdjustments(defaultAdjustments);trackPhotoOpen(id);}}>
       <img src={image(id,500)} alt="" loading="lazy"/>
       {batchMode&&<i className="check" aria-hidden="true">{isSelected&&<Icon name="check"/>}</i>}
      </button>;})}
     </div>
     {batchMode?<footer className="sheet-toolbar" aria-live="polite">
      <button type="button" className="tool" onClick={shareBatch} disabled={!selectedPhotos.size||isBatchWorking} aria-label="分享選取的照片"><Icon name="share"/></button>
      <div className="toolbar-status"><b>{selectedPhotos.size?`已選取 ${selectedPhotos.size} 張`:"選取照片"}</b><span>{batchStatus||"下載最多 20 張 · 分享最多 10 張"}</span></div>
      <button type="button" className="tool" onClick={downloadBatch} disabled={!selectedPhotos.size||isBatchWorking} aria-label="下載選取的原檔"><Icon name="download"/></button>
     </footer>:<footer className="sheet-footer"><a href={`https://drive.google.com/drive/folders/${selectedAlbum.folder}`} target="_blank" rel="noreferrer">在 Google Drive 開啟<Icon name="external"/></a></footer>}
    </>}
   </div>
  </div>}
 </main>;
}
