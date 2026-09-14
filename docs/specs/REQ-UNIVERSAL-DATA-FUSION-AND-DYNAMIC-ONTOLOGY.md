# 요구사항 정의서 (SRS) — 유니버설 데이터 자율 융합·동적 다형성 온톨로지 및 프로페셔널 데이터 콕핏 시스템 (전수 정밀본)

**문서 ID**: REQ-UNIVERSAL-DATA-FUSION-AND-DYNAMIC-ONTOLOGY  
**티켓 연계**: #TASK-ES-061 (유니버설 데이터 자율 융합·동적 온톨로지 및 고밀도 관리 시스템)  
**작성 일시**: 2026-09-14  
**본질 축**: E2 (기록·회고) / E1 (체크인 루프) / E3 (목표 연계)  
**우선순위**: P0 (데이터 주권, 자율 분석 및 전사적 생태계 연계)  
**벤치마크 아키텍처**: 
- **Notion & Airtable**: EAV(Entity-Attribute-Value) 다형성 스키마 및 컨텍스트 감응형 필드 매핑
- **TradingView & Bloomberg**: 정밀 십자선(Crosshair), 자석 스내핑, $\Delta$(변동폭) 실시간 인스펙터, 다축/정규화(Normalized %) 스케일링
- **Datadog & Kaggle**: 다차원 도메인-모달리티-피처 패싯 분류 및 메타데이터 인덱싱
- **Apple HealthKit**: 지능형 물리 단위(`HKUnit`) 감지 및 자동 환산 엔진

---

## 1. 개요 및 시스템 목적 (System Purpose)

본 시스템은 아워골 내에서 작성되는 모든 일상 실천 기록과 외부에서 대량 인입되는 **이종(Heterogeneous) 데이터(52주 156세션 주기화 파워리프팅 데이터, 100년 전 1924년 파리 올림픽 실측 데이터, 학술 연구·논문 실험 지표, 지적 독서 완독량, 업무·비즈니스 KPI, 자산·재테크 추이 등)**를 100% 무손실 융합하고, 불필요한 감성적 미사여구를 전면 배제한 채 **최고밀도 정보량(High Information Density)과 수학적·기술적 정밀성(Technical Precision)**을 기반으로 시각화·탐색·관리하는 **전문가급 다차원 데이터 콕핏(Professional Data Cockpit)**을 구축하는 것을 목적으로 한다.

---

## 2. 수학적·통계적 정밀 지표 산출 규격 (Mathematical & Statistical Formulations)

감성적 문구를 일체 배제하고, 차트 상단 콕핏 KPI 바에 다음 4대 정량 지표를 오차 없이 산출하여 Monospace 숫자로 표출한다.

### 2.1. PEAK (역대 최고 관측치 및 달성 일시)
$$\text{PEAK} = \max_{t \in T} \{ V(t) \}, \quad t_{\text{peak}} = \arg\max_{t \in T} \{ V(t) \}$$
- **동작 규격**: 활성 선택된 엔티티 시계열에서 관측된 절대 최대값과 해당 시점의 타임스탬프를 `106.0 kg (1924.05.04)` 또는 `450 pages (2025.08.12)` 형태로 정밀 표기.
- **다중 선택(Multi) 모드 시**: 각 종목별 최고치를 콤팩트 태그 배열로 병렬 노출하거나 총합 Peak 산출.

### 2.2. LATEST (최신 세션 관측치)
$$\text{LATEST} = V(t_{\max}), \quad t_{\max} = \max \{ t \}$$
- 가장 최근 기록된 데이터 포인트의 수치와 단위를 표출.

### 2.3. NET DELTA (순 성장 절대량 및 성장률)
$$\Delta V = V(t_{\max}) - V(t_{\min})$$
$$\text{Growth Rate (\%)} = \begin{cases} 
\left( \frac{V(t_{\max}) - V(t_{\min})}{V(t_{\min})} \right) \times 100\%, & \text{if } V(t_{\min}) > 0 \ 
0\%, & \text{if } V(t_{\min}) = 0 
\end{cases}$$
- 시작 관측점 대비 최종 관측점의 절대 증가량($\Delta$)과 백분율($\%$)을 `+32.0 kg (+43.8%)` 형식으로 표기.
- 양수는 에메랄드(`#10b981`), 음수는 로즈(`#ef4444`), 변동 없음은 슬레이트(`#64748b`) 컬러 적용.

### 2.4. VELOCITY (단위 시간당 성장 속도 및 페이스)
$$\text{Velocity} = \frac{\Delta V}{\Delta t_{\text{weeks}}} = \frac{V(t_{\max}) - V(t_{\min})}{(t_{\max} - t_{\min}) / (7 \times 86400000)}$$
- 전체 관측 기간 동안 주당 평균 변화 속도를 산출 (`+0.62 kg/week`, `+28.5 pages/week`, `+1.4 hrs/week`).

### 2.5. 7일 / 30일 단순 이동평균선 (Simple Moving Average, SMA)
$$\text{SMA}_k(t) = \frac{1}{k} \sum_{i=0}^{k-1} V(t - i)$$
- 노이즈가 심한 일별 실천 데이터의 기저 추세를 관측하기 위한 스무딩 추세선 오버레이 지원 (선택형 토글).

### 2.6. 상대 성장률 정규화 지수 (Normalized Index Scale)
서로 다른 물리 단위(중량 kg vs 독서 쪽수 vs 집중 시간 hr)를 한 화면에서 다중 비교할 수 있도록 기준 시점($t_0$)을 100으로 정규화하는 인덱스 변환 공식:
$$I_i(t) = \left( \frac{V_i(t)}{V_i(t_0)} \right) \times 100$$
- Linear 모드에서는 각 단위별 스케일(Y축)을 적용하고, Normalized 모드에서는 모든 곡선이 100% 기준선에서 출발하여 상대 성장률을 한 차트에서 완벽 비교.

---

## 3. 세부 기능 요구사항 정밀 명세 (Functional Specifications)

### [FR-01] 테크니컬 콕핏 아코디언 컨테이너 (Technical Cockpit Accordion)
1. **헤더 레이아웃 (Header Ergonomics)**:
   - 좌측: 테크니컬 아이콘 `📊` + `[ANALYTICS] 자율 다차원 통계 분석기` (볼드 Monospace 계열) + 활성 엔티티 카운트 배지 (`3 Series`).
   - 우측: `[DATA GRID]` 버튼, `[EXPORT CSV]` 버튼, `[▼ / ▲]` 토글러를 정밀 그리드로 1행 배치.
2. **영구 상태 보존**:
   - `localStorage.getItem('ourgoal_uStats_expanded')` 키로 브라우저 로컬 저장.
   - 최초 방문 기본값: `collapsed`(접힘). 유저가 한 번 펼치면 이후 세션에서도 펼침 상태 유지.
3. **0-Lag SVG 컨테이너 실측 렌더링**:
   - 아코디언이 펼쳐질 때 `transitionend` 또는 `requestAnimationFrame`을 통해 DOM 요소의 `getBoundingClientRect().width`를 정확히 실측.
   - 실측된 가로 픽셀(px)을 기반으로 SVG `viewBox`와 눈금 스케일을 0초 만에 재계산하여 선 왜곡, 라벨 겹침, 0x0 렌더링 결함을 물리적으로 차단.

### [FR-02] 7-Tier 정밀 시계열 슬라이싱 (Precision Time Slicing)
1. **7단 슬릭 탭 바**:
   - `[ALL]`, `[1Y]`, `[6M]`, `[3M]`, `[1M]`, `[1W]`, `[3D]` 모노크롬 하이테크 알약 탭.
2. **데이터셋 기준 상대 윈도우 슬라이싱 알고리즘**:
   - `refDate` 계산:
     $$\text{refDate} = \max_{r \in \text{allRecs}} \{ \text{new Date}(r.\text{startAt}).\text{getTime}() \}$$
     (데이터셋이 과거 1924년 데이터든, 현재 2026년 데이터든 해당 데이터셋의 마지막 세션 시점을 기준점으로 자동 채택)
   - 윈도우 컷오프:
     - `3D`: $\text{cutoff} = \text{refDate} - 3 \times 86,400,000$
     - `1W`: $\text{cutoff} = \text{refDate} - 7 \times 86,400,000$
     - `1M`: $\text{cutoff} = \text{refDate} - 30 \times 86,400,000$
     - `3M`: $\text{cutoff} = \text{refDate} - 92 \times 86,400,000$
     - `6M`: $\text{cutoff} = \text{refDate} - 183 \times 86,400,000$
     - `1Y`: $\text{cutoff} = \text{refDate} - 370 \times 86,400,000$ (52주 주기화 전 세션 수용을 위해 370일 버퍼 부여)
     - `ALL`: $\text{cutoff} = \text{null}$ (1970년 이전 음수 타임스탬프를 포함한 전수 수용)
3. **무결성 방어**:
   - 컷오프 필터링 후 잔여 포인트가 0개일 경우, 빈 화면 대신 `“NO OBSERVED DATA IN RANGE — EXPAND TO [ALL]”` 진단 패널 노출.

### [FR-03] [노션식 EAV] 다형성 패싯 온톨로지 매니저 & 한글 초성 검색 & 스키마 CRUD
1. **한글 유니코드 초성 분해 수학 알고리즘 (Hangul Chosung Decomposition)**:
   - 한글 음절 코드 포인트 연산:
     $$S = \text{charCodeAt}(i) - 44032 \quad (0xAC00)$$
     $$L = \lfloor S / 588 \rfloor \quad (0 \le L \le 18)$$
   - 초성 테이블 매핑:
     `['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']`
   - 검색 입력값(`query`)이 순수 자음(초성)으로 구성된 경우(`/^[ㄱ-ㅎ]+$/`), 대상 엔티티 명칭의 초성 문자열을 추출하여 정밀 매칭:
     - `ㅂ` 또는 `ㅂㅊ` ➔ `벤치프레스` (초성: `ㅂㅊㅍㄹㅅ`)
     - `ㅅㅋ` 또는 `ㅅ` ➔ `스쿼트` (초성: `ㅅㅋㅌ`)
     - `ㄷㅅ` ➔ `독서` (초성: `ㄷㅅ`)
   - 0-Latency 인덱싱: 사전에 엔티티별 초성 해시 테이블을 빌드하여 타이핑 도중 1ms 이내 드롭다운 추천.
2. **동적 패싯 온톨로지 트리 (Dynamic Facet Tree)**:
   - 계층 구조:
     - **도메인 (Domain)**: 건강·운동(`health`), 학습·역량(`learning`), 업무·커리어(`career`), 재테크·자산(`finance`), 멘탈·회고(`mind`), 일상·루틴(`routine`), 취미·창작(`hobby`), 관계·소통(`relationship`)
     - **카테고리 (Category)**: 웨이트, 유산소, 어학, 수험, 프로그래밍, 독서, 프로젝트, 투자 등
     - **엔티티 (Entity)**: 스쿼트, 벤치프레스, 영단어 암기, 코딩테스트, 독서노트 등
   - **온디맨드 컴팩트 노출**: 백엔드 전체 마스터 카테고리 중 유저의 실제 데이터가 존재하는 브랜치만 스마트하게 활성화.
3. **사용자 직접 스키마 CRUD (Custom Taxonomy Engine)**:
   - **[+ Schema Add]**: 도메인 선택, 신규 엔티티명, 1차 지표 키(`metric_key`), 1차 단위(`unit`), 2차 지표 키/단위 정의.
   - **[Modify Schema]**: 엔티티명 또는 단위 변경 시 `state.profile.records` 내의 관련 메트릭을 안전하게 일괄 캐스케이딩(Cascading update).
   - **[Delete Schema]**: 스키마 삭제 시 해당 분류의 실제 실천 데이터는 절대 삭제되지 않고 상위 도메인 또는 `daily`로 안전 이동(Soft-fallback).

### [FR-04] 도메인 중립 엔터프라이즈 데이터 그리드 (Enterprise Data Grid)
1. **컨텍스트 인식 동적 컬럼 헤더 매핑 (Context-Aware Table Mapping)**:
   - 웨이트 전용 용어(`1RM`, `총 볼륨`) 하드코딩 완전 배제.
   - 선택된 도메인/엔티티의 `metrics` 키를 분석하여 테이블 헤더 자동 적응:
     | 데이터 도메인 | 컬럼 1 (일시) | 컬럼 2 (항목) | 컬럼 3 (Primary Metric) | 컬럼 4 (Secondary Metric) | 컬럼 5 (Notes) | 액션 |
     | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
     | **📚 독서/학습** | Date | Title | **Pages (쪽)** | **Reading Time (분)** | Memo | Edit / Del |
     | **🔬 학술/연구** | Date | Topic | **Progress (%)** | **Deep Work (hr)** | Memo | Edit / Del |
     | **🏃 유산소/러닝** | Date | Activity | **Distance (km)** | **Pace / Duration** | Memo | Edit / Del |
     | **🏋️ 근력/체육** | Date | Exercise | **Peak 1RM (kg)** | **Total Volume (kg)** | Memo | Edit / Del |
     | **💰 재테크/자산** | Date | Asset/Item | **Amount (원)** | **Return Rate (%)** | Memo | Edit / Del |
     | **📝 임의 CSV** | Date | Entity | **Col 1 (실제 헤더명)** | **Col 2 (실제 헤더명)** | Memo | Edit / Del |
2. **모노스페이스 다차원 컬럼 정렬 (Multi-Column Sorting Engine)**:
   - 숫자 컬럼 Monospace 우측 정렬.
   - 컬럼 헤더 클릭 시 3상태 상태 머신 순환: `None ➔ Descending(내림차순) ➔ Ascending(오름차순) ➔ None`.
   - 최고 수치 관측치, 최대 볼륨, 과거순, 최신순 원클릭 소팅.
3. **원자적 CRUD (Atomic Operations)**:
   - **[+ Add Entry]**: 날짜(1900년대 완벽 지원), 엔티티, 주요 수치, 보조 수치, 텍스트 메모 입력 즉시 `records`에 융합.
   - **[✏️ In-place Edit]**: 기존 값 프리필 모달에서 수정 시 고유 ID와 타임스탬프 순서 무결성 유지 갱신.
   - **[🗑️ Delete]**: 단건 확인 후 즉시 안전 삭제.
4. **배치 일괄 관리 및 소스 필터 (Batch Operations & Source Tags)**:
   - 헤더 전체 선택 체크박스 + 선택 항목 N개 일괄 삭제 (Bulk Delete).
   - 소스 태그 필터: `[All Sources]`, `[Manual In-App]`, `[CSV 52W Big3]`, `[Historical 1924]`, `[Custom Upload]` 등 특정 인입 묶음만 원클릭 필터링 및 리셋 지원.
5. **정본 클린 CSV 내보내기 (Export Clean CSV)**:
   - 유저가 아워골 안에서 편집·수정·정제한 최종 데이터를 표준 UTF-8 (BOM 포함 엑셀 호환) CSV로 1초 다운로드.
6. **1,000건 대량 시계열 지연 페이징 (Lazy Paging)**:
   - 한 번에 30건씩 슬라이스 렌더링 + `[+ Load More (30 / Total)]`로 10,000건 이상의 데이터에서도 모바일 프레임 드랍 0건 보장.

### [FR-05] 프로급 SVG 차트 렌더러 & 십자선 크로스헤어 인스펙터
1. **수학적 축 스케일링 & 그리드 엔진**:
   - **Nice Numbers 알고리즘**: 데이터 최소값과 최대값에 맞춰 눈금 분할을 $[1, 2, 2.5, 5, 10] \times 10^n$ 단위로 균등 분할.
   - 5~8개의 수평 보조 격자선(`stroke: var(--rule)`, `stroke-dasharray: 2 2`) 및 Monospace Y축 라벨.
   - X축: 다년도 또는 1900년대 데이터 감지 시 `1924.05` 형태의 연도.월 정밀 표기.
2. **십자선 크로스헤어 (Crosshair & Snapping)**:
   - 마우스 호버 또는 터치 드래그 시 커서 X/Y 위치에 정밀 점선 크로스헤어 렌더링.
   - 가장 가까운 데이터 포인트로 자석 스냅(Magnetic Snapping, 반경 20px 이내).
3. **실시간 플로팅 인스펙터 툴팁**:
   - 화면 경계를 감지하여 잘리지 않는 플로팅 인스펙터 박스 출력:
     - 정확한 일시: `YYYY-MM-DD HH:mm:ss`
     - 관측값: `Value + Unit` (예: `105.0 kg`, `120 min`)
     - 직전 세션 대비 증감: $\Delta +2.5\text{ kg} \quad (+2.4\%)$
     - 최고 기록(PR) 여부: 골드스타(★) 배지
     - 세션 메모 요약
     - **`[Edit Record]` 버튼**: 인스펙터에서 바로 해당 행 수정 팝업 오픈.
4. **8종 다중 시계열 고대비 컬러 팔레트 (WCAG AAA 준수)**:
   - Series 1: `#3b82f6` (Royal Blue)
   - Series 2: `#10b981` (Emerald Green)
   - Series 3: `#f59e0b` (Amber Gold)
   - Series 4: `#f43f5e` (Rose Crimson)
   - Series 5: `#8b5cf6` (Deep Purple)
   - Series 6: `#06b6d4` (Cyan)
   - Series 7: `#ec4899` (Pink)
   - Series 8: `#64748b` (Slate Gray)

### [FR-06] 전사적 생태계 연계 및 데이터 무결성
1. **데이터 ↔ 목표(Goal) 진척도 자동 동기화**:
   - 데이터 추가/수정 시, 유저의 `state.profile.goals` 중 `subTheme` 또는 `exercise` 명칭이 일치하는 목표 탐색.
   - 목표의 `currentValue`를 최신 또는 최고치로 자동 갱신하고, 마일스톤 완료율을 실시간 재계산.
   - 대시보드 내 `[🎯 Link to Goal / Create Goal]` 버튼 제공.
2. **AI 분석 ↔ 1-클릭 로컬 캘린더 등록 (서버/비용 부담 0원)**:
   - Gemini AI 시계열 리포트에서 생성된 추천 액션을 클라이언트가 JSON 파싱:
     ```json
     { "title": "독서 집중 90분 세션", "date": "2026-09-17", "time": "20:00" }
     ```
   - 유저가 `[📅 Register Action to Calendar]` 클릭 시 추가 네트워크 호출 없이 `state.profile.calendar.push(...)` 및 `saveProfile()`로 0초 연동.
3. **고해상도 테크니컬 분석 카드 스냅샷 (Snapshot Export)**:
   - 차트 SVG 노드와 4대 정량 KPI를 인메모리 HTML5 Canvas($2\times$ Retina)에 렌더링.
   - 테크니컬 워터마크가 포함된 고화질 PNG 이미지로 클립보드 복사 또는 파일 다운로드.
4. **기록 헤더 가이드 버튼**:
   - `기록 - 나만보기` 우측에 `[💡 Guide: How to Use Analytics]` 버튼 배치.
   - 분석기 콕핏의 100% 활용법 및 데이터 주권 안내 모달 제공.
5. **단일 원장 무충돌 보장**:
   - 모든 수정/삭제는 `state.profile.records` 단일 소스 오브 트루스(SSOT)를 경유하며, 로컬 삼중 백업 및 Supabase DB와 트랜잭션 동기화.

---

## 4. 데이터 모델 및 스키마 규격 (EAV Polymorphic JSON)

```json
{
  "id": "rec_20260914_103000_abc123",
  "theme": "learning",
  "subTheme": "독서/책읽기",
  "item": "클린 아키텍처",
  "text": "[독서/책읽기] 45쪽 완독 (총 120분) - 도메인 주도 설계 챕터 독파",
  "startAt": "2026-09-14T10:30:00.000Z",
  "endAt": "2026-09-14T12:30:00.000Z",
  "createdAt": "2026-09-14T10:30:00.000Z",
  "metrics": {
    "primary": 45,
    "primaryUnit": "쪽",
    "secondary": 120,
    "secondaryUnit": "분",
    "pages": 45,
    "duration": 120,
    "rpe": 85
  },
  "rawRow": {
    "date": "2026-09-14",
    "book": "클린 아키텍처",
    "pages": "45",
    "minutes": "120"
  },
  "source": "manual_entry",
  "visibility": "private"
}
```

---

## 5. 화면 흐름도 및 상태 전이도 (Screen Flow)

```
[기록 탭 상단 헤더]
   │
   ├─ [💡 Guide: How to Use Analytics] ──> [테크니컬 활용 가이드 모달]
   │
   └─ [📊 [ANALYTICS] 자율 다차원 통계 분석기] (기본: 접힘 상태)
        │
        ▼ (토글 펼침 ──> 0-Lag 컨테이너 너비 실측 및 SVG 차트 리사이즈)
        │
        ├─ [CONTROL BAR]
        │    ├─ 7-Tier Period: [ALL] | [1Y] | [6M] | [3M] | [1M] | [1W] | [3D]
        │    ├─ Scale Mode: [Linear] | [Normalized %]
        │    └─ [🔍 Facet Taxonomy Explorer] ──> [패싯 온톨로지 매니저 모달]
        │                                           ├─ 초성 분해 고속 검색 ('ㅂㅊ' -> '벤치프레스')
        │                                           ├─ 유저 데이터 기반 도메인-엔티티 패싯 트리
        │                                           └─ [+ CREATE/MODIFY/DELETE SCHEMA] (단위 정의)
        │
        ├─ [QUANTITATIVE STATS BAR]: PEAK | LATEST | NET DELTA | VELOCITY
        │
        ├─ [PRO SVG CHART (Multi-Series Overlay)]
        │    ├─ 십자선(Crosshair) 호버 ──> 정밀 인스펙터 툴팁 (일시, 수치, Δ)
        │    │                               └─ [Edit Record] 클릭 시 수정 모달 직행
        │    └─ [📸 Snapshot Card] ──> [고해상도 차트 분석 카드 복사/저장]
        │
        ├─ [AI DIAGNOSTIC REPORT] ──> [📅 Register Action to Calendar] (비용 0원)
        │
        └─ [DATA GRID] 버튼 ──> [엔터프라이즈 데이터 그리드 모달]
                                   ├─ 도메인별 자동 컬럼 헤더 매핑 (쪽/분, hr/%, kg/볼륨)
                                   ├─ Monospace 숫자 컬럼 원클릭 다차원 정렬 (Date, Metric 1, 2)
                                   ├─ [+ Add Entry] / [✏️ Edit] / [🗑️ Delete]
                                   ├─ [Select All] & [Bulk Delete Selected] (대량 정리)
                                   ├─ [Source Tag Filter] (In-App, 52W, 1924, Custom CSV)
                                   ├─ [📥 Export Clean CSV]
                                   └─ [Lazy Paging: 30 items/page]
```

---

## 6. 비기능적 제약사항 및 거버넌스 (Constraints)

1. **index.html 순증가 300줄 한도 엄수**:
   - 모든 UI 렌더링, 크로스헤어, 데이터 그리드, 온톨로지 매니저 로직은 `js/universal-stats.js`에 완벽 모듈화.
   - `index.html`은 단순 마운트 및 브릿지 코드만 최소화하여 에센스 게이트 통과.
2. **Vercel Serverless Function 12개 한도 불변**:
   - 신규 서버리스 엔드포인트 증설 없이 순수 클라이언트 EAV 아키텍처로 구현.
3. **Tri-Sync 100% 무결성 유지**:
   - 노션, 옵시디언, 관제센터 3자 동기화 상태 지속 검증.
4. **직관적 6단계 보고 헌법 준수**:
   - 작업 착수 및 완료 시 물리적 구동 의미를 담은 6단계 상태 명시.
