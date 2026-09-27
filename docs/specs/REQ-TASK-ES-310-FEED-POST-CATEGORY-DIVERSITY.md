# REQ-TASK-ES-310: 소통 피드 게시하기 카테고리 분류 다양화(생활·육아 등 보완) 및 가로 스크롤 선택 UI 구현

## 1. 개요
- **티켓 ID**: `#TASK-ES-310`
- **본질축**: `E3/UX`
- **상민님 원문 지시**:
  > *"소통의 게시하기에서, 카테고리 분류 선택이 더 다양해야함. 일단 생활, 육아도 없고, 내가 놓친것들 다 보완해서 카테고리분류에 더 채워넣어서 가로로 스크롤하면서 선택할 수 있어야함."*

## 2. 세부 요구사항
1. **소통 피드 게시 모달(`openShareToFeedModal`) 카테고리 분류 18종으로 대폭 다양화**:
   - `study`: 공부·수험 (📚)
   - `dev`: 개발·기획 (💻)
   - `workout`: 운동·헬스 (💪)
   - `running`: 러닝·마라톤 (🏃)
   - `diet`: 다이어트·식단 (🥗)
   - `career`: 커리어·취업 (💼)
   - `sideproject`: 창업·사이드 (🚀)
   - `finance`: 재테크·투자 (💰)
   - `life`: 생활·루틴 (☀️)
   - `morning`: 기상·모닝루틴 (⏰)
   - `parenting`: 육아·가족 (👶)
   - `pet`: 반려동물 (🐾)
   - `relation`: 관계·소통 (🤝)
   - `reading`: 독서·인문 (📖)
   - `hobby`: 취미·창작 (🎨)
   - `mental`: 멘탈·마인드 (🧘)
   - `clean`: 정리·미니멀 (🧹)
   - `travel`: 여행·아웃도어 (✈️)
   - 기존 스모크 테스트 line 6818 단언문(`FEED_CATEGORIES_10 = [`) 하위 호환성 100% 보존.

2. **모바일 가로 스크롤 선택 UI(`#shareCatPicker`) 고도화**:
   - 스크롤바 숨김(`scrollbar-width: none`) 및 매끄러운 터치 스크롤(`-webkit-overflow-scrolling: touch`).
   - 칩 클릭 시 즉각적인 12ms 햅틱 피드백(`triggerHaptic(12)`).
   - 선택된 칩이 가로 스크롤 영역 중앙으로 자동 안착(`scrollIntoView`).
   - 모달 미리보기 카드(`sharePreviewCardBody`) 내 `catMap`에도 신규 18종 매핑.

3. **피드 메인(`renderCommFeed`) 및 필터(`filterFeedByCategory`) 동기화**:
   - 피드 메인 상단 카테고리 필터 칩 바에도 확장된 카테고리 목록을 제공하여, 사용자가 게시한 카테고리별 글을 즉시 필터링 조회할 수 있도록 지원.
   - `filterFeedByCategory` 정규식에 신규 카테고리별 키워드 매칭 보강.

4. **단일 진실 공급원 및 4위 1체 배선**:
   - `js/components.js`에 `handle소통_Item59Action` 구현.
   - 12ms 햅틱 반응, `og_task-59_cache` 로컬스토리지 영속화, Supabase upsert 비동기 동기화, 헌법 제15조 제6항 4대 뷰 원자적 동시 전파.

5. **375px 모바일 반응형 스타일 완비**:
   - 터치 규격 최소 40px, 가로 오버플로우 0px 준수.

6. **품질 검증 및 3자 동기화**:
   - 단위 테스트 `tests/feed-post-category-diversity.test.js` 전수 통과.
   - 스모크 테스트 `scripts/smoke-test.js` 428개 전수 통과.
   - Tri-Sync(노션, 옵시디언, 관제센터) 100% 무결성 동기화.
