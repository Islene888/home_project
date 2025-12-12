import type { ShapeDef } from "../schema";

const transformPath = (
  pathData: string,
  offsetX: number,
  offsetY: number,
  scaleX = 1,
  scaleY = 1,
): string => {
  // Split path into commands and handle each separately
  const pathCommands =
    pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];

  return pathCommands
    .map((command) => {
      const commandType = command[0];
      const params = command.slice(1).trim();

      if (!params || !commandType) return command;

      // Handle Move (M/m) and Line (L/l) commands
      if (/[MmLl]/.test(commandType)) {
        const coords = params.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
        const transformedCoords = [];

        for (let i = 0; i < coords.length; i += 2) {
          if (
            i + 1 < coords.length &&
            coords[i] !== undefined &&
            coords[i + 1] !== undefined
          ) {
            // Apply translation then scaling
            const newX = (coords[i] + offsetX) * scaleX;
            const newY = (coords[i + 1] + offsetY) * scaleY;
            transformedCoords.push(newX, newY);
          }
        }

        return commandType + transformedCoords.join(" ");
      }

      // Handle Horizontal line commands (H/h)
      if (/[Hh]/.test(commandType)) {
        const coords = params.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
        const transformedCoords = [];

        for (let i = 0; i < coords.length; i++) {
          if (coords[i] !== undefined) {
            if (commandType === "H") {
              // Absolute horizontal line - apply translation then scaling to x-coordinate
              const newX = (coords[i] + offsetX) * scaleX;
              transformedCoords.push(newX);
            } else {
              // Relative horizontal line - only apply scaling to x-distance
              const newDx = coords[i] * scaleX;
              transformedCoords.push(newDx);
            }
          }
        }

        return commandType + transformedCoords.join(" ");
      }

      // Handle Vertical line commands (V/v)
      if (/[Vv]/.test(commandType)) {
        const coords = params.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
        const transformedCoords = [];

        for (let i = 0; i < coords.length; i++) {
          if (coords[i] !== undefined) {
            if (commandType === "V") {
              // Absolute vertical line - apply translation then scaling to y-coordinate
              const newY = (coords[i] + offsetY) * scaleY;
              transformedCoords.push(newY);
            } else {
              // Relative vertical line - only apply scaling to y-distance
              const newDy = coords[i] * scaleY;
              transformedCoords.push(newDy);
            }
          }
        }

        return commandType + transformedCoords.join(" ");
      }

      // Handle Cubic Bézier curve commands (C/c)
      // Format: C x1 y1 x2 y2 x y (control point 1, control point 2, end point)
      if (/[Cc]/.test(commandType)) {
        const coords = params.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
        const transformedCoords = [];

        // Process coordinates in groups of 6 (x1, y1, x2, y2, x, y)
        for (let i = 0; i < coords.length; i += 6) {
          if (i + 5 < coords.length) {
            if (commandType === "C") {
              // Absolute cubic curve - transform all control points and end point
              const x1 = (coords[i] + offsetX) * scaleX;
              const y1 = (coords[i + 1] + offsetY) * scaleY;
              const x2 = (coords[i + 2] + offsetX) * scaleX;
              const y2 = (coords[i + 3] + offsetY) * scaleY;
              const x = (coords[i + 4] + offsetX) * scaleX;
              const y = (coords[i + 5] + offsetY) * scaleY;
              transformedCoords.push(x1, y1, x2, y2, x, y);
            } else {
              // Relative cubic curve - only apply scaling to relative distances
              const dx1 = coords[i] * scaleX;
              const dy1 = coords[i + 1] * scaleY;
              const dx2 = coords[i + 2] * scaleX;
              const dy2 = coords[i + 3] * scaleY;
              const dx = coords[i + 4] * scaleX;
              const dy = coords[i + 5] * scaleY;
              transformedCoords.push(dx1, dy1, dx2, dy2, dx, dy);
            }
          }
        }

        return commandType + transformedCoords.join(" ");
      }

      // Handle Smooth cubic Bézier curve commands (S/s)
      // Format: S x2 y2 x y (control point 2, end point)
      if (/[Ss]/.test(commandType)) {
        const coords = params.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
        const transformedCoords = [];

        // Process coordinates in groups of 4 (x2, y2, x, y)
        for (let i = 0; i < coords.length; i += 4) {
          if (i + 3 < coords.length) {
            if (commandType === "S") {
              // Absolute smooth curve - transform control point 2 and end point
              const x2 = (coords[i] + offsetX) * scaleX;
              const y2 = (coords[i + 1] + offsetY) * scaleY;
              const x = (coords[i + 2] + offsetX) * scaleX;
              const y = (coords[i + 3] + offsetY) * scaleY;
              transformedCoords.push(x2, y2, x, y);
            } else {
              // Relative smooth curve - only apply scaling to relative distances
              const dx2 = coords[i] * scaleX;
              const dy2 = coords[i + 1] * scaleY;
              const dx = coords[i + 2] * scaleX;
              const dy = coords[i + 3] * scaleY;
              transformedCoords.push(dx2, dy2, dx, dy);
            }
          }
        }

        return commandType + transformedCoords.join(" ");
      }

      // Handle Quadratic Bézier curve commands (Q/q)
      // Format: Q x1 y1 x y (control point, end point)
      if (/[Qq]/.test(commandType)) {
        const coords = params.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
        const transformedCoords = [];

        // Process coordinates in groups of 4 (x1, y1, x, y)
        for (let i = 0; i < coords.length; i += 4) {
          if (i + 3 < coords.length) {
            if (commandType === "Q") {
              // Absolute quadratic curve - transform control point and end point
              const x1 = (coords[i] + offsetX) * scaleX;
              const y1 = (coords[i + 1] + offsetY) * scaleY;
              const x = (coords[i + 2] + offsetX) * scaleX;
              const y = (coords[i + 3] + offsetY) * scaleY;
              transformedCoords.push(x1, y1, x, y);
            } else {
              // Relative quadratic curve - only apply scaling to relative distances
              const dx1 = coords[i] * scaleX;
              const dy1 = coords[i + 1] * scaleY;
              const dx = coords[i + 2] * scaleX;
              const dy = coords[i + 3] * scaleY;
              transformedCoords.push(dx1, dy1, dx, dy);
            }
          }
        }

        return commandType + transformedCoords.join(" ");
      }

      // Handle Smooth quadratic Bézier curve commands (T/t)
      // Format: T x y (end point only, control point is reflected from previous curve)
      if (/[Tt]/.test(commandType)) {
        const coords = params.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
        const transformedCoords = [];

        // Process coordinates in groups of 2 (x, y)
        for (let i = 0; i < coords.length; i += 2) {
          if (
            i + 1 < coords.length &&
            coords[i] !== undefined &&
            coords[i + 1] !== undefined
          ) {
            if (commandType === "T") {
              // Absolute smooth quadratic curve - transform end point
              const x = (coords[i] + offsetX) * scaleX;
              const y = (coords[i + 1] + offsetY) * scaleY;
              transformedCoords.push(x, y);
            } else {
              // Relative smooth quadratic curve - only apply scaling to relative distances
              const dx = coords[i] * scaleX;
              const dy = coords[i + 1] * scaleY;
              transformedCoords.push(dx, dy);
            }
          }
        }

        return commandType + transformedCoords.join(" ");
      }

      // Handle Arc commands (A/a)
      // Format: A rx ry x-axis-rotation large-arc-flag sweep-flag x y
      if (/[Aa]/.test(commandType)) {
        const coords = params.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
        if (coords.length >= 7) {
          // Arc has 7 parameters: rx ry x-axis-rotation large-arc-flag sweep-flag x y
          const transformedCoords = [...coords];

          if (commandType === "A") {
            // Absolute arc - scale radii and transform end coordinates
            transformedCoords[0] = coords[0] * scaleX; // rx
            transformedCoords[1] = coords[1] * scaleY; // ry
            // x-axis-rotation (index 2), large-arc-flag (3), sweep-flag (4) remain unchanged
            transformedCoords[5] = (coords[5] + offsetX) * scaleX; // x coordinate
            transformedCoords[6] = (coords[6] + offsetY) * scaleY; // y coordinate
          } else {
            // Relative arc - scale radii and relative distances
            transformedCoords[0] = coords[0] * scaleX; // rx
            transformedCoords[1] = coords[1] * scaleY; // ry
            // x-axis-rotation (index 2), large-arc-flag (3), sweep-flag (4) remain unchanged
            transformedCoords[5] = coords[5] * scaleX; // dx (relative distance)
            transformedCoords[6] = coords[6] * scaleY; // dy (relative distance)
          }

          return commandType + transformedCoords.join(" ");
        }
        // Malformed arc - return as-is
        return command;
      }

      // For other commands, return as-is for now
      return command;
    })
    .join(" ");
};

// Normalize shape to ensure viewBox starts at (0, 0) and scale to match attributes
const normalizeShape = (shape: ShapeDef): ShapeDef => {
  // Calculate offset to move viewBox to (0, 0)
  const offsetX = -shape.viewBox.minX;
  const offsetY = -shape.viewBox.minY;

  // Calculate scale factors to match shape attributes
  const scaleX = shape.bounds.width / shape.viewBox.width;
  const scaleY = shape.bounds.height / shape.viewBox.height;

  // Transform all paths (translate to origin and scale to target size)
  const normalizedPaths = shape.paths.map((path) => ({
    ...path,
    d: transformPath(path.d, offsetX, offsetY, scaleX, scaleY),
  }));

  // Update viewBox to start at (0, 0) and match the attributes dimensions
  const normalizedViewBox = {
    minX: 0,
    minY: 0,
    width: shape.bounds.width,
    height: shape.bounds.height,
  };

  return {
    ...shape,
    paths: normalizedPaths,
    viewBox: normalizedViewBox,
  };
};

export default normalizeShape;
