import { useEffect, useState } from "react";
import type { TextElement } from "../schema";

interface TextNodeProps {
  text: TextElement;
  onContentChange?: (id: string, content: string) => void;
}

const TextNode = ({ text, onContentChange }: TextNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(text.content);

  // Sync local content with props when text changes
  useEffect(() => {
    setContent(text.content);
  }, [text.content]);

  const handleDoubleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (onContentChange && content !== text.content) {
      onContentChange(text.id, content);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === 'Escape') {
      event.preventDefault();
      handleBlur();
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      // Allow normal delete/backspace behavior for character deletion
      event.stopPropagation();
    }
  };

  const textStyle = {
    fontSize: text.fontSize,
    color: text.color,
    fontWeight: text.fontWeight,
    fontFamily: text.fontFamily,
    cursor: isEditing ? "text" : "pointer",
    border: "none",
    outline: "none",
    background: "transparent",
    padding: "2px",
    minWidth: "20px",
    whiteSpace: "nowrap" as const,
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={textStyle}
        autoFocus
      />
    );
  }

  return (
    <div
      style={textStyle}
      onDoubleClick={handleDoubleClick}
    >
      {text.content}
    </div>
  );
};

export default TextNode;