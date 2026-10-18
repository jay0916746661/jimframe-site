// 冒煙測試：node scripts/smoke.mjs http://localhost:8000/
// 用 Playwright 在桌機與手機寬度開頁面，檢查沒有 JS 錯誤、相簿有內容、沒有水平捲動。
// Google Drive 圖片在沙盒裡常常載不到，圖片的網路錯誤會被忽略。
// 用 require 載入，才會讀到全域安裝或 NODE_PATH 裡的 playwright。
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const url = process.argv[2] || "http://localhost:8000/";
const sizes = [
  { name: "桌機", width: 1280, height: 900 },
  { name: "手機", width: 390, height: 844 },
];

const browser = await chromium.launch();
let failed = 0;

for (const s of sizes) {
  const page = await browser.newPage({ viewport: { width: s.width, height: s.height } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (/Failed to load resource|net::ERR_|drive\.google\.com|fonts\.g/.test(t)) return;
    errors.push(`console: ${t}`);
  });

  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  const albums = await page.evaluate(() => document.querySelectorAll("#albums > *").length);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

  const problems = [...errors];
  if (albums < 1) problems.push("相簿區沒有任何項目");
  if (overflow > 1) problems.push(`水平捲動 ${overflow}px`);

  if (problems.length) {
    failed++;
    console.log(`✗ ${s.name}（${s.width}px）`);
    problems.forEach((p) => console.log("   - " + p));
  } else {
    console.log(`✓ ${s.name}（${s.width}px）：相簿 ${albums} 項`);
  }
  await page.close();
}

await browser.close();
process.exit(failed ? 1 : 0);
