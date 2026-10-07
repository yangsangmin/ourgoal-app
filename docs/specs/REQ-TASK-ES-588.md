# REQ-TASK-ES-588: 크레딧 관련 클라이언트 코드 삭제

## 1. [원칙 ①] 문제 정확히 파악
돈(크레딧) 관련 클라이언트 코드가 프로젝트 내에 미사용 상태로 남아 있어 복잡성을 유발하고 있습니다. 상민님 결정(2026-10-07)에 따라 돈과 관련된 클라이언트 코드는 일괄 삭제하되, 템플릿 마켓 카드의 복제 수 기록/표시와 '도움돼요' 이유 쓰기 기능은 그대로 남겨야 합니다.

## 2. [원칙 ②] 본질
- 본질: 삭제
- 원인: 미사용
- 중심: 크레딧
- 핵심: 간소화

## 3. [원칙 ③] 해결방식
상민님 결정 원문(2026-10-07 15:01 결심): "돈과 관련된 코드는 삭제해. 분열작업 끝나고 나서, 필요시 새로 추가할거야", ③ "권장안대로 해" (복제 수·도움돼요 이유 유지).
이에 따라 클라이언트 쪽 크레딧 노출부와 적립 호출을 모두 제거하고 관련 파일들을 지우되, 템플릿 복제 수와 도움돼요 기능은 온전히 보존합니다. 남긴 서버 쪽(`api/**`, `docs/sql/**`)은 되돌릴 수 없는 바깥 행위(데이터 손실)를 막기 위해 유지합니다.

**참고 (작업 이력):**
이전 PR #849는 법정 돌려보냄 3회(1·2회: 손님 부팅 단계 누락 — 시나리오 작성 실수, 3회: 지시 항목 하나에 확인 수준이 다른 주장을 묶어 잠금이 안 풀림)로 헌법 PIN_02에 따라 멈췄고, 상민님 2026-10-07 15:01 결심(A안)으로 새 PR로 다시 냅니다.

## 4. [원칙 ④] 재검토
클라이언트 코드만 지우고 서버 측 API/DB는 유지하므로 부작용이 크지 않습니다. 단, 템플릿 마켓과 도움돼요 기능이 얽혀 있는 부분을 조심스럽게 분리해야 하며, 관련된 테스트 단언문들도 함께 정리해야 합니다.

## 5. [원칙 ⑤] 절차
1. `js/credits.js` 파일을 삭제합니다.
2. `index.html`에서 `<script src="js/credits.js">`, `#settingsCreditsBlock`, `ENABLE_CREDITS`, `OurgoalCredits.init`을 지웁니다.
3. `js/helpful-reason.js`에서 `OurgoalCredits.award` 호출과 크레딧 안내 문구를 제거하고 이유 쓰기 기능만 남깁니다.
4. `js/template-credit.js`에서 원작자 크레딧 적립 문구를 삭제합니다 (복제 수 기능은 보존, 파일명 유지).
5. 삭제한 요소와 관련된 `scripts/smoke-test.js` 내 단언 3건을 폐기합니다.
6. `docs/architecture/modules.json` 과 `scripts/cell-map-export.js` 에서 크레딧 관련 설명을 정리합니다.

지운 식별자 전수: 
- 파일: `js/credits.js`
- DOM id: `#settingsCreditsBlock` (검색결과: index.html 뼈대 외 `js/tabs/settings/render.js` 에서 UI 렌더링용으로만 참조되어 함께 정리, 타 기능 무관함 증명)
- JS 변수/함수: `OURGOAL_CONFIG.ENABLE_CREDITS`, `OurgoalCredits.init`, `OurgoalCredits.award`, `OurgoalCredits.policy` 
  - `git grep "OurgoalCredits"` 결과: `js/helpful-reason.js`, `index.html`, `js/tabs/settings/render.js`, 문서/테스트 파일에서만 참조됨을 전수 확인하여 안전하게 삭제함.
  - `git grep "ENABLE_CREDITS"` 결과: 설정 파일 및 연관 문서에서만 발견됨.
- 예외 (복구된 식별자): `global.sb` 
  - `js/template-credit.js`에서 삭제되었던 `global.sb = deps.sb`는 `git grep -n -E "(window|global|globalThis)\.sb\s*=[^=]" origin/main -- js index.html` 검색 결과 앱 전체에서 Supabase 객체(`sb`)를 전역 노출하는 유일한 지점임이 확인되었습니다.
  - 이로 인해 게스트 모드에서는 안 잡히지만 `team-chat.js`, `auth-safety.js`, `dm-ledger.js` 등 로그인 사용자의 핵심 기능이 조용히 죽는 중대 회귀가 발생하여 해당 줄을 되살리고 주석을 명확히("크레딧 삭제와 무관하게 유지") 수정했습니다.

## 6. [원칙 ⑥] 절차 재검증·반론 격파
- **반론**: 테스트를 지우면 안전하지 않다?
- **격파**: 폐기하는 단언 3건은 `js/credits.js` 존재 및 API 노출 검증, 기본 OFF 상태 및 화면 화폐 문구 확인, `OurgoalCredits.award` 호출 확인 등으로 완전히 삭제된 기능에 대한 검증입니다. 따라서 함께 폐기하는 것이 타당합니다.

## 7. [원칙 ⑦] 단계별 실행
1. 파일 삭제 및 HTML 수정 진행.
2. JS 연동 부분 분리 및 수정.
3. 테스트 단언문 삭제 후 `npm test` 를 통해 438건 통과 확인.
4. `module-guard` 갱신 및 `claims.json` 작성.

## 8. [원칙 ⑧] 막히는 지점·성과 측정
- 성과 측정: 
  - 게스트 시나리오(C1)에서 설정 화면에 크레딧 섹션이 없음을 확인.
  - 템플릿 마켓 기능(C2)이 정상 동작함을 양쪽(기준/작업)에서 회귀 확인.
  - 도움돼요 기능(C3)은 화면 동작이 로그인 사용자 피드에서만 닿아 게스트 시나리오로 못 쟀습니다 (코드 상의 `isMe` 및 `window.OurgoalHelpfulReason` 접근 로직 제한 때문). 대신 `openSheet` 코드가 보존되고 크레딧 호출만 제거되었음을 정적 주장으로 확인합니다.
  - `npm test` 기준선 대비 변경된 부분만 제외하고 100% 통과함(438건).
