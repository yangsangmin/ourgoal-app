# PLAN-TASK-ES-312: 피드 내 AI 봇 활동내역 최하단 1개 축소 및 실 유저 20명 초과 시 전면 제거 실행 계획서

## 1. 목적 및 배경
- 실 유저 유입에 맞추어 피드 내 AI 봇 활동내역을 최대 1개로 축소하고 항상 최하단에 배치하여 실 사용자 중심의 커뮤니티 신뢰도를 극대화.
- 실 유저 수가 20명을 초과하는 시점부터는 AI 봇 활동을 100% 완전 제거하여 완벽한 실사용자 유기적 커뮤니티로 자동 전환.

## 2. 작업 순서
1. **`index.html` 피드 블렌딩 및 사진 피드 로직 고도화**:
   - `renderCommFeed(body)` 내 `blendedItems` 구성 시:
     - `realCount > 20`: AI 봇 0건 전면 제거 (`blendedItems = realCombined`).
     - `realCount <= 20`: `realCombined`를 상단에 배치하고, `SIM_PERSONAS[0]` 1건만 최하단에 배치.
   - `feedType === 'photo'` 사진 인증 필터 시:
     - `realCount > 20`: AI 사진 인증 0건 전면 제거.
     - `realCount <= 20`: `AI_PHOTO_VERIFICATIONS[0]` 단 1건만 최하단에 보강.
   - 피드 댓글 로직: `realCount > 20` 시 AI 봇 댓글 노출 차단.

2. **`js/components.js` 직통 액션 핸들러 구현**:
   - `handle소통_Item61Action` 구현 및 `OurgoalComponents`, `window`, `module.exports` 노출.
   - 12ms 햅틱 반응, `og_task-61_cache` 로컬스토리지 영속화, 4대 뷰 원자적 동시 전파.

3. **`docs/rules/TICKETS.md` 티켓 등록**:
   - `#TASK-ES-312` 진행중 등록.

4. **단위 및 스모크 테스트 작성/검증**:
   - `tests/feed-ai-bot-reduction.test.js` 작성 및 통과.
   - `scripts/smoke-test.js`에 `#TASK-ES-312` 단언문 추가 및 430개 전수 무결점 통과 (0개 실패).

5. **법정 claims.json 작성 및 사전 검증**:
   - `reports/TASK-ES-312/claims.json` 작성 및 통과.

6. **Git 커밋, 푸시, PR 생성 및 머지**:
   - GitHub Actions Court All Pass 확인 및 squash 머지.

7. **`TICKETS.md` 완료 반영 PR 및 머지**.

8. **Tri-Sync 3자 상호 동기화 무결성 100% 달성 및 보고**.
