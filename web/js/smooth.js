// 웹구축센터 — Lenis 스무스 스크롤 (소이정 감성) + GSAP ScrollTrigger 동기화
(function () {
  if (!window.Lenis || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    var lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.6, lerp: 0.1 });
    window.lenis = lenis;

    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }

    // 앵커 링크 부드럽게 이동
    [].slice.call(document.querySelectorAll('a[href^="#"]')).forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id && id.length > 1) {
          var el = document.querySelector(id);
          if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -64 }); }
        }
      });
    });
  } catch (e) { console.warn('Lenis init 실패:', e); }
})();
