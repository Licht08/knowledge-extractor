from __future__ import annotations

import os
import ssl
import tempfile
from functools import lru_cache
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

ALLOWED_MODEL_SIZES = {"tiny", "base", "small", "medium"}
DEFAULT_MODEL_SIZE = "base"
PROJECT_ROOT = Path(__file__).resolve().parents[2]
LOCAL_MODEL_ROOT = PROJECT_ROOT / "backend" / "models"

app = FastAPI(title="Knowledge Extractor Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@lru_cache(maxsize=4)
def get_model(model_size: str) -> WhisperModel:
    model_path = resolve_model_path(model_size)
    return WhisperModel(str(model_path), device="cpu", compute_type="int8")


def resolve_model_path(model_size: str) -> str | Path:
    local_path = LOCAL_MODEL_ROOT / f"faster-whisper-{model_size}"
    if local_path.exists():
        return local_path

    return model_size


def normalize_model_size(model_size: str) -> str:
    normalized = model_size.strip().lower()
    if normalized not in ALLOWED_MODEL_SIZES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported model_size '{model_size}'. Use one of: {', '.join(sorted(ALLOWED_MODEL_SIZES))}.",
        )
    return normalized


def write_upload_to_temp(file: UploadFile) -> Path:
    suffix = Path(file.filename or "media").suffix or ".media"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        while chunk := file.file.read(1024 * 1024):
            temp_file.write(chunk)
        return Path(temp_file.name)


def to_user_facing_error(error: Exception) -> str:
    message = str(error)
    is_model_download_error = (
        isinstance(error, ssl.SSLError)
        or "UNEXPECTED_EOF_WHILE_READING" in message
        or "locate the files on the Hub" in message
        or "huggingface.co" in message
        or "snapshot folder" in message
    )

    if is_model_download_error:
        return (
            "本地后端已启动，但首次转写需要下载 faster-whisper 模型。"
            "当前网络无法从 Hugging Face 完成下载。"
            "请按 backend/README.md 的“模型下载失败”部分处理："
            "要么临时设置 HF_ENDPOINT 后重启后端，要么把模型手动放到 backend/models/faster-whisper-base。"
        )

    return message


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def root() -> dict[str, object]:
    return {
        "name": "Knowledge Extractor Backend",
        "status": "running",
        "endpoints": {
            "health": "/api/health",
            "transcribe": "/api/transcribe",
        },
    }


@app.post("/api/transcribe")
def transcribe(
    file: Annotated[UploadFile, File()],
    model_size: Annotated[str, Form()] = DEFAULT_MODEL_SIZE,
    language: Annotated[str, Form()] = "zh",
) -> dict[str, object]:
    model_name = normalize_model_size(model_size)
    temp_path = write_upload_to_temp(file)

    try:
        model = get_model(model_name)
        segments, info = model.transcribe(
            str(temp_path),
            language=language or None,
            vad_filter=True,
            beam_size=5,
        )
        text = "\n".join(segment.text.strip() for segment in segments if segment.text.strip())

        return {
            "text": text,
            "language": info.language,
            "language_probability": info.language_probability,
            "duration": info.duration,
            "model_size": model_name,
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=to_user_facing_error(error)) from error
    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass
