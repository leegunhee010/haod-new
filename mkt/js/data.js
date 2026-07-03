/* ===================================================
   HAO MKT (마케팅센터) — shared data layer
   기본 데이터 + 관리자 오버라이드(Supabase 서버 + localStorage 캐시).
   · 다른 센터와 같은 Supabase 프로젝트를 공유하되, 키는 모두 "hm_" 접두사로 분리.
   · 견적문의는 공유 inquiries 테이블에 저장하되 type 앞에 "[마케팅]" 표시로 구분.
=================================================== */
(function () {
  "use strict";

  var SB_URL = "https://oaqrjrrgntlqmyxxovfn.supabase.co";
  var SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcXJqcnJnbnRscW15eHhvdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NjQzMTUsImV4cCI6MjA5NzE0MDMxNX0.3bOfZOXVKSoI9ELfE7ZjWETuxvjpNYHdCBSIMrbAGtU";
  var SB_H = { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": "application/json" };

  var INQ_TAG = "[마케팅]";

  function sbLoad() {
    var hasCache = false;
    try {
      for (var ci = 0; ci < localStorage.length; ci++) {
        var ck = localStorage.key(ci);
        if (ck && ck.indexOf("hm_") === 0 && ck !== "hm_admin_cred" && ck !== "hm_edit") { hasCache = true; break; }
      }
    } catch (e) {}
    var timed = new Promise(function (resolve) { setTimeout(resolve, hasCache ? 3000 : 12000); });
    var fetched = fetch(SB_URL + "/rest/v1/overrides?select=k,v&k=like.hm_*", { headers: SB_H })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        var seen = {};
        rows.forEach(function (row) {
          seen[row.k] = 1;
          try { localStorage.setItem(row.k, JSON.stringify(row.v)); } catch (e) {}
        });
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var lk = localStorage.key(i);
          if (lk && lk.indexOf("hm_") === 0 && lk !== "hm_admin_cred" && lk !== "hm_edit" && !seen[lk]) {
            localStorage.removeItem(lk);
          }
        }
      })
      .catch(function () {});
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
  function sbUpload(blob, ext) {
    var name = "hm_" + Date.now() + "_" + Math.floor(Math.random() * 1e9).toString(36) + "." + (ext || "jpg");
    return fetch(SB_URL + "/storage/v1/object/images/" + name, {
      method: "POST",
      headers: { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": blob.type || "image/jpeg", "x-upsert": "true" },
      body: blob
    }).then(function (r) {
      return r.ok ? (SB_URL + "/storage/v1/object/public/images/" + name) : null;
    }).catch(function () { return null; });
  }

  /* 이미지 키 → 실제 경로. 슬래시/http/data 포함 시 그대로, bare 파일명은 assets/img/ */
  function imgSrc(f) {
    if (!f) return "";
    if (/^(https?:|data:)/.test(f)) return f;
    if (f.indexOf("/") >= 0) return f;
    return "assets/img/" + f;
  }

  /* ===== 기본 작업 사례 (works.html 전체) — {img, t, c} ===== */
  var DEFAULT_WORKS = [
    { img: '../design/assets/work/work01.jpeg', t: '브랜드 카탈로그', c: '비주얼 리뉴얼' },
    { img: '../voucher/assets/work/w379.jpg', t: '뷰티 디바이스 상세페이지', c: '이커머스 디자인' },
    { img: '../design/assets/work/work03.jpeg', t: '제품 키비주얼', c: '브랜드 콘텐츠' },
    { img: '../voucher/assets/work/w378.jpg', t: '건강식품 패키지', c: '패키지 디자인' },
    { img: '../design/assets/work/work07.jpeg', t: '기업 회사소개서', c: '편집 디자인' },
    { img: '../voucher/assets/work/w402.jpg', t: '수출 영문 카탈로그', c: '비주얼 리뉴얼' },
    { img: '../design/assets/work/work12.jpeg', t: '브랜드 홍보 포스터', c: '브랜드 콘텐츠' },
    { img: '../design/assets/work/work05.jpeg', t: '전시·박람회 홍보물', c: '전시·부스' },
    { img: '../voucher/assets/work/w377.jpg', t: '생활용품 카탈로그', c: '편집 디자인' },
    { img: '../design/assets/work/work09.jpeg', t: '브랜드 리플릿', c: '브랜드 콘텐츠' },
    { img: '../voucher/assets/work/w380.jpg', t: '식품 다국어 브로슈어', c: '비주얼 리뉴얼' },
    { img: '../design/assets/work/work16.jpeg', t: '제품 패키지·라벨', c: '패키지 디자인' },
    { img: '../design/assets/work/work14.jpeg', t: '온라인 상세페이지', c: '이커머스 디자인' },
    { img: '../design/assets/work/work18.jpeg', t: '전시 부스 그래픽', c: '전시·부스' },
    { img: '../voucher/assets/work/w362.jpg', t: '산업기자재 회사소개서', c: '편집 디자인' }
  ];

  /* ===== 메인 히어로 (단일) — lead1/lead2 = 영문 2줄, sub = 한글 슬로건 ===== */
  var DEFAULT_HERO = [
    { lead1: "Your Outside", lead2: "Marketing Team", sub: "마케팅팀이 없는 중소기업도,\n선택받는 브랜드 전략은 필요하니까" }
  ];

  /* ===== 칼럼 글 — {id, cat, date, t, d, img, body[]} ===== */
  var DEFAULT_POSTS = [
    { id: 1, cat: '브랜딩', date: '2026.06.20', t: '작은 브랜드일수록 ‘첫인상’이 전부입니다', d: '로고·색·톤. 고객이 3초 안에 받는 인상이 브랜드의 신뢰를 결정합니다.', img: '../design/assets/work/work01.jpeg',
      body: ['큰 기업은 광고로 인지도를 삽니다. 하지만 작은 브랜드에게 주어지는 시간은 단 몇 초입니다. 그 사이 고객은 로고, 색, 글씨체만 보고 ‘믿을 만한 곳인지’를 판단합니다.', '그래서 작은 브랜드일수록 첫인상이 곧 전부입니다. 잘 정돈된 로고와 일관된 색, 톤이 ‘이 브랜드는 제대로 한다’는 신뢰를 만듭니다.', '하오디자인은 브랜드의 결을 먼저 읽습니다. 무엇을 파는지가 아니라 어떤 인상을 남기고 싶은지부터 정리해 로고·컬러·톤앤매너를 설계합니다.', '첫인상은 한 번뿐입니다. 그 한 번을, 디자인으로 제대로 잡아 드립니다.'] },
    { id: 2, cat: '이커머스', date: '2026.06.14', t: '상세페이지 하나로 전환율이 달라진다', d: '같은 제품도 ‘어떻게 보여주느냐’에 따라 매출이 갈립니다.', img: '../voucher/assets/work/w379.jpg',
      body: ['온라인에서 고객은 제품을 만질 수 없습니다. 오직 상세페이지 하나로 ‘살지 말지’를 결정합니다.', '같은 제품도 어떻게 보여주느냐에 따라 전환율이 크게 갈립니다. 사진의 톤, 정보의 순서, 신뢰를 주는 디테일까지 — 사는 순간까지의 흐름을 설계해야 합니다.', '하오디자인은 스마트스토어·자사몰 상세페이지를 ‘읽히는 한 편의 이야기’로 만듭니다. 스크롤을 따라 자연스럽게 구매로 이어지도록.', '좋은 제품이 안 팔린다면, 문제는 제품이 아니라 ‘보여주는 방식’일 수 있습니다.'] },
    { id: 3, cat: '패키지', date: '2026.06.07', t: '패키지는 말없는 영업사원입니다', d: '진열대에서 손이 가게 만드는 패키지 디자인의 감성 포인트.', img: '../voucher/assets/work/w378.jpg',
      body: ['진열대 위, 수십 개의 제품 사이에서 고객의 손이 가는 건 결국 ‘눈에 들어온’ 패키지입니다.', '패키지는 말없이 브랜드를 설명하는 영업사원입니다. 색과 형태, 한 줄의 카피가 제품의 가치를 대신 말해 줍니다.', '하오디자인은 진열 환경과 타깃을 고려해, 집어 들고 싶은 패키지를 디자인합니다. 보호 기능을 넘어 ‘사고 싶은 이유’를 담습니다.'] },
    { id: 4, cat: '콘텐츠', date: '2026.05.30', t: 'SNS 콘텐츠, 브랜드 톤부터 잡으세요', d: '게시물 하나하나가 아니라 ‘결’을 맞추면 작은 계정도 브랜드가 됩니다.', img: '../design/assets/work/work03.jpeg',
      body: ['매일 게시물을 올려도 브랜드가 쌓이지 않는 이유는, 게시물 하나하나가 따로 놀기 때문입니다.', '중요한 건 개별 콘텐츠가 아니라 ‘결’입니다. 색, 폰트, 말투, 사진 톤을 맞추면 작은 계정도 하나의 브랜드처럼 보입니다.', '하오디자인은 브랜드의 톤앤매너를 먼저 정의하고, 그 안에서 일관된 콘텐츠를 설계합니다. 흩어진 게시물이 아니라 ‘브랜드 경험’이 되도록.'] },
    { id: 5, cat: '전시', date: '2026.05.22', t: '전시회, 부스 하나로 기억되게 하는 법', d: '수많은 부스 속에서 발길을 멈추게 하는 공간·그래픽 연출.', img: '../design/assets/work/work05.jpeg',
      body: ['전시장에는 수백 개의 부스가 있습니다. 대부분은 지나치고, 몇 곳만 기억에 남습니다.', '차이는 ‘발길을 멈추게 하는’ 공간 연출에 있습니다. 멀리서도 읽히는 키 메시지, 머무르고 싶은 동선, 사진 찍고 싶은 포인트.', '하오디자인은 부스 그래픽부터 배너·카탈로그까지, 현장에서 브랜드가 기억되도록 오프라인 경험을 디자인합니다.'] },
    { id: 6, cat: '편집', date: '2026.05.15', t: '회사소개서가 거래의 첫 단추를 만든다', d: '잘 정리된 한 권의 소개서가 만드는 신뢰. 편집 디자인의 힘.', img: '../voucher/assets/work/w362.jpg',
      body: ['B2B 거래는 한 권의 회사소개서에서 시작되는 경우가 많습니다. 잘 정리된 소개서는 ‘이 회사, 일을 제대로 하겠다’는 신뢰를 줍니다.', '정보의 위계, 인포그래픽, 읽기 좋은 레이아웃 — 편집 디자인의 완성도가 곧 회사의 인상이 됩니다.', '하오디자인은 복잡한 내용을 명확한 구조로 정리해, 받는 사람이 끝까지 읽고 싶은 소개서를 만듭니다.'] }
  ];

  /* ===== Q&A — {c, q, a} ===== */
  var DEFAULT_QNA = [
    { c: '퍼포먼스 마케팅', q: '광고비는 어느 정도부터 시작하나요?', a: '브랜드 목표와 매체에 따라 다르지만, 보통 월 단위 예산을 함께 설계합니다. 적정 예산과 기대 성과를 상담 시 시뮬레이션해 드립니다.' },
    { c: '퍼포먼스 마케팅', q: '어떤 매체를 운영하나요?', a: '메타(인스타·페이스북), 구글·유튜브, 네이버 GFA·검색광고, 카카오, 틱톡 등 브랜드 목적에 맞는 다매체·다채널을 통합 운영합니다.' },
    { c: '퍼포먼스 마케팅', q: '성과(ROAS)는 어떻게 관리하나요?', a: '퍼널별 KPI를 설정하고 데이터 기반으로 소재·타겟·예산을 지속 최적화합니다. 전환 추적 세팅부터 함께 잡습니다.' },
    { c: 'IMC·브랜딩', q: 'IMC 통합마케팅이 무엇인가요?', a: '온·오프라인 채널을 하나의 메시지로 묶어 일관된 브랜드 경험을 만드는 통합 마케팅입니다. 캠페인 기획부터 매체 집행까지 한 팀에서 진행합니다.' },
    { c: 'IMC·브랜딩', q: '캠페인 기획만 의뢰할 수 있나요?', a: '네. 전략·기획만 의뢰하거나, 기획·제작·집행까지 풀퍼널로 진행하는 방식 모두 가능합니다.' },
    { c: '콘텐츠 제작', q: '콘텐츠(영상·이미지)도 직접 제작하나요?', a: '브랜드 톤에 맞는 광고 소재, 숏폼·릴스, 상세 콘텐츠를 기획·제작합니다. 촬영이 필요하면 하오 스튜디오센터와 연계합니다.' },
    { c: '콘텐츠 제작', q: '소재 제작 기간은 얼마나 걸리나요?', a: '소재 유형과 분량에 따라 다르지만 일반 광고 소재는 보통 1~2주 내에 1차안을 전달합니다.' },
    { c: '운영·기타', q: '리포트는 어떻게 제공되나요?', a: '주·월 단위로 핵심 지표와 인사이트를 담은 리포트를 제공하며, 대시보드로 실시간 성과도 공유합니다.' },
    { c: '운영·기타', q: '계약 기간이 정해져 있나요?', a: '캠페인 단발성부터 월 단위 운영 대행까지 가능합니다. 목적에 맞는 형태를 함께 정합니다.' },
    { c: '운영·기타', q: '다른 센터 서비스와 연계되나요?', a: '네. 홈페이지(웹구축센터)·촬영(스튜디오센터)·카탈로그(디자인센터)가 필요하면 하오디자인 패밀리 센터와 원스톱으로 진행합니다.' }
  ];

  /* ===== 파트너(텍스트 카드) — {b: 브랜드, s: 설명} ===== */
  var DEFAULT_PARTNERS = [
    { b: 'Google', s: '공식 파트너' }, { b: 'NAVER', s: 'GFA 공식 대행사' }, { b: 'Meta', s: '비즈니스 파트너' },
    { b: 'Kakao', s: '프리미어 파트너' }, { b: 'TikTok', s: '공식 파트너' }, { b: 'YouTube', s: '인증 대행사' }
  ];

  /* ===== 사이트 설정 ===== */
  var DEFAULT_SETTINGS = {
    tel: "1666-2027",
    email: "sales@haodesign.co.kr",
    time: "09:30 ~ 18:30 (점심 13:00~14:00)",
    addr: "서울특별시 광진구",
    bizName: "주식회사 하오커뮤니케이션",
    ceo: "박창민",
    bizNo: "528-87-01037"
  };
  var DEFAULT_SOCIAL = { kakao: "", instagram: "", blog: "", phone: "1666-2027" };

  /* ===== SEO ===== */
  var DEFAULT_SEO = {
    siteUrl: "https://haodesign.co.kr",
    ogImage: "../design/assets/work/work01.jpeg",
    pages: {
      index: {
        title: "마케팅센터 | 하오디자인 — 중소기업의 마케팅, 디자인으로 풀다",
        desc: "하오디자인 마케팅센터. 중소기업의 이야기를 디자인으로 풀어내는 브랜드 마케팅 — 브랜드 콘텐츠, 이커머스 상세페이지·스마트스토어, 전시·박람회 부스까지.",
        keywords: "중소기업 마케팅, 브랜드 디자인 마케팅, 이커머스 디자인, 상세페이지 제작, 전시 부스 디자인, 콘텐츠 마케팅, 하오디자인 마케팅센터" },
      works: {
        title: "Works | 마케팅센터 — 하오디자인",
        desc: "하오디자인 마케팅센터 작업 사례 — 브랜드 콘텐츠, 이커머스 상세페이지, 패키지, 전시·부스, 비주얼 리뉴얼.",
        keywords: "마케팅 포트폴리오, 브랜드 콘텐츠 사례, 이커머스 디자인, 패키지 디자인, 전시 부스" },
      services: {
        title: "Services | 마케팅센터 — 하오디자인",
        desc: "하오디자인 마케팅센터 서비스 — 브랜드 채널 운영, 콘텐츠 제작, 이커머스·패키지 디자인, 전시·부스, 인플루언서, 편집·인쇄, 글로벌 진출.",
        keywords: "브랜드 마케팅, 콘텐츠 제작, 이커머스 디자인, 패키지 디자인, 전시 부스, 인플루언서 마케팅" },
      column: {
        title: "칼럼 | 마케팅센터 — 하오디자인",
        desc: "퍼포먼스 마케팅·콘텐츠·브랜딩 인사이트. 하오디자인 마케팅센터 칼럼.",
        keywords: "마케팅 칼럼, 브랜딩, 이커머스, 패키지, 콘텐츠 마케팅" },
      qna: {
        title: "Q&A | 마케팅센터 — 하오디자인",
        desc: "퍼포먼스 마케팅·IMC·콘텐츠·광고 운영 자주 하는 질문. 하오디자인 마케팅센터 Q&A.",
        keywords: "마케팅 문의, 광고비, 대행, 리포트, 퍼포먼스 마케팅" },
      detail: {
        title: "칼럼 | 마케팅센터 — 하오디자인",
        desc: "하오디자인 마케팅센터 칼럼 — 중소기업을 위한 브랜드·이커머스·패키지·전시 디자인 마케팅 인사이트.",
        keywords: "마케팅 칼럼, 브랜드 디자인, 이커머스, 패키지, 전시" }
    }
  };

  /* ===== 사이트 카피 (관리자 '카피 수정' 탭) ===== */
  var DEFAULT_COPY = [
    /* ── 메인 ── */
    { key: "pin_big", page: "index", sel: ".pin__big", tag: "em", label: "핀 스크롤 — 큰 문장", value: "선택받는 브랜드는\n보여주는 방식부터 다릅니다" },
    { key: "mk_sv_c1_t", page: "index", sel: "#services .svq:nth-of-type(1) .svq__tt", tag: "b", label: "서비스 STEP1 — 제목", value: "브랜드 마케팅\n현황 분석" },
    { key: "mk_sv_c2_t", page: "index", sel: "#services .svq:nth-of-type(2) .svq__tt", tag: "b", label: "서비스 STEP2 — 제목", value: "핵심 메시지 발굴 및\n마케팅 전략 수립" },
    { key: "mk_sv_c3_t", page: "index", sel: "#services .svq:nth-of-type(3) .svq__tt", tag: "b", label: "서비스 STEP3 — 제목", value: "마케팅 실행 (콘텐츠 제작\n+ 채널 운영 + 오프라인)" },
    { key: "mk_df_a_t", page: "index", sel: "#difference .dif-card--a .dif-head__t", tag: "b", label: "비교 — 왼쪽 카드 제목", value: "일반 외주 대행" },
    { key: "mk_df_b_t", page: "index", sel: "#difference .dif-card--b .dif-head__t", tag: "b", label: "비교 — 하오 카드 제목", value: "하오디자인 마케팅센터" },
    { key: "mk_wk_more", page: "index", sel: "#works .pillbtn", tag: "b", label: "포트폴리오 — 더보기 버튼", value: "사례 더보기" },
    { key: "mk_sv_more", page: "index", sel: "#services .pillbtn", tag: "b", label: "서비스 — 자세히 버튼", value: "서비스 자세히 보기 →" },
    { key: "mk_ct_tel", page: "index", sel: ".mc-contact a[href^='tel']", tag: "b", label: "문의 — 전화번호", value: "1666-2027" },
    { key: "mk_ct_mail", page: "index", sel: ".mc-contact a[href^='mailto']", tag: "b", label: "문의 — 이메일", value: "sales@haodesign.co.kr" },
    { key: "mk_ct_time", page: "index", sel: ".mc-contact .v", tag: "b", label: "문의 — 영업시간", value: "평일 09:30 – 18:30" },
    { key: "mk_wo_01", page: "works", sel: "#top > section:nth-of-type(2) > p", tag: "b", label: "Portfolio", value: "Portfolio" },
    { key: "mk_wo_02", page: "works", sel: "#top > section:nth-of-type(2) > h2", tag: "b", label: "작업 사례", value: "작업 사례" },
    { key: "mk_wo_03", page: "works", sel: "#workGrid > a:nth-of-type(1) > div:nth-of-type(2) > h3", tag: "b", label: "브랜드 카탈로그", value: "브랜드 카탈로그" },
    { key: "mk_wo_04", page: "works", sel: "#workGrid > a:nth-of-type(2) > div:nth-of-type(2) > h3", tag: "b", label: "뷰티 디바이스 상세페이지", value: "뷰티 디바이스 상세페이지" },
    { key: "mk_wo_05", page: "works", sel: "#workGrid > a:nth-of-type(3) > div:nth-of-type(2) > h3", tag: "b", label: "제품 키비주얼", value: "제품 키비주얼" },
    { key: "mk_wo_06", page: "works", sel: "#workGrid > a:nth-of-type(4) > div:nth-of-type(2) > h3", tag: "b", label: "건강식품 패키지", value: "건강식품 패키지" },
    { key: "mk_wo_07", page: "works", sel: "#workGrid > a:nth-of-type(5) > div:nth-of-type(2) > h3", tag: "b", label: "기업 회사소개서", value: "기업 회사소개서" },
    { key: "mk_wo_08", page: "works", sel: "#workGrid > a:nth-of-type(6) > div:nth-of-type(2) > h3", tag: "b", label: "수출 영문 카탈로그", value: "수출 영문 카탈로그" },
    { key: "mk_wo_09", page: "works", sel: "#workGrid > a:nth-of-type(7) > div:nth-of-type(2) > h3", tag: "b", label: "브랜드 홍보 포스터", value: "브랜드 홍보 포스터" },
    { key: "mk_wo_10", page: "works", sel: "#workGrid > a:nth-of-type(8) > div:nth-of-type(2) > h3", tag: "b", label: "전시·박람회 홍보물", value: "전시·박람회 홍보물" },
    { key: "mk_wo_11", page: "works", sel: "#workGrid > a:nth-of-type(9) > div:nth-of-type(2) > h3", tag: "b", label: "생활용품 카탈로그", value: "생활용품 카탈로그" },
    { key: "mk_wo_12", page: "works", sel: "#workGrid > a:nth-of-type(10) > div:nth-of-type(2) > h3", tag: "b", label: "브랜드 리플릿", value: "브랜드 리플릿" },
    { key: "mk_wo_13", page: "works", sel: "#workGrid > a:nth-of-type(11) > div:nth-of-type(2) > h3", tag: "b", label: "식품 다국어 브로슈어", value: "식품 다국어 브로슈어" },
    { key: "mk_wo_14", page: "works", sel: "#workGrid > a:nth-of-type(12) > div:nth-of-type(2) > h3", tag: "b", label: "제품 패키지·라벨", value: "제품 패키지·라벨" },
    { key: "mk_wo_15", page: "works", sel: "#workGrid > a:nth-of-type(13) > div:nth-of-type(2) > h3", tag: "b", label: "온라인 상세페이지", value: "온라인 상세페이지" },
    { key: "mk_wo_16", page: "works", sel: "#workGrid > a:nth-of-type(14) > div:nth-of-type(2) > h3", tag: "b", label: "전시 부스 그래픽", value: "전시 부스 그래픽" },
    { key: "mk_wo_17", page: "works", sel: "#workGrid > a:nth-of-type(15) > div:nth-of-type(2) > h3", tag: "b", label: "산업기자재 회사소개서", value: "산업기자재 회사소개서" },
    { key: "mk_wo_18", page: "works", sel: "footer > div > div:nth-of-type(1) > p:nth-of-type(1)", tag: "b", label: "주식회사 하오커뮤니케이션 · 대표 박창민 ·", value: "주식회사 하오커뮤니케이션 · 대표 박창민 · 528-87-01037\n서울특별시 광진구 · sales@haodesign.co.kr" },
    { key: "mk_wo_19", page: "works", sel: "footer > div > div:nth-of-type(1) > p:nth-of-type(2)", tag: "b", label: "© 2026 HAO DESIGN Market", value: "© 2026 HAO DESIGN Marketing. All rights reserved." },
    { key: "mk_wo_20", page: "works", sel: "footer > div > div:nth-of-type(2) > p", tag: "b", label: "09:30 ~ 18:30 (점심 13:00~", value: "09:30 ~ 18:30 (점심 13:00~14:00)" },
    { key: "mk_se_01", page: "services", sel: "#top > section:nth-of-type(2) > p", tag: "b", label: "Marketing Service", value: "Marketing Service" },
    { key: "mk_se_02", page: "services", sel: "#top > section:nth-of-type(2) > h2", tag: "b", label: "각 브랜드에 맞는 방식으로현실적인 해법을 제", value: "각 브랜드에 맞는 방식으로\n현실적인 해법을 제안합니다." },
    { key: "mk_se_03", page: "services", sel: "#top > section:nth-of-type(3) > p", tag: "b", label: "How we work", value: "How we work" },
    { key: "mk_se_04", page: "services", sel: "#top > section:nth-of-type(3) > h2", tag: "b", label: "하오는 이렇게 일합니다", value: "하오는 이렇게 일합니다" },
    { key: "mk_se_05", page: "services", sel: "#top > section:nth-of-type(3) > div:nth-of-type(2) > h3", tag: "b", label: "우리 브랜드엔 어떤 마케팅이 맞을까요?고민부", value: "우리 브랜드엔 어떤 마케팅이 맞을까요?\n고민부터 같이 시작하겠습니다." },
    { key: "mk_se_06", page: "services", sel: "footer > div > div:nth-of-type(1) > p:nth-of-type(1)", tag: "b", label: "주식회사 하오커뮤니케이션 · 대표 박창민 ·", value: "주식회사 하오커뮤니케이션 · 대표 박창민 · 528-87-01037\n서울특별시 광진구 · sales@haodesign.co.kr" },
    { key: "mk_se_07", page: "services", sel: "footer > div > div:nth-of-type(1) > p:nth-of-type(2)", tag: "b", label: "© 2026 HAO DESIGN Market", value: "© 2026 HAO DESIGN Marketing. All rights reserved." },
    { key: "mk_se_08", page: "services", sel: "footer > div > div:nth-of-type(2) > p", tag: "b", label: "09:30 ~ 18:30 (점심 13:00~", value: "09:30 ~ 18:30 (점심 13:00~14:00)" },
    { key: "mk_co_01", page: "column", sel: "#top > section:nth-of-type(2) > p", tag: "b", label: "Insights", value: "Insights" },
    { key: "mk_co_02", page: "column", sel: "#top > section:nth-of-type(2) > h2", tag: "b", label: "최신 칼럼", value: "최신 칼럼" },
    { key: "mk_co_03", page: "column", sel: "footer > div > div:nth-of-type(1) > p:nth-of-type(1)", tag: "b", label: "주식회사 하오커뮤니케이션 · 대표 박창민 ·", value: "주식회사 하오커뮤니케이션 · 대표 박창민 · 528-87-01037\n서울특별시 광진구 · sales@haodesign.co.kr" },
    { key: "mk_co_04", page: "column", sel: "footer > div > div:nth-of-type(1) > p:nth-of-type(2)", tag: "b", label: "© 2026 HAO DESIGN Market", value: "© 2026 HAO DESIGN Marketing. All rights reserved." },
    { key: "mk_co_05", page: "column", sel: "footer > div > div:nth-of-type(2) > p", tag: "b", label: "09:30 ~ 18:30 (점심 13:00~", value: "09:30 ~ 18:30 (점심 13:00~14:00)" },
    { key: "mk_qn_01", page: "qna", sel: "#top > section:nth-of-type(2) > p:nth-of-type(1)", tag: "b", label: "FAQ", value: "FAQ" },
    { key: "mk_qn_02", page: "qna", sel: "#qSearchBtn", tag: "b", label: "검색", value: "검색" },
    { key: "mk_qn_03", page: "qna", sel: "#qReset", tag: "b", label: "초기화", value: "초기화" },
    { key: "mk_qn_04", page: "qna", sel: "footer > div > div:nth-of-type(1) > p:nth-of-type(1)", tag: "b", label: "주식회사 하오커뮤니케이션 · 대표 박창민 ·", value: "주식회사 하오커뮤니케이션 · 대표 박창민 · 528-87-01037\n서울특별시 광진구 · sales@haodesign.co.kr" },
    { key: "mk_qn_05", page: "qna", sel: "footer > div > div:nth-of-type(1) > p:nth-of-type(2)", tag: "b", label: "© 2026 HAO DESIGN Market", value: "© 2026 HAO DESIGN Marketing. All rights reserved." },
    { key: "mk_qn_06", page: "qna", sel: "footer > div > div:nth-of-type(2) > p", tag: "b", label: "09:30 ~ 18:30 (점심 13:00~", value: "09:30 ~ 18:30 (점심 13:00~14:00)" },
    { key: "mk_de_01", page: "detail", sel: "#top > section > h1", tag: "b", label: "마케팅 칼럼", value: "마케팅 칼럼" },
    { key: "mk_de_02", page: "detail", sel: "footer > div > div:nth-of-type(1) > p:nth-of-type(1)", tag: "b", label: "주식회사 하오커뮤니케이션 · 대표 박창민 ·", value: "주식회사 하오커뮤니케이션 · 대표 박창민 · 528-87-01037\n서울특별시 광진구 · sales@haodesign.co.kr" },
    { key: "mk_de_03", page: "detail", sel: "footer > div > div:nth-of-type(1) > p:nth-of-type(2)", tag: "b", label: "© 2026 HAO DESIGN Market", value: "© 2026 HAO DESIGN Marketing. All rights reserved." },
    { key: "mk_de_04", page: "detail", sel: "footer > div > div:nth-of-type(2) > p", tag: "b", label: "09:30 ~ 18:30 (점심 13:00~", value: "09:30 ~ 18:30 (점심 13:00~14:00)" },
    { key: "mk_df_sub", page: "index", sel: "#difference .on__sub", tag: "b", label: "비교 — 부제", value: "하오디자인 마케팅센터는 스몰 브랜드와 중소기업의 성장을 위해\n**브랜드를 계속 맡는 전담팀**이라는 차별화된 방식으로 일합니다." },
    { key: "mk_sv_eg", page: "index", sel: "#services .on__eg", tag: "b", label: "서비스 — 라벨", value: "SERVICES" },
    { key: "mk_sv_h", page: "index", sel: "#services .on__h", tag: "b", label: "서비스 — 제목", value: "하오는 이렇게\n**브랜드의 마케팅팀**이 됩니다" },
    { key: "mk_sv_sub", page: "index", sel: "#services .on__sub", tag: "b", label: "서비스 — 부제", value: "진단부터 전략, 실행까지 —\n마케팅팀이 하는 일을 하오가 그대로 해드립니다." },
    { key: "mk_sv_c1_cat", page: "index", sel: "#services .svq:nth-of-type(1) .svq__t small", tag: "b", label: "서비스 STEP1 — 분류", value: "STEP 01 · 진단" },
    { key: "mk_sv_c1_s1", page: "index", sel: "#services .svq:nth-of-type(1) .svq__sub:nth-of-type(1)", tag: "b", label: "서비스 STEP1 — 문구1", value: "홈페이지, SNS, 검색 결과, 스토어 등 **자체 채널을 모니터링**해 현재 마케팅 상황을 진단합니다." },
    { key: "mk_sv_c1_s2", page: "index", sel: "#services .svq:nth-of-type(1) .svq__sub:nth-of-type(2)", tag: "b", label: "서비스 STEP1 — 문구2", value: "대표님과의 **1:1 인터뷰**로 브랜드의 방향과 강점, 우선순위를 파악합니다." },
    { key: "mk_sv_c2_cat", page: "index", sel: "#services .svq:nth-of-type(2) .svq__t small", tag: "b", label: "서비스 STEP2 — 분류", value: "STEP 02 · 전략" },
    { key: "mk_sv_c2_s1", page: "index", sel: "#services .svq:nth-of-type(2) .svq__sub:nth-of-type(1)", tag: "b", label: "서비스 STEP2 — 문구1", value: "고객이 우리 브랜드를 선택할 이유 — **핵심 메시지**를 함께 정리합니다." },
    { key: "mk_sv_c2_s2", page: "index", sel: "#services .svq:nth-of-type(2) .svq__sub:nth-of-type(2)", tag: "b", label: "서비스 STEP2 — 문구2", value: "목표 달성에 필요한 **채널·콘텐츠 전략**을 수립하고, 구체적인 실행 계획을 설계합니다." },
    { key: "mk_sv_c3_cat", page: "index", sel: "#services .svq:nth-of-type(3) .svq__t small", tag: "b", label: "서비스 STEP3 — 분류", value: "STEP 03 · 실행" },
    { key: "mk_sv_c3_s1", page: "index", sel: "#services .svq:nth-of-type(3) .svq__sub:nth-of-type(1)", tag: "b", label: "서비스 STEP3 — 문구1", value: "SNS·상세페이지·홍보물 등 **핵심 콘텐츠를 기획·제작**합니다." },
    { key: "mk_sv_c3_s2", page: "index", sel: "#services .svq:nth-of-type(3) .svq__sub:nth-of-type(2)", tag: "b", label: "서비스 STEP3 — 문구2", value: "채널을 **한 톤으로 꾸준히 운영**하며 브랜드를 알립니다." },
    { key: "mk_sv_c3_s3", page: "index", sel: "#services .svq:nth-of-type(3) .svq__sub:nth-of-type(3)", tag: "b", label: "서비스 STEP3 — 문구3", value: "전시·박람회 등 **오프라인 현장**까지 브랜드 경험을 이어갑니다." },
    { key: "mk_ix_01", page: "index", sel: "#pin > div > p:nth-of-type(1)", tag: "b", label: "핀 · Scroll for more", value: "A brand that isn’t seen might as well not exist." },
    { key: "mk_ix_03", page: "index", sel: "#why > div > p:nth-of-type(1)", tag: "b", label: "문제 · WHY HAO", value: "WHY HAO" },
    { key: "mk_ix_04", page: "index", sel: "#why > div > h2", tag: "b", label: "문제 · 대표님, 마케팅팀이 없어서막막하신가요?", value: "마케팅팀이 없다는 이유로\n브랜드 성장이 멈춰있지 않나요?" },
    { key: "mk_ix_05", page: "index", sel: "#why > div > p:nth-of-type(2)", tag: "b", label: "문제 · 스타트업·중소기업·1인 브랜드까지 — 마케팅", value: "스타트업부터 중소기업, 1인 브랜드까지 마케팅은 선택이 아니라 생존 조건이 되었습니다.\n하오디자인은 900개가 넘는 프로젝트에서 그 고민을 매일 마주해 왔습니다." },
    { key: "mk_ix_06", page: "index", sel: "#difference > div > p:nth-of-type(1)", tag: "b", label: "비교 · DIFFERENCE", value: "DIFFERENCE" },
    { key: "mk_ix_07", page: "index", sel: "#difference > div > h2", tag: "b", label: "비교 · 하오디자인 마케팅센터,일반 외주 대행과는 어", value: "하오디자인 마케팅센터,\n**일반 외주 대행과는 어떻게 다를까요?**" },
    { key: "mk_ix_08", page: "index", sel: "#difference > div > div > div:nth-of-type(1) > div:nth-of-type(2) > small", tag: "b", label: "비교 · 주요 활동", value: "주요 활동" },
    { key: "mk_ix_09", page: "index", sel: "#difference > div > div > div:nth-of-type(1) > div:nth-of-type(2) > p", tag: "b", label: "비교 · 요청받은 작업물 납품(건별 디자인 외주)", value: "요청받은 작업물 납품\n(건별 디자인 외주)" },
    { key: "mk_ix_10", page: "index", sel: "#difference > div > div > div:nth-of-type(1) > div:nth-of-type(3) > small", tag: "b", label: "비교 · 브랜드 이해도", value: "브랜드 이해도" },
    { key: "mk_ix_11", page: "index", sel: "#difference > div > div > div:nth-of-type(1) > div:nth-of-type(3) > p", tag: "b", label: "비교 · 전달받은 자료 기반단건 작업", value: "전달받은 자료 기반\n단건 작업" },
    { key: "mk_ix_12", page: "index", sel: "#difference > div > div > div:nth-of-type(1) > div:nth-of-type(4) > small", tag: "b", label: "비교 · 실행 영역", value: "실행 영역" },
    { key: "mk_ix_13", page: "index", sel: "#difference > div > div > div:nth-of-type(1) > div:nth-of-type(4) > p", tag: "b", label: "비교 · 디자인 결과물 위주", value: "디자인 결과물 위주" },
    { key: "mk_ix_14", page: "index", sel: "#difference > div > div > div:nth-of-type(1) > div:nth-of-type(5) > small", tag: "b", label: "비교 · 협업 방식", value: "협업 방식" },
    { key: "mk_ix_15", page: "index", sel: "#difference > div > div > div:nth-of-type(1) > div:nth-of-type(5) > p", tag: "b", label: "비교 · 요청 기반 단발 협업,납품하면 관계 종료", value: "요청 기반 단발 협업,\n납품하면 관계 종료" },
    { key: "mk_ix_16", page: "index", sel: "#difference > div > div > div:nth-of-type(2) > div:nth-of-type(2) > small", tag: "b", label: "비교 · 주요 활동", value: "주요 활동" },
    { key: "mk_ix_17", page: "index", sel: "#difference > div > div > div:nth-of-type(2) > div:nth-of-type(2) > p", tag: "b", label: "비교 · 진단·전략 수립 후 맞춤 마케팅 실행(브랜드", value: "진단·전략 수립 후 맞춤 마케팅 실행\n(브랜드 콘텐츠, 이커머스, 전시 등)" },
    { key: "mk_ix_18", page: "index", sel: "#difference > div > div > div:nth-of-type(2) > div:nth-of-type(3) > small", tag: "b", label: "비교 · 브랜드 이해도", value: "브랜드 이해도" },
    { key: "mk_ix_19", page: "index", sel: "#difference > div > div > div:nth-of-type(2) > div:nth-of-type(3) > p", tag: "b", label: "비교 · 전담팀이 브랜드 톤·가이드를함께 정리하고 계", value: "전담팀이 브랜드 톤·가이드를\n함께 정리하고 계속 축적" },
    { key: "mk_ix_20", page: "index", sel: "#difference > div > div > div:nth-of-type(2) > div:nth-of-type(4) > small", tag: "b", label: "비교 · 실행 영역", value: "실행 영역" },
    { key: "mk_ix_21", page: "index", sel: "#difference > div > div > div:nth-of-type(2) > div:nth-of-type(4) > p", tag: "b", label: "비교 · 브랜드 콘텐츠 + 상세페이지·스토어+ 전시·", value: "브랜드 콘텐츠 + 상세페이지·스토어\n+ 전시·박람회까지 일괄 실행" },
    { key: "mk_ix_22", page: "index", sel: "#difference > div > div > div:nth-of-type(2) > div:nth-of-type(5) > small", tag: "b", label: "비교 · 협업 방식", value: "협업 방식" },
    { key: "mk_ix_23", page: "index", sel: "#difference > div > div > div:nth-of-type(2) > div:nth-of-type(5) > p", tag: "b", label: "비교 · 내부 팀처럼 밀착 소통,리포트·최적화로 지속", value: "내부 팀처럼 밀착 소통,\n리포트·최적화로 지속 개선" },
    { key: "mk_ix_24", page: "index", sel: "#solution > div > p:nth-of-type(1)", tag: "b", label: "5단계 · HOW WE SOLVE", value: "HOW WE SOLVE" },
    { key: "mk_ix_25", page: "index", sel: "#solution > div > h2", tag: "b", label: "5단계 · 막막한 마케팅, 5단계로 정리해 드립니다", value: "막막한 마케팅, **5단계로 정리**해 드립니다" },
    { key: "mk_ix_26", page: "index", sel: "#solution > div > p:nth-of-type(2)", tag: "b", label: "5단계 · 어디서부터 시작할지 모를 마케팅을, 진단부터", value: "어디서부터 시작할지 모를 마케팅을, 진단부터 실행·최적화까지 하나의 흐름으로 이어드립니다." },
    { key: "mk_ix_27", page: "index", sel: "#timeline > div:nth-of-type(2) > h3", tag: "b", label: "5단계 · 진단 · 목표 설정", value: "진단 · 목표 설정" },
    { key: "mk_ix_28", page: "index", sel: "#timeline > div:nth-of-type(2) > p", tag: "b", label: "5단계 · 브랜드 현황과 목표를 함께 정리하고, 무엇을", value: "브랜드 현황과 목표를 함께 정리하고, 무엇을 먼저 풀지 우선순위를 잡습니다." },
    { key: "mk_ix_29", page: "index", sel: "#timeline > div:nth-of-type(3) > h3", tag: "b", label: "5단계 · 전략 · 채널 설계", value: "전략 · 채널 설계" },
    { key: "mk_ix_30", page: "index", sel: "#timeline > div:nth-of-type(3) > p", tag: "b", label: "5단계 · 브랜드에 맞는 방향과 채널을 설계해, 흩어진", value: "브랜드에 맞는 방향과 채널을 설계해, 흩어진 마케팅을 하나로 묶습니다." },
    { key: "mk_ix_31", page: "index", sel: "#timeline > div:nth-of-type(4) > h3", tag: "b", label: "5단계 · 콘텐츠 · 디자인 제작", value: "콘텐츠 · 디자인 제작" },
    { key: "mk_ix_32", page: "index", sel: "#timeline > div:nth-of-type(4) > p", tag: "b", label: "5단계 · 브랜드의 결을 담은 콘텐츠와 디자인으로 메시", value: "브랜드의 결을 담은 콘텐츠와 디자인으로 메시지를 정확히 전합니다." },
    { key: "mk_ix_33", page: "index", sel: "#timeline > div:nth-of-type(5) > h3", tag: "b", label: "5단계 · 운영 · 실행", value: "운영 · 실행" },
    { key: "mk_ix_34", page: "index", sel: "#timeline > div:nth-of-type(5) > p", tag: "b", label: "5단계 · 온라인 채널부터 오프라인 현장까지, 기획이 ", value: "온라인 채널부터 오프라인 현장까지, 기획이 실제로 작동하게 실행합니다." },
    { key: "mk_ix_35", page: "index", sel: "#timeline > div:nth-of-type(6) > h3", tag: "b", label: "5단계 · 리포트 · 최적화", value: "리포트 · 최적화" },
    { key: "mk_ix_36", page: "index", sel: "#timeline > div:nth-of-type(6) > p", tag: "b", label: "5단계 · 결과를 함께 보고 다음을 개선하며, 브랜드가", value: "결과를 함께 보고 다음을 개선하며, 브랜드가 꾸준히 성장하도록 돕습니다." },
    { key: "mk_ix_51", page: "index", sel: "#works > div:nth-of-type(1) > h2", tag: "b", label: "포트폴리오 · 포트폴리오", value: "포트폴리오" },
    { key: "mk_ix_53", page: "index", sel: "#contact > div > div:nth-of-type(1) > h2", tag: "b", label: "문의 · CONTACTUS", value: "CONTACT\nUS" },
    { key: "mk_ix_54", page: "index", sel: "#contact > div > div:nth-of-type(1) > p", tag: "b", label: "문의 · 마케팅팀이 없어도 괜찮습니다.하오가 우리 브", value: "마케팅팀이 없어도 괜찮습니다.\n**하오가 우리 브랜드의 마케팅팀**이 되어드릴게요.\n간단히 남겨주시면 빠르게 연락드립니다." },
    { key: "mk_ix_55", page: "index", sel: "#quoteForm > button", tag: "b", label: "문의 · 문의 보내기", value: "문의 보내기" },
    { key: "mk_ix_56", page: "index", sel: "footer > div > div:nth-of-type(1) > p:nth-of-type(1)", tag: "b", label: "푸터 · 주식회사 하오커뮤니케이션 · 대표 박창민 ·", value: "주식회사 하오커뮤니케이션 · 대표 박창민 · 528-87-01037\n서울특별시 광진구 · sales@haodesign.co.kr" },
    { key: "mk_ix_57", page: "index", sel: "footer > div > div:nth-of-type(1) > p:nth-of-type(2)", tag: "b", label: "푸터 · © 2026 HAO DESIGN Market", value: "© 2026 HAO DESIGN Marketing. All rights reserved." },
    { key: "mk_ix_58", page: "index", sel: "footer > div > div:nth-of-type(2) > p", tag: "b", label: "푸터 · 09:30 ~ 18:30 (점심 13:00~", value: "09:30 ~ 18:30 (점심 13:00~14:00)" },
    { key: "mk_ch_01", page: "index", sel: ".on-chatgrp .on-chat:nth-child(1) p:nth-of-type(1)", tag: "b", label: "CASE1 — 질문", value: "마케팅팀이 없어서,\n어디서부터 시작해야 할지 모르겠어요." },
    { key: "mk_ch_02", page: "index", sel: ".on-chatgrp .on-chat:nth-child(1) p:nth-of-type(2)", tag: "b", label: "CASE1 — 말풍선①", value: "대표가 본업만으로도 벅찬데, 마케팅까지 챙길 여력이 없습니다." },
    { key: "mk_ch_03", page: "index", sel: ".on-chatgrp .on-chat:nth-child(1) p:nth-of-type(3)", tag: "b", label: "CASE1 — 말풍선②", value: "투자자나 고객에게 보여줄 채널도, 콘텐츠도 정리가 안 돼 있어요." },
    { key: "mk_ch_04", page: "index", sel: ".on-chatgrp .on-chat:nth-child(1) p:nth-of-type(4)", tag: "b", label: "CASE1 — 하오 답변", value: "하오가 전담팀이 되어 고민 정리부터 시작합니다.\n무엇을 먼저 풀지 우선순위부터 함께 잡아드립니다." },
    { key: "mk_ch_05", page: "index", sel: ".on-chatgrp .on-chat:nth-child(1) .on-chat__meta small", tag: "b", label: "CASE1 — 고객 유형", value: "스타트업" },
    { key: "mk_ch_06", page: "index", sel: ".on-chatgrp .on-chat:nth-child(1) .on-chat__meta b", tag: "b", label: "CASE1 — 브랜드명", value: "A 브랜드" },
    { key: "mk_ch_07", page: "index", sel: ".on-chatgrp .on-chat:nth-child(2) p:nth-of-type(1)", tag: "b", label: "CASE2 — 질문", value: "경쟁사는 온라인에서 자주 보이는데,\n우리는 아무것도 안 나와요." },
    { key: "mk_ch_08", page: "index", sel: ".on-chatgrp .on-chat:nth-child(2) p:nth-of-type(2)", tag: "b", label: "CASE2 — 말풍선①", value: "검색해도 우리 브랜드 콘텐츠가 거의 없어 신뢰를 얻기 어렵습니다." },
    { key: "mk_ch_09", page: "index", sel: ".on-chatgrp .on-chat:nth-child(2) p:nth-of-type(3)", tag: "b", label: "CASE2 — 말풍선②", value: "채널을 만들어도 뭘 올려야 할지 막막합니다." },
    { key: "mk_ch_10", page: "index", sel: ".on-chatgrp .on-chat:nth-child(2) p:nth-of-type(4)", tag: "b", label: "CASE2 — 하오 답변", value: "브랜드 톤을 정리하고 콘텐츠 운영 체계를 만들어,\n채널이 꾸준히 브랜드의 얼굴이 되게 합니다." },
    { key: "mk_ch_11", page: "index", sel: ".on-chatgrp .on-chat:nth-child(2) .on-chat__meta small", tag: "b", label: "CASE2 — 고객 유형", value: "스몰브랜드" },
    { key: "mk_ch_12", page: "index", sel: ".on-chatgrp .on-chat:nth-child(2) .on-chat__meta b", tag: "b", label: "CASE2 — 브랜드명", value: "B 브랜드" },
    { key: "mk_ch_13", page: "index", sel: ".on-chatgrp .on-chat:nth-child(3) p:nth-of-type(1)", tag: "b", label: "CASE3 — 질문", value: "외주를 맡길 때마다\n결과물이 제각각이에요." },
    { key: "mk_ch_14", page: "index", sel: ".on-chatgrp .on-chat:nth-child(3) p:nth-of-type(2)", tag: "b", label: "CASE3 — 말풍선①", value: "업체마다 톤이 달라 브랜드가 하나로 보이지 않습니다." },
    { key: "mk_ch_15", page: "index", sel: ".on-chatgrp .on-chat:nth-child(3) p:nth-of-type(3)", tag: "b", label: "CASE3 — 말풍선②", value: "매번 처음부터 다시 설명하는 것도 지칩니다." },
    { key: "mk_ch_16", page: "index", sel: ".on-chatgrp .on-chat:nth-child(3) p:nth-of-type(4)", tag: "b", label: "CASE3 — 하오 답변", value: "브랜드 가이드를 세우고, 모든 채널을같은 톤으로 만들어\n흩어진 브랜드를 하나로 모읍니다." },
    { key: "mk_ch_17", page: "index", sel: ".on-chatgrp .on-chat:nth-child(3) .on-chat__meta small", tag: "b", label: "CASE3 — 고객 유형", value: "강소기업" },
    { key: "mk_ch_18", page: "index", sel: ".on-chatgrp .on-chat:nth-child(3) .on-chat__meta b", tag: "b", label: "CASE3 — 브랜드명", value: "C 브랜드" },
    { key: "mk_ch_19", page: "index", sel: ".on-chatgrp .on-chat:nth-child(4) p:nth-of-type(1)", tag: "b", label: "CASE4 — 질문", value: "회사가 커지는데 디자인 따로,\n마케팅 따로 움직여요." },
    { key: "mk_ch_20", page: "index", sel: ".on-chatgrp .on-chat:nth-child(4) p:nth-of-type(2)", tag: "b", label: "CASE4 — 말풍선①", value: "만드는 곳과 알리는 곳이 달라 손발이 자꾸 어긋납니다." },
    { key: "mk_ch_21", page: "index", sel: ".on-chatgrp .on-chat:nth-child(4) p:nth-of-type(3)", tag: "b", label: "CASE4 — 말풍선②", value: "전시·카탈로그·온라인이 다 따로 놉니다." },
    { key: "mk_ch_22", page: "index", sel: ".on-chatgrp .on-chat:nth-child(4) p:nth-of-type(4)", tag: "b", label: "CASE4 — 하오 답변", value: "기획·디자인·운영을 한 팀이 맡아,온라인부터 전시 현장까지 하나의 브랜드로 이어지게 합니다." },
    { key: "mk_ch_23", page: "index", sel: ".on-chatgrp .on-chat:nth-child(4) .on-chat__meta small", tag: "b", label: "CASE4 — 고객 유형", value: "제조기업" },
    { key: "mk_ch_24", page: "index", sel: ".on-chatgrp .on-chat:nth-child(4) .on-chat__meta b", tag: "b", label: "CASE4 — 브랜드명", value: "D 브랜드" },

    /* ── Works ── */
    { key: "works_title", page: "works", sel: ".subhero__title", tag: "b", label: "상단 제목", value: "포트폴리오" },
    { key: "works_desc", page: "works", sel: ".subhero__desc", tag: "b", label: "상단 설명", value: "중소기업의 브랜드를 보이게 만든 작업들. 비주얼 리뉴얼부터 이커머스·패키지·전시까지, 디자인으로 풀어낸 마케팅 사례를 모았습니다." },

    /* ── Services ── */
    { key: "svc_title", page: "services", sel: ".subhero__title", tag: "b", label: "상단 제목", value: "Services" },
    { key: "svc_desc", page: "services", sel: ".subhero__desc", tag: "b", label: "상단 설명", value: "채널 하나가 아니라, 브랜드가 알려지는 모든 길을 함께 설계합니다. 중소기업의 마케팅을 디자인으로 풀어내는 8가지 서비스." },

    /* ── 칼럼 ── */
    { key: "col_title", page: "column", sel: ".subhero__title", tag: "b", label: "상단 제목", value: "마케팅 칼럼" },
    { key: "col_desc", page: "column", sel: ".subhero__desc", tag: "b", label: "상단 설명", value: "마케팅팀이 없어도 방향은 잡을 수 있습니다.\n진단부터 콘텐츠·전시까지, 현장에서 쌓은 실전 노하우를 쉽게 풀어드립니다." },

    /* ── Q&A ── */
    { key: "qna_title", page: "qna", sel: ".subhero__title", tag: "b", label: "상단 제목", value: "자주 하는 질문" },
    { key: "mk_qna_desc", page: "qna", sel: ".subhero__desc", tag: "b", label: "상단 설명 ([문구](주소)=링크)", value: "퍼포먼스·IMC·콘텐츠 마케팅과 광고 운영에 대한 질문을 모았습니다. 찾는 답이 없으면 [문의하기](index.html#contact)를 이용해 주세요." },
    { key: "qna_ptitle", page: "qna", sel: ".page__title", tag: "b", label: "섹션 제목", value: "무엇이 궁금하신가요" }
  ];

  /* ===== 로드 헬퍼 ===== */
  function load(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); if (Array.isArray(v)) return v; } catch (e) {}
    return JSON.parse(JSON.stringify(fallback));
  }
  function loadObj(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); if (v && typeof v === "object" && !Array.isArray(v)) return v; } catch (e) {}
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

    getWorks: function () { return load("hm_works", DEFAULT_WORKS).filter(function (w) { return w && w.img; }); },
    getWorksRaw: function () { return load("hm_works", DEFAULT_WORKS); },
    getHero: function () { return load("hm_hero", DEFAULT_HERO); },
    getPosts: function () {
      var arr = load("hm_posts", DEFAULT_POSTS);
      arr.sort(function (a, b) { return (b.date || "").localeCompare(a.date || "") || (b.id - a.id); });
      return arr;
    },
    getQna: function () { return load("hm_qna", DEFAULT_QNA); },
    getPartners: function () { return load("hm_partners", DEFAULT_PARTNERS); },
    getLogo: function () { var v = localStorage.getItem("hm_logo"); try { v = JSON.parse(v); } catch (e) {} return (typeof v === "string" && v) ? v : "assets/img/logo.png"; },
    getSettings: function () { return loadObj("hm_settings", DEFAULT_SETTINGS); },
    getSocial: function () { return loadObj("hm_social", DEFAULT_SOCIAL); },
    getCopy: function () {
      var ov = loadObj("hm_copy", {});
      return DEFAULT_COPY.map(function (c) {
        var out = JSON.parse(JSON.stringify(c));
        if (typeof ov[c.key] === "string") out.value = ov[c.key];
        return out;
      });
    },
    getSeo: function () {
      var ov = loadObj("hm_seo", {});
      var out = JSON.parse(JSON.stringify(DEFAULT_SEO));
      if (ov.siteUrl) out.siteUrl = ov.siteUrl;
      if (ov.ogImage) out.ogImage = ov.ogImage;
      if (ov.pages) Object.keys(ov.pages).forEach(function (p) {
        if (!out.pages[p]) out.pages[p] = {};
        Object.keys(ov.pages[p]).forEach(function (f) { out.pages[p][f] = ov.pages[p][f]; });
      });
      return out;
    },
    getHeadCode: function () { try { var v = JSON.parse(localStorage.getItem("hm_headcode")); return typeof v === "string" ? v : ""; } catch (e) { return ""; } },
    getAccounts: function () {
      try { var v = JSON.parse(localStorage.getItem("hm_accounts")); if (Array.isArray(v) && v.length) return v; } catch (e) {}
      var c = loadObj("hm_admin_cred", null);
      if (c && c.id) return [c];
      return [{ id: "admin", pw: "mkt1234" }];
    },
    saveAccounts: function (list) { return this.set("hm_accounts", list); },
    getCred: function () { return this.getAccounts()[0]; },
    verifyLogin: function (id, pw) {
      var hit = function (list) { return (list || []).some(function (a) { return a && a.id === id && a.pw === pw; }); };
      return hit(this.getAccounts()) || hit(HUB_ACCOUNTS);
    },
    getMail: function () { return loadObj("hm_mail", { on: false, url: "", to: "sales@haodesign.co.kr" }); },

    saveInquiry: function (q) {
      var m = this.getMail();
      var typed = INQ_TAG + " " + (q.type || "마케팅 문의");
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

    fmt: function (s, tag) {
      var esc = String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
      return esc.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>').replace(/\*\*(.+?)\*\*/g, "<" + tag + ">$1</" + tag + ">").replace(/\n/g, "<br />");
    }
  };
})();
