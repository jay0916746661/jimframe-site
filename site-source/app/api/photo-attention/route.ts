import { env } from "cloudflare:workers";

const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const photoIdPattern=/^[A-Za-z0-9_-]{10,80}$/;

export async function POST(request:Request){
 let sessionId="",photoId="",action="",seconds=0;
 try{
  const body=(await request.json()) as {sessionId?:unknown;photoId?:unknown;action?:unknown;seconds?:unknown};
  if(typeof body.sessionId==="string"&&uuidPattern.test(body.sessionId))sessionId=body.sessionId;
  if(typeof body.photoId==="string"&&photoIdPattern.test(body.photoId))photoId=body.photoId;
  if(body.action==="focus"||body.action==="open")action=body.action;
  if(typeof body.seconds==="number"&&Number.isInteger(body.seconds))seconds=body.seconds;
 }catch{return new Response(null,{status:400});}
 if(!sessionId||!photoId||!action)return new Response(null,{status:400});

 if(action==="open"){
  await env.DB.prepare(`INSERT INTO click_events (event_type,album_key,album_date,created_at)
   SELECT 'photo_open',?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (
    SELECT 1 FROM click_events WHERE event_type='photo_open' AND album_key=? AND album_date=?
   )`).bind(photoId,sessionId,photoId,sessionId).run();
 }else{
  if(seconds<3||seconds>21600)return new Response(null,{status:400});
  await env.DB.batch([
   env.DB.prepare(`INSERT INTO click_events (event_type,album_key,venue,album_date,created_at)
    SELECT 'photo_focus',?,?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (
     SELECT 1 FROM click_events WHERE event_type='photo_focus' AND album_key=? AND album_date=?
    )`).bind(photoId,String(seconds),sessionId,photoId,sessionId),
   env.DB.prepare(`UPDATE click_events SET venue=CASE WHEN CAST(venue AS INTEGER)<? THEN ? ELSE venue END
    WHERE event_type='photo_focus' AND album_key=? AND album_date=?`).bind(seconds,String(seconds),photoId,sessionId),
  ]);
 }
 return new Response(null,{status:204});
}
