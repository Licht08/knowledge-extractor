# Knowledge Extractor

> 本地优先的知识提取工具：从图片、音频和视频中提取文本，并整理成 Obsidian 可用的 Markdown 笔记。

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-local_backend-009688?logo=fastapi&logoColor=white)
![Local First](https://img.shields.io/badge/Local--first-no_cloud_api-4f6f52)

## 为什么做

我在构建个人知识库时，经常需要把截图、书页、PPT、课程视频和录音里的内容提取出来，再整理成 Obsidian 笔记。很多在线工具把 OCR、音视频转写、导出能力放在会员后面，也会把文件上传到第三方服务。

Knowledge Extractor 解决的是一个更具体的问题：把常见学习素材快速变成可继续整理的 Markdown 知识笔记。

## 功能

- 图片 OCR：支持 PNG、JPG、JPEG、WEBP。
- 图片预处理：普通图片、文档增强、黑白扫描三种模式。
- 媒体转写：支持 MP3、WAV、M4A、WEBM、OGG、MP4、MOV。
- 本地后端：默认使用 FastAPI + faster-whisper 在本机转写音视频。
- 浏览器备用：后端未启动时可使用浏览器 Whisper 备用模式处理短素材。
- 文本校对：识别结果进入编辑区，手动修正错字、断行和标点。
- Markdown Builder：生成 Obsidian 可用笔记。
- 导出能力：复制 Markdown、下载 `.md` 文件、保存历史记录。
- 本地存储：最近 12 条记录保存在 LocalStorage。

## 工作流

```text
上传图片/媒体
    -> OCR 识别或语音转写
    -> 手动校对文本
    -> 补充摘要、关键词、待整理问题
    -> 复制或下载 Obsidian Markdown
```

## 技术架构

```text
Frontend
  React + TypeScript + Vite + Tailwind CSS
  Tesseract.js for browser OCR
  Transformers.js as browser transcription fallback
  LocalStorage for history

Backend
  FastAPI
  faster-whisper
  local model cache under backend/models/
```

## 本地运行

安装前端依赖：

```bash
npm install
npm run dev
```

启动本地转写后端：

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8765
```

如果 Hugging Face 模型下载失败，可以使用项目内下载脚本：

```powershell
.\.venv\Scripts\python.exe backend\download_model.py --model base --mirror https://hf-mirror.com
.\backend\run.ps1
```

## 验证

```bash
npm run build
```

```powershell
.\.venv\Scripts\python.exe -m compileall backend
```

## Markdown 模板

导出的笔记包含：

- 标题
- 来源类型
- 提取时间
- 原文
- 摘要
- 关键词
- 待整理问题

示例：

```md
# 示例笔记

> 来源类型：image/png
> 提取时间：2026/5/28 20:00:00

## 原文

这里是 OCR 或转写后的文本。

## 摘要

待整理

## 关键词

知识管理, OCR

## 待整理问题

- 这段材料最值得追问的问题是什么？
```

## 项目边界

- 不接 OpenAI、百度、讯飞等云 API。
- 不写 `.env`，不处理 token。
- 不做登录、数据库、部署和公开发布逻辑。
- 媒体文件默认发送到本机 `127.0.0.1:8765` 后端处理，不上传到第三方服务。
- 长视频转写速度取决于 CPU、模型大小和本机性能。

## 参考项目

这个项目的展示方式和技术选择参考了这些成熟开源项目：

- [tesseract.js](https://github.com/naptha/tesseract.js)：清晰说明能力边界、安装方式和 OCR 使用方式。
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper)：用 benchmark、requirements、installation 解释技术选择。
- [whisper.cpp](https://github.com/ggml-org/whisper.cpp)：强调本地离线、性能、平台支持和 quick start。

## 路线图

- 增加更适合 Obsidian 的 frontmatter 和标签模板。
- 增加本地批量处理。
- 增加后端任务队列和更细的实时进度。
- 增加长视频切片转写和失败恢复。
- 补充项目截图和演示 GIF。

## License

MIT
