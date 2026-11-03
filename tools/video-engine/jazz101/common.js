var DP={bg:'#0E1620',ink:'#E6EAEE',accent:'#E3A544',blue:'#8FA9F0',line:'#2A3847'};
/* hand-drawn trumpet, bell angle in degrees (0 straight, 45 up) */
function trumpet(ang,sc,ink,acc){
  ink=ink||'#E6EAEE';acc=acc||'#E3A544';sc=sc||1;
  var s='<g transform="scale('+sc+')" fill="none" stroke="'+ink+'" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">';
  s+='<path d="M20 200 L60 200 M60 192 L60 208"/>';                       // mouthpiece
  s+='<path d="M60 200 L330 200"/><path d="M90 200 C90 250 330 250 330 200"/>'; // pipes
  s+='<rect x="170" y="150" width="20" height="70" rx="6"/><rect x="205" y="150" width="20" height="70" rx="6"/><rect x="240" y="150" width="20" height="70" rx="6"/>';
  s+='<circle cx="180" cy="140" r="9" fill="'+acc+'" stroke="none"/><circle cx="215" cy="140" r="9" fill="'+acc+'" stroke="none"/><circle cx="250" cy="140" r="9" fill="'+acc+'" stroke="none"/>';
  s+='<g transform="rotate('+(-ang)+' 330 200)"><path d="M330 192 L420 186 C470 180 500 150 510 120 L510 280 C500 250 470 220 420 214 L330 208"/>';
  s+='<path d="M510 120 L510 280" stroke="'+acc+'" stroke-width="7"/><path d="M430 188 C470 182 495 160 505 130" stroke-width="2" opacity=".5"/></g>';
  return s+'</g>';
}
function beatsSVG(n,hl,col,w,lab){ // n boxes, hl = indexes highlighted
  w=w||760;var bw=(w-(n-1)*16)/n,s='';
  for(var i=0;i<n;i++){var on=hl.indexOf(i)>=0;s+='<g transform="translate('+(i*(bw+16))+' 0)"><rect width="'+bw+'" height="150" rx="18" fill="'+(on?col:'#141E2A')+'" stroke="'+(on?col:'#2A3847')+'" stroke-width="4"/><text x="'+(bw/2)+'" y="100" text-anchor="middle" font-family="DejaVu Sans Mono" font-weight="700" font-size="72" fill="'+(on?'#0E1620':'#5d6b7a')+'">'+(lab?lab[i]:(i+1))+'</text></g>';}
  return s;
}
function clap(x,y,sc,col){return '<g transform="translate('+x+' '+y+') scale('+sc+')"><text font-size="90" text-anchor="middle">👏</text></g>';}
function dots(n,lit,grp,W,H){var s='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">',gap=W/(n+(grp?1:0)+0.5),x=gap*0.75;
 for(var i=0;i<n;i++){if(grp&&i===grp)x+=gap*0.8;var on=lit.indexOf(i)>=0,big=(i===0||i===grp);
  s+='<circle cx="'+x+'" cy="'+(H/2)+'" r="'+(big?gap*0.32:gap*0.24)+'" fill="'+(on?'#E3A544':'#2A3847')+'"/><text x="'+x+'" y="'+(H/2+gap*0.12)+'" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="'+(gap*0.3)+'" fill="'+(on?'#0E1620':'#5d6b7a')+'">'+(i+1)+'</text>';x+=gap;}
 return s+'</svg>';}
