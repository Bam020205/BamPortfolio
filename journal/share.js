const opener = document.querySelector('#open-share');
const dialog = document.querySelector('#article-share-dialog');

if (opener && dialog && typeof dialog.showModal === 'function') {
  const url = document.querySelector('meta[property="og:url"]').content;
  const title = document.querySelector('.reading h1').textContent;
  const preview = dialog.querySelector('.share-preview');
  const save = dialog.querySelector('.share-save');
  const fileButton = dialog.querySelector('[data-share-file]');
  const linkButton = dialog.querySelector('[data-share-link]');
  const status = dialog.querySelector('[role="status"]');
  const manualLink = dialog.querySelector('input');
  let storyFile;
  let preparing = false;

  opener.setAttribute('aria-haspopup', 'dialog');
  opener.setAttribute('aria-controls', dialog.id);
  linkButton.hidden = typeof navigator.share !== 'function';
  manualLink.value = url;

  async function prepareFile() {
    if (preparing || storyFile || !navigator.canShare || !navigator.share) return;
    preparing = true;
    try {
      const response = await fetch(save.href);
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/png')) return;
      const candidate = new File([await response.blob()], save.download, { type: 'image/png' });
      if (navigator.canShare({ files: [candidate] })) {
        storyFile = candidate;
        fileButton.hidden = false;
      }
    } catch {
      // Saving the PNG directly is available even without native file sharing.
    } finally {
      preparing = false;
    }
  }

  opener.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    status.textContent = '';
    manualLink.hidden = true;
    if (!preview.hasAttribute('src')) preview.src = preview.dataset.src;
    dialog.showModal();
    prepareFile();
  });

  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => opener.focus({ preventScroll: true }));

  async function share(payload, fallback) {
    status.textContent = '';
    try {
      await navigator.share(payload);
    } catch (error) {
      if (error.name !== 'AbortError') status.textContent = fallback;
    }
  }
  fileButton.addEventListener('click', () => {
    if (storyFile) share({ files: [storyFile] }, 'Use Save Story image to download the card.');
  });
  linkButton.addEventListener('click', () => share({ title, url }, 'Use Copy article link to share the URL.'));
  dialog.querySelector('[data-copy-link]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      manualLink.hidden = true;
      status.textContent = 'Article link copied.';
    } catch {
      manualLink.hidden = false;
      manualLink.focus();
      manualLink.select();
      status.textContent = 'Select and copy the article link.';
    }
  });
}
