import type { ImageElement } from "../schema";

interface ImageNodeProps {
  image: ImageElement;
}

const ImageNode = ({ image }: ImageNodeProps) => {
  return (
    <img
      src={image.src}
      alt=""
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        opacity: image.opacity ?? 1,
        userSelect: "none",
        pointerEvents: "none",
      }}
      draggable={false}
    />
  );
};

export default ImageNode;