/* ===================================================
   HAO MKT (마케팅센터) — 공개 페이지 부트
   data.js(HAO)의 오버라이드를 페이지 DOM에 적용:
   설정(전화·메일) · 로고 · SEO 메타 · 맞춤 HEAD 코드 · 히어로 · 카피(선택자 매핑).
=================================================== */
(function () {
  "use strict";
  if (!window.HAO) return;

  var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  var page = file.replace(/\.html?$/, "") || "index";

  function apply() {
    /* 연락처 */
    try {
      var st = HAO.getSettings();
      var telDigits = (st.tel || "").replace(/[^0-9]/g, "");
      document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
        a.setAttribute("href", "tel:" + telDigits);
        if ((a.textContent || "").replace(/[^0-9-]/g, "").length >= 4 && !a.querySelector("*")) a.textContent = st.tel;
      });
      document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
        a.setAttribute("href", "mailto:" + st.email);
        if ((a.textContent || "").indexOf("@") >= 0 && !a.querySelector("*")) a.textContent = st.email;
      });
    } catch (e) {}

    /* 로고 (헤더 + 푸터, 동일 logo.png) */
    try {
      var logo = HAO.getLogo();
      if (logo && logo !== "assets/img/logo.png") {
        document.querySelectorAll(".brand__logo, .footer__logo").forEach(function (img) { img.src = logo; });
      }
    } catch (e) {}

    /* 메인 히어로 */
    try {
      if (page === "index") {
        var h = (HAO.getHero() || [])[0];
        if (h) {
          var lead = document.querySelector(".hero__lead");
          if (lead) {
            var spans = lead.querySelectorAll("span");
            if (spans[0] && h.lead1 != null) spans[0].textContent = h.lead1;
            if (spans[1] && h.lead2 != null) spans[1].textContent = h.lead2;
          }
          var sub = document.querySelector(".hero__sub");
          if (sub && h.sub != null) sub.textContent = h.sub;
        }
      }
    } catch (e) {}

    /* SEO 메타 */
    try {
      var seo = HAO.getSeo();
      var p = (seo.pages && seo.pages[page]) || null;
      var base = (seo.siteUrl || "").replace(/\/$/, "");
      var abs = function (u) { return /^https?:/.test(u) ? u : (base + "/" + String(u || "").replace(/^\.?\//, "").replace(/^\.\.\//, "")); };
      function meta(sel, attr, key, val) {
        if (val == null) return;
        var el = document.head.querySelector(sel);
        if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
        el.setAttribute("content", val);
      }
      if (p) {
        if (p.title) document.title = p.title;
        meta('meta[name="description"]', "name", "description", p.desc);
        if (p.keywords) meta('meta[name="keywords"]', "name", "keywords", p.keywords);
        if (p.noindex) meta('meta[name="robots"]', "name", "robots", "noindex, nofollow");
        var ogImg = abs(p.ogImage || seo.ogImage);
        meta('meta[property="og:title"]', "property", "og:title", p.title);
        meta('meta[property="og:description"]', "property", "og:description", p.desc);
        meta('meta[property="og:image"]', "property", "og:image", ogImg);
        meta('meta[property="og:type"]', "property", "og:type", "website");
        if (base) {
          var url = base + "/mkt/" + (page === "index" ? "" : file);
          meta('meta[property="og:url"]', "property", "og:url", url);
          var can = document.head.querySelector('link[rel="canonical"]');
          if (!can) { can = document.createElement("link"); can.setAttribute("rel", "canonical"); document.head.appendChild(can); }
          can.setAttribute("href", url);
        }
      }
    } catch (e) {}

    /* 맞춤 HEAD 코드 */
    try {
      if (!document.getElementById("hmHeadCode")) {
        var code = HAO.getHeadCode();
        if (code && code.trim()) {
          var wrap = document.createElement("div");
          wrap.innerHTML = code;
          [].slice.call(wrap.childNodes).forEach(function (node) {
            if (node.tagName === "SCRIPT") {
              var s = document.createElement("script");
              [].forEach.call(node.attributes, function (a) { s.setAttribute(a.name, a.value); });
              s.text = node.text; s.id = s.id || "hmHeadCode"; document.head.appendChild(s);
            } else if (node.nodeType === 1) {
              document.head.appendChild(node.cloneNode(true));
            }
          });
          var flag = document.createElement("meta"); flag.id = "hmHeadCode"; document.head.appendChild(flag);
        }
      }
    } catch (e) {}

    /* 카피 (선택자 매핑) */
    try {
      HAO.getCopy().forEach(function (c) {
        if (c.page !== "all" && c.page !== page) return;
        document.querySelectorAll(c.sel).forEach(function (el) {
          if (c.attr) { el.setAttribute(c.attr, c.value); return; }
          el.innerHTML = HAO.fmt(c.value, c.tag || "b");
        });
      });
    } catch (e) {}
  }

  if (HAO.ready && HAO.ready.then) HAO.ready.then(apply); else apply();
})();
