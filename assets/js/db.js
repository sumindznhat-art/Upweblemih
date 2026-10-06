/* ============================================================
   DATABASE - localStorage
   ============================================================ */
const DB_KEY = 'zenro_users_v3';
const SESS_KEY = 'zenro_session_v3';

function now(){ return Date.now(); }

function fmt(n){ return Number(n||0).toLocaleString('vi-VN') + 'đ'; }

function fmtDate(ts){
  if(!ts) return '---';
  const d = new Date(ts), p = n => String(n).padStart(2,'0');
  return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function fmtDateShort(ts){
  if(!ts) return '---';
  const d = new Date(ts), p = n => String(n).padStart(2,'0');
  return `${p(d.getDate())}/${p(d.getMonth()+1)}/${String(d.getFullYear()).slice(2)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function loadDB(){
  try {
    let raw = localStorage.getItem(DB_KEY);
    if(!raw){
      const admin = {
        email: CONFIG.adminEmail,
        password: CONFIG.adminPassword,
        name: 'Admin Tổng',
        balance: 999999999,
        keyExpiry: now() + 100*365*24*3600*1000,
        isAdmin: true, ip: 'local', lastLogin: now(), createdAt: now(),
        avatar: '', deposits: [], keyHistory: []
      };
      const db = { users: {}, allDeposits: [], allKeyHistory: [] };
      db.users[CONFIG.adminEmail] = admin;
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      return db;
    }
    const db = JSON.parse(raw);
    if(!db.users) db.users = {};
    if(!db.allDeposits) db.allDeposits = [];
    if(!db.allKeyHistory) db.allKeyHistory = [];
    // Đảm bảo admin tồn tại
    if(!db.users[CONFIG.adminEmail]){
      db.users[CONFIG.adminEmail] = {
        email: CONFIG.adminEmail, password: CONFIG.adminPassword,
        name: 'Admin Tổng', balance: 999999999,
        keyExpiry: now() + 100*365*24*3600*1000,
        isAdmin: true, ip: 'local', lastLogin: now(), createdAt: now(),
        avatar: '', deposits: [], keyHistory: []
      };
      saveDB(db);
    }
    return db;
  } catch(e){ return { users:{}, allDeposits:[], allKeyHistory:[] }; }
}
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }
function getUser(email){ return loadDB().users[email] || null; }
function setUser(email, data){ const db = loadDB(); db.users[email] = data; saveDB(db); }
function delUser(email){ const db = loadDB(); delete db.users[email]; saveDB(db); }
function currentUser(){ const e = localStorage.getItem(SESS_KEY); return e ? getUser(e) : null; }
function setSession(e){ localStorage.setItem(SESS_KEY, e); }
function clearSession(){ localStorage.removeItem(SESS_KEY); }

/* ===== Deposit (yêu cầu nạp tiền) ===== */
function createDeposit(email, amount, method, note){
  const db = loadDB();
  const id = 'DEP' + now() + Math.floor(Math.random()*1000);
  const dep = {
    id, email, amount: Number(amount), method, note,
    status: 'pending', createdAt: now(), approvedAt: 0, approvedBy: ''
  };
  db.allDeposits.unshift(dep);
  if(!db.users[email].deposits) db.users[email].deposits = [];
  db.users[email].deposits.unshift(dep);
  saveDB(db);
  return dep;
}
function approveDeposit(depId, adminEmail){
  const db = loadDB();
  const dep = db.allDeposits.find(d => d.id === depId);
  if(!dep || dep.status !== 'pending') return false;
  dep.status = 'approved';
  dep.approvedAt = now();
  dep.approvedBy = adminEmail;
  const u = db.users[dep.email];
  if(u){
    u.balance = (u.balance||0) + dep.amount;
    if(u.deposits){
      const local = u.deposits.find(d => d.id === depId);
      if(local){ local.status = 'approved'; local.approvedAt = dep.approvedAt; }
    }
  }
  saveDB(db);
  return true;
}
function rejectDeposit(depId, adminEmail, reason){
  const db = loadDB();
  const dep = db.allDeposits.find(d => d.id === depId);
  if(!dep || dep.status !== 'pending') return false;
  dep.status = 'rejected';
  dep.approvedAt = now();
  dep.approvedBy = adminEmail;
  dep.reason = reason || '';
  const u = db.users[dep.email];
  if(u && u.deposits){
    const local = u.deposits.find(d => d.id === depId);
    if(local){ local.status = 'rejected'; local.reason = dep.reason; }
  }
  saveDB(db);
  return true;
}
function getPendingDeposits(){
  return loadDB().allDeposits.filter(d => d.status === 'pending');
}
function getUserDeposits(email){
  const u = getUser(email);
  return u && u.deposits ? u.deposits : [];
}

/* ===== Key history (lịch sử mua key) ===== */
function addKeyHistory(email, pkg){
  const db = loadDB();
  const entry = {
    id: 'KEY' + now() + Math.floor(Math.random()*1000),
    email, packageName: pkg.name, days: pkg.days,
    price: pkg.price, purchasedAt: now()
  };
  db.allKeyHistory.unshift(entry);
  if(!db.users[email].keyHistory) db.users[email].keyHistory = [];
  db.users[email].keyHistory.unshift(entry);
  saveDB(db);
  return entry;
}
function getUserKeyHistory(email){
  const u = getUser(email);
  return u && u.keyHistory ? u.keyHistory : [];
}
function getAllKeyHistory(){ return loadDB().allKeyHistory; }
function getAllDeposits(){ return loadDB().allDeposits; }
