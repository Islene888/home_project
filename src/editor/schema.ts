import type { Bounds } from "./math/types";

export type ID = string;

export interface ShapeViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export interface ShapeStroke {
  color: string;
  weight: number;
  dasharray?: [number, number];
}

export type ShapeFill = { color: string };

export interface ShapePath {
  d: string;
  stroke?: ShapeStroke;
  fill?: ShapeFill;
}

export interface TextElement {
  type: "text";
  id: ID;
  bounds: Bounds;
  content: string;
  fontSize: number;
  color: string;
  fontWeight: "normal" | "bold";
  fontFamily: string;
}

export interface ImageElement {
  type: "image";
  id: ID;
  bounds: Bounds;
  src: string; // data URL
  opacity?: number;
}

export interface ShapeDef {
  type: "shape";
  id: ID;
  bounds: Bounds;
  transparency?: number;
  paths: ShapePath[];
  viewBox: ShapeViewBox;
  rememberedStroke?: ShapeStroke;
  rememberedFill?: ShapeFill;
}

export type Element = ShapeDef | TextElement | ImageElement;

export interface DesignValue {
  shapes: Record<ID, ShapeDef>;
  texts: Record<ID, TextElement>;
  images: Record<ID, ImageElement>;
  attributes: {
    width: number;
    height: number;
  };
}
