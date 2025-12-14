import { Box, Button, Grid, Text } from "@radix-ui/themes";

import type { ShapePath, ShapeViewBox } from "../editor";

const shapes: {
  label: string;
  paths: ShapePath[];
  viewBox: ShapeViewBox;
}[] = [
  {
    label: "Rectangle",
    paths: [{ d: "M0,0L64,0L64,64L0,64Z" }],
    viewBox: { minX: 0, minY: 0, width: 64, height: 64 },
  },
  {
    label: "Triangle",
    paths: [{ d: "M32 0L64 56H0L32 0Z" }],
    viewBox: { minX: 0, minY: 0, width: 64, height: 56 },
  },
  {
    label: "Circle",
    paths: [{ d: "M32,8 A24,24 0 1,1 32,56 A24,24 0 1,1 32,8 Z" }],
    viewBox: { minX: 0, minY: 0, width: 64, height: 64 },
  },
  {
    label: "Diamond",
    paths: [{ d: "M32,4 L60,32 L32,60 L4,32 Z" }],
    viewBox: { minX: 0, minY: 0, width: 64, height: 64 },
  },
  {
    label: "Arrow",
    paths: [{ d: "M4,24 L40,24 L40,12 L60,32 L40,52 L40,40 L4,40 Z" }],
    viewBox: { minX: 0, minY: 0, width: 64, height: 64 },
  },
  {
    label: "Star",
    paths: [
      {
        d: "M32,4 L36,20 L52,20 L40,30 L44,46 L32,36 L20,46 L24,30 L12,20 L28,20 Z",
      },
    ],
    viewBox: { minX: 0, minY: 0, width: 64, height: 50 },
  },
  {
    label: "Hexagon",
    paths: [{ d: "M48,16 L48,48 L32,56 L16,48 L16,16 L32,8 Z" }],
    viewBox: { minX: 0, minY: 0, width: 64, height: 64 },
  },
  {
    label: "Ellipse",
    paths: [{ d: "M12,32 A20,12 0 1,1 52,32 A20,12 0 1,1 12,32 Z" }],
    viewBox: { minX: 0, minY: 0, width: 64, height: 44 },
  },
  {
    label: "Pentagon",
    paths: [{ d: "M32,4 L56,24 L48,52 L16,52 L8,24 Z" }],
    viewBox: { minX: 0, minY: 0, width: 64, height: 56 },
  },
];

interface ShapePanelProps {
  currentColor: string;
  onSelect: (shape: { paths: ShapePath[]; viewBox: ShapeViewBox }) => void;
}

export const ShapePanel = ({ currentColor, onSelect }: ShapePanelProps) => {
  return (
    <Box style={{ width: "240px" }}>
      <Grid columns="3" gap="2">
        {shapes.map((shape) => (
          <Button
            key={shape.label}
            variant="outline"
            color="gray"
            style={{
              height: "auto",
              padding: "12px",
              flexDirection: "column",
              gap: "8px",
            }}
            onClick={() =>
              onSelect({
                paths: shape.paths.map((path) => ({
                  ...path,
                  stroke: { color: currentColor, weight: 3 },
                  fill: { color: "#f8f9fa" },
                })),
                viewBox: shape.viewBox,
              })
            }
          >
            <Box
              style={{
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                viewBox={`${shape.viewBox.minX} ${shape.viewBox.minY} ${shape.viewBox.width} ${shape.viewBox.height}`}
                style={{ width: "100%", height: "100%" }}
              >
                <path d={shape.paths[0]?.d} stroke="none" fill="currentColor" />
              </svg>
            </Box>
            <Text size="1">{shape.label}</Text>
          </Button>
        ))}
      </Grid>
    </Box>
  );
};
