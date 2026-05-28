export type OcrStatus = 'idle' | 'loading' | 'recognizing' | 'completed' | 'failed';
export type OcrMode = 'natural' | 'document' | 'scan';
export type AudioTranscriptionStatus = 'idle' | 'loadingModel' | 'decoding' | 'transcribing' | 'completed' | 'failed';
export type MediaKind = 'audio' | 'video';
export type MediaTranscriptionMode = 'safe' | 'long';
export type TranscriptionEngine = 'backend' | 'browser';

export interface ExtractionSource {
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface OcrJob {
  source: ExtractionSource | null;
  status: OcrStatus;
  progress: number;
  recognizedText: string;
  errorMessage: string | null;
}

export interface AudioTranscriptionJob {
  source: ExtractionSource | null;
  status: AudioTranscriptionStatus;
  progress: number;
  transcript: string;
  errorMessage: string | null;
}

export interface KnowledgeNote {
  title: string;
  sourceType: string;
  extractedAt: string;
  originalText: string;
  summary: string;
  keywords: string[];
  questions: string[];
  markdown: string;
}

export interface ExtractionHistoryItem {
  id: string;
  source: ExtractionSource;
  previewUrl: string;
  text: string;
  note: KnowledgeNote;
  updatedAt: string;
}
