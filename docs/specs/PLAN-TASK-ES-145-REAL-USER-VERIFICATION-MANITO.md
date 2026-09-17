# 작업계획서 (PLAN) — #TASK-ES-145 마니또 실 유저 판별 무결성 및 가짜 실 유저 표기 오류 개선

> **문서 ID**: PLAN-TASK-ES-145-REAL-USER-VERIFICATION-MANITO  
> **티켓 연계**: #TASK-ES-145  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity 세션 4db64ddd  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수

---

## 1. [원칙 ①] 파악 (Problem & Requirements Summary)
- 실제 유저가 아닌 게스트 계정 및 템플릿 마니또가 [✨ 실 유저] 뱃지를 달고 하드코딩된 거짓 기록(3일 연속, 50%, 가짜 로그)과 함께 표출되는 결함 복구.
- 본질 축: **E3 (동류 소통) + FIX (버그 수정)**.

---

## 2. [원칙 ②] 중심 배선(Wire) 식별
1. `isValidRealUser(id)`: Supabase Auth UUID 규격 정규식 검증 + 게스트/테스트/목업 접두사 엄격 차단 헬퍼.
2. `loadServerManitoData()`: `team_pings` `manito_pool` 로드 시 `isValidRealUser` 미통과 레코드 100% 드롭.
3. `mnJoin`: 게스트 모드일 때 `team_pings` `manito_pool` 원격 등록 차단 및 소프트 안내 표출.
4. `isKnownAiCompanion`: `js/team-invite-comm.js`에서 `guest` 및 `mn_` prefix 추가.
5. Supabase `team_pings`: 레거시 게스트 풀 데이터(`mn_pool_guest-mu3tbym6qdd5`) `hidden: true, status: 'inactive'` 무효화.

---

## 3. [원칙 ③] 파일별 Before / After 및 변경 예산
- **`index.html`**:
  - `loadServerManitoData()`: 실 사용자 정밀 검증 헬퍼 탑재, 게스트/더미 필터링, 위조 하드코딩 스트릭 제거.
  - `mnJoin`: 비회원 게스트 상태 시 서버 풀 upsert 방지 및 안내 토스트 처리.
- **`js/team-invite-comm.js`**:
  - `isKnownAiCompanion`: `guest`, `mn_` prefix 추가.
- **`scripts/smoke-test.js`**:
  - `#TASK-ES-145` 컴플라이언스 테스트 신설 (게스트 배제, 실 사용자만 실 유저 뱃지 부여, 게스트 마니또 로컬 안전 격리 검증).

---

## 4. [원칙 ④] 재검토 (Self-Audit against 15 Articles)
- 제1조 (6대 고질병 근절): 가짜 실제구현(6호) 및 유저 혼란 완전 근절.
- 제3조 (4위 1체 배선): 마크업, 리스너, 로직, 피드백 완결.
- 제4조 (절대 금지 7대 행위): 위조 숫자 날조(1호) 및 가짜 실제구현(7호) 전면 배제.
- 제7조 (5대 무결성 검증): 284개 이상 ALL PASS.
- 제8조 (직관적 6단계 보고): 4단계 로컬 메인 병합 및 5A 프리뷰 배포 마감 준수.
- 제9조 (배포 안전핀): 4단계 완료 후 정지, 실서버 배포(5/6단계)는 상민님 승인 필요.
- 제13조 (실 사용자 계정 상호 연동 헌법): 실 사용자 식별 및 콜드스타트 투명 표기 엄수.

---

## 5. [원칙 ⑤] 구현 상세 순서
1. 브랜치 생성: `fix/2026-09-17-manito-real-user-verification-es145`
2. `index.html` 수정:
   - `isValidRealUser` 헬퍼 함수 추가
   - `loadServerManitoData` 필터링 강화 및 위조 데이터 날조 제거
   - `mnJoin` 게스트 등록 차단 및 소프트 로그인 안내
3. `js/team-invite-comm.js` 수정: `isKnownAiCompanion` 보강
4. Supabase `team_pings` 불량 레코드 격리
5. `scripts/smoke-test.js` 테스트 추가 및 `npm test` 실행
6. CDP 3단계 로컬 수동 확인
7. 4단계 로컬 메인 병합 및 5A Vercel 프리뷰 배포

---

## 6. [원칙 ⑥] 5대 무결성 검증 시나리오
- 시나리오 1: 게스트 방문 시 마니또 화면에서 `[✨ 실 유저]`가 전혀 노출되지 않고 3명 모두 `[🤖 AI 동반자]`로 투명하게 표시되는가?
- 시나리오 2: 게스트 상태에서 '마니또 시작하기'를 눌러도 Supabase `team_pings` `manito_pool`에 게스트 행이 추가되지 않는가?
- 시나리오 3: 유효한 UUID를 가진 실제 로그인 회원이 `manito_pool`에 있을 때만 정상적으로 실 유저로 인식되는가?
- 시나리오 4: 기존 283개 테스트에 신규 테스트가 추가되어 284개 ALL PASS를 달성하는가?

---

## 7. [원칙 ⑦] 체크리스트
- [ ] REQ/PLAN 및 작업계획서 작성 완료
- [ ] index.html isValidRealUser 배선 완료
- [ ] mnJoin 게스트 풀 등록 차단 완료
- [ ] js/team-invite-comm.js isKnownAiCompanion 보강 완료
- [ ] Supabase 레거시 게스트 데이터 격리 완료
- [ ] npm test 284+ ALL PASS 통과
- [ ] 3단계 로컬 CDP 확인 완료
- [ ] 4단계 로컬 메인 병합 완료
- [ ] 5A단계 Vercel 프리뷰 배포 실행 완료

---

## 8. [원칙 ⑧] 블로커 대책
- 블로커: Supabase DB 업데이트 시 권한 문제 발생 가능성.
  - 대책: 클라이언트 사이드 `isValidRealUser` 필터가 1차 방화벽이므로 DB 레코드 수정 여부와 무관하게 앱 화면에서는 즉각 100% 정상 작동 보장.
