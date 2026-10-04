#!/bin/bash
# Pre-render de la sala (26–30 s) que se ve por la ventana en la escena 5
set -e
cd "$(dirname "$0")/.."
rm -rf out/room5 public/room5 && mkdir -p public/room5
npx remotion render ${1:-build} Room5 out/room5 --sequence --image-format=jpeg --jpeg-quality=92 --concurrency=${2:-1}
i=0; for f in $(ls out/room5/*.jpeg | sort); do cp $f public/room5/r$(printf %03d $i).jpg; i=$((i+1)); done
echo "room5: $i cuadros"
