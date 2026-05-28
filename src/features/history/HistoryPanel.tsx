import { FileAudio, History, Image, RotateCcw, Video } from 'lucide-react';
import type { ExtractionHistoryItem } from '../../types';
import { formatDateTime } from '../../utils/format';

interface HistoryPanelProps {
  items: ExtractionHistoryItem[];
  onRestore: (item: ExtractionHistoryItem) => void;
}

export function HistoryPanel({ items, onRestore }: HistoryPanelProps) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
      <div className="mb-4 flex items-center gap-2">
        <History size={18} className="text-rust" aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold text-ink">历史记录</h2>
          <p className="mt-1 text-sm text-slate-600">保存最近 12 条提取结果，刷新页面后仍可继续整理。</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-line bg-paper p-6 text-sm text-slate-600">
          还没有历史记录。识别并保存一次后会出现在这里。
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-md border border-line bg-paper p-3">
              <div className="flex gap-3">
                {item.previewUrl ? (
                  <img
                    className="h-20 w-20 shrink-0 rounded object-cover"
                    src={item.previewUrl}
                    alt={`${item.note.title} 预览`}
                  />
                ) : (
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded bg-white text-rust">
                    {item.source.fileType.startsWith('audio') ? (
                      <FileAudio size={26} aria-hidden="true" />
                    ) : item.source.fileType.startsWith('video') ? (
                      <Video size={26} aria-hidden="true" />
                    ) : (
                      <Image size={26} aria-hidden="true" />
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-ink">{item.note.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.updatedAt)}</p>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{item.text || '暂无文本'}</p>
                </div>
              </div>
              <button
                type="button"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink transition hover:bg-[#f2eee5]"
                onClick={() => onRestore(item)}
              >
                <RotateCcw size={15} aria-hidden="true" />
                继续整理
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
