/* =====================================================================
   칼럼 글 → 개별 정적 HTML 생성 (SSG)  +  Article / Breadcrumb JSON-LD
   ---------------------------------------------------------------------
   사용법:  node tools/build-columns.js
   - 각 센터의 칼럼 데이터(js/data.js · js/posts.js)를 읽어
     {center}/column-{id}.html 정적 페이지를 다시 생성합니다.
   - 관리자에서 칼럼을 추가/수정한 뒤 이 스크립트를 한 번 실행하면
     검색·AI용 정적 페이지가 최신 내용으로 갱신됩니다.
   - sitemap.xml 에도 칼럼 글 URL을 추가(중복 시 건너뜀).
===================================================================== */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const BASE = "https://haodesign.co.kr";

const CENTERS = [
  { key:"design",  list:"board.html",  data:"js/data.js",  label:"디자인센터" },
  { key:"studio",  list:"column.html", data:"js/data.js",  label:"스튜디오센터" },
  { key:"web",     list:"column.html", data:"js/data.js",  label:"웹구축센터" },
  { key:"voucher", list:"column.html", data:"js/data.js",  label:"정부사업지원센터" },
  { key:"mkt",     list:"column.html", data:"js/posts.js", label:"마케팅센터", mkt:true }
];

function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }

function sandbox(){
  const sb = {};
  sb.window = sb;
  sb.localStorage = { length:0, getItem(){return null;}, setItem(){}, removeItem(){}, key(){return null;} };
  sb.fetch = function(){ return Promise.resolve({ok:false,json(){return Promise.resolve([]);}}); };
  sb.setTimeout = function(){return 0;}; sb.clearTimeout=function(){};
  sb.document = { head:{querySelector(){return null;},appendChild(){}}, querySelector(){return null;}, querySelectorAll(){return [];}, createElement(){return {setAttribute(){},appendChild(){},style:{}};} };
  sb.location = { pathname:"/", search:"", href:"" };
  sb.console=console; sb.JSON=JSON; sb.Math=Math; sb.Date=Date; sb.Promise=Promise;
  sb.encodeURIComponent=encodeURIComponent; sb.parseInt=parseInt; sb.Array=Array; sb.Object=Object; sb.String=String; sb.RegExp=RegExp;
  vm.createContext(sb); return sb;
}
function loadPosts(center){
  const code = fs.readFileSync(path.join(ROOT, center.key, center.data), "utf8");
  const sb = sandbox();
  vm.runInContext(code, sb, { filename:center.data });
  if (center.mkt) {
    const arr = sb.MKT_POSTS || (sb.window && sb.window.MKT_POSTS) || [];
    return arr.map(function(p){ return { id:p.id, title:p.t, summary:p.d, date:p.date, img:p.img, body:p.body||[], cat:p.cat }; });
  }
  const hao = sb.HAO || sb.window.HAO;
  return (hao && hao.getPosts) ? hao.getPosts() : [];
}
function extract(html, re){ const m = html.match(re); return m ? m[0] : ""; }
function cssLinks(head){
  const out = []; const re = /<link\b[^>]*rel="(?:stylesheet|preconnect)"[^>]*>/gi;
  let m; while((m = re.exec(head))) out.push(m[0]); return out.join("\n  ");
}
function absUrl(img, center){ try { return new URL(img, BASE + "/" + center + "/").href; } catch(e){ return BASE + "/" + center + "/" + img; } }

const HEADER_JS =
'<script>(function(){var h=document.getElementById("header");function s(){if(h)h.classList.toggle("is-stuck",(window.scrollY||0)>24);}addEventListener("scroll",s,{passive:true});s();var b=document.getElementById("burger"),n=document.getElementById("nav");if(b&&n)b.addEventListener("click",function(){n.classList.toggle("is-open");document.body.classList.toggle("menu-open");});var y=document.getElementById("year");if(y)y.textContent=new Date().getFullYear();})();<\/script>';

let sitemapEntries = [], totalPages = 0;

CENTERS.forEach(function(center){
  const listPath = path.join(ROOT, center.key, center.list);
  if (!fs.existsSync(listPath)) { console.log("MISSING list", center.key); return; }
  const listHtml = fs.readFileSync(listPath, "utf8");
  const headPart = listHtml.split(/<\/head>/i)[0] || "";
  const css = cssLinks(headPart);
  const header = extract(listHtml, /<header[\s\S]*?<\/header>/i);
  const footer = extract(listHtml, /<footer[\s\S]*?<\/footer>/i);
  let extraStyle = "";
  if (center.mkt) extraStyle = extract(fs.readFileSync(path.join(ROOT,"mkt","detail.html"),"utf8"), /<style>[\s\S]*?<\/style>/i);

  const posts = loadPosts(center).slice();
  if (!posts.length) { console.log("NO posts", center.key); return; }

  posts.forEach(function(post, i){
    const prev = posts[i+1], next = posts[i-1];
    const file = "column-" + post.id + ".html";
    const canonical = BASE + "/" + center.key + "/" + file;
    const iso = String(post.date||"").replace(/\./g,"-");
    const bodyArr = (post.body && post.body.length) ? post.body : (post.summary ? [post.summary] : []);
    const bodyHtml = bodyArr.map(function(p){ return "<p>" + esc(p) + "</p>"; }).join("\n        ");
    const absImg = absUrl(post.img, center.key);
    const article = { "@context":"https://schema.org","@type":"BlogPosting", headline:post.title, datePublished:iso, dateModified:iso, image:absImg, inLanguage:"ko",
      author:{ "@type":"Organization", name:"하오디자인" }, publisher:{ "@type":"Organization", name:"하오디자인", logo:{ "@type":"ImageObject", url:BASE+"/design/assets/img/logo.png" } },
      description:post.summary||"", articleBody:bodyArr.join("\n\n"), mainEntityOfPage:canonical };
    const crumb = { "@context":"https://schema.org","@type":"BreadcrumbList", itemListElement:[
      { "@type":"ListItem", position:1, name:center.label, item:BASE+"/"+center.key+"/" },
      { "@type":"ListItem", position:2, name:"칼럼", item:BASE+"/"+center.key+"/"+center.list },
      { "@type":"ListItem", position:3, name:post.title, item:canonical } ] };

    let main;
    if (center.mkt) {
      main = '  <main id="top">\n    <section class="subhero"><span class="subhero__glow" aria-hidden="true"></span>\n      <p class="crumb"><a href="index.html">'+esc(center.label)+'</a> / <a href="'+center.list+'">칼럼</a></p>\n      <h1 class="subhero__title">마케팅 칼럼</h1></section>\n    <article class="post">\n      <div class="post__top"><span class="post__cat">'+esc(post.cat||"")+'</span><span class="post__date">'+esc(post.date)+'</span></div>\n      <h2 class="post__title">'+esc(post.title)+'</h2>\n      <div class="post__hero"><img src="'+esc(post.img)+'" alt="'+esc(post.title)+'" /></div>\n      <div class="post__body">\n        '+bodyHtml+'\n      </div>\n      <div class="post__cta"><a class="post__back" href="'+center.list+'">← 칼럼 목록으로</a>'+(next?'<a class="pillbtn pillbtn--dark" href="column-'+next.id+'.html">다음 글 →</a>':'')+'</div>\n    </article>\n  </main>';
    } else {
      const navLinks = (prev?'<a href="column-'+prev.id+'.html" class="post__navlink"><span>이전 글</span><strong>'+esc(prev.title)+'</strong></a>':'<span></span>') + '<a href="'+center.list+'" class="btn-round post__list"><span>목록으로</span></a>' + (next?'<a href="column-'+next.id+'.html" class="post__navlink post__navlink--next"><span>다음 글</span><strong>'+esc(next.title)+'</strong></a>':'<span></span>');
      main = '  <main>\n    <section class="subhero subhero--post"><div class="subhero__inner">\n      <p class="subhero__crumb"><a href="index.html">홈</a> / <a href="'+center.list+'">Column</a></p>\n      <h1 class="subhero__title post-title">'+esc(post.title)+'</h1>\n      <p class="subhero__desc">'+esc(post.date)+'</p></div></section>\n    <section class="page page--tight"><article class="post">\n      <div class="post__hero"><img src="'+esc(post.img)+'" alt="'+esc(post.title)+'" /></div>\n      <div class="post__body">\n        '+bodyHtml+'\n      </div>\n      <div class="post__nav">'+navLinks+'</div>\n    </article></section>\n  </main>';
    }

    const html = '<!DOCTYPE html>\n<html lang="ko">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>'+esc(post.title)+' | '+esc(center.label)+' — 하오디자인</title>\n  <meta name="description" content="'+esc(post.summary||post.title)+'" />\n  <link rel="canonical" href="'+canonical+'" />\n  <meta property="og:type" content="article" />\n  <meta property="og:title" content="'+esc(post.title)+'" />\n  <meta property="og:description" content="'+esc(post.summary||"")+'" />\n  <meta property="og:image" content="'+esc(absImg)+'" />\n  <meta property="og:url" content="'+canonical+'" />\n  '+css+'\n'+(extraStyle?'  '+extraStyle+'\n':'')+'  <script type="application/ld+json">\n'+JSON.stringify(article)+'\n  </script>\n  <script type="application/ld+json">\n'+JSON.stringify(crumb)+'\n  </script>\n</head>\n<body>\n  <div class="progress" id="progress" aria-hidden="true"></div>\n  '+header+'\n'+main+'\n  '+footer+'\n  '+HEADER_JS+'\n</body>\n</html>\n';

    fs.writeFileSync(path.join(ROOT, center.key, file), html, "utf8");
    totalPages++;
    sitemapEntries.push("  <url><loc>"+canonical+"</loc><lastmod>2026-06-30</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>");
  });
  console.log("BUILT", center.key, posts.length + "개");
});

const smPath = path.join(ROOT, "sitemap.xml");
if (fs.existsSync(smPath)) {
  let sm = fs.readFileSync(smPath, "utf8");
  const fresh = sitemapEntries.filter(function(e){ const loc=e.match(/<loc>(.*?)<\/loc>/)[1]; return sm.indexOf(loc) < 0; });
  if (fresh.length) { sm = sm.replace("</urlset>", "\n  <!-- 칼럼 글 -->\n" + fresh.join("\n") + "\n</urlset>"); fs.writeFileSync(smPath, sm, "utf8"); }
  console.log("sitemap +" + fresh.length);
}
console.log("=== 칼럼 정적 페이지 " + totalPages + "개 ===");
