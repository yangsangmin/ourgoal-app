# 스프린트 상태 (수석비서 상태 파일)

이 파일은 `/sprint-task` 스킬이 읽고 갱신한다. 사람이 직접 고쳐도 된다.
이 파일이 존재하고 아래 "스프린트 상태"가 `완료`가 아닌 동안, 1호 직원 루틴은 CLAUDE.md 6번의 스프린트 제외 규칙을 따른다.
갱신은 항상 태스크 브랜치 안에서만 한다(main 직접 커밋 금지).

- 스프린트 상태: 완료
- 현재 태스크: 없음 (TASK-01~06 전부 PR 병합 완료)
- 단계: 종료
- 브랜치: -
- PR: -

## 태스크 진행표

| 태스크 | 상태 | 브랜치 | PR |
|---|---|---|---|
| TASK-01 카카오 & 구글 1초 소셜 로그인 | PR 병합 완료 | feat/2026-09-06-task-01-social-login | #38 |
| TASK-02 토스페이먼츠 정기구독 & Pro 페이월 | PR 병합 완료 | feat/2026-09-06-task-02-toss-paywall | #39 |
| TASK-03 Web Speech API 음성 체크인 & 퀵 루틴 | PR 병합 완료 | feat/2026-09-06-task-03-voice-checkin | #40 |
| TASK-04 Supabase Realtime 팀 댓글 & 피드 | PR 병합 완료 | feat/2026-09-06-task-04-realtime-comments-feed | #41 |
| TASK-05 맥락 기반 다이내믹 푸시 알림 | PR 병합 완료 | feat/2026-09-06-task-05-dynamic-push | #42 |
| TASK-06 딥링크 & 워터마크 공유 카드 | PR 병합 완료 | feat/2026-09-06-task-06-share-watermark | #43 |
| 72H-RELEASE 72시간 실배포 (AI 프록시·모바일 뒤로가기·APK 파이프라인) | 진행 중 | fix/2026-09-10-apk-build-jdk21 | PR 대기 |

상태 값: `시작 전` → `진행 중` → `PR 대기` → `PR 병합 완료` (막히면 `보류(사유)`)

> 스프린트가 `완료`이므로 CLAUDE.md 6번의 "스프린트 기간 제외 항목"(소셜 로그인·결제/페이월·음성 입력·팀 댓글/피드·푸시 문구·공유 카드)은 다시 1호 직원의 작업 대상이다.

## 대기 중 사용자 작업

코드로 해결할 수 없고 사용자 계정·콘솔 작업이 필요한 항목만 남긴다. 완료되면 줄을 지운다.

- **[필수] Vercel GEMINI_API_KEY 등록**: Vercel 대시보드 Settings → Environment Variables에 `GEMINI_API_KEY` 입력 (일반 테스터 AI 피드백 무료/자동 제공용 서버리스 프록시). 키가 없어도 기존 `localFeedback`으로 안전하게 자동 폴백됩니다.

- **[필수] TASK-04 팀 댓글·피드 SQL**: Supabase SQL Editor에서 `team_comments`/`feed_posts` 테이블 + RLS + `increment_post_cheers` RPC 실행 후, Database→Replication에서 두 테이블 Realtime 활성화. 정확한 SQL은 PR #41 본문. 실행 전에는 팀 댓글·피드 응원이 안전하게 실패(400/404, 크래시 없음)하지만 실제로 동작하지 않는다.
- **[필수] 체크인 분야 저장**: Supabase SQL Editor에서 `docs/sql/2026-09-06-checkins-category.sql` 실행(`checkins.category` 컬럼 추가). 실행 전에는 클라이언트가 기존 형식으로 자동 재시도해 저장이 끊기지는 않지만 분야가 계속 저장되지 않아 분야별 리포트·CSV가 부정확하다.
- **[필수] 소셜 로그인 Provider**: Supabase에서 Kakao·Google Provider 활성화, 각 콘솔에서 앱 등록·Redirect URI 설정, Supabase Site/Redirect URL에 배포 도메인 추가. 상세는 `docs/sprint/TASK-01.md` "사용자 필요 작업". 설정 전에는 버튼을 눌러도 provider 비활성화 에러가 난다(코드 문제 아님).
- **[선택] 캘린더 OAuth 클라이언트 ID** (PR #54 후속): GCP 콘솔에서 아워골 OAuth 클라이언트(웹, 승인된 자바스크립트 원본 = `https://ourgoal-app.vercel.app`) 발급 후 `index.html`의 `GOOGLE_OAUTH_CLIENT_ID` 상수에 입력. 값을 채우기 전까지는 캘린더가 사용자 ID 입력 방식으로만 동작한다. 주의: 캘린더 스코프는 Google 민감 스코프라 OAuth 동의화면 검수가 필요하고, 검수 전에는 "테스트 사용자" 최대 100명 한도로만 동작하며 승인까지 수일~수주 걸릴 수 있다. 상수를 채우기 전에 페이월 캘린더 문구 정직화(BACKLOG)를 먼저 처리할 것.
- **[선택] 실제 결제 승인** (TASK-02 다음 단계): 토스페이먼츠 개발자센터 가맹점(테스트) 등록·테스트 클라이언트 키 발급. 현재는 가상 성공 처리만 구현돼 있어 이 설정 없이도 동작 중이다.
- **[알림] Vercel 배포 횟수 한도**: 2026-09-07 기준 일일 빌드 한도(`Deployment rate limited — retry in 24 hours`)에 걸려 PR 체크가 FAILURE로 표시됐다. 코드 문제가 아니며, 한도가 풀린 뒤의 다음 푸시에서 프로덕션에 반영된다.

TASK-03(음성 체크인)·TASK-05(다이내믹 푸시)·TASK-06(공유 카드)은 브라우저 내장 API·클라이언트 로직만 사용하므로 추가 사용자 작업이 없다. TASK-03의 마이크 버튼은 SpeechRecognition 미지원 브라우저(iOS Safari 등)에서 자동으로 숨겨지고, TASK-06의 `/share/{userId}`·`?ref=` **수신** 처리는 이번 범위 밖(링크 생성까지만)이다.

## 사전 정리 체크리스트

- [x] 로컬 체크아웃(`C:\dev\ourgoal-app`)의 커밋되지 않은 index.html 변경 정리
- [x] 스프린트 이전에 열려 있던 PR(#11 #12 #20 #22 #23 #25 #31 #32 #35 #36) 병합 또는 닫기 결정 — 전부 처리 완료
- [x] 병합된 브랜치·워크트리 정리 (2026-09-08 전량 정리 — 로컬 62개·원격 49개 삭제, `main`/`origin/main`만 남음, `git worktree list` 1개)
- [x] 1호 직원 루틴이 스프린트 제외 규칙(CLAUDE.md 6번)을 읽도록 세팅 PR 병합
- [x] gh CLI PATH 등록 (`C:\Program Files\GitHub CLI`) — 2026-09-08 확인: `gh`가 PATH에서 바로 잡히고 `gh auth status` 정상(yangsangmin, scopes: gist/read:org/repo/workflow)
- [x] index.html 자동 검증 훅 등록 — 2026-09-08 완료. 로컬 `.claude/settings.json`(git 미추적 개인 설정)에 아래 `hooks` 블록을 넣고 동작 확인: index.html 수정 시 스모크 66/66 통과 요약 출력, 다른 파일 수정 시 아무 동작 없음(exit 0). 훅 스크립트는 `scripts/hook-smoke-on-index.js`.

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
