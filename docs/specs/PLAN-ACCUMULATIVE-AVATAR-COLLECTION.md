# [PLAN] 생성 아바타 누적 보관함(히스토리) 및 자유로운 변경·착용 작업계획서

> **문서 ID**: PLAN-ACCUMULATIVE-AVATAR-COLLECTION  
> **티켓 번호**: #TASK-ES-119  
> **작성일**: 2026-09-16  
> **작성자**: Antigravity  
> **본질 축**: E1 (체크인/성장/아바타) & INFRA  
> **상한선**: [4단계: 로컬 메인 병합 및 5A 프리뷰 배포]  

---

## 1. 문제해결 8원칙 2회차 분석

### ① 본질 목표 한 줄
유저가 생성한 AI 만화 아바타들을 최대 10개까지 '내 아바타 서랍'에 영구 누적 보관하고, 횟수 차감 없이 자유롭게 확인·변경·착용할 수 있는 영속성 컬렉션 시스템 구현.

### ② 중심 배선 (Core Wire)
1. `js/avatar-system.js`:
   - `getSavedAvatars(profile)`: 보관함 목록 로드 (기존 customAvatarUrl 자동 이전 포함)
   - `addSavedAvatar(profile, item)`: 신규 생성 시 보관함 배열에 추가
   - `openAvatarModal`: 모달 상단에 '내 아바타 서랍' 카드 덱 UI 렌더링
   - 카드 클릭 ➔ 메인 미리보기 및 착용 상태 전환 연동
2. `index.html`:
   - `restoreSessionAndEnter()`: 게스트 `settings.savedAvatars`를 소셜 로그인 프로필로 100% 무손실 마이그레이션
   - `loadProfile()`: `savedAvatars` 배열 무결성 검증 및 백업 복원 지원
   - 헌법 제18조 `index.html` 22,196줄 정확히 유지
3. `scripts/smoke-test.js`:
   - `#TASK-ES-118` 전용 스모크 테스트 및 컴플라이언스 게이트 추가

### ③ 파일별 Before/After 및 변경 예산
- `js/avatar-system.js`:
  - Before: 아바타 생성 시 단일 `customAvatarUrl`만 덮어씀.
  - After: `savedAvatars` 배열에 최대 10개까지 누적 저장, 모달 내 보관함 카드 덱에서 자유 선택 및 착용.
- `index.html`:
  - Before: 게스트 소셜 마이그레이션 시 `customAvatarUrl` 단일 값만 복제.
  - After: `savedAvatars` 배열 전체를 복제 승계, 22,196줄 100% 불변.

### ④ 재검토
- 로컬스토리지 용량: 256x256 아바타 10개(약 300KB)는 5MB 용량 내에서 매우 안전함.
- 초록 로봇 아바타와의 호환성: 로봇 아바타 선택 시에도 기존 저장된 커스텀 아바타들은 보관함에 온전히 보존됨.

### ⑤ 체크리스트 (4단계 상한선)
- [ ] 1. 보관함 데이터 모델 & 스토리지 함수 구축 (`js/avatar-system.js`)
- [ ] 2. 아바타 모달 내 보관함(서랍) UI 및 변경 배선 (`js/avatar-system.js`)
- [ ] 3. 게스트 마이그레이션 및 22,196줄 불변 압축 (`index.html`)
- [ ] 4. 테스트 스위트 추가 및 검증 (`scripts/smoke-test.js`, `npm test` 258개 ALL PASS)
- [ ] 5. 로컬 Chrome 브라우저 E2E 실측 확인 및 스크린샷 확보 (3단계)
- [ ] 6. 로컬 main 병합 및 Vercel 프리뷰 배포 (4단계/5A단계)
