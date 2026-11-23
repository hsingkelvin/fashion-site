/* 資料層：讀取同資料夾的 *.json；之後把 get() 改成後端 API 路徑即可 */
const CONFIG = { currency: 'NT$', dataBase: '', freeShip: 1500, shipFee: 80 };
const get = n => fetch(CONFIG.dataBase + n + '.json').then(r => { if (!r.ok) throw new Error(n); return r.json(); });
const api = {
  getProducts: () => get('products'), getNav: () => get('nav'),
  getFaq: () => get('faq'), getReviews: () => get('reviews'),
  login: async (email, pw) => { if (!email || !pw) throw new Error('請輸入電子郵件與密碼。'); return { email }; },          // TODO POST /auth/login
  register: async (email, pw) => { if (!email || pw.length < 6) throw new Error('請輸入電子郵件，密碼至少 6 碼。'); return { email }; }, // TODO POST /auth/register
  subscribe: async email => ({ ok: true }),                                                                                  // TODO POST /newsletter
  checkout: async order => ({ ok: false, message: '結帳尚未串接後端，訂單內容已輸出在 console。' })                          // TODO POST /orders
};
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const state = { products: [], cart: store.get('cart', []), wish: store.get('wish', []), cat: 'all', sort: 'rec', q: '', user: null, mode: 'login' };
const $ = (s, r = document) => r.querySelector(s);
const money = n => CONFIG.currency + ' ' + n.toLocaleString('en-US');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const openLayer = id => { $('#' + id).classList.add('open'); document.body.style.overflow = 'hidden'; };
const closeAll = () => { document.querySelectorAll('.layer').forEach(l => l.classList.remove('open')); document.body.style.overflow = ''; };
let tt;
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2200); };

/* 自繪服飾插畫（取代照片，之後可換成實拍商品圖） */
const SHAPE = {
  tee: 'M34 24L50 18Q60 30 70 18L86 24L108 50L94 60L86 52V120H34V52L26 60L12 50Z',
  jeans: 'M34 14H86L94 128H67L60 56L53 128H26Z',
  shirt: 'M36 22L52 16L60 28L68 16L84 22L110 102L97 106L86 62V122H34V62L23 106L10 102Z',
  jacket: 'M38 24L52 16Q60 24 68 16L82 24L112 104L98 109L86 66V124H34V66L22 109L8 104Z',
  dress: 'M44 14H76L80 46L102 124H18L40 46Z',
  socks: 'M26 12H52V78Q52 98 74 104Q82 118 68 122H38Q24 122 24 104ZM62 22H88V86Q88 104 108 110Q114 124 100 128H72Q58 128 58 112Z'
};
const DETAIL = {
  tee: '<path d="M50 18Q60 30 70 18" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1.5"/>',
  jeans: '<path d="M34 24H86M60 24V56" stroke="rgba(255,255,255,.45)" stroke-width="1.5"/>',
  shirt: '<path d="M60 28L52 40L60 48L68 40Z" fill="#fff" opacity=".75"/><path d="M60 48V122" stroke="rgba(0,0,0,.18)" stroke-width="1.5"/>',
  jacket: '<path d="M60 24V124" stroke="rgba(0,0,0,.28)" stroke-width="1.5"/><path d="M52 16Q60 6 68 16" fill="none" stroke="rgba(0,0,0,.22)" stroke-width="1.5"/>',
  dress: '<path d="M42 50H78" stroke="rgba(0,0,0,.2)" stroke-width="3"/>',
  socks: ''
};
const art = (type, c) => `<svg viewBox="0 0 120 150" aria-hidden="true"><ellipse cx="60" cy="139" rx="34" ry="4" fill="rgba(0,0,0,.1)"/><path d="${SHAPE[type] || SHAPE.tee}" fill="${esc(c)}" stroke="rgba(0,0,0,.14)" stroke-width="1.5" stroke-linejoin="round"/>${DETAIL[type] || ''}</svg>`;
const bgOf = b => `linear-gradient(160deg,${esc(b)},#fff)`;

/* 靜態區塊：Hero、分類、穿搭靈感、品牌 */
const HERO = [['tee', '#3b82a6', '#dcecf4'], ['jeans', '#3d5a8a', '#f1e7d8'], ['dress', '#c98b7a', '#e6f0ea'], ['jacket', '#2f4a3a', '#e9eef5'], ['shirt', '#a9c2d9', '#f6efe2'], ['socks', '#d9a066', '#e4ecf3']];
const tileHtml = ([t, c, b]) => `<div class="tile" style="background:${bgOf(b)}">${art(t, c)}</div>`;
$('#tiles').innerHTML = HERO.map(tileHtml).join('');
$('#brandTiles').innerHTML = HERO.slice(0, 4).map(tileHtml).join('');
const CATS = [['all', '全部'], ['top', '上衣'], ['bottom', '褲裝'], ['outer', '外套'], ['dress', '洋裝'], ['acc', '配件']];
const CATART = { top: ['shirt', '#a9c2d9', '#f5efe3'], bottom: ['jeans', '#3d5a8a', '#f3ead9'], outer: ['jacket', '#2f4a3a', '#e6eef0'], dress: ['dress', '#c98b7a', '#e8f1ec'], acc: ['socks', '#d9a066', '#e6edf4'] };
$('#catGrid').innerHTML = Object.entries(CATART).map(([k, [t, c, b]]) => `<button class="cat" data-cat="${k}" data-go><div class="tile" style="background:${bgOf(b)}">${art(t, c)}</div><strong>${CATS.find(x => x[0] === k)[1]}</strong></button>`).join('');
const LOOKS = [
  ['通勤日常', '襯衫＋直筒牛仔褲', [['shirt', '#a9c2d9'], ['jeans', '#3d5a8a']], '#f5efe3'],
  ['週末出遊', '基本款上衣＋工作褲', [['tee', '#3b82a6'], ['jeans', '#6b6f4f']], '#e3f0f6'],
  ['雨天機能', '風衣＋長襪', [['jacket', '#b79a72'], ['socks', '#7a8fb0']], '#f4eee3'],
  ['約會小洋裝', '洋裝＋外套', [['dress', '#c98b7a'], ['jacket', '#2f4a3a']], '#e8f1ec']
];
$('#lookGrid').innerHTML = LOOKS.map(([n, d, pair, b]) => `<div class="look"><div class="look-art" style="background:${bgOf(b)}">${pair.map(([t, c]) => art(t, c)).join('')}</div><h3>${n}</h3><p>${d}（範例）</p></div>`).join('');

/* 導覽 */
api.getNav().then(nav => {
  $('#menu').innerHTML = nav.map(i => i.children
    ? `<li><button type="button">${esc(i.label)} ▾</button><ul class="sub">${i.children.map(c => `<li><a href="${esc(c.href)}">${esc(c.label)}</a></li>`).join('')}</ul></li>`
    : `<li><a href="${esc(i.href)}">${esc(i.label)}</a></li>`).join('');
}).catch(() => {});
$('#burger').onclick = () => $('#menu').classList.toggle('open');
$('#menu').addEventListener('click', e => {
  const a = e.target.closest('a'); if (!a) return;
  const h = a.getAttribute('href') || '';
  if (h.startsWith('#cat:')) { e.preventDefault(); setCat(h.slice(5), true); }
  $('#menu').classList.remove('open');
});

/* FAQ／評價 */
const AV = ['#2086b5', '#c98b7a', '#5b8f6b', '#8a6fb0'];
api.getFaq().then(l => $('#faqList').innerHTML = l.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')).catch(() => {});
api.getReviews().then(l => $('#reviewRail').innerHTML = l.map((r, i) => `<div class="card"><div class="avatar" style="background:${AV[i % 4]}">${esc(r.name.slice(0, 1))}</div><div class="stars" aria-label="5 顆星">★★★★★</div><strong>${esc(r.name)}</strong><p>${esc(r.text)}</p></div>`).join('')).catch(() => {});

/* 商品：篩選、排序、卡片 */
const sizesHtml = (p, pre) => `<div class="sizes" role="radiogroup" aria-label="尺寸">${p.sizes.map((s, i) => `<label><input type="radio" name="${pre}-${esc(p.id)}" value="${esc(s)}" ${i ? '' : 'checked'}><span>${esc(s)}</span></label>`).join('')}</div>`;
const heartSvg = '<svg viewBox="0 0 24 24"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/></svg>';
const card = p => `
  <div class="card prod" data-pid="${esc(p.id)}">
    <div class="thumb" data-view="${esc(p.id)}" style="background:${bgOf(p.bg)}">${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}<button class="heart ${state.wish.includes(p.id) ? 'on' : ''}" data-wish="${esc(p.id)}" aria-label="收藏">${heartSvg}</button>${art(p.art, p.color)}</div>
    <h3 data-view="${esc(p.id)}">${esc(p.name)}</h3><p style="margin-bottom:4px">${esc(p.note)}</p>
    ${sizesHtml(p, 'sz')}
    <div class="price">${money(p.price)}<s>${money(p.orig)}</s></div>
    <button class="btn" data-add="${esc(p.id)}">加入購物車</button>
  </div>`;
const view = () => {
  let l = state.products.filter(p => (state.cat === 'all' || p.cat === state.cat) && (!state.q || (p.name + p.note).toLowerCase().includes(state.q)));
  if (state.sort === 'asc') l = [...l].sort((a, b) => a.price - b.price);
  if (state.sort === 'desc') l = [...l].sort((a, b) => b.price - a.price);
  return l;
};
const renderChips = () => { $('#chips').innerHTML = CATS.map(([k, n]) => `<button class="chip ${state.cat === k ? 'on' : ''}" data-cat="${k}">${n}</button>`).join(''); };
function renderPlans() {
  if (!state.products.length) return;
  const l = view();
  $('#count').textContent = '共 ' + l.length + ' 件';
  $('#qchip').innerHTML = state.q ? `<button class="chip on" data-clearq>搜尋：${esc(state.q)} ×</button>` : '';
  $('#planGrid').innerHTML = l.length ? l.map(card).join('') : '<p class="msg">找不到符合的商品，換個分類或關鍵字試試。</p>';
}
function setCat(k, scroll) {
  state.cat = k; state.q = ''; renderChips(); renderPlans();
  if (scroll) $('#plans').scrollIntoView({ behavior: 'smooth' });
}
$('#sort').onchange = e => { state.sort = e.target.value; renderPlans(); };
api.getProducts().then(p => { state.products = p; renderPlans(); })
  .catch(() => $('#planGrid').innerHTML = '<p class="msg">讀不到 products.json。請透過 http:// 開啟（GitHub Pages 或 python3 -m http.server），直接雙擊檔案開啟會被瀏覽器擋下。</p>');
renderChips();

/* 收藏 */
function toggleWish(id) {
  const i = state.wish.indexOf(id);
  i < 0 ? state.wish.push(id) : state.wish.splice(i, 1);
  store.set('wish', state.wish); renderPlans();
  toast(i < 0 ? '已加入收藏' : '已取消收藏');
}

/* 快覽 */
function openQuick(id) {
  const p = state.products.find(x => x.id === id); if (!p) return;
  closeAll();
  $('#qvBody').innerHTML = `<div class="qv"><div class="thumb" style="background:${bgOf(p.bg)}">${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}${art(p.art, p.color)}</div>
    <div><h2 style="font-size:26px">${esc(p.name)}</h2><p>${esc(p.note)}</p><p>${esc(p.desc || '')}</p>
    <div class="price">${money(p.price)}<s>${money(p.orig)}</s></div>
    <strong>尺寸</strong>${sizesHtml(p, 'mz')}
    <div class="row" style="border:0;padding:6px 0 14px"><strong>數量</strong><div class="qty"><button data-q="-1" aria-label="減少">−</button><span id="qvQty">1</span><button data-q="1" aria-label="增加">＋</button></div></div>
    <button class="btn" data-addq="${esc(p.id)}" style="width:100%">加入購物車</button></div></div>`;
  openLayer('quickLayer');
}

/* 購物車 */
const saveCart = () => store.set('cart', state.cart);
const subtotal = () => state.cart.reduce((s, i) => s + i.price * i.qty, 0);
const shipFee = () => (!state.cart.length || subtotal() >= CONFIG.freeShip) ? 0 : CONFIG.shipFee;
const sumHtml = () => `<div class="sum"><span>小計</span><span>${money(subtotal())}</span></div><div class="sum"><span>運費</span><span>${shipFee() ? money(shipFee()) : '免運'}</span></div><div class="sum tot"><span>合計</span><span>${money(subtotal() + shipFee())}</span></div>`;
function renderCart() {
  const n = state.cart.reduce((s, i) => s + i.qty, 0), sub = subtotal(), empty = !n, left = Math.max(0, CONFIG.freeShip - sub);
  $('#cartCount').textContent = n; $('#btnCheckout').disabled = empty;
  $('#freeBar').innerHTML = empty ? '' : `<div class="free">${left ? '再買 ' + money(left) + ' 即可免運（範例）' : '已達免運門檻（範例）'}<i><b style="width:${Math.min(100, sub / CONFIG.freeShip * 100)}%"></b></i></div>`;
  $('#cartBody').innerHTML = empty ? '<p style="margin-top:16px">購物車是空的，先挑一件喜歡的吧。</p>' : state.cart.map(i => `
    <div class="row"><span style="flex:1">${esc(i.name)}<br><small>${esc(i.size)}・${money(i.price)}</small></span>
    <div class="qty"><button data-qty="${esc(i.key)}|-1" aria-label="減少">−</button><span>${i.qty}</span><button data-qty="${esc(i.key)}|1" aria-label="增加">＋</button></div>
    <button class="link" data-rm="${esc(i.key)}">刪除</button></div>`).join('');
  $('#cartSum').innerHTML = empty ? '' : sumHtml();
}
function addToCart(id, scope, qty = 1) {
  const p = state.products.find(x => x.id === id); if (!p) return;
  const size = ((scope || document).querySelector('input[type=radio]:checked') || {}).value || p.sizes[0];
  const key = id + '|' + size, hit = state.cart.find(x => x.key === key);
  hit ? hit.qty = Math.min(9, hit.qty + qty) : state.cart.push({ key, id, name: p.name, size, price: p.price, qty });
  saveCart(); renderCart(); closeAll(); openLayer('cartLayer'); toast('已加入購物車');
}
$('#btnCart').onclick = () => openLayer('cartLayer');
$('#btnCheckout').onclick = () => { closeAll(); $('#coSum').innerHTML = sumHtml(); $('#coMsg').textContent = ''; openLayer('coLayer'); };
$('#coForm').onsubmit = async e => {
  e.preventDefault();
  const order = { customer: Object.fromEntries(new FormData(e.target)), items: state.cart, total: subtotal() + shipFee() };
  console.log('order', order);
  $('#coMsg').textContent = (await api.checkout(order)).message || '已送出';
};

/* 搜尋 */
function renderSearch(q) {
  q = q.trim().toLowerCase();
  const l = q ? state.products.filter(p => (p.name + p.note).toLowerCase().includes(q)) : state.products.slice(0, 4);
  $('#sList').innerHTML = l.length ? l.slice(0, 6).map(p => `<div class="sr" data-view="${esc(p.id)}"><div class="mini" style="background:${bgOf(p.bg)}">${art(p.art, p.color)}</div><div><strong>${esc(p.name)}</strong><br><small>${money(p.price)}</small></div></div>`).join('') : '<p>找不到符合的商品。</p>';
}
$('#btnSearch').onclick = () => { openLayer('searchLayer'); renderSearch($('#sInput').value); setTimeout(() => $('#sInput').focus(), 50); };
$('#sInput').oninput = e => renderSearch(e.target.value);
$('#sForm').onsubmit = e => {
  e.preventDefault(); state.q = $('#sInput').value.trim().toLowerCase(); state.cat = 'all';
  closeAll(); renderChips(); renderPlans(); $('#plans').scrollIntoView({ behavior: 'smooth' });
};

/* 登入／註冊 */
const setAuth = () => { $('#btnAuth').classList.toggle('on', !!state.user); $('#btnAuth').setAttribute('aria-label', state.user ? '登出' : '會員登入'); };
function setTab(m) {
  state.mode = m;
  document.querySelectorAll('#authLayer [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === m));
  $('#authSubmit').textContent = m === 'login' ? '登入' : '註冊'; $('#authMsg').textContent = '';
}
$('#btnAuth').onclick = () => {
  if (state.user) { state.user = null; setAuth(); toast('已登出'); return; }
  setTab('login'); openLayer('authLayer');
};
$('#authSubmit').onclick = async () => {
  try { state.user = await api[state.mode]($('#authEmail').value.trim(), $('#authPass').value); setAuth(); closeAll(); toast(state.mode === 'login' ? '已登入' : '註冊成功'); }
  catch (err) { $('#authMsg').textContent = err.message; }
};

/* 電子報、公告、倒數 */
$('#nlForm').onsubmit = async e => { e.preventDefault(); await api.subscribe($('#nlEmail').value.trim()); e.target.reset(); toast('已訂閱（示範流程，尚未串接後端）'); };
$('#annClose').onclick = () => $('#announce').remove();
const end = (() => { const d = new Date(); d.setDate(d.getDate() + ((7 - d.getDay()) % 7)); d.setHours(23, 59, 59, 0); if (d < new Date()) d.setDate(d.getDate() + 7); return d; })();
const p2 = n => String(n).padStart(2, '0');
const tick = () => {
  let s = Math.max(0, Math.floor((end - new Date()) / 1000)); const dd = Math.floor(s / 86400); s %= 86400;
  $('#cd').textContent = `${dd} 天 ${p2(Math.floor(s / 3600))}:${p2(Math.floor(s % 3600 / 60))}:${p2(s % 60)}`;
};
tick(); setInterval(tick, 1000);

/* 全域點擊 */
document.addEventListener('click', e => {
  if (e.target.classList.contains('layer')) return closeAll();
  const t = e.target.closest('[data-add],[data-addq],[data-rm],[data-qty],[data-view],[data-wish],[data-cat],[data-close],[data-q],[data-tab],[data-clearq]');
  if (!t) return;
  const d = t.dataset;
  if ('close' in d) closeAll();
  else if (d.wish) toggleWish(d.wish);
  else if (d.add) addToCart(d.add, t.closest('.prod'));
  else if (d.addq) addToCart(d.addq, $('#qvBody'), +$('#qvQty').textContent);
  else if (d.q) { const el = $('#qvQty'); el.textContent = Math.min(9, Math.max(1, +el.textContent + +d.q)); }
  else if (d.qty) {
    const i = d.qty.lastIndexOf('|'), k = d.qty.slice(0, i), dl = +d.qty.slice(i + 1), it = state.cart.find(x => x.key === k);
    if (it) { it.qty = Math.min(9, it.qty + dl); if (it.qty < 1) state.cart = state.cart.filter(x => x !== it); saveCart(); renderCart(); }
  }
  else if (d.rm) { state.cart = state.cart.filter(i => i.key !== d.rm); saveCart(); renderCart(); }
  else if (d.view) openQuick(d.view);
  else if (d.cat) setCat(d.cat, 'go' in d);
  else if (d.tab) setTab(d.tab);
  else if ('clearq' in d) { state.q = ''; renderPlans(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });

/* 浮動按鈕、回到頂端、捲動顯示動畫 */
$('.fab').onclick = e => e.preventDefault();
const toTop = $('#toTop');
addEventListener('scroll', () => toTop.classList.toggle('show', scrollY > 500), { passive: true });
toTop.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
const rv = [...document.querySelectorAll('main section:not(.hero) .wrap > *')];
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .1 });
  rv.forEach(el => { el.classList.add('rv'); io.observe(el); });
}
renderCart();
