"""保臉改髮型批次工具。"""

from __future__ import annotations

import argparse
import csv
import html
import sys
from datetime import datetime
from pathlib import Path

from dotenv import dotenv_values
from PIL import Image

from backends import load_backend
from face_pipeline import (
    IMAGE_EXTENSIONS,
    FaceEngine,
    FaceParser,
    cosine_similarity,
    paste_original_face,
    read_image,
    save_png,
)

ROOT = Path(__file__).resolve().parent


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="鎖住原臉、只改髮型，並用 ArcFace 驗收身分。")
    parser.add_argument("--prompt", default="change the hairstyle", help="英文髮型編輯提示詞")
    parser.add_argument("--n", type=int, default=4, help="每張原圖的候選數（預設 4）")
    parser.add_argument("--threshold", type=float, default=0.60, help="身分相似度門檻（預設 0.60）")
    parser.add_argument("--dry-run", action="store_true", help="不呼叫 API，以原圖跑完整流程")
    return parser.parse_args()


def report_page(rows: list[dict[str, str]], destination: Path) -> None:
    grouped: dict[str, list[dict[str, str]]] = {}
    for row in rows:
        grouped.setdefault(row["原檔名"], []).append(row)
    sections: list[str] = []
    for filename, items in grouped.items():
        first = items[0]
        if not first["候選編號"]:
            sections.append(f'<section><h2>{html.escape(filename)}</h2><p class="skip">{html.escape(first["備註"])}</p></section>')
            continue
        slug = first["輸出名稱"]
        candidate_cards = "".join(
            f'<figure><img src="candidates/{html.escape(item["候選檔"])}"><figcaption>候選 {item["候選編號"]} '
            f'· {float(item["相似度"]):.4f} · {"通過" if item["是否通過"] == "是" else "淘汰"}</figcaption></figure>'
            for item in items
        )
        sections.append(
            f'<section><h2>{html.escape(filename)}</h2><div class="compare">'
            f'<figure><img src="originals/{html.escape(slug)}"><figcaption>原圖</figcaption></figure>'
            f'<figure><img src="best/{html.escape(slug)}"><figcaption>最佳結果</figcaption></figure>'
            f'</div><h3>全部候選</h3><div class="candidates">{candidate_cards}</div></section>'
        )
    document = f"""<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>保臉改髮型結果</title><style>
:root{{color-scheme:light dark;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}}body{{margin:auto;max-width:1200px;padding:24px;background:#f5f5f7;color:#1d1d1f}}section{{background:#fff;border-radius:18px;padding:20px;margin:0 0 24px;box-shadow:0 8px 30px #0001}}.compare,.candidates{{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}}figure{{margin:0}}img{{display:block;width:100%;height:auto;border-radius:12px}}figcaption{{padding:8px 2px;color:#666}}.skip{{color:#b42318}}@media(prefers-color-scheme:dark){{body{{background:#111;color:#f5f5f7}}section{{background:#1c1c1e}}figcaption{{color:#aaa}}}}
</style><body><h1>保臉改髮型結果</h1>{''.join(sections)}</body></html>"""
    (destination / "index.html").write_text(document, encoding="utf-8")


def main() -> int:
    args = arguments()
    if args.n < 1:
        raise SystemExit("--n 必須大於 0")
    if not 0 <= args.threshold <= 1:
        raise SystemExit("--threshold 必須介於 0 與 1")

    inputs = sorted(path for path in (ROOT / "input").iterdir() if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS)
    if not inputs:
        raise SystemExit("input/ 沒有支援的圖片（jpg/jpeg/png/webp/heic）")

    stamp = datetime.now().strftime("%Y%m%d-%H%M")
    destination = ROOT / "output" / stamp
    for name in ("best", "candidates", "masks", "originals"):
        (destination / name).mkdir(parents=True, exist_ok=True)

    backend = None
    if not args.dry_run:
        config = {key: value or "" for key, value in dotenv_values(ROOT / ".env").items()}
        backend = load_backend(config.get("FACE_EDIT_BACKEND", "gemini"), config)

    faces = FaceEngine()
    parser = FaceParser(ROOT / "models" / "bisenet-resnet18.onnx")
    rows: list[dict[str, str]] = []

    for index, path in enumerate(inputs, 1):
        print(f"[{index}/{len(inputs)}] {path.name}")
        try:
            original = read_image(path)
        except Exception as error:
            rows.append(_skipped(path.name, f"讀圖失敗：{error}"))
            continue
        original_face = faces.analyze(original)
        if original_face is None:
            rows.append(_skipped(path.name, "未偵測到人臉，已跳過"))
            continue

        slug = f"{path.stem}.png"
        save_png(original, destination / "originals" / slug)
        hair_mask, face_mask = parser.masks(original, original_face.bbox)
        Image.fromarray(hair_mask).save(destination / "masks" / f"{path.stem}-hair.png")
        Image.fromarray(face_mask).save(destination / "masks" / f"{path.stem}-face.png")

        candidates: list[dict[str, object]] = []
        for number in range(1, args.n + 1):
            generated = original.copy() if args.dry_run else backend.edit(original, Image.fromarray(hair_mask), args.prompt)
            restored = paste_original_face(original, generated, face_mask)
            filename = f"{path.stem}-{number:02d}.png"
            save_png(restored, destination / "candidates" / filename)
            candidate_face = faces.analyze(restored)
            similarity = cosine_similarity(original_face.embedding, candidate_face.embedding) if candidate_face else 0.0
            candidates.append({"number": number, "filename": filename, "image": restored, "score": similarity})

        best = max(candidates, key=lambda item: float(item["score"]))
        save_png(best["image"], destination / "best" / slug)
        all_rejected = not any(float(item["score"]) >= args.threshold for item in candidates)
        note_parts = []
        if original_face.count > 1:
            note_parts.append(f"偵測到 {original_face.count} 張臉，只處理最大臉")
        if all_rejected:
            note_parts.append("全部淘汰；best 留最高分供參考")
        for item in candidates:
            passed = float(item["score"]) >= args.threshold
            rows.append({
                "原檔名": path.name,
                "候選編號": str(item["number"]),
                "相似度": f'{float(item["score"]):.6f}',
                "是否通過": "是" if passed else "否",
                "是否為最佳": "是" if item is best else "否",
                "備註": "；".join(note_parts),
                "輸出名稱": slug,
                "候選檔": str(item["filename"]),
            })

    fieldnames = ["原檔名", "候選編號", "相似度", "是否通過", "是否為最佳", "備註"]
    with (destination / "report.csv").open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    report_page(rows, destination)
    print(f"完成：{destination}")
    return 0


def _skipped(filename: str, note: str) -> dict[str, str]:
    return {"原檔名": filename, "候選編號": "", "相似度": "", "是否通過": "否", "是否為最佳": "否", "備註": note, "輸出名稱": "", "候選檔": ""}


if __name__ == "__main__":
    sys.exit(main())
