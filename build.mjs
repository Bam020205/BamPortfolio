import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const name = 'Abram John R. Seneca';
const email = 'AbramSeneca2.0@gmail.com';
const nav = [['', 'Home'], ['about', 'About'], ['projects', 'Projects'], ['experience', 'Experience'], ['certifications', 'Certifications'], ['contact', 'Contact']];
const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/');
const pageUrl = (root, route = '') => `${root}${route ? `${route}/` : ''}index.html`;
const heading = (label, title, intro) => `
  <header class="page-head wrap">
    <p class="eyebrow kicker">${label}</p>
    <h1 class="entrance">${title}</h1>
    <p class="lede entrance">${intro}</p>
  </header>`;

const projects = [
  {
    slug: 'determinator', title: 'DeTerminator', category: 'Robotics research',
    intro: 'An Arduino-based rover that explores carbon dioxide and humidity as possible indicators of termite activity.',
    cover: 'terry-assembly.webp', alt: 'Hands connecting wiring inside the DeTerminator rover beside its blue display',
    video: 'determinator-original.mp4', videoTitle: 'Science fair presentation',
    preview: 'rover-demo.mp4',
    fullVideoUrl: 'https://drive.google.com/file/d/1tQ78QHXYtkHzy3e_hV68IHwHDJrSgSiy/view?usp=drivesdk',
    details: [
      ['The build', 'I programmed, integrated the hardware, and built the rover, named Terry. It collects environmental readings from sites where termite activity is suspected.'],
      ['The science fair', 'DeTerminator earned fourth place in the individual Robotics and Intelligent Machines category at the 2025 Division Science and Technology Fair in Bulihan, Silang, Cavite.'],
    ],
    tools: 'Arduino · C++ · Environmental sensors',
    transcript: 'The original presentation introduces Terry, shows the rover and its assembly, and explains the research and results. The recording includes on-screen captions.',
  },
  {
    slug: 'inventory', title: 'Shop Inventory Manager', category: 'Desktop application',
    intro: 'A Java Swing inventory system designed around the everyday needs of a sari-sari store.',
    cover: 'inventory-window.webp', poster: 'inventory.jpg', alt: 'The Shop Inventory Manager product form and stock table in the original screen recording',
    video: 'inventory.mp4', videoTitle: 'Application walkthrough',
    details: [
      ['The idea', 'Helping my mother at a canteen inspired me to build a simple tool for tracking products, prices, and stock. I left supplier and item code fields out of the product form.'],
      ['The build', 'I built the desktop interface with Java Swing and used SQLite with DBeaver. A Project Tuklas Teknolohiya workshop on connecting Java to a database helped me apply the approach to this project.'],
    ],
    tools: 'Java Swing · SQLite · DBeaver',
    transcript: 'The recording shows the desktop product form and inventory table, including controls for adding and updating products and searching the stock list.',
  },
];

function projectList(root) {
  return `<div class="work-grid">${projects.map((project) => `
    <article class="work work-${project.slug} reveal">
      <a href="${pageUrl(root, `projects/${project.slug}`)}">
        <div class="work-image"><img src="${root}media/${project.cover}" width="1280" height="720" loading="lazy" alt="${project.alt}"></div>
        <div class="work-label"><span class="eyebrow">${project.category}</span></div>
        <h2>${project.title}</h2>
        <p>${project.intro}</p>
        <span class="work-tools">${project.tools}</span>
        <span class="text-link">View project</span>
      </a>
      <details class="quick-preview"><summary>Preview demonstration</summary><video controls playsinline preload="none" poster="${root}media/${project.cover}" aria-label="${project.videoTitle}"><source src="${root}media/${project.preview ?? project.video}" type="video/mp4"></video></details>
    </article>`).join('')}</div>`;
}

function rows(items) {
  return `<dl class="entries">${items.map(([tag, title, detail]) => `
    <div class="entry reveal"><dt><span class="eyebrow">${tag}</span><strong>${title}</strong></dt><dd>${detail}</dd></div>`).join('')}</dl>`;
}

function projectVideo(root, project) {
  const videoPath = `${root}media/${project.video}`;
  const videoLink = project.fullVideoUrl ?? videoPath;
  const linkLabel = project.fullVideoUrl ? 'Watch the full video on Google Drive' : 'Open video';
  return `<figure class="film reveal">
    <video controls playsinline preload="none" width="1280" height="720" poster="${root}media/${project.poster ?? project.cover}" aria-label="${project.videoTitle}"${project.preview ? ` data-local-original="${videoPath}"` : ''}>
      <source src="${project.preview ? root + 'media/' + project.preview : videoPath}" type="video/mp4">
    </video>
    <figcaption><span${project.preview ? ' data-video-label' : ''}>${project.preview ? 'Science fair preview · 14 seconds' : project.videoTitle}</span> <a class="text-link" href="${videoLink}">${linkLabel}</a></figcaption>
  </figure>`;
}

const certs = [
  ['Introduction to Git', 'DataCamp', 'Oct 27, 2026', 'Statement of Accomplishment', 'Introduction to Git - DataCamp.png', 'a72439ba58bacfe98139735033e3a0d2277f347f'],
  ['Introduction to Java', 'DataCamp', 'Oct 2026', 'Statement of Accomplishment', 'Introduction to Java - DataCamp.png', 'd7539cb2d500b06ca0e4951b307a67c7e36fbc05'],
  ['Intermediate Java', 'DataCamp', 'Oct 18, 2026', 'Statement of Accomplishment', 'Intermediate Java - DataCamp.png', 'f50372de5d469cd20af304d108d699541bd97de9'],
  ['Introduction to Object-Oriented Programming in Java', 'DataCamp', 'Oct 21, 2026', 'Statement of Accomplishment', 'Introduction to Object-Oriented Programming in Java - DataCamp.png', '33c6444b9933f51c07cb60959c070b3d3b35ebc5'],
  ['C++ Programming Part 3', 'Project Tuklas Teknolohiya', 'Nov 10, 2026', 'Attendance', 'C++ Programming Part 3 - Tuklas.png'],
  ['Java Programming Part 3 (Connecting to Database)', 'Project Tuklas Teknolohiya', 'Nov 9, 2026', 'Attendance', 'Java Programming Part 3 (Connecting to Database) - Tuklas.png'],
  ['Basic SQL and Database Management', 'Project Tuklas Teknolohiya', 'Sep 26, 2026', 'Attendance', 'Basic SQL and Database Management - Tuklas.png'],
  ['Basic Web Development (HTML & CSS)', 'Zuitt', 'Sep 2026', 'Participation', 'Basic Web Development (HTML & CSS) - Zuitt.png'],
  ['Packet Capture: Beneath the Network CTF', 'CyberPH', 'Oct 26, 2026', 'Participation', 'Packet Capture Beneath the Network CTF - CyberPH.png'],
];

function credentials(root) {
  const issuers = [...new Set(certs.map(([, issuer]) => issuer))];
  const anchor = (issuer) => issuer.toLowerCase().replaceAll(' ', '-');
  return `<div class="credential-index">
    <nav aria-label="Certificate issuers"><p class="eyebrow">Issuers</p>${issuers.map(issuer => `<a href="#${anchor(issuer)}">${issuer}</a>`).join('')}</nav>
    <div>${issuers.map(issuer => `<section class="issuer" id="${anchor(issuer)}"><h2>${issuer}</h2><ul class="cert-list">${certs.filter(cert => cert[1] === issuer).map(([title, , date, type, image, id]) => {
      const src = `${root}media/credentials/${encodePath(image)}`;
      const label = title.replaceAll('&', '&amp;');
      return `<li class="credential"><a class="cert-image" href="${src}" aria-label="View ${label} certificate"><img src="${src}" alt="" loading="lazy"></a>
        <div><p class="eyebrow">${date}</p><h3>${label}</h3><p>${type}</p>
        <a class="text-link" href="${src}">View certificate</a>${id ? ` <a class="text-link" href="https://www.datacamp.com/completed/statement-of-accomplishment/course/${id}">Verify with DataCamp</a>` : ''}</div></li>`;
    }).join('')}</ul></section>`).join('')}</div></div>`;
}

function ribbon(label, reverse = false) {
  const phrase = Array(5).fill(label).join('　 /　 ') + '　 /　 ';
  return `<div class="ribbon${reverse ? ' reverse' : ''}" aria-hidden="true"><div><span>${phrase}</span><span>${phrase}</span></div></div>`;
}

const icons = {
  Home: 'M3 11l9-8 9 8v10h-6v-7H9v7H3z',
  About: 'M8 8a4 4 0 1 0 8 0 4 4 0 0 0-8 0 M4 21c0-8 16-8 16 0',
  Projects: 'M2 7h8l2 3h10v10H2z M3 7V4h7l2 3h8v3',
  Experience: 'M3 8h18v13H3z M8 8V4h8v4 M3 13q9 5 18 0',
  Certifications: 'M6 3h12v13H6z M8 16v6l4-3 4 3v-6 M9 7h6 M9 10h5',
  Contact: 'M2 5h20v14H2z M2 6l10 8L22 6',
};

const pages = [
  ['', name, 'Computer Science student at Cavite State University. Explore selected robotics and software projects.', (root) => `
    <section class="portrait-stage">
      <div class="portrait-layout wrap">
        <p class="stage-meta">Computer Science <span>/</span> Tanza, Cavite</p>
        <button type="button" class="motion-toggle" hidden>Pause motion</button>
        <h1 aria-label="${name}">Abram <em>Seneca</em></h1>
        <div class="portrait-layer"><svg viewBox="0 0 850 842" role="img" aria-label="Abram smiling and lifting his glasses">
          <defs><clipPath id="silhouette"><path d="M257 842 Q267 820 263 811 L281 681 Q297 548 274 462 Q197 439 179 397 Q151 348 230 289 L253 275 Q297 247 337 207 L346 167 Q348 154 385 151 Q399 152 404 162 L407 159 Q426 108 477 89 Q515 80 539 98 L543 115 Q597 120 594 180 Q601 204 572 231 Q571 266 555 281 L528 305 L520 330 Q529 341 532 361 Q534 374 583 393 L617 416 Q631 447 641 483 L636 536 L719 513 L728 520 L656 608 Q671 644 672 678 Q669 725 637 732 Q601 743 579 694 L561 715 L562 794 Q559 814 580 842 Z M300 337 Q319 306 343 265 L402 222 Q402 244 418 253 L421 305 Q402 299 403 320 L394 323 L392 330 L359 340 Q326 327 300 337 Z" clip-rule="evenodd"/></clipPath></defs>
          <image href="${root}media/portrait.jpg" width="850" height="842" clip-path="url(#silhouette)"/>
        </svg></div>
        <span class="foreground-type" aria-hidden="true">Seneca</span>
        <div class="stage-copy"><p class="eyebrow">Robotics &amp; software</p><p>I study Computer Science at Cavite State University and build robots and desktop applications.</p><a class="stage-link" href="#fieldwork">Explore my work <span aria-hidden="true">↓</span></a></div>
        <a class="portrait-credit" href="${pageUrl(root,'about')}">About Abram</a>
      </div>
    </section>
    ${ribbon('Robotics　 /　 Software development')}
    <section id="fieldwork" class="section wrap feature community">
      <a class="project-still" href="${pageUrl(root,'projects/determinator')}"><img src="${root}media/terry-assembly.webp" alt="${projects[0].alt}" loading="lazy"></a>
      <div class="feature-copy reveal"><p class="eyebrow kicker">Robotics research</p><h2><em>DeTerminator</em></h2><p>I built and programmed Terry, an Arduino rover for investigating termite activity.</p><a class="text-link" href="${pageUrl(root,'projects/determinator')}">Explore DeTerminator</a></div>
    </section>
    <section class="section light-section" id="selected" aria-labelledby="selected-title">
      <div class="wrap feature">
        <div class="feature-copy reveal"><p class="eyebrow kicker">Desktop application</p><h2 id="selected-title">Shop Inventory <em>Manager</em></h2>
        <p>Helping my mother at a canteen gave me the idea for a desktop app to track products, prices, and stock in a sari-sari store.</p>
        <p class="work-tools">${projects[1].tools}</p><a class="text-link" href="${pageUrl(root, 'projects/inventory')}">Explore the application</a></div>
        <a class="software-plate reveal" href="${pageUrl(root, 'projects/inventory')}" aria-label="View Shop Inventory Manager"><img src="${root}media/${projects[1].cover}" width="742" height="430" alt="${projects[1].alt}" loading="lazy"></a>
      </div>
    </section>
    ${ribbon('Photography　 /　 Campus life', true)}
    <section class="section wrap feature community" aria-labelledby="home-event">
      <figure class="reveal"><img src="${root}media/hacktoberfest/workshop.webp" width="1600" height="900" alt="Hacktoberfest participants working together at laptops" loading="lazy"></figure>
      <div class="feature-copy reveal"><p class="eyebrow kicker">Volunteer photography · 2026</p><h2 id="home-event">At <em>Hacktoberfest</em></h2>
      <p>I photographed Hacktoberfest with AWS Student Builder Group–Tempest at National University–Las Piñas.</p>
      <a class="text-link" href="${pageUrl(root, 'experience')}#volunteering">View the photographs</a></div>
    </section>`],
  ['about', 'About', 'Education, interests, and skills.', (root) => `
    <header class="wrap about-head"><div><p class="eyebrow kicker">About</p><h1>Abram John<br><em>R. Seneca</em></h1><p class="lede">Computer Science student at Cavite State University.</p></div>
      <figure class="bio-photo"><img src="${root}media/portrait.jpg" alt="Portrait of Abram Seneca" fetchpriority="high"></figure></header>
    <section class="light-section section">
      <div class="wrap bio">
      <div>
        <h2>Education</h2>
        ${rows([['2026–2030 expected', 'Cavite State University · Indang (Main)', 'Bachelor of Science in Computer Science'], ['Senior high school', 'Cavite Science Integrated School–RSHS', '']])}
      </div><div>
        <h2>Interests &amp; skills</h2>
        <p>I’m interested in software development, robotics, databases, and cybersecurity. My goal is to become a software engineer and build a stronger foundation in data and technology.</p>
        <p>I have basic knowledge of Java and Python, and hands-on experience with SQL and database management, Arduino programming, and robotics hardware.</p>
      </div>
      </div>
    </section>`],
  ['projects', 'Projects', 'Robotics research and desktop software projects.', (root) => `
    ${heading('Selected work', 'Projects', 'An individual robotics research project and a desktop inventory application.')}
    <section class="section light-section" aria-label="Project index"><div class="wrap">${projectList(root)}</div></section>`],
  ...projects.map((project, index) => [`projects/${project.slug}`, project.title, project.intro, (root) => `
    <div class="case-opening case-${project.slug}"><div class="wrap">
      <a class="text-link breadcrumb" href="${pageUrl(root, 'projects')}">All projects</a>
      <div class="case-heading"><div><p class="eyebrow kicker">${project.category}</p><h1>${project.title}</h1></div><p class="lede">${project.intro}</p></div>
      <div class="film-section">${projectVideo(root, project)}</div>
    </div></div>
    <div class="light-section">
      <div class="wrap case-notes">
        <p class="eyebrow">${project.tools}</p>
        <div>${project.details.map(([title, detail]) => `<section class="reveal"><h2>${title}</h2><p>${detail}</p></section>`).join('')}
          <details><summary>Video description</summary><p>${project.transcript}</p></details>
          ${index === 0 ? `<p><a class="text-link" href="${root}media/fair.jpg">View recognition certificate</a></p>` : ''}
        </div>
      </div>
    </div>
    <nav class="wrap section" aria-label="Project navigation"><p class="next-project"><a href="${pageUrl(root, `projects/${projects[1 - index].slug}`)}"><span class="eyebrow">Next project</span><strong>${projects[1 - index].title}</strong></a></p></nav>`]),
  ['experience', 'Experience', 'Student organizations, volunteering, training, and academic achievements.', (root) => `
    ${heading('Campus &amp; community', 'Experience', 'Student organizations, volunteering, and learning beyond the classroom.')}
      <section class="wrap section" aria-labelledby="organizations">
        <h2 id="organizations">Student organizations</h2>
        ${rows([
          ['Since Aug 2026', 'AWS Student Builder Group–Spade', 'Relations &amp; Communications Office · ACE'],
          ['Since Oct 2026', 'Computer Science Student Organization (CSSO)', 'Committee on Records and Documentation (COMRECS) · Member and photographer'],
          ['Since Oct 2026', 'Microsoft Student Community Philippines', 'Member'],
        ])}
      </section>
      <section class="section light-section" aria-labelledby="volunteering">
        <div class="wrap">
        <h2 id="volunteering">Volunteering</h2>
        ${rows([['2026', 'Hacktoberfest', 'Volunteer photographer with AWS Student Builder Group–Tempest at National University–Las Piñas.']])}
        <div class="event-photos reveal">
          <img src="${root}media/hacktoberfest/workshop.webp" width="1600" height="900" alt="Hacktoberfest attendees working at laptops" loading="lazy">
          <img src="${root}media/hacktoberfest/abram-laptop.webp" width="1800" height="1200" alt="Abram holding a laptop beside the Hacktoberfest 2026 welcome screen" loading="lazy">
        </div>
        <details class="event-gallery">
          <summary>More Hacktoberfest photos</summary>
          <div class="event-gallery-grid">
            ${[
              ['speaker', 'A Hacktoberfest speaker holding a microphone', 675],
              ['audience', 'Attendees watching a speaker at Hacktoberfest', 675],
              ['lanyards', 'Blue event lanyards laid out on a table', 675],
              ['session', 'A seated Hacktoberfest audience', 675],
              ['participants', 'Participants standing together at the event', 675],
              ['abram-welcome', 'Abram standing beside the Hacktoberfest welcome screen', 800],
            ].map(([file, alt, height]) => `<img src="${root}media/hacktoberfest/${file}.webp" width="1200" height="${height}" alt="${alt}" loading="lazy">`).join('')}
          </div>
        </details>
        </div>
      </section>
      <section class="wrap section" aria-labelledby="learning">
        <h2 id="learning">Training &amp; events</h2>
        ${rows([
          ['Oct 18–25, 2026', 'Packet Capture: Beneath the Network CTF', 'Team participant with SINT-O SINT-O in the CyberPH competition.'],
          ['2026', 'Data Engineering Pilipinas × DataCamp Scholarship', 'Accepted into the scholarship program.'],
          ['2026', 'Project Tuklas Teknolohiya workshops', 'Attended sessions on Java database connectivity, C++ programming, and SQL and database management.'],
        ])}
      </section>
      <section class="section light-section" aria-labelledby="awards">
        <div class="wrap">
        <h2 id="awards">Academic achievements</h2>
        ${rows([
          ['Nov 16, 2025', 'Silver Award · 2nd National Linguistics Challenge', `Represented Cavite Science Integrated School–RSHS in Grade 12. <a class="text-link" href="${root}media/nlc.png">View award</a>`],
          ['Oct 2025', 'Fourth place · Division Science and Technology Fair', `Robotics and Intelligent Machines, individual category. <a class="text-link" href="${pageUrl(root, 'projects/determinator')}">View DeTerminator</a>`],
        ])}
        </div>
      </section>`],
  ['certifications', 'Certifications', 'Course accomplishments and certificates of attendance and participation.', (root) => `
    ${heading('Coursework &amp; participation', 'Certifications', 'Course accomplishments, workshop attendance, and event participation.')}
    <section class="section light-section" aria-label="Credentials"><div class="wrap">
      ${credentials(root)}
    </div></section>`],
  ['contact', 'Contact', 'Email, phone, and LinkedIn for Abram Seneca.', () => `
    <header class="page-head wrap"><h1 class="entrance">Contact</h1><p class="lede entrance">Tanza, Cavite</p></header>
    <div class="light-section"><div class="wrap contact-grid section">
      <section aria-label="Contact details">
        <div class="contact-line">
          <p class="eyebrow">Email</p>
          <a class="email-link" href="mailto:${email}">${email}</a>
          <button class="copy-button" type="button" data-copy="${email}" hidden>Copy email</button>
          <span class="copy-status" role="status"></span>
        </div>
        <div class="contact-line"><p class="eyebrow">Phone</p><a href="tel:+639946642782">0994 664 2782</a></div>
        <div class="contact-line"><p class="eyebrow">LinkedIn</p><a href="https://www.linkedin.com/in/abram-seneca-b700a9386/">Abram Seneca</a></div>
      </section>
      <section class="compose" hidden aria-labelledby="compose-title">
        <h2 id="compose-title">Draft an email</h2>
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

for (const [route, title, description, render] of pages) {
  const root = route ? '../'.repeat(route.split('/').length) : './';
  const navLinks = nav.map(([path, label]) => {
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
  <meta name="description" content="${description}">
  <meta name="theme-color" content="#171916">
  <title>${route ? `${title} | ${name}` : name}</title>
  <link rel="stylesheet" href="${root}site.css">
  <script src="${root}site.js" defer></script>
</head>
<body id="top" class="${route ? 'interior' : 'front-page'}">
  <a class="skip" href="#main">Skip to content</a>
  <header class="masthead wrap">
    <a class="brand" href="${pageUrl(root)}" aria-label="${name}, home"><i aria-hidden="true">as</i> Abram Seneca</a>
    <nav class="desktop-nav" aria-label="Main navigation">${navLinks}</nav>
    <button class="menu-toggle" type="button" aria-haspopup="dialog" aria-controls="menu" aria-expanded="false" hidden><i class="device-mini" aria-hidden="true"></i> Menu</button>
  </header>
  <dialog id="menu" aria-label="Site menu">
    <div class="menu-head"><span class="brand"><i aria-hidden="true">as</i> Abram Seneca</span><button type="button" class="menu-close" autofocus>Close <span aria-hidden="true">×</span></button></div>
    <nav aria-label="Portfolio apps">${navLinks}</nav>
    <button type="button" class="home-bar" aria-label="Close menu"></button>
  </dialog>
  <div class="cursor-ring" aria-hidden="true"></div>
  <main id="main" tabindex="-1">${render(root)}</main>
  <footer class="footer">
    <div class="wrap footer-inner"><div><a class="footer-name" href="${pageUrl(root)}">${name}</a><p>Computer Science student · Tanza, Cavite</p></div>
    <div class="footer-links"><a href="${pageUrl(root, 'contact')}">Contact</a><a href="https://www.linkedin.com/in/abram-seneca-b700a9386/">LinkedIn</a><a href="#top">Back to top</a></div></div>
  </footer>
</body>
</html>
`.replace(/[\t ]+$/gm, ''));
}
