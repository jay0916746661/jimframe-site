const {chromium}=require('/opt/npm-tools/node_modules/playwright');const fs=require('fs');
const K=['KolnConcert壞掉的鋼琴','SonnyRollins橋上練琴','Goodman卡內基1938','Newport1956二十七段獨奏','VanGelder客廳錄音室','GiantSteps卡住的鋼琴','WesMontgomery大拇指','ChetBaker重新學吹','jazz這個字來自棒球','聽懂爵士的地圖'];
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});const p=await b.newPage({viewport:{width:1080,height:1350}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/slides.html');fs.mkdirSync(__dirname+'/out',{recursive:true});
for(let e=0;e<10;e++)for(let i=0;i<4;i++){await p.evaluate(([e,i])=>show(e,i),[e,i]);await p.waitForTimeout(80);await p.locator('.c').screenshot({path:__dirname+'/out/'+K[e]+'_'+(i+1)+'.png'});}
console.log(errs);await b.close();})();
