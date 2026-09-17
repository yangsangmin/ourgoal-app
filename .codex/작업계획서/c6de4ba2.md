# [작업계획서] 아워골 생각 메모장 3대 완결 과제([58] 소통 피드 직접 사진 첨부 · [59] 카테고리 10종 확장 및 가로스크롤 · [60] 성취통계 껍데기 버튼 영구 삭제)
목표: 아워골 생각 메모장 잔여 대기 과제인 [58] 소통 피드 직접 사진 첨부, [59] 카테고리 10종 확장 및 가로 스크롤, [60] 성취통계 껍데기 버튼 영구 삭제를 무결하게 구현하고 E2E 브라우저 실측 및 자동화 테스트 315개를 100% 통과하여 프로덕션 배포를 완수한다.

## 체크리스트
- [x] 1. [기능 60] 성취통계 메뉴 내 미작동 껍데기 버튼(uLinkGoalBtn, uRegCalendarBtn) 영구 삭제
  - js/universal-stats.js 5164-5193 라인의 마크업 및 이벤트 리스너 완전 제거
  - 껍데기 토스트 및 데드 클릭 0건 보장
- [x] 2. [기능 58] 소통 피드 게시하기 내 직접 사진(이미지) 첨부 기능 추가
  - 카메라/앨범 직접 사진 업로드 input (#shareDirectPhotoInput) 및 버튼 (#btnSharePickPhoto)
  - in-scope compressImage(file, 800, 0.82) 기반 800px 최적 압축 파이프라인 탑재
  - 실시간 썸네일 미리보기 (#shareDirectPhotoPreviewWrap) 및 삭제 버튼 (#btnShareRemovePhoto)
  - 피드 미리보기 (#sharePreviewSlot) 및 최종 피드 게시 (finalPhoto) 연동
  - 소통 피드 '📸 사진인증만' 필터 자동 노출 보장
- [x] 3. [기능 59] 소통 피드 게시하기 카테고리 분류 다양화(10종) 및 가로 스크롤 UI
  - 10종 카테고리 (공부·수험, 개발·기획, 운동·건강, 커리어·취업, 취미·창작, 생활·습관, 육아·가족, 재테크·투자, 멘탈·마인드, 독서·인문)
  - 피드 게시 모달: #shareCatPicker 내 가로 스크롤 chip row (overflow-x: auto, white-space: nowrap)
  - 메인 피드: feed-filter-bar 10종 카테고리 가로 스크롤 및 필터링 (filterFeedByCategory)
  - 未매칭/unknown 카테고리 안전 방어망 유지
- [x] 4. [검증] 스모크 테스트 및 E2E 브라우저 실측
  - scripts/smoke-test.js 신규 컴플라이언스 테스트 추가 (315개 통과, 0개 실패)
  - verify-integrity-gate.js 20/20 전수 통과
  - Headless Chrome CDP 기반 모달, 사진 첨부, 10종 가로 스크롤, 성취통계 3대 스크린샷 검증 완료
- [x] 5. [문서화 및 3자 동기화]
  - docs/rules/TICKETS.md #TASK-ES-177 등록
  - 옵시디언 메모장 DB [58], [59], [60] '완료' 갱신
  - Tri-Sync 무결성 검증

## 막힐 지점 예상 (8원칙 ⑧)
- 직접 사진 업로드 시 원본 고해상도 이미지를 그대로 base64로 올리면 로컬 스토리지 한도(5MB) 초과 및 피드 렌더링 랙 발생 위험: 기존에 검증된 compressImage 유틸을 호출하여 최대 800px, 0.82 퀄리티로 압축하여 저장 용량을 수십 KB로 경량화함.
- 10종 카테고리 도입 시 기존 5종 하드코딩된 filterFeedByCategory 및 미리보기 catMap에서 신규 카테고리가 누락되거나 기본값으로 튕길 위험: 10종 카테고리 키-라벨 매핑 테이블을 모달, 메인 피드, 필터 함수 전 영역에 통일되게 배선하고 키워드 정규식까지 완비함.
