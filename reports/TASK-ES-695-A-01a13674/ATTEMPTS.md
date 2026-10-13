# 첫 오류와 교정의 범위

원 P0/원실패/원 판정은 변경하지 않았다. 아래는 이번 새 도구의 실행 과정이다.

- source intake 최초 ls-tree는 한국어 경로를 Git quoted 문자열로 받아 show가 실패했다. NUL 경로 열거로 바꿨고 원 Gitblob을 읽어 hash 목록을 만들었다.
- Chrome 최초 도구의 Object.defineProperty 반환 scope 객체 직렬화가 `Object reference chain is too long`으로 실패했다. 제품 오류로 승격하지 않고 반환값을 primitive로 바꿨다.
- 최초 사진 quota 조작은 입력 비움 대기에서 시간 초과했다. 실제 P0 writeVerified가 저장소 예외를 false로 반환하는 경계를 읽었고, P0 판단은 그대로 둔 채 동일 저장 호출의 실제 quota 오류와 백업 불변을 전달하는 adapter를 넣었다. 후속 실제 Chrome 결과에 부분본문/파일잔류/같은ID재시도/XP불변을 기록했다.
- 재실행에서 scope.state가 아직 노출되기 전 Chrome 도구가 profile을 읽어 `Cannot read properties of undefined (reading 'profile')`로 실패했다. 도구가 document.readyState와 실제 scope.state 준비를 기다리게 했고 제품의 부팅 코드 변경은 0이다.
- 일반 commit 훅이 smoke 실패로 차단했다. raw baseline/working stdout/stderr와 첫 dependency 환경은 별도 보존했다. 첫 collector가 stdout에서만 실패를 찾은 빈 결과는 오류였으며 stderr를 읽어 추출을 교정했다. 기대값을 고치지 않고 의존성 설치와 실제 confirmed 토스트 분기를 정합한 뒤 제한 대조했다. deps-fixed raw를 읽는다.
