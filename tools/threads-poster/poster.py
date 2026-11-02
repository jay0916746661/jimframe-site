"""Threads 自動發文：讀 queue.csv，時間到的「待發」列用官方 Threads API 發出去。

token 只從環境變數 THREADS_TOKENS 讀（每行 帳號=token），不寫進任何檔案。
用法：
  python poster.py            # 發出時間已到的列
  python poster.py --dry-run  # 只列出會發哪些，不真的發
  python poster.py --check    # 檢查每個 token 能不能用（不發文）
"""
import csv
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests

API = "https://graph.threads.net/v1.0"
TPE = timezone(timedelta(hours=8))
QUEUE = Path(__file__).with_name("queue.csv")
FIELDS = ["id", "account", "publish_at", "text", "image_url", "topic_tag", "status", "post_id", "note"]
MAX_LEN = 500
DAILY_CAP = 8      # 每帳號每天最多發幾則（程式自己的上限）
PER_RUN_CAP = 6    # 每次執行最多發幾則


def load_tokens():
    tokens = {}
    # 主清單 THREADS_TOKENS＋追加清單 THREADS_TOKENS_EXTRA（新帳號放這裡，不用重貼舊的）
    raw = os.environ.get("THREADS_TOKENS", "") + "\n" + os.environ.get("THREADS_TOKENS_EXTRA", "")
    for line in raw.splitlines():
        line = line.strip()
        if "=" in line:
            acct, tok = line.split("=", 1)
            if acct.strip() and tok.strip():
                tokens[acct.strip().lstrip("@")] = tok.strip()
    return tokens


_resolved = False


def resolve_names(tokens):
    """前面的名字打錯也沒關係：用 token 查出真正的帳號名稱，補一個對照。"""
    global _resolved
    if _resolved:
        return
    _resolved = True
    for label, tok in list(tokens.items()):
        try:
            name = api("GET", "me", tok, fields="username").get("username", "")
        except RuntimeError:
            continue
        if name and name not in tokens:
            tokens[name] = tok


def scrub(msg, tokens):
    msg = str(msg)
    for t in tokens.values():
        msg = msg.replace(t, "***")
    return msg[:300]


def api(method, path, token, **params):
    params["access_token"] = token
    r = requests.request(method, f"{API}/{path}", data=params if method == "POST" else None,
                         params=params if method == "GET" else None, timeout=60)
    try:
        body = r.json()
    except ValueError:
        body = {"raw": r.text[:200]}
    if r.status_code != 200 or "error" in body:
        err = body.get("error", {}) if isinstance(body, dict) else {}
        raise RuntimeError(f"HTTP {r.status_code}: {err.get('message') or body}")
    return body


def publish(token, text, image_url="", topic_tag=""):
    """image_url 可放多張，用 | 隔開：1 張＝單圖，2–20 張＝輪播。"""
    urls = [u.strip() for u in (image_url or "").split("|") if u.strip()][:20]
    params = {"text": text}
    if len(urls) >= 2:
        kids = []
        for u in urls:
            kids.append(api("POST", "me/threads", token, media_type="IMAGE",
                            image_url=u, is_carousel_item="true")["id"])
        time.sleep(30)
        params.update(media_type="CAROUSEL", children=",".join(kids))
    elif urls and urls[0].split("?")[0].lower().endswith((".mp4", ".mov")) or (urls and "video" in urls[0][:60]):
        params.update(media_type="VIDEO", video_url=urls[0])
    elif urls:
        params.update(media_type="IMAGE", image_url=urls[0])
    else:
        params["media_type"] = "TEXT"
    if topic_tag:
        params["topic_tag"] = topic_tag
    try:
        creation = api("POST", "me/threads", token, **params)
    except RuntimeError as e:
        if topic_tag and "topic" in str(e).lower():  # API 不收主題標籤就略過
            params.pop("topic_tag")
            creation = api("POST", "me/threads", token, **params)
        else:
            raise
    cid = creation["id"]
    time.sleep(30 if urls else 5)
    if params.get("media_type") == "VIDEO":  # 影片要等 Threads 處理完
        for _ in range(20):
            st = api("GET", cid, token, fields="status,error_message")
            if st.get("status") == "FINISHED":
                break
            if st.get("status") == "ERROR":
                raise RuntimeError(f"影片處理失敗：{st.get('error_message')}")
            time.sleep(15)
    for attempt in range(3):
        try:
            return api("POST", "me/threads_publish", token, creation_id=cid)["id"]
        except RuntimeError:
            if attempt == 2:
                raise
            time.sleep(30)


def resolve_ig_video(account, day):
    """igvideo:today → 找這個帳號在 IG 當天發的 Reel，回傳 (影片網址, IG 文案)。"""
    tok = os.environ.get("META_USER_TOKEN", "").strip()
    if not tok:
        raise RuntimeError("沒有 META_USER_TOKEN，抓不到 IG 影片")
    g = "https://graph.facebook.com/v21.0"
    pages = requests.get(f"{g}/me/accounts", params={"access_token": tok, "limit": 100,
                         "fields": "access_token,instagram_business_account{id,username}"}, timeout=60).json()
    for p in pages.get("data", []):
        ig = p.get("instagram_business_account") or {}
        if ig.get("username") != account:
            continue
        media = requests.get(f"{g}/{ig['id']}/media", params={"access_token": p["access_token"], "limit": 10,
                             "fields": "media_type,media_product_type,media_url,caption,timestamp"}, timeout=60).json()
        for m in media.get("data", []):
            ts = datetime.strptime(m["timestamp"][:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc).astimezone(TPE)
            if m.get("media_type") == "VIDEO" and ts.strftime("%Y-%m-%d") == day and m.get("media_url"):
                return m["media_url"], m.get("caption", "")
        raise RuntimeError(f"{account} 在 IG 上 {day} 還沒有 Reel")
    raise RuntimeError(f"META_USER_TOKEN 裡找不到 {account}")


def short_caption(c, limit=480):
    c = c.strip()
    if len(c) <= limit:
        return c
    cut = c[:limit]
    return cut[: max(cut.rfind("\n"), cut.rfind("。")) + 1] or cut


def read_queue():
    with QUEUE.open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    for r in rows:
        for k in FIELDS:
            r[k] = (r.get(k) or "").strip() if k != "text" else (r.get(k) or "").strip("\n ")
    return rows


def write_queue(rows):
    with QUEUE.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS, quoting=csv.QUOTE_ALL)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in FIELDS})


def check(tokens):
    if not tokens:
        print("THREADS_TOKENS 是空的")
        return 1
    bad = 0
    for acct, tok in tokens.items():
        try:
            me = api("GET", "me", tok, fields="username")
            ok = me.get("username", "").lower() == acct.lower()
            # 名稱打錯只是提醒：發文時 resolve_names 會自動對上，不算失敗
            print(f"{acct}: {'OK' if ok else 'OK（前面名字打錯，實際是 ' + me.get('username', '?') + '，不影響發文）'}")
        except RuntimeError as e:
            print(f"{acct}: 失敗 {scrub(e, tokens)}")
            bad += 1
    return 1 if bad else 0


def main():
    dry = "--dry-run" in sys.argv
    tokens = load_tokens()
    if "--check" in sys.argv:
        sys.exit(check(tokens))

    rows = read_queue()
    now = datetime.now(TPE)
    today = now.strftime("%Y-%m-%d")
    sent_today = {}
    for r in rows:
        if r["status"] == "已發" and r["note"].startswith(today):
            sent_today[r["account"]] = sent_today.get(r["account"], 0) + 1

    blocked = {r["account"] for r in rows if r["status"] == "失敗"}  # 有失敗的帳號先停，等 Jim 處理
    sent = 0
    sent_this_run = set()  # 每次執行每個帳號最多發 1 則，補發時才不會一口氣全擠在同一分鐘
    for r in sorted(rows, key=lambda x: x["publish_at"]):
        if r["status"] != "待發" or not r["publish_at"]:
            continue
        try:
            due = datetime.strptime(r["publish_at"], "%Y-%m-%d %H:%M").replace(tzinfo=TPE)
        except ValueError:
            r["status"], r["note"] = "失敗", "publish_at 格式要像 2026-11-01 10:00"
            continue
        acct = r["account"].lstrip("@")
        if due > now or acct in blocked or acct in sent_this_run:
            continue
        if sent >= PER_RUN_CAP or sent_today.get(acct, 0) >= DAILY_CAP:
            continue
        if len(r["text"]) > MAX_LEN:
            r["status"], r["note"] = "失敗", f"超過 {MAX_LEN} 字（{len(r['text'])} 字）"
            blocked.add(acct)
            continue
        if acct not in tokens:
            resolve_names(tokens)
        if acct not in tokens:
            # 不標失敗：可能是這次執行還沒讀到新加的權杖，留著「待發」等下一輪
            print(f"[略過] {r['id']} {acct}：這次執行讀不到它的權杖，保留待發")
            blocked.add(acct)
            continue
        if dry:
            print(f"[會發] {r['id']} {acct} {r['publish_at']} {r['text'][:30]}…")
            sent += 1
            continue
        try:
            if r["image_url"].startswith("igvideo:"):
                vurl, cap = resolve_ig_video(acct, r["publish_at"][:10])
                r["text"] = r["text"] or short_caption(cap)
                r["image_url"] = vurl
            try:
                pid = publish(tokens[acct], r["text"], r["image_url"], r["topic_tag"])
            except Exception as e:  # noqa: BLE001
                if not r["image_url"]:
                    raise
                print(f"[附圖失敗，改發純文字] {r['id']}: {scrub(e, tokens)}")
                pid = publish(tokens[acct], r["text"], "", r["topic_tag"])
                r["image_url"] = ""
            r["status"], r["post_id"] = "已發", pid
            r["note"] = f"{datetime.now(TPE):%Y-%m-%d %H:%M} 發出"
            sent_today[acct] = sent_today.get(acct, 0) + 1
            sent_this_run.add(acct)
            print(f"[已發] {r['id']} {acct} → {pid}")
        except Exception as e:  # noqa: BLE001
            r["status"], r["note"] = "失敗", scrub(e, tokens)
            blocked.add(acct)
            print(f"[失敗] {r['id']} {acct}: {r['note']}")
        sent += 1
        time.sleep(10)

    if not dry:
        write_queue(rows)
    print(f"本次處理 {sent} 則")


if __name__ == "__main__":
    main()
