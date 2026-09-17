# [REQ] #TASK-ES-154 아워골 평가하기 3중 접수창구(텔레그램·노션·DB) 및 피드백 배선 무결성 요구사항 정의서

- **문서 번호**: REQ-APP-EVALUATION-WIRING-ES154
- **작성 일자**: 2026-09-17
- **적용 규정**: 아워골 최고 헌법 15대 조문 (AGENTS.md) & 문제해결 8원칙 (1사이클 REQ)
- **대상 과제**: #TASK-ES-154 (아워골 평가하기 제출 시 3중 접수창구 도달 및 확인 파이프라인 무결성 확보)
- **담당 축**: INFRA / FIX

---

## 1. 문제 정확히 파악 (원칙 ①)
1. 사용자가 홈 탭 하단의 `<아워골 평가해주기>` 배너를 클릭하여 5대 항목(100점 종합 점수, 장점, 단점, 추가 및 개선요청, 대표에게 하고 싶은 말)을 작성하고 [평가 제출하기]를 누르면,
2. 프론트엔드는 `{ type: 'app_evaluation', userId, userName, evaluation: { score, pros, cons, improvements, ceoMsg } }` 형태로 `/api/inquiry`에 POST 요청을 전송한다.
3. 그러나 백엔드 수신부(`api/track.js`의 `handleInquiry`)는 일반 고객문의 규격인 `body.content` 문자열 필드만을 필수로 검증하고 있어, `body.content`가 없다는 이유로 `400 Bad Request` 에러(`'문의 내용을 입력해주세요.'`)를 즉시 반환하고 종료된다.
4. 프론트엔드는 `.catch(function(){})`로 예외를 무음 처리하고 있어 사용자에게는 정상 접수 토스트가 뜨지만, **실제로는 노션 DB 원장에도 적재되지 않고, 상민님 텔레그램 실시간 알림도 전혀 발송되지 않으며, Supabase inquiries 테이블에도 들어가지 않는 '침묵형 전파 단절(Silent Breakage)'** 결함이 발생하고 있다.

---

## 2. 본질·원인·핵심 파악 (원칙 ②)
- **본질 및 축**: `INFRA / FIX` — 사용자 피드백 접수 파이프라인의 종단간(E2E) 무결성 복구.
- **원인**:
  1. `api/track.js` 백엔드 서버리스 함수에서 `body.type === 'app_evaluation'` 또는 `body.evaluation` 페이로드 분기 처리 누락.
  2. 프론트엔드(`index.html`) 제출 핸들러에서 비동기 처리 간 로딩 상태 미표시 및 무음 catch로 인한 침묵형 실패.
- **핵심**:
  1. 백엔드에서 `app_evaluation` 수신 시 5개 항목을 구조화된 텍스트 본문(`content`) 및 제목(`summaryTitle`)으로 자동 가공.
  2. 상민님 텔레그램 봇 알림(`1260106462`), 노션 원장 DB(`3dd598db-9096-816e-8875-c602c34d251f`), Supabase `inquiries` 테이블 3곳에 즉시 도달하도록 배선.
  3. 프론트엔드 버튼 로딩 인디케이터 및 실제 성공 응답 확인 시 토스트/모달 종료(4위 1체 배선).

---

## 3. 해결방식 결정 (원칙 ③) 및 스토리지 원장화 3대 명세 (헌법 제2조 제4항)
1. **스토리지 원장화 3대 명세 (Storage Blueprint Mandate)**:
   - **1호 (원격 DB 스키마 명세)**:
     - Supabase `inquiries` 테이블의 기존 컬럼(`inquiry_type`, `reply_email`, `content`, `user_id`, `user_nickname`, `user_agent`, `app_version`, `status`, `created_at`)을 그대로 활용하며, `inquiry_type: 'evaluation'`으로 적재.
     - 사용자 프로필 `users.settings.appEvaluations` JSONB 배열에 원격 저장 유지.
   - **2호 (스마트 스토리지 분기 설계)**:
     - 순수 텍스트 평가 데이터이므로 대용량 바이너리 분기 불필요. 로컬 `state.profile.settings.appEvaluations` 및 Supabase 원격 `users.settings`와 `inquiries` 2중 저장.
   - **3호 (4대 뷰 전파 배선도)**:
     - 평가 제출은 목표/체크인 데이터 변경이 아니므로 뷰 렌더러 파괴 없음. `saveProfile()` 호출 및 모달 정상 종료.

2. **백엔드 파싱 및 텔레그램 알림 양식 규격화**:
   - `typeLabel`: `앱 평가/피드백`
   - 요약 제목: `[앱 평가] ⭐ {score}점 - {ceoMsg/pros 요약} ({userNickname})`
   - `content` 자동 조립 양식:
     ```text
     [아워골 종합 평가 리포트]
     • 종합 점수: {score}점 / 100점
     • 장점(좋았던 점): {pros}
     • 단점(아쉬웠던 점): {cons}
     • 추가 및 개선 요청: {improvements}
     • 대표에게 하고 싶은 말: {ceoMsg}
     ```

---

## 4. 재검토 및 보완 (원칙 ④)
- 만약 평가 점수나 일부 항목이 비어 있더라도, 유효한 항목들을 조합하여 안전하게 `content`를 구성해야 한다.
- 노션 DB의 `유형` 셀렉트에 '기타 문의사항' 또는 '새로운 기능 제안' 호환되도록 안전 처리.
- 텔레그램 알림에 별점 이모지와 점수를 강조하여 상민님이 스마트폰에서 즉시 한눈에 평가를 인지할 수 있도록 서식화.

---

## 5. 단계별 실행 기준 (원칙 ⑤, ⑦)
- [단계 1] `api/track.js`에 `app_evaluation` 및 `body.evaluation` 페이로드 처리 로직 추가.
- [단계 2] `index.html` 내 `btnSubmitAppEval` 이벤트 핸들러에 버튼 비활성화, '제출 중...' 로딩 피드백, `res.ok` 확인 후 모달 닫기 배선.
- [단계 3] `scripts/smoke-test.js`에 #TASK-ES-154 관련 백엔드 수신/파싱 및 3중 접수망 배선 검증 테스트 추가.
- [단계 4] 로컬 검증, `npm test`, `verify-integrity-gate.js` 전수 ALL PASS 확인 후 로컬 메인 병합.

---

## 6. 막히는 지점 예상 및 대책 (원칙 ⑧)
- **예상**: `api/track.js`의 라우팅 조건에서 `/api/inquiry` 외에 직접 호출 시 누락 가능성.
- **대책**: `body.type === 'app_evaluation'` 또는 `body.evaluation`이 존재하는 경우 URL 경로와 무관하게 `handleInquiry`로 즉시 라우팅되도록 가드 추가.
