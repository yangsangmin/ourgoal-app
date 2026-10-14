'use strict';
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'../../..');
const reason='동일 저장 책임의 단독 writer가 독립 반례와 실제 Court 실패를 최소 경계에서 교정한다. 독립 판정은 총괄에 분리한다.';
for(const file of ['intake.cjs','source-intake.json']){const name=__dirname+'/'+file;fs.writeFileSync(name,fs.readFileSync(name,'utf8').replace('同一保存writerが確定独立反例とCourt実失敗を最小境界で修正するため。独立判定はroot側に分離。',reason),'utf8');}
const name=root+'/reports/TASK-ES-695-A-01a13674/claims.json';const claims=JSON.parse(fs.readFileSync(name,'utf8'));
const c4=claims.claims.find(c=>c.id==='C4');
c4.statement='실제 로그인 계정의 원격 원장 응답·원계정/세대/returned row·timeout 미확정과 여러기기 경계는 운영 미확인이다. PC 게스트 저장과 local 부품의 0행/거절/늦은 세대 반례는 별도 실측 자료로 공개하며 이 도구 한계에 숨기지 않는다.';
c4.unverified.reason='tool-cannot-measure';c4.unverified.cannotBecause='needs-login';
c4.unverified.how=['법정은 외부 통신을 막아 실제 계정 로그인 및 원격 원장 확인을 할 수 없다. 별도 운영 예산과 담당을 먼저 확정한다','실제 로그인 계정과 원격 원장에서 0행·권한/인증 거절·늦은 세대·계정 전환을 각각 측정한다','PC에서 잴 수 있는 게스트 화면과 local 부품 반례는 correction-1 및 최초 component-check 실제 결과를 구분해 공개한다. 서버 CAS·경험치 원장·여러기기 중복 지급은 별도 미확인이다'];
fs.writeFileSync(name,JSON.stringify(claims,null,2)+'\n','utf8');
console.log(JSON.stringify({C4:c4.unverified,kind:c4.kind,id:c4.id}));
