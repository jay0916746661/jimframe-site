"""把 repo 組成 GitHub Pages 要發布的 _site/（上限 1GB）。

為什麼：repo 內容約 11GB（photos/ videos/ social/media/），整包丟給 Pages 一定部署失敗。
做法：
1. photos/、videos/ 不進網站包；網頁裡指到它們的網址，在包裡改成
   raw.githubusercontent.com 的同一個檔（repo 是公開的，直接讀 main 分支）。
   原始碼不用改，本機 python3 -m http.server 照樣能看。
2. social/media/ 只放「前 12 小時到後 48 小時內要發、還沒發」的素材，
   給 IG／FB／Threads 抓（發文程式另有 raw 備援）。每 6 小時重建一次。
3. 包超過 950MB 就讓工作失敗，不要硬推。

用法（在 repo 根目錄）：
  python3 tools/pages-build/build.py --list-social   # 只印出要放進包的 social 素材
  python3 tools/pages-build/build.py                 # 組 _site/
"""
import csv
import datetime as dt
import os
import re
import shutil
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "_site")
RAW = "https://raw.githubusercontent.com/jay0916746661/jimframe-site/main/"
PAGES = "https://jay0916746661.github.io/jimframe-site/"
LIMIT = 950 * 1024 * 1024
BACK_H, FWD_H = 12, 48
DONE = {"已發", "取消", "改MBS", "範例"}

# 不進網站包的目錄（photos／videos 走 raw；social/media 只放時間窗內的）
SKIP_TOP = {".git", ".github", "_site", "photos", "videos"}
# 這些目錄不是給瀏覽器看的頁面，不做網址改寫
NO_REWRITE = ("site-source/", "tools/", "tasks/", "scripts/", "sql/")
REWRITE_EXT = (".html", ".htm", ".js", ".mjs", ".css", ".json", ".webmanifest")

# "../photos/x.jpg"、`photos/${d}`、url(./videos/a.mp4) → raw 網址
REL = re.compile(r"""(?P<pre>["'`(=])(?:\.{1,2}/)*(?P<d>photos|videos)/""")
ABS = re.compile(re.escape(PAGES) + r"(?P<d>photos|videos)/")


def queue_rows():
    files = [
        ("tools/meta-poster/ig_queue.csv", "media"),
        ("tools/meta-poster/fb_queue.csv", "media"),
        ("tools/threads-poster/queue.csv", "image_url"),
    ]
    for path, col in files:
        full = os.path.join(ROOT, path)
        if not os.path.exists(full):
            continue
        with open(full, encoding="utf-8-sig", newline="") as f:
            for r in csv.DictReader(f):
                for m in re.split(r"[\s|]+", r.get(col) or ""):
                    yield r.get("publish_at", ""), r.get("status", ""), m


def social_window(now=None):
    now = now or dt.datetime.now(dt.timezone.utc).replace(tzinfo=None) + dt.timedelta(hours=8)  # 佇列是台北時間
    lo, hi = now - dt.timedelta(hours=BACK_H), now + dt.timedelta(hours=FWD_H)
    keep = set()
    for t, status, m in queue_rows():
        if not m:
            continue
        if status.strip() in DONE:
            continue
        try:
            when = dt.datetime.strptime(t.strip()[:16], "%Y-%m-%d %H:%M")
        except ValueError:
            continue
        if not lo <= when <= hi:
            continue
        p = m[len(PAGES):] if m.startswith(PAGES) else m
        if p.startswith("social/media/") and ".." not in p:
            keep.add(p)
    return sorted(keep)


def rewrite(text):
    text = ABS.sub(lambda m: RAW + m["d"] + "/", text)
    return REL.sub(lambda m: m["pre"] + RAW + m["d"] + "/", text)


def build():
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    window = set(social_window())
    total, changed, missing = 0, 0, []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        rel_dir = os.path.relpath(dirpath, ROOT).replace(os.sep, "/")
        rel_dir = "" if rel_dir == "." else rel_dir + "/"
        if rel_dir == "":
            dirnames[:] = [d for d in dirnames if d not in SKIP_TOP]
        for name in filenames:
            rel = rel_dir + name
            if rel.startswith("social/media/") and rel not in window:
                continue
            src = os.path.join(ROOT, rel)
            dst = os.path.join(OUT, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            if name.endswith(REWRITE_EXT) and not rel.startswith(NO_REWRITE):
                with open(src, encoding="utf-8", errors="surrogateescape") as f:
                    old = f.read()
                new = rewrite(old)
                changed += new != old
                with open(dst, "w", encoding="utf-8", errors="surrogateescape") as f:
                    f.write(new)
            else:
                shutil.copy2(src, dst)
            total += os.path.getsize(dst)
    for p in window:
        if not os.path.exists(os.path.join(OUT, p)):
            missing.append(p)
    print(f"網站包 {total / 1e6:.0f} MB；改寫網址的檔案 {changed} 個；social 素材 {len(window)} 個（缺 {len(missing)}）")
    for p in missing[:20]:
        print("  缺：", p)
    if total > LIMIT:
        sys.exit(f"網站包 {total / 1e6:.0f} MB 超過上限，停止部署")


if __name__ == "__main__":
    if "--list-social" in sys.argv:
        print("\n".join(social_window()))
    else:
        build()
