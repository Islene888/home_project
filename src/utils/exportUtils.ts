import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import type {
  DesignValue,
  ShapeDef,
  TextElement,
  ImageElement,
} from "../editor/schema";

// JSON导出/导入功能
export const exportToJSON = (
  designValue: DesignValue,
  filename = "design",
) => {
  const dataStr = JSON.stringify(designValue, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importFromJSON = (): Promise<DesignValue | null> => {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string;
          const designValue = JSON.parse(result) as DesignValue;
          resolve(designValue);
        } catch {
          alert("Invalid JSON file format");
          resolve(null);
        }
      };
      reader.readAsText(file);
    };

    input.click();
  });
};

// 图片上传功能
export const importImage = (): Promise<{
  dataUrl: string;
  width: number;
  height: number;
} | null> => {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*"; // 接受所有图片格式

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      // 检查文件大小 (限制为5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image file too large. Please select a file smaller than 5MB.");
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          resolve(null);
          return;
        }

        // 创建图片元素来获取尺寸
        const img = new Image();
        img.onload = () => {
          resolve({
            dataUrl,
            width: img.width,
            height: img.height,
          });
        };
        img.onerror = () => {
          alert("Failed to load image");
          resolve(null);
        };
        img.src = dataUrl;
      };

      reader.onerror = () => {
        alert("Failed to read image file");
        resolve(null);
      };

      reader.readAsDataURL(file);
    };

    input.click();
  });
};

// SVG导出功能
export const exportToSVG = (
  _canvasElement: HTMLElement,
  designValue: DesignValue,
  filename = "design",
) => {
  const { width, height } = designValue.attributes;

  // 生成形状的SVG内容
  const shapeSVGs = Object.values(designValue.shapes)
    .map((shape) => {
      const pathElements = shape.paths
        .map((path) => {
          const strokeAttr = path.stroke
            ? `stroke="${path.stroke.color}" stroke-width="${path.stroke.weight}"`
            : "";
          const fillAttr = path.fill
            ? `fill="${path.fill.color}"`
            : 'fill="none"';

          const attributes = [strokeAttr, fillAttr].filter(Boolean).join(" ");
          return `<path d="${path.d}" ${attributes} />`;
        })
        .join("");

      const opacity = shape.transparency ? 1 - shape.transparency : 1;

      return `
      <g transform="translate(${shape.bounds.left}, ${shape.bounds.top})" opacity="${opacity}">
        <svg width="${shape.bounds.width}" height="${shape.bounds.height}" viewBox="${shape.viewBox.minX} ${shape.viewBox.minY} ${shape.viewBox.width} ${shape.viewBox.height}">
          ${pathElements}
        </svg>
      </g>
    `;
    })
    .join("");

  // 生成文本的SVG内容
  const textSVGs = Object.values(designValue.texts)
    .map((text) => {
      return `
      <text
        x="${text.bounds.left}"
        y="${text.bounds.top + text.fontSize}"
        font-family="${text.fontFamily}"
        font-size="${text.fontSize}"
        font-weight="${text.fontWeight}"
        fill="${text.color}"
      >
        ${text.content}
      </text>
    `;
    })
    .join("");

  // 生成图片的SVG内容
  const imageSVGs = Object.values(designValue.images)
    .map((image) => {
      return `
      <image
        x="${image.bounds.left}"
        y="${image.bounds.top}"
        width="${image.bounds.width}"
        height="${image.bounds.height}"
        href="${image.src}"
        opacity="${image.opacity ?? 1}"
      />
    `;
    })
    .join("");

  // 创建完整的SVG
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  ${shapeSVGs}
  ${textSVGs}
  ${imageSVGs}
</svg>`;

  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// PNG导出功能
export const exportToPNG = async (
  canvasElement: HTMLElement,
  filename = "design",
) => {
  try {
    // 查找实际的设计画布
    const designCanvas =
      canvasElement.querySelector(".design-canvas") || canvasElement;
    const designView =
      designCanvas.querySelector('div[style*="position: relative"]') ||
      designCanvas;

    // 确保画布有最小尺寸
    const rect = (designView as HTMLElement).getBoundingClientRect();
    const width = Math.max(rect.width, 800);
    const height = Math.max(rect.height, 600);

    const canvas = await html2canvas(designView as HTMLElement, {
      backgroundColor: "white",
      scale: 2, // 高质量导出
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false,
      logging: false,
      width,
      height,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      onclone: (clonedDoc) => {
        // 确保所有样式都被正确应用
        const allElements = clonedDoc.querySelectorAll("*");
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.style.translate) {
            // 将translate转换为left/top定位
            const translateMatch = htmlEl.style.translate.match(
              /(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px/,
            );
            if (translateMatch) {
              const [, x, y] = translateMatch;
              htmlEl.style.left = x + "px";
              htmlEl.style.top = y + "px";
              htmlEl.style.translate = "";
              htmlEl.style.transform = "";
            }
          }
        });

        // 确保克隆文档中的SVG正确渲染
        const svgs = clonedDoc.querySelectorAll("svg");
        svgs.forEach((svg) => {
          svg.style.display = "block";
          svg.style.visibility = "visible";
        });

        // 确保图片正确渲染
        const imgs = clonedDoc.querySelectorAll("img");
        imgs.forEach((img) => {
          img.style.display = "block";
          img.style.visibility = "visible";
        });
      },
    });

    // 如果canvas为空，创建一个白色背景的canvas
    if (canvas.width === 0 || canvas.height === 0) {
      const fallbackCanvas = document.createElement("canvas");
      fallbackCanvas.width = width * 2;
      fallbackCanvas.height = height * 2;
      const ctx = fallbackCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
      }
      downloadCanvas(fallbackCanvas, filename);
    } else {
      downloadCanvas(canvas, filename);
    }
  } catch (error) {
    alert(
      `Failed to export PNG: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

const downloadCanvas = (canvas: HTMLCanvasElement, filename: string) => {
  canvas.toBlob((blob) => {
    if (!blob) {
      alert("Failed to generate PNG");
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, "image/png");
};

// PDF导出功能
export const exportToPDF = async (
  _canvasElement: HTMLElement,
  designValue: DesignValue,
  filename = "design",
) => {
  try {
    // 直接使用SVG导出方法创建内容
    const svgContent = createSVGContent(designValue);

    // 创建一个canvas来渲染SVG
    const canvas = document.createElement("canvas");
    const { width, height } = designValue.attributes;
    canvas.width = width * 2; // 高清
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("无法创建canvas context");
    }

    // 设置白色背景
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(2, 2); // 缩放以匹配高清

    // 创建SVG图像
    const svgBlob = new Blob([svgContent], { type: "image/svg+xml" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = svgUrl;
    });

    // 绘制SVG到canvas
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(svgUrl);

    // 创建PDF
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: width > height ? "landscape" : "portrait",
      unit: "px",
      format: [width, height],
    });

    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    alert(
      `PDF导出失败: ${error instanceof Error ? error.message : "未知错误"}`,
    );
  }
};

// 创建SVG内容的辅助函数
function createSVGContent(designValue: DesignValue): string {
  const { width, height } = designValue.attributes;

  // 生成形状的SVG内容
  const shapeSVGs = Object.values(designValue.shapes || {})
    .map((shape: ShapeDef) => {
      const pathElements = shape.paths
        .map((path) => {
          const strokeAttr = path.stroke
            ? `stroke="${path.stroke.color}" stroke-width="${path.stroke.weight}"`
            : "";
          const fillAttr = path.fill
            ? `fill="${path.fill.color}"`
            : 'fill="none"';

          const attributes = [strokeAttr, fillAttr].filter(Boolean).join(" ");
          return `<path d="${path.d}" ${attributes} />`;
        })
        .join("");

      const opacity = shape.transparency ? 1 - shape.transparency : 1;

      return `
      <g transform="translate(${shape.bounds.left}, ${shape.bounds.top})" opacity="${opacity}">
        <svg width="${shape.bounds.width}" height="${shape.bounds.height}" viewBox="${shape.viewBox.minX} ${shape.viewBox.minY} ${shape.viewBox.width} ${shape.viewBox.height}">
          ${pathElements}
        </svg>
      </g>
    `;
    })
    .join("");

  // 生成文本的SVG内容
  const textSVGs = Object.values(designValue.texts || {})
    .map((text: TextElement) => {
      return `
      <text
        x="${text.bounds.left}"
        y="${text.bounds.top + text.fontSize}"
        font-family="${text.fontFamily}"
        font-size="${text.fontSize}"
        font-weight="${text.fontWeight}"
        fill="${text.color}"
      >
        ${text.content}
      </text>
    `;
    })
    .join("");

  // 生成图片的SVG内容
  const imageSVGs = Object.values(designValue.images || {})
    .map((image: ImageElement) => {
      return `
      <image
        x="${image.bounds.left}"
        y="${image.bounds.top}"
        width="${image.bounds.width}"
        height="${image.bounds.height}"
        href="${image.src}"
        opacity="${image.opacity ?? 1}"
      />
    `;
    })
    .join("");

  // 创建完整的SVG
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  ${shapeSVGs}
  ${textSVGs}
  ${imageSVGs}
</svg>`;
}

// 获取当前日期时间作为文件名
export const getTimestampFilename = (prefix = "design") => {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, "-");
  return `${prefix}-${timestamp}`;
};
