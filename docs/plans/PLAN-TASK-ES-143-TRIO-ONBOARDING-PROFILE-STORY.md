# 엔지니어링 작업계획서 (PLAN) — #TASK-ES-143 ~ #TASK-ES-145 온보딩 후속 E3 연계 & 프로필 결함 완치 & 갓생/잠금화면 스토리카드 고도화 일괄 완결

> **문서 ID**: PLAN-TASK-ES-143-TRIO-ONBOARDING-PROFILE-STORY  
> **요구사항 연계**: [REQ-TASK-ES-143-TRIO-ONBOARDING-PROFILE-STORY](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-143-TRIO-ONBOARDING-PROFILE-STORY.md)  
> **티켓 연계**: #TASK-ES-143, #TASK-ES-144, #TASK-ES-145  
> **작성 일시**: 2026-10-03  
> **작성자**: Antigravity AI Pair Programmer  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 온보딩 첫 체크인 축하 모달 내 동류 러너 3인 매칭 & 첫 웰컴 응원 스탬프 발송, 프로필 편집 4종(잇템, 관심사, 지역공개, 동네) 결함 완치 및 계정 게스트 오표기 교정, 갓생 스토리카드 5대 비율 및 잠금화면용 일정 카드 9:16 고해상도 생성 고도화 일괄 집행.
- **영향 받는 파일 목록 전수**:
  - `index.html`: `triggerFirstCheckinCelebrationModal`, `openProfileEditor`, `setAccountEmail`, `recStoryCardBtn` 배선
  - `js/records-stats.js`: `handle기록스톱워치_Item35Action`에 `openMzShareCardModal()` 직통 호출 탑재
  - `js/components.js`: `handle기록스톱워치_Item35Action`에 `openMzShareCardModal()` 직통 호출 탑재
  - `tests/trio-es143-es145.test.js`: 통합 단위 테스트 3종
  - `docs/rules/TICKETS.md`: 승인 티켓 상태 최신화
  - `reports/TASK-ES-143/claims.json`: 법정 판정 청구서

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 3대 본질 루프(E1 체크인 ➔ E3 동류소통 ➔ E2 회고/공유)의 단절 없는 연속성과 프로필/공유 엔터티의 무손실 영속화.
- **[원인] (Technical Causes)**: 온보딩 축하 모달의 단순 알림 종료, 모바일 환경에서 프로필 인라인 폼의 스크롤 및 클릭 이벤트 처리 미비, 핸들러의 모달 미호출.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile`: 동류 러너 매칭, 잇템, 관심사, 지역, 경험치(+5 EXP) 실시간 반영
  - `state.user`: 정회원 상태 판별 및 게스트 오표기 원천 차단
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - `saveProfile()` 내 다중 fallback 가드로 DB 에러 시에도 로컬 백업(`ourgoal_profile_backup_{uid}`) 100% 무손실 보존.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[첫 체크인 완료] -> [축하 모달 팝업 & 동류 러너 3인 매칭] -> [웰컴 스탬프 클릭] -> [+5 EXP 가산 & saveProfile] -> [소통 탭 직통 전환] -> [동류 피드 조망]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 온보딩 축하 모달, 프로필 편집 및 계정 표출 보강 | +90줄 | -15줄 | +75줄 | 외과수술적 diff |
| `js/records-stats.js` | 갓생 스토리카드 모달 직통 호출 연결 | +7줄 | 0줄 | +7줄 | 외과수술적 diff |
| `js/components.js` | 갓생 스토리카드 모달 직통 호출 연결 | +7줄 | 0줄 | +7줄 | 외과수술적 diff |
| `tests/trio-es143-es145.test.js` | 신규 단위 테스트 추가 | +68줄 | 0줄 | +68줄 | 신규 검증 파일 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: 고유 ID `#firstCheckinCommBtn`, `#pvAddItItem`, `#recStoryCardBtn`, `#calLockScreenBtn` 및 접근성 시맨틱 태그 준수
2. **이벤트 리스너 (Listener)**: 클릭 시 12ms 햅틱 반응 및 모달/탭 전환 이벤트 완벽 바인딩
3. **비즈니스 로직 (Logic)**: 실제 경험치 가산, 로컬/원격 프로필 저장, 캔버스 5대 비율 렌더링
4. **피드백 & 예외처리 (Feedback)**: 성공 토스트, 폭죽 연출, DB 에러 fallback

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?
- [x] 게스트 모드 진입(`enterApp()`) 및 법정 6대 표준 시나리오의 엘리먼트 가시성이 보존되는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (온보딩 E3 연계)**: `index.html` 내 `triggerFirstCheckinCelebrationModal`에 `getPeerRunnersForCategory` 및 `firstCheckinCommBtn` 탑재
2. **Step 2 (프로필 편집 4종 및 게스트 오표기 완치)**: `setAccountEmail` 판별식 강화, `openProfileEditor` 인라인 폼 및 칩 토글/피커 보강, `saveProfile` fallback 가드 탑재
3. **Step 3 (스토리카드 및 잠금화면 연계)**: `records-stats.js`, `components.js` 핸들러에 `openMzShareCardModal()` 직통 호출 연결 및 기록 탭 `recStoryCardBtn` 신설
4. **Step 4 (단위/스모크 검증)**: `tests/trio-es143-es145.test.js` 실행 및 전체 `npm test` 441개 smoke tests, 38개 헌법 게이트 통과 검증
5. **Step 5 (CDP 실측)**: Chrome 헤드리스 브라우저를 통한 실물 스크린샷 획득
6. **Step 6 (법정 심사 청구)**: claims.json 작성, git commit/push, PR 생성 및 GitHub Court 심사 청구

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **단일 실패점 (SPOF) 점검**:
  - `openMzShareCardModal` 또는 `openModal` 호출 시 시트 엘리먼트가 닫히지 않고 먹통이 될 가능성 ➔ 모든 닫기 버튼에 명시적인 `closeModal()` 바인딩 보장.
- **가정의 타당성 검증**:
  - `state.profile`의 `settings`가 undefined일 경우 ➔ `p.settings = p.settings || {};` 안전 초기화 탑재.
- **재검증 결과 도출된 절차 수정/보완사항**:
  - 온보딩 첫 체크인 축하 모달에서 소통 탭 이동 버튼 외에도 홈 둘러보기 버튼을 하단에 유지하여 100% 자율 탈출 보장.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 모든 인터랙티브 버튼 클릭 시 콘솔 에러 0건 (Zero Dead-Click)
- 단위 테스트 `tests/trio-es143-es145.test.js` 전수 통과
- `npm test` 441개 smoke tests 및 38개 헌법 게이트 ALL PASS (0 fail)
- GitHub Court 법정 심사 판정 `success`

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: 헌법 게이트 린터가 REQ/PLAN 내 특정 키워드나 헤더를 검사하여 실패하는 경우 ➔ TEMPLATE 문서와 1:1 대조하여 헤더 및 필수 키워드 즉시 보완.
- **예상 블로커 2**: 법정 court 검사에서 touches 누락 파일 경고 ➔ `reports/TASK-ES-143/claims.json`에 수정된 모든 파일 등록.
- **재검증 트리거**: `npm test` 실패 시 즉시 원인 분석 후 해당 단계로 복귀하여 재검증.
