import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Image as FabricImage, IText } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Upload, Download, Type, Copy, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TextLayer {
  id: string;
  text: IText;
  fontSize: number;
  fontWeight: number;
  opacity: number;
  rotation: number;
  horizontalTilt: number;
  verticalTilt: number;
}

export const ImageEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(50); // Default font size changed to 50px
  const [fontWeight, setFontWeight] = useState(700); // Default font weight set to bold (700)
  const [textColor, setTextColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [horizontalTilt, setHorizontalTilt] = useState(0);
  const [verticalTilt, setVerticalTilt] = useState(0);

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
        img.selectable = false; // Make image not selectable/movable
        img.evented = false; // Disable all events on the image

        fabricCanvas.add(img);
        fabricCanvas.renderAll();
        toast.success("Image uploaded successfully!");
      });
    };
    reader.readAsDataURL(file);
  };

  const addText = () => {
    if (!fabricCanvas) return;

    const text = new IText("Double click to edit", {
      left: fabricCanvas.width! / 2,
      top: fabricCanvas.height! / 2,
      fontSize: fontSize,
      fontWeight: fontWeight,
      fill: textColor,
      fontFamily: "Arial",
      originX: "center",
      originY: "center",
      opacity: opacity,
      angle: rotation,
      skewX: horizontalTilt,
      skewY: verticalTilt,
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
    };

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.bringObjectToFront(text); // Always bring text to front
    fabricCanvas.renderAll();
    
    setTextLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    toast.success("Text added! Double click to edit");
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
    };

    fabricCanvas.add(clonedText);
    fabricCanvas.setActiveObject(clonedText);
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

    layer.text.set({
      fontSize,
      fontWeight,
      fill: textColor,
      opacity,
      angle: rotation,
      skewX: horizontalTilt,
      skewY: verticalTilt,
    });

    fabricCanvas?.bringObjectToFront(layer.text); // Ensure text stays on top after updates
    fabricCanvas?.renderAll();
  };

  useEffect(() => {
    updateSelectedText();
  }, [fontSize, fontWeight, textColor, opacity, rotation, horizontalTilt, verticalTilt]);

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
      <div className="grid md:grid-cols-[1fr,300px] gap-8">
        {/* Canvas Area */}
        <div className="relative">
          <div className="border-2 border-dashed border-gray-200 rounded-lg overflow-hidden bg-gray-50 hover:border-gray-300 transition-colors">
            <canvas ref={canvasRef} className="max-w-full" />
            {fabricCanvas?.getObjects().length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <p className="text-center">
                  Upload an image to get started
                  <br />
                  <span className="text-sm">Supported formats: PNG, JPG, JPEG</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          {/* Image Upload */}
          <div>
            <Label htmlFor="image-upload" className="text-lg font-semibold text-gray-700 mb-4 flex">
              Upload Image
            </Label>
            <div className="relative">
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose Image
              </Button>
            </div>
          </div>

          {/* Text Controls */}
          <div className="space-y-4">
            <Button
              onClick={addText}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Type className="mr-2 h-4 w-4" />
              Add Text
            </Button>

            {selectedLayerId && (
              <>
                <div className="flex gap-2">
                  <Button
                    onClick={duplicateText}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </Button>
                  <Button
                    onClick={removeText}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Font Size</Label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={(value) => setFontSize(value[0])}
                    max={210}
                    min={12}
                    step={1}
                    className="my-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Font Weight</Label>
                  <Slider
                    value={[fontWeight]}
                    onValueChange={(value) => setFontWeight(value[0])}
                    max={900}
                    min={100}
                    step={100}
                    className="my-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Opacity</Label>
                  <Slider
                    value={[opacity]}
                    onValueChange={(value) => setOpacity(value[0])}
                    max={1}
                    min={0}
                    step={0.1}
                    className="my-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Rotation</Label>
                  <Slider
                    value={[rotation]}
                    onValueChange={(value) => setRotation(value[0])}
                    max={360}
                    min={0}
                    step={1}
                    className="my-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Horizontal Tilt</Label>
                  <Slider
                    value={[horizontalTilt]}
                    onValueChange={(value) => setHorizontalTilt(value[0])}
                    max={45}
                    min={-45}
                    step={1}
                    className="my-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Vertical Tilt</Label>
                  <Slider
                    value={[verticalTilt]}
                    onValueChange={(value) => setVerticalTilt(value[0])}
                    max={45}
                    min={-45}
                    step={1}
                    className="my-2"
                  />
                </div>

                <div>
                  <Label htmlFor="text-color" className="text-sm font-medium text-gray-700">
                    Text Color
                  </Label>
                  <Input
                    id="text-color"
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-10 p-1 w-full mt-1 border rounded-md"
                  />
                </div>
              </>
            )}
          </div>

          {/* Download */}
          <Button
            onClick={downloadImage}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Image
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ImageEditor;
