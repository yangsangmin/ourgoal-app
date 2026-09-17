# 엔지니어링 작업계획서 (PLAN) — 공식 지원 이메일(ourgoal.support@gmail.com) 전수 단일화 및 구 이메일 재발 방지 정적 방화벽 규제 배선

> **문서 ID**: PLAN-OFFICIAL-GMAIL-AND-BAN-PREV-EMAIL-ES175  
> **요구사항 연계**: [REQ-OFFICIAL-GMAIL-AND-BAN-PREV-EMAIL-ES175](file:///C:/dev/ourgoal-app/docs/specs/REQ-OFFICIAL-GMAIL-AND-BAN-PREV-EMAIL-ES175.md)  
> **티켓 연계**: #TASK-ES-175  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity AI Engine (Session 6248f4d3)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 실존하는 공식 구글 계정(`ourgoal.support@gmail.com`)으로 아워골 내 모든 고객 지원 및 개인정보 보호책임자 이메일을 전수 단일화하고, 상민님의 개인 네이버 메일(`ysm0422@naver.com`) 및 임시 도메인 메일(`support@ourgoal.kr`)이 다시는 재발하지 않도록 기계적 정적 방화벽과 단언문을 배선함.
- **영향 받는 파일 목록 전수**:
  - `index.html`: 약관 모달 내 제6조 개인정보 보호책임자 문의처 치환
  - `docs/legal/privacy.md`: 개인정보처리방침 정본 내 문의처 치환
  - `js/tab-guides.js`: 설정 모달 내 탭 활용 가이드 허브 고객지원 채널 텍스트 치환
  - `docs/growth/RELEASE_72H_GUIDE.md`: 운영팀 직통 메일 치환
  - `docs/GOOGLE_PLAY_CLOSED_TEST_RUNBOOK.md`: 구글 플레이 콘솔 개발자 연락처 및 설문 이메일 명시
  - `scripts/smoke-test.js`: `support@ourgoal.kr` 검증문 갱신 및 금지 이메일 재발 방지 단언문 신설
  - `scripts/verify-integrity-gate.js`: [검증 11/11] 공식 지원 이메일 및 금지 이메일 정적 방화벽 검사 추가
  - `docs/rules/TICKETS.md`: #TASK-ES-175 신규 티켓 등록 및 완료 상태 반영
  - `BACKLOG.md`: 과업 현황 갱신

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 하드코딩된 이메일 문자열의 불일치를 해소하고, CI/CD 및 로컬 빌드 단계에서 구 이메일 유입을 0ms 단위로 원천 차단하는 정적 검증 파이프라인의 완성.
- **[원인] (Technical Causes)**: 과거 개발 및 기획 과정에서 사용된 임시 이메일 문자열이 여러 정적 파일에 분산되어 있었고, 이를 검증하는 게이트키퍼 규칙이 없어 재유입 가능성이 열려 있었음.
- **[중심 배선] (Core Wire & State)**:
  - 런타임 UI: `index.html`의 `showLegalModal` 및 `js/tab-guides.js`의 `GUIDE_HUB_DATA`
  - 게이트키퍼 방화벽: `scripts/verify-integrity-gate.js` 내 신규 `check('공식 지원 이메일(ourgoal.support@gmail.com) 정상 배선 및 금지 이메일(ysm0422, support@ourgoal.kr) 0건 방화벽 검사')` 배선
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 금지 이메일 검출 시 `verify-integrity-gate.js`가 즉각 예외를 던져 빌드, 커밋, PR 머지를 물리적으로 거부함.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[코드/문서 작성] -> [verify-integrity-gate.js 정적 스캔] -> [금지 이메일 0건 & ourgoal.support@gmail.com 필수 검증] -> [npm test ALL PASS] -> [로컬 메인 병합]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 개인정보 보호책임자 이메일 치환 | +1줄 | -1줄 | 0줄 | 외과수술적 diff (줄수 보존) |
| `docs/legal/privacy.md` | 공식 문의 이메일 치환 | +2줄 | -2줄 | 0줄 | 텍스트 갱신 |
| `js/tab-guides.js` | 가이드 허브 고객지원 안내 치환 | +1줄 | -1줄 | 0줄 | 텍스트 갱신 |
| `docs/growth/RELEASE_72H_GUIDE.md` | 운영팀 직통 메일 치환 | +1줄 | -1줄 | 0줄 | 텍스트 갱신 |
| `docs/GOOGLE_PLAY_CLOSED_TEST_RUNBOOK.md` | 콘솔 개발자 연락처 명시 | +3줄 | -1줄 | +2줄 | 런북 가이드 구체화 |
| `scripts/smoke-test.js` | 공식 이메일 단언문 갱신 및 금지 이메일 배제 단언문 신설 | +10줄 | -2줄 | +8줄 | TDD 회귀 검증 |
| `scripts/verify-integrity-gate.js` | [검증 11/11] 정적 방화벽 게이트 신설 | +35줄 | 0줄 | +35줄 | AST 및 정적 방화벽 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: 약관 모달 및 가이드 허브 모달 내 표준 텍스트 엘리먼트 유지
2. **이벤트 리스너 (Listener)**: 기존 모달 렌더러 이벤트 바인딩 유지
3. **비즈니스 로직 (Logic)**: 실제 계정 `ourgoal.support@gmail.com` 표기 및 복사/열람 완결
4. **피드백 & 예외처리 (Feedback)**: 인앱 1:1 문의 모달과의 상호보완으로 완벽한 접수 체계 제공

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, 모달 레이아웃을 일절 변경하지 않고 오직 이메일 문자열만 1:1 치환했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(320종 포함), 목표, 기록, 세팅값이 단 1바이트도 손상되지 않는가?
- [x] 캘린더 구글 동기화 pseudo uid 및 목 데이터와 충돌하지 않도록 정규식 스코프를 정밀 지정했는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `index.html` 4352번 라인의 `support@ourgoal.kr`을 `ourgoal.support@gmail.com`으로 외과수술적 치환
2. **Step 2**: `docs/legal/privacy.md` 및 `js/tab-guides.js` 내 이메일 치환
3. **Step 3**: `docs/growth/RELEASE_72H_GUIDE.md` 및 `docs/GOOGLE_PLAY_CLOSED_TEST_RUNBOOK.md` 내 이메일 명시
4. **Step 4**: `scripts/smoke-test.js`에 `ourgoal.support@gmail.com` 단언문 및 금지 이메일 배제 단언문 추가
5. **Step 5**: `scripts/verify-integrity-gate.js`에 [검증 11/11] 방화벽 추가 및 19개 검사 ALL PASS 확인
6. **Step 6**: `npm test` 전체 실행 후 311개 이상 스모크 테스트 100% 통과 확인
7. **Step 7**: TICKETS.md 및 BACKLOG.md 갱신, Tri-Sync 동기화, 로컬 main 병합 완료

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (Zero Dead-Click)**: 설정창 내 약관 열기 및 가이드 허브 열람 시 에러 없이 모달이 정상 렌더링되고 이메일이 정확히 표시되는지 확인.
- **시나리오 B (Zero Data Loss)**: 10종 가상 페르소나 데이터 주입 후 업데이트 시뮬레이션 -> 100% 무손실 딥이퀄 통과.
- **시나리오 C (Zero UX Regression)**: 게스트 모드, 소셜 로그인 세션 유지, 핵심 루프(E1/E2/E3) 손상 없음 확인.
- **시나리오 D (Full State Propagation)**: 설정창과 약관 모달 간 이메일 일관성 실측.
- **시나리오 E (자동화 게이트 통과)**: `scripts/verify-integrity-gate.js`의 신규 방화벽이 고의로 구 이메일을 넣었을 때 에러를 발생시키고, 정상 시 ALL PASS하는지 검증.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS (19/19 통과)
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] [4단계: 로컬 메인 병합 상태 및 5A 프리뷰 배포] 완결 후 상민님께 실서버 배포 여부 보고

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: `smoke-test.js` 또는 `verify-integrity-gate.js`의 이전 하드코딩 테스트 실패.
- **사전 방어 및 우회 로직**: 테스트 파일 내 단언문을 먼저 갱신하고 게이트키퍼 방화벽 로직을 정밀하게 단위 테스트한 뒤 전체 테스트 실행.
- **롤백 계획 (Rollback Strategy)**: 문제 발생 시 `git checkout .`으로 외과수술 전 상태로 즉각 복원 가능.
- **재검증 트리거**: 테스트 실패 발생 시 원칙 ⑤의 Step 1~4로 회귀하여 치환 누락 및 정규식 일치 여부를 재검토한다.
