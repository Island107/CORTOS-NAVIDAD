/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Chromium preinstalado en el contenedor (evita descargar otro navegador)
Config.setBrowserExecutable(process.cwd() + "/tools/chrome-wrapper.sh");
Config.setChromiumOpenGlRenderer("swangle");
