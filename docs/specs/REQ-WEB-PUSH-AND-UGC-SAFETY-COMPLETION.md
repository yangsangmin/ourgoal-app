# 요구사항 정의서 (REQ) — Web Push 인프라 완결 & 커뮤니티 신고·차단 UGC 보호 시스템 정합성 확보

> **문서 ID**: REQ-WEB-PUSH-AND-UGC-SAFETY-COMPLETION  
> **티켓 연계**: #TASK-ES-103  
> **작성 일시**: 2026-09-15  
> **작성자**: Antigravity AI Engine  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  > "1~3번 진행하면서 아래 내용도 같이 진행해"
- **현재 발생하는 문제 및 한계**:
  - **과업 1 (Web Push 인프라, BACKLOG 14번)**:
    - 클라이언트(`index.html` L21627)가 VAPID 공개키를 요청하는 엔드포인트 `/api/vapid-public-key`가 파일 누락으로 404를 반환하여, 유저가 설정에서 알림을 켜도 서비스워커 구독이 생성되지 않고 0건으로 머무는 치명적 결함 존재.
  - **과업 2 & 3 (커뮤니티 신고·자동 숨김 및 사용자 차단, BACKLOG 24, 45번)**:
    - 프론트엔드 및 데이터 필터링(`filterHidden`, `filterBlockedPosts`), 차단 관리 모달(`openBlockedUsersModal`)이 이미 고도화되어 있으나 백로그 상에서 정식 E2E 검증 및 완료 표기가 누락되어 있음.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Root Cause & Essence)
- **근본 원인**:
  - Web Push 파이프라인의 VAPID 엔드포인트 누락으로 인한 종단간 연결 실패.
- **본질 축 (Essence Axis)**: `INFRA` & `E3` (유저 리텐션 및 클린 커뮤니티 안전망)
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 앱 설정에서 '알림 받기'를 켰을 때 VAPID 키를 즉시 수신하여 브라우저 푸시 구독이 100% 정상 등록되고, 피드에서 불쾌한 글을 신고하면 3회 누적 시 즉시 블라인드 처리되며, 악성 사용자를 차단하면 그 사람의 모든 글과 댓글이 내 화면에서 0.1초 만에 완벽히 사라진다."*

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Functional Specifications)

### 3-1. 세부 기능 요구사항 (Functional Requirements)
- **FR-01 [VAPID Public Key API 엔드포인트 구축]**:
  - `api/vapid-public-key.js` 신규 생성: `process.env.VAPID_PUBLIC_KEY`를 캐시 헤더(`Cache-Control: public, max-age=86400`)와 함께 JSON 반환.
  - VAPID 키가 미설정된 로컬 개발 환경에서도 에러 없이 안전하게 대응할 수 있도록 처리.
- **FR-02 [Web Push 구독 및 크론 디스패치 정합성]**:
  - `index.html`의 `syncPushSubscription()` ➔ `/api/vapid-public-key` ➔ `pushManager.subscribe()` ➔ `/api/push-subscribe` 파이프라인 무결성 확보.
- **FR-03 [커뮤니티 신고 및 자동 숨김 E2E 검증]**:
  - 피드 게시물 및 댓글의 `[신고]` 액션 작동, 서버/로컬 이중 기록, 3회 누적 시 즉시 `hidden=true`로 전환되어 목록에서 숨김 처리됨을 검증.
- **FR-04 [사용자 차단 및 차단 목록 관리 E2E 검증]**:
  - `[차단]` 버튼 클릭 시 확인 모달 ➔ `blockedUsers` 저장 ➔ 피드 및 댓글 즉시 필터링 ➔ 설정 탭 [차단한 사용자 관리]에서 목록 조회 및 [차단 해제] 검증.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)
| UI 요소 | 화면 | 사용자 액션 | 기대 동작 |
| :--- | :--- | :--- | :--- |
| `[신고]` 버튼 | 피드 카드 | 클릭 | 확인 팝업 후 신고 접수, 3회 누적 시 즉시 숨김 토스트 |
| `[차단]` 버튼 | 피드 카드 | 클릭 | 확인 팝업 후 `blockUser()`, 내 피드에서 글 즉각 사라짐 |
| `manageBlockedBtn` | 설정 화면 | 클릭 | `openBlockedUsersModal()` 차단 목록 팝업 오픈 |
| `[차단 해제]` 버튼 | 차단 모달 | 클릭 | `unblockUser()` 즉시 해제 및 피드 복원 |

### 3-3. 유저 데이터 100% 무손실 보존 규격
- 헌법 제18조 `index.html` 총 줄 수 22,196줄 정확히 보존.
- 기존 유저 설정 및 목표 데이터 100% 불변.

---

## 4. [원칙 ④] 1~3 재검토 및 보완
- VAPID 키 부재 시 환경 대응: API 핸들러에서 500 에러를 정중하게 반환하고 클라이언트는 warn 로그를 남기며 크래시 없이 유지.

---

## 5. [원칙 ⑤] 해결 절차 정리
1. 브랜치 `feat/web-push-and-ugc-safety-completion` 생성.
2. `api/vapid-public-key.js` 구현.
3. `scripts/smoke-test.js`에 Web Push API 핸들러 및 UGC 신고/차단 무결성 단위 테스트 추가.
4. `npm test` 247개 전수 통과 확인.
5. BACKLOG.md 14, 24, 45번 항목 완료 갱신 및 TICKETS.md 티켓 등록.
6. 로컬 main 병합.
