#!/bin/bash
R="$HOME/mnt/1017 bachata crush"; c="$1"; f="$HOME/g17/$c.mp4"
A="$R/JimFrame_成品/_assets"; L="$R/JimFrame_成品/filmbyjim-logo.png"; O="$R/JimFrame_成品/25秒試看版"; DUR=25; ML=22.4
out="$O/1017_${c} 25秒試看.mp4"; [ -s "$out" ] && { echo "have $c"; exit 0; }
h1=9; h2=15.5; h3=20.5; ms=2.6; as=0
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
if awk "BEGIN{exit !($D<25.6)}"; then DUR=$(awk "BEGIN{printf \"%.2f\",$D-0.4}"); ML=$(awk "BEGIN{printf \"%.2f\",$DUR-2.6}"); h1=$(awk "BEGIN{printf \"%.2f\",$D*0.35}"); h2=$(awk "BEGIN{printf \"%.2f\",$D*0.58}"); h3=$(awk "BEGIN{printf \"%.2f\",$D*0.78}"); fi
E1=$(awk "BEGIN{print $ML-0.55}"); E2=$(awk "BEGIN{print $DUR-1.1}"); E3=$(awk "BEGIN{print $DUR-1.4}"); E4=$(awk "BEGIN{print $DUR-0.8}")
WB=""
P="setsar=1,fps=30"
FC="[0:v:0]$P,trim=duration=1.0,setpts=PTS-STARTPTS,tmix=frames=4,setpts=PTS/2.5,fps=30,trim=duration=0.4,setpts=PTS-STARTPTS,eq=saturation=1.1[c0];"
FC+="[1:v:0]$P,trim=duration=0.66,setpts=PTS-STARTPTS,setpts=PTS/0.35,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,trim=duration=1.8,setpts=PTS-STARTPTS,scale=1188:2112:flags=lanczos,crop=1080:1920:x='54*(1-t/1.8)':y='96*(1-t/1.8)',eq=saturation=1.05,fade=t=in:st=0:d=0.1:color=white[c1];"
FC+="[2:v:0]$P,trim=duration=0.8,setpts=PTS-STARTPTS,tmix=frames=3,setpts=PTS/2,fps=30,trim=duration=0.4,setpts=PTS-STARTPTS,eq=saturation=1.1,fade=t=in:st=0:d=0.08:color=white[c2];"
FC+="[3:v:0]$P,trim=duration=$ML,setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.15:color=white,fade=t=out:st=$E1:d=0.5[c3];"
FC+="[c0][c1][c2][c3]concat=n=4:v=1:a=0[base0];"
FC+="[8:v]format=rgba,fade=t=in:st=0:d=0.5:alpha=1,fade=t=out:st=2.25:d=0.35:alpha=1[sc];[base0][sc]overlay=0:0[base];"
FC+="[6:v]format=rgba,fade=t=in:st=2.6:d=0.4:alpha=1,fade=t=out:st=$E2:d=0.4:alpha=1[g];[base][g]overlay=0:0[b1];"
FC+="[7:v]scale=200:-1:flags=lanczos,format=rgba,fade=t=in:st=2.8:d=0.4:alpha=1,fade=t=out:st=$E3:d=0.4:alpha=1[lg];[b1][lg]overlay=40:56[b2];"
FC+="[b2]format=gbrp[b3];[5:v]format=gbrp[tr];[b3][tr]blend=all_mode=screen,format=yuv420p[v];"
FC+="[4:a:0]afade=t=in:st=0:d=0.3,afade=t=out:st=$E4:d=0.8[a]"
ffmpeg -y -v error -ss $h1 -t 1.2 -i "$f" -ss $h2 -t 0.9 -i "$f" -ss $h3 -t 1.0 -i "$f" -ss $ms -t $(awk "BEGIN{print $ML+0.3}") -i "$f" -ss $as -t $DUR -i "$f" \
  -i "$A/crush_track25.mp4" -loop 1 -t $DUR -i "$A/crush_grad.png" -loop 1 -t $DUR -i "$L" -loop 1 -t 2.6 -i "$A/crush_scrim.png" \
  -filter_complex "$FC" -map "[v]" -map "[a]" -t $DUR -c:v libx264 -preset medium -crf 19 -maxrate 7M -bufsize 14M -pix_fmt yuv420p -profile:v high -tune film -c:a aac -b:a 192k -movflags +faststart "$HOME/tmp17_$c.mp4" && cp "$HOME/tmp17_$c.mp4" "$out" && echo "done $c WB=$WB $(du -h "$out"|cut -f1)"
