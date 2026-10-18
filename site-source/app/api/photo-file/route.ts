import { NextRequest } from "next/server";
import { forbidden, isSameOriginRequest } from "../same-origin";

export async function GET(request:NextRequest){
 if(!isSameOriginRequest(request))return forbidden();
 const id=request.nextUrl.searchParams.get("id")??"";
 if(!/^[A-Za-z0-9_-]{10,}$/.test(id))return new Response("Invalid photo id",{status:400});
 const originalUrl=`https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`;
 let source=await fetch(originalUrl,{redirect:"follow"});
 const originalType=source.headers.get("content-type")??"";
 if(!source.ok||!source.body||!originalType.startsWith("image/")){
  source=await fetch(`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w4096`,{redirect:"follow"});
 }
 const type=source.headers.get("content-type")||"";
 // Drive answers with an HTML page when a file is private or over quota; never save that as a .jpg.
 if(!source.ok||!source.body||!type.startsWith("image/"))return new Response("Photo unavailable",{status:source.ok?502:source.status||502,headers:{"cache-control":"no-store"}});
 const extension=type.includes("png")?"png":type.includes("webp")?"webp":type.includes("heic")?"heic":"jpg";
 const headers:Record<string,string>={
  "content-type":type,
  "cache-control":"public, max-age=3600, s-maxage=86400",
  "content-disposition":`attachment; filename="JimFrame_${id.slice(0,10)}.${extension}"`,
  "x-jimframe-image-source":source.url.includes("drive.usercontent.google.com")?"original":"high-resolution-fallback"
 };
 const length=source.headers.get("content-length");
 if(length)headers["content-length"]=length;
 return new Response(source.body,{headers:{
  ...headers
 }});
}
