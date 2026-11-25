import './portfolio-preview.js';
import { readingMinutes } from './reading-time.mjs';

const publicationRoot = new URL('../../', location.href);
CMS.registerPreviewStyle(new URL('journal.css', publicationRoot).href);
CMS.registerPreviewTemplate('journal', ({entry, getAsset, widgetFor}) => {
  const data = entry.get('data');
  function imageURL(path) {
    if (!path) return '';
    if (/^\/media\/(devfest|hacktoberfest)\//.test(path)) return new URL(path.slice(1), publicationRoot).href;
    const asset = getAsset(path);
    return asset?.url || '';
  }
  const photo = (path, alt, caption, key) => h('figure',{className:key === 'cover' ? 'cover' : undefined,key},
    h('img',{src:imageURL(path),alt:alt || ''}),caption ? h('figcaption',{},caption) : null);
  const sections = data.get('sections')?.toJS() || [];
  function sectionView(section, key) {
    const text = h('div',{className:'prose',key}, ...(section.text || '').split(/\n\s*\n/).filter(Boolean).map((p,i)=>h('p',{key:i},p)));
    if (section.type === 'text') return text;
    const figure = photo(section.image,section.alt,section.caption,'section-photo');
    if (section.type === 'image') return h('div',{className:'inline-photo',key},figure);
    return h('div',{className:'paired-photo image-' + section.side,key},text,figure);
  }
  const gallery = data.get('gallery')?.toJS() || [];
  const date = new Date(data.get('date'));
  const dateLabel = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric', timeZone:'Asia/Manila'});
  return h('main',{className:'journal-shell'},h('div',{className:'edition edition-small'},
    h('img',{className:'journal-nameplate',src:new URL('media/yohanan-times.svg', publicationRoot).href,alt:'Yohanan Times'}),h('i',{},'- The Good Apple')),
    h('article',{className:'reading'},h('header',{},h('div',{className:'story-category'},data.get('category') || 'Article'),h('h1',{},data.get('title') || 'Untitled entry'),
      h('div',{className:'journal-meta'},['Abram Seneca', dateLabel, readingMinutes([data.get('body'), ...sections.map(s=>s.text)].join(' '))+' min read'].filter(Boolean).join(' · '))),
      photo(data.get('cover'),data.get('alt'),data.get('caption'),'cover'),
      h('div',{className:'prose'},widgetFor('body')), ...sections.map(sectionView),
      h('div',{className:'story-gallery'},...gallery.map((item,i)=>photo(item.image,item.alt,item.caption,i)))));
});

CMS.registerPreviewTemplate('certificates', ({entry, getAsset}) => {
  const data = entry.get('data');
  const file = data.get('file') || '';
  const url = file && getAsset(file)?.url;
  const pdf = /\.pdf$/i.test(file);
  return h('article',{style:{maxWidth:'38rem',margin:'2rem auto',padding:'1rem',fontFamily:'system-ui'}},
    h('h2',{},data.get('issuer')),
    url && (pdf ? h('object',{data:url,type:'application/pdf',width:'100%',height:300},h('a',{href:url},'View certificate')) : h('img',{src:url,alt:'',style:{maxWidth:'100%'}})),
    h('p',{},data.get('date')), h('h3',{},data.get('title')), h('p',{},data.get('type')),
    url && h('a',{href:url},'View certificate'),
    /^https?:\/\//i.test(data.get('verification') || '') && h('p',{},h('a',{href:data.get('verification')},'Verify with ' + data.get('issuer'))));
});
