# 엔지니어링 작업계획서 (PLAN) — 홈 탭 '오늘 달성 레이스' 가짜 시뮬레이션 제거 및 '함께 달리는 동류 N명' 실데이터 배선

> **문서 ID**: PLAN-TASK-ES-228-HOME-RACE-REAL-DATA  
> **요구사항 연계**: [REQ-TASK-ES-228-HOME-RACE-REAL-DATA](REQ-TASK-ES-228-HOME-RACE-REAL-DATA.md)  
> **티켓 연계**: #TASK-ES-228  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity 데이터 무결성 아키텍트 겸 에티컬 소프트웨어 엔지니어  
> **규범 준수**: OURGOAL_ABSOLUTE_INTEGRITY_RULES 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 홈 탭의 '오늘 달성 레이스' 영역에 하드코딩된 가짜 봇이나 임의 시뮬레이션 데이터를 완전히 걷어내고, 오늘 실제로 체크인을 완료한 실 사용자 집계 데이터를 실시간 연동.
- **영향 받는 파일 목록 전수**:
  - `docs/rules/TICKETS.md`: #TASK-ES-228 등록
  - `docs/specs/REQ-TASK-ES-228-HOME-RACE-REAL-DATA.md`: 요구사항 정의서
  - `docs/specs/PLAN-TASK-ES-228-HOME-RACE-REAL-DATA.md`: 작업계획서
  - `reports/TASK-ES-228/claims.json`: 법정 5대 검증 청구서
  - `ui.css`:
    - `.crew-pacing-widget` 은폐 해제 및 모던 토스 스타일 레이스 카드 조형
  - `index.html`:
    - `#crewPacingWidget` 마크업 고도화 (`#userCrewHeadline`, `#btnGoLiveFeed`)
    - `renderCrewPacingWidget()` 실데이터 기반(체크인 기록 + 실시간 피드 포스트 작성자) 집계 엔진 재구축
    - `nudgeCrewMates()` 15ms 햅틱 및 폭죽 연동
  - `scripts/smoke-test.js`: TASK-ES-228 검증 단언문 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 단 1개의 가짜 봇이나 난수 눈속임도 없이, 오늘 실제로 체크인과 기록을 완수한 실 사용자의 수를 정직하게 집계하여 "함께 달리는 동반자 N명"이라는 살아있는 유대감을 홈 화면 최상단에서 직관적으로 체감시키는 데이터 무결성 레이스 카드.
- **[원인] (Technical Causes)**:
  - 과거 레거시에서 더미 봇을 시뮬레이션하려다 은폐 처리했던 것을 실데이터 집계 엔진으로 교체하지 못했음.
- **[중심 배선] (Core Wire & State)**:
  - `renderCrewPacingWidget()`: 실데이터 카운팅 및 렌더링 디스패처
  - `state.profile.records` & `FEED_POSTS_CACHE`: 오늘의 고유 사용자 ID 집계
  - `#btnGoLiveFeed` & `#btnNudgeCrewMates`: 소셜 인터랙션 바인딩
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 가짜 봇/난수 루프 0건, 0명일 때 친절한 첫 주자 안내, 12~15ms 미세 햅틱.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[실제 체크인 / 피드 작성] -> [activeUserMap 집계] -> [renderCrewPacingWidget] -> [함께 달리는 동반자 N명 렌더링] -> [피드 이동 / 응원 보내기]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `docs/rules/TICKETS.md` | #TASK-ES-228 등록 | +1줄 | 0줄 | +1줄 | 규범 문서 |
| `ui.css` | 은폐 스타일 정리 및 레이스 카드 스타일 | +8줄 | -2줄 | +6줄 | 스타일 정돈 |
| `index.html` | 실데이터 레이스 카드 마크업 및 집계 로직 | +75줄 | -12줄 | +63줄 | 기능 개편 |
| `scripts/smoke-test.js` | 회귀 방지 검증 단언문 | +22줄 | 0줄 | +22줄 | 테스트 보강 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**:
   - `#crewPacingWidget`, `#userCrewHeadline`, `#btnGoLiveFeed`, `#btnNudgeCrewMates`
2. **이벤트 리스너 (Listener)**:
   - 피드 이동 클릭, 응원 보내기 클릭 바인딩
3. **비즈니스 로직 (Logic)**:
   - 오늘의 고유 실천 유저(`activeCount`) 실시간 집계 및 게이지 계산
4. **피드백 & 예외처리 (Feedback)**:
   - 12~15ms 햅틱, 폭죽 이펙트, 소통 탭 실시간 피드 전환

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 가짜 시뮬레이션 코드(난수, 목데이터 봇)가 0건임을 보증하는가?
- [x] 전체 파일 덮어쓰기 없이 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 375px 모바일 반응형과 44px 이상 터치 타깃을 충족했는가?
- [x] 콘솔 에러 0건 및 기존 체크인/목표 기능 불파괴를 보증하는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `docs/rules/TICKETS.md`에 #TASK-ES-228 등록.
2. **Step 2**: `reports/TASK-ES-228/claims.json` C1~C5 작성.
3. **Step 3**: `ui.css` 내 `.crew-pacing-widget` 스타일 복원.
4. **Step 4**: `index.html` 마크업 및 `renderCrewPacingWidget` 구현.
5. **Step 5**: `scripts/smoke-test.js` 단언문 추가.
6. **Step 6**: `npm test` 및 무결성 게이트 검증.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: `#btnGoLiveFeed` 및 `#btnNudgeCrewMates` 클릭 시 콘솔 에러 0건 확인.
- **시나리오 B (Zero Data Loss)**: 체크인 및 피드 발행 시 실데이터 카운터 정상 증가 확인.
- **시나리오 C (Zero Fake Simulation)**: 목데이터 봇, setTimeout 가짜 러너 0건 확인.
- **시나리오 D (Full State Propagation)**: 체크인 후 홈 복귀 시 동류 카운터 즉시 갱신 확인.
- **시나리오 E (자동화 게이트 통과)**: `npm test` 및 `verify-integrity-gate.js` 100% ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~6 순차적 완결
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] PR 생성 및 Notion [98] 완료 갱신

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: `FEED_POSTS_CACHE` 지연 로딩 시 0명으로 표출될 수 있음 -> **대책**: 로드 완료 후 자동 리렌더링 트리거 배선.
- **롤백 계획 (Rollback Strategy)**: `git checkout -- index.html ui.css` 즉시 원복.
- **재검증 트리거**: 카운터 이상 동작 시 즉시 원칙 ⑤로 회귀.
