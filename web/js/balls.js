/* ===================================================
   웹구축센터 히어로 — 2D 캔버스 글로시 풍선
   (WebGL 불필요 · 마우스 반발 + 충돌 + 둥실 모션)
=================================================== */
(function () {
  var canvas = document.getElementById('balls2d');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  // 오렌지 / 레드 / 블랙 / 화이트 (하이라이트, 본색, 그림자색)
  var PAL = [
    ['#ffce8f', '#f25b35', '#b4280f'],
    ['#ff9f6e', '#e83817', '#7e1808'],
    ['#5a554e', '#1c1a16', '#000000'],
    ['#ffffff', '#ece4d7', '#bdb2a0']
  ];

  var W = 0, H = 0, DPR = 1, rect = null;
  var balls = [];
  var mouse = { x: -9999, y: -9999, on: false };
  var raf = 0, last = 0;

  function resize() {
    rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(W * DPR));
    canvas.height = Math.max(1, Math.round(H * DPR));
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
  }

  function build() {
    balls = [];
    var count = Math.max(6, Math.min(13, Math.round(W * H / 95000)));
    for (var i = 0; i < count; i++) {
      var r = rnd(Math.min(W, H) * 0.05, Math.min(W, H) * 0.13);
      balls.push({
        x: rnd(r, W - r), y: rnd(r, H - r),
        vx: rnd(-0.3, 0.3), vy: rnd(-0.3, 0.3),
        r: r, pal: PAL[i % PAL.length], ph: Math.random() * 6.283
      });
    }
  }

  function drawBall(b) {
    // 바닥 그림자
    ctx.save();
    ctx.beginPath();
    ctx.arc(b.x, b.y + b.r * 0.16, b.r, 0, 6.2832);
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = b.r * 0.6;
    ctx.shadowOffsetY = b.r * 0.3;
    ctx.fillStyle = 'rgba(0,0,0,0.001)';
    ctx.fill();
    ctx.restore();

    // 구체 본체 (라디얼 그라데이션 = 입체감)
    var g = ctx.createRadialGradient(
      b.x - b.r * 0.34, b.y - b.r * 0.4, b.r * 0.05,
      b.x, b.y, b.r
    );
    g.addColorStop(0, b.pal[0]);
    g.addColorStop(0.5, b.pal[1]);
    g.addColorStop(1, b.pal[2]);
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, 6.2832);
    ctx.fillStyle = g;
    ctx.fill();

    // 광택 하이라이트
    var hx = b.x - b.r * 0.32, hy = b.y - b.r * 0.38;
    var hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, b.r * 0.55);
    hg.addColorStop(0, 'rgba(255,255,255,0.9)');
    hg.addColorStop(0.6, 'rgba(255,255,255,0.12)');
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(hx, hy, b.r * 0.5, 0, 6.2832);
    ctx.fillStyle = hg;
    ctx.fill();

    // 얇은 림 라이트
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 0.99, 1.1, 2.5);
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = Math.max(1, b.r * 0.03);
    ctx.stroke();
  }

  function frame(t) {
    if (!last) last = t;
    last = t;
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < balls.length; i++) {
      var b = balls[i];
      // 둥실 드리프트
      b.vx += Math.sin(t * 0.0003 + b.ph) * 0.006;
      b.vy += Math.cos(t * 0.00026 + b.ph) * 0.006;

      // 마우스 반발
      if (mouse.on) {
        var dx = b.x - mouse.x, dy = b.y - mouse.y;
        var d = Math.sqrt(dx * dx + dy * dy), R = Math.max(140, b.r * 2.4);
        if (d < R && d > 0.001) {
          var f = (1 - d / R) * 0.9;
          b.vx += (dx / d) * f;
          b.vy += (dy / d) * f;
        }
      }

      // 공끼리 충돌 분리
      for (var j = i + 1; j < balls.length; j++) {
        var o = balls[j];
        var ox = o.x - b.x, oy = o.y - b.y;
        var od = Math.sqrt(ox * ox + oy * oy), mind = b.r + o.r;
        if (od < mind && od > 0.001) {
          var push = (mind - od) / od * 0.5;
          b.x -= ox * push; b.y -= oy * push;
          o.x += ox * push; o.y += oy * push;
          b.vx -= ox / od * 0.12; b.vy -= oy / od * 0.12;
          o.vx += ox / od * 0.12; o.vy += oy / od * 0.12;
        }
      }

      b.x += b.vx; b.y += b.vy;

      // 벽 반사
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.7; }
      if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.7; }
      if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * 0.7; }
      if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy) * 0.7; }

      // 마찰 + 속도 제한
      b.vx *= 0.99; b.vy *= 0.99;
      var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy), MAX = 2.6;
      if (sp > MAX) { b.vx = b.vx / sp * MAX; b.vy = b.vy / sp * MAX; }
    }

    for (var k = 0; k < balls.length; k++) drawBall(balls[k]);
    raf = requestAnimationFrame(frame);
  }

  function onMove(e) {
    if (!rect) return;
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.on = mouse.x > -50 && mouse.x < W + 50 && mouse.y > -50 && mouse.y < H + 50;
  }

  resize();
  // 정지 모션 환경: 한 번만 그려서 공은 보이게
  if (reduce) { ctx.clearRect(0, 0, W, H); for (var m = 0; m < balls.length; m++) drawBall(balls[m]); }
  else { raf = requestAnimationFrame(frame); }

  window.addEventListener('resize', function () { cancelAnimationFrame(raf); resize(); if (!reduce) raf = requestAnimationFrame(frame); });
  window.addEventListener('scroll', function () { rect = canvas.getBoundingClientRect(); }, { passive: true });
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerleave', function () { mouse.on = false; });
})();
