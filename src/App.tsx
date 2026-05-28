import { AudioLines, BookOpenText, Database, FileText, Image, Laptop, ListChecks, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { loadHistory, saveHistory, upsertHistoryItem } from './data/storage';
import { AudioPanel } from './features/audio/AudioPanel';
import { transcribeWithLocalBackend } from './features/audio/localBackend';
import { transcribeAudio } from './features/audio/transcribeAudio';
import { TextEditor } from './features/editor/TextEditor';
import { HistoryPanel } from './features/history/HistoryPanel';
import { MarkdownPanel } from './features/markdown/MarkdownPanel';
import { OcrPanel } from './features/ocr/OcrPanel';
import { recognizeImage } from './features/ocr/runOcr';
import { UploadPanel } from './features/upload/UploadPanel';
import type {
  AudioTranscriptionJob,
  ExtractionHistoryItem,
  ExtractionSource,
  KnowledgeNote,
  MediaTranscriptionMode,
  OcrJob,
  OcrMode,
  TranscriptionEngine,
} from './types';
import { fileNameToTitle, fileToDataUrl, splitLines } from './utils/format';
import { buildMarkdownNote } from './utils/markdown';

const initialJob: OcrJob = {
  source: null,
  status: 'idle',
  progress: 0,
  recognizedText: '',
  errorMessage: null,
};

const initialAudioJob: AudioTranscriptionJob = {
  source: null,
  status: 'idle',
  progress: 0,
  transcript: '',
  errorMessage: null,
};

function buildSource(file: File): ExtractionSource {
  return {
    fileName: file.name,
    fileType: file.type || 'image',
    fileSize: file.size,
    createdAt: new Date().toISOString(),
  };
}

function slugifyFileName(value: string): string {
  return (
    value
      .trim()
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase() || 'knowledge-note'
  );
}

function getSourceTypeLabel(source: ExtractionSource | null): string {
  if (!source) {
    return '等待素材';
  }

  if (source.fileType.startsWith('audio')) {
    return '音频';
  }

  if (source.fileType.startsWith('video')) {
    return '视频';
  }

  return '图片';
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function App() {
  const [currentImageFile, setCurrentImageFile] = useState<File | null>(null);
  const [currentMediaFile, setCurrentMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [source, setSource] = useState<ExtractionSource | null>(null);
  const [job, setJob] = useState<OcrJob>(initialJob);
  const [audioJob, setAudioJob] = useState<AudioTranscriptionJob>(initialAudioJob);
  const [transcriptionEngine, setTranscriptionEngine] = useState<TranscriptionEngine>('backend');
  const [mediaMode, setMediaMode] = useState<MediaTranscriptionMode>('safe');
  const [ocrMode, setOcrMode] = useState<OcrMode>('document');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('未命名知识摘录');
  const [summary, setSummary] = useState('');
  const [keywordsDraft, setKeywordsDraft] = useState('');
  const [questionsDraft, setQuestionsDraft] = useState('');
  const [history, setHistory] = useState<ExtractionHistoryItem[]>(() => loadHistory());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return () => {
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const note = useMemo<KnowledgeNote>(() => {
    const extractedAt = source ? new Date(source.createdAt).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN');
    const baseNote = {
      title,
      sourceType: source?.fileType || 'image',
      extractedAt,
      originalText: text,
      summary,
      keywords: splitLines(keywordsDraft.replace(/，/g, '\n').replace(/,/g, '\n')),
      questions: splitLines(questionsDraft),
    };

    return {
      ...baseNote,
      markdown: buildMarkdownNote(baseNote),
    };
  }, [keywordsDraft, questionsDraft, source, summary, text, title]);

  const textStats = useMemo(() => {
    const normalizedText = text.trim();
    return {
      characters: normalizedText.length,
      lines: normalizedText ? normalizedText.split(/\r?\n/).filter(Boolean).length : 0,
    };
  }, [text]);

  const workflowSteps = [
    {
      label: '导入素材',
      detail: source ? getSourceTypeLabel(source) : '图片、音频或视频',
      active: Boolean(source),
    },
    {
      label: '识别转写',
      detail:
        job.status === 'completed' || audioJob.status === 'completed'
          ? '已生成文本'
          : job.status === 'loading' || job.status === 'recognizing' || audioJob.status !== 'idle'
            ? '处理中'
            : '等待开始',
      active: job.status === 'completed' || audioJob.status === 'completed',
    },
    {
      label: '校对整理',
      detail: textStats.characters > 0 ? `${textStats.characters} 字符` : '等待文本',
      active: textStats.characters > 0,
    },
    {
      label: '导出入库',
      detail: 'Obsidian Markdown',
      active: textStats.characters > 0,
    },
  ];

  async function handleFileSelect(file: File) {
    const nextSource = buildSource(file);
    const nextPreviewUrl = await fileToDataUrl(file);

    setCurrentImageFile(file);
    setCurrentMediaFile(null);
    setPreviewUrl(nextPreviewUrl);
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }
    setMediaUrl('');
    setSource(nextSource);
    setTitle(fileNameToTitle(file.name) || '未命名知识摘录');
    setText('');
    setSummary('');
    setKeywordsDraft('');
    setQuestionsDraft('');
    setCopied(false);
    setJob({
      source: nextSource,
      status: 'idle',
      progress: 0,
      recognizedText: '',
      errorMessage: null,
    });
    setAudioJob(initialAudioJob);
  }

  function handleMediaFileSelect(file: File) {
    const nextSource = buildSource(file);
    const nextMediaUrl = URL.createObjectURL(file);

    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }

    setCurrentMediaFile(file);
    setCurrentImageFile(null);
    setMediaUrl(nextMediaUrl);
    setPreviewUrl('');
    setSource(nextSource);
    setTitle(fileNameToTitle(file.name) || '未命名音频摘录');
    setText('');
    setSummary('');
    setKeywordsDraft('');
    setQuestionsDraft('');
    setCopied(false);
    setJob(initialJob);
    setAudioJob({
      source: nextSource,
      status: 'idle',
      progress: 0,
      transcript: '',
      errorMessage: null,
    });
  }

  async function handleRunOcr() {
    if (!currentImageFile || !source) {
      return;
    }

    setJob((current) => ({
      ...current,
      status: 'loading',
      progress: 0,
      errorMessage: null,
    }));

    try {
      const recognizedText = await recognizeImage(currentImageFile, ocrMode, (progress) => {
        setJob((current) => ({ ...current, progress }));
      });

      setText(recognizedText);
      setJob({
        source,
        status: 'completed',
        progress: 100,
        recognizedText,
        errorMessage: null,
      });
    } catch (error) {
      setJob((current) => ({
        ...current,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'OCR 识别失败',
      }));
    }
  }

  async function handleTranscribeMedia() {
    if (!currentMediaFile || !source) {
      return;
    }

    setAudioJob((current) => ({
      ...current,
      status: 'loadingModel',
      progress: 0,
      errorMessage: null,
    }));

    try {
      const handleProgress = (progress: number, message?: string) => {
        setAudioJob((current) => ({
          ...current,
          status:
            transcriptionEngine === 'backend'
              ? progress < 20
                ? 'loadingModel'
                : 'transcribing'
              : progress < 45
                ? 'loadingModel'
                : progress < 62
                  ? 'decoding'
                  : 'transcribing',
          progress,
          errorMessage: message || null,
        }));
      };

      const transcript =
        transcriptionEngine === 'backend'
          ? await transcribeWithLocalBackend(currentMediaFile, handleProgress)
          : await transcribeAudio(currentMediaFile, mediaMode, handleProgress);

      setText(transcript);
      setAudioJob({
        source,
        status: 'completed',
        progress: 100,
        transcript,
        errorMessage: null,
      });
    } catch (error) {
      setAudioJob((current) => ({
        ...current,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '音频转写失败',
      }));
    }
  }

  async function handleCopyMarkdown() {
    await copyText(note.markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function handleDownloadMarkdown() {
    const blob = new Blob([note.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slugifyFileName(note.title)}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function handleSaveHistory() {
    if (!source) {
      return;
    }

    const now = new Date().toISOString();
    const item: ExtractionHistoryItem = {
      id: `${source.fileName}-${source.createdAt}`,
      source,
      previewUrl,
      text,
      note,
      updatedAt: now,
    };

    setHistory((current) => upsertHistoryItem(current, item));
  }

  function handleRestore(item: ExtractionHistoryItem) {
    setCurrentImageFile(null);
    setCurrentMediaFile(null);
    setPreviewUrl(item.previewUrl);
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }
    setMediaUrl('');
    setSource(item.source);
    setText(item.text);
    setTitle(item.note.title);
    setSummary(item.note.summary);
    setKeywordsDraft(item.note.keywords.join(', '));
    setQuestionsDraft(item.note.questions.join('\n'));
    setCopied(false);
    setJob({
      source: item.source,
      status: 'completed',
      progress: 100,
      recognizedText: item.text,
      errorMessage: null,
    });
    setAudioJob(initialAudioJob);
  }

  return (
    <main className="min-h-screen bg-[#edf3ef] text-ink">
      <header className="border-b border-[#28392f] bg-[#17231d] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-1 text-sm text-[#dfe8df]">
              <ShieldCheck size={15} className="text-[#9cc79d]" aria-hidden="true" />
              本地优先 / 无需会员 / Obsidian Ready
            </div>
            <h1 className="text-3xl font-semibold tracking-normal text-white">Knowledge Extractor</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#c9d6cd]">
              把图片、音频和视频里的内容提取成可校对文本，并直接整理为 Obsidian Markdown 笔记。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:min-w-[560px]">
            <div className="rounded-md border border-white/20 bg-white/10 px-4 py-3">
              <div className="flex items-center gap-2 text-[#c9d6cd]">
                <Image size={15} aria-hidden="true" />
                图片 OCR
              </div>
              <strong className="mt-1 block text-lg text-white">可用</strong>
            </div>
            <div className="rounded-md border border-white/20 bg-white/10 px-4 py-3">
              <div className="flex items-center gap-2 text-[#c9d6cd]">
                <AudioLines size={15} aria-hidden="true" />
                媒体转写
              </div>
              <strong className="mt-1 block text-lg text-white">本地后端</strong>
            </div>
            <div className="rounded-md border border-white/20 bg-white/10 px-4 py-3">
              <div className="flex items-center gap-2 text-[#c9d6cd]">
                <BookOpenText size={15} aria-hidden="true" />
                历史记录
              </div>
              <strong className="mt-1 block text-lg text-white">{history.length}</strong>
            </div>
            <div className="rounded-md border border-white/20 bg-white/10 px-4 py-3">
              <div className="flex items-center gap-2 text-[#c9d6cd]">
                <FileText size={15} aria-hidden="true" />
                当前文本
              </div>
              <strong className="mt-1 block text-lg text-white">{textStats.characters}</strong>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6">
        <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
          <div className="grid gap-3 md:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <div
                key={step.label}
                className={`rounded-md border px-4 py-3 transition ${
                  step.active ? 'border-moss bg-[#f8fbf7]' : 'border-line bg-paper'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-500">Step {index + 1}</span>
                  <span className={`h-2 w-2 rounded-full ${step.active ? 'bg-moss' : 'bg-slate-300'}`} />
                </div>
                <div className="mt-2 text-sm font-semibold text-ink">{step.label}</div>
                <div className="mt-1 truncate text-xs text-slate-500">{step.detail}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
          <UploadPanel onFileSelect={handleFileSelect} />
          <AudioPanel
            mediaUrl={mediaUrl}
            source={currentMediaFile ? source : null}
            job={audioJob}
            engine={transcriptionEngine}
            onEngineChange={setTranscriptionEngine}
            mode={mediaMode}
            onModeChange={setMediaMode}
            onFileSelect={handleMediaFileSelect}
            onTranscribe={handleTranscribeMedia}
            canTranscribe={Boolean(currentMediaFile)}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <OcrPanel
            job={job}
            previewUrl={previewUrl}
            source={source}
            mode={ocrMode}
            onModeChange={setOcrMode}
            canRun={Boolean(currentImageFile)}
            onRunOcr={handleRunOcr}
          />
          <aside className="rounded-lg border border-line bg-white p-5 shadow-panel">
            <div className="flex items-center gap-2">
              <ListChecks size={18} className="text-moss" aria-hidden="true" />
              <h2 className="text-base font-semibold text-ink">当前任务</h2>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <div className="text-xs font-medium text-slate-500">素材类型</div>
                <div className="mt-1 font-semibold text-ink">{getSourceTypeLabel(source)}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500">文件名</div>
                <div className="mt-1 break-all text-slate-700">{source?.fileName || '尚未选择素材'}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-paper px-3 py-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <FileText size={14} aria-hidden="true" />
                    字符
                  </div>
                  <div className="mt-1 text-lg font-semibold text-ink">{textStats.characters}</div>
                </div>
                <div className="rounded-md bg-paper px-3 py-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Database size={14} aria-hidden="true" />
                    行数
                  </div>
                  <div className="mt-1 text-lg font-semibold text-ink">{textStats.lines}</div>
                </div>
              </div>
              <div className="rounded-md border border-line bg-[#fffaf4] px-3 py-3 text-xs leading-5 text-slate-600">
                推荐流程：先完成识别或转写，再在文本区修正明显错误，最后补摘要、关键词和待整理问题。
              </div>
              <div className="flex items-center gap-2 rounded-md bg-paper px-3 py-3 text-xs text-slate-600">
                <Laptop size={15} className="text-rust" aria-hidden="true" />
                所有历史记录保存在当前浏览器 LocalStorage。
              </div>
            </div>
          </aside>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <TextEditor value={text} onChange={setText} />
          <MarkdownPanel
            note={note}
            summary={summary}
            keywordsDraft={keywordsDraft}
            questionsDraft={questionsDraft}
            copied={copied}
            onTitleChange={setTitle}
            onSummaryChange={setSummary}
            onKeywordsChange={setKeywordsDraft}
            onQuestionsChange={setQuestionsDraft}
            onCopy={handleCopyMarkdown}
            onDownload={handleDownloadMarkdown}
            onSave={handleSaveHistory}
          />
        </div>
        <HistoryPanel items={history} onRestore={handleRestore} />
      </div>
    </main>
  );
}

export default App;
