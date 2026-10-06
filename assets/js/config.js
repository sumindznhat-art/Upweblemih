/* ============================================================
   CẤU HÌNH HỆ THỐNG - Chỉnh sửa tại đây
   ============================================================ */
const CONFIG = {
  siteName: 'BONTX TOOL',
  version: '2.4',
  adminEmail: 'leminhdz@gmail.com',
  adminPassword: 'admin123',
  defaultAvatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%23e0f2fe'/><stop offset='100%25' stop-color='%23bae6fd'/></linearGradient></defs><rect fill='url(%23g)' width='200' height='200'/><text x='50%25' y='56%25' font-size='100' text-anchor='middle' dominant-baseline='middle'>🎀</text></svg>"
};

/* ============================================================
   DANH SÁCH TOOLS / PORTS
   kind: 'view' (có iframe game) | 'panel' (chỉ API)
   ============================================================ */
const PORTS = [
  { name:"LC79 Tài Xỉu", slug:"lc79-tx", cat:"taixiu", kind:"view",
    game_url:"https://lc79.bet", api_url:"https://wtx.tele68.com/v1/tx/sessions",
    image:"https://files.catbox.moe/ng8pg8.jfif", hot:1, vip:1, is_new:0,
    desc:"Hỗ trợ bàn Tài Xỉu Hũ - AI phân tích dữ liệu" },

  { name:"LC79 MD5", slug:"lc79-md5", cat:"taixiu", kind:"view",
    game_url:"https://lc79.bet", api_url:"https://wtxmd52.tele68.com/v1/txmd5/sessions",
    image:"https://files.catbox.moe/ng8pg8.jfif", hot:1, vip:1, is_new:0,
    desc:"Hỗ trợ bàn Tài Xỉu MD5 - AI phân tích dữ liệu" },

  { name:"BetVip Hũ", slug:"betvip-hu", cat:"taixiu", kind:"view",
    game_url:"https://play.betvip.hot/", api_url:"https://wtx.macminim6.online/v1/tx/sessions",
    image:"https://files.catbox.moe/2gu29f.jpg", hot:1, vip:1, is_new:0,
    desc:"BetVip Hũ - Tỉ lệ thắng cực cao, hỗ trợ Tài Xỉu Hũ" },

  { name:"BetVip MD5", slug:"betvip-md5", cat:"taixiu", kind:"view",
    game_url:"https://play.betvip.hot/", api_url:"https://wtxmd52.macminim6.online/v1/txmd5/sessions",
    image:"https://files.catbox.moe/2gu29f.jpg", hot:1, vip:1, is_new:0,
    desc:"BetVip MD5 - Tỉ lệ thắng cực cao, hỗ trợ Tài Xỉu MD5" },

  { name:"Sunwin Tài Xỉu", slug:"sunwin-tx", cat:"taixiu", kind:"view",
    game_url:"https://web.sunwin.radio/", api_url:"https://cancer-counted-board-dam.trycloudflare.com/api/taixiu/history",
    image:"https://files.catbox.moe/ny0ayd.jpg", hot:1, vip:1, is_new:0,
    desc:"SunWin Tài Xỉu - Tích hợp công nghệ AI thế hệ mới" },

  { name:"Max789 Hũ", slug:"max789-hu", cat:"taixiu", kind:"view",
    game_url:"https://play.max789.vin/", api_url:"https://taixiu.maksh3979madfw.com/api/luckydice/GetSoiCau",
    image:"https://files.catbox.moe/lsz8db.jpg", hot:1, vip:1, is_new:1,
    desc:"Max789 Hũ - Soi cầu chuẩn xác cao" },

  { name:"Max789 MD5", slug:"max789-md5", cat:"taixiu", kind:"view",
    game_url:"https://play.max789.vin/", api_url:"https://max789-nqfd.onrender.com/api/taixiumd5/max789",
    image:"https://files.catbox.moe/lsz8db.jpg", hot:1, vip:1, is_new:0,
    desc:"Max789 MD5 - Hỗ trợ bàn MD5 chuyên sâu" },

  { name:"Hitclub Tài Xỉu", slug:"hit-tx", cat:"taixiu", kind:"panel",
    game_url:"", api_url:"https://draw-prisoner-bathroom-anthony.trycloudflare.com/api/hit_tx/history",
    image:"https://files.catbox.moe/w2lk5r.jpg", hot:1, vip:1, is_new:0,
    desc:"HitClub Tài Xỉu - Hệ thống hỗ trợ Tài Xỉu Hũ" },

  { name:"Hitclub MD5", slug:"hit-md5", cat:"taixiu", kind:"panel",
    game_url:"", api_url:"https://apihitclubmd5-x6r3.onrender.com/",
    image:"https://files.catbox.moe/w2lk5r.jpg", hot:1, vip:1, is_new:1,
    desc:"HitClub MD5 - Hệ thống hỗ trợ bàn MD5" },

  { name:"B52 Tài Xỉu", slug:"b52-tx", cat:"taixiu", kind:"panel",
    game_url:"", api_url:"https://draw-prisoner-bathroom-anthony.trycloudflare.com/api/b52_tx/history",
    image:"https://files.catbox.moe/yfwwxu.jpg", hot:1, vip:1, is_new:0,
    desc:"B52 Tài Xỉu - Hỗ trợ bàn Tài Xỉu Hũ" },

  { name:"B52 MD5", slug:"b52-md5", cat:"taixiu", kind:"panel",
    game_url:"", api_url:"https://b52-qiw2.onrender.com/api/history",
    image:"https://files.catbox.moe/yfwwxu.jpg", hot:0, vip:1, is_new:0,
    desc:"B52 MD5 - Hỗ trợ bàn Tài Xỉu MD5" },

  { name:"Baccarat AI", slug:"baccarat", cat:"baccarat", kind:"view",
    game_url:"https://fly88m.cc/", api_url:"https://apisieunhanh.lovable.app/api/public/bYoIEro5CgRHbfQ0qBgcYJYy1rfUTRafwqcZh0ta/apibaccarat",
    image:"https://files.catbox.moe/5ughb8.png", hot:1, vip:1, is_new:1,
    desc:"Baccarat Sảnh Sexy - Hỗ trợ soi cầu Baccarat AI" },

  { name:"Xocdia88 Hũ", slug:"xocdia88-hu", cat:"taixiu", kind:"view",
    game_url:"https://play.xocdia88.news/", api_url:"https://taixiu.system32-cloudfare-356783752985678522.monster/api/luckydice/GetSoiCau",
    image:"https://files.catbox.moe/7eg34c.jpeg", hot:0, vip:1, is_new:0,
    desc:"XocDia88 Hũ - Hỗ trợ bàn Tài Xỉu Hũ" },

  { name:"Xocdia88 MD5", slug:"xocdia88-md5", cat:"taixiu", kind:"view",
    game_url:"https://play.xocdia88.news/", api_url:"https://taixiumd5.system32-cloudfare-356783752985678522.monster/api/md5luckydice/GetSoiCau",
    image:"https://files.catbox.moe/7eg34c.jpeg", hot:0, vip:1, is_new:0,
    desc:"XocDia88 MD5 - Hỗ trợ bàn Tài Xỉu MD5" },

  { name:"SumClub Tài Xỉu", slug:"sumclub-tx", cat:"taixiu", kind:"view",
    game_url:"https://play.sum1.vin/", api_url:"https://apisieunhanh.lovable.app/api/public/bYoIEro5CgRHbfQ0qBgcYJYy1rfUTRafwqcZh0ta/apisumclub",
    image:"https://files.catbox.moe/lnkimr.jfif", hot:0, vip:1, is_new:0,
    desc:"SumClub Tài Xỉu - Hỗ trợ bàn Tài Xỉu Hũ" },

  { name:"SumClub MD5", slug:"sumclub-md5", cat:"taixiu", kind:"view",
    game_url:"https://play.sum1.vin/", api_url:"https://draw-prisoner-bathroom-anthony.trycloudflare.com/api/sumclub_md5/history",
    image:"https://files.catbox.moe/lnkimr.jfif", hot:0, vip:1, is_new:0,
    desc:"SumClub MD5 - Hỗ trợ bàn Tài Xỉu MD5" },

  { name:"Son789 MD5", slug:"son789-md5", cat:"taixiu", kind:"view",
    game_url:"https://play.son789.site/", api_url:"https://draw-prisoner-bathroom-anthony.trycloudflare.com/api/son789/history",
    image:"https://files.catbox.moe/977u1z.jfif", hot:0, vip:1, is_new:0,
    desc:"Son789 MD5 - Hỗ trợ bàn Tài Xỉu MD5" }
];

/* ============================================================
   GÓI VIP
   ============================================================ */
const PACKAGES = [
  { id:'p1',  name:'VIP Member 1 Ngày', days:1,   price:45000,  old:55000,  disc:'-18%', sub:'Gói đặc quyền' },
  { id:'p3',  name:'VIP Member 3 Ngày', days:3,   price:120000, old:150000, disc:'-20%', sub:'Gói đặc quyền' },
  { id:'p7',  name:'VIP Member 1 Tuần', days:7,   price:250000, old:300000, disc:'-17%', sub:'Gói đặc quyền' },
  { id:'p30', name:'VIP Member 1 Tháng',days:30,  price:800000, old:1000000,disc:'-20%', sub:'Gói đặc quyền' }
];
