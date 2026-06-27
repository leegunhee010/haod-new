// 웹구축센터 — 서비스 쇼케이스 화려한 스크롤 모션 (GSAP ScrollTrigger)
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  var show = document.querySelector('.show');
  if (!show) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  try {
    gsap.registerPlugin(ScrollTrigger);
    show.classList.add('gsap-on'); // CSS .in 등장 애니메이션 비활성 → GSAP가 제어

    // 인트로 헤드
    var head = show.querySelector('.show__head');
    if (head) {
      gsap.from([].slice.call(head.children), {
        opacity: 0, y: 40, duration: .9, stagger: .12, ease: 'power3.out',
        scrollTrigger: { trigger: head, start: 'top 82%' }
      });
    }

    [].slice.call(document.querySelectorAll('.show__item')).forEach(function (item) {
      var rev = item.classList.contains('rev');
      var text = item.querySelector('.show__text');
      var vwrap = item.querySelector('.show__visual');
      var big = item.querySelector('.show__big');
      var kids = text ? [].slice.call(text.children) : [];

      gsap.set(kids, { opacity: 0, y: 48 });
      if (vwrap) gsap.set(vwrap, {
        opacity: 0, y: 64, scale: .84, rotationY: rev ? 16 : -16,
        transformPerspective: 1100, transformOrigin: '50% 50%'
      });

      var tl = gsap.timeline({ scrollTrigger: { trigger: item, start: 'top 70%' } });
      tl.to(kids, { opacity: 1, y: 0, duration: .8, stagger: .085, ease: 'power3.out' }, 0);
      if (vwrap) tl.to(vwrap, {
        opacity: 1, y: 0, scale: 1, rotationY: 0, duration: 1.15, ease: 'power4.out'
      }, .12);

      // 거대 넘버: 드라마틱 등장 + 스크럽 패럴랙스
      if (big) {
        gsap.fromTo(big, { opacity: 0, scale: 1.45 }, {
          opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: item, start: 'top 78%' }
        });
        gsap.to(big, {
          yPercent: rev ? -42 : 42, ease: 'none',
          scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      }
    });

    // .reveal 요소(포트폴리오·프로세스·후기 등) 등장 — IO가 Lenis와 충돌해 미발화 → GSAP로 대체
    gsap.utils.toArray('.reveal').forEach(function (el) {
      gsap.from(el, {
        opacity: 0, y: 28, duration: .75, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%' }
      });
    });

    ScrollTrigger.refresh();
  } catch (e) {
    // 실패 시 GSAP 인라인 스타일 제거하고 CSS 폴백으로 복귀
    console.warn('show.js 모션 실패, 폴백:', e);
    show.classList.remove('gsap-on');
    [].slice.call(show.querySelectorAll('.show__text > *, .show__visual, .show__big')).forEach(function (el) {
      el.style.opacity = ''; el.style.transform = '';
    });
  }
})();
