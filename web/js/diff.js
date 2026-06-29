/* ===================================================
   웹구축센터 — WHY HAO 다크 섹션
   · AI 인용 출처 네트워크: 빛 입자가 허브로 흘러듦 + 펄스 링 + 노드 플로팅 + 마우스 패럴랙스
   · KPI 카운트업 + 포인트 리스트 스태거 (GSAP ScrollTrigger)
=================================================== */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var net = document.getElementById('netGraph');

  /* ---------- 네트워크 그래프 ---------- */
  if (net) {
    var cx = 210, cy = 168;
    var nodes = [
      { x: 80, y: 62, r: 14 }, { x: 120, y: 252, r: 11 }, { x: 330, y: 70, r: 15 },
      { x: 360, y: 212, r: 12 }, { x: 62, y: 172, r: 10 }, { x: 232, y: 42, r: 10 },
      { x: 300, y: 282, r: 11 }, { x: 170, y: 92, r: 8 }, { x: 382, y: 132, r: 9 }
    ];
    net.setAttribute('viewBox', '0 0 420 336');

    var defs = document.createElementNS(NS, 'defs');
    defs.innerHTML =
      '<radialGradient id="nodeG"><stop offset="0" stop-color="#ffc274"/><stop offset="1" stop-color="#e8631f"/></radialGradient>' +
      '<radialGradient id="hubG"><stop offset="0" stop-color="#ffe0bb"/><stop offset=".5" stop-color="#f25b35"/><stop offset="1" stop-color="#c42d12"/></radialGradient>' +
      '<filter id="nglow" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
    net.appendChild(defs);

    var g = document.createElementNS(NS, 'g');
    net.appendChild(g);

    var edges = nodes.map(function (n) {
      var l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', cx); l.setAttribute('y1', cy);
      l.setAttribute('x2', n.x); l.setAttribute('y2', n.y);
      l.setAttribute('stroke', 'rgba(236,110,55,.28)'); l.setAttribute('stroke-width', '1.2');
      g.appendChild(l); return l;
    });

    var rings = [];
    for (var ri = 0; ri < 3; ri++) {
      var rg = document.createElementNS(NS, 'circle');
      rg.setAttribute('cx', cx); rg.setAttribute('cy', cy);
      rg.setAttribute('fill', 'none'); rg.setAttribute('stroke', '#f25b35'); rg.setAttribute('stroke-width', '1.4');
      g.appendChild(rg); rings.push({ el: rg, phase: ri / 3 });
    }

    var nodeEls = nodes.map(function (n) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', n.r); c.setAttribute('fill', 'url(#nodeG)'); c.setAttribute('filter', 'url(#nglow)');
      c.setAttribute('cx', n.x); c.setAttribute('cy', n.y);
      g.appendChild(c); return c;
    });

    var dots = nodes.map(function (n, i) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', 3.4); c.setAttribute('fill', '#ffe0bb'); c.setAttribute('filter', 'url(#nglow)');
      g.appendChild(c); return { el: c, phase: i / nodes.length };
    });

    var hub = document.createElementNS(NS, 'circle');
    hub.setAttribute('cx', cx); hub.setAttribute('cy', cy); hub.setAttribute('r', 26);
    hub.setAttribute('fill', 'url(#hubG)'); hub.setAttribute('filter', 'url(#nglow)');
    g.appendChild(hub);

    if (reduce) {
      dots.forEach(function (d) { d.el.style.display = 'none'; });
      rings.forEach(function (r) { r.el.setAttribute('r', 34); r.el.setAttribute('opacity', .12); });
    } else {
      var floatPh = nodes.map(function () { return Math.random() * 6.28; });
      var mx = 0, my = 0, tmx = 0, tmy = 0;
      var card = net.closest('.diff__stage') || net;
      card.addEventListener('pointermove', function (e) {
        var b = card.getBoundingClientRect();
        tmx = ((e.clientX - b.left) / b.width - .5) * 18;
        tmy = ((e.clientY - b.top) / b.height - .5) * 18;
      });
      card.addEventListener('pointerleave', function () { tmx = 0; tmy = 0; });

      var t0 = 0, raf;
      function frame(t) {
        if (!t0) t0 = t;
        var el = (t - t0) / 1000;
        mx += (tmx - mx) * .06; my += (tmy - my) * .06;
        g.setAttribute('transform', 'translate(' + mx.toFixed(2) + ',' + my.toFixed(2) + ')');

        nodes.forEach(function (n, i) {
          var nx = n.x + Math.sin(el * .6 + floatPh[i]) * 4.5;
          var ny = n.y + Math.cos(el * .5 + floatPh[i]) * 4.5;
          nodeEls[i].setAttribute('cx', nx); nodeEls[i].setAttribute('cy', ny);
          edges[i].setAttribute('x2', nx); edges[i].setAttribute('y2', ny);
          n._cx = nx; n._cy = ny;
        });

        dots.forEach(function (d, i) {
          var tt = (el * .5 + d.phase) % 1;
          var e2 = tt * tt;                       // 허브로 갈수록 가속
          var n = nodes[i], sx = n._cx || n.x, sy = n._cy || n.y;
          d.el.setAttribute('cx', sx + (cx - sx) * e2);
          d.el.setAttribute('cy', sy + (cy - sy) * e2);
          d.el.setAttribute('opacity', (1 - tt) * .9 + .1);
          d.el.setAttribute('r', 2.4 + (1 - tt) * 1.6);
        });

        rings.forEach(function (r) {
          var tt = (el * .42 + r.phase) % 1;
          r.el.setAttribute('r', 26 + tt * 38);
          r.el.setAttribute('opacity', (1 - tt) * .5);
        });
        hub.setAttribute('r', 25 + Math.sin(el * 2) * 1.6);

        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
    }
  }

  /* ---------- KPI 카운트업 + 리스트 스태거 ---------- */
  if (!reduce && window.gsap && window.ScrollTrigger) {
    try {
      gsap.registerPlugin(ScrollTrigger);

      var kpis = [].slice.call(document.querySelectorAll('.diff__kpis .kchip b'));
      kpis.forEach(function (b) {
        var m = b.textContent.trim().match(/^([^\d]*)([\d.]+)(.*)$/);
        if (!m) return;
        var pre = m[1], target = parseFloat(m[2]), suf = m[3];
        var dec = (m[2].split('.')[1] || '').length;
        var obj = { v: 0 };
        b.textContent = pre + (0).toFixed(dec) + suf;
        gsap.to(obj, {
          v: target, duration: 1.7, ease: 'power2.out',
          scrollTrigger: { trigger: '.diff__stage', start: 'top 78%' },
          onUpdate: function () { b.textContent = pre + obj.v.toFixed(dec) + suf; }
        });
      });

      var pts = document.querySelectorAll('.diff__stage .fpoint');
      if (pts.length) {
        gsap.from(pts, {
          opacity: 0, y: 26, scale: .92, duration: .75, stagger: .14, ease: 'power3.out',
          scrollTrigger: { trigger: '.diff__stage', start: 'top 78%' }
        });
      }

      var ns = document.querySelector('.netstage .net');
      if (ns) {
        gsap.from(ns, {
          opacity: 0, scale: .84, duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: '.diff__stage', start: 'top 82%' }
        });
      }
    } catch (e) { /* 폴백: 정적 표시 */ }
  }
})();
