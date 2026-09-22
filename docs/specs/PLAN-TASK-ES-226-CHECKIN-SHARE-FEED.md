# 엔지니어링 작업계획서 (PLAN) — 체크인 완료 즉시 [📢 피드에도 자랑하기 (+5 EXP)] 1-클릭 고속 발행 파이프라인 개통

> **문서 ID**: PLAN-TASK-ES-226-CHECKIN-SHARE-FEED  
> **요구사항 연계**: [REQ-TASK-ES-226-CHECKIN-SHARE-FEED](REQ-TASK-ES-226-CHECKIN-SHARE-FEED.md)  
> **티켓 연계**: #TASK-ES-226  
> **작성 일시**: 2026-09-23  
> **작성자**: Antigravity 바이럴 그로스 & 소셜 루프 엔지니어  
> **규범 준수**: OURGOAL_ABSOLUTE_INTEGRITY_RULES 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 체크인 완료 바텀시트에서 번거로운 3단계 모달 없이, 에메랄드 그린 버튼 1클릭으로 소통 탭 실시간 피드에 즉시 실천을 발행하고 +5 EXP 보상을 지급하는 고속 파이프라인 구축.
- **영향 받는 파일 목록 전수**:
  - `docs/rules/TICKETS.md`: #TASK-ES-226 등록
  - `docs/specs/REQ-TASK-ES-226-CHECKIN-SHARE-FEED.md`: 요구사항 정의서
  - `docs/specs/PLAN-TASK-ES-226-CHECKIN-SHARE-FEED.md`: 작업계획서
  - `reports/TASK-ES-226/claims.json`: 법정 5대 검증 청구서
  - `index.html`:
    - `openCheckinFeedbackSheet` 내 `#btnCheckinInstantShareFeed` 및 `#chkCheckinShareGoalTitle` 마크업 배치
    - `instantShareCheckinToFeed` 1클릭 고속 발행 로직 구현
    - 15ms 미세 햅틱, `awardXP(5)`, `FEED_POSTS_CACHE`, 폭죽 및 4대 뷰 동시 전파 배선
  - `scripts/smoke-test.js`: TASK-ES-226 검증 단언문 추가

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 체크인 실천의 보람을 커뮤니티 동류 소통 피드와 RPG 경험치 보상으로 1초 만에 직결하는 바이럴 그로스 파이프라인.
- **[원인] (Technical Causes)**:
  - 완료 시트에 간이 공유 버튼만 존재하고 정밀 모달로 우회시켜 발행 단계가 길고 이탈이 발생했음.
- **[중심 배선] (Core Wire & State)**:
  - `FEED_POSTS_CACHE` & `state.profile.settings.myFeedPosts`: 피드 원장 즉시 갱신
  - `awardXP(5, "체크인 피드 자랑")`: 경험치 원장 가산
  - `#btnCheckinInstantShareFeed`: 1터치 메인 액션 바인딩
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 중복 발행 방지 플래그(`disabled`), 로컬 캐시 선행 저장으로 오프라인 완벽 방어, 비공개 목표 보호 토글.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[체크인 AI 완료 시트] -> [btnCheckinInstantShareFeed 클릭] -> [15ms 햅틱] -> [피드 포스트 생성] -> [FEED_POSTS_CACHE unshift] -> [awardXP(5)] -> [saveProfile] -> [폭죽 & 토스트] -> [dispatchFullViewPropagation] -> [소통 탭 렌더링]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `docs/rules/TICKETS.md` | #TASK-ES-226 등록 | +1줄 | 0줄 | +1줄 | 규범 문서 |
| `index.html` | 피드 즉시 자랑 버튼 및 고속 발행 배선 | +85줄 | -2줄 | +83줄 | 기능 추가 |
| `scripts/smoke-test.js` | 회귀 방지 검증 단언문 | +22줄 | 0줄 | +22줄 | 테스트 보강 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**:
   - `#btnCheckinInstantShareFeed`, `#chkCheckinShareGoalTitle` 시맨틱 마크업.
2. **이벤트 리스너 (Listener)**:
   - 클릭 이벤트 및 토글 바인딩.
3. **비즈니스 로직 (Logic)**:
   - `instantShareCheckinToFeed()` 및 `awardXP(5)` 호출.
4. **피드백 & 예외처리 (Feedback)**:
   - 15ms 햅틱, 폭죽 이펙트, 경험치 획득 토스트 및 소통 탭 실시간 갱신.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 피드 상세 공유 모달(`openShareToFeedModal`)을 손상 없이 온전히 보존했는가?
- [x] 전체 파일 덮어쓰기 없이 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 아바타 레벨 및 경험치 보존 원칙을 준수했는가?
- [x] 375px 모바일 반응형과 44px 이상 터치 타깃을 충족했는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: `docs/rules/TICKETS.md`에 #TASK-ES-226 등록.
2. **Step 2**: `reports/TASK-ES-226/claims.json` C1~C5 작성.
3. **Step 3**: `openCheckinFeedbackSheet` 내 마크업 배치 및 이벤트 배선.
4. **Step 4**: `instantShareCheckinToFeed` 함수 구현.
5. **Step 5**: `scripts/smoke-test.js` 단언문 추가.
6. **Step 6**: `npm test` 및 무결성 게이트 검증.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: `#btnCheckinInstantShareFeed` 및 `#chkCheckinShareGoalTitle` 클릭 시 콘솔 에러 0건 확인.
- **시나리오 B (Zero Data Loss)**: 발행된 피드 포스트가 `FEED_POSTS_CACHE`와 `myFeedPosts`에 100% 영속화 확인.
- **시나리오 C (Zero UX Regression)**: 기존 상세 공유 모달(`#btnCheckinAiShareFeed`) 정상 작동 확인.
- **시나리오 D (Full State Propagation)**: 피드 발행 시 홈(경험치 바) 및 소통 탭(피드 리스트) 동시 갱신 확인.
- **시나리오 E (자동화 게이트 통과)**: `npm test` 및 `verify-integrity-gate.js` 100% ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~6 순차적 완결
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] PR 생성 및 Notion [96] 완료 갱신

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 연속 클릭 시 다건 등록 -> **대책**: `disabled = true` 즉각 처리 및 텍스트 갱신.
- **롤백 계획 (Rollback Strategy)**: `git checkout -- index.html` 즉시 원복.
- **재검증 트리거**: 피드 미노출 또는 경험치 미가산 시 즉시 원칙 ⑤로 회귀.
