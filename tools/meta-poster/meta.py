"""IG／FB 粉專 API 工具。token 只從環境變數 META_USER_TOKEN 讀，不寫進任何檔案、不印出來。
python meta.py --check   列出這個權杖能管的粉專和 IG 帳號、已授權的權限
"""
import os, sys, requests

API = "https://graph.facebook.com/v21.0"
TOKEN = os.environ.get("META_USER_TOKEN", "").strip()


def get(path, token=TOKEN, **params):
    params["access_token"] = token
    r = requests.get(f"{API}/{path}", params=params, timeout=60)
    body = r.json()
    if "error" in body:
        msg = body["error"].get("message", "")
        raise RuntimeError(msg.replace(token, "***"))
    return body


def pages():
    out, url = [], "me/accounts"
    params = {"fields": "id,name,access_token,about,picture{is_silhouette},cover{source},instagram_business_account{id,username,biography}", "limit": 100}
    data = get(url, **params)
    out += data.get("data", [])
    while data.get("paging", {}).get("next"):
        data = requests.get(data["paging"]["next"], timeout=60).json()
        out += data.get("data", [])
    return out


def check():
    if not TOKEN:
        print("META_USER_TOKEN 是空的"); return 1
    me = get("me", fields="id,name")
    print(f"授權人：{me.get('name')}")
    perms = get("me/permissions").get("data", [])
    print("已授權：" + ", ".join(p["permission"] for p in perms if p.get("status") == "granted"))
    missing = [p["permission"] for p in perms if p.get("status") != "granted"]
    if missing:
        print("被拒絕：" + ", ".join(missing))
    ps = pages()
    print(f"\n粉專 {len(ps)} 個：")
    for p in ps:
        ig = p.get("instagram_business_account") or {}
        pic = "無大頭貼" if (p.get("picture") or {}).get("data", {}).get("is_silhouette", True) else "有大頭貼"
        cov = "有封面" if p.get("cover") else "無封面"
        about = "有簡介" if p.get("about") else "無簡介"
        print(f"- {p['name']}（{p['id']}） IG：{ig.get('username', '沒有綁')}（{ig.get('id', '-')}）｜{pic}｜{cov}｜{about}")
    return 0


def post(path, token, **data):
    data["access_token"] = token
    r = requests.post(f"{API}/{path}", data=data, timeout=120)
    body = r.json()
    if "error" in body:
        raise RuntimeError(body["error"].get("message", "").replace(token, "***"))
    return body


def test(account="art101.tw"):
    """不公開的測試：IG 只建立素材容器不發佈；FB 建一則未發佈貼文（不會出現在粉專上）。"""
    img = "https://raw.githubusercontent.com/jay0916746661/jimframe-site/main/social/test/api_test.jpg"
    for p in pages():
        ig = p.get("instagram_business_account") or {}
        if ig.get("username") != account:
            continue
        ptok = p["access_token"]
        try:
            c = post(f"{ig['id']}/media", ptok, image_url=img, caption="API 測試（不會發佈）")
            st = get(c["id"], ptok, fields="status_code")
            print(f"IG {account}：素材容器建立成功，狀態 {st.get('status_code')}（沒有發佈）")
        except RuntimeError as e:
            print(f"IG {account}：失敗 {e}")
        try:
            f = post(f"{p['id']}/photos", ptok, url=img, caption="API 測試（未發佈）", published="false")
            print(f"FB {p['name']}：未發佈相片建立成功（粉專上看不到）")
        except RuntimeError as e:
            print(f"FB {p['name']}：失敗 {e}")
        return 0
    print(f"找不到 {account}")
    return 1


def brand():
    """把每個 IG 的大頭貼和簡介存到 social/brand/，給做封面和補粉專用。"""
    import json, pathlib
    out = pathlib.Path("../../social/brand"); out.mkdir(parents=True, exist_ok=True)
    info = {}
    for p in pages():
        ig = p.get("instagram_business_account") or {}
        if not ig:
            continue
        d = get(ig["id"], p["access_token"], fields="username,name,biography,profile_picture_url")
        u = d["username"]
        if d.get("profile_picture_url"):
            (out / f"{u}.jpg").write_bytes(requests.get(d["profile_picture_url"], timeout=60).content)
        info[u] = {"page_id": p["id"], "page_name": p["name"], "ig_name": d.get("name", ""),
                   "bio": d.get("biography", ""), "has_cover": bool(p.get("cover")),
                   "has_about": bool(p.get("about")),
                   "silhouette": (p.get("picture") or {}).get("data", {}).get("is_silhouette", True)}
        print(f"{u}: 已存")
    (out / "brand.json").write_text(json.dumps(info, ensure_ascii=False, indent=1), encoding="utf-8")
    return 0


def apply_profiles():
    """照 social/brand/plan.json 補粉專的大頭貼、封面、簡介。只補 plan 裡列的項目。"""
    import json, pathlib
    plan = json.loads(pathlib.Path("../../social/brand/plan.json").read_text(encoding="utf-8"))
    base = "https://raw.githubusercontent.com/jay0916746661/jimframe-site/main/social/brand/"
    toks = {p["id"]: p["access_token"] for p in pages()}
    for u, job in plan.items():
        pid, tok = job["page_id"], toks.get(job["page_id"])
        if not tok:
            print(f"{u}: 找不到粉專權杖"); continue
        if job.get("picture"):
            try:
                post(f"{pid}/picture", tok, picture=base + job["picture"])
                print(f"{u}: 大頭貼 OK")
            except RuntimeError as e:
                print(f"{u}: 大頭貼失敗 {e}")
        if job.get("cover"):
            try:
                ph = post(f"{pid}/photos", tok, url=base + job["cover"], published="false")
                post(pid, tok, cover=ph["id"])
                print(f"{u}: 封面 OK")
            except RuntimeError as e:
                print(f"{u}: 封面失敗 {e}")
        if job.get("about"):
            try:
                post(pid, tok, about=job["about"])
                print(f"{u}: 簡介 OK")
            except RuntimeError as e:
                print(f"{u}: 簡介失敗 {e}")
    return 0


def stats(account="art101.tw", n=5):
    """目前權限拿得到的成效：讚、留言數（觸及／觀看要再開數據權限）。"""
    for p in pages():
        ig = p.get("instagram_business_account") or {}
        if ig.get("username") != account:
            continue
        d = get(ig["id"], p["access_token"], fields=f"followers_count,media_count,media.limit({n}){{id,caption,like_count,comments_count,timestamp,media_type}}")
        print(f"{account}：追蹤 {d.get('followers_count')}，貼文 {d.get('media_count')}")
        for m in d.get("media", {}).get("data", []):
            extra = ""
            try:
                ins = get(f"{m['id']}/insights", p["access_token"], metric="reach,views,saved,shares")
                v = {x["name"]: x["values"][0]["value"] for x in ins.get("data", [])}
                extra = f" 觸及 {v.get('reach')} 觀看 {v.get('views')} 收藏 {v.get('saved')} 分享 {v.get('shares')}"
            except RuntimeError as e:
                extra = f" （數據：{str(e)[:60]}）"
            print(f"  {m['timestamp'][:10]} {m['media_type']:<14} 讚 {m.get('like_count')} 留言 {m.get('comments_count')}{extra}｜{(m.get('caption') or '')[:16]}")
        try:
            ins = get(f"{ig['id']}/insights", p["access_token"], metric="reach", period="day", metric_type="total_value", breakdown="follow_type")
            res = ins["data"][0]["total_value"]["breakdowns"][0]["results"]
            print("  昨天觸及：" + "、".join(f"{'粉絲' if r['dimension_values'][0]=='FOLLOWER' else '非粉絲'} {r['value']}" for r in res))
        except Exception as e:  # noqa: BLE001
            print(f"  （粉絲／非粉絲觸及：{str(e)[:80]}）")
    return 0


def discover(target, me="art101.tw", n=5):
    """查別人的 IG 商業／創作者帳號：追蹤數、最近貼文的讚和留言。"""
    for p in pages():
        ig = p.get("instagram_business_account") or {}
        if ig.get("username") != me:
            continue
        f = f"business_discovery.username({target}){{username,followers_count,media_count,media.limit({n}){{caption,like_count,comments_count,timestamp,media_type}}}}"
        d = get(ig["id"], p["access_token"], fields=f)["business_discovery"]
        print(f"{d['username']}：追蹤 {d.get('followers_count')}，貼文 {d.get('media_count')}")
        for m in d.get("media", {}).get("data", []):
            print(f"  {m['timestamp'][:10]} {m['media_type']:<14} 讚 {m.get('like_count')} 留言 {m.get('comments_count')}｜{(m.get('caption') or '')[:18]}")
    return 0


def research(me="art101.tw", n=30):
    """批次查 social/research/targets.csv 的帳號，存 accounts.csv、posts.csv。"""
    import csv, pathlib
    base = pathlib.Path("../../social/research")
    targets = list(csv.DictReader((base / "targets.csv").open(encoding="utf-8")))
    page = next(p for p in pages() if (p.get("instagram_business_account") or {}).get("username") == me)
    igid, tok = page["instagram_business_account"]["id"], page["access_token"]
    acc_rows, post_rows = [], []
    for t in targets:
        h = t["handle"].strip()
        f = (f"business_discovery.username({h}){{username,name,followers_count,media_count,"
             f"media.limit({n}){{caption,like_count,comments_count,timestamp,media_type,permalink}}}}")
        try:
            d = get(igid, tok, fields=f)["business_discovery"]
        except RuntimeError as e:
            print(f"{h}: 查不到（{str(e)[:50]}）")
            continue
        acc_rows.append({"niche": t["niche"], "handle": h, "name": d.get("name", ""),
                         "followers": d.get("followers_count", 0), "posts": d.get("media_count", 0)})
        for m in d.get("media", {}).get("data", []):
            post_rows.append({"niche": t["niche"], "handle": h, "followers": d.get("followers_count", 0),
                              "time": m.get("timestamp", ""), "type": m.get("media_type", ""),
                              "likes": m.get("like_count", ""), "comments": m.get("comments_count", ""),
                              "url": m.get("permalink", ""),
                              "caption": (m.get("caption") or "").replace("\n", " ")[:200]})
        print(f"{h}: OK 追蹤 {d.get('followers_count')}")
    for name, rows in (("accounts.csv", acc_rows), ("posts.csv", post_rows)):
        if rows:
            with (base / name).open("w", encoding="utf-8", newline="") as fh:
                w = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
    return 0


def captions(account="jimframe", n=100):
    """印出某帳號的歷史文案（給分析 Jim 自己的寫法用）。"""
    for p in pages():
        ig = p.get("instagram_business_account") or {}
        if ig.get("username") != account:
            continue
        d = get(f"{ig['id']}/media", p["access_token"], fields="caption,timestamp", limit=n)
        for m in d.get("data", []):
            c = (m.get("caption") or "").replace("\n", " / ")
            if c:
                print(f"@@{m['timestamp'][:10]}｜{c}")
    return 0


if __name__ == "__main__":
    if "--captions" in sys.argv:
        sys.exit(captions())
    if "--research" in sys.argv:
        sys.exit(research())
    if "--stats" in sys.argv:
        sys.exit(stats())
    if "--discover" in sys.argv:
        sys.exit(discover(sys.argv[sys.argv.index("--discover") + 1]))
    if "--brand" in sys.argv:
        sys.exit(brand())
    if "--apply" in sys.argv:
        sys.exit(apply_profiles())
    if "--check" in sys.argv:
        sys.exit(check())
    if "--test" in sys.argv:
        sys.exit(test())
