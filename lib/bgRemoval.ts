import { removeBackground } from "@imgly/background-removal";

export type BgRemovalProgress = (label: string, current: number, total: number) => void;

/**
 * Removes the background from a File entirely in the browser using
 * @imgly/background-removal (runs a local ONNX model via WASM — nothing is
 * uploaded to a third-party AI service). Returns a transparent PNG blob.
 */
export async function removeImageBackground(
  file: File,
  onProgress?: BgRemovalProgress
): Promise<Blob> {
  const blob = await removeBackground(file, {
    progress: (key, current, total) => {
      onProgress?.(key, current, total);
    },
  });

  return blob;
}
