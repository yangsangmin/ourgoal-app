## [INFRA] #TASK-ES-129 feat: 소통탭 7단계 피로층 다이어트 및 최신 피드 1초 직통 노출

### 1. 작업 목적 및 개요
- 소통 탭 진입 시 2중으로 중복 적재되던 3버튼 허브 카드(#commHubGrid)와 120px 거대 요약 원카드로 인해 첫 피드가 화면 밖으로 밀려나던 7단계 피로층을 대폭 다이어트하여, 탭 진입 즉시 1초 만에 최신 피드와 동료들의 온기를 마주하도록 개선함.

### 2. 주요 변경 사항
1. **중복 허브 카드 은폐 및 6대 서브탭 바 단일화**:
   - `ui.css`: `#commHubGrid, .comm-hub-grid`를 고특이도 `display: none !important;`로 설정하여 중복 버튼 소탕.
   - `index.html`: `#commHubGrid`에 `style="display:none !important;" aria-hidden="true"` 인라인 방어벽 구축.
2. **동류 소통 요약 원카드 및 여백 슬림화**:
   - `ui.css`: `.toss-community-hero-card`의 마진과 높이를 다이어트하고 인라인 가로 배치 스펙 적용.
   - `.reaction-floating-bar` 하단 마진을 12px에서 6px로 정돈.
3. **피드 콘텐츠 상단 도달 거리 단축**:
   - 피드 콘텐츠 상대 시작 위치(Top Offset)를 340px에서 213px로 127px 대폭 단축하여 첫 화면 내 피드 1초 직통 노출 달성.

### 3. 검증 결과
- `npm test`: 스모크 440개 통과 (0 실패), 무결성 게이트 38개 전수 통과 (0 실패), 데드클릭 941개 전수 통과.
- Headless Chrome CDP 실측:
  - `commHubGridDisplay`: `'none'`
  - `commBodyRelativeTop`: 213px (127px 단축)
  - `commReactionDockDisplay`: `'flex'`
