/**
 * OurGoal Peer Invite Text (소통 탭 — 함께 목표 초대 링크·남은 자리·초대 문구)
 *
 * 「[PEER INVITE] '함께 목표' 방 초대 루프」 묶음에 남아 있던 순수 함수 셋: 남은 자리 수(calculateRemainingSeats)·초대 링크 주소(buildPeerInviteUrl)·초대 문구(formatPeerInviteMessage) — 모두 smoke-test FN_NAMES(인라인 합본에서 찾는다). 복사·카카오 공유·초대 창은 js/tabs/comm/peer-invite.js.
 * #TASK-ES-526(인라인 3단계 Z4 이동 3차(표 CSV·웨어러블·목표 연동 · 음성 표 입력 · 테마별 기록 CSV · 함께 목표 초대 글자)): index.html 인라인 IIFE 의 구간(이전 전 11905~11912 · 11913~11914 · 11915~11926줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalCommKit = global.OurgoalCommKit || {};

  /* ---- 이전 전 index.html 11905~11912줄(#TASK-ES-526 생성기 표지) ---- */
  /* ============ [PEER INVITE] '함께 목표' 방 초대 루프 (웹 무설치 즉시 수락) ============ */
  /* [#TASK-ES-461] copyTextToClipboard · fallbackCopyText → js/tabs/comm/peer-invite.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  function calculateRemainingSeats(group, extraJoined){
    var max = group.maxMembers || (group.roomType === 'pair' ? 2 : (group.roomType === 'small' ? 5 : 50));
    var cur = (group.members || 0) + (extraJoined ? 1 : 0);
    return Math.max(0, max - cur);
  }
  /* ---- 이전 전 index.html 11913~11914줄(#TASK-ES-526 생성기 표지) ---- */

  function buildPeerInviteUrl(group, originPath){ var base = originPath || (window.location.origin + '/share'); var params = new URLSearchParams(); params.set('type', 'group'); params.set('id', group.id || ''); params.set('invite_group', group.id || ''); if(group.name) params.set('title', group.name); if(group.desc) params.set('desc', group.desc); if(group.name) params.set('room_name', group.name); if(group.maxMembers) params.set('max', String(group.maxMembers)); if(group.roomType) params.set('type', group.roomType); if(group.inviteCode) params.set('code', group.inviteCode); return base + '?' + params.toString(); }
  /* ---- 이전 전 index.html 11915~11926줄(#TASK-ES-526 생성기 표지) ---- */

  function formatPeerInviteMessage(group, senderName, inviteUrl){
    var name = senderName || '친구';
    var isPair = group.maxMembers === 2 || group.roomType === 'pair';
    var roomTypeLabel = isPair ? '1:1 페어 완주방' : ((group.maxMembers || 5) + '인 소그룹 완주방');
    return '[아워골] ' + name + '님이 「' + (group.name || '함께 목표 방') + '」에 초대했어요! 🏃\r\n\r\n' +
      '방 유형: ' + roomTypeLabel + '\r\n' +
      '목표: ' + (group.desc || '함께 목표 달성하기') + '\r\n' +
      '인증 규칙: ' + (group.rule || '매일/주간 기록 인증') + '\r\n\r\n' +
      '앱 설치 없이 웹에서 바로 초대 수락하고 함께 시작할 수 있어요!\r\n' +
      '참여 링크: ' + inviteUrl;
  }

  K.calculateRemainingSeats = calculateRemainingSeats;
  K.buildPeerInviteUrl = buildPeerInviteUrl;
  K.formatPeerInviteMessage = formatPeerInviteMessage;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
