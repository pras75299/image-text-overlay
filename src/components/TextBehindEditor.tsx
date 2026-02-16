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
import { Upload, Download, Loader2, Plus, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { segmentImage } from "@/lib/backgroundRemoval";
import { cn } from "@/lib/utils";
import type { TextLayer } from "@/types/textLayer";
import {
  createDefaultTextLayer,
} from "@/types/textLayer";

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
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
    null,
  );
  const [foregroundImageUrl, setForegroundImageUrl] = useState<string | null>(
    null,
  );
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [previewTextOnTop, setPreviewTextOnTop] = useState(true);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPos: { x: number; y: number };
  } | null>(null);

  const selectedLayer = textLayers.find((l) => l.id === selectedLayerId);

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
      setTextLayers([]);
      setSelectedLayerId(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    },
    [],
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
        toast.success("Ready! Add text and drag to position.");
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : "Failed to process image";
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

  const handleAddLayer = useCallback(() => {
    const newLayer = createDefaultTextLayer();
    setTextLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    toast.success("Text layer added!");
  }, []);

  const handleRemoveLayer = useCallback(
    (id: string) => {
      setTextLayers((prev) => prev.filter((l) => l.id !== id));
      setSelectedLayerId((curr) => (curr === id ? null : curr));
      toast.success("Layer removed!");
    },
    [],
  );

  const handleDuplicateLayer = useCallback(
    (id: string) => {
      const layer = textLayers.find((l) => l.id === id);
      if (!layer) return;
      const newLayer: TextLayer = {
        ...layer,
        id: crypto.randomUUID(),
        position: {
          x: Math.min(1, layer.position.x + 0.05),
          y: Math.min(1, layer.position.y + 0.05),
        },
      };
      setTextLayers((prev) => [...prev, newLayer]);
      setSelectedLayerId(newLayer.id);
      toast.success("Layer duplicated!");
    },
    [textLayers],
  );

  const handleUpdateLayer = useCallback(
    (id: string, updates: Partial<TextLayer>) => {
      setTextLayers((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...updates } : l)),
      );
    },
    [],
  );

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

    const draw = () => {
      const width = bgImg.naturalWidth || 1;
      const height = bgImg.naturalHeight || 1;

      if (width <= 0 || height <= 0) {
        toast.error("Invalid image dimensions");
        return;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(bgImg, 0, 0);

      textLayers.forEach((layer) => {
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        ctx.fillStyle = layer.color;
        ctx.font = `normal ${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const textX = layer.position.x * width;
        const textY = layer.position.y * height;
        ctx.translate(textX, textY);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.translate(-textX, -textY);
        ctx.fillText(
          layer.content || "TEXT",
          textX,
          textY,
          Math.max(20, width - 40),
        );
        ctx.restore();
      });

      ctx.drawImage(fgImg, 0, 0);

      try {
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = "text-behind-object.png";
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Image downloaded!");
      } catch (err) {
        console.error("Download failed:", err);
        toast.error("Failed to generate image");
      }
    };

    const tryDraw = () => {
      if (
        bgImg.complete &&
        fgImg.complete &&
        bgImg.naturalWidth > 0 &&
        bgImg.naturalHeight > 0
      ) {
        draw();
      }
    };

    bgImg.onload = tryDraw;
    fgImg.onload = tryDraw;
    bgImg.onerror = () => toast.error("Failed to load background");
    fgImg.onerror = () => toast.error("Failed to load foreground");

    bgImg.src = backgroundImageUrl;
    fgImg.src = foregroundImageUrl;
  }, [backgroundImageUrl, foregroundImageUrl, textLayers]);

  const showPreview = !!imagePreview;
  const isProcessed = !!backgroundImageUrl && !!foregroundImageUrl;

  const containerRef = useRef<HTMLDivElement>(null);

  const handleTextMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!selectedLayerId) return;
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPos: { ...(selectedLayer?.position ?? { x: 0.5, y: 0.5 }) },
      };
    },
    [selectedLayerId, selectedLayer],
  );

  const handleTextTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!selectedLayerId) return;
      const touch = e.touches[0];
      dragRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startPos: { ...(selectedLayer?.position ?? { x: 0.5, y: 0.5 }) },
      };
    },
    [selectedLayerId, selectedLayer],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current || !selectedLayerId) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const deltaX = (e.clientX - dragRef.current.startX) / rect.width;
      const deltaY = (e.clientY - dragRef.current.startY) / rect.height;
      const newX = Math.max(0, Math.min(1, dragRef.current.startPos.x + deltaX));
      const newY = Math.max(0, Math.min(1, dragRef.current.startPos.y + deltaY));
      handleUpdateLayer(selectedLayerId, {
        position: { x: newX, y: newY },
      });
    };

    const handleMouseUp = () => {
      dragRef.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragRef.current || !selectedLayerId) return;
      e.preventDefault();
      const touch = e.touches[0];
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const deltaX = (touch.clientX - dragRef.current.startX) / rect.width;
      const deltaY = (touch.clientY - dragRef.current.startY) / rect.height;
      const newX = Math.max(0, Math.min(1, dragRef.current.startPos.x + deltaX));
      const newY = Math.max(0, Math.min(1, dragRef.current.startPos.y + deltaY));
      handleUpdateLayer(selectedLayerId, {
        position: { x: newX, y: newY },
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
  }, [selectedLayerId, handleUpdateLayer]);

  return (
    <Card className="bg-white rounded-lg shadow-lg p-8">
      <div className="grid md:grid-cols-[1fr,280px] gap-8">
        <div className="relative">
          <div className="border-2 border-dashed border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center aspect-[3/4] max-h-[max-content]">
            {!imagePreview ? (
              <div className="flex flex-col items-center justify-center text-gray-400 py-12 px-4">
                <p className="text-center mb-2">
                  Upload an image to get started
                </p>
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
                    <p className="text-white">
                      Separating background and object...
                    </p>
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
                              setImageDimensions({
                                width: img.naturalWidth,
                                height: img.naturalHeight,
                              });
                            }}
                          />
                          <img
                            src={foregroundImageUrl}
                            alt="Subject"
                            className={cn(
                              "max-w-full max-h-full w-auto h-auto object-contain absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                              previewTextOnTop ? "opacity-60" : "z-10",
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
                            setImageDimensions({
                              width: img.naturalWidth,
                              height: img.naturalHeight,
                            });
                          }}
                        />
                      )}
                    </div>
                    {textLayers.map((layer) => (
                      <div
                        key={layer.id}
                        className="absolute inset-0 select-none pointer-events-none"
                        style={{
                          left: `${layer.position.x * 100}%`,
                          top: `${layer.position.y * 100}%`,
                          transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                          fontSize: `${layer.fontSize}px`,
                          fontWeight: layer.fontWeight,
                          color: layer.color,
                          fontFamily: layer.fontFamily,
                          opacity: layer.opacity,
                          zIndex: previewTextOnTop ? 20 : 5,
                          boxShadow:
                            selectedLayerId === layer.id
                              ? "0 0 0 2px rgb(59 130 246)"
                              : undefined,
                        }}
                        aria-hidden="true"
                      >
                        {layer.content || "TEXT"}
                      </div>
                    ))}
                    <div
                      className={cn(
                        "absolute inset-0 z-20",
                        selectedLayerId
                          ? "cursor-grab active:cursor-grabbing"
                          : "cursor-default",
                      )}
                      onMouseDown={handleTextMouseDown}
                      onTouchStart={handleTextTouchStart}
                      role="button"
                      tabIndex={0}
                      aria-label="Drag to reposition selected text"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          e.preventDefault();
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
            <Label
              htmlFor="image-upload"
              className="text-lg font-semibold text-gray-700 mb-2 block"
            >
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

          {isProcessed && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold text-gray-700">
                    Text Layers
                  </Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddLayer}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add
                  </Button>
                </div>
                {textLayers.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">
                    No layers yet. Click Add to create one.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {textLayers.map((layer, idx) => (
                      <div
                        key={layer.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md border text-sm",
                          selectedLayerId === layer.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50",
                        )}
                      >
                        <button
                          type="button"
                          className="flex-1 text-left truncate min-w-0"
                          onClick={() => setSelectedLayerId(layer.id)}
                          aria-label={`Select layer ${idx + 1}: ${layer.content || "TEXT"}`}
                        >
                          {layer.content || `Layer ${idx + 1}`}
                        </button>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDuplicateLayer(layer.id)}
                            aria-label="Duplicate layer"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveLayer(layer.id)}
                            aria-label="Remove layer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedLayer && (
                <div className="space-y-4 border-t pt-4">
                  <Label className="text-lg font-semibold text-gray-700 block">
                    Edit Selected Layer
                  </Label>
                  <Input
                    value={selectedLayer.content}
                    onChange={(e) =>
                      handleUpdateLayer(selectedLayer.id, {
                        content: e.target.value,
                      })
                    }
                    placeholder="Enter text"
                  />
                  <div>
                    <Label className="text-sm font-medium text-gray-700 block mb-2">
                      Font Family
                    </Label>
                    <Select
                      value={selectedLayer.fontFamily}
                      onValueChange={(v) =>
                        handleUpdateLayer(selectedLayer.id, {
                          fontFamily: v,
                        })
                      }
                    >
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
                      value={[selectedLayer.fontWeight]}
                      onValueChange={(v) =>
                        handleUpdateLayer(selectedLayer.id, {
                          fontWeight: v[0],
                        })
                      }
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
                      value={[selectedLayer.fontSize]}
                      onValueChange={(v) =>
                        handleUpdateLayer(selectedLayer.id, {
                          fontSize: v[0],
                        })
                      }
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
                      value={selectedLayer.color}
                      onChange={(e) =>
                        handleUpdateLayer(selectedLayer.id, {
                          color: e.target.value,
                        })
                      }
                      className="h-10 p-1 w-full border rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 block mb-2">
                      Opacity
                    </Label>
                    <Slider
                      value={[selectedLayer.opacity]}
                      onValueChange={(v) =>
                        handleUpdateLayer(selectedLayer.id, {
                          opacity: v[0],
                        })
                      }
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
                      value={[selectedLayer.rotation]}
                      onValueChange={(v) =>
                        handleUpdateLayer(selectedLayer.id, {
                          rotation: v[0],
                        })
                      }
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
              )}

              {isProcessed && (
                <Button
                  onClick={handleDownload}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={textLayers.length === 0}
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
