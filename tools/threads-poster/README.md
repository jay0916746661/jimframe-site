# Threads 自動發文

每 15 分鐘，GitHub Actions 會讀 `queue.csv`，把「時間到了、狀態是 待發」的串文用官方 Threads API 發出去，再把結果寫回這個檔案。

## 怎麼加新的串文
在 `queue.csv` 加一列：
- `id`：不重複的編號，例：art-1101-01
- `account`：帳號，例：art101.tw（要在 Secret `THREADS_TOKENS` 裡有）
- `publish_at`：台北時間，格式 `2026-11-01 10:00`
- `text`：內文，500 字內
- `image_url`：選填，要公開網址（Google 雲端連結不行）
- `topic_tag`：選填，例：Art Taipei
- `status`：填 `待發`

## 規則
- 同一列發過（`已發`）不會再發。
- 發失敗會標 `失敗` 並寫原因，同帳號後面的串文先停，等你處理後把它改回 `待發` 或刪掉。
- 每帳號每天最多 8 則，每次執行最多 6 則。

## 手動執行
GitHub → Actions →「Threads 自動發文」→ Run workflow，mode 可選：
- `check`：檢查每個 token 能不能用
- `dry-run`：只列出會發哪些
- `post`：真的發

## Token
放在 repo Secret `THREADS_TOKENS`，每行 `帳號=token`。token 約 60 天到期，到期前要重新產生並整份覆蓋。不要把 token 寫進任何檔案。
