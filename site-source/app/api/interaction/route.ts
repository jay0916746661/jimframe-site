import { env } from "cloudflare:workers";

const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const valuePattern=/^[A-Za-z0-9_-]{10,120}$/;
const allowed=new Set(["favorite","share","download"]);

export async function POST(request:Request){
  let sessionId="", targetId="", action="";
  try{
    const body=(await request.json()) as {sessionId?:unknown;targetId?:unknown;action?:unknown};
    if(typeof body.sessionId==="string"&&uuidPattern.test(body.sessionId)) sessionId=body.sessionId;
    if(typeof body.targetId==="string"&&valuePattern.test(body.targetId)) targetId=body.targetId;
    if(typeof body.action==="string"&&allowed.has(body.action)) action=body.action;
  }catch{return new Response(null,{status:400});}
  if(!sessionId||!targetId||!action)return new Response(null,{status:400});
  const eventType=`photo_${action}`;
  await env.DB.prepare(`INSERT INTO click_events (event_type, album_key, album_date, created_at)
    SELECT ?,?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (
      SELECT 1 FROM click_events WHERE event_type=? AND album_key=? AND album_date=?
    )`).bind(eventType,targetId,sessionId,eventType,targetId,sessionId).run();
  return new Response(null,{status:204});
}
