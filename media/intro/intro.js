(() => {
  'use strict';
  const intro = document.querySelector('#name-intro');
  if (!intro || location.hash || typeof intro.showModal !== 'function') return;
  const visitKey = 'seen-yohanan-intro';
  try { if (sessionStorage.getItem(visitKey)) return; } catch {}
  if (history.state?.seenYohanan) return;

  const title = intro.querySelector('h1');
  const canvas = intro.querySelector('canvas');
  const motion = intro.querySelector('.intro-motion');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const forcedColors = matchMedia('(forced-colors: active)');
  let paused = false;
  try { paused = sessionStorage.getItem('portfolio-motion') === 'paused'; } catch {}
  let visible = true, entered = false, exiting = false;
  let frame = 0, last = null, time = 0, exitTime = 0;
  let width, height, ratio, centerX, centerY, scale;
  let particles = [], dots, lines, painter;
  let pointer = null, previousPointer = null;
  let letterCount = 0;
  const formation = 2700, warp = 800;
  const events = new AbortController();
  const listen = (target, name, fn) => target.addEventListener(name, fn, {signal: events.signal});
  const limit = (n, min, max) => Math.max(min, Math.min(n, max));
  intro.showModal();

  // Sample the same word used by assistive technology. A fixed-size mask keeps
  // the letter geometry stable across viewport sizes and pixel densities.
  function sampleWord() {
    const mask = document.createElement('canvas');
    const ctx = mask.getContext('2d', {willReadFrequently: true});
    if (!ctx) throw Error('Text mask unavailable');
    const font = '500 160px Arial, sans-serif';
    ctx.font = font;
    const letters = [...title.textContent];
    const widths = letters.map(letter => ctx.measureText(letter).width + 6.4);
    mask.width = Math.ceil(widths.reduce((sum, w) => sum + w, 0));
    mask.height = 140;
    ctx.font = font;
    let offset = 0;
    letters.forEach((letter, i) => { ctx.fillText(letter, offset, 128); offset += widths[i]; });
    const ink = ctx.getImageData(0, 0, mask.width, mask.height).data;
    const inside = [];
    for (let i = 3; i < ink.length; i += 4) if (ink[i] > 160) inside.push((i - 3) / 4);
    return {inside, width: mask.width};
  }

  function makeParticles(mask) {
    const mobile = width < 660;
    letterCount = mobile ? 4600 : 12000;
    const haloCount = mobile ? 70 : 210;
    const fieldCount = mobile ? 44 : 145;
    const count = letterCount + haloCount + fieldCount;
    let seed = 7193;
    const random = () => { seed = Math.imul(1664525, seed) + 1013904223 | 0; return (seed >>> 0) / 4294967296; };
    particles = Array.from({length: count}, (_, i) => {
      const floating = i >= letterCount;
      const field = i >= letterCount + haloCount;
      const cell = mask.inside[Math.floor(random() * mask.inside.length)];
      const x = (cell % mask.width + random() - mask.width / 2);
      const y = (Math.floor(cell / mask.width) + random() - 70);
      // Most grains hold the ink core. A lighter population feathers the strokes.
      const feather = random() < .41 ? random() ** 2 * 42 : random() ** 4 * 3;
      const angle = random() * Math.PI * 2;
      const distance = .065 + random() ** .8 * .49;
      const haloDistance = floating ? 24 + random() * 112 : 0;
      return {
        field, floating,
        x: field ? random() : x + feather * (.45 + random() * .9) + Math.cos(angle) * haloDistance,
        y: field ? random() : y - feather * (.55 + random() * .7) + Math.sin(angle) * haloDistance,
        feather, phase: random() * Math.PI * 2, seed: random(),
        fromX: Math.cos(angle) * distance, fromY: Math.sin(angle) * distance,
        spread: random() * 2 - 1, depth: .55 + random() * 1.4,
        size: (.85 + random() * 1.8) * (feather > 10 ? .72 : 1),
        alpha: floating ? .19 + random() * .27 : (.52 + random() * .47) * (1 - feather / 63),
        drift: floating ? 9 + random() * 18 : 1 + feather * .46,
        rate: .22 + random() * .27,
        dx: 0, dy: 0, wakeX: 0, wakeY: 0
      };
    });
    dots = new Float32Array(count * 4);
    lines = new Float32Array(Math.ceil(count / 7) * 8);
  }

  function renderer(gl) {
    const program = gl.createProgram();
    function attach(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error('Shader unavailable');
      gl.attachShader(program, shader); gl.deleteShader(shader);
    }
    attach(gl.VERTEX_SHADER, `attribute vec4 grain;
      uniform vec2 viewport; uniform float dpr; varying float opacity; varying float turn;
      void main() {
        vec2 pos = grain.xy / viewport * 2.0 - 1.0;
        gl_Position = vec4(pos.x, -pos.y, 0.0, 1.0);
        gl_PointSize = max(1.0, grain.z * dpr * 2.8);
        turn = grain.z * 17.3;
        opacity = grain.w;
      }`);
    attach(gl.FRAGMENT_SHADER, `precision mediump float;
      uniform bool streak; varying float opacity; varying float turn;
      float fleck(vec2 p, vec2 offset, float size) {
        return 1.0 - smoothstep(size * .56, size, length(p - offset));
      }
      void main() {
        float coverage = 1.0;
        if (!streak) {
          vec2 uv = gl_PointCoord - .5;
          float c = cos(turn), s = sin(turn);
          vec2 p = mat2(c, -s, s, c) * uv;
          coverage = .22 * (1.0 - smoothstep(.08, .48, length(p)));
          coverage += fleck(p, vec2(0.0), .18);
          coverage += .84 * fleck(p, vec2(.19, .15), .12);
          coverage += .72 * fleck(p, vec2(-.21, .09), .11);
          coverage += .66 * fleck(p, vec2(.07, -.23), .095);
          coverage += .55 * fleck(p, vec2(-.2, -.19), .07);
          coverage = min(coverage, 1.0);
        }
        gl_FragColor = vec4(0.078, 0.078, 0.078, opacity * coverage);
      }`);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Particle renderer unavailable');
    const buffer = gl.createBuffer();
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const attr = gl.getAttribLocation(program, 'grain');
    gl.enableVertexAttribArray(attr);
    gl.vertexAttribPointer(attr, 4, gl.FLOAT, false, 0, 0);
    const viewport = gl.getUniformLocation(program, 'viewport');
    const dpr = gl.getUniformLocation(program, 'dpr'), streak = gl.getUniformLocation(program, 'streak');
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    return {
      draw(trails) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(viewport, width, height);
        gl.uniform1f(dpr, ratio);
        gl.uniform1i(streak, 0);
        gl.bufferData(gl.ARRAY_BUFFER, dots, gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.POINTS, 0, particles.length);
        if (trails) {
          gl.uniform1i(streak, 1);
          gl.bufferData(gl.ARRAY_BUFFER, lines, gl.DYNAMIC_DRAW);
          gl.drawArrays(gl.LINES, 0, trails * 2);
        }
      },
      dispose() { gl.deleteBuffer(buffer); gl.deleteProgram(program); }
    };
  }

  function draw(dt) {
    if (!painter) return;
    const clock = time * .001;
    const u = limit(time / formation, 0, 1), depart = exitTime / warp;
    const zoom = depart ** 2.25 * 17;
    const radius = limit(width * .060, 38, 84);
    // Sweep the segment between frames so a fast pass still brushes the strokes.
    const brush = !exiting && !paused && !reduced.matches ? pointer : null;
    const start = previousPointer || brush;
    const travelX = brush ? brush.x - start.x : 0;
    const travelY = brush ? brush.y - start.y : 0;
    const travelSquared = travelX * travelX + travelY * travelY;
    const dotScale = Math.max(.63, scale) * (width < 660 ? 1.23 : 1.36);
    // The wake outlasts contact. Grains ease towards it and coast back as it fades.
    const wakeDecay = Math.exp(-dt / 310);
    const follow = 1 - Math.exp(-dt / 205);
    let trails = 0;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const progress = limit((u - p.seed * .15) / (1 - p.seed * .15), 0, 1);
      const loose = (1 - progress) ** 2.35;
      const phase = clock * p.rate + p.phase;
      const wander = p.drift * (p.field ? 1 : scale);
      const driftX = wander * (Math.sin(phase) + .34 * Math.cos(phase * .69 + p.seed * 8));
      const driftY = wander * (.82 * Math.cos(phase * .87 + p.phase) + .26 * Math.sin(phase * 1.43));
      let x = (p.field ? p.x * width : centerX + p.x * scale + p.fromX * width * loose) + driftX;
      let y = (p.field ? p.y * height : centerY + p.y * scale + p.fromY * height * loose) + driftY;
      if (!p.field && loose > .001) y += Math.sin(progress * Math.PI + p.phase) * height * .045 * loose;

      p.wakeX *= wakeDecay;
      p.wakeY *= wakeDecay;
      if (brush) {
        const along = travelSquared ? limit(((x - start.x) * travelX + (y - start.y) * travelY) / travelSquared, 0, 1) : 0;
        const offX = x - (start.x + along * travelX);
        const offY = y - (start.y + along * travelY);
        const distanceSquared = offX * offX + offY * offY;
        if (distanceSquared < radius * radius) {
          const distance = Math.sqrt(distanceSquared);
          const strength = (1 - distance / radius) ** 1.45 * radius * (.26 + .20 * p.seed);
          const nx = distance > 1 ? offX / distance : Math.cos(p.phase);
          const ny = distance > 1 ? offY / distance : Math.sin(p.phase);
          // A little sideways variation breaks up the edge of the ripple.
          if (strength * strength >= p.wakeX * p.wakeX + p.wakeY * p.wakeY) {
            const bend = .28 * p.spread;
            p.wakeX = strength * (nx - ny * bend);
            p.wakeY = strength * (ny + nx * bend);
          }
        }
      }
      p.dx += (p.wakeX - p.dx) * follow;
      p.dy += (p.wakeY - p.dy) * follow;
      x += p.dx; y += p.dy;
      if (exiting) {
        const vx = x - centerX + p.spread * depart * width * .09;
        const vy = y - centerY + Math.sin(p.phase) * depart * height * .28;
        x = centerX + vx * (1 + zoom * p.depth);
        y = centerY + vy * (1 + zoom * p.depth);
        if (i % 7 === 0) {
          const j = trails++ * 8, tail = zoom * .24 * p.depth;
          lines[j] = x - vx * tail; lines[j+1] = y - vy * tail;
          lines[j+2] = 1; lines[j+3] = 0;
          lines[j+4] = x; lines[j+5] = y; lines[j+6] = 1;
          lines[j+7] = Math.min(.63, depart * 2) * p.alpha;
        }
      }
      const j = i * 4;
      dots[j] = x; dots[j+1] = y; dots[j+2] = p.size * (p.floating ? Math.max(.85, dotScale * .65) : dotScale);
      dots[j+3] = p.alpha * (.36 + .64 * (1 - loose)) * (1 - depart * .8);
    }
    previousPointer = brush;
    painter.draw(trails);
  }
  let mask;
  function resize() {
    if (!painter) return;
    const rect = intro.getBoundingClientRect();
    width = rect.width; height = rect.height;
    if (!width || !height) return;
    ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const word = title.getBoundingClientRect();
    centerX = word.left - rect.left + word.width / 2;
    centerY = word.top - rect.top + word.height / 2;
    scale = word.width / mask.width;
    previousPointer = null;
    if (letterCount !== (width < 660 ? 4600 : 12000)) makeParticles(mask);
    draw(0);
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0; last = null; previousPointer = null;
  }
  function schedule() {
    if (frame || entered || !visible || document.hidden || !painter || reduced.matches || forcedColors.matches || paused) return;
    frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    frame = 0;
    const dt = last === null ? 0 : now - last;
    last = now;
    if (exiting) exitTime = Math.min(warp, exitTime + dt);
    else time += dt;
    if (time >= formation) intro.classList.remove('forming');
    draw(Math.min(dt, 80));
    if (exiting) {
      intro.style.opacity = 1 - limit((exitTime / warp - .25) / .75, 0, 1) ** 1.4;
      if (exitTime >= warp) { finish(); return; }
    }
    schedule();
  }
  function finish() {
    if (entered) return;
    entered = true; stop(); events.abort(); observer.disconnect(); sizeObserver.disconnect();
    painter?.dispose();
    try { sessionStorage.setItem(visitKey, '1'); } catch {}
    try { history.replaceState({...history.state, seenYohanan:true}, ''); } catch {}
    intro.close(); intro.remove();
    document.querySelector('#main')?.focus({preventScroll:true});
  }
  function crossfade() {
    stop();
    if (!intro.animate) { finish(); return; }
    const fade = intro.animate([{opacity:getComputedStyle(intro).opacity}, {opacity:0}], {duration:180, fill:'forwards'});
    fade.onfinish = finish;
  }
  function enter() {
    if (exiting || entered) return;
    exiting = true; pointer = null; last = null;
    intro.classList.add('leaving');
    if (!painter || paused || reduced.matches || forcedColors.matches) crossfade();
    else schedule();
  }
  function syncPause() {
    motion.hidden = !painter || reduced.matches || forcedColors.matches;
    const label = paused ? 'Resume particles' : 'Pause particles';
    motion.setAttribute('aria-label', label);
    motion.title = label;
    if (paused || reduced.matches || forcedColors.matches) {
      stop();
      if (reduced.matches || forcedColors.matches) {
        time = Math.max(time, formation); pointer = null;
        intro.classList.remove('forming'); draw(0);
      }
      if (exiting) crossfade();
    } else schedule();
  }
  listen(motion, 'click', event => {
    event.stopPropagation();
    if (exiting) return;
    paused = !paused; pointer = null; syncPause();
  });
  listen(intro, 'click', event => {
    if (!event.target.closest('.intro-motion') && !window.getSelection()?.toString()) enter();
  });
  listen(intro, 'keydown', event => {
    if (event.target.closest('button')) return;
    if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); enter();}
  });
  listen(intro, 'cancel', event => {event.preventDefault(); enter();});
  listen(intro, 'pointermove', event => {
    if (event.pointerType !== 'touch' && !paused) pointer = {x:event.clientX,y:event.clientY};
  });
  listen(intro, 'pointerleave', () => {pointer = previousPointer = null;});
  listen(document, 'visibilitychange', () => {if (document.hidden) stop(); else schedule();});
  listen(reduced, 'change', syncPause);
  listen(forcedColors, 'change', syncPause);
  listen(canvas, 'webglcontextlost', () => {
    stop(); painter = null; intro.classList.remove('has-particles','forming'); motion.hidden = true;
    if (exiting) crossfade();
  });
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) schedule(); else stop();
  });
  const sizeObserver = new ResizeObserver(resize);
  observer.observe(intro);
  sizeObserver.observe(intro);
  try {
    const gl = canvas.getContext('webgl', {alpha:true, antialias:false, premultipliedAlpha:true, depth:false, stencil:false});
    if (gl) {
      mask = sampleWord(); painter = renderer(gl);
      time = reduced.matches || paused || forcedColors.matches ? formation : 0;
      resize(); intro.classList.add('has-particles');
      intro.classList.toggle('forming', time < formation);
    }
  } catch { painter?.dispose(); painter = null; }
  syncPause();
})();
