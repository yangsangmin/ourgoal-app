# 01. 레퍼런스 — 한국 소비자 앱 6사 디자인 토큰 조사

조사일 2026-09-12. 대상: 당근 · 토스 · 네이버 앱 · 다방 · 스타벅스 코리아 앱 · 숨고.
목적: 아워골 앱이 "대기업 앱처럼 보이게" 하는 공통 문법을 토큰 수준(hex·px·폰트명)으로 뽑아 `02-design-system.md` 의 근거로 쓴다.

## 범례

- **확정**: 공개 디자인 시스템 문서 또는 라이브 사이트 CSS/JS 에서 직접 읽은 값. 출처 URL 을 옆에 붙였다.
- **추정**: 공개 문서에 없어서 스크린 관찰·업계 관례·인접 토큰으로 추정한 값. 반드시 `추정` 표기. 실제 구현 전 기기 스크린샷으로 재측정할 것.
- 라이브 CSS 측정은 웹(모바일 웹 포함) 기준이라 네이티브 앱과 1~2px 차이가 날 수 있다.

## 0. 한눈 비교표

| 항목 | 당근 | 토스 | 네이버 | 다방 | 스타벅스 | 숨고 |
|---|---|---|---|---|---|---|
| Primary | `#FF6F0F` (앱·로고) / `#FF6600` (SEED v3 solid) | `#3182F6` | `#03C75A` | `#326CF9` | `#00704A` (코리아 앱) / `#006241` (글로벌 CE) | `#693BF2` |
| 텍스트 1차 | `#1A1C20` | `#191F28` | `#1E1E23`~`#303038` | `#222222` | `rgba(0,0,0,.87)` / `#2D2926` | `#1C242F` |
| 텍스트 2차 | `#555D6D` | `#4E5968` | `#49525E` | `#434343` | `rgba(0,0,0,.58)` | `#6A7685` |
| 텍스트 3차/플레이스홀더 | `#868B94` / `#B0B3BA` | `#6B7684` / `#8B95A1` | `#767678` / `#929294` | `#656565` / `#979797` | `#8C8279` 추정 | `#AAB4BF` / `#C7CED6` |
| 구분선 | `#DCDEE3` (weak) / black α12% | `#E5E8EB` | `#E6E6EA` | `#DFDFDF` / `#EDEDED` | `#E5E5E5` / `#E3E1D2` | `#E0E5EB` |
| 회색 면(surface) | `#F7F8F9` / `#F3F4F5` | `#F2F4F6` | `#F6F8FA` / `#EFEFF0` | `#F5F5F5` / `#FAFAFA` | `#F2F0EB` / `#F9F9F9` | `#F6F7F9` / `#EFF1F5` |
| 폰트 | 시스템(SF/Roboto), 웹 Pretendard Variable | Toss Product Sans | 시스템 + 나눔스퀘어네오(브랜딩) | Pretendard Variable | SoDo Sans(영문) + 시스템 한글 | 자체 서브셋(Pretendard 추정) |
| 기본 radius | 8 / 12 / 16 | 8 / 10 / 14 / 16 | 8 / 12 / 22(필) | 8 / 12 / 16 | 12 / 50(필) | 8 / 12 / 20 |
| 주 CTA 높이 | 52 추정 | 56 | 48~52 추정 | 52 추정 | 48 추정(필형) | 52~56 추정 |
| 바텀탭 | 5 | 5 | 4 | 5 추정 | 5 | 5 추정 |
| 그림자 | 플로팅만 s1~s3 | 거의 없음 | 약함(카드 .1) | 지도 플로팅만 | 약함(카드 .14/.24) | 거의 없음(inset 1px) |

---

## 1. 당근 (Daangn / Karrot) — SEED Design

### 컬러
- **Primary**: `#FF6F0F` — daangn.com 로고 SVG fill 및 앱 브랜드 오렌지(확정, https://www.daangn.com/kr 라이브 HTML). SEED v3 토큰 `bg-brand-solid` = `carrot-600 #FF6600`, pressed `carrot-700 #E14D00`, weak 배경 `carrot-100 #FFF2EC` (확정, daangn.com `/_remix/global-*.css`). 구(v1) 토큰 `carrot500 #FF7E36` (@karrotmarket/design-token, https://www.npmjs.com/package/@karrotmarket/design-token).
- **carrot 스케일**: 100 `#FFF2EC` · 200 `#FFE8DB` · 300 `#FFD5C0` · 400 `#FFB999` · 500 `#FF9364` · 600 `#FF6600` · 700 `#E14D00` · 800 `#B93901` · 900 `#862B00` · 1000 `#471601`.
- **보조(semantic)**: informative `blue-700 #217CF9`, positive `green-700 #079171`, critical `red-700 #FA342C`, warning `yellow-700 #9B7821`. weak 배경은 각 100단계(`#EFF6FF`, `#EDFAF6`, `#FDF0F0`, `#FFF7DE`).
- **배경(surface)**: `bg-layer-default` = `gray-00 #FFFFFF`, `bg-layer-fill` = `gray-100 #F7F8F9`, `bg-layer-basement` = `gray-200 #F3F4F5`(라이트, 추정 — 다크와 정렬 순서 혼재), `bg-neutral-weak` = `gray-200 #F3F4F5`, 오버레이 `black α70%`.
- **gray 스케일**: 00 `#FFFFFF` · 100 `#F7F8F9` · 200 `#F3F4F5` · 300 `#EEEFF1` · 400 `#DCDEE3` · 500 `#D1D3D8` · 600 `#B0B3BA` · 700 `#868B94` · 800 `#555D6D` · 900 `#2A3038` · 1000 `#1A1C20`.
- **텍스트 계층**: `fg-neutral` = `gray-1000 #1A1C20` / `fg-neutral-muted` = `gray-800 #555D6D` / `fg-neutral-subtle` = `gray-700 #868B94` / `fg-placeholder` = `gray-600 #B0B3BA` / `fg-disabled` = `gray-500 #D1D3D8`.
- **구분선**: `stroke-neutral-muted` = static black α300(≈ `rgba(0,0,0,.12)` 추정), `stroke-neutral-weak` = `gray-400 #DCDEE3`, `stroke-neutral-subtle` = black α200. 리스트 구분선은 1px hairline.

### 타이포
- **폰트**: 네이티브 앱은 OS 시스템 폰트(iOS SF Pro·Apple SD Gothic Neo / Android Roboto·Noto Sans KR). 웹은 `Pretendard Variable`(daangn.com CSS 에 92회 선언). Windows 권장 Pretendard. "커뮤니티 글이 브랜드가 아니라 사용자 것으로 느껴지게" 시스템 폰트를 택함(https://seed-design.io/foundations/typography).
- **크기/행간 토큰(static px)**: t1 11/15 · t2 12/16 · t3 13/18 · t4 14/19 · t5 16/22 · t6 18/24 · t7 20/27 · t8 22/30 · t9 24/32 · t10 26/35 · t11 28/38 · t12 32/42 · t13 40/52 · t14 48/60 (확정, 라이브 CSS `--seed-font-size-tN-static`, `--seed-line-height-tN-static`). 사용자 글자 크기 배율 0.8~1.5 clamp.
- **의미 스타일**: `screenTitle` = t10(26px) Bold, `articleBody` = t5(16px) Regular.
- **굵기**: Regular 400 / Medium 500 / Bold 700 세 단계만. 제목·가격 700, 본문 400, 라벨·탭 500.
- **자간/행간**: letter-spacing 토큰 없음(0). 행간은 크기의 1.33~1.4배(t5 16→22). 마케팅 웹 본문만 -0.02em.

### 간격·그리드
- dimension 토큰: x0_5 2 · x1 4 · x1_5 6 · x2 8 · x2_5 10 · x3 12 · x4 16 · x5 20 · x6 24 · x8 32 · x10 40 · x12 48 · x14 56 · x16 64 (확정, https://seed-design.io/foundations/spacing).
- **기본 좌우 패딩** `spacing-x-global-gutter` = x4 = **16px**(라이브 CSS 확정). 칩 사이 8px. 컴포넌트 기본 세로 간격 12px, 내비→페이지 제목 20px, 텍스트 사이 6px, 화면 하단 여백 56px.
- 4pt 기반(2px 반단위 허용), 실무는 8pt 그리드 + 4px 보정. 카드 간격 12~16, 섹션 간격 24~32(추정).

### 라운드
- 토큰: r0_5 2 · r1 4 · r1_5 6 · r2 8 · r2_5 10 · r3 12 · r3_5 14 · r4 16 · r5 20 · r6 24 · full 9999 (확정, https://seed-design.io/foundations/radius).
- 적용: 썸네일 8~10 / 인풋 8 / 버튼 xlarge 12 / 카드 12~16 / 바텀시트 상단 20 / 칩 full (추정).

### 그림자
- 토큰: s1 `0 1px 4px rgba(0,0,0,.08)` · s2 `0 2px 10px rgba(0,0,0,.10)` · s3 `0 4px 16px rgba(0,0,0,.12)` (확정). **플로팅 요소(글쓰기 FAB, 지도 위 카드)에만** 사용. 리스트·카드는 그림자 대신 `inset 0 0 0 1px stroke-neutral-muted` 헤어라인 또는 회색 면 분리.

### 버튼
- 높이: xlarge **52px** 추정(medium 40 / large 48 / xlarge 52~56 계열), 색 `bg-brand-solid #FF6600`(앱은 `#FF6F0F`), 텍스트 16px Bold `#FFFFFF`, radius 12 추정.
- 비활성: `bg-disabled gray-300 #EEEFF1` + `fg-disabled gray-500 #D1D3D8`(색을 빼는 방식, 투명도 아님).
- pressed: `bg-brand-solid-pressed carrot-700` + scale 축소(`--seed-duration-pressed-scale` 150ms).
- 풀폭 CTA: 하단 고정. 중고거래 상세는 하단 바(관심 하트 + 가격 + "채팅하기" 버튼), 글쓰기는 "작성 완료" 하단 고정.

### 내비게이션
- 바텀탭 **5개**: 홈 · 동네지도 · 동네생활 · 채팅 · 나의 당근 — 2024-09 "내근처"가 "동네지도"로 바뀌며 정중앙에 배치(https://www.etnews.com/20240920000161). 라인 아이콘 24px, 선택 시 검정 필 아이콘 + 라벨 10~11px Medium(추정).
- 앱바: 홈은 좌측 동네명 + 드롭다운 chevron, 우측 검색·알림 아이콘. 서브 화면은 좌측 뒤로가기(chevron) + **좌정렬 제목**. 제목 중앙정렬 거의 안 씀.
- 탭: 동네생활·프로필은 밑줄형 Tabs(선택 2px 검정 밑줄, fill 레이아웃은 5개 이하 제한). 중고거래 카테고리는 칩 필터 가로 스크롤(필형).

### 리스트·카드
- **구분선형** 리스트가 기본. 좌 정방형 썸네일 약 108~110px radius 8~10(추정) + 우측 제목 16px Regular 2줄 / 동네·시간 13px subtle / 가격 16px Bold / 하단 우측 채팅·관심 카운트 13px.
- 동네생활은 텍스트 우선 카드(썸네일 우측 소형 72px). 정보 밀도 중간.

### 입력 폼
- 박스형(outlined) TextField, 라벨 상단, **플로팅 라벨 없음**. 글 작성 화면은 테두리 없는 플레인 텍스트 영역 + 플레이스홀더.
- 인라인 유효성: 인풋 아래 13px critical 텍스트 + 테두리 `stroke-critical-solid red-700`.

### 피드백
- 토스트(Snackbar): 하단, `bg-neutral-inverted gray-1000 #1A1C20` 배경 + 흰 텍스트, 1줄 + 액션 1개 최대, radius 8~12 추정.
- 바텀시트(ActionSheet): **핸들 바 없음**(제목 + 항목 리스트 + 취소), 상단 radius 20 추정, 딤 black α70%.
- 모달(Dialog): 중앙, radius 16~20 추정, 제목 Bold + 본문 + 버튼 2개 가로.
- 스켈레톤: 홈 피드·프로필 로딩에 사용(SEED Skeleton 컴포넌트).

### 모션
- duration 토큰: d1 50ms · d2 100 · d3 150 · d4 200 · d5 250 · d6 300. `pressed-scale` = 150ms, `color-transition` = 150ms (확정, 라이브 CSS).
- 이징: standard `cubic-bezier(.35,0,.35,1)`, enter `(0,0,.15,1)`, exit `(.35,0,1,1)`, enter-expressive `(.03,.4,.1,1)`, exit-expressive `(.35,0,.95,.55)`, pressed-scale `(0,0,.15,1)`. 스프링/오버슈트 금지.
- 마이크로 인터랙션: 프레스 시 배경 `layer-default-pressed gray-100` + 살짝 scale 축소(0.97 추정). 페이지 전환 300ms push/pop(Stackflow).

### 이모지·일러스트
- UI 아이콘으로 이모지 사용 안 함. SEED 아이콘(24px 라인, 2px 스트로크).
- 일러스트: 당근 캐릭터(당근이) 플랫+약한 입체, 빈 상태 = 일러스트 1 + 설명 1~2줄 + CTA 1. 매너온도는 자체 제작 얼굴 아이콘(이모지 아님).

### 공개 자료
- SEED Design 문서 https://seed-design.io (foundations/color, typography, spacing, radius)
- GitHub https://github.com/daangn/seed-design
- SEED v2 문서 https://v2.seed-design.io/foundation/color/palette/
- 구 토큰 패키지 https://www.npmjs.com/package/@karrotmarket/design-token
- 라이브 CSS https://www.daangn.com/kr (`/_remix/global-*.css`)
- 당근 블로그 "당근스러운 화면" https://medium.com/daangn/0bc268f819c7
- 동네지도 개편 https://www.etnews.com/20240920000161
- 요약 https://oh-my-design.kr/design-systems/karrot

---

## 2. 토스 (Toss) — TDS (Toss Design System)

### 컬러
- **Primary**: Toss Blue `blue500 #3182F6`, hover/pressed `blue600 #2272EB`, weak 배경 `blue50 #E8F3FF`, weak 텍스트 `blue700 #1B64DA` (확정, https://tossmini-docs.toss.im/tds-react-native/foundation/colors/ 및 toss.im CSS 에서 `#3182F6` 60회).
- **blue 스케일**: 50 `#E8F3FF` · 100 `#C9E2FF` · 200 `#90C2FF` · 300 `#64A8FF` · 400 `#4593FC` · 500 `#3182F6` · 600 `#2272EB` · 700 `#1B64DA` · 800 `#1957C2` · 900 `#194AA6`.
- **grey 스케일**: 50 `#F9FAFB` · 100 `#F2F4F6` · 200 `#E5E8EB` · 300 `#D1D6DB` · 400 `#B0B8C1` · 500 `#8B95A1` · 600 `#6B7684` · 700 `#4E5968` · 800 `#333D4B` · 900 `#191F28`. greyOpacity 는 `#001733` 기반 α0.02~0.91 (푸른 기운의 회색 — 순수 검정 `#000` 안 씀).
- **보조**: red500 `#F04452`(위험/손실 텍스트), red600 `#E42939`(danger 버튼), green `#03B26C`/`#029359`(성공), orange `#FB8800`~`#E45600`, yellow `#FFC342`/`#DD7D02`, teal `#109595`, purple `#A234C7`. 증권은 수익 빨강/손실 파랑.
- **배경**: `background #FFFFFF`, `greyBackground grey100 #F2F4F6`(섹션·카드 분리), `layeredBackground #FFFFFF`, `floatedBackground #FFFFFF`.
- **텍스트 계층**: grey900 `#191F28`(제목) / grey700 `#4E5968`(본문) / grey600 `#6B7684`(보조) / grey500 `#8B95A1`(플레이스홀더·비활성).
- **구분선**: grey200 `#E5E8EB`. 단, 리스트는 구분선보다 **여백과 grey100 면**으로 나눈다.

### 타이포
- **폰트**: Toss Product Sans(산돌·이도타입 공동 제작, 비공개. 숫자·영문이 한글보다 약간 굵고 %, +, -, → 기호가 UI 요소로 쓰이도록 조정). 이모지는 자체 Tossface. 웹 fallback: `-apple-system, Noto Sans KR, Apple SD Gothic Neo, Roboto` (확정, toss.im CSS).
- **크기 토큰(Typography 1~7)**: t1 30/40 · t2 26/35 · t3 22/31 · t4 20/29 · t5 17/25.5 · t6 15/22.5 · t7 13/19.5 (확정, https://tossmini-docs.toss.im/tds-react-native/foundation/typography/). 행간 = 크기 × 1.5 고정. 서브 타이포 포함 13단계. iOS 큰 글씨 100~310% 대응.
- **굵기**: Light/Regular/Medium/Semibold/Bold 5단. 실제 패턴: 화면 제목 t3~t4 **Bold 700**, 본문 t5 17px Medium 500, 보조 t6 15px Regular grey600, 캡션 t7 13px.
- **자간**: 0(letter-spacing 선언 없음 — 폰트 메트릭으로 해결). 행간 1.5.

### 간격·그리드
- 스케일: 4 · 6 · 8 · 16 · 24 · 32 (https://oh-my-design.kr/design-systems/toss). 8pt 기본 + 4/6 보정.
- **좌우 패딩 20~24px**(ListRow 좌우 24 추정, 케이스 스터디 측정 홈 15pt·서브 22pt — https://velog.io/@not_even__close). 토스는 6사 중 좌우 여백이 가장 넓다.
- 섹션 간격 32~40, 카드 간격 12~16, 행 높이 56~72 (추정).

### 라운드
- 버튼: small 8 · medium 10 · large 14 · **xlarge 16** (확정). 기타 sm 4 · md 6.
- 홈 섹션 카드 20~24, 인풋 box 16, 바텀시트 상단 24, 다이얼로그 20 (추정).

### 그림자
- **거의 안 씀**. 공식 토큰에 shadow 없음. 면 분리는 `grey100 #F2F4F6` 배경 위 흰 카드. 웹 플로팅만 `0 2px 10px rgba(0,27,55,.1), 0 3px 20px rgba(2,32,71,.05)`. 포커스 링은 `inset 0 0 0 1.5px #3182F6, 0 0 0 2px #E8F3FF`.

### 버튼
- xlarge **56px** 높이, `#3182F6` 배경, 텍스트 17px Semibold 600 `#FFFFFF`, radius 16, padding 0 20 (확정). 크기 small/medium/large/xlarge, display inline/block/full, variant fill/weak, color primary/danger/light/dark.
- 비활성: `disabled` — 파랑을 옅게 남기는 방식(`--button-disabled-opacity-color`, 배경 `#E8F3FF` 계열 + 텍스트 `#8B95A1` 추정). 회색으로 완전히 빼지 않는다.
- pressed: 딤 레이어 오버레이(`--button-pressed-background-color`, `--button-pressed-opacity`) + scale 축소.
- 로딩: 너비 유지하고 점 3개 순차 애니메이션.
- **풀폭 CTA**: `BottomCTA` Single/Double/Fixed — 하단 고정, 위쪽에 `Gradient` 페이드 34px(`ctaContentGap` 기본 34px) 로 콘텐츠와 분리. 토스트가 CTA 위로 올라가는 `higherThanCTA` 옵션.

### 내비게이션
- 바텀탭 **5개**: 홈 · 혜택 · 토스페이 · 주식 · 전체(2025 기준, 사용자별 구성 차이 가능 — 추정). 탭바 높이 50pt + safe area, 아이콘 22×22 라인, 선택 시 grey900 필, 라벨 11px(측정 https://velog.io/@not_even__close).
- 앱바: 좌측 뒤로가기 chevron 만 두고 **제목은 앱바가 아니라 본문 상단에 t3/t4 Bold 로** 크게 쓴다(토스 고유). 우측은 닫기 X 또는 텍스트 액션 1개. 툴바 42pt.
- 세그먼트: `SegmentedControl` 필형(grey100 트랙 + 흰 선택 칩, radius full). `Tab` 은 밑줄형(2px grey900).

### 리스트·카드
- `ListRow`: **구분선 없음**, 여백으로 분리. 좌 40px 원형 아이콘/로고, 제목 t5 + 보조 t7 grey600, 우측 금액 또는 chevron. 행 높이 56~72 추정.
- 홈은 흰 카드 on `grey100` 배경(또는 흰 배경에 섹션 간 32px 여백). 정보 밀도 **낮음** — 한 화면 한 메시지, 텍스트 최소화.

### 입력 폼
- `TextField` 변형 box / line / big / hero. 금액·본인정보 입력은 **line(밑줄형)** 이 기본, 라벨 13px grey600 상단, 포커스 시 밑줄 파랑. 플로팅 라벨은 line 변형에서 사용(추정).
- 에러: 밑줄 red500 + 아래 13px red500 메시지. 커스텀 `Keypad`(숫자·보안) 사용.

### 피드백
- `Toast`: position top/bottom, 기본 3000ms(버튼 있으면 5000ms), 좌 아이콘/Lottie, 어두운 반투명 배경(`#333D4B` 계열 추정) + 흰 텍스트, radius 16 추정.
- `BottomSheet`: **핸들 바 없음**, 헤더 t4 Bold + 설명 t6, CTA 내장(Single/Double), 위로 10px 드래그하면 풀스크린 확장(`expandBottomSheet`), 딤 black α50% 추정, 상단 radius 24 추정, slide-up 애니메이션 기본.
- `Dialog` Alert/Confirm: 중앙, radius 20 추정, 버튼 가로 2개.
- `Skeleton` 컴포넌트 존재 — **스피너 대신 스켈레톤**, 불가피한 로더는 점 3개 `Loader`.

### 모션
- 이징 토큰: bezier 계열(`bezier.expo`) + spring 계열(`spring.quick`). "타겟 하나에 모션 하나" 규칙, Rally 공통 언어로 iOS/Android/Web 통일 (https://toss.tech/article/interaction).
- **프레스 마이크로 인터랙션**: scale 1.0 → **0.965**, 160ms easeInSine, 복귀 120ms easeOutSine + 하이라이트 딤 오버레이 (재현 분석 https://velog.io/@ximya_hf/three-point-three-enhance-touch-interaction).
- 웹 transition 기본 `.2s`(background/color/transform). 바텀시트 spring slide-up 약 300~400ms 추정.

### 이모지·일러스트
- UI 아이콘으로 이모지 안 씀. 자체 이모지 폰트 **Tossface** 와 3D 그래픽 아이콘(파스텔 블루·그레이 톤)을 쓴다.
- 빈 상태: 3D 오브젝트 1개 + 한 줄 설명 + CTA 1개.

### 공개 자료
- TDS Mobile 문서 https://tossmini-docs.toss.im/tds-mobile/ (components/button, bottom-sheet, toast, text-field, skeleton)
- TDS React Native 파운데이션 https://tossmini-docs.toss.im/tds-react-native/foundation/colors/ , /typography/
- 앱인토스 개발자센터 TDS https://developers-apps-in-toss.toss.im/design/components.html
- Toss Tech — 디자인 시스템 https://toss.tech/article/toss-design-system , 인터랙션 https://toss.tech/article/interaction
- Toss Product Sans(산돌) https://en.sandoll.co.kr/Story/?bmode=view&idx=19492476
- 라이브 CSS https://toss.im/ (`static.toss.im/.../_next/static/css/*.css`)
- 요약 https://oh-my-design.kr/design-systems/toss

---

## 3. 네이버 앱 (NAVER)

### 컬러
- **Primary**: NAVER Green `#03C75A` (확정, m.naver.com CSS 19회; https://www.navercorp.com/company/brandGuide). 파생 `#09AA5C`(pressed 추정), `#00DE5A`, `#1ED675`.
- **보조**: 링크/정보 블루 `#3283FD`·`#0A7DF3`·`#2981DB`(m.naver CSS 최빈), 멤버십/플러스 인디고 `#5A6DFE`(22회), 알림 레드 `#FF5252`·`#F4361E`, 옐로 `#FFC107`, 쇼핑 탭(네이버플러스 스토어) 퍼플 계열(기존 쇼핑 보라보다 약간 밝음 — https://designcompass.org/2024/10/07/naverplus-store/), 클립 탭은 다크 모드.
- **배경**: `#FFFFFF` 기본, 섹션·페이지 배경 `#F6F8FA` / `#EFEFF0`, 카드 `#FFFFFF`.
- **텍스트 계층**: `#1E1E23`~`#303038`(제목·본문) / `#49525E`(보조) / `#767678`·`#929294`(메타·비활성). 검색 결과는 `#1C1C1C` / `#8C8C8C`.
- **구분선**: `#E6E6EA`, `#EDEFF2` 1px hairline. 블록 사이는 8px 두께의 `#F6F8FA` 띠로 분리.

### 타이포
- **폰트**: 앱 UI 는 시스템 폰트(`-apple-system, Apple SD Gothic Neo` / Roboto·Noto Sans KR). 일부 브랜딩 모듈에 `NanumSquareNeo`(나눔스퀘어네오, 확정 m.naver CSS). 나눔 폰트 계열은 네이버 자체 배포(https://hangeul.naver.com).
- **크기(m.naver CSS 빈도 상위)**: 11 · 12 · 13 · 14 · 15 · 17px. 패턴: 제목 17~20 Bold, 본문 14~15 Regular, 보조 13, 캡션 11~12. 검색창 21px Bold.
- **굵기**: 700 제목 / 400 본문 2단 대비, 500 드물게.
- **자간**: **-0.5px 가 최빈(540회)**, -0.3px, -1px(큰 제목). 네이버는 한글 자간을 꽉 조이는 편. 행간 1.4~1.5.

### 간격·그리드
- 좌우 패딩 **16px**(홈피드 카드 내부·리스트), 8pt 그리드, 스케일 4/8/12/16/20 (https://oh-my-design.kr/design-systems/naver). 피드 카드 간 8~12, 섹션 간 24~32(추정).

### 라운드
- 빈도: 8px(213) · 22px(202, 검색창·칩 필형) · 4px(191) · 12px(116) · 16px(48). 적용: 버튼 8, 썸네일 8, 카드 12~16, 검색바·칩 22(필).

### 그림자
- 약함. 카드/검색창 `0 1px 1px rgba(0,0,0,.02), 0 3px 8px rgba(0,0,0,.1)`, 플로팅 `0 1px 4px rgba(0,0,0,.06)`. 대부분은 hairline + 회색 면 분리.

### 버튼
- 주 버튼 `#03C75A`, 높이 48~52 추정, 텍스트 15~16px Bold `#FFFFFF`, radius 8~12. 비활성 `#E6E6EA` + `#929294`(추정). 로그인·결제 풀폭 CTA 하단 고정.
- 검색 인풋 모바일 44~48 높이 필형(22~24 radius), 초록 테두리 1.5px (추정).

### 내비게이션
- 바텀탭 **4개**: 쇼핑 · 홈 · 콘텐츠 · 클립(2023-11 개편, https://designcompass.org/2023/11/08/naver-app-renewal-2/). 클립은 2026-03 탐색/구독/내클립판으로 재편(https://zdnet.co.kr/view/?no=20260414092937). 아이콘은 "얇고 부드러운 검은 곡선" 라인, 선택 시 검정 필 + 라벨 10px. 네이버플러스 스토어 진입 시 탭이 홈·카테고리·검색·쇼핑MY·네이버 5개로 바뀜.
- 앱바: 홈은 상단 로고 + 검색바(필형). 서브 탭은 상단 탐색 영역에 탭 고유 배경색(쇼핑 퍼플, 클립 다크). 뒤로가기 chevron 좌측.
- 탭: 콘텐츠 판 전환은 가로 스크롤 밑줄형(2px 검정), 필터는 필형 칩(18~22 radius, 1px `#E5E5E5` 테두리).

### 리스트·카드
- **카드형 블록**(홈피드 — "블록 단위" 모듈, 2025-07 홈피드 확대 https://blog.nasmedia.co.kr). 썸네일 우측 정방형 72~80 또는 상단 16:9 풀폭. 쇼핑은 2열 그리드 카드. 정보 밀도 **높음**(포털 특성).

### 입력 폼
- 박스형, 라벨 상단, 플로팅 없음. 로그인 인풋 높이 48~52, 에러 12px 레드 아래(추정). 검색은 필형 인풋.

### 피드백
- 토스트: 하단 중앙, 다크(`#303038` α90%) radius 8 (추정). 바텀시트: 핸들 바(36×4 회색) 있음, 상단 radius 16~20 (추정). 모달 중앙 radius 12~16. 스켈레톤: 홈피드 로딩 회색 블록 사용.

### 모션
- 200~300ms ease-out 표준, 탭 전환은 짧은 페이드. 프레스 시 배경 회색 하이라이트(opacity) — scale 없음. 마이크로 인터랙션은 6사 중 가장 적음 (추정).

### 이모지·일러스트
- UI 이모지 없음. 그린닷 시절 그라데이션 일러스트 → 2023 이후 단색 라인 아이콘으로 단순화. 빈 상태 간결(아이콘 + 문장).

### 공개 자료
- 네이버 디자인 https://design.naver.com/ (세션에서 접속 차단 — 브라우저로 직접 확인 필요)
- 브랜드 가이드 https://www.navercorp.com/company/brandGuide
- 나눔 폰트 https://hangeul.naver.com
- 라이브 CSS https://m.naver.com/ (`https://mm.pstatic.net/css/build/main.81ae27ac.css`)
- 개편 기사 https://designcompass.org/2023/11/08/naver-app-renewal-2/ , https://designcompass.org/2024/10/07/naverplus-store/ , https://blog.nasmedia.co.kr (2025-07 홈피드) , https://zdnet.co.kr/view/?no=20260414092937
- 요약 https://oh-my-design.kr/design-systems/naver , https://www.designmd.co/d/naver-com

---

## 4. 다방 (Dabang / 스테이션3)

### 컬러
- **Primary**: `blue-500 #326CF9` (확정, dabangapp.com CSS 변수 `--blue-500` 및 JS 15회). pressed `blue-600 #1E41D0`, weak 배경 `blue-50 #EEF8FF`, `blue-100 #BAE0FF`, 포인트 `blue-300 #00A9FF`.
- **blue 스케일**: 50 `#EEF8FF` · 100 `#BAE0FF` · 200 `#89CEFF` · 300 `#00A9FF` · 400 `#008AFF` · 500 `#326CF9` · 600 `#1E41D0` · 700 `#152D92` · 800 `#0E2067` · 900 `#0C1A53`.
- **보조**: green-500 `#1CA885`(확인·성공), red-500 `#E20724`(오류), pink-500 `#FF3478`(강조 뱃지 추정), violet-500 `#3E26FD`(분양·프리미엄 추정), yellow `#FDD164`/`#FFB600`(별점·경고).
- **배경**: `#FFFFFF`; gray-50 `#FCFCFC`, gray-100 `#FAFAFA`, gray-200 `#F5F5F5`(섹션 배경).
- **gray 스케일**: 50 `#FCFCFC` · 100 `#FAFAFA` · 200 `#F5F5F5` · 300 `#EDEDED` · 400 `#DFDFDF` · 500 `#CCCCCC` · 600 `#979797` · 700 `#656565` · 800 `#434343` · 900 `#222222`.
- **텍스트 계층**: gray-900 `#222222` / gray-800 `#434343`(`#454545`) / gray-700 `#656565` / 플레이스홀더·캡션 gray-600 `#979797`.
- **구분선**: gray-400 `#DFDFDF`, gray-300 `#EDEDED`, `#E5E5E5`.
- 브랜드 BI: 2018-12 리뉴얼, 한글 "다방" 워드마크의 'ㅏ' 를 화살표로 — 시그니처 컬러 블루 (https://brunch.co.kr/@dabang/5).

### 타이포
- **폰트**: `Pretendard Variable`(확정 — `static.dabangapp.com/web/fonts/pretendard-variable/v1.3.9/` 자체 호스팅, fallback `-apple-system, arial`).
- **크기**: 캡션·메타 11/12/13px, 본문 14~15, 제목 18~20, 가격 강조 16~18 Bold, 랜딩 32. 행간 16/18/22/24/32 (확정, JS 인라인 스타일).
- **굵기**: 700 제목·가격 vs 400 본문, 300 드물게. 자간 0 ~ -0.3px 추정.

### 간격·그리드
- 좌우 16px(매물 리스트·상세), 카드 간격 12~16, 섹션 24~32, 8pt 그리드 (추정).

### 라운드
- 빈도: 8px 최빈(버튼·인풋·썸네일) · 2px(태그·뱃지) · 12/16/20(카드·배너·바텀시트) · 50%(아바타) · 360~426px(필 버튼). (확정, 라이브 JS)

### 그림자
- 웹 마케팅 랜딩은 `0 10px 20px rgba(0,0,0,.1)`, `16px 16px 32px rgba(0,0,0,.08)` 사용. **앱은 지도 위 플로팅 칩·카드에만** 약한 그림자(`0 2px 8px rgba(0,0,0,.12)` 추정), 리스트는 hairline.

### 버튼
- 주 버튼 `#326CF9`, 높이 52 추정, 텍스트 16px Bold `#FFFFFF`, radius 8. 비활성 `#DFDFDF` 배경 + `#FFFFFF` 또는 `#979797` 텍스트(추정).
- 풀폭 CTA: 매물 상세 하단 "전화 문의 | 문자·다방톡 문의" 2분할 고정, 필터 바텀시트 하단 "N개 매물 보기" 풀폭 (추정).

### 내비게이션
- 바텀탭 **5개**: 홈 · 지도 · 관심목록 · 다방톡(채팅) · MY (추정). 2024-07 개편으로 홈 상단 퀵버튼 5개(원/투룸·아파트·주택/빌라·오피스텔·분양) (https://www.etnews.com/20240715000221). 라인 아이콘, 선택 시 파랑 필, 라벨 10~11px.
- 앱바: 좌 뒤로가기 + 좌정렬 제목. 지도 화면은 상단 검색바 + 필터 칩 가로 스크롤(필형, 선택 시 파랑 테두리·배경).
- 탭: 밑줄형(매물 유형·상세 정보/사진/위치).

### 리스트·카드
- **구분선형** 매물 리스트: 좌 가로형 썸네일 약 120×90(4:3) radius 8 + 우 가격 16px Bold / 유형·층·면적 13px gray-700 / 설명 1줄 / 2px radius 태그. 지도 하단은 카드 가로 스크롤. 정보 밀도 **높음**(속성 많음).

### 입력 폼
- 박스형 radius 8, 테두리 `#DFDFDF`, 포커스 파랑 1px, 라벨 상단, 플로팅 없음. 필터는 범위 슬라이더 + 칩. 에러 `#E20724` 12px 아래(추정).

### 피드백
- 토스트 하단 다크 반투명 radius 8(추정). 바텀시트(필터) 핸들 바 있음, 상단 radius 16~20(추정). 모달 중앙 radius 12. 스켈레톤(리스트) + 스피너 혼용(추정).

### 모션
- `transition: transform 250ms cubic-bezier(0.33,1,0.68,1)`(easeOutCubic), `opacity 100ms ease-in-out`, `padding 250ms` (확정, 라이브 JS). 바텀시트 250~300ms ease-out. 프레스: 배경 어둡게 — scale 없음(추정).

### 이모지·일러스트
- UI 이모지 없음. 플랫 벡터 일러스트(집·사람), 마케팅 배너는 3D 오브젝트. 빈 상태(관심목록 없음) 일러스트 1 + CTA 1.

### 공개 자료
- 공개 디자인 시스템 없음. 라이브 CSS/JS https://www.dabangapp.com/ (`/static/css/dom-router-provider.*.css`, `/static/js/web.*.js`) 에 컬러 스케일 변수 노출.
- BI 스토리 https://brunch.co.kr/@dabang/5 , 로고 개편 https://zdnet.co.kr/view/?no=20181220084632
- 2024 앱 개편 https://www.etnews.com/20240715000221 , https://www.munhwa.com/news/view.html?no=2024071601039905015001

---

## 5. 스타벅스 코리아 앱

### 컬러
- **Primary**: 코리아 앱·리워드 UI 는 Starbucks Green `#00704A`(Pantone 3425C) 계열, 글로벌 Creative Expression 현행 디지털 primary `#006241`(Starbucks Green) + `#00754A`(Accent Green) (https://everyonesdesign.pages.dev/companies/starbucks , https://mobbin.com/colors/brand/starbucks). 코리아 웹 CSS 실측 `#006633`, `#03934B`, House Green `#1A3C34`(확정, starbucks.co.kr style.css).
- **그린 4단**: Starbucks Green `#006241` · Accent `#00754A` · House Green `#1E3932` · Uplift `#2B5148` · Light Green `#D4E9E2`.
- **보조**: Gold `#CBA258`(리워드 골드), Gold Light `#DFC49D`, 에러 Red `#C82014`/`#B7312C`, 경고 `#FBBC05`, 크림 `#F2F0EB`(Neutral Warm), Ceramic `#EDEBE9`, Cool `#F9F9F9`. 코리아 웹 웜 그레이 `#F6F5EF`, `#F4F4F2`, `#E3E1D2`.
- **배경**: `#FFFFFF` 기본, 홈 상단 Live Greeting 영역은 시즌 이미지 또는 House Green, 카드 크림 `#F2F0EB`.
- **텍스트 계층**: `rgba(0,0,0,.87)`(≈`#212121`) / `rgba(0,0,0,.58)`(≈`#6B6B6B`) / 웜 그레이 `#8C8279`(추정). 코리아 웹 `#2D2926`, `#554C46`, `#8C8279`. 리워드 그린 텍스트 `#33433D`.
- **구분선**: `#E5E5E5`, 웜 hairline `#E3E1D2`.

### 타이포
- **폰트**: 영문 **SoDo Sans**(자체, House Industries 라이선스, 비공개) + 리워드 세리프 Lander. 코리아 앱 한글은 시스템 폰트(Apple SD Gothic Neo / Noto Sans KR) 와 영문 SoDo Sans 혼용(추정). 탭 라벨이 영문(Home/Pay/Order/Gift/Other).
- **크기**: H1 24/36 600 · Body Large 19 · Body 16/24 400 · Small 14 · Micro 13 (확정, designmd/everyonesdesign). 
- **자간 -0.01em 전역**("전체 제품이 살짝 조밀하게"). 굵기 **600 제목 / 400 본문**(700 거의 안 씀). 가격은 600.

### 간격·그리드
- 거터 모바일 **16px**(→ 태블릿 24 → 데스크톱 40). space 4 · 8 · 16 · 24 · 32 · 40 · 64. 카드 간격 16, 섹션 32~40.

### 라운드
- 버튼 **50px(풀 필)** — 스타벅스 고유 문법. 카드·모달 12px. FAB(Frap) 원형 56. 코리아 웹 레거시 3px.

### 그림자
- 카드 `0 0 .5px rgba(0,0,0,.14), 0 1px 1px rgba(0,0,0,.24)`, 글로벌 내비 `0 1px 3px rgba(0,0,0,.1), 0 2px 2px .06`, FAB `0 0 6px .24 + 0 8px 12px .14`. 6사 중 그림자를 가장 적극적으로 쓰지만 여전히 미세(α .1~.24, 블러 ≤12).

### 버튼
- 필형 radius 50, 배경 `#00754A`/`#006241`, 텍스트 16px 600 `#FFFFFF`, 패딩 7px 16px(웹 ≈ 38~40 높이) — 앱 48 추정. 변형: filled / outlined / black filled / dark outlined.
- 비활성: `rgba(0,0,0,.12)` 배경 + `rgba(0,0,0,.26)` 텍스트(추정).
- pressed: `transform: scale(0.95)`, `transition: all .2s ease` (확정).
- 풀폭 CTA: 주문 플로우 하단 고정 "주문하기 · 금액" 그린 필, 좌우 16 마진에 radius 50 유지(직각 풀폭 아님, 추정). Order 탭 우하단 Frap FAB(장바구니/주문 시작).

### 내비게이션
- 바텀탭 **5개**: Home · Pay · Order · Gift · Other (https://www.starbucks.co.kr/util/app_tip.do ; 2024 Pay 탭은 카드 선택 브릿지 화면으로 변경 https://maily.so/tipster/posts/2qzp0g9wr4x). 라인 아이콘 + 영문 라벨 10~11px, 선택 시 그린.
- 앱바: 좌정렬 제목 또는 사이렌 로고, 뒤로가기 chevron. 홈은 상단 그린 히어로(Live Greeting 인사 + 별 프로그레스 바 — 2022 리뉴얼에서 햄버거 메뉴 삭제·바텀탭 신설 https://brunch.co.kr/@acdc/49).
- 탭: Order 메뉴 카테고리 상단 탭 밑줄형(그린 2px), 매장 선택은 필형 칩.

### 리스트·카드
- 카드형(Feed·추천 음료·이벤트) + Order 메뉴는 구분선형 리스트: 원형 썸네일 96~110(추정) + 영문명/한글명 2줄 + 가격 600. 밀도 중간.

### 입력 폼
- 박스형 radius 8~12, 라벨 상단(US 웹은 플로팅 라벨 사용 — 코리아 앱은 박스형 추정). 에러 레드 아래.

### 피드백
- 토스트 하단 다크(`#1E3932` 또는 `#333`) radius 8(추정). 바텀시트(사이즈·옵션 선택) 핸들 바 있음, radius 16~20. 모달 중앙 radius 12. 스켈레톤(Feed) + 스피너 혼용(추정).

### 모션
- `transition: all .2s ease`, 프레스 scale .95(확정). 별 프로그레스 바 채움 ~600ms, Live Greeting 이미지 크로스페이드 (추정).

### 이모지·일러스트
- UI 이모지 없음. 시즌 키비주얼(사진+일러스트 혼합), 사이렌 로고. 빈 상태 사진형 + CTA.

### 공개 자료
- Starbucks Creative Expression https://creative.starbucks.com/color/ , /typography/ (세션에서 인증서 만료로 미접속 — 브라우저 확인 필요)
- 토큰 요약 https://www.designmd.co/d/starbucks , https://everyonesdesign.pages.dev/companies/starbucks , https://mobbin.com/colors/brand/starbucks
- 코리아 앱 팁 https://www.starbucks.co.kr/util/app_tip.do , 라이브 CSS https://www.starbucks.co.kr/common/css/style.css
- 리뉴얼 리뷰 https://brunch.co.kr/@acdc/49 , Pay 탭 업데이트 https://maily.so/tipster/posts/2qzp0g9wr4x

---

## 6. 숨고 (Soomgo / 브레이브모바일)

### 컬러
- **Primary**: 퍼플 `#693BF2` (확정, soomgo.com CSS 토큰 최다; 2025-03-06 리브랜딩으로 블루+레드 = 퍼플로 전환 https://designcompass.org/2025/03/17/soomgo-rebranding/). pressed `#6302FB`, deep `#5400D7`, light `#C5B6FF`, tint 배경 `#F1EEFF`, 보조 퍼플 `#865FFF`/`#9573FF`/`#592CE0`, 마케팅 그라데이션 끝 `#3E009F`.
- **보조**: 정보 블루 `#0087FF`(tint `#E7F4FF`), 성공 그린 `#00A163`(tint `#E7FCEF`), 경고 오렌지 `#FF7C11`(tint `#FFF7F0`), 오류 레드 `#FF3541`(dark `#EA1623`/`#C11C26`, tint `#FDEBEC`), 별점 옐로 `#FFE313`/`#FFC300`(tint `#FFFCDE`). (확정)
- **배경**: `#FFFFFF`; 섹션 `#F6F7F9`, pressed/비활성 면 `#EFF1F5`.
- **텍스트 계층**: `#1C242F`(제목·본문) / `#293341`·`#465162`(강조 보조) / `#6A7685`(보조) / `#8F9AAB` / `#AAB4BF`(플레이스홀더·메타) / `#C7CED6`(비활성). (확정)
- **구분선**: `#E0E5EB` 1px, 약한 구분 `#EFF1F5`.

### 타이포
- **폰트**: 웹은 next/font 로컬 서브셋 woff2 4종(400/500/600/700, family 명 `font`) — 메트릭(ascent 93.76%)상 **Pretendard 추정**. 앱도 Pretendard 추정.
- **크기 토큰(rem→px)**: 10 · 12 · 14 · 16 · 18 · 20 · 22 · 24 · 26 · 28 · 32 · 38 · 44 · 46 · 72 (확정, CSS 변수). 패턴: 본문 14~16, 보조 12~13, 제목 18~24, 캡션 10~12.
- **굵기**: 700 제목 / 600 버튼 / 400 본문. 행간 14px→20px(≈1.43). 자간 0 ~ -0.01em 추정.

### 간격·그리드
- 좌우 16~20px, 카드 간격 12, 섹션 24~32(토큰 8/24/32/44 존재), 8pt 그리드 (추정).

### 라운드
- 8px 최빈(버튼·인풋·썸네일) · 6/10/12(카드) · 16/20(큰 카드·바텀시트) · 999px(칩·태그) · 50%(아바타). (확정)

### 그림자
- 대부분 `none`. 카드는 **`box-shadow: 0 0 0 1px #E0E5EB inset`** 헤어라인 방식. 플로팅만 `0 5px 16px rgba(41,51,65,.2)`, 드롭다운 `0 4px 40px -4px rgba(0,0,0,.15), 0 3px 6px -2px rgba(0,0,0,.08)`. (확정)

### 버튼
- 주 버튼 `#693BF2`, 높이 52~56 추정, 텍스트 16px 600 `#FFFFFF`, radius 8. 비활성 `#EFF1F5` 배경 + `#C7CED6` 텍스트(토큰 존재). 포커스/선택 테두리 `0 0 0 1px #693BF2 inset`.
- 풀폭 CTA: 요청서 퍼널 하단 고정 "다음", 고수 프로필 하단 "견적 요청하기 / 채팅하기" 2분할 (추정).

### 내비게이션
- 바텀탭 **5개**: 홈 · 받은견적 · 채팅 · 커뮤니티 · 마이숨고 (추정 — 모바일 웹 GNB 는 견적요청·고수찾기·둘러보기·커뮤니티). 라인 아이콘, 선택 시 퍼플 또는 검정 필, 라벨 10~11px.
- 앱바: 좌 뒤로가기 + 좌정렬 제목. 요청서 퍼널은 상단 진행 바(퍼플) + 닫기.
- 탭: 밑줄형(고수 프로필 정보/리뷰/사진), 필터는 999px 필형 칩.

### 리스트·카드
- 고수 카드 **카드형**(1px `#E0E5EB` inset, radius 12): 좌 아바타 56~64 원형 + 이름 16px 700 + 별점(옐로)·리뷰수·고용수 13px `#6A7685` + 한 줄 소개. 견적 리스트도 카드형. 밀도 중간.

### 입력 폼
- 박스형 radius 8, 테두리 `#E0E5EB` → 포커스 퍼플 1px inset, 라벨 상단 14px, 플로팅 없음. 요청서는 **한 화면 한 질문** 퍼널(선택지 카드 라디오). 에러 `#FF3541` 12px + 테두리 레드.

### 피드백
- 토스트 하단 다크(`#1C242F` α90%) radius 8(추정). 바텀시트 핸들 바 있음 radius 16~20(추정). 모달 중앙 radius 12~16. 스켈레톤(고수 리스트) 사용 추정.

### 모션
- `transition: opacity .2s ease-out`, `background-color .2s ease-in-out`, `transform .2s ease-out`, 확장형 `.3s ease-in/out` (확정). 프레스: 배경 `#EFF1F5` — scale 없음(추정). 바텀시트 .3s ease-out.

### 이모지·일러스트
- UI 이모지 거의 없음(커뮤니티 카테고리는 컬러 벡터 아이콘). 리브랜딩 후 일러스트는 플랫 + 따뜻한 톤의 사람 일러스트(캠페인 "Life Explorer", https://soomgo.team/blog/posts/686376a450a3d282cb0da773). 빈 상태 일러스트 1 + CTA 1.

### 공개 자료
- 공개 디자인 시스템 없음. 라이브 CSS https://soomgo.com/ (`https://assets.cdn.soomgo.com/next/9b37160/_next/static/css/fadc4b8cc94d5d41.css`, `9d0121bb0dbbb129.css`) 에 시맨틱 컬러 토큰 노출.
- 리브랜딩 https://designcompass.org/2025/03/17/soomgo-rebranding/ , 공지 https://help.soomgo.com/hc/ko/articles/43911860888857 , 팀 블로그 https://soomgo.team/blog/posts/686376a450a3d282cb0da773

---

## 7. 6사 공통 문법 (대기업 앱처럼 보이게 하는 것)

여섯 앱이 브랜드 색만 다르고 나머지는 거의 같은 규칙을 쓴다. 아워골은 이 규칙을 **그대로** 따른다.

1. **중립 바탕 + 액센트 하나**: 배경은 `#FFFFFF`, 면 분리는 `#F2F4F6`~`#F7F8F9` 회색 한 단계. 브랜드 색은 주 CTA·선택 상태·링크에만. 배경을 브랜드 색으로 칠하지 않는다(스타벅스 홈 히어로만 예외).
2. **회색은 푸른 기운의 쿨 그레이 10단계**: 텍스트 1차 `#191F28`~`#1C242F`(순수 `#000` 없음), 2차 `#4E5968`~`#555D6D`, 3차 `#6B7684`~`#868B94`, 플레이스홀더 `#8B95A1`~`#B0B3BA`, 구분선 `#E5E8EB`~`#E0E5EB`, 면 `#F2F4F6`.
3. **텍스트 그라데이션 없음**. 색상 그라데이션은 마케팅 배너 안에만.
4. **이모지를 아이콘으로 쓰지 않는다**. 24px 라인 아이콘(2px 스트로크) 세트 하나, 선택 시 필(fill) 전환.
5. **좌우 패딩 16~20px 고정**(당근 16, 네이버 16, 다방 16, 숨고 16~20, 스타벅스 16, 토스 20~24). 화면 전체가 같은 거터를 쓴다.
6. **8pt 그리드 + 4px 보정**: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 56. 컴포넌트 사이 12, 섹션 사이 24~32, 화면 하단 여백 56.
7. **radius 는 3단계만**: 8(인풋·작은 버튼·썸네일) / 12(카드) / 16(큰 버튼·바텀시트·모달). 칩은 full. 토스만 버튼 16, 스타벅스만 버튼 50(필).
8. **드롭 섀도 거의 없음**: 면 분리는 hairline 1px(`inset 0 0 0 1px`) 또는 회색 면. 그림자는 플로팅 요소(FAB·지도 위 카드·드롭다운)에만, α ≤ .12, 블러 ≤ 16.
9. **바텀탭 4~5개**, 높이 50~56 + safe area, 라인→필 아이콘 22~24px, 라벨 10~11px Medium, 선택 색은 검정(당근·토스·네이버) 또는 브랜드색(다방·스타벅스·숨고). 중앙 탭에 핵심 기능(당근 동네지도, 토스 토스페이).
10. **앱바는 좌측 뒤로가기 + 좌정렬 제목**(또는 토스처럼 제목을 본문 상단 큰 글자로). 중앙 제목·햄버거 메뉴는 쓰지 않는다.
11. **바텀시트**: 상단 radius 16~24, 핸들 바(36×4 회색) 또는 없음(토스·당근), 딤 black α50~70%, CTA 시트 안에 내장, slide-up 250~350ms ease-out.
12. **풀폭 하단 고정 CTA 52~56px**, radius 12~16, 텍스트 16~17px Semibold/Bold, 콘텐츠와의 경계는 그라데이션 페이드 또는 hairline. 비활성은 회색 면(`#EEEFF1`/`#EFF1F5`) + 회색 텍스트, 또는 브랜드색 저채도(토스).
13. **타이포 계층 3~4단 + 굵기 대비**: 제목 20~26 Bold(700) / 본문 15~17 Regular(400) / 보조 13~14 Regular 회색 / 캡션 11~12. 중간 굵기(500/600)는 버튼·탭 라벨에만. 800·900 안 씀. 행간 1.4~1.5, 자간 0 ~ -0.5px(네이버만 조임).
14. **폰트는 Pretendard 또는 시스템 폰트**(당근·네이버 시스템, 다방·숨고 Pretendard, 토스·스타벅스 자체). 아워골 [기본값]: Pretendard Variable + 시스템 fallback.
15. **보조 텍스트 회색 `#6B7684` 근방**(토스 grey600 `#6B7684`, 숨고 `#6A7685`, 당근 `#868B94`, 다방 `#656565`).
16. **프레스 피드백**: scale 0.95~0.97 + 배경 한 단계 어둡게, 120~160ms ease-out(토스·스타벅스·당근) 또는 배경만(네이버·다방·숨고). hover 는 없다(모바일).
17. **스켈레톤 > 스피너**: 리스트·카드 로딩은 회색 블록 스켈레톤. 스피너는 버튼 내부(점 3개) 정도.
18. **빈 상태 = 일러스트 1 + 문장 1 + CTA 1**. 일러스트는 플랫 또는 약한 입체, 브랜드색 포인트 하나.
19. **리스트 패턴**: 구분선형(당근·다방·토스 ListRow) 또는 1px 테두리 카드형(숨고·네이버). 썸네일은 정방형 72~110 radius 8. 정보는 제목/보조/숫자 3줄 이내.
20. **폼**: 박스형 인풋 radius 8~16, 라벨 상단(플로팅 라벨은 토스 line 변형만), 높이 48~56, 포커스는 브랜드색 1~1.5px 테두리, 에러는 레드 테두리 + 아래 12~13px 메시지. 퍼널은 한 화면 한 질문 + 상단 진행 바.

## 8. AI가 만든 티가 나는 패턴 (피할 것)

6사 어디에도 없는데 생성형 도구가 습관적으로 넣는 것들. 하나라도 보이면 "대기업 앱처럼" 안 보인다.

- 텍스트 그라데이션, 그라데이션 버튼(특히 **퍼플→핑크**, 블루→시안).
- 글래스모피즘(`backdrop-filter: blur` + 반투명 흰 카드), 네온 글로우.
- 섹션 제목 앞 이모지 아이콘(🎯 📊 ✨), 탭 아이콘 이모지.
- 모든 카드 radius 22~32px 이상, 둥근 알약 모양 카드.
- 페이지 배경 radial/linear 그라데이션, 블롭(blob) 장식, 메시 그라데이션.
- 테마 스킨 6~8종 선택기, 다크/라이트 외 컬러 테마 토글.
- 모노스페이스 소제목(eyebrow) 라벨, 대문자 + 넓은 자간(`letter-spacing: .1em`) 영문 레이블 남발.
- 큰 box-shadow(`0 20px 40px rgba(0,0,0,.2)`) 층층이 쌓인 카드, 컬러 그림자(브랜드색 α 그림자).
- font-weight 800/900 헤드라인 남발, 모든 숫자를 Extra Bold 로.
- 한 화면에 액센트 색 3개 이상(초록·보라·주황 동시), 카드마다 다른 파스텔 배경.
- 아이콘 스타일 혼용(라인+필+컬러 3D 뒤섞임), 아이콘을 컬러 원 배지 안에 넣는 패턴을 모든 리스트에.
- 3D 일러스트/스톡 이미지를 빈 상태마다, 히어로마다.
- 버튼마다 다른 높이·radius, 인풋과 버튼 높이 불일치.
- 중앙 정렬 본문 텍스트, 카드 안 텍스트 중앙 정렬.
- 스피너·프로그레스 링으로 로딩, 토스트를 화면 중앙에.
- 컴포넌트 테두리 2px 이상 굵은 외곽선, 점선 테두리 카드.
- `!` `✓` 같은 문자 기호를 아이콘 대신, 별점에 ★ 텍스트.
- 바텀시트 없이 중앙 모달로 모든 선택, 드롭다운 `<select>` 기본 스타일.
- 다크 모드에서 순수 `#000` 배경 + 순백 텍스트(6사는 `#17171C`~`#1A1C20` 계열과 α 텍스트).

## 9. 아워골 적용 [기본값] 요약

- 폰트 Pretendard Variable, 텍스트 `#191F28` / `#4E5968` / `#6B7684` / 플레이스홀더 `#8B95A1`, 구분선 `#E5E8EB`, 면 `#F2F4F6`, 배경 `#FFFFFF`.
- 좌우 패딩 16(20 허용), 8pt 그리드, radius 8/12/16, 그림자 없음(플로팅만 `0 2px 10px rgba(0,0,0,.10)`).
- 주 CTA 56px radius 16 하단 고정, 바텀탭 5개 라인→필 24px 라벨 11px, 바텀시트 radius 24 핸들 바 포함, 프레스 scale .97 150ms.
- 세부 토큰 값은 `02-design-system.md` 에서 확정한다. 이 파일은 근거(출처)만 담는다.
