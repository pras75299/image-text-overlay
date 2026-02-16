import { useRef, useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { segmentImage } from "@/lib/backgroundRemoval";
import { cn } from "@/lib/utils";

const FONT_FAMILIES = [
  "Arial",
  "Times New Roman",
  "Helvetica",
  "Verdana",
  "Georgia",
  "Courier New",
  "Impact",
  "Comic Sans MS",
];

export const TextBehindEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [foregroundImageUrl, setForegroundImageUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [textContent, setTextContent] = useState("TEXT");
  const [fontSize, setFontSize] = useState(100);
  const [textColor, setTextColor] = useState("#fbbf24");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontWeight, setFontWeight] = useState(700);
  const [textOpacity, setTextOpacity] = useState(1);
  const [textRotation, setTextRotation] = useState(0);
  const [textPosition, setTextPosition] = useState({ x: 0.5, y: 0.5 });
  const [previewTextOnTop, setPreviewTextOnTop] = useState(true);
  const dragRef = useRef<{ startX: number; startY: number; startPos: { x: number; y: number } } | null>(null);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file (PNG, JPG, JPEG)");
        return;
      }

      setBackgroundImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setForegroundImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setImageDimensions(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  useEffect(() => {
    if (!imagePreview) return;

    let cancelled = false;

    const processImage = async () => {
      try {
        setIsProcessing(true);
        setProgress(0);

        const { background, foreground } = await segmentImage(imagePreview, {
          progress: setProgress,
        });

        if (cancelled) return;

        setBackgroundImageUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(background);
        });
        setForegroundImageUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(foreground);
        });
        toast.success("Ready! Drag the text to position it.");
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to process image";
          toast.error(msg);
          setBackgroundImageUrl(null);
          setForegroundImageUrl(null);
        }
      } finally {
        if (!cancelled) setIsProcessing(false);
        setProgress(0);
      }
    };

    processImage();
    return () => {
      cancelled = true;
    };
  }, [imagePreview]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !backgroundImageUrl || !foregroundImageUrl) {
      toast.error("Wait for the image to finish processing");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bgImg = new Image();
    const fgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    fgImg.crossOrigin = "anonymous";

    const draw = () => {
      const width = bgImg.naturalWidth;
      const height = bgImg.naturalHeight;
      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(bgImg, 0, 0);

      ctx.save();
      ctx.globalAlpha = textOpacity;
      ctx.fillStyle = textColor;
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const textX = textPosition.x * width;
      const textY = textPosition.y * height;
      ctx.translate(textX, textY);
      ctx.rotate((textRotation * Math.PI) / 180);
      ctx.translate(-textX, -textY);
      ctx.fillText(textContent || "TEXT", textX, textY, width - 40);
      ctx.restore();

      ctx.drawImage(fgImg, 0, 0);

      const link = document.createElement("a");
      link.download = "text-behind-object.png";
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Image downloaded!");
    };

    const loaded =
      bgImg.complete && fgImg.complete
        ? draw
        : () => {
            bgImg.onload = fgImg.onload = draw;
          };
    if (bgImg.complete && fgImg.complete) {
      draw();
    } else {
      bgImg.onload = () => fgImg.complete && draw();
      fgImg.onload = () => bgImg.complete && draw();
    }
    bgImg.onerror = () => toast.error("Failed to load background");
    fgImg.onerror = () => toast.error("Failed to load foreground");
    bgImg.src = backgroundImageUrl;
    fgImg.src = foregroundImageUrl;
  }, [
    backgroundImageUrl,
    foregroundImageUrl,
    textContent,
    textColor,
    fontSize,
    fontFamily,
    fontWeight,
    textOpacity,
    textRotation,
    textPosition,
  ]);

  const showPreview = !!imagePreview;
  const isProcessed = !!backgroundImageUrl && !!foregroundImageUrl;

  const containerRef = useRef<HTMLDivElement>(null);

  const handleTextMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPos: { ...textPosition },
      };
    },
    [textPosition]
  );

  const handleTextTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      dragRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startPos: { ...textPosition },
      };
    },
    [textPosition]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const deltaX = (e.clientX - dragRef.current.startX) / rect.width;
      const deltaY = (e.clientY - dragRef.current.startY) / rect.height;
      setTextPosition({
        x: Math.max(0, Math.min(1, dragRef.current.startPos.x + deltaX)),
        y: Math.max(0, Math.min(1, dragRef.current.startPos.y + deltaY)),
      });
    };

    const handleMouseUp = () => {
      dragRef.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const deltaX = (touch.clientX - dragRef.current.startX) / rect.width;
      const deltaY = (touch.clientY - dragRef.current.startY) / rect.height;
      setTextPosition({
        x: Math.max(0, Math.min(1, dragRef.current.startPos.x + deltaX)),
        y: Math.max(0, Math.min(1, dragRef.current.startPos.y + deltaY)),
      });
    };

    const handleTouchEnd = () => {
      dragRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <Card className="bg-white rounded-lg shadow-lg p-8">
      <div className="grid md:grid-cols-[1fr,260px] gap-8">
        <div className="relative">
          <div className="border-2 border-dashed border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center aspect-[3/4] max-h-[560px]">
            {!imagePreview ? (
              <div className="flex flex-col items-center justify-center text-gray-400 py-12 px-4">
                <p className="text-center mb-2">Upload an image to get started</p>
                <p className="text-sm">Supports PNG, JPG, JPEG</p>
                <p className="text-sm mt-4 text-gray-500">
                  Object will be isolated automatically
                </p>
              </div>
            ) : (
              <div className="relative w-full h-full flex justify-center items-center">
                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-30 rounded-lg">
                    <Loader2 className="h-12 w-12 animate-spin text-white mb-2" />
                    <p className="text-white">Separating background and object...</p>
                    <p className="text-white/80 text-sm mt-1">
                      {Math.round(progress * 100)}%
                    </p>
                  </div>
                )}
                {showPreview && (
                  <div
                    ref={containerRef}
                    className="relative w-full h-full flex items-center justify-center"
                  >
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ pointerEvents: "none" }}
                    >
                      {isProcessed ? (
                        <>
                          <img
                            src={backgroundImageUrl}
                            alt="Background"
                            className="max-w-full max-h-full w-auto h-auto object-contain"
                            onLoad={(e) => {
                              const img = e.currentTarget;
                              setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                            }}
                          />
                          <img
                            src={foregroundImageUrl}
                            alt="Subject"
                            className={cn(
                              "max-w-full max-h-full w-auto h-auto object-contain absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                              previewTextOnTop ? "opacity-60" : "z-10"
                            )}
                          />
                        </>
                      ) : (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-full max-h-full w-auto h-auto object-contain"
                          onLoad={(e) => {
                            const img = e.currentTarget;
                            setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                          }}
                        />
                      )}
                    </div>
                    <div
                      className="absolute inset-0 select-none pointer-events-none"
                      style={{
                        left: `${textPosition.x * 100}%`,
                        top: `${textPosition.y * 100}%`,
                        transform: `translate(-50%, -50%) rotate(${textRotation}deg)`,
                        fontSize: `${fontSize}px`,
                        fontWeight,
                        color: textColor,
                        fontFamily,
                        opacity: textOpacity,
                        zIndex: previewTextOnTop ? 20 : 5,
                      }}
                      aria-hidden="true"
                    >
                      {textContent || "TEXT"}
                    </div>
                    <div
                      className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing"
                      onMouseDown={handleTextMouseDown}
                      onTouchStart={handleTextTouchStart}
                      role="button"
                      tabIndex={0}
                      aria-label="Drag to reposition text"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") e.preventDefault();
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="image-upload" className="text-lg font-semibold text-gray-700 mb-2 block">
              Upload Image
            </Label>
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

          {(isProcessed || imagePreview) && (
            <>
              <div className="space-y-4">
                <Label className="text-lg font-semibold text-gray-700 block">
                  Customize Text
                </Label>
                <Input
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Enter text"
                />
                <div>
                  <Label className="text-sm font-medium text-gray-700 block mb-2">
                    Font Family
                  </Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 block mb-2">
                    Font Weight
                  </Label>
                  <Slider
                    value={[fontWeight]}
                    onValueChange={(v) => setFontWeight(v[0])}
                    min={100}
                    max={900}
                    step={100}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 block mb-2">
                    Font Size
                  </Label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={(v) => setFontSize(v[0])}
                    min={24}
                    max={240}
                    step={4}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 block mb-2">
                    Color
                  </Label>
                  <Input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-10 p-1 w-full border rounded-md cursor-pointer"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 block mb-2">
                    Opacity
                  </Label>
                  <Slider
                    value={[textOpacity]}
                    onValueChange={(v) => setTextOpacity(v[0])}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 block mb-2">
                    Rotation
                  </Label>
                  <Slider
                    value={[textRotation]}
                    onValueChange={(v) => setTextRotation(v[0])}
                    min={-180}
                    max={180}
                    step={5}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">
                    Show text on top (for positioning)
                  </Label>
                  <Switch
                    checked={previewTextOnTop}
                    onCheckedChange={setPreviewTextOnTop}
                  />
                </div>
              </div>

              {isProcessed && (
                <Button
                  onClick={handleDownload}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Image
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
