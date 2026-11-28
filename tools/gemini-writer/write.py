"""Gemini 寫稿：選題、單集稿、IG 文案、Threads 貼文。取代原本要叫 Claude 寫稿的環節。

python tools/gemini-writer/write.py --channel coffee101 --kind 選題 --count 10
python tools/gemini-writer/write.py --channel coffee101 --kind 單集稿 --topic "伊斯坦堡的第一家咖啡館；維也納的可頌傳說"
python tools/gemini-writer/write.py --channel art101 --kind 文案 --topic "杜勒的犀牛"
python tools/gemini-writer/write.py --channel jazz101 --kind Threads --topic "藍調音階從哪來" --count 3

規則來源：tools/gemini-writer/channels/_共通.md ＋ channels/<頻道>.md（Jim 改這兩個檔就能調整寫法，不用改程式）。
避免重複：自動讀該帳號在 IG／Threads 佇列裡最近 150 則貼文的開頭，叫 Gemini 不要重複。
輸出：drafts/<頻道>/<日期>_<種類>_<題目>.md；單集稿另外存一份只有口白的 .txt，可以直接貼進 ElevenLabs 配音。
只寫 drafts/，不改佇列、不發文、不刪檔。
"""
import argparse
import csv
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))
import gemini  # noqa: E402

TPE = timezone(timedelta(hours=8))
CHANNELS = json.loads((HERE / "channels.json").read_text(encoding="utf-8"))

KINDS = {
    "選題": "請提出 {count} 個新題目。每題一行：編號｜題目（12 字內）｜一句話反轉或鉤子｜為什麼現在會有人想看｜可用的真實照片或史料。"
            "最後用 3 行說明你最推薦哪 3 題、為什麼。題目不能跟「已經做過的題目」重複或太像。",
    "單集稿": "請寫一集完整的稿，主題：{topic}\n\n照這個格式輸出（標題用 ##）：\n"
              "## 標題\n## 開場字卡（前 2 秒，12 字內，要有反轉或懸念）\n"
              "## 口白\n（給 AI 配音念的，只放要念的字，不要括號、不要表情符號、不要分鏡說明；字數 {min_chars}–{max_chars} 字；"
              "數字寫成念得出來的樣子；英文專有名詞第一次出現時用中文加原文）\n"
              "## 分鏡\n（表格：句子｜畫面｜照片搜尋關鍵字（英文）｜建議來源 Wikimedia Commons／Openverse／博物館開放典藏）\n"
              "## 英文字幕\n（口白逐句翻成自然英文，一句一行，跟口白句數一樣）\n"
              "## IG 文案\n（第一行就是鉤子；正文 150–300 字；結尾一個讓人想留言的問題；3–5 個 hashtag）\n"
              "## Threads 版\n（500 字內，口語，不要 hashtag 轟炸）\n"
              "## 出處\n（每個事實、年份、數字後面要能對到一個網址）\n"
              "## 待查\n（你不確定的地方逐條列出；找不到出處的寧可寫「待查」，不要自己補）",
    "文案": "請替這個題目寫 IG 文案與 Threads 版：{topic}\n\n格式：\n## IG 文案\n（第一行鉤子；150–300 字；結尾提問；3–5 個 hashtag）\n"
            "## Threads 版\n（500 字內）\n## 出處\n## 待查",
    "Threads": "請寫 {count} 則 Threads 貼文，主題方向：{topic}\n每則 500 字內、口語、第一句就要抓人；每則之間用一行 --- 分開；"
               "最後列 ## 出處 和 ## 待查。",
}


def recent_topics(account, n=150):
    seen = []
    for path, col in ((ROOT / "tools/meta-poster/ig_queue.csv", "caption"), (ROOT / "tools/threads-poster/queue.csv", "text")):
        if not path.exists():
            continue
        with path.open(encoding="utf-8-sig", newline="") as f:
            for r in csv.DictReader(f):
                if r.get("account", "").lstrip("@") in account and r.get("status") != "取消":
                    first = (r.get(col) or "").strip().split("\n")[0][:60]
                    if first:
                        seen.append(first)
    out, dedup = [], set()
    for s in reversed(seen):
        if s not in dedup:
            dedup.add(s)
            out.append(s)
        if len(out) >= n:
            break
    return out


def slug(s):
    s = re.sub(r"[\\/:*?\"<>|\s]+", "_", s.strip())[:30]
    return s or "untitled"


def oral_text(md):
    m = re.search(r"^##\s*口白\s*\n(.*?)(?=^##\s)", md + "\n## end", re.S | re.M)
    if not m:
        return ""
    t = m.group(1).strip()
    t = re.sub(r"^（.*?）\s*", "", t)  # 去掉說明用的括號行
    return t


def build_prompt(ch, kind, topic, count):
    rules = (HERE / "channels/_共通.md").read_text(encoding="utf-8")
    own = HERE / "channels" / f"{ch['key']}.md"
    rules += "\n\n" + (own.read_text(encoding="utf-8") if own.exists() else "")
    seen = recent_topics(ch["accounts"])
    tmpl = KINDS[kind]
    task = tmpl.format(topic=topic or "（自由發揮，符合頻道定位）", count=count,
                       min_chars=ch.get("min_chars", 140), max_chars=ch.get("max_chars", 180))
    prompt = f"頻道：{ch['name']}\n\n{task}\n\n已經做過的題目（最近的在前面，不要重複）：\n" + \
             "\n".join(f"- {s}" for s in seen[:150])
    return rules, prompt


def run_one(ch, kind, topic, count, model, search, outdir):
    system, prompt = build_prompt(ch, kind, topic, count)
    text, srcs, used, note = gemini.generate(prompt, system=system, model=model, search=search)
    now = datetime.now(TPE)
    head = [f"<!-- Gemini 草稿：{ch['name']}／{kind}／{now:%Y-%m-%d %H:%M}（台北）／模型 {used} -->",
            f"> 這是 Gemini 自動產生的**草稿**，還沒人工驗收。上線前照〈20 美金操作手冊〉第六節抽查 2 筆出處。"]
    if note:
        head.append("> 備註：" + "；".join(note))
    body = "\n".join(head) + "\n\n" + text + "\n"
    if srcs:
        body += "\n## Google 搜尋接地來源（Gemini 實際查到的網頁）\n\n" + "\n".join(f"- [{t}]({u})" for t, u in srcs) + "\n"
    outdir.mkdir(parents=True, exist_ok=True)
    name = f"{now:%Y%m%d_%H%M}_{kind}_{slug(topic or ch['key'])}"
    md = outdir / f"{name}.md"
    md.write_text(body, encoding="utf-8")
    files = [md]
    if kind == "單集稿":
        o = oral_text(text)
        if o:
            (outdir / f"{name}_口白.txt").write_text(o + "\n", encoding="utf-8")
            files.append(outdir / f"{name}_口白.txt")
            n = len(re.sub(r"\s", "", o))
            print(f"口白 {n} 字（目標 {ch.get('min_chars', 140)}–{ch.get('max_chars', 180)}）")
    return files


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--channel", required=True, help="頻道代號，見 channels.json：" + "、".join(CHANNELS))
    p.add_argument("--kind", required=True, choices=list(KINDS))
    p.add_argument("--topic", default="", help="單集稿可用；或；分隔多個題目，一題一個檔")
    p.add_argument("--count", type=int, default=10)
    p.add_argument("--model", default="")
    p.add_argument("--no-search", action="store_true", help="不開 Google 搜尋查證")
    p.add_argument("--list-file", default="", help="把產生的檔名寫進這個檔（workflow 用）")
    a = p.parse_args()
    if a.channel not in CHANNELS:
        sys.exit(f"不認得的頻道 {a.channel}，可用：{'、'.join(CHANNELS)}")
    ch = dict(CHANNELS[a.channel], key=a.channel)
    outdir = ROOT / "drafts" / a.channel
    topics = [t.strip() for t in re.split(r"[；;\n]", a.topic) if t.strip()] if a.kind == "單集稿" else [a.topic]
    if a.kind == "單集稿" and not topics:
        sys.exit("單集稿要填題目（topic）。不知道寫什麼就先跑「選題」。")
    if len(topics) > 10:
        sys.exit("一次最多 10 集，避免免費額度被用完")
    made = []
    for t in topics:
        made += run_one(ch, a.kind, t, a.count, a.model or None, not a.no_search, outdir)
        print("已寫：", made[-1].relative_to(ROOT))
    if a.list_file:
        Path(a.list_file).write_text("\n".join(str(m.relative_to(ROOT)) for m in made) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
