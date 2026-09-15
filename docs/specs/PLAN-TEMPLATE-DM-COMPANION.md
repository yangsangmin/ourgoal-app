# PLAN-TEMPLATE-DM-COMPANION: 추천템플릿 이전·둘러보기, 소통게시, DM 모임선택, 동반자 시스템 구현 계획

> **문서 ID**: PLAN-TEMPLATE-DM-COMPANION  
> **티켓 번호**: #TASK-ES-105  
> **본질축**: E3(동류 소통) / FIX(버그 수정) / UX(사용자 경험)  
> **작성일자**: 2026-09-15  

---

## 1. 문제 해결 8원칙 분석 (2회차)

### ① 파악
상민님의 5대 요구사항:
1. **아워골 추천템플릿을 기록에서 목표로 옮겨** (목표 탭 상단 배치).
2. **추천템플릿 3종 둘러보기 버튼 동작 개선** (접기/둘러보기 토글, 1초 미리보기 모달, 목표 시작 복제).
3. **소통탭 게시하기 버튼 동작 개선** (상단 헤더 + 피드 배너 버튼 4위 1체 배선).
4. **DM창 텅 빈 상태 개선: 같은 모임 사람 즉시 선택 후 발송**.
5. **DM 우측 '동반자' 탭 추가: 카카오톡 친구/인스타 팔로우 개념, 닉네임 검색·요청·추가·삭제, 아바타·닉네임 목록, DM 발송 버튼, 아바타 클릭 프로필 보기**.

### ② 중심 배선(Wire) 식별
1. **템플릿 배선**:
   - `renderGoalsScreen()` 내에 `renderGoalTemplatesAccordionHtml()` 주입.
   - `toggleTemplatesBtn` 클릭 시 `state.templatesExpanded` 토글 및 리렌더.
   - `[data-preview-tmpl]` 클릭 시 `openTemplatePreviewModal(tmplId)` 팝업 (마일스톤과 세부할일 전수 노출).
   - `[data-tmpl]` 클릭 시 `cloneTemplate(tmplId)` 호출 -> 내 목표 생성 -> 목표 화면 리렌더 -> 토스트 피드백.
2. **소통 게시하기 배선**:
   - 스크립트 최상위에서 `window.openShareToFeedModal = openShareToFeedModal;` 즉시 등록.
   - `btnCommPostFeed` 요소에 `addEventListener('click', openShareToFeedModal)`.
   - 피드 상단 퀵 게시 배너의 '게시하기' 버튼에도 명시적 이벤트 바인딩.
3. **DM 모임원 즉시 선택 배선**:
   - `renderCommDM()` 상단에 `renderDMMembersBar()` 주입.
   - `MOCK_GROUPS` 및 가입 모임의 멤버들을 추출 (중복 제거).
   - 멤버 칩 클릭 시 `state.dmActiveId = member.id` 설정 후 즉시 대화방 렌더.
   - 대화창 내 전송 시 로컬 대화 스레드에 메시지 축적 및 자동 답장 응답.
4. **동반자 탭 시스템 배선**:
   - `state.commSubTab === 'companion'` 라우팅 추가.
   - `renderCommCompanions(subBody)` 모듈 신설.
   - `state.profile.companions`: 초기 3명 시드(러닝버디, 개발동료, 갓생메이트) 자동 주입(기존 데이터 없을 때).
   - 검색 인풋 키업/클릭 -> 추천/전체 유저 중 닉네임 필터링 -> 결과 목록 표시 -> [+ 동반자 추가] 클릭 시 `state.profile.companions.push(...)` 및 `saveProfile()`.
   - 동반자 목록 카드:
     - 아바타 클릭 -> `openUserProfileModal(user)` 호출 (아바타, 닉네임, 레벨, 스트릭, 목표 요약, 최근 히트맵).
     - [💬 DM] 클릭 -> `state.commSubTab = 'dm'; state.dmActiveId = user.id; renderCommScreen();`
     - [✕ 삭제] 클릭 -> confirm 후 제거 및 `saveProfile()`.

### ③ 파일별 Before/After 및 변경 예산
1. `index.html`:
   - 목표 화면(`renderGoalsScreen`) 내 추천 템플릿 3종 아코디언 추가.
   - 기록 화면(`recProTemplateCard`) 문구 및 링크를 목표 탭 템플릿으로 정돈.
   - 소통탭 서브탭 목록에 `companion:동반자` 추가.
   - `btnCommPostFeed` 및 퀵 게시 버튼 addEventListener 배선.
   - `renderCommDM` 내 모임원 선택 바 추가.
   - `renderCommCompanions` 및 `openUserProfileModal` 신설.
   - 약 +350줄.
2. `js/team-invite-comm.js`:
   - 템플릿 아코디언 렌더러에 미리보기 모달 바인딩 지원 추가.
   - 약 +50줄.
3. `docs/rules/TICKETS.md`: #TASK-ES-105 승인 티켓 반영 (완료).
4. `scripts/smoke-test.js`: #TASK-ES-105 신규 검증 테스트 추가 (약 +40줄).

### ④ 재검토
- 용어 헌법: '잔디' 사용 0건, 오직 '히트맵(Heatmap)'으로만 표기.
- 데이터 무손실: companions 배열 추가 시 기존 세팅값 보호.
- 4위 1체 배선: 모든 신규 버튼에 ID/data-속성, 이벤트 리스너, 핸들러, 피드백 완비.

### ⑤ 구현 상세 순서
1. `js/team-invite-comm.js` 업데이트:
   - 템플릿 3종 카드에 둘러보기(미리보기) 버튼 및 1초 목표 시작 버튼 구조 보강.
2. `index.html` 목표 탭 업데이트:
   - `renderGoalsScreen` 상단에 추천 템플릿 3종 아코디언 배치 및 리스너 바인딩.
   - 템플릿 상세 미리보기 모달 `openTemplatePreviewModal` 구현.
3. `index.html` 소통 탭 및 게시하기 버튼 복구:
   - `openShareToFeedModal` 전역 노출 및 버튼별 addEventListener 완벽 연결.
4. `index.html` DM 탭 모임원 즉시 선택 바 구현:
   - 가입 모임 팀원 수평 스크롤 칩 렌더 및 원클릭 대화방 진입.
5. `index.html` 동반자 탭 신설:
   - 서브탭 6번째로 '동반자' 등록.
   - 닉네임 검색, 동반자 추가/삭제, DM 연결, 아바타 클릭 시 프로필 모달 배선.
6. 스모크 테스트 추가 및 `npm test` 전체 검증 통과 확인.
7. 로컬 main 브랜치 병합 및 5A 프리뷰 배포.

### ⑥ 5대 무결성 검증 시나리오
- **Zero Dead-Click**: '둘러보기 ▼', '접기 ▲', '게시하기', 'DM 보내기', '동반자 추가/삭제', '아바타 프로필' 클릭 시 콘솔 에러 0건.
- **Zero UX Regression**: 기존 목표 목록, 체크인, 마라톤/모임 기능 온전 동작.
- **Zero Data Loss**: 기존 10종 페르소나 데이터 무손실 보존.
- **Full State Propagation**: 동반자 추가 시 즉시 목록 갱신 및 DM 탭과 연동.
- **npm test 100% PASS**: 전체 자동화 테스트 무결성 통과.

### ⑦ 체크리스트 (4단계 상한선 준수)
- [ ] 1. TICKETS.md, REQ, PLAN, 작업계획서 수립 및 Tri-Sync 동기화
- [ ] 2. 목표 탭에 아워골 추천 템플릿 3종 이전 및 둘러보기/미리보기/복제 4위 1체 배선
- [ ] 3. 소통탭 '게시하기' 버튼 2곳 addEventListener 바인딩 및 모달 정상화
- [ ] 4. DM창 상단 '내 모임 동료' 원클릭 선택 바 및 1:1 대화 연결 구현
- [ ] 5. 소통탭 '동반자' 탭 신설 (닉네임 검색, 추가/삭제, DM 발송, 아바타 프로필 팝업)
- [ ] 6. 5대 무결성 전수 검증 (npm test PASS, 콘솔 에러 0건)
- [ ] 7. 로컬 메인 병합 및 5A 프리뷰 자동 배포
