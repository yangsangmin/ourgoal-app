# 엔지니어링 작업계획서 (PLAN) — #TASK-ES-338 HOME-01 홈 원스크린 콕핏

> **문서 ID**: PLAN-TASK-ES-338-HOME-01-ONESCREEN-COCKPIT  
> **요구사항 연계**: [REQ-TASK-ES-338-HOME-01-ONESCREEN-COCKPIT](../specs/REQ-TASK-ES-338-HOME-01-ONESCREEN-COCKPIT.md)  
> **티켓 연계**: #TASK-ES-338 (노션 HOME-01)  
> **작성 일시**: 2026-10-04  
> **작성자**: Claude Code 세션 baf85964 (Opus 5.5)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 375×812 홈 첫 화면을 [상단 바·인사] + [체크인 카드] + [3대 미니 나침반]으로 줄이고, 동반자 레이스와 오늘 목표 목록은 노드째 85vh 바텀시트로 옮긴다.
- **영향 받는 파일 목록 전수**:
  - `js/tabs/home/sub-onescreen.js` (신규): `OurgoalHomeOneScreen.build/wire/open/close/refreshCounts`
  - `js/tabs/home/index.js`: `init()` 에 소블록 등록 3줄
  - `index.html`: `<script src="js/tabs/home/sub-onescreen.js">` 1줄
  - `ui.css`: HOME-01 블록(나침반·시트·원스크린 여백)
  - `reports/TASK-ES-338/claims.json`, `reports/TASK-ES-338/scenarios/*.json`: 법정 청구서
  - `docs/rules/TICKETS.md`, `dev_log.md`: 대장·로그

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질]**: 홈 = 1초 콕핏. 오늘 할 일(체크인)과 갈 곳(목표·동반자·회고)이 한 화면에 있다.
- **[원인]**: `#screen-home` flex 열에 카드가 계속 쌓였고 접는 계층이 없었다. 하단 여백 이중 적용(ui.css 9108·9112행).
- **[중심 배선]**: `#screen-home` order 규칙(ui.css 10220~)과 `#crewPacingWidget`·`#homeGoalList`.
- **[핵심 안전장치]**: 노드 이동(복제·삭제 없음) → ID 로 찾는 `renderHome()`·동반자 집계·`OurgoalCustomize` 무수정 동작. 필수 노드 누락 시 조립 중단(기존 배치 유지).
- **흐름**: `[홈 진입] → [나침반 누름] → [open(key): 패널 전환·history.pushState] → [닫기 4중/뒤로가기] → [close(): history.back·포커스 복귀]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 변경 성격 |
| :--- | :--- | :---: | :---: | :--- |
| `js/tabs/home/sub-onescreen.js` | 나침반·시트·노드 이동 | +250줄 | 0 | 신규 소블록(800줄 상한 내) |
| `js/tabs/home/index.js` | 소블록 등록 | +3줄 | 0 | 외과수술적 diff |
| `index.html` | 스크립트 태그 | +1줄 | 0 | 외과수술적 diff |
| `ui.css` | HOME-01 스타일 | +30줄 | 0 | 파일 끝 추가 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업**: `#homeCompassRow`(`role=navigation`), 버튼 3개 고유 ID, `#homeDetailPanel`(`role=dialog`, `aria-modal`, `aria-labelledby`)
2. **이벤트 리스너**: 나침반 위임 클릭, ✕·배경 클릭, 손잡이 touchstart/move/end, `keydown`(Esc), `popstate`, `MutationObserver`(탭 이탈·목표 수)
3. **비즈니스 로직**: 패널 전환, 기존 노드 이동, `setTab('records')`, 목표 카드 수 집계
4. **피드백**: `triggerHaptic(12)`, 0.3초 슬라이드, 30% 암막, 포커스 복귀, 숨긴 위젯 안내문

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 섹션을 지우지 않고 옮기며, 옮기기 전에 진입점(나침반)을 먼저 만든다.
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 diff 로 작성한다.
- [x] 저장 데이터·스키마를 바꾸지 않는다.
- [x] 모달(z 100)이 시트(z 90) 위에 뜨고, 모달 닫기가 시트를 같이 닫지 않는다.
- [x] 게스트 진입 및 법정 표준 시나리오가 쓰는 `#homeAddGoal` 은 시트 안에서도 고유하다(보이는 1개).

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `sub-onescreen.js` 작성 및 홈 메가블록 등록, 스크립트 태그 추가
2. **Step 2**: `ui.css` HOME-01 블록 추가, 375×812 스크롤 높이 실측으로 간격 조정
3. **Step 3**: Playwright 로 상호작용 실측(열기·닫기 4중·Esc·탭 이탈·모달 겹침)
4. **Step 4**: `npm test`
5. **Step 5**: claims.json·시나리오 작성, dev_log·TICKETS 기록, 초안 PR, 법정 심사 청구

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
- **SPOF**: 시트가 `.screen` 안에 있으면 `will-change: transform` 때문에 fixed 기준 상자가 홈으로 갇힌다 → body 에 둔다(실측으로 확인한 결함을 반영함).
- **가정 검증**: "ID 만 있으면 렌더러가 찾는다" — `homeGoalList`·`crewPacingWidget` 을 `#screen-home` 범위로 찾는 JS 가 없음을 grep 으로 확인(CSS 의 `#screen-home #…` 규칙은 order·여백뿐).
- **보완**: 홈 구성에서 동반자 위젯을 숨긴 사용자를 위한 빈 패널 안내 추가.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- 375×812 스크롤 높이 ≤ 812px (작업자 실측)
- 나침반·시트 상호작용 페이지 예외 0건
- `npm test` 통과
- 법정 판정은 `node court/chat.js <PR번호>` 출력으로만 인용

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **블로커 1**: 법정 시나리오에 스크롤 높이 확인 낱말이 없음 → 보이기/안 보이기로 첫 화면 구성을 증명하고, 수치는 작업자 실측으로 분리.
- **블로커 2**: 손가락 쓸기·실기기 뒤로가기 → `unverified`(needs-real-device) + [손 필요].
- **재검증 트리거**: `npm test` 또는 법정이 돌려보내면 해당 단계로 돌아가 1~7 재검증.
