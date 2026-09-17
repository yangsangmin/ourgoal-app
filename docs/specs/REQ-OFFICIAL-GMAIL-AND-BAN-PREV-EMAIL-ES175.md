# 요구사항 정의서 (REQ) — 공식 지원 이메일(ourgoal.support@gmail.com) 전수 단일화 및 구 이메일 재발 방지 정적 방화벽 규제 배선

> **문서 ID**: REQ-OFFICIAL-GMAIL-AND-BAN-PREV-EMAIL-ES175  
> **티켓 연계**: #TASK-ES-175  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity AI Engine (Session 6248f4d3)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "ourgoal.support@gmail.com로 계정생성했으니까 이제 이메일 관련 이 메일주소로 전부 다 바꿔. 이전 이메일주소 다시 절대 아워골에 나타나지 않게 규제하고. 그리고 각각 어디에 적용했는지 알려줘"
- **현재 발생하는 문제 및 한계 (표면적 현상)**:
  - 아워골의 공식 운영/지원용 계정으로 `ourgoal.support@gmail.com`이 최종 개설되었음에도, 코드베이스(`index.html`, `js/tab-guides.js`), 법률 문서(`docs/legal/privacy.md`), 런북 및 가이드(`docs/growth/RELEASE_72H_GUIDE.md`, `docs/GOOGLE_PLAY_CLOSED_TEST_RUNBOOK.md`)에 과거 임시 주소(`support@ourgoal.kr`)가 잔존함.
  - 상민님의 개인 네이버 이메일(`ysm0422@naver.com`) 및 임시 도메인 이메일(`support@ourgoal.kr`)이 향후 다른 AI 에이전트나 세션에 의해 재유입될 수 있는 기계적 방화벽/린터 검증이 완비되지 않음.
- **표면 아래 기저 층위 분석**:
  - **1층 (미작동/단절 결함)**: 임시 도메인 메일(`support@ourgoal.kr`)은 실제 메일 수신함 설정이 되어 있지 않아 유저가 이메일을 발송할 경우 반송되거나 누락될 위험이 있었음. 이제 실존하는 구글 계정(`ourgoal.support@gmail.com`)으로 단일화하여 완결해야 함.
  - **2층 (구조/프로세스 부재)**: 과거 이메일(`ysm0422@naver.com`, `support@ourgoal.kr`)의 유입을 물리적으로 차단하는 정적 AST 방화벽(Integrity Gate)이 없어, 레거시 문서를 참고한 AI가 구 이메일을 재삽입할 위험이 상존함.
  - **3층 (시스템/유저 체감 괴리)**: 개인정보처리방침, 플레이스토어 개발자 정보, 활용법 가이드에 서로 다른 이메일이 기재되면 유저 신뢰가 저해되고 심사 리젝 위험이 발생함.
- **사용자 상황 및 페르소나**:
  - 아워골을 사용하는 모든 일반 유저, 개인정보 열람 및 고객 지원을 요청하는 유저, 구글 플레이 스토어 심사관 및 테스터.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `INFRA` & `FIX` (인프라 및 보안 규범 정착)
- **[본질] (Essence)**: 실존하는 공식 구글 계정(`ourgoal.support@gmail.com`)으로 아워골의 모든 대외/대내 소통 채널을 단일화하고, 상민님의 개인정보 및 미개설 구 이메일의 재발을 물리적으로 원천 차단하는 것.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1**: 초기 개발 단계에서의 개인 이메일(`ysm0422@naver.com`) 기재.
  2. **원인 2**: 임시 기획 단계에서의 가상 도메인 메일(`support@ourgoal.kr`) 임시 배치.
  3. **원인 3**: 구 이메일 문자열의 재유입을 0.1초 만에 감지하고 빌드를 거부하는 자동화 게이트키퍼 린터 룰의 부재.
- **[중심] (Core Bottleneck & Anchor)**: 코드베이스 및 문서 전역에서 구 이메일을 단 1바이트의 오차도 없이 `ourgoal.support@gmail.com`으로 치환하고, 게이트키퍼(`verify-integrity-gate.js`)에 영구 방화벽을 결합하는 것.
- **[핵심] (Critical Safety & Termination)**: 단일화 완료 후 `npm test` 및 `verify-integrity-gate.js`에서 이전 이메일 0건 검증을 기계적으로 통과하여 승인선 ②(개인정보 보호)를 100% 사수하는 것.
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자와 구글 스토어 심사관이 개인정보처리방침, 가이드 허브, 스토어 등록정보 어디를 확인하더라도 실존하는 공식 지원 이메일(`ourgoal.support@gmail.com`)로 일관되게 연결되어 최고의 신뢰감을 느끼며, 상민님의 개인정보는 영구히 보호된다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인(세션, 게스트, 소셜): 무영향 (기존 세션 및 인증 로직 유지).
  - 홈 화면 및 스트릭: 무영향.
  - 기록/통계/캘린더 탭: 무영향.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)
- **하지 말아야 할 것 (Avoid)**:
  - 구글 워크스페이스 유료 결제나 추가 인프라 비용 지출 금지.
  - 인앱 고객 지원 창구(제14조 제1항의 인앱 모달 `openCustomerInquiryModal()`)를 파괴하고 외부 mailto 링크로 퇴행시키는 행위 금지.
- **해야 할 것 (Action)**:
  - `index.html` 내 개인정보 보호책임자 문의 이메일 교체.
  - `docs/legal/privacy.md` 개인정보처리방침 정본 이메일 교체.
  - `js/tab-guides.js` 탭 활용 가이드 허브 공식 이메일 교체.
  - `docs/growth/RELEASE_72H_GUIDE.md` 직통 이메일 교체.
  - `docs/GOOGLE_PLAY_CLOSED_TEST_RUNBOOK.md` 개발자 연락처 및 콘텐츠 등급 설문 이메일 명시.
  - `scripts/smoke-test.js` 검증문 갱신 및 구 이메일 배제 단언문 신설.
  - `scripts/verify-integrity-gate.js`에 **[검증 11/11] 공식 지원 이메일 배선 및 금지 이메일(`ysm0422@naver.com`, `support@ourgoal.kr`) 영구 방화벽 검사** 탑재.
- **왜 이 방식이어야만 하는가 (Why this approach)**:
  - 단순 텍스트 치환만 수행하면 추후 다른 세션에서 실수로 구 이메일을 다시 쓸 위험이 있으므로, 헌법 집행관인 `verify-integrity-gate.js`에 기계적 방화벽을 세워야만 상민님의 "다시 절대 아워골에 나타나지 않게 규제하라"는 명령을 영구히 집행할 수 있기 때문임.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- **1호 (원격 DB 스키마 명세)**: 정적 텍스트, 가이드 모듈 및 검증 스크립트 대상 작업으로 별도 DB 컬럼 신설 불요 (기존 `inquiries.reply_email` 스키마 유지).
- **2호 (스마트 스토리지 분기 설계)**: 로컬/원격 미디어 스토리지 변경 없음.
- **3호 (4대 뷰 전파 배선도)**: 설정 모달 및 약관 모달 내 정적 바인딩으로 4대 뷰 리렌더링 영향 없음.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| 개인정보 약관 제6조 | 약관 모달 | 열람 | `문의: ourgoal.support@gmail.com` 표출 | 텍스트 무결성 유지 |
| 탭 활용 가이드 허브 | 설정창 모달 | 열람 | `공식 업무용 고객지원 채널(ourgoal.support@gmail.com)` 표출 | 텍스트 무결성 유지 |
| 1:1 고객 문의 모달 | 설정 / 푸터 | 열람 및 접수 | 인앱 접수(텔레그램/노션/DB 적재) 정상 작동 | 실패 시 에러 피드백 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- **아바타 보존**: 기존 아바타 설정값 및 320종 페르소나 100% 보존.
- **목표 데이터 보존**: 기존 목표 목록, 마일스톤 100% 보존.
- **기록 데이터 보존**: 체크인 히트맵, 5단위 회고 100% 보존.
- **화면 구성 세팅값 보존**: 나만의 홈 구성 등 전 세팅값 무손실 유지.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **비판적 자기 검토 및 약점/한계 인정**:
  - 과거 테스트 코드(`smoke-test.js`)가 `support@ourgoal.kr`을 기대하도록 하드코딩되어 있었으므로, 테스트 코드를 동시에 갱신하지 않으면 빌드가 깨짐. 반드시 테스트 코드와 게이트키퍼를 일괄 갱신해야 함.
- **기존 기능과의 충돌 가능성 검토**:
  - 캘린더 구글 동기화 시 생성되는 pseudo uid(`idx@ourgoal-app.vercel.app`)나 모크 사용자 이메일(`runner@ourgoal.kr` - 게이트키퍼 내부 목 데이터)과의 충돌 여부 검토 완료: 금지 대상은 상민님 개인 메일(`ysm0422@naver.com`) 및 대외 고객지원 임시 메일(`support@ourgoal.kr`)로 한정하여 타 기능에 사이드이펙트 없음을 보증함.
- **엣지 케이스 (Edge Cases)**:
  - 구글 플레이 콘솔에서 개발자 연락처 이메일 인증 메일 발송 시: `ourgoal.support@gmail.com`으로 즉시 수신 가능.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- **구체적 실행 시퀀스**:
  1. [단계 1]: [에이전트 / 1분] 브랜치 생성 및 작업계획서 수립.
  2. [단계 2]: [에이전트 / 2분] `index.html`, `js/tab-guides.js`, `docs/legal/privacy.md`, `docs/growth/RELEASE_72H_GUIDE.md`, `docs/GOOGLE_PLAY_CLOSED_TEST_RUNBOOK.md` 이메일 일괄 치환.
  3. [단계 3]: [에이전트 / 2분] `scripts/smoke-test.js` 단언문 갱신 및 금지 이메일 재발 방지 단언문 추가.
  4. [단계 4]: [에이전트 / 2분] `scripts/verify-integrity-gate.js`에 공식 지원 이메일 및 금지 이메일 정적 방화벽([검증 11/11]) 추가.
  5. [단계 5]: [에이전트 / 2분] `npm test` 311개 이상 테스트 및 무결성 게이트 100% ALL PASS 검증.
  6. [단계 6]: [에이전트 / 1분] TICKETS.md (#TASK-ES-175), BACKLOG.md, Tri-Sync 동기화 완료 후 로컬 main 병합 및 상민님 보고.
- **화면 간 상호연동 전파 규격**:
  - 약관 모달 및 가이드 모달 내 문의처 표출 시 즉시 `ourgoal.support@gmail.com` 반영 확인.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)
> *(주의: 본 원칙은 절차 정리(⑤)와 단계별 실행(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 타 원칙과 합치는 것은 위헌입니다)*
- **단일 실패점 (SPOF) 점검**:
  - 만약 치환 대상 파일 중 하나라도 누락될 경우 배포 후 유저 대면 화면에 불일치가 발생할 수 있음.
  - 완화책: `verify-integrity-gate.js`가 빌드 시점에 프로젝트 전체 텍스트를 정규식으로 스캔하여 단 하나의 금지 이메일이라도 발견되면 즉각 프로세스를 exit(1)로 차단하도록 구성함.
- **가정의 타당성 검증**:
  - 정적 방화벽이 과거 히스토리 파일(`docs/specs/REQ-OFFICIAL-SUPPORT-EMAIL-REPLACEMENT.md` 등 '변경 전'을 설명하는 과거 문서)까지 무차별 검사하여 정상 빌드를 방해할 가능성을 검토함.
  - 보완: 검사 대상을 런타임 파일(`index.html`, `js/`, `api/`)과 현재 효력을 갖는 정본 법률 문서(`docs/legal/privacy.md`), 앱 가이드(`docs/growth/`)로 정밀 타겟팅하여 히스토리 보존과 런타임 무결성을 동시 달성함.
- **재검증 결과 도출된 절차 수정/보완사항**:
  - 단계 4에서 게이트키퍼 스캔 대상 디렉토리를 런타임 및 정본 문서로 명확히 한정하는 방화벽 필터를 추가함.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- `index.html`, `docs/legal/privacy.md`, `js/tab-guides.js` 내에 `ourgoal.support@gmail.com` 정상 기재.
- 런타임 및 정본 문서 내 `ysm0422@naver.com`, `support@ourgoal.kr` 검출 수 **0건 (Zero)**.
- `scripts/verify-integrity-gate.js` 19개 검사 중 19개 통과 (0 failure).
- `npm test` 전체 스모크 테스트 100% 통과 (0 failure).

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)
- **예상 블로커 1**: `smoke-test.js`에 기존 `support@ourgoal.kr` 문자열 단언문이 남아 있어 테스트 실패 발생.
  - **대책**: 치환과 동시에 `smoke-test.js`의 단언문을 `ourgoal.support@gmail.com`으로 갱신.
- **예상 블로커 2**: `index.html` 변경 시 줄 수 변동이나 인코딩 손상 가능성.
  - **대책**: 외과수술적 치환을 수행하고 git diff로 전후 라인을 정밀 대조.
- **재검증 트리거**: `npm test` 또는 `verify-integrity-gate.js` 실패 시 즉시 [원칙 ⑤ 단계 2~4]로 되돌아가 누락된 파일이나 미갱신 단언문을 재스캔한다.
