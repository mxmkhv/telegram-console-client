import { createContext } from "react";
// true = colors disabled (monochrome). Default false so the wrappers render
// normally even outside a provider (e.g. isolated component tests).
export const ColorModeContext = createContext<boolean>(false);
