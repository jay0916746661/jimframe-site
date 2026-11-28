"""呼叫 Gemini API 的共用小工具（只用 Python 內建套件）。

金鑰：環境變數 GEMINI_API_KEY（放 GitHub Secrets，Jim 自己貼，程式不會印出來）。
模型：環境變數 GEMINI_MODEL；沒填就用 gemini-flash-latest。
      模型被 Google 改名或下架（回 404）時，會自動列出目前可用的模型，挑最新的 flash 版本重試。
查證：search=True 時開 Google 搜尋接地（grounding），回傳真的網址當出處；
      免費額度不支援時會自動改成不搜尋再試一次，並在結果標註。
"""
import json
import os
import re
import time
import urllib.error
import urllib.request

BASE = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_MODEL = "gemini-flash-latest"


class GeminiError(RuntimeError):
    pass


def _key():
    k = (os.environ.get("GEMINI_API_KEY") or "").strip()
    if not k:
        raise GeminiError("沒有 GEMINI_API_KEY。請到 GitHub → Settings → Secrets and variables → Actions 新增。")
    return k


def _req(method, path, body=None, timeout=180):
    req = urllib.request.Request(
        f"{BASE}/{path}", method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json", "x-goog-api-key": _key()},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", "replace")[:500]
        raise GeminiError(f"HTTP {e.code}：{msg}") from None


def pick_model(prefer="flash"):
    """列出可用模型，挑名稱含 prefer、支援 generateContent、版本號最大的那個。"""
    data = _req("GET", "models?pageSize=200")
    names = []
    for m in data.get("models", []):
        n = m.get("name", "").removeprefix("models/")
        if "generateContent" not in m.get("supportedGenerationMethods", []):
            continue
        if prefer in n and not re.search(r"(tts|image|audio|live|embedding|lite|preview-tts|thinking-exp)", n):
            names.append(n)
    if not names:
        raise GeminiError("找不到可用的 Gemini 模型")

    def ver(n):
        nums = re.findall(r"\d+(?:\.\d+)?", n)
        return (float(nums[0]) if nums else 0, "preview" not in n and "exp" not in n, n)

    return sorted(names, key=ver)[-1]


def generate(prompt, system="", model=None, search=False, temperature=0.8, retries=3):
    """回傳 (文字, 出處清單[(title, url)], 實際用的模型, 備註)。"""
    model = (model or os.environ.get("GEMINI_MODEL") or DEFAULT_MODEL).strip()
    note = []
    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": temperature},
    }
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}
    use_search = search
    tried_pick = False
    for attempt in range(retries + 2):
        b = dict(body)
        if use_search:
            b["tools"] = [{"google_search": {}}]
        try:
            data = _req("POST", f"models/{model}:generateContent", b)
        except GeminiError as e:
            s = str(e)
            if "HTTP 404" in s and not tried_pick:
                tried_pick = True
                new = pick_model("pro" if "pro" in model else "flash")
                note.append(f"模型 {model} 不存在，自動改用 {new}")
                model = new
                continue
            if use_search and ("HTTP 400" in s or "HTTP 403" in s) and ("search" in s.lower() or "tool" in s.lower() or "grounding" in s.lower()):
                use_search = False
                note.append("這個金鑰／模型不能開 Google 搜尋查證，改成不搜尋（出處請人工補）")
                continue
            if ("HTTP 429" in s or "HTTP 500" in s or "HTTP 503" in s) and attempt < retries:
                time.sleep(20 * (attempt + 1))
                continue
            raise
        cands = data.get("candidates") or []
        if not cands:
            raise GeminiError(f"Gemini 沒有回內容：{json.dumps(data, ensure_ascii=False)[:300]}")
        parts = cands[0].get("content", {}).get("parts", [])
        text = "".join(p.get("text", "") for p in parts).strip()
        srcs = []
        gm = cands[0].get("groundingMetadata") or {}
        for ch in gm.get("groundingChunks", []) or []:
            w = ch.get("web") or {}
            if w.get("uri"):
                srcs.append((w.get("title") or w["uri"], w["uri"]))
        return text, srcs, model, note
    raise GeminiError("重試多次仍失敗")
