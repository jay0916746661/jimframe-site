# 任務板

Claude 寫任務 → Codex 實作並開 PR → Claude 審查 → Jim 合併。

## 狀態
| status | 意思 | 誰改 |
|---|---|---|
| `backlog` | 排隊中，還不要做 | Claude |
| `open` | 可以開工 | Claude |
| `review` | 已開 PR，等審查 | Codex |
| `changes` | 審查要修改，看 PR 留言 | Claude |
| `done` | 已合併 | Claude |

同一時間最多 2 個 `open`。

## 任務檔格式
複製 `TEMPLATE.md`，檔名 `T<三位數編號>-<英文短名>.md`。
