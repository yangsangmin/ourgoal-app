# 엔지니어링 작업계획서 (PLAN) — [UI/UX 틀 개편 Phase 6] 소통 무공해 연대 & 설정 1초 보안 제어

> **문서 ID**: PLAN-TASK-UIUX-PHASE6-COMM-SETTINGS  
> **요구사항 연계**: [REQ-TASK-UIUX-PHASE6-COMM-SETTINGS](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-UIUX-PHASE6-COMM-SETTINGS.md)  
> **티켓 연계**: #TASK-UIUX-PHASE6-COMM-SETTINGS  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 소통 무공해 연대 & 설정 1초 보안 제어 8대 과업(#UIUX-49 ~ #UIUX-56) 완비.
- **영향 받는 파일 목록 전수**:
  - `ui.css`: 소통 3×2 허브, 프로필 바텀시트, 4종 리액션 애니메이션, 설정 보안 카드, 테마 스와치 칩 스타일.
  - `index.html`: 소통 탭 및 설정 탭 마크업 보강, 전역 상호작용 핸들러 배선.
  - `reports/TASK-UIUX-PHASE6-COMM-SETTINGS/claims.json`: 법정 심사 청구용 주장 파일.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: SNS 피로 없는 무공해 동류 연대와 설정창의 복잡함을 걷어낸 안심 보안 조망 완성.
- **[원인] (Technical Causes)**: 소통 탭 내 피드/동반자/팀 영역 간 위계 부재 및 설정 화면의 텍스트 중심 나열.
- **[중심 배선] (Core Wire & State)**:
  - `state.commSubTab`: 소통 3대 서브탭 상태 ('feed', 'crew', 'team').
  - `state.profile.settings.security`: 2FA 및 원격 세션 상태.
  - `state.profile.settings.theme`: 활성 테마 ('dark', 'light', 'midnight', 'warm').
- **[핵심 안전장치] (Critical Safety & Persistence)**: Local-First `state` 보존 + 비동기 원격 I/O + 4대 뷰 동시 전파.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[소통 탭 진입] -> [3×2 허브 선택] -> [피드 4종 리액션 터치] -> [12ms 햅틱 + 플로팅 모션] -> [원격 반영]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ui.css` | Phase 6 컴포넌트 스타일링 | +180줄 | 0줄 | +180줄 | CSS 토큰 준수 |
| `index.html` | 소통/설정 마크업 & 직통 핸들러 배선 | +130줄 | -10줄 | +120줄 | 외과수술적 diff |
| `reports/TASK-UIUX-PHASE6-COMM-SETTINGS/claims.json` | 법정 심사 청구 파일 | +65줄 | 0줄 | +65줄 | 신규 생성 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업**: 고유 ID 및 접근성 태그 `<button id="btnFloatingReactFire" ...>`
2. **이벤트 리스너**: `onclick="triggerFloatingReaction('fire')"`
3. **비즈니스 로직**: 실시간 카운트 증분 및 플로팅 CSS 애니메이션 가동
4. **피드백**: 12ms 햅틱 진동 및 마이크로 토스트

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 피드 게시물 및 동반자/팀 데이터 100% 무손실 보존
- [x] 모듈러 파일 라인 수 800줄 이하 엄수 (헌법 제3조 제9항)
- [x] 전수 920+개 버튼 핸들러 누락 제로 (Zero Dead-Click 보증)
- [x] showToast 호출 0건 엄수 (오직 toast()만 사용)

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (데이터 모델 & 상태 정의)**: 테마 스와치 및 4종 리액션 상태 구조 확인
2. **Step 2 (비즈니스 로직 & 핸들러)**: 소통 서브탭 전환, 플로팅 리액션, 보안 2FA 갱신, 기기 차단, 테마 변경 함수 작성
3. **Step 3 (UI 컴포넌트 마크업 & 스타일)**: `ui.css`에 Phase 6 스타일 정의 및 `index.html` 요소 탑재
4. **Step 4 (4위 1체 이벤트 배선)**: 모든 버튼에 전역 함수 직통 바인딩
5. **Step 5 (동시 전파 및 저장)**: 테마 및 상태 변경 시 `dispatchFullViewPropagation` 배선

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (Zero Dead-Click)**: 소통 허브 버튼, 4종 리액션 버튼, 보안 갱신, 기기 차단, 테마 스와치 클릭 시 콘솔 에러 0건 확인
- **시나리오 B (Zero Data Loss)**: 10종 가상 페르소나 데이터 무손실 검증
- **시나리오 C (Zero UX Regression)**: 게스트 모드, 소셜 로그인, 3대 본질 루프 손상 없음 확인
- **시나리오 D (Full State Propagation)**: 테마 변경 시 전 탭 즉각 스타일 전파 확인
- **시나리오 E (자동화 게이트 통과)**: `verify-integrity-gate.js` 및 `smoke-test.js` 100% ALL PASS

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 모듈러 조선소 아키텍처 검증: `node scripts/test-shipyard-modular.js` PASS
- [ ] 스모크 테스트 전수 검증: `node scripts/smoke-test.js` PASS
- [ ] [4단계: 심사 청구] GitHub PR 생성 및 법정 심사 청구 완료

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 테마 스와치 클릭 시 로컬 스토리지 키 불일치로 새로고침 시 테마 풀림 현상.
- **사전 방어 및 우회 로직**: `saveProfile()` 및 `document.documentElement.setAttribute('data-theme', theme)` 동시 집행.
- **롤백 계획 (Rollback Strategy)**: 문제 발생 시 `git reset --hard HEAD` 및 직전 안전 커밋 기준 롤백.
- **재검증 트리거**: 5대 검증 게이트 중 1건이라도 불합격 시 원칙 ③(효과적 해결방식)으로 돌아가 설계 재검토.
