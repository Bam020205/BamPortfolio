import { escape as html, newest, portfolioSelection, portfolioViews } from './admin/editor/portfolio-views.mjs';
import { entries, journalPages } from './journal.mjs';
import { buildStoryCards } from './scripts/build-story-cards.mjs';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reactorBackdrop } from './reactor.mjs';
import { blurHeading } from './headings.mjs';
import { socialIcon } from './social-icons.mjs';

const name = 'Abram John R. Seneca';
await buildStoryCards(entries);
const records = JSON.parse(readFileSync(new URL('./content/portfolio.json', import.meta.url), 'utf8'));
const { settings, experiences } = records;
const projects = [...records.projects].sort(newest);
const { selected, community, slides } = portfolioSelection(projects, experiences);
const journalRoutes = new Set(journalPages.map(([route]) => route));
const email = html(settings.email);
const arrow = (direction = 'out') => `<svg class="arrow arrow-${direction}" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4 16 16 4M5 4h11v11"/></svg>`;
const socialLinks = (wallet = false) => settings.socials?.map(({label, url}) => {
  const icon = wallet ? socialIcon(label) : '';
  const content = wallet ? `${icon}<span>${html(label)}</span>` : `${html(label)} ${arrow()}`;
  return `<a class="${wallet ? 'wallet-social-link' : 'social-link'}" href="${html(url)}" target="_blank" rel="noopener noreferrer" aria-label="${html(label)} profile (opens in a new tab)">${content}</a>`;
}).join('') || '';
const nav = [['', 'Home'], ['about', 'About'], ['projects', 'Projects'], ['experience', 'Experience'], ['certifications', 'Certifications'], ['journal', 'Journal'], ['contact', 'Contact']];
const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/');
const pageUrl = (root, route = '') => `${root}${route ? `${route}/` : ''}index.html`;
const heading = (label, title, intro) => `
  <header class="page-head wrap">
    <p class="eyebrow kicker">${label}</p>
    ${blurHeading(title, { level: 1 })}
    <p class="lede entrance">${intro}</p>
  </header>`;

function views(root) {
  return portfolioViews({
    asset: path => root + encodePath(path.slice(1)),
    page: route => pageUrl(root, route),
    heading: (title, level, id) => blurHeading(title, {level, id}),
    arrow: arrow(),
    journalExists: slug => journalRoutes.has('journal/' + slug),
    projectExists: slug => projects.some(project => project.slug === slug),
  });
}

function rows(items) {
  return `<dl class="entries">${items.map(([tag, title, detail]) => `
    <div class="entry reveal"><dt><span class="eyebrow">${tag}</span><strong>${title}</strong></dt><dd>${detail}</dd></div>`).join('')}</dl>`;
}

const certs = JSON.parse(readFileSync(new URL('./certifications/records.json', import.meta.url), 'utf8'));
function credentials(root) {
  const known = ['DataCamp', 'Project Tuklas Teknolohiya', 'Zuitt', 'CyberPH'];
  const issuers = [...new Set([...known.filter(name => certs.some(cert => cert.issuer === name)), ...certs.map(cert => cert.issuer)])];
  const anchor = issuer => encodeURIComponent(issuer.toLowerCase().replaceAll(' ', '-'));
  const asset = path => html(root + encodePath(path.slice(1)));
  return `<div class="credential-index">
    <nav aria-label="Certificate issuers"><p class="eyebrow">Issuers</p>${issuers.map(issuer => `<a href="#${encodeURIComponent(anchor(issuer))}">${html(issuer)}</a>`).join('')}</nav>
    <div>${issuers.map(issuer => `<section class="issuer" id="${anchor(issuer)}">${blurHeading(issuer, { level: 2 })}<ul class="cert-list">${certs.filter(cert => cert.issuer === issuer).map(cert => {
      const src = asset(cert.file);
      const fullDate = cert.date.length === 10;
      const date = new Date((fullDate ? cert.date : cert.date + '-01') + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: fullDate ? 'numeric' : undefined, timeZone: 'UTC' });
      return `<li class="credential"><a class="cert-image" href="${src}" aria-label="View ${html(cert.title)} certificate"><img src="${asset(cert.thumbnail || cert.file)}" alt="" loading="lazy"></a>
        <div><p class="eyebrow">${date}</p>${blurHeading(cert.title)}<p>${html(cert.type)}</p>
        <a class="text-link" href="${src}">View certificate</a>${cert.verification ? ` <a class="text-link" href="${html(cert.verification)}">Verify with ${html(cert.issuer)}</a>` : ''}</div></li>`;
    }).join('')}</ul></section>`).join('')}</div></div>`;
}

const icons = {
  Journal: 'M3 4h18v16H3z M6 8h5v4H6z M14 8h4 M14 11h4 M6 15h12',
  Home: 'M3 11l9-8 9 8v10h-6v-7H9v7H3z',
  Overview: 'M3 3h8v12H3z M14 3h7v6h-7z M14 12h7v9h-7z M3 18h8v3H3z',
  About: 'M8 8a4 4 0 1 0 8 0 4 4 0 0 0-8 0 M4 21c0-8 16-8 16 0',
  Projects: 'M2 7h8l2 3h10v10H2z M3 7V4h7l2 3h8v3',
  Experience: 'M3 8h18v13H3z M8 8V4h8v4 M3 13q9 5 18 0',
  Certifications: 'M6 3h12v13H6z M8 16v6l4-3 4 3v-6 M9 7h6 M9 10h5',
  Contact: 'M2 5h20v14H2z M2 6l10 8L22 6',
};

const pages = [
  ...journalPages,
  ['', name, 'Open a portfolio card to explore Abram Seneca’s work, experience, and credentials.', (root) => {
    const sections = nav.filter(([path]) => path);
    return `<section class="wallet-landing" aria-labelledby="wallet-title">
      <header class="wallet-heading">
        <p class="eyebrow">Abram Seneca</p>
        ${blurHeading(settings.homeHeadline, { level: 1, id: 'wallet-title' })}
        <p class="wallet-intro">${html(settings.homeBio)}</p>
        ${settings.signature ? `<p class="wallet-signature">${html(settings.signature)}</p>` : ''}
        <a class="overview-link" href="${pageUrl(root,'overview')}">View portfolio overview ${arrow()}</a>
      </header>
      <div class="wallet-display"><nav class="wallet" aria-label="Portfolio sections" style="--cards:${sections.length}">
        ${sections.map(([path, label], index) => `<a class="wallet-card metal-${path}" href="${pageUrl(root, path)}" style="--i:${index}">
          <span class="wallet-tab"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[label]}"/></svg><span>${label}</span><span class="card-arrow">${arrow()}</span></span>
          <span class="card-engraving" aria-hidden="true">Abram Seneca</span>
        </a>`).join('')}
        <div class="wallet-pocket" aria-hidden="true"><i>as</i><div><strong>Abram Seneca</strong><span>Computer Science · CvSU</span></div></div>
      </nav></div>
    </section>`;
  }],
  ['overview', 'Portfolio overview', 'Computer Science student at Cavite State University. Explore selected robotics and software projects.', (root) => `
    <section class="portrait-stage">
      <div class="portrait-layout wrap">
        <p class="stage-meta eyebrow">${html(settings.discipline)} <span>/</span> ${html(settings.location)}</p>
        <button type="button" class="motion-toggle stage-motion" hidden>Pause motion</button>
        ${blurHeading('Abram Seneca', { level: 1, label: name })}
        <div class="portrait-layer"><svg viewBox="0 0 850 842" role="img" aria-label="Abram smiling and lifting his glasses">
          <defs><clipPath id="silhouette"><path d="M257 842 Q267 820 263 811 L281 681 Q297 548 274 462 Q197 439 179 397 Q151 348 230 289 L253 275 Q297 247 337 207 L346 167 Q348 154 385 151 Q399 152 404 162 L407 159 Q426 108 477 89 Q515 80 539 98 L543 115 Q597 120 594 180 Q601 204 572 231 Q571 266 555 281 L528 305 L520 330 Q529 341 532 361 Q534 374 583 393 L617 416 Q631 447 641 483 L636 536 L719 513 L728 520 L656 608 Q671 644 672 678 Q669 725 637 732 Q601 743 579 694 L561 715 L562 794 Q559 814 580 842 Z M300 337 Q319 306 343 265 L402 222 Q402 244 418 253 L421 305 Q402 299 403 320 L394 323 L392 330 L359 340 Q326 327 300 337 Z" clip-rule="evenodd"/></clipPath></defs>
          <image href="${root}media/portrait.jpg" width="850" height="842" clip-path="url(#silhouette)"/>
        </svg></div>
        <div class="stage-copy"><p>${html(settings.headline)}</p><a class="text-link" href="#fieldwork">Explore my work ${arrow('down')}</a></div>
        <a class="portrait-credit" href="${pageUrl(root,'about')}">About Abram</a>
      </div>
    </section>
    ${views(root).photoMarquee(slides)}
    <section id="fieldwork" class="intro-statement dark section" aria-label="Introduction">
      <div class="wrap reveal"><p class="eyebrow">${html(settings.focus)}</p><p>${html(settings.introduction)}</p></div>
    </section>
    ${selected.length ? `<section class="section wrap" id="selected" aria-labelledby="selected-title">
      ${blurHeading('Selected projects', { level: 2, id: 'selected-title' })}${views(root).projectGrid(selected, true)}
    </section>` : ''}
    ${views(root).communityFeature(community)}`],
  ['about', 'About', 'Education, interests, and skills.', (root) => `
    <header class="wrap about-head"><div><p class="eyebrow kicker">About</p>${blurHeading(['Abram John','R. Seneca'], { level: 1 })}<p class="lede">${html(settings.aboutHeadline)}</p></div>
      <figure class="bio-photo"><img src="${root}media/abram-about.webp" width="1040" height="1560" alt="Abram smiling in glasses and a striped shirt, holding a laptop" fetchpriority="high"></figure></header>
    <section class="light-section section">
      <div class="wrap bio">
      <div>
        ${blurHeading('Education', { level: 2 })}
        ${rows([['2026–2030 expected', 'Cavite State University · Indang (Main)', 'Bachelor of Science in Computer Science'], ['Senior high school', 'Cavite Science Integrated School–RSHS', '']])}
      </div><div>
        ${blurHeading('Interests & skills', { level: 2 })}
        ${settings.bio.map(paragraph => `<p>${html(paragraph)}</p>`).join('')}
      </div>
      </div>
    </section>`],
  ['projects', 'Projects', 'Selected projects and case studies.', (root) => `
    ${heading('Selected work', 'Projects', 'A collection of my projects, with notes on the ideas, tools, and work behind each one.')}
    <section class="section light-section" aria-label="Project index"><div class="wrap">${projects.length ? views(root).projectGrid(projects) : '<p>Projects will appear here.</p>'}</div></section>`],
  ...projects.map((project, index) => [`projects/${project.slug}`, project.title, project.intro,
    root => views(root).projectCase(project, projects.length > 1 ? projects[(index + 1) % projects.length] : null)]),
  ['experience', 'Experience', 'Student organizations, volunteering, training, and academic achievements.', (root) => `
    ${heading('Campus &amp; community', 'Experience', 'Student organizations, volunteering, and learning beyond the classroom.')}
    ${experiences.length ? views(root).experiencesPage(experiences) : '<p class="wrap section">Experience updates will appear here.</p>'}`],
  ['certifications', 'Certifications', 'Course accomplishments and certificates of attendance and participation.', (root) => `
    ${heading('Coursework &amp; participation', 'Certifications', 'Course accomplishments, workshop attendance, and event participation.')}
    <section class="section light-section" aria-label="Credentials"><div class="wrap">
      ${credentials(root)}
    </div></section>`],
  ['contact', 'Contact', 'Email, phone, and social profiles for Abram Seneca.', () => `
    <header class="page-head wrap">${blurHeading('Contact', { level: 1 })}<p class="lede entrance">${html(settings.location)}</p></header>
    <div class="light-section"><div class="wrap contact-grid section">
      <section aria-label="Contact details">
        <div class="contact-line">
          <p class="eyebrow">Email</p>
          <a class="email-link" href="mailto:${email}">${email}</a>
          <button class="copy-button" type="button" data-copy="${email}" hidden>Copy email</button>
          <span class="copy-status" role="status"></span>
        </div>
        ${settings.phone || settings.dial ? `<div class="contact-line"><p class="eyebrow">Phone</p>${settings.dial ? `<a href="tel:${html(settings.dial)}">${html(settings.phone || settings.dial)}</a>` : html(settings.phone)}</div>` : ''}
        ${settings.socials?.length ? `<div class="contact-line"><p class="eyebrow">Social profiles</p>${socialLinks()}</div>` : ''}
      </section>
      <section class="compose" hidden aria-labelledby="compose-title">
        ${blurHeading('Draft an email', { level: 2, id: 'compose-title' })}
        <form data-recipient="${email}">
          <label>Your name <input name="name" autocomplete="name" required></label>
          <label>Your email <input name="email" type="email" autocomplete="email" required></label>
          <label>Subject <input name="subject" required></label>
          <label>Message <textarea name="message" rows="4" required></textarea></label>
          <button class="button" type="submit">Open in email app</button>
        </form>
      </section>
    </div></div>`],
];

for (const [route, title, description, render, story] of pages) {
  const isJournal = route === 'journal' || route.startsWith('journal/');
  const project = projects.find(item => route === 'projects/' + item.slug);
  const share = story || project;
  const origin = 'https://abramseneca.vercel.app';
  // Journal excerpts already contain escaped text from the article renderer.
  const shareDescription = story?.excerpt ? story.excerpt.replaceAll('"', '&quot;') : html(description);
  const root = route ? '../'.repeat(route.split('/').length) : './';
  const navLinks = [nav[0], ['overview', 'Overview'], ...nav.slice(1)].map(([path, label]) => {
    const active = path === route || (path && route.startsWith(`${path}/`));
    const current = active ? ` aria-current="${path === route ? 'page' : 'location'}"` : '';
    return `<a href="${pageUrl(root, path)}"${current}><span class="app-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="${icons[label]}"/></svg></span>${label}</a>`;
  }).join('');
  const output = fileURLToPath(new URL(`./${route ? `${route}/` : ''}index.html`, import.meta.url));
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${html(description)}">
  <meta name="theme-color" content="#ffffff">${route === '' ? `
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://abramseneca.vercel.app/">
  <meta property="og:title" content="Abram Seneca | Portfolio">
  <meta property="og:description" content="Explore my projects, photography, and writing in Yohanan Times.">
  <meta property="og:image" content="https://abramseneca.vercel.app/media/yohanan-the-good-apple.png">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1734">
  <meta property="og:image:height" content="907">
  <meta property="og:image:alt" content="yohanan - the good apple beside a black wallet with a silver as monogram on a white studio background.">` : share ? `
  <meta property="og:type" content="${story ? 'article' : 'website'}">
  <meta property="og:title" content="${html(title)}">
  <meta property="og:description" content="${shareDescription}">
  <meta property="og:url" content="${origin}/${route}/">
  <meta property="og:image" content="${origin}${html(encodePath(share.cover))}">
  <meta property="og:image:alt" content="${html(share.alt)}">
  <meta name="twitter:card" content="summary_large_image">` : ''}
  <title>${route ? `${title.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')} | ${name}` : name}</title>
  <link rel="stylesheet" href="${root}site.css">
  <link rel="stylesheet" href="${root}headings.css">${route === '' ? `
  <link rel="stylesheet" href="${root}wallet.css">
  <link rel="stylesheet" href="${root}media/intro/intro.css">
  <script src="${root}media/intro/intro.js" defer></script>
  <script src="${root}wallet.js" defer></script>` : ''}${route === '' || route === 'about' ? `
  <link rel="preload" href="${root}media/fonts/jetbrains-mono-latin.woff2" as="font" type="font/woff2" crossorigin>` : ''}
  ${isJournal ? `<link rel="stylesheet" href="${root}journal.css">` : `<link rel="stylesheet" href="${root}reactor.css">`}
  ${story ? `<script src="${root}journal/share.js" defer></script>` : ''}<script src="${root}site.js" defer></script>
  <script src="${root}visits.js" defer></script>
</head>
<body id="top" class="${route === 'overview' ? 'front-page' : route ? 'interior' : 'wallet-page'}">${route === '' ? `
  <dialog class="name-intro" id="name-intro" aria-labelledby="intro-word" aria-describedby="intro-meaning">
    <canvas aria-hidden="true"></canvas>
    <h1 id="intro-word" tabindex="-1" autofocus>YOHANAN</h1>
    <p id="intro-meaning">Hebrew given name meaning “YHWH is gracious”</p>
    <button type="button" class="intro-enter" aria-label="Enter the portfolio">click anywhere</button>
    <button type="button" class="intro-motion" aria-label="Pause particles" title="Pause particles" hidden><span aria-hidden="true"></span></button>
  </dialog>` : ''}
  <a class="skip" href="#main">Skip to content</a>
  <header class="masthead wrap">
    <a class="brand" href="${pageUrl(root)}" aria-label="${name}, home">as</a>
    <nav class="desktop-nav" aria-label="Main navigation">${navLinks}</nav>
    <button class="menu-toggle" type="button" aria-haspopup="dialog" aria-controls="menu" aria-expanded="false" hidden>Menu <span aria-hidden="true">+</span></button>
  </header>
  <dialog id="menu" aria-label="Portfolio phone">
    <div class="phone-screen" data-view="lock">
      <div class="phone-wallpaper" aria-hidden="true"></div>
      <div class="phone-status"><span aria-hidden="true">Abram Seneca</span><i class="phone-island" aria-hidden="true"></i>
        <button type="button" class="phone-close" aria-label="Close phone" autofocus><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10m0-10L7 17"/></svg></button>
      </div>
      <div class="phone-lock">
        <div class="phone-wallpaper" aria-hidden="true"></div>
        <div class="phone-clock"><span class="phone-date"></span><time class="phone-time"></time></div>
        <div class="phone-actions">
          <button type="button" class="glass-key flashlight" aria-label="Dark phone theme" aria-pressed="false" title="Switch phone theme"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v3H7zM8 8h8l-2 4v8a2 2 0 0 1-4 0v-8z"/><circle cx="12" cy="15" r=".85"/></svg></button>
          <button type="button" class="glass-key camera" aria-label="Open camera preview" title="Open camera preview"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13" r="3.2"/></svg></button>
        </div>
      </div>
      <div class="phone-apps" hidden><h2>Portfolio</h2><nav aria-label="Portfolio apps">${navLinks}</nav></div>
      <button class="phone-home" type="button"><span>Open menu</span><i aria-hidden="true"></i></button>
      <button type="button" class="phone-memory" aria-label="Camera preview. Return to lock screen" hidden><img data-src="${root}media/phone-camera-preview.jpg" alt="Camera view of a sunset together on the boat" draggable="false"></button>
      <div class="phone-flash" aria-hidden="true"></div>
      <div class="phone-boot" hidden aria-hidden="true"><span>as</span><i></i></div>
    </div>
  </dialog>
  <div class="cursor-ring" aria-hidden="true"></div>
  <main id="main" tabindex="-1" class="${isJournal ? 'journal-main' : 'reactor-stage'} ${route === 'about' ? 'about-stage' : route ? 'reading-stage' : ''}">${isJournal ? '' : reactorBackdrop()}${render(root)}</main>
  <footer class="footer dark">
    <div class="wrap footer-inner">
      <div class="footer-id"><a class="footer-name" href="${pageUrl(root)}">${name}</a><p>${html(settings.footerRole)} · ${html(settings.location)}</p><p data-visit-count hidden></p></div>
      ${settings.socials?.length ? (route ? `<div><p class="eyebrow">Socials</p>${socialLinks()}</div>` : `<div class="wallet-socials"><p class="eyebrow">Socials</p><nav aria-label="Social profiles">${socialLinks(true)}</nav></div>`) : ''}
      <div><p class="eyebrow">Contact</p><a href="mailto:${email}">Email Abram ${arrow()}</a><a href="${pageUrl(root, 'contact')}">Contact details</a></div>
    </div>
    <div class="wrap footer-base"><span>© 2026 Abram Seneca</span><span>Built with HTML, CSS &amp; JavaScript</span><button class="motion-toggle" hidden type="button">Pause motion</button><a href="#top">Back to top ${arrow('up')}</a></div>
  </footer>
</body>
</html>
`.replace(/[\t ]+$/gm, ''));
}
