/**
 * OurGoal Manito Basics (소통 탭 — 마니또 이름·도장·상태)
 *
 * #TASK-ES-448 (인라인 스크립트 세포화 구역 P2): index.html 인라인 IIFE 에서 동작 그대로 옮겼다. 지도 묶음 G163.
 *   옮긴 선언(이전 전 줄): MANITO_ADJ(32683~32684) · MANITO_NOUN(32685~32685) · MANITO_EMOJI(32686~32686) · MANITO_WELCOME_STAMPS(32687~32693) · MANITO_STAMPS(32695~32703) · sendManitoWelcomeStamp(32707~32755) · hashStr(32756~32756) · manitoState(32757~32761) · manitoMajors(32762~32768) · genAnonName(32769~32771)
 * MANITO_ADJ·MANITO_NOUN·MANITO_EMOJI·genAnonName·hashStr = 마니또 익명 이름, MANITO_WELCOME_STAMPS·MANITO_STAMPS·sendManitoWelcomeStamp = 환영·응원 도장,
 * manitoState·manitoMajors = 마니또 상태·주 분야. window 노출·도장 쿨다운 초기화 문은 index.html 제자리에 남았다.
 * 최상위 선언을 앞 주석·구획 주석과 함께 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 같은 키트의 다른 세포 이름은 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 로드 중 바로 도는 문(window.X 노출·전역 이벤트 위임)과 시험지가 index.html 에서 글자로 읽는 함수는 index.html 제자리에 남겼다.
 * index.html 은 IIFE 맨 위에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져와 쓴다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: 인라인 세포화 1차 #TASK-ES-423 · 소통 탭 #TASK-ES-379. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};

  var MANITO_ADJ = ['새벽의','조용한','끈질긴','달리는','반짝이는','묵묵한','씩씩한','느긋한','집중하는','유쾌한'];

  var MANITO_NOUN = { health:'러너', study:'공부벌레', career:'빌더', hobby:'창작자', mind:'명상가', relation:'이웃' };

  var MANITO_EMOJI = { health:'🏃', study:'📖', career:'🚀', hobby:'🎨', mind:'🌙', relation:'🏡' };

  /* [#TASK-ES-230] 마니또 4종 웰컴 스탬프 팔레트 */
  var MANITO_WELCOME_STAMPS = [
    { id:'fire', icon:'🔥', label:'불꽃응원', msg:'오늘도 불태우는 중이네요, 끝까지 함께 달려요! 🔥' },
    { id:'luck', icon:'🍀', label:'행운부적', msg:'내일도 모든 일이 술술 풀릴 거예요, 행운을 가득 보내요! 🍀' },
    { id:'tea', icon:'☕', label:'따뜻한차', msg:'지친 하루 따뜻한 차 한 잔 마시고 힘내세요! ☕' },
    { id:'crown', icon:'👑', label:'완주응원', msg:'우리의 목표를 끝까지 완주할 당신을 응원해요! 👑' }
  ];

  var MANITO_STAMPS = [
    { id:'fire', icon:'🔥', label:'불꽃응원', msg:'오늘도 불태우는 중이네요, 끝까지 함께 달려요! 🔥' },
    { id:'luck', icon:'🍀', label:'행운부적', msg:'내일도 모든 일이 술술 풀릴 거예요, 행운을 가득 보내요! 🍀' },
    { id:'tea', icon:'☕', label:'따뜻한차', msg:'지친 하루 따뜻한 차 한 잔 마시고 힘내세요! ☕' },
    { id:'crown', icon:'👑', label:'완주응원', msg:'우리의 목표를 끝까지 완주할 당신을 응원해요! 👑' },
    { id:'clap', icon:'👏', label:'멋져요', msg:'꾸준함이 진짜 멋져요.' },
    { id:'seed', icon:'🌱', label:'자라요', msg:'작게라도 매일 쌓이는 게 보여요.' }
  ];

  async function sendManitoWelcomeStamp(pid, sid, btnElement, bodyContainer){
    var now = Date.now();
    var lastSent = (window.MANITO_STAMP_COOLDOWN && window.MANITO_STAMP_COOLDOWN[pid]) || 0;
    if(now - lastSent < 60000){
      var remainSec = Math.ceil((60000 - (now - lastSent)) / 1000);
      L.toast('잠시만요! ' + remainSec + '초 후에 다시 보낼 수 있어요 ⏳');
      return;
    }

    L.triggerHapticFeedback(15);
    if(btnElement){
      var r = btnElement.getBoundingClientRect();
      L.burstConfetti(r.left + r.width/2, r.top + r.height/2);
    } else {
      L.burstConfetti(window.innerWidth/2, window.innerHeight/3);
    }

    var ms = manitoState();
    var today = L.dateKey(L.nowISO());
    ms.sent.push({ to:pid, stamp:sid, date:today, at:L.nowISO() });
    window.MANITO_STAMP_COOLDOWN[pid] = now;
    await L.saveProfile();

    var myGoal = (L.state.profile && L.state.profile.goals) ? L.state.profile.goals.filter(function(g){ return !g.archivedAt; })[0] : null;
    var stampObj = MANITO_WELCOME_STAMPS.find(function(s){ return s.id===sid; }) || MANITO_STAMPS.find(function(s){ return s.id===sid; }) || { id:'fire', icon:'🔥', label:'불꽃응원', msg:'응원을 보냅니다' };

    var cheerPing = {
      id: 'mn_c_' + L.newId(),
      group_id: 'manito',
      sender_id: L.state.profile.id,
      sender_name: ms.anonName || '비밀 수호천사',
      sender_avatar: '🕊️',
      receiver_id: pid,
      target_type: 'manito_cheer',
      target_id: sid,
      target_title: stampObj.label,
      ping_type: 'welcome_cheer',
      message: myGoal ? ('"' + myGoal.title + '" ' + stampObj.msg) : stampObj.msg,
      status: 'sent',
      hidden: false,
      created_at: L.nowISO()
    };
    L.sb.from('team_pings').insert(cheerPing).then(function(res){
      if(res.error) console.warn('[ManitoCheer] Supabase insert warn:', res.error.message);
    });

    L.toast('나의 마니또에게 익명 응원이 전달되었습니다 🕊️');
    if(bodyContainer) L.renderCommManito(bodyContainer);
  }

  function hashStr(s){ var h=0; for(var i=0;i<s.length;i++){ h=(h*31+s.charCodeAt(i))|0; } return Math.abs(h); }

  function manitoState(){
    var s = L.state.profile.settings;
    if(!s.manito) s.manito = { joined:false, anonName:'', allowDm:false, sent:[], threads:{}, revealed:{}, seed: Math.floor(Math.random()*100000) };
    return s.manito;
  }

  function manitoMajors(){
    var ints = (L.state.profile.interests||[]).map(function(t){ return t.split('/')[0]; }).filter(function(k){ return L.TOPICS[k]; });
    var goalMajors = L.state.profile.goals.filter(function(g){ return !g.archivedAt && g.topic; }).map(function(g){ return g.topic.split('/')[0]; }).filter(function(k){ return L.TOPICS[k]; }); // [#TASK-ES-352] TOPICS 에 없는 주제(예: reading)는 화면이 깨지므로 뺀다
    var all = ints.concat(goalMajors);
    var seen = {}; all = all.filter(function(k){ if(seen[k]) return false; seen[k]=true; return true; });
    return all.length ? all : ['health','study','mind'];
  }

  function genAnonName(major, seed){
    return MANITO_ADJ[seed % MANITO_ADJ.length]+' '+(MANITO_NOUN[major]||'동료')+' #'+String(seed%900+100);
  }

  K.MANITO_ADJ = MANITO_ADJ;
  K.MANITO_NOUN = MANITO_NOUN;
  K.MANITO_EMOJI = MANITO_EMOJI;
  K.MANITO_WELCOME_STAMPS = MANITO_WELCOME_STAMPS;
  K.MANITO_STAMPS = MANITO_STAMPS;
  K.sendManitoWelcomeStamp = sendManitoWelcomeStamp;
  K.hashStr = hashStr;
  K.manitoState = manitoState;
  K.manitoMajors = manitoMajors;
  K.genAnonName = genAnonName;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
