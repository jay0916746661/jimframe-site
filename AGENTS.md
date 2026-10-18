# AGENTS.md — Jim Lin Photography（GitHub Pages 靜態版）

給 Codex 與其他 AI agent 的工作規則。Claude 負責寫任務與審查，你負責實作。

## 專案是什麼
- 台北舞蹈與活動攝影師 Jim Lin（IG @jimframe）的活動相簿網站。
- **單一靜態頁面**：`index.html`（HTML + CSS + JS 全在同一檔），由 GitHub Pages 從 `main` 直接發布。
- 照片從公開的 Google Drive 載入（`https://drive.google.com/thumbnail?id=<ID>&sz=w<寬>`）。
- 沒有後端、沒有建置步驟、沒有套件管理。

## 怎麼接任務
1. 到 `tasks/` 找編號最小、`status: open` 的任務檔（例如 `tasks/T001-*.md`）。一次只做一個任務。
2. 開分支 `codex/<任務編號>`，例如 `codex/T001`。
3. 照任務檔的「要做什麼」「驗收標準」「不要動」實作。任務檔沒寫的事不要順手改。
4. 把任務檔的 `status: open` 改成 `status: review`，在檔尾「實作紀錄」寫 3–6 行：改了哪些檔、怎麼驗證、有什麼沒做到。
5. 開一個 PR，標題 `[T001] 任務標題`，內文逐條貼上驗收標準並打勾（做不到的不要打勾，寫原因）。

## 硬規則
- 不新增建置工具、框架或 npm 依賴。只能用瀏覽器原生 HTML / CSS / JS。外部 script 只能來自 cdnjs，而且要釘版本。
- 介面文字一律**繁體中文（台灣用語）**。
- 保留現有設計：Apple 風格、既有 CSS 變數（顏色、圓角、字體），亮色與深色模式都要正常。
- 不可刪改相簿的 Google Drive 照片 ID、日期與場地資料，除非任務明確要求。
- 不可加入任何追蹤碼、廣告、第三方分析。
- 不可放任何金鑰、token、密碼。
- 手機寬度（390px）不能出現水平捲動。
- 每個 PR 只做一個任務，diff 保持小。

## 怎麼驗證
```bash
python3 -m http.server 8000      # 在 repo 根目錄
# 另一個終端機
node scripts/smoke.mjs http://localhost:8000/
```
沒有 Playwright 就先 `npm i -g playwright && npx playwright install chromium`；若裝在全域，執行時加 `NODE_PATH=$(npm root -g)`。
`scripts/smoke.mjs` 會用 Playwright 開頁面（桌機 + 手機寬度），檢查：沒有 JS 錯誤、相簿區有內容、沒有水平捲動。Google Drive 圖片在沙盒裡載不到是正常的，腳本會忽略圖片的網路錯誤。若環境沒有 Playwright，至少用 `node --check` 檢查抽出的 JS，並在 PR 說明。

## 檔案地圖
- `index.html`：整個網站。重要區塊：`ALBUM_DATA`（相簿資料）、`UPCOMING_EVENTS`（近期活動）、`renderAlbums`、`renderEvents`、`renderSheet`（相簿頁）、`withCredit`（下載前的致謝提示）。
- `tasks/`：任務板。`tasks/README.md` 說明格式。
- `scripts/smoke.mjs`：冒煙測試。

## 主站程式 `site-source/`（ChatGPT Sites 版）
- 上面的「單一靜態頁、無建置」規則只適用根目錄 `index.html`。
- `site-source/` 是主站 https://jimframe.jay0916746661.chatgpt.site/ 的完整程式（vinext／Next、`app/api/*`、人臉搜尋、`app/studio` IG 素材工作室），可以用它自己的 `package.json` 與既有依賴。
- 改主站：只動 `site-source/`，同樣開分支 `codex/<任務編號>` → PR 合回 `main`。不要動根目錄 `index.html`，除非任務要求。
- 在 ChatGPT Sites 上線前，以 `main` 的 `site-source/` 為準；上線後如果在 Sites 那邊有直接改動，要把改動同步回 `site-source/` 並開 PR，讓 GitHub 永遠是最新版。
- 驗證：`cd site-source && npm ci && npm run build`（可能需要 Linux 環境），做不到就在 PR 說明。
