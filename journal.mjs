import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { readingMinutes } from './admin/editor/reading-time.mjs';

export const publication = 'Yohanan Times - The Good Apple';
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function parseEntry(source, slug) {
  const front = /^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/.exec(source);
  if (!front || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw Error('Invalid journal entry');
  const data = parse(front[1]);
  for (const key of ['title','cover','alt','date']) {
    if (typeof data[key] !== 'string' || !data[key].trim()) throw Error('Missing ' + key + ' in ' + slug);
  }
  const date = new Date(data.date);
  if (!Number.isFinite(date.getTime())) throw Error('Invalid publication date in ' + slug);
  const sections = data.sections ?? [];
  for (const section of sections) {
    if (!['text','image','paired'].includes(section.type) ||
        (section.type !== 'image' && typeof section.text !== 'string') ||
        (section.type !== 'text' && !section.alt?.trim()) ||
        (section.type === 'paired' && !['left','right'].includes(section.side))) throw Error('Invalid article section in ' + slug);
  }
  const images = [data.cover, ...(data.gallery ?? []).map(item=>item.image), ...sections.filter(s => s.type !== 'text').map(s => s.image)];
  for (const image of images) {
    if (typeof image !== 'string' || !/^\/media\/(?:journal|devfest|hacktoberfest)\/.+\.(?:jpe?g|png|gif|webp|avif)$/i.test(image)) {
      throw Error('Choose a JPEG, PNG, WebP, AVIF or GIF for ' + slug);
    }
    const segments = image.slice(1).split('/');
    if (segments.some(part => !part || part.startsWith('.') || /[\\:\x00-\x1f]/.test(part))) {
      throw Error('Invalid image path in ' + slug);
    }
  }
  const body = sanitizeHtml(marked.parse(front[2]), {
    allowedTags: ['p','a','h2','h3','h4','blockquote','strong','em','ul','ol','li','hr','br','code','pre','del','h1','h5','h6'],
    allowedAttributes: {a:['href','title']}, allowedSchemes:['http','https','mailto'], allowProtocolRelative:false
  });
  const firstParagraph = sanitizeHtml(body.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? '', {allowedTags:[],allowedAttributes:{}});
  const sectionText = sections.map(section => section.text || '').filter(Boolean).join('\n\n');
  const summary = firstParagraph || escape(sectionText.split(/\n\s*\n/)[0]);
  const words = summary.trim().split(/\s+/);
  const excerpt = words.length > 34 ? words.slice(0, 34).join(" ") + "…" : summary;
  return {...data,sections,images,slug,body,excerpt,category:data.category || 'Article',minutes:readingMinutes(front[2] + ' ' + sectionText),stamp:date.getTime(),dateLabel:date.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Manila'})};
}
const dir=new URL('./journal/entries/', import.meta.url);
const entries=(existsSync(dir) ? readdirSync(dir) : []).filter(file=>file.endsWith('.md')).map(file=>parseEntry(readFileSync(new URL(file,dir),'utf8'),file.slice(0,-3))).sort((a,b)=>b.stamp-a.stamp||a.slug.localeCompare(b.slug));
const picture=(root,path)=>escape(root+path.slice(1).split('/').map(encodeURIComponent).join('/'));
const edition=(root,small=false)=>`<span class="edition${small?' edition-small':''}"><img class="journal-nameplate" src="${root}media/yohanan-times.svg" alt="Yohanan Times"> <i>- The Good Apple</i></span>`;
const category=e=>`<div class="story-category">${escape(e.category)}</div>`;
const published=e=>`<time datetime="${escape(e.date)}">${e.dateLabel}</time>`;
function card(root,e,lead) {
  const href=e.slug+'/index.html';
  return `<article class="story-card ${lead?'lead-story':''}"><a href="${href}">
    <div>${category(e)}<h2>${escape(e.title)}</h2><div class="journal-meta">${published(e)} · ${e.minutes} min read</div><p>${e.excerpt}</p></div>
    <img src="${picture(root,e.cover)}" alt="${escape(e.alt)}" ${lead?'fetchpriority="high"':'loading="lazy"'}></a></article>`;
}
function articleSection(root, section) {
  const paragraphs = (section.text || '').split(/\n\s*\n/).filter(Boolean).map(p => '<p>' + escape(p) + '</p>').join('');
  const text = '<div class="prose">' + paragraphs + '</div>';
  if (section.type === 'text') return text;
  const caption = section.caption ? '<figcaption>' + escape(section.caption) + '</figcaption>' : '';
  const photo = '<figure><img loading="lazy" src="' + picture(root,section.image) + '" alt="' + escape(section.alt) + '">' + caption + '</figure>';
  if (section.type === 'image') return '<div class="inline-photo">' + photo + '</div>';
  return '<div class="paired-photo image-' + section.side + '">' + text + photo + '</div>';
}
export const journalPages=[
 ['journal',publication,'Personal reflections, diary entries and devotions by Abram Seneca.',root=>`<div class="journal-shell"><header class="paper-head"><h1>${edition(root)}</h1><div class="paper-line"><span>Reflections, diary &amp; devotions</span><span>By Abram Seneca</span></div></header>
 ${entries.length?card(root,entries[0],true):'<p>The first entry is on its way.</p>'}
 ${entries.length>1?`<section class="archive"><h2>Earlier entries</h2><div class="archive-grid">${entries.slice(1).map(e=>card(root,e,false)).join('')}</div></section>`:''}<div class="journal-colophon"><a href="../admin/index.html">Writing desk</a></div></div>`],
 ...entries.map(e=>['journal/'+e.slug,e.title,'A journal entry by Abram Seneca.',root=>`<div class="journal-shell"><a class="edition-link" href="../index.html" aria-label="Journal front page">${edition(root,true)}</a>
 <article class="reading"><header>${category(e)}<h1>${escape(e.title)}</h1><div class="journal-meta">Abram Seneca · ${published(e)} · ${e.minutes} min read</div></header><figure class="cover"><img fetchpriority="high" src="${picture(root,e.cover)}" alt="${escape(e.alt)}">${e.caption?`<figcaption>${escape(e.caption)}</figcaption>`:''}</figure>
 <div class="prose">${e.body}</div>${e.sections.map(section => articleSection(root, section)).join('')}${e.gallery?.length?`<div class="story-gallery">${e.gallery.map(g=>`<figure><img loading="lazy" src="${picture(root,g.image)}" alt="${escape(g.alt)}">${g.caption?`<figcaption>${escape(g.caption)}</figcaption>`:''}</figure>`).join('')}</div>`:''}
 <p class="back-journal"><a href="../index.html">Back to the Journal</a></p></article></div>`,
 {cover:e.cover, alt:e.alt, excerpt:e.excerpt}])
];
