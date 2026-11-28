#!/usr/bin/env python3
"""IG 全頻道數據體檢／週報。

只讀：social/insights/ig_insights_*.csv、tools/meta-poster/ig_queue.csv
只寫：social/reports/（JSON 數據＋Markdown 週報）
不碰佇列、不刪任何檔案、不需要網路、不需要 Claude。

用法：python3 tools/insights-report/report.py [--out social/reports] [--date YYYY-MM-DD]
"""
from __future__ import annotations

import argparse
import csv
import glob
import json
import os
import re
import statistics as st
from collections import defaultdict
from datetime import datetime, timedelta, timezone

TPE = timezone(timedelta(hours=8))
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MIN_N = 8          # 一組少於這個數字就標「樣本太少」
MATURE_H = 72      # 發出未滿 72 小時的 Reel 觀看還在長，不拿來比

# 改名對照：舊帳號 → 現在的帳號
RENAMED_ON = "2026-11-28"   # 這天改名換題材；之前的 Reel 是舊題材，不拿來下結論
RENAME = {
    "tech101_ai": "philosophy101.tw",
    "love.manual.tw": "taiwan.mountainsea",
    "astro_labtw": "taipei.weekendmap",
}
NAMES = {
    "coffeestory101": "咖啡101",
    "jazz101tw": "爵士101",
    "theguitarstory101": "六弦101",
    "perfume101tw": "香水101",
    "art101.tw": "藝術101",
    "philosophy101.tw": "哲學101",
    "reading.after": "讀完之後",
    "untold.trip0": "觀光客沒說的事",
    "drinkstory.tw": "酒精的故事",
    "socialdance101": "Social Dance 101",
    "jimframe": "jimframe",
    "taiwan.mountainsea": "台灣山與海",
    "taipei.weekendmap": "雙北週末地圖",
}


def num(v):
    try:
        return float(v) if v not in ("", None) else None
    except ValueError:
        return None


def med(xs):
    xs = [x for x in xs if x is not None]
    return round(st.median(xs), 1) if xs else None


def parse_ts(s):
    return datetime.strptime(s, "%Y-%m-%dT%H:%M:%S%z").astimezone(TPE)


# ---------- 讀資料 ----------

def load_snapshots():
    files = sorted(glob.glob(os.path.join(ROOT, "social/insights/ig_insights_2*.csv")))
    snaps = []
    for f in files:
        d = re.search(r"(\d{8})", os.path.basename(f)).group(1)
        with open(f, encoding="utf-8-sig") as fh:
            rows = list(csv.DictReader(fh))
        snaps.append((d, rows))
    return snaps


def load_queue():
    p = os.path.join(ROOT, "tools/meta-poster/ig_queue.csv")
    with open(p, encoding="utf-8-sig") as fh:
        return list(csv.DictReader(fh))


def variant_of(q):
    if not q:
        return "MBS／早期（佇列外）"
    qid, trial = q["id"], q.get("trial", "")
    if qid.startswith("en-"):
        return "英文版"
    if re.search(r"-t$|short|trial|guess|quiz", qid):
        return "試驗版"
    if trial:
        return "試用 Reel"
    return "正式版"


# ---------- 鉤子分類（看文案第一句，影片開頭通常跟它一樣） ----------

HOOKS = [
    ("問句", r"[？?]"),
    ("反轉／否定", r"不是|卻|其實|竟|沒有|沒見過|可能是|從來|才不|誤會|罵人|騙"),
    ("數字開頭", r"^[\d０-９一二三四五六七八九十百千萬]+[ 　年月日個種次位支杯張]"),
    ("引號開頭", r"^[「『“\"]"),
    ("年份／時間開頭", r"^(\d{3,4}\s*年|\d{1,2}/\d{1,2}|每晚|那天|那一夜)"),
]
TOOL_WORDS = r"差在哪|怎麼選|怎麼看|先看|三件事|教你|攻略|入門|vs|VS|比較|分辨|秘訣|技巧|設定|要點|清單"


def first_line(caption):
    s = (caption or "").strip().split("\n")[0]
    s = re.split(r"[▍]", s)[0].strip()
    return s[:60]


def hook_type(line):
    for name, pat in HOOKS:
        if re.search(pat, line):
            return name
    return "直述"


def form_of(caption):
    return "工具／知識型" if re.search(TOOL_WORDS, caption or "") else "故事型"


# ---------- 主流程 ----------

def build(as_of: datetime | None = None):
    snaps = load_snapshots()
    queue = load_queue()
    by_post = {q["post_id"]: q for q in queue if q.get("post_id")}
    last_date = snaps[-1][0]
    last_ids = {r["id"] for r in snaps[-1][1]}
    # 每個帳號最多抓 100 則，舊貼文會掉出最新快照；只有比「最新快照裡最舊那則」還新、卻不見了的，才算被刪
    oldest = {}
    for r in snaps[-1][1]:
        t = parse_ts(r["timestamp"])
        oldest[r["username"]] = min(oldest.get(r["username"], t), t)

    obs = defaultdict(list)  # id -> [(快照時的小時數, views)]
    media = {}       # id -> 最新一次快照
    first_seen = {}  # id -> (日期, views)
    followers = defaultdict(dict)  # acct -> {date: n}
    for d, rows in snaps:
        for r in rows:
            a = RENAME.get(r["username"], r["username"])
            followers[a][d] = int(num(r["followers_count"]) or 0)
            r = dict(r, _snap=d, _acct=a)
            try:
                age = (datetime.strptime(d, "%Y%m%d").replace(hour=10, tzinfo=TPE) - parse_ts(r["timestamp"])).total_seconds() / 3600
                obs[r["id"]].append((round(age), num(r["views"]) or 0))
            except ValueError:
                pass
            media[r["id"]] = r
            first_seen.setdefault(r["id"], (d, num(r["views"]) or 0))

    snap_time = {d: datetime.strptime(d, "%Y%m%d").replace(hour=10, tzinfo=TPE) for d, _ in snaps}
    as_of = as_of or snap_time[last_date]

    dur = {}
    dp = os.path.join(ROOT, "social/reports/reel_durations.csv")
    if os.path.exists(dp):
        with open(dp, encoding="utf-8-sig") as fh:
            dur = {r["qid"]: float(r["seconds"]) for r in csv.DictReader(fh)}

    reels = []
    for mid, r in media.items():
        if r["media_product_type"] != "REELS":
            continue
        q = by_post.get(mid)
        ts = parse_ts(r["timestamp"])
        age_h = (snap_time[r["_snap"]] - ts).total_seconds() / 3600
        views = num(r["views"]) or 0
        line = first_line(r["caption"])
        removed = r["username"] in oldest and mid not in last_ids and ts >= oldest[r["username"]]
        reels.append({
            "id": mid,
            "acct": r["_acct"],
            "name": NAMES.get(r["_acct"], r["_acct"]),
            "qid": q["id"] if q else "",
            "variant": variant_of(q),
            "time": ts.strftime("%Y-%m-%d %H:%M"),
            "date": ts.strftime("%Y-%m-%d"),
            "week": (ts - timedelta(days=ts.weekday())).strftime("%m/%d"),
            "hour": ts.hour,
            "slot": slot_of(ts.hour),
            "weekday": "一二三四五六日"[ts.weekday()],
            "age_h": round(age_h),
            "mature": age_h >= MATURE_H,
            "views": int(views),
            "reach": int(num(r["reach"]) or 0),
            "likes": int(num(r["like_count"]) or 0),
            "comments": int(num(r["comments_count"]) or 0),
            "shares": int(num(r["shares"]) or 0),
            "saved": int(num(r["saved"]) or 0),
            "watch_s": round((num(r["ig_reels_avg_watch_time"]) or 0) / 1000, 1),
            "length_s": dur.get(q["id"]) if q else None,
            "hook": line,
            "hook_type": hook_type(line),
            "form": form_of(r["caption"]),
            "permalink": r["permalink"],
            "snap": r["_snap"],
            "removed": removed,
        })
    for x in reels:
        L = x["length_s"]
        x["length_bin"] = None if not L else ("30 秒內" if L <= 30 else "30–45 秒" if L <= 45 else "45–60 秒" if L <= 60 else "60 秒以上")
        x["watch_pct"] = round(x["watch_s"] / L * 100) if L and x["watch_s"] else None
        v = x["views"] or 0
        x["share_k"] = round(x["shares"] / v * 1000, 1) if v else None
        x["save_k"] = round(x["saved"] / v * 1000, 1) if v else None

    # 每個頻道的中位數，用來把觀看換成「對自己頻道中位數的倍數」，才能跨頻道比
    ch_med = {}
    for a in {x["acct"] for x in reels}:
        m = med([x["views"] for x in reels if x["acct"] == a and x["mature"] and not x["removed"]])
        ch_med[a] = m
    for x in reels:
        m = ch_med.get(x["acct"])
        x["rel"] = round(x["views"] / m, 2) if m else None

    return {
        "as_of": as_of.strftime("%Y-%m-%d %H:%M"),
        "snapshot": last_date,
        "snapshots": [d for d, _ in snaps],
        "reels": sorted(reels, key=lambda x: x["time"]),
        "followers": followers,
        "queue": queue,
        "media_all": media,
        "first_seen": first_seen,
        "obs": obs,
    }


def slot_of(h):
    if 6 <= h < 11:
        return "早上 06–11"
    if 11 <= h < 14:
        return "中午 11–14"
    if 14 <= h < 19:
        return "下午 14–19"
    if 19 <= h < 22:
        return "晚上 19–22"
    return "深夜 22–06"


def group(reels, key, metric="rel"):
    g = defaultdict(list)
    for x in reels:
        g[x[key]].append(x)
    out = []
    for k, xs in g.items():
        out.append({
            "group": k,
            "n": len(xs),
            "rel_med": med([x["rel"] for x in xs]),
            "views_med": med([x["views"] for x in xs]),
            "watch_med": med([x["watch_s"] for x in xs]),
            "share_k_med": med([x["share_k"] for x in xs]),
            "save_k_med": med([x["save_k"] for x in xs]),
            "few": len(xs) < MIN_N,
        })
    return sorted(out, key=lambda r: -(r["rel_med"] or 0))


def channel_table(data):
    reels = [x for x in data["reels"] if not x["removed"]]
    snaps = data["snapshots"]
    last = snaps[-1]
    rows = []
    for a, fs in data["followers"].items():
        xs = [x for x in reels if x["acct"] == a]
        if not xs:
            continue
        mature = [x for x in xs if x["mature"]]
        last_dt = datetime.strptime(last, "%Y%m%d").replace(tzinfo=TPE)
        recent = [x for x in mature if (last_dt - datetime.strptime(x["date"], "%Y-%m-%d").replace(tzinfo=TPE)).days <= 17]
        older = [x for x in mature if 17 < (last_dt - datetime.strptime(x["date"], "%Y-%m-%d").replace(tzinfo=TPE)).days <= 31]
        dates = sorted(fs)
        f_now = fs[dates[-1]]
        # 追蹤轉換：兩次快照之間，帳號漲粉 ÷ 同期所有貼文新增觀看（每千次）
        conv = follow_conversion(data, a)
        rows.append({
            "acct": a,
            "name": NAMES.get(a, a),
            "followers": f_now,
            "followers_first": fs[dates[0]],
            "followers_first_date": dates[0],
            "followers_last_date": dates[-1],
            "stale": dates[-1] != last,
            "reels": len(xs),
            "mature": len(mature),
            "views_med": med([x["views"] for x in mature]),
            "views_med_recent": med([x["views"] for x in recent]),
            "n_recent": len(recent),
            "views_med_older": med([x["views"] for x in older]),
            "n_older": len(older),
            "watch_med": med([x["watch_s"] for x in mature]),
            "share_k_med": med([x["share_k"] for x in mature]),
            "save_k_med": med([x["save_k"] for x in mature]),
            "views_max": max((x["views"] for x in xs), default=0),
            "hit_rate": round(sum(1 for x in mature if x["rel"] and x["rel"] >= 3) / len(mature) * 100) if mature else None,
            **conv,
        })
    return sorted(rows, key=lambda r: -(r["views_med_recent"] or r["views_med"] or 0))


def follow_conversion(data, acct):
    """最近兩次（有這個帳號的）快照之間：漲粉／新增觀看×1000。"""
    fs = data["followers"][acct]
    dates = sorted(fs)
    if len(dates) < 2:
        return {"conv": None, "conv_span": "", "conv_views": 0, "conv_follows": 0}
    # 用最早到最晚整段，比較穩
    d0, d1 = dates[0], dates[-1]
    snaps = dict((d, rows) for d, rows in load_snapshots())
    def views_by_id(d):
        return {r["id"]: num(r["views"]) or 0 for r in snaps[d] if RENAME.get(r["username"], r["username"]) == acct}
    v0, v1 = views_by_id(d0), views_by_id(d1)
    added = sum(v1[i] - v0.get(i, 0) for i in v1)
    follows = fs[d1] - fs[d0]
    conv = round(follows / added * 1000, 1) if added > 0 else None
    return {"conv": conv, "conv_span": f"{d0[4:6]}/{d0[6:]}–{d1[4:6]}/{d1[6:]}",
            "conv_views": int(added), "conv_follows": follows}


def verdict(c):
    """規則式建議，週報用；理由附數字。"""
    n = c["mature"]
    if c["acct"] in RENAME.values():
        return "樣本太少", f"{RENAMED_ON[5:].replace('-', '/')} 改名換題材，舊的 {n} 支是舊題材（中位 {fmt(c['views_med'])}），新題材還沒有數據"
    if c["stale"]:
        return "樣本太少", f"權杖從 {c['followers_last_date'][4:6]}/{c['followers_last_date'][6:]} 後就抓不到這個帳號，數據停在那天"
    if n < MIN_N:
        return "樣本太少", f"成熟 Reel 只有 {n} 支（要 {MIN_N} 支以上）"
    vr, vo = c["views_med_recent"], c["views_med_older"]
    trend = None
    if vr and vo and c["n_recent"] >= 5 and c["n_older"] >= 5:
        trend = vr / vo
    conv = c["conv"]
    med_v = vr or c["views_med"]
    why = [f"近期觀看中位 {fmt(med_v)}"]
    if trend:
        why.append(f"比前兩週 {'+' if trend >= 1 else ''}{round((trend - 1) * 100)}%")
    if conv is not None:
        why.append(f"每千觀看漲粉 {conv}")
    why = "、".join(why)
    strong_conv = conv is not None and conv >= 5
    if (med_v or 0) >= 800 and (trend is None or trend >= 0.8) or (strong_conv and (med_v or 0) >= 300):
        return "加碼", why
    if (med_v or 0) < 200 and (trend is None or trend < 1) and not strong_conv:
        return "停" if (med_v or 0) < 120 else "降頻", why
    if trend and trend < 0.6:
        return "降頻", why
    return "維持", why


def fmt(v):
    if v is None:
        return "—"
    return f"{int(round(v)):,}"


# ---------- 週報 Markdown ----------

def weekly_md(data, chans, now):
    reels = [x for x in data["reels"] if not x["removed"]]
    lines = [f"# IG 週報（{now:%Y-%m-%d}）", ""]
    snap = data["snapshot"]
    snap_dt = datetime.strptime(snap, "%Y%m%d").replace(tzinfo=TPE)
    age_d = (now - snap_dt).days
    lines.append(f"數據快照：`ig_insights_{snap}.csv`（{age_d} 天前）。")
    if age_d > 3:
        lines.append(f"> ⚠️ 數據已經 {age_d} 天沒更新。到 GitHub Actions 手動跑「IG 數據抓取（只讀）」，下週的週報才會是新的。")
    lines += ["", "只看發出滿 72 小時的 Reel；一組少於 8 支標「樣本太少」。", ""]

    lines += ["## 各頻道建議", "", "| 頻道 | 建議 | 理由 | 追蹤 | 成熟 Reel | 停留中位 |", "|---|---|---|---|---|---|"]
    for c in chans:
        v, why = verdict(c)
        lines.append(f"| {c['name']} | **{v}** | {why} | {c['followers']:,} | {c['mature']} | {c['watch_med'] or '—'}s |")

    week_ago = snap_dt - timedelta(days=7)
    new = [x for x in reels if datetime.strptime(x["time"], "%Y-%m-%d %H:%M").replace(tzinfo=TPE) >= week_ago]
    lines += ["", f"## 這 7 天發的 Reel（{len(new)} 支）", ""]
    top = sorted(new, key=lambda x: -x["views"])[:5]
    lines += ["**觀看前 5**", ""]
    for x in top:
        lines.append(f"- {fmt(x['views'])}｜{x['name']}｜{x['variant']}｜{x['hook']}")

    lines += ["", "## 版本比較（全部成熟 Reel，觀看換算成頻道中位數倍數）", "",
              "| 版本 | 支數 | 倍數中位 | 停留中位 | 每千觀看分享 |", "|---|---|---|---|---|"]
    for g in group([x for x in reels if x["mature"]], "variant"):
        tag = "（樣本太少）" if g["few"] else ""
        lines.append(f"| {g['group']}{tag} | {g['n']} | {g['rel_med']}× | {g['watch_med']}s | {g['share_k_med']} |")

    lines += ["", "## 新版本（試用 Reel／試驗版／英文版）跟同頻道正式版同年紀比", "",
              "| 頻道 | 版本 | 發出 | 觀看 | 正式版同年紀中位 | 倍數 |", "|---|---|---|---|---|---|"]
    for e in sorted(early_compare(data), key=lambda e: e["time"], reverse=True)[:30]:
        tag = "（樣本太少）" if e["few"] else ""
        lines.append(f"| {e['name']} | {e['variant']} | {e['age_h']}h | {fmt(e['views'])} | {fmt(e['base_med'])}（{e['base_n']} 支）{tag} | {e['ratio'] or '—'}× |")
    lines.append("")
    lines.append("單支新版本的倍數只是參考；同一種版本累積 8 支以上、倍數中位穩定大於 1，才算贏。")

    lines += ["", "## 發文時段（倍數中位）", "", "| 時段 | 支數 | 倍數中位 |", "|---|---|---|"]
    for g in group([x for x in reels if x["mature"]], "slot"):
        lines.append(f"| {g['group']}{'（樣本太少）' if g['few'] else ''} | {g['n']} | {g['rel_med']}× |")

    lb = group([x for x in reels if x["mature"] and x["length_bin"]], "length_bin")
    lines += ["", "## 影片長度（倍數中位）", ""]
    if sum(g["n"] for g in lb) < MIN_N:
        lines.append(f"樣本太少：有長度紀錄、而且已發滿 72 小時的 Reel 只有 {sum(g['n'] for g in lb)} 支。長度從 11/28 起才開始記，會一週一週累積。")
    else:
        lines += ["| 長度 | 支數 | 倍數中位 | 停留中位 |", "|---|---|---|---|"]
        for g in lb:
            lines.append(f"| {g['group']}{'（樣本太少）' if g['few'] else ''} | {g['n']} | {g['rel_med']}× | {g['watch_med']}s |")

    lines += ["", "## 鉤子類型（倍數中位）", "", "| 鉤子 | 支數 | 倍數中位 | 停留中位 |", "|---|---|---|---|"]
    for g in group([x for x in reels if x["mature"]], "hook_type"):
        lines.append(f"| {g['group']}{'（樣本太少）' if g['few'] else ''} | {g['n']} | {g['rel_med']}× | {g['watch_med']}s |")

    lines += ["", "---", "這份是 `tools/insights-report/report.py` 自動產生的，規則寫死在程式裡，不需要 Claude。",
              "建議只是規則判斷，看到「樣本太少」就先別動那個頻道。"]
    return "\n".join(lines) + "\n"


def early_compare(data):
    """新版本還沒滿 72 小時時，跟同頻道正式版『在差不多年紀時』的觀看比。"""
    out = []
    reels = data["reels"]
    for x in reels:
        if x["variant"] in ("正式版", "MBS／早期（佇列外）") or x["removed"]:
            continue
        age = x["age_h"]
        base = []
        for y in reels:
            if y["acct"] != x["acct"] or y["variant"] not in ("正式版", "MBS／早期（佇列外）"):
                continue
            pts = [v for h, v in data["obs"].get(y["id"], []) if abs(h - age) <= max(12, age * 0.35)]
            if pts:
                base.append(pts[0])
        m = med(base)
        out.append({
            "name": x["name"], "variant": x["variant"], "qid": x["qid"], "time": x["time"], "age_h": age,
            "views": x["views"], "watch_s": x["watch_s"], "hook": x["hook"],
            "base_med": m, "base_n": len(base),
            "ratio": round(x["views"] / m, 2) if m else None,
            "few": len(base) < MIN_N,
        })
    return out


def spearman(a, b):
    n = len(a)
    if n < MIN_N:
        return None
    def rank(v):
        o = sorted(range(n), key=lambda i: v[i])
        r = [0] * n
        for k, i in enumerate(o):
            r[i] = k
        return r
    ra, rb = rank(a), rank(b)
    ma, mb = sum(ra) / n, sum(rb) / n
    cov = sum((ra[i] - ma) * (rb[i] - mb) for i in range(n))
    va = sum((x - ma) ** 2 for x in ra) ** 0.5
    vb = sum((x - mb) ** 2 for x in rb) ** 0.5
    return round(cov / (va * vb), 2) if va and vb else None


def export_json(data, chans):
    reels = data["reels"]
    m = [x for x in reels if x["mature"] and not x["removed"]]
    fol = {a: [{"date": d, "n": n} for d, n in sorted(v.items())] for a, v in data["followers"].items()}
    for c in chans:
        c["verdict"], c["why"] = verdict(c)
        xs = [x for x in m if x["acct"] == c["acct"]]
        c["r_watch"] = spearman([x["watch_s"] for x in xs], [x["views"] for x in xs])
    weeks = defaultdict(lambda: defaultdict(list))
    for x in m:
        weeks[x["name"]][x["week"]].append(x["views"])
    trend = {k: [{"week": w, "med": med(v), "n": len(v)} for w, v in sorted(ws.items())] for k, ws in weeks.items()}
    return {
        "as_of": data["as_of"], "snapshot": data["snapshot"], "snapshots": data["snapshots"],
        "min_n": MIN_N, "mature_h": MATURE_H,
        "channels": chans,
        "followers": fol,
        "groups": {
            "variant": group([x for x in reels if not x["removed"]], "variant"),
            "variant_mature": group(m, "variant"),
            "slot": group(m, "slot"),
            "hour": group(m, "hour"),
            "weekday": group(m, "weekday"),
            "hook_type": group(m, "hook_type"),
            "form": group(m, "form"),
            "length_bin": group([x for x in m if x["length_bin"]], "length_bin"),
        },
        "early": early_compare(data),
        "trend": trend,
        "reels": reels,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(ROOT, "social/reports"))
    ap.add_argument("--date", default=None)
    a = ap.parse_args()
    now = datetime.strptime(a.date, "%Y-%m-%d").replace(tzinfo=TPE) if a.date else datetime.now(TPE)
    data = build()
    chans = channel_table(data)
    os.makedirs(os.path.join(a.out, "data"), exist_ok=True)
    js = export_json(data, chans)
    with open(os.path.join(a.out, "data", "latest.json"), "w", encoding="utf-8") as fh:
        json.dump(js, fh, ensure_ascii=False, indent=1)
    md = weekly_md(data, chans, now)
    path = os.path.join(a.out, f"週報_{now:%Y%m%d}.md")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(md)
    print(md)
    print(f"寫入 {path}")


if __name__ == "__main__":
    main()
