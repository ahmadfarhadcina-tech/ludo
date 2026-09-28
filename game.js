const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const colors={red:{name:"قرمز",hex:"#ef4444"},green:{name:"سبز",hex:"#22c55e"},yellow:{name:"زرد",hex:"#eab308"},blue:{name:"آبی",hex:"#3b82f6"}};
const order=["red","green","yellow","blue"];
let setup={count:2,mode:"local"}, state=null;

function show(id){$$(".screen").forEach(x=>x.classList.remove("active"));$("#"+id).classList.add("active")}
function modal(title,body,actions){
 $("#modalTitle").textContent=title;$("#modalBody").innerHTML=body;$("#modalActions").innerHTML="";
 actions.forEach(a=>{const b=document.createElement("button");b.textContent=a.text;b.className=a.cls||"";b.onclick=()=>{closeModal();a.fn()};$("#modalActions").appendChild(b)});
 $("#modal").classList.add("show")
}
function closeModal(){$("#modal").classList.remove("show")}
function toast(t){const x=$("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1800)}
function namesUI(){
 const box=$("#names");box.innerHTML="";
 for(let i=0;i<setup.count;i++){const c=colors[order[i]],r=document.createElement("div");r.className="name-row";r.innerHTML=`<i class="color-dot" style="background:${c.hex}"></i><input maxlength="18" value="${c.name} ${i+1}" data-color="${order[i]}">`;box.appendChild(r)}
}
function buildTrack(){
 const t=$("#track");t.innerHTML="";
 // 13x13 visual track, leaving center and bases visually dominant
 for(let i=0;i<169;i++){const d=document.createElement("div");d.className="cell";t.appendChild(d)}
}
function tokenHome(player,index){
 const spots=[[31,17],[38,17],[31,31],[38,31]];
 const offset={red:[0,0],green:[0,50],yellow:[50,0],blue:[50,50]}[player];
 return {x:offset[0]+spots[index][0],y:offset[1]+spots[index][1]};
}
function createTokens(){
 const wrap=$("#tokens");wrap.innerHTML="";
 state.players.forEach(p=>{
  p.tokens.forEach((tok,i)=>{
   const e=document.createElement("div");e.className="token";e.dataset.p=p.id;e.dataset.i=i;e.style.background=colors[p.id].hex;
   wrap.appendChild(e);placeToken(e,p,i);
   e.onclick=()=>tokenClick(p.id,i);
  })
 })
}
function placeToken(e,p,i){
 const tok=p.tokens[i];
 if(tok.pos<0){const h=tokenHome(p.id,i);e.style.left=h.x+"%";e.style.top=h.y+"%"}
 else{
   const total=52, idx=(p.start+tok.pos)%total;
   const a=(idx/total)*Math.PI*2-Math.PI/2, r=35;
   e.style.left=(50+Math.cos(a)*r)+"%";e.style.top=(50+Math.sin(a)*r)+"%";
 }
}
function refreshTokens(){
 $$(".token").forEach(e=>{const p=state.players.find(x=>x.id===e.dataset.p);placeToken(e,p,+e.dataset.i);e.classList.remove("selectable","moving")});
}
function current(){return state.players[state.turn]}
function nextTurn(){state.turn=(state.turn+1)%state.players.length;state.roll=null;updateUI()}
function updateUI(){
 const p=current();$("#turnName").textContent=p.name;$("#turnDot").style.background=colors[p.id].hex;
 $("#status").textContent=state.roll?`تاس ${state.roll} — یک مهره را انتخاب کن`:"نوبت شماست؛ تاس را بزن";
 $("#rollInfo").textContent="تاس: "+(state.roll||"—");
 if(state.roll){p.tokens.forEach((t,i)=>{if(t.pos<0&&state.roll===6||t.pos>=0&&t.pos+state.roll<=56)$(`.token[data-p="${p.id}"][data-i="${i}"]`).classList.add("selectable")})}
}
function rollDice(){
 if(state.roll!==null)return;
 const d=$("#dice");d.classList.remove("roll");void d.offsetWidth;d.classList.add("roll");
 const n=Math.floor(Math.random()*6)+1;
 setTimeout(()=>{state.roll=n;showPips(n);updateUI(); if(n!==6 && !hasMove(current(),n)){toast("حرکت ممکن نیست");setTimeout(nextTurn,650)}},700)
}
function showPips(n){
 $$(".pip").forEach(x=>x.style.display="none");
 const map={1:["p1"],2:["p2","p3"],3:["p2","p1","p3"],4:["p2","p4","p5","p3"],5:["p2","p4","p1","p5","p3"],6:["p2","p4","p5","p6","p3","p1"]};
 map[n].forEach(x=>$("."+x).style.display="block")
}
function hasMove(p,n){return p.tokens.some(t=>t.pos<0?n===6:t.pos+n<=56)}
function tokenClick(pid,i){
 if(!state||state.roll===null||current().id!==pid)return;
 const p=current(),t=p.tokens[i],n=state.roll;
 if(t.pos<0&&n!==6)return toast("برای بیرون آوردن مهره ۶ لازم است");
 if(t.pos>=0&&t.pos+n>56)return toast("این مهره نمی‌تواند این‌قدر حرکت کند");
 const e=$(`.token[data-p="${pid}"][data-i="${i}"]`);e.classList.add("moving");
 setTimeout(()=>{
   if(t.pos<0)t.pos=0;else t.pos+=n;
   // capture on the shared track
   state.players.forEach(op=>{if(op.id===p.id)return;op.tokens.forEach(ot=>{if(ot.pos>=0){const a=(p.start+t.pos)%52,b=(op.start+ot.pos)%52;if(a===b&&!(a%13===0)){ot.pos=-1}}})});
   refreshTokens();
   if(p.tokens.every(x=>x.pos===56)){win(p);return}
   const again=n===6;
   state.roll=null;updateUI();if(!again)setTimeout(nextTurn,400);
 },430)
}
function win(p){
 modal("🏆 برنده مشخص شد!",`<div class="win-piece">👑</div><p><b style="color:${colors[p.id].hex}">${p.name}</b> همه مهره‌ها را به پایان رساند!</p>`,[
  {text:"بازی جدید",cls:"ok",fn:startGame},{text:"منوی اصلی",fn:()=>show("menu")}
 ])
}
function startGame(){
 const inputs=$$("#names input");const players=[];
 for(let i=0;i<setup.count;i++)players.push({id:order[i],name:inputs[i]?.value||colors[order[i]].name,start:[0,13,26,39][i],tokens:[{pos:-1},{pos:-1},{pos:-1},{pos:-1}]});
 state={players,turn:0,roll:null};
 show("game");buildTrack();createTokens();showPips(1);updateUI();
}
$("#playBtn").onclick=()=>{namesUI();show("setup")};
$$("[data-back]").forEach(b=>b.onclick=()=>show(b.dataset.back));
$$("#playerCount button").forEach(b=>b.onclick=()=>{$$("#playerCount button").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");setup.count=+b.dataset.n;namesUI()});
$$(".mode").forEach(b=>b.onclick=()=>{$$(".mode").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");setup.mode=b.dataset.mode});
$("#startBtn").onclick=startGame;
$("#diceBtn").onclick=rollDice;
$("#exitBtn").onclick=()=>modal("خروج از مسابقه؟","پیشرفت این مسابقه متوقف می‌شود. آیا مطمئنی می‌خواهی از بازی خارج شوی؟",[
 {text:"ادامه بازی",fn:()=>{}},{text:"بله، خروج",cls:"danger",fn:()=>{state=null;show("menu")}}
]);
$("#restartBtn").onclick=()=>modal("بازی جدید؟","مسابقه فعلی کنار گذاشته می‌شود و یک مسابقه تازه ساخته خواهد شد.",[
 {text:"لغو",fn:()=>{}},{text:"شروع دوباره",cls:"ok",fn:startGame}
]);
$("#soundBtn").onclick=e=>{e.currentTarget.textContent=e.currentTarget.textContent.includes("🔊")?"🔇 صدا":"🔊 صدا"};
$("#howBtn").onclick=()=>modal("آموزش C.Ludo","برای ورود مهره به مسیر باید ۶ بیاوری. با هر پرتاب می‌توانی یکی از مهره‌های مجاز را حرکت بدهی. با آوردن ۶ یک نوبت اضافه می‌گیری. مهره حریف روی خانه مشترک را می‌توانی به پایگاه برگردانی. هر بازیکن باید هر چهار مهره را به پایان برساند.",[{text:"متوجه شدم",cls:"ok",fn:()=>{}}]);
$("#settingsBtn").onclick=()=>modal("تنظیمات","نسخه پایه C.Ludo کاملاً آفلاین است. صدا، لرزش، سرعت انیمیشن و حالت‌های بیشتر در ساختار بازی برای توسعه بعدی آماده شده‌اند.",[{text:"باشه",cls:"ok",fn:()=>{}}]);
$("#aboutBtn").onclick=()=>modal("درباره C.Ludo","C.Ludo یک بازی لدو مستقل با طراحی اختصاصی، تمرکز روی ظاهر سه‌بعدی، حرکت نرم و اجرای آفلاین در مرورگر است.",[{text:"باشه",cls:"ok",fn:()=>{}}]);
namesUI();