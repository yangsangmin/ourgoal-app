---
name: security-audit
description: 보안 감시자(security-auditor)를 호출해 특정 PR, 커밋 또는 코드베이스의 보안 상태를 독립 감사한다. 5대 보안 체크리스트(시크릿 노출, RLS 격리, XSS, API 엔드포인트 보안, 스토리지 민감정보)를 검증하고 PASS / WARNING / BLOCK 판정을 내린다. 사용 예 - /security-audit PR#43 또는 /security-audit
argument-hint: <PR 번호, 파일 경로 또는 비워둠(최신 변경사항)>
disable-model-invocation: true
---

# 보안 감사: $ARGUMENTS

1. 대상을 확정한다. `PR#n` 형식이면 `"C:\Program Files\GitHub CLI\gh.exe" pr view n --json title,body,commits,files` 및 `git diff main...HEAD`로 변경 파일들을 수집한다. 특정 파일/작업명이면 해당 파일 및 git log를 확인한다. 인자가 없으면 최신 변경사항(`git diff HEAD~1` 또는 `git status`)을 대상으로 한다.
2. `security-auditor` 서브에이전트를 띄운다(DEV-10: 보안 테스트 및 긴급 패치 쓰기 권한 보유).
   - 검증 대상 코드/diff를 프롬프트에 제공하고 5대 보안 체크리스트(시크릿 노출, RLS 격리, XSS, API 보안, 로컬 스토리지 민감정보) 검증 및 필요 시 선제 보안 테스트(`scripts/sec-*`) 작성을 지시한다.
3. `security-auditor`의 보안 감시 리포트(PASS / WARNING / BLOCK)를 사용자에게 보고한다.
4. 만약 판정이 🔴 BLOCK인 경우, 즉시 배포 및 병합을 차단한다. `security-auditor`가 직접 작성한 핫픽스 패치(diff)를 적용하거나 컨트롤타워/구현자에게 긴급 수정을 배정하여 해결 후 재검증한다.
