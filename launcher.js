// Meadow Mage launcher: hero preview, options, tutorial, profile, news.
// Talks to the game only through window.MM (see the end of index.html).
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const MM = window.MM;
if (MM) init();

function init() {
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const html = (tag, cls, h) => { const e = el(tag, cls); e.innerHTML = h; return e; };
  const hex = c => '#' + c.toString(16).padStart(6, '0');
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const blip = (f = 660) => { MM.audio(); MM.tn({dur: .12, f0: f, f1: f * 1.3, g: .07, type: 'triangle'}); };
  const sbox = $('sbox'), startEl = $('start');
  let tab = 0;

  /* ---------- backdrop: map picture for other lands, drifting motes ---------- */
  const MOTE = [['#fff3b0', -40, -90], ['#ffffff', 30, 120], ['#ff9a4a', -30, -130]];
  const lfx = $('lfx');
  for (let i = 0; i < 26; i++) {
    const p = el('i');
    p.style.cssText = `--x:${Math.random() * 100}%;--y:${Math.random() * 100}%;--s:${2 + Math.random() * 4}px;--d:${9 + Math.random() * 12}s;--w:${-Math.random() * 20}s;--o:${.25 + Math.random() * .45};--k:${.5 + Math.random()}`;
    lfx.appendChild(p);
  }
  function backdrop() {
    const pm = MM.pendMap(), m = MOTE[pm], img = $('lbgimg');
    if (pm !== MM.MAPI) { img.style.backgroundImage = `url(assets/shots/map${pm}.jpg)`; img.classList.add('on'); } else img.classList.remove('on');
    [...lfx.children].forEach(p => { const k = +p.style.getPropertyValue('--k'); p.style.setProperty('--pc', m[0]); p.style.setProperty('--dx', m[1] * k + 'px'); p.style.setProperty('--dy', m[2] * k + 'px'); });
    lfx.style.display = pm === MM.MAPI ? 'none' : '';   // the live world already has its own particles
  }
  [...$('maps').children].forEach((b, i) => { b.style.backgroundImage = `url(assets/shots/map${i}.jpg)`; });

  /* ---------- top chips and daily reward ---------- */
  const ltop = $('ltop');
  function chips() {
    const p = MM.prog(); ltop.textContent = '';
    ltop.append(html('span', 'chip', `Poziom <b>${p.lvl}</b>`), html('span', 'chip', `Złoto <b>${p.gold}</b>`));
    if (p.rb) ltop.append(html('span', 'chip', `Odrodzenia <b>${p.rb}</b>`));
    const d = p.daily || {day: '', streak: 0}, can = d.day !== today();
    const yest = new Date(Date.now() - 864e5), yk = yest.getFullYear() + '-' + String(yest.getMonth() + 1).padStart(2, '0') + '-' + String(yest.getDate()).padStart(2, '0');
    const streak = can ? (d.day === yk ? d.streak + 1 : 1) : d.streak, gold = 40 + 20 * Math.min(streak, 7);
    const b = el('button', 'chip' + (can ? ' go' : ''), can ? `Odbierz nagrodę dnia: ${gold} złota (dzień ${streak})` : `Nagroda dnia odebrana · seria ${d.streak}`);
    b.disabled = !can;
    b.addEventListener('click', () => { p.gold += gold; p.daily = {day: today(), streak}; MM.saveProg(); blip(880); chips(); heroTag(); });
    ltop.append(b);
  }

  /* ---------- hero preview: animated 3D mage ---------- */
  const cv = $('heroCv'), tag = $('heroTag');
  const H = {ready: false, yaw: -.35, vel: 0, drag: null};
  const ORIGC = [0xff7a2a, 0x6fc8ff, 0xffe04a, 0x7dff9a];
  let rend, scene, cam, rot, mixer, idle, act, robeMat, baseImg, staffMat, rim, ring, glowMat, clock = performance.now();
  try {
    rend = new THREE.WebGLRenderer({canvas: cv, alpha: true, antialias: true});
    rend.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(30, 1, .1, 50);
    scene.add(new THREE.HemisphereLight(0xe6ecff, 0x2a2e38, 1.5));
    const key = new THREE.DirectionalLight(0xfff0dc, 2.6); key.position.set(2.5, 4, 4); scene.add(key);
    rim = new THREE.DirectionalLight(0xff7a2a, 3.2); rim.position.set(-3, 2.6, -3.5); scene.add(rim);
    rot = new THREE.Group(); scene.add(rot);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.32, .24, 48), new THREE.MeshStandardMaterial({color: 0x2c313c, roughness: .75, metalness: .1})); ped.position.y = -.12; scene.add(ped);
    ring = new THREE.Mesh(new THREE.RingGeometry(.92, 1.06, 64), new THREE.MeshBasicMaterial({color: 0xff7a2a, transparent: true, opacity: .9, side: THREE.DoubleSide})); ring.rotation.x = -Math.PI / 2; ring.position.y = .012; scene.add(ring);
    const gc = document.createElement('canvas'); gc.width = gc.height = 128; const g2 = gc.getContext('2d'), gr = g2.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 128, 128);
    glowMat = new THREE.SpriteMaterial({map: new THREE.CanvasTexture(gc), color: 0xff7a2a, transparent: true, opacity: .35, depthWrite: false, blending: THREE.AdditiveBlending});
    const glow = new THREE.Sprite(glowMat); glow.position.set(0, 1.2, -1.2); glow.scale.setScalar(5.5); scene.add(glow);
    const L = new GLTFLoader();
    H.load = u => new Promise(r => L.load(u, r, undefined, () => r(null)));
    H.rig = H.load('assets/models/npc/Rig_Medium_General.glb');
    H.weps = Promise.all(['staff', 'wand', 'spellbook_open'].map(f => H.load('assets/models/props/' + f + '.gltf'))).then(a => a.map((g, i) => {
      if (!g) return null;
      g.scene.traverse(q => { if (q.isMesh) { q.material = q.material.clone(); if (i === 0) staffMat = q.material; } });
      g.scene.scale.setScalar([1, 1.5, 1.6][i]); return g.scene;
    }));
  } catch (e) { $('lhero').style.display = 'none'; sbox.classList.add('nohero'); rend = null; }

  // one model per class; all KayKit characters share a rig, so the same clips drive each of them
  const CLS = [['Mage', 'Throw'], ['Rogue_Hooded', 'Use_Item'], ['Ranger', 'Interact'], ['Skeleton_Mage', 'PickUp']], heroes = {};
  const QW = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), .5), QB = new THREE.Quaternion().setFromEuler(new THREE.Euler(-1, .4, 0));
  let hero = null, heroWant = -1;
  function setHero(c) {
    if (!rend) return; heroWant = c;
    const show = h => {
      if (heroWant !== c) return;
      for (const k in heroes) if (heroes[k].o) heroes[k].o.visible = heroes[k] === h;
      hero = h; mixer = h.mixer; idle = h.idle; act = h.act; robeMat = h.robeMat; baseImg = h.baseImg;
      H.weps.then(ws => {
        if (hero !== h) return;
        if (h.hand) ws.forEach((w, i) => { if (!w) return; h.hand.add(w); w.quaternion.copy(h.q); if (i === 1) w.quaternion.multiply(QW); if (i === 2) { w.quaternion.multiply(QB); w.position.set(0, .25, .1); } });
        H.staff = ws[0]; H.wand = ws[1]; H.book = ws[2]; H.ready = true; look(false);
      });
    };
    if (heroes[c]) { if (heroes[c].o) show(heroes[c]); return; }
    heroes[c] = {};
    Promise.all([H.load('assets/models/npc/' + CLS[c][0] + '.glb'), H.rig]).then(([m, rig]) => {
      if (!m) { delete heroes[c]; if (c) setHero(0); else { $('lhero').style.display = 'none'; sbox.classList.add('nohero'); } return; }
      const h = heroes[c], o = m.scene; h.o = o; o.scale.setScalar(.92); o.visible = false; rot.add(o);
      o.traverse(q => { if (q.isMesh) { q.frustumCulled = false; if (!h.robeMat) { h.robeMat = q.material; h.baseImg = q.material.map && q.material.map.image; } } if (!h.hand && /handslot.?r$/i.test(q.name)) h.hand = q; });
      if (rig) {
        h.mixer = new THREE.AnimationMixer(o);
        const clip = n => THREE.AnimationClip.findByName(rig.animations, n), ac = clip(CLS[c][1]) || clip('Use_Item');
        if (clip('Idle_A')) { h.idle = h.mixer.clipAction(clip('Idle_A')); h.idle.play(); }
        if (ac) { h.act = h.mixer.clipAction(ac); h.act.setLoop(THREE.LoopOnce); h.act.clampWhenFinished = true; }
        h.mixer.addEventListener('finished', () => { if (h.idle && h.act) { h.idle.enabled = true; h.idle.reset().play(); h.idle.crossFadeFrom(h.act, .3, false); } });
      }
      if (h.hand) {   // stand the weapon upright in the idle pose, whatever way the hand bone points
        if (h.mixer) h.mixer.update(0); rot.updateMatrixWorld(true);
        const qh = h.hand.getWorldQuaternion(new THREE.Quaternion()), qr = rot.getWorldQuaternion(new THREE.Quaternion());
        h.q = qh.invert().multiply(qr);
      }
      show(h);
    });
  }
  function dress(robe) {   // the mage texture is repainted; other classes get a light tint of the chosen colour
    if (!hero || !robeMat) return;
    if (hero === heroes[0]) paintRobe(robe); else if (hero !== heroes[3]) robeMat.color.set(robe).lerp(new THREE.Color(0xffffff), .5);
  }

  // repaint the robe swatches of the palette texture in the chosen colour
  function paintRobe(c) {
    if (!robeMat || !baseImg) return;
    const w = baseImg.width, h = baseImg.height, c2 = document.createElement('canvas'); c2.width = w; c2.height = h;
    const g = c2.getContext('2d', {willReadFrequently: true}); g.drawImage(baseImg, 0, 0);
    const d = g.getImageData(0, 0, w, h), a = d.data, R = c >> 16 & 255, G = c >> 8 & 255, B = c & 255;
    for (let i = 0; i < a.length; i += 4) {
      const r = a[i], gg = a[i + 1], b = a[i + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
      if (mx - mn < 14 || b !== mx) continue;                 // only saturated blue-violet texels: robe, hat, cape
      const hue = r >= gg ? 240 + 60 * (r - gg) / (mx - mn) : 240 - 60 * (gg - r) / (mx - mn);
      if (hue < 228 || hue > 276) continue;
      const k = (r + gg + b) / 3 / 92;                          // lightness relative to the original mid violet
      a[i] = Math.min(255, R * k); a[i + 1] = Math.min(255, G * k); a[i + 2] = Math.min(255, B * k);
    }
    g.putImageData(d, 0, 0);
    const t = new THREE.CanvasTexture(c2); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.magFilter = robeMat.map.magFilter; t.minFilter = robeMat.map.minFilter;
    if (robeMat.map && robeMat.map.isCanvasTexture) robeMat.map.dispose();
    robeMat.map = t; robeMat.needsUpdate = true;
  }
  function look(wave) {
    const ch = MM.char, oc = ORIGC[ch.origin] || ORIGC[0];
    if (heroWant !== ch.origin) { H.ready = false; setHero(ch.origin); return; }
    if (!H.ready) return;
    dress(MM.ROBEC[ch.robe] || MM.ROBEC[0]);
    if (staffMat) staffMat.color.set(MM.WOODC[ch.wood] || MM.WOODC[0]).lerp(new THREE.Color(0xffffff), .35);
    if (H.staff) H.staff.visible = !ch.weapon; if (H.wand) H.wand.visible = ch.weapon === 1; if (H.book) H.book.visible = ch.weapon === 2;
    rim.color.set(oc); ring.material.color.set(oc); glowMat.color.set(oc);
    if (wave && act && idle) { act.enabled = true; act.reset().play(); act.crossFadeFrom(idle, .15, false); }
    heroTag();
  }
  function heroTag() {
    const p = MM.prog(), ch = MM.char, pet = MM.PETS.find(q => q[0] === p.pet);
    tag.textContent = '';
    tag.append(el('b', null, ch.name || 'Bezimienny'), el('span', null, `${MM.ORIGINS[ch.origin][0]} · poziom ${p.lvl}${p.rb ? ' · odrodzenia ' + p.rb : ''}`), el('em', null, (pet ? 'Zwierzak: ' + pet[1] + ' · ' : '') + 'przeciągnij, aby obrócić'));
  }
  // small renders for the in-game panel: the mage in given colours, or any model as a portrait
  window.MMHero = {
    snap(robe, wood, w, h) {
      if (!rend || !H.ready) return null;
      dress(robe); if (staffMat) staffMat.color.set(wood).lerp(new THREE.Color(0xffffff), .35);
      if (mixer) mixer.update(0);
      rend.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); cam.position.set(0, 1.42, 7.4); cam.lookAt(0, 1.2, 0); rot.rotation.y = -.3;
      rend.render(scene, cam); const u = cv.toDataURL(); look(false); return u;
    },
    thumb(obj, px) {
      if (!rend) return null;
      const sc = new THREE.Scene(), d = new THREE.DirectionalLight(0xfff0dc, 2.6); d.position.set(2, 3, 4); sc.add(new THREE.HemisphereLight(0xffffff, 0x444a55, 2.2), d, obj);
      obj.rotation.y = -.7; obj.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(obj), c = b.getCenter(new THREE.Vector3()), r = b.getSize(new THREE.Vector3()).length() / 2, cm = new THREE.PerspectiveCamera(30, 1, .01, 100);
      cm.position.set(c.x, c.y + r * .3, c.z + r / Math.tan(15 * Math.PI / 180) * 1.02); cm.lookAt(c);
      rend.setSize(px, px, false); rend.render(sc, cm); return cv.toDataURL();
    }
  };
  cv.addEventListener('pointerdown', e => { H.drag = e.clientX; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (H.drag == null) return; const dx = e.clientX - H.drag; H.drag = e.clientX; H.yaw += dx * .012; H.vel = dx * .012; });
  ['pointerup', 'pointercancel'].forEach(n => cv.addEventListener(n, () => { H.drag = null; }));
  function heroFrame(now) {
    requestAnimationFrame(heroFrame);
    const dt = Math.min(.05, (now - clock) / 1000); clock = now;
    if (!rend || !H.ready || !MM.inMenu() || tab > 1) return;
    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    if (cv.width !== Math.round(w * rend.getPixelRatio()) || cv.height !== Math.round(h * rend.getPixelRatio())) { rend.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    const dist = Math.max(6.4, 3.3 / Math.min(1, cam.aspect) * 1.9);
    cam.position.set(0, 1.5, dist); cam.lookAt(0, 1.18, 0);
    if (H.drag == null) { H.yaw += H.vel; H.vel *= .92; if (!MM.opts.motion) H.yaw += Math.sin(now * .0004) * .0009; }
    rot.rotation.y = H.yaw; ring.rotation.z += dt * .4;
    if (mixer && !MM.opts.motion) mixer.update(dt);
    rend.render(scene, cam);
  }
  requestAnimationFrame(heroFrame);
  $('cname').addEventListener('input', () => { MM.char.name = $('cname').value.trim().slice(0, 16); heroTag(); });
  ['robes', 'woods', 'origins', 'weps'].forEach(id => $(id).addEventListener('click', () => setTimeout(() => look(true), 0)));

  /* ---------- character tab: what your choices add up to ---------- */
  function charStats() {
    const p = MM.prog(), box = $('charx'); box.textContent = '';
    const st = (a, b) => { const d = el('div', 'stat'); d.append(el('small', null, a), el('b', null, b)); return d; };
    box.append(st('Poziom', p.lvl), st('Mana', MM.maxMana()), st('Złoto', p.gold), st('Przedmioty', Object.keys(p.eq || {}).length + ' założone'), st('Zaklęcia', MM.SPELLS.length + ' w księdze'), st('Zwierzaki', (p.pets || []).length + ' / ' + MM.PETS.length));
  }

  /* ---------- options ---------- */
  const DEF = {vol: 70, volFx: 100, volUi: 100, muteBlur: true, sens: 100, invY: false, hold: true, qual: 'auto', bloom: true, shadows: true, grass: 100, scale: 100, fov: 62, fps: false, xh: 'ring', mini: 180, hud: 100, dmgNum: true, shake: 100, shakeOn: true, volMus: 60, flashI: 100, motion: false, bigText: false, cb: false};
  const R = (k, l, min, max, step, u, d) => ({k, l, t: 'range', min, max, step, u, d}), B = (k, l, d) => ({k, l, t: 'bool', d}), S = (k, l, o, d) => ({k, l, t: 'sel', o, d});
  const OPT = [
    ['Grafika', [S('qual', 'Preset jakości', [['auto', 'Automatyczna'], ['high', 'Wysoka'], ['low', 'Niska']], 'Automatyczna sama obniża detale, gdy gra zwalnia. Niska wyłącza poświatę i cienie.'), B('bloom', 'Poświata (bloom)', 'Blask ognia, kryształów i zaklęć.'), B('shadows', 'Cienie'), R('grass', 'Gęstość trawy', 20, 100, 10, '%'), R('scale', 'Skala renderowania', 50, 100, 5, '%', 'Mniej = szybciej, ale mniej ostro.'), R('fov', 'Pole widzenia', 50, 90, 1, '°'), B('fps', 'Licznik klatek')]],
    ['Dźwięk', [R('vol', 'Głośność ogólna', 0, 100, 1, '%'), R('volMus', 'Muzyka', 0, 100, 5, '%', 'Grana na żywo, inna na każdej mapie; przyspiesza podczas fali i przy bossie.'), R('volFx', 'Efekty w świecie', 0, 100, 5, '%', 'Zaklęcia, stwory, wybuchy.'), R('volUi', 'Interfejs', 0, 100, 5, '%', 'Dźwięki paneli, sklepu i skrzyń.'), B('muteBlur', 'Wycisz, gdy okno jest nieaktywne')]],
    ['Sterowanie', [R('sens', 'Czułość myszy', 30, 250, 5, '%'), B('invY', 'Odwróć oś pionową'), B('hold', 'Rzucaj seriami przy przytrzymaniu', 'Wyłączone: jedno kliknięcie = jeden czar.'), {t: 'keys'}]],
    ['Rozgrywka', [S('xh', 'Celownik', [['ring', 'Pierścień'], ['dot', 'Kropka'], ['cross', 'Krzyżyk']]), R('mini', 'Rozmiar minimapy', 120, 260, 10, ' px'), R('hud', 'Skala interfejsu', 80, 130, 5, '%'), B('dmgNum', 'Liczby obrażeń nad stworami'), B('shakeOn', 'Trzęsienie kamery', 'Wyłącz, jeśli wybuchy za mocno szarpią ekranem.'), R('shake', 'Siła trzęsienia', 0, 150, 10, '%'), R('flashI', 'Błyski ekranu', 0, 100, 10, '%')]],
    ['Dostępność', [B('motion', 'Ogranicz ruch', 'Zatrzymuje przelot kamery i animacje w launcherze oraz trzęsienie kamery w grze.'), B('bigText', 'Większy tekst w panelach'), B('cb', 'Kolory dla daltonistów', 'Zmienia barwy rzadkości przedmiotów na rozróżnialne przy zaburzeniach widzenia barw.')]],
    ['Dane', [{t: 'data'}]]];
  const ACT = {fwd: 'Do przodu', back: 'Do tyłu', left: 'W lewo', right: 'W prawo', run: 'Bieg', jump: 'Skok', use: 'Interakcja', blink: 'Tunel', turret: 'Wieżyczka', next: 'Następne zaklęcie', panel: 'Panel postaci', menu: 'Menu', rebuild: 'Odbuduj budynki', peace: 'Tryb spokojny'};
  const keyName = c => ({Space: 'Spacja', ShiftLeft: 'Lewy Shift', ShiftRight: 'Prawy Shift', ControlLeft: 'Lewy Ctrl', ControlRight: 'Prawy Ctrl', AltLeft: 'Lewy Alt', AltRight: 'Prawy Alt', Tab: 'Tab', Enter: 'Enter', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Backquote: '`', CapsLock: 'Caps Lock'})[c] || c.replace(/^Key/, '').replace(/^Numpad/, 'Num ').replace(/^Digit/, '');
  let otab = 0, waitKey = null;
  const commit = () => { MM.applyOpts(); MM.saveMenu(); };
  function options() {
    const o = MM.opts, box = $('secOpt'); box.textContent = ''; box.append(el('h3', null, 'Opcje'));
    const pills = el('div', 'pills'); OPT.forEach((g, i) => { const b = el('button', i === otab ? 'act' : '', g[0]); b.addEventListener('click', () => { otab = i; waitKey = null; options(); }); pills.append(b); }); box.append(pills);
    for (const it of OPT[otab][1]) {
      if (it.t === 'keys') { keys(box); continue; }
      if (it.t === 'data') { data(box); continue; }
      const row = el('div', 'orow'), lab = el('label', null, it.l), ctl = el('div', 'ctl'); if (it.d) lab.append(el('small', null, it.d));
      if (it.t === 'range') {
        const r = document.createElement('input'), v = el('b', null, o[it.k] + it.u); r.type = 'range'; r.min = it.min; r.max = it.max; r.step = it.step; r.value = o[it.k]; r.setAttribute('aria-label', it.l);
        r.addEventListener('input', () => { o[it.k] = +r.value; v.textContent = r.value + it.u; commit(); }); ctl.append(r, v);
      } else if (it.t === 'bool') {
        const t = el('button', 'tog' + (o[it.k] ? ' on' : '')); t.setAttribute('role', 'switch'); t.setAttribute('aria-checked', !!o[it.k]); t.setAttribute('aria-label', it.l);
        t.addEventListener('click', () => { o[it.k] = !o[it.k]; t.classList.toggle('on', o[it.k]); t.setAttribute('aria-checked', o[it.k]); commit(); blip(o[it.k] ? 760 : 520); }); ctl.append(t);
      } else {
        const s = document.createElement('select'); s.setAttribute('aria-label', it.l); it.o.forEach(q => { const op = el('option', null, q[1]); op.value = q[0]; s.append(op); }); s.value = o[it.k];
        s.addEventListener('change', () => { o[it.k] = s.value; commit(); }); ctl.append(s);
      }
      row.append(lab, ctl); box.append(row);
    }
    if (otab < 5) {
      const f = el('div', 'ofoot'), b = el('button', 'lbtn', 'Przywróć domyślne w tej zakładce');
      b.addEventListener('click', () => { for (const it of OPT[otab][1]) if (it.k) o[it.k] = DEF[it.k]; if (otab === 2) o.keys = {}; commit(); options(); });
      f.append(b, el('span', null, 'Zmiany działają od razu i zapisują się w tej przeglądarce.')); box.append(f);
    }
  }
  function keys(box) {
    const o = MM.opts; o.keys = o.keys || {};
    box.append(el('h3', null, 'Klawisze'));
    for (const a in ACT) {
      const row = el('div', 'orow'), ctl = el('div', 'ctl'), b = el('button', 'lbtn key' + (waitKey === a ? ' wait' : ''), waitKey === a ? 'Naciśnij klawisz…' : keyName(o.keys[a] || MM.KDEF[a]));
      b.addEventListener('click', () => { waitKey = waitKey === a ? null : a; options(); });
      ctl.append(b); row.append(el('label', null, ACT[a]), ctl); box.append(row);
    }
    box.append(el('div', 'ofoot', 'Kliknij przycisk i naciśnij nowy klawisz. Esc anuluje. Cyfry 1–8 są zarezerwowane dla zaklęć; strzałki zawsze poruszają postacią.'));
  }
  addEventListener('keydown', e => {
    if (!waitKey || !MM.inMenu()) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const o = MM.opts, c = e.code, a = waitKey; waitKey = null;
    if (c !== 'Escape' && !/^Digit|^Arrow|^F\d|^Meta/.test(c)) {
      const cur = k => o.keys[k] || MM.KDEF[k], old = cur(a);
      for (const k in ACT) if (k !== a && cur(k) === c) o.keys[k] = old;    // taken: swap the two
      o.keys[a] = c; commit(); blip(820);
    }
    options();
  }, true);
  const SAVE = ['meadowmage_prog', 'meadowmage_char', 'meadowmage_opts', 'meadowmage_map', 'meadowmage_best', 'meadowmage_best1', 'meadowmage_best2'];
  function data(box) {
    const row = (l, d, b) => { const r = el('div', 'orow'), lab = el('label', null, l), c = el('div', 'ctl'); lab.append(el('small', null, d)); c.append(b); r.append(lab, c); box.append(r); };
    const ex = el('button', 'lbtn', 'Pobierz plik zapisu');
    ex.addEventListener('click', () => { MM.saveProg(); MM.saveMenu(); const o = {}; for (const k of SAVE) { const v = localStorage.getItem(k); if (v != null) o[k] = v; } const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({game: 'meadow-mage', v: 1, data: o})], {type: 'application/json'})); a.download = 'meadow-mage-zapis-' + today() + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
    row('Eksport zapisu', 'Postęp, postać, opcje i rekordy w jednym pliku — do przeniesienia na inny komputer.', ex);
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json'; inp.hidden = true;
    const im = el('button', 'lbtn', 'Wczytaj plik zapisu'), msg = el('div', 'ofoot');
    im.addEventListener('click', () => inp.click());
    inp.addEventListener('change', () => { const f = inp.files[0]; if (!f) return; f.text().then(t => { const j = JSON.parse(t); if (j.game !== 'meadow-mage' || !j.data || !JSON.parse(j.data.meadowmage_prog || 'null')) throw 0; for (const k of SAVE) if (typeof j.data[k] === 'string') localStorage.setItem(k, j.data[k]); location.reload(); }).catch(() => { msg.textContent = 'To nie wygląda na plik zapisu Meadow Mage — nic nie zmieniono.'; }); });
    row('Import zapisu', 'Zastępuje obecny postęp zawartością pliku i przeładowuje grę.', im);
    let arm = 0; const rs = el('button', 'lbtn warn', 'Usuń cały postęp');
    rs.addEventListener('click', () => { if (Date.now() > arm) { arm = Date.now() + 4000; rs.textContent = 'Na pewno? Kliknij jeszcze raz'; return; } for (const k of SAVE) localStorage.removeItem(k); location.reload(); });
    row('Reset', 'Kasuje postać, przedmioty, rekordy i opcje. Tego nie da się cofnąć.', rs);
    box.append(inp, msg);
  }

  /* ---------- how to play: every sentence points at a spot on a real screenshot ---------- */
  const HOW = [
    ['Ruch i celowanie', 'Pierwsze kroki na łące', 'how1', [
      [50, 50, 'Kliknij w grę, aby przejąć kursor. <b>Mysz</b> obraca widok, a czar leci tam, gdzie patrzy celownik. <kbd>Esc</kbd> zwalnia kursor.'],
      [30, 66, '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to ruch, <kbd>Shift</kbd> bieg, <kbd>Spacja</kbd> skok.'],
      [91.5, 15, '<b>Minimapa</b>: czerwone kropki to stwory, żółte to stanowiska w obozie, kolorowe to łupy.'],
      [50, 76.5, 'Pasek stanu: <b>serca</b>, numer fali, pokonane stwory i złoto.']]],
    ['Zaklęcia i mana', 'Walka', 'how2', [
      [50, 44, 'Fale wzywasz <b>Totemem fal</b> przed północną bramą wioski. <b>Lewy przycisk</b> rzuca wybrane zaklęcie; przytrzymaj, by rzucać seriami. <b>Prawy przycisk</b> to szybki podmuch, gdy go odblokujesz.'],
      [36, 92.5, '<kbd>1</kbd>–<kbd>8</kbd>, kółko myszy albo <kbd>Q</kbd> wybierają zaklęcie. Kłódka oznacza czar do odblokowania w drzewku.'],
      [66, 87.2, 'Niebieski pasek to <b>mana</b>. Każde zaklęcie ma własny koszt, czas odnowienia i zasięg; mana odnawia się sama.'],
      [33, 84.6, 'Zielony pasek to <b>doświadczenie</b>. Każdy poziom daje punkt umiejętności.']]],
    ['Obóz', 'Stanowiska przy ścieżce startowej', 'how3', [
      [50, 70, 'Podejdź do stanowiska i naciśnij <kbd>E</kbd> — podpowiedź pojawia się nad paskiem stanu.'],
      [28, 76, '<b>Skrzynia losu</b>, automat i koło fortuny dają losowe nagrody. Koło kręci się za darmo co 100 s.'],
      [91, 52, '<b>Goblin Arcymag</b> podpowiada. Obok stoją handlarz z miksturami i kowal, który ulepsza założone przedmioty.']]],
    ['Rozwój postaci', 'Panel pod klawiszem T', 'how4', [
      [70, 9.5, '<kbd>T</kbd> otwiera panel: umiejętności, <b>rozwój</b> i ekwipunek.'],
      [22, 26, '<b>Trening</b> za złoto na stałe wzmacnia moc, szybkość rzucania i manę.'],
      [30, 57, '<b>Kryształ many</b> ulepszasz tutaj, a klikasz w obozie.'],
      [40, 86, '<b>Zwierzaki</b>: jeden towarzyszy ci naraz. Niżej jest odrodzenie, dostępne od 15. poziomu.']]],
    ['Kryształ i obrona wieży', 'Clicker i tower defense', 'how5', [
      [46.5, 53, 'Przy <b>Krysztale many</b> wciskaj <kbd>E</kbd>: każde kliknięcie daje złoto i manę. Ładunki wracają szybciej, gdy pokonujesz stwory.'],
      [50, 76.5, '<b>Róg obrony</b> w obozie zaczyna obronę wieży. Stwory idą na kryształ — pilnuj jego życia na pasku stanu.'],
      [32, 50, '<kbd>B</kbd> stawia wieżyczkę za 100 złota (do 6). Strzela sama do najbliższego stwora.']]],
    ['Umiejętności', 'Drzewko pod klawiszem T', 'how6', [
      [33, 40, 'Pięć ścieżek: ogień, burza, mróz i pustka, natura, przetrwanie. Kupujesz od góry do dołu.'],
      [90, 30, 'Kliknij węzeł, by zobaczyć opis, i jeszcze raz, by go kupić za punkty.'],
      [14, 21, 'Pierwsze węzły ścieżek <b>odblokowują nowe zaklęcia</b> na pasku.']]]];
  let hi = 0;
  function how() {
    const box = $('secHow'), c = HOW[hi]; box.textContent = '';
    box.append(el('h3', null, `Jak grać · ${hi + 1} z ${HOW.length}`), el('h2', 'htitle', c[0]), el('p', 'hsub', c[1]));
    const wrap = el('div', 'how'), shot = el('div', 'shot'), img = document.createElement('img'), ol = el('ol', 'steps');
    img.src = `assets/shots/${c[2]}.jpg`; img.alt = 'Zrzut ekranu z gry: ' + c[0]; img.width = 1280; img.height = 720; shot.append(img);
    c[3].forEach((s, i) => {
      const pin = el('span', 'pin', i + 1), li = html('li', null, s[2]); pin.style.left = s[0] + '%'; pin.style.top = s[1] + '%';
      const on = v => { pin.classList.toggle('hot', v); li.classList.toggle('hot', v); };
      [pin, li].forEach(q => { q.addEventListener('pointerenter', () => on(true)); q.addEventListener('pointerleave', () => on(false)); });
      shot.append(pin); ol.append(li);
    });
    wrap.append(shot, ol); box.append(wrap);
    const nav = el('div', 'hnav'), prev = el('button', 'lbtn', '← Wstecz'), next = el('button', 'lbtn', hi === HOW.length - 1 ? 'Graj →' : 'Dalej →'), dots = el('div', 'dots');
    prev.disabled = hi === 0; prev.addEventListener('click', () => { hi--; how(); });
    next.addEventListener('click', () => { if (hi === HOW.length - 1) { hi = 0; $('stabs').children[1].click(); } else { hi++; how(); } });
    HOW.forEach((q, i) => { const d = el('button', i === hi ? 'act' : ''); d.setAttribute('aria-label', q[0]); d.addEventListener('click', () => { hi = i; how(); }); dots.append(d); });
    nav.append(prev, dots, next); box.append(nav);
    box.append(el('div', 'ofoot', 'Na telefonie: lewy dolny róg to joystick, przeciąganie obraca widok, stuknięcie rzuca czar.'));
  }

  /* ---------- profile: statistics, records, achievements ---------- */
  function profile() {
    const p = MM.prog(), s = p.st || {}, box = $('secProf'); box.textContent = '';
    const st = (a, b) => { const d = el('div', 'stat'); d.append(el('small', null, a), el('b', null, b)); return d; };
    const mins = Math.floor((s.t || 0) / 60), g = el('div', 'grid3');
    box.append(el('h3', null, 'Statystyki'));
    g.append(st('Czas gry', mins >= 60 ? Math.floor(mins / 60) + ' h ' + mins % 60 + ' min' : mins + ' min'), st('Pokonane stwory', s.k || 0), st('Bossowie', s.b || 0), st('Rzucone zaklęcia', s.c || 0), st('Kliknięcia kryształu', s.cl || 0), st('Porażki', s.d || 0), st('Rekord obrony wieży', (p.tdBest || 0) + ' fal'));
    MM.MAPS.forEach((m, i) => g.append(st(m.name, MM.best(i).wave ? 'fala ' + MM.best(i).wave : '—')));
    box.append(g, el('h3', null, 'Osiągnięcia'));
    const A = [['Pierwsza krew', 'Pokonaj 10 stworów', s.k || 0, 10], ['Tępiciel', 'Pokonaj 250 stworów', s.k || 0, 250], ['Pogromca', 'Pokonaj 1000 stworów', s.k || 0, 1000], ['Łowca bossów', 'Pokonaj 5 bossów', s.b || 0, 5], ['Uczeń', 'Osiągnij 5. poziom', p.lvl, 5], ['Arcymag', 'Osiągnij 15. poziom', p.lvl, 15],
      ['Obrońca łąki', 'Ukończ 10 fal na Kwitnącej Łące', MM.best(0).wave, 10], ['Zdobywca', 'Ukończ 10 fal w każdej krainie', MM.MAPS.filter((m, i) => MM.best(i).wave >= 10).length, 3], ['Klikacz', 'Kliknij kryształ 200 razy', s.cl || 0, 200], ['Strażnik kryształu', 'Przetrwaj 5 fal obrony wieży', p.tdBest || 0, 5], ['Treser', 'Zbierz wszystkie zwierzaki', (p.pets || []).length, MM.PETS.length], ['Feniks', 'Odródź się', p.rb || 0, 1]];
    const a = el('div', 'ach'); let done = 0;
    for (const q of A) { const ok = q[2] >= q[3], d = el('div', ok ? 'done' : ''), u = el('u'), i = el('i'); if (ok) done++; i.style.width = Math.min(100, q[2] / q[3] * 100) + '%'; u.append(i); d.append(el('b', null, (ok ? '★ ' : '') + q[0]), el('small', null, q[1] + ' · ' + Math.min(q[2], q[3]) + '/' + q[3]), u); a.append(d); }
    box.append(a, el('div', 'ofoot', `Zdobyte: ${done} z ${A.length}. Statystyki liczone są od tej wersji gry.`));
  }

  /* ---------- news ---------- */
  const NEWS = [
    ['Nowy launcher', '17 listopada 2026', ['Tło to teraz przelot kamery nad aktualną krainą, z paralaksą na mysz.', 'Podgląd maga w 3D: szata, kostur i pochodzenie zmieniają się na żywo.', 'Opcje w sześciu zakładkach, w tym przypisywanie klawiszy i eksport zapisu.', 'Samouczek ze zrzutami ekranu, profil ze statystykami i osiągnięciami, nagroda dnia.', 'W grze: liczby obrażeń, trzy style celownika, licznik klatek.']],
    ['Dwie nowe krainy z własnym charakterem', '20 listopada 2026', ['Mroźna Dolina: kopalnia kryształów z torami i wagonikami, rusztowania do rozwalenia, ogniska, zaspy, zorza i śliski lód.', 'Popielne Pustkowie: ogrodzony cmentarz z kryptą, kości, dynie, gejzery ognia i szkielety zamiast glutków.', 'Skrzynie losu z nowym układem i uczciwszym balansem, rozdzielanie par w blackjacku, przedmioty same lecą do ręki.']],
    ['Klasy i żywsza łąka', '20 listopada 2026', ['Cztery klasy zamiast pochodzenia: Piromanta, Kriomanta, Burzowiec i Nekromanta — każda z własnym modelem, premią i kolorem magii.', 'Gęstsze tło: las na obrzeżach, nowe drzewa, paprocie, grzyby i kwiaty, a na horyzoncie zamek, wiatraki i latarnia.', 'Stwory padają z animacją zamiast znikać. Słychać kroki.', 'Radar odświeża się płynnie, a podpowiedź [E] wybiera stanowisko, na które patrzysz.']],
    ['Wioska, boss i gry krupiera', '17 listopada 2026', ['Obóz to teraz wioska za palisadą: stwory do niej nie wchodzą, a fale wzywa Totem fal przed północną bramą (co trzy fale od nowa).', 'Co dziesiątą falę przychodzi boss z własnym paskiem życia i trzema fazami.', 'Trafienia krytyczne, słabszy rozprysk Fireballa i lepsze omijanie przeszkód przez stwory.', 'Trzy bronie: kostur, różdżka i księga. Założony trzon zmienia wygląd kosturu.', 'Krupier w wiosce: blackjack, wyżej czy niżej, zdrapka i trzy kufry. U handlarza sprzedaż wielu przedmiotów naraz.', 'Nowy pasek serc i zwierzak, który doskakuje do stworów.']],
    ['Modele 3D, mana i obrona wieży', '17 listopada 2026', ['Animowane modele stworów i postaci w obozie.', 'Mana, osobne koszty i zasięgi zaklęć, nowy Frostbolt.', 'Zakładka Rozwój: trening, kryształ many, zwierzaki, odrodzenie.', 'Tryb obrony wieży z wieżyczkami.']]];
  function news() {
    const box = $('secNews'); box.textContent = ''; box.append(el('h3', null, 'Nowości'));
    for (const n of NEWS) { const d = el('div', 'news'), ul = el('ul'); n[2].forEach(t => ul.append(el('li', null, t))); d.append(el('time', null, n[1]), el('h4', null, n[0]), ul); box.append(d); }
  }

  /* ---------- wiring ---------- */
  function setTab(i) {
    tab = i; waitKey = null; sbox.classList.toggle('nohero', i > 1 || !rend);
    if (i === 0) chips(); if (i === 1) charStats(); if (i === 2) options(); if (i === 3) how(); if (i === 4) profile(); if (i === 5) news();
  }
  MM.hooks.tab = setTab;
  MM.hooks.render = () => { backdrop(); if (tab === 0) chips(); heroTag(); };
  MM.hooks.open = () => { chips(); look(false); };
  backdrop(); setTab(0); look(false);
  if (!localStorage.getItem('meadowmage_seenhow')) { try { localStorage.setItem('meadowmage_seenhow', '1'); } catch (e) {} $('stabs').children[4].click(); }
}
