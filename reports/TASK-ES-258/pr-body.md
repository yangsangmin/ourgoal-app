## [블록 1] 작업 배경 및 목적 (Problem & Context)
- 티켓: #TASK-ES-258 (노션 생각 메모장 [14]번 완결)
- 상민님 원문 지시:
  > "팀 목표 시인성을 개선해야해. 한개 팀 목표에서 한번에 노출되는 정보량이 너무 많아. 팀 수준별 목표관리도 아코디언으로 하고, 공동 팀 목표도 최초 목표탭 진입시 팀별 한개만 노출되게해. 그리고 팀 수준별 목표관리는 동일 팀의 목표가 여러개면 그 목표에 따라 수준이 다를 수 있으니 팀의 목표별로 수준관리를 따로 할 수 있게 해야해. ‘팀 통합 수준관리’와 ‘목표별 수준관리’로 나눠서 작동하게 하고 시인성, 피로감까지 고려해서 정착시켜야해. 작업 시작 전에 구체적인 구현방법 보고해봐."
- 배경: 팀 목표 화면에서 정보 과밀로 인한 피로감을 해소하고, 최초 진입 시 대표 1개 목표 노출 및 칩 스위처, 마일스톤 및 수준별 목표 2계층 아코디언, 팀 통합 vs 목표별 수준관리 듀얼 분리 및 복사 엔진을 구축함.

## [블록 2] 주요 변경 내역 (Key Changes)
- `js/team-visibility-levels.js`:
  - 최초 진입 시 미완료 대표 1개 목표 선별 렌더링
  - 복수 목표 시 수평 슬라이드 칩 스위처(`tg-goal-switcher`) 렌더링
  - 마일스톤 및 세부 할 일 접기/펼치기 아코디언 배선
  - 팀 수준별 목표 관리 섹션(`tg-accordion-section`) 기본 접힘 렌더링
  - 듀얼 모드 세그먼트(`tg-level-dual-tabs`) 분리 및 팀 통합 수준 복사 엔진(`copyTeamLevelsToGoal`) 탑재
  - 모바일 375px 가로 오버플로우 방어 및 터치 타깃 44px 이상 보장
- `index.html`:
  - `data-tgfoldlist` 클릭 시 `state.profile.settings.unfoldMsList` 영구 저장 결속
  - `OurgoalTeamVisibilityLevels` 모듈 연계 무결성 유지
- `tests/team-level-management.test.js`:
  - 신규 독립 단위 테스트 스위트 작성 (대표 1개 목표 선별, 칩 스위처, 아코디언 토글, 듀얼 모드 분리 및 복사 엔진 전수 검증)
- `scripts/smoke-test.js`:
  - #TASK-ES-258 검증 단언문 추가 (376개 테스트 ALL PASS)
- `docs/specs/REQ-TASK-ES-258-TEAM-GOALS-LEVEL-MANAGEMENT.md`: 요구사항 정의서 (8원칙 완비)
- `docs/specs/PLAN-TASK-ES-258-TEAM-GOALS-LEVEL-MANAGEMENT.md`: 작업계획서 (8원칙 완비, 섹션 6 재검증 명시)
- `docs/rules/TICKETS.md`: #TASK-ES-258 등록
- `reports/TASK-ES-258/claims.json`: 정식 claims 단언문 작성

## [블록 3] 법정 판정서 (GitHub Court)
```
판정: 확인 부족(막지는 않지만, 확인 못 한 채 나가는 것이 있습니다) — 작업자가 적어 낸 지시 항목 5건 중 4건은 필요한 수준까지 확인하지 못했습니다
상민님이 하실 일: 배포를 결정하실 수 있습니다. 다만 확인 못 한 채 나가는 것이 있습니다: R1 복수 목표 시 상단 칩 스위처(tg-goal-switcher) 및 대표 1개 목표 카드(tg-compact-… — 코드만 확인 · 필요한 확인: PC 화면에서 눌러 봄 / R2 마일스톤 접힘/펼침 상태(unfoldMsList)의 프로필 설정 영구 원장 저장 배선 — 코드만 확인 · 필요한 확인: PC 화면에서 눌러 봄 / R3 팀 수준별 목표 관리 2계층 아코디언(tg-accordion-section) 및 기본 접힘(foldLevel… — 코드만 확인 · 필요한 확인: PC 화면에서 눌러 봄 외 1건
작업자가 적어 낸 지시 항목 5건 중: 글자만 확인(이 종류는 그걸로 충분) 1 · 코드만 확인(화면에서는 안 봄) 4
심사 대상 커밋 d829d6b (기준 3139b32) · 판정번호 82C5FAC1 · GitHub 에서 법정이 직접 실행(작업자 PC 밖 · 실행 번호 36067388976) · 이 PR 돌려보냄 누적 0회
GitHub court 검사 결론: success(통과 또는 확인 부족) · https://github.com/yangsangmin/ourgoal-app/actions/runs/36067388976/job/107860222755
```

## [블록 4] 영향 범위 및 롤백 대책 (Impact & Rollback Plan)
- 영향 범위: 팀 목표 탭 화면 렌더링 및 수준별 조 관리
- 롤백 대책: 문제 발생 시 본 PR 닫기 또는 브랜치 롤백 (`git revert`)으로 기존 상태 즉시 복원 가능
