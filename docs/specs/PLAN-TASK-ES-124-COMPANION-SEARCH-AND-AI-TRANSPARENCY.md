# [작업계획서] #TASK-ES-124 아워골 동반자 검색 2중 복원 및 가상 유저 AI 투명 뱃지 표기

## 1. 개요 및 본질 배선
- **티켓**: #TASK-ES-124
- **목표**: 동반자 검색 2중 파이프라인(Vercel 서버리스 1순위 + RPC 폴백) 구축으로 모바일 웹뷰/앱/게스트 검색 100% 보장 및 가상 유저 3인 [🤖 AI 동반자] 투명 뱃지 자가 치유 표기
- **본질 축**: E3(동류 소통) / FIX(안정성 및 투명성)

---

## 2. 중심 배선 (Core Wiring)
```
[사용자 검색 입력]
       │
       ▼
[클라이언트 doSearch()] ─────────── 1순위: POST /api/track { action: 'search_users', query }
       │                                  │ (Vercel SUPABASE_SERVICE_ROLE_KEY로 RLS/세션 100% 우회)
       │                                  ▼
       │                          [실제 회원 목록 20건 반환]
       │
       └── (로컬/오류 시) ────────── 2순위: sb.rpc('search_users_by_nickname')
                                          │
                                          ▼
                                  [실제 회원 목록 반환]

[동반자 목록 렌더링 (renderCommCompanions)]
       │
       ▼
[isKnownAiCompanion(user)] 검사 ─── comp_*, mem_*, mock_*, bot_*, 가상 닉네임
       │
       ├── TRUE  ➔ isAiBot: true 자가치유 ➔ [🤖 AI 동반자] 보라 뱃지 렌더 ➔ persistCompanions() DB 저장
       └── FALSE ➔ [실 사용자] 뱃지 렌더
```

---

## 3. 파일별 변경 상세 (Before / After)

### 1) `api/track.js`
- **Before**: `action: 'sync_records'`만 지원, 회원 검색 엔드포인트 부재.
- **After**: `body.action === 'search_users'` 라우팅 신설 및 `handleSearchUsers(sb, body, res)` 함수 구현.
  - `sb.from('users').select('id, display_name, username, avatar_url, bio, interests').or('display_name.ilike.%q%,username.ilike.%q%').limit(20)`
  - 정규화된 최소 공개 객체 반환.

### 2) `js/team-invite-comm.js`
- **Before**:
  - `doSearch()`가 게스트일 때 검색 차단, RPC 1개만 호출(42501 발생 시 세션 만료 에러 표기).
  - 뱃지 판정이 단순 `c.isAiBot ? 'AI 봇' : '실 사용자'`로 되어 있어 `isAiBot` 없는 가상 유저가 `실 사용자`로 오표기.
- **After**:
  - `isKnownAiCompanion(user)` 함수 신설: `user.isAiBot || /^comp_|^mem_|^mock_|^bot_/i.test(user.id) || ['새벽러너_민지', '코드장인_도현', '갓생사는_수아', ...].includes(user.nickname)`.
  - `renderCommCompanions`: 목록 렌더링 전/중에 `isKnownAiCompanion` 확인 시 `c.isAiBot = true` 자가 치유 주입 및 `🤖 AI 동반자` 뱃지 렌더링.
  - `openUserProfileModal`: `isAiBot` 판정 시 `🤖 AI 동반자` 뱃지 및 안내 문구 표기.
  - `doSearch()`: 게스트 차단 제거(결과 조회 허용), `/api/track` 1순위 fetch ➔ 실패 시 `sb.rpc` 폴백.

### 3) `docs/sql/2026-09-16-search-users-rpc.sql`
- **Before**: `revoke execute ... from anon`, `auth.uid() is not null` 제약.
- **After**: `grant execute ... to anon, authenticated, public;` 및 `auth.uid() is not null` 제거하여 클라이언트 토큰 지연 시에도 조회 허용.

### 4) `docs/rules/TICKETS.md`
- `#TASK-ES-124` 티켓 등록.

### 5) `scripts/smoke-test.js`
- `#TASK-ES-124` 컴플라이언스 테스트 신설 (2중 검색 파이프라인, AI 동반자 뱃지 배선 확인).

---

## 4. 5대 무결성 검증 시나리오
1. **Zero Dead Click**: 검색 버튼, 초기화 버튼, 프로필 보기 클릭, DM 버튼 정상 동작.
2. **Zero UX Regression**: 게스트 및 로그인 사용자 모두 검색 가능, 게스트 추가 시도시 소프트 게이트 정상 노출.
3. **Zero Data Loss**: 기존 동반자 목록의 id, 닉네임, 아바타, 레벨, 스트릭 100% 보존 + `isAiBot: true` 자가 치유.
4. **Full State Propagation**: 프로필 모달과 동반자 카드 양쪽 모두에서 `🤖 AI 동반자` 일관되게 표시.
5. **Automated Test**: `npm test` 261개+ 전수 통과 (0 failure).

---

## 5. 단계별 실행 체크리스트 (상한선: 4단계)
- [ ] 1. `docs/rules/TICKETS.md` 티켓 등록 · 예상 2분
- [ ] 2. `api/track.js` 회원 검색 엔드포인트 구현 · 예상 5분
- [ ] 3. `js/team-invite-comm.js` 2중 검색 및 AI 동반자 투명 뱃지/자가치유 구현 · 예상 10분
- [ ] 4. `docs/sql/2026-09-16-search-users-rpc.sql` 정비 · 예상 3분
- [ ] 5. 스모크 테스트 및 무결성 검증 스크립트 작성/실행 (`npm test`) · 예상 5분
- [ ] 6. 로컬 main 병합 및 4단계 도달 · 예상 3분
