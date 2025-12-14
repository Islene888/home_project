import { useRef } from "react";
import { useStore } from "zustand";

import ImageNode from "../image/ImageNode";
// import { isPointHitLayout } from "../math/hitTests";
import { Element, ShapeDef } from "../schema";
import { type Selection, SelectionArea } from "../selection";
import TextSelectionArea from "../selection/TextSelectionArea";
import ShapeNode from "../shape/ShapeNode";
import TextNode from "../text/TextNode";
import useDragGesture from "../utils/useDragGesture";
import DesignEditor from "./DesignEditor";

export interface DesignViewProps {
  editor: DesignEditor;
  currentTool?: string;
  onToolChange?: (tool: "shape" | "text" | null) => void;
}

const DesignView = ({ editor, currentTool, onToolChange }: DesignViewProps) => {
  const { value, selection } = useStore(editor.stateStore);
  const isDoubleClickingRef = useRef(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedShape =
    selection && value?.shapes ? value.shapes[selection.id] : null;
  const selectedText =
    selection && value?.texts ? value.texts[selection.id] : null;
  const selectedImage =
    selection && value?.images ? value.images[selection.id] : null;
  const selectedElement = selectedShape || selectedText || selectedImage;

  const { onDragStart, dragProps } = useDragGesture<Element>({
    onMove: ({ deltaX, deltaY, snapshot }) => {
      const updatedElement = {
        ...snapshot,
        bounds: {
          ...snapshot.bounds,
          left: snapshot.bounds.left + deltaX,
          top: snapshot.bounds.top + deltaY,
        },
      };

      if (snapshot.type === "shape") {
        editor.replaceShapes({
          shapes: [updatedElement as ShapeDef],
        });
      } else if (snapshot.type === "text") {
        // For text, we need to update the text position
        editor.updateTextPosition(
          snapshot.id,
          updatedElement.bounds.left,
          updatedElement.bounds.top,
        );
      } else if (snapshot.type === "image") {
        // For images, we need to update the image position
        editor.updateImagePosition(
          snapshot.id,
          updatedElement.bounds.left,
          updatedElement.bounds.top,
        );
      }
    },
  });

  const shapes = Object.values(value?.shapes || {});
  const texts = Object.values(value?.texts || {});
  const images = Object.values(value?.images || {});

  return (
    <div
      tabIndex={-1}
      style={{
        width: value?.attributes?.width || 800,
        height: value?.attributes?.height || 600,
        position: "relative",
        userSelect: "none",
      }}
      onKeyDown={(event) => {
        const { key } = event;
        if (!selection) return;

        switch (key) {
          case "Escape": {
            editor.setSelection(null);
            break;
          }
          case "Delete":
          case "Backspace": {
            if (selectedShape) {
              editor.deleteShapes([selection.id]);
            } else if (selectedText) {
              editor.deleteTexts([selection.id]);
            } else if (selectedImage) {
              editor.deleteImages([selection.id]);
            }
            editor.setSelection(null);
            break;
          }
          default:
            break;
        }
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          overflow: "clip",
        }}
        {...dragProps}
        onPointerDown={(event) => {
          if (event.button !== 0) return;

          const relativeRect = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - relativeRect.left;
          const y = event.clientY - relativeRect.top;

          // Handle text tool
          if (currentTool === "text") {
            editor.createText({
              left: x,
              top: y,
              content: "Click to edit text",
              fontSize: 16,
              color: "#000000",
              fontWeight: "normal",
              fontFamily: "Arial, sans-serif",
            });
            onToolChange?.(null);
            return;
          }

          // Clear selection if clicking on empty space
          editor.setSelection(null);
        }}
        onPointerMove={dragProps.onPointerMove}
        onLostPointerCapture={dragProps.onLostPointerCapture}
      >
        {shapes.map((shape) => (
          <div
            key={shape.id}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              translate: `${shape.bounds.left}px ${shape.bounds.top}px`,
              width: shape.bounds.width,
              height: shape.bounds.height,
              opacity: 1 - (shape.transparency ?? 0),
              pointerEvents: "auto",
              userSelect: "none",
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
              const newSelection: Selection = { id: shape.id };
              editor.setSelection(newSelection);
              onDragStart(event, shape);
            }}
          >
            <ShapeNode shape={shape} />
          </div>
        ))}
        {texts.map((text) => (
          <div
            key={text.id}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              translate: `${text.bounds.left}px ${text.bounds.top}px`,
              width: text.bounds.width,
              height: text.bounds.height,
              pointerEvents: "auto",
              userSelect: "auto",
            }}
            onPointerDown={(event) => {
              const target = event.target as HTMLElement;
              if (target.tagName === "INPUT" || isDoubleClickingRef.current) {
                return; // Don't interfere with text editing or double clicking
              }

              // Clear any existing timeout
              if (dragTimeoutRef.current) {
                clearTimeout(dragTimeoutRef.current);
                dragTimeoutRef.current = null;
              }

              event.stopPropagation();
              const newSelection: Selection = { id: text.id };
              editor.setSelection(newSelection);

              // Store event data for delayed drag start
              const eventData = {
                clientX: event.clientX,
                clientY: event.clientY,
                currentTarget: event.currentTarget,
                pointerId: event.pointerId,
                buttons: event.buttons,
              };

              // Delay drag start to allow double click detection
              dragTimeoutRef.current = setTimeout(() => {
                if (!isDoubleClickingRef.current && eventData.buttons === 1) {
                  // Create a synthetic event-like object for onDragStart
                  const syntheticEvent = {
                    clientX: eventData.clientX,
                    clientY: eventData.clientY,
                    currentTarget: eventData.currentTarget,
                    pointerId: eventData.pointerId,
                    buttons: eventData.buttons,
                  };
                  onDragStart(syntheticEvent as any, text);
                }
                dragTimeoutRef.current = null;
              }, 250);
            }}
            onDoubleClick={() => {
              isDoubleClickingRef.current = true;

              // Clear any pending drag operation
              if (dragTimeoutRef.current) {
                clearTimeout(dragTimeoutRef.current);
                dragTimeoutRef.current = null;
              }

              // Don't stop propagation - let TextNode handle the double click
              // Reset flag after double click is processed
              setTimeout(() => {
                isDoubleClickingRef.current = false;
              }, 300);
            }}
          >
            <TextNode
              text={text}
              onContentChange={(id, content) =>
                editor.updateTextContent(id, content)
              }
            />
          </div>
        ))}
        {images.map((image) => (
          <div
            key={image.id}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              translate: `${image.bounds.left}px ${image.bounds.top}px`,
              width: image.bounds.width,
              height: image.bounds.height,
              pointerEvents: "auto",
              userSelect: "none",
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
              const newSelection: Selection = { id: image.id };
              editor.setSelection(newSelection);
              onDragStart(event, image);
            }}
          >
            <ImageNode image={image} />
          </div>
        ))}
      </div>
      {selectedElement && selectedElement.type === "shape" && (
        <SelectionArea
          shape={selectedElement}
          onSelectionChange={(newSelection) =>
            editor.setSelection(newSelection)
          }
          onShapesChange={(shapes) => {
            editor.replaceShapes({ shapes });
          }}
        />
      )}
      {selectedElement && selectedElement.type === "text" && (
        <TextSelectionArea
          text={selectedElement}
          onSelectionChange={(newSelection) =>
            editor.setSelection(newSelection)
          }
        />
      )}
      {selectedElement && selectedElement.type === "image" && (
        <SelectionArea
          shape={{
            ...selectedElement,
            type: "shape",
            paths: [],
            viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
          }}
          onSelectionChange={(newSelection) =>
            editor.setSelection(newSelection)
          }
          onShapesChange={(shapes) => {
            if (shapes[0]) {
              editor.updateImageBounds(selectedElement.id, shapes[0].bounds);
            }
          }}
        />
      )}
    </div>
  );
};

export default DesignView;
