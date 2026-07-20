import { memo } from "react";
import { Box } from "./ui";

// A completely blank full-screen box — hides all UI while "hidden mode" is active.
function BlankScreenInner() {
  return <Box width="100%" height="100%" />;
}

export const BlankScreen = memo(BlankScreenInner);
