import type { OcrMode } from '../../types';

const TARGET_MIN_WIDTH = 1600;
const MAX_DIMENSION = 2600;
const MODE_CONTRAST: Record<OcrMode, number> = {
  natural: 18,
  document: 42,
  scan: 68,
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片加载失败'));
    image.src = src;
  });
}

function getScale(width: number, height: number): number {
  const maxSide = Math.max(width, height);
  const enlargeScale = width < TARGET_MIN_WIDTH ? TARGET_MIN_WIDTH / width : 1;
  const limitScale = maxSide * enlargeScale > MAX_DIMENSION ? MAX_DIMENSION / maxSide : enlargeScale;

  return Math.max(0.6, Math.min(2, limitScale));
}

function enhancePixels(imageData: ImageData, mode: OcrMode): ImageData {
  const { data } = imageData;
  const contrast = MODE_CONTRAST[mode];
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let index = 0; index < data.length; index += 4) {
    const gray = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
    const enhanced = Math.max(0, Math.min(255, contrastFactor * (gray - 128) + 128));
    const finalValue = mode === 'scan' ? (enhanced > 150 ? 255 : 0) : enhanced;

    data[index] = finalValue;
    data[index + 1] = finalValue;
    data[index + 2] = finalValue;
  }

  return imageData;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error('图片预处理失败'));
    }, 'image/png');
  });
}

export async function preprocessImage(file: File, mode: OcrMode): Promise<Blob | File> {
  if (mode === 'natural') {
    return file;
  }

  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const scale = getScale(image.naturalWidth, image.naturalHeight);
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    throw new Error('当前浏览器不支持图片预处理');
  }

  canvas.width = width;
  canvas.height = height;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  context.putImageData(enhancePixels(imageData, mode), 0, 0);

  return canvasToBlob(canvas);
}
