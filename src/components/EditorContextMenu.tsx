import { ContextMenu } from "@radix-ui/themes";
import { useStore } from "zustand";

import type { DesignEditor } from "../editor";

interface EditorContextMenuProps {
  editor: DesignEditor;
  children: React.ReactNode;
}

export const EditorContextMenu = ({
  editor,
  children,
}: EditorContextMenuProps) => {
  const { selection, value } = useStore(editor.stateStore);
  const hasSelection = !!selection;

  const selectedElement = selection ? (
    value.shapes[selection.id] ||
    value.texts[selection.id] ||
    value.images[selection.id]
  ) : null;

  const handleDelete = () => {
    if (selection && selectedElement) {
      if (selectedElement.type === "shape") {
        editor.deleteShapes([selection.id]);
      } else if (selectedElement.type === "text") {
        editor.deleteTexts([selection.id]);
      } else if (selectedElement.type === "image") {
        editor.deleteImages([selection.id]);
      }
      editor.setSelection(null);
    }
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <div style={{ display: "inline-block" }}>{children}</div>
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item
          disabled={!hasSelection}
          onClick={handleDelete}
          shortcut="⌫"
        >
          Delete
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
};
