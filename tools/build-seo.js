/* =====================================================================
   SEO/AEO/GEO 구조화 데이터 일괄 주입 (idempotent — 여러 번 실행해도 안전)
   ---------------------------------------------------------------------
   사용법:  node tools/build-seo.js
   - 전 공개페이지: 정적 canonical (없을 때만)
   - 센터 index: Organization JSON-LD
   - Q&A: FAQPage JSON-LD (js/data.js 의 getQna 기반)
   - 서비스 페이지: Service JSON-LD
   - 포트폴리오 페이지: CollectionPage + ItemList JSON-LD (getWorks 기반, 상위 24)
   이미 주입된 항목은 건너뜁니다.
===================================================================== */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const BASE = "https://haodesign.co.kr";

const PUBLIC = {
  design:  ["index.html","about.html","service.html","work.html","board.html","contact.html"],
  studio:  ["index.html","studio.html","photo.html","detailpage.html","video.html","portfolio.html","column.html","qna.html"],
  web:     ["index.html","portfolio.html","column.html","qna.html","seo-check.html"],
  mkt:     ["index.html","works.html","services.html","column.html","qna.html"],
  voucher: ["index.html","export.html","innovation.html","market.html","column.html","qna.html"]
};
const SERVICE_PAGES = [
  { center:"design",  file:"service.html",     serviceType:"그래픽 디자인" },
  { center:"studio",  file:"photo.html",       serviceType:"제품·브랜드 촬영" },
  { center:"studio",  file:"detailpage.html",  serviceType:"상세페이지 제작" },
  { center:"studio",  file:"video.html",       serviceType:"영상 콘텐츠 제작" },
  { center:"mkt",     file:"services.html",    serviceType:"브랜드 마케팅" }
];
const PORTFOLIO_PAGES = [
  { center:"design", file:"work.html",      label:"디자인센터" },
  { center:"studio", file:"portfolio.html", label:"스튜디오센터" },
  { center:"web",    file:"portfolio.html", label:"웹구축센터" },
  { center:"mkt",    file:"works.html",     label:"마케팅센터" }
];
const ORG = { "@context":"https://schema.org","@type":"Organization", name:"하오디자인", alternateName:"HAO DESIGN", url:BASE+"/", logo:BASE+"/design/assets/img/logo.png", telephone:"+82-1666-2027", email:"sales@haodesign.co.kr", address:{ "@type":"PostalAddress", streetAddress:"광진구 능동로49길 9, 2F", addressLocality:"서울특별시", addressCountry:"KR" },
  sameAs:[
    "https://portfolio.haodesign.co.kr/",
    "https://www.instagram.com/haodesign_official/",
    "https://blog.naver.com/xmfostlsh2",
    "https://pf.kakao.com/_exlVrxd",
    "https://haodesign05.tistory.com/",
    "https://www.threads.com/@haodesign_official",
    "https://map.naver.com/p/search/하오디자인"
  ] };
/* 작성자(E-E-A-T) — 센터별 팀 */
const AUTHOR = { design:"하오디자인 디자인팀", studio:"하오디자인 스튜디오팀", web:"하오디자인 웹팀", mkt:"하오디자인 마케팅팀", voucher:"하오디자인 정부사업팀" };

function ld(o){ return '  <script type="application/ld+json">\n'+JSON.stringify(o)+'\n  </script>\n'; }
function inject(fp, str){ let h=fs.readFileSync(fp,"utf8"); h=h.replace("</head>", str+"</head>"); fs.writeFileSync(fp,h,"utf8"); }
function read(fp){ return fs.readFileSync(fp,"utf8"); }
function metaDesc(html){ const m=html.match(/<meta\s+name="description"\s+content="([^"]*)"/i); return m?m[1]:""; }
function pageTitle(html){ const m=html.match(/<title>([^<]*)<\/title>/i); return m?m[1].split("|")[0].trim():""; }
function absUrl(img, center){ try{ return new URL(img, BASE+"/"+center+"/").href; }catch(e){ return null; } }
function cleanImg(raw, center){
  if(!raw) return null;
  if(/^https?:/.test(raw)) return raw;
  if(/^(\.\.\/|assets\/)/.test(raw)) return absUrl(raw, center);
  return null; /* hd: 등 미해석 경로는 생략 */
}
function sandbox(){
  const sb={}; sb.window=sb;
  sb.localStorage={length:0,getItem(){return null;},setItem(){},removeItem(){},key(){return null;}};
  sb.fetch=function(){return Promise.resolve({ok:false,json(){return Promise.resolve([]);}});};
  sb.setTimeout=function(){return 0;}; sb.clearTimeout=function(){};
  sb.document={head:{querySelector(){return null;},appendChild(){}},querySelector(){return null;},querySelectorAll(){return [];},createElement(){return {setAttribute(){},appendChild(){},style:{}};}};
  sb.location={pathname:"/",search:"",href:""};
  sb.console=console; sb.JSON=JSON; sb.Math=Math; sb.Date=Date; sb.Promise=Promise; sb.encodeURIComponent=encodeURIComponent; sb.parseInt=parseInt; sb.Array=Array; sb.Object=Object; sb.String=String; sb.RegExp=RegExp;
  vm.createContext(sb); return sb;
}
function loadHAO(center){ const sb=sandbox(); vm.runInContext(read(path.join(ROOT,center,"js","data.js")),sb,{filename:"data.js"}); return sb.HAO||sb.window.HAO; }

let nCanon=0,nOrg=0,nFaq=0,nSvc=0,nPort=0,nOg=0;

/* 1) canonical + Organization + FAQPage */
Object.keys(PUBLIC).forEach(function(center){
  let hao=null;
  PUBLIC[center].forEach(function(file){
    const fp=path.join(ROOT,center,file); if(!fs.existsSync(fp)) return;
    let html=read(fp), add="";
    if(!/rel="canonical"/.test(html)){ const loc=BASE+"/"+center+"/"+(file==="index.html"?"":file); add+='  <link rel="canonical" href="'+loc+'" />\n'; nCanon++; }
    if(!/property="og:image"/.test(html)){ try{ if(!hao) hao=loadHAO(center); var s=hao&&hao.getSeo?hao.getSeo():null; var oi=s&&s.ogImage?absUrl(s.ogImage,center):null; if(oi){ add+='  <meta property="og:image" content="'+oi+'" />\n'; nOg++; } }catch(e){} }
    if(file==="index.html" && !/"Organization"/.test(html)){ add+=ld(ORG); nOrg++; }
    if(file==="qna.html" && !/FAQPage/.test(html)){
      try{ if(!hao) hao=loadHAO(center); const q=(hao&&hao.getQna)?hao.getQna():[];
        if(q.length){ add+=ld({"@context":"https://schema.org","@type":"FAQPage",author:{"@type":"Organization",name:(AUTHOR[center]||"하오디자인")},mainEntity:q.map(function(x){return {"@type":"Question",name:x.q,acceptedAnswer:{"@type":"Answer",text:x.a}};})}); nFaq++; } }catch(e){}
    }
    if(add){ inject(fp,add); }
  });
});

/* 1b) Organization 블록 최신화(sameAs 등) — 기존 블록을 새 ORG로 교체 */
Object.keys(PUBLIC).forEach(function(center){
  const fp=path.join(ROOT,center,"index.html"); if(!fs.existsSync(fp)) return;
  let html=read(fp);
  const orgRe=/<script type="application\/ld\+json">\s*\{"@context":"https:\/\/schema\.org","@type":"Organization"[\s\S]*?<\/script>/;
  if(orgRe.test(html)){ html=html.replace(orgRe, '<script type="application/ld+json">\n'+JSON.stringify(ORG)+'\n  </script>'); fs.writeFileSync(fp,html,"utf8"); nOrg++; }
});

/* 1c) Q&A 작성자 — FAQPage author 보강 + 가시적 byline */
Object.keys(PUBLIC).forEach(function(center){
  const fp=path.join(ROOT,center,"qna.html"); if(!fs.existsSync(fp)) return;
  let html=read(fp), changed=false; const team=AUTHOR[center]||"하오디자인";
  const faqRe=/<script type="application\/ld\+json">\s*\{"@context":"https:\/\/schema\.org","@type":"FAQPage"[\s\S]*?<\/script>/;
  if(faqRe.test(html) && !/"@type":"FAQPage","author"/.test(html)){
    try{ const hao=loadHAO(center); const q=(hao&&hao.getQna)?hao.getQna():[];
      if(q.length){ const obj={"@context":"https://schema.org","@type":"FAQPage",author:{"@type":"Organization",name:team},mainEntity:q.map(function(x){return {"@type":"Question",name:x.q,acceptedAnswer:{"@type":"Answer",text:x.a}};})};
        html=html.replace(faqRe,'<script type="application/ld+json">\n'+JSON.stringify(obj)+'\n  </script>'); changed=true; } }catch(e){}
  }
  /* 가시적 byline(hao-byline)은 사용 안 함 — 이미 있으면 제거 (JSON-LD author만 유지) */
  if(/hao-byline/.test(html)){
    const before=html;
    html=html.replace(/\s*<p class="hao-byline"[^>]*>[^<]*<\/p>/g, '');
    if(html!==before) changed=true;
  }
  if(changed){ fs.writeFileSync(fp,html,"utf8"); nFaq++; }
});

/* 2) Service */
SERVICE_PAGES.forEach(function(s){
  const fp=path.join(ROOT,s.center,s.file); if(!fs.existsSync(fp)) return;
  let html=read(fp); if(/"@type":"Service"/.test(html)) return;
  const name=pageTitle(html)||s.serviceType, desc=metaDesc(html);
  const canonical=BASE+"/"+s.center+"/"+s.file;
  inject(fp, ld({ "@context":"https://schema.org","@type":"Service", name:name, serviceType:s.serviceType, description:desc, url:canonical, areaServed:{ "@type":"Country", name:"대한민국" }, provider:{ "@type":"Organization", name:"하오디자인", url:BASE+"/" } }));
  nSvc++;
});

/* 3) Portfolio CollectionPage + ItemList */
PORTFOLIO_PAGES.forEach(function(pg){
  const fp=path.join(ROOT,pg.center,pg.file); if(!fs.existsSync(fp)) return;
  let html=read(fp); if(/"CollectionPage"|"ItemList"/.test(html)) return;
  let hao; try{ hao=loadHAO(pg.center); }catch(e){ return; }
  const works=(hao&&hao.getWorks)?hao.getWorks():[];
  if(!works.length) return;
  const items=works.slice(0,24).map(function(w,i){
    const img=cleanImg(hao.imgSrc?hao.imgSrc(w.f||w.img):(w.f||w.img), pg.center);
    const it={ "@type":"ListItem", position:i+1, name:w.t||"" };
    if(img) it.image=img;
    return it;
  });
  const canonical=BASE+"/"+pg.center+"/"+pg.file;
  inject(fp, ld({ "@context":"https://schema.org","@type":"CollectionPage", name:"포트폴리오 — "+pg.label, url:canonical, isPartOf:{ "@type":"WebSite", name:"하오디자인", url:BASE+"/" }, mainEntity:{ "@type":"ItemList", numberOfItems:items.length, itemListElement:items } }));
  nPort++;
});

console.log("=== canonical "+nCanon+" / og:image "+nOg+" / Organization "+nOrg+" / FAQPage "+nFaq+" / Service "+nSvc+" / Portfolio "+nPort+" 주입 ===");
