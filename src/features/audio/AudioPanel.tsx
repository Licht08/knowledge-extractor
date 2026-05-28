import { FileAudio, LoaderCircle, Mic2, Video } from 'lucide-react';
import { useRef } from 'react';
import type {
  AudioTranscriptionJob,
  ExtractionSource,
  MediaTranscriptionMode,
  TranscriptionEngine,
} from '../../types';
import { formatDateTime, formatFileSize } from '../../utils/format';

interface AudioPanelProps {
  mediaUrl: string;
  source: ExtractionSource | null;
  job: AudioTranscriptionJob;
  engine: TranscriptionEngine;
  onEngineChange: (engine: TranscriptionEngine) => void;
  mode: MediaTranscriptionMode;
  onModeChange: (mode: MediaTranscriptionMode) => void;
  onFileSelect: (file: File) => void;
  onTranscribe: () => void;
  canTranscribe: boolean;
}

const ACCEPTED_MEDIA_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/webm',
  'audio/ogg',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

function getStatusText(job: AudioTranscriptionJob): string {
  if (job.status === 'loadingModel') {
    return '正在加载模型';
  }

  if (job.status === 'decoding') {
    return '正在解码音频';
  }

  if (job.status === 'transcribing') {
    return '正在转写';
  }

  if (job.status === 'completed') {
    return '转写完成';
  }

  if (job.status === 'failed') {
    return '转写失败';
  }

  return '等待音频';
}

export function AudioPanel({
  mediaUrl,
  source,
  job,
  engine,
  onEngineChange,
  mode,
  onModeChange,
  onFileSelect,
  onTranscribe,
  canTranscribe,
}: AudioPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isWorking = job.status === 'loadingModel' || job.status === 'decoding' || job.status === 'transcribing';
  const isVideo = source?.fileType.startsWith('video') || false;

  function handleFile(file: File | undefined) {
    if (!file || (file.type && !ACCEPTED_MEDIA_TYPES.includes(file.type))) {
      return;
    }

    onFileSelect(file);
  }

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-paper text-rust">
            {isVideo ? <Video size={22} aria-hidden="true" /> : <FileAudio size={22} aria-hidden="true" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-ink">媒体转文本</h2>
              <span className="rounded-md bg-[#fff1e8] px-2 py-0.5 text-xs font-medium text-rust">V2</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">上传音频或视频后优先用本地后端转写，结果进入下方文本校对区。</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-paper"
            onClick={() => inputRef.current?.click()}
          >
            <FileAudio size={17} aria-hidden="true" />
            选择媒体
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-rust px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8d4d31] disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!canTranscribe || isWorking}
            onClick={onTranscribe}
          >
            {isWorking ? <LoaderCircle className="animate-spin" size={17} /> : <Mic2 size={17} />}
            开始转写
          </button>
          <input
            ref={inputRef}
            className="hidden"
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/webm,audio/ogg,video/mp4,video/webm,video/quicktime,.m4a,.mp4,.mov"
            onChange={(event: { target: HTMLInputElement }) => handleFile(event.target.files?.[0])}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-md border border-line bg-paper p-4">
          {mediaUrl && isVideo ? (
            <video className="max-h-72 w-full rounded bg-black" controls src={mediaUrl}>
              当前浏览器不支持视频播放。
            </video>
          ) : mediaUrl ? (
            <audio className="w-full" controls src={mediaUrl}>
              当前浏览器不支持音频播放。
            </audio>
          ) : (
            <div className="rounded-md border border-dashed border-line bg-white p-6 text-center text-sm text-slate-600">
              支持 MP3、WAV、M4A、WEBM、OGG、MP4、MOV。首次转写会下载模型，需要等待更久。
            </div>
          )}
        </div>
        <div className="rounded-md bg-paper p-4 text-sm text-slate-700">
          <div className="mb-3 font-medium text-ink">{getStatusText(job)}</div>
          {source ? (
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-slate-500">文件名</dt>
                <dd className="break-all">{source.fileName}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">大小</dt>
                <dd>{formatFileSize(source.fileSize)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">上传时间</dt>
                <dd>{formatDateTime(source.createdAt)}</dd>
              </div>
            </dl>
          ) : null}
          <div className="mt-5">
            <div className="mb-4">
              <div className="mb-2 text-xs font-medium text-slate-500">转写引擎</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                    engine === 'backend'
                      ? 'border-moss bg-white text-ink shadow-sm'
                      : 'border-line bg-[#edf2ed] text-slate-600 hover:bg-white'
                  }`}
                  disabled={isWorking}
                  onClick={() => onEngineChange('backend')}
                >
                  <span className="block font-medium">本地后端</span>
                  <span className="mt-0.5 block text-xs text-slate-500">推荐</span>
                </button>
                <button
                  type="button"
                  className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                    engine === 'browser'
                      ? 'border-moss bg-white text-ink shadow-sm'
                      : 'border-line bg-[#edf2ed] text-slate-600 hover:bg-white'
                  }`}
                  disabled={isWorking}
                  onClick={() => onEngineChange('browser')}
                >
                  <span className="block font-medium">浏览器备用</span>
                  <span className="mt-0.5 block text-xs text-slate-500">短素材</span>
                </button>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {engine === 'backend'
                  ? '本地后端速度更快，适合长视频；需要先启动 Python 服务。'
                  : '浏览器备用不需要后端，但速度慢，只适合短媒体。'}
              </p>
            </div>
            <div className="mb-4">
              <div className="mb-2 text-xs font-medium text-slate-500">转写模式</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                    mode === 'safe' ? 'border-moss bg-white text-ink shadow-sm' : 'border-line bg-[#edf2ed] text-slate-600 hover:bg-white'
                  }`}
                  disabled={isWorking || engine === 'backend'}
                  onClick={() => onModeChange('safe')}
                >
                  稳定
                </button>
                <button
                  type="button"
                  className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                    mode === 'long' ? 'border-moss bg-white text-ink shadow-sm' : 'border-line bg-[#edf2ed] text-slate-600 hover:bg-white'
                  }`}
                  disabled={isWorking || engine === 'backend'}
                  onClick={() => onModeChange('long')}
                >
                  长媒体
                </button>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {engine === 'backend'
                  ? '本地后端不使用浏览器时长限制，实际速度取决于 CPU 和模型大小。'
                  : mode === 'safe'
                  ? '稳定模式：音频 10 分钟内，视频 5 分钟内。'
                  : '长媒体模式：音频 60 分钟内，视频 30 分钟内，但浏览器可能明显变慢。'}
              </p>
            </div>
            <div className="mb-2 flex justify-between text-xs text-slate-500">
              <span>转写进度</span>
              <span>{job.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-rust transition-all" style={{ width: `${job.progress}%` }} />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              本地后端会把媒体留在你的电脑上处理；浏览器备用仍然适合临时短素材。
            </p>
          </div>
          {job.errorMessage ? <p className="mt-4 text-sm text-red-700">{job.errorMessage}</p> : null}
        </div>
      </div>
    </section>
  );
}
