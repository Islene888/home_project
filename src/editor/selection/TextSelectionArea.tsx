import type { TextElement } from "../schema";
import { type Selection } from "./selectionState";

interface TextSelectionAreaProps {
  text: TextElement;
  onSelectionChange: (newSelection: Selection | null) => void;
  onTextChange?: (text: TextElement) => void;
}

const TextSelectionArea = ({}: TextSelectionAreaProps) => {
  // Return null to not render any selection outline for text
  return null;
};

export default TextSelectionArea;