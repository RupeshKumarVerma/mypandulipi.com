/* =========================================================
   PANDULIPI — shared site behavior
   Used across all pages. Kept deliberately restrained:
   a handful of well-crafted moments, not scattered effects.
   ========================================================= */
(function(){
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll-reveal ---------- */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.14 });
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

  /* ---------- product image slideshows (index page) ---------- */
  document.querySelectorAll('[data-slideshow]').forEach(function(box){
    var slides = box.querySelectorAll('.slide');
    if(slides.length < 2) return;
    var i = 0;
    setInterval(function(){
      slides[i].classList.remove('active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('active');
    }, 3200);
  });

  /* ---------- mobile nav toggle ---------- */
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');
  if(navToggle && navLinks){
    navToggle.addEventListener('click', function(){
      var open = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- nav shrink + scroll progress ---------- */
  var nav = document.querySelector('.nav');
  var progressBar = document.querySelector('.scroll-progress i');
  function onScroll(){
    if(nav){ nav.classList.toggle('scrolled', window.scrollY > 30); }
    if(progressBar){
      var h = document.documentElement;
      var scrollable = h.scrollHeight - h.clientHeight;
      var pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      progressBar.style.width = pct + '%';
    }
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- count-up stats ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if(counters.length){
    var countIO = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        countIO.unobserve(entry.target);
        var el = entry.target;
        var raw = el.getAttribute('data-count');
        var match = raw.match(/^(\d+)(.*)$/);
        if(!match){ return; }
        var target = parseInt(match[1], 10);
        var suffix = match[2] || '';
        if(reduceMotion){ el.textContent = target + suffix; return; }
        var start = 0;
        var duration = 1100;
        var startTime = null;
        function step(ts){
          if(startTime === null) startTime = ts;
          var progress = Math.min((ts - startTime) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          var value = Math.round(start + (target - start) * eased);
          el.textContent = value + suffix;
          if(progress < 1){ requestAnimationFrame(step); }
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    counters.forEach(function(el){ countIO.observe(el); });
  }

  /* ---------- thread-stitch divider draw-on-scroll ---------- */
  var stitchPaths = document.querySelectorAll('.stitch-divider .stitch-path');
  stitchPaths.forEach(function(path){
    var len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = reduceMotion ? 0 : len;
  });
  if(stitchPaths.length && !reduceMotion){
    var stitchIO = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        stitchIO.unobserve(entry.target);
        var svg = entry.target;
        var path = svg.querySelector('.stitch-path');
        if(path){ path.style.strokeDashoffset = '0'; }
        svg.classList.add('in');
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.stitch-divider').forEach(function(svg){ stitchIO.observe(svg); });
  } else {
    document.querySelectorAll('.stitch-divider').forEach(function(svg){ svg.classList.add('in'); });
  }

  /* ---------- hero load-in (above the fold, animates on page load not scroll) ---------- */
  document.querySelectorAll('.load-in').forEach(function(el, idx){
    if(reduceMotion){ el.classList.add('in'); return; }
    setTimeout(function(){ el.classList.add('in'); }, 90 * idx + 60);
  });

  /* ---------- scroll-to-top ---------- */
  var topBtn = document.querySelector('.to-top');
  if(topBtn){
    topBtn.addEventListener('click', function(){
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    document.addEventListener('scroll', function(){
      topBtn.classList.toggle('show', window.scrollY > 900);
    }, { passive: true });
  }
})();
