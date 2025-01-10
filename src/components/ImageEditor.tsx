import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Image as FabricImage, IText } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Upload, Download, Type } from "lucide-react";
import { Card } from "@/components/ui/card";

export const ImageEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [fontSize, setFontSize] = useState(32);
  const [textColor, setTextColor] = useState("#000000");

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
      FabricImage.fromURL(imgData, {
        crossOrigin: 'anonymous',
        callback: (img) => {
          // Clear existing canvas content
          fabricCanvas.clear();
          
          // Scale image to fit canvas while maintaining aspect ratio
          const scale = Math.min(
            fabricCanvas.width! / img.width!,
            fabricCanvas.height! / img.height!
          );
          
          img.scaleX = scale;
          img.scaleY = scale;
          
          // Center the image
          img.left = (fabricCanvas.width! - img.width! * scale) / 2;
          img.top = (fabricCanvas.height! - img.height! * scale) / 2;
          
          // Set as background image
          fabricCanvas.backgroundImage = img;
          fabricCanvas.renderAll();
          toast.success("Image uploaded successfully!");
        }
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
      fill: textColor,
      fontFamily: "Arial",
      originX: "center",
      originY: "center",
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    toast.success("Text added! Double click to edit");
  };

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
            {!fabricCanvas?.backgroundImage && (
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
            <Label htmlFor="image-upload" className="text-lg font-semibold text-gray-700 mb-2">
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

            <div>
              <Label className="text-sm font-medium text-gray-700">Font Size</Label>
              <div className="mt-1">
                <Slider
                  value={[fontSize]}
                  onValueChange={(value) => {
                    setFontSize(value[0]);
                    const activeObject = fabricCanvas?.getActiveObject();
                    if (activeObject && 'fontSize' in activeObject) {
                      activeObject.set('fontSize', value[0]);
                      fabricCanvas?.renderAll();
                    }
                  }}
                  max={72}
                  min={12}
                  step={1}
                  className="my-2"
                />
                <div className="text-sm text-gray-500 text-right">{fontSize}px</div>
              </div>
            </div>

            <div>
              <Label htmlFor="text-color" className="text-sm font-medium text-gray-700">
                Text Color
              </Label>
              <Input
                id="text-color"
                type="color"
                value={textColor}
                onChange={(e) => {
                  setTextColor(e.target.value);
                  const activeObject = fabricCanvas?.getActiveObject();
                  if (activeObject && 'fill' in activeObject) {
                    activeObject.set('fill', e.target.value);
                    fabricCanvas?.renderAll();
                  }
                }}
                className="h-10 p-1 w-full mt-1 border rounded-md"
              />
            </div>
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