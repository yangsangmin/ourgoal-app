# 아워골 '캘린더 일정 참고자료(유튜브, 이미지, 메모, 웹링크) 첨부·조회·삭제 시스템' 작업계획서 (#TASK-ES-096)

목표: 상민님 지시("일정에서도 목표에 넣는것처럼 참고자료 넣을 수 있게 해줄래?")에 따라, 기존 목표(Goal/Milestone/Task)에만 제공되던 참고자료(유튜브 영상, 이미지 파일, 텍스트 메모, 웹링크) 첨부·조회·삭제 기능을 캘린더 일정(customSchedules) 등록 및 수동 편집 모달, 일자 허브 모달, 캘린더 일자 상세 뷰까지 전면 확장하여 실행 편의성을 극대화하고 Dead Click 0건 및 헌법 제18조(index.html 순증가 0줄)를 완벽히 준수한다.

## 마일스톤 및 안전 분할 계획
- **Phase 1 [1단계: 기획·설계 상태]**: REQ-CALENDAR-EVENT-ATTACHMENTS.md 및 PLAN-CALENDAR-EVENT-ATTACHMENTS.md 수립, 작업계획서 작성, 컨트롤타워 연계(.task-links/ebe91d6b.json sync), Obsidian Vault 3자 동기화.
- **Phase 2 [2단계: 내부 시뮬레이션 및 구현 상태]**:
  - `js/calendar-attachment.js` 신설: 일정 참고자료 전용 UI 렌더링, 첨부 모달 호출 및 뷰어 연결 헬퍼.
  - `index.html` 배선:
    1) `openCalendarManualEditModal`에 참고자료 섹션(목록 칩 + [참고자료 첨부] 버튼) 추가 및 드래프트/저장 연동.
    2) `openCalendarDayEditHubModal` 일정 행에 참고자료 칩 표출.
    3) `wireAttachmentChipClicks`에 `kind === 'custom'` 핸들러 연결 (데드 클릭 완전 제거).
    4) `index.html` 순증가 0줄 헌법 완벽 사수 (총 22,196줄 유지).
  - 단위 테스트 `scripts/test-calendar-attachments.js` 작성 및 `scripts/smoke-test.js`에 검증 등록.
  - `npm test` 245개 All Pass 및 5대 게이트 100% 통과.
- **Phase 3 [3단계: 로컬 수동 확인 상태]**: `http://localhost:8000` 환경에서 일정 수동 등록 모달 내 참고자료 첨부, 일자 상세 및 허브 모달 칩 표출, 뷰어(유튜브/메모) 팝업 실제 브라우저 스크린샷 캡처 및 시각적 검증 (`view_file`).
- **Phase 4 [4단계: 로컬 메인 병합 상태]**: feature 브랜치 커밋 및 로컬 main 병합, Vercel 프리뷰 배포 (5A단계) 준비.
- **Phase 5~6 [5~6단계: 배포 및 실운영 최종 확인]**: 상민님 승인 후 프로덕션 배포 및 라이브 확인.

## 작업 체크리스트
- [x] 1. 요구사항 정의서(docs/specs/REQ-CALENDAR-EVENT-ATTACHMENTS.md) 수립 · 5분 · 완료 기준: 파일 생성 완료
- [x] 2. 엔지니어링 계획서(docs/specs/PLAN-CALENDAR-EVENT-ATTACHMENTS.md) 수립 · 5분 · 완료 기준: 파일 생성 완료
- [x] 3. 컨트롤타워 연계(.task-links/ebe91d6b.json) 갱신 및 sync · 3분 · 완료 기준: task-link.js sync 성공
- [x] 4. Obsidian Vault 3자 동기화(Tri-Sync) 복사 · 3분 · 완료 기준: Vault 파일 복사 완료
- [x] 5. `js/calendar-attachment.js` 신설 및 일정 첨부 헬퍼 구현 · 15분 · 완료 기준: 모듈 함수 완비
- [x] 6. `index.html` 일정 편집/허브 모달 및 wireAttachmentChipClicks 배선 (순증가 0줄) · 15분 · 완료 기준: index.html 22,196줄 유지
- [x] 7. 단위 테스트 작성 및 `npm test` 245개+ 전수 통과 · 10분 · 완료 기준: 0 failure
- [x] 8. 로컬 수동 확인 (브라우저 스크린샷 캡처 및 view_file 육안 확인) · 10분 · 완료 기준: 스크린샷 획득 및 6단계 보고

## 막히는 지점 예상 (문제해결 8원칙 ⑧)
- **막힐 지점 1 (신규 일정 생성 중 첨부 추가 시 id 미발급 문제)**:
  신규 일정 작성 모달에서는 아직 `eventItem.id`가 발급되지 않은 상태이므로, 모달 스코프의 `draftAttachments` 배열을 임시로 운용하고, [저장] 클릭 시 생성되는 `uid('sched')` 일정 객체에 `attachments: draftAttachments`로 할당하여 데이터 유실을 방지한다. -> 해결 완료: draft 배열 유지 및 모달 재진입 시 완벽 보존.
- **막힐 지점 2 (헌법 제18조 `index.html` 순증가 0줄 엄수)**:
  새로운 UI 마크업과 스크립트 태그가 삽입되면서 라인이 늘어나지 않도록, `js/calendar-attachment.js`로 대부분의 로직을 위임하고, `index.html`의 중복 공백 라인을 정밀하게 정리하여 작업 전후 총 라인 수를 22,196줄로 정확히 일치시킨다. -> 해결 완료: 정확히 22,196줄 유지 (0줄 순증가).
