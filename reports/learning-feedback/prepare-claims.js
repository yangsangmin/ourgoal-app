'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),prefix='reports/learning-feedback/';
const read=name=>JSON.parse(fs.readFileSync(path.join(__dirname,name),'utf8'));
const hash=name=>crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,name))).digest('hex');
const measured=read('check-result.json');
const observations=Object.fromEntries(measured.results.map(r=>[r.name,{exitCode:r.exitCode??null,expected:r.expected??null,expectedMatched:r.matched}]));
const assertion={measurementOnly:true,productVerdict:null,effect:null,observations,source:{path:prefix+'check-result.json',sha256:hash('check-result.json')},legacySource:{path:prefix+'legacy-check-output.json',sha256:hash('legacy-check-output.json')}};
fs.writeFileSync(path.join(__dirname,'assertion-summary.json'),JSON.stringify(assertion,null,2)+'\n','utf8');
const rows=[
 ['R1','작업 중 confirmed failure를 기존 pending 수집과 다음 bootstrap에 연결한다.','failure-reaches-next-bootstrap','작업자 도구 단위 기록에 실패 수집 후 다음 브리프 연결 관측을 보존한다.'],
 ['R2','같은 원인 반복시 담당/방법 전환을 권고하며 자동 권한 확대와 새 규범은 만들지 않는다.','repeat-recommends-method-only','작업자 기록에 반복 원인 권고의 자동 재배정 false 관측을 보존한다.'],
 ['R3','변경 범위와 사전 의존/실행기 SHA를 대조하여 유효 증거 재사용 후보와 재측정 권고를 구분한다.','executor-change-rerun','작업자 기록에 실행기 SHA 변경시 재측정 권고 관측을 보존한다.'],
 ['R4','후속 효과는 출처 있는 측정만 연결하고 before/모델/토큰 출처가 없으면 null로 유지한다.','absent-model-token-observations-null','도구 단위 후속 기록의 모델·토큰 미측정 관측을 보존하며 실제 개선 효과를 주장하지 않는다.'],
 ['R5','매 보고에 최근 개선3건을 기존 events에서 읽기 전용 산출하고 새 건이 없으면 유지한다.','no-new-event-keeps-three','작업자 기록에 새 이벤트 없는 최근3건 재조회 동일 관측을 보존한다.'],
 ['R6','원시 특정 failureId/causeId에 없는 원인을 confirmed로 인정하지 않고 관측으로 구분한다.','invented-failure-cause-rejected','독립 반례를 복제한 CLI 기록에 만들어낸 원인과 실패 식별자 반려 관측을 보존한다.'],
 ['R7','등록되지 않은 checker와 실제 출처 없는 legacy 효과 samples를 반려한다.','unknown-required-checker-rejected','독립 반례를 복제한 CLI 기록에 등록되지 않은 필수 checker 반려 관측을 보존한다.'],
 ['R8','공식 claims 형식을 사용하고 측정 요약과 구분하며 제품E2E·Court·runtime 변경을 주장하지 않는다.',null,'공식 제출과 별개로 제품 판정·효과 null인 측정 요약 원문을 보존한다.']
];
const claims=rows.map(([req,text,observation,statement],i)=>({id:'LF'+(i+1),req,kind:'static',domain:'config',statement,touches:[prefix+(observation?'assertion-summary.json':'measurement-summary.json')],check:observation?{type:'jsonPath',file:prefix+'assertion-summary.json',path:'observations.'+observation+'.expectedMatched',equals:true}:{type:'jsonPath',file:prefix+'measurement-summary.json',path:'productVerdict',equals:null}}));
claims.push({id:'LF9',req:'R7',kind:'static',domain:'config',statement:'독립 반례를 복제한 CLI 기록에 증거 아닌 legacy 효과 samples 반려 관측을 보존한다.',touches:[prefix+'assertion-summary.json'],check:{type:'jsonPath',file:prefix+'assertion-summary.json',path:'observations.fabricated-effect-samples-rejected.expectedMatched',equals:true}});
claims.push({id:'LF10',req:'R8',kind:'static',domain:'config',statement:'실제 수정된 제출 파일에 공식 validateClaims를 실행한 형식 오류0 기록을 보존한다. 독립 제품 판정이 아니다.',touches:[prefix+'claims-format-check.json'],check:{type:'jsonPath',file:prefix+'claims-format-check.json',path:'schemaErrors',equals:[]}});
claims.push({id:'LF11',req:'R1',kind:'static',domain:'config',statement:'실제 제출 형식 실패의 pending 수집과 보완 기록이 다음 브리프에 연결된 측정값을 보존한다.',touches:[prefix+'submit-feedback-result.json'],check:{type:'jsonPath',file:prefix+'submit-feedback-result.json',path:'nextBootstrapLinked',equals:true}});
const doc={task:'OURGOAL-AGY-SPLIT-RUN-20261006',requirementsSource:'docs/specs/REQ-LEARNING-FEEDBACK.md',requirements:rows.map(([id,text])=>({id,text})),claims};
const errors=require(path.join(root,'court/claims')).validateClaims(doc);
if(errors.length)throw Error(errors.join('; '));
fs.writeFileSync(path.join(__dirname,'claims.json'),JSON.stringify(doc,null,2)+'\n','utf8');
fs.writeFileSync(path.join(__dirname,'claims-format-check.json'),JSON.stringify({measurementOnly:true,productVerdict:null,sourcePath:prefix+'claims.json',sourceSha256:hash('claims.json'),schemaErrors:require(path.join(root,'court/claims')).validateClaims(read('claims.json'))},null,2)+'\n','utf8');
console.log(JSON.stringify({schemaErrors:errors,requirements:doc.requirements.length,claims:doc.claims.length,productVerdict:null}));
