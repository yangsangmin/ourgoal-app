# 구현 계획서 (PLAN) — #TASK-ES-341 홈 아바타 EXP 진행 바 실값화 · 하드코딩 이름 제거

> **문서 ID**: PLAN-TASK-ES-341-HOME-EXP-NICKNAME  
> **티켓 연계**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 HOME-19, HOME-21  
> **작업 일시**: 2026-10-04

## 1. 4위 1체 배선 표

| 요소 식별자 | 마크업 | 리스너/트리거 | 로직 | 피드백 |
| :-- | :-- | :-- | :-- | :-- |
| `#homeHeroExpBar` / `#homeHeroExpFill` | `role="progressbar"` 숫자 없는 바 | `renderHome` → `refreshAvatar()`, `awardXP` → `notifyXpGained` → `onXpGained` | `expProgressPct` = `levelProgress(settings.xp.total).pct` | 바 너비 0.3초 전환 + `aria-valuenow` |
| `#homeHeroExpGain` | 평소 빈 칸·투명 | `onXpGained(amount)` | 0.5초 안 연속 보상 합산 | "+N EXP" 0.5초 떠올랐다 사라짐 |
| `#homeHeroAvatar` | 기존(ES-340) | `click`/`Enter` | `OurgoalAvatar.openAvatarModal` | 아바타 설정창(레벨 숫자는 여기서만) |
| `#homeHeadlineSentence` | 기존 | `renderHome` | 닉네임 없으면 이름 없는 문장, 오늘 수 = `r.date || dateKey(r.startAt)` | 문장 |
| `#crewPacingWidget` 헤드라인 | 기존 | `renderCrewPacingWidget` | 닉네임 없으면 이름 없는 문장 | 문장 |

## 2. 체크리스트

- [x] 1단계: REQ 작성 (`docs/specs/REQ-TASK-ES-341-HOME-EXP-NICKNAME.md`)
- [x] 2단계: PLAN 작성 (이 문서)
- [x] 3단계: 코드 (`js/tabs/home/sub-onescreen.js`, `index.html`, `ui.css`) · 주장 파일(`reports/TASK-ES-341/claims.json`) · 시나리오 2건
- [ ] 4단계: 심사 청구 (PR 생성 → GitHub Court)

* **체크리스트 마감 규칙**: 본 작업계획서는 [4단계: 심사 청구]까지만 등록함.
