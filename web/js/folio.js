/* ===================================================
   웹구축센터 포트폴리오 — 작품 데이터 + 라이트박스
   (스튜디오센터 portfolio.js 스타일 이식)
=================================================== */
(function () {
  /* 작품 데이터는 js/data.js(HAO)에서 — 관리자에서 수정. data.js 미로드 시 폴백 */
  var FALLBACK = [
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
  window.HAO_WORKS = (window.HAO && HAO.getWorks) ? HAO.getWorks() : FALLBACK;
  window.HAO_imgPath = function (f) { return (window.HAO && HAO.imgSrc) ? HAO.imgSrc(f) : 'assets/img/' + f; };

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
      '<aside class="lb__info">' +
        '<span class="lbi__cat"></span>' +
        '<h3 class="lbi__title"></h3>' +
        '<p class="lbi__desc"></p>' +
        '<p class="lbi__label">Project Info</p>' +
        '<div class="lbi__rows"></div>' +
      '</aside>' +
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
    fillInfo(w);
  }
  /* 작품 정보 패널: 작품별 값(admin) > 카테고리 기본 문구 */
  var LBI_DEF = {
    '홈페이지': { d: '기업의 서비스와 강점이 잘 전달되도록 구축한 홈페이지 제작 사례입니다. 기획부터 디자인, 퍼블리싱, 오픈까지 함께 진행했습니다.', del: '반응형 홈페이지', sc: '기획 · 디자인 · 퍼블리싱 · 오픈' },
    '쇼핑몰': { d: '구매 흐름을 고려해 설계한 쇼핑몰 구축 사례입니다. 상품 구성부터 결제 세팅까지 함께 진행했습니다.', del: '쇼핑몰 구축', sc: '기획 · 디자인 · 상품/결제 세팅' },
    '앱': { d: '사용 흐름에 맞춰 설계한 모바일 앱 구축 사례입니다.', del: '모바일 앱', sc: '기획 · UI 디자인 · 개발' },
    '랜딩': { d: '광고 유입을 전환으로 이어지게 설계한 랜딩페이지 제작 사례입니다.', del: '랜딩페이지', sc: '기획 · 카피 · 디자인' },
    'SEO·AEO': { d: '검색과 AI 검색에 잘 잡히도록 구조와 콘텐츠를 개선한 사례입니다.', del: 'SEO · AEO 개선', sc: '진단 · 구조 개선 · 콘텐츠' },
    '브랜딩': { d: '브랜드의 인상이 어디서나 일관되게 전해지도록 정리한 브랜딩 사례입니다.', del: '브랜드 아이덴티티', sc: '기획 · 디자인' }
  };
  function lbiEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function fillInfo(w) {
    if (!ov) return;
    var def = LBI_DEF[w.c] || {};
    ov.querySelector('.lbi__cat').textContent = w.c || '';
    ov.querySelector('.lbi__title').textContent = w.t || '';
    ov.querySelector('.lbi__desc').textContent = w.d || def.d || '';
    var rows = '';
    if (w.ind) rows += '<div><b>업종</b><span>' + lbiEsc(w.ind) + '</span></div>';
    var del = w.del || def.del;
    if (del) rows += '<div><b>제작물</b><span>' + lbiEsc(del) + '</span></div>';
    var sc = w.sc || def.sc;
    if (sc) rows += '<div><b>작업 범위</b><span>' + lbiEsc(sc) + '</span></div>';
    rows += '<div><b>문의</b><span><a href="index.html#contact">웹구축 상담하기 &rarr;</a></span></div>';
    ov.querySelector('.lbi__rows').innerHTML = rows;
  }
  function go(d) { curIdx = (curIdx + d + curList.length) % curList.length; render(); }
  function close() { ov.classList.remove('is-open'); document.body.classList.remove('lb-open'); }
  window.HAO_openLightbox = function (list, idx) {
    if (!ov) build();
    curList = list; curIdx = idx || 0; render();
    ov.classList.add('is-open'); document.body.classList.add('lb-open');
  };
})();
