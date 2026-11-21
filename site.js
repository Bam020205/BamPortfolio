const menu = document.querySelector('#menu');
const toggle = document.querySelector('.menu-toggle');

if (typeof menu.showModal === 'function') {
  toggle.hidden = false;
  document.documentElement.classList.add('has-menu');
  toggle.addEventListener('click', () => {
    menu.showModal();
    toggle.setAttribute('aria-expanded', 'true');
  });
  function closePhone() {
    if (menu.getAnimations().some(animation => animation.id === 'closing')) return;
    if (!menu.animate || matchMedia('(prefers-reduced-motion:reduce)').matches || document.body.classList.contains('motion-off')) {
      menu.close();
      return;
    }
    const exit = menu.animate([{ opacity:1, transform:'scale(1)' },{ opacity:0, transform:'scale(.8)' }], { duration:160, id:'closing' });
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
const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
const stage = document.querySelector('.portrait-stage');
const fieldwork = document.querySelector('#fieldwork');
const motionButton = document.querySelector('.motion-toggle');
const ring = document.querySelector('.cursor-ring');
let paused = false;
try { paused = sessionStorage.getItem('portfolio-motion') === 'paused'; } catch {}
function moving() { return !paused && !motionPreference.matches; }
function syncMotion() {
  document.body.classList.toggle('motion-off', !moving());
  if (motionButton) {
    motionButton.hidden = motionPreference.matches;
    motionButton.textContent = paused ? 'Resume motion' : 'Pause motion';
  }
  ring.classList.remove('active');
  updateScroll();
}
motionButton?.addEventListener('click', () => {
  paused = !paused;
  try { sessionStorage.setItem('portfolio-motion', paused ? 'paused' : 'on'); } catch {}
  syncMotion();
});
let pendingScroll = false;
function updateScroll() {
  pendingScroll = false;
  if (fieldwork) {
    const distance = fieldwork.getBoundingClientRect().bottom / innerHeight;
    const progress = moving() ? Math.max(0, Math.min(1, (1 - distance) * 1.5)) : 0;
    fieldwork.style.setProperty('--daylight', (progress * 100).toFixed(1) + '%');
    fieldwork.classList.toggle('daylight-ink', progress > .46);
  }
  if (stage && window.scrollY < stage.offsetHeight + 200) {
    const offset = moving() ? window.scrollY : 0;
    stage.style.setProperty('--portrait-y', Math.min(offset * .1,55) + 'px');
    stage.style.setProperty('--type-y', Math.min(offset * .2,105) + 'px');
    stage.style.setProperty('--grid-y', Math.min(offset * .055,35) + 'px');
  }
  const surface = document.elementFromPoint(innerWidth * .5,Math.min(50,innerHeight/3));
  toggle.classList.toggle('on-paper', Boolean(surface?.closest('.light-section,.portrait-stage,.case-inventory,.footer,.daylight-ink,.front-page .masthead')));
}
window.addEventListener('scroll', () => {
  if (!pendingScroll) { pendingScroll = true; requestAnimationFrame(updateScroll); }
}, { passive:true });
motionPreference.addEventListener('change',syncMotion);
syncMotion();

let cursorFrame = 0;
let pointerX = 0, pointerY = 0, ringX = 0, ringY = 0;
function followPointer() {
  cursorFrame = 0;
  if (!moving() || !finePointer.matches || !ring.classList.contains('active')) return;
  ringX += (pointerX - ringX) * .24;
  ringY += (pointerY - ringY) * .24;
  ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px)';
  if (Math.abs(pointerX-ringX) + Math.abs(pointerY-ringY) > .4) cursorFrame = requestAnimationFrame(followPointer);
}
document.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || !finePointer.matches || !moving() || menu.open) { ring.classList.remove('active'); return; }
  pointerX = event.clientX; pointerY = event.clientY;
  const link = event.target.closest('button,a,summary');
  if (link) {
    const rect = link.getBoundingClientRect();
    pointerX += Math.max(-7,Math.min(7,(rect.left + rect.width/2 - pointerX)*.25));
    pointerY += Math.max(-7,Math.min(7,(rect.top + rect.height/2 - pointerY)*.25));
  }
  if (!ring.classList.contains('active')) { ringX = pointerX; ringY = pointerY; }
  ring.classList.add('active');
  if (!cursorFrame) cursorFrame = requestAnimationFrame(followPointer);
}, { passive:true });
document.documentElement.addEventListener('pointerleave', () => ring.classList.remove('active'));
document.querySelectorAll('.quick-preview').forEach(details => {
  details.addEventListener('toggle', () => { if (!details.open) details.querySelector('video').pause(); });
});
