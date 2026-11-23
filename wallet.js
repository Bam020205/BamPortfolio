const wallet = document.querySelector('.wallet');
const overviewLink = document.querySelector('.overview-link');

// Preserve bookmarks into the original homepage after moving it to Overview.
if (['#fieldwork', '#selected', '#home-event', '#selected-title'].includes(location.hash)) {
  location.replace(overviewLink.href + location.hash);
}

let extraction;
function resetWallet() {
  if (!extraction) return;
  extraction.cancel();
  extraction = null;
  wallet.querySelector('.is-leaving')?.classList.remove('is-leaving');
}

wallet.addEventListener('click', event => {
  const card = event.target.closest('.wallet-card');
  if (!card || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
      event.shiftKey || event.altKey || !card.animate ||
      document.body.classList.contains('motion-off') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  event.preventDefault();
  resetWallet();
  const initial = getComputedStyle(card).transform;
  card.classList.add('is-leaving');
  const lift = Math.max(24, card.offsetTop - 8);
  extraction = card.animate([
    { transform: initial },
    { transform: 'translateY(-' + lift + 'px) scale(1.025)', offset: .78 },
    { transform: 'translateY(-' + (lift - 3) + 'px) scale(1.02)' }
  ], { duration: 500, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
  extraction.onfinish = () => location.assign(card.href);
});

window.addEventListener('pagehide', resetWallet);
window.addEventListener('pageshow', resetWallet);
