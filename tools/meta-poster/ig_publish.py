"""IG 定時發文：讀 ig_queue.csv，把「待發」且時間到了的輪播／Reel 用官方 API 發出去，結果寫回 csv。
token 只從環境變數 META_USER_TOKEN 讀（透過 meta.py），不寫進檔案、不印出來。

python ig_publish.py           發時間到了的
python ig_publish.py --check   只檢查權限與帳號，寫 ig_status.txt

規則
- publish_at 是台北時間。超過預定時間 3 小時還沒發的，標「逾時」不發，等 Jim 決定。
- 暫時性錯誤（2207085、內部錯誤、請稍後再試、rate limit）保持「待發」並累加 retry，
  下一輪自動再試；retry 滿 3 次才標「失敗」。其他錯誤直接標「失敗」。
- trial 欄填 MANUAL 或 SS_PERFORMANCE 就發成試用 Reel（只給非粉絲看，不推主頁）；
  留空＝照舊的正式 Reel。只對 type=reel 有效。
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
FIELDS = ["id", "account", "publish_at", "type", "media", "caption", "status", "post_id", "note", "retry", "trial"]
MAX_RETRY = 3      # 暫時性錯誤重試到第幾次才真的標失敗
# Meta 這幾種錯誤是暫時性的，訊息自己就寫「請稍後再試」，標成失敗等於白白丟掉一則
TRANSIENT = ("2207085", "內部錯誤", "請稍後再試", "rate limit", "please try again", "temporarily")


def is_transient(msg):
    m = str(msg).lower()
    return any(k.lower() in m for k in TRANSIENT)


def accounts():
    out = {}
    for p in meta.pages():
        ig = p.get("instagram_business_account") or {}
        if ig.get("username"):
            out[ig["username"]] = (ig["id"], p["access_token"])
    out.update(meta.ig_login_accounts())  # 沒綁粉專、改用 Instagram 登入的帳號（例：perfume101tw）
    # 改過帳號名稱的：新舊名稱都認得（2026-11-28 tech101_ai 改名 philosophy101.tw）
    for new, old in RENAMED.items():
        if new in out and old not in out: out[old] = out[new]
        if old in out and new not in out: out[new] = out[old]
    return out

RENAMED = {"philosophy101.tw": "tech101_ai"}


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
    urls = [meta.live_url(BASE + m) for m in row["media"].split()]
    cap = row["caption"]
    if row["type"] == "reel":
        extra = {}
        if len(urls) > 1 and urls[1].lower().endswith((".jpg", ".jpeg", ".png")):
            extra["cover_url"] = urls[1]  # media 第二個是圖片＝Reel 封面
        trial = (row.get("trial") or "").strip().upper()
        if trial:
            # 試用 Reel 只發給非粉絲，所以不能同時推到主頁（share_to_feed）
            # graduation_strategy：MANUAL＝自己在 App 裡決定要不要轉正式；SS_PERFORMANCE＝表現好就自動轉
            extra["trial_params"] = {"graduation_strategy": trial if trial == "SS_PERFORMANCE" else "MANUAL"}
        else:
            extra["share_to_feed"] = "true"
        c = meta.post(f"{igid}/media", tok, media_type="REELS", video_url=urls[0], caption=cap, **extra)
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
        rows = list(csv.DictReader(f))
    for r in rows:
        for k in ("retry", "trial"):
            r[k] = (r.get(k) or "").strip()
    return rows


def write(rows):
    with QUEUE.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS, quoting=csv.QUOTE_ALL)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in FIELDS})


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
                r["status"], r["note"] = "失敗", "找不到這個 IG 帳號" + (f"（{'；'.join(meta.DIAG)}）" if meta.DIAG else "")
                continue
            igid, tok = acc[r["account"]]
            try:
                r["post_id"] = publish(r, igid, tok)
                r["status"], r["note"] = "已發", f"{datetime.now(TPE):%m-%d %H:%M} 發出"
            except Exception as e:  # noqa: BLE001
                msg = str(e)
                n = int(r.get("retry") or 0) + 1
                r["retry"] = str(n)
                stamp = f"{datetime.now(TPE):%m-%d %H:%M}"
                if is_transient(msg) and n < MAX_RETRY:
                    # 維持待發，下一輪自動再試
                    r["note"] = f"{stamp} 第 {n} 次暫時性失敗，保持待發：{msg}"[:200]
                else:
                    r["status"] = "失敗"
                    r["note"] = f"{stamp} 第 {n} 次失敗：{msg}"[:200]
            print(f"{r['id']}：{r['status']} {r['note']}")
    write(rows)
    return 0


if __name__ == "__main__":
    sys.exit(check() if "--check" in sys.argv else main())
