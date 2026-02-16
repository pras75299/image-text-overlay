import {
  removeBackground as imglyRemoveBackground,
  removeForeground as imglyRemoveForeground,
} from '@imgly/background-removal';

export type SegmentationOptions = {
  debug?: boolean;
  progress?: (progress: number) => void;
};

/**
 * Segments image into background and foreground (object).
 * Returns both so text can be layered between them.
 */
export type SegmentationResult = {
  background: Blob;
  foreground: Blob;
};

export const segmentImage = async (
  imageUrl: string | File,
  options: SegmentationOptions = {}
): Promise<SegmentationResult> => {
  const { debug = false, progress } = options;

  const createProgress = (start: number, range: number) =>
    (key: string, current: number, total: number) => {
      if (progress) {
        progress(start + range * (total > 0 ? current / total : 0));
      }
    };

  try {
    const [background, foreground] = await Promise.all([
      imglyRemoveForeground(imageUrl, {
        debug,
        ...(progress && { progress: createProgress(0, 0.5) }),
      }),
      imglyRemoveBackground(imageUrl, {
        debug,
        ...(progress && { progress: createProgress(0.5, 0.5) }),
      }),
    ]);

    return { background, foreground };
  } catch (error) {
    console.error('Image segmentation failed:', error);
    throw error;
  }
};

/** Returns foreground only (object with transparent background). For backward compatibility. */
export const removeBackground = async (
  imageUrl: string | File,
  options: SegmentationOptions = {}
): Promise<Blob> => {
  const { foreground } = await segmentImage(imageUrl, options);
  return foreground;
}; 