'use strict';
// 원본·세포의 순수 분류 산출 비교(작업자 증거, 실제 UI 호출 수와 구분).
// 사용: node classifier-compare-569.js <기준> <작업> <out.json>
const fs=require('fs'),path=require('path'),vm=require('vm');
const [base,work,out]=process.argv.slice(2);
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const start=html.indexOf('  var RECORD_THEMES = {'),end=html.indexOf('  /* 온보딩 첫 기록용 체크인 저장',start);
if(start<0||end<0)throw Error('원본 분류 구간 없음');
const b={};vm.createContext(b);vm.runInContext(html.slice(start,end),b);
const w={};w.window=w;vm.createContext(w);vm.runInContext(fs.readFileSync(path.join(work,'js/tabs/records/theme-classifier.js'),'utf8'),w);
const inputs=[['',null],['오늘의 기록',null],['심리 우울 불안',null],['공부 독서 시험',null],['업무 매출 고객',null],['약속 친구 만남',null],['운동 러닝 식단',null],['책을 읽었다',null],['보고 완료',null],['친구를 만나기로 했다',null],['', 'health'],['','learning'],['','career'],['','relationship'],['', 'coding/algorithms'],['공부 운동',null],['책상 정리',null],['산책 프로젝트','work'],[null,null],['BOOK CODING','study']];
const rows=inputs.map(([text,category])=>{const x=b.classifyRecordTheme(text,category),y=w.OurgoalRecordsKit.classifyRecordTheme(text,category);return {text,category,base:x,work:y,same:JSON.stringify(x)===JSON.stringify(y)};});
const declarations=['RECORD_THEMES','THEME_KEYWORDS','THEME_REGEX_RULES','CATEGORY_THEME_MAP'];
// 정규식은 source/flags를 포함해 비교한다. JSON의 정규식 빈 객체로는 검증하지 않는다.
const serialize=x=>JSON.stringify(x,(_,v)=>Object.prototype.toString.call(v)==='[object RegExp]'?{source:v.source,flags:v.flags}:v);
const constants=declarations.map(n=>({name:n,same:serialize(b[n])===serialize(w.OurgoalRecordsKit[n])}));
const r={tool:'classifier-compare-569.js (pure function direct invocation, not UI call count)',cases:rows.length,rows,constants,equivalent:rows.every(x=>x.same)&&constants.every(x=>x.same)};
fs.writeFileSync(out,JSON.stringify(r,null,1)+'\n','utf8');console.log(JSON.stringify({cases:r.cases,equivalent:r.equivalent}));if(!r.equivalent)process.exitCode=1;
