/* chord diagram: f = 6 entries low E -> high E, 'x' muted, 0 open, n fret; base = first fret shown */
function chordSVG(o){
  var W=o.w||600,H=o.h||700,f=o.f,base=o.base||1,nf=o.nf||5,lab=o.notes||[],hl=o.hl==null?-1:o.hl,hot=o.hot||[];
  var L=W*0.17,R=W*0.9,top=H*0.22,bot=H*0.8,sw=(R-L)/5,fh=(bot-top)/nf,s='';
  s+='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" xmlns="http://www.w3.org/2000/svg">';
  if(base===1)s+='<rect x="'+(L-4)+'" y="'+(top-14)+'" width="'+(R-L+8)+'" height="14" fill="#E6EAEE"/>';
  else s+='<text x="'+(L-22)+'" y="'+(top+fh*0.62)+'" text-anchor="end" font-size="'+(W*0.075)+'" font-family="DejaVu Sans" font-weight="bold" fill="#9AA6B2">'+base+'</text>';
  for(var k=0;k<=nf;k++)s+='<line x1="'+L+'" x2="'+R+'" y1="'+(top+k*fh)+'" y2="'+(top+k*fh)+'" stroke="#5d6b7a" stroke-width="3"/>';
  var gl=o.glow||[];for(var i=0;i<6;i++){var x=L+i*sw;if(gl[i]>0.02)s+='<line x1="'+x+'" x2="'+x+'" y1="'+top+'" y2="'+bot+'" stroke="#E3A544" stroke-width="'+(10+gl[i]*8)+'" opacity="'+(gl[i]*0.8)+'"/>';s+='<line x1="'+x+'" x2="'+x+'" y1="'+top+'" y2="'+bot+'" stroke="#9AA6B2" stroke-width="'+(4.5-i*0.5)+'"/>';}
  /* barre */
  if(o.barre){var b=o.barre,y=top+(b.fret-base+0.5)*fh;s+='<rect x="'+(L+b.from*sw-sw*0.32)+'" y="'+(y-sw*0.3)+'" width="'+((b.to-b.from)*sw+sw*0.64)+'" height="'+(sw*0.6)+'" rx="'+(sw*0.3)+'" fill="#E3A544" opacity="0.35"/>';}
  for(i=0;i<6;i++){var x=L+i*sw,v=f[i],on=hot.length?hot.indexOf(i)>=0:true;
    if(v==='x'){s+='<text x="'+x+'" y="'+(top-30)+'" text-anchor="middle" font-size="'+(sw*0.55)+'" font-family="DejaVu Sans" fill="#5d6b7a">✕</text>';continue;}
    if(v===0)s+='<circle cx="'+x+'" cy="'+(top-44)+'" r="'+(sw*0.2)+'" fill="none" stroke="'+(on?'#E3A544':'#5d6b7a')+'" stroke-width="5"/>';
    else{var y=top+(v-base+0.5)*fh;s+='<circle cx="'+x+'" cy="'+y+'" r="'+(sw*0.3)+'" fill="'+(on?'#E3A544':'#3a4652')+'"/>';}
    if(lab[i])s+='<text x="'+x+'" y="'+(bot+sw*0.75)+'" text-anchor="middle" font-size="'+(sw*0.42)+'" font-family="DejaVu Sans" font-weight="bold" fill="'+(i===hl?'#E3A544':'#E6EAEE')+'">'+lab[i]+'</text>';
  }
  if(o.title)s+='<text x="'+((L+R)/2)+'" y="'+(H*0.06)+'" text-anchor="middle" font-size="'+(W*0.085)+'" font-family="DejaVu Sans" font-weight="bold" fill="#E6EAEE">'+o.title+'</text>';
  return s+'</svg>';
}
var OPEN={f:[0,0,0,0,0,'x'],notes:['E','A','D','G','B',''],title:'Em11'};
var EM={f:['x',7,7,7,8,7],base:6,notes:['','E','A','D','G','B'],title:'Em11',barre:{fret:7,from:1,to:5}};
var DM={f:['x',5,5,5,6,5],base:4,notes:['','D','G','C','F','A'],title:'Dm11',barre:{fret:5,from:1,to:5}};
