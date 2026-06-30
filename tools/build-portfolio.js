/* =====================================================================
   포트폴리오 그리드 → 정적 HTML 베이킹 (SSG, 점진적 향상)
   ---------------------------------------------------------------------
   사용법:  node tools/build-portfolio.js
   - 각 포트폴리오/works 페이지의 작업 목록을 정적 HTML로 미리 구워
     컨테이너에 삽입(<!--SSG--> 마커). JS는 런타임에 동일 내용으로 재렌더하므로
     화면은 그대로이고, JS 미실행 크롤러·AI도 작업명·이미지를 읽을 수 있습니다.
   - 작업(포트폴리오)을 관리자에서 수정한 뒤 재실행하면 갱신됩니다.
===================================================================== */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "..");

const PAGES = [
  { center:"design",  file:"work.html",      container:"wkGrid",   type:"wcard" },
  { center:"studio",  file:"portfolio.html", container:"folio",    type:"npitem" },
  { center:"web",     file:"portfolio.html", container:"folio",    type:"npitem" },
  { center:"mkt",     file:"works.html",     container:"workGrid", type:"colcard" }
];

function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
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
function loadHAO(center){ const sb=sandbox(); vm.runInContext(fs.readFileSync(path.join(ROOT,center,"js","data.js"),"utf8"),sb,{filename:"data.js"}); return sb.HAO||sb.window.HAO; }

function card(type, w, i, src){
  const t=esc(w.t), c=esc(w.c||"");
  if(type==="npitem")
    return '<a class="np-item" href="#" data-i="'+i+'"><img loading="lazy" decoding="async" src="'+esc(src)+'" alt="'+t+'" /><span class="np-item__cap"><span class="np-item__t">'+t+'</span><span class="np-item__c">'+c+'</span></span></a>';
  if(type==="colcard")
    return '<a class="colcard" href="javascript:void(0)"><div class="colcard__media" style="background-image:url('+esc(src)+');background-size:cover;background-position:center;background-repeat:no-repeat"></div><div class="colcard__body"><span class="colcard__cat">'+c+'</span><h3 class="colcard__t">'+t+'</h3></div></a>';
  // wcard (design)
  return '<article class="wcard"><div class="wcard__media"><img src="'+esc(src)+'" alt="'+t+'" loading="lazy" decoding="async" /></div><div class="wcard__info"><span class="wcard__title">'+t+'</span><span class="wcard__cat">'+c+'</span></div></article>';
}

let total=0;
PAGES.forEach(function(pg){
  const fp=path.join(ROOT,pg.center,pg.file);
  if(!fs.existsSync(fp)){ console.log("MISSING",pg.center+"/"+pg.file); return; }
  let hao; try{ hao=loadHAO(pg.center); }catch(e){ console.log("HAO FAIL",pg.center,e.message); return; }
  const works=(hao&&hao.getWorks)?hao.getWorks():[];
  if(!works.length){ console.log("NO works",pg.center); return; }
  const cards=works.map(function(w,i){ const src=hao.imgSrc?hao.imgSrc(w.f||w.img):(w.f||w.img); return card(pg.type,w,i,src); }).join("\n      ");
  const block="<!--SSG-"+pg.container+"-->\n      "+cards+"\n      <!--/SSG-"+pg.container+"-->";

  let html=fs.readFileSync(fp,"utf8");
  const markerRe=new RegExp("<!--SSG-"+pg.container+"-->[\\s\\S]*?<!--/SSG-"+pg.container+"-->");
  if(markerRe.test(html)){
    html=html.replace(markerRe, block);
  } else {
    const openRe=new RegExp('(<(?:div|section)[^>]*\\bid="'+pg.container+'"[^>]*>)');
    if(!openRe.test(html)){ console.log("NO container",pg.center,pg.container); return; }
    html=html.replace(openRe, "$1"+block);
  }
  fs.writeFileSync(fp,html,"utf8");
  total+=works.length;
  console.log("BAKED",pg.center+"/"+pg.file,works.length+"개");
});
console.log("=== 포트폴리오 정적 베이킹 총 "+total+"개 작업 ===");
