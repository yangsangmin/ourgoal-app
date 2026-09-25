# 요구사항 정의서 (REQ) — 나만의 홈 구성 연동 전수조사 및 자동 연동 시스템화

> **문서 ID**: REQ-TASK-ES-263-HOME-CUSTOMIZER-AUTO-SYNC  
> **티켓 연계**: #TASK-ES-263 (노션 생각 메모장 [06]번, Page ID: `3dc598db-9096-8102-a401-e5e19597df18`)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **귀속 축**: E1 / UX / INFRA (체크인 루프 및 홈 화면 커스터마이징 자동 연동 시스템)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  > *"나만의 홈 구성에 지금 현 상태와 다른 것들 연동이 안되는 것들, 연동 되어야 하는 것들, 기능의 이름이 수정 또는 삭제되었는데 수정이 안됐거나 삭제가 안된 것 등 모두 전수조사해서 문제 파악해. 그리고 향후 기능이 추가, 변동, 삭제 될 때 이 나만의 홈 구성 또한 자동으로 연동되도록 시스템 구축화 해."*
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  1. 홈 탭 화면 251행에 대형 핵심 카드로 실존하는 `crewPacingWidget`(실시간 동류 레이스 / 오늘 달성 레이스 위젯)이 나만의 홈 구성 모달에서 누락되어 유저가 이를 표시/숨김 제어할 수 없음.
  2. `captureCardBox`의 화면 실체는 '오늘의 3초 체크인'이나 설정 창에는 '오늘 기록하기'로만 노출되어 컴포넌트 인지 불일치 잔존.
  3. 향후 새 위젯이 추가되거나 명칭/구조가 변경될 때마다 개발자가 자바스크립트 화이트리스트 배열을 수동 수정해야만 하므로, 필연적으로 싱크가 깨지고 유령/누락 항목이 재발하는 구조적 취약점 상존.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/누락 결함)**: 홈 화면의 핵심 위젯이 커스터마이저 제어 범위 밖에 고립됨.
  - **2층 (구조적 동기화 부재)**: 정적 하드코딩 배열(`WHITELIST`)과 DOM 마크업의 분리로 인한 런타임 비동기화.
  - **3층 (시스템 구축 결여)**: 선언적 메타데이터 표준 및 자동 탐색(Auto-Discovery) 파이프라인의 부재.
- **사용자 상황 및 페르소나**:
  - 홈 화면을 나에게 꼭 필요한 미니멀/핵심 카드들로만 채워 조작 피로도를 줄이고 실천에만 몰입하고자 하는 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: E1 (체크인 루프) / UX / INFRA
- **[본질] (Essence)**: 사용자가 자신의 홈 화면을 100% 통제할 수 있도록 실제 화면의 모든 위젯과 커스터마이저가 투명하게 1:1 일치해야 하며, 향후 기능 변경 시에도 스스로 동기화되는 자율적 무결성 시스템 구축.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: 위젯 정의가 DOM 마크업과 JS 파일 양쪽에 파편화되어 단일 진실 공급원(SSOT) 부재.
  2. **원인 2**: 위젯 런타임 스캔 및 동적 자동 등록 메커니즘 결여.
  3. **원인 3**: 레이스 위젯 복원 후 커스터마이저 연동 누락.
- **[중심] (Core Bottleneck & Anchor)**: DOM 마크업에 `data-home-widget` 선언적 속성을 표준화하고, `OurgoalCustomize.discoverWidgets()`를 통해 런타임에 동적으로 최신 위젯 목록을 자동 탐색·동기화하는 레지스트리 시스템 구축.
- **[핵심] (Critical Safety & Termination)**: 상민님 절대 헌법 지시인 아바타(`levelBadgeRow`) 및 체크인(`captureCardBox`) 상단 고정(`fixed: true`, `CORE_IDS`) 불변 보존.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 나만의 홈 구성을 열었을 때, 현재 홈 화면에 보이는 모든 카드들이 정확한 명칭과 설명으로 나타나며, 원하는 위젯을 자유롭게 켜고 끌 수 있어 최고의 커스텀 만족감을 얻는다."*

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 기존 유저의 `settings.homeLayout.hidden` 설정을 날리거나 훼손하지 않음 (비파괴 정제).
  - 아바타와 오늘 기록하기의 상단 고정 잠금을 해제하지 않음.
- **해야 할 것 (Action)**:
  1. `index.html` 홈 위젯 10종에 `data-home-widget`, `data-widget-label`, `data-widget-hint`, `data-widget-fixed` 선언적 속성 부여.
  2. `js/customize.js`에 `discoverWidgets()` 및 `getEffectiveWhitelist()` 동적 자동 탐색 엔진 탑재.
  3. `crewPacingWidget`을 동적 화이트리스트에 정식 연동하여 유저 토글 지원.
  4. 단위 테스트 및 스모크 테스트 100% 무결 검증.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: `profiles.settings.homeLayout = { hidden: string[], version: 1 }` 기존 스키마 100% 유지.
- **2호 (스마트 스토리지 분기 설계)**: `normalize()` 시 고정 코어 요소 제거 및 유효 ID만 안전 적재.
- **3호 (4대 뷰 전파 배선도)**: 설정 변경 시 `OurgoalCustomize.apply(state.profile.settings)` 즉시 호출 및 홈 화면 실시간 전파.

### 3-2. 전수 인터랙션 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Selector) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `#btnCustomHomeLayout` | 홈 탭 상단 헤더 | 클릭/터치 | 나만의 홈 구성 모달(`OurgoalCustomize.open()`) 호출 | 12ms 햅틱 피드백 |
| `.switch[data-kf1-id]` | 나만의 홈 구성 모달 | 클릭/스페이스 | 해당 위젯 표시/숨김 토글 및 `saveProfile()` 저장 | 상단 고정 요소는 잠금 안내 토스트 |
| `#kf1ResetBtn` | 나만의 홈 구성 모달 | 클릭 | 홈 구성을 기본 상태로 초기화 | 컨펌 창 확인 후 리셋 |
| `#kf1DoneBtn` | 나만의 홈 구성 모달 | 클릭 | 모달 닫기 및 설정 저장 완료 안내 | 완료 토스트 표출 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 기존 유저가 설정한 `homeLayout.hidden` 배열에서 유효한 ID는 100% 보존하며 신규 위젯 제어 허용.

---

## 4. [원칙 ④] 스티브 잡스 디테일 (Steve Jobs Details)
- **자율 동기화의 우아함**: 개발자가 HTML 마크업에 `data-home-widget` 한 줄만 달면, 어떤 추가 코드 없이도 나만의 홈 구성에 즉시 자동 연동되는 완전무결한 개발자 경험 및 유저 경험 제공.
- **잠금 요소의 신뢰감**: 아바타와 1줄 체크인 상단 고정 뱃지(🔒 상단 고정)로 핵심 가치 보호.

---

## 5. [원칙 ⑤] 리스크 검토 및 회귀 방지 (Risk Analysis & Regression Prevention)
- **리스크**: 테스트 샌드박스(node.js vm) 환경에서 `document`가 없을 때 에러 발생 가능성.
  - **대응**: `typeof document === 'undefined' || !document.querySelectorAll` 방어 분기를 두어 정적 `WHITELIST`로 안전 폴백(Fallback).

---

## 6. [원칙 ⑥] 완료 조건 정의 및 절차 재검증 (Definition of Done & Verification)
1. 홈 화면 내 10대 주요 위젯에 `data-home-widget` 선언적 속성 완비.
2. `crewPacingWidget`이 나만의 홈 구성 모달에 노출되고 토글 제어가 정상 작동할 것.
3. `discoverWidgets()`를 통한 신규 위젯 동적 자동 연동이 작동할 것.
4. 단위 테스트 `tests/home-customizer-auto-sync.test.js` 100% 통과.
5. `scripts/smoke-test.js` 381개 전 항목 통과 (0개 실패).
6. `scripts/verify-integrity-gate.js` 38개 헌법 게이트 100% 통과.
7. `reports/TASK-ES-263/claims.json` 작성 및 GitHub Court 법정 합격 판정 획득.

---

## 7. [원칙 ⑦] 구현 파일 범위 (Target Files)
- `index.html`: 선언적 `data-home-widget` 메타데이터 속성 부여.
- `js/customize.js`: `discoverWidgets()` 및 `getEffectiveWhitelist()` 동적 레지스트리 엔진 탑재.
- `tests/home-customizer-auto-sync.test.js`: 신규 단위 테스트 스위트.
- `scripts/smoke-test.js`: `#TASK-ES-263` 준수 검증 추가.
- `docs/rules/TICKETS.md`: `#TASK-ES-263` 티켓 등록.

---

## 8. [원칙 ⑧] 본질 측정 및 사후 모니터링 (Essence Metrics & Review)
- **정량 지표**: 홈 커스터마이징 기능 활성화 및 저장 무결성 100%, 스모크 테스트 381개 ALL PASS.
- **정성 지표**: 홈 화면 조작 마찰 제로화 및 사용자 취향 기반 맞춤 홈 화면 만족도 제고.
