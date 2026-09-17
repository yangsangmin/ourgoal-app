# REQ-TASK-ES-153: 캘린더 일정 칸 배경 이미지 선택 및 50% 투명도 전역 렌더링

## 1. 개요 및 배경
- 사용자가 일정의 각 날짜 칸마다 원하는 사진을 배경으로 지정할 수 있는 '이날의 배경사진 고르기' 기능 제공.
- 배경 사진이 50% 투명도로 꽉 차게 렌더링되면서도 기존에 적은 일정 텍스트와 체크 칩이 100% 또렷하게 보이도록 설계.

## 2. 요구사항 명세
1. **진입점**:
   - 일간 일정 수정/관리 허브 모달(openCalendarDayEditHubModal) 상단 및 일간 타임라인 헤더에 [🖼️ 이날의 배경사진 고르기] 버튼 탑재.
2. **사진 선택 모달**:
   - 파일 업로더(ccept="image/*").
   - 브라우저 Canvas 기반 자동 800px 리사이징 및 JPEG 0.82 압축(용량 과다 방어).
   - 실시간 50% 투명도 시뮬레이션 미리보기 (기존 일정 텍스트 칩 오버레이).
   - [취소], [저장], [배경사진 삭제] 액션 버튼 완비.
3. **렌더링**:
   - .cal-cell-bg: position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0.5; z-index: 0; pointer-events: none;.
   - 날짜 숫자, 일정 칩, 배지: position: relative; z-index: 1;로 가독성 완전 보존.
   - 월간 그리드 셀 및 일간 타임라인 시간표 배경에 일관 적용.
4. **영속성**:
   - state.profile.calendarDayBackgrounds 객체에 날짜별 키 매핑.
   - saveProfile()로 LocalStorage 및 Supabase DB 저장.
