# 작업계획서 (Session 11fcefcf) — 일정 달력 셀 확대 및 사진형 일기(Photo Diary) 연계 & 히트맵 시인성 극대화

- **작업 ID**: TASK-ES-197
- **세션 ID**: 11fcefcf-368c-4ff5-bf9e-d6555389c690
- **브랜치**: feat/2026-09-20-task-es-197-calendar-photo-diary-and-heatmap-scaling
- **작성 일시**: 2026-09-20

## 1. 개요 및 배경
- 상민님 지시: "히트맵이랑 일정 시인성 개선도 좀 했으면 좋겠는데 일정 달력을 좀 더 크게 만들 수 있지 않나? 사람들이 사진형 일기처럼 쓸 수 있게 하는 걸 좋아하던데 지금보다 한칸한칸이 조금씩 더 컸으면 좋겠어. 한달이 한 페이지에서 잘 보이는 한도 내에서. 히트맵도 마찬가지" -> "진행"
- 일정 달력 셀(`min-height: 76px`)과 히트맵 셀(`14px × 14px`)을 시원하게 확대하고, 체크인/기록 사진이 달력 셀에 감성 썸네일로 자동 노출되는 포토 다이어리 기능을 완성하여 모바일 1화면 안에서 감성 아카이빙 경험을 극대화.

## 2. 작업 순서
1. `docs/rules/TICKETS.md`: #TASK-ES-197 승인 티켓 등록
2. `ui.css`: `.cal-cell` 높이 76px, `.heatmap-cell` 14px, 포토 다이어리 썸네일 스타일링
3. `index.html`: `calCellHtml` 사진 첨부물 자동 감지 썸네일 렌더러 구현
4. `sw.js`: 최신 캐시 네임 갱신
5. `scripts/smoke-test.js` & `scripts/verify-integrity-gate.js`: [검증 21] 결속
6. `npm test` 및 게이트 통과 확인 (335+ 테스트)
7. Chrome CDP 모바일 375px 실측 캡처 (달력 포토 다이어리 & 히트맵)
8. 로컬 main 병합 및 Vercel 프리뷰 배포 (5A)
