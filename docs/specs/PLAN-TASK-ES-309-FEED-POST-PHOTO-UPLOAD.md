# [PLAN] #TASK-ES-309: [58] 소통 피드 게시하기 내 사진(이미지) 첨부 기능 추가 구현 계획서

## 1. 개요
본 계획서는 노션 생각 메모장 아이디어 DB [58]번 과제인 `[58] 소통 피드 게시하기 내 사진(이미지) 첨부 기능 추가`를 완결하기 위한 엔터프라이즈급 실행 계획을 기술한다.

## 2. 작업 단계별 상세 계획

### Step 1: 마크업 및 핸들러 고도화 (`index.html`)
- `openShareToFeedModal` 내부의 사진 첨부 UI를 `.share-photo-uploader-box` 컨테이너로 리팩토링:
  - 사진 미첨부 시: 드롭존 영역(`#sharePhotoDropzone`), 카메라 아이콘 📷, "사진 선택 또는 드래그 앤 드롭", "카메라 촬영 및 앨범 지원 (최대 10MB)" 안내.
  - 사진 첨부 시: 실물 프리뷰 카드(`#shareDirectPhotoPreviewWrap`), 이미지(`#shareDirectPhotoPreviewImg`), 삭제 버튼(`#btnShareRemovePhoto`), 변경 버튼(`#btnShareChangePhoto`).
  - 파일 드래그앤드롭 이벤트 리스너 (`dragover`, `dragleave`, `drop`) 배선.
  - 첨부/삭제 시 12ms 햅틱 반응(`triggerHaptic(12)`).
  - 피드 게시(`shareConfirmBtn`) 시 `post.photo = finalPhoto; post.extra.photo = finalPhoto;` 동시 저장 보장.

### Step 2: 액션 핸들러 및 4위 1체 배선 (`js/components.js`)
- `handle소통_Item58Action(event, customPayload)` 구현:
  - 더블 클릭 방지 및 12ms 햅틱 피드백.
  - `og_task-58_cache` 로컬스토리지 저장 및 Supabase upsert.
  - 헌법 제15조 제6항 4대 뷰(`renderCalendar`, `renderGoalsScreen`, `renderHome`, `renderRecordsScreen`) 원자적 동시 전파.
  - `OurgoalComponents.handle소통_Item58Action`, `window.handle소통_Item58Action`, `module.exports.handle소통_Item58Action` 노출.

### Step 3: 스타일 및 375px 모바일 반응형 완비 (`ui.css`)
- `.share-photo-uploader-box`, `.share-photo-dropzone`, `.share-photo-preview-card`, `.share-photo-remove-btn`, `.share-photo-change-btn` 스타일 추가.
- 모바일 375px 반응형 미디어 쿼리 완비 (터치 규격 최소 40px 준수, 오버플로우 0px).

### Step 4: 테스트 작성 및 전수 검증
- 전용 단위 테스트 `tests/feed-post-photo-upload.test.js` 작성.
- `scripts/smoke-test.js`에 `#TASK-ES-309` 검증 단언문 추가 (427개 All Pass 확인).
- `reports/TASK-ES-309/claims.json` 작성 및 `node court/claims.js` 검증.
- `npm run court:quick -- --head HEAD` 예비 점검.

### Step 5: 원격 푸시, GitHub Court 심사 및 머지
- 원격 푸시 및 PR 생성.
- GitHub Actions 법정 심사(`node court/chat.js <PR번호>`) 합격 판정 확인 후 squash merge.
- `TICKETS.md` 완료 갱신 PR 및 squash merge.

### Step 6: 3자 상호 동기화 (Tri-Sync) 및 최종 보고
- 노션 [58]번 완료 갱신 (`PAGE_ID: 3de598db-9096-818e-ba68-fb52eecafd73`).
- 관제센터 저널(`journal.jsonl`)에 `task_start` 및 `task_done` 기록.
- 옵시디언 마크다운 정본 동기화 (`node scratch/sync_obsidian_memo_db.js`).
- Tri-Sync 무결성 검증 (`node C:/dev/command-center/lib/tri-sync.js check`).
- 최종 보고서 작성 (법정 4줄 판정서 최상단 배치).
