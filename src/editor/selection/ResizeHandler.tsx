import { type CSSProperties } from "react";

import { type ResizeDirection } from "../math/resizeBounds";
import useDragGesture from "../utils/useDragGesture";

const isBorderDirection = (
  direction: ResizeDirection,
): direction is "top" | "right" | "bottom" | "left" => {
  return (
    direction === "top" ||
    direction === "right" ||
    direction === "bottom" ||
    direction === "left"
  );
};

const isHorizontalDirection = (
  direction: ResizeDirection,
): direction is "left" | "right" => {
  return direction === "left" || direction === "right";
};

interface ResizeHandlerProps<ResizeSnapshot> {
  direction: ResizeDirection;
  onStart: () => ResizeSnapshot;
  onMove: (options: {
    deltaX: number;
    deltaY: number;
    snapshot: ResizeSnapshot;
    direction: ResizeDirection;
  }) => void;
}

const getRotatedCursor = (rotation: number): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="black">
    <g transform="rotate(${rotation} 12 12)">
      <path d="M8,11 H16 V13 H8 Z M8,8 L5,12 L8,16 Z M16,8 L19,12 L16,16 Z" />
    </g>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const getRotationForDirection = (direction: ResizeDirection): number => {
  switch (direction) {
    case "top-left":
      return 45;
    case "top-right":
      return -45;
    case "bottom-left":
      return 135;
    case "bottom-right":
      return -135;
    case "top":
    case "bottom":
      return -90;
    case "right":
    case "left":
      return 0;
  }
};

const RESIZE_HANDLE_SIZE = 12;

const CORNER_SIZE = {
  width: RESIZE_HANDLE_SIZE,
  height: RESIZE_HANDLE_SIZE,
};

const HORIZONTAL_SIZE = {
  width: RESIZE_HANDLE_SIZE / 2,
  height: RESIZE_HANDLE_SIZE * 2,
};

const VERTICAL_SIZE = {
  width: RESIZE_HANDLE_SIZE * 2,
  height: RESIZE_HANDLE_SIZE / 2,
};

const getPositionStyle = (direction: ResizeDirection): CSSProperties => {
  const handleSize = isBorderDirection(direction)
    ? isHorizontalDirection(direction)
      ? HORIZONTAL_SIZE
      : VERTICAL_SIZE
    : CORNER_SIZE;

  const baseStyle: CSSProperties = {
    position: "absolute",
    width: handleSize.width,
    height: handleSize.height,
    backgroundColor: "white",
    border: "1px solid blue",
    borderRadius: RESIZE_HANDLE_SIZE,
    pointerEvents: "auto",
    boxSizing: "content-box",
  };

  const rotation = getRotationForDirection(direction);
  const cursorUrl = getRotatedCursor(rotation);

  switch (direction) {
    case "top-left":
      return {
        ...baseStyle,
        left: -1,
        top: -1,
        translate: "-50% -50%",
        cursor: `url(${cursorUrl}) 12 12, nw-resize`,
      };
    case "top-right":
      return {
        ...baseStyle,
        right: -1,
        top: -1,
        translate: "50% -50%",
        cursor: `url(${cursorUrl}) 12 12, ne-resize`,
      };
    case "bottom-left":
      return {
        ...baseStyle,
        left: -1,
        bottom: -1,
        translate: "-50% 50%",
        cursor: `url(${cursorUrl}) 12 12, sw-resize`,
      };
    case "bottom-right":
      return {
        ...baseStyle,
        right: -1,
        bottom: -1,
        translate: "50% 50%",
        cursor: `url(${cursorUrl}) 12 12, se-resize`,
      };
    case "top":
      return {
        ...baseStyle,
        left: "50%",
        top: -1,
        translate: "-50% -50%",
        cursor: `url(${cursorUrl}) 12 12, n-resize`,
      };
    case "right":
      return {
        ...baseStyle,
        right: -1,
        top: "50%",
        translate: "50% -50%",
        cursor: `url(${cursorUrl}) 12 12, e-resize`,
      };
    case "bottom":
      return {
        ...baseStyle,
        left: "50%",
        bottom: -1,
        translate: "-50% 50%",
        cursor: `url(${cursorUrl}) 12 12, s-resize`,
      };
    case "left":
      return {
        ...baseStyle,
        left: -1,
        top: "50%",
        translate: "-50% -50%",
        cursor: `url(${cursorUrl}) 12 12, w-resize`,
      };
  }
};

const ResizeHandler = <ResizeSnapshot,>({
  direction,
  onStart,
  onMove,
}: ResizeHandlerProps<ResizeSnapshot>) => {
  const { onDragStart, dragProps } = useDragGesture<ResizeSnapshot>({
    onMove: ({ deltaX, deltaY, snapshot }) => {
      onMove({ deltaX, deltaY, snapshot, direction });
    },
  });

  return (
    <div
      style={getPositionStyle(direction)}
      onPointerDown={(event) => {
        onDragStart(event, onStart());
      }}
      {...dragProps}
    />
  );
};

export default ResizeHandler;
