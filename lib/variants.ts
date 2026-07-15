import { getCategoryRules } from "./categories";
import { estimateShippingCost, PhysicalDimensions } from "./shipping";

export type Tone = "white" | "soft-white" | "light-grey";

export const TONE_HEX: Record<Tone, string> = {
  white: "#ffffff",
  "soft-white": "#fbfaf8",
  "light-grey": "#f2f1ee",
};

export type OutputFormat = "jpg" | "png";

export interface VariantConfig {
  id: string;
  label: string;
  fillPercent: number; // how much of the frame the product occupies, e.g. 82
  shadow: boolean;
  tone: Tone;
  border?: string;
  jpgQuality?: number;
  textOverlay?: string;
  shippingPrice?: number;
  shippingSlab?: string;
  shippingConfidence?: string;
  estimatedVolumetricWeightGrams?: number;
}

/** 
 * 30 rule-compliant variants of the SAME cutout: every combination stays
 * square, center-composed, plain background, product-only, tight crop
 * between 70-90% frame fill. Only crop tightness, presence of a soft
 * ground shadow, and background tone shift between variants.
 */
export function buildVariantConfigs(
  count = 25, 
  categoryName: string | null = null,
  physicalDims: PhysicalDimensions | null = null
): VariantConfig[] {
  const fillLevels = [70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90].map(val => val >= 45 ? val - 5 : val);
  const tones: Tone[] = ["white", "soft-white", "light-grey"];
  const configs: VariantConfig[] = [];

  let i = 0;
  outer: for (const shadow of [false, true]) {
    for (const tone of tones) {
      for (const fillPercent of fillLevels) {
        if (configs.length >= 35) break outer;
        i += 1;
        configs.push({
          id: `v${String(i).padStart(2, "0")}`,
          label: `${fillPercent}% frame · ${tone.replace("-", " ")}${shadow ? " · shadow" : ""}`,
          fillPercent,
          shadow,
          tone,
        });
      }
    }
  }

  // Add 5 extra variants specifically tailored
  if (configs.length < 35) { i += 1; configs.push({ id: `v${String(i).padStart(2, "0")}`, label: `65% frame · white · product focused`, fillPercent: 65, shadow: false, tone: "white", jpgQuality: 0.5 }); }
  if (configs.length < 35) { i += 1; configs.push({ id: `v${String(i).padStart(2, "0")}`, label: `70% frame · white · product focused`, fillPercent: 70, shadow: false, tone: "white", jpgQuality: 0.5 }); }
  if (configs.length < 35) { i += 1; configs.push({ id: `v${String(i).padStart(2, "0")}`, label: `tight crop, minimal padding, plain white, front view, shadow-on. Object coverage, Whitespace balance, Center alignment, Clutter removal, Edge distance, sharpness, Category fit`, fillPercent: 88, shadow: true, tone: "white", jpgQuality: 0.5 }); }
  if (configs.length < 35) { i += 1; configs.push({ id: `v${String(i).padStart(2, "0")}`, label: `slightly zoomed out, moderate padding, soft light gray, 3/4 view, shadow-off. Object coverage, Whitespace balance, Center alignment, Clutter removal, Edge distance, sharpness, Category fit`, fillPercent: 75, shadow: false, tone: "light-grey", jpgQuality: 0.5 }); }
  if (configs.length < 35) { i += 1; configs.push({ id: `v${String(i).padStart(2, "0")}`, label: `flat lay for apparel, shadow-on. Object coverage, Whitespace balance, Center alignment, Clutter removal, Edge distance, sharpness, Category fit`, fillPercent: 80, shadow: true, tone: "white", jpgQuality: 0.5, textOverlay: "FAST DELIVERY" }); }

  if (configs[8]) {
    configs[8].fillPercent -= 5;
    configs[8].border = "#e5e7eb"; // light gray color
  }

  // Apply category-specific optimization rules to variants 11 to 20 (indices 10 to 19)
  // as per the requirement for low-bulk, visually compact, category-specific framing
  if (categoryName && configs.length >= 20) {
    const rules = getCategoryRules(categoryName);
    for (let j = 10; j < 20; j++) {
      const fill = rules.fills[j % rules.fills.length];
      const shadow = rules.shadows[j % rules.shadows.length];
      const tone = rules.tones[j % rules.tones.length];
      configs[j].fillPercent = fill;
      configs[j].shadow = shadow;
      configs[j].tone = tone;
      configs[j].label = `${fill}% frame · ${tone.replace("-", " ")}${shadow ? " · shadow" : ""} · visually compact · low-bulk · ${rules.labelPrefix}`;
    }
  }

  // Reduce all variants by 10% as requested
  for (const config of configs) {
    config.label = config.label.replace(`${config.fillPercent}% frame`, `${config.fillPercent - 10}% frame`);
    config.fillPercent -= 10;
    
    // Add shipping price data if physical dimensions were provided
    if (physicalDims) {
      const { price, volumetricWeightGrams, isVolumetric, slabLabel, confidence } = estimateShippingCost(physicalDims, config.fillPercent);
      
      config.shippingPrice = price;
      config.shippingSlab = slabLabel;
      config.shippingConfidence = confidence;
      config.estimatedVolumetricWeightGrams = isVolumetric ? volumetricWeightGrams : undefined;
    }
  }

  // Filter out the requested variant numbers (1-indexed based on original order)
  const excludedIndices = new Set([6, 7, 11, 12, 14, 15, 24]);
  const filteredConfigs = configs.filter((_, idx) => !excludedIndices.has(idx + 1));
  
  // Re-number IDs so they are sequential v01 to v25
  filteredConfigs.forEach((c, idx) => {
    c.id = `v${String(idx + 1).padStart(2, "0")}`;
  });

  return filteredConfigs.slice(0, count);
}

interface TrimResult {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/**
 * Loads an image blob (expected to already have a transparent background)
 * and trims it down to the bounding box of its non-transparent pixels, so
 * later compositing has an accurate, dead-space-free product silhouette.
 */
export async function trimTransparentBlob(blob: Blob): Promise<TrimResult> {
  const img = await blobToImage(blob);

  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = img.naturalWidth;
  srcCanvas.height = img.naturalHeight;
  const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true })!;
  srcCtx.drawImage(img, 0, 0);

  const { data } = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);

  let minX = srcCanvas.width;
  let minY = srcCanvas.height;
  let maxX = 0;
  let maxY = 0;
  const ALPHA_THRESHOLD = 12;

  for (let y = 0; y < srcCanvas.height; y++) {
    for (let x = 0; x < srcCanvas.width; x++) {
      const alpha = data[(y * srcCanvas.width + x) * 4 + 3];
      if (alpha > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Fallback: nothing detected as opaque, use full image.
  if (maxX <= minX || maxY <= minY) {
    minX = 0;
    minY = 0;
    maxX = srcCanvas.width;
    maxY = srcCanvas.height;
  }

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  const trimmed = document.createElement("canvas");
  trimmed.width = width;
  trimmed.height = height;
  trimmed.getContext("2d")!.drawImage(srcCanvas, -minX, -minY);

  return { canvas: trimmed, width, height };
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/** Picks a square canvas size that comfortably clears the 1000x1000 floor. */
export function resolveCanvasSize(productWidth: number, productHeight: number): number {
  return 1180;
}

function drawGroundShadow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  bottomY: number,
  productWidth: number
) {
  ctx.save();
  ctx.filter = "blur(14px)";
  ctx.fillStyle = "rgba(15, 21, 18, 0.22)";
  ctx.beginPath();
  ctx.ellipse(centerX, bottomY, productWidth * 0.32, productWidth * 0.055, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Composites the trimmed product cutout onto a square background per one VariantConfig. */
export async function renderVariant(
  product: TrimResult,
  config: VariantConfig,
  canvasSize: number,
  format: OutputFormat,
  quality = 0.92
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = TONE_HEX[config.tone];
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  const targetLongest = (config.fillPercent / 100) * canvasSize;
  const scale = targetLongest / Math.max(product.width, product.height);
  const drawW = product.width * scale;
  const drawH = product.height * scale;
  const dx = (canvasSize - drawW) / 2;
  const dy = (canvasSize - drawH) / 2;

  if (config.shadow) {
    drawGroundShadow(ctx, canvasSize / 2, dy + drawH * 0.98, drawW);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(product.canvas, dx, dy, drawW, drawH);

  if (config.border) {
    const lw = 20;
    ctx.strokeStyle = config.border;
    ctx.lineWidth = lw;
    ctx.strokeRect(lw / 2, lw / 2, canvasSize - lw, canvasSize - lw);
  }

  if (config.textOverlay) {
    ctx.fillStyle = "#e63946"; // red-ish color for fast delivery
    ctx.font = "bold 80px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(config.textOverlay, canvasSize / 2, canvasSize - 40);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      format === "jpg" ? "image/jpeg" : "image/png",
      format === "jpg" ? (config.jpgQuality ?? quality) : undefined
    );
  });
}
