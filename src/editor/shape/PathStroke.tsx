import { useId } from "react";

import type { ShapeDef } from "../schema";

interface PathStrokeProps {
  path: ShapeDef["paths"][number];
}

const PathStroke = ({ path }: PathStrokeProps) => {
  const id = useId();

  if (!path.stroke) {
    return null;
  }

  const weight = path.stroke.weight;
  const strokeDasharray = path.stroke.dasharray
    ?.map((value) => value * weight)
    .join(",");

  return (
    <>
      <defs>
        <clipPath id={id}>
          <path d={path.d} />
        </clipPath>
      </defs>
      <path
        d={path.d}
        clipPath={`url(#${id})`}
        fill="none"
        strokeLinecap="butt"
        stroke={path.stroke.color}
        strokeWidth={weight * 2}
        strokeDasharray={strokeDasharray}
        vectorEffect="non-scaling-stroke"
      />
    </>
  );
};

export default PathStroke;
