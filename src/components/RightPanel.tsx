import { Box, Flex, Heading, Slider, Switch, Text } from "@radix-ui/themes";
import type { ReactNode } from "react";
import { useStore } from "zustand";

import type { DesignEditor, ShapeFill } from "../editor";
import { RightPanelSection } from "./RightPanelSection";

interface RightPanelProps {
  editor: DesignEditor;
}

interface ControlRowProps {
  label: string;
  children: ReactNode;
}

const ControlRow = ({ label, children }: ControlRowProps) => (
  <Box
    style={{
      display: "grid",
      gridTemplateColumns: "60px 1fr",
      gap: "12px",
      alignItems: "center",
      marginBottom: "8px",
    }}
  >
    <Text size="2" color="gray">
      {label}
    </Text>
    <Box>{children}</Box>
  </Box>
);

export const RightPanel = ({ editor }: RightPanelProps) => {
  const { value, selection } = useStore(editor.stateStore);

  const selectedShape = selection ? value.shapes[selection.id] : null;
  const selectedText = selection ? value.texts[selection.id] : null;
  const selectedImage = selection ? value.images[selection.id] : null;
  const selectedElement = selectedShape || selectedText || selectedImage;



  if (!selectedElement) {
    return (
      <Box p="5">
        <Heading size="3" mb="4">
          Properties
        </Heading>
        <Text size="2">Select a shape or text to edit its properties</Text>
      </Box>
    );
  }

  // Handle text element
  if (selectedText) {
    return (
      <Box p="4">
        <Heading size="3" mb="4">
          Text Properties
        </Heading>
        <Flex direction="column" gap="3">
          <RightPanelSection title="Text">
            <ControlRow label="Content">
              <input
                type="text"
                value={selectedText.content}
                onChange={(event) => {
                  console.log('Text input changed:', event.target.value);
                  editor.updateTextContent(selectedText.id, event.target.value);
                }}
                onFocus={() => console.log('Text input focused')}
                onBlur={() => console.log('Text input blurred')}
                autoComplete="off"
                readOnly={false}
                placeholder="Enter text content..."
                style={{
                  width: "100%",
                  height: 28,
                  border: "1px solid var(--gray-6)",
                  borderRadius: "var(--radius-2)",
                  padding: "4px 8px",
                  backgroundColor: "var(--color-background)",
                  color: "var(--gray-12)",
                  cursor: "text",
                }}
              />
            </ControlRow>
            <ControlRow label="Size">
              <Slider
                min={8}
                max={72}
                value={[selectedText.fontSize]}
                onValueChange={(value) => {
                  editor.updateTextStyle(selectedText.id, { fontSize: value[0] ?? 16 });
                }}
              />
            </ControlRow>
            <ControlRow label="Color">
              <input
                type="color"
                value={selectedText.color}
                onChange={(event) => {
                  editor.updateTextStyle(selectedText.id, { color: event.target.value });
                }}
                style={{
                  width: "100%",
                  height: 28,
                  border: "1px solid var(--gray-6)",
                  borderRadius: "var(--radius-2)",
                  cursor: "pointer",
                }}
              />
            </ControlRow>
          </RightPanelSection>
        </Flex>
      </Box>
    );
  }

  // Handle image element
  if (selectedImage) {
    return (
      <Box p="4">
        <Heading size="3" mb="4">
          Image Properties
        </Heading>
        <Flex direction="column" gap="3">
          <RightPanelSection title="Size">
            <ControlRow label="Width">
              <Text size="2" color="gray">{selectedImage.bounds.width}px</Text>
            </ControlRow>
            <ControlRow label="Height">
              <Text size="2" color="gray">{selectedImage.bounds.height}px</Text>
            </ControlRow>
          </RightPanelSection>
          <RightPanelSection title="Opacity">
            <ControlRow label="Value">
              <Flex align="center" gap="2">
                <Box style={{ flex: 1 }}>
                  <Slider
                    min={0}
                    max={100}
                    value={[(selectedImage.opacity || 1) * 100]}
                    onValueChange={(value) => {
                      editor.updateImageOpacity(selectedImage.id, (value[0] ?? 100) / 100);
                    }}
                  />
                </Box>
              </Flex>
            </ControlRow>
          </RightPanelSection>
        </Flex>
      </Box>
    );
  }

  const path = selectedShape?.paths[0];
  const hasStroke = !!path?.stroke;
  const hasFill = !!path?.fill;
  const strokeColor = path?.stroke?.color || selectedShape?.rememberedStroke?.color || "#000000";
  const strokeWeight = path?.stroke?.weight || selectedShape?.rememberedStroke?.weight || 2;
  const fillColor = path?.fill?.color || selectedShape?.rememberedFill?.color || "#000000";

  const updateShapeProperties = (updates: {
    stroke?: { color?: string; weight?: number } | null;
    fill?: ShapeFill | null;
  }) => {
    if (!selectedShape) return;
    editor.updateShapePaths({
      ids: [selectedShape.id],
      attributes: updates,
    });
  };

  return (
    <Box p="4">
      <Heading size="3" mb="4">
        Shape Properties
      </Heading>

      <Flex direction="column" gap="3">
        <RightPanelSection title="Fill">
          <ControlRow label="Enabled">
            <Switch
              checked={hasFill}
              onCheckedChange={(isChecked) => {
                updateShapeProperties({
                  fill: isChecked
                    ? { color: selectedShape?.rememberedFill?.color || fillColor }
                    : null,
                });
              }}
            />
          </ControlRow>
          {hasFill && (
            <ControlRow label="Color">
              <input
                type="color"
                value={fillColor}
                onChange={(event) => {
                  updateShapeProperties({
                    fill: { color: event.target.value },
                  });
                }}
                style={{
                  width: "100%",
                  height: 28,
                  border: "1px solid var(--gray-6)",
                  borderRadius: "var(--radius-2)",
                  cursor: "pointer",
                }}
              />
            </ControlRow>
          )}
        </RightPanelSection>

        <RightPanelSection title="Stroke">
          <ControlRow label="Enabled">
            <Switch
              checked={hasStroke}
              onCheckedChange={(isChecked) => {
                updateShapeProperties({
                  stroke: isChecked
                    ? {
                        color: selectedShape?.rememberedStroke?.color || strokeColor,
                        weight: selectedShape?.rememberedStroke?.weight || strokeWeight,
                      }
                    : null,
                });
              }}
            />
          </ControlRow>
          {hasStroke && (
            <>
              <ControlRow label="Color">
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(event) => {
                    updateShapeProperties({
                      stroke: {
                        color: event.target.value,
                        weight: strokeWeight,
                      },
                    });
                  }}
                  style={{
                    width: "100%",
                    height: 28,
                    border: "1px solid var(--gray-6)",
                    borderRadius: "var(--radius-2)",
                    cursor: "pointer",
                  }}
                />
              </ControlRow>
              <ControlRow label="Weight">
                <Flex align="center" gap="2">
                  <Box style={{ flex: 1 }}>
                    <Slider
                      min={1}
                      max={20}
                      value={[strokeWeight]}
                      onValueChange={(value) => {
                        updateShapeProperties({
                          stroke: {
                            color: strokeColor,
                            weight: value[0] ?? strokeWeight,
                          },
                        });
                      }}
                    />
                  </Box>
                </Flex>
              </ControlRow>
            </>
          )}
        </RightPanelSection>

        <RightPanelSection title="Transparency">
          <ControlRow label="Value">
            <Flex align="center" gap="2">
              <Box style={{ flex: 1 }}>
                <Slider
                  min={0}
                  max={100}
                  value={[(selectedShape?.transparency || 0) * 100]}
                  onValueChange={(value) => {
                    if (!selectedShape) return;
                    editor.updateShapeAttributes({
                      ids: [selectedShape.id],
                      transparency: (value[0] ?? 0) / 100,
                    });
                  }}
                />
              </Box>
            </Flex>
          </ControlRow>
        </RightPanelSection>
      </Flex>
    </Box>
  );
};
