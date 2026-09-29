'use strict';

const $=q=>document.querySelector(q);

const COL=[
  '#e5484d',
  '#30a46c',
  '#f5c518',
  '#3e63dd'
];

const NAMES=[
  'Red',
  'Green',
  'Yellow',
  'Blue'
];

const T={
  en:{
    play:'Play vs AI',
    local:'Local Multiplayer',
    cont:'Continue',
    prof:'Profile & Stats',
    set:'Settings',
    about:'About & Help',
    back:'Back',
    roll:'Roll Dice',
    easy:'Easy',
    med:'Medium',
    hard:'Hard',
    pl:'Players',
    menu:'Main Menu',
    again:'Play Again',
    wins:'WINS!',
    reset:'Reset Progress',
    sure:'Are you sure?',
    yes:'Yes',
    no:'No',
    lang:'Language',
    sound:'Sound',
    speed:'Animation speed',
    turn:'Turn',
    resume:'Resume',
    help:'Roll a 6 to leave base. Land on an opponent (outside safe cells) to send it home. Get all 4 pawns to the center. A 6, a capture or reaching the center gives an extra turn.',
    ab:'Cina Ludo 3D v1.0 — Developer: Cina. Works offline (PWA).',
    lvl:'Level',
    coins:'Cina Coins',
    games:'Games',
    w:'Wins',
    l:'Losses',
    cap:'Captures',
    six:'Sixes',
    a1:'First Victory',
    a2:'10 Wins',
    a3:'Capture Master (25)',
    a4:'Lucky Six (20)'
  },

  fa:{
    play:'بازی با هوش مصنوعی',
    local:'چندنفره محلی',
    cont:'ادامه بازی',
    prof:'پروفایل و آمار',
    set:'تنظیمات',
    about:'درباره و راهنما',
    back:'بازگشت',
    roll:'انداختن تاس',
    easy:'آسان',
    med:'متوسط',
    hard:'سخت',
    pl:'بازیکنان',
    menu:'منوی اصلی',
    again:'بازی دوباره',
    wins:'برنده شد!',
    reset:'پاک کردن پیشرفت',
    sure:'مطمئنی؟',
    yes:'بله',
    no:'خیر',
    lang:'زبان',
    sound:'صدا',
    speed:'سرعت انیمیشن',
    turn:'نوبت',
    resume:'ادامه',
    help:'با آوردن ۶ مهره از خانه خارج می‌شود. اگر روی مهره حریف (خارج از خانه امن) بنشینی به خانه‌اش برمی‌گردد. هر ۴ مهره باید به مرکز برسند. ۶، گرفتن مهره یا رسیدن به مرکز نوبت اضافه دارد.',
    ab:'Cina Ludo 3D نسخه ۱٫۰ — توسعه‌دهنده: Cina. آفلاین (PWA).',
    lvl:'سطح',
    coins:'سکه‌های Cina',
    games:'بازی‌ها',
    w:'برد',
    l:'باخت',
    cap:'گرفتن مهره',
    six:'شش‌ها',
    a1:'اولین پیروزی',
    a2:'۱۰ برد',
    a3:'استاد گرفتن (۲۵)',
    a4:'شش شانسی (۲۰)'
  }
};

let S={
  saveVersion:1,

  profile:{
    coins:100,
    xp:0,
    wins:0,
    losses:0,
    games:0,
    captures:0,
    sixes:0
  },

  settings:{
    lang:'en',
    sound:true,
    speed:1
  },

  game:null
};

const t=k=>
  (T[S.settings.lang]||T.en)[k]||k;

function load(){

  try{

    const d=JSON.parse(
      localStorage.getItem('cina_ludo')||'null'
    );

    if(d){

      S={
        ...S,
        ...d,

        profile:{
          ...S.profile,
          ...d.profile
        },

        settings:{
          ...S.settings,
          ...d.settings
        },

        saveVersion:1
      };

    }

  }catch(e){}

}

function save(){

  try{

    S.game=
      G&&!G.over
        ?{
            ...G,
            legal:[],
            phase:'roll',
            roll:null
          }
        :null;

    localStorage.setItem(
      'cina_ludo',
      JSON.stringify(S)
    );

  }catch(e){}

}

let ac;

function sfx(
  f,
  d=.09,
  ty='sine',
  v=.12
){

  if(!S.settings.sound)return;

  try{

    ac=ac||new AudioContext();

    const o=ac.createOscillator();
    const g=ac.createGain();
    const n=ac.currentTime;

    o.type=ty;
    o.frequency.value=f;

    g.gain.setValueAtTime(v,n);

    g.gain.exponentialRampToValueAtTime(
      .001,
      n+d
    );

    o.connect(g);
    g.connect(ac.destination);

    o.start();
    o.stop(n+d);

  }catch(e){}

}

const wait=ms=>
  new Promise(r=>
    setTimeout(
      r,
      ms/S.settings.speed
    )
  );

/* =========================
   BOARD
   ========================= */

const TRACK=[];

(function(){

  const a=(x,y)=>
    TRACK.push([x,y]);

  for(let x=1;x<=5;x++)
    a(x,6);

  for(let y=5;y>=0;y--)
    a(6,y);

  a(7,0);
  a(8,0);

  for(let y=1;y<=5;y++)
    a(8,y);

  for(let x=9;x<=14;x++)
    a(x,6);

  a(14,7);
  a(14,8);

  for(let x=13;x>=9;x--)
    a(x,8);

  for(let y=9;y<=14;y++)
    a(8,y);

  a(7,14);
  a(6,14);

  for(let y=13;y>=9;y--)
    a(6,y);

  for(let x=5;x>=0;x--)
    a(x,8);

  a(0,7);
  a(0,6);

})();

const BASE=[
  [0,0],
  [9,0],
  [9,9],
  [0,9]
];

const SL=[
  [1.8,1.8],
  [4.2,1.8],
  [1.8,4.2],
  [4.2,4.2]
];

const COLM=[
  j=>[1+j,7],
  j=>[7,1+j],
  j=>[13-j,7],
  j=>[7,13-j]
];

/* هر رنگ مقصد جداگانه */
const HOME=[
  [
    [6.45,6.45],
    [6.9,6.45],
    [6.45,6.9],
    [6.9,6.9]
  ],

  [
    [8.1,6.45],
    [8.55,6.45],
    [8.1,6.9],
    [8.55,6.9]
  ],

  [
    [8.1,8.1],
    [8.55,8.1],
    [8.1,8.55],
    [8.55,8.55]
  ],

  [
    [6.45,8.1],
    [6.9,8.1],
    [6.45,8.55],
    [6.9,8.55]
  ]
];

function pos(p,i,k){

  if(i===-1){

    return[
      BASE[p][0]+SL[k][0],
      BASE[p][1]+SL[k][1]
    ];

  }

  if(i<=50){

    const c=TRACK[abs(p,i)];

    return[
      c[0]+.5,
      c[1]+.5
    ];

  }

  if(i<56){

    const c=COLM[p](i-51);

    return[
      c[0]+.5,
      c[1]+.5
    ];

  }

  return HOME[p][k];

}

/* =========================
   STATE
   ========================= */

let G=null;
let D=[];
let P=[];
let size=320;
let dpr=devicePixelRatio||1;
let cnt=0;

const face={
  1:[0,0],
  2:[0,-90],
  3:[-90,0],
  4:[90,0],
  5:[0,90],
  6:[0,180]
};

/* =========================
   DICE
   ========================= */

function createDice(){

  const wrap=$('#dice-dock');

  if(!wrap)return;

  wrap.innerHTML='';

  for(let p=0;p<4;p++){

    const box=document.createElement('div');

    box.className=
      `player-dice p${p} inactive`;

    box.id=`dice-p${p}`;

    box.innerHTML=`

      <span class="dice-name">
        ${['🔴','🟢','🟡','🔵'][p]}
        ${NAMES[p]}
      </span>

      <div
        class="scene"
        role="button"
        tabindex="0"
        aria-label="Roll ${NAMES[p]} dice"
      >

        <div
          class="cube"
          id="cube-${p}"
        >

          <b class="f f1">⚀</b>
          <b class="f f2">⚁</b>
          <b class="f f3">⚂</b>
          <b class="f f4">⚃</b>
          <b class="f f5">⚄</b>
          <b class="f f6">⚅</b>

        </div>

      </div>
    `;

    const scene=
      box.querySelector('.scene');

    scene.onclick=()=>{

      if(!G)return;
      if(!G.active[p])return;
      if(G.turn!==p)return;
      if(G.phase!=='roll')return;
      if(G.ai[p])return;

      sfx(400,.05);
      rollDice();

    };

    scene.onkeydown=e=>{

      if(
        e.key==='Enter'||
        e.key===' '
      ){

        e.preventDefault();
        scene.click();

      }

    };

    wrap.appendChild(box);

  }

}

function updateDice(){

  if(!G)return;

  for(let p=0;p<4;p++){

    const d=$(`#dice-p${p}`);

    if(!d)continue;

    const active=!!G.active[p];

    const usable=
      active&&
      G.turn===p&&
      G.phase==='roll'&&
      !G.ai[p];

    d.classList.toggle(
      'inactive',
      !usable
    );

    d.classList.toggle(
      'active',
      usable
    );

    d.style.setProperty(
      '--dc',
      COL[p]
    );

  }

}

/* =========================
   START
   ========================= */

function start(n,lv,ai,saved){

  const act=
    n===2
      ?[1,0,1,0]
      :n===3
        ?[1,1,1,0]
        :[1,1,1,1];

  G=saved||{

    n,
    lv,

    active:act.map(Boolean),

    ai:act.map(
      (a,i)=>ai&&i>0
    ),

    pawns:[
      [ -1,-1,-1,-1 ],
      [ -1,-1,-1,-1 ],
      [ -1,-1,-1,-1 ],
      [ -1,-1,-1,-1 ]
    ],

    turn:0,
    roll:null,
    phase:'roll',
    legal:[],
    over:false,

    /* امتیاز داخل همین بازی */
    score:[0,0,0,0]

  };

  if(!G.score)
    G.score=[0,0,0,0];

  G.phase='roll';
  G.legal=[];

  D=G.pawns.map(
    (a,p)=>
      a.map(
        (i,k)=>{

          const q=pos(p,i,k);

          return{
            x:q[0],
            y:q[1],
            z:0
          };

        }
      )
  );

  createDice();

  $('#ui').classList.remove('on');

  [
    '#hud',
    '#board-wrap'
  ].forEach(
    s=>$(s).hidden=false
  );

  resize();
  hud();
  sched();

}

/* =========================
   RESIZE
   ========================= */

function resize(){

  size=Math.floor(
    Math.min(
      innerWidth-8,
      innerHeight-190,
      560
    )
  );

  const c=$('#c');

  c.style.width=
    c.style.height=
      size+'px';

  c.width=
    c.height=
      size*dpr;

}

addEventListener(
  'resize',
  resize
);

/* =========================
   HUD
   ========================= */

function hud(){

  if(!G)return;

  const score=
    G.score||[0,0,0,0];

  $('#turn').innerHTML=`

    <span style="color:${COL[G.turn]}">
      ●
    </span>

    ${t('turn')}: ${NAMES[G.turn]}
    ${G.ai[G.turn]?' 🤖':''}

    <span
      style="
        margin-left:8px;
        font-size:12px;
        opacity:.9
      "
    >
      🏆 ${score[G.turn]}
    </span>

  `;

  updateDice();

}

function nextTurn(){

  do{

    G.turn=
      (G.turn+1)%4;

  }while(
    !G.active[G.turn]
  );

  G.phase='roll';
  G.roll=null;

  sfx(520,.06);

  save();
  hud();
  sched();

}

function sched(){

  if(
    G&&
    !G.over&&
    G.ai[G.turn]&&
    G.phase==='roll'
  ){

    setTimeout(
      rollDice,
      700/S.settings.speed
    );

  }

}

/* =========================
   ROLL
   ========================= */

async function rollDice(){

  if(
    !G||
    G.phase!=='roll'||
    G.over
  )return;

  const p=G.turn;

  if(!G.active[p])return;

  if(
    !G.ai[p]&&
    !$('#dice-p'+p)
  )return;

  G.phase='busy';

  hud();

  const r=
    1+Math.random()*6|0;

  const cb=
    $(`#cube-${p}`);

  cnt++;

  cb.classList.remove('toss');

  void cb.offsetWidth;

  cb.classList.add('toss');

  cb.style.transform=
    `rotateX(${face[r][0]+720*cnt}deg)
     rotateY(${face[r][1]+720*cnt}deg)`;

  [200,320,260,400].forEach(
    (f,i)=>
      setTimeout(
        ()=>sfx(
          f,
          .05,
          'square',
          .06
        ),
        i*220/S.settings.speed
      )
  );

  await wait(1100);

  G.roll=r;

  if(
    r===6&&
    !G.ai[p]
  ){

    S.profile.sixes++;

  }

  const m=
    legal(
      G,
      p,
      r
    );

  if(!m.length){

    await wait(600);

    return nextTurn();

  }

  if(G.ai[p]){

    await wait(300);

    return doMove(
      p,
      pick(
        G,
        p,
        r,
        G.lv,
        m
      )
    );

  }

  if(m.length===1){

    await wait(250);

    return doMove(
      p,
      m[0]
    );

  }

  G.legal=m;
  G.phase='pick';

  hud();

}

/* =========================
   ANIMATION
   ========================= */

function tween(
  d,
  tx,
  ty,
  ms,
  j
){

  return new Promise(
    res=>{

      const sx=d.x;
      const sy=d.y;
      const t0=performance.now();

      ms/=S.settings.speed;

      (function f(n){

        const k=
          Math.min(
            1,
            (n-t0)/ms
          );

        d.x=
          sx+(tx-sx)*k;

        d.y=
          sy+(ty-sy)*k;

        d.z=
          j
            ?Math.sin(k*Math.PI)*.5
            :0;

        if(k<1)
          requestAnimationFrame(f);
        else
          res();

      })(t0);

    }
  );

}

function burst(
  x,
  y,
  c,
  n=24
){

  for(let i=0;i<n;i++){

    P.push({
      x,
      y,
      vx:(Math.random()-.5)*.25,
      vy:(Math.random()-.7)*.25,
      l:60+Math.random()*30,
      c
    });

  }

}

/* =========================
   MOVE
   ========================= */

async function doMove(p,k){

  G.phase='busy';
  G.legal=[];

  const r=G.roll;

  const from=
    G.pawns[p][k];

  const res=
    apply(
      G,
      p,
      k,
      r
    );

  const d=
    D[p][k];

  if(from===-1){

    const q=
      pos(
        p,
        0,
        k
      );

    await tween(
      d,
      q[0],
      q[1],
      350,
      1
    );

    sfx(660,.12);

  }else{

    for(
      let i=from+1;
      i<=res.to;
      i++
    ){

      const q=
        pos(
          p,
          i,
          k
        );

      await tween(
        d,
        q[0],
        q[1],
        170,
        1
      );

      sfx(
        330+i*4,
        .05,
        'triangle',
        .08
      );

    }

  }

  /* گرفتن مهره */
  if(res.cap.length){

    sfx(
      140,
      .35,
      'sawtooth',
      .2
    );

    G.score[p]=
      (G.score[p]||0)
      +
      res.cap.length*10;

    for(
      const c of res.cap
    ){

      burst(
        d.x,
        d.y,
        COL[c.p]
      );

      if(!G.ai[p])
        S.profile.captures++;

      const q=
        pos(
          c.p,
          -1,
          c.k
        );

      await tween(
        D[c.p][c.k],
        q[0],
        q[1],
        500,
        1
      );

    }

  }

  /* رسیدن به مقصد */
  if(res.home){

    sfx(880,.3);

    G.score[p]=
      (G.score[p]||0)+20;

    burst(
      d.x,
      d.y,
      COL[p],
      30
    );

    /* مقصد مخصوص همان رنگ */
    const q=
      pos(
        p,
        56,
        k
      );

    d.x=q[0];
    d.y=q[1];
    d.z=0;

  }

  if(
    G.pawns[p].every(
      i=>i===56
    )
  ){

    return win(p);

  }

  const extra=
    r===6||
    res.cap.length||
    res.home;

  G.roll=null;
  G.phase='roll';

  save();

  if(extra){

    hud();
    sched();

  }else{

    nextTurn();

  }

}

/* =========================
   WIN
   ========================= */

function win(p){

  G.over=true;

  const h=!G.ai[p];

  const pr=S.profile;

  pr.games++;

  if(h){

    pr.wins++;
    pr.coins+=50;
    pr.xp+=50;

  }else{

    pr.losses++;
    pr.coins+=10;
    pr.xp+=15;

  }

  S.game=null;
  save();

  for(let i=0;i<160;i++){

    P.push({
      x:7.5,
      y:4,
      vx:(Math.random()-.5)*.3,
      vy:-Math.random()*.3,
      l:120,
      c:COL[Math.random()*4|0],
      g:1
    });

  }

  [
    523,
    659,
    784,
    1046
  ].forEach(
    (f,i)=>
      setTimeout(
        ()=>sfx(f,.3),
        i*160
      )
  );

  setTimeout(
    ()=>
      ui(`
        <h2
          style="
            color:${COL[p]};
            font-size:30px
          "
        >
          👑 ${NAMES[p].toUpperCase()}
          ${t('wins')}
        </h2>

        <p>
          🏆 Score:
          ${(G.score||[])[p]||0}
        </p>

        <button
          class="btn"
          onclick="again()"
        >
          ${t('again')}
        </button>

        <button
          class="btn"
          onclick="menu()"
        >
          ${t('menu')}
        </button>

        <button
          class="btn"
          onclick="stats()"
        >
          ${t('prof')}
        </button>
      `),
    1800
  );

}

function again(){

  const n=G.n;
  const lv=G.lv;
  const ai=G.ai[1];

  start(
    n,
    lv,
    ai
  );

}

/* =========================
   RENDER
   ========================= */

function rr(
  x,
  a,
  b,
  w,
  h,
  r
){

  x.beginPath();

  x.roundRect(
    a,
    b,
    w,
    h,
    r
  );

}

function draw(){

  const c=$('#c');

  if(
    !c||
    $('#board-wrap').hidden||
    !G
  ){

    return requestAnimationFrame(draw);

  }

  const x=
    c.getContext('2d');

  const u=size/15;

  x.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );

  x.clearRect(
    0,
    0,
    size,
    size
  );

  x.fillStyle='#03050d';

  rr(
    x,
    2,
    9,
    size-4,
    size-8,
    u
  );

  x.fill();

  let g=
    x.createLinearGradient(
      0,
      0,
      size,
      size
    );

  g.addColorStop(
    0,
    '#26315e'
  );

  g.addColorStop(
    1,
    '#141b3a'
  );

  x.fillStyle=g;

  rr(
    x,
    2,
    2,
    size-4,
    size-4,
    u*.7
  );

  x.fill();

  /* BASES */

  for(let p=0;p<4;p++){

    const bx=
      BASE[p][0]*u+2;

    const by=
      BASE[p][1]*u+2;

    const bs=
      6*u-4;

    x.globalAlpha=
      G.active[p]?1:.3;

    x.fillStyle=COL[p];

    rr(
      x,
      bx,
      by,
      bs,
      bs,
      u*.55
    );

    x.fill();

    const pad=
      bs*.16;

    x.fillStyle='#eef0fa';

    rr(
      x,
      bx+pad,
      by+pad,
      bs-2*pad,
      bs-2*pad,
      u*.3
    );

    x.fill();

    const cx=
      bx+bs/2;

    const cy=
      by+bs/2;

    /* کمی نزدیک‌تر به مرکز حلقه */
    const off=
      (bs-2*pad)*.23;

    [
      [cx-off,cy-off],
      [cx+off,cy-off],
      [cx-off,cy+off],
      [cx+off,cy+off]
    ].forEach(
      ([dx,dy])=>{

        x.fillStyle=COL[p];

        x.beginPath();

        x.arc(
          dx,
          dy,
          u*.5,
          0,
          7
        );

        x.fill();

        x.strokeStyle='#fff';
        x.lineWidth=1.5;
        x.stroke();

      }
    );

    /* مسیر رنگی */

    x.fillStyle=COL[p];

    for(let j=0;j<5;j++){

      const q=
        COLM[p](j);

      rr(
        x,
        q[0]*u+2,
        q[1]*u+2,
        u-4,
        u-4,
        6
      );

      x.fill();

    }

    x.globalAlpha=1;

  }

  /* TRACK */

  TRACK.forEach(
    (q,i)=>{

      x.fillStyle=
        i%13===0
          ?COL[i/13]
          :'#eef1fb';

      rr(
        x,
        q[0]*u+2,
        q[1]*u+2,
        u-4,
        u-4,
        6
      );

      x.fill();

      if(
        SAFE.includes(i)&&
        i%13
      ){

        x.fillStyle='#8892b8';

        x.font=
          u*.6+'px sans-serif';

        x.textAlign='center';
        x.textBaseline='middle';

        x.fillText(
          '★',
          (q[0]+.5)*u,
          (q[1]+.5)*u
        );

      }

    }
  );

  /* CENTER */

  const cc=7.5*u;

  [
    [[6,6],[6,9],0],
    [[6,6],[9,6],1],
    [[9,6],[9,9],2],
    [[6,9],[9,9],3]
  ].forEach(
    ([a,b,p])=>{

      x.fillStyle=COL[p];

      x.beginPath();

      x.moveTo(
        a[0]*u,
        a[1]*u
      );

      x.lineTo(
        b[0]*u,
        b[1]*u
      );

      x.lineTo(
        cc,
        cc
      );

      x.fill();

    }
  );

  /* PAWNS */

  const L=[];

  G.pawns.forEach(
    (a,p)=>
      G.active[p]&&
      a.forEach(
        (i,k)=>
          L.push([
            p,
            k,
            D[p][k]
          ])
      )
  );

  L.sort(
    (a,b)=>
      a[2].y-b[2].y
  );

  const tm=
    performance.now()/300;

  for(
    const [p,k,d]
    of L
  ){

    const px=d.x*u;
    const py=d.y*u;
    const z=d.z*u;

    const on=
      G.legal.includes(k)&&
      p===G.turn&&
      G.phase==='pick';

    /* سایه */

    x.fillStyle='#0006';

    x.beginPath();

    x.ellipse(
      px,
      py+u*.22,
      u*.28,
      u*.11,
      0,
      0,
      7
    );

    x.fill();

    const y=py-z;

    if(on){

      x.strokeStyle='#fff';
      x.lineWidth=3;

      x.globalAlpha=
        .6+
        .4*Math.sin(tm*2);

      x.beginPath();

      x.arc(
        px,
        y,
        u*(.45+.05*Math.sin(tm*2)),
        0,
        7
      );

      x.stroke();

      x.shadowColor=COL[p];
      x.shadowBlur=18;
      x.globalAlpha=1;

    }

    /* مهره کمی بزرگ‌تر */

    const b=
      x.createLinearGradient(
        px-u*.30,
        0,
        px+u*.30,
        0
      );

    b.addColorStop(
      0,
      COL[p]
    );

    b.addColorStop(
      .4,
      '#fff8'
    );

    b.addColorStop(
      1,
      '#0007'
    );

    x.fillStyle=COL[p];

    x.beginPath();

    x.moveTo(
      px-u*.30,
      y+u*.27
    );

    x.quadraticCurveTo(
      px-u*.09,
      y-u*.03,
      px-u*.11,
      y-u*.14
    );

    x.lineTo(
      px+u*.11,
      y-u*.14
    );

    x.quadraticCurveTo(
      px+u*.09,
      y-u*.03,
      px+u*.30,
      y+u*.27
    );

    x.closePath();

    x.fill();

    x.fillStyle=b;

    x.globalAlpha=.5;

    x.fill();

    x.globalAlpha=1;

    /* سر مهره */

    const h=
      x.createRadialGradient(
        px-u*.05,
        y-u*.35,
        1,
        px,
        y-u*.29,
        u*.22
      );

    h.addColorStop(
      0,
      '#fff'
    );

    h.addColorStop(
      1,
      COL[p]
    );

    x.fillStyle=h;

    x.beginPath();

    x.arc(
      px,
      y-u*.29,
      u*.20,
      0,
      7
    );

    x.fill();

    x.shadowBlur=0;

  }

  /* PARTICLES */

  P=P.filter(
    q=>q.l-->0
  );

  for(const q of P){

    q.x+=q.vx;
    q.y+=q.vy;
    q.vy+=.006;

    x.fillStyle=q.c;

    x.fillRect(
      q.x*u,
      q.y*u,
      5,
      5
    );

  }

  requestAnimationFrame(draw);

}

/* =========================
   BOARD TOUCH
   ========================= */

$('#c').addEventListener(
  'pointerdown',
  e=>{

    if(
      !G||
      G.phase!=='pick'
    )return;

    const r=
      e.target.getBoundingClientRect();

    const u=size/15;

    const mx=
      (e.clientX-r.left)/u;

    const my=
      (e.clientY-r.top)/u;

    let b=null;
    let bd=1;

    G.legal.forEach(
      k=>{

        const d=
          D[G.turn][k];

        const dd=
          Math.hypot(
            d.x-mx,
            d.y-my
          );

        if(dd<bd){

          bd=dd;
          b=k;

        }

      }
    );

    if(b!==null)
      doMove(
        G.turn,
        b
      );

  }
);

/* =========================
   PAUSE
   ========================= */

$('#pause').onclick=()=>
  ui(`
    <h2>Pause</h2>

    <button
      class="btn"
      onclick="hideUI()"
    >
      ${t('resume')}
    </button>

    <button
      class="btn"
      onclick="rules()"
    >
      ${t('about')}
    </button>

    <button
      class="btn"
      onclick="menu()"
    >
      ${t('menu')}
    </button>
  `);

/* =========================
   SCREENS
   ========================= */

function ui(
  h,
  cls=''
){

  const u=$('#ui');

  u.innerHTML=`
    <div
      class="card ${cls}"
      dir="${S.settings.lang==='fa'?'rtl':'ltr'}"
    >
      ${h}
    </div>
  `;

  u.classList.add('on');

  sfx(500,.05);

}

function hideUI(){

  $('#ui').classList.remove('on');

}

function menu(){

  if(G&&!G.over)
    save();

  [
    '#hud',
    '#board-wrap'
  ].forEach(
    s=>$(s).hidden=true
  );

  const g=S.game;

  const lvl=
    1+
    S.profile.xp/100|0;

  ui(`

    <div class="lm-top">

      <div class="lm-avatar">
        🧑
      </div>

      <div class="lm-pill">
        ⭐ ${t('lvl')} ${lvl}
      </div>

      <div class="lm-pill">
        🪙 ${S.profile.coins}
      </div>

      <button
        class="lm-gear"
        onclick="settings()"
      >
        ⚙
      </button>

    </div>

    <div class="lm-crown">
      👑
    </div>

    <div class="lm-title">
      CINA<br>
      LUDO 3D
    </div>

    <div class="lm-list">

      ${
        g
          ?`
            <button
              class="lm-btn cont"
              onclick="start(0,0,0,S.game)"
            >
              <span class="ic">▶️</span>
              ${t('cont')}
            </button>
          `
          :''
      }

      <button
        class="lm-btn vs"
        onclick="setup(1)"
      >
        <span class="ic">🖥️</span>
        ${t('play')}
      </button>

      <button
        class="lm-btn local"
        onclick="setup(0)"
      >
        <span class="ic">👥</span>
        ${t('local')}
      </button>

      <button
        class="lm-btn online"
        disabled
      >
        <span class="ic">🌐</span>
        Online Multiplayer
      </button>

    </div>

    <div class="lm-bottom">

      <button
        onclick="stats()"
        title="${t('prof')}"
      >
        🏆
      </button>

      <button
        onclick="settings()"
        title="${t('set')}"
      >
        ⚙️
      </button>

      <button
        onclick="rules()"
        title="${t('about')}"
      >
        ❔
      </button>

    </div>

  `,'menu-card');

}

let cfg={
  n:4,
  lv:1
};

function setup(ai){

  const b=(
    k,
    v,
    l
  )=>
    `
      <button
        class="btn ${cfg[k]===v?'sel':''}"
        onclick="
          cfg.${k}=${v};
          setup(${ai})
        "
      >
        ${l}
      </button>
    `;

  ui(`

    <h2>${t('pl')}</h2>

    <div class="row">

      ${[
        2,
        3,
        4
      ].map(
        n=>b(
          'n',
          n,
          n
        )
      ).join('')}

    </div>

    ${
      ai
        ?`
          <div class="row">
            ${b('lv',0,t('easy'))}
            ${b('lv',1,t('med'))}
            ${b('lv',2,t('hard'))}
          </div>
        `
        :''
    }

    <button
      class="btn"
      onclick="
        G=null;
        start(
          cfg.n,
          cfg.lv,
          ${ai}
        )
      "
    >
      ${t('play')}
    </button>

    <button
      class="btn"
      onclick="menu()"
    >
      ${t('back')}
    </button>

  `);

}

function stats(){

  const p=S.profile;

  const lv=
    1+p.xp/100|0;

  const A=[
    [p.wins>=1,'a1'],
    [p.wins>=10,'a2'],
    [p.captures>=25,'a3'],
    [p.sixes>=20,'a4']
  ];

  ui(`

    <h2>
      ${t('prof')}
    </h2>

    <p>
      ${t('lvl')} ${lv}
      · XP ${p.xp%100}/100
    </p>

    <p>
      🪙 ${p.coins}
      ${t('coins')}
    </p>

    <p>
      ${t('games')}: ${p.games}
      · ${t('w')}: ${p.wins}
      · ${t('l')}: ${p.losses}
      · ${
        p.games
          ?Math.round(
            p.wins/p.games*100
          )
          :0
      }%
    </p>

    <p>
      ${t('cap')}: ${p.captures}
      · ${t('six')}: ${p.sixes}
    </p>

    ${
      A.map(
        a=>`
          <p
            class="ach ${a[0]?'on':''}"
          >
            ${a[0]?'🏆':'🔒'}
            ${t(a[1])}
          </p>
        `
      ).join('')
    }

    <button
      class="btn"
      onclick="menu()"
    >
      ${t('back')}
    </button>

  `);

}

function settings(){

  const s=S.settings;

  ui(`

    <h2>${t('set')}</h2>

    <div class="row">

      <button
        class="btn ${s.lang=='en'?'sel':''}"
        onclick="
          S.settings.lang='en';
          save();
          settings()
        "
      >
        English
      </button>

      <button
        class="btn ${s.lang=='fa'?'sel':''}"
        onclick="
          S.settings.lang='fa';
          save();
          settings()
        "
      >
        فارسی
      </button>

    </div>

    <button
      class="btn"
      onclick="
        S.settings.sound=!S.settings.sound;
        save();
        settings()
      "
    >
      ${t('sound')}:
      ${s.sound?'ON':'OFF'}
    </button>

    <button
      class="btn"
      onclick="
        S.settings.speed=
          S.settings.speed>=2
            ?.75
            :S.settings.speed+.5;
        save();
        settings()
      "
    >
      ${t('speed')}: ×${s.speed}
    </button>

    <button
      class="btn"
      onclick="
        ui(
          '<h2>${t('sure')}</h2>'+
          '<div class=row>'+
          '<button class=btn onclick=doReset()>${t('yes')}</button>'+
          '<button class=btn onclick=settings()>${t('no')}</button>'+
          '</div>'
        )
      "
    >
      ${t('reset')}
    </button>

    <button
      class="btn"
      onclick="menu()"
    >
      ${t('back')}
    </button>

  `);

}

function doReset(){

  localStorage.removeItem(
    'cina_ludo'
  );

  location.reload();

}

function rules(){

  ui(`

    <h2>
      ${t('about')}
    </h2>

    <p>
      ${t('help')}
    </p>

    <p>
      ${t('ab')}
    </p>

    <button
      class="btn"
      onclick="
        G&&!$('#hud').hidden
          ?hideUI()
          :menu()
      "
    >
      ${t('back')}
    </button>

  `);

}

/* =========================
   STARTUP
   ========================= */

addEventListener(
  'error',
  e=>
    console.warn(
      'Cina Ludo error:',
      e.message
    )
);

addEventListener(
  'unhandledrejection',
  e=>
    console.warn(
      e.reason
    )
);

load();

if(
  'serviceWorker' in navigator
){

  navigator.serviceWorker
    .register('sw.js')
    .catch(()=>{});

}

requestAnimationFrame(draw);

setTimeout(
  ()=>{
    $('#splash').style.opacity=0;

    setTimeout(
      ()=>$(
        '#splash'
      ).remove(),
      600
    );

    menu();

  },
  1600
);
