# T011 驗收報告

- 日期：2026-10-25（Asia/Taipei）
- 分支：`codex/T011-portfolio-cards`
- 狀態：`passed`
- 範圍：`portfolio/index.html`、`portfolio/content.json`、`tasks/T011_REPORT.md`
- 媒體保護：未修改 `photos/`、`videos/`、`face/`

## 1. Positive Test：版面與連結

執行環境：本機 `python3 -m http.server 4173 --bind 127.0.0.1`，Playwright 驅動 Google Chrome。

```text
[POSITIVE:mobile-390x844] {"viewport":"390x844","scrollWidth":390,"clientWidth":390,"cardCount":3,"visibleCards":3,"enhanced":"enhanced","overflow":false,"consoleErrors":[]}
[POSITIVE:desktop-1440x900] {"viewport":"1440x900","scrollWidth":1440,"clientWidth":1440,"cardCount":3,"visibleCards":3,"enhanced":"enhanced","overflow":false,"consoleErrors":[]}
[POSITIVE:links] [{"href":"http://127.0.0.1:4173/sql/","status":200,"anchorExists":true},{"href":"http://127.0.0.1:4173/#finder","status":200,"anchorExists":true},{"href":"http://127.0.0.1:4173/sprint/","status":200,"anchorExists":true}]
```

結論：390×844 與 1440×900 均無水平溢出，三張案例卡皆可見；所有案例動作連結回應 HTTP 200，片段錨點存在。

## 2. Negative Test：延遲 JavaScript 資料與空 localStorage

測試刻意將 `portfolio/content.json` 延遲 2.5 秒，並在讀取前清空 localStorage。HTML 內建完整 fallback；JSON 載入後再以同一資料結構增強內容。

```text
[NEGATIVE:delayed-js-empty-localStorage] {"beforeJson":{"readyState":"complete","cardCount":3,"fullText":true,"contentChars":1267,"localStorageKeys":0},"afterJson":{"cardCount":3,"enhanced":"enhanced"},"consoleErrors":[]}
```

結論：JSON 尚未回應時仍有 3 張完整卡片，且每張均包含「問題／做法／結果／我負責」；載入後仍為 3 張，無白屏、無未捕捉錯誤。

## 3. Privacy Gate：tracked files grep

掃描可識別的組織／客戶欄位、商業登記字樣與未指數化的內部金額格式；允許作品內已去識別化的編號與成本指數。

```text
[PRIVACY:tracked-files final]
grep_exit=1 (1 means zero matches)
```

結論：零命中；三張案例沒有真實公司名、客戶名或原始 NTD 成本。

## 視覺驗收

- 已以完整頁截圖檢查 390×844 與 1440×900。
- 行動版依序呈現定位、三張案例、其他工具與頁尾；長文沒有截斷。
- 桌面版三欄「問題／做法／結果」對齊，關鍵結果與行動連結在 90 秒掃讀路徑上清楚可見。
- 沿用 JimFrame 既有 Apple 系統色、深淺色模式與字型堆疊，未新增外部依賴。
