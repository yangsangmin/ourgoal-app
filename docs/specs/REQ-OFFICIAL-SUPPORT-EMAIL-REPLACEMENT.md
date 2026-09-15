# 요구사항 정의서 (REQ) — 공식 업무용 고객지원 이메일 도메인 전수 교체 및 개인정보 완전 보호

> **문서 ID**: REQ-OFFICIAL-SUPPORT-EMAIL-REPLACEMENT  
> **티켓 연계**: #TASK-ES-101  
> **작성 일시**: 2026-09-15  
> **작성자**: Antigravity AI Engine  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: "4번은 바로 진행하고, 1~3은 세부 설명 해줘"
- **현재 발생하는 문제 및 한계**:
  - `BACKLOG.md` 47번 과업 및 런칭 전 P0 보안/프라이버시 이슈.
  - 앱 내 여러 영역(`index.html` 랜딩 푸터, 설정 문의하기 mailto 링크 및 토스트, 개인정보처리방침 모달)과 문서(`docs/legal/privacy.md`, `docs/growth/RELEASE_72H_GUIDE.md`)에 상민님의 개인 이메일(`ysm0422@naver.com`)이 하드코딩되어 노출 중임.
  - 불특정 다수의 유저에게 운영자 개인 네이버 이메일이 노출되어 개인정보 침해 및 전문적인 서비스 신뢰도 저해 위험이 존재함.
- **사용자 상황 및 페르소나**:
  - 랜딩 화면을 방문한 잠재 고객, 설정에서 문의하기를 누르는 활성 유저, 약관 및 개인정보처리방침을 열람하는 유저 모두에게 공식 브랜드 도메인 이메일이 일관되게 제공되어야 함.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Root Cause & Essence)
- **근본 원인**:
  - 초기 프로토타입 개발 단계에서 개발자 개인 연락처를 임시 문의처로 기재했던 것이 정식 런칭 직전까지 잔존함.
- **본질 축 (Essence Axis)**: `INFRA` & `FIX` (보안 및 브랜드 신뢰성 인프라)
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 앱의 랜딩, 설정 화면, 개인정보처리방침에서 문의하기를 클릭했을 때, 공신력 있는 공식 브랜드 이메일(`support@ourgoal.kr`)로 즉각 연결되어 전문적인 서비스 신뢰감을 느끼고, 상민님의 개인정보는 100% 안전하게 은닉된다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인: 영향 없음 (세션 유지).
  - 홈 화면/기록/통계/캘린더: 영향 없음.
  - 문의 모달 및 설정: 공식 메일 주소로 안전하게 연결.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Functional Specifications)

### 3-1. 세부 기능 요구사항 (Functional Requirements)
- **FR-01 [기본값 공식 이메일 확정]**:
  - 아워골 대표 서비스 도메인(`ourgoal.kr`)에 맞춘 공식 고객지원 및 개인정보 보호책임자 이메일을 `support@ourgoal.kr`로 단일 확정.
- **FR-02 [랜딩 화면 푸터 교체]**:
  - `index.html` 랜딩 푸터의 `ysm0422@naver.com` ➔ `support@ourgoal.kr` 교체.
- **FR-03 [설정 문의하기 핸들러 교체]**:
  - `index.html` 내 `openInquiryMail()` 등의 `mailto:support@ourgoal.kr` 및 안내 토스트 메시지 일괄 교체.
- **FR-04 [개인정보처리방침 모달 및 약관 문서 교체]**:
  - `index.html` 내 약관 모달 제6조 개인정보 보호책임자 문의처 및 `docs/legal/privacy.md`의 문의처를 `support@ourgoal.kr`로 교체.
- **FR-05 [자동 검증 및 가이드 문서 동기화]**:
  - `scripts/smoke-test.js` 내 이메일 검증 단언문을 `support@ourgoal.kr`로 갱신.
  - `docs/growth/RELEASE_72H_GUIDE.md` 직통 메일 교체.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| 랜딩 푸터 메일 링크 | 랜딩 푸터 | 클릭/터치 | `mailto:support@ourgoal.kr` 메일 클라이언트 호출 | 기본 브라우저 동작 보장 |
| `btn-inquiry-mail` | 설정 화면 | 클릭 | `mailto:support@ourgoal.kr?subject=[아워골 문의/버그 제보]...` 호출 및 토스트 | `toast('이메일 앱을 엽니다 (support@ourgoal.kr)')` |
| 약관 제6조 | 개인정보 모달 | 열람 | 제6조 개인정보 보호책임자 문의: support@ourgoal.kr 표출 | 텍스트 무결성 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 유저 데이터 변경 0건 (정적 문의처 텍스트 및 핸들러 대상).
- 헌법 제18조 `index.html` 총 줄 수 22,196줄 정확히 보존 (순증가 0줄 엄수).

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **기존 기능과의 충돌 가능성 검토**:
  - `scripts/smoke-test.js`에서 기존 `ysm0422@naver.com` 문자열을 검증하고 있었으므로, 동시 갱신하지 않으면 테스트 실패 발생함. 반드시 동시 갱신.
- **엣지 케이스**:
  - 클라이언트 기기에 기본 이메일 앱(Outlook, Mail 등)이 설치되어 있지 않은 경우: mailto 링크가 실패하더라도 화면 및 토스트에 주소가 명확히 표시되어 수동 복사 가능.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
1. 브랜치 `feat/official-support-email-replacement` 생성.
2. REQ / PLAN 문서 작성.
3. `index.html`, `docs/legal/privacy.md`, `docs/growth/RELEASE_72H_GUIDE.md`, `scripts/smoke-test.js` 일괄 교체.
4. `index.html` 총 줄 수 22,196줄 검증.
5. `npm test` 245개 테스트 100% 통과 확인.
6. BACKLOG.md 47번 완료 처리 및 TICKETS.md 티켓 등록.
7. 로컬 main 병합 및 상민님 결심 요청.

---

## 6. [원칙 ⑥] 인라인 단위 테스트 (TDD 규격)
- `scripts/smoke-test.js`에 `support@ourgoal.kr` 검증 반영.
- `grep`으로 전체 코드베이스에서 `ysm0422@naver.com` 완전 박멸 확인.

---

## 7. [원칙 ⑦] 화면 간 상호연동 전파 및 껍데기 버튼 전수 연결 검증
- 랜딩 화면 및 설정 화면에서 실제로 클릭 시 동작 확인.

---

## 8. [원칙 ⑧] 본질 판정 (Essence Criteria Compliance)
- 개인정보 보호(승인선 ②)를 준수하고, 운영자 신뢰성을 강화하여 서비스의 지속 가능성을 높임.
