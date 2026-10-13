# TASK-ES-701 — 피드 공유 카테고리 caller 연결

목표: 기록/목표 공유 창에서 실제 목표 주제에 맞는 기본 칩과 사용자가 선택한 칩을 같은 post 메타·기존 insert helper에 보존한다.

본질 축 FIX(무오염 동료 연결 E3의 기존 producer 결함). 작업참고 기준 PR #968. fresh source db8b7ebbd8a9104cd2e3c10f1602d2ae32bf0d6c(PR972). 라우팅 alias TASK-ES-SHARE-FEED-CATEGORY-01a1310c, 실제 공통/G0 ID TASK-ES-701. WORK-REFERENCE L012의 PR/remote 조회에서700 점유·701 미점유를 확인하고 origin/fix/task-es-701-share-feed-category를 실제 선점했다. 중앙 tasklink 동기화는 root 담당이며 이를 G0 등록으로 대신하지 않는다.

원 지시 귀속: 이 작업자는 대표님 새 발화나 원 Claude54f 전달 item을 직접 관찰하지 않았다. root가 실제 전달된 다른 세션 요청의 DIR006 owner 교정을 배정했다. 원 source인 reports/TASK-ES-696/claims.json R6는 「share-to-feed.js 는 저장 안정화(DIR-006) 담당 파일이라 이 변경에서 손대지 않고, 바꿀 줄을 담당에게 넘긴다」이다. 이 원문/보류 경계는 유지하며 이번 caller 교정은 root가 별도로 배정했다. 대표님 원문이나 본질 승인으로 대체·합성하지 않는다. 원 기술 전달의 bounded 기록은 C:/Users/HP/handover/2026-10-13-claude-309dca5d/feed-share-category-author-request.json이며 representativeJudgment:false/nativeAuthorIdentityVerified:false다. native item UUID는 null이다.

그 기록의 원 기술 제안(역사적 snippet, 실제 현source 줄 번호나 대표 원문이 아님)은 `var selectedCat = (window.OurgoalCategoryMap && window.OurgoalCategoryMap.fromGoal(curGoal)) || 'life';`, `OurgoalCategoryMap.withMeta(post, OurgoalCategoryMap.feedPostMeta(curGoal, null, { categoryOverride: selectedCat, contentType: 'record', pct: goalPct, caption: post.caption }))`, `await OurgoalCategoryMap.insertFeedPost(L.sb, post);`다. 이번 R3은 이 글자를 기계적으로 복사하지 않고 현 submit의 실제 finalGoalPct와 첫 await 전 captured scalar frame으로 구현한다. SQL/PR 대기 안내는 역사적이며 이미 accepted SQL/merged969·971·972를 다시 요구하지 않는다.

## 1. [원칙 ①] 문제 정확히 파악

실제 대상은 js/tabs/records/share-to-feed.js의 openShareToFeedModal이다. selectedCat은 raw curGoal.category 또는 study이고 값이 목록 밖이어도 study로 내려간다. topic health/러닝·마라톤이나 한글 목표 category를 이미 있는 OurgoalCategoryMap으로 판정하지 않는다. submit은 extra.category만 붙여 L.sb.from('feed_posts').insert(post)를 직접 호출한다. category-map의 7칸·missing-column helper는 존재하지만 이 caller가 소비하지 않는다. 파일 변경 역사는 TASK611/TASK466 두 commit뿐이고 존재하지 않는 세 번째는 null이다.

## 2. [원칙 ②] 본질·원인·중심·핵심

본질은 사용자가 고른 목표/칩과 저장 post의 분류가 같은 것이고, 원인은 producer 한 곳의 연결 누락이다. 중심은 기존 category-map의 정본 매핑/metadata/insert 계약을 재사용하는 caller이며, 핵심은 default와 manual override, immutable publication frame을 구분하는 것이다. 새 분류표·가중치·서버 schema를 만들지 않는다. 현재 modules의 주인 records/share-to-feed와 제공자 data/category-map(feed.category-map)을 확인했다. 저장된 cell-map은 c9bd38b9 기준이라 현main와 다르며 이번 교정이 지도 게시 갱신을 주장하지 않는다.

## 3. [원칙 ③] 해결방식

R1: 최초 기본 칩은 기존 OurgoalCategoryMap.fromGoal(curGoal)||life다. unknown/null이나 목표 미설정은 새 공유 창에서 life이며 과거 글을 life로 채우지 않는다. mapping provider 누락은 life 표시와 기존 fallback 경로에 한정하며 metadata 지원 성공을 주장하지 않는다.

R2: [data-shcat] 클릭은 수동 선택이다. #shareGoalSelect가 다른 목표 또는 __none__으로 바뀔 때 수동 선택 전이면 현재 목표의 정본 매핑을 따라 칩 active를 맞추고, 수동 선택 후면 사용자의 칩을 유지한다. 기본값·수동 선택의 이벤트와 표시를 분리한다.

R3: #shareConfirmBtn의 submit에서 선택 goal의 id/title/topic/category/visibility, selectedCat, finalGoalPct, caption을 첫 await 전에 capture한다. withMeta(post,feedPostMeta(capturedGoal,null,{categoryOverride:capturedCat,contentType:'record',pct:capturedPct,caption:capturedCaption}))로 post 자체와 extra의 7칸 참조를 일치시킨다. 이후 insert/upload/hold 동안 원 goal/manual category/pct가 바뀌어도 준비한 post를 새 값으로 다시 분류하지 않는다. visibility 값은 기존 원 goal에서 복사하는 메타이며 공개 범위/권한을 바꾸지 않는다.

R4: 기존 insertFeedPost(L.sb,post)를 사용하고 missing-column 반환만 기존 helper대로 meta 칸을 제외하여 같은 id/extra로 한 번 재시도한다. 그 외 권한/서비스 실패는 추가 insert하지 않으며 기존 로컬 cache/profile fallback을 보존한다. SDK returned error와 thrown error를 구분해 캐시의 metadata가 없어지지 않게 한다. 새 queue/replay ID·old pending migration·past post repair는 없다.

R5: helper absent, metadata schema absent, delayed insert, JSON restart/replay/old extra-only post, 부정 권한 반환을 source-bound local component로 잰다. test double/isolated UI가 실제 서버 효과를 증명하지 않는다. actual serverwritebudget0과 원 permissions/사진·feedback·milestone/profile 저장/P0 보호를 유지한다.

## 4. [원칙 ④] 재검토

반론1: 목표 선택 때마다 매핑하면 더 일관될 수 있다. 그러나 사용자가 고른 칩까지 덮으면 의도를 잃는다. 수동 선택 flag와 active chip readback으로 이 반례를 닫는다. 반론2: submit에서 curGoal을 helper에 넘기면 충분하다. async 중 current object가 바뀌는 경계와 helper retry를 생각하면 준비 시점의 scalar frame을 먼저 만들고 그 post를 그대로 넘겨야 한다. 원 pending replay에서 현재 profile로 다시 메타를 만드는 방식은 금지한다.

## 5. [원칙 ⑤] 절차

G0 numeric701 정본 ticket→이 REQ/PLAN 제품0 freeze→최초 독립 사전 검토 각1회→부정 입력/원 기대/원 source SHA 고정→owned caller 최소 교정→단일 source-bound meaningful component/browser 양음→관련 기존 feed-category/map 및 module/load/guard/기존 tests→Claims와 draft PR→외부 Court 원판정→rootreview. 원 반복 긍정 검토나 병합 선행은 없다.

## 6. [원칙 ⑥] 절차 재검증

직접 바꾸는 DOM은 새로 만들지 않는다: #shareGoalSelect, [data-shcat], #shareConfirmBtn, #shareCaptionInput의 실제 기존 listener를 소비한다. before/after 같은 입력은 원 study 결함과 7칸 누락을 실제 호출/렌더로 드러내야 한다. delayed insert 중 목표/칩/pct 변동, first call missing-column 후 same-id retry, RLS error의 추가 호출0, 원 extra·캐시 json 되읽음을 양음으로 잰다. 기존 단언·기대값·검사 수는 바꾸지 않는다. source/metadata test는 guest/실계정 E2E로 승격하지 않는다. 변경 후 official module-specs/guard는 기준선 상향 없이 확인한다.

## 7. [원칙 ⑦] 단계별 실행

제품 소유는 share-to-feed.js 하나다. docs/specs·자기 plan·reports/TASK-ES-701·ordinary ticket/dev_log와 필요 공식 generated metadata만 작업한다. category-map, feed-list, feed-posts-sync, checkin-feedback, focus-autopilot, team-goals-screen, index.html, author stage WIP, norm/Court/hooks/config는 편집0이다. live DB/posts/SQL/auth/model/PII 수집/visibility 변경은0이며 실제 source 원시는 개인 정보 없는 local input만 사용한다. 첫 실행 실패와 source/입력/PID/exit/stdout/stderr를 wx로 보존한다.

## 8. [원칙 ⑧] 막히는 지점 예상·성과 측정

막힐 수 있는 곳은 800줄 상한, 정본 helper 누락, asynchronous capture/retry, 로그인 뒤 server readback이다. 상한은 주석/빈줄 압축으로 피하지 않으며 필요한 책임 분리가 승인 scope 밖이면 root에 정확 source 경계를 넘긴다. prototype local 의미 시험은 caller 메타를 확인하지만 새 server schema나 실제 persistence를 검증하지 못한다. claims는 실제 local 범위와 login/live-server 한계를 분리하고 SQL을 대표님께 다시 요청하지 않는다. 원 전체 생각맞추기/사용 인증이나 published post 복구는 이 correction의 완료로 주장하지 않는다.
