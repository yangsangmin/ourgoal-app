# [PLAN] 아바타 보관함(서랍) 영구 영속화 및 데이터 증발 방지 작업계획서

> **문서 ID**: PLAN-TASK-ES-135-AVATAR-PERMANENT-PERSISTENCE  
> **티켓 번호**: #TASK-ES-135  
> **작성일**: 2026-09-17  
> **작성자**: Antigravity  
> **본질 축**: E1 (체크인/성장/아바타) & INFRA / FIX  
> **상한선**: [4단계: 로컬 메인 병합 및 5A 프리뷰 배포]  

---

## 1. 개요 및 변경 예산

| 대상 파일 | Before | After | 변경 예산 |
| :--- | :--- | :--- | :--- |
| `docs/sql/2026-09-17-users-saved-avatars-column.sql` | 없음 | 신설 (users.saved_avatars jsonb) | +20줄 |
| `index.html` | saveProfile/loadProfile DB saved_avatars 누락, 게스트 마이그레이션 조건 버그 | DB upsert/load 연동, 게스트 무조건 합집합 병합, 로컬 백업 3중화 | +45줄 |
| `js/avatar-system.js` | 캔버스 비압축 PNG/대용량 DataURL 생성 | 256x256 JPEG 0.85 품질 정규화 압축 (개당 25KB) | +15줄 |
| `api/track.js` | sync_records에 saved_avatars 처리 없음 | sync_records profileToSave에 saved_avatars 백업 파이프라인 추가 | +10줄 |
| `scripts/smoke-test.js` | #TASK-ES-135 검증 부재 | #TASK-ES-135 3중 영속화 컴플라이언스 테스트 5종 추가 | +35줄 |

---

## 2. 세부 실행 순서 (단계별)

1. [DB/인프라]: `docs/sql/2026-09-17-users-saved-avatars-column.sql` 작성 완료.
2. [저장 및 로드]: `index.html`의 `saveProfile()` 및 `loadProfile()`에 `saved_avatars` 양방향 동기화 및 백업 키 신설.
3. [마이그레이션 수술]: `index.html`의 `restoreSessionAndEnter()` 게스트 ➔ 소셜 전환 시 `savedAvatars` 합집합 병합 배선.
4. [엔진 최적화]: `js/avatar-system.js` 아바타 이미지 압축 및 `api/track.js` 서버리스 복구 배선.
5. [테스트 및 검증]: 스모크 테스트 및 무결성 게이트 전수 통과 확인.
6. [로컬 브라우저 검증]: Chrome CDP로 아바타 서랍 영속성 E2E 실측 검증.
7. [메인 병합]: 로컬 `main`에 병합(4단계) 및 Vercel 5A 프리뷰 자동 배포.
