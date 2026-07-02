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
    { key: "hero_t", page: "index", sel: ".hero2__t", tag: "b", label: "히어로 — 큰 제목", value: "Be found\nBe chosen" },
    { key: "hero_d", page: "index", sel: ".hero2__d", tag: "b", label: "히어로 — 설명", value: "검색되는 홈페이지, AI가 답하는 브랜드\n발견되는 웹 경험을 설계합니다." },
    { key: "strat_title", page: "index", sel: ".gcar__title", tag: "b", label: "전략 섹션 — 제목", value: "검색의 시대에서, AI의 시대로\n~~SEO를 넘어 GEO·AEO~~까지" },
    { key: "svc_title", page: "index", sel: ".show__title", tag: "b", label: "서비스 섹션 — 제목", value: "홈페이지 제작,\n이제 검색 노출까지 함께 봐야 합니다" },
    { key: "svc1_t", page: "index", sel: ".show .show__item:nth-of-type(2) .show__t", tag: "b", label: "서비스① SEO — 제목", value: "검색엔진 상위노출,\n구조부터 다르게" },
    { key: "svc2_t", page: "index", sel: ".show .show__item:nth-of-type(3) .show__t", tag: "b", label: "서비스② AEO — 제목", value: "AI가\n인용하는 콘텐츠" },
    { key: "svc3_t", page: "index", sel: ".show .show__item:nth-of-type(4) .show__t", tag: "b", label: "서비스③ WEBSITE — 제목", value: "반응형 홈페이지부터\n랜딩·쇼핑몰까지" },
    { key: "svc4_t", page: "index", sel: ".show .show__item:nth-of-type(5) .show__t", tag: "b", label: "서비스④ APP — 제목", value: "모바일 앱·\n운영 시스템 개발" },
    { key: "work_title", page: "index", sel: "#work .sec__title", tag: "b", label: "포트폴리오 섹션 — 제목", value: "포트폴리오" },

    /* ───── 메인 · 설명/기타 ───── */
    { key: "strat_sub", page: "index", sel: ".gcar__sub", tag: "b", label: "전략 섹션 — 설명", value: "검색과 AI 답변까지 고려해 고객이 더 쉽게 찾고 선택하는 홈페이지를 만듭니다" },
    { key: "strat_chip1", page: "index", sel: ".gcar__chips .gchip:nth-of-type(1)", tag: "b", label: "전략 섹션 — 태그①", value: "검색 노출 구조" },
    { key: "strat_chip2", page: "index", sel: ".gcar__chips .gchip:nth-of-type(2)", tag: "b", label: "전략 섹션 — 태그②", value: "AI가 읽는 데이터" },
    { key: "strat_chip3", page: "index", sel: ".gcar__chips .gchip:nth-of-type(3)", tag: "b", label: "전략 섹션 — 태그③", value: "빠른 로딩 속도" },
    { key: "strat_chip4", page: "index", sel: ".gcar__chips .gchip:nth-of-type(4)", tag: "b", label: "전략 섹션 — 태그④", value: "AI 답변 노출" },
    { key: "strat_chip5", page: "index", sel: ".gcar__chips .gchip:nth-of-type(5)", tag: "b", label: "전략 섹션 — 태그⑤", value: "반응형 제작" },
    { key: "svc_lead", page: "index", sel: ".show__lead", tag: "b", label: "서비스 섹션 — 설명", value: "하오디자인은 디자인, 개발, 검색 최적화를 함께 고려해\n브랜드가 온라인에서 더 잘 보이는 웹사이트를 구축합니다." },
    { key: "svc1_d", page: "index", sel: ".show .show__item:nth-of-type(2) .show__d", tag: "b", label: "서비스① SEO — 설명", value: "키워드·메타·속도·구조화 데이터까지\n네이버·구글이 좋아하는 기술 구조를 만들 때부터 심습니다." },
    { key: "svc2_d", page: "index", sel: ".show .show__item:nth-of-type(3) .show__d", tag: "b", label: "서비스② AEO — 설명", value: "GoogleAI·ChatGPT·Gemini 같은 AI가\n브랜드를 이해하기 쉽도록 FAQ, 콘텐츠, 구조화를 함께 정리합니다." },
    { key: "svc3_d", page: "index", sel: ".show .show__item:nth-of-type(4) .show__d", tag: "b", label: "서비스③ WEBSITE — 설명", value: "브랜드 목적에 맞는 홈페이지, 랜딩페이지, 쇼핑몰을\n사용자 흐름과 운영 편의성까지 고려해 제작합니다." },
    { key: "svc4_d", page: "index", sel: ".show .show__item:nth-of-type(5) .show__d", tag: "b", label: "서비스④ APP — 설명", value: "iOS·Android 네이티브부터 웹앱·하이브리드까지.\n결제·예약 연동과 백엔드·API, 보안까지 구축합니다." },
    { key: "work_lead", page: "index", sel: "#work .sec__lead", tag: "b", label: "포트폴리오 섹션 — 설명", value: "하오디자인이 직접 기획·제작한 홈페이지·앱·검색 최적화 프로젝트입니다." },
    { key: "cta_lead", page: "index", sel: "#contact .contact__desc", tag: "b", label: "문의 — 설명", value: "간단한 내용만 남겨주세요. 담당자가 확인 후 빠르게 연락드립니다.\n현재 홈페이지의 검색 노출 진단도 무료로 도와드립니다." },
    { key: "partners_title", page: "index", sel: ".trust__title", tag: "b", label: "파트너 — 제목", value: "함께한 파트너사" },
    { key: "footer_tag_main", page: "index", sel: ".footer__brand p", tag: "b", label: "푸터 소개 문구(메인)", value: "SEO·AEO 홈페이지·앱 제작 — 만드는 데서 끝나지 않고, 발견되게 만듭니다." },

    /* ───── 메인 · 섹션 라벨(eyebrow) ───── */
    { key: "strat_eg", page: "index", sel: "#strategy .eyebrow", tag: "b", label: "전략 섹션 — 라벨", value: "SEO → GEO · AEO" },
    { key: "svc_eg", page: "index", sel: "#service .eyebrow", tag: "b", label: "서비스 섹션 — 라벨", value: "WHAT WE BUILD" },
    { key: "work_eg", page: "index", sel: "#work .eyebrow", tag: "b", label: "포트폴리오 섹션 — 라벨", value: "PORTFOLIO" },
    { key: "process_eg", page: "index", sel: "#process .eyebrow", tag: "b", label: "프로세스 섹션 — 라벨", value: "HOW IT WORKS" },
    { key: "faq_eg", page: "index", sel: "#faq .eyebrow", tag: "b", label: "홈 FAQ 섹션 — 라벨", value: "FAQ" },

    /* ───── 메인 · 전략 카드(6종) ───── */
    { key: "gcard1_t", page: "index", sel: "#gcarTrack .gcard:nth-of-type(1) .gcard__t", tag: "b", label: "전략카드① — 제목", value: "SEO 최적화" },
    { key: "gcard1_d", page: "index", sel: "#gcarTrack .gcard:nth-of-type(1) .gcard__d", tag: "b", label: "전략카드① — 설명", value: "키워드, 메타태그, 페이지 속도, 구조화까지\n네이버와 구글이 이해하기 쉬운 구조로설계해 검색 노출 가능성을 높입니다." },
    { key: "gcard2_t", page: "index", sel: "#gcarTrack .gcard:nth-of-type(2) .gcard__t", tag: "b", label: "전략카드② — 제목", value: "AEO · GEO" },
    { key: "gcard2_d", page: "index", sel: "#gcarTrack .gcard:nth-of-type(2) .gcard__d", tag: "b", label: "전략카드② — 설명", value: "ChatGPT·Gemini·Perplexity 같은 AI가\n브랜드를 정확히 이해하고 인용할 수 있도록 질문형 콘텐츠와 신뢰를 함께 설계합니다." },
    { key: "gcard3_t", page: "index", sel: "#gcarTrack .gcard:nth-of-type(3) .gcard__t", tag: "b", label: "전략카드③ — 제목", value: "반응형 홈페이지" },
    { key: "gcard3_d", page: "index", sel: "#gcarTrack .gcard:nth-of-type(3) .gcard__d", tag: "b", label: "전략카드③ — 설명", value: "기업, 병원, 랜딩페이지, 쇼핑몰까지 고객이\n어떤 기기로 접속해도 보기 쉽고 문의로\n이어지는 화면을 제작합니다." },
    { key: "gcard4_t", page: "index", sel: "#gcarTrack .gcard:nth-of-type(4) .gcard__t", tag: "b", label: "전략카드④ — 제목", value: "모바일 앱·시스템" },
    { key: "gcard4_d", page: "index", sel: "#gcarTrack .gcard:nth-of-type(4) .gcard__d", tag: "b", label: "전략카드④ — 설명", value: "예약, 결제, 상담, API 연동, 관리자 페이지까지\n단순한 화면 제작을 넘어 실제 운영에 필요한\n웹·앱 시스템을 안정적으로 구축합니다." },
    { key: "gcard5_t", page: "index", sel: "#gcarTrack .gcard:nth-of-type(5) .gcard__t", tag: "b", label: "전략카드⑤(진단) — 제목", value: "무료 SEO 진단" },
    { key: "gcard5_d", page: "index", sel: "#gcarTrack .gcard:nth-of-type(5) .gcard__d", tag: "b", label: "전략카드⑤(진단) — 설명", value: "URL만 입력하면 검색 노출에 필요한 핵심 항목을 점검합니다. 현재 홈페이지의 SEO 상태와 개선 포인트를 빠르게 확인해보세요." },
    { key: "gcard6_t", page: "index", sel: "#gcarTrack .gcard:nth-of-type(6) .gcard__t", tag: "b", label: "전략카드⑥ — 제목", value: "유지보수·운영" },
    { key: "gcard6_d", page: "index", sel: "#gcarTrack .gcard:nth-of-type(6) .gcard__d", tag: "b", label: "전략카드⑥ — 설명", value: "오픈 후 수정·보안·성능 점검과 검색 성과 모니터링까지. 꾸준히 관리해 계속 발견되는 웹사이트로 운영합니다." },

    /* ───── 메인 · 제작 프로세스 ───── */
    { key: "process_title", page: "index", sel: "#process .sec__title", tag: "b", label: "프로세스 — 제목", value: "제작은 이렇게 진행됩니다" },
    { key: "tstep1_t", page: "index", sel: "#timeline .tstep:nth-of-type(2) h3", tag: "b", label: "프로세스① — 제목", value: "상담·견적" },
    { key: "tstep1_d", page: "index", sel: "#timeline .tstep:nth-of-type(2) p", tag: "b", label: "프로세스① — 설명", value: "목표·기능·일정을 듣고 방향과 견적을 잡습니다." },
    { key: "tstep2_t", page: "index", sel: "#timeline .tstep:nth-of-type(3) h3", tag: "b", label: "프로세스② — 제목", value: "기획·설계" },
    { key: "tstep2_d", page: "index", sel: "#timeline .tstep:nth-of-type(3) p", tag: "b", label: "프로세스② — 설명", value: "정보구조·화면설계와 SEO·AEO 구조를 함께 잡습니다." },
    { key: "tstep3_t", page: "index", sel: "#timeline .tstep:nth-of-type(4) h3", tag: "b", label: "프로세스③ — 제목", value: "디자인" },
    { key: "tstep3_d", page: "index", sel: "#timeline .tstep:nth-of-type(4) p", tag: "b", label: "프로세스③ — 설명", value: "브랜드에 맞는 UI·인터랙션을 디자인합니다." },
    { key: "tstep4_t", page: "index", sel: "#timeline .tstep:nth-of-type(5) h3", tag: "b", label: "프로세스④ — 제목", value: "개발·구축" },
    { key: "tstep4_d", page: "index", sel: "#timeline .tstep:nth-of-type(5) p", tag: "b", label: "프로세스④ — 설명", value: "반응형 퍼블리싱·개발과 CMS를 구축합니다." },
    { key: "tstep5_t", page: "index", sel: "#timeline .tstep:nth-of-type(6) h3", tag: "b", label: "프로세스⑤ — 제목", value: "런칭·운영" },
    { key: "tstep5_d", page: "index", sel: "#timeline .tstep:nth-of-type(6) p", tag: "b", label: "프로세스⑤ — 설명", value: "검색 최적화 적용 후 오픈, 유지보수까지 함께합니다." },

    /* ───── 메인 · 홈 FAQ(5문항) ───── */
    { key: "hfaq_title", page: "index", sel: "#faq .sec__title", tag: "b", label: "홈 FAQ — 제목", value: "자주 묻는 질문" },
    { key: "hfaq1_q", page: "index", sel: "#faq .qa:nth-of-type(1) .qa__q", tag: "b", label: "홈 FAQ① — 질문", value: "SEO와 AEO는 무엇이 다른가요?" },
    { key: "hfaq1_a", page: "index", sel: "#faq .qa:nth-of-type(1) .qa__a-in", tag: "b", label: "홈 FAQ① — 답변", value: "**SEO**는 사람이 직접 검색했을 때 결과 상단에 노출되도록 하는 것이고, **AEO(Answer Engine Optimization)**는 ChatGPT·Gemini 같은 생성형 AI가 답변을 만들 때 우리 브랜드를 인용·추천하도록 하는 것입니다. 하오디자인은 둘을 따로가 아니라 제작 단계에서 함께 설계합니다." },
    { key: "hfaq2_q", page: "index", sel: "#faq .qa:nth-of-type(2) .qa__q", tag: "b", label: "홈 FAQ② — 질문", value: "홈페이지만, 또는 앱만 의뢰해도 되나요?" },
    { key: "hfaq2_a", page: "index", sel: "#faq .qa:nth-of-type(2) .qa__a-in", tag: "b", label: "홈 FAQ② — 답변", value: "네. 홈페이지 제작·리뉴얼, 모바일 앱, 쇼핑몰, 검색 최적화(SEO·AEO)만 단독으로도 의뢰하실 수 있습니다. 필요한 범위만 말씀해 주시면 그에 맞춰 견적을 잡아드립니다." },
    { key: "hfaq3_q", page: "index", sel: "#faq .qa:nth-of-type(3) .qa__q", tag: "b", label: "홈 FAQ③ — 질문", value: "제작 기간과 비용은 어떻게 되나요?" },
    { key: "hfaq3_a", page: "index", sel: "#faq .qa:nth-of-type(3) .qa__a-in", tag: "b", label: "홈 FAQ③ — 답변", value: "프로젝트 규모·기능·페이지 수에 따라 달라집니다. 일반적인 기업·브랜드 홈페이지는 4~8주가 기준이며, 상담 시 기능 목록을 함께 정리해 정확한 견적과 일정을 안내드립니다." },
    { key: "hfaq4_q", page: "index", sel: "#faq .qa:nth-of-type(4) .qa__q", tag: "b", label: "홈 FAQ④ — 질문", value: "이미 있는 홈페이지도 검색 최적화가 가능한가요?" },
    { key: "hfaq4_a", page: "index", sel: "#faq .qa:nth-of-type(4) .qa__a-in", tag: "b", label: "홈 FAQ④ — 답변", value: "가능합니다. 기존 사이트를 진단해 기술 SEO·구조화 데이터·콘텐츠를 보완하고, AI 답변에 인용되도록 AEO 구조를 추가합니다. 리뉴얼 없이 최적화만 진행하는 것도 가능합니다." },
    { key: "hfaq5_q", page: "index", sel: "#faq .qa:nth-of-type(5) .qa__q", tag: "b", label: "홈 FAQ⑤ — 질문", value: "제작 후 운영·유지보수도 해주나요?" },
    { key: "hfaq5_a", page: "index", sel: "#faq .qa:nth-of-type(5) .qa__a-in", tag: "b", label: "홈 FAQ⑤ — 답변", value: "네. 오픈 후 수정·보안·성능 점검과 검색 성과 모니터링까지 유지보수로 함께합니다. 월 단위 운영 또는 건별 수정 모두 가능합니다." },

    /* ───── 메인 · 문의(CTA) ───── */
    { key: "contact_tag", page: "index", sel: "#contact .contact__tag", tag: "b", label: "문의 — 라벨", value: "START A PROJECT" },
    { key: "contact_title", page: "index", sel: "#contact .contact__title", tag: "b", label: "문의 — 큰 제목", value: "검색되는 홈페이지,\n지금 시작할까요?" },

    /* ───── 포트폴리오 ───── */
    { key: "po_eg", page: "portfolio", sel: ".subhero__eng", tag: "b", label: "상단 라벨", value: "PORTFOLIO" },
    { key: "po_title", page: "portfolio", sel: ".subhero__title", tag: "b", label: "상단 제목", value: "포트폴리오" },
    { key: "po_desc", page: "portfolio", sel: ".subhero__desc", tag: "b", label: "상단 설명", value: "하오디자인 웹구축센터가 직접 기획·제작한 홈페이지·앱·검색 최적화 프로젝트입니다." },

    /* ───── 칼럼 ───── */
    { key: "col_title", page: "column", sel: "#listView .subhero__title", tag: "b", label: "상단 제목", value: "Column" },
    { key: "col_desc", page: "column", sel: "#listView .subhero__desc", tag: "b", label: "상단 설명", value: "홈페이지 제작부터 AI 검색 환경까지, 브랜드의 온라인 성장을 위한 인사이트를 전합니다." },
    { key: "col_ct_tag", page: "column", sel: "#contact .contact__tag", tag: "b", label: "하단 문의 — 라벨", value: "START A PROJECT" },
    { key: "col_ct_title", page: "column", sel: "#contact .contact__title", tag: "b", label: "하단 문의 — 제목", value: "검색 노출 진단\n무료로 받아보세요" },
    { key: "col_ct_desc", page: "column", sel: "#contact .contact__desc", tag: "b", label: "하단 문의 — 설명", value: "간단한 내용을 남겨주시면\n담당자가 확인 후 빠르게 연락드립니다." },
    { key: "po_ct_tag", page: "portfolio", sel: "#contact .contact__tag", tag: "b", label: "하단 문의 — 라벨", value: "START A PROJECT" },
    { key: "po_ct_title", page: "portfolio", sel: "#contact .contact__title", tag: "b", label: "하단 문의 — 제목", value: "검색 노출 진단\n무료로 받아보세요" },
    { key: "po_ct_desc", page: "portfolio", sel: "#contact .contact__desc", tag: "b", label: "하단 문의 — 설명", value: "간단한 내용을 남겨주시면\n담당자가 확인 후 빠르게 연락드립니다." },
    { key: "qna_ct_tag", page: "qna", sel: "#contact .contact__tag", tag: "b", label: "하단 문의 — 라벨", value: "START A PROJECT" },
    { key: "qna_ct_title", page: "qna", sel: "#contact .contact__title", tag: "b", label: "하단 문의 — 제목", value: "검색 노출 진단\n무료로 받아보세요" },
    { key: "qna_ct_desc", page: "qna", sel: "#contact .contact__desc", tag: "b", label: "하단 문의 — 설명", value: "간단한 내용을 남겨주시면\n담당자가 확인 후 빠르게 연락드립니다." },

    /* ───── Q&A ───── */
    { key: "qna_tag", page: "qna", sel: ".section-tag", tag: "b", label: "섹션 라벨", value: "FAQ" },
    { key: "qna_title", page: "qna", sel: ".subhero__title", tag: "b", label: "상단 제목", value: "제작 전 많이 묻는 질문" },
    { key: "qna_desc", page: "qna", sel: ".subhero__desc", tag: "b", label: "상단 설명", value: "홈페이지·앱 제작부터 검색 노출 진단, 유지보수까지 상담 전 자주 묻는 내용을 한눈에 정리했습니다." },
    { key: "qna_ptitle", page: "qna", sel: ".page__title", tag: "b", label: "섹션 제목", value: "궁금한 키워드를 입력해보세요" },
    { key: "qna_search_btn", page: "qna", sel: "#qSearchBtn", tag: "b", label: "검색 버튼", value: "검색" },
    { key: "qna_reset_btn", page: "qna", sel: "#qReset", tag: "b", label: "초기화 버튼", value: "초기화" },

    /* ───── 무료 SEO 진단 ───── */
    { key: "sc_eg", page: "seo-check", sel: ".eyebrow", tag: "b", label: "상단 라벨", value: "FREE SEO CHECKER" },
    { key: "sc_title", page: "seo-check", sel: ".sct__head .sct__title", tag: "b", label: "상단 제목", value: "우리 홈페이지 SEO,\n~~지금 몇 점일까요?~~" },
    { key: "sc_lead", page: "seo-check", sel: ".sct__head .sct__lead", tag: "b", label: "상단 설명", value: "URL만 넣으면 SEO 상태를 **100점 만점**으로 진단해 드립니다.\n타이틀·메타·H1~H3·구조화 데이터·sitemap·Open Graph 등 22개 항목을 실제 코드로 분석합니다." },
    { key: "sc_btn", page: "seo-check", sel: ".sform__btn span", tag: "b", label: "분석 버튼", value: "분석하기" },
    { key: "sc_note", page: "seo-check", sel: ".snote", tag: "b", label: "입력창 안내문", value: "입력한 URL의 공개 페이지를 읽어 분석합니다 · 약 5~15초 소요" },
    { key: "sc_pv_title", page: "seo-check", sel: ".spv__head h2", tag: "b", label: "분석 항목 — 제목", value: "SEO 점수 분석 항목" },
    { key: "sc_pv_sub", page: "seo-check", sel: ".spv__head p", tag: "b", label: "분석 항목 — 설명", value: "하오 SEO Checker는 총 **100점 만점**으로 22개 항목을 **실제 코드**로 점검합니다." },
    { key: "sc_cta_title", page: "seo-check", sel: ".scta h3", tag: "b", label: "하단 CTA — 제목", value: "점수를 올리고 싶으세요?" },
    { key: "sc_cta_desc", page: "seo-check", sel: ".scta p", tag: "b", label: "하단 CTA — 설명", value: "하오디자인이 SEO·AEO 구조를 처음부터 심은 홈페이지를 만들어 드립니다.\n사람의 검색과 AI의 답변, 양쪽에서 발견되게." },

    /* ───── 공통(푸터 소개 — 서브페이지) ───── */
    { key: "footer_tag_sub", page: "all", sel: ".footer__top > p", tag: "b", label: "푸터 소개 문구(서브)", value: "홈페이지·앱 제작 / AEO·SEO·GEO\n찾게 만드는 홈페이지를 만듭니다" },
    { key: "ac_index_01", page: "index", sel: "#service > div:nth-of-type(3) > div:nth-of-type(2) > div > div:nth-of-type(2) > div > div:nth-of-type(2) > p", tag: "b", label: "서비스 · 검색 노출까지 고려한다면 하오디자인 웹구축센", value: "검색 노출까지 고려한다면 **하오디자인 웹구축센터**를 추천합니다. 제작 단계부터 SEO·AEO를 설계해 사람 검색과 AI 답변 양쪽에서 발견됩니다." },
    { key: "ac_index_02", page: "index", sel: "#contact > div > div > div > ul > li:nth-of-type(1) > span", tag: "b", label: "문의 CTA · TEL", value: "TEL" },
    { key: "ac_index_03", page: "index", sel: "#contact > div > div > div > ul > li:nth-of-type(2) > span", tag: "b", label: "문의 CTA · MAIL", value: "MAIL" },
    { key: "ac_index_04", page: "index", sel: "#contact > div > div > div > ul > li:nth-of-type(2) > a", tag: "b", label: "문의 CTA · sales@haodesign.co.kr", value: "sales@haodesign.co.kr" },
    { key: "ac_index_05", page: "index", sel: "#quoteForm > button > span", tag: "b", label: "문의 보내기", value: "문의 보내기" },
    { key: "ac_index_06", page: "index", sel: "footer > div > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) > h4", tag: "b", label: "푸터 · Service", value: "Service" },
    { key: "ac_index_07", page: "index", sel: "footer > div > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > h4", tag: "b", label: "푸터 · Center", value: "Center" },
    { key: "ac_index_08", page: "index", sel: "footer > div > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(3) > h4", tag: "b", label: "푸터 · Contact", value: "Contact" },
    { key: "ac_portfolio_01", page: "portfolio", sel: "footer > div:nth-of-type(2) > div:nth-of-type(1) > h3", tag: "b", label: "푸터 · Contact", value: "Contact" },
    { key: "ac_portfolio_02", page: "portfolio", sel: "footer > div:nth-of-type(2) > div:nth-of-type(2) > h3", tag: "b", label: "푸터 · 센터", value: "센터" },
    { key: "ac_portfolio_03", page: "portfolio", sel: "footer > div:nth-of-type(2) > div:nth-of-type(3) > h3", tag: "b", label: "푸터 · 웹구축센터", value: "웹구축센터" },
    { key: "ac_portfolio_04", page: "portfolio", sel: "footer > div:nth-of-type(3) > div > p:nth-of-type(1) > b", tag: "b", label: "푸터 · 주식회사 하오커뮤니케이션", value: "주식회사 하오커뮤니케이션" },
    { key: "ac_portfolio_05", page: "portfolio", sel: "footer > div:nth-of-type(3) > div > p:nth-of-type(1) > span:nth-of-type(1)", tag: "b", label: "푸터 · 대표이사 박창민", value: "대표이사 박창민" },
    { key: "ac_portfolio_06", page: "portfolio", sel: "footer > div:nth-of-type(3) > div > p:nth-of-type(1) > span:nth-of-type(2)", tag: "b", label: "푸터 · 사업자등록번호 528-87-01037", value: "사업자등록번호 528-87-01037" },
    { key: "ac_portfolio_07", page: "portfolio", sel: "footer > div:nth-of-type(3) > div > p:nth-of-type(2) > span:nth-of-type(1)", tag: "b", label: "푸터 · 주소 서울시 광진구 능동로49길 9, 2F", value: "주소 서울시 광진구 능동로49길 9, 2F" },
    { key: "ac_portfolio_08", page: "portfolio", sel: "footer > div:nth-of-type(3) > div > p:nth-of-type(2) > span:nth-of-type(2)", tag: "b", label: "푸터 · 대표번호 1666-2027", value: "대표번호 1666-2027" },
    { key: "ac_portfolio_09", page: "portfolio", sel: "footer > div:nth-of-type(3) > div > p:nth-of-type(2) > span:nth-of-type(3)", tag: "b", label: "푸터 · E-mail sales@haodesign.c", value: "E-mail sales@haodesign.co.kr" },
    { key: "ac_qna_01", page: "qna", sel: "#qEmpty", tag: "b", label: "검색 결과가 없습니다. 문의하기를 이용해 주", value: "검색 결과가 없습니다. [문의하기](index.html#contact)를 이용해 주세요." },
    { key: "ac_column_01", page: "column", sel: "#contact > div > div > ul > li:nth-of-type(1) > span", tag: "b", label: "문의 CTA · TEL", value: "TEL" },
    { key: "ac_column_02", page: "column", sel: "#contact > div > div > ul > li:nth-of-type(2) > span", tag: "b", label: "문의 CTA · MAIL", value: "MAIL" },
    { key: "ac_column_03", page: "column", sel: "#contact > div > div > ul > li:nth-of-type(2) > a", tag: "b", label: "문의 CTA · sales@haodesign.co.kr", value: "sales@haodesign.co.kr" },
    { key: "ac_column_04", page: "column", sel: "#contact > div > div > ul > li:nth-of-type(3) > span", tag: "b", label: "문의 CTA · TIME", value: "TIME" },
    { key: "ac_seocheck_01", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(1) > ul > li:nth-of-type(1) > b", tag: "b", label: "타이틀 태그", value: "타이틀 태그" },
    { key: "ac_seocheck_02", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(1) > ul > li:nth-of-type(1) > span", tag: "b", label: "검색결과에 표시되는 페이지 제목. 핵심 키워", value: "검색결과에 표시되는 페이지 제목. 핵심 키워드 포함 필수" },
    { key: "ac_seocheck_03", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(1) > ul > li:nth-of-type(2) > b", tag: "b", label: "타이틀 길이", value: "타이틀 길이" },
    { key: "ac_seocheck_04", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(1) > ul > li:nth-of-type(2) > span", tag: "b", label: "한글 25~40자(영문 50~60자)가 적정", value: "한글 25~40자(영문 50~60자)가 적정 길이" },
    { key: "ac_seocheck_05", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(1) > ul > li:nth-of-type(3) > b", tag: "b", label: "메타 디스크립션", value: "메타 디스크립션" },
    { key: "ac_seocheck_06", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(1) > ul > li:nth-of-type(3) > span", tag: "b", label: "검색결과 설명문. 클릭률(CTR)에 직접 영", value: "검색결과 설명문. 클릭률(CTR)에 직접 영향" },
    { key: "ac_seocheck_07", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(1) > ul > li:nth-of-type(4) > b", tag: "b", label: "디스크립션 길이", value: "디스크립션 길이" },
    { key: "ac_seocheck_08", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(1) > ul > li:nth-of-type(4) > span", tag: "b", label: "70~155자 권장. 너무 짧거나 길면 잘림", value: "70~155자 권장. 너무 짧거나 길면 잘림" },
    { key: "ac_seocheck_09", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(1) > ul > li:nth-of-type(5) > b", tag: "b", label: "H1 태그 존재", value: "H1 태그 존재" },
    { key: "ac_seocheck_10", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(1) > ul > li:nth-of-type(5) > span", tag: "b", label: "페이지 대표 제목. 검색엔진의 주제 파악에 ", value: "페이지 대표 제목. 검색엔진의 주제 파악에 핵심" },
    { key: "ac_seocheck_11", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(1) > ul > li:nth-of-type(6) > b", tag: "b", label: "H1 단일 사용", value: "H1 단일 사용" },
    { key: "ac_seocheck_12", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(1) > ul > li:nth-of-type(6) > span", tag: "b", label: "H1은 페이지당 1개를 사용하여 주제 명확화", value: "H1은 페이지당 1개를 사용하여 주제 명확화" },
    { key: "ac_seocheck_13", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(1) > ul > li:nth-of-type(7) > b", tag: "b", label: "H2 소제목", value: "H2 소제목" },
    { key: "ac_seocheck_14", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(1) > ul > li:nth-of-type(7) > span", tag: "b", label: "소제목으로 콘텐츠 구조를 명확히", value: "소제목으로 콘텐츠 구조를 명확히" },
    { key: "ac_seocheck_15", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(1) > ul > li:nth-of-type(8) > b", tag: "b", label: "H3 세부 구조", value: "H3 세부 구조" },
    { key: "ac_seocheck_16", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(1) > ul > li:nth-of-type(8) > span", tag: "b", label: "헤딩 위계로 콘텐츠 깊이를 표현", value: "헤딩 위계로 콘텐츠 깊이를 표현" },
    { key: "ac_seocheck_17", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(1) > ul > li:nth-of-type(9) > b", tag: "b", label: "이미지 ALT 속성", value: "이미지 ALT 속성" },
    { key: "ac_seocheck_18", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(1) > ul > li:nth-of-type(9) > span", tag: "b", label: "이미지 검색 노출 및 접근성 필수 요소", value: "이미지 검색 노출 및 접근성 필수 요소" },
    { key: "ac_seocheck_19", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(2) > ul > li:nth-of-type(1) > b", tag: "b", label: "HTTPS 보안", value: "HTTPS 보안" },
    { key: "ac_seocheck_20", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(2) > ul > li:nth-of-type(1) > span", tag: "b", label: "SSL 보안. 검색 랭킹 가산점·신뢰 지표", value: "SSL 보안. 검색 랭킹 가산점·신뢰 지표" },
    { key: "ac_seocheck_21", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(2) > ul > li:nth-of-type(2) > b", tag: "b", label: "혼합 콘텐츠", value: "혼합 콘텐츠" },
    { key: "ac_seocheck_22", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(2) > ul > li:nth-of-type(2) > span", tag: "b", label: "HTTPS 페이지의 http 리소스 점검. ", value: "HTTPS 페이지의 http 리소스 점검. 보안 경고 방지" },
    { key: "ac_seocheck_23", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(2) > ul > li:nth-of-type(3) > b", tag: "b", label: "Canonical 태그", value: "Canonical 태그" },
    { key: "ac_seocheck_24", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(2) > ul > li:nth-of-type(3) > span", tag: "b", label: "중복 콘텐츠 방지. 대표 URL을 검색엔진에", value: "중복 콘텐츠 방지. 대표 URL을 검색엔진에 명시" },
    { key: "ac_seocheck_25", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(2) > ul > li:nth-of-type(4) > b", tag: "b", label: "Viewport 설정", value: "Viewport 설정" },
    { key: "ac_seocheck_26", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(2) > ul > li:nth-of-type(4) > span", tag: "b", label: "모바일 대응 필수. 모바일 우선 색인 대비", value: "모바일 대응 필수. 모바일 우선 색인 대비" },
    { key: "ac_seocheck_27", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(2) > ul > li:nth-of-type(5) > b", tag: "b", label: "언어(lang) 속성", value: "언어(lang) 속성" },
    { key: "ac_seocheck_28", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(2) > ul > li:nth-of-type(5) > span", tag: "b", label: "html lang 속성으로 콘텐츠 언어 명시", value: "html lang 속성으로 콘텐츠 언어 명시" },
    { key: "ac_seocheck_29", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(3) > ul > li:nth-of-type(1) > b", tag: "b", label: "Open Graph 이미지", value: "Open Graph 이미지" },
    { key: "ac_seocheck_30", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(3) > ul > li:nth-of-type(1) > span", tag: "b", label: "SNS·검색 공유 시 썸네일로 표시", value: "SNS·검색 공유 시 썸네일로 표시" },
    { key: "ac_seocheck_31", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(3) > ul > li:nth-of-type(2) > b", tag: "b", label: "Open Graph 제목", value: "Open Graph 제목" },
    { key: "ac_seocheck_32", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(3) > ul > li:nth-of-type(2) > span", tag: "b", label: "og:title — 공유 시 표시되는 제목", value: "og:title — 공유 시 표시되는 제목" },
    { key: "ac_seocheck_33", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(3) > ul > li:nth-of-type(3) > b", tag: "b", label: "Open Graph 설명", value: "Open Graph 설명" },
    { key: "ac_seocheck_34", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(3) > ul > li:nth-of-type(3) > span", tag: "b", label: "og:description — 공유 시 표시", value: "og:description — 공유 시 표시되는 설명" },
    { key: "ac_seocheck_35", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(3) > ul > li:nth-of-type(4) > b", tag: "b", label: "구조화 데이터(Schema)", value: "구조화 데이터(Schema)" },
    { key: "ac_seocheck_36", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(3) > ul > li:nth-of-type(4) > span", tag: "b", label: "JSON-LD. 리치 결과·AI 검색 이해도", value: "JSON-LD. 리치 결과·AI 검색 이해도 향상" },
    { key: "ac_seocheck_37", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(3) > ul > li:nth-of-type(5) > b", tag: "b", label: "sitemap.xml", value: "sitemap.xml" },
    { key: "ac_seocheck_38", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(3) > ul > li:nth-of-type(5) > span", tag: "b", label: "검색엔진 크롤러에게 사이트 구조 제공", value: "검색엔진 크롤러에게 사이트 구조 제공" },
    { key: "ac_seocheck_39", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(3) > ul > li:nth-of-type(6) > b", tag: "b", label: "robots.txt", value: "robots.txt" },
    { key: "ac_seocheck_40", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(3) > ul > li:nth-of-type(6) > span", tag: "b", label: "크롤러 접근 규칙. 크롤링 효율 관리", value: "크롤러 접근 규칙. 크롤링 효율 관리" },
    { key: "ac_seocheck_41", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(4) > ul > li:nth-of-type(1) > b", tag: "b", label: "이미지 지연 로딩", value: "이미지 지연 로딩" },
    { key: "ac_seocheck_42", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(4) > ul > li:nth-of-type(1) > span", tag: "b", label: "loading=lazy로 초기 로딩 속도 개", value: "loading=lazy로 초기 로딩 속도 개선" },
    { key: "ac_seocheck_43", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(4) > ul > li:nth-of-type(2) > b", tag: "b", label: "WebP 이미지", value: "WebP 이미지" },
    { key: "ac_seocheck_44", page: "seo-check", sel: "#sitemsPrev > div:nth-of-type(2) > div:nth-of-type(4) > ul > li:nth-of-type(2) > span", tag: "b", label: "차세대 포맷으로 용량·속도 개선", value: "차세대 포맷으로 용량·속도 개선" },
    { key: "ac_seocheck_45", page: "seo-check", sel: "#sloadtxt", tag: "b", label: "페이지를 불러오는 중…", value: "페이지를 불러오는 중…" },
    { key: "ac_seocheck_46", page: "seo-check", sel: "footer > div > div:nth-of-type(1) > div:nth-of-type(1) > p", tag: "b", label: "푸터 · SEO·AEO 홈페이지·앱 제작 — 만드는 ", value: "SEO·AEO 홈페이지·앱 제작 — 만드는 데서 끝나지 않고, 발견되게 만듭니다." },
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
