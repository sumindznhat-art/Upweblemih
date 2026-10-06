/* ============================================================
   LOGIN / REGISTER + AVATAR
   ============================================================ */
let pendingAvatarBase64 = '';

function shakeEl(el){ if(!el) return; el.classList.add('shake'); setTimeout(()=>el.classList.remove('shake'),500); }

function switchTab(t){
  const tl = document.getElementById('tabLogin'), tr = document.getElementById('tabReg');
  const fl = document.getElementById('formLogin'), fr = document.getElementById('formReg');
  const sub = document.getElementById('subText');
  document.getElementById('loginError').textContent='';
  if(t==='login'){ tl.classList.add('active'); tr.classList.remove('active'); fl.style.display='block'; fr.style.display='none'; sub.textContent='Đăng nhập hệ thống'; }
  else { tr.classList.add('active'); tl.classList.remove('active'); fl.style.display='none'; fr.style.display='block'; sub.textContent='Tạo tài khoản mới'; }
}

async function fetchIP(){
  try {
    const ctrl = new AbortController();
    const t = setTimeout(()=>ctrl.abort(), 4000);
    const r = await fetch('https://api.ipify.org?format=json', {signal:ctrl.signal});
    clearTimeout(t);
    const d = await r.json();
    return d.ip || 'unknown';
  } catch(e){ return 'unknown'; }
}

function doLogin(){
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');
  const btn = document.getElementById('btnLogin');
  const sp = document.getElementById('loginSpinner');
  const bt = document.getElementById('btnLoginText');
  err.textContent=''; err.style.color='#ef4444';

  if(!email || !pass){
    err.textContent='⚠️ Vui lòng nhập đầy đủ email và mật khẩu!';
    if(!email) shakeEl(document.getElementById('loginEmail'));
    if(!pass)  shakeEl(document.getElementById('loginPass'));
    return;
  }
  sp.style.display='inline-block';
  bt.innerHTML='ĐANG KIỂM TRA...';
  btn.disabled = true;

  setTimeout(async () => {
    const u = getUser(email);
    if(!u || u.password !== pass){
      sp.style.display='none';
      bt.innerHTML='<i class="fa-solid fa-right-to-bracket"></i> ĐĂNG NHẬP';
      btn.disabled = false;
      err.textContent='❌ Email hoặc mật khẩu không đúng!';
      shakeEl(document.getElementById('loginPass'));
      return;
    }
    const ip = await fetchIP();
    u.ip = ip; u.lastLogin = now();
    if(!u.deposits) u.deposits = [];
    if(!u.keyHistory) u.keyHistory = [];
    setUser(email, u);
    setSession(email);

    bt.innerHTML='<i class="fa-solid fa-check"></i> THÀNH CÔNG';
    err.style.color='#10b981'; err.textContent='✅ Đang vào hệ thống...';
    setTimeout(enterApp, 500);
  }, 450);
}

function doRegister(){
  const name  = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('regPass').value;
  const pass2 = document.getElementById('regPass2').value;
  const err = document.getElementById('loginError');
  const btn = document.getElementById('btnReg');
  const sp = document.getElementById('regSpinner');
  const bt = document.getElementById('btnRegText');
  err.textContent=''; err.style.color='#ef4444';

  if(!name || !email || !pass || !pass2){ err.textContent='⚠️ Vui lòng điền đầy đủ!'; return; }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ err.textContent='⚠️ Email không hợp lệ!'; shakeEl(document.getElementById('regEmail')); return; }
  if(pass.length < 6){ err.textContent='⚠️ Mật khẩu phải từ 6 ký tự!'; shakeEl(document.getElementById('regPass')); return; }
  if(pass !== pass2){ err.textContent='⚠️ Mật khẩu nhập lại không khớp!'; shakeEl(document.getElementById('regPass2')); return; }
  if(getUser(email)){ err.textContent='⚠️ Email đã được đăng ký!'; shakeEl(document.getElementById('regEmail')); return; }

  sp.style.display='inline-block'; bt.innerHTML='ĐANG TẠO...'; btn.disabled = true;
  setTimeout(async () => {
    const ip = await fetchIP();
    setUser(email, {
      email, password:pass, name, balance:0, keyExpiry:0,
      isAdmin:false, ip, lastLogin:now(), createdAt:now(),
      avatar:'', deposits:[], keyHistory:[]
    });
    sp.style.display='none';
    bt.innerHTML='<i class="fa-solid fa-user-plus"></i> ĐĂNG KÝ';
    btn.disabled = false;
    err.style.color='#10b981'; err.textContent='✅ Đăng ký thành công! Đang chuyển sang đăng nhập...';
    ['regName','regEmail','regPass','regPass2'].forEach(id => document.getElementById(id).value='');
    setTimeout(()=>{
      switchTab('login');
      document.getElementById('loginEmail').value = email;
      document.getElementById('loginPass').focus();
      err.style.color='#ef4444'; err.textContent='';
    }, 900);
  }, 500);
}

/* ===== AVATAR ===== */
function normalizeAvatar(raw){
  if(!raw) return null;
  raw = raw.trim();
  if(!raw) return null;
  if(/^data:image\//i.test(raw)) return raw;
  let mime = 'image/jpeg';
  if(raw.startsWith('iVBOR')) mime = 'image/png';
  else if(raw.startsWith('R0lGOD')) mime = 'image/gif';
  else if(raw.startsWith('UklGR')) mime = 'image/webp';
  return `data:${mime};base64,${raw}`;
}

function applyAvatarEverywhere(src){
  ['loginAvatarImg','hdrAvatar','profAvatar','drawerAvatar'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.src = src || CONFIG.defaultAvatar;
  });
}

function getUserAvatar(){
  const u = currentUser();
  return (u && u.avatar) ? u.avatar : CONFIG.defaultAvatar;
}

function openAvatarModal(){
  const m = document.getElementById('avatarModal');
  const inp = document.getElementById('avBase64Input');
  const pv = document.getElementById('avPreview');
  const st = document.getElementById('avStatus');
  let saved = null;
  try{ saved = getUserAvatar(); }catch(e){}
  st.textContent='';
  if(saved && saved !== CONFIG.defaultAvatar){ pv.innerHTML = `<img src="${saved}">`; }
  else { pv.innerHTML = '🎀'; }
  inp.value = '';
  m.classList.add('show');
  setTimeout(()=>inp.focus(),100);
}
function closeAvatarModal(){ document.getElementById('avatarModal').classList.remove('show'); }

function saveAvatar(){
  const inp = document.getElementById('avBase64Input');
  const st = document.getElementById('avStatus');
  const pv = document.getElementById('avPreview');
  const val = inp.value.trim();
  if(!val || val.length<50){ st.style.color='#ef4444'; st.textContent='⚠️ Chuỗi Base64 không hợp lệ!'; return; }
  const src = normalizeAvatar(val);
  const img = new Image();
  img.onload = () => {
    const u = currentUser();
    if(u){ u.avatar = src; setUser(u.email, u); }
    applyAvatarEverywhere(src);
    pv.innerHTML = `<img src="${src}">`;
    st.style.color='#10b981'; st.textContent='✅ Đã lưu avatar!';
    setTimeout(closeAvatarModal, 900);
  };
  img.onerror = () => { st.style.color='#ef4444'; st.textContent='❌ Ảnh không load được!'; };
  img.src = src;
}

function resetAvatar(){
  const u = currentUser();
  if(u){ u.avatar = ''; setUser(u.email, u); }
  applyAvatarEverywhere(CONFIG.defaultAvatar);
  document.getElementById('avPreview').innerHTML = '🎀';
  document.getElementById('avBase64Input').value = '';
  const st = document.getElementById('avStatus');
  st.style.color='#0ea5e9'; st.textContent='↩️ Đã reset avatar mặc định';
  setTimeout(()=>st.textContent='',1400);
}

/* ===== Init avatar trigger (nhấn giữ để mở) ===== */
window.addEventListener('load', () => {
  applyAvatarEverywhere(getUserAvatar());
  const trigger = document.getElementById('avatarTrigger');
  if(!trigger) return;
  const HOLD_MS = 900;
  let timer=null, holding=false, sx=0, sy=0, moved=false;
  const TOL=12;
  function start(x,y){ sx=x; sy=y; moved=false; holding=true; trigger.classList.add('holding');
    timer=setTimeout(()=>{ if(!holding||moved) return; trigger.classList.remove('holding'); holding=false; openAvatarModal(); },HOLD_MS); }
  function cancel(){ holding=false; if(timer){clearTimeout(timer);timer=null;} trigger.classList.remove('holding'); }
  function move(x,y){ if(!holding) return; if(Math.abs(x-sx)>TOL||Math.abs(y-sy)>TOL){ moved=true; cancel(); } }
  trigger.addEventListener('mousedown',e=>{e.preventDefault();start(e.clientX,e.clientY)});
  trigger.addEventListener('mousemove',e=>move(e.clientX,e.clientY));
  trigger.addEventListener('mouseup',cancel);
  trigger.addEventListener('mouseleave',cancel);
  trigger.addEventListener('touchstart',e=>{const t=e.touches[0];start(t.clientX,t.clientY)},{passive:true});
  trigger.addEventListener('touchmove',e=>{const t=e.touches[0];move(t.clientX,t.clientY)},{passive:true});
  trigger.addEventListener('touchend',cancel);
  trigger.addEventListener('touchcancel',cancel);
  trigger.addEventListener('contextmenu',e=>e.preventDefault());
});

document.getElementById('loginPass')?.addEventListener('keypress', e => { if(e.key==='Enter') doLogin(); });
document.getElementById('regPass2')?.addEventListener('keypress', e => { if(e.key==='Enter') doRegister(); });
