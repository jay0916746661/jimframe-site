#!/bin/bash
cd "$HOME/mnt/1015 bachata crush 影片"
A="JimFrame_成品/_assets"; L="JimFrame_成品/filmbyjim-logo.png"; O="JimFrame_成品/25秒試看版_特效版"; DUR=${DUR:-25}; ML=$(python3 -c "print(round($DUR-2.6,2))")
if [ -n "$ONLY" ]; then LIST=("$ONLY"); else LIST=(*.m4v); fi
n=0
for f in "${LIST[@]}"; do
  b="${f%.m4v}"; out="$O/${b} ${DUR%.*}秒試看.mp4"
  [ -s "$out" ] && [ -z "$FORCE" ] && continue; n=$((n+1)); [ $n -gt ${MAXN:-2} ] && exit 0
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  read h1 h2 h3 ms as <<< $(python3 -c "
d=$d
SAFE=float('${SAFE:-0}')
ML=$ML
ms=max(2.6,SAFE+0.3,min((d-ML)*0.3,d-ML)); ms=min(ms,d-ML)
hs=[SAFE+(d-1.2-SAFE)*p for p in (0.15,0.45,0.75)] if SAFE>0 else [max(0,min(d-1.2,d*p)) for p in (0.2,0.45,0.7)]
print(*[round(x,2) for x in hs],round(ms,2),round(ms-2.6,2))")
  P="scale=1080:1920:flags=lanczos,setsar=1,fps=30"
  FC="[0:v:0]$P,trim=duration=1.0,setpts=PTS-STARTPTS,tmix=frames=4,setpts=PTS/2.5,fps=30,trim=duration=0.4,setpts=PTS-STARTPTS,eq=brightness=-0.05:saturation=1.2[c0];"
  FC+="[1:v:0]$P,trim=duration=0.66,setpts=PTS-STARTPTS,setpts=PTS/0.35,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,trim=duration=1.8,setpts=PTS-STARTPTS,scale=1188:2112:flags=lanczos,crop=1080:1920:x='54*(1-t/1.8)':y='96*(1-t/1.8)',eq=brightness=-0.06:saturation=1.15,fade=t=in:st=0:d=0.1:color=white[c1];"
  FC+="[2:v:0]$P,trim=duration=0.8,setpts=PTS-STARTPTS,tmix=frames=3,setpts=PTS/2,fps=30,trim=duration=0.4,setpts=PTS-STARTPTS,eq=brightness=-0.05:saturation=1.2,fade=t=in:st=0:d=0.08:color=white[c2];"
  FC+="[3:v:0]$P,trim=duration=$ML,setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.15:color=white,fade=t=out:st=$(python3 -c "print($ML-0.55)"):d=0.5[c3];"
  FC+="[c0][c1][c2][c3]concat=n=4:v=1:a=0[base0];"
  FC+="[9:v]format=rgba,fade=t=in:st=0:d=0.5:alpha=1,fade=t=out:st=2.25:d=0.35:alpha=1[sc];[base0][sc]overlay=0:0[base];"
  FC+="[7:v]format=rgba,fade=t=in:st=2.6:d=0.4:alpha=1,fade=t=out:st=$(python3 -c "print($DUR-1.1)"):d=0.4:alpha=1[g];[base][g]overlay=0:0[b1];"
  FC+="[8:v]scale=200:-1:flags=lanczos,format=rgba,fade=t=in:st=2.8:d=0.4:alpha=1,fade=t=out:st=$(python3 -c "print($DUR-1.4)"):d=0.4:alpha=1[lg];[b1][lg]overlay=40:56[b2];"
  FC+="[b2]format=gbrp[b3];[6:v]format=gbrp[tr];[b3][tr]blend=all_mode=screen,format=yuv420p[v];"
  FC+="[5:a:0]afade=t=in:st=0:d=0.3,afade=t=out:st=$(python3 -c "print($DUR-0.8)"):d=0.8[a]"
  ffmpeg -y -v error -ss $h1 -t 1.2 -i "$f" -ss $h2 -t 0.9 -i "$f" -ss $h3 -t 1.0 -i "$f" -ss $ms -t $(python3 -c "print($ML+0.3)") -i "$f" \
    -ss 0 -t 0.1 -i "$f" -ss $as -t $DUR -i "$f" -i "$A/crush_track${DUR%.*}.mp4" -loop 1 -t $DUR -i "$A/crush_grad.png" -loop 1 -t $DUR -i "$L" -loop 1 -t 2.6 -i "$A/crush_scrim.png" \
    -filter_complex "$FC" -map "[v]" -map "[a]" -t $DUR -c:v libx264 -preset fast -crf 19 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 192k -movflags +faststart "$HOME/tmp_prev25.mp4" && cp "$HOME/tmp_prev25.mp4" "$out"
  echo "v3 $b h=$h1,$h2,$h3 ms=$ms" >> "$HOME/prev25.log"
done
echo ALLDONE >> "$HOME/prev25.log"
