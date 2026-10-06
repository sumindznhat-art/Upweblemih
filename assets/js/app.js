/* Avatar long-press */
(function(){
  const trigger=document.getElementById('avatarTrigger');if(!trigger)return;
  const HOLD_MS=1200;let timer=null,holding=false,sx=0,sy=0,moved=false;const TOL=12;
  function start(x,y){sx=x;sy=y;moved=false;holding=true;timer=setTimeout(()=>{if(!holding||moved)return;holding=false;openAvatarModal();},HOLD_MS);}
  function cancel(){holding=false;if(timer){clearTimeout(timer);timer=null;}}
  function move(x,y){if(!holding)return;if(Math.abs(x-sx)>TOL||Math.abs(y-sy)>TOL){moved=true;cancel();}}
  trigger.addEventListener('mousedown',e=>{e.preventDefault();start(e.clientX,e.clientY);});
  trigger.addEventListener('mousemove',e=>move(e.clientX,e.clientY));
  trigger.addEventListener('mouseup',cancel);trigger.addEventListener('mouseleave',cancel);
  trigger.addEventListener('touchstart',e=>{const t=e.touches[0];start(t.clientX,t.clientY);},{passive:true});
  trigger.addEventListener('touchmove',e=>{const t=e.touches[0];move(t.clientX,t.clientY);},{passive:true});
  trigger.addEventListener('touchend',cancel);trigger.addEventListener('touchcancel',cancel);
  trigger.addEventListener('contextmenu',e=>e.preventDefault());
})();
function openAvatarModal(){
  const m=document.getElementById('avatarModal');
  const inp=document.getElementById('avBase64Input');
  const pv=document.getElementById('avPreview');
  let s=null;try{s=localStorage.getItem(AVATAR_KEY);}catch(e){}
  document.getElementById('avStatus').textContent='';
  if(s){pv.innerHTML=`<img src="${s}">`;inp.value='';}else{pv.innerHTML='🎀';inp.value='';}
  m.classList.add('show');
}
function closeAvatarModal(){document.getElementById('avatarModal').classList.remove('show');}
function saveAvatar(){
  const inp=document.getElementById('avBase64Input');
  const st=document.getElementById('avStatus'),pv=document.getElementById('avPreview');
  const val=inp.value.trim();
  if(!val||val.length<50){st.style.color='#ef4444';st.textContent='⚠️ Base64 không hợp lệ!';return;}
  const src=normalizeAvatar(val);
  const img=new Image();
  img.onload=()=>{
    try{localStorage.setItem(AVATAR_KEY,src);}catch(e){}
    applyAvatarEverywhere(src);pv.innerHTML=`<img src="${src}">`;
    st.style.color='#10b981';st.textContent='✅ Đã lưu!';
    setTimeout(closeAvatarModal,900);
  };
  img.onerror=()=>{st.style.color='#ef4444';st.textContent='❌ Ảnh lỗi!';};
  img.src=src;
}
function resetAvatar(){
  try{localStorage.removeItem(AVATAR_KEY);}catch(e){}
  applyAvatarEverywhere(DEFAULT_AVATAR);
  document.getElementById('avPreview').innerHTML='🎀';
  document.getElementById('avBase64Input').value='';
  const st=document.getElementById('avStatus');st.style.color='#0ea5e9';st.textContent='↩️ Reset mặc định';
  setTimeout(()=>st.textContent='',1400);
}
/* Drawer */
function openDrawer(){
  document.getElementById('drawer').classList.add('show');
  document.getElementById('drawerMask').classList.add('show');
  const u=currentUser();if(!u)return;
  document.getElementById('drawerName').textContent=u.name||u.email.split('@')[0];
  document.getElementById('drawerEmail').textContent=u.email;
  document.getElementById('drawerAvatar').src=localStorage.getItem(AVATAR_KEY)||DEFAULT_AVATAR;
  document.getElementById('diAdmin').style.display=u.isAdmin?'flex':'none';
  const pend=loadDeposits().filter(d=>d.status==='pending');
  const pb=document.getElementById('pendBadge');
  pb.textContent=pend.length;
  pb.style.display=(u.isAdmin&&pend.length>0)?'inline-block':'none';
}
function closeDrawer(){
  document.getElementById('drawer').classList.remove('show');
  document.getElementById('drawerMask').classList.remove('show');
}
/* History */
function openHistoryDeposit(){
  closeDrawer();
  const u=currentUser();if(!u)return;
  const list=(u.history||[]).slice().reverse();
  document.getElementById('histTitle').textContent='💰 Lịch sử nạp tiền';
  const box=document.getElementById('histContent');
  if(!list.length)box.innerHTML='<div style="text-align:center;color:#94a3b8;font-weight:700;padding:20px">Chưa có giao dịch</div>';
  else{
    box.innerHTML='';
    list.forEach(h=>{
      const el=document.createElement('div');el.className='info-row';el.style.margin='0 0 8px';
      const color=h.amount>0?'#10b981':'#ef4444';
      el.innerHTML=`<div><div class="lbl">${h.type==='deposit'?'Nạp tiền':h.type==='admin'?'Admin':'Mua VIP'}</div>
        <div style="font-size:11px;color:#94a3b8">${fmtDate(h.at)}</div></div>
        <div style="text-align:right"><div class="val" style="color:${color}">${h.amount>0?'+':''}${fmt(h.amount)}</div>
        <div style="font-size:11px;color:#64748b">Số dư: ${fmt(h.balance)}</div></div>`;
      box.appendChild(el);
    });
  }
  document.getElementById('historyModal').classList.add('show');
}
function openHistoryKey(){
  closeDrawer();
  const u=currentUser();if(!u)return;
  const list=(u.keyHistory||[]).slice().reverse();
  document.getElementById('histTitle').textContent='🔑 Lịch sử key';
  const box=document.getElementById('histContent');
  if(!list.length)box.innerHTML='<div style="text-align:center;color:#94a3b8;font-weight:700;padding:20px">Chưa có key</div>';
  else{
    box.innerHTML='';
    list.forEach(h=>{
      const el=document.createElement('div');el.className='info-row';el.style.margin='0 0 8px';
      el.innerHTML=`<div><div class="lbl">${h.via==='admin'?'Admin cấp':h.via==='auto'?'Tự động mua':'Tự nhập'}</div>
        <div style="font-size:11px;font-family:monospace;color:#3b5bfd;font-weight:800">${esc(h.code)}</div>
        <div style="font-size:11px;color:#94a3b8">${fmtDate(h.at)}</div></div>
        <div style="text-align:right"><div class="val" style="color:#10b981">+${h.days} ngày</div></div>`;
      box.appendChild(el);
    });
  }
  document.getElementById('historyModal').classList.add('show');
}
function openPendingDeposit(){
  closeDrawer();
  const u=currentUser();if(!u)return;
  const list=loadDeposits().filter(d=>d.email===u.email).slice().reverse();
  document.getElementById('histTitle').textContent='📋 Yêu cầu nạp của bạn';
  const box=document.getElementById('histContent');
  if(!list.length)box.innerHTML='<div style="text-align:center;color:#94a3b8;font-weight:700;padding:20px">Chưa có</div>';
  else{
    box.innerHTML='';
    list.forEach(d=>{
      const el=document.createElement('div');el.className='info-row';el.style.margin='0 0 8px';
      let st='',sc='#f59e0b';
      if(d.status==='pending'){st='⏳ Chờ duyệt';sc='#f59e0b';}
      else if(d.status==='approved'){st='✅ Đã duyệt';sc='#10b981';}
      else{st='❌ Từ chối';sc='#ef4444';}
      el.innerHTML=`<div><div class="lbl">${d.method==='bank'?'NH':'Thẻ'}</div>
        <div style="font-size:11px;color:#94a3b8">${fmtDate(d.createdAt)}</div></div>
        <div style="text-align:right"><div class="val">${fmt(d.amount)}</div>
        <div style="font-size:11px;font-weight:800;color:${sc}">${st}</div></div>`;
      box.appendChild(el);
    });
  }
  document.getElementById('historyModal').classList.add('show');
}
/* Pages */
function showPage(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const page=document.getElementById('page-'+name);if(page)page.classList.add('active');
  const nav=document.querySelector(`.nav-item[data-page="${name}"]`);if(nav)nav.classList.add('active');
  document.getElementById('appContent').scrollTop=0;
  if(name==='deposit')renderDeposit();
  if(name==='vip')renderVIPPage();
  if(name==='profile')renderProfile();
  if(name==='tools')renderTools();
}
/* Clock */
let clockStarted=false;
function startClock(){
  if(clockStarted)return;clockStarted=true;
  function tick(){
    const d=new Date(),p=n=>String(n).padStart(2,'0');
    document.getElementById('liveClock').textContent=`${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    document.getElementById('liveDate').textContent=`${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()}`;
  }
  tick();setInterval(tick,1000);
}
/* Tools */
let activeCat='all';
function renderTools(){
  const cfg=loadConfig();const u=currentUser();
  const isVIP=u&&(u.isAdmin||(u.keyExpiry&&u.keyExpiry>now()));
  const cats=['all',...new Set(cfg.tools.map(t=>t.cat))];
  const names={all:'T
