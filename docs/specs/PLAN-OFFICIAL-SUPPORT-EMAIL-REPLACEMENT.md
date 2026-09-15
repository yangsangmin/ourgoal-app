# 실행계획서 (PLAN) — 공식 업무용 고객지원 이메일 도메인 전수 교체 및 무결성 확보

> **문서 ID**: PLAN-OFFICIAL-SUPPORT-EMAIL-REPLACEMENT  
> **티켓 연계**: #TASK-ES-101  
> **작성 일시**: 2026-09-15  
> **작성자**: Antigravity AI Engine  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수

---

## 1. 개요 및 목적
- **목표**: 상민님 개인 이메일(`ysm0422@naver.com`) 노출을 100% 원천 차단하고, 공식 업무용 도메인 이메일(`support@ourgoal.kr`)로 전수 교체.
- **범위**:
  1. `index.html`: 랜딩 푸터(L776), 설정 문의하기 mailto(L2496) 및 토스트(L2499), 약관 제6조(L3104)
  2. `docs/legal/privacy.md`: L53, L60
  3. `docs/growth/RELEASE_72H_GUIDE.md`: L43
  4. `scripts/smoke-test.js`: L881, L895 단언문 동기화
  5. `BACKLOG.md`: 47번 항목 완료 처리
  6. `docs/rules/TICKETS.md`: #TASK-ES-101 등록

---

## 2. 세부 변경 계획 (Diff Plan)

### 2-1. `index.html` (헌법 제18조 22,196줄 정확히 보존)
- **L776**:
  - 변경 전: `<div>문의 <a href="mailto:ysm0422@naver.com">ysm0422@naver.com</a></div>`
  - 변경 후: `<div>문의 <a href="mailto:support@ourgoal.kr">support@ourgoal.kr</a></div>`
- **L2496**:
  - 변경 전: `var mailto = 'mailto:ysm0422@naver.com?subject=' + encodeURIComponent('[아워골 문의/버그 제보]') +`
  - 변경 후: `var mailto = 'mailto:support@ourgoal.kr?subject=' + encodeURIComponent('[아워골 문의/버그 제보]') +`
- **L2499**:
  - 변경 전: `toast('이메일 앱을 엽니다 (ysm0422@naver.com)');`
  - 변경 후: `toast('이메일 앱을 엽니다 (support@ourgoal.kr)');`
- **L3104**:
  - 변경 전: `'<p><b>제6조 (개인정보 보호책임자)</b><br>• 성명: 아워골 운영팀 · 문의: ysm0422@naver.com</p>' +`
  - 변경 후: `'<p><b>제6조 (개인정보 보호책임자)</b><br>• 성명: 아워골 운영팀 · 문의: support@ourgoal.kr</p>' +`

### 2-2. `docs/legal/privacy.md`
- **L53**:
  - 변경 전: `2. 고객지원 이메일(ysm0422@naver.com)을 통해서도...`
  - 변경 후: `2. 고객지원 이메일(support@ourgoal.kr)을 통해서도...`
- **L60**:
  - 변경 전: `- **문의 이메일**: ysm0422@naver.com`
  - 변경 후: `- **문의 이메일**: support@ourgoal.kr`

### 2-3. `docs/growth/RELEASE_72H_GUIDE.md`
- **L43**:
  - 변경 전: `- 운영팀 직통 메일: ysm0422@naver.com`
  - 변경 후: `- 운영팀 직통 메일: support@ourgoal.kr`

### 2-4. `scripts/smoke-test.js`
- **L881**: `assert.ok(priv.includes('support@ourgoal.kr'), '보호책임자 연락처 포함');`
- **L895**: `assert.ok(html.includes('support@ourgoal.kr'), '고객지원 이메일 표기');`

---

## 3. 검증 계획 (Verification Plan)
1. **정적 검사**: `grep_search`로 `ysm0422@naver.com`이 런타임/법률 파일에 0건인지 전수 확인.
2. **줄 수 불변 검사**: `node`로 `index.html` 줄 수가 정확히 22,196줄인지 검증.
3. **단위 테스트**: `npm test` 245개 테스트 100% 통과 검증.
4. **Tri-Sync**: `node C:/dev/command-center/lib/tri-sync.js check` 100% 검증.

---

## 4. 마감 상한선 준수 (헌법 제14조)
- [1단계: 브랜치 생성 및 작업계획서 작성] ➔ [2단계: 구현 및 단위 테스트] ➔ [3단계: 실물 검증] ➔ [4단계: 로컬 메인 병합 상태]까지 완료 후 상민님께 결심 요청 보고.
