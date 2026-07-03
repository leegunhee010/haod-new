/* HAO 공통 플로팅 빠른버튼 — 디자인센터와 동일 (카카오·인스타·블로그·전화) */
(function () {
  function init() {
    /* 기존/구버전 FAB 제거 후 통일본 주입 */
    document.querySelectorAll(".fab").forEach(function (el) { el.remove(); });
    var S = { kakao: "https://pf.kakao.com/_exlVrxd", instagram: "https://www.instagram.com/haodesign_official/", blog: "https://blog.naver.com/xmfostlsh2", phone: "1666-2027" };
    try { if (window.HAO && HAO.getSocial) { var o = HAO.getSocial(); ["kakao","instagram","blog","phone"].forEach(function(k){ if (o && o[k]) S[k] = o[k]; }); } } catch (e) {}
    var ICON = {
      kakao: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4C7 4 3 7.1 3 10.9c0 2.4 1.6 4.6 4.1 5.8-.2.6-.6 2.2-.7 2.6 0 .3.1.4.4.2.2-.1 2.5-1.7 3.5-2.4.5.1 1.1.1 1.7.1 5 0 9-3.1 9-6.9S17 4 12 4z" fill="currentColor"/></svg>',
      instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>',
      blog: '<span class="fab__txt">blog</span>',
      phone: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .7-.2 1l-2.3 2.2z"/></svg>'
    };
    var items = [
      { k: "kakao", href: S.kakao, label: "카카오톡 상담" },
      { k: "instagram", href: S.instagram, label: "인스타그램" },
      { k: "blog", href: S.blog, label: "블로그" },
      { k: "phone", href: S.phone ? "tel:" + String(S.phone).replace(/[^0-9]/g, "") : "", label: "전화 상담" }
    ].filter(function (it) { return it.href; });
    if (!items.length) return;
    var fab = document.createElement("div");
    fab.className = "fab"; fab.id = "fab";
    fab.innerHTML = items.map(function (it) {
      var ext = it.k === "phone" ? "" : ' target="_blank" rel="noopener"';
      return '<a class="fab__btn fab--' + it.k + '" href="' + it.href + '"' + ext + ' aria-label="' + it.label + '">' +
        '<span class="fab__label">' + it.label + '</span><span class="fab__ico">' + ICON[it.k] + '</span></a>';
    }).join("");
    document.body.appendChild(fab);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
