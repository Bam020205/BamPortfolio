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
    <p class="eyebrow">${label}</p>
    <h1 class="entrance">${title}</h1>
    <p class="lede entrance">${intro}</p>
  </header>`;

const projects = [
  {
    slug: 'determinator', title: 'DeTerminator', category: 'Robotics research',
    intro: 'An Arduino-based rover that explores carbon dioxide and humidity as possible indicators of termite activity.',
    cover: 'rover.jpg', alt: 'A close-up of the DeTerminator rover during assembly',
    video: 'rover-demo.mp4', videoTitle: 'Excerpt from the science fair presentation',
    details: [
      ['The build', 'I programmed, integrated the hardware, and built the rover, named Terry. It collects environmental readings from sites where termite activity is suspected.'],
      ['The science fair', 'DeTerminator earned fourth place in the individual Robotics and Intelligent Machines category at the 2025 Division Science and Technology Fair in Bulihan, Silang, Cavite.'],
    ],
    tools: 'Arduino · C++ · Environmental sensors',
    transcript: 'The excerpt shows Abram introducing Terry outdoors and explaining that he programmed it in C++ and used an Arduino Uno to control it. The original video includes on-screen captions.',
  },
  {
    slug: 'inventory', title: 'Shop Inventory Manager', category: 'Desktop application',
    intro: 'A Java Swing inventory system designed around the everyday needs of a sari-sari store.',
    cover: 'inventory.jpg', alt: 'The Shop Inventory Manager product form and stock table in the original screen recording',
    video: 'inventory.mp4', videoTitle: 'Application walkthrough',
    details: [
      ['The idea', 'Helping my mother at a canteen inspired me to build a simple tool for tracking products, prices, and stock. I left supplier and item code fields out of the product form.'],
      ['The build', 'I built the desktop interface with Java Swing and used SQLite with DBeaver. A Project Tuklas Teknolohiya workshop on connecting Java to a database helped me apply the approach to this project.'],
    ],
    tools: 'Java Swing · SQLite · DBeaver',
    transcript: 'The recording shows the desktop product form and inventory table, including controls for adding and updating products and searching the stock list.',
  },
];

function projectList(root, titleTag = 'h3') {
  return `<div class="work-grid">${projects.map((project) => `
    <article class="work reveal">
      <a href="${pageUrl(root, `projects/${project.slug}`)}">
        <div class="work-image"><img src="${root}media/${project.cover}" width="1280" height="720" loading="lazy" alt="${project.alt}"></div>
        <div class="work-label"><span class="eyebrow">${project.category}</span><span class="link-mark" aria-hidden="true">↗</span></div>
        <${titleTag}>${project.title}</${titleTag}>
        <p>${project.intro}</p>
      </a>
    </article>`).join('')}</div>`;
}

function rows(items) {
  return `<dl class="entries">${items.map(([tag, title, detail]) => `
    <div class="entry reveal"><dt><span class="eyebrow">${tag}</span><strong>${title}</strong></dt><dd>${detail}</dd></div>`).join('')}</dl>`;
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

const pages = [
  ['', name, 'Computer Science student at Cavite State University. Explore selected robotics and software projects.', (root) => `
    <section class="hero wrap">
      <div class="hero-copy">
        <p class="eyebrow entrance">Computer Science student</p>
        <h1 aria-label="${name}"><span class="entrance">Abram John</span><span class="entrance">R. Seneca</span></h1>
        <div class="hero-meta entrance">
          <p>I study Computer Science at Cavite State University and build projects in robotics and software.</p>
          <a class="text-link" href="#selected">Selected projects</a>
        </div>
      </div>
      <figure class="hero-portrait entrance"><img src="${root}media/portrait.jpg" alt="Abram John R. Seneca" fetchpriority="high"></figure>
    </section>
    <section class="section wrap" id="selected" aria-labelledby="selected-title">
      <div class="section-head"><h2 id="selected-title">Selected projects</h2><a class="text-link" href="${pageUrl(root, 'projects')}">All projects</a></div>
      ${projectList(root)}
    </section>`],
  ['about', 'About', 'Education, interests, and skills.', (root) => `
    ${heading('About', 'Abram John<br>R. Seneca', 'Computer Science student at Cavite State University.')}
    <section class="wrap bio section">
      <figure class="bio-photo reveal"><img src="${root}media/portrait.jpg" alt="Portrait of Abram Seneca"></figure>
      <div>
        <h2>Education</h2>
        ${rows([['2026–2030 expected', 'Cavite State University · Indang (Main)', 'Bachelor of Science in Computer Science'], ['Senior high school', 'Cavite Science Integrated School–RSHS', '']])}
        <h2>Interests &amp; skills</h2>
        <p>I’m interested in software development, robotics, databases, and cybersecurity. My goal is to become a software engineer and build a stronger foundation in data and technology.</p>
        <p>I have basic knowledge of Java and Python, and hands-on experience with SQL and database management, Arduino programming, and robotics hardware.</p>
      </div>
    </section>`],
  ['projects', 'Projects', 'Robotics research and desktop software projects.', (root) => `
    ${heading('Selected work', 'Projects', 'An individual robotics research project and a desktop inventory application.')}
    <section class="wrap section" aria-label="Project index">${projectList(root, 'h2')}</section>`],
  ...projects.map((project, index) => [`projects/${project.slug}`, project.title, project.intro, (root) => `
    ${heading(project.category, project.title, project.intro)}
    <div class="wrap">
      <figure class="film reveal">
        <video controls playsinline preload="none" width="1280" height="720" poster="${root}media/${project.cover}" aria-label="${project.videoTitle}">
          <source src="${root}media/${project.video}" type="video/mp4">
          <a href="${root}media/${project.video}">Open video</a>
        </video>
        <figcaption>${project.videoTitle} <a class="text-link" href="${root}media/${project.video}">Open video</a></figcaption>
      </figure>
      <div class="case-notes">
        <p class="eyebrow">${project.tools}</p>
        <div>${project.details.map(([title, detail]) => `<section class="reveal"><h2>${title}</h2><p>${detail}</p></section>`).join('')}
          <details><summary>Video description</summary><p>${project.transcript}</p></details>
          ${index === 0 ? `<p><a class="text-link" href="${root}media/fair.jpg">View recognition certificate</a></p>` : ''}
        </div>
      </div>
      <p class="next-project"><a href="${pageUrl(root, `projects/${projects[1 - index].slug}`)}"><span class="eyebrow">Next project</span><strong>${projects[1 - index].title} <span aria-hidden="true">↗</span></strong></a></p>
    </div>`]),
  ['experience', 'Experience', 'Student organizations, volunteering, training, and academic achievements.', (root) => `
    ${heading('Campus &amp; community', 'Experience', 'Student organizations, volunteering, and learning beyond the classroom.')}
    <div class="wrap section">
      <section aria-labelledby="organizations">
        <h2 id="organizations">Student organizations</h2>
        ${rows([
          ['Since Aug 2026', 'AWS Student Builder Group–Spade', 'Relations &amp; Communications Office · ACE'],
          ['Since Oct 2026', 'Computer Science Student Organization (CSSO)', 'Committee on Records and Documentation (COMRECS) · Member and photographer'],
          ['Since Oct 2026', 'Microsoft Student Community Philippines', 'Member'],
        ])}
      </section>
      <section class="section" aria-labelledby="volunteering">
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
      </section>
      <section aria-labelledby="learning">
        <h2 id="learning">Training &amp; events</h2>
        ${rows([
          ['Oct 18–25, 2026', 'Packet Capture: Beneath the Network CTF', 'Team participant with SINT-O SINT-O in the CyberPH competition.'],
          ['2026', 'Data Engineering Pilipinas × DataCamp Scholarship', 'Accepted into the scholarship program.'],
          ['2026', 'Project Tuklas Teknolohiya workshops', 'Attended sessions on Java database connectivity, C++ programming, and SQL and database management.'],
        ])}
      </section>
      <section class="section" aria-labelledby="awards">
        <h2 id="awards">Academic achievements</h2>
        ${rows([
          ['Nov 16, 2025', 'Silver Award · 2nd National Linguistics Challenge', `Represented Cavite Science Integrated School–RSHS in Grade 12. <a class="text-link" href="${root}media/nlc.png">View award</a>`],
          ['Oct 2025', 'Fourth place · Division Science and Technology Fair', `Robotics and Intelligent Machines, individual category. <a class="text-link" href="${pageUrl(root, 'projects/determinator')}">View DeTerminator</a>`],
        ])}
      </section>
    </div>`],
  ['certifications', 'Certifications', 'Course accomplishments and certificates of attendance and participation.', (root) => `
    ${heading('Coursework &amp; participation', 'Certifications', 'Course accomplishments, workshop attendance, and event participation.')}
    <section class="wrap section" aria-label="Credentials">
      <ul class="cert-list">${certs.map(([title, issuer, date, type, image, id]) => {
        const src = `${root}media/credentials/${encodePath(image)}`;
        return `<li class="credential reveal">
          <a class="cert-image" href="${src}" aria-label="View ${title.replace('&', '&amp;')} certificate"><img src="${src}" alt="" loading="lazy"></a>
          <div><p class="eyebrow">${issuer} · ${date}</p><h2>${title.replace('&', '&amp;')}</h2><p>${type}</p>
          ${id ? `<a class="text-link" href="https://www.datacamp.com/completed/statement-of-accomplishment/course/${id}">Verify with DataCamp</a>` : ''}
          </div>
        </li>`;
      }).join('')}</ul>
    </section>`],
  ['contact', 'Contact', 'Email, phone, and LinkedIn for Abram Seneca.', () => `
    <header class="page-head wrap"><h1 class="entrance">Contact</h1><p class="lede entrance">Tanza, Cavite</p></header>
    <div class="wrap contact-grid section">
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
    </div>`],
];

for (const [route, title, description, render] of pages) {
  const root = route ? '../'.repeat(route.split('/').length) : './';
  const navLinks = nav.map(([path, label]) => {
    const active = path === route || (path && route.startsWith(`${path}/`));
    const current = active ? ` aria-current="${path === route ? 'page' : 'location'}"` : '';
    return `<a href="${pageUrl(root, path)}"${current}>${label}</a>`;
  }).join('');
  const output = fileURLToPath(new URL(`./${route ? `${route}/` : ''}index.html`, import.meta.url));
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${description}">
  <meta name="theme-color" content="#0B0B0B">
  <title>${route ? `${title} | ${name}` : name}</title>
  <link rel="stylesheet" href="${root}site.css">
  <script src="${root}site.js" defer></script>
</head>
<body id="top">
  <a class="skip" href="#main">Skip to content</a>
  <header class="masthead wrap">
    <a class="brand" href="${pageUrl(root)}" aria-label="${name}, home">Abram Seneca<span>.</span></a>
    <nav class="desktop-nav" aria-label="Main navigation">${navLinks}</nav>
    <button class="menu-toggle" type="button" aria-haspopup="dialog" aria-controls="menu" aria-expanded="false" hidden>Menu <span aria-hidden="true">+</span></button>
  </header>
  <dialog id="menu" aria-label="Site menu">
    <div class="menu-head"><span class="brand">Abram Seneca<span>.</span></span><button type="button" class="menu-close" autofocus>Close <span aria-hidden="true">×</span></button></div>
    <nav aria-label="Mobile navigation">${navLinks}</nav>
  </dialog>
  <main id="main" tabindex="-1">${render(root)}</main>
  <footer class="footer">
    <div class="wrap footer-inner"><div><a class="footer-name" href="${pageUrl(root)}">${name}</a><p>Computer Science student · Tanza, Cavite</p></div>
    <div class="footer-links"><a href="${pageUrl(root, 'contact')}">Contact</a><a href="https://www.linkedin.com/in/abram-seneca-b700a9386/">LinkedIn</a><a href="#top">Back to top</a></div></div>
  </footer>
</body>
</html>
`.replace(/[\t ]+$/gm, ''));
}
