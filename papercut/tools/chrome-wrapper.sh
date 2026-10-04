#!/bin/sh
# Chromium del contenedor con raster en CPU (la composición 3D sigue en GL/SwiftShader)
exec /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell --disable-gpu-rasterization $EXTRA_CHROME_FLAGS "$@"
