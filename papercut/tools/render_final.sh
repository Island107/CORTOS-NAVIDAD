#!/bin/bash
# Render final dividido por escenas en paralelo, luego concatena y agrega el audio.
# Uso: tools/render_final.sh [escala]   (escala 1 = 1080x1920)
set -e
cd "$(dirname "$0")/.."
SCALE=${1:-1}
OUT=out/final
mkdir -p $OUT
npx remotion bundle --out-dir=build >/dev/null 2>&1
# escenas (cuadros a 24 fps)
SCENES=("s1 0-143" "s2 144-287" "s3 288-479" "s4 480-623" "s5 624-719")
start=$(date +%s)
pids=()
for sc in "${SCENES[@]}"; do
  set -- $sc
  if [ -n "$ONLY" ] && [[ " $ONLY " != *" $1 "* ]]; then continue; fi
  ( s=$(date +%s)
    npx remotion render build Navidad $OUT/$1.mp4 --frames=$2 --scale=$SCALE --muted \
      --concurrency=1 --codec=h264 --crf=17 --pixel-format=yuv420p > $OUT/$1.log 2>&1
    e=$(date +%s); a=${2%-*}; b=${2#*-}; n=$((b - a + 1))
    echo "$1: $n cuadros en $((e - s)) s ($(echo "scale=2; ($e - $s) / $n" | bc) s/cuadro por proceso)" | tee -a $OUT/timing.txt ) &
  pids+=($!)
done
for p in "${pids[@]}"; do wait $p; done
end=$(date +%s)
echo "total en paralelo: $((end - start)) s para 720 cuadros ($(echo "scale=2; ($end - $start) / 720" | bc) s/cuadro efectivo)" | tee -a $OUT/timing.txt
printf "file '%s'\n" s1.mp4 s2.mp4 s3.mp4 s4.mp4 s5.mp4 > $OUT/list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i $OUT/list.txt -i public/audio/sfx.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart $OUT/navidad_papercut.mp4
ffprobe -hide_banner $OUT/navidad_papercut.mp4 2>&1 | grep -E "Duration|Stream"
