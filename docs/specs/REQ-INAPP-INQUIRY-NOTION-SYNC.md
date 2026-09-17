# 요구사항 정의서 (REQ) — 아워골 인앱 1:1 고객 문의·오류 제보 접수 시스템 완결 및 노션 DB·텔레그램 실시간 자동 연동

> **문서 ID**: REQ-INAPP-INQUIRY-NOTION-SYNC  
> **티켓 연계**: #TASK-ES-123  
> **작성 일시**: 2026-09-16  
> **작성자**: Antigravity AI Engine  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수  

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**: *"그래 그렇게하고 노션에도 아워골 하위에 페이지 하나 생성하고 db만들어서 문의가 자동으로 db화 되도록 구축해. 메일은 내가 생성하고 알려줄게"*
- **현재 발생하는 문제 및 한계**:
  1. 현재 아워골 설정 탭의 [1:1 문의 및 오류 제보] 버튼(`feedbackInquiryBtn`) 클릭 시 열리는 모달(`openCustomerInquiryModal`)은 접수 버튼을 눌러도 서버 전송이나 저장 없이 로컬 토스트(`toast('문의가 성공적으로 접수되었습니다. 검토 후 이메일로 답변드리겠습니다.')`)만 띄우고 닫히는 **껍데기 UI(Fake/Shell UI)** 상태임 (헌법 제3조, 제7조 위반 상태).
  2. 사용자가 기재한 소중한 문의/버그 제보 데이터가 단 1바이트도 저장되지 않고 공중으로 증발함.
  3. 관리자(상민님)는 유저가 어떤 문의를 남겼는지 확인할 방법이 전무함.
- **사용자 상황 및 페르소나**:
  - 목표를 관리하거나 기능을 사용하다가 버그를 발견하거나 제안사항이 생긴 실 사용자.
  - 외부 메일 앱을 켤 필요 없이 앱 내에서 바로 문의를 접수하고, 운영팀이 신속히 인지하여 답변해 줄 것을 기대함.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Root Cause & Essence)
- **근본 원인**:
  - 초기 프로토타입 단계에서 UI 마크업만 작성되고 백엔드 API, DB 테이블, 관리자 알림 배선이 연결되지 않은 채 방치됨.
- **본질 축 (Essence Axis)**: `INFRA` & `UX` (고객 지원 인프라 및 소통 경험 완결)
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 앱 설정에서 [1:1 문의 및 오류 제보]를 눌러 문의를 접수하면, 즉시 로딩 후 접수 완료 토스트가 뜨고, 데이터는 Supabase DB와 노션 전용 DB에 완벽히 동기화되며, 상민님의 스마트폰 텔레그램으로 실시간 알림이 도착하여 단 한 건의 유저 피드백도 놓치지 않는다."*
- **기존 전체 기능 영향도 분석**:
  - 기존 설정 탭, 홈/목표/소통 기능: 영향 없음.
  - 기존 mailto 링크: 푸터의 `문의 support@ourgoal.kr` 텍스트 링크는 법적/외부용으로 유지.
  - [1:1 문의 및 오류 제보] 버튼: 인앱 팝업 모달을 통해 완전한 전송 루프로 연결.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Functional Specifications)

### 3-1. 세부 기능 요구사항 (Functional Requirements)
- **FR-01 [노션 아워골 하위 '고객 문의 및 제보 관리' 페이지 및 DB 신설]**:
  - 아워골 마스터 페이지(`3d4598db-9096-815f-8653-d99eb9ea5703`) 하위에 새 페이지 및 DB 생성.
  - DB 컬럼 규격:
    - `제목 (Title)`: `[유형] 문의 요약 / 사용자 닉네임`
    - `유형 (Select)`: 버그/오류 제보(`bug`), 새로운 기능 제안(`feature`), 계정/보안 관련(`account`), 기타 문의사항(`other`)
    - `회신 이메일 (Email)`: 유저 입력 답변용 이메일
    - `사용자 닉네임 (Text)`: 제출 당시 로그인/프로필 닉네임
    - `사용자 ID (Text)`: Supabase user id
    - `문의 내용 (Text)`: 상세 본문
    - `상태 (Status / Select)`: 접수됨(`접수`), 확인중(`확인중`), 답변완료(`답변완료`), 보류(`보류`)
    - `접수일시 (Date)`: ISO 8601 접수 시각
    - `기기/앱정보 (Text)`: User-Agent 및 앱 버전
- **FR-02 [Supabase `inquiries` 테이블 DDL 및 백엔드 엔드포인트 `/api/inquiry`]**:
  - Supabase 테이블 생성 DDL:
    - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    - `created_at TIMESTAMPTZ DEFAULT now()`
    - `user_id TEXT`
    - `user_nickname TEXT`
    - `inquiry_type TEXT NOT NULL`
    - `reply_email TEXT`
    - `content TEXT NOT NULL`
    - `user_agent TEXT`
    - `app_version TEXT`
    - `status TEXT DEFAULT 'pending'`
    - `notion_page_id TEXT`
  - Vercel 서버리스 API `/api/inquiry.js`:
    - `POST /api/inquiry`: 본문 유효성 검사 (`content`, `inquiry_type`)
    - 1순위: Supabase `inquiries` 테이블에 Insert (서비스 롤 키 또는 Anon 키 RLS)
    - 2순위: 노션 '고객 문의 및 제보 관리' DB에 페이지 생성 (Notion REST API)
    - 3순위: 상민님 텔레그램(Chat ID `1260106462`)으로 긴급 알림 발송 (`[아워골 고객 문의 접수]` 메시지)
    - 실패 격리: 노션이나 텔레그램 발송이 실패하더라도 Supabase 저장이 성공하면 유저에게는 200 성공 응답 반환.
- **FR-03 [아워골 프론트엔드 4위 1체 배선 완결]**:
  - 마크업: 모달 내 필드(유형, 회신이메일, 내용, 취소/접수 버튼, 로딩 인디케이터).
  - 리스너: `#inquirySubmit` 클릭 이벤트.
  - 핸들러: 입력값 검증 -> 접수 중 버튼 비활성화 및 텍스트 변경("접수 중...") -> `fetch('/api/inquiry', ...)` 호출.
  - 피드백: 성공 시 `toast('문의가 성공적으로 접수되었습니다. 신속히 검토하겠습니다.')` + 모달 닫기 + 입력폼 초기화. 실패 시 버튼 복원 + 에러 안내 토스트.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 (ID / Name) | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 사용자 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `feedbackInquiryBtn` | 설정 탭 고객지원 | 클릭 | `openCustomerInquiryModal()` 호출하여 인앱 모달 열림 | 메일 앱 강제 호출 차단, 모달 정상 표출 |
| `inquiryType` | 문의 모달 | 옵션 선택 | 버그/제안/계정/기타 중 선택값 유지 | 기본값: `bug` (버그 / 오류 제보) |
| `inquiryEmail` | 문의 모달 | 텍스트 입력 | 회신받을 이메일 입력 (현재 로그인 이메일 기본 채움) | 미입력 시 익명/연락불가 접수 허용 또는 안내 |
| `inquiryContent` | 문의 모달 | 텍스트 입력 | 문의 상세 내용 기재 | 빈 내용 제출 시 `toast('문의 내용을 입력해주세요')` 차단 |
| `inquirySubmit` | 문의 모달 | 클릭 | `/api/inquiry` 비동기 POST 전송, 노션/DB/텔레그램 동시 전파 | 전송 중 버튼 비활성화, 성공 시 모달 닫힘 및 감사 토스트 |
| `inquiryCancel` | 문의 모달 | 클릭 | 모달 닫기 | 입력 중단 후 안전 복귀 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss Schema)
- 기존 `state.profile`, `state.goals`, `state.records` 등 유저 실천 데이터는 단 1바이트도 수정하지 않음.
- 신규 독립 엔터티 `inquiries` 생성으로 기존 테이블 간섭 0건.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **오프라인/네트워크 단절 시**:
  - 네트워크 단절 시 `fetch` 실패 예외 처리하여 유저에게 "네트워크 연결을 확인해주세요" 토스트 표출 및 작성한 본문 유지.
- **스팸/도배 방지**:
  - 클라이언트 레벨 5초 디바운스 및 서버 레벨 최소 글자 수(5자 이상) 검증.
- **헌법 제18조 `index.html` 줄 수 보존**:
  - `index.html` 총 줄 수 유지 규칙을 엄수하며 모달 핸들러 내 로직 배선.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
1. 노션 아워골 마스터 페이지 하위 '고객 문의 및 제보 관리' 페이지 및 데이터베이스 신설.
2. `api/inquiry.js` 서버리스 엔드포인트 구현 (Supabase + Notion + Telegram 3중 연동).
3. `docs/sql/2026-09-16-inquiries.sql` DDL 스크립트 작성.
4. `index.html` 내 `openCustomerInquiryModal` 비즈니스 로직 4위 1체 배선.
5. `scripts/smoke-test.js`에 문의 접수 API 및 모달 무결성 테스트 작성.
6. 로컬 시뮬레이션 및 단위 검증 통과 후 로컬 `main` 병합.

---

## 6. [원칙 ⑥] 인라인 단위 테스트 (TDD 규격)
- `scripts/smoke-test.js`:
  - `POST /api/inquiry` 핸들러 유효성 및 필수 필드 검증 테스트.
  - `index.html` 내 껍데기 토스트 제거 및 `fetch('/api/inquiry')` 배선 검증 단언문.

---

## 7. [원칙 ⑦] 화면 간 상호연동 전파 및 껍데기 버튼 전수 연결 검증
- 설정 화면에서 1:1 문의 버튼 클릭 ➔ 모달 입력 ➔ 접수 ➔ Supabase 적재 ➔ 노션 DB 행 생성 ➔ 텔레그램 알림 수신까지 전 구간 E2E 배선 확인.

---

## 8. [원칙 ⑧] 본질 판정 (Essence Criteria Compliance)
- 껍데기 UI를 근절하고 유저 피드백을 실시간으로 관리자에게 직통 연결하여 서비스의 지속성과 신뢰도를 근본적으로 강화함.
