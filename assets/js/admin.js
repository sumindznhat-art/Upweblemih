let admCurrentTab = 'pending';

function openAdmin(){
  const u = currentUser();
  if(!u || !u.isAdmin){ alert('❌ Bạn không có quyền!'); return; }
  document.getElementById('adminPanel').classList.add('show');
  admCurrentTab = 'pending';
  document.querySelectorAll('.adm-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.adm-tab[data-tab="pending"]').classList.add('active');
  renderAdminContent();
}
function closeAdmin(){ document.getElementById('adminPanel').classList.remove('show'); }
function switchAdmTab(tab){
  admCurrentTab = tab;
  document.querySelectorAll('.adm-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.adm-tab[data-tab="${tab}"]`).classList.add('active');
  renderAdminContent();
}
function renderAdminContent(){
  const u = currentUser(); if(!u || !u.isAdmin) return;
  const pending = getPendingDeposits();
  document.getElementById('pendingCount').textContent = pending.length;
  const box = document.getElementById('admTabContent');
  if(admCurrentTab === 'pending') box.innerHTML = renderPendingTab(pending);
  else if(admCurrentTab === 'users') box.innerHTML = renderUsersTab();
  else if(admCurrentTab === 'history') box.innerHTML = renderHistoryTab();
}
function renderPendingTab(list){
  if(!list.length) return '<div class="empty"><i class="fa-solid fa-check-circle"></i>Không có yêu cầu chờ duyệt</div>';
  return list.map(d => `<div class="adm-card">
      <div class="r1"><div class="email">${d.email}</div><span class="badge badge-pending">CHỜ DUYỆT</span></div>
      <div class="info">Số tiền: <b style="color:#ef4444;font-size:15px">${fmt(d.amount)}</b><br>PT: <b>${d.method === 'qr' ? 'Chuyển khoản / QR' : 'Thẻ cào'}</b>${d.note ? '<br>Ghi chú: <b>'+d.note+'</b>' : ''}<br>Thời gian: <b>${fmtDate(d.createdAt)}</b></div>
      <div class="acts">
        <button class="b2" onclick="admApprove('${d.id}')"><i class="fa-solid fa-check"></i> DUYỆT</button>
        <button class="b5" onclick="admReject('${d.id}')"><i class="fa-solid fa-xmark"></i> TỪ CHỐI</button>
      </div>
    </div>`).join('');
}
function admApprove(depId){
  const u = currentUser(); if(!u || !u.isAdmin) return;
  if(!confirm('Xác nhận DUYỆT yêu cầu nạp này?')) return;
  if(approveDeposit(depId, u.email)){ alert('✅ Đã duyệt!'); renderAdminContent(); }
  else alert('❌ Không thể duyệt');
}
function admReject(depId){
  const u = currentUser(); if(!u || !u.isAdmin) return;
  const reason = prompt('Lý do từ chối:', '');
  if(reason === null) return;
  if(rejectDeposit(depId, u.email, reason)){ alert('✅ Đã từ chối!'); renderAdminContent(); }
}
function renderUsersTab(){
  const db = loadDB();
  const emails = Object.keys(db.users).sort((a,b) => {
    const A = db.users[a], B = db.users[b];
    if(A.isAdmin && !B.isAdmin) return -1;
    if(!A.isAdmin && B.isAdmin) return 1;
    return (B.lastLogin||0) - (A.lastLogin||0);
  });
  let html = `<div class="adm-add">
      <input type="email" id="admNewEmail" placeholder="Email user mới...">
      <input type="password" id="admNewPass" placeholder="Mật khẩu...">
      <input type="text" id="admNewName" placeholder="Tên hiển thị...">
      <button onclick="admCreateUser()"><i class="fa-solid fa-user-plus"></i> TẠO USER</button>
    </div>`;
  html += emails.map(email => {
    const u = db.users[email];
    const isExpired = !u.isAdmin && (!u.keyExpiry || u.keyExpiry <= now());
    const badges = [];
    if(u.isAdmin) badges.push('<span class="badge badge-admin">ADMIN</span>');
    else if(isExpired) badges.push('<span class="badge badge-exp">HẾT HẠN</span>');
    else badges.push('<span class="badge badge-vip">VIP</span>');
    return `<div class="adm-card">
        <div class="r1"><div class="email">${email}</div><div>${badges.join(' ')}</div></div>
        <div class="info">Tên: <b>${u.name||'—'}</b><br>Số dư: <b>${u.isAdmin ? '∞' : fmt(u.balance)}</b><br>Hạn key: <b>${u.isAdmin ? '∞' : (u.keyExpiry ? fmtDate(u.keyExpiry) : 'Chưa có')}</b><br>IP: <b>${u.ip || '—'}</b> · Đăng nhập: <b>${u.lastLogin ? fmtDateShort(u.lastLogin) : '—'}</b></div>
        <div class="acts">
          <button class="b1" onclick="admAddBalance('${email}')">+ Tiền</button>
          <button class="b2" onclick="admSetKey('${email}')">+ Key</button>
          <button class="b3" onclick="admResetKey('${email}')">Reset Key</button>
          <button class="b4" onclick="admToggleAdmin('${email}')">${u.isAdmin ? 'Gỡ Admin' : 'Cấp Admin'}</button>
          <button class="b5" onclick="admDelete('${email}')">Xoá</button>
        </div>
      </div>`;
  }).join('');
  return html;
}
function admCreateUser(){
  const email = document.getElementById('admNewEmail').value.trim().toLowerCase();
  const pass = document.getElementById('admNewPass').value;
  const name = document.getElementById('admNewName').value.trim() || email.split('@')[0];
  if(!email || !pass){ alert('⚠️ Nhập email và mật khẩu!'); return; }
  if(getUser(email)){ alert('⚠️ Email đã tồn tại!'); return; }
  setUser(email, { email, password:pass, name, balance:0, keyExpiry:0, isAdmin:false, ip:'—', lastLogin:0, createdAt:now(), avatar:'', deposits:[], keyHistory:[] });
  alert('✅ Đã tạo user: ' + email);
  renderAdminContent();
}
function admAddBalance(email){
  const u = getUser(email); if(!u) return;
  const v = prompt('Cộng/trừ tiền cho ' + email + '\nVD: 50000 (âm để trừ)', '50000');
  if(v === null) return;
  const n = parseInt(v, 10);
  if(isNaN(n)){ alert('❌ Số không hợp lệ!'); return; }
  u.balance = Math.max(0, (u.balance||0) + n);
  setUser(email, u);
  alert('✅ Số dư mới: ' + fmt(u.balance));
  renderAdminContent();
}
function admSetKey(email){
  const u = getUser(email); if(!u) return;
  const v = prompt('Cấp BAO NHIÊU NGÀY cho ' + email + '?', '7');
  if(v === null) return;
  const d = parseInt(v, 10);
  if(isNaN(d) || d <= 0){ alert('❌ Số ngày không hợp lệ!'); return; }
  const base = (u.keyExpiry && u.keyExpiry > now()) ? u.keyExpiry : now();
  u.keyExpiry = base + d * 24 * 3600 * 1000;
  setUser(email, u);
  alert('✅ Đã cấp ' + d + ' ngày!\nHạn mới: ' + fmtDate(u.keyExpiry));
  renderAdminContent();
}
function admResetKey(email){
  const u = getUser(email); if(!u) return;
  if(!confirm('Reset key của ' + email + '?')) return;
  u.keyExpiry = 0; setUser(email, u);
  alert('✅ Đã reset key!');
  renderAdminContent();
}
function admToggleAdmin(email){
  const me = currentUser();
  if(email === me.email){ alert('❌ Không thể tự gỡ admin!'); return; }
  const u = getUser(email); if(!u) return;
  if(u.isAdmin){ if(!confirm('Gỡ quyền ADMIN của ' + email + '?')) return; u.isAdmin = false; }
  else { if(!confirm('Cấp quyền ADMIN cho ' + email + '?')) return; u.isAdmin = true; }
  setUser(email, u);
  alert('✅ Đã cập nhật quyền!');
  renderAdminContent();
}
function admDelete(email){
  const me = currentUser();
  if(email === me.email){ alert('❌ Không thể xoá chính mình!'); return; }
  if(email === CONFIG.adminEmail){ alert('❌ Không thể xoá admin tổng!'); return; }
  if(!confirm('XOÁ VĨNH VIỄN user: ' + email + '?')) return;
  delUser(email);
  alert('✅ Đã xoá user!');
  renderAdminContent();
}
function renderHistoryTab(){
  const allDeposits = getAllDeposits().slice(0, 30);
  const allKeys = getAllKeyHistory().slice(0, 20);
  let html = '<div class="section-title" style="margin:0 0 8px">💰 Nạp tiền gần đây</div>';
  if(!allDeposits.length) html += '<div class="empty"><i class="fa-solid fa-receipt"></i>Chưa có giao dịch</div>';
  else html += allDeposits.map(d => {
    const cls = d.status === 'pending' ? 'badge-pending' : (d.status === 'approved' ? 'badge-approved' : 'badge-rejected');
    const statusText = d.status === 'pending' ? 'CHỜ' : (d.status === 'approved' ? 'DUYỆT' : 'TỪ CHỐI');
    return `<div class="adm-card"><div class="r1"><div class="email">${d.email}</div><span class="badge ${cls}">${statusText}</span></div><div class="info">Số tiền: <b>${fmt(d.amount)}</b> · ${fmtDate(d.createdAt)}</div></div>`;
  }).join('');
  html += '<div class="section-title" style="margin:16px 0 8px">🔑 Mua key gần đây</div>';
  if(!allKeys.length) html += '<div class="empty"><i class="fa-solid fa-key"></i>Chưa có giao dịch</div>';
  else html += allKeys.map(k => `<div class="adm-card"><div class="r1"><div class="email">${k.email}</div><span class="badge badge-vip">+${k.days} ngày</span></div><div class="info">Gói: <b>${k.packageName}</b> · Giá: <b>${fmt(k.price)}</b><br>${fmtDate(k.purchasedAt)}</div></div>`).join('');
  return html;
}
