import type { MediaTranscriptionMode } from '../../types';

type ProgressHandler = (progress: number, message?: string) => void;

type SpeechRecognitionOutput = {
  text?: string;
};

type TransformersModule = {
  env?: {
    allowLocalModels?: boolean;
    useBrowserCache?: boolean;
  };
  pipeline: (
    task: 'automatic-speech-recognition',
    model: string,
    options?: Record<string, unknown>,
  ) => Promise<(audio: Float32Array, options?: Record<string, unknown>) => Promise<SpeechRecognitionOutput>>;
};

const TRANSFORMERS_CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3';
const WHISPER_MODEL = 'Xenova/whisper-tiny';
const TARGET_SAMPLE_RATE = 16000;
const CHUNK_SECONDS = 30;
const MEDIA_LIMITS: Record<
  MediaTranscriptionMode,
  {
    maxAudioDuration: number;
    maxVideoDuration: number;
    maxAudioSize: number;
    maxVideoSize: number;
  }
> = {
  safe: {
    maxAudioDuration: 10 * 60,
    maxVideoDuration: 5 * 60,
    maxAudioSize: 80 * 1024 * 1024,
    maxVideoSize: 160 * 1024 * 1024,
  },
  long: {
    maxAudioDuration: 60 * 60,
    maxVideoDuration: 30 * 60,
    maxAudioSize: 500 * 1024 * 1024,
    maxVideoSize: 1024 * 1024 * 1024,
  },
};

let transcriberPromise:
  | Promise<(audio: Float32Array, options?: Record<string, unknown>) => Promise<SpeechRecognitionOutput>>
  | null = null;

async function loadTransformers(): Promise<TransformersModule> {
  return import(/* @vite-ignore */ TRANSFORMERS_CDN) as Promise<TransformersModule>;
}

async function getTranscriber(onProgress: ProgressHandler) {
  if (!transcriberPromise) {
    transcriberPromise = loadTransformers().then(async ({ env, pipeline }) => {
      if (env) {
        env.allowLocalModels = false;
        env.useBrowserCache = true;
      }

      onProgress(8, '正在加载语音识别模型');
      return pipeline('automatic-speech-recognition', WHISPER_MODEL, {
        progress_callback: (event: { progress?: number; status?: string }) => {
          if (typeof event.progress === 'number') {
            onProgress(8 + Math.round(event.progress * 0.32), event.status);
          }
        },
      });
    });
  }

  return transcriberPromise;
}

function waitForBrowserBreath(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 30));
}

function readMediaDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const media = document.createElement(file.type.startsWith('video') ? 'video' : 'audio');

    media.preload = 'metadata';
    media.onloadedmetadata = () => {
      const { duration } = media;
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(duration) ? duration : 0);
    };
    media.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法读取媒体时长，请确认文件格式是否被浏览器支持。'));
    };
    media.src = url;
  });
}

async function validateMedia(
  file: File,
  mode: MediaTranscriptionMode,
  onProgress: ProgressHandler,
): Promise<void> {
  const isVideo = file.type.startsWith('video');
  const limits = MEDIA_LIMITS[mode];
  const maxSize = isVideo ? limits.maxVideoSize : limits.maxAudioSize;
  const maxDuration = isVideo ? limits.maxVideoDuration : limits.maxAudioDuration;

  if (file.size > maxSize) {
    const limit = Math.round(maxSize / 1024 / 1024);
    throw new Error(`当前${isVideo ? '视频' : '音频'}过大。当前模式限制 ${limit}MB 以内，请压缩、剪辑，或切换长媒体模式。`);
  }

  onProgress(18, '正在读取媒体信息');
  const duration = await readMediaDuration(file);

  if (duration > maxDuration) {
    const limitMinutes = Math.round(maxDuration / 60);
    throw new Error(`当前${isVideo ? '视频' : '音频'}约 ${Math.ceil(duration / 60)} 分钟。当前模式限制 ${limitMinutes} 分钟以内。`);
  }
}

function mixToMono(buffer: AudioBuffer): Float32Array {
  const output = new Float32Array(buffer.length);

  for (let channelIndex = 0; channelIndex < buffer.numberOfChannels; channelIndex += 1) {
    const channel = buffer.getChannelData(channelIndex);
    for (let sampleIndex = 0; sampleIndex < channel.length; sampleIndex += 1) {
      output[sampleIndex] += channel[sampleIndex] / buffer.numberOfChannels;
    }
  }

  return output;
}

function resampleLinear(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) {
    return input;
  }

  const ratio = fromRate / toRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);

  for (let index = 0; index < outputLength; index += 1) {
    const sourceIndex = index * ratio;
    const lower = Math.floor(sourceIndex);
    const upper = Math.min(input.length - 1, lower + 1);
    const weight = sourceIndex - lower;
    output[index] = input[lower] * (1 - weight) + input[upper] * weight;
  }

  return output;
}

async function decodeAudio(file: File, onProgress: ProgressHandler): Promise<Float32Array> {
  onProgress(45, '正在解码音频');
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();

  try {
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const mono = mixToMono(decoded);
    return resampleLinear(mono, decoded.sampleRate, TARGET_SAMPLE_RATE);
  } catch (error) {
    if (file.type.startsWith('video')) {
      throw new Error('当前浏览器无法直接解码这个视频的音轨。请先换成 MP4/WEBM，或等待后续 FFmpeg/WASM 版本。');
    }

    throw error;
  } finally {
    await audioContext.close();
  }
}

function sliceAudio(audio: Float32Array, chunkSeconds: number): Float32Array[] {
  const chunkLength = TARGET_SAMPLE_RATE * chunkSeconds;
  const chunks: Float32Array[] = [];

  for (let start = 0; start < audio.length; start += chunkLength) {
    chunks.push(audio.slice(start, Math.min(audio.length, start + chunkLength)));
  }

  return chunks;
}

export async function transcribeAudio(
  file: File,
  mode: MediaTranscriptionMode,
  onProgress: ProgressHandler,
): Promise<string> {
  onProgress(1, '准备音频转写');
  await validateMedia(file, mode, onProgress);
  const transcriber = await getTranscriber(onProgress);
  const audio = await decodeAudio(file, onProgress);
  const chunks = sliceAudio(audio, CHUNK_SECONDS);
  const transcripts: string[] = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const baseProgress = 62 + Math.round((index / chunks.length) * 36);

    onProgress(baseProgress, `正在转写第 ${index + 1}/${chunks.length} 段`);
    const result = await transcriber(chunk, {
      language: 'chinese',
      task: 'transcribe',
      return_timestamps: false,
    });

    if (result.text?.trim()) {
      transcripts.push(result.text.trim());
    }

    onProgress(62 + Math.round(((index + 1) / chunks.length) * 36), `已完成第 ${index + 1}/${chunks.length} 段`);
    await waitForBrowserBreath();
  }

  onProgress(100, '转写完成');
  return transcripts.join('\n\n').trim();
}
