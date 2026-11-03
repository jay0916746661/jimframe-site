const {chromium}=require('/opt/npm-tools/node_modules/playwright');const fs=require('fs');
const ep=+process.argv[2],mode=process.argv[3];
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});const errs=[];
const p=await b.newPage({viewport:{width:1080,height:1920}});p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/eng.html?ep='+ep);await p.waitForTimeout(600);
const TOTAL=await p.evaluate(()=>TOTAL);const dir=__dirname+'/f'+ep;
if(mode==='stills'){const ts=await p.evaluate(()=>ST.slice(0,-1).map((x,i)=>Math.min(x+2.2,ST[i+1]-0.3)));fs.mkdirSync(__dirname+'/st',{recursive:true});for(let i=0;i<ts.length;i++){await p.evaluate(t=>render(t),ts[i]);await p.screenshot({path:__dirname+'/st/e'+ep+'_'+i+'.jpg',type:'jpeg',quality:60});}}
if(mode==='frames'){fs.mkdirSync(dir,{recursive:true});const N=Math.round(TOTAL*30);for(let f=0;f<N;f++){await p.evaluate(t=>render(t),f/30);await p.screenshot({path:dir+'/f'+String(f).padStart(4,'0')+'.jpg',type:'jpeg',quality:88});}console.log('N',N);}
console.log('ep',ep,'errs',errs.slice(0,3));await b.close();})();
