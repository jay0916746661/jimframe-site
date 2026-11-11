"""發出即刪：把 social/media 裡「已經發完」的素材刪掉，讓 GitHub Pages 網站不會越長越大。

python tools/media-prune/prune.py            只列出會刪哪些（不動檔案）
python tools/media-prune/prune.py --apply    真的刪

一個檔案要同時符合才會刪：
1. 至少被一列佇列引用（IG、Threads、FB 三個佇列都看）；
2. 引用它的每一列狀態都是「已發」（有任何一列是待發、失敗、逾時、取消、範例就留著）；
3. 最後一次發出的預定時間已經過了 GRACE_DAYS 天（留時間給補發）。
沒被任何佇列引用的檔案不刪，只列出來。不碰 photos/、videos/，不需要任何 token。
"""
import csv
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MEDIA = ROOT / "social" / "media"
TPE = timezone(timedelta(hours=8))
GRACE_DAYS = 2
KEEP = {"README.md"}
PREFIX = re.compile(
    r"^https://(jay0916746661\.github\.io/jimframe-site"
    r"|raw\.githubusercontent\.com/jay0916746661/jimframe-site/(refs/heads/)?main)/"
)
# (佇列檔, 放素材的欄位, 分隔符號)
QUEUES = [
    ("tools/meta-poster/ig_queue.csv", "media", None),
    ("tools/meta-poster/fb_queue.csv", "media", None),
    ("tools/threads-poster/queue.csv", "image_url", "|"),
]


def refs():
    """回傳 {相對路徑: [(狀態, 預定時間), ...]}"""
    out = {}
    for path, col, sep in QUEUES:
        f = ROOT / path
        if not f.exists():
            continue
        with f.open(encoding="utf-8-sig", newline="") as fh:
            for r in csv.DictReader(fh):
                for p in (r.get(col) or "").split(sep):
                    p = PREFIX.sub("", p.strip()).split("?")[0]
                    if p.startswith("social/media/"):
                        out.setdefault(p, []).append(((r.get("status") or "").strip(), (r.get("publish_at") or "").strip()))
    return out


def main():
    apply = "--apply" in sys.argv
    cutoff = (datetime.now(TPE) - timedelta(days=GRACE_DAYS)).strftime("%Y-%m-%d %H:%M")
    used = refs()
    delete, orphan, kept = [], [], 0
    for f in sorted(MEDIA.rglob("*")):
        if not f.is_file() or f.name in KEEP:
            continue
        rel = f.relative_to(ROOT).as_posix()
        rows = used.get(rel)
        if not rows:
            orphan.append(f)
        elif all(s == "已發" for s, _ in rows) and max(t for _, t in rows) <= cutoff:
            delete.append(f)
        else:
            kept += f.stat().st_size
    size = sum(f.stat().st_size for f in delete)
    print(f"{'刪除' if apply else '會刪'} {len(delete)} 個檔、{size / 1e6:.0f} MB；保留 {kept / 1e6:.0f} MB")
    by = {}
    for f in delete:
        ch = f.relative_to(MEDIA).parts[0]
        by[ch] = by.get(ch, 0) + f.stat().st_size
    for ch, s in sorted(by.items()):
        print(f"  {ch}: {s / 1e6:.0f} MB")
    if orphan:
        print(f"沒被任何佇列引用（不刪，請人看）：{len(orphan)} 個檔、{sum(f.stat().st_size for f in orphan) / 1e6:.0f} MB")
        for f in orphan[:20]:
            print("  ", f.relative_to(ROOT).as_posix())
    if apply:
        for f in delete:
            f.unlink()


if __name__ == "__main__":
    main()
