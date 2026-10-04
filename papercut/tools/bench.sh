#!/bin/bash
# Uso: tools/bench.sh <frame_inicial> <n> [dbg]  → segundos por cuadro (concurrencia 1, sin arranque)
cd "$(dirname "$0")/.."
F=$1; N=$2; D=${3:-}
run() { s=$(date +%s.%N); npx remotion render build Navidad out/bench --sequence --frames=$1 --image-format=jpeg --concurrency=1 --props="{\"dbg\":\"$D\"}" >/dev/null 2>&1 || echo FAIL; e=$(date +%s.%N); echo "$e - $s" | bc; }
a=$(run $F-$F); b=$(run $F-$((F+N)))
echo "dbg=[$D] frames $F..$((F+N)): $(echo "scale=3; ($b - $a) / $N" | bc) s/cuadro"
