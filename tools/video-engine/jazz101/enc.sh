#!/bin/bash
# usage: enc.sh ep key
e=$1; k=$2
for v in music:配音配樂版 sfx:人聲音效版; do a=${v%%:*}; n=${v##*:}
ffmpeg -nostdin -y -v error -framerate 30 -i f$e/f%04d.jpg -i aud/e${e}_$a.wav -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "out/${k}_${n}.mp4"
done
