# 스프린트 상태 (수석비서 상태 파일)

이 파일은 `/sprint-task` 스킬이 읽고 갱신한다. 사람이 직접 고쳐도 된다.
이 파일이 존재하고 아래 "스프린트 상태"가 `완료`가 아닌 동안, 1호 직원 루틴은 CLAUDE.md 6번의 스프린트 제외 규칙을 따른다.
갱신은 항상 태스크 브랜치 안에서만 한다(main 직접 커밋 금지).

- 스프린트 상태: 진행 중
- 현재 태스크: TASK-05
- 단계: PR 대기
- 브랜치: feat/2026-09-06-task-05-dynamic-push
- PR: -

## 태스크 진행표

| 태스크 | 상태 | 브랜치 | PR |
|---|---|---|---|
| TASK-01 카카오 & 구글 1초 소셜 로그인 | PR 병합 완료 | feat/2026-09-06-task-01-social-login | #38 |
| TASK-02 토스페이먼츠 정기구독 & Pro 페이월 | PR 대기 | feat/2026-09-06-task-02-toss-paywall | #39 |
| TASK-03 Web Speech API 음성 체크인 & 퀵 루틴 | 시작 전 | | |
| TASK-04 Supabase Realtime 팀 댓글 & 피드 | PR 대기(#41 열림, SQL 실행 후 병합 예정) | feat/2026-09-06-task-04-realtime-comments-feed | #41 |
| TASK-05 맥락 기반 다이내믹 푸시 알림 | PR 대기 | feat/2026-09-06-task-05-dynamic-push | |
| TASK-06 딥링크 & 워터마크 공유 카드 | 시작 전 | | |

상태 값: `시작 전` → `진행 중` → `PR 대기` → `PR 병합 완료` (막히면 `보류(사유)`)

## 대기 중 사용자 작업

- TASK-01 (병합 완료): Supabase에서 Kakao·Google Provider 활성화, 각 콘솔에서 앱 등록·Redirect URI 설정, Supabase Site/Redirect URL에 배포 도메인 추가. 상세는 `docs/sprint/TASK-01.md` "사용자 필요 작업" 참고. 설정 전까지는 버튼을 눌러도 provider 비활성화 에러가 남(코드 문제 아님).
- TASK-02 (병합 완료): 가상 성공 처리만 구현했으므로 이미 동작 중. 다음 단계(실제 결제 승인)부터 필요.
- TASK-03 (PR #40 대기, Vercel 배포 한도로 미병합 보류): 없음.
- TASK-04 (PR #41 대기, 병합 전 필수): Supabase SQL Editor에서 `team_comments`/`feed_posts` 테이블 + RLS + `increment_post_cheers` RPC 실행, Realtime 활성화. 정확한 SQL은 PR #41 본문.
- TASK-05 (PR 대기): 없음(클라이언트 로직만 변경, 서버·sw.js 무수정).

## 사전 정리 체크리스트 (스프린트 시작 전 1회, 사용자 확인 필요)

- [ ] 로컬 체크아웃(`C:\dev\ourgoal-app`)의 커밋되지 않은 index.html 변경(브랜치 `fix/2026-09-06-comm-dm-stale-dom-guard`, +48/-2) 정리: PR #25에 커밋하거나 되돌리기
- [ ] 열린 PR 10개(#11 #12 #20 #22 #23 #25 #31 #32 #35 #36) 병합 또는 닫기 결정. 특히 #31(팀 댓글)은 TASK-04, #20(위클리 리캡)은 TASK-06, #32(일정 탭·gcalSync)는 TASK-01과 같은 영역
- [ ] 병합된 브랜치·워크트리 정리 (`git worktree list` 기준 6개, `git worktree prune`)
- [ ] gh CLI PATH 등록 (`C:\Program Files\GitHub CLI`) 후 새 터미널에서 `gh auth status` 확인
- [ ] 1호 직원 루틴이 스프린트 제외 규칙(CLAUDE.md 6번)을 읽도록 이 세팅 PR을 먼저 병합
- [ ] (선택, 권장) index.html 자동 검증 훅 등록: `.claude/settings.json`에 아래 `hooks` 블록 추가. Claude Code 자동 모드가 설정 파일 수정을 차단하므로 사용자가 직접 넣는다. 훅 스크립트 자체(`scripts/hook-smoke-on-index.js`)는 이미 저장소에 있다.

```json
"hooks": {
  "PostToolUse": [
    {
      "matcher": "Edit|Write|MultiEdit",
      "hooks": [
        { "type": "command", "command": "node scripts/hook-smoke-on-index.js", "timeout": 60 }
      ]
    }
  ]
}
```
