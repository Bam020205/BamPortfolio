const menu = document.querySelector('#menu');
const toggle = document.querySelector('.menu-toggle');

if (typeof menu.showModal === 'function') {
  toggle.hidden = false;
  document.documentElement.classList.add('has-menu');
  toggle.addEventListener('click', () => {
    hideCursor();
    menu.showModal();
    toggle.setAttribute('aria-expanded', 'true');
  });
  function closePhone() {
    if (menu.getAnimations().some(animation => animation.id === 'closing')) return;
    if (!menu.animate || matchMedia('(prefers-reduced-motion:reduce)').matches || document.body.classList.contains('motion-off')) {
      menu.close();
      return;
    }
    const exit = menu.animate([{ opacity:1, transform:'scale(1)' },{ opacity:0, transform:'scale(.88)' }], { duration:350, easing:'cubic-bezier(.16,1,.3,1)', id:'closing' });
    exit.onfinish = () => menu.close();
  }
  menu.querySelector('.menu-close').addEventListener('click', closePhone);
  menu.querySelector('.home-bar').addEventListener('click', closePhone);
  menu.addEventListener('cancel', event => { event.preventDefault(); closePhone(); });
  let startY;
  menu.addEventListener('touchstart', event => { startY = event.touches[0].clientY; }, {passive:true});
  menu.addEventListener('touchend', event => {
    if (event.changedTouches[0].clientY - startY > 75 && !menu.scrollTop) closePhone();
  }, {passive:true});
  menu.addEventListener('close', () => toggle.setAttribute('aria-expanded', 'false'));
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
