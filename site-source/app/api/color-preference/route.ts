import { env } from "cloudflare:workers";

const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const photoPattern=/^[A-Za-z0-9_-]{10,120}$/;
const grades=new Set(["portra","classic-chrome","gold-daylight","vision3","teal-orange","bw-silver"]);
const adjustmentKeys=["exposure","highlights","shadows","contrast","saturation","warmth"] as const;

export async function POST(request:Request){
 let sessionId="",photoId="",grade="",mix=0,adjustments:Record<string,number>={};
 try{
  const body=(await request.json()) as {sessionId?:unknown;photoId?:unknown;grade?:unknown;mix?:unknown;adjustments?:unknown};
  if(typeof body.sessionId==="string"&&uuidPattern.test(body.sessionId))sessionId=body.sessionId;
  if(typeof body.photoId==="string"&&photoPattern.test(body.photoId))photoId=body.photoId;
  if(typeof body.grade==="string"&&grades.has(body.grade))grade=body.grade;
  if(typeof body.mix==="number"&&Number.isFinite(body.mix))mix=Math.round(Math.max(0,Math.min(100,body.mix)));
  if(body.adjustments&&typeof body.adjustments==="object")adjustments=body.adjustments as Record<string,number>;
 }catch{return new Response(null,{status:400});}
 if(!sessionId||!photoId||!grade)return new Response(null,{status:400});
 const compact=adjustmentKeys.map(key=>Math.round(Math.max(-100,Math.min(100,Number(adjustments[key])||0)))).join(",");
 await env.DB.prepare("INSERT INTO click_events (event_type, album_key, venue, album_date, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)")
  .bind("color_preference",grade,String(mix),compact).run();
 return new Response(null,{status:204});
}
