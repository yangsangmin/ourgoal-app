# 작업계획서 (PLAN) — 전 탭 '💡 활용법' 중복 노출 단일화 및 통합 가이드 허브 구축

> **문서 ID**: PLAN-TAB-GUIDE-DEDUPLICATION  
> **티켓 연계**: #TASK-ES-126  
> **관련 규격서**: [REQ-TAB-GUIDE-DEDUPLICATION](file:///C:/dev/ourgoal-app/docs/specs/REQ-TAB-GUIDE-DEDUPLICATION.md)  
> **작성 일시**: 2026-09-16  
> **작성자**: Antigravity AI Engine  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수  

---

## 1. 개요 및 목적
- 상민님의 지시("아워골 모든 탭에 활용법이 중복적으로 들어가 있는데, 해결방안 표형태로 알기쉽게 정리해서 보고해. 1단계까지 진행해")에 따라 1단계(기획·설계 상태)를 수립하고,
- 상단 고정 바의 `💡 활용법` 버튼으로 진입점을 단일화하며, 각 탭 본문 헤더의 중복 버튼 6종을 제거하고 6대 탭을 유기적으로 넘나드는 통합 가이드 허브 모달을 설계한다.

---

## 2. 6단계 작업 프로세스 및 현황

| 단계 | 상태 명칭 | 작업 내용 및 마일스톤 | 진행 상태 |
| :--- | :--- | :--- | :---: |
| **1단계** | **기획·설계 상태** | 요구사항 정의서(REQ), 작업계획서(PLAN) 수립, 해결방안 비교표 보고 및 Tri-Sync 동기화 | **[완료 (현 위치)]** |
| **2단계** | **내부 시뮬레이션** | `index.html` 본문 중복 버튼 정리, `tab-guides.js` 6대 탭 통합 허브 배선, `smoke-test.js` 갱신 및 `npm test` 전수 통과 | **[승인 대기]** |
| **3단계** | **로컬 수동 확인** | 로컬 개발 서버(`localhost:8000`)에서 6대 탭 Topbar 1클릭 팝업 및 탭 스위처 실동작 검증 | **[승인 대기]** |
| **4단계** | **로컬 메인 병합** | `feature/es-126-tab-guide-dedup` 브랜치를 로컬 `main`에 fast-forward 병합 및 Vercel 프리뷰(5A) 자동 배포 | **[승인 대기]** |
| **5단계** | **실서버 배포** | 상민님 명시적 승인 시 프로덕션 배포 및 라이브 릴리즈 | **[승인 대기]** |
| **6단계** | **실운영 최종 확인** | 실제 서비스 도메인(`ourgoal-app.vercel.app`)에서 모바일/데스크톱 라이브 환경 최종 점검 | **[승인 대기]** |

---

## 3. 세부 구현 계획 (2단계 진입 시 실행 내용)

### Phase 1. `js/tab-guides.js` 6대 탭 통합 가이드 허브 엔진 확장
1. `TAB_GUIDES.records` 키 신설 (성취 통계, 시간 기록, 회고 등 기록 탭 핵심 활용법 완비).
2. `showTabUsageGuide(activeTab)` 모달 상단에 6대 탭 세그먼트 버튼(`🏠 홈 | 🎯 목표 | 📅 일정 | ✍️ 기록 | 💬 소통 | ⚙️ 설정`) 렌더링.
3. 세그먼트 버튼 클릭 시 모달을 닫지 않고 해당 탭 가이드 내용으로 매끄럽게 인라인 전환(Dynamic Switching).

### Phase 2. `index.html` 본문 중복 버튼 정리 및 탑바 최적화
1. 6대 탭 본문 헤더 내 `[💡 이 페이지 활용법 보기]` 중복 버튼 안전 제거:
   - 홈 탭: `#homePageGuideBtn` 제거
   - 목표 탭: `#goalsPageGuideBtn` 제거
   - 일정 탭: `#calPageGuideBtn` 제거
   - 기록 탭: `#recAnalyticsGuideBtn` 제거
   - 소통 탭: `#commPageGuideBtn` 제거
   - 설정 탭: `#settingsPageGuideBtn` 제거
2. 상단 고정 탑바의 `#topHomeGuideBtn`이 현재 탭(`state.activeTab`)의 상태를 정확히 반영하여 통합 가이드 허브를 즉시 호출하도록 이벤트 바인딩 정비.

### Phase 3. 무결성 검증 및 안전핀 갱신
1. `scripts/smoke-test.js` 내의 기존 단언문을 "통합 탑바 퀵액션 및 6대 탭 완전 통합 가이드 허브" 검증으로 최신화.
2. `npm test` 전수 264개 이상 ALL PASS 달성.
3. 22,196줄 스마트 안전핀 규칙 준수.

---

## 4. 1단계 산출물 검증 내역
- [x] 컨트롤타워 `.task-links/a0a58f30.json` 생성 완료
- [x] 작업계획서 `.codex/작업계획서/a0a58f30.md` 생성 완료
- [x] 요구사항 정의서 `docs/specs/REQ-TAB-GUIDE-DEDUPLICATION.md` 생성 완료
- [x] 작업계획서 `docs/specs/PLAN-TAB-GUIDE-DEDUPLICATION.md` 생성 완료
- [x] Tri-Sync 3자 상호 동기화 무결성 100% 검증 완료
