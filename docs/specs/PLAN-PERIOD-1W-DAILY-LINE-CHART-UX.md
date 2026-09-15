# [PLAN-PERIOD-1W-DAILY-LINE-CHART-UX] 기출문제 1W 하루단위 꺾은선 그래프 및 전 기간 시인성 극대화 계획서

- **티켓**: #TASK-ES-094
- **본질 태그**: [E2] 5단위 회고 및 전문 통계 콕핏 시계열 시인성 만족
- **작성 일시**: 2026-09-15
- **담당**: Antigravity (상민님 지시 완결)
- **규범 준수**: OURGOAL_ABSOLUTE_INTEGRITY_RULES (헌법 제2조, 제18조, 제19조)

---

## 1. 파일별 변경량 예산 및 격리 방침
- **js/universal-stats.js**:
  - generateDomainSample('study'): 최근 7일(D-6 ~ D-0) 일일 기출문제 풀이 세션 완비 (약 25줄).
  - enderMultiSeriesSvg: 1W 7일간의 하루단위 시간 축 정렬, 요일 표기 및 기간별 포인트/눈금 시인성 최적화 (약 45줄).
  - 예산: 순증가 80줄 이내.
- **scripts/smoke-test.js**:
  - #TASK-ES-094 1W 하루단위 꺾은선 및 기간별 시인성 컴플라이언스 체크 (약 35줄).
- **scripts/test-universal-stats-ux.js**:
  - 기출문제 1W 7포인트 검증 및 x축 요일 렌더링 단위 테스트 (약 35줄).
- **index.html**:
  - 순증가 0줄 엄수.

---

## 2. 8단계 엔지니어링 실행 계획
1. **1단계 (기획·설계)**: REQ/PLAN 수립, task-link 갱신, Obsidian Vault 동기화.
2. **2단계 (시뮬레이션 및 구현)**:
   - 기출문제 샘플에 최근 7일 연속 일일 데이터 생성.
   - enderMultiSeriesSvg에 1w 하루단위 x축 렌더링 및 1M/3M/1Y/ALL 시인성 튜닝.
   - 
pm test 전수 통과 (242개+).
3. **3단계 (로컬 수동 확인)**: http://localhost:8000 환경에서 기출문제 1W 및 전 기간 차트 실제 렌더링 스크린샷 캡처 및 상민님 보고.
4. **4단계 (메인 병합)**: PR 및 main 브랜치 병합.
5. **5~6단계 (배포 및 실운영 확인)**: Vercel 프로덕션 배포 및 최종 검증.
