import { type FC, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { removeBackground } from "@/lib/backgroundRemoval";

interface TextBehindObjectProps {
  text: string;
  imageSrc: string;
  imageAlt?: string;
  className?: string;
  textClassName?: string;
  imageClassName?: string;
  onProgress?: (progress: number) => void;
}

export const TextBehindObject: FC<TextBehindObjectProps> = ({
  text,
  imageSrc,
  imageAlt = "",
  className,
  textClassName,
  imageClassName,
  onProgress,
}) => {
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stableOnProgress = useCallback(
    (p: number) => onProgress?.(p),
    [onProgress]
  );

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const processImage = async () => {
      try {
        setIsProcessing(true);
        setError(null);

        const processedBlob = await removeBackground(imageSrc, {
          progress: stableOnProgress,
        });

        if (cancelled) return;

        objectUrl = URL.createObjectURL(processedBlob);
        setProcessedImage((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return objectUrl;
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to process image"
          );
          setProcessedImage((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
        }
      } finally {
        if (!cancelled) setIsProcessing(false);
      }
    };

    processImage();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageSrc, stableOnProgress]);

  if (error) {
    return (
      <div className="text-red-500 p-4 border border-red-200 rounded-md">
        Error: {error}
      </div>
    );
  }

  return (
    <div
      className={cn("relative inline-block w-fit", className)}
      role="img"
      aria-label={`${text} with ${imageAlt}`}
    >
      {/* Large background text */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center text-[15rem] font-bold text-yellow-400 opacity-100 select-none pointer-events-none",
          textClassName
        )}
        aria-hidden="true"
      >
        {text}
      </div>

      {/* Loading state */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="text-white">Processing image...</div>
        </div>
      )}

      {/* Foreground image - transparent background shows text behind */}
      <img
        src={processedImage || imageSrc}
        alt={imageAlt}
        className={cn(
          "relative z-10 w-auto h-[300px] object-contain",
          imageClassName
        )}
      />
    </div>
  );
};
