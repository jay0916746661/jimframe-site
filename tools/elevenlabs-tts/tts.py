"""手動把文字轉成 mp3（ElevenLabs Text to Speech）。

金鑰只從環境變數 ELEVENLABS_API_KEY 讀，放在請求標頭 xi-api-key。
不寫進檔案、不印出來。voice_id 的順序是：
  --voice-id、環境變數 TTS_VOICE_ID、最後才是 ELEVENLABS_VOICE_ID。
model_id 的順序是：--model-id、TTS_MODEL_ID、預設 eleven_multilingual_v2。

這支程式不發 FB／IG／Threads。mp3 只寫到你指定的路徑（Actions 另存 artifact），
不要 commit，也不要拿去訓練別人的模型。成功呼叫會消耗 ElevenLabs credits。

  python tts.py --text "你好" --dry-run
  python tts.py --text "你好" --out out/speech.mp3
"""
import argparse
import json
import os
import re
import sys
from pathlib import Path

import requests

API_ROOT = "https://api.elevenlabs.io/v1/text-to-speech"
OUTPUT_FORMAT = "mp3_44100_128"
DEFAULT_MODEL = "eleven_multilingual_v2"
TIMEOUT = 120
VOICE_RE = re.compile(r"^[A-Za-z0-9_-]{1,128}$")
MODEL_RE = re.compile(r"^[A-Za-z0-9._-]{1,80}$")
KEY_RE = re.compile(r"sk_[A-Za-z0-9]{8,}")


def nonempty(*values):
    for value in values:
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return ""


def looks_like_key(value):
    return bool(value) and (value.startswith("sk_") or KEY_RE.search(value) is not None)


def scrub(message, secrets):
    text = str(message)
    for secret in secrets:
        if secret:
            text = text.replace(str(secret), "***")
    text = KEY_RE.sub("sk_***", text)
    text = re.sub(r"(xi-api-key[\"']?\s*[:=]\s*)\S+", r"\1***", text, flags=re.I)
    return text


def error_detail(response):
    raw = response.content[:500]
    try:
        body = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError):
        return raw.decode("utf-8", "replace")[:300]
    detail = body.get("detail") if isinstance(body, dict) else body
    if isinstance(detail, dict):
        parts = [str(detail.get("status") or ""), str(detail.get("message") or detail.get("type") or "")]
        joined = " ".join(part for part in parts if part).strip()
        return joined or str(detail)[:300]
    if isinstance(detail, list):
        bits = []
        for item in detail[:3]:
            if isinstance(item, dict):
                bits.append(str(item.get("msg") or item.get("message") or item)[:200])
            else:
                bits.append(str(item)[:200])
        return "; ".join(bits)
    return str(detail)[:300]


def looks_like_audio(content, content_type):
    if not content:
        return False
    ctype = (content_type or "").split(";")[0].strip().lower()
    if ctype.startswith("text/") or ctype.endswith("json") or ctype in ("application/json", "application/problem+json"):
        return False
    if content.lstrip()[:1] in (b"{", b"["):
        return False
    return ctype.startswith("audio/") or ctype in ("application/octet-stream", "")


def synthesize(text, voice_id, model_id, api_key, post=None):
    """POST /v1/text-to-speech/{voice_id}，回傳 mp3 bytes。post 可替換，測試時不連網。"""
    post = post or requests.post
    response = post(
        f"{API_ROOT}/{voice_id}",
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
        },
        params={"output_format": OUTPUT_FORMAT},
        json={"text": text, "model_id": model_id},
        timeout=TIMEOUT,
        allow_redirects=False,
    )
    secrets = (api_key,)
    if response.status_code != 200:
        detail = scrub(error_detail(response), secrets)
        hint = ""
        if response.status_code in (301, 302, 303, 307, 308):
            detail = f"重新導向 HTTP {response.status_code}"
        elif response.status_code == 401:
            hint = "（請檢查 Secret ELEVENLABS_API_KEY）"
        elif response.status_code == 429:
            hint = "（可能是 credits 用完，或同時請求太多）"
        raise RuntimeError(scrub(f"HTTP {response.status_code} {detail}{hint}".strip(), secrets))
    content_type = ""
    headers = getattr(response, "headers", {}) or {}
    if hasattr(headers, "get"):
        content_type = headers.get("Content-Type", "") or ""
    if not looks_like_audio(response.content, content_type):
        detail = scrub(error_detail(response), secrets)
        raise RuntimeError(scrub(f"API 沒有回傳 mp3：{detail or content_type or '空內容'}", secrets))
    return response.content


def parse_args(argv):
    parser = argparse.ArgumentParser(description="把文字轉成 mp3（ElevenLabs）。成功呼叫會消耗 credits。")
    parser.add_argument("--text", default=None, help="要轉語音的文字；空白則用環境變數 TTS_TEXT")
    parser.add_argument("--voice-id", default=None, help="覆寫 voice_id；空白則用 TTS_VOICE_ID 或 ELEVENLABS_VOICE_ID")
    parser.add_argument("--model-id", default=None, help=f"覆寫 model_id；空白則用 TTS_MODEL_ID，再沒有就用 {DEFAULT_MODEL}")
    parser.add_argument("--out", default="", help="mp3 路徑（預設本目錄 out/speech.mp3）")
    parser.add_argument("--dry-run", action="store_true", help="只檢查參數，不呼叫 API、不扣 credits")
    return parser.parse_args(argv)


def resolve_settings(args, env):
    text = nonempty(args.text, env.get("TTS_TEXT"))
    voice_id = nonempty(args.voice_id, env.get("TTS_VOICE_ID"), env.get("ELEVENLABS_VOICE_ID"))
    model_id = nonempty(args.model_id, env.get("TTS_MODEL_ID")) or DEFAULT_MODEL
    api_key = nonempty(env.get("ELEVENLABS_API_KEY"))
    return text, voice_id, model_id, api_key


def default_out():
    return Path(__file__).resolve().parent / "out" / "speech.mp3"


def main(argv=None, post=None, env=None):
    args = parse_args(argv)
    environ = os.environ if env is None else env
    text, voice_id, model_id, api_key = resolve_settings(args, environ)
    out = Path(args.out).expanduser() if nonempty(args.out) else default_out()
    secrets = (api_key,)

    if not text:
        print("缺少文字。請在 workflow 的 text 輸入，或加上 --text。", file=sys.stderr)
        return 1
    if not voice_id:
        print("缺少 voice_id。請輸入 voice_id，或設定 Secret ELEVENLABS_VOICE_ID。", file=sys.stderr)
        return 1
    if looks_like_key(voice_id) or (api_key and voice_id == api_key):
        print("voice_id 看起來像 API 金鑰。請改填 My Voices 的 voice ID，金鑰只放 Secret。", file=sys.stderr)
        return 1
    if not VOICE_RE.fullmatch(voice_id):
        print("voice_id 格式不對。請從 ElevenLabs → My Voices → Copy voice ID 複製。", file=sys.stderr)
        return 1
    if looks_like_key(model_id) or (api_key and model_id == api_key):
        print("model_id 看起來像 API 金鑰。", file=sys.stderr)
        return 1
    if not MODEL_RE.fullmatch(model_id):
        print("model_id 格式不對。", file=sys.stderr)
        return 1
    if out.suffix.lower() != ".mp3":
        print("輸出路徑必須是 .mp3。", file=sys.stderr)
        return 1
    if not args.dry_run and not api_key:
        print("缺少 ELEVENLABS_API_KEY。請在 repo Secrets 新增這把金鑰。", file=sys.stderr)
        return 1

    print(f"voice_id={voice_id}")
    print(f"model_id={model_id}")
    print(f"字數={len(text)}")
    print(scrub(f"輸出={out}", secrets))
    if args.dry_run:
        print("dry-run：沒有呼叫 ElevenLabs")
        return 0

    try:
        audio = synthesize(text, voice_id, model_id, api_key, post=post)
    except requests.RequestException as exc:
        print(scrub(f"連線失敗：{exc.__class__.__name__}", secrets), file=sys.stderr)
        return 1
    except RuntimeError as exc:
        print(scrub(str(exc), secrets), file=sys.stderr)
        return 1

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(audio)
    print(f"已寫入 {out.name}（{len(audio)} bytes）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
