# 작업계획서 (Session 11fcefcf) — 체크인 즉시 아바타 AI 피드백 고도화 & 영구 원장 영속화 및 기록 탭 상시 노출

- **작업 ID**: TASK-ES-196
- **세션 ID**: 11fcefcf-368c-4ff5-bf9e-d6555389c690
- **브랜치**: feat/2026-09-20-task-es-196-checkin-ai-feedback-enhancement
- **작성 일시**: 2026-09-20

## 1. 개요 및 배경
- 상민님 지시: "체크인시 ai 피드백이 먼저 도입되어야 하지 않나?" -> "1"
- 체크인 완료 시 사용자에게 즉각적 도파민과 실천 효능감을 안겨줄 수 있도록 아바타 코치 피드백 시트를 표출하고, 수신된 피드백을 기록 객체에 영구 저장하여 기록 탭에서도 언제든 복기할 수 있도록 개선.

## 2. 작업 순서
1. `index.html`: `newRec.feedback = fb;` 할당 및 `await saveProfile();` 영구 보존 배선
2. `index.html`: `showCheckinFeedbackSheet` 아바타 피드백 모달 및 1클릭 액션 연계 구현
3. `index.html`: `buildRecordCardHtml` 내 AI 코칭 카드 렌더링 추가
4. `ui.css`: 아바타 피드백 모달 및 기록 탭 스타일 추가 (40px 버튼, 375px 무스크롤)
5. `sw.js`: 캐시 키 갱신
6. `scripts/smoke-test.js` & `scripts/verify-integrity-gate.js`: [검증 20] 결속
7. `npm test` 및 게이트 통과
8. Chrome CDP 실측 캡처
9. 로컬 main 병합 및 Vercel 프리뷰 배포
