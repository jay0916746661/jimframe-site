"""只讀抓取 IG 專業帳號的貼文成效，寫進 social/insights/。

token 只從環境變數 META_USER_TOKEN 讀（跟 ig_publish.py 一樣），不寫進檔案、不印出來。
帳號來自 GET /me/accounts 的 instagram_business_account；沒有才看 connected_instagram_account。
之後只用該粉專的 access token 打 Graph API GET。不發文、不改帳號。

    python ig_insights.py
    python ig_insights.py --limit 5

每個帳號預設抓最近 100 則，上限 200。指標名稱會因貼文類型與 API 版本不同；
不支援的指標略過，繼續下一則。缺少 instagram_manage_insights 時仍寫追蹤數、讚與留言。
"""
import argparse, csv, io, os, pathlib, re, sys, time, urllib.parse
from datetime import datetime, timedelta, timezone

import meta

TPE = timezone(timedelta(hours=8))
ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "social" / "insights"
DEFAULT_LIMIT = 100
MAX_LIMIT = 200
INSIGHT_PERMS = ("instagram_manage_insights", "instagram_business_manage_insights")
INTEREST = (
    "jazz101tw",
    "art101.tw",
    "socialdance101",
    "coffeestory101",
    "reading.after",
    "love.manual.tw",
    "theguitarstory101",
    "astro_labtw",
    "tech101_ai",
    "untold.trip0",
)
PAGE_FIELDS = "id,name,access_token,instagram_business_account{id,username},connected_instagram_account{id,username}"
PAGE_FIELDS_BASIC = "id,name,access_token,instagram_business_account{id,username}"
MEDIA_FIELDS = "id,permalink,timestamp,media_type,media_product_type,caption,like_count,comments_count"
PRIMARY_METRICS = ["views", "reach", "saved", "shares", "total_interactions"]
COLUMNS = [
    "username",
    "followers_count",
    "media_count",
    "id",
    "permalink",
    "timestamp",
    "media_type",
    "media_product_type",
    "caption",
    "like_count",
    "comments_count",
    "views",
    "plays",
    "reach",
    "saved",
    "shares",
    "total_interactions",
    "follows",
    "ig_reels_avg_watch_time",
    "ig_reels_video_view_total_time",
    "insights_note",
]
RETRY_DELAYS = (5, 15, 30)


class ApiStop(Exception):
    def __init__(self, message, partial=None, skipped=None):
        super().__init__(message)
        self.partial = dict(partial or {})
        self.skipped = list(skipped or [])


class InsightsPermissionError(ApiStop):
    pass


class RateLimitError(ApiStop):
    pass


def parse_limit(raw, default=DEFAULT_LIMIT, cap=MAX_LIMIT):
    text = "" if raw is None else str(raw)
    match = re.fullmatch(r"\s*(\d+)\s*", text)
    if not match:
        return default
    number = int(match.group(1))
    if number < 1:
        return default
    return min(cap, number)


def scrub(text, tokens=()):
    raw = str(text)
    for token in list(tokens):
        if token and len(token) >= 8:
            raw = raw.replace(token, "***")
    raw = re.sub(r"(access_token=)[^&\s\"']+", r"\1***", raw, flags=re.I)
    raw = re.sub(r"\bEAA[A-Za-z0-9]{10,}\b", "***", raw)
    return raw


def shorten(text, limit=180):
    return re.sub(r"\s+", " ", str(text)).strip()[:limit]


def is_retryable(msg):
    low = msg.lower()
    hints = (
        "(#4)",
        "(#17)",
        "(#32)",
        "(#613)",
        "request limit",
        "too many calls",
        "rate limit",
        "unexpected error",
        "temporarily unavailable",
        "please reduce the amount of data",
    )
    return any(hint in low or hint in msg for hint in hints)


def is_permission_error(msg):
    if "(#100)" in msg:
        return False
    low = msg.lower()
    if "instagram_manage_insights" in low or "instagram_business_manage_insights" in low:
        return True
    if "(#10)" in msg or "(#200)" in msg:
        return True
    if "not authorized" in low:
        return True
    return "permission" in low and "requires" in low


def is_account_permission(msg):
    """整帳讀不到 insights 時才停，不要把單一指標的 (#10) 當成整帳失敗。"""
    if "(#100)" in msg:
        return False
    low = msg.lower()
    if "instagram_manage_insights" in low or "instagram_business_manage_insights" in low:
        return True
    return "(#200)" in msg


def unsupported_metric_names(msg, metrics):
    """只認錯誤訊息點名的指標。認不出來就交給二分，避免把『允許的指標清單』誤判成失敗。"""
    wanted = set(metrics)
    found = []
    for group in re.findall(r"metrics\s*\(([^)]*)\)", msg, flags=re.I):
        if group.startswith("#"):
            continue
        for part in re.split(r"[\s,]+", group.strip()):
            if part in wanted and part not in found:
                found.append(part)
    for name in metrics:
        if name in found:
            continue
        if re.search(rf"\bmetric\s+{re.escape(name)}\b", msg, flags=re.I):
            found.append(name)
    return found


def remember(secrets, token):
    if token and len(token) >= 8:
        secrets.add(token)


def guarded_request(orig):
    def _request(self, method, url, **kwargs):
        if str(method).upper() != "GET":
            raise RuntimeError("這支程式只允許 GET")
        return orig(self, method, url, **kwargs)

    return _request


def guard_get_only():
    """擋下 requests 的 POST／PUT／PATCH／DELETE。meta.get 走 GET，不受影響。"""
    current = __import__("requests").sessions.Session.request
    if getattr(current, "_ig_insights_get_only", False):
        return
    wrapped = guarded_request(current)
    wrapped._ig_insights_get_only = True
    __import__("requests").sessions.Session.request = wrapped


class RealGraph:
    def __init__(self, get_fn=None, sleep_fn=None):
        self._get = get_fn or meta.get
        self._sleep = sleep_fn or time.sleep

    def get(self, path, token=None, **params):
        tok = token if token else meta.TOKEN
        last = "讀取失敗"
        attempts = len(RETRY_DELAYS) + 1
        for attempt in range(attempts):
            try:
                return self._get(path, tok, **params)
            except Exception as exc:  # noqa: BLE001
                last = shorten(scrub(exc, [tok, meta.TOKEN]))
                if is_retryable(last) and attempt < attempts - 1:
                    self._sleep(RETRY_DELAYS[min(attempt, len(RETRY_DELAYS) - 1)])
                    continue
                raise RuntimeError(last) from None
        raise RuntimeError(last)


def next_after(body):
    paging = body.get("paging") or {}
    if not paging.get("next"):
        return None
    after = ((paging.get("cursors")) or {}).get("after")
    if after:
        return str(after)
    nxt = paging.get("next") or ""
    try:
        query = urllib.parse.parse_qs(urllib.parse.urlparse(nxt).query)
    except Exception:  # noqa: BLE001
        return None
    values = query.get("after") or []
    return values[0] if values else None


def paged(graph, path, token, **params):
    params = dict(params)
    params.setdefault("limit", 100)
    out = []
    seen = set()
    while len(out) < 500:
        body = graph.get(path, token, **params)
        out.extend(body.get("data") or [])
        after = next_after(body)
        if not after or after in seen:
            break
        seen.add(after)
        params["after"] = after
    return out


def load_pages(graph, token):
    try:
        return paged(graph, "me/accounts", token, fields=PAGE_FIELDS), ""
    except Exception as exc:  # noqa: BLE001
        if "connected_instagram_account" not in str(exc):
            raise
        pages = paged(graph, "me/accounts", token, fields=PAGE_FIELDS_BASIC)
        return pages, "connected_instagram_account 讀不到，已改只問 instagram_business_account"


def ig_from_pages(pages):
    found = {}
    for page in pages:
        token = page.get("access_token") or ""
        page_name = page.get("name") or ""
        page_id = str(page.get("id") or "")
        for key in ("instagram_business_account", "connected_instagram_account"):
            ig = page.get(key) or {}
            ig_id = str(ig.get("id") or "")
            if not ig_id or ig_id in found:
                continue
            found[ig_id] = {
                "ig_id": ig_id,
                "username": ig.get("username") or "",
                "page_name": page_name,
                "page_id": page_id,
                "token": token,
                "link": key,
            }
    return list(found.values())


def list_media(graph, ig_id, token, limit):
    params = {"fields": MEDIA_FIELDS, "limit": min(50, limit)}
    rows = []
    seen_ids = set()
    seen_cursors = set()
    while len(rows) < limit:
        body = graph.get(f"{ig_id}/media", token, **params)
        chunk = body.get("data") or []
        if not chunk:
            break
        for item in chunk:
            media_id = str(item.get("id") or "")
            if media_id and media_id in seen_ids:
                continue
            if media_id:
                seen_ids.add(media_id)
            rows.append(item)
            if len(rows) >= limit:
                break
        if len(rows) >= limit:
            break
        after = next_after(body)
        if not after or after in seen_cursors:
            break
        seen_cursors.add(after)
        params["after"] = after
        params["limit"] = min(50, limit - len(rows))
    return rows[:limit]


def is_reel_media(media):
    product = (media.get("media_product_type") or "").upper()
    kind = (media.get("media_type") or "").upper()
    return product == "REELS" or (not product and kind == "VIDEO")


def metric_batches(media):
    kind = (media.get("media_type") or "").upper()
    batches = [list(PRIMARY_METRICS)]
    # plays 是 Reels／影片的舊指標。圖片和輪播去問只會得到不支援，狀態列會被洗版。
    if is_reel_media(media) or kind == "VIDEO":
        batches.append(["plays"])
    batches.append(["follows"])
    if is_reel_media(media):
        batches.append(["ig_reels_avg_watch_time", "ig_reels_video_view_total_time"])
    return batches


def insight_map(body):
    out = {}
    for item in body.get("data") or []:
        name = item.get("name")
        if not name:
            continue
        if isinstance(item.get("total_value"), dict) and "value" in item["total_value"]:
            out[name] = item["total_value"].get("value")
            continue
        values = item.get("values") or []
        if values and isinstance(values[0], dict) and "value" in values[0]:
            out[name] = values[0].get("value")
    return out


def insight_request(graph, media_id, token, metrics):
    metric = ",".join(metrics)
    try:
        return graph.get(f"{media_id}/insights", token, metric=metric)
    except (InsightsPermissionError, RateLimitError):
        raise
    except Exception as exc:  # noqa: BLE001
        if "metric_type" in str(exc):
            return graph.get(
                f"{media_id}/insights",
                token,
                metric=metric,
                metric_type="total_value",
            )
        raise


def fetch_batch(graph, media_id, token, metrics, secrets, depth=0):
    metrics = [m for m in metrics if m]
    if not metrics:
        return {}, []
    if depth > 8:
        return {}, [(name, "指標拆分超過上限") for name in metrics]
    try:
        body = insight_request(graph, media_id, token, metrics)
    except (InsightsPermissionError, RateLimitError):
        raise
    except Exception as exc:  # noqa: BLE001
        return recover_metrics(graph, media_id, token, metrics, secrets, depth, exc)
    return insight_map(body), []


def recover_metrics(graph, media_id, token, metrics, secrets, depth, exc):
    msg = shorten(scrub(exc, secrets))
    if is_retryable(msg):
        raise RateLimitError(msg) from None
    if is_account_permission(msg):
        raise InsightsPermissionError(msg) from None
    named = [] if is_permission_error(msg) else unsupported_metric_names(msg, metrics)
    if 0 < len(named) < len(metrics):
        rest = [name for name in metrics if name not in named]
        got, skipped = fetch_batch(graph, media_id, token, rest, secrets, depth + 1)
        return got, skipped + [(name, msg) for name in named]
    if len(metrics) == 1:
        return {}, [(metrics[0], msg)]
    mid = len(metrics) // 2
    try:
        left_got, left_skipped = fetch_batch(graph, media_id, token, metrics[:mid], secrets, depth + 1)
    except InsightsPermissionError as err:
        raise InsightsPermissionError(str(err), err.partial, err.skipped) from None
    except RateLimitError as err:
        raise RateLimitError(str(err), err.partial, err.skipped) from None
    try:
        right_got, right_skipped = fetch_batch(graph, media_id, token, metrics[mid:], secrets, depth + 1)
    except InsightsPermissionError as err:
        partial = {**left_got, **err.partial}
        raise InsightsPermissionError(str(err), partial, left_skipped + err.skipped) from None
    except RateLimitError as err:
        partial = {**left_got, **err.partial}
        skipped = left_skipped + err.skipped + [(name, str(err)) for name in metrics[mid:]]
        raise RateLimitError(str(err), partial, skipped) from None
    return {**left_got, **right_got}, left_skipped + right_skipped


def core_permission_block(skipped):
    denied = {name for name, reason in skipped if name in ("views", "reach") and is_permission_error(reason)}
    return {"views", "reach"} <= denied


def collect_insights(graph, media, token, secrets):
    merged, skipped = {}, []
    for index, batch in enumerate(metric_batches(media)):
        try:
            got, skip = fetch_batch(graph, str(media["id"]), token, batch, secrets)
        except InsightsPermissionError as err:
            merged.update(err.partial)
            skipped.extend(err.skipped)
            # 主指標整批被拒才停整帳。plays／follows／Reels 時長單獨被拒就略過，後面的貼文還要繼續。
            if index == 0:
                raise InsightsPermissionError(str(err), merged, skipped) from None
            for name in batch:
                if all(existing != name for existing, _reason in skipped):
                    skipped.append((name, shorten(str(err))))
            continue
        except RateLimitError as err:
            merged.update(err.partial)
            skipped.extend(err.skipped)
            raise RateLimitError(str(err), merged, skipped) from None
        merged.update(got)
        skipped.extend(skip)
        if index == 0 and core_permission_block(skip):
            reason = next(r for name, r in skip if name in ("views", "reach") and is_permission_error(r))
            raise InsightsPermissionError(reason, merged, skipped)
    return merged, skipped


def short_caption(text, limit=80):
    flat = re.sub(r"\s+", " ", (text or "")).strip()
    return flat[:limit]


def blank_num(value):
    if value is None or value is False or value == "":
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, float):
        if value.is_integer():
            return str(int(value))
        return f"{value:.4f}".rstrip("0").rstrip(".")
    if isinstance(value, int):
        return str(value)
    return str(value)


def view_number(row):
    for key in ("views", "plays"):
        raw = row.get(key)
        if raw is None or raw == "":
            continue
        try:
            return int(raw)
        except (TypeError, ValueError):
            try:
                return int(float(raw))
            except (TypeError, ValueError):
                continue
    return None


def is_reel_row(row):
    if (row.get("media_product_type") or "").upper() == "REELS":
        return True
    return bool(row.get("ig_reels_avg_watch_time") or row.get("ig_reels_video_view_total_time"))


def build_row(account, media, metrics, note):
    return {
        "username": account["username"],
        "followers_count": blank_num(account.get("followers_count")),
        "media_count": blank_num(account.get("media_count")),
        "id": str(media.get("id") or ""),
        "permalink": media.get("permalink") or "",
        "timestamp": media.get("timestamp") or "",
        "media_type": media.get("media_type") or "",
        "media_product_type": media.get("media_product_type") or "",
        "caption": short_caption(media.get("caption")),
        "like_count": blank_num(media.get("like_count")),
        "comments_count": blank_num(media.get("comments_count")),
        "views": blank_num(metrics.get("views")),
        "plays": blank_num(metrics.get("plays")),
        "reach": blank_num(metrics.get("reach")),
        "saved": blank_num(metrics.get("saved")),
        "shares": blank_num(metrics.get("shares")),
        "total_interactions": blank_num(metrics.get("total_interactions")),
        "follows": blank_num(metrics.get("follows")),
        "ig_reels_avg_watch_time": blank_num(metrics.get("ig_reels_avg_watch_time")),
        "ig_reels_video_view_total_time": blank_num(metrics.get("ig_reels_video_view_total_time")),
        "insights_note": note,
    }


def skip_note(skipped):
    names = []
    for name, _reason in skipped:
        if name not in names:
            names.append(name)
    if not names:
        return ""
    return "略過 " + "、".join(names)


def record_skips(bucket, skipped, product):
    seen = set()
    for name, reason in skipped:
        if not name or name in seen:
            continue
        seen.add(name)
        rec = bucket.setdefault(name, {"count": 0, "reason": shorten(reason), "products": set()})
        rec["count"] += 1
        if product:
            rec["products"].add(product)


def split_perms(rows):
    granted, declined = [], []
    for row in rows:
        name = row.get("permission") or ""
        if not name:
            continue
        if row.get("status") == "granted":
            granted.append(name)
        else:
            declined.append(name)
    return sorted(set(granted)), sorted(set(declined))


def insight_perm_label(granted, declined):
    if any(name in granted for name in INSIGHT_PERMS):
        return "有"
    if any(name in declined for name in INSIGHT_PERMS):
        return "被拒絕"
    return "權限清單裡沒有"


def missing_interest(usernames):
    got = {name.casefold() for name in usernames if name}
    return [handle for handle in INTEREST if handle.casefold() not in got]


def extra_usernames(usernames):
    wanted = {handle.casefold() for handle in INTEREST}
    return [name for name in usernames if name and name.casefold() not in wanted]


def safe_name(name):
    return re.sub(r"\s+", " ", name or "").strip() or "（無帳號名稱）"


def fmt(value):
    if value is None or value == "":
        return "—"
    try:
        return f"{int(value):,}"
    except (TypeError, ValueError):
        return str(value)


def fmt_avg(values):
    if not values:
        return "—"
    avg = sum(values) / len(values)
    if abs(avg - round(avg)) < 1e-9:
        return f"{int(round(avg)):,}"
    return f"{avg:,.1f}"


def kind_label(row):
    product = row.get("media_product_type") or ""
    kind = row.get("media_type") or ""
    if product and kind and product.upper() != kind.upper():
        return f"{product}/{kind}"
    return product or kind or "—"


def media_line(views, row):
    stamp = (row.get("timestamp") or "")[:10] or "—"
    caption = row.get("caption") or "（無文案）"
    link = row.get("permalink") or ""
    return f"{views:,} 次｜{stamp}｜{kind_label(row)}｜{caption}｜{link}"


def status_line(result):
    parts = []
    if result.get("fatal"):
        parts.append(f"抓取中斷：{result['fatal']}")
    else:
        label = insight_perm_label(result.get("granted") or [], result.get("declined") or [])
        if label != "有":
            parts.append(f"數據權限 instagram_manage_insights：{label}")
        if "pages_show_list" not in (result.get("granted") or []):
            parts.append("缺少 pages_show_list（可能列不出粉專）")
        missing = result.get("missing") or []
        if missing:
            parts.append("缺少 " + "、".join(missing))
        else:
            parts.append("關心的帳號都找得到")
    blocked = result.get("blocked") or []
    if blocked:
        parts.append("insights 失敗：" + "；".join(f"{name}（{why}）" for name, why in blocked))
    errors = result.get("account_errors") or []
    if errors:
        parts.append("帳號讀取失敗：" + "；".join(f"{name}（{why}）" for name, why in errors))
    skips = result.get("skips") or {}
    if skips:
        bits = [f"{name}×{skips[name]['count']}" for name in sorted(skips)]
        parts.append("略過指標 " + "、".join(bits))
    elif not result.get("fatal"):
        parts.append("沒有略過的指標")
    return "狀態：" + "；".join(parts) + "。"


def ranked_views(rows):
    found = []
    for row in rows:
        views = view_number(row)
        if views is not None:
            found.append((views, row))
    return found


def render_summary(result, now, csv_name):
    accounts = result.get("accounts") or []
    lines = [
        f"# IG 數據摘要（{now:%Y-%m-%d}）",
        "",
        f"抓取時間：{now:%Y-%m-%d %H:%M}（台北）",
        f"介面：{getattr(meta, 'API', 'https://graph.facebook.com/v21.0')}，只送 GET（不發文、不改帳號）。",
        f"每個帳號最多抓最近 {result.get('limit', DEFAULT_LIMIT)} 則。資料檔：`{csv_name}`。",
        "帳號來源：GET /me/accounts 的 instagram_business_account，沒有才用 connected_instagram_account。",
        "",
        f"權杖看得到的 IG：{len(accounts)} 個。",
        "這次關心的帳號：" + "、".join(INTEREST) + "。",
    ]
    if result.get("page_note"):
        lines.append(result["page_note"] + "。")
    extra = result.get("extra") or []
    if extra:
        lines.append("不在關心清單、但權杖看得到：" + "、".join(extra) + "。")
    lines.append("")
    lines.append(status_line(result))
    lines.append("")
    if result.get("skips"):
        lines.append("略過原因：")
        lines.append("")
        for name in sorted(result["skips"]):
            rec = result["skips"][name]
            products = "、".join(sorted(rec["products"])) or "各類型"
            lines.append(f"- {name} × {rec['count']}（{products}）：{rec['reason']}")
        lines.append("")
    lines.append("## 各帳號")
    lines.append("")
    if not accounts:
        lines.append("（這次沒有列出 IG 帳號）")
        lines.append("")
    for account in accounts:
        rows = account.get("rows") or []
        reels = [row for row in rows if is_reel_row(row)]
        reel_views = [view for view in (view_number(row) for row in reels) if view is not None]
        lines.append(f"### {safe_name(account.get('username'))}")
        lines.append("")
        if account.get("page_name"):
            lines.append(f"- 粉專：{account['page_name']}")
        if account.get("link") == "connected_instagram_account":
            lines.append("- 連結方式：connected_instagram_account")
        lines.append(f"- 追蹤：{fmt(account.get('followers_count'))}")
        lines.append(f"- 貼文總數：{fmt(account.get('media_count'))}")
        lines.append(f"- 這次列入：{len(rows)} 則，其中 Reels {len(reels)} 則")
        if reels:
            lines.append(f"- Reels 平均觀看：{fmt_avg(reel_views)}（{len(reel_views)} 則有觀看數）")
        else:
            lines.append("- Reels 平均觀看：這批沒有 Reels")
        if account.get("error"):
            lines.append(f"- 讀取失敗：{account['error']}")
        if account.get("insights_blocked"):
            lines.append(f"- insights 失敗：{account['insights_blocked']}")
        ranked = ranked_views(rows)
        lines.append("")
        lines.append("觀看前 5：")
        lines.append("")
        if not ranked:
            lines.append("（沒有讀到觀看數）")
        else:
            top = sorted(ranked, key=lambda item: (item[0], item[1].get("timestamp") or ""), reverse=True)[:5]
            for index, (views, row) in enumerate(top, 1):
                lines.append(f"{index}. {media_line(views, row)}")
        lines.append("")
        lines.append("觀看後 3：")
        lines.append("")
        if not ranked:
            lines.append("（沒有讀到觀看數）")
        else:
            bottom = sorted(ranked, key=lambda item: (item[0], item[1].get("timestamp") or ""))[:3]
            for index, (views, row) in enumerate(bottom, 1):
                lines.append(f"{index}. {media_line(views, row)}")
        lines.append("")
    granted = result.get("granted") or []
    declined = result.get("declined") or []
    label = insight_perm_label(granted, declined)
    lines.extend(
        [
            "## 權限",
            "",
            "已授權：" + ("、".join(granted) if granted else "（沒讀到）"),
            "數據權限：" + label + "（instagram_manage_insights 或 instagram_business_manage_insights）",
        ]
    )
    if declined:
        lines.append("未授權：" + "、".join(declined))
    lines.extend(
        [
            "",
            "排名用的觀看數先取 views，沒有再取 plays。",
            "Reels 平均只算 media_product_type 為 REELS，或有回傳 Reels 觀看時間的貼文。",
            "ig_reels_avg_watch_time 與 ig_reels_video_view_total_time 的單位是毫秒。",
            "非 Reels 不請求這兩個 Reels 指標。plays 只問 Reels 與影片；follows 每則都會試。不支援就略過。",
            "",
        ]
    )
    return "\n".join(lines)


def render_csv(rows):
    buf = io.StringIO(newline="")
    writer = csv.DictWriter(buf, fieldnames=COLUMNS, lineterminator="\n")
    writer.writeheader()
    for row in rows:
        writer.writerow({key: row.get(key, "") for key in COLUMNS})
    return buf.getvalue()


def redact(text, secrets):
    return scrub(text, secrets)


def write_outputs(out_dir, now, rows, summary, secrets):
    out_dir = pathlib.Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    summary = redact(summary, secrets)
    if not summary.endswith("\n"):
        summary += "\n"
    csv_name = f"ig_insights_{now:%Y%m%d}.csv"
    csv_text = redact(render_csv(rows), secrets)
    summary_path = out_dir / "ig_insights_summary.md"
    csv_path = out_dir / csv_name
    summary_path.write_text(summary, encoding="utf-8")
    csv_path.write_bytes(csv_text.encode("utf-8-sig"))
    return csv_path, summary_path


def empty_result(limit):
    return {
        "limit": limit,
        "fatal": "",
        "page_note": "",
        "granted": [],
        "declined": [],
        "accounts": [],
        "rows": [],
        "missing": [],
        "extra": [],
        "skips": {},
        "blocked": [],
        "account_errors": [],
    }


def profile_of(graph, ig_id, token):
    return graph.get(ig_id, token, fields="username,followers_count,media_count")


def build(graph, limit, user_token, secrets):
    result = empty_result(limit)
    try:
        granted, declined = split_perms(paged(graph, "me/permissions", user_token))
        pages, page_note = load_pages(graph, user_token)
    except Exception as exc:  # noqa: BLE001
        result["fatal"] = shorten(scrub(exc, secrets))
        return result
    result["granted"] = granted
    result["declined"] = declined
    result["page_note"] = page_note
    sources = ig_from_pages(pages)
    for source in sources:
        remember(secrets, source.get("token"))
    print(f"粉專帶出的 IG：{len(sources)} 個", flush=True)
    accounts = []
    for source in sources:
        token = source.get("token") or user_token
        remember(secrets, token)
        account = {
            "username": safe_name(source.get("username")),
            "followers_count": None,
            "media_count": None,
            "page_name": source.get("page_name") or "",
            "link": source.get("link") or "",
            "rows": [],
            "error": "",
            "insights_blocked": "",
        }
        if source.get("token"):
            token_note = ""
        else:
            token_note = "粉專沒有 access_token，改用使用者權杖"
        profile_error = ""
        try:
            info = profile_of(graph, source["ig_id"], token)
        except Exception as exc:  # noqa: BLE001
            info = {}
            profile_error = shorten(scrub(exc, secrets))
        if info.get("username"):
            account["username"] = safe_name(info.get("username"))
        account["followers_count"] = info.get("followers_count")
        account["media_count"] = info.get("media_count")
        notes = [part for part in (token_note, profile_error) if part]
        try:
            medias = list_media(graph, source["ig_id"], token, limit)
        except Exception as exc:  # noqa: BLE001
            medias = []
            notes.append(shorten(scrub(exc, secrets)))
        account["error"] = "；".join(notes)
        blocked = ""
        for media in medias:
            if not media.get("id"):
                continue
            metrics = {}
            skipped = []
            if blocked:
                note = blocked
            else:
                try:
                    metrics, skipped = collect_insights(graph, media, token, secrets)
                    note = skip_note(skipped)
                except InsightsPermissionError as err:
                    metrics = dict(err.partial)
                    skipped = list(err.skipped)
                    blocked = shorten(scrub(err, secrets))
                    note = blocked
                except RateLimitError as err:
                    metrics = dict(err.partial)
                    skipped = list(err.skipped)
                    blocked = shorten(scrub(err, secrets))
                    note = blocked
            product = media.get("media_product_type") or media.get("media_type") or ""
            record_skips(result["skips"], skipped, product)
            account["rows"].append(build_row(account, media, metrics, note))
        if blocked:
            account["insights_blocked"] = blocked
            result["blocked"].append((account["username"], blocked))
        if account["error"]:
            result["account_errors"].append((account["username"], account["error"]))
        accounts.append(account)
        print(
            f"{account['username']}：追蹤 {fmt(account.get('followers_count'))}，列入 {len(account['rows'])} 則",
            flush=True,
        )
    accounts.sort(key=lambda item: (item["username"].casefold(), item["username"]))
    result["accounts"] = accounts
    result["rows"] = [row for account in accounts for row in account["rows"]]
    names = [account["username"] for account in accounts]
    result["missing"] = missing_interest(names)
    result["extra"] = extra_usernames(names)
    return result


def run(graph, out_dir, now, limit, user_token):
    secrets = set()
    remember(secrets, user_token)
    try:
        result = build(graph, limit, user_token, secrets)
    except Exception as exc:  # noqa: BLE001
        result = empty_result(limit)
        result["fatal"] = shorten(scrub(exc, secrets))
    csv_name = f"ig_insights_{now:%Y%m%d}.csv"
    summary = render_summary(result, now, csv_name)
    csv_path, summary_path = write_outputs(out_dir, now, result.get("rows") or [], summary, secrets)
    print(status_line(result), flush=True)
    print(f"已寫入 {csv_path}", flush=True)
    print(f"已寫入 {summary_path}", flush=True)
    return 1 if result.get("fatal") else 0


def main(argv=None):
    parser = argparse.ArgumentParser(description="只讀抓取 IG 成效，寫入 social/insights/")
    parser.add_argument("--limit", default=os.environ.get("IG_INSIGHTS_LIMIT", str(DEFAULT_LIMIT)))
    args = parser.parse_args(argv)
    if not meta.TOKEN:
        print("META_USER_TOKEN 是空的")
        return 1
    guard_get_only()
    limit = parse_limit(args.limit)
    print(f"每個帳號最多 {limit} 則", flush=True)
    now = datetime.now(TPE)
    return run(RealGraph(), OUT, now, limit, meta.TOKEN)


if __name__ == "__main__":
    sys.exit(main())
