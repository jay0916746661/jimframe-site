import { env } from "cloudflare:workers";

type FaceIndexRow = { photo_id:string; descriptors:string };
const TABLE = "face_embeddings_sf";

// Two confirmed photos with the same person but different partners. Comparing
// the faces common to both photos isolates the requested person instead of
// suppressing everyone who happened to dance with them.
const SEED_PHOTO_IDS = [
  "1SYTXPdBBpO9hWd7Y4PfSF5j3bPFpjweY",
  "1tEZZVU0XYPj5JMqKqLXf_cfO5W7lcZ1G",
] as const;
// Homepage suppression can be slightly more inclusive than the public search:
// a missed photo is more harmful here than hiding one extra photo from promo.
const HOME_HIDE_SCORE = 0.34;

const parseFaces = (value:string) => {
  try {
    const parsed=JSON.parse(value) as unknown;
    if(!Array.isArray(parsed))return [] as number[][];
    return parsed.filter((face):face is number[]=>Array.isArray(face)&&face.length===128&&face.every(Number.isFinite));
  } catch { return [] as number[][]; }
};
const cosine=(left:number[],right:number[])=>left.reduce((sum,value,index)=>sum+value*right[index],0);

export async function GET(){
  const seedSet=new Set<string>(SEED_PHOTO_IDS);
  try{
    const rows=(await env.DB.prepare(`SELECT photo_id, descriptors FROM ${TABLE}`).all<FaceIndexRow>()).results;
    const first=parseFaces(rows.find(row=>row.photo_id===SEED_PHOTO_IDS[0])?.descriptors??"[]");
    const second=parseFaces(rows.find(row=>row.photo_id===SEED_PHOTO_IDS[1])?.descriptors??"[]");
    let references:number[][]=[];
    if(first.length&&second.length){
      let referencePair:[number[],number[]]|null=null;
      let referenceScore=-1;
      for(const left of first)for(const right of second){
        const score=cosine(left,right);
        if(score>referenceScore){referenceScore=score;referencePair=[left,right];}
      }
      if(referencePair&&referenceScore>=0.15)references=referencePair;
    }
    if(!references.length){
      // A newly added seed may not be in the shared index yet. From the
      // available seed, choose the face that recurs in the most indexed photos;
      // the dance partner in one frame is usually a one-off, while the person
      // being suppressed appears across many frames.
      const available=first.length?first:second;
      let best:number[]|null=null,bestCount=-1;
      for(const candidate of available){
        let count=0;
        for(const row of rows)if(parseFaces(row.descriptors).some(face=>cosine(candidate,face)>=0.38))count++;
        if(count>bestCount){best=candidate;bestCount=count;}
      }
      if(best)references=[best];
    }
    if(!references.length)return Response.json({ids:[...seedSet],indexed:rows.length,automatic:false},{headers:{"cache-control":"public, max-age=60"}});

    for(const row of rows){
      const faces=parseFaces(row.descriptors);
      const matched=faces.some(face=>{
        const scores=references.map(reference=>cosine(reference,face)).sort((a,b)=>b-a);
        const score=scores.length>1?scores[0]*.75+scores[1]*.25:scores[0];
        return score>=HOME_HIDE_SCORE;
      });
      if(matched)seedSet.add(row.photo_id);
    }
    return Response.json({ids:[...seedSet],indexed:rows.length,automatic:true},{headers:{"cache-control":"public, max-age=600"}});
  }catch(error){
    console.error("home face exclusions unavailable",error);
    return Response.json({ids:[...seedSet],indexed:0,automatic:false},{headers:{"cache-control":"no-store"}});
  }
}
