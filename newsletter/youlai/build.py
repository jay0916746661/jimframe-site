# 由來電子報：把模板 tpl_v3.html 組成可發布的單一 HTML，並輸出 A4 PDF
# 用法：python3 build.py  （需要 Pillow、Node.js＋playwright）
# 資料夾結構：img/venus.jpg（名畫原圖）、img/jim.jpg（Jim 的照片）
import base64, subprocess, pathlib

# ★ 刊名：改這三行就能整份換名（暫名）
NAME = "藝術101 電子報"
MAST = "藝術101"
NAME_EN = "Art 101 Letter"
from PIL import Image

D = pathlib.Path(__file__).parent
IMG = D / "img"

# 1. 從同一張高解析原圖裁出所有局部（座標以 1280×804 的原圖為準）
src = Image.open(IMG / "venus.jpg")
crops = {
    "cover.jpg":  (372, 0, 912, 804),     # 封面直式：中央女神
    "c_face.jpg": (598, 68, 728, 198),    # 細讀 i：臉
    "c_feet.jpg": (520, 560, 800, 800),   # 細讀 ii：腳與貝殼
    "c_zephyr.jpg": (20, 40, 420, 440),   # 細讀 iii：西風
    "c_hora.jpg": (840, 120, 1240, 520),  # 細讀 iv：時序女神與披風
    "strip.jpg":  (0, 170, 1280, 640),    # 概念頁底部橫幅
}
for name, box in crops.items():
    im = src.crop(box)
    if name.startswith("c_"):
        im = im.resize((600, 600), Image.LANCZOS)
    im.save(IMG / name, quality=86)
src.save(IMG / "venus_s.jpg", quality=82)

# 2. 把圖片以 data URI 嵌進模板（artifact 不能讀外部圖片）
t = (D / "tpl_v4.html").read_text(encoding="utf-8")
slots = {"cover": "cover.jpg", "venus": "venus_s.jpg", "face": "c_face.jpg", "feet": "c_feet.jpg",
         "zephyr": "c_zephyr.jpg", "hora": "c_hora.jpg", "jim": "jim.jpg", "strip": "strip.jpg"}
for k, f in slots.items():
    t = t.replace("{{" + k + "}}", "data:image/jpeg;base64," + base64.b64encode((IMG / f).read_bytes()).decode())
t = t.replace("{{NAME}}", NAME).replace("{{MAST}}", MAST).replace("{{NAME_EN}}", NAME_EN)
assert "{{" not in t, "還有沒填的圖片欄位"
out = D / "newsletter_plan.html"
out.write_text(t, encoding="utf-8")

# 3. 用 Chromium 的列印模式輸出 A4 PDF（每個 .pg 一頁）
js = f"""
const {{chromium}}=require('playwright');(async()=>{{
 const b=await chromium.launch();const p=await b.newPage();
 await p.goto('file://{out}');await p.waitForTimeout(2500);
 await p.emulateMedia({{media:'print'}});
 await p.pdf({{path:'{D}/電子報_第1期_樣刊.pdf',format:'A4',printBackground:true,margin:{{top:0,bottom:0,left:0,right:0}}}});
 await b.close()}})()"""
subprocess.run(["node", "-e", js], check=True)
print("完成：newsletter_plan.html＋電子報_第1期_樣刊.pdf")
