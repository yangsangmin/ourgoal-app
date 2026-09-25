# 작업계획서 (PLAN) — 아바타 10개 관리 및 레벨업 팝업/공유/저장/프롬프트 성향 설정

> **문서 ID**: PLAN-TASK-ES-267-AVATAR-10SLOTS-GROWTH  
> **티켓 연계**: #TASK-ES-267 (노션 생각 메모장 [10]번, Page ID: `3dc598db-9096-8130-b95a-ceb9f5fbb5d4`)  
> **작성 일시**: 2026-09-25  
> **작성자**: Antigravity  
> **귀속 축**: E1 / RPG / UX (체크인 루프 및 인생 청사진 직결 아바타 진화 시스템)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 아키텍처 및 현행 구조 분석 (Architecture & Structure Analysis)
- **현재 구조**:
  - `js/avatar-system.js` 내 `getSavedAvatars(profile)`는 최대 10개까지 배열을 저장함.
  - 하지만 `renderSavedAvatarsDeckHtml`이 단순 유동 개수로만 카드를 렌더링하여 10개 고정 슬롯 인벤토리 체계가 직관적으로 드러나지 않음.
  - 아바타 선택 시 해당 아바타만의 개별 성향 프롬프트(`growthPrompt`) 입력 폼이 아바타 설정 모달 내에 부재함.
  - `index.html` 내 `avatarLevelUpModal`은 레벨업 대형 팝업 마크업이 이미 구축되어 있으나, 10슬롯 시스템 및 현재 장착 아바타의 성향 프롬프트와의 실시간 동기화가 더욱 정밀화되어야 함.
- **개선 후 아키텍처**:
  ```
  [사용자 프로필: profile.settings]
      ├── savedAvatars: [ Slot 1 ~ Slot 10 ] (각 항목: id, url, themeId, growthPrompt, createdAt)
      └── avatarGrowthPrompt: '더 강하게' (현재 장착 아바타 대표 성향 프롬프트)
            │
            ├── [아바타 모달 (openAvatarModal)]
            │     ├── 10개 독립 슬롯 인벤토리 캐러셀 (Slot 1 ~ 10, 채워진 슬롯 + 빈 슬롯)
            │     └── 아바타 성장 성향 설정 폼 (퀵 칩 5종 + 직접 입력 + 유해단어 필터링)
            │
            └── [레벨업 대형 팝업 모달 (openAvatarLevelUpModal)]
                  ├── 크게 보기 (대형 아바타 + 랭크 날개 SVG + 성장 성향 뱃지)
                  ├── SNS 공유 버튼 (Web Share API + 클립보드 복사)
                  ├── 이미지 저장 버튼 (HTML5 Canvas 레벨업 카드 PNG 다운로드)
                  └── 확인 닫기 버튼
  ```

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **[본질] (Essence)**:
  - 10개의 독립 슬롯을 통해 나만의 아바타 컬렉션을 자유롭게 수집·관리하고, 내가 원하는 성향(더 강하게, 잘생기게 등)대로 성장하는 아바타의 레벨업 순간을 대형 팝업과 함께 공유·저장하는 RPG 성취감을 완성하는 것.
- **[원인] (Causes)**:
  - 슬롯 UI의 미비와 성향 프롬프트 입력창의 분리로 인해 상민님 원문 지시 4개 조항이 1개의 단일 화면에서 유기적으로 결합되지 못했음.
- **[중심] (Core Anchor)**:
  - `renderSavedAvatarsDeckHtml`의 10슬롯 캐러셀화 + 성향 프롬프트 1:1 바인딩 + 레벨업 팝업 3대 액션(공유/저장/닫기) 배선.
- **[핵심] (Key Constraint)**:
  - 기존 착용 중인 아바타 보존 및 무손실 하위 호환.
  - 375px 모바일 뷰포트 가로 스크롤(오버플로우) 0px 방어.
  - 유해/범죄 단어 실시간 정화 (`filterHarmfulWords`).

---

## 3. [원칙 ③] 변경 예산 (Modification Budget)
- **예상 수정 파일 수**: 6개 내외
  1. `js/avatar-system.js`: 10개 슬롯 렌더러 개편, 개별 성향 프롬프트 저장, 슬롯 클릭 이벤트 연동 (~100 라인 변경/추가)
  2. `index.html`: 아바타 모달 내 성장 성향 프롬프트 입력 폼 추가 및 레벨업 모달 연동 강화 (~40 라인 추가)
  3. `ui.css`: 10슬롯 캐러셀 카드, 빈 슬롯 점선 박스, 퀵 성향 칩 스타일링 (~30 라인 추가)
  4. `tests/avatar-10slots-growth.test.js`: 신규 단위 테스트 (~80 라인 신설)
  5. `scripts/smoke-test.js`: `#TASK-ES-267` 단언 추가 (~15 라인 추가)
  6. `reports/TASK-ES-267/claims.json`: 법정 청구서 5개 항목 (~40 라인 신설)
- **라인 수 예산**: 추가 약 300라인, 삭제 약 20라인 (초저위험 최소침습).

---

## 4. [원칙 ④] 기존 기능 불파괴 보증 (Zero-Breakage Guarantee)
- **기존 아바타 데이터 보존**: `settings.savedAvatars`, `settings.customAvatarUrl`, `settings.avatarThemeId` 등 기존 필드 100% 보존.
- **착용 중 아바타 보호**: 현재 착용 중인 아바타는 삭제 버튼이 비활성화되거나 보호되어 안전성 확보.
- **스모크 테스트 384개**: 기존 스모크 테스트와 38개 헌법 게이트 100% ALL PASS 유지.

---

## 5. [원칙 ⑤] 구현 순서 (Implementation Sequence)
1. **1단계**: `js/avatar-system.js` 개편
   - `renderSavedAvatarsDeckHtml`을 루프 1~10 고정 슬롯으로 구현하여 채워진 슬롯과 빈 슬롯(`+ 슬롯 N`)을 함께 렌더링.
   - `addSavedAvatar`에 `growthPrompt` 속성 저장 추가.
   - 슬롯 클릭 시 선택된 아바타의 성향 프롬프트를 폼에 반영하는 이벤트 연동.
2. **2단계**: `index.html` & `ui.css` 보강
   - 아바타 모달 내 성장 성향 프롬프트 입력 폼 및 퀵 키워드 칩(`더 강하게`, `잘생기게`, `이쁘게`, `지적으로` 등) 추가.
   - `ui.css`에 `.empty-avatar-slot`, `.slot-badge`, `.growth-chip` 스타일 추가.
3. **3단계**: 단위 테스트 신설
   - `tests/avatar-10slots-growth.test.js` 작성 및 검증.
4. **4단계**: 통합 테스트 및 헌법 게이트
   - `scripts/smoke-test.js`에 단언 추가 및 385개 통과 확인.
   - `scripts/verify-integrity-gate.js` 38개 게이트 통과 확인.
5. **5단계**: GitHub Court 심사 청구 및 머지
   - `reports/TASK-ES-267/claims.json` 작성 (주석 금지).
   - 커밋, 푸시, PR 전환, `court/chat.js` 판정 확인, squash 머지.

---

## 6. [원칙 ⑥] 절차 재검증 (Verification Procedure)
- **단위 테스트**: `node tests/avatar-10slots-growth.test.js`
- **스모크 테스트**: `node scripts/smoke-test.js`
- **헌법 게이트**: `node scripts/verify-integrity-gate.js`
- **Tri-Sync 무결성**: `node C:/dev/command-center/lib/tri-sync.js check`
- **GitHub Court**: `node court/chat.js <PR번호>`

---

## 7. [원칙 ⑦] 체크리스트 (DoD)
- [ ] 아바타 모달에서 정확히 10개의 독립 슬롯(Slot 1~10)이 렌더링되는가?
- [ ] 아바타 추가 시 빈 슬롯에 채워지고 최대 10개까지 관리되는가?
- [ ] 착용 중이 아닌 아바타 슬롯은 삭제(×)가 정상 작동하는가?
- [ ] 아바타별 성장 성향 프롬프트(더 강하게 등) 설정 및 저장이 작동하는가?
- [ ] 유해/범죄 단어 필터링이 정상 작동하는가?
- [ ] 레벨업 대형 팝업에서 크게 보기, SNS 공유, 이미지 저장, 확인 닫기가 무결 작동하는가?
- [ ] 단위 테스트 100% 통과 (가짜 pass 없음)?
- [ ] 스모크 테스트 385개 및 헌법 38개 게이트 ALL PASS?
- [ ] GitHub Court 판정 확인 및 원격 main 머지 완료?

---

## 8. [원칙 ⑧] 블로커 및 롤백 대책 (Blockers & Rollback Plan)
- **블로커**: 기존 유저 데이터의 `savedAvatars` 개수가 0개이거나 10개 미만일 때 빈 슬롯 처리.
  - **대응책**: `(savedList[i] || null)` 패턴으로 1~10번 슬롯을 안전하게 매핑.
- **롤백 계획**: 문제 발생 시 `git reset --hard HEAD`로 즉시 복원 가능한 독립 커밋 구성.
