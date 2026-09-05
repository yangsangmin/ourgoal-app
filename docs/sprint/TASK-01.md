# [TASK-01] 카카오 & 구글 1초 소셜 로그인 연동

| 항목 | 내용 |
|---|---|
| 우선순위 | P0 (필수) |
| 카테고리 | 인증/온보딩 |
| 기대효과 | 가입 이탈률 60% 방어 및 D1 활성화 |
| 대상파일 | index.html, Supabase Auth |
| 의존 태스크 | 없음 |
| 노션 진행상태(내보내기 시점) | 시작 전 |

## 기존 코드/PR과 겹치는 부분 (착수 전 확인)
- index.html 상단에 supabase-js와 Google GSI(`accounts.google.com/gsi/client`) 스크립트가 이미 로드됨. GSI는 구글 캘린더 연동(gcalSync) 용도이므로 로그인 구현과 섞이지 않게 분리한다.
- PR #32(일정 탭 + gcalSync 통합)가 열려 있음. 같은 구글 OAuth 영역을 다루므로 병합 여부를 먼저 확인한다.
- 기존 이메일/비밀번호 인증과 boot() 세션 복원 로직(dev_log 2026-09-03 17:05)은 유지한 채 위에 얹는다.

## 사용자 필요 작업 (외부 콘솔·키, 코드에 넣지 않음)
- Supabase 대시보드 > Authentication > Providers에서 Kakao, Google 활성화
- Kakao Developers: 앱 생성, REST API 키·Client Secret 발급, Redirect URI에 Supabase 콜백 URL(`https://<project>.supabase.co/auth/v1/callback`) 등록, 동의항목(닉네임·프로필 사진·이메일) 설정
- Google Cloud Console: OAuth 클라이언트 ID·Secret 발급, 승인된 리디렉션 URI에 Supabase 콜백 URL 등록
- Supabase > Authentication > URL Configuration: Site URL과 Redirect URLs에 `https://ourgoal-app.vercel.app`와 Vercel 프리뷰 도메인 추가
- 키·시크릿은 Supabase 콘솔에만 입력한다. 코드에는 provider 이름만 들어간다.

## 실행 프롬프트 (노션 원문, 2026-09-06 내보내기)

> 프롬프트의 코드 예시는 참고용이다. 기존 코드의 함수명·상태 구조·디자인 토큰이 우선한다.

현재 index.html의 인증 시스템은 이메일/비밀번호 수동 입력 방식입니다. 유저 가입 전환율을 극대화하기 위해 Supabase Auth 기반의 '카카오 1초 로그인' 및 '구글 로그인'을 구현해주세요.

1. 요구사항:
- 랜딩 화면(landingScreen) 및 인증 화면(authScreen)에 [카카오로 3초 만에 시작하기] (노란색 메인 CTA 버튼) 및 [Google로 계속하기] 버튼을 추가해주세요.
- 버튼 클릭 시 Supabase의 OAuth 로그인 함수를 호출하세요:
  sb.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo: window.location.origin } })
  sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
- OAuth 인증 성공 후 리다이렉트되었을 때 boot() 함수에서 세션을 정상 수신하고, 신규 유저일 경우 카카오/구글 프로필 정보(이메일, 닉네임, 프로필 사진 URL)를 파싱하여 users 테이블에 자동 업서트 후 온보딩 모달로 연결해주세요.
- 기존 이메일 로그인은 하단에 작은 텍스트 링크('이메일로 로그인/가입') 형태로 토글되도록 UI 위계를 정리해주세요.

2. 수정 대상: index.html 내 #landingScreen, #authScreen, boot() 함수
3. 검증 기준: 소셜 로그인 버튼 클릭 시 브라우저 콘솔 에러 없이 정상적으로 OAuth 팝업/리다이렉트가 발생하는지 확인.
