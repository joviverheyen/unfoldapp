export interface ImageSlot {
  id: string;
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  defaultText: string;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
}

export interface TemplateDefinition {
  slots: ImageSlot[];
  textAreas: TextArea[];
  background: string;
}

export type AspectRatio = "9:16" | "1:1" | "4:5";

export const ASPECT_RATIO_CONFIG: Record<AspectRatio, { label: string; ratio: number; exportWidth: number }> = {
  "9:16": { label: "Story", ratio: 9 / 16, exportWidth: 1080 },
  "1:1": { label: "Square", ratio: 1, exportWidth: 1080 },
  "4:5": { label: "Portrait", ratio: 4 / 5, exportWidth: 1080 },
};

export interface CanvasImageData {
  slotId: string;
  imageUrl: string;
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface CanvasTextData {
  textAreaId: string;
  content: string;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
  x: number;
  y: number;
}

export interface CanvasData {
  images: CanvasImageData[];
  texts: CanvasTextData[];
  background: string;
}
