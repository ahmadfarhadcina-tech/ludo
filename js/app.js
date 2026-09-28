'use strict';
const $=q=>document.querySelector(q),COL=['#e5484d','#30a46c','#f5c518','#3e63dd'],NAMES=['Red','Green','Yellow','Blue'];
const T={en:{play:'Play vs AI',local:'Local Multiplayer',cont:'Continue',prof:'Profile & Stats',set:'Settings',about:'About & Help',back:'Back',roll:'Roll Dice',easy:'Easy',med:'Medium',hard:'Hard',pl:'Players',menu:'Main Menu',again:'Play Again',wins:'WINS!',reset:'Reset Progress',sure:'Are you sure?',yes:'Yes',no:'No',lang:'Language',sound:'Sound',speed:'Animation speed',turn:'Turn',resume:'Resume',help:'Roll a 6 to leave base. Land on an opponent (outside safe cells) to send it home. Get all 4 pawns to the center. A 6, a capture or reaching the center gives an extra turn.',ab:'Cina Ludo 3D v1.0 — Developer: Cina. Works offline (PWA).',lvl:'Level',coins:'Cina Coins',games:'Games',w:'Wins',l:'Losses',cap:'Captures',six:'Sixes',a1:'First Victory',a2:'10 Wins',a3:'Capture Master (25)',a4:'Lucky Six (20)'},
fa:{play:'بازی با هوش مصنوعی',local:'چندنفره محلی',cont:'ادامه بازی',prof:'پروفایل و آمار',set:'تنظیمات',about:'درباره و راهنما',back:'بازگشت',roll:'انداختن تاس',easy:'آسان',med:'متوسط',hard:'سخت',pl:'بازیکنان',menu:'منوی اصلی',again:'بازی دوباره',wins:'برنده شد!',reset:'پاک کردن پیشرفت',sure:'مطمئنی؟',yes:'بله',no:'خیر',lang:'زبان',sound:'صدا',speed:'سرعت انیمیشن',turn:'نوبت',resume:'ادامه',help:'با آوردن ۶ مهره از خانه خارج می‌شود. اگر روی مهره حریف (خارج از خانه امن) بنشینی به خانه‌اش برمی‌گردد. هر ۴ مهره باید به مرکز برسند. ۶، گرفتن مهره یا رسیدن به مرکز نوبت اضافه دارد.',ab:'Cina Ludo 3D نسخه ۱٫۰ — توسعه‌دهنده: Cina. آفلاین (PWA).',lvl:'سطح',coins:'سکه‌های Cina',games:'بازی‌ها',w:'برد',l:'باخت',cap:'گرفتن مهره',six:'شش‌ها',a1:'اولین پیروزی',a2:'۱۰ برد',a3:'استاد گرفتن (۲۵)',a4:'شش شانسی (۲۰)'}};
let S={saveVersion:1,profile:{coins:100,xp:0,wins:0,losses:0,games:0,captures:0,sixes:0},settings:{lang:'en',sound:true,speed:1},game:null};
const t=k=>(T[S.settings.lang]||T.en)[k]||k;
function load(){try{const d=JSON.parse(localStorage.getItem('cina_ludo')||'null');if(d){S={...S,...d,profile:{...S.profile,...d.profile},settings:{...S.settings,...d.settings},saveVersion:1}}}catch(e){}}
function save(){try{S.game=G&&!G.over?{...G,legal:[],phase:'roll',roll:null}:null;localStorage.setItem('cina_ludo',JSON.stringify(S))}catch(e){}}
let ac;function sfx(f,d=.09,ty='sine',v=.12){if(!S.settings.sound)return;try{ac=ac||new AudioContext();const o=ac.createOscillator(),g=ac.createGain(),n=ac.currentTime;o.type=ty;o.frequency.value=f;g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(g);g.connect(ac.destination);o.start();o.stop(n+d)}catch(e){}}
const wait=ms=>new Promise(r=>setTimeout(r,ms/S.settings.speed));
// ---- board geometry
const TRACK=[];
(function(){const a=(x,y)=>TRACK.push([x,y]);for(let x=1;x<=5;x++)a(x,6);for(let y=5;y>=0;y--)a(6,y);a(7,0);a(8,0);for(let y=1;y<=5;y++)a(8,y);for(let x=9;x<=14;x++)a(x,6);a(14,7);a(14,8);for(let x=13;x>=9;x--)a(x,8);for(let y=9;y<=14;y++)a(8,y);a(7,14);a(6,14);for(let y=13;y>=9;y--)a(6,y);for(let x=5;x>=0;x--)a(x,8);a(0,7);a(0,6)})();
const BASE=[[0,0],[9,0],[9,9],[0,9]],SL=[[1.8,1.8],[4.2,1.8],[1.8,4.2],[4.2,4.2]];
const COLM=[j=>[1+j,7],j=>[7,1+j],j=>[13-j,7],j=>[7,13-j]];
function pos(p,i,k){if(i===-1)return[BASE[p][0]+SL[k][0]+.0,BASE[p][1]+SL[k][1]];if(i<=50){const c=TRACK[abs(p,i)];return[c[0]+.5,c[1]+.5]}if(i<56){const c=COLM[p](i-51);return[c[0]+.5,c[1]+.5]}return[7.5+[-.35,0,.35,0][k]*(p%2?0:1)+(p%2?[0,-.35,0,.35][k]:0),7.5+[0,-.35,0,.35][k]*(p%2?0:1)+(p%2?[-.35,0,.35,0][k]:0)]}
// ---- state
let G=null,D=[],P=[],size=320,dpr=devicePixelRatio||1,cnt=0;
const face={1:[0,0],2:[0,-90],3:[-90,0],4:[90,0],5:[0,90],6:[0,180]};
function start(n,lv,ai,saved){const act=n===2?[1,0,1,0]:n===3?[1,1,1,0]:[1,1,1,1];
 G=saved||{n,lv,active:act.map(Boolean),ai:act.map((a,i)=>ai&&i>0),pawns:[0,1,2,3].map(()=>[-1,-1,-1,-1]),turn:0,roll:null,phase:'roll',legal:[],over:false};
 G.phase='roll';G.legal=[];D=G.pawns.map((a,p)=>a.map((i,k)=>{const q=pos(p,i,k);return{x:q[0],y:q[1],z:0}}));
 $('#ui').classList.remove('on');['#hud','#c','#dock'].forEach(s=>$(s).hidden=false);resize();hud();sched();}
function resize(){size=Math.floor(Math.min(innerWidth-8,innerHeight-190,560));const c=$('#c');c.style.width=c.style.height=size+'px';c.width=c.height=size*dpr}
addEventListener('resize',resize);
function hud(){if(!G)return;$('#turn').innerHTML=`<span style="color:${COL[G.turn]}">●</span> ${t('turn')}: ${NAMES[G.turn]}${G.ai[G.turn]?' 🤖':''}`;$('#roll').textContent=t('roll');$('#roll').disabled=G.phase!=='roll'||G.ai[G.turn]}
function nextTurn(){do{G.turn=(G.turn+1)%4}while(!G.active[G.turn]);G.phase='roll';G.roll=null;sfx(520,.06);save();hud();sched()}
function sched(){if(G&&!G.over&&G.ai[G.turn]&&G.phase==='roll')setTimeout(rollDice,700/S.settings.speed)}
async function rollDice(){if(!G||G.phase!=='roll'||G.over)return;G.phase='busy';hud();const r=1+Math.random()*6|0,p=G.turn,cb=$('#cube');cnt++;
 cb.classList.remove('toss');void cb.offsetWidth;cb.classList.add('toss');cb.style.transform=`rotateX(${face[r][0]+720*cnt}deg) rotateY(${face[r][1]+720*cnt}deg)`;
 [200,320,260,400].forEach((f,i)=>setTimeout(()=>sfx(f,.05,'square',.06),i*220/S.settings.speed));await wait(1100);
 G.roll=r;if(r===6&&!G.ai[p])S.profile.sixes++;const m=legal(G,p,r);
 if(!m.length){await wait(600);return nextTurn()}
 if(G.ai[p]){await wait(300);return doMove(p,pick(G,p,r,G.lv,m))}
 if(m.length===1){await wait(250);return doMove(p,m[0])}
 G.legal=m;G.phase='pick';hud()}
function tween(d,tx,ty,ms,j){return new Promise(res=>{const sx=d.x,sy=d.y,t0=performance.now();ms/=S.settings.speed;(function f(n){const k=Math.min(1,(n-t0)/ms);d.x=sx+(tx-sx)*k;d.y=sy+(ty-sy)*k;d.z=j?Math.sin(k*Math.PI)*.5:0;k<1?requestAnimationFrame(f):res()})(t0)})}
function burst(x,y,c,n=24){for(let i=0;i<n;i++)P.push({x,y,vx:(Math.random()-.5)*.25,vy:(Math.random()-.7)*.25,l:60+Math.random()*30,c})}
async function doMove(p,k){G.phase='busy';G.legal=[];const r=G.roll,from=G.pawns[p][k],res=apply(G,p,k,r),d=D[p][k];
 if(from===-1){const q=pos(p,0,k);await tween(d,q[0],q[1],350,1);sfx(660,.12)}
 else for(let i=from+1;i<=res.to;i++){const q=pos(p,i,k);await tween(d,q[0],q[1],170,1);sfx(330+i*4,.05,'triangle',.08)}
 if(res.cap.length){sfx(140,.35,'sawtooth',.2);for(const c of res.cap){burst(d.x,d.y,COL[c.p]);if(!G.ai[p])S.profile.captures++;const q=pos(c.p,-1,c.k);tween(D[c.p][c.k],q[0],q[1],500,1)}}
 if(res.home){sfx(880,.3);burst(d.x,d.y,'#f5c518',30)}
 if(G.pawns[p].every(i=>i===56))return win(p);
 const extra=r===6||res.cap.length||res.home;G.roll=null;G.phase='roll';save();extra?(hud(),sched()):nextTurn()}
function win(p){G.over=true;const h=!G.ai[p],pr=S.profile;pr.games++;h?(pr.wins++,pr.coins+=50,pr.xp+=50):(pr.losses++,pr.coins+=10,pr.xp+=15);S.game=null;save();
 for(let i=0;i<160;i++)P.push({x:7.5,y:4,vx:(Math.random()-.5)*.3,vy:-Math.random()*.3,l:120,c:COL[Math.random()*4|0],g:1});[523,659,784,1046].forEach((f,i)=>setTimeout(()=>sfx(f,.3),i*160));
 setTimeout(()=>ui(`<h2 style="color:${COL[p]};font-size:30px">👑 ${NAMES[p].toUpperCase()} ${t('wins')}</h2><button class="btn" onclick="again()">${t('again')}</button><button class="btn" onclick="menu()">${t('menu')}</button><button class="btn" onclick="stats()">${t('prof')}</button>`),1800)}
let last;function again(){start(G.n,G.lv,G.ai[1])}
// ---- render
function rr(x,a,b,w,h,r){x.beginPath();x.roundRect(a,b,w,h,r)}
function draw(){const c=$('#c');if(!c||c.hidden||!G){return requestAnimationFrame(draw)}const x=c.getContext('2d'),u=size/15;x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,size,size);
 x.fillStyle='#03050d';rr(x,2,9,size-4,size-8,u);x.fill();let g=x.createLinearGradient(0,0,size,size);g.addColorStop(0,'#26315e');g.addColorStop(1,'#141b3a');x.fillStyle=g;rr(x,2,2,size-4,size-4,u*.7);x.fill();
 for(let p=0;p<4;p++){x.globalAlpha=G.active[p]?1:.3;x.fillStyle=COL[p]+'cc';rr(x,BASE[p][0]*u+2,BASE[p][1]*u+2,6*u-4,6*u-4,u*.6);x.fill();x.fillStyle='#0004';SL.forEach(s=>{x.beginPath();x.arc((BASE[p][0]+s[0])*u,(BASE[p][1]+s[1])*u,u*.42,0,7);x.fill()});
  x.fillStyle=COL[p];for(let j=0;j<5;j++){const q=COLM[p](j);rr(x,q[0]*u+2,q[1]*u+2,u-4,u-4,6);x.fill()}x.globalAlpha=1}
 TRACK.forEach((q,i)=>{x.fillStyle=i%13===0?COL[i/13]:'#eef1fb';rr(x,q[0]*u+2,q[1]*u+2,u-4,u-4,6);x.fill();if(SAFE.includes(i)&&i%13){x.fillStyle='#8892b8';x.font=u*.6+'px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('★',(q[0]+.5)*u,(q[1]+.5)*u)}});
 const cc=7.5*u;[[[6,6],[6,9],0],[[6,6],[9,6],1],[[9,6],[9,9],2],[[6,9],[9,9],3]].forEach(([a,b,p])=>{x.fillStyle=COL[p];x.beginPath();x.moveTo(a[0]*u,a[1]*u);x.lineTo(b[0]*u,b[1]*u);x.lineTo(cc,cc);x.fill()});
 const L=[];G.pawns.forEach((a,p)=>G.active[p]&&a.forEach((i,k)=>L.push([p,k,D[p][k]])));L.sort((a,b)=>a[2].y-b[2].y);const tm=performance.now()/300;
 for(const[p,k,d]of L){const px=d.x*u,py=d.y*u,z=d.z*u,on=G.legal.includes(k)&&p===G.turn&&G.phase==='pick';
  x.fillStyle='#0006';x.beginPath();x.ellipse(px,py+u*.22,u*.26,u*.1,0,0,7);x.fill();const y=py-z;
  if(on){x.strokeStyle='#fff';x.lineWidth=3;x.globalAlpha=.6+.4*Math.sin(tm*2);x.beginPath();x.arc(px,y,u*(.42+.05*Math.sin(tm*2)),0,7);x.stroke();x.shadowColor=COL[p];x.shadowBlur=18;x.globalAlpha=1}
  const b=x.createLinearGradient(px-u*.25,0,px+u*.25,0);b.addColorStop(0,COL[p]);b.addColorStop(.4,'#fff8');b.addColorStop(1,'#0007');x.fillStyle=COL[p];x.beginPath();x.moveTo(px-u*.26,y+u*.24);x.quadraticCurveTo(px-u*.08,y-u*.02,px-u*.1,y-u*.12);x.lineTo(px+u*.1,y-u*.12);x.quadraticCurveTo(px+u*.08,y-u*.02,px+u*.26,y+u*.24);x.closePath();x.fill();x.fillStyle=b;x.globalAlpha=.5;x.fill();x.globalAlpha=1;
  const h=x.createRadialGradient(px-u*.05,y-u*.32,1,px,y-u*.26,u*.2);h.addColorStop(0,'#fff');h.addColorStop(1,COL[p]);x.fillStyle=h;x.beginPath();x.arc(px,y-u*.26,u*.18,0,7);x.fill();x.shadowBlur=0}
 P=P.filter(q=>q.l-->0);for(const q of P){q.x+=q.vx;q.y+=q.vy;q.vy+=.006;x.fillStyle=q.c;x.fillRect(q.x*u,q.y*u,5,5)}
 requestAnimationFrame(draw)}
$('#c').addEventListener('pointerdown',e=>{if(!G||G.phase!=='pick')return;const r=e.target.getBoundingClientRect(),u=size/15,mx=(e.clientX-r.left)/u,my=(e.clientY-r.top)/u;let b=null,bd=1;
 G.legal.forEach(k=>{const d=D[G.turn][k],dd=Math.hypot(d.x-mx,d.y-my);if(dd<bd){bd=dd;b=k}});if(b!==null)doMove(G.turn,b)});
$('#roll').onclick=()=>{sfx(400,.05);rollDice()};
$('#pause').onclick=()=>ui(`<h2>Pause</h2><button class="btn" onclick="hideUI()">${t('resume')}</button><button class="btn" onclick="rules()">${t('about')}</button><button class="btn" onclick="menu()">${t('menu')}</button>`);
// ---- screens
function ui(h,back){const u=$('#ui');u.innerHTML=`<div class="card" dir="${S.settings.lang==='fa'?'rtl':'ltr'}">${h}</div>`;u.classList.add('on');sfx(500,.05)}
function hideUI(){$('#ui').classList.remove('on')}
function menu(){if(G&&!G.over)save();['#hud','#c','#dock'].forEach(s=>$(s).hidden=true);const g=S.game;
 ui(`<h2 style="font-size:26px;letter-spacing:2px">CINA LUDO 3D</h2>${g?`<button class="btn" onclick="start(0,0,0,S.game)">${t('cont')}</button>`:''}<button class="btn" onclick="setup(1)">${t('play')}</button><button class="btn" onclick="setup(0)">${t('local')}</button><button class="btn" onclick="stats()">${t('prof')}</button><button class="btn" onclick="settings()">${t('set')}</button><button class="btn" onclick="rules()">${t('about')}</button>`)}
let cfg={n:4,lv:1};
function setup(ai){const b=(k,v,l)=>`<button class="btn ${cfg[k]===v?'sel':''}" onclick="cfg.${k}=${v};setup(${ai})">${l}</button>`;
 ui(`<h2>${t('pl')}</h2><div class="row">${[2,3,4].map(n=>b('n',n,n)).join('')}</div>${ai?`<div class="row">${b('lv',0,t('easy'))}${b('lv',1,t('med'))}${b('lv',2,t('hard'))}</div>`:''}<button class="btn" onclick="G=null;start(cfg.n,cfg.lv,${ai})">${t('play')}</button><button class="btn" onclick="menu()">${t('back')}</button>`)}
function stats(){const p=S.profile,lv=1+p.xp/100|0,A=[[p.wins>=1,'a1'],[p.wins>=10,'a2'],[p.captures>=25,'a3'],[p.sixes>=20,'a4']];
 ui(`<h2>${t('prof')}</h2><p>${t('lvl')} ${lv} · XP ${p.xp%100}/100</p><p>🪙 ${p.coins} ${t('coins')}</p><p>${t('games')}: ${p.games} · ${t('w')}: ${p.wins} · ${t('l')}: ${p.losses} · ${p.games?Math.round(p.wins/p.games*100):0}%</p><p>${t('cap')}: ${p.captures} · ${t('six')}: ${p.sixes}</p>${A.map(a=>`<p class="ach ${a[0]?'on':''}">${a[0]?'🏆':'🔒'} ${t(a[1])}</p>`).join('')}<button class="btn" onclick="menu()">${t('back')}</button>`)}
function settings(){const s=S.settings;ui(`<h2>${t('set')}</h2><div class="row"><button class="btn ${s.lang=='en'?'sel':''}" onclick="S.settings.lang='en';save();settings()">English</button><button class="btn ${s.lang=='fa'?'sel':''}" onclick="S.settings.lang='fa';save();settings()">فارسی</button></div><button class="btn" onclick="S.settings.sound=!S.settings.sound;save();settings()">${t('sound')}: ${s.sound?'ON':'OFF'}</button><button class="btn" onclick="S.settings.speed=S.settings.speed>=2?.75:S.settings.speed+.5;save();settings()">${t('speed')}: ×${s.speed}</button><button class="btn" onclick="ui('<h2>${t('sure')}</h2><div class=row><button class=btn onclick=doReset()>${t('yes')}</button><button class=btn onclick=settings()>${t('no')}</button></div>')">${t('reset')}</button><button class="btn" onclick="menu()">${t('back')}</button>`)}
function doReset(){localStorage.removeItem('cina_ludo');location.reload()}
function rules(){ui(`<h2>${t('about')}</h2><p>${t('help')}</p><p>${t('ab')}</p><button class="btn" onclick="G&&!$('#hud').hidden?hideUI():menu()">${t('back')}</button>`)}
addEventListener('error',e=>console.warn('Cina Ludo error:',e.message));addEventListener('unhandledrejection',e=>console.warn(e.reason));
load();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
requestAnimationFrame(draw);setTimeout(()=>{$('#splash').style.opacity=0;setTimeout(()=>$('#splash').remove(),600);menu()},1600);
