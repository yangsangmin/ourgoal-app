# PLAN-TASK-ES-329: [78] 목표 데이터받기·기록 내보내기 하단 '데이터분석 프롬프트 백과사전' 신설 실행계획서

## 1. 개요 및 목적
- **목표**: 상민님의 원문 지시에 따라 목표 탭 최하단과 기록 탭 기록 내보내기 하단 모두에 '데이터분석 프롬프트 백과사전'을 완전 배선하고, '프롬프트를 복사해서 외부 ai를 활용하세요!' 핵심 안내 배너 전면 배치, 템플릿백과사전식 실사용 프롬프트사전과 아워골 AI 프롬프트 듀얼 탭 분리, 목표/기록 컨텍스트별 맞춤 프리셋 8종 자동 분기, 44px 모바일 터치타겟 및 클립보드 폴백 원클릭 복사, 나만의 프롬프트 등록 및 도움돼요 👍 인터랙션, 직통 핸들러 및 4대 뷰 원자적 동시 전파를 완결한다.

---

## 2. 작업 단계별 실행 계획

### Step 1: 슬롯 신설 및 마크업 (`index.html`)
- `index.html` 1039행 기록 내보내기 카드 바로 밑에 `<div id="recordPromptEncyclopediaSlot" class="record-prompt-encyclopedia-slot"></div>` 신설.
- 목표 탭의 `#goalAnalysisHubSlot`과 기록 탭의 `#recordPromptEncyclopediaSlot` 양대 슬롯 구조 확립.

### Step 2: 프롬프트 백과사전 렌더러 및 배선 고도화 (`index.html`)
- `renderPromptEncyclopediaHtml(context)`:
  - `context === 'records'`: 기록 특화 실사용 4종 + 아워골 AI 4종 프리셋 동적 분기.
  - `context === 'goals'`: 목표 특화 실사용 4종 + 아워골 AI 4종 프리셋 동적 분기.
  - 최상단 `📢 프롬프트를 복사해서 외부 AI를 활용하세요!` 핵심 안내 배너 전면 렌더링.
  - 템플릿백과사전 스타일의 `👥 실사용` 및 `🤖 AI 맞춤` 듀얼 탭 분리 및 44px 터치타겟.
- `wirePromptEncyclopediaEvents(root)`:
  - 원클릭 `📋 복사하기` 클릭 시 `navigator.clipboard.writeText` + 모바일 textarea 폴백 탑재.
  - 12ms 햅틱 반응 및 토스트 알림 연동.
  - `도움돼요 👍` 추천 및 나만의 프롬프트 등록/삭제 로컬 영속화(`localStorage` + `state.profile`).
- `renderRecordsScreen()`:
  - `updateRecordPromptSlot()` 도우미를 통해 기록 탭 슬롯 렌더링 및 이벤트 바인딩 보장.

### Step 3: 직통 핸들러 배선 (`js/components.js`)
- `handle기록_Item78Action` 및 `handle프롬프트백과사전_Item78Action` 구현:
  - 12ms 햅틱 반응.
  - `og_task-78_cache` 로컬 영속화.
  - 4대 뷰 원자적 전파 (`renderGoalsScreen`, `renderRecordsScreen`, `renderHome`, `renderSettingsScreen`, `renderAll`).
  - 3자 노출(`OurgoalComponents`, `window`, `module.exports`).

### Step 4: 모바일 반응형 및 스타일 보강 (`ui.css`)
- `.prompt-hero-banner`, `.record-prompt-encyclopedia-slot` 스타일 신설.
- `.btn-prompt-tab` 44px 터치타겟, `.btn-copy-prompt` 38px 터치타겟 보장.
- 375px 모바일 뷰포트 반응형 패딩 최적화.

### Step 5: 검증 및 법정 심사
- 단위 테스트 `tests/prompt-encyclopedia.test.js` 작성.
- `scripts/smoke-test.js`에 [78] 단언문 추가.
- 스모크 테스트 및 데드클릭 테스트 전수 통과 확인.
- CDP 375px 모바일 실측 스크린샷 캡처 및 아티팩트 보관.
- `reports/TASK-ES-329/claims.json` 작성 및 GitHub Court 심사 청구.
