# PLAN-TASK-ES-153: 캘린더 일정 칸 배경 이미지 선택 및 50% 투명도 전역 렌더링 작업계획

## 1. 구현 단계
1. **CSS 스타일 정의 (ui.css)**:
   - .cal-cell: position: relative; overflow: hidden; 보장.
   - .cal-cell-bg: 50% 투명도, cover, center, z-index: 0, pointer-events: none.
   - .cal-day-bg-btn, #calDayBgPickerModal 스타일 정의.
   - 타임테이블 일간 배경 오버레이 클래스 .timetable-day-bg 정의.
2. **스크립트 및 모달 로직 (index.html)**:
   - compressCalendarBgImage(file, callback): Canvas 800px & JPEG 0.82 압축.
   - openCalendarDayBgPickerModal(selectedDate): 모달 오픈, 미리보기, 취소, 저장, 삭제.
   - enderCalendarScreen: 월간 캘린더 일자 셀에 .cal-cell-bg 주입.
   - openCalendarDayEditHubModal: [🖼️ 이날의 배경사진 고르기] 버튼 배선 및 썸네일 상태 표기.
   - 일간 시간표 헤더 컨트롤: [🖼️ 이날의 배경사진 고르기] 버튼 배선.
3. **검증 및 배포**:
   - 스모크 테스트 추가, 
pm test, essence-gate, PR 생성, 병합, 실서버 배포, Tri-Sync 확인.
