/* ===================================================
   하오스튜디오 포트폴리오 — 공유 데이터 + 라이트박스
   - HAO_WORKS: 전체 작품 (main: 메인 노출 여부)
   - 관리자 수정분이 있으면 localStorage('hs_portfolio')로 덮어씀
=================================================== */
(function () {
  var DEFAULT_WORKS = [
    { f: 'hs01.jpg', t: '배상면주가', c: '제품', main: true },
    { f: 'hs02.jpg', t: '고삼농협', c: '음식', main: true },
    { f: 'hs03.jpg', t: '지원바이오', c: '건강식품', main: true },
    { f: 'hs04.jpg', t: '얼티밋포텐셜', c: '건강식품', main: true },
    { f: 'hs05.jpg', t: '서울우유', c: '제품', main: true },
    { f: 'hs06.jpg', t: '서울우유', c: '제품', main: false },
    { f: 'hs07.jpg', t: '파라스파라', c: '뷰티', main: true },
    { f: 'hs08.jpg', t: '클리노믹스', c: '건강식품', main: true },
    { f: 'hs09.jpg', t: '퓨전에프앤씨', c: '제품', main: true },
    { f: 'hs10.jpg', t: '돌아이뷰티', c: '뷰티', main: true },
    { f: 'hs11.jpg', t: '황금어장', c: '음식', main: true },
    { f: 'hs12.jpg', t: '고령애봄봄', c: '음식', main: true },
    { f: 'hs13.jpg', t: '풍경식혜', c: '음식', main: false },
    { f: 'hs14.jpg', t: '인천디자인고등학교', c: '제품', main: false },
    { f: 'hs15.jpg', t: '이루웰', c: '건강식품', main: false },
    { f: 'hs16.jpg', t: '제이케이앤컴퍼니', c: '제품', main: false },
    { f: 'hs17.jpg', t: '원에이', c: '뷰티', main: false },
    { f: 'hs18.jpg', t: '광동생활건강', c: '건강식품', main: false },
    { f: 'hs19.jpg', t: 'HAVEN', c: '뷰티', main: false },
    { f: 'hs20.jpg', t: 'GIVENING COFFEE', c: '음식', main: true },
    { f: 'hs21.jpg', t: 'FROG', c: '제품', main: false },
    { f: 'hs22.jpg', t: 'BBRICK', c: '제품', main: false },
    { f: 'hs23.jpg', t: '1982웨이홈', c: '음식', main: false },
    { f: 'hs24.jpg', t: '424오마카세', c: '음식', main: true },
    { f: 'hs25.jpg', t: '블랙로엘 피톤치드', c: '상세페이지', main: true },
    { f: 'hs26.jpg', t: '오아가 뮤커스케어', c: '상세페이지', main: false },
    { f: 'hs27.jpg', t: '지문인식 IoT 도어락', c: '상세페이지', main: true },
    { f: 'hs28.jpg', t: '올케어 매트리스', c: '상세페이지', main: false },
    { f: 'hs29.jpg', t: '초고속 충전 어댑터', c: '상세페이지', main: true },
    { f: 'hs30.jpg', t: '쥬스멜로우 액상담배', c: '상세페이지', main: false },
    { f: 'hs31.jpg', t: '워터리스 309 세정제', c: '상세페이지', main: true },
    { f: 'hs32.jpg', t: '바로잰 Fit', c: '상세페이지', main: false },
    { f: 'detail-ssaju.jpg', t: '싸주아리 섬쑥차 상세페이지', c: '상세페이지', main: true },
    { f: 'hs33.jpg', t: '피에르파브르', c: '뷰티', main: false },
    { f: 'hs34.jpg', t: '뷰티스', c: '뷰티', main: true },
    { f: 'hs35.jpg', t: '서진바이오팜', c: '뷰티', main: false },
    { f: 'hs36.jpg', t: '자미원', c: '뷰티', main: false },
    { f: 'hs37.jpg', t: '투쿨포스쿨', c: '뷰티', main: true },
    { f: 'hs38.jpg', t: '이노맥스글로벌', c: '제품', main: false },
    { f: 'hs39.jpg', t: '힐미', c: '제품', main: false },
    { f: 'hs40.jpg', t: 'CP컴퍼니', c: '제품', main: false },
    { f: 'hs41.jpg', t: '베리굿스트로베리', c: '음식', main: true },
    { f: 'hs42.jpg', t: '레이델', c: '건강식품', main: false },
    { f: 'hs43.jpg', t: '더에이치큐', c: '건강식품', main: false },
    { f: 'hs44.jpg', t: '한독', c: '건강식품', main: true },
    { f: 'hs45.jpg', t: '태양생활건강', c: '건강식품', main: false },
    { f: 'hs46.jpg', t: '초당약품', c: '건강식품', main: false },
    { f: 'hs47.jpg', t: '진성케미칼', c: '기업', main: false },
    { f: 'hs48.jpg', t: '신원의료재단', c: '기업', main: true },
    { f: 'hs49.jpg', t: '아이앤디', c: '기업', main: false },
    { f: 'hs50.jpg', t: '일성탄소', c: '기업', main: false },
    { f: 'hs51.jpg', t: '구리한양요양병원', c: '기업', main: false },
    { f: 'hs52.jpg', t: '가산메탈', c: '기업', main: false },
    { f: 'hs53.jpg', t: '대양수산', c: '기업', main: false }
  ];

  // 관리자 저장분 병합 (브라우저 localStorage — 라이브 반영은 백엔드 연동 시)
  function load() {
    try {
      var raw = localStorage.getItem('hs_portfolio');
      if (raw) {
        var saved = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length) return saved;
      }
    } catch (e) {}
    return DEFAULT_WORKS.slice();
  }
  window.HAO_WORKS = load();
  window.HAO_WORKS_DEFAULT = DEFAULT_WORKS;
  window.HAO_imgPath = function (f) { return 'assets/haostudio/' + f; };

  /* ---------- 라이트박스 (긴 상세페이지·GIF 스크롤 + 확대/이동 줌) ---------- */
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
    // 이미지 로드 후 세로로 길면 스크롤 모드(is-tall)
    imgEl.addEventListener('load', function () {
      var tall = imgEl.naturalWidth && (imgEl.naturalHeight / imgEl.naturalWidth) >= 2.2;
      ov.classList.toggle('is-tall', !!tall);
      scrollEl.scrollTop = 0;
    });
    // 줌 버튼
    ov.querySelector('.lb__zoom').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; e.stopPropagation();
      var z = b.dataset.z;
      if (z === 'in') setScale(scale + 0.5);
      else if (z === 'out') setScale(scale - 0.5);
      else resetZoom();
    });
    // 클릭으로 확대/원복 (긴 이미지 스크롤 모드에선 무시)
    imgEl.addEventListener('click', function (e) {
      if (ov.classList.contains('is-tall')) return;
      e.stopPropagation();
      if (drag) return;
      setScale(scale > 1 ? 1 : 2);
    });
    // 휠 줌
    scrollEl.addEventListener('wheel', function (e) {
      if (ov.classList.contains('is-tall')) return;   // 스크롤 모드는 스크롤 우선
      e.preventDefault();
      setScale(scale + (e.deltaY < 0 ? 0.3 : -0.3));
    }, { passive: false });
    // 드래그로 이동(확대 상태일 때)
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
    ov.classList.remove('is-tall');           // 새 이미지 로드 전 초기화
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
