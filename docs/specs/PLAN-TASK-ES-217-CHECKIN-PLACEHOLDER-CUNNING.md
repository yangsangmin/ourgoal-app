# 작업계획서 (PLAN) — 오늘의 3초 체크인 목표 커닝페이퍼 칩 플레이스홀더 가이드화

> **문서 ID**: PLAN-TASK-ES-217-CHECKIN-PLACEHOLDER-CUNNING  
> **티켓 연계**: #TASK-ES-217  
> **작성 일시**: 2026-09-23  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///Users/yangsangmin/.gemini/antigravity/scratch/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Engineering Architecture & Scope)
- **REQ 핵심 요약**:
  - 홈 탭 3초 체크인 목표 칩(커닝페이퍼) 클릭 시 inp.value 덮어쓰기를 전면 배제하고, inp.placeholder 동적 주입 및 즉시 포커스 배선으로 지움 피로도를 0%로 만든다.
- **영향받는 파일 전수 목록**:
  - index.html: applyQuickCunningText, renderQuickCheckinGuideChips, captureSave 완료 후 placeholder 초기화.
  - docs/rules/TICKETS.md: #TASK-ES-217 상태 업데이트.
  - tests / scripts: 무결성 검증 단언문 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 3초 체크인의 찰나에 발생하는 입력 저항과 지움 피로도를 0%로 만드는 프론트엔드 DOM 프로퍼티 정류 배선.
- **[원인] (Technical Causes)**: applyQuickCunningText 내부에서 inp.value = text 로 텍스트를 강제 대입하여 사용자가 백스페이스로 지워야 했던 레거시 배선.
- **[중심] (Core Wire & State)**:
  - state.profile.records, goals, streaks 등 전역 상태 모델은 100% 불변 보존.
  - captureInput.placeholder 동적 갱신 및 focus() 배선.
- **[핵심] (Critical Safety & Persistence)**:
  - placeholder 상태에서 사용자가 텍스트를 작성하지 않고 저장 클릭 시 빈 문자열 전송 방어(trim 검증).
- **종단간 데이터 흐름 다이어그램**:
  - 유저가 목표 칩 클릭 -> applyQuickCunningText(text) 호출 -> inp.placeholder = "예: " + text -> inp.focus() -> 15ms 햅틱 + 토스트 안내.
  - 유저 타이핑 -> inp.value에 사용자 입력 저장 -> 기록 저장 클릭 -> trim() 검증 후 저장 -> placeholder 기본값 원복.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget & 4-in-1)
- **파일별 변경 예산 (Diff Budget)**:
  - index.html: 추가 약 15줄, 삭제 약 5줄 (총 diff 20줄 이내 초슬림 정밀 배선).
- **4위 1체 배선 명세**:
  1. 마크업: (탭하면 가이드 예시 힌트 설정 ⚡) 캡션 동기화.
  2. 리스너: data-cunningtext 클릭 시 활성 보더 강조 및 applyQuickCunningText 트리거.
  3. 비즈니스 로직: inp.value 강제 주입 제거, inp.placeholder 주입.
  4. 피드백: 15ms 햅틱 + 토스트(💡 예시 가이드가 입력창 힌트로 설정되었습니다 ✨).

### 3-1. 시각적 IA 및 시맨틱 통합 배선도 (헌법 제2조 제6항 준수)
- **상하 위계**: 홈 탭 상단 -> 오늘의 원카드 -> 오늘의 3초 체크인 -> 텍스트에어리어(#captureInput) -> 하단 커닝페이퍼 칩 행.
- **슬롯 매핑**: 기존 .btn-quick-chip 및 #captureInput 그대로 승계.
- **모바일 반응형 규격**: 375px 화면에서 칩 터치 타겟 44px 유지.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Integrity & Non-Destruction Assurance)
- **기존 디자인/스타일 보존**:
  - 기존 칩의 파란색 톤(rgba(49,130,246,0.08)) 및 둥근 버튼 디자인 보존.
- **유저 자산 100% 보존 재확인**:
  - 기존 목표, 기록, 스트릭 데이터에 대한 어떠한 쓰기/삭제도 발생하지 않음.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Implementation Sequence)
1. index.html 라인 3178~3190의 applyQuickCunningText 함수 수정:
   - inp.value = text 제거.
   - inp.placeholder = "예: " + text 설정.
   - 토스트 메시지 안내문 갱신.
2. index.html 라인 3220의 renderQuickCheckinGuideChips 함수 수정:
   - 캡션 (탭하면 가이드 예시 힌트 설정 ⚡) 변경.
   - 칩 클릭 시 활성 스타일(border, background) 토글 추가.
3. index.html 라인 12348의 captureSave 완료 콜백 수정:
   - t.placeholder = "예: 오늘 실천한 멋진 일을 한 줄로 적어보세요" 원복.
4. 로컬 스모크 및 무결성 게이트 실행 검증.

---

## 6. [원칙 ⑥] 절차 재검증: 법정 주장(claims) 설계 (Court Claims Design)
- **주장 (Claim 1)**: 커닝페이퍼 칩 클릭 시 입력창의 value는 빈 문자열로 유지되고 placeholder에 예시 텍스트가 바인딩된다.
- **주장 (Claim 2)**: 칩 클릭 후 사용자가 글자를 지우지 않고 바로 타이핑하여 체크인을 성공적으로 제출할 수 있다.
- **확인 불가 항목**: 없음 (클라이언트 DOM 인터랙션으로 100% 실측 확인 가능).

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (Step Checklist)
- [ ] index.html 수정 완료.
- [ ] node scripts/verify-integrity-gate.js 실행 38/38 통과.
- [ ] npm test 실행 335개 테스트 전수 통과.
- [ ] verify-all-clicks.js 실행 781개 버튼 Dead-Click 0 확인.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획 (Blockers, Rollback & Disaster Recovery)
- **잠재 오류**:
  - 플레이스홀더를 길게 설정했을 때 텍스트에어리어 스크롤 문제 -> 일반적인 한 줄 문장이므로 줄바꿈되어 렌더링됨.
- **롤백 계획**:
  - 문제 발생 시 git checkout index.html로 즉시 복구 가능.
