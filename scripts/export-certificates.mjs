import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve, relative, sep, isAbsolute } from 'node:path';
import { execFileSync } from 'node:child_process';

const source = realpathSync(process.argv[2]);
const folder = 'media/credentials';
const index = 'certifications/records.json';
const previous = existsSync(index) ? JSON.parse(readFileSync(index, 'utf8')) : [];
const used = new Set();

function sourcePath(path) {
  const file = realpathSync(resolve(source, path));
  const rel = relative(source, file);
  if (rel.startsWith('..' + sep) || isAbsolute(rel) || file !== resolve(source, path)) throw Error('Invalid source path: ' + path);
  return file;
}

function readCertificate(filename) {
  const input = JSON.parse(readFileSync(sourcePath('certificates/' + filename), 'utf8'));
  for (const key of ['title', 'issuer', 'type', 'date', 'file']) {
    if (typeof input[key] !== 'string' || !input[key].trim()) throw Error(filename + ': missing ' + key);
  }
  const { title, issuer, type, date, file, credential_id, verification } = input;
  const day = date.length === 7 ? date + '-01' : date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(Date.parse(day)) || new Date(day).toISOString().slice(0,10) !== day) throw Error('Invalid date in ' + filename);
  if (verification && !['https:', 'http:'].includes(new URL(verification).protocol)) throw Error('Invalid verification URL in ' + filename);
  if (!file.startsWith('/' + folder + '/') || !/\.(?:pdf|jpe?g|png|webp|avif|gif)$/i.test(file) ||
      file.slice(1).split('/').some(part => !part || part.startsWith('.') || /[\\:\x00-\x1f]/.test(part))) throw Error('Invalid upload in ' + filename);
  const dest = file.slice(1);
  const original = sourcePath(dest);
  const changed = !existsSync(dest) || !readFileSync(original).equals(readFileSync(dest));
  mkdirSync(dirname(dest), { recursive: true });
  if (changed) copyFileSync(original, dest);
  used.add(file);
  const record = { title, issuer, type, date, file, credential_id, verification };
  if (/\.pdf$/i.test(file)) {
    const prefix = 'media/certificate-previews/' + filename.slice(0, -5);
    mkdirSync(dirname(prefix), { recursive: true });
    record.thumbnail = '/' + prefix + '.png';
    const existing = previous.find(item => item.thumbnail === record.thumbnail);
    if (changed || existing?.file !== file || !existsSync(prefix + '.png')) {
      execFileSync('pdftoppm', ['-f','1','-l','1','-singlefile','-scale-to','720','-png',dest,prefix]);
    }
    used.add(record.thumbnail);
  }
  return record;
}

const files = readdirSync(sourcePath('certificates')).filter(name => name.endsWith('.json')).sort();
const records = files.map(readCertificate).sort((a,b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
for (const record of previous) {
  for (const path of [record.file, record.thumbnail]) {
    if (path && !used.has(path) && existsSync(path.slice(1))) unlinkSync(path.slice(1));
  }
}
writeFileSync(index, JSON.stringify(records, null, 2) + '\n');
