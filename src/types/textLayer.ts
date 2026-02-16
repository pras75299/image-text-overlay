export interface TextLayer {
  id: string;
  content: string;
  position: { x: number; y: number };
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  color: string;
  opacity: number;
  rotation: number;
}

export const createDefaultTextLayer = (id?: string): TextLayer => ({
  id: id ?? crypto.randomUUID(),
  content: "TEXT",
  position: { x: 0.5, y: 0.5 },
  fontSize: 100,
  fontFamily: "Arial",
  fontWeight: 700,
  color: "#fbbf24",
  opacity: 1,
  rotation: 0,
});
