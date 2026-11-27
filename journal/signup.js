// Load MailerLite's form (including validation and confirmation) near the footer.
function loadSignup() {
  window.ml = window.ml || function () { (window.ml.q ||= []).push(arguments); };
  window.ml('account', '2828234');
  const script = document.createElement('script');
  script.src = 'https://assets.mailerlite.com/js/universal.js';
  script.async = true;
  document.head.append(script);
}
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      observer.disconnect();
      loadSignup();
    }
  }, {rootMargin: '500px'});
  observer.observe(document.querySelector('.journal-signup'));
} else {
  loadSignup();
}
