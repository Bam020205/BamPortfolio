for (const [format, label] of [
  ['centered', 'Centered text'],
  ['large', 'Larger text'],
  ['reference', 'Hanging reference']
]) {
  const id = 'journal-' + format;
  CMS.registerEditorComponent({
    id,
    label,
    fields: [{name:'text', label:'Text', widget:'richtext', editor_components:[]}],
    pattern: new RegExp('<div class="' + id + '">\\s*([\\s\\S]*?)\\s*</div>'),
    fromBlock: match => ({text:match[1]}),
    toBlock: ({text}) => '<div class="' + id + '">\n\n' + (text || '') + '\n\n</div>',
    toPreview: ({text}) => {
      const block = document.createElement('div');
      block.className = id;
      const destroy = CMS.renderRichText(block, text || '');
      block.addEventListener('Unmount', destroy, {once:true});
      return block;
    }
  });
}
