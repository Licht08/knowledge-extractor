import Tesseract from 'tesseract.js';
import type { OcrMode } from '../../types';
import { preprocessImage } from './preprocessImage';

type ProgressHandler = (progress: number) => void;

export async function recognizeImage(file: File, mode: OcrMode, onProgress: ProgressHandler): Promise<string> {
  onProgress(6);
  const processedImage = await preprocessImage(file, mode);
  onProgress(12);

  const result = await Tesseract.recognize(processedImage, 'chi_sim+eng', {
    logger(message) {
      if (message.status === 'recognizing text') {
        onProgress(12 + Math.round(message.progress * 88));
      }
    },
  });

  return result.data.text.trim();
}
