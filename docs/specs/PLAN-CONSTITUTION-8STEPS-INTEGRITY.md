# 엔지니어링 작업계획서 (PLAN) — 아워골 최고 헌법 제2조 문제해결 8원칙 정밀 보강 및 기계적 게이트키퍼 린터 배선

> **문서 ID**: PLAN-CONSTITUTION-8STEPS-INTEGRITY  
> **요구사항 연계**: REQ-CONSTITUTION-8STEPS-INTEGRITY  
> **티켓 연계**: #TASK-CONSTITUTION-8STEPS  
> **작성 일시**: 2026-09-17  
> **작성자**: antigravity-session-6be09551  
> **규범 준수**: OURGOAL_ABSOLUTE_INTEGRITY_RULES 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 헌법의 기존 효과 100% 보존 하에 제2조 8원칙 세부 기준 법제화 및 게이트키퍼 정적 린터 배선.
- **영향 받는 파일 목록 전수**:
  - AGENTS.md (루트 및 사용자 홈)
  - docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md
  - scripts/verify-integrity-gate.js
  - docs/specs/TEMPLATE_REQ_8STEPS.md
  - docs/specs/TEMPLATE_PLAN_8STEPS.md
  - CLAUDE.md
  - GEMINI.md
  - dev_log.md

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 에이전트의 자의적 축약·생략을 컴파일/테스트 단계에서 물리적으로 차단하는 정적 분석 방화벽(Static AST Linter) 구축.
- **[원인] (Technical Causes)**: 기존 검증 게이트가 파일 존재 유무만 s.existsSync로 확인하고 문서 내부 구조를 AST 검증하지 않았음.
- **[중심 배선] (Core Wire & State)**:
  - scripts/verify-integrity-gate.js 내 lint8Principles 함수 배선.
  - 정규식 및 시간 기반 필터링(stat.mtimeMs)으로 최근 변경 파일 자동 감지.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 기존 15대 조문 단일 위계 보존, Tri-Sync 체인 보존, 
pm test 0 failure 단언.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  [REQ/PLAN 작성] -> [git 변경 감지] -> [verify-integrity-gate 린터 구동] -> [8원칙 100% 충족 검증] -> [npm test 통과] -> [PR/병합 승인]

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| AGENTS.md | 제2조 8원칙 보강 및 제5항 신설 | +57줄 | -8줄 | +49줄 | 최고 헌법 개정 |
| docs/rules/... | 헌법 정본 동기화 | +71줄 | -17줄 | +54줄 | 법령 전문 |
| scripts/verify-integrity-gate.js | 8원칙 정적 린터 배선 | +112줄 | -3줄 | +109줄 | 기계적 게이트키퍼 |
| docs/specs/TEMPLATE_*.md | 표준 템플릿 2종 고도화 | +175줄 | -130줄 | +45줄 | 표준 템플릿 |
| CLAUDE.md / GEMINI.md | 보조 지침 정합성 단일화 | +18줄 | -10줄 | +8줄 | 프롬프트 정합 |
| dev_log.md | 작업 내역 기록 | +21줄 | 0줄 | +21줄 | 개발 로그 |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 15대 조문 체계와 5대 축, 껍데기 방지 등 헌법적 효력을 100% 보존했는가? (확인 완료)
- [x] 기존 
pm test 294개 스모크 테스트와 충돌이 없는가? (확인 완료)
- [x] 유저 데이터 10종 페르소나 딥이퀄 검증을 100% 통과하는가? (확인 완료)

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (헌법 정본 개정)**: AGENTS.md 및 OURGOAL_ABSOLUTE_INTEGRITY_RULES.md 수정 (완료)
2. **Step 2 (기계적 린터 배선)**: erify-integrity-gate.js에 8원칙 정적 검사 함수 추가 (완료)
3. **Step 3 (표준 템플릿 고도화)**: TEMPLATE_REQ_8STEPS.md, TEMPLATE_PLAN_8STEPS.md 교체 (완료)
4. **Step 4 (보조 지침 정돈)**: CLAUDE.md, GEMINI.md 단일 규격 정돈 (완료)
5. **Step 5 (Tri-Sync)**: Obsidian SOP 개정 반영 및 커맨드센터 저널 기록 (완료)
6. **Step 6 (로컬 검증 및 메인 병합)**: 
pm test ALL PASS 확인 후 로컬 main 병합 (진행 중)

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**: 인터랙션 버튼 604개 100% 배선 보존 확인.
- **시나리오 B (Zero Data Loss)**: 페르소나 10종 데이터 무손실 딥이퀄 PASS 확인.
- **시나리오 C (Zero UX Regression)**: 계정, 세션, 3대 본질 루프 보존 확인.
- **시나리오 D (Full State Propagation)**: Tri-Sync 3자 상호 동기화(Obsidian, Command Center) 확인.
- **시나리오 E (자동화 게이트 통과)**: scripts/verify-integrity-gate.js 17개 검사 전수 PASS 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] 헌법 제2조 1항 및 5항 보강 완료
- [x] 기계적 게이트키퍼 8원칙 린터 배선 완료
- [x] 표준 템플릿 2종 고도화 완료
- [x] CLAUDE.md / GEMINI.md 정합성 정리 완료
- [x] Tri-Sync 동기화 및 저널 체인 기록 완료
- [x] 
pm test 294개 스모크 및 17개 무결성 게이트 ALL PASS 완료
- [ ] 브랜치 커밋 및 로컬 main 무충돌 병합
- [ ] Vercel 프리뷰 배포(5A단계) 발송

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 블로커**: git merge 시 충돌 마커 발생 가능성.
- **대책**: 변경된 파일들이 규범/스크립트 중심이므로 무충돌 병합 보장, 병합 직후 
pm test 재검증.
- **롤백 계획**: 문제 발생 시 git reset --hard HEAD~1로 이전 안정 상태 복귀 가능.
