"""各頻道庫存水位：讀 IG／Threads 兩個發文佇列，算每個頻道排到哪天、還剩幾天。

python tools/stock/stock.py          印出報告並寫 tools/stock/report.md
規則：剩不到 10 天＝要補（⚠️），剩不到 3 天＝快斷檔（🔴）。
MBS 裡手動排的看不到，先記在 channels.csv 的 mbs_until（之後全部走佇列就不用填）。
不需要任何 token。
"""
import csv
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).parent
TPE = timezone(timedelta(hours=8))
QUEUES = {"IG": ROOT / "tools/meta-poster/ig_queue.csv", "Threads": ROOT / "tools/threads-poster/queue.csv"}
TARGET, WARN, CRIT = 14, 10, 3


def pending(path):
    out = {}
    if not path.exists():
        return out
    with path.open(encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            if (r.get("status") or "").strip() != "待發" or not r.get("publish_at"):
                continue
            acct = r["account"].strip().lstrip("@")
            day = r["publish_at"].strip()[:10]
            d = out.setdefault(acct, {"n": 0, "last": day})
            d["n"] += 1
            d["last"] = max(d["last"], day)
    return out


def main():
    today = datetime.now(TPE).date()
    q = {k: pending(p) for k, p in QUEUES.items()}
    with (HERE / "channels.csv").open(encoding="utf-8-sig", newline="") as f:
        chans = list(csv.DictReader(f))
    rows, need = [], []
    for c in chans:
        a = c["account"]
        dates = [d for d in (c.get("mbs_until"), q["IG"].get(a, {}).get("last"), q["Threads"].get(a, {}).get("last")) if d]
        until = max(dates) if dates else today.isoformat()
        days = (datetime.strptime(until, "%Y-%m-%d").date() - today).days
        mark = "🔴" if days < CRIT else "⚠️" if days < WARN else "✅"
        per_week = int(c["per_week"] or 7)
        short = max(0, TARGET - days)
        eps = -(-short * per_week // 7)  # 補到 14 天要幾集（無條件進位）
        rows.append((days, f"| {mark} | {c['name']} | {until} | {days} 天 | "
                     f"{q['IG'].get(a, {}).get('n', 0)} | {q['Threads'].get(a, {}).get('n', 0)} | "
                     f"{eps or '—'} | {c.get('note', '')} |"))
        if days < WARN:
            need.append((days, f"{mark} {c['name']}：剩 {days} 天，補 {eps} 集到 14 天"))
    rows.sort()
    lines = [f"# 庫存水位 {today}", "",
             f"目標每個頻道排滿 {TARGET} 天；剩不到 {WARN} 天要補、不到 {CRIT} 天快斷檔。", "",
             "| | 頻道 | 排到 | 剩 | IG 佇列 | Threads 佇列 | 要補幾集 | 備註 |", "|---|---|---|---|---|---|---|---|"]
    lines += [r for _, r in rows]
    lines += ["", "## 要補的", ""] + ([f"- {n}" for _, n in sorted(need)] or ["- 全部都在 10 天以上 👍"])
    text = "\n".join(lines) + "\n"
    (HERE / "report.md").write_text(text, encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()
