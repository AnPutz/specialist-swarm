// Random events B: santa, snowball, printer, runaway, grinch. Classic script, loaded after index.html's script.
(function(){
const EMO = '28px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.random() * a.length | 0];
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const charList = () => Object.values(chars);
const randChar = () => { const l = charList(); return l.length ? pick(l) : null; };
const doorOf = side => DOORS.filter(d => d.side === side);
const lerp = (a, b, t) => a + (b - a) * t;
const ECOL = ['#2f9e66', '#c8323c', '#4c8ee8', '#8a5cd6', '#d98a2b'];

function bubble(x, y, text, now, t0, color){
  const age = now - t0; if (age < 0) return;
  const a = Math.min(1, age / 150), s = .6 + .4 * a;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = a;
  ctx.font = '700 15px Inter, sans-serif'; ctx.textAlign = 'center';
  const w = ctx.measureText(text).width + 22;
  ctx.fillStyle = '#fff'; ctx.strokeStyle = color || '#c8323c'; ctx.lineWidth = 2.5;
  rr(ctx, -w / 2, -34, w, 28, 10); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, -7); ctx.lineTo(0, 2); ctx.lineTo(6, -7); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.fillStyle = '#222'; ctx.fillText(text, 0, -14); ctx.restore();
}
function sparkle(x, y, t, size){
  ctx.save(); ctx.translate(x, y - t * 14); ctx.globalAlpha = Math.max(0, 1 - t); ctx.fillStyle = '#ffe27a';
  const r = size * (1 - t * .4); ctx.rotate(t * 2);
  ctx.beginPath(); for (let i = 0; i < 8; i++){ const rr2 = i % 2 ? r * .35 : r; const a = i * Math.PI / 4;
    ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } ctx.closePath(); ctx.fill(); ctx.restore();
}
function keepBubble(who, text, now){ if (!who.bubble || now - who.bubble.t0 > 1800) who.bubble = {text, t0: now, color: '#a8461f'}; }
function walkTo(o, tx, ty, sp, dt){
  const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy);
  if (Math.abs(dx) > 1) o.face = Math.sign(dx);
  if (d <= sp * dt){ o.x = tx; o.y = ty; return true; }
  o.x += dx / d * sp * dt; o.y += dy / d * sp * dt; return false;
}

// ---------------- 1. santa ----------------
EVENTS.push({ name: 'santa',
  start(now){
    if (!Object.keys(chars).length) return null;
    const tops = doorOf('top'), a = pick(tops), b = tops.find(d => d !== a) || a;
    log('🎅 Santa drops by!', 'g'); a.flash = 1;
    return {phase: 0, x: a.ox, y: a.oy, a, b, face: 1, wp: [[a.ix, a.iy + 40], [rnd(450, 990), rnd(300, 600)], [rnd(300, 1100), rnd(250, 560)], [b.ix, b.iy + 30], [b.ox, b.oy]],
      i: 0, t0: now, spark: []};
  },
  update(st, dt, now){
    const [tx, ty] = st.wp[st.i];
    if (walkTo(st, tx, ty, 120, dt)){ st.i++; if (st.i === 4) st.b.flash = 1; if (st.i >= st.wp.length) return false; }
    for (const c of charList()) if (Math.hypot(c.x - st.x, c.y - st.y) < 110 && !(st.spark.find(s => s.c === c && now - s.t < 2500)))
      st.spark.push({c, t: now, dx: rnd(-14, 14)});
    st.spark = st.spark.filter(s => now - s.t < 1200 || (s.t = -1e9, false));
    return true;
  },
  sprites(st, now){ return [{y: st.y + 20, draw(){
    const bob = Math.abs(Math.sin(now / 130)) * 3;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(st.x, st.y + 22, 14, 4, 0, 0, 7); ctx.fill();
    ctx.font = '44px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🎅', st.x, st.y + 14 - bob);
    if (now - st.t0 > 700 && now - st.t0 < 9000 && st.y > WALL) bubble(st.x, st.y - 30, 'Ho ho ho!', now, st.t0 + 700 + Math.floor((now - st.t0) / 2200) * 0);
  }}]; },
  draw(st, now){ for (const s of st.spark){ const t = (now - s.t) / 1200; if (t < 0 || t > 1) continue;
    sparkle(s.c.x + s.dx, s.c.y - 30, t, 9); sparkle(s.c.x - s.dx, s.c.y - 18, Math.min(1, t + .2), 6); } },
});

// ---------------- 2. snowball ----------------
EVENTS.push({ name: 'snowball',
  start(now){
    const all = charList(); if (!all.length) return null;
    const mk = (side, x) => [0, 1].map(i => { const d = DOORS.find(d => d.side === side);
      return {x: d.ox, y: 330 + i * 150, tx: x, ty: 330 + i * 150 + (i ? 30 : -20), face: side === 'left' ? 1 : -1, color: pick(ECOL), hop: rnd(0, 6), in: false, next: now + 1500 + i * 500}; });
    const L = mk('left', 150), R = mk('right', W - 150), victim = pick(all);
    log('❄️ Snowball fight in the office!', 'g');
    return {L, R, balls: [], splats: [], t0: now, victim, hit: false, end: now + 11000};
  },
  update(st, dt, now){
    const leaving = now > st.end - 1800;
    for (const grp of [st.L, st.R]) for (const e of grp){
      if (!leaving){ walkTo(e, e.tx, e.ty, 240, dt); e.face = grp === st.L ? 1 : -1; }
      else { const d = nearestDoor(e.x, e.y); walkTo(e, d.ox, d.oy, 300, dt); }
      if (!leaving && e.x === e.tx && now > e.next){
        e.next = now + rnd(700, 1300); const foes = grp === st.L ? st.R : st.L;
        let tgt = pick(foes), tx = tgt.x + rnd(-30, 30), ty = tgt.y;
        if (!st.hit && Math.random() < .35 && grp === st.L){ tx = st.victim.x; ty = st.victim.y; st.hit = 'aim'; }
        st.balls.push({x0: e.x, y0: e.y, x1: tx, y1: ty, t: 0, dur: .9, victim: st.hit === 'aim', });
        if (st.hit === 'aim') st.hit = 'fired';
      }
    }
    if (!st.hit && now - st.t0 > 5000){ st.hit = 'aim'; const e = st.L[0]; e.next = 0; }
    for (const b of st.balls){ b.t += dt / b.dur;
      if (b.t >= 1 && !b.done){ b.done = true; st.splats.push({x: b.x1, y: b.y1 + 18, t: now});
        if (b.victim){ curse(st.victim, now, true); st.victim.hop = 6; } } }
    st.balls = st.balls.filter(b => !b.done); st.splats = st.splats.filter(s => now - s.t < 1500);
    return now < st.end;
  },
  floor(st, now){ for (const s of st.splats){ const t = (now - s.t) / 1500;
    ctx.globalAlpha = 1 - t * t; ctx.fillStyle = '#eaf4ff';
    for (let i = 0; i < 6; i++){ const a = i * 1.05; ctx.beginPath(); ctx.ellipse(s.x + Math.cos(a) * (6 + 8 * Math.min(1, t * 4)), s.y + Math.sin(a) * 4, 4, 2.4, 0, 0, 7); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(s.x, s.y, 9, 4, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; } },
  sprites(st, now){
    const out = [];
    for (const e of [...st.L, ...st.R]) out.push({y: e.y + 18, draw(){ drawElf({x: e.x, y: e.y, big: false, hop: e.hop, face: e.face, color: e.color, carry: false}, now); }});
    for (const b of st.balls){ const t = Math.min(1, b.t), x = lerp(b.x0, b.x1, t), gy = lerp(b.y0, b.y1, t), h = Math.sin(t * Math.PI) * 110;
      out.push({y: gy + 30, draw(){
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, gy + 18, 6 - h / 40, 2.5, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#a9c4e6'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, gy - h, 6, 0, 7); ctx.fill(); ctx.stroke(); }});
    }
    return out;
  },
});

// ---------------- 3. printer ----------------
EVENTS.push({ name: 'printer',
  start(now){
    const c = randChar(); if (!c || !c.d) return null;
    const px = c.d.x + c.d.w / 2 - 20, py = c.d.y - c.d.h / 2 + 10;
    log('🖨️ A printer jams and explodes!', 'g');
    return {c, px, py, t0: now, boom: false, sheets: [], t: 0};
  },
  update(st, dt, now){
    st.t += dt;
    if (!st.boom && st.t > 1.8){ st.boom = true; st.bt = now; curse(st.c, now, true);
      for (let i = 0; i < 38; i++){ const a = rnd(0, 7), sp = rnd(120, 340);
        st.sheets.push({x: st.px, y: st.py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .5 - rnd(160, 300), z: rnd(10, 40), g: 0, r: rnd(0, 7), vr: rnd(-8, 8), gnd: st.py + rnd(10, 150), life: 0}); } }
    for (const s of st.sheets){ s.life += dt;
      if (s.y < s.gnd || s.vy < 0){ s.vy += 520 * dt; s.vx *= Math.pow(.3, dt); s.x += s.vx * dt; s.y += s.vy * dt + Math.sin(s.life * 7 + s.r) * 20 * dt;
        if (s.vy > 70) s.vy = 70; s.r += s.vr * dt; }
      else s.vr *= .9; }
    return st.t < 10;
  },
  floor(st, now){ for (const s of st.sheets){ if (s.life < .9) continue; drawSheet(s, now, st.t); } },
  draw(st, now){
    for (const s of st.sheets) if (s.life < .9) drawSheet(s, now, st.t);
    ctx.font = EMO; ctx.textAlign = 'center';
    if (!st.boom){ const sh = Math.sin(now / 40) * (2 + st.t * 2); ctx.fillText('🖨️', st.px + sh, st.py);
      if (st.t > .8) ctx.fillText('💨', st.px + 20, st.py - 24 - (now % 400) / 20);
    } else { const t = Math.min(1, (now - st.bt) / 500); ctx.globalAlpha = 1 - t; ctx.font = (28 + t * 60) + 'px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; ctx.fillText('💥', st.px, st.py); ctx.globalAlpha = 1;
      ctx.font = EMO; ctx.globalAlpha = st.t > 8.5 ? 0 : 1; ctx.fillText('🖨️', st.px, st.py + 4); ctx.globalAlpha = 1; }
  },
});
function drawSheet(s, now, t){
  const a = t > 8 ? Math.max(0, 1 - (t - 8) / 2) : 1;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(s.x, s.y); ctx.rotate(s.r); ctx.scale(1, .6 + .4 * Math.abs(Math.cos(s.r * 1.5)));
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#c9ccd6'; ctx.lineWidth = 1; ctx.fillRect(-7, -9, 14, 18); ctx.strokeRect(-7, -9, 14, 18);
  ctx.fillStyle = '#b6bac8'; ctx.fillRect(-4, -5, 8, 1.5); ctx.fillRect(-4, -1, 8, 1.5); ctx.fillRect(-4, 3, 5, 1.5); ctx.restore();
}

// ---------------- 4. runaway ----------------
EVENTS.push({ name: 'runaway',
  start(now){
    const d1 = pick(DOORS), d2 = DOORS.filter(d => d !== d1).sort((a, b) => Math.hypot(b.ix - d1.ix, b.iy - d1.iy) - Math.hypot(a.ix - d1.ix, a.iy - d1.iy))[0];
    log('🎁 A present has come alive and is running away!', 'g'); d1.flash = 1;
    return {p: {x: d1.ix, y: d1.iy, face: 1, ang: rnd(.3, 1.2), dirt: 0, hop: 0}, d2, elf: {x: d1.ox, y: d1.oy, face: 1, color: pick(ECOL), hop: rnd(0, 6), carry: false},
      phase: 0, t: 0, zz: 0, pant: 0, carry: false};
  },
  update(st, dt, now){
    st.t += dt; const p = st.p, e = st.elf;
    if (st.phase === 0){
      p.dirt -= dt; if (p.dirt <= 0){ p.dirt = rnd(.35, .7); p.ang = (st.zz++ % 2 ? 1 : -1) * rnd(.4, 1.1) + (p.x < W / 2 ? 0 : Math.PI); }
      let nx = p.x + Math.cos(p.ang) * 230 * dt, ny = p.y + Math.sin(p.ang) * 230 * dt;
      if (nx < 80 || nx > W - 80) p.ang = Math.PI - p.ang;
      if (ny < WALL + 60 || ny > H - 70) p.ang = -p.ang;
      if (!blocked(nx, ny)){ p.x = nx; p.y = ny; } else p.ang += 2;
      p.face = Math.cos(p.ang) >= 0 ? 1 : -1;
      walkTo(e, p.x, p.y, 215, dt);
      if (Math.hypot(e.x - p.x, e.y - p.y) < 22 && st.t > 4.5){ st.phase = 1; st.dd = nearestDoor(e.x, e.y); e.carry = true; p.gone = true; }
      if (st.t > 12) { st.phase = 1; st.dd = nearestDoor(e.x, e.y); e.carry = true; p.gone = true; }
    } else {
      if (walkTo(e, st.dd.ox, st.dd.oy, 190, dt)) return false;
    }
    return true;
  },
  sprites(st, now){ const p = st.p, e = st.elf, out = [];
    out.push({y: e.y + 18, draw(){ drawElf({x: e.x, y: e.y, big: false, hop: e.hop, face: e.face, color: e.color, carry: e.carry}, now);
      if (st.phase === 0){ ctx.font = '700 14px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#7ec8ff';
        ctx.fillText('phew', e.x + 12 * e.face, e.y - 34 - (now % 600) / 40); ctx.fillText('💦', e.x - 14 * e.face, e.y - 26); } }});
    if (!p.gone) out.push({y: p.y + 14, draw(){
      const leg = Math.sin(now / 40) * 5;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 16, 12, 3.5, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#222'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath();
      ctx.moveTo(p.x - 5, p.y + 6); ctx.lineTo(p.x - 5 + leg, p.y + 15); ctx.moveTo(p.x + 5, p.y + 6); ctx.lineTo(p.x + 5 - leg, p.y + 15); ctx.stroke();
      const by = p.y - Math.abs(Math.sin(now / 60)) * 4;
      ctx.fillStyle = '#c8323c'; ctx.fillRect(p.x - 11, by - 12, 22, 20); ctx.fillStyle = '#ffd34d'; ctx.fillRect(p.x - 2, by - 12, 4, 20); ctx.fillRect(p.x - 11, by - 4, 22, 4);
      ctx.beginPath(); ctx.ellipse(p.x - 5, by - 15, 5, 3.5, -.4, 0, 7); ctx.ellipse(p.x + 5, by - 15, 5, 3.5, .4, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x + 3 * p.face, by - 3, 2.2, 0, 7); ctx.arc(p.x + 9 * p.face, by - 3, 2.2, 0, 7); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(p.x + 4 * p.face, by - 3, 1, 0, 7); ctx.arc(p.x + 10 * p.face, by - 3, 1, 0, 7); ctx.fill(); }});
    return out; },
});

// ---------------- 5. grinch ----------------
function drawGrinch(g, now, sneaky){
  const sp = sneaky ? 90 : 40, leg = Math.sin(now / sp) * 5, y = g.y - (sneaky ? 0 : Math.abs(Math.sin(now / 60)) * 3);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(g.x, g.y + 22, 12, 3.5, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(g.x, y); ctx.scale(g.face * 1.35, 1.35);
  if (sneaky) ctx.rotate(.18);
  ctx.strokeStyle = '#2c6b2a'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
  ctx.moveTo(-3, 6); ctx.lineTo(-3 - leg, 14); ctx.moveTo(3, 6); ctx.lineTo(3 + leg, 14); ctx.stroke();
  ctx.fillStyle = '#5db13f'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 10, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#c8323c'; ctx.fillRect(-7, -3, 14, 4);
  ctx.fillStyle = '#6cc84a'; ctx.beginPath(); ctx.arc(0, -11, 6.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffe14d'; ctx.beginPath(); ctx.arc(2, -12, 1.6, 0, 7); ctx.arc(-2.5, -12, 1.6, 0, 7); ctx.fill();
  ctx.strokeStyle = '#1b3d17'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-4.5, -15); ctx.lineTo(0, -13); ctx.lineTo(4.5, -15); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -5.5, 3, 1.2 * Math.PI, 1.8 * Math.PI); ctx.stroke();
  ctx.fillStyle = '#c8323c'; ctx.beginPath(); ctx.moveTo(-5, -16); ctx.lineTo(5, -16); ctx.lineTo(-6, -24); ctx.fill();
  ctx.restore();
}
EVENTS.push({ name: 'grinch',
  start(now){
    const l = charList().filter(c => c.d); if (!l.length) return null;
    const v = pick(l), d = v.d, door = nearestDoor(d.x, d.y), far = DOORS.filter(x => x !== door).sort((a, b) => Math.hypot(b.ix - d.x, b.iy - d.y) - Math.hypot(a.ix - d.x, a.iy - d.y))[0];
    log('😈 The Grinch is stealing a parcel!', 'g');
    return {v, d, g: {x: door.ox, y: door.oy, face: 1}, door, exit: far, phase: 0, t: 0, parcel: null, saveWait: boss.wait, saved: false, drop: null, stopT: 0};
  },
  update(st, dt, now){
    const g = st.g; st.t += dt; boss.wait = 99; boss.moving = false;
    const tx = st.d.x, ty = st.d.y + st.d.h / 2 + 24;
    if (st.phase === 0){ if (walkTo(g, st.door.ix, st.door.iy, 120, dt) && walkTo(g, tx, ty, 75, dt)) st.phase = 1; }
    else if (st.phase === 1){ st.parcel = {x: g.x, y: g.y}; st.phase = 2; st.stopT = now; curse(st.v, now, true); }
    else if (st.phase === 2){
      if (now - st.stopT > 450){ walkTo(g, st.exit.ix, st.exit.iy, 230, dt); st.parcel.x = g.x + 12 * g.face; st.parcel.y = g.y - 2;
        const d = Math.hypot(boss.x - g.x, boss.y - g.y);
        if (d > 5) walkTo(boss, g.x, g.y, 200, dt);
        boss.tx = boss.x; boss.ty = boss.y; boss.target = null; keepBubble(boss, 'Stop, thief!', now);
        if (d < 60 && now - st.stopT > 2500){ st.phase = 3; st.drop = {x: g.x + 14, y: g.y + 4}; st.parcel = null; boss.bubble = {text: 'Give it back!', t0: now, color: '#a8461f'}; }
        if (Math.hypot(g.x - st.exit.ix, g.y - st.exit.iy) < 5) st.phase = 3; }
    } else if (st.phase === 3){
      walkTo(g, st.exit.ox, st.exit.oy, 300, dt);
      if (st.drop){ const d = Math.hypot(boss.x - st.drop.x, boss.y - st.drop.y); if (d > 5) walkTo(boss, st.drop.x, st.drop.y, 180, dt); else st.phase = 4, st.t4 = now; }
      if (g.x === st.exit.ox && g.y === st.exit.oy && !st.drop) st.phase = 4;
    } else {
      if (!st.t4) st.t4 = now;
      if (now - st.t4 > 900){ boss.wait = 1; boss.target = null; return false; }
    }
    if (st.phase === 3 && g.x === st.exit.ox && g.y === st.exit.oy && st.drop && Math.hypot(boss.x - st.drop.x, boss.y - st.drop.y) < 6) st.phase = 4;
    if (st.t > 13){ boss.wait = 1; return false; }
    return true;
  },
  sprites(st, now){ const g = st.g, out = [{y: g.y + 22, draw(){ drawGrinch(g, now, st.phase < 2); }}];
    const P = st.parcel || st.drop;
    if (P) out.push({y: P.y + 10, draw(){ ctx.fillStyle = '#b98a4a'; ctx.fillRect(P.x - 8, P.y - 7, 16, 14); ctx.fillStyle = '#c8323c'; ctx.fillRect(P.x - 1.5, P.y - 7, 3, 14); } });
    return out; },
  draw(st, now){ if (st.phase === 0 && st.g.y > WALL) bubble(st.g.x, st.g.y - 34, 'psst...', now, st.t * 0 + now - 400, '#3e8f2a');
    if (st.phase === 2 && now - st.stopT > 450 && now - st.stopT < 1800){ ctx.font = EMO; ctx.textAlign = 'center'; ctx.fillText('💨', st.g.x - 20 * st.g.face, st.g.y + 8); } },
});
})();
