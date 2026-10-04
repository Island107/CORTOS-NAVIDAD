import { getInputProps } from "remotion";
/** Banderas de depuración/benchmark: --props='{"dbg":"noshadow,noblend"}' */
const raw = String((getInputProps() as { dbg?: string }).dbg ?? "");
export const DBG = new Set(raw.split(",").filter(Boolean));
