# 작업계획서 (PLAN) — 전 탭 ‘이 페이지 활용법’ 우측 최상단 이름 왼쪽 배치

> **문서 ID**: PLAN-TASK-ES-266-TOP-PAGE-GUIDE-REPOSITION  
> **티켓 연계**: #TASK-ES-266 (노션 생각 메모장 [09]번, Page ID: `3de598db-9096-819f-8451-dd1d6eba7531`)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **귀속 축**: FIX / UX (탑바 정보 구조 및 가이드 접근성 혁신)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 아키텍처 및 현행 구조 분석 (Architecture & Structure Analysis)
- **현재 탑바 우측 구조 (`index.html` line 141-148)**:
  ```html
  <div class="topbar-right">
    <div class="topbar-actions" id="topbarActions">
      <button class="btn btn-ghost btn-xs topbar-action-btn" id="topHomeGuideBtn" type="button" onclick="showTabUsageGuide(state.activeTab || 'home')" title="이 페이지 활용법">💡 활용법</button>
      <button class="btn btn-ghost btn-xs topbar-action-btn" id="topHomeLayoutBtn" type="button" onclick="openHomeLayoutCustomizerModal()" style="display:none;" title="홈 카드 순서 및 표시 설정">⚙️ 홈구성</button>
    </div>
    <button class="topbar-notif-btn" id="topNotifBtn" type="button" onclick="openNotifCenterModal()" aria-label="알림 센터">
      🔔<span class="topbar-notif-badge" id="topNotifBadge" style="display:none;">0</span>
    </button>
    <button class="user-chip" id="topUserChip" type="button" onclick="openProfileModal()" aria-label="내 프로필">
      <span id="topUserName"></span>
      <div class="avatar" id="topAvatar"></div>
    </button>
  </div>
  ```
- **문제점 분석**:
  1. `topbarActions`가 맨 좌측에 위치하여, 가이드 버튼과 유저 이름(`topUserChip`) 사이에 알림 버튼(`topNotifBtn`)이 끼어 있음.
  2. 따라서 사용자의 시선이 "알림 ➔ 이름"으로 흐르며, 가이드 버튼은 이름의 왼쪽이 아닌 알림의 왼쪽에 위치하게 되어 상민님의 지시 원문인 **"우측 최상단의 이름 표시 왼쪽"**과 물리적 순서가 불일치함.
  3. 버튼 텍스트가 `💡 활용법`으로 축약되어 상민님 지시 원문인 `💡 이 페이지 활용법`과 정직하게 일치하지 않음.
- **개선 후 아키텍처 구조**:
  ```html
  <div class="topbar-right">
    <button class="topbar-notif-btn" id="topNotifBtn" type="button" onclick="openNotifCenterModal()" aria-label="알림 센터">
      🔔<span class="topbar-notif-badge" id="topNotifBadge" style="display:none;">0</span>
    </button>
    <button class="btn btn-ghost btn-xs topbar-action-btn topbar-guide-btn" id="topHomeGuideBtn" type="button" onclick="showTabUsageGuide(state.activeTab || 'home')" title="이 페이지 활용법">💡 이 페이지 활용법</button>
    <button class="user-chip" id="topUserChip" type="button" onclick="openProfileModal()" aria-label="내 프로필">
      <span id="topUserName"></span>
      <div class="avatar" id="topAvatar"></div>
    </button>
  </div>
  ```
  - `topNotifBtn` 뒤, `topUserChip` 바로 앞에 `#topHomeGuideBtn`를 물리적으로 배치하여 `[알림] ➔ [💡 이 페이지 활용법] ➔ [이름 표시 | 아바타]` 순서를 100% 실현.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **[본질] (Essence)**:
  - 6대 탭 어디서든 사용자가 우측 최상단 자기 프로필을 확인하는 순간, 바로 그 이름 왼쪽에서 `💡 이 페이지 활용법`을 발견하고 원터치로 누를 수 있도록 정보 구조(IA)와 인체공학적 조형 질서를 완벽히 일치시키는 것.
- **[원인] (Causes)**:
  - 과거 기능 추가 과정에서 `topbar-actions` 묶음이 알림 벨 좌측에 일괄 배치되어 있었고, 버튼 라벨 또한 축약되어 있었음.
- **[중심] (Core Anchor)**:
  - `#topHomeGuideBtn`의 위치를 `#topUserChip` 바로 앞으로 이동하고, 라벨을 `💡 이 페이지 활용법`으로 승격.
- **[핵심] (Key Constraint)**:
  - 기존 ID `#topHomeGuideBtn` 및 `showTabUsageGuide` 바인딩을 100% 보존하여 기존 383개 스모크 테스트 및 38개 헌법 게이트를 무결하게 통과시키는 것.

---

## 3. [원칙 ③] 변경 예산 (Modification Budget)
- **예상 수정 파일 수**: 5개 내외
  1. `index.html`: DOM 순서 재배치, 버튼 텍스트 변경, 탭 전환 시 title 동적 동기화 (~15 라인 변경)
  2. `ui.css`: `.topbar-guide-btn` 및 `#topUserName` 반응형 말줄임 스타일 (~25 라인 추가)
  3. `tests/top-page-guide-reposition.test.js`: 신규 단위 테스트 (~70 라인 신설)
  4. `scripts/smoke-test.js`: `#TASK-ES-266` 단언문 1개 추가 (~10 라인 추가)
  5. `reports/TASK-ES-266/claims.json`: 법정 클레임 청구서 5개 (~35 라인 신설)
- **라인 수 예산**: 추가 약 150라인, 삭제 약 5라인 (초저위험 최소침습 외과수술).

---

## 4. [원칙 ④] 기존 기능 불파괴 보증 (Zero-Breakage Guarantee)
- **ID 보존**: `#topHomeGuideBtn`, `#topNotifBtn`, `#topUserChip`, `#topUserName`, `#topAvatar` 전원 ID 유지.
- **함수 보존**: `showTabUsageGuide(activeTab)`, `openNotifCenterModal()`, `openProfileModal()` 전원 시그니처 및 동작 보존.
- **스모크 테스트 단언문 보존**: 기존 스모크 테스트의 `#topHomeGuideBtn` 존재 및 클릭 동작 단언은 그대로 유지되며, 신규 단언을 누적 추가.

---

## 5. [원칙 ⑤] 구현 순서 (Implementation Sequence)
1. **1단계**: `index.html` 수정
   - `topbar-right` 내부 순서 재배치: `topNotifBtn` 뒤, `topUserChip` 앞에 `topHomeGuideBtn` 배치.
   - 버튼 텍스트를 `💡 이 페이지 활용법`으로 변경.
   - `setTab(tab)` 내에서 `#topHomeGuideBtn`의 `title`을 `'이 페이지 활용법 (' + tabName + ')'`으로 동적 갱신.
2. **2단계**: `ui.css` 수정
   - `.topbar-guide-btn`: 탑바 폰트 크기(11~12px), 정돈된 여백, 뱃지 스타일.
   - `#topUserName`: 모바일 375px에서 긴 닉네임 시 가로 스크롤 방지를 위한 `max-width: 72px`(375px: `56px`), `overflow: hidden`, `text-overflow: ellipsis`, `white-space: nowrap`.
3. **3단계**: 단위 테스트 신설
   - `tests/top-page-guide-reposition.test.js` 작성: DOM 물리적 순서 단언, 텍스트 일치 단언, 클릭 시 `showTabUsageGuide` 호출 단언.
4. **4단계**: 통합 검증
   - `node tests/top-page-guide-reposition.test.js` 통과 확인.
   - `node scripts/smoke-test.js` 384개 ALL PASS 확인.
   - `node scripts/verify-integrity-gate.js` 38개 게이트 통과 확인.
5. **5단계**: 법정 클레임 작성 및 PR 심사
   - `reports/TASK-ES-266/claims.json` 작성 (주석 절대 금지).
   - 커밋, 푸시, PR 전환(`gh pr ready`), `node court/chat.js <PR번호>`.
   - Squash 머지 및 `main` 풀.

---

## 6. [원칙 ⑥] 절차 재검증 (Verification Procedure)
- **단위 테스트**: `node tests/top-page-guide-reposition.test.js` (DOM 순서 및 버튼 텍스트 100% 단언)
- **스모크 테스트**: `node scripts/smoke-test.js`
- **헌법 게이트**: `node scripts/verify-integrity-gate.js`
- **Tri-Sync 무결성 검증**: `node C:/dev/command-center/lib/tri-sync.js check`
- **GitHub Court**: `node court/chat.js <PR번호>`

---

## 7. [원칙 ⑦] 체크리스트 (DoD)
- [ ] `index.html`에서 `#topHomeGuideBtn`이 `#topUserName` 바로 왼쪽에 위치하는가?
- [ ] 버튼 텍스트가 `💡 이 페이지 활용법`인가?
- [ ] 클릭 시 현재 활성 탭(`state.activeTab || 'home'`) 가이드 모달이 호출되는가?
- [ ] 375px 모바일 뷰포트에서 가로 스크롤(오버플로우)이 발생하지 않는가?
- [ ] 단위 테스트 통과 (가짜 pass 문자열 없음)?
- [ ] 스모크 테스트 및 헌법 38개 게이트 ALL PASS?
- [ ] 노션/옵시디언/관제센터 3자 동기화(Tri-Sync) 완료?
- [ ] GitHub Court 판정 확인 및 보고서 상단 굵은 네 줄 배치?

---

## 8. [원칙 ⑧] 블로커 및 롤백 대책 (Blockers & Rollback Plan)
- **블로커 요인**: 기존 스모크 테스트나 레이아웃 스타일에서 `topbar-actions` 래퍼에 의존하는 CSS가 존재할 수 있음.
  - **대응책**: `topbar-actions` 내부 요소를 확인하고, 필요한 경우 `topbar-actions` 래퍼 자체를 알림 버튼 뒤, 유저 칩 앞으로 옮기거나 개별 버튼 단위로 안전하게 클래스 부여.
- **롤백 계획**: 문제 발생 시 `git reset --hard HEAD`로 즉시 되돌릴 수 있는 독립 커밋 단위 작업 유지.
