---
priority: High
kind: Infra
---

# REQ: AST/소스 검증을 위한 개발 의존성 추가 (선행 PR)

Court 법정 실행기에서 소스 코드의 재생성 및 구문 검증(preserve-source)을 수행하기 위해 `@babel/parser` 및 `@babel/traverse` 개발 의존성(devDependencies)을 추가합니다.

이 변경은 앱 기능 코드(제품 로직)를 전혀 변경하지 않으며 오직 `package.json` 및 `package-lock.json`만 변경합니다.
이를 별도의 PR로 먼저 심사/병합함으로써, 이후 제출될 금고(Court) PR에서 "제품 코드와 채점 기준 동시 변경" 차단 훅에 걸리지 않도록 의존성을 Base에 확보하는 것이 목적입니다.
