/* ===================================================
   HAO WEB (웹구축센터) — shared data layer
   기본 데이터 + 관리자 오버라이드(Supabase 서버 + localStorage 캐시).
   · design·studio 센터와 같은 Supabase 프로젝트를 공유하되, 키는 모두 "hw_" 접두사로 분리.
   · 견적문의는 공유 inquiries 테이블에 저장하되 type 앞에 "[웹]" 표시로 구분.
=================================================== */
(function () {
  "use strict";

  /* ---- Supabase 연결 (design·studio 센터와 동일 프로젝트 공유) ---- */
  var SB_URL = "https://oaqrjrrgntlqmyxxovfn.supabase.co";
  var SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcXJqcnJnbnRscW15eHhvdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NjQzMTUsImV4cCI6MjA5NzE0MDMxNX0.3bOfZOXVKSoI9ELfE7ZjWETuxvjpNYHdCBSIMrbAGtU";
  var SB_H = { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": "application/json" };

  /* 웹구축센터 문의 식별 태그 (type 앞에 붙여 design·studio 문의와 구분) */
  var INQ_TAG = "[웹]";

  /* 서버에서 web 오버라이드(hw_*)만 불러와 localStorage 캐시에 채움 (페이지 부팅 시 1회). */
  function sbLoad() {
    var hasCache = false;
    try {
      for (var ci = 0; ci < localStorage.length; ci++) {
        var ck = localStorage.key(ci);
        if (ck && ck.indexOf("hw_") === 0 && ck !== "hw_admin_cred" && ck !== "hw_edit") { hasCache = true; break; }
      }
    } catch (e) {}
    var timed = new Promise(function (resolve) { setTimeout(resolve, hasCache ? 3000 : 12000); });
    var fetched = fetch(SB_URL + "/rest/v1/overrides?select=k,v&k=like.hw_*", { headers: SB_H })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        var seen = {};
        rows.forEach(function (row) {
          seen[row.k] = 1;
          try { localStorage.setItem(row.k, JSON.stringify(row.v)); } catch (e) {}
        });
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var lk = localStorage.key(i);
          if (lk && lk.indexOf("hw_") === 0 && lk !== "hw_admin_cred" && lk !== "hw_edit" && !seen[lk]) {
            localStorage.removeItem(lk);
          }
        }
      })
      .catch(function () { /* 오프라인 시 로컬 캐시로 동작 */ });
    return Promise.race([fetched, timed]);
  }

  function sbSave(k, v) {
    return fetch(SB_URL + "/rest/v1/overrides", {
      method: "POST",
      headers: { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify([{ k: k, v: v, updated_at: new Date().toISOString() }])
    });
  }
  function sbDelete(k) {
    return fetch(SB_URL + "/rest/v1/overrides?k=eq." + encodeURIComponent(k), { method: "DELETE", headers: SB_H });
  }

  /* 이미지 파일(Blob)을 Storage('images' 버킷, 다른 센터와 공유)에 업로드 → 공개 URL 반환 */
  function sbUpload(blob, ext) {
    var name = "hw_" + Date.now() + "_" + Math.floor(Math.random() * 1e9).toString(36) + "." + (ext || "jpg");
    return fetch(SB_URL + "/storage/v1/object/images/" + name, {
      method: "POST",
      headers: { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": blob.type || "image/jpeg", "x-upsert": "true" },
      body: blob
    }).then(function (r) {
      return r.ok ? (SB_URL + "/storage/v1/object/public/images/" + name) : null;
    }).catch(function () { return null; });
  }

  /* 이미지 키 → 실제 경로
     "hero.jpg" → assets/img/hero.jpg
     "assets/..." (슬래시 포함) → 그대로
     "https://…" · "data:…" → 그대로 */
  function imgSrc(f) {
    if (!f) return "";
    if (/^(https?:|data:)/.test(f)) return f;
    if (f.indexOf("/") >= 0) return f;
    return "assets/img/" + f;
  }

  /* ===== 기본 포트폴리오 (웹·앱 제작) — main:true 는 메인페이지 노출 ===== */
  var DEFAULT_WORKS = [
    { f: 'pf-kongjin.jpg', t: '㈜공진', c: '홈페이지', main: true },
    { f: 'pf-daeyangsusan.jpg', t: '대양수산영어조합법인', c: '홈페이지', main: true },
    { f: 'pf-neopwr.jpg', t: '㈜네오파워텍', c: '홈페이지', main: true },
    { f: 'pf-pharmicellbc.jpg', t: '파미셀㈜ 바이오케미컬', c: '홈페이지', main: true },
    { f: 'pf-gnlifekorea.jpg', t: '금산글로벌인삼', c: '홈페이지', main: true },
    { f: 'pf-bestdh.jpg', t: '대현공업㈜', c: '홈페이지', main: true },
    { f: 'pf-krafm.jpg', t: '한국마사회시설관리㈜', c: '홈페이지', main: true },
    { f: 'pf-royalchef.jpg', t: '대령숙수', c: '홈페이지', main: true },
    { f: 'pf-ycdis.jpg', t: 'YCDIS', c: '홈페이지', main: true },
    { f: 'pf-happytrekking.jpg', t: '해피트레킹', c: '홈페이지', main: true },
    { f: 'pf-dysf.jpg', t: '대영에스에프', c: '홈페이지', main: true }
  ];

  /* ===== 메인 히어로 (단일) — title 의 줄바꿈 = <br>, **단어** = em 강조 ===== */
  var DEFAULT_HERO = [
    { eng: "WE BUILD", title: "Digital\nExperience", desc: "검색되는 홈페이지, AI가 답하는 브랜드 — 발견되는 웹 경험을 설계합니다.", img: "assets/img/hero.jpg" }
  ];

  /* ===== 칼럼 글 ===== */
  var DEFAULT_POSTS = [
    { id: 6, title: 'SEO를 넘어 GEO·AEO 시대로', summary: 'AI가 답변에서 추천하는 홈페이지란? SEO와 GEO의 차이를 정리했습니다.', date: '2026-06-20', img: 'assets/img/big_slide_02.jpg', isNew: true,
      body: ['검색 결과 상위 노출을 목표로 하던 시대에서, 이제는 생성형 AI가 답변 속에서 추천하는 홈페이지를 만드는 시대로 넘어가고 있습니다.', 'SEO가 검색엔진을 위한 최적화라면, GEO·AEO는 ChatGPT·Perplexity 같은 AI가 우리 콘텐츠를 인용·추천하도록 만드는 전략입니다.', '하오디자인은 제작 단계부터 구조화 데이터(스키마)와 신뢰 신호를 함께 설계해, 사람과 AI 모두에게 발견되는 홈페이지를 만듭니다.'] },
    { id: 5, title: '네이버 AI 탭, 검색은 어떻게 바뀌나', summary: '대화형 AI 검색으로 재편되는 검색 환경과 대응 전략.', date: '2026-06-12', img: 'assets/img/big_slide_03.jpg', isNew: true,
      body: ['네이버가 대화형 AI 검색 ‘AI 탭’을 선보이며 검색 행위 자체가 재구성되고 있습니다.', '키워드 중심에서 의도·맥락 중심으로 이동하는 만큼, 콘텐츠 구조와 데이터 정합성이 더 중요해집니다.'] },
    { id: 4, title: '반응형 vs 적응형, 무엇을 택할까', summary: '디바이스 대응 방식의 차이와 선택 기준.', date: '2026-05-30', img: 'assets/img/big_slide_04.jpg', isNew: false,
      body: ['반응형(Responsive)은 하나의 코드로 모든 화면에 유연하게 대응하고, 적응형(Adaptive)은 기기별 레이아웃을 따로 제공합니다.', '대부분의 기업·브랜드 사이트는 유지보수와 SEO 측면에서 반응형이 유리합니다.'] },
    { id: 3, title: '홈페이지 리뉴얼 체크리스트', summary: '리뉴얼 전 반드시 점검해야 할 7가지.', date: '2026-05-21', img: 'assets/img/big_slide_06.jpg', isNew: false,
      body: ['리뉴얼은 디자인 교체가 아니라 구조·성능·검색의 재설계입니다.', '기존 URL 구조와 유입 키워드를 분석해 SEO 자산을 잃지 않도록 이전 계획을 세우는 것이 핵심입니다.'] },
    { id: 2, title: '모바일 앱 vs 웹앱, 우리에겐 뭐가 맞을까', summary: '비용·기능·배포 관점의 비교.', date: '2026-05-13', img: 'assets/img/main_07.png', isNew: false,
      body: ['네이티브 앱은 성능·기기 기능 활용에 강하고, 웹앱(PWA)은 비용·배포·접근성에 강점이 있습니다.', '서비스 목적과 예산에 따라 하이브리드 방식이 현실적인 선택이 되기도 합니다.'] },
    { id: 1, title: 'Core Web Vitals, 성능이 곧 순위', summary: '체감 속도 지표와 최적화 포인트.', date: '2026-04-29', img: 'assets/img/main_09.png', isNew: false,
      body: ['LCP·INP·CLS로 대표되는 Core Web Vitals는 사용자 경험이자 검색 순위 요소입니다.', '이미지 최적화·코드 분할·캐싱으로 체감 속도를 끌어올리면 이탈률과 전환율이 함께 개선됩니다.'] }
  ];

  /* ===== Q&A ===== */
  var DEFAULT_QNA = [
    { c: '홈페이지 제작', q: '홈페이지 제작 기간은 보통 얼마나 걸리나요?', a: '규모와 기능에 따라 다르지만 일반 기업·브랜드 사이트는 보통 4~8주, 시스템·CMS가 포함되면 그 이상 소요됩니다. 일정은 상담 시 구체적으로 안내합니다.' },
    { c: '홈페이지 제작', q: '제작 비용은 어떻게 산정되나요?', a: '페이지 수, 기능(예약·결제·CMS), 디자인 수준, 다국어 여부 등에 따라 산정됩니다. 요구사항을 알려주시면 맞춤 견적을 드립니다.' },
    { c: '홈페이지 제작', q: '기존 홈페이지 리뉴얼도 가능한가요?', a: '네. 기존 구조·유입 키워드·콘텐츠를 분석해 SEO 자산을 유지하면서 디자인·성능·검색을 함께 개선합니다.' },
    { c: '홈페이지 제작', q: '반응형으로 제작되나요?', a: '기본적으로 모든 사이트는 PC·태블릿·모바일에 대응하는 반응형으로 제작합니다.' },
    { c: '앱 개발', q: '모바일 앱도 만들 수 있나요?', a: '네. iOS·Android 네이티브 또는 하이브리드 방식으로 제작하며, 서비스 목적·예산에 맞는 방식을 함께 정합니다.' },
    { c: '앱 개발', q: 'API·외부 시스템 연동이 되나요?', a: '결제·예약·CRM 등 외부 API 연동과 자체 백엔드 개발이 가능합니다.' },
    { c: '앱 개발', q: '관리자(CMS)도 함께 제공되나요?', a: '콘텐츠를 직접 수정할 수 있는 맞춤 관리자(CMS)를 함께 구축해 드립니다.' },
    { c: 'AEO·SEO', q: 'SEO와 AEO·GEO는 뭐가 다른가요?', a: 'SEO는 검색엔진 결과 상위 노출을 위한 최적화이고, AEO·GEO는 ChatGPT·Perplexity 등 생성형 AI가 답변에서 우리 콘텐츠를 인용·추천하도록 만드는 최적화입니다.' },
    { c: 'AEO·SEO', q: '제작하면 SEO가 기본으로 되나요?', a: '제작 단계에서 메타·구조·성능·구조화 데이터(스키마)를 기본 적용합니다. 키워드 전략·콘텐츠 운영은 별도 옵션으로 제공합니다.' },
    { c: 'AEO·SEO', q: 'AI 검색에 노출되려면 무엇이 필요한가요?', a: '명확한 정보 구조, 구조화 데이터, 신뢰 가능한 콘텐츠와 일관된 출처 신호가 중요합니다. 제작 시 이를 함께 설계합니다.' },
    { c: 'AEO·SEO', q: '성능(속도) 최적화도 해주나요?', a: 'Core Web Vitals(LCP·INP·CLS) 기준으로 이미지·코드·캐싱을 최적화해 체감 속도와 검색 순위를 함께 개선합니다.' },
    { c: '운영·기타', q: '오픈 후 유지보수도 가능한가요?', a: '네. 콘텐츠 수정·기능 추가·보안 점검 등 정기·수시 유지보수를 지원합니다.' },
    { c: '운영·기타', q: '도메인·호스팅도 대행해 주나요?', a: '도메인 연결, 호스팅·서버 세팅, SSL 적용까지 함께 처리해 드립니다.' },
    { c: '운영·기타', q: '다른 센터 서비스(디자인·촬영·마케팅)와 연계되나요?', a: '네. 카탈로그·촬영·마케팅이 필요하면 하오디자인 패밀리 센터와 연계해 원스톱으로 진행합니다.' }
  ];

  /* ===== 파트너(클라이언트) 로고 — 메인 흐르는 띠 ===== */
  var DEFAULT_PARTNERS = [];
  [46, 48, 50, 52, 54, 56, 58, 68, 70, 72, 74, 76, 78, 80, 89, 91, 93, 95, 97, 99].forEach(function (n) {
    DEFAULT_PARTNERS.push("assets/partners/p" + n + ".png");
  });

  /* ===== 사이트 설정 ===== */
  var DEFAULT_SETTINGS = {
    tel: "1666-2027",
    email: "sales@haodesign.co.kr",
    time: "평일 09:00 – 18:00",
    addr: "서울시 광진구 능동로49길 9, 2F",
    bizName: "주식회사 하오커뮤니케이션",
    ceo: "박창민",
    bizNo: "528-87-01037"
  };

  /* 우측 하단 빠른버튼(선택) — 비우면 숨김 */
  var DEFAULT_SOCIAL = { kakao: "", instagram: "", blog: "", phone: "1666-2027" };

  /* ===== SEO ===== */
  var DEFAULT_SEO = {
    siteUrl: "https://haodesign.co.kr",
    ogImage: "assets/img/hero.jpg",
    pages: {
      index: {
        title: "웹구축센터 | 하오디자인 — SEO·AEO 홈페이지·앱 제작",
        desc: "하오디자인 웹구축센터. 검색되는 홈페이지부터 AI가 답하는 브랜드까지 — SEO·AEO 설계가 들어간 홈페이지·앱을 제작합니다. 만드는 데서 끝나지 않고, 발견되게 만듭니다.",
        keywords: "홈페이지 제작, 앱 제작, SEO, AEO, GEO, AI 검색 최적화, 반응형 홈페이지, 모바일 앱, 구조화 데이터, 하오디자인 웹구축센터" },
      portfolio: {
        title: "포트폴리오 | 웹구축센터 — 하오디자인",
        desc: "하오디자인 웹구축센터가 직접 기획·제작한 홈페이지·앱·검색 최적화 프로젝트 포트폴리오.",
        keywords: "홈페이지 포트폴리오, 웹제작 사례, 앱개발 사례, SEO 리뉴얼, 하오디자인 웹구축센터" },
      column: {
        title: "칼럼 | 웹구축센터 — 하오디자인",
        desc: "홈페이지 제작·앱·AEO·SEO·GEO 트렌드와 실무 인사이트를 전하는 하오디자인 웹구축센터 칼럼.",
        keywords: "웹 칼럼, SEO 칼럼, AEO, GEO, 홈페이지 제작 팁, 웹 트렌드" },
      qna: {
        title: "Q&A | 웹구축센터 — 하오디자인",
        desc: "홈페이지 제작·앱·AEO·SEO 자주 하는 질문. 제작·개발·검색최적화·운영 카테고리별 Q&A.",
        keywords: "홈페이지 제작 문의, 제작 기간, 제작 비용, 앱 개발 문의, SEO 문의" },
      "seo-check": {
        title: "무료 SEO 진단 | 웹구축센터 — 하오디자인",
        desc: "URL만 넣으면 22개 항목을 100점 만점으로 진단. 우리 홈페이지의 SEO 점수를 지금 바로 확인하세요.",
        keywords: "SEO 진단, SEO 점수, 무료 SEO 검사, 홈페이지 진단, 검색 최적화 진단" }
    }
  };

  /* ===== 사이트 카피 (관리자 '카피 수정' 탭) =====
     page: 적용 페이지 / sel: 대상 선택자 / tag: **강조** 변환 태그(em·b) / attr: 속성 적용 */
  var DEFAULT_COPY = [
    /* ───── 메인 · 히어로/제목 (~~단어~~ = 오렌지 그라데이션 강조) ───── */
    { key: "hero_eg", page: "index", sel: ".hero2__eg", tag: "b", label: "히어로 — 상단 라벨", value: "WE BUILD" },
    { key: "hero_t", page: "index", sel: ".hero2__t", tag: "b", label: "히어로 — 큰 제목", value: "Digital\nExperience" },
    { key: "hero_d", page: "index", sel: ".hero2__d", tag: "b", label: "히어로 — 설명", value: "검색되는 홈페이지, AI가 답하는 브랜드 — 발견되는 웹 경험을 설계합니다." },
    { key: "strat_title", page: "index", sel: ".gcar__title", tag: "b", label: "전략 섹션 — 제목", value: "검색의 시대에서, AI의 시대로\n~~SEO를 넘어 GEO·AEO~~까지" },
    { key: "svc_title", page: "index", sel: ".show__title", tag: "b", label: "서비스 섹션 — 제목", value: "하나의 팀이 ~~제작부터 검색 노출까지~~\n책임집니다" },
    { key: "svc1_t", page: "index", sel: ".show .show__item:nth-of-type(2) .show__t", tag: "b", label: "서비스① SEO — 제목", value: "검색엔진 상위노출,\n구조부터 다르게" },
    { key: "svc2_t", page: "index", sel: ".show .show__item:nth-of-type(3) .show__t", tag: "b", label: "서비스② AEO — 제목", value: "ChatGPT·Gemini가\n~~인용하는~~ 콘텐츠" },
    { key: "svc3_t", page: "index", sel: ".show .show__item:nth-of-type(4) .show__t", tag: "b", label: "서비스③ WEBSITE — 제목", value: "반응형 홈페이지·\n랜딩·쇼핑몰 제작" },
    { key: "svc4_t", page: "index", sel: ".show .show__item:nth-of-type(5) .show__t", tag: "b", label: "서비스④ APP — 제목", value: "모바일 앱·\n시스템 개발" },
    { key: "work_title", page: "index", sel: "#work .sec__title", tag: "b", label: "포트폴리오 섹션 — 제목", value: "최근 제작 사례" },

    /* ───── 메인 · 설명/기타 ───── */
    { key: "strat_sub", page: "index", sel: ".gcar__sub", tag: "b", label: "전략 섹션 — 설명", value: "변화하는 검색 환경에 대응하는 통합 최적화 전략. 검색 환경부터 사용자 경험까지, 결과를 만드는 모든 조건을 설계합니다." },
    { key: "strat_chip1", page: "index", sel: ".gcar__chips .gchip:nth-of-type(1)", tag: "b", label: "전략 섹션 — 태그①", value: "키워드·메타 최적화" },
    { key: "strat_chip2", page: "index", sel: ".gcar__chips .gchip:nth-of-type(2)", tag: "b", label: "전략 섹션 — 태그②", value: "구조화 데이터" },
    { key: "strat_chip3", page: "index", sel: ".gcar__chips .gchip:nth-of-type(3)", tag: "b", label: "전략 섹션 — 태그③", value: "AI 인용 설계" },
    { key: "strat_chip4", page: "index", sel: ".gcar__chips .gchip:nth-of-type(4)", tag: "b", label: "전략 섹션 — 태그④", value: "Core Web Vitals" },
    { key: "strat_chip5", page: "index", sel: ".gcar__chips .gchip:nth-of-type(5)", tag: "b", label: "전략 섹션 — 태그⑤", value: "반응형 제작" },
    { key: "svc_lead", page: "index", sel: ".show__lead", tag: "b", label: "서비스 섹션 — 설명", value: "홈페이지·앱을 만들고, 사람의 검색과 AI의 답변 양쪽에서 발견되도록 설계합니다. 네 가지를 따로가 아니라 한 번에." },
    { key: "svc1_d", page: "index", sel: ".show .show__item:nth-of-type(2) .show__d", tag: "b", label: "서비스① SEO — 설명", value: "키워드·메타·속도·구조화 데이터까지 — 네이버·구글이 좋아하는 기술 구조를 만들 때부터 심습니다." },
    { key: "svc2_d", page: "index", sel: ".show .show__item:nth-of-type(3) .show__d", tag: "b", label: "서비스② AEO — 설명", value: "검색의 무게추가 'AI 답변'으로 옮겨갑니다. 생성형 AI가 답변에 우리 브랜드를 인용하도록 설계합니다." },
    { key: "svc3_d", page: "index", sel: ".show .show__item:nth-of-type(4) .show__d", tag: "b", label: "서비스③ WEBSITE — 설명", value: "기업·병원·브랜드 사이트부터 랜딩·쇼핑몰·CMS까지. 디자인·퍼블리싱·개발을 한 팀이 맡습니다." },
    { key: "svc4_d", page: "index", sel: ".show .show__item:nth-of-type(5) .show__d", tag: "b", label: "서비스④ APP — 설명", value: "iOS·Android 네이티브부터 웹앱·하이브리드까지. 결제·예약 연동과 백엔드·API, 보안까지 구축합니다." },
    { key: "work_lead", page: "index", sel: "#work .sec__lead", tag: "b", label: "포트폴리오 섹션 — 설명", value: "하오디자인이 직접 기획·제작한 홈페이지·앱·검색 최적화 프로젝트입니다." },
    { key: "cta_lead", page: "index", sel: ".cta-head__lead", tag: "b", label: "문의 — 설명", value: "간단한 내용만 남겨주세요. 담당자가 확인 후 빠르게 연락드립니다.\n현재 홈페이지의 검색 노출 진단도 무료로 도와드립니다." },
    { key: "partners_title", page: "index", sel: ".trust__title", tag: "b", label: "파트너 — 제목", value: "함께한 파트너사" },
    { key: "footer_tag_main", page: "index", sel: ".footer__brand p", tag: "b", label: "푸터 소개 문구(메인)", value: "SEO·AEO 홈페이지·앱 제작 — 만드는 데서 끝나지 않고, 발견되게 만듭니다." },

    /* ───── 포트폴리오 ───── */
    { key: "po_title", page: "portfolio", sel: ".subhero__title", tag: "b", label: "상단 제목", value: "포트폴리오" },
    { key: "po_desc", page: "portfolio", sel: ".subhero__desc", tag: "b", label: "상단 설명", value: "하오디자인 웹구축센터가 직접 기획·제작한 홈페이지·앱·검색 최적화 프로젝트입니다. 클릭하면 크게 볼 수 있어요." },

    /* ───── 칼럼 ───── */
    { key: "col_title", page: "column", sel: "#listView .subhero__title", tag: "b", label: "상단 제목", value: "Column" },
    { key: "col_desc", page: "column", sel: "#listView .subhero__desc", tag: "b", label: "상단 설명", value: "홈페이지·앱·검색 최적화, 알아두면 좋은 웹 이야기를 전합니다." },

    /* ───── Q&A ───── */
    { key: "qna_title", page: "qna", sel: ".subhero__title", tag: "b", label: "상단 제목", value: "자주 하는 질문" },
    { key: "qna_desc", page: "qna", sel: ".subhero__desc", tag: "b", label: "상단 설명", value: "홈페이지·앱 제작과 검색 최적화에 대한 질문을 모았습니다. 찾는 답이 없으면 [문의하기](index.html#contact)를 이용해 주세요." },
    { key: "qna_ptitle", page: "qna", sel: ".page__title", tag: "b", label: "섹션 제목", value: "무엇이 궁금하신가요" },

    /* ───── 무료 SEO 진단 ───── */
    { key: "sc_eg", page: "seo-check", sel: ".eyebrow", tag: "b", label: "상단 라벨", value: "FREE SEO CHECKER" },
    { key: "sc_title", page: "seo-check", sel: ".sct__head .sct__title", tag: "b", label: "상단 제목", value: "우리 홈페이지 SEO,\n~~지금 몇 점일까요?~~" },
    { key: "sc_lead", page: "seo-check", sel: ".sct__head .sct__lead", tag: "b", label: "상단 설명", value: "URL만 넣으면 SEO 상태를 **100점 만점**으로 진단해 드립니다.\n타이틀·메타·H1~H3·구조화 데이터·sitemap·Open Graph 등 22개 항목을 실제 코드로 분석합니다." },

    /* ───── 공통(푸터 소개 — 서브페이지) ───── */
    { key: "footer_tag_sub", page: "all", sel: ".footer__top p", tag: "b", label: "푸터 소개 문구(서브)", value: "홈페이지·앱 제작 / AEO·SEO·GEO\n찾게 만드는 홈페이지를 만듭니다" }
  ];

  /* ===== 저장 로드 헬퍼 ===== */
  function load(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      if (Array.isArray(v)) return v;
    } catch (e) {}
    return JSON.parse(JSON.stringify(fallback));
  }
  function loadObj(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      if (v && typeof v === "object" && !Array.isArray(v)) return v;
    } catch (e) {}
    return JSON.parse(JSON.stringify(fallback));
  }

  /* ===== 통합 관리자(허브) 계정 — 모든 센터 공통 로그인 ===== */
  var HUB_ACCOUNTS = [{ id: "admin", pw: "haohub1234" }];
  function loadHubAccounts() {
    return fetch(SB_URL + "/rest/v1/overrides?select=v&k=eq.hub_accounts", { headers: SB_H })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) { if (rows[0] && Array.isArray(rows[0].v) && rows[0].v.length) HUB_ACCOUNTS = rows[0].v; })
      .catch(function () {});
  }

  /* ===== 공개 API ===== */
  window.HAO = {
    imgSrc: imgSrc,
    ready: Promise.all([sbLoad(), loadHubAccounts()]),
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return sbSave(k, v); },
    remove: function (k) { localStorage.removeItem(k); return sbDelete(k); },
    uploadImage: sbUpload,

    /* 포트폴리오 */
    getWorks: function () { return load("hw_works", DEFAULT_WORKS).filter(function (w) { return w && w.f; }); },
    getWorksRaw: function () { return load("hw_works", DEFAULT_WORKS); },
    /* 메인 노출(main) 우선, 모자라면 나머지로 채움 */
    getMainWorks: function (n) {
      var works = this.getWorks();
      var picked = works.filter(function (w) { return w.main; });
      var rest = works.filter(function (w) { return !w.main; });
      var list = picked.concat(rest);
      return n ? list.slice(0, n) : list;
    },
    getHero: function () { return load("hw_hero", DEFAULT_HERO); },
    getPosts: function () {
      var arr = load("hw_posts", DEFAULT_POSTS);
      arr.sort(function (a, b) { return (b.date || "").localeCompare(a.date || "") || (b.id - a.id); });
      return arr;
    },
    getQna: function () { return load("hw_qna", DEFAULT_QNA); },
    getPartners: function () { return load("hw_partners", DEFAULT_PARTNERS); },
    getLogo: function () { var v = localStorage.getItem("hw_logo"); try { v = JSON.parse(v); } catch (e) {} return (typeof v === "string" && v) ? v : "assets/img/logo.png"; },
    getSettings: function () { return loadObj("hw_settings", DEFAULT_SETTINGS); },
    getSocial: function () { return loadObj("hw_social", DEFAULT_SOCIAL); },
    getCopy: function () {
      var ov = loadObj("hw_copy", {});
      return DEFAULT_COPY.map(function (c) {
        var out = JSON.parse(JSON.stringify(c));
        if (typeof ov[c.key] === "string") out.value = ov[c.key];
        return out;
      });
    },
    getSeo: function () {
      var ov = loadObj("hw_seo", {});
      var out = JSON.parse(JSON.stringify(DEFAULT_SEO));
      if (ov.siteUrl) out.siteUrl = ov.siteUrl;
      if (ov.ogImage) out.ogImage = ov.ogImage;
      if (ov.pages) Object.keys(ov.pages).forEach(function (p) {
        if (!out.pages[p]) out.pages[p] = {};
        Object.keys(ov.pages[p]).forEach(function (f) { out.pages[p][f] = ov.pages[p][f]; });
      });
      return out;
    },
    getHeadCode: function () { try { var v = JSON.parse(localStorage.getItem("hw_headcode")); return typeof v === "string" ? v : ""; } catch (e) { return ""; } },
    getAccounts: function () {
      try { var v = JSON.parse(localStorage.getItem("hw_accounts")); if (Array.isArray(v) && v.length) return v; } catch (e) {}
      var c = loadObj("hw_admin_cred", null);
      if (c && c.id) return [c];
      return [{ id: "admin", pw: "web1234" }];
    },
    saveAccounts: function (list) { return this.set("hw_accounts", list); },
    getCred: function () { return this.getAccounts()[0]; },
    verifyLogin: function (id, pw) {
      var hit = function (list) { return (list || []).some(function (a) { return a && a.id === id && a.pw === pw; }); };
      return hit(this.getAccounts()) || hit(HUB_ACCOUNTS);
    },
    getMail: function () { return loadObj("hw_mail", { on: false, url: "", to: "sales@haodesign.co.kr" }); },

    /* 견적 문의 — 공유 inquiries 테이블에 저장(type 앞에 [웹] 표시) */
    saveInquiry: function (q) {
      var m = this.getMail();
      var typed = INQ_TAG + " " + (q.type || "제작 문의");
      var msg = (q.company ? "[" + q.company + "] " : "") + (q.message || "");
      var payload = { name: q.name, phone: q.phone, type: typed, message: msg, to: m.to || "", date: new Date().toLocaleString("ko-KR") };
      if (m && m.on && m.url) {
        fetch(m.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(function () {});
      }
      return fetch(SB_URL + "/rest/v1/inquiries", {
        method: "POST", headers: SB_H,
        body: JSON.stringify([{ name: q.name, phone: q.phone, type: typed, message: msg }])
      });
    },
    fetchInquiries: function () {
      return fetch(SB_URL + "/rest/v1/inquiries?select=*&type=like." + encodeURIComponent(INQ_TAG + "*") + "&order=created_at.desc", { headers: SB_H })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (rows) {
          return rows.map(function (r) {
            return { id: r.id, name: r.name, phone: r.phone, type: (r.type || "").replace(INQ_TAG, "").trim(), message: r.message,
                     date: r.created_at ? new Date(r.created_at).toLocaleString("ko-KR") : "" };
          });
        }).catch(function () { return []; });
    },
    deleteInquiry: function (id) {
      return fetch(SB_URL + "/rest/v1/inquiries?id=eq." + id, { method: "DELETE", headers: SB_H });
    },

    /* 편집 문법: ~~오렌지~~  **굵게**  [링크문구](주소)  줄바꿈=엔터 (HTML escape 포함) */
    fmt: function (s, tag) {
      var esc = String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
      return esc
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:var(--accent);font-weight:700">$1</a>')
        .replace(/~~(.+?)~~/g, '<span class="g">$1</span>')
        .replace(/\*\*(.+?)\*\*/g, "<" + tag + ">$1</" + tag + ">")
        .replace(/\n/g, "<br />");
    }
  };
})();
