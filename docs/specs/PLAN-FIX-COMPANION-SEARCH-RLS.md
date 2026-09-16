# 엔지니어링 작업계획서 (PLAN) — 동반자 닉네임 검색 RLS 차단 근본 수정

> **문서 ID**: PLAN-FIX-COMPANION-SEARCH-RLS
> **요구사항 연계**: [REQ-FIX-COMPANION-SEARCH-RLS](file:///C:/dev/ourgoal-app/docs/specs/REQ-FIX-COMPANION-SEARCH-RLS.md)
> **티켓 연계**: #TASK-ES-120
> **작성 일시**: 2026-09-16
> **작성자**: Claude 세션 eae41e56
> **규범 준수**: 프로덕션 코드 순증가 500줄 미만(승인선 8) — `docs/sql/*.sql`은 한도 제외 대상. [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수.

---

## 1. [원칙 ①] 파악: 엔지니어링 아키텍처 및 변경 범위
- **REQ 핵심 요약**: RLS는 유지, 검색 전용 SECURITY DEFINER RPC 신설 + 클라이언트 쿼리 교체 + 오류/게스트 상태 분리.
- **영향 받는 파일**:
  - `docs/sql/2026-09-16-search-users-rpc.sql`: 신규 RPC 정의 (docs 폴더, 500줄 한도 제외)
  - `js/team-invite-comm.js`: `doSearch()` 쿼리 경로 교체, `renderCommCompanions()` 상태 분기 추가
  - `scripts/smoke-test.js`: `[#TASK-ES-106]` 옛 결함 패턴 검증을 신규 배선 검증으로 교체
  - `docs/rules/TICKETS.md`, `dev_log.md`: 티켓·로그 기록
  - `index.html`: 변경 없음(0줄)

---

## 2. [원칙 ②] 본질·중심 배선 파악
- **전역 상태(`state`) 영향 분석**:
  - `state._companionSearchKeyword` / `_companionSearchResults` / `_companionIsSearching`: 기존 유지
  - `state._companionSearchError`: 신규 — `'guest' | 'error' | null` 3값
  - `state.profile`/`state.user`: 읽기만, 쓰기 없음
- **데이터 흐름**: `[검색 버튼 클릭] -> [게스트 여부 판정] -> [sb.rpc('search_users_by_nickname')] -> [성공: 카드 렌더 / 실패: error 상태 / 게스트: 안내 상태] -> [renderCommCompanions 재렌더]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산

| 파일 | 변경 목적 | 순증가(Net) | 한도 준수 |
| :--- | :--- | :---: | :---: |
| `docs/sql/2026-09-16-search-users-rpc.sql` | RPC 신설 | +44줄 | 한도 제외(docs) |
| `js/team-invite-comm.js` | 쿼리 교체 + 상태 분기 | +약 25줄 | 준수 |
| `scripts/smoke-test.js` | 검증 갱신 | +약 4줄 | 한도 제외(scripts) |
| `index.html` | 변경 없음 | 0줄 | 해당 없음 |

### 껍데기 UI 방지 4위 1체 상세 배선 (검색 결과 카드 기준, 기존 유지 확인)
```javascript
// 1. 마크업: companionSearchInput / companionSearchBtn / companionSearchResetBtn (기존)
// 2. 리스너: sBtn.addEventListener('click', doSearch) / Enter 키 (기존)
// 3. 비즈니스 로직: doSearch() 내부 sb.rpc('search_users_by_nickname', {p_query}) (신규 배선)
// 4. 피드백: isSearching 스피너 문구 / guest 안내 / error 안내 / 결과없음 안내 (3종 분리, 신규)
```

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인·CSS·레이아웃 임의 변경 없음 (검색 결과 카드 마크업 그대로).
- [x] 파일 전체 재작성 없이 diff 단위(Edit)로만 수정.
- [x] 기존 사용자의 아바타/목표/기록/세팅값 영향 없음(읽기 전용 검색 기능).

---

## 5. [원칙 ⑤] 구현 절차
1. **Step 1**: `docs/sql/2026-09-16-search-users-rpc.sql` 작성 (RPC 정의, 본인/봇 제외, 이스케이프, anon revoke·authenticated grant).
2. **Step 2**: `js/team-invite-comm.js` `doSearch()`를 RPC 호출로 교체하고 게스트/오류 분기 추가.
3. **Step 3**: `renderCommCompanions()`에 게스트/오류 문구 렌더 분기 추가.
4. **Step 4**: `scripts/smoke-test.js` `[#TASK-ES-106]` 검증을 신규 배선 기준으로 교체.
5. **Step 5**: `docs/rules/TICKETS.md`에 `#TASK-ES-120` 등록, `dev_log.md`에 근본원인·해결·검증 기록.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오
- **A(전수 클릭/터치)**: 검색·초기화·추가 버튼 클릭 경로 콘솔 에러 0건 — `npm test`의 `verify-all-clicks.js`로 정적 확인.
- **B(데이터 무손실)**: 해당 없음(읽기 전용 기능, 쓰기 경로 미변경).
- **C(전 UX 회귀)**: 게스트 진입 시 검색 시도 → 로그인 안내로 정상 분기(신규), 로그인 세션 유지 로직 미변경.
- **D(화면 간 상호연동)**: 동반자 추가 후 `companions` 목록만 갱신, 타 탭 무영향 확인.
- **E(자동화 게이트)**: `npm test` 전수 통과.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트
- [x] Step 1~5 순차 구현 완료 (축약/누락 없음)
- [x] `node scripts/verify-integrity-gate.js` 통과 (`npm test`에 포함되어 실행됨)
- [x] `node scripts/verify-all-clicks.js` 통과 (`npm test`에 포함되어 실행됨)
- [x] `npm test` 전수 통과 (259 스모크 + 13 게이트 + 클릭검사, 0 실패)
- [ ] 직관적 6단계 상태에 따른 보고 및 PR 병합 — 현재 **2단계(내부 시뮬레이션) 통과, 4단계(로컬 메인 병합) 진입 전** 단계. Supabase SQL 미실행으로 실제 기능은 아직 라이브 아님.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **막힐 지점**: Supabase SQL Editor 실행은 이 세션이 물리적으로 수행할 수 없음(콘솔 접근 불가).
- **해결 방안**: `docs/sql/2026-09-16-search-users-rpc.sql` 전체를 `[손 필요]`로 상민님께 전달, 실행 전까지는 RPC 부재로 인한 `res.error`를 "검색 중 문제가 발생했어요"로 우아하게 처리(크래시 없음).
- **롤백 계획**: 이 커밋만 되돌리면(`git revert`) 즉시 기존 `.from('users')` 경로로 복귀 가능(단, 그 경로도 RLS로 항상 0건이므로 롤백 자체가 "이전 정상 상태"로의 복귀는 아니며 "덜 나쁜 옛 결함"으로만 되돌아감). RPC는 `create or replace`이므로 여러 번 실행해도 안전하며 삭제가 필요하면 `drop function public.search_users_by_nickname(text);` 별도 SQL로 제거 가능.
