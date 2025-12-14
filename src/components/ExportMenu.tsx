import { Button, Flex } from "@radix-ui/themes";
import { Download, FileImage, FileText, Image, Upload } from "lucide-react";

import type { DesignEditor } from "../editor";
import {
  exportToJSON,
  exportToPDF,
  exportToPNG,
  exportToSVG,
  getTimestampFilename,
  importFromJSON,
  importImage,
} from "../utils/exportUtils";

interface ExportMenuProps {
  editor: DesignEditor;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
}

export const ExportMenu = ({ editor, canvasRef }: ExportMenuProps) => {
  const handleExportJSON = () => {
    const filename = getTimestampFilename("design");
    exportToJSON(editor.state.value, filename);
  };

  const handleImportJSON = async () => {
    const designValue = await importFromJSON();
    if (designValue) {
      editor.loadDesign(designValue);
    }
  };

  const handleImportImage = async () => {
    const imageData = await importImage();
    if (imageData) {
      // 缩放图片到合适大小 (最大400x300)
      const maxWidth = 400;
      const maxHeight = 300;
      const scale = Math.min(
        maxWidth / imageData.width,
        maxHeight / imageData.height,
        1,
      );

      const scaledWidth = Math.round(imageData.width * scale);
      const scaledHeight = Math.round(imageData.height * scale);

      // 调用编辑器的createImage方法
      editor.createImage({
        src: imageData.dataUrl,
        width: scaledWidth,
        height: scaledHeight,
      });
    }
  };

  const handleExportSVG = () => {
    const filename = getTimestampFilename("design");
    exportToSVG(
      canvasRef?.current || document.createElement("div"),
      editor.state.value,
      filename,
    );
  };

  const handleExportPNG = () => {
    if (!canvasRef?.current) {
      alert("Canvas not found. Please try again.");
      return;
    }
    const filename = getTimestampFilename("design");
    void exportToPNG(canvasRef.current, filename);
  };

  const handleExportPDF = () => {
    if (!canvasRef?.current) {
      alert("Canvas not found. Please try again.");
      return;
    }
    const filename = getTimestampFilename("design");
    void exportToPDF(canvasRef.current, filename);
  };

  return (
    <Flex direction="column" gap="2">
      {/* Import row */}
      <Flex gap="1">
        <Button
          variant="soft"
          size="1"
          onClick={handleImportJSON}
          style={{ flex: 1, fontSize: "11px" }}
        >
          <Upload size={12} />
          Design
        </Button>

        <Button
          variant="soft"
          size="1"
          onClick={handleImportImage}
          style={{ flex: 1, fontSize: "11px" }}
        >
          <Image size={12} />
          Image
        </Button>

        <Button
          variant="soft"
          size="1"
          onClick={handleExportJSON}
          style={{ flex: 1, fontSize: "11px" }}
        >
          <Download size={12} />
          Save
        </Button>
      </Flex>

      {/* Export formats row */}
      <Flex gap="1">
        <Button
          variant="ghost"
          size="1"
          onClick={handleExportSVG}
          style={{ flex: 1, fontSize: "11px" }}
        >
          <FileText size={12} />
          SVG
        </Button>

        <Button
          variant="ghost"
          size="1"
          onClick={handleExportPNG}
          style={{ flex: 1, fontSize: "11px" }}
        >
          <Image size={12} />
          PNG
        </Button>

        <Button
          variant="ghost"
          size="1"
          onClick={handleExportPDF}
          style={{ flex: 1, fontSize: "11px" }}
        >
          <FileImage size={12} />
          PDF
        </Button>
      </Flex>
    </Flex>
  );
};
