import { escape, portfolioSelection, portfolioViews } from './portfolio-views.mjs';

const root = new URL('../../', location.href);
const baseline = await fetch(new URL('content/portfolio.json', root), { cache: 'no-cache' })
  .then((response) => {
    if (!response.ok) throw Error('Published portfolio unavailable');
    return response.json();
  })
  .catch(() => null);
function previewFrame(markup) {
  return h(
    'div',
    {},
    h('link', { rel: 'stylesheet', href: new URL('site.css', root).href }),
    h('link', { rel: 'stylesheet', href: new URL('admin/editor/preview.css', root).href }),
    h('div', { className: 'portfolio-preview', dangerouslySetInnerHTML: { __html: markup } }),
  );
}
function portfolioPreview(collection, { entry, getAsset }) {
  const draft = { ...entry.get('data').toJS(), slug: entry.get('slug') || 'new-entry' };
  if (collection === 'experiences' && !draft.group) draft.group = 'volunteering';
  const merged = (name) => [
    ...(baseline?.[name] || []).filter((item) => collection !== name || item.slug !== draft.slug),
    ...(collection === name ? [draft] : []),
  ];
  const projects = merged('projects'),
    experiences = merged('experiences');
  const { selected, community, slides } = portfolioSelection(projects, experiences);
  const views = portfolioViews({
    asset: (path) => {
      if (!path || !path.startsWith('/media/')) return '';
      if (path.startsWith('/media/portfolio/')) return getAsset(path)?.url || '';
      return new URL(path.slice(1).split('/').map(encodeURIComponent).join('/'), root).href;
    },
    page: (route) => new URL(route + '/index.html', root).href,
    heading: (title, level, id) =>
      `<h${level}${id ? ` id="${escape(id)}"` : ''}>${escape(title)}</h${level}>`,
    arrow: '↗',
    journalExists: () => true,
    projectExists: (slug) => projects.some((p) => p.slug === slug),
  });
  const isProject = collection === 'projects';
  const feature = isProject
    ? selected.includes(draft) && views.projectGrid([draft], true)
    : community === draft && views.communityFeature(draft);
  const ownSlides = slides.filter((slide) => slide.entry === draft);
  const section = (label, markup) =>
    `<section class="preview-part"><h2 class="preview-label">${label}</h2>${markup}</section>`;
  const flatTitle = isProject ? 'Projects page' : 'Experience page';
  return previewFrame(
    section(flatTitle, isProject ? views.projectGrid([draft]) : views.experiencesPage([draft])) +
      section(
        'Overview placement',
        (!baseline ? '<p>Published entries could not be loaded. Placement below is estimated.</p>' : '') +
          (feature || '<p>This entry is outside the current Overview selection.</p>') +
          (ownSlides.length
            ? `<div class="photo-run">${ownSlides.map((slide) => views.slideCard(slide)).join('')}</div>`
            : '<p>This entry contributes no photos to the slider.</p>'),
      ) +
      (isProject ? section('Project detail page', views.projectCase(draft, null)) : ''),
  );
}
for (const name of ['projects', 'experiences'])
  CMS.registerPreviewTemplate(name, (props) => portfolioPreview(name, props));
CMS.registerPreviewTemplate('site', ({ entry }) => {
  const s = entry.get('data').toJS();
  return previewFrame(`<section class="preview-part"><h2 class="preview-label">Overview</h2><p class="eyebrow">${escape(s.discipline)} / ${escape(s.location)}</p><h2>${escape(s.headline)}</h2><p>${escape(s.focus)}</p><p>${escape(s.introduction)}</p></section>
  <section class="preview-part"><h2 class="preview-label">About</h2><h2>${escape(s.aboutHeadline)}</h2>${(s.bio || []).map((p) => `<p>${escape(p)}</p>`).join('')}</section>
  <section class="preview-part"><h2 class="preview-label">Contact and footer</h2><p>${escape(s.footerRole)} · ${escape(s.location)}</p><p>${escape(s.email)}</p><p>${escape(s.phone || s.dial)}</p>${(s.socials || []).map((profile) => `<p>${escape(profile.label)} · ${escape(profile.url)}</p>`).join('')}</section>`);
});
