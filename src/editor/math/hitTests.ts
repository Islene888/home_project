import type { Bounds, Layout, Point } from "./types";

const getPointWorldToLocal = (point: Point, layout: Layout): Point => {
  return {
    x: point.x - layout.bounds.left,
    y: point.y - layout.bounds.top,
  };
};

export function isPointHitLayout({
  target,
  point,
  margin = 0,
}: {
  target: Layout;
  point: Point;
  margin?: number;
}): boolean {
  const { bounds } = target;

  if (bounds.width === 0 || bounds.height === 0) {
    return false;
  }

  const { x, y } = getPointWorldToLocal(point, target);

  return (
    x >= -margin &&
    x <= bounds.width + margin &&
    y >= -margin &&
    y <= bounds.height + margin
  );
}

export function isBoundsHitLayout({
  target,
  bounds,
  margin = 0,
}: {
  target: Layout;
  bounds: Bounds;
  margin?: number;
}): boolean {
  const targetBounds = target.bounds;

  if (
    targetBounds.width === 0 ||
    targetBounds.height === 0 ||
    bounds.width === 0 ||
    bounds.height === 0
  ) {
    return false;
  }

  // Simple AABB detection
  const targetLeft = targetBounds.left - margin;
  const targetRight = targetLeft + targetBounds.width + margin;
  const targetTop = targetBounds.top - margin;
  const targetBottom = targetTop + targetBounds.height + margin;

  const boundsLeft = bounds.left;
  const boundsRight = boundsLeft + bounds.width;
  const boundsTop = bounds.top;
  const boundsBottom = boundsTop + bounds.height;

  // Two rectangles intersect (including the case where target is within bounds)
  return (
    targetLeft < boundsRight &&
    targetRight > boundsLeft &&
    targetTop < boundsBottom &&
    targetBottom > boundsTop
  );
}
