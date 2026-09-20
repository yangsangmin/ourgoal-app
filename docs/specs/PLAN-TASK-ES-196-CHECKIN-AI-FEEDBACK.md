# 작업계획서 (PLAN) — 체크인 즉시 아바타 AI 피드백 고도화 & 영구 원장 영속화 및 기록 탭 상시 노출

> **문서 ID**: PLAN-TASK-ES-196-CHECKIN-AI-FEEDBACK  
> **티켓 연계**: #TASK-ES-196  
> **작성 일시**: 2026-09-20  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)
- **핵심 목표**: 체크인 시 AI 피드백 파이프라인의 종단간(E2E) 완전 배선: [체크인 저장] ➔ [아바타 즉시 리액션 & 로딩] ➔ [AI 응답 수신] ➔ [영구 원장 저장 (`newRec.feedback` & `saveProfile`)] ➔ [아바타 AI 피드백 시트 표출] ➔ [1클릭 액션 연계] ➔ [기록 탭 상시 렌더링].
- **영향받는 파일 전수 목록**:
  1. `index.html`: `captureSave` 이벤트 핸들러, `showCheckinFeedbackSheet`, `buildRecordCardHtml`
  2. `ui.css`: 아바타 피드백 바텀시트, 말풍선, 판정 뱃지, 기록 탭 AI 피드백 영역
  3. `sw.js`: PWA 캐시 버전 갱신 (`CACHE_NAME = 'ourgoal-cache-20260920-es196'`)
  4. `scripts/smoke-test.js`: [검증 20] 체크인 AI 피드백 및 기록 탭 상시 노출 무결성 테스트
  5. `scripts/verify-integrity-gate.js`: 무결성 게이트 검증 20 배선

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 및 배선(Wire) 식별 (End-to-End Data Wiring)
- **[본질]**: 체크인 시 단순 텍스트 저장이 아닌 아바타 AI 코칭을 통한 즉각적인 실천 효능감과 피드백 루프 완성.
- **[원인]**: `newRec.feedback` 할당 누락, 폼 하단 은폐로 인한 미체감, 기록 탭 렌더링 코드 부재.
- **[중심]**: `showCheckinFeedbackSheet` 아바타 시트 배선 및 `newRec.feedback = fb; await saveProfile();` 영구 보존.
- **[핵심]**: 오프라인/API 지연 대비 스마트 폴백 완비 및 1클릭 내일 퀘스트 등록 배선.

```
[사용자 3초 체크인 입력]
         │
         ▼
[기록 완료 ✨ 버튼 클릭] ──▶ 즉시 낙관적 저장 (state.profile.records[0])
         │
         ├──────────────────────────────────────────────┐
         ▼                                              ▼
[showCheckinFeedbackSheet('loading')]         [requestAIFeedback(goal, text, theme)]
 - 사용자 아바타 등장                             - Gemini 3.1 Flash Lite (서버/클라이언트)
 - "오늘 실천을 AI 코치가 분석 중..."             - 스마트 로컬 폴백 (네트워크 단절 대비)
         │                                              │
         ▼                                              ▼
[AI 피드백 응답 수신] ◀──────────────────────────────────┘
         │
         ├─▶ 1. 영구 영속화: newRec.feedback = fb; await saveProfile();
         ├─▶ 2. 시트 업데이트: showCheckinFeedbackSheet(newRec, fb);
         │      - 아바타 말풍선: 핵심 통찰 & 팩트 분석
         │      - 판정 뱃지: [핵심 발견] / [페이스 유지] 등
         │      - 1클릭 CTA: [내일 퀘스트로 등록 (+1클릭)]
         └─▶ 3. 기록 탭 연동: renderRecordsScreen() 시 buildRecordCardHtml 에 상시 노출
```

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- **파일별 변경 예산**:
  - `index.html`: 약 +110줄 / -10줄
  - `ui.css`: 약 +90줄 / -0줄
  - `sw.js`: 1줄 수정 (캐시 네임)
  - `scripts/smoke-test.js`: 약 +30줄
  - `scripts/verify-integrity-gate.js`: 약 +25줄
- **4위 1체 배선 명세**:
  - 마크업: 피드백 바텀시트 컨테이너 `#checkinAiSheetModal`
  - 리스너: `btnCheckinAiClose`, `btnCheckinAiApplyNext`
  - 로직: `showCheckinFeedbackSheet`, `applyAiNextActionToSchedule`
  - 피드백: 아바타 대화창 애니메이션 및 토스트 안내

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Regression Prevention)
- 기존 `renderFeedbackSlot` 호환성 유지: 기존 폼 아래 피드백 슬롯을 손상시키지 않고 병행 지원.
- 기존 기록 무손실: `feedback` 필드가 없는 구버전 기록 데이터도 정상적으로 렌더링되도록 방어 코드 (`if(r.feedback) ...`) 작성.
- 4대 테마 무결성: Dark/Focus/Urban/White 전 테마에서 CSS 변수(`var(--card)`, `var(--ink)`, `var(--brand)`)를 사용하여 100% 조화로운 시각 톤 유지.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **[데이터 계층]**: `index.html` `captureSave` 내 `newRec.feedback = fb;` 및 `await saveProfile();` 영구 영속화 배선.
2. **[UI/UX 계층 - 체크인 시트]**: `index.html` 내 `showCheckinFeedbackSheet` 및 모달 템플릿 구현.
3. **[UI/UX 계층 - 기록 탭]**: `index.html` `buildRecordCardHtml` 내 AI 코칭 피드백 아코디언/배지 렌더링 추가.
4. **[스타일 계층]**: `ui.css` 내 피드백 시트, 아바타 말풍선, 배지 및 버튼 40px 터치 타겟 스타일 정의.
5. **[액션 연계 계층]**: `applyAiNextActionToSchedule` 핸들러 배선 (1클릭 내일 일정/퀘스트 등록).
6. **[PWA 캐시]**: `sw.js` 캐시 키 갱신.
7. **[자동화 테스트]**: `scripts/smoke-test.js` & `scripts/verify-integrity-gate.js` 결속.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **A. 전수 클릭 (Dead-Click 0)**: `btnCheckinAiClose`, `btnCheckinAiApplyNext`, 기록 카드 피드백 토글 버튼 전수 클릭 검증.
- **B. 데이터 무손실 (Data Loss 0)**: 체크인 후 새로고침 시 `state.profile.records[0].feedback` 보존율 100% 입증.
- **C. 전 UX 회귀 (UX Regression 0)**: 기존 체크인, 타이머, 캘린더, 소통 기능 정상 동작 검증.
- **D. 화면 상호연동 (State Propagation)**: 홈 탭 체크인 완료 즉시 기록 탭으로 이동 시 해당 기록 카드에 AI 피드백이 즉시 나타나는지 검증.
- **E. 자동화 게이트 (Automated Gates)**: `npm test` 및 `node scripts/verify-integrity-gate.js` 무결성 게이트 100% 통과.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트
- [ ] Step 1: `index.html` `captureSave` 피드백 영속화 및 `showCheckinFeedbackSheet` 구현
- [ ] Step 2: `index.html` `buildRecordCardHtml` 기록 탭 피드백 렌더링 추가
- [ ] Step 3: `ui.css` 아바타 피드백 모달 및 기록 카드 스타일링
- [ ] Step 4: `sw.js` 캐시 네임 갱신
- [ ] Step 5: `scripts/smoke-test.js` & `scripts/verify-integrity-gate.js` 검증 20 배선
- [ ] Step 6: `npm test` ALL PASS 확인
- [ ] Step 7: Chrome CDP 모바일 375px 실측 캡처 및 데드클릭 0건 입증
- [ ] Step 8: 로컬 main 병합 및 Vercel 프리뷰 배포

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재 블로커**: Gemini API 키가 없거나 네트워크가 불안정하여 응답이 늦어질 경우.
- **대응책**: 0초에 즉각적인 아바타 리액션을 띄우고, 2초 이상 지연 시 내장된 지능형 스마트 폴백(`localFeedback`)이 즉시 이어받아 끊김 없는 사용자 경험을 보장.
- **롤백 계획**: Git 브랜치 격리를 통해 문제 발생 시 즉각 `git checkout main`으로 복귀 가능.
