const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const toastEl = document.getElementById('toast');
const W = 960, H = 720, FIELD_TOP = 100, FIELD_BOTTOM = 625;
const $ = (selector) => document.querySelector(selector);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const COLORS = {fire:'#d46a3b', ice:'#8aaeb8', volt:'#d5aa50'};
const ELEMENTS = ['fire','ice','volt'];
const WORLDS = [
  {name:'RAIN CITY',sub:'비가 내리는 해안 도시',color:'#b7a081',accent:'#bf7959',weather:'rain',boss:'GATE KEEPER'},
  {name:'FROST LINE',sub:'눈 덮인 북부 철도 마을',color:'#93b4c1',accent:'#778fa5',weather:'snow',boss:'ICE GOLEM'},
  {name:'STORM CORE',sub:'폭풍 구름 위의 관측소',color:'#a5a6b7',accent:'#c5a477',weather:'storm',boss:'THUNDER BIRD'},
  {name:'MAGMA GRID',sub:'화산 지대의 낡은 기지',color:'#bb7958',accent:'#c9a072',weather:'ash',boss:'MAGMA CORE'},
  {name:'COSMOS',sub:'고요한 궤도 관측소',color:'#ac9bb5',accent:'#c6b496',weather:'meteor',boss:'VOID HEART'}
];
// Each row is eleven cells. Empty cells are intentional lanes for the ball.
const STAGES = [
  [
    {name:'빗속의 거리',hint:'기본 벽돌과 폭탄으로 조작을 익히세요.',rows:['..NNNNNNN..','.NHHNNNHHN.','NNNBN$NBNNN','.NNHHHHHNN.','..NNNNNNN..']},
    {name:'철문 지구',hint:'철갑은 VOLT에 약합니다. 비가 오면 체인이 더 멀리 번집니다.',rows:['..SSN.NSS..','.NHSNSNSHN.','NBNNN$NNNBN','.NHSNSNSHN.','..SSN.NSS..','...NNNNN...']},
    {name:'관문 회로',hint:'폭탄 뒤의 철갑을 열고 중앙의 보너스 벽돌을 노리세요.',rows:['...SSSSS...','..SBN.NBS..','.NSHNNNHSN.','NNNBN$NBNNN','.NSHNNNHSN.','...NNNNN...']}
  ],
  [
    {name:'설원 진입',hint:'얼음 벽돌은 FIRE로 빠르게 녹일 수 있습니다.',rows:['..IIIIIII..','.NNIHHHINN.','NININ$NININ','.NNIHHHINN.','..IIIIIII..']},
    {name:'미끄러운 선로',hint:'움직이는 벽돌을 ICE로 잠시 멈추세요.',rows:['..MNMNMNM..','.IINNNNNII.','NNMHH$HHMNN','.IINNNNNII.','..MNMNMNM..','...NNNNN...']},
    {name:'빙결 격자',hint:'얼음 열은 FIRE, 움직이는 열은 ICE가 유리합니다.',rows:['..IIMMMII..','.NINM$NIN..','NINIMIMININ','.NINM$NIN..','..IIMMMII..','...NNNNN...']}
  ],
  [
    {name:'구름 위 회로',hint:'전도체 벽돌에는 VOLT 체인이 강력합니다.',rows:['..CCCCCCC..','.NCHHHHCN..','NCNCN$NCNCN','.NCHHHHCN..','..CCCCCCC..']},
    {name:'바람의 통로',hint:'폭풍의 바람은 공 궤적을 조금씩 바꿉니다.',rows:['..MCC.CCM..','.NCCNNNCCN.','NNBCN$NCBNN','.NCCNNNCCN.','..MCC.CCM..','...NNNNN...']},
    {name:'전도 격자',hint:'중앙 전도체를 VOLT로 맞혀 양옆을 연쇄 파괴하세요.',rows:['...CCCCC...','..NCC$CCN..','.MNCCHCCNM.','NNCBC$CBCNN','.MNCCHCCNM.','...NNNNN...']}
  ],
  [
    {name:'화산 전초기지',hint:'용암 벽돌은 ICE에 약하고 FIRE를 버팁니다.',rows:['..LLLLLLL..','.NLHHHLHN..','NLNLN$NLNLN','.NLHHHLHN..','..LLLLLLL..']},
    {name:'화구 통로',hint:'재가 몰려오면 낙하 파편을 피하세요.',rows:['..LNL.NLN..','.NLBN$BLN..','NLLHNNNHLLN','.NLBN$BLN..','..LNL.NLN..','...NNNNN...']},
    {name:'마그마 격벽',hint:'ICE로 용암 격벽을 깨고 중앙으로 진입하세요.',rows:['...LLLLL...','..LNN$NNL..','.NLHLLLHLN.','NLLBN$NBLLN','.NLHLLLHLN.','...NNNNN...']}
  ],
  [
    {name:'궤도 외곽',hint:'여러 속성 벽돌이 함께 등장합니다.',rows:['..SICLCIS..','.NSNHHHNLN.','NINCN$NCNIN','.NLNHHHNSN.','..LICSCIL..']},
    {name:'중력 관측소',hint:'폭풍과 유성우가 번갈아 공의 흐름을 바꿉니다.',rows:['..MCS.LCM..','.NSIC$CISN.','NLNCHHCNLNN','.NSIC$CISN.','..MCS.LCM..','...NNNNN...']},
    {name:'최종 교차로',hint:'FIRE·ICE·VOLT를 모두 바꿔 쓰며 보호선을 돌파하세요.',rows:['...SCLIS...','..ISCHHLSI.','.NCIL$LICN.','NLSCB$BCSLN','.NCIL$LICN.','...NNNNN...']}
  ]
];
const BRICK_LEGEND={N:'normal',H:'hard',S:'steel',B:'bomb','$':'bonus',I:'ice',C:'conductor',L:'lava',M:'moving'};
const BACKGROUND_PATHS=['world-1-city.png','world-2-frost.png','world-3-storm.png','world-4-magma.png','world-5-cosmos.png'];
const backgrounds=BACKGROUND_PATHS.map(name=>{const img=new Image();img.src=`./assets/${name}`;return img;});
const FRAMES = [
  {name:'STRIKER',icon:'◆',desc:'균형형 · 퍼펙트 리시브 판정 확대',ult:'OVERDRIVE'},
  {name:'GUARDIAN',icon:'⬡',desc:'수비형 · 넓은 패들과 자동 쉴드',ult:'BARRIER'},
  {name:'CASTER',icon:'✦',desc:'공격형 · 속성 체인 강화',ult:'METEOR'}
];
const CARD_POOL = [
  {id:'multi',name:'멀티볼',rarity:'common',icon:'◉',desc:'공을 추가로 발사합니다.'},
  {id:'pierce',name:'관통',rarity:'common',icon:'➤',desc:'공이 벽돌을 관통합니다.'},
  {id:'power',name:'파워',rarity:'common',icon:'✦',desc:'벽돌 타격 피해가 증가합니다.'},
  {id:'blast',name:'폭발',rarity:'common',icon:'✹',desc:'벽돌 파괴 시 주변에도 피해를 줍니다.'},
  {id:'split',name:'분열',rarity:'rare',icon:'❖',desc:'벽돌 파괴 시 작은 공이 생길 수 있습니다.'},
  {id:'heavy',name:'헤비 볼',rarity:'rare',icon:'●',desc:'공은 느려지지만 피해가 강해집니다.'},
  {id:'element',name:'속성 증폭',rarity:'rare',icon:'⌁',desc:'속성 효과와 상성 피해가 강해집니다.'},
  {id:'rescue',name:'위기 탈출',rarity:'epic',icon:'⛨',desc:'스테이지마다 낙하를 막아줍니다.'},
  {id:'dual',name:'이중 속성',rarity:'epic',icon:'◇',desc:'속성 전환 쿨다운이 감소합니다.'}
];
const storeKey = 'brick-shift-v1';
let save = {best:0,unlocked:1};
try { save = {...save,...JSON.parse(localStorage.getItem(storeKey) || '{}')}; } catch {}
const persist = () => { try {localStorage.setItem(storeKey,JSON.stringify(save));} catch {} };

let phase = 'menu', selectedWorld = 0, selectedFrame = 0, game = null;
let lastTime = 0, accumulator = 0, globalTime = 0, toastTimeout;
const keys = new Set();
const input = {mouseX:W/2,mouseActive:false,left:false,right:false};

function toast(message, ms=1700) {
  toastEl.textContent = message; toastEl.classList.add('show');
  clearTimeout(toastTimeout); toastTimeout = setTimeout(()=>toastEl.classList.remove('show'),ms);
}
function showOverlay(html) {overlay.innerHTML=html;overlay.classList.add('active');}
function hideOverlay() {overlay.innerHTML='';overlay.classList.remove('active');}
function button(label,action,secondary=false) {return `<button class="button ${secondary?'secondary':''}" data-action="${action}">${label}</button>`;}

function menu() {
  phase='menu'; game=null;
  showOverlay(`<div class="panel menu-panel">
    <div class="eyebrow">AN ELEMENTAL ARCADE GAME</div><h1>BRICK <span>SHIFT</span></h1>
    <p class="subtitle">속성을 갈아 끼우고, 날씨를 무기로 삼아 벽돌을 부수세요.<br>한 월드에 일반 스테이지 3개와 보스전이 기다립니다.</p>
    <div class="eyebrow">SELECT WORLD</div><div class="world-tabs">${WORLDS.map((w,i)=>`<button class="world-tab ${selectedWorld===i?'active':''}" data-world="${i}" ${i>=save.unlocked?'disabled':''}>${String(i+1).padStart(2,'0')} ${w.name}</button>`).join('')}</div>
    <p class="muted" id="worldDescription">${WORLDS[selectedWorld].sub}</p>
    <div class="eyebrow" style="margin-top:20px">SELECT FRAME</div><div class="choice-row">${FRAMES.map((f,i)=>`<button class="choice ${i===selectedFrame?'selected':''} ${i===1&&save.unlocked<2||i===2&&save.unlocked<3?'locked':''}" data-frame="${i}" ${i===1&&save.unlocked<2||i===2&&save.unlocked<3?'disabled':''}><span class="icon">${f.icon}</span><strong>${f.name}</strong><small>${f.desc}${i>0&&save.unlocked<i+1?' · 월드 클리어로 해금':''}</small></button>`).join('')}</div>
    ${button('게임 시작 ↗','start')}<div class="mini">최고 점수 ${save.best.toLocaleString()} · 처음엔 SPACE 또는 클릭으로 공 발사</div>
  </div>`);
}

function createGame() {
  game={world:selectedWorld,stage:0,frame:selectedFrame,score:0,lives:3,combo:0,comboTimer:0,ult:0,evolution:0,evoNeed:20,cardCount:0,cards:{},balls:[],bricks:[],particles:[],drops:[],hazards:[],paddle:{x:W/2,y:593,w:selectedFrame===1?126:106,h:14,shield:selectedFrame===1?1:0},element:'fire',shiftCooldown:0,weather:'clear',weatherAt:16,weatherUntil:0,weatherWarn:0,weatherNext:'',time:0,stageTime:0,stageScore:0,perfectAt:-10,perfectBonus:0,ultUntil:0,rescues:0,reroll:1};
}

function cardLevel(id) {return game.cards[id]||0;}
function baseSpeed() {return Math.min(640,420+game.world*40)*(1-cardLevel('heavy')*.13);}
function newBall(attached=false,x=game.paddle.x,y=game.paddle.y-17,vx=rand(-180,180),vy=-baseSpeed()) {
  const ball={x,y,vx,vy,r:8,attached,trail:[],pierces:0};
  game.balls.push(ball); return ball;
}
function startStage() {
  const g=game;g.stageTime=0;g.stageScore=0;g.weather='clear';g.weatherAt=g.stage===0?12:8;g.weatherUntil=0;g.weatherWarn=0;
  g.weatherNext='';g.weatherEventAt=7;g.hazards=[];g.telegraphs=[];g.drops=[];g.balls=[];g.bricks=[];g.rescues=cardLevel('rescue');g.reroll=1;
  g.paddle.x=W/2;g.paddle.shield=g.frame===1?1:0;g.paddle.stunned=0;g.paddle.velocity=0;
  newBall(true);
  const boss=g.stage===3;
  if (boss) {
    g.lives=Math.min(5,g.lives+1);
    const hp=[22,28,32,36,42][g.world];
    g.boss={x:W/2,y:226,w:250,h:74,hp,maxHp:hp,shield:true,attackAt:3.5,phase:0,weakness:'fire'};
    const guardType=['guard','ice','conductor','lava','guard'][g.world];
    for(let i=0;i<4;i++)g.bricks.push(makeBrick(i,0,guardType,340+i*80,306,62,26));
  } else {
    g.boss=null;
    const stage=STAGES[g.world][g.stage],bw=66,bh=28,gap=9,left=(W-(11*bw+10*gap))/2;
    stage.rows.forEach((cells,row)=>{
      for(let col=0;col<cells.length;col++){
        const type=BRICK_LEGEND[cells[col]];if(!type)continue;
        g.bricks.push(makeBrick(col,row,type,left+col*(bw+gap),151+row*39,bw,bh));
      }
    });
  }
  phase='playing';hideOverlay();
  toast(boss?`BOSS · ${WORLDS[g.world].boss}`:`${g.world+1}-${g.stage+1} · ${STAGES[g.world][g.stage].name}`,2500);
}
function makeBrick(col,row,type,x,y,w=56,h=26) {
  const hp={normal:1,bonus:1,bomb:1,hard:2,steel:3,ice:2,conductor:2,lava:3,guard:2,moving:2}[type]||1;
  return {col,row,type,x,y,baseX:x,w,h,hp,maxHp:hp,flash:0,burn:0,frozen:0,dead:false};
}
function startGame() {createGame();startStage();}
function stageDone() {
  const g=game;phase='stageclear';g.score+=1000*g.lives+Math.max(0,Math.floor(3000-g.stageTime*10));
  if(g.score>save.best){save.best=g.score;persist();}
  const worldDone=g.stage===3;
  if(worldDone){save.unlocked=Math.max(save.unlocked,Math.min(5,g.world+2));persist();}
  const next=worldDone?null:g.stage===2?{name:WORLDS[g.world].boss,hint:'보스전 시작 시 목숨을 1개 회복합니다.'}:STAGES[g.world][g.stage+1];
  showOverlay(`<div class="panel"><div class="eyebrow">${worldDone?'WORLD COMPLETE':'STAGE CLEAR'}</div><h2>${worldDone?WORLDS[g.world].name:`${g.world+1} - ${g.stage+1}`}</h2><p class="subtitle">${worldDone?'다음 월드가 해금되었습니다.':'다음 구역 · '+next.name+'<br>'+next.hint}</p><div class="stat-row"><div>점수<b>${g.score.toLocaleString()}</b></div><div>남은 목숨<b>${g.lives}</b></div><div>선택 카드<b>${g.cardCount}</b></div></div>${button(worldDone?'월드 선택':'다음 스테이지',worldDone?'menu':'next')}</div>`);
}
function gameOver() {
  phase='gameover';if(game.score>save.best){save.best=game.score;persist();}
  showOverlay(`<div class="panel"><div class="eyebrow">SIGNAL LOST</div><h2>GAME OVER</h2><p class="subtitle">다시 도전해 더 강한 빌드를 만드세요.</p><div class="stat-row"><div>점수<b>${game.score.toLocaleString()}</b></div><div>최고 기록<b>${save.best.toLocaleString()}</b></div><div>도달 지점<b>${game.world+1}-${game.stage+1}</b></div></div>${button('다시 도전','restart')} ${button('월드 선택','menu',true)}</div>`);
}
function togglePause() {
  if(phase==='playing') {phase='paused';showOverlay(`<div class="panel"><div class="eyebrow">PAUSED</div><h2>일시정지</h2><p class="subtitle">속성을 바꿔 상성 벽돌을 공략하세요. 날씨가 바뀌면 규칙도 달라집니다.</p>${button('계속하기','resume')} ${button('월드 선택','menu',true)}</div>`);}
  else if(phase==='paused'){phase='playing';hideOverlay();}
}
function drawCards() {
  const choices=[];const available=CARD_POOL.filter(c=>cardLevel(c.id)<3&&(cardLevel(c.id)>0||Object.keys(game.cards).length<5));
  const pool=[...available];
  while(choices.length<3&&pool.length){const i=Math.floor(Math.random()*pool.length);choices.push(pool.splice(i,1)[0]);}
  game.cardChoices=choices;
  showOverlay(`<div class="panel"><div class="eyebrow">EVOLUTION READY</div><h2>진화 카드 선택</h2><p class="muted">다음 진화를 선택하세요. 같은 카드를 고르면 레벨이 오릅니다.</p><div class="cards">${choices.map(c=>`<button class="choice card ${c.rarity}" data-card="${c.id}"><span class="rarity">${c.rarity.toUpperCase()}</span><span class="icon">${c.icon}</span><strong>${c.name}</strong><small>${c.desc}</small><span class="level">Lv ${cardLevel(c.id)} → ${cardLevel(c.id)+1}</span></button>`).join('')}</div>${game.reroll?button('한 번 다시 뽑기','reroll',true):''}</div>`);
}
function offerCards() {phase='cards';drawCards();}
function chooseCard(id) {
  const c=game.cardChoices.find(x=>x.id===id);if(!c)return;
  game.cards[id]=cardLevel(id)+1;game.cardCount++;
  if(id==='multi') {
    const source=game.balls.find(b=>!b.attached)||game.balls[0];
    for(let i=0;i<Math.min(3,cardLevel('multi'));i++)newBall(false,source.x,source.y,rand(-280,280),-baseSpeed());
  }
  if(id==='rescue')game.rescues=cardLevel('rescue');
  game.evolution=Math.max(0,game.evolution-game.evoNeed);game.evoNeed=20+game.cardCount*15+(game.cardCount>2?(game.cardCount-2)*5:0);
  phase='playing';hideOverlay();toast(`${c.name}  Lv ${cardLevel(id)}`);
}
function shiftElement(target) {
  if(!game||phase!=='playing'||game.shiftCooldown>0)return;
  if(!ELEMENTS.includes(target)||game.element===target)return;
  game.element=target;game.shiftCooldown=cardLevel('dual')>=3?0:1.5*(cardLevel('dual')===2?.7:1);
  for(const b of game.balls)burst(b.x,b.y,COLORS[target],12,90);
  sound('shift');toast(`SHIFT · ${target.toUpperCase()}`,700);
}
function cycleElement(dir) {if(game)shiftElement(ELEMENTS[(ELEMENTS.indexOf(game.element)+dir+3)%3]);}
function launch() {
  if(phase!=='playing')return;
  game.perfectAt=game.time;
  for(const b of game.balls)if(b.attached){b.attached=false;b.vx=(input.mouseX-game.paddle.x)*1.5+rand(-75,75);b.vy=-baseSpeed();sound('launch');}
}
function ultimate() {
  if(phase!=='playing'||game.ult<100)return;
  game.ult=0;game.ultUntil=game.time+(game.frame===1?15:8);sound('ult');burst(game.paddle.x,game.paddle.y,WORLDS[game.world].color,45,280);
  if(game.frame===2){for(const b of [...game.bricks].slice(0,10))damageBrick(b,3,'meteor');if(game.boss)damageBoss(8);}
  toast(`${FRAMES[game.frame].ult} ACTIVATED!`,2200);
}

overlay.addEventListener('click',e=>{
  const world=e.target.closest('[data-world]');if(world){selectedWorld=Number(world.dataset.world);menu();return;}
  const frame=e.target.closest('[data-frame]');if(frame){selectedFrame=Number(frame.dataset.frame);menu();return;}
  const card=e.target.closest('[data-card]');if(card){chooseCard(card.dataset.card);return;}
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(action==='start'||action==='restart')startGame();
  else if(action==='next'){game.stage++;startStage();}
  else if(action==='menu')menu();
  else if(action==='resume')togglePause();
  else if(action==='reroll'){game.reroll=0;drawCards();}
});

let audioCtx;
function sound(type) {
  try {
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended')audioCtx.resume();
    const o=audioCtx.createOscillator(),gain=audioCtx.createGain(),now=audioCtx.currentTime;
    const settings={launch:[410,660,.12],hit:[300,170,.075],break:[460,750,.12],shift:[230,790,.18],perfect:[710,1100,.21],ult:[160,70,.55],hurt:[180,60,.33],card:[640,950,.3]};
    const [start,end,duration]=settings[type]||settings.hit;
    o.type=type==='ult'?'sawtooth':'triangle';o.frequency.setValueAtTime(start,now);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),now+duration);
    gain.gain.setValueAtTime(.055,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
    o.connect(gain);gain.connect(audioCtx.destination);o.start(now);o.stop(now+duration);
  } catch {}
}
function burst(x,y,color,count=12,speed=130) {
  if(!game)return;
  for(let i=0;i<count;i++){
    const a=rand(0,Math.PI*2),v=rand(speed*.25,speed);
    game.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.25,.7),max:.7,color,size:rand(1.5,4)});
  }
  if(game.particles.length>600)game.particles.splice(0,game.particles.length-600);
}
function comboMultiplier(){return Math.min(5,1+Math.floor(game.combo/5));}
function damageBrick(brick,amount,source='ball') {
  if(!brick||brick.dead)return;
  const g=game;
  if(brick.type==='ice'&&g.element==='ice'&&source==='ball')return;
  if(brick.type==='lava'&&g.element==='fire'&&source==='ball')return;
  if(brick.type==='ice'&&g.element==='fire')amount=brick.hp;
  if(brick.type==='lava'&&g.element==='ice')amount*=2;
  if(brick.type==='moving'&&g.element==='ice')brick.frozen=3;
  if(brick.type==='steel'&&g.element==='volt')amount*=2;
  if(brick.type==='conductor'&&g.element==='volt')amount*=2;
  if(g.element==='fire'&&g.weather==='rain')amount*=.7;
  if(g.ultUntil>g.time&&g.frame===0)amount+=1;
  amount+=cardLevel('power')+cardLevel('heavy')+g.perfectBonus;
  if(g.perfectBonus)g.perfectBonus=0;
  brick.hp-=amount;brick.flash=.12;
  burst(brick.x+brick.w/2,brick.y+brick.h/2,COLORS[g.element],Math.min(12,4+Math.round(amount*2)),100);
  sound(brick.hp<=0?'break':'hit');
  if(g.element==='fire'&&brick.hp>0)brick.burn=2;
  if(g.element==='ice'&&brick.hp>0)brick.frozen=2;
  if(brick.hp<=0)destroyBrick(brick);
  if(g.element==='volt'&&source==='ball') {
    const radius=(135+cardLevel('element')*25)*(g.weather==='rain'?1.7:1);
    const targets=g.bricks.filter(b=>!b.dead&&b!==brick&&Math.hypot(b.x-brick.x,b.y-brick.y)<radius).slice(0,2+cardLevel('element')+(g.weather==='rain'?2:0));
    for(const target of targets){target.hp-=Math.max(1,Math.floor(1+cardLevel('element')*.5));target.flash=.16;burst(target.x+target.w/2,target.y+target.h/2,COLORS.volt,5,90);if(target.hp<=0)destroyBrick(target);}
  }
}
function destroyBrick(brick) {
  if(brick.dead)return;
  brick.dead=true;
  const g=game,base={normal:10,bonus:100,bomb:20,hard:30,steel:50,ice:35,conductor:40,lava:60,guard:20,moving:45}[brick.type]||10;
  g.combo++;g.comboTimer=3;g.score+=base*comboMultiplier();g.stageScore+=base*comboMultiplier();
  g.ult=clamp(g.ult+1+(g.combo%5===0?10:0),0,100);
  g.evolution+=brick.type==='bonus'?3:1;
  burst(brick.x+brick.w/2,brick.y+brick.h/2,brick.type==='bonus'?'#d2ad66':WORLDS[g.world].accent,14,170);
  if(brick.type==='bonus'||Math.random()<.035)spawnDrop(brick);
  if(brick.type==='bomb'||cardLevel('blast')&&Math.random()<.3) {
    const neighbors=g.bricks.filter(b=>!b.dead&&b!==brick&&Math.hypot(b.x-brick.x,b.y-brick.y)<105+cardLevel('blast')*18).slice(0,6);
    for(const b of neighbors)damageBrick(b,1,'explosion');
  }
  if(cardLevel('split')&&g.balls.length<12&&Math.random()<cardLevel('split')*.16){newBall(false,brick.x+brick.w/2,brick.y+brick.h/2,rand(-230,230),baseSpeed());}
  if(g.combo===5||g.combo===10||g.combo===20)toast(`${g.combo} COMBO · x${comboMultiplier()}`);
}
function spawnDrop(brick) {
  const types=['wide','slow','shield','life','charge','power'];
  game.drops.push({x:brick.x+brick.w/2,y:brick.y+brick.h/2,type:types[Math.floor(Math.random()*types.length)],vy:105});
}
function collectDrop(d) {
  const g=game;
  if(d.type==='wide'){g.paddle.w=Math.min(190,g.paddle.w+25);toast('WIDE PADDLE');}
  if(d.type==='slow'){for(const b of g.balls){b.vx*=.8;b.vy*=.8;}toast('SLOW MOTION');}
  if(d.type==='shield'){g.paddle.shield++;toast('SHIELD +1');}
  if(d.type==='life'){g.lives=Math.min(5,g.lives+1);toast('LIFE +1');}
  if(d.type==='charge'){g.ult=Math.min(100,g.ult+30);toast('ULTIMATE +30');}
  if(d.type==='power'){g.perfectBonus+=2;toast('POWER +2');}
  sound('card');
}
function bossShielded() {
  const g=game,b=g.boss;if(!b)return false;
  if(g.world===0)return g.stageTime%7<4;
  if(g.world===1||g.world===3)return g.bricks.some(brick=>!brick.dead);
  if(g.world===4&&b.phase===0)return g.bricks.some(brick=>!brick.dead);
  return false;
}
function damageBoss(amount) {
  const boss=game.boss;if(!boss||boss.hp<=0)return;
  boss.shield=bossShielded();
  if(boss.shield&&game.ultUntil<=game.time)return;
  if(game.world===2&&game.element==='volt')return;
  let multiplier=1;
  if(game.world===1&&game.element==='fire')multiplier=2;
  if(game.world===3&&game.element==='ice')multiplier=2;
  if(game.world===4)multiplier=game.element===boss.weakness?2:.5;
  boss.hp-=(amount+cardLevel('power')+cardLevel('heavy'))*multiplier;
  boss.phase=boss.hp>boss.maxHp*2/3?0:boss.hp>boss.maxHp/3?1:2;
  burst(rand(boss.x-70,boss.x+70),boss.y,COLORS[game.element],15,150);sound('break');
  game.score+=100*comboMultiplier();game.ult=clamp(game.ult+4,0,100);
  if(boss.hp<=0){boss.hp=0;stageDone();}
}
function collideRect(ball,rect) {
  return ball.x+ball.r>rect.x&&ball.x-ball.r<rect.x+rect.w&&ball.y+ball.r>rect.y&&ball.y-ball.r<rect.y+rect.h;
}
function updateBall(ball,dt) {
  const g=game,p=g.paddle;
  if(ball.attached){ball.x=p.x;ball.y=p.y-18;return;}
  ball.trail.unshift({x:ball.x,y:ball.y});if(ball.trail.length>9)ball.trail.pop();
  const wind=g.weather==='storm'?Math.sin(g.stageTime*2.5)*30:0;
  ball.x+=(ball.vx+wind)*dt;ball.y+=ball.vy*dt;
  if(ball.x<ball.r+22){ball.x=ball.r+22;ball.vx=Math.abs(ball.vx);sound('hit');}
  if(ball.x>W-ball.r-22){ball.x=W-ball.r-22;ball.vx=-Math.abs(ball.vx);sound('hit');}
  if(ball.y<FIELD_TOP+ball.r){ball.y=FIELD_TOP+ball.r;ball.vy=Math.abs(ball.vy);sound('hit');}
  if(ball.vy>0&&ball.y+ball.r>=p.y-p.h/2&&ball.y-ball.r<p.y+p.h/2&&Math.abs(ball.x-p.x)<p.w/2+ball.r){
    ball.y=p.y-p.h/2-ball.r;const offset=clamp((ball.x-p.x)/(p.w/2),-1,1),speed=clamp(Math.hypot(ball.vx,ball.vy)*1.012,baseSpeed(),780);
    const angle=offset*1.1;ball.vx=Math.sin(angle)*speed;ball.vy=-Math.cos(angle)*speed;
    if(Math.abs(ball.vx)<speed*.28)ball.vx=(ball.vx<0?-1:1)*speed*.28;
    g.comboTimer=3;
    if(g.time-g.perfectAt<.13){g.perfectBonus=1;g.ult=Math.min(100,g.ult+5);ball.vx*=1.1;ball.vy*=1.1;toast('PERFECT RECEIVE!',900);burst(ball.x,p.y,'#ffffff',22,190);sound('perfect');}
    else {burst(ball.x,p.y,WORLDS[g.world].color,9,100);sound('launch');}
  }
  for(const brick of g.bricks) {
    if(brick.dead||!collideRect(ball,brick))continue;
    const prevX=ball.x-ball.vx*dt,prevY=ball.y-ball.vy*dt;
    if(prevY+ball.r<=brick.y||prevY-ball.r>=brick.y+brick.h)ball.vy*=-1;
    else if(prevX+ball.r<=brick.x||prevX-ball.r>=brick.x+brick.w)ball.vx*=-1;
    else ball.vy*=-1;
    damageBrick(brick,1,'ball');
    if(cardLevel('pierce')&&ball.pierces<cardLevel('pierce')*2){ball.vy*=-1;ball.pierces++;}
    break;
  }
  if(g.boss&&ball.vy<0&&collideRect(ball,{x:g.boss.x-g.boss.w/2,y:g.boss.y-g.boss.h/2,w:g.boss.w,h:g.boss.h})){
    ball.vy=Math.abs(ball.vy);ball.y=g.boss.y+g.boss.h/2+ball.r;damageBoss(1);
  }
  if(ball.y>FIELD_BOTTOM+28) {
    if(g.ultUntil>g.time&&g.frame===1){ball.y=FIELD_BOTTOM-20;ball.vy=-Math.abs(ball.vy);return;}
    if(p.shield>0){p.shield--;ball.y=FIELD_BOTTOM-20;ball.vy=-Math.abs(ball.vy);toast('SHIELD SAVED');return;}
    if(g.rescues>0){g.rescues--;ball.y=FIELD_BOTTOM-20;ball.vy=-Math.abs(ball.vy);toast('RESCUE');return;}
    g.balls.splice(g.balls.indexOf(ball),1);
    if(g.balls.length===0){g.lives--;g.combo=0;sound('hurt');toast(g.lives>0?`LIFE LOST · ${g.lives} LEFT`:'GAME OVER');if(g.lives<=0)gameOver();else newBall(true);}
  }
}
function updateBoss(dt) {
  const b=game.boss;if(!b)return;
  const g=game;
  b.x=W/2+Math.sin(g.stageTime*(.72+g.world*.08))*125;
  b.shield=bossShielded();
  if(g.world===4)b.weakness=ELEMENTS[Math.floor(g.stageTime/8)%3];
  b.attackAt-=dt;
  if(b.attackAt<=0){
    b.attackAt=[4.5,4.2,3.7,3.9,3.5][g.world];
    const count=g.world===0?2:g.world===3||g.world===4&&b.phase===2?3:1;
    for(let i=0;i<count;i++)g.telegraphs.push({x:clamp(b.x+(i-(count-1)/2)*105+rand(-18,18),60,W-60),remaining:.9,kind:['bolt','ice','storm','ash','void'][g.world]});
    toast('⚠ 공격 예고',900);
  }
}
function updateWeather(dt) {
  const g=game;
  if(g.weatherWarn>0){g.weatherWarn-=dt;if(g.weatherWarn<=0){g.weather=g.weatherNext;g.weatherUntil=g.stageTime+24;toast(`WEATHER SHIFT · ${g.weather.toUpperCase()}`,1500);}}
  if(g.weather==='clear'&&g.stageTime>=g.weatherAt&&g.weatherWarn<=0){g.weatherNext=WORLDS[g.world].weather;g.weatherWarn=3;g.weatherAt=Infinity;toast(`⚠ ${g.weatherNext.toUpperCase()} INCOMING`,1800);}
  if(g.weather!=='clear'&&g.stageTime>=g.weatherUntil){g.weather='clear';g.weatherAt=g.stageTime+7;toast('WEATHER CLEAR');}
  if(g.weather!=='clear'&&g.stageTime>=g.weatherEventAt){
    g.weatherEventAt=g.stageTime+7;
    if(g.weather==='storm'||g.weather==='meteor'){
      const candidates=g.bricks.filter(b=>!b.dead);
      if(candidates.length){const target=candidates[Math.floor(Math.random()*candidates.length)];g.telegraphs.push({x:target.x+target.w/2,remaining:.85,kind:'sky',target});}
    }else if(g.weather==='ash'){
      g.telegraphs.push({x:rand(100,W-100),remaining:.9,kind:'ash'});
    }
  }
}
function update(dt) {
  if(phase!=='playing'||!game)return;
  const g=game;g.time+=dt;g.stageTime+=dt;g.shiftCooldown=Math.max(0,g.shiftCooldown-dt);
  if(g.comboTimer>0){g.comboTimer-=dt;if(g.comboTimer<=0)g.combo=0;}
  const direction=(keys.has('ArrowRight')||keys.has('KeyD')||input.right?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')||input.left?1:0);
  g.paddle.stunned=Math.max(0,g.paddle.stunned-dt);
  if(g.paddle.stunned===0){
    if(g.weather==='snow'){
      const target=direction?direction*600:input.mouseActive?clamp((input.mouseX-g.paddle.x)*10,-650,650):0;
      g.paddle.velocity+=(target-g.paddle.velocity)*Math.min(1,dt*4);
      g.paddle.x+=g.paddle.velocity*dt;
    }else{
      g.paddle.velocity=0;
      if(direction){g.paddle.x+=direction*600*dt;input.mouseActive=false;}
      else if(input.mouseActive)g.paddle.x+=(input.mouseX-g.paddle.x)*Math.min(1,dt*16);
    }
  }
  g.paddle.x=clamp(g.paddle.x,30+g.paddle.w/2,W-30-g.paddle.w/2);
  updateWeather(dt);if(g.boss)updateBoss(dt);
  for(const warning of [...g.telegraphs]){
    warning.remaining-=dt;
    if(warning.remaining>0)continue;
    g.telegraphs.splice(g.telegraphs.indexOf(warning),1);
    if(warning.kind==='sky'){
      if(warning.target&&!warning.target.dead)damageBrick(warning.target,g.weather==='meteor'?2:1,'weather');
      burst(warning.x,170,g.weather==='meteor'?'#d5aa50':'#c8d1d0',14,130);
    }else g.hazards.push({x:warning.x,y:g.boss?g.boss.y+45:FIELD_TOP+10,vx:warning.kind==='void'?rand(-45,45):0,vy:warning.kind==='storm'?330:230+g.world*18,r:warning.kind==='ash'?15:12,life:4,kind:warning.kind});
  }
  for(const brick of g.bricks){
    brick.flash=Math.max(0,brick.flash-dt);
    brick.frozen=Math.max(0,brick.frozen-dt);
    if(brick.type==='moving'&&!brick.dead&&brick.frozen===0)brick.x=brick.baseX+Math.sin(g.stageTime*1.8+brick.col*1.7)*12;
  }
  for(const b of [...g.balls]){updateBall(b,dt);if(phase!=='playing')return;}
  for(const brick of g.bricks){if(brick.burn>0){brick.burn-=dt;if(brick.burn<=0)damageBrick(brick,1,'burn');}}
  for(const drop of [...g.drops]){drop.y+=drop.vy*dt;if(drop.y>FIELD_BOTTOM+20)g.drops.splice(g.drops.indexOf(drop),1);else if(Math.abs(drop.x-g.paddle.x)<g.paddle.w/2&&Math.abs(drop.y-g.paddle.y)<20){collectDrop(drop);g.drops.splice(g.drops.indexOf(drop),1);}}
  for(const hazard of [...g.hazards]){hazard.x+=hazard.vx*dt;hazard.y+=hazard.vy*dt;hazard.life-=dt;if(hazard.y>FIELD_BOTTOM+30||hazard.life<=0)g.hazards.splice(g.hazards.indexOf(hazard),1);else if(Math.abs(hazard.x-g.paddle.x)<g.paddle.w/2&&Math.abs(hazard.y-g.paddle.y)<21){g.paddle.stunned=hazard.kind==='ice'?1.5:.55;g.paddle.velocity=0;burst(hazard.x,hazard.y,'#ba6d54',17,140);g.hazards.splice(g.hazards.indexOf(hazard),1);toast(hazard.kind==='ice'?'PADDLE FROZEN':'PADDLE STUN',650);}}
  for(const p of [...g.particles]){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.985;p.vy*=.985;p.life-=dt;if(p.life<=0)g.particles.splice(g.particles.indexOf(p),1);}
  if(g.balls.length&&g.bricks.every(b=>b.dead)&&!g.boss){stageDone();return;}
  if(g.evolution>=g.evoNeed&&CARD_POOL.some(c=>cardLevel(c.id)<3&&(cardLevel(c.id)>0||Object.keys(g.cards).length<5))){offerCards();sound('card');}
}

function roundRect(x,y,w,h,r,fill,stroke,line=1) {
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}
}
function text(str,x,y,size=16,color='#f3eee5',align='left',weight=700,shadow=false) {
  ctx.save();ctx.font=`${weight} ${size}px "Barlow Condensed",Impact,sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';
  ctx.fillText(str,x,y);ctx.restore();
}
function line(x1,y1,x2,y2,color,width=1,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();}
function background(t,world=selectedWorld) {
  const img=backgrounds[world];
  if(img.complete&&img.naturalWidth)ctx.drawImage(img,0,0,W,H);
  else {ctx.fillStyle='#677487';ctx.fillRect(0,0,W,H);}
  ctx.fillStyle=game?'rgba(22,27,33,.19)':'rgba(19,24,31,.10)';ctx.fillRect(0,0,W,H);
  if(game){
    ctx.fillStyle='rgba(20,25,31,.12)';ctx.fillRect(22,FIELD_TOP,W-44,FIELD_BOTTOM-FIELD_TOP);
    line(23,FIELD_TOP,23,FIELD_BOTTOM,'#ede5d8',1,.4);
    line(W-23,FIELD_TOP,W-23,FIELD_BOTTOM,'#ede5d8',1,.4);
    line(23,FIELD_BOTTOM,W-23,FIELD_BOTTOM,'#ede5d8',1,.4);
  }
  const weather=game?.weather||'clear';
  if(weather==='rain'||weather==='storm'){
    ctx.save();ctx.strokeStyle='#d7dedf';ctx.globalAlpha=weather==='storm'?.28:.16;ctx.lineWidth=1;
    for(let i=0;i<70;i++){const x=(i*97+t*50)%1050-50,y=(i*131+t*350)%580+95;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-6,y+16);ctx.stroke();}ctx.restore();
  }else if(weather==='snow'||world===1){
    ctx.save();ctx.fillStyle='#f2eee7';ctx.globalAlpha=.55;for(let i=0;i<55;i++){const x=(i*181+Math.sin(t+i)*26)%W,y=(i*103+t*(20+i%3*11))%560+95;ctx.fillRect(x,y,2,2);}ctx.restore();
  }else if(weather==='ash'||world===3){
    ctx.save();ctx.fillStyle='#c8a790';ctx.globalAlpha=.28;for(let i=0;i<50;i++){const x=(i*211+Math.sin(t+i)*24)%W,y=580-(i*139+t*(18+i%4*5))%470;ctx.fillRect(x,y,2,2);}ctx.restore();
  }
}
function drawBrick(b,t) {
  if(b.dead)return;
  const palette={normal:'#d7c2a5',hard:'#a99a91',steel:'#a7adb0',bomb:'#c57769',bonus:'#d2ad66',ice:'#a8c1c6',conductor:'#d2be83',lava:'#bb7d5c',guard:'#a99eac',moving:'#adb5a4'};
  const color=b.flash>0?'#f6eee0':palette[b.type]||'#d7c2a5';
  ctx.save();
  roundRect(b.x,b.y,b.w,b.h,4,color,'#2c343a',2);
  line(b.x+6,b.y+5,b.x+b.w-6,b.y+5,'#f8f0e1',1,.55);
  line(b.x+6,b.y+b.h-5,b.x+b.w-6,b.y+b.h-5,'#4c4a45',1,.22);
  const cx=b.x+b.w/2,cy=b.y+b.h/2;
  if(b.type==='bonus')text('✦',cx,cy+1,20,'#473e33','center',800);
  else if(b.type==='bomb')text('✹',cx,cy+1,20,'#493933','center',800);
  else if(b.type==='ice')text('❄',cx,cy+1,19,'#314852','center',800);
  else if(b.type==='lava')text('◆',cx,cy+1,16,'#47392e','center',800);
  else if(b.type==='conductor')text('ϟ',cx,cy+1,20,'#4d4736','center',800);
  else if(b.type==='steel')text('▥',cx,cy+1,15,'#38434a','center',800);
  else if(b.type==='guard')text('⬡',cx,cy+1,18,'#42414b','center',800);
  else if(b.type==='moving')text('↔',cx,cy+1,18,'#39463e','center',800);
  else if(b.hp>1)text(String(Math.ceil(b.hp)),cx,cy+1,15,'#333b40','center',700);
  if(b.burn>0)line(b.x+3,b.y+b.h-3,b.x+b.w-3,b.y+b.h-3,'#a45537',3,.8);
  ctx.restore();
}
function drawBoss(b,t) {
  const theme=WORLDS[game.world],x=b.x-b.w/2,y=b.y-b.h/2;
  ctx.save();
  roundRect(x,y,b.w,b.h,8,'#454b4c','#e8d8bf',3);
  roundRect(x+11,y+10,b.w-22,b.h-20,5,'#74716b','#e8d8bf',1);
  ctx.translate(b.x,b.y);ctx.rotate(Math.sin(t*1.7)*.035);
  ctx.strokeStyle='#e7d4b3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-60,0);ctx.lineTo(-30,-20);ctx.lineTo(0,0);ctx.lineTo(30,-20);ctx.lineTo(60,0);ctx.stroke();
  roundRect(-18,-18,36,36,5,'#b66f51','#e6d6bc',2);ctx.restore();
  if(b.shield){ctx.save();ctx.strokeStyle='#e5d4b9';ctx.globalAlpha=.6;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(b.x,b.y,b.w/2+16,b.h/2+17,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
  roundRect(330,112,300,10,5,'#2b3538','#d8c6ab',1);roundRect(332,114,296*clamp(b.hp/b.maxHp,0,1),6,3,'#b67454');
  text(WORLDS[game.world].boss,480,96,20,'#f5eee4','center',800);
  text(b.shield?'SHIELD ON':game.world===4?`WEAK: ${b.weakness.toUpperCase()}`:game.world===2?'VOLT IMMUNE':'CORE EXPOSED',480,135,14,'#f2eadc','center',700);
}
function drawBall(b) {
  const color=COLORS[game.element];ctx.save();
  b.trail.forEach((p,i)=>{ctx.globalAlpha=.2*(1-i/b.trail.length);ctx.fillStyle='#f1e5d2';ctx.beginPath();ctx.arc(p.x,p.y,b.r*(1-i/b.trail.length),0,Math.PI*2);ctx.fill();});
  ctx.globalAlpha=1;ctx.fillStyle='#f5eee0';ctx.strokeStyle='#222c31';ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,b.r+2,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle=color;ctx.beginPath();ctx.arc(b.x,b.y,b.r-2,0,Math.PI*2);ctx.fill();
  if(game.element==='ice'){ctx.strokeStyle='#26333a';ctx.lineWidth=1.5;ctx.strokeRect(b.x-3,b.y-3,6,6);}
  else if(game.element==='volt')text('ϟ',b.x,b.y+1,12,'#3b3930','center',900);
  else {ctx.fillStyle='#f7e9d7';ctx.beginPath();ctx.arc(b.x-2,b.y-2,2,0,Math.PI*2);ctx.fill();}
  ctx.restore();
  if(b.attached){line(b.x,b.y-9,b.x+35,b.y-110,'#f3eee5',1,.55);text('SPACE / CLICK TO LAUNCH',b.x,b.y-135,15,'#f3eee5','center',700);}
}
function drawPaddle(p,t) {
  const color=game.ultUntil>game.time?'#e9d1a8':COLORS[game.element];
  roundRect(p.x-p.w/2,p.y-p.h/2,p.w,p.h,5,'#e9dcc8','#263139',2);
  roundRect(p.x-p.w/2+6,p.y-p.h/2+3,p.w-12,p.h-6,2,color);
  line(p.x-p.w/2-8,p.y+17,p.x+p.w/2+8,p.y+17,'#e9dcc8',2,.8);
  if(p.shield||game.ultUntil>game.time&&game.frame===1){line(25,FIELD_BOTTOM-10,W-25,FIELD_BOTTOM-10,'#e8ddcc',3,.8);}
}
function drawHud() {
  const g=game,theme=WORLDS[g.world];
  ctx.fillStyle='#263036';ctx.fillRect(0,0,W,FIELD_TOP);line(0,FIELD_TOP,W,FIELD_TOP,'#e0d0b8',2,.8);
  text('SCORE',33,24,14,'#b7b7ae');text(String(g.score).padStart(6,'0'),33,54,32,'#f5eee3');
  text('BEST '+String(save.best).padStart(6,'0'),190,27,15,'#aab2ad');
  text('STAGE',360,24,14,'#b7b7ae');text(`${g.world+1} - ${g.stage+1}`,360,54,30,'#e0c59e');
  text('LIVES',523,24,14,'#b7b7ae');text('◆ '.repeat(g.lives),523,53,21,'#d08d72');
  text('COMBO',685,24,14,'#b7b7ae');text(`x${comboMultiplier()}  ${g.combo}`,685,54,29,g.combo>=5?'#e0c59e':'#f5eee3');
  text('WEATHER',836,24,14,'#b7b7ae');text(g.weatherWarn>0?`${g.weatherNext.toUpperCase()} ${Math.ceil(g.weatherWarn)}s`:g.weather.toUpperCase(),836,51,19,'#e0c59e');
  ctx.fillStyle='#263036';ctx.fillRect(0,648,W,72);line(0,648,W,648,'#e0d0b8',2,.8);
  for(let i=0;i<3;i++){
    const e=ELEMENTS[i],x=25+i*84,selected=g.element===e;
    roundRect(x,660,76,43,4,selected?COLORS[e]:'#364146',selected?'#f1e6d5':'#6b7575',selected?2:1);
    text(`${i+1} ${e.toUpperCase()}`,x+38,681,16,selected?'#252e33':'#d3d0c5','center',800);
  }
  if(g.shiftCooldown>0)text(g.shiftCooldown.toFixed(1)+'s',280,682,17,'#c6c7bc');
  text('EVOLUTION',327,667,13,'#c3c4ba');roundRect(327,684,205,10,4,'#4b5556','#a4a69a');roundRect(329,686,201*clamp(g.evolution/g.evoNeed,0,1),6,3,'#c6ab79');
  text(`${g.evolution}/${g.evoNeed}`,537,690,15,'#f1eadf');
  text('ULTIMATE',606,667,13,'#c3c4ba');roundRect(606,684,185,10,4,'#4b5556','#a4a69a');roundRect(608,686,181*g.ult/100,6,3,'#c88160');
  text(g.ult>=100?'X  READY':`${Math.floor(g.ult)}%`,806,690,16,'#f1eadf');
  text(FRAMES[g.frame].name,929,665,14,'#e0c59e','right');
}
function render() {
  const t=globalTime,world=game?.world??selectedWorld;
  background(t,world);
  if(game){
    const g=game;
    for(const b of g.bricks)drawBrick(b,t);
    if(g.boss)drawBoss(g.boss,t);
    for(const warning of g.telegraphs){
      const alpha=.35+.25*Math.sin(t*13);const color=warning.kind==='ice'?'#d3e4e6':'#e7bf98';
      if(warning.kind==='sky'){
        line(warning.x,FIELD_TOP,warning.x,warning.target?.y||250,color,3,alpha);
        text('▼',warning.x,(warning.target?.y||250)-18,18,color,'center',700);
      }else{
        line(warning.x,FIELD_TOP,warning.x,FIELD_BOTTOM,color,3,alpha);
        roundRect(warning.x-18,FIELD_BOTTOM-18,36,11,3,color);
      }
    }
    for(const d of g.drops){roundRect(d.x-13,d.y-10,26,20,4,'#e3cba3','#343a3a',2);text(({wide:'↔',slow:'◷',shield:'⬡',life:'♥',charge:'✦',power:'◆'})[d.type],d.x,d.y+1,17,'#343a3a','center',900);}
    for(const h of g.hazards){ctx.save();ctx.fillStyle='#ba6d54';ctx.strokeStyle='#eee1d0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
    drawPaddle(g.paddle,t);for(const b of g.balls)drawBall(b);
    for(const p of g.particles){ctx.save();ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);ctx.restore();}
    drawHud();
  }else{
    text('SHIFT THE ELEMENTS',W/2,412,25,'#f4ecdf','center',700);
  }
}

function frame(time) {
  const dt=Math.min(.05,(time-lastTime)/1000||0);lastTime=time;globalTime+=dt;accumulator+=dt;
  let steps=0;while(accumulator>=1/120&&steps<6){update(1/120);accumulator-=1/120;steps++;}
  render();requestAnimationFrame(frame);
}
function canvasPosition(clientX) {const r=canvas.getBoundingClientRect();return clamp((clientX-r.left)/r.width*W,0,W);}
canvas.addEventListener('pointermove',e=>{input.mouseX=canvasPosition(e.clientX);input.mouseActive=true;});
canvas.addEventListener('pointerdown',e=>{input.mouseX=canvasPosition(e.clientX);input.mouseActive=true;launch();});
canvas.addEventListener('contextmenu',e=>{e.preventDefault();ultimate();});
window.addEventListener('keydown',e=>{
  if(['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
  if(keys.has(e.code))return;keys.add(e.code);
  if(e.code==='Space'){if(phase==='menu')startGame();else launch();}
  else if(e.code==='Escape'||e.code==='KeyP')togglePause();
  else if(e.code==='Digit1')shiftElement('fire');
  else if(e.code==='Digit2')shiftElement('ice');
  else if(e.code==='Digit3')shiftElement('volt');
  else if(e.code==='KeyQ')cycleElement(-1);
  else if(e.code==='KeyE')cycleElement(1);
  else if(e.code==='KeyX'||e.code==='ArrowUp')ultimate();
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();input.left=false;input.right=false;if(phase==='playing')togglePause();});
function bindHold(id,key){const el=document.getElementById(id);el.addEventListener('pointerdown',e=>{e.preventDefault();input[key]=true;el.setPointerCapture(e.pointerId);});for(const type of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(type,()=>input[key]=false);}
bindHold('leftBtn','left');bindHold('rightBtn','right');
$('#launchBtn').addEventListener('click',launch);$('#shiftBtn').addEventListener('click',()=>cycleElement(1));$('#ultBtn').addEventListener('click',ultimate);$('#pauseBtn').addEventListener('click',togglePause);
menu();requestAnimationFrame(frame);
