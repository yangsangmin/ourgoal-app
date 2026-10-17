# REQ-TASK-ES-P0-CLEAN-FIXES-4022560a — 1차 문제해결 8원칙 요구사항 정의서

## ① 파악 (현상 및 지시 파악)
- 상민님 지시(`2026-10-17 "진행."` 및 10대 조건)에 따라 `origin/main`(`582eed2a16935c59a905eb77c46aed4f8e29ea43`) 기준으로 전수 재검증된 아워골 결함 중, `DIR-006`(저장/동기화 처리 파일)과 `DIR-005`(`#captureCardBox`), 그리고 승인선 ③(`G-01` 화면 통합 시 고유 기능 손실 우려)을 침범하지 않는 비저장 P0 및 핵심 기능 결함을 클린 워크트리에서 즉시 수리한다.
- 아울러 `DIR-006` 정본 인계문(`DIR006-HANDOFF-2026-10-17.md`), `G-01` 성소 vs 옛 화면 1:1 기능 대조표(`G01-SANCTUARY-VS-LEGACY-MATRIX.md`), 그리고 독립 서브에이전트 교차 검증이 반영된 마스터 감찰 보고서(`OURGOAL-FULL-FORENSIC-MASTER-REPORT.md`)를 저장소에 함께 기록한다.

## ② 본질 · 원인 · 중심 · 핵심
- **본질**: 사용자가 홈·목표·일정·기록·소통·설정 탭을 오가며 겪는 먹통 버튼, 뷰 고립(탈출 불능), 타이핑 포커스 증발, 아코디언 강제 접힘, 가짜 수치 왜곡을 제거하여 즉각적이고 정직한 인터랙션 무결성을 복원하는 것.
- **원인**: 성소(`OurgoalSanctuaryV3`)와 레거시(`OurgoalLegacy`) 상태 키(`selectedGoalId` vs `activeGoalId`, `r.time` vs `startAt/endAt`) 불일치, 이벤트 핸들러 인자 누락(`toggleSanctuaryTask` 5번째 인자), 전체 innerHTML 재할당 시 포커스/열림 상태 미보존, 하드코딩된 예시 텍스트(`🔥 14일 연속`, `목표 연동`) 잔존.
- **중심**: 저장 처리 파일(`device-save.js`, `profile-load.js`, `server-records-sync.js`, `feedback-bot-setup.js` 등)은 `DIR-006` 인계문으로 엄격히 분리하고, 순수 UI/인터랙션/상태 동기화 12개 파일만 정밀 타격 수리한다.
- **핵심**: 모든 수정 파일이 800줄 상한과 세포 경계를 준수하고, 브라우저 측정 도구(`tab-check.js`)와 법정(`court`) `behavior` 시나리오를 통과하는 것.

## ③ 해결방식
1. **홈/일정/기록 성소 엔진(`sanctuary-v3-engine.js`, `sanctuary-calendar-views.js`, `sanctuary-calendar-actions.js`, `sanctuary-focus-timer.js`, `sanctuary-record-feed.js`, `schedule-done-toggle.js`)**:
   - `fastCheckin` 기록에 `startAt`/`endAt`/`createdAt`을 명시하고 `goals[0].progress += 10` 가짜 조작을 제거하며 `+10 EXP`를 지급한다(`H-01`).
   - 목표 알약 클릭 시 `L.state.activeGoalId = goalId`를 동기화한다(`H-05`/`F-05`).
   - 주간/월간 일정 완료 토글에 5번째 인자 `taskId`를 전달하고(`C-02`), 레거시 일정 완료 토글에 `_xpAwardedSchedKeys` 중복 지급 방어를 추가한다(`C-03`).
   - 기록 탭 서브뷰(`day24`, `weekGrid`) 전환 시 피드가 덮어쓰지 않도록 `isFeedActive = (sub === 'feed')`로 고치고(`R-01`), 포모도로 완료 시 `endAt`/`createdAt`/`goalId` 및 `+25 EXP`를 부여하며(`R-05`), 피드 배지를 `r.goalId ? '목표 연동' : '일반 기록'`으로 정직하게 표시한다(`R-03`/`R-04`).
2. **목표 탭(`goal-detail.js`, `goal-detail-events.js`, `template-encyclopedia.js`)**:
   - `#msDensityToggleBtn` 클릭 시 `.ms-sub-meta-line` 표시/숨김을 토글한다(`F-01`).
   - `goals_only` 뷰에서 아카이브/팀연계 목표를 제외하고 `L.goalAchievement(g)`·`g.dueDate`를 표시하며, `gView !== 'default'`일 때도 `#msViewToggle`을 노출해 언제든 기본 보기로 돌아올 수 있게 한다(`F-02`).
   - `#subtabTplSearchInp` 재렌더링 후 포커스와 커서 위치를 복원한다(`F-15`).
3. **소통/설정 탭(`feed-list.js`, `team-companion-search.js`, `settings/render.js`)**:
   - 피드 작성자 DM 버튼 클릭 시 `L.state.dmActiveId = pUid`를 설정하고(`M-01`/`M-03`), 하드코딩된 `🔥 14일 연속`을 `post.streak || 1`로 교체한다(`M-08`).
   - 동반자 검색 결과에서 `K.openUserProfileModal(foundUser)`로 전체 유저 객체를 넘기고 `#compSearchInput` 포커스를 보존한다(`M-02`/`M-09`/`M-10`).
   - 설정 탭 활성 상태에서 `renderSettingsScreen()` 재호출 시 열려 있던 `<details>` 인덱스를 복원한다(`S-01`).

## ④ 재검토
- 수정 대상 12개 파일 중 `DIR-006` 파일이 단 하나도 없음을 재확인했다.
- `tests/settings-collapse-default.test.js`의 정적 검사(`collapseAllSettingsSections();` 문자열 존재 여부)를 깨뜨리지 않도록 초기 진입 시 전체 접힘은 유지하고 설정 탭 내부 재렌더링 시에만 열림 상태를 복원한다.

## ⑤ 절차
1. `docs/rules/TICKETS.md`, `REQ-*.md`, `.claude/plan-*.md` 작성.
2. 12개 비저장 JS 파일 수정 및 줄 수(800줄 이하) 확인.
3. `reports/TASK-ES-P0-CLEAN-FIXES-4022560a/`에 인계문·대조표·마스터보고서 및 `claims.json` + 법정 `behavior` 시나리오 배치.
4. 브라우저 하네스(`tab-check.js`) 및 단위 테스트 검증 후 커밋·푸시·초안 PR 생성 및 법정 판정 확인.

## ⑥ 절차 재검증
- 한 PR에는 단 하나의 `reports/*/claims.json`만 존재해야 하므로(`court/README.md:98`), `reports/TASK-ES-DIR006-HANDOFF-4022560a` 폴더명을 `reports/TASK-ES-P0-CLEAN-FIXES-4022560a`로 일원화하여 단일 폴더 안에 인계문·대조표·마스터보고서·`claims.json`을 둔다.

## ⑦ 단계별 실행
- 1~4단계 순차 실행.

## ⑧ 막히는 지점 예상
- 법정 시나리오에서 허용되지 않는 `do`/`expect` 키를 쓰면 차단되므로 `court/lib/scenario.js`의 닫힌 어휘(`goto`, `click`, `waitFor`, `visible`, `rect`, `noHorizontalOverflow`, `noExceptions` 등)만 사용한다.
