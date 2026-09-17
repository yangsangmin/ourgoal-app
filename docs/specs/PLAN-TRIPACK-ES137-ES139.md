# PLAN-TRIPACK-ES137-ES139 — 아워골 3대 고도화 작업계획서
- **티켓**: #TASK-ES-137, #TASK-ES-138, #TASK-ES-139
- **기준 헌법**: 최신 15대 조문 대통합 헌법 (AGENTS.md)
- **기준 문서**: docs/specs/REQ-TRIPACK-ES137-ES139.md

---

## 1. 세부 실행 계획
- [x] Step 1: 최신 15대 조문 헌법 확인 및 작업 브랜치(`feat/2026-09-17-tri-package-es137-139`) 생성
- [x] Step 2: REQ 및 PLAN 명세서 작성
- [ ] Step 3: `index.html` 내 3대 핵심 과제 구현:
  - 1. `getKSTDateKey` 신설 및 AI 조언/미션 KST 자정 롤오버 캐시 연동 (#TASK-ES-137)
  - 2. 캘린더 일간 뷰 24시간 타임라인 블록 뷰 렌더링 및 일정 추가 배선 (#TASK-ES-138)
  - 3. 설정창 노션 연동 32자리 UUID 정규화, 다이렉트 바로열기, 4단계 가이드 툴팁 배선 (#TASK-ES-139)
- [ ] Step 4: `docs/rules/TICKETS.md` 티켓 등록 및 `scripts/smoke-test.js` 전수 단언문 추가
- [ ] Step 5: `npm test` 275+개 전수 통과 및 15대 헌법 게이트 무결성 검증
- [ ] Step 6: Tri-Sync 3자 상호 동기화 무결성 검증
- [ ] Step 7: CDP 헤드리스 브라우저 로컬 화면 실측 검증
- [ ] Step 8: 로컬 메인 브랜치 병합 (4단계 완결) 및 상민님 보고
