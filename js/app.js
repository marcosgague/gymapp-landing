/* Raul y Marcos: comportamiento de la landing.
   Regla: la página se ve entera sin JavaScript. Lo que se oculta para animarlo lo oculta este archivo. */
(function () {
  'use strict';
  var d = document;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fino = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var ancho = matchMedia('(min-width: 900px)').matches;

  /* ---------- Color legible (misma lógica que el configurador real) ---------- */
  function canal(h, i) { var v = parseInt(h.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function lum(h) { return 0.2126 * canal(h, 1) + 0.7152 * canal(h, 3) + 0.0722 * canal(h, 5); }
  function contraste(a, b) { var x = lum(a), y = lum(b); if (x < y) { var t = x; x = y; y = t; } return (x + 0.05) / (y + 0.05); }
  function mezcla(h, t, destino) {
    var out = '#';
    for (var i = 1; i < 7; i += 2) {
      var c = parseInt(h.slice(i, i + 2), 16), k = parseInt(destino.slice(i, i + 2), 16);
      out += ('0' + Math.round(c + (k - c) * t).toString(16)).slice(-2);
    }
    return out;
  }
  function legible(h, fondo) {
    var destino = fondo === '#000000' ? '#ffffff' : '#000000';
    var c = h;
    for (var t = 0; t <= 1 && contraste(c, fondo) < 4.5; t += 0.05) c = mezcla(h, t, destino);
    return c;
  }
  var FUENTE_COND = "'Bebas Neue', 'Arial Narrow', Impact, sans-serif";
  var FUENTE_ANCHA = "'Manrope', system-ui, sans-serif";
  var FUENTE_GENERICA = "Arial, Helvetica, sans-serif";

  /* Viste un móvil de muestra con una marca. opts: color, claro, fuente */
  function vestir(tel, opts) {
    var claro = !!opts.claro;
    tel.classList.toggle('claro', claro);
    var marca = legible(opts.color, claro ? '#ffffff' : '#000000');
    var sobre = contraste('#ffffff', marca) >= contraste('#000000', marca) ? '#ffffff' : '#000000';
    tel.style.setProperty('--marca', marca);
    tel.style.setProperty('--sobre', sobre);
    tel.style.setProperty('--f-tel', opts.fuente);
  }

  /* ---------- Vídeo de fondo de la portada ---------- */
  (function videoPortada() {
    var v = $('#fondo-video');
    var conexion = navigator.connection || {};
    if (!v || reduce || !ancho || conexion.saveData) return; // sin vídeo: queda la imagen fija del CSS
    var oscuro = matchMedia('(prefers-color-scheme: dark)');
    function esOscuro() {
      var forzado = d.documentElement.getAttribute('data-theme');
      return forzado ? forzado === 'dark' : oscuro.matches;
    }
    function poner() {
      var t = esOscuro() ? 'oscuro' : 'claro';
      if (v.dataset.tema === t) return;
      v.dataset.tema = t;
      v.classList.remove('ver');
      v.innerHTML = '<source src="video/fondo-' + t + '.webm" type="video/webm; codecs=vp9"><source src="video/fondo-' + t + '.mp4" type="video/mp4">';
      v.load();
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }
    v.addEventListener('playing', function () { v.classList.add('ver'); });
    oscuro.addEventListener('change', poner);
    poner();
  })();

  /* ---------- Copiar correo ---------- */
  var botonCopiar = $('#copiar');
  if (botonCopiar) {
    botonCopiar.addEventListener('click', function () {
      var aviso = $('#copiado'), destino = $('#correo');
      function seleccionar() {
        var r = d.createRange(); r.selectNodeContents(destino);
        var s = getSelection(); s.removeAllRanges(); s.addRange(r);
        aviso.textContent = 'Seleccionado. Cópialo con Ctrl+C.';
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(destino.textContent).then(function () { aviso.textContent = 'Copiado.'; }, seleccionar);
      } else { seleccionar(); }
    });
  }

  /* ---------- Configurador ---------- */
  (function configurador() {
    var tel = $('#tel-conf');
    if (!tel) return;
    var colores = ['#1D4ED8', '#B91C1C', '#15803D', '#C2410C', '#7E22CE', '#0F766E'];
    var estado = { color: colores[0], letra: 'cond', claro: false };
    var caja = $('#c-muestras');
    colores.forEach(function (c) {
      var b = d.createElement('button');
      b.type = 'button'; b.className = 'muestra'; b.dataset.color = c; b.style.background = c;
      b.setAttribute('aria-label', 'Color ' + c);
      b.addEventListener('click', function () { estado.color = c; otro.value = c.toLowerCase(); pintar(); });
      caja.appendChild(b);
    });
    var otro = d.createElement('input');
    otro.type = 'color'; otro.id = 'c-otro'; otro.value = colores[0].toLowerCase(); otro.setAttribute('aria-label', 'Elegir otro color');
    otro.addEventListener('input', function () { estado.color = otro.value; pintar(); });
    caja.appendChild(otro);

    function pintar() {
      vestir(tel, { color: estado.color, claro: estado.claro, fuente: estado.letra === 'cond' ? FUENTE_COND : FUENTE_ANCHA });
      var n = $('#c-nombre').value.trim() || 'Tu gimnasio';
      $('[data-gim]', tel).textContent = n;
      var on = { peso: $('#c-peso').checked, inc: $('#c-inc').checked };
      $$('[data-mod]', tel).forEach(function (el) { if (el.dataset.mod in on) el.hidden = !on[el.dataset.mod]; });
      $('[data-mod="ret"]').hidden = !$('#c-ret').checked;
      var tabs = [['Rutinas', true], ['Ejercicios', false], ['Historial', false]];
      if ($('#c-aforo').checked) tabs.push(['Aforo', false]);
      tabs.push(['Perfil', false]);
      $('[data-tabs]', tel).innerHTML = tabs.map(function (t) { return '<div class="' + (t[1] ? 'on' : '') + '"><i></i>' + t[0] + '</div>'; }).join('');
      $$('.muestra').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.color.toLowerCase() === estado.color.toLowerCase())); });
      $$('#c-letras button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.letra === estado.letra)); });
      $$('#c-temas button').forEach(function (b) { b.setAttribute('aria-pressed', String((b.dataset.tema === 'claro') === estado.claro)); });
    }
    $('#c-nombre').addEventListener('input', pintar);
    ['c-aforo', 'c-inc', 'c-ret', 'c-peso'].forEach(function (id) { $('#' + id).addEventListener('change', pintar); });
    $$('#c-letras button').forEach(function (b) { b.addEventListener('click', function () { estado.letra = b.dataset.letra; pintar(); }); });
    $$('#c-temas button').forEach(function (b) { b.addEventListener('click', function () { estado.claro = b.dataset.tema === 'claro'; pintar(); }); });
    pintar();
  })();

  if (!window.gsap || !window.ScrollTrigger) return; // sin librerías, la página queda como está
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  CustomEase.create('expo', '.16,1,.3,1');
  CustomEase.create('escena', '.65,0,.35,1');
  document.documentElement.classList.add('js');

  /* ---------- Cabecera: se oculta al bajar, vuelve al subir, gana fondo fuera de la portada ---------- */
  var cab = $('#cabecera'), ultimo = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: function (self) {
      var y = self.scroll();
      cab.classList.toggle('fondo', y > 80);
      if (y > 240 && y > ultimo + 4) cab.classList.add('oculta');
      else if (y < ultimo - 4 || y <= 240) cab.classList.remove('oculta');
      ultimo = y;
    }
  });

  if (reduce) {
    // Reducir movimiento: todo en su estado final. Solo el foco y los enlaces internos siguen.
    return;
  }

  /* ---------- Scroll suave (solo ratón) ---------- */
  var lenis = null;
  if (fino && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        var destino = id.length > 1 ? $(id) : null;
        if (destino) { e.preventDefault(); lenis.scrollTo(destino, { offset: -8, duration: 1.2 }); }
      });
    });
  }

  /* ---------- Revelados ---------- */
  $$('[data-revela]').forEach(function (el) {
    gsap.from(el, { y: 28, opacity: 0, duration: 0.8, ease: 'expo', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  $$('[data-cascada]').forEach(function (grupo) {
    gsap.from(grupo.children, { y: 24, opacity: 0, duration: 0.8, ease: 'expo', stagger: 0.07, scrollTrigger: { trigger: grupo, start: 'top 85%', once: true } });
  });
  $$('[data-celda]').forEach(function (el, i) {
    gsap.from(el, { y: 36, opacity: 0, duration: 0.8, ease: 'expo', delay: (i % 2) * 0.06, scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  });

  /* Titulares por líneas, con máscara */
  d.fonts.ready.then(function () {
    $$('[data-lineas]').forEach(function (h) {
      SplitText.create(h, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.lines, { yPercent: 110, duration: 0.8, ease: 'expo', stagger: 0.07, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
        }
      });
    });
    ScrollTrigger.refresh();
  });

  /* Contadores, barras y trazos */
  $$('[data-cuenta]').forEach(function (el) {
    var hasta = parseFloat(el.dataset.cuenta), dec = parseInt(el.dataset.decimales || '0', 10), pre = el.dataset.prefijo || '';
    var fmt = new Intl.NumberFormat('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    var o = { v: 0 };
    el.textContent = pre + fmt.format(0);
    gsap.to(o, { v: hasta, duration: 1.4, ease: 'expo.out', onUpdate: function () { el.textContent = pre + fmt.format(o.v); }, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  $$('.relleno').forEach(function (el, i) {
    gsap.from(el, { scaleX: 0, duration: 1, ease: 'expo', delay: (i % 2) * 0.12, scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  });
  var barras = $$('.aforo-barras i');
  if (barras.length) gsap.from(barras, { scaleY: 0, duration: 0.9, ease: 'expo', stagger: 0.035, scrollTrigger: { trigger: '#aforo', start: 'top 90%', once: true } });
  var celdas = $$('.calendario i');
  if (celdas.length) gsap.from(celdas, { opacity: 0, scale: 0.6, duration: 0.5, ease: 'expo', stagger: { each: 0.012, from: 'start' }, scrollTrigger: { trigger: '#calendario', start: 'top 90%', once: true } });
  var series = $$('[data-serie]');
  if (series.length) gsap.from(series, { opacity: 0, scale: 0.4, duration: 0.5, ease: 'expo', stagger: 0.28, scrollTrigger: { trigger: '.tabla-series', start: 'top 85%', once: true } });
  var traza = $('#camino .traza');
  if (traza) {
    gsap.set(traza, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.to(traza, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '#camino', start: 'top 70%', end: 'bottom 60%', scrub: 0.6 } });
  }

  /* ---------- Escena firma ---------- */
  (function escena() {
    var sec = $('#escena'), tel = $('#tel-escena');
    if (!sec || !tel) return;
    var pasos = $$('.paso-escena', sec);
    var nombreFinal = 'Iron Club', nombreGen = 'App de gimnasio';
    var GRIS = '#8b9099', MARCA = '#1D4ED8';
    var gim = $('[data-gim]', tel), tabAforo = $('[data-tab-aforo]', tel);
    var actual = -1;
    var clamp = gsap.utils.clamp(0, 1);

    function aplicar(p) {
      var nombre;
      if (p < 0.2) nombre = nombreGen;
      else { var t1 = clamp((p - 0.2) / 0.16); nombre = nombreFinal.slice(0, Math.max(1, Math.ceil(t1 * nombreFinal.length))); }
      gim.textContent = nombre;
      var color = gsap.utils.interpolate(GRIS, MARCA, clamp((p - 0.4) / 0.16));
      vestir(tel, { color: color.indexOf('#') === 0 ? color : rgbAHex(color), claro: false, fuente: p >= 0.6 ? FUENTE_COND : FUENTE_GENERICA });
      tabAforo.hidden = p >= 0.8;
      var i = Math.min(4, Math.floor(p / 0.2));
      if (i !== actual) {
        actual = i;
        pasos.forEach(function (el, k) { el.classList.toggle('activo', k === i); });
      }
    }
    function rgbAHex(s) {
      var m = s.match(/\d+/g);
      return '#' + m.slice(0, 3).map(function (n) { return ('0' + parseInt(n, 10).toString(16)).slice(-2); }).join('');
    }
    sec.classList.add('viva');
    aplicar(0);

    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      // Escritorio: la escena se queda fija y el scroll la conduce.
      sec.classList.add('fija');
      sec.style.minHeight = '100svh';
      sec.style.display = 'flex';
      sec.style.alignItems = 'center';
      ScrollTrigger.create({
        trigger: sec, start: 'top top', end: '+=260%', pin: true, scrub: 0.5, anticipatePin: 1,
        onUpdate: function (self) { aplicar(self.progress); }
      });
      return function () { sec.classList.remove('fija'); sec.style.minHeight = sec.style.display = sec.style.alignItems = ''; };
    });
    mm.add('(max-width: 899px)', function () {
      // Móvil: mismo relato con el scroll normal. Cada paso que entra en pantalla lleva el móvil a su estado.
      var proxy = { p: 0 };
      function ir(i) {
        gsap.killTweensOf(proxy);
        gsap.to(proxy, { p: i * 0.2 + 0.02, duration: 0.7, ease: 'escena', onUpdate: function () { aplicar(proxy.p); } });
      }
      pasos.forEach(function (el, i) {
        ScrollTrigger.create({
          trigger: el, start: 'top 62%',
          onEnter: function () { ir(i); },
          onLeaveBack: function () { ir(Math.max(0, i - 1)); }
        });
      });
    });
  })();

  /* ---------- Parallax suave (ratón) ---------- */
  if (fino) {
    $$('[data-parallax]').forEach(function (el) {
      gsap.to(el, { yPercent: -18, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------- Solo con ratón: cursor, botones magnéticos, tarjetas con inclinación y brillo ---------- */
  if (fino) {
    var cur = $('#cursor');
    var qx = gsap.quickTo(cur, 'x', { duration: 0.4, ease: 'expo' }), qy = gsap.quickTo(cur, 'y', { duration: 0.4, ease: 'expo' });
    addEventListener('pointermove', function (e) { cur.classList.add('ver'); qx(e.clientX); qy(e.clientY); }, { passive: true });
    d.addEventListener('pointerleave', function () { cur.classList.remove('ver'); });
    $$('a, button, summary, label, input').forEach(function (el) {
      el.addEventListener('pointerenter', function () { gsap.to(cur, { scale: 1.9, duration: 0.32, ease: 'expo' }); });
      el.addEventListener('pointerleave', function () { gsap.to(cur, { scale: 1, duration: 0.32, ease: 'expo' }); });
    });

    $$('[data-magnetico]').forEach(function (b) {
      var mx = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'expo' }), my = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'expo' });
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.25); my((e.clientY - (r.top + r.height / 2)) * 0.25);
      });
      b.addEventListener('pointerleave', function () { mx(0); my(0); });
    });

    var bento = $('.bento');
    if (bento) bento.style.perspective = '900px';
    $$('[data-celda]').forEach(function (c) {
      var rx = gsap.quickTo(c, 'rotationX', { duration: 0.6, ease: 'expo' }), ry = gsap.quickTo(c, 'rotationY', { duration: 0.6, ease: 'expo' });
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', (x * 100) + '%'); c.style.setProperty('--my', (y * 100) + '%');
        ry((x - 0.5) * 5); rx((0.5 - y) * 5);
      });
      c.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
  }

  addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
