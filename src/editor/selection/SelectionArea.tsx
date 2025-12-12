import { type CSSProperties } from "react";

import type { ShapeDef } from "../schema";
import SelectionResize from "./SelectionResize";
import { type Selection } from "./selectionState";

const outlineStyles: CSSProperties = {
  outline: "2px solid blue",
};

interface SelectionAreaProps {
  shape: ShapeDef;
  onSelectionChange: (newSelection: Selection | null) => void;
  onShapesChange: (shapes: ShapeDef[]) => void;
}

const SelectionArea = ({ shape, onShapesChange }: SelectionAreaProps) => {
  const commonStyles: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    translate: `${shape.bounds.left}px ${shape.bounds.top}px`,
    width: shape.bounds.width,
    height: shape.bounds.height,
    pointerEvents: "none",
  };

  return (
    <>
      <div style={{ ...commonStyles, ...outlineStyles }} />
      <div style={{ ...commonStyles }}>
        <SelectionResize shape={shape} onShapesChange={onShapesChange} />
      </div>
    </>
  );
};

export default SelectionArea;
