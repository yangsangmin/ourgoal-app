# 작업계획서 (PLAN) — 일정 달력 셀 확대 및 사진형 일기(Photo Diary) 연계 & 히트맵 시인성 극대화

> **문서 ID**: PLAN-TASK-ES-197-CALENDAR-PHOTO-DIARY-AND-HEATMAP  
> **티켓 연계**: #TASK-ES-197  
> **작성 일시**: 2026-09-20  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)
- **핵심 목표**: 
  1. 일정 달력 셀(`cal-cell`)의 높이를 `64px`에서 **`76px`**로 확대하고 헤더를 컴팩트화하여 **"모바일 375px 세로 1화면 안에 한 달 전체(5~6주)가 시원하게 들어오는 황금비율"** 완성.
  2. 체크인/기록에 첨부된 실천 사진(`attachments`, photo data)이 달력 셀에 감성 썸네일(`cal-cell-photo-thumb`)로 자동 노출되는 **"사진형 일기(Photo Diary) 캘린더"** 파이프라인 구축.
  3. 히트맵 셀(`heatmap-cell`)을 **`14px × 14px`**로 130% 확대하고 레벨별 대비/글로우 효과를 강화하여 **"한눈에 들어오는 선명한 성취 블록"** 완성.
- **영향받는 파일 전수 목록**:
  1. `index.html`: `calCellHtml` 사진 자동 감지 및 썸네일 배선, 포토 다이어리 허브 연동
  2. `ui.css`: `.cal-cell` 76px 및 `.heatmap-cell` 14px, 포토 다이어리 썸네일 스타일링
  3. `sw.js`: PWA 캐시 버전 최신화 (`CACHE_NAME = 'ourgoal-shell-v20260920-task-es197-cal-photo-diary-heatmap'`)
  4. `scripts/smoke-test.js`: [#TASK-ES-197] 달력 셀 76px, 사진 썸네일, 히트맵 14px 스모크 테스트 결속
  5. `scripts/verify-integrity-gate.js`: [검증 21/21] 정적 방화벽 결속
  6. `docs/rules/TICKETS.md`: #TASK-ES-197 본질 승인 티켓 등재

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 및 배선(Wire) 식별 (End-to-End Data Wiring)
- **[본질]**: 딱딱한 텍스트 스케줄러를 한 달의 내 삶이 사진으로 채워지는 감성 포토 다이어리로 진화시키고, 모바일 1화면 안에서 달력과 히트맵의 시인성을 극대화하여 매일 켜보고 싶은 아카이빙 효능감을 주는 것.
- **[원인]**: 레거시 CSS의 64px/11px 극소형 크기 고착, 체크인 사진 자산과 캘린더 셀 간의 자동 렌더링 배선 단절, 헤더 여백 방만.
- **[중심]**: `calCellHtml` 내 사진 첨부물 자동 추출 썸네일 렌더러 결속 및 `ui.css` 내 셀 높이 76px / 히트맵 14px 확장.
- **[핵심]**: 모바일 375×812 뷰포트에서 한 달(5~6주) 1화면 조망권(가로/세로 오버플로우 제로) 사수 및 기존 일정/배경사진 기능 100% 무손실 보존.

```
[체크인 / 기록 작성 시 사진 첨부] ──▶ state.profile.records 에 저장
              │
              ▼
[캘린더 탭 렌더링 (renderCalendarScreen)]
              │
              ▼
[calCellHtml(date, itemsByDate)]
  ├─▶ 1. 해당 날짜 기록 중 사진(attachments[0]) 자동 탐색
  ├─▶ 2. 사진 발견 시: .cal-cell-photo-thumb 또는 은은한 배경 오버레이 자동 생성
  ├─▶ 3. 셀 높이 76px: 날짜 숫자 + 사진 썸네일 + 일정 알약 여유롭게 공존
  └─▶ 4. 셀 터치 시: 해당 날짜의 사진 + 기록 + AI 피드백을 포토 저널로 조회
```

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- **파일별 변경 예산**:
  - `index.html`: 약 +40줄 / -10줄
  - `ui.css`: 약 +60줄 / -10줄
  - `sw.js`: 1줄 수정 (캐시 네임)
  - `scripts/smoke-test.js`: 약 +25줄
  - `scripts/verify-integrity-gate.js`: 약 +25줄
- **4위 1체 배선 명세**:
  - `[기록(Checkin)]` ➔ `[캘린더(Calendar)]` ➔ `[통계/히트맵(Stats)]` ➔ `[상호작용(Interaction)]`

---

## 4. [원칙 ④] 4가지 기본 틀 (Engineering Framework)
1. **[도메인 무결성]**: '잔디' 단어 배제 및 '히트맵' 단일화 (헌법 제6조).
2. **[반응형 무결성]**: 모바일 375px 4대 시각 물리 규격(오버플로우 0px, 터치 타겟 40px, 은폐 0개) 엄수 (헌법 제7조 제8항 제3호).
3. **[원장 무결성]**: 유저 데이터 무손실 보존율 100% (헌법 제1조, 제15조).
4. **[배포 안전핀]**: 상민님 승인 전 4단계(로컬 main 병합 및 Vercel 프리뷰 배포) 완료 후 대기 (헌법 제9조, 제12조).

---

## 5. [원칙 ⑤] 절차의 순서화 (Step-by-Step Implementation Sequence)
1. **[티켓 등록]**: `docs/rules/TICKETS.md`에 `#TASK-ES-197` 승인 등록.
2. **[CSS 조형]**: `ui.css` 내 `.cal-cell` 높이 76px, `.heatmap-cell` 14px, 포토 썸네일 스타일링 배선.
3. **[스크립트 배선]**: `index.html` 내 `calCellHtml`에서 기록 사진(`attachments` 또는 `photo`) 자동 감지 및 썸네일 렌더링.
4. **[PWA 캐시 최신화]**: `sw.js` 캐시 키 갱신.
5. **[자동화 테스트 결속]**: `scripts/smoke-test.js` & `scripts/verify-integrity-gate.js` 결속.
6. **[무결성 검증]**: `npm test` ALL PASS 확인.
7. **[CDP 물리 실측]**: Chrome CDP 모바일 375px 캘린더 포토 뷰 및 히트맵 14px 실측 스크린샷 캡처.
8. **[로컬 main 병합 & 프리뷰 배포]**: `git merge` 및 Vercel 프리뷰 배포.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **A. 전수 클릭 (Dead-Click 0)**: 캘린더 날짜 셀 터치, 뷰 토글(월/주/일), 히트맵 셀 터치 정상 동작.
- **B. 1화면 가시성 (One-Page Fit)**: 375×812 화면에서 5~6주 달력이 잘림 없이 한눈에 들어오는지 실측.
- **C. 사진 썸네일 노출 (Photo Diary)**: 사진 첨부 기록 보유 날짜 셀에 썸네일이 선명하게 노출되는지 검증.
- **D. 히트맵 셀 14px 물리 규격**: `.heatmap-cell` 너비/높이 14px 실측 검증.
- **E. 자동화 게이트**: 334+ 테스트 및 35+ 게이트 100% ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트
- [ ] Step 1: `docs/rules/TICKETS.md` #TASK-ES-197 등록
- [ ] Step 2: `ui.css` 캘린더 셀 76px & 히트맵 14px 조형 스타일링
- [ ] Step 3: `index.html` `calCellHtml` 사진 첨부물 자동 감지 썸네일 렌더러 구현
- [ ] Step 4: `sw.js` 캐시 네임 갱신
- [ ] Step 5: `scripts/smoke-test.js` & `scripts/verify-integrity-gate.js` [검증 21/21] 배선
- [ ] Step 6: `npm test` ALL PASS 확인
- [ ] Step 7: Chrome CDP 모바일 375px 실측 캡처
- [ ] Step 8: 로컬 main 병합 및 Vercel 프리뷰 배포

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재 블로커**: 달력 상단 네비게이션과 요일 바가 커서 76px 셀과 함께 6주 차가 들어갈 경우 화면 하단이 넘치는 문제.
- **대응책**: `.cal-nav-row` 여백을 `margin: 0 0 8px;`, `.cal-weekdays` 여백을 `margin-bottom: 4px;`로 고밀도 최적화하여 6주 기준 전체 높이를 490px 이내로 억제, 375×812 뷰포트에서 스크롤 없이 완벽 수용.
- **롤백 계획**: `git checkout main`으로 즉시 복귀 가능.
