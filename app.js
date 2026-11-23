/* 資料層：目前讀 data/*.json；之後把 get() 改成後端 API 路徑即可 */
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

/* Hero 色票 */
const SWATCH = ['#e8e4dc', '#3d5a8a', '#b8c7d9', '#2c3a2e', '#c9a58f', '#d9d9d9'];
$('#tiles').innerHTML = Array.from({ length: 36 }, (_, i) => `<i style="background:${SWATCH[(i * 5 + (i >> 2)) % 6]}"></i>`).join('');

/* 導覽 */
api.getNav().then(nav => {
  $('#menu').innerHTML = nav.map(i => i.children
    ? `<li><button type="button">${esc(i.label)} ▾</button><ul class="sub">${i.children.map(c => `<li><a href="${esc(c.href)}">${esc(c.label)}</a></li>`).join('')}</ul></li>`
    : `<li><a href="${esc(i.href)}">${esc(i.label)}</a></li>`).join('');
}).catch(() => {});
$('#burger').onclick = () => $('#menu').classList.toggle('open');
$('#menu').addEventListener('click', e => { if (e.target.tagName === 'A') $('#menu').classList.remove('open'); });

/* FAQ／評價 */
api.getFaq().then(l => $('#faqList').innerHTML = l.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')).catch(() => {});
api.getReviews().then(l => $('#reviewRail').innerHTML = l.map(r => `<div class="card"><strong>${esc(r.name)}</strong><p>${esc(r.text)}</p></div>`).join('')).catch(() => {});

/* 商品 */
function renderPlans() {
  $('#planGrid').innerHTML = state.products.map(p => `
    <div class="card" data-pid="${esc(p.id)}">
      ${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}
      <div class="thumb" style="background:${esc(p.color)}" aria-hidden="true">${p.emoji}</div>
      <h3>${esc(p.name)}</h3><p>${esc(p.note)}</p>
      <div class="sizes" role="radiogroup" aria-label="尺寸">${p.sizes.map((s, i) => `<label><input type="radio" name="sz-${esc(p.id)}" value="${esc(s)}" ${i ? '' : 'checked'}><span>${esc(s)}</span></label>`).join('')}</div>
      <div class="price">${money(p.price)}<s>${money(p.orig)}</s></div>
      <button class="btn" data-add="${esc(p.id)}" style="margin-top:12px">加入購物車</button>
    </div>`).join('');
}
api.getProducts().then(p => { state.products = p; renderPlans(); })
  .catch(() => $('#planGrid').innerHTML = '<p class="msg">讀不到 data/products.json。請透過 http:// 開啟（GitHub Pages 或 python3 -m http.server），直接雙擊檔案開啟會被瀏覽器擋下。</p>');

/* 購物車（key = 商品＋尺寸） */
function renderCart() {
  $('#cartCount').textContent = state.cart.reduce((s, i) => s + i.qty, 0);
  const empty = !state.cart.length;
  $('#btnCheckout').disabled = empty;
  $('#cartBody').innerHTML = empty ? '<p>購物車是空的，先挑一件喜歡的吧。</p>' : state.cart.map(i => `
    <div class="row"><span>${esc(i.name)}（${esc(i.size)}）× ${i.qty}</span>
    <span>${money(i.price * i.qty)} <button class="icon" data-rm="${esc(i.key)}">刪除</button></span></div>`).join('');
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
$('#btnAuth').onclick = () => {
  if (state.user) { state.user = null; $('#btnAuth').textContent = '登入'; return; }
  $('#authMsg').textContent = ''; $('#authLayer').classList.add('open');
};
$('#authSubmit').onclick = async () => {
  try { state.user = await api.login($('#authEmail').value.trim(), $('#authPass').value); $('#btnAuth').textContent = '登出'; closeAll(); }
  catch (err) { $('#authMsg').textContent = err.message; }
};
renderCart();
