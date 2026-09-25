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
  var bar = document.querySelector('.progress i');
  var totop = document.querySelector('.totop');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (hdr) hdr.classList.toggle('scrolled', y > 24);
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
