# 엔지니어링 작업계획서 (PLAN) — 카카오톡 인앱 브라우저 감지 및 Safari/Chrome 1초 탈출 안내 배너 탑재

> **문서 ID**: PLAN-TASK-ES-222-KAKAOTALK-INAPP-ESCAPE  
> **요구사항 연계**: [REQ-TASK-ES-222-KAKAOTALK-INAPP-ESCAPE](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/specs/REQ-TASK-ES-222-KAKAOTALK-INAPP-ESCAPE.md)  
> **티켓 연계**: #TASK-ES-222  
> **작성 일시**: 2026-09-23  
> **작성자**: 한국형 모바일 웹 배포 전문 테크니컬 리드  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 카카오톡 인앱 브라우저(KAKAOTALK User-Agent) 유입 시, 안드로이드는 Chrome으로 즉각 1초 intent 자동 전환, iOS는 고시인성 에메랄드 플로팅 탈출 배너 및 Safari 열기 가이드 모달 제공.
- **영향 받는 파일 목록 전수**:
  - `index.html`: `checkKakaoInAppBrowser` 및 `escapeKakaoInAppBrowser` 함수 고도화, 안드로이드 intent 자동 탈출 및 iOS 토스 스타일 에메랄드 플로팅 배너 배선.
  - `docs/rules/TICKETS.md`: `#TASK-ES-222` 티켓 등록 및 상태 관리.
  - `reports/TASK-ES-222/claims.json`: court 검증 청구서 작성.
  - `scripts/smoke-test.js`: 카카오톡 감지 및 탈출 배너 검증 케이스 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 웹뷰 쿠키 파편화와 세션 유실을 방지하고 표준 브라우저로 유저를 부드럽게 안착시키는 1초 고속 전환 브릿지.
- **[원인] (Technical Causes)**: 기존 코드가 안드로이드 intent 자동 전환을 실행하지 않고 정적 배너에 머물러 있었으며, iOS 배너의 시인성과 닫기 세션 보존이 결여됨.
- **[중심 배선] (Core Wire & State)**:
  - `checkKakaoInAppBrowser()`: DOM 준비 시 자동 실행.
  - `sessionStorage.getItem('ourgoal_hide_kakao_escape')`: 닫기 상태 확인.
  - `escapeKakaoInAppBrowser()`: Safari 열기 안내 모달 및 클립보드 복사.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 일반 Safari/Chrome 브라우저 접근 시 배너 완전 미노출 (Zero DOM Pollution).
  - 12ms 미세 햅틱 피드백(`triggerHaptic(12)`).
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[카카오톡 링크 유입] -> [KAKAOTALK UA 감지] -> [Android: intent 자동 전환] OR [iOS: 에메랄드 플로팅 배너 슬라이드] -> [Safari 열기 안내 / 복사 / 닫기 세션 보관]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 안드로이드 intent 자동 전환 & 에메랄드 배너 UI & 햅틱 | +60줄 | -10줄 | +50줄 | 외과수술적 개편 |
| `docs/rules/TICKETS.md` | 승인 티켓 대장 #TASK-ES-222 등록 | +2줄 | 0줄 | +2줄 | 티켓 관리 |
| `reports/TASK-ES-222/claims.json` | 법정 청구서 C1~C5 | +70줄 | 0줄 | +70줄 | court 검증 규격 |
| `scripts/smoke-test.js` | 단위 테스트 단언문 | +35줄 | 0줄 | +35줄 | 자동화 검증 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `#inAppBrowserNotice`, `#btnEscapeInAppNotice`, `#btnCloseInAppBanner`, `#btnCloseInAppModal`, `#btnCopyInAppUrlAgain`.
2. **이벤트 리스너 (Listener)**: 클릭 이벤트, 클립보드 복사, 12ms 햅틱 연결.
3. **비즈니스 로직 (Logic)**: intent scheme 자동 호출, `sessionStorage` 영속화.
4. **피드백 & 예외처리 (Feedback)**: 복사 성공 토스트, 부드러운 fade-out 닫기 애니메이션.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 일반 사용자(데스크톱, 일반 모바일 브라우저) 환경에 어떠한 방해도 주지 않는가? (보증)
- [x] 기존 로그인 플로우나 랜딩 페이지의 모든 버튼 클릭이 정상 보존되는가? (보증)
- [x] 12ms 미세 햅틱 및 375px 모바일 터치 타겟 44px 이상을 준수하는가? (보증)

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (`index.html`)**: `checkKakaoInAppBrowser()` 함수 구현 및 안드로이드 intent 1초 자동 전환 로직 탑재.
2. **Step 2 (`index.html`)**: iOS/기타 웹뷰용 에메랄드 플로팅 배너 마크업 및 닫기(`sessionStorage`) 핸들러 배선.
3. **Step 3 (`index.html`)**: `escapeKakaoInAppBrowser()` 모달 가이드 문구 최신화 및 12ms 햅틱 연결.
4. **Step 4 (`reports/TASK-ES-222/claims.json`)**: C1~C5 청구서 생성.
5. **Step 5 (`scripts/smoke-test.js`)**: 스모크 테스트 단언문 추가.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 신규 버튼 전수 클릭 시 에러 0건 및 정상 동작 확인.
- **시나리오 B (Zero Data Loss)**: 기존 사용자 세션 및 쿼리 파라미터 무손실 유지 대조.
- **시나리오 C (Zero UX Regression)**: 일반 브라우저에서 배너 완전 은폐 검증.
- **시나리오 D (Full State Propagation)**: 세션 스토리지 닫기 플래그 반영 확인.
- **시나리오 E (자동화 게이트 통과)**: `npm test`, `verify-integrity-gate.js`, `verify-all-clicks.js` ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~5 순차적 외과수술적 구현
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` ALL PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` ALL PASS
- [ ] 스모크 테스트 전수 검증: `npm test` ALL PASS
- [ ] Git commit & push, PR 생성 (Assignee & Reviewer: `yangsangmin`)
- [ ] Notion DB [92] 상태 `완료` 업데이트

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 안드로이드에서 intent 미지원 브라우저로 접속 시 무반응.
- **사전 방어**: intent 호출 후 배너가 계속 유지되어 수동 복사 모달을 통해 진입 가능하도록 이중 방어망 구축.
- **롤백 계획**: `git reset --hard` 즉시 롤백 가능.
- **재검증 트리거**: 배너 미노출이나 클릭 에러 발생 시 Step 1~2 재검증.
