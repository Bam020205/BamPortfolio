// Called by the private writing repository after a publication is merged.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, copyFileSync, realpathSync, unlinkSync } from 'node:fs';
import { resolve, dirname, relative, sep, isAbsolute } from 'node:path';
import { parseEntry } from '../journal.mjs';

const source = realpathSync(process.argv[2]);
const entries = 'journal/entries';
const published = new Set();
const usedUploads = new Set();
function privateFile(path) {
  const file = realpathSync(resolve(source, path));
  const rel = relative(source, file);
  if (rel.startsWith('..' + sep) || isAbsolute(rel) || file !== resolve(source,path)) throw Error('Invalid private source path');
  return file;
}
mkdirSync(entries, {recursive:true});
const files = existsSync(resolve(source,'entries')) ? readdirSync(privateFile('entries')).sort() : [];
for (const file of files) {
  if (!file.endsWith('.md')) continue;
  const slug = file.slice(0,-3);
  const markdown = readFileSync(privateFile('entries/'+file),'utf8');
  const entry = parseEntry(markdown,slug);
  for (const path of [entry.cover,...(entry.gallery ?? []).map(item=>item.image)]) {
    const dest = path.slice(1);
    if (dest.startsWith('media/journal/')) {
      mkdirSync(dirname(dest),{recursive:true});
      copyFileSync(privateFile(dest),dest);
      usedUploads.add(dest);
    } else if (!existsSync(dest)) throw Error('Missing portfolio image: '+dest);
  }
  writeFileSync(resolve(entries,file),markdown);
  published.add(file);
}
for (const old of readdirSync(entries)) {
  if (!old.endsWith('.md') || published.has(old)) continue;
  const slug = old.slice(0,-3);
  parseEntry(readFileSync(resolve(entries,old),'utf8'),slug);
  unlinkSync(resolve(entries,old));
  const page = resolve('journal',slug,'index.html');
  if (existsSync(page)) unlinkSync(page);
}
if (existsSync('media/journal')) {
  for (const path of readdirSync('media/journal',{recursive:true,withFileTypes:true})) {
    if (!path.isFile()) continue;
    const dest = relative(process.cwd(),resolve(path.parentPath,path.name)).split(sep).join('/');
    if (!usedUploads.has(dest)) unlinkSync(dest);
  }
}
