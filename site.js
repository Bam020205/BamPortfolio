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
  const photos = ['Science project presentation','Group instant photo','Testing electronics','Working at a café','Camera research at a desk','Interview at an expo','Playing the drums','Handheld camera and microphone','Photo editing desk','Behind the drum kit','Portrait at the expo','Night drive','Coding on a laptop','Stage drum kit', photo.alt];
  let nextPhoto = 0;
  try { nextPhoto = Number(sessionStorage.getItem('phone-camera-next')) || 0; } catch {}
  if (!Number.isInteger(nextPhoto) || nextPhoto < 0 || nextPhoto >= photos.length) nextPhoto = 0;
  function preparePhoto() {
    const original = new URL(photo.dataset.src, document.baseURI);
    photo.src = nextPhoto === photos.length - 1 ? original : new URL('camera/' + (nextPhoto + 1) + '.jpg', original);
    photo.alt = photos[nextPhoto];
  }
  const flash = menu.querySelector('.phone-flash');
  const boot = menu.querySelector('.phone-boot');
  const clock = menu.querySelector('.phone-time');
  const date = menu.querySelector('.phone-date');
  const timeFormat = new Intl.DateTimeFormat(undefined, {hour:'numeric',minute:'2-digit'});
  const dateFormat = new Intl.DateTimeFormat(undefined, {weekday:'short',month:'short',day:'numeric'});
  let clockTimer, bootTimer, photoTimer;
  let preview = null;
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
  function trackPhoneInput(event) {
    if (event.type === 'keydown') delete menu.dataset.touch;
    else if (event.pointerType === 'touch') menu.dataset.touch = 'true';
    else delete menu.dataset.touch;
  }
  for (const control of [toggle, menu]) {
    control.addEventListener('pointerdown', trackPhoneInput, true);
    control.addEventListener('keydown', trackPhoneInput, true);
  }
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
    preparePhoto();
    syncClock();
    toggle.setAttribute('aria-expanded','true');
    if (animateBoot) bootTimer = setTimeout(finishBoot, 780);
  });
  light.addEventListener('click', () => {
    setTheme(screen.dataset.theme !== 'dark');
    try { localStorage.setItem('portfolio-phone-theme',screen.dataset.theme); } catch {}
  });
  const wallpaper = lock.querySelector('.phone-wallpaper');
  const clockFace = screen.querySelector('.phone-clock');
  const statusBar = screen.querySelector('.phone-status');
  const glyph = camera.querySelector('svg').cloneNode(true);
  glyph.classList.add('camera-morph-glyph');
  memory.append(glyph);

  function resetCamera(restoreFocus = true) {
    if (!preview) return;
    clearTimeout(photoTimer);
    for (const animation of preview.animations) animation.cancel();
    preview.flash?.cancel();
    preview = null;
    memory.hidden = true;
    if (menu.open) preparePhoto();
    lock.inert = home.inert = statusBar.inert = false;
    if (restoreFocus && menu.open) camera.focus({preventScroll:true});
  }

  async function dismissCamera() {
    const current = preview;
    if (!current || current.closing) return;
    current.closing = true;
    clearTimeout(photoTimer);
    current.flash?.cancel();
    if (moving() && current.animations.length) {
      for (const animation of current.animations) animation.reverse();
      await Promise.allSettled(current.animations.map(animation => animation.finished));
    }
    if (preview === current) resetCamera();
  }

  function animateCamera(current) {
    const button = camera.getBoundingClientRect();
    const display = screen.getBoundingClientRect();
    const percentX = px => (px / display.width * 100) + '%';
    const percentY = px => (px / display.height * 100) + '%';
    const origin = [
      percentY(button.top - display.top), percentX(display.right - button.right),
      percentY(display.bottom - button.bottom), percentX(button.left - display.left)
    ].join(' ');
    const animate = (element, frames, easing = 'linear') => {
      current.animations.push(element.animate(frames, {duration:440, easing, fill:'both'}));
    };
    const settle = 'cubic-bezier(.19,.87,.27,1)';
    animate(memory, [
      {inset:origin,borderRadius:'50%',backgroundColor:getComputedStyle(camera).backgroundColor},
      {inset:'0% 0% 0% 0%',borderRadius:getComputedStyle(screen).borderTopLeftRadius,backgroundColor:'#000'}
    ], settle);
    animate(glyph, [{opacity:1},{opacity:0,offset:.25},{opacity:0}]);
    animate(photo, [
      {opacity:0,transform:'scale(1.08)'},{opacity:0,offset:.20},
      {opacity:1,offset:.85},{opacity:1,transform:'scale(1)'}
    ]);
    for (const element of [wallpaper, clockFace]) {
      animate(element, [
        {transform:'scale(1)',filter:'brightness(1) blur(0px)'},
        {transform:'scale(.94)',filter:'brightness(.8) blur(2px)'}
      ], settle);
    }
  }

  camera.addEventListener('click', async () => {
    if (preview) return;
    const current = {animations:[], closing:false};
    preview = current;
    try {
      await photo.decode();
      if (preview !== current || !menu.open) return;
      lock.inert = home.inert = statusBar.inert = true;
      nextPhoto = (nextPhoto + 1) % photos.length;
      try { sessionStorage.setItem('phone-camera-next', String(nextPhoto)); } catch {}
      memory.hidden = false;
      memory.focus({preventScroll:true});
      if (moving()) {
        animateCamera(current);
        await current.animations[0].finished;
        if (preview !== current || current.closing) return;
        current.flash = flash.animate([{opacity:.9},{opacity:0}], {duration:130,easing:'ease-out'});
        await current.flash.finished;
      }
      if (preview === current && !current.closing) photoTimer = setTimeout(dismissCamera,1500);
    } catch {
      if (preview === current && !current.closing) resetCamera();
    }
  });
  memory.addEventListener('click', dismissCamera);
  menu.addEventListener('cancel', event => {
    if (!preview) return;
    event.preventDefault();
    dismissCamera();
  });
  // Scrub the same timeline with a finger, a mouse, or the Open menu button.
  const sheetEnd = .72;
  const duration = 560;
  const links = Array.from(apps.querySelectorAll('nav a'));
  let transition = null;
  let drag = null;
  let settleFrame = 0;
  let suppressClick = false;

  function clearTransition() {
    cancelAnimationFrame(settleFrame);
    if (transition) {
      for (const effect of transition.effects) effect.cancel();
      transition = null;
    }
    delete screen.dataset.unlocking;
    apps.inert = false;
    lock.inert = false;
  }

  function beginTransition(edgeReturn = false) {
    if (transition) return;
    const fromApps = screen.dataset.view === 'apps';
    const height = screen.clientHeight;
    transition = {progress:fromApps ? 1 : 0, effects:[]};
    lock.hidden = apps.hidden = false;
    apps.inert = lock.inert = true;
    screen.dataset.unlocking = '';
    function track(element, frames) {
      const effect = element.animate(frames, {duration, fill:'both'});
      effect.pause();
      transition.effects.push(effect);
    }
    if (edgeReturn) {
      track(lock, [{transform:'translateX(0)'}, {transform:'translateX(-101%)'}]);
      track(apps, [{transform:'translateX(35%)'}, {transform:'translateX(0)'}]);
      scrub(1);
      return;
    }
    track(lock, [
      {transform:'translateY(0)'}, {offset:sheetEnd, transform:'translateY(-101%)'},
      {transform:'translateY(-101%)'}
    ]);
    track(home, [
      {translate:'0 0',opacity:1}, {offset:sheetEnd,translate:'0 -' + height + 'px',opacity:0},
      {offset:.73,translate:'0 8px',opacity:0}, {translate:'0 0',opacity:1}
    ]);
    track(screen.querySelector(':scope > .phone-wallpaper'), [
      {filter:'brightness(.68)',opacity:1}, {offset:.55,filter:'brightness(.76) blur(2px)',opacity:1},
      {filter:'brightness(1) blur(0)',opacity:.44}
    ]);
    track(apps.querySelector('nav'), [
      {transform:'scale(1.95)'}, {offset:.60,transform:'scale(1.95)',easing:'cubic-bezier(.15,.75,.25,1)'},
      {transform:'scale(1)'}
    ]);
    track(apps.querySelector('h2'), [{opacity:0},{offset:.72,opacity:0},{opacity:1}]);
    links.forEach((link,index) => {
      const start = .59 + (index % 3) * .012 + Math.floor(index / 3) * .02;
      track(link, [
        {opacity:0,transform:'scale(1.12)'}, {offset:start,opacity:0},
        {offset:start+.14,opacity:1}, {opacity:1,transform:'scale(1)'}
      ]);
    });
    scrub(transition.progress);
  }

  function scrub(progress) {
    transition.progress = Math.max(0, Math.min(1, progress));
    for (const effect of transition.effects) effect.currentTime = transition.progress * duration;
    const label = transition.progress > sheetEnd ? 'Lock screen' : 'Open menu';
    if (home.firstElementChild.textContent !== label) home.firstElementChild.textContent = label;
  }

  function settle(open) {
    cancelAnimationFrame(settleFrame);
    const finish = () => {
      clearTransition();
      showApps(open);
    };
    if (!moving()) { finish(); return; }
    beginTransition();
    const start = transition.progress;
    const target = open ? 1 : 0;
    const time = Math.max(130, duration * Math.abs(target - start));
    const began = performance.now();
    function tick(now) {
      const fraction = Math.min(1, (now - began) / time);
      scrub(start + (target - start) * (1 - (1 - fraction) ** 2));
      if (fraction < 1) settleFrame = requestAnimationFrame(tick);
      else finish();
    }
    settleFrame = requestAnimationFrame(tick);
  }

  home.addEventListener('click', () => {
    if (!preview && !transition) settle(screen.dataset.view === 'lock');
  });
  screen.addEventListener('click', event => {
    if (event.detail && suppressClick) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
  screen.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    if (!boot.hidden || preview || transition) return;
    if (screen.dataset.view === 'apps') {
      const bounds = screen.getBoundingClientRect();
      if (event.clientX - bounds.left <= 26 && !event.target.closest('button,a')) {
        drag = {edge:true, id:event.pointerId, x:event.clientX, y:event.clientY, width:bounds.width, moved:false};
      }
      return;
    }
    const control = event.target.closest('button, a');
    if (control && control !== home) return;
    drag = {id:event.pointerId, x:event.clientX, y:event.clientY, moved:false,
      height:screen.clientHeight, lastY:event.clientY, lastTime:event.timeStamp, velocity:0};
  });
  screen.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    if (!event.buttons) { endDrag(event,true); return; }
    if (drag.edge) {
      const dx = event.clientX - drag.x;
      if (!drag.moved) {
        if (Math.max(Math.abs(dx), Math.abs(event.clientY - drag.y)) < 6) return;
        if (dx <= Math.abs(event.clientY - drag.y)) { drag = null; return; }
        drag.moved = true;
        screen.setPointerCapture(event.pointerId);
      }
      if (moving()) {
        beginTransition(true);
        scrub(1 - dx / drag.width);
      }
      return;
    }
    const lift = drag.y - event.clientY;
    if (!drag.moved) {
      if (Math.abs(lift) < 5 || Math.abs(lift) < Math.abs(event.clientX - drag.x)) return;
      drag.moved = true;
      screen.setPointerCapture(event.pointerId);
    }
    drag.velocity = (drag.lastY - event.clientY) / Math.max(1,event.timeStamp - drag.lastTime);
    drag.lastY = event.clientY;
    drag.lastTime = event.timeStamp;
    if (moving() && (lift > 0 || transition)) {
      beginTransition();
      scrub(sheetEnd * lift / drag.height);
    }
  });
  function endDrag(event, cancelled) {
    if (!drag || drag.id !== event.pointerId) return;
    const gesture = drag;
    drag = null;
    if (!gesture.moved) return;
    suppressClick = true;
    if (screen.hasPointerCapture(event.pointerId)) screen.releasePointerCapture(event.pointerId);
    if (gesture.edge) {
      const complete = !cancelled && event.clientX - gesture.x >= Math.min(72, gesture.width * .22);
      if (transition || complete) settle(!complete);
      return;
    }
    const lift = gesture.y - event.clientY;
    if (!cancelled && lift < -70) { closePhone(); return; }
    const flick = lift > 24 && gesture.velocity > .42 && event.timeStamp - gesture.lastTime < 110;
    const open = !cancelled && (lift > Math.min(115, gesture.height * .25) || flick);
    if (open || transition) settle(open);
  }
  screen.addEventListener('pointerup', event => endDrag(event,false));
  screen.addEventListener('pointercancel', event => endDrag(event,true));
  screen.addEventListener('lostpointercapture', event => {
    if (event.target === screen) endDrag(event,true);
  });
  menu.querySelector('.phone-close').addEventListener('click',closePhone);
  menu.addEventListener('click', event => {
    if (event.target !== menu) return;
    const bounds = menu.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closePhone();
  });
  let touchStart;
  screen.addEventListener('touchstart', event => {
    touchStart = preview && event.touches.length === 1 ? event.touches[0] : null;
  }, {passive:true});
  screen.addEventListener('touchend', event => {
    if (!touchStart || !boot.hidden || !apps.hidden) return;
    const end = event.changedTouches[0];
    const dy = end.clientY - touchStart.clientY;
    if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(end.clientX - touchStart.clientX)) {
      if (preview && dy > 0) dismissCamera();
    }
    touchStart = null;
  }, {passive:true});
  document.addEventListener('visibilitychange', () => { if (!document.hidden && menu.open) syncClock(); });
  menu.addEventListener('close', () => {
    drag = null;
    suppressClick = false;
    clearTransition();
    resetCamera(false);
    clearTimeout(clockTimer);
    clearTimeout(bootTimer);
    finishBoot();
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
