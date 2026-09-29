'use strict';

const START=[0,13,26,39];
const SAFE=[0,8,13,21,26,34,39,47];

const abs=(p,i)=>(START[p]+i)%52;

function legal(s,p,r){
  const o=[];

  s.pawns[p].forEach((i,k)=>{
    if(i===-1?r===6:i+r<=56)
      o.push(k);
  });

  return o;
}

function apply(s,p,k,r){

  const a=s.pawns[p];

  const to=
    a[k]===-1
      ?0
      :a[k]+r;

  a[k]=to;

  const res={
    cap:[],
    home:to===56,
    to
  };

  if(to<=50){

    const c=abs(p,to);

    if(!SAFE.includes(c)){

      for(let q=0;q<4;q++){

        if(q!==p&&s.active[q]){

          s.pawns[q].forEach((j,m)=>{

            if(
              j>=0&&
              j<=50&&
              abs(q,j)===c
            ){

              s.pawns[q][m]=-1;

              res.cap.push({
                p:q,
                k:m
              });

            }

          });

        }

      }

    }

  }

  return res;
}

function danger(s,p,c){

  let d=0;

  for(let q=0;q<4;q++){

    if(q!==p&&s.active[q]){

      s.pawns[q].forEach(j=>{

        if(j>=0&&j<=50){

          const g=(c-abs(q,j)+52)%52;

          if(g>=1&&g<=6)d++;

        }

      });

    }

  }

  return d;
}

function pick(s,p,r,lv,m){

  if(lv===0)
    return m[Math.random()*m.length|0];

  let best=m[0];
  let bs=-1e9;

  for(const k of m){

    const i=s.pawns[p][k];

    const to=i===-1?0:i+r;

    let sc=to*.1+Math.random()*.5;

    if(to===56)sc+=50;

    if(i===-1)sc+=18;

    if(to>50)sc+=8;

    if(to<=50){

      const c=abs(p,to);
      const safe=SAFE.includes(c);

      if(safe)
        sc+=8;

      if(!safe){

        for(let q=0;q<4;q++){

          if(q!==p&&s.active[q]){

            s.pawns[q].forEach(j=>{

              if(
                j>=0&&
                j<=50&&
                abs(q,j)===c
              ){

                sc+=40+j*.3;

              }

            });

          }

        }

        if(lv===2)
          sc-=danger(s,p,c)*12;

      }

    }

    if(
      lv===2&&
      i>=0&&
      i<=50&&
      !SAFE.includes(abs(p,i))
    ){

      sc+=danger(s,p,abs(p,i))*10;

    }

    if(sc>bs){

      bs=sc;
      best=k;

    }

  }

  return best;
}
