import { createContext, useContext } from "react";
import type { SkinName } from "../../types";
import { getSkin, type Skin } from "../../config/skins";

// Default so the wrappers render with the default skin even outside a
// provider (e.g. isolated component tests).
export const SkinContext = createContext<SkinName>("default");

export function useSkin(): Skin {
  return getSkin(useContext(SkinContext));
}
