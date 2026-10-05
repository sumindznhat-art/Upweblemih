/* ============================================================
   TOOL VIEWER + PANELS
   ============================================================ */
let activeTool=null;
let toolTimers=[];

function openToolViewer(tool){
  const u=currentUser();
  if(!u)return;
  const isVIP=u.isAdmin||(u.keyExpiry&&u.keyExpiry>now());
  if(tool.vip&&!isVIP){
    alert('🔒 Tool này yêu cầu VIP!\nVui lòng nâng cấp gói VIP để sử dụng.');
    showPage('vip');return;
  }
  if(tool.maintenance){
    alert('🚧 Tool đang bảo trì!\nVui lòng quay lại sau.');
    return;
  }
  activeTool=tool;
  const tv=document.getElementById('tool-viewer');
  document.getElementById('tvName').textContent=tool.name;
  document.getElementById('tvLogo').src=tool.image||'';
  const frame=document.getElementById('tvFrame');
  frame.src=tool.game_url||'about:blank';
  // clear old panels
  document.querySelectorAll('#tvBody .panel, #tvBody .bc-panel').forEach(p=>p.remove());
  toolTimers.forEach(t=>clearInterval(t));toolTimers=[];
  tv.classList.add('show');
  if(tool.kind==='baccarat') createBaccaratPanel(tool);
  else createTxPanel(tool);
}

function closeToolViewer(){
  document.getElementById('tool-viewer').classList.remove('show');
  document.getElementById('tvFrame').src='about:blank';
  toolTimers.forEach(t=>clearInterval(t));toolTimers=[];
  document.querySelectorAll('#tvBody .panel, #tvBody .bc-panel').forEach(p=>p.remove());
  activeTool=null;
}

function makeDraggable(el,handle){
  let drag=false,sx,sy,ix,iy;
  handle.addEventListener('pointerdown',e=>{
    if(e.target.closest('.panel-toggle'))return;
    drag=true;sx=e.clientX;sy=e.clientY;ix=el.offsetLeft;iy=el.offsetTop;
    try{el.setPointerCapture(e.pointerId);}catch(_){}
  });
  handle.addEventListener('pointermove',e=>{
    if(!drag)return;
    const dx=e.clientX-sx,dy=e.clientY-sy;
    requestAnimationFrame(()=>{el.style.left=(ix+dx)+'px';el.style.top=(iy+dy)+'px';el.style.right='auto';});
  });
  const stop=()=>drag=false;
  handle.addEventListener('pointerup',stop);
  handle.addEventListener('pointercancel',stop);
}

/* ===== TÀI XỈU / MD5 / SICBO PANEL ===== */
function createTxPanel(tool){
  const isMd5=tool.slug.includes('md5');
  const panel=document.createElement('div');
  panel.className='panel';
  panel.style.top='80px';
  panel.style.left='14px';
  panel.innerHTML=`
    <div class="panel-head">
      <div class="panel-title"><span class="dot"></span>${isMd5?'MD5':'TÀI XỈU'}</div>
      <button class="panel-toggle">−</button>
    </div>
    <div class="panel-body">
      <div class="panel-session">#-----</div>
      <div class="tx-circles">
        <div class="ci tai"><div class="lb">TÀI</div><div class="vl">--%</div></div>
        <div class="ci xiu"><div class="lb">XỈU</div><div class="vl">--%</div></div>
      </div>
      <div class="conf-display hidden"><div class="lv">--</div><div class="nm">0%</div></div>
      <div class="conf-bar"><div class="conf-bar-fill"></div></div>
      <div class="panel-status">Đang kết nối...</div>
    </div>
  `;
  document.getElementById('tvBody').appendChild(panel);
  makeDraggable(panel,panel.querySelector('.panel-head'));
  panel.querySelector('.panel-toggle').addEventListener('click',()=>{
    panel.classList.toggle('collapsed');
    panel.querySelector('.panel-toggle').textContent=panel.classList.contains('collapsed')?'+':'−';
  });

  const eng=new TEEngine.Yq();
  const ai=new TEEngine.Zw();
  let lastSid=null,im=false,lastGy=null;
  const $sess=panel.querySelector('.panel-session');
  const $tai=panel.querySelector('.ci.tai');
  const $xiu=panel.querySelector('.ci.xiu');
  const $conf=panel.querySelector('.conf-display');
  const $bar=panel.querySelector('.conf-bar-fill');
  const $st=panel.querySelector('.panel-status');

  function setCircles(gy,active,rt,rx){
    $tai.className='ci tai';$xiu.className='ci xiu';
    if(rt!=null&&rx!=null){
      $tai.querySelector('.vl').textContent=Math.round(rt)+'%';
      $xiu.querySelector('.vl').textContent=Math.round(rx)+'%';
    }else{
      $tai.querySelector('.vl').textContent='--%';
      $xiu.querySelector('.vl').textContent='--%';
    }
    if(!gy)return;
    const el=gy==='TAI'?$tai:$xiu;
    el.classList.add(active?'active':'resting');
  }
  function setConf(d,show){
    if(!show||d<50){$conf.classList.add('hidden');$bar.style.width='0%';return;}
    let lv='',cls='';
    if(d>=80){lv='CAO';cls='high';}else if(d>=70){lv='ỔN';cls='ok';}else{lv='TRUNG BÌNH';cls='mid';}
    $conf.querySelector('.lv').textContent=lv;
    $conf.querySelector('.nm').textContent=d+'%';
    $conf.className='conf-display '+cls;
    $bar.style.width=Math.min(100,d)+'%';
  }
  async function tick(){
    try{
      const r=await fetch(tool.api_url,{cache:'no-store'});
      if(!r.ok)throw 0;
      const data=await r.json();
      const list=data.list||data.data||data.sessions||data.result||data.history||data.items;
      if(!Array.isArray(list)||!list.length)throw 0;
      const asc=[...list].sort((a,b)=>(a.id||0)-(b.id||0));
      const nid=list[0].id??asc[asc.length-1].id;
      if(lastSid!==null&&nid!==lastSid){
        const last=asc[asc.length-1];
        const kq=last.resultTruyenThong||last.result||last.ketQua;
        if(lastGy&&kq)ai.track(kq);
        im=true;setCircles(null,false,null,null);setConf(0,false);
        $sess.textContent='#'+nid;$st.textContent='Đang chờ...';$st.classList.remove('blink');
        setTimeout(()=>{im=false;analyze(asc,nid);},5000);
        lastSid=nid;return;
      }
      lastSid=nid;$sess.textContent='#'+(nid+1);
      if(!im)analyze(asc,nid);
    }catch(e){$st.textContent='Đang kết nối...';$st.classList.remove('blink');}
  }
  function analyze(asc,nid){
    eng.nap(asc);
    const qs=eng.scan();
    $sess.textContent='#'+(nid+1);
    if(qs.gy){
      const d=ai.calc(eng.ch,qs.gy,qs.n,qs.rt,qs.tin);
      setCircles(qs.gy,true,qs.rt,qs.rx);setConf(d,true);
      $st.textContent='Đang chờ...';$st.classList.add('blink');lastGy=qs.gy;
    }else{
      setCircles(null,false,null,null);setConf(0,false);
      $st.textContent='Đang chờ...';$st.classList.remove('blink');lastGy=null;
    }
  }
  tick();
  toolTimers.push(setInterval(tick,4000));
}

/* ===== BACCARAT PANEL ===== */
function createBaccaratPanel(tool){
  const panel=document.createElement('div');
  panel.className='bc-panel';
  panel.style.top='80px';
  panel.style.left='14px';
  panel.innerHTML=`
    <div class="panel-head" style="cursor:move">
      <div class="bc-title">🎴 BACCARAT AI</div>
      <button class="panel-toggle">−</button>
    </div>
    <div class="panel-body">
      <div class="bc-sub">Dự đoán cửa thắng tiếp theo</div>
      <div class="bc-pred">
        <div class="p banker"><div class="lb">BANKER</div><div class="vl">--%</div></div>
        <div class="p player"><div class="lb">PLAYER</div><div class="vl">--%</div></div>
        <div class="p tie"><div class="lb">TIE</div><div class="vl">--%</div></div>
      </div>
      <div class="bc-hist-title">Lịch sử gần đây</div>
      <div class="bc-hist"></div>
      <div class="bc-hist-title">Thống kê 30 ván</div>
      <div class="bc-stats">
        <div class="s"><div>BANKER</div><div class="n">0</div></div>
        <div class="s"><div>PLAYER</div><div class="n">0</div></div>
        <div class="s"><div>TIE</div><div class="n">0</div></div>
      </div>
      <div class="panel-status" style="margin-top:10px">Đang kết nối...</div>
    </div>
  `;
  document.getElementById('tvBody').appendChild(panel);
  makeDraggable(panel,panel.querySelector('.panel-head'));
  panel.querySelector('.panel-toggle').addEventListener('click',()=>{
    panel.classList.toggle('collapsed');
    panel.querySelector('.panel-toggle').textContent=panel.classList.contains('collapsed')?'+':'−';
  });

  const $b=panel.querySelector('.p.banker .vl');
  const $p=panel.querySelector('.p.player .vl');
  const $t=panel.querySelector('.p.tie .vl');
  const $hist=panel.querySelector('.bc-hist');
  const $stats=panel.querySelectorAll('.bc-stats .n');
  const $st=panel.querySelector('.panel-status');
  let history=[];

  function render(){
    // predict
    const cnt={B:0,P:0,T:0};
    const recent=history.slice(-30);
    recent.forEach(x=>{if(x==='B'||x==='Banker')cnt.B++;else if(x==='P'||x==='Player')cnt.P++;else cnt.T++;});
    const tot=recent.length||1;
    const pb=cnt.B/tot*100,pp=cnt.P/tot*100,pt=cnt.T/tot*100;
    $b.textContent=Math.round(pb)+'%';
    $p.textContent=Math.round(pp)+'%';
    $t.textContent=Math.round(pt)+'%';
    panel.querySelector('.p.banker').classList.remove('active');
    panel.querySelector('.p.player').classList.remove('active');
    panel.querySelector('.p.tie').classList.remove('active');
    // highlight last trend
    const last=history[history.length-1];
    if(last==='B'||last==='Banker')panel.querySelector('.p.banker').classList.add('active');
    else if(last==='P'||last==='Player')panel.querySelector('.p.player').classList.add('active');
    else if(last==='T'||last==='Tie')panel.querySelector('.p.tie').classList.add('active');
    // history grid
    $hist.innerHTML='';
    for(let i=0;i<18;i++){
      const idx=history.length-18+i;
      const el=document.createElement('div');
      el.className='h '+(idx>=0?(history[idx]==='B'||history[idx]==='Banker'?'banker':history[idx]==='P'||history[idx]==='Player'?'player':history[idx]==='T'||history[idx]==='Tie'?'tie':'empty'):'empty');
      el.textContent=idx>=0?(history[idx]==='B'||history[idx]==='Banker'?'B':history[idx]==='P'||history[idx]==='Player'?'P':history[idx]==='T'||history[idx]==='Tie'?'T':''):'';
      $hist.appendChild(el);
    }
    $stats[0].textContent=cnt.B;$stats[1].textContent=cnt.P;$stats[2].textContent=cnt.T;
  }

  function parseItem(it){
    const r=(it.result||it.ketQua||it.outcome||it.winner||'').toString().toUpperCase();
    if(r.includes('BANK'))return 'B';
    if(r.includes('PLAY'))return 'P';
    if(r.includes('TIE')||r==='T')return 'T';
    if(r==='B')return 'B';if(r==='P')return 'P';
    return null;
  }
  async function tick(){
    try{
      const r=await fetch(tool.api_url,{cache:'no-store'});
      if(!r.ok)throw 0;
      const data=await r.json();
      let list=data.list||data.data||data.sessions||data.result||data.history||data.items;
      if(!Array.isArray(list))list=[];
      if(!list.length)throw 0;
      history=list.map(parseItem).filter(Boolean).reverse().slice(0,60);
      render();
      $st.textContent='Đã cập nhật lúc '+new Date().toLocaleTimeString('vi-VN');
    }catch(e){$st.textContent='Đang kết nối...';}
  }
  tick();
  toolTimers.push(setInterval(tick,6000));
}

/* ===== PAY / QR / NOTICE ===== */
function payVia(type){
  document.getElementById('depositSheet').classList.add('show');
}
function closeSheet(id){document.getElementById(id).classList.remove('show');}
function showPayInfo(type){
  closeSheet('depositSheet');
  if(type==='qr'){
    const cfg=loadConfig();
    const box=document.getElementById('qrBox');
    if(cfg.qr_base64){
      box.innerHTML=`<img src="${cfg.qr_base64}" style="max-width:100%;border-radius:14px;box-shadow:0 8px 22px rgba(0,0,0,.15)">`;
    }else{
      box.innerHTML=`<div style="padding:20px;color:#94a3b8;font-weight:700">⚠️ Admin chưa cấu hình QR</div>`;
    }
    document.getElementById('qrModal').classList.add('show');
  }else{
    const cfg=loadConfig();
    alert('💳 Đổi Thẻ Cào\n\nVui lòng liên hệ Admin để đổi thẻ sang số dư ví.\n\nAdmin: leminhdz@gmail.com');
  }
}
function showNotice(){
  const cfg=loadConfig();
  document.getElementById('noticeTitle').textContent=cfg.notice_title||'📢 Thông báo';
  document.getElementById('noticeContent').textContent=cfg.notice||'(Chưa có thông báo)';
  document.getElementById('noticeModal').classList.add('show');
}
