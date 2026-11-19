const menu = document.querySelector('#menu');
const toggle = document.querySelector('.menu-toggle');

if (typeof menu.showModal === 'function') {
  const compact = matchMedia('(max-width: 850px)');
  toggle.hidden = false;
  document.documentElement.classList.add('has-menu');
  toggle.addEventListener('click', () => {
    menu.showModal();
    toggle.setAttribute('aria-expanded', 'true');
  });
  menu.querySelector('.menu-close').addEventListener('click', () => menu.close());
  menu.addEventListener('close', () => toggle.setAttribute('aria-expanded', 'false'));
  compact.addEventListener('change', () => {
    if (!compact.matches && menu.open) menu.close();
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
