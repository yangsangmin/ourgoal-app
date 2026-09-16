# 작업계획서: 아워골 피드·모임·템플릿 외부 SNS 공유 및 미사용자 전파 시스템화 (통합 딥링크 & 동적 OG 게이트웨이)

- 문서 ID: PLAN-VIRAL-SHARING-GATEWAY
- 티켓 ID: #TASK-ES-121
- 기준 문서: docs/specs/REQ-VIRAL-SHARING-GATEWAY.md
- 작성일: 2026-09-16

---

## 1. 중심 배선 (Core Wire) 식별
1. **서버리스 동적 OG 엔드포인트**: `api/share.js` (신설)
   - `GET /api/share?type=(feed|template|group|goal)&id=(ID)&extra=(JSON)`
   - 봇/크롤러: 동적 HTML OG 메타태그 출력
   - 사용자 브라우저: `/?(type)=(id)`로 즉각 리다이렉트
2. **클라이언트 딥링크 라우터**: `index.html` 내 `handleDeepLinkRouting()`
   - URL의 `feed`, `invite_group`, `join_team`, `template`, `goal` 감지
   - 비회원도 볼 수 있는 '게스트 소프트 뷰어 모달' 즉시 렌더링
3. **공통 공유 헬퍼**: `index.html` 내 `shareContent({ type, id, title, text, image })`
   - Web Share API 및 클립보드 복사 자동 처리
4. **UI 4위 1체 배선**:
   - 피드 카드: [공유] 버튼 추가 및 `shareContent({ type:'feed', id: it.id, ... })` 연결
   - 템플릿 모달: [🔗 템플릿 공유] 버튼 추가 및 `shareContent({ type:'template', id: t.id, ... })` 연결
   - 팀 초대: `team-invite-comm.js`의 `join_team` 링크 수신 통합 및 도메인 정규화

---

## 2. 파일별 Before / After 및 변경 예산
1. **`api/share.js` [NEW]** (약 120줄)
   - Vercel Serverless Function: 요청 타입별 OG 메타태그(HTML) 응답 및 브라우저 클라이언트 리다이렉트
2. **`index.html` [MODIFY]** (약 180줄 추가)
   - `shareContent()` 공통 함수 정의
   - 피드 아이템 렌더링에 [공유] 버튼 마크업 및 클릭 이벤트 바인딩
   - 템플릿 모달에 [공유] 버튼 마크업 및 바인딩
   - `checkAndHandlePeerInviteUrl()`을 확장하여 `handleDeepLinkRouting()`으로 통합 (feed, join_team, template, goal 지원)
   - `showFeedGuestViewerModal()`, `showTemplateGuestViewerModal()`, `showGoalCertGuestViewerModal()` 구현
3. **`js/team-invite-comm.js` [MODIFY]** (약 20줄 수정)
   - `shareCardExternal()` 도메인 하드코딩(`https://ourgoal.kr`)을 `window.location.origin`으로 통일
   - 템플릿 둘러보기 모달(`openTemplatePreviewModal`)에 [🔗 공유하기] 버튼 배선

---

## 3. 구현 상세 순서
1) `api/share.js` 신설 및 템플릿/피드/모임/완주 OG 태그 생성기 작성
2) `index.html`에 `shareContent()` 헬퍼 구현 및 도메인 일원화
3) `index.html`의 개별 피드 카드([feed-item])에 [공유] 버튼 마크업 및 핸들러 배선
4) `js/team-invite-comm.js` 템플릿 모달 및 `index.html` 템플릿 모달에 [공유] 버튼 마크업 및 핸들러 배선
5) `index.html`에 통합 딥링크 게이트웨이 `handleDeepLinkRouting()` 구현 및 부트스트랩 IIFE에 연결
6) 비회원 전용 소프트 뷰어 모달(피드 뷰어, 템플릿 뷰어, 완주 축하 뷰어) 구현 (Zero-Install 온보딩 연계)
7) 단위/스모크/무결성 테스트 통과 (npm test 249개+ 100% PASS)
8) 로컬 수동 확인 (브라우저 E2E 검증) 및 4단계 로컬 메인 병합

---

## 4. 5대 무결성 검증 시나리오
- **제1검증 (전수 클릭)**: 피드 공유, 템플릿 공유, 모임 초대, 닫기 버튼 전수 클릭 시 JS 오류 0건
- **제2검증 (전 UX 무결성)**: 기존 로그인/게스트 세션 및 3대 루프(E1/E2/E3) 손상 없음
- **제3검증 (유저 데이터 보존)**: 10종 페르소나 데이터 무손실 검증 (`verify-integrity-gate.js`) 통과
- **제4검증 (화면 전파)**: 딥링크 진입 후 목표 생성/수락 시 홈 및 소통 화면에 실시간 반영
- **제5검증 (자동화 테스트)**: `npm test` 249개 이상 100% PASS

---

## 5. 체크리스트 (상한선: 4단계 로컬 메인 병합 및 5A 프리뷰 배포)
- [ ] 1. Vercel 서버리스 동적 OG 엔드포인트 `api/share.js` 신설 · 예상 7분 · 크롤러용 HTML 메타태그 생성 확인
- [ ] 2. 클라이언트 공통 공유 엔진 `shareContent` 및 도메인 단일화 구현 · 예상 5분 · Web Share/클립보드 동작 확인
- [ ] 3. 피드 카드 [공유] 버튼 4위 1체 배선 및 피드 게스트 뷰어 구현 · 예상 7분 · 비회원 열람 및 응원 CTA 확인
- [ ] 4. 템플릿(60선/마켓) [공유] 버튼 배선 및 템플릿 게스트 뷰어 구현 · 예상 7분 · 비회원 둘러보기 및 담기 확인
- [ ] 5. 모임 초대 `join_team` 라우팅 복구 및 통합 딥링크 게이트웨이 완성 · 예상 5분 · 결함 배선 복구 확인
- [ ] 6. 5대 무결성 검증 통과 (npm test 249개+, verify-integrity-gate.js 100% PASS) · 예상 5분 · 회귀 0건 확인
- [ ] 7. [3단계: 로컬 수동 확인] 브라우저 헤드리스/수동 클릭 전수 검증 · 예상 5분 · 콘솔 에러 0건 확인
- [ ] 8. [4단계: 로컬 메인 병합 및 5A 프리뷰 배포] 로컬 main 병합 및 프리뷰 URL 제출 후 대기 · 예상 5분 · 배포 대기 확인

## 6. 블로커 대책 (8원칙 ⑧)
- 템플릿 60선의 메타데이터는 서버리스 함수에서도 동일하게 참조해야 함 -> `api/share.js` 내부에 60선 템플릿 매핑 테이블을 경량 탑재하여 DB 쿼리 실패 시에도 완벽한 OG 태그를 반환하도록 스마트 폴백 설계.