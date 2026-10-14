# 최초 실패와 공개 사본

정상 commit 첫 시도는 essence-gate의 HARDCODED_SECRET 검사에서 실패했다. C2 local 탐침의 consoleErrors에 기존 공개 SDK URL의 apikey 문자열이 포함됐기 때문이다. 같은 시도 전 cached diff check는 원 Court-REPORT의 Markdown 줄끝 공백과 원 home-cockpit 사본의 기존 줄끝 공백을 발견했다. 원 도구 결과는 이 writer의 rollout 기록에 남아 있다. Court의 공식 반려는 여전히 4A23BBCD 한 번이다. 이 local hook 실패를 Court 반려로 세지 않는다.

원 C2-before/after/final.json은 로컬의 원 경로·바이트·hash 그대로이며 Git에 싣지 않는다. 이 디렉터리의 한정 .gitignore는 /C2-*.json만 제외한다. 공개 public/C2-*.json은 consoleErrors 안의 URL credential만 지웠다. 기대값·steps·assertions·결과·product pin은 바꾸지 않았다. project-C2.cjs와 public-projection.json이 원 raw SHA/바이트·공개 SHA·지운 URL 수를 낸다. 원 raw가 없는 다른 checkout에서는 공개 사본을 읽고, 원 PC에서는 원 raw SHA도 확인한다. 원 SDK/제품/Court/게이트는 변경하지 않았다.

다음 정상 commit 시도는 commit-msg의 NO_TAG로 거절됐다. 제품이나 시험을 바꾸지 않고 허용 형식의 [E2] #TASK-ES-695 본질 태그·원티켓을 붙여 같은 변경을 정상 commit했다. 두 종류의 local hook 실패는 새 공식 Court 판정이 아니다.

original/*은 byte archive 속성(-text/-diff)으로 원 CRLF·줄끝 공백을 그대로 보관한다. 공개 숨김으로 제품 검사를 줄인 것이 아니라 원 source와 첫 판결의 불변 보관이다. 실제 제품은 정상 text diff/check와 독립 검토 대상이며 original 사본은 SHA와 Git index blob으로 원 바이트를 대조한다. 새 측정 JSON은 -text로 기록 당시 바이트를 유지한다. 규범·시험·훅 우회는 0이다.
