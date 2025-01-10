import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Image as FabricImage, IText } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Upload, Download, Type } from "lucide-react";

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
      backgroundColor: "#ffffff",
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
      FabricImage.fromURL(imgData, (img) => {
        // Scale image to fit canvas
        const scale = Math.min(
          fabricCanvas.width! / img.width!,
          fabricCanvas.height! / img.height!
        );
        img.scale(scale);
        
        fabricCanvas.setBackgroundImage(img, () => {
          fabricCanvas.renderAll();
        });
        toast("Image uploaded successfully!");
      });
    };
    reader.readAsDataURL(file);
  };

  const addText = () => {
    if (!fabricCanvas) return;

    const text = new IText("Double click to edit", {
      left: 100,
      top: 100,
      fontSize: fontSize,
      fill: textColor,
      fontFamily: "Arial",
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    toast("Text added! Double click to edit");
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
    toast("Image downloaded!");
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="grid md:grid-cols-[1fr,300px] gap-6">
        {/* Canvas Area */}
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          <canvas ref={canvasRef} className="max-w-full" />
        </div>

        {/* Controls */}
        <div className="space-y-6">
          {/* Image Upload */}
          <div>
            <Label htmlFor="image-upload" className="block mb-2">
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
                className="w-full"
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose Image
              </Button>
            </div>
          </div>

          {/* Text Controls */}
          <div className="space-y-4">
            <Button onClick={addText} className="w-full">
              <Type className="mr-2 h-4 w-4" />
              Add Text
            </Button>

            <div>
              <Label className="block mb-2">Font Size</Label>
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
              />
            </div>

            <div>
              <Label htmlFor="text-color" className="block mb-2">
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
                className="h-10 p-1"
              />
            </div>
          </div>

          {/* Download */}
          <Button onClick={downloadImage} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download Image
          </Button>
        </div>
      </div>
    </div>
  );
};