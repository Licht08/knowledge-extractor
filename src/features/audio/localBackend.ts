type ProgressHandler = (progress: number, message?: string) => void;

type BackendTranscriptionResponse = {
  text?: string;
  detail?: string;
  duration?: number;
  language?: string;
  model_size?: string;
};

const BACKEND_URLS = ['http://127.0.0.1:8765', 'http://localhost:8765'];

async function findAvailableBackend(): Promise<string | null> {
  for (const url of BACKEND_URLS) {
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) {
        return url;
      }
    } catch {
      // Try the next localhost alias.
    }
  }

  return null;
}

export async function checkLocalBackend(): Promise<boolean> {
  return (await findAvailableBackend()) !== null;
}

export async function transcribeWithLocalBackend(file: File, onProgress: ProgressHandler): Promise<string> {
  onProgress(5, '正在连接本地后端');

  const backendUrl = await findAvailableBackend();
  if (!backendUrl) {
    throw new Error('本地后端未启动。请先运行 backend/run.ps1，或在转写引擎里切换到浏览器备用。');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('model_size', 'base');
  formData.append('language', 'zh');

  onProgress(20, '正在上传媒体到本地后端');
  const response = await fetch(`${backendUrl}/api/transcribe`, {
    method: 'POST',
    body: formData,
  });

  onProgress(88, '正在接收转写结果');
  const data = (await response.json()) as BackendTranscriptionResponse;

  if (!response.ok) {
    throw new Error(data.detail || '本地后端转写失败');
  }

  onProgress(100, '转写完成');
  return (data.text || '').trim();
}
