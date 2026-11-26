const escape = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const groups = {
  organizations: 'Student organizations',
  volunteering: 'Volunteering',
  learning: 'Training & events',
  awards: 'Academic achievements',
  community: 'Community leadership',
};
function newest(a, b) {
  return (b.date || '').localeCompare(a.date || '') || a.slug.localeCompare(b.slug);
}
function priority(a, b) {
  return Number(!!b.pinned) - Number(!!a.pinned) || newest(a, b);
}
function portfolioSelection(projects, experiences) {
  const selected = projects
    .filter((p) => p.showOnOverview !== false)
    .sort(priority)
    .slice(0, 2);
  const community = experiences.filter((e) => e.cover && e.showOnOverview !== false).sort(priority)[0];
  const slides = [];
  for (const entry of [...projects, ...experiences].sort(newest)) {
    if (entry.showInSlider === false) continue;
    const route = entry.group ? 'experience' : 'projects/' + entry.slug;
    const anchor = entry.group ? '#experience-' + entry.slug : '';
    const photos = [
      { image: entry.slideImage || entry.cover, caption: entry.slideCaption || entry.title },
      ...(entry.extraSlides || []),
    ];
    for (const photo of photos.filter((p) => p.image))
      slides.push({ ...photo, caption: photo.caption || entry.title, entry, route, anchor });
  }
  return { selected, community, slides };
}
function portfolioViews({ asset, page, heading, arrow, journalExists, projectExists }) {
  const e = escape;
  const file = (path) => (path ? e(asset(path)) : '');
  const link = (url, label) => (url ? `<a class="text-link" href="${e(url)}">${e(label)}</a>` : '');
  const web = (url) => (/^https?:\/\//i.test(url || '') ? url : '');
  const paragraphs = (value) =>
    String(value || '')
      .split(/\n\s*\n/)
      .filter(Boolean)
      .map((text) => `<p>${e(text)}</p>`)
      .join('');
  const img = (path, alt) => `<img src="${file(path)}" alt="${e(alt)}" loading="lazy">`;
  const related = (entry) =>
    entry.journal && journalExists(entry.journal) ? page('journal/' + entry.journal) : '';
  function projectCard(project, overview = false) {
    const clip = project.preview || project.video;
    return `<article class="work work-${e(project.slug)} reveal">
      <a href="${e(page('projects/' + project.slug))}">
        <div class="work-image">${img(project.cover, project.alt)}<span class="work-arrow" aria-hidden="true">${arrow}</span></div>
        <div class="work-label"><span>${e(project.category)}</span><time>${e(project.date?.slice(0, 4))}</time></div>
        ${heading(project.title, overview ? 3 : 2)}<p>${e((overview && project.overview) || project.intro)}</p>
        ${project.tools ? `<span class="work-tools">${e(project.tools)}</span>` : ''}<span class="text-link">View project</span>
      </a>${clip ? `<details class="quick-preview"><summary>Preview demonstration</summary><video controls playsinline preload="none" poster="${file(project.cover)}" aria-label="${e(project.videoTitle || project.title)}"><source src="${file(clip)}"></video></details>` : ''}
    </article>`;
  }
  function projectGrid(projects, overview = false) {
    return `<div class="work-grid">${projects.map((project) => projectCard(project, overview)).join('')}</div>`;
  }
  function film(project) {
    const clip = project.video || project.preview;
    const full = web(project.fullVideoUrl);
    const title = project.videoTitle || 'Project demonstration';
    // The full original is available in local installations with the optional large MP4.
    const local =
      project.slug === 'determinator' &&
      project.preview === '/media/portfolio/rover-demo.mp4' &&
      !project.video;
    return `<figure class="film reveal">${clip ? `<video controls playsinline preload="none" width="1280" height="720" poster="${file(project.poster || project.cover)}" aria-label="${e(title)}"${local ? ` data-local-original="${file('/media/determinator-original.mp4')}"` : ''}><source src="${file(clip)}"></video>` : img(project.cover, project.alt)}
    ${clip || full ? `<figcaption><span${local ? ' data-video-label' : ''}>${e(project.previewLabel || title)}</span> ${link(full || asset(clip), full ? (/^https:\/\/drive\.google\.com\//.test(full) ? 'Watch the full video on Google Drive' : 'Watch the full video') : 'Open video')}</figcaption>` : ''}</figure>`;
  }
  function projectCase(project, next) {
    const links = [
      link(web(project.liveUrl), 'Visit project'),
      link(web(project.repoUrl), 'View source code'),
      link(related(project), 'Read the journal entry'),
      project.attachment && link(asset(project.attachment), project.attachmentLabel || 'View attachment'),
    ].filter(Boolean);
    const hasNotes =
      project.tools ||
      project.details?.length ||
      project.gallery?.length ||
      project.transcript ||
      links.length;
    return `<div class="case-opening case-${e(project.slug)}"><div class="wrap">
      <a class="text-link breadcrumb" href="${e(page('projects'))}">All projects</a>
      <div class="case-heading"><div><p class="eyebrow kicker">${e(project.category)}</p>${heading(project.title, 1)}</div><p class="lede">${e(project.intro)}</p></div>
      <div class="film-section">${film(project)}</div></div></div>
      ${
        hasNotes
          ? `<div class="dark"><div class="wrap case-notes"><p class="eyebrow">${e(project.tools)}</p><div>
      ${(project.details || []).map((item) => `<section class="reveal">${heading(item.heading, 2)}${paragraphs(item.text)}</section>`).join('')}
      ${(project.gallery || []).map((photo) => `<figure class="film case-photo reveal"><a href="${file(photo.image)}" aria-label="Open full-size image: ${e(photo.alt)}">${img(photo.image, photo.alt)}</a>${photo.caption ? `<figcaption>${e(photo.caption)}</figcaption>` : ''}</figure>`).join('')}
      ${project.transcript ? `<details><summary>Video description</summary>${paragraphs(project.transcript)}</details>` : ''}
      ${links.map((item) => `<p>${item}</p>`).join('')}</div></div></div>`
          : ''
      }
      ${next ? `<nav class="wrap section" aria-label="Project navigation"><p class="next-project"><a href="${e(page('projects/' + next.slug))}"><span class="eyebrow">Next project</span><strong>${e(next.title)}</strong></a></p></nav>` : ''}`;
  }
  function experienceRow(entry) {
    const links = [
      link(related(entry), entry.journalLabel || 'Read the journal entry'),
      entry.project &&
        projectExists(entry.project) &&
        link(page('projects/' + entry.project), entry.projectLabel || 'View project'),
      entry.attachment && link(asset(entry.attachment), entry.attachmentLabel || 'View attachment'),
      link(web(entry.url), entry.linkLabel || 'Learn more'),
    ].filter(Boolean);
    const legacyAnchor = entry.slug === 'devfest' ? '<span id="devfest" aria-hidden="true"></span>' : '';
    const attribution = [entry.role, entry.organization, entry.location].filter(Boolean).map(e).join(' · ');
    const gallery = entry.gallery?.length
      ? `<details><summary>View photographs</summary><div class="event-gallery-grid">${entry.gallery.map((photo) => `<figure>${img(photo.image, photo.alt)}${photo.caption ? `<figcaption>${e(photo.caption)}</figcaption>` : ''}</figure>`).join('')}</div></details>`
      : '';
    if (!entry.description && !attribution && !gallery && links.length === 1 && related(entry)) {
      return `<div class="entry journal-mention" id="experience-${e(entry.slug)}"><dt>${legacyAnchor}<a class="text-link" href="${e(related(entry))}">${e(entry.title)} · ${e(entry.journalLabel || 'Read the journal entry')}</a></dt><dd></dd></div>`;
    }
    return `<div id="experience-${e(entry.slug)}" class="entry reveal"><dt>${legacyAnchor}<span class="eyebrow">${e(entry.dateLabel || entry.date)}</span><strong>${e(entry.title)}</strong></dt><dd>${attribution ? `<p>${attribution}</p>` : ''}${paragraphs(entry.description)}${links.join(' ')}${gallery}</dd></div>`;
  }
  function experiencesPage(entries) {
    const bands = {
      organizations: 'wrap section',
      volunteering: 'section dark',
      learning: 'wrap section',
      awards: 'section light-section',
      community: 'wrap section',
    };
    return Object.entries(groups)
      .map(([group, title]) => {
        const list = entries.filter((entry) => entry.group === group).sort(newest);
        if (!list.length) return '';
        const content =
          heading(title, 2, group) + `<dl class="entries">${list.map(experienceRow).join('')}</dl>`;
        return `<section class="${bands[group]}" aria-labelledby="${group}">${bands[group].startsWith('wrap') ? content : `<div class="wrap">${content}</div>`}</section>`;
      })
      .join('');
  }
  function communityFeature(entry) {
    if (!entry) return '';
    const href = related(entry);
    return `<section class="section wrap feature community" aria-labelledby="home-event">
      <figure class="reveal">${img(entry.cover, entry.alt)}</figure>
      <div class="feature-copy reveal"><p class="eyebrow kicker">${[entry.featureLabel || groups[entry.group], entry.date?.slice(0, 4) || entry.dateLabel].filter(Boolean).map(e).join(' · ')}</p>${heading(entry.overviewTitle || entry.title, 2, 'home-event')}
      <p>${e(entry.overview || entry.description)}</p>${link(href || page('experience') + '#experience-' + entry.slug, href ? entry.featureLinkLabel || 'Read the journal entry' : 'View experience')}</div></section>`;
  }
  function slideCard(slide, duplicate = false) {
    const href =
      related(slide.entry) && slide.entry.group ? related(slide.entry) : page(slide.route) + slide.anchor;
    return `<a href="${e(href)}" class="photo-card" data-fit="${slide.entry.sliderFit === 'contain' ? 'contain' : 'cover'}"${duplicate ? ' tabindex="-1"' : ''}>${img(slide.image, '')}<span>${e(slide.caption)}</span></a>`;
  }
  function photoMarquee(slides) {
    if (!slides.length) return '';
    const run = (duplicate) =>
      `<div class="photo-run"${duplicate ? ' aria-hidden="true"' : ''}>${slides.map((slide) => slideCard(slide, duplicate)).join('')}</div>`;
    return `<div class="photo-marquee" role="region" aria-label="Portfolio photographs"><div class="photo-track">${run(false)}${run(true)}</div></div>`;
  }
  return { projectGrid, projectCase, experiencesPage, communityFeature, photoMarquee, slideCard };
}
export { escape, groups, newest, portfolioSelection, portfolioViews };
