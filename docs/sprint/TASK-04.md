# [TASK-04] Mock 탈피: Supabase Realtime 기반 팀 댓글 & 피드 실시간 동기화

| 항목 | 내용 |
|---|---|
| 우선순위 | P1 (네트워크) |
| 카테고리 | 백엔드/DB |
| 기대효과 | 유령 앱 방지, 실제 유저 간 실시간 인터랙션 |
| 대상파일 | index.html, Supabase Realtime |
| 의존 태스크 | 없음 (TASK-01 이후 권장: 실제 유저 식별이 있어야 댓글 작성자 표시가 의미 있음) |
| 노션 진행상태(내보내기 시점) | 시작 전 |

## 기존 코드/PR과 겹치는 부분 (착수 전 확인)
- PR #31(팀 목표/마일스톤 댓글 기능 추가)이 열려 있음. 이 PR이 "로컬 mock 댓글"의 최신 구현이므로 병합 후 그 코드를 Supabase로 전환하는 것이 순서다. 착수 전 반드시 확인.
- PR #35(피드 게시물의 시간 기반 가짜 응원 수 제거)도 피드 응원 카운트를 건드린다.
- BACKLOG 5단계 "원터치 응원 리액션", "반응·응원 알림" 항목과 같은 영역.

## 사용자 필요 작업 (외부 콘솔·키, 코드에 넣지 않음)
- Supabase SQL Editor에서 `team_comments`, `feed_posts` 테이블 생성 + RLS 정책 실행 (SQL은 구현 시 PR 본문에 첨부)
- Supabase > Database > Replication(Publications)에서 두 테이블의 Realtime 활성화

## 실행 프롬프트 (노션 원문, 2026-09-06 내보내기)

> 프롬프트의 코드 예시는 참고용이다. 기존 코드의 함수명·상태 구조·디자인 토큰이 우선한다.

현재 로컬 mock 데이터로 동작하는 '팀 목표 댓글'과 '소통 피드/응원' 기능을 Supabase Database 및 Realtime 채널과 연동하여 실제 유저 간 상호작용이 일어나도록 전환해주세요.

1. 요구사항:
- 필요한 Supabase 테이블 스키마 가이드를 코드 상단 주석으로 정의하세요:
  * team_comments (id, group_id, user_id, display_name, text, created_at)
  * feed_posts (id, user_id, display_name, avatar_url, goal_title, caption, cheers_count, created_at)
- team_comments 작성 시 로컬 groupState에만 저장하던 방식을 Supabase 테이블 insert로 변경하세요.
- sb.channel('team_comments_channel').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_comments' }, payload => { ... }).subscribe()를 적용하여 다른 유저가 단 댓글이 새로고침 없이 즉시 화면에 나타나게 해주세요.
- 피드 응원 버튼 클릭 시에도 카운트가 Supabase에 RPC 또는 update로 실시간 증차되도록 구현하세요.

2. 수정 대상: index.html 내 teamComments, renderTeamGoalsScreen, feedPostHtml, Supabase 채널 등록 로직
3. 검증 기준: 두 개의 브라우저 창을 띄우고 한쪽에서 댓글/응원을 남겼을 때 다른 쪽 창에 실시간 반영되는지 확인.
