# TASK-ES-592 Vercel 배포 용량 절감 — .vercelignore 커밋

기준 origin/main eed37224. 상민님 보고(2026-10-07 14:52): "Vercel deployment storage 가 찼다". 유형: 새 유형(배포 설정) — 가장 가까운 표준은 L009(생성물·기록물 분리). 앱 세포 변경 없음, DOM ID 해당 없음.

## 1. [원칙 ①] 문제 정확히 파악
Vercel 배포 저장공간이 찼다. 측정(Vercel API, 읽기 전용): 프로젝트 ourgoal-app 배포 38개(production READY 8 · preview CANCELED 30), 가장 오래된 것 2026-10-06, Blob/KV/DB 저장소 0개, 계정 softBlock 없음. 사용량 API 는 hobby 요금제에서 막혀 수치는 확인 못 함.

## 2. [원칙 ②] 본질·원인·중심·핵심
본질: 배포 1회마다 저장소 전체(64.4MB)가 올라간다. 원인: GitHub 저장소에 `.vercelignore` 가 없다(이 PC 의 C:/dev/ourgoal-app 에만 추적 안 되는 사본이 있어 CLI 배포에만 적용, Git 자동 배포에는 미적용). 중심: 화면·서버가 실제로 읽는 파일은 6.8MB. 핵심: 런타임이 쓰는 파일을 하나도 빼지 않으면서 기록물만 뺀다.

## 3. [원칙 ③] 해결방식
저장소 루트에 `.vercelignore` 를 커밋한다. 빼는 것: reports/ scratch/ scripts/ court/ sim/ tests/ android/ .agent/ .claude/ .codex/ .githooks/ .github/ .task-links/ dev_log.md BACKLOG.md 헌법 사본 4개 capacitor.config.json, docs/ 하위 폴더(legal/ 제외)와 docs 루트 안내 문서 2개. 부정 규칙(`!`)은 쓰지 않는다(해석 차이로 docs/legal 이 빠질 위험 제거).

## 4. [원칙 ④] 재검토
- 개인정보처리방침 공개 주소 `https://ourgoal-app.vercel.app/docs/legal/privacy.md`(구글 플레이 등록) — docs/legal/ 은 남긴다.
- `.well-known/`(앱 연결) — 남긴다. (이 PC 의 추적 안 되는 사본은 .well-known 을 빼고 있어 위험했다 — 이번 파일은 빼지 않는다.)
- api/ 가 파일을 읽는 곳: `readFileSync|readdirSync|require('../(docs|reports|scripts|court|scratch|sim|tests)` 검색 0건.
- 화면·sw·vercel.json·api 에서 빼는 폴더를 가리키는 곳: index.html 2555행 주석 1줄뿐.
- package.json·package-lock.json 은 서버 함수 의존성 설치에 필요할 수 있어 남긴다.
- 기존 배포 삭제는 되돌릴 수 없는 바깥 행위(승인선 ④)라 이 PR 범위 밖 — 상민님 결심으로 따로.

## 5. [원칙 ⑤] 절차
`.vercelignore` 작성 → 모의 계산(docs/design/harness/vercelignore-size.js: 규칙을 git 트리에 적용) → 주장 → npm test → PR → 법정 → 상민님 "1" 병합 → 배포 뒤 실서비스 확인(앱 첫 화면 200, /docs/legal/privacy.md 200, /.well-known/assetlinks.json 200, api 하나 응답).

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
반론1: Git 자동 배포는 .vercelignore 를 안 읽는다. 격파: Vercel 문서상 Git 연동도 저장소를 받은 뒤 .vercelignore 를 적용한다 — 병합 뒤 배포의 파일 수·크기로 실측해 확인한다(못 재면 확인 못 함으로 보고).
반론2: 빠진 폴더를 화면이 몰래 쓰면 실서비스가 깨진다. 격파: 런타임 파일 전수 검색 0건 + 꼭 남아야 할 목록(index.html·js·api·icons·.well-known·manifest·sw·vercel.json·ui.css·ui.js·docs/legal·package.json) 모의 계산으로 전부 남음 확인 + 배포 뒤 주소 확인.

## 7. [원칙 ⑦] 단계별 실행
바꾸는 파일: `.vercelignore`(새), `docs/design/harness/vercelignore-size.js`(측정 도구), 이 REQ, `reports/TASK-ES-592/claims.json`, `docs/rules/TICKETS.md` 자기 행. 제품 코드·금고·헌법·시험 변경 0.

## 8. [원칙 ⑧] 막히는 지점 예상 및 성과 측정
측정(작업자 주장, 모의 계산): 배포 크기 64.4MB → 6.8MB(빠지는 57.6MB). 꼭 남아야 할 것 중 빠진 것 0. 실제 효과(Vercel 저장공간 수치)는 hobby 요금제에서 API 로 못 재므로 상민님 대시보드 화면으로 확인. 막히는 지점: 법정이 `.vercelignore` 를 제품 파일로 분류해 주장을 요구 — 정적 주장 2개로 건다.
