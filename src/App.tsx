import { Box, Flex } from "@radix-ui/themes";
import { useEffect, useRef, useState } from "react";

import { EditorContextMenu } from "./components/EditorContextMenu";
import { RightPanel } from "./components/RightPanel";
import { type ToolId, ToolPanel } from "./components/ToolPanel";
import { DesignEditor, type DesignValue, DesignView } from "./editor";
import { CollaborativeService } from "./firebase/collaborative";
import { OnlineUsers } from "./components/OnlineUsers";
import { UserCursors } from "./components/UserCursors";

const DEFAULT_EDITOR_VALUE: DesignValue = {
  shapes: {},
  texts: {},
  images: {},
  attributes: {
    width: 800,
    height: 600,
  },
};

function App() {
  const [currentToolId, setCurrentToolId] = useState<ToolId>(null);
  const [editor] = useState(
    () => new DesignEditor({ value: DEFAULT_EDITOR_VALUE }),
  );
  const canvasRef = useRef<HTMLDivElement>(null);
  const [collaborative] = useState(() => new CollaborativeService());
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [cursors, setCursors] = useState<any[]>([]);

  // 设置协作功能
  useEffect(() => {
    // 设置设计数据同步
    const updateDesign = collaborative.syncDesign(
      editor.state.value,
      (newValue) => {
        editor.updateDesignData(newValue);
      }
    );

    // 监听编辑器状态变化并同步
    const unsubscribe = editor.stateStore.subscribe((state) => {
      updateDesign(state.value);
    });

    // 监听在线用户
    collaborative.onUsersChange(setOnlineUsers);

    // 监听光标位置
    collaborative.onCursorsChange(setCursors);

    return () => {
      unsubscribe();
      collaborative.cleanup();
    };
  }, [collaborative, editor]);

  // 鼠标移动时更新光标位置
  const handleMouseMove = (event: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      collaborative.updateCursor(x, y);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for undo/redo keyboard shortcuts
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault();
          editor.undo();
        } else if ((event.key === 'z' && event.shiftKey) || event.key === 'y') {
          event.preventDefault();
          editor.redo();
        }
      }

      // Delete key for element deletion
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const { selection, value } = editor.state;
        if (selection) {
          event.preventDefault();
          const selectedShape = value.shapes[selection.id];
          const selectedText = value.texts[selection.id];
          const selectedImage = value.images[selection.id];

          if (selectedShape) {
            editor.deleteShapes([selection.id]);
          } else if (selectedText) {
            editor.deleteTexts([selection.id]);
          } else if (selectedImage) {
            editor.deleteImages([selection.id]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, currentToolId]);

  return (
    <Flex height="100vh" style={{ background: "var(--gray-2)" }}>
      <Box
        width="64px"
        style={{
          background: "var(--color-background)",
          borderRight: "1px solid var(--gray-5)",
        }}
      >
        <ToolPanel
          currentToolId={currentToolId}
          onCurrentToolIdChange={setCurrentToolId}
          editor={editor}
          canvasRef={canvasRef}
        />
      </Box>

      <Flex flexGrow="1" align="center" justify="center" position="relative">
        {/* 在线用户列表 */}
        <OnlineUsers users={onlineUsers} collaborative={collaborative} />

        <Box
          ref={canvasRef}
          className="design-canvas"
          style={{
            background: "var(--color-background)",
            boxShadow: "var(--shadow-4)",
            borderRadius: "var(--radius-2)",
            position: "relative",
          }}
          onMouseMove={handleMouseMove}
        >
          <EditorContextMenu
            editor={editor}
          >
            <DesignView
              editor={editor}
              currentTool={currentToolId || undefined}
              onToolChange={setCurrentToolId}
            />
          </EditorContextMenu>

          {/* 用户光标 */}
          <UserCursors cursors={cursors} />
        </Box>

      </Flex>

      <Box
        width="280px"
        style={{
          background: "var(--color-background)",
          borderLeft: "1px solid var(--gray-5)",
        }}
      >
        <RightPanel editor={editor} />
      </Box>

    </Flex>
  );
}

export default App;
