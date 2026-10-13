# 승인된 최소 개인정보 범위로 피드 서버 설치안을 준비하고 별도 검토 후 적용한다.

TASK-OG-FEED-PRIVATE-STAGE2-INSTALL-01a1310c. 직접 승인 D-2026-10-13-22의 rawindividual ONLYSELF / recommendation ONLYAGGREGATES / audit PRIVATEOPERATIONS를 따른다. source 기준 origin/main f0ac1158c23c4729b0ce0b1d2637a3895c604d2b. 부모 root가 중앙 연계를 맡는다. 적용 전 고정 SQL/되돌림/원정의 보존/권한 검증 묶음을 별도 검토에 넘긴다.

이해: 기존 전체 SQL은 공개 원반응과 작성자 사유 공개가 있어 승인 범위와 다르다. 분류: 원정의와 실제 클라이언트 계약에 따른 탐색·구현 준비다. 예측: 없는 선행 표와 기존 RPC의 공개 원행, SECURITY DEFINER 실행권한, norm seed overwrite가 주요 위험이다. 반론1: 원 SQL을 그대로 쓰면 빠르지만 신규 승인 경계를 위반하므로 최소 정의만 구성한다. 반론2: 서버 표가 없으면 모든 선행을 만들자는 방식은 불필요한 credit/노출 범위를 늘리므로 현 클라이언트와 집계에 필요한 표만 만든다. 선택: 한 번의 metadata 전용 조회 후 transaction 적용·복원 계약을 고정하고 별도 소스 검토로 이어간다.

- [x] 기준 지시함·작업참고·실제 SQL/client/직전 커밋·원 음성 근거 확인 · 예상 5분 · 정확 source/API와 승인 경계 고정
- [x] 한 번의 read-only 필수 metadata 조회·원정의 private 보존 · 예상 3분 · 비밀/원행 출력0·실제 표/함수/RLS/권한 상태 기록
- [x] 최소 SQL·rollback·권한 검증·현재 정의 보존 묶음 구성 · 예상 8분 · ONLYSELF/집계/PRIVATEOPERATIONS를 SQL 접점에 결박
- [x] canonical SHA와 검토용 고정 인계 · 예상 2분 · raw/원 기대값 보존·서버 mutation0·clean HEAD
- [ ] root의 별도 고정 소스 검토·법정 흐름 인수 후 승인한 SQL 적용 및 변경 권한·집계 호환 측정 · 예상 null · root 적용 지시 전 실행0; 지시 뒤 transaction/readback와 실제 권한 확인; 별도 TASK-ES-702 첫 지표가 존재하므로 재실행0

## ① 파악
docs/sql/2026-10-13-feed-settings-and-value.sql와 실제 js/reactions.js/helpful-reason.js/feed-rank-server.js 및 scripts/feed-weekly-metrics.js 호출을 읽는다.
## ② 본질·원인·중심·핵심
새 수집은 승인된 userID/반응종류/사유태그/사유·조언만, 본인은 원행·추천은 집계·audit는 private다.
## ③ 해결방식
기존 management read-only seam 한 번으로 현재 정의와 권한 metadata를 좁게 확인하고 이전 정의는 owner-local private에 보존한다.
## ④ 재검토
본문이나 토큰을 보고·raw stdout에 남기지 않는다. 공개 raw/작성자 raw/범용 security-definer/credit 지급을 허용하지 않는다.
## ⑤ 절차
출처 확인→metadata 조회→SQL/rollback/privilege oracle→별도 소스 검토→root 적용 지시→실제 적용/readback→첫 metric 순서다.
## ⑥ 절차 재검증
원행 본인 조건은 auth.uid 결박, 집계 RPC는 개인 식별 필드0, audit는 anon/authenticated 읽기0로 확인한다. seed는 conflict do nothing이다.
## ⑦ 단계별 실행
자기 worktree plan/SQL/docs/reports만 쓰며 정상 입구 인증이나 원 norm은 변경하지 않는다. 새 계정·SQL 쓰기 probe·노출로그·공개 post·모델·미디어0이다.
## ⑧ 막히는 지점 예상
부족한 표/함수·잠재 과거 public view·실제 write 권한·SDK metric 의존은 source와 현재 metadata로 구분한다. 미지원은 성공으로 채우지 않는다. 적용 전 원정의 hash가 달라지면 transaction을 중단한다.

G0: L012 all-state PR/remote registry 확인과 원 main 브랜치 선점은 ticket-registry-read.json/ticket-reservation.json. 고정 source 검토까지 준비이며 실제 적용은 아직 미완이다.
