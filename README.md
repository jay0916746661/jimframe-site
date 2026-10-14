# Jim Lin Photography

台北舞蹈與活動攝影 Jim Lin（[@jimframe](https://www.instagram.com/jimframe/)）的活動相簿，GitHub Pages 靜態版本。

- 照片直接從公開的 Google Drive 相簿載入
- 看相簿、調色、下載、分享
- 人臉搜尋、統計與 IG 素材工作室在主站提供

## Repo 結構（Claude 與 Codex 共用）

| 位置 | 內容 | 上線在哪 |
|---|---|---|
| `index.html` | GitHub Pages 靜態版 | GitHub Pages |
| `site-source/` | 主站完整程式（vinext／Next、API、人臉搜尋、IG 素材工作室），2026-10-14 從 ChatGPT Sites 匯出 | https://jimframe.jay0916746661.chatgpt.site/ |
| `tasks/` | 任務板：Claude 寫任務 → Codex 實作開 PR → Claude 審查 → Jim 合併 | — |

規則：兩邊都從 `main` 拉最新、開分支做、PR 合回 `main`。主站程式只改 `site-source/`，改完要記得同步回 ChatGPT Sites 那邊上線。
