'use strict';const fs=require('fs');const v=JSON.parse(fs.readFileSync(__dirname+'/verification.json','utf8'));const rows=v.targetedCases.map(c=>'| '+c.file+' | '+(c.records??'미확인')+' / '+(c.backup??'미확인')+' / '+(c.distinctIds??'미확인')+' | '+c.exceptions+' |').join('\n');
const text=`# PR980 교정 1 인계

계획의 구현·변경 경계 측정을 수행했다. 정상 commit 뒤 정확 HEAD는 총괄에 도구 결과로 인계한다. 원격 push·Court 재청구는 총괄의 이 source 검토 전 보류다. 사용 가능·운영·효과와 새 공식 Court 판정은 null이다. 최초 공식 Court 4A23BBCD의 돌려보냄 1회는 불변이다.

기준 source ${v.base}, 최신 fetch origin/main ${v.origin}. 단독 제품 변경은 checkin-capture.js와 pro-record-save.js뿐이다. 현행 SAVE-SYNC/원 DIR006/P0/헌법978과 원티켓695를 승계하며 규범, 금고, 게이트, Court, TICKETS, index, 서버 DTO, LocalKeep 변경은 없다.

HOME은 기존 입력 처리기의 private 세대와 제출 당시 값/File/사진을 결박해 해당 제출분만 비운다. 같게 재입력한 글도 새 세대다. 제출 확인 뒤 남아 있는 새 초안은 새 ID를 쓰며, 사진만 미보관된 동일 초안의 재시도는 원 ID를 유지한다. 같은 uid의 새 profile 객체도 별도 초안 ID 수명으로 다룬다. 전문창은 memo/button DOM identity와 전체 필드 세대/값/사진을 비교하고 rows/columns를 복사한다. 다른 초안·새 창은 닫지 않으며 늦은 AI의 표시도 제한한다.

기기 실패 중 새 입력이 생기면 원 제출분은 원 profile의 메모리 snapshot으로 남긴다. 다음 같은 책임 저장에서 그 제출 자료와 변경 목록을 먼저 확인하고 그 뒤 현재 초안을 저장한다. 실패 중 XP는 0이다. 영구 장치 실패나 확인 전 페이지 종료까지의 영속 보존은 null이며, 단순 메모리 보유를 기기 보관 성공이라고 하지 않는다. 실패 재확인 뒤 원 record별 XP 표식을 둔다. 이 복구 경계의 원격 동기화/XP 원장은 운영 미확인이다.

C2는 실제 저장 상태 토스트를 기존 AI fallback 안내가 덮는 trace로 원인을 좁혔다. 같은 창/원계정/원기록/본문이고 기기 확인을 마친 후속만 저장 상태 안내를 다시 표시한다. 원 professional-guest.json의 fingerprint ${v.C2.fingerprint}, 단계 ${v.C2.steps}, 10번 textContains·11번 modal notVisible를 그대로 local Court runner에서 실행했다. failedStep=${v.C2.failedStep}. 이는 작업자 탐침이며 공식 판정이 아니다. C4는 실제 로그인한 원격 원장 경계만 tool-cannot-measure/needs-login로 정정했다. PC 게스트·local 부품의 0행/권한/늦은 응답 반례는 최초 component-result.json과 새 측정에 공개한다.

| 변경 경계 실측 파일 | memory / 기기 backup / 서로 다른 ID | runtime 예외 |
|---|---|---|
${rows}

source의 working 및 Git LF SHA는 verification.json의 productFiles에 있다. HOME 최종 profile 수명 보강 뒤 final2와 profile-generation-final을 측정했다. 전문 final과 C2-final은 같은 최종 pro-record-save 바이트를 측정했고 그 뒤 HOME의 독립 profile 수명 두 줄만 추가했다. 각 탐침은 실제 실행 시 sourcePins를 기록하며 전체 조합이 모두 같은 당시였다고 바꾸지 않는다.

원시나리오 바이트 불변=${v.scenariosBytesUnchanged}, 원 claim ID/종류 불변=${v.stableClaimIDsAndKinds}, 원 독립/Court hash 보존=${v.originalEvidenceHashesPreserved}, 보호 범위 diff bytes=${v.protectedDiffBytes}, schema 오류=${v.claimErrors.length}. 필수 targeted 검사 명령/exit/stdout/stderr는 verification.json에 연결한다. module-specs 공식 생성 결과 신고서 실변경 0, module-guard 종료 0이며 기존 9개 ui.confirm 경고는 원 그대로다. 원 whole18/439 수동 반복과 시험지 변경은 0이다.

재현: 동일 branch와 deps에서 node reports/TASK-ES-695-A-01a13674/correction-1/browser-target.cjs <mode> <새 phase>, C2는 node reports/TASK-ES-695-A-01a13674/correction-1/reproduce-C2.cjs <새 phase>를 쓴다. 원 raw를 덮지 않도록 새 phase로 출력한다. 검증 묶음은 node reports/TASK-ES-695-A-01a13674/correction-1/verify.cjs다. actual visible 게스트 입구, CDP mouse/keyboard, native lock과 국소 저장/AI fault로 측정했으며 실제 로그인/운영 E2E가 아니다. 사진 선택은 PC CDP 실제 File이고 실기기 전체 보장이 아니다. profile 세대는 실제 생성 게스트 자료의 객체 교체라는 국소 반례이며 진짜 계정 전환이라고 부르지 않는다.

최초 작업자의 hidden landGuestBtn JS click/JS 클릭 범위는 최초 chrome-result.json 그대로 보존한다. 새 실제 보이는 입구·mouse 결과를 최초 조작 방식으로 소급하지 않는다. c2-diag-before의 탐침 실패는 실제 인사 팝업이 클릭을 가린 locator 문제다. 원 실패 파일을 보존하고 실제 닫기 버튼 조작 뒤 별도 before-visible 결과를 만들었다. 해당 탐침 문제를 제품 결함으로 세지 않는다.

다음은 총괄의 exact source 독립 검토 → 정상 push/필수 prepush → 공식 Court 재청구다. product merge는 총괄 담당이고 이 writer는 merge/ready/approve/automerge하지 않는다. 서버 CAS·여러기기·XP 원장·실계정·운영 사용·효과는 null. 사진/AI/energy/focus 서버 확대·새AI 비용·live DB·SQL·원 소진 운영시험 재사용·중앙 Notion/metadata 쓰기는 0이다.
`;
fs.writeFileSync(__dirname+'/HANDOFF.md',text,'utf8');
