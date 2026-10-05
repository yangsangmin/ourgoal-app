// #TASK-ES-495 index.html 정리 — 기준 index.html 에 같은 지움을 다시 적용(앵커로 찾음, 못 찾으면 멈춤)
const fs=require('fs');const f=process.argv[2];let s=fs.readFileSync(f,'utf8');const L=s.split('\n');
const idx=(pred,what)=>{const i=L.findIndex(pred);if(i<0)throw new Error('없음: '+what);return i;};
const cutBlock=(startPred,endPred,what)=>{const a=idx(startPred,what);let b=a;while(!endPred(L[b],b,a)){b++;if(b>=L.length)throw new Error('끝 없음 '+what);}L.splice(a,b-a+1);};
// 마크업: 허브(주석~</div>), 응원 바(주석~</div>), 프로필 시트(주석~</div>) + 앞뒤 빈 줄 하나씩
const hub=idx(l=>l.includes('<!-- [#UIUX-49] [COMM-3X2-HUB]'),'hub');
let end=hub;while(!L[end].includes('<!-- [#UIUX-50] 프로필 바텀시트'))end++;while(L[end].trim()!=='</div>')end++;
if(L[end+1].trim()==='')end++;
const block=L.slice(hub,end+1).join('\n');if(!block.includes('commHubGrid')||!block.includes('commFloatingReactionDock')||!block.includes('commProfileBottomSheet')||block.includes('commBody'))throw new Error('마크업 구간 이상');
L.splice(hub,end-hub+1);
// 함수: switchCommSubTab ~ window.openInAppDmSheet
const a=idx(l=>/^  function switchCommSubTab\(/.test(l),'switchCommSubTab');const b=idx(l=>l.trim()==='window.openInAppDmSheet = openInAppDmSheet;','openInAppDmSheet window');
const fb=L.slice(a,b+1).join('\n');if(fb.split('function ').length-1!==3)throw new Error('함수 구간 이상');L.splice(a,b-a+1);
// 빠른 게시 띠
const q=idx(l=>l.includes("var quickPostBannerHtml = '<div class=\"comm-quick-strip\" style=\"display:none !important;\">'"),'quickPost');
let qe=q;while(L[qe].trim()!=="'</div>';")qe++;if(L[qe+1].trim()==='')qe++;L.splice(q,qe-q+1);
const u=idx(l=>l.includes('body.innerHTML = quickPostBannerHtml +'),'quickPost use');L[u]=L[u].replace('body.innerHTML = quickPostBannerHtml +','body.innerHTML =');
// 히트맵 카드 선언 속성
const h=idx(l=>l.includes('data-home-widget="homeGrassSummaryCard"'),'grass');L[h]=L[h].replace(' data-home-widget="homeGrassSummaryCard" data-widget-label="최근 히트맵 요약" data-widget-hint="최근 2주간의 기록 한눈에"','');
if(L[h].includes('data-home-widget'))throw new Error('grass attr');
// 챌린지 룸 태그·설명 글자
const t=idx(l=>l.includes('<script src="js/tabs/comm/challenge-room.js"></script>'),'tag');L[t]=L[t].replace('<script src="js/tabs/comm/challenge-room.js"></script>','');
const c=L.findIndex(l=>l.includes('js/tabs/comm/challenge-room.js · '));if(c>=0)L[c]=L[c].replace('js/tabs/comm/challenge-room.js · ','');
const m=L.findIndex(l=>l.includes('[#TASK-ES-444] openChallengeRoomModal'));if(m>=0)L.splice(m,1);
fs.writeFileSync(f,L.join('\n'),'utf8');
const out=L.join('\n');for(const k of ['switchCommSubTab','triggerFloatingReaction','openInAppDmSheet','commHubGrid','commFloatingReactionDock','commProfileBottomSheet','feedQuickPostBtn','quickPostBannerHtml','_commReactionCounts','challenge-room','openChallengeRoomModal','renderFeedList','renderCrewScreen','renderTeamScreen'])if(out.includes(k))throw new Error('흔적 남음: '+k);
console.log('ok');
