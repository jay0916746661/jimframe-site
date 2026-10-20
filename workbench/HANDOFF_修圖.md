# JimFrame 修圖流程 · 交接給 GPT／Codex（2026-10-20）

這份是 10.15–10.18 Bachata Crush 四晚實際做過、Jim 確認過的修圖流程與參數。
之後每場活動照這份做，不要自己重新摸索顏色。程式細節在 `SPEC.md`，這份只補「調色規則」和「Jim 的品味」。

## 0. 整體順序
1. **Capture One（Jim 的 Mac）**：RAW 調色 → 匯出 JPG（這步目前人工／Claude 操作電腦，見 §1）
2. **臉太白／偏黃補救**（可選，見 §2；任務卡 T019 會把它做進工作台）
3. **工作台 ① 照片上線**：雙 Logo → 網站版 → 衣服顏色 → 人臉索引（`SPEC.md` §5 ①，任務卡 T005）
4. **工作台 ② 挑照片＋封面**（T006）
5. **工作台 ④ 宣傳素材**（T008）

## 1. Capture One 調色規則（已驗證）
| 項目 | 設定 | 說明 |
|---|---|---|
| 曝光、陰影 | 逐張「自動」 | 舞會燈光每張不同，不要統一數值 |
| 白平衡 | 以一張 Jim 認可的參考照為準，套到整批 | 10.17 參考照 A0007093：4741K／色調 −5.6。10.18 用 4640K |
| 亮度 | +8（10.17 用過 +12，結果臉偏白，之後改 +8） | |
| 高光 | −20（閃光燈打到臉會爆白，往下拉） | 臉還是太白時可到 −30 |
| 匯出 | JPG 最高畫質、原尺寸、sRGB | 檔名保留原相機檔名（A000xxxx） |

- **先挑一張給 Jim 確認「這張就是目標」**，再套整批。這是 Jim 的固定習慣。
- 凌晨拍的照片屬於前一晚的活動：依 EXIF 拍攝時間分場，不要混進當天相簿。
- 同一個 C1 目錄可能含前一晚的照片，匯出後比對檔名範圍，去掉已上線的重複照片（10.18 就有 440 張與 10.17 重疊）。
- Mac 硬碟常常滿：匯出前確認剩餘空間 > 匯出量 × 1.5，中間檔放 T7 外接硬碟（`/Volumes/T7 藍/`），不要放「下載項目」。

## 2. 臉太白／偏黃補救（JPG 階段）
Jim 兩次說「太黃」、一次說「臉太白」。C1 修不到的時候（例如只剩 JPG），用這套 Lab 亮部修正，已在 10.17 THE DRESS EDIT 驗證：
```python
import numpy as np, cv2
from PIL import Image, ImageEnhance
def fix_highlights(im):            # im: PIL RGB
    a = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2LAB).astype(np.float32)
    L = a[...,0]/255
    t = np.clip((L-.55)/.45, 0, 1); t = t*t*(3-2*t)          # 只動亮部，平滑過渡
    a[...,0] = 255*L*(1-.16*t)                               # 亮部壓暗約 16%
    a[...,1] = 128+(a[...,1]-128)*(1+.22*t)                  # 補回亮部膚色（a 通道）
    a[...,2] = 128+(a[...,2]-128)*(1+.08*t)
    im = Image.fromarray(cv2.cvtColor(np.clip(a,0,255).astype(np.uint8), cv2.COLOR_LAB2RGB))
    return ImageEnhance.Contrast(im).enhance(1.07)
```
- 偏黃：以參考照的 b 通道（Lab）中位數為目標，整批平移 b 到同一中位數；不要用自動白平衡（會把刻意的紫紅燈光修掉）。
- 一定先出「前後對照圖」（左原圖、右修後，同一張臉放大）給 Jim 看，他說 OK 才跑整批。

## 3. Jim 的品味（做任何圖之前讀）
- 不要「可愛」：宣傳圖用深色底、襯線字的「編輯風」（10.17 THE DRESS EDIT、10.18 THE PJ EDIT 同一套）。
- 宣傳圖不放頁碼，Jim 會單張發。
- 封面九宮格：CRUSH Logo＋金線＋「10.18 • PJ 睡衣派對」＋Film by Jim＋@jimframe，照 `photos/1017/cover.jpg` 版型。
- 剔除：閉眼、眼白太多的照片一律換掉；拖曳快門的動感模糊只要臉清楚就保留。
- 不要用 Jim 在網站上隱藏的照片（`hidden.json`／`?admin` 刪除的）。
- 數量文字（「226 張」）不要印在圖上，張數會變。
- 不要自己產生背景音樂。

## 4. 不要做的事
- 不刪任何原始檔、不動已上線的 10.15–10.18 相簿與影片。
- 網站（GitHub Pages）已約 940MB／1GB，新相簿照片照 `SPEC.md` §10 放 Google Drive。
- 不呼叫任何 AI 或外部 API，不存 token。

## 5. 參考檔
- `workbench/SPEC.md`：工作台完整規格
- `workbench/reference/cloud/addlogos.py`：雙 Logo
- `workbench/reference/cloud/vcol17.py`：衣服顏色
- `workbench/reference/cloud/pyidx.py`＋`conv.py`：人臉索引
- `workbench/reference/cloud/eyes2.py`：眼睛候選
- `workbench/reference/cloud/promo_1017.py`：宣傳圖（舊版彩虹）；編輯風版型以 `photos/1017/cover.jpg` 與網站上 10.17／10.18 貼文為準
- `workbench/assets/`：Logo、漸層、字型、人臉模型
