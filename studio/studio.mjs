import {autoPick,upgradePhotos,renderStories,renderCarousel,renderReel,buildCaptions,dateLabel,photoUrl} from './render.mjs';
import {makeStoredZip} from './zip.mjs';
import {languages,translate} from './i18n.mjs';
const $=id=>document.getElementById(id);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storage={get(k,f){try{return localStorage.getItem(k)??f;}catch{return f;}},set(k,v){try{localStorage.setItem(k,v);}catch{}}};
const guess=navigator.language?.startsWith('zh')?'zh':navigator.language?.startsWith('ko')?'ko':navigator.language?.startsWith('ja')?'ja':'en';
let lang=storage.get('jf_lang',guess);if(!languages.includes(lang))lang='zh';
const t=(key,values)=>translate(lang,key,values);
let albums=[],album=null,theme='night',picked=[],assets=[],excluded=new Set(),busy=false,tab='story';
let state={key:'loading',values:{}};
const status=(key,values={})=>{state={key,values};$('status').textContent=t(key,values);};
const progress=n=>$('progress').value=n;
const info=()=>({venue:album?.venue??'',date:album?.date??'',count:album?.images.length??0,siteUrl:$('site').value.trim(),handle:$('handle').value.trim(),headline:$('headline').value.trim()||t('defaultHeadline'),language:lang});
const clearAssets=()=>{assets.forEach(a=>URL.revokeObjectURL(a.url));assets=[];$('assets').replaceChildren();$('outputs').hidden=true;};
const closePhotos=()=>{picked.forEach(p=>p.img.close?.());picked=[];excluded=new Set();$('picked-area').hidden=true;};
const safeName=s=>s.replace(/[^\p{L}\p{N}_.-]/gu,'_');
const fileName=a=>`JimFrame_${album.date}_${safeName(album.venue)}_${lang}_${a.name}`;
function setBusy(value){busy=value;document.querySelectorAll('input,select,textarea,[data-lang],#themes button,#generate,#rerender,#picked button').forEach(el=>el.disabled=value);$('generate').disabled=value||!album;$('generate').textContent=t(value?'generating':'generate');}
function renderPicked(){
 $('picked-area').hidden=!picked.length;
 $('picked').innerHTML=picked.map((p,i)=>`<button type="button" data-pick="${i}" data-excluded="${excluded.has(p.id)?esc(t('excluded')):''}" class="${excluded.has(p.id)?'is-excluded':''}" aria-label="${esc(t('excluded'))} ${i+1}" aria-pressed="${excluded.has(p.id)}"><img src="${esc(photoUrl(p.id,900))}" alt="" loading="lazy"></button>`).join('');
 $('rerender').disabled=busy||picked.filter(p=>!excluded.has(p.id)).length<3;
}
function renderOutputs(){
 if(!assets.length){$('outputs').hidden=true;return;}
 $('outputs').hidden=false;
 $('tabs').innerHTML=['story','post','reel','caption'].map(k=>`<button type="button" role="tab" data-tab="${k}" aria-selected="${tab===k}" class="${tab===k?'is-selected':''}">${esc(t(k))}${k==='caption'?'':' '+assets.filter(a=>a.kind===k).length}</button>`).join('');
 const shown=assets.filter(a=>a.kind===tab);
 $('actions').hidden=tab==='caption'||!shown.length;
 $('assets').hidden=tab==='caption';$('captions').hidden=tab!=='caption';
 $('assets').className=`asset-grid kind-${tab}`;
 $('assets').innerHTML=shown.map(a=>`<figure class="asset">${a.kind==='reel'?`<video src="${esc(a.url)}" controls playsinline muted loop></video>`:`<img src="${esc(a.url)}" alt="${esc(a.name)}" width="${a.width}" height="${a.height}" loading="lazy">`}<figcaption><span>${a.width} × ${a.height}</span><a class="text-button" href="${esc(a.url)}" download="${esc(fileName(a))}">${esc(t('save'))}</a></figcaption></figure>`).join('');
 const captions=buildCaptions(info(),$('tags').value);
 $('captions').innerHTML=['story','post','reel','english','korean','japanese'].map(k=>`<article class="caption-card"><header><b>${esc(t(k))}</b><button type="button" class="text-button" data-copy="${k}">${esc(t('copy'))}</button></header><pre>${esc(captions[k])}</pre></article>`).join('');
}
function applyLanguage(){
 document.documentElement.lang=lang==='zh'?'zh-Hant':lang;
 document.title=`JimFrame · ${t('studio')}`;
 document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));
 document.querySelectorAll('[data-lang]').forEach(el=>{el.classList.toggle('is-selected',el.dataset.lang===lang);el.setAttribute('aria-pressed',String(el.dataset.lang===lang));});
 $('themes').innerHTML=['night','paper','mono','cobalt','warm','crush','halloween'].map(k=>`<button type="button" data-theme="${k}" aria-pressed="${theme===k}" class="${theme===k?'is-selected':''}">${esc(t(k))}</button>`).join('');
 $('status').textContent=t(state.key,state.values);
 $('album-note').textContent=album?t('albumNote',{n:album.images.length}):'';
 renderPicked();renderOutputs();setBusy(busy);
}
async function render(photos){
 clearAssets();status('upgrading');progress(55);
 const hi=await upgradePhotos(photos);
 // Close replaced bitmaps only after all new images have been obtained.
 for(let i=0;i<photos.length;i++)if(hi[i].img!==photos[i].img)photos[i].img.close?.();
 picked=hi;excluded=new Set();renderPicked();
 status('rendering');progress(65);
 const event=info();
 assets=[...await renderStories(hi,event,theme),...await renderCarousel(hi,event,theme)];
 renderOutputs();progress(75);
 if($('include-reel').checked){
  status('reeling');
  try{assets.push(await renderReel(hi,event,theme,p=>progress(75+Math.round(p*25))));}
  catch{status('reelFailed');progress(100);renderOutputs();return;}
 }
 progress(100);status('done',{stories:assets.filter(a=>a.kind==='story').length,posts:assets.filter(a=>a.kind==='post').length,reels:assets.filter(a=>a.kind==='reel').length});
 renderOutputs();
}
$('generate').addEventListener('click',async()=>{
 if(busy||!album)return;
 if(typeof OffscreenCanvas==='undefined'||typeof createImageBitmap==='undefined'){status('unsupported');return;}
 setBusy(true);progress(1);clearAssets();closePhotos();status('picking');
 try{
  const photos=await autoPick(album.images,12,new Set(),(done,total)=>progress(2+Math.round(done/total*48)));
  if(photos.length<3){photos.forEach(p=>p.img.close?.());throw Error('not enough photos');}
  picked=photos;await render(photos);
 }catch(error){console.error('Studio generation failed',error);status('failed');}
 finally{setBusy(false);renderPicked();}
});
$('rerender').addEventListener('click',async()=>{
 if(busy)return;const keep=picked.filter(p=>!excluded.has(p.id));
 if(keep.length<3){status('needPhotos');return;}
 picked.filter(p=>excluded.has(p.id)).forEach(p=>p.img.close?.());picked=keep;
 setBusy(true);try{await render(keep);}catch(error){console.error('Studio render failed',error);status('failed');}finally{setBusy(false);renderPicked();}
});
$('picked').addEventListener('click',e=>{const b=e.target.closest('[data-pick]');if(!b||busy)return;const p=picked[Number(b.dataset.pick)];if(excluded.has(p.id))excluded.delete(p.id);else excluded.add(p.id);renderPicked();});
$('album').addEventListener('change',()=>{clearAssets();closePhotos();album=albums.find(a=>a.key===$('album').value);progress(0);status('ready');applyLanguage();});
$('themes').addEventListener('click',e=>{const b=e.target.closest('[data-theme]');if(!b||busy)return;theme=b.dataset.theme;applyLanguage();});
$('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b){tab=b.dataset.tab;renderOutputs();}});
for(const b of document.querySelectorAll('[data-lang]'))b.addEventListener('click',()=>{
 if(busy||b.dataset.lang===lang)return;
 const wasDefault=$('headline').value===t('defaultHeadline');lang=b.dataset.lang;storage.set('jf_lang',lang);
 if(wasDefault)$('headline').value=t('defaultHeadline');
 if(assets.length){clearAssets();status('languageChanged');}
 applyLanguage();
});
for(const id of ['handle','site','tags']){const key='studio_'+id;$(id).value=storage.get(key,$(id).value);$(id).addEventListener('input',()=>{storage.set(key,$(id).value);if(tab==='caption')renderOutputs();});}
$('headline').value=t('defaultHeadline');
if(!$('site').value)$('site').value=new URL('../',location.href).href;
async function downloadZip(list){
 if(!list.length)return;
 const entries=await Promise.all(list.map(async a=>({name:fileName(a),data:new Uint8Array(await a.blob.arrayBuffer())})));
 const url=URL.createObjectURL(makeStoredZip(entries));const a=document.createElement('a');a.href=url;a.download=`JimFrame_${album.date}_${lang}_${tab}.zip`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
$('zip').addEventListener('click',()=>downloadZip(assets.filter(a=>a.kind===tab)).catch(()=>status('shareFailed')));
$('share').addEventListener('click',async()=>{
 const list=assets.filter(a=>a.kind===tab);if(!list.length)return;
 const files=list.map(a=>new File([a.blob],fileName(a),{type:a.blob.type}));
 try{
  if(navigator.canShare?.({files})&&navigator.share){await navigator.share({files,title:`${album.venue} · ${dateLabel(album.date)}`});return;}
  await downloadZip(list);status('shareFallback');
 }catch(error){if(error.name!=='AbortError')status('shareFailed');}
});
$('captions').addEventListener('click',async e=>{const b=e.target.closest('[data-copy]');if(!b)return;try{await navigator.clipboard.writeText(buildCaptions(info(),$('tags').value)[b.dataset.copy]);b.textContent=t('copied');}catch{status('copyFailed');}});
applyLanguage();
try{
 const response=await fetch(new URL('./albums.json',import.meta.url));if(!response.ok)throw Error('album list');
 albums=await response.json();if(!Array.isArray(albums)||!albums.length)throw Error('no albums');
 album=albums[0];$('album').innerHTML=albums.map(a=>`<option value="${esc(a.key)}">${dateLabel(a.date)} · ${esc(a.venue)}</option>`).join('');
 status('ready');applyLanguage();
}catch(error){console.error('Studio albums failed',error);status('loadFail');}
