#!/usr/bin/env python3
"""記下佇列裡每支 Reel 的影片長度（秒），因為 IG insights 沒有長度、素材發出後又會刪掉。

只讀：tools/meta-poster/ig_queue.csv、social/media/ 裡的 mp4（用 ffprobe 讀檔頭）
只寫：social/reports/reel_durations.csv（只會新增列，不改舊列）

用法：python3 tools/insights-report/durations.py [--fetch]
  --fetch：檔案不在工作目錄時，用 git show 從 repo 拿（給 GitHub Actions 的 blob:none 部分 clone 用）
"""
import argparse
import csv
import os
import subprocess
import sys
import tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "social/reports/reel_durations.csv")
QUEUE = os.path.join(ROOT, "tools/meta-poster/ig_queue.csv")
MAX_FETCH = 200


def probe(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", path], capture_output=True, text=True)
    try:
        return round(float(r.stdout.strip()), 1)
    except ValueError:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fetch", action="store_true")
    a = ap.parse_args()
    done = set()
    if os.path.exists(OUT):
        with open(OUT, encoding="utf-8-sig") as fh:
            done = {r["media"] for r in csv.DictReader(fh)}
    with open(QUEUE, encoding="utf-8-sig") as fh:
        rows = [r for r in csv.DictReader(fh) if r["type"] == "reel" and r["media"].strip()]
    new, fetched = [], 0
    for r in rows:
        m = r["media"].split()[0]
        if m in done or not m.endswith(".mp4"):
            continue
        p = os.path.join(ROOT, m)
        tmp = None
        if not os.path.exists(p):
            if not a.fetch or fetched >= MAX_FETCH:
                continue
            # 已發出、檔案已刪的就跳過（只查樹，不下載）
            if subprocess.run(["git", "-C", ROOT, "cat-file", "-e", f"HEAD:{m}"],
                              stderr=subprocess.DEVNULL).returncode != 0:
                continue
            tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
            ok = subprocess.run(["git", "-C", ROOT, "show", f"HEAD:{m}"], stdout=tmp).returncode == 0
            tmp.close()
            fetched += 1
            if not ok:
                os.unlink(tmp.name)
                continue
            p = tmp.name
        sec = probe(p)
        if tmp:
            os.unlink(tmp.name)
        if sec:
            new.append({"qid": r["id"], "account": r["account"], "media": m, "seconds": sec})
            done.add(m)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    exists = os.path.exists(OUT)
    with open(OUT, "a", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["qid", "account", "media", "seconds"])
        if not exists:
            w.writeheader()
        w.writerows(new)
    print(f"新增 {len(new)} 支長度紀錄（從 repo 拿 {fetched} 支）", file=sys.stderr)


if __name__ == "__main__":
    main()
