# [PLAN] #TASK-ES-154 아워골 평가하기 3중 접수창구(텔레그램·노션·DB) 배선 무결성 실행 계획서

- **문서 번호**: PLAN-APP-EVALUATION-WIRING-ES154
- **작성 일자**: 2026-09-17
- **적용 규정**: 아워골 최고 헌법 15대 조문 (AGENTS.md) & 문제해결 8원칙 (2사이클 PLAN)
- **대상 과제**: #TASK-ES-154
- **담당 축**: INFRA / FIX

---

## 1. 아키텍처 및 구현 설계 (원칙 ①, ②, ③)

### 1.1 백엔드 파이프라인 (`api/track.js`)
- `handleInquiry` 함수:
  - `body.type === 'app_evaluation'` 또는 `body.evaluation` 존재 여부 검사.
  - 평가 데이터 추출:
    ```javascript
    var evalData = body.evaluation || {};
    var evalScore = (evalData.score !== undefined && evalData.score !== null && !isNaN(evalData.score)) ? evalData.score : null;
    var evalPros = (evalData.pros || '').trim();
    var evalCons = (evalData.cons || '').trim();
    var evalImp = (evalData.improvements || '').trim();
    var evalCeo = (evalData.ceoMsg || '').trim();
    ```
  - `content` 조립:
    ```javascript
    var lines = [];
    lines.push('[아워골 종합 평가 리포트]');
    if (evalScore !== null) lines.push('• 종합 점수: ' + evalScore + '점 / 100점');
    if (evalPros) lines.push('• 장점: ' + evalPros);
    if (evalCons) lines.push('• 단점: ' + evalCons);
    if (evalImp) lines.push('• 추가/개선요청: ' + evalImp);
    if (evalCeo) lines.push('• 대표에게 하고싶은 말: ' + evalCeo);
    content = lines.join('\n');
    ```
  - `summaryTitle` 생성:
    ```javascript
    summaryTitle = '[앱 평가] ⭐ ' + (evalScore !== null ? evalScore + '점' : '점수미기재') + ' - ' + (evalCeo || evalPros || evalImp || '사용자 평가').slice(0, 20) + ' (' + userNickname + ')';
    ```
  - `typeLabel`: `'앱 평가/피드백'`
  - 텔레그램 메시지 포맷에 평가 전용 서식 적용:
    ```javascript
    var tgText =
      '⭐ [아워골 사용자 앱 평가 접수]\n\n' +
      (evalScore !== null ? '• 종합 점수: ' + evalScore + '점 / 100점\n' : '') +
      '• 작성자: ' + userNickname + (userId ? ' (' + userId.slice(0, 8) + '...)' : '') + '\n' +
      '• 접수 시각: ' + nowIso.replace('T', ' ').slice(0, 19) + '\n\n' +
      '[평가 내용 상세]\n' + content + '\n\n' +
      '👉 노션 원장: https://app.notion.com/p/' + notionDbId.replace(/-/g, '');
    ```
  - 메인 핸들러 라우팅:
    `body.type === 'app_evaluation' || body.evaluation`일 때도 `handleInquiry`로 진입 보장.

### 1.2 프론트엔드 4위 1체 배선 (`index.html`)
- `btnSubmitAppEval` 이벤트 리스너:
  - 제출 시작 시:
    ```javascript
    btnSubmitEval.disabled = true;
    btnSubmitEval.textContent = '제출 중...';
    ```
  - 비동기 전송:
    ```javascript
    fetch('/api/inquiry', { ... })
      .then(function(res){ return res.json(); })
      .then(function(data){
        if(data && data.ok){
          toast('소중한 평가가 접수되었습니다. 감사합니다! ⭐');
          closeAppEvaluationModal();
        } else {
          toast((data && data.error) || '접수 중 오류가 발생했습니다.');
        }
      })
      .catch(function(){
        toast('네트워크 상태를 확인해주세요.');
      })
      .finally(function(){
        btnSubmitEval.disabled = false;
        btnSubmitEval.textContent = '평가 제출하기';
      });
    ```

---

## 2. 5대 무결성 검증 시나리오 (원칙 ⑥)
1. **Zero Dead-Click**: 모달 열기, 입력, 평가 제출 버튼 인터랙션 시 콘솔 에러 0건.
2. **Zero UX Regression**: 기존 1:1 고객문의, 제보, 설정, 홈 화면 동작 100% 보존.
3. **Zero Data Loss**: 유저 로컬 `state.profile.settings.appEvaluations`와 Supabase 원격 `inquiries` 테이블 2중 영속화 검증.
4. **Full State Propagation**: 모달 제출 후 토스트 표출 및 정상 닫힘.
5. **자동화 테스트 100% 통과**: `scripts/smoke-test.js` 290개 테스트 전수 ALL PASS.

---

## 3. 작업 체크리스트 (헌법 제9조 제3항 준수)
- [ ] 1. 백엔드 `api/track.js`에 `app_evaluation` 파싱 및 3중 접수망 배선 구현
- [ ] 2. 프론트엔드 `index.html` 내 `btnSubmitAppEval` 4위 1체 피드백 고도화
- [ ] 3. `scripts/smoke-test.js`에 평가 접수 종단간 검증 테스트 추가
- [ ] 4. `npm test` 및 `verify-integrity-gate.js` 전수 검증
- [ ] 5. [4단계: 로컬 메인 병합 상태 및 5A 프리뷰 배포] 완료 후 상민님께 실서버 배포 여부 보고
