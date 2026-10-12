'use strict';
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'../../../..'),f=path.join(root,'reports/TASK-ES-695/claims.json');const c=JSON.parse(fs.readFileSync(f,'utf8'));
const ref='reports/TASK-ES-695/correction-2026-10-13/followup-backup-only/';
const note='\n유일 백업 보완 차수: 이전 직접 호출은 화면에도 이미 사진·피드백이 있어 기기 백업에만 있는 입력을 놓쳤다. 독립 확인이 c5d95027에서 재현한 정상 수동동기화/게스트이관의 손실은 '+ref+'independent-tool-original.cjs·independent-results-original.json으로 보존했다. 같은 도구·새 Chrome 직접 호출로 수정 전후를 쟀으며, 부가 칸은 로컬 쓰기 사본에만 되붙여 서버 payload/화면 객체는 유지했다. 명시적 비움·다른 값·본문 차이·다른 주인/휴지통/kept-only를 별도 부품 입력으로 확인했고 실제 삭제 UX는 미측정이다. 조건④ 전체 완료로 확대하지 않는다. '+ref+'summary.json·worker-measurements.md를 읽는다(작업자 측정, 판정 아님).';
for(const x of c.claims.filter(x=>['C1','C2','C3','C4'].includes(x.id))) if(!x.unverified.note.includes('유일 백업 보완 차수'))x.unverified.note+=note;
for(const [id,statement,p,equals] of [
['C27','유일 백업 입력의 두 실제 함수 격리 호출에서 사진·피드백·에너지·집중 보존이 true로 기록됐다(작업자 측정 기록; 조건④ 전체 완료의 판정이 아니다)','replay.photoFeedbackPreserved',true],
['C28','유일 백업 입력의 격리 호출 전후 서버 요청·화면 state·렌더 순서가 같다고 기록됐다(작업자 측정 기록)','replay.serverScreenRenderUnchanged',true],
['C29','본문 차이·명시적 비움·다른 주인·휴지통·보관 실패 등의 새 부품 단언 실패 수가 0으로 기록됐다(작업자 측정 기록; 실제 삭제 UX는 미측정)','variants.assertionsNotHeld',0]
])if(!c.claims.some(x=>x.id===id))c.claims.push({id,req:'R6',kind:'static',domain:'config',statement,touches:[ref+'summary.json'],check:{type:'jsonPath',file:ref+'summary.json',path:p,equals}});
c.followupBackupOnly={source:ref+'summary.json',independentNegativeSource:ref+'independent-results-original.json',originalInputGap:'earlier direct-call input already had metadata in screen array',fullConditionFourConfirmed:false,actualUseAvailable:null,longTermEffect:null};
fs.writeFileSync(f,JSON.stringify(c,null,2)+'\n','utf8');
const log=path.join(root,'dev_log.md'),body=fs.readFileSync(log,'utf8');if(!body.includes('TASK-ES-695 유일 백업 보완 차수'))fs.writeFileSync(log,body+'\n- 2026-10-13 TASK-ES-695 유일 백업 보완 차수: 기존 독립 확인이 c5d95027의 정상 syncServerRecords/migrateGuestDataToUser 손실을 추가 재현했다. 앞 직접 호출은 화면에도 사진이 있던 입력으로 유일 백업을 놓쳤다. setBackupFromSave가 로컬 쓰기 사본에만 같은 계정·id 기기 칸을 되붙이고 명시적 비움·새 값·본문 차이의 옛 자료는 보관한다. 다른 주인·휴지통·kept-only를 자동으로 되붙이지 않으며 지움 상태 읽기 실패는 중단한다. 원래 증거/의견과 C1~C22 기대값은 유지, 새 결과는 '+ref+'summary.json·worker-measurements.md. 조건④ 전체 완료·실운영 사용 가능·효과는 미확인. 운영 요청/push/병합 없음.\n','utf8');
console.log(JSON.stringify({claims:c.claims.length,ref,notesOnlyForC1toC4:true}));
