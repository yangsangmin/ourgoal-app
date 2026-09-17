# 엔지니어링 작업계획서 (PLAN) — 캘린더 구글 캘린더 거대 배너 제거 및 헤더 미니 구글 아이콘 배지 콤팩트화

> **문서 ID**: PLAN-TASK-ES-157-CALENDAR-GCAL-MINI-BADGE-UX  
> **요구사항 연계**: [REQ-TASK-ES-157-CALENDAR-GCAL-MINI-BADGE-UX](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-157-CALENDAR-GCAL-MINI-BADGE-UX.md)  
> **티켓 연계**: #TASK-ES-157  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 캘린더 메인 화면 상단을 부당하게 잠식하던 거대한 `#calGoogleBanner`를 전면 비우고 숨김 처리.
  - 캘린더 헤더 줄(`screen-head-l`)에 컬러 미니 구글 'G' 아이콘이 포함된 콤팩트 인디케이터 칩(`#calGcalMiniBadge`)을 배치.
  - 클릭 시 원터치 수동 동기화(`syncAllToGoogleCalendar(true)`) 및 친절한 토스트 피드백 제공.
  - 미연동 시에는 콤팩트 `+ 구글 연동` 배지로 노출하여 뷰포트 공간을 100% 확보.
- **영향 받는 파일 목록 전수**:
  - `index.html`: 헤더 마크업 추가, `renderCalendarScreen()` 배너 숨김 및 미니 배지 렌더링/클릭 배선.
  - `sw.js`: PWA 캐시 네임 `ourgoal-shell-v20260917-es157` 갱신.
  - `scripts/smoke-test.js`: `#TASK-ES-157` 컴플라이언스 테스트 케이스 추가.
  - `docs/rules/TICKETS.md`: `#TASK-ES-157` 티켓 등록.
  - `dev_log.md`: 개발 로그 기록.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 캘린더 뷰포트의 핵심 자산인 달력/타임라인 콘텐츠 공간을 극대화하고, 부가적인 인프라 상태(구글 연동)는 헤더 레벨의 초경량 인디케이터 배지로 정돈하는 인터페이스 순수성 회복.
- **[원인] (Technical Causes)**:
  - 과거 기능 추가 시 캘린더 화면 중앙 블록에 알림 카드가 임시로 삽입된 후 영구 방치되었고, 헤더 바인딩 설계가 부재했음.
- **[중심 배선] (Core Wire & State)**:
  - `isGoogleCalendarConnected()` 상태 판별을 통해 `#calGcalMiniBadge`의 UI 분기(연동됨 vs 미연동) 및 클릭 액션(`syncAllToGoogleCalendar(true)` vs `openGoogleCalendarConnectModal()`) 직접 연결.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 기존 백그라운드 무음 자동 동기화 로직 100% 온전 보존.
  - `#calGoogleBanner` 요소를 DOM에서 삭제하지 않고 숨김 처리하여 레거시 스크립트와의 호환성 유지.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[캘린더 진입] -> [isGoogleCalendarConnected() 확인] -> [헤더 #calGcalMiniBadge 렌더링 & #calGoogleBanner 숨김] -> [배지 클릭 시 수동 동기화 트리거] -> [토스트 피드백 & 캘린더 리렌더링]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 헤더 마크업 및 미니 구글 배지 렌더링 배선 | +35줄 | -10줄 | +25줄 | 외과수술적 diff |
| `sw.js` | 캐시 버전 갱신 | +1줄 | -1줄 | 0줄 | 캐시 무효화 |
| `scripts/smoke-test.js` | #TASK-ES-157 무결성 검증 단언문 추가 | +20줄 | 0줄 | +20줄 | 테스트 보강 |
| `docs/rules/TICKETS.md` | 티켓 대장 등록 | +1줄 | 0줄 | +1줄 | 문서 |
| `dev_log.md` | 변경 로그 기록 | +25줄 | 0줄 | +25줄 | 문서 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#calGcalMiniBadge`를 `screen-head-l` 내 `calPrivacyBadge` 옆에 시맨틱 뱃지/버튼 태그로 배치. 미니 구글 4색 'G' SVG 탑재.
2. **이벤트 리스너 (Listener)**: 배지 클릭 시 `onclick` 핸들러로 연동 상태에 따라 `syncAllToGoogleCalendar(true)` 또는 `openGoogleCalendarConnectModal()` 바인딩.
3. **비즈니스 로직 (Logic)**: 실제 구글 OAuth 토큰 갱신 및 일정 가져오기(`syncAllToGoogleCalendar`) 직접 실행.
4. **피드백 & 예외처리 (Feedback)**: 클릭 즉시 `toast('구글 캘린더와 동기화 중…')` 노출, 토큰 만료 시 재인증 모달 연결, 동기화 완료 후 캘린더 화면 자동 리렌더링.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 캘린더 달력 그리드, 일간 타임라인, 일정 추가/편집 모달 등 모든 기능이 100% 온전하게 보존되는가? -> 보존 확인.
- [x] 전체 파일 덮어쓰기 없이 `index.html`의 해당 배너/헤더 영역만 외과수술적으로 교체하는가? -> 100% 외과수술적 diff.
- [x] 사용자의 기존 연동 데이터(토큰, 일정 캐시, 설정값)가 전혀 훼손되지 않는가? -> 보존 확인.
- [x] 320px 소형 모바일 환경에서도 헤더가 자연스럽게 줄바꿈되거나 정렬을 유지하는가? -> 인라인 플렉스 칩 규격 준수.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (`index.html` 마크업)**:
   - `screen-calendar`의 `screen-head-l` 안에 `<span id="calGcalMiniBadgeSlot"></span>` 마운트 포인트 추가.
2. **Step 2 (`index.html` 렌더링 로직)**:
   - `renderCalendarScreen()` 내에서 `gBanner.style.display = 'none'; gBanner.innerHTML = '';` 로 거대 배너 비우기.
   - `calGcalMiniBadgeSlot`에 컬러 미니 구글 'G' SVG 아이콘과 콤팩트 알약 배지 렌더링:
     - 연동 상태: `연동됨` (title: `구글 캘린더 연동됨 · 클릭하여 지금 동기화`), 클릭 시 `syncAllToGoogleCalendar(true)`.
     - 미연동 상태: `+ 연동` (title: `구글 캘린더 연동하기`), 클릭 시 `openGoogleCalendarConnectModal()`.
3. **Step 3 (`scripts/smoke-test.js`)**:
   - `#TASK-ES-157` 검증 단언문 추가:
     - 거대 배너 비움 확인
     - 미니 구글 배지 마크업 및 클릭 시 동기화/연동 연결 확인
4. **Step 4 (`sw.js`)**:
   - `ourgoal-shell-v20260917-es157` 캐시 네임 갱신.
5. **Step 5 (문서 및 검증)**:
   - `docs/rules/TICKETS.md` 및 `dev_log.md` 갱신.
   - `npm test`, `essence-gate.js` 검증.
6. **Step 6 (커밋, PR 생성 및 main 병합)**:
   - 커밋 후 푸시, PR 발행, 상민님 지시에 따라 `main` 병합, Vercel 실서버 프로덕션 배포 라이브 확인.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**:
  - 신규 `#calGcalMiniBadge` 클릭 시 연동/미연동 분기에 따라 실제 동기화 함수 또는 모달이 정상 호출되는지 검증.
- **시나리오 B (Zero Data Loss)**:
  - 캘린더 배너 변경으로 인한 기존 일정/목표/아바타 데이터 0바이트 손실 확인.
- **시나리오 C (Zero UX Regression)**:
  - 캘린더 탭 진입 시 거대 배너가 사라져 뷰포트가 즉각 확장되는지, 모바일 320px에서 헤더 깨짐이 없는지 검증.
- **시나리오 D (Full State Propagation)**:
  - 구글 연동 후 캘린더로 돌아왔을 때 배지가 즉각 '연동됨'으로 전환되는지 확인.
- **시나리오 E (자동화 게이트 통과)**:
  - `npm test` 297개 스모크 및 17개 헌법 게이트 100% ALL PASS 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~4 코드 및 테스트 구현
- [ ] `node scripts/verify-integrity-gate.js` 17개 게이트 통과 확인
- [ ] `npm test` 전수 스모크 테스트 통과 확인
- [ ] `git commit` 및 브랜치 푸시
- [ ] GitHub PR 생성 및 상민님 승인에 따른 `main` 병합
- [ ] Vercel 실서버 배포 200 OK 라이브 검증

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**:
  - 기존 스모크 테스트에서 `calBannerSyncBtn` 등의 이전 배너 요소를 찾아서 실패할 가능성 -> 확인 결과 해당 요소는 스모크 테스트에 없었으며, `syncAllToGoogleCalendar(true)` 호출은 배지에 온전히 배선되어 100% 호환됨.
- **사전 방어 및 우회 로직**:
  - 만약 `#calGcalMiniBadgeSlot`이 누락되더라도 에러 없이 우아하게 폴백 처리되도록 null 가드 삽입.
- **롤백 계획 (Rollback Strategy)**:
  - 브랜치 격리 작업 후 문제 발생 시 `git reset --hard` 및 이전 커밋으로 즉각 복구 가능.
- **재검증 트리거**:
  - 캘린더 화면 전환 시 배지가 렌더링되지 않거나 클릭 시 반응이 없으면 원칙 ⑤의 Step 2 렌더러 함수로 돌아가 슬롯 마운트 및 리스너 바인딩을 재검증한다.
