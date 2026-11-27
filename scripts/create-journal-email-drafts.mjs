import { readFileSync } from 'node:fs';
import { parseEntry } from '../journal.mjs';

const source = process.argv[2];
const slugs = process.argv.slice(3);
const token = process.env.MAILERLITE_API_TOKEN?.replace(/\s+/g, '');
if (!source || !token) throw Error('Writing source and MAILERLITE_API_TOKEN are required');

const site = 'https://abramseneca.vercel.app';
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

async function mailerLite(path, options = {}) {
  const response = await fetch('https://connect.mailerlite.com/api' + path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' }
  });
  const result = await response.json();
  if (!response.ok) throw Error(`MailerLite ${response.status}: ${JSON.stringify(result)}`);
  return result;
}

for (const slug of slugs) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw Error('Invalid Journal slug');
  const entry = parseEntry(readFileSync(`${source}/entries/${slug}.md`, 'utf8'), slug);
  const marker = `Yohanan Times / ${slug}`;
  const matches = await Promise.all(['draft', 'ready', 'sent'].map(status =>
    mailerLite(`/campaigns?filter[status]=${status}&filter[subject]=${encodeURIComponent(entry.title)}`)));
  if (matches.some(listed => listed.data?.some(campaign => campaign.name === marker))) {
    console.log(`Draft already exists for ${slug}`);
    continue;
  }

  const link = `${site}/journal/${slug}/`;
  const image = site + entry.cover.split('/').map(encodeURIComponent).join('/');
  const content = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f5f2eb;color:#211e19"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fffdf8"><tr><td><img src="${site}/media/newsletter/banner.png" width="600" style="width:100%;height:auto;display:block" alt="Yohanan Times"></td></tr><tr><td style="padding:28px 28px 10px;border-top:4px double #28251e;font:12px Arial;color:#704b26;letter-spacing:1px">YOHANAN TIMES &nbsp; / &nbsp; ${escape(entry.category.toUpperCase())}</td></tr><tr><td style="padding:0 28px"><h1 style="font:bold 40px/1.1 Georgia,serif;margin:6px 0 12px">${escape(entry.title)}</h1><p style="font:13px Arial;color:#655e55;margin:0 0 22px">${escape(entry.dateLabel)} · ${entry.minutes} min read</p><img src="${image}" width="544" style="width:100%;height:auto;display:block" alt="${escape(entry.alt)}"><p style="font:18px/1.6 Georgia,serif">${escape(entry.excerpt)}</p><a href="${link}" style="background:#23211d;color:#fff;padding:14px 20px;display:inline-block;font:bold 15px Arial;text-decoration:none">Read on Yohanan Times →</a><p style="margin:28px 0 12px;font:17px Georgia,serif">Best regards,</p><table role="presentation" cellspacing="0" cellpadding="0"><tr><td><img src="${site}/media/newsletter/signature.png" width="54" height="54" alt="Y."></td><td style="padding-left:12px;font:14px/1.5 Arial"><strong>Abram Seneca</strong><br>Yohanan Times · The Good Apple<br><a style="color:#654421" href="${site}/journal/">Visit the Journal</a></td></tr></table></td></tr><tr><td style="padding:26px 28px;font:12px/1.6 Arial;color:#645e56">You’re receiving this email because you subscribed to Yohanan Times.<br><a style="color:#504636" href="{$unsubscribe}">Unsubscribe</a><br>{$account} · {$address}</td></tr></table></td></tr></table></body></html>`;
  const campaign = await mailerLite('/campaigns', {
    method: 'POST',
    body: JSON.stringify({ name: marker, type: 'regular', groups: ['205261432623728383'], emails: [{ subject: entry.title, from_name: 'Yohanan Times · Abram Seneca', from: 'abram.yohanan@gmail.com', content }] })
  });
  console.log(`Created MailerLite draft ${campaign.data?.id} for ${slug}`);
}


