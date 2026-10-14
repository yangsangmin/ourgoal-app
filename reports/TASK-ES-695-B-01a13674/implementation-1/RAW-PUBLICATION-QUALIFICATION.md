# 원 로컬 탐침 자료와 공개 projection 구분

정상 pre-commit은 source commit 전에 `scenario-result-1791949673342.json`의 앱 WebSocket 콘솔 URL에 포함된 키 문자열을 HARDCODED_SECRET로 차단했다. 제품·원 시험·훅 변경이나 우회는 하지 않았다.

원 파일은 같은 경로에 원 byte 그대로 로컬 보존하며 이 report 폴더의 정확 해당 파일만 gitignore로 공개하지 않는다. 다른 원 first/실패 raw는 그대로다. 공개 `scenario-safe-metadata.json`은 원 raw SHA·enum/count/status와 해당 source/scenario SHA만 포함한다. 원문/키/URL 전문은 복제하지 않는다. 기존 source-packet.json의 원 경로/SHA는 당시 측정 원본이며 해당 raw만 로컬 전용이라는 구분을 이 후속 문서로 보충한다. 원 측정 파일을 덮지 않는다.

source-packet은 원 제품 bytes를 그대로 핀하며 이번 publication 분리는 제품/source 변경이 아니다. 실제 계정·운영·사용·효과·법정 판정은 미확인이다.
