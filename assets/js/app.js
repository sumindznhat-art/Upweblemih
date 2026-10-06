/* ============================================================
   MAIN APP
   ============================================================ */
let clockStarted = false;
let currentToolSlug = null;

function enterApp(){
  const u = currentUser();
  if(!u){ doLogout(); return; }
  document.getElementById('login-screen').classList.add('hide');
  document.getElementById('app').classList.add('show');
  if(u.isAdmin) document.getElementById('drawerAdminBtn').style.display='flex';
  else document.getElementById('drawerAdminBtn').style.display='none';
  applyAvatarEverywhere(getUserAvatar());
  renderAll();
  showPage('home');
  startClock();
}

function doLogout(){
  clearSession();
  document.getElementById('login-screen').classList.remove('hide');
  document.getElementById('app').classList.remove('show');
  document.getElementById('tool-screen').classList.remove('show');
  document.getElementById('adminPanel').classList.remove('show');
  document.getElementById('drawer').classList.remove('show');
  document.getElementById('drawerOverlay').classList.remove('show');
  document.getElementById('loginEmail').value='';
  document.getElementById('loginPass').value='';
  document.getElementById('loginError').textContent='';
  document.getElementById('loginSpinner').style.display='none';
  document.getElementById('btnLoginText').innerHTML='<i class="fa-solid fa-right-to-bracket"></i> ĐĂNG NHẬP';
  document.getElementById('btnLogin').disabled=false;
  switchTab('login');
  if(window.__toolInterval){ clearInterval(window.__toolInterval); window.__toolInterval = null; }
  window.__toolStarted = false;
}

function showPage(name){
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById('page-' + name);
  if(page) page.classList.add('active');
  const nav = document.querySelector(`.nav-item[data-page="${name}"]`);
  if(nav) nav.classList.add('active');
  document.getElementById('appContent').scrollTop = 0;
  if(name==='deposit') renderDeposit();
  if(name==='vip') renderVIPPage();
  if(name==='profile') renderProfile();
  if(name==='tools') renderTools();
}

function openDrawer(){
  const u = currentUser();
  if(!u) return;
  document.getElementById('drawer').classList.add('show');
  document.getElementById('drawerOverlay').classList.add('show');
  document.getElementById('drawerName').textContent = u.name || u.email.split('@')[0];
  document.getElementById('drawerEmail').textContent = u.email;
  const isVIP = u.isAdmin || (u.keyExpiry && u.keyExpiry > now());
  const badge = document.getElementById('drawerBadge');
  if(u.isAdmin){ badge.textContent = '👑 ADMIN'; }
  else if(isVIP){ badge.textContent = '⭐ VIP MEMBER'; }
  else { badge.textContent = 'THÀNH VIÊN'; }
  const av = getUserAvatar();
  document.getElementById('drawerAvatar').src = av;
  document.getElementById('drawerAdminBtn').style.display = u.isAdmin ? 'flex' : 'none';
}
function closeDrawer(){
  document.getElementById('drawer').classList.remove('show');
  document.getElementById('drawerOverlay').classList.remove('show');
}

function startClock(){
  if(clockStarted) return; clockStarted = true;
  function tick(){
    const d = new Date(), p = n => String(n).padStart(2,'0');
    document.getElementById('liveClock').textContent = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    document.getElementById('liveDate').textContent = `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()}`;
  }
  tick(); setInterval(tick, 1000);
}

/* ===== RENDER TOOLS ===== */
function renderTools(){
  const box = document.getElementById('toolList');
  box.innerHTML = '';
  const u = currentUser();
  if(!u) return;
  const isVIP = u.isAdmin || (u.keyExpiry && u.keyExpiry > now());
  document.getElementById('toolCount').textContent = PORTS.length;

  PORTS.forEach(t => {
    const card = document.createElement('div');
    card.className = 'tool-card';
    const badges = [];
    if(t.hot) badges.push('<span class="badge-hot">HOT</span>');
    if(t.is_new) badges.push('<span class="badge-hot">NEW</span>');
    if(t.cat) badges.push(`<span class="badge-hot">${t.cat.toUpperCase()}</span>`);
    const iconHTML = t.image
      ? `<img src="${t.image}" alt="" onerror="this.style.display='none';this.parentElement.innerHTML='🎲'">`
      : '🎲';
    card.innerHTML = `
      <div class="top-badges">${badges.join('')}</div>
      <div class="tool-head">
        <div class="tool-logo">${iconHTML}</div>
        <div class="tool-info">
          <div class="tool-name-row"><span class="tool-name">${t.name}</span></div>
          <div class="tool-tag" style="display:inline-block;margin-top:2px">${(t.cat||'tool').toUpperCase()}</div>
          <div class="tool-desc">${t.desc || 'Hỗ trợ AI phân tích dữ liệu'}</div>
        </div>
      </div>
      <div class="tool-footer">
        <div class="vip-req ${isVIP?'unlocked':''}"><span class="dot"></span> ${isVIP?'Đã mở khoá VIP':'Yêu cầu VIP'}</div>
        <button class="vip-btn ${isVIP?'unlocked':''}" onclick="openTool('${t.slug}')">
          <i class="fa-solid ${isVIP?'fa-unlock':'fa-lock'}"></i> ${isVIP?'MỞ TOOL':'VIP'}
        </button>
      </div>
    `;
    box.appendChild(card);
  });
}

/* ===== OPEN TOOL ===== */
function openTool(slug){
  const u = currentUser();
  if(!u) return;
  const isVIP = u.isAdmin || (u.keyExpiry && u.keyExpiry > now());
  if(!isVIP){
    alert('🔒 Tool này yêu cầu VIP!\n\nBạn cần nâng cấp gói VIP để sử dụng.\nVui lòng vào mục "Mua VIP" để đăng ký.');
    showPage('vip');
    return;
  }
  const tool = PORTS.find(t => t.slug === slug);
  if(!tool){ alert('❌ Không tìm thấy tool!'); return; }

  currentToolSlug = slug;
  document.getElementById('tool-screen').classList.add('show');
  document.getElementById('close-tool').classList.add('show');

  const frame = document.getElementById('gameFrame');
  frame.src = tool.game_url || 'about:blank';

  // Khởi động engine với API của tool này
  if(window.__toolInterval){ clearInterval(window.__toolInterval); window.__toolInterval = null; }
  window.__toolStarted = false;

  // Khởi động engine AI với API tương ứng
  if(tool.kind === 'view' || tool.kind === 'panel'){
    if(typeof startToolEngine === 'function'){
      window.__toolStarted = true;
      startToolEngine(tool.api_url, slug);
    }
  } else if(tool.kind === 'baccarat'){
    // Baccarat engine riêng - hiển thị đơn giản
    if(typeof startToolEngine === 'function'){
      window.__toolStarted = true;
      startToolEngine(tool.api_url, 'baccarat');
    }
  }
}

function closeToolScreen(){
  document.getElementById('tool-screen').classList.remove('show');
  document.getElementById('close-tool').classList.remove('show');
  document.getElementById('gameFrame').src = 'about:blank';
  if(window.__toolInterval){ clearInterval(window.__toolInterval); window.__toolInterval = null; }
  window.__toolStarted = false;
  currentToolSlug = null;
}

/* ===== DEPOSIT PAGE ===== */
function renderDeposit(){
  const u = currentUser();
  if(!u) return;
  document.getElementById('depBalance').textContent = u.isAdmin ? '∞' : fmt(u.balance);
  const isVIP = u.isAdmin || (u.keyExpiry && u.keyExpiry > now());
  const st = document.getElementById('depStatus');
  if(isVIP){ st.style.color = '#10b981'; st.textContent = u.isAdmin ? 'Admin - Toàn quyền' : 'Key còn hạn: ' + fmtDate(u.keyExpiry); }
  else { st.style.color = '#ef4444'; st.textContent = 'Chưa có key hoạt động'; }
  renderMyDeposits();
}

function renderMyDeposits(){
  const box = document.getElementById('myDepositList');
  if(!box) return;
  const u = currentUser();
  const list = (u && u.deposits) || [];
  if(!list.length){
    box.innerHTML = '<div class="empty"><i class="fa-solid fa-receipt"></i>Chưa có yêu cầu nạp nào</div>';
    return;
  }
  box.innerHTML = list.slice(0, 10).map(d => {
    const cls = d.status === 'pending' ? 'badge-pending' : (d.status === 'approved' ? 'badge-approved' : 'badge-rejected');
    const statusText = d.status === 'pending' ? 'ĐANG CHỜ' : (d.status === 'approved' ? 'ĐÃ DUYỆT' : 'TỪ CHỐI');
    return `<div class="adm-card">
      <div class="r1">
        <div class="email">${fmt(d.amount)}</div>
        <span class="badge ${cls}">${statusText}</span>
      </div>
      <div class="info">
        PT: <b>${d.method === 'qr' ? 'Chuyển khoản' : 'Thẻ cào'}</b><br>
        ${d.note ? 'Ghi chú: <b>'+d.note+'</b><br>' : ''}
        Tạo: <b>${fmtDate(d.createdAt)}</b>
        ${d.approvedAt ? '<br>Duyệt: <b>'+fmtDate(d.approvedAt)+'</b>' : ''}
      </div>
    </div>`;
  }).join('');
}

let depFormMethod = 'qr';
function openDepositForm(method){
  depFormMethod = method;
  document.getElementById('depFormTitle').textContent = method === 'qr' ? '📱 Nạp qua Chuyển khoản' : '💳 Nạp qua Thẻ cào';
  document.getElementById('depAmount').value = '';
  document.getElementById('depNote').value = '';
  document.getElementById('depositForm').classList.add('show');
}
function closeSheet(id){ document.getElementById(id).classList.remove('show'); }

function submitDeposit(){
  const u = currentUser();
  if(!u) return;
  const amt = parseInt(document.getElementById('depAmount').value, 10);
  const note = document.getElementById('depNote').value.trim();
  if(!amt || amt < 10000){ alert('⚠️ Số tiền tối thiểu 10.000đ'); return; }
  if(amt > 100000000){ alert('⚠️ Số tiền quá lớn!'); return; }
  createDeposit(u.email, amt, depFormMethod, note);
  closeSheet('depositForm');
  alert('✅ Đã gửi yêu cầu nạp ' + fmt(amt) + '\nAdmin sẽ duyệt trong 5-15 phút.\nVui lòng chờ thông báo!');
  renderMyDeposits();
}

/* ===== VIP PAGE ===== */
function renderVIPPage(){
  const u = currentUser();
  if(!u) return;
  const isVIP = u.isAdmin || (u.keyExpiry && u.keyExpiry > now());
  document.getElementById('vipAccStatus').textContent = u.isAdmin ? 'Admin - Toàn quyền' : (isVIP ? 'VIP Member (Đã nâng cấp)' : 'Tài khoản thường (Chưa nâng cấp)');
  document.getElementById('vipExpiry').textContent = u.isAdmin ? 'Vĩnh viễn' : (u.keyExpiry ? fmtDate(u.keyExpiry) : 'Chưa kích hoạt');

  const box = document.getElementById('pkgList');
  box.innerHTML = '';
  PACKAGES.forEach(p => {
    const el = document.createElement('div');
    el.className = 'pkg-card';
    el.innerHTML = `
      <div class="pkg-discount">${p.disc}</div>
      <div class="pkg-head">
        <div class="pkg-ic"><i class="fa-solid fa-crown"></i></div>
        <div><div class="pkg-name">${p.name}</div><div class="pkg-sub">${p.sub}</div></div>
      </div>
      <div class="pkg-desc">Tận hưởng các đặc quyền VIP và chơi game không giới hạn trong ${p.days} ngày</div>
      <div class="pkg-price-row">
        <div><div class="pkg-price-lbl">Mức giá</div><div class="pkg-price">${p.price.toLocaleString('vi-VN')}<span class="u">đ</span></div></div>
        <div style="text-align:right"><div class="pkg-price-lbl">Giá cũ</div><div class="pkg-old">${p.old.toLocaleString('vi-VN')}đ</div></div>
      </div>
      <button class="pkg-buy" onclick="buyPackage('${p.id}')">MUA NGAY</button>
    `;
    box.appendChild(el);
  });
}

function buyPackage(id){
  const u = currentUser();
  if(!u) return;
  const p = PACKAGES.find(x => x.id === id);
  if(!p) return;
  if(u.balance < p.price){
    alert('❌ Số dư không đủ!\n\nCần: ' + fmt(p.price) + '\nHiện có: ' + fmt(u.balance) + '\n\nVui lòng nạp thêm tiền và chờ Admin duyệt!');
    showPage('deposit');
    return;
  }
  if(!confirm('Xác nhận mua gói:\n' + p.name + '\nGiá: ' + fmt(p.price) + '\n\nSố dư sau khi mua: ' + fmt(u.balance - p.price))) return;
  u.balance -= p.price;
  const base = (u.keyExpiry && u.keyExpiry > now()) ? u.keyExpiry : now();
  u.keyExpiry = base + p.days * 24 * 3600 * 1000;
  setUser(u.email, u);
  addKeyHistory(u.email, p);
  alert('✅ Mua thành công!\n\nGói: ' + p.name + '\nĐã trừ: ' + fmt(p.price) + '\nHạn mới: ' + fmtDate(u.keyExpiry));
  renderAll();
  showPage('vip');
}

/* ===== KEY HISTORY ===== */
function showKeyHistory(){
  const u = currentUser();
  if(!u) return;
  closeDrawer();
  const list = getUserKeyHistory(u.email);
  let html = '<h3>📜 Lịch sử mua Key</h3>';
  if(!list.length){
    html += '<div class="empty"><i class="fa-solid fa-clock-rotate-left"></i>Chưa mua key nào</div>';
  } else {
    html += list.map(k => `<div class="adm-card">
      <div class="r1"><div class="email">${k.packageName}</div><span class="badge badge-approved">+${k.days} ngày</span></div>
      <div class="info">Giá: <b>${fmt(k.price)}</b><br>Mua lúc: <b>${fmtDate(k.purchasedAt)}</b></div>
    </div>`).join('');
  }
  // Tạo modal tạm
  showTempModal(html);
}

function showDepositHistory(){
  const u = currentUser();
  if(!u) return;
  closeDrawer();
  const list = getUserDeposits(u.email);
  let html = '<h3>🧾 Lịch sử nạp tiền</h3>';
  if(!list.length){
    html += '<div class="empty"><i class="fa-solid fa-receipt"></i>Chưa có yêu cầu nào</div>';
  } else {
    html += list.map(d => {
      const cls = d.status === 'pending' ? 'badge-pending' : (d.status === 'approved' ? 'badge-approved' : 'badge-rejected');
      const statusText = d.status === 'pending' ? 'ĐANG CHỜ' : (d.status === 'approved' ? 'ĐÃ DUYỆT' : 'TỪ CHỐI');
      return `<div class="adm-card">
        <div class="r1"><div class="email">${fmt(d.amount)}</div><span class="badge ${cls}">${statusText}</span></div>
        <div class="info">PT: <b>${d.method === 'qr' ? 'CK' : 'Thẻ'}</b> · ${fmtDate(d.createdAt)}</div>
      </div>`;
    }).join('');
  }
  showTempModal(html);
}

function showTempModal(htmlContent){
  let modal = document.getElementById('tempModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'tempModal';
    modal.className = 'overlay';
    modal.innerHTML = `<div class="sheet"><div class="sheet-grip"></div><div id="tempModalContent"></div>
      <button class="logout-btn" style="margin-top:14px;border-color:#cbd5e1;background:#f8fafc;color:#475569" onclick="document.getElementById('tempModal').classList.remove('show')">ĐÓNG</button></div>`;
    modal.onclick = (e) => { if(e.target === modal) modal.classList.remove('show'); };
    document.body.appendChild(modal);
  }
  document.getElementById('tempModalContent').innerHTML = htmlContent;
  modal.classList.add('show');
}

/* ===== PROFILE ===== */
function renderProfile(){
  const u = currentUser();
  if(!u) return;
  document.getElementById('profName').textContent = u.name || u.email.split('@')[0];
  document.getElementById('profBalance').textContent = u.isAdmin ? '∞' : fmt(u.balance);
  document.getElementById('profJoined').textContent = fmtDate(u.createdAt).split(' ')[0];
  document.getElementById('profLastLogin').textContent = fmtDateShort(u.lastLogin);
  document.getElementById('profIP').textContent = u.ip || '—';
  document.getElementById('profRole').textContent = u.isAdmin ? 'ADMIN' : ((u.keyExpiry > now()) ? 'VIP MEMBER' : 'THÀNH VIÊN');
  applyAvatarEverywhere(getUserAvatar());

  const isVIP = u.isAdmin || (u.keyExpiry && u.keyExpiry > now());
  const badges = document.getElementById('profBadges');
  badges.innerHTML = '';
  if(u.isAdmin){
    badges.innerHTML = '<div class="pbadge red"><i class="fa-solid fa-shield-halved"></i> ADMIN</div><div class="pbadge green"><i class="fa-solid fa-circle" style="font-size:8px"></i> Hoạt động</div>';
  } else if(isVIP){
    badges.innerHTML = '<div class="pbadge yellow"><i class="fa-solid fa-crown"></i> VIP Member</div><div class="pbadge green"><i class="fa-solid fa-circle" style="font-size:8px"></i> Hoạt động</div>';
  } else {
    badges.innerHTML = '<div class="pbadge yellow"><i class="fa-solid fa-crown"></i> Chưa đăng ký</div><div class="pbadge green"><i class="fa-solid fa-circle" style="font-size:8px"></i> Hoạt động</div>';
  }
}

/* ===== RENDER ALL ===== */
function renderAll(){
  const u = currentUser();
  if(!u) return;
  const isVIP = u.isAdmin || (u.keyExpiry && u.keyExpiry > now());
  document.getElementById('curPackage').textContent = u.isAdmin ? 'Admin' : (isVIP ? 'VIP Member' : 'Chưa có');
  document.getElementById('curRole').textContent = u.isAdmin ? 'Admin' : (isVIP ? 'VIP' : 'Thành viên');
  document.getElementById('toolCount').textContent = PORTS.length;
  renderTools();
}

/* ===== Auto lock ===== */
window.addEventListener('DOMContentLoaded', () => {
  const u = currentUser();
  if(u) enterApp();
  setInterval(() => {
    const cu = currentUser();
    if(!cu || cu.isAdmin) return;
    if(!cu.keyExpiry || cu.keyExpiry <= now()){
      if(document.getElementById('app').classList.contains('show') && document.getElementById('tool-screen').classList.contains('show')){
        alert('🔒 Key đã hết hạn! Vui lòng mua gói VIP để tiếp tục sử dụng tool.');
        closeToolScreen();
        showPage('vip');
      }
    }
  }, 30000);
});
