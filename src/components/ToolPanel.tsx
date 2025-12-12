import { Box, Flex, IconButton, Popover } from "@radix-ui/themes";
import { Redo, Shapes, Type, Undo, Image, Download } from "lucide-react";
import { useState } from "react";
import { useStore } from "zustand";

import type { DesignEditor, ShapePath, ShapeViewBox } from "../editor";
import { ShapePanel } from "./ShapePanel";
import { exportToPDF, getTimestampFilename, importImage } from "../utils/exportUtils";

export type ToolId = "shape" | "text" | null;

interface Tool {
  id: ToolId;
  icon: React.ElementType;
  label: string;
}

interface ToolPanelProps {
  currentToolId: ToolId;
  onCurrentToolIdChange: (id: ToolId) => void;
  editor: DesignEditor;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
}

export const ToolPanel = ({
  currentToolId,
  onCurrentToolIdChange,
  editor,
  canvasRef,
}: ToolPanelProps) => {
  const [isShapePopoverOpen, setIsShapePopoverOpen] = useState(false);
  const { canUndo, canRedo } = useStore(editor.stateStore);

  const handlePDFExport = () => {
    if (!canvasRef?.current) {
      alert('Canvas not found. Please try again.');
      return;
    }
    const filename = getTimestampFilename('design');
    const designValue = editor.state.value;
    exportToPDF(canvasRef.current, designValue, filename);
  };

  const handleImageUpload = async () => {
    const imageData = await importImage();
    if (imageData) {
      // 缩放图片到合适大小 (最大400x300)
      const maxWidth = 400;
      const maxHeight = 300;
      const scale = Math.min(maxWidth / imageData.width, maxHeight / imageData.height, 1);

      const scaledWidth = Math.round(imageData.width * scale);
      const scaledHeight = Math.round(imageData.height * scale);

      editor.createImage({
        src: imageData.dataUrl,
        width: scaledWidth,
        height: scaledHeight,
      });
    }
  };

  const tools: Tool[] = [
    { id: "shape", icon: Shapes, label: "Shapes" },
    { id: "text", icon: Type, label: "Text" }
  ];

  const handleShapeSelect = (shapeDef: {
    paths: ShapePath[];
    viewBox: ShapeViewBox;
  }) => {
    const width = 100;
    const height = width * (shapeDef.viewBox.height / shapeDef.viewBox.width);
    editor.createShape({
      ...shapeDef,
      width,
      height,
    });
    setIsShapePopoverOpen(false);
    onCurrentToolIdChange(null);
  };

  return (
    <Flex direction="column" p="2" gap="2">
      {/* Undo/Redo buttons */}
      <Box
        style={{
          width: "48px",
          height: "48px",
          padding: "2px",
        }}
      >
        <IconButton
          size="2"
          variant="surface"
          color="gray"
          highContrast
          disabled={!canUndo}
          onClick={() => editor.undo()}
          style={{
            width: "100%",
            height: "100%",
            flexDirection: "column",
            gap: "2px",
            padding: "6px",
          }}
          title="Undo (Ctrl+Z)"
        >
          <Undo size={16} strokeWidth={1.5} />
          <Box as="span" style={{ fontSize: "8px", lineHeight: 1 }}>
            Undo
          </Box>
        </IconButton>
      </Box>

      <Box
        style={{
          width: "48px",
          height: "48px",
          padding: "2px",
        }}
      >
        <IconButton
          size="2"
          variant="surface"
          color="gray"
          highContrast
          disabled={!canRedo}
          onClick={() => editor.redo()}
          style={{
            width: "100%",
            height: "100%",
            flexDirection: "column",
            gap: "2px",
            padding: "6px",
          }}
          title="Redo (Ctrl+Y)"
        >
          <Redo size={16} strokeWidth={1.5} />
          <Box as="span" style={{ fontSize: "8px", lineHeight: 1 }}>
            Redo
          </Box>
        </IconButton>
      </Box>

      {/* Separator */}
      <Box style={{ height: "1px", background: "var(--gray-6)", margin: "4px 8px" }} />

      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = currentToolId === tool.id;

        if (tool.id === "shape") {
          return (
            <Popover.Root
              key={tool.id}
              open={isShapePopoverOpen}
              onOpenChange={setIsShapePopoverOpen}
            >
              <Popover.Trigger>
                <Box
                  style={{
                    width: "48px",
                    height: "48px",
                    padding: "2px",
                  }}
                >
                  <IconButton
                    size="2"
                    variant={isShapePopoverOpen ? "soft" : "surface"}
                    color={isShapePopoverOpen ? "blue" : "gray"}
                    highContrast={!isShapePopoverOpen}
                    style={{
                      width: "100%",
                      height: "100%",
                      flexDirection: "column",
                      gap: "4px",
                      padding: "8px",
                    }}
                  >
                    <Icon size={20} strokeWidth={1.5} />
                    <Box as="span" style={{ fontSize: "10px", lineHeight: 1 }}>
                      {tool.label}
                    </Box>
                  </IconButton>
                </Box>
              </Popover.Trigger>
              <Popover.Content side="right" sideOffset={8}>
                <ShapePanel
                  currentColor="#3366ff"
                  onSelect={handleShapeSelect}
                />
              </Popover.Content>
            </Popover.Root>
          );
        }

        return (
          <Box
            key={tool.id}
            style={{
              width: "48px",
              height: "48px",
              padding: "2px",
            }}
          >
            <IconButton
              size="2"
              variant={isActive ? "soft" : "surface"}
              color={isActive ? "blue" : "gray"}
              highContrast={!isActive}
              onClick={() => {
                if (tool.id === currentToolId) {
                  onCurrentToolIdChange(null);
                } else {
                  onCurrentToolIdChange(tool.id);
                }
              }}
              style={{
                width: "100%",
                height: "100%",
                flexDirection: "column",
                gap: "4px",
                padding: "8px",
              }}
            >
              <Icon size={20} strokeWidth={1.5} />
              <Box as="span" style={{ fontSize: "10px", lineHeight: 1 }}>
                {tool.label}
              </Box>
            </IconButton>
          </Box>
        );
      })}

      {/* Image Upload */}
      <Box
        style={{
          width: "48px",
          height: "48px",
          padding: "2px",
        }}
      >
        <IconButton
          size="2"
          variant="surface"
          color="gray"
          highContrast
          onClick={handleImageUpload}
          style={{
            width: "100%",
            height: "100%",
            flexDirection: "column",
            gap: "2px",
            padding: "6px",
          }}
          title="Upload Image"
        >
          <Image size={16} strokeWidth={1.5} />
          <Box as="span" style={{ fontSize: "8px", lineHeight: 1 }}>
            Image
          </Box>
        </IconButton>
      </Box>

      {/* PDF Download */}
      <Box
        style={{
          width: "48px",
          height: "48px",
          padding: "2px",
        }}
      >
        <IconButton
          size="2"
          variant="surface"
          color="gray"
          highContrast
          onClick={handlePDFExport}
          style={{
            width: "100%",
            height: "100%",
            flexDirection: "column",
            gap: "2px",
            padding: "6px",
          }}
          title="Export PDF"
        >
          <Download size={16} strokeWidth={1.5} />
          <Box as="span" style={{ fontSize: "8px", lineHeight: 1 }}>
            PDF
          </Box>
        </IconButton>
      </Box>
    </Flex>
  );
};
