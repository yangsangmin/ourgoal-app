# [작업계획서] #TASK-ES-155 캘린더 배경사진·체크토글·잇템추가 결함 해결 및 일정 안내문구 추가

## 1. 개요 및 변경 예산
- 티켓: #TASK-ES-155
- 변경 대상 파일:
  - index.html (약 60줄 수정/추가)
  - ui.css (약 15줄 추가)
  - docs/rules/TICKETS.md (1줄 추가)
  - dev_log.md (10줄 추가)
  - scripts/smoke-test.js (약 35줄 검증 추가)

## 2. 세부 구현 계획
1. [index.html]:
   - window.showToast = toast 전역 정의.
   - openCalendarDayBgPickerModal 내 showToast 전부 toast로 치환.
   - openCalendarDayEditHubModal 내 hubDayBgBtn 클릭 시 closeModal() 제거하고 openCalendarDayBgPickerModal(sel) 직결.
   - renderCalDayDetail 내 ms-status를 sched-check 버튼으로 교체 및 클릭 시 toggleScheduleDone 직결 (stopPropagation 포함).
   - openProfileEditor(existingDraft)로 시그니처 확장하여 submodal 완료 시 draft 인메모리 보존 및 복귀.
   - itCancelBtn 및 itConfirmBtn에서 closeModal() 제거하고 openProfileEditor(draft) 직접 호출.
   - screen-calendar 내 cal-sub-guide 안내 문구 추가.
2. [ui.css]:
   - .cal-sub-guide 스타일 정의 (은은한 배경, 둥근 테두리, 부드러운 아이콘/텍스트).
3. [검증]:
   - headless puppeteer/node 스크립트로 5개 시나리오 전수 통과 확인.
   - npm test 293+개 통과 확인.
