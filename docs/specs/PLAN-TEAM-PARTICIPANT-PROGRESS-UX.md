# 작업계획서: #TASK-ES-111 참가 팀원 달성현황 UI 효율화 및 1열 가로 인라인 컴팩트 개편

## 1. 아키텍처 및 변경 대상
1. **ui.css**:
   - .tg-participants-section: 카드 패딩 및 보더 정돈.
   - .tg-participant-row: 1열 가로 인라인 레이아웃 (display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; min-height: 40px;).
   - .tg-p-left: 아바타, 이름, 역할, 마일스톤 완료 상태를 수평 1행으로 배치 (display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1;).
   - .tg-p-name: 볼드 텍스트 및 말줄임 처리.
   - .tg-p-role: 산뜻한 마이크로 뱃지.
   - .tg-p-status: · 마일스톤 X/Y 완료 한 줄 텍스트.
   - .tg-p-right: 달성률 텍스트, 슬림 미니 바, 액션 버튼군 수평 배치.
   - .tg-p-accordion-header: 클릭 시 접힘 토글 지원.
2. **js/team-linked-goals.js**:
   - enderTeamGoalCardSections(g, tg, canManage) 내부의 참가 팀원 렌더링을 신규 CSS 클래스 기반의 1열 가로 인라인 구조로 개편.
   - 아코디언 토글 이벤트 핸들러(data-tgparttoggle) 바인딩 추가.
3. **scripts/smoke-test.js**:
   - #TASK-ES-111 검증 스위트 추가: 1열 가로 인라인 구조, 클래스 존재, 아코디언 헤더, 기존 셀렉터 보존 검증.

## 2. 일정 및 상한선
- 상한선: **4단계: 로컬 메인 병합 및 5A 프리뷰 배포** (헌법 제18조).
- 체크리스트 8단계 완료 후 상민님께 배포 승인 요청.
