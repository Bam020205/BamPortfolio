import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { parse } from 'yaml';

// Export only the published fields and media referenced by the private CMS entries.
const source = realpathSync(process.argv[2]);
const index = 'content/portfolio.json';
const config = parse(readFileSync('admin/editor/config.yml', 'utf8'));
const uploads = new Map();
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const previous = existsSync(index) ? JSON.parse(readFileSync(index, 'utf8')) : { projects: [] };
function privatePath(path) {
  const result = resolve(source, path);
  if (realpathSync(result) !== result || !result.startsWith(source + sep))
    throw Error('Invalid private path: ' + path);
  return result;
}
function media(path, field) {
  if (
    !path.startsWith('/media/') ||
    path
      .slice(1)
      .split('/')
      .some((part) => !part || part.startsWith('.') || /[\\:%?#\x00-\x1f]/.test(part))
  )
    throw Error('Invalid media path: ' + path);
  const extension =
    field.widget === 'image'
      ? /\.(avif|gif|jpe?g|png|webp)$/i
      : field.name === 'attachment'
        ? /\.(avif|gif|jpe?g|png|webp|pdf)$/i
        : /\.(mp4|webm)$/i;
  if (!extension.test(path)) throw Error('Unsupported file type for ' + field.label + ': ' + path);
  const destination = path.slice(1);
  if (path.startsWith('/media/portfolio/')) uploads.set(destination, privatePath(destination));
  else if (!existsSync(destination) || realpathSync(destination) !== resolve(destination))
    throw Error('Missing existing portfolio media: ' + path);
  return path;
}
function fieldValue(value, field, where) {
  const label = where + ' → ' + field.label;
  if (value == null || value === '') {
    if ('default' in field) return field.default;
    if (field.required !== false) throw Error('Missing ' + label);
    return undefined;
  }
  if (field.widget === 'list') {
    if (!Array.isArray(value)) throw Error('Expected a list for ' + label);
    return value.map((item, i) =>
      field.field ? fieldValue(item, field.field, label) : fields(item, field.fields, label + ' ' + (i + 1)),
    );
  }
  if (field.widget === 'boolean') {
    if (typeof value !== 'boolean') throw Error('Expected a switch for ' + label);
    return value;
  }
  if (typeof value !== 'string' || !value.trim()) throw Error('Expected text for ' + label);
  value = value.trim();
  if (field.pattern && !new RegExp(field.pattern[0]).test(value)) throw Error('Invalid ' + label);
  if (field.widget === 'select' && !field.options.some((option) => (option.value ?? option) === value))
    throw Error('Unknown ' + label);
  if (field.widget === 'relation' && !slugPattern.test(value)) throw Error('Invalid link in ' + label);
  if (field.name === 'date') {
    const day = (value + '-01-01').slice(0, 10);
    if (!Number.isFinite(Date.parse(day)) || new Date(day).toISOString().slice(0, 10) !== day)
      throw Error('Invalid date in ' + label);
  }
  if (field.widget === 'image' || field.widget === 'file') return media(value, field);
  return value;
}
function fields(record, schema, where) {
  const result = {};
  for (const field of schema) {
    const value = fieldValue(record[field.name], field, where);
    if (value !== undefined) result[field.name] = value;
  }
  return result;
}
function readRecord(path, schema) {
  const result = fields(JSON.parse(readFileSync(privatePath(path), 'utf8')), schema, path);
  if (result.cover && !result.alt) result.alt = result.title;
  return result;
}
function entries(name) {
  const schema = config.collections.find((c) => c.name === name).fields;
  // A Git checkout has no directory when the last entry has been removed.
  const dir = resolve(source, name);
  return (existsSync(dir) ? readdirSync(privatePath(name)) : [])
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => {
      const slug = file.slice(0, -5);
      if (!slugPattern.test(slug)) throw Error('Invalid entry slug: ' + slug);
      return { slug, ...readRecord(name + '/' + file, schema) };
    });
}
const settingsSchema = config.collections.find((c) => c.name === 'settings').files[0];
const data = {
  projects: entries('projects'),
  experiences: entries('experiences'),
  settings: readRecord(settingsSchema.file, settingsSchema.fields),
};
for (const [dest, original] of uploads) {
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(original, dest);
}
for (const entry of previous.projects) {
  if (!slugPattern.test(entry.slug)) throw Error('Invalid previous project slug');
  if (!data.projects.some((p) => p.slug === entry.slug)) {
    const page = resolve('projects', entry.slug, 'index.html');
    if (existsSync(page)) unlinkSync(page);
  }
}
const mediaDir = 'media/portfolio';
if (existsSync(mediaDir)) {
  for (const entry of readdirSync(mediaDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const dest = relative(process.cwd(), resolve(entry.parentPath, entry.name)).split(sep).join('/');
    if (!uploads.has(dest)) unlinkSync(dest);
  }
}
mkdirSync(dirname(index), { recursive: true });
writeFileSync(index, JSON.stringify(data, null, 2) + '\n');
