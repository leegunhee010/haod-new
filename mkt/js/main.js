/* 하오디자인 마케팅센터 — main.js */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---- 헤더 stuck + 스크롤 진행바 ---- */
  var header = $('#header'), progress = $('#progress');
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle('is-stuck', y > 40);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (y / h * 100) : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---- 모바일 메뉴 ---- */
  var burger = $('#burger'), nav = $('#nav');
  if (burger) burger.addEventListener('click', function () { nav.classList.toggle('is-open'); });
  $$('#nav a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('is-open'); }); });

  /* ---- Works 플레이스홀더 (구조만) ---- */
  var WORKS = [
    { t: '브랜드 A', c: 'IMC', g: 'linear-gradient(160deg,#ff8a3d,#e83817)' },
    { t: '브랜드 B', c: 'Performance', g: 'linear-gradient(160deg,#6366f1,#3b1d8f)' },
    { t: '브랜드 C', c: 'IMC', c2: 'linear', g: 'linear-gradient(160deg,#22c55e,#0f766e)' },
    { t: '브랜드 D', c: 'Performance', g: 'linear-gradient(160deg,#f472b6,#be185d)' },
    { t: '브랜드 E', c: 'IMC', g: 'linear-gradient(160deg,#f59e0b,#b45309)' },
    { t: '브랜드 F', c: 'Performance', g: 'linear-gradient(160deg,#38bdf8,#0369a1)' },
    { t: '브랜드 G', c: 'IMC', g: 'linear-gradient(160deg,#a78bfa,#6d28d9)' },
    { t: '브랜드 H', c: 'Performance', g: 'linear-gradient(160deg,#fb7185,#9f1239)' }
  ];
  var track = $('#worksTrack');
  if (track) {
    track.innerHTML = WORKS.map(function (w) {
      return '<div class="swiper-slide"><div class="wcard">' +
        '<div class="wcard__media" style="background:' + w.g + '"><span>' + w.t + '</span></div>' +
        '<h3 class="wcard__t">' + w.t + '</h3><p class="wcard__c">' + w.c + '</p></div></div>';
    }).join('');
  }

  /* ---- Partners 플레이스홀더 ---- */
  var PARTNERS = [
    { b: 'Google', s: '공식 파트너' }, { b: 'NAVER', s: 'GFA 공식 대행사' }, { b: 'Meta', s: '비즈니스 파트너' },
    { b: 'Kakao', s: '프리미어 파트너' }, { b: 'TikTok', s: '공식 파트너' }, { b: 'YouTube', s: '인증 대행사' }
  ];
  var pwrap = $('#partners');
  if (pwrap) {
    pwrap.innerHTML = PARTNERS.map(function (p) {
      return '<div class="pcard"><b>' + p.b + '</b><span>' + p.s + '</span></div>';
    }).join('');
  }

  /* ---- Swiper (Works 가로 슬라이더) ---- */
  if (window.Swiper && track) {
    new Swiper('.worksSwiper', {
      slidesPerView: 'auto', spaceBetween: 24, grabCursor: true, freeMode: true,
      mousewheel: { forceToAxis: true }
    });
  }

  /* ---- reveal ---- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: .14 });
  $$('.reveal').forEach(function (el) { io.observe(el); });

  /* ---- 카운터 ---- */
  function runCount(el) {
    var to = +el.dataset.to, suf = el.dataset.suf || '', t0 = null, dur = 1400;
    function tick(t) {
      if (!t0) t0 = t; var p = Math.min((t - t0) / dur, 1), k = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * k).toLocaleString() + suf;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var cIo = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); cIo.unobserve(e.target); } });
  }, { threshold: .5 });
  $$('[data-to]').forEach(function (el) { cIo.observe(el); });

  /* ---- GSAP 핀 스크롤 연출 ---- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    var small = $('[data-pin="small"]'), big = $('[data-pin="big"]'), cap = $('[data-pin="cap"]');
    var tl = gsap.timeline({
      scrollTrigger: { trigger: '#pin', start: 'top top', end: 'bottom bottom', scrub: 1 }
    });
    gsap.set([small, big, cap], { opacity: 0, y: 40 });
    tl.to(small, { opacity: 1, y: 0, duration: .6 })
      .to(big, { opacity: 1, y: 0, duration: 1 }, '-=.2')
      .fromTo(big, { scale: .92 }, { scale: 1, duration: 2 }, '<')
      .to(cap, { opacity: 1, y: 0, duration: .6 }, '-=.6')
      .to({}, { duration: 1.2 })
      .to([small, big, cap], { opacity: 0, y: -40, duration: .8 });

    /* 히어로 워드마크 패럴랙스 */
    gsap.to('.hero__word', {
      yPercent: 18, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.holo', {
      yPercent: -12, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }
})();
