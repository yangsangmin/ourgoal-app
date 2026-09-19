# 아워골 최고 헌법 버전 레지스트리 (Constitution Version Registry)

본 문서는 아워골 최고 헌법(`AGENTS.md` 및 `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md`)의 제정·개정 이력과 각 버전의 원문을 영구 보존하는 공식 버전 관리 대장이다.

---

## 📜 버전별 개정 이력 및 원문 아카이브

| 버전 코드 | 승인일자 | 최고결정권자 | 주요 개정 내역 | 보존 원문 파일 |
| :--- | :---: | :---: | :--- | :--- |
| `v2026.09.11-INITIAL` | 2026-09-11 | 상민님 | 아워골 초기 14대 조문 제정 및 3대 본질 루프(E1/E2/E3) 확립 | git commit: `0076a91` |
| `v2026.09.14-SUPREME-14` | 2026-09-14 | 상민님 | 외부 연동 E2E 무결성(제20조), 헌법 독점주의·단일 위계(제21조) 신설 및 14대 조문 전면 개편 | git commit: `1c4a4ae` |
| `v2026.09.15-SUPREME-15` | 2026-09-15 | 상민님 | 15대 조문 단일 위계 대통합, 유저 자산 원격 원장화(제15조) 편입, 코드 줄수 족쇄 철폐 | git commit: `739186c` |
| `v2026.09.17-ULTIMATE` | 2026-09-17 | 상민님 | 문제해결 8원칙 정밀 린터 배선(제2조 5항), 아바타 320종 단일화(제10조 4~5항), 스토리지 5대 고도화 | [`OURGOAL_..._v2026.09.17_ULTIMATE.md`](archive/OURGOAL_ABSOLUTE_INTEGRITY_RULES_v2026.09.17_ULTIMATE.md) |
| `v2026.09.18-VISUAL-INTEGRITY` | 2026-09-18 | 상민님 | 6대 무결성 체계 승격(제7조 8항 시각 자가감사), CSS 은폐 꼼수 금지(제3조 5항), 기획 시각 IA 명세(제2조 6항), 허상지표 척결(제4조 1항), 4-Block 팩트 보고(제8조 3항) | [`OURGOAL_..._v2026.09.18_VISUAL_INTEGRITY.md`](archive/OURGOAL_ABSOLUTE_INTEGRITY_RULES_v2026.09.18_VISUAL_INTEGRITY.md) |
| `v2026.09.19-PHILOSOPHY-INTEGRATED` | 2026-09-19 | 상민님 | 상민님 핵심 철학 헌법 전격 통합: 실존적 삶의 불안 해소 목적(제1조 1항), RPG식 퀘스트/청사진 연결 E1 & 무공해 동류연대 E3 재정의(제1조 3항), 8원칙 REQ 3대 철학 심사 배선(제2조 1항 2호), 코어루프 침해 과금/광고 전면 금지(제4조 1항 8호), 수익화 4대 규범 및 초기 광고 배제 명문화(제5조 1항 1호) | [`OURGOAL_..._v2026.09.19_PHILOSOPHY_INTEGRATED.md`](archive/OURGOAL_ABSOLUTE_INTEGRITY_RULES_v2026.09.19_PHILOSOPHY_INTEGRATED.md) |
| **`v2026.09.20-SYSTEMIC-SYNERGY`** | 2026-09-20 | 상민님 | **헌법 체계적 시너지 및 물리적 집행력 완성: 4차원 심층 감찰 매트릭스 의무(제2조 제7항), 연속적 유저 여정 단절 제로 헌법(제3조 제6항), 도메인 철학 역행 및 상식적 개념 괴리 방치 금지(제4조 제1항 제9호), 모바일 375px 4대 시각 물리 규격 및 스크린샷 선제공(제7조 제8항), 세션 착수 시 Step 0 최신 브랜치 동기화 및 다중 세션 정합성 검증(제11조 제4항), 헌법 개정 즉시 레거시 코드 소탕 및 게이트키퍼 동시 배선 의무(제14조 제9항)** | [`OURGOAL_..._v2026.09.20_SYSTEMIC_SYNERGY.md`](archive/OURGOAL_ABSOLUTE_INTEGRITY_RULES_v2026.09.20_SYSTEMIC_SYNERGY.md) |

---

## 🔒 헌법 버전 관리 3대 불변 원칙

1. **비파괴 아카이브 원칙**: 헌법을 개정할 때는 기존 정본을 덮어쓰기 전에 반드시 `docs/rules/archive/`에 해당 버전 번호를 명시한 원문 사본을 영구 저장해야 한다.
2. **단일 위계 동기화 원칙**: 전역 정본(`C:/Users/HP/AGENTS.md`)과 저장소 정본(`docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md`)은 단 1글자의 불일치도 없이 100% 동일하게 동시 갱신되어야 한다.
3. **기계적 게이트키퍼 영구 배선 원칙**: 개정된 조항의 핵심 키워드와 위계 규칙은 `scripts/verify-integrity-gate.js`에 기계적 단언문(Assertion)으로 즉시 편입되어야 한다.
