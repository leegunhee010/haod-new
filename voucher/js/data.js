/* ===================================================
   HAO VOUCHER (정부사업지원센터) — shared data layer
   기본 데이터 + 관리자 오버라이드(Supabase 서버 + localStorage 캐시).
   · 다른 센터와 같은 Supabase 프로젝트를 공유하되, 키는 모두 "hv_" 접두사로 분리.
   · 상담문의는 공유 inquiries 테이블에 저장하되 type 앞에 "[바우처]" 표시로 구분.
   · 안전 범위: 칼럼 · Q&A · 설정 · SEO · 로고 · 문의 (메인 템플릿/서비스 페이지는 카피·SEO만).
=================================================== */
(function () {
  "use strict";

  var SB_URL = "https://oaqrjrrgntlqmyxxovfn.supabase.co";
  var SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcXJqcnJnbnRscW15eHhvdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NjQzMTUsImV4cCI6MjA5NzE0MDMxNX0.3bOfZOXVKSoI9ELfE7ZjWETuxvjpNYHdCBSIMrbAGtU";
  var SB_H = { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": "application/json" };

  var INQ_TAG = "[바우처]";

  function sbLoad() {
    var hasCache = false;
    try {
      for (var ci = 0; ci < localStorage.length; ci++) {
        var ck = localStorage.key(ci);
        if (ck && ck.indexOf("hv_") === 0 && ck !== "hv_admin_cred" && ck !== "hv_edit") { hasCache = true; break; }
      }
    } catch (e) {}
    var timed = new Promise(function (resolve) { setTimeout(resolve, hasCache ? 3000 : 12000); });
    var fetched = fetch(SB_URL + "/rest/v1/overrides?select=k,v&k=like.hv_*", { headers: SB_H })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        var seen = {};
        rows.forEach(function (row) { seen[row.k] = 1; try { localStorage.setItem(row.k, JSON.stringify(row.v)); } catch (e) {} });
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var lk = localStorage.key(i);
          if (lk && lk.indexOf("hv_") === 0 && lk !== "hv_admin_cred" && lk !== "hv_edit" && !seen[lk]) localStorage.removeItem(lk);
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
  function sbDelete(k) { return fetch(SB_URL + "/rest/v1/overrides?k=eq." + encodeURIComponent(k), { method: "DELETE", headers: SB_H }); }
  function sbUpload(blob, ext) {
    var name = "hv_" + Date.now() + "_" + Math.floor(Math.random() * 1e9).toString(36) + "." + (ext || "jpg");
    return fetch(SB_URL + "/storage/v1/object/images/" + name, {
      method: "POST",
      headers: { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Content-Type": blob.type || "image/jpeg", "x-upsert": "true" },
      body: blob
    }).then(function (r) { return r.ok ? (SB_URL + "/storage/v1/object/public/images/" + name) : null; }).catch(function () { return null; });
  }

  function imgSrc(f) {
    if (!f) return "";
    if (/^(https?:|data:)/.test(f)) return f;
    if (f.indexOf("/") >= 0) return f;
    return "assets/img/" + f;
  }

  /* ===== 칼럼 글 ===== */
  var DEFAULT_POSTS = [
    { id: 6, title: '2026 수출바우처 신청 일정 한눈에 정리', summary: '차수별 모집 일정과 우선순위, 준비 서류를 시기별로 정리했습니다.', date: '2026.06.18', img: 'assets/img/big_slide_02.jpg', isNew: true,
      body: ['수출바우처는 매년 여러 차수에 걸쳐 모집이 진행됩니다. 1차 모집은 보통 연초에 시작되며, 차수마다 배정 예산과 우선 선정 분야가 다릅니다.', '동일 공고 내 최대 2개 사업까지 신청할 수 있지만 우선순위가 높은 1개 사업만 선정되므로, 신청 전 우선순위를 명확히 정해두는 것이 중요합니다.', '신청서·사업계획·증빙 서류는 마감 직전에 몰리기 쉬우므로 최소 2주 전부터 준비하시길 권합니다. 하오디자인은 신청 준비 단계부터 무료로 안내해 드립니다.'] },
    { id: 5, title: '우리 회사도 제조혁신바우처 대상일까?', summary: '대상 기업 요건과 진단 절차를 사례로 설명합니다.', date: '2026.06.10', img: 'assets/img/big_slide_03.jpg', isNew: true,
      body: ['제조혁신바우처는 성장 가능성이 높은 제조 중소기업을 대상으로 합니다. 업력·매출 규모보다 기업 진단 결과와 개선 계획의 구체성이 중요하게 평가됩니다.', '진단을 통해 컨설팅·기술지원·마케팅·디자인 등 필요한 서비스를 바우처로 지원받을 수 있으며, 카탈로그·브로슈어 등 홍보물 제작도 포함됩니다.', '대상 여부가 애매하다면 무료 상담으로 먼저 확인해 보세요.'] },
    { id: 4, title: '바우처로 카탈로그·브로슈어 제작하는 법', summary: '메뉴판에서 디자인 서비스를 고르는 기준과 효과를 높이는 팁.', date: '2026.05.29', img: 'assets/img/big_slide_04.jpg', isNew: false,
      body: ['바우처 메뉴판에는 디자인·인쇄 서비스가 카테고리별로 등록되어 있습니다. 결과물의 용도(수출 상담회, 해외 바이어 제안 등)에 맞는 카테고리를 고르는 것이 첫 단계입니다.', '판형·페이지 수·후가공을 미리 정하면 부담금 대비 완성도를 높일 수 있습니다. 하오디자인은 인쇄 감리까지 직접 챙겨 화면과 종이의 차이를 줄입니다.'] },
    { id: 3, title: '소상공인 지원사업, 작은 가게도 가능한가요?', summary: '리플렛·메뉴판·매장 홍보물에 활용 가능한 지원사업 안내.', date: '2026.05.20', img: 'assets/img/big_slide_06.jpg', isNew: false,
      body: ['소상공인시장진흥공단은 소상공인의 창업·경영 안정·성장을 돕는 다양한 지원사업을 운영합니다. 규모가 작은 매장도 충분히 활용할 수 있습니다.', '리플렛·메뉴판·간판·매장 홍보물 등 소규모 제작에 적합하며, 사업별로 지원 항목과 한도가 다릅니다. 우리 매장에 맞는 사업을 함께 찾아드립니다.'] },
    { id: 2, title: '결과보고서 작성 체크리스트 7가지', summary: '평가를 통과하는 결과보고서의 필수 항목을 정리했습니다.', date: '2026.05.12', img: 'assets/img/main_07.png', isNew: false,
      body: ['결과보고는 사업 종료만큼 중요합니다. 평가 기준과 작성 요건을 정확히 이해해야 다음 참여에도 유리합니다.', '① 사업 목표 대비 성과 ② 정량 지표 ③ 산출물 증빙 ④ 예산 집행 내역 ⑤ 활용 계획 ⑥ 사진·이미지 자료 ⑦ 누락 항목 점검 — 이 7가지를 기준으로 점검하세요.', '하오디자인은 항목별 작성 기준과 필수 포함 내용을 가이드합니다.'] },
    { id: 1, title: '바우처로 다국어 카탈로그 만든 수출기업 이야기', summary: '신청부터 납품까지의 흐름과 결과물이 만든 변화.', date: '2026.04.30', img: 'assets/img/main_09.png', isNew: false,
      body: ['한 제조 수출기업은 수출바우처를 활용해 영문·중문 다국어 카탈로그를 제작했습니다. 기존에는 국문 자료를 급히 번역해 사용하던 상황이었습니다.', '업종 특성과 해외 바이어의 관점을 반영해 구성을 새로 잡고, 인쇄 감리까지 진행했습니다. 상담회에서 자료에 대한 반응이 달라졌다는 피드백을 받았습니다.'] }
  ];

  /* ===== Q&A ===== */
  var DEFAULT_QNA = [
    { c: '참여기업', q: '수출바우처 사업 신청 방법은 어떻게 되나요?', a: '수출바우처 누리집에서 온라인으로 신청합니다. 동일 공고 내 최대 2개 사업까지 신청 가능하나 우선순위가 높은 1개 사업만 선정됩니다. 제출 서류를 바탕으로 서면·현장 평가를 거쳐 지원 자격 심사 후 최종 선정됩니다.' },
    { c: '참여기업', q: '바우처 사용계획서는 무엇인가요?', a: '선정된 기업이 연간 바우처를 어떤 서비스에 어떻게 사용할지 대략적으로 작성하는 계획 문서입니다. 협약 단계에서 제출하며, 이후 실제 수행 내용에 맞춰 수정할 수 있습니다.' },
    { c: '참여기업', q: '바우처 사용계획서는 어떻게 수정하나요?', a: '수출바우처 시스템에 로그인 후 마이페이지의 협약·사용계획 관리 메뉴에서 수정합니다. 서비스 카테고리·수행기관·금액 등을 조정할 수 있으며, 일부 항목은 협약 변경 절차가 필요할 수 있습니다.' },
    { c: '참여기업', q: '사용계획서 작성 시 해외전시회 개별참가는 어떤 서비스 카테고리에 등록하나요?', a: '‘해외 전시회·행사’ 관련 서비스 카테고리에 등록합니다. 부스 임차·장치 등 항목별 인정 범위가 다르므로 공고의 서비스 분류 기준을 확인하세요.' },
    { c: '참여기업', q: '사용계획서를 일부만 제출했더니 ‘협약 대기중’ 팝업이 뜹니다. 어디서 마저 작성하나요?', a: '마이페이지 > 협약관리에서 작성 중인 협약을 이어서 완료할 수 있습니다. 협약이 최종 승인되어야 바우처 사용이 시작됩니다.' },
    { c: '참여기업', q: '작년에 선정되어 진행 중인데, 올해 1차 모집 공고에도 지원할 수 있나요?', a: '운영기관과의 협약 기간이 종료되지 않은 경우 같은 기간 내 모집 사업에는 중복 참여가 불가합니다. 모집 차수에 따라 예외가 있을 수 있으니 공고문을 확인하세요.' },
    { c: '참여기업', q: '해외전시회 개별참가, 타 정부기관·지자체에서 같은 전시회에 동시 지원받을 수 있나요?', a: '동일 비목에 대한 중복 지원은 불가합니다. 동일 전시회라도 지원 항목이 겹치지 않으면 가능한 경우가 있으니 각 사업 기준을 확인해야 합니다.' },
    { c: '참여기업', q: '수출바우처 사업과 선택형 지원사업에 중복 신청이 가능한가요?', a: '사업 성격에 따라 중복 참여가 제한될 수 있습니다. 동일 연도·동일 목적 사업은 제한되는 경우가 많으므로 공고의 중복지원 제한 규정을 확인하세요.' },
    { c: '참여기업', q: 'KOTRA·중진공 등 타 기관 수출지원사업과 중복 신청할 수 있나요?', a: '수출바우처와 별개로 운영되는 유관기관 지원사업은 원칙적으로 신청 제한이 없습니다. 다만 각 사업 운영 기준에 따라 일부 제한될 수 있습니다.' },
    { c: '참여기업', q: '우선순위를 정하는 이유는 무엇인가요?', a: '동일 공고에서 최대 2개 사업을 신청할 수 있지만 최종적으로 1개 사업만 선정되기 때문에, 선정 시 우선 고려할 사업을 미리 지정하는 것입니다.' },
    { c: '바우처 운영', q: '바우처 사용(협약) 기간은 얼마나 되나요?', a: '보통 협약일로부터 약 1년 내외이며 사업·연도별로 다릅니다. 기간 내 서비스 완료와 정산이 이루어져야 합니다.' },
    { c: '바우처 운영', q: '기업분담금은 어떻게 납부하나요?', a: '선정·협약 후 운영기관 안내에 따라 지정 계좌로 납부하며, 납부가 확인되면 바우처가 발급됩니다.' },
    { c: '바우처 운영', q: '정산은 어떻게 진행되나요?', a: '서비스 완료 후 수행기관이 증빙을 등록하면 운영기관 검토를 거쳐 수행기관과 비용을 정산합니다. 기업은 약정한 분담금 외 추가 부담이 없습니다(지원 범위 내).' },
    { c: '바우처 운영', q: '수행기관을 중간에 변경할 수 있나요?', a: '사용계획서 수정·협약 변경 절차를 통해 가능합니다. 단 이미 진행·정산된 서비스는 변경이 제한됩니다.' },
    { c: '수행기관', q: '하오디자인은 어떤 분야 수행기관인가요?', a: '카탈로그·브로슈어·리플렛·패키지·다국어 홍보물 등 디자인·인쇄 분야 수행기관입니다. 수출·제조혁신·소상공인 사업의 디자인 서비스 카테고리에서 선택하실 수 있습니다.' },
    { c: '수행기관', q: '수행기관은 어떻게 선택하나요?', a: '바우처 시스템의 수행기관 검색에서 분야로 찾아 사용계획서에 등록합니다. 하오디자인을 지정하시면 상담을 통해 결과물 방향을 함께 잡아드립니다.' },
    { c: '하오디자인 문의', q: '신청 준비 단계부터 도움을 받을 수 있나요?', a: '네. 사업 이해부터 신청서·사용계획서 작성까지 가이드를 제공합니다. 컨설팅은 무료이며 접수 순으로 안내합니다.' },
    { c: '하오디자인 문의', q: '어떤 제작물을 바우처로 만들 수 있나요?', a: '카탈로그·브로슈어·리플렛·패키지·라벨·다국어 홍보물 등 디자인 제작 항목이 메뉴판에 포함된 경우 활용 가능합니다. 사업별 가능 항목은 문의 시 확인해 드립니다.' },
    { c: '하오디자인 문의', q: '결과보고서 작성도 안내받을 수 있나요?', a: '네. 항목별 작성 기준과 필수 포함 내용 가이드를 제공해 결과보고 완성도를 높이도록 돕습니다.' },
    { c: '하오디자인 문의', q: '기업 부담금은 어느 정도인가요?', a: '사업·기업 유형에 따라 정부 지원 비율이 달라 총 사업비의 일부만 부담합니다. 정확한 비율은 해당 연도 공고 기준으로 안내드립니다.' },
    { c: '참여기업', q: '신청 자격에 매출·업력 제한이 있나요?', a: '사업·연도별로 다릅니다. 일반적으로 중소·중견기업을 대상으로 하며, 일부 사업은 전년도 수출액·업력 등 세부 요건을 둡니다. 정확한 기준은 해당 공고를 확인하세요.' },
    { c: '참여기업', q: '개인사업자도 신청할 수 있나요?', a: '사업자등록을 갖춘 중소기업이면 법인·개인 구분 없이 신청 가능한 경우가 많습니다. 다만 일부 사업은 법인으로 제한하기도 하므로 공고 기준을 확인하세요.' },
    { c: '참여기업', q: '선정 결과는 언제, 어디서 확인하나요?', a: '평가 종료 후 운영기관 누리집과 신청 시 등록한 연락처로 안내됩니다. 차수별 일정은 공고문에 명시됩니다.' },
    { c: '참여기업', q: '탈락하면 다음 차수에 다시 신청할 수 있나요?', a: '네. 모집 차수가 남아 있다면 보완해 재신청할 수 있습니다. 평가 피드백을 반영하면 선정 가능성을 높일 수 있습니다.' },
    { c: '바우처 운영', q: '바우처 잔액은 다음 해로 이월되나요?', a: '협약 기간 내 사용하지 않은 바우처는 원칙적으로 소멸하며 다음 연도로 이월되지 않습니다. 기간 내 집행 계획이 중요합니다.' },
    { c: '바우처 운영', q: '사용 가능한 서비스 분야는 어떻게 확인하나요?', a: '바우처 시스템의 서비스 메뉴(메뉴판)에서 분야별 등록 서비스를 확인할 수 있습니다. 디자인·홍보·번역 등 카테고리로 구분되어 있습니다.' },
    { c: '바우처 운영', q: '서비스 비용은 누가 어떻게 지급하나요?', a: '기업이 바우처와 분담금으로 결제하면 운영기관이 수행기관에 정산·지급하는 구조입니다. 기업이 수행기관에 직접 전액을 지급하지 않습니다.' },
    { c: '바우처 운영', q: '협약 후 사업을 중도 포기하면 어떻게 되나요?', a: '미사용 바우처는 회수되며, 이미 집행된 부분은 정산 기준에 따라 처리됩니다. 사유에 따라 향후 참여에 제한이 있을 수 있습니다.' },
    { c: '바우처 운영', q: '부가세도 지원되나요?', a: '부가세 포함 여부는 사업·항목별로 다릅니다. 다수 사업이 공급가 기준으로 지원하고 부가세는 기업 부담인 경우가 많으니 공고를 확인하세요.' },
    { c: '바우처 운영', q: '증빙 서류는 어떻게 처리하나요?', a: '수행기관이 서비스 완료 후 시스템에 증빙(계산서·결과물 등)을 등록하고 운영기관이 검토합니다. 기업은 분담금 납부 증빙을 보관하세요.' },
    { c: '혁신바우처', q: '중소기업 혁신바우처는 어떤 사업인가요?', a: '제조 중소기업의 경쟁력 강화를 위해 컨설팅·기술지원·마케팅 서비스를 바우처로 지원하는 사업입니다. 진단 결과에 따라 필요한 서비스를 선택합니다.' },
    { c: '혁신바우처', q: '혁신바우처 지원 대상은 누구인가요?', a: '주로 매출액이 일정 규모 이하인 제조 중소기업이 대상입니다. 연도별 세부 자격은 공고를 확인하세요.' },
    { c: '혁신바우처', q: '혁신바우처에서 디자인은 어느 분야인가요?', a: '마케팅 분야의 디자인·브랜드 서비스에 해당합니다. 카탈로그·제품 소개서·패키지 등을 제작할 수 있습니다.' },
    { c: '혁신바우처', q: '자부담(보조율)은 어떻게 되나요?', a: '기업 규모·유형에 따라 정부 보조율이 달라집니다. 지역에 따라 추가 적용될 수 있으니 공고 기준을 확인하세요.' },
    { c: '혁신바우처', q: '사전 진단은 꼭 받아야 하나요?', a: '대부분 사전 진단을 거쳐 필요한 서비스를 도출합니다. 진단 결과가 사용계획 수립의 기준이 됩니다.' },
    { c: '혁신바우처', q: '혁신바우처와 수출바우처를 함께 받을 수 있나요?', a: '사업 목적·기간이 겹치지 않으면 가능한 경우가 있으나, 중복지원 제한 규정이 적용될 수 있습니다. 각 공고 기준을 확인하세요.' },
    { c: '판로개척', q: '판로개척지원사업은 무엇인가요?', a: '중소기업의 국내외 시장 진출을 돕는 사업으로, 전시회·박람회 참가, 온라인몰 입점, 마케팅·홍보 등을 지원합니다.' },
    { c: '판로개척', q: '판로개척에서 어떤 디자인을 지원받나요?', a: '상세페이지·제품 콘텐츠, 카탈로그·리플렛, SNS·브랜딩 디자인 등 판매에 필요한 홍보물을 제작할 수 있습니다.' },
    { c: '판로개척', q: '온라인몰 입점도 지원되나요?', a: '사업에 따라 입점·운영, 상세페이지 제작 등이 포함됩니다. 가능 항목은 공고의 지원 내용을 확인하세요.' },
    { c: '판로개척', q: '전시회 참가 비용도 바우처로 쓸 수 있나요?', a: '부스 임차·장치·홍보물 등 항목별 인정 범위가 다릅니다. 공고의 비목 기준을 확인하세요.' },
    { c: '판로개척', q: '소상공인도 신청할 수 있나요?', a: '사업별로 대상이 다릅니다. 소상공인 대상 별도 사업이 있으며, 일부 판로 사업은 중소기업 전반을 대상으로 합니다.' },
    { c: '수행기관', q: '수행기관 정보는 어디서 조회하나요?', a: '바우처 시스템의 수행기관 검색에서 분야·기관명으로 조회할 수 있습니다. 하오디자인도 디자인 분야로 검색됩니다.' },
    { c: '수행기관', q: '여러 수행기관을 동시에 이용할 수 있나요?', a: '서비스 분야가 다르면 여러 수행기관을 함께 이용할 수 있습니다. 디자인은 하오디자인, 번역은 다른 기관 식으로 구성할 수 있습니다.' },
    { c: '수행기관', q: '결과물 방향은 수행기관과 어떻게 협의하나요?', a: '지정 후 수행기관과 사전 상담으로 콘셉트·범위·일정을 정합니다. 하오디자인은 착수 전 방향 협의를 진행합니다.' },
    { c: '수행기관', q: '제작 기간은 보통 얼마나 걸리나요?', a: '결과물 종류·분량에 따라 다릅니다. 카탈로그·브로슈어는 보통 2~4주 내외이며, 협의 후 일정을 확정합니다.' },
    { c: '하오디자인 문의', q: '상담은 어떻게 신청하나요?', a: '전화(1666-2027) 또는 누리집 문의하기로 신청하시면 담당자가 연락드립니다. 사업·결과물 종류를 알려주시면 더 빠르게 안내됩니다.' },
    { c: '하오디자인 문의', q: '시안 수정은 몇 번까지 되나요?', a: '프로젝트 범위에 따라 정해진 횟수 안에서 시안·수정을 진행합니다. 착수 전 협의 단계에서 범위를 명확히 정합니다.' },
    { c: '하오디자인 문의', q: '기존 로고·자료가 꼭 있어야 하나요?', a: '있으면 활용하고, 없으면 처음부터 함께 정리해 드립니다. 보유 자료(로고·제품 사진·문안)가 있으면 더 빠르게 진행됩니다.' },
    { c: '하오디자인 문의', q: '지방·해외 기업도 진행할 수 있나요?', a: '네. 상담·진행은 비대면으로도 가능합니다. 자료 전달과 검수는 온라인으로 충분히 진행됩니다.' },
    { c: '하오디자인 문의', q: '다국어(영문·중문) 제작도 되나요?', a: '네. 영문·중문 등 다국어 카탈로그·홍보물 제작이 가능합니다. 번역이 필요하면 번역 서비스와 연계해 진행합니다.' }
  ];

  var DEFAULT_SETTINGS = {
    tel: "1666-2027", email: "sales@haodesign.co.kr", time: "평일 09:00 – 18:00",
    addr: "서울시 광진구 능동로49길 9, 2F", bizName: "주식회사 하오커뮤니케이션", ceo: "박창민", bizNo: "528-87-01037"
  };
  var DEFAULT_SOCIAL = { kakao: "", instagram: "", blog: "", phone: "1666-2027" };

  var DEFAULT_SEO = {
    siteUrl: "https://haodesign.co.kr",
    ogImage: "assets/img/big_slide_02.jpg",
    pages: {
      index: {
        title: "정부사업지원센터 | 하오디자인 — 수출바우처·혁신바우처 디자인 수행기관",
        desc: "하오디자인 정부사업지원센터. 수출바우처·제조혁신바우처·판로개척지원사업의 디자인·인쇄 수행기관 — 카탈로그·브로슈어·다국어 홍보물 제작을 지원합니다.",
        keywords: "수출바우처, 혁신바우처, 판로개척지원사업, 바우처 수행기관, 카탈로그 제작, 다국어 홍보물, 하오디자인" },
      export: {
        title: "수출바우처 | 정부사업지원센터 — 하오디자인",
        desc: "수출바우처 디자인 수행기관 하오디자인. 신청 안내부터 다국어 카탈로그·브로슈어 제작·인쇄 감리까지 지원합니다.",
        keywords: "수출바우처, 수출바우처 신청, 다국어 카탈로그, 수출 브로슈어, 바우처 수행기관" },
      innovation: {
        title: "혁신바우처 | 정부사업지원센터 — 하오디자인",
        desc: "제조 중소기업 혁신바우처 디자인 서비스. 진단부터 카탈로그·제품 소개서·패키지 제작까지 함께합니다.",
        keywords: "혁신바우처, 제조혁신바우처, 중소기업 혁신바우처, 디자인 바우처, 카탈로그 제작" },
      market: {
        title: "판로개척지원사업 | 정부사업지원센터 — 하오디자인",
        desc: "판로개척지원사업 디자인·홍보물 제작. 상세페이지·카탈로그·리플렛·브랜딩으로 국내외 판로 확대를 돕습니다.",
        keywords: "판로개척지원사업, 소상공인 지원사업, 상세페이지, 카탈로그, 홍보물 제작" },
      column: {
        title: "칼럼 | 정부사업지원센터 — 하오디자인",
        desc: "수출바우처·제조혁신바우처·소상공인 지원사업 신청 노하우와 일정, 결과보고 팁을 정리한 하오디자인 정부사업지원센터 칼럼.",
        keywords: "수출바우처 칼럼, 바우처 신청 노하우, 결과보고서, 정부지원사업 팁" },
      qna: {
        title: "Q&A | 정부사업지원센터 — 하오디자인",
        desc: "수출바우처·혁신바우처·판로개척지원사업 자주 하는 질문. 참여기업·바우처 운영·수행기관 카테고리별 Q&A.",
        keywords: "수출바우처 문의, 바우처 자주하는질문, 혁신바우처, 판로개척, 수행기관" }
    }
  };

  var DEFAULT_COPY = [
    /* ───── 메인 · 히어로 ───── */
    { key: "vc_hero_eyebrow", page: "index", sel: ".ghero__eyebrow", tag: "b", label: "히어로 — 상단 라벨", value: "**6년 연속** 정부지원사업 공식 수행기관" },
    { key: "vc_hero_prefix", page: "index", sel: "#ghPrefix", tag: "b", label: "히어로 — 제목 첫 줄(고정 문구)", value: "하오가 디자인하는" },
    { key: "vc_hero_roll", page: "index", sel: "#ghRoll", tag: "b", label: "히어로 — 롤링 단어들 (한 줄에 하나씩)", value: "수출바우처\n혁신바우처\n판로개척지원사업\n다국어 카탈로그\n브랜드 디자인" },
    { key: "vc_hero_line2", page: "index", sel: ".ghero__title .hero-line:nth-of-type(2)", tag: "b", label: "히어로 — 제목 둘째 줄", value: "정부지원 디자인의 기준." },
    { key: "vc_hero_sub", page: "index", sel: ".ghero__sub", tag: "b", label: "히어로 — 설명", value: "수출바우처·혁신바우처·판로개척지원사업 — 신청 가능 여부 확인부터\n카탈로그·브로슈어·다국어 홍보물 제작, 결과보고까지 하오디자인이 함께합니다." },
    { key: "vc_hero_cta", page: "index", sel: ".ghero__cta span", tag: "b", label: "히어로 — 버튼 문구", value: "무료 가능여부 상담하기" },

    /* ───── 메인 · Our Projects ───── */
    { key: "vc_s1_eg", page: "index", sel: ".section1 .tit-box > b", tag: "b", label: "프로젝트 — 라벨", value: "Our Projects" },
    { key: "vc_s1_num", page: "index", sel: ".section1 .tit-box h3", tag: "b", label: "프로젝트 — 건수(숫자+)", value: "412+" },
    { key: "vc_s1_line1", page: "index", sel: ".section1 .fill-text.line1", tag: "b", label: "프로젝트 — 문장①", value: "하오디자인은 정부지원사업을 통해" },
    { key: "vc_s1_line2", page: "index", sel: ".section1 .fill-text.line2", tag: "b", label: "프로젝트 — 문장②", value: "중소기업의 브랜드 가치를 디자인합니다." },

    /* ───── 메인 · What We Do ───── */
    { key: "vc_s2_eg", page: "index", sel: ".section2 .tit-box > b", tag: "b", label: "미션 — 라벨", value: "What We Do" },
    { key: "vc_s2_t1", page: "index", sel: ".section2 .tit-box h3:nth-of-type(1)", tag: "b", label: "미션 — 제목①", value: "Your grow" },
    { key: "vc_s2_t2", page: "index", sel: ".section2 .tit-box h3:nth-of-type(2)", tag: "b", label: "미션 — 제목②", value: "our Mission" },
    { key: "vc_s2_line1", page: "index", sel: ".section2 .fill-text.line1", tag: "b", label: "미션 — 문장①", value: "하오디자인은 정부지원사업의 복잡한 절차를 대신하고," },
    { key: "vc_s2_line2", page: "index", sel: ".section2 .fill-text.line2", tag: "b", label: "미션 — 문장②", value: "신청 가능 여부 확인부터 사용계획서·제작·결과보고까지 한 번에 수행합니다." },
    { key: "vc_s2_line3", page: "index", sel: ".section2 .fill-text.line3", tag: "b", label: "미션 — 문장③", value: "기업은 본업에 집중하고, 완성도 높은 디자인은 그대로 남습니다." },

    /* ───── 메인 · Our Centers ───── */
    { key: "vc_s3_eg", page: "index", sel: ".section3 .tit-box > b", tag: "b", label: "센터 — 라벨", value: "Our Centers" },
    { key: "vc_s3_t", page: "index", sel: ".section3 .tit-box h3", tag: "b", label: "센터 — 제목", value: "We Pursue\nProfessionalism" },
    { key: "vc_center1_t", page: "index", sel: ".section3 .imgbox li:nth-child(1) .txt b", tag: "b", label: "센터① — 이름", value: "디자인센터" },
    { key: "vc_center1_d", page: "index", sel: ".section3 .imgbox li:nth-child(1) .txt em", tag: "b", label: "센터① — 설명", value: "브랜드·인쇄·편집 디자인 전문 센터" },
    { key: "vc_center2_t", page: "index", sel: ".section3 .imgbox li:nth-child(2) .txt b", tag: "b", label: "센터② — 이름", value: "웹구축센터" },
    { key: "vc_center2_d", page: "index", sel: ".section3 .imgbox li:nth-child(2) .txt em", tag: "b", label: "센터② — 설명", value: "홈페이지·쇼핑몰 구축 전문 센터" },
    { key: "vc_center3_t", page: "index", sel: ".section3 .imgbox li:nth-child(3) .txt b", tag: "b", label: "센터③ — 이름", value: "스튜디오센터" },
    { key: "vc_center3_d", page: "index", sel: ".section3 .imgbox li:nth-child(3) .txt em", tag: "b", label: "센터③ — 설명", value: "제품·푸드·뷰티 촬영 전문 스튜디오" },
    { key: "vc_center4_t", page: "index", sel: ".section3 .imgbox li:nth-child(4) .txt b", tag: "b", label: "센터④ — 이름", value: "마케팅센터" },
    { key: "vc_center4_d", page: "index", sel: ".section3 .imgbox li:nth-child(4) .txt em", tag: "b", label: "센터④ — 설명", value: "온라인 통합 마케팅 솔루션" },

    /* ───── 메인 · Who We Are ───── */
    { key: "vc_s7_eg", page: "index", sel: "#s-about .tit-box > b", tag: "b", label: "소개 — 라벨", value: "Who We Are" },
    { key: "vc_s7_line1", page: "index", sel: "#s-about .fill-text.line1", tag: "b", label: "소개 — 문장①", value: "하오디자인은 5년 연속 정부 핵심사업 공식 디자인 수행기관으로, 412건 이상의 바우처 디자인을 수행했습니다." },
    { key: "vc_s7_line2", page: "index", sel: "#s-about .fill-text.line2", tag: "b", label: "소개 — 문장②", value: "복잡한 신청 절차는 우리가, 좋은 디자인은 기업에게. 결과보고까지 책임지는 파트너가 되겠습니다." },

    /* ───── 메인 · 바우처 칼럼(Story) ───── */
    { key: "vc_s8_eg", page: "index", sel: ".section8 .tit-box > b", tag: "b", label: "칼럼 — 라벨", value: "Story From HAO" },
    { key: "vc_s8_t", page: "index", sel: ".section8 .tit-box h3", tag: "b", label: "칼럼 — 제목", value: "바우처 칼럼" },
    { key: "vc_board1_t", page: "index", sel: ".section8 .board-card:nth-child(1) .board-title", tag: "b", label: "칼럼카드① — 제목", value: "수출바우처, 디자인 분야 100% 활용하는 법" },
    { key: "vc_board1_d", page: "index", sel: ".section8 .board-card:nth-child(1) .board-desc", tag: "b", label: "칼럼카드① — 설명", value: "정부지원 디자인을 200% 활용하는 노하우" },
    { key: "vc_board2_t", page: "index", sel: ".section8 .board-card:nth-child(2) .board-title", tag: "b", label: "칼럼카드② — 제목", value: "2026 제조혁신바우처 신청 가이드" },
    { key: "vc_board2_d", page: "index", sel: ".section8 .board-card:nth-child(2) .board-desc", tag: "b", label: "칼럼카드② — 설명", value: "신청 자격부터 일정까지 한눈에" },
    { key: "vc_board3_t", page: "index", sel: ".section8 .board-card:nth-child(3) .board-title", tag: "b", label: "칼럼카드③ — 제목", value: "판로개척지원사업으로 상세페이지 만들기" },
    { key: "vc_board3_d", page: "index", sel: ".section8 .board-card:nth-child(3) .board-desc", tag: "b", label: "칼럼카드③ — 설명", value: "전환율 높이는 상세페이지 기획" },
    { key: "vc_board4_t", page: "index", sel: ".section8 .board-card:nth-child(4) .board-title", tag: "b", label: "칼럼카드④ — 제목", value: "바우처 사용계획서 작성 핵심 포인트" },
    { key: "vc_board4_d", page: "index", sel: ".section8 .board-card:nth-child(4) .board-desc", tag: "b", label: "칼럼카드④ — 설명", value: "선정 확률 높이는 작성 팁" },
    { key: "vc_board5_t", page: "index", sel: ".section8 .board-card:nth-child(5) .board-title", tag: "b", label: "칼럼카드⑤ — 제목", value: "결과보고, 이것만 알면 끝납니다" },
    { key: "vc_board5_d", page: "index", sel: ".section8 .board-card:nth-child(5) .board-desc", tag: "b", label: "칼럼카드⑤ — 설명", value: "증빙·정산 실수 없이 마무리하기" },

    /* ───── 메인 · 포트폴리오 ───── */
    { key: "vc_s9_eg", page: "index", sel: "#s-portfolio .tit-box > b", tag: "b", label: "포트폴리오 — 라벨", value: "Our Portfolios" },
    { key: "vc_s9_t1", page: "index", sel: "#s-portfolio .tit-box h3:nth-of-type(1)", tag: "b", label: "포트폴리오 — 제목①", value: "We are HAO" },
    { key: "vc_s9_t2", page: "index", sel: "#s-portfolio .tit-box h3:nth-of-type(2)", tag: "b", label: "포트폴리오 — 제목②", value: "Design" },
    { key: "vc_s9_line1", page: "index", sel: "#s-portfolio .fill-text.line1", tag: "b", label: "포트폴리오 — 설명", value: "정부지원사업으로 완성한 하오디자인의 결과물을 만나보세요." },
    { key: "vc_pf1_c", page: "index", sel: "#s-portfolio .pf-card:nth-child(1) .pf-cat", tag: "b", label: "PF카드① — 분류", value: "카탈로그 디자인" },
    { key: "vc_pf1_t", page: "index", sel: "#s-portfolio .pf-card:nth-child(1) .pf-title", tag: "b", label: "PF카드① — 제목", value: "영문 카탈로그" },
    { key: "vc_pf2_c", page: "index", sel: "#s-portfolio .pf-card:nth-child(2) .pf-cat", tag: "b", label: "PF카드② — 분류", value: "홍보 디자인" },
    { key: "vc_pf2_t", page: "index", sel: "#s-portfolio .pf-card:nth-child(2) .pf-title", tag: "b", label: "PF카드② — 제목", value: "도시정비사업 안내서" },
    { key: "vc_pf3_c", page: "index", sel: "#s-portfolio .pf-card:nth-child(3) .pf-cat", tag: "b", label: "PF카드③ — 분류", value: "카탈로그 디자인" },
    { key: "vc_pf3_t", page: "index", sel: "#s-portfolio .pf-card:nth-child(3) .pf-title", tag: "b", label: "PF카드③ — 제목", value: "전력설비 기술 카탈로그" },
    { key: "vc_pf4_c", page: "index", sel: "#s-portfolio .pf-card:nth-child(4) .pf-cat", tag: "b", label: "PF카드④ — 분류", value: "브로슈어 디자인" },
    { key: "vc_pf4_t", page: "index", sel: "#s-portfolio .pf-card:nth-child(4) .pf-title", tag: "b", label: "PF카드④ — 제목", value: "식품 다국어 브로슈어" },
    { key: "vc_pf5_c", page: "index", sel: "#s-portfolio .pf-card:nth-child(5) .pf-cat", tag: "b", label: "PF카드⑤ — 분류", value: "상세페이지 디자인" },
    { key: "vc_pf5_t", page: "index", sel: "#s-portfolio .pf-card:nth-child(5) .pf-title", tag: "b", label: "PF카드⑤ — 제목", value: "뷰티 디바이스 상세페이지" },
    { key: "vc_pf6_c", page: "index", sel: "#s-portfolio .pf-card:nth-child(6) .pf-cat", tag: "b", label: "PF카드⑥ — 분류", value: "패키지 디자인" },
    { key: "vc_pf6_t", page: "index", sel: "#s-portfolio .pf-card:nth-child(6) .pf-title", tag: "b", label: "PF카드⑥ — 제목", value: "건강식품 패키지" },
    { key: "vc_pf7_c", page: "index", sel: "#s-portfolio .pf-card:nth-child(7) .pf-cat", tag: "b", label: "PF카드⑦ — 분류", value: "제품 촬영" },
    { key: "vc_pf7_t", page: "index", sel: "#s-portfolio .pf-card:nth-child(7) .pf-title", tag: "b", label: "PF카드⑦ — 제목", value: "생활용품 제품 촬영" },
    { key: "vc_pf8_c", page: "index", sel: "#s-portfolio .pf-card:nth-child(8) .pf-cat", tag: "b", label: "PF카드⑧ — 분류", value: "회사소개서" },
    { key: "vc_pf8_t", page: "index", sel: "#s-portfolio .pf-card:nth-child(8) .pf-title", tag: "b", label: "PF카드⑧ — 제목", value: "산업기자재 회사소개서" },

    /* ───── 메인 · 문의(CTA) ───── */
    { key: "vc_ct_tag", page: "index", sel: "#contact .contact__tag", tag: "b", label: "문의 — 라벨", value: "START A PROJECT" },
    { key: "vc_ct_title", page: "index", sel: "#contact .contact__title", tag: "b", label: "문의 — 큰 제목", value: "정부지원 디자인,\n무료로 시작해볼까요?" },
    { key: "vc_ct_desc", page: "index", sel: "#contact .contact__desc", tag: "b", label: "문의 — 설명", value: "신청 가능 여부부터 무료로 확인해 드립니다.\n담당자가 확인 후 빠르게 연락드립니다." },

    /* ───── 공통 · 푸터 ───── */
    { key: "vc_footer_tag", page: "all", sel: ".footer__top p", tag: "b", label: "푸터 소개 문구", value: "정부지원사업 공식 디자인 수행기관\n수출바우처 · 혁신바우처 · 판로개척지원사업" },

    { key: "col_title", page: "column", sel: "#listView .subhero__title", tag: "b", label: "상단 제목", value: "Column" },
    { key: "col_desc", page: "column", sel: "#listView .subhero__desc", tag: "b", label: "상단 설명", value: "바우처 신청부터 결과보고까지, 실무에 바로 쓰는 정부지원사업 이야기를 전합니다." },
    { key: "qna_title", page: "qna", sel: ".subhero__title", tag: "b", label: "상단 제목", value: "자주 하는 질문" },
    { key: "qna_ptitle", page: "qna", sel: ".page__title", tag: "b", label: "섹션 제목", value: "무엇이 궁금하신가요" },

    /* ───── 수출바우처 ───── */
    { key: "ex_title", page: "export", sel: ".subhero__title", tag: "b", label: "상단 제목", value: "수출바우처" },
    { key: "ex_desc", page: "export", sel: ".subhero__desc", tag: "b", label: "상단 설명", value: "수출역량에 맞는 지원 서비스를 바우처로 자유롭게 — 수출지원기반활용사업." },

    /* ───── 혁신바우처 ───── */
    { key: "in_title", page: "innovation", sel: ".subhero__title", tag: "b", label: "상단 제목", value: "혁신바우처" },
    { key: "in_desc", page: "innovation", sel: ".subhero__desc", tag: "b", label: "상단 설명", value: "진단 기반 맞춤형 지원으로 제조 중소기업의 경쟁력을 강화하는 중소기업 혁신바우처사업." },

    /* ───── 판로개척지원사업 ───── */
    { key: "mk_title", page: "market", sel: ".subhero__title", tag: "b", label: "상단 제목", value: "판로개척지원사업" },
    { key: "mk_desc", page: "market", sel: ".subhero__desc", tag: "b", label: "상단 설명", value: "국내외 판로 확대를 위한 전시·마케팅·홍보물 제작 지원 — 중소기업·소상공인 대상." }
  ];

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

  window.HAO = {
    imgSrc: imgSrc,
    ready: Promise.all([sbLoad(), loadHubAccounts()]),
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return sbSave(k, v); },
    remove: function (k) { localStorage.removeItem(k); return sbDelete(k); },
    uploadImage: sbUpload,

    getPosts: function () {
      var arr = load("hv_posts", DEFAULT_POSTS);
      arr.sort(function (a, b) { return (b.date || "").localeCompare(a.date || "") || (b.id - a.id); });
      return arr;
    },
    getQna: function () { return load("hv_qna", DEFAULT_QNA); },
    getLogo: function () { var v = localStorage.getItem("hv_logo"); try { v = JSON.parse(v); } catch (e) {} return (typeof v === "string" && v) ? v : "assets/img/logo.png"; },
    getSettings: function () { return loadObj("hv_settings", DEFAULT_SETTINGS); },
    getSocial: function () { return loadObj("hv_social", DEFAULT_SOCIAL); },
    getCopy: function () {
      var ov = loadObj("hv_copy", {});
      return DEFAULT_COPY.map(function (c) { var out = JSON.parse(JSON.stringify(c)); if (typeof ov[c.key] === "string") { out.value = ov[c.key]; out.ov = true; } return out; });
    },
    getSeo: function () {
      var ov = loadObj("hv_seo", {});
      var out = JSON.parse(JSON.stringify(DEFAULT_SEO));
      if (ov.siteUrl) out.siteUrl = ov.siteUrl;
      if (ov.ogImage) out.ogImage = ov.ogImage;
      if (ov.pages) Object.keys(ov.pages).forEach(function (p) {
        if (!out.pages[p]) out.pages[p] = {};
        Object.keys(ov.pages[p]).forEach(function (f) { out.pages[p][f] = ov.pages[p][f]; });
      });
      return out;
    },
    getHeadCode: function () { try { var v = JSON.parse(localStorage.getItem("hv_headcode")); return typeof v === "string" ? v : ""; } catch (e) { return ""; } },
    getAccounts: function () {
      try { var v = JSON.parse(localStorage.getItem("hv_accounts")); if (Array.isArray(v) && v.length) return v; } catch (e) {}
      var c = loadObj("hv_admin_cred", null);
      if (c && c.id) return [c];
      return [{ id: "admin", pw: "voucher1234" }];
    },
    saveAccounts: function (list) { return this.set("hv_accounts", list); },
    getCred: function () { return this.getAccounts()[0]; },
    verifyLogin: function (id, pw) {
      var hit = function (list) { return (list || []).some(function (a) { return a && a.id === id && a.pw === pw; }); };
      return hit(this.getAccounts()) || hit(HUB_ACCOUNTS);
    },
    getMail: function () { return loadObj("hv_mail", { on: false, url: "", to: "sales@haodesign.co.kr" }); },

    saveInquiry: function (q) {
      var m = this.getMail();
      var typed = INQ_TAG + " " + (q.type || "바우처 상담");
      var msg = (q.company ? "[" + q.company + "] " : "") + (q.message || "");
      var payload = { name: q.name, phone: q.phone, type: typed, message: msg, to: m.to || "", date: new Date().toLocaleString("ko-KR") };
      if (m && m.on && m.url) fetch(m.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(function () {});
      return fetch(SB_URL + "/rest/v1/inquiries", { method: "POST", headers: SB_H, body: JSON.stringify([{ name: q.name, phone: q.phone, type: typed, message: msg }]) });
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
    deleteInquiry: function (id) { return fetch(SB_URL + "/rest/v1/inquiries?id=eq." + id, { method: "DELETE", headers: SB_H }); },

    fmt: function (s, tag) {
      var esc = String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
      return esc.replace(/\*\*(.+?)\*\*/g, "<" + tag + ">$1</" + tag + ">").replace(/\n/g, "<br />");
    }
  };
})();
