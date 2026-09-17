# 엔지니어링 작업계획서 (PLAN) — 대기 상태 18대 과제([27]~[44]) 전수 구현 및 무결성 병합

> **문서 ID**: PLAN-TASK-ES-172-NOTEPAD-PENDING-ALL  
> **요구사항 연계**: [REQ-TASK-ES-172-NOTEPAD-PENDING-ALL](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-172-NOTEPAD-PENDING-ALL.md)  
> **티켓 연계**: #TASK-ES-172  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity Gemini Session  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - `💡 아워골 생각 메모장`에 대기 중인 18개 과제([27]~[44]) 전수를 4위 1체로 완결하여 아워골 핵심 3대 루프(목표-기록-소통)의 결함을 해소하고 완성도를 극대화.
- **영향 받는 파일 목록 전수**:
  - `index.html`: 루틴 탭, 사진일기 닫기, 캘린더 배경 2장, 중복 버튼 제거, 아바타 아이콘 확대, 퀘스트 할일 1개, 현황판 3개 지표 제거, 레벨업/EXP 팝업, 스토리카드 다각화/피드게시, 기록/통계 탭 라벨, 통계 다중선택, 설정창 4대 그룹 개편.
  - `js/time-tracker.js`: 스톱워치 랩 실시간 메모 팝업, 초기화 2중 안전 확인 모달, 기록하기 시 랩 상세 자동 프리필.
  - `js/team-invite-comm.js`: DM 키보드 자동 focus 제거, 소통탭 게시 버튼 복구, 동반자 AI 제거, 마니또 AI 1명 제한/20명 초과 전면 삭제.
  - `scripts/verify-integrity-gate.js`: #TASK-ES-172 검증 로직 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 18대 과제를 전역 상태(`state`) 및 컴포넌트 라이프사이클에 모듈식으로 결합하여 런타임 안정성과 4대 뷰 동기화를 실현.
- **[원인] (Technical Causes)**:
  - 과거 급속 개발로 인한 UI 중복, 단일 선택 인터페이스의 유연성 한계, 모바일 포커스 제어 미비.
- **[중심 배선] (Core Wire & State)**:
  - `state.routines`: 요일별 반복 루틴 컬렉션.
  - `state.stopwatchLaps`: 구간별 활동 메모 결합.
  - `state.selectedMetrics`: 통계 다중 선택 세트.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 원격 Supabase DB 및 `localStorage` 이중화, 4대 뷰 동시 전파(`renderHome`, `renderRecordsScreen`, `renderStatsScreen`, `renderCalendar`).
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[사용자 입력] -> [상태 갱신 & localStorage 백업] -> [Supabase 원격 저장] -> [4대 뷰 동시 전파 (renderHome, renderRecordsScreen, renderStatsScreen, renderCalendar)] -> [피드백 토스트]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `index.html` | 루틴/스토리카드/설정창/UI 최적화 | +220줄 | -40줄 | +180줄 | 외과수술적 배선 |
| `js/time-tracker.js` | 스톱워치 랩 팝업 & 2중 초기화 | +70줄 | -10줄 | +60줄 | 안전장치 강화 |
| `js/team-invite-comm.js` | DM 포커스 방지, AI 동반자 정제 | +40줄 | -15줄 | +25줄 | 실 유저 중심 정제 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업**: 루틴 탭, 스톱워치 랩 팝업, 2중 초기화 모달, 스토리카드 옵션 바.
2. **리스너**: 클릭/터치/체크박스 이벤트 전수 배선.
3. **비즈니스 로직**: 상태 저장, EXP 부여, 알림 예약, 피드 등록 실연동.
4. **피드백**: 로딩 인디케이터, 성공 토스트, 에러 롤백.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 완벽히 계승하였는가?
- [x] 전체 파일 덮어쓰기 없이 외과수술적 diff로 작성하는가?
- [x] 기존 사용자의 아바타, 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하나 다중 탭 충돌을 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (목표 & 캘린더)**: 루틴 탭, 요일/알림/EXP 10, 사진일기 닫기 영구숨김, 캘린더 배경 2장 지원.
2. **Step 2 (홈 & 아바타 & 퀘스트)**: 중복 버튼 제거, 아바타 아이콘 확대, 퀘스트 할일 1개, 현황판 3개 지표 제거, 레벨업 멘트 및 EXP 축하 팝업.
3. **Step 3 (기록 & 스톱워치 & 통계)**: 스토리카드 비율/항목/피드게시, 기록 탭 명칭 '기록/통계' 변경, 통계 다중 지표 필터링, 스톱워치 랩 팝업 및 2중 초기화.
4. **Step 4 (동반자 & 소통 & 설정)**: DM 키보드 자동 focus 제거, 소통탭 게시 버튼 복구, 동반자 AI 제거, 마니또 AI 1명 제한/20명 초과 전면 삭제, 설정창 4대 그룹 아코디언 개편.
5. **Step 5 (4대 연계 뷰 동시 전파)**: `renderHome`, `renderRecordsScreen`, `renderStatsScreen`, `renderCalendar` 호출 검증.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 18개 신규/수정 인터랙션 전수 클릭 검증 -> 런타임 에러 0건.
- **시나리오 B (Zero Data Loss)**: 페르소나 10종 데이터 무손실 딥 이퀄 통과.
- **시나리오 C (Zero UX Regression)**: 계정/세션 및 3대 본질 루프 회귀 0건 확인.
- **시나리오 D (Full State Propagation)**: 데이터 변경 시 4대 뷰 동시 전파 확인.
- **시나리오 E (Automated Gates)**: `npm test` 309개 스모크 테스트 및 `verify-integrity-gate.js` 18개 검사 ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트
- [x] REQ 및 PLAN 문서 작성 (헌법 제2조 2중 8원칙 준수)
- [ ] Step 1: 목표 루틴 및 캘린더 기능 구현
- [ ] Step 2: 홈 퀘스트/현황판/아바타 피드백 구현
- [ ] Step 3: 스톱워치 랩 팝업/2중 초기화 및 스토리카드 다각화 구현
- [ ] Step 4: 소통/동반자 AI 정제 및 설정창 아코디언 개편
- [ ] Step 5: npm test 및 verify-integrity-gate.js 전수 통과
- [ ] Step 6: 4단계 로컬 메인 병합 및 5A 프리뷰 배포

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재 오류**: 캘린더 배경 2장 업로드 시 base64 용량 과다로 localStorage 한도 초과 위험.
- **방어 대책**: Canvas 리사이징(최대 1200px) 및 JPEG 0.85 압축 적용.
- **롤백 계획**: 오류 발생 시 git stash 또는 직전 백업 커밋으로 100% 무손실 복구.
