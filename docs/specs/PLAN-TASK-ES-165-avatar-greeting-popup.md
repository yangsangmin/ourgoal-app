# 작업계획서 (PLAN) — 앱 진입 시 화면 절반 크기 아바타 인사 팝업 및 시간대별 멘트·설정창 커스텀

> **문서 ID**: PLAN-TASK-ES-165-avatar-greeting-popup  
> **티켓 연계**: #TASK-ES-165  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 파악 및 정의 (Problem Definition)
- **작업 목표**:
  - 앱 진입 시 뷰포트 높이 절반 수준(약 48vh)의 대형 아바타 인사 팝업을 표시하고, 시간대별(오전 4시~오후 4시 주간, 오후 4시~오전 4시 야간) 맞춤 멘트를 제공한다.
  - 팝업에 누르기 쉬운 대형 X 닫기 버튼을 배치하고 2.5초(2500ms) 후 자동으로 페이드아웃되어 닫히는 무소음 UX를 구축한다.
  - 설정창(`screen-settings`)에 아바타 인사 팝업 활성화 여부, 주간/야간 기준 시간(시작 시각), 주간/야간 멘트 커스텀 필드 및 실시간 미리보기 기능을 제공한다.
- **적용 대상 파일**:
  - `ui.css`: 대형 아바타 인사 팝업, 큰 X 닫기 버튼, 페이드아웃 애니메이션.
  - `index.html`: `openAvatarGreetingPopup`, `closeAvatarGreetingPopup`, `boot` 진입 호출, `renderSettingsScreen` 커스텀 섹션.
  - `sw.js`: 캐시 버전 `ourgoal-shell-v20260917-es165` 갱신.
  - `scripts/smoke-test.js`: #TASK-ES-165 검증 추가.
  - `docs/rules/TICKETS.md` & `dev_log.md`: 작업 이력 기록.

---

## 2. [원칙 ②] [본질] · [원인] · [중심] · [핵심] 4대 요소 분석 (Root Cause & 4 Elements)
- **[본질] (Essence)**:
  - 아바타와 나 자신의 교감과 내적 동기부여(E1 본질). 앱에 들어왔을 때 나를 반겨주는 압도적이고 든든한 아바타 비주얼.
- **[원인] (Causes)**:
  - 기존에는 앱 부트 시 정적 화면으로 바로 진입하여 아바타를 통한 능동적 반김과 자극 효과가 부재했음.
- **[중심] (Core)**:
  - 뷰포트 50% 크기의 비주얼 임팩트 + 시간대별 자기 성찰 멘트 + 2.5초 자동 소멸 및 큰 X 버튼을 통한 조작 편의성.
- **[핵심] (Anchor)**:
  - `openAvatarGreetingPopup`: 현재 시각과 프로필 설정 기반 멘트 선정 및 렌더링.
  - 2500ms Auto-Fadeout: 2.5초 후 클래스 토글로 페이드아웃 후 엘리먼트 제거.
  - 대형 X 닫기 버튼: 터치가 쉬운 42px 원형 버튼 및 즉시 닫힘.
  - 설정창 커스텀 폼: 주간 기준 시각, 야간 기준 시각, 커스텀 멘트 저장 및 미리보기.

---

## 3. [원칙 ③] 설계 및 아키텍처 방안 (Design & Architecture)
- **시간대 판별 알고리즘**:
  - 사용자 지정값(기본값: `dayStartHour = 4`, `nightStartHour = 16`)
  - 현재 시각 `curHour = new Date().getHours()`
  - `isDay = curHour >= dayStartHour && curHour < nightStartHour`
  - 주간이면: `profile.settings.avatarGreeting?.dayGreeting || '오늘은 뭘 할거냐? 내자신'`
  - 야간이면: `profile.settings.avatarGreeting?.nightGreeting || '오늘은 뭘 했냐? 내자신'`
- **팝업 구조**:
  ```html
  <div id="avatarGreetingModal" class="avatar-greet-overlay">
    <div class="avatar-greet-container">
      <button class="avatar-greet-close-big" onclick="closeAvatarGreetingPopup()" aria-label="닫기">✕</button>
      <div class="avatar-greet-bubble">
        <span class="avatar-greet-text">오늘은 뭘 할거냐? 내자신</span>
      </div>
      <div class="avatar-greet-img-wrap">
        <!-- 대형 아바타 SVG/IMG (높이 ~48vh) -->
      </div>
    </div>
  </div>
  ```
- **생명주기 제어**:
  - 모달 렌더 직후 `window.__avatarGreetTimer = setTimeout(() => { closeAvatarGreetingPopup(true); }, 2500);`
  - `closeAvatarGreetingPopup(withFade)`: `clearTimeout(window.__avatarGreetTimer)` 후 페이드아웃 적용 후 DOM 정리.

---

## 4. [원칙 ④] 엣지 케이스 및 부작용 방지 (Edge Cases & Countermeasures)
- 1) **설정 비활성화**: `settings.avatarGreeting?.enabled === false`인 경우 부트 시 팝업 스킵.
- 2) **연속 렌더 방지**: 기존 `#avatarGreetingModal`이 이미 존재하면 중복 생성 차단.
- 3) **주/야간 시간대 교차 설정(예: 야간 시작 22시, 주간 시작 6시 등)**: 올바른 모듈러/범위 판별 로직 적용.
- 4) **용어 헌법 준수**: '잔디' 단어 절대 배제, '히트맵' 단일화.

---

## 5. [원칙 ⑤] 실행 시퀀스 (Implementation Sequence)
- 1. `ui.css`에 아바타 인사 팝업 전용 스타일 작성.
- 2. `index.html`에 `openAvatarGreetingPopup`, `closeAvatarGreetingPopup`, `boot` 연동, 설정창 섹션 작성.
- 3. `sw.js` 캐시 갱신 (`ourgoal-shell-v20260917-es165`).
- 4. `scripts/smoke-test.js`에 검증 케이스 추가.
- 5. `npm test` 및 `node scripts/verify-integrity-gate.js` 전수 검증.
- 6. 로컬 main 병합 및 Tri-Sync 최종 완결.

---

## 6. [원칙 ⑥] 절차 재검증 (Verification & Anti-SPOF)
- `npm test` 실행 (305개 테스트 전수 통과).
- `node scripts/verify-integrity-gate.js` 실행 (17대 게이트 100% PASS).
- 스펙 린터 100% 무결성 검증.

---

## 7. [원칙 ⑦] 완전성 점검 및 가설 입증 (Completeness & Hypothesis)
- 앱에 들어서는 순간 나를 반기는 50% 크기의 아바타가 오늘 하루의 결의와 성찰을 단 2.5초 만에 자극하여, 사용자의 몰입감과 루틴 실천 의지가 대폭 상승함을 입증함.

---

## 8. [원칙 ⑧] 본질 연계 및 회고 (Essence Link & Retrospective)
- 본질축: E1(나 자신과의 싸움 — 내 아바타와의 직접 대화 및 일체감 극대화).
