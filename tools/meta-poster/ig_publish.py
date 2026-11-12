"""IG 定時發文：讀 ig_queue.csv，把「待發」且時間到了的輪播／Reel 用官方 API 發出去，結果寫回 csv。
token 只從環境變數 META_USER_TOKEN 讀（透過 meta.py），不寫進檔案、不印出來。

python ig_publish.py           發時間到了的
python ig_publish.py --check   只檢查權限與帳號，寫 ig_status.txt

規則
- publish_at 是台北時間。超過預定時間 3 小時還沒發的，標「逾時」不發，等 Jim 決定。
- 失敗標「失敗」並寫原因，不會重試；要重發把狀態改回「待發」。
- 每次最多發 4 則。
- media 是 repo 內的相對路徑，用 GitHub Pages 網址給 IG 抓（push 後約 1–2 分鐘才生效）。
"""
import csv, sys, time, pathlib
from datetime import datetime, timedelta, timezone

import meta

TPE = timezone(timedelta(hours=8))
BASE = "https://jay0916746661.github.io/jimframe-site/"
HERE = pathlib.Path(__file__).parent
QUEUE = HERE / "ig_queue.csv"
STATUS = HERE / "ig_status.txt"
LATE = timedelta(hours=3)


def accounts():
    out = {}
    for p in meta.pages():
        ig = p.get("instagram_business_account") or {}
        if ig.get("username"):
            out[ig["username"]] = (ig["id"], p["access_token"])
    return out


def wait_ready(cid, tok, tries=40):
    for _ in range(tries):
        st = meta.get(cid, tok, fields="status_code,status").get("status_code")
        if st == "FINISHED":
            return
        if st in ("ERROR", "EXPIRED"):
            raise RuntimeError(f"素材處理失敗：{st}")
        time.sleep(15)
    raise RuntimeError("素材處理超過 10 分鐘")


def publish(row, igid, tok):
    urls = [BASE + m for m in row["media"].split()]
    cap = row["caption"]
    if row["type"] == "reel":
        extra = {}
        if len(urls) > 1 and urls[1].lower().endswith((".jpg", ".jpeg", ".png")):
            extra["cover_url"] = urls[1]  # media 第二個是圖片＝Reel 封面
        c = meta.post(f"{igid}/media", tok, media_type="REELS", video_url=urls[0], caption=cap, share_to_feed="true", **extra)
        wait_ready(c["id"], tok)
        cid = c["id"]
    elif row["type"] == "carousel":
        kids = []
        for u in urls:
            k = meta.post(f"{igid}/media", tok, image_url=u, is_carousel_item="true")
            kids.append(k["id"])
        for k in kids:
            wait_ready(k, tok)
        c = meta.post(f"{igid}/media", tok, media_type="CAROUSEL", children=",".join(kids), caption=cap)
        wait_ready(c["id"], tok)
        cid = c["id"]
    else:
        raise RuntimeError(f"不認得的 type：{row['type']}")
    # 「Media ID is not available」常是 IG 還沒準備好；同一個容器只能發一次，重試不會重複發
    for attempt in range(4):
        try:
            return meta.post(f"{igid}/media_publish", tok, creation_id=cid)["id"]
        except Exception:  # noqa: BLE001
            if attempt == 3:
                raise
            time.sleep(30)


def read():
    with QUEUE.open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write(rows):
    with QUEUE.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()), quoting=csv.QUOTE_ALL)
        w.writeheader(); w.writerows(rows)


def check():
    lines = [f"檢查時間：{datetime.now(TPE):%Y-%m-%d %H:%M}（台北）"]
    try:
        perms = meta.get("me/permissions").get("data", [])
        ok = [p["permission"] for p in perms if p.get("status") == "granted"]
        lines.append("已授權：" + ", ".join(ok))
        lines.append("可以發 IG：" + ("是" if "instagram_content_publish" in ok else "否，缺 instagram_content_publish"))
        acc = accounts()
        need = sorted({r["account"] for r in read()})
        for a in need:
            lines.append(f"{a}：" + ("找得到" if a in acc else "找不到（粉專沒綁這個 IG 或權杖沒勾它）"))
    except Exception as e:  # noqa: BLE001
        lines.append(f"檢查失敗：{str(e)[:200]}")
    STATUS.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0


def main():
    rows = read()
    now = datetime.now(TPE)
    due = []
    for r in rows:
        if r["status"] != "待發":
            continue
        at = datetime.strptime(r["publish_at"], "%Y-%m-%d %H:%M").replace(tzinfo=TPE)
        if at > now:
            continue
        if now - at > LATE:
            r["status"], r["note"] = "逾時", f"超過 3 小時沒發（{now:%m-%d %H:%M} 檢查），沒有自動補發"
            continue
        due.append(r)
    if due:
        acc = accounts()
        for r in due[:4]:
            if r["account"] not in acc:
                r["status"], r["note"] = "失敗", "找不到這個 IG 帳號"
                continue
            igid, tok = acc[r["account"]]
            try:
                r["post_id"] = publish(r, igid, tok)
                r["status"], r["note"] = "已發", f"{datetime.now(TPE):%m-%d %H:%M} 發出"
            except Exception as e:  # noqa: BLE001
                r["status"], r["note"] = "失敗", str(e)[:200]
            print(f"{r['id']}：{r['status']} {r['note']}")
    write(rows)
    return 0


if __name__ == "__main__":
    sys.exit(check() if "--check" in sys.argv else main())
