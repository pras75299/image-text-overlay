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
import {
  Upload,
  Download,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Undo2,
  Redo2,
} from "lucide-react";
import { toast } from "sonner";
import { segmentImage } from "@/lib/backgroundRemoval";
import { cn } from "@/lib/utils";
import type { TextLayer } from "@/types/textLayer";
import { createDefaultTextLayer } from "@/types/textLayer";
import { useHistory } from "@/hooks/useHistory";

const FONT_FAMILIES = [
  { name: "Arial", family: "Arial" },
  { name: "Times New Roman", family: "Times New Roman" },
  { name: "Helvetica", family: "Helvetica" },
  { name: "Georgia", family: "Georgia" },
  { name: "Impact", family: "Impact" },
  { name: "Bebas Neue", family: "Bebas Neue, sans-serif" },
  { name: "Inter", family: "Inter, sans-serif" },
  { name: "Montserrat", family: "Montserrat, sans-serif" },
  { name: "Oswald", family: "Oswald, sans-serif" },
  { name: "Playfair Display", family: "Playfair Display, serif" },
  { name: "Poppins", family: "Poppins, sans-serif" },
  { name: "Raleway", family: "Raleway, sans-serif" },
  { name: "Roboto", family: "Roboto, sans-serif" },
  { name: "Source Sans 3", family: "Source Sans 3, sans-serif" },
  { name: "Space Grotesk", family: "Space Grotesk, sans-serif" },
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

  const {
    present: textLayers,
    push: historyPush,
    setPresentWithoutPush,
    reset: historyReset,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<TextLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [previewTextOnTop, setPreviewTextOnTop] = useState(true);
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [exportQuality, setExportQuality] = useState(0.92);
  const [backgroundMode, setBackgroundMode] = useState<
    "original" | "solid" | "gradient" | "blur"
  >("original");
  const [backgroundSolidColor, setBackgroundSolidColor] =
    useState("#f8f9fa");
  const [backgroundGradientColor1, setBackgroundGradientColor1] =
    useState("#6366f1");
  const [backgroundGradientColor2, setBackgroundGradientColor2] =
    useState("#8b5cf6");
  const [backgroundGradientDirection, setBackgroundGradientDirection] =
    useState<"top-bottom" | "left-right" | "diagonal">("top-bottom");
  const [backgroundBlurAmount, setBackgroundBlurAmount] = useState(12);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPos: { x: number; y: number };
  } | null>(null);
  const lastDragLayersRef = useRef<TextLayer[]>([]);

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
      historyReset([]);
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
    const newLayers = [...textLayers, newLayer];
    historyPush(newLayers);
    setSelectedLayerId(newLayer.id);
    toast.success("Text layer added!");
  }, [textLayers, historyPush]);

  const handleRemoveLayer = useCallback(
    (id: string) => {
      const newLayers = textLayers.filter((l) => l.id !== id);
      historyPush(newLayers);
      setSelectedLayerId((curr) => (curr === id ? null : curr));
      toast.success("Layer removed!");
    },
    [textLayers, historyPush],
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
      const newLayers = [...textLayers, newLayer];
      historyPush(newLayers);
      setSelectedLayerId(newLayer.id);
      toast.success("Layer duplicated!");
    },
    [textLayers, historyPush],
  );

  const handleUpdateLayer = useCallback(
    (id: string, updates: Partial<TextLayer>, options?: { isDrag?: boolean }) => {
      const newLayers = textLayers.map((l) =>
        l.id === id ? { ...l, ...updates } : l,
      );
      if (options?.isDrag) {
        lastDragLayersRef.current = newLayers;
        setPresentWithoutPush(newLayers);
      } else {
        historyPush(newLayers);
      }
    },
    [textLayers, setPresentWithoutPush, historyPush],
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

      if (exportFormat !== "png") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }

      if (backgroundMode === "solid") {
        ctx.fillStyle = backgroundSolidColor;
        ctx.fillRect(0, 0, width, height);
      } else if (backgroundMode === "gradient") {
        const [x0, y0, x1, y1] =
          backgroundGradientDirection === "top-bottom"
            ? [0, 0, 0, height]
            : backgroundGradientDirection === "left-right"
              ? [0, 0, width, 0]
              : [0, 0, width, height];
        const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        gradient.addColorStop(0, backgroundGradientColor1);
        gradient.addColorStop(1, backgroundGradientColor2);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      } else if (backgroundMode === "blur") {
        ctx.save();
        ctx.filter = `blur(${backgroundBlurAmount}px)`;
        ctx.drawImage(bgImg, 0, 0);
        ctx.restore();
      } else {
        ctx.drawImage(bgImg, 0, 0);
      }

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

      const mimeType =
        exportFormat === "png"
          ? "image/png"
          : exportFormat === "jpeg"
            ? "image/jpeg"
            : "image/webp";
      const extension =
        exportFormat === "png"
          ? "png"
          : exportFormat === "jpeg"
            ? "jpg"
            : "webp";
      const quality = exportFormat === "png" ? undefined : exportQuality;

      try {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              toast.error("Failed to generate image");
              return;
            }
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = `text-behind-object.${extension}`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success("Image downloaded!");
          },
          mimeType,
          quality,
        );
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
  }, [
    backgroundImageUrl,
    foregroundImageUrl,
    textLayers,
    exportFormat,
    exportQuality,
    backgroundMode,
    backgroundSolidColor,
    backgroundGradientColor1,
    backgroundGradientColor2,
    backgroundGradientDirection,
    backgroundBlurAmount,
  ]);

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
      handleUpdateLayer(
        selectedLayerId,
        { position: { x: newX, y: newY } },
        { isDrag: true },
      );
    };

    const handleMouseUp = () => {
      if (dragRef.current && lastDragLayersRef.current.length > 0) {
        historyPush(lastDragLayersRef.current);
      }
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
      handleUpdateLayer(
        selectedLayerId,
        { position: { x: newX, y: newY } },
        { isDrag: true },
      );
    };

    const handleTouchEnd = () => {
      if (dragRef.current && lastDragLayersRef.current.length > 0) {
        historyPush(lastDragLayersRef.current);
      }
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
  }, [selectedLayerId, handleUpdateLayer, historyPush]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    if (
      selectedLayerId &&
      !textLayers.some((l) => l.id === selectedLayerId)
    ) {
      setSelectedLayerId(null);
    }
  }, [textLayers, selectedLayerId]);

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
                          {backgroundMode === "solid" && (
                            <div
                              className="absolute inset-0"
                              style={{ backgroundColor: backgroundSolidColor }}
                              aria-hidden="true"
                            />
                          )}
                          {backgroundMode === "gradient" && (
                            <div
                              className="absolute inset-0"
                              style={{
                                background: `linear-gradient(${
                                  backgroundGradientDirection === "top-bottom"
                                    ? "180deg"
                                    : backgroundGradientDirection === "left-right"
                                      ? "90deg"
                                      : "135deg"
                                }, ${backgroundGradientColor1}, ${backgroundGradientColor2})`,
                              }}
                              aria-hidden="true"
                            />
                          )}
                          {(backgroundMode === "original" ||
                            backgroundMode === "blur") && (
                            <img
                              src={backgroundImageUrl}
                              alt="Background"
                              className={cn(
                                "max-w-full max-h-full w-auto h-auto object-contain absolute",
                                backgroundMode === "blur" && "scale-105",
                              )}
                              style={
                                backgroundMode === "blur"
                                  ? {
                                      filter: `blur(${Math.min(backgroundBlurAmount, 24)}px)`,
                                    }
                                  : undefined
                              }
                            />
                          )}
                          <img
                            src={foregroundImageUrl}
                            alt="Subject"
                            onLoad={(e) => {
                              const img = e.currentTarget;
                              setImageDimensions({
                                width: img.naturalWidth,
                                height: img.naturalHeight,
                              });
                            }}
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
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-lg font-semibold text-gray-700 shrink-0">
                    Text Layers
                  </Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={undo}
                      disabled={!canUndo}
                      aria-label="Undo"
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={redo}
                      disabled={!canRedo}
                      aria-label="Redo"
                    >
                      <Redo2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddLayer}
                      className="bg-purple-600 hover:bg-purple-700 shrink-0"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                  </div>
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
                          <SelectItem
                            key={font.family}
                            value={font.family}
                            style={{ fontFamily: font.family }}
                          >
                            {font.name}
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

              <div className="space-y-3 border-t pt-4">
                <Label className="text-sm font-semibold text-gray-700 block">
                  Background
                </Label>
                <div>
                  <Label className="text-xs font-medium text-gray-600 block mb-1">
                    Mode
                  </Label>
                  <Select
                    value={backgroundMode}
                    onValueChange={(v: "original" | "solid" | "gradient" | "blur") =>
                      setBackgroundMode(v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original">
                        Original
                      </SelectItem>
                      <SelectItem value="solid">Solid color</SelectItem>
                      <SelectItem value="gradient">Gradient</SelectItem>
                      <SelectItem value="blur">Blur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {backgroundMode === "solid" && (
                  <div>
                    <Label className="text-xs font-medium text-gray-600 block mb-1">
                      Color
                    </Label>
                    <Input
                      type="color"
                      value={backgroundSolidColor}
                      onChange={(e) =>
                        setBackgroundSolidColor(e.target.value)
                      }
                      className="h-10 p-1 w-full border rounded-md cursor-pointer"
                    />
                  </div>
                )}
                {backgroundMode === "gradient" && (
                  <>
                    <div>
                      <Label className="text-xs font-medium text-gray-600 block mb-1">
                        Color 1
                      </Label>
                      <Input
                        type="color"
                        value={backgroundGradientColor1}
                        onChange={(e) =>
                          setBackgroundGradientColor1(e.target.value)
                        }
                        className="h-10 p-1 w-full border rounded-md cursor-pointer"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600 block mb-1">
                        Color 2
                      </Label>
                      <Input
                        type="color"
                        value={backgroundGradientColor2}
                        onChange={(e) =>
                          setBackgroundGradientColor2(e.target.value)
                        }
                        className="h-10 p-1 w-full border rounded-md cursor-pointer"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600 block mb-1">
                        Direction
                      </Label>
                      <Select
                        value={backgroundGradientDirection}
                        onValueChange={(v: "top-bottom" | "left-right" | "diagonal") =>
                          setBackgroundGradientDirection(v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top-bottom">
                            Top to bottom
                          </SelectItem>
                          <SelectItem value="left-right">
                            Left to right
                          </SelectItem>
                          <SelectItem value="diagonal">
                            Diagonal
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {backgroundMode === "blur" && (
                  <div>
                    <Label className="text-xs font-medium text-gray-600 block mb-1">
                      Blur amount: {backgroundBlurAmount}px
                    </Label>
                    <Slider
                      value={[backgroundBlurAmount]}
                      onValueChange={(v) => setBackgroundBlurAmount(v[0])}
                      min={2}
                      max={40}
                      step={2}
                    />
                  </div>
                )}
              </div>

              {isProcessed && (
                <>
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-semibold text-gray-700 block">
                      Export Options
                    </Label>
                    <div>
                      <Label className="text-xs font-medium text-gray-600 block mb-1">
                        Format
                      </Label>
                      <Select
                        value={exportFormat}
                        onValueChange={(v: "png" | "jpeg" | "webp") =>
                          setExportFormat(v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="png">PNG (lossless)</SelectItem>
                          <SelectItem value="jpeg">JPEG</SelectItem>
                          <SelectItem value="webp">WebP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {exportFormat !== "png" && (
                      <div>
                        <Label className="text-xs font-medium text-gray-600 block mb-1">
                          Quality: {Math.round(exportQuality * 100)}%
                        </Label>
                        <Slider
                          value={[exportQuality]}
                          onValueChange={(v) => setExportQuality(v[0])}
                          min={0.1}
                          max={1}
                          step={0.05}
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleDownload}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={textLayers.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Image
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
