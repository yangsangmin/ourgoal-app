# [작업 결과 보고서] #TASK-ES-127: 하단 탭바 중앙 FAB(+ 빠른 체크인) 시인성 복원 및 뷰포트 하단 84px 안전 여백 일괄 보정

> **티켓**: #TASK-ES-127 (P0)  
> **일시**: 2026-10-02  
> **상태**: 4단계 심사 청구 (PR 생성 및 GitHub Court 법정 심사 대기)

---

## 1. 지시 및 문제 배경
- **상민님 지시 원문**: "모듈화작업 완료됐는데, 이제 아워골 ui/ux를 획기적으로 개선해야해 지금 아워골 ui문제 전 탭에서 파악하고, 지식기반에 정체중인 티켓들이랑 문제점 파악된거랑 결합해서, 신규 티겟들 아워골 명령입력/메모장 (명령대기 & 아이디어 DB) db에 구축하자. 그 뒤에 그 티켓들 내가 검토하고 그대로 ui/ux 개선 진행할게"
- **문제점 실측**:
  1. 하단 탭바 중앙의 FAB(`#bottomNavFab`)이 4대 테마에서 `display: none !important`로 가려지거나, 기본 테마에서 배경이 투명/흐릿하여 보이지 않음.
  2. 전 탭 하단 여백이 24px로 덮여 75px 플로팅 탭바가 스크린 맨 아래 요소를 가림.
  3. 타 탭에서 빠른 체크인 클릭 시 탭 전환 없이 미작동.

---

## 2. 해결 내역
1. **글로벌 FAB 시인성 및 브랜드 아이덴티티 복원**:
   - `ui.css`: `.navbtn-fab`에 브랜드 에메랄드 그라디언트(`linear-gradient(135deg, #10B981 0%, #059669 100%)`), 2px 테두리, 입체 섀도우, 16px 상단 돌출 배치.
   - 375px 모바일 뷰포트 맞춤 44px 스케일링 적용.
2. **4대 테마 전역 노출 및 맞춤 액센트 스타일링**:
   - 성소/블랙/화이트/도심 4대 테마 셀렉터에서 `display: none !important` 완전 제거 및 `display: flex !important` 복원.
   - 테마별 조화로운 액센트 그라디언트 및 드롭섀도우 적용.
3. **전 탭 뷰포트 84px+ 안전 여백 일괄 확장**:
   - `.screen, #screen-home, #screen-goals, #screen-calendar, #screen-records, #screen-comm, #screen-settings`: `padding-bottom: max(96px, calc(var(--nav-h, 64px) + env(safe-area-inset-bottom, 24px) + 32px)) !important` 적용.
   - 탭바 가림 0건 달성.
4. **원클릭 체크인 인터랙션 고도화**:
   - `index.html`: `#bottomNavFab` 클릭 시 `setTab('home')`을 통해 즉시 홈 화면으로 전환 후 `#captureInput`에 부드럽게 스크롤 & 포커스.

---

## 3. 측정 및 검증 증거 (선언이 아닌 측정)
- **스모크 테스트**: 440개 통과 (0개 실패)
- **헌법 무결성 게이트**: 38개 검사 전수 통과 (0개 실패)
- **Zero Dead-Click 검증기**: 941개 전수 핸들러 배선 통과
- **조선소 모듈 아키텍처**: 5개 테스트 100% 통과
- **Headless Chrome CDP 실측**:
  - FAB 크기: 48px × 48px, 가시성: `visible: true`
  - 4대 테마 가시성: 4/4 테마 전부 `visible: true`
  - 6대 전 탭 하단 패딩: `home: 96px`, `goals: 96px`, `calendar: 96px`, `records: 96px`, `comm: 96px`, `settings: 96px` (요구치 84px 초과 달성)
  - FAB 클릭 인터랙션: `activeTabAfterFabClick: 'screen-home'`, `isCaptureInputFocused: true`
- **스크린샷**: `step3_es127_fab_verified.png`
