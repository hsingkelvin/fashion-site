/* ===== CLOUDSHELL 單品募資頁（前端骨架） =====
   純 HTML / CSS / JavaScript，無框架、無外部圖片。
   之後接後端：搜尋 TODO，替換 api 物件內的實作即可。 */
(function () {
  'use strict';

  var CONFIG = { currency: 'NT$', dataBase: '' };

  /* ---------- 資料層（TODO: 改成呼叫你的後端 API） ---------- */
  function getJSON(file) {
    return fetch(CONFIG.dataBase + file).then(function (r) { return r.json(); });
  }
  var api = {
    getCampaign: function () { return getJSON('campaign.json'); },   // TODO: GET /campaign
    getPlans:    function () { return getJSON('plans.json'); },      // TODO: GET /plans
    getFaq:      function () { return getJSON('faq.json'); },        // TODO: GET /faq
    getReviews:  function () { return getJSON('reviews.json'); },    // TODO: GET /reviews
    login:    function (d) { return Promise.resolve({ ok: true, name: d.email.split('@')[0] }); }, // TODO: POST /auth/login
    register: function (d) { return Promise.resolve({ ok: true, name: d.name || d.email.split('@')[0] }); }, // TODO: POST /auth/register
    checkout: function (order) { console.log('order', order); return Promise.resolve({ ok: true, id: 'DEMO' + Date.now().toString().slice(-6) }); } // TODO: POST /orders
  };

  /* ---------- 小工具 ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return CONFIG.currency + ' ' + Number(n).toLocaleString('en-US'); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var state = { camp: null, plans: [], cart: store.get('cs_cart', []), user: store.get('cs_user', null), buy: null, mode: 'login' };

  var toastTimer;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  function openLayer(id) { closeAll(); var l = $('#' + id); l.classList.add('open'); l.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
  function closeAll() { $$('.layer.open').forEach(function (l) { l.classList.remove('open'); l.setAttribute('aria-hidden', 'true'); }); document.body.style.overflow = ''; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- 募資進度 ---------- */
  function renderFund() {
    var c = state.camp, pct = Math.round(c.raised / c.goal * 100);
    $('#heroRaised').textContent = c.raised.toLocaleString('en-US');
    $('#fRaised').textContent = money(c.raised);
    $('#fPct').textContent = pct + '%';
    $('#fBackers').textContent = c.backers.toLocaleString('en-US');
    $('#fGoal').textContent = money(c.goal);
    $('#mPct').textContent = pct + '%';
    setTimeout(function () {
      var w = Math.min(100, pct) + '%';
      $('#fBar').style.width = w; $('#mBar').style.width = w;
    }, 300);
  }
  function tick() {
    var left = new Date(state.camp.end).getTime() - Date.now();
    if (left < 0) left = 0;
    var d = Math.floor(left / 864e5), h = Math.floor(left % 864e5 / 36e5), m = Math.floor(left % 36e5 / 6e4), s = Math.floor(left % 6e4 / 1e3);
    var p = function (n) { return String(n).padStart(2, '0'); };
    $('#fDays').textContent = d;
    $('#cdD').textContent = p(d); $('#cdH').textContent = p(h); $('#cdM').textContent = p(m); $('#cdS').textContent = p(s);
  }

  /* ---------- 圖表（範例：每月雨天日數） ---------- */
  function renderChart() {
    var data = [11, 12, 14, 16, 17, 15, 11, 13, 11, 9, 9, 10];
    var W = 520, H = 280, L = 36, R = 12, T = 16, B = 30, max = 20;
    var x = function (i) { return L + i * (W - L - R) / (data.length - 1); };
    var y = function (v) { return T + (1 - v / max) * (H - T - B); };
    var g = '', i;
    for (i = 0; i <= 4; i++) {
      var v = i * 5;
      g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v + '</text>';
    }
    var pts = data.map(function (v, k) { return x(k) + ',' + y(v); }).join(' ');
    var area = 'M' + x(0) + ',' + y(0) + ' L' + pts.replace(/ /g, ' L') + ' L' + x(data.length - 1) + ',' + y(0) + 'Z';
    var dots = '', labs = '';
    data.forEach(function (v, k) {
      if (k % 3 === 0 || k === 4) dots += '<circle cx="' + x(k) + '" cy="' + y(v) + '" r="4"/>';
      labs += '<text x="' + x(k) + '" y="' + (H - 8) + '" text-anchor="middle">' + (k + 1) + '月</text>';
    });
    $('#chart').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="每月雨天日數折線圖（範例）">' +
      '<defs><linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f7db3" stop-opacity=".28"/><stop offset="1" stop-color="#2f7db3" stop-opacity="0"/></linearGradient></defs>' +
      '<g class="grid">' + g + '</g><path class="area" d="' + area + '"/><polyline class="ln" points="' + pts + '"/>' + dots + labs + '</svg>';
  }

  /* ---------- 使用情境 ---------- */
  function renderUses() {
    var u = [
      ['通勤上班', '騎車、搭捷運都舒適', '#2f7db3'], ['週末旅行', '摺起來不佔行李空間', '#c08a4a'],
      ['輕量登山', '風大、起霧都能擋', '#6f7f5f'], ['騎車運動', '透氣不悶，不黏身', '#4d6a86'],
      ['露營野餐', '傍晚溫差也安心', '#a0644a'], ['校園日常', '版型簡潔，百搭', '#5a7d8e']
    ];
    $('#uses').innerHTML = u.map(function (a) {
      return '<div class="use rv" style="background:linear-gradient(135deg,' + a[2] + ',' + a[2] + 'cc)"><svg class="ic"><use href="#i-wind"/></svg><b>' + a[0] + '</b><span>' + a[1] + '</span></div>';
    }).join('');
  }

  /* ---------- 方案 ---------- */
  function renderPlans() {
    var colorHex = '#2f7db3';
    $('#planGrid').innerHTML = state.plans.map(function (p) {
      var jk = '', i;
      for (i = 0; i < p.pieces; i++) jk += (i ? '<span class="plus">+</span>' : '') + '<svg style="color:' + colorHex + '"><use href="#jacket"/></svg>';
      var left = Math.round(p.stock / p.stockMax * 100);
      return '<article class="plan rv' + (p.badge ? ' hot' : '') + '">' +
        (p.badge ? '<span class="tag">' + esc(p.badge) + '</span>' : '') +
        '<span class="kicker">' + esc(p.tag) + '</span><h3>' + esc(p.name) + '</h3><p class="sub2">' + esc(p.sub) + '</p>' +
        '<div class="pieces">' + jk + '</div>' +
        '<div class="price">' + money(p.price) + '<small>' + money(p.orig) + '</small></div>' +
        '<p class="avg">平均每件 ' + money(Math.round(p.price / p.pieces)) + '（' + (p.price / p.orig * 10).toFixed(1) + ' 折）</p>' +
        '<ul>' + p.points.map(function (t) { return '<li><svg class="ic"><use href="#i-check"/></svg>' + esc(t) + '</li>'; }).join('') + '</ul>' +
        '<p class="stock">限量剩餘 ' + p.stock + ' 組</p><div class="bar"><i style="width:' + left + '%"></i></div>' +
        '<button class="btn block" data-buy="' + p.id + '">立即贊助</button></article>';
    }).join('');
    observe();
  }

  /* ---------- 選規格 ---------- */
  function openOptions(id) {
    var p = state.plans.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    var picks = [], i; for (i = 0; i < p.pieces; i++) picks.push({ color: state.camp.colors[0].id, size: 'M' });
    state.buy = { plan: p, picks: picks };
    $('#optTitle').textContent = p.name;
    $('#optSub').textContent = '請為每一件外套選擇顏色與尺寸';
    $('#optPrice').textContent = money(p.price);
    drawOptions(); openLayer('optLayer');
  }
  function drawOptions() {
    var b = state.buy, c = state.camp;
    $('#optBody').innerHTML = b.picks.map(function (pk, i) {
      var cname = c.colors.filter(function (x) { return x.id === pk.color; })[0].name;
      return '<div class="opt-row"><b>第 ' + (i + 1) + ' 件・' + cname + ' / ' + pk.size + '</b>' +
        '<div class="sw">' + c.colors.map(function (k) { return '<button class="' + (k.id === pk.color ? 'on' : '') + '" style="background:' + k.hex + '" data-oc="' + i + ':' + k.id + '" aria-label="' + k.name + '"></button>'; }).join('') + '</div>' +
        '<div class="szs">' + c.sizes.map(function (s) { return '<button class="' + (s === pk.size ? 'on' : '') + '" data-os="' + i + ':' + s + '">' + s + '</button>'; }).join('') + '</div></div>';
    }).join('');
  }

  /* ---------- 購物車 ---------- */
  function saveCart() { store.set('cs_cart', state.cart); updateCart(); }
  function totals() {
    var sub = 0; state.cart.forEach(function (it) { sub += it.price * it.qty; });
    var ship = sub === 0 || sub >= state.camp.freeShip ? 0 : state.camp.shipFee;
    return { sub: sub, ship: ship, total: sub + ship };
  }
  function sumHtml() {
    var t = totals();
    return '<div class="sumrow"><span>小計</span><span>' + money(t.sub) + '</span></div><div class="sumrow"><span>運費</span><span>' + (t.ship ? money(t.ship) : '免運') + '</span></div><div class="sumrow t"><span>合計</span><span>' + money(t.total) + '</span></div>';
  }
  function updateCart() {
    var n = 0; state.cart.forEach(function (it) { n += it.qty; });
    $('#cartCount').textContent = n;
    if (!state.camp) return;
    var t = totals(), fs = state.camp.freeShip, rest = fs - t.sub;
    $('#freeBar').innerHTML = t.sub === 0 ? '滿 ' + money(fs) + ' 免運' : (rest > 0 ? '再買 ' + money(rest) + ' 即可免運' : '已達免運門檻') +
      '<div class="bar"><i style="width:' + Math.min(100, t.sub / fs * 100) + '%"></i></div>';
    $('#cartBody').innerHTML = state.cart.length ? state.cart.map(function (it, i) {
      var det = it.picks.map(function (pk) {
        var cn = state.camp.colors.filter(function (x) { return x.id === pk.color; })[0];
        return (cn ? cn.name : pk.color) + '/' + pk.size;
      }).join('、');
      return '<div class="ci"><div class="mini"><svg><use href="#jacket"/></svg></div><div><b>' + esc(it.name) + '</b><small>' + esc(det) + '</small>' +
        '<div class="qty"><button data-qty="' + i + ':-1" aria-label="減少">－</button><span>' + it.qty + '</span><button data-qty="' + i + ':1" aria-label="增加">＋</button></div></div>' +
        '<div style="text-align:right"><b>' + money(it.price * it.qty) + '</b><br><button class="rm" data-rm="' + i + '">移除</button></div></div>';
    }).join('') : '<p class="empty">購物車是空的</p>';
    $('#cartSum').innerHTML = state.cart.length ? sumHtml() : '';
    $('#btnCheckout').disabled = !state.cart.length;
    $('#btnCheckout').style.opacity = state.cart.length ? 1 : .5;
  }
  function addToCart() {
    var b = state.buy, p = b.plan;
    state.cart.push({ id: p.id, name: p.name, price: p.price, qty: 1, picks: b.picks.map(function (x) { return { color: x.color, size: x.size }; }) });
    saveCart(); closeAll(); toast('已加入購物車'); openLayer('cartLayer');
  }

  /* ---------- 結帳 ---------- */
  function openCheckout() {
    if (!state.cart.length) return;
    $('#coSum').innerHTML = sumHtml(); $('#coMsg').textContent = ''; $('#coMsg').className = 'msg';
    openLayer('coLayer');
  }
  function submitCheckout(e) {
    e.preventDefault();
    var f = e.target, msg = $('#coMsg'), d = {}, ok = true;
    ['name', 'phone', 'email', 'addr'].forEach(function (k) { d[k] = f[k].value.trim(); if (!d[k]) ok = false; });
    if (!ok) { msg.className = 'msg'; msg.textContent = '請完整填寫收件資訊'; return; }
    if (!/^\S+@\S+\.\S+$/.test(d.email)) { msg.className = 'msg'; msg.textContent = 'Email 格式不正確'; return; }
    if (!/^[0-9+\-\s]{8,}$/.test(d.phone)) { msg.className = 'msg'; msg.textContent = '手機號碼格式不正確'; return; }
    d.pay = f.pay.value;
    api.checkout({ buyer: d, items: state.cart, totals: totals() }).then(function (r) {
      msg.className = 'msg ok'; msg.textContent = '訂單已建立（範例）：' + r.id;
      state.cart = []; saveCart(); f.reset();
      setTimeout(function () { closeAll(); toast('感謝贊助！這是範例訂單'); }, 1400);
    });
  }

  /* ---------- 登入 / 註冊 ---------- */
  function setMode(m) {
    state.mode = m;
    $$('.tabs button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === m); });
    $('#authForm').className = m; $('#authBtn').textContent = m === 'login' ? '登入' : '建立帳號'; $('#authMsg').textContent = '';
  }
  function submitAuth(e) {
    e.preventDefault();
    var f = e.target, msg = $('#authMsg'), d = { name: f.name.value.trim(), email: f.email.value.trim(), pw: f.pw.value };
    msg.className = 'msg';
    if (!/^\S+@\S+\.\S+$/.test(d.email)) { msg.textContent = 'Email 格式不正確'; return; }
    if (d.pw.length < 6) { msg.textContent = '密碼至少 6 碼'; return; }
    if (state.mode === 'register' && !d.name) { msg.textContent = '請輸入姓名'; return; }
    api[state.mode](d).then(function (r) {
      state.user = { name: r.name }; store.set('cs_user', state.user);
      closeAll(); toast('嗨，' + r.name + '（範例登入）'); f.reset();
    });
  }

  /* ---------- 前後對比拉桿 ---------- */
  function initBA() {
    var rng = $('#baRange'), top = $('#baTop'), h = $('#baHandle');
    var set = function (v) { top.style.clipPath = 'inset(0 0 0 ' + v + '%)'; h.style.left = v + '%'; };
    rng.addEventListener('input', function () { set(rng.value); });
    set(50);
  }

  /* ---------- 數字跳動、長條圖 ---------- */
  function countUp(el) {
    var end = +el.getAttribute('data-count'), t0 = null, dur = 1600;
    function step(ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(end * e).toLocaleString('en-US');
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function observe() {
    var targets = $$('.rv:not(.in),.chart,[data-count],.hb i');
    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { reveal(el); }); return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { reveal(en.target); io.unobserve(en.target); } });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }
  function reveal(el) {
    el.classList.add('in');
    if (el.hasAttribute('data-count')) countUp(el);
    if (el.hasAttribute('data-w')) el.style.width = el.getAttribute('data-w') + '%';
  }

  /* ---------- 其他區塊渲染 ---------- */
  function renderFaq(list) {
    $('#faqList').innerHTML = list.map(function (f) { return '<details><summary>' + esc(f.q) + '</summary><div class="a">' + esc(f.a) + '</div></details>'; }).join('');
  }
  function renderReviews(list) {
    $('#rail').innerHTML = list.map(function (r) {
      return '<article class="rv-card"><div class="stars">★★★★★</div><p>' + esc(r.text) + '</p><div class="who"><i>' + esc(r.name.charAt(0)) + '</i><div><b>' + esc(r.name) + '</b><small>' + esc(r.role) + '</small></div></div></article>';
    }).join('');
  }

  /* ---------- 事件 ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open],[data-close],[data-buy],[data-oc],[data-os],[data-qty],[data-rm],[data-tab],[data-toast]');
    if (!t) return;
    if (t.hasAttribute('data-toast')) { e.preventDefault(); toast(t.getAttribute('data-toast')); return; }
    if (t.hasAttribute('data-open')) { var id = t.getAttribute('data-open'); openLayer(id === 'cart' ? 'cartLayer' : 'authLayer'); if (id === 'auth') setMode(state.mode); return; }
    if (t.hasAttribute('data-close')) { closeAll(); return; }
    if (t.hasAttribute('data-buy')) { openOptions(t.getAttribute('data-buy')); return; }
    if (t.hasAttribute('data-oc')) { var a = t.getAttribute('data-oc').split(':'); state.buy.picks[+a[0]].color = a[1]; drawOptions(); return; }
    if (t.hasAttribute('data-os')) { var s = t.getAttribute('data-os').split(':'); state.buy.picks[+s[0]].size = s[1]; drawOptions(); return; }
    if (t.hasAttribute('data-qty')) { var q = t.getAttribute('data-qty').split(':'), it = state.cart[+q[0]]; it.qty = Math.max(1, Math.min(9, it.qty + +q[1])); saveCart(); return; }
    if (t.hasAttribute('data-rm')) { state.cart.splice(+t.getAttribute('data-rm'), 1); saveCart(); return; }
    if (t.hasAttribute('data-tab')) { setMode(t.getAttribute('data-tab')); return; }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });

  /* ---------- 啟動 ---------- */
  function init() {
    $('#optAdd').addEventListener('click', addToCart);
    $('#btnCheckout').addEventListener('click', openCheckout);
    $('#coForm').addEventListener('submit', submitCheckout);
    $('#authForm').addEventListener('submit', submitAuth);
    $('#burger').addEventListener('click', function () { $('#menu').classList.toggle('open'); });
    $('#menu').addEventListener('click', function (e) { if (e.target.tagName === 'A') $('#menu').classList.remove('open'); });
    $('#toTop').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    $('#rPrev').addEventListener('click', function () { $('#rail').scrollBy({ left: -360, behavior: 'smooth' }); });
    $('#rNext').addEventListener('click', function () { $('#rail').scrollBy({ left: 360, behavior: 'smooth' }); });

    var links = $$('.menu a'), secs = links.map(function (a) { return $(a.getAttribute('href')); });
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      $('#toTop').classList.toggle('show', y > 600);
      var plans = $('#plans').getBoundingClientRect();
      $('#mbar').classList.toggle('show', y > 500 && !(plans.top < innerHeight * .6 && plans.bottom > 0));
      var cur = -1; secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < 120) cur = i; });
      links.forEach(function (a, i) { a.classList.toggle('on', i === cur); });
    }, { passive: true });

    initBA(); renderChart(); renderUses(); setMode('login');

    Promise.all([api.getCampaign(), api.getPlans(), api.getFaq(), api.getReviews()]).then(function (r) {
      state.camp = r[0]; state.plans = r[1];
      renderFund(); tick(); setInterval(tick, 1000);
      renderPlans(); renderFaq(r[2]); renderReviews(r[3]); updateCart(); observe();
    }).catch(function (err) { console.error(err); toast('資料載入失敗，請稍後重試'); });
  }
  init();
})();
