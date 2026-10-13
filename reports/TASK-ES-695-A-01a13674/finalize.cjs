'use strict';const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'../..'),dir=__dirname;
const read=p=>JSON.parse(fs.readFileSync(dir+'/'+p,'utf8'));
const component=read('component-result.json'),browser=read('chrome-result.json'),checks=read('checks.json'),intake=read('source-intake.json');
const smoke=read('deps-fixed-smoke-compare.json');
let plan=fs.readFileSync(root+'/.claude/plan-K18-A.md','utf8');let seen=0;plan=plan.replace(/^- \[ \]/gm,m=>++seen<=4?'- [x]':m);fs.writeFileSync(root+'/.claude/plan-K18-A.md',plan,'utf8');fs.writeFileSync(root+'/docs/specs/PLAN-TASK-ES-695-A-01a13674.md',plan,'utf8');
const report=`# K18-A 저장 경계 인계 — 작업자 측정, 판정 아님

retained TASK-ES-695 · 실행 leaf TASK-ES-695-A-01a13674 · root 공통 TASK-CC-CELL-UNWIRE-RUN-309dca5d.
기준 PR978 실제 병합 e140db658f5b735f8b2d99fa45f541d16871994e. 요청 gpt-6.1-sol/high, 실제 ${intake.model.actual.model}/${intake.model.actual.effort} (${intake.model.actual.timestamp}, source-intake.json). writer /root/contracts 하나, 추가소환/중앙·TICKETS·Notion 쓰기 0.

기존 첫 원격 응답 대기 동안 records/goals backup이 null이었던 원반례를 같은 e140 소스의 새 경계 도구로 보존했다(component-result.json). P0 원파일 ${intake.originals.length}개 Gitblob 불변=${checks.originalP0BlobsUnchanged}; 규범/ACTIVE/Court/기존 LocalKeep·profile-load·RecordLedger/원 reports695/기준선 diff 바이트=${checks.protectedDiffBytes}. 옛 검사 기대값·원결과·최초 의견을 고치지 않았다.

A 두 caller가 deviceFirst 결과를 받아 자료+목록 확인 뒤 입력/잠금을 풀고 원 기록의 XP/축하·기존 AI를 진행한다. 새 저장 셀은 기존 P0와 DTO/fallback을 경계에서 공급받는다. 사진 quota 분기는 실제 저장소 예외와 백업 불변 여부를 확인해 대상 사진만 제외하고 본문+목록을 다시 되읽는다. input/사진·stable ID는 실패/partial 때 남고 partial 재시도는 XP를 반복하지 않는다.

원격은 현재 인증 uid·원 changeId/세대·1 returned row·보낸 칸의 자료형/시각을 확인한 대상만 반영됨으로 올린다. 0행·오류·timeout·빠진 컬럼은 미확정/실패 분류이고 기기 payload를 버리지 않는다. 과거 목록 밖 자료는 이 A 경로가 자동 발송하지 않는다. navigator.locks가 없는 곳은 성공으로 승격하지 않는 한정 지원이다. 목록-only 복구는 DTO 본문과 사진 없음 표식까지며 사진 복원이라고 부르지 않는다.

새 부품 경계 검사 ${component.checks.length}개를 실행했다(실제 P0 API 재사용 포함). 명령과 raw stdout/stderr는 checks.json과 check-*.txt에 있다. 실제 ${browser.Chrome}의 정식 게스트 생성/제품 DOM/Storage에서 중복 클릭·재실행 같은 ID·outbox quota 입력 잔류·사진 partial/재시도·전문 모달·늦은 AI 원기록 귀속을 측정했다. 국소 storage/AI 오류 및 지연 주입이며 fake auth/모의 서버 row 배열 E2E가 아니다. 외부 완료 요청=${browser.externalRequestsCompleted}, live DB 쓰기=${browser.liveWrites}, AI 요청=${browser.AIRequests}. 생성기·모듈 가드·문법·diff check의 실제 종료코드는 checks.json에서 확인한다.

원 source 호환을 좁혔다: 무인자 saveProfile은 기존 await 순서를 유지하며 추가 결과는 legacy-unconfirmed/device:null이다. 모든 열한 경로의 기기 우선 전환·글로벌 요약·B/C 운영 CAS·삭제/복원·게스트 이관·실제 여러탭/폰·XP 서버 원장은 미완이다. 기존 read/load/동기화 경로의 과거 전량 재전송 위험과 P0 원 미확인을 덮지 않는다. local-only 피드백 저장과 새 원격 DTO 쓰기를 구분한다.

계획 완료=PR/Court 후속 전 미완; 사용 가능(운영/대표 실제 사용)=null; 효과=null. Court의 공식 결과는 node court/chat.js PR번호 출력만 정본이며 이 문서는 승격하지 않는다. 제품 merge는 root 독립 검토 뒤 root만 수행한다. 다음 행동은 exact HEAD의 독립 검토 및 B/C 선행 실서버 읽기/별도 시험 예산·구현 범위를 좁혀 맡기는 것이다.
`;
const smokeNote=`\n필수 commit 훅의 첫 smoke 실패는 원 stdout/stderr로 보존했다. 최초 기준/작업 요약은 smoke-compare.json에서 확인한다. 자신의 WT에 npm ci --ignore-scripts로 선언된 의존성을 설치한 뒤 제한 대조는 ${smoke.results.map(r=>r.name+': '+r.summary).join(' / ')}다. 테스트/기대값/단언/검사 수 변경 0, 훅 우회 0이다. 추가 따뜻한 토스트 문구는 계약 §7대로 confirmed+photoStored 분기에서 실제 사용하며 local/실패에 성공 문구를 쓰지 않는다. source-seal.json은 새 origin/main의 메타 전진과 제품 diff 0을 확인한다.\n`;
fs.writeFileSync(dir+'/HANDOFF.md',report+smokeNote,'utf8');
const body=`기록 저장에서 원격 응답이 기기 백업보다 앞서고 홈 입력/사진·XP 및 전문 창 닫기가 저장 확인 전에 진행되던 흐름을 고쳤습니다. 두 기록 caller만 자료+미확정 변경 목록을 기기에 쓰고 되읽은 뒤 입력/잠금을 풀며, 원격 결과는 별도 상태로 알립니다. 기기 실패는 입력 유지, 사진 partial은 미리보기와 같은 기록 ID 유지, 늦은 AI/응답은 원 계정·기록·세대에 귀속합니다.

선행 규범 PR #978은 e140db658f5b735f8b2d99fa45f541d16871994e로 실제 main 병합됐습니다. 이번 PR의 규범/ACTIVE/Court/gate/기준선·P0 원보고/기대값 수정은 0입니다. retained #TASK-ES-695, common TASK-CC-CELL-UNWIRE-RUN-309dca5d(root 중앙), 실행 leaf TASK-ES-695-A-01a13674입니다. REQ/PLAN 및 작업자 증거: docs/specs/REQ-TASK-ES-695-A-01a13674.md, docs/specs/PLAN-TASK-ES-695-A-01a13674.md, reports/TASK-ES-695-A-01a13674/HANDOFF.md.

검증: 새 changed-boundary component ${component.checks.length}개, 실제 ${browser.Chrome}의 게스트 제품 DOM/Storage에서 중복 제출·재실행·입력 잔류·사진 partial/같은 ID 재시도·전문 모달·늦은 AI 귀속. 공식 module-specs/module-guard·문법·diff 검사 종료코드를 raw와 함께 보존했습니다. local Chrome의 scoped quota/AI fault 증거이며 실계정 E2E가 아닙니다. DB 쓰기/외부 요청 완료/AI 비용 증가 0입니다.

범위: home-cockpit/device-save/checkin-capture/pro-record-save/index의 저장 상태·loader/modules 신고서. 무인자 saveProfile의 기존 await 의미는 유지하고 확인되지 않은 결과를 legacy-unconfirmed/device:null로 돌려줍니다. 전체 caller 전환·server CAS/삭제·여러탭/기기·XP 서버원장·운영/use/effect는 미완/null이며 저장 안전 전체 완료나 자체 통과를 주장하지 않습니다. 현행 과거 전량 전송 경로는 B/C 별도이며 이번 A 옵션은 새 목록 대상만 전송합니다. 제품 병합은 root 독립 검토 뒤 root 담당입니다.
`;
fs.writeFileSync(dir+'/PR-BODY.md',body,'utf8');console.log(JSON.stringify({componentChecks:component.checks.length,originalFiles:intake.originals.length,rawChecks:checks.commands.map(x=>x.exitCode),planReadback:fs.readFileSync(root+'/.claude/plan-K18-A.md','utf8')===plan,reportBytes:Buffer.byteLength(report)}));
