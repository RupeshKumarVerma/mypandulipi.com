/* A reversible, scroll-scrubbed assembly. No scroll interception or dependencies. */
(function () {
  'use strict';
  var story = document.getElementById('the-making');
  if (!story) return;
  var pin = story.querySelector('.craft-pin');
  var bottom = story.querySelector('#assembly-bottom');
  var top = story.querySelector('#assembly-top');
  var pages = Array.prototype.slice.call(story.querySelectorAll('[data-page]'));
  var thread = story.querySelector('#assembly-thread');
  var knots = Array.prototype.slice.call(story.querySelectorAll('.assembly-knot'));
  var cords = Array.prototype.slice.call(story.querySelectorAll('.assembly-cord-draw'));
  var heading = story.querySelector('[data-craft-heading]');
  var description = story.querySelector('[data-craft-description]');
  var buttons = Array.prototype.slice.call(story.querySelectorAll('[data-craft-step]'));
  var hint = story.querySelector('[data-craft-hint]');
  var header = document.querySelector('.hdr');
  var notice = document.querySelector('.notice');
  if (!pin || !bottom || !top || pages.length !== 12 || !thread || !heading || !description || buttons.length !== 4) return;
  var media = window.matchMedia('(prefers-reduced-motion: reduce)');
  var stages = [
    ['A foundation in wood.', 'Every timeless story begins with a beautiful foundation.'],
    ['Wisdom, page by page.', 'Sacred words come together, one printed leaf at a time.'],
    ['Protected by tradition.', 'A wooden cover, finished with the MyPandulipi mark.'],
    ['Bound by devotion.', 'Two wooden covers. Sacred words. A thread of tradition.']
  ];
  var ready = false, frame = 0, activeStage = -1, headerHeight = 92;
  var lastProgress = -1, printing = false;
  var cordLengths = cords.map(function (path) {
    return path.getTotalLength();
  });
  function clamp(n) { return Math.max(0, Math.min(1, n)); }
  function range(p, a, b) { return clamp((p - a) / (b - a)); }
  function ease(t) { return t * t * (3 - 2 * t); }
  function move(el, y, opacity) {
    el.style.transform = 'translateY(' + y.toFixed(2) + 'px)';
    el.style.opacity = opacity.toFixed(3);
  }
  function render(p) {
    var staticMode = !ready;
    if (p === lastProgress && !staticMode) return;
    lastProgress = p;
    // Four clear acts: lower board, twelve leaves, upper board, threaded binding.
    var b = ease(range(p, .015, .21));
    move(bottom, -90 * (1 - b), 1);
    pages.forEach(function (page, i) {
      var start = .225 + i * .014;
      var t = range(p, start, start + .105);
      move(page, -115 * (1 - ease(t)), range(t, 0, .2));
    });
    var t = range(p, .525, .715);
    move(top, -115 * (1 - ease(t)), range(t, 0, .15));
    var threadP = range(p, .735, .955);
    thread.style.opacity = threadP > 0 ? '1' : '0';
    cords.forEach(function (path, i) {
      var start = Number(path.getAttribute('data-cord-start') || 0);
      var end = Number(path.getAttribute('data-cord-end') || 1);
      var draw = ease(range(threadP, start, end));
      path.style.strokeDasharray = cordLengths[i].toFixed(2);
      path.style.strokeDashoffset = (cordLengths[i] * (1 - draw)).toFixed(2);
    });
    knots.forEach(function (knot) { knot.style.opacity = range(p, .93, .985).toFixed(3); });
    var stage = p < .225 ? 0 : p < .525 ? 1 : p < .735 ? 2 : 3;
    if (staticMode) stage = 3;
    if (stage !== activeStage) {
      activeStage = stage;
      heading.textContent = stages[stage][0];
      description.textContent = stages[stage][1];
      buttons.forEach(function (button, i) {
        if (i === stage) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
      story.setAttribute('data-craft-stage', String(stage + 1));
    }
    var stops = [0, .225, .525, .735, 1];
    buttons.forEach(function (button, i) {
      button.parentNode.style.setProperty('--step-progress', staticMode ? '1' : range(p, stops[i], stops[i+1]).toFixed(4));
    });
    story.classList.toggle('is-complete', p >= .985);
    if (hint) hint.textContent = p >= .985 ? 'Keep scrolling to discover the collection' : 'Scroll to bring tradition to life';
  }
  function update() {
    frame = 0;
    if (!ready) return;
    var rect = story.getBoundingClientRect();
    var travel = Math.max(1, story.offsetHeight - pin.offsetHeight);
    render(clamp((headerHeight - rect.top) / travel));
  }
  function schedule() {
    if (ready && !frame) frame = window.requestAnimationFrame(update);
  }
  function configure() {
    headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    story.style.setProperty('--craft-top', headerHeight + 'px');
    story.style.setProperty('--craft-notice', (notice ? Math.ceil(notice.getBoundingClientRect().height) : 0) + 'px');
    var minimumHeight = 650;
    ready = !media.matches && window.innerHeight >= minimumHeight && !printing;
    story.classList.toggle('is-scroll-ready', ready);
    buttons.forEach(function (button) { button.disabled = !ready; });
    lastProgress = -1;
    if (ready) update(); else render(1);
  }
  buttons.forEach(function (button, i) {
    button.addEventListener('click', function () {
      if (!ready) return;
      var progress = [.215, .51, .73, 1][i];
      var y = window.scrollY + story.getBoundingClientRect().top - headerHeight;
      y += (story.offsetHeight - pin.offsetHeight) * progress;
      window.scrollTo({top: y, behavior: 'smooth'});
    });
  });
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', configure, {passive:true});
  window.addEventListener('load', configure, {once:true});
  window.addEventListener('pageshow', configure);
  window.addEventListener('beforeprint', function () { printing = true; configure(); });
  window.addEventListener('afterprint', function () { printing = false; configure(); });
  if (media.addEventListener) media.addEventListener('change', configure);
  else if (media.addListener) media.addListener(configure);
  configure();
  if (header && 'ResizeObserver' in window) {
    var headerObserver = new ResizeObserver(function () {
      if (Math.ceil(header.getBoundingClientRect().height) !== headerHeight) configure();
    });
    headerObserver.observe(header);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(configure);
}());
