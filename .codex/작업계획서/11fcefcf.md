# 작업계획서 (Session 11fcefcf) — #TASK-ES-198 캘린더/일정 탭 6대 결함 전수 일괄 정상화

- **작업 ID**: TASK-ES-198
- **세션 ID**: 11fcefcf-368c-4ff5-bf9e-d6555389c690
- **브랜치**: feat/2026-09-20-task-es-198-calendar-full-fix
- **작성 일시**: 2026-09-20

## 1. 개요 및 배경
- 상민님 지시: "일정 제대로 작동 안하는 것들 모두 찾아서 보고해" -> 11개 항목 정밀 진단 및 6대 결함 보고 -> "진행" 지시 접수.
- 캘린더 탭의 6대 결함(주간 모드 런타임 크래시, 타임라인 일정 수정 미반영, AI 일정 등록 카드 은폐, 폰 잠금화면 바로가기 버튼 은폐, 팀 목표 마일스톤 토글 미구현, 배경사진 선택 모달 복귀 플로우 유실)을 일괄 해결하여 캘린더/일정 시스템의 완전성을 달성.

## 2. 6대 결함 해결 순서
1. `js/sanctuary-v3-engine.js`:
   - 주간 모드 `weekDays.join('')` 및 `dayDetails` 미정의 오류 완전 해결 (`weekRowsHtml` 및 요일 그리드 + 상세 리스트 정상 렌더링).
   - 타임라인 모드 `openScheduleDetail`에서 `openCalendarManualEditModal(dt, found || null, kind || 'custom')` 인자 교정 (Zero-Save 수정 실패 버그 퇴치).
   - 성소 캘린더 헤더에 폰 잠금화면 바로가기 버튼(`data-action="open-lockscreen"`) 배치.
2. `ui.css`:
   - `#calAgentCard`의 `display: none !important;` 해제 및 성소 캘린더 하단 맞춤 스타일링 적용.
   - 주간 모드 그리드 레이아웃 및 요일별 셀 인터랙션 스타일 보강.
3. `index.html`:
   - `toggleScheduleDone`에 `kind === 'team_goal'` 분기 추가 (팀 목표 마일스톤 완료 토글 정상 연동).
   - `data-hubedit`에 `kind === 'team_goal'` 분기 추가 (팀 마일스톤 수정 연동).
   - `openCalendarDayBgPickerModal`에서 `fromHub` 플래그 보존 및 모달 닫기/완료 시 허브 모달 복귀 플로우 보장.
4. `sw.js`:
   - 최신 캐시 네임 갱신 (`ourgoal-shell-v20260920-task-es198-cal-full-fix`).
5. `scripts/smoke-test.js` & `scripts/verify-integrity-gate.js`:
   - `[검증 22]` 게이트 추가 및 방화벽 결속.
6. `npm test` 및 무결성 게이트 통과 (335+ ALL PASS).
7. Chrome CDP 모바일 375px 실측 캡처 (주간 모드, 타임라인 수정 반영, AI 등록 & 잠금화면 버튼).
8. 로컬 main 병합 및 Vercel 프리뷰 배포 집행 (모드 4-A).
