/* one entry per sentence. c = big card, a = art spec, s = sound effects [name, local t] */
var EPS = [
 { key:'KolnConcert壞掉的鋼琴', title:'壞掉的鋼琴', mood:'koln', sc:[
  {c:'<span class="acc">1975</span><br>科隆 晚上11:30', a:{fx:'year',v:1975}, s:[['crowd',0],['clock',1.2]]},
  {c:'指定要<br><span class="acc">大鋼琴</span>', a:{fx:'grand',t:'IMPERIAL'}, s:[['chord',0.5]]},
  {c:'來的是<br><span class="acc">壞掉的小鋼琴</span>', a:{fx:'badpiano'}, s:[['sour',0.5],['sour',2.2],['clunk',4.0]]},
  {c:'差點<br><span class="acc">轉身就走</span>', a:{fx:'moon'}, s:[['door',1.6]]},
  {c:'不到二十歲的<br><span class="acc">主辦人</span>', a:{fx:'bubble',t:'拜託！'}, s:[['pop',0.6]]},
  {c:'左手<br><span class="acc">一直重複</span>', a:{fx:'loop',t:'左手'}, s:[['chord',0.2],['chord',1.2],['chord',2.2]]},
  {c:'沒有譜<br><span class="acc">全場即興</span>', a:{fx:'vinyl',t:'KÖLN',y:'1975'}, s:[['needle',0.3]]},
  {c:'<span class="acc">四百萬</span><br>張', a:{fx:'count',to:4000000,u:'張 · 史上最暢銷鋼琴專輯'}, s:[['coins',0.2],['ding',2.3]]},
  {c:'想想這台<br><span class="acc">壞掉的鋼琴</span>', a:{fx:'badpiano',calm:1}, s:[]}
 ]},
 { key:'SonnyRollins橋上練琴', title:'橋上練琴', mood:'calypso', sc:[
  {c:'<span class="acc">1959</span><br>突然消失', a:{fx:'fade'}, s:[['whoosh',0.8]]},
  {c:'Sonny<br><span class="acc">Rollins</span>', a:'i:sax', s:[['ding',0.4]]},
  {c:'對自己<br><span class="acc">不滿意</span>', a:{fx:'stamp',t:'暫停'}, s:[['stamp',0.6]]},
  {c:'怕吵到<br><span class="acc">鄰居</span>', a:{fx:'noise',t:'嘘…'}, s:[['hush',0.3]]},
  {c:'走上<br><span class="acc">大橋</span>', a:{fx:'bridge'}, s:[['wind',0],['train',1.0]]},
  {c:'春夏秋冬<br><span class="acc">十五、十六小時</span>', a:{fx:'seasons'}, s:[['tick',0.2],['tick',0.8],['tick',1.4],['tick',2.0]]},
  {c:'火車經過<br><span class="acc">沒人管他</span>', a:{fx:'bridge',train:1}, s:[['train',0]]},
  {c:'1962<br><span class="acc">The Bridge</span>', a:{fx:'vinyl',t:'THE BRIDGE',y:'1962'}, s:[['needle',0.3]]},
  {c:'今年五月<br><span class="acc">九十五歲過世</span>', a:{fx:'spot',dim:1}, s:[]},
  {c:'想想<br><span class="acc">那座橋</span>', a:{fx:'bridge'}, s:[['wind',0]]}
 ]},
 { key:'Goodman卡內基1938', title:'卡內基的搖擺夜', mood:'toms', sc:[
  {c:'<span class="acc">1938</span><br>卡內基音樂廳', a:{fx:'hall',t:'CARNEGIE HALL'}, s:[['crowd',0]]},
  {c:'門票<br><span class="acc">賣光了</span>', a:{fx:'stamp',t:'售罄'}, s:[['stamp',0.8]]},
  {c:'更大膽的是<br><span class="acc">台上的人</span>', a:{fx:'question'}, s:[['pop',0.4]]},
  {c:'黑人和白人<br><span class="acc">同台</span>', a:{fx:'duo'}, s:[['applause',0.8]]},
  {c:'種族隔離的<br><span class="acc">年代</span>', a:{fx:'duo',bar:1}, s:[['hush',0.3]]},
  {c:'Sing, Sing,<br><span class="acc">Sing</span>', a:'i:drums', s:[['drumfill',0.3],['bigapplause',1.6]]},
  {c:'錄音在<br><span class="acc">衣櫃裡</span>', a:{fx:'closet'}, s:[['door',0.5]]},
  {c:'<span class="acc">百萬</span><br>專輯', a:{fx:'count',to:1000000,u:'張 · 1950 發行'}, s:[['coins',0.2],['ding',2.2]]},
  {c:'想想<br><span class="acc">那一晚</span>', a:{fx:'hall',t:'1938.1.16'}, s:[['applause',0.4]]}
 ]},
 { key:'Newport1956二十七段獨奏', title:'二十七段獨奏', mood:'blues', sc:[
  {c:'<span class="acc">1956</span><br>新港', a:{fx:'year',v:1956}, s:[['crowd',0]]},
  {c:'Ellington<br><span class="acc">走下坡</span>', a:{fx:'decline'}, s:[['sour',1.0]]},
  {c:'交給<br><span class="acc">Gonsalves</span>', a:'i:sax', s:[['whoosh',0.3]]},
  {c:'一口氣<br><span class="acc">二十七段</span>', a:{fx:'choruses',n:27}, s:[['crowd',0.5]]},
  {c:'有人<br><span class="acc">站起來跳舞</span>', a:{fx:'girl',pose:'dance',dress:'#4a4a52',hair:'#e8c86a'}, s:[['bigapplause',1.0]]},
  {c:'登上<br><span class="acc">Time 封面</span>', a:{fx:'mag',t1:'TIME',t2:'1956.8.20',t3:'ELLINGTON',t4:''}, s:[['flash',0.5]]},
  {c:'對錯了<br><span class="acc">麥克風</span>', a:{fx:'wrongmic'}, s:[['pop',0.6],['buzz',1.4]]},
  {c:'只有<br><span class="acc">四成</span>是現場', a:{fx:'pie',p:0.4}, s:[['stamp',1.2]]},
  {c:'跟著數<br><span class="acc">二十七段</span>', a:{fx:'choruses',n:27,fast:1}, s:[]}
 ]},
 { key:'VanGelder客廳錄音室', title:'客廳錄音室', mood:'hardbop', sc:[
  {c:'在<span class="acc">客廳</span><br>錄的', a:{fx:'house'}, s:[['door',0.4]]},
  {c:'Hackensack<br><span class="acc">爸媽的家</span>', a:{fx:'house',label:'HACKENSACK, NJ'}, s:[['pin2',0.8]]},
  {c:'本業是<br><span class="acc">驗光師</span>', a:{fx:'eyechart'}, s:[['pop',0.5]]},
  {c:'客廳＋<br><span class="acc">控制室</span>', a:{fx:'console'}, s:[['switch',0.5],['switch',1.0]]},
  {c:'Blue Note<br><span class="acc">幾乎都他錄</span>', a:{fx:'records'}, s:[['needle',0.3]]},
  {c:'Monk 的<br><span class="acc">Hackensack</span>', a:'i:piano', s:[['chord',0.4]]},
  {c:'有人拍照<br><span class="acc">麥克風移開</span>', a:{fx:'camera'}, s:[['flash',0.4],['whoosh',1.2]]},
  {c:'<span class="acc">1959</span><br>才搬家', a:{fx:'year',v:1959}, s:[['ding',1.4]]},
  {c:'想像<br><span class="acc">那間客廳</span>', a:{fx:'house',warm:1}, s:[]}
 ]},
 { key:'GiantSteps卡住的鋼琴', title:'最可怕的曲子', mood:'coltrane', sc:[
  {c:'最讓人<br><span class="acc">害怕</span>的曲子', a:{fx:'question'}, s:[['heartbeat',0.2]]},
  {c:'Giant<br><span class="acc">Steps</span>', a:{fx:'vinyl',t:'GIANT STEPS',y:'1959'}, s:[['needle',0.3]]},
  {c:'三個調<br><span class="acc">一直跳</span>', a:{fx:'steps'}, s:[['pop',0.3],['pop',0.9],['pop',1.5]]},
  {c:'鋼琴手<br><span class="acc">Flanagan</span>', a:'i:piano', s:[['chord',0.4]]},
  {c:'斷斷續續<br><span class="acc">找路</span>', a:{fx:'lost',inst:'piano'}, s:[['sour',0.5],['sour',1.8]]},
  {c:'沒機會<br><span class="acc">準備</span>', a:{fx:'stamp',t:'直接上場'}, s:[['stamp',0.6]]},
  {c:'卡卡的<br><span class="acc">留在經典裡</span>', a:{fx:'vinyl',t:'GIANT STEPS',y:'1959'}, s:[]},
  {c:'<span class="acc">1982</span><br>Giant Steps', a:{fx:'vinyl',t:'FLANAGAN',y:'1982'}, s:[['needle',0.3]]},
  {c:'獻給<br><span class="acc">Coltrane</span>', a:'i:sax', s:[['shimmer',0.3]]},
  {c:'注意<br><span class="acc">鋼琴那段</span>', a:{fx:'steps'}, s:[]}
 ]},
 { key:'WesMontgomery大拇指', title:'大拇指的吉他手', mood:'wes', sc:[
  {c:'不用彈片<br><span class="acc">用大拇指</span>', a:{fx:'thumb'}, s:[['pluck',0.6]]},
  {c:'Wes<br><span class="acc">Montgomery</span>', a:'i:guitar', s:[['strum',0.3]]},
  {c:'聽到<br><span class="acc">Charlie Christian</span>', a:{fx:'vinyl',t:'CHRISTIAN',y:'1940s'}, s:[['needle',0.3]]},
  {c:'一個音<br><span class="acc">一個音模仿</span>', a:{fx:'notesflow'}, s:[['pluck',0.4],['pluck',0.9],['pluck',1.4]]},
  {c:'白天工廠<br><span class="acc">深夜練琴</span>', a:{fx:'daynight'}, s:[['clang',0.4]]},
  {c:'太吵<br><span class="acc">被抱怨</span>', a:{fx:'noise',t:'太吵了！'}, s:[['knock',0.4]]},
  {c:'改用<br><span class="acc">大拇指</span>', a:{fx:'thumb',pick:1}, s:[['pluck',1.2]]},
  {c:'更喜歡<br><span class="acc">拇指的音色</span>', a:{fx:'thumb'}, s:[['pluck',0.5]]},
  {c:'招牌<br><span class="acc">八度</span>', a:{fx:'octave'}, s:[['pluck',0.5],['pluck',1.0]]},
  {c:'那個<br><span class="acc">溫暖的聲音</span>', a:'i:guitar', s:[['strum',0.4]]}
 ]},
 { key:'ChetBaker重新學吹', title:'重新學吹小號', mood:'chet', sc:[
  {c:'牙齒和嘴唇<br><span class="acc">就是一切</span>', a:'i:trumpet', s:[['shimmer',0.3]]},
  {c:'<span class="acc">1966</span><br>演出後被打', a:{fx:'year',v:1966}, s:[['hit',2.0]]},
  {c:'西岸<br><span class="acc">最紅小號手</span>', a:{fx:'spot'}, s:[['applause',0.4]]},
  {c:'掉了<br><span class="acc">幾顆牙</span>', a:{fx:'teeth'}, s:[['hit',0.3]]},
  {c:'只能裝<br><span class="acc">假牙</span>', a:{fx:'teeth',fake:1}, s:[['pop',0.6]]},
  {c:'<span class="acc">重新學</span><br>吹小號', a:{fx:'stamp',t:'從頭學'}, s:[['sour',0.5]]},
  {c:'據說去<br><span class="acc">加油站</span>', a:{fx:'gas'}, s:[['ding',0.6]]},
  {c:'其實<br><span class="acc">還有錄音</span>', a:{fx:'truefalse',a:'加油站',b:'沒錄音',l1:'據說',l2:'不對'}, s:[['stamp',0.5],['stamp',1.5]]},
  {c:'<span class="acc">1973</span><br>回到紐約', a:{fx:'year',v:1973}, s:[['ding',1.4]]},
  {c:'重新<br><span class="acc">學會吹</span>', a:'i:trumpet', s:[]}
 ]},
 { key:'jazz這個字來自棒球', title:'jazz 來自棒球', mood:'hot', sc:[
  {c:'jazz<br>最早是<span class="acc">棒球</span>', a:{fx:'curve'}, s:[['bat',0.8],['crowd',1.0]]},
  {c:'<span class="acc">1912</span><br>洛杉磯時報', a:{fx:'news',t:'BEN\'S JAZZ CURVE',y:'1912.4.2'}, s:[['paper',0.4]]},
  {c:'會亂飄的<br><span class="acc">jazz ball</span>', a:{fx:'curve',wild:1}, s:[['whoosh',0.4]]},
  {c:'最早印在<br><span class="acc">報紙上</span>', a:{fx:'news',t:'JAZZ',y:'1912'}, s:[['stamp',0.8]]},
  {c:'<span class="acc">1913</span><br>活力、帶勁', a:{fx:'year',v:1913}, s:[['pop',1.4]]},
  {c:'<span class="acc">1915</span><br>才形容音樂', a:{fx:'notesflow'}, s:[['ding',0.6]]},
  {c:'jass<br><span class="acc">jas</span>', a:{fx:'spell'}, s:[['pop',0.3],['pop',0.9],['pop',1.5]]},
  {c:'二十世紀<br><span class="acc">代表字</span>', a:{fx:'trophy'}, s:[['bigapplause',0.2]]},
  {c:'那場比賽<br><span class="acc">輸了</span>', a:{fx:'stamp',t:'輸了'}, s:[['stamp',0.6]]},
  {c:'那顆<br><span class="acc">亂飄的曲球</span>', a:{fx:'curve',wild:1}, s:[['bat',0.6]]}
 ]}
];
