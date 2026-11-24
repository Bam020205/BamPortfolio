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
  const photo = (path, alt, caption, key) => h('figure',{className:'cover',key},
    h('img',{src:imageURL(path),alt:alt || ''}),caption ? h('figcaption',{},caption) : null);
  const gallery = data.get('gallery')?.toJS() || [];
  return h('main',{className:'journal-shell'},h('div',{className:'edition edition-small'},'Yohanan Times',h('i',{},'- The Good Apple')),
    h('article',{className:'reading'},h('header',{},h('h1',{},data.get('title') || 'Untitled entry'),
      h('div',{className:'journal-meta'},'Abram Seneca · '+String(data.get('date') || '').slice(0,10))),
      photo(data.get('cover'),data.get('alt'),data.get('caption'),'cover'),
      h('div',{className:'prose'},widgetFor('body')),
      h('div',{className:'story-gallery'},...gallery.map((item,i)=>photo(item.image,item.alt,item.caption,i)))));
});
