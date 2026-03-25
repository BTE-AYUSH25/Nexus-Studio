export type ShapeType = "rect" | "circle" | "line" | "text" | "image";

export interface CanvasShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  points?: number[];
  text?: string;
  src?: string;
  rotation?: number;
}

export interface UserCursor {
  id: string;
  x: number;
  y: number;
  name: string;
  color: string;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  timestamp: number;
}
