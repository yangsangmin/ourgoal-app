# 엔지니어링 작업계획서 (PLAN) — 아워골 최고 헌법 15대 조문 감찰 결함 전면 정비

> **문서 ID**: PLAN-CONSTITUTIONAL-AUDIT-INTEGRITY-REMEDIATION  
> **요구사항 연계**: [REQ-CONSTITUTIONAL-AUDIT-INTEGRITY-REMEDIATION](file:///C:/dev/ourgoal-app/docs/specs/REQ-CONSTITUTIONAL-AUDIT-INTEGRITY-REMEDIATION.md)  
> **티켓 연계**: #TASK-CONSTITUTIONAL-AUDIT-INTEGRITY-REMEDIATION  
> **작성 일시**: 2026-09-19  
> **작성자**: 3ec346fb (Antigravity)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 헌법 15대 조문 전면 감찰에서 도출된 P0/P1 핵심 결함 6종(PWA 캐시 네임 당일 갱신, 푸터 mailto 링크 제거 및 인앱 완결, 4대 연계 뷰 동시 전파 디스패처 구축, verify-all-clicks.js 이벤트 위임 매핑 및 exit 1 차단, 게이트키퍼 정적 방화벽 보강, 전역 MOCK_PEOPLE 제거)을 외과수술적으로 완치.
- **영향 받는 파일 목록 전수**:
  - `sw.js`: `CACHE_NAME`을 2026-09-19 버전으로 갱신
  - `index.html`: 푸터 `mailto:` 제거 및 인앱 복사 모달 배선, `dispatchFullViewPropagation()` 신설 및 `saveQuickCheckin` 배선, 전역 `MOCK_PEOPLE` 격리
  - `scripts/verify-all-clicks.js`: `data-*` 이벤트 위임 매핑 탑재 및 미배선 버튼 발견 시 `process.exit(1)` 물리 차단
  - `scripts/verify-integrity-gate.js`: `sw.js` 당일 캐시 검사, `mailto:` 0건 단언문, 4대 뷰 디스패처 단언문 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 헌법 조문과 런타임 코드, 그리고 자동화 검증기 간의 완전한 1:1 일치성 확보.
- **[원인] (Technical Causes)**:
  - 분산된 렌더러 호출, 정적 분석기의 이벤트 위임 미인식, 서비스워커 캐시 갱신 절차 누락.
- **[중심 배선] (Core Wire & State)**:
  - `dispatchFullViewPropagation`: 데이터 변동 시 `state.profile`의 최신 상태를 `renderHome()`, `renderRecordsScreen()`, `renderCalendarScreen()`, `universalStatsRender()`로 원자적 동시 공급.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 각 뷰 렌더링을 독립 `try/catch` 블록으로 보호하여 한 화면의 에러가 다른 화면 렌더링을 차단하지 않도록 안전핀 장착.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[체크인/목표 저장] -> [Local State 갱신 & 원격 DB upsert] -> [dispatchFullViewPropagation()] -> [홈 + 기록 + 통계 + 캘린더 동시 리렌더링] -> [피드백 토스트]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `sw.js` | 당일 캐시 네임 갱신 | +1줄 | -1줄 | 0줄 | 버전 범프 |
| `index.html` | mailto 제거 및 4대 뷰 디스패처 배선, mock 격리 | +30줄 | -5줄 | +25줄 | 외과수술적 diff |
| `scripts/verify-all-clicks.js` | data-* 이벤트 위임 매핑 및 exit 1 차단 | +25줄 | -5줄 | +20줄 | 방화벽 강화 |
| `scripts/verify-integrity-gate.js` | 캐시 네임·mailto·4대 뷰 검증기 배선 | +30줄 | 0줄 | +30줄 | 단언문 추가 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: 푸터 공식 이메일 클릭 버튼에 고유 ID `footSupportEmailBtn`, `role="button"`, `title="이메일 주소 복사 및 문의"` 부여
2. **이벤트 리스너 (Listener)**: 클릭 시 `copySupportEmailAndPrompt()` 호출
3. **비즈니스 로직 (Logic)**: 클립보드에 `ourgoal.support@gmail.com` 복사 후 인앱 문의 모달(`footInquiryLink.click()`) 오픈
4. **피드백 & 예외처리 (Feedback)**: 토스트 메시지 안내 ("공식 지원 이메일이 복사되었습니다. 문의 내용을 입력해 주세요.")

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가? (네, 푸터 링크만 인앱 버튼으로 치환)
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가? (네)
- [x] 기존 사용자의 아바타, 목표, 기록, 세팅값이 100% 무손실 보존되는가? (네, 데이터 스키마 불변)
- [x] 성능 저하나 다중 탭 동시성 충돌을 유발하지 않는가? (네, requestAnimationFrame 기반 전파)

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (`sw.js`)**: `CACHE_NAME`을 `ourgoal-shell-v20260919-constitutional-audit-integrity-remediation`으로 갱신.
2. **Step 2 (`index.html` 푸터)**: `mailto:ourgoal.support@gmail.com` 제거 및 `copySupportEmailAndPrompt()` 배선.
3. **Step 3 (`index.html` 디스패처)**: `dispatchFullViewPropagation()` 함수 선언 및 `saveQuickCheckin()`에 연결.
4. **Step 4 (`index.html` 목업 격리)**: `var MOCK_PEOPLE` 전역 노출 정리.
5. **Step 5 (`scripts/verify-all-clicks.js`)**: `data-*` 위임 매핑 로직 추가 및 `unhandledButtons.length > 0` 시 `process.exit(1)` 처리.
6. **Step 6 (`scripts/verify-integrity-gate.js`)**: 캐시 네임 당일 확인 및 `mailto:` 부재 단언문 추가.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: `verify-all-clicks.js` 실행 시 식별되지 않는 버튼 0개 확인, `exit 0` 통과.
- **시나리오 B (Zero Data Loss)**: 10종 가상 유저 페르소나 딥이퀄 검증 100% PASS 확인.
- **시나리오 C (Zero UX Regression)**: 게스트 세션 및 3대 본질 루프(E1/E2/E3) 손상 없음 확인.
- **시나리오 D (Full State Propagation)**: `saveQuickCheckin` 실행 후 홈, 기록, 캘린더, 통계가 동시 호출되는지 테스트.
- **시나리오 E (자동화 게이트 통과)**: `npm test` 전수 실행하여 0 failures 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1: `sw.js` 캐시 버전 갱신
- [ ] Step 2: `index.html` 푸터 `mailto:` 제거 및 인앱 완결
- [ ] Step 3: `index.html` `dispatchFullViewPropagation` 신설 및 배선
- [ ] Step 4: `index.html` `MOCK_PEOPLE` 전역 정리
- [ ] Step 5: `scripts/verify-all-clicks.js` 정밀화 및 exit 1 배선
- [ ] Step 6: `scripts/verify-integrity-gate.js` 단언문 추가
- [ ] 로컬 무결성 게이트 및 스모크 테스트 검증: `npm test` ALL PASS
- [ ] [4단계: 로컬 메인 병합 상태] 완결 및 상민님께 보고

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: `verify-all-clicks.js`에서 정적 파싱 시 놓친 동적 버튼이 발견되어 exit 1이 발생할 가능성.
- **사전 방어 및 우회 로직**: 정적 태그 분석에서 `data-*`뿐만 아니라 해당 태그의 부모 컨테이너 클래스까지 2중 매핑하여 정밀도 극대화.
- **롤백 계획**: 문제 발생 시 `git checkout fix/2026-09-19-constitutional-audit-integrity-remediation` 브랜치 내 개별 파일 복구.
- **재검증 트리거**: `npm test` 실패 시 즉시 원칙 ⑤ 구현 순서 점검 및 정규식 재검증.
