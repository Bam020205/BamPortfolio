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
  const gallery = data.get('gallery')?.toJS() || [];
  const date = new Date(data.get('date'));
  const dateLabel = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric', timeZone:'Asia/Manila'});
  return h('main',{className:'journal-shell'},h('div',{className:'edition edition-small'},
    h('img',{className:'journal-nameplate',src:new URL('media/yohanan-times.svg', publicationRoot).href,alt:'Yohanan Times'}),h('i',{},'- The Good Apple')),
    h('article',{className:'reading'},h('header',{},h('div',{className:'story-category'},data.get('category') || 'Article'),h('h1',{},data.get('title') || 'Untitled entry'),
      h('div',{className:'journal-meta'},['Abram Seneca', dateLabel, readingMinutes(data.get('body') || '')+' min read'].filter(Boolean).join(' · '))),
      photo(data.get('cover'),data.get('alt'),data.get('caption'),'cover'),
      h('div',{className:'prose'},widgetFor('body')),
      h('div',{className:'story-gallery'},...gallery.map((item,i)=>photo(item.image,item.alt,item.caption,i)))));
});
