/* 資料層：讀取同資料夾的 *.json；之後把 get() 改成後端 API 路徑即可 */
const CONFIG = { currency: 'NT$', dataBase: '' };
const get = n => fetch(CONFIG.dataBase + n + '.json').then(r => { if (!r.ok) throw new Error(n); return r.json(); });
const api = {
  getProducts: () => get('products'), getNav: () => get('nav'),
  getFaq: () => get('faq'), getReviews: () => get('reviews'),
  login: async (email, pw) => { if (!email || !pw) throw new Error('請輸入電子郵件與密碼。'); return { email }; }, // TODO POST /auth/login
  checkout: async items => ({ ok: false, message: '結帳尚未串接後端。' })                                       // TODO POST /orders
};
const state = { products: [], cart: [], user: null };
const $ = (s, r = document) => r.querySelector(s);
const money = n => CONFIG.currency + ' ' + n.toLocaleString('en-US');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const closeAll = () => document.querySelectorAll('.layer').forEach(l => l.classList.remove('open'));

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

/* Hero 相片格 */
const HERO = [['tee', '#3b82a6', '#dcecf4'], ['jeans', '#3d5a8a', '#f1e7d8'], ['dress', '#c98b7a', '#e6f0ea'], ['jacket', '#2f4a3a', '#e9eef5'], ['shirt', '#a9c2d9', '#f6efe2'], ['socks', '#d9a066', '#e4ecf3']];
$('#tiles').innerHTML = HERO.map(([t, c, b]) => `<div class="tile" style="background:${bgOf(b)}">${art(t, c)}</div>`).join('');

/* 導覽 */
api.getNav().then(nav => {
  $('#menu').innerHTML = nav.map(i => i.children
    ? `<li><button type="button">${esc(i.label)} ▾</button><ul class="sub">${i.children.map(c => `<li><a href="${esc(c.href)}">${esc(c.label)}</a></li>`).join('')}</ul></li>`
    : `<li><a href="${esc(i.href)}">${esc(i.label)}</a></li>`).join('');
}).catch(() => {});
$('#burger').onclick = () => $('#menu').classList.toggle('open');
$('#menu').addEventListener('click', e => { if (e.target.tagName === 'A') $('#menu').classList.remove('open'); });

/* FAQ／評價 */
const AV = ['#2086b5', '#c98b7a', '#5b8f6b', '#8a6fb0'];
api.getFaq().then(l => $('#faqList').innerHTML = l.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')).catch(() => {});
api.getReviews().then(l => $('#reviewRail').innerHTML = l.map((r, i) => `<div class="card"><div class="avatar" style="background:${AV[i % 4]}">${esc(r.name.slice(0, 1))}</div><div class="stars" aria-label="5 顆星">★★★★★</div><strong>${esc(r.name)}</strong><p>${esc(r.text)}</p></div>`).join('')).catch(() => {});

/* 商品 */
function renderPlans() {
  $('#planGrid').innerHTML = state.products.map(p => `
    <div class="card prod" data-pid="${esc(p.id)}">
      <div class="thumb" style="background:${bgOf(p.bg)}">${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}${art(p.art, p.color)}</div>
      <h3>${esc(p.name)}</h3><p style="margin-bottom:4px">${esc(p.note)}</p>
      <div class="sizes" role="radiogroup" aria-label="尺寸">${p.sizes.map((s, i) => `<label><input type="radio" name="sz-${esc(p.id)}" value="${esc(s)}" ${i ? '' : 'checked'}><span>${esc(s)}</span></label>`).join('')}</div>
      <div class="price">${money(p.price)}<s>${money(p.orig)}</s></div>
      <button class="btn" data-add="${esc(p.id)}">加入購物車</button>
    </div>`).join('');
}
api.getProducts().then(p => { state.products = p; renderPlans(); })
  .catch(() => $('#planGrid').innerHTML = '<p class="msg">讀不到 products.json。請透過 http:// 開啟（GitHub Pages 或 python3 -m http.server），直接雙擊檔案開啟會被瀏覽器擋下。</p>');

/* 購物車（key = 商品＋尺寸） */
function renderCart() {
  $('#cartCount').textContent = state.cart.reduce((s, i) => s + i.qty, 0);
  const empty = !state.cart.length;
  $('#btnCheckout').disabled = empty;
  $('#cartBody').innerHTML = empty ? '<p>購物車是空的，先挑一件喜歡的吧。</p>' : state.cart.map(i => `
    <div class="row"><span>${esc(i.name)}（${esc(i.size)}）× ${i.qty}</span>
    <span>${money(i.price * i.qty)} <button class="link" data-rm="${esc(i.key)}">刪除</button></span></div>`).join('');
  $('#cartTotal').textContent = empty ? '' : '合計 ' + money(state.cart.reduce((s, i) => s + i.price * i.qty, 0));
}
function addToCart(id) {
  const p = state.products.find(x => x.id === id); if (!p) return;
  const size = (document.querySelector(`input[name="sz-${id}"]:checked`) || {}).value || p.sizes[0];
  const key = id + '|' + size, hit = state.cart.find(x => x.key === key);
  hit ? hit.qty++ : state.cart.push({ key, id, name: p.name, size, price: p.price, qty: 1 });
  renderCart(); $('#cartLayer').classList.add('open');
}
document.addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.add) addToCart(t.dataset.add);
  if (t.dataset.rm) { state.cart = state.cart.filter(i => i.key !== t.dataset.rm); renderCart(); }
  if ('close' in t.dataset || t.classList.contains('layer')) closeAll();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
$('#btnCart').onclick = () => $('#cartLayer').classList.add('open');
$('#btnCheckout').onclick = async () => alert((await api.checkout(state.cart)).message || '已送出');

/* 登入 */
const setAuth = () => { $('#btnAuth').classList.toggle('on', !!state.user); $('#btnAuth').setAttribute('aria-label', state.user ? '登出' : '會員登入'); };
$('#btnAuth').onclick = () => {
  if (state.user) { state.user = null; setAuth(); return; }
  $('#authMsg').textContent = ''; $('#authLayer').classList.add('open');
};
$('#authSubmit').onclick = async () => {
  try { state.user = await api.login($('#authEmail').value.trim(), $('#authPass').value); setAuth(); closeAll(); }
  catch (err) { $('#authMsg').textContent = err.message; }
};

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
