# [PLAN] 아바타 영속성 및 업데이트·재로그인·앱 재접속 유지 무결성 작업계획서

> **문서 ID**: PLAN-CHECK-AVATAR-PERSISTENCE  
> **티켓 번호**: #TASK-ES-117  
> **작성일**: 2026-09-16  
> **작성자**: Antigravity  
> **본질 축**: INFRA / FIX  
> **상한선**: [4단계: 로컬 메인 병합 및 5A 프리뷰 배포] 준수

---

## 1. 문제해결 8원칙 2회차 분석

### ① 본질 목표 한 줄
아바타 생성 후 앱 업데이트, 로그아웃 후 재로그인, 앱 재접속 등 모든 라이프사이클 전환 시 생성된 아바타의 100% 무손실 영속성 보장 및 화면 동기화 완결.

### ② 중심 배선 (Core Wire)
1. `js/avatar-system.js`: 아바타 생성 및 저장 시 `profile.settings.customAvatarUrl`뿐 아니라 `profile.avatarUrl`과도 양방향 연동하여 상단바(`topAvatar`), 프로필 카드, 피드, 외부 전파에 완벽 호환.
2. `index.html` `loadProfile()` / `saveProfile()`:
   - 프로필 로드 시 로컬스토리지 백업 및 `users` DB의 `avatar_url`로부터 아바타 복원 체계 점검.
   - `saveProfile()` 시 아바타 커스텀 세팅이 `ourgoal_settings_<uid>` 및 `ourgoal_profile_backup_<uid>`에 누락 없이 기록되는지 보장.
3. `index.html` `restoreSessionAndEnter()`:
   - 게스트 상태에서 아바타를 제작한 후 소셜 로그인으로 전환할 때 게스트의 아바타 세팅(`avatarType`, `customAvatarUrl`, `avatarThemeId`)을 새 소셜 계정으로 100% 인계(Migration) 배선.
4. `index.html` `boot()` / `enterApp()`:
   - 앱 재접속(F5, 탭 닫기 후 재접속) 시 게스트 및 로그인 사용자 프로필 복원 파이프라인에서 아바타가 정상 노출되는지 실측.
5. `index.html` `updateTopBar()`:
   - 상단 네비게이션 바의 아바타가 3등신 아바타 또는 로봇 아바타와 일치하게 렌더링되도록 확인 및 보완.

### ③ 파일별 Before/After 및 변경 예산
- `js/avatar-system.js`:
  - Before: `btnSave.onclick` 시 `settings.customAvatarUrl`만 세팅하고 `profile.avatarUrl`과 분리되어 있었음.
  - After: `profile.avatarUrl = newCustomUrl`도 함께 동기화하여 앱 전역(상단바, 피드, 외부 DB)에서 일관된 아바타 참조 가능.
- `index.html`:
  - Before: 게스트 세션 마이그레이션(`restoreSessionAndEnter`) 시 `goals`와 `records`만 이전되고 아바타 설정이 누락될 소지.
  - After: `gData.settings` 내 아바타 설정(`avatarType`, `customAvatarUrl`, `avatarThemeId`)도 새 계정의 settings로 완벽 복제 승계.
  - `updateTopBar()`: 3등신 아바타(`customAvatarUrl`) 또는 로봇 아바타(`avatarType === 'robot'`)가 상단 네비게이션 아바타(`topAvatar`)에도 자연스럽게 반영되도록 보완.
- `scratch/audit_avatar_persistence.js`: 4대 시나리오 자동 검증 스크립트 신설.

### ④ 재검토
- 기존 소셜 프로필 이미지(구글/카카오)를 사용하던 유저와의 호환성: 커스텀 아바타를 만들지 않은 사용자는 기존 소셜 사진 또는 로봇 아바타를 정상 유지.
- DB RLS 위반 여부: `users.avatar_url`은 본인 세션에 대해 UPDATE/UPSERT 허용됨.

### ⑤ 체크리스트 (4단계 상한선)
- [x] 1. 정밀 정적 분석 및 취약점 식별 · 예상 5분 · 4대 시나리오(업데이트, 로그아웃-재로그인, 앱 재접속, 게스트-소셜전환) 코드 패스 완전 분석
- [x] 2. 자동화 시뮬레이션 테스트 스크립트 작성 및 실행 · 예상 5분 · `scratch/audit_avatar_persistence.js` 작성 및 통과
- [x] 3. 취약점 보강 및 화면 간 상태 동기화 배선 · 예상 7분 · `js/avatar-system.js` 및 `index.html` 수정 완료
- [x] 4. 5대 무결성 검증 통과 · 예상 5분 · `npm test` 249개+ 100% PASS, 0 failure
- [x] 5. 로컬 브라우저 수동 확인 (3단계) · 예상 5분 · Headless Chrome 스크린샷 및 콘솔 에러 0건 확인
- [ ] 6. 로컬 메인 병합 (4단계) 및 Vercel 프리뷰 배포 (5A) · 예상 5분 · 로컬 main merge 완료 및 프리뷰 URL 획득

### ⑥ 블로커 대책
- 게스트에서 소셜 로그인 시 게스트 설정 덮어쓰기 충돌: 소셜 로그인 유저에게 기존 커스텀 아바타가 없으면 게스트 아바타를 우선 적용, 이미 소셜 유저에게 커스텀 아바타가 있으면 사용자 선택권 보호.
