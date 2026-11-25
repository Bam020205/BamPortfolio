// Estimate time spent reading the article body, including headings and quotations.
export function readingMinutes(markdown = '') {
  const text = markdown
    .replace(/^\s{0,3}\[[^\]]+\]:\s+\S+.*$/gm, '')
    .replace(/!?\[([^\]]*)\]\((?:\\.|[^()\n]|\([^()\n]*\))*\)/g, '$1')
    .replace(/<[^>\n]+>/g, ' ');
  const words = text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || [];
  return Math.max(1, Math.ceil(words.length / 200));
}
