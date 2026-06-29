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

    // <p> 안의 텍스트를 단어 span으로 쪼개기(<b> 스타일 유지) — AI답변 워드 리빌용
    function splitWords(p) {
      var words = [];
      [].slice.call(p.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          var frag = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (!t.trim()) { frag.appendChild(document.createTextNode(t)); }
            else { var s = document.createElement('span'); s.className = 'w'; s.textContent = t; frag.appendChild(s); words.push(s); }
          });
          p.replaceChild(frag, node);
        } else if (node.nodeType === 1) {
          var host = node; host.textContent.split(/(\s+)/);
          var parts = node.textContent.split(/(\s+)/); node.textContent = '';
          parts.forEach(function (t) {
            if (!t) return;
            if (!t.trim()) { host.appendChild(document.createTextNode(t)); }
            else { var s = document.createElement('span'); s.className = 'w'; s.textContent = t; host.appendChild(s); words.push(s); }
          });
        }
      });
      return words;
    }

    // 카드 내부 콘텐츠 모션 — 카드 플립인 뒤에 이어서 재생
    function addContentMotion(vwrap, tl) {
      var POS = 0.8;
      var chat = vwrap.querySelector('.vchat');
      if (chat) {
        var q = chat.querySelector('.vchat__q'), a = chat.querySelector('.vchat__a'),
            p = chat.querySelector('.vchat__a p'), cite = chat.querySelector('.vchat__cite');
        var words = p ? splitWords(p) : [];
        gsap.set(q, { opacity: 0, scale: .82, y: 10, transformOrigin: '100% 100%' });
        gsap.set(a, { opacity: 0, y: 14 });
        gsap.set(words, { opacity: 0, yPercent: 60, filter: 'blur(3px)' });
        if (cite) gsap.set(cite, { opacity: 0, scale: .6, y: 6, transformOrigin: '0% 50%' });
        tl.to(q, { opacity: 1, scale: 1, y: 0, duration: .5, ease: 'back.out(1.7)' }, POS);
        tl.to(a, { opacity: 1, y: 0, duration: .45, ease: 'power3.out' }, POS + 0.5);
        tl.to(words, { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: .42, stagger: .022, ease: 'power2.out' }, POS + 0.75);
        if (cite) tl.to(cite, { opacity: 1, scale: 1, y: 0, duration: .5, ease: 'back.out(2)' }, '>-0.1');
        return;
      }
      var serp = vwrap.querySelector('.vserp');
      if (serp) {
        var search = serp.querySelector('.vserp__search'),
            hits = [].slice.call(serp.querySelectorAll('.vserp__hit')),
            rank = serp.querySelector('.vserp__rank'), top = serp.querySelector('.vserp__hit--top');
        gsap.set(search, { opacity: 0, y: -10 });
        gsap.set(hits, { opacity: 0, y: 18 });
        if (rank) gsap.set(rank, { scale: 0, rotate: -45, transformOrigin: '50% 50%' });
        tl.to(search, { opacity: 1, y: 0, duration: .5, ease: 'power3.out' }, POS);
        tl.to(hits, { opacity: 1, y: 0, duration: .55, stagger: .12, ease: 'power3.out' }, POS + 0.28);
        if (top) tl.to(top, { scale: 1.03, duration: .22, yoyo: true, repeat: 1, ease: 'power1.inOut', transformOrigin: '50% 50%' }, POS + 0.82);
        if (rank) tl.to(rank, { scale: 1, rotate: 0, duration: .6, ease: 'back.out(2.4)' }, POS + 0.85);
        return;
      }
      var web = vwrap.querySelector('.vweb');
      if (web) {
        var heroKids = [].slice.call(web.querySelectorAll('.vweb__hero > *')),
            cards = [].slice.call(web.querySelectorAll('.vweb__card'));
        gsap.set(heroKids, { opacity: 0, x: -14 });
        gsap.set(cards, { opacity: 0, y: 22 });
        tl.to(heroKids, { opacity: 1, x: 0, duration: .5, stagger: .1, ease: 'power3.out' }, POS);
        tl.to(cards, { opacity: 1, y: 0, duration: .55, stagger: .1, ease: 'back.out(1.4)' }, POS + 0.4);
        return;
      }
      var phone = vwrap.querySelector('.vphone');
      if (phone) {
        var nav = phone.querySelector('.vphone__nav'),
            cells = [].slice.call(phone.querySelectorAll('.vphone__cells span'));
        gsap.set(nav, { opacity: 0, y: -12 });
        gsap.set(cells, { opacity: 0, scale: .86, transformOrigin: '50% 50%' });
        tl.to(nav, { opacity: 1, y: 0, duration: .5, ease: 'power3.out' }, POS);
        tl.to(cells, { opacity: 1, scale: 1, duration: .5, stagger: .1, ease: 'back.out(1.6)' }, POS + 0.3);
        return;
      }
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
      if (vwrap) addContentMotion(vwrap, tl);

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
