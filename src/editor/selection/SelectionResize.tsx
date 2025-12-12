import { type ResizeDirection, resizeBounds } from "../math/resizeBounds";
import { ShapeDef } from "../schema";
import ResizeHandler from "./ResizeHandler";

const RESIZE_DIRECTIONS: ResizeDirection[] = [
  "left",
  "right",
  "top",
  "bottom",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

interface SelectionResizeProps {
  shape: ShapeDef;
  onShapesChange: (shapes: ShapeDef[]) => void;
}

const SelectionResize = ({ shape, onShapesChange }: SelectionResizeProps) => {
  return (
    <>
      {RESIZE_DIRECTIONS.map((direction) => {
        return (
          <ResizeHandler
            key={direction}
            direction={direction}
            onStart={() => {
              return {
                layout: {
                  bounds: shape.bounds,
                  rotation: 0,
                },
                shape,
              };
            }}
            onMove={({ deltaX, deltaY, snapshot }) => {
              const { layout: snapshotLayout, shape: snapshotShape } = snapshot;

              // Calculate new bounding box based on snapshot layout information
              const resizedBounds = resizeBounds({
                layout: snapshotLayout,
                direction,
                deltaX,
                deltaY,
                isRatioLocked: false,
              });

              const newShape: ShapeDef = {
                ...snapshotShape,
                bounds: resizedBounds,
              };

              onShapesChange([newShape]);
            }}
          />
        );
      })}
    </>
  );
};

export default SelectionResize;
