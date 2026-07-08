/* ===================================================
   디자인센터 칼럼 정적 재생성 (굽기)
   - 관리자가 admin에서 HTML로 쓴 글(Supabase hao_posts)을 읽어
     column-{id}.html 정적 상세 페이지 + board.html 목록을 재생성한다.
   - Supabase에 글이 없으면 data.js의 기본 6편(DEFAULT_POSTS)을 사용.
   - 실행:  node bake-columns.js   (design 폴더에서)
   - 크롤러가 읽는 정적 HTML을 만들므로 AEO 유지. JS 렌더 아님.
=================================================== */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const DIR = __dirname;
const BASE = "https://leegunhee010.github.io/haod-new/design";
const SB_URL = "https://oaqrjrrgntlqmyxxovfn.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcXJqcnJnbnRscW15eHhvdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NjQzMTUsImV4cCI6MjA5NzE0MDMxNX0.3bOfZOXVKSoI9ELfE7ZjWETuxvjpNYHdCBSIMrbAGtU";

/* ---- data.js 로드해서 HAO(imgSrc, getPosts=DEFAULT_POSTS) 얻기 ---- */
function loadHAO() {
  const code = fs.readFileSync(path.join(DIR, "js", "data.js"), "utf8");
  const sandbox = {
    window: {}, console,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {}, length: 0, key: () => null },
    fetch: () => Promise.resolve({ ok: false, json: () => [] }),
    document: { head: { querySelector: () => null, appendChild() {} }, querySelector: () => null, querySelectorAll: () => [] },
    location: { pathname: "/board.html", search: "", href: "" },
    setTimeout, clearTimeout, Promise, JSON, Math, Date, RegExp, encodeURIComponent, decodeURIComponent,
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.HAO;
}

function escAttr(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function stripHtml(s) {
  return String(s == null ? "" : s).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
function jsonStr(s) { return JSON.stringify(String(s == null ? "" : s)); }

/* 현재 column-1.html에서 헤더/푸터/꼬리스크립트 추출(항상 최신 유지) */
function extractShell() {
  const c = fs.readFileSync(path.join(DIR, "column-1.html"), "utf8");
  const header = c.match(/<header class="header[\s\S]*?<\/header>/)[0];
  const footer = c.match(/<footer class="footer"[\s\S]*?<\/footer>/)[0];
  const tail = c.match(/<script>\(function\(\)\{var h=document\.getElementById[\s\S]*?<\/script>/)[0];
  const cssVer = (c.match(/css\/style\.css\?v=\d+/) || ["css/style.css?v=114"])[0];
  return { header, footer, tail, cssVer };
}

function bodyToHtml(p) {
  if (typeof p.bodyHtml === "string" && p.bodyHtml.trim()) return p.bodyHtml.trim();
  return (p.body || []).map((t) => "<p>" + escAttr(t).replace(/&quot;/g, "”") + "</p>").join("\n        ");
}

function buildColumn(p, prev, next, HAO, shell) {
  const title = p.title || "제목 없음";
  const summary = p.summary || stripHtml(bodyToHtml(p)).slice(0, 90);
  const rel = HAO.imgSrc(p.img || "");
  const imgAbs = /^https?:/.test(rel) ? rel : BASE + "/" + rel.replace(/^\.?\//, "");
  const articleBody = stripHtml(bodyToHtml(p));
  const blog = {
    "@context": "https://schema.org", "@type": "BlogPosting", headline: title,
    datePublished: p.date, dateModified: p.date, image: imgAbs, inLanguage: "ko",
    author: { "@type": "Organization", name: "하오커뮤니케이션 디자인팀", parentOrganization: { "@type": "Organization", name: "하오커뮤니케이션" } },
    publisher: { "@type": "Organization", name: "하오커뮤니케이션", logo: { "@type": "ImageObject", url: BASE + "/assets/img/logo.png" } },
    description: summary, mainEntityOfPage: BASE + "/column-" + p.id + ".html",
    articleBody: articleBody,
  };
  const crumb = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "디자인센터", item: BASE + "/" },
    { "@type": "ListItem", position: 2, name: "칼럼", item: BASE + "/board.html" },
    { "@type": "ListItem", position: 3, name: title, item: BASE + "/column-" + p.id + ".html" },
  ] };
  const prevLink = prev ? '<a href="column-' + prev.id + '.html" class="post__navlink post__navlink--prev"><span>이전 글</span><strong>' + escAttr(prev.title) + "</strong></a>" : "<span></span>";
  const nextLink = next ? '<a href="column-' + next.id + '.html" class="post__navlink post__navlink--next"><span>다음 글</span><strong>' + escAttr(next.title) + "</strong></a>" : "<span></span>";

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escAttr(title)} | 디자인센터 — 하오커뮤니케이션</title>
  <meta name="description" content="${escAttr(summary)}" />
  <link rel="canonical" href="${BASE}/column-${p.id}.html" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escAttr(title)}" />
  <meta property="og:description" content="${escAttr(summary)}" />
  <meta property="og:image" content="${imgAbs}" />
  <meta property="og:url" content="${BASE}/column-${p.id}.html" />
  <link rel="preconnect" href="https://cdn.jsdelivr.net" />
  <link rel="preconnect" href="${SB_URL}" crossorigin />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.css" />
  <link rel="stylesheet" href="${shell.cssVer}" />
  <script type="application/ld+json">
${JSON.stringify(blog)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(crumb)}
  </script>
</head>
<body>
  <div class="progress" id="progress" aria-hidden="true"></div>
  ${shell.header}
  <main>
    <section class="subhero subhero--post"><div class="subhero__inner">
      <p class="subhero__crumb"><a href="index.html">홈</a> / <a href="board.html">Column</a></p>
      <h1 class="subhero__title post-title">${escAttr(title)}</h1>
      <p class="subhero__desc">${escAttr(p.date)}</p></div></section>
    <section class="page page--tight"><article class="post">
      <div class="post__hero"><img src="${rel}" alt="${escAttr(title)}" /></div>
      <div class="post__body">
        ${bodyToHtml(p)}
      </div>
      <div class="post__nav">${prevLink}<a href="board.html" class="btn-round post__list"><span>목록으로</span></a>${nextLink}</div>
      <nav class="post__related" style="max-width:820px;margin:0 auto;padding:18px clamp(18px,4vw,24px);border-top:1px solid rgba(127,127,127,.2);font-size:.92rem">관련 페이지 — <a href="service.html">서비스 안내</a> · <a href="work.html">포트폴리오</a> · <a href="board.html">칼럼 더보기</a> · <a href="contact.html">견적 문의</a></nav>
    </article></section>
  </main>
  ${shell.footer}
  ${shell.tail}
</body>
</html>
`;
}

function buildBoardGallery(posts, HAO) {
  return posts.map((p) => {
    const rel = HAO.imgSrc(p.img || "");
    const badge = p.isNew ? '<span class="gcard__badge">NEW</span>' : "";
    return '<article class="gcard" data-id="' + p.id + '"><div class="gcard__thumb"><img src="' + rel + '" alt="" loading="lazy">' + badge +
      '</div><div class="gcard__body"><h3><a href="column-' + p.id + '.html">' + escAttr(p.title) + "</a></h3><p>" + escAttr(p.summary || "") +
      '</p><span class="gcard__date">' + escAttr(p.date) + "</span></div></article>";
  }).join("");
}

(async function main() {
  const HAO = loadHAO();
  let posts = HAO.getPosts();
  try {
    const res = await fetch(SB_URL + "/rest/v1/overrides?select=v&k=eq.hao_posts", { headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY } });
    if (res.ok) { const rows = await res.json(); if (rows[0] && Array.isArray(rows[0].v) && rows[0].v.length) { posts = rows[0].v; console.log("Supabase hao_posts 사용:", posts.length, "편"); } else console.log("Supabase 비어있음 → 기본 6편 사용"); }
  } catch (e) { console.log("Supabase 조회 실패 → 기본 사용:", e.message); }

  const shell = extractShell();
  // 상세: id 오름차순으로 이전/다음
  const byId = posts.slice().sort((a, b) => a.id - b.id);
  byId.forEach((p, i) => {
    const html = buildColumn(p, byId[i - 1], byId[i + 1], HAO, shell);
    fs.writeFileSync(path.join(DIR, "column-" + p.id + ".html"), html);
    console.log("  구움: column-" + p.id + ".html  (" + p.title + ")");
  });

  // 목록(board.html): 최신(날짜/ id 내림차순)
  const byNew = posts.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "") || b.id - a.id);
  const boardPath = path.join(DIR, "board.html");
  let board = fs.readFileSync(boardPath, "utf8");
  const gallery = buildBoardGallery(byNew, HAO);
  board = board.replace(/(<div class="gallery-board" id="galleryBoard">)[\s\S]*?(<\/div>\s*<\/section>)/, "$1" + gallery + "$2");
  fs.writeFileSync(boardPath, board);
  console.log("  구움: board.html 목록 " + byNew.length + "편");
  console.log("완료. git add/commit/push 하면 배포됩니다.");
})();
