const graphemes = new Intl.Segmenter('en', { granularity: 'grapheme' });
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// Keep the heading text available as a single accessible name. Words wrap
// naturally and each letter reserves its final space throughout the reveal.
export function blurHeading(text, { level = 3, id, label } = {}) {
  const typed = Array.isArray(text);
  const lines = typed ? text : [text];
  const count = Array.from(graphemes.segment(lines.join(' '))).length;
  const stagger = typed ? 50 : Math.min(38, Math.round(620 / count));
  let index = 0;
  const content = lines.map(line => {
    const start = index;
    const words = line.split(' ').map((word, i) => {
      if (i) index++;
      const letters = Array.from(graphemes.segment(word), ({ segment }) =>
        `<span class="glyph" style="--i:${index++}">${escape(segment)}</span>`).join('');
      return `<span class="heading-word">${letters}</span>`;
    }).join(' ');
    if (!typed) return `<span aria-hidden="true">${words}</span>`;
    const length = index - start;
    return `<span aria-hidden="true" class="type-line" style="--count:${length};--duration:${length * stagger}ms;--delay:${start * stagger}ms">${words}</span>`;
  }).join(' ');
  const utilities = 'tracking-[-0.05em] transition-colors duration-[500ms] ease-[cubic-bezier(.16,1,.3,1)]';
  const size = level === 3 ? ' text-[clamp(1.25rem,2vw,1.75rem)]' : '';
  return `<h${level} class="blur-heading ${utilities}${size}${typed ? ' typed-headline' : ''}"${id ? ` id="${id}"` : ''} aria-label="${escape(label ?? lines.join(' '))}" style="--stagger:${stagger}ms">${content}</h${level}>`;
}
