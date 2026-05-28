import { FileText, LoaderCircle, ScanText } from 'lucide-react';
import type { ExtractionSource, OcrJob, OcrMode } from '../../types';
import { formatDateTime, formatFileSize } from '../../utils/format';

interface OcrPanelProps {
  job: OcrJob;
  previewUrl: string;
  source: ExtractionSource | null;
  mode: OcrMode;
  onModeChange: (mode: OcrMode) => void;
  onRunOcr: () => void;
  canRun: boolean;
}

const ocrModes: Array<{ value: OcrMode; label: string; description: string }> = [
  { value: 'natural', label: '普通图片', description: '保留原图，适合清晰截图。' },
  { value: 'document', label: '文档增强', description: '放大并增强对比度，适合书页和 PPT。' },
  { value: 'scan', label: '黑白扫描', description: '转成黑白高对比，适合深色文字浅色背景。' },
];

export function OcrPanel({
  job,
  previewUrl,
  source,
  mode,
  onModeChange,
  onRunOcr,
  canRun,
}: OcrPanelProps) {
  const isWorking = job.status === 'loading' || job.status === 'recognizing';
  const modeDescription = ocrModes.find((item) => item.value === mode)?.description;

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-ink">OCR 识别</h2>
            <span className="rounded-md bg-[#eef7ee] px-2 py-0.5 text-xs font-medium text-moss">V1</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">根据图片类型选择预处理方式，再开始识别文字。</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm font-medium text-white transition hover:bg-[#405d43] disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!canRun || isWorking}
          onClick={onRunOcr}
        >
          {isWorking ? <LoaderCircle className="animate-spin" size={17} /> : <ScanText size={17} />}
          开始识别
        </button>
      </div>

      {previewUrl ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="overflow-hidden rounded-md border border-line bg-slate-50">
            <img className="max-h-[420px] w-full object-contain" src={previewUrl} alt="待识别图片预览" />
          </div>
          <div className="rounded-md bg-paper p-4 text-sm text-slate-700">
            <div className="mb-3 flex items-center gap-2 font-medium text-ink">
              <FileText size={17} aria-hidden="true" />
              图片信息
            </div>
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
                <div className="mb-2 text-xs font-medium text-slate-500">识别模式</div>
                <div className="grid gap-2">
                  {ocrModes.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                        mode === item.value
                          ? 'border-moss bg-white text-ink shadow-sm'
                          : 'border-line bg-[#edf2ed] text-slate-600 hover:bg-white'
                      }`}
                      disabled={isWorking}
                      onClick={() => onModeChange(item.value)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{modeDescription}</p>
              </div>
              <div className="mb-2 flex justify-between text-xs text-slate-500">
                <span>识别进度</span>
                <span>{job.progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-rust transition-all" style={{ width: `${job.progress}%` }} />
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                如果原图模糊、倾斜或背景复杂，仍需要在文本校对区手动修正。
              </p>
            </div>
            {job.errorMessage ? <p className="mt-4 text-sm text-red-700">{job.errorMessage}</p> : null}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-line bg-paper p-8 text-center text-sm text-slate-600">
          还没有上传图片。
        </div>
      )}
    </section>
  );
}
