/* ============================================================
   TOOL ENGINE - Phân tích Tài Xỉu / MD5 / Sicbo / Baccarat
   ============================================================ */
const TEEngine = (()=>{
  const grp = s=>{
    if(!s.length)return[];
    const out=[];let d=s[0],c=1;
    for(let i=1;i<s.length;i++){if(s[i]===d)c++;else{out.push({k:d,n:c});d=s[i];c=1;}}
    out.push({k:d,n:c});return out;
  };

  class Yq{
    constructor(){this.ch=[];this.td=[];this.xx=[];this.max=500;this.ng={1:6,2:8,3:10,4:14,5:18,6:22};}
    dice(it){
      const maps=[['dice1','dice2','dice3'],['xucxac1','xucxac2','xucxac3'],['d1','d2','d3'],['x1','x2','x3'],['dice_1','dice_2','dice_3'],['xuc_xac_1','xuc_xac_2','xuc_xac_3']];
      for(const[a,b,c]of maps){if(it[a]!=null&&it[b]!=null&&it[c]!=null){const arr=[+it[a],+it[b],+it[c]];if(arr.every(n=>n>=1&&n<=6))return arr;}}
      for(const f of['dice','dices','xucxac','xuc_xac','xuc_xac_arr']){if(Array.isArray(it[f])&&it[f].length>=3){const arr=it[f].slice(0,3).map(Number);if(arr.every(n=>n>=1&&n<=6))return arr;}}
      return null;
    }
    nap(items){
      this.ch=[];this.td=[];this.xx=[];
      for(const it of items){
        const r=it.resultTruyenThong||it.result||it.ketQua;
        if(r!=='TAI'&&r!=='XIU')continue;
        this.ch.push(r);const d=this.dice(it);this.xx.push(d);this.td.push(d?d[0]+d[1]+d[2]:null);
      }
      if(this.ch.length>this.max){const c=-this.max;this.ch=this.ch.slice(c);this.td=this.td.slice(c);this.xx=this.xx.slice(c);}
    }
    ngM(k){return this.ng[k]||22;}
    fg(fp,hc=null){
      const c=this.ch,k=fp.length;if(!k)return{t:0,x:0,s:0,v:[]};
      const tot=fp.reduce((a,b)=>a+b,0);let t=0,x=0;const v=[];
      for(let st=0;st<c.length-tot;st++){
        let p=st,ok=true,ht=null,hc2=null;
        for(const dd of fp){
          if(p+dd>c.length){ok=false;break;}
          const seg=c.slice(p,p+dd);
          if(new Set(seg).size!==1){ok=false;break;}
          const h=seg[0];if(ht!==null&&h===ht){ok=false;break;}ht=h;hc2=h;p+=dd;
        }
        if(!ok)continue;
        if(hc!==null&&hc2!==hc)continue;
        if(st>0&&c[st-1]===c[st])continue;
        if(p>=c.length)continue;
        if(c[p]==='TAI')t++;else x++;v.push(p);
      }
      return{t,x,s:t+x,v};
    }
    pattern(){
      const g=this.ch.slice(-24);if(g.length<3)return null;
      const nh=grp(g);if(!nh.length)return null;
      const h=nh[nh.length-1].k,dn=nh[nh.length-1].n;
      const kMax=Math.min(6,nh.length);
      for(let k=kMax;k>=1;k--){
        const fp=nh.slice(-k).map(n=>n.n);
        const{s}=this.fg(fp,h);if(s>=this.ngM(k))return{fp,h,k};
      }
      return{fp:[dn],h,k:1};
    }
    hist(p){
      if(!p)return{t:null,x:null,s:0,v:[]};
      const{t,x,s,v}=this.fg(p.fp,p.h);
      if(s<this.ngM(p.fp.length))return{t:null,x:null,s,v};
      return{t:t/s*100,x:x/s*100,s,v};
    }
    fTong(){const a=this.td.filter(x=>x!=null);if(a.length<8)return null;const g=a.slice(-20);const m=a.reduce((x,y)=>x+y,0)/a.length;const mg=g.reduce((x,y)=>x+y,0)/g.length;const hi=g.filter(s=>s>=11).length;return{m,mg,xu:mg-m,r:hi/g.length,n:a.length};}
    fM1(){const c=this.ch;if(c.length<20)return null;let tt=0,tx=0,xt=0,xx=0;const w=c.slice(-80);for(let i=1;i<w.length;i++){const p=w[i-1],n=w[i];if(p==='TAI'&&n==='TAI')tt++;else if(p==='TAI'&&n==='XIU')tx++;else if(p==='XIU'&&n==='TAI')xt++;else xx++;}const last=c[c.length-1];const pt=last==='TAI'?(tt+1)/(tt+tx+2):(xt+1)/(xt+xx+2);return{pt,px:1-pt,last};}
    fM2(){const c=this.ch;if(c.length<30)return null;const a=c[c.length-2],b=c[c.length-1];let t=0,x=0;for(let i=0;i<c.length-2;i++){if(c[i]===a&&c[i+1]===b){if(c[i+2]==='TAI')t++;else x++;}}if(t+x<3)return null;return{s:t+x,pt:(t+1)/(t+x+2)};}
    fM3(){const c=this.ch;if(c.length<40)return null;const last=c.slice(-3).join('');let t=0,x=0,wt=0,wx=0;for(let i=0;i<c.length-3;i++){if(c.slice(i,i+3).join('')===last){const w=Math.pow(1.01,i);if(c[i+3]==='TAI'){t++;wt+=w;}else{x++;wx+=w;}}}if(t+x<3)return null;const wtot=wt+wx;return{s:t+x,pt:wtot>0?wt/wtot:.5};}
    fBet(){const c=this.ch;if(c.length<2)return 0;let b=1;for(let i=c.length-1;i>0;i--){if(c[i]===c[i-1])b++;else break;}return b;}
    fStreak(){const c=this.ch;if(c.length<30)return null;const nh=grp(c);if(nh.length<5)return null;const dn=nh[nh.length-1].n,h=nh[nh.length-1].k;let td=0,tm=0;for(let L=dn;L<20;L++){for(let i=0;i<c.length-L;i++){let ok=true;for(let j=0;j<L;j++)if(c[i+j]!==c[i]){ok=false;break;}if(!ok)continue;if(i>0&&c[i-1]===c[i])continue;if(i+L>=c.length)continue;tm++;if(c[i+L]===c[i])td++;}}if(tm<3)return null;const pt=td/tm;return{dn,h,pt,pv:1-pt,tm,gy:pt>.5?h:(h==='TAI'?'XIU':'TAI')};}
    fCycle(){const c=this.ch;if(c.length<12)return null;for(let p=2;p<=8;p++){if(c.length<p*3)continue;let k=0,tot=0;const sv=Math.min(6,Math.floor(c.length/p));const st=c.length-sv*p;for(let v=1;v<sv;v++){for(let i=0;i<p;i++){const a=st+(v-1)*p+i,b=st+v*p+i;if(a<c.length&&b<c.length){tot++;if(c[a]===c[b])k++;}}}if(!tot)continue;const r=k/tot;if(r>=.8){const nx=c.length%p,vtu=st+nx;if(vtu<c.length)return{p,r,g:c[vtu]};}}return null;}
    fAlt(){const c=this.ch;if(c.length<6)return null;let d=0;for(let i=c.length-1;i>c.length-6&&i>0;i--){if(c[i]!==c[i-1])d++;else break;}if(d>=4)return{d,g:c[c.length-1]==='TAI'?'XIU':'TAI'};return null;}
    fZig(){const c=this.ch;if(c.length<10)return null;const nh=grp(c);if(nh.length<4)return null;const d4=nh.slice(-4).map(n=>n.n);if(d4.every(d=>d===1))return{loai:'z1',r:.7};if(d4.every(d=>d===2))return{loai:'z2',r:.75};const[a,b,c2,d]=d4;if(a===c2&&b===d&&a!==b)return{loai:'cy',r:.7};return null;}
    fFib(){const c=this.ch;if(c.length<20)return null;const f=[1,1,2,3,5,8,13];const nh=grp(c);if(nh.length<5)return null;for(let l=4;l<=6;l++){if(nh.length<l)continue;const ds=nh.slice(-l).map(n=>n.n);let k=0;for(let i=0;i<l;i++)if(Math.abs(ds[i]-f[i])<=0)k++;if(k===l)return{r:.65+l*.03,h:nh[nh.length-1].k};}return null;}
    fNG(n){const c=this.ch;if(c.length<n+5)return null;const cur=c.slice(-n).join(',');let t=0,x=0;for(let i=0;i<=c.length-n-1;i++){if(c.slice(i,i+n).join(',')===cur&&i+n<c.length){if(c[i+n]==='TAI')t++;else x++;}}if(t+x<3)return null;return{n,t,x,s:t+x,r:t/(t+x)*100};}
    fKNN(){const c=this.ch,W=5;if(c.length<W+10)return null;const cur=c.slice(-W);const res=[];for(let i=0;i<c.length-W;i++){let k=0;for(let j=0;j<W;j++)if(c[i+j]===cur[j])k++;if(k>=W-1&&i+W<c.length)res.push({d:k,k:c[i+W]});}if(res.length<3)return null;res.sort((a,b)=>b.d-a.d);const top=res.slice(0,10);let t=0,x=0;for(const r of top)if(r.k==='TAI')t++;else x++;return{t,x,s:top.length,r:t/top.length*100};}
    fDice(){const a=this.xx.filter(x=>x!=null);if(a.length<10)return null;const g=a.slice(-20);const dm={1:0,2:0,3:0,4:0,5:0,6:0};for(const d of g)for(const v of d)dm[v]++;const s=Object.entries(dm).sort((a,b)=>b[1]-a[1]);const mn=+s[0][0];const tg=g.map(d=>d[0]+d[1]+d[2]);const mg=tg.reduce((x,y)=>x+y,0)/tg.length;return{mn,mg,ht:mg>10.5};}
    fDT(){const c=this.ch;if(c.length<30)return null;const k10=c.slice(-10).filter(x=>x==='TAI').length;const k30=c.slice(-30).filter(x=>x==='TAI').length;const k100=c.slice(-100).filter(x=>x==='TAI').length;const r10=k10/10,r30=k30/30,r100=k100/Math.min(100,c.length);return{r30:r30*100,dtT:r10>.55&&r30>.55&&r100>.52,dtX:r10<.45&&r30<.45&&r100<.48};}
    fEnt(){const c=this.ch;if(c.length<20)return 1;const g=c.slice(-30);const p=g.filter(x=>x==='TAI').length/g.length;if(!p||p===1)return 0;return-(p*Math.log2(p)+(1-p)*Math.log2(1-p));}
    fXung(){const c=this.ch;if(c.length<12)return null;let t=0,x=0;const g=c.slice(-12);for(let i=0;i<g.length;i++){const w=Math.pow(1.15,i);if(g[i]==='TAI')t+=w;else x+=w;}return{t:t/(t+x)*100,x:x/(t+x)*100};}
    fTrend(){const c=this.ch;if(c.length<20)return null;const g=c.slice(-30).map(x=>x==='TAI'?1:-1);const n=g.length;let sx=0,sy=0,sxy=0,sx2=0;for(let i=0;i<n;i++){sx+=i;sy+=g[i];sxy+=i*g[i];sx2+=i*i;}const sl=(n*sxy-sx*sy)/(n*sx2-sx*sx);return{sl,m:Math.min(1,Math.abs(sl)/.15),h:sl>0?'TAI':'XIU'};}
    fRev(){const c=this.ch;if(c.length<15)return null;const nh=grp(c);if(nh.length<5)return null;const dn=nh[nh.length-1].n;let tt=0,dc=0;for(let i=0;i<c.length-dn-1;i++){let ok=true;for(let j=0;j<dn;j++)if(c[i+j]!==c[i+dn-1]){ok=false;break;}if(!ok)continue;if(i+dn<c.length){if(c[i+dn]===c[i+dn-1])tt++;else dc++;}}if(tt+dc<3)return null;return{pd:dc/(tt+dc),pt:tt/(tt+dc)};}
    fVol(){const c=this.ch;if(c.length<15)return null;const g=c.slice(-25);let d=0;for(let i=1;i<g.length;i++)if(g[i]!==g[i-1])d++;const r=d/(g.length-1);return{r,cao:r>.65,thap:r<.35};}
    fSess(){const c=this.ch;if(c.length<30)return null;const g=c.slice(-30);return{r3:g.slice(20,30).filter(x=>x==='TAI').length/10};}
    fBay(){const c=this.ch;if(c.length<15)return null;let a=1,b=1;for(const x of c.slice(-40)){if(x==='TAI')a++;else b++;}const pt=a/(a+b);const v=(a*b)/((a+b)*(a+b)*(a+b+1));return{pt,px:1-pt,r:1-Math.sqrt(v)*4};}
    fMom(){const c=this.ch;if(c.length<15)return null;let t=0,x=0;const g=c.slice(-15);for(let i=0;i<g.length;i++){const w=Math.exp(-(g.length-1-i)/5);if(g[i]==='TAI')t+=w;else x+=w;}return{h:t>x?'TAI':'XIU',m:Math.abs(t-x)/(t+x)};}
    fRSI(p=14){const c=this.ch;if(c.length<p+1)return null;let gn=0,ls=0;const g=c.slice(-p-1);for(let i=1;i<g.length;i++){const cu=g[i]==='TAI'?1:0,pr=g[i-1]==='TAI'?1:0;const d=cu-pr;if(d>0)gn+=d;else ls-=d;}const ag=gn/p,al=ls/p;if(al===0)return 100;return 100-(100/(1+ag/al));}
    fBB(p=20,m=2){const a=this.td.filter(x=>x!=null);if(a.length<p)return null;const g=a.slice(-p);const mean=g.reduce((x,y)=>x+y,0)/p;const v=g.reduce((x,y)=>x+(y-mean)*(y-mean),0)/p;const sd=Math.sqrt(v);const last=g[g.length-1];let vt='g';if(last>=mean+m*sd)vt='t';else if(last<=mean-m*sd)vt='d';return{mean,vt,sd};}
    fWS(){const c=this.ch;if(c.length<10)return null;const nh=grp(c);if(nh.length<3)return null;const last=nh[nh.length-1];let tt=0,pv=0,wt=0,wp=0;for(let i=0;i<nh.length-1;i++){if(nh[i].n===last.n&&nh[i].k===last.k){const w=Math.pow(1.02,i);if(nh[i+1].k===last.k){tt++;wt+=w;}else{pv++;wp+=w;}}}if(tt+pv<2)return null;const wtt=wt+wp;return{s:tt+pv,pt:wtt>0?wt/wtt:.5,h:last.k};}
    fZone(){const c=this.ch;if(c.length<30)return null;const nh=grp(c);if(nh.length<6)return null;const last=nh[nh.length-1];const z=last.n<=2?'short':(last.n<=4?'mid':'long');let tt=0,pv=0;for(let i=0;i<nh.length-1;i++){const nz=nh[i].n<=2?'short':(nh[i].n<=4?'mid':'long');if(nz===z){if(nh[i+1].k===last.k)tt++;else pv++;}}if(tt+pv<3)return null;return{z,s:tt+pv,pt:tt/(tt+pv),h:last.k};}
    fShift(){const c=this.ch;if(c.length<60)return null;const recent=c.slice(-20).filter(x=>x==='TAI').length/20;const past=c.slice(-100,-20).filter(x=>x==='TAI').length/Math.min(80,c.length-20);return{recent,past,shift:recent-past};}
    fMTF(){const c=this.ch;if(c.length<50)return null;const frames=[5,10,20,30,50];let taiVote=0;const votes=[];for(const f of frames){const seg=c.slice(-f);const r=seg.filter(x=>x==='TAI').length/f;if(r>.5)taiVote++;votes.push(r);}return{taiVote,total:frames.length,votes,strong:taiVote>=4||taiVote<=1};}
    scan(){
      const p=this.pattern();const h=this.hist(p);let rt=h.t;
      if(rt===null&&this.ch.length>=5)rt=this.ch.filter(x=>x==='TAI').length/this.ch.length*100;
      if(rt===null)return{gy:null,rt:50,rx:50,tin:{},n:0};
      const tin={fTong:this.fTong(),fM1:this.fM1(),fM2:this.fM2(),fM3:this.fM3(),fBet:this.fBet(),fStreak:this.fStreak(),fCycle:this.fCycle(),fAlt:this.fAlt(),fZig:this.fZig(),fFib:this.fFib(),fNG2:this.fNG(2),fNG3:this.fNG(3),fNG4:this.fNG(4),fNG5:this.fNG(5),fKNN:this.fKNN(),fDice:this.fDice(),fDT:this.fDT(),fEnt:this.fEnt(),fXung:this.fXung(),fTrend:this.fTrend(),fRev:this.fRev(),fVol:this.fVol(),fSess:this.fSess(),fBay:this.fBay(),fMom:this.fMom(),fRSI:this.fRSI(),fBB:this.fBB(),fWS:this.fWS(),fZone:this.fZone(),fShift:this.fShift(),fMTF:this.fMTF()};
      return{gy:rt>=50?'TAI':'XIU',rt,rx:100-rt,n:h.s||this.ch.length,tin};
    }
  }

  class Zw{
    constructor(){
      this.w={fTong:.04,fM1:.05,fM2:.05,fM3:.05,fBet:.05,fStreak:.05,fCycle:.08,fAlt:.06,fZig:.04,fFib:.03,fNG:.07,fKNN:.06,fDice:.03,fDT:.04,fXung:.04,fTrend:.05,fRev:.04,fVol:.03,fSess:.03,fBay:.04,fMom:.04,fRSI:.05,fBB:.04,fWS:.05,fMau:.06,fLech:.05,fZone:.05,fShift:.04,fMTF:.06,fAnti:.05};
      this.hs={};for(const k of Object.keys(this.w))this.hs[k]={d:0,t:0};this.prev=null;this.wrongStreak=0;
    }
    track(kq){
      if(!this.prev)return;
      for(const k of Object.keys(this.hs)){const dk=this.prev.dt[k];if(dk==null)continue;this.hs[k].t++;const h=dk>=.5?this.prev.g:(this.prev.g==='TAI'?'XIU':'TAI');if(h===kq)this.hs[k].d++;}
      if(this.prev.g===kq)this.wrongStreak=0;else this.wrongStreak++;
      this.prev=null;
    }
    tw(k){const h=this.hs[k];const base=this.w[k]||.03;if(!h||h.t<5)return base;const r=h.d/h.t;return base*(.5+1/(1+Math.exp(-(r-.5)*8))*1.2);}
    calc(c,gy,n,rt,th){
      if(!c.length||!gy)return 0;
      const dt={};
      dt.fMau=Math.min(1,Math.log10(n+1)/Math.log10(41));
      const rg=gy==='TAI'?rt:(100-rt);
      dt.fLech=Math.min(1,Math.max(0,(rg-50)/32));
      dt.fM1=0;if(th.fM1){const p=gy==='TAI'?th.fM1.pt:th.fM1.px;dt.fM1=Math.min(1,Math.max(0,(p-.5)*2));}
      dt.fM2=0;if(th.fM2){const p=gy==='TAI'?th.fM2.pt:1-th.fM2.pt;dt.fM2=Math.min(1,Math.max(0,(p-.5)*2))*Math.min(1,th.fM2.s/10);}
      dt.fM3=0;if(th.fM3){const p=gy==='TAI'?th.fM3.pt:1-th.fM3.pt;dt.fM3=Math.min(1,Math.max(0,(p-.5)*2))*Math.min(1,th.fM3.s/8);}
      dt.fTong=0;if(th.fTong){const p=gy==='TAI'?th.fTong.r:1-th.fTong.r;dt.fTong=Math.min(1,Math.max(0,(p-.5)*2));}
      dt.fCycle=0;if(th.fCycle){dt.fCycle=th.fCycle.g===gy?th.fCycle.r:0;}
      dt.fAlt=0;if(th.fAlt){dt.fAlt=th.fAlt.g===gy?Math.min(1,th.fAlt.d/6):0;}
      dt.fZig=0;if(th.fZig){const hd=c[c.length-1]==='TAI'?'XIU':'TAI';if(gy===hd)dt.fZig=th.fZig.r;}
      dt.fFib=0;if(th.fFib){const hd=th.fFib.h==='TAI'?'XIU':'TAI';if(gy===hd)dt.fFib=th.fFib.r;}
      dt.fStreak=0;if(th.fStreak){dt.fStreak=th.fStreak.gy===gy?Math.abs(th.fStreak.pt-.5)*2*Math.min(1,th.fStreak.tm/15):0;}
      dt.fBet=Math.min(1,(th.fBet||0)/8);
      let dn=0,cn=0;for(const k of['fNG2','fNG3','fNG4','fNG5']){if(th[k]){const p=gy==='TAI'?th[k].r:100-th[k].r;dn+=Math.min(1,Math.max(0,(p-50)/40))*Math.min(1,th[k].s/12);cn++;}}
      dt.fNG=cn>0?dn/cn:0;
      dt.fKNN=0;if(th.fKNN){const p=gy==='TAI'?th.fKNN.r:100-th.fKNN.r;dt.fKNN=Math.min(1,Math.max(0,(p-50)/45))*Math.min(1,th.fKNN.s/8);}
      dt.fDice=0;if(th.fDice){const ok=(th.fDice.ht&&gy==='TAI')||(!th.fDice.ht&&gy==='XIU');dt.fDice=ok?Math.min(1,Math.abs(th.fDice.mg-10.5)/4):0;}
      dt.fDT=0;if(th.fDT){if(gy==='TAI'&&th.fDT.dtT)dt.fDT=1;else if(gy==='XIU'&&th.fDT.dtX)dt.fDT=1;else{const p=th.fDT.r30/100;const pg=gy==='TAI'?p:1-p;dt.fDT=Math.min(1,Math.max(0,(pg-.5)*2))*.6;}}
      dt.fXung=0;if(th.fXung){const p=gy==='TAI'?th.fXung.t:th.fXung.x;dt.fXung=Math.min(1,Math.max(0,(p-50)/40));}
      dt.fTrend=0;if(th.fTrend)dt.fTrend=th.fTrend.h===gy?th.fTrend.m:0;
      dt.fRev=0;if(th.fRev){const hc=c[c.length-1],hd=hc==='TAI'?'XIU':'TAI';if(gy===hd)dt.fRev=th.fRev.pd;else if(gy===hc)dt.fRev=th.fRev.pt;}
      dt.fVol=0;if(th.fVol){const hc=c[c.length-1],hd=hc==='TAI'?'XIU':'TAI';if(th.fVol.cao&&gy===hd)dt.fVol=.7;else if(th.fVol.thap&&gy===hc)dt.fVol=.7;else dt.fVol=.3;}
      dt.fSess=0;if(th.fSess){const p=gy==='TAI'?th.fSess.r3:1-th.fSess.r3;dt.fSess=Math.min(1,Math.max(0,(p-.5)*2));}
      dt.fBay=0;if(th.fBay){const p=gy==='TAI'?th.fBay.pt:th.fBay.px;dt.fBay=Math.min(1,Math.max(0,(p-.5)*2))*th.fBay.r;}
      dt.fMom=0;if(th.fMom)dt.fMom=th.fMom.h===gy?th.fMom.m:0;
      dt.fRSI=0;if(th.fRSI!=null){if(th.fRSI>=70)dt.fRSI=gy==='XIU'?Math.min(1,(th.fRSI-70)/25):0;else if(th.fRSI<=30)dt.fRSI=gy==='TAI'?Math.min(1,(30-th.fRSI)/25):0;else dt.fRSI=Math.min(1,Math.abs(th.fRSI-50)/30)*(gy===(th.fRSI>50?'TAI':'XIU')?.35:0);}
      dt.fBB=0;if(th.fBB){if(th.fBB.vt==='t')dt.fBB=gy==='XIU'?.85:0;else if(th.fBB.vt==='d')dt.fBB=gy==='TAI'?.85:0;else{const p=th.fBB.mean/21;const pg=gy==='TAI'?p:1-p;dt.fBB=Math.min(1,Math.max(0,(pg-.5)*2))*.4;}}
      dt.fWS=0;if(th.fWS){const ok=th.fWS.h===gy;const p=ok?th.fWS.pt:(1-th.fWS.pt);dt.fWS=Math.min(1,Math.max(0,(p-.5)*2))*Math.min(1,th.fWS.s/6);}
      dt.fZone=0;if(th.fZone){const ok=th.fZone.h===gy;const p=ok?th.fZone.pt:(1-th.fZone.pt);dt.fZone=Math.min(1,Math.max(0,(p-.5)*2))*Math.min(1,th.fZone.s/8);}
      dt.fShift=0;if(th.fShift){const s=th.fShift.shift;if(Math.abs(s)>.15){const hint=s>0?'TAI':'XIU';dt.fShift=gy===hint?Math.min(1,Math.abs(s)*3):0;}else{const pg=gy==='TAI'?th.fShift.recent:1-th.fShift.recent;dt.fShift=Math.min(1,Math.max(0,(pg-.5)*2))*.4;}}
      dt.fMTF=0;if(th.fMTF&&th.fMTF.strong){const hint=th.fMTF.taiVote>=4?'TAI':'XIU';dt.fMTF=gy===hint?Math.min(1,Math.abs(th.fMTF.taiVote-2.5)/2.5):0;}
      dt.fAnti=0;
      let diem=0,tw=0;for(const k of Object.keys(dt)){if(dt[k]==null)continue;const w=this.tw(k);diem+=dt[k]*w;tw+=w;}
      if(tw>0)diem/=tw;
      let dy=0,pd=0;for(const k of Object.keys(dt)){if(dt[k]==null)continue;if(dt[k]>=.7)dy++;else if(dt[k]<=.2&&k!=='fBet'&&k!=='fAlt'&&k!=='fCycle')pd++;}
      diem=Math.min(1,Math.max(0,diem+Math.min(1,dy/8)*.18-(pd>=5?.1:0)));
      if(th.fEnt>.98)diem*=.85;else if(th.fEnt>.92)diem*=.93;
      if(th.fCycle&&th.fCycle.r>=.9&&th.fCycle.g===gy)diem=Math.min(1,diem+.12);
      if(th.fAlt&&th.fAlt.d>=5&&th.fAlt.g===gy)diem=Math.min(1,diem+.08);
      if(th.fTrend&&th.fTrend.m>=.8&&th.fTrend.h===gy)diem=Math.min(1,diem+.06);
      if(th.fRSI!=null&&(th.fRSI>=75||th.fRSI<=25))diem=Math.min(1,diem+.05);
      if(th.fBB&&th.fBB.vt!=='g')diem=Math.min(1,diem+.04);
      if(th.fMTF&&th.fMTF.strong&&th.fMTF.taiVote>=4&&gy==='TAI')diem=Math.min(1,diem+.05);
      if(th.fMTF&&th.fMTF.strong&&th.fMTF.taiVote<=1&&gy==='XIU')diem=Math.min(1,diem+.05);
      if(this.wrongStreak>=3)diem=Math.min(1,diem*.9);
      this.prev={g:gy,dt};
      return Math.round(diem*100);
    }
  }

  return {Yq,Zw,grp};
})();

window.TEEngine = TEEngine;
