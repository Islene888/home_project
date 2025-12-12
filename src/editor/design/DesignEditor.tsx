import { type StoreApi, createStore } from "zustand/vanilla";

import { compactMap, uniqued } from "../../utils";
import {
  CreateShapeCommand,
  DeleteShapeCommand,
  HistoryManager,
  UpdateShapeCommand,
} from "../commands";
import type {
  DesignValue,
  ID,
  ShapeDef,
  ShapeFill,
  ShapePath,
  ShapeViewBox,
} from "../schema";
import { type Selection } from "../selection";
import type { ReadonlyStoreApi } from "../types/store";

interface EditorState {
  value: DesignValue;
  selection: Selection | null;
  canUndo: boolean;
  canRedo: boolean;
}

export interface DesignEditorOptions {
  value: DesignValue;
}

class DesignEditor {
  #stateStore: StoreApi<EditorState>;
  #historyManager: HistoryManager;

  constructor(options: DesignEditorOptions) {
    const { value } = options;
    this.#historyManager = new HistoryManager();
    this.#stateStore = createStore<EditorState>()(() => ({
      value,
      selection: null,
      canUndo: false,
      canRedo: false,
    }));
  }

  get stateStore(): ReadonlyStoreApi<EditorState> {
    return this.#stateStore;
  }

  get state() {
    return this.#stateStore.getState();
  }

  #updateHistoryState() {
    this.#stateStore.setState({
      canUndo: this.#historyManager.canUndo(),
      canRedo: this.#historyManager.canRedo(),
    });
  }

  setSelection(newSelection: Selection | null) {
    this.#stateStore.setState({ selection: newSelection });
  }

  loadDesign(value: DesignValue) {
    // Clear history when loading a new design
    this.#historyManager = new HistoryManager();
    this.#stateStore.setState({
      value,
      selection: null,
      canUndo: false,
      canRedo: false,
    });
  }

  // Method to update design data without affecting selection state
  updateDesignData(value: DesignValue) {
    const currentState = this.#stateStore.getState();
    // Clean undefined values before setting state to ensure Firebase compatibility
    const cleanedValue = this.#cleanUndefinedValues(value);
    this.#stateStore.setState({
      ...currentState,
      value: cleanedValue,
    });
  }

  // Helper method to remove undefined values from objects (for Firebase compatibility)
  #cleanUndefinedValues(obj: any): any {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.#cleanUndefinedValues(item));
    }

    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = this.#cleanUndefinedValues(value);
      }
    }
    return cleaned;
  }

  undo() {
    const previousValue = this.#historyManager.undo();
    if (previousValue) {
      this.#stateStore.setState({
        value: previousValue,
        selection: null,
      });
      this.#updateHistoryState();
    }
  }

  redo() {
    const nextValue = this.#historyManager.redo();
    if (nextValue) {
      this.#stateStore.setState({
        value: nextValue,
        selection: null,
      });
      this.#updateHistoryState();
    }
  }

  #getShapeBoundsInCenter(
    size: { width: number; height: number },
    value: DesignValue,
  ): ShapeDef["bounds"] {
    return {
      left: value.attributes.width / 2 - size.width / 2,
      top: value.attributes.height / 2 - size.height / 2,
      width: size.width,
      height: size.height,
    };
  }

  #updateShapes(
    value: DesignValue,
    ids: string[],
    updater: (shape: ShapeDef) => ShapeDef,
  ): { nextValue: DesignValue; updatedIds: string[] } {
    const shapes = compactMap(ids, (id) => {
      const shape = value.shapes[id];
      const newShape = updater(shape);
      return newShape === shape ? null : newShape;
    });

    const newValue = {
      ...value,
      shapes: {
        ...value.shapes,
        ...Object.fromEntries(shapes.map((shape) => [shape.id, shape])),
      },
    };

    return {
      nextValue: newValue,
      updatedIds: shapes.map((shape) => shape.id),
    };
  }

  replaceShapes(payload: { shapes: ShapeDef[] }) {
    const { shapes } = payload;
    const updatedIds = shapes.map((shape) => shape.id);

    const nextValue = {
      ...this.state.value,
      shapes: {
        ...this.state.value.shapes,
        ...Object.fromEntries(shapes.map((shape) => [shape.id, shape])),
      },
    };

    this.#stateStore.setState({ value: this.#cleanUndefinedValues(nextValue) });
    return updatedIds;
  }

  updateShapeAttributes(payload: { ids: ID[]; transparency?: number }) {
    const { ids, ...attributes } = payload;

    const nextValue = {
      ...this.state.value,
      shapes: {
        ...this.state.value.shapes,
        ...Object.fromEntries(
          compactMap(ids, (id) => {
            const shape = this.state.value.shapes[id];
            if (!shape) return null;

            return [
              id,
              {
                ...shape,
                ...attributes,
              },
            ];
          }),
        ),
      },
    };

    this.#stateStore.setState({ value: this.#cleanUndefinedValues(nextValue) });
    return ids;
  }

  createShape(payload: {
    left?: number;
    top?: number;
    width: number;
    height: number;
    viewBox: ShapeViewBox;
    paths: ShapePath[];
  }): ID {
    const nodeId = crypto.randomUUID();
    const previousValue = this.state.value;
    const nextValue = {
      ...previousValue,
      shapes: {
        ...previousValue.shapes,
        [nodeId]: {
          type: "shape" as const,
          id: nodeId,
          bounds: {
            ...this.#getShapeBoundsInCenter(payload, previousValue),
            ...(payload.left ? { left: payload.left } : null),
            ...(payload.top ? { top: payload.top } : null),
          },
          viewBox: {
            minX: payload.viewBox.minX,
            minY: payload.viewBox.minY,
            width: payload.viewBox.width,
            height: payload.viewBox.height,
          },
          paths: payload.paths.slice(),
        },
      },
    };

    const command = new CreateShapeCommand(previousValue, nextValue, nodeId);
    const resultValue = this.#historyManager.executeCommand(command);

    this.#stateStore.setState({
      selection: { id: nodeId },
      value: resultValue,
    });
    this.#updateHistoryState();
    return nodeId;
  }

  createText(payload: {
    left: number;
    top: number;
    content: string;
    fontSize: number;
    color: string;
    fontWeight: "normal" | "bold";
    fontFamily: string;
  }): ID {
    const textId = crypto.randomUUID();
    const previousValue = this.state.value;
    const nextValue = {
      ...previousValue,
      texts: {
        ...previousValue.texts,
        [textId]: {
          type: "text" as const,
          id: textId,
          bounds: {
            left: payload.left,
            top: payload.top,
            width: 100,
            height: payload.fontSize * 1.2,
          },
          content: payload.content,
          fontSize: payload.fontSize,
          color: payload.color,
          fontWeight: payload.fontWeight,
          fontFamily: payload.fontFamily,
        },
      },
    };

    // Create command for undo/redo
    const command = new CreateShapeCommand(previousValue, nextValue, textId);
    const resultValue = this.#historyManager.executeCommand(command);

    this.#stateStore.setState({
      selection: { id: textId },
      value: resultValue,
    });
    this.#updateHistoryState();
    return textId;
  }

  createImage(payload: {
    src: string;
    width: number;
    height: number;
    left?: number;
    top?: number;
  }): ID {
    const imageId = crypto.randomUUID();
    const previousValue = this.state.value;
    const bounds = {
      left: payload.left ?? previousValue.attributes.width / 2 - payload.width / 2,
      top: payload.top ?? previousValue.attributes.height / 2 - payload.height / 2,
      width: payload.width,
      height: payload.height,
    };

    const nextValue = {
      ...previousValue,
      images: {
        ...previousValue.images,
        [imageId]: {
          type: "image" as const,
          id: imageId,
          bounds,
          src: payload.src,
          opacity: 1,
        },
      },
    };

    // Create command for undo/redo
    const command = new CreateShapeCommand(previousValue, nextValue, imageId);
    const resultValue = this.#historyManager.executeCommand(command);

    this.#stateStore.setState({
      selection: { id: imageId },
      value: resultValue,
    });
    this.#updateHistoryState();
    return imageId;
  }

  updateTextContent(textId: ID, content: string) {
    const previousValue = this.state.value;
    const currentText = previousValue.texts[textId];

    if (!currentText) return;

    const nextValue = {
      ...previousValue,
      texts: {
        ...previousValue.texts,
        [textId]: {
          ...currentText,
          content: content,
        },
      },
    };

    // Create command for undo/redo
    const command = new UpdateShapeCommand(previousValue, nextValue, [textId], "Update text content");
    const resultValue = this.#historyManager.executeCommand(command);

    this.#stateStore.setState({ value: this.#cleanUndefinedValues(resultValue) });
    this.#updateHistoryState();
  }

  updateTextStyle(textId: ID, style: { fontSize?: number; color?: string }) {
    const previousValue = this.state.value;
    const currentText = previousValue.texts[textId];

    if (!currentText) return;

    const nextValue = {
      ...previousValue,
      texts: {
        ...previousValue.texts,
        [textId]: {
          ...currentText,
          ...style,
        },
      },
    };

    const command = new UpdateShapeCommand(previousValue, nextValue, [textId], "Update text style");
    const resultValue = this.#historyManager.executeCommand(command);

    this.#stateStore.setState({ value: this.#cleanUndefinedValues(resultValue) });
    this.#updateHistoryState();
  }

  updateTextPosition(textId: ID, left: number, top: number) {
    const previousValue = this.state.value;
    const currentText = previousValue.texts[textId];

    if (!currentText) return;

    const nextValue = {
      ...previousValue,
      texts: {
        ...previousValue.texts,
        [textId]: {
          ...currentText,
          bounds: {
            ...currentText.bounds,
            left,
            top,
          },
        },
      },
    };

    this.#stateStore.setState({ value: this.#cleanUndefinedValues(nextValue) });
  }

  updateImagePosition(imageId: ID, left: number, top: number) {
    const previousValue = this.state.value;
    const currentImage = previousValue.images[imageId];

    if (!currentImage) return;

    const nextValue = {
      ...previousValue,
      images: {
        ...previousValue.images,
        [imageId]: {
          ...currentImage,
          bounds: {
            ...currentImage.bounds,
            left,
            top,
          },
        },
      },
    };

    this.#stateStore.setState({ value: this.#cleanUndefinedValues(nextValue) });
  }

  updateImageBounds(imageId: ID, bounds: { left: number; top: number; width: number; height: number }) {
    const previousValue = this.state.value;
    const currentImage = previousValue.images[imageId];

    if (!currentImage) return;

    const nextValue = {
      ...previousValue,
      images: {
        ...previousValue.images,
        [imageId]: {
          ...currentImage,
          bounds,
        },
      },
    };

    this.#stateStore.setState({ value: this.#cleanUndefinedValues(nextValue) });
  }

  updateImageOpacity(imageId: ID, opacity: number) {
    const previousValue = this.state.value;
    const currentImage = previousValue.images[imageId];

    if (!currentImage) return;

    const nextValue = {
      ...previousValue,
      images: {
        ...previousValue.images,
        [imageId]: {
          ...currentImage,
          opacity,
        },
      },
    };

    const command = new UpdateShapeCommand(previousValue, nextValue, [imageId], "Update image opacity");
    const resultValue = this.#historyManager.executeCommand(command);

    this.#stateStore.setState({ value: this.#cleanUndefinedValues(resultValue) });
    this.#updateHistoryState();
  }

  deleteShapes(nodeIds: ID[]) {
    const previousValue = this.state.value;
    const uniqueIds = uniqued(nodeIds);
    const deleteIds = uniqueIds.filter((id) => previousValue.shapes[id]);

    if (deleteIds.length === 0) {
      return [];
    }

    const nextValue = {
      ...previousValue,
      shapes: Object.fromEntries(
        Object.entries(previousValue.shapes).filter(([id]) => !deleteIds.includes(id)),
      ),
    };

    const command = new DeleteShapeCommand(previousValue, nextValue, deleteIds);
    const resultValue = this.#historyManager.executeCommand(command);

    this.#stateStore.setState({
      selection: null,
      value: resultValue,
    });
    this.#updateHistoryState();
    return deleteIds;
  }

  deleteTexts(nodeIds: ID[]) {
    const previousValue = this.state.value;
    const uniqueIds = uniqued(nodeIds);
    const deleteIds = uniqueIds.filter((id) => previousValue.texts[id]);

    if (deleteIds.length === 0) {
      return [];
    }

    const nextValue = {
      ...previousValue,
      texts: Object.fromEntries(
        Object.entries(previousValue.texts).filter(([id]) => !deleteIds.includes(id)),
      ),
    };

    const command = new DeleteShapeCommand(previousValue, nextValue, deleteIds);
    const resultValue = this.#historyManager.executeCommand(command);

    this.#stateStore.setState({
      selection: null,
      value: resultValue,
    });
    this.#updateHistoryState();
    return deleteIds;
  }

  deleteImages(nodeIds: ID[]) {
    const previousValue = this.state.value;
    const uniqueIds = uniqued(nodeIds);
    const deleteIds = uniqueIds.filter((id) => previousValue.images[id]);

    if (deleteIds.length === 0) {
      return [];
    }

    const nextValue = {
      ...previousValue,
      images: Object.fromEntries(
        Object.entries(previousValue.images).filter(([id]) => !deleteIds.includes(id)),
      ),
    };

    const command = new DeleteShapeCommand(previousValue, nextValue, deleteIds);
    const resultValue = this.#historyManager.executeCommand(command);

    this.#stateStore.setState({
      selection: null,
      value: resultValue,
    });
    this.#updateHistoryState();
    return deleteIds;
  }

  updateShapePaths(payload: {
    ids: string[];
    attributes: {
      stroke?: {
        color?: string;
        weight?: number;
        dasharray?: [number, number] | null;
      } | null;
      fill?: ShapeFill | null;
    };
  }) {
    const { ids, attributes } = payload;
    const previousValue = this.state.value;

    const defaultStroke = {
      color: "#000000",
      weight: 4,
    };

    const { nextValue } = this.#updateShapes(
      previousValue,
      ids,
      (shape) => {
        let updatedShape = { ...shape };

        // Handle stroke memory - 简化逻辑
        if (attributes.stroke !== undefined) {
          if (attributes.stroke === null) {
            // Disabling stroke - remember current settings if available
            const currentStroke = shape.paths[0]?.stroke;
            if (currentStroke) {
              updatedShape.rememberedStroke = {
                color: currentStroke.color || defaultStroke.color,
                weight: currentStroke.weight || defaultStroke.weight,
              };
            }
          } else {
            // Enabling stroke - save the provided attributes
            updatedShape.rememberedStroke = {
              color: attributes.stroke.color || defaultStroke.color,
              weight: attributes.stroke.weight || defaultStroke.weight,
            };
          }
        }

        // Handle fill changes with memory persistence
        if (attributes.fill !== undefined) {
          const currentFill = shape.paths[0]?.fill;

          if (attributes.fill === null) {
            // Disabling fill - remember current settings
            if (currentFill) {
              updatedShape.rememberedFill = currentFill;
            }
          } else {
            // Enabling or updating fill
            updatedShape.rememberedFill = attributes.fill;
          }
        }

        // Update paths with new attributes
        updatedShape.paths = shape.paths.map((path) => {
          const updatedPath: any = { ...path };

          // Handle stroke updates - 简化逻辑
          if (attributes.stroke !== undefined) {
            if (attributes.stroke === null) {
              // Remove stroke property entirely
              delete updatedPath.stroke;
            } else {
              // Create stroke with only the provided attributes
              updatedPath.stroke = {
                color: attributes.stroke.color || defaultStroke.color,
                weight: attributes.stroke.weight || defaultStroke.weight,
              };

              // Only add dasharray if it's explicitly provided
              if (attributes.stroke.dasharray) {
                updatedPath.stroke.dasharray = attributes.stroke.dasharray;
              }
            }
          }

          // Handle fill updates
          if (attributes.fill !== undefined) {
            if (attributes.fill === null) {
              // Remove fill property entirely instead of setting to undefined
              delete updatedPath.fill;
            } else {
              // Update fill with new values
              updatedPath.fill = attributes.fill;
            }
          }

          // Only add default fill if this is a stroke-only shape being disabled
          // and it doesn't already have a fill
          if (!updatedPath.stroke && !updatedPath.fill && attributes.stroke === null) {
            updatedPath.fill = { color: "#f8f9fa" };
          }

          return updatedPath;
        });

        return updatedShape;
      }
    );

    const operation = attributes.stroke !== undefined
      ? (attributes.stroke === null ? "Remove stroke" : "Update stroke")
      : (attributes.fill === null ? "Remove fill" : "Update fill");

    const command = new UpdateShapeCommand(previousValue, nextValue, ids, operation);
    const resultValue = this.#historyManager.executeCommand(command);

    this.#stateStore.setState({ value: this.#cleanUndefinedValues(resultValue) });
    this.#updateHistoryState();
  }
}

export default DesignEditor;
