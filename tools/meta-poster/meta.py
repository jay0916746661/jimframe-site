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
    params = {"fields": "id,name,access_token,instagram_business_account{id,username}", "limit": 100}
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
        print(f"- {p['name']}（{p['id']}） IG：{ig.get('username', '沒有綁')}（{ig.get('id', '-')}）")
    return 0


if __name__ == "__main__":
    if "--check" in sys.argv:
        sys.exit(check())
