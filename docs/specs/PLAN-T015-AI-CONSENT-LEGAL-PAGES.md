# PLAN-T015 — AI 고지 동의 모달·/privacy·/support (REQ-T015 의 실행 계획)

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악

REQ 요약: 동의 없이 AI 제공자로 텍스트가 나가지 않게 하고, 방침·지원을 URL 로 연다. 변경 파일: `index.html`(동의 로직·게이트·모달·설정 행·링크·앱 안 방침 제7조), `privacy.html`·`support.html`(신규), `vercel.json`(재작성 2줄), `sw.js`(캐시명), `docs/legal/privacy.md`, `docs/rules/TICKETS.md`, `dev_log.md`, `docs/specs/REQ·PLAN`, `reports/T015/**`, `scripts/test-ai-consent.js`(신규).

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)

**본질**: 사용자가 자기 글이 어디로 가는지 알고 고른다. **원인**: AI 호출부마다 전송 경로가 생겼고 중앙 동의 지점이 없었다. **중심**: 동의 판정을 한 함수로 모아 모든 호출부가 쓰게 하는 배선. **핵심**: 동의 전 AI 요청 0건, 거부해도 기록 저장·로컬 피드백 유지. 전역 상태 영향 없음(`state` 불변). 동의는 `localStorage['ourgoal_ai_consent'] = {v, choice, at}` 하나. 흐름: 체크인 저장 → `ensureAIConsent()`(모달) → `requestAIFeedback` → `aiConsentGranted()` 참일 때만 Gemini/서버 호출, 아니면 `localFeedback`. 다른 8개 호출부도 같은 함수를 첫 줄에서 쓴다.

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

`index.html` +약 100줄 / 삭제 0, `privacy.html` +약 110, `support.html` +약 90, `vercel.json` +8, `sw.js` ±1, 시험 +약 100. 디자인 변경 없음 — 기존 `.btn`·`.set-block`·`openModal` 재사용.

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증

기존 조문 문단은 수정하지 않고 제7조만 추가. 로그인·체크인 저장·로컬 피드백 경로 불변. 유저 데이터 삭제·이동 없음. 동의 전 AI 호출부의 반환형은 각 함수의 기존 실패 경로 반환형과 동일하게 맞췄다(호출부 무수정).

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

데이터(동의 저장) → 로직(게이트) → UI(모달·설정 행·링크) → 리스너(설정 변경 버튼) → 전파(체크인 직전 확인, 상태 글자 갱신).

## 6. [원칙 ⑥] 절차 재검증: 법정 주장(claims) 설계

behavior 3건(동의 창·거부, 설정에서 동의, 링크), static 4건(페이지·재작성), unverified 3건(AI 요청 0건은 실서버, 운영 200, 오픈채팅). 못 재는 것은 사유와 재는 순서를 claims.json 에 적었다.

## 7. [원칙 ⑦] 단계별 실행 체크리스트

- [x] 조사·REQ·PLAN  - [x] 페이지·재작성  - [x] 동의 로직·게이트  - [x] 링크·캐시명
- [x] `node scripts/test-ai-consent.js` 23/23  - [x] 스모크·무결성·전수 클릭
- [x] 브라우저 실측(0→0→1)·스크린샷  - [ ] 초안 PR·법정 판정·프리뷰 URL 200

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획

롤백: 이 PR 을 되돌리면 동의 저장값(`ourgoal_ai_consent`)만 기기에 남고 무해하다. 게이트 함수가 참을 못 줄 때(저장소 차단)는 AI 미전송 = 안전 방향. 프리뷰에서 `/privacy` 가 404 면 `vercel.json` 재작성 규칙 확인 → 원칙 ③ 회귀.
