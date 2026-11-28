"""把警報寫進 GitHub Issue，讓 Jim 收到 Email／App 通知。不用任何額外金鑰（用 Actions 內建的 GITHUB_TOKEN）。

用法：
  python notify.py --title "🚨 系統警報" --body-file msg.md          # 有同名 open issue 就留言，沒有就開新的
  python notify.py --title "🚨 系統警報" --close --body "全部恢復正常"  # 關掉同名 issue（沒有就什麼都不做）

環境變數：GITHUB_TOKEN、GITHUB_REPOSITORY（Actions 會自動給）、NOTIFY_USER（要 @ 誰，預設 repo 擁有者）。
只會開／留言／關 issue，不會改任何檔案。
"""
import argparse
import json
import os
import sys
import urllib.request

API = "https://api.github.com"


def call(method, path, data=None):
    req = urllib.request.Request(
        API + path,
        method=method,
        data=json.dumps(data).encode() if data is not None else None,
        headers={
            "Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        body = r.read()
        return json.loads(body) if body else {}


def find_open(repo, title):
    for page in range(1, 4):
        items = call("GET", f"/repos/{repo}/issues?state=open&per_page=100&page={page}")
        for it in items:
            if it.get("title") == title and "pull_request" not in it:
                return it
        if len(items) < 100:
            break
    return None


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--title", required=True)
    p.add_argument("--body", default="")
    p.add_argument("--body-file")
    p.add_argument("--close", action="store_true")
    p.add_argument("--no-mention", action="store_true")
    a = p.parse_args()

    repo = os.environ.get("GITHUB_REPOSITORY")
    if not os.environ.get("GITHUB_TOKEN") or not repo:
        print("沒有 GITHUB_TOKEN／GITHUB_REPOSITORY，只印出內容：")
        print(a.title)
        print(a.body or (open(a.body_file, encoding="utf-8").read() if a.body_file else ""))
        return 0

    body = a.body
    if a.body_file:
        body = open(a.body_file, encoding="utf-8").read()
    user = os.environ.get("NOTIFY_USER") or repo.split("/")[0]
    if not a.no_mention and not a.close:
        body = f"@{user}\n\n{body}"  # @ 本人才保證會寄 Email

    issue = find_open(repo, a.title)
    try:
        if a.close:
            if issue:
                call("POST", f"/repos/{repo}/issues/{issue['number']}/comments", {"body": body or "已恢復正常，自動關閉。"})
                call("PATCH", f"/repos/{repo}/issues/{issue['number']}", {"state": "closed"})
                print(f"已關閉 #{issue['number']}")
            return 0
        if issue:
            call("POST", f"/repos/{repo}/issues/{issue['number']}/comments", {"body": body})
            print(f"已留言在 #{issue['number']}")
        else:
            new = call("POST", f"/repos/{repo}/issues", {"title": a.title, "body": body})
            print(f"已開新的 #{new.get('number')}")
    except Exception as e:  # noqa: BLE001
        print(f"通知失敗（不影響其他流程）：{e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
