# PLAN-TASK-ES-142 — 30초 무마찰 온보딩 및 첫 체크인(E1) 경험 극대화 작업계획서

- **작업 티켓**: `TASK-ES-142`
- **관련 스펙**: `docs/specs/REQ-TASK-ONBOARDING-30S.md`
- **본질축**: `E1 (첫 체크인 루프) & 신규 유저 첫 30초 무마찰 안착`
- **상위 정본**: `docs/rules/MASTER_PLAN_OURGOAL.md` (제9장, 제10장 5대 제품 설계 공식), `C:\Users\HP\AGENTS.md`
- **최고결정권자**: 상민님
- **상태**: 100% 완료 및 무결성 검증 완료 (법정 심사 청구 준비)

---

## 1. 목표 및 완료 기준
1. **1단계 (10초) - 수호동물 선택**:
   - 16종 MBTI 동물 아바타 카드 및 4대 성향 탭(분석형, 외교형, 관리형, 탐험형) 필터 제공.
   - 내 실제 사진 기반 AI 아바타 안내 칩 제공.
   - 기본 부엉이 건너뛰기 지원.
2. **2단계 (10초) - 닉네임 & 1호 목표**:
   - 닉네임 자동 제안(기본값) 및 즉시 수정 가능.
   - 3대 킬러 목표 프리셋(🏃 매일 30분 운동, 📚 하루 20분 공부, ⏰ 아침 7시 기상, ⏭️ 나중에 설정하기) 원터치 선택.
   - [아워골 시작하기 (+10 EXP) 🚀] 클릭 시 경험치 10 EXP 지급 및 홈 콕핏 안착.
3. **3단계 (10초) - 첫 체크인(E1) 완주 루프**:
   - 홈 콕핏 상단 첫 체크인 가이드 배너(#firstCheckinTutorialBanner) 노출 (수호동물 이모지, 1호 목표 연동 멘트, 입력창 포커스).
   - 1줄 체크인 입력 및 저장 시 첫 체크인 축하 팝업 모달 노출 (수호동물 응원, +10 EXP 지급, 레벨 1 달성, 폭죽 효과).
   - 첫 체크인 축하 모달 닫기 후 AI 코칭 피드백 시트 연계.
4. **기계적 무결성 100% 보증**:
   - `npm test` ALL PASS (441 smoke tests, 38개 헌법 게이트, 946개 Zero Dead-Click, Master Shipyard 모듈러 아키텍처).
   - 전용 단위 테스트 `tests/onboarding-first-checkin.test.js` PASS.
   - CDP 실 브라우저 5단계 시나리오 스크린샷 5장 확보 및 `report.success: true`.
   - Tri-Sync 무결성 100% (`tri-sync.js check`).

---

## 2. 변경 파일 내역
- `index.html`:
  - `#firstCheckinTutorialBanner` 슬롯 배선.
  - `showObStep1`, `showObStep2`, `completeOnboarding` 온보딩 2단계 개편.
  - `renderFirstCheckinTutorialBanner` 홈 콕핏 가이드 배너 렌더러.
  - `triggerFirstCheckinCelebrationModal` 첫 체크인(E1) 축하 팝업 모달.
  - `captureSave` 첫 체크인 축하 모달 분기 분리 및 시트 중복 충돌 방지.
- `tests/onboarding-first-checkin.test.js`:
  - 16종 MBTI 동물 데이터, 프리셋, 슬롯 ID, EXP 지급 로직 정적/동적 검증 스위트 신설.
- `scratch/verify_es142_onboarding_cdp.js`:
  - Headless Chrome CDP 자동화 검증 스크립트.
- `docs/plans/PLAN-TASK-ES-142-30S-ONBOARDING.md`:
  - 본 작업계획서.
