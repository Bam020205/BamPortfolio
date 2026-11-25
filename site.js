const menu = document.querySelector('#menu');
const toggle = document.querySelector('.menu-toggle');

if (typeof menu.showModal === 'function') {
  const screen = menu.querySelector('.phone-screen');
  const lock = menu.querySelector('.phone-lock');
  const apps = menu.querySelector('.phone-apps');
  const home = menu.querySelector('.phone-home');
  const light = menu.querySelector('.flashlight');
  const camera = menu.querySelector('.camera');
  const memory = menu.querySelector('.phone-memory');
  const photo = memory.querySelector('img');
  const flash = menu.querySelector('.phone-flash');
  const boot = menu.querySelector('.phone-boot');
  const clock = menu.querySelector('.phone-time');
  const date = menu.querySelector('.phone-date');
  const timeFormat = new Intl.DateTimeFormat(undefined, {hour:'numeric',minute:'2-digit'});
  const dateFormat = new Intl.DateTimeFormat(undefined, {weekday:'short',month:'short',day:'numeric'});
  let clockTimer, bootTimer, photoTimer, session = 0;
  let busy = false;
  function syncClock() {
    clearTimeout(clockTimer);
    if (!menu.open) return;
    const now = new Date();
    clock.textContent = timeFormat.formatToParts(now).filter(p => ['hour','minute','literal'].includes(p.type)).map(p => p.value).join('').trim();
    clock.dateTime = now.toISOString();
    clock.setAttribute('aria-label', timeFormat.format(now));
    date.textContent = dateFormat.format(now);
    clockTimer = setTimeout(syncClock, 60000 - now.getTime() % 60000);
  }
  function setTheme(dark) {
    screen.dataset.theme = dark ? 'dark' : 'light';
    light.setAttribute('aria-pressed', String(dark));
  }
  function showApps(open, focus = true) {
    screen.dataset.view = open ? 'apps' : 'lock';
    lock.hidden = open;
    apps.hidden = !open;
    home.querySelector('span').textContent = open ? 'Lock screen' : 'Open menu';
    if (focus) (open ? apps.querySelector('a') : home).focus({preventScroll:true});
  }
  function finishBoot() {
    boot.hidden = true;
    lock.inert = false;
    home.inert = false;
  }
  function closePhone() {
    if (menu.open) menu.close();
  }
  toggle.hidden = false;
  document.documentElement.classList.add('has-menu');
  toggle.addEventListener('click', () => {
    hideCursor();
    let dark = false;
    try { dark = localStorage.getItem('portfolio-phone-theme') === 'dark'; } catch {}
    setTheme(dark);
    showApps(false, false);
    const animateBoot = moving();
    boot.hidden = !animateBoot;
    lock.inert = home.inert = animateBoot;
    menu.showModal();
    if (!photo.hasAttribute('src')) photo.src = photo.dataset.src;
    syncClock();
    toggle.setAttribute('aria-expanded','true');
    if (animateBoot) bootTimer = setTimeout(finishBoot, 780);
  });
  light.addEventListener('click', () => {
    setTheme(screen.dataset.theme !== 'dark');
    try { localStorage.setItem('portfolio-phone-theme',screen.dataset.theme); } catch {}
  });
  camera.addEventListener('click', async () => {
    if (busy) return;
    const opened = session;
    busy = true;
    try {
      await photo.decode();
      if (opened !== session || !menu.open) return;
      memory.hidden = false;
      if (moving()) flash.animate([{opacity:1},{opacity:0}], {duration:150,easing:'ease-out'});
      photoTimer = setTimeout(async () => {
        if (moving()) {
          try { await memory.animate([{opacity:1},{opacity:0}], {duration:300,easing:'ease-out'}).finished; } catch {}
        }
        if (opened === session) {
          memory.hidden = true;
          busy = false;
        }
      }, moving() ? 1650 : 1500);
    } catch { if (opened === session) busy = false; }
  });
  home.addEventListener('click', () => { if (!busy) showApps(apps.hidden); });
  menu.querySelector('.phone-close').addEventListener('click',closePhone);
  menu.addEventListener('click', event => {
    if (event.target !== menu) return;
    const bounds = menu.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closePhone();
  });
  let touchStart;
  screen.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? event.touches[0] : null;
  }, {passive:true});
  screen.addEventListener('touchend', event => {
    if (!touchStart || busy || !boot.hidden || !apps.hidden) return;
    const end = event.changedTouches[0];
    const dy = end.clientY - touchStart.clientY;
    if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(end.clientX - touchStart.clientX)) {
      if (dy < 0) showApps(true); else closePhone();
    }
    touchStart = null;
  }, {passive:true});
  document.addEventListener('visibilitychange', () => { if (!document.hidden && menu.open) syncClock(); });
  menu.addEventListener('close', () => {
    session++;
    clearTimeout(clockTimer);
    clearTimeout(bootTimer);
    clearTimeout(photoTimer);
    for (const el of [memory,flash]) el.getAnimations().forEach(a => a.cancel());
    finishBoot();
    memory.hidden = true;
    busy = false;
    toggle.setAttribute('aria-expanded','false');
  });
}

if ('IntersectionObserver' in window && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('reveal-enter');
      observer.unobserve(entry.target);
    }
  }, { threshold: .08 });
  document.querySelectorAll('.reveal').forEach((element) => {
    if (element.getBoundingClientRect().top >= innerHeight) observer.observe(element);
  });
}

const presentation = document.querySelector('[data-local-original]');
if (presentation && !location.hostname.endsWith('.github.io')) {
  const original = document.createElement('source');
  original.type = 'video/mp4';
  original.src = presentation.dataset.localOriginal;
  presentation.prepend(original);
  presentation.load();
  const label = document.querySelector('[data-video-label]');
  label.textContent = 'Science fair presentation';
  presentation.addEventListener('loadedmetadata', () => {
    label.textContent = presentation.currentSrc === original.src
      ? 'Full science fair presentation'
      : 'Science fair preview · 14 seconds';
  });
}

const compose = document.querySelector('.compose');
if (compose) {
  compose.hidden = false;
  const form = compose.querySelector('form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = new FormData(form);
    const subject = encodeURIComponent(fields.get('subject').trim());
    const body = encodeURIComponent(`${fields.get('message').trim()}\r\n\r\n${fields.get('name').trim()} (${fields.get('email').trim()})`);
    location.href = `mailto:${form.dataset.recipient}?subject=${subject}&body=${body}`;
  });
}

const copy = document.querySelector('[data-copy]');
if (copy && navigator.clipboard?.writeText) {
  copy.hidden = false;
  copy.addEventListener('click', async () => {
    const status = document.querySelector('.copy-status');
    try {
      await navigator.clipboard.writeText(copy.dataset.copy);
      status.textContent = 'Email address copied.';
    } catch {
      status.textContent = 'Copy the email address from the link above.';
    }
  });
}

const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const stage = document.querySelector('.portrait-stage');
const reactor = document.querySelector('.reactor-stage');
if (reactor && 'IntersectionObserver' in window) {
  const visibility = new IntersectionObserver(([entry]) => {
    reactor.classList.toggle('reactor-resting', !entry.isIntersecting);
  });
  visibility.observe(reactor.querySelector('.reactor-backdrop'));
}
const introduction = document.querySelector('#fieldwork');
const motionButtons = document.querySelectorAll('.motion-toggle');
const ring = document.querySelector('.cursor-ring');
const root = document.documentElement;
root.classList.add('motion-ready');
let paused = false;
try { paused = sessionStorage.getItem('portfolio-motion') === 'paused'; } catch {}
function moving() { return !paused && !motionPreference.matches; }
if ('IntersectionObserver' in window) {
  const headingObserver = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      if (moving()) target.classList.add('letters-enter');
      headingObserver.unobserve(target);
    }
  });
  document.querySelectorAll('.blur-heading').forEach(heading => headingObserver.observe(heading));
}
function syncMotion() {
  document.body.classList.toggle('motion-off', !moving());
  if (!moving()) {
    document.body.classList.add('intro-read');
    document.querySelectorAll('.letters-enter').forEach(heading => heading.classList.remove('letters-enter'));
  }
  for (const button of motionButtons) {
    button.hidden = motionPreference.matches;
    button.textContent = paused ? 'Resume motion' : 'Pause motion';
  }
  hideCursor();
  updateScroll();
}
motionButtons.forEach(button => button.addEventListener('click', () => {
  paused = !paused;
  try { sessionStorage.setItem('portfolio-motion', paused ? 'paused' : 'on'); } catch {}
  syncMotion();
}));
let pendingScroll = false;
function updateScroll() {
  pendingScroll = false;
  if (introduction) {
    const bottom = introduction.getBoundingClientRect().bottom;
    const progress = moving() ? Math.max(0, Math.min(1, 1 - bottom / (innerHeight * .75))) : 0;
    introduction.style.setProperty('--daylight', progress);
  }
  if (stage && window.scrollY < stage.offsetHeight + 200) {
    const offset = moving() ? window.scrollY : 0;
    stage.style.setProperty('--portrait-y', Math.min(offset * .1,55) + 'px');
    stage.style.setProperty('--type-y', Math.min(offset * .2,105) + 'px');
  }
}
if (stage) window.addEventListener('scroll', () => {
  if (!pendingScroll) { pendingScroll = true; requestAnimationFrame(updateScroll); }
}, { passive:true });
motionPreference.addEventListener('change',syncMotion);
syncMotion();

let cursorFrame = 0;
let pointerX = 0, pointerY = 0, ringX = 0, ringY = 0;
function hideCursor() {
  root.classList.remove('cursor-visible');
  ring.classList.remove('over-control');
}
function followPointer() {
  cursorFrame = 0;
  if (!root.classList.contains('cursor-visible')) return;
  ringX += (pointerX - ringX) * .24;
  ringY += (pointerY - ringY) * .24;
  ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px)';
  if (Math.abs(pointerX-ringX) + Math.abs(pointerY-ringY) > .4) cursorFrame = requestAnimationFrame(followPointer);
}
function movePortfolioCursor(event) {
  if (event.pointerType !== 'mouse' || menu.open ||
      event.target.closest('input,textarea,video')) { hideCursor(); return; }
  pointerX = event.clientX; pointerY = event.clientY;
  ring.classList.toggle('over-control', Boolean(event.target.closest('button:enabled,a[href],summary')));
  if (!moving() || !root.classList.contains('cursor-visible')) { ringX = pointerX; ringY = pointerY; }
  root.classList.add('cursor-visible');
  if (!cursorFrame) cursorFrame = requestAnimationFrame(followPointer);
}
if (!document.querySelector('.journal-main')) {
  document.addEventListener('pointermove', movePortfolioCursor, {passive:true});
}
root.addEventListener('pointerleave', hideCursor);
window.addEventListener('blur', hideCursor);
document.addEventListener('keydown', hideCursor);
document.querySelectorAll('.quick-preview').forEach(details => {
  details.addEventListener('toggle', () => { if (!details.open) details.querySelector('video').pause(); });
});
