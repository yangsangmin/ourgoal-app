'use strict';
const fs=require('node:fs'),path=require('node:path');
const dir=__dirname,changes=[];
for(const file of ['no-goal-category.json','post-failure-retention.json']){
 const p=path.join(dir,'scenarios',file),scenario=JSON.parse(fs.readFileSync(p,'utf8')),original=JSON.stringify(scenario.steps.filter(s=>s.expect));
 scenario.steps.splice(1,0,{do:'waitFor',selector:'#btnLandingPreviewDirect'},{do:'click',selector:'#btnLandingPreviewDirect'});
 if(JSON.stringify(scenario.steps.filter(s=>s.expect))!==original)throw Error('원 단언 변경');
 fs.writeFileSync(p,JSON.stringify(scenario,null,2)+'\n','utf8');changes.push({file,inserted:2,originalAssertionsUnchanged:true});
}
const p=path.join(dir,'claims.json'),claims=JSON.parse(fs.readFileSync(p,'utf8'));
for(const c of claims.claims){if(c.id==='C1'||c.id==='C2'){const previous=c.symptom;c.symptom+=2;changes.push({claim:c.id,oldSymptom:previous,newSymptom:c.symptom});}if(c.id==='C3'){c.unverified.reason='tool-cannot-measure';c.unverified.cannotBecause='needs-login';}}
const base=[{do:'goto',path:'/index.html'},{do:'waitFor',selector:'#btnLandingPreviewDirect'},{do:'click',selector:'#btnLandingPreviewDirect'},{do:'waitFor',selector:'#captureInput',timeoutMs:15000},{do:'click',selector:'.navbtn[data-tab="comm"]'},{do:'click',selector:'#btnCommPostFeed'},{do:'fill',selector:'#shareCaptionInput',value:'처음 준비한 게시 문구'},{do:'click',selector:'#shareConfirmBtn'},{expect:'textContains',selector:'#shareConfirmBtn',text:'같은 게시물 다시 시도',timeoutMs:15000}];
const scenarios=[{file:'frozen-caption-preview.json',id:'share-frozen-caption-preview',title:'실패 후 첫 입력이 잠기고 미리보기와 일치한다',steps:[...base,{expect:'attr',selector:'#shareCaptionInput',name:'disabled',equals:''},{do:'click',selector:'#sharePreviewBtn'},{expect:'textContains',selector:'#sharePreviewCardBody',text:'처음 준비한 게시 문구'},{expect:'textContains',selector:'#shareFeedSaveStatus',text:'처음 준비한 문구와 선택이 고정'},{expect:'noExceptions'}]},{file:'cancel-after-failure.json',id:'share-cancel-after-failure',title:'실패 뒤 원 취소 버튼이 실제 창을 닫는다',steps:[...base,{do:'click',selector:'#shareCancelBtn'},{expect:'notVisible',selector:'#modalOverlay'},{expect:'noExceptions'}]}];
for(const s of scenarios){fs.writeFileSync(path.join(dir,'scenarios',s.file),JSON.stringify({id:s.id,title:s.title,steps:s.steps},null,2)+'\n',{encoding:'utf8',flag:'wx'});}
claims.claims.push({id:'C4',req:'R2',kind:'behavior',change:'fix',symptom:9,domain:'ui-behavior',statement:'실패 뒤 첫 준비 문구가 편집 잠금과 미리보기에 같은 내용으로 남는다',touches:['js/tabs/records/share-feed-save.js'],scenario:'scenarios/frozen-caption-preview.json'},{id:'C5',req:'R2',kind:'behavior',change:'fix',symptom:9,domain:'ui-behavior',statement:'실패 뒤 기존 취소 버튼으로 게시 창을 닫을 수 있다',touches:['js/tabs/records/share-feed-save.js'],scenario:'scenarios/cancel-after-failure.json'});
fs.writeFileSync(p,JSON.stringify(claims,null,2)+'\n','utf8');fs.writeFileSync(path.join(dir,'court-correction-contract.json'),JSON.stringify({firstCourt:'0A7F8493',firstHead:'1e3789f41344a769d4258cede571d23b34abb9da',changes,c3StatementChanged:false,c3KindChanged:false,c3TouchesChanged:false,guestAssertionsRelabeledUnverified:false},null,2)+'\n',{encoding:'utf8',flag:'wx'});
