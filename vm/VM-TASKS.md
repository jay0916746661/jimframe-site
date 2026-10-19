# Codex 雲端 VM 任務書（給 Codex 執行）

> 這份是給 Codex 的。目的：確認 Codex 雲端 VM 能不能長期保留，如果可以，把三類不需要大模型的工作搬上去，省下 Claude 的額度。
> 一次只做一個階段，每個階段結束把「結果報告」寫進 repo 的 `vm/REPORT.md` 並開 PR。做不到的寫原因，不要硬繞。

## 硬規則
- **不放任何公司資料**（新麗聲的品牌名、客戶名、金額、正航匯出檔都不行）。只能放虛構資料或去識別後的指數表。
- 不裝需要付費金鑰的服務。免費模型（opencode 等）只能用在「不需要判斷」的工作：改檔名、跑測試、整理 CSV。文案、查證、分析一律不用。
- 所有產出都要推回 GitHub（jay0916746661 底下的 repo），VM 只是算力，不是存檔的地方。
- 每個階段用一個分支 `codex/vm-<階段編號>`，開 PR，PR 內文貼本階段的驗收清單打勾。

---

## 階段 0：VM 會不會保留（必做，其他階段都靠它）

要做：
1. 在 `/workspace/vm-probe/` 寫三個檔：`created.txt`（寫入目前 UTC 時間與 `hostname`）、`big.bin`（100 MB 隨機內容）、`env.txt`（下面「環境盤點」的輸出）。
2. 安裝 `postgresql` 並建一個資料庫 `probe`，寫入一列 `(id=1, note='hello')`。
3. 把 `env.txt` 的內容複製進 repo `jimframe-site` 的 `vm/REPORT.md`，開 PR。

環境盤點（全部指令的輸出都要留）：
```
nproc; free -g; df -h /workspace /tmp; cat /etc/os-release | head -3
node -v; npm -v; python3 --version; pip --version
ffmpeg -version | head -1 || echo "no ffmpeg"
npx playwright --version || echo "no playwright"
python3 -c "import rawpy,numpy,PIL;print('rawpy ok')" || echo "no rawpy"
psql --version || echo "no psql"
crontab -l 2>&1 | head -3; which cron systemctl
curl -sI https://github.com | head -1; curl -sI https://www.googleapis.com | head -1
```

驗收（由 Jim 隔天開一個**新任務**再查）：
- [ ] `/workspace/vm-probe/created.txt` 還在，內容是昨天的時間
- [ ] `big.bin` 還是 100 MB
- [ ] `psql -d probe -c "select * from t"` 還查得到那一列
- [ ] `vm/REPORT.md` 已在 PR 裡

**如果驗收不過**：VM 不保留。那就只做階段 1（每次任務內跑完就推回 GitHub），階段 2、3 放棄。

---

## 階段 1：渲染搬上 VM（最省 Claude 額度）

背景：`after-reading-studio` 與 `jimframe-site` 裡有兩套用 Playwright＋Canvas＋ffmpeg 逐格渲染 Reels 的工具（`reelgen.mjs` 讀一個 JSON 腳本，輸出 1080×1920 mp4，每支約 900 格）。目前由 Claude 渲染，一支約吃 Claude 週額度 3%。

要做：
1. 在 VM 裝好 Playwright Chromium 與 ffmpeg（已有就跳過）。
2. 把 `after-reading-studio` repo clone 下來（還沒建的話先建 private repo，把 Jim 給的 `reelgen.mjs`、`reelgen.html`、`node_modules/@fontsource` 的字型、範例 JSON 推上去）。
3. 寫 `scripts/render_all.sh`：掃 `scripts/*.json`，沒有對應 mp4 的就渲染，輸出到 `out/`，完成後 `git add out/*.mp4 && git commit && git push`。
4. 用範例 JSON 跑一支，確認 mp4 能播、長度跟腳本算的一致、字型有載到（不是方塊）。
5. 如果階段 0 通過：加一個 cron，每天 03:00 跑 `render_all.sh`。

驗收：
- [ ] `out/` 裡有至少一支 mp4，Jim 下載能播，中文字正常
- [ ] `render_all.sh` 重跑不會重複渲染已有的
- [ ] 一支 900 格在 VM 上的耗時寫進 REPORT.md
- [ ] （VM 保留時）cron 有設定，`crontab -l` 看得到

---

## 階段 2：排程抓資料搬上 VM

背景：目前有三個資料抓取是用 Claude 的排程跑，其實不需要大模型：
- 台灣潛水誌每日消息（海況、禁潛、船班、潛店公告），結果是一個 JSON，網頁讀它
- Podcast 每週排行（台灣 Apple Podcasts／Spotify 前 50）
- 雙北爬山步道封閉／整修消息（林業署、台北市大地處、新北觀旅局）

要做：
1. 在 `jimframe-site`（或 Jim 指定的 repo）建 `data-jobs/`，每個抓取一支 Python 腳本，輸出固定格式 JSON 到 `data/<name>.json`，附來源 URL 與抓取時間。
2. 腳本只做抓取與整理，**不呼叫任何 LLM**。抓不到就寫 `"status":"failed"` 和原因，不要編內容。
3. `data-jobs/run.sh`：依序跑三支，有變動就 commit＋push。
4. （VM 保留時）cron：潛水誌每天 07:00、爬山每天 07:10、Podcast 每週一 08:00。

驗收：
- [ ] 三個 JSON 都有產出，格式固定，有來源與時間
- [ ] 手動跑 `run.sh` 兩次，第二次沒有變動就不 commit
- [ ] 任一來源掛掉時腳本不會整個中斷，其他兩個照跑

---

## 階段 3：小店健檢的資料庫（只用虛構資料）

背景：Jim 在做「小店數據健檢」副業：把樂器行／音樂教室的銷售與報名資料整理成一頁健檢。目前示範用的是虛構樂器行資料（`sales.csv` 約 3,500 列、`stock.csv` 124 列、`customers`）。之後要做成「通路健檢月報」：三張 CSV 進去，一頁報表出來。

要做：
1. 在 VM 的 Postgres 建資料庫 `shop_health`，表：`stores`、`sales`、`stock`、`customers`、`reports`，欄位照 `demo/` 裡的 CSV。
2. 寫 `monthly_report.py`：給 `store_id` 與年月，算出 8 個數字（本月 vs 去年同月、年累計、前 5 品牌佔比、毛利率、每 1 元庫存毛利、可賣月數、一年沒動佔比、半年沒來的客戶數、退貨率、淡旺季指數），輸出一頁 HTML（版型照 `demo/index.html`）與一列寫進 `reports`。
3. 用虛構資料跑一個月，HTML 推回 repo。

驗收：
- [ ] 三張虛構 CSV 匯入後 `select count(*)` 與 CSV 列數一致
- [ ] `monthly_report.py --store 1 --month 2026-09` 能產出 HTML，8 個數字都有值
- [ ] 換一個月再跑，`reports` 多一列
- [ ] 整個 repo 裡 grep 不到任何真實品牌名或客戶名

---

## 報告格式（`vm/REPORT.md`）
每個階段一節：
- 做了什麼（3–6 行）
- 環境／耗時數字
- 沒做到的與原因
- 下一步需要 Jim 決定的事（一條一條）

## 階段順序
0 → 1 →（等 Jim 確認階段 0 驗收）→ 2 → 3。階段 1 不論 VM 保不保留都做，因為它每次任務內跑完就推回 GitHub。
