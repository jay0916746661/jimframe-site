# jimframe-site｜Jim 的總部 repo

> 📘 中文說明書（2026-11-28 整理）｜狀態：🟢 每天都在跑，**不要封存**
> 全部 29 個 repo 的總表：[docs/repo地圖與封存建議.md](docs/repo地圖與封存建議.md)
> 降級後怎麼讓它自己跑：**[docs/自動駕駛手冊.md](docs/自動駕駛手冊.md)**（先讀這份）

## 這是什麼
所有頻道的發文系統都在這裡：IG／Threads／FB 佇列 → GitHub Actions 定時用 Meta 官方 API 發出去。另外還有 ElevenLabs 配音、IG 數據與週報、庫存、系統健康日報、Gemini 寫稿、影片引擎、JimFrame 攝影網站和各頻道的舊網頁。

## 最常用的位置
| 位置 | 做什麼 |
|---|---|
| `tools/meta-poster/ig_queue.csv` | IG 發文佇列（一列一則；狀態「待發」才會發） |
| `tools/threads-poster/queue.csv` | Threads 發文佇列 |
| `social/media/<頻道>/` | 要發的影片與圖片（發出 2 天後自動刪） |
| `tools/watchdog/status.md` | 每天 08:13 更新的系統健康日報＋各頻道庫存 |
| `social/reports/週報_*.md` | 每週一 IG 週報 |
| `drafts/<頻道>/` | Gemini 寫好的草稿 |
| `tools/gemini-writer/channels/` | 各頻道寫稿規則（改這裡就能調整 Gemini 的寫法） |
| `tools/video-engine/` | 影片渲染引擎與製作 SOP |
| `.github/workflows/` | 13 個自動化（清單見自動駕駛手冊第 2 節） |

## 怎麼修
1. 收到 Issue〈🚨 系統需要處理〉→ 照 [自動駕駛手冊第 4 節](docs/自動駕駛手冊.md#4-壞了怎麼修) 的表處理。
2. 改佇列 CSV：一定用 QUOTE_ALL（每個欄位都有引號）；push 前先 `git pull`；**不要 `git add -A`**（10/18 曾因此刪掉 3,051 個檔）。
3. 不會改就交給 Antigravity，第一句貼：「先讀 README.md 和 docs/自動駕駛手冊.md，照裡面的規則做，回件給我檔案清單與不確定的地方。」
4. 權杖、金鑰只放 GitHub Secrets，永遠不要寫進檔案。

---

## 原本的 README（保留原文）

# Jim Lin Photography

台北舞蹈與活動攝影 Jim Lin（[@jimframe](https://www.instagram.com/jimframe/)）的活動相簿，GitHub Pages 靜態版本。

- 照片直接從公開的 Google Drive 相簿載入
- 看相簿、調色、下載、分享
- 人臉搜尋可使用原站唯讀索引；[IG 素材工作室](./studio/) 提供繁中／英文／韓文的限動、貼文、Reels 與文案
- 統計與資料庫仍由主站提供

## Repo 結構（Claude 與 Codex 共用）

| 位置 | 內容 | 上線在哪 |
|---|---|---|
| `index.html` | GitHub Pages 靜態版 | GitHub Pages |
| `site-source/` | 主站完整程式（vinext／Next、API、人臉搜尋、IG 素材工作室），2026-10-14 從 ChatGPT Sites 匯出 | https://jimframe.jay0916746661.chatgpt.site/ |
| `tasks/` | 任務板：Claude 寫任務 → Codex 實作開 PR → Claude 審查 → Jim 合併 | — |

規則：兩邊都從 `main` 拉最新、開分支做、PR 合回 `main`。主站程式只改 `site-source/`，改完要記得同步回 ChatGPT Sites 那邊上線。

## 粉專自動發文

Facebook 粉專的排程在 [`tools/meta-poster/`](tools/meta-poster/README.md)（IG 發文在同一資料夾，彼此獨立）。加一則貼文：編輯 `fb_queue.csv`，`account` 填粉專名稱或數字 ID，`publish_at` 用台北時間（`2026-11-05 15:00`），`type` 填 `text`、`link`、`photo`、`video` 或 `reel`，`media` 填 repo 裡的檔案路徑，`status` 改成 `待發`。檔案裡現有的列是 `範例`，不會發出去。
