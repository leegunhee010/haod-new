/* ===================================================
   HAOC STUDIO (스튜디오센터) — shared data layer
   기본 데이터 + 관리자 오버라이드(Supabase 서버 + localStorage 캐시).
   · design 센터와 같은 Supabase 프로젝트를 공유하되, 키는 모두 "hs_" 접두사로 분리.
   · 견적문의는 공유 inquiries 테이블에 저장하되 type 앞에 "[스튜디오]" 표시로 구분.
=================================================== */
(function () {
  "use strict";

  /* ---- Supabase 연결 (design 센터와 동일 프로젝트 공유) ---- */
  var SB_URL = "https://oaqrjrrgntlqmyxxovfn.supabase.co";
  var SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcXJqcnJnbnRscW15eHhvdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NjQzMTUsImV4cCI6MjA5NzE0MDMxNX0.3bOfZOXVKSoI9ELfE7ZjWETuxvjpNYHdCBSIMrbAGtU";
  var SB_H = { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": "application/json" };

  /* 스튜디오센터 문의 식별 태그 (type 앞에 붙여 design 문의와 구분) */
  var INQ_TAG = "[스튜디오]";

  /* 서버에서 studio 오버라이드(hs_*)만 불러와 localStorage 캐시에 채움 (페이지 부팅 시 1회).
     inquiries(고객 문의)는 overrides 가 아니므로 방문자 브라우저로 내려오지 않음. */
  function sbLoad() {
    var hasCache = false;
    try {
      for (var ci = 0; ci < localStorage.length; ci++) {
        var ck = localStorage.key(ci);
        if (ck && ck.indexOf("hs_") === 0 && ck !== "hs_admin_cred" && ck !== "hs_edit") { hasCache = true; break; }
      }
    } catch (e) {}
    var timed = new Promise(function (resolve) { setTimeout(resolve, hasCache ? 3000 : 12000); });
    var fetched = fetch(SB_URL + "/rest/v1/overrides?select=k,v&k=like.hs_*", { headers: SB_H })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        var seen = {};
        rows.forEach(function (row) {
          seen[row.k] = 1;
          try { localStorage.setItem(row.k, JSON.stringify(row.v)); } catch (e) {}
        });
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var lk = localStorage.key(i);
          if (lk && lk.indexOf("hs_") === 0 && lk !== "hs_admin_cred" && lk !== "hs_edit" && !seen[lk]) {
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

  /* 이미지 파일(Blob)을 Storage('images' 버킷, design 과 공유)에 업로드 → 공개 URL 반환 */
  function sbUpload(blob, ext) {
    var name = "hs_" + Date.now() + "_" + Math.floor(Math.random() * 1e9).toString(36) + "." + (ext || "jpg");
    return fetch(SB_URL + "/storage/v1/object/images/" + name, {
      method: "POST",
      headers: { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": blob.type || "image/jpeg", "x-upsert": "true" },
      body: blob
    }).then(function (r) {
      return r.ok ? (SB_URL + "/storage/v1/object/public/images/" + name) : null;
    }).catch(function () { return null; });
  }

  /* 이미지 키 → 실제 경로
     "hs01.jpg" → assets/haostudio/hs01.jpg
     "assets/..." (슬래시 포함) → 그대로
     "https://…" · "data:…" → 그대로 */
  function imgSrc(f) {
    if (!f) return "";
    if (/^(https?:|data:)/.test(f)) return f;
    if (f.indexOf("/") >= 0) return f;
    return "assets/haostudio/" + f;
  }

  /* ===== 기본 포트폴리오 (촬영 작업) ===== */
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

  /* 촬영 등록일 (최신순 정렬용) — 미지정은 중간값 */
  var WORK_DATES = {
    'hs01.jpg':'20250522','hs02.jpg':'20250522','hs03.jpg':'20250522','hs04.jpg':'20250522','hs05.jpg':'20250522','hs06.jpg':'20250522',
    'hs08.jpg':'20250417','hs09.jpg':'20250417','hs10.jpg':'20250417','hs11.jpg':'20250417','hs12.jpg':'20250417','hs13.jpg':'20250417','hs14.jpg':'20250417','hs15.jpg':'20250417','hs16.jpg':'20250417',
    'hs17.jpg':'20250331','hs18.jpg':'20250331',
    'hs33.jpg':'20250319','hs34.jpg':'20250319','hs35.jpg':'20250319','hs36.jpg':'20250319','hs37.jpg':'20250319','hs38.jpg':'20250319','hs39.jpg':'20250319','hs40.jpg':'20250319','hs41.jpg':'20250319','hs42.jpg':'20250319','hs43.jpg':'20250319','hs44.jpg':'20250319',
    'hs45.jpg':'20241017','hs46.jpg':'20241017','hs47.jpg':'20241017','hs48.jpg':'20241017','hs49.jpg':'20241017','hs50.jpg':'20241017','hs51.jpg':'20241017','hs52.jpg':'20241017',
    'hs53.jpg':'20201218',
    'hs07.jpg':'20240301','hs19.jpg':'20240301','hs20.jpg':'20240301','hs21.jpg':'20240301','hs22.jpg':'20240301','hs23.jpg':'20240301','hs24.jpg':'20240301'
  };

  /* ===== 메인 히어로 슬라이드 (title 의 **단어** = em 강조) ===== */
  var DEFAULT_HERO = [
    { eng: "HAOC STUDIO · Lifestyle & Commerce", title: "브랜드를 더 브랜드답게,\n다양한 컨셉의 **촬영**", btn: "자세히 보기", href: "#service", img: "assets/hero/1.jpg" },
    { eng: "Capturing Mood, Creating Distinctive Visuals", title: "브랜드 무드를 깊이 담아\n**차별화된** 비주얼 촬영", btn: "촬영 알아보기", href: "photo.html", img: "assets/hero/2.jpg" },
    { eng: "Building Brands Into Market Leaders", title: "브랜드의 가치를 높이는\n**성과 중심** 커머스 디자인", btn: "상세페이지 보기", href: "detailpage.html", img: "assets/hero/3.jpg" }
  ];

  /* ===== 칼럼 글 ===== */
  var DEFAULT_POSTS = [
    { id: 6, title: '제품 사진 하나가 전환율을 바꾼다', summary: '같은 제품도 첫 컷에 따라 클릭과 구매가 달라지는 이유.', date: '2026-06-18', img: 'assets/work-hd/thumb/w380.jpg', isNew: true,
      body: ['상세페이지에서 가장 먼저 보이는 건 텍스트가 아니라 이미지입니다. 첫 화면의 메인 컷이 곧 "이 제품을 더 볼지 말지"를 결정합니다.', '제품 사진은 단순히 예쁘게 찍는 게 아니라, 브랜드가 말하고 싶은 가치를 한 장에 담는 일입니다. 빛의 방향, 배경 톤, 소품 하나가 신뢰감과 가격대의 인상을 바꿉니다.', '촬영 전 "이 제품의 핵심 강점은 무엇인가"를 먼저 정의하면, 그 강점이 가장 잘 보이는 컷을 설계할 수 있습니다.'] },
    { id: 5, title: '누끼컷 vs 연출컷, 언제 무엇을 쓸까', summary: '커머스 상세에서 두 컷의 역할과 배치 순서.', date: '2026-06-09', img: 'assets/work-hd/thumb/w379.jpg', isNew: true,
      body: ['누끼컷은 제품 자체의 정보를 정확히 전달합니다. 색·형태·구성품을 깔끔하게 보여줘 "정보"의 역할을 합니다.', '연출컷은 사용 맥락과 분위기를 전달합니다. "이걸 쓰면 내 일상이 이렇게 된다"는 상상을 만들어 "욕구"를 자극합니다.', '상세페이지는 보통 연출컷으로 분위기를 잡고, 누끼컷으로 정보를 확인시키는 순서가 효과적입니다. 둘 중 하나만으로는 부족합니다.'] },
    { id: 4, title: '팔리는 상세페이지의 5단 구성', summary: '후킹부터 구매유도까지, 설득의 순서 설계법.', date: '2026-05-28', img: 'assets/work-hd/thumb/w402.jpg', isNew: false,
      body: ['상세페이지는 디자인이 아니라 설득의 문제입니다. 좋은 페이지는 고객의 의심을 순서대로 풀어줍니다.', '① 후킹(첫 화면) ② 문제 제기(공감) ③ 해결(핵심 강점) ④ 증거(신뢰) ⑤ 구매 유도(정보) — 이 흐름을 따르면 자연스럽게 구매까지 이어집니다.', '핵심은 "기능 나열"이 아니라 "그래서 당신에게 좋은 점"으로 바꿔 말하는 것입니다.'] },
    { id: 3, title: '릴스 3초, 스크롤을 멈추게 하는 법', summary: '숏폼의 첫 장면과 편집 리듬이 전부인 이유.', date: '2026-05-19', img: 'assets/work-hd/thumb/w377.jpg', isNew: false,
      body: ['숏폼은 길이가 짧은 만큼 첫 3초가 승부입니다. 시청자가 스크롤을 멈추는 건 보통 첫 장면의 호기심 때문입니다.', '제품을 천천히 소개하기보다, 결과나 반전을 먼저 보여주고 "왜?"를 만들면 이탈이 줄어듭니다.', '자막·효과음·컷 전환의 리듬도 중요합니다. 채널 규격(9:16)과 시청 패턴에 맞춰 편집해야 끝까지 보게 됩니다.'] },
    { id: 2, title: '촬영 의뢰 전 준비하면 좋은 3가지', summary: '레퍼런스·컷 리스트·일정을 미리 정하면 결과가 달라진다.', date: '2026-05-10', img: 'assets/work-hd/thumb/w378.jpg', isNew: false,
      body: ['촬영 결과는 준비에서 절반이 결정됩니다. 의뢰 전 세 가지만 정리해도 훨씬 매끄럽게 진행됩니다.', '① 레퍼런스: 원하는 무드의 이미지 몇 장 ② 컷 리스트: 꼭 필요한 장면과 용도 ③ 일정: 납품 데드라인.', '이 정보가 명확할수록 콘티가 정확해지고, 재촬영 같은 리스크가 줄어듭니다.'] },
    { id: 1, title: '브랜드 톤을 사진으로 지키는 법', summary: '시즌마다 흔들리지 않는 비주얼 일관성 만들기.', date: '2026-04-29', img: 'assets/work-hd/thumb/w375.jpg', isNew: false,
      body: ['브랜드는 한 장의 사진이 아니라 "쌓인 인상"으로 기억됩니다. 그래서 비주얼 톤의 일관성이 중요합니다.', '색온도, 배경, 소품 스타일, 여백의 규칙을 가이드로 정해두면 누가 찍어도 같은 브랜드처럼 보입니다.', '하오커뮤니케이션 스튜디오는 첫 촬영에서 톤 가이드를 함께 정리해, 다음 시즌에도 이어지는 비주얼을 만듭니다.'] }
  ];

  /* ===== Q&A ===== */
  var DEFAULT_QNA = [
    { c: '촬영', q: '촬영은 어디서 진행하나요?', a: '광진구 자체 스튜디오에서 진행하는 것이 기본이며, 제품·상황에 따라 현장·매장 출장 촬영도 가능합니다. 공간 조건을 알려주시면 사전에 안내드립니다.' },
    { c: '촬영', q: '제품은 어떻게 전달하면 되나요?', a: '택배 또는 방문으로 받습니다. 촬영 후 반송도 가능하며, 파손·변질 위험이 있는 제품(식품·화장품 등)은 사전에 알려주세요.' },
    { c: '촬영', q: '컷 수는 어떻게 정하나요?', a: '상세페이지 용도와 채널을 기준으로 필요한 컷(누끼·연출·디테일)을 함께 정합니다. 처음이시면 표준 구성으로 제안드립니다.' },
    { c: '촬영', q: '모델 촬영도 가능한가요?', a: '네. 착용·사용 컷이 필요한 경우 모델 섭외를 함께 진행할 수 있습니다. 컨셉과 예산을 알려주시면 안내드립니다.' },
    { c: '촬영', q: '누끼·보정도 포함되나요?', a: '기본 누끼·색보정은 촬영과 함께 진행합니다. 합성·고급 리터칭 등 작업 강도가 높은 보정은 별도 견적으로 안내드립니다.' },
    { c: '상세페이지', q: '촬영 없이 상세페이지 제작만 가능한가요?', a: '네. 보유하신 이미지로 기획·디자인만 진행할 수 있습니다. 다만 이미지 퀄리티가 결과에 큰 영향을 주므로 필요 시 일부 보정·재촬영을 권해드립니다.' },
    { c: '상세페이지', q: '원고(카피)도 작성해 주시나요?', a: '네. 제품 정보와 타깃을 주시면 후킹·강점·구매유도 카피를 함께 작성합니다. 보유 원고가 있으면 다듬어 반영합니다.' },
    { c: '상세페이지', q: '어떤 판매 채널 규격에 맞춰주나요?', a: '스마트스토어·자사몰·쿠팡·오픈마켓 등 채널 규격에 맞춰 제작합니다. 사용하실 채널을 미리 알려주세요.' },
    { c: '상세페이지', q: '수정은 몇 번까지 가능한가요?', a: '시안 단계에서 2~3회 수정을 기본 포함합니다. 구성을 바꾸는 대규모 수정은 별도 협의합니다.' },
    { c: '영상', q: '영상 한 편 비용은 얼마인가요?', a: '길이·촬영 여부·편집 난이도에 따라 달라집니다. 레퍼런스를 주시면 비슷한 퀄리티 기준으로 견적을 안내드립니다.' },
    { c: '영상', q: '편집만 맡길 수 있나요?', a: '네. 보유 영상 소스로 컷편집·자막·모션 작업만 진행할 수 있습니다. 소스 길이와 분량을 알려주세요.' },
    { c: '영상', q: '여러 채널 규격으로 받을 수 있나요?', a: '9:16, 1:1, 16:9 등 필요한 비율로 함께 납품합니다. 업로드 채널을 알려주시면 그에 맞게 편집합니다.' },
    { c: '진행·결제', q: '문의부터 납품까지 얼마나 걸리나요?', a: '촬영 기준 보통 촬영 후 3~7일, 상세페이지는 1~2주 내외입니다. 분량·촬영 포함 여부에 따라 달라지며 급한 일정은 사전 협의합니다.' },
    { c: '진행·결제', q: '견적은 어떻게 받나요?', a: '제품·결과물·일정을 문의 폼이나 전화로 알려주시면 항목별 견적을 정리해 드립니다. 상담은 무료입니다.' },
    { c: '진행·결제', q: '결제는 어떻게 진행되나요?', a: '견적 확정 후 계약금으로 진행을 시작하고, 시안 확인·납품 단계에 맞춰 잔금을 정산하는 방식이 기본입니다. 세금계산서 발행 가능합니다.' },
    { c: '진행·결제', q: '원본 파일도 받을 수 있나요?', a: '네. 보정 완료본과 함께 규격별로 정리해 전달합니다. 촬영 원본(RAW) 제공은 사전 협의해 주세요.' },
    { c: '진행·결제', q: '지방·원거리도 의뢰 가능한가요?', a: '네. 제품 택배 발송으로 전국 의뢰가 가능하며, 현장 촬영이 필요한 경우 출장 일정을 협의합니다.' },
    { c: '용어 설명', q: '누끼컷이란 무엇인가요?', a: '제품만 오려내 배경을 흰색(또는 투명)으로 깔끔하게 처리한 컷입니다. 색·형태·구성품을 정확히 보여줘 상세페이지 정보 전달과 썸네일에 주로 쓰입니다.' },
    { c: '용어 설명', q: '연출컷(무드컷)이란?', a: '소품·배경·조명으로 분위기를 입힌 촬영입니다. 제품의 사용 상황과 감성을 보여줘 ‘갖고 싶다’는 느낌을 만드는 데 효과적입니다.' },
    { c: '용어 설명', q: '디테일컷이란?', a: '소재·질감·기능·마감처럼 가까이서 봐야 할 부분을 클로즈업한 컷입니다. 품질에 대한 신뢰를 높여 구매 결정을 돕습니다.' },
    { c: '용어 설명', q: '라이프스타일 컷이란?', a: '실제 사용 장면을 일상 맥락 속에서 보여주는 컷입니다. 모델·공간·소품과 함께 연출해 브랜드 무드를 전달합니다.' },
    { c: '용어 설명', q: '룩북(look book)이란?', a: '제품·스타일을 화보처럼 모아 보여주는 이미지 모음입니다. 브랜드 톤을 한눈에 전달할 때 사용합니다.' },
    { c: '용어 설명', q: '콘티(스토리보드)란?', a: '촬영 전에 어떤 컷을 어떤 구도·순서로 찍을지 미리 정리한 계획표입니다. 콘티가 정확할수록 촬영이 빨라지고 재촬영이 줄어듭니다.' },
    { c: '용어 설명', q: '보정과 리터칭의 차이는?', a: '보정은 색·밝기·화이트밸런스 등 기본 톤을 맞추는 작업이고, 리터칭은 잡티 제거·합성·형태 보정처럼 더 정교한 후반 작업입니다.' },
    { c: '용어 설명', q: '화이트밸런스(색온도)란?', a: '조명에 따라 달라지는 색감을 실제 색에 맞게 바로잡는 것입니다. 화이트밸런스가 맞아야 제품 색이 화면에서 왜곡 없이 보입니다.' },
    { c: '용어 설명', q: '호리존(무한 배경)이란?', a: '바닥과 벽의 경계가 보이지 않게 이어지는 곡면 배경입니다. 그림자·경계 없이 깔끔한 누끼·연출 촬영에 사용합니다.' },
    { c: '용어 설명', q: '톤앤매너란?', a: '브랜드가 일관되게 유지하는 색감·분위기·스타일의 규칙입니다. 톤앤매너를 정해두면 누가 찍어도 같은 브랜드처럼 보입니다.' },
    { c: '용어 설명', q: 'RAW 파일이란?', a: '카메라 센서 정보를 그대로 담은 원본 파일입니다. 보정 폭이 넓지만 용량이 크고 전용 뷰어가 필요해, 보통 보정 완료본(JPG)으로 납품합니다.' },
    { c: '용어 설명', q: '합성컷이란?', a: '여러 장의 사진을 합쳐 한 장으로 만드는 작업입니다. 한 번에 담기 어려운 구성·배경을 만들 때 사용하며, 작업 강도에 따라 별도 견적입니다.' },
    { c: '촬영', q: '소품·배경은 누가 준비하나요?', a: '기본 소품·배경은 스튜디오 보유 자재로 연출합니다. 특정 소품·브랜드 자재가 필요하면 사전에 협의해 준비합니다.' },
    { c: '촬영', q: '식품(푸드) 촬영도 가능한가요?', a: '네. 신선도·질감을 살리는 푸드 스타일링 기반으로 촬영합니다. 조리·세팅이 필요하면 일정과 준비물을 사전에 안내드립니다.' },
    { c: '촬영', q: '촬영 당일 현장 확인(입회)이 가능한가요?', a: '네. 방문하셔서 컷별로 확인하며 진행할 수 있고, 비대면이면 실시간으로 컷을 공유해 컨펌받습니다.' },
    { c: '촬영', q: '마음에 안 들면 재촬영해 주나요?', a: '촬영 당일 컨펌으로 방향을 맞추기 때문에 재촬영 리스크가 적습니다. 합의된 콘티와 다른 결과인 경우 재촬영을 진행합니다.' },
    { c: '상세페이지', q: '상세페이지 길이는 어느 정도가 좋나요?', a: '제품·카테고리에 따라 다르지만 핵심 강점을 설득하는 데 필요한 만큼이 적당합니다. 너무 길면 이탈이 늘어 구성의 밀도가 더 중요합니다.' },
    { c: '상세페이지', q: 'GIF·움짤도 넣을 수 있나요?', a: '네. 사용 장면·기능 시연을 짧은 GIF로 넣으면 전달력이 올라갑니다. 용량·채널 호환을 고려해 제작합니다.' },
    { c: '영상', q: '숏폼(릴스)과 홍보영상의 차이는?', a: '숏폼은 9:16 세로·짧은 길이로 첫 3초 후킹이 핵심이고, 홍보영상은 브랜드·제품을 충분히 설명하는 구성입니다. 목적에 맞게 제안드립니다.' },
    { c: '영상', q: '사진만으로 영상 제작이 되나요?', a: '네. 보유 이미지에 모션·자막·음악을 더해 모션그래픽 형태의 영상으로 만들 수 있습니다. 촬영 없이도 제작 가능합니다.' },
    { c: '진행·결제', q: '급한 일정(긴급 작업)도 가능한가요?', a: '일정에 여유가 있으면 긴급 진행이 가능합니다. 마감일을 먼저 알려주시면 가능 여부와 조건을 안내드립니다.' },
    { c: '진행·결제', q: '정기(월 단위) 촬영 계약도 되나요?', a: '네. 신제품이 꾸준한 브랜드는 월 단위 정기 촬영으로 운영하면 톤도 일관되고 비용도 효율적입니다. 볼륨에 맞춰 제안드립니다.' }
  ];

  /* ===== 파트너(클라이언트) 로고 — 메인 흐르는 띠 ===== */
  var DEFAULT_PARTNERS = [];
  for (var pi = 1; pi <= 29; pi++) { DEFAULT_PARTNERS.push("assets/partners-hs/hp" + (pi < 10 ? "0" + pi : pi) + ".png"); }

  
  /* ===== 페이지 사진 (관리자 '서비스 사진' 탭) — {key, page, sel, label, value} ===== */
  var DEFAULT_IMGS = [
    { key: "img_ix_card1", page: "index", sel: ".ef-svc .ef-card:nth-child(1) .ef-card__media img", label: "메인 — 서비스카드① 제품·브랜드 촬영", value: "assets/haostudio/hs01.jpg" },
    { key: "img_ix_card2", page: "index", sel: ".ef-svc .ef-card:nth-child(2) .ef-card__media img", label: "메인 — 서비스카드② 상세페이지 디자인", value: "assets/haostudio/hs04.jpg" },
    { key: "img_ix_card3", page: "index", sel: ".ef-svc .ef-card:nth-child(3) .ef-card__media img", label: "메인 — 서비스카드③ 영상·릴스 콘텐츠", value: "assets/haostudio/hs07.jpg" },
    { key: "img_ix_card4", page: "index", sel: ".ef-svc .ef-card:nth-child(4) .ef-card__media img", label: "메인 — 서비스카드④ 인·익스테리어 촬영", value: "assets/haostudio/in05.jpg" },
    { key: "img_st_cover", page: "studio", sel: ".sst-cover > img", label: "스튜디오 소개 — 커버 이미지", value: "assets/haostudio/studio-cover.jpg" },
    { key: "img_photo_intro", page: "photo", sel: ".ssplit__img img", label: "제품촬영 — 소개 이미지", value: "assets/work-hd/thumb/w380.jpg" },
    { key: "img_photo_g1", page: "photo", sel: "#grid .wcard:nth-child(1) img", label: "제품촬영 — 사례1 (오뚜기 제품 촬영)", value: "assets/work-hd/thumb/w380.jpg" },
    { key: "img_photo_g2", page: "photo", sel: "#grid .wcard:nth-child(2) img", label: "제품촬영 — 사례2 (서울우유 제품 촬영)", value: "assets/work-hd/thumb/w379.jpg" },
    { key: "img_photo_g3", page: "photo", sel: "#grid .wcard:nth-child(3) img", label: "제품촬영 — 사례3 (연세유업 제품 촬영)", value: "assets/work-hd/thumb/w378.jpg" },
    { key: "img_photo_g4", page: "photo", sel: "#grid .wcard:nth-child(4) img", label: "제품촬영 — 사례4 (리서쳐스 브랜드 촬영)", value: "assets/work-hd/thumb/w377.jpg" },
    { key: "img_photo_g5", page: "photo", sel: "#grid .wcard:nth-child(5) img", label: "제품촬영 — 사례5 (열정코리아 제품 촬영)", value: "assets/work-hd/thumb/w376.jpg" },
    { key: "img_photo_g6", page: "photo", sel: "#grid .wcard:nth-child(6) img", label: "제품촬영 — 사례6 (비스비바 제품 촬영)", value: "assets/work-hd/thumb/w375.jpg" },
    { key: "img_detailpage_intro", page: "detailpage", sel: ".ssplit__img img", label: "상세페이지 — 소개 이미지", value: "assets/work-hd/thumb/w402.jpg" },
    { key: "img_detailpage_g1", page: "detailpage", sel: "#grid .wcard:nth-child(1) img", label: "상세페이지 — 사례1 (해븐코리아 카탈로그)", value: "assets/work-hd/thumb/w402.jpg" },
    { key: "img_detailpage_g2", page: "detailpage", sel: "#grid .wcard:nth-child(2) img", label: "상세페이지 — 사례2 (KFC 브로슈어)", value: "assets/work-hd/thumb/w399.jpg" },
    { key: "img_detailpage_g3", page: "detailpage", sel: "#grid .wcard:nth-child(3) img", label: "상세페이지 — 사례3 (한우테크 카탈로그)", value: "assets/work-hd/thumb/w390.jpg" },
    { key: "img_detailpage_g4", page: "detailpage", sel: "#grid .wcard:nth-child(4) img", label: "상세페이지 — 사례4 (자이 가이스트 카탈로그)", value: "assets/work-hd/thumb/w362.jpg" },
    { key: "img_detailpage_g5", page: "detailpage", sel: "#grid .wcard:nth-child(5) img", label: "상세페이지 — 사례5 (명지대학교 리플렛)", value: "assets/work-hd/thumb/w404.jpg" },
    { key: "img_detailpage_g6", page: "detailpage", sel: "#grid .wcard:nth-child(6) img", label: "상세페이지 — 사례6 (베이지안웍스 리플렛)", value: "assets/work-hd/thumb/w400.jpg" },
    { key: "img_video_intro", page: "video", sel: ".ssplit__img img", label: "영상콘텐츠 — 소개 이미지", value: "assets/work-hd/thumb/w377.jpg" },
    { key: "img_video_g1", page: "video", sel: "#grid .wcard:nth-child(1) img", label: "영상콘텐츠 — 사례1 (리서쳐스 브랜드 영상)", value: "assets/work-hd/thumb/w377.jpg" },
    { key: "img_video_g2", page: "video", sel: "#grid .wcard:nth-child(2) img", label: "영상콘텐츠 — 사례2 (서울우유 제품 영상)", value: "assets/work-hd/thumb/w379.jpg" },
    { key: "img_video_g3", page: "video", sel: "#grid .wcard:nth-child(3) img", label: "영상콘텐츠 — 사례3 (제스트업 숏폼)", value: "assets/work-hd/thumb/w385.jpg" },
    { key: "img_video_g4", page: "video", sel: "#grid .wcard:nth-child(4) img", label: "영상콘텐츠 — 사례4 (노원구 홍보 영상)", value: "assets/work-hd/thumb/w391.jpg" },
    { key: "img_video_g5", page: "video", sel: "#grid .wcard:nth-child(5) img", label: "영상콘텐츠 — 사례5 (신한라이프 광고 소재)", value: "assets/work-hd/thumb/w401.jpg" },
    { key: "img_video_g6", page: "video", sel: "#grid .wcard:nth-child(6) img", label: "영상콘텐츠 — 사례6 (이화여대 브랜드 필름)", value: "assets/work-hd/thumb/w312.jpg" },
    { key: "img_interior_intro", page: "interior", sel: ".ssplit__img img", label: "인·익스테리어 — 소개 이미지", value: "assets/haostudio/inf05.jpg" },
    { key: "img_interior_g1", page: "interior", sel: "#grid .wcard:nth-child(1) img", label: "인·익스테리어 — 사례1 (BBRICK 카페 인테리어)", value: "assets/haostudio/in05.jpg" },
    { key: "img_interior_g2", page: "interior", sel: "#grid .wcard:nth-child(2) img", label: "인·익스테리어 — 사례2 (1982웨이홈 카페)", value: "assets/haostudio/in06.jpg" },
    { key: "img_interior_g3", page: "interior", sel: "#grid .wcard:nth-child(3) img", label: "인·익스테리어 — 사례3 (HAVEN 카페 인테리어)", value: "assets/haostudio/in02.jpg" },
    { key: "img_interior_g4", page: "interior", sel: "#grid .wcard:nth-child(4) img", label: "인·익스테리어 — 사례4 (GIVENING COFFEE 익스테리어)", value: "assets/haostudio/in03.jpg" },
    { key: "img_interior_g5", page: "interior", sel: "#grid .wcard:nth-child(5) img", label: "인·익스테리어 — 사례5 (424오마카세 인테리어)", value: "assets/haostudio/in07.jpg" },
    { key: "img_interior_g6", page: "interior", sel: "#grid .wcard:nth-child(6) img", label: "인·익스테리어 — 사례6 (사이사 라운지)", value: "assets/haostudio/in08.jpg" },
    { key: "img_interior_g7", page: "interior", sel: "#grid .wcard:nth-child(7) img", label: "인·익스테리어 — 사례7 (FROG 테라스)", value: "assets/haostudio/in04.jpg" },
    { key: "img_interior_g8", page: "interior", sel: "#grid .wcard:nth-child(8) img", label: "인·익스테리어 — 사례8 (파라스파라 호텔 다이닝)", value: "assets/haostudio/in01.jpg" }
  ];

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
    siteUrl: "https://leegunhee010.github.io/haod-new", /* TEMP: haoc 도메인 연결 시 교체 */
    ogImage: "assets/haostudio/hs01.jpg",
    pages: {
      index: {
        title: "스튜디오센터 | 하오커뮤니케이션 — 제품 촬영·상세페이지·콘텐츠 제작",
        desc: "하오커뮤니케이션 스튜디오센터. 제품·브랜드 촬영부터 상세페이지 디자인, 영상 콘텐츠, 보정·리터칭까지 — 브랜드에 필요한 모든 비주얼을 하나의 크리에이티브 시스템으로 설계합니다.",
        keywords: "제품촬영, 상세페이지제작, 누끼촬영, 제품사진, 브랜드촬영, 영상콘텐츠, 릴스제작, 하오커뮤니케이션 스튜디오" },
      studio: {
        title: "스튜디오 소개 | 스튜디오센터 — 하오커뮤니케이션",
        desc: "하오커뮤니케이션 스튜디오는 촬영·영상·디자인·AI 디렉션까지, 콘텐츠로 브랜드를 완성하는 전문 스튜디오입니다.",
        keywords: "하오커뮤니케이션 스튜디오, 콘텐츠스튜디오, 제품촬영스튜디오, 광진구 스튜디오, 촬영스튜디오" },
      photo: {
        title: "제품·브랜드 촬영 | 스튜디오센터 — 하오커뮤니케이션",
        desc: "제품·브랜드 촬영 서비스. 스튜디오 촬영부터 현장·연출컷, 누끼·디테일컷까지 채널에 바로 쓰는 비주얼을 제작합니다.",
        keywords: "제품촬영, 브랜드촬영, 누끼촬영, 연출컷, 푸드촬영, 제품사진" },
      detailpage: {
        title: "상세페이지 제작 | 스튜디오센터 — 하오커뮤니케이션",
        desc: "전환을 만드는 상세페이지 기획·디자인. 후킹·문제제기·증거·구매유도까지 팔리는 흐름으로 설계하고 촬영·편집을 한 번에 진행합니다.",
        keywords: "상세페이지제작, 상세페이지디자인, 스마트스토어상세, 커머스디자인, 제품상세페이지" },
      video: {
        title: "영상·릴스 콘텐츠 | 스튜디오센터 — 하오커뮤니케이션",
        desc: "제품 영상부터 릴스·숏폼, 브랜드 필름까지. 채널에 맞는 길이와 톤으로 기획·촬영·편집을 한 번에 제작합니다.",
        keywords: "영상제작, 릴스제작, 숏폼제작, 제품영상, 브랜드필름, 영상콘텐츠" },
      portfolio: {
        title: "포트폴리오 | 스튜디오센터 — 하오커뮤니케이션",
        desc: "하오커뮤니케이션 스튜디오 제품·음식·뷰티·건강식품 촬영 포트폴리오. 실제 진행한 촬영 작업을 카테고리별로 확인하세요.",
        keywords: "촬영포트폴리오, 제품촬영사례, 상세페이지포트폴리오, 하오커뮤니케이션 스튜디오 작업" },
      column: {
        title: "칼럼 | 스튜디오센터 — 하오커뮤니케이션",
        desc: "제품 촬영·상세페이지·영상 콘텐츠 실무 노하우. 더 잘 팔리는 비주얼을 만드는 하오커뮤니케이션 스튜디오센터 칼럼.",
        keywords: "촬영노하우, 상세페이지팁, 제품사진 잘 찍는 법, 커머스 비주얼, 콘텐츠 칼럼" },
      qna: {
        title: "Q&A | 스튜디오센터 — 하오커뮤니케이션",
        desc: "제품 촬영·상세페이지·영상 콘텐츠 자주 하는 질문. 촬영·상세페이지·영상·진행/결제 카테고리별 Q&A.",
        keywords: "촬영문의, 촬영비용, 상세페이지문의, 누끼컷, 촬영 자주하는질문" }
    }
  };

  /* ===== 사이트 카피 (관리자 '카피 수정' 탭) =====
     page: 적용 페이지 / sel: 대상 선택자 / tag: **강조** 변환 태그(em·b) / attr: 속성 적용 / list+item: 목록 */

  /* ===== 고객 후기 (메인 Experience a change 슬라이더) — 관리자에서 수정 ===== */
  var DEFAULT_REVIEWS = [
    { b: '풍경식혜', from: '전통음료', img: 'hs13.jpg', q: '제품의 **건강한 이미지**를 그대로 담아주셨어요.', body: '식혜 본연의 정갈한 느낌을 살리면서도 식욕을 자극하는 연출이 인상적이었습니다. 원물 소품까지 세심하게 신경 써주셔서 결과물 만족도가 높았어요.' },
    { b: '인천디자인고등학교', from: '전시·공간', img: 'hs14.jpg', q: '작품 하나하나를 **돋보이게** 기록해 주셨습니다.', body: '전시 공간과 작품의 분위기를 그대로 담아주셔서 도록과 홍보물에 두루 활용하고 있습니다. 조명과 구도까지 전문가의 손길이 느껴졌어요.' },
    { b: '이루웰', from: '건강식품', img: 'hs15.jpg', q: '판매율로 이어지는 **콘텐츠 아이디어**를 많이 얻어갑니다.', body: '화려하기만 한 게 아니라 셀링 포인트에 맞춰 콘텐츠를 제안해 주셔서 좋았습니다. 시장 조사와 제품 연구로 기획을 새롭게 해주십니다.' },
    { b: '제이케이앤컴퍼니', from: '간편식', img: 'hs16.jpg', q: '최종 연출컷 퀄리티가 **만족스럽습니다!**', body: '촬영 전 컨셉에 맞춰 레퍼런스·소품도 제안해주고 의견도 잘 반영해주셨어요. 빠듯한 일정에도 따뜻한 음식 비주얼을 끝까지 책임져 주셨습니다.' },
    { b: '원에이', from: '뷰티·생활', img: 'hs17.jpg', q: '디자인 이상의 **기획과 촬영**을 만들어 줍니다.', body: '기획 단계부터 브랜드의 많은 부분을 함께 정리해 주십니다. 일상 속 제품이 감각적으로 보이도록 연출해 주셔서 만족스러웠습니다.' },
    { b: '광동생활건강', from: '건강식품', img: 'hs18.jpg', q: '판매될 수밖에 없는 **상세페이지**, 여기로 정착합니다!', body: '대형 브랜드 기준에 맞춰 완성도 높은 결과물을 제안해 주셨습니다. 고객 시선을 잡는 셀링 포인트 디자인은 정말 감탄이 나옵니다.' }
  ];

  var DEFAULT_COPY = [
    /* ───── 메인 ───── */
    { key: "sys_title", page: "index", sel: ".ef-sys__title", tag: "b", label: "서비스시스템 — 영문 제목", value: "A complete commerce\nvisual system" },
    { key: "sys_sub", page: "index", sel: ".ef-sys__sub", tag: "b", label: "서비스시스템 — 설명", value: "하오커뮤니케이션 스튜디오센터는 제품촬영, 푸드촬영, 브랜드촬영부터\n상세페이지 제작, 영상·릴스 콘텐츠까지 함께 진행하는 커머스 콘텐츠 스튜디오입니다." },
    { key: "card1_t", page: "index", sel: ".ef-card:nth-child(1) .ef-card__t", tag: "b", label: "서비스카드① 제목", value: "제품·브랜드 촬영" },
    { key: "card1_d", page: "index", sel: ".ef-card:nth-child(1) .ef-card__d", tag: "b", label: "서비스카드① 설명", value: "브랜드의 무드와 가치를 담아 차별화된 비주얼로 표현" },
    { key: "card2_t", page: "index", sel: ".ef-card:nth-child(2) .ef-card__t", tag: "b", label: "서비스카드② 제목", value: "상세페이지 디자인" },
    { key: "card2_d", page: "index", sel: ".ef-card:nth-child(2) .ef-card__d", tag: "b", label: "서비스카드② 설명", value: "소비자 경험과 구매 흐름을 설계하는 성과 중심 커머스 디자인" },
    { key: "card3_t", page: "index", sel: ".ef-card:nth-child(3) .ef-card__t", tag: "b", label: "서비스카드③ 제목", value: "영상·릴스 콘텐츠" },
    { key: "card3_d", page: "index", sel: ".ef-card:nth-child(3) .ef-card__d", tag: "b", label: "서비스카드③ 설명", value: "브랜드 메시지를 감각적으로 담아낸 완성도 높은 영상 콘텐츠" },
    { key: "card4_t", page: "index", sel: ".ef-card:nth-child(4) .ef-card__t", tag: "b", label: "서비스카드④ 제목", value: "인·익스테리어 촬영" },
    { key: "card4_d", page: "index", sel: ".ef-card:nth-child(4) .ef-card__d", tag: "b", label: "서비스카드④ 설명", value: "공간의 첫인상을 더 돋보이게 만드는\n감각적인 공간 전문 촬영" },
    { key: "folio_title", page: "index", sel: ".np-folio__title", tag: "em", label: "포트폴리오 — 제목", value: "다양한 **제품·브랜드 촬영**이 가능한\n전문 콘텐츠 스튜디오입니다." },
    { key: "review_title", page: "index", sel: ".ef-rev-head h2", tag: "b", label: "리뷰 — 제목", value: "Experience a change" },
    { key: "review_desc", page: "index", sel: ".ef-rev-head p", tag: "b", label: "리뷰 — 설명", value: "눈에 보이는 결과물의 차이, 판매율의 변화를 경험하셨기 때문에\n하오커뮤니케이션 스튜디오를 다녀간 많은 담당자분들이 꾸준히 다시 찾아주십니다." },
    { key: "slogan_eng", page: "index", sel: ".ef-slogan__eng", tag: "em", label: "슬로건 — 영문", value: "More than expected,\nalways makes the **best effect**" },
    { key: "slogan_sub", page: "index", sel: ".ef-slogan__sub", tag: "b", label: "슬로건 — 설명", value: "하오커뮤니케이션 스튜디오는 언제나 기대를 넘어, 브랜드의 고객까지 만족하는 최고의 결과물을 만듭니다." },
    { key: "stat1_n", page: "index", sel: ".ef-stat:nth-child(1) strong", attr: "data-to", label: "지표① 숫자", value: "1603" },
    { key: "stat1_t", page: "index", sel: ".ef-stat:nth-child(1) em", tag: "b", label: "지표① 이름", value: "완료 프로젝트" },
    { key: "stat2_n", page: "index", sel: ".ef-stat:nth-child(2) strong", attr: "data-to", label: "지표② 숫자", value: "1203" },
    { key: "stat2_t", page: "index", sel: ".ef-stat:nth-child(2) em", tag: "b", label: "지표② 이름", value: "함께한 브랜드" },
    { key: "stat3_n", page: "index", sel: ".ef-stat:nth-child(3) strong", attr: "data-to", label: "지표③ 숫자", value: "111360" },
    { key: "stat3_t", page: "index", sel: ".ef-stat:nth-child(3) em", tag: "b", label: "지표③ 이름", value: "누적 촬영 컷" },
    { key: "stat4_n", page: "index", sel: ".ef-stat:nth-child(4) strong", attr: "data-to", label: "지표④ 숫자", value: "98" },
    { key: "stat4_t", page: "index", sel: ".ef-stat:nth-child(4) em", tag: "b", label: "지표④ 이름", value: "재의뢰·만족도 (%)" },
    { key: "partners_title", page: "index", sel: ".partners__head h2", tag: "b", label: "파트너 — 제목", value: "하오커뮤니케이션 스튜디오와 함께한 브랜드" },
    { key: "proc_title_i", page: "index", sel: ".process__head h2", tag: "b", label: "진행과정 — 제목", value: "진행 과정" },
    { key: "pst1_h", page: "index", sel: ".tstep:nth-child(2) h3", tag: "b", label: "진행과정① 제목", value: "문의 · 상담" },
    { key: "pst1_p", page: "index", sel: ".tstep:nth-child(2) p", tag: "b", label: "진행과정① 설명", value: "촬영 종류·컷 수·일정을 알려주시면 빠르게 상담해 드립니다." },
    { key: "pst2_h", page: "index", sel: ".tstep:nth-child(3) h3", tag: "b", label: "진행과정② 제목", value: "견적 · 일정" },
    { key: "pst2_p", page: "index", sel: ".tstep:nth-child(3) p", tag: "b", label: "진행과정② 설명", value: "요구사항에 맞춰 합리적인 견적과 촬영 일정을 확정합니다." },
    { key: "pst3_h", page: "index", sel: ".tstep:nth-child(4) h3", tag: "b", label: "진행과정③ 제목", value: "콘티 · 연출" },
    { key: "pst3_p", page: "index", sel: ".tstep:nth-child(4) p", tag: "b", label: "진행과정③ 설명", value: "레퍼런스로 무드와 컷 리스트를 설계해 방향을 맞춥니다." },
    { key: "pst4_h", page: "index", sel: ".tstep:nth-child(5) h3", tag: "b", label: "진행과정④ 제목", value: "촬영 · 컨펌" },
    { key: "pst4_p", page: "index", sel: ".tstep:nth-child(5) p", tag: "b", label: "진행과정④ 설명", value: "스튜디오·현장에서 컷별 컨펌을 받으며 촬영합니다." },
    { key: "pst5_h", page: "index", sel: ".tstep:nth-child(6) h3", tag: "b", label: "진행과정⑤ 제목", value: "보정 · 납품" },
    { key: "pst5_p", page: "index", sel: ".tstep:nth-child(6) p", tag: "b", label: "진행과정⑤ 설명", value: "누끼·색보정·리터칭 후 규격별로 정리해 납품합니다." },
    { key: "footer_tag", page: "all", sel: ".footer__top p", tag: "b", label: "푸터 소개 문구", value: "하오커뮤니케이션 스튜디오센터\n제품 촬영 · 상세페이지 · 영상 콘텐츠 제작" },

    /* ───── 스튜디오 소개 ───── */
    { key: "ab_cover_t", page: "studio", sel: ".sst-cover__t", tag: "b", label: "커버 제목", value: "스튜디오 소개" },
    { key: "ab_intro_h", page: "studio", sel: ".sst-intro__h", tag: "b", label: "인트로 제목", value: "제품·푸드·뷰티까지,\n**콘텐츠로 브랜드를 완성**하는\n전문 스튜디오" },
    { key: "ab_intro_p1", page: "studio", sel: ".sst-intro__p p:nth-child(1)", tag: "b", label: "인트로 1문단", value: "하루에도 수만 개의 콘텐츠가 탄생하고 사라지는 미디어 시장, 그 화려함 속에서 우리는 **'고객만족'이라는 본질**에 집중했습니다." },
    { key: "ab_intro_p2", page: "studio", sel: ".sst-intro__p p:nth-child(2)", tag: "b", label: "인트로 2문단", value: "하오커뮤니케이션 스튜디오는 촬영·영상·디자인·AI 디렉션까지 한 팀이 함께 움직입니다. 고객이 눈으로 확인하고 피부로 느끼는 진정한 만족, 그 기준을 채우기 위해 잘하는 사람들이 모였습니다." },
    { key: "ab_intro_p3", page: "studio", sel: ".sst-intro__p p:nth-child(3)", tag: "b", label: "인트로 3문단", value: "잘하니까, 좋아하니까 — 그래서 HAO. 소통의 가치를 생각하며 브랜드의 한 컷을 끝까지 책임집니다." },
    { key: "ab_slogan_eng", page: "studio", sel: ".ef-slogan__eng", tag: "em", label: "슬로건 — 영문", value: "잘하니까, 좋아하니까\n그래서 **HAO**하다" },
    { key: "ab_slogan_sub", page: "studio", sel: ".ef-slogan__sub", tag: "b", label: "슬로건 — 설명", value: "Photography · Video · Design · AI Direction — 콘텐츠의 모든 과정을 한 팀이 함께합니다." },
    { key: "ab_st1_n", page: "studio", sel: ".ef-stat:nth-child(1) strong", attr: "data-to", label: "지표① 숫자", value: "1203" },
    { key: "ab_st1_t", page: "studio", sel: ".ef-stat:nth-child(1) em", tag: "b", label: "지표① 이름", value: "함께한 클라이언트" },
    { key: "ab_st2_n", page: "studio", sel: ".ef-stat:nth-child(2) strong", attr: "data-to", label: "지표② 숫자", value: "1603" },
    { key: "ab_st2_t", page: "studio", sel: ".ef-stat:nth-child(2) em", tag: "b", label: "지표② 이름", value: "완료 프로젝트" },
    { key: "ab_st3_n", page: "studio", sel: ".ef-stat:nth-child(3) strong", attr: "data-to", label: "지표③ 숫자", value: "111360" },
    { key: "ab_st3_t", page: "studio", sel: ".ef-stat:nth-child(3) em", tag: "b", label: "지표③ 이름", value: "누적 촬영 컷" },
    { key: "ab_st4_n", page: "studio", sel: ".ef-stat:nth-child(4) strong", attr: "data-to", label: "지표④ 숫자", value: "4" },
    { key: "ab_st4_t", page: "studio", sel: ".ef-stat:nth-child(4) em", tag: "b", label: "지표④ 이름", value: "전문 제작 부문" },

    /* ───── 제품 촬영 (photo) ───── */
    { key: "ph_title", page: "photo", sel: ".subhero__title", tag: "b", label: "상단 제목", value: "제품·브랜드 촬영" },
    { key: "ph_desc", page: "photo", sel: ".subhero__desc", tag: "b", label: "상단 설명", value: "스튜디오 촬영부터 현장 연출컷, 누끼·디테일컷까지 — 채널에 바로 쓰는 비주얼을 만듭니다." },
    { key: "ph_split_h", page: "photo", sel: ".ssplit__text h3", tag: "b", label: "소개 제목", value: "제품이 가장 좋아 보이는\n그 한 컷을 찾습니다" },
    { key: "ph_split_p", page: "photo", sel: ".ssplit__text p", tag: "b", label: "소개 설명", value: "같은 제품이라도 빛과 각도, 배경 톤에 따라 인상이 완전히 달라집니다. 하오커뮤니케이션 스튜디오는 브랜드 무드를 먼저 정의하고, 그 톤 안에서 가장 설득력 있는 컷을 설계해 촬영합니다." },
    { key: "ph_li1", page: "photo", sel: ".ssplit__list li:nth-child(1)", tag: "b", label: "포인트①", value: "배경·소품·조명까지 브랜드 톤에 맞춘 연출" },
    { key: "ph_li2", page: "photo", sel: ".ssplit__list li:nth-child(2)", tag: "b", label: "포인트②", value: "웹·인쇄·SNS 규격을 고려한 컷 구성" },
    { key: "ph_li3", page: "photo", sel: ".ssplit__list li:nth-child(3)", tag: "b", label: "포인트③", value: "촬영 당일 컨펌으로 재촬영 리스크 최소화" },
    { key: "ph_li4", page: "photo", sel: ".ssplit__list li:nth-child(4)", tag: "b", label: "포인트④", value: "누끼·색보정·디테일컷 보정 일괄 진행" },
    { key: "ph_contact_t", page: "photo", sel: ".contact__title", tag: "b", label: "문의 — 제목", value: "촬영, 어떤 결과물이\n필요하신가요?" },
    { key: "ph_contact_d", page: "photo", sel: ".contact__desc", tag: "b", label: "문의 — 설명", value: "제품·예산·일정만 알려주시면\n가능 범위와 견적을 빠르게 안내드립니다." },

    /* ───── 인·익스테리어 (interior) ───── */
    { key: "in_title", page: "interior", sel: ".subhero__title", tag: "b", label: "상단 제목", value: "인·익스테리어 촬영" },
    { key: "in_desc", page: "interior", sel: ".subhero__desc", tag: "b", label: "상단 설명", value: "공간의 첫인상을 더 돋보이게 만드는 감각적인 공간 전문 촬영 — 카페·레스토랑·호텔·매장의 무드를 사진에 담습니다." },
    { key: "in_split_h", page: "interior", sel: ".ssplit__text h3", tag: "b", label: "소개 제목", value: "공간이 가진 무드를\n있는 그대로 담습니다" },
    { key: "in_split_p", page: "interior", sel: ".ssplit__text p", tag: "b", label: "소개 설명", value: "같은 공간도 빛의 방향과 시간대, 화각에 따라 전혀 다른 인상이 됩니다. 하오커뮤니케이션 스튜디오는 공간의 콘셉트를 먼저 읽고, 자연광과 조명이 가장 좋은 순간을 잡아 손님이 방문하고 싶어지는 한 컷을 만듭니다." },
    { key: "in_li1", page: "interior", sel: ".ssplit__list li:nth-child(1)", tag: "b", label: "포인트①", value: "자연광·조명을 고려한 촬영 시간대 설계" },
    { key: "in_li2", page: "interior", sel: ".ssplit__list li:nth-child(2)", tag: "b", label: "포인트②", value: "전경 광각부터 소품 디테일까지 컷 구성" },
    { key: "in_li3", page: "interior", sel: ".ssplit__list li:nth-child(3)", tag: "b", label: "포인트③", value: "간판·파사드가 살아나는 익스테리어 촬영" },
    { key: "in_li4", page: "interior", sel: ".ssplit__list li:nth-child(4)", tag: "b", label: "포인트④", value: "플레이스·배달앱·홈페이지 규격 맞춤 납품" },
    { key: "in_contact_t", page: "interior", sel: ".contact__title", tag: "b", label: "문의 — 제목", value: "우리 매장, 어떻게\n보여드릴까요?" },
    { key: "in_contact_d", page: "interior", sel: ".contact__desc", tag: "b", label: "문의 — 설명", value: "공간 위치·규모·용도만 알려주시면\n가능 범위와 견적을 빠르게 안내드립니다." },
    { key: "st_interior_01", page: "interior", sel: "#top > section:nth-of-type(3) > p", tag: "b", label: "SCOPE", value: "SCOPE" },
    { key: "st_interior_02", page: "interior", sel: "#top > section:nth-of-type(3) > h2", tag: "b", label: "촬영 분야", value: "촬영 분야" },
    { key: "st_interior_03", page: "interior", sel: "#top > section:nth-of-type(4) > p", tag: "b", label: "WORK", value: "WORK" },
    { key: "st_interior_04", page: "interior", sel: "#top > section:nth-of-type(4) > h2", tag: "b", label: "공간 촬영 사례", value: "공간 촬영 사례" },
    { key: "st_interior_05", page: "interior", sel: "#top > section:nth-of-type(5) > p", tag: "b", label: "PROCESS", value: "PROCESS" },
    { key: "st_interior_06", page: "interior", sel: "#top > section:nth-of-type(5) > h2", tag: "b", label: "촬영 진행 과정", value: "촬영 진행 과정" },
    { key: "st_interior_07", page: "interior", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(1) > h3", tag: "b", label: "과정① 제목", value: "상담·견적" },
    { key: "st_interior_08", page: "interior", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(1) > p", tag: "b", label: "과정① 설명", value: "공간 규모·컷 수·용도 확인 후 견적을 안내합니다." },
    { key: "st_interior_09", page: "interior", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(2) > h3", tag: "b", label: "과정② 제목", value: "답사·콘티" },
    { key: "st_interior_10", page: "interior", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(2) > p", tag: "b", label: "과정② 설명", value: "사진·로드뷰로 공간을 파악하고 시간대·컷 리스트를 확정합니다." },
    { key: "st_interior_11", page: "interior", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(3) > h3", tag: "b", label: "과정③ 제목", value: "현장 촬영" },
    { key: "st_interior_12", page: "interior", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(3) > p", tag: "b", label: "과정③ 설명", value: "빛이 가장 좋은 시간대에 전경부터 디테일까지 촬영합니다." },
    { key: "st_interior_13", page: "interior", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(4) > h3", tag: "b", label: "과정④ 제목", value: "보정" },
    { key: "st_interior_14", page: "interior", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(4) > p", tag: "b", label: "과정④ 설명", value: "수평·왜곡·색보정으로 공간의 톤을 완성합니다." },
    { key: "st_interior_15", page: "interior", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(5) > h3", tag: "b", label: "과정⑤ 제목", value: "납품" },
    { key: "st_interior_16", page: "interior", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(5) > p", tag: "b", label: "과정⑤ 설명", value: "채널 규격별로 정리해 원본과 함께 전달합니다." },
    { key: "st_interior_17", page: "interior", sel: "#top > section:nth-of-type(6) > p", tag: "b", label: "FAQ", value: "FAQ" },
    { key: "st_interior_18", page: "interior", sel: "#top > section:nth-of-type(6) > h2", tag: "b", label: "자주 하는 질문", value: "자주 하는 질문" },
    { key: "st_interior_19", page: "interior", sel: "#top > section:nth-of-type(6) > div > details:nth-of-type(1) > div > p", tag: "b", label: "FAQ① 답변 (촬영 시간)", value: "공간 규모와 컷 수에 따라 다르지만 일반 매장 기준 2~4시간 내외입니다. 인테리어와 익스테리어를 함께 촬영하면 빛이 좋은 시간대에 맞춰 일정을 설계합니다." },
    { key: "st_interior_20", page: "interior", sel: "#top > section:nth-of-type(6) > div > details:nth-of-type(2) > div > p", tag: "b", label: "FAQ② 답변 (영업 중 촬영)", value: "가능합니다. 다만 손님이 없는 오픈 전·마감 후 촬영이 공간 연출과 동선 확보에 유리해, 보통 영업 외 시간대를 권장드립니다." },
    { key: "st_interior_21", page: "interior", sel: "#top > section:nth-of-type(6) > div > details:nth-of-type(3) > div > p", tag: "b", label: "FAQ③ 답변 (외관 시간대)", value: "파사드·간판은 자연광과 조명이 균형을 이루는 시간대(이른 오전, 해질 무렵)가 가장 좋습니다. 사전 답사 또는 로드뷰 확인 후 최적 시간대를 제안드립니다." },
    { key: "st_interior_22", page: "interior", sel: "#top > section:nth-of-type(6) > div > details:nth-of-type(4) > div > p", tag: "b", label: "FAQ④ 답변 (보정 포함)", value: "네. 수평·왜곡 보정, 색보정, 불필요한 요소 정리까지 기본 포함입니다. 플레이스·배달앱·홈페이지 등 채널 규격에 맞춰 리사이즈 납품도 가능합니다." },
    { key: "st_interior_23", page: "interior", sel: "#contact > div > div > p:nth-of-type(1)", tag: "b", label: "STUDIO INQUIRY", value: "STUDIO INQUIRY" },
    { key: "st_interior_24", page: "interior", sel: "footer > div:nth-of-type(2) > div:nth-of-type(1) > h3", tag: "b", label: "푸터 — Contact", value: "Contact" },
    { key: "st_interior_25", page: "interior", sel: "footer > div:nth-of-type(2) > div:nth-of-type(2) > h3", tag: "b", label: "푸터 — 센터", value: "센터" },
    { key: "st_interior_26", page: "interior", sel: "footer > div:nth-of-type(2) > div:nth-of-type(3) > h3", tag: "b", label: "푸터 — 스튜디오센터", value: "스튜디오센터" },

    /* ───── 상세페이지 (detailpage) ───── */
    { key: "dp_title", page: "detailpage", sel: ".subhero__title", tag: "b", label: "상단 제목", value: "상세페이지 제작" },
    { key: "dp_desc", page: "detailpage", sel: ".subhero__desc", tag: "b", label: "상단 설명", value: "읽다 보면 사고 싶어지는 흐름으로 — 기획·촬영·디자인을 한 팀이 끝까지 진행합니다." },
    { key: "dp_split_h", page: "detailpage", sel: ".ssplit__text h3", tag: "b", label: "소개 제목", value: "예쁜 페이지가 아니라\n팔리는 페이지를 만듭니다" },
    { key: "dp_split_p", page: "detailpage", sel: ".ssplit__text p", tag: "b", label: "소개 설명", value: "상세페이지는 디자인이 아니라 설득입니다. 고객이 가진 의심을 순서대로 풀어주는 흐름을 먼저 설계하고, 그 위에 촬영컷과 카피, 디자인을 얹습니다." },
    { key: "dp_li1", page: "detailpage", sel: ".ssplit__list li:nth-child(1)", tag: "b", label: "포인트①", value: "후킹 → 문제제기 → 해결 → 증거 → 구매유도 흐름 설계" },
    { key: "dp_li2", page: "detailpage", sel: ".ssplit__list li:nth-child(2)", tag: "b", label: "포인트②", value: "촬영·누끼·도식·아이콘까지 한 번에 제작" },
    { key: "dp_li3", page: "detailpage", sel: ".ssplit__list li:nth-child(3)", tag: "b", label: "포인트③", value: "모바일 우선 레이아웃과 가독성 최적화" },
    { key: "dp_li4", page: "detailpage", sel: ".ssplit__list li:nth-child(4)", tag: "b", label: "포인트④", value: "스마트스토어·자사몰·오픈마켓 규격 대응" },
    { key: "dp_contact_t", page: "detailpage", sel: ".contact__title", tag: "b", label: "문의 — 제목", value: "촬영, 어떤 결과물이\n필요하신가요?" },
    { key: "dp_contact_d", page: "detailpage", sel: ".contact__desc", tag: "b", label: "문의 — 설명", value: "제품·예산·일정만 알려주시면\n가능 범위와 견적을 빠르게 안내드립니다." },

    /* ───── 영상 (video) ───── */
    { key: "vd_title", page: "video", sel: ".subhero__title", tag: "b", label: "상단 제목", value: "영상·릴스 콘텐츠" },
    { key: "vd_desc", page: "video", sel: ".subhero__desc", tag: "b", label: "상단 설명", value: "제품 영상부터 릴스·숏폼, 브랜드 필름까지 — 채널에 맞는 길이와 톤으로 만듭니다." },
    { key: "vd_split_h", page: "video", sel: ".ssplit__text h3", tag: "b", label: "소개 제목", value: "3초 안에 멈추게,\n끝까지 보게 만듭니다" },
    { key: "vd_split_p", page: "video", sel: ".ssplit__text p", tag: "b", label: "소개 설명", value: "숏폼은 길이가 짧은 만큼 첫 장면과 편집 리듬이 전부입니다. 채널 알고리즘과 시청 패턴을 고려해 후킹·전개·마무리를 설계하고, 촬영부터 편집·자막까지 한 번에 진행합니다." },
    { key: "vd_li1", page: "video", sel: ".ssplit__list li:nth-child(1)", tag: "b", label: "포인트①", value: "릴스·쇼츠·틱톡 세로형 숏폼 제작" },
    { key: "vd_li2", page: "video", sel: ".ssplit__list li:nth-child(2)", tag: "b", label: "포인트②", value: "제품 사용·언박싱·비교 영상 기획·촬영" },
    { key: "vd_li3", page: "video", sel: ".ssplit__list li:nth-child(3)", tag: "b", label: "포인트③", value: "자막·모션그래픽·BGM까지 편집 일괄" },
    { key: "vd_li4", page: "video", sel: ".ssplit__list li:nth-child(4)", tag: "b", label: "포인트④", value: "채널별 규격(9:16 / 1:1 / 16:9) 동시 납품" },
    { key: "vd_contact_t", page: "video", sel: ".contact__title", tag: "b", label: "문의 — 제목", value: "촬영, 어떤 결과물이\n필요하신가요?" },
    { key: "vd_contact_d", page: "video", sel: ".contact__desc", tag: "b", label: "문의 — 설명", value: "제품·예산·일정만 알려주시면\n가능 범위와 견적을 빠르게 안내드립니다." },

    /* ───── 포트폴리오 ───── */
    { key: "po_title", page: "portfolio", sel: ".subhero__title", tag: "b", label: "상단 제목", value: "포트폴리오" },
    { key: "po_desc", page: "portfolio", sel: ".subhero__desc", tag: "b", label: "상단 설명", value: "하오커뮤니케이션 스튜디오가 실제 진행한 촬영·상세페이지 작업입니다. 클릭하면 크게 볼 수 있어요." },

    /* ───── 칼럼 ───── */
    { key: "col_title", page: "column", sel: "#listView .subhero__title", tag: "b", label: "상단 제목", value: "Column" },
    { key: "col_desc", page: "column", sel: "#listView .subhero__desc", tag: "b", label: "상단 설명", value: "촬영·상세페이지·콘텐츠, 더 잘 팔리는 비주얼을 만드는 실무 이야기를 전합니다." },

    /* ───── Q&A ───── */
    { key: "qna_title", page: "qna", sel: ".subhero__title", tag: "b", label: "상단 제목", value: "자주 하는 질문" },
    { key: "qna_ptitle", page: "qna", sel: ".page__title", tag: "b", label: "섹션 제목", value: "무엇이 궁금하신가요" },
    { key: "st_index_01", page: "index", sel: "#hero > div:nth-of-type(3) > div:nth-of-type(1) > .ef-hero__title", tag: "em", label: "브랜드를 더 브랜드답게,다양한 컨셉의 촬영", value: "브랜드를 더 브랜드답게,\n다양한 컨셉의 **촬영**" },
    { key: "st_index_02", page: "index", sel: "#hero > div:nth-of-type(3) > div:nth-of-type(2) > p", tag: "b", label: "Capturing Mood, Creating", value: "Capturing Mood, Creating Distinctive Visuals" },
    { key: "st_index_03", page: "index", sel: "#hero > div:nth-of-type(3) > div:nth-of-type(2) > h2", tag: "em", label: "브랜드 무드를 깊이 담아차별화된 비주얼 촬영", value: "브랜드 무드를 깊이 담아\n**차별화된** 비주얼 촬영" },
    { key: "st_index_04", page: "index", sel: "#hero > div:nth-of-type(3) > div:nth-of-type(3) > p", tag: "b", label: "Building Brands Into Mar", value: "Building Brands Into Market Leaders" },
    { key: "st_index_05", page: "index", sel: "#hero > div:nth-of-type(3) > div:nth-of-type(3) > h2", tag: "em", label: "브랜드의 가치를 높이는성과 중심 커머스 디자", value: "브랜드의 가치를 높이는\n**성과 중심** 커머스 디자인" },
    { key: "st_index_06", page: "index", sel: "#work > div:nth-of-type(1) > p", tag: "b", label: "PORTFOLIO", value: "PORTFOLIO" },
    { key: "st_index_07", page: "index", sel: "#top > section:nth-of-type(6) > div:nth-of-type(1) > p", tag: "b", label: "CLIENTS", value: "CLIENTS" },
    { key: "st_index_08", page: "index", sel: "#processWrap > div > div > div:nth-of-type(1) > p", tag: "b", label: "HOW IT WORKS", value: "HOW IT WORKS" },
    { key: "st_index_09", page: "index", sel: "#contact > div > div > p:nth-of-type(1)", tag: "b", label: "STUDIO INQUIRY", value: "STUDIO INQUIRY" },
    { key: "st_index_10", page: "index", sel: "footer > div:nth-of-type(2) > div:nth-of-type(1) > h3", tag: "b", label: "Contact", value: "Contact" },
    { key: "st_index_11", page: "index", sel: "footer > div:nth-of-type(2) > div:nth-of-type(2) > h3", tag: "b", label: "센터", value: "센터" },
    { key: "st_index_12", page: "index", sel: "footer > div:nth-of-type(2) > div:nth-of-type(3) > h3", tag: "b", label: "스튜디오센터", value: "스튜디오센터" },
    { key: "st_studio_01", page: "studio", sel: "#top > section:nth-of-type(1) > div > p", tag: "b", label: "ABOUT HAOC STUDIO", value: "ABOUT HAOC STUDIO" },
    { key: "st_studio_02", page: "studio", sel: "#top > section:nth-of-type(3) > div:nth-of-type(1) > p", tag: "b", label: "STUDIO SPACE", value: "STUDIO SPACE" },
    { key: "st_studio_03", page: "studio", sel: "#top > section:nth-of-type(3) > div:nth-of-type(1) > h2", tag: "b", label: "콘텐츠가 만들어지는 하오커뮤니케이션 스튜디오의 공간", value: "콘텐츠가 만들어지는 **하오커뮤니케이션 스튜디오의 공간**" },
    { key: "st_studio_04", page: "studio", sel: "#top > div:nth-of-type(1) > div:nth-of-type(1) > p", tag: "b", label: "STUDIO WORK", value: "STUDIO WORK" },
    { key: "st_studio_05", page: "studio", sel: "#top > div:nth-of-type(1) > div:nth-of-type(1) > h2", tag: "b", label: "실제 진행한 촬영 작업의 일부입니다.", value: "실제 진행한 **촬영 작업**의 일부입니다." },
    { key: "st_studio_06", page: "studio", sel: "#contact > div > div > p:nth-of-type(1)", tag: "b", label: "STUDIO INQUIRY", value: "STUDIO INQUIRY" },
    { key: "st_studio_07", page: "studio", sel: "footer > div:nth-of-type(2) > div:nth-of-type(1) > h3", tag: "b", label: "Contact", value: "Contact" },
    { key: "st_studio_08", page: "studio", sel: "footer > div:nth-of-type(2) > div:nth-of-type(2) > h3", tag: "b", label: "센터", value: "센터" },
    { key: "st_studio_09", page: "studio", sel: "footer > div:nth-of-type(2) > div:nth-of-type(3) > h3", tag: "b", label: "스튜디오센터", value: "스튜디오센터" },
    { key: "st_video_01", page: "video", sel: "#top > section:nth-of-type(3) > p", tag: "b", label: "SCOPE", value: "SCOPE" },
    { key: "st_video_02", page: "video", sel: "#top > section:nth-of-type(3) > h2", tag: "b", label: "영상 분야", value: "영상 분야" },
    { key: "st_video_03", page: "video", sel: "#top > section:nth-of-type(4) > p", tag: "b", label: "WORK", value: "WORK" },
    { key: "st_video_04", page: "video", sel: "#top > section:nth-of-type(4) > h2", tag: "b", label: "콘텐츠 사례", value: "콘텐츠 사례" },
    { key: "st_video_05", page: "video", sel: "#top > section:nth-of-type(5) > p", tag: "b", label: "PROCESS", value: "PROCESS" },
    { key: "st_video_06", page: "video", sel: "#top > section:nth-of-type(5) > h2", tag: "b", label: "제작 진행 과정", value: "제작 진행 과정" },
    { key: "st_video_07", page: "video", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(1) > h3", tag: "b", label: "상담", value: "상담" },
    { key: "st_video_08", page: "video", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(1) > p", tag: "b", label: "목적·채널·레퍼런스를 확인합니다.", value: "목적·채널·레퍼런스를 확인합니다." },
    { key: "st_video_09", page: "video", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(2) > h3", tag: "b", label: "기획·콘티", value: "기획·콘티" },
    { key: "st_video_10", page: "video", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(2) > p", tag: "b", label: "후킹과 전개 구성을 콘티로 정합니다.", value: "후킹과 전개 구성을 콘티로 정합니다." },
    { key: "st_video_11", page: "video", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(3) > h3", tag: "b", label: "촬영", value: "촬영" },
    { key: "st_video_12", page: "video", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(3) > p", tag: "b", label: "영상·제품 컷을 함께 촬영합니다.", value: "영상·제품 컷을 함께 촬영합니다." },
    { key: "st_video_13", page: "video", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(4) > h3", tag: "b", label: "편집", value: "편집" },
    { key: "st_video_14", page: "video", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(4) > p", tag: "b", label: "컷·자막·모션·BGM을 입힙니다.", value: "컷·자막·모션·BGM을 입힙니다." },
    { key: "st_video_15", page: "video", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(5) > h3", tag: "b", label: "납품", value: "납품" },
    { key: "st_video_16", page: "video", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(5) > p", tag: "b", label: "채널 규격별로 정리해 전달합니다.", value: "채널 규격별로 정리해 전달합니다." },
    { key: "st_video_17", page: "video", sel: "#top > section:nth-of-type(6) > p", tag: "b", label: "FAQ", value: "FAQ" },
    { key: "st_video_18", page: "video", sel: "#top > section:nth-of-type(6) > h2", tag: "b", label: "자주 하는 질문", value: "자주 하는 질문" },
    { key: "st_video_19", page: "video", sel: "#top > section:nth-of-type(6) > div > details:nth-of-type(1) > div > p", tag: "b", label: "길이·촬영 여부·편집 난이도에 따라 달라집니", value: "길이·촬영 여부·편집 난이도에 따라 달라집니다. 원하시는 레퍼런스를 주시면 비슷한 퀄리티 기준으로 견적을 안내드립니다." },
    { key: "st_video_20", page: "video", sel: "#top > section:nth-of-type(6) > div > details:nth-of-type(2) > div > p", tag: "b", label: "네. 보유 영상 소스로 컷편집·자막·모션 작", value: "네. 보유 영상 소스로 컷편집·자막·모션 작업만 진행할 수 있습니다. 소스 길이와 분량을 알려주세요." },
    { key: "st_video_21", page: "video", sel: "#top > section:nth-of-type(6) > div > details:nth-of-type(3) > div > p", tag: "b", label: "네. 9:16, 1:1, 16:9 등 필요한", value: "네. 9:16, 1:1, 16:9 등 필요한 비율로 함께 납품합니다. 채널을 미리 알려주시면 그에 맞게 편집합니다." },
    { key: "st_video_22", page: "video", sel: "#top > section:nth-of-type(6) > div > details:nth-of-type(4) > div > p", tag: "b", label: "숏폼 기준 촬영 후 약 1주 내 1차 편집본", value: "숏폼 기준 촬영 후 약 1주 내 1차 편집본을 전달합니다. 분량과 수정 범위에 따라 달라질 수 있습니다." },
    { key: "st_video_23", page: "video", sel: "#contact > div > div > p:nth-of-type(1)", tag: "b", label: "VIDEO CONTENT", value: "VIDEO CONTENT" },
    { key: "st_video_24", page: "video", sel: "footer > div:nth-of-type(2) > div:nth-of-type(1) > h3", tag: "b", label: "Contact", value: "Contact" },
    { key: "st_video_25", page: "video", sel: "footer > div:nth-of-type(2) > div:nth-of-type(2) > h3", tag: "b", label: "센터", value: "센터" },
    { key: "st_video_26", page: "video", sel: "footer > div:nth-of-type(2) > div:nth-of-type(3) > h3", tag: "b", label: "스튜디오센터", value: "스튜디오센터" },
    { key: "st_photo_01", page: "photo", sel: "#top > section:nth-of-type(3) > p", tag: "b", label: "SCOPE", value: "SCOPE" },
    { key: "st_photo_02", page: "photo", sel: "#top > section:nth-of-type(3) > h2", tag: "b", label: "촬영 분야", value: "촬영 분야" },
    { key: "st_photo_03", page: "photo", sel: "#top > section:nth-of-type(4) > p", tag: "b", label: "WORK", value: "WORK" },
    { key: "st_photo_04", page: "photo", sel: "#top > section:nth-of-type(4) > h2", tag: "b", label: "촬영 사례", value: "촬영 사례" },
    { key: "st_photo_05", page: "photo", sel: "#top > section:nth-of-type(5) > p", tag: "b", label: "PROCESS", value: "PROCESS" },
    { key: "st_photo_06", page: "photo", sel: "#top > section:nth-of-type(5) > h2", tag: "b", label: "촬영 진행 과정", value: "촬영 진행 과정" },
    { key: "st_photo_07", page: "photo", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(1) > h3", tag: "b", label: "상담·견적", value: "상담·견적" },
    { key: "st_photo_08", page: "photo", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(1) > p", tag: "b", label: "제품·컷 수·일정·예산 확인 후 견적을 안내", value: "제품·컷 수·일정·예산 확인 후 견적을 안내합니다." },
    { key: "st_photo_09", page: "photo", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(2) > h3", tag: "b", label: "콘티", value: "콘티" },
    { key: "st_photo_10", page: "photo", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(2) > p", tag: "b", label: "레퍼런스로 무드와 컷 리스트를 확정합니다.", value: "레퍼런스로 무드와 컷 리스트를 확정합니다." },
    { key: "st_photo_11", page: "photo", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(3) > h3", tag: "b", label: "촬영", value: "촬영" },
    { key: "st_photo_12", page: "photo", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(3) > p", tag: "b", label: "스튜디오·현장에서 컷별 컨펌을 받으며 촬영합", value: "스튜디오·현장에서 컷별 컨펌을 받으며 촬영합니다." },
    { key: "st_photo_13", page: "photo", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(4) > h3", tag: "b", label: "보정", value: "보정" },
    { key: "st_photo_14", page: "photo", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(4) > p", tag: "b", label: "누끼·색보정·리터칭으로 완성도를 올립니다.", value: "누끼·색보정·리터칭으로 완성도를 올립니다." },
    { key: "st_photo_15", page: "photo", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(5) > h3", tag: "b", label: "납품", value: "납품" },
    { key: "st_photo_16", page: "photo", sel: "#top > section:nth-of-type(5) > div > div:nth-of-type(5) > p", tag: "b", label: "규격별로 정리해 원본과 함께 전달합니다.", value: "규격별로 정리해 원본과 함께 전달합니다." },
    { key: "st_photo_17", page: "photo", sel: "#top > section:nth-of-type(6) > p", tag: "b", label: "FAQ", value: "FAQ" },
    { key: "st_photo_18", page: "photo", sel: "#top > section:nth-of-type(6) > h2", tag: "b", label: "자주 하는 질문", value: "자주 하는 질문" },
    { key: "st_photo_19", page: "photo", sel: "#top > section:nth-of-type(6) > div > details:nth-of-type(1) > div > p", tag: "b", label: "제품 수량·컷 수·연출 난이도·보정 범위에 ", value: "제품 수량·컷 수·연출 난이도·보정 범위에 따라 달라집니다. 원하시는 결과물을 알려주시면 항목별 견적을 정리해 드립니다." },
    { key: "st_photo_20", page: "photo", sel: "#top > section:nth-of-type(6) > div > details:nth-of-type(2) > div > p", tag: "b", label: "택배 또는 방문으로 받습니다. 촬영 후 반송", value: "택배 또는 방문으로 받습니다. 촬영 후 반송도 가능하며, 파손 위험이 있는 제품은 사전에 안내해 주세요." },
    { key: "st_photo_21", page: "photo", sel: "#top > section:nth-of-type(6) > div > details:nth-of-type(3) > div > p", tag: "b", label: "네. 누끼·색보정·리터칭을 촬영과 함께 진행", value: "네. 누끼·색보정·리터칭을 촬영과 함께 진행합니다. 합성·고급 리터칭 등 작업 강도에 따라 별도 견적이 추가될 수 있습니다." },
    { key: "st_photo_22", page: "photo", sel: "#top > section:nth-of-type(6) > div > details:nth-of-type(4) > div > p", tag: "b", label: "컷 수와 보정 범위에 따라 보통 촬영 후 3", value: "컷 수와 보정 범위에 따라 보통 촬영 후 3~7일 내 1차 시안을 전달합니다. 급한 일정은 사전 협의해 주세요." },
    { key: "st_photo_23", page: "photo", sel: "#contact > div > div > p:nth-of-type(1)", tag: "b", label: "STUDIO INQUIRY", value: "STUDIO INQUIRY" },
    { key: "st_photo_24", page: "photo", sel: "footer > div:nth-of-type(2) > div:nth-of-type(1) > h3", tag: "b", label: "Contact", value: "Contact" },
    { key: "st_photo_25", page: "photo", sel: "footer > div:nth-of-type(2) > div:nth-of-type(2) > h3", tag: "b", label: "센터", value: "센터" },
    { key: "st_photo_26", page: "photo", sel: "footer > div:nth-of-type(2) > div:nth-of-type(3) > h3", tag: "b", label: "스튜디오센터", value: "스튜디오센터" },
    { key: "st_portfolio_01", page: "portfolio", sel: "#top > section > div > p:nth-of-type(1)", tag: "b", label: "PORTFOLIO", value: "PORTFOLIO" },
    { key: "st_portfolio_02", page: "portfolio", sel: "footer > div:nth-of-type(2) > div:nth-of-type(1) > h3", tag: "b", label: "Contact", value: "Contact" },
    { key: "st_portfolio_03", page: "portfolio", sel: "footer > div:nth-of-type(2) > div:nth-of-type(2) > h3", tag: "b", label: "센터", value: "센터" },
    { key: "st_portfolio_04", page: "portfolio", sel: "footer > div:nth-of-type(2) > div:nth-of-type(3) > h3", tag: "b", label: "스튜디오센터", value: "스튜디오센터" },
    { key: "st_column_01", page: "column", sel: "#contact > div > div > p:nth-of-type(1)", tag: "b", label: "STUDIO INQUIRY", value: "STUDIO INQUIRY" },
    { key: "st_column_02", page: "column", sel: "#contact > div > div > h2", tag: "b", label: "문의 — 제목", value: "촬영이\n필요하신가요?" },
    { key: "st_column_03", page: "column", sel: "#contact > div > div > p:nth-of-type(2)", tag: "b", label: "문의 — 설명", value: "제품·예산·일정만 알려주시면\n가능 범위와 견적을 빠르게 안내드립니다." },
    { key: "st_column_04", page: "column", sel: "footer > div:nth-of-type(2) > div:nth-of-type(1) > h3", tag: "b", label: "Contact", value: "Contact" },
    { key: "st_column_05", page: "column", sel: "footer > div:nth-of-type(2) > div:nth-of-type(2) > h3", tag: "b", label: "센터", value: "센터" },
    { key: "st_column_06", page: "column", sel: "footer > div:nth-of-type(2) > div:nth-of-type(3) > h3", tag: "b", label: "스튜디오센터", value: "스튜디오센터" },
    { key: "st_qna_01", page: "qna", sel: "#top > section:nth-of-type(2) > p:nth-of-type(1)", tag: "b", label: "FAQ", value: "FAQ" },
    { key: "st_qna_02", page: "qna", sel: "#qSearchBtn", tag: "b", label: "검색", value: "검색" },
    { key: "st_qna_03", page: "qna", sel: "#qReset", tag: "b", label: "초기화", value: "초기화" },
    { key: "st_qna_04", page: "qna", sel: "footer > div:nth-of-type(2) > div:nth-of-type(1) > h3", tag: "b", label: "Contact", value: "Contact" },
    { key: "st_qna_05", page: "qna", sel: "footer > div:nth-of-type(2) > div:nth-of-type(2) > h3", tag: "b", label: "센터", value: "센터" },
    { key: "st_qna_06", page: "qna", sel: "footer > div:nth-of-type(2) > div:nth-of-type(3) > h3", tag: "b", label: "스튜디오센터", value: "스튜디오센터" },
    { key: "st_detailpage_01", page: "detailpage", sel: "#top > section:nth-of-type(3) > p", tag: "b", label: "FLOW", value: "FLOW" },
    { key: "st_detailpage_02", page: "detailpage", sel: "#top > section:nth-of-type(3) > h2", tag: "b", label: "팔리는 상세페이지 구성", value: "팔리는 상세페이지 구성" },
    { key: "st_detailpage_03", page: "detailpage", sel: "#top > section:nth-of-type(3) > div > div:nth-of-type(1) > div:nth-of-type(1) > h3", tag: "b", label: "후킹 / 첫 화면", value: "후킹 / 첫 화면" },
    { key: "st_detailpage_04", page: "detailpage", sel: "#top > section:nth-of-type(3) > div > div:nth-of-type(2) > div:nth-of-type(1) > h3", tag: "b", label: "문제 제기 / 공감", value: "문제 제기 / 공감" },
    { key: "st_detailpage_05", page: "detailpage", sel: "#top > section:nth-of-type(3) > div > div:nth-of-type(2) > div:nth-of-type(2) > p", tag: "b", label: "고객이 겪는 불편을 짚어 공감을 만들고, 왜", value: "고객이 겪는 불편을 짚어 공감을 만들고, 왜 이 제품이 필요한지 자연스럽게 연결합니다." },
    { key: "st_detailpage_06", page: "detailpage", sel: "#top > section:nth-of-type(3) > div > div:nth-of-type(3) > div:nth-of-type(1) > h3", tag: "b", label: "해결 / 핵심 강점", value: "해결 / 핵심 강점" },
    { key: "st_detailpage_07", page: "detailpage", sel: "#top > section:nth-of-type(3) > div > div:nth-of-type(4) > div:nth-of-type(1) > h3", tag: "b", label: "증거 / 신뢰", value: "증거 / 신뢰" },
    { key: "st_detailpage_08", page: "detailpage", sel: "#top > section:nth-of-type(3) > div > div:nth-of-type(4) > div:nth-of-type(2) > p", tag: "b", label: "성분·인증·후기·비교컷 등 의심을 없애는 근", value: "성분·인증·후기·비교컷 등 의심을 없애는 근거를 배치해 구매 확신을 만듭니다." },
    { key: "st_detailpage_09", page: "detailpage", sel: "#top > section:nth-of-type(3) > div > div:nth-of-type(5) > div:nth-of-type(1) > h3", tag: "b", label: "구매 유도 / 정보", value: "구매 유도 / 정보" },
    { key: "st_detailpage_10", page: "detailpage", sel: "#top > section:nth-of-type(3) > div > div:nth-of-type(5) > div:nth-of-type(2) > p", tag: "b", label: "구성·옵션·배송·교환 정보를 깔끔하게 정리해", value: "구성·옵션·배송·교환 정보를 깔끔하게 정리해 마지막 망설임을 줄입니다." },
    { key: "st_detailpage_11", page: "detailpage", sel: "#top > section:nth-of-type(4) > p", tag: "b", label: "WORK", value: "WORK" },
    { key: "st_detailpage_12", page: "detailpage", sel: "#top > section:nth-of-type(4) > h2", tag: "b", label: "제작 사례", value: "제작 사례" },
    { key: "st_detailpage_13", page: "detailpage", sel: "#top > section:nth-of-type(5) > p", tag: "b", label: "FAQ", value: "FAQ" },
    { key: "st_detailpage_14", page: "detailpage", sel: "#top > section:nth-of-type(5) > h2", tag: "b", label: "자주 하는 질문", value: "자주 하는 질문" },
    { key: "st_detailpage_15", page: "detailpage", sel: "#top > section:nth-of-type(5) > div > details:nth-of-type(1) > div > p", tag: "b", label: "네. 보유하신 이미지로 기획·디자인만 진행할", value: "네. 보유하신 이미지로 기획·디자인만 진행할 수 있습니다. 다만 이미지 퀄리티가 결과에 큰 영향을 주므로, 필요 시 보정·일부 재촬영을 함께 권해드립니다." },
    { key: "st_detailpage_16", page: "detailpage", sel: "#top > section:nth-of-type(5) > div > details:nth-of-type(2) > div > p", tag: "b", label: "네. 제품 정보와 타깃을 주시면 후킹·강점·", value: "네. 제품 정보와 타깃을 주시면 후킹·강점·구매유도 카피를 함께 작성합니다. 보유 원고가 있으면 다듬어 반영합니다." },
    { key: "st_detailpage_17", page: "detailpage", sel: "#top > section:nth-of-type(5) > div > details:nth-of-type(3) > div > p", tag: "b", label: "시안 단계에서 2~3회 수정을 기본 포함합니", value: "시안 단계에서 2~3회 수정을 기본 포함합니다. 구성 자체를 바꾸는 대규모 수정은 별도 협의합니다." },
    { key: "st_detailpage_18", page: "detailpage", sel: "#top > section:nth-of-type(5) > div > details:nth-of-type(4) > div > p", tag: "b", label: "분량과 촬영 포함 여부에 따라 보통 1~2주", value: "분량과 촬영 포함 여부에 따라 보통 1~2주 내외입니다. 일정이 급하면 미리 알려주세요." },
    { key: "st_detailpage_19", page: "detailpage", sel: "#contact > div > div > p:nth-of-type(1)", tag: "b", label: "DETAIL PAGE", value: "DETAIL PAGE" },
    { key: "st_detailpage_20", page: "detailpage", sel: "footer > div:nth-of-type(2) > div:nth-of-type(1) > h3", tag: "b", label: "Contact", value: "Contact" },
    { key: "st_detailpage_21", page: "detailpage", sel: "footer > div:nth-of-type(2) > div:nth-of-type(2) > h3", tag: "b", label: "센터", value: "센터" },
    { key: "st_detailpage_22", page: "detailpage", sel: "footer > div:nth-of-type(2) > div:nth-of-type(3) > h3", tag: "b", label: "스튜디오센터", value: "스튜디오센터" },
    { key: "st_column1_01", page: "column-1", sel: "main > section:nth-of-type(1) > div > h1", tag: "b", label: "브랜드 톤을 사진으로 지키는 법", value: "브랜드 톤을 사진으로 지키는 법" },
    { key: "st_column1_02", page: "column-1", sel: "main > section:nth-of-type(2) > article > div:nth-of-type(2) > p:nth-of-type(2)", tag: "b", label: "색온도, 배경, 소품 스타일, 여백의 규칙을", value: "색온도, 배경, 소품 스타일, 여백의 규칙을 가이드로 정해두면 누가 찍어도 같은 브랜드처럼 보입니다." },
    { key: "st_column1_03", page: "column-1", sel: "main > section:nth-of-type(2) > article > div:nth-of-type(2) > p:nth-of-type(3)", tag: "b", label: "하오커뮤니케이션 스튜디오는 첫 촬영에서 톤 가이드를 함", value: "하오커뮤니케이션 스튜디오는 첫 촬영에서 톤 가이드를 함께 정리해, 다음 시즌에도 이어지는 비주얼을 만듭니다." },
    { key: "st_column1_04", page: "column-1", sel: "footer > div:nth-of-type(2) > div:nth-of-type(1) > h3", tag: "b", label: "Contact", value: "Contact" },
    { key: "st_column1_05", page: "column-1", sel: "footer > div:nth-of-type(2) > div:nth-of-type(2) > h3", tag: "b", label: "센터", value: "센터" },
    { key: "st_column1_06", page: "column-1", sel: "footer > div:nth-of-type(2) > div:nth-of-type(3) > h3", tag: "b", label: "스튜디오센터", value: "스튜디오센터" },
    { key: "st_column2_01", page: "column-2", sel: "main > section:nth-of-type(1) > div > h1", tag: "b", label: "촬영 의뢰 전 준비하면 좋은 3가지", value: "촬영 의뢰 전 준비하면 좋은 3가지" },
    { key: "st_column2_02", page: "column-2", sel: "main > section:nth-of-type(2) > article > div:nth-of-type(2) > p:nth-of-type(1)", tag: "b", label: "촬영 결과는 준비에서 절반이 결정됩니다. 의", value: "촬영 결과는 준비에서 절반이 결정됩니다. 의뢰 전 세 가지만 정리해도 훨씬 매끄럽게 진행됩니다." },
    { key: "st_column2_03", page: "column-2", sel: "main > section:nth-of-type(2) > article > div:nth-of-type(2) > p:nth-of-type(2)", tag: "b", label: "① 레퍼런스: 원하는 무드의 이미지 몇 장 ", value: "① 레퍼런스: 원하는 무드의 이미지 몇 장 ② 컷 리스트: 꼭 필요한 장면과 용도 ③ 일정: 납품 데드라인." },
    { key: "st_column2_04", page: "column-2", sel: "main > section:nth-of-type(2) > article > div:nth-of-type(2) > p:nth-of-type(3)", tag: "b", label: "이 정보가 명확할수록 콘티가 정확해지고, 재", value: "이 정보가 명확할수록 콘티가 정확해지고, 재촬영 같은 리스크가 줄어듭니다." },
    { key: "st_column2_05", page: "column-2", sel: "footer > div:nth-of-type(2) > div:nth-of-type(1) > h3", tag: "b", label: "Contact", value: "Contact" },
    { key: "st_column2_06", page: "column-2", sel: "footer > div:nth-of-type(2) > div:nth-of-type(2) > h3", tag: "b", label: "센터", value: "센터" },
    { key: "st_column2_07", page: "column-2", sel: "footer > div:nth-of-type(2) > div:nth-of-type(3) > h3", tag: "b", label: "스튜디오센터", value: "스튜디오센터" },
    { key: "st_column3_01", page: "column-3", sel: "main > section:nth-of-type(1) > div > h1", tag: "b", label: "릴스 3초, 스크롤을 멈추게 하는 법", value: "릴스 3초, 스크롤을 멈추게 하는 법" },
    { key: "st_column3_02", page: "column-3", sel: "main > section:nth-of-type(2) > article > div:nth-of-type(2) > p:nth-of-type(1)", tag: "b", label: "숏폼은 길이가 짧은 만큼 첫 3초가 승부입니", value: "숏폼은 길이가 짧은 만큼 첫 3초가 승부입니다. 시청자가 스크롤을 멈추는 건 보통 첫 장면의 호기심 때문입니다." },
    { key: "st_column3_03", page: "column-3", sel: "main > section:nth-of-type(2) > article > div:nth-of-type(2) > p:nth-of-type(3)", tag: "b", label: "자막·효과음·컷 전환의 리듬도 중요합니다. ", value: "자막·효과음·컷 전환의 리듬도 중요합니다. 채널 규격(9:16)과 시청 패턴에 맞춰 편집해야 끝까지 보게 됩니다." },
    { key: "st_column3_04", page: "column-3", sel: "footer > div:nth-of-type(2) > div:nth-of-type(1) > h3", tag: "b", label: "Contact", value: "Contact" },
    { key: "st_column3_05", page: "column-3", sel: "footer > div:nth-of-type(2) > div:nth-of-type(2) > h3", tag: "b", label: "센터", value: "센터" },
    { key: "st_column3_06", page: "column-3", sel: "footer > div:nth-of-type(2) > div:nth-of-type(3) > h3", tag: "b", label: "스튜디오센터", value: "스튜디오센터" },
    { key: "st_column4_01", page: "column-4", sel: "main > section:nth-of-type(1) > div > h1", tag: "b", label: "팔리는 상세페이지의 5단 구성", value: "팔리는 상세페이지의 5단 구성" },
    { key: "st_column4_02", page: "column-4", sel: "main > section:nth-of-type(2) > article > div:nth-of-type(2) > p:nth-of-type(1)", tag: "b", label: "상세페이지는 디자인이 아니라 설득의 문제입니", value: "상세페이지는 디자인이 아니라 설득의 문제입니다. 좋은 페이지는 고객의 의심을 순서대로 풀어줍니다." },
    { key: "st_column4_03", page: "column-4", sel: "main > section:nth-of-type(2) > article > div:nth-of-type(2) > p:nth-of-type(2)", tag: "b", label: "① 후킹(첫 화면) ② 문제 제기(공감) ③", value: "① 후킹(첫 화면) ② 문제 제기(공감) ③ 해결(핵심 강점) ④ 증거(신뢰) ⑤ 구매 유도(정보) — 이 흐름을 따르면 자연스럽게 구매까지 이어집니다." },
    { key: "st_column4_04", page: "column-4", sel: "footer > div:nth-of-type(2) > div:nth-of-type(1) > h3", tag: "b", label: "Contact", value: "Contact" },
    { key: "st_column4_05", page: "column-4", sel: "footer > div:nth-of-type(2) > div:nth-of-type(2) > h3", tag: "b", label: "센터", value: "센터" },
    { key: "st_column4_06", page: "column-4", sel: "footer > div:nth-of-type(2) > div:nth-of-type(3) > h3", tag: "b", label: "스튜디오센터", value: "스튜디오센터" },
    { key: "st_column5_01", page: "column-5", sel: "main > section:nth-of-type(1) > div > h1", tag: "b", label: "누끼컷 vs 연출컷, 언제 무엇을 쓸까", value: "누끼컷 vs 연출컷, 언제 무엇을 쓸까" },
    { key: "st_column5_02", page: "column-5", sel: "main > section:nth-of-type(2) > article > div:nth-of-type(2) > p:nth-of-type(3)", tag: "b", label: "상세페이지는 보통 연출컷으로 분위기를 잡고,", value: "상세페이지는 보통 연출컷으로 분위기를 잡고, 누끼컷으로 정보를 확인시키는 순서가 효과적입니다. 둘 중 하나만으로는 부족합니다." },
    { key: "st_column5_03", page: "column-5", sel: "footer > div:nth-of-type(2) > div:nth-of-type(1) > h3", tag: "b", label: "Contact", value: "Contact" },
    { key: "st_column5_04", page: "column-5", sel: "footer > div:nth-of-type(2) > div:nth-of-type(2) > h3", tag: "b", label: "센터", value: "센터" },
    { key: "st_column5_05", page: "column-5", sel: "footer > div:nth-of-type(2) > div:nth-of-type(3) > h3", tag: "b", label: "스튜디오센터", value: "스튜디오센터" },
    { key: "st_column6_01", page: "column-6", sel: "main > section:nth-of-type(1) > div > h1", tag: "b", label: "제품 사진 하나가 전환율을 바꾼다", value: "제품 사진 하나가 전환율을 바꾼다" },
    { key: "st_column6_02", page: "column-6", sel: "main > section:nth-of-type(2) > article > div:nth-of-type(2) > p:nth-of-type(2)", tag: "b", label: "제품 사진은 단순히 예쁘게 찍는 게 아니라,", value: "제품 사진은 단순히 예쁘게 찍는 게 아니라, 브랜드가 말하고 싶은 가치를 한 장에 담는 일입니다. 빛의 방향, 배경 톤, 소품 하나가 신뢰감과 가격대의 인상을 바꿉니다." },
    { key: "st_column6_03", page: "column-6", sel: "footer > div:nth-of-type(2) > div:nth-of-type(1) > h3", tag: "b", label: "Contact", value: "Contact" },
    { key: "st_column6_04", page: "column-6", sel: "footer > div:nth-of-type(2) > div:nth-of-type(2) > h3", tag: "b", label: "센터", value: "센터" },
    { key: "st_column6_05", page: "column-6", sel: "footer > div:nth-of-type(2) > div:nth-of-type(3) > h3", tag: "b", label: "스튜디오센터", value: "스튜디오센터" },
    { key: "st_ix_ct_t", page: "index", sel: ".contact__title", tag: "b", label: "문의 — 제목", value: "촬영, 어떤 결과물이\n필요하신가요?" },
    { key: "st_ix_ct_d", page: "index", sel: ".contact__desc", tag: "b", label: "문의 — 설명", value: "제품·예산·일정만 알려주시면\n가능 범위와 견적을 빠르게 안내드립니다." },
    { key: "st_st_ct_t", page: "studio", sel: ".contact__title", tag: "b", label: "문의 — 제목", value: "촬영, 어떤 결과물이\n필요하신가요?" },
    { key: "st_st_ct_d", page: "studio", sel: ".contact__desc", tag: "b", label: "문의 — 설명", value: "제품·예산·일정만 알려주시면\n가능 범위와 견적을 빠르게 안내드립니다." },
    { key: "st_qn_ct_t", page: "qna", sel: ".contact__title", tag: "b", label: "문의 — 제목", value: "촬영, 어떤 결과물이\n필요하신가요?" },
    { key: "st_qn_ct_d", page: "qna", sel: ".contact__desc", tag: "b", label: "문의 — 설명", value: "제품·예산·일정만 알려주시면\n가능 범위와 견적을 빠르게 안내드립니다." },
    { key: "st_pf_ct_t", page: "portfolio", sel: ".contact__title", tag: "b", label: "문의 — 제목", value: "촬영, 어떤 결과물이\n필요하신가요?" },
    { key: "st_pf_ct_d", page: "portfolio", sel: ".contact__desc", tag: "b", label: "문의 — 설명", value: "제품·예산·일정만 알려주시면\n가능 범위와 견적을 빠르게 안내드립니다." },
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
    getReviews: function () { return load("hs_reviews", DEFAULT_REVIEWS); },
    ready: Promise.all([sbLoad(), loadHubAccounts()]),
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return sbSave(k, v); },
    remove: function (k) { localStorage.removeItem(k); return sbDelete(k); },
    uploadImage: sbUpload,

    /* 포트폴리오 — 등록일 최신순(최근 추가분 우선) 정렬해 반환 */
    getWorks: function () {
      var arr = load("hs_works", DEFAULT_WORKS).filter(function (w) { return w && w.f; });
      function dateOf(f) { return WORK_DATES[f] || "20240601"; }
      function newAdded(f) { var m = /^hs(\d+)\.jpg$/.exec(f); return (m && +m[1] >= 33) ? "1" : "0"; }
      arr.sort(function (a, b) { return (newAdded(b.f) + dateOf(b.f)).localeCompare(newAdded(a.f) + dateOf(a.f)); });
      return arr;
    },
    getWorksRaw: function () { return load("hs_works", DEFAULT_WORKS); },
    /* 메인 노출(main) 우선, 모자라면 나머지로 채움 */
    getMainWorks: function (n) {
      var works = this.getWorks();
      var picked = works.filter(function (w) { return w.main; });
      var rest = works.filter(function (w) { return !w.main; });
      var list = picked.concat(rest);
      return n ? list.slice(0, n) : list;
    },
    getHero: function () { return load("hs_hero", DEFAULT_HERO); },
    getPosts: function () {
      var arr = load("hs_posts", DEFAULT_POSTS);
      arr.sort(function (a, b) { return (b.date || "").localeCompare(a.date || "") || (b.id - a.id); });
      return arr;
    },
    getQna: function () { return load("hs_qna", DEFAULT_QNA); },
    getPartners: function () { return load("hs_partners", DEFAULT_PARTNERS); },
    getLogo: function () { var v = localStorage.getItem("hs_logo"); try { v = JSON.parse(v); } catch (e) {} return (typeof v === "string" && v) ? v : "assets/img/logo.png"; },
    getSettings: function () { return loadObj("hs_settings", DEFAULT_SETTINGS); },
    getSocial: function () { return loadObj("hs_social", DEFAULT_SOCIAL); },
    getCopy: function () {
      var ov = loadObj("hs_copy", {});
      return DEFAULT_COPY.map(function (c) {
        var out = JSON.parse(JSON.stringify(c));
        if (typeof ov[c.key] === "string") out.value = ov[c.key];
        return out;
      });
    },
        getImgs: function () {
      var ov = loadObj("hs_imgs", {});
      return DEFAULT_IMGS.map(function (c) {
        var out = JSON.parse(JSON.stringify(c));
        if (typeof ov[c.key] === "string" && ov[c.key]) out.value = ov[c.key];
        return out;
      });
    },
    getSeo: function () {
      var ov = loadObj("hs_seo", {});
      var out = JSON.parse(JSON.stringify(DEFAULT_SEO));
      if (ov.siteUrl) out.siteUrl = ov.siteUrl;
      if (ov.ogImage) out.ogImage = ov.ogImage;
      if (ov.pages) Object.keys(ov.pages).forEach(function (p) {
        if (!out.pages[p]) out.pages[p] = {};
        Object.keys(ov.pages[p]).forEach(function (f) { out.pages[p][f] = ov.pages[p][f]; });
      });
      return out;
    },
    getHeadCode: function () { try { var v = JSON.parse(localStorage.getItem("hs_headcode")); return typeof v === "string" ? v : ""; } catch (e) { return ""; } },
    getAccounts: function () {
      try { var v = JSON.parse(localStorage.getItem("hs_accounts")); if (Array.isArray(v) && v.length) return v; } catch (e) {}
      var c = loadObj("hs_admin_cred", null);
      if (c && c.id) return [c];
      return [{ id: "admin", pw: "studio1234" }];
    },
    saveAccounts: function (list) { return this.set("hs_accounts", list); },
    getCred: function () { return this.getAccounts()[0]; },
    verifyLogin: function (id, pw) {
      var hit = function (list) { return (list || []).some(function (a) { return a && a.id === id && a.pw === pw; }); };
      return hit(this.getAccounts()) || hit(HUB_ACCOUNTS);
    },
    getMail: function () { return loadObj("hs_mail", { on: false, url: "", to: "sales@haodesign.co.kr" }); },

    /* 견적 문의 — 공유 inquiries 테이블에 저장(type 앞에 [스튜디오] 표시) */
    saveInquiry: function (q) {
      var m = this.getMail();
      var typed = INQ_TAG + " " + (q.type || "촬영 문의");
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

    /* **텍스트** → <tag>텍스트</tag> (HTML escape 포함, 줄바꿈 → <br/>) */
    fmt: function (s, tag) {
      var esc = String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
      return esc.replace(/\*\*(.+?)\*\*/g, "<" + tag + ">$1</" + tag + ">").replace(/\n/g, "<br />");
    }
  };
})();
