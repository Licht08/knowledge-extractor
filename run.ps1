param(
  [string]$HostAddress = "127.0.0.1",
  [int]$Port = 8765,
  [switch]$UseMirror
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Python = Join-Path $ProjectRoot ".venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
  Write-Error "未找到项目虚拟环境。请先运行: python -m venv .venv; .\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt"
  exit 1
}

if ($UseMirror) {
  $env:HF_ENDPOINT = "https://hf-mirror.com"
}

& $Python -m uvicorn backend.app.main:app --host $HostAddress --port $Port
