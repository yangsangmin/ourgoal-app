# PLAN-TASK-ES-313: 기기 바탕화면용 위젯 기능(일정·목표·기록 3종 × 3가지 구성) 개발 완결 실행 계획서

## 1. 목적 및 배경
- 아워골 일정, 목표, 기록하기 기능을 앱에 진입하지 않고도 기기 바탕화면(홈 화면)에서 한눈에 확인하고 바로 사용할 수 있도록 3종 기능 × 3개 크기 구성(총 9개 위젯) 완결.
- 각 기능의 크기와 시인성, UI/UX를 극대화하여 데스크톱/모바일 바탕화면 어디서나 최적화된 정보 인지 및 원터치 딥링크 경험 제공.

## 2. 작업 순서
1. **`widget.html` 렌더링 무결성 및 UX 고도화**:
   - `calendar` (일정): compact(다음 일정 1개), standard(오늘의 일정 3개), detail(24시간 풀 타임라인).
   - `goals` (목표): compact(최우선 목표 1개 + 달성률 바), standard(주요 목표 3개 + 프로그레스), detail(목표 전체 목록 + 마일스톤 현황).
   - `records` (기록): compact(오늘의 집중 시간 및 최근 기록 1개), standard(최근 기록 3개 타임로그), detail(주간 누적 기록 통계 + 최근 실천 리스트).
   - 실시간 로컬스토리지 연동 및 딥링크(`index.html#calendar`, `index.html#goals`, `index.html#records`) 지원.
   - 글래스모피즘 스타일, 반응형 레이아웃, 고대비 타이포그래피.

2. **`js/components.js` 직통 액션 핸들러 구현**:
   - `handle전체공통_Item62Action` 구현 및 `OurgoalComponents`, `window`, `module.exports` 노출.
   - 12ms 햅틱 반응, `og_task-62_cache` 로컬스토리지 영속화, 4대 뷰 원자적 동시 전파.

3. **`docs/rules/TICKETS.md` 티켓 등록**:
   - `#TASK-ES-313` 진행중 등록.

4. **단위 및 스모크 테스트 작성/검증**:
   - `tests/desktop-widget-suite.test.js` 작성 및 통과.
   - `scripts/smoke-test.js`에 `#TASK-ES-313` 단언문 추가 및 431개 전수 무결점 통과 (0개 실패).

5. **법정 claims.json 작성 및 사전 검증**:
   - `reports/TASK-ES-313/claims.json` 작성 및 통과.

6. **Git 커밋, 푸시, PR 생성 및 머지**:
   - GitHub Actions Court All Pass 확인 및 squash 머지.

7. **`TICKETS.md` 완료 반영 PR 및 머지**.

8. **Tri-Sync 3자 상호 동기화 무결성 100% 달성 및 보고**.
