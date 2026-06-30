# 빌드 도구 (tools/)

콘텐츠는 관리자(Supabase)로 실시간 수정되지만, **검색·AI 크롤러용 정적 페이지/구조화데이터**는 아래 스크립트로 다시 구워야 최신화됩니다. (Node.js 필요)

```bash
node tools/build-columns.js     # 칼럼 글 → column-{id}.html 정적 페이지 + Article/Breadcrumb JSON-LD + sitemap
node tools/build-seo.js         # canonical · Organization · FAQPage · Service · CollectionPage JSON-LD 주입(idempotent)
node tools/build-portfolio.js   # 포트폴리오 그리드를 정적 HTML로 베이킹(<!--SSG--> 마커)
```

## 언제 실행하나
- **칼럼**을 추가/수정/삭제한 뒤 → `node tools/build-columns.js`
- **포트폴리오(작업)**를 추가/수정한 뒤 → `node tools/build-portfolio.js`
- **Q&A·서비스·회사정보**를 크게 바꾼 뒤 → `node tools/build-seo.js`
- 세 개를 한 번에: `node tools/build-columns.js && node tools/build-seo.js && node tools/build-portfolio.js`

실행 후 변경된 파일을 커밋·푸시하면 배포본에 반영됩니다.

## 설계 메모
- 모든 스크립트는 `js/data.js`(또는 `js/posts.js`)를 샌드박스에서 실행해 데이터를 읽습니다.
- `build-seo.js`·`build-portfolio.js`는 **idempotent** — 여러 번 실행해도 중복 주입되지 않습니다.
- 정적 페이지는 관리자 실시간 수정과 별개입니다. AI(특히 JS 미실행 GPTBot 등)와 검색 색인용입니다.

이미지 최적화는 `PERFORMANCE.md` 참고.
