# Knowledge Extractor Backend

本地媒体转写后端，用 `faster-whisper` 在本机处理音频和视频，不需要 API key。

## 安装

建议使用项目内虚拟环境：

```powershell
cd "D:\codex\第一个项目"
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

## 启动

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8765
```

启动后前端会调用：

```text
http://127.0.0.1:8765/api/transcribe
```

## 说明

- 默认模型：`base`
- 默认语言：中文
- 默认设备：CPU
- 默认计算类型：`int8`
- 首次运行会下载 Whisper 模型到本机缓存。
- 不需要 `.env`，不接云 API。

## 模型下载失败

如果首次转写时报类似错误：

```text
SSL: UNEXPECTED_EOF_WHILE_READING
An error happened while trying to locate the files on the Hub
```

说明后端已启动，但模型没有从 Hugging Face 下载成功。可以选一种方式处理。

### 方式一：临时设置镜像后重启后端

先下载模型：

```powershell
.\.venv\Scripts\python.exe backend\download_model.py --model base --mirror https://hf-mirror.com
```

下载成功后启动后端：

```powershell
.\backend\run.ps1
```

如果你希望启动时也带镜像环境变量：

```powershell
.\backend\run.ps1 -UseMirror
```

这些设置只对当前 PowerShell 窗口生效，不会写入 `.env`。

### 方式二：手动放置本地模型

把 faster-whisper 模型放到：

```text
backend\models\faster-whisper-base
```

后端会优先读取这个目录；如果目录不存在，才会尝试联网下载模型。
