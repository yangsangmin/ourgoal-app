# 엔지니어링 작업계획서 (PLAN) — 3차 22개 잔여 결함 소탕 및 375px 모바일 실기기 무결성 완결

> **문서 ID**: PLAN-TASK-ES-ROUND3-22-MOBILE-INTEGRITY  
> **요구사항 연계**: [REQ-TASK-ES-ROUND3-22-MOBILE-INTEGRITY](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-ROUND3-22-MOBILE-INTEGRITY.md)  
> **티켓 연계**: #TASK-ES-ROUND3-22  
> **작성 일시**: 2026-09-24  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 22개 대상 항목(88, 89, 91, 92, 93, 94, 96, 97, 98, 101, 107~118)의 375px 모바일 실기기 UI 조형 및 터치 타겟 44px/48px 확보, 상태 영속화, 런타임 방어 가드 완성.
- **영향 받는 파일 목록 전수**:
  - `index.html`: [커닝페이퍼 칩 스와이프 압축, 인앱 브라우저 탈출 배너 z-index 999999 및 Safe Area, 게스트 isGuest 명시, 기록탭 안전 프로필 가드]
  - `js/sanctuary-v3-engine.js`: [러닝메이트 레이더 접힘 영속화(localStorage)]
  - `ui.css`: [서브탭 및 마일스톤 44px/48px 터치 타겟, 마이크 권한 안내 375px 모바일 패딩 반응형 규칙]
  - `reports/TASK-ES-ROUND3-22/claims.json`: [법정 주장서]

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 375px 모바일 뷰포트에서 한 손 조작 쾌적성 극대화 및 영구 보존성 확립.
- **[원인] (Technical Causes)**: 고정폭 분할 및 z-index 경합, 터치 타겟 40px 미만 배치에 따른 실기기 사용성 저하.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile`: [게스트 모드 isGuest 불린 플래그 보장 및 records 접근 안전 가드]
  - `localStorage.setItem('ourgoal_radar_collapsed', nextState)`: [레이더 접힘 상태 보존]
- **[핵심 안전장치] (Critical Safety & Persistence)**: [기존 366개 테스트 및 38개 헌법 게이트 100% 보존, 회귀 0건]
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[모바일 375px 터치] -> [12~15ms 햅틱 피드백] -> [State & LocalStorage 동기화] -> [뷰 렌더러 즉시 반영] -> [사용자 만족]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 칩 스와이프, 인앱 배너 z-index, 게스트 플래그, 프로필 가드 | +20줄 | -5줄 | +15줄 | 외과수술적 diff |
| `js/sanctuary-v3-engine.js` | 레이더 접힘 localStorage 보존 | +12줄 | -2줄 | +10줄 | 외과수술적 diff |
| `ui.css` | 44px/48px 터치 타겟 및 마이크 권한 카드 375px 패딩 | +25줄 | -5줄 | +20줄 | CSS 토큰 준수 |
| `reports/TASK-ES-ROUND3-22/claims.json` | 법정 제출용 주장서 | +100줄 | 0줄 | +100줄 | 법정 정본 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: 고유 ID 및 접근성 시맨틱 유지
2. **이벤트 리스너 (Listener)**: 클릭/터치 이벤트 바인딩 및 햅틱
3. **비즈니스 로직 (Logic)**: 실제 localStorage 및 state 영속화
4. **피드백 & 예외처리 (Feedback)**: 토스트 및 즉각적 UI 갱신

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (데이터 모델 & 원격 스키마)**: Supabase 테이블/컬럼 확인 및 오프라인 큐 호환성 검증
2. **Step 2 (비즈니스 로직 & 핸들러)**: `index.html` 칩 스와이프, 인앱 배너 z-index, 게스트 플래그 적용
3. **Step 3 (UI 컴포넌트 마크업 & 스타일)**: `ui.css` 44px/48px 터치 타겟 및 375px 패딩 선언
4. **Step 4 (4위 1체 이벤트 배선)**: `js/sanctuary-v3-engine.js` 레이더 접힘 상태 localStorage 동기화
5. **Step 5 (4대 뷰 실시간 동시 전파)**: 홈(`renderHome`), 기록(`renderRecordsScreen`), 통계(`renderStatsScreen`), 캘린더(`renderCalendar`) 호출 배선

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (Zero Dead-Click)**: 신규 버튼 및 모달 전수 클릭 시뮬레이션 -> 콘솔 에러 0건 확인
- **시나리오 B (Zero Data Loss)**: 10종 가상 페르소나 데이터 주입 후 업데이트 시뮬레이션 -> 100% 무손실 딥이퀄 대조
- **시나리오 C (Zero UX Regression)**: 게스트 모드, 소셜 로그인 세션 유지, 핵심 루프(E1/E2/E3) 손상 여부 확인
- **시나리오 D (Full State Propagation)**: 데이터 생성/수정/삭제 시 4대 뷰 동시 즉각 렌더링 확인
- **시나리오 E (자동화 게이트 통과)**: `scripts/smoke-test.js` 및 `verify-integrity-gate.js` 100% ALL PASS 설계

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [x] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [x] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [x] 스모크 테스트 전수 검증: `npm test` PASS
- [x] [4단계: 초안 PR 제출 및 법정 판정 청구] 완결 후 상민님께 실서버 배포 여부 보고

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 모바일 브라우저별 뷰포트 높이 차이 및 안전 영역 미계산 위험
- **사전 방어 및 우회 로직**: `env(safe-area-inset-top, 0px)` 및 CSS 미디어 쿼리 fallback 보강
- **롤백 계획 (Rollback Strategy)**: 이전 커밋(`64a973a`)으로 즉시 복구 가능하도록 외과수술적 변경 유지
- **재검증 트리거**: `npm test` 또는 GitHub Court에서 단 1건이라도 실패 시 1~7번 설계를 즉시 재검토
