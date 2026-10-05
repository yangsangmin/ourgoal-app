/**
 * OurGoal Challenge Room (소통 탭 — 소규모 챌린지 룸 창)
 *
 * #TASK-ES-444 (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —
 *   openChallengeRoomModal(이전 전 14511~14606줄, 구획 주석 포함 · 구획 「소규모 챌린지 룸 모달 (가상유저 요청 P8/P17)」)
 * 묶음의 함수 선언을 글자 그대로 옮겼다(묶음 전체가 함수뿐이면 구획 주석까지 통째로). 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>,
 * 같은 키트의 다른 세포 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓). 로드 중 바로 도는 문·최상위 변수는 index.html 원래 자리에 남았다.
 * index.html 은 IIFE 머리에서 이 키트의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: #TASK-ES-423. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};

  /* ============ 소규모 챌린지 룸 모달 (가상유저 요청 P8/P17) ============ */
  function openChallengeRoomModal(){
    var rooms = [
      { id: 'cpa2026', host: '정지호', goal: '2026 CPA 1차 합격 (주 50시간)', members: 4, max: 6, tag: '수험/CPA', dday: 'D-128', icon: '📖' },
      { id: 'devlaunch', host: '김도윤', goal: '1인 SaaS 사이드 프로젝트 출시', members: 5, max: 6, tag: '개발/출시', dday: 'D-45', icon: '💻' },
      { id: 'miracle6', host: '이지민', goal: '평일 미라클 모닝 6시 기상 & 러닝', members: 6, max: 6, tag: '습관/러닝', dday: 'D-21', icon: '🏃' },
      { id: 'fitbody', host: '박준서', goal: '주 4회 헬스 & 클린 식단 인증', members: 3, max: 6, tag: '운동/헬스', dday: 'D-60', icon: '🏋️' },
      { id: 'portfolio', host: '최수아', goal: '매일 1시간 UI/UX 포트폴리오 작업', members: 4, max: 6, tag: '디자인/취업', dday: 'D-30', icon: '🎨' },
      { id: 'adhdfocus', host: '윤다은', goal: 'ADHD 뽀모도로 25분 3회 집중 마일스톤', members: 5, max: 6, tag: '신경다양성/몰입', dday: 'D-14', icon: '⏱️' },
      { id: 'nightnurse', host: '송하준', goal: '3교대 간호사 심야 루틴 & 수면 케어', members: 3, max: 6, tag: '교대/건강', dday: 'D-50', icon: '🌙' },
      { id: 'triathlon', host: '서예진', goal: '철인 3종 완주 (수영·사이클·러닝)', members: 4, max: 6, tag: '트라이애슬론', dday: 'D-90', icon: '🚴' },
      { id: 'indiegame', host: '권태호', goal: 'Steam 인디게임 데모 빌드 출시', members: 2, max: 6, tag: '게임개발', dday: 'D-75', icon: '🎮' },
      { id: 'barista', host: '안소율', goal: '스페셜티 바리스타 자격증 취득', members: 4, max: 6, tag: '자격증/창업', dday: 'D-40', icon: '☕' }
    ];

    if(!L.state.profile.settings.challenges) L.state.profile.settings.challenges = [];
    var joinedIds = L.state.profile.settings.challenges;

    var listHtml = rooms.map(function(r){
      var isJoined = joinedIds.indexOf(r.id) !== -1;
      var isFull = r.members >= r.max && !isJoined;
      return '<div class="challenge-room-card" style="margin-bottom:10px;padding:12px;background:var(--card2);border:1px solid var(--rule);border-radius:12px;">'
        + '<div style="display:flex;justify-content:space-between;align-items:flex-start;">'
        + '  <div>'
        + '    <span style="font-size:0.75rem;padding:2px 6px;border-radius:6px;background:var(--surface-2);color:var(--ink);font-weight:700;">' + r.tag + '</span>'
        + '    <span style="font-size:0.74rem;color:var(--ink-sub);margin-left:4px;">' + r.dday + '</span>'
        + '    <h4 style="margin:4px 0 2px;font-size:0.92rem;color:var(--ink);">' + r.icon + ' ' + L.escapeHtml(r.goal) + '</h4>'
        + '    <div style="font-size:0.78rem;color:var(--ink-sub);">페이스메이커: <b>' + r.host + '</b> · 참여 ' + (isJoined ? r.members : r.members) + '/' + r.max + '명</div>'
        + '  </div>'
        + '  <div>'
        + (isJoined
            ? '<button class="btn btn-ghost btn-sm" data-leavechallenge="' + r.id + '" style="font-size:0.76rem;color:var(--brand-strong);">참여중 (퇴장)</button>'
            : (isFull
                ? '<button class="btn btn-ghost btn-sm" disabled style="font-size:0.76rem;opacity:0.5;">정원마감</button>'
                : '<button class="btn btn-primary btn-sm" data-joinchallenge="' + r.id + '" style="font-size:0.76rem;">참여하기</button>'))
        + '  </div>'
        + '</div>'
        + '</div>';
    }).join('');

    L.openModal(
      '<h3>소규모 챌린지 룸 (동료 페이스메이커)</h3>'
      + '<p class="faint" style="margin:-8px 0 14px;">느슨하지만 강력한 4~6인 몰입 그룹에서 매일 인증하고 상호 자극을 받아보세요.</p>'
      + '<div style="display:flex;gap:8px;margin-bottom:12px;">'
      + '  <button class="btn btn-ghost btn-sm" id="inviteFriendChallengeBtn" style="width:100%;border-radius:10px;">내 친구 초대 링크 복사하기</button>'
      + '</div>'
      + '<div style="max-height:55vh;overflow-y:auto;padding-right:2px;">'
      + listHtml
      + '</div>'
      + '<div class="modal-actions" style="margin-top:14px;">'
      + '  <button class="btn btn-ghost" id="challengeCloseBtn" type="button">닫기</button>'
      + '</div>',
      function(sheet){
        sheet.querySelector('#challengeCloseBtn').onclick = L.closeModal;
        var invBtn = sheet.querySelector('#inviteFriendChallengeBtn');
        if(invBtn){
          invBtn.onclick = function(){
            var link = window.location.origin + window.location.pathname + '#challenge?invite=' + (L.state.profile.id || 'ourgoal');
            if(navigator.clipboard && navigator.clipboard.writeText){
              navigator.clipboard.writeText(link).then(function(){
                L.toast('챌린지 초대 링크가 복사되었어요! 친구에게 공유해보세요.');
              });
            } else {
              prompt('아래 링크를 복사하여 친구에게 공유하세요:', link);
            }
          };
        }
        sheet.querySelectorAll('[data-joinchallenge]').forEach(function(b){
          b.onclick = async function(){
            var cid = b.dataset.joinchallenge;
            if(joinedIds.indexOf(cid) === -1){
              joinedIds.push(cid);
              await L.saveProfile();
              L.toast('챌린지 룸에 입장했어요! 오늘 체크인으로 동료들에게 자극을 주세요.');
              L.triggerHaptic(15);
              L.closeModal();
              openChallengeRoomModal();
            }
          };
        });
        sheet.querySelectorAll('[data-leavechallenge]').forEach(function(b){
          b.onclick = async function(){
            var cid = b.dataset.leavechallenge;
            var idx = joinedIds.indexOf(cid);
            if(idx !== -1){
              joinedIds.splice(idx, 1);
              await L.saveProfile();
              L.toast('챌린지 룸에서 퇴장했어요.');
              L.closeModal();
              openChallengeRoomModal();
            }
          };
        });
      }
    );
  }

  K.openChallengeRoomModal = openChallengeRoomModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
