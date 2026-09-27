# REQ-TASK-ES-312: 피드 내 AI 봇 활동내역 최하단 1개 축소 및 실 유저 20명 초과 시 전면 제거

## 1. 개요
- **티켓 ID**: `#TASK-ES-312`
- **본질축**: `E3/UX`
- **상민님 원문 지시**:
  > *"이제 실제 유저 유입되고 있으니까 ai 봇 활동내역 모두 1개로 줄여. 1개만 제일 하단에 보이고, 실제유저들이 작성한 걸로 보이게 해. 실 유저 20명 넘어가면 ai 활동 모두 활동 없애고."*

## 2. 세부 요구사항
1. **피드 내 AI 봇 활동내역 최하단 1개 축소**:
   - 일반 피드 및 사진인증 피드 등 모든 피드 뷰에서 AI 봇 활동내역을 최대 1건으로 제한.
   - 실제 유저 작성 게시물(`realCombined`)을 최상단에 우선 배치하고, AI 봇 게시물은 항상 피드 최하단에 단 1개만 배치.
   - 피드 상단은 온전히 실 유저들의 실천 및 인증으로 채워지도록 보장.

2. **실 유저 20명 초과 시 AI 봇 전면 제거(Zero AI Bots)**:
   - 등록/활동 실 유저 수가 20명을 초과(`realCount > 20`)하는 즉시 AI 봇 포스트, 사진 인증, AI 댓글 등 모든 AI 봇 활동을 100% 완전 제거(0건).

3. **사진 인증 피드(`feedType === 'photo'`) 동일 적용**:
   - `AI_PHOTO_VERIFICATIONS` 다건 노출을 폐지하고, `realCount <= 20`일 때 최대 1건 최하단 보강, `realCount > 20`일 때 0건 전면 제거.

4. **단일 진실 공급원 및 4위 1체 배선 (`js/components.js`)**:
   - `handle소통_Item61Action` 구현.
   - 12ms 햅틱 반응 (`triggerHaptic(12)`).
   - `og_task-61_cache` 로컬스토리지 영속화 (`ai_bot_reduced_to_one: true`, `remove_ai_when_users_over_20: true`).
   - Supabase upsert 비동기 동기화.
   - 헌법 제15조 제6항 4대 뷰 원자적 동시 전파.

5. **품질 검증 및 3자 동기화**:
   - 단위 테스트 `tests/feed-ai-bot-reduction.test.js` 전수 통과.
   - 스모크 테스트 `scripts/smoke-test.js` 430개 전수 통과.
   - Tri-Sync(노션, 옵시디언, 관제센터) 100% 무결성 동기화.
