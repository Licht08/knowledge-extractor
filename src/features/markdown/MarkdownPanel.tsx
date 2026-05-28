import { Check, Clipboard, Download, FileDown, Save } from 'lucide-react';
import type { KnowledgeNote } from '../../types';

interface MarkdownPanelProps {
  note: KnowledgeNote;
  summary: string;
  keywordsDraft: string;
  questionsDraft: string;
  onTitleChange: (value: string) => void;
  onSummaryChange: (value: string) => void;
  onKeywordsChange: (value: string) => void;
  onQuestionsChange: (value: string) => void;
  onCopy: () => void;
  onDownload: () => void;
  onSave: () => void;
  copied: boolean;
}

export function MarkdownPanel({
  note,
  summary,
  keywordsDraft,
  questionsDraft,
  onTitleChange,
  onSummaryChange,
  onKeywordsChange,
  onQuestionsChange,
  onCopy,
  onDownload,
  onSave,
  copied,
}: MarkdownPanelProps) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileDown size={18} className="text-moss" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-ink">Markdown Builder</h2>
            <p className="mt-1 text-sm text-slate-600">生成可以直接放进 Obsidian 的知识笔记。</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink transition hover:bg-paper"
            onClick={onSave}
          >
            <Save size={16} aria-hidden="true" />
            保存记录
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink transition hover:bg-paper"
            onClick={onDownload}
          >
            <Download size={16} aria-hidden="true" />
            下载 .md
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-rust px-3 py-2 text-sm font-medium text-white transition hover:bg-[#8d4d31]"
            onClick={onCopy}
          >
            {copied ? <Check size={16} aria-hidden="true" /> : <Clipboard size={16} aria-hidden="true" />}
            {copied ? '已复制' : '复制 Markdown'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-ink">标题</span>
            <input
              className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none transition focus:border-moss focus:bg-white"
              value={note.title}
              onChange={(event: { target: HTMLInputElement }) => onTitleChange(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">摘要</span>
            <textarea
              className="mt-1 min-h-24 w-full resize-y rounded-md border border-line bg-paper px-3 py-2 text-sm leading-6 outline-none transition focus:border-moss focus:bg-white"
              value={summary}
              placeholder="先留空也可以，导出后在 Obsidian 里继续整理。"
              onChange={(event: { target: HTMLTextAreaElement }) => onSummaryChange(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">关键词</span>
            <input
              className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none transition focus:border-moss focus:bg-white"
              value={keywordsDraft}
              placeholder="用逗号或换行分隔"
              onChange={(event: { target: HTMLInputElement }) => onKeywordsChange(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">待整理问题</span>
            <textarea
              className="mt-1 min-h-24 w-full resize-y rounded-md border border-line bg-paper px-3 py-2 text-sm leading-6 outline-none transition focus:border-moss focus:bg-white"
              value={questionsDraft}
              placeholder="每行一个问题"
              onChange={(event: { target: HTMLTextAreaElement }) => onQuestionsChange(event.target.value)}
            />
          </label>
        </div>

        <pre className="max-h-[440px] overflow-auto rounded-md border border-line bg-[#fbfaf7] p-4 text-sm leading-7 text-ink">
          <code>{note.markdown}</code>
        </pre>
      </div>
    </section>
  );
}
