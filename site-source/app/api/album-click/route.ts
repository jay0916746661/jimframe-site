import { env } from "cloudflare:workers";

const venues=new Set(["Flow","Barcade","La Salsa","Odoro","Zouk"]);

export async function POST(request:Request){
 const body=await request.json().catch(()=>null) as {album?:string;venue?:string;date?:string}|null;
 if(!body||!/^\d{4}-(Flow|Barcade|La Salsa|Odoro|Zouk)$/.test(body.album??"")||!venues.has(body.venue??"")||!/^\d{4}$/.test(body.date??""))return new Response("Invalid album",{status:400});
 await env.DB.prepare("INSERT INTO click_events (event_type, album_key, venue, album_date, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)").bind("album_click",body.album,body.venue,`2026-${body.date!.slice(0,2)}-${body.date!.slice(2)}`).run();
 return Response.json({ok:true});
}
