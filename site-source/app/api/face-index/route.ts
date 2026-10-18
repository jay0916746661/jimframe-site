import { env } from "cloudflare:workers";
import { allowedCrossOrigin, corsPreflight, forbidden, isSameOriginRequest, withCors } from "../same-origin";

type FaceIndexRow={photo_id:string;album_key:string;descriptors:string;image_hash:string};
const photoPattern=/^[A-Za-z0-9_-]{10,120}$/;
const albumPattern=/^\d{4}-(Flow|Barcade|La Salsa|Odoro|Zouk|Bachata Crush)$/;
const hashPattern=/^[01]{64}$/;
// A 64-bit dHash only counts as "the same picture" when nearly identical.
// Looser values make dark club photos collide with dark selfies.
const EXACT_HASH_DISTANCE=5;
// SFace embeddings (unit length, 128-d). Scores are mean cosine similarity over the
// visitor's reference photos; only clear candidates go back to the browser.
const MODEL="sface-1";
const CANDIDATE_SCORE=.27;
const TABLE="face_embeddings_sf";
const validDescriptors=(value:unknown):value is number[][]=>Array.isArray(value)&&value.length<=12&&value.every(item=>Array.isArray(item)&&item.length===128&&item.every(number=>typeof number==="number"&&Number.isFinite(number)&&number>=-2&&number<=2));

// face-api descriptors (old table face_embeddings) are not comparable with SFace,
// so SFace data lives in its own table. Created on demand.
let tableReady:Promise<unknown>|null=null;
const ensureTable=()=>tableReady??=env.DB.batch([
 env.DB.prepare(`CREATE TABLE IF NOT EXISTS \`${TABLE}\` (\`photo_id\` text PRIMARY KEY NOT NULL,\`album_key\` text NOT NULL,\`descriptors\` text NOT NULL,\`image_hash\` text NOT NULL,\`updated_at\` text DEFAULT CURRENT_TIMESTAMP NOT NULL)`),
 env.DB.prepare(`CREATE INDEX IF NOT EXISTS \`${TABLE}_album_idx\` ON \`${TABLE}\` (\`album_key\`)`),
]).catch(error=>{tableReady=null;throw error;});

export const OPTIONS=(request:Request)=>corsPreflight(request,"POST");

export async function POST(request:Request){
 // The GitHub Pages copy may search (read) the index; only this site may write to it.
 const crossOrigin=isSameOriginRequest(request)?null:allowedCrossOrigin(request);
 if(!isSameOriginRequest(request)&&!crossOrigin)return forbidden();
 return withCors(await handle(request,Boolean(crossOrigin)),crossOrigin);
}

async function handle(request:Request,readOnly:boolean){
 const body=await request.json().catch(()=>null) as {model?:unknown;items?:unknown;queryDescriptors?:unknown;queryHashes?:unknown}|null;
 // Reject data from pages still running the old face-api build (stale tabs / caches).
 if(!body||body.model!==MODEL)return Response.json({error:"Outdated page, please reload",matches:[],indexed:0},{status:409});
 try{await ensureTable();}catch(error){console.error("face_embeddings unavailable",error);return Response.json({error:"Index unavailable",matches:[],indexed:0},{status:503});}
 if(body&&validDescriptors(body.queryDescriptors)&&Array.isArray(body.queryHashes)&&body.queryHashes.length<=3&&body.queryHashes.every(hash=>typeof hash==="string"&&hashPattern.test(hash))){
  const rows=(await env.DB.prepare(`SELECT photo_id,album_key,descriptors,image_hash FROM ${TABLE}`).all<FaceIndexRow>()).results;
  const queries=body.queryDescriptors;const hashes=body.queryHashes as string[];
  const hamming=(left:string,right:string)=>{let distance=0;for(let index=0;index<64;index++)if(left[index]!==right[index])distance++;return distance;};
  const dot=(left:number[],right:number[])=>{let sum=0;for(let index=0;index<128;index++)sum+=left[index]*right[index];return sum;};
  const matches=rows.flatMap(row=>{try{
   const visualDistance=hashes.length?Math.min(...hashes.map(hash=>hamming(hash,row.image_hash))):64;
   if(visualDistance<=EXACT_HASH_DISTANCE)return [{id:row.photo_id,albumKey:row.album_key,distance:visualDistance/100,exact:true}];
   if(!queries.length||row.descriptors==="[]")return [];
   const descriptors=JSON.parse(row.descriptors) as number[][];
   if(!Array.isArray(descriptors)||!descriptors.length)return [];
   // Best reference carries most of the score so one weak side-profile does not
   // suppress an otherwise correct match. Extra references still add evidence.
   let score=-1;for(const descriptor of descriptors){const scores=queries.map(query=>dot(query,descriptor)).sort((a,b)=>b-a);const support=scores.length>1?scores.slice(1).reduce((sum,value)=>sum+value,0)/(scores.length-1):scores[0];score=Math.max(score,scores[0]*.75+support*.25);}
   return score>=CANDIDATE_SCORE?[{id:row.photo_id,albumKey:row.album_key,distance:1-score}]:[];
  }catch{return [];}}).sort((a,b)=>Number(Boolean(b.exact))-Number(Boolean(a.exact))||a.distance-b.distance).slice(0,48);
  return Response.json({matches,indexed:rows.length},{headers:{"cache-control":"no-store"}});
 }
 if(readOnly)return forbidden();
 if(!body||!Array.isArray(body.items)||body.items.length<1||body.items.length>40)return Response.json({error:"Invalid batch"},{status:400});
 const items=body.items.filter((item):item is {id:string;albumKey:string;descriptors:number[][];imageHash:string}=>Boolean(item)&&typeof item==="object"&&photoPattern.test(String((item as Record<string,unknown>).id??""))&&albumPattern.test(String((item as Record<string,unknown>).albumKey??""))&&hashPattern.test(String((item as Record<string,unknown>).imageHash??""))&&validDescriptors((item as Record<string,unknown>).descriptors));
 if(!items.length)return Response.json({error:"No valid records"},{status:400});
 // Upsert: a newer scan (more faces found) replaces an older, weaker one,
 // but never overwrite found faces with an empty result.
 await env.DB.batch(items.map(item=>env.DB.prepare(`INSERT INTO ${TABLE}(photo_id,album_key,descriptors,image_hash,updated_at) VALUES(?,?,?,?,CURRENT_TIMESTAMP)
  ON CONFLICT(photo_id) DO UPDATE SET album_key=excluded.album_key,image_hash=excluded.image_hash,descriptors=excluded.descriptors,updated_at=CURRENT_TIMESTAMP
  WHERE json_array_length(excluded.descriptors)>=json_array_length(${TABLE}.descriptors)`).bind(item.id,item.albumKey,JSON.stringify(item.descriptors),item.imageHash)));
 return Response.json({ok:true,saved:items.length});
}
