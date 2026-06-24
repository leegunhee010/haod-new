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
    { f: 'hs24.jpg', t: '424오마카세', c: '음식', main: true }
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

  /* ---------- 라이트박스 ---------- */
  var ov, imgEl, capEl, curList = [], curIdx = 0;
  function build() {
    ov = document.createElement('div');
    ov.className = 'lb';
    ov.innerHTML =
      '<button class="lb__close" aria-label="닫기">✕</button>' +
      '<button class="lb__nav lb__prev" aria-label="이전">‹</button>' +
      '<figure class="lb__stage"><img alt="" /><figcaption></figcaption></figure>' +
      '<button class="lb__nav lb__next" aria-label="다음">›</button>';
    document.body.appendChild(ov);
    imgEl = ov.querySelector('img');
    capEl = ov.querySelector('figcaption');
    ov.querySelector('.lb__close').addEventListener('click', close);
    ov.querySelector('.lb__prev').addEventListener('click', function (e) { e.stopPropagation(); go(-1); });
    ov.querySelector('.lb__next').addEventListener('click', function (e) { e.stopPropagation(); go(1); });
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    addEventListener('keydown', function (e) {
      if (!ov.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    });
  }
  function render() {
    var w = curList[curIdx];
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
