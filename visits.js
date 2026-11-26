(() => {
  const footer = document.querySelector('[data-visit-count]');
  const hosts = ['bam020205.github.io', 'abramseneca.vercel.app', 'bamportfolio-two.vercel.app', 'bamportfolio-1zg2.vercel.app'];
  if (!footer || !hosts.includes(location.hostname)) return;

  const lastPageKey = 'BamPortfolio:last-counted-page';
  const totalKey = 'BamPortfolio:last-visit-total';
  const sessionLength = 30 * 60 * 1000;

  function claimVisit() {
    const now = Date.now();
    try {
      const lastPage = Number(localStorage.getItem(lastPageKey));
      localStorage.setItem(lastPageKey, String(now));
      return !lastPage || now - lastPage >= sessionLength;
    } catch {
      // Storage is unavailable, so refreshing this page should only read the total.
      return false;
    }
  }

  function display(total, cached = false) {
    footer.textContent = total.toLocaleString('en-US') + (total === 1 ? ' visit' : ' visits') + ' across my sites';
    footer.title = cached ? 'Last available visit count' : 'Combined visits to this portfolio on GitHub Pages and Vercel';
    footer.hidden = false;
  }

  async function update() {
    const action = claimVisit() ? 'hit' : 'get';
    const url = 'https://abacus.jasoncameron.dev/' + action + '/bam020205-bamportfolio/visits';
    const response = await fetch(url, {
      cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer',
      keepalive: true, signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error('Visit count unavailable');
    const {value} = await response.json();
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid visit count');
    display(value);
    try { localStorage.setItem(totalKey, String(value)); } catch {}
  }

  async function start() {
    try {
      const saved = localStorage.getItem(totalKey);
      if (saved !== null && /^\d+$/.test(saved)) display(Number(saved), true);
    } catch {}
    try {
      // Serialize simultaneous tabs so both see the same session and latest count.
      if (navigator.locks) await navigator.locks.request(lastPageKey, update);
      else await update();
    } catch {
      if (footer.hidden) {
        footer.textContent = 'Visit count unavailable';
        footer.hidden = false;
      }
    }
  }

  function whenVisible() {
    if (document.visibilityState !== 'visible') return;
    document.removeEventListener('visibilitychange', whenVisible);
    start();
  }
  document.addEventListener('visibilitychange', whenVisible);
  whenVisible();
})();
