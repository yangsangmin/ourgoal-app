# 엔지니어링 작업계획서 (PLAN) — 데이터 가져오기 & 1초 샘플 전면 진단 및 무결성 개편

> **문서 ID**: PLAN-IMPORT-AND-SAMPLES  
> **요구사항 연계**: [REQ-IMPORT-AND-SAMPLES](file:///C:/dev/ourgoal-app/docs/specs/REQ-IMPORT-AND-SAMPLES.md)  
> **티켓 연계**: #TASK-ES-091  
> **작성 일시**: 2026-09-15  
> **작성자**: Antigravity (세션 ebe91d6b)  
> **규범 준수**: index.html 순증가 300줄 한도(승인선 8) 및 [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수

---

## 1. [원칙 ①] 파악: 엔지니어링 아키텍처 및 변경 범위
- **REQ 핵심 요약**:
  - '데이터 가져오기 & 1초 샘플' 모달에 원터치 1초 다이렉트 로드 버튼(`[⚡ 1초 로드]`), 선택 카드 시각적 강조, CSV/텍스트 실시간 데이터 표 미리보기, 샘플 데이터 일괄 정화/되돌리기 안전망(`[🧹 샘플 데이터만 정리]`), 현재 시점 기준 52주 동적 날짜 리베이스 구현.
- **영향 받는 파일 목록**:
  - `js/universal-stats.js`: 샘플 생성기 날짜 리베이스, `openUniversalImportModal` UI 및 1초 로더, 실시간 테이블 프리뷰, 샘플 정화 안전망
  - `ui.css`: 모달 내부 테이블 프리뷰 스타일, 선택 카드 활성화 뱃지 및 테두리 스타일
  - `scripts/test-universal-import.js`: 단위 및 시뮬레이션 테스트 신규 작성
  - `scripts/smoke-test.js`: #TASK-ES-091 회귀 검증 스모크 테스트 추가

---

## 2. [원칙 ②] 본질 · 중심 배선 파악 (Architecture & Wiring)
- **전역 상태(`state`) 영향 분석**:
  - `state.profile.records`: 샘플 융합 시 `isSample: true` 플래그를 포함하여 무손실 추가. 정리 시 `!r.isSample`만 보존.
  - `state.recordsSegment = 'stats'`: 로드 즉시 통계 뷰 자동 진입.
  - `state.univPeriod = 'all'`: 52주 전 기간 데이터가 즉시 콕핏 차트에 표출되도록 동기화.
- **데이터 흐름 다이어그램**:
  `[⚡ 1초 로드 클릭] -> [동적 52주 샘플 생성 (isSample: true)] -> [기존 기록 무손실 융합] -> [saveProfile()] -> [모달 닫기] -> [recordsSegment='stats' 전환 및 renderRecordsScreen()] -> [토스트 알림]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 한도 준수 여부 |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `js/universal-stats.js` | 모달 1초 로더, 테이블 프리뷰, 샘플 정화, 날짜 리베이스 | +180줄 | -40줄 | +140줄 | 모듈 파일 (한도 무관) |
| `ui.css` | 모달 프리뷰 테이블 및 활성화 카드 스타일 | +50줄 | 0줄 | +50줄 | CSS 파일 |
| `scripts/test-universal-import.js` | 신규 기능 라이프사이클 테스트 | +120줄 | 0줄 | +120줄 | 테스트 파일 |
| `scripts/smoke-test.js` | #TASK-ES-091 회귀 스모크 검증 | +25줄 | 0줄 | +25줄 | 테스트 파일 |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 실제 유저 데이터(`!r.isSample`)는 샘플 추가/삭제 시 단 1바이트도 손상되지 않는가? -> 네, filter 함수로 엄격히 분리 보존.
- [x] 모달 하단 스크롤 없이도 각 카드에서 즉시 로드가 가능한가? -> 네, 카드 내에 다이렉트 `[⚡ 1초 로드]` 버튼 배치.
- [x] CSV/텍스트 입력 시 유저가 어떤 데이터가 들어가는지 눈으로 확인할 수 있는가? -> 네, 상위 5행 실시간 Table Preview 제공.

---

## 5. [원칙 ⑤] 구현 절차 정리 (Step-by-Step Implementation Sequence)
1. **Step 1**: `js/universal-stats.js`의 `generate52WeekPowerliftingSample` 및 `generateDomainSample` 날짜를 현재 시점(`Date.now()`) 기준 52주로 리베이스하고 `isSample: true` 메타데이터 부여.
2. **Step 2**: `openUniversalImportModal` HTML에 카드별 `[⚡ 1초 로드]` 버튼, `[🧹 샘플 데이터만 정리]` 상단 액션 바, 실시간 CSV/텍스트 테이블 프리뷰 컨테이너 마운트.
3. **Step 3**: 이벤트 리스너 배선 (원터치 로드, 실시간 렌더링, 샘플 정화, 뷰 전환).
4. **Step 4**: `scripts/test-universal-import.js` 작성 및 `npm test` 통과 검증.
