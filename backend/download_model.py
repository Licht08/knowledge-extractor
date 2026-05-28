from __future__ import annotations

import argparse
import os
from pathlib import Path

from huggingface_hub import snapshot_download

MODEL_REPOS = {
    "tiny": "Systran/faster-whisper-tiny",
    "base": "Systran/faster-whisper-base",
    "small": "Systran/faster-whisper-small",
    "medium": "Systran/faster-whisper-medium",
}

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_ROOT = PROJECT_ROOT / "backend" / "models"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Download faster-whisper models for local use.")
    parser.add_argument("--model", choices=sorted(MODEL_REPOS), default="base")
    parser.add_argument("--mirror", default="", help="Optional Hugging Face endpoint, e.g. https://hf-mirror.com")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    repo_id = MODEL_REPOS[args.model]
    target_dir = MODEL_ROOT / f"faster-whisper-{args.model}"

    if args.mirror:
        os.environ["HF_ENDPOINT"] = args.mirror

    target_dir.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {repo_id} to {target_dir}")
    if args.mirror:
        print(f"Using mirror: {args.mirror}")

    snapshot_download(
        repo_id=repo_id,
        local_dir=target_dir,
        local_dir_use_symlinks=False,
        resume_download=True,
    )
    print("Model download complete.")


if __name__ == "__main__":
    main()
