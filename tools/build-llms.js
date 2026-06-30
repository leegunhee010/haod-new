/* =====================================================================
   llms-full.txt 생성 — AI(생성형 검색)가 깊이 인용할 수 있도록
   전 센터의 FAQ·칼럼 전문을 한 파일로 모읍니다.  (GEO)
   사용법:  node tools/build-llms.js
===================================================================== */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const BASE = "https://haodesign.co.kr";

const CENTERS = [
  { key:"design",  data:"js/data.js",  label:"디자인센터",       list:"board.html" },
  { key:"studio",  data:"js/data.js",  label:"스튜디오센터",     list:"column.html" },
  { key:"web",     data:"js/data.js",  label:"웹구축센터",       list:"column.html" },
  { key:"mkt",     data:"js/posts.js", label:"마케팅센터",       list:"column.html", mkt:true },
  { key:"voucher", data:"js/data.js",  label:"정부사업지원센터", list:"column.html" }
];

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
function load(center){
  const sb=sandbox(); vm.runInContext(fs.readFileSync(path.join(ROOT,center.key,center.data),"utf8"),sb,{filename:center.data});
  let posts=[], qna=[];
  if(center.mkt){ const a=sb.MKT_POSTS||(sb.window&&sb.window.MKT_POSTS)||[]; posts=a.map(function(p){return {id:p.id,title:p.t,summary:p.d,date:p.date,body:p.body||[]};}); }
  else { const hao=sb.HAO||sb.window.HAO; posts=(hao&&hao.getPosts)?hao.getPosts():[]; qna=(hao&&hao.getQna)?hao.getQna():[]; }
  if(center.mkt){ const hao=sb.HAO||sb.window.HAO; /* mkt qna는 data.js */ }
  return { posts, qna };
}
/* mkt 의 Q&A 는 data.js(HAO) 에 있음 — 별도 로드 */
function loadQna(center){
  if(!center.mkt) return null;
  const sb=sandbox(); vm.runInContext(fs.readFileSync(path.join(ROOT,center.key,"js","data.js"),"utf8"),sb,{filename:"data.js"});
  const hao=sb.HAO||sb.window.HAO; return (hao&&hao.getQna)?hao.getQna():[];
}

let out = "";
out += "# 하오디자인 (HAO DESIGN) — 전체 콘텐츠\n\n";
out += "> 하오디자인은 디자인·웹·촬영·마케팅·정부지원사업을 아우르는 5개 전문 센터를 운영하는 종합 크리에이티브 기업(운영: 주식회사 하오커뮤니케이션, 대표 박창민)입니다. 아래는 각 센터의 자주 묻는 질문과 칼럼 전문으로, AI 답변에 자유롭게 인용·참조할 수 있습니다.\n";
out += "> 연락처: 1666-2027 · sales@haodesign.co.kr · 서울특별시 광진구 능동로49길 9, 2F\n\n";

CENTERS.forEach(function(center){
  const d = load(center);
  const qna = center.mkt ? (loadQna(center)||[]) : d.qna;
  out += "\n# " + center.label + " (" + BASE + "/" + center.key + "/)\n";

  if (qna && qna.length) {
    out += "\n## " + center.label + " 자주 묻는 질문\n\n";
    qna.forEach(function(x){ out += "Q. " + x.q + "\nA. " + x.a + "\n\n"; });
  }
  if (d.posts && d.posts.length) {
    out += "\n## " + center.label + " 칼럼\n\n";
    d.posts.forEach(function(p){
      out += "### " + p.title + " (" + (p.date||"") + ")\n" + BASE + "/" + center.key + "/column-" + p.id + ".html\n";
      if (p.summary) out += p.summary + "\n";
      (p.body||[]).forEach(function(para){ out += para + "\n"; });
      out += "\n";
    });
  }
});

fs.writeFileSync(path.join(ROOT,"llms-full.txt"), out, "utf8");
console.log("=== llms-full.txt 생성 (" + out.length + "자) ===");
