---
name: audit
description: 외부 감시자(auditor)를 수동으로 호출해 특정 작업(PR 번호나 작업명)을 감사하고 노션 "작업 감사 로그"에 기록한다. /work가 자동으로 부르지 못한 작업(다른 세션·1호직원 PR·과거 작업)을 소급 감사할 때 쓴다. 사용 예 - /audit PR#43
argument-hint: <PR 번호 또는 작업명>
disable-model-invocation: true
---

# 수동 감사: $ARGUMENTS

1. 대상을 확정한다. `PR#n` 형식이면 `"C:\Program Files\GitHub CLI\gh.exe" pr view n --json title,body,commits,mergedAt,createdAt,headRefName`으로 정보를 모으고, 작업명이면 dev_log.md에서 해당 항목을 찾는다. 둘 다 없으면 사용법을 안내하고 멈춘다.
2. 노션 감사 로그(`collection://4ca58863-a71c-405c-9091-d54fd6bda1b8`)에 같은 PR/작업명이 이미 있으면 중복 기록하지 않고 그 행 URL을 알려주고 멈춘다.
3. `auditor` 서브에이전트를 띄운다(백그라운드 아님 — 결과를 바로 보고해야 하므로). 프롬프트에 1에서 모은 정보 전부와 "지시자·개입 횟수를 모르면 (미확인)으로 기록하라", "주요 기능 추가/변경 시 신규 회원 가입설명(온보딩) 갱신 계획 수립 및 가입자 노출 보고 여부를 필수 검증하라"를 포함한다.
4. auditor의 마지막 메시지를 그대로 사용자에게 전달한다. 노션 기록 실패 시 컨트롤타워가 대신 기록한다.
