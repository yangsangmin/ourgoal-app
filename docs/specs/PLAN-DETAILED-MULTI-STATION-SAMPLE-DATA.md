# [PLAN-DETAILED-MULTI-STATION-SAMPLE-DATA] 하이록스 8대 스테이션 및 전 테마 세부 종목별 실측 기록·페이스·체감강도(RPE) 구축 계획서

- **티켓**: #TASK-ES-095
- **본질 태그**: [E2] 5단위 회고 및 다차원 전문 통계 콕핏
- **작성 일시**: 2026-09-15
- **담당**: Antigravity (상민님 지시 완결)
- **규범 준수**: OURGOAL_ABSOLUTE_INTEGRITY_RULES (헌법 제2조, 제18조, 제19조)

---

## 1. 파일별 변경량 예산 및 격리 방침
- **`js/universal-stats.js`**:
  - 하이록스 세부 샘플 생성기 (`generateDomainSample('hyrox')`):
    - 단일 완주시간 대신 8대 공식 스테이션(스키에르그, 슬레드푸시, 슬레드풀, 버피점프, 로잉, 파머스캐리, 샌드백런지, 월볼샷) + 인터벌러닝 총 9개 종목 세션 생성.
    - 각 종목별 메트릭: `record` (기록 초/분), `pace` (페이스), `rpe` (체감강도 1~10 / RPE 점수).
    - 최근 7일(D-6 ~ D-0) 일별 세션도 전 종목에 걸쳐 완비.
  - 파워리프팅, 러닝, 공부, 개발, 영업 등 다른 테마들의 생성기도 세부 엔티티 및 RPE/페이스 메트릭 보강.
  - `extractUnifiedOntology` & `aggregateMultiSeries`:
    - `rpe`, `intensity`, `pace` 메트릭을 기본 차원 목록(`availableDims`)에서 인식하도록 매핑.
    - dimDisplayNames에 `rpe: '체감강도(RPE)'`, `pace: '페이스'`, `record: '기록'` 추가.
  - 예산: 순증가 약 150줄 이내.
- **`scripts/smoke-test.js`**:
  - `#TASK-ES-095` 하이록스 8대 스테이션 및 타 테마 세부 종목별 기록/페이스/RPE EAV 검증 (약 40줄).
- **`scripts/test-universal-stats-ux.js`**:
  - 하이록스 9개 세부 엔티티 추출, 종목별 RPE 및 페이스 지표 파싱, 콕핏 렌더링 단위 테스트 (약 40줄).
- **`index.html`**:
  - **순증가 0줄 절대 엄수**.

---

## 2. 8단계 엔지니어링 실행 계획
1. **1단계 (기획·설계)**: REQ/PLAN 수립, task-link 갱신, Obsidian Vault 동기화.
2. **2단계 (내부 시뮬레이션 및 구현)**:
   - `generateDomainSample('hyrox')` 전면 개편: 8대 스테이션 + 인터벌러닝 총 9개 종목의 52주 및 최근 7일 일별 실측 데이터 생성.
   - 각 레코드에 `record`, `pace`, `rpe`, `intensity`, `primary`, `secondary` 및 단위(`초`, `분`, `RPE`, `초/km` 등) 완비.
   - 헬스(3대 파워리프팅), 러닝, 공부 등 타 도메인에도 RPE 및 세부 지표 확장.
   - `aggregateMultiSeries` 및 `renderMultiSeriesSvg`와 `dimDisplayNames`에 RPE, 페이스, 기록 디멘션 등록.
   - 단위 테스트 및 스모크 테스트 작성, `npm test` 243개+ 전수 통과.
3. **3단계 (로컬 수동 확인)**: `http://localhost:8000` 환경에서 하이록스 로드 후 8대 스테이션 칩 바, RPE/페이스 디멘션 전환, 꺾은선 차트 스크린샷 캡처 및 전수 보고.
4. **4단계 (메인 병합)**: PR 및 main 브랜치 병합.
5. **5~6단계 (배포 및 실운영 확인)**: Vercel 프로덕션 배포 및 최종 검증.
