/* ===================================================
   HAOC STUDIO — 공개 페이지 부트
   data.js(HAO)의 오버라이드를 페이지 DOM에 적용:
   설정(전화·메일) · SEO 메타 · 맞춤 HEAD 코드 · 카피(선택자 매핑).
   각 페이지의 기존 인라인 스크립트(애니메이션 등)와 별개로 동작.
=================================================== */
(function () {
  "use strict";
  if (!window.HAO) return;

  /* 현재 페이지 이름 (파일명, 확장자 제외) */
  var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  var page = file.replace(/\.html?$/, "") || "index";

  function apply() {
    /* ---- 연락처(전화·메일) ---- */
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

    /* ---- 로고 ---- */
    try {
      var logo = HAO.getLogo();
      if (logo && logo !== "assets/img/logo.png") {
        document.querySelectorAll(".brand__logo").forEach(function (img) { img.src = logo; });
      }
    } catch (e) {}

    /* ---- SEO 메타 ---- */
    try {
      var seo = HAO.getSeo();
      var p = (seo.pages && seo.pages[page]) || null;
      var base = (seo.siteUrl || "").replace(/\/$/, "");
      var abs = function (u) { return /^https?:/.test(u) ? u : (base + "/" + String(u || "").replace(/^\//, "")); };
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
          var url = base + "/studio/" + (page === "index" ? "" : file);
          meta('meta[property="og:url"]', "property", "og:url", url);
          var can = document.head.querySelector('link[rel="canonical"]');
          if (!can) { can = document.createElement("link"); can.setAttribute("rel", "canonical"); document.head.appendChild(can); }
          can.setAttribute("href", url);
        }
      }
    } catch (e) {}

    /* ---- 맞춤 HEAD 코드 (서치콘솔 인증·애널리틱스 등) ---- */
    try {
      if (!document.getElementById("hsHeadCode")) {
        var code = HAO.getHeadCode();
        if (code && code.trim()) {
          var wrap = document.createElement("div");
          wrap.innerHTML = code;
          [].slice.call(wrap.childNodes).forEach(function (node) {
            if (node.tagName === "SCRIPT") {
              var s = document.createElement("script");
              [].forEach.call(node.attributes, function (a) { s.setAttribute(a.name, a.value); });
              s.text = node.text; s.id = s.id || "hsHeadCode"; document.head.appendChild(s);
            } else if (node.nodeType === 1) {
              document.head.appendChild(node.cloneNode(true));
            }
          });
          var flag = document.createElement("meta"); flag.id = "hsHeadCode"; document.head.appendChild(flag);
        }
      }
    } catch (e) {}

    /* ---- 카피 (선택자 매핑) ---- */
    try {
      HAO.getCopy().forEach(function (c) {
        if (c.page !== "all" && c.page !== page) return;
        document.querySelectorAll(c.sel).forEach(function (el) {
          if (c.attr) { el.setAttribute(c.attr, c.value); return; }
          if (c.list) {
            var it = c.item || "span";
            el.innerHTML = c.value.split("|").map(function (s) { return "<" + it + ">" + HAO.fmt(s.trim(), c.tag || "b") + "</" + it + ">"; }).join("");
          } else {
            el.innerHTML = HAO.fmt(c.value, c.tag || "b");
          }
        });
      });
    } catch (e) {}

    
    /* ---- 페이지 사진 (선택자 매핑, 관리자 '서비스 사진') ---- */
    try {
      if (HAO.getImgs) HAO.getImgs().forEach(function (c) {
        if (c.page !== "all" && c.page !== page) return;
        document.querySelectorAll(c.sel).forEach(function (el) {
          if (el.tagName === "IMG") el.src = HAO.imgSrc ? HAO.imgSrc(c.value) : c.value;
        });
      });
    } catch (e) {}

    /* ---- 사이트에서 바로 수정 (관리자 ?edit=1) ---- */
    try {
      if (/[?&]edit=1/.test(location.search) && localStorage.getItem("hs_edit") === "1") startEditMode("hs_copy");
    } catch (e) {}
  }

  /* 화면에서 카피를 직접 클릭해 고치는 인라인 편집 모드 (관리자 전용) */
  function startEditMode(copyKey) {
    var edited = {}, marked = [];
    HAO.getCopy().forEach(function (c) {
      if (c.page !== "all" && c.page !== page) return;
      if (c.attr || c.list) return; /* 숫자·목록 카피는 관리자 폼에서 수정 */
      var el = document.querySelector(c.sel);
      if (!el) return;
      el.dataset.haoKey = c.key;
      el.dataset.haoTag = c.tag || "b";
      el.setAttribute("contenteditable", "true");
      el.setAttribute("spellcheck", "false");
      el.classList.add("hao-editable");
      el.addEventListener("input", function () { edited[c.key] = true; updateBar(); });
      marked.push(el);
    });
    var st = document.createElement("style");
    st.textContent =
      ".hao-editable{outline:2px dashed rgba(232,56,23,.55);outline-offset:3px;border-radius:3px;cursor:text;}" +
      ".hao-editable:hover{outline:2px solid #e83817;}" +
      ".hao-editable:focus{outline:2px solid #e83817;background:rgba(232,56,23,.06);}" +
      "*{animation-play-state:paused !important;}" +
      "#haoEditBar{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:99999;display:flex;gap:12px;align-items:center;background:#17150f;color:#fff;padding:12px 14px 12px 22px;border-radius:999px;font-size:14px;font-family:system-ui,sans-serif;box-shadow:0 18px 44px -16px rgba(0,0,0,.55);white-space:nowrap;}" +
      "#haoEditBar b{color:#ff9472;}" +
      "#haoEditBar button{font-family:inherit;font-size:13.5px;font-weight:700;border:0;border-radius:999px;padding:9px 18px;cursor:pointer;}" +
      "#haoEditBar .sv{background:#e83817;color:#fff;}#haoEditBar .sv:hover{background:#f25b35;}" +
      "#haoEditBar .ex{background:rgba(255,255,255,.14);color:#fff;}";
    document.head.appendChild(st);
    var bar = document.createElement("div");
    bar.id = "haoEditBar";
    bar.innerHTML = '<span>✏️ 바로 수정 — 점선 글을 클릭해 고치세요 (<b id="haoEditCnt">0</b>곳)</span>' +
      '<button class="sv" id="haoEditSave">저장</button><button class="ex" id="haoEditExit">나가기</button>';
    document.body.appendChild(bar);
    function updateBar() { var c = document.getElementById("haoEditCnt"); if (c) c.textContent = Object.keys(edited).length; }
    function unfmt(el, tag) {
      var html = el.innerHTML.replace(/<br\s*\/?>/gi, "\n").replace(/<div[^>]*>/gi, "\n").replace(/<\/div>/gi, "");
      if (tag) html = html.replace(new RegExp("<" + tag + "(\\s[^>]*)?>", "gi"), "**").replace(new RegExp("</" + tag + ">", "gi"), "**");
      var tmp = document.createElement("div"); tmp.innerHTML = html;
      return (tmp.textContent || "").replace(/ /g, " ").trim();
    }
    document.getElementById("haoEditSave").addEventListener("click", function () {
      var ov = {}; try { ov = JSON.parse(localStorage.getItem(copyKey)) || {}; } catch (e) {}
      marked.forEach(function (el) { var k = el.dataset.haoKey; if (!edited[k]) return; ov[k] = unfmt(el, el.dataset.haoTag); });
      var btn = this, label = btn.textContent; btn.disabled = true; btn.textContent = "저장 중…";
      var finish = function (ok) {
        btn.disabled = false; btn.textContent = label;
        if (ok) { edited = {}; updateBar(); alert("저장되었습니다. 새로고침해도 유지되고 모든 방문자에게 반영됩니다."); }
        else alert("로컬에는 저장됐지만 서버 반영에 실패했어요. 연결을 확인하고 다시 저장해주세요.");
      };
      try { localStorage.setItem(copyKey, JSON.stringify(ov)); } catch (e) {}
      if (HAO.set) HAO.set(copyKey, ov).then(function () { finish(true); }).catch(function () { finish(false); });
      else finish(true);
    });
    document.getElementById("haoEditExit").addEventListener("click", function () { location.href = location.pathname; });
  }

  if (HAO.ready && HAO.ready.then) HAO.ready.then(apply); else apply();
})();
