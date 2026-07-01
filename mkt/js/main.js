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

  /* ---- Works (메인 상단 8개) — 데이터는 js/data.js(HAO), 관리자에서 수정 ---- */
  var FALLBACK_WORKS = [
    { img: '../design/assets/work/work01.jpeg', t: '브랜드 카탈로그', c: '비주얼 리뉴얼' },
    { img: '../voucher/assets/work/w379.jpg', t: '뷰티 디바이스 상세페이지', c: '이커머스 디자인' },
    { img: '../design/assets/work/work03.jpeg', t: '제품 키비주얼', c: '브랜드 콘텐츠' },
    { img: '../voucher/assets/work/w378.jpg', t: '건강식품 패키지', c: '패키지 디자인' },
    { img: '../design/assets/work/work07.jpeg', t: '기업 회사소개서', c: '편집 디자인' },
    { img: '../voucher/assets/work/w402.jpg', t: '수출 영문 카탈로그', c: '비주얼 리뉴얼' },
    { img: '../design/assets/work/work12.jpeg', t: '브랜드 홍보 포스터', c: '브랜드 콘텐츠' },
    { img: '../design/assets/work/work05.jpeg', t: '전시·박람회 홍보물', c: '전시·부스' }
  ];
  function imgPath(f) { return (window.HAO && HAO.imgSrc) ? HAO.imgSrc(f) : f; }
  var WORKS = (window.HAO && HAO.getWorks) ? HAO.getWorks().slice(0, 8) : FALLBACK_WORKS;
  var trackA = $('#worksTrackA'), trackB = $('#worksTrackB');
  function wcardHtml(w) {
    return '<div class="wcard" title="' + (w.t || '') + '"><div class="wcard__media" style="background-image:url(' + imgPath(w.img) + ')"></div></div>';
  }
  if (trackA && trackB) {
    var rowA = WORKS.map(wcardHtml).join('');
    var rowB = WORKS.slice().reverse().map(wcardHtml).join('');
    trackA.innerHTML = rowA + rowA;   // 2배 복제 → 무한 루프 이음새 없음
    trackB.innerHTML = rowB + rowB;
  }

  /* Partners 그리드 삭제됨 (사용자 요청) */

  /* Works는 CSS 두 줄 마퀴로 자동 롤링 (Swiper 미사용) */

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

    /* 핀 배경 사진: 스크롤 따라 위로 지나가게 (패럴랙스) */
    var pinBgTrack = document.getElementById('pinBgTrack');
    if (pinBgTrack) {
      gsap.fromTo(pinBgTrack, { yPercent: 26 }, {
        yPercent: -26, ease: 'none',
        scrollTrigger: { trigger: '#pin', start: 'top top', end: 'bottom bottom', scrub: 1 }
      });
    }

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
