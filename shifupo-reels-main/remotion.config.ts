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
Config.setDefaultPremountInSeconds(2);
// WebGL for <ThreeCanvas> (@remotion/three). If 3D renders blank on a laptop
// without a usable GPU, render with --gl=swangle (CPU, slower).
Config.setChromiumOpenGlRenderer("angle");
