/* mypandulipi — interactions */
(function () {
  'use strict';
  window.__pl = true;
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var DEVA = /[ऀ-ॿ]/;
  var seg = (window.Intl && Intl.Segmenter) ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  function graphemes(s) {
    if (seg) { var out = []; var it = seg.segment(s); for (var x of it) out.push(x.segment); return out; }
    return Array.from(s);
  }

  /* ---------- headings that write themselves ---------- */
  function splitNode(node, chars) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span');
          w.className = 'w';
          var pieces = DEVA.test(part) ? [part] : graphemes(part);
          pieces.forEach(function (g) {
            var c = document.createElement('span');
            c.className = 'ch';
            c.textContent = g;
            w.appendChild(c);
            chars.push(c);
          });
          frag.appendChild(w);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') {
        splitNode(child, chars);
      }
    });
  }

  function prepWrite(el) {
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', label);
    var chars = [];
    splitNode(el, chars);
    chars.forEach(function (c) { c.setAttribute('aria-hidden', 'true'); });
    el._chars = chars;
    el.classList.add('ready');
  }

  function typeOut(el) {
    if (el._typed) return;
    el._typed = true;
    var chars = el._chars || [];
    var n = chars.length;
    if (!n) { el.classList.add('written'); return; }
    var total = Math.max(700, Math.min(n * 42, el.hasAttribute('data-slow') ? 2600 : 1900));
    var step = total / n;
    var caret = document.createElement('span');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');
    chars[0].parentNode.insertBefore(caret, chars[0]);
    var i = 0;
    var start = null;
    function tick(ts) {
      if (start === null) start = ts;
      var target = Math.min(n, Math.floor((ts - start) / step) + 1);
      while (i < target) {
        chars[i].classList.add('on');
        chars[i].parentNode.insertBefore(caret, chars[i].nextSibling);
        i++;
      }
      if (i < n) { requestAnimationFrame(tick); }
      else {
        el.classList.add('written');
        setTimeout(function () { caret.classList.add('done'); }, 900);
        setTimeout(function () { if (caret.parentNode) caret.parentNode.removeChild(caret); }, 1600);
      }
    }
    requestAnimationFrame(tick);
  }

  var writers = document.querySelectorAll('[data-write]');
  if (reduce || !hasIO) {
    writers.forEach(function (el) { el.classList.add('ready', 'written'); });
  } else {
    writers.forEach(prepWrite);
    var wio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var el = e.target;
          var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
          setTimeout(function () { typeOut(el); }, delay);
          wio.unobserve(el);
        }
      });
    }, { threshold: 0.5, rootMargin: '0px 0px -8% 0px' });
    writers.forEach(function (el) { wio.observe(el); });
  }

  /* ---------- reveal on scroll ---------- */
  var rvs = document.querySelectorAll('.rv');
  if (reduce || !hasIO) {
    rvs.forEach(function (el) { el.classList.add('in'); });
  } else {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rvs.forEach(function (el) { rio.observe(el); });
  }

  /* ---------- manifesto: words ink in with scroll ---------- */
  var ills = [];
  document.querySelectorAll('[data-illuminate]').forEach(function (el) {
    var words = [];
    function walk(node, acc) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span');
            s.className = 'iw' + (acc ? ' acc' : '');
            s.textContent = part;
            frag.appendChild(s);
            words.push(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child, acc || child.tagName === 'EM');
        }
      });
    }
    walk(el, false);
    if (reduce) { words.forEach(function (w) { w.classList.add('lit'); }); return; }
    ills.push({ el: el, words: words });
  });
  function illuminate() {
    var vh = window.innerHeight;
    ills.forEach(function (o) {
      var r = o.el.getBoundingClientRect();
      var p = (vh * 0.82 - r.top) / (r.height + vh * 0.3);
      p = Math.max(0, Math.min(1, p));
      var lit = Math.round(p * o.words.length);
      o.words.forEach(function (w, i) { w.classList.toggle('lit', i < lit); });
    });
  }

  /* ---------- header, progress, to-top ---------- */
  var hdr = document.querySelector('.hdr');
  var darkSecs = Array.prototype.slice.call(document.querySelectorAll('.night, .foot'));
  var bar = document.querySelector('.progress i');
  var totop = document.querySelector('.totop');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (hdr) {
      hdr.classList.toggle('scrolled', y > 24);
      var mid = hdr.getBoundingClientRect().top + hdr.offsetHeight / 2;
      var dark = false;
      darkSecs.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom >= mid) dark = true; });
      hdr.classList.toggle('on-dark', dark);
    }
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
    if (totop) totop.classList.toggle('show', y > 900);
    illuminate();
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
  if (totop) totop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- mobile menu ---------- */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('menu-open', open);
    menu.querySelectorAll('.m-link').forEach(function (a, i) {
      a.style.transitionDelay = open ? (0.08 + i * 0.05) + 's' : '0s';
    });
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- slideshows ---------- */
  document.querySelectorAll('[data-slideshow]').forEach(function (box, k) {
    var slides = box.querySelectorAll('.slide');
    if (slides.length < 2 || reduce) return;
    var idx = 0;
    setTimeout(function () {
      setInterval(function () {
        slides[idx].classList.remove('active');
        idx = (idx + 1) % slides.length;
        slides[idx].classList.add('active');
      }, 3800);
    }, k * 900);
  });

  /* ---------- embers ---------- */
  if (!reduce) {
    document.querySelectorAll('.embers').forEach(function (box) {
      var count = parseInt(box.getAttribute('data-count') || '22', 10);
      for (var i = 0; i < count; i++) {
        var e = document.createElement('i');
        var size = (Math.random() * 2.6 + 1.6).toFixed(1);
        e.style.left = (Math.random() * 100).toFixed(2) + '%';
        e.style.width = e.style.height = size + 'px';
        e.style.animationDuration = (Math.random() * 9 + 9).toFixed(1) + 's';
        e.style.animationDelay = (-Math.random() * 18).toFixed(1) + 's';
        e.style.setProperty('--dx', ((Math.random() - 0.5) * 140).toFixed(0) + 'px');
        box.appendChild(e);
      }
    });
  }

  /* ---------- final sync after images load ---------- */
  window.addEventListener('load', function () { onScroll(); });
})();

/* ---------- price reveal scratch card (trial) ---------- */
(function () {
  var cards = document.querySelectorAll('[data-reveal]');
  if (!cards.length) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function paintFoil(btn) {
    var c = btn.querySelector('.scratch-foil');
    var r = btn.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
    var x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    var w = r.width, h = r.height;
    var g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#B8862E'); g.addColorStop(.3, '#F2D08A'); g.addColorStop(.55, '#C99A45');
    g.addColorStop(.8, '#F6DFA4'); g.addColorStop(1, '#A87828');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (var i = 0; i < 900; i++) {            // foil grain
      x.fillStyle = 'rgba(' + (Math.random() < .5 ? '255,248,225' : '110,70,15') + ',' + (Math.random() * .16).toFixed(3) + ')';
      x.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4);
    }
    x.strokeStyle = 'rgba(255,245,215,.18)'; x.lineWidth = 1;
    for (var k = -h; k < w; k += 9) { x.beginPath(); x.moveTo(k, h); x.lineTo(k + h, 0); x.stroke(); }
    x.strokeStyle = 'rgba(90,55,10,.35)'; x.setLineDash([4, 4]);
    x.strokeRect(7.5, 7.5, w - 15, h - 15); x.setLineDash([]);
    // coin icon
    var cx = 44, cy = h / 2;
    x.fillStyle = 'rgba(90,55,10,.85)'; x.beginPath(); x.arc(cx, cy, 17, 0, 6.283); x.fill();
    x.fillStyle = '#F6DFA4'; x.font = '600 19px "DM Sans", system-ui, sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('₹', cx, cy + 1);
    x.textAlign = 'left'; x.fillStyle = '#3A2408';
    x.font = '500 21px Fraunces, Georgia, serif'; x.fillText('Reveal price', 74, cy - 8);
    x.fillStyle = 'rgba(58,36,8,.75)'; x.font = '500 11px "DM Sans", system-ui, sans-serif';
    x.fillText('TAP TO SCRATCH  ✦', 75, cy + 15);
  }

  function scratchAway(btn, done) {
    var c = btn.querySelector('.scratch-foil'), x = c.getContext('2d');
    var w = c.width, h = c.height;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'destination-out';
    x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = h * .34;
    var pts = [], rows = 4;
    for (var r = 0; r < rows; r++) {
      var y = h * (.12 + r * .25);
      pts.push(r % 2 ? [w * 1.05, y] : [-w * .05, y]);
      pts.push(r % 2 ? [-w * .05, y + h * .12] : [w * 1.05, y + h * .12]);
    }
    var total = reduce ? 1 : 900, t0 = performance.now(), prev = pts[0];
    function step(now) {
      var p = Math.max(0, Math.min(1, (now - t0) / total)), f = p * (pts.length - 1), i = Math.floor(f), s = f - i;
      var a = pts[i], b = pts[Math.min(i + 1, pts.length - 1)];
      var cur = [a[0] + (b[0] - a[0]) * s + (Math.random() - .5) * 6, a[1] + (b[1] - a[1]) * s + (Math.random() - .5) * 6];
      x.beginPath(); x.moveTo(prev[0], prev[1]); x.lineTo(cur[0], cur[1]); x.stroke(); prev = cur;
      if (p < 1) requestAnimationFrame(step);
      else { c.style.opacity = '0'; setTimeout(function () { c.style.display = 'none'; }, 500); done(); }
    }
    requestAnimationFrame(step);
  }

  var dlg = document.createElement('dialog');
  dlg.className = 'rr-dialog';
  dlg.innerHTML =
    '<form class="rr-box" method="dialog" novalidate>' +
    '<button class="rr-close" type="button" aria-label="Close">×</button>' +
    '<p class="rr-deva">॥ राधे राधे ॥</p>' +
    '<h3>Unlock the price</h3>' +
    '<p>Type <b>Radhe Radhe</b> below to reveal the price.</p>' +
    '<input class="rr-input" type="text" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="Radhe Radhe" aria-label="Type Radhe Radhe">' +
    '<div class="rr-hint" aria-live="polite"></div>' +
    '<button class="rr-go" type="submit">Reveal price</button>' +
    '</form>';
  document.body.appendChild(dlg);
  var form = dlg.querySelector('form'), input = dlg.querySelector('.rr-input'), hint = dlg.querySelector('.rr-hint');
  var active = null;

  function ok(v) {
    v = (v || '').toLowerCase().replace(/[^a-zऀ-ॿ]/g, '');
    return /^(radhey?){2}$/.test(v) || v === 'राधेराधे';
  }
  function close() { if (dlg.open) dlg.close(); }
  dlg.querySelector('.rr-close').addEventListener('click', close);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
  input.addEventListener('input', function () { input.classList.remove('is-wrong'); hint.textContent = ''; });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!ok(input.value)) {
      input.classList.remove('is-wrong'); void input.offsetWidth; input.classList.add('is-wrong');
      hint.textContent = 'Please type: Radhe Radhe';
      input.focus(); return;
    }
    close();
    var btn = active; if (!btn) return;
    btn.querySelector('.scratch-price span').textContent = atob(btn.getAttribute('data-p'));
    btn.setAttribute('aria-label', 'Price revealed');
    scratchAway(btn, function () { btn.classList.add('is-open', 'is-shine'); });
  });

  cards.forEach(function (btn) {
    paintFoil(btn);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!btn.classList.contains('is-open')) paintFoil(btn); });
    btn.addEventListener('click', function () {
      if (btn.classList.contains('is-open') || btn.dataset.busy) return;
      active = btn; input.value = ''; hint.textContent = ''; input.classList.remove('is-wrong');
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      setTimeout(function () { input.focus(); }, 60);
    });
  });
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { cards.forEach(function (b) { if (!b.classList.contains('is-open')) paintFoil(b); }); }, 150);
  });
})();
