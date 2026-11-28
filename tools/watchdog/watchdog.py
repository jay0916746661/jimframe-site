"""系統健康日報：每天自動檢查發文系統，有新問題才通知 Jim。不需要 Claude。

檢查五件事：
  1. 庫存：各頻道排到哪天（沿用 tools/stock/stock.py 的算法），剩不到 10 天就列出來
  2. 佇列失敗：IG／Threads 最近 7 天標「失敗」「逾時」的貼文
  3. 卡住：狀態還是「待發」但已經過了預定時間 6 小時以上（代表發文機可能沒在跑）
  4. 素材不見：未來 48 小時要發的 IG 貼文，media 檔案不在 repo 裡
  5. 權杖與到期日：讀 /tmp/watchdog/ig_status.txt、threads_check.txt（由 workflow 先跑 --check 產生），加上 reminders.csv 的到期提醒
  另外 workflow 會把最近 26 小時失敗的 GitHub Actions 放在 /tmp/watchdog/runs_failed.json。

輸出：
  tools/watchdog/status.md   今天的完整日報（每天覆蓋）
  /tmp/watchdog/alert.md     只有「新出現」的問題（暫存，給 notify.py 發通知用，不進 repo）
  tools/watchdog/state.json  記住已經通知過的問題，同一件事不重複吵 Jim

只讀佇列、不改佇列、不刪任何檔案。
用法：python tools/watchdog/watchdog.py [--now "2026-11-29 08:00"]
"""
import argparse
import csv
import json
import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "tools/stock"))
import stock  # noqa: E402

TPE = timezone(timedelta(hours=8))
IGQ = ROOT / "tools/meta-poster/ig_queue.csv"
THQ = ROOT / "tools/threads-poster/queue.csv"
BAD = {"失敗", "逾時"}
TMP = Path(os.environ.get("WATCHDOG_TMP", "/tmp/watchdog"))  # workflow 產生的暫存檔，不進 repo


def rows(path):
    if not path.exists():
        return []
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def when(r):
    try:
        return datetime.strptime((r.get("publish_at") or "").strip()[:16], "%Y-%m-%d %H:%M").replace(tzinfo=TPE)
    except ValueError:
        return None


def repo_files(prefix="social/media"):
    try:
        out = subprocess.run(["git", "-C", str(ROOT), "ls-tree", "-r", "--name-only", "HEAD", prefix],
                             capture_output=True, text=True, check=True).stdout
        return set(out.split("\n")) - {""}
    except Exception:  # noqa: BLE001
        return None  # 不在 git 裡就跳過這項


def check_stock(today):
    q = {k: stock.pending(p) for k, p in stock.QUEUES.items()}
    with (ROOT / "tools/stock/channels.csv").open(encoding="utf-8-sig", newline="") as f:
        chans = list(csv.DictReader(f))
    table, alerts = [], []
    for c in chans:
        a = c["account"]
        dates = [d for d in (c.get("mbs_until"), q["IG"].get(a, {}).get("last"), q["Threads"].get(a, {}).get("last")) if d]
        until = max(dates) if dates else today.isoformat()
        days = (datetime.strptime(until, "%Y-%m-%d").date() - today).days
        mark = "🔴" if days < stock.CRIT else "⚠️" if days < stock.WARN else "✅"
        per_week = int(c.get("per_week") or 7)
        eps = -(-max(0, stock.TARGET - days) * per_week // 7)
        table.append((days, f"| {mark} | {c['name'].split('（')[0]} | {until} | {days} 天 | {eps or '—'} |"))
        if days < stock.WARN:
            # 同一個頻道：從 ⚠️ 變 🔴 會再通知一次
            alerts.append((f"stock:{a}:{'crit' if days < stock.CRIT else 'warn'}",
                           f"{mark} 庫存：{c['name'].split('（')[0]} 只排到 {until}（剩 {days} 天），補 {eps} 集可回到 14 天"))
    table.sort()
    return [t for _, t in table], alerts


def check_queues(now, files):
    alerts = []
    soon = now + timedelta(hours=48)
    for label, path in (("IG", IGQ), ("Threads", THQ)):
        for r in rows(path):
            t, st, rid = when(r), (r.get("status") or "").strip(), r.get("id", "?")
            if t is None:
                continue
            if st in BAD and now - timedelta(days=7) <= t <= now:
                alerts.append((f"bad:{label}:{rid}:{st}",
                               f"❌ {label} {st}：{rid}（{r.get('account')}，{r.get('publish_at')}）— {(r.get('note') or '')[:90]}"))
            if st == "待發" and t < now - timedelta(hours=6):
                alerts.append((f"stuck:{label}:{rid}",
                               f"⏸️ {label} 卡住：{rid}（{r.get('account')}）預定 {r.get('publish_at')}，過了 6 小時還是「待發」→ 發文 workflow 可能停了"))
            if label == "IG" and files is not None and st == "待發" and now <= t <= soon:
                missing = [m for m in (r.get("media") or "").split() if m.startswith("social/") and m not in files]
                if missing:
                    alerts.append((f"media:{rid}",
                                   f"🖼️ IG 素材不見：{rid}（{r.get('publish_at')}）缺 {len(missing)} 個檔，例如 {missing[0]}"))
    return alerts


def check_tokens(today):
    alerts = []
    ig = TMP / "ig_status.txt"
    if ig.exists():
        t = ig.read_text(encoding="utf-8")
        if "檢查失敗" in t or "可以發 IG：否" in t:
            alerts.append(("token:meta", "🔑 Meta 權杖有問題（IG 檢查失敗）：" + t.strip().splitlines()[-1][:120]))
        for line in t.splitlines():
            if "找不到" in line:
                alerts.append((f"token:ig:{line.split('：')[0]}", f"🔑 IG 帳號對不上：{line[:100]}"))
    th = TMP / "threads_check.txt"
    if th.exists():
        for line in th.read_text(encoding="utf-8").splitlines():
            if "失敗" in line or "是空的" in line:
                alerts.append((f"token:threads:{line.split(':')[0]}", f"🔑 Threads 權杖：{line[:120]}"))
    rem = HERE / "reminders.csv"
    if rem.exists():
        with rem.open(encoding="utf-8-sig", newline="") as f:
            for r in csv.DictReader(f):
                try:
                    d = datetime.strptime(r["date"].strip(), "%Y-%m-%d").date()
                except (KeyError, ValueError):
                    continue
                left = (d - today).days
                if 0 <= left <= int(r.get("warn_days") or 7):
                    alerts.append((f"remind:{r['date']}:{r['item']}", f"📅 {r['item']}：{r['date']}（還有 {left} 天）— {r.get('how', '')}"))
    return alerts


def check_runs():
    f = TMP / "runs_failed.json"
    if not f.exists():
        return []
    try:
        runs = json.loads(f.read_text(encoding="utf-8"))
    except ValueError:
        return []
    out = []
    for r in runs:
        out.append((f"run:{r.get('id')}", f"🛑 Actions 失敗：{r.get('name')}（{r.get('created_at', '')[:16].replace('T', ' ')} UTC）{r.get('html_url', '')}"))
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--now")
    a = p.parse_args()
    now = datetime.strptime(a.now, "%Y-%m-%d %H:%M").replace(tzinfo=TPE) if a.now else datetime.now(TPE)
    today = now.date()

    table, alerts = check_stock(today)
    alerts += check_queues(now, repo_files())
    alerts += check_tokens(today)
    alerts += check_runs()

    state_f = HERE / "state.json"
    seen = {}
    if state_f.exists():
        try:
            seen = json.loads(state_f.read_text(encoding="utf-8"))
        except ValueError:
            seen = {}
    keys_now = {k for k, _ in alerts}
    new = [(k, m) for k, m in alerts if k not in seen]
    # 只記住「現在還存在」的問題；問題消失後再出現會再通知一次。保留 30 天內已通知過的 run 失敗避免重複。
    keep = {k: v for k, v in seen.items() if k in keys_now or (k.startswith("run:") and v >= (today - timedelta(days=30)).isoformat())}
    for k, _ in new:
        keep[k] = today.isoformat()
    state_f.write_text(json.dumps(keep, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8")

    lines = [f"# 系統健康日報 {now:%Y-%m-%d %H:%M}（台北）", "",
             "這份每天自動更新（watchdog.yml）。🚨 有「新」問題時才會在 GitHub Issue〈🚨 系統需要處理〉通知你。", "",
             f"## 現在的問題（{len(alerts)} 件，其中 {len(new)} 件是新的）", ""]
    lines += [f"- {m}{' 🆕' if k not in seen else ''}" for k, m in alerts] or ["- 沒有問題 👍"]
    lines += ["", "## 各頻道庫存", "", "| | 頻道 | 排到 | 剩 | 補到 14 天要幾集 |", "|---|---|---|---|---|"] + table
    lines += ["", "## 怎麼處理", "",
              "- 庫存不足：用「Gemini 寫稿」workflow 出稿 → ElevenLabs 配音 → Antigravity 渲染排程（見 docs/自動駕駛手冊.md）",
              "- 失敗／逾時：確認平台上沒有半成品 → 在佇列改時間 → 狀態改回「待發」",
              "- 卡住：到 Actions 頁看 IG／Threads 發文 workflow 是不是被停用（60 天沒 commit 的 repo，排程會被 GitHub 自動停）",
              "- 權杖：照 Drive SOP 06 換新權杖，整份覆蓋 GitHub Secret"]
    (HERE / "status.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    TMP.mkdir(parents=True, exist_ok=True)
    alert_f = TMP / "alert.md"
    if new:
        body = [f"**{now:%m/%d} 系統健康檢查發現 {len(new)} 件新問題**", ""] + [f"- {m}" for _, m in new]
        body += ["", f"全部問題與庫存表：[tools/watchdog/status.md](../blob/main/tools/watchdog/status.md)",
                 "處理方式見 [docs/自動駕駛手冊.md](../blob/main/docs/自動駕駛手冊.md)"]
        alert_f.write_text("\n".join(body) + "\n", encoding="utf-8")
    (TMP / "all_clear.flag").write_text("1" if not alerts else "0", encoding="utf-8")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
