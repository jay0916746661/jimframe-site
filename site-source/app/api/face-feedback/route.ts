import { env } from "cloudflare:workers";
import { forbidden, isSameOriginRequest } from "../same-origin";

const photoPattern=/^[A-Za-z0-9_-]{10,120}$/;
const albumPattern=/^\d{4}-(Flow|Barcade|La Salsa|Odoro|Zouk|Bachata Crush)$/;
const visitorPattern=/^[A-Za-z0-9_-]{8,80}$/;
const MODEL="sface-1";

let tableReady:Promise<unknown>|null=null;
const ensureTable=()=>tableReady??=env.DB.batch([
 env.DB.prepare(`CREATE TABLE IF NOT EXISTS face_match_feedback (
  id integer PRIMARY KEY AUTOINCREMENT,
  visitor_id text NOT NULL,
  photo_id text NOT NULL,
  album_key text NOT NULL,
  model text NOT NULL,
  distance real NOT NULL,
  confidence_band text NOT NULL,
  created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(visitor_id,photo_id,model)
 )`),
 env.DB.prepare("CREATE INDEX IF NOT EXISTS face_match_feedback_photo_idx ON face_match_feedback(photo_id)"),
 env.DB.prepare("CREATE INDEX IF NOT EXISTS face_match_feedback_distance_idx ON face_match_feedback(model,distance)"),
]).catch(error=>{tableReady=null;throw error;});

export async function POST(request:Request){
 if(!isSameOriginRequest(request))return forbidden();
 const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
 const photoId=String(body?.photoId??"");
 const albumKey=String(body?.albumKey??"");
 const visitorId=String(body?.visitorId??"");
 const model=String(body?.model??"");
 const distance=Number(body?.distance);
 if(!photoPattern.test(photoId)||!albumPattern.test(albumKey)||!visitorPattern.test(visitorId)||model!==MODEL||!Number.isFinite(distance)||distance<0||distance>2)return Response.json({error:"Invalid feedback"},{status:400});
 const confidenceBand=distance<=.31?"strong":distance<=.39?"likely":"weak";
 try{
  await ensureTable();
  await env.DB.prepare(`INSERT INTO face_match_feedback(visitor_id,photo_id,album_key,model,distance,confidence_band,created_at)
   VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)
   ON CONFLICT(visitor_id,photo_id,model) DO UPDATE SET distance=excluded.distance,confidence_band=excluded.confidence_band,created_at=CURRENT_TIMESTAMP`)
   .bind(visitorId,photoId,albumKey,model,distance,confidenceBand).run();
  return Response.json({ok:true});
 }catch(error){console.error("face feedback unavailable",error);return Response.json({error:"Feedback unavailable"},{status:503});}
}
