# [REQ] 아바타 보관함(서랍) 데이터 증발 원인 규명 및 3중 영속화 요구사항 정의서

> **문서 ID**: REQ-TASK-ES-135-AVATAR-PERMANENT-PERSISTENCE  
> **티켓 번호**: #TASK-ES-135  
> **작성일**: 2026-09-17  
> **작성자**: Antigravity  
> **본질 축**: E1 (체크인/성장/아바타) & INFRA / FIX  
> **상한선**: [4단계: 로컬 메인 병합 및 5A 프리뷰 배포]  

---

## 1. 개요 및 배경
- **현상 및 문제점**:
  - 사용자가 생성한 AI 3등신 웹툰 아바타들이 보관함(아바타 서랍)에서 사라지거나, 기기 변경(PC ↔ 모바일 스마트폰), 브라우저 변경(카카오 인앱 ↔ 사파리 ↔ 크롬), 브라우저 캐시 삭제, 로그인 전환(게스트 ➔ 소셜) 시 유실되는 현상 발생.
  - 아워골 최고 헌법 제1조 4항(유저 데이터 유실 Zero Data Loss) 위배.
- **상민님 핵심 지시**:
  - *"아바타 만든 것들이 없어졌는데 이유가 뭐야? 문제해결 8원칙으로 원인파악해"*

---

## 2. 기능 요구사항 (Functional Requirements)

### FR-01. Supabase DB 영속화 원장 배선 (`users.saved_avatars`)
1. Supabase `users` 테이블에 `saved_avatars jsonb not null default '[]'::jsonb` 컬럼 신설 (`docs/sql/2026-09-17-users-saved-avatars-column.sql`).
2. `saveProfile()` 호출 시 `saved_avatars` 필드를 `users` 테이블에 동시 upsert.
3. 컬럼 미존재 시에도 에러 없이 부드럽게 폴백 재시도하여 기존 기능이 중단되지 않도록 보호.

### FR-02. 다중 기기/브라우저 간 실시간 복원 (`loadProfile`)
1. `loadProfile()` 실행 시 Supabase `users.saved_avatars`를 1순위로 조회하여 로컬 `savedAvatars`가 비어있더라도 즉시 복원.
2. 로컬과 원격 데이터가 모두 존재할 경우 ID 또는 URL 기준으로 합집합(`Union`) 병합하여 양방향 동기화.

### FR-03. 소셜 로그인 전환 시 게스트 아바타 무손실 마이그레이션 (`restoreSessionAndEnter`)
1. 게스트 모드에서 생성한 `savedAvatars`를 소셜 로그인 계정의 기존 아바타 유무와 무관하게 100% 합집합(`Union`)으로 병합.
2. 기존에 게스트 데이터를 무단 삭제하던 조건문 버그를 전면 수정.

### FR-04. 아바타 이미지 256x256 정규화 압축 및 로컬 백업 3중화
1. 아바타 생성 시 256x256 해상도 및 JPEG 0.85 품질로 정규화하여 개당 20~25KB로 경량화.
2. 전용 로컬 백업 키 `ourgoal_saved_avatars_backup_<uid>`를 신설하여 5MB 쿼터 초과 위험을 원천 차단.

---

## 3. 비기능 요구사항
1. **헌법 제18조 스마트 안전핀 준수**: 라인 순증 300줄 이내, 기존 코드 무단 축약 금지.
2. **테스트 스위트 100% ALL PASS**: `npm test` 273개 이상 0 실패 유지.
3. **Tri-Sync 100% 무결성 유지**: 세션 종료 전 `tri-sync.js check` 통과.
