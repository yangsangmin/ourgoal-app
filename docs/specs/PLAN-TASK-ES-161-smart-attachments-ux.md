# 작업 계획서 (PLAN) — 참고자료 첨부 효과적·효율적 UI/UX 개선안 도출 및 실제 UI 검증 후 작업

> **문서 ID**: PLAN-TASK-ES-161-smart-attachments-ux  
> **티켓 연계**: #TASK-ES-161  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 파악 및 목표 수립 (Problem & Goal)
- **목표**:
  - 상민님 직접 지시("참고자료 첨부 더 효과적, 효율적으로 사용하면서 ui 와 사용자경험을 개선시켜줄 방법과 실제 구현(ui)상태 눈으로 직접 보고 난 뒤 작업", 생각 메모장 [22]번)에 따라,
  - 참고자료 첨부 모달에 1초 스마트 감지(클립보드 연동, URL 자동 타입 인식), 유튜브 썸네일/도메인 실시간 비주얼 프리뷰, 4대 실천 퀵 프리셋, 비주얼 리치 칩을 구현하고 실제 UI 상태를 시각적으로 검증 완결함.

---

## 2. [원칙 ②] [본질] · [원인] · [중심] · [핵심] 4대 요소 정립 (Essence, Causes, Core & Anchor)
- **[본질] (Essence)**:
  - 실천에 직접 도움이 되는 핵심 레퍼런스를 번거로움 없이 1초 만에 담아두고 꺼내보는 고효율 실행 보조.
- **[원인] (Causes)**:
  - 수동 입력 중심의 4단계 뎁스, 시각적 미리보기 결여, 어떤 자료를 모아야 할지 가이드 부재.
- **[중심] (Core)**:
  - 스마트 URL 감지 + 비주얼 썸네일 프리뷰 + 리치 칩 시각화의 3박자 일체형 UI/UX.
- **[핵심] (Anchor)**:
  - 1) `readClipboardToAttachment()`: 원클릭 클립보드 주입.
  - 2) `detectSmartAttachmentType(url)`: 유튜브/이미지/링크 자동 분류.
  - 3) `#attLivePreviewCard`: 유튜브 썸네일(`img.youtube.com/vi/{id}/hqdefault.jpg`) 및 웹 도메인 칩 실시간 노출.
  - 4) 4대 퀵 프리셋: 운동 자세 영상, 공식 문서, 핵심 메모, 인증 사진.
  - 5) 리치 칩 스타일링: `.att-chip-rich` 타입별 전용 배지.

---

## 3. [원칙 ③] 설계 및 아키텍처 (Architecture & Effective Solutions)
- **HTML/JS (`index.html`, `js/calendar-attachment.js`)**:
  - `openAddAttachmentModal` 내 스마트 인풋 툴바 및 프리뷰 컨테이너 추가.
  - URL 입력 이벤트(input, paste) 리스너에 스마트 타입 전환 및 프리뷰 갱신 바인딩.
  - 프리셋 버튼 클릭 시 기본 제목/메모/플레이스홀더 자동 주입.
  - `renderAttachmentChipsHtml`에 비주얼 배지 및 썸네일 지원 확장.
- **CSS 스타일 (`ui.css`)**:
  - `.att-smart-toolbar`, `.att-smart-btn`, `.att-preset-group`, `.att-preset-chip`.
  - `.att-live-preview-box`, `.att-preview-thumb`, `.att-chip-rich`.
- **PWA 서비스워커 (`sw.js`)**:
  - `ourgoal-shell-v20260917-es161` 캐시 버전 갱신.

---

## 4. [원칙 ④] 엣지 케이스 및 부작용 방지 (Edge Cases)
- 모바일 환경 클립보드 권한 이슈: 거부 시 에러 대신 친절 토스트 안내 후 입력창 포커스.
- 잘못된 유튜브 링크: 썸네일 로딩 실패 시 웹 링크 포맷으로 자동 폴백.
- 용어 헌법 준수: '잔디' 단어 절대 배제, '히트맵' 단일화.

---

## 5. [원칙 ⑤] 실행 시퀀스 (Implementation Sequence)
1. Step 1: `ui.css`에 스마트 참고자료 모달 및 리치 칩 스타일 추가.
2. Step 2: `index.html` 및 `js/calendar-attachment.js`에 스마트 감지, 클립보드 연동, 프리뷰 렌더링 구현.
3. Step 3: `sw.js` 캐시 버전 갱신.
4. Step 4: `scripts/smoke-test.js`에 #TASK-ES-161 검증 추가.
5. Step 5: 실제 UI 렌더링 검증 및 스크린샷 확인.
6. Step 6: 헌법 게이트 17종 ALL PASS 확인 후 커밋 및 로컬 main 병합.

---

## 6. [원칙 ⑥] 절차 재검증 (Verification & Anti-SPOF)
- `npm test` 301개 전수 통과 확인.
- `node scripts/verify-integrity-gate.js` 17대 게이트 100% PASS 확인.
- Dead Click 전수 검사 (클립보드 버튼, 프리셋 버튼, 타입 버튼, 저장/취소) 통과 확인.

---

## 7. [원칙 ⑦] 완전성 점검 및 가설 입증 (Completeness & Hypothesis)
- 참고자료 첨부 단계가 4단계에서 1단계로 축소되어 유저 피로도가 획기적으로 개선됨.

---

## 8. [원칙 ⑧] 본질 연계 및 회고 (Essence Link & Retrospective)
- 본질축: E1(체크인 루프 및 일정 실천력 강화).
