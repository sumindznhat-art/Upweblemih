/* ============================================================
   MAIN APP - Init, Routing, Avatar, Clock
   ============================================================ */

/* ===== Avatar ===== */
(function(){
  const trigger=document.getElementById('avatarTrigger');
  if(!trigger)return;
  const HOLD_MS=1200;
  let timer=null,holding=false,sx=0,sy=0,moved=false;
  const TOL=12;
  function start(x,y){sx=x;sy=y;moved=false;holding=true;timer=setTimeout(()=>{
    if(!holding||moved)return;holding=false;openAvatarModal();
  },HOLD_MS);}
  function cancel(){holding=false;if(timer){clearTimeout(timer);timer=null;}}
  function move(x,y){if(!holding)return;if(Math.abs(x-sx)>TOL||Math.abs(y-sy)>TOL){moved=true;cancel();}}
  trigger.addEventListener('mousedown',e=>{e.preventDefault();start(e.clientX,e.clientY);});
  trigger.addEventListener('mousemove',e=>move(e.clientX,e.clientY));
  trigger.addEventListener('mouseup',cancel);
  trigger.addEventListener('mouseleave',cancel);
  trigger.addEventListener('touchstart',e=>{const t=e.touches[0];start(t.clientX,t.clientY);},{passive:true});
  trigger.addEventListener('touchmove',e=>{const t=e.touches[0];move(t.clientX,t.clientY);},{passive:true});
  trigger.addEventListener('touchend',cancel);
  trigger.addEventListener('touchcancel',cancel);
  trigger.addEventListener('contextmenu',e=>e.preventDefault());
})();

function openAvatarModal(){
  const m=document.getElementById('avatarModal');
  const inp=document.getElementById('avBase64Input');
  const pv=document.getElementById('avPreview');
  let saved=null;try{saved=localStorage.getItem(AVATAR_KEY);}catch(e){}
  document.getElementById('avStatus').textContent='';
  if(saved){pv.innerHTML=`<img src="${saved}">`;inp.value='';}
  else{pv.innerHTML='🎀';inp.value='';}
  m.classList.add('show');
  setTimeout(()=>inp.focus(),100);
}
function closeAvatarModal(){document.getElementById('avatarModal').classList.remove('show');}
function saveAvatar(){
  const inp=document.getElementById('avBase64Input');
  const st=document.getElementById('avStatus');
  const pv=document.getElementById('avPreview');
  const val=inp.value.trim();
  if(!val||val.length<50){st.style.color='#ef4444';st.textContent='⚠️ Chuỗi Base64 không hợp lệ!';return;}
  const src=normalizeAvatar(val);
  const img=new Image();
  img.onload=()=>{
    try{localStorage.setItem(AVATAR_KEY,src);}catch(e){}
    applyAvatarEverywhere(src);
    pv.innerHTML=`<img src="${src}">`;
    st.style.color='#10b981';st.textContent='✅ Đã lưu avatar!';
    setTimeout(closeAvatarModal,900);
  };
  img.onerror=()=>{st.style.color='#ef4444';st.textContent='❌ Ảnh không load được!';};
  img.src=src;
}
function resetAvatar(){
  try{localStorage.removeItem(AVATAR_KEY);}catch(e){}
  applyAvatarEverywhere(DEFAULT_AVATAR);
  document.getElementById('avPreview').innerHTML='🎀';
  document.getElementById('avBase64Input').value='';
  const st=document.getElementById('avStatus');
  st.style.color='#0ea5e9';st.textContent='↩️ Đã reset mặc định';
  setTimeout(()=>st.textContent='',1400);
}

/* ===== Routing ===== */
function showPage(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const page=document.getElementById('page-'+name);
  if(page)page.classList.add('active');
  const nav=document.querySelector(`.nav-item[data-page="${name}"]`);
  if(nav)nav.classList.add('active');
  document.getElementById('appContent').scrollTop=0;
  if(name==='deposit')renderDeposit();
  if(name==='vip')renderVIPPage();
  if(name==='profile')renderProfile();
  if(name==='tools')renderTools();
}

/* ===== Clock ===== */
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

/* ===== Render Tools ===== */
let activeCat='all';
function renderTools(){
  const cfg=loadConfig();
  const u=currentUser();
  const isVIP=u&&(u.isAdmin||(u.keyExpiry&&u.keyExpiry>now()));
  // Cat tabs
  const cats=['all',...new Set(cfg.tools.map(t=>t.cat))];
  const catNames={all:'Tất cả',taixiu:'Tài Xỉu',sicbo:'Sicbo',baccarat:'Baccarat'};
  const ct=document.getElementById('catTabs');
  ct.innerHTML='';
  cats.forEach(c=>{
    const b=document.createElement('button');
    b.className='cat-tab'+(c===activeCat?' active':'');
    b.textContent=catNames[c]||c;
    b.onclick=()=>{activeCat=c;renderTools();};
    ct.appendChild(b);
  });
  // List
  const box=document.getElementById('toolList');
  box.innerHTML='';
  const list=cfg.tools.filter(t=>t.enabled&&(activeCat==='all'||t.cat===activeCat));
  document.getElementById('toolCount').textContent=cfg.tools.filter(t=>t.enabled).length;
  list.forEach(t=>{
    const card=document.createElement('div');
    card.className='tool-card';
    const imgSrc=t.image_base64||t.image||'';
    const tags=[];
    if(t.hot)tags.push('<span class="tool-badge-hot">HOT</span>');
    if(t.is_new)tags.push('<span class="tool-badge-new">NEW</span>');
    if(t.maintenance)tags.push('<span class="tool-badge-hot" style="background:#f1f5f9;color:#64748b;border-color:#cbd5e1">BẢO TRÌ</span>');
    card.innerHTML=`
      <div class="tool-head">
        <div class="tool-logo">${imgSrc?`<img src="${imgSrc}" onerror="this.parentNode.innerHTML='🎲'">`:'🎲'}</div>
        <div class="tool-info">
          <div class="tool-name-row">
            <span class="tool-name">${esc(t.name)}</span>
            ${tags.join('')}
          </div>
          <div class="tool-tag" style="display:inline-block;margin-top:2px">${esc((t.cat||'').toUpperCase())}</div>
          <div class="tool-desc">${esc(t.description||(t.kind==='baccarat'?'Baccarat - Dự đoán Banker / Player / Tie':t.kind==='view'?'Hỗ trợ bàn Tài Xỉu / MD5 trực tuyến':'Phân tích bàn chơi tự động'))}</div>
        </div>
      </div>
      <div class="tool-footer">
        <div class="vip-req ${isVIP?'ok':''}"><span class="dot"></span>${isVIP?'Đã mở khoá VIP':'Yêu cầu VIP'}</div>
        <button class="tool-btn ${isVIP?'unlocked':''}">
          <i class="fa-solid ${isVIP?'fa-unlock':'fa-lock'}"></i> ${isVIP?'MỞ TOOL':'VIP'}
        </button>
      </div>
    `;
    card.querySelector('.tool-btn').onclick=()=>openToolViewer(t);
    box.appendChild(card);
  });
}

/* ===== Render VIP ===== */
function renderVIPPage(){
  const u=currentUser();if(!u)return;
  const isVIP=u.isAdmin||(u.keyExpiry&&u.keyExpiry>now());
  document.getElementById('vipAccStatus').textContent=u.isAdmin?'Admin - Toàn quyền':(isVIP?'VIP Member (Đã nâng cấp)':'Tài khoản thường (Chưa nâng cấp)');
  document.getElementById('vipExpiry').textContent=u.isAdmin?'Vĩnh viễn':(u.keyExpiry?fmtDate(u.keyExpiry):'Chưa kích hoạt');
  const cfg=loadConfig();
  const box=document.getElementById('pkgList');
  box.innerHTML='';
  cfg.packages.forEach(p=>{
    const el=document.createElement('div');
    el.className='pkg-card';
    el.innerHTML=`
      <div class="pkg-discount">${esc(p.disc||'')}</div>
      <div class="pkg-head">
        <div class="pkg-ic"><i class="fa-solid fa-crown"></i></div>
        <div><div class="pkg-name">${esc(p.name)}</div><div class="pkg-sub">${esc(p.sub||'Gói đặc quyền')}</div></div>
      </div>
      <div class="pkg-desc">Tận hưởng các đặc quyền VIP và chơi game không giới hạn trong ${p.days} ngày</div>
      <div class="pkg-price-row">
        <div><div class="pkg-price-lbl">Mức giá</div><div class="pkg-price">${p.price.toLocaleString('vi-VN')}<span class="u">đ</span></div></div>
        <div style="text-align:right"><div class="pkg-price-lbl">Giá cũ</div><div class="pkg-old">${p.old.toLocaleString('vi-VN')}đ</div></div>
      </div>
      <button class="pkg-buy">MUA NGAY</button>
    `;
    el.querySelector('.pkg-buy').onclick=()=>buyPackage(p.id);
    box.appendChild(el);
  });
}
function buyPackage(id){
  const u=currentUser();if(!u)return;
  const cfg=loadConfig();
  const p=cfg.packages.find(x=>x.id===id);if(!p)return;
  if(u.balance<p.price){
    alert('❌ Số dư không đủ!\n\nBạn cần: '+fmt(p.price)+'\nSố dư: '+fmt(u.balance)+'\n\nLiên hệ Admin để nạp tiền!');
    return;
  }
  u.balance-=p.price;
  const base=(u.keyExpiry&&u.keyExpiry>now())?u.keyExpiry:now();
  u.keyExpiry=base+p.days*24*3600*1000;
  setUser(u.email,u);
  alert('✅ Mua thành công!\nGói: '+p.name+'\nĐã trừ: '+fmt(p.price)+'\nHạn mới: '+fmtDate(u.keyExpiry));
  renderAll();showPage('vip');
}

/* ===== Render Deposit ===== */
function renderDeposit(){
  const u=currentUser();if(!u)return;
  document.getElementById('depBalance').textContent=u.isAdmin?'∞':fmt(u.balance);
  const isVIP=u.isAdmin||(u.keyExpiry&&u.keyExpiry>now());
  const st=document.getElementById('depStatus');
  if(isVIP){st.style.color='#10b981';st.textContent=u.isAdmin?'Admin - Toàn quyền':'Key còn hạn: '+fmtDate(u.keyExpiry);}
  else{st.style.color='#ef4444';st.textContent='Chưa có key hoạt động';}
}

/* ===== Render Profile ===== */
function renderProfile(){
  const u=currentUser();if(!u)return;
  document.getElementById('profName').textContent=u.name||u.email.split('@')[0];
  document.getElementById('profBalance').textContent=u.isAdmin?'∞':fmt(u.balance);
  document.getElementById('profJoined').textContent=fmtDate(u.createdAt).split(' ')[0];
  document.getElementById('profLastLogin').textContent=fmtDateShort(u.lastLogin);
  document.getElementById('profIP').textContent=u.ip||'—';
  document.querySelector('.profile-role').textContent=u.isAdmin?'ADMIN':(u.keyExpiry>now()?'VIP MEMBER':'THÀNH VIÊN');
  const isVIP=u.isAdmin||(u.keyExpiry&&u.keyExpiry>now());
  const badges=document.getElementById('profBadges');
  if(u.isAdmin)badges.innerHTML='<div class="pbadge red"><i class="fa-solid fa-shield-halved"></i> ADMIN</div><div class="pbadge green"><i class="fa-solid fa-circle" style="font-size:8px"></i> Hoạt động</div>';
  else if(isVIP)badges.innerHTML='<div class="pbadge yellow"><i class="fa-solid fa-crown"></i> VIP Member</div><div class="pbadge green"><i class="fa-solid fa-circle" style="font-size:8px"></i> Hoạt động</div>';
  else badges.innerHTML='<div class="pbadge yellow"><i class="fa-solid fa-crown"></i> Chưa đăng ký</div><div class="pbadge green"><i class="fa-solid fa-circle" style="font-size:8px"></i> Hoạt động</div>';
}

/* ===== Render All ===== */
function renderAll(){
  const u=currentUser();if(!u)return;
  const cfg=loadConfig();
  document.getElementById('hdrBrand').textContent=cfg.site_name;
  document.getElementById('marqueeText').textContent=cfg.marquee;
  const av=localStorage.getItem(AVATAR_KEY)||DEFAULT_AVATAR;
  document.getElementById('hdrAvatar').src=av;
  document.getElementById('profAvatar').src=av;
  const isVIP=u.isAdmin||(u.keyExpiry&&u.keyExpiry>now());
  document.getElementById('curPackage').textContent=u.isAdmin?'Admin':(isVIP?'VIP Member':'Chưa có');
  document.getElementById('curRole').textContent=u.isAdmin?'Admin':(isVIP?'VIP':'Thành viên');
  renderTools();
}

/* ===== Init ===== */
window.addEventListener('load',()=>{
  const saved=localStorage.getItem(AVATAR_KEY);
  if(saved)applyAvatarEverywhere(saved);
  const u=currentUser();
  if(u)enterApp();
  // auto lock check
  setInterval(()=>{
    const cu=currentUser();
    if(!cu||cu.isAdmin)return;
    if(!cu.keyExpiry||cu.keyExpiry<=now()){
      if(document.getElementById('app').classList.contains('show')){
        alert('🔒 Key đã hết hạn! Vui lòng mua gói VIP hoặc nhập key mới.');
        closeToolViewer();
        document.getElementById('app').classList.remove('show');
        document.getElementById('key-screen').classList.add('show');
        document.getElementById('adminFloat').classList.remove('show');
      }
    }
  },30000);
});

document.getElementById('loginPass').addEventListener('keypress',e=>{if(e.key==='Enter')doLogin();});
document.getElementById('regPass2').addEventListener('keypress',e=>{if(e.key==='Enter')doRegister();});
document.getElementById('keyInput').addEventListener('keypress',e=>{if(e.key==='Enter')activateKey();});
