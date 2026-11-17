// Dusk Patrol — site behaviour. No dependencies.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------------------------------------------------------------- nav
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --------------------------------------------- live hero: the game itself
  // The hero runs the real game in ?attract mode (no UI, no input, autopilot).
  // It fades in once the game reports it is flying, and pauses when scrolled away.
  const hero = $('.hero');
  const live = $('.hero-live');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 2;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  let liveStarted = false, heroVisible = true, cabinetOn = false;
  const tellHero = (msg) => { if (liveStarted && live.contentWindow) live.contentWindow.postMessage({ dusk: msg }, '*'); };
  const syncHero = () => tellHero(heroVisible && !cabinetOn && !document.hidden ? 'resume' : 'pause');
  if (live && !reduceMotion && !saveData && !lowMemory) {
    const start = () => { liveStarted = true; live.src = 'play/?attract'; };
    if (document.readyState === 'complete') setTimeout(start, 200);
    else window.addEventListener('load', () => setTimeout(start, 200), { once: true });
  }
  window.addEventListener('message', (e) => {
    if (live && e.source === live.contentWindow && e.data && e.data.dusk === 'ready') {
      document.body.classList.add('live-ready');
      syncHero();
    }
  });
  if ('IntersectionObserver' in window && hero) {
    new IntersectionObserver((entries) => { heroVisible = entries[0].isIntersecting; syncHero(); }, { threshold: 0.02 }).observe(hero);
  }
  document.addEventListener('visibilitychange', syncHero);

  // --------------------------------------------------------- pixel icons
  const PAL = {
    a: '#ffd7a2', b: '#f0aa8e', c: '#d1898a', d: '#785c8c', e: '#3a3160', f: '#71b8b1', g: '#2a7692',
    h: '#e94947', i: '#ff912f', j: '#ffcf49', k: '#a8ff98', l: '#ffaa40', m: '#776a7e', p: '#fff6ee', q: '#91899f',
  };
  const ICONS = {
    world: ['............', '......p.....', '.....ppq....', '....pqqqd...', '...dqqqddd..', '..ddqqdddde.', '.dddddddddde', 'ffffffffffff', 'fggfffggffgg', 'gggggggggggg', '............', '............'],
    ray: ['k...........', '.k..........', '..k.........', '...k........', '....k.......', '.....k......', '......k.....', '.......l....', '......dddd..', '....dddddddd', '..dddddddddd', 'dddddddddddd'],
    cloud: ['............', '....aaa.....', '...abbbaa...', '..abbbbbba..', '.aabbbbbbbaa', 'abbbbbbbbbbb', 'bbbbbbbbbbcc', 'cbbbbbbcccdd', 'ddccccccdddd', '.dddddddddd.', '............', '............'],
    gauge: ['...mmmmmm...', '..meeeeeem..', '.meaeeeeaem.', 'meeeeeeleeem', 'meeeeelleeem', 'maeeeeleeeam', 'meeeemeeeeem', 'meeeeeeeeeem', '.meaeeeeaem.', '..meeeeeem..', '...mmmmmm...', '............'],
    boom: ['....j..j....', '..j.jj.j..j.', '...jiiiij...', '.jjiiaaiijj.', '..iiaaaaiii.', 'jiiaapaaaiij', '.iiaaaaaaii.', '..iiaaaaii..', '.jjiiiiiijj.', '...hiihih...', '..h..h..h...', '............'],
    up: ['............', '.....kk.....', '....kkkk....', '...kk..kk...', '..kk....kk..', '.kk..kk..kk.', '.....kk.....', '....kkkk....', '...kk..kk...', '..kk....kk..', '.kk......kk.', '............'],
  };
  const svgNS = 'http://www.w3.org/2000/svg';
  $$('.icon[data-icon]').forEach((el) => {
    const rows = ICONS[el.dataset.icon];
    if (!rows) return;
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 12 12');
    svg.setAttribute('shape-rendering', 'crispEdges');
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length;) {
        const ch = row[x];
        let w = 1;
        while (x + w < row.length && row[x + w] === ch) w++;
        if (ch !== '.' && PAL[ch]) {
          const r = document.createElementNS(svgNS, 'rect');
          r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', w); r.setAttribute('height', 1); r.setAttribute('fill', PAL[ch]);
          svg.appendChild(r);
        }
        x += w;
      }
    });
    el.appendChild(svg);
  });

  // ------------------------------------------ palette ramps + dither lab
  const RAMPS = [
    ['Water', ['#111d3b', '#162d57', '#1a426c', '#205a80', '#2a7692', '#4694a2', '#71b8b1', '#a8dcc6']],
    ['Cloud', ['#3a3160', '#55467a', '#785c8c', '#a5708e', '#d1898a', '#f0aa8e', '#ffd2a6', '#fff0cf']],
    ['Orange', ['#3b2443', '#6b2c3b', '#a4452e', '#d66b2c', '#f39a3e']],
    ['Crimson', ['#321f3c', '#572039', '#872437', '#b53639', '#da5d49']],
    ['Gold', ['#41354f', '#76583b', '#ae8933', '#d9b33d', '#f3d977']],
    ['Conifer', ['#17192d', '#1f2a37', '#283f3e', '#355346', '#506d55']],
    ['Rock', ['#2b2741', '#47415d', '#69617d', '#91899f', '#beb2bf']],
    ['Snow', ['#76729e', '#9c98c2', '#c5bfde', '#eae2eb', '#fff6ee']],
    ['Flame', ['#892839', '#e14e2a', '#ff912f', '#ffcf49', '#fff2b3', '#ffffff']],
  ];
  const rampsEl = $('#ramps');
  if (rampsEl) {
    RAMPS.forEach(([name, cols]) => {
      const row = document.createElement('div');
      row.className = 'ramp-row';
      row.innerHTML = `<span>${name}</span><div>${cols.map((c) => `<i style="background:${c}" title="${c}"></i>`).join('')}</div>`;
      rampsEl.appendChild(row);
    });
  }
  const canvas = $('#dither-demo');
  const slider = $('#dither-width');
  const out = $('#dither-out');
  if (canvas && slider) {
    const ctx = canvas.getContext('2d');
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const ramp = RAMPS[1][1].map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
    const draw = () => {
      const dw = slider.value / 100;
      out.textContent = dw.toFixed(2);
      const W = canvas.width, H = canvas.height, img = ctx.createImageData(W, H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const v = x / (W - 1) * (ramp.length - 1);
        const b = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
        const f = Math.floor(v);
        const i = Math.min(ramp.length - 1, f + (v - f > 0.5 + (b - 0.5) * dw ? 1 : 0));
        const k = (y * W + x) * 4, c = ramp[i];
        img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    };
    slider.addEventListener('input', draw);
    draw();
  }

  // ----------------------------------------------------- play right here
  const cab = $('#cabinet');
  const fullBtn = $('#cab-full');
  let frame = null;
  if (cab) {
    $('.cabinet-start', cab).addEventListener('click', () => {
      frame = document.createElement('iframe');
      frame.src = 'play/';
      frame.title = 'Dusk Patrol';
      frame.allow = 'fullscreen; autoplay; gamepad';
      cab.appendChild(frame);
      cab.classList.add('on');
      cabinetOn = true;
      syncHero();
      // phones and tablets: free the hero's world so only one copy of the game lives in memory
      if (coarse && live && liveStarted) { live.remove(); liveStarted = false; document.body.classList.remove('live-ready'); }
      if (fullBtn) fullBtn.disabled = !document.fullscreenEnabled;
      frame.addEventListener('load', () => frame.focus());
    });
  }
  if (fullBtn) fullBtn.addEventListener('click', () => { if (frame && frame.requestFullscreen) frame.requestFullscreen().then(() => frame.focus()).catch(() => {}); });

  // ------------------------------------------------------------ lightbox
  const lb = $('#lightbox');
  const lbImg = $('img', lb);
  const lbCap = $('figcaption', lb);
  const shots = $$('.shot[data-full]');
  let idx = -1, lastFocus = null;
  const show = (i) => {
    idx = (i + shots.length) % shots.length;
    const s = shots[idx];
    lbImg.src = s.dataset.full;
    lbImg.alt = ($('img', s) || {}).alt || '';
    lbCap.textContent = s.dataset.caption || '';
  };
  const close = () => { lb.hidden = true; lbImg.removeAttribute('src'); if (lastFocus) lastFocus.focus(); };
  shots.forEach((s, i) => s.addEventListener('click', () => { lastFocus = s; show(i); lb.hidden = false; $('.lb-close', lb).focus(); }));
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lb-close')) close(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(idx + 1);
    else if (e.key === 'ArrowLeft') show(idx - 1);
  });
})();
