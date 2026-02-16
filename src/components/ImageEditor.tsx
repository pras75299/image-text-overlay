import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Image as FabricImage, IText } from "fabric";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { TextControls } from "./text-editor/TextControls";
import { TextActions } from "./text-editor/TextActions";
import { ImageActions } from "./text-editor/ImageActions";

interface TextLayer {
  id: string;
  text: IText;
  fontSize: number;
  fontWeight: number;
  opacity: number;
  rotation: number;
  horizontalTilt: number;
  verticalTilt: number;
  x: number;
  y: number;
  fontFamily: string;
  content: string; // Required field
}

export const ImageEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(100);
  const [fontWeight, setFontWeight] = useState(700);
  const [textColor, setTextColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [horizontalTilt, setHorizontalTilt] = useState(0);
  const [verticalTilt, setVerticalTilt] = useState(0);
  const [positionX, setPositionX] = useState(400);
  const [positionY, setPositionY] = useState(300);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [textContent, setTextContent] = useState("Edit");
  const [hasImage, setHasImage] = useState(false);

  useEffect(() => {
    if (!selectedLayerId) return;
    const layer = textLayers.find((l) => l.id === selectedLayerId);
    if (!layer) return;
    setFontSize(layer.fontSize);
    setFontWeight(layer.fontWeight);
    setTextColor((layer.text.fill as string) ?? "#ffffff");
    setOpacity(layer.opacity);
    setRotation(layer.rotation);
    setHorizontalTilt(layer.horizontalTilt);
    setVerticalTilt(layer.verticalTilt);
    setPositionX(layer.text.left ?? 400);
    setPositionY(layer.text.top ?? 300);
    setFontFamily(layer.fontFamily ?? "Arial");
    setTextContent(layer.content);
  }, [selectedLayerId]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#f8f9fa",
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas) return;

    // Clear existing image if any
    fabricCanvas.getObjects().forEach((obj) => {
      if (obj instanceof FabricImage) {
        fabricCanvas.remove(obj);
      }
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgData = event.target?.result as string;
      FabricImage.fromURL(imgData).then((img) => {
        const scale = Math.min(
          fabricCanvas.width! / img.width!,
          fabricCanvas.height! / img.height!
        );

        img.scaleX = scale;
        img.scaleY = scale;
        img.left = (fabricCanvas.width! - img.width! * scale) / 2;
        img.top = (fabricCanvas.height! - img.height! * scale) / 2;
        img.selectable = false;
        img.evented = false;

        fabricCanvas.add(img);
        fabricCanvas.sendObjectToBack(img);
        fabricCanvas.renderAll();
        setHasImage(true);
        toast.success("Image uploaded successfully!");
      });
    };
    reader.readAsDataURL(file);
  };

  const addText = () => {
    if (!fabricCanvas) return;

    const text = new IText(textContent, {
      left: positionX,
      top: positionY,
      fontSize: fontSize,
      fontWeight: fontWeight,
      fill: textColor,
      fontFamily: fontFamily,
      originX: "center",
      originY: "center",
      opacity: opacity,
      angle: rotation,
      skewX: horizontalTilt,
      skewY: verticalTilt,
      hasControls: false,
      lockScalingX: true,
      lockScalingY: true,
      lockUniScaling: true,
      editable: false,
      selectable: false,
      lockMovementX: true,
      lockMovementY: true,
    });

    const newLayer: TextLayer = {
      id: crypto.randomUUID(),
      text,
      fontSize,
      fontWeight,
      opacity,
      rotation,
      horizontalTilt,
      verticalTilt,
      x: positionX,
      y: positionY,
      fontFamily,
      content: textContent, // Add this line
    };

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.bringObjectToFront(text);
    fabricCanvas.renderAll();

    setTextLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    toast.success("Text added!");
  };

  const duplicateText = () => {
    if (!fabricCanvas || !selectedLayerId) return;

    const layer = textLayers.find((l) => l.id === selectedLayerId);
    if (!layer) return;

    const clonedText = new IText(layer.text.text!, {
      left: layer.text.left! + 20,
      top: layer.text.top! + 20,
      fontSize: layer.fontSize,
      fontWeight: layer.fontWeight,
      fill: layer.text.fill as string,
      fontFamily: layer.text.fontFamily,
      originX: "center",
      originY: "center",
      opacity: layer.opacity,
      angle: layer.rotation,
      skewX: layer.horizontalTilt,
      skewY: layer.verticalTilt,
      hasControls: false,
      lockScalingX: true,
      lockScalingY: true,
      lockUniScaling: true,
      editable: false,
      selectable: false,
      lockMovementX: true,
      lockMovementY: true,
    });

    const newLayer: TextLayer = {
      id: crypto.randomUUID(),
      text: clonedText,
      fontSize: layer.fontSize,
      fontWeight: layer.fontWeight,
      opacity: layer.opacity,
      rotation: layer.rotation,
      horizontalTilt: layer.horizontalTilt,
      verticalTilt: layer.verticalTilt,
      x: layer.x + 20,
      y: layer.y + 20,
      fontFamily: layer.fontFamily,
      content: layer.content, // Add this line
    };

    fabricCanvas.add(clonedText);
    fabricCanvas.setActiveObject(clonedText);
    fabricCanvas.bringObjectToFront(clonedText);
    fabricCanvas.renderAll();

    setTextLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    toast.success("Text duplicated!");
  };

  const removeText = () => {
    if (!fabricCanvas || !selectedLayerId) return;

    const layer = textLayers.find((l) => l.id === selectedLayerId);
    if (!layer) return;

    fabricCanvas.remove(layer.text);
    fabricCanvas.renderAll();

    setTextLayers((prev) => prev.filter((l) => l.id !== selectedLayerId));
    setSelectedLayerId(null);
    toast.success("Text removed!");
  };

  const updateSelectedText = () => {
    if (!selectedLayerId) return;
    const layer = textLayers.find((l) => l.id === selectedLayerId);
    if (!layer) return;

    // Get text boundaries
    const textWidth = layer.text.getScaledWidth();
    const textHeight = layer.text.getScaledHeight();

    // Constrain position within canvas
    const constrainedX = Math.min(
      Math.max(positionX, textWidth / 2),
      fabricCanvas!.width! - textWidth / 2
    );
    const constrainedY = Math.min(
      Math.max(positionY, textHeight / 2),
      fabricCanvas!.height! - textHeight / 2
    );

    layer.text.set({
      text: textContent,
      fontSize,
      fontWeight,
      fill: textColor,
      opacity,
      angle: rotation,
      skewX: horizontalTilt,
      skewY: verticalTilt,
      left: constrainedX,
      top: constrainedY,
      fontFamily,
    });

    fabricCanvas?.bringObjectToFront(layer.text);
    fabricCanvas?.renderAll();
  };

  useEffect(() => {
    if (!selectedLayerId || !fabricCanvas) return;
    updateSelectedText();
  }, [
    selectedLayerId,
    fabricCanvas,
    fontSize,
    fontWeight,
    textColor,
    opacity,
    rotation,
    horizontalTilt,
    verticalTilt,
    positionX,
    positionY,
    fontFamily,
    textContent,
  ]);

  const downloadImage = () => {
    if (!fabricCanvas) return;

    const dataURL = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
    });

    const link = document.createElement("a");
    link.download = "edited-image.png";
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image downloaded!");
  };

  return (
    <Card className="bg-white rounded-lg shadow-lg p-8">
      <div className="grid md:grid-cols-[1fr,250px] gap-8">
        <div className="relative">
          <div className="border-2 border-dashed border-gray-200 rounded-lg overflow-hidden bg-gray-50 hover:border-gray-300 transition-colors">
            <canvas ref={canvasRef} className="max-w-full" />
            {fabricCanvas?.getObjects().length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <p className="text-center">
                  Upload an image to get started
                  <br />
                  <span className="text-sm">
                    Supported formats: PNG, JPG, JPEG
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <ImageActions
            onImageUpload={handleImageUpload}
            onDownloadImage={downloadImage}
          />

          <TextActions
            selectedLayerId={selectedLayerId}
            onAddText={addText}
            onDuplicateText={duplicateText}
            onRemoveText={removeText}
          />

          {selectedLayerId && (
            <TextControls
              fontSize={fontSize}
              setFontSize={setFontSize}
              fontWeight={fontWeight}
              setFontWeight={setFontWeight}
              textColor={textColor}
              setTextColor={setTextColor}
              opacity={opacity}
              setOpacity={setOpacity}
              rotation={rotation}
              setRotation={setRotation}
              horizontalTilt={horizontalTilt}
              setHorizontalTilt={setHorizontalTilt}
              verticalTilt={verticalTilt}
              setVerticalTilt={setVerticalTilt}
              positionX={positionX}
              setPositionX={setPositionX}
              positionY={positionY}
              setPositionY={setPositionY}
              fontFamily={fontFamily}
              setFontFamily={setFontFamily}
              textContent={textContent}
              setTextContent={setTextContent}
            />
          )}
        </div>
      </div>
    </Card>
  );
};

export default ImageEditor;
