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
    for line in os.environ.get("THREADS_TOKENS", "").splitlines():
        line = line.strip()
        if "=" in line:
            acct, tok = line.split("=", 1)
            if acct.strip() and tok.strip():
                tokens[acct.strip().lstrip("@")] = tok.strip()
    return tokens


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
    params = {"text": text}
    if image_url:
        params.update(media_type="IMAGE", image_url=image_url)
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
    time.sleep(30 if image_url else 5)
    for attempt in range(2):  # 最多重試 2 次
        try:
            return api("POST", "me/threads_publish", token, creation_id=cid)["id"]
        except RuntimeError:
            if attempt == 1:
                raise
            time.sleep(20)


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
            print(f"{acct}: {'OK' if ok else '帳號名稱不符，token 實際是 ' + me.get('username', '?')}")
            bad += 0 if ok else 1
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
    for r in sorted(rows, key=lambda x: x["publish_at"]):
        if r["status"] != "待發" or not r["publish_at"]:
            continue
        try:
            due = datetime.strptime(r["publish_at"], "%Y-%m-%d %H:%M").replace(tzinfo=TPE)
        except ValueError:
            r["status"], r["note"] = "失敗", "publish_at 格式要像 2026-11-01 10:00"
            continue
        acct = r["account"].lstrip("@")
        if due > now or acct in blocked:
            continue
        if sent >= PER_RUN_CAP or sent_today.get(acct, 0) >= DAILY_CAP:
            continue
        if len(r["text"]) > MAX_LEN:
            r["status"], r["note"] = "失敗", f"超過 {MAX_LEN} 字（{len(r['text'])} 字）"
            blocked.add(acct)
            continue
        if acct not in tokens:
            r["status"], r["note"] = "失敗", "THREADS_TOKENS 裡沒有這個帳號"
            blocked.add(acct)
            continue
        if dry:
            print(f"[會發] {r['id']} {acct} {r['publish_at']} {r['text'][:30]}…")
            sent += 1
            continue
        try:
            pid = publish(tokens[acct], r["text"], r["image_url"], r["topic_tag"])
            r["status"], r["post_id"] = "已發", pid
            r["note"] = f"{datetime.now(TPE):%Y-%m-%d %H:%M} 發出"
            sent_today[acct] = sent_today.get(acct, 0) + 1
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
