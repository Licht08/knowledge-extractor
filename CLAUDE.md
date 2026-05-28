# Knowledge Extractor 项目规则

## 项目定位

这是一个面向个人知识库构建的本地优先文本提取工具。当前版本支持图片 OCR、音频/视频统一媒体转文本、文本校对和 Obsidian Markdown 导出。本地 Python 后端用 `faster-whisper` 提升媒体转写速度。

## 目录结构

- `src/components/`：通用 UI 组件，只放不绑定业务数据来源的组件。
- `src/features/`：业务功能模块，例如上传、OCR、Markdown、历史记录。
- `src/data/`：示例数据、LocalStorage 读写和数据持久化。
- `src/types/`：项目核心类型定义。
- `src/utils/`：纯工具函数，例如 Markdown 生成、文件格式化。
- `src/assets/`：静态资源。没有明确用途时不要提前创建素材。
- `backend/`：本地 Python 后端，只放本机转写服务、依赖说明和启动脚本。
- `backend/app/`：FastAPI 应用代码。

## 命名规则

- React 组件使用 PascalCase，例如 `UploadPanel.tsx`。
- TypeScript 类型使用 PascalCase，例如 `KnowledgeNote`。
- 工具函数使用 camelCase，例如 `buildMarkdownNote`。
- LocalStorage key 必须使用 `knowledge-extractor:` 前缀。
- UI 文案默认中文，代码、命令、变量名使用英文。

## 当前边界

- 图片 OCR 支持 PNG、JPG、JPEG、WEBP。
- OCR 使用浏览器侧 `tesseract.js`，不依赖全局 `tesseract` 命令。
- 支持媒体转文本：MP3、WAV、M4A、WEBM、OGG，以及浏览器可解码音轨的 MP4/WEBM 视频。
- 媒体转文本默认调用本地后端：`http://127.0.0.1:8765/api/transcribe`。
- 本地后端使用 `faster-whisper`，模型默认 `base`，CPU `int8`。
- 浏览器侧 Transformers.js + Whisper 保留为备用路线，但不适合作为长媒体主方案。
- 不写 `.env`，不接 OpenAI、百度、讯飞等云 API。
- 不安装全局依赖；Python 依赖必须安装在项目本地虚拟环境。
- 不做登录、数据库、部署和公开发布。

## 验证命令

每次完成改动后至少运行：

```bash
npm run build
```

后端代码至少运行：

```bash
python -m compileall backend
```

如果后续添加 lint 脚本，也必须运行：

```bash
npm run lint
```

## 红线

以下操作必须先问用户：

- 修改 `.env`、密钥、token、CI/CD 配置。
- 数据库 schema 变更或数据迁移。
- `git push`、`git rebase`、`git reset --hard`、强制推送。
- 安装新的全局依赖或修改系统配置。
- 部署、公开发布、npm publish。

## 删除规则

禁止批量删除文件或目录。不要使用：

- `del /s`
- `rd /s`
- `rmdir /s`
- `Remove-Item -Recurse`
- `rm -rf`

需要删除文件时，只能一次删除一个明确路径的文件。
