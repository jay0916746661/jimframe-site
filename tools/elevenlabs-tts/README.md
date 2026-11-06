# ElevenLabs TTS（手動）

GitHub → Actions →「ElevenLabs TTS（手動）」→ Run workflow。  
輸入文字後，這次執行會呼叫 ElevenLabs，把 mp3 放進 artifact `elevenlabs-tts-mp3`。下載來聽即可。

這個流程**不會**發 FB、IG、Threads，也**不會**把 mp3 commit 回 repo。

## 執行前要放的 Secret

Repo → Settings → Secrets and variables → Actions：

| Secret | 要不要 |
|---|---|
| `ELEVENLABS_API_KEY` | 必填 |
| `ELEVENLABS_VOICE_ID` | 選填。沒填的話，每次 Run workflow 都要自己貼 voice_id |

怎麼拿：

1. 登入 [elevenlabs.io](https://elevenlabs.io) → **Developers → API Keys**，建立一把金鑰（只顯示一次）。建議只開 Text to Speech，並設 credit 上限。
2. **My Voices** → 要使用的聲音 → **Copy voice ID**。

## Run workflow 的欄位

- `text`：要念的文字。必填。
- `voice_id`：空白就用 Secret `ELEVENLABS_VOICE_ID`。
- `model_id`：空白就用 `eleven_multilingual_v2`。

**每次成功產生語音都會消耗 ElevenLabs credits**（大約依字數計）。金鑰不會印在 log。

產出的 mp3 是你的聲紋。**不要拿去訓練別人的模型。**

## 本機

跟 Actions 同一支程式。`--dry-run` 只檢查參數，不呼叫 API、不扣 credits。

```bash
pip install requests
export ELEVENLABS_API_KEY=你的金鑰
export ELEVENLABS_VOICE_ID=你的_voice_id
python3 tools/elevenlabs-tts/tts.py --text "你好，這是測試。" --dry-run
```

真的要出檔時拿掉 `--dry-run`。檔案寫到 `tools/elevenlabs-tts/out/`，這個目錄已在 `.gitignore`。
