import { Edit3, FileText } from 'lucide-react';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TextEditor({ value, onChange }: TextEditorProps) {
  const trimmedValue = value.trim();
  const characterCount = trimmedValue.length;
  const lineCount = trimmedValue ? trimmedValue.split(/\r?\n/).filter(Boolean).length : 0;

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Edit3 size={18} className="text-rust" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-ink">文本校对</h2>
            <p className="mt-1 text-sm text-slate-600">修正错字、断行和标点，确认后再生成知识库笔记。</p>
          </div>
        </div>
        <div className="flex gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-md bg-paper px-2.5 py-1">
            <FileText size={13} aria-hidden="true" />
            {characterCount} 字符
          </span>
          <span className="rounded-md bg-paper px-2.5 py-1">{lineCount} 行</span>
        </div>
      </div>
      <textarea
        className="min-h-[320px] w-full resize-y rounded-md border border-line bg-paper p-4 text-sm leading-7 text-ink outline-none transition focus:border-moss focus:bg-white"
        value={value}
        placeholder="识别出的文本会显示在这里，也可以手动粘贴文本进行整理。"
        onChange={(event: { target: HTMLTextAreaElement }) => onChange(event.target.value)}
      />
    </section>
  );
}
