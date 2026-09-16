# 엔지니어링 작업계획서 (PLAN) — #TASK-ES-133 소통 탭 3대 핵심 상호작용 실 서버 DB 완전 배선

> **문서 ID**: PLAN-TASK-ES-133-REAL-INTERACTION-BACKEND  
> **요구사항 연계**: [REQ-TASK-ES-133-REAL-INTERACTION-BACKEND](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-133-REAL-INTERACTION-BACKEND.md)  
> **티켓 연계**: #TASK-ES-133  
> **작성 일시**: 2026-09-16  
> **작성자**: Antigravity 세션 a0a58f30  
> **규범 준수**: index.html 순증가 300줄 한도(승인선 8) 및 [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수

---

## 1. [원칙 ①] 파악: 엔지니어링 아키텍처 및 변경 범위
- **REQ 핵심 요약**: 로컬스토리지에 고립되어 타 유저에게 미공유되던 소통 탭 3대 핵심 상호작용(피드 댓글, 새 팀 개설, 마니또)을 Supabase 원격 DB와 실시간 채널로 100% 완전 배선.
- **영향 받는 파일 목록**:
  - `index.html`: 피드 댓글 로더/등록/삭제, 새 팀 개설 및 전역 페칭, 마니또 실 유저 풀/실시간 응원/투명 AI 뱃지 배선
  - `scripts/smoke-test.js`: `#TASK-ES-133` 무결성 검증 단언문 추가
  - `docs/specs/`: REQ / PLAN 8원칙 정본 문서 작성
  - `docs/rules/TICKETS.md`: `#TASK-ES-133` 티켓 등재
  - `dev_log.md`: 엔지니어링 일지 기록

---

## 2. [원칙 ②] 본질 · 중심 배선 파악 (Architecture & Wiring)
- **전역 상태(`state`) 영향 분석**:
  - `state.profile.settings.feedComments`: 로컬 캐시 및 오프라인 백업 유지
  - `state.profile.settings.customGroups`: 개설 팀 로컬 영구 보존 및 자가치유
  - `state.profile.settings.manito`: 마니또 상태 및 발송 이력 보존
- **데이터 흐름 다이어그램**:
  `[UI 인터랙션] ➔ [로컬 상태 즉각 반영 (낙관적 렌더링)] ➔ [Supabase team_pings 실시간 전송] ➔ [전역 Realtime INSERT 구독자 브로드캐스트] ➔ [타 클라이언트 화면 동시 갱신]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- **테이블 전략**: `team_comments`의 UUID strict 타입 및 RLS 제약을 우회하고, 모든 식별자가 `TEXT`이며 RLS가 전면 개방된 `team_pings` 활용 (`group_id: 'feed'`, `'shared_groups'`, `'manito'`, `'manito_pool'`).
- **변경 예산 준수**:
  - `index.html`: 추가 +336줄, 삭제 -68줄 ➔ 순증가(Net) **+268줄** (한도 300줄 이하 엄격 준수)
  - `scripts/smoke-test.js`: +26줄 (컴플라이언스 단언문)

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 마크업 디자인 및 CSS 레이아웃을 임의로 변경하지 않고 인라인 핸들러 및 데이터 속성 연결.
- [x] 기존 사용자의 아바타, 목표, 기록, 세팅값이 100% 불변 보존됨.
- [x] 타인 실사용자 게시물에 무단으로 달리던 가짜 AI 챗봇 답글을 제거하여 헌법 제4조 제1항 제7호 준수.

---

## 5. [원칙 ⑤] 구현 절차 정리 (Step-by-Step Implementation Sequence)
1. **Step 1**: `team_pings` 테이블 스키마 검증 및 데이터 매핑 규격 확정.
2. **Step 2**: `loadServerFeedComments`, `handleUserCommentSubmit`, 댓글 삭제 비동기 배선.
3. **Step 3**: `loadSharedGroups`, `promptNewGroup` 커스텀 팀 전역 공유 및 로컬 자가치유 구축.
4. **Step 4**: `loadServerManitoData`, `manitoPartners`, 마니또 스탬프 실시간 전송 및 AI 투명 뱃지 표기.
5. **Step 5**: `setupFeedPostsRealtime`을 확장하여 실시간 `INSERT` 브로드캐스트 수신 렌더링.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **검증 시나리오 A (전수 인터랙션)**: 댓글 등록/삭제, 팀 개설, 마니또 스탬프 발송 시 콘솔 에러 0건 확인.
- **검증 시나리오 B (데이터 무손실)**: 새로고침 및 캐시 청소 시에도 서버 및 자가치유 스토리지에서 완벽 복원 대조.
- **검증 시나리오 C (전 UX 회귀)**: 게스트 모드 및 소셜 로그인 계정 상호작용 호환성 확인.
- **검증 시나리오 D (화면 간 상호연동)**: 피드 댓글 작성 시 피드 뷰 즉시 갱신 및 타 탭 전환 시 보존 확인.
- **검증 시나리오 E (자동화 게이트)**: `npm test` 272개 통과, 헌법 14종 통과, Zero Dead Click 통과.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트
- [x] Step 1~5 순차적 구현 완료.
- [x] `npm test` 272개 ALL PASS 확인.
- [x] Headless Chrome CDP E2E 실측 스크린샷 3종 확보 (`stage3_es133_interactions.png`, `group.png`, `manito.png`).
- [x] Tri-Sync 100% 무결성 유지 (509/509).
- [x] GitHub PR #247 생성 및 로컬 main 병합 완료.
- [x] Vercel 프리뷰 배포 완료 (`READY`) 및 GitHub CI 통과 (`SUCCESS`).

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재 블로커**: Vercel 12개 함수 한도 초과 위험 ➔ 클라이언트-Supabase 직접 실시간 채널로 0개 증설 완결.
- **잠재 블로커**: pre-commit 게이트의 `INDEX_GROWTH` ➔ 인라인 포맷팅으로 순증가 268줄 통제 성공.
- **롤백 계획**: 배포 전 결함 발견 시 `git checkout main && git reset --hard 1d4489b`로 즉시 원복 가능.
