const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = matchMedia('(hover:hover)').matches;

/* ---------- page wipe transition between pages ---------- */
const wipe = $('.wipe');
if (wipe && !reduce) {
  $$('a[href]').forEach(a => {
    const h = a.getAttribute('href');
    if (!h || h[0] === '#' || /^(mailto|tel|https?:)/.test(h) || a.target === '_blank') return;
    a.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      wipe.classList.add('leave'); void wipe.offsetWidth; wipe.classList.add('go');
      setTimeout(() => { location.href = a.href }, 480);
    });
  });
  addEventListener('pageshow', e => { if (e.persisted) wipe.classList.remove('leave', 'go') });
}

/* ---------- split headlines into masked words ---------- */
let wc = 0;
function splitNode(node) {
  [...node.childNodes].forEach(ch => {
    if (ch.nodeType === 3) {
      const frag = document.createDocumentFragment();
      ch.textContent.split(/(\s+)/).forEach(tok => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return }
        const w = document.createElement('span'); w.className = 'w';
        const i = document.createElement('span'); i.className = 'wi'; i.textContent = tok; i.style.setProperty('--td', (wc++ * .07) + 's');
        w.appendChild(i); frag.appendChild(w)
      });
      ch.replaceWith(frag)
    } else if (ch.nodeType === 1 && ch.tagName !== 'BR') splitNode(ch)
  })
}
$$('[data-split]').forEach(el => {
  wc = 0;
  splitNode(el)
});

/* ---------- scroll: header state, progress, parallax ---------- */
const bar = $('.progress'), pars = $$('[data-par]');
let ticking = false;
function onScroll() {
  const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
  document.body.classList.toggle('scrolled', y > 20);
  if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  if (!reduce) pars.forEach(i => { i.style.transform = `translateY(${Math.min(y, 900) * .09}px)` });
  ticking = false
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll) } }, { passive: true });
onScroll();

/* ---------- mobile nav ---------- */
$('#burger')?.addEventListener('click', () => $('#nav').classList.toggle('open'));

/* ---------- demo session (works with login.js) ---------- */
const sessionKey = 'stacklyfit-session';
let user = null; try { user = JSON.parse(localStorage.getItem(sessionKey) || sessionStorage.getItem(sessionKey) || 'null') } catch { }
if (user) {
  const l = $('.acts .login');
  if (l) { l.textContent = 'Log out'; l.href = '#'; l.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); try { localStorage.removeItem(sessionKey); sessionStorage.removeItem(sessionKey) } catch { } location.reload() }, true) }
}

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target; el.classList.add('in'); io.unobserve(el);
  setTimeout(() => el.classList.add('done'), 1400)
}), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
const heroDelay = 650;
// .mk elements start fully clipped (zero visible area), so watch their parent box instead
const mkOf = new Map();
$$('.rv, .mk, [data-split], .fade, .feats, .stars').forEach(el => {
  if (el.closest('.hero')) { setTimeout(() => el.classList.add('in'), heroDelay); return }
  if (el.classList.contains('mk') && el.parentElement) {
    const host = el.parentElement; mkOf.set(host, [...(mkOf.get(host) || []), el]); return
  }
  io.observe(el)
});
const mio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; mio.unobserve(e.target);
  (mkOf.get(e.target) || []).forEach(el => { el.classList.add('in'); setTimeout(() => el.classList.add('done'), 1400) })
}), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
mkOf.forEach((_, host) => mio.observe(host));
$$('.fade').forEach((el, i) => el.style.setProperty('--td', (.15 + (+el.dataset.i || 0) * .12) + 's'));

/* ---------- counters ---------- */
const countUp = (el, t, dur = 1700) => {
  if (reduce) { el.textContent = t.toLocaleString(); return }
  const s = performance.now();
  (function f(n) { const p = Math.min((n - s) / dur, 1); el.textContent = Math.round(t * (1 - Math.pow(1 - p, 4))).toLocaleString(); p < 1 && requestAnimationFrame(f) })(s)
};
const co = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; co.unobserve(e.target); countUp(e.target, +e.target.dataset.count) }), { threshold: .5 });
$$('[data-count]').forEach(el => { if (el.closest('.notch')) setTimeout(() => countUp(el, +el.dataset.count), 1200); else co.observe(el) });

/* ---------- hover effects: tilt, spotlight, hero glow ---------- */
if (!reduce && canHover) {
  $$('.cc').forEach(c => {
    c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-6px)` });
    c.addEventListener('mouseleave', () => c.style.transform = '')
  });
  $$('.plan').forEach(p => p.addEventListener('mousemove', e => { const r = p.getBoundingClientRect(); p.style.setProperty('--mx', (e.clientX - r.left) + 'px'); p.style.setProperty('--my', (e.clientY - r.top) + 'px') }));
  const hc = $('.hero-card');
  if (hc) hc.addEventListener('mousemove', e => {
    const r = hc.getBoundingClientRect(); hc.style.setProperty('--mx', (e.clientX - r.left) + 'px'); hc.style.setProperty('--my', (e.clientY - r.top) + 'px');
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    const s = $('.sun', hc), g = $('.ring', hc); if (s) s.style.translate = `${-x * 50}px ${-y * 50}px`; if (g) g.style.translate = `${x * 60}px ${y * 40}px`
  });
}

/* ---------- toast ---------- */
const toast = m => { const t = $('#toast'); if (!t) return; t.textContent = m; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2600) };

/* ---------- pricing toggle ---------- */
const bill = $('#bill');
if (bill) {
  const pill = $('.pill', bill), btns = $$('button', bill), setPill = b => { pill.style.left = b.offsetLeft + 'px'; pill.style.width = b.offsetWidth + 'px' };
  setPill($('.on', bill)); addEventListener('resize', () => setPill($('.on', bill))); document.fonts?.ready.then(() => setPill($('.on', bill)));
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.classList.toggle('on', x === b)); setPill(b);
    $$('[data-m]').forEach(p => { const to = +p.dataset[b.dataset.k], from = +p.textContent.slice(1), s = performance.now(); (function f(n) { const k = Math.min((n - s) / 550, 1), e = 1 - Math.pow(1 - k, 3); p.textContent = '$' + Math.round(from + (to - from) * e); k < 1 && requestAnimationFrame(f) })(s) });
    toast(b.dataset.k === 'y' ? 'Yearly billing — you save 20%' : 'Monthly billing selected')
  }))
}

/* ---------- testimonials: rotating highlight ---------- */
const tqs = $$('.tq');
if (tqs.length && !reduce) { let n = 0, hold = false; tqs.forEach(t => { t.addEventListener('mouseenter', () => hold = true); t.addEventListener('mouseleave', () => hold = false) }); tqs[0].classList.add('active'); setInterval(() => { if (hold) return; tqs[n].classList.remove('active'); n = (n + 1) % tqs.length; tqs[n].classList.add('active') }, 3200) }

/* ---------- sports carousel ---------- */
const slides = $$('.slide');
if (slides.length) {
  const dots = $$('.dots i'); let n = 0, t;
  const go = i => { n = (i + slides.length) % slides.length; slides.forEach((s, k) => s.classList.toggle('on', k === n)); dots.forEach((d, k) => d.classList.toggle('on', k === n)) };
  const auto = () => { clearInterval(t); if (!reduce) t = setInterval(() => go(n + 1), 4500) };
  $('#nx')?.addEventListener('click', () => { go(n + 1); auto() }); $('#pv')?.addEventListener('click', () => { go(n - 1); auto() });
  dots.forEach((d, k) => d.addEventListener('click', () => { go(k); auto() })); go(0); auto()
}

/* ---------- programs: goal circles filter + search ---------- */
const scs = $$('.sc');
if (scs.length) {
  let cat = 'all', q = '';
  const apply = () => { let hits = 0; scs.forEach(c => { const ok = (cat === 'all' || c.dataset.c.split(' ').includes(cat)) && (!q || c.textContent.toLowerCase().includes(q)); c.classList.toggle('dim', !ok); if (ok) hits++ }); const nr = $('.nores'); if (nr) nr.style.display = hits ? 'none' : 'block' };
  $$('.dot').forEach(b => b.addEventListener('click', () => { const same = b.classList.contains('on'); $$('.dot').forEach(x => x.classList.remove('on')); cat = same ? 'all' : b.dataset.f; if (!same) b.classList.add('on'); apply(); $('#signature')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }) }));
  const qs = new URLSearchParams(location.search).get('q');
  if (qs) { q = qs.toLowerCase().trim(); const i = $('.hs input'); if (i) i.value = qs; apply(); setTimeout(() => $('#signature')?.scrollIntoView({ behavior: 'smooth' }), 2200) }
  $('.hs')?.addEventListener('submit', e => { e.preventDefault(); q = $('input', e.currentTarget).value.toLowerCase().trim(); apply(); $('#signature')?.scrollIntoView({ behavior: 'smooth' }) })
}
