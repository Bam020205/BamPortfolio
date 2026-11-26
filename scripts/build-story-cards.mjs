import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const template = new URL('scripts/story-card.html', root);
const manifest = new URL('journal/story-card-hashes.json', root);

function shortExcerpt(value) {
  if (value.length <= 225) return value;
  const end = value.slice(0, 225).replace(/\s+\S*$/, '').trimEnd();
  return end.replace(/[.,;:!?]+$/, '') + '…';
}

async function renderCard(page, fields) {
  await page.goto(template.href);
  await page.evaluate(async ({ title, category, date, minutes, excerpt, cover }) => {
    const text = (selector, value) => { document.querySelector(selector).textContent = value; };
    text('#date', date);
    text('#duration', minutes + ' min read');
    text('.category', category);
    text('h1', title);
    const quote = document.querySelector('blockquote');
    quote.hidden = !excerpt;
    quote.textContent = /^[“"].*[”"]$/u.test(excerpt) ? excerpt : '“' + excerpt + '”';
    document.querySelector('.cover').src = cover;
    await Promise.all([...document.images].map(image => image.decode()));
    await document.fonts.ready;
    // Keep the lower part of the card available for the reader’s link sticker.
    const heading = document.querySelector('h1');
    const content = excerpt ? quote : document.querySelector('.byline');
    const fits = () => content.getBoundingClientRect().bottom <= 1660;
    for (let size = 117; !fits() && size >= 85; size -= 8) {
      heading.style.fontSize = size + 'px';
    }
    if (!fits()) {
      document.body.classList.add('compact');
      for (let size = 85; !fits() && size >= 55; size -= 6) {
        heading.style.fontSize = size + 'px';
      }
    }
  }, fields);
}

export async function buildStoryCards(entries) {
  const previous = existsSync(manifest) ? JSON.parse(readFileSync(manifest, 'utf8')) : {};
  const next = Object.create(null);
  const shared = createHash('sha256');
  for (const file of [template, import.meta.url, new URL('media/yohanan-times.svg', root)]) {
    shared.update(readFileSync(new URL(file), 'utf8').replaceAll('\r\n', '\n'));
  }
  for (const font of ['playfair', 'source-serif']) {
    shared.update(readFileSync(new URL('media/fonts/' + font + '.woff2', root)));
  }
  let browser;
  let page;
  try {
    for (const entry of entries) {
      const directory = new URL('journal/' + entry.slug + '/', root);
      const output = new URL('story.png', directory);
      const fields = {
        title: entry.title, category: entry.category, date: entry.dateLabel, minutes: entry.minutes,
        excerpt: shortExcerpt(entry.storyExcerpt), cover: entry.cover,
      };
      const cover = new URL(entry.cover.slice(1).split('/').map(encodeURIComponent).join('/'), root);
      const hash = shared.copy().update(JSON.stringify(fields)).update(readFileSync(cover)).digest('hex');
      next[entry.slug] = hash;
      if (hash === previous[entry.slug] && existsSync(output)) continue;
      if (!browser) {
        const { chromium } = await import('playwright-core');
        browser = await chromium.launch({channel: 'chrome'});
        page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
      }
      await renderCard(page, {...fields, cover: cover.href});
      mkdirSync(directory, { recursive: true });
      const temp = new URL('story.tmp.png', directory);
      await page.screenshot({ path: fileURLToPath(temp), animations: 'disabled' });
      renameSync(temp, output);
    }
  } finally {
    await browser?.close();
  }
  for (const slug of Object.keys(previous)) {
    if (!Object.hasOwn(next, slug) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      rmSync(new URL('journal/' + slug + '/story.png', root), { force: true });
    }
  }
  const json = JSON.stringify(next, null, 2) + '\n';
  if (JSON.stringify(previous) !== JSON.stringify(next) || !existsSync(manifest)) writeFileSync(manifest, json);
}
