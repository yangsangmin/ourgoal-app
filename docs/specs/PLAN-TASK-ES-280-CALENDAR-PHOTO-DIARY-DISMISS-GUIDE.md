# 엔지니어링 작업계획서 (PLAN) — 일정 사진 일기장 안내창 우측 상단 닫기(X) 버튼 추가 및 영구 숨김 처리

> **문서 ID**: PLAN-TASK-ES-280-CALENDAR-PHOTO-DIARY-DISMISS-GUIDE  
> **요구사항 연계**: [REQ-TASK-ES-280-CALENDAR-PHOTO-DIARY-DISMISS-GUIDE](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-280-CALENDAR-PHOTO-DIARY-DISMISS-GUIDE.md)  
> **티켓 연계**: #TASK-ES-280  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 일정 탭 사진 일기장 안내 배너 우측 상단 닫기(X) 버튼 조형 강화, 영구 숨김 처리 로직 영속화, 4위 1체 직통 핸들러 배선 및 4대 뷰 동시 전파 완결.
- **영향 받는 파일 목록 전수**:
  - `js/calendar-attachment.js`: `handle일정_Item29Action` 직통 핸들러 구현 및 영속화.
  - `index.html`: 일정 탭 내 `#og-task-29-container` 마크업 마운트 및 닫기 버튼 최적화.
  - `ui.css`: 모바일 375px 44px 터치 규격 및 고대비 반응형 스타일.
  - `tests/calendar-photo-diary-dismiss-guide.test.js`: 신규 단위 테스트 스위트.
  - `scripts/smoke-test.js`: #TASK-ES-280 스모크 단언문 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 사용자 화면 공간 자율성 확보 및 영구 닫기(dismiss) 상태의 무손실 원장화.
- **[원인] (Technical Causes)**: 안내창 닫기 버튼 어포던스 부족 및 직통 4위 1체 트랜잭션 부재.
- **[중심 배선] (Core Wire & State)**:
  - `ourgoal_hide_diary_guide`: 로컬스토리지 영구 숨김 플래그.
  - `og_task-29_cache`: 로컬 캐시 영속화.
- **[핵심 안전장치] (Critical Safety & Persistence)**: 4대 뷰 동시 전파(`dispatchFullViewPropagation`), 12ms 햅틱, 디바운스 버튼 잠금.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[X 닫기 터치] -> [12ms 햅틱 & 디바운스] -> [배너 즉시 숨김 & 캐시 영속화] -> [4대 뷰 동시 전파] -> [토스트 피드백]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `js/calendar-attachment.js` | 직통 핸들러 및 영속화 로직 | +80줄 | 0줄 | +80줄 | 모듈화 |
| `index.html` | 마크업 배선 | +15줄 | 0줄 | +15줄 | 외과수술적 |
| `ui.css` | 반응형 스타일 | +70줄 | 0줄 | +70줄 | CSS 토큰 준수 |
| `tests/calendar-photo-diary-dismiss-guide.test.js` | 단위 테스트 | +110줄 | 0줄 | +110줄 | 테스트 신설 |
| `scripts/smoke-test.js` | 스모크 단언문 | +20줄 | 0줄 | +20줄 | 회귀 방지 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#og-task-29-container`, `#og-task-29-action-btn`, `#btnHideCalDiaryGuide`
2. **이벤트 리스너 (Listener)**: 클릭/터치 이벤트 바인딩
3. **비즈니스 로직 (Logic)**: `handle일정_Item29Action` 실제 상태 저장 및 뷰 동기화
4. **피드백 & 예외처리 (Feedback)**: 12ms 햅틱, 토스트 피드백, 4대 뷰 동시 전파

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 캘린더 일정 및 첨부자료 데이터를 100% 무손실 보존했는가?
- [x] 전체 파일 덮어쓰기 없이 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 필수 DOM ID(`#calSubGuideBanner`, `#btnHideCalDiaryGuide`)가 불변 보존되는가?
- [x] 375px 모바일 뷰포트에서 가로 넘침(0px) 및 터치 영역 44px을 만족하는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `js/calendar-attachment.js`에 `handle일정_Item29Action` 구현 및 `window` 노출.
2. **Step 2**: `index.html` 일정 탭 내 `#og-task-29-container` 마크업 마운트.
3. **Step 3**: `ui.css`에 고대비 반응형 스타일 및 44px 터치 타겟 추가.
4. **Step 4**: `tests/calendar-photo-diary-dismiss-guide.test.js` 작성 및 로컬 실행 통과.
5. **Step 5**: `scripts/smoke-test.js`에 #TASK-ES-280 단언문 추가 및 398개 스모크 통과 확인.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: `#og-task-29-action-btn` 및 `#btnHideCalDiaryGuide` 클릭 시 에러 0건 확인.
- **시나리오 B (Zero Data Loss)**: 캘린더 일정 데이터 및 로컬 캐시 불변 딥이퀄 검증.
- **시나리오 C (Zero UX Regression)**: 배너 숨김 후 재렌더링 시 배너 미노출 유지 확인.
- **시나리오 D (Full State Propagation)**: 4대 뷰 렌더러 함수 동시 호출 무결성 확인.
- **시나리오 E (자동화 게이트 통과)**: 38개 헌법 게이트 및 스모크 테스트 100% ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] `js/calendar-attachment.js` 핸들러 구현 완료
- [ ] `index.html` 마크업 배선 완료
- [ ] `ui.css` 스타일 정의 완료
- [ ] 단위 테스트 `tests/calendar-photo-diary-dismiss-guide.test.js` PASS
- [ ] `scripts/smoke-test.js` PASS (398개 통과)
- [ ] `scripts/verify-integrity-gate.js` PASS (38/38)

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 월간/주간 캘린더 전환 시 배너 재등장 문제.
- **사전 방어 및 우회 로직**: `renderCalendarScreen` 내부에서 항상 `localStorage` 플래그를 체크하도록 방어 로직 유지.
- **롤백 계획 (Rollback Strategy)**: 변경 파일 외과수술적 롤백 및 캐시 원복.
- **재검증 트리거**: 배너가 의도치 않게 다시 표시될 경우 Step 1 및 Step 2 플래그 확인.
