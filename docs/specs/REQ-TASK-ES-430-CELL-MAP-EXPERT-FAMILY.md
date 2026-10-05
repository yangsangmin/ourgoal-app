# REQ — #TASK-ES-430 세포지도: 전문가 템플릿 자료 세포를 「목표 템플릿」 영역으로

- 근거: 코디네이터 [기본값] 결정(2026-10-05) — #739(TASK-ES-425)가 만든 `data/expert-templates/*` 6세포가 영역 규칙에 없어 「그 밖의 여러 탭 기능」으로 분류됨. 생성기 FAMILIES 규칙 한 줄 PR, 시험 1건.
- 범위: `scripts/cell-map-export.js`(FAMILIES templates 규칙 한 줄), `tests/cell-map-export-es414.test.js`(1건 추가, 기존 단언 그대로), `docs/architecture/cell-map.json`(재생성), REQ·claims·dev_log·TICKETS. **제품 코드(index.html, js/**) 변경 0.**

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. `data/expert-templates/*` 6세포를 세포지도의 「목표 템플릿」 영역에 넣는다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 상민님이 구조도에서 「목표 템플릿」을 펼치면 템플릿에 관한 세포가 모두 보인다.
- **원인**: 영역 규칙이 파일 이름 접두로 묶는데, #739 가 새 폴더 이름(expert-templates)을 썼다.
- **중심**: 영역은 생성기 FAMILIES 규칙 한 곳에서 정한다.
- **핵심**: templates 규칙에 `data/expert-templates/` 를 더한다(`/^data\/(goal|expert)-templates\//`).

## 3. [원칙 ③] 해결방식

- FAMILIES templates 의 test 정규식 한 줄 수정 → `node scripts/cell-map-export.js` 재생성.

## 4. [원칙 ④] 재검토 — 한계

- 새 폴더 이름이 생길 때마다 규칙을 더해야 한다(영역 규칙은 사람이 정하는 분류).

## 5. [원칙 ⑤] 절차

1. worktree `C:/dev/wt/cell-map-430`(origin/main 127416e) → 규칙 한 줄 → 시험 → 재생성 → npm test → PR.
2. 병합 뒤 `cell-map-publish --root .` 로 웹 저장본·노션 갱신, 되읽기 대조.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 1 "세포 신고서(modules.json)에 영역 칸을 두면 된다" → 영역은 세포지도 화면용 묶음이라 신고서 형식(가드가 검사)을 바꿀 일이 아니다. 한 줄 규칙이 최소 변경.
- 반론 2 "기존 분류가 바뀌어 다른 세포가 옮겨 갈 수 있다" → 규칙은 `data/expert-templates/` 접두만 더한다. 시험이 아바타 자료 같은 다른 자료는 들지 않음을 확인한다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- `FAMILIES`(scripts/cell-map-export.js) key `templates`. 시험 「전문가 템플릿 자료 세포는 목표 템플릿 영역에 든다」.

## 8. [원칙 ⑧] 성과 측정 (작업자 측정, 판정 아님)

- 재생성 후 목표 템플릿 영역 세포 9 → 15, 그 밖의 여러 탭 기능 13 → 7. 부품 시험 통과.
