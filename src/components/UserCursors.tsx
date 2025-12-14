import { Box } from "@radix-ui/themes";
import { MousePointer2 } from "lucide-react";

interface UserCursorsProps {
  cursors: any[];
}

export const UserCursors = ({ cursors }: UserCursorsProps) => {
  return (
    <>
      {cursors.map((cursor, index) => (
        <Box
          key={`${cursor.name}-${index}`}
          style={{
            position: "absolute",
            left: cursor.x,
            top: cursor.y,
            pointerEvents: "none",
            zIndex: 1000,
            transform: "translate(-2px, -2px)",
          }}
        >
          {/* 光标图标 */}
          <MousePointer2
            size={18}
            style={{
              color: cursor.color,
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
            }}
          />

          {/* 用户名标签 */}
          <Box
            style={{
              position: "absolute",
              top: "20px",
              left: "8px",
              backgroundColor: cursor.color,
              color: "white",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "500",
              whiteSpace: "nowrap",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          >
            {cursor.name}
          </Box>
        </Box>
      ))}
    </>
  );
};
