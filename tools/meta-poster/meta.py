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


if __name__ == "__main__":
    if "--check" in sys.argv:
        sys.exit(check())
    if "--test" in sys.argv:
        sys.exit(test())
