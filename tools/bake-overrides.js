/* =====================================================================
   관리자 오버라이드(Supabase) → 정적 HTML 굽기  (원클릭 · 외과적)
   ---------------------------------------------------------------------
   사용법:  node tools/bake-overrides.js
     · Supabase overrides 를 전부 읽어옵니다.
     · 각 센터 js/data.js 를 (a)오버라이드 없이 (b)오버라이드 얹어서 두 번
       실행 → 값이 "실제로 달라진 항목"만 골라냅니다. (관리자가 손댄 것만)
     · 그 항목만 정적 HTML 의 해당 요소에 써넣습니다.
         - 카피:  el 내부 HTML = fmt(value, tag)   (attr 있으면 속성)
         - 이미지: img[src] = imgSrc(value)
         - SEO:   <title>·description·keywords·og:title·og:description (boot.js 동일)
     · htmlparser2 소스 위치로 해당 바이트만 교체 → 나머지 HTML 은 그대로.
       여러 번 실행해도 결과 동일(idempotent).
   미포함:  히어로·후기 등 배열형(컨테이너 렌더)은 이 스크립트가 안 굽습니다.
===================================================================== */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const htmlparser2 = require("htmlparser2");
const cssSelect = require("css-select");

const ROOT = path.resolve(__dirname, "..");
const SB_URL = "https://oaqrjrrgntlqmyxxovfn.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hcXJqcnJnbnRscW15eHhvdmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NjQzMTUsImV4cCI6MjA5NzE0MDMxNX0.3bOfZOXVKSoI9ELfE7ZjWETuxvjpNYHdCBSIMrbAGtU";
const CENTERS = ["design", "studio", "web", "mkt", "voucher"];

/* -------- Supabase 오버라이드 전량 -------- */
async function loadOverrides() {
  const res = await fetch(SB_URL + "/rest/v1/overrides?select=k,v", {
    headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY },
  });
  if (!res.ok) throw new Error("Supabase 응답 " + res.status);
  const rows = await res.json();
  const map = {};
  rows.forEach((r) => { map[r.k] = JSON.stringify(r.v); });
  return map;
}

/* -------- data.js 실행 샌드박스 -------- */
function loadHAO(center, store) {
  const sb = {};
  sb.window = sb;
  sb.localStorage = {
    getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; },
    key(i) { return Object.keys(store)[i] || null; },
    get length() { return Object.keys(store).length; },
  };
  sb.fetch = function () { return Promise.resolve({ ok: false, json() { return Promise.resolve([]); } }); };
  sb.setTimeout = function () { return 0; };
  sb.clearTimeout = function () {};
  sb.document = { head: { querySelector() { return null; }, appendChild() {} }, querySelector() { return null; }, querySelectorAll() { return []; }, createElement() { return { setAttribute() {}, appendChild() {}, style: {} }; } };
  sb.location = { pathname: "/", search: "", href: "" };
  sb.navigator = { userAgent: "node" };
  sb.console = console; sb.JSON = JSON; sb.Math = Math; sb.Date = Date; sb.Promise = Promise;
  sb.encodeURIComponent = encodeURIComponent; sb.decodeURIComponent = decodeURIComponent;
  sb.parseInt = parseInt; sb.parseFloat = parseFloat; sb.Array = Array; sb.Object = Object; sb.String = String; sb.RegExp = RegExp;
  vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(ROOT, center, "js", "data.js"), "utf8"), sb, { filename: center + "/data.js" });
  return sb.HAO || sb.window.HAO;
}

function pagesOf(center) {
  return fs.readdirSync(path.join(ROOT, center)).filter((f) => /\.html$/.test(f) && f !== "admin.html" && !/backup/i.test(f));
}
const pageKey = (f) => f.replace(/\.html?$/, "") || "index";
const escText = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");

/* -------- 한 파일에 edit 목록을 외과적으로 반영 --------
   edit = { sel, mode:'inner'|'attr', attr?, value }  (value 는 이미 최종 문자열)
   반환: 적용된 edit 수 */
function applyEdits(fp, edits) {
  if (!edits.length) return 0;
  const raw = fs.readFileSync(fp, "utf8");
  const dom = htmlparser2.parseDocument(raw, { withStartIndices: true, withEndIndices: true });
  const repls = []; // {start,end,text}
  for (const e of edits) {
    let els;
    try { els = cssSelect.selectAll(e.sel, dom); } catch (err) { continue; }
    for (const el of els) {
      if (el.startIndex == null) continue;
      const openEnd = raw.indexOf(">", el.startIndex);
      if (openEnd < 0) continue;
      if (e.mode === "inner") {
        let start, end;
        if (el.children && el.children.length) {
          start = el.children[0].startIndex;
          end = el.children[el.children.length - 1].endIndex + 1;
        } else { start = openEnd + 1; end = openEnd + 1; }
        if (start == null) continue;
        if (raw.slice(start, end) !== e.value) repls.push({ start, end, text: e.value });
      } else { // attr
        const tag = raw.slice(el.startIndex, openEnd + 1);
        const re = new RegExp("(\\s" + e.attr + '\\s*=\\s*")([^"]*)(")');
        let newTag;
        if (re.test(tag)) newTag = tag.replace(re, "$1" + e.value + "$3");
        else newTag = tag.replace(/\s*\/?>$/, (m) => " " + e.attr + '="' + e.value + '"' + m);
        if (newTag !== tag) repls.push({ start: el.startIndex, end: openEnd + 1, text: newTag });
      }
    }
  }
  if (!repls.length) return 0;
  repls.sort((a, b) => b.start - a.start);
  let out = raw, last = Infinity, applied = 0;
  for (const r of repls) {
    if (r.end > last) continue; // 겹침 방지
    out = out.slice(0, r.start) + r.text + out.slice(r.end);
    last = r.start; applied++;
  }
  if (out !== raw) fs.writeFileSync(fp, out, "utf8");
  return applied;
}

(async function main() {
  console.log("Supabase 오버라이드 로드 중…");
  let seed;
  try { seed = await loadOverrides(); }
  catch (e) { console.error("✗ 실패:", e.message); process.exit(1); }
  console.log("  오버라이드 " + Object.keys(seed).length + "행\n");

  let TC = 0, TI = 0, TS = 0, TF = 0;

  for (const center of CENTERS) {
    let def, ov;
    try { def = loadHAO(center, {}); ov = loadHAO(center, Object.assign({}, seed)); }
    catch (e) { console.error("✗ " + center + " 실행 실패:", e.message); continue; }

    const fmt = ov.fmt || ((s) => String(s == null ? "" : s));
    const imgSrc = ov.imgSrc || ((v) => v);

    /* 실제 달라진 카피만 */
    const dCopy = def.getCopy ? def.getCopy() : [];
    const oCopy = ov.getCopy ? ov.getCopy() : [];
    const copyByPage = {};
    oCopy.forEach((c, i) => {
      if (!dCopy[i] || dCopy[i].value === c.value) return; // 오버라이드 아님
      (copyByPage[c.page] = copyByPage[c.page] || []).push(
        c.attr ? { sel: c.sel, mode: "attr", attr: c.attr, value: escAttr(c.value) }
               : { sel: c.sel, mode: "inner", value: fmt(c.value, c.tag || "b") }
      );
    });

    /* 실제 달라진 이미지만 */
    const dImg = def.getImgs ? def.getImgs() : [];
    const oImg = ov.getImgs ? ov.getImgs() : [];
    const imgByPage = {};
    oImg.forEach((c, i) => {
      if (!dImg[i] || dImg[i].value === c.value) return;
      (imgByPage[c.page] = imgByPage[c.page] || []).push({ sel: c.sel, mode: "attr", attr: "src", value: escAttr(imgSrc(c.value)) });
    });

    /* 실제 달라진 SEO만 (boot.js 매핑과 동일) */
    const dSeo = (def.getSeo ? def.getSeo() : { pages: {} }).pages || {};
    const oSeo = (ov.getSeo ? ov.getSeo() : { pages: {} }).pages || {};
    function seoEdits(page) {
      const d = dSeo[page] || {}, o = oSeo[page] || {}, out = [];
      if (o.title != null && o.title !== d.title) {
        out.push({ sel: "title", mode: "inner", value: escText(o.title) });
        out.push({ sel: 'meta[property="og:title"]', mode: "attr", attr: "content", value: escAttr(o.title) });
      }
      if (o.desc != null && o.desc !== d.desc) {
        out.push({ sel: 'meta[name="description"]', mode: "attr", attr: "content", value: escAttr(o.desc) });
        out.push({ sel: 'meta[property="og:description"]', mode: "attr", attr: "content", value: escAttr(o.desc) });
      }
      if (o.keywords != null && o.keywords !== d.keywords) {
        out.push({ sel: 'meta[name="keywords"]', mode: "attr", attr: "content", value: escAttr(o.keywords) });
      }
      return out;
    }

    let cC = 0, cI = 0, cS = 0, cF = 0;
    for (const file of pagesOf(center)) {
      const page = pageKey(file);
      const edits = [].concat(copyByPage[page] || [], imgByPage[page] || [], seoEdits(page),
        copyByPage.all || [], imgByPage.all || []);
      if (!edits.length) continue;
      const n = applyEdits(path.join(ROOT, center, file), edits);
      if (n) {
        cF++;
        // 대략 집계
        cC += (copyByPage[page] || []).length + (copyByPage.all || []).length;
        cI += (imgByPage[page] || []).length;
        cS += seoEdits(page).length;
      }
    }
    console.log(center.padEnd(8) + " 편집반영 파일 " + cF + " (카피~" + cC + " · 이미지~" + cI + " · SEO~" + cS + ")");
    TC += cC; TI += cI; TS += cS; TF += cF;
  }

  console.log("\n=== 굽기 완료: 파일 " + TF + "개 · 카피~" + TC + " · 이미지~" + TI + " · SEO~" + TS + " ===");
  console.log("git diff 로 검토 후 커밋하세요. (여러 번 실행해도 안전)");
})();
