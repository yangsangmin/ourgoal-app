# REQ-TASK-ES-313: 기기 바탕화면용 위젯 기능(일정·목표·기록 3종 × 3가지 구성) 개발 완결

## 1. 개요
- **티켓 ID**: `#TASK-ES-313`
- **본질축**: `E3/UX`
- **상민님 원문 지시**:
  > *"아워골 일정, 목표, 기록하기를 앱 안들어가고 기기의 바탕화면에서 쓸 수 있도록 위젯기능 추가하자. 각 기능을 최대한 살릴 수 있는 크기와 시인성, ui와 ux 고려해서 알맞은 크기와 구성으로 일정, 목표, 기록하기 위젯을 3개씩 적용해서 추가하자."*

## 2. 세부 요구사항
1. **기기 바탕화면용 위젯 3종 × 3가지 크기 구성 완결 (총 9개 조합)**:
   - **위젯 3종**:
     1. `calendar` (일정): compact, standard, detail
     2. `goals` (목표): compact, standard, detail
     3. `records` (기록): compact, standard, detail
   - **구성별 크기 및 시인성/UX 특화**:
     - `compact` (소형, 2×2 / 약 170×170px): 핵심 지표 즉각 인지, 간결한 요약, 원터치 앱 바로가기.
     - `standard` (중형, 4×2 / 약 360×180px): 당일 주력 3개 아이템 목록, 진척도 시각화, 빠른 인터랙션.
     - `detail` (대형, 4×4 / 약 360×360px): 종합 현황 분석, 풀 타임라인/세부 마일스톤/주간 통계, 다기능 제어.

2. **시인성 및 UI/UX 극대화 (`widget.html`)**:
   - 모바일/데스크톱 기기 바탕화면 및 웹 클립 환경에서 깨짐 없는 글래스모피즘 + 고대비 다크/라이트 테마 지원.
   - 직관적인 바로가기/딥링크:
     - 일정 위젯 클릭 시 캘린더 모달/일정 뷰 직행.
     - 목표 위젯 클릭 시 목표 탭 및 목표 추가/수정 모달 직행.
     - 기록 위젯 클릭 시 스톱워치/타이머/기록 작성 모달 직행.
   - PWA 바탕화면 추가(Web Shortcuts, Widget Preview) 가이드 및 실시간 상태 동기화(`localStorage` + `BroadcastChannel`).

3. **단일 진실 공급원 및 직통 핸들러 (`js/components.js`)**:
   - `handle전체공통_Item62Action` 구현.
   - 12ms 햅틱 반응 (`triggerHaptic(12)`).
   - `og_task-62_cache` 로컬스토리지 영속화 (`widget_suite_enabled: true`, `widget_types: ['calendar', 'goals', 'records']`, `widget_sizes: ['compact', 'standard', 'detail']`).
   - Supabase upsert 비동기 동기화.
   - 헌법 제15조 제6항 4대 뷰 원자적 동시 전파.

4. **품질 검증 및 3자 동기화**:
   - 단위 테스트 `tests/desktop-widget-suite.test.js` 전수 통과.
   - 스모크 테스트 `scripts/smoke-test.js` 431개 전수 무결점 통과 (0개 실패).
   - GitHub Court Checks All Pass.
   - Tri-Sync(노션, 옵시디언, 관제센터) 100% 무결성 동기화.
