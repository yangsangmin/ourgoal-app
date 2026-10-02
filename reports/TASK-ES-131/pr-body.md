## [INFRA] #TASK-ES-131 feat: 기록탭 스톱워치·히트맵·타임라인 3중 분산 해소 및 단일 콕핏 아키텍처(통계/히트맵 vs 타이머 vs 타임라인 3모드 클린 스위처)

### 1. 작업 목적 및 개요
- 상민님 직접 지시("병합하고 관련 모든 티켓 중단없이 집행해") 및 티켓 [131]에 따라, 기록 탭에 3중으로 중첩 분산되어 있던 스톱워치·히트맵·타임라인을 3대 메인 세그먼트 스위처(`[ 📈 히트맵·통계 | ⏱️ 몰입 타이머 | 📝 실천 타임라인 ]`)로 통합하고, 선택된 단일 모드만 시원하게 렌더링되도록 뷰포트를 격리함.
- 기간 필터 칩의 높이를 40px 이상, 폰트를 13px 이상으로 정규화하여 31개 터치 타깃 미달 및 57개 미세폰트 결함을 원천 해소함.

### 2. 주요 변경 사항
1. **3대 클린 스위처 및 단일 콕핏 구축**:
   - `js/sanctuary-v3-engine.js`: 기록 탭 상단을 `[ 📈 히트맵·통계 | ⏱️ 몰입 타이머 | 📝 실천 타임라인 ]` 3대 모드로 재편.
   - `js/sanctuary-v3-engine.js`: 히트맵 카드 푸터의 중복 `⏱️ 스톱워치 콕핏` 버튼 은폐.
2. **중복 위젯 및 기능 카드 완전 은폐**:
   - `ui.css`: `#quickStopwatchBar`, `#recCalFuseSwitcher`, `#recHeroCard`, `#og-task-24-container`에 `display: none !important;` 선언하여 3중 중복 요소 소탕.
   - `index.html`: `#og-task-24-container`에 `style="display:none !important;" aria-hidden="true"` 인라인 방어벽 구축.
3. **터치 타깃 및 폰트 크기 규격화**:
   - `ui.css`: `.s-segment-pills .s-seg-pill`, `.s-seg-pill`에 `min-height: 40px !important; font-size: 13px !important;`를 부여하여 모바일 조작 편의성 극대화.

### 3. 검증 결과
- `npm test`: 스모크 440개 통과 (0 실패), 무결성 게이트 38개 전수 통과 (0 실패), 데드클릭 941개 전수 통과.
- Headless Chrome CDP 실측:
  - `modeBtns`: `["📈 히트맵·통계", "⏱️ 몰입 타이머", "📝 실천 타임라인"]`
  - `quickStopwatchDisplay`: `'none'`
  - `calFuseDisplay`: `'none'`
  - `heroCardDisplay`: `'none'`
  - `task24Display`: `'none'`
  - `pillHeight`: 40px (터치 타깃 100% 충족)
  - `pillFontSize`: '13px' (미세 폰트 100% 해소)
  - `docScrollWidth`: 390px
