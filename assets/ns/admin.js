/* ============================================================
   ADMIN PANEL
   ============================================================ */
function openAdmin(){
  const u=currentUser();
  if(!u||!u.isAdmin){alert('❌ Bạn không có quyền!');return;}
  document.getElementById('adminPanel').classList.add('show');
  switchAdminTab('users');
}
function closeAdmin(){document.getElementById('adminPanel').classList.remove('show');}

function switchAdminTab(tab){
  document.querySelectorAll('.admin-tab').forEach(t=>t.classList.toggle('active',t.dataset.atab===tab));
  document.getElementById('adminUsersView').style.display=tab==='users'?'block':'none';
  document.getElementById('adminConfigView').style.display=tab==='config'?'block':'none';
  document.getElementById('adminKeysView').style.display=tab==='keys'?'block':'none';
  if(tab==='users')renderAdminUsers();
  if(tab==='config')renderAdminConfig();
  if(tab==='keys')renderAdminKeys();
}

/* ===== USERS ===== */
function renderAdminUsers(){
  const db=loadDB();
  const box=document.getElementById('adminUsersView');
  box.innerHTML='';
  const emails=Object.keys(db.users).sort((a,b)=>{
    const A=db.users[a],B=db.users[b];
    if(A.isAdmin&&!B.isAdmin)return -1;
    if(!A.isAdmin&&B.isAdmin)return 1;
    return (B.lastLogin||0)-(A.lastLogin||0);
  });
  // Create user
  const add=document.createElement('div');
  add.className='adm-section';
  add.innerHTML=`
    <h4><i class="fa-solid fa-user-plus"></i> Tạo user mới</h4>
    <input type="email" id="admNewEmail" placeholder="Email...">
    <input type="password" id="admNewPass" placeholder="Mật khẩu...">
    <input type="text" id="admNewName" placeholder="Tên hiển thị...">
    <button class="green" onclick="admCreateUser()">TẠO USER</button>
  `;
  box.appendChild(add);

  emails.forEach(email=>{
    const u=db.users[email];
    const isExpired=!u.isAdmin&&(!u.keyExpiry||u.keyExpiry<=now());
    const div=document.createElement('div');
    div.className='adm-user';
    const badges=[];
    if(u.isAdmin)badges.push('<span class="badge badge-admin">ADMIN</span>');
    else if(isExpired)badges.push('<span class="badge badge-exp">HẾT HẠN</span>');
    else badges.push('<span class="badge badge-vip">VIP</span>');
    div.innerHTML=`
      <div class="r1"><div class="email">${esc(email)}</div><div>${badges.join(' ')}</div></div>
      <div class="info">
        Tên: <b>${esc(u.name||'—')}</b><br>
        Số dư: <b>${u.isAdmin?'∞':fmt(u.balance)}</b><br>
        Hạn key: <b>${u.isAdmin?'∞':(u.keyExpiry?fmtDate(u.keyExpiry):'Chưa có')}</b><br>
        IP: <b>${esc(u.ip||'—')}</b><br>
        Đăng nhập: <b>${u.lastLogin?fmtDate(u.lastLogin):'—'}</b>
      </div>
      <div class="acts">
        <button class="b1" onclick="admAddBalance('${email}')">+ Tiền</button>
        <button class="b2" onclick="admSetKey('${email}')">+ Key</button>
        <button class="b3" onclick="admResetKey('${email}')">Reset</button>
        <button class="b4" onclick="admToggleAdmin('${email}')">${u.isAdmin?'Gỡ Admin':'Cấp Admin'}</button>
        <button class="b5" onclick="admDelete('${email}')">Xoá</button>
      </div>
    `;
    box.appendChild(div);
  });
}
function admCreateUser(){
  const email=document.getElementById('admNewEmail').value.trim().toLowerCase();
  const pass=document.getElementById('admNewPass').value;
  const name=document.getElementById('admNewName').value.trim()||email.split('@')[0];
  if(!email||!pass){alert('⚠️ Nhập email và mật khẩu!');return;}
  if(getUser(email)){alert('⚠️ Email đã tồn tại!');return;}
  setUser(email,{email,password:pass,name,balance:0,keyExpiry:0,isAdmin:false,ip:'—',lastLogin:0,createdAt:now()});
  renderAdminUsers();
  alert('✅ Đã tạo user: '+email);
}
function admAddBalance(email){
  const u=getUser(email);if(!u)return;
  const v=prompt('Cộng/trừ tiền cho '+email+'\n(số dương = cộng, âm = trừ)','50000');
  if(v===null)return;
  const n=parseInt(v,10);
  if(isNaN(n)){alert('❌ Số không hợp lệ!');return;}
  u.balance=Math.max(0,(u.balance||0)+n);
  setUser(email,u);renderAdminUsers();
  alert('✅ Số dư mới: '+fmt(u.balance));
}
function admSetKey(email){
  const u=getUser(email);if(!u)return;
  const v=prompt('Cấp thêm BAO NHIÊU NGÀY cho '+email+'?\nVí dụ: 7','7');
  if(v===null)return;
  const d=parseInt(v,10);
  if(isNaN(d)||d<=0){alert('❌ Số ngày không hợp lệ!');return;}
  const base=(u.keyExpiry&&u.keyExpiry>now())?u.keyExpiry:now();
  u.keyExpiry=base+d*24*3600*1000;
  setUser(email,u);renderAdminUsers();
  alert('✅ Đã cấp '+d+' ngày!\nHạn mới: '+fmtDate(u.keyExpiry));
}
function admResetKey(email){
  const u=getUser(email);if(!u)return;
  if(!confirm('Reset key của '+email+' về 0 (hết hạn ngay)?'))return;
  u.keyExpiry=0;setUser(email,u);renderAdminUsers();
  alert('✅ Đã reset key!');
}
function admToggleAdmin(email){
  const me=currentUser();
  if(email===me.email){alert('❌ Không thể tự gỡ quyền admin của chính mình!');return;}
  const u=getUser(email);if(!u)return;
  if(u.isAdmin){if(!confirm('Gỡ quyền ADMIN của '+email+'?'))return;u.isAdmin=false;}
  else{if(!confirm('Cấp quyền ADMIN cho '+email+'?'))return;u.isAdmin=true;}
  setUser(email,u);renderAdminUsers();alert('✅ Đã cập nhật quyền!');
}
function admDelete(email){
  const me=currentUser();
  if(email===me.email){alert('❌ Không thể xoá chính mình!');return;}
  if(email==='leminhdz@gmail.com'){alert('❌ Không thể xoá admin tổng!');return;}
  if(!confirm('XOÁ VĨNH VIỄN user: '+email+'?'))return;
  delUser(email);renderAdminUsers();alert('✅ Đã xoá user!');
}

/* ===== CONFIG ===== */
function renderAdminConfig(){
  const cfg=loadConfig();
  const box=document.getElementById('adminConfigView');
  box.innerHTML='';
  // Site config
  const site=document.createElement('div');
  site.className='adm-section';
  site.innerHTML=`
    <h4><i class="fa-solid fa-gear"></i> Cấu hình chung</h4>
    <input type="text" id="cfgSiteName" placeholder="Tên site" value="${esc(cfg.site_name)}">
    <input type="text" id="cfgMarquee" placeholder="Marquee (banner chạy)" value="${esc(cfg.marquee)}">
    <input type="text" id="cfgNoticeTitle" placeholder="Tiêu đề thông báo" value="${esc(cfg.notice_title)}">
    <textarea id="cfgNotice" placeholder="Nội dung thông báo">${esc(cfg.notice)}</textarea>
    <button class="green" onclick="saveCfgSite()">💾 LƯU CẤU HÌNH</button>
  `;
  box.appendChild(site);
  // QR config
  const qr=document.createElement('div');
  qr.className='adm-section';
  qr.innerHTML=`
    <h4><i class="fa-solid fa-qrcode"></i> QR nạp tiền (Base64)</h4>
    <div style="text-align:center;margin-bottom:8px">
      ${cfg.qr_base64?`<img src="${cfg.qr_base64}" style="max-width:180px;border-radius:10px;border:1px solid #e2e8f0">`:'<div style="color:#94a3b8;font-size:11px">Chưa có QR</div>'}
    </div>
    <textarea id="cfgQRBase64" placeholder="Dán Base64 ảnh QR vào đây...">${esc(cfg.qr_base64||'')}</textarea>
    <button class="green" onclick="saveCfgQR()">💾 LƯU QR</button>
    <button class="orange" onclick="clearCfgQR()">🗑 XOÁ QR</button>
  `;
  box.appendChild(qr);
  // Packages
  const pk=document.createElement('div');
  pk.className='adm-section';
  pk.innerHTML=`<h4><i class="fa-solid fa-crown"></i> Gói VIP (JSON)</h4>
    <textarea id="cfgPkgJson" style="min-height:120px">${esc(JSON.stringify(cfg.packages,null,2))}</textarea>
    <button class="green" onclick="saveCfgPkg()">💾 LƯU GÓI VIP</button>`;
  box.appendChild(pk);
  // Tools
  const tl=document.createElement('div');
  tl.className='adm-section';
  tl.innerHTML=`<h4><i class="fa-solid fa-cubes"></i> Danh sách Tool (JSON)</h4>
    <textarea id="cfgToolJson" style="min-height:200px">${esc(JSON.stringify(cfg.tools,null,2))}</textarea>
    <button class="green" onclick="saveCfgTools()">💾 LƯU TOOL LIST</button>
    <button class="orange" onclick="saveCfgTool()">💾 LƯU 1 TOOL (theo slug)</button>`;
  box.appendChild(tl);
  // Quick edit tools (with base64 image support)
  cfg.tools.forEach((t,i)=>{
    const tr=document.createElement('div');
    tr.className='cfg-row';
    tr.innerHTML=`
      <div class="head">
        <div class="nm"><img src="${t.image||''}" onerror="this.style.display='none'"> ${esc(t.name)}</div>
        <span style="font-size:10px;color:#94a3b8">${esc(t.slug)}</span>
      </div>
      <input class="inp" data-f="name" data-i="${i}" value="${esc(t.name)}" placeholder="Tên tool">
      <input class="inp" data-f="api_url" data-i="${i}" value="${esc(t.api_url)}" placeholder="API URL">
      <input class="inp" data-f="game_url" data-i="${i}" value="${esc(t.game_url)}" placeholder="Game URL">
      <input class="inp" data-f="image" data-i="${i}" value="${esc(t.image)}" placeholder="Image URL (http...)">
      <textarea class="inp" data-f="image_base64" data-i="${i}" placeholder="Hoặc dán Base64 ảnh tool tại đây (ưu tiên hơn URL)">${esc(t.image_base64||'')}</textarea>
      <div class="acts">
        <button class="b2" onclick="saveCfgToolAt(${i})">💾 LƯU</button>
        <button class="b1" onclick="toggleToolVip(${i})">${t.vip?'Gỡ VIP':'Set VIP'}</button>
        <button class="b3" onclick="toggleToolMaint(${i})">${t.maintenance?'Tắt BT':'Bảo trì'}</button>
        <button class="b5" onclick="deleteToolAt(${i})">Xoá</button>
      </div>
    `;
    box.appendChild(tr);
  });
  // Add tool
  const addT=document.createElement('div');
  addT.className='adm-section';
  addT.innerHTML=`<h4><i class="fa-solid fa-plus"></i> Thêm Tool mới</h4>
    <button class="green" onclick="addNewTool()">➕ THÊM TOOL TRỐNG</button>`;
  box.appendChild(addT);
}
function saveCfgSite(){
  const cfg=loadConfig();
  cfg.site_name=document.getElementById('cfgSiteName').value;
  cfg.marquee=document.getElementById('cfgMarquee').value;
  cfg.notice_title=document.getElementById('cfgNoticeTitle').value;
  cfg.notice=document.getElementById('cfgNotice').value;
  saveConfig(cfg);
  document.getElementById('hdrBrand').textContent=cfg.site_name;
  document.getElementById('marqueeText').textContent=cfg.marquee;
  alert('✅ Đã lưu cấu hình chung!');
}
function saveCfgQR(){
  const cfg=loadConfig();
  const raw=document.getElementById('cfgQRBase64').value.trim();
  if(!raw){alert('⚠️ Vui lòng dán Base64!');return;}
  cfg.qr_base64=normalizeAvatar(raw)||raw;
  saveConfig(cfg);
  renderAdminConfig();
  alert('✅ Đã lưu QR!');
}
function clearCfgQR(){
  if(!confirm('Xoá QR hiện tại?'))return;
  const cfg=loadConfig();cfg.qr_base64='';saveConfig(cfg);renderAdminConfig();
}
function saveCfgPkg(){
  try{
    const cfg=loadConfig();
    const j=JSON.parse(document.getElementById('cfgPkgJson').value);
    if(!Array.isArray(j))throw new Error('Không phải mảng');
    cfg.packages=j;saveConfig(cfg);alert('✅ Đã lưu gói VIP!');
  }catch(e){alert('❌ JSON lỗi: '+e.message);}
}
function saveCfgTools(){
  try{
    const cfg=loadConfig();
    const j=JSON.parse(document.getElementById('cfgToolJson').value);
    if(!Array.isArray(j))throw new Error('Không phải mảng');
    cfg.tools=j;saveConfig(cfg);renderAdminConfig();renderTools();
    alert('✅ Đã lưu danh sách tool!');
  }catch(e){alert('❌ JSON lỗi: '+e.message);}
}
function saveCfgTool(){
  const slug=prompt('Nhập slug tool muốn lưu nhanh (vd: lc79-tx):');
  if(!slug)return;
  try{
    const cfg=loadConfig();
    const j=JSON.parse(document.getElementById('cfgToolJson').value);
    const t=j.find(x=>x.slug===slug);
    if(!t){alert('❌ Không tìm thấy slug!');return;}
    const idx=cfg.tools.findIndex(x=>x.slug===slug);
    if(idx>=0)cfg.tools[idx]=t;else cfg.tools.push(t);
    saveConfig(cfg);renderAdminConfig();renderTools();
    alert('✅ Đã lưu tool: '+slug);
  }catch(e){alert('❌ JSON lỗi: '+e.message);}
}
function saveCfgToolAt(i){
  const cfg=loadConfig();
  const t=cfg.tools[i];if(!t)return;
  document.querySelectorAll(`.cfg-row [data-i="${i}"]`).forEach(el=>{
    const f=el.dataset.f;
    if(f==='image_base64'){
      const v=el.value.trim();
      t[f]=v?(normalizeAvatar(v)||v):'';
    }else{
      t[f]=el.value;
    }
  });
  saveConfig(cfg);renderAdminConfig();renderTools();
  alert('✅ Đã lưu tool!');
}
function toggleToolVip(i){
  const cfg=loadConfig();cfg.tools[i].vip=cfg.tools[i].vip?0:1;saveConfig(cfg);renderAdminConfig();
}
function toggleToolMaint(i){
  const cfg=loadConfig();cfg.tools[i].maintenance=cfg.tools[i].maintenance?0:1;saveConfig(cfg);renderAdminConfig();
}
function deleteToolAt(i){
  if(!confirm('Xoá tool: '+cfg?.tools?.[i]?.name||''))return;
  const cfg=loadConfig();cfg.tools.splice(i,1);saveConfig(cfg);renderAdminConfig();renderTools();
}
function addNewTool(){
  const cfg=loadConfig();
  cfg.tools.push({name:'Tool mới',slug:'tool-'+Date.now(),cat:'taixiu',kind:'view',game_url:'',api_url:'',image:'',image_base64:'',hot:0,vip:1,is_new:1,enabled:1,maintenance:0});
  saveConfig(cfg);renderAdminConfig();
}

/* ===== KEYS ===== */
function renderAdminKeys(){
  const box=document.getElementById('adminKeysView');
  const arr=loadKeys();
  box.innerHTML='';
  const add=document.createElement('div');
  add.className='adm-section';
  add.innerHTML=`
    <h4><i class="fa-solid fa-key"></i> Tạo key mới</h4>
    <input type="number" id="keyDays" placeholder="Số ngày (vd: 1, 3, 7, 30)" value="1">
    <input type="text" id="keyNote" placeholder="Ghi chú (tuỳ chọn)">
    <input type="number" id="keyQty" placeholder="Số lượng key cần tạo" value="1">
    <button class="green" onclick="admGenKeys()">🔑 TẠO KEY</button>
  `;
  box.appendChild(add);
  const list=document.createElement('div');
  list.className='adm-section';
  list.innerHTML=`<h4><i class="fa-solid fa-list"></i> Danh sách key (${arr.length})</h4>`;
  arr.slice().reverse().forEach(k=>{
    const d=document.createElement('div');
    d.style.cssText='padding:8px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:6px;background:#fff;font-size:11px';
    d.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
        <div style="font-family:monospace;font-weight:800;color:${k.used?'#94a3b8':'#3b5bfd'};font-size:12px">${esc(k.key)}</div>
        <div style="font-size:10px;font-weight:800;color:${k.used?'#ef4444':'#10b981'}">${k.used?'ĐÃ DÙNG':'CHƯA DÙNG'}</div>
      </div>
      <div style="color:#64748b;margin-top:3px">${k.days} ngày · ${esc(k.note||'—')}</div>
      ${k.used?`<div style="color:#94a3b8;font-size:10px">→ ${esc(k.usedBy)} (${fmtDate(k.usedAt)})</div>`:''}
      <button style="margin-top:5px;padding:4px 8px;border-radius:6px;border:none;background:#ef4444;color:#fff;font-size:10px;font-weight:700;cursor:pointer" onclick="admDelKey('${k.key}')">Xoá</button>
    `;
    list.appendChild(d);
  });
  box.appendChild(list);
}
function admGenKeys(){
  const days=parseInt(document.getElementById('keyDays').value,10)||1;
  const note=document.getElementById('keyNote').value.trim();
  const qty=parseInt(document.getElementById('keyQty').value,10)||1;
  const arr=[];
  for(let i=0;i<qty;i++)arr.push(createKey(days,note).key);
  alert('✅ Đã tạo '+qty+' key:\n\n'+arr.join('\n'));
  renderAdminKeys();
}
function admDelKey(code){
  if(!confirm('Xoá key: '+code+'?'))return;
  const arr=loadKeys().filter(k=>k.key!==code);saveKeys(arr);renderAdminKeys();
}
