'use strict';
const fs=require('node:fs');
for(const p of ['01_OURGOAL_SUPREME_CONSTITUTION_FULL.md','docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md']){
 let s=fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
 s=s.replace('상민님의 명시적 "헌법 개정 승인"을 확인했으며, 아직 원격 main 에 병합되지 않아 미발효 상태다.','상민님의 명시적 "헌법 개정 승인"을 확인했다. 실제 병합 기록은 버전 대장을 참조한다.');
 s=s.replace('개정 초안 — DIR-006','개정안 — DIR-006').replace('한 문장 추가 초안.','한 문장 추가 개정안.');
 s=s.replace('**명시 개정 승인 확인·병합 전·미발효**','**명시 개정 승인 확인·main 병합 시 효력 발생**');
 s=s.replace('대표의 "헌법 개정 승인"은 실제 대화 원문으로 확인했으며, 해당 PR의 원격 main 병합은 아직 미확인.','대표의 "헌법 개정 승인"은 실제 대화 원문으로 확인했다. 효력은 해당 PR의 원격 main 병합 시 발생하며 실제 병합 기록은 버전 대장을 참조한다.');
 fs.writeFileSync(p,s,{encoding:'utf8'});
}
const p='docs/rules/CONSTITUTION_VERSIONS.md';let s=fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
s=s.replace('(커널 + 법령 전문 · 개정 초안)','(커널 + 법령 전문 · 개정안)').replace('(명시 승인·병합 전)','(명시 승인)').replace('후속의 순서 예외 추가 초안.','후속의 순서 예외 추가 개정안.');
s=s.replace('실제 병합 기록 없음·병합 전·미발효(efficacy=false). 공식 병합 기록은 실제 병합 뒤 총괄이 기입한다.','효력은 이 PR의 원격 main 병합 시 발생한다. 실제 병합 기록 기입 위치: 이 행의 승인 근거 칸(총괄이 병합 뒤 정확한 병합 커밋·시각·계정을 기입).');
fs.writeFileSync(p,s,{encoding:'utf8'});
