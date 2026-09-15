# 실행계획서 (PLAN) — Web Push 인프라 완결 & 커뮤니티 신고·차단 UGC 보호 시스템 정합성 확보

> **문서 ID**: PLAN-WEB-PUSH-AND-UGC-SAFETY-COMPLETION  
> **티켓 연계**: #TASK-ES-103  
> **작성 일시**: 2026-09-15  
> **작성자**: Antigravity AI Engine  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수

---

## 1. 개요 및 목적
- **목표**: 누락되었던 `/api/vapid-public-key` 엔드포인트를 구현하여 Web Push 파이프라인의 마지막 조각을 완성하고, 커뮤니티 신고 및 사용자 차단 UGC 안전망의 무결성을 단위 테스트 및 실물 브라우저 검증으로 공고히 확정한다.

---

## 2. 세부 구현 계획

### 2-1. `api/vapid-public-key.js` 신규 구현
```javascript
module.exports = function handler(req, res) {
  var key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    res.status(500).json({ error: 'VAPID_PUBLIC_KEY is not configured' });
    return;
  }
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).json({ publicKey: key });
};
```

### 2-2. `BACKLOG.md` 대장 동기화
- 14번(Web Push 인프라): 완료 처리
- 24번(커뮤니티 신고 · 자동 숨김): 완료 처리
- 45번(사용자 차단 기능 구현): 완료 처리

### 2-3. `scripts/smoke-test.js` 테스트 추가
- `api/vapid-public-key.js` 유효 모듈 검증 및 VAPID 키 반환 규격 검증
- `filterHidden` 및 `filterBlockedPosts` 단위 테스트 검증
- `openBlockedUsersModal` 및 차단/신고 핸들러 존재 검증

---

## 3. 검증 계획
1. **단위 테스트**: `npm test` 247개 테스트 100% 통과 확인.
2. **헌법 제18조**: `index.html` 22,196줄 불변 확인.
3. **Tri-Sync**: 492건 일치 확인.
4. **로컬 main 병합**: 헌법 제14조에 따라 병합 후 완료 보고.
