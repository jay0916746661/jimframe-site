---
id: T020
title: 保臉改髮型工具（丟照片進資料夾、一行指令跑完）
status: open
size: M   # S＝半小時內、M＝一兩小時
---

## 為什麼
Jim 想改照片裡人的瀏海或髮型，但一般 AI 修圖會把整張臉重畫，人就變形。
這個工具用人臉辨識做兩件事：**先鎖住臉，再檢查臉有沒有跑掉**，只留下最像本人的結果。
之後也會接到「面相系統」的人臉特徵資料。

## 使用方式（要做到這樣）
在 Jim 的 Windows 電腦（沒有獨立顯卡也要能跑）：

```
cd tools/face-edit
pip install -r requirements.txt
copy .env.example .env        # 填入 GEMINI_API_KEY
# 把照片丟進 input\
python run.py --prompt "change the bangs to straight blunt bangs" --n 4
```

跑完在 `output\<日期時間>\` 看到：每張原圖對應的最佳結果、全部候選、`report.csv`、一頁 `index.html` 可以並排比較原圖與結果。

## 要做什麼
所有檔案放在 `tools/face-edit/`，Python 3.10+，只用 CPU。

1. **讀圖**：`input/` 內 jpg/jpeg/png/webp/heic 都吃；一次可放一張或很多張。EXIF 方向要先轉正。
2. **偵測人臉**：用 `insightface`（buffalo_l，CPU）。沒抓到臉的照片跳過並寫進報告；多張臉時只處理最大那張臉，報告註明。
3. **切出頭髮遮罩**：用人臉分割模型（BiSeNet face-parsing，或 MediaPipe 的 hair segmentation 擇一，選能在 Windows CPU 穩定安裝的那個）切出「頭髮」與「臉部五官」區域。頭髮遮罩往外擴約 15px 並羽化。
4. **局部重繪**：把原圖＋頭髮遮罩＋prompt 送給影像編輯 API，產生 `--n` 張候選（預設 4）。
   - 後端寫成可替換的介面 `backends/base.py`，先實作 `backends/gemini.py`（Gemini 影像編輯模型，模型名稱放 `.env`，不寫死）。
   - 再留一個 `backends/openai.py` 的空殼與 TODO，不用實作。
   - API key 只從 `.env` 讀；`.env` 加進 `.gitignore`。
5. **貼回原臉**：把原圖的「臉部五官區域」（不含頭髮、不含瀏海蓋到的額頭）用羽化遮罩貼回每張候選，膚色差異用簡單色彩校正（例如在交界處做 Poisson 或 LAB 均值對齊）。
6. **身分驗收**：用 insightface 的 ArcFace 向量，算「原圖 vs 每張候選」的餘弦相似度。
   - 低於 `--threshold`（預設 0.60）的候選標「淘汰」。
   - 每張原圖選分數最高、且通過門檻的當最佳結果；全部沒過就標「全部淘汰」，仍輸出分數最高那張供參考。
7. **輸出**：
   - `output/<YYYYMMDD-HHMM>/best/`、`candidates/`、`masks/`（遮罩預覽，方便除錯）
   - `report.csv`：原檔名、候選編號、相似度、是否通過、是否為最佳、備註
   - `index.html`：每列一張原圖，旁邊是最佳結果與所有候選，下方顯示分數；純靜態、不需伺服器。
8. **乾跑模式**：`--dry-run` 不呼叫 API，用原圖當假候選跑完整流程（偵測、遮罩、貼回、評分、報告），讓沒有 API key 也能驗證流程。
9. **README.md（繁體中文）**：安裝步驟（Windows 為主）、怎麼拿 Gemini API key、參數說明、常見錯誤（insightface 在 Windows 要裝 Visual C++ Build Tools 或改用預編譯 wheel，寫清楚）。

## 驗收標準
- [ ] `python run.py --dry-run` 在放了 2 張測試照（用 repo 內可公開的範例或自行產生的合成臉，**不要放 Jim 照片庫的真人照**）時跑完，產出 `report.csv`、`index.html`、`masks/`
- [ ] 乾跑時原圖 vs 自己的相似度 ≥ 0.95（驗證評分正確）
- [ ] 沒臉的圖會被跳過且寫進報告，不會讓整批中斷
- [ ] 換一個後端只需新增 `backends/xxx.py`，`run.py` 不用改
- [ ] `.env` 不在 git 裡；repo 內沒有任何 API key
- [ ] README 有 Windows 安裝步驟與一個完整範例指令
- [ ] `node scripts/smoke.mjs` 通過

## 不要動
- `index.html`、`site-source/`、`face/` 與其他現有資料夾
- 不要把任何真人照片（包括 `photos/` 裡的）複製進 `tools/face-edit/` 或提交到 git；`input/`、`output/` 加進 `.gitignore`

## 實作紀錄
（Codex 完成後填寫）
