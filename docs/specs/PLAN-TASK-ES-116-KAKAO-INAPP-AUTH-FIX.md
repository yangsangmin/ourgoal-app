# 작업계획서 (PLAN-TASK-ES-116 v2): 사용자 만족 극대화 카카오톡 인앱 로그인 및 1초 무마찰 입장 시스템

> **문서 ID**: PLAN-TASK-ES-116  
> **티켓**: #TASK-ES-116 (FIX/INFRA)  
> **기초 요구서**: docs/specs/REQ-TASK-ES-116-KAKAO-INAPP-AUTH-FIX.md (v2)  
> **목표**: 카카오톡 인앱 브라우저에서 사용자가 로그인 시 겪을 수 있는 모든 마찰(무한 튕김, 기술 용어 혼란, 탈출 방법 부재)을 원천 차단하고, 1) 원클릭 외부 브라우저 탈출, 2) 닉네임 1초 직통 시작 고속도로, 3) 무음 자동 세션 정화, 4) 친절한 유저 언어 순화를 완결한다.

---

## 1. 파일별 Before / After 상세 설계

### [1] `index.html` (랜딩 화면 CTA 보강)
- **Before**: 카카오 버튼 1개만 단독 노출되고 하단에 작은 글씨로 `로그인이 잘 안 되시나요? (세션 초기화·복구)`.
- **After**:
  - 카카오 버튼 직하단에 `카카오 계정 없이 닉네임으로 1초 시작하기` 보조 링크(`landNickQuickLink`) 배선.
  - 클릭 시 바로 닉네임 입력 모달이 열려 외부 브라우저 전환이나 OAuth 없이도 즉시 입장 가능.
  - 하단 링크 텍스트: `로그인이 잘 안 되시나요? (1초 빠른 복구·입장)`으로 친절 순화.

### [2] `index.html` (스마트 자가 복구 모달: `openLoginRescueModal`)
- **Before**: `세션 초기화`라는 붉은색 기술 버튼이 있어 사용자가 수동으로 눌러야 했음.
- **After**:
  - 모달이 열리는 순간 `sb.auth.signOut()` 및 로컬 꼬인 토큰을 **백그라운드에서 무음 자동 정화(Silent Auto-Clean)**.
  - 버튼 문구를 `처음부터 새로 시작`(`rescueResetSessionBtn`)으로 순화.
  - 유저는 복잡한 조작 없이 "닉네임만 넣고 바로 입장" 버튼만 누르면 끝남.

### [3] `index.html` (카카오톡 상단 탈출 배너: `inAppBrowserNotice`)
- **Before**: 텍스트 위주 배너.
- **After**:
  - 굵은 텍스트 + `[Chrome/Safari로 열기 ↗]` 원클릭 버튼.
  - 안드로이드: Chrome 자동 실행.
  - iOS: Safari 안내 모달 + 주소 자동 복사.

### [4] `index.html` (줄 수 규격 엄수)
- 총 22,196줄 정확히 불변 유지.

---

## 2. 5대 무결성 검증 계획
1. **Zero Dead Click**: `landNickQuickLink`, `btnEscapeInAppNotice`, `rescueResetSessionBtn` 전수 클릭 검증.
2. **Zero UX Regression**: 일반 브라우저에서 카카오 3초 로그인 및 구글 캘린더 연동 무손실 유지.
3. **Zero Data Loss**: 10종 페르소나 데이터 무손실 검증.
4. **Full State Propagation**: 닉네임 1초 직통 입장 후 홈/목표/기록 전 탭 즉시 정상 렌더링.
5. **자동화 테스트**: `npm test` 256개+ 100% PASS.

---

## 3. 체크리스트
- [ ] 1. `index.html` 랜딩 화면 카카오 버튼 직하단 "닉네임으로 1초 시작하기" 고속도로 배선
- [ ] 2. `index.html` 스마트 복구 모달의 무음 자동 정화 및 "세션 초기화" 기술 용어 순화
- [ ] 3. `index.html` 랜딩 하단 복구 링크 텍스트 순화 ("1초 빠른 복구·입장")
- [ ] 4. `index.html` 22,196줄 불변 유지 및 `scripts/smoke-test.js` 검증 갱신
- [ ] 5. `npm test` 100% ALL PASS 및 로컬 main 병합