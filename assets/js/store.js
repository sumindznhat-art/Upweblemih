/* ============================================================
   LOCAL STORAGE DB
   ============================================================ */
const DB_KEY='zenro_users_v1';
const SESS_KEY='zenro_session_v1';
const AVATAR_KEY='zenro_avatar_v1';
const CFG_KEY='zenro_config_v1';
const KEYS_KEY='zenro_keys_v1';

const DEFAULT_AVATAR="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%23e0f2fe'/><stop offset='100%25' stop-color='%23bae6fd'/></linearGradient></defs><rect fill='url(%23g)' width='200' height='200'/><text x='50%25' y='56%25' font-size='90' text-anchor='middle' dominant-baseline='middle'>🎀</text></svg>";

function now(){return Date.now();}
function fmt(n){return Number(n).toLocaleString('vi-VN')+'đ';}
function fmtDate(ts){if(!ts)return '---';const d=new Date(ts),p=n=>String(n).padStart(2,'0');return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;}
function fmtDateShort(ts){if(!ts)return '---';const d=new Date(ts),p=n=>String(n).padStart(2,'0');return `${p(d.getDate())}/${p(d.getMonth()+1)}/${String(d.getFullYear()).slice(2)} ${p(d.getHours())}:${p(d.getMinutes())}`;}
function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

/* ===== USERS DB ===== */
function loadDB(){
  try{
    let raw=localStorage.getItem(DB_KEY);
    if(!raw){
      const admin={email:'leminhdz@gmail.com',password:'admin123',name:'Admin Tổng',balance:999999999,
        keyExpiry:now()+100*365*24*3600*1000,isAdmin:true,ip:'local',lastLogin:now(),createdAt:now()};
      const db={users:{'leminhdz@gmail.com':admin}};
      localStorage.setItem(DB_KEY,JSON.stringify(db));
      return db;
    }
    const db=JSON.parse(raw);
    if(!db.users) db.users={};
    if(!db.users['leminhdz@gmail.com']){
      db.users['leminhdz@gmail.com']={email:'leminhdz@gmail.com',password:'admin123',name:'Admin Tổng',balance:999999999,
        keyExpiry:now()+100*365*24*3600*1000,isAdmin:true,ip:'local',lastLogin:now(),createdAt:now()};
      localStorage.setItem(DB_KEY,JSON.stringify(db));
    }
    return db;
  }catch(e){return {users:{}};}
}
function saveDB(db){localStorage.setItem(DB_KEY,JSON.stringify(db));}
function getUser(e){return loadDB().users[e]||null;}
function setUser(e,d){const db=loadDB();db.users[e]=d;saveDB(db);}
function delUser(e){const db=loadDB();delete db.users[e];saveDB(db);}
function currentUser(){const e=localStorage.getItem(SESS_KEY);return e?getUser(e):null;}
function setSession(e){localStorage.setItem(SESS_KEY,e);}
function clearSession(){localStorage.removeItem(SESS_KEY);}

/* ===== CONFIG DB ===== */
function loadConfig(){
  try{
    const raw=localStorage.getItem(CFG_KEY);
    if(!raw){
      const cfg=JSON.parse(JSON.stringify(window.APP_CONFIG));
      localStorage.setItem(CFG_KEY,JSON.stringify(cfg));
      return cfg;
    }
    const cfg=JSON.parse(raw);
    // merge missing fields
    if(!cfg.packages) cfg.packages=window.APP_CONFIG.packages;
    if(!cfg.tools) cfg.tools=window.APP_CONFIG.tools;
    if(!cfg.notice) cfg.notice=window.APP_CONFIG.notice;
    if(!cfg.notice_title) cfg.notice_title=window.APP_CONFIG.notice_title;
    if(!cfg.marquee) cfg.marquee=window.APP_CONFIG.marquee;
    return cfg;
  }catch(e){return JSON.parse(JSON.stringify(window.APP_CONFIG));}
}
function saveConfig(cfg){localStorage.setItem(CFG_KEY,JSON.stringify(cfg));}
function resetConfig(){localStorage.removeItem(CFG_KEY);return loadConfig();}

/* ===== KEYS DB ===== */
function loadKeys(){try{return JSON.parse(localStorage.getItem(KEYS_KEY)||'[]');}catch(e){return[];}}
function saveKeys(arr){localStorage.setItem(KEYS_KEY,JSON.stringify(arr));}
function genKey(){
  const C='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const g=()=>Array.from({length:4},()=>C[Math.floor(Math.random()*C.length)]).join('');
  return `${g()}-${g()}-${g()}`;
}
function createKey(days,note){
  const arr=loadKeys();
  const k={key:genKey(),days:days,note:note||'',used:false,usedBy:'',createdAt:now(),usedAt:0};
  arr.push(k);saveKeys(arr);return k;
}
function findKey(code){const arr=loadKeys();return arr.find(k=>k.key.toUpperCase()===String(code).toUpperCase().trim())||null;}
function markKeyUsed(code,email){
  const arr=loadKeys();
  const k=arr.find(k=>k.key.toUpperCase()===String(code).toUpperCase().trim());
  if(k){k.used=true;k.usedBy=email;k.usedAt=now();saveKeys(arr);}
}

/* ===== AVATAR ===== */
function normalizeAvatar(raw){
  if(!raw)return null;raw=raw.trim();if(!raw)return null;
  if(/^data:image\//i.test(raw)) return raw;
  let mime='image/jpeg';
  if(raw.startsWith('iVBOR'))mime='image/png';
  else if(raw.startsWith('R0lGOD'))mime='image/gif';
  else if(raw.startsWith('UklGR'))mime='image/webp';
  return `data:${mime};base64,${raw}`;
}
function applyAvatarEverywhere(src){
  ['loginAvatarImg','hdrAvatar','profAvatar'].forEach(id=>{
    const el=document.getElementById(id);if(el&&src)el.src=src;
  });
}
