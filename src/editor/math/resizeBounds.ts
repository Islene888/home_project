import type { Bounds, Layout } from "./types";

const MIN_SIZE = 5;

export type ResizeDirection =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top"
  | "right"
  | "bottom"
  | "left";

interface ResizeBoundsOptions {
  layout: Layout;
  direction: ResizeDirection;
  isRatioLocked?: boolean;
  deltaX: number;
  deltaY: number;
}

/**
 * Calculates new bounds based on resize direction, snapshot and mouse delta
 */
export const resizeBounds = ({
  direction,
  layout: { bounds },
  deltaX,
  deltaY,
  isRatioLocked,
}: ResizeBoundsOptions): Bounds => {
  const localDeltaX = deltaX;
  const localDeltaY = deltaY;

  let newWidth = bounds.width;
  let newHeight = bounds.height;
  let diagVector: [number, number] | null = null;

  switch (direction) {
    case "top-left": {
      const proposedWidth = bounds.width - localDeltaX;
      const proposedHeight = bounds.height - localDeltaY;
      newWidth = Math.max(proposedWidth, MIN_SIZE);
      newHeight = Math.max(proposedHeight, MIN_SIZE);
      diagVector = [-1, -1];
      break;
    }
    case "top-right": {
      const proposedHeightTR = bounds.height - localDeltaY;
      newWidth = Math.max(bounds.width + localDeltaX, MIN_SIZE);
      newHeight = Math.max(proposedHeightTR, MIN_SIZE);
      diagVector = [1, -1];
      break;
    }
    case "bottom-left": {
      const proposedWidthBL = bounds.width - localDeltaX;
      newWidth = Math.max(proposedWidthBL, MIN_SIZE);
      newHeight = Math.max(bounds.height + localDeltaY, MIN_SIZE);
      diagVector = [-1, 1];
      break;
    }
    case "bottom-right": {
      newWidth = Math.max(bounds.width + localDeltaX, MIN_SIZE);
      newHeight = Math.max(bounds.height + localDeltaY, MIN_SIZE);
      diagVector = [1, 1];
      break;
    }
    case "top": {
      const proposedHeightTop = bounds.height - localDeltaY;
      newHeight = Math.max(proposedHeightTop, MIN_SIZE);
      break;
    }
    case "right": {
      newWidth = Math.max(bounds.width + localDeltaX, MIN_SIZE);
      break;
    }
    case "bottom": {
      newHeight = Math.max(bounds.height + localDeltaY, MIN_SIZE);
      break;
    }
    case "left": {
      const proposedWidthLeft = bounds.width - localDeltaX;
      newWidth = Math.max(proposedWidthLeft, MIN_SIZE);
      break;
    }
  }

  if (isRatioLocked && diagVector) {
    const ratio = bounds.width / bounds.height;

    // Project to diagonal
    const length = Math.hypot(diagVector[0], diagVector[1]);
    const diagNorm: [number, number] = [
      diagVector[0] / length,
      diagVector[1] / length,
    ];
    const deltaAlongDiag =
      localDeltaX * diagNorm[0] + localDeltaY * diagNorm[1];

    // Update width and height based on projection while maintaining ratio
    const sign = Math.sign(deltaAlongDiag);
    let proposedWidth =
      bounds.width +
      sign * Math.abs(deltaAlongDiag) * Math.sqrt(ratio / (1 + ratio));
    let proposedHeight = proposedWidth / ratio;

    // Ensure minimum size
    if (proposedWidth < MIN_SIZE || proposedHeight < MIN_SIZE) {
      const scale = MIN_SIZE / Math.min(proposedWidth, proposedHeight);
      proposedWidth *= scale;
      proposedHeight *= scale;
    }

    newWidth = proposedWidth;
    newHeight = proposedHeight;
  }

  let signX = 0;
  let signY = 0;
  switch (direction) {
    case "top-left":
      signX = -1;
      signY = -1;
      break;
    case "top-right":
      signX = 1;
      signY = -1;
      break;
    case "bottom-left":
      signX = -1;
      signY = 1;
      break;
    case "bottom-right":
      signX = 1;
      signY = 1;
      break;
    case "top":
      signY = -1;
      break;
    case "right":
      signX = 1;
      break;
    case "bottom":
      signY = 1;
      break;
    case "left":
      signX = -1;
      break;
  }

  const deltaW = newWidth - bounds.width;
  const deltaH = newHeight - bounds.height;

  const centerShiftX = (signX * deltaW) / 2;
  const centerShiftY = (signY * deltaH) / 2;

  const oldCenterX = bounds.left + bounds.width / 2;
  const oldCenterY = bounds.top + bounds.height / 2;
  const newCenterX = oldCenterX + centerShiftX;
  const newCenterY = oldCenterY + centerShiftY;

  const newLeft = newCenterX - newWidth / 2;
  const newTop = newCenterY - newHeight / 2;

  return { left: newLeft, top: newTop, width: newWidth, height: newHeight };
};
