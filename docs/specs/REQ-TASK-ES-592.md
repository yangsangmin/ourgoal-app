# REQ-TASK-ES-592

## 1. 목적 (Purpose)
- 어려움 묶음 `G023` (XP/레벨 시스템) 세포화: `index.html` 인라인 스크립트 중 `levelBadgeHtml`, `renderLevelBadge` 등을 독립 파일(`js/avatar/level-badge.js`)로 분리.
- 이를 통해 `index.html`의 복잡성을 낮추고, 아바타 관련 로직을 분산하여 응집도를 향상함.

## 2. 요구사항 (Requirements)
- `index.html` 내에 남아 있던 `hasUserCustomizedAvatar`, `levelBadgeHtml`, `renderLevelBadge` 전역 함수를 추출하여 `js/avatar/level-badge.js`에 배치.
- 추출 과정에서 생성기(`gen-inline-hard.js`)를 사용하여 기존 코드의 AST와 완벽히 호환되도록 보장함.
- `modules.json`에 `js/avatar/level-badge.js`를 `organ` 또는 `hybrid`로 등록하고, Court 테스트를 통과할 수 있도록 함.
- 런타임에서 기존처럼 `OurgoalLevelBadgeKit`을 통해 접근 가능하도록 전역 공간(window) 연결 유지.

## 3. 관련 파일 (Related Files)
- `index.html`
- `js/avatar/level-badge.js`
- `docs/architecture/modules.json`
- `docs/architecture/module-baseline.json`
- `docs/design/harness/module-split/inline-hard-g023.json`