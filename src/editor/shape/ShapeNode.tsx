import type { ShapeDef } from "../schema";
import PathFill from "./PathFill";
import PathStroke from "./PathStroke";
import normalizeShape from "./normalizeShape";

interface ShapeNodeProps {
  shape: ShapeDef;
}

const ShapeNode = ({ shape }: ShapeNodeProps) => {
  const normalizedNode = normalizeShape(shape);

  const pathsWithStroke = normalizedNode.paths.filter((path) => path.stroke);

  return (
    <>
      {normalizedNode.paths.map((path, index) => (
        <PathFill key={index} path={path} />
      ))}
      {pathsWithStroke.length > 0 && (
        <svg
          viewBox={`${normalizedNode.viewBox.minX} ${normalizedNode.viewBox.minY} ${normalizedNode.viewBox.width} ${normalizedNode.viewBox.height}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
          }}
        >
          {pathsWithStroke.map((path, index) => (
            <PathStroke key={index} path={path} />
          ))}
        </svg>
      )}
    </>
  );
};

export default ShapeNode;
