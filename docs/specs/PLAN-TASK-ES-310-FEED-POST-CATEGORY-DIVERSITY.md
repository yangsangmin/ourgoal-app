# PLAN-TASK-ES-310: 소통 피드 게시하기 카테고리 분류 다양화(생활·육아 등 보완) 및 가로 스크롤 선택 UI 구현

## 1. 아키텍처 및 구현 설계

### Step 1: `index.html` 소통 피드 모달 및 필터 카테고리 다양화
1. **`openShareToFeedModal` 내부 카테고리 정의**:
   - `FEED_CATEGORIES_10` 배열을 18종으로 확장:
     ```javascript
     var FEED_CATEGORIES_10 = [
       {k:'study', l:'공부·수험', icon:'📚'},
       {k:'dev', l:'개발·기획', icon:'💻'},
       {k:'workout', l:'운동·헬스', icon:'💪'},
       {k:'running', l:'러닝·마라톤', icon:'🏃'},
       {k:'diet', l:'다이어트·식단', icon:'🥗'},
       {k:'career', l:'커리어·취업', icon:'💼'},
       {k:'sideproject', l:'창업·사이드', icon:'🚀'},
       {k:'finance', l:'재테크·투자', icon:'💰'},
       {k:'life', l:'생활·루틴', icon:'☀️'},
       {k:'morning', l:'기상·모닝루틴', icon:'⏰'},
       {k:'parenting', l:'육아·가족', icon:'👶'},
       {k:'pet', l:'반려동물', icon:'🐾'},
       {k:'relation', l:'관계·소통', icon:'🤝'},
       {k:'reading', l:'독서·인문', icon:'📖'},
       {k:'hobby', l:'취미·창작', icon:'🎨'},
       {k:'mental', l:'멘탈·마인드', icon:'🧘'},
       {k:'clean', l:'정리·미니멀', icon:'🧹'},
       {k:'travel', l:'여행·아웃도어', icon:'✈️'}
     ];
     ```
2. **모달 렌더링 및 칩 바 바인딩**:
   - `#shareCatPicker` 내부 칩에 `data-shcat` 속성 부여.
   - 클릭 시 `selectedCat = btn.dataset.shcat;`, 12ms 햅틱 반응(`triggerHaptic(12)`), `btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });` 호출.
3. **모달 미리보기(`catMap`) 및 메인 피드(`categories`, `filterFeedByCategory`) 동기화**:
   - `catMap`에 18개 라벨 매핑.
   - `filterFeedByCategory`의 `validCategories` 및 키워드 정규식에 18개 카테고리 반영.

### Step 2: `js/components.js` 직통 핸들러 및 4대 뷰 동시 전파
- `handle소통_Item59Action` 함수 구현:
  - 12ms 햅틱 반응.
  - `og_task-59_cache` 로컬스토리지 영속화.
  - Supabase upsert 비동기 동기화.
  - 헌법 제15조 제6항 4대 뷰(홈, 목표, 기록, 소통) 원자적 동시 전파.

### Step 3: `ui.css` 모바일 375px 반응형 스타일
- `#shareCatPicker`:
  - `scrollbar-width: none`, `-ms-overflow-style: none`.
  - `&::-webkit-scrollbar { display: none; }`.
  - 터치 타깃 40px, 모바일 가로 오버플로우 0px 보장.

### Step 4: 품질 검증 및 회귀 테스트
- `tests/feed-post-category-diversity.test.js` 작성.
- `scripts/smoke-test.js`에 `#TASK-ES-310` 단언문 추가 및 428개 전수 통과 확인.
- `reports/TASK-ES-310/claims.json` 작성 및 `node court/claims.js` 검증.
- 커밋, 푸시, PR 생성 및 GitHub Actions Court 심사, 머지, Tri-Sync 동기화.
