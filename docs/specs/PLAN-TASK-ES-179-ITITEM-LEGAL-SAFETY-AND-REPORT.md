# 작업계획서 (PLAN) — 잇템(제휴링크) 법적 안전장치 및 텔레그램/노션 원장 퀵 신고 배선

> **문서 ID**: PLAN-TASK-ES-179-ITITEM-LEGAL-SAFETY-AND-REPORT  
> **티켓 연계**: #TASK-ES-179  
> **세션 ID**: c42cdb2c  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity  
> **귀속 축**: INFRA / E3 (법적 리스크 방어, UGC 면책 인프라, 동류 소통 자산 보호)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 2회차 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)

- **REQ 핵심 요약**:
  - 상민님 지시: 표준 규격 강제보다 "추가자 주의 안내문 + 확인자 면책 경고문 및 신고 유도" 방식 채택.
  - 수신 루트: 이미 가동 중인 상민님 텔레그램 실시간 푸시(`1260106462`) 및 노션 고객 문의 원장 DB(`3dd598db...`) 3초 퀵 신고 파이프라인 연계.
  - 현재 제약: **다른 세션 작업 완료 후 상민님의 명시적 '진행' 지시에 따라 2단계(코드 구현) 본격 착수**.
- **영향받는 파일 전수 목록**:
  1. `docs/specs/REQ-TASK-ES-179-ITITEM-LEGAL-SAFETY-AND-REPORT.md` (요구사항 정의서)
  2. `docs/specs/PLAN-TASK-ES-179-ITITEM-LEGAL-SAFETY-AND-REPORT.md` (본 작업계획서)
  3. `.Codex/작업계획서/c42cdb2c.md` (세션 작업계획서)
  4. `docs/rules/TICKETS.md` (#TASK-ES-179 티켓 등록)
  5. `api/track.js` (`TYPE_LABELS` 및 텔레그램 알림 서식)
  6. `index.html` (잇템 등록 모달 제휴 체크박스 및 안내문, 카드 면책/신고 버튼, `openItemReportModal` 신고 팝업, 푸터 면책 및 공식 지원 이메일)
  7. `sw.js` (PWA 캐시 버전 무효화)
  8. `scripts/smoke-test.js` (신고 파이프라인 및 UI 단언문)

---

## 2. [원칙 ②] 본질 · 중심 배선(Wire) 식별 (Essence, Causes, Core & Anchor)

- **[본질] (Essence)**:
  - 아워골 서비스 제공자(상민님)를 표시광고법·전자상거래법·정보통신망법 위험으로부터 100% 면책하는 견고한 UGC(이용자 생성 콘텐츠) 방어망 구축.
- **[원인] (Root Causes)**:
  - 잇템 등록/조회 과정에서 외부 제휴 링크의 위험성 및 대가성 미표기 가능성에 대한 사전 안내와 신고 처리 경로의 미배선.
- **[중심] (Core Bottleneck)**:
  - 잇템 카드에서 `[🚨 신고]` 클릭 시 ➔ 대상 아이템명/링크/등록자가 자동 주입된 팝업이 뜨고 ➔ 사유 탭 후 1초 만에 상민님 텔레그램과 노션에 접수되는 무결점 엔드투엔드 와이어.
- **[핵심] (Critical Anchor)**:
  - 타 세션 작업 중단 및 코드 충돌 0% 보장 (1단계 문서화 대기).
  - 신고가 발생해도 서버리스 함수 에러 없이 텔레그램과 노션, Supabase에 무손실 도달.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget & Storage Blueprint)

### 3-1. 파일별 변경 예산 (Diff Budget - 향후 구현 시)
- `docs/specs/REQ-TASK-ES-175-ITITEM-LEGAL-SAFETY-AND-REPORT.md`: +150줄 / 0줄 (신규 생성)
- `docs/specs/PLAN-TASK-ES-175-ITITEM-LEGAL-SAFETY-AND-REPORT.md`: +120줄 / 0줄 (신규 생성)
- `.Codex/작업계획서/c42cdb2c.md`: +90줄 / 0줄 (신규 생성)
- `api/track.js`: +15줄 / 0줄 (신고 라벨 및 텔레그램 포맷)
- `index.html`: +55줄 / -10줄 (등록 모달 안내, 카드 신고 버튼, 신고 모달 배선)
- `scripts/smoke-test.js`: +20줄 / 0줄 (신고 모달 테스트)

### 3-2. 스토리지 원장화 3대 명세 의무 (헌법 제2조 제4항 준수)
1. **원격 DB 스키마 명세**:
   - 신규 DDL 없음. 기존 Supabase `inquiries` 테이블에 `inquiry_type: 'item_report'`로 적재.
2. **스마트 스토리지 분기 설계**:
   - 1계층: Supabase `inquiries` DB 영구 보존.
   - 2계층: 노션 '고객 문의 및 오류 제보 원장' DB + 상민님 텔레그램 실시간 알림.
   - 3계층: 유저 프로필 `itItems` 배열 구조 보존 (비파괴 원칙).
3. **4대 뷰 전파 배선도**:
   - 메인 4대 뷰 구조 불파괴. 잇템 카드가 렌더링되는 프로필/설정 모달 내 인라인 배선.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Critical Review & Safety)

- **타 세션 불파괴 보증**:
  - 현재 다른 세션의 코드 작업을 방해하지 않기 위해 실제 소스 파일(`index.html` 등)은 단 1바이트도 수정하지 않고, 독립된 REQ/PLAN 문서만 생성 후 대기.
- **기존 디자인/스타일 보존**:
  - `ui.css` CSS 전역 변수(`--rule`, `--card2`, `--brand-strong`, `--ink-soft`)를 그대로 사용하여 통일된 모달/버튼 룩앤필 유지.
- **코드 무결성**:
  - 무단 축약(`// ...`) 전면 배제, 생략 없는 100% 완전한 코드로 향후 배선 계획 수립.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. **Step 1 (현재 상태 - 1단계 기획·설계 완료 후 정지)**:
   - REQ / PLAN 문서 작성 및 `.Codex/작업계획서/c42cdb2c.md` 등재.
   - 상민님께 현황 보고 및 타 세션 종료 후 집행 여부 대기.
2. **Step 2 (향후 2단계 착수 시 - 백엔드 파이프라인)**:
   - `api/track.js`: `TYPE_LABELS.item_report = '잇템 불법/유해 신고'` 추가.
   - `handleInquiry` 내 텔레그램 메시지 포맷에 신고 대상 잇템 정보(이름, URL, 등록자) 템플릿 배선.
3. **Step 3 (향후 2단계 착수 시 - 프론트엔드 UI/UX)**:
   - `index.html` 잇템 추가 모달: 제휴 대가성 문구 필수 기재 안내문 삽입.
   - `index.html` 잇템 카드: 면책 문구 및 `[🚨 신고]` 버튼 배선.
   - `index.html` `openItemReportModal`: 3초 퀵 신고 모달(사유 탭 ➔ 전송) 구현 및 **악의적/허위 신고 시 계정 이용 제한 경고 안내문** 표출.
   - 가짜 샘플 통계(`MOCK_ITEM_STATS`) 정비.
4. **Step 4 (검증 및 게이트 통과)**:
   - `scripts/smoke-test.js`에 신고 모달 및 API 페이로드 검증 추가.
   - `node scripts/verify-integrity-gate.js` 및 `npm test` ALL PASS 확인.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계 (Verification Scenarios)

- **검증 A (Zero Dead-Click)**:
  - 잇템 카드의 `[🚨 신고]` 클릭 시 에러 없이 신고 모달이 정상 팝업되는가.
  - 신고 사유 라디오 버튼 탭 및 `[신고 접수]` 클릭 시 정상 피드백(접수 완료 토스트)이 뜨는가.
- **검증 B (Zero Data Loss)**:
  - 신고가 접수되어도 기존 유저의 프로필 및 잇템 데이터가 1바이트도 손상되지 않는가.
- **검증 C (Zero UX Regression)**:
  - 잇템 추가/삭제/수정 기존 기능이 100% 정상 작동하는가.
- **검증 D (Full State Propagation)**:
  - 신고 접수 즉시 Supabase `inquiries` 적재, 노션 DB 행 생성, 텔레그램 알림이 3자 동시 전파되는가.
- **검증 E (자동화 게이트 통과)**:
  - `verify-integrity-gate.js` AST 정적 방화벽 및 `npm test` 스모크 테스트 100% 통과.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (4단계 마감 상한선 준수)

- [x] [1단계: 기획·설계 상태] REQ / PLAN 문서 수립 및 타 세션 방해 방지 안전 대기 (완료)
- [ ] [2단계: 내부 시뮬레이션 상태] 타 세션 종료 후 브랜치 생성 및 코드 배선 (대기)
- [ ] [3단계: 로컬 수동 확인 상태] 브라우저에서 잇템 등록 안내 및 신고 팝업 실물 점검 (대기)
- [ ] [4단계: 로컬 메인 병합 상태] 로컬 main 병합 및 Vercel 프리뷰 배포 (대기)

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획 (Blockers & Rollback)

- **잠재 블로커**:
  - 다른 세션이 `index.html`을 수정하여 커밋할 경우 발생할 수 있는 머지 충돌.
- **대응 및 롤백**:
  - 현재 코드를 전혀 건드리지 않았으므로 충돌 위험 0%.
  - 향후 착수 시 최신 git pull 후 티켓 전용 분기 브랜치(`feat/2026-09-18-task-es-175-ititem-legal-safety`)에서 작업하여 충돌 원천 격리.
