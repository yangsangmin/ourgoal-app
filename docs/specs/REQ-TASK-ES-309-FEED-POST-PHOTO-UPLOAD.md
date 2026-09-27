# [REQ] #TASK-ES-309: [58] 소통 피드 게시하기 내 사진(이미지) 첨부 기능 추가 요구사항 명세서

## 1. 개요 및 배경
- **티켓 ID**: `#TASK-ES-309` (노션 생각 메모장 아이디어 DB [58]번)
- **본질축**: `E3/UX`
- **상민님 원문**:
  > *"소통의 게시하기에서, 사진을 넣을 수 있는 기능이 없음. 피드에 사진 첨부된 피드만 보는 기능이 있는데. 게시하기에 사진 넣을 수 있도록 추가해."*

## 2. 현상태 분석 및 문제점
1. 소통 피드 화면(`renderCommFeed`)에는 `📸 사진인증만` (`data-feedtype="photo"`) 필터가 탑재되어 있어 사진이 있는 게시글만 모아보는 기능이 정상 지원되고 있음.
2. 그러나 피드 게시하기 모달(`openShareToFeedModal`) 내에는 사용자가 손쉽게 실천 인증 사진을 카메라/앨범에서 선택하거나 드래그하여 올릴 수 있는 직관적인 전용 업로더 카드 및 드롭존 UI가 취약함.
3. 사진 첨부 시 실물 크기 프리뷰(카드 룩앤필), 교체/삭제 버튼, 12ms 햅틱 반응, 그리고 피드 객체(`post`)의 최상위 `photo` 및 `extra.photo` 필드로의 동시 저장이 체계적으로 정립되어야 함.

## 3. 요구사항 상세 (Requirements)
- **REQ-1 (사진 첨부 드롭존 & 업로더 UI)**:
  - `openShareToFeedModal` 내에 실천 사진 전용 업로더 박스(`.share-photo-uploader-box`) 배치.
  - 첨부 전: 카메라/앨범 아이콘, 직관적인 선택 안내 텍스트, 드래그앤드롭 이벤트 리스너 지원.
  - 첨부 후: 실물 크기 프리뷰 카드(`img#shareDirectPhotoPreviewImg`, 최대 높이 180px, 둥근 모서리, 그림자), 사진 삭제(✕) 버튼, 사진 변경 버튼, "📸 인증 사진 첨부됨" 배지 표출.
- **REQ-2 (12ms 햅틱 반응 & 자동 이미지 압축)**:
  - 사진 선택 및 촬영 완료, 사진 삭제 시 12ms 햅틱 피드백(`triggerHaptic(12)`) 반응.
  - 모바일 대역폭 및 로컬 저장소 최적화를 위해 `compressImage(file, 960, 0.82, ...)` 파이프라인 연동.
- **REQ-3 (피드 게시물 양방향 영속화)**:
  - 게시 확정 시 생성되는 피드 객체(`post`)의 최상위 `photo` 및 `extra.photo` 필드에 첨부된 사진 데이터 동시 영속화.
  - 피드 탭 목록의 `📸 사진인증만` 필터 및 피드 카드 내에 실물 썸네일 즉시 노출.
- **REQ-4 (직통 액션 핸들러 & 원자적 트랜잭션)**:
  - `js/components.js`에 `handle소통_Item58Action(event, customPayload)` 구현.
  - 12ms 햅틱 진동, 로컬스토리지 `og_task-58_cache` 저장 및 Supabase upsert.
  - 헌법 제15조 제6항 4대 뷰(`renderCalendar`, `renderGoalsScreen`, `renderHome`, `renderRecordsScreen`) 원자적 동시 전파.
  - `OurgoalComponents.handle소통_Item58Action`, `window.handle소통_Item58Action`, `module.exports.handle소통_Item58Action` 노출.
- **REQ-5 (모바일 375px 반응형 최적화)**:
  - `ui.css`에 업로더 박스, 드롭존, 프리뷰 카드 스타일 및 375px 모바일 반응형 미디어 쿼리 완비 (터치 규격 최소 40px 준수, 오버플로우 0px).
- **REQ-6 (검증 및 무결성)**:
  - 전용 단위 테스트 `tests/feed-post-photo-upload.test.js` All Pass.
  - `scripts/smoke-test.js` 427개 전수 통과 (0개 실패).
  - GitHub Actions Court 심사 합격 및 노션·옵시디언·관제센터 Tri-Sync 100% 무결성 검증.
