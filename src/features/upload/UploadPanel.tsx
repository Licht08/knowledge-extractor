import { ImagePlus, ScanText, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';

interface UploadPanelProps {
  onFileSelect: (file: File) => void;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export function UploadPanel({ onFileSelect }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file || !ACCEPTED_TYPES.includes(file.type)) {
      return;
    }

    onFileSelect(file);
  }

  return (
    <section
      className={`rounded-lg border border-dashed p-5 shadow-panel transition ${
        isDragging ? 'border-moss bg-white' : 'border-line bg-white'
      }`}
      onDragOver={(event: { preventDefault: () => void }) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event: { preventDefault: () => void; dataTransfer: DataTransfer }) => {
        event.preventDefault();
        setIsDragging(false);
        handleFile(event.dataTransfer.files[0]);
      }}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-paper text-moss">
            <UploadCloud size={22} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-ink">上传图片</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              支持 PNG、JPG、JPEG、WEBP。图片会在浏览器中识别，适合截图、书页和 PPT 图片入库。
            </p>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus size={17} aria-hidden="true" />
              选择图片
            </button>
            <input
              ref={inputRef}
              className="hidden"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(event: { target: HTMLInputElement }) => handleFile(event.target.files?.[0])}
            />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-slate-600">
          <div className="rounded-md bg-paper px-3 py-2">
            <div className="flex items-center gap-1.5 font-medium text-ink">
              <ScanText size={13} aria-hidden="true" />
              三种预处理
            </div>
            <p className="mt-1 leading-5">截图、书页、扫描件分别优化。</p>
          </div>
          <div className="rounded-md bg-paper px-3 py-2">
            <div className="font-medium text-ink">浏览器识别</div>
            <p className="mt-1 leading-5">图片不需要上传到第三方服务。</p>
          </div>
        </div>
      </div>
    </section>
  );
}
