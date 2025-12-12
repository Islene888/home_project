import { useId } from "react";

import type { ShapeDef } from "../schema";

interface PathFillProps {
  path: ShapeDef["paths"][number];
}

const PathFill = ({ path }: PathFillProps) => {
  const id = useId();

  return (
    <>
      <svg
        style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0 }}
      >
        <defs>
          <clipPath id={id}>
            <path d={path.d} />
          </clipPath>
        </defs>
      </svg>
      {path.fill && (
        <div
          style={{
            background: path.fill.color,
            clipPath: `url(#${id})`,
            width: "100%",
            height: "100%",
          }}
        ></div>
      )}
    </>
  );
};

export default PathFill;
