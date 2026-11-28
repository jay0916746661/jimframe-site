# repo 地圖與封存建議（29 個）

2026-11-28 盤點。每個 repo 都已經放了一份中文 README 說明書（在做什麼、怎麼改、怎麼修）。
**這裡的封存建議只是建議，沒有封存、刪除或移動任何東西。**

> 封存（Archive）是什麼：repo 變成唯讀，網站照樣能看、檔案全部還在，隨時可以在 Settings 取消封存。跟刪除不一樣。
> 怎麼做：repo → Settings → 拉到最下面 Danger Zone → Archive this repository。

## 🟢 正在用（7 個，不要封存）

| repo | 做什麼 | 最後更新 |
|---|---|---|
| [jimframe-site](https://github.com/jay0916746661/jimframe-site) | 總部：所有發文佇列、自動化、配音、影片引擎、JimFrame 網站、各頻道舊頁 | 每天 |
| [jimframe-photos](https://github.com/jay0916746661/jimframe-photos) | JimFrame 活動照片網站版（8,300 多張） | 11-27 |
| [jazz101tw.github.io](https://github.com/jazz101tw/jazz101tw.github.io) | 爵士101 網站（程式產生：改 `src/` 再 build） | 11-26 |
| [art101tw.github.io](https://github.com/art101tw/art101tw.github.io) | 藝術101 網站正式版 | 11-20 |
| [socialdance101tw.github.io](https://github.com/socialdance101tw/socialdance101tw.github.io) | Social Dance 101 網站（單一 index.html） | 11-19 |
| [coffeestory101.github.io](https://github.com/coffeestory101/coffeestory101.github.io) | 咖啡101 網站 | 11-19 |
| [self-discovery-journal](https://github.com/jay0916746661/self-discovery-journal) | 用 Issues 寫自我認識週誌（不佔空間，留著） | 05-02 |

## 🟡 建議封存（優先，有替代品或已失效）

| repo | 為什麼 | 封存前要確認 |
|---|---|---|
| [art101](https://github.com/jay0916746661/art101) | 跟 art101tw.github.io 幾乎一樣，是搬家前的舊網址版 | IG／Substack 連結都已改新網址 |
| [repo](https://github.com/jay0916746661/repo) | 4–5 月大雜燴工具箱；兩個排程到 7/15 一直失敗（LINE Notify 已停止服務），已被 GitHub 自動停用 | 沒有還在用的腳本 |
| [AI-search](https://github.com/jay0916746661/AI-search) | 名稱是 AI-search，內容其實是塔羅早期版，被 tarot 取代 | — |
| [tr](https://github.com/jay0916746661/tr) | 塔羅最早的上傳版，被 tarot 取代 | — |

## ⚪ 可以封存（舊實驗，留著也不影響）

| repo | 做什麼 | 最後更新 |
|---|---|---|
| [bachata-](https://github.com/jay0916746661/bachata-) | Bachata 教學平台（跳舞平台三版本之一） | 07-10 |
| [smc](https://github.com/jay0916746661/smc) | SMC 跨市場行情面板 | 07-05 |
| [00](https://github.com/jay0916746661/00) | 深耕儀表板（名稱看不出用途） | 06-27 |
| [learn](https://github.com/jay0916746661/learn) | 西語 A1／日文 N5 學習面板 | 06-20 |
| [song](https://github.com/jay0916746661/song) | 本機影片下載面板 | 06-18 |
| [dj](https://github.com/jay0916746661/dj) | DJ 練習室 | 06-08 |
| [time](https://github.com/jay0916746661/time) | 時間對標面板（React） | 06-02 |
| [ask](https://github.com/jay0916746661/ask) | 有聲書／書庫中心（Streamlit） | 05-24 |
| [dance-video-website](https://github.com/jay0916746661/dance-video-website) | Taiwan Zouk Festival 2026 影片庫（活動已結束） | 05-04 |
| [edit](https://github.com/jay0916746661/edit) | AutoCut Studio 剪輯原型 | 05-03 |
| [poker](https://github.com/jay0916746661/poker) | 德州撲克訓練室 | 05-02 |
| [jim-finance-2026](https://github.com/jay0916746661/jim-finance-2026) | 🔒 私人：財務／書庫面板（有個人資料，一定保持私人） | 04-25 |
| [ai-workflow-dashboard](https://github.com/jay0916746661/ai-workflow-dashboard) | 本機 Ollama AI 面板 | 04-21 |
| [desktop-tutorial](https://github.com/jay0916746661/desktop-tutorial) | GitHub Desktop 教學範本（2023） | 2023 |
| [guitar](https://github.com/jay0916746661/guitar) | 空的（README 是第一個檔） | — |
| [-](https://github.com/jay0916746661/-) | 空的，名稱是一個減號 | — |

## 🟠 暫時保留（之後的構想可能用得到）

| repo | 為什麼留 |
|---|---|
| [tarot](https://github.com/jay0916746661/tarot) | 塔羅三版本裡最新的一份 |
| [music](https://github.com/jay0916746661/music) | 樂句庫、和弦練習，跟「歌曲分析頻道」構想有關 |

## 發現的問題（沒有動，只列出來）

1. **咖啡101 網站的產生器不見了**：coffeestory101 的 README 寫「由 `coffee101/engine/build_mag.py` 產生，不要手改」，但這支程式不在任何 repo 裡。現在只能直接改 HTML。
2. **socialdance101tw 沒授權給 Claude**：只能讀不能推，所以它的 README 說明書放在 [`docs/readme-待貼/socialdance101tw.md`](readme-待貼/socialdance101tw.md)，要你自己貼上（或到 https://github.com/apps/claude/installations/select_target 把這個 org 加進去）。
3. **藝術101 有三份**：jimframe-site 的 `art101/`、`art101` repo、`art101tw.github.io`。正式版是最後一個。
4. **跳舞平台有三處**：jimframe-site `dance/`、`dance-video-website`、`bachata-`。
5. **IG 佇列有發文失敗沒處理**：觀光客沒說的事 11/22–25 輪播連續 4 則 2207085 失敗＋1 則逾時、讀完之後 read-32-r 素材處理失敗。新的「系統健康日報」第一次跑就會列出來。
