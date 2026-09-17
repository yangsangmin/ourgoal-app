---
notion_id: "3dc598db-9096-81ef-8ee0-cf8c1c126795"
---

# 실행 계획서 (PLAN) — 아워골 생각 메모장 9대 대기 과제([61]~[69]) 전수 구현 및 6대 탭 활용법 모달 최신화

> **문서 ID**: PLAN-TASK-ES-180-NOTEPAD-BATCH-AND-GUIDE-RENEWAL  
> **티켓 연계**: #TASK-ES-180  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity  
> **귀속 축**: E1 / E2 / E3 / INFRA  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 2회차 엄수)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- 타깃 10대 과제:
  1. [61] 피드 내 AI 봇 1개 축소 & 20명 초과 시 제거 (`renderCommFeed`)
  2. [62] 기기 바탕화면용 위젯 기능 3종(일정·목표·기록) × 3구성 개발 (`widget.html`, `manifest.json`, 설정창 미리보기)
  3. [63] 피드 게시 시 실천기록 최신순 자동적용 & 기록 맞춤형 AI피드백/다짐 연동 (`openShareToFeedModal`)
  4. [64] 기존 'AI 추천 목표템플릿 60선' 창 영구 제거 및 템플릿백과사전 일원화 잔여 정리 (`index.html`, `team-invite-comm.js`)
  5. [65] 일정 편집 내 사전 알림 설정(울릴 시간 N분 전 지정) (`openCalendarManualEditModal`)
  6. [66] 평가해주기 창 밑에 '언제 얼마든지 평가해주실 수 있습니다' 문구 추가 (`#appEvaluationModal`)
  7. [67] DM 전송 상태·읽음 확인(카카오톡 방식 노란색 1 / 읽음) 및 전송·수신 시각 상세 표시 (`renderCommDM`, `renderManitoDm`)
  8. [68] 팀 만들기 불필요 제약(정원, 인증주기, 챌린지기간, 인증규칙, 진행방식) 전면 점검 및 삭제 (`openCreateGroupModal`)
  9. [69] 카카오 로그인 일원화 동명이인 가입/중복 닉네임 방지 태그 부여 (`loadProfile`, `ensureUserRow`)
  10. [추가 과제] 6대 탭(아바타·홈·목표·일정·기록·소통) '이 페이지 활용법 & 우수사례' 모달 최신 업데이트 전면 동기화 (`TAB_GUIDE_DATA`)

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질**:
  - 실제 유저 중심의 깔끔하고 직관적인 서비스 경험 완성 및 아워골의 최신 진화 기능들을 가이드에 100% 투영.
- **중심 & 핵심**:
  - 각 변경 사항이 기존 영속성 데이터 모델과 충돌 없이 완벽히 하위 호환되며, 4위 1체 배선으로 단 1개의 데드클릭도 남기지 않는 것.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

### 3-1. 파일별 상세 작업 분장
1. `index.html`:
   - [61] `renderCommFeed`: `realCount > 20` 분기 처리, AI 노출 1개 제한 및 최하단 배치.
   - [63] `openShareToFeedModal`: `userRecords[0]` 프리셀렉트 및 `recSelect.change` 시 다짐과 AI피드백 실시간 동기화.
   - [64] 잔존 아코디언 호출부 완전 비우기.
   - [65] `openCalendarManualEditModal`: 사전 알림 토글 + N분 전 선택 셀렉트박스 추가 및 영속화.
   - [66] `#appEvaluationModal`: 제출 버튼 밑 '언제 얼마든지 평가해주실 수 있습니다' 문구 추가.
   - [68] `openCreateGroupModal`: 5대 제약 입력란 제거, 심플 자유 생성 폼으로 간소화.
   - [69] `ensureUserRow` / `loadProfile`: 닉네임 중복 시 디스코드형 `#XXXX` 고유 식별자 자동 부여.
   - [추가] `TAB_GUIDE_DATA`: 6대 탭 최신 피처 및 우수사례 전면 갱신.
   - [62] 설정창 내 위젯 바로가기/설정 안내 모달 (`openWidgetSettingsModal`) 배선.
2. `js/team-invite-comm.js`:
   - [67] `renderCommDM` / `renderManitoDm`: 카카오톡 방식 메시지 행(Row) 구성 (노란색 1 카운트다운/제거, 전송/수신 시각 포맷팅).
   - [64] `renderTemplatesAccordionHtml` 잔여 정리 및 템플릿백과사전 링크 일원화.
3. `widget.html` [NEW]:
   - [62] 독립 PWA 위젯 뷰어:
     - 쿼리 파라미터 `type` (calendar, goals, records) & `size` (compact, standard, detail)
     - 로컬 스토리지 실시간 연동, 깔끔한 카드 UI 및 앱 원터치 실행 링크.
4. `manifest.json`:
   - [62] PWA `shortcuts` 3종 (일정, 목표, 기록) 등록.
5. `scripts/smoke-test.js`:
   - 10대 과제 검증 단언문 추가 (스모크 테스트 확장).

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Review & Safety)

- **목표**: 10대 과제 전수 무결성 구현 및 3자 동기화 100% 완료.
- **방침**: 최고 헌법 15개 조문 및 Tri-Sync 절대 준수.
- **기준**: 테스트 100% 통과, CDP 스크린샷 검증, 4단계 로컬 메인 병합 및 5A 프리뷰 배포.

---

## 5. [원칙 ⑤] 정답 · 최선의 방안 탐색 (Optimal Solution Architecture)

- **위젯 아키텍처**:
  - 외부 번들러 없이 가벼운 단일 HTML(`widget.html`)로 구현하여 모바일 브라우저나 PWA 바로가기 추가 시 0.1초 내 로딩.
  - 반응형 디자인 및 다크/라이트 테마 자동 동기화.
- **카카오톡 방식 DM**:
  - 기존 `_thread` 구조를 보존하면서 `renderDmMessageItem` 헬퍼로 깔끔하게 모듈화.
  - 내 메시지는 우측 정렬 + 좌측에 `1`과 시간, 상대 메시지는 좌측 정렬 + 우측에 시간.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계 (Re-Verification)

- **Step 1**: `manifest.json` 및 `widget.html` 생성 (위젯 3종 × 3구성 완성).
- **Step 2**: `index.html` 내 [61], [63], [64], [65], [66], [68], [69], [추가 과제] 구현.
- **Step 3**: `js/team-invite-comm.js` 내 [67] DM 카톡 방식 시각/읽음 확인 구현.
- **Step 4**: `scripts/smoke-test.js` 검증 케이스 추가 및 `npm test`, `verify-integrity-gate.js` 검증.
- **Step 5**: 실물 브라우저 CDP 검증 (위젯, 모달, 피드, DM).
- **Step 6**: 로컬 main 병합 및 5A 프리뷰 배포 (`gh pr create`).
- **Step 7**: 노션 생각 메모장 DB [61]~[69] 완료 갱신, 옵시디언 노트 및 저널 동기화, `tri-sync.js check`.
- **Step 8**: 상민님께 프로덕션 배포 여부 결심 요청.

---

## 7. [원칙 ⑦] 위험 최소화 · 예외 상황 대응 (Risk Management & Fallbacks)

- **호환성**: 팀 그룹 객체에서 제거된 필드들은 fallback 기본값을 제공하여 기존 화면 렌더링에 일체의 영향을 주지 않음.
- **알림 권한**: 일정 사전 알림 시 브라우저 Notification 권한이 차단된 경우에도 인앱 알림센터와 토스트로 안전하게 폴백.

---

## 8. [원칙 ⑧] 지속적 검증 · 피드백 수렴 · 반영 (Continuous Verification & Integrity Gates)

- 자동화 테스트: `npm test` (317개+ 신규 테스트).
- 정적 방화벽: `node scripts/verify-integrity-gate.js`.
- Tri-Sync 무결성: `node C:/dev/command-center/lib/tri-sync.js check`.
