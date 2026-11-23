// The artwork is generated at build time. Each depth plane can move as a group.
const repeat = (count, draw) => Array.from({ length: count }, (_, i) => draw(i)).join('');

function supportField() {
  return repeat(18, i => {
    const radius = 202 + i * 8;
    const height = 88 + (i % 6) * 32;
    const tilt = (i * 23) % 160 - 80;
    return `<g transform="rotate(${tilt})">
      <ellipse rx="${radius}" ry="${height}" pathLength="100" stroke-dasharray="${62 + i % 20} 100"/>
      <ellipse rx="${radius + 4}" ry="${height + 4}" pathLength="100" stroke-dasharray="32 10 6 52"/>
      <ellipse rx="${radius + 10}" ry="${height + 10}" opacity=".45"/>
    </g>`;
  });
}

function spokes() {
  let angle = 0;
  return repeat(38, i => {
    // Each 19-spoke pattern covers half a turn, with one wider service gap.
    const rotation = angle;
    angle += [22,12,10,8,8,8,8,8,8,8,8,8,8,8,8,8,8,14,10][i % 19];
    const outer = [150,250,320][(i * 5) % 3];
    const inner = 63 + (i * 31) % 76;
    const tone = i % 10 < 2 ? 'signal' : i % 10 < 5 ? 'secondary' : 'support';
    return `<path class="${tone}" transform="rotate(${rotation})" stroke-width="${[.5,1,1.5][i % 3]}" d="M${inner} 0H${outer}m3 -3v6"/>`;
  });
}

function satellites(start, count) {
  return repeat(count, i => {
    const id = start + i;
    const angle = id * 137.508 * Math.PI / 180;
    const distance = 320 + (id * 67) % 161;
    const x = (Math.cos(angle) * distance).toFixed(1);
    const y = (Math.sin(angle) * distance).toFixed(1);
    const r = 2 + id % 7;
    const marks = [
      `<path d="M-${r + 12} 0h12"/><circle r="${r}"/>`,
      `<circle r="${r}"/><circle r="${(r / 2).toFixed(1)}"/>`,
      `<path d="M0 -${r}a${r} ${r} 0 1 0 0 ${2 * r}z" fill="currentColor"/>`,
    ];
    return `<g transform="translate(${x} ${y})"><g${id % 8 === 0 ? ' class="node-pulse"' : ''}>${marks[id % 3]}</g></g>`;
  });
}

export function reactorBackdrop() {
  return `<div class="reactor-backdrop" aria-hidden="true">
    <svg class="reactor" viewBox="0 0 1000 1000" fill="none" focusable="false">
      <defs><filter id="core-bloom" x="-200%" y="-200%" width="500%" height="500%">
        <feGaussianBlur stdDeviation="3"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter></defs>
      <g transform="translate(500 500)">
        <g class="support-field">${supportField()}</g>
        <g class="anchor secondary">
          <circle r="354" stroke-width=".8"/><circle r="350" stroke-dasharray="2 13"/>
          <circle r="307" pathLength="360" stroke-dasharray="66 12 3 8 25 66" stroke-width="2"/>
          <circle r="284" pathLength="360" stroke-dasharray=".5 2.5" stroke-width="6"/>
        </g>
        <g class="spokes">${spokes()}</g>
        <g class="satellites">${satellites(0,20)}<g class="satellite-drift">${satellites(20,28)}</g></g>
        <g transform="rotate(35)"><g class="tilted-orbit">
          <ellipse class="secondary" rx="450" ry="180" stroke-width="2.5" stroke-dasharray="400 600"/>
          <ellipse class="support" rx="454" ry="184" stroke-width=".8"/>
          <ellipse class="energy-packet signal" rx="458" ry="188" stroke-width=".8" stroke-dasharray="60 340"/>
          ${repeat(2, i => `<g transform="rotate(${i * 180})">${repeat(3, j => `<rect class="signal-fill" x="${439 + j * 10}" y="-10" width="8" height="20"/>`)}</g>`)}
        </g></g>
        <g class="gyro">
          <circle class="signal" r="130" stroke-width="2" stroke-dasharray="80 40"/>
          <circle class="secondary" r="121" stroke-dasharray="2 7" stroke-width="5"/>
          <circle class="support" r="142" stroke-dasharray="140 15 6 32"/>
          ${[30,60,90,145,215,285].map((a,i) => `<g transform="rotate(${a})"><rect class="shutter" x="126" y="-5" width="${i % 2 ? 6 : 8}" height="${i % 2 ? 12 : 10}" style="--delay:-${i}s"/></g>`).join('')}
        </g>
        <g class="nucleus"><circle class="nucleus-shell" r="32" stroke-width="1.5"/>
          <circle class="secondary" r="20" stroke-width=".5" opacity=".5"/><path class="signal" d="M0 -29v5M24 0h5"/>
          <circle class="signal-fill" r="4.5" filter="url(#core-bloom)"/>
        </g>
        <g class="callouts">
          <path d="M-19 -18l-60 -60h-64M290 -199l25 -25h65"/>
          <text x="-145" y="-86">NUCLEUS</text><text x="317" y="-231">R 354</text>
        </g>
      </g>
    </svg>
  </div>`;
}

export function typedHeading(lines, id) {
  let offset = 0;
  const markup = lines.map(line => {
    const delay = offset * 50;
    offset += line.length;
    return `<span class="type-line" aria-hidden="true" style="--count:${line.length};--duration:${line.length * 50}ms;--delay:${delay}ms"><span>${line}</span></span>`;
  }).join(' ');
  return `<h1 class="typed-headline"${id ? ` id="${id}"` : ''} aria-label="${lines.join(' ')}">${markup}</h1>`;
}
