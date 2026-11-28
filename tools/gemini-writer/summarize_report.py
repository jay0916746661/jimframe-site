"""請 Gemini 讀 IG 週報，在最上面加 5 行白話結論。原本的週報內容一字不改，只在標題下面插入一段。

python tools/gemini-writer/summarize_report.py social/reports/週報_20261130.md
需要 GEMINI_API_KEY；沒有就什麼都不做。
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import gemini  # noqa: E402

MARK = "<!-- gemini-summary -->"

SYSTEM = ("你是 Jim 的數據助理。用繁體中文、台灣用語、白話。只根據週報裡的數字說話，不要編數字。"
          "Jim 判斷頻道好壞看「每千次觀看漲粉」，不是只看觀看數。")
ASK = ("讀完下面的 IG 週報，寫「這週白話結論」，正好 5 點，每點一行、40 字內：\n"
       "1. 這週最好的一件事 2. 最該擔心的一件事 3. 建議加碼的頻道或格式 4. 建議降頻或停的 5. 下週只做一件事的話做什麼。\n"
       "最後一行寫：需要 Claude 判斷的事（沒有就寫「無」）。\n\n週報：\n")


def main():
    if not os.environ.get("GEMINI_API_KEY"):
        print("沒有 GEMINI_API_KEY，跳過")
        return 0
    f = Path(sys.argv[1])
    md = f.read_text(encoding="utf-8")
    if MARK in md:
        print("已經有結論了")
        return 0
    text, _, model, _ = gemini.generate(ASK + md[:120000], system=SYSTEM, temperature=0.3)
    lines = md.split("\n")
    block = [MARK, "## 這週白話結論（Gemini 自動整理，數字以下方表格為準）", "", text.strip(), "", f"<sub>模型：{model}</sub>", ""]
    md2 = "\n".join(lines[:1] + [""] + block + lines[1:])
    f.write_text(md2, encoding="utf-8")
    print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
