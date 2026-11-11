# 保臉改髮型工具

這個 CPU-only 批次工具先用 InsightFace `buffalo_l` 找出最大的人臉，再用 BiSeNet face parsing 建立頭髮與五官遮罩。影像 API 只收到頭髮編輯範圍；生成後會貼回原本五官，最後用 ArcFace 餘弦相似度選出最像本人的結果。

> InsightFace 官方模型頁註明 `buffalo_l` 預訓練模型限非商業研究用途。商業案使用前請先確認授權。

## Windows 安裝

需求：Windows 10/11 64-bit、Python 3.10–3.12、約 1 GB 模型空間。不需要獨立顯卡。

```bat
cd tools\face-edit
py -3.11 -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
copy .env.example .env
```

`insightface` 目前從原始碼安裝。若出現 `Microsoft Visual C++ 14.0 or greater is required`：

1. 安裝 [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)。
2. 在安裝程式勾選「使用 C++ 的桌面開發」及 Windows SDK，重新開啟命令提示字元再執行 `pip install -r requirements.txt`。
3. 不想編譯時，可改用可信來源提供、且完全符合 Python 版本與 `win_amd64` 的預編譯 wheel，再安裝其餘 requirements。wheel 不是 InsightFace 官方發行物，下載前務必核對來源與雜湊。

HEIC 由 `pillow-heif` 的 Windows wheel 解碼。首次執行會下載 InsightFace `buffalo_l`（約 326 MB）及 BiSeNet ResNet18 ONNX（約 51 MB）到使用者模型快取與本工具 `models/`。

## Gemini API key

1. 到 [Google AI Studio](https://aistudio.google.com/app/apikey) 建立 Gemini API key。
2. 只把 key 填進本機 `tools\face-edit\.env` 的 `GEMINI_API_KEY=` 後面，不要貼到指令、程式或 Git。
3. `GEMINI_MODEL` 放支援原生影像編輯的模型名稱；預設範例為 `gemini-2.5-flash-image`。模型若停用，只需改 `.env`。

## 完整範例

把一張或多張 `jpg`、`jpeg`、`png`、`webp`、`heic` 照片放進 `input\`：

```bat
python run.py --prompt "change the bangs to straight blunt bangs" --n 4 --threshold 0.60
```

結果在 `output\YYYYMMDD-HHMM\`：

- `best\`：每張原圖的最高分結果；全部未過門檻時仍保留最高分供參考。
- `candidates\`：所有候選。
- `masks\`：頭髮與五官羽化遮罩，供除錯。
- `report.csv`：每張候選的相似度、通過與最佳狀態；Excel 可直接開啟。
- `index.html`：雙擊即可離線並排比較原圖、最佳結果與候選。

### 不用 API 的乾跑

```bat
python run.py --dry-run
```

乾跑仍會執行讀圖、EXIF 轉正、人臉偵測、分割、貼回、ArcFace 評分及報告，只是不呼叫 Gemini，而以原圖當候選。很適合先檢查安裝與模型。

## 參數

| 參數 | 預設 | 說明 |
|---|---:|---|
| `--prompt` | `change the hairstyle` | 傳給編輯模型的英文髮型要求 |
| `--n` | `4` | 每張原圖產生幾張候選 |
| `--threshold` | `0.60` | ArcFace 餘弦相似度門檻，範圍 0–1 |
| `--dry-run` | 關閉 | 不需 `.env` 或 API key，跑完整本機流程 |

## 更換後端

複製 `backends/openai.py` 為 `backends/xxx.py`，提供繼承 `ImageEditBackend` 的 `Backend` 類別，並在 `.env` 設 `FACE_EDIT_BACKEND=xxx`。`run.py` 會動態載入，不需要修改。OpenAI 檔目前只有 TODO 空殼。

## 常見錯誤

- **找不到人臉**：照片會跳過並寫入報告，不會中斷整批。請使用清楚、正面的臉部照片。
- **照片有多人**：只處理面積最大的人臉，報告會註明偵測數量。
- **InsightFace 編譯失敗**：依上方安裝 Visual C++ Build Tools；也請確認用 Python 3.10–3.12 64-bit，不要混用不同 Python 的 pip。
- **`No module named onnxruntime`**：重新啟用 `.venv`，再執行 `python -m pip install -r requirements.txt`。
- **模型下載失敗**：確認 GitHub 可連線後重跑；下載不完整或雜湊不符的 BiSeNet 檔會被刪除，不會載入。
- **Gemini 沒回傳影像／模型不存在**：到 Google 官方模型頁確認可用的影像編輯模型，更新 `.env` 的 `GEMINI_MODEL`。
- **API key 錯誤**：只檢查本機 `.env`；工具不讀取或輸出其他位置的 key。

## 模型與套件來源

- [InsightFace / buffalo_l](https://github.com/deepinsight/insightface/tree/master/model_zoo)
- [BiSeNet face parsing（ONNX ResNet18）](https://github.com/yakhyo/face-parsing)
- [Gemini 原生影像生成與編輯](https://ai.google.dev/gemini-api/docs/image-generation)
- [Google Gen AI Python SDK](https://github.com/googleapis/python-genai)
- [ONNX Runtime](https://onnxruntime.ai/docs/)
- [OpenCV](https://opencv.org/)、[Pillow](https://python-pillow.org/)、[pillow-heif](https://pillow-heif.readthedocs.io/)、[python-dotenv](https://github.com/theskumar/python-dotenv)
