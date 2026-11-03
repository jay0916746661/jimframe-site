/* ===== Pure data + generators (no DOM) ===== */
var ERAS = [
  { id: 'roots', yr: '1890s–1910s', tag: '早期根源與雛形', title: '根源、散拍與紐奧良', style: 'roots', seed: 11, demos: ['roots'],
    photoQ: 'New Orleans jazz band 1910s', lead: '',
    body: [
      ['早期根源 Roots', '建立在美國南方的勞動歌、藍調與教會的福音音樂之上，帶有強烈的情感抒發與勞動節奏。'],
      ['散拍音樂 Ragtime', '1890 年代，以鋼琴為主的散拍音樂帶來標誌性的切分音，打破古典樂規律的重拍。'],
      ['紐奧良爵士 / 迪克西蘭 Dixieland', '在紐奧良的街頭遊行、舞廳與紅燈區「斯托里維爾」的酒館裡，樂手把銅管樂器與進行曲結合，發展出強調「集體即興」的音樂，充滿歡樂與草根的生命力。']
    ],
    hook: '爵士樂不是某個人發明的，是藍調、散拍與歐洲和聲在紐奧良撞出來的。',
    pts: ['根源：勞動歌、藍調與教會福音音樂', '散拍 Ragtime：鋼琴帶來標誌性的切分音', '紐奧良爵士：銅管加進行曲，強調集體即興', '兩個核心：即興與切分節奏'],
    tags: ['散拍', '紐奧良', 'Dixieland'] },
  { id: 'swing', yr: '1920s–1930s', tag: '黃金年代', title: '搖擺樂與大樂團', style: 'swing', seed: 23, demos: ['swing'],
    photoQ: 'big band swing 1930s', lead: '爵士樂最普及、最輝煌的流行年代。',
    body: [
      ['大樂團 Big Band', '10 到 20 人編制成為主流。艾靈頓公爵 Duke Ellington 把編曲與作曲提升到與古典交響樂並駕齊驅的層次。'],
      ['個人獨奏的崛起', '路易·阿姆斯壯 Louis Armstrong 確立了獨奏在爵士樂中的核心地位，以爆發力十足的小號與擬聲吟唱 Scat singing，賦予爵士樂無與倫比的搖擺感 Swing。']
    ],
    hook: '1920 到 30 年代，爵士樂成了最流行的音樂。',
    pts: ['大樂團 Big Band：10 到 20 人編制成為主流', 'Duke Ellington 把編曲提升到交響樂的層次', 'Louis Armstrong 確立獨奏的核心地位', 'Scat 擬聲吟唱，賦予爵士無與倫比的搖擺感'],
    tags: ['搖擺樂', 'BigBand', 'Swing'] },
  { id: 'bebop', yr: '1940s', tag: '藝術化革命', title: '咆勃爵士 Bebop', style: 'bebop', seed: 37, demos: ['bebop'],
    photoQ: 'bebop jazz club 1940s', lead: '一群不甘於只為舞者伴奏的音樂家，在下班後的俱樂部進行 Jam Session，徹底改變了爵士樂的發展。',
    body: [
      ['特色', '重點轉到極快的速度、複雜的非自然和弦進程與高難度獨奏。爵士樂從「舞曲」轉變為「供人聆聽的藝術」。'],
      ['代表人物', '薩克斯風手查理·帕克 Charlie Parker。他以不可思議的速度與對複雜和聲的敏銳度改寫了即興演奏的文法，現代爵士樂的即興語彙幾乎都建立在他的基礎之上。']
    ],
    hook: '樂手不想再只為舞者伴奏，於是下班後自己開了一場 Jam Session。',
    pts: ['特色：極快的速度、複雜和弦、高難度獨奏', '爵士從「舞曲」變成「供人聆聽的藝術」', 'Charlie Parker 改寫了即興演奏的文法', '現代爵士的即興語彙，幾乎都建立在他之上'],
    tags: ['Bebop', '咆勃爵士'] },
  { id: '50s', yr: '1950s', tag: '分流與擴張', title: '酷派、硬咆勃與調式爵士', style: 'modal', seed: 41, demos: ['cool', 'hardbop', 'modal'],
    photoQ: 'jazz musicians 1950s', lead: 'Bebop 之後，爵士樂分成了不同方向。',
    body: [
      ['酷派爵士 Cool Jazz', '追求冷靜、內斂與古典樂般的編排結構，音樂聽起來更有空間感。'],
      ['硬咆勃 Hard Bop', '東岸音樂家把藍調與福音的靈魂元素重新注入爵士樂，節奏更重、更具感染力。代表人物：亞特·布雷基 Art Blakey。'],
      ['調式爵士 Modal Jazz', '打破傳統複雜和弦進程的限制，改以音階 Modes 作為即興基礎。邁爾士·戴維斯 Miles Davis 的《Kind of Blue》是最高傑作，給了樂手極大的旋律自由度。']
    ],
    hook: 'Bebop 之後，爵士樂往三個方向分流。',
    pts: ['Cool Jazz：冷靜內斂，有古典樂般的結構與空間感', 'Hard Bop：把藍調與福音的泥土味重新注入', 'Modal Jazz：改以音階作為即興基礎，旋律更自由', '《Kind of Blue》是調式爵士的最高傑作'],
    tags: ['CoolJazz', 'HardBop', 'ModalJazz', 'KindOfBlue'] },
  { id: 'free', yr: '1960s', tag: '解放與實驗', title: '自由爵士 Free Jazz', style: 'free', seed: 53, demos: ['free'],
    photoQ: 'free jazz 1960s', lead: '受到美國民權運動影響，Ornette Coleman 等樂手試圖打破所有和聲、節奏與結構的規則，追求完全的聲響解放與情緒宣洩。同一時期，拉丁爵士與 Bossa Nova 也大放異彩。',
    body: [],
    hook: '受民權運動影響，樂手決定把所有規則都拆掉。',
    pts: ['Ornette Coleman 打破和聲、節奏與結構的規則', '追求完全的聲響解放與情緒宣洩', '同一時期，拉丁爵士與 Bossa Nova 也大放異彩'],
    tags: ['FreeJazz', 'BossaNova'] }
];

var PEOPLE = [
  { id: 'ellington', era: 'swing', zh: '艾靈頓公爵', en: 'Duke Ellington', instr: '鋼琴・作曲・樂團領袖', blurb: '把編曲與作曲提升到與古典交響樂並駕齊驅的層次。', yr: '1920s–1930s' },
  { id: 'armstrong', era: 'swing', zh: '路易·阿姆斯壯', en: 'Louis Armstrong', instr: '小號・人聲', blurb: '確立獨奏的核心地位，以爆發力十足的小號與 Scat singing 賦予爵士無與倫比的搖擺感。', yr: '1920s–1930s' },
  { id: 'parker', era: 'bebop', zh: '查理·帕克', en: 'Charlie Parker', instr: '薩克斯風', blurb: '以不可思議的速度與對複雜和聲的敏銳度，改寫了即興演奏的文法。', yr: '1940s' },
  { id: 'blakey', era: '50s', zh: '亞特·布雷基', en: 'Art Blakey', instr: '鼓・樂團領袖', blurb: '硬咆勃的代表人物，讓節奏更重、更具感染力。', yr: '1950s' },
  { id: 'miles', era: '50s', zh: '邁爾士·戴維斯', en: 'Miles Davis', instr: '小號', blurb: '《Kind of Blue》是調式爵士的最高傑作；1970 年的《Bitches Brew》則宣告 Fusion 時代來臨。', yr: '1950s–1970' },
  { id: 'coleman', era: 'free', zh: 'Ornette Coleman', en: '', instr: '薩克斯風', blurb: '試圖打破所有和聲、節奏與結構的規則，追求完全的聲響解放。', yr: '1960s' },
  { id: 'mclaughlin', era: 'fusion', grp: '70s', zh: '約翰·麥克勞林', en: 'John McLaughlin', instr: '吉他', blurb: '組建 Mahavishnu Orchestra，以極端的速度、複雜的奇數拍與印度音樂元素震驚樂壇。', yr: '1970s' },
  { id: 'holdsworth', era: 'fusion', grp: '70s', zh: '艾倫·霍茲沃斯', en: 'Allan Holdsworth', instr: '吉他', blurb: '追求薩克斯風般平滑流暢的連奏 Legato，使用跨度極大的非傳統封閉和弦，深刻影響現代前衛吉他。', yr: '1970s' },
  { id: 'dimeola', era: 'fusion', grp: '70s', zh: '艾爾·迪·米奧拉', en: 'Al Di Meola', instr: '吉他', blurb: '在 Return to Forever 樂團中，以刀切般的交替撥弦與強烈的拉丁地中海風情聞名。', yr: '1970s' },
  { id: 'carlton', era: 'fusion', grp: '70s', zh: '賴瑞·卡爾頓', en: 'Larry Carlton', instr: '吉他（Mr. 335）', blurb: '結合藍調情感與複雜爵士和弦，以甜美的破音與極具歌唱性的旋律線條著稱。', yr: '1970s' },
  { id: 'metheny', era: 'fusion', grp: '80s', zh: '派特·麥席尼', en: 'Pat Metheny', instr: '吉他', blurb: '80 年代 Fusion 的核心人物。用極具空間感的溫暖 Chorus 音色與敘事旋律，把巴西音樂與鄉村元素融入爵士和聲。', yr: '1980s 以後' },
  { id: 'scofield', era: 'fusion', grp: '80s', zh: '約翰·史考菲', en: 'John Scofield', instr: '吉他', blurb: '把純正的藍調與放克律動放進極度現代、不和諧的爵士和弦裡，音色帶微破的泥土味。', yr: '1980s 以後' },
  { id: 'stern', era: 'fusion', grp: '80s', zh: '麥克·史登', en: 'Mike Stern', instr: '吉他', blurb: '結合搖滾的強烈穿透力與 Bebop 的複雜綿密，能把爵士樂句用搖滾的力道「唱」出來。', yr: '1980s 以後' },
  { id: 'asato', era: 'fusion', grp: 'now', zh: 'Neo-Soul 新生代', en: 'Mateus Asato', instr: '吉他', blurb: '把福音音樂與爵士和弦，用極度流暢的雙音與滑弦彈出，強調 Behind the beat 的慵懶律動。', yr: '2000s 至今' },
  { id: 'sharkey', era: 'fusion', grp: 'now', zh: 'Neo-Soul 新生代', en: 'Isaiah Sharkey', instr: '吉他', blurb: '爵士與 R&B、嘻哈深度融合，福音味的和弦與滑弦是他的語彙。', yr: '2000s 至今' },
  { id: 'govan', era: 'fusion', grp: 'now', zh: '葛斯里·高文', en: 'Guthrie Govan', instr: '吉他', blurb: '擁有「風格無界線」的技巧，能在同一首曲子中切換藍調、Bebop 與金屬速彈。', yr: '2000s 至今' }
];

/* ---------- long-form stories ---------- */
var ERA_STORY = {
  roots: {
    story: [
      "19 世紀末的紐奧良，是美國最混雜的港口城市。法國、西班牙、加勒比海與非洲的文化在這裡交會，城裡的剛果廣場（Congo Square）早在 19 世紀初，就是非洲裔奴隸週日聚集、擊鼓跳舞的地方。",
      "1890 年代，史考特·喬普林（Scott Joplin）的散拍鋼琴曲紅遍全美，1899 年出版的〈Maple Leaf Rag〉成了最暢銷的樂譜之一。同一時期，紐奧良的銅管樂隊在遊行、喪禮和舞廳之間穿梭，把藍調和進行曲吹成一種新的聲音。",
      "短號手巴迪·博爾登（Buddy Bolden）常被視為第一位爵士樂手，但他沒有留下任何錄音，只留下傳說。真正的第一張爵士唱片，一般認為是 1917 年 Original Dixieland Jass Band 錄的〈Livery Stable Blues〉。",
      "同一年，斯托里維爾紅燈區被關閉；加上南方黑人大遷徙，許多樂手陸續北上芝加哥。爵士樂就這樣離開了紐奧良，走向全國。"
    ],
    years: [["1899", "喬普林出版〈Maple Leaf Rag〉"], ["1917", "第一張爵士唱片問世"], ["1917", "斯托里維爾關閉，樂手北上芝加哥"], ["1923", "King Oliver 的 Creole Jazz Band 首度錄音，年輕的 Armstrong 也在其中"]],
    albums: [["Maple Leaf Rag", "Scott Joplin・1899"], ["Livery Stable Blues", "Original Dixieland Jass Band・1917"], ["Dipper Mouth Blues", "King Oliver's Creole Jazz Band・1923"]]
  },
  swing: {
    story: [
      "1920 年代，爵士隨著南方黑人北遷的大遷徙來到芝加哥與紐約。收音機和唱片剛普及，爵士第一次成了全國的流行音樂，那十年也被稱為「爵士年代」。",
      "1925 到 1928 年，路易·阿姆斯壯用 Hot Five 和 Hot Seven 錄下一系列唱片，把個人獨奏推到舞台中央。1927 年起，艾靈頓公爵在紐約哈林區的棉花俱樂部駐演，電台轉播讓他的樂團全國聞名。",
      "1935 年，班尼·古德曼（Benny Goodman）在洛杉磯的演出引爆搖擺熱潮，他被稱為「搖擺之王」。1938 年，他把爵士帶進卡內基音樂廳，這場演出被視為爵士登上古典樂殿堂的里程碑。",
      "同一時期，貝西伯爵（Count Basie）的樂團從堪薩斯城帶來更重藍調、更鬆的搖擺感。全美的舞廳裡，十幾人的大樂團是最受歡迎的娛樂。"
    ],
    years: [["1925", "Armstrong 開始錄 Hot Five"], ["1927", "Ellington 進駐棉花俱樂部"], ["1935", "搖擺熱潮引爆全美"], ["1938", "Goodman 卡內基音樂廳演出"]],
    albums: [["The Hot Fives & Hot Sevens", "Louis Armstrong・1925–1928"], ["The Famous 1938 Carnegie Hall Jazz Concert", "Benny Goodman"], ["One O'Clock Jump", "Count Basie・1937"]]
  },
  bebop: {
    story: [
      "1940 年代初，紐約哈林區的 Minton's Playhouse 和 Monroe's Uptown House，每到深夜就有一群年輕樂手來即興。他們白天在大樂團裡伴舞，晚上才玩自己想玩的音樂。",
      "核心人物是薩克斯風手查理·帕克和小號手迪吉·葛拉斯彼（Dizzy Gillespie），身邊還有鋼琴手塞隆尼斯·孟克（Thelonious Monk）。鼓手肯尼·克拉克（Kenny Clarke）把穩定的拍子從大鼓移到疊音鈸（Ride）上，讓大鼓空出來做突擊式的重音。",
      "1942 到 1944 年，美國音樂家工會發起錄音禁令，Bebop 最早成形的那幾年幾乎沒有留下錄音。等到 1944 年底禁令結束，帕克和葛拉斯彼在 1945 年錄下〈Ko-Ko〉、〈Salt Peanuts〉，外界才聽到這種又快又複雜的新音樂。",
      "很多舞客抱怨跟不上，樂評也分成兩派。但從這一刻起，爵士樂手不再只是娛樂提供者，而是被當成藝術家看待。"
    ],
    years: [["1941", "Minton's Playhouse 的深夜 Jam Session 成形"], ["1942–1944", "音樂家工會錄音禁令"], ["1945", "〈Ko-Ko〉、〈Salt Peanuts〉錄音"], ["1953", "傳奇的多倫多 Massey Hall 演出"]],
    albums: [["The Complete Savoy & Dial Master Takes", "Charlie Parker・1944–1948"], ["Groovin' High", "Dizzy Gillespie・1945 單曲"], ["Jazz at Massey Hall", "The Quintet・1953"]]
  },
  '50s': {
    story: [
      "Bebop 之後，爵士開始分家。1949 到 1950 年，邁爾士·戴維斯和吉爾·伊文斯（Gil Evans）、傑瑞·穆里根（Gerry Mulligan）等編曲家錄下後來集結成《Birth of the Cool》的作品，速度放慢、音色變柔，酷派爵士由此得名，並在美國西岸流行開來。",
      "紐約這邊則走向另一個方向。亞特·布雷基的 Jazz Messengers 和鋼琴手赫瑞斯·席佛（Horace Silver）把藍調與福音的味道加回來，形成硬咆勃。Blue Note 唱片公司的錄音和封面設計，至今仍是這種聲音的代名詞。",
      "1959 年常被稱為爵士改變方向的一年：邁爾士的《Kind of Blue》、戴夫·布魯貝克的《Time Out》、明格斯的《Mingus Ah Um》都在這一年發行，柯川錄下〈Giant Steps〉，Ornette Coleman 也推出《The Shape of Jazz to Come》。",
      "其中《Kind of Blue》用音階取代密集的和弦進行，成員包括約翰·柯川、坎農鮑·艾德利和比爾·艾文斯。它後來常被稱為史上最暢銷的爵士專輯。"
    ],
    years: [["1949–1950", "《Birth of the Cool》錄音"], ["1955", "Jazz Messengers 成立"], ["1958", "Blakey 錄下《Moanin'》"], ["1959", "《Kind of Blue》、《Time Out》發行"]],
    albums: [["Birth of the Cool", "Miles Davis・1949–1950 錄音"], ["Moanin'", "Art Blakey & The Jazz Messengers・1958"], ["Kind of Blue", "Miles Davis・1959"], ["Time Out", "The Dave Brubeck Quartet・1959"]]
  },
  free: {
    story: [
      "1959 年，Ornette Coleman 帶著一把白色塑膠薩克斯風來到紐約，推出《The Shape of Jazz to Come》。他的樂團沒有鋼琴，也不照固定的和弦進行走，讓很多樂手和樂評無所適從。",
      "1960 年底，他用兩組四重奏同時即興，錄下 37 分鐘的《Free Jazz》（1961 年發行），這張專輯的名字後來成了整個風格的名稱。",
      "這也是民權運動的年代。鼓手麥克斯·羅區（Max Roach）在 1960 年發行《We Insist! Freedom Now Suite》，明格斯寫下諷刺種族隔離州長的〈Fables of Faubus〉。打破音樂的規則，也是打破社會規則的一種表態。",
      "約翰·柯川則從另一個方向走向自由。1965 年的《A Love Supreme》是一張四段組曲形式的精神告白，之後他的音樂越來越開放。同一時期，《Getz/Gilberto》讓巴西的 Bossa Nova 紅遍全世界，拿下葛萊美年度專輯。"
    ],
    years: [["1959", "《The Shape of Jazz to Come》"], ["1960", "Max Roach《We Insist!》"], ["1961", "《Free Jazz》為風格命名"], ["1964–1965", "《Getz/Gilberto》、《A Love Supreme》"]],
    albums: [["The Shape of Jazz to Come", "Ornette Coleman・1959"], ["We Insist! Freedom Now Suite", "Max Roach・1960"], ["A Love Supreme", "John Coltrane・1965"], ["Getz/Gilberto", "Stan Getz & João Gilberto・1964"]]
  }
};
var FUSION_STORY = {
  story: [
    "1969 年的《In a Silent Way》和 1970 年的《Bitches Brew》，是邁爾士·戴維斯把電吉他、電鋼琴和搖滾律動帶進爵士的兩張專輯。《Bitches Brew》裡甚至有一首曲子直接叫〈John McLaughlin〉，就是那位剛從英國來的吉他手。",
    "這些錄音裡的樂手後來各自出走，成了 70 年代融合爵士的主力：約翰·麥克勞林組了 Mahavishnu Orchestra，奇克·柯瑞亞組了 Return to Forever，喬·薩溫努和韋恩·蕭特組了 Weather Report，賀比·漢考克則用《Head Hunters》把爵士推進放克。",
    "70 年代末到 80 年代，融合爵士走向旋律與空間感。德國的 ECM 唱片發行了派特·麥席尼的早期專輯，數位效果器讓吉他的音色有了全新可能。",
    "2000 年後，爵士與 R&B、嘻哈的界線越來越模糊：羅伯特·葛拉斯帕的《Black Radio》拿下葛萊美最佳 R&B 專輯，卡馬西·華盛頓的三片裝《The Epic》讓年輕樂迷重新聽起長篇爵士。"
  ],
  years: [["1969", "《In a Silent Way》"], ["1970", "《Bitches Brew》"], ["1971", "Mahavishnu Orchestra 首張專輯"], ["1973", "《Head Hunters》"], ["2012", "《Black Radio》"], ["2015", "《The Epic》"]],
  albums: [["Bitches Brew", "Miles Davis・1970"], ["Head Hunters", "Herbie Hancock・1973"], ["Heavy Weather", "Weather Report・1977"], ["Black Radio", "Robert Glasper Experiment・2012"], ["The Epic", "Kamasi Washington・2015"]]
};
var PEOPLE_STORY = {
  ellington: { life: "1899–1974", from: "美國華盛頓特區",
    story: ["本名愛德華·甘迺迪·艾靈頓，「公爵」是他少年時因舉止優雅、穿著講究得到的綽號。", "1927 年起，他的樂團在哈林區的棉花俱樂部駐演，電台轉播讓他全國成名。他把每位樂手的個人音色當成作曲材料，寫出上千首作品。", "他和作曲家比利·史崔洪（Billy Strayhorn）合作近三十年，樂團招牌曲〈Take the 'A' Train〉就是史崔洪寫的。"],
    trivia: "1956 年新港爵士音樂節，薩克斯風手 Paul Gonsalves 連吹 27 段 Solo，全場沸騰，讓當時人氣下滑的艾靈頓重新翻紅。",
    albums: [["Ellington at Newport", "1956"], ["Money Jungle", "1962 錄音，與明格斯、羅區合作"], ["The Far East Suite", "1967"]] },
  armstrong: { life: "1901–1971", from: "美國紐奧良",
    story: ["在紐奧良貧困的街區長大。少年時因為在新年夜朝天開槍，被送進少年感化院，在那裡正式學會吹短號。", "1922 年他北上芝加哥，加入偶像 King Oliver 的樂團。1925 到 1928 年的 Hot Five、Hot Seven 錄音，讓「獨奏」從此成為爵士的核心。", "他同時是極受歡迎的歌手，沙啞的嗓音和 Scat 唱法，深深影響了後來的爵士歌手。"],
    trivia: "1964 年，他唱的〈Hello, Dolly!〉把披頭四擠下美國排行榜冠軍，那年他 62 歲。",
    albums: [["The Hot Fives & Hot Sevens", "1925–1928"], ["Ella and Louis", "1956，與 Ella Fitzgerald"], ["What a Wonderful World", "單曲・1967"]] },
  parker: { life: "1920–1955", from: "美國堪薩斯城",
    story: ["綽號 Bird。少年時在堪薩斯城的 Jam Session 出糗，相傳鼓手把鈸丟到他腳邊示意他下台，他回家後發狠苦練，據他自己說，之後好幾年每天練琴長達十幾個小時。", "1940 年代在紐約和迪吉·葛拉斯彼一起打造 Bebop，用極快的速度和複雜的和聲改寫了即興的語言。", "他長年與毒癮搏鬥，34 歲就過世。紐約著名的爵士俱樂部 Birdland 就是以他的綽號命名。"],
    trivia: "他過世後，紐約街頭出現「Bird Lives」的塗鴉，這句話後來成了爵士圈的口號。",
    albums: [["The Complete Savoy & Dial Master Takes", "1944–1948"], ["Charlie Parker with Strings", "1950"], ["Jazz at Massey Hall", "1953"]] },
  blakey: { life: "1919–1990", from: "美國匹茲堡",
    story: ["硬咆勃最具代表性的鼓手，鼓聲強勁，招牌是一陣把樂團往前推的鼓滾奏（press roll）。", "他帶領 Jazz Messengers 超過三十年，不斷起用年輕樂手，等於一所爵士學校：Lee Morgan、Wayne Shorter、Freddie Hubbard、Wynton Marsalis 都從這裡出發。"],
    trivia: "他後來改信伊斯蘭教，取名 Abdullah Ibn Buhaina，所以樂手們都叫他「Bu」。",
    albums: [["A Night at Birdland", "1954"], ["Moanin'", "1958"], ["Free for All", "1964 錄音"]] },
  miles: { life: "1926–1991", from: "美國伊利諾州，於東聖路易長大",
    story: ["1944 年到紐約念茱莉亞音樂學院，真正的目的卻是去找查理·帕克，很快就成了帕克樂團的小號手。", "他一生至少帶領爵士轉向好幾次：酷派、調式、融合都和他有關。他的兩組五重奏，一組有約翰·柯川，一組有韋恩·蕭特和賀比·漢考克，都是爵士史上最重要的樂團之一。", "他的小號音色常用弱音器，聲音克制，留白比音符還多。"],
    trivia: "1955 年新港爵士音樂節，他吹的〈'Round Midnight〉讓全場安靜下來，這場演出幫他拿到 Columbia 唱片的合約。",
    albums: [["Kind of Blue", "1959"], ["Sketches of Spain", "1960，與 Gil Evans"], ["Bitches Brew", "1970"]] },
  coleman: { life: "1930–2015", from: "美國德州沃斯堡",
    story: ["1959 年帶著一把白色塑膠薩克斯風來到紐約，他的樂團不用鋼琴，也不照固定的和弦走。", "1961 年的《Free Jazz》用兩組四重奏同時即興，專輯名後來成了整個風格的名稱。他把自己的音樂理論叫做 Harmolodics，主張和聲、旋律、節奏平等。"],
    trivia: "2007 年，他以專輯《Sound Grammar》獲得普立茲音樂獎，是極少數拿到這個獎的爵士樂手。",
    albums: [["The Shape of Jazz to Come", "1959"], ["Free Jazz", "1961"], ["Sound Grammar", "2006"]] },
  mclaughlin: { life: "1942–", from: "英國約克郡",
    story: ["1969 年從英國到美國，加入鼓手 Tony Williams 的樂團，並參與了邁爾士的《In a Silent Way》和《Bitches Brew》。", "1971 年組成 Mahavishnu Orchestra，用奇數拍、極快的速度和印度音樂的元素震撼樂壇。之後他組了以印度傳統樂器為主的 Shakti，一直在東西方音樂之間來回。"],
    trivia: "邁爾士在《Bitches Brew》裡收錄了一首名叫〈John McLaughlin〉的曲子，直接用他的名字命名。",
    albums: [["The Inner Mounting Flame", "Mahavishnu Orchestra・1971"], ["Birds of Fire", "Mahavishnu Orchestra・1973"], ["Friday Night in San Francisco", "與 Al Di Meola、Paco de Lucía・1981"]] },
  holdsworth: { life: "1946–2017", from: "英國布拉福",
    story: ["他想讓吉他聽起來像薩克斯風，所以幾乎不靠撥弦，而是用左手的搥弦與勾弦把音連起來，形成非常平滑的長樂句。", "他待過 Soft Machine、Tony Williams 的 New Lifetime、UK 等樂團，80 年代還用上合成器吉他 SynthAxe。許多搖滾與前衛吉他手都把他當成偶像。"],
    trivia: "他用的和弦常常手指張得極開、音排得很怪，很多吉他手看著譜也按不出來。",
    albums: [["I.O.U.", "1982"], ["Road Games", "1983"], ["Metal Fatigue", "1985"]] },
  dimeola: { life: "1954–", from: "美國新澤西州",
    story: ["19 歲就加入奇克·柯瑞亞的 Return to Forever，以刀切般乾淨的交替撥弦聞名。", "他的個人專輯大量融入拉丁與地中海風情，讓融合爵士吉他多了一種熱烈的色彩。"],
    trivia: "1981 年，他和約翰·麥克勞林、佛朗明哥吉他大師帕可·德·路西亞（Paco de Lucía）的三人現場專輯，成了史上最暢銷的木吉他專輯之一。",
    albums: [["Land of the Midnight Sun", "1976"], ["Elegant Gypsy", "1977"], ["Friday Night in San Francisco", "1981"]] },
  carlton: { life: "1948–", from: "美國加州",
    story: ["70 年代最搶手的錄音室吉他手之一，也是 The Crusaders 樂團的成員，在流行、搖滾、爵士唱片裡都聽得到他。", "他愛用 Gibson ES-335 半空心吉他，〈Room 335〉這首曲子就以它命名，樂迷也因此叫他 Mr. 335。"],
    trivia: "Steely Dan 的〈Kid Charlemagne〉裡那段吉他 Solo 就是他彈的，常被吉他雜誌列為經典 Solo。",
    albums: [["Larry Carlton", "1978，收錄〈Room 335〉"], ["Sleepwalk", "1982"], ["The Royal Scam", "Steely Dan・1976，錄音室吉他"]] },
  metheny: { life: "1954–", from: "美國密蘇里州",
    story: ["十幾歲就開始在大學教吉他，先後成了邁阿密大學和 Berklee 史上最年輕的老師。1976 年在德國 ECM 唱片發行首張專輯《Bright Size Life》。", "和鍵盤手萊爾·梅斯（Lyle Mays）組成 Pat Metheny Group，把巴西音樂、鄉村和爵士和聲融在一起，旋律感非常強。他是得過最多座葛萊美獎的爵士樂手之一。"],
    trivia: "他有一把 42 弦的 Pikasso 吉他，是請製琴師為他特別打造的。",
    albums: [["Bright Size Life", "1976"], ["Offramp", "1982"], ["Still Life (Talking)", "1987"]] },
  scofield: { life: "1951–", from: "美國俄亥俄州",
    story: ["1982 到 1985 年在邁爾士·戴維斯的樂團擔任吉他手。", "他的音色帶點破音、樂句故意「歪」一點，把藍調、放克和很前衛的和聲揉在一起，非常好認。"],
    trivia: "1998 年他和爵士放克三重奏 Medeski Martin & Wood 合作的《A Go Go》，讓很多搖滾樂迷第一次聽爵士。",
    albums: [["Still Warm", "1986"], ["Blue Matter", "1987"], ["A Go Go", "1998"]] },
  stern: { life: "1953–", from: "美國波士頓",
    story: ["1981 年加入邁爾士·戴維斯復出後的樂團。", "他的 Solo 一邊是 Bebop 的密集線條，一邊是搖滾的破音和力道，常被說是用吉他在「唱」Bebop。"],
    trivia: "早年他曾是搖滾爵士樂團 Blood, Sweat & Tears 的吉他手，搖滾的底子就是從那時打下的。",
    albums: [["Upside Downside", "1986"], ["Standards (and Other Songs)", "1992"], ["Big Neighborhood", "2009"]] },
  asato: { life: "", from: "巴西",
    story: ["靠 Instagram 上一段段短片走紅的吉他手，代表了「社群世代」的爵士語彙：一分鐘的影片，就能讓全世界的吉他手學他的雙音和滑弦。", "他的演奏融合福音、R&B 和爵士和弦，節奏常常故意晚一點點，那種慵懶感正是 Neo-Soul 吉他的味道。"],
    trivia: "他的走紅路徑，正好說明了短影音也能是爵士的新舞台。",
    albums: [] },
  sharkey: { life: "", from: "美國芝加哥",
    story: ["來自芝加哥的吉他手兼歌手，音樂裡帶著濃濃的福音味。", "他的演奏把福音的和弦、R&B 的律動和爵士的即興放在一起，是當代 Neo-Soul 吉他的代表人物之一。"],
    trivia: "教會的福音音樂，是很多當代 R&B 與 Neo-Soul 樂手共同的起點。",
    albums: [] },
  govan: { life: "1971–", from: "英國切姆斯福德",
    story: ["幾乎什麼風格都能彈：藍調、Bebop、放克、金屬速彈，常在同一首曲子裡切換。", "他是三人樂團 The Aristocrats 的吉他手，也長年為吉他雜誌寫教學專欄。"],
    trivia: "2006 年的個人專輯《Erotic Cakes》，至今仍是很多吉他手練功的教材。",
    albums: [["Erotic Cakes", "2006"], ["The Aristocrats", "The Aristocrats・2011"]] }
};
ERAS.forEach(function (e) { var s = ERA_STORY[e.id]; if (s) { e.story = s.story; e.years = s.years; e.albums = s.albums; } });
PEOPLE.forEach(function (p) { var s = PEOPLE_STORY[p.id]; if (s) { for (var k in s) p[k] = s[k]; } });

/* ---------- season 2: more musicians ---------- */
var PEOPLE2 = [
  { id: "morton", era: "roots", zh: "傑利·羅爾·摩頓", en: "Jelly Roll Morton", instr: "鋼琴・作曲", yr: "1900s–1920s", inst: "piano",
    blurb: "最早把爵士寫成樂譜的作曲家之一，把散拍、藍調和紐奧良的即興編在一起。",
    life: "1890–1941", from: "美國紐奧良",
    story: ["他是最早把爵士當成「作曲」來對待的人，把散拍鋼琴、藍調和紐奧良樂隊的即興寫進編曲裡。", "1926 到 1927 年他帶著 Red Hot Peppers 錄下一系列作品，被視為早期爵士編曲的範本。"],
    trivia: "他的名片上自稱「爵士的發明者」，這句話讓他得罪不少同行，但他對爵士成形的貢獻確實很大。",
    albums: [["Black Bottom Stomp", "Red Hot Peppers・1926"], ["King Porter Stomp", "1920s"]] },
  { id: "bechet", era: "roots", zh: "西德尼·貝雪", en: "Sidney Bechet", instr: "高音薩克斯風・豎笛", yr: "1910s–1950s", inst: "sax",
    blurb: "第一位重要的爵士獨奏者之一，用高音薩克斯風吹出強烈的抖音與歌唱性。",
    life: "1897–1959", from: "美國紐奧良",
    story: ["和路易·阿姆斯壯同一個年代、同一座城市出身，是最早在錄音裡展現強烈個人風格的獨奏者之一。", "他讓高音薩克斯風成為爵士樂器，聲音寬厚、抖音明顯，聽一句就認得出來。晚年定居法國，成了當地的爵士明星。"],
    trivia: "他 1950 年代在法國寫的〈Petite Fleur〉，是那個年代法國家喻戶曉的旋律。",
    albums: [["Summertime", "1939"], ["Petite Fleur", "1952"]] },
  { id: "holiday", era: "swing", zh: "比莉·哈樂黛", en: "Billie Holiday", instr: "人聲", yr: "1930s–1950s", inst: "mic",
    blurb: "像樂器一樣唱歌：拖拍、轉音、把旋律重新說一遍，影響了之後的爵士歌手。",
    life: "1915–1959", from: "美國費城出生，巴爾的摩長大",
    story: ["她沒有受過正式訓練，卻把爵士樂手的即興帶進歌唱：故意唱晚一點、改變旋律，讓每首歌都像在說自己的故事。", "1939 年她錄下〈Strange Fruit〉，一首控訴美國南方私刑的歌，在當時需要極大的勇氣。"],
    trivia: "「Lady Day」這個暱稱，是她的好友、薩克斯風手 Lester Young 取的。",
    albums: [["Strange Fruit", "單曲・1939"], ["Lady in Satin", "1958"]] },
  { id: "ella", era: "swing", zh: "艾拉·費茲傑羅", en: "Ella Fitzgerald", instr: "人聲", yr: "1930s–1990s", inst: "mic",
    blurb: "「歌唱第一夫人」，音準、音域與 Scat 即興都無人能及。",
    life: "1917–1996", from: "美國維吉尼亞州",
    story: ["1934 年，她在紐約阿波羅劇院的業餘之夜一鳴驚人，很快加入鼓手 Chick Webb 的樂團。", "1950 年代起，她錄下一系列「歌本」專輯，把 Cole Porter、Gershwin、Ellington 等作曲家的作品唱成經典。她的 Scat 即興快又準，可以跟任何樂手對話。"],
    trivia: "她和路易·阿姆斯壯合錄的《Ella and Louis》，一個嗓音清亮、一個沙啞，成了最受歡迎的爵士二重唱專輯之一。",
    albums: [["Ella and Louis", "1956"], ["Ella Fitzgerald Sings the Cole Porter Song Book", "1956"], ["Ella in Berlin", "1960"]] },
  { id: "basie", era: "swing", zh: "貝西伯爵", en: "Count Basie", instr: "鋼琴・樂團領袖", yr: "1930s–1980s", inst: "piano",
    blurb: "堪薩斯城搖擺的代表，用最少的音，讓整個大樂團搖起來。",
    life: "1904–1984", from: "美國新澤西州",
    story: ["他在堪薩斯城組成樂團，帶來重藍調、節奏鬆而有彈性的搖擺。他的節奏組被稱為「全美最棒的節奏組」。", "他的鋼琴極簡，常常只彈幾個音，把空間留給樂團。這種「少即是多」的做法，影響了之後許多伴奏者。"],
    trivia: "他的招牌結尾是鋼琴上輕輕的三個音，樂迷一聽就知道是貝西。",
    albums: [["One O'Clock Jump", "1937"], ["April in Paris", "1957"], ["The Atomic Mr. Basie", "1958"]] },
  { id: "django", era: "swing", zh: "姜戈·萊恩哈特", en: "Django Reinhardt", instr: "吉他", yr: "1930s–1950s", inst: "guitar", v: "archtop",
    blurb: "歐洲第一位爵士巨星，吉普賽爵士的創始者。",
    life: "1910–1953", from: "比利時，吉普賽家庭",
    story: ["18 歲時，他住的篷車失火，左手兩根手指嚴重燒傷，幾乎無法再用。他重新發展出只用兩根手指為主的指法，速度依然驚人。", "1934 年，他和小提琴手史蒂芬·葛拉佩里（Stéphane Grappelli）組成「法國熱爵士五重奏」，沒有鼓、只有弦樂器，開創了吉普賽爵士。"],
    trivia: "今天的吉普賽爵士吉他手，還是會練他當年那種兩指指型。",
    albums: [["Minor Swing", "與 Stéphane Grappelli・1937"], ["Nuages", "1940"]] },
  { id: "christian", era: "swing", zh: "查理·克里斯汀", en: "Charlie Christian", instr: "電吉他", yr: "1939–1941", inst: "guitar", v: "archtop",
    blurb: "讓電吉他成為獨奏樂器的人，也是 Bebop 的先驅之一。",
    life: "1916–1942", from: "美國德州出生，奧克拉荷馬市長大",
    story: ["1939 年加入班尼·古德曼的樂團。在那之前，吉他在樂團裡多半只負責刷節奏；他插上電，讓吉他像薩克斯風一樣吹出長長的獨奏線條，是把電吉他推上獨奏位置最關鍵的人。", "下班後，他常出現在 Minton's Playhouse 的深夜 Jam，和孟克、克拉克一起實驗後來成為 Bebop 的語言。"],
    trivia: "他只活了 25 歲，正式錄音的時間只有短短兩三年，卻影響了之後幾乎所有爵士吉他手。",
    albums: [["Solo Flight", "與 Benny Goodman・1941"], ["Swing to Bop", "Minton's 現場・1941"]] },
  { id: "dizzy", era: "bebop", zh: "迪吉·葛拉斯彼", en: "Dizzy Gillespie", instr: "小號", yr: "1940s–1990s", inst: "trumpet",
    blurb: "和帕克一起打造 Bebop，也把古巴節奏帶進爵士。",
    life: "1917–1993", from: "美國南卡羅萊納州",
    story: ["他是 Bebop 的另一位建築師，小號技巧驚人，對和聲的理解深，也很會帶年輕樂手。", "1947 年，他和古巴打擊樂手 Chano Pozo 合作〈Manteca〉，把古巴節奏帶進大樂團，成了非裔古巴爵士的里程碑。"],
    trivia: "他的小號喇叭口是向上翹的。據說是 1953 年一場派對上，有舞者不小心跌在小號上把它壓彎了，他試吹後覺得聲音更好聽，從此就用這種造型。他吹奏時臉頰鼓得像氣球，也是招牌。",
    albums: [["Groovin' High", "單曲・1945"], ["Manteca", "單曲・1947"], ["Jazz at Massey Hall", "1953"]] },
  { id: "monk", era: "bebop", zh: "塞隆尼斯·孟克", en: "Thelonious Monk", instr: "鋼琴・作曲", yr: "1940s–1970s", inst: "piano",
    blurb: "最獨特的爵士作曲家之一，用「彈錯」般的和聲寫出經典。",
    life: "1917–1982", from: "美國北卡羅萊納州，在紐約長大",
    story: ["他是 Minton's Playhouse 的駐店鋼琴手，參與了 Bebop 的誕生，但他的音樂和別人都不一樣：大量留白、突兀的不和諧音、像是故意彈錯的節奏。", "他寫的〈'Round Midnight〉、〈Straight, No Chaser〉、〈Blue Monk〉都成了爵士標準曲。1964 年，他登上《時代》雜誌封面。"],
    trivia: "他常在樂手 Solo 時離開鋼琴、在台上轉圈跳舞，這也成了他的招牌。",
    albums: [["Genius of Modern Music", "1947–1952"], ["Brilliant Corners", "1957"], ["Monk's Dream", "1963"]] },
  { id: "evans", era: "50s", zh: "比爾·艾文斯", en: "Bill Evans", instr: "鋼琴", yr: "1950s–1980", inst: "piano",
    blurb: "把印象派和聲帶進爵士鋼琴，鋼琴三重奏的典範。",
    life: "1929–1980", from: "美國新澤西州",
    story: ["他是《Kind of Blue》的鋼琴手，專輯的唱片說明也是他寫的。他的和聲細膩、觸鍵柔軟，深受德布西、拉威爾影響。", "他和貝斯手史考特·拉法羅（Scott LaFaro）、鼓手保羅·莫提安（Paul Motian）組成的三重奏，讓三個人平等對話，而不只是鋼琴加伴奏。"],
    trivia: "1961 年在 Village Vanguard 的現場錄音後只過了 11 天，拉法羅就因車禍過世。那兩張現場專輯成了三重奏的絕響。",
    albums: [["Sunday at the Village Vanguard", "1961"], ["Waltz for Debby", "1961 現場錄音"], ["Portrait in Jazz", "1960"]] },
  { id: "mingus", era: "50s", zh: "查爾斯·明格斯", en: "Charles Mingus", instr: "低音提琴・作曲", yr: "1950s–1970s", inst: "bass",
    blurb: "貝斯手兼作曲家，把教會、藍調、Bebop 和抗議寫進同一首曲子。",
    life: "1922–1979", from: "美國亞利桑那州出生，洛杉磯長大",
    story: ["他是技巧驚人的貝斯手，更是野心很大的作曲家，曲子裡有福音的吶喊、藍調的泥土味和 Bebop 的速度。", "他常常在台上邊彈邊對樂手大聲下指令，要他們照當下的感覺改變演奏，他把這種工作方式叫做「爵士工作坊」。"],
    trivia: "他的自傳《Beneath the Underdog》寫得跟他的音樂一樣直接，也一樣充滿爭議。",
    albums: [["Mingus Ah Um", "1959"], ["Blues & Roots", "1960"], ["The Black Saint and the Sinner Lady", "1963"]] },
  { id: "rollins", era: "50s", zh: "桑尼·羅林斯", en: "Sonny Rollins", instr: "次中音薩克斯風", yr: "1950s–2010s", inst: "sax",
    blurb: "硬咆勃的薩克斯風巨人，擅長把一個小動機發展成長篇即興。",
    life: "1930–", from: "美國紐約",
    story: ["1956 年錄下的《Saxophone Colossus》奠定了他的地位，〈St. Thomas〉把加勒比海的節奏帶進爵士。", "他擅長「主題式即興」：抓住旋律裡的一小段，一層層變化下去，讓長篇 Solo 聽起來像一個完整的故事。"],
    trivia: "1959 年他在聲望最高的時候突然停止演出，每天跑到紐約的威廉斯堡大橋上練琴，兩年後才復出，並把復出專輯命名為《The Bridge》。",
    albums: [["Saxophone Colossus", "1957"], ["Way Out West", "1957"], ["The Bridge", "1962"]] },
  { id: "chet", era: "50s", zh: "查特·貝克", en: "Chet Baker", instr: "小號・人聲", yr: "1950s–1980s", inst: "trumpet",
    blurb: "西岸酷派的代表，小號和歌聲都輕柔、帶點憂鬱。",
    life: "1929–1988", from: "美國奧克拉荷馬州",
    story: ["1952 年他加入 Gerry Mulligan 的無鋼琴四重奏，成為西岸酷派的代表人物，年輕、帥氣，很快成了明星。", "他的小號音色柔和、句子簡單，唱歌時幾乎像在耳邊低語。〈My Funny Valentine〉是他最有名的演唱。"],
    trivia: "他的歌聲沒有華麗技巧，卻讓很多人第一次覺得爵士「聽得懂」。",
    albums: [["Chet Baker Sings", "1954"], ["Chet", "1959"]] },
  { id: "wes", era: "50s", zh: "韋斯·蒙哥馬利", en: "Wes Montgomery", instr: "吉他", yr: "1950s–1968", inst: "guitar", v: "archtop",
    blurb: "用大拇指撥弦、以八度音彈旋律，爵士吉他最好認的聲音之一。",
    life: "1923–1968", from: "美國印第安納波利斯",
    story: ["他沒有用彈片，而是用大拇指撥弦，聲音溫暖圓潤。他常把旋律用八度音彈出來，再推到和弦獨奏，這套做法至今仍是爵士吉他的必修。", "他是自學的，快 20 歲才開始彈吉他，靠反覆聽查理·克里斯汀的唱片學會。"],
    trivia: "相傳他改用拇指，是因為晚上下班後練琴，怕吵到鄰居。",
    albums: [["The Incredible Jazz Guitar of Wes Montgomery", "1960"], ["Smokin' at the Half Note", "1965"]] },
  { id: "coltrane", era: "free", zh: "約翰·柯川", en: "John Coltrane", instr: "次中音・高音薩克斯風", yr: "1950s–1967", inst: "sax",
    blurb: "從密集的和聲到精神性的自由，一生不斷往前走。",
    life: "1926–1967", from: "美國北卡羅萊納州",
    story: ["1955 年加入邁爾士的五重奏，1957 年在孟克的樂團磨練。他的 Solo 音符密集到被樂評形容為「聲音的織毯」（sheets of sound）。", "1959 年錄下的〈Giant Steps〉是和聲上的高峰。之後他用高音薩克斯風錄下〈My Favorite Things〉，1965 年的《A Love Supreme》則是一張四段組曲形式的精神告白。"],
    trivia: "他只活了 40 歲，但從 1957 到 1967 這十年，他的音樂幾乎每一兩年就完全換一個樣子。",
    albums: [["Blue Train", "1957 錄音"], ["Giant Steps", "1960"], ["A Love Supreme", "1965"]] },
  { id: "hancock", era: "fusion", grp: "70s", zh: "賀比·漢考克", en: "Herbie Hancock", instr: "鋼琴・鍵盤", yr: "1960s–", inst: "piano",
    blurb: "從邁爾士的第二組五重奏到放克、電子，橫跨爵士好幾個時代。",
    life: "1940–", from: "美國芝加哥",
    story: ["他是神童，11 歲就和芝加哥交響樂團合奏莫札特。1960 年代加入邁爾士的第二組五重奏，也寫出〈Watermelon Man〉、〈Cantaloupe Island〉等名曲。", "1973 年的《Head Hunters》把爵士推進放克，成了當時最暢銷的爵士專輯之一。1983 年的〈Rockit〉用了刮唱盤的聲音，還在 MTV 上大紅。"],
    trivia: "2008 年，他向歌手 Joni Mitchell 致敬的專輯拿下葛萊美年度專輯，是極少數獲得這個大獎的爵士專輯。",
    albums: [["Maiden Voyage", "1965"], ["Head Hunters", "1973"], ["Future Shock", "1983"]] },
  { id: "corea", era: "fusion", grp: "70s", zh: "奇克·柯瑞亞", en: "Chick Corea", instr: "鋼琴・鍵盤", yr: "1960s–2021", inst: "piano",
    blurb: "Return to Forever 的靈魂人物，把西班牙與拉丁色彩帶進融合爵士。",
    life: "1941–2021", from: "美國麻州",
    story: ["他參與了邁爾士轉向電氣化的時期，之後組成 Return to Forever，從輕盈的拉丁風格一路走到搖滾味很重的融合爵士，艾爾·迪·米奧拉就是在這個樂團成名的。", "他寫的〈Spain〉成了爵士樂手最常演奏的當代曲目之一。"],
    trivia: "他一生拿下二十多座葛萊美獎，是得獎最多的爵士樂手之一。",
    albums: [["Now He Sings, Now He Sobs", "1968"], ["Light as a Feather", "Return to Forever・1973"], ["Romantic Warrior", "Return to Forever・1976"]] },
  { id: "benson", era: "fusion", grp: "70s", zh: "喬治·班森", en: "George Benson", instr: "吉他・人聲", yr: "1960s–", inst: "guitar", v: "archtop",
    blurb: "韋斯·蒙哥馬利的傳人，也把爵士吉他帶進流行排行榜。",
    life: "1943–", from: "美國匹茲堡",
    story: ["他的吉他技巧深受韋斯·蒙哥馬利影響，八度音和流暢的 Bebop 線條是招牌。", "1976 年的《Breezin'》大受歡迎，登上美國專輯排行榜冠軍，其中他自彈自唱的〈This Masquerade〉拿下葛萊美年度製作。"],
    trivia: "他唱歌時常常讓嗓音和吉他同步唱奏同一條旋律，這成了他最好認的招牌。",
    albums: [["Breezin'", "1976"], ["Weekend in L.A.", "1978"], ["Give Me the Night", "1980"]] }
];
PEOPLE2.forEach(function (p) { p.s2 = true; PEOPLE.push(p); });

var INSTMAP = { ellington: ['piano'], armstrong: ['trumpet'], parker: ['sax'], blakey: ['drums'], miles: ['trumpet'], coleman: ['sax'],
  mclaughlin: ['guitar', '', 'odd'], holdsworth: ['guitar', '', 'legato'], dimeola: ['guitar', '', 'pick'], carlton: ['guitar', 'archtop', 't335'], metheny: ['guitar', 'pedal', 'chorus'],
  scofield: ['guitar', 'pedal', 'zig'], stern: ['guitar', '', 'bolt'], asato: ['guitar', '', 'slide'], sharkey: ['guitar', 'archtop', 'notes2'], govan: ['guitar', '', 'inf'] };
PEOPLE.forEach(function (p) { var m = INSTMAP[p.id] || [p.inst || 'notes', p.v, p.dec]; p.inst = m[0]; p.v = m[1] || undefined; p.dec = m[2]; });
var SCENE_OF = { roots: 'roots', swing: 'swing', bebop: 'bebop', '50s': '50s', free: 'free', fusion: 'fusion' };

var ERA_LABEL = { roots: '起源', swing: '搖擺', bebop: 'Bebop', '50s': '1950s', free: '1960s', fusion: '融合以後' };

var STANDARDS = [
  { id: 'maple', title: 'Maple Leaf Rag', by: 'Scott Joplin', yr: '1899', era: 'roots', note: '散拍音樂的招牌曲：左手穩定，右手切分。' },
  { id: 'stlouis', title: 'St. Louis Blues', by: 'W.C. Handy', yr: '1914', era: 'roots', note: '把藍調寫進流行音樂，後來成為無數樂手的練習曲。' },
  { id: 'saints', title: 'When the Saints Go Marching In', by: '傳統曲', yr: '傳統', era: 'roots', note: '紐奧良銅管樂隊文化的經典，Dixieland 入門。' },
  { id: 'dontmean', title: "It Don't Mean a Thing (If It Ain't Got That Swing)", by: 'Duke Ellington', yr: '1931', era: 'swing', note: '曲名本身就是 Swing 的宣言。' },
  { id: 'indigo', title: 'Mood Indigo', by: 'Duke Ellington', yr: '1930', era: 'swing', note: '艾靈頓用樂器配色，示範編曲如何像作曲。' },
  { id: 'atrain', title: "Take the 'A' Train", by: 'Billy Strayhorn', yr: '1941', era: 'swing', note: 'Ellington 樂團的招牌曲，32 小節 AABA 結構。' },
  { id: 'bodysoul', title: 'Body and Soul', by: 'Johnny Green', yr: '1930', era: 'swing', note: '練習抒情曲與和聲換色的經典教材。' },
  { id: 'summertime', title: 'Summertime', by: 'George Gershwin', yr: '1935', era: 'swing', note: '出自歌劇《Porgy and Bess》，小調氛圍的爵士經典。' },
  { id: 'billies', title: "Billie's Bounce", by: 'Charlie Parker', yr: '1945', era: 'bebop', note: '12 小節的 Bebop 藍調，Parker 語彙入門。' },
  { id: 'nowsthetime', title: "Now's the Time", by: 'Charlie Parker', yr: '1945', era: 'bebop', note: '同樣是 12 小節藍調，旋律短而好記。' },
  { id: 'confirmation', title: 'Confirmation', by: 'Charlie Parker', yr: '1946', era: 'bebop', note: '32 小節，旋律線條本身就是即興語彙的範本。' },
  { id: 'midnight', title: "'Round Midnight", by: 'Thelonious Monk', yr: '1940s', era: 'bebop', note: 'Monk 的抒情曲，和聲轉折令人難忘。' },
  { id: 'autumn', title: 'Autumn Leaves', by: 'Joseph Kosma', yr: '1945', era: '50s', note: 'ii–V–I 輪轉，大調與小調關係的教科書。' },
  { id: 'satindoll', title: 'Satin Doll', by: 'Duke Ellington / Billy Strayhorn', yr: '1953', era: '50s', note: '一連串 ii–V 的輕快小品，Comping 練習常用。' },
  { id: 'takefive', title: 'Take Five', by: 'Paul Desmond', yr: '1959', era: '50s', note: 'Dave Brubeck Quartet 的 5/4 拍，酷派代表。' },
  { id: 'sowhat', title: 'So What', by: 'Miles Davis', yr: '1959', era: '50s', note: '《Kind of Blue》開場曲：D Dorian 16 小節，Eb Dorian 8 小節，再回 D Dorian 8 小節。' },
  { id: 'allblues', title: 'All Blues', by: 'Miles Davis', yr: '1959', era: '50s', note: '三拍子感的藍調，調式爵士的另一面。' },
  { id: 'moanin', title: "Moanin'", by: 'Bobby Timmons', yr: '1958', era: '50s', note: 'Art Blakey & The Jazz Messengers 的代表曲，福音味的 Hard Bop。' },
  { id: 'giantsteps', title: 'Giant Steps', by: 'John Coltrane', yr: '1959', era: '50s', note: '以大三度循環移動的和聲，著名的和聲難題。' },
  { id: 'lonely', title: 'Lonely Woman', by: 'Ornette Coleman', yr: '1959', era: 'free', note: 'Free Jazz 的前夜，旋律與和聲都鬆開了。' },
  { id: 'ipanema', title: 'The Girl from Ipanema', by: 'Antonio Carlos Jobim', yr: '1962', era: 'free', note: 'Bossa Nova 的代表曲，32 小節。' },
  { id: 'bluebossa', title: 'Blue Bossa', by: 'Kenny Dorham', yr: '1963', era: 'free', note: '16 小節的小調曲，小調 ii–V 的入門。' },
  { id: 'cantaloupe', title: 'Cantaloupe Island', by: 'Herbie Hancock', yr: '1964', era: 'free', note: '律動型的小品，節奏比和弦更重要。' },
  { id: 'spain', title: 'Spain', by: 'Chick Corea', yr: '1972', era: 'fusion', note: 'Return to Forever 的代表曲，西班牙色彩與 Fusion 結合。' },
  { id: 'chameleon', title: 'Chameleon', by: 'Herbie Hancock', yr: '1973', era: 'fusion', note: '由 Funk 貝斯線撐起整首曲子的 Fusion 代表。' },
  { id: 'brightsize', title: 'Bright Size Life', by: 'Pat Metheny', yr: '1976', era: 'fusion', note: '吉他、貝斯、鼓三重奏，Metheny 的溫暖與空間感。' },
  { id: 'birdland', title: 'Birdland', by: 'Joe Zawinul', yr: '1977', era: 'fusion', note: 'Weather Report 的名曲，Fusion 的標誌性律動。' },
  { id: 'room335', title: 'Room 335', by: 'Larry Carlton', yr: '1978', era: 'fusion', note: '曲名取自他以愛琴 ES-335 命名的錄音室，藍調加爵士和弦。' }
];

var TIPS = [
  { id: 'tip-rhythm', step: '01 節奏組', title: '拆解 Rhythm Section', text: '聽 <b>Walking Bass</b> 如何在一小節內彈四個四分音符，暗示和弦的推動。再聽吉他或鋼琴如何用 <b>Comping</b> 在空拍切入，刺激主奏者。',
    hook: '爵士不是各彈各的，節奏組才是真正的引擎。', pts: ['Walking Bass：一小節四個四分音符，推動和弦', 'Comping：在空拍切入，刺激主奏者', '先聽貝斯，再聽鼓，最後才聽主奏'], tags: ['WalkingBass', 'Comping'] },
  { id: 'tip-call', step: '02 對話', title: '尋找 Call and Response', text: '主奏者彈出一段精彩樂句 Call，鼓手或鋼琴手是怎麼立刻給出回應 Response？',
    hook: '爵士是一場音樂對話，聽的人要找出誰在丟球、誰在接。', pts: ['主奏者丟出一段樂句：Call', '鼓手或鋼琴手立刻給出 Response', '好的伴奏是在回話，不是在墊底'], tags: ['CallAndResponse'] },
  { id: 'tip-tension', step: '03 張力', title: '感受張力與釋放', text: '好的樂手會在 Solo 中刻意製造不和諧 Outside playing，把聽覺張力拉緊，再在下一個和弦回到主音，讓耳朵得到釋放。',
    hook: '爵士最迷人的瞬間，是刻意走出去，再漂亮地回來。', pts: ['Outside playing：刻意製造不和諧', '把聽覺的張力拉緊', '下一個和弦回到主音，耳朵得到釋放'], tags: ['Outside', 'TensionRelease'] }
];

var HSH = { id: 'hsh', title: 'Head – Solo – Head', hook: '幾乎 90% 的爵士標準曲，都是同一個三段式。',
  pts: ['Head：全體演奏主旋律，確立和弦進行地圖', 'Solo：樂手輪流即興，和弦進行完全不變', 'Head：回到主旋律，整齊地結束'], tags: ['HeadSoloHead', 'JazzStandards'] };

var VOICINGS = [
  { id: 'v-rootless', step: 'ROOTLESS', title: '無根音和弦', text: '省略低音根音，交給貝斯手。把手指的空間留給決定和弦性質的 3 音、7 音，以及更有色彩的延伸音（9、11、13）。',
    hook: '爵士吉他和鋼琴的第一個祕密：不彈根音。', pts: ['根音交給貝斯手', '手指留給 3 音、7 音', '再加上 9、11、13 的色彩'], tags: ['RootlessVoicing'] },
  { id: 'v-shell', step: 'SHELL', title: '殼狀和弦', text: '最精簡的形式，只彈<b>根音 + 3 音 + 7 音</b>。吉他上通常以 Drop 2 或 Drop 3 的按法呈現，乾淨俐落。',
    hook: '只彈三個音，就能說清楚一個和弦。', pts: ['只彈：根音 + 3 音 + 7 音', '吉他常用 Drop 2 或 Drop 3 按法', '乾淨俐落，不干擾貝斯與主奏'], tags: ['ShellVoicing', 'Drop2'] },
  { id: 'v-altered', step: 'ALTERED', title: '變化延伸音', text: '在屬七和弦上故意彈出 b9、#9、#11 或 b13，為下一個和弦的「解決」製造期待感。',
    hook: '想讓下一個和弦更有說服力，就在屬和弦上埋張力。', pts: ['屬七和弦上彈 b9、#9、#11、b13', '製造不穩定的張力', '為下一個和弦的解決製造期待感'], tags: ['AlteredDominant'] }
];

var RHYTHMS = [
  { id: 'r-charleston', step: 'CHARLESTON', title: '查爾斯頓節奏', text: '彈在第一拍的正拍與第二拍的反拍（1 和 2-and）。「重、輕（推動）」的感覺，建立強烈的 Swing 基礎。',
    hook: '爵士伴奏的第一個節奏：1 和 2-and。', pts: ['落在第一拍與第二拍的反拍', '「重、輕」的推動感', '建立 Swing 的基礎'], tags: ['Charleston', 'Comping'] },
  { id: 'r-push', step: 'ANTICIPATION', title: '提前預期', text: '在前一小節「第四拍的反拍」就先把下一個和弦推出來，帶來強烈的前進感與推動力。',
    hook: '和弦不要等到正拍才出現，提早半拍推出來。', pts: ['在第四拍的反拍就先彈下一個和弦', '正拍反而留白', '帶來強烈的前進感'], tags: ['Anticipation', 'Comping'] },
  { id: 'r-garland', step: 'RED GARLAND', title: '紅·嘉蘭風格 Block Chords', text: '用和弦彈奏旋律線條，每個旋律音下方都塞滿和弦內音。聽起來厚實華麗，常在樂團情緒達到最高潮時使用。',
    hook: '把旋律的每個音都做成和弦，就是 Block Chords。', pts: ['用和弦彈旋律線條', '每個旋律音下方塞滿和弦內音', '常用在樂團情緒的最高潮'], tags: ['BlockChords', 'RedGarland'] }
];

/* ---------- search links (no scraping; plain search URLs) ---------- */
function enc(s) { return encodeURIComponent(s); }
function linksFor(q, withPhoto) {
  var out = [
    { t: 'YouTube', u: 'https://www.youtube.com/results?search_query=' + enc(q) },
    { t: 'Spotify', u: 'https://open.spotify.com/search/' + enc(q) },
    { t: 'Wikipedia', u: 'https://en.wikipedia.org/w/index.php?search=' + enc(q) }
  ];
  if (withPhoto) out.push({ t: '歷史照片', u: 'https://commons.wikimedia.org/w/index.php?search=' + enc(q) + '&ns6=1' });
  return out;
}

/* ---------- decline data (NEA SPPA, Table 14) ---------- */
var NEA_JAZZ = [{ y: 2002, v: 10.8 }, { y: 2008, v: 7.8 }, { y: 2012, v: 8.5 }, { y: 2017, v: 8.6 }, { y: 2022, v: 6.3 }];

/* ---------- Taipei live (2026) ---------- */
var LIVE = {
  title: '2026 臺北爵士音樂節',
  strands: [
    { id: 'st-1', name: '感爵夜現場', en: 'Jazz Right Here', when: '9/6–10/1', where: '12 間爵士場館，分布在大安、大同、萬華',
      note: '河岸留言西門紅樓展演館、Oldie Goodie、黑媽台北、戲台酒館、女巫店、Sappho Live Jazz 等。',
      map: '小型場館的近距離現場，最接近 Bebop 年代下班後的 Jam Session 環境。', to: 'era-bebop', toLabel: 'Bebop' },
    { id: 'st-2', name: '絕對爵士派對', en: 'Jazz Right Party', when: '9/4–9/28，共 6 天', where: '關渡碼頭、眷村文化公園、大稻埕碼頭、寶藏巖國際藝術村、西門紅樓',
      note: '戶外演出。官方公告列出唐川大樂團、盜魂爵士樂團、FISON、幾何碼、J.E.G「這個」爵士樂團、大地之歌 Sonus de Gaia 等。',
      map: '把爵士放回城市生活裡，接近爵士最早在街頭與舞廳的樣子。', to: 'era-roots', toLabel: '紐奧良' },
    { id: 'st-3', name: '大放爵詞', en: 'Jazz Workshop', when: '10/9、10/11', where: '臺北流行音樂中心 LIVE HOUSE D',
      note: '講師是 Hristo Vitchev（吉他）與 Ari Hoenig（鼓）。免費入場，需事先填表報名，每場限額 60 名。',
      map: '想把「怎麼聽」變成「怎麼彈」，可以對照伴奏與節奏的章節。', to: 'comping', toLabel: '伴奏' },
    { id: 'st-4', name: '主舞台 Jazz Right', en: '', when: '10/9–10/11', where: '臺北流行音樂中心 戶外表演空間',
      note: '每天 17:00 起連續四場。報導標題寫「免費聽 3 天」，票務細節以官方公告為準。',
      map: '下方依日期逐場對照。', to: 'live-days', toLabel: '逐場對照' }
  ],
  days: [
    { id: 'd1', date: '10/9（五）', label: 'Day 1', note: '', acts: [
      { id: 'w1', ws: true, t: '14:30', name: '大放爵詞 Jazz Workshop｜Hristo Vitchev', who: '免費入場，需事先填表報名，限額 60 名。' },
      { id: 'a1', t: '17:00', name: 'One Voice for Taiwan', who: '由波蘭、美國與台灣成員組成。', map: '國際合奏', to: 'listen', toLabel: '如何聽',
        listen: '不同國籍的樂手，在同一張和弦地圖上怎麼互相丟球。對照「如何聽」的 Call and Response。' },
      { id: 'a2', t: '18:00', name: 'The Dino Dominelli Group', who: '節目表只列出團名，沒有風格介紹。', map: '資料有限', to: 'listen', toLabel: '如何聽',
        listen: '先用 Head–Solo–Head 聽結構：主旋律在哪裡結束，誰先接 Solo。' },
      { id: 'a3', t: '19:00', name: 'Brussel Van Taipeh', who: '台灣團體，節目表列出多位成員。', map: '資料有限', to: 'comping', toLabel: '伴奏',
        listen: '編制較大時，留意和聲樂器在哪些空拍切入。' },
      { id: 'a4', t: '20:00', name: 'Hristo Vitchev meets JP3', who: '紐約吉他手 Hristo Vitchev 與 JP3 同台。', map: '現代吉他', to: 'person-metheny', toLabel: '派特·麥席尼',
        listen: '有樂評形容他的音色圓滑、旋律性強。可以和融合爵士章節的 Pat Metheny 對照聽「敘事旋律」。' }
    ] },
    { id: 'd2', date: '10/10（六）', label: 'Day 2', note: '官方公告的工作坊只排在 10/9 與 10/11；節目表聚合站另列 10/10 14:30 的 Freddie Hendrix 工作坊，請以官方公告為準。', acts: [
      { id: 'a5', t: '17:00', name: 'Michael Wang Modern Jazz Collective', who: '節目表只列出團名與成員，沒有風格介紹。', map: '資料有限', to: 'listen', toLabel: '如何聽',
        listen: '留意 Solo 輪到誰，以及背景和弦有沒有變。' },
      { id: 'a6', t: '18:00', name: 'Plutato feat. Cait Lin', who: '台灣團體，主辦方列為國內卡司。', map: '資料有限', to: 'listen', toLabel: '如何聽',
        listen: '留意客席 Cait Lin 加入的段落，主旋律與即興怎麼分工。' },
      { id: 'a7', t: '19:00', name: 'Jazz Right All Star Band', who: '為 20 週年組成的限定陣容。', map: 'Jam Session 精神', to: 'era-bebop', toLabel: 'Bebop',
        listen: '臨時組成的明星陣容，靠標準曲的和弦地圖就能對話，像 Bebop 年代下班後的 Jam Session。' },
      { id: 'a8', t: '20:00', name: 'Ponpon Quintet', who: '陳芃瑄率美國樂手，以即興 Scat 演出。', map: 'Scat 人聲', to: 'person-armstrong', toLabel: '路易·阿姆斯壯',
        listen: '把人聲當成樂器即興。對照路易·阿姆斯壯的 Scat singing。' }
    ] },
    { id: 'd3', date: '10/11（日）', label: 'Day 3', note: '', acts: [
      { id: 'w3', ws: true, t: '14:30', name: '大放爵詞 Jazz Workshop｜Ari Hoenig', who: '免費入場，需事先填表報名，限額 60 名。' },
      { id: 'a9', t: '17:00', name: 'Skyline 天際線融合爵士樂團', who: '融合爵士風格的台灣團體。', map: '融合爵士', to: 'fusion', toLabel: '融合爵士',
        listen: '留意電氣化的音色與律動，和 70、80 年代的 Fusion 有什麼不同。' },
      { id: 'a10', t: '18:00', name: 'WAKAN', who: '法國爵士三重奏，主辦方形容兼具古典細膩與自由奔放。', map: '酷派的空間感・自由爵士', to: 'era-50s', toLabel: '酷派與調式',
        listen: '一邊聽三重奏的留白與空間，一邊看他們什麼時候放掉和弦的框架。' },
      { id: 'a11', t: '19:00', name: '許郁瑛帶電六重奏', who: '金曲獎爵士音樂家許郁瑛領軍，六人編制。', map: '電氣化的現代爵士', to: 'fusion', toLabel: '融合爵士',
        listen: '團名的「帶電」是線索，留意電氣樂器怎麼和爵士即興結合。' },
      { id: 'a12', t: '20:00', name: 'Ari Hoenig Trio', who: '鼓手 Ari Hoenig 領軍的三重奏。', map: '節奏組的主角', to: 'listen', toLabel: '如何聽',
        listen: '他的教學與作品著重複節奏、奇數拍與旋律化的鼓。留意鼓怎麼回應主奏者。' }
    ] }
  ],
  milesTrane: {
    intro: '今年的主題向 Miles Davis 與 John Coltrane 的 100 歲冥誕致敬。這兩位在本網站都有對應：',
    songs: ['s-sowhat', 's-allblues', 's-giantsteps']
  },
  taichung: {
    when: '臺中市民廣場 10/16–10/25，主舞台 10 天 23 場',
    theme: 'When Giants Play 爵士巨人來了',
    note: '時間依官方節目表，入場方式以官方公告為準。對照依官方與新聞介紹，標「依團名」的是推測。',
    acts: [
      { d: '10/16（五）20:30', name: '臺中爵士節慶大樂團 ft. Taichung Star', map: '大樂團（依團名）', to: 'era-swing', toLabel: '搖擺與大樂團' },
      { d: '10/17（六）19:00', name: 'Alessio Menconi Trio', map: '義大利爵士吉他', to: 'comping', toLabel: '伴奏' },
      { d: '10/17（六）20:30', name: '黃瑞豐樂團 ft. 李竺芯', map: '鼓 × 臺語', to: 'listen', toLabel: '節奏組' },
      { d: '10/18（日）20:30', name: 'Alfredo Rodriguez Trio', map: '古巴鋼琴三重奏', to: 'listen', toLabel: 'Call and Response' },
      { d: '10/20（二）20:30', name: 'T-SQUARE', map: '日本融合爵士', to: 'fusion', toLabel: '融合爵士' },
      { d: '10/22（四）19:00', name: '福爾巴莎爵士樂團', map: 'Bossa Nova（依團名推測）', to: 'era-free', toLabel: '拉丁爵士與 Bossa Nova' },
      { d: '10/23（五）20:30', name: '臺北爵士大樂隊', map: '大樂團（依團名）', to: 'era-swing', toLabel: '搖擺與大樂團' },
      { d: '10/25（日）20:30', name: 'Kevin Haynes Grupo Elegua', map: '當代 African Jazz', to: 'listen', toLabel: '節奏組' }
    ]
  },
  sources: [
    ['臺北市政府文化局：2026 臺北爵士音樂節 20 週年', 'https://culture.gov.taipei/News_Content.aspx?n=63F36AA6E434AD08&sms=78D644F2755ACCAA&s=290B13BD6B874F21'],
    ['臺北流行音樂中心：2026 臺北爵士音樂節', 'https://www.tmc.taipei/tw/blog/show/2026TaipeiJazzFestival'],
    ['JazzNode：台北爵士音樂節 2026 節目表', 'https://jazznode.com/zh/festivals/taipei-jazz-festival'],
    ['UDN：2026 臺北爵士音樂節 20 週年登場', 'https://woman.udn.com/woman/story/123164/9800024'],
    ['JazzNode：2026 Taiwan Jazz Festival Guide', 'https://jazznode.com/en/magazine/taiwan-jazz-festivals-2026-guide'],
    ['臺中爵士音樂節官方節目表', 'https://www.taichungjazzfestival.tw/2026/tw/schedule/schedule.html'],
    ['Yahoo 新聞：「爵士巨人來了」臺中市民廣場10天共23場演出', 'https://tw.news.yahoo.com/%E7%88%B5%E5%A3%AB%E5%B7%A8%E4%BA%BA%E4%BE%86%E4%BA%86-%E8%87%BA%E4%B8%AD%E5%B8%82%E6%B0%91%E5%BB%A3%E5%A0%B410%E5%A4%A9%E5%85%B123%E5%A0%B4%E6%BC%94%E5%87%BA-110200891.html'],
    ['Wikipedia：Ari Hoenig', 'https://en.wikipedia.org/wiki/Ari_Hoenig'],
    ['JazzWeekly：Hristo Vitchev Quartet 評論', 'https://jazzweekly.com/?p=14107']
  ]
};
function liveActs() {
  var out = [];
  LIVE.days.forEach(function (d) {
    d.acts.forEach(function (a) { if (!a.ws) { var c = {}; for (var k in a) c[k] = a[k]; c.dayLabel = d.date; c.dayId = d.id; out.push(c); } });
  });
  return out;
}
function epLabel(it) {
  if (it.sp) return 'SP' + pad2(it.sp);
  if (it.noep) return '';
  return 'EP' + pad2(it.ep);
}
function buildLiveItems() {
  var acts = liveActs(), items = [];
  function dayItems(d) { return acts.filter(function (a) { return a.dayId === d.id; }); }
  items.push({ id: 'sp-tjf', kind: 'live', kindLabel: '現場', kicker: '台北爵士現場', title: '2026 臺北爵士音樂節 20 週年',
    hook: '台北爵士音樂節辦到第 20 年，今年主題是 Jazz Right「爵對」，並向 Miles Davis 與 John Coltrane 的 100 歲致敬。',
    pts: ['9/4–10/11，連續五週', '四條線：感爵夜現場、絕對爵士派對、大放爵詞、主舞台', '主舞台 10/9–10/11 在臺北流行音樂中心戶外', '主辦：臺北市政府文化局、臺北流行音樂中心'],
    long: ['2026 臺北爵士音樂節邁入第 20 年，主題是 Jazz Right「爵對」，從 9/4 到 10/11 連續五週。',
      '感爵夜現場在大安、大同、萬華的 12 間爵士場館演出；絕對爵士派對把爵士帶到關渡碼頭、眷村文化公園、大稻埕碼頭、寶藏巖國際藝術村與西門紅樓。',
      '10/9 到 10/11 是主舞台，地點在臺北流行音樂中心戶外表演空間，同時有 Hristo Vitchev 與 Ari Hoenig 帶領的大放爵詞工作坊。',
      '今年也向 Miles Davis 與 John Coltrane 的 100 歲冥誕致敬。'],
    tags: ['台北爵士音樂節', '爵士現場', '爵對'], art: 'neo', scene: 'stage-guitar', seed: 201 });
  LIVE.days.forEach(function (d, di) {
    var as = dayItems(d);
    items.push({ id: 'sp-tjf-' + d.id, kind: 'live', kindLabel: '現場', kicker: '台北爵士現場 ' + d.label, title: '台北爵士音樂節 ' + d.label + ' · ' + d.date.split('（')[0] + ' 對照爵士 101',
      hook: d.date + '的主舞台有 ' + as.length + ' 組演出，我把它們對照回爵士 101 的年代與聽法。',
      pts: as.map(function (a) { return a.name + '：' + a.map; }),
      long: as.map(function (a) { return a.t + ' ' + a.name + '\n' + a.who + a.listen; }),
      tags: ['台北爵士音樂節', '爵士現場'], art: 'neo', scene: ['stage-guitar', 'stage-mic', 'stage-drums'][di], seed: 210 + di });
  });
  var songs = LIVE.milesTrane.songs.map(function (id) { return STANDARDS.filter(function (s) { return 's-' + s.id === id; })[0]; });
  items.push({ id: 'sp-mt100', kind: 'live', kindLabel: '現場', kicker: '台北爵士現場', title: 'Miles Davis 與 Coltrane 的 100 歲',
    hook: '今年的台北爵士音樂節向這兩位致敬，從調式爵士開始聽最容易進入。',
    pts: songs.map(function (s) { return s.title + '（' + s.by + '，' + s.yr + '）'; }).concat(['先聽《Kind of Blue》，再聽 Giant Steps']),
    long: ['《Kind of Blue》是調式爵士的最高傑作，Miles Davis 改以音階作為即興基礎，給了樂手極大的旋律自由度。'].concat(songs.map(function (s) { return s.title + '：' + s.note; })),
    tags: ['MilesDavis', 'JohnColtrane', '台北爵士音樂節'], art: 'modal', scene: '50s', seed: 220 });
  var t = LIVE.taichung;
  items.push({ id: 'sp-tc', kind: 'live', kindLabel: '現場', kicker: '台北爵士現場', title: '接著去台中：台中爵士音樂節',
    hook: '台北的主舞台結束了，下一站是台中爵士音樂節，主題 ' + t.theme + '，10 天 23 場。',
    pts: t.acts.map(function (a) { return a.d + ' ' + a.name + '：' + a.map; }),
    long: [t.when + '。主題是 ' + t.theme + '。', t.note].concat(t.acts.map(function (a) { return a.d + ' ' + a.name + '，對照爵士 101 的「' + a.toLabel + '」。'; })),
    tags: ['台中爵士音樂節', '爵士現場'], art: 'free', scene: 'swing', seed: 230 });
  items.push({ id: 'sp-decline', kind: 'topic', kindLabel: '議題', kicker: '爵士101 議題', title: '爵士正在衰落嗎？',
    hook: '看你用什麼量：市占和現場觀眾都在變小，但黑膠、獨立廠牌和年輕聽眾講的是另一個故事。',
    pts: ['美國成人一年內看過爵士現場：2002 年 10.8%，2022 年 6.3%（NEA）', '爵士只占美國串流約 0.8%（2022，Luminate）', '卻占美國黑膠專輯銷量約 6%（2022，Luminate）', 'Laufey《Bewitched》創 Spotify 爵士專輯首發紀錄（2023）'],
    long: ['先看壞消息。美國國家藝術基金會（NEA）的調查顯示，一年內看過爵士現場的美國成人，從 2002 年的 10.8% 降到 2022 年的 6.3%，少了 4.5 個百分點。2022 年的調查在疫情之後，數字可能也受疫情影響。',
      '市場上，爵士在 2022 年只占美國串流約 0.8%。但同一年，它占了美國黑膠專輯銷量約 6%：聽的人少，願意掏錢買實體的死忠聽眾卻不少。',
      '常被提到的原因有幾個：Bebop 之後爵士離開舞池，變成聆聽的藝術；它的和聲與律動被 R&B、嘻哈、Neo-Soul 吸收，很多人聽到了卻不知道那是爵士；以器樂、長篇即興為主的作品，也比較難擠進以歌曲為主的播放清單。',
      '也有回流的跡象。2023 年 Laufey 的《Bewitched》創下 Spotify 爵士專輯首發紀錄；2025 年上半年，獨立廠牌占了爵士串流 39% 以上；台北爵士音樂節在 2026 年邁入第 20 年。',
      '爵士從來不是靠市占活下來的音樂。與其問它會不會消失，不如問：你能不能在別的音樂裡聽出它。'],
    tags: ['爵士樂', '爵士衰落', 'JazzHistory'], art: 'modal', scene: '50s', seed: 240 });
  return items;
}

/* ---------- post items ---------- */
function strip(h) { return h.replace(/<[^>]+>/g, ''); }
function pad2(n) { return (n < 10 ? '0' : '') + n; }
var FUSION_CTX = '爵士遇上搖滾與放克，吉他手成了舞台主角。';
function ctxOf(id) {
  if (id === 'fusion') return FUSION_CTX;
  var e = ERAS.filter(function (x) { return x.id === id; })[0];
  return e ? e.hook : '';
}
var TIP_EXTRA = {
  hsh: ['Head（開場主題）：全體樂手演奏主旋律，確立這首歌的「和弦進行地圖」。',
    'Solo（即興輪奏）：爵士樂的靈魂。樂手輪流獨奏，在既定的和弦地圖上，用音階與琶音重新組合出全新的旋律。注意，背景的和弦進行完全沒有改變。',
    'Head（結尾主題）：所有人都 Solo 完之後，再次回到最初的主旋律，整齊地結束。',
    '下次聽標準曲時，先記住 Head 的旋律，之後每一輪 Solo 都在同一張和弦地圖上走，你就不會迷路。'],
  'tip-rhythm': ['試試看：把注意力只放在貝斯上聽完一整首，再換成只聽鼓。你會發現節奏組才是真正的引擎。'],
  'tip-call': ['試試看：在 Solo 段落裡，數一數鼓手或鋼琴手回應了幾次，以及每次是怎麼接的。'],
  'tip-tension': ['試試看：在 Solo 中找到最「不對勁」的那一刻，然後等它回到主音，你會聽到耳朵被釋放的瞬間。']
};

function lifeText(l) { return /–$/.test(l) ? l.slice(0, -1) + ' 年生' : l; }
function storyLong(s) {
  var out = s.story.slice();
  if (s.years && s.years.length) out.push('關鍵年份：' + s.years.map(function (y) { return y[0] + ' ' + y[1]; }).join('；'));
  if (s.albums && s.albums.length) out.push('先聽這幾張：' + s.albums.map(function (a) { return '《' + a[0] + '》'; }).join('、'));
  return out;
}
function personLong(p, name, ctx) {
  var head = name + (p.zh !== name ? '（' + p.zh + '）' : '') + '，' + p.instr + (p.life ? '，' + lifeText(p.life) : '') + (p.from ? '，出身' + p.from : '') + '。';
  var out = [head].concat(p.story || ['時代背景：' + ctx]);
  if (p.trivia) out.push('小故事：' + p.trivia);
  if (p.albums && p.albums.length) out.push('代表作：' + p.albums.map(function (a) { return '《' + a[0] + '》'; }).join('、'));
  return out;
}
function buildItems() {
  var out = [];
  function style(p) {
    if (p.era === 'fusion') return p.grp === 'now' ? 'neo' : 'fusion';
    return p.era === 'swing' ? 'swing' : p.era === 'bebop' ? 'bebop' : p.era === 'free' ? 'free' : 'hardbop';
  }
  function addPerson(p) {
    var name = p.en || p.zh, ctx = ctxOf(p.era === 'fusion' ? 'fusion' : p.era);
    out.push({ id: 'p-' + p.id, kind: 'person', kindLabel: '樂手', kicker: '爵士樂手', title: p.zh + (p.en ? ' ' + p.en : ''), hook: p.blurb,
      pts: ['樂器：' + p.instr, '活躍年代：' + p.yr, '先聽一首完整曲目，找出 Head 與 Solo'],
      long: personLong(p, name, ctx),
      tags: ['爵士樂', name.replace(/[^A-Za-z0-9一-鿿]/g, '')], art: style(p), inst: p.inst, v: p.v, dec: p.dec, seed: p.id.length * 17 + 5 });
  }
  out.push({ id: 'intro', kind: 'series', kindLabel: '系列', kicker: '系列開場', title: '一百年的爵士，從這裡開始',
    hook: '爵士樂發源於 19 世紀末至 20 世紀初的美國紐奧良，核心是即興與切分節奏。',
    pts: ['起源：藍調、散拍與歐洲和聲在紐奧良交融', '核心精神：即興 Improvisation 與切分 Syncopation', '風格是疊加，不是淘汰', '這個系列：年代、樂手、怎麼聽、怎麼伴奏、經典名曲'],
    long: ['爵士樂（Jazz）發源於 19 世紀末至 20 世紀初的美國紐奧良，是非裔美國人將藍調、散拍音樂與歐洲和聲體系交融後誕生的音樂。',
      '它的核心精神在於即興與切分節奏。在接下來的一百多年中，爵士樂不斷變形、演化，衍生出無數分支，並成為現代流行樂、R&B、嘻哈與金屬樂的重要底層養分。',
      '爵士樂的歷史從未「淘汰」過任何一種風格，而是不斷地「疊加」。現在的一段現代吉他 Solo 裡，你可以同時聽見 1920 年代的藍調情感、1940 年代 Bebop 的複雜腦袋，以及 1970 年代 Fusion 的搖滾張力。',
      '這個系列會依序帶你走過歷史年代、關鍵樂手、怎麼聽、怎麼伴奏，最後是一批經典名曲。'],
    tags: ['爵士樂', 'JazzHistory'], art: 'modal', scene: 'roots', seed: 3 });
  ERAS.forEach(function (e) {
    var long = [];
    if (e.story) long = storyLong(e);
    else {
      if (e.lead && !e.body.length) long.push(e.lead);
      e.body.forEach(function (b) { long.push(b[0] + '：' + b[1]); });
    }
    out.push({ id: 'era-' + e.id, kind: 'era', kindLabel: '年代', kicker: '爵士史 ' + e.yr, title: e.title, hook: e.hook, pts: e.pts, long: long,
      tags: ['爵士樂', 'JazzHistory'].concat(e.tags), art: e.style, scene: SCENE_OF[e.id], seed: e.seed });
    PEOPLE.filter(function (p) { return p.era === e.id && !p.s2; }).forEach(addPerson);
    if (e.id === 'free') {
      out.push({ id: 'era-fusion', kind: 'era', kindLabel: '年代', kicker: 'Jazz Fusion 1970s–', title: '插上電的突變：融合爵士', hook: '爵士遇上搖滾與放克，吉他手成了舞台主角。',
        pts: ['1970 年 Miles Davis《Bitches Brew》宣告 Fusion 時代', '70s：狂暴速彈、奇數拍與實驗', '80s：精緻旋律、空間感、Chorus 與 Delay', '2000s：與 R&B、嘻哈、Neo-Soul 深度融合'],
        long: storyLong(FUSION_STORY),
        tags: ['爵士樂', 'JazzFusion', '爵士吉他'], art: 'fusion', scene: 'fusion', seed: 61 });
      PEOPLE.filter(function (p) { return p.era === 'fusion' && !p.s2; }).forEach(addPerson);
    }
  });
  var tipLike = [HSH].concat(TIPS, VOICINGS, RHYTHMS);
  tipLike.forEach(function (t, i) {
    var kicker = t.id === 'hsh' || t.id.indexOf('tip') === 0 ? '聽懂爵士' : '爵士伴奏 Comping', long;
    if (TIP_EXTRA[t.id] && t.id === 'hsh') long = TIP_EXTRA.hsh;
    else if (t.id.indexOf('tip-') === 0) long = [strip(t.text)].concat(TIP_EXTRA[t.id]);
    else if (t.id.indexOf('v-') === 0) long = ['爵士伴奏很少用六條弦全滿的封閉和弦，以免頻率太滿，干擾貝斯手與主奏者。', strip(t.text)];
    else long = ['爵士節奏的核心在於切分音，極少把和弦彈在正拍上。', strip(t.text)];
    out.push({ id: t.id, kind: 'tip', kindLabel: '聽法與伴奏', kicker: kicker, title: t.title, hook: t.hook, pts: t.pts, long: long,
      tags: ['爵士樂', 'JazzTips'].concat(t.tags), art: 'bebop', scene: 'notes', seed: 70 + i });
  });
  STANDARDS.forEach(function (s, i) {
    var yr = s.yr === '傳統' ? '傳統曲' : s.yr + ' 年';
    out.push({ id: 's-' + s.id, kind: 'std', kindLabel: '名曲', kicker: 'Real Book 名曲', title: s.title, hook: '這首 ' + s.title + '，是「' + ERA_LABEL[s.era] + '」時期值得先聽的一首。',
      pts: ['作曲：' + s.by + '（' + s.yr + '）', s.note, '年代：' + ERA_LABEL[s.era]],
      long: [s.note, '作曲者：' + s.by + '，' + yr + '，屬於「' + ERA_LABEL[s.era] + '」時期。', '時代背景：' + ctxOf(s.era),
        '聽的方法：先找出 Head 的主旋律，再數有幾位樂手輪流 Solo，最後留意節奏組怎麼在 Solo 底下推動和弦。'],
      tags: ['爵士標準曲', 'RealBook', s.title.replace(/[^A-Za-z0-9]/g, '')], art: 'bebop', scene: SCENE_OF[s.era], seed: 100 + i });
  });
  out.push({ id: 'outro', kind: 'series', kindLabel: '系列', kicker: '系列收尾', title: '聽爵士的心法',
    hook: '聽懂底層的和弦循環，看見樂手之間的互相丟球與接招，這場音樂對話就會變得有趣。',
    pts: ['聽懂底層的和弦循環', '看見樂手之間的互相丟球與接招', '了解各個時代如何推翻前人的框架'],
    long: ['當你聽懂了底層的和弦循環，看見了樂手之間的互相丟球與接招，並了解各個時代樂手如何推翻前人的框架，你就能真正享受這場充滿未知與驚喜的音樂對話。',
      '把這個系列收藏起來，下次聽爵士時，翻出來對照。'],
    tags: ['爵士樂', 'JazzHistory'], art: 'swing', scene: 'swing', seed: 9 });
  ['roots', 'swing', 'bebop', '50s', 'free', 'fusion'].forEach(function (era) {
    PEOPLE.filter(function (p) { return p.s2 && p.era === era; }).forEach(addPerson);
  });
  var live = buildLiveItems();
  out.forEach(function (it, i) {
    it.ep = i + 1;
    it.next = out[i + 1] ? { label: 'EP' + pad2(i + 2), title: out[i + 1].title } : null;
  });
  live.forEach(function (it, i) {
    it.sp = i + 1;
    it.next = live[i + 1] ? { label: 'SP' + pad2(i + 2), title: live[i + 1].title } : null;
  });
  return out.concat(live);
}

/* ---------- post text ---------- */
var PLAT = {
  ig: { name: 'Instagram', limit: 2200, tags: 8 },
  threads: { name: 'Threads', limit: 500, tags: 2 },
  x: { name: 'X', limit: 280, tags: 2 },
  fb: { name: 'Facebook', limit: 5000, tags: 3 },
  line: { name: 'LINE', limit: 1000, tags: 0 }
};
var TONES = { info: '資訊型', chat: '聊天型', mini: '極簡' };
var LENS = { short: '精簡', full: '完整長文' };

function wlen(s) {
  var n = 0, i, c, a = Array.from(s);
  for (i = 0; i < a.length; i++) {
    c = a[i].codePointAt(0);
    n += (c <= 0x10FF || (c >= 0x2000 && c <= 0x200D) || (c >= 0x2010 && c <= 0x201F) || (c >= 0x2032 && c <= 0x2037)) ? 1 : 2;
  }
  return n;
}
function plen(s, plat) { return plat === 'x' ? wlen(s) : Array.from(s).length; }

function headOf(it, tone, series) {
  var nn = epLabel(it), sp = nn ? ' ' + nn : '';
  if (series) return tone === 'info' ? '【' + series + sp + '｜' + it.kicker + '】' + it.title : series + sp + '｜' + it.title;
  return tone === 'info' ? '【' + it.kicker + '】' + it.title : it.title;
}
function tagsOf(it, plat, series) {
  var t = it.tags.slice(), st = (series || '').replace(/[#\s]/g, '');
  if (st) { t = t.filter(function (x) { return x !== st; }); t.unshift(st); }
  return t.slice(0, PLAT[plat].tags).map(function (x) { return '#' + x; }).join(' ');
}
function tailOf(it, plat, tone, series, full) {
  var l = [];
  if (full && series && it.next && tone !== 'mini') l.push('下一集 ' + it.next.label + '：' + it.next.title);
  if ((plat === 'ig' || plat === 'fb' || plat === 'line') && tone !== 'mini') {
    l.push(tone === 'info' ? '收藏起來，下次聽爵士時翻出來對照。' : '你最常聽哪個年代的爵士？留言聊聊。');
  }
  return l.join('\n');
}
function ptsBlock(it, tone, n, full) {
  var pts = it.pts.slice(0, tone === 'mini' ? Math.min(n, 1) : n);
  if (!pts.length) return '';
  var lines = pts.map(function (p, i) { return tone === 'info' ? '・' + p : tone === 'chat' ? (i + 1) + '. ' + p : p; });
  if (full && tone !== 'mini') lines.unshift('重點整理：');
  return lines.join('\n');
}

function splitUnit(u, max, plat) {
  if (plen(u, plat) <= max) return [u];
  var sents = u.match(/[^。！？\n]*[。！？\n]?/g) || [u], out = [], cur = '';
  sents.forEach(function (s) {
    if (!s) return;
    if (plen(s, plat) > max) {
      if (cur) { out.push(cur); cur = ''; }
      var buf = '';
      Array.from(s).forEach(function (ch) { if (plen(buf + ch, plat) > max) { out.push(buf); buf = ''; } buf += ch; });
      cur = buf;
      return;
    }
    if (plen(cur + s, plat) > max) { out.push(cur); cur = s; } else cur += s;
  });
  if (cur) out.push(cur);
  return out.map(function (x) { return x.replace(/\s+$/, ''); }).filter(Boolean);
}
function packThread(units, limit, plat) {
  var max = limit - 10, pieces = [], parts = [], cur = '';
  units.forEach(function (u) { splitUnit(u, max, plat).forEach(function (p) { pieces.push(p); }); });
  pieces.forEach(function (p) {
    var c = cur ? cur + '\n\n' + p : p;
    if (plen(c, plat) <= max) cur = c; else { parts.push(cur); cur = p; }
  });
  if (cur) parts.push(cur);
  if (parts.length > 1) parts = parts.map(function (p, i) { return p + '\n\n(' + (i + 1) + '/' + parts.length + ')'; });
  return parts;
}

function buildPosts(it, plat, tone, opt) {
  opt = opt || {};
  var P = PLAT[plat], series = opt.series || '', full = opt.len === 'full' && tone !== 'mini';
  var head = headOf(it, tone, series), hook = tone === 'chat' ? '你知道嗎？' + it.hook : it.hook;
  var tags = tagsOf(it, plat, series), longs = full ? (it.long || []) : [];
  var tail = tailOf(it, plat, tone, series, full);
  function join(nl, np) {
    var b = [head + '\n' + hook].concat(longs.slice(0, nl)), pb = ptsBlock(it, tone, np, full);
    if (pb) b.push(pb);
    if (tail) b.push(tail);
    if (tags) b.push(tags);
    return b.join('\n\n');
  }
  if (full && (plat === 'x' || plat === 'threads')) {
    var units = [head + '\n' + hook].concat(longs), pb2 = ptsBlock(it, tone, it.pts.length, true);
    if (pb2) units.push(pb2);
    var tl = [tail, tags].filter(Boolean).join('\n\n');
    if (tl) units.push(tl);
    return packThread(units, P.limit, plat);
  }
  var nl, np, text;
  for (nl = longs.length; nl >= 0; nl--) {
    for (np = it.pts.length; np >= 0; np--) {
      text = join(nl, np);
      if (plen(text, plat) <= P.limit) return [text];
    }
  }
  var chars = Array.from(text), out = '', n;
  for (n = 0; n < chars.length; n++) {
    if (plen(out + chars[n] + '…', plat) > P.limit) break;
    out += chars[n];
  }
  return [out + '…'];
}
var SEP = '\n\n———\n\n';
function buildText(it, plat, tone, opt) { return buildPosts(it, plat, tone, opt).join(SEP); }

function buildSchedule(items, perWeek, start, series) {
  var sets = { 1: [1], 2: [2, 5], 3: [1, 3, 5], 5: [1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
  var days = sets[perWeek] || sets[3], wk = ['日', '一', '二', '三', '四', '五', '六'];
  var out = [], d = new Date(start.getTime()), i = 0, guard = 0;
  while (i < items.length && guard < 1000) {
    if (days.indexOf(d.getDay()) >= 0) {
      out.push((d.getMonth() + 1) + '/' + d.getDate() + '（週' + wk[d.getDay()] + '）' + (series ? series + ' ' : '') + epLabel(items[i]) + '｜' + items[i].title);
      i++;
    }
    d.setDate(d.getDate() + 1); guard++;
  }
  return out.join('\n');
}

/* ---------- cover art ---------- */
function rng(seed) {
  var a = (seed || 1) >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function art(style, w, h, P, seed, abs) {
  var r = rng(seed), s = '', i, j, x, y;
  function F(c, o) { return 'style="fill:' + c + (o != null ? ';opacity:' + o : '') + '"'; }
  function S(c, sw, o) { return 'style="fill:none;stroke:' + c + ';stroke-width:' + sw + (o != null ? ';opacity:' + o : '') + ';stroke-linecap:round;stroke-linejoin:round"'; }
  var bg = '<rect width="' + w + '" height="' + h + '" ' + F(P.bg) + '/>';
  if (style === 'roots') {
    var cols = 16, rows = 6, cw = w / cols, rh = h / rows, pat;
    for (j = 0; j < rows; j++) {
      for (i = 0; i < cols; i++) {
        var on = (i % 2 === 0) ? r() > 0.35 : r() > 0.62;
        var off = i % 2 === 1;
        x = i * cw + cw * 0.12; y = j * rh + rh * 0.18;
        s += '<rect x="' + x + '" y="' + y + '" width="' + (cw * 0.76) + '" height="' + (rh * 0.64) + '" rx="2" ' +
          (on ? F(off ? P.accent : P.ink, off ? 1 : 0.85) : F(P.line, 0.55)) + '/>';
      }
    }
  } else if (style === 'swing') {
    var cx = w * 0.12, cy = h * 1.08;
    for (i = 0; i < 11; i++) {
      var rad = h * (0.28 + i * 0.1);
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + rad + '" ' + S(i % 3 === 0 ? P.accent : P.ink, i % 3 === 0 ? h * 0.025 : h * 0.008, i % 3 === 0 ? 1 : 0.7) + '/>';
    }
    for (i = 0; i < 26; i++) {
      var ang = -r() * Math.PI / 2, rr = h * (0.3 + r() * 1.0);
      s += '<circle cx="' + (cx + Math.cos(ang) * rr) + '" cy="' + (cy + Math.sin(ang) * rr) + '" r="' + (h * (0.01 + r() * 0.025)) + '" ' + F(i % 4 === 0 ? P.accent : P.blue) + '/>';
    }
  } else if (style === 'bebop') {
    for (j = 0; j < 14; j++) {
      var d = 'M0 ' + (h * (0.1 + r() * 0.8));
      var steps = 18, up = r() > 0.5;
      for (i = 1; i <= steps; i++) {
        up = !up;
        d += ' L' + (w * i / steps) + ' ' + Math.max(h * 0.04, Math.min(h * 0.96, (h * (0.1 + r() * 0.8)) + (up ? -1 : 1) * h * 0.12));
      }
      s += '<path d="' + d + '" ' + S(j % 5 === 0 ? P.accent : P.ink, j % 5 === 0 ? h * 0.012 : h * 0.005, j % 5 === 0 ? 1 : 0.65) + '/>';
    }
  } else if (style === 'cool') {
    s += '<circle cx="' + (w * 0.62) + '" cy="' + (h * 0.48) + '" r="' + (h * 0.34) + '" ' + F(P.blue, 0.22) + '/>';
    s += '<circle cx="' + (w * 0.62) + '" cy="' + (h * 0.48) + '" r="' + (h * 0.05) + '" ' + F(P.accent) + '/>';
    s += '<line x1="0" y1="' + (h * 0.74) + '" x2="' + w + '" y2="' + (h * 0.74) + '" ' + S(P.ink, h * 0.006, 0.45) + '/>';
  } else if (style === 'hardbop') {
    var n = 12, bw = w / n;
    for (i = 0; i < n; i++) {
      var bh = h * (0.3 + r() * 0.65);
      s += '<rect x="' + (i * bw + bw * 0.1) + '" y="' + (h - bh) + '" width="' + (bw * 0.8) + '" height="' + bh + '" ' + F(i % 3 === 0 ? P.accent : i % 3 === 1 ? P.ink : P.blue, i % 3 === 1 ? 0.85 : 1) + '/>';
    }
  } else if (style === 'modal') {
    var mx = w * 0.5, my = h * 0.5, base = Math.min(w, h);
    for (i = 1; i <= 5; i++) s += '<circle cx="' + mx + '" cy="' + my + '" r="' + (base * 0.09 * i) + '" ' + S(P.ink, base * 0.006, 0.4) + '/>';
    for (i = 0; i < 7; i++) {
      var a2 = -Math.PI / 2 + i * 2 * Math.PI / 7;
      s += '<circle cx="' + (mx + Math.cos(a2) * base * 0.45) + '" cy="' + (my + Math.sin(a2) * base * 0.45) + '" r="' + (base * (i === 1 ? 0.045 : 0.022)) + '" ' + F(i === 1 ? P.accent : P.ink) + '/>';
    }
    s += '<circle cx="' + mx + '" cy="' + my + '" r="' + (base * 0.03) + '" ' + F(P.blue) + '/>';
  } else if (style === 'free') {
    for (i = 0; i < 24; i++) {
      var col = i % 3 === 0 ? P.accent : i % 3 === 1 ? P.ink : P.blue;
      s += '<path d="M' + (r() * w) + ' ' + (r() * h) + ' C' + (r() * w) + ' ' + (r() * h) + ' ' + (r() * w) + ' ' + (r() * h) + ' ' + (r() * w) + ' ' + (r() * h) + '" ' + S(col, h * (0.004 + r() * 0.03), 0.8) + '/>';
    }
  } else if (style === 'fusion') {
    for (j = 0; j < 6; j++) {
      var amp = h * (0.12 + j * 0.04), cyy = h * (0.18 + j * 0.13), clip = amp * 0.55, dd = '';
      for (i = 0; i <= 80; i++) {
        x = w * i / 80;
        y = cyy + Math.max(-clip, Math.min(clip, Math.sin(i / 80 * Math.PI * (4 + j)) * amp));
        dd += (i ? ' L' : 'M') + x + ' ' + y;
      }
      s += '<path d="' + dd + '" ' + S(j % 2 ? P.blue : P.accent, h * 0.018, 0.95) + '/>';
    }
  } else if (style === 'neo') {
    for (i = 0; i < 8; i++) {
      s += '<circle cx="' + (r() * w) + '" cy="' + (r() * h) + '" r="' + (h * (0.12 + r() * 0.3)) + '" ' + F(i % 3 === 0 ? P.accent : i % 3 === 1 ? P.blue : P.ink, 0.28) + '/>';
    }
    for (i = 1; i < 4; i++) s += '<line x1="0" y1="' + (h * i / 4) + '" x2="' + w + '" y2="' + (h * i / 4) + '" ' + S(P.line, 1, 0.8) + '/>';
  } else {
    s += '<circle cx="' + (w / 2) + '" cy="' + (h / 2) + '" r="' + (h * 0.3) + '" ' + F(P.accent) + '/>';
  }
  var dim = abs ? ' width="' + w + '" height="' + h + '"' : ' width="100%" height="100%"';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice"' + dim + ' aria-hidden="true">' + bg + s + '</svg>';
}

/* ---------- original synthesized demos (note names or MIDI numbers) ---------- */
var NOTE_BASE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(n) {
  if (typeof n === 'number') return n;
  var m = /^([A-G])(b|#)?(-?\d)$/.exec(n);
  if (!m) throw new Error('bad note ' + n);
  var v = 12 * (+m[3] + 1) + NOTE_BASE[m[1]];
  if (m[2] === '#') v++;
  if (m[2] === 'b') v--;
  return v;
}
function hz(n) { return 440 * Math.pow(2, (midi(n) - 69) / 12); }

function mapBeat(b, swing) {
  if (!swing) return b;
  var fl = Math.floor(b), f = b - fl;
  return fl + (f < 0.5 ? f * 4 / 3 : 2 / 3 + (f - 0.5) * 2 / 3);
}

function ridePattern(E, bar, v) {
  [0, 1, 1.5, 2, 3, 3.5].forEach(function (o) { E.push({ b: bar * 4 + o, k: 'ride', v: v || 0.5 }); });
}

var DEMOS = {
  roots: { label: '散拍 Stride', bpm: 100, swing: false, len: 16, build: function () {
    var E = [], bars = [
      ['C3', 'G2', ['E4', 'G4', 'C5'], ['E5', 'G5', 'A5', 'G5', 'E5']],
      ['A2', 'E3', ['G4', 'C#5', 'E5'], ['E5', 'C#5', 'E5', 'A5', 'G5']],
      ['D3', 'A2', ['F#4', 'A4', 'C5'], ['A5', 'F#5', 'A5', 'C6', 'A5']],
      ['G2', 'D3', ['F4', 'B4', 'D5'], ['B5', 'G5', 'B5', 'D6', 'B5']]
    ], mt = [0.5, 1.25, 2, 2.5, 3.25];
    bars.forEach(function (bar, i) {
      var b0 = i * 4;
      E.push({ b: b0, k: 'bass', n: bar[0], d: 0.9, v: 0.8 });
      E.push({ b: b0 + 2, k: 'bass', n: bar[1], d: 0.9, v: 0.7 });
      [1, 3].forEach(function (o) { bar[2].forEach(function (n) { E.push({ b: b0 + o, k: 'pno', n: n, d: 0.3, v: 0.5 }); }); });
      bar[3].forEach(function (n, j) { E.push({ b: b0 + mt[j], k: 'pno', n: n, d: 0.4, v: 0.75 }); });
    });
    return E;
  } },
  swing: { label: '搖擺 Swing', bpm: 128, swing: true, len: 16, build: function () {
    var E = [], walk = [['Bb2', 'D3', 'F3', 'G3'], ['G2', 'B2', 'D3', 'F3'], ['C3', 'Eb3', 'G3', 'Bb2'], ['F2', 'A2', 'C3', 'Eb3']],
      comp = [['D4', 'F4', 'G4'], ['B3', 'E4', 'F4'], ['Eb4', 'G4', 'Bb4'], ['A3', 'Eb4', 'G4']];
    for (var i = 0; i < 4; i++) {
      var b0 = i * 4;
      walk[i].forEach(function (n, j) { E.push({ b: b0 + j, k: 'bass', n: n, d: 0.95, v: 0.8 }); });
      ridePattern(E, i, 0.5);
      E.push({ b: b0 + 1, k: 'hat', v: 0.5 }); E.push({ b: b0 + 3, k: 'hat', v: 0.5 });
      [0, 1.5].forEach(function (o) { comp[i].forEach(function (n) { E.push({ b: b0 + o, k: 'pno', n: n, d: 0.3, v: 0.55 }); }); });
    }
    return E;
  } },
  bebop: { label: 'Bebop 快速', bpm: 180, swing: true, len: 16, build: function () {
    var E = [], walk = [['D3', 'F3', 'A3', 'C4'], ['G2', 'B2', 'D3', 'F3'], ['C3', 'E3', 'G3', 'B2'], ['C3', 'G2', 'E3', 'A2']],
      comp = [['F4', 'A4', 'C5'], ['F4', 'B4', 'E5'], ['E4', 'G4', 'B4'], null],
      lines = [['D4', 'F4', 'A4', 'C5', 'E5', 'D5', 'C5', 'A4'], ['B4', 'D5', 'F5', 'E5', 'D5', 'B4', 'A4', 'G#4'], ['G4', 'E4', 'C5', 'B4', 'A4', 'G4', 'E4', 'D4']];
    for (var i = 0; i < 4; i++) {
      var b0 = i * 4;
      walk[i].forEach(function (n, j) { E.push({ b: b0 + j, k: 'bass', n: n, d: 0.95, v: 0.8 }); });
      ridePattern(E, i, 0.45);
      E.push({ b: b0 + 1, k: 'hat', v: 0.45 }); E.push({ b: b0 + 3, k: 'hat', v: 0.45 });
      if (comp[i]) comp[i].forEach(function (n) { E.push({ b: b0 + 1.5, k: 'pno', n: n, d: 0.25, v: 0.5 }); });
    }
    lines.forEach(function (ln, bi) { ln.forEach(function (n, j) { E.push({ b: bi * 4 + j * 0.5, k: 'lead', n: n, d: 0.4, v: 0.7 }); }); });
    E.push({ b: 12, k: 'lead', n: 'C5', d: 3, v: 0.7 });
    return E;
  } },
  cool: { label: '酷派 Cool', bpm: 88, swing: true, len: 16, build: function () {
    var E = [], pads = [['E3', 'B3', 'D4', 'G4'], ['G3', 'B3', 'C4', 'E4'], ['F3', 'A3', 'C4', 'E4'], ['F3', 'B3', 'E4', 'A4']],
      bass = [['C3', 'G2'], ['A2', 'E3'], ['D3', 'A2'], ['G2', 'D3']];
    for (var i = 0; i < 4; i++) {
      var b0 = i * 4;
      pads[i].forEach(function (n) { E.push({ b: b0, k: 'pad', n: n, d: 3.8, v: 0.45 }); });
      E.push({ b: b0, k: 'bass', n: bass[i][0], d: 1.9, v: 0.65 });
      E.push({ b: b0 + 2, k: 'bass', n: bass[i][1], d: 1.9, v: 0.6 });
      ridePattern(E, i, 0.28);
      E.push({ b: b0 + 1, k: 'hat', v: 0.3 }); E.push({ b: b0 + 3, k: 'hat', v: 0.3 });
    }
    [[1, 'E5', 1.5], [5.5, 'C5', 1], [9, 'A4', 1.5], [13, 'B4', 2.5]].forEach(function (x) { E.push({ b: x[0], k: 'lead', n: x[1], d: x[2], v: 0.5 }); });
    return E;
  } },
  hardbop: { label: '硬咆勃 Hard Bop', bpm: 148, swing: true, len: 16, build: function () {
    var E = [], walk = [['C3', 'Eb3', 'G3', 'Bb2'], ['F2', 'Ab2', 'C3', 'Eb3'], ['C3', 'G3', 'Eb3', 'D3'], ['G2', 'B2', 'D3', 'F3']],
      comp = [['Eb4', 'G4', 'Bb4', 'C5'], ['Eb4', 'Ab4', 'C5'], ['Eb4', 'G4', 'Bb4', 'C5'], ['B3', 'F4', 'Ab4']],
      riff = [[0, 'C5', 0.5], [0.5, 'Eb5', 0.5], [1, 'F5', 0.5], [1.5, 'Gb5', 0.5], [2, 'G5', 1.5],
        [4, 'F5', 0.5], [4.5, 'Ab5', 0.5], [5, 'Bb5', 0.5], [5.5, 'B5', 0.5], [6, 'C6', 1.5],
        [8, 'C5', 0.5], [8.5, 'Eb5', 0.5], [9, 'F5', 0.5], [9.5, 'Gb5', 0.5], [10, 'G5', 1.5],
        [12, 'G5', 0.5], [12.5, 'F5', 0.5], [13, 'D5', 0.5], [13.5, 'B4', 1.5]];
    for (var i = 0; i < 4; i++) {
      var b0 = i * 4;
      walk[i].forEach(function (n, j) { E.push({ b: b0 + j, k: 'bass', n: n, d: 0.95, v: 0.85 }); });
      ridePattern(E, i, 0.5);
      E.push({ b: b0 + 1, k: 'snare', v: 0.7 }); E.push({ b: b0 + 3, k: 'snare', v: 0.75 });
      E.push({ b: b0, k: 'kick', v: 0.6 });
      [1, 3, 3.5].forEach(function (o) { comp[i].forEach(function (n) { E.push({ b: b0 + o, k: 'pno', n: n, d: 0.25, v: o === 3.5 ? 0.4 : 0.6 }); }); });
    }
    riff.forEach(function (x) { E.push({ b: x[0], k: 'lead', n: x[1], d: x[2], v: 0.65 }); });
    return E;
  } },
  modal: { label: '調式 Modal', bpm: 116, swing: true, len: 16, build: function () {
    var E = [], walk = [['D2', 'A2', 'C3', 'A2'], ['D2', 'F2', 'A2', 'C3'], ['D2', 'A2', 'C3', 'E3'], ['D3', 'C3', 'A2', 'F2']],
      lead = [[0.5, 'F5', 0.5], [1, 'G5', 0.5], [1.5, 'A5', 1.5], [4.5, 'C6', 0.5], [5, 'A5', 0.5], [5.5, 'G5', 1], [8.5, 'E5', 0.5], [9, 'F5', 0.5], [9.5, 'D5', 2], [13, 'A5', 0.5], [13.5, 'G5', 0.5], [14, 'F5', 1.5]];
    for (var i = 0; i < 4; i++) {
      var b0 = i * 4;
      walk[i].forEach(function (n, j) { E.push({ b: b0 + j, k: 'bass', n: n, d: 0.95, v: 0.8 }); });
      ridePattern(E, i, 0.45);
      E.push({ b: b0 + 1, k: 'hat', v: 0.4 }); E.push({ b: b0 + 3, k: 'hat', v: 0.4 });
    }
    [0, 8].forEach(function (b) { ['D3', 'G3', 'C4', 'F4', 'A4'].forEach(function (n) { E.push({ b: b, k: 'pad', n: n, d: 7.5, v: 0.35 }); }); });
    [1.5, 9.5].forEach(function (b) { ['G3', 'C4', 'F4'].forEach(function (n) { E.push({ b: b, k: 'pno', n: n, d: 0.3, v: 0.5 }); }); });
    lead.forEach(function (x) { E.push({ b: x[0], k: 'lead', n: x[1], d: x[2], v: 0.55 }); });
    return E;
  } },
  free: { label: '自由 Free', bpm: 96, swing: false, len: 16, build: function () {
    var E = [], r = rng(7), i, j;
    for (i = 0; i < 14; i++) {
      var b = r() * 15, base = 55 + Math.floor(r() * 30), d = 0.2 + r() * 1.3;
      for (j = 0; j < 3; j++) E.push({ b: b + j * 0.04, k: 'dlead', n: base + Math.floor(r() * 5), d: d, v: 0.45 });
    }
    for (i = 0; i < 8; i++) E.push({ b: r() * 16, k: 'noise', d: 0.3 + r() * 0.8, v: 0.4 });
    for (i = 0; i < 8; i++) E.push({ b: r() * 16, k: 'snare', v: 0.4 + r() * 0.3 });
    for (i = 0; i < 5; i++) E.push({ b: r() * 16, k: 'kick', v: 0.6 });
    for (i = 0; i < 10; i++) E.push({ b: r() * 16, k: 'ride', v: 0.4 });
    return E;
  } },
  fusion: { label: '融合 Funk Fusion', bpm: 100, swing: false, len: 16, build: function () {
    var E = [], i, o;
    var em = [[0, 'E2', 0.4], [0.75, 'E2', 0.2], [1.5, 'G2', 0.3], [2, 'A2', 0.3], [2.5, 'B2', 0.3], [3, 'D3', 0.4], [3.5, 'E3', 0.2]],
      a13 = [[0, 'A2', 0.4], [0.75, 'A2', 0.2], [1.5, 'E3', 0.3], [2, 'G3', 0.3], [2.5, 'A2', 0.3], [3, 'C#3', 0.4], [3.5, 'E3', 0.2]];
    for (i = 0; i < 4; i++) {
      var b0 = i * 4, riff = i < 2 ? em : a13, st = i < 2 ? ['D4', 'G4', 'B4'] : ['G3', 'C#4', 'F#4'];
      riff.forEach(function (x) { E.push({ b: b0 + x[0], k: 'ebass', n: x[1], d: x[2], v: 0.8 }); });
      [0, 0.75, 2.5].forEach(function (k) { E.push({ b: b0 + k, k: 'kick', v: 0.75 }); });
      [1, 3].forEach(function (k) { E.push({ b: b0 + k, k: 'snare', v: 0.7 }); });
      for (o = 0; o < 4; o += 0.25) E.push({ b: b0 + o, k: 'hat', v: (o * 4) % 2 === 0 ? 0.45 : 0.22 });
      [0.5, 2.25].forEach(function (k) { st.forEach(function (n) { E.push({ b: b0 + k, k: 'rhodes', n: n, d: 0.25, v: 0.55 }); }); });
    }
    [[0, 'B4', 0.5], [0.5, 'D5', 0.5], [1, 'E5', 1.5], [3, 'G5', 0.5], [3.5, 'F#5', 0.5], [4, 'E5', 1], [5.5, 'D5', 0.5], [6, 'B4', 2],
      [8, 'C#5', 0.5], [8.5, 'E5', 0.5], [9, 'G5', 1], [10.5, 'F#5', 0.5], [11, 'E5', 1.5], [14, 'D5', 0.5], [14.5, 'B4', 1.5]].forEach(function (x) {
      E.push({ b: x[0], k: 'dlead', n: x[1], d: x[2], v: 0.6 });
    });
    return E;
  } },
  neo: { label: 'Neo-Soul', bpm: 78, swing: false, len: 16, build: function () {
    var E = [], ch = [['E3', 'G3', 'B3', 'D4'], ['E3', 'G3', 'B3', 'C4'], ['F3', 'A3', 'C4', 'G4'], ['F3', 'B3', 'E4', 'A4']], roots = ['C2', 'A1', 'D2', 'G1'], i, o;
    for (i = 0; i < 4; i++) {
      var b0 = i * 4;
      [[0, 1.2], [1.75, 0.6], [2.5, 1.2]].forEach(function (x) { ch[i].forEach(function (n) { E.push({ b: b0 + x[0], k: 'rhodes', n: n, d: x[1], v: 0.5, late: 0.05 }); }); });
      E.push({ b: b0, k: 'sub', n: roots[i], d: 1.5, v: 0.9 });
      E.push({ b: b0 + 2.5, k: 'sub', n: roots[i], d: 1, v: 0.8 });
      E.push({ b: b0, k: 'kick', v: 0.7 }); E.push({ b: b0 + 2.25, k: 'kick', v: 0.55 });
      [1, 3].forEach(function (k) { E.push({ b: b0 + k, k: 'snare', v: 0.55, late: 0.07 }); });
      for (o = 0; o < 4; o += 0.5) E.push({ b: b0 + o, k: 'hat', v: 0.22, late: (o * 2) % 2 === 1 ? 0.1 : 0.03 });
    }
    return E;
  } }
};
function demoEvents(key) {
  var d = DEMOS[key], ev = d.build();
  ev.sort(function (a, c) { return a.b - c.b; });
  return ev;
}

/* ===== pencil sketch engine (instruments + scenes) ===== */
var K = null, SK_ID = 0;
function f1(n) { return Math.round(n * 10) / 10; }
function skStart(P, seed) {
  SK_ID++;
  K = { ink: P.ink, bg: P.bg, accent: P.accent, blue: P.blue, line: P.line, id: 'sk' + SK_ID, seed: seed || 1, r: rng((seed || 1) * 7919 + SK_ID) };
}
function sty(o) { var s = '', k; for (k in o) s += k + ':' + o[k] + ';'; return ' style="' + s + '"'; }
function ln(d, w, o) {
  w = w || 1.1;
  var base = { fill: 'none', stroke: K.ink, 'stroke-width': w };
  if (o != null) base.opacity = o;
  var b2 = { fill: 'none', stroke: K.ink, 'stroke-width': f1(w * 0.5), opacity: (o != null ? o : 1) * 0.5 };
  return '<path d="' + d + '"' + sty(base) + ' stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="' + d + '" transform="translate(.5 .4)"' + sty(b2) + ' stroke-linecap="round" stroke-linejoin="round"/>';
}
function hx(d, o, which) { return '<path d="' + d + '"' + sty({ fill: 'url(#' + K.id + (which || 'h') + ')', stroke: 'none', opacity: o == null ? 0.6 : o }) + '/>'; }
function wsh(d, c, o) { return '<path d="' + d + '"' + sty({ fill: c || K.accent, stroke: 'none', opacity: o == null ? 0.3 : o }) + '/>'; }
function st(d, w, o) { return '<path d="' + d + '"' + sty({ fill: 'none', stroke: K.ink, 'stroke-width': w || 2, 'stroke-dasharray': '.5 1.5', opacity: o == null ? 0.7 : o }) + ' stroke-linecap="round"/>'; }
function tube(d, w) {
  return '<path d="' + d + '"' + sty({ fill: 'none', stroke: K.ink, 'stroke-width': w + 1.6 }) + ' stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="' + d + '"' + sty({ fill: 'none', stroke: K.bg, 'stroke-width': w }) + ' stroke-linecap="round" stroke-linejoin="round"/>';
}
function ell(cx, cy, rx, ry, w, fill, rot) {
  var t = rot ? ' transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"' : '';
  return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '"' + t + sty({ fill: fill || 'none', stroke: K.ink, 'stroke-width': w || 1.1 }) + '/>' +
    '<ellipse cx="' + (cx + 0.4) + '" cy="' + (cy + 0.3) + '" rx="' + rx + '" ry="' + ry + '"' + t + sty({ fill: 'none', stroke: K.ink, 'stroke-width': f1((w || 1.1) * 0.5), opacity: 0.45 }) + '/>';
}
function ccl(cx, cy, r, w, fill) { return ell(cx, cy, r, r, w, fill); }
function rect(x, y, w, h, lw, fill) {
  var d = 'M' + x + ' ' + y + ' L' + (x + w) + ' ' + y + ' L' + (x + w) + ' ' + (y + h) + ' L' + x + ' ' + (y + h) + ' Z';
  return (fill ? '<path d="' + d + '"' + sty({ fill: fill, stroke: 'none' }) + '/>' : '') + ln(d, lw || 1.1);
}
function blob(cx, cy, r, k) {
  var n = 9, pts = [], i, a, rr, p, q, d;
  for (i = 0; i < n; i++) {
    a = i / n * Math.PI * 2; rr = r * (0.78 + K.r() * 0.4) * (k || 1);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.9]);
  }
  function mid(a2, b2) { return f1((a2[0] + b2[0]) / 2) + ' ' + f1((a2[1] + b2[1]) / 2); }
  d = 'M' + mid(pts[n - 1], pts[0]);
  for (i = 0; i < n; i++) { p = pts[i]; q = pts[(i + 1) % n]; d += ' Q' + f1(p[0]) + ' ' + f1(p[1]) + ' ' + mid(p, q); }
  return d + ' Z';
}
function pl(frag, x, y, size, rot) {
  return '<g transform="translate(' + f1(x) + ' ' + f1(y) + ') scale(' + f1(size / 100 * 1000) / 1000 + ')' + (rot ? ' rotate(' + rot + ' 50 50)' : '') + '">' + frag + '</g>';
}

/* ---------- instruments (100 x 100 box) ---------- */
var INST = {
  sax: function () {
    var B = 'M41 9 C46 12 47 18 47 25 L49 66 C50 80 60 90 71 87 C79 85 81 77 79 68', s = wsh(blob(56, 52, 40, 1.1), K.accent, 0.3), i;
    s += tube(B, 6.5);
    s += ln('M32 4 L42 10', 2.6);
    s += ell(79, 66, 8.5, 3.4, 1.1, K.bg, -8);
    s += hx('M72 66 C73 70 85 70 86 66 C84 64 74 64 72 66 Z', 0.75);
    for (i = 0; i < 6; i++) s += ccl(f1(47.6 + i * 0.45), 30 + i * 6.5, 2.1, 0.9, K.bg);
    s += ln('M50 34 L56 36 M50 46 L56 48 M51 58 L57 60', 0.9);
    s += st('M51 28 L52.5 66 C53.5 78 61 85 71 83.5', 2.2);
    return s;
  },
  trumpet: function () {
    var s = wsh(blob(52, 52, 42, 1.1), K.accent, 0.3), x;
    s += tube('M10 50 L66 50', 4);
    s += tube('M26 50 L26 64 C26 68 29 70 33 70 L58 70 C63 70 65 67 65 62 L65 50', 4);
    s += tube('M34 50 L34 59 L57 59 L57 50', 3);
    s += ln('M66 49 C78 47 86 38 93 26 L93 74 C86 62 78 53 66 51 Z', 1.2);
    s += hx('M66 49 C78 47 86 38 93 26 L93 42 C86 47 78 52 66 51 Z', 0.7);
    s += st('M70 53 C78 56 86 64 92 72', 2.2);
    for (x = 38; x <= 54; x += 8) s += ln('M' + x + ' 43 L' + x + ' 50', 2.2) + ccl(x, 41, 2.2, 1, K.bg);
    s += ln('M4 47 L10 47 L10 53 L4 53 Z', 1);
    return s;
  },
  guitar: function (v) {
    var body = 'M32 60 C22 60 20 70 26 76 C20 82 22 94 38 95 C46 96 54 96 62 92 C70 88 68 80 62 76 C68 70 64 60 54 60 C50 60 47 62 43 62 C39 62 36 60 32 60 Z', s = '', g = '', y;
    s += wsh(blob(46, 54, 42, 1.1), K.washc || K.accent, 0.3);
    g += '<path d="' + body + '"' + sty({ fill: K.bg, stroke: 'none' }) + '/>' + hx(body, 0.35) + ln(body, 1.3);
    g += ln('M40.5 62 L40.5 12 M45.5 62 L45.5 12', 1);
    g += ln('M39 12 L39 3 L47 3 L47 12 Z', 1.1);
    g += ccl(37.4, 5, 1, 0.7) + ccl(37.4, 9, 1, 0.7) + ccl(48.6, 5, 1, 0.7) + ccl(48.6, 9, 1, 0.7);
    for (y = 18; y <= 58; y += 6) g += ln('M40.5 ' + y + ' L45.5 ' + y, 0.6);
    g += ln('M42.2 62 L42.2 12 M43.8 62 L43.8 12', 0.35);
    g += rect(35, 67, 16, 3, 0.9, K.ink) + rect(35, 75, 16, 3, 0.9, K.ink);
    g += ln('M35 86 L51 86', 1.5) + ln('M40 91 L46 91', 1.1);
    g += ccl(57, 84, 1.7, 0.8) + ccl(53, 89, 1.7, 0.8);
    if (v === 'archtop') g += ln('M29 73 C27 78 29 84 30.5 88 M57 73 C59 78 57 84 55.5 88', 1);
    g += st('M23 78 C22 86 28 93 38 94', 2.2);
    s += '<g transform="rotate(-26 46 54)">' + g + '</g>';
    if (v === 'pedal') {
      s += rect(64, 72, 30, 22, 1.1, K.bg) + ccl(70, 78, 2, 0.8) + ccl(79, 78, 2, 0.8) + ccl(88, 78, 2, 0.8) + ccl(79, 88, 3.6, 0.9, K.bg);
      s += ln('M52 90 C58 92 60 82 64 82', 0.9);
    }
    return s;
  },
  drums: function () {
    var s = wsh(blob(50, 54, 42, 1), K.blue, 0.24);
    s += ell(50, 68, 22, 22, 1.3, K.bg);
    s += ccl(50, 68, 17, 0.8);
    s += hx('M33 68 A17 17 0 1 0 67 68 A17 17 0 1 0 33 68 Z', 0.25);
    s += ln('M30 86 L24 96 M70 86 L76 96', 1);
    s += ln('M25 40 L25 50 C25 54 47 54 47 50 L47 40', 1) + ell(36, 40, 11, 3.6, 1, K.bg) + hx('M25 40 L25 50 C25 54 47 54 47 50 L47 40 Z', 0.3);
    s += ln('M64 56 L64 70 C64 74 88 74 88 70 L88 56', 1) + ell(76, 56, 12, 4, 1, K.bg) + hx('M64 56 L64 70 C64 74 88 74 88 70 L88 56 Z', 0.3);
    s += ln('M66 74 L63 90 M86 74 L89 90', 0.9);
    s += ln('M12 46 L12 92', 0.9) + ln('M22 14 L34 40', 0.8) + ln('M80 26 L77 54', 0.8);
    s += ell(12, 44, 9, 2.2, 1, K.bg) + ell(12, 41, 9, 2.2, 1, K.bg);
    s += ell(22, 14, 15, 3, 1.1, K.bg) + hx('M7 14 C12 18 32 18 37 14 C32 11 12 11 7 14 Z', 0.35);
    s += ell(80, 24, 16, 3.2, 1.1, K.bg) + hx('M64 24 C70 28 90 28 96 24 C90 21 70 21 64 24 Z', 0.35);
    s += ln('M44 30 L60 8 M56 32 L70 12', 1.2);
    return s;
  },
  piano: function () {
    var s = wsh(blob(50, 52, 42, 1.1), K.accent, 0.28), i, ks = [1, 2, 4, 5, 6, 8, 9, 11];
    s += hx('M24 12 L90 12 L92 42 L10 42 Z', 0.2) + ln('M10 42 L24 12 L90 12 L92 42', 1.3);
    s += ln('M30 18 L84 18', 0.6);
    s += rect(8, 42, 84, 40, 1.3, K.bg);
    for (i = 1; i < 12; i++) s += ln('M' + (8 + i * 7) + ' 42 L' + (8 + i * 7) + ' 82', 0.7);
    for (i = 0; i < ks.length; i++) s += rect(8 + ks[i] * 7 - 2.2, 42, 4.4, 24, 0.6, K.ink);
    s += ln('M14 82 L14 95 M86 82 L86 95', 1.2);
    s += st('M10 78 L90 78', 2, 0.5);
    return s;
  },
  mic: function () {
    var s = wsh(blob(50, 48, 40, 1), K.accent, 0.3), i;
    s += ln('M32 30 C32 56 68 56 68 30', 1.3);
    s += rect(38, 10, 24, 40, 1.3, K.bg);
    s += '<rect x="38" y="10" width="24" height="40" rx="11" ry="11"' + sty({ fill: K.bg, stroke: K.ink, 'stroke-width': 1.3 }) + '/>';
    s += hx('M38 21 Q38 10 50 10 Q62 10 62 21 L62 50 L38 50 Z', 0.5) + hx('M38 21 Q38 10 50 10 Q62 10 62 21 L62 50 L38 50 Z', 0.5, 'h2');
    for (i = 0; i < 4; i++) s += ln('M38 ' + (20 + i * 8) + ' L62 ' + (20 + i * 8), 0.5);
    s += ln('M36 52 L64 52', 1.6) + ln('M50 52 L50 88', 1.4);
    s += ell(50, 91, 19, 4, 1.2, K.bg) + hx('M31 91 C36 96 64 96 69 91 C64 87 36 87 31 91 Z', 0.4);
    return s;
  },
  bass: function () {
    var body = 'M50 38 C38 38 34 48 40 54 C32 58 28 70 34 80 C38 90 62 90 66 80 C72 70 68 58 60 54 C66 48 62 38 50 38 Z', s = wsh(blob(50, 56, 40, 1.1), K.blue, 0.24);
    s += '<path d="' + body + '"' + sty({ fill: K.bg, stroke: 'none' }) + '/>' + hx(body, 0.3) + ln(body, 1.3);
    s += ln('M48 38 L48 9 M52 38 L52 9', 1);
    s += ccl(50, 6, 3.6, 1.1, K.bg) + ln('M47 6 L53 6', 0.8);
    s += ln('M42 62 C40 66 42 72 44 74 M58 62 C60 66 58 72 56 74', 1);
    s += ln('M43 76 L57 76', 1.5) + ln('M49.3 14 L49.3 80 M50.7 14 L50.7 80', 0.35);
    s += ln('M50 89 L50 97', 1.2);
    s += st('M36 74 C37 84 44 88 52 88', 2.2);
    return s;
  },
  notes: function () {
    var s = wsh(blob(50, 50, 40, 1.1), K.accent, 0.28), i, xs = [18, 34, 50, 66, 82], ys = [58, 50, 54, 42, 46];
    for (i = 0; i < 5; i++) s += ln('M6 ' + (36 + i * 6) + ' L94 ' + (36 + i * 6), 0.7);
    for (i = 0; i < 5; i++) {
      s += '<ellipse cx="' + xs[i] + '" cy="' + ys[i] + '" rx="4.4" ry="3.2" transform="rotate(-20 ' + xs[i] + ' ' + ys[i] + ')"' + sty({ fill: K.ink, stroke: 'none' }) + '/>';
      s += ln('M' + (xs[i] + 4) + ' ' + (ys[i] - 1) + ' L' + (xs[i] + 4) + ' ' + (ys[i] - 20), 1);
    }
    s += ln('M22 38 L38 30 M54 36 L70 22 M70 22 L86 26', 2.4);
    return s;
  }
};

/* ---------- small per-person marks (100 box, top-right) ---------- */
function txt(x, y, t, size) { return '<text x="' + x + '" y="' + y + '"' + sty({ fill: K.ink, 'font-family': "'Noto Serif TC', Georgia, serif", 'font-size': size || 14, 'font-style': 'italic', 'font-weight': 700 }) + '>' + t + '</text>'; }
var DECOR = {
  odd: function () { return txt(62, 22, '7/8', 16) + ln('M62 27 L86 27', 0.8); },
  legato: function () { return ln('M60 26 C68 8 84 8 92 26', 1.2) + ln('M64 42 C72 28 84 28 90 42', 1) + ccl(60, 28, 1.6, 0.6, K.ink) + ccl(92, 28, 1.6, 0.6, K.ink); },
  pick: function () { return ln('M66 12 L66 30 M62 26 L66 30 L70 26', 1.2) + ln('M76 30 L76 12 M72 16 L76 12 L80 16', 1.2) + ln('M86 12 L86 30 M82 26 L86 30 L90 26', 1.2); },
  chorus: function () {
    var d = '', i, d2 = '';
    for (i = 0; i <= 20; i++) { d += (i ? ' L' : 'M') + (58 + i * 2) + ' ' + f1(20 + Math.sin(i / 1.8) * 6); d2 += (i ? ' L' : 'M') + (58 + i * 2) + ' ' + f1(30 + Math.sin(i / 1.8 + 1.2) * 6); }
    return ln(d, 1.1) + ln(d2, 0.8, 0.7);
  },
  zig: function () { return ln('M58 24 L64 8 L70 28 L76 10 L82 30 L88 12 L96 26', 1.4); },
  bolt: function () { return wsh('M78 4 L62 34 L76 32 L68 56 L94 22 L80 24 Z', K.accent, 0.55) + ln('M78 4 L62 34 L76 32 L68 56 L94 22 L80 24 Z', 1.1); },
  slide: function () { return ln('M60 44 L92 14 M92 14 L84 15 M92 14 L91 22', 1.2) + ln('M60 52 L90 24', 0.8, 0.7) + ccl(60, 44, 2, 0.8, K.bg); },
  inf: function () { return ln('M58 24 C58 12 72 12 78 24 C84 36 98 36 98 24 C98 12 84 12 78 24 C72 36 58 36 58 24 Z', 1.3); },
  t335: function () { return txt(64, 22, '335', 17); },
  notes2: function () { return ln('M64 34 L64 14 L84 10 L84 30', 1.2) + ln('M64 17 L84 13', 2.2) + '<ellipse cx="60" cy="35" rx="4.2" ry="3" transform="rotate(-20 60 35)"' + sty({ fill: K.ink, stroke: 'none' }) + '/>' + '<ellipse cx="80" cy="31" rx="4.2" ry="3" transform="rotate(-20 80 31)"' + sty({ fill: K.ink, stroke: 'none' }) + '/>'; }
};

/* ---------- scene pieces (100 box) ---------- */
var DEC = {
  balcony: function () {
    var s = '', i;
    s += hx('M0 54 L100 54 L100 100 L0 100 Z', 0.2);
    s += ln('M2 30 L98 30', 1.5) + ln('M2 52 L98 52', 1.7) + ln('M2 56 L98 56', 0.8);
    for (i = 0; i < 12; i++) s += ln('M' + (6 + i * 8) + ' 30 L' + (6 + i * 8) + ' 52', 0.9) + ccl(10 + i * 8, 41, 2.2, 0.7);
    s += ln('M10 28 L10 10 C10 -2 34 -2 34 10 L34 28', 1.1) + ln('M50 28 L50 10 C50 -2 74 -2 74 10 L74 28', 1.1);
    s += ln('M10 16 L34 16 M50 16 L74 16', 0.6);
    return s;
  },
  smoke: function () {
    return ln('M30 96 C14 80 46 70 32 54 C20 40 46 30 36 12', 1, 0.6) + ln('M52 96 C40 84 66 76 56 62 C48 50 64 42 58 28', 0.9, 0.5) + ln('M72 96 C62 86 82 80 74 68', 0.8, 0.45);
  },
  vinyl: function () {
    var s = '', r;
    s += rect(8, 12, 76, 78, 1.2, K.bg) + hx('M8 12 L84 12 L84 90 L8 90 Z', 0.12);
    s += ccl(62, 52, 34, 1.3, K.bg) + hx('M28 52 A34 34 0 1 0 96 52 A34 34 0 1 0 28 52 Z', 0.55) + hx('M28 52 A34 34 0 1 0 96 52 A34 34 0 1 0 28 52 Z', 0.4, 'h2');
    for (r = 28; r >= 18; r -= 5) s += '<circle cx="62" cy="52" r="' + r + '"' + sty({ fill: 'none', stroke: K.bg, 'stroke-width': 0.4, opacity: 0.6 }) + '/>';
    s += '<circle cx="62" cy="52" r="11"' + sty({ fill: K.accent, stroke: 'none', opacity: 0.7 }) + '/>' + ccl(62, 52, 11, 0.9) + ccl(62, 52, 1.8, 0.7, K.bg);
    return s;
  },
  lamp: function () {
    return ln('M50 0 L50 18', 1) + wsh('M30 40 L6 100 L94 100 L70 40 Z', K.accent, 0.1) + '<path d="M30 40 L38 18 L62 18 L70 40 Z"' + sty({ fill: K.bg, stroke: 'none' }) + '/>' + hx('M30 40 L38 18 L62 18 L70 40 Z', 0.5) + ln('M30 40 L38 18 L62 18 L70 40 Z', 1.2) + '<circle cx="50" cy="44" r="4.5"' + sty({ fill: K.accent, stroke: 'none', opacity: 0.8 }) + '/>';
  },
  spot: function () {
    return wsh('M42 0 L58 0 L96 100 L4 100 Z', K.accent, 0.13) + ln('M42 0 L4 100 M58 0 L96 100', 0.7, 0.5);
  },
  amp: function () {
    var s = '', i;
    s += rect(10, 22, 80, 70, 1.4, K.bg) + hx('M10 34 L90 34 L90 92 L10 92 Z', 0.4) + hx('M10 34 L90 34 L90 92 L10 92 Z', 0.4, 'h2');
    s += ln('M10 34 L90 34', 1) + ln('M36 22 C36 12 64 12 64 22', 1.2);
    for (i = 0; i < 5; i++) s += ccl(20 + i * 15, 28, 2.2, 0.8, K.bg);
    s += ln('M10 92 L10 97 M90 92 L90 97', 1.4);
    return s;
  },
  board: function () {
    return rect(18, 8, 64, 44, 1.3, K.bg) + hx('M18 8 L82 8 L82 52 L18 52 Z', 0.15) + ln('M18 28 L50 42 L82 28', 1.2) + ln('M18 18 L50 32 L82 18', 0.7) + ln('M50 52 L50 92 M30 97 L50 92 L70 97', 1.2);
  },
  moon: function () {
    return wsh(blob(50, 50, 40, 1), K.accent, 0.4) + ccl(50, 50, 38, 1.3) + ln('M50 12 L50 88 M12 50 L88 50', 0.9);
  },
  scrib: function () {
    var s = '', i, x, y, k;
    for (i = 0; i < 9; i++) {
      x = 5 + K.r() * 90; y = 5 + K.r() * 90;
      s += ln('M' + f1(x) + ' ' + f1(y) + ' C' + f1(x + K.r() * 60 - 30) + ' ' + f1(y + K.r() * 60 - 30) + ' ' + f1(x + K.r() * 60 - 30) + ' ' + f1(y + K.r() * 60 - 30) + ' ' + f1(x + K.r() * 80 - 40) + ' ' + f1(y + K.r() * 80 - 40), 0.8 + K.r() * 1.6, 0.8);
    }
    for (k = 0; k < 3; k++) s += wsh(blob(20 + K.r() * 60, 20 + K.r() * 60, 12 + K.r() * 12, 1), k === 1 ? K.blue : K.accent, 0.25);
    return s;
  },
  wave: function () {
    var d = '', i;
    for (i = 0; i <= 40; i++) d += (i ? ' L' : 'M') + (i * 2.5) + ' ' + f1(50 + Math.max(-14, Math.min(14, Math.sin(i / 3.2) * 22)));
    return ln(d, 1.4, 0.9) + ln(d.replace(/(\d+\.?\d*) (\d+\.?\d*)/g, function (m, a, b) { return a + ' ' + f1(+b + 8); }), 0.8, 0.5);
  }
};
DEC.floor = function () { return ln('M0 50 L100 50', 1.2) + ln('M8 62 L22 62 M34 70 L50 70 M64 60 L80 60 M88 74 L98 74', 0.7, 0.5); };

/* ---------- scenes (height 90, x offsets from center) ---------- */
function ground(c) { return ln('M' + f1(c - 120) + ' 86 L' + f1(c + 120) + ' 86', 1.2) + ln('M' + f1(c - 90) + ' 89 L' + f1(c - 70) + ' 89 M' + f1(c - 20) + ' 89 L' + f1(c + 6) + ' 89 M' + f1(c + 50) + ' 89 L' + f1(c + 80) + ' 89', 0.7, 0.5); }
var SCENES = {
  roots: function (c) { return pl(DEC.balcony(), c - 114, 10, 76) + pl(INST.trumpet(), c - 34, 14, 72) + pl(INST.drums(), c + 40, 8, 78) + ground(c); },
  swing: function (c) { return pl(DEC.spot(), c - 82, -4, 96) + pl(DEC.board(), c - 100, 30, 54) + pl(INST.trumpet(), c - 96, 8, 46, -10) + pl(INST.sax(), c - 34, 2, 80) + pl(INST.bass(), c + 44, 2, 78) + ground(c); },
  bebop: function (c) { return pl(DEC.smoke(), c - 114, -4, 76) + pl(INST.sax(), c - 72, 0, 90, -6) + pl(INST.piano(), c - 6, 36, 76) + pl(DEC.moon(), c + 58, 2, 50) + ground(c); },
  '50s': function (c) { return pl(DEC.lamp(), c - 114, -6, 70) + pl(INST.trumpet(), c - 58, 12, 82) + pl(DEC.vinyl(), c + 30, 2, 84) + ground(c); },
  free: function (c) { return pl(DEC.scrib(), c - 120, 0, 80) + pl(DEC.scrib(), c + 56, 0, 64) + pl(INST.sax(), c - 52, 0, 90, 16) + pl(INST.drums(), c + 30, 8, 76, -8); },
  fusion: function (c) { return pl(DEC.wave(), c - 120, -12, 100) + pl(DEC.wave(), c - 20, -12, 100) + pl(INST.guitar('pedal'), c - 66, 0, 92) + pl(DEC.amp(), c + 26, 10, 74) + ground(c); },
  notes: function (c) { return pl(INST.notes(), c - 62, -2, 120) + pl(DEC.smoke(), c + 56, 2, 66); },
  'stage-guitar': function (c) { return pl(DEC.spot(), c - 78, -4, 96) + pl(INST.guitar('archtop'), c - 78, 2, 90) + pl(DEC.amp(), c + 8, 14, 68) + ground(c); },
  'stage-mic': function (c) { return pl(DEC.spot(), c - 72, -4, 96) + pl(INST.mic(), c - 70, 0, 90) + pl(INST.sax(), c + 2, 6, 72, 6) + ground(c); },
  'stage-drums': function (c) { return pl(DEC.spot(), c - 90, -4, 96) + pl(INST.drums(), c - 88, 0, 90) + pl(INST.bass(), c + 8, 4, 78) + ground(c); }
};

/* ---------- wrappers ---------- */
function skWrap(W, H, w, h, body, abs, bgPaper) {
  var id = K.id, sd = K.seed % 90 + 1;
  var defs = '<defs>' +
    '<filter id="' + id + 'f" filterUnits="userSpaceOnUse" x="0" y="0" width="' + f1(W) + '" height="' + H + '" color-interpolation-filters="sRGB">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="' + sd + '" result="n1"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="n1" scale="1.5" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
    '<feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="1" seed="' + (sd + 5) + '" result="n2"/>' +
    '<feColorMatrix in="n2" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.9 -0.25" result="m"/>' +
    '<feComposite in="d" in2="m" operator="in"/></filter>' +
    '<pattern id="' + id + 'h" width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><line x1="0" y1="0" x2="0" y2="2.4"' + sty({ stroke: K.ink, 'stroke-width': 0.5 }) + '/></pattern>' +
    '<pattern id="' + id + 'h2" width="2.6" height="2.6" patternUnits="userSpaceOnUse" patternTransform="rotate(-42)"><line x1="0" y1="0" x2="0" y2="2.6"' + sty({ stroke: K.ink, 'stroke-width': 0.5 }) + '/></pattern>' +
    '</defs>';
  var dim = abs ? ' width="' + w + '" height="' + h + '"' : ' width="100%" height="100%"';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + f1(W) + ' ' + H + '" preserveAspectRatio="xMidYMid slice"' + dim + ' aria-hidden="true">' + defs +
    '<rect width="' + f1(W) + '" height="' + H + '"' + sty({ fill: K.bg }) + '/>' +
    '<g filter="url(#' + id + 'f)">' + body + '</g></svg>';
}
function staffBg(W, H) {
  var s = '', i, y0 = H * 0.3;
  for (i = 0; i < 5; i++) s += '<path d="M0 ' + f1(y0 + i * 5) + ' L' + f1(W) + ' ' + f1(y0 + i * 5) + '"' + sty({ fill: 'none', stroke: K.ink, 'stroke-width': 0.35, opacity: 0.25 }) + '/>';
  return s;
}
function sketchTile(inst, w, h, P, seed, abs, v, dec) {
  skStart(P, seed);
  var H = 100, W = 100 * w / h, fn = INST[inst] || INST.notes, body = '', rot = ((seed % 5) - 2) * 3;
  K.washc = (seed % 2) ? K.blue : K.accent;
  if (W > 110) body += staffBg(W, H);
  body += pl(fn(v), W / 2 - 46, 4, 92, rot);
  if (dec && DECOR[dec]) body += pl(DECOR[dec](), W / 2 - 46, 4, 92);
  return skWrap(W, H, w, h, body, abs);
}
function sketchScene(id, w, h, P, seed, abs) {
  skStart(P, seed);
  var H = 90, W = 90 * w / h, fn = SCENES[id] || SCENES.notes;
  return skWrap(W, H, w, h, fn(W / 2), abs);
}
function artFor(it, w, h, P, abs) {
  return it.inst ? sketchTile(it.inst, w, h, P, it.seed, abs, it.v, it.dec) : sketchScene(it.scene || 'notes', w, h, P, it.seed, abs);
}

/* ---------- more scene pieces ---------- */
DEC.phones = function () {
  return ln('M18 62 C18 14 82 14 82 62', 3) + ln('M22 60 C22 22 78 22 78 60', 0.8, 0.6) +
    rect(8, 56, 18, 32, 1.3, K.bg) + hx('M8 56 L26 56 L26 88 L8 88 Z', 0.5) +
    rect(74, 56, 18, 32, 1.3, K.bg) + hx('M74 56 L92 56 L92 88 L74 88 Z', 0.5) + wsh('M10 60 L24 60 L24 84 L10 84 Z', K.accent, 0.35);
};
DEC.chairs = function () {
  var s = '', i, x;
  for (i = 0; i < 3; i++) {
    x = 4 + i * 33;
    s += ln('M' + x + ' 20 L' + x + ' 92 M' + x + ' 56 L' + (x + 24) + ' 56 L' + (x + 24) + ' 92 M' + (x + 4) + ' 62 L' + (x + 4) + ' 92', 1.2);
    s += hx('M' + x + ' 22 L' + (x + 5) + ' 22 L' + (x + 5) + ' 50 L' + x + ' 50 Z', 0.4);
    s += ln('M' + x + ' 56 L' + (x + 24) + ' 52', 0.7, 0.6);
  }
  return s;
};
DEC.phone = function () {
  var s = rect(26, 4, 48, 92, 1.4, K.bg) + ln('M44 10 L56 10', 1) + ccl(50, 89, 2.6, 0.8);
  s += wsh('M31 16 L69 16 L69 80 L31 80 Z', K.blue, 0.25);
  s += ln('M35 24 L63 24 M35 32 L58 32', 0.9, 0.7) + rect(35, 40, 28, 22, 0.8) + ln('M35 70 L52 70', 0.9, 0.7);
  s += ln('M38 58 L44 48 L50 54 L58 44', 0.9) + '<path d="M78 30 C84 24 92 28 88 36 L78 46 L68 36 C64 28 72 24 78 30 Z"' + sty({ fill: K.accent, stroke: 'none', opacity: 0.6 }) + '/>';
  return s;
};
DEC.chart = function () {
  var s = rect(10, 6, 80, 88, 1.2, K.bg) + hx('M10 6 L90 6 L90 94 L10 94 Z', 0.08), i, j;
  for (j = 0; j < 4; j++) for (i = 0; i < 5; i++) s += ln('M16 ' + (24 + j * 20 + i * 2.4) + ' L84 ' + (24 + j * 20 + i * 2.4), 0.35, 0.5);
  s += txt(16, 20, 'Dm7', 9) + txt(42, 20, 'G7', 9) + txt(64, 20, 'Cmaj7', 8);
  for (j = 0; j < 4; j++) s += ln('M50 ' + (24 + j * 20) + ' L50 ' + (33.6 + j * 20), 0.8);
  s += ln('M20 46 L26 50 M22 46 L28 50 M24 46 L30 50 M60 66 L66 70 M62 66 L68 70', 1.2);
  return s;
};
DEC.skyline = function () {
  var s = '';
  s += hx('M0 100 L0 64 L10 64 L10 54 L20 54 L20 70 L30 70 L30 60 L38 60 L38 100 Z', 0.3);
  s += hx('M62 100 L62 58 L72 58 L72 66 L84 66 L84 50 L94 50 L94 72 L100 72 L100 100 Z', 0.3);
  s += ln('M0 64 L10 64 L10 54 L20 54 L20 70 L30 70 L30 60 L38 60 L38 100 M62 100 L62 58 L72 58 L72 66 L84 66 L84 50 L94 50 L94 72 L100 72', 1);
  var t = 'M44 100 L44 84 L42 82 L56 82 L54 84 L54 100 ';
  for (var k = 0; k < 7; k++) { var y = 82 - k * 9; t += 'M43 ' + y + ' L41 ' + (y - 9) + ' L57 ' + (y - 9) + ' L55 ' + y + ' '; }
  t += 'M46 19 L46 12 L52 12 L52 19 M49 12 L49 0';
  s += wsh('M41 19 L57 19 L57 100 L41 100 Z', K.blue, 0.25) + ln(t, 1);
  return s;
};
DEC.tree = function () {
  return wsh(blob(50, 38, 32, 1), K.blue, 0.22) + ln(blob(50, 38, 32, 1), 1.1) + hx(blob(46, 44, 20, 1), 0.3) + ln('M50 62 L50 98 M50 78 L40 66 M50 72 L62 60', 1.6);
};
DEC.lawn = function () {
  var s = ln('M0 70 C30 64 70 64 100 70', 1.1), i;
  for (i = 0; i < 16; i++) s += ln('M' + (4 + i * 6) + ' ' + (78 + (i % 3) * 5) + ' l2 -5 l2 5', 0.7, 0.6);
  return s;
};
DEC.crowd = function () {
  var s = '', i, x;
  for (i = 0; i < 9; i++) { x = 6 + i * 11; s += ccl(x, 62 + (i % 2) * 4, 4.6, 1, K.bg) + ln('M' + (x - 7) + ' 100 C' + (x - 7) + ' ' + (74 + (i % 2) * 4) + ' ' + (x + 7) + ' ' + (74 + (i % 2) * 4) + ' ' + (x + 7) + ' 100', 1.1); }
  s += ln('M28 60 L22 42 M72 62 L78 44', 1.1);
  return s;
};
DEC.tent = function () {
  return wsh('M6 36 L50 8 L94 36 Z', K.accent, 0.3) + ln('M6 36 L50 8 L94 36 Z', 1.3) + ln('M10 36 L10 96 M90 36 L90 96', 1.3) + ln('M6 36 C20 44 36 44 50 36 C64 44 80 44 94 36', 1) + ln('M4 96 L96 96', 1.2);
};
SCENES.band = function (c) { return pl(DEC.spot(), c - 116, -4, 96) + pl(DEC.spot(), c + 22, -4, 96) + pl(INST.piano(), c - 118, 32, 64) + pl(INST.sax(), c - 56, 0, 88, -4) + pl(INST.trumpet(), c + 2, 22, 48, -14) + pl(INST.bass(), c + 30, 2, 82) + pl(INST.drums(), c + 72, 36, 48) + ground(c); };
SCENES.listen = function (c) { return pl(DEC.vinyl(), c - 116, 4, 82) + pl(DEC.phones(), c - 24, 0, 84) + pl(INST.notes(), c + 52, 4, 74) + ground(c); };
SCENES.comping = function (c) { return pl(DEC.lamp(), c - 120, -6, 64) + pl(INST.piano(), c - 92, 30, 66) + pl(DEC.chart(), c - 18, 6, 72) + pl(INST.guitar('archtop'), c + 44, 0, 90, 8) + ground(c); };
SCENES.decline = function (c) { return pl(DEC.lamp(), c - 116, -6, 60) + pl(DEC.chairs(), c - 110, 26, 62) + pl(INST.mic(), c - 34, 4, 82) + pl(DEC.phone(), c + 50, 4, 82) + ground(c); };
SCENES['live-taipei'] = function (c) { return pl(DEC.skyline(), c - 120, -8, 98) + pl(DEC.spot(), c - 30, -4, 70) + pl(INST.sax(), c - 22, 10, 66) + pl(DEC.crowd(), c + 24, -6, 92) + ground(c); };
SCENES['live-taichung'] = function (c) { return pl(DEC.tree(), c - 120, 0, 84) + pl(DEC.tent(), c - 50, 6, 88) + pl(INST.guitar('archtop'), c - 34, 30, 52) + pl(DEC.tree(), c + 44, 8, 60) + pl(DEC.lawn(), c + 36, 30, 80) + ground(c); };
SCENES.library = function (c) { return pl(DEC.phone(), c - 110, 2, 86) + pl(DEC.phone(), c - 50, 8, 74, 8) + pl(DEC.board(), c + 24, 4, 82) + ground(c); };

/* ---------- bilateral mind map (root in the middle, branches left/right) ---------- */
function mmTextW(s, fs) {
  var w = 0;
  Array.from(String(s)).forEach(function (ch) { w += ch.charCodeAt(0) > 0x2e80 ? fs : fs * 0.56; });
  return w;
}
function mmEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function mindmap(data, o) {
  o = o || {};
  var LH = o.LH || 34, GAP = o.GAP || 22, TOP = o.TOP || 40, BOT = o.BOT || 40, M = o.M || 24;
  var fsLeaf = o.fsLeaf || 17, fsSub = o.fsSub || 12.5, fsBr = o.fsBr || 19;
  var P = o.P, cols = o.colors;
  var dxB = o.dxB || 150, dxL = o.dxL || 70;
  function bw(b) { return Math.max(mmTextW(b.label, fsBr), mmTextW(b.sub || '', fsSub)) + 32; }
  function lw(l) { return mmTextW(l.t, fsLeaf) * 1.04 + (l.s ? 8 + mmTextW(l.s, fsSub) : 0) + 4; }
  function ext(brs) { return brs.reduce(function (m, b) { var lm = b.leaves.reduce(function (a, l) { return Math.max(a, lw(l)); }, 0); return Math.max(m, dxB + bw(b) + (b.leaves.length ? dxL + lm : 0)); }, 160); }
  var eL = ext(data.left), eR = ext(data.right);
  var cx = M + eL, W = Math.max(o.W || 0, cx + eR + M);
  function sideH(brs) { return brs.reduce(function (h, b) { return h + Math.max(1, b.leaves.length) * LH; }, 0) + GAP * Math.max(0, brs.length - 1); }
  var hR = sideH(data.right), hL = sideH(data.left), inner = Math.max(hR, hL, 260);
  var H = TOP + inner + BOT, cy = TOP + inner / 2;
  var links = '', nodes = '';
  function side(brs, dir, h) {
    var y = cy - h / 2;
    brs.forEach(function (b) {
      var n = Math.max(1, b.leaves.length), blockH = n * LH, by = y + blockH / 2, col = cols[b.c % cols.length];
      var w = bw(b), bh = b.sub ? 54 : 40;
      var near = cx + dir * dxB, bx0 = dir > 0 ? near : near - w, far = dir > 0 ? near + w : near - w;
      links += '<path d="M' + cx + ' ' + cy + ' C' + (cx + dir * dxB * 0.6) + ' ' + cy + ' ' + (cx + dir * dxB * 0.4) + ' ' + by + ' ' + near + ' ' + by + '" style="fill:none;stroke:' + col + ';stroke-width:4;stroke-linecap:round"/>';
      nodes += '<g class="mm-br"' + (b.go ? ' data-go="' + b.go + '" style="cursor:pointer"' : '') + '><rect x="' + bx0 + '" y="' + (by - bh / 2) + '" width="' + w + '" height="' + bh + '" rx="10" style="fill:' + P.surface + ';stroke:' + col + ';stroke-width:2.5"/>' +
        '<text x="' + (bx0 + w / 2) + '" y="' + (by + (b.sub ? -3 : 6.5)) + '" text-anchor="middle" style="fill:' + P.ink + ';font-size:' + fsBr + 'px;font-weight:700;font-family:' + P.fontD + '">' + mmEsc(b.label) + '</text>' +
        (b.sub ? '<text x="' + (bx0 + w / 2) + '" y="' + (by + 17) + '" text-anchor="middle" style="fill:' + P.muted + ';font-size:' + fsSub + 'px;font-family:' + P.fontB + '">' + mmEsc(b.sub) + '</text>' : '') + '</g>';
      var lx = far + dir * dxL;
      b.leaves.forEach(function (l, i) {
        var ly = y + LH * i + LH / 2;
        links += '<path d="M' + far + ' ' + by + ' C' + (far + dir * dxL * 0.5) + ' ' + by + ' ' + (far + dir * dxL * 0.5) + ' ' + ly + ' ' + (lx - dir * 10) + ' ' + ly + '" style="fill:none;stroke:' + col + ';stroke-width:1.6;opacity:.75"/>';
        var anchor = dir > 0 ? 'start' : 'end', tx = lx + dir * 2;
        var main = '<tspan style="fill:' + P.ink + ';font-size:' + fsLeaf + 'px;font-weight:600">' + mmEsc(l.t) + '</tspan>';
        var sub = l.s ? '<tspan dx="8" style="fill:' + P.muted + ';font-size:' + fsSub + 'px;font-weight:400">' + mmEsc(l.s) + '</tspan>' : '';
        var subL = l.s ? '<tspan style="fill:' + P.muted + ';font-size:' + fsSub + 'px;font-weight:400">' + mmEsc(l.s) + '</tspan>' : '';
        nodes += '<g class="mm-leaf"' + (l.go ? ' data-go="' + l.go + '" style="cursor:pointer"' : '') + '>' +
          '<circle cx="' + (lx - dir * 10) + '" cy="' + ly + '" r="4" style="fill:' + col + ';stroke:' + P.surface + ';stroke-width:2"/>' +
          '<text x="' + tx + '" y="' + (ly + 5.5) + '" text-anchor="' + anchor + '" style="font-family:' + P.fontB + '">' + (dir > 0 ? main + sub : subL + (l.s ? main.replace('<tspan ', '<tspan dx="8" ') : main)) + '</text></g>';
      });
      y += blockH + GAP;
    });
  }
  side(data.right, 1, hR);
  side(data.left, -1, hL);
  var rw = Math.max(mmTextW(data.title, 26), mmTextW(data.sub || '', 13)) + 44, rh = data.sub ? 74 : 56;
  var root = '<g class="mm-root"><rect x="' + (cx - rw / 2) + '" y="' + (cy - rh / 2) + '" width="' + rw + '" height="' + rh + '" rx="14" style="fill:' + P.ink + '"/>' +
    '<text x="' + cx + '" y="' + (cy + (data.sub ? -4 : 9)) + '" text-anchor="middle" style="fill:' + P.bg + ';font-size:26px;font-weight:900;font-family:' + P.fontD + '">' + mmEsc(data.title) + '</text>' +
    (data.sub ? '<text x="' + cx + '" y="' + (cy + 21) + '" text-anchor="middle" style="fill:' + P.bg + ';opacity:.75;font-size:13px;font-family:' + P.fontB + '">' + mmEsc(data.sub) + '</text>' : '') + '</g>';
  return { svg: '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="' + mmEsc(data.aria || data.title) + '" xmlns="http://www.w3.org/2000/svg">' + links + nodes + root + '</svg>', W: W, H: H };
}
function jazzMapData() {
  var order = { roots: 0, swing: 1, bebop: 2, free: 3, '50s': 4, fusion: 5 };
  var label = { roots: ['起源', '1890s–1910s・散拍與紐奧良'], swing: ['搖擺', '1920s–1930s・大樂團'], bebop: ['Bebop', '1940s・聆聽的藝術'],
    '50s': ['1950s 分流', '酷派・硬咆勃・調式'], free: ['自由', '1960s・Free Jazz・Bossa'], fusion: ['融合', '1970s–今・電氣化與 Neo-Soul'] };
  var goE = { roots: 'era-roots', swing: 'era-swing', bebop: 'era-bebop', '50s': 'era-50s', free: 'era-free', fusion: 'fusion' };
  function br(id) {
    var ppl = PEOPLE.filter(function (p) { return p.era === id; });
    return { label: label[id][0], sub: label[id][1], c: order[id], go: goE[id],
      leaves: ppl.map(function (p) { return { t: p.zh.replace('Neo-Soul 新生代', p.en || p.zh), s: p.zh.indexOf('Neo-Soul') === 0 ? '吉他' : (p.en || p.instr), go: 'person-' + p.id }; }) };
  }
  return { title: '爵士樂百年', sub: '6 個年代・' + PEOPLE.length + ' 位樂手', aria: '爵士樂百年心智圖：6 個年代與各年代代表樂手',
    right: ['roots', 'swing', 'bebop', 'free'].map(br), left: ['50s', 'fusion'].map(br) };
}
/* ---------- more maps: Miles tree + entry map ---------- */
function milesMapData() {
  function L(t, s, go) { return go ? { t: t, s: s, go: go } : { t: t, s: s }; }
  return {
    title: '邁爾士·戴維斯', sub: '一個樂團，養出半部爵士史', aria: '邁爾士·戴維斯的樂團成員與他們後來開創的方向',
    right: [
      { label: '第一個大五重奏', sub: '1955–1959・硬咆勃到調式', c: 0, go: 'person-miles', leaves: [
        L('約翰·柯川', '次中音薩克斯風 → 《A Love Supreme》', 'person-coltrane'),
        L('坎農鮑·艾德利', 'Cannonball Adderley・中音薩克斯風'),
        L('比爾·艾文斯', '鋼琴 → 鋼琴三重奏', 'person-evans'),
        L('紅·嘉蘭', 'Red Garland・鋼琴'),
        L('保羅·錢伯斯', 'Paul Chambers・貝斯'),
        L('費利·喬·瓊斯', 'Philly Joe Jones・鼓') ] },
      { label: '第二個大五重奏', sub: '1964–1968・自由與結構之間', c: 1, leaves: [
        L('韋恩·蕭特', 'Wayne Shorter・薩克斯風 → Weather Report'),
        L('賀比·漢考克', '鋼琴 → 《Head Hunters》放克', 'person-hancock'),
        L('朗·卡特', 'Ron Carter・貝斯'),
        L('東尼·威廉斯', 'Tony Williams・鼓 → Lifetime') ] }
    ],
    left: [
      { label: '電氣時期', sub: '1968–1975・Bitches Brew 錄音群', c: 5, go: 'fusion', leaves: [
        L('約翰·麥克勞林', '吉他 → Mahavishnu Orchestra', 'person-mclaughlin'),
        L('奇克·柯瑞亞', '電鋼琴 → Return to Forever', 'person-corea'),
        L('喬·薩溫努', 'Joe Zawinul・鍵盤 → Weather Report'),
        L('奇斯·傑瑞', 'Keith Jarrett・鍵盤 → 《The Köln Concert》'),
        L('戴夫·霍蘭', 'Dave Holland・貝斯'),
        L('傑克·狄強奈', 'Jack DeJohnette・鼓') ] },
      { label: '復出時期', sub: '1981–1991・流行與放克', c: 3, leaves: [
        L('麥克·史登', '吉他', 'person-stern'),
        L('約翰·史考菲', '吉他', 'person-scofield'),
        L('馬克斯·米勒', 'Marcus Miller・貝斯 → 製作《Tutu》'),
        L('肯尼·蓋瑞特', 'Kenny Garrett・中音薩克斯風') ] }
    ]
  };
}
function entryMapData() {
  function L(t, s, go) { return go ? { t: t, s: s, go: go } : { t: t, s: s }; }
  return {
    title: '你平常聽什麼？', sub: '從你熟悉的音樂走進爵士', aria: '爵士入坑地圖：依平常聽的音樂類型推薦入門曲目',
    right: [
      { label: '嘻哈・Lo-fi', sub: '喜歡取樣與鬆的律動', c: 0, leaves: [
        L('Cantaloupe Island', 'Herbie Hancock・Us3 取樣過', 'std-cantaloupe'),
        L('Black Radio', 'Robert Glasper・爵士 × 嘻哈 × R&B', 'fusion'),
        L('Peace Piece', 'Bill Evans・Lo-fi 的氛圍', 'person-evans') ] },
      { label: '流行・抒情', sub: '喜歡好聽的旋律和人聲', c: 4, leaves: [
        L('Bewitched', 'Laufey・Z 世代的爵士入口', 'decline'),
        L('Come Away with Me', 'Norah Jones・Blue Note 發行'),
        L('My Funny Valentine', 'Chet Baker・輕聲唱', 'person-chet'),
        L('Summertime', 'Ella & Louis《Porgy and Bess》', 'std-summertime') ] },
      { label: 'R&B・Neo-Soul', sub: '喜歡和弦色彩與律動', c: 6, leaves: [
        L('Chameleon', 'Herbie Hancock・放克爵士', 'std-chameleon'),
        L('Isaiah Sharkey', '吉他・Neo-Soul 和弦', 'person-sharkey'),
        L('Mateus Asato', '吉他・IG 世代', 'person-asato') ] },
      { label: '拉丁・巴西', sub: '喜歡節奏與溫度', c: 2, leaves: [
        L('The Girl from Ipanema', 'Getz / Gilberto・Bossa Nova', 'std-ipanema'),
        L('Blue Bossa', 'Kenny Dorham', 'std-bluebossa'),
        L('Manteca', 'Dizzy Gillespie・非裔古巴爵士', 'person-dizzy') ] }
    ],
    left: [
      { label: '吉他・搖滾', sub: '喜歡 Solo 和吉他音色', c: 1, leaves: [
        L('Full House', 'Wes Montgomery・八度音奏法', 'person-wes'),
        L('Room 335', 'Larry Carlton・藍調加爵士', 'std-room335'),
        L('Bright Size Life', 'Pat Metheny', 'std-brightsize'),
        L('Breezin\'', 'George Benson', 'person-benson') ] },
      { label: '金屬・前衛', sub: '喜歡技巧與複雜節奏', c: 5, leaves: [
        L('The Inner Mounting Flame', 'Mahavishnu Orchestra', 'person-mclaughlin'),
        L('Allan Holdsworth', 'Legato 與怪和弦', 'person-holdsworth'),
        L('Take Five', 'Dave Brubeck Quartet・5/4 拍', 'std-takefive'),
        L('Guthrie Govan', '吉他・技巧派', 'person-govan') ] },
      { label: '古典・配樂', sub: '喜歡氛圍與編曲', c: 3, leaves: [
        L('So What', 'Miles Davis・《Kind of Blue》', 'std-sowhat'),
        L('Waltz for Debby', 'Bill Evans Trio', 'person-evans'),
        L('Mood Indigo', 'Duke Ellington・樂團音色', 'std-indigo') ] }
    ]
  };
}
