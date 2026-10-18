import { env } from "cloudflare:workers";

type PopularRow={photo_id:string;focus_seconds:number;opens:number;viewers:number;favorites:number;shares:number;downloads:number;score:number};

export async function GET(){
 const result=await env.DB.prepare(`SELECT album_key AS photo_id,
  SUM(CASE WHEN event_type='photo_focus' THEN CAST(venue AS INTEGER) ELSE 0 END) AS focus_seconds,
  SUM(CASE WHEN event_type='photo_open' THEN 1 ELSE 0 END) AS opens,
  SUM(CASE WHEN event_type='photo_favorite' THEN 1 ELSE 0 END) AS favorites,
  SUM(CASE WHEN event_type='photo_share' THEN 1 ELSE 0 END) AS shares,
  SUM(CASE WHEN event_type='photo_download' THEN 1 ELSE 0 END) AS downloads,
  COUNT(DISTINCT album_date) AS viewers,
  SUM(CASE
    WHEN event_type='photo_share' THEN 14
    WHEN event_type='photo_download' THEN 11
    WHEN event_type='photo_favorite' THEN 8
    WHEN event_type='photo_open' THEN 3
    WHEN event_type='photo_focus' THEN MIN(CAST(venue AS INTEGER),30)*0.18
    ELSE 0 END)
   + SUM(CASE WHEN datetime(created_at)>=datetime('now','-30 days') THEN
      CASE WHEN event_type='photo_share' THEN 7 WHEN event_type='photo_download' THEN 5
           WHEN event_type='photo_favorite' THEN 4 WHEN event_type='photo_open' THEN 1 ELSE 0 END
     ELSE 0 END) AS score
  FROM click_events WHERE event_type IN ('photo_focus','photo_open','photo_favorite','photo_share','photo_download') AND album_key IS NOT NULL
   AND album_key NOT IN ('1ZsVTL2RDBaSFGzcbUpEr83LRh_A3f6Sd')
  GROUP BY album_key
  HAVING SUM(CASE WHEN event_type='photo_open' THEN 1 ELSE 0 END)>=1
  ORDER BY score DESC,opens DESC,focus_seconds DESC LIMIT 24`).all<PopularRow>();
 const items=result.results.map(row=>({id:row.photo_id,focusSeconds:Number(row.focus_seconds),opens:Number(row.opens),viewers:Number(row.viewers),favorites:Number(row.favorites),shares:Number(row.shares),downloads:Number(row.downloads),score:Number(row.score)}));
 return Response.json(items,{headers:{"cache-control":"public, max-age=300"}});
}
