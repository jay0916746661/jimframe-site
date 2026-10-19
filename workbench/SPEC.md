# JimFrame 工作台 · 規格書（v1，2026-10-19）

給 Codex 實作。Claude 寫規格與驗收，Jim 在自己的 Mac 上使用。

## 0. 一句話
把 JimFrame 每場活動「照片上線 → 挑照片／封面 → 影片 → 宣傳素材」的固定流程，做成在 Jim 的 Mac 上**點兩下就能開的本機工具**。全程**不呼叫任何 AI／API**、不需要網路（上傳網站的 `git push` 除外）。

## 1. 使用者與情境
- 使用者：Jim，非工程師。會用 Finder、Final Cut Pro、Capture One；不會打指令。
- 每場活動（例如 Bachata Crush 10.18 PJ 睡衣派對）結束後：
  1. Capture One 匯出一個資料夾的 JPG（約 400–700 張，長邊約 6000px）。
  2. Final Cut Pro 匯出一支串好、調好色的 4K 直式 `.m4v`（2160×3840，30fps，內含多段舞蹈），另外有相機原始片段資料夾（C0xxx.MP4，用來知道每段長度）。
- Jim 只想做這幾件事：選資料夾、填日期和主題、在網頁上點選、按「上線」。

## 2. 技術約束（硬規則）
- 平台：macOS（Apple Silicon 與 Intel 都要能跑）。Python 3.11+。
- 外部工具：`ffmpeg`/`ffprobe`、`cjpeg`/`jpegtran`（libjpeg-turbo）、`git`。由 `install.command` 用 Homebrew 安裝（沒 Homebrew 就提示安裝指令，不要自動裝 Homebrew）。
- Python 套件只能用：`pillow numpy opencv-python onnxruntime`。介面用 Python 標準庫 `http.server` + 原生 HTML/CSS/JS（**不要** Flask、React、Electron、建置工具）。
- **不呼叫任何 AI、雲端 API、追蹤碼。** 人臉、顏色、清晰度全部用本機模型或演算法。
- **永不刪除使用者檔案。** 要丟掉的移到同層 `_bad/` 或 `_to_delete/`。網站 repo 裡也只能「從清單拿掉」或 `git mv`，不可 `git rm` 大量檔案。
- 所有輸出**可續跑**：檔案已存在就跳過；寫檔先寫 `*.tmp` 再改名。暫存檔名必須帶唯一編號（之前平行跑共用暫存檔，弄壞過 8 支影片）。
- 介面文字一律**繁體中文（台灣用語）**。
- 長時間工作（渲染、建索引）在背景執行緒跑，網頁顯示進度條與「剩約 N 分鐘」，關掉網頁不會中斷；重開工作台會接著跑。

## 3. 檔案結構
```
workbench/
  SPEC.md               ← 本文件
  install.command       ← 第一次安裝（brew 套件＋pip 套件＋檢查）
  start.command         ← 點兩下：啟動 server，開 http://localhost:8787
  config.example.json   ← 複製成 config.json（不進 git）
  app/
    server.py           ← http.server + JSON API + 背景工作佇列
    jobs/               ← 每個模組一個 .py（photos.py, review.py, cover.py, video.py, promo.py, site.py, faces.py, colors.py）
    web/                ← index.html, app.js, app.css（原生）
  assets/               ← Logo、漸層、字型、yunet.onnx（已放好）
  reference/            ← 已驗證過的腳本，照它的參數移植（見 §9）
```
`config.json`：
```json
{
  "site_repo": "~/Projects/jimframe-site",
  "work_root": "~/JimFrame",
  "photographer_tag": "@jimframe",
  "events": {
    "Bachata Crush": {"official_tag": "@bachata_crush_tw", "crush_logo": true, "venue_tag": "@flow.taipei"}
  }
}
```
每場活動的工作資料夾：`<work_root>/<MMDD> <活動名>/`，裡面固定子資料夾：`照片_雙Logo_完整畫質/`、`照片_失焦_不上傳/`、`網站用/`、`4K單支/`、`25秒試看版/`、`限動照片/`、`宣傳/`、`_bad/`、`state.json`（進度與設定）。

## 4. 首頁（localhost:8787）
- 上方：活動選單（新增活動：日期 MMDD、活動名稱下拉＝config.events、主題文字例如「PJ 睡衣派對」）。
- 四張大卡片：① 照片上線 ② 挑照片＋封面 ③ 影片 ④ 宣傳素材。每張顯示狀態（未開始／進行中 63%／完成 ✓）與上次結果。
- 右上「網站」區：repo 目前大小（MB）／1024MB 進度條、`git pull` 狀態、「打開網站」連結 https://jay0916746661.github.io/jimframe-site/ 與管理模式連結 `?admin`。

## 5. 模組規格

### ① 照片上線（M1）
輸入：Capture One 匯出資料夾。
1. **失焦篩選**：每張縮到長邊 1000 算 Laplacian 變異數；低於整批中位數 × 0.25 的列為「可能失焦」，在 ② 頁面給 Jim 勾選是否移到 `照片_失焦_不上傳/`（預設不移）。
2. **雙 Logo**（完整畫質）：照 `reference/cloud/addlogos.py`（jpegtran 無損，只重壓 Logo 那幾塊）。
   - 參數：長邊 L；邊距 `m=round(L*0.022)`；CRUSH Logo 寬 `0.12L` 放左下（x 往左 4% 寬、y 往下 8% 高的微調照原腳本）；Film by Jim Logo 寬 `0.058L` 放右下。
   - 活動 `crush_logo=false` 時只放 Jim Logo（右下）。
   - 輸出到 `照片_雙Logo_完整畫質/`，檔名不變。
3. **網站版**：長邊 1600、JPEG q=82、去掉 EXIF 但保留 sRGB；縮圖 `t/` 長邊 600、q=78。放 `<site_repo>/photos/<MMDD>/` 與 `photos/<MMDD>/t/`。
4. **衣服顏色**：照 `reference/cloud/vcol17.py` 的 `hist()` 與分組（36 格色相、扣掉整批中位數 ×1.3、8 組），但輸入改成網站版照片。輸出 `{id:[組,色相,鮮明度]}`，鮮明度用 `round(sm*1000,1)`。
5. **人臉索引**：照 `reference/cloud/pyidx.py`（YuNet `assets/yunet.onnx` + SFace `site_repo/face/face-api/sface_int8.onnx`，長邊 1200，旋轉 0/±20/±40/±60，size≥32，對齊模板見檔案）＋`conv.py`（int8 base64、div=127/最大絕對值、hash=9×8 dHash）。輸出 `face/index-<MMDD>.json`。多核：用 `multiprocessing` 開 (CPU 核心數−1) 個 worker，每個 onnxruntime 1 thread。實測 2 核雲端每張約 3.5 秒，Mac 8 核應 < 1 秒。
6. **寫進網站**（`site.py`，見 §6）：新增 `ALBUM_DATA`、`COLOR_DATA`、`ALBUM_THEME`、`FACE_INDEXES` 項目。
7. 完成後顯示：張數、失焦候選數、人臉數、repo 新大小；「上線」按鈕才做 git（見 §6）。

### ② 挑照片＋封面（M2）
一頁格狀檢視這場的網站版縮圖（虛擬捲動，700 張要順）。
- **眼睛問題候選**：照 `reference/cloud/eyes2.py` 的流程（YuNet 找臉 → 用兩眼位置轉正裁切 → 眼睛區域暗部比例 + Haar 開眼偵測），只看「主角臉」（臉寬 ≥90px 且 ≥ 該張最大臉的 0.55）。輸出分數，候選排前面、用紅框標示。**注意：這個偵測不準，只做排序與標示，絕不自動刪。** Jim 的標準：只刪翻白眼、半眨眼；享受地閉眼不刪。
- 每張可點「隱藏」（從 `ALBUM_DATA` 拿掉，檔案不刪；同一場可復原）；可多選。
- **封面製作**：勾 9 張 → 產生 `photos/<MMDD>/cover.jpg`，規格照 10.17 封面（`photos/1017/cover.jpg` 可比對）：
  - 1080×1080，深色底 `#0c0a0c`；3×3 格、格線 8px（含外框）；每格取照片中央、上方留 2%、高度取 86% 的正方形。
  - 從 y=460 往下疊深色漸層到 88% 不透明。
  - `assets/core_4x.png` 不需要；CRUSH Logo 用 `assets/crush-logo.png`（或 render 出的發光版），寬 480，置中，y=530。
  - 金色細線（中間亮兩端暗，#C8A05A→#F0C8 系），寬 480、厚 3，在 Logo 下方。
  - 文字「<MMDD 帶點> • <主題>」Noto Sans CJK Bold 38px 白色置中；下方 Film by Jim Logo 寬 160 置中；再下方「@jimframe」23px 淺灰置中。
  - 寫進 `ALBUM_COVERS`，網址加 `?v=<時間戳>` 避免快取。

### ③ 影片（M3）
輸入：FCP 匯出 `.m4v`、相機原始片段資料夾。
1. **切點**：讀原始片段長度（`ffprobe`）依序累加得預測切點；每個切點前後 ±1.5 秒用 `select='gt(scene,0.2)'` 找最近的場景切換（`reference/mac/cut17.py`）。結果給 Jim 在頁面上看縮圖確認（每個切點前後各一張），可手動微調秒數。
2. **4K 單支**：每段用 keyframe 對齊 `-c copy` 切出 `4K單支/<MMDD>_<C編號>_4K.mp4`；同時轉 1080×1920 中間檔（`split17.py`）。長片用 25 秒小段平行轉檔再串接（`piece17.py`），平行數＝核心數/2。
3. **CRUSH 動態 Logo 軌**：`reference/cloud/render25.py`（參數：輸出、長度秒、日期字串 `MM . DD . YYYY`），每場活動產一次 25 秒版存 `_assets/crush_track25.mp4`。字型路徑改用 `assets/fonts/`。
4. **25 秒特效版**：照 `reference/mac/fx17.sh` 的 filter graph（開場 2.5 倍速快切 → 0.35 倍 minterpolate 慢動作推近 → 白閃 → 正片；screen 疊 CRUSH 軌；漸層；Jim Logo 200px 放 (40,56)）。片長 < 25.6 秒時照腳本改 DUR/ML/h1–h3。輸出 `25秒試看版/<MMDD>_<C編號> 25秒試看.mp4`。
5. **網站版**：照 `web17.py`：網站 mp4（CRF25、maxrate 2.3M、hqdn3d）、封面 3.2 秒、5 張候選畫格 `cand-<key>-1..5.jpg` 與 `cands.json`、限動圖（最清楚的一格＋CRUSH Logo 寬 440 底部置中＋Jim Logo 200）。
6. **影片顏色**：`vcol17.py` 算 `VCOLOR`。
7. **寫進網站**：`videos/<MMDD>/`；`VIDEO_DATA_ALL` 加 `["<YY後兩碼日期>-<編號>",秒數]`，例如 10.18 的 C0201 → `"18-201"`；`VCOLOR`、`CRUSH_CANDIDATES`、`VEVENTS`（新活動放最前）。**同時把 `index.html` 的 `VEV` 改成通用規則**：key 有 `NN-` 前綴就回傳 `10NN`，否則照舊（3 碼＝1016、其他＝1015）。`PREVIEW_LEN` 短於 25 秒的片要加例外。
8. **付費完整版（4K）**：輸入影片編號 → 全長 4K：開場特效（同 25 秒版前 2.6 秒，1080 渲染後放大）＋正片原畫質 4K＋CRUSH 全長軌（render25 用全長秒數）2 倍放大 screen 疊加＋漸層＋Jim Logo 400px 放 (80,112)，原始音軌全程。輸出 `完整版_付費/<MMDD>_<C編號>_4K完整版.mp4`（CRF 18）。另輸出 1080 版方便手機。

### ④ 宣傳素材（M4）
照 `reference/cloud/promo_1017.py` 做成可換活動的範本：
- IG 輪播 4 張（1080×1350）：上線封面拼貼／影片 6 格／找自己 3 步／三晚（或全部 Crush 場次）總數。
- 限動 3 張 × 中英（1080×1920），底部留「點連結 ↓」位置。
- 配色依活動主題可選：Neon（紫藍霓虹）、Dressy（深色＋金色）、PJ（粉彩，Jim 決定）——做成 3 組色票設定，不要寫死。
- `文案.txt`：中英日三語，自動帶入張數、影片數、網址、`@jimframe @bachata_crush_tw @flow.taipei` 與 hashtag。
- 照片選擇：預設取 ② 封面那 9 張的前 6 張，可在頁面換。

## 6. 寫網站與上線（site.py）
- 只改 `index.html` 裡這些常數的**內容**：`ALBUM_DATA`、`COLOR_DATA`、`ALBUM_THEME`、`ALBUM_COVERS`、`FACE_INDEXES`、`VIDEO_DATA_ALL`、`VCOLOR`、`VEVENTS`、`CRUSH_CANDIDATES`、`PREVIEW_LEN`、`VEV`。用「找到 `const 名稱=` → 解析到對應的結尾括號」的方式改，不要用整檔正則亂換；改完用 `node --check` 檢查抽出的 `<script>`。
- 上線流程（按鈕「上線」）：
  1. `git pull --rebase`（失敗就停，顯示訊息，**不要** force）。
  2. 檢查：這次 commit **只能新增或修改**檔案，`git status` 出現任何刪除（D）就中止。之前有一次別台電腦的 commit 把網站 3,051 個檔案全刪了。
  3. 檢查 repo 工作區大小：> 950MB 時中止並顯示「網站空間快滿」，請 Jim 先處理（之後另開任務：舊影片重壓或照片改放雲端）。
  4. `git add` 本次檔案 → commit「<MMDD> <活動>: N photos / M videos (workbench)」→ `git push`。
  5. 顯示網站網址；提醒 GitHub Pages 約 1–2 分鐘生效。
- 認證：用 Mac 上既有的 git 認證（osxkeychain／gh）。工作台**不保存任何 token**。

## 7. 非功能
- 一場 600 張照片、9 支影片，在 M 系列 Mac 上：照片上線 < 15 分鐘、影片全部 < 60 分鐘（可背景）。
- 任一步驟失敗：不中斷其他已完成的；頁面顯示錯誤摘要＋「重試這一步」。log 寫 `state.json` 與 `workbench.log`。
- 不需要登入；只聽 `127.0.0.1`。

## 8. 驗收（Jim 用 10.17 已有素材測）
- 用 `1017 bachata crush` 照片資料夾跑 ①：產出的網站版張數、`COLOR_DATA` 與網站現有 10.17 差異 < 5%；人臉索引能讓網站「找自己」用 10.17 照片裁臉找到本人。
- ② 封面與現有 `photos/1017/cover.jpg` 版型一致（人工比對）。
- ③ 用 `1017 bachatacrush.m4v` 跑出 9 支，切點與 `reference` 誤差 < 0.2 秒；25 秒版畫面與現有版相同結構。
- ④ 產出 7 張圖＋文案，數字正確。
- 全程沒有任何對外網路請求（`git push` 除外）；沒有刪除任何檔案。

## 9. reference/ 說明
- `reference/mac/`：在 Jim 的 Mac 上實際跑過的 10.17 影片腳本（路徑寫死，移植時改成參數）。
- `reference/cloud/`：在雲端跑過的照片 Logo、人臉索引、眼睛偵測、顏色、宣傳圖、CRUSH 軌腳本（路徑寫死在 scratchpad，移植時改到 `assets/`）。
- 這些都是**已驗證的參數**，請照抄數值，不要「優化」視覺參數。

## 10. 照片改放雲端（Google Drive）— 決定於 2026-10-19
網站（GitHub Pages）上限 1GB，已用約 860MB。**從 10.18 起，新相簿的照片放 Google Drive，網站只放資料與縮圖。**
- **下載一律透過網站，不開雲端頁面**（網站已改好）：非 iOS 用隱藏 iframe 指向 `drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t`；iOS 直接 `location.href` 到同網址（附件不會離開頁面）。
- **顯示**：大圖用 `https://lh3.googleusercontent.com/d/<ID>=w1600`，格子縮圖仍放網站 `photos/<MMDD>/t/`（600px，每張約 50KB，一場約 30MB），讓相簿與人臉搜尋結果打開很快。
- **工作台流程**（取代 §5 ① 第 3 步的「網站版放 repo」）：
  1. 網站版照片（長邊 1600）複製到 Mac 上 Google Drive 電腦版的同步資料夾 `我的雲端硬碟/JimFrame 網站/<MMDD> <活動>/`。
  2. 等同步完成後，用 macOS 延伸屬性讀檔案 ID：`xattr -p 'com.google.drivefs.item-id#S' <檔案>`（Google Drive 電腦版會寫入）。讀不到就提示 Jim 等同步完成再按一次。
  3. 該資料夾要設定「知道連結的任何人可檢視」（Jim 第一次自己在 Drive 設一次，工作台只檢查、不改權限）。
  4. `ALBUM_DATA` 的 id 用 Drive 檔案 ID（不加 `L` 前綴），`photoSrc()` 對雲端 id 改用 lh3 網址；縮圖查表 `DRIVE_THUMB[id]="photos/<MMDD>/t/<檔名>.jpg"`。
  5. 顏色分析與人臉索引都在 Mac 本機用原檔算，不需要從雲端讀。
- **不使用 Google API／OAuth、不存任何 token**（只靠 Drive 電腦版同步＋xattr）。
