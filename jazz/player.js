
(function(){
  var btn=document.getElementById('play'); if(!btn) return;
  var stage=document.getElementById('stage'), ctx=null, playing=false, timer=null, master=null;
  // ii–V–I in C（Dm9 → G13 → Cmaj9 → A7b9），搖擺八分音符的低音
  var prog=[[50,53,57,60,64],[43,53,57,59,64],[48,52,55,59,62],[45,49,55,58,61]];
  var bass=[[38,41,45,43],[31,35,38,40],[36,40,43,45],[33,37,40,43]];
  function f(m){return 440*Math.pow(2,(m-69)/12)}
  function note(m,t,d,v,type){
    var o=ctx.createOscillator(),g=ctx.createGain(),o2=ctx.createOscillator(),g2=ctx.createGain();
    o.type=type||'sine';o.frequency.value=f(m);o2.type='sine';o2.frequency.value=f(m)*2.002;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.012);g.gain.exponentialRampToValueAtTime(v*.35,t+.35);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    g2.gain.setValueAtTime(v*.25,t);g2.gain.exponentialRampToValueAtTime(.0001,t+.5);
    o.connect(g);o2.connect(g2);g.connect(master);g2.connect(master);o.start(t);o2.start(t);o.stop(t+d+.05);o2.stop(t+.6);
  }
  function brush(t){var n=ctx.createBufferSource(),b=ctx.createBuffer(1,ctx.sampleRate*.12,ctx.sampleRate),d=b.getChannelData(0);
    for(var i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
    var hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=5000;var g=ctx.createGain();g.gain.value=.05;
    n.buffer=b;n.connect(hp);hp.connect(g);g.connect(master);n.start(t);}
  function bar(t,i){var beat=60/112,sw=beat*2/3;
    prog[i].forEach(function(m,k){note(m,t+k*.012,beat*3.6,.06)});
    prog[i].forEach(function(m){note(m,t+beat*2+sw,beat*1.2,.035)});
    bass[i].forEach(function(m,k){note(m,t+k*beat,beat*.95,.16,'triangle')});
    for(var k=0;k<4;k++){brush(t+k*beat);brush(t+k*beat+sw*.5+beat*.5)}}
  function loop(){var t=ctx.currentTime+.05,len=60/112*4;for(var i=0;i<4;i++)bar(t+i*len,i);timer=setTimeout(loop,len*4*1000-60)}
  btn.addEventListener('click',function(){
    if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=.9;
      var lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3800;master.disconnect();master.connect(lp);lp.connect(ctx.destination);}
    playing=!playing;
    if(playing){ctx.resume();master.gain.setTargetAtTime(.9,ctx.currentTime,.05);loop();stage.classList.add('spin');btn.setAttribute('aria-pressed','true');btn.querySelector('span').textContent='停下來';btn.querySelector('path').setAttribute('d','M3 1.5h3v11H3zM8 1.5h3v11H8z');}
    else{clearTimeout(timer);master.gain.setTargetAtTime(0,ctx.currentTime,.15);stage.classList.remove('spin');btn.setAttribute('aria-pressed','false');btn.querySelector('span').textContent='放一段二五一';btn.querySelector('path').setAttribute('d','M3 1.5v11l9-5.5z');
      setTimeout(function(){if(!playing){ctx.close();ctx=null}},600);}
  });
})();
