# 실행 계획서 (PLAN) — Capacitor iOS 프로젝트 · 네이티브 게이팅 · 푸시/위젯 스켈레톤

> **문서 ID**: PLAN-TASK-ES-204-CAPACITOR-IOS-SHELL
> **티켓 연계**: #TASK-ES-204 (INFRA) · 성장 로드맵 T042
> **선행 문서**: REQ-TASK-ES-204-CAPACITOR-IOS-SHELL
> **작성 일시**: 2026-09-21 · **작성자**: claude-session-b4f54e9b
> **작업계획서**: `C:/dev/command-center/.claude/작업계획서/b4f54e9b.md`

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **구조**: 아워골은 Vanilla JS 웹앱(Vercel 배포). Capacitor 가 `server.url`(원격)을 WKWebView 로 감싸는 셸이다. 웹 에셋 폴더 `www/` 는 오프라인 폴백이며 저장소에 넣지 않는다(.gitignore).
- **변경 파일**: `ios/**`(스캐폴드) · `js/native-platform.js`(신규) · `js/native-push.js`(신규) · `index.html`(게이트 3곳 + 스크립트 2줄) · `ios/App/OurgoalWidget/*`(신규 스켈레톤) · `scripts/test-native-platform.js`(신규) · `package.json`/`package-lock.json`(devDependencies) · `.gitignore` · `reports/TASK-ES-204/claims.json`(신규) · `docs/specs/*` · `docs/rules/TICKETS.md` · `dev_log.md`.
- **건드리지 않는 것(금고 포함)**: `.github/**`(macOS CI 는 별도 금고 PR)·`package.json` 의 `scripts`(테스트 체인 연결도 별도 금고 PR)·`capacitor.config.json`(안드로이드 CI 트리거), `sw.js`, 로그인·기록·통계·캘린더 코드, CSS.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질]**: 윈도우에서 사실로 확인 가능한 것을 모두 실물로 만들고, 맥·실기기 구간을 증거로 분리한다.
- **[원인]**: 판별 부재(웹이 셸을 모름) · 프로젝트 부재 · 앞선 세션 인계 실패.
- **[중심]**: `window.Capacitor.isNativePlatform()` — Capacitor 가 웹뷰에 주입하는 전역. 번들러 없이 쓴다. 판별 실패는 "브라우저"(기존 동작).
- **[핵심]**: 게이트는 `OurgoalNative` 하나로 모으고 호출부는 `window.OurgoalNative && ...isNative()` 가드로 파일 누락 시에도 웹이 안 깨진다.
- **배선**: `index.html` → `js/native-platform.js`(먼저 로드) → 게이트 3곳(`renderIosPwaBanner`, 서비스워커 등록, `syncPushSubscription`) / `js/native-push.js` → `window.plugins.OneSignal`(플러그인 있을 때만).

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- `index.html`: +6/-2 줄(게이트 3곳·스크립트 2줄). 기존 마크업·CSS 무변경.
- 신규 모듈 2개는 각 60줄 안팎, IIFE·전역 1개씩(`OurgoalNative`, `OurgoalNativePush`), Node 에서 `create(fakeWindow)` 로 검증 가능.
- **스토리지 원장화 3대 명세**: 1호 DB 스키마 변경 0 · 2호 스토리지 분기 변경 0(네이티브 전용 값은 App Group `todayGoal` 하나, T064) · 3호 4대 뷰(`renderHome`·`renderRecordsScreen`·`renderStatsScreen`·`renderCalendar`) 신규 재호출 0.
- **시각적 IA 및 시맨틱 통합 배선도**: 화면 구성 변경이 없다(배너가 네이티브에서 빈 슬롯이 될 뿐). 홈 `#iosPwaSlot` ← `renderIosPwaBanner()` ← `OurgoalNative.isNative()`.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- 웹 브라우저에서 `window.Capacitor` 가 없으므로 `isNative()` 는 항상 false → 세 게이트 모두 기존 경로. 단위 검증 1·2번 항목이 이를 고정한다.
- 안드로이드 Capacitor 셸에서는 게이트가 켜져 서비스워커·웹 푸시가 꺼진다 — 안드로이드는 TWA 경로가 주력이라 영향이 없고, 안드로이드 셸의 푸시는 T064 이후 별도 판단.
- 약점: 위젯·푸시는 컴파일/실기기 미검증. 그래서 코드 첫머리와 README 에 "미검증"을 적고 프로젝트 타깃에 연결하지 않는다.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. `t042-ios` worktree 를 `origin/main` 으로 fast-forward (다른 세션 브랜치 무오염)
2. `npm i -D @capacitor/{core,cli,ios}@^8` → `www/` 준비 → `npx cap add ios`
3. 판별 모듈·푸시 스켈레톤·게이트 3곳·위젯 스켈레톤 작성
4. 단위 검증(`node scripts/test-native-platform.js`) 작성 — `npm test` 체인 연결은 scripts 가 금고라 별도 PR
5. `reports/TASK-ES-204/claims.json`(정적 주장 + 실기기 미확인 주장) 작성 → 법정 예비 점검
6. 티켓·dev_log·REQ/PLAN 기록 → 커밋(`[INFRA] #TASK-ES-204 ...`) → 브랜치 푸시 → 초안 PR
7. 노션 증거 4칸 기록. 실기기 스크린샷이 없으므로 완료요청은 켜지 않고 사유를 남긴다.

---

## 6. [원칙 ⑥] 절차 재검증: 법정 주장(claims) 설계
- **SPOF**: macOS 빌드 증거가 없으므로 "Xcode 로 빌드된다"는 주장을 하지 않는다. 그 사실을 claims 의 미확인 주장으로 남긴다.
- **가정 검증**: Windows 에서 `cap add ios` 성공(실측), 저장소 PUBLIC(gh 실측) → macOS 러너 무료.
- **주장 설계**: 이 PR 이 하는 주장은 (a) `ios/` 가 생성되고 번들 ID 가 일치한다 (b) 판별·게이트 코드가 저장소에 있다(글자 확인 — 브라우저에서 기존 동작이 유지되는지는 `scripts/test-native-platform.js` 가 별도로 잰다) (c) 실기기 실행은 **주장하지 않는다**. 법정이 기계로 확인할 수 있는 것만 주장으로 쓴다.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] worktree 갱신 → [x] `cap add ios` 성공 → [x] 게이트·스켈레톤 작성 → [x] `npm test` exit 0
- [ ] claims.json·법정 예비 점검 → [ ] 초안 PR → [ ] 노션 증거 4칸(실기기 미충족 사유 포함)

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **블로커**: 맥 오프라인·SSH 부재 / 금고 파일 반려 / essence-gate 커밋 훅 / 법정 판정 지연.
- **롤백**: 이 PR 은 추가 파일이 대부분이다. `index.html` 3곳은 `git revert` 한 번으로 원복되며, 웹 동작은 게이트가 없을 때와 같다. `ios/`·devDependencies 는 삭제해도 웹·안드로이드에 영향이 없다(안드로이드 CI 는 자체적으로 `@capacitor/*` 를 설치).
- **재검증 트리거**: 법정 반려 → 원칙 ②(중심)로 복귀, 게이트 오작동 보고 → 원칙 ④(불파괴 보증)로 복귀.
