// Random events A: fire, faint, stampede, cookies, blackout. Loaded after index.html's main script.
(function(){
  const EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.random() * a.length | 0];
  const chs = () => Object.values(chars);
  const mkElf = (x, y, i, color, way) => ({x, y, hop: i * 2.1, face: 1, color, carry: false, way, i: 0});
  // move along waypoints [[x,y],...]; returns true when the last one is reached
  function follow(e, dt, sp){
    if (e.i >= e.way.length) return true;
    const [tx, ty] = e.way[e.i], dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy), st = sp * dt;
    if (Math.abs(dx) > 1) e.face = Math.sign(dx);
    if (d > st){ e.x += dx / d * st; e.y += dy / d * st; return false; }
    e.x = tx; e.y = ty; e.i++; return e.i >= e.way.length;
  }
  const inWay = d => [[d.ox, d.oy], [d.ix, d.iy]];
  const outWay = d => [[d.ix, d.iy], [d.ox, d.oy]];
  function helmet(e){
    ctx.fillStyle = '#e02a2a'; ctx.beginPath(); ctx.arc(e.x, e.y - 11, 7.5, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#b81c1c'; ctx.fillRect(e.x - 9, e.y - 11, 18, 2.5);
    ctx.fillStyle = '#ffd34d'; ctx.fillRect(e.x - 1.5, e.y - 17, 3, 4);
  }
  function flash(d){ d.flash = 1; }

  // ---------- 1. FIRE ----------
  function flames(x, y, I, now){
    for (let k = 0; k < 6; k++){
      const ph = now / 120 + k * 1.9, h = (22 + 16 * Math.sin(ph) + k % 3 * 8) * I, w = (7 + k % 2 * 3) * I, ox = (k - 2.5) * 9 * I,
            sw = Math.sin(ph * 1.3) * 5 * I;
      for (const [col, sc] of [['#ff6a1a', 1], ['#ffd34d', .55]]){
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x + ox - w * sc, y);
        ctx.quadraticCurveTo(x + ox - w * sc, y - h * sc * .6, x + ox + sw * sc, y - h * sc);
        ctx.quadraticCurveTo(x + ox + w * sc, y - h * sc * .6, x + ox + w * sc, y); ctx.fill();
      }
    }
  }
  EVENTS.push({ name: 'fire',
    start(now){
      const ds = Object.values(desks); if (!ds.length) return null;
      const d = pick(ds), door = nearestDoor(d.x, d.y), owner = chs().find(c => c.d === d);
      log(`🔥 Fire at ${d.name}!`, 'g'); if (owner) curse(owner, now, true); flash(door);
      const els = [0, 1, 2].map(i => mkElf(door.ox - 20 * i * Math.sign(door.ix - door.ox || 1), door.oy - 20 * i * Math.sign(door.iy - door.oy || 1), i, '#2f6fd0',
        [...inWay(door), [d.x - 55 + i * 55, d.y + d.h / 2 + 58]]));
      return {d, door, els, t: 0, spray: 0, phase: 'in', ps: [], sm: [], puddle: 0, I: 0, leave: false};
    },
    update(st, dt, now){
      st.t += dt; const {d, els} = st, fx = d.x, fy = d.y + 6;
      if (st.phase === 'in'){ st.I = Math.min(1, st.t / 1.2); let all = true;
        for (const e of els) if (!follow(e, dt, 210)) all = false; if (all) st.phase = 'spray'; }
      else if (st.phase === 'spray'){ st.spray += dt; st.I = Math.max(0, 1 - st.spray / 4);
        for (const e of els){ e.face = Math.sign(fx - e.x) || 1;
          if (Math.random() < dt * 40){ const T = .35;
            st.ps.push({x: e.x + e.face * 10, y: e.y - 4, vx: (fx - e.x) / T + rnd(-25, 25), vy: (fy - 12 - e.y) / T + rnd(-25, 25), l: T}); } }
        if (st.I <= 0){ st.phase = 'out'; st.out = 0; st.puddle = 1; els.forEach(e => { e.way = outWay(st.door); e.i = 0; }); } }
      else { st.out += dt; st.puddle = Math.max(0, 1 - st.out / 4); let all = true; for (const e of els) if (!follow(e, dt, 230)) all = false;
        if (all && st.puddle <= 0) return false; }
      for (const p of st.ps){ p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; } st.ps = st.ps.filter(p => p.l > 0);
      if (Math.random() < dt * 25 * st.I) st.sm.push({x: fx + rnd(-14, 14), y: fy - 20, r: 6, l: 1.6, m: 1.6});
      for (const s of st.sm){ s.y -= 38 * dt; s.x += Math.sin(s.l * 4) * 8 * dt; s.r += 9 * dt; s.l -= dt; } st.sm = st.sm.filter(s => s.l > 0);
    },
    floor(st){ if (st.puddle > 0){ ctx.fillStyle = `rgba(80,150,230,${.45 * Math.min(1, st.puddle * 2)})`;
      ctx.beginPath(); ctx.ellipse(st.d.x, st.d.y + st.d.h / 2 + 24, 60, 18, 0, 0, 7); ctx.fill(); } },
    sprites(st, now){ return st.els.map(e => ({y: e.y + 18, draw(){ drawElf(e, now); helmet(e); }})); },
    draw(st, now){
      for (const s of st.sm){ ctx.fillStyle = `rgba(60,60,66,${.4 * s.l / s.m})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill(); }
      if (st.I > .02) flames(st.d.x, st.d.y + 6, st.I, now);
      ctx.fillStyle = 'rgba(150,210,255,.9)'; for (const p of st.ps){ ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, 7); ctx.fill(); }
    } });

  // ---------- 2. FAINT ----------
  function lying(v, now, onStretcher){
    ctx.save(); ctx.translate(v.x, v.y); ctx.rotate(v.ang);
    if (v.c){ ctx.fillStyle = (typeof BODY !== 'undefined' && BODY[v.c.a.id]) || '#777'; ctx.fillRect(-9, -22, 18, 22);
      ctx.font = '22px ' + EMOJI; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(v.c.a.icon || '🙂', 0, -32); ctx.textBaseline = 'alphabetic'; }
    else drawElf({x: 0, y: 0, big: false, hop: 0, face: 1, color: '#2f9e66', carry: false}, 0);
    ctx.restore();
    if (!onStretcher || true){ ctx.font = '14px ' + EMOJI; ctx.textAlign = 'center';
      for (let k = 0; k < 3; k++){ const a = now / 220 + k * 2.09; ctx.fillText('⭐', v.x + Math.cos(a) * 18 + 10, v.y - 18 + Math.sin(a) * 6); } }
  }
  EVENTS.push({ name: 'faint',
    start(now){
      const idle = chs().filter(c => c.status !== 'work' && c.state === 'wander' && c.y > 0);
      const c = idle.length && Math.random() < .6 ? pick(idle) : null;
      const door = nearestDoor(c ? c.x : rnd(300, 1100), c ? c.y : 480);
      const x = c ? c.x : rnd(300, W - 300), y = c ? c.y : rnd(WALL + 120, H - 160);
      if (c){ c.moving = false; c.y = -999; }
      log(`😵 ${c ? c.a.name : 'A courier elf'} fainted from overwork!`, 'g'); flash(door);
      return {c, door, v: {x, y, ang: 0, c}, phase: 'fall', t: 0,
        P: {x: door.ox, y: door.oy, way: [[door.ix, door.iy], [x, y + 26]], i: 0, face: 1}, hx: x, hy: y};
    },
    update(st, dt, now){
      st.t += dt; const {c, v, P} = st; if (c){ c.wait = 1e9; c.y = -999; }
      if (st.phase === 'fall'){ v.ang = Math.min(Math.PI / 2, st.t / .5 * Math.PI / 2); if (st.t > 1.2) st.phase = 'in'; }
      else if (st.phase === 'in'){ if (follow(P, dt, 170)){ st.phase = 'load'; st.t = 0; } }
      else if (st.phase === 'load'){ if (st.t > 1){ st.phase = 'out'; P.way = [[P.x, P.y], [st.door.ix, st.door.iy], [st.door.ox, st.door.oy]]; P.i = 0; } }
      else if (st.phase === 'out'){ const fin = follow(P, dt, 120); v.x = P.x; v.y = P.y - 14;
        if (fin){ st.phase = 'wait'; st.t = 0; v.hidden = true; } }
      else { if (st.t > 1.3){ if (c){ c.x = st.door.ox; c.y = st.door.oy; c.tx = st.door.ix; c.ty = st.door.iy; c.state = 'wander'; c.wait = .5; c.moving = false; flash(st.door); }
        return false; } }
    },
    sprites(st, now){
      const {v, P} = st, out = [];
      if (!v.hidden) out.push({y: v.y + 20, draw(){ lying(v, now, st.phase === 'out'); }});
      if (st.phase === 'in' || st.phase === 'load' || st.phase === 'out'){
        const f = P.face || 1;
        for (const s of [-1, 1]) out.push({y: P.y + 22, draw(){ const e = {x: P.x + s * 24, y: P.y, hop: s, face: P.face, color: '#f4f4f4', carry: false};
          drawElf(e, now); ctx.fillStyle = '#d22'; ctx.fillRect(e.x - 1.5, e.y - 2, 3, 8); ctx.fillRect(e.x - 4, e.y + 1, 8, 2.4); }});
        out.push({y: P.y + 30, draw(){ ctx.fillStyle = '#8a6a44'; ctx.fillRect(P.x - 24, P.y + 8, 48, 6); ctx.fillStyle = '#e8e4d8'; ctx.fillRect(P.x - 22, P.y + 4, 44, 5); }});
      }
      return out;
    } });

  // ---------- 3. STAMPEDE ----------
  EVENTS.push({ name: 'stampede',
    start(now){
      log('🦌 Reindeer stampede through the office!', 'g');
      const door = DOORS[2], n = 3 + (Math.random() < .5 ? 1 : 0), deer = [];
      for (let i = 0; i < n; i++) deer.push({x: door.ox - 60 - i * 170, y: 430 + (i - n / 2) * 34 + rnd(-8, 8), sp: rnd(300, 360), ph: i * 1.7});
      flash(door); return {deer, off: new Map(), hopT: new Map(), dust: [], cursed: false, t: 0};
    },
    update(st, dt, now){
      st.t += dt; let alive = false;
      for (const r of st.deer){ r.x += r.sp * dt; if (r.x < W + 80) alive = true;
        if (Math.random() < dt * 30 && r.x > 0 && r.x < W) st.dust.push({x: r.x - 20, y: r.y + 20, r: 5, l: .6});
        for (const c of chs()){ if (c.y < 0 || st.hopT.has(c)) continue;
          if (Math.hypot(c.x - r.x, c.y - r.y) < 60){ st.hopT.set(c, 0); if (!st.cursed){ st.cursed = true; curse(c, now, true); } } } }
      for (const [c, t] of st.hopT){ const nt = t + dt, prev = st.off.get(c) || 0, o = nt < .5 ? -Math.sin(nt / .5 * Math.PI) * 26 : 0;
        c.y += o - prev; st.off.set(c, o); if (nt >= .5) st.hopT.delete(c); else st.hopT.set(c, nt); }
      for (const p of st.dust){ p.r += 14 * dt; p.l -= dt; } st.dust = st.dust.filter(p => p.l > 0);
      if (!alive && !st.hopT.size){ return false; }
    },
    sprites(st, now){ return st.deer.map(r => ({y: r.y + 20, draw(){
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(r.x, r.y + 22, 24, 6, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(r.x, r.y - Math.abs(Math.sin(now / 90 + r.ph)) * 14); ctx.scale(-1, 1); ctx.font = '46px ' + EMOJI;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🦌', 0, 0); ctx.restore(); ctx.textBaseline = 'alphabetic'; }})); },
    draw(st){ for (const p of st.dust){ ctx.fillStyle = `rgba(210,190,160,${.4 * p.l / .6})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); } } });

  // ---------- 4. COOKIES ----------
  const HUB = {x: 720, y: 470};
  EVENTS.push({ name: 'cookies',
    start(now){
      const door = nearestDoor(HUB.x, HUB.y); log('🍪 The cookie cart has arrived at the hub!', 'g'); flash(door);
      const cart = mkElf(door.ox, door.oy, 0, '#d9752b', [...inWay(door), [HUB.x - 40, HUB.y]]);
      return {door, cart, phase: 'in', t: 0, eaters: [], crumbs: [], eaten: 0};
    },
    update(st, dt, now){
      const e = st.cart;
      if (st.phase === 'in'){ if (follow(e, dt, 150)){ st.phase = 'serve'; st.t = 0;
        const idle = chs().filter(c => c.status !== 'work' && c.state === 'wander' && c.y > 0).sort(() => Math.random() - .5).slice(0, 4);
        st.eaters = idle.map((c, i) => { c.state = 'wander'; c.wait = 0; c.tx = HUB.x + (i - 1.5) * 42; c.ty = HUB.y + 52 + (i % 2) * 22; return c; }); } }
      else if (st.phase === 'serve'){ st.t += dt;
        for (const c of st.eaters){ if (c.status === 'work'){ continue; }
          if (Math.hypot(c.tx - c.x, c.ty - c.y) < 8){ c.wait = Math.max(c.wait, .3); c.face = c.x < HUB.x ? 1 : -1;
            if (Math.random() < dt * 9) st.crumbs.push({x: c.x + c.face * 6, y: c.y - 22, vx: rnd(-20, 20), vy: rnd(-50, -10), l: .7}); } }
        if (st.t > 7){ st.phase = 'out'; e.way = [[e.x, e.y], ...outWay(st.door)]; e.i = 0; st.eaters.forEach(c => { c.wait = 0; }); } }
      else if (follow(e, dt, 150) && !st.crumbs.length) return false;
      if (st.phase === 'out') e.x += 0;
      for (const p of st.crumbs){ p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 140 * dt; p.l -= dt; } st.crumbs = st.crumbs.filter(p => p.l > 0);
    },
    sprites(st, now){ const e = st.cart; return [{y: e.y + 20, draw(){
      const cx = e.x + e.face * 38;
      ctx.fillStyle = '#8a5a35'; ctx.fillRect(cx - 24, e.y - 4, 48, 20); ctx.fillStyle = '#c8323c'; ctx.fillRect(cx - 24, e.y - 4, 48, 5);
      ctx.fillStyle = '#222'; for (const s of [-14, 14]){ ctx.beginPath(); ctx.arc(cx + s, e.y + 18, 5, 0, 7); ctx.fill(); }
      ctx.font = '22px ' + EMOJI; ctx.textAlign = 'center'; ctx.fillText('🍪', cx - 8, e.y - 6); ctx.fillText('🍪', cx + 10, e.y - 8);
      drawElf(e, now); }}]; },
    draw(st){ ctx.fillStyle = '#b97a3a'; for (const p of st.crumbs){ ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 7); ctx.fill(); } } });

  // ---------- 5. BLACKOUT ----------
  let dark = null;
  EVENTS.push({ name: 'blackout',
    start(now){
      if (!chs().length) return null;
      const door = DOORS[0]; log('💡 Blackout! The lights went out!', 'g');
      const FB = {x: 720, y: WALL + 12}; dark = dark || document.createElement('canvas'); dark.width = W; dark.height = H;
      const owner = pick(chs()); curse(owner, now, true);
      return {door, FB, phase: 'flick1', t: 0, a: 0, fixT: 0, sparks: [], elf: mkElf(door.ox, door.oy, 0, '#2f6fd0', [...inWay(door), [FB.x, FB.y + 46]]), lit: false, lamps: chs().sort(() => Math.random() - .5).slice(0, 3)};
    },
    update(st, dt, now){
      st.t += dt; const MAXA = .75, flick = (t, k) => (Math.floor(t * 14) % 2 ? 1 : .15) * MAXA * k;
      if (st.phase === 'flick1'){ st.a = flick(st.t, st.t / 1.2); if (st.t > 1.2){ st.phase = 'dark'; st.t = 0; } }
      else if (st.phase === 'dark'){ st.a = MAXA; if (follow(st.elf, dt, 150)){ st.phase = 'fix'; st.t = 0; st.elf.face = 1; } }
      else if (st.phase === 'fix'){ st.a = MAXA; if (Math.random() < dt * 30) st.sparks.push({x: st.FB.x + rnd(-8, 8), y: st.FB.y + 6, vx: rnd(-50, 50), vy: rnd(20, 90), l: .4});
        if (st.t > 2.2){ st.phase = 'flick2'; st.t = 0; st.elf.way = outWay(st.door); st.elf.i = 0; log('💡 Lights are back on.', 'g'); } }
      else if (st.phase === 'flick2'){ st.a = flick(st.t, 1 - st.t / 1.2); follow(st.elf, dt, 150); if (st.t > 1.2){ st.a = 0; st.phase = 'leave'; } }
      else { if (follow(st.elf, dt, 170)){ return false; } }
      for (const p of st.sparks){ p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; } st.sparks = st.sparks.filter(p => p.l > 0);
    },
    floor(st, now){ const b = st.FB; ctx.fillStyle = '#555a63'; ctx.fillRect(b.x - 16, b.y - 12, 32, 26); ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.strokeRect(b.x - 16, b.y - 12, 32, 26);
      ctx.fillStyle = st.phase === 'flick2' || st.phase === 'leave' ? '#4cd964' : '#d33'; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, 7); ctx.fill(); },
    sprites(st, now){ return [{y: st.elf.y + 18, draw(){ drawElf(st.elf, now); }}]; },
    draw(st, now){
      if (st.a > .01){
        const g = dark.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
        g.fillStyle = `rgba(0,0,10,${st.a})`; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'destination-out';
        const holes = st.lamps.filter(c => c.y > 0).map(c => ({x: c.x, y: c.y - 14, f: c.face || 1, R: 200}));
        if (st.phase === 'dark' || st.phase === 'fix') holes.push({x: st.elf.x, y: st.elf.y - 10, f: st.elf.face || 1, R: 150});
        for (const h of holes){
          const ang = h.f > 0 ? 0 : Math.PI, gr = g.createRadialGradient(h.x, h.y, 5, h.x, h.y, h.R);
          gr.addColorStop(0, 'rgba(0,0,0,.95)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr;
          g.beginPath(); g.moveTo(h.x, h.y); g.arc(h.x, h.y, h.R, ang - .4, ang + .4); g.closePath(); g.fill();
          const g2 = g.createRadialGradient(h.x, h.y, 2, h.x, h.y, 55); g2.addColorStop(0, 'rgba(0,0,0,.8)'); g2.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = g2; g.beginPath(); g.arc(h.x, h.y, 55, 0, 7); g.fill();
        }
        ctx.drawImage(dark, 0, 0, W, H);
        ctx.fillStyle = 'rgba(255,230,150,.07)';
        for (const h of holes){ const ang = h.f > 0 ? 0 : Math.PI; ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.arc(h.x, h.y, h.R * .8, ang - .4, ang + .4); ctx.closePath(); ctx.fill(); }
      }
      ctx.fillStyle = '#ffe27a'; for (const p of st.sparks){ ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 7); ctx.fill(); }
    } });
})();
