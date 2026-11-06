/* VNEA · menú responsive, cuenta atrás y galería con visor. Sin dependencias. */
(function () {
  'use strict';

  /* ---------- Menú ---------- */
  var header = document.querySelector('.site-header');
  var toggle = header && header.querySelector('.nav-toggle');
  var nav = header && header.querySelector('.nav');
  var mq = window.matchMedia('(max-width: 1100px)');
  function setMenu(open, returnFocus) {
    if (!toggle) return;
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.classList.toggle('nav-lock', open && mq.matches);
    if (!open && returnFocus) toggle.focus();
  }
  if (toggle) {
    toggle.addEventListener('click', function () { setMenu(!header.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('click', function (e) {
      if (header.classList.contains('is-open') && !header.contains(e.target)) setMenu(false);
    });
    var backdrop = document.querySelector('.nav-backdrop');
    if (backdrop) backdrop.addEventListener('click', function () { setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('is-open')) { setMenu(false, true); }
    });
    var onChange = function () { if (!mq.matches) setMenu(false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange); else mq.addListener(onChange);
  }

  /* ---------- Cuenta atrás ---------- */
  document.querySelectorAll('[data-countdown]').forEach(function (el) {
    var target = new Date(el.getAttribute('data-countdown')).getTime();
    if (isNaN(target)) return;
    var q = function (u) { return el.querySelector('[data-u="' + u + '"]'); };
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var grid = el.querySelector('.cd__grid'), end = el.querySelector('.cd__end'), date = el.querySelector('.cd__date');
    var id;
    function tick() {
      var t = Math.max(0, Math.floor((target - Date.now()) / 1000));
      q('d').textContent = Math.floor(t / 86400);
      q('h').textContent = pad(Math.floor(t % 86400 / 3600));
      q('m').textContent = pad(Math.floor(t % 3600 / 60));
      q('s').textContent = pad(t % 60);
      if (t === 0) {
        grid.hidden = true; if (date) date.hidden = true; end.hidden = false;
        clearInterval(id);
      }
    }
    tick();
    if (!end.hidden || target > Date.now()) id = setInterval(tick, 1000);
  });

  /* ---------- Galería y visor ---------- */
  var gridEl = document.getElementById('galeria-grid');
  var items = window.VNEA_GALLERY || [];
  var lb, lbImg, lbCap, lbCount, lbClose, lbPrev, lbNext, current = 0, opener = null, touchX = null;

  function buildLightbox() {
    lb = document.createElement('div');
    lb.className = 'lb'; lb.hidden = true;
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Visor de fotografías');
    lb.innerHTML =
      '<button type="button" class="lb__btn lb__close" aria-label="Cerrar visor">&#10005;</button>' +
      '<button type="button" class="lb__btn lb__prev" aria-label="Fotografía anterior">&#8249;</button>' +
      '<button type="button" class="lb__btn lb__next" aria-label="Fotografía siguiente">&#8250;</button>' +
      '<figure class="lb__fig"><img class="lb__img" alt=""><figcaption class="lb__cap"></figcaption><p class="lb__count" aria-live="polite"></p></figure>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector('.lb__img'); lbCap = lb.querySelector('.lb__cap'); lbCount = lb.querySelector('.lb__count');
    lbClose = lb.querySelector('.lb__close'); lbPrev = lb.querySelector('.lb__prev'); lbNext = lb.querySelector('.lb__next');
    lbClose.addEventListener('click', closeLb);
    lbPrev.addEventListener('click', function () { show(current - 1); });
    lbNext.addEventListener('click', function () { show(current + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    lb.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX; touchX = null;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    });
    lbImg.addEventListener('error', function () {
      lbImg.removeAttribute('src'); lbImg.alt = '';
      lbCap.textContent = 'No se ha podido cargar esta fotografía.';
    });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); closeLb(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
      else if (e.key === 'Tab') {
        var f = [lbClose, lbPrev, lbNext], i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
      }
    });
  }
  function show(i) {
    var n = items.length; current = (i + n) % n;
    var it = items[current];
    lbImg.src = it.src; lbImg.alt = it.alt || '';
    lbCap.textContent = it.caption || '';
    lbCount.textContent = (current + 1) + ' de ' + n;
    var multi = n > 1; lbPrev.hidden = lbNext.hidden = !multi;
    if (multi) { new Image().src = items[(current + 1) % n].src; new Image().src = items[(current - 1 + n) % n].src; }
  }
  function openLb(i, from) {
    if (!lb) buildLightbox();
    opener = from; lb.hidden = false; document.body.classList.add('nav-lock');
    show(i); lbClose.focus();
  }
  function closeLb() {
    lb.hidden = true; document.body.classList.remove('nav-lock');
    if (opener) opener.focus();
  }

  if (gridEl) {
    if (!items.length) {
      gridEl.outerHTML = '<p class="gal-empty">Próximamente publicaremos aquí las fotografías de los campeonatos.</p>';
    } else {
      items.forEach(function (it, i) {
        var li = document.createElement('li'); li.className = 'gal-item';
        var b = document.createElement('button'); b.type = 'button'; b.className = 'gal-btn';
        b.setAttribute('aria-label', 'Ampliar fotografía ' + (i + 1) + ' de ' + items.length + ': ' + (it.alt || it.caption || ''));
        var img = document.createElement('img');
        img.src = it.thumb || it.src; img.alt = it.alt || ''; img.loading = i < 3 ? 'eager' : 'lazy'; img.decoding = 'async';
        img.width = 800; img.height = 600;
        img.addEventListener('error', function () { li.hidden = true; });
        b.appendChild(img);
        b.addEventListener('click', function () { openLb(i, b); });
        li.appendChild(b);
        if (it.caption) { var c = document.createElement('p'); c.className = 'gal-cap'; c.textContent = it.caption; li.appendChild(c); }
        gridEl.appendChild(li);
      });
    }
  }
})();
