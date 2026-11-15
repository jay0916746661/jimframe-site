"""只讀：抓 art101.tw 貼文底下含關鍵字的留言，存成 social/insights/ig_keyword_comments.csv。
不回覆、不私訊、不刪除。需要權限 instagram_basic＋instagram_manage_comments（或 business 版）。"""
import csv, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from meta import get, pages

ACCOUNT = os.environ.get("IG_ACCOUNT", "art101.tw")
KEYWORD = os.environ.get("IG_KEYWORD", "名畫")
SINCE = os.environ.get("IG_SINCE", "2026-11-12")
OUT = "social/insights/ig_keyword_comments.csv"

perms = [p["permission"] for p in get("me/permissions").get("data", []) if p.get("status") == "granted"]
print("已授權：", ", ".join(perms))
page = next(p for p in pages() if (p.get("instagram_business_account") or {}).get("username") == ACCOUNT)
igid, tok = page["instagram_business_account"]["id"], page["access_token"]
media = get(f"{igid}/media", tok, fields="id,caption,timestamp,permalink,comments_count", limit=60)["data"]
rows = []
for m in media:
    if m["timestamp"][:10] < SINCE or not m.get("comments_count"):
        continue
    title = (m.get("caption") or "").split("\n")[0][:30]
    try:
        cs = get(f"{m['id']}/comments", tok, fields="id,text,username,timestamp,replies{username,text}", limit=100)["data"]
    except RuntimeError as e:
        print("讀不到留言：", e); sys.exit(1)
    for c in cs:
        if KEYWORD in (c.get("text") or ""):
            replied = any(r.get("username") == ACCOUNT for r in (c.get("replies") or {}).get("data", []))
            rows.append({"post_time": m["timestamp"], "post": title, "permalink": m["permalink"],
                         "username": c.get("username", ""), "comment": c.get("text", ""),
                         "comment_time": c["timestamp"], "comment_id": c["id"], "已公開回覆": "是" if replied else "否"})
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, ["post_time", "post", "permalink", "username", "comment", "comment_time", "comment_id", "已公開回覆"])
    w.writeheader(); w.writerows(sorted(rows, key=lambda r: r["comment_time"]))
print(f"找到 {len(rows)} 則含「{KEYWORD}」的留言")
