'use strict';
// TASK-ES-568 작업자 제출 자료 작성. 제품 코드는 gen-inline-hard.js만 옮긴다.
const fs=require('fs');
const dir='reports/TASK-ES-568';
fs.mkdirSync(dir+'/scenarios',{recursive:true});
const write=(f,d)=>fs.writeFileSync(f,JSON.stringify(d,null,1)+'\n','utf8');
const click=selector=>({do:'click',selector});
const wait=ms=>({do:'wait',ms});
const text=(selector,text)=>({expect:'textContains',selector,text});
const visible=selector=>({expect:'visible',selector});
const boot=[{do:'setViewport',width:430,height:3200},{do:'goto',path:'/index.html'},{do:'waitFor',selector:'#btnLandingPreviewDirect'},click('#btnLandingPreviewDirect'),{do:'waitFor',selector:'.navbtn[data-tab="settings"]',timeoutMs:15000},wait(1200)];
const cases=[
 ['goals-shift-routines','교대근무 맞춤 설정·주기 창과 야간 루틴 적용',[
  click('.navbtn[data-tab="goals"]'),wait(800),click('#btnGoalsSubRoutine'),wait(800),click('#btnOpenShiftRoutineModal'),wait(500),visible('#shiftWorkCustomModalContent'),text('#shiftWorkCustomModalContent','교대근무 맞춤 루틴'),click('#btnShiftModalCycleLink'),wait(500),visible('#btnSaveShiftCycle'),text('#modalOverlay','교대근무 주기 순환'),click('#btnCancelShiftCycle'),wait(500),click('#btnShiftNight'),wait(800),text('#routineGoalsView','야간')
 ]],
 ['records-growth-chart','기록 성장 차트 SVG와 영역 필터 변경',[
  click('.navbtn[data-tab="records"]'),wait(800),visible('#recFeedColdstartRadarSlot'),text('#recFeedColdstartRadarSlot','3일 뒤 완성될 나의 6각 성장 차트'),visible('#recFeedColdstartRadarSlot svg'),text('#recThemeFilters','운동'),click('#recThemeFilters [data-filter="workout"]'),wait(700),visible('#recThemeFilters [data-filter="workout"].active')
 ]],
 ['home-quest-summary','오늘 목표 시트의 요약·퀘스트 및 할일 진입',[
  click('#homeCompassQuest'),wait(500),visible('#todayGlancePill'),text('#todayGlancePill','첫 기록 도전'),visible('#dailyQuestBarWrap'),text('#dailyQuestBarWrap','오늘의 3대 퀘스트'),click('#questItemMilestone'),wait(700),visible('#screen-goals.active')
 ]]
];
for(const [id,title,steps] of cases)write(dir+'/scenarios/'+id+'.json',{id,title,steps:boot.concat(steps,[{expect:'noExceptions'}])});
write('docs/design/harness/module-split/guest-steps-next568.json',{moved:['openShiftWorkCustomModal','openShiftCycleModal','applyShiftWorkRoutines','SHIFT_WORK_PRESETS'],steps:[
 {name:'home quest',tab:'home',click:'#homeCompassQuest',read:'#dailyQuestBarWrap',wait:1000},
 {name:'home summary',read:'#todayGlancePill',close:'#homeDetailClose',wait:500},
 {name:'shift custom',tab:'goals',gsub:'routine',click:'#btnOpenShiftRoutineModal',read:'#shiftWorkCustomModalContent',wait:1000},
 {name:'shift cycle',click:'#btnShiftModalCycleLink',read:'#modalOverlay',close:'#btnCancelShiftCycle',wait:1000},
 {name:'shift night',click:'#btnShiftNight',read:'#routineGoalsView',wait:1200},
 {name:'growth chart',tab:'records',read:'#recFeedColdstartRadarSlot',wait:1000},
 {name:'growth workout filter',click:'#recThemeFilters [data-filter="workout"]',read:'#recThemeFilters',wait:700}
]});
const req='docs/specs/REQ-TASK-ES-568-NEXT-SPLIT.md';
const cfg='docs/design/harness/module-split/inline-next568.json';
const requirements=[
 {id:'R1',text:'교대근무 루틴·맞춤 설정·주기 함수를 목표 세포로 동작 그대로 옮긴다.'},
 {id:'R2',text:'기록 성장차트·SVG·영역 필터 함수를 기록 세포로 동작 그대로 옮긴다.'},
 {id:'R3',text:'목표 시트에서 보이는 홈 오늘 요약·3대퀘스트 함수를 홈 세포로 동작 그대로 옮긴다.'},
 {id:'R4',text:'토큰·남은 글자 동일, 로드회귀0, 기준2회/작업1회 차이0, 전체시험 전후와 측정 스냅샷을 기록한다.'},
 {id:'R5',text:'신고서·설명·생성기 설정·8원칙 REQ·티켓·dev_log를 기록한다.'}
];
const files=['js/tabs/goals/shift-routines.js','js/tabs/records/growth-chart.js','js/tabs/home/quest-summary.js'];
const claims=cases.map(([id,title],i)=>({id:'C'+(i+1),req:'R'+(i+1),kind:'behavior',change:'new',domain:'ui-behavior',statement:title+' — 동작을 바꾸지 않고 옮긴 세포의 실제 게스트 화면 조작',touches:[files[i],'index.html'],scenario:'scenarios/'+id+'.json'}));
const add=(req,domain,statement,touches,check)=>claims.push({id:'C'+(claims.length+1),req,kind:'static',domain,statement,touches,check});
for(const [file,key,value] of [
 ['verify-inline-hard.json','ok',true],['verify-inline-hard.json','equivalent',true],['verify-inline-hard.json','restSame',true],['seam-order-check.json','ok',true],['module-load-probe.json','standaloneOk',true],['guest-compare.json','base1VsAfter.differing',0],['guest-compare.json','base1VsBase2.differing',0],['scenario-local.json','allPassedBoth',true],['test-compare.json','work.npmExit',0],['test-compare.json','base.npmExit',0],['test-compare.json','tests.exitDiff',[]]
]){const f=dir+'/'+file;add('R4','config',file+' '+key+' 측정 기록',[f],{file:f,type:'jsonPath',path:key,equals:value});}
for(const [f,t] of [
 ['docs/architecture/modules.json','"id": "goals/shift-routines"'],['docs/architecture/cell-descriptions.json','교대근무 루틴'],[cfg,'TASK-ES-568'],[req,'## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심'],['docs/rules/TICKETS.md','- #TASK-ES-568 | INFRA |'],['dev_log.md','TASK-ES-568'],['docs/design/harness/module-split/prepare-next568.js','작업자 제출 자료'],['docs/design/harness/module-split/guest-steps-next568.json','shift cycle'],['docs/design/harness/module-split/guest-steps-next568-reach.json','home quest sheet']
])add('R5','config','작업 설정·기록 확인',[f],{file:f,type:'codeContains',text:t});
for(const [file,key,value] of [['guest-reach.json','entered',true],['guest-reach2.json','entered',true],['guest-base1.json','entered',true],['guest-base2.json','entered',true],['guest-after.json','entered',true],['gen-inline-hard-meta.json','task','TASK-ES-568'],['snapshot-final.json','after.ratchet.oversizeJsFiles.count',0]]){const f=dir+'/'+file;add('R4','config','작업 측정 산출물 '+file,[f],{file:f,type:'jsonPath',path:key,equals:value});}
for(const [file,key,value] of [['test-probe.json','tests.exitDiff',[]],['archive-test-compare.json','work.npmExit',0],['tab-base1.json','deadClickMode','off'],['tab-base2.json','deadClickMode','off'],['tab-after.json','deadClickMode','off'],['tab-base-compare.json','differingValues',0],['tab-after-compare.json','differingValues',0]]){const f=dir+'/'+file;add('R4','config','기준·작업 측정 기록 '+file,[f],{file:f,type:'jsonPath',path:key,equals:value});}
write(dir+'/claims.json',{task:'TASK-ES-568',requirementsSource:req,requirements,claims});
const descFile='docs/architecture/cell-descriptions.json';
const desc=JSON.parse(fs.readFileSync(descFile,'utf8'));
for(const [id,name,does] of [
 ['goals/shift-routines','교대근무 루틴','교대근무 프리셋·맞춤 루틴 설정·자동 주기 설정'],
 ['records/growth-chart','기록 성장 차트','기록 성장 차트 SVG·라이프 밸런스·영역 필터'],
 ['home/quest-summary','오늘 요약·퀘스트','오늘 목표 시트에 오늘 기록 요약과 3대 퀘스트를 표시']
]){desc.names[id]=name;desc.cells[id]=does;}
fs.writeFileSync(descFile,JSON.stringify(desc,null,2)+'\n','utf8');
