/* ===================================================
   웹구축센터 포트폴리오 — 작품 데이터 + 라이트박스
   (스튜디오센터 portfolio.js 스타일 이식)
=================================================== */
(function () {
  var WORKS = [
    { f: 'big_slide_02.jpg', t: '○○병원 반응형 홈페이지', c: '홈페이지' },
    { f: 'big_slide_03.jpg', t: '브랜드 글로벌 사이트', c: '홈페이지' },
    { f: 'main_03.png', t: '뷰티 브랜드 리뉴얼', c: '홈페이지' },
    { f: 'big_slide_04.jpg', t: '쇼핑몰 구축·리뉴얼', c: '쇼핑몰' },
    { f: 'main_12.png', t: '라이프스타일 커머스', c: '쇼핑몰' },
    { f: 'big_slide_06.jpg', t: '기업 모바일 앱', c: '앱' },
    { f: 'main_13.png', t: '멤버십·예약 앱', c: '앱' },
    { f: 'main_07.png', t: '랜딩페이지·영업DB', c: '랜딩' },
    { f: 'main_09.png', t: 'AEO·SEO 리뉴얼', c: 'SEO·AEO' },
    { f: 'hero.jpg', t: '인터랙티브 브랜드 사이트', c: '홈페이지' },
    { f: 'blog.png', t: '콘텐츠·블로그 채널', c: 'SEO·AEO' },
    { f: 'character.png', t: '브랜드 캐릭터·아이덴티티', c: '브랜딩' }
  ];
  window.HAO_WORKS = WORKS;
  window.HAO_imgPath = function (f) { return 'assets/img/' + f; };

  /* ---------- 라이트박스 (확대/이동 줌 + 키보드 + 긴 이미지 스크롤) ---------- */
  var ov, imgEl, capEl, scrollEl, zvalEl, curList = [], curIdx = 0;
  var scale = 1, tx = 0, ty = 0, drag = false, dsx = 0, dsy = 0;
  function applyZoom() {
    if (scale === 1) { tx = 0; ty = 0; imgEl.style.transform = ''; imgEl.style.cursor = ''; }
    else { imgEl.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')'; imgEl.style.cursor = drag ? 'grabbing' : 'grab'; }
    imgEl.style.transition = drag ? 'none' : '';
    if (zvalEl) zvalEl.textContent = Math.round(scale * 100) + '%';
    ov.classList.toggle('is-zoom', scale > 1);
  }
  function setScale(s) { scale = Math.max(1, Math.min(4, Math.round(s * 100) / 100)); applyZoom(); }
  function resetZoom() { scale = 1; tx = 0; ty = 0; drag = false; if (imgEl) { imgEl.style.transform = ''; imgEl.style.cursor = ''; } if (zvalEl) zvalEl.textContent = '100%'; ov && ov.classList.remove('is-zoom'); }
  function build() {
    ov = document.createElement('div');
    ov.className = 'lb';
    ov.innerHTML =
      '<button class="lb__close" aria-label="닫기">✕</button>' +
      '<button class="lb__nav lb__prev" aria-label="이전">‹</button>' +
      '<figure class="lb__stage"><div class="lb__scroll"><img alt="" /></div><figcaption></figcaption><span class="lb__hint">↕ 스크롤하여 전체 보기</span></figure>' +
      '<button class="lb__nav lb__next" aria-label="다음">›</button>' +
      '<div class="lb__zoom"><button data-z="out" aria-label="축소">&minus;</button><span class="lb__zval">100%</span><button data-z="in" aria-label="확대">+</button><button data-z="reset" aria-label="원래대로">⟲</button></div>';
    document.body.appendChild(ov);
    imgEl = ov.querySelector('img');
    capEl = ov.querySelector('figcaption');
    scrollEl = ov.querySelector('.lb__scroll');
    zvalEl = ov.querySelector('.lb__zval');
    imgEl.addEventListener('load', function () {
      var tall = imgEl.naturalWidth && (imgEl.naturalHeight / imgEl.naturalWidth) >= 2.2;
      ov.classList.toggle('is-tall', !!tall);
      scrollEl.scrollTop = 0;
    });
    ov.querySelector('.lb__zoom').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; e.stopPropagation();
      var z = b.dataset.z;
      if (z === 'in') setScale(scale + 0.5);
      else if (z === 'out') setScale(scale - 0.5);
      else resetZoom();
    });
    imgEl.addEventListener('click', function (e) {
      if (ov.classList.contains('is-tall')) return;
      e.stopPropagation();
      if (drag) return;
      setScale(scale > 1 ? 1 : 2);
    });
    scrollEl.addEventListener('wheel', function (e) {
      if (ov.classList.contains('is-tall')) return;
      e.preventDefault();
      setScale(scale + (e.deltaY < 0 ? 0.3 : -0.3));
    }, { passive: false });
    imgEl.addEventListener('pointerdown', function (e) {
      if (scale <= 1) return; e.preventDefault();
      drag = true; dsx = e.clientX - tx; dsy = e.clientY - ty; imgEl.style.cursor = 'grabbing';
      imgEl.setPointerCapture && imgEl.setPointerCapture(e.pointerId);
    });
    imgEl.addEventListener('pointermove', function (e) {
      if (!drag) return; tx = e.clientX - dsx; ty = e.clientY - dsy; applyZoom();
    });
    function endDrag() { if (drag) { drag = false; setTimeout(function () { drag = false; }, 0); applyZoom(); } }
    imgEl.addEventListener('pointerup', endDrag);
    imgEl.addEventListener('pointercancel', endDrag);

    ov.querySelector('.lb__close').addEventListener('click', close);
    ov.querySelector('.lb__prev').addEventListener('click', function (e) { e.stopPropagation(); go(-1); });
    ov.querySelector('.lb__next').addEventListener('click', function (e) { e.stopPropagation(); go(1); });
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    addEventListener('keydown', function (e) {
      if (!ov.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === '+' || e.key === '=') setScale(scale + 0.5);
      else if (e.key === '-') setScale(scale - 0.5);
    });
  }
  function render() {
    var w = curList[curIdx];
    ov.classList.remove('is-tall');
    resetZoom();
    if (scrollEl) scrollEl.scrollTop = 0;
    imgEl.src = window.HAO_imgPath(w.f);
    imgEl.alt = w.t;
    capEl.innerHTML = '<b>' + w.t + '</b><span>' + (w.c || '') + ' · ' + (curIdx + 1) + ' / ' + curList.length + '</span>';
  }
  function go(d) { curIdx = (curIdx + d + curList.length) % curList.length; render(); }
  function close() { ov.classList.remove('is-open'); document.body.classList.remove('lb-open'); }
  window.HAO_openLightbox = function (list, idx) {
    if (!ov) build();
    curList = list; curIdx = idx || 0; render();
    ov.classList.add('is-open'); document.body.classList.add('lb-open');
  };
})();
