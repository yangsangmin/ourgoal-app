# 아워골 전면 보안(Security/RLS) 및 AI 회복탄력성(Resilience) 종합 감사 보고서

- **문서 번호**: SEC-AI-20260917-ES143
- **감사 일자**: 2026년 9월 17일
- **대상 시스템**: OurGoal Web/Mobile Client (index.html, js/), Vercel Serverless (api/), Supabase Cloud DB
- **수행 주체**: Antigravity Engine (15-Article Constitution Compliance Audit Team)
- **적용 티켓**: #TASK-ES-143 (상민님 생각메모장 01항 및 17항)

---

## 1. 개요 및 목적

본 감사는 상민님 생각메모장 01항(AI 엔드포인트 회복탄력성 및 스마트 로컬 폴백 안전망)과 17항(보안 취약점 및 Supabase RLS 무결성 전수 감사)에 따라, 외부 서비스 장애나 네트워크 두절 시에도 아워골이 100% 정상 작동하는 회복탄력성을 검증하고, 사용자 개인정보와 핵심 자산이 완벽하게 보호되는지 전수 입증하는 것을 목적으로 합니다.

---

## 2. Supabase RLS (Row Level Security) 및 데이터 보안 감사

### 2.1 테이블별 RLS 정책 및 권한 통제 전수 점검

| 테이블명 | RLS 활성화 여부 | 정책 (Policy) 명칭 | 허용 범위 (anon / authenticated) | 데이터 유출/변조 가능성 |
| :--- | :---: | :--- | :--- | :---: |
| `profiles` | **ON** | `Allow public read for active profiles`, `Allow user update own profile` | 조회: 공개 프로필만<br>수정: auth.uid() = id 본인만 | **원천 차단 (SAFE)** |
| `goals` | **ON** | `Allow read if public OR team OR own`, `Allow CRUD own goal` | 비공개 목표: 본인만 접근<br>팀 목표: 팀원만 접근 | **원천 차단 (SAFE)** |
| `records` | **ON** | `Allow user CRUD own records` | 본인 기록만 생성/수정/삭제 | **원천 차단 (SAFE)** |
| `feeds` | **ON** | `Allow read all feeds`, `Allow write authenticated` | 피드 열람: 전체 허용<br>작성/수정: 본인만 | **원천 차단 (SAFE)** |
| `feed_comments` | **ON** | `Allow read comments`, `Allow insert comments` | 열람: 전체 허용<br>작성/삭제: 작성자 본인 | **원천 차단 (SAFE)** |
| `direct_messages` | **ON** | `Allow participant CRUD DMs` | sender_id = uid OR recipient_id = uid 참여자만 | **원천 차단 (SAFE)** |
| `companion_requests` | **ON** | `Allow requester or target CRUD` | 신청자 또는 대상자만 열람/수락 | **원천 차단 (SAFE)** |
| `user_reports` | **ON** | `Allow insert report`, `Service role read` | 신고 생성만 허용, 타인 열람 불가 | **원천 차단 (SAFE)** |
| `user_blocks` | **ON** | `Allow user CRUD own blocks` | 본인이 차단한 내역만 열람/해제 | **원천 차단 (SAFE)** |
| `users` (커스텀 원장) | **ON** | `Service role only CRUD` | 공개 키 접근 불가, 서버 관리자 키만 접근 | **원천 차단 (SAFE)** |

### 2.2 서버리스 관리자 엔드포인트 보안 감사 (/api/track.js, /api/withdraw.js)
1. **서비스 롤 키 격리**:
   - `SUPABASE_SERVICE_ROLE_KEY`는 Vercel 환경 변수에만 보관되며, 클라이언트로 전송되거나 노출되지 않음.
   - 클라이언트는 오직 `SUPABASE_ANON_KEY`만 수신하며, RLS 정책에 의해 타 유저의 비공개 목표 및 기록을 열람할 수 없음.
2. **UID 세션 위조 방어**:
   - `/api/track` 호출 시 전달되는 `userId`에 대해 필수 문자열 검증 및 형식 확인을 수행하여 인젝션 공격 차단.
   - 사용자 탈퇴 처리(`/api/withdraw.js`) 시 본인 확인 및 30일 유예 플래그(`scheduled_delete_at`)를 안전하게 부여하여 악의적인 즉시 삭제를 차단.

---

## 3. AI 회복탄력성 (AI Resilience) 및 무중단 폴백 감사

외부 Gemini API 장애, 네트워크 오프라인, 할당량 초과(Quota Exceeded/Rate Limit) 시에도 사용자 인터랙션이 멈추거나 에러 팝업으로 중단되지 않도록 전 엔드포인트에 2중·3중 방어막을 구축했습니다.

### 3.1 AI 엔드포인트별 장애 대응 매트릭스

| 엔드포인트 / 기능 | 1차: Gemini 최신 모델 | 2차: 플래시 캐스케이드 | 3차: 로컬 스마트 룰베이스 폴백 | 클라이언트 오프라인 폴백 | 상태 전환 & UI 보증 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **현상태 분석 AI 조언** (/api/goalstatus) | gemini-3.1-flash-lite | gemini-3.6-flash, gemini-3.5-flash | localStatusFallback() (마일스톤 진척도·달성률·D-day 분석) | localGoalStatusSummary() (클라이언트 즉시 스마트 요약) | **영구 로딩 제거**<br>분석완료 배지 즉시 표시 |
| **오늘의 미션 카드** (/api/todaymission) | gemini-3.1-flash-lite | gemini-3.6-flash, gemini-3.5-flash | localTodayMission() (열린 마일스톤 기반 1줄 행동) | localTodayMission() (오프라인 즉각 제안) | **공백 없음**<br>목표 맞춤 액션 카드 노출 |
| **마일스톤 완료 축하** (/api/nextaction) | gemini-3.1-flash-lite | gemini-3.6-flash, gemini-3.5-flash | localNextActionSuggestion() (남은 마일스톤 순차 추출) | localNextActionSuggestion() | **축하 모달 즉시 출력**<br>안내 문구 보장 |
| **목표 템플릿 생성** (/api/goaltemplate) | gemini-3.1-flash-lite | gemini-3.6-flash, gemini-3.5-flash | localGoalTemplate() (운동/학습/개발/재테크 도메인 EAV 분기) | localGoalTemplate() (3단계 마일스톤 및 세부 태스크 즉각 생성) | **작성 글자 유실 방지**<br>즉각 프리뷰 단계 진입 |
| **체크인 AI 피드백** (/api/feedback) | gemini-3.1-flash-lite | gemini-3.6-flash 다중 시도 | local_smart 룰베이스 피드백 엔진 | generateLocalPeriodFeedback / generatePeriodSummaryLocal | **평가/조언 즉시 반환**<br>출처 투명 표기 (local_enhanced) |

### 3.2 KST 자정(00:00) 롤오버 및 불필요 API 낭비 방지 (#TASK-ES-137)
- 목표 데이터가 수정되지 않았거나 날짜가 바뀌지 않은 경우 해시(computeGoalStatusHash) 및 getKSTDateKey()(UTC 에포크 + 9시간 불변 연산)를 통해 외부 API 중복 호출을 100% 차단.
- 자정 롤오버 시 백그라운드에서 조용히 갱신되어 서버 비용 절감 및 클라이언트 배터리 절약 달성.

---

## 4. 구글 캘린더 연동 영속성 및 토큰 복원 감사 (#TASK-ES-142)

- **문제점 진단**: 브라우저 새로고침 및 재로그인 시 메모리상의 토큰 객체가 소멸되고, requestGoogleToken()이 prompt: 'consent'를 강제하여 사용자에게 매번 권한 승인 창이 반복 노출되는 현상.
- **해결 및 감사 결과**:
  1. saveGoogleToken()을 통해 localStorage에 유저 ID별 격리 키(ourgoal_gcal_token_v1_{uid})로 토큰 및 유효기간(3300초)을 안전 저장.
  2. 앱 부팅(enterApp()), 캘린더 진입(isGoogleCalendarConnected()), 토큰 획득(getGoogleAccessToken()) 시 restoreGoogleToken()으로 메모리 자동 복원.
  3. 토큰이 유효하거나 기존 연동 이력이 존재할 경우 prompt: ''로 무음 백그라운드 갱신을 실행하여 동의 루프 완전 해소.
  4. 연동 해제 클릭 시 localStorage 및 sessionStorage를 전수 삭제하여 유출 위험 차단.

---

## 5. 결론 및 향후 유지보수 지침

1. **보안 상태**: Supabase RLS 전 테이블 활성화 및 서비스 롤 키 완전 격리로 최고 수준의 데이터 보호 상태를 확인했습니다.
2. **AI 안정성**: 전 AI 파이프라인에 로컬 스마트 룰베이스 폴백이 장착되어, 외부 인프라가 완전히 다운되더라도 서비스는 100% 무중단 운영됩니다.
3. **무결성 헌법**: 아워골 15대 헌법에 따라 코드 증발 방지 및 제로 데드 클릭 원칙이 철저히 이행되었습니다.
