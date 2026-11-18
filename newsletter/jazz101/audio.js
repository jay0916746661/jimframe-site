/* 爵士101「聽懂爵士」聲音示範：全部用 WebAudio 現場合成，不載入任何音檔 */
(function(){
var AC=window.AudioContext||window.webkitAudioContext, ctx=null, master=null, wet=null, bus=null;
var cur=null, timer=null, raf=null, loops=[];
function F(m){return 440*Math.pow(2,(m-69)/12)}
function init(){
  ctx=new AC(); master=ctx.createGain(); master.gain.value=.85;
  var lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=7000;
  var cp=ctx.createDynamicsCompressor(); cp.threshold.value=-14; cp.ratio.value=4;
  master.connect(lp); lp.connect(cp); cp.connect(ctx.destination);
  var cv=ctx.createConvolver(), len=ctx.sampleRate*1.8, ir=ctx.createBuffer(2,len,ctx.sampleRate);
  for(var c=0;c<2;c++){var d=ir.getChannelData(c);for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3)}
  cv.buffer=ir; wet=ctx.createGain(); wet.gain.value=.16; wet.connect(cv); cv.connect(cp);
}
function out(n){n.connect(bus); n.connect(wet)}
var NB=null;function noiseBuf(){if(NB)return NB;var b=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),d=b.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;return NB=b}
function noise(t,dur,type,freq,q,v,dec){var s=ctx.createBufferSource();s.buffer=noiseBuf();var f=ctx.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q||1;var g=ctx.createGain();
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+dec);s.connect(f);f.connect(g);out(g);s.start(t);s.stop(t+dec+.05)}
var INS={
 piano:function(t,m,d,v){[1,2.003,3.01].forEach(function(h,k){var o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=F(m)*h;
   var a=v*[1,.28,.08][k];g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a,t+.008);g.gain.exponentialRampToValueAtTime(a*.3,t+.4);g.gain.exponentialRampToValueAtTime(.0001,t+d+.3);
   o.connect(g);out(g);o.start(t);o.stop(t+d+.35)})},
 bass:function(t,m,d,v){var o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();o.type='triangle';o.frequency.value=F(m);f.type='lowpass';f.frequency.setValueAtTime(1400,t);f.frequency.exponentialRampToValueAtTime(380,t+.25);
   g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(v*.45,t+.18);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(f);f.connect(g);out(g);o.start(t);o.stop(t+d+.05)},
 lead:function(t,m,d,v){var o=ctx.createOscillator(),o2=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain(),lfo=ctx.createOscillator(),lg=ctx.createGain();
   o.type='sawtooth';o2.type='square';o.frequency.value=F(m);o2.frequency.value=F(m)*1.003;f.type='lowpass';f.Q.value=2;f.frequency.setValueAtTime(900,t);f.frequency.linearRampToValueAtTime(2200,t+.06);f.frequency.exponentialRampToValueAtTime(1100,t+d);
   lfo.frequency.value=5.2;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(F(m)*.006,t+Math.min(d,.5));lfo.connect(lg);lg.connect(o.frequency);
   var g2=ctx.createGain();g2.gain.value=.35;o2.connect(g2);g2.connect(f);
   g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.04);g.gain.setValueAtTime(v*.85,t+Math.max(.05,d-.06));g.gain.linearRampToValueAtTime(.0001,t+d+.04);
   o.connect(f);f.connect(g);out(g);[o,o2,lfo].forEach(function(x){x.start(t);x.stop(t+d+.08)})},
 ride:function(t,m,d,v){noise(t,0,'highpass',7000,.7,v*.5,.45);var o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.value=5200;g.gain.setValueAtTime(v*.03,t);g.gain.exponentialRampToValueAtTime(.0001,t+.3);o.connect(g);out(g);o.start(t);o.stop(t+.32)},
 hat:function(t,m,d,v){noise(t,0,'highpass',8000,.7,v*.35,.06)},
 brush:function(t,m,d,v){noise(t,0,'bandpass',4500,.6,v*.4,.18)},
 snare:function(t,m,d,v){noise(t,0,'bandpass',1900,.8,v*.7,.16);var o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(140,t+.08);g.gain.setValueAtTime(v*.4,t);g.gain.exponentialRampToValueAtTime(.0001,t+.1);o.connect(g);out(g);o.start(t);o.stop(t+.12)},
 tom:function(t,m,d,v){var o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(F(m),t);o.frequency.exponentialRampToValueAtTime(F(m)*.6,t+.25);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.3);o.connect(g);out(g);o.start(t);o.stop(t+.32)},
 kick:function(t,m,d,v){var o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.25);o.connect(g);out(g);o.start(t);o.stop(t+.27)}
};
/* 和弦工具 */
var PC={C:0,'C#':1,Db:1,D:2,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,Ab:8,A:9,Bb:10,B:11};
var Q={m7:[3,7,10,14],'7':[4,9,10,14],maj7:[4,7,11,14],m6:[3,7,9,14]};
function parse(c){var m=c.match(/^([A-G][b#]?)(.*)$/);return {r:PC[m[1]],q:m[2]||'maj7'}}
function voice(c){var p=parse(c),iv=Q[p.q]||Q.maj7;return iv.map(function(i){var n=48+p.r+i;while(n<52)n+=12;while(n>69)n-=12;return n}).sort(function(a,b){return a-b})}
function root(c,lo){var n=(lo||31)+((parse(c).r-((lo||31)%12))+12)%12;return n}
function third(c){return Q[parse(c).q][0]}
function walk(chs,beatsPer){var ev=[],b=0;chs.forEach(function(c,i){var r=root(c,31),nx=root(chs[(i+1)%chs.length],31),bp=beatsPer||4;
  var line=bp>=4?[r,r+third(c),r+7,nx+(nx>r+7?-1:1)]:[r,nx+(nx>r?-1:1)];
  if(bp>=4&&Math.random()<.4)line[1]=r+(Math.random()<.5?2:third(c));
  line.forEach(function(n,k){ev.push(['bass',b+k*(bp/line.length),n,.95*(bp/line.length),.5])});b+=bp});return ev}
function ride(beats,v){var e=[];for(var b=0;b<beats;b+=4){[0,1,1.5,2,3,3.5].forEach(function(x){e.push(['ride',b+x,0,0,(x%1?.5:.8)*(v||1)])});e.push(['hat',b+1,0,0,.8],['hat',b+3,0,0,.8])}return e}
function comp(chs,bp,pat){var e=[],b=0;chs.forEach(function(c){var vc=voice(c);(pat||[[0,1.6],[2.5,1]]).forEach(function(p){if(p[0]<bp)vc.forEach(function(n,k){e.push(['piano',b+p[0]+k*.004,n,p[1],.16])})});b+=bp});return e}
var PENTA=[60,62,64,67,69,72,74,76];
function phrase(start,len,scale){var e=[],t=start,end=start+len,i=Math.floor(Math.random()*4)+2;scale=scale||PENTA;
  while(t<end-.5){var d=Math.random()<.65?.5:(Math.random()<.5?1:1.5);if(t+d>end)d=end-t;if(Math.random()<.12){t+=.5;continue}
   i=Math.max(0,Math.min(scale.length-1,i+(Math.random()<.5?-1:1)*(Math.random()<.7?1:2)));e.push(['lead',t,scale[i],d*.92,.17]);t+=d}return e}
function cells(labels,beatsEach){var c=[],b=0;labels.forEach(function(l,i){c.push({t:b,i:i,l:l});b+=(beatsEach instanceof Array?beatsEach[i]:beatsEach)});return c}

var D={
 swing:{bpm:132,make:function(o){var ev=ride(8,.8),mel=[60,62,64,65,67,65,64,62,60,64,67,69,67,64,62,60];
   mel.forEach(function(n,k){ev.push(['lead',k*.5,n+12,.42,.16])});
   ev=ev.concat(walk(['C7','C7'],4));return {beats:8,ev:ev,swing:o==1?.67:.5,cells:cells(['1','&','2','&','3','&','4','&','1','&','2','&','3','&','4','&'],.5)}}},
 walking:{bpm:120,make:function(o){var ch=['Cmaj7','Am7','Dm7','G7'];var ev=ride(16,.7).concat(comp(ch,4,[[0,1.4],[2.5,.8]]));
   if(o==1)ev=ev.concat(walk(ch,4));else ch.forEach(function(c,i){var r=root(c,31);ev.push(['bass',i*4,r,1.9,.55],['bass',i*4+2,r+7,1.9,.5])});
   return {beats:16,ev:ev,swing:.67,cells:cells(ch,4)}}},
 blues:{bpm:o2bpm,make:function(o){var ch=['F7','Bb7','F7','F7','Bb7','Bb7','F7','D7','Gm7','C7','F7','C7'];var ev=ride(48,.7).concat(walk(ch,4)).concat(comp(ch,4,[[0,.6],[1.5,.4],[3,.6]]));
   return {beats:48,ev:ev,swing:.67,bpm:o==1?168:112,cells:cells(ch,4)}}},
 bluescale:{bpm:96,make:function(o){var s=o==1?[60,63,65,66,67,70,72]:[60,62,64,65,67,69,71,72],seq=s.concat(s.slice(0,-1).reverse()),ev=[];
   seq.forEach(function(n,k){ev.push(['lead',k*.5,n+12,.46,.17])});var L=Math.ceil(seq.length/2)*1+2;
   ev.push(['bass',0,36,L*.9,.45],['piano',0,48,L*.6,.08]);
   var lab=(o==1?['C','E♭','F','F♯','G','B♭','C']:['C','D','E','F','G','A','B','C']);var c=[];seq.forEach(function(n,k){c.push({t:k*.5,i:s.indexOf(n),l:''})});
   return {beats:L,ev:ev,swing:.5,cells:c,labels:lab}}},
 iivi:{bpm:100,make:function(o){var ch=o==1?['Dm7','G7','Dm7','G7']:['Dm7','G7','Cmaj7','Cmaj7'];var ev=comp(ch,4,[[0,3.6]]).concat(walk(ch,4)).concat(ride(16,.5));
   return {beats:16,ev:ev,swing:.67,cells:cells(ch,4)}}},
 giant:{bpm:o2bpm,make:function(o){var ch=['Bmaj7','D7','Gmaj7','Bb7','Ebmaj7','Am7','D7','Gmaj7','Bb7','Ebmaj7','F#7','Bmaj7','Fm7','Bb7'],bp=[2,2,2,2,4,2,2,2,2,2,2,4,2,2];
   var ev=[],b=0;ch.forEach(function(c,i){var r=root(c,31);voice(c).forEach(function(n,k){ev.push(['piano',b+k*.004,n,bp[i]*.85,.15])});ev.push(['bass',b,r,bp[i]*.48,.55],['bass',b+bp[i]/2,r+7,bp[i]*.48,.45]);b+=bp[i]});
   ev=ev.concat(ride(32,.6));return {beats:32,ev:ev,swing:.67,bpm:o==1?260:120,cells:cells(ch,bp)}}},
 comping:{bpm:126,make:function(o){var ch=['Dm7','G7','Cmaj7','A7'];var pat=o==1?[[.5,.4],[2,.5],[3.5,.6]]:[[0,.8],[1,.8],[2,.8],[3,.8]];
   var ev=ride(16,.6).concat(walk(ch,4)).concat(comp(ch,4,pat)).concat(phrase(0,16));return {beats:16,ev:ev,swing:.67,cells:cells(ch,4)}}},
 trading:{bpm:150,make:function(o){var ch=['C7','F7','C7','G7'];var ev=walk(ch,4).concat(ride(16,.6)).concat(comp(ch,4,[[1.5,.4],[3,.5]])).concat(phrase(0,15.5));
   for(var b=16;b<32;b+=.5){var r=Math.random();if(r<.32)ev.push(['snare',b,0,0,.3+Math.random()*.5]);else if(r<.5)ev.push(['tom',b,[45,40,36][Math.floor(Math.random()*3)],0,.55]);else if(r<.6)ev.push(['kick',b,0,0,.7]);if(b%1==0)ev.push(['ride',b,0,0,.5])}
   ev.push(['kick',16,0,0,.8]);return {beats:32,ev:ev,swing:.67,cells:cells(['薩克斯風 4 小節','鼓 4 小節'],16)}}},
 motif:{bpm:116,make:function(o){var m=[[0,67,1],[1,69,.5],[1.5,67,.5],[2,64,2]];
   var vars=[m, m.map(function(x){return [x[0],x[1]+5,x[2]]}), m.map(function(x,i){return [x[0]+.5,x[1],x[2]*.9]}), m.slice(0,2).concat(m.slice(0,2).map(function(x){return [x[0]+2,x[1]+2,x[2]]})), m.concat([[3,62,.5],[3.5,60,.5]]).map(function(x){return [x[0],x[1],Math.min(x[2],1)]})];
   var ev=[];vars.forEach(function(v,i){v.forEach(function(x){ev.push(['lead',i*8+x[0],x[1],x[2]*.9,.18])})});
   var ch=['C7','C7','F7','F7','C7','C7','G7','C7','C7','C7'];ev=ev.concat(walk(ch,4)).concat(ride(40,.5));
   return {beats:40,ev:ev,swing:.67,cells:cells(['原樣','整句移高','晚半拍進來','只留前半','尾巴加長'],8)}}},
 vamp:{bpm:96,make:function(o){var seq=[[45,52,57,60],[43,50,55,59],[41,48,53,57],[43,50,55,59]],ev=[];
   seq.forEach(function(c,i){for(var k=0;k<8;k++){var n=k%2?c[1]:c[0];ev.push(['piano',i*4+k*.5,n,.6,k%4==0?.2:.13])}ev.push(['piano',i*4,c[2],3.6,.08],['piano',i*4,c[3],3.6,.07])});
   ev=ev.concat(phrase(0,16,[64,67,69,71,72,74,76,79]).map(function(e){e[0]='piano';e[4]=.2;e[3]=Math.max(e[3],.6);return e}));
   return {beats:16,ev:ev,swing:.5,cells:cells(['Am','G','F','G'],4)}}}
};
function o2bpm(){return 120}

function sched(p,t0){var spb=60/(p.bpm),sw=p.swing;
  p.ev.forEach(function(e){var b=e[1],w=Math.floor(b+1e-6),f=b-w;if(sw!=.5&&Math.abs(f-.5)<1e-6)f=sw;var t=t0+(w+f)*spb;INS[e[0]](t,e[2],Math.max(.05,e[3]*spb),e[4])})}
function tick(){if(!cur)return;var now=ctx.currentTime;
  while(cur.next<now+.35){var p=D[cur.id].make(cur.o);p.bpm=p.bpm||D[cur.id].bpm;sched(p,cur.next);loops.push({t:cur.next,p:p});cur.next+=p.beats*60/p.bpm;if(loops.length>4)loops.shift()}}
function draw(){if(!cur)return;var now=ctx.currentTime,L=null;for(var i=loops.length-1;i>=0;i--)if(loops[i].t<=now){L=loops[i];break}
  if(L){var pos=(now-L.t)/(60/L.p.bpm),on=-1;L.p.cells.forEach(function(c){if(c.t<=pos+1e-3)on=c.i});
   cur.cells.forEach(function(el,i){el.classList.toggle('on',i===on)})}raf=requestAnimationFrame(draw)}
function stop(){if(!cur)return;clearInterval(timer);cancelAnimationFrame(raf);var b=bus;b.gain.setTargetAtTime(0,ctx.currentTime,.06);setTimeout(function(){b.disconnect()},500);
  cur.btn.classList.remove('playing');cur.btn.querySelector('span').textContent='播放';cur.btn.setAttribute('aria-pressed','false');cur.cells.forEach(function(el){el.classList.remove('on')});cur=null;loops=[]}
function start(card,o){if(!ctx)init();ctx.resume();bus=ctx.createGain();bus.gain.value=1;bus.connect(master);
  var btn=card.querySelector('.dplay');cur={id:card.dataset.demo,o:o,btn:btn,cells:[].slice.call(card.querySelectorAll('.cell')),next:ctx.currentTime+.08};
  btn.classList.add('playing');btn.querySelector('span').textContent='停止';btn.setAttribute('aria-pressed','true');tick();timer=setInterval(tick,60);draw()}
function setup(card){var id=card.dataset.demo;if(!D[id])return;var p=D[id].make(0),labs=p.labels||p.cells.map(function(c){return c.l}),box=card.querySelector('.cells');
  if(p.labels)box.classList.add('notes');box.innerHTML=labs.map(function(l){return '<span class="cell">'+l+'</span>'}).join('');
  function rebuild(o){var q=D[id].make(o),ls=q.labels||q.cells.map(function(c){return c.l});box.innerHTML=ls.map(function(l){return '<span class="cell">'+l+'</span>'}).join('')}
  var opts=[].slice.call(card.querySelectorAll('.opts button'));
  opts.forEach(function(b){b.addEventListener('click',function(){opts.forEach(function(x){x.classList.remove('on');x.setAttribute('aria-pressed','false')});b.classList.add('on');b.setAttribute('aria-pressed','true');
    var o=+b.dataset.o,was=cur&&cur.id===id;if(was)stop();rebuild(o);if(was)start(card,o)})});
  card.querySelector('.dplay').addEventListener('click',function(){var o=+(card.querySelector('.opts .on')||{dataset:{o:0}}).dataset.o;if(cur&&cur.id===id){stop();return}stop();start(card,o)})}
[].forEach.call(document.querySelectorAll('.demo'),setup);
})();
