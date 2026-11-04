# FB 粉專自動發文

跟 IG 發文共用同一支權杖（repo Secret `META_USER_TOKEN`），不用再申請新的 secret。GitHub Actions 讀 `fb_queue.csv`，把時間到了、狀態剛好是 `待發` 的列發到對應粉專，再把結果寫回這個檔。

IG 仍用 `ig_queue.csv`／`ig_publish.py`，Threads 在 `tools/threads-poster/`。這支程式不會改它們。

現在檔案裡的列都是 `範例`，合併後不會發出去。要發的時候再複製一列、把狀態改成 `待發`。

## 怎麼加一則貼文

在 `fb_queue.csv` 加一列（或複製範例列改）：

| 欄位 | 怎麼填 |
|---|---|
| `id` | 自己取、不要重複。例：`jazz-1105-photo` |
| `account` | 粉專名稱，或粉專的數字 ID。名稱有兩個一樣時請填 ID |
| `publish_at` | 台北時間，`2026-11-05 15:00` |
| `type` | `text` 純文字（`link` 可空）、`link` 一定要有連結、`photo` 一張或多張、`video` 一般影片、`reel` 直式 Reels |
| `media` | 圖片或影片。填 repo 裡的相對路徑，多張用空白分開，例：`social/media/jazz101/koln_1.jpg social/media/jazz101/koln_2.jpg`。程式會接上 `https://jay0916746661.github.io/jimframe-site/`。已經是 `https://` 網址就原樣用 |
| `link` | `text`／`link` 用的公開網址。其他類型留空 |
| `caption` | 貼文文字。照片的說明、影片和 Reels 的描述都填這裡 |
| `status` | 要發就填 `待發`。`範例`、`已發`、`失敗`、`逾時` 都不會再發 |
| `post_id` | 留空，發出後程式回寫 |
| `note` | 留空，程式回寫時間或失敗原因 |

`photo` 最多 10 張。`video` 和 `reel` 只能一個檔，請用 mp4 或 mov。檔案要先 push 到 `main`，GitHub Pages 大約 1–2 分鐘後才抓得到。

## 規則

- 超過預定時間 3 小時還沒發，標 `逾時`，不補發。要補發就改時間、把狀態改回 `待發`。
- 發失敗標 `失敗` 並寫原因，不會自動重試。確認粉專上沒有半成品之後，再改回 `待發`。
- 每次最多發 4 則。還沒輪到的維持 `待發`，下一輪再發。
- 同一個粉專 24 小時內的 Reels 達到 30 則就先留著 `待發`（Facebook 對 `video_reels` 的上限）。這是用佇列裡的預定時間粗算，不是 Facebook 的精確滑動窗。
- 定時（每小時的 12、27、42、57 分，UTC）和推上 `main` 時，會連續守約 5 小時、每 5 分鐘看一次佇列。手動選 `post` 只跑一輪。

## 手動執行

GitHub → Actions →「FB 粉專定時發文」→ Run workflow：

- `dry-run`（預設）：只列出會發哪些，不發文、不改佇列
- `check`：列出這個權杖的權限，以及看得到的粉專名稱和 ID，寫進 `fb_status.txt`。先跑這個，確認 `account` 怎麼填
- `post`：真的發。只發時間已經到的 `待發` 列

## 權限

沿用 `META_USER_TOKEN`。要能發文，權杖需要 `pages_show_list`、`pages_manage_posts`、`pages_read_engagement`，而且目標粉專要出現在 `/me/accounts`（你的帳號在那個粉專要有發文權限）。程式用粉專自己的 access token 發文，不會把 token 寫進檔案或印在 log。

Reels 還要符合 Facebook 的規格，程式不會事先量：mp4、直式 9:16、長度 3–90 秒、至少 540×960。GitHub Pages 要讓 Facebook 的爬蟲抓得到檔案（這個 repo 沒有 `robots.txt`）。

## 會打到的 Graph API（v21.0）

權杖是 `META_USER_TOKEN`。發文時先換粉專權杖，再打下面這些位址：

- `GET /me/permissions`、`GET /me/accounts`：檢查權限、列出粉專（沿用 `meta.py`）
- `POST /{粉專}/feed`：純文字、連結、多圖
- `POST /{粉專}/photos`：單張直接發；多圖先以 `published=false` 上傳
- `POST https://graph-video.facebook.com/v21.0/{粉專}/videos`：一般影片，`file_url` 指到 GitHub Pages
- `POST /{粉專}/video_reels`：Reels 的 `start` 和 `finish`
- `POST` 到回傳的 `rupload.facebook.com` 網址：用 `file_url` 標頭把影片網址交給 Facebook
- `GET /{影片 id}?fields=status`：等上傳或處理結束
