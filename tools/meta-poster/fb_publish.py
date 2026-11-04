"""FB 粉專定時發文：讀 fb_queue.csv，把「待發」且時間到了的貼文發到粉專，結果寫回 csv。

token 只從環境變數 META_USER_TOKEN 讀（透過 meta.py 換粉專權杖），不寫進檔案、不印出來。
不新增 secret。粉專權杖來自 GET /me/accounts，用完即丟。

python fb_publish.py            發時間到了的
python fb_publish.py --dry-run  只列出會發哪些，不發、不改檔
python fb_publish.py --check    只檢查權限與看得到的粉專，寫 fb_status.txt

規則（對齊 ig_publish.py）
- publish_at 是台北時間。超過預定時間 3 小時還沒發的，標「逾時」不發。
- 失敗標「失敗」並寫原因，不會重試；要重發把狀態改回「待發」。
- 每次最多發 4 則。只有 status 剛好是「待發」才會發。
- media 是 repo 內的相對路徑（或既有的 http(s) 網址），用 GitHub Pages 網址給粉專抓。
"""
import csv, json, re, sys, time, pathlib, urllib.parse
from datetime import datetime, timedelta, timezone

import meta

TPE = timezone(timedelta(hours=8))
BASE = "https://jay0916746661.github.io/jimframe-site/"
VIDEO_API = "https://graph-video.facebook.com/v21.0"
HERE = pathlib.Path(__file__).parent
QUEUE = HERE / "fb_queue.csv"
STATUS = HERE / "fb_status.txt"
LATE = timedelta(hours=3)
PER_RUN = 4
REEL_DAY = 30  # video_reels 發佈端點：每粉專 24 小時約 30 則
FIELDS = ["id", "account", "publish_at", "type", "media", "link", "caption", "status", "post_id", "note"]
NEED_PERMS = ["pages_show_list", "pages_manage_posts", "pages_read_engagement"]
PHOTO_EXT = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tif", ".tiff", ".webp"}
VIDEO_EXT = {".mp4", ".mov"}
SEEN = set()


def remember(token):
    if token:
        SEEN.add(token)


def scrub(msg):
    text = str(msg)
    for t in list(SEEN):
        if not t:
            continue
        text = text.replace(t, "***")
        quoted = urllib.parse.quote(t, safe="")
        if quoted and quoted != t:
            text = text.replace(quoted, "***")
    text = re.sub(r"(access_token=)[^&\s\"']+", r"\1***", text)
    text = re.sub(r"(OAuth )[A-Za-z0-9._\-]+", r"\1***", text)
    return text[:300]


def media_urls(media):
    out = []
    for part in (media or "").split():
        if part.startswith(("https://", "http://")):
            out.append(part)
        else:
            out.append(BASE + part.lstrip("/"))
    return out


def suffix(url):
    return pathlib.Path(url.split("?", 1)[0].lower()).suffix


def normalize(row):
    out = {}
    for k in FIELDS:
        val = row.get(k) or ""
        out[k] = val.strip("\n ") if k == "caption" else val.strip()
    return out


def read(path=None):
    path = pathlib.Path(path or QUEUE)
    with path.open(encoding="utf-8-sig", newline="") as f:
        return [normalize(r) for r in csv.DictReader(f)]


def write(rows, path=None):
    path = pathlib.Path(path or QUEUE)
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS, quoting=csv.QUOTE_ALL, lineterminator="\n")
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in FIELDS})


def snapshot(rows):
    return [{k: r.get(k, "") for k in FIELDS} for r in rows]


def classify(rows, now):
    """把逾時與壞掉的時間標起來。回傳時間已到、還沒超過 3 小時的列（尚未套用每次 4 則上限）。"""
    due = []
    for r in rows:
        if r["status"] != "待發":
            continue
        if not r["publish_at"]:
            r["status"], r["note"] = "失敗", "publish_at 是空的"
            continue
        try:
            at = datetime.strptime(r["publish_at"], "%Y-%m-%d %H:%M").replace(tzinfo=TPE)
        except ValueError:
            r["status"], r["note"] = "失敗", "publish_at 格式要像 2026-11-01 10:00"
            continue
        if at > now:
            continue
        if now - at > LATE:
            r["status"], r["note"] = "逾時", f"超過 3 小時沒發（{now:%m-%d %H:%M} 檢查），沒有自動補發"
            continue
        due.append(r)
    return due


def reels_recent(rows, account, now):
    n = 0
    for r in rows:
        if r["status"] != "已發" or r["type"].strip().lower() != "reel" or r["account"] != account:
            continue
        try:
            at = datetime.strptime(r["publish_at"], "%Y-%m-%d %H:%M").replace(tzinfo=TPE)
        except ValueError:
            continue
        if now - timedelta(hours=24) <= at <= now + timedelta(minutes=5):
            n += 1
    return n


def match_page(account, pages):
    account = (account or "").strip()
    if not account:
        raise RuntimeError("account 是空的")
    by_id = [p for p in pages if str(p.get("id", "")) == account]
    if len(by_id) == 1:
        return by_id[0]
    by_name = [p for p in pages if (p.get("name") or "").strip().casefold() == account.casefold()]
    if len(by_name) == 1:
        return by_name[0]
    if len(by_name) > 1:
        ids = "、".join(str(p.get("id", "")) for p in by_name)
        raise RuntimeError(f"粉專名稱對到多個（{ids}），請改填粉專 ID")
    raise RuntimeError("找不到這個粉專（名稱或 ID 對不上）")


def video_state(body):
    st = (body or {}).get("status")
    if isinstance(st, str):
        return {"video_status": st}
    return st or {}


def phase_error(st):
    if not isinstance(st, dict):
        return ""
    for key in ("processing_phase", "uploading_phase", "publishing_phase"):
        phase = st.get(key) or {}
        if not isinstance(phase, dict):
            continue
        err = phase.get("error")
        if isinstance(err, dict) and err.get("message"):
            return err["message"]
        if err and phase.get("status") in ("error", "failed"):
            return str(err)
        if phase.get("status") in ("error", "failed"):
            return f"{key} {phase.get('status')}"
    if st.get("video_status") in ("error", "expired"):
        return f"video_status={st.get('video_status')}"
    return ""


def wait_until(graph, vid, tok, ready, tries=40, pause=15):
    last = {}
    for _ in range(tries):
        last = video_state(graph.get(vid, tok, fields="status"))
        err = phase_error(last)
        if err:
            raise RuntimeError(err)
        if ready(last):
            return "ready", last
        if pause:
            time.sleep(pause)
    return "processing", last


def upload_done(st):
    up = (st.get("uploading_phase") or {}).get("status")
    if up == "complete":
        return True
    # 有些回應沒有 phase，只在真的上傳完成時才讓過
    if not st.get("uploading_phase") and st.get("video_status") in ("ready", "upload_complete"):
        return True
    return False


def publish_done(st):
    pub = (st.get("publishing_phase") or {}).get("status")
    return st.get("video_status") in ("ready", "published") or pub == "complete"


def finish_video(graph, vid, tok, after_publish, tries, pause):
    """after_publish：已經呼叫發佈。處理失敗要把 video_id 留在錯誤裡，呼叫端才不會再發一次。"""
    try:
        state, _ = wait_until(graph, vid, tok, publish_done if after_publish else upload_done, tries=tries, pause=pause)
    except RuntimeError as e:
        if after_publish:
            raise RuntimeError(f"已呼叫發佈，影片處理失敗（video_id={vid}）：{e}") from None
        raise RuntimeError(f"影片尚未發佈（video_id={vid}）：{e}") from None
    if not after_publish and state != "ready":
        raise RuntimeError(f"影片上傳超過 10 分鐘（尚未發佈，video_id={vid}）")
    return state


def publish(row, page, graph, tries=40, pause=15):
    """回傳 (post_id, 備註後綴)。會打到 Graph 的只有這一支。"""
    kind = row["type"].strip().lower()
    urls = media_urls(row["media"])
    cap = row["caption"]
    link = row["link"].strip()
    pid, tok = str(page["id"]), page["access_token"]
    remember(tok)
    if kind in ("text", "link"):
        if urls:
            raise RuntimeError("text／link 不要填 media，圖片請用 type=photo")
        if kind == "link" and not link:
            raise RuntimeError("type=link 要填 link")
        if link and not link.startswith(("http://", "https://")):
            raise RuntimeError("link 要是 http 或 https 網址")
        if not cap and not link:
            raise RuntimeError("文字貼文至少要有 caption 或 link")
        data = {}
        if cap:
            data["message"] = cap
        if link:
            data["link"] = link
        return graph.post(f"{pid}/feed", tok, **data)["id"], ""
    if kind == "photo":
        if not urls:
            raise RuntimeError("photo 至少要一張圖")
        if len(urls) > 10:
            raise RuntimeError("多圖最多 10 張")
        bad = [u for u in urls if suffix(u) and suffix(u) not in PHOTO_EXT]
        if bad:
            raise RuntimeError("photo 只能用圖片檔（jpg、png、gif、webp）")
        if len(urls) == 1:
            data = {"url": urls[0], "published": "true"}
            if cap:
                data["caption"] = cap
            body = graph.post(f"{pid}/photos", tok, **data)
            return body.get("post_id") or body["id"], ""
        ids = []
        for u in urls:
            ph = graph.post(f"{pid}/photos", tok, url=u, published="false")
            ids.append(ph["id"])
        data = {}
        if cap:
            data["message"] = cap
        for i, fid in enumerate(ids):
            data[f"attached_media[{i}]"] = json.dumps({"media_fbid": fid}, separators=(",", ":"))
        return graph.post(f"{pid}/feed", tok, **data)["id"], ""
    if kind not in ("video", "reel"):
        raise RuntimeError(f"不認得的 type：{row['type']}")
    if len(urls) != 1:
        raise RuntimeError(f"{kind} 只能一個影片檔")
    if suffix(urls[0]) and suffix(urls[0]) not in VIDEO_EXT:
        raise RuntimeError(f"{kind} 需要 mp4 或 mov")
    if kind == "video":
        data = {"file_url": urls[0], "published": "true"}
        if cap:
            data["description"] = cap
        body = graph.video(pid, tok, **data)
        vid = str(body.get("id") or body.get("video_id") or "")
        if not vid:
            raise RuntimeError("影片 API 沒有回傳 id")
        state = finish_video(graph, vid, tok, True, tries, pause)
        suffix_note = "" if state == "ready" else "（影片仍在處理）"
        return vid, suffix_note
    started = graph.post(f"{pid}/video_reels", tok, upload_phase="start")
    vid = str(started.get("video_id") or "")
    upload = started.get("upload_url") or ""
    if not vid or not upload:
        raise RuntimeError("Reel 沒有取得上傳網址")
    try:
        graph.upload_hosted(upload, tok, urls[0])
        finish_video(graph, vid, tok, False, tries, pause)
    except Exception as e:  # noqa: BLE001
        raise RuntimeError(f"Reel 上傳失敗，尚未發佈：{scrub(e)}") from None
    data = {"video_id": vid, "upload_phase": "finish", "video_state": "PUBLISHED"}
    if cap:
        data["description"] = cap
    done = graph.post(f"{pid}/video_reels", tok, **data)
    if isinstance(done, dict) and done.get("success") is False:
        raise RuntimeError(f"已呼叫發佈，Reel 回傳失敗（video_id={vid}）")
    state = finish_video(graph, vid, tok, True, tries, pause)
    suffix_note = "" if state == "ready" else "（影片仍在處理）"
    return vid, suffix_note


class RealGraph:
    def get(self, path, token=None, **params):
        if token:
            remember(token)
            return meta.get(path, token, **params)
        return meta.get(path, **params)

    def post(self, path, token, **data):
        remember(token)
        return meta.post(path, token, **data)

    def video(self, page_id, token, **data):
        """一般影片用 graph-video 的 file_url。Reels 不走這裡。"""
        remember(token)
        data["access_token"] = token
        import requests
        r = requests.post(f"{VIDEO_API}/{page_id}/videos", data=data, timeout=180)
        text = scrub(r.text or "")
        try:
            body = r.json()
        except ValueError:
            body = {}
        if not isinstance(body, dict) or not body or "error" in body or r.status_code >= 400:
            err = body.get("error", {}) if isinstance(body, dict) else {}
            msg = err.get("message") if isinstance(err, dict) else ""
            raise RuntimeError(scrub(msg or text or f"HTTP {r.status_code}"))
        return body

    def upload_hosted(self, upload_url, token, file_url):
        remember(token)
        import requests
        r = requests.post(upload_url, headers={"Authorization": f"OAuth {token}", "file_url": file_url}, timeout=300)
        text = scrub(r.text or "")
        try:
            body = r.json()
        except ValueError:
            body = {}
        if not isinstance(body, dict) or body.get("success") is not True or r.status_code >= 400:
            err = body.get("error", {}) if isinstance(body, dict) else {}
            msg = err.get("message") if isinstance(err, dict) else ""
            raise RuntimeError(scrub(msg or text or f"HTTP {r.status_code}"))
        return body

    def pages(self):
        found = meta.pages()
        for p in found:
            remember(p.get("access_token", ""))
        return found


def page_line(p):
    return f"- {p.get('name', '')}（{p.get('id', '')}）"


def check(graph=None, queue_path=None, status_path=None, now=None):
    graph = graph or RealGraph()
    now = now or datetime.now(TPE)
    lines = [f"檢查時間：{now:%Y-%m-%d %H:%M}（台北）"]
    code = 0
    if not meta.TOKEN and not getattr(graph, "force", False):
        lines.append("META_USER_TOKEN 是空的")
        code = 1
    else:
        try:
            remember(meta.TOKEN)
            perms = graph.get("me/permissions").get("data", [])
            ok = [p["permission"] for p in perms if p.get("status") == "granted"]
            lines.append("已授權：" + ", ".join(ok))
            missing = [p for p in NEED_PERMS if p not in ok]
            lines.append("可以發粉專：" + ("是" if not missing else "否，缺 " + ", ".join(missing)))
            found = graph.pages()
            lines.append(f"粉專 {len(found)} 個：")
            for p in sorted(found, key=lambda x: ((x.get("name") or ""), str(x.get("id") or ""))):
                lines.append(page_line(p))
            rows = read(queue_path) if queue_path or QUEUE.exists() else []
            need = sorted({r["account"] for r in rows if r["status"] == "待發"})
            if not need:
                lines.append("佇列裡沒有待發的列")
            for a in need:
                try:
                    hit = match_page(a, found)
                    lines.append(f"{a}：找得到（{hit.get('name', '')} {hit.get('id', '')}）")
                except RuntimeError as e:
                    lines.append(f"{a}：{e}")
        except Exception as e:  # noqa: BLE001
            lines.append(f"檢查失敗：{scrub(e)}")
            code = 1
    text = "\n".join(lines) + "\n"
    pathlib.Path(status_path or STATUS).write_text(text, encoding="utf-8")
    print(text, end="")
    return code


def plan_posts(rows, due, now):
    """挑這次真的要發的列。已達 Reels 上限的不占名額，避免擋住後面的文字或照片。"""
    planned, skipped = [], []
    shadow = [dict(r) for r in rows]
    for r in due:
        if len(planned) >= PER_RUN:
            break
        if r["type"].strip().lower() == "reel" and reels_recent(shadow, r["account"], now) >= REEL_DAY:
            skipped.append(r)
            continue
        planned.append(r)
        ghost = dict(r)
        ghost["status"] = "已發"
        shadow.append(ghost)
    return planned, skipped


def brief(row):
    cap = row["caption"].replace("\n", " ")
    extra = f" link={row['link']}" if row["link"] else ""
    media = f" media={row['media']}" if row["media"] else ""
    return f"{row['id']} {row['account']} {row['type']} {row['publish_at']}{media}{extra} {cap[:40]}"


def main(argv=None, now=None, graph=None, queue_path=None, tries=40, pause=15):
    argv = list(sys.argv[1:] if argv is None else argv)
    dry = "--dry-run" in argv
    now = now or datetime.now(TPE)
    graph = graph or RealGraph()
    remember(meta.TOKEN)
    rows = read(queue_path)
    before = snapshot(rows)
    due = classify(rows, now)
    planned, skipped = plan_posts(rows, due, now)
    late = sum(1 for a, b in zip(before, rows) if a["status"] != b["status"] and b["status"] == "逾時")
    if dry:
        print(f"dry-run {now:%Y-%m-%d %H:%M}（台北）不會發文、不會改佇列")
        found = None
        if planned and (meta.TOKEN or getattr(graph, "force", False)):
            try:
                found = graph.pages()
            except Exception as e:  # noqa: BLE001
                print(f"這次讀不到粉專清單：{scrub(e)}")
        elif planned:
            print("沒有 META_USER_TOKEN，只檢查佇列，不查粉專")
        for r in rows:
            if r["status"] == "逾時" and any(b["id"] == r["id"] and b["status"] != "逾時" for b in before):
                print(f"[逾時] {r['id']} {r['note']}")
            if r["status"] == "失敗" and any(b["id"] == r["id"] and b["status"] == "待發" for b in before):
                print(f"[失敗] {r['id']} {r['note']}")
        for r in skipped:
            print(f"[略過] {r['id']} 這個粉專 24 小時內的 Reels 已達 {REEL_DAY} 則，正式執行會留著待發")
        for r in planned:
            where = ""
            if found is not None:
                try:
                    hit = match_page(r["account"], found)
                    where = f" → {hit.get('name', '')}（{hit.get('id', '')}）"
                except RuntimeError as e:
                    where = f" → {e}"
            print(f"[會發] {brief(r)}{where}")
        print(f"本次會發 {len(planned)} 則（上限 {PER_RUN}），另有逾時 {late} 則")
        return 0

    def persist():
        nonlocal before
        if snapshot(rows) != before:
            write(rows, queue_path)
            before = snapshot(rows)

    # 逾時先落檔。每一則發完也立刻落檔，避免執行被中斷後下一輪把已發出的再發一次。
    persist()
    sent = 0
    for r in skipped:
        print(f"{r['id']}：略過，這個粉專 24 小時內的 Reels 已達 {REEL_DAY} 則，保留待發")
    if planned:
        try:
            found = graph.pages()
        except Exception as e:  # noqa: BLE001
            print(f"這次讀不到粉專清單，保留待發：{scrub(e)}")
            found = None
        if found is not None:
            for r in planned:
                try:
                    page = match_page(r["account"], found)
                    post_id, suffix = publish(r, page, graph, tries=tries, pause=pause)
                    r["post_id"] = post_id
                    r["status"] = "已發"
                    r["note"] = f"{datetime.now(TPE):%m-%d %H:%M} 發出{suffix}"
                except Exception as e:  # noqa: BLE001
                    msg = scrub(e)
                    r["status"], r["note"] = "失敗", msg
                    if "已呼叫發佈" in msg:
                        m = re.search(r"video_id=(\d+)", msg)
                        if m:
                            r["post_id"] = m.group(1)
                print(f"{r['id']}：{r['status']} {r['note']}")
                sent += 1
                persist()
    print(f"本次處理 {sent} 則，逾時 {late} 則")
    return 0


if __name__ == "__main__":
    sys.exit(check() if "--check" in sys.argv else main())
