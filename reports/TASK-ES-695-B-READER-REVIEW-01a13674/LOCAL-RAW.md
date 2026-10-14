# 첫 로그 원bytes의 로컬 보존

첫 PowerShell redirect의 UTF16-BOM 원로그는 `C:/dev/wt/er18readers-01a13674/reports/TASK-ES-695-B-READER-REVIEW-01a13674/.private/normal-commit-first-utf16.raw`에 그대로 있다. 원SHA `c8b90d281ee2d728c9120821eed6b48df93561a744ffcdd4d9562517f345e3c4`는 closure collector 산출값이다. Git에는 명시 UTF8 projection인 normal-commit.log만 싣고 이 단일 로컬 원raw 경로만 자기 report의 .gitignore에 지정했다. 원raw 삭제/덮어쓰기0이며 다른 파일·시험·claims·제품·원자료를 가리는 규칙을 추가하지 않았다.

source 의견 c888cb51와 closure6db9c52c 이후 이 기록은 로컬 보존 위치/추적상태 설명만 추가한다. FIRST 의견과 source-seal/closure 원bytes는 바꾸지 않는다. root가 원raw를 읽으려면 위 실제 작성 worktree의 원파일을 SHA로 대조한다.
