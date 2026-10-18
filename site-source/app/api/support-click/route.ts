import { env } from "cloudflare:workers";

export async function POST(){
 await env.DB.prepare("INSERT INTO click_events (event_type, created_at) VALUES (?, CURRENT_TIMESTAMP)")
  .bind("support_contact").run();
 return new Response(null,{status:204});
}
