# #TASK-ES-133 소통 탭 3대 핵심 상호작용 실 서버 DB 완전 배선 설계서 (PLAN)

## 1. 아키텍처 및 구현 계획

### ① 피드 댓글 실시간 서버 동기화 (index.html)
- handleUserCommentSubmit(postId, text):
  - 댓글 객체 생성 (id: 'fc_' + newId(), userId, displayName, 	ext, createdAt).
  - Supabase 	eam_comments 테이블에 insert (group_id: 'feed', 	arget_id: postId, user_id: state.profile.id, display_name: state.profile.displayName, 	ext: text).
  - 만약 RLS나 네트워크 실패 시 pi/track.js (서비스 롤 우회 서버리스)를 통해 안전하게 백업 및 즉각 반영.
  - getFeedComments(postId):
    - 로컬 캐시 우선 반환 + Supabase 	eam_comments.select('*').eq('target_id', postId) 비동기 페칭하여 실시간 병합 및 렌더링.
    - 다른 유저가 작성한 댓글이 즉시 화면에 표출됨.
- 가짜 답글 템플릿:
  - 타인 실사용자 게시물에는 인위적 가짜 답글(ddSimulatedCheerAndReplyToPost) 발송 차단.
  - 콜드스타트 AI 페르소나 게시물인 경우에만 is_ai: true 및 [🤖 AI 페르소나] 투명 공지 표기.

### ② 새 팀 만들기 전역 공유 및 영구 보존 (index.html & pi/track.js)
- promptNewGroup / grpSave:
  - 팀 개설 시 
ewGroup 객체를 생성.
  - Supabase 	eam_pings의 마스터 레코드(	arget_type: 'team_group') 또는 pi/track.js 액션 save_shared_team을 통해 서버에 영구 등록.
  - 전역 팀 로더(loadSharedGroups):
    - enderCommGroups 진입 시 MOCK_GROUPS 기본값 + 서버에 등록된 shared_teams 목록을 페칭하여 합산 렌더링.
    - 다른 모든 유저의 [모임·팀] 목록에 내가 만든 팀이 실시간으로 노출되고 참여 가능.
  - 새로고침 시에도 서버에서 개설된 팀 목록을 자가 복원하여 영구 보존.

### ③ 마니또(My Manito) 실 유저 익명 응원 파이프라인 (index.html)
- manitoPartners():
  - 내 관심 카테고리와 일치하는 실제 가입자(최근 30일 내 체크인/활동 유저) 풀을 우선 매칭.
  - 실사용자가 부족한 경우에만 시뮬레이션 파트너를 폴백하되 [🤖 AI 동반자] 뱃지 명시.
- 마니또 응원 스탬프 및 메시지:
  - sendManitoStamp(partnerId, stamp, msg):
    - 	eam_ping_replies에 익명 메시지 레코드 생성 (eceiver_id: partnerId, message: '[마니또 익명 응원] ' + msg).
  - manitoInbox():
    - 	eam_ping_replies에서 나에게 도착한 마니또 익명 메시지를 실시간 쿼리하여 편지함에 렌더링.
    - 가짜 날짜 시드 자동 생성기를 실시간 수신 메시지로 교체.

## 2. 검증 계획
- 
pm test: 271개 이상 테스트 무결성 유지 (0 failure)
- 신규 스모크 테스트: #TASK-ES-133 단언문 (피드 댓글 서버 insert, 팀 개설 서버 등록 및 병합, 마니또 실시간 수신함 배선).
- Headless Chrome CDP E2E 검증: 실 브라우저에서 댓글 작성 및 팀 개설 동작 실측.
- 4단계 완료 및 Vercel 프리뷰 배포.
