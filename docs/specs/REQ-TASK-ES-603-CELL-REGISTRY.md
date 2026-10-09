# TASK-ES-603 기존 세포 신고서 복구

목표: 현재 main에서 기존 세포 두 개의 등록 누락을 복구하고 기존 생성기로 지도·낮아진 기준선을 갱신한다.
작업참고: 기준 PR #847(eed37224), C:/dev/agent-knowledge/WORK-REFERENCE.md 전체 확인. 분류: 표준(L009·L023·L052·L054).
계획: .claude/plan-TASK-ES-603.md. 입력: .yangvis-inputs/request.json 및 .yangvis-inputs/before/.

## 1. [원칙 ①] 문제 정확히 파악
R1: js/tabs/goals/goal-rescale.js의 K.rescaleGoal을 goals/goal-rescale로 신고한다.
R2: js/tabs/records/quick-checkin.js의 K.buildCheckinRecord/K.saveQuickCheckin을 records/quick-checkin으로 신고한다. 빠른 체크인은 미사용 보존 함수다.
R3: 기존 HAND_FIELDS 전체와 cell-descriptions.json의 names/cells 기존 키·값을 전수 보존하고 새 두 id만 설명을 보충한다. TASK-ES-602의 별도 설명은 수정하지 않는다.
R4: 기존 생성기로 module-baseline.json·cell-map.json·inline-script-map.json·INLINE-SCRIPT-MAP.md를 갱신한다. 기준선은 낮아진 실측값만 반영한다.
R5: 기존 실패, REQ 무결성, 생성 동일성, 전경 npm test, 제품·시험·금고 변경 검사를 원시와 measurement.json으로 기록한다.
R6: config 분야 claims.json에 요구마다 실제 설정 내용과 보고 기록 주장을 구분해 연결한다.
DOM: 이 업무에 변경 대상 DOM은 없다. #captureSave는 소스 주석의 구별 대상일 뿐 변경·조작하지 않는다.

## 2. [원칙 ②] 본질·원인·중심·핵심
- 본질: 이미 있는 코드의 책임을 신고서·생성 지도에서 정확히 읽을 수 있게 한다.
- 원인: TASK-ES-600/601에서 이전한 기존 소스가 modules.json에 등록되지 않아 module-guard가 실패한다. 최초 실행의 원시 결과로 확인한다.
- 중심: 두 파일과 신고서의 대응, 실제 K 키트 노출과 손 설명의 일치다.
- 핵심: 자동 필드는 module-specs.js --write만 쓰고 기존 손 필드와 설명은 전수 보존한다. kind는 tab, size는 small로 별도 칸을 사용하며 없는 provides/requires/owns를 발명하지 않는다.

## 3. [원칙 ③] 해결방식
modules.json에 두 파일의 id와 실제 책임 role만 보충하고 node scripts/module-specs.js --write로 자동 필드를 채운다. cell-descriptions.json의 names/cells에 두 id만 추가한다. node scripts/module-guard.js --update는 사유 없이 하향 측정만 반영한다. node scripts/cell-map-export.js 및 node scripts/inline-script-map.js --write를 사용한다.
목표 재계산은 목표·미완료 마일스톤·할 일의 기한을 현재 날짜 기준으로 갱신하고 재계산 횟수와 날짜를 남기는 보존 함수다. 빠른 체크인은 기록 객체 생성, profile.records 추가, EXP·저장·신호·뷰 갱신·팀 인증·계측 경로가 담긴 미사용 보존 함수다. 코드에 경로가 있다는 사실을 적으며 실제 운영 호출이나 서버 저장 성공을 새로 측정했다고 주장하지 않는다.

## 4. [원칙 ④] 재검토
허용 산출물은 사용자 지정 architecture 파일, 이 REQ, reports/TASK-ES-603의 측정·주장·원시·측정 .cjs, 자기 계획과 로컬 task-link pending이다. index.html/js/**·tests/**·court/**·금고·규범·승인선·지시함·Git config·다른 worktree는 변경하지 않는다.
소스 정독 발견: rescaleGoal의 scaleRatio는 기본값 지정 뒤 기한 계산에 쓰이지 않는다. saveQuickCheckin에는 L.MOCK_GROUPS 참조 및 team_pings 쓰기 실패를 삼키는 경로가 있다. 분리된 키트에 함수 정의·노출은 있지만 호출부 검색에서 운영 호출은 확인하지 못했다. 이 업무에서는 수정·활성화하지 않고 범위 밖 보고로 남긴다. 기능·실계정·서버·모바일 검증 결과는 null이다.

## 5. [원칙 ⑤] 절차
1. 지침·청사진·신고서·최근 커밋·기존 claims·원본 전체를 읽고 입력 SHA와 기존 module-guard exit/raw를 저장한다.
2. 기존 verify-integrity-gate.js로 REQ 무결성을 먼저 확인한다.
3. 두 신고·설명을 추가하고 기존 생성기를 순서대로 실행한다.
4. 모든 기존 HAND_FIELDS·names/cells 키·값과 기준선 이력 보존, 새 등록 내용, 생성 --stdout/재실행 동일성, git diff·추적 파일 SHA를 측정한다.
5. NODE_PATH=C:/dev/ourgoal-app/node_modules 환경에서 npm test를 전경으로 끝까지 실행하고 stdout/stderr/exit를 저장한다.
6. measurement.json과 필수 요구별 config claims를 작성하고 증거 참조·SHA·내용을 재검사한다. commit/push/PR/외부 sync는 root 담당이다.

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파
반론1: 신고 복구가 미사용 빠른 체크인을 활성 기능으로 과장할 수 있다. 대응: role/name/does에 미사용 보존을 명시하고 제품 소스·운영 경로는 0변경으로 측정한다.
반론2: 생성기가 기존 손 정보를 덮어쓰거나 main 이동으로 전체 수치가 거짓이 될 수 있다. 대응: HAND_FIELDS를 생성기에서 읽어 전수 비교하고 기존 names/cells 모든 값·키 및 기준선 이력을 대조한다. 전체 수치·HEAD는 immutable reports snapshot에만 기록하고 claims의 실제 내용 검사는 새 두 id와 안정된 구조만 검사한다. root가 TASK-ES-602와 병합할 때 그 새 일곱 설명도 보존한다.

## 7. [원칙 ⑦] 단계별 실행
실행 담당: 이 전용 worktree의 TASK-ES-603 세션 하나. 보고 정본: reports/TASK-ES-603/measurement.json. 실행마다 command/cwd/exitCode/raw 경로·SHA를 저장하며 원시가 없는 수치를 만들지 않는다. 자기 측정은 법정 판정이 아니다. 외부 메시지·발행·Court·병합·배포는 수행하지 않는다.

## 8. [원칙 ⑧] 막히는 지점 예상·성과 측정
fetch는 공유 Git FETCH_HEAD 쓰기 권한 제한으로 실패했다. 기존 origin/main 지시함은 읽었으며 열린 지시가 없다. 이 제한을 원시에 저장하고 제공된 sourceCommit/HEAD/before 일치부터 확인한다. 기준선 증가가 측정되면 올리거나 우회하지 않고 실패를 보존한다. npm test 실패가 기존 제품·시험 변경을 요구하면 그대로 보고한다. 성공 기준은 새 두 등록·설명, 기존 손 정보 전수 보존, 생성 동일성, 금지 경로 0변경, 모든 명령 원시 보존이다. 실제 시험 종료값을 기록하며 전체 설명 대기 0을 청구하지 않는다. Court 판정·운영·서버 검증은 null이다.

## Root 최종 조립 — native 원본과 실제 출처 복원 분리

native 실행은 종료했지만 안에서 실행한 Git/Node spawnSync가 EPERM/status null로 막혀 생성 지도 source.commit이 null·prs가 비어 있었다. 최초 measurement.json·31개 청구·실패 원시와 원 산출물 9개는 외부 immutable snapshot 및 원 보고서 그대로 보존한다. root가 전용 agent tool 환경에서 기존 module-specs --write, module-guard --update, cell-map-export, inline-script-map --write를 실제 실행해 지도 출처와 이력을 복원했다.

기준선은 native에서 이미 낮춰졌다. 기존 --update는 실측값이 같으면 이력을 더하지 않으므로 마지막 native 이력 commit null은 삭제·손편집하지 않았다. 실제 HEAD와 생성기 결과는 reports/TASK-ES-603/root-assembly.json의 별도 출처 기록을 보라. null을 실제 commit으로 보았다고 주장하지 않는다.

기존 HAND_FIELDS/설명/세포 ID 전수 보존, 새2개만 추가, 원래 TASK-ES-602의7개 pending 보존, 생성 반복 동일성 및 금지 파일 무변경은 root-assembly의 측정과 원시 SHA로 대조한다. native의 npm test exit1은 그대로 유지한다. native 종료 뒤 독립 root가 실행한 exit0과 최종 조립 후 실제 npm 결과는 서로 다른 출처 기록이며 원 native 실패를 성공으로 덮어쓰지 않는다. 원31개 청구는 내용·ID·종류·검사 그대로 두고 실제 최종 파일/출처·새 기록만 C32이후 config 청구로 추가한다. 제품 운영/계정/서버 동작을 새로 측정하지 않았으며 Court·원격 병합·배포 판정은 null이다.
