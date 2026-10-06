/* ============================================================
   TOOL PREDICTION ENGINE - AI phân tích Tài Xỉu
   ============================================================ */
document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const card = document.getElementById(btn.dataset.target);
    card.classList.toggle('collapsed');
    btn.textContent = card.classList.contains('collapsed') ? '+' : '−';
  });
});

function ganKeoTha(el){
  let drag = false, sx, sy, ix, iy;
  el.addEventListener('pointerdown', e => {
    if(e.target.closest('.toggle-btn')) return;
    drag = true; sx = e.clientX; sy = e.clientY; ix = el.offsetLeft; iy = el.offsetTop;
    try{ el.setPointerCapture(e.pointerId); }catch(_){}
  });
  el.addEventListener('pointermove', e => {
    if(!drag) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    requestAnimationFrame(()=>{ el.style.left=(ix+dx)+'px'; el.style.top=(iy+dy)+'px'; el.style.right='auto'; });
  });
  const stop = () => drag = false;
  el.addEventListener('pointerup', stop);
  el.addEventListener('pointercancel', stop);
}
document.querySelectorAll('.drag-group').forEach(ganKeoTha);

/* ===== Core algorithm ===== */
function startToolEngine(apiUrl, slug){
  // Reset UI
  ['md5','hu'].forEach(k => {
    document.getElementById('tai-'+k).textContent = '--%';
    document.getElementById('xiu-'+k).textContent = '--%';
    document.getElementById('tai-'+k).classList.remove('active','resting');
    document.getElementById('xiu-'+k).classList.remove('active','resting');
    document.getElementById('conf-'+k).classList.remove('show','mid','ok','high');
    document.getElementById('conf-bar-'+k).style.width = '0%';
    document.getElementById('status-'+k).textContent = 'Đang tải...';
    document.getElementById('sid-'+k).textContent = '#----';
  });

  // Chỉ dùng 1 API chính cho cả 2 card (tùy tool)
  const apiMain = apiUrl;

  class PredictionEngine {
    constructor(){
      this.ch = []; this.td = []; this.xx = [];
      this.max = 500;
      this.ng = {1:6,2:8,3:10,4:14,5:18,6:22};
      this.lastSid = null;
      this.im = false;
      this.lastGy = null;
    }
    dice(it){
      const maps = [['dice1','dice2','dice3'],['xucxac1','xucxac2','xucxac3'],['d1','d2','d3'],['x1','x2','x3']];
      for(const [a,b,c] of maps){ if(it[a]!=null && it[b]!=null && it[c]!=null){ const arr=[+it[a],+it[b],+it[c]]; if(arr.every(n=>n>=1&&n<=6)) return arr; } }
      for(const f of ['dice','dices','xucxac','xuc_xac']){ if(Array.isArray(it[f]) && it[f].length>=3){ const arr=it[f].slice(0,3).map(Number); if(arr.every(n=>n>=1&&n<=6)) return arr; } }
      return null;
    }
    nap(items){
      this.ch=[]; this.td=[]; this.xx=[];
      for(const it of items){
        const r = it.resultTruyenThong || it.result || it.ketQua || it.result_truyenthong || it.resultTruyenThong;
        if(r !== 'TAI' && r !== 'XIU') continue;
        this.ch.push(r);
        const d = this.dice(it);
        this.xx.push(d);
        this.td.push(d ? d[0]+d[1]+d[2] : null);
      }
      if(this.ch.length > this.max){ const c = -this.max; this.ch=this.ch.slice(c); this.td=this.td.slice(c); this.xx=this.xx.slice(c); }
    }
    ngM(k){ return this.ng[k] || 22; }
    fg(fp, hc){
      const c = this.ch, k = fp.length;
      if(!k) return {t:0,x:0,s:0,v:[]};
      const tot = fp.reduce((a,b)=>a+b,0);
      let t=0, x=0; const v=[];
      for(let st=0; st<c.length-tot; st++){
        let p = st, ok = true, ht = null, hc2 = null;
        for(const dd of fp){
          if(p+dd > c.length){ ok=false; break; }
          const seg = c.slice(p, p+dd);
          if(new Set(seg).size !== 1){ ok=false; break; }
          const h = seg[0];
          if(ht !== null && h === ht){ ok=false; break; }
          ht = h; hc2 = h; p += dd;
        }
        if(!ok) continue;
        if(hc !== null && hc2 !== hc) continue;
        if(st > 0 && c[st-1] === c[st]) continue;
        if(p >= c.length) continue;
        if(c[p] === 'TAI') t++; else x++;
        v.push(p);
      }
      return {t, x, s: t+x, v};
    }
    pattern(){
      const g = this.ch.slice(-24);
      if(g.length < 3) return null;
      const nh = [];
      let d = g[0], c = 1;
      for(let i=1;i<g.length;i++){ if(g[i]===d) c++; else { nh.push({k:d,n:c}); d=g[i]; c=1; } }
      nh.push({k:d,n:c});
      if(!nh.length) return null;
      const h = nh[nh.length-1].k;
      const dn = nh[nh.length-1].n;
      const kMax = Math.min(6, nh.length);
      for(let k=kMax;k>=1;k--){
        const fp = nh.slice(-k).map(n=>n.n);
        const {s} = this.fg(fp, h);
        if(s >= this.ngM(k)) return {fp, h, k};
      }
      return {fp:[dn], h, k:1};
    }
    hist(p){
      if(!p) return {t:null,x:null,s:0,v:[]};
      const {t,x,s,v} = this.fg(p.fp, p.h);
      if(s < this.ngM(p.fp.length)) return {t:null,x:null,s,v};
      return {t: t/s*100, x: x/s*100, s, v};
    }
    scan(){
      const p = this.pattern();
      const h = this.hist(p);
      let rt = h.t;
      if(rt === null && this.ch.length >= 5) rt = this.ch.filter(x=>x==='TAI').length / this.ch.length * 100;
      if(rt === null) return {gy: null, rt: 50, rx: 50, n: 0};
      return {gy: rt >= 50 ? 'TAI' : 'XIU', rt, rx: 100-rt, n: h.s || this.ch.length};
    }
  }

  const eng = new PredictionEngine();

  function setCircles(prefix, h, nhay, rt, rx){
    const taiEl = document.getElementById('tai-'+prefix);
    const xiuEl = document.getElementById('xiu-'+prefix);
    taiEl.classList.remove('active','resting');
    xiuEl.classList.remove('active','resting');
    if(rt != null && rx != null){ taiEl.textContent = Math.round(rt)+'%'; xiuEl.textContent = Math.round(rx)+'%'; }
    else { taiEl.textContent = '--%'; xiuEl.textContent = '--%'; }
    if(!h) return;
    const el = h === 'TAI' ? taiEl : xiuEl;
    el.classList.add(nhay ? 'active' : 'resting');
  }
  function setConf(prefix, d, nhay){
    const cfEl = document.getElementById('conf-'+prefix);
    const cfLv = cfEl.querySelector('.conf-level');
    const cfNm = cfEl.querySelector('.conf-num');
    const cfBar = document.getElementById('conf-bar-'+prefix);
    if(!nhay || d < 50){ cfEl.classList.remove('show','mid','ok','high'); cfBar.style.width='0%'; return; }
    let lv = '', cls = '';
    if(d >= 80){ lv = 'CAO'; cls = 'high'; }
    else if(d >= 70){ lv = 'ỔN'; cls = 'ok'; }
    else { lv = 'TRUNG BÌNH'; cls = 'mid'; }
    cfLv.textContent = lv; cfNm.textContent = d+'%';
    cfEl.classList.add('show'); cfEl.classList.remove('mid','ok','high'); cfEl.classList.add(cls);
    cfBar.style.width = Math.min(100, d)+'%';
  }

  async function tick(prefix, url){
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if(!res.ok) throw 0;
      const data = await res.json();
      const list = data.list || data.data || data.sessions || data.result || data;
      if(!Array.isArray(list) || !list.length) throw 0;
      const asc = [...list].sort((a,b) => (a.id||0) - (b.id||0));
      const nid = list[0].id ?? asc[asc.length-1].id;
      const sidEl = document.getElementById('sid-'+prefix);
      const stEl = document.getElementById('status-'+prefix);

      eng.nap(asc);
      const qs = eng.scan();
      sidEl.textContent = '#' + (nid+1);
      if(qs.gy){
        const d = Math.round(50 + Math.abs(qs.rt - 50) * (qs.n > 20 ? 1.2 : 1));
        setCircles(prefix, qs.gy, true, qs.rt, qs.rx);
        setConf(prefix, Math.min(95, d), true);
        stEl.textContent = 'Đang chờ...'; stEl.classList.add('analyzing');
      } else {
        setCircles(prefix, null, false, null, null);
        setConf(prefix, 0, false);
        stEl.textContent = 'Đang tải dữ liệu...'; stEl.classList.remove('analyzing');
      }
    } catch(e){
      document.getElementById('status-'+prefix).textContent = 'Lỗi kết nối API';
      document.getElementById('status-'+prefix).classList.remove('analyzing');
    }
  }

  // Chạy cả 2 card với cùng API
  tick('md5', apiMain);
  tick('hu', apiMain);

  window.__toolInterval = setInterval(() => {
    tick('md5', apiMain);
    tick('hu', apiMain);
  }, 5000);
}
