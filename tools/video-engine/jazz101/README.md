# 影片製作 SOP（爵士101 版，給其他頻道照抄改用）

版本：2026-11-03｜整理自爵士101 EP05–22 的實際做法
程式：jimframe-site repo 的 `tools/video-engine/jazz101/`（全部原始碼，另一個對話可以直接拿來改）

---

## 0. 一張圖看完整條線

```
選題 → 寫稿（查證）→ 純口白檔 → Jim 用 ElevenLabs 生成 → 語音辨識對時
→ 每句一個場景（scenes.js）→ 畫面引擎渲染（30fps 圖片）→ 配樂＋音效混音（兩版）
→ ffmpeg 合成 MP4 → 抽查 → 輪播 4 張＋文案 → 推上 repo 佇列（IG＋Threads 自動發）
```

一集的成品：
| 檔案 | 規格 |
|---|---|
| `<集名>_配音配樂版.mp4` | 1080×1920、30fps、約 40–45 秒、配樂在人聲下 −7 dB |
| `<集名>_人聲音效版.mp4` | 同上，配樂壓到很小、音效放大 |
| `<集名>_1–4.png` | 1080×1350 輪播 |
| `<集名>_文案.txt` | 【IG 貼文文案】＋【Threads 版】兩段 |

---

## 1. 選題

- 一批 10 或 20 集。先列已做過的題目（看 repo 佇列 `tools/meta-poster/ig_queue.csv` 與 `tools/threads-poster/queue.csv`），不重複。
- 好題目＝反常識開場＋有年份有人名＋一個冷知識反轉。例：「他獨奏只用兩隻手指」「錄音在衣櫃裡躺了 12 年」。
- 一批放 1–2 集「實用技巧」（例：怎麼聽懂一首爵士的結構）。
- 20 集可以拆給 2 個助手平行寫，各給「你負責的年代／方向」和「另一個人負責什麼」，避免撞題。

## 2. 寫稿規格（最重要，決定後面好不好剪）

- 一集一段，9–10 句，約 160–190 個中文字 ≈ 45 秒。
- 結構：開場鉤子（反常識或「年份＋地點」場景）→ 人物與經過 → 一個冷知識／反轉 → 結尾「收藏起來，下次……」或「下次……想想……」。
- **一句一個畫面**：每個句號就是一個場景，句子不要太長（超過 35 字就拆）。
- 年份數字寫國字（一九五九年、零不是 ○），英文名保留英文。
- 每個事實查兩個來源；傳說性質寫「據說」；查不到的數字不寫。
- 交付三個檔：
  - `純口白.txt`：只有要念的字，一集一段、空一行，直接整份貼 ElevenLabs。
  - `錄音稿.txt`：有「EP14｜標題」和念法提示。
  - `對照表與出處.txt`：每集關鍵事實、存疑處、出處網址。

## 3. 配音

- Jim 把整份純口白貼進 ElevenLabs（Jim 聲音分身）生成一個 mp3 丟回對話。
- 收到先抽查頭、尾、中間（用語音辨識），**ElevenLabs 常常整段跳過或吃字**（例：EP23 前半整段沒念）。有漏就把該集整段重給 Jim 重新生成，不要硬剪。

## 4. 語音辨識與對時（`asr.py`、`align_ep.py`）

1. 轉成 16kHz 單聲道：`ffmpeg -i in.mp3 -ar 16000 -ac 1 a16.wav`，另轉 44.1kHz 給混音用。
2. **先整檔辨識一次找每集的切點，再把每集切開各辨識一次**。整檔 7 分鐘以上辨識品質會變差、時間戳會飄（實測整檔對齊率 76%，分集後 86–99%）。
3. 比對法：腳本每個中文字轉拼音（pypinyin，先 opencc 轉簡體）、辨識結果的阿拉伯數字先轉回國字（cn2an），用 difflib 找最長對應，得到每個「子句」（，。：、？）的開始時間。
4. 每集結尾只多留 0.3 秒，並把人聲最後 0.12 秒淡出，避免混進下一集開頭的字。做完用辨識聽一次每集最後 4 秒確認。
5. 輸出 `epdata.js`：每集 `dur`（秒）、`sst`（每句開始時間＝換場景時間）、`clauses`（字幕每個子句的開始時間）。

## 5. 場景設計（`scenes.js`）

每集一個物件，**每句一個場景**，數量必須等於句數：

```js
{ key:'WesMontgomery大拇指', title:'大拇指的吉他手', mood:'wes', sc:[
  {c:'不用彈片<br><span class="acc">用大拇指</span>', a:{fx:'thumb'}, s:[['pluck',0.6]]},
  {c:'Wes<br><span class="acc">Montgomery</span>', a:'i:guitar', s:[['strum',0.3]]},
  ...
]}
```
- `c`：大字卡（上方），兩行、每行 ≤ 8 字，重點詞用 `acc`（金色）。
- `a`：畫面。三種寫法：
  - `{fx:'名稱', 參數}`：動畫特效（見下表）
  - `'i:sax'`：手繪樂器圖（sax trumpet guitar drums piano mic bass notes）
  - `'s:band'`：手繪場景（band listen comping stage-drums …）
- `s`：音效，`[名稱, 場景開始後第幾秒]`。
- `mood`：配樂風格（見第 7 節）。

**特效庫（eng.html＋fx2.js，約 70 種，可直接重用）**
| 類型 | 特效 |
|---|---|
| 時間 | year（日曆跳年份）、clock、calendar、seasons（春夏秋冬）、daynight |
| 數字 | count（數字滾動＋單位）、pie（百分比圓餅）、choruses（格子一格一格亮）、xs（一排紅叉） |
| 文字物件 | stamp（紅章：違法／售罄／輸了）、news（報紙頭版）、mag（雜誌封面）、note（手寫信紙）、bubble（對話泡泡）、book、twobooks、spell（三張字卡） |
| 唱片錄音 | vinyl（轉動黑膠＋標籤）、closet（衣櫃裡的盤帶）、console（控制台推桿）、records（Blue Note 封面牆）、wrongmic |
| 場所 | hall（音樂廳立面）、house（亮燈住宅）、bridge（大橋＋火車）、marquee（劇院招牌）、gas（加油站）、pin（地圖釘）、globe |
| 人物 | girl（跳舞／拿麥克風，可改衣服髮色）、duo（兩人同台／隔離線）、sisters、anon（匿名剪影）、laugh、noise（鄰居抗議） |
| 樂器樂理 | grand／badpiano、keys（琴鍵標音）、thumb（拇指撥弦）、octave（八度指型）、steps（三個調跳動）、loop（左手重複）、251、chord、hand（哪幾隻手指） |
| 情緒轉折 | question、spot（聚光燈）、curtain、fade（淡出＋問號）、decline（下滑折線）、truefalse（真的／傳說，可改標籤） |

**選特效的原則**：畫面要「演出這句話」，不是放一個無關的圖。年份句用 year、數字句用 count、「被禁止／失敗」用 stamp、人名句用樂器圖。做完一定看縮圖總表，對不上就換（例：「重新學吹」原本用了寫著「一年半」的日曆，數字不對，改成紅章「從頭學」）。

## 6. 畫面引擎與渲染（`eng.html`、`shot.js`）

- 一個 HTML 頁面，`render(t)` 畫出第 t 秒的畫面：上方大字卡、中間動畫、下方字幕（跟著子句換）、底部進度條、細顆粒雜訊。
- 版面：背景深藍 #0E1620、金色 #E3A544、大字 Noto Serif CJK TC 粗體 100px。
- 先出**每個場景一張靜態圖**（`node shot.js <ep> stills`），拼成縮圖總表整批看一次，再正式渲染。
- 正式：`node shot.js <ep> frames` → 每秒 30 張 jpg（一集約 1,300 張）。三集平行跑，9 集約 30 分鐘。

## 7. 配樂與音效（`audio.py`，全部程式合成，沒有版權問題）

- 每集依年代、樂器換風格（`mood`）。現有：

| mood | 風格 | 用在 |
|---|---|---|
| five | 5/4 拍 | Take Five |
| club / swing | 中速搖擺 | 一般故事 |
| ballad | 慢板鋼琴＋弦樂 | 沉重題材 |
| hot | 早期紐奧良（班鳩、管樂） | 1910–20 年代 |
| bebop | 快速咆勃 | 1940 年代 |
| gypsy | 吉普賽吉他 | Django |
| bigband / toms / blues | 大樂團、通鼓、藍調 | 搖擺年代 |
| hardbop | Blue Note 硬咆勃 | 1950–60 年代 |
| coltrane | 快速轉調 | Giant Steps |
| koln | 獨奏鋼琴左手重複 | Köln Concert |
| calypso | 加勒比海節奏 | Sonny Rollins |
| wes / chet | 吉他八度旋律／弱音小號 | 人物專屬 |
| modal / guitar | 調式、吉他和弦 | 樂理集 |

- 音效約 45 種（翻紙、唱針、掌聲、蓋章、火、火車、球棒、開門、時鐘、硬幣…），寫在場景的 `s` 裡，對準動作那一刻。
- 混音標準（照咖啡101 EP01 v2）：
  - 配音配樂版：人聲＋配樂 −7 dB（講話時自動再壓低 35%）＋音效 −9 dB
  - 人聲音效版：人聲＋音效放大 1.15 倍＋配樂只留 12%
  - 加殘響、整支響度標準化到 −14 LUFS、軟限幅防破音
- 跑法：`python3 audio.py <ep>` → `aud/e<ep>_music.wav`、`aud/e<ep>_sfx.wav`。

## 8. 合成（`enc.sh`）

```
ffmpeg -framerate 30 -i f<ep>/f%04d.jpg -i aud/e<ep>_music.wav \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k \
  -shortest -movflags +faststart <集名>_配音配樂版.mp4
```
一集約 3.5–5MB。上 IG 用新壓縮標準（repo README：CRF 20、上限約 5Mbps），不要再用舊的 10MB 壓縮，畫質會糊。

## 9. 抽查（每批必做）

1. 縮圖總表：每個場景畫面有沒有對到那句話。
2. 每集最後 4 秒跑一次語音辨識：沒有混到下一集。
3. 任抽一支、任抽一秒截圖：字幕、大字、動畫都在。
4. 文案：數字、年份、「據說」跟對照表一致。

## 10. 輪播與文案

- 輪播 4 張（`slides.js`＋`slides.html`＋`shot_slides.js`）：第 1 張大圖＋鉤子句，第 2–3 張故事，第 4 張收尾＋提問。
- 文案：鉤子＋emoji → 短段落 → 一個 📌 小標段 → 收尾 → 👇 提問 → 5 個 hashtag（#頻道名 開頭、#jazz 結尾）。Threads 版同內容不放 hashtag，最後換一個討論問題，500 字內。
- 文案和輪播字可以交給助手寫，但只准用對照表裡的事實。

## 11. 排程上架（API，不再用 MBS 手動點）

1. 輪播 PNG 轉 JPG（IG API 只收 JPG），影片用配音配樂版。
2. 放到 repo `social/media/<頻道>/`，檔名用英文短名（koln.mp4、koln_1.jpg…）。
3. IG：在 `tools/meta-poster/ig_queue.csv` 加列（id、account、publish_at 台北時間、type carousel/reel、media、caption、status=待發）。
4. Threads：在 `tools/threads-poster/queue.csv` 加列，image_url 用 `|` 串 4 張 GitHub Pages 網址，topic_tag 填主題。
5. commit 前 `git status` 只能有預期的檔案；push 後等 1–2 分鐘，確認 `https://jay0916746661.github.io/jimframe-site/social/media/<頻道>/<檔>` 打得開。
6. 時段：爵士101 現用 15:00 輪播 → 17:00 Reel、18:00 輪播 → 20:00 Reel（一天兩集）。其他頻道先看自己的成效再定。

---

## 12. 換成其他頻道要改的地方

| 要改 | 怎麼改 |
|---|---|
| 配色、字體、上方小標 | eng.html 開頭的 CSS（背景色、金色、`JAZZ 101 · 爵士小故事`） |
| 手繪圖 | data.js 的 INST／SCENES（目前是樂器），換成該頻道的物件，或改用真實照片框 |
| 特效 | 通用的（year、count、stamp、news、pie、clock、calendar、truefalse、question、spot）直接用；專屬的照 fx2.js 寫法加 |
| 配樂 | audio.py 的 STY 加新風格（例：咖啡＝依產地換拉丁／阿拉伯樂器；藝術＝古典） |
| 音效 | audio.py 的 sfx() 加新名稱 |
| 寫稿規格 | 句數、字數、結尾句型照頻道調整，但「一句一個畫面」不要改 |
| 文案 hashtag | 換成頻道自己的 5 個 |

## 13. 踩過的坑

- ElevenLabs 會漏念整段 → 收到就抽查，有漏整段重生成。
- 有一次把咖啡的音檔傳到爵士對話 → 開工前先聽前 20 秒確認是哪個頻道。
- 長音檔整檔辨識時間會飄 → 一定分集再辨識。
- ffmpeg 在 while 迴圈裡會吃掉輸入 → 加 `-nostdin`。
- 手寫 Unicode 檔名容易打錯字（圖→圦）→ 檔名一律從程式輸出複製。
- MBS 手動排程一次 300–600 次瀏覽器操作，非常耗用量 → 一律走 API 佇列。

## 14. 用量參考（一批 9–10 集）

- 寫稿查證：助手約 10–12 萬 token
- 語音辨識：約 7 分鐘
- 畫面＋音樂＋合成：約 40 次工具呼叫、渲染約 11,000–12,000 格（約 30 分鐘）
- 輪播＋文案：助手約 9 萬 token
- 排程上 API：約 12 次工具呼叫
