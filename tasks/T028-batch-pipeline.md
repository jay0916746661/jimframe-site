---
id: T028
title: 批次出片與排程流程（一次跑完一整批）
status: backlog
size: M
---

## 為什麼
Jim 的 Claude 訂閱 12/13 可能降級或停掉，之後要靠現有庫存撐三到六個月。
目標是 23 天內補出 171 集。

目前每一集的出片與排程都要人在對話裡一步步推，等於產能被 AI 訂閱綁住。
把流程寫成一支可以餵清單、批次跑完的程式之後，出片與排程就在 GitHub Actions 上跑，
**完全不消耗任何 AI 的用量**，產能不再受訂閱限制。這是這波最大的槓桿。

## 要做什麼
新增 `tools/batch-produce/`，讀一份清單、一次跑完整批。

1. **輸入**：`tools/batch-produce/batch.csv`，一列一集，欄位：
   `channel, ep, title, tts_text, carousel_text, media_hint, publish_date`
   - `tts_text` 是純口白，`carousel_text` 是輪播文字（用 `|` 分頁）
   - `media_hint` 是照片關鍵字或 `program`（程式動畫）

2. **流程**，每一集依序：
   - 呼叫既有的 `tools/elevenlabs-tts/tts.py` 配音（模型固定 eleven_v4）
   - 語音辨識對時，產生字幕時間軸（沿用既有做法）
   - 取素材：`media_hint` 有關鍵字就抓 Wikimedia Commons（**慢速、每次之間至少 3 秒，遇 429 要退避重試，失敗就跳過該集並記錄**）；是 `program` 就跑程式動畫
   - 渲染 1080×1920、30fps、CRF 20、上限 5 Mbps、25MB 以內
   - 輸出兩版：配音配樂版、人聲音效版
   - 產生輪播圖 1080×1350
   - 把四列（IG 輪播／IG Reel／Threads 輪播／Threads Reel）寫進兩個佇列 csv

3. **容錯**（這點最重要，因為之後可能沒有人盯）
   - 任何一集失敗都不中斷整批，記進 `tools/batch-produce/report.md`，繼續下一集
   - 可以重跑：已經完成的集數跳過，用 `channel+ep` 判斷
   - 結束時印出：成功幾集、失敗幾集、各自是哪幾集、用掉多少 ElevenLabs 點數

4. **GitHub Actions**：新增 `.github/workflows/batch-produce.yml`，`workflow_dispatch`
   觸發，輸入是 batch.csv 的路徑。跑完把成品與更新後的佇列 commit 回 main。

## 驗收標準
- [ ] 用一份只有 3 集的 batch.csv 跑完，產出 6 支影片（兩版）、3 組輪播圖、佇列多 12 列
- [ ] 故意讓其中一集的素材抓取失敗，整批不中斷，report.md 有記錄
- [ ] 同一份 batch.csv 重跑一次，已完成的集數被跳過
- [ ] 輸出的影片符合 1080×1920、CRF 20、25MB 以內
- [ ] Actions 上可以手動觸發並跑完
- [ ] `node scripts/smoke.mjs` 通過

## 不要動
- 既有的 `tools/meta-poster/`、`tools/threads-poster/` 發文邏輯，只能往佇列追加列
- `tools/elevenlabs-tts/tts.py` 的介面
- `photos/`、`videos/`
- 不要新增 secret；ElevenLabs 與 Meta 的金鑰沿用現有的

## 實作紀錄
（Codex 完成後填寫）
