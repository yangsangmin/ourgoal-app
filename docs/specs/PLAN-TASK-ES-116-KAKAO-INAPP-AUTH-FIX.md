# 작업계획서 (PLAN-TASK-ES-116): 카카오톡 인앱 브라우저 로그인 무한 튕김 해결 및 외부 브라우저 원클릭 탈출 & 인증 콜백 안정화

> **문서 ID**: PLAN-TASK-ES-116  
> **티켓**: #TASK-ES-116 (FIX/INFRA)  
> **기초 요구서**: docs/specs/REQ-TASK-ES-116-KAKAO-INAPP-AUTH-FIX.md  
> **목표**: 카카오톡 인앱 브라우저에서 카카오 로그인 시 발생하는 PKCE 소실/웹뷰 격리 및 1.2초 콜백 타임아웃 레이스 컨디션을 원천 차단하고, 외부 브라우저 원클릭 탈출 안내와 4.0초 안전 대기 루프 및 자동 세션 정화 안전망을 완결한다.

---

## 1. 중심 배선 (Core Wire)
- `index.html`:
  1. `inAppBrowserNotice`: 단순 텍스트 배너에서 **"안전한 로그인을 위해 Chrome/Safari로 열기" 원클릭 탈출 버튼이 탑재된 액티브 배너**로 전면 업그레이드. (안드로이드 intent 자동 탈출 링크 + iOS 사파리 가이드 모달).
  2. `boot()`:
     - `maxWait`를 `isOAuthCallback ? 20 : 1` (최대 4.0초)로 확대.
     - OAuth 콜백 대기 중 랜딩 화면 깜빡임 방지 로딩 인디케이터 배선.
     - 에러 감지 시(`authErr` 또는 `code_verifier` 부재) 꼬인 세션 자동 소각 및 스마트 자가 복구 모달 연계.
  3. `index.html` 22,196줄 불변 규격 엄수.

## 2. 파일별 변경 예산 및 계획
- `index.html`: 약 60~80줄 변경, 총 줄 수 22,196줄 유지 (빈 줄 상쇄 치환).
- `scripts/smoke-test.js`: 약 20줄 추가 (컴플라이언스 5대 검증).
- `docs/rules/TICKETS.md`: #TASK-ES-116 완료 상태 업데이트.
- `dev_log.md`: 작업 내역 및 검증 결과 기록.

## 3. 5대 무결성 검증 시나리오
1. **Zero Dead Click**: 새로 탑재되는 인앱 탈출 버튼 및 복구 버튼 전수 클릭 검증.
2. **Zero UX Regression**: 일반 브라우저(Chrome, Safari 등)에서 카카오 로그인 버튼 동작 100% 정상 보존.
3. **Zero Data Loss**: 기존 10종 페르소나 데이터 무손실 딥이퀄 검증 통과.
4. **Full State Propagation**: 세션 복원 후 정상 enterApp() 및 화면 렌더링 검증.
5. **자동화 테스트**: `npm test` 258개+ 100% PASS.

## 4. 체크리스트 (상한선: 4단계 로컬 메인 병합)
- [ ] 1. `index.html` 카카오톡 인앱 브라우저 외부 탈출(intent/사파리) 배너 및 함수 배선
- [ ] 2. `index.html` `boot()` 콜백 대기 시간 4.0초 확대 및 OAuth 로딩 오버레이 보강
- [ ] 3. `index.html` PKCE 에러 자동 정화 및 복구 모달 연계 강화
- [ ] 4. `index.html` 22,196줄 엄수 및 `scripts/smoke-test.js` 5대 컴플라이언스 검증 추가
- [ ] 5. `npm test` 전수 100% ALL PASS 및 로컬 main 병합 완결 (4단계 마감)