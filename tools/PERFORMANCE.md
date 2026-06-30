# 성능(Core Web Vitals) 추가 최적화 가이드

이미 적용됨: 대용량 이미지 리사이즈+압축(40MB→18MB), `loading="lazy"`, 정적 칼럼/포트폴리오, 구조화데이터.
아래는 **이 작업환경에서는 도구가 없어 자동 처리하지 못한** 항목으로, 로컬/배포 환경에서 진행하세요.

## 1. WebP/AVIF 전환 (가장 큰 추가 절감 — 약 25~50% 더)
현재 이미지는 JPG/PNG입니다. WebP로 바꾸면 화질 유지하며 용량이 더 줄어듭니다.
이 환경엔 변환 도구(cwebp/ImageMagick)가 없으니 아래 중 하나로:

**(a) cwebp (Google 공식, 권장)** — 설치 후:
```bash
# 모든 jpg/png를 같은 폴더에 .webp로 생성 (원본은 폴백용으로 유지)
for f in $(find . -path ./.git -prune -o \( -iname '*.jpg' -o -iname '*.png' \) -print); do
  cwebp -q 82 "$f" -o "${f%.*}.webp"
done
```
그리고 `<picture>`로 교체:
```html
<picture>
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="..." loading="lazy" decoding="async" />
</picture>
```

**(b) Cloudflare 자동 변환** — 도메인을 Cloudflare에 연결하면 서버가 방문자 브라우저에 맞춰 WebP/AVIF를 자동 제공(코드 수정 0). 단 자동 변환 기능(**Polish**)은 **Pro 플랜(월 $20) 이상 유료**입니다. 무료 플랜은 CDN·SSL·캐싱만 제공하고 자동 WebP는 포함되지 않습니다. → 비용을 감수하면 가장 손쉬움.

**(c) Squoosh.app** — 무료. 히어로·메인 등 핵심 이미지 몇 장만 수동으로 WebP 변환·교체. 비용 없이 효과 보려면 권장.

> 참고: 이미지는 이미 리사이즈+압축(40MB→18MB)되어 있어 WebP는 **선택적 추가 최적화(+25~35%)** 입니다. 당장 안 해도 치명적이지 않습니다.

## 2. 스크립트 로딩 (voucher 메인)
- `voucher/index.html`은 jQuery·Swiper11·부트스트랩 등 무거운 기성 템플릿입니다.
- `<head>`의 라이브러리에 `defer`를 적용하거나 사용하지 않는 라이브러리를 제거하면 초기 로딩이 빨라집니다. **단, 인라인 스크립트 실행 순서 의존성이 있어 한 번에 하나씩 테스트하며 진행**하세요.
- 나머지 센터(studio/web/mkt 등)는 스크립트가 `</body>` 직전이라 렌더 차단이 적습니다.

## 3. 폰트
- Pretendard·Poppins 등을 CDN으로 불러옵니다. 이미 `preconnect` 적용됨.
- LCP 개선이 필요하면 히어로 영역 폰트에 `&display=swap`(구글폰트) 확인, 핵심 woff2 `preload` 고려.

## 4. 측정
- [PageSpeed Insights](https://pagespeed.web.dev/) 로 배포 후 모바일/데스크톱 점수 측정 → LCP·CLS·INP 항목별 개선.
- 이미지에 `width`/`height` 지정 시 CLS(레이아웃 이동) 감소.
